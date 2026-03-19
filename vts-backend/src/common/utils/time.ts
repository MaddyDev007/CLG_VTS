export const MS_IN_SECOND = 1000
export const MS_IN_MINUTE = 60 * MS_IN_SECOND

export function diffMs(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime())
}

export function secondsToMs(seconds: number): number {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0
  return Math.max(0, safeSeconds * MS_IN_SECOND)
}

export function minutesToMs(minutes: number): number {
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0
  return Math.max(0, safeMinutes * MS_IN_MINUTE)
}

export function msToSeconds(ms: number): number {
  const safeMs = Number.isFinite(ms) ? ms : 0
  return Math.max(0, Math.round(safeMs / MS_IN_SECOND))
}

export function msToMinutes(ms: number): number {
  const safeMs = Number.isFinite(ms) ? ms : 0
  return safeMs / MS_IN_MINUTE
}
