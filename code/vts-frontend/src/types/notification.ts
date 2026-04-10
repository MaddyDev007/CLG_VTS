export interface Notification {
  id: string
  type: 'overspeed' | 'geofence_enter' | 'geofence_exit' | 'idling' | 'stop'
  vehicleId: string
  vehicleName: string
  message: string
  location: string
  geofenceId?: string | null
  geofenceName?: string | null
  routeName?: string | null
  timestamp: string
  read: boolean
}

export interface NotificationFilter {
  type?: string
}
