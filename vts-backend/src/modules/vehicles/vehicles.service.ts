import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vehicle, VehicleStatus } from './vehicle.entity'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { TelemetryRecord } from '../telemetry/telemetry.entity'
import { DevicesService } from '../devices/devices.service'
import { computeVehicleStatus, getOfflineThresholdMs } from '../../common/utils/vehicleStatus'
import { Route } from '../routes/route.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { applyTenantScope, assertTenantAccess, mergeCollegeWhere, requireCollegeScope } from '../../common/tenant/tenant-scope'

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name)
  private readonly offlineThresholdMs = getOfflineThresholdMs()

  constructor(
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(TelemetryRecord) private readonly telemetryRepo: Repository<TelemetryRecord>,
    @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
    private readonly devicesService: DevicesService,
  ) {}

  async findAll(actor: AuthenticatedUser): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepo.find({
      where: mergeCollegeWhere<Vehicle>(actor, {}),
      order: { updatedAt: 'DESC' },
    })
    return Promise.all(vehicles.map((vehicle) => this.applyTelemetryStatus(vehicle)))
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({
      where: actor ? mergeCollegeWhere<Vehicle>(actor, { id }) : { id },
    })

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found')
    }

    return this.applyTelemetryStatus(vehicle)
  }

  private async findByIdForWrite(id: string, actor: AuthenticatedUser): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } })
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found')
    }

    assertTenantAccess(vehicle.collegeId, actor)
    return vehicle
  }

  async create(payload: CreateVehicleDto, actor: AuthenticatedUser): Promise<Vehicle> {
    const next = this.vehicleRepo.create({
      collegeId: requireCollegeScope(actor),
      registrationNumber: `VTS-${Date.now()}`,
      vehicleName: payload.vehicleName,
      vehicleType: payload.vehicleType,
      deviceId: payload.deviceId ?? null,
      status: 'offline',
      speed: 0,
    })

    const vehicle = await this.vehicleRepo.save(next)

    if (payload.deviceId) {
      await this.devicesService.assign(payload.deviceId, vehicle.id, vehicle.vehicleName, actor)
    }

    return vehicle
  }

  async update(id: string, payload: UpdateVehicleDto, actor: AuthenticatedUser): Promise<Vehicle> {
    const vehicle = await this.findByIdForWrite(id, actor)
    const previousDeviceId = vehicle.deviceId
    const previousRouteId = vehicle.routeId

    if (payload.deviceId !== undefined) {
      const trimmed = payload.deviceId?.trim()
      vehicle.deviceId = trimmed ? trimmed : null
    }

    if (payload.vehicleName !== undefined) {
      vehicle.vehicleName = payload.vehicleName
    }

    if (payload.vehicleType !== undefined) {
      vehicle.vehicleType = payload.vehicleType
    }

    if (payload.speedLimit !== undefined) {
      vehicle.speedLimit = payload.speedLimit
    }

    if (payload.routeId !== undefined) {
      const trimmedRoute = payload.routeId?.trim()
      if (trimmedRoute) {
        const route = await this.routeRepo.findOne({ where: mergeCollegeWhere<Route>(actor, { id: trimmedRoute }) })
        if (!route) {
          throw new NotFoundException('Route not found')
        }
        vehicle.routeId = trimmedRoute
      } else {
        vehicle.routeId = null
      }
    }

    const updatedVehicle = await this.vehicleRepo.save(vehicle)

    if (payload.deviceId !== undefined) {
      if (previousDeviceId && previousDeviceId !== updatedVehicle.deviceId) {
        await this.devicesService.unassign(previousDeviceId, actor)
      }

      if (updatedVehicle.deviceId) {
        await this.devicesService.assign(updatedVehicle.deviceId, updatedVehicle.id, updatedVehicle.vehicleName, actor)
      }
    }

    if (payload.routeId !== undefined && previousRouteId !== updatedVehicle.routeId) {
      const timestamp = new Date().toISOString()
      if (updatedVehicle.routeId) {
        this.logger.debug(
          `vehicle_route_assigned vehicleId=${updatedVehicle.id} routeId=${updatedVehicle.routeId} timestamp=${timestamp}`,
        )
      } else {
        this.logger.debug(
          `vehicle_route_removed vehicleId=${updatedVehicle.id} routeId=${previousRouteId ?? 'null'} timestamp=${timestamp}`,
        )
      }

      await this.refreshRouteStatus(previousRouteId, actor)
      await this.refreshRouteStatus(updatedVehicle.routeId, actor)
    }

    return updatedVehicle
  }

  async updateFromTelemetry(vehicleId: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = await this.findById(vehicleId)
    Object.assign(vehicle, payload)
    return this.vehicleRepo.save(vehicle)
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const vehicle = await this.findByIdForWrite(id, actor)
    if (vehicle.deviceId) {
      await this.devicesService.unassign(vehicle.deviceId, actor)
    }
    await this.vehicleRepo.remove(vehicle)
  }

  async getStatusCounts(actor: AuthenticatedUser) {
    const vehicles = await this.findAll(actor)
    return vehicles.reduce(
      (acc, item) => {
        acc.total += 1
        acc[item.status] += 1
        return acc
      },
      { total: 0, moving: 0, idling: 0, stopped: 0, offline: 0 } as Record<string, number>,
    )
  }

  private async applyTelemetryStatus(vehicle: Vehicle): Promise<Vehicle> {
    const latest = await this.telemetryRepo.findOne({
      where: { vehicleId: vehicle.id },
      order: { timestamp: 'DESC' },
    })

    if (!latest) {
      return { ...vehicle, status: 'offline' as VehicleStatus }
    }

    const nextStatus = computeVehicleStatus(
      {
        timestamp: latest.timestamp,
        speed: latest.speed,
        ignition: latest.ignition,
        previousStatus: vehicle.status,
      },
      { offlineThresholdMs: this.offlineThresholdMs },
    )

    return { ...vehicle, status: nextStatus }
  }

  private async refreshRouteStatus(routeId: string | null | undefined, actor?: AuthenticatedUser): Promise<void> {
    if (!routeId) {
      return
    }

    const route = await this.routeRepo.findOne({
      where: actor ? mergeCollegeWhere<Route>(actor, { id: routeId }) : { id: routeId },
    })
    if (!route) {
      return
    }

    const query = this.vehicleRepo.createQueryBuilder('vehicle').where('vehicle.routeId = :routeId', { routeId })
    if (actor) {
      applyTenantScope(query, 'vehicle', actor)
    }

    const assignedCount = await query.getCount()
    const nextStatus = assignedCount > 0 ? 'active' : 'idle'
    if (route.status !== nextStatus) {
      route.status = nextStatus
      await this.routeRepo.save(route)
    }
  }
}
