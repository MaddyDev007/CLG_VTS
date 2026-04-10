import type { Geofence } from '../types/geofence'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege, getActiveCollegeFilterId } from '@utils/collegeScope'

export type CreateGeofenceInput = {
  collegeId?: string
  name: string
  address: string
  lat: number
  lon: number
  radius: number
  isStop?: boolean
}

export type UpdateGeofenceInput = Partial<CreateGeofenceInput>

export type GeofenceServiceResponse = {
  success: true
  message: string
}

export interface Stop {
  id: string
  name: string
  lat: number
  lon: number
}

function mapGeofenceToStop(geofence: Partial<Geofence> & { id?: string; name?: string }): Stop | null {
  if (!geofence.id || !geofence.name) {
    return null
  }

  return {
    id: geofence.id,
    name: geofence.name,
    lat: Number(geofence.lat),
    lon: Number(geofence.lon),
  }
}

export async function fetchStops(): Promise<Stop[]> {
  try {
    const response = await apiClient.get<unknown>(buildCollegeScopedPath('/geofences/stops'))

    if (!Array.isArray(response)) {
      console.error('Invalid stops response', response)
      return []
    }

    const stops = filterByActiveCollege(response)
      .map((item) => mapGeofenceToStop((item as Partial<Geofence>) ?? {}))
      .filter((stop): stop is Stop => Boolean(stop))

    console.debug('Stops loaded:', stops.length)
    if (stops.length === 0) {
      console.warn('No stops found in geofences')
    }

    return stops
  } catch (error) {
    console.error('Failed to fetch stops', error)
    return []
  }
}

class GeofenceService {
  async getGeofences(): Promise<Geofence[]> {
    const geofences = await apiClient.get<Geofence[]>(buildCollegeScopedPath('/geofences'))
    return filterByActiveCollege(geofences)
  }

  async createGeofence(
    geofenceData: CreateGeofenceInput,
  ): Promise<{ success: true; message: string; geofence: Geofence }> {
    return apiClient.post<{ success: true; message: string; geofence: Geofence }>(
      buildCollegeScopedPath('/geofences', { collegeId: geofenceData.collegeId ?? getActiveCollegeFilterId() }),
      geofenceData,
    )
  }

  async updateGeofence(
    geofenceId: string,
    updatedData: UpdateGeofenceInput,
  ): Promise<{ success: true; message: string; geofence: Geofence }> {
    return apiClient.put<{ success: true; message: string; geofence: Geofence }>(
      `/geofences/${geofenceId}`,
      updatedData,
    )
  }

  async deleteGeofence(id: string): Promise<GeofenceServiceResponse> {
    return apiClient.delete<GeofenceServiceResponse>(`/geofences/${id}`)
  }
}

export const geofenceService = new GeofenceService()
