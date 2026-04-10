export interface Trip {
  id: string
  vehicleId: string
  vehicleName: string
  startLocation: string
  endLocation: string
  startTime: string
  endTime: string
  // Duration in milliseconds.
  duration: number
  distance: number
}

export interface TripPlaybackPoint {
  timestamp: string
  lat: number
  lon: number
  speed: number
}

export interface TripSummary {
  totalDistance: number
  // Duration in milliseconds.
  duration: number
  maxSpeed: number
  avgSpeed: number
}
