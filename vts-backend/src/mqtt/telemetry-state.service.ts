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
  private readonly redis: Redis
  private readonly ttlSeconds: number

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379'
    const configuredTtl = Number(this.configService.get<string>('REDIS_STATE_TTL_SECONDS'))
    this.ttlSeconds =
      Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : DEFAULT_STATE_TTL_SECONDS

    this.redis = new Redis(redisUrl, {
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
    await this.redis.quit()
  }

  async getVehicleState(vehicleId: string): Promise<VehicleRuntimeState | null> {
    const raw = await this.redis.get(this.getVehicleKey(vehicleId))
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as VehicleRuntimeState
  }

  async setVehicleState(vehicleId: string, state: VehicleRuntimeState) {
    await this.redis.set(this.getVehicleKey(vehicleId), JSON.stringify(state), 'EX', this.ttlSeconds)
  }

  async clearVehicleState(vehicleId: string) {
    await this.redis.del(this.getVehicleKey(vehicleId))
  }

  private getVehicleKey(vehicleId: string) {
    return `telemetry:state:${vehicleId}`
  }
}
