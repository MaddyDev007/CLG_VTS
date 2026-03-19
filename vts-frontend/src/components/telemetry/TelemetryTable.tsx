import { memo, useEffect, useMemo, useState } from 'react'
import { Pagination } from '@components/ui/Pagination'
import { batteryMvToPercent, signalDbmToBars } from '@utils/telemetryFormat'
import type { TelemetryRecord } from '../../types/telemetry'

type SortKey =
  | 'vehicleName'
  | 'deviceId'
  | 'speed'
  | 'ignition'
  | 'battery'
  | 'signal'
  | 'address'
  | 'timestamp'

type SortDirection = 'asc' | 'desc'

type TelemetryTableProps = {
  rows: TelemetryRecord[]
}

type TelemetryRowProps = {
  row: TelemetryRecord
}

function batteryBadgeClasses(level: number): string {
  if (level > 70) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
  }

  if (level >= 30) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
  }

  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
}

const TelemetryRow = memo(function TelemetryRow({ row }: TelemetryRowProps) {
  const activeBars = signalDbmToBars(row.signal)
  const signalLabel = Number.isFinite(row.signal) ? `${Math.abs(row.signal)} dBm` : 'N/A'
  const batteryPercent = batteryMvToPercent(row.battery)
  const rawJson = JSON.stringify(row, null, 2)

  return (
    <tr className='border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'>
      <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{row.vehicleName}</td>
      <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{row.deviceId}</td>
      <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{row.speed} km/h</td>
      <td className='px-3 py-3'>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            row.ignition
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
          }`}
        >
          {row.ignition ? 'ON' : 'OFF'}
        </span>
      </td>
      <td className='px-3 py-3'>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${batteryBadgeClasses(
            batteryPercent,
          )}`}
        >
          {batteryPercent}%
        </span>
      </td>
      <td className='px-3 py-3'>
        <div className='inline-flex items-end gap-0.5' title={signalLabel}>
          {Array.from({ length: 4 }, (_, index) => {
            const isActive = index < activeBars
            const height = 6 + index * 3
            return (
              <span
                key={`${row.id}-bar-${index}`}
                className={`w-1 rounded-sm ${isActive ? 'bg-blue-600 dark:bg-[#38bdf8]' : 'bg-slate-300 dark:bg-slate-600'}`}
                style={{ height }}
              />
            )
          })}
        </div>
        <span className='ml-2 text-xs text-slate-500 dark:text-slate-400'>{signalLabel}</span>
      </td>
      <td className='max-w-sm truncate px-3 py-3 text-slate-700 dark:text-slate-200' title={row.address}>
        {row.address?.trim() ? row.address : 'Unknown location'}
      </td>
      <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{new Date(row.timestamp).toLocaleString()}</td>
      <td className='px-3 py-3'>
        <pre className='max-h-24 max-w-md overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-[11px] leading-4 text-slate-700 dark:bg-slate-900 dark:text-slate-200'>
          {rawJson}
        </pre>
      </td>
    </tr>
  )
})

export function TelemetryTable({ rows }: TelemetryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(25)

  const sortedRows = useMemo(() => {
    const sorted = [...rows]

    sorted.sort((a, b) => {
      let left: string | number | boolean = a[sortKey]
      let right: string | number | boolean = b[sortKey]

      if (sortKey === 'timestamp') {
        left = new Date(a.timestamp).getTime()
        right = new Date(b.timestamp).getTime()
      }

      if (typeof left === 'boolean' && typeof right === 'boolean') {
        return sortDirection === 'asc' ? Number(left) - Number(right) : Number(right) - Number(left)
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left
      }

      const compare = String(left).localeCompare(String(right))
      return sortDirection === 'asc' ? compare : -compare
    })

    return sorted
  }, [rows, sortDirection, sortKey])

  const totalPages = useMemo(() => {
    if (!sortedRows.length) {
      return 1
    }
    return Math.ceil(sortedRows.length / limit)
  }, [limit, sortedRows.length])

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * limit
    return sortedRows.slice(startIndex, startIndex + limit)
  }, [currentPage, limit, sortedRows])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleSort = (key: SortKey) => {
    setCurrentPage(1)
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection('asc')
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return ''
    }
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  const safeCurrentPage = Math.min(currentPage, totalPages)

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1500px] border-collapse text-sm'>
          <colgroup>
            <col style={{ width: '160px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '160px' }} />
            <col />
            <col style={{ width: '190px' }} />
            <col style={{ width: '260px' }} />
          </colgroup>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('vehicleName')}>
                  Vehicle{sortIndicator('vehicleName')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('deviceId')}>
                  Device{sortIndicator('deviceId')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('speed')}>
                  Speed{sortIndicator('speed')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('ignition')}>
                  Ignition{sortIndicator('ignition')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('battery')}>
                  Battery{sortIndicator('battery')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('signal')}>
                  Signal{sortIndicator('signal')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('address')}>
                  Location{sortIndicator('address')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('timestamp')}>
                  Timestamp{sortIndicator('timestamp')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>Raw Data</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length ? (
              paginatedRows.map((row) => <TelemetryRow key={row.id} row={row} />)
            ) : (
              <tr>
                <td colSpan={9} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No telemetry rows available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safeCurrentPage}
        limit={limit}
        total={sortedRows.length}
        onPageChange={setCurrentPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setCurrentPage(1)
        }}
      />
    </section>
  )
}
