import type { IdlingEvent } from '../types/events'
import type { TripPlaybackPoint } from '../types/trip'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege } from '@utils/collegeScope'

export type IdlingEventFilters = {
  vehicleId?: string
  minDuration?: number
  startDate?: string
  endDate?: string
}

class IdlingService {
  async getIdlingEvents(filters?: IdlingEventFilters): Promise<IdlingEvent[]> {
    const query = new URLSearchParams()
    if (filters?.vehicleId) query.set('vehicleId', filters.vehicleId)
    if (filters?.minDuration !== undefined) query.set('minDuration', String(filters.minDuration))
    if (filters?.startDate) query.set('startDate', filters.startDate)
    if (filters?.endDate) query.set('endDate', filters.endDate)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    const events = await apiClient.get<IdlingEvent[]>(buildCollegeScopedPath(`/events/idling${suffix}`))
    return filterByActiveCollege(events)
  }

  async getIdlingEventById(eventId: string): Promise<IdlingEvent | null> {
    return apiClient.get<IdlingEvent>(`/events/idling/${eventId}`)
  }

  async getIdlingPlayback(eventId: string): Promise<TripPlaybackPoint[]> {
    return apiClient.get<TripPlaybackPoint[]>(`/events/idling/${eventId}/playback`)
  }
}

export const idlingService = new IdlingService()
