import { useMemo, useState } from 'react'
import { formatDuration } from '@utils/time'
import { useNavigate } from 'react-router-dom'
import { Pagination } from '@components/ui/Pagination'
import type { IdlingEvent } from '../../types/events'

type SortKey = 'vehicleName' | 'duration' | 'startTime' | 'endTime' | 'location'
type SortDirection = 'asc' | 'desc'

type IdlingTableProps = {
  events: IdlingEvent[]
}

const resolveLocation = (location: string) => (location.trim().length > 0 ? location : 'Location unavailable')

export function IdlingTable({ events }: IdlingTableProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('startTime')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return events
    }

    return events.filter((event) => event.vehicleName.toLowerCase().includes(query))
  }, [events, search])

  const sortedEvents = useMemo(() => {
    const sorted = [...filteredEvents]
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
  }, [filteredEvents, sortDirection, sortKey])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedEvents.length / limit)), [sortedEvents.length, limit])
  const safePage = Math.min(page, totalPages)

  const paginatedEvents = useMemo(() => {
    const startIndex = (safePage - 1) * limit
    return sortedEvents.slice(startIndex, startIndex + limit)
  }, [safePage, limit, sortedEvents])

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
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Idling Events</h2>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Idle duration incidents and timeline</p>
        </div>

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder='Search by vehicle...'
          className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 md:w-72 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1000px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('vehicleName')}>
                  Vehicle Name{sortIndicator('vehicleName')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('duration')}>
                  Idle Duration{sortIndicator('duration')}
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
                <button type='button' onClick={() => handleSort('location')}>
                  Location{sortIndicator('location')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.length ? (
              paginatedEvents.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => navigate(`/idling/${event.id}`)}
                  className='cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{event.vehicleName}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {formatDuration(event.duration)}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{new Date(event.startTime).toLocaleString()}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{new Date(event.endTime).toLocaleString()}</td>
                  <td
                    className='max-w-xs truncate px-3 py-3 text-slate-700 dark:text-slate-200'
                    title={resolveLocation(event.location)}
                  >
                    {resolveLocation(event.location)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No idling events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        limit={limit}
        total={sortedEvents.length}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
      />
    </section>
  )
}
