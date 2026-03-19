import { useEffect, useMemo, useState } from 'react'
import { minutesToMs } from '@utils/time'

export type StopDateRange = 'today' | 'last_7_days' | 'last_30_days' | 'custom'

export type StopFilterPayload = {
  vehicleId?: string
  minDuration?: number
  startDate?: string
  endDate?: string
  dateRange?: StopDateRange
}

type StopFiltersProps = {
  vehicles: Array<{ id: string; label: string }>
  onChange: (filters: StopFilterPayload) => void
  initialFilters?: StopFilterPayload
}

const durationOptions: Array<{ label: string; value: number }> = [
  { label: '>1 minute', value: minutesToMs(1) },
  { label: '>5 minutes', value: minutesToMs(5) },
  { label: '>10 minutes', value: minutesToMs(10) },
  { label: '>30 minutes', value: minutesToMs(30) },
]

export function StopFilters({ vehicles, onChange, initialFilters }: StopFiltersProps) {
  const [vehicleId, setVehicleId] = useState(initialFilters?.vehicleId ?? '')
  const [duration, setDuration] = useState(initialFilters?.minDuration ? String(initialFilters.minDuration) : '')
  const [dateRange, setDateRange] = useState<StopDateRange>(initialFilters?.dateRange ?? 'today')
  const [startDate, setStartDate] = useState(initialFilters?.startDate ?? '')
  const [endDate, setEndDate] = useState(initialFilters?.endDate ?? '')

  const resolvedFilters = useMemo<StopFilterPayload>(() => {
    const base = {
      vehicleId: vehicleId || undefined,
      minDuration: duration ? Number(duration) : undefined,
      dateRange,
    }

    if (dateRange === 'custom') {
      return {
        ...base,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
    }

    const now = new Date()
    let start: Date
    if (dateRange === 'today') {
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
    } else if (dateRange === 'last_7_days') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return {
      ...base,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
    }
  }, [dateRange, duration, endDate, startDate, vehicleId])

  useEffect(() => {
    onChange(resolvedFilters)
  }, [onChange, resolvedFilters])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
        <select
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value=''>All Vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.label}
            </option>
            ))}
        </select>

        <select
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value as StopDateRange)}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value='today'>Today</option>
          <option value='last_7_days'>Last 7 days</option>
          <option value='last_30_days'>Last 30 days</option>
          <option value='custom'>Custom range</option>
        </select>

        <select
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value=''>All Durations</option>
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type='date'
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          disabled={dateRange !== 'custom'}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />

        <input
          type='date'
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          disabled={dateRange !== 'custom'}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>
    </section>
  )
}
