import { useEffect } from 'react'
import { socketService } from '@services/socketService'
import { useNotificationStore } from '@store/notificationStore'

export function useNotificationListener() {
  const isLoaded = useNotificationStore((state) => state.isLoaded)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)
  const addNotification = useNotificationStore((state) => state.addNotification)

  useEffect(() => {
    if (isLoaded) {
      return
    }

    void loadNotifications()
  }, [isLoaded, loadNotifications])

  useEffect(() => {
    const unsubscribe = socketService.subscribeToNotifications((notification) => {
      void addNotification(notification)
    })

    return unsubscribe
  }, [addNotification])
}
