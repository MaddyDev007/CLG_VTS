import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistance, formatDurationList } from '@utils/tripFormat'
import type { Trip } from '../../types/trip'

type SortKey =
  | 'vehicleName'
  | 'startLocation'
  | 'endLocation'
  | 'startTime'
  | 'endTime'
  | 'duration'
  | 'distance'

type SortDirection = 'asc' | 'desc'

type TripTableProps = {
  trips: Trip[]
  pageSize?: number
}

const resolveLocation = (location: string) => (location.trim().length > 0 ? location : 'Location unavailable')

export function TripTable({ trips, pageSize = 8 }: TripTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('startTime')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const sortedTrips = useMemo(() => {
    const sorted = [...trips]

    sorted.sort((a, b) => {
      let left: string | number = a[sortKey]
      let right: string | number = b[sortKey]

      if (sortKey === 'startTime' || sortKey === 'endTime') {
        left = new Date(a[sortKey]).getTime()
        right = new Date(b[sortKey]).getTime()
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left
      }

      const compare = String(left).localeCompare(String(right))
      return sortDirection === 'asc' ? compare : -compare
    })

    return sorted
  }, [sortDirection, sortKey, trips])

  const totalPages = useMemo(() => {
    if (!sortedTrips.length) {
      return 1
    }
    return Math.ceil(sortedTrips.length / pageSize)
  }, [pageSize, sortedTrips.length])

  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedTrips.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, sortedTrips])

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

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1200px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('vehicleName')}>
                  Vehicle Name{sortIndicator('vehicleName')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('startLocation')}>
                  Start Location{sortIndicator('startLocation')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('endLocation')}>
                  End Location{sortIndicator('endLocation')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('startTime')}>
                  Start Time{sortIndicator('startTime')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('endTime')}>
                  End Time{sortIndicator('endTime')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('duration')}>
                  Duration{sortIndicator('duration')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('distance')}>
                  Distance{sortIndicator('distance')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrips.length ? (
              paginatedTrips.map((trip) => (
                <tr
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className='cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{trip.vehicleName}</td>
                  <td
                    className='max-w-xs truncate px-3 py-3 text-slate-700 dark:text-slate-200'
                    title={resolveLocation(trip.startLocation)}
                  >
                    {resolveLocation(trip.startLocation)}
                  </td>
                  <td
                    className='max-w-xs truncate px-3 py-3 text-slate-700 dark:text-slate-200'
                    title={resolveLocation(trip.endLocation)}
                  >
                    {resolveLocation(trip.endLocation)}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(trip.startTime).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(trip.endTime).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {formatDurationList(trip.duration)}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {formatDistance(trip.distance)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No trips match the current filters.
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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Previous
          </button>
          <button
            type='button'
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
