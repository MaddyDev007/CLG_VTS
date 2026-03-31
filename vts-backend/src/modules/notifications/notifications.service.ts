import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from './notification.entity'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { Route } from '../routes/route.entity'
import { Vehicle } from '../vehicles/vehicle.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { applyCollegeScope, mergeCollegeWhere } from '../../common/tenant/tenant-scope'
import { TelemetryGateway } from '../../websocket/telemetry.gateway'
import { ListNotificationsDto } from './dto/list-notifications.dto'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
    private readonly telemetryGateway: TelemetryGateway,
  ) {}

  async findAll(actor: AuthenticatedUser, filters: ListNotificationsDto): Promise<{
    data: Notification[]
    total: number
    page: number
    totalPages: number
  }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const query = this.notificationRepo
      .createQueryBuilder('n')
      .leftJoin('geofences', 'g', 'g.id = n."geofenceId"')
      .addSelect('g.name', 'geofenceName')
      .orderBy('n.timestamp', 'DESC')

    applyCollegeScope(query, 'n', actor)

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`
      query.andWhere(
        '(LOWER(n.vehicleName) LIKE :search OR LOWER(n.message) LIKE :search OR LOWER(n.location) LIKE :search OR LOWER(COALESCE(n.routeName, \'\')) LIKE :search)',
        { search },
      )
    }

    if (filters.type) {
      query.andWhere('n.type = :type', { type: filters.type })
    }

    if (filters.fromDate) {
      query.andWhere('n.timestamp >= :fromDate', { fromDate: filters.fromDate })
    }

    if (filters.toDate) {
      query.andWhere('n.timestamp <= :toDate', { toDate: filters.toDate })
    }

    query.skip((page - 1) * limit).take(limit)

    const total = await query.getCount()
    const { entities, raw } = await query.getRawAndEntities()
    const data = entities.map((entity, index) => ({
      ...entity,
      geofenceName: raw[index]?.geofenceName ?? null,
    }))

    return {
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
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
    const saved = await this.notificationRepo.save(notification)
    this.telemetryGateway.broadcastNotification({
      id: saved.id,
      type: saved.type,
      vehicleId: saved.vehicleId,
      vehicleName: saved.vehicleName,
      message: saved.message,
      location: saved.location,
      geofenceId: saved.geofenceId ?? null,
      routeName: saved.routeName ?? null,
      timestamp: saved.timestamp.toISOString(),
      read: saved.read,
    })
    return saved
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
