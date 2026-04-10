import type { NotificationPreferences } from '../../types/profile'

type NotificationPreferencesProps = {
  value: NotificationPreferences
  onChange: (next: NotificationPreferences) => void
}

export function NotificationPreferences({ value, onChange }: NotificationPreferencesProps) {
  const toggle = (key: keyof NotificationPreferences) => {
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
      {(
        [
          ['overspeed', 'Overspeed alerts'],
          ['idling', 'Idling too long alerts'],
          ['geofence', 'Geofence entry/exit alerts'],
          ['stop', 'Stop arrival alerts'],
          ['deviceOffline', 'Device offline alerts'],
        ] as Array<[keyof NotificationPreferences, string]>
      ).map(([key, label]) => (
        <label
          key={key}
          className='flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200'
        >
          <span>{label}</span>
          <input
            type='checkbox'
            checked={value[key]}
            onChange={() => toggle(key)}
            className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-900'
          />
        </label>
      ))}
    </div>
  )
}
