import { useEffect } from 'react'
import { useNotificationStore } from '@store/notificationStore'

export function useNotificationListener() {
  const isLoaded = useNotificationStore((state) => state.isLoaded)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)

  useEffect(() => {
    if (isLoaded) {
      return
    }

    void loadNotifications()
  }, [isLoaded, loadNotifications])

  // WebSocket-driven notifications can be wired here when backend emits events.
}
