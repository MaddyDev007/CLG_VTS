import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TelemetryRecord } from './telemetry.entity'
import { TelemetryFilterDto } from './dto/telemetry-filter.dto'
import { Device } from '../devices/device.entity'
import { Vehicle } from '../vehicles/vehicle.entity'
import { CreateTelemetryDto } from './dto/create-telemetry.dto'
import { GeocoderService } from '../../common/services/geocoder.service'
import { computeVehicleStatus, getOfflineThresholdMs } from '../../common/utils/vehicleStatus'
import { GeofencesService } from '../geofences/geofences.service'
import { NotificationsService } from '../notifications/notifications.service'
import type { Geofence } from '../geofences/geofence.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { applyCollegeScope, mergeCollegeWhere } from '../../common/tenant/tenant-scope'

type LastKnownLocation = {
  lat: number
  lon: number
  address: string
}

const FALLBACK_ADDRESS = 'Unknown location'
const MOVEMENT_THRESHOLD_METERS = 100
const OFFLINE_THRESHOLD_MS = getOfflineThresholdMs()
const GEOFENCE_CACHE_MS = 30 * 1000

@Injectable()
export class TelemetryService {
  private readonly lastKnown = new Map<string, LastKnownLocation>()
  private readonly geofenceCache = new Map<string, { data: Geofence[]; loadedAt: number }>()

  constructor(
    @InjectRepository(TelemetryRecord) private readonly telemetryRepo: Repository<TelemetryRecord>,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
    private readonly geocoderService: GeocoderService,
    private readonly geofencesService: GeofencesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(actor: AuthenticatedUser, filters?: TelemetryFilterDto): Promise<TelemetryRecord[]> {
    const query = this.telemetryRepo.createQueryBuilder('t').orderBy('t.timestamp', 'DESC')
    applyCollegeScope(query, 't', actor)

    if (filters?.vehicleId) {
      query.andWhere('t.vehicleId = :vehicleId', { vehicleId: filters.vehicleId })
    }

    if (typeof filters?.ignition === 'boolean') {
      query.andWhere('t.ignition = :ignition', { ignition: filters.ignition })
    }

    if (filters?.startDate) {
      query.andWhere('t.timestamp >= :startDate', { startDate: filters.startDate })
    }

    if (filters?.endDate) {
      query.andWhere('t.timestamp <= :endDate', { endDate: filters.endDate })
    }

    return query.getMany()
  }

  async getByVehicle(vehicleId: string, actor: AuthenticatedUser): Promise<TelemetryRecord[]> {
    return this.list(actor, { vehicleId })
  }

  private distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const earthRadiusMeters = 6371000
    return earthRadiusMeters * c
  }

  private async getGeofences(collegeId: string): Promise<Geofence[]> {
    const now = Date.now()
    const cached = this.geofenceCache.get(collegeId)
    if (cached && now - cached.loadedAt < GEOFENCE_CACHE_MS) {
      return cached.data
    }

    const actor = {
      userId: 'system',
      role: 'COLLEGE_ADMIN' as const,
      name: 'system',
      collegeId,
      status: 'active' as const,
    }
    const data = await this.geofencesService.findAll(actor)
    this.geofenceCache.set(collegeId, { data, loadedAt: now })
    return data
  }

  private findCurrentGeofence(lat: number, lon: number, geofences: Geofence[]): Geofence | null {
    let match: Geofence | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const geofence of geofences) {
      const distanceMeters = this.distanceMeters(lat, lon, geofence.lat, geofence.lon)
      if (distanceMeters <= geofence.radius && distanceMeters < bestDistance) {
        bestDistance = distanceMeters
        match = geofence
      }
    }

