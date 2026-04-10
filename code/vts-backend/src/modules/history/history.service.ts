import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vehicle } from '../vehicles/vehicle.entity'
import { TelemetryRecord } from '../telemetry/telemetry.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { mergeCollegeWhere } from '../../common/tenant/tenant-scope'

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(TelemetryRecord) private readonly telemetryRepo: Repository<TelemetryRecord>,
  ) {}

  async listVehiclesHistory(actor: AuthenticatedUser) {
    const vehicles = await this.vehicleRepo.find({ where: mergeCollegeWhere<Vehicle>(actor, {}) })
    return Promise.all(
      vehicles.map(async (vehicle) => {
        const lastTelemetry = await this.telemetryRepo.findOne({
          where: { vehicleId: vehicle.id },
          order: { timestamp: 'DESC' },
        })

        return {
          vehicleId: vehicle.id,
          vehicleName: vehicle.vehicleName,
          lastLocation: lastTelemetry?.address ?? vehicle.address ?? 'Unknown',
          lastSeen: (lastTelemetry?.timestamp ?? vehicle.lastSeen ?? new Date()).toISOString(),
          totalDistance: 0,
          totalTrips: 0,
        }
      }),
    )
  }

  async getVehicleHistory(vehicleId: string, actor: AuthenticatedUser) {
    const vehicle = await this.vehicleRepo.findOne({ where: mergeCollegeWhere<Vehicle>(actor, { id: vehicleId }) })
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found')
    }

    const lastTelemetry = await this.telemetryRepo.findOne({
      where: mergeCollegeWhere<TelemetryRecord>(actor, { vehicleId }),
      order: { timestamp: 'DESC' },
    })

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.vehicleName,
      lastLocation: lastTelemetry?.address ?? vehicle.address ?? 'Unknown',
      lastSeen: (lastTelemetry?.timestamp ?? vehicle.lastSeen ?? new Date()).toISOString(),
      totalDistance: 0,
      totalTrips: 0,
    }
  }

  async getTimeline(vehicleId: string, actor: AuthenticatedUser) {
    return this.telemetryRepo.find({
      where: mergeCollegeWhere<TelemetryRecord>(actor, { vehicleId }),
      order: { timestamp: 'ASC' },
      take: 200,
    })
  }
}
