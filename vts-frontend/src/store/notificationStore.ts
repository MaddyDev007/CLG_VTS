import { create } from 'zustand'
import { notificationService } from '@services/notificationService'
import type { Notification } from '../types/notification'

type NotificationStoreState = {
  notifications: Notification[]
  toasts: Notification[]
  unreadCount: number
  isLoaded: boolean
}

type NotificationStoreActions = {
  loadNotifications: () => Promise<void>
  addNotification: (notification?: Notification) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismissToast: (notificationId: string) => void
}

type NotificationStore = NotificationStoreState & NotificationStoreActions

const initialState: NotificationStoreState = {
  notifications: [],
  toasts: [],
  unreadCount: 0,
  isLoaded: false,
}

function countUnread(notifications: Notification[]): number {
  return notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0)
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  ...initialState,

  loadNotifications: async () => {
    const notifications = await notificationService.getNotifications({ page: 1, limit: 50 })
    set({
      notifications,
      unreadCount: countUnread(notifications),
      isLoaded: true,
    })
  },

  addNotification: async (notification) => {
    if (!notification) {
      return
    }

    const nextNotification = notification

    set((state) => {
      const existingNotification = state.notifications.find((item) => item.id === nextNotification.id)
      const notifications = existingNotification
        ? state.notifications.map((item) => (item.id === nextNotification.id ? nextNotification : item))
        : [nextNotification, ...state.notifications]
      const toasts = existingNotification
        ? state.toasts
        : [nextNotification, ...state.toasts].slice(0, 5)
      const unreadCount = existingNotification
        ? countUnread(notifications)
        : nextNotification.read
          ? state.unreadCount
          : state.unreadCount + 1

      return {
        notifications,
        toasts,
        unreadCount,
      }
    })
  },

  markAsRead: async (notificationId) => {
    const updated = await notificationService.markAsRead(notificationId)
    if (!updated) {
      return
    }

    set((state) => {
      const target = state.notifications.find((item) => item.id === notificationId)
      if (!target) {
        return state
      }

      const notifications = state.notifications.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      )
      const unreadCount = target.read ? state.unreadCount : Math.max(0, state.unreadCount - 1)

      return {
        notifications,
        unreadCount,
      }
    })
  },

  markAllAsRead: async () => {
    const notifications = await notificationService.markAllAsRead()
    set({
      notifications,
      unreadCount: 0,
    })
  },

  dismissToast: (notificationId) => {
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== notificationId),
    }))
  },
}))
