import { useEffect, useMemo, useState } from 'react'
import { NotificationFilters, type NotificationFilterOption } from '@components/notifications/NotificationFilters'
import { NotificationsList } from '@components/notifications/NotificationsList'
import { useNotificationStore } from '@store/notificationStore'

export function NotificationsPage() {
  const isLoaded = useNotificationStore((state) => state.isLoaded)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)
  const notifications = useNotificationStore((state) => state.notifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const [filter, setFilter] = useState<NotificationFilterOption>('all')

  useEffect(() => {
    if (isLoaded) {
      return
    }
    void loadNotifications()
  }, [isLoaded, loadNotifications])

  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => (filter === 'all' ? true : notification.type === filter)),
    [filter, notifications],
  )

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Notifications</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Live alerts from vehicle events</p>
            <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Unread: {unreadCount}</p>
          </div>

          <button
            type='button'
            onClick={() => void markAllAsRead()}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Mark all as read
          </button>
        </div>
      </section>

      <NotificationFilters value={filter} onChange={setFilter} />

      <NotificationsList notifications={filteredNotifications} onMarkAsRead={markAsRead} />
    </div>
  )
}
