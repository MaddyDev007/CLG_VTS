import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OverspeedEvent } from './overspeed-event.entity'
import { IdlingEvent } from './idling-event.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { TelemetryRecord } from '../telemetry/telemetry.entity'
import { StopEventsService } from './stop-events.service'
import { msToSeconds, secondsToMs } from '../../common/utils/time'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { applyCollegeScope, mergeCollegeWhere } from '../../common/tenant/tenant-scope'

@Injectable()
export class EventsService {
  private resolveLocation(location: string): string {
    const trimmed = location?.trim() ?? ''
    if (trimmed.length > 0) {
      return trimmed
    }
    return 'Unknown location'
  }

  constructor(
    @InjectRepository(OverspeedEvent) private readonly overspeedRepo: Repository<OverspeedEvent>,
    @InjectRepository(IdlingEvent) private readonly idlingRepo: Repository<IdlingEvent>,
    @InjectRepository(TelemetryRecord) private readonly telemetryRepo: Repository<TelemetryRecord>,
    private readonly notificationsService: NotificationsService,
    private readonly stopEventsService: StopEventsService,
  ) {}

  private mapOverspeed(event: OverspeedEvent) {
    return {
      ...event,
      duration: secondsToMs(event.duration),
    }
  }

  private mapIdling(event: IdlingEvent) {
    return {
      ...event,
      duration: secondsToMs(event.duration),
    }
  }

  async listOverspeed(
    actor: AuthenticatedUser,
    filters: { vehicleId?: string; speedLimit?: number; startDate?: string; endDate?: string },
  ) {
    const query = this.overspeedRepo.createQueryBuilder('e').orderBy('e.startTime', 'DESC')
    applyCollegeScope(query, 'e', actor)
    if (filters.vehicleId) query.andWhere('e.vehicleId = :vehicleId', { vehicleId: filters.vehicleId })
    if (filters.speedLimit) query.andWhere('e.speedLimit = :speedLimit', { speedLimit: filters.speedLimit })
    if (filters.startDate) query.andWhere('e.startTime >= :startDate', { startDate: filters.startDate })
    if (filters.endDate) query.andWhere('e.startTime <= :endDate', { endDate: filters.endDate })
    const events = await query.getMany()
    return events.map((event) => this.mapOverspeed(event))
  }

  async getOverspeed(id: string, actor: AuthenticatedUser) {
    const event = await this.overspeedRepo.findOne({ where: mergeCollegeWhere<OverspeedEvent>(actor, { id }) })
    if (!event) throw new NotFoundException('Overspeed event not found')
    return this.mapOverspeed(event)
  }

  async listIdling(
    actor: AuthenticatedUser,
    filters: { vehicleId?: string; minDuration?: number; startDate?: string; endDate?: string },
  ) {
    const query = this.idlingRepo.createQueryBuilder('e').orderBy('e.startTime', 'DESC')
    applyCollegeScope(query, 'e', actor)
    if (filters.vehicleId) query.andWhere('e.vehicleId = :vehicleId', { vehicleId: filters.vehicleId })
    if (typeof filters.minDuration === 'number') {
      query.andWhere('e.duration > :minDuration', { minDuration: msToSeconds(filters.minDuration) })
    }
    if (filters.startDate) query.andWhere('e.startTime >= :startDate', { startDate: filters.startDate })
    if (filters.endDate) query.andWhere('e.startTime <= :endDate', { endDate: filters.endDate })
    const events = await query.getMany()
    return events.map((event) => this.mapIdling(event))
  }

  async getIdling(id: string, actor: AuthenticatedUser) {
    const event = await this.idlingRepo.findOne({ where: mergeCollegeWhere<IdlingEvent>(actor, { id }) })
    if (!event) throw new NotFoundException('Idling event not found')
    return this.mapIdling(event)
  }

