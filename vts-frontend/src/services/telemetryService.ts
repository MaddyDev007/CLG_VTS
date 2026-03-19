import type { TelemetryFilter, TelemetryRecord } from '../types/telemetry'
import { apiClient } from '../api/apiClient'

class TelemetryService {
  async getTelemetry(filters?: TelemetryFilter): Promise<TelemetryRecord[]> {
    const query = new URLSearchParams()
    if (filters?.vehicleId) query.set('vehicleId', filters.vehicleId)
    if (typeof filters?.ignition === 'boolean') query.set('ignition', String(filters.ignition))
    if (filters?.startDate) query.set('startDate', filters.startDate)
    if (filters?.endDate) query.set('endDate', filters.endDate)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiClient.get<TelemetryRecord[]>(`/telemetry${suffix}`)
  }

  async getTelemetryByVehicle(vehicleId: string): Promise<TelemetryRecord[]> {
    return this.getTelemetry({ vehicleId })
  }
}

export const telemetryService = new TelemetryService()
