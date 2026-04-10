import { Injectable, Logger } from '@nestjs/common'
import { TelemetryService } from '../modules/telemetry/telemetry.service'
import { VehiclesService } from '../modules/vehicles/vehicles.service'
import { TelemetryGateway } from '../websocket/telemetry.gateway'
import { DevicesService } from '../modules/devices/devices.service'
import { TripsService } from '../modules/trips/trips.service'
import { EventsService } from '../modules/events/events.service'
import { computeVehicleStatus, getOfflineThresholdMs } from '../common/utils/vehicleStatus'
import { diffMs } from '../common/utils/time'
import { TelemetryStateService, type VehicleRuntimeState } from './telemetry-state.service'
import { CreateTelemetryDto } from '../modules/telemetry/dto/create-telemetry.dto'

type RawTelemetryPayload = {
  device_id?: string
  timestamp?: string
  lat: number
  lon: number
  speed_kmph: number
  heading?: number
  battery_mv: number
  signal_dbm: number
  ignition?: boolean
}

@Injectable()
export class TelemetryHandler {
  private readonly idleThresholdMs = 60 * 1000
  private readonly logger = new Logger(TelemetryHandler.name)
  private readonly offlineThresholdMs = getOfflineThresholdMs()

  constructor(
    private readonly telemetryService: TelemetryService,
    private readonly vehiclesService: VehiclesService,
    private readonly devicesService: DevicesService,
    private readonly tripsService: TripsService,
    private readonly eventsService: EventsService,
    private readonly telemetryGateway: TelemetryGateway,
    private readonly telemetryStateService: TelemetryStateService,
  ) {}

  async handle(topic: string, payload: string) {
    let parsedPayload: RawTelemetryPayload | null = null
    let deviceId: string | null = this.getDeviceIdFromTopic(topic)

    try {
      const data = JSON.parse(payload) as RawTelemetryPayload
      parsedPayload = data
      console.log(`[MQTT] message received topic=${topic}`)

      deviceId = data.device_id ?? deviceId
      if (!deviceId || !this.isValidPayload(data)) {
        return
      }

      await this.handleNormalizedTelemetry({
        deviceId,
        lat: Number(data.lat),
        lon: Number(data.lon),
        speed: Number(data.speed_kmph),
        battery: Number(data.battery_mv),
        signal: Number(data.signal_dbm),
        heading: typeof data.heading === 'number' ? Number(data.heading) : undefined,
        ignition: typeof data.ignition === 'boolean' ? data.ignition : true,
        ...(data.timestamp ? { timestamp: data.timestamp } : {}),
      })
    } catch (error) {
      this.logTelemetryFailure({
        error,
        deviceId,
        topic,
        payload: parsedPayload ?? payload,
        timestamp: new Date().toISOString(),
      })
      return
    }
  }

  async handleNormalizedTelemetry(payload: CreateTelemetryDto) {
    const device = await this.devicesService.findByUid(payload.deviceId)
    if (!device) {
      console.warn(`[TELEMETRY] Unknown device ${payload.deviceId}`)
      return
    }

    if (!device.assignedVehicleId) {
      return
    }

    const vehicle = await this.vehiclesService.findById(device.assignedVehicleId)
    const speed = Number(payload.speed)
    const ignition = Boolean(payload.ignition)

    const record = await this.telemetryService.processTelemetry(payload)

    console.log(
      `[TELEMETRY] ${vehicle.vehicleName} (${device.deviceId}) lat=${record.lat} lon=${record.lon} speed=${speed}`
    )

    const computedStatus = computeVehicleStatus(
      {
        timestamp: record.timestamp,
        speed,
        ignition,
        previousStatus: vehicle.status,
      },
      { offlineThresholdMs: this.offlineThresholdMs },
    )

    if (vehicle.status !== computedStatus) {
      this.logger.debug(
        `vehicle_status_updated vehicleId=${vehicle.id} previousStatus=${vehicle.status} newStatus=${computedStatus} timestamp=${record.timestamp.toISOString()}`,
      )
    }

    await this.vehiclesService.updateFromTelemetry(vehicle.id, {
      speed,
      lat: record.lat,
      lon: record.lon,
      address: record.address,
      lastSeen: record.timestamp,
      status: computedStatus,
      geofenceId: record.geofenceId ?? null,
      geofenceName: record.geofenceName ?? null,
    })

    await this.handleTripsAndEvents(
      vehicle.collegeId,
      vehicle.id,
      vehicle.vehicleName,
      record,
      speed,
      ignition,
      record.address,
      vehicle.speedLimit ?? 75,
    )

    this.telemetryGateway.broadcastTelemetry({
      vehicleId: vehicle.id,
      lat: record.lat,
      lng: record.lon,
      speed,
      status: computedStatus,
      timestamp: record.timestamp.toISOString(),
    })
  }

