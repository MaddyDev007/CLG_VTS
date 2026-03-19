import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
@WebSocketGateway({ namespace: '/telemetry', cors: { origin: '*' } })
export class TelemetryGateway {
  @WebSocketServer()
  server!: Server

  broadcastTelemetry(payload: unknown) {
    this.server.emit('vehicle-update', payload)
  }
}
