import { useMemo, useState } from 'react'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import { GeofenceMapPreview } from './GeofenceMapPreview'
import type { Geofence } from '../../types/geofence'

type GeofenceListProps = {
  geofences: Geofence[]
  pageSize?: number
  onEdit?: (geofence: Geofence) => void
  onDelete?: (geofence: Geofence) => void
  onSelect?: (geofence: Geofence) => void
  selectedId?: string | null
}

type SortKey = 'name' | 'address' | 'radius' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function GeofenceList({
  geofences,
  pageSize = 8,
  onEdit,
  onDelete,
  onSelect,
  selectedId,
}: GeofenceListProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const showActions = Boolean(onEdit || onDelete)

  const filteredGeofences = useMemo(() => {
    const query = search.trim().toLowerCase()

    return geofences.filter((geofence) => {
      return geofence.name.toLowerCase().includes(query) || geofence.address.toLowerCase().includes(query)
    })
  }, [geofences, search])

  const sortedGeofences = useMemo(() => {
    const sorted = [...filteredGeofences]

    sorted.sort((a, b) => {
      let left: string | number = a[sortKey]
      let right: string | number = b[sortKey]

      if (sortKey === 'createdAt') {
        left = new Date(a.createdAt).getTime()
        right = new Date(b.createdAt).getTime()
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left
      }

      const compare = String(left).localeCompare(String(right))
      return sortDirection === 'asc' ? compare : -compare
    })

    return sorted
  }, [filteredGeofences, sortDirection, sortKey])

  const totalPages = useMemo(() => {
    if (!sortedGeofences.length) {
      return 1
    }

    return Math.ceil(sortedGeofences.length / pageSize)
  }, [pageSize, sortedGeofences.length])

  const paginatedGeofences = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedGeofences.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, sortedGeofences])

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
      <div className='mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Geofences</h2>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Manage geofence boundaries and coverage area</p>
        </div>

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }}
          placeholder='Search by name or address...'
          className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 sm:min-w-80 md:w-96 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1200px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('name')}>
                  Geofence Name{sortIndicator('name')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('address')}>
                  Address{sortIndicator('address')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('radius')}>
                  Radius{sortIndicator('radius')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('createdAt')}>
                  Created At{sortIndicator('createdAt')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>Map Preview</th>
              {showActions ? <th className='px-3 py-2 text-right font-semibold'>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {paginatedGeofences.length ? (
              paginatedGeofences.map((geofence) => (
                <tr
                  key={geofence.id}
                  onClick={() => onSelect?.(geofence)}
                  className={`cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60 ${
                    selectedId === geofence.id
                      ? 'bg-blue-50/70 dark:bg-slate-800/70'
                      : ''
                  }`}
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{geofence.name}</td>
                  <td className='max-w-xs truncate px-3 py-3 text-slate-700 dark:text-slate-200' title={geofence.address}>
                    {geofence.address}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{geofence.radius} m</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(geofence.createdAt).toLocaleString()}
                  </td>
                  <td className='px-3 py-3'>
                    <GeofenceMapPreview lat={geofence.lat} lon={geofence.lon} radius={geofence.radius} />
                  </td>
                  {showActions ? (
                    <td className='px-3 py-3 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {onEdit ? (
                          <button
                            type='button'
                            onClick={(event) => {
                              event.stopPropagation()
                              onEdit(geofence)
                            }}
                            className='inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
                          >
                            <FiEdit size={14} />
                            Edit
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type='button'
                            onClick={(event) => {
                              event.stopPropagation()
                              onDelete(geofence)
                            }}
                            className='inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-600 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200'
                          >
                            <FiTrash2 size={14} />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={showActions ? 6 : 5} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No geofences match the current search.
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
