export interface Device {
  id: string
  deviceId: string
  imei: string
  assignedVehicleId?: string
  assignedVehicleName?: string
  status: 'assigned' | 'unassigned'
  createdAt: string
  updatedAt: string
}
