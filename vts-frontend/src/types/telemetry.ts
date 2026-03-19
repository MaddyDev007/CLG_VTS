export interface TelemetryRecord {
  id: string
  vehicleId: string
  vehicleName: string
  deviceId: string
  timestamp: string
  lat: number
  lon: number
  address: string
  speed: number
  ignition: boolean
  battery: number
  signal: number
  geofenceId?: string | null
  geofenceName?: string | null
}

export interface TelemetryFilter {
  vehicleId?: string
  ignition?: boolean
  startDate?: string
  endDate?: string
}
