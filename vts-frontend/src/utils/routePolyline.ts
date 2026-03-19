type StopLike = {
  lat: number
  lon: number
}

export function generateRoutePolyline(stops: StopLike[]): string {
  if (!stops.length) {
    return ''
  }

  return stops.map((stop) => `${stop.lat},${stop.lon}`).join(':')
}
