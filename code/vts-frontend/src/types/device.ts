export interface Device {
  id: string
  deviceId: string
  imei: string
  telemetryIntervalMs: number
  ignitionOnIntervalMs: number
  ignitionOffIntervalMs: number
  assignedVehicleId?: string
  assignedVehicleName?: string
  status: 'assigned' | 'unassigned'
  createdAt: string
  updatedAt: string
}
