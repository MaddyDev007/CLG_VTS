import { Injectable, Logger } from '@nestjs/common'

export type DeviceAckRecord = {
  status: string
  interval: number
  timestamp: number
}

@Injectable()
export class DeviceAckService {
  private readonly logger = new Logger(DeviceAckService.name)
  private readonly ackMap = new Map<string, DeviceAckRecord>()
  private readonly pollIntervalMs = 500
  private readonly waitTimeoutMs = 10_000

  handleAck(topic: string, payload: string) {
    const deviceId = this.getDeviceIdFromTopic(topic)
    if (!deviceId) {
      this.logger.warn(`Ignoring ACK on unexpected topic: ${topic}`)
      return
    }

    let parsed: { status?: unknown; interval?: unknown }
    try {
      parsed = JSON.parse(payload) as { status?: unknown; interval?: unknown }
    } catch {
      this.logger.warn(`Ignoring malformed ACK payload for ${deviceId}: ${payload}`)
      return
    }

    const status = typeof parsed.status === 'string' ? parsed.status : 'unknown'
    const interval = typeof parsed.interval === 'number' ? parsed.interval : Number(parsed.interval)
    if (!Number.isFinite(interval)) {
      this.logger.warn(`Ignoring ACK with invalid interval for ${deviceId}: ${payload}`)
      return
    }

    const ack = {
      status,
      interval,
      timestamp: Date.now(),
    }

    this.ackMap.set(deviceId, ack)
    this.logger.log(`ACK stored for ${deviceId}: status=${ack.status} interval=${ack.interval}`)
  }

  async waitForAck(deviceId: string, interval: number, sentAt: number): Promise<DeviceAckRecord | null> {
    const timeoutAt = Date.now() + this.waitTimeoutMs

    while (Date.now() <= timeoutAt) {
      const ack = this.ackMap.get(deviceId)
      if (ack && ack.timestamp >= sentAt && ack.interval === interval) {
        return ack
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs))
    }

    return null
  }

  private getDeviceIdFromTopic(topic: string): string | null {
    const parts = topic.split('/')
    if (parts.length === 4 && parts[0] === 'vts' && parts[1] === 'devices' && parts[3] === 'ack') {
      return parts[2]
    }

    return null
  }
}
