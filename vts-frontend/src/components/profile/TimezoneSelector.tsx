type TimezoneSelectorProps = {
  value: string
  onChange: (value: string) => void
}

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London']

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <label className='space-y-1'>
      <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Timezone</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
      >
        {TIMEZONES.map((timezone) => (
          <option key={timezone} value={timezone}>
            {timezone}
          </option>
        ))}
      </select>
    </label>
  )
}
