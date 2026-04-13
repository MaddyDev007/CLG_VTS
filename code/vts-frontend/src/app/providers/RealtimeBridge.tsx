import { useEffect } from 'react'
import { socketService } from '@services/socketService'
import { useAuthStore } from '@store/authStore'
import { invalidateDataSync, useDataSyncStore } from '@store/dataSyncStore'
import { useNotificationStore } from '@store/notificationStore'
import { useRealtimeStore } from '@store/realtimeStore'
import { useCollegeFilterStore } from '@store/collegeFilterStore'

export function RealtimeBridge() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.role)
  const selectedCollegeId = useCollegeFilterStore((state) => state.selectedCollegeId)
  const receiveVehicleUpdate = useRealtimeStore((state) => state.receiveVehicleUpdate)
  const clearVehicleUpdates = useRealtimeStore((state) => state.clearVehicleUpdates)
  const refreshNotifications = useNotificationStore((state) => state.refreshNotifications)
  const resetNotifications = useNotificationStore((state) => state.reset)
  const resetSyncState = useDataSyncStore((state) => state.reset)

  useEffect(() => {
    clearVehicleUpdates()
    resetNotifications()
    resetSyncState()

    if (isAuthenticated) {
      void refreshNotifications({ reset: true })
    }
  }, [
    clearVehicleUpdates,
    isAuthenticated,
    refreshNotifications,
    resetNotifications,
    resetSyncState,
    role,
    selectedCollegeId,
  ])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const unsubscribeVehicleUpdates = socketService.subscribeToVehicleUpdates((payload) => {
      receiveVehicleUpdate(payload)
    })

    const unsubscribeNotifications = socketService.subscribeToNotifications(() => {
      invalidateDataSync(['notifications', 'events'])
      void refreshNotifications()
    })

    return () => {
      unsubscribeVehicleUpdates()
      unsubscribeNotifications()
    }
  }, [isAuthenticated, receiveVehicleUpdate, refreshNotifications])

  return null
}
