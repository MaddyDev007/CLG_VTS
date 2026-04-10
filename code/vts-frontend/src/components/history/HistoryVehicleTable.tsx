import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pagination } from '@components/ui/Pagination'
import type { VehicleHistory } from '../../types/history'

type SortKey = 'vehicleName' | 'lastLocation' | 'lastSeen' | 'totalDistance' | 'totalTrips'
type SortDirection = 'asc' | 'desc'

type HistoryVehicleTableProps = {
  vehiclesHistory: VehicleHistory[]
  pageSize?: number
}

export function HistoryVehicleTable({ vehiclesHistory, pageSize = 10 }: HistoryVehicleTableProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('lastSeen')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(pageSize)

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return vehiclesHistory
    }

    return vehiclesHistory.filter((row) => row.vehicleName.toLowerCase().includes(query))
  }, [search, vehiclesHistory])

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows]
    sorted.sort((a, b) => {
      let left: string | number = a[sortKey]
      let right: string | number = b[sortKey]

      if (sortKey === 'lastSeen') {
        left = new Date(a.lastSeen).getTime()
        right = new Date(b.lastSeen).getTime()
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left
      }

      const comparison = String(left).localeCompare(String(right))
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredRows, sortDirection, sortKey])

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * limit
    return sortedRows.slice(startIndex, startIndex + limit)
  }, [limit, page, sortedRows])

  const handleSort = (key: SortKey) => {
    setPage(1)
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
      <div className='mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicle History</h2>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Historical summary per vehicle</p>
        </div>

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder='Search by vehicle name...'
          className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 sm:max-w-xs dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[980px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('vehicleName')}>
                  Vehicle Name{sortIndicator('vehicleName')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('lastLocation')}>
                  Last Location{sortIndicator('lastLocation')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('lastSeen')}>
                  Last Seen{sortIndicator('lastSeen')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('totalDistance')}>
                  Total Distance{sortIndicator('totalDistance')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('totalTrips')}>
                  Total Trips{sortIndicator('totalTrips')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length ? (
              paginatedRows.map((row) => (
                <tr
                  key={row.vehicleId}
                  onClick={() => navigate(`/history/${row.vehicleId}`)}
                  className='cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{row.vehicleName}</td>
                  <td className='max-w-sm truncate px-3 py-3 text-slate-700 dark:text-slate-200' title={row.lastLocation}>
                    {row.lastLocation}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(row.lastSeen).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{row.totalDistance} km</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{row.totalTrips}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No history records match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        limit={limit}
        total={sortedRows.length}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
      />
    </section>
  )
}
