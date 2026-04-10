import { useCallback, useEffect, useMemo, useState } from 'react'
import { TripTable } from '@components/trips/TripTable'
import { tripService } from '@services/tripService'
import type { Trip } from '../../types/trip'

type TripDateRange = 'today' | 'last_7_days' | 'last_30_days' | 'custom'

type TripFilterPayload = {
  vehicleId?: string
  dateRange: TripDateRange
  startDate?: string
  endDate?: string
}

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TripFilterPayload>({ dateRange: 'today' })

  const loadTrips = async () => {
    setIsLoading(true)
    try {
      const data = await tripService.getTrips()
      setTrips(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTrips()
  }, [])

  const handleFiltersChange = useCallback((next: TripFilterPayload) => {
    setFilters(next)
  }, [])

  const filteredTrips = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return trips.filter((trip) => {
      const tripTime = new Date(trip.startTime).getTime()
      const matchesVehicle = filters.vehicleId ? trip.vehicleId === filters.vehicleId : true

      let matchesDateRange = true
      if (filters.dateRange === 'today') {
        matchesDateRange = tripTime >= startOfToday.getTime()
      } else if (filters.dateRange === 'last_7_days') {
        matchesDateRange = tripTime >= now.getTime() - 7 * 24 * 60 * 60 * 1000
      } else if (filters.dateRange === 'last_30_days') {
        matchesDateRange = tripTime >= now.getTime() - 30 * 24 * 60 * 60 * 1000
      } else if (filters.dateRange === 'custom') {
        const afterStart = filters.startDate ? tripTime >= new Date(filters.startDate).getTime() : true
        const beforeEnd = filters.endDate ? tripTime <= new Date(filters.endDate).getTime() + 86399999 : true
        matchesDateRange = afterStart && beforeEnd
      }

      return matchesVehicle && matchesDateRange
    })
  }, [filters, trips])

  const vehicleOptions = useMemo(() => {
    const map = new Map<string, string>()
    trips.forEach((trip) => {
      if (!map.has(trip.vehicleId)) {
        map.set(trip.vehicleId, trip.vehicleName)
      }
    })

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [trips])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='mb-3'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Trips</h2>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Browse and inspect historical trip runs</p>
        </div>

        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
          <select
            value={filters.vehicleId ?? ''}
            onChange={(event) =>
              handleFiltersChange({ ...filters, vehicleId: event.target.value || undefined })
            }
            className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          >
            <option value=''>All Vehicles</option>
            {vehicleOptions.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </select>

          <select
            value={filters.dateRange}
            onChange={(event) =>
              handleFiltersChange({ ...filters, dateRange: event.target.value as TripDateRange })
            }
            className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          >
            <option value='today'>Today</option>
            <option value='last_7_days'>Last 7 days</option>
            <option value='last_30_days'>Last 30 days</option>
            <option value='custom'>Custom range</option>
          </select>

          <input
            type='date'
            value={filters.startDate ?? ''}
            onChange={(event) =>
              handleFiltersChange({ ...filters, startDate: event.target.value || undefined })
            }
            disabled={filters.dateRange !== 'custom'}
            className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
          <input
            type='date'
            value={filters.endDate ?? ''}
            onChange={(event) =>
              handleFiltersChange({ ...filters, endDate: event.target.value || undefined })
            }
            disabled={filters.dateRange !== 'custom'}
            className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading trips...
        </div>
      ) : (
        <TripTable trips={filteredTrips} />
      )}
    </div>
  )
}
