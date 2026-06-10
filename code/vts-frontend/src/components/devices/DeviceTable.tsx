import { useMemo, useState } from 'react'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import type { Device } from '../../types/device'

type SortKey =
  | 'deviceId'
  | 'imei'
  | 'ignitionOnIntervalMs'
  | 'ignitionOffIntervalMs'
  | 'status'
  | 'assignedVehicleName'
  | 'createdAt'
  | 'updatedAt'

type SortDirection = 'asc' | 'desc'

type DeviceTableProps = {
  devices: Device[]
  pageSize?: number
  onEdit?: (device: Device) => void
  onDelete?: (device: Device) => void
}

export function DeviceTable({ devices, pageSize = 8, onEdit, onDelete }: DeviceTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase()

    return devices.filter((device) => {
      const assignedVehicle = device.assignedVehicleName ?? 'Unassigned'
      return (
        device.deviceId.toLowerCase().includes(query) ||
        device.imei.toLowerCase().includes(query) ||
        String(device.ignitionOnIntervalMs ?? device.telemetryIntervalMs).includes(query) ||
        String(device.ignitionOffIntervalMs ?? device.telemetryIntervalMs).includes(query) ||
        device.status.toLowerCase().includes(query) ||
        assignedVehicle.toLowerCase().includes(query)
      )
    })
  }, [devices, search])

  const sortedDevices = useMemo(() => {
    const sorted = [...filteredDevices]

    sorted.sort((a, b) => {
      let left: string | number = a[sortKey] ?? ''
      let right: string | number = b[sortKey] ?? ''

      if (sortKey === 'createdAt' || sortKey === 'updatedAt') {
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
  }, [filteredDevices, sortDirection, sortKey])

  const totalPages = useMemo(() => {
    if (!sortedDevices.length) {
      return 1
    }

    return Math.ceil(sortedDevices.length / pageSize)
  }, [pageSize, sortedDevices.length])

  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedDevices.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, sortedDevices])

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
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Devices</h2>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Device inventory and assignments</p>
        </div>

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }}
          placeholder='Search by device name, IMEI, interval, status, vehicle...'
          className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 sm:min-w-80 md:w-96 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1200px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('deviceId')}>
                  Device Name{sortIndicator('deviceId')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('imei')}>
                  IMEI{sortIndicator('imei')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('ignitionOnIntervalMs')}>
                  Ignition ON{sortIndicator('ignitionOnIntervalMs')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('ignitionOffIntervalMs')}>
                  Ignition OFF{sortIndicator('ignitionOffIntervalMs')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('assignedVehicleName')}>
                  Assigned Vehicle{sortIndicator('assignedVehicleName')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('createdAt')}>
                  Created At{sortIndicator('createdAt')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('updatedAt')}>
                  Updated At{sortIndicator('updatedAt')}
                </button>
              </th>
              <th className='px-3 py-2 text-right font-semibold'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDevices.length ? (
              paginatedDevices.map((device) => (
                <tr
                  key={device.id}
                  className='border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{device.deviceId}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{device.imei}</td>
                  <td className='px-3 py-3'>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        device.status === 'assigned'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-500/30 dark:text-slate-200'
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {(device.ignitionOnIntervalMs ?? device.telemetryIntervalMs).toLocaleString()} ms
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {(device.ignitionOffIntervalMs ?? device.telemetryIntervalMs).toLocaleString()} ms
                  </td>
                  <td className='max-w-xs truncate px-3 py-3 text-slate-700 dark:text-slate-200' title={device.assignedVehicleName ?? 'Unassigned'}>
                    {device.assignedVehicleName ?? 'Unassigned'}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(device.createdAt).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {new Date(device.updatedAt).toLocaleString()}
                  </td>
                  <td className='px-3 py-3 text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <button
                        type='button'
                        onClick={() => onEdit?.(device)}
                        className='inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
                      >
                        <FiEdit size={14} />
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => onDelete?.(device)}
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
                <td colSpan={9} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No devices match the current search.
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
