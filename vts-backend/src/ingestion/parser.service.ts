import { Injectable, Logger } from '@nestjs/common'
import { CreateTelemetryDto } from '../modules/telemetry/dto/create-telemetry.dto'

type RawTelemetryPayload = {
  deviceId?: unknown
  device_id?: unknown
  lat?: unknown
  lng?: unknown
  lon?: unknown
  speed?: unknown
  ignition?: unknown
  timestamp?: unknown
}

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name)

  parseTelemetry(data: Buffer | string, source: 'udp' | 'tcp'): CreateTelemetryDto | null {
    const raw = this.normalizeInput(data)
    if (!raw) {
      this.logger.warn(`ingestion_packet_ignored source=${source} reason=empty_payload`)
      return null
    }

    let parsed: RawTelemetryPayload
    try {
      parsed = JSON.parse(raw) as RawTelemetryPayload
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`ingestion_parse_failed source=${source} reason=invalid_json error="${message}"`)
      return null
    }

    const deviceId = this.asTrimmedString(parsed.deviceId ?? parsed.device_id)
    const lat = this.asNumber(parsed.lat)
    const lon = this.asNumber(parsed.lng ?? parsed.lon)
    const speed = this.asNumber(parsed.speed)
    const ignition = typeof parsed.ignition === 'boolean' ? parsed.ignition : true
    const timestamp = this.normalizeTimestamp(parsed.timestamp)

    if (!deviceId) {
      this.logger.warn(`ingestion_packet_ignored source=${source} reason=missing_device_id`)
      return null
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      this.logger.warn(`ingestion_packet_ignored source=${source} deviceId=${deviceId} reason=missing_coordinates`)
      return null
    }

    if (!Number.isFinite(speed)) {
      this.logger.warn(`ingestion_packet_ignored source=${source} deviceId=${deviceId} reason=invalid_speed`)
      return null
    }

    return {
      deviceId,
      lat,
      lon,
      speed,
      ignition,
      ...(timestamp ? { timestamp } : {}),
    }
  }

  private normalizeInput(data: Buffer | string): string {
    const value = Buffer.isBuffer(data) ? data.toString('utf8') : data
    return value.trim()
  }

  private asTrimmedString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private asNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return Number(value)
    }

    return Number.NaN
  }

  private normalizeTimestamp(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const millis = value < 1_000_000_000_000 ? value * 1000 : value
      const parsed = new Date(millis)
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) {
        return undefined
      }

      if (/^\d+$/.test(trimmed)) {
        const numeric = Number(trimmed)
        if (Number.isFinite(numeric)) {
          const millis = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric
          const parsed = new Date(millis)
          return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
        }
      }

      const parsed = new Date(trimmed)
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
    }

    return undefined
  }
}
