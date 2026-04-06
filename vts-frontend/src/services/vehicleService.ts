import type { TelemetryPoint, Trip, Vehicle, VehicleStatusCounts, VehicleType } from '../types/vehicle'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege } from '@utils/collegeScope'

export type CreateVehicleInput = {
  vehicleName: string
  vehicleType: VehicleType
  deviceId?: string
  createdAt: string
  updatedAt: string
}

export type CreateVehicleResponse = {
  success: true
  message: string
  vehicle: Vehicle
}

export type UpdateVehicleInput = {
  vehicleName: string
  vehicleType: VehicleType
  deviceId?: string
  routeId?: string | null
  speedLimit?: number
  updatedAt: string
}

export type UpdateVehicleResponse = {
  success: true
  message: string
  vehicle: Vehicle
}

export type DeleteVehicleResponse = {
  success: true
  message: string
}

export type VehicleListParams = {
  page?: number
  limit?: number
  search?: string
  status?: Vehicle['status']
  fromDate?: string
  toDate?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  totalPages: number
}

type BackendVehicle = {
  id: string
  collegeId?: string | null
  registrationNumber: string
  vehicleName: string
  vehicleType: VehicleType
  status: Vehicle['status']
  deviceId: string | null
  speed: number
  speedLimit: number | null
  lat: number | null
  lon: number | null
  address: string | null
  geofenceId?: string | null
  geofenceName?: string | null
  lastSeen: string | null
  routeId: string | null
}

type BackendVehicleStatusCounts = {
  total: number
  active: number
  idle: number
  offline: number
  overspeed: number
  stopped?: number
}

function normalizeVehicle(vehicle: BackendVehicle): Vehicle {
  const normalizedAddress =
    typeof vehicle.address === 'string' && vehicle.address.trim().length > 0 ? vehicle.address : 'Unknown location'

  return {
    id: vehicle.id,
    registrationNumber: vehicle.registrationNumber,
    vehicleName: vehicle.vehicleName,
    vehicleType: vehicle.vehicleType,
    status: vehicle.status,
    deviceId: vehicle.deviceId ?? 'unassigned',
    speed: vehicle.speed ?? 0,
    speedLimit: vehicle.speedLimit ?? 75,
    lat: vehicle.lat ?? 0,
    lon: vehicle.lon ?? 0,
    address: normalizedAddress,
    geofenceId: vehicle.geofenceId ?? null,
    geofenceName: vehicle.geofenceName ?? null,
    lastSeen: vehicle.lastSeen ?? '',
    routeId: vehicle.routeId ?? null,
  }
}

class VehicleService {
  private buildListQuery(params?: VehicleListParams): string {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search?.trim()) searchParams.set('search', params.search.trim())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate)
    if (params?.toDate) searchParams.set('toDate', params.toDate)

    const suffix = searchParams.toString()
    return buildCollegeScopedPath(suffix ? `/vehicles?${suffix}` : '/vehicles')
  }

  async getVehiclesPage(params?: VehicleListParams): Promise<PaginatedResponse<Vehicle>> {
    const response = await apiClient.get<PaginatedResponse<BackendVehicle>>(this.buildListQuery(params))

    return {
      ...response,
      data: filterByActiveCollege(response.data).map(normalizeVehicle),
    }
  }

  async getVehicles(params?: VehicleListParams): Promise<Vehicle[]> {
    const response = await this.getVehiclesPage(params)
    return response.data
  }

  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    const vehicle = await apiClient.get<BackendVehicle>(`/vehicles/${vehicleId}`)
    return normalizeVehicle(vehicle)
  }

  async getVehicleTrips(vehicleId: string): Promise<Trip[]> {
    return apiClient.get<Trip[]>(`/vehicles/${vehicleId}/trips`)
  }

  async getVehicleTelemetry(vehicleId: string): Promise<TelemetryPoint[]> {
    return apiClient.get<TelemetryPoint[]>(`/vehicles/${vehicleId}/telemetry`)
  }

  async getStatusCounts(): Promise<VehicleStatusCounts> {
    const counts = await apiClient.get<BackendVehicleStatusCounts>(buildCollegeScopedPath('/vehicles/status-counts'))

    return {
      total: counts.total ?? 0,
      moving: counts.active ?? 0,
      idling: Math.max(0, (counts.idle ?? 0) - (counts.stopped ?? 0)),
      stopped: counts.stopped ?? 0,
      offline: counts.offline ?? 0,
    }
  }

  async createVehicle(vehicleData: CreateVehicleInput): Promise<CreateVehicleResponse> {
    const response = await apiClient.post<CreateVehicleResponse>('/vehicles', {
      vehicleName: vehicleData.vehicleName,
      vehicleType: vehicleData.vehicleType,
      deviceId: vehicleData.deviceId,
    })

    return {
      ...response,
      vehicle: normalizeVehicle(response.vehicle as unknown as BackendVehicle),
    }
  }

  async updateVehicle(vehicleId: string, vehicleData: UpdateVehicleInput): Promise<UpdateVehicleResponse> {
    const body = {
      vehicleName: vehicleData.vehicleName,
      vehicleType: vehicleData.vehicleType,
      deviceId: vehicleData.deviceId,
      routeId: vehicleData.routeId === undefined ? undefined : vehicleData.routeId,
      speedLimit: vehicleData.speedLimit,
    }

    let response: UpdateVehicleResponse
    try {
      response = await apiClient.patch<UpdateVehicleResponse>(`/vehicles/${vehicleId}`, body)
    } catch (error) {
      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : 0
      if (status !== 404) {
        throw error
      }
      response = await apiClient.put<UpdateVehicleResponse>(`/vehicles/${vehicleId}`, body)
    }

    return {
      ...response,
      vehicle: normalizeVehicle(response.vehicle as unknown as BackendVehicle),
    }
  }

  async deleteVehicle(vehicleId: string): Promise<DeleteVehicleResponse> {
    return apiClient.delete<DeleteVehicleResponse>(`/vehicles/${vehicleId}`)
  }

  async updateVehicleRoute(vehicleId: string, routeId: string | null): Promise<UpdateVehicleResponse> {
    const body = { routeId }
    let response: UpdateVehicleResponse
    try {
      response = await apiClient.patch<UpdateVehicleResponse>(`/vehicles/${vehicleId}`, body)
    } catch (error) {
      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : 0
      if (status !== 404) {
        throw error
      }
      response = await apiClient.put<UpdateVehicleResponse>(`/vehicles/${vehicleId}`, body)
    }

    return {
      ...response,
      vehicle: normalizeVehicle(response.vehicle as unknown as BackendVehicle),
    }
  }
}

export const vehicleService = new VehicleService()
