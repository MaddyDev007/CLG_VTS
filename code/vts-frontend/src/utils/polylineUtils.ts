import type { TripPlaybackPoint } from '../types/trip'

export function convertTelemetryToPolyline(points: TripPlaybackPoint[]): Array<[number, number]> {
  return points
    .map((point) => [point.lat, point.lon] as [number, number])
    .filter((pair) => Number.isFinite(pair[0]) && Number.isFinite(pair[1]))
}
