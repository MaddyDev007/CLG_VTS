import { useEffect, useRef } from 'react'
import { FiBell, FiX } from 'react-icons/fi'
import { useNotificationStore } from '@store/notificationStore'
import type { Notification } from '../../types/notification'

const AUTO_DISMISS_MS = 5000

function formatFallback(notification: Notification): string {
  if (notification.type === 'geofence_enter') {
    const name = notification.geofenceName?.trim() ? notification.geofenceName : 'Unknown'
    return `Entering ${name}`
  }
  if (notification.type === 'geofence_exit') {
    const name = notification.geofenceName?.trim() ? notification.geofenceName : 'Unknown'
    return `Exiting ${name}`
  }
  if (notification.type === 'overspeed') {
    return 'Overspeed'
  }
  if (notification.type === 'idling') {
    return 'Idling'
  }
  return 'Stop'
}

function resolveEventLabel(notification: Notification): string {
  const message = notification.message?.trim()
  return message ? message : formatFallback(notification)
}

function resolveLocation(location: string): string {
  return location.trim().length > 0 ? location : 'Location unavailable'
}

export function NotificationContainer() {
  const toasts = useNotificationStore((state) => state.toasts)
  const dismissToast = useNotificationStore((state) => state.dismissToast)
  const timersRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timersRef.current.has(toast.id)) {
        return
      }

      const timer = window.setTimeout(() => {
        dismissToast(toast.id)
        timersRef.current.delete(toast.id)
      }, AUTO_DISMISS_MS)

      timersRef.current.set(toast.id, timer)
    })

    const currentIds = new Set(toasts.map((toast) => toast.id))
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        window.clearTimeout(timer)
        timersRef.current.delete(id)
      }
    })
  }, [dismissToast, toasts])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  if (!toasts.length) {
    return null
  }

  return (
    <div className='pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3'>
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className='pointer-events-auto rounded-xl border border-white/30 bg-white/85 p-3 shadow-xl shadow-slate-900/20 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/95'
          style={{ animation: 'toast-slide-in 220ms ease-out' }}
        >
          <div className='flex items-start justify-between gap-2'>
            <div className='flex items-start gap-2'>
              <span className='mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-[#38bdf8]'>
                <FiBell size={14} />
              </span>
              <div>
                <p className='text-sm font-semibold text-slate-900 dark:text-slate-100'>{toast.vehicleName}</p>
                <p className='text-xs text-slate-600 dark:text-slate-300'>{resolveEventLabel(toast)}</p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => dismissToast(toast.id)}
              className='rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              aria-label='Dismiss notification'
            >
              <FiX size={14} />
            </button>
          </div>

          <p className='mt-2 text-sm text-slate-700 dark:text-slate-200'>{resolveLocation(toast.location)}</p>
          <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{new Date(toast.timestamp).toLocaleString()}</p>
        </article>
      ))}
    </div>
  )
}
