import type { TelemetryFilter, TelemetryRecord } from '../types/telemetry'
import { apiClient } from '../api/apiClient'
import { filterByActiveCollege } from '@utils/collegeScope'

class TelemetryService {
  async getTelemetry(filters?: TelemetryFilter): Promise<TelemetryRecord[]> {
    const query = new URLSearchParams()
    if (filters?.vehicleId) query.set('vehicleId', filters.vehicleId)
    if (typeof filters?.ignition === 'boolean') query.set('ignition', String(filters.ignition))
    if (filters?.startDate) query.set('startDate', filters.startDate)
    if (filters?.endDate) query.set('endDate', filters.endDate)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    const rows = await apiClient.get<TelemetryRecord[]>(`/telemetry${suffix}`)
    return filterByActiveCollege(rows)
  }

  async getTelemetryByVehicle(vehicleId: string): Promise<TelemetryRecord[]> {
    return this.getTelemetry({ vehicleId })
  }

  async getLatestTelemetryByVehicle(vehicleId: string): Promise<TelemetryRecord | null> {
    const rows = await this.getTelemetryByVehicle(vehicleId)

    if (!rows.length) {
      return null
    }

    return [...rows].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0]
  }
}

export const telemetryService = new TelemetryService()
