import type { VehicleSocketPayload } from '@services/socketService'
import type { TelemetryFilter } from '../types/telemetry'
import type { TelemetryRecord } from '../types/telemetry'

export type TelemetryLiveFilterState = TelemetryFilter & {
  deviceId?: string
  dateRange?: 'today' | 'last_7_days' | 'last_30_days' | 'custom'
}

export const TELEMETRY_LIVE_MAX_ROWS = 50

function telemetryRowKey(row: Pick<TelemetryRecord, 'vehicleId' | 'timestamp'>): string {
  return `${row.vehicleId}::${row.timestamp}`
}

export function applyTelemetryLiveUpdate(
  existingRows: TelemetryRecord[],
  newRow: TelemetryRecord,
  maxRows = TELEMETRY_LIVE_MAX_ROWS,
): TelemetryRecord[] {
  const newKey = telemetryRowKey(newRow)
  const withoutDuplicate = existingRows.filter((row) => telemetryRowKey(row) !== newKey)
  return [newRow, ...withoutDuplicate]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, maxRows)
}

export function limitTelemetryRows(rows: TelemetryRecord[], maxRows = TELEMETRY_LIVE_MAX_ROWS): TelemetryRecord[] {
  return [...rows]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, maxRows)
}

export function normalizeTelemetryHistoryFilters(filters: TelemetryLiveFilterState): TelemetryFilter {
  return {
    vehicleId: filters.vehicleId,
    ignition: filters.ignition,
    startDate: filters.startDate,
    endDate: filters.endDate,
  }
}

export function isTelemetryLiveModeEligible(filters: TelemetryLiveFilterState): boolean {
  return (
    (filters.dateRange ?? 'today') === 'today' &&
    !filters.vehicleId &&
    !filters.deviceId &&
    typeof filters.ignition === 'undefined'
  )
}

export function shouldAcceptLiveTelemetryRow(
  row: TelemetryRecord,
  filters: TelemetryLiveFilterState,
): boolean {
  const dateRange = filters.dateRange ?? 'today'

  if (dateRange !== 'today') {
    return false
  }

  const rowTimestamp = new Date(row.timestamp).getTime()

  if (filters.vehicleId && row.vehicleId !== filters.vehicleId) {
    return false
  }

  if (filters.deviceId && row.deviceId !== filters.deviceId) {
    return false
  }

  if (typeof filters.ignition === 'boolean' && row.ignition !== filters.ignition) {
    return false
  }

  if (filters.startDate) {
    const startTimestamp = new Date(filters.startDate).getTime()
    if (rowTimestamp < startTimestamp) {
      return false
    }
  }

  return true
}

export function uniqueVehicleIdsFromSocketPayloads(payloads: VehicleSocketPayload[]): string[] {
  return Array.from(new Set(payloads.map((payload) => payload.vehicleId)))
}
