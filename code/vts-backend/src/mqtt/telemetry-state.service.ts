import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

export type VehicleRuntimeState = {
  activeTripId?: string
  tripStartTime?: string
  tripDistanceKm: number
  lastPoint?: { lat: number; lon: number; timestamp: string }
  tripPendingClose?: boolean
  tripCloseTimestamp?: string | null
  idleStartAt?: string | null
  idleActive?: boolean
  idleEventId?: string | null
  idleStartLocation?: string | null
  idleStartLat?: number | null
  idleStartLon?: number | null
  overspeedActive?: boolean
  overspeedEventId?: string | null
  overspeedStartTime?: string | null
  overspeedMaxSpeed?: number | null
  overspeedSpeedLimit?: number | null
}

const DEFAULT_STATE_TTL_SECONDS = 7 * 24 * 60 * 60

@Injectable()
export class TelemetryStateService implements OnModuleDestroy {
  private readonly logger = new Logger(TelemetryStateService.name)
  private readonly redis?: Redis
  private readonly ttlSeconds: number
  private readonly storeMode: 'memory' | 'redis'
  private readonly memoryState = new Map<string, { value: VehicleRuntimeState; expiresAt: number }>()

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL')?.trim()
    const configuredStore =
      this.configService.get<string>('TELEMETRY_STATE_STORE')?.trim().toLowerCase() ?? 'memory'
    const configuredTtl = Number(this.configService.get<string>('REDIS_STATE_TTL_SECONDS'))
    this.ttlSeconds =
      Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : DEFAULT_STATE_TTL_SECONDS

    const shouldUseRedis = configuredStore === 'redis' && Boolean(redisUrl)
    this.storeMode = shouldUseRedis ? 'redis' : 'memory'

    if (!shouldUseRedis) {
      this.logger.warn('Telemetry state store is running in memory mode')
      return
    }

    this.redis = new Redis(redisUrl as string, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })

    this.redis.on('error', (error) => {
      this.logger.error(
        JSON.stringify({
          event: 'telemetry_state_redis_error',
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      )
    })
  }

  async onModuleDestroy() {
    await this.redis?.quit()
  }

  getStatus() {
    return {
      mode: this.storeMode,
      connected: this.redis ? this.redis.status === 'ready' : true,
    }
  }

  async getVehicleState(vehicleId: string): Promise<VehicleRuntimeState | null> {
    if (!this.redis) {
      const cached = this.memoryState.get(this.getVehicleKey(vehicleId))
      if (!cached) {
        return null
      }

      if (cached.expiresAt <= Date.now()) {
        this.memoryState.delete(this.getVehicleKey(vehicleId))
        return null
      }

      return cached.value
    }

    const raw = await this.redis.get(this.getVehicleKey(vehicleId))
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as VehicleRuntimeState
  }

  async setVehicleState(vehicleId: string, state: VehicleRuntimeState) {
    if (!this.redis) {
      this.memoryState.set(this.getVehicleKey(vehicleId), {
        value: state,
        expiresAt: Date.now() + this.ttlSeconds * 1000,
      })
      return
    }

    await this.redis.set(this.getVehicleKey(vehicleId), JSON.stringify(state), 'EX', this.ttlSeconds)
  }

  async clearVehicleState(vehicleId: string) {
    if (!this.redis) {
      this.memoryState.delete(this.getVehicleKey(vehicleId))
      return
    }

    await this.redis.del(this.getVehicleKey(vehicleId))
  }

  private getVehicleKey(vehicleId: string) {
    return `telemetry:state:${vehicleId}`
  }
}
