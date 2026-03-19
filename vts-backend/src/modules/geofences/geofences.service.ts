import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Geofence } from './geofence.entity'
import { CreateGeofenceDto } from './dto/create-geofence.dto'
import { UpdateGeofenceDto } from './dto/update-geofence.dto'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { assertTenantAccess, mergeCollegeWhere, requireCollegeScope } from '../../common/tenant/tenant-scope'

@Injectable()
export class GeofencesService {
  constructor(@InjectRepository(Geofence) private readonly geofenceRepo: Repository<Geofence>) {}

  async findAll(actor?: AuthenticatedUser): Promise<Geofence[]> {
    return this.geofenceRepo.find({
      where: actor ? mergeCollegeWhere<Geofence>(actor, {}) : {},
      order: { updatedAt: 'DESC' },
    })
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<Geofence> {
    const geofence = await this.geofenceRepo.findOne({ where: actor ? mergeCollegeWhere<Geofence>(actor, { id }) : { id } })
    if (!geofence) {
      throw new NotFoundException('Geofence not found')
    }
    return geofence
  }

  private async findByIdForWrite(id: string, actor: AuthenticatedUser): Promise<Geofence> {
    const geofence = await this.geofenceRepo.findOne({ where: { id } })
    if (!geofence) {
      throw new NotFoundException('Geofence not found')
    }

    assertTenantAccess(geofence.collegeId, actor)
    return geofence
  }

  async create(payload: CreateGeofenceDto, actor: AuthenticatedUser): Promise<Geofence> {
    const geofence = this.geofenceRepo.create({
      collegeId: requireCollegeScope(actor),
      name: payload.name,
      address: payload.address,
      lat: payload.lat,
      lon: payload.lon,
      radius: payload.radius,
      isStop: payload.isStop ?? false,
    })
    return this.geofenceRepo.save(geofence)
  }

  async update(id: string, payload: UpdateGeofenceDto, actor: AuthenticatedUser): Promise<Geofence> {
    const geofence = await this.findByIdForWrite(id, actor)
    Object.assign(geofence, payload)
    return this.geofenceRepo.save(geofence)
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const geofence = await this.findByIdForWrite(id, actor)
    await this.geofenceRepo.remove(geofence)
  }

  async listStops(actor: AuthenticatedUser): Promise<Array<{ id: string; name: string; lat: number; lon: number }>> {
    const stops = await this.geofenceRepo.find({ where: mergeCollegeWhere<Geofence>(actor, { isStop: true }) })
    return stops.map((item) => ({ id: item.id, name: item.name, lat: item.lat, lon: item.lon }))
  }
}
