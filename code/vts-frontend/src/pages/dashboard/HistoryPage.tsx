import { useCallback, useEffect, useMemo, useState } from 'react'
import { HistoryFilters, type HistoryFilterPayload } from '@components/history/HistoryFilters'
import { HistoryVehicleTable } from '@components/history/HistoryVehicleTable'
import { historyService } from '@services/historyService'
import type { VehicleHistory } from '../../types/history'

export function HistoryPage() {
  const [vehiclesHistory, setVehiclesHistory] = useState<VehicleHistory[]>([])
  const [filters, setFilters] = useState<HistoryFilterPayload>({ dateRange: 'today' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await historyService.getVehiclesHistory()
        setVehiclesHistory(data)
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const handleFiltersChange = useCallback((nextFilters: HistoryFilterPayload) => {
    setFilters(nextFilters)
  }, [])

  const filteredData = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return vehiclesHistory.filter((row) => {
      const seenAt = new Date(row.lastSeen).getTime()
      const matchesVehicle = filters.vehicleId ? row.vehicleId === filters.vehicleId : true

      let matchesDateRange = true
      if (filters.dateRange === 'today') {
        matchesDateRange = seenAt >= startOfToday.getTime()
      } else if (filters.dateRange === 'last_7_days') {
        matchesDateRange = seenAt >= now.getTime() - 7 * 24 * 60 * 60 * 1000
      } else if (filters.dateRange === 'last_30_days') {
        matchesDateRange = seenAt >= now.getTime() - 30 * 24 * 60 * 60 * 1000
      } else if (filters.dateRange === 'custom') {
        const afterStart = filters.startDate ? seenAt >= new Date(filters.startDate).getTime() : true
        const beforeEnd = filters.endDate ? seenAt <= new Date(filters.endDate).getTime() + 86399999 : true
        matchesDateRange = afterStart && beforeEnd
      }

      return matchesVehicle && matchesDateRange
    })
  }, [filters, vehiclesHistory])

  const vehicleOptions = useMemo(
    () =>
      vehiclesHistory.map((vehicle) => ({
        id: vehicle.vehicleId,
        label: vehicle.vehicleName,
      })),
    [vehiclesHistory],
  )

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicle History</h2>
        <p className='text-sm text-slate-600 dark:text-slate-300'>Track historical activity and journey summary</p>
      </section>

      <HistoryFilters vehicles={vehicleOptions} onChange={handleFiltersChange} />

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading vehicle history...
        </div>
      ) : (
        <HistoryVehicleTable vehiclesHistory={filteredData} />
      )}
    </div>
  )
}
