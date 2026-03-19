export interface VehicleHistory {
  vehicleId: string
  vehicleName: string
  lastLocation: string
  lastSeen: string
  totalDistance: number
  totalTrips: number
}

export interface HistoryPoint {
  timestamp: string
  lat: number
  lon: number
  speed: number
  ignition: boolean
  address: string
}

export interface HistoryEvent {
  type: 'trip_start' | 'trip_end' | 'stop' | 'idling'
  time: string
  location: string
}
