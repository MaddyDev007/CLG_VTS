export interface OverspeedEvent {
  id: string
  collegeId?: string
  vehicleId: string
  vehicleName: string
  tripId: string
  maxSpeed: number
  speedLimit: number
  // Duration in milliseconds.
  duration: number
  startTime: string
  endTime: string
  location: string
  lat: number
  lon: number
}

export interface IdlingEvent {
  id: string
  collegeId?: string
  vehicleId: string
  vehicleName: string
  tripId: string
  // Duration in milliseconds.
  duration: number
  startTime: string
  endTime: string
  location: string
  lat: number
  lon: number
}

export interface StopEvent {
  id: string
  collegeId?: string
  vehicleId: string
  vehicleName: string
  tripId: string
  // Duration in milliseconds.
  duration: number
  startTime: string
  endTime: string
  location: string
  lat: number
  lon: number
}
