import { Module } from '@nestjs/common'
import { TelemetryModule } from '../modules/telemetry/telemetry.module'
import { ParserService } from './parser.service'
import { TcpService } from './tcp.service'
import { UdpService } from './udp.service'

@Module({
  imports: [TelemetryModule],
  providers: [ParserService, UdpService, TcpService],
})
export class IngestionModule {}
