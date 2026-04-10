import type { VehicleStatus } from '../../modules/vehicles/vehicle.entity'

type ComputeVehicleStatusInput = {
  timestamp: Date
  speed: number
  ignition: boolean
  previousStatus?: VehicleStatus
}

type ComputeVehicleStatusOptions = {
  offlineThresholdMs: number
  nowMs?: number
}

export function getOfflineThresholdMs(): number {
  const hours = Number(process.env.VEHICLE_OFFLINE_THRESHOLD_HOURS ?? 24)
  if (!Number.isFinite(hours) || hours <= 0) {
    return 24 * 60 * 60 * 1000
  }
  return hours * 60 * 60 * 1000
}

export function computeVehicleStatus(
  input: ComputeVehicleStatusInput,
  options: ComputeVehicleStatusOptions,
): VehicleStatus {
  const nowMs = options.nowMs ?? Date.now()
  const lastSeenMs = input.timestamp.getTime()

  if (nowMs - lastSeenMs > options.offlineThresholdMs) {
    return 'offline'
  }

  if (input.ignition && input.speed > 5) {
    return 'moving'
  }

  if (input.speed <= 1) {
    return input.ignition ? 'idling' : 'stopped'
  }

  if (input.previousStatus) {
    if (input.previousStatus !== 'offline') {
      return input.previousStatus
    }
  }

  return input.ignition ? 'idling' : 'stopped'
}
