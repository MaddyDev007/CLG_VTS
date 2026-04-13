import type { Route, RouteStop } from '../types/route'
import type { Vehicle } from '../types/vehicle'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege, getActiveCollegeFilterId } from '@utils/collegeScope'
import { invalidateDataSync } from '@store/dataSyncStore'

export type DeleteRouteResponse = {
  success: true
  message: string
}

export type UpdateRouteInput = {
  name?: string
  startStop?: RouteStop
  endStop?: RouteStop
  intermediateStops?: RouteStop[]
}

export type UpdateRouteResponse = {
  success: true
  message: string
  route: Route
}

export type CreateRouteInput = {
  collegeId?: string
  name: string
  startStop: RouteStop
  endStop: RouteStop
  intermediateStops: RouteStop[]
}

export type CreateRouteResponse = {
  success: true
  message: string
  route: Route
}

class RouteService {
  async getRoutes(): Promise<Route[]> {
    const routes = await apiClient.get<Route[]>(buildCollegeScopedPath('/routes'))
    return filterByActiveCollege(routes)
  }

  async getRouteById(routeId: string): Promise<Route | null> {
    return apiClient.get<Route>(`/routes/${routeId}`)
  }

  async getRouteVehicles(routeId: string) {
    return apiClient.get<Vehicle[]>(`/routes/${routeId}/vehicles`)
  }

  async createRoute(routeData: CreateRouteInput): Promise<CreateRouteResponse> {
    const response = await apiClient.post<CreateRouteResponse>(
      buildCollegeScopedPath('/routes', { collegeId: routeData.collegeId ?? getActiveCollegeFilterId() }),
      routeData,
    )

    invalidateDataSync(['routes', 'vehicles'])

    return response
  }

  async updateRoute(routeId: string, updatedData: UpdateRouteInput): Promise<UpdateRouteResponse> {
    const response = await apiClient.patch<UpdateRouteResponse>(`/routes/${routeId}`, updatedData)
    invalidateDataSync(['routes', 'vehicles'])
    return response
  }

  async deleteRoute(routeId: string): Promise<DeleteRouteResponse> {
    const response = await apiClient.delete<DeleteRouteResponse>(`/routes/${routeId}`)
    invalidateDataSync(['routes', 'vehicles'])
    return response
  }
}

export const routeService = new RouteService()
