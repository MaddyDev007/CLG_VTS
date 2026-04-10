import type { Notification } from '../../types/notification'

export type NotificationFilterOption = 'all' | Notification['type']

type NotificationFiltersProps = {
  value: NotificationFilterOption
  onChange: (value: NotificationFilterOption) => void
}

export function NotificationFilters({ value, onChange }: NotificationFiltersProps) {
  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='flex flex-wrap items-center gap-3'>
        <label htmlFor='notification-type-filter' className='text-sm font-medium text-slate-700 dark:text-slate-200'>
          Event Type
        </label>
        <select
          id='notification-type-filter'
          value={value}
          onChange={(event) => onChange(event.target.value as NotificationFilterOption)}
          className='min-w-60 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value='all'>All</option>
          <option value='overspeed'>Overspeed</option>
          <option value='geofence_enter'>Geofence Enter</option>
          <option value='geofence_exit'>Geofence Exit</option>
          <option value='idling'>Idling</option>
          <option value='stop'>Stop</option>
        </select>
      </div>
    </section>
  )
}
