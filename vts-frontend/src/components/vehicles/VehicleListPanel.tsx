import { useMemo, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { StatusBadge } from '@components/ui/StatusBadge'
import type { Vehicle, VehicleStatus } from '../../types/vehicle'

type VehicleListPanelProps = {
  vehicles: Vehicle[]
  selectedVehicleId?: string | null
  onVehicleSelect: (vehicle: Vehicle) => void
}

const statusFilters: VehicleStatus[] = ['moving', 'idling', 'stopped', 'offline']

export function VehicleListPanel({ vehicles, selectedVehicleId, onVehicleSelect }: VehicleListPanelProps) {
  const [search, setSearch] = useState('')
  const [activeStatuses, setActiveStatuses] = useState<VehicleStatus[]>(statusFilters)

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return vehicles
      .filter((vehicle) => {
        const matchesStatus =
          activeStatuses.length === statusFilters.length || activeStatuses.includes(vehicle.status)
        const matchesSearch =
          vehicle.vehicleName.toLowerCase().includes(query) ||
          vehicle.registrationNumber.toLowerCase().includes(query)

        return matchesStatus && matchesSearch
      })
      .slice()
      .sort((left, right) => {
        const nameCompare = left.vehicleName.localeCompare(right.vehicleName, undefined, { sensitivity: 'base' })
        if (nameCompare !== 0) {
          return nameCompare
        }
        return left.registrationNumber.localeCompare(right.registrationNumber, undefined, { sensitivity: 'base' })
      })
  }, [activeStatuses, search, vehicles])

  const toggleStatus = (status: VehicleStatus) => {
    setActiveStatuses((current) => {
      if (current.includes(status)) {
        const next = current.filter((item) => item !== status)
        return next.length === 0 ? statusFilters : next
      }

      return [...current, status]
    })
  }

  const isAllSelected = activeStatuses.length === statusFilters.length

  const toggleAll = () => {
    setActiveStatuses(statusFilters)
  }

  return (
    <section className='flex h-full min-h-[420px] flex-col rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <header className='mb-3'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicle List</h2>
      </header>

      <div className='relative mb-3'>
        <FiSearch className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Search by vehicle or registration...'
          className='w-full rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>

      <div className='mb-3 flex flex-wrap gap-2'>
        <button
          key='all'
          type='button'
          onClick={() => toggleAll()}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            isAllSelected
              ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {statusFilters.map((status) => {
          const active = isAllSelected ? false : activeStatuses.includes(status)

          return (
            <button
              key={status}
              type='button'
              onClick={() => toggleStatus(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                active
                  ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          )
        })}
      </div>

      <div className='flex-1 overflow-y-auto pr-1'>
        <ul className='space-y-2'>
          {filteredVehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id

            return (
              <li key={vehicle.id}>
                <button
                  type='button'
                  onClick={() => onVehicleSelect(vehicle)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm dark:border-[#38bdf8] dark:bg-slate-900/90'
                      : 'border-slate-200 bg-white/75 hover:border-blue-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-500'
                  }`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-sm font-semibold text-slate-900 dark:text-slate-100'>{vehicle.vehicleName}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>{vehicle.registrationNumber}</p>
                    </div>
                    <StatusBadge status={vehicle.status} className='px-2 py-0.5' />
                  </div>

                  <div className='mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300'>
                    <p>Speed: {vehicle.speed} km/h</p>
                    <p className='col-span-2'>
                      Geofence: {vehicle.geofenceName?.trim() ? vehicle.geofenceName : 'Not in Any Geofence'}
                    </p>
                    <p className='col-span-2'>Address: {vehicle.address}</p>
                    <p className='col-span-2'>Last seen: {new Date(vehicle.lastSeen).toLocaleString()}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {filteredVehicles.length === 0 ? (
          <p className='mt-4 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400'>
            No vehicles match the current search/filter.
          </p>
        ) : null}
      </div>
    </section>
  )
}
