import { useMemo } from 'react'
import type { Notification } from '../../types/notification'

type NotificationsListProps = {
  notifications: Notification[]
  onMarkAsRead: (notificationId: string) => Promise<void> | void
}

function typeLabel(type: Notification['type']): string {
  if (type === 'geofence_enter') {
    return 'Geofence Enter'
  }
  if (type === 'geofence_exit') {
    return 'Geofence Exit'
  }
  if (type === 'overspeed') {
    return 'Overspeed'
  }
  if (type === 'idling') {
    return 'Idling'
  }
  return 'Stop'
}

function formatFallback(notification: Notification): string {
  if (notification.type === 'geofence_enter') {
    const name = notification.geofenceName?.trim() ? notification.geofenceName : 'Unknown'
    return `Entering ${name}`
  }
  if (notification.type === 'geofence_exit') {
    const name = notification.geofenceName?.trim() ? notification.geofenceName : 'Unknown'
    return `Exiting ${name}`
  }
  return typeLabel(notification.type)
}

function resolveEventLabel(notification: Notification): string {
  const message = notification.message?.trim()
  return message ? message : formatFallback(notification)
}

export function NotificationsList({ notifications, onMarkAsRead }: NotificationsListProps) {
  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [notifications],
  )

  const resolveLocation = (location: string) => (location.trim().length > 0 ? location : 'Location unavailable')

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[980px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>Event Type</th>
              <th className='px-3 py-2 font-semibold'>Vehicle</th>
              <th className='px-3 py-2 font-semibold'>Route</th>
              <th className='px-3 py-2 font-semibold'>Location</th>
              <th className='px-3 py-2 font-semibold'>Time</th>
              <th className='px-3 py-2 text-right font-semibold'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedNotifications.length ? (
              sortedNotifications.map((notification) => (
                <tr
                  key={notification.id}
                  className={`border-b border-slate-200/70 transition dark:border-slate-700/70 ${
                    notification.read
                      ? 'hover:bg-slate-50/70 dark:hover:bg-slate-800/60'
                      : 'bg-blue-50/60 hover:bg-blue-50 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/15'
                  }`}
                >
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {resolveEventLabel(notification)}
                  </td>
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{notification.vehicleName}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {notification.routeName ?? '—'}
                  </td>
                  <td
                    className='max-w-sm truncate px-3 py-3 text-slate-700 dark:text-slate-200'
                    title={resolveLocation(notification.location)}
                  >
                    {resolveLocation(notification.location)}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(notification.timestamp).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-right'>
                    {!notification.read ? (
                      <button
                        type='button'
                        onClick={() => void onMarkAsRead(notification.id)}
                        className='rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-cyan-500/60 dark:text-cyan-300 dark:hover:border-cyan-300 dark:hover:text-cyan-200'
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className='text-xs text-slate-500 dark:text-slate-400'>-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No notifications match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