  async listStops(
    actor: AuthenticatedUser,
    filters: { vehicleId?: string; minDuration?: number; maxDuration?: number; startDate?: string; endDate?: string },
  ) {
    const stops = await this.stopEventsService.list(actor, {
      vehicleId: filters.vehicleId,
      fromDate: filters.startDate,
      toDate: filters.endDate,
      minDuration: typeof filters.minDuration === 'number' ? filters.minDuration : undefined,
      maxDuration: typeof filters.maxDuration === 'number' ? filters.maxDuration : undefined,
    })

    return stops.map((event) => ({
      id: event.id,
      vehicleId: event.vehicleId,
      vehicleName: event.vehicleName,
      tripId: '',
      duration: event.durationMs,
      startTime: event.startTime,
      endTime: event.endTime,
      location: this.resolveLocation(event.address ?? ''),
      lat: event.lat,
      lon: event.lon,
    }))
  }

  async getStop(id: string, actor: AuthenticatedUser) {
    const event = await this.stopEventsService.getById(actor, id)
    return {
      id: event.id,
      vehicleId: event.vehicleId,
      vehicleName: event.vehicleName,
      tripId: '',
      duration: event.durationMs,
      startTime: event.startTime,
      endTime: event.endTime,
      location: this.resolveLocation(event.address ?? ''),
      lat: event.lat,
      lon: event.lon,
    }
  }

  async getStopPlayback(id: string, actor: AuthenticatedUser) {
    return this.stopEventsService.getPlayback(actor, id)
  }

  async createOverspeed(payload: Omit<OverspeedEvent, 'id' | 'vehicle' | 'duration'> & { durationMs: number }) {
    const { durationMs, ...rest } = payload
    const event = this.overspeedRepo.create({
      ...rest,
      duration: msToSeconds(durationMs),
      location: this.resolveLocation(payload.location),
    })
    const saved = await this.overspeedRepo.save(event)
    await this.notificationsService.create({
      type: 'overspeed',
      vehicleId: saved.vehicleId,
      vehicleName: saved.vehicleName,
      collegeId: saved.collegeId,
      message: `${saved.vehicleName} overspeed detected`,
      location: saved.location,
      timestamp: saved.startTime.toISOString(),
    })
    return saved
  }

  async updateOverspeed(
    id: string,
    payload: Partial<Pick<OverspeedEvent, 'maxSpeed' | 'endTime' | 'lat' | 'lon' | 'location'> & { durationMs?: number }>,
  ) {
    const { durationMs, ...rest } = payload
    const next = {
      ...rest,
      duration: typeof durationMs === 'number' ? msToSeconds(durationMs) : undefined,
      location: rest.location !== undefined ? this.resolveLocation(rest.location) : undefined,
    }
    await this.overspeedRepo.update({ id }, next)
  }

  async getOverspeedPlayback(id: string, actor: AuthenticatedUser) {
    const event = await this.overspeedRepo.findOne({ where: mergeCollegeWhere<OverspeedEvent>(actor, { id }) })
    if (!event) throw new NotFoundException('Overspeed event not found')

    const query = this.telemetryRepo
      .createQueryBuilder('t')
      .select(['t.lat', 't.lon', 't.timestamp', 't.speed'])
      .where('t.vehicleId = :vehicleId', { vehicleId: event.vehicleId })
      .andWhere('t.timestamp BETWEEN :start AND :end', { start: event.startTime, end: event.endTime })
      .orderBy('t.timestamp', 'ASC')

    applyCollegeScope(query, 't', actor)
    return query.getMany()
  }

  async createIdling(payload: Omit<IdlingEvent, 'id' | 'vehicle' | 'duration'> & { durationMs: number }) {
    const { durationMs, ...rest } = payload
    const event = this.idlingRepo.create({
      ...rest,
      duration: msToSeconds(durationMs),
      location: this.resolveLocation(payload.location),
    })
    const saved = await this.idlingRepo.save(event)
    await this.notificationsService.create({
      type: 'idling',
      vehicleId: saved.vehicleId,
      vehicleName: saved.vehicleName,
      collegeId: saved.collegeId,
      message: `${saved.vehicleName} idling detected`,
      location: saved.location,
      timestamp: saved.startTime.toISOString(),
    })
    return saved
  }
}
