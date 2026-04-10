import { formatDuration } from './time'

export function formatDistance(distanceKm: number): string {
  const safe = Number.isFinite(distanceKm) ? distanceKm : 0
  return `${safe.toFixed(2)} km`
}

export function formatDurationList(durationMs: number): string {
  return formatDuration(durationMs)
}

export function formatDurationDetail(durationMs: number): string {
  return formatDuration(durationMs)
}
