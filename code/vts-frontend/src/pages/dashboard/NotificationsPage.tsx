import { useCallback, useEffect, useState } from 'react'
import { NotificationFilters, type NotificationFilterOption } from '@components/notifications/NotificationFilters'
import { NotificationsList } from '@components/notifications/NotificationsList'
import { Pagination } from '@components/ui/Pagination'
import { notificationService } from '@services/notificationService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { useNotificationStore } from '@store/notificationStore'
import type { Notification } from '../../types/notification'

export function NotificationsPage() {
  const isLoaded = useNotificationStore((state) => state.isLoaded)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<NotificationFilterOption>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const syncVersion = useScopedDataSyncVersion(['notifications'])

  const reloadNotificationsPage = useCallback(async () => {
    const response = await notificationService.getNotificationsPage({
      page,
      limit,
      search,
      type: filter === 'all' ? undefined : filter,
    })
    setNotifications(response.data)
    setTotal(response.total)
  }, [filter, limit, page, search])

  useEffect(() => {
    if (isLoaded) {
      return
    }
    void loadNotifications()
  }, [isLoaded, loadNotifications])

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true)
      try {
        await reloadNotificationsPage()
      } finally {
        setIsLoading(false)
      }
    }

    void loadPage()
  }, [reloadNotificationsPage, syncVersion])

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
            onClick={() => void (async () => {
              await markAllAsRead()
              await reloadNotificationsPage()
            })()}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Mark all as read
          </button>
        </div>
      </section>

      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder='Search by vehicle, message, route, location...'
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 md:max-w-sm dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
          <NotificationFilters
            value={filter}
            onChange={(nextFilter) => {
              setFilter(nextFilter)
              setPage(1)
            }}
          />
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading notifications...
        </div>
      ) : (
        <>
          <NotificationsList notifications={notifications} onMarkAsRead={async (notificationId) => {
            await markAsRead(notificationId)
            await reloadNotificationsPage()
          }} />
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit)
              setPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}
