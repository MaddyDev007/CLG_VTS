import { Injectable, Logger } from '@nestjs/common'

export type DeviceAckRecord = {
  status: string
  interval?: number
  ignitionOnInterval: number
  ignitionOffInterval: number
  timestamp: number
}

@Injectable()
export class DeviceAckService {
  private readonly logger = new Logger(DeviceAckService.name)
  private readonly ackMap = new Map<string, DeviceAckRecord>()
  private readonly pollIntervalMs = 500
  private readonly waitTimeoutMs = 10_000

  handleAck(topic: string, payload: string) {
    const imei = this.getImeiFromTopic(topic)
    if (!imei) {
      this.logger.warn(`Ignoring ACK on unexpected topic: ${topic}`)
      return
    }

    let parsed: { status?: unknown; interval?: unknown; ignitionOnInterval?: unknown; ignitionOffInterval?: unknown }
    try {
      parsed = JSON.parse(payload) as {
        status?: unknown
        interval?: unknown
        ignitionOnInterval?: unknown
        ignitionOffInterval?: unknown
      }
    } catch {
      this.logger.warn(`Ignoring malformed ACK payload for ${imei}: ${payload}`)
      return
    }

    const status = typeof parsed.status === 'string' ? parsed.status : 'unknown'
    const legacyInterval = typeof parsed.interval === 'number' ? parsed.interval : Number(parsed.interval)
    const ignitionOnInterval =
      typeof parsed.ignitionOnInterval === 'number' ? parsed.ignitionOnInterval : Number(parsed.ignitionOnInterval)
    const ignitionOffInterval =
      typeof parsed.ignitionOffInterval === 'number' ? parsed.ignitionOffInterval : Number(parsed.ignitionOffInterval)
    const resolvedIgnitionOnInterval = Number.isFinite(ignitionOnInterval) ? ignitionOnInterval : legacyInterval
    const resolvedIgnitionOffInterval = Number.isFinite(ignitionOffInterval) ? ignitionOffInterval : legacyInterval

    if (!Number.isFinite(resolvedIgnitionOnInterval) || !Number.isFinite(resolvedIgnitionOffInterval)) {
      this.logger.warn(`Ignoring ACK with invalid ignition intervals for ${imei}: ${payload}`)
      return
    }

    const ack = {
      status,
      interval: Number.isFinite(legacyInterval) ? legacyInterval : undefined,
      ignitionOnInterval: resolvedIgnitionOnInterval,
      ignitionOffInterval: resolvedIgnitionOffInterval,
      timestamp: Date.now(),
    }

    this.ackMap.set(imei, ack)
    this.logger.log(
      `ACK stored for ${imei}: status=${ack.status} ignitionOnInterval=${ack.ignitionOnInterval} ignitionOffInterval=${ack.ignitionOffInterval}`,
    )
  }

  async waitForAck(
    imei: string,
    intervals: { ignitionOnInterval: number; ignitionOffInterval: number },
    sentAt: number,
  ): Promise<DeviceAckRecord | null> {
    const timeoutAt = Date.now() + this.waitTimeoutMs

    while (Date.now() <= timeoutAt) {
      const ack = this.ackMap.get(imei)
      if (
        ack &&
        ack.timestamp >= sentAt &&
        ack.ignitionOnInterval === intervals.ignitionOnInterval &&
        ack.ignitionOffInterval === intervals.ignitionOffInterval
      ) {
        return ack
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs))
    }

    return null
  }

  private getImeiFromTopic(topic: string): string | null {
    const parts = topic.split('/')
    if (parts.length === 4 && parts[0] === 'vts' && parts[1] === 'devices' && parts[3] === 'ack') {
      return parts[2]
    }

    return null
  }
}
