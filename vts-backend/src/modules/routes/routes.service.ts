import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Route } from './route.entity'
import { CreateRouteDto } from './dto/create-route.dto'
import { UpdateRouteDto } from './dto/update-route.dto'
import { Vehicle } from '../vehicles/vehicle.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import {
  applyTenantScope,
  assertTenantAccess,
  mergeCollegeWhere,
  mergeRequestedCollegeWhere,
  requireCollegeScope,
} from '../../common/tenant/tenant-scope'

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async findAll(actor: AuthenticatedUser, collegeId?: string | null): Promise<Route[]> {
    return this.routeRepo.find({
      where: mergeRequestedCollegeWhere<Route>(actor, {}, collegeId),
      order: { createdAt: 'DESC' },
    })
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<Route> {
    const route = await this.routeRepo.findOne({ where: actor ? mergeCollegeWhere<Route>(actor, { id }) : { id } })
    if (!route) {
      throw new NotFoundException('Route not found')
    }
    return route
  }

  private async findByIdForWrite(id: string, actor: AuthenticatedUser): Promise<Route> {
    const route = await this.routeRepo.findOne({ where: { id } })
    if (!route) {
      throw new NotFoundException('Route not found')
    }

    assertTenantAccess(route.collegeId, actor)
    return route
  }

  async create(payload: CreateRouteDto, actor: AuthenticatedUser): Promise<Route> {
    const route = this.routeRepo.create({
      collegeId: requireCollegeScope(actor),
      name: payload.name,
      startStop: payload.startStop,
      endStop: payload.endStop,
      intermediateStops: payload.intermediateStops,
      stopsCount: 2 + payload.intermediateStops.length,
      status: 'idle',
    })

    return this.routeRepo.save(route)
  }

  async update(id: string, payload: UpdateRouteDto, actor: AuthenticatedUser): Promise<Route> {
    const route = await this.findByIdForWrite(id, actor)
    Object.assign(route, payload)

    route.stopsCount =
      (route.startStop ? 1 : 0) + (route.endStop ? 1 : 0) + (route.intermediateStops?.length ?? 0)

    const updated = await this.routeRepo.save(route)
    await this.refreshRouteStatus(updated.id, actor)
    return updated
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const route = await this.findByIdForWrite(id, actor)
    await this.routeRepo.remove(route)
  }

  async listVehicles(routeId: string, actor: AuthenticatedUser): Promise<Vehicle[]> {
    return this.vehicleRepo.find({ where: mergeCollegeWhere<Vehicle>(actor, { routeId }) })
  }

  async refreshRouteStatus(routeId: string, actor?: AuthenticatedUser): Promise<void> {
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
