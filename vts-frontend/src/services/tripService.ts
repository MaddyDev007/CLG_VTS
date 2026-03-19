import type { Trip, TripPlaybackPoint } from '../types/trip'
import { apiClient } from '../api/apiClient'

class TripService {
  async getTrips(): Promise<Trip[]> {
    return apiClient.get<Trip[]>('/trips')
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return apiClient.get<Trip>(`/trips/${tripId}`)
  }

  async getTripPlayback(tripId: string): Promise<TripPlaybackPoint[]> {
    return apiClient.get<TripPlaybackPoint[]>(`/trips/${tripId}/playback`)
  }
}

export const tripService = new TripService()
