import { Module } from '@nestjs/common'
import { MqttModule } from '../mqtt/mqtt.module'
import { ParserService } from './parser.service'
import { TcpService } from './tcp.service'
import { UdpService } from './udp.service'

@Module({
  imports: [MqttModule],
  providers: [ParserService, UdpService, TcpService],
})
export class IngestionModule {}