    return match
  }

  private async resolveGeofenceInfo(
    record: Partial<TelemetryRecord>,
    resolvedLocation: string,
  ): Promise<{ geofenceId: string | null; geofenceName: string | null }> {
    if (!record.vehicleId || !record.vehicleName || !record.collegeId) {
      return { geofenceId: null, geofenceName: null }
    }

    if (typeof record.lat !== 'number' || typeof record.lon !== 'number' || !record.timestamp) {
      return { geofenceId: null, geofenceName: null }
    }

    if (!Number.isFinite(record.lat) || !Number.isFinite(record.lon)) {
      return { geofenceId: null, geofenceName: null }
    }

    const geofences = await this.getGeofences(record.collegeId)
    const match = this.findCurrentGeofence(record.lat, record.lon, geofences)

    const previous = await this.telemetryRepo.findOne({
      where: { vehicleId: record.vehicleId },
      order: { timestamp: 'DESC' },
    })

    const previousGeofenceId = previous?.geofenceId ?? null
    const previousGeofenceName = previous?.geofenceName ?? null
    const currentGeofenceId = match?.id ?? null
    const currentGeofenceName = match?.name ?? 'Not in any geofence'
    const resolveGeofenceLabel = (name?: string | null) => {
      const trimmed = name?.trim()
      if (!trimmed || trimmed === 'Not in any geofence') {
        return 'unknown geofence'
      }
      return trimmed
    }

    if (previousGeofenceId !== currentGeofenceId) {
      if (previousGeofenceId) {
        const exitName = resolveGeofenceLabel(previousGeofenceName)
        await this.notificationsService.create({
          type: 'geofence_exit',
          vehicleId: record.vehicleId,
          vehicleName: record.vehicleName,
          collegeId: record.collegeId,
          message: `Exiting ${exitName}`,
          location: resolvedLocation,
          geofenceId: previousGeofenceId,
          timestamp: record.timestamp.toISOString(),
        })
      }

      if (currentGeofenceId) {
        const entryName = resolveGeofenceLabel(match?.name ?? null)
        await this.notificationsService.create({
          type: 'geofence_enter',
          vehicleId: record.vehicleId,
          vehicleName: record.vehicleName,
          collegeId: record.collegeId,
          message: `Entering ${entryName}`,
          location: resolvedLocation,
          geofenceId: currentGeofenceId,
          timestamp: record.timestamp.toISOString(),
        })
      }
    }

    return {
      geofenceId: currentGeofenceId,
      geofenceName: currentGeofenceName,
    }
  }

  private async resolveAddress(
    vehicleId: string | undefined,
    lat: number | undefined,
    lon: number | undefined,
    existingAddress?: string | null,
  ): Promise<string> {
    if (existingAddress && existingAddress.trim().length > 0) {
      return existingAddress
    }

    if (!vehicleId || lat === undefined || lon === undefined) {
      return FALLBACK_ADDRESS
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return FALLBACK_ADDRESS
    }

    const lastKnown = this.lastKnown.get(vehicleId)
    if (lastKnown) {
      const distance = this.distanceMeters(lastKnown.lat, lastKnown.lon, lat, lon)
      if (distance < MOVEMENT_THRESHOLD_METERS && lastKnown.address.trim().length > 0) {
        return lastKnown.address
      }
    }

    let address = FALLBACK_ADDRESS
    try {
      address = await this.geocoderService.reverseGeocode(lat, lon)
    } catch {
      address = FALLBACK_ADDRESS
    }

    this.lastKnown.set(vehicleId, { lat, lon, address })
    return address
  }

  async create(record: Partial<TelemetryRecord>): Promise<TelemetryRecord> {
    const resolvedAddress = await this.resolveAddress(record.vehicleId, record.lat, record.lon, record.address)
    const hasProvidedGeofence = record.geofenceId !== undefined && record.geofenceName !== undefined
    const geofenceInfo = hasProvidedGeofence
      ? { geofenceId: record.geofenceId ?? null, geofenceName: record.geofenceName ?? null }
      : await this.resolveGeofenceInfo(record, resolvedAddress)
    const entity = this.telemetryRepo.create({
      ...record,
      address: resolvedAddress,
      geofenceId: geofenceInfo.geofenceId,
      geofenceName: geofenceInfo.geofenceName,
    })
    return this.telemetryRepo.save(entity)
  }

  async ingest(payload: CreateTelemetryDto): Promise<TelemetryRecord> {
    const device = await this.deviceRepo.findOne({ where: { deviceId: payload.deviceId } })
    if (!device || !device.assignedVehicleId) {
      throw new NotFoundException('Device not assigned to a vehicle')
    }

    const vehicle = await this.vehicleRepo.findOne({ where: { id: device.assignedVehicleId } })
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found')
    }

    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date()
    const speed = Number(payload.speed)
    const ignition = Boolean(payload.ignition)

    const baseRecord = {
      collegeId: vehicle.collegeId,
      vehicleId: vehicle.id,
      vehicleName: vehicle.vehicleName,
      deviceId: device.deviceId,
      timestamp,
      lat: Number(payload.lat),
      lon: Number(payload.lon),
      address: '',
      speed,
      ignition,
      battery: 0,
      signal: 0,
    }

    const resolvedAddress = await this.resolveAddress(baseRecord.vehicleId, baseRecord.lat, baseRecord.lon, baseRecord.address)
    const geofenceInfo = await this.resolveGeofenceInfo(baseRecord, resolvedAddress)

    const record = await this.create({
      ...baseRecord,
      address: resolvedAddress,
      geofenceId: geofenceInfo.geofenceId,
      geofenceName: geofenceInfo.geofenceName,
    })

    vehicle.speed = speed
    vehicle.lat = record.lat
    vehicle.lon = record.lon
    vehicle.address = record.address
    vehicle.lastSeen = record.timestamp
    vehicle.geofenceId = geofenceInfo.geofenceId
    vehicle.geofenceName = geofenceInfo.geofenceName
    vehicle.status = computeVehicleStatus(
      {
        timestamp: record.timestamp,
        speed,
        ignition,
        previousStatus: vehicle.status,
      },
      { offlineThresholdMs: OFFLINE_THRESHOLD_MS },
    )
    await this.vehicleRepo.save(vehicle)

    return record
  }
}
