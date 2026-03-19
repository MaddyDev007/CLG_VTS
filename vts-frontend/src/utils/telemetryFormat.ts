export function batteryMvToPercent(mv: number): number {
  const MIN_MV = 3000
  const MAX_MV = 4200

  const percent = ((mv - MIN_MV) / (MAX_MV - MIN_MV)) * 100
  const clamped = Math.max(0, Math.min(100, percent))
  return Math.round(clamped)
}

export function signalDbmToBars(dbm: number): number {
  const strength = Math.abs(dbm)

  if (strength <= 60) return 4
  if (strength <= 70) return 3
  if (strength <= 85) return 2
  if (strength <= 100) return 1

  return 0
}
