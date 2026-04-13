import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IdlingFilters, type IdlingFilterPayload } from '@components/events/IdlingFilters'
import { IdlingTable } from '@components/events/IdlingTable'
import { idlingService } from '@services/idlingService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import type { IdlingEvent } from '../../types/events'

export function IdlingPage() {
  const [events, setEvents] = useState<IdlingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<IdlingFilterPayload>({ dateRange: 'today' })
  const requestIdRef = useRef(0)
  const syncVersion = useScopedDataSyncVersion(['events', 'notifications'])

  const loadEvents = useCallback(async (showLoading = true) => {
    const requestId = ++requestIdRef.current
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const data = await idlingService.getIdlingEvents()
      if (requestId !== requestIdRef.current) {
        return
      }
      setEvents(data)
    } finally {
      if (showLoading && requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents, syncVersion])

  const handleFiltersChange = useCallback((nextFilters: IdlingFilterPayload) => {
    setFilters(nextFilters)
  }, [])

  const filteredEvents = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return events.filter((event) => {
      const eventTime = new Date(event.startTime).getTime()
      const matchesVehicle = filters.vehicleId ? event.vehicleId === filters.vehicleId : true
      const matchesDuration = filters.minDuration ? event.duration > filters.minDuration : true

      let matchesDateRange = true
      if (filters.dateRange === 'today') {
        matchesDateRange = eventTime >= startOfToday.getTime()
      } else if (filters.dateRange === 'last_7_days') {
        matchesDateRange = eventTime >= now.getTime() - 7 * 24 * 60 * 60 * 1000
      } else if (filters.dateRange === 'last_30_days') {
        matchesDateRange = eventTime >= now.getTime() - 30 * 24 * 60 * 60 * 1000
      } else if (filters.dateRange === 'custom') {
        const afterStart = filters.startDate ? eventTime >= new Date(filters.startDate).getTime() : true
        const beforeEnd = filters.endDate ? eventTime <= new Date(filters.endDate).getTime() + 86399999 : true
        matchesDateRange = afterStart && beforeEnd
      }

      return matchesVehicle && matchesDuration && matchesDateRange
    })
  }, [events, filters])

  const vehicleOptions = useMemo(() => {
    const map = new Map<string, string>()
    events.forEach((event) => {
      if (!map.has(event.vehicleId)) {
        map.set(event.vehicleId, event.vehicleName)
      }
    })

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [events])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Idling Events</h2>
      </section>

      <IdlingFilters vehicles={vehicleOptions} onChange={handleFiltersChange} initialFilters={filters} />

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading idling events...
        </div>
      ) : (
        <IdlingTable events={filteredEvents} />
      )}
    </div>
  )
}
