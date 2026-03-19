import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Trip } from './trip.entity'
import { TripPlaybackPoint } from './trip-playback.entity'
import { diffMs, minutesToMs, msToMinutes } from '../../common/utils/time'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { mergeCollegeWhere } from '../../common/tenant/tenant-scope'

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TripPlaybackPoint) private readonly playbackRepo: Repository<TripPlaybackPoint>,
  ) {}

  private mapTrip(trip: Trip): Trip {
    return {
      ...trip,
      duration: minutesToMs(trip.duration),
    }
  }

  async findAll(actor: AuthenticatedUser): Promise<Trip[]> {
    const trips = await this.tripRepo.find({ where: mergeCollegeWhere<Trip>(actor, {}), order: { startTime: 'DESC' } })
    return trips.map((trip) => this.mapTrip(trip))
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<Trip> {
    const trip = await this.tripRepo.findOne({ where: actor ? mergeCollegeWhere<Trip>(actor, { id }) : { id } })
    if (!trip) {
      throw new NotFoundException('Trip not found')
    }
    return this.mapTrip(trip)
  }

  async findByVehicle(vehicleId: string, actor?: AuthenticatedUser): Promise<Trip[]> {
    const trips = await this.tripRepo.find({
      where: actor ? mergeCollegeWhere<Trip>(actor, { vehicleId }) : { vehicleId },
      order: { startTime: 'DESC' },
    })
    return trips.map((trip) => this.mapTrip(trip))
  }

  async getPlayback(tripId: string, actor?: AuthenticatedUser): Promise<TripPlaybackPoint[]> {
    const trip = await this.tripRepo.findOne({ where: actor ? mergeCollegeWhere<Trip>(actor, { id: tripId }) : { id: tripId } })
    if (!trip) {
      throw new NotFoundException('Trip not found')
    }
    return this.playbackRepo.find({ where: { trip }, order: { timestamp: 'ASC' } })
  }

  async getActiveTripByVehicle(vehicleId: string, actor?: AuthenticatedUser): Promise<Trip | null> {
    const trip = await this.tripRepo.findOne({
      where: actor ? mergeCollegeWhere<Trip>(actor, { vehicleId, endTime: null as never }) : { vehicleId, endTime: null as never },
    })
    return trip ? this.mapTrip(trip) : null
  }

  async startTrip(payload: {
    collegeId: string
    vehicleId: string
    vehicleName: string
    startLocation: string
    startTime: Date
  }): Promise<Trip> {
    const trip = this.tripRepo.create({
      collegeId: payload.collegeId,
      vehicleId: payload.vehicleId,
      vehicleName: payload.vehicleName,
      startLocation: payload.startLocation,
      endLocation: payload.startLocation,
      startTime: payload.startTime,
      endTime: payload.startTime,
      duration: 0,
      distance: 0,
    })

    return this.tripRepo.save(trip)
  }

  async updateTrip(tripId: string, payload: { endTime: Date; endLocation: string; distance: number; durationMs: number }) {
    await this.tripRepo.update(
      { id: tripId },
      {
        endTime: payload.endTime,
        endLocation: payload.endLocation,
        distance: payload.distance,
        duration: msToMinutes(payload.durationMs),
      },
    )
  }

  async endTrip(tripId: string, payload: { endTime: Date; endLocation: string; distance: number }, actor?: AuthenticatedUser) {
    const trip = await this.tripRepo.findOne({ where: actor ? mergeCollegeWhere<Trip>(actor, { id: tripId }) : { id: tripId } })
    if (!trip) {
      throw new NotFoundException('Trip not found')
    }
    trip.endTime = payload.endTime
    trip.endLocation = payload.endLocation
    trip.distance = payload.distance
    const durationMs = diffMs(trip.startTime, payload.endTime)
    trip.duration = msToMinutes(durationMs)
    const saved = await this.tripRepo.save(trip)
    return this.mapTrip(saved)
  }

  async addPlaybackPoint(tripId: string, point: { timestamp: Date; lat: number; lon: number; speed: number }) {
    const playback = this.playbackRepo.create({
      tripId,
      timestamp: point.timestamp,
      lat: point.lat,
      lon: point.lon,
      speed: point.speed,
    })
    return this.playbackRepo.save(playback)
  }
}
