import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Client, Connection } from '@temporalio/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private connection?: Connection
  private client?: Client

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const address = this.configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233')
    this.connection = await Connection.connect({ address })
    this.client = new Client({ connection: this.connection })
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client not initialized')
    }
    return this.client
  }

  async onModuleDestroy() {
    await this.connection?.close()
  }
}
