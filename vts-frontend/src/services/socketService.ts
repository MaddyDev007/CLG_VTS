import { env } from '@utils/env'
import { io, type Socket } from 'socket.io-client'
import type { Notification } from '../types/notification'
import type { VehicleStatus } from '../types/vehicle'

export type VehicleSocketPayload = {
  vehicleId: string
  lat: number
  lng: number
  speed: number
  status: VehicleStatus
  timestamp: string
}

type NotificationSocketPayload = Notification

type RealtimeEventMap = {
  'vehicle-update': VehicleSocketPayload
  notification: NotificationSocketPayload
}

type EventName = keyof RealtimeEventMap
type EventHandler<TEvent extends EventName> = (payload: RealtimeEventMap[TEvent]) => void

class SocketService {
  private socket: Socket | null = null
  private subscriberCount = 0

  private normalizeSocketUrl(rawUrl: string): string {
    const normalizedBase = rawUrl.replace(/^ws:/i, 'http:').replace(/^wss:/i, 'https:')

    try {
      const url = new URL(normalizedBase)
      if (!url.pathname || url.pathname === '/') {
        url.pathname = '/telemetry'
      }
      return url.toString().replace(/\/$/, '')
    } catch {
      return normalizedBase
    }
  }

  private getSocketUrl(): string {
    if (env.wsUrl) {
      return this.normalizeSocketUrl(env.wsUrl)
    }

    if (env.apiBaseUrl) {
      return this.normalizeSocketUrl(`${env.apiBaseUrl}/telemetry`)
    }

    return 'http://localhost:3000/telemetry'
  }

  private acquireSocket(): Socket {
    if (!this.socket) {
      this.socket = io(this.getSocketUrl(), {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        timeout: 10000,
      })

      this.socket.on('connect_error', (error) => {
        console.error('[socket] connect_error', {
          message: error.message,
          url: this.getSocketUrl(),
          timestamp: new Date().toISOString(),
        })
      })
    }

    this.subscriberCount += 1
    return this.socket
  }

  private releaseSocket() {
    this.subscriberCount = Math.max(0, this.subscriberCount - 1)

    if (this.subscriberCount === 0 && this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
  }

  subscribe<TEvent extends EventName>(event: TEvent, handler: EventHandler<TEvent>) {
    const socket = this.acquireSocket()
    const listener = handler as (...args: unknown[]) => void
    socket.on(event, listener as never)

    return () => {
      socket.off(event, listener as never)
      this.releaseSocket()
    }
  }

  subscribeToVehicleUpdates(handler: EventHandler<'vehicle-update'>) {
    return this.subscribe('vehicle-update', handler)
  }

  subscribeToNotifications(handler: EventHandler<'notification'>) {
    return this.subscribe('notification', handler)
  }
}

export const socketService = new SocketService()
