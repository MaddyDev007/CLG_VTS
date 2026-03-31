import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

type VehicleUpdatePayload = {
  vehicleId: string
  lat: number
  lng: number
  speed: number
  status: string
  timestamp: string
}

type NotificationPayload = {
  id: string
  type: string
  vehicleId: string
  vehicleName: string
  message: string
  location: string
  geofenceId: string | null
  routeName: string | null
  timestamp: string
  read: boolean
}

@WebSocketGateway({ namespace: '/telemetry', cors: { origin: '*' } })
export class TelemetryGateway {
  @WebSocketServer()
  server!: Server

  broadcastTelemetry(payload: VehicleUpdatePayload) {
    this.server.emit('vehicle-update', payload)
  }

  broadcastNotification(payload: NotificationPayload) {
    this.server.emit('notification', payload)
  }
}
