import type { StopEvent } from '../types/events'
import type { TripPlaybackPoint } from '../types/trip'
import { apiClient } from '../api/apiClient'
import { fetchStops, type Stop } from './geofenceService'

export type StopEventFilters = {
  vehicleId?: string
  minDuration?: number
  startDate?: string
  endDate?: string
}

export type StopLocation = Stop

class StopService {
  async getStopEvents(filters?: StopEventFilters): Promise<StopEvent[]> {
    const query = new URLSearchParams()
    if (filters?.vehicleId) query.set('vehicleId', filters.vehicleId)
    if (filters?.minDuration !== undefined) query.set('minDuration', String(filters.minDuration))
    if (filters?.startDate) query.set('startDate', filters.startDate)
    if (filters?.endDate) query.set('endDate', filters.endDate)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiClient.get<StopEvent[]>(`/events/stop${suffix}`)
  }

  async getStopEventById(eventId: string): Promise<StopEvent | null> {
    return apiClient.get<StopEvent>(`/events/stop/${eventId}`)
  }

  async getStopPlayback(eventId: string): Promise<TripPlaybackPoint[]> {
    return apiClient.get<TripPlaybackPoint[]>(`/events/stop/${eventId}/playback`)
  }

  async getStopLocations(): Promise<StopLocation[]> {
    return fetchStops()
  }
}

export const stopService = new StopService()
