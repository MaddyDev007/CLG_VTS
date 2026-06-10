import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Device } from './device.entity'
import { CreateDeviceDto } from './dto/create-device.dto'
import { UpdateDeviceDto } from './dto/update-device.dto'
import { Vehicle } from '../vehicles/vehicle.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import {
  assertTenantAccess,
  mergeCollegeWhere,
  mergeRequestedCollegeWhere,
  requireWritableCollegeScope,
} from '../../common/tenant/tenant-scope'

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async findAll(actor: AuthenticatedUser, collegeId?: string | null): Promise<Device[]> {
    return this.deviceRepo.find({
      where: mergeRequestedCollegeWhere<Device>(actor, {}, collegeId),
      order: { updatedAt: 'DESC' },
    })
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: actor ? mergeCollegeWhere<Device>(actor, { id }) : { id } })
    if (!device) {
      throw new NotFoundException('Device not found')
    }
    return device
  }

  async findByUid(deviceUid: string, actor?: AuthenticatedUser): Promise<Device> {
    const device = await this.deviceRepo.findOne({
      where: actor ? mergeCollegeWhere<Device>(actor, { deviceId: deviceUid }) : { deviceId: deviceUid },
    })
    if (!device) {
      throw new NotFoundException('Device not found')
    }
    return device
  }

  async findByTelemetryImei(imei: string): Promise<Device | null> {
    const trimmed = imei.trim()
    if (!trimmed) {
      return null
    }

    return this.deviceRepo.findOne({ where: { imei: trimmed } })
  }

  async findByImei(imei: string, actor?: AuthenticatedUser): Promise<Device> {
    const trimmed = imei.trim()
    const device = await this.deviceRepo.findOne({
      where: actor ? mergeCollegeWhere<Device>(actor, { imei: trimmed }) : { imei: trimmed },
    })
    if (!device) {
      throw new NotFoundException('Device not found')
    }

    return device
  }

  private async findByIdForWrite(id: string, actor: AuthenticatedUser): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id } })
    if (!device) {
      throw new NotFoundException('Device not found')
    }

    assertTenantAccess(device.collegeId, actor)
    return device
  }

  private async findByUidForWrite(deviceUid: string, actor: AuthenticatedUser): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { deviceId: deviceUid } })
    if (!device) {
      throw new NotFoundException('Device not found')
    }

    assertTenantAccess(device.collegeId, actor)
    return device
  }

  async create(payload: CreateDeviceDto, actor: AuthenticatedUser, collegeId?: string | null): Promise<Device> {
    const deviceId = payload.deviceId.trim()
    const imei = payload.imei.trim()

    const existingDevice = await this.deviceRepo.findOne({ where: { deviceId } })
    if (existingDevice) {
      throw new ConflictException(`Device ${deviceId} already exists`)
    }

    const existingImei = await this.deviceRepo.findOne({ where: { imei } })
    if (existingImei) {
      throw new ConflictException(`IMEI ${imei} already registered`)
    }

    const device = this.deviceRepo.create({
      collegeId: requireWritableCollegeScope(actor, collegeId),
      deviceId,
      imei,
      status: 'unassigned',
      assignedVehicleId: null,
      assignedVehicleName: null,
    })

    try {
      return await this.deviceRepo.save(device)
    } catch {
      throw new InternalServerErrorException('Failed to create device')
    }
  }

  async update(id: string, payload: UpdateDeviceDto, actor: AuthenticatedUser): Promise<Device> {
    const device = await this.findByIdForWrite(id, actor)
    Object.assign(device, payload)
    return this.deviceRepo.save(device)
  }

  async updateTelemetryInterval(deviceUid: string, telemetryIntervalMs: number, actor: AuthenticatedUser): Promise<Device> {
    const device = await this.findByUidForWrite(deviceUid, actor)
    device.telemetryIntervalMs = telemetryIntervalMs
    device.ignitionOnIntervalMs = telemetryIntervalMs
    device.ignitionOffIntervalMs = telemetryIntervalMs
    return this.deviceRepo.save(device)
  }

  async updateIgnitionIntervals(
    deviceUid: string,
    intervals: { ignitionOnIntervalMs: number; ignitionOffIntervalMs: number },
    actor: AuthenticatedUser,
  ): Promise<Device> {
    const device = await this.findByUidForWrite(deviceUid, actor)
    device.ignitionOnIntervalMs = intervals.ignitionOnIntervalMs
    device.ignitionOffIntervalMs = intervals.ignitionOffIntervalMs
    device.telemetryIntervalMs = intervals.ignitionOnIntervalMs
    return this.deviceRepo.save(device)
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const device = await this.findByIdForWrite(id, actor)
    if (device.status === 'assigned') {
      throw new Error('Device is assigned to a vehicle and cannot be deleted.')
    }
    await this.deviceRepo.remove(device)
  }

  async listUnassigned(actor: AuthenticatedUser, collegeId?: string | null): Promise<Device[]> {
    return this.deviceRepo.find({
      where: mergeRequestedCollegeWhere<Device>(actor, { status: 'unassigned' }, collegeId),
      order: { updatedAt: 'DESC' },
    })
  }

  async assign(deviceUid: string, vehicleId: string, vehicleName: string, actor?: AuthenticatedUser): Promise<Device> {
    const device = actor ? await this.findByUidForWrite(deviceUid, actor) : await this.findByUid(deviceUid)
    const vehicle = await this.vehicleRepo.findOne({
      where: actor ? mergeCollegeWhere<Vehicle>(actor, { id: vehicleId }) : { id: vehicleId },
    })
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found')
    }

    device.assignedVehicleId = vehicleId
    device.assignedVehicleName = vehicleName
    device.status = 'assigned'
    device.collegeId = vehicle.collegeId
    const saved = await this.deviceRepo.save(device)

    vehicle.deviceId = device.deviceId
    await this.vehicleRepo.save(vehicle)

    return saved
  }

  async unassign(deviceUid: string, actor?: AuthenticatedUser): Promise<Device> {
    const device = actor ? await this.findByUidForWrite(deviceUid, actor) : await this.findByUid(deviceUid)
    const vehicleId = device.assignedVehicleId
    device.assignedVehicleId = null
    device.assignedVehicleName = null
    device.status = 'unassigned'
    const saved = await this.deviceRepo.save(device)

    if (vehicleId) {
      const vehicle = await this.vehicleRepo.findOne({
        where: actor ? mergeCollegeWhere<Vehicle>(actor, { id: vehicleId }) : { id: vehicleId },
      })
      if (vehicle && vehicle.deviceId === device.deviceId) {
        vehicle.deviceId = null
        await this.vehicleRepo.save(vehicle)
      }
    }

    return saved
  }
}
