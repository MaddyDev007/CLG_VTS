import { useEffect, useMemo, useState } from 'react'
import { vehicleService } from '@services/vehicleService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { batteryMvToPercent } from '@utils/telemetryFormat'
import type { TelemetryPoint } from '../../types/vehicle'

type TelemetryTableProps = {
  vehicleId: string
  pageSize?: number
}

function formatSignalDbm(signal: number): string {
  if (!Number.isFinite(signal)) {
    return 'N/A'
  }
  return `${Math.abs(signal)} dBm`
}

export function TelemetryTable({ vehicleId, pageSize = 8 }: TelemetryTableProps) {
  const [rows, setRows] = useState<TelemetryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const syncVersion = useScopedDataSyncVersion(['telemetry'])

  useEffect(() => {
    const loadTelemetry = async () => {
      setIsLoading(true)
      const nextRows = await vehicleService.getVehicleTelemetry(vehicleId)
      setRows(nextRows)
      setCurrentPage(1)
      setIsLoading(false)
    }

    void loadTelemetry()
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

  const previousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  const nextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <header className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Telemetry History</h3>
        <p className='text-xs text-slate-600 dark:text-slate-300'>Vehicle: {vehicleId}</p>
      </header>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[980px] border-collapse text-sm'>
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '120px' }} />
          </colgroup>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>Timestamp</th>
              <th className='px-3 py-2 font-semibold'>Address</th>
              <th className='px-3 py-2 font-semibold'>Speed</th>
              <th className='px-3 py-2 font-semibold'>Battery</th>
              <th className='px-3 py-2 font-semibold'>Signal</th>
              <th className='px-3 py-2 font-semibold'>Ignition</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className='px-3 py-4 text-slate-600 dark:text-slate-300'>
                  Loading telemetry...
                </td>
              </tr>
            ) : paginatedRows.length ? (
              paginatedRows.map((row, index) => (
                <tr
                  key={`${row.timestamp}-${index}`}
                  className='border-b border-slate-200/70 dark:border-slate-700/70'
                >
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(row.timestamp).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {row.address?.trim() ? row.address : 'Unknown location'}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{row.speed} km/h</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{batteryMvToPercent(row.battery)}%</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {formatSignalDbm(row.signal)}
                  </td>
                  <td className='px-3 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.ignition
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-500/30 dark:text-slate-200'
                      }`}
                    >
                      {row.ignition ? 'On' : 'Off'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className='px-3 py-4 text-slate-600 dark:text-slate-300'>
                  No telemetry data available.
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
            onClick={previousPage}
            disabled={currentPage === 1}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Previous
          </button>
          <button
            type='button'
            onClick={nextPage}
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
