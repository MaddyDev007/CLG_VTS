import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const REQUEST_TIMEOUT_MS = 3000
const CACHE_PRECISION = 5
const FALLBACK_LOCATION = 'Unknown location'
const REQUEST_INTERVAL_MS = 1000
const MAX_QUEUE_LENGTH = 20

@Injectable()
export class GeocoderService {
  private readonly logger = new Logger(GeocoderService.name)
  private readonly cache = new Map<string, string>()
  private readonly inFlight = new Map<string, Promise<string>>()
  private readonly queue: Array<{
    key: string
    lat: number
    lon: number
    resolve: (value: string) => void
  }> = []
  private processingQueue = false
  private lastRequestAt = 0

  private makeCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(CACHE_PRECISION)},${lon.toFixed(CACHE_PRECISION)}`
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) {
      return
    }

    this.processingQueue = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()
      if (!job) {
        continue
      }

      const cached = this.cache.get(job.key)
      if (cached) {
        this.logger.debug(`geocoder_cache_hit for ${job.key}`)
        job.resolve(cached)
        this.inFlight.delete(job.key)
        continue
      }

      const elapsed = Date.now() - this.lastRequestAt
      const waitMs = Math.max(0, REQUEST_INTERVAL_MS - elapsed)
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs))
      }

      this.lastRequestAt = Date.now()

      try {
        const response = await axios.get(NOMINATIM_REVERSE_URL, {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            'User-Agent': 'VTS-Backend/1.0 (reverse-geocoder)',
            Accept: 'application/json',
          },
          params: {
            lat: job.lat,
            lon: job.lon,
            format: 'json',
          },
        })

        const displayName = response?.data?.display_name
        const resolved =
          typeof displayName === 'string' && displayName.trim().length > 0
            ? displayName
            : FALLBACK_LOCATION

        this.cache.set(job.key, resolved)
        this.logger.debug(`geocoder_success for ${job.key}`)
        job.resolve(resolved)
      } catch {
        this.cache.set(job.key, FALLBACK_LOCATION)
        this.logger.warn(`geocoder_failed for ${job.key}`)
        job.resolve(FALLBACK_LOCATION)
      } finally {
        this.inFlight.delete(job.key)
      }
    }

    this.processingQueue = false
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return FALLBACK_LOCATION
    }

    const key = this.makeCacheKey(lat, lon)
    const cached = this.cache.get(key)
    if (cached) {
      this.logger.debug(`geocoder_cache_hit for ${key}`)
      return cached
    }

    const active = this.inFlight.get(key)
    if (active) {
      return active
    }

    if (this.queue.length >= MAX_QUEUE_LENGTH) {
      this.logger.warn(`geocoder_failed queue_full for ${key}`)
      return FALLBACK_LOCATION
    }

    const request = new Promise<string>((resolve) => {
      this.queue.push({ key, lat, lon, resolve })
      void this.processQueue()
    })

    this.inFlight.set(key, request)
    return request
  }
}