  private logTelemetryFailure(input: {
    error: unknown
    deviceId: string | null
    topic: string
    payload: unknown
    timestamp: string
  }) {
    const serializedError =
      input.error instanceof Error
        ? {
            name: input.error.name,
            message: input.error.message,
            stack: input.error.stack,
          }
        : {
            message: String(input.error),
          }

    this.logger.error(
      JSON.stringify({
        event: 'telemetry_handler_failure',
        error: serializedError,
        deviceId: input.deviceId,
        topic: input.topic,
        payload: input.payload,
        timestamp: input.timestamp,
      }),
    )
  }

  private getDeviceIdFromTopic(topic: string): string | null {
    const parts = topic.split('/')

    if (
      parts.length === 4 &&
      parts[0] === 'vts' &&
      parts[1] === 'devices' &&
      parts[3] === 'telemetry'
    ) {
      return parts[2]
    }

    return null
  }

  private isValidPayload(payload: RawTelemetryPayload): boolean {
    return (
      Number.isFinite(payload.lat) &&
      Number.isFinite(payload.lon) &&
      Number.isFinite(payload.speed_kmph) &&
      Number.isFinite(payload.battery_mv) &&
      Number.isFinite(payload.signal_dbm)
    )
  }

  private async handleTripsAndEvents(
    collegeId: string,
    vehicleId: string,
    vehicleName: string,
    record: { timestamp: Date; lat: number; lon: number; speed: number },
    speed: number,
    ignition: boolean,
    resolvedLocation: string,
    vehicleSpeedLimit: number,
  ) {
    const state = (await this.telemetryStateService.getVehicleState(vehicleId)) ?? {
      tripDistanceKm: 0,
    }

    const now = record.timestamp
    const tripTimeoutMs = 2 * 60 * 1000
    const tripCloseTimestamp = this.parseDate(state.tripCloseTimestamp)

    const finalizeTripState = () => {
      state.activeTripId = undefined
      state.tripStartTime = undefined
      state.tripDistanceKm = 0
      state.lastPoint = undefined
      state.tripPendingClose = false
      state.tripCloseTimestamp = null
    }

    const updateTripMetrics = async () => {
      if (!state.activeTripId || !state.tripStartTime) {
        return
      }

      const tripStartTime = this.parseDate(state.tripStartTime)
      if (!tripStartTime) {
        return
      }

      if (state.lastPoint) {
        const lastPointTimestamp = this.parseDate(state.lastPoint.timestamp)
        if (!lastPointTimestamp) {
          state.lastPoint = undefined
        }
      }

      if (state.lastPoint) {
        const segmentDistance = this.calculateDistanceKm(
          state.lastPoint.lat,
          state.lastPoint.lon,
          record.lat,
          record.lon,
        )
        const maxSegmentKm = 1
        const addThresholdKm = 0.5
        if (segmentDistance <= addThresholdKm) {
          state.tripDistanceKm += segmentDistance
        } else if (segmentDistance > maxSegmentKm) {
          // Skip GPS spikes between 5-second telemetry points.
        }
      }

      state.lastPoint = { lat: record.lat, lon: record.lon, timestamp: record.timestamp.toISOString() }

      const durationMs = diffMs(tripStartTime, now)
      await this.tripsService.updateTrip(state.activeTripId, {
        endTime: now,
        endLocation: resolvedLocation,
        distance: state.tripDistanceKm,
        durationMs,
      })

      await this.tripsService.addPlaybackPoint(state.activeTripId, {
        timestamp: record.timestamp,
        lat: record.lat,
        lon: record.lon,
        speed,
      })

      this.logger.debug(`trip_updated vehicleId=${vehicleId} tripId=${state.activeTripId} timestamp=${now.toISOString()}`)
    }

    if (ignition) {
      if (state.activeTripId && state.tripPendingClose && tripCloseTimestamp) {
        const gapMs = now.getTime() - tripCloseTimestamp.getTime()
        if (gapMs < tripTimeoutMs) {
          state.tripPendingClose = false
          state.tripCloseTimestamp = null
          this.logger.debug(`trip_resumed vehicleId=${vehicleId} tripId=${state.activeTripId} timestamp=${now.toISOString()}`)
        } else {
          finalizeTripState()
        }
      }

      if (!state.activeTripId) {
        const trip = await this.tripsService.startTrip({
          collegeId,
          vehicleId,
          vehicleName,
          startLocation: resolvedLocation,
          startTime: record.timestamp,
        })
        state.activeTripId = trip.id
        state.tripStartTime = record.timestamp.toISOString()
        state.tripDistanceKm = 0
        state.lastPoint = { lat: record.lat, lon: record.lon, timestamp: record.timestamp.toISOString() }
        state.tripPendingClose = false
        state.tripCloseTimestamp = null
        this.logger.debug(`trip_started vehicleId=${vehicleId} tripId=${trip.id} timestamp=${now.toISOString()}`)
      }

      await updateTripMetrics()
    } else if (state.activeTripId) {
      await updateTripMetrics()

      if (!state.tripPendingClose) {
        state.tripPendingClose = true
        state.tripCloseTimestamp = now.toISOString()
        this.logger.debug(`trip_ended vehicleId=${vehicleId} tripId=${state.activeTripId} timestamp=${now.toISOString()}`)
      } else if (tripCloseTimestamp) {
        const gapMs = now.getTime() - tripCloseTimestamp.getTime()
        if (gapMs >= tripTimeoutMs) {
          finalizeTripState()
        }
      }
    }

    const speedLimit = vehicleSpeedLimit || 75

    if (speed > speedLimit && !state.overspeedActive) {
      state.overspeedActive = true
      state.overspeedStartTime = record.timestamp.toISOString()
      state.overspeedMaxSpeed = speed
      state.overspeedSpeedLimit = speedLimit

      const created = await this.eventsService.createOverspeed({
        collegeId,
        vehicleId,
        vehicleName,
        tripId: state.activeTripId ?? '',
        maxSpeed: speed,
        speedLimit: speedLimit,
        durationMs: 0,
        startTime: record.timestamp,
        endTime: record.timestamp,
        location: resolvedLocation,
        lat: record.lat,
        lon: record.lon,
      })
      state.overspeedEventId = created.id
      this.logger.debug(
        `overspeed_started vehicleId=${vehicleId} speed=${speed} limit=${speedLimit}`,
      )
    } else if (speed > speedLimit && state.overspeedActive && state.overspeedEventId) {
      const startTime = this.parseDate(state.overspeedStartTime) ?? record.timestamp
      const maxSpeed = Math.max(state.overspeedMaxSpeed ?? speed, speed)
      const durationMs = diffMs(startTime, record.timestamp)

      state.overspeedMaxSpeed = maxSpeed
      await this.eventsService.updateOverspeed(state.overspeedEventId, {
        maxSpeed,
        endTime: record.timestamp,
        durationMs,
        lat: record.lat,
        lon: record.lon,
        location: resolvedLocation,
      })
      this.logger.debug(
        `overspeed_updated vehicleId=${vehicleId} speed=${speed} limit=${speedLimit}`,
      )
    }

    if (speed <= speedLimit && state.overspeedActive && state.overspeedEventId) {
      const startTime = this.parseDate(state.overspeedStartTime) ?? record.timestamp
      const durationMs = diffMs(startTime, record.timestamp)
      await this.eventsService.updateOverspeed(state.overspeedEventId, {
        endTime: record.timestamp,
        durationMs,
      })
      this.logger.debug(
        `overspeed_ended vehicleId=${vehicleId} durationMs=${durationMs}`,
      )
      state.overspeedActive = false
      state.overspeedEventId = null
      state.overspeedStartTime = null
      state.overspeedMaxSpeed = null
      state.overspeedSpeedLimit = null
    }

    if (ignition && speed === 0) {
      if (!state.idleStartAt) {
        state.idleStartAt = record.timestamp.toISOString()
        state.idleStartLocation = resolvedLocation
        state.idleStartLat = record.lat
        state.idleStartLon = record.lon
      }

      const idleStartAt = this.parseDate(state.idleStartAt)
      if (!state.idleActive && idleStartAt) {
        const idleDurationMs = record.timestamp.getTime() - idleStartAt.getTime()
        if (idleDurationMs >= this.idleThresholdMs) {
          const created = await this.eventsService.createIdling({
            collegeId,
            vehicleId,
            vehicleName,
            tripId: state.activeTripId ?? '',
            durationMs: idleDurationMs,
            startTime: idleStartAt,
            endTime: record.timestamp,
            location: state.idleStartLocation ?? resolvedLocation,
            lat: state.idleStartLat ?? record.lat,
            lon: state.idleStartLon ?? record.lon,
          })
          state.idleActive = true
          state.idleEventId = created.id
          this.logger.debug(
            `idle_started vehicleId=${vehicleId} eventId=${created.id} startTime=${idleStartAt.toISOString()} durationMs=${idleDurationMs}`,
          )
        }
      } else if (state.idleActive && idleStartAt && state.idleEventId) {
        const idleDurationMs = record.timestamp.getTime() - idleStartAt.getTime()
        await this.eventsService.updateIdling(state.idleEventId, {
          endTime: record.timestamp,
          durationMs: idleDurationMs,
        })
      }
    } else if (!state.idleActive) {
      state.idleStartAt = null
      state.idleEventId = null
      state.idleStartLocation = null
      state.idleStartLat = null
      state.idleStartLon = null
    }

    if (state.idleActive && (speed > 5 || !ignition)) {
      const startTime = this.parseDate(state.idleStartAt)
      const endTime = record.timestamp
      if (startTime) {
        const durationMs = diffMs(startTime, endTime)
        if (state.idleEventId) {
          await this.eventsService.updateIdling(state.idleEventId, {
            endTime,
            durationMs,
          })
        } else {
          const created = await this.eventsService.createIdling({
            collegeId,
            vehicleId,
            vehicleName,
            tripId: state.activeTripId ?? '',
            durationMs,
            startTime,
            endTime,
            location: state.idleStartLocation ?? resolvedLocation,
            lat: state.idleStartLat ?? record.lat,
            lon: state.idleStartLon ?? record.lon,
          })
          state.idleEventId = created.id
        }
        this.logger.debug(
          `idle_ended vehicleId=${vehicleId} startTime=${startTime.toISOString()} endTime=${endTime.toISOString()} durationMs=${durationMs}`,
        )
      }

      state.idleActive = false
      state.idleStartAt = null
      state.idleEventId = null
      state.idleStartLocation = null
      state.idleStartLat = null
      state.idleStartLon = null
    }

    await this.persistState(vehicleId, state)
  }

  private async persistState(vehicleId: string, state: VehicleRuntimeState) {
    if (
      !state.activeTripId &&
      !state.tripPendingClose &&
      !state.idleActive &&
      !state.idleStartAt &&
      !state.idleEventId &&
      !state.overspeedActive &&
      !state.overspeedEventId
    ) {
      await this.telemetryStateService.clearVehicleState(vehicleId)
      return
    }

    await this.telemetryStateService.setVehicleState(vehicleId, state)
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const earthRadiusKm = 6371
    return earthRadiusKm * c
  }

}
