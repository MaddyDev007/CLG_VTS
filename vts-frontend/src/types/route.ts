export interface RouteStop {
  id: string
  name: string
  lat: number
  lon: number
}

export interface Route {
  id: string
  name: string
  startStop: RouteStop
  endStop: RouteStop
  intermediateStops: RouteStop[]
  stopsCount: number
  status: 'active' | 'idle'
  createdAt: string
}
