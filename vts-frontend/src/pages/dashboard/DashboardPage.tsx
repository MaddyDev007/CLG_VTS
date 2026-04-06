import { useEffect, useMemo, useState } from 'react'
import { FiPauseCircle, FiPlayCircle, FiStopCircle, FiTruck, FiWifiOff } from 'react-icons/fi'
import { VehicleStatusPieChart } from '@components/charts/VehicleStatusPieChart'
import { RecentActivities } from '@components/dashboard/RecentActivities'
import { DashboardLayout } from '@components/layout/DashboardLayout'
import { StatCard } from '@components/ui/StatCard'
import { WelcomeCard } from '@components/ui/WelcomeCard'
import { socketService } from '@services/socketService'
import { useAuthStore } from '@store/authStore'
import { deriveVehicleStatusCounts, mergeVehicleSocketPayload } from '@utils/vehicleRealtime'
import { useNavigate } from 'react-router-dom'
import { vehicleService } from '@services/vehicleService'
import { notificationService } from '@services/notificationService'
import type { Vehicle } from '../../types/vehicle'

type ActivityItem = {
  id: string
  vehicleName: string
  activityType: 'Vehicle started moving' | 'Vehicle entered geofence' | 'Overspeed detected' | 'Vehicle stopped'
  timestamp: string
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const ts = new Date(iso).getTime()
  const diffMins = Math.max(0, Math.round((now - ts) / 60000))
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} days ago`
}

function mapNotificationToActivity(notification: {
  id: string
  vehicleName: string
  type: 'overspeed' | 'geofence_enter' | 'geofence_exit' | 'idling' | 'stop'
  timestamp: string
}): ActivityItem {
  const typeMap: Record<ActivityItem['activityType'], ActivityItem['activityType']> = {
    'Vehicle started moving': 'Vehicle started moving',
    'Vehicle entered geofence': 'Vehicle entered geofence',
    'Overspeed detected': 'Overspeed detected',
    'Vehicle stopped': 'Vehicle stopped',
  }

  const activityType: ActivityItem['activityType'] = (() => {
    switch (notification.type) {
      case 'overspeed':
        return 'Overspeed detected'
      case 'geofence_enter':
      case 'geofence_exit':
        return 'Vehicle entered geofence'
      case 'stop':
        return 'Vehicle stopped'
      default:
        return 'Vehicle started moving'
    }
  })()

  return {
    id: notification.id,
    vehicleName: notification.vehicleName,
    activityType: typeMap[activityType],
    timestamp: formatRelativeTime(notification.timestamp),
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)

  const [fleet, setFleet] = useState<Vehicle[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  const isSuperAdmin = role === 'SUPER_ADMIN'

  useEffect(() => {
    const loadFleet = async () => {
      const nextFleet = await vehicleService.getVehicles({ page: 1, limit: 500 })
      setFleet(nextFleet)
    }

    const loadActivities = async () => {
      const notifications = await notificationService.getNotifications({ page: 1, limit: 10 })
      setActivities(
        notifications
          .slice(0, 10)
          .map((notification) => mapNotificationToActivity(notification)),
      )
    }

    void loadFleet()
    void loadActivities()
  }, [])

  useEffect(() => {
    const unsubscribeVehicleUpdates = socketService.subscribeToVehicleUpdates((payload) => {
      if (isSuperAdmin) {
        void vehicleService.getVehicles({ page: 1, limit: 500 }).then(setFleet)
        return
      }

      setFleet((currentFleet) => mergeVehicleSocketPayload(currentFleet, payload))
    })

    const unsubscribeNotifications = socketService.subscribeToNotifications((notification) => {
      if (isSuperAdmin) {
        void notificationService
          .getNotifications({ page: 1, limit: 10 })
          .then((notifications) => setActivities(notifications.slice(0, 10).map(mapNotificationToActivity)))
        return
      }

      setActivities((currentActivities) =>
        [mapNotificationToActivity(notification), ...currentActivities.filter((item) => item.id !== notification.id)].slice(0, 10),
      )
    })

    return () => {
      unsubscribeVehicleUpdates()
      unsubscribeNotifications()
    }
  }, [isSuperAdmin])

  const counts = useMemo(() => deriveVehicleStatusCounts(fleet), [fleet])
  const stoppedCount = useMemo(() => counts.stopped ?? 0, [counts])

  const pieData = useMemo(
    () => [
      { name: 'moving' as const, value: counts.moving },
      { name: 'idling' as const, value: counts.idling },
      { name: 'stopped' as const, value: stoppedCount },
      { name: 'offline' as const, value: counts.offline },
    ],
    [counts, stoppedCount],
  )

  return (
    <DashboardLayout>
      <div className='mx-auto w-full max-w-7xl space-y-5'>
        <WelcomeCard
          name={user?.name ?? 'Operator'}
          role={role ?? 'NO_ROLE'}
          actions={null}
        />

        <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5'>
          <button type='button' onClick={() => navigate('/vehicles')} className='text-left'>
            <StatCard title='Total Vehicles' value={counts.total} icon={<FiTruck size={18} />} color='blue' />
          </button>
          <button type='button' onClick={() => navigate('/vehicles?status=moving')} className='text-left'>
            <StatCard title='Moving' value={counts.moving} icon={<FiPlayCircle size={18} />} color='emerald' />
          </button>
          <button type='button' onClick={() => navigate('/vehicles?status=idling')} className='text-left'>
            <StatCard title='Idling' value={counts.idling} icon={<FiPauseCircle size={18} />} color='amber' />
          </button>
          <button type='button' onClick={() => navigate('/vehicles?status=stopped')} className='text-left'>
            <StatCard title='Stopped' value={stoppedCount} icon={<FiStopCircle size={18} />} color='rose' />
          </button>
          <button type='button' onClick={() => navigate('/vehicles?status=offline')} className='text-left'>
            <StatCard title='Offline' value={counts.offline} icon={<FiWifiOff size={18} />} color='slate' />
          </button>
        </section>

        <section className='grid grid-cols-1 gap-5'>
          <VehicleStatusPieChart data={pieData} />
        </section>

        <RecentActivities items={activities} />
      </div>
    </DashboardLayout>
  )
}
