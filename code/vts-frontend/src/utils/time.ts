const ONE_SECOND_MS = 1000
const ONE_MINUTE_MS = 60 * ONE_SECOND_MS
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS

export function formatDuration(ms: number): string {
  const safeMs = Number.isFinite(ms) ? ms : 0

  if (safeMs <= 0) {
    return '0 sec'
  }

  if (safeMs > 0 && safeMs < ONE_SECOND_MS) {
    console.warn('Duration too small, possible unit mismatch', { durationMs: safeMs })
  }

  const totalSeconds = Math.floor(safeMs / ONE_SECOND_MS)

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  if (minutes < 60) {
    return remainingSeconds === 0 ? `${minutes} min` : `${minutes} min ${remainingSeconds} sec`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours} hr ${remainingMinutes} min`
}

export function durationMsBetween(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0
  }
  return Math.max(0, end - start)
}

export function minutesToMs(minutes: number): number {
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0
  return Math.max(0, safeMinutes * ONE_MINUTE_MS)
}

export function msToMinutes(ms: number): number {
  const safeMs = Number.isFinite(ms) ? ms : 0
  return safeMs / ONE_MINUTE_MS
}

export function msToSeconds(ms: number): number {
  const safeMs = Number.isFinite(ms) ? ms : 0
  return Math.floor(safeMs / ONE_SECOND_MS)
}

export function msToHours(ms: number): number {
  const safeMs = Number.isFinite(ms) ? ms : 0
  return safeMs / ONE_HOUR_MS
}

export function formatDateInputValue(value?: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toStartOfLocalDayISOString(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}

export function toEndOfLocalDayISOString(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T23:59:59.999`)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}
