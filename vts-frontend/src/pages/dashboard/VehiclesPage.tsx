import { useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Pagination } from '@components/ui/Pagination'
import { AddVehicleModal } from '@components/vehicles/AddVehicleModal'
import { VehicleCard } from '@components/vehicles/VehicleCard'
import { vehicleService } from '@services/vehicleService'
import { useAuthStore } from '@store/authStore'
import { canCreate } from '@utils/permissions'
import type { Vehicle, VehicleStatus } from '../../types/vehicle'

const statusOptions: Array<'all' | VehicleStatus> = ['all', 'moving', 'idling', 'stopped', 'offline']

export function VehiclesPage() {
  const role = useAuthStore((state) => state.role)
  const canCreateVehicle = canCreate(role)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | VehicleStatus>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(8)
  const [total, setTotal] = useState(0)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialStatusFilter = useMemo<'all' | VehicleStatus>(() => {
    const status = searchParams.get('status')
    if (!status || status === 'all') {
      return 'all'
    }
    if (status === 'moving' || status === 'idling' || status === 'stopped' || status === 'offline') {
      return status
    }
    return 'all'
  }, [searchParams])

  useEffect(() => {
    setStatusFilter(initialStatusFilter)
  }, [initialStatusFilter])

  const loadVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await vehicleService.getVehiclesPage({
        page,
        limit,
        search,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setVehicles(response.data)
      setTotal(response.total)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadVehicles()
  }, [limit, page, search, statusFilter])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicles Status</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Real-time status updates from connected vehicle devices.</p>
          </div>

          {canCreateVehicle ? (
            <button
              type='button'
              onClick={() => setIsAddModalOpen(true)}
              className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              <FiPlus size={16} />
              Add Vehicle
            </button>
          ) : null}
        </div>
        <div className='mt-4 flex flex-col gap-3 md:flex-row md:items-center'>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder='Search by vehicle, registration, address...'
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 md:max-w-sm dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'all' | VehicleStatus)
              setPage(1)
            }}
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm capitalize text-slate-900 outline-none transition focus:border-blue-500 md:w-56 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          >
            {statusOptions.map((status) => (
              <option key={status} value={status} className='capitalize'>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading vehicles...
        </div>
      ) : (
        <div className='w-full space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              vehicle={{
                id: vehicle.id,
                name: vehicle.vehicleName,
                speed: vehicle.speed,
                messageTime: vehicle.lastSeen,
                geofence: vehicle.geofenceName ?? undefined,
                address: vehicle.address,
                status: vehicle.status,
                assignmentStatus: vehicle.deviceId === 'unassigned' ? 'unassigned' : 'assigned',
              }}
            />
          ))}
          </div>
          {vehicles.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
              No vehicles match the current status filter.
            </div>
          ) : null}
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit)
              setPage(1)
            }}
          />
        </div>
      )}

      {canCreateVehicle ? (
        <AddVehicleModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadVehicles}
        />
      ) : null}
    </div>
  )
}
