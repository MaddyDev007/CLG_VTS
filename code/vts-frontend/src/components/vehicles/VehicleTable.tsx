import { useEffect, useMemo, useState } from 'react'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { EditVehicleModal } from '@components/vehicles/EditVehicleModal'
import { StatusBadge } from '@components/ui/StatusBadge'
import type { Vehicle, VehicleStatus } from '../../types/vehicle'

type SortKey =
  | 'vehicleName'
  | 'registrationNumber'
  | 'status'
  | 'speed'
  | 'deviceId'
  | 'address'
  | 'lastSeen'

type SortDirection = 'asc' | 'desc'

type VehicleTableProps = {
  vehicles: Vehicle[]
  onVehiclesChanged: () => Promise<void> | void
  onDelete?: (vehicle: Vehicle) => void
  pageSize?: number
  initialStatusFilter?: 'all' | VehicleStatus
}

const statusOptions: Array<'all' | VehicleStatus> = ['all', 'moving', 'idling', 'stopped', 'offline']

export function VehicleTable({
  vehicles,
  onVehiclesChanged,
  onDelete,
  pageSize = 8,
  initialStatusFilter = 'all',
}: VehicleTableProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | VehicleStatus>(initialStatusFilter)
  const [sortKey, setSortKey] = useState<SortKey>('lastSeen')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    setStatusFilter(initialStatusFilter)
    setCurrentPage(1)
  }, [initialStatusFilter])

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.vehicleName.toLowerCase().includes(query) ||
        vehicle.registrationNumber.toLowerCase().includes(query) ||
        vehicle.deviceId.toLowerCase().includes(query) ||
        vehicle.address.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'all' ? true : vehicle.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, vehicles])

  const sortedVehicles = useMemo(() => {
    const sorted = [...filteredVehicles]

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

      const compare = String(left).localeCompare(String(right))
      return sortDirection === 'asc' ? compare : -compare
    })

    return sorted
  }, [filteredVehicles, sortDirection, sortKey])

  const totalPages = useMemo(() => {
    if (!sortedVehicles.length) {
      return 1
    }
    return Math.ceil(sortedVehicles.length / pageSize)
  }, [pageSize, sortedVehicles.length])

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedVehicles.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, sortedVehicles])

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
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicles</h2>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Fleet inventory and live state snapshot</p>
        </div>

        <div className='flex w-full flex-col gap-3 sm:flex-row md:w-auto'>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
            placeholder='Search by vehicle, registration, device, address...'
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 sm:min-w-80 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'all' | VehicleStatus)
              setCurrentPage(1)
            }}
            className='rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm capitalize text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          >
            {statusOptions.map((status) => (
              <option key={status} value={status} className='capitalize'>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1100px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('vehicleName')}>
                  Vehicle Name{sortIndicator('vehicleName')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('registrationNumber')}>
                  Registration Number{sortIndicator('registrationNumber')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('speed')}>
                  Speed{sortIndicator('speed')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('deviceId')}>
                  Assigned Device{sortIndicator('deviceId')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('address')}>
                  Address{sortIndicator('address')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('lastSeen')}>
                  Last Seen{sortIndicator('lastSeen')}
                </button>
              </th>
              <th className='px-3 py-2 text-right font-semibold'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVehicles.length ? (
              paginatedVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  className='cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{vehicle.vehicleName}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{vehicle.registrationNumber}</td>
                  <td className='px-3 py-3'>
                    <StatusBadge status={vehicle.status} className='px-2 py-0.5' />
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{vehicle.speed} km/h</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{vehicle.deviceId}</td>
                  <td className='max-w-xs truncate px-3 py-3 text-slate-700 dark:text-slate-200' title={vehicle.address}>
                    {vehicle.address}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(vehicle.lastSeen).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation()
                          setEditingVehicle(vehicle)
                        }}
                        className='inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
                      >
                        <FiEdit size={14} />
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete?.(vehicle)
                        }}
                        className='inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-600 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200'
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No vehicles match the current search/filter.
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

      <EditVehicleModal
        isOpen={Boolean(editingVehicle)}
        vehicle={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onSuccess={onVehiclesChanged}
      />
    </section>
  )
}
