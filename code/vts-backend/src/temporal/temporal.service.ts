import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Client, Connection } from '@temporalio/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name)
  private connection?: Connection
  private client?: Client
  private enabled = false
  private address?: string

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const enabledValue = this.configService.get<string>('TEMPORAL_ENABLED')?.trim().toLowerCase()
    const address = this.configService.get<string>('TEMPORAL_ADDRESS')?.trim()
    this.enabled = enabledValue === 'true'
    this.address = address || undefined

    if (!this.enabled) {
      this.logger.log('Temporal integration is disabled')
      return
    }

    if (!this.address) {
      this.logger.warn('Temporal integration enabled without TEMPORAL_ADDRESS; continuing without Temporal')
      this.enabled = false
      return
    }

    try {
      this.connection = await Connection.connect({ address: this.address })
      this.client = new Client({ connection: this.connection })
      this.logger.log(`Temporal connected: ${this.address}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Temporal connection failed: ${message}`)
      this.connection = undefined
      this.client = undefined
    }
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client not initialized')
    }
    return this.client
  }

  getStatus() {
    return {
      enabled: this.enabled,
      connected: Boolean(this.client),
      address: this.address ?? null,
    }
  }

  async onModuleDestroy() {
    await this.connection?.close()
  }
}
