export interface Geofence {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  radius: number
  isStop: boolean
  createdAt: string
  updatedAt: string
}

export interface GeofenceSearchResult {
  displayName: string
  lat: number
  lon: number
}
