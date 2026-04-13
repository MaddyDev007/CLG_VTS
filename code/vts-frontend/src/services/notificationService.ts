import type { Notification } from '../types/notification'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, filterByActiveCollege } from '@utils/collegeScope'
import { invalidateDataSync } from '@store/dataSyncStore'

type CreateNotificationInput = {
  type: Notification['type']
  vehicleId: string
  vehicleName: string
  message: string
  location: string
  geofenceId?: string
  routeName?: string
  timestamp?: string
}

export type NotificationListParams = {
  page?: number
  limit?: number
  search?: string
  type?: Notification['type']
  fromDate?: string
  toDate?: string
  ignoreActiveCollegeScope?: boolean
}

export type PaginatedNotificationsResponse = {
  data: Notification[]
  total: number
  page: number
  totalPages: number
}

class NotificationService {
  private buildListQuery(params?: NotificationListParams): string {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search?.trim()) searchParams.set('search', params.search.trim())
    if (params?.type) searchParams.set('type', params.type)
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate)
    if (params?.toDate) searchParams.set('toDate', params.toDate)

    const suffix = searchParams.toString()
    return buildCollegeScopedPath(suffix ? `/notifications?${suffix}` : '/notifications', {
      ignoreActiveCollegeScope: params?.ignoreActiveCollegeScope,
    })
  }

  async getNotificationsPage(params?: NotificationListParams): Promise<PaginatedNotificationsResponse> {
    const response = await apiClient.get<PaginatedNotificationsResponse>(this.buildListQuery(params))
    return {
      ...response,
      data: params?.ignoreActiveCollegeScope ? response.data : filterByActiveCollege(response.data),
    }
  }

  async getNotifications(params?: NotificationListParams): Promise<Notification[]> {
    const response = await this.getNotificationsPage(params)
    return response.data
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    await apiClient.patch(`/notifications/${notificationId}/read`)
    invalidateDataSync(['notifications'])
    const notifications = await this.getNotifications({ page: 1, limit: 50 })
    return notifications.find((notification) => notification.id === notificationId) ?? null
  }

  async markAllAsRead(): Promise<Notification[]> {
    await apiClient.patch('/notifications/read-all')
    invalidateDataSync(['notifications'])
    return this.getNotifications({ page: 1, limit: 50 })
  }

  async createNotification(payload: CreateNotificationInput): Promise<Notification> {
    const response = await apiClient.post<Notification>('/notifications', payload)
    invalidateDataSync(['notifications'])
    return response
  }
}

export const notificationService = new NotificationService()
