import { useEffect, useMemo, useState } from 'react'

export type HistoryDateRange = 'today' | 'last_7_days' | 'last_30_days' | 'custom'

export type HistoryFilterPayload = {
  vehicleId?: string
  dateRange: HistoryDateRange
  startDate?: string
  endDate?: string
}

type HistoryFiltersProps = {
  vehicles: Array<{ id: string; label: string }>
  onChange: (filters: HistoryFilterPayload) => void
  initialFilters?: Partial<HistoryFilterPayload>
}

export function HistoryFilters({ vehicles, onChange, initialFilters }: HistoryFiltersProps) {
  const [vehicleId, setVehicleId] = useState(initialFilters?.vehicleId ?? '')
  const [dateRange, setDateRange] = useState<HistoryDateRange>(initialFilters?.dateRange ?? 'today')
  const [startDate, setStartDate] = useState(initialFilters?.startDate ?? '')
  const [endDate, setEndDate] = useState(initialFilters?.endDate ?? '')

  const resolvedFilters = useMemo<HistoryFilterPayload>(() => {
    if (dateRange === 'custom') {
      return {
        vehicleId: vehicleId || undefined,
        dateRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
    }

    return {
      vehicleId: vehicleId || undefined,
      dateRange,
    }
  }, [dateRange, endDate, startDate, vehicleId])

  useEffect(() => {
    onChange(resolvedFilters)
  }, [onChange, resolvedFilters])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
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
          onChange={(event) => setDateRange(event.target.value as HistoryDateRange)}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value='today'>Today</option>
          <option value='last_7_days'>Last 7 days</option>
          <option value='last_30_days'>Last 30 days</option>
          <option value='custom'>Custom range</option>
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
