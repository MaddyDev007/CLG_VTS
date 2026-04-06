import type { HistoryPoint, VehicleHistory } from '../types/history'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege } from '@utils/collegeScope'

class HistoryService {
  async getVehiclesHistory(): Promise<VehicleHistory[]> {
    const history = await apiClient.get<VehicleHistory[]>(buildCollegeScopedPath('/history'))
    return filterByActiveCollege(history)
  }

  async getVehicleHistory(vehicleId: string): Promise<VehicleHistory | null> {
    return apiClient.get<VehicleHistory>(`/history/${vehicleId}`)
  }

  async getVehicleHistoryTimeline(vehicleId: string): Promise<HistoryPoint[]> {
    return apiClient.get<HistoryPoint[]>(`/history/${vehicleId}/timeline`)
  }
}

export const historyService = new HistoryService()
