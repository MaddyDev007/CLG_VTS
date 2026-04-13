import { useEffect, useMemo, useState } from 'react'
import { vehicleService } from '@services/vehicleService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import type { TelemetryPoint, Trip } from '../../types/vehicle'

type HistoryRow = {
  id: string
  timestamp: string
  event: string
  details: string
}

type HistoryTableProps = {
  vehicleId: string
  pageSize?: number
}

export function HistoryTable({ vehicleId, pageSize = 8 }: HistoryTableProps) {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const syncVersion = useScopedDataSyncVersion(['telemetry', 'trips'])

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      const [trips, telemetry] = await Promise.all([
        vehicleService.getVehicleTrips(vehicleId),
        vehicleService.getVehicleTelemetry(vehicleId),
      ])

      const mappedRows = mapHistoryRows(trips, telemetry)
      setRows(mappedRows)
      setCurrentPage(1)
      setIsLoading(false)
    }

    void loadHistory()
  }, [vehicleId, syncVersion])

  const totalPages = useMemo(() => {
    if (!rows.length) {
      return 1
    }

    return Math.ceil(rows.length / pageSize)
  }, [pageSize, rows.length])

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return rows.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, rows])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <header className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>History</h3>
        <p className='text-xs text-slate-600 dark:text-slate-300'>Vehicle: {vehicleId}</p>
      </header>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[760px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>Timestamp</th>
              <th className='px-3 py-2 font-semibold'>Event</th>
              <th className='px-3 py-2 font-semibold'>Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className='px-3 py-4 text-slate-600 dark:text-slate-300'>
                  Loading history...
                </td>
              </tr>
            ) : paginatedRows.length ? (
              paginatedRows.map((row) => (
                <tr key={row.id} className='border-b border-slate-200/70 dark:border-slate-700/70'>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(row.timestamp).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{row.event}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{row.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className='px-3 py-4 text-slate-600 dark:text-slate-300'>
                  No history available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className='mt-4 flex items-center justify-between'>
        <p className='text-xs text-slate-600 dark:text-slate-300'>
          Page {currentPage} of {totalPages}
        </p>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Previous
          </button>
          <button
            type='button'
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage >= totalPages}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  )
}

function mapHistoryRows(trips: Trip[], telemetry: TelemetryPoint[]): HistoryRow[] {
  const tripRows: HistoryRow[] = trips.flatMap((trip) => [
    {
      id: `${trip.id}-start`,
      timestamp: trip.startTime,
      event: 'Trip Started',
      details: `Trip ${trip.id} started`,
    },
    {
      id: `${trip.id}-end`,
      timestamp: trip.endTime,
      event: 'Trip Ended',
      details: `Distance ${trip.distance.toFixed(1)} km | Max speed ${trip.maxSpeed} km/h`,
    },
  ])

  const telemetryRows: HistoryRow[] = telemetry.slice(-20).map((point, index) => ({
    id: `tel-${point.timestamp}-${index}`,
    timestamp: point.timestamp,
    event: 'Telemetry Update',
    details: `Speed ${point.speed} km/h | Ignition ${point.ignition ? 'On' : 'Off'}`,
  }))

  return [...tripRows, ...telemetryRows].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}
