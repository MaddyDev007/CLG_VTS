export type VehicleStatus = 'moving' | 'idling' | 'offline' | 'stopped'
export type VehicleType = 'Bus' | 'Car' | 'Van' | 'Truck'

export interface Vehicle {
  id: string
  registrationNumber: string
  vehicleName: string
  vehicleType: VehicleType
  status: VehicleStatus
  deviceId: string
  speed: number
  speedLimit: number
  address: string
  geofenceId?: string | null
  geofenceName?: string | null
  lat: number
  lon: number
  lastSeen: string
  routeId: string | null
}

export interface TelemetryPoint {
  timestamp: string
  lat: number
  lon: number
  speed: number
  ignition: boolean
  address: string
  battery: number
  signal: number
}

export interface Trip {
  id: string
  vehicleId: string
  startTime: string
  endTime: string
  distance: number
  maxSpeed: number
}

export interface VehicleStatusCounts {
  total: number
  moving: number
  idling: number
  offline: number
  stopped: number
}
