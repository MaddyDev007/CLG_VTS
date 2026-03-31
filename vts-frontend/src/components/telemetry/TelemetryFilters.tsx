import { useEffect, useMemo, useState } from 'react'
import type { TelemetryFilter } from '../../types/telemetry'

export type TelemetryFilterPayload = TelemetryFilter & {
  deviceId?: string
  dateRange?: TelemetryDateRange
}

export type TelemetryDateRange = 'today' | 'last_7_days' | 'last_30_days' | 'custom'

type TelemetryFiltersProps = {
  vehicles: Array<{ id: string; label: string }>
  devices: string[]
  onChange: (filters: TelemetryFilterPayload) => void
  initialFilters?: TelemetryFilterPayload
  disabled?: boolean
}

type IgnitionOption = 'all' | 'on' | 'off'

export function TelemetryFilters({ vehicles, devices, onChange, initialFilters, disabled = false }: TelemetryFiltersProps) {
  const [vehicleId, setVehicleId] = useState(initialFilters?.vehicleId ?? '')
  const [deviceId, setDeviceId] = useState(initialFilters?.deviceId ?? '')
  const [dateRange, setDateRange] = useState<TelemetryDateRange>(initialFilters?.dateRange ?? 'today')
  const [ignition, setIgnition] = useState<IgnitionOption>(
    initialFilters?.ignition === true ? 'on' : initialFilters?.ignition === false ? 'off' : 'all',
  )
  const [startDate, setStartDate] = useState(initialFilters?.startDate ?? '')
  const [endDate, setEndDate] = useState(initialFilters?.endDate ?? '')

  const resolvedFilters = useMemo<TelemetryFilterPayload>(() => {
    const normalizedIgnition = ignition === 'all' ? undefined : ignition === 'on'
    const base = {
      vehicleId: vehicleId || undefined,
      deviceId: deviceId || undefined,
      ignition: normalizedIgnition,
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
  }, [dateRange, deviceId, endDate, ignition, startDate, vehicleId])

  useEffect(() => {
    onChange(resolvedFilters)
  }, [onChange, resolvedFilters])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6'>
        <select
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          disabled={disabled}
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
          onChange={(event) => setDateRange(event.target.value as TelemetryDateRange)}
          disabled={disabled}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value='today'>Today</option>
          <option value='last_7_days'>Last 7 days</option>
          <option value='last_30_days'>Last 30 days</option>
          <option value='custom'>Custom range</option>
        </select>

        <select
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
          disabled={disabled}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value=''>All Devices</option>
          {devices.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>

        <select
          value={ignition}
          onChange={(event) => setIgnition(event.target.value as IgnitionOption)}
          disabled={disabled}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        >
          <option value='all'>All</option>
          <option value='on'>Ignition ON</option>
          <option value='off'>Ignition OFF</option>
        </select>

        <input
          type='date'
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          disabled={disabled || dateRange !== 'custom'}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />

        <input
          type='date'
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          disabled={disabled || dateRange !== 'custom'}
          className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>
    </section>
  )
}
