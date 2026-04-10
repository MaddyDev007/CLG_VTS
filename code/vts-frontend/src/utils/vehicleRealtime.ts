import type { VehicleSocketPayload } from '@services/socketService'
import type { Vehicle, VehicleStatusCounts } from '../types/vehicle'

export const EMPTY_VEHICLE_STATUS_COUNTS: VehicleStatusCounts = {
  total: 0,
  moving: 0,
  idling: 0,
  offline: 0,
  stopped: 0,
}

export function applyVehicleSocketPayload(vehicle: Vehicle, payload: VehicleSocketPayload): Vehicle {
  if (vehicle.id !== payload.vehicleId) {
    return vehicle
  }

  return {
    ...vehicle,
    lat: payload.lat,
    lon: payload.lng,
    speed: payload.speed,
    status: payload.status,
    lastSeen: payload.timestamp,
  }
}

export function mergeVehicleSocketPayload(vehicles: Vehicle[], payload: VehicleSocketPayload): Vehicle[] {
  let hasMatch = false

  const nextVehicles = vehicles.map((vehicle) => {
    if (vehicle.id !== payload.vehicleId) {
      return vehicle
    }

    hasMatch = true
    return applyVehicleSocketPayload(vehicle, payload)
  })

  return hasMatch ? nextVehicles : vehicles
}

export function deriveVehicleStatusCounts(vehicles: Vehicle[]): VehicleStatusCounts {
  return vehicles.reduce<VehicleStatusCounts>(
    (counts, vehicle) => {
      counts.total += 1
      counts[vehicle.status] += 1
      return counts
    },
    { ...EMPTY_VEHICLE_STATUS_COUNTS },
  )
}
