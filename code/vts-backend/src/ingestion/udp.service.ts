import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createSocket, Socket } from 'dgram'
import { ParserService } from './parser.service'
import { TelemetryHandler } from '../mqtt/telemetry.handler'

@Injectable()
export class UdpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UdpService.name)
  private server: Socket | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly parserService: ParserService,
    private readonly telemetryHandler: TelemetryHandler,
  ) {}

  onModuleInit() {
    const port = this.configService.get<number>('UDP_PORT', 4001)
    this.server = createSocket('udp4')

    this.server.on('listening', () => {
      this.logger.log(`UDP ingestion listening on port ${port}`)
    })

    this.server.on('message', async (message, remote) => {
      const rawPayload = message.toString('utf8').trim()
      this.logger.debug(`udp_packet_received from=${remote.address}:${remote.port} bytes=${message.length}`)
      this.logger.debug(`UDP payload: ${rawPayload}`)

      try {
        const payload = this.parserService.parseTelemetry(message, 'udp')
        if (!payload) {
          return
        }

        await this.telemetryHandler.handleNormalizedTelemetry(payload)
      } catch (error) {
        const stack = error instanceof Error ? error.stack : undefined
        const messageText = error instanceof Error ? error.message : String(error)
        this.logger.error(
          `udp_packet_processing_failed from=${remote.address}:${remote.port} error="${messageText}"`,
          stack,
        )
      }
    })

    this.server.on('error', (error) => {
      this.logger.error(`UDP server error: ${error.message}`, error.stack)
    })

    this.server.bind(port)
  }

  onModuleDestroy() {
    if (!this.server) {
      return
    }

    this.server.close(() => {
      this.logger.log('UDP ingestion server closed')
    })
    this.server = null
  }
}
