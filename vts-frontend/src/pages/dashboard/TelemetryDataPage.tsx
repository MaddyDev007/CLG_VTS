import { useCallback, useEffect, useMemo, useState } from 'react'
import { TelemetryFilters, type TelemetryFilterPayload } from '@components/telemetry/TelemetryFilters'
import { TelemetryTable } from '@components/telemetry/TelemetryTable'
import { telemetryService } from '@services/telemetryService'
import type { TelemetryRecord } from '../../types/telemetry'

export function TelemetryDataPage() {
  const [rows, setRows] = useState<TelemetryRecord[]>([])
  const [allRows, setAllRows] = useState<TelemetryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TelemetryFilterPayload>({ dateRange: 'today' })

  useEffect(() => {
    const loadBaseRows = async () => {
      const data = await telemetryService.getTelemetry()
      setAllRows(data)
    }

    void loadBaseRows()
  }, [])

  useEffect(() => {
    const loadFilteredRows = async () => {
      setIsLoading(true)
      try {
        const { deviceId, ...serviceFilters } = filters
        const data = await telemetryService.getTelemetry(serviceFilters)
        const finalRows = deviceId ? data.filter((row) => row.deviceId === deviceId) : data
        setRows(finalRows)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFilteredRows()
  }, [filters])

  const handleFiltersChange = useCallback((nextFilters: TelemetryFilterPayload) => {
    setFilters(nextFilters)
  }, [])

  const vehicleOptions = useMemo(() => {
    const byId = new Map<string, string>()
    allRows.forEach((row) => {
      if (!byId.has(row.vehicleId)) {
        byId.set(row.vehicleId, row.vehicleName)
      }
    })

    return Array.from(byId.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allRows])

  const deviceOptions = useMemo(() => {
    return Array.from(new Set(allRows.map((row) => row.deviceId))).sort((a, b) => a.localeCompare(b))
  }, [allRows])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Telemetry Data</h2>
      </section>

      <TelemetryFilters
        vehicles={vehicleOptions}
        devices={deviceOptions}
        onChange={handleFiltersChange}
        initialFilters={filters}
      />

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading telemetry...
        </div>
      ) : (
        <TelemetryTable rows={rows} />
      )}
    </div>
  )
}
