import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Server, Socket, createServer } from 'net'
import { ParserService } from './parser.service'
import { TelemetryService } from '../modules/telemetry/telemetry.service'

@Injectable()
export class TcpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TcpService.name)
  private server: Server | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly parserService: ParserService,
    private readonly telemetryService: TelemetryService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('TCP_HOST', '0.0.0.0')
    const port = this.configService.get<number>('TCP_PORT', 4002)

    this.server = createServer((socket) => {
      const clientLabel = this.getClientLabel(socket)
      let buffer = ''

      this.logger.log(`TCP client connected ${clientLabel}`)

      socket.on('data', async (chunk) => {
        buffer += chunk.toString('utf8')
        this.logger.debug(`tcp_packet_received client=${clientLabel} bytes=${chunk.length}`)

        const frames = this.extractFrames(buffer)
        buffer = frames.remaining

        for (const frame of frames.messages) {
          try {
            const payload = this.parserService.parseTelemetry(frame, 'tcp')
            if (!payload) {
              continue
            }

            await this.telemetryService.processTelemetry(payload)
          } catch (error) {
            const stack = error instanceof Error ? error.stack : undefined
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`tcp_packet_processing_failed client=${clientLabel} error="${message}"`, stack)
          }
        }
      })

      socket.on('close', () => {
        this.logger.log(`TCP client disconnected ${clientLabel}`)
      })

      socket.on('end', () => {
        this.logger.debug(`TCP client ended ${clientLabel}`)
      })

      socket.on('error', (error) => {
        this.logger.error(`TCP client error client=${clientLabel} error="${error.message}"`, error.stack)
      })
    })

    this.server.on('error', (error) => {
      this.logger.error(`TCP server error: ${error.message}`, error.stack)
    })

    this.server.listen(port, host, () => {
      this.logger.log(`TCP ingestion listening on ${host}:${port}`)
    })
  }

  onModuleDestroy() {
    if (!this.server) {
      return
    }

    this.server.close(() => {
      this.logger.log('TCP ingestion server closed')
    })
    this.server = null
  }

  private extractFrames(buffer: string): { messages: string[]; remaining: string } {
    const normalized = buffer.replace(/\r\n/g, '\n')

    if (normalized.includes('\n')) {
      const parts = normalized.split('\n')
      const remaining = parts.pop() ?? ''
      const messages = parts.map((part) => part.trim()).filter((part) => part.length > 0)
      return { messages, remaining }
    }

    const trimmed = normalized.trim()
    if (!trimmed) {
      return { messages: [], remaining: '' }
    }

    try {
      JSON.parse(trimmed)
      return { messages: [trimmed], remaining: '' }
    } catch {
      return { messages: [], remaining: normalized }
    }
  }

  private getClientLabel(socket: Socket): string {
    return `${socket.remoteAddress ?? 'unknown'}:${socket.remotePort ?? 'unknown'}`
  }
}
