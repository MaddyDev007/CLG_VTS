import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from './notification.entity'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { Route } from '../routes/route.entity'
import { Vehicle } from '../vehicles/vehicle.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { applyCollegeScope, mergeCollegeWhere } from '../../common/tenant/tenant-scope'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async findAll(actor: AuthenticatedUser): Promise<Notification[]> {
    const query = this.notificationRepo
      .createQueryBuilder('n')
      .leftJoin('geofences', 'g', 'g.id = n."geofenceId"')
      .addSelect('g.name', 'geofenceName')
      .orderBy('n.timestamp', 'DESC')

    applyCollegeScope(query, 'n', actor)

    const { entities, raw } = await query.getRawAndEntities()
    return entities.map((entity, index) => ({
      ...entity,
      geofenceName: raw[index]?.geofenceName ?? null,
    }))
  }

  async create(payload: CreateNotificationDto): Promise<Notification> {
    let routeName = payload.routeName ?? null
    let collegeId = payload.collegeId ?? null

    const vehicle = await this.vehicleRepo.findOne({ where: { id: payload.vehicleId } })
    if (vehicle) {
      collegeId = vehicle.collegeId
      if (!routeName && vehicle.routeId) {
        const route = await this.routeRepo.findOne({ where: { id: vehicle.routeId } })
        routeName = route?.name ?? null
      }
    }

    const notification = this.notificationRepo.create({
      ...payload,
      collegeId: collegeId ?? undefined,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      routeName,
      read: false,
    })
    return this.notificationRepo.save(notification)
  }

  async markAsRead(id: string, actor: AuthenticatedUser): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: mergeCollegeWhere<Notification>(actor, { id }) })
    if (!notification) {
      throw new NotFoundException('Notification not found')
    }
    notification.read = true
    return this.notificationRepo.save(notification)
  }

  async markAllAsRead(actor: AuthenticatedUser): Promise<void> {
    const query = this.notificationRepo.createQueryBuilder().update().set({ read: true })
    if (actor.role !== 'SUPER_ADMIN' && actor.collegeId) {
      query.where('"collegeId" = :collegeId', { collegeId: actor.collegeId })
    }
    await query.execute()
  }
}
