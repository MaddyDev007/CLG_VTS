import type { TripPlaybackPoint } from '../types/trip'
import type { OverspeedEvent } from '../types/events'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege } from '@utils/collegeScope'

export type OverspeedEventFilters = {
  vehicleId?: string
  speedLimit?: number
  startDate?: string
  endDate?: string
}

class OverspeedService {
  async getOverspeedEvents(filters?: OverspeedEventFilters): Promise<OverspeedEvent[]> {
    const query = new URLSearchParams()
    if (filters?.vehicleId) query.set('vehicleId', filters.vehicleId)
    if (filters?.speedLimit !== undefined) query.set('speedLimit', String(filters.speedLimit))
    if (filters?.startDate) query.set('startDate', filters.startDate)
    if (filters?.endDate) query.set('endDate', filters.endDate)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    const events = await apiClient.get<OverspeedEvent[]>(buildCollegeScopedPath(`/events/overspeed${suffix}`))
    return filterByActiveCollege(events)
  }

  async getOverspeedEventById(eventId: string): Promise<OverspeedEvent | null> {
    return apiClient.get<OverspeedEvent>(`/events/overspeed/${eventId}`)
  }

  async getOverspeedPlayback(eventId: string): Promise<TripPlaybackPoint[]> {
    return apiClient.get<TripPlaybackPoint[]>(`/events/overspeed/${eventId}/playback`)
  }
}

export const overspeedService = new OverspeedService()
