import { useEffect, useState } from 'react'
import { FiPlus, FiX } from 'react-icons/fi'
import { DeleteRouteDialog } from '@components/routes/DeleteRouteDialog'
import { EditRouteModal } from '@components/routes/EditRouteModal'
import { RouteForm } from '@components/routes/RouteForm'
import { RoutesTable } from '@components/routes/RoutesTable'
import { routeService } from '@services/routeService'
import { vehicleService } from '@services/vehicleService'
import { useAuthStore } from '@store/authStore'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { canCreate, canDelete, canEdit } from '@utils/permissions'
import type { Route } from '../../types/route'
import type { Vehicle } from '../../types/vehicle'

export function RoutesPage() {
  const role = useAuthStore((state) => state.role)
  const canCreateRoute = canCreate(role)
  const canEditRoute = canEdit(role)
  const canDeleteRoute = canDelete(role)
  const [routes, setRoutes] = useState<Route[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const syncVersion = useScopedDataSyncVersion(['routes', 'vehicles'])

  const loadRoutes = async () => {
    setIsLoading(true)
    try {
      const [routesData, vehiclesData] = await Promise.all([
        routeService.getRoutes(),
        vehicleService.getVehicles({ page: 1, limit: 500 }),
      ])
      setRoutes(routesData)
      setVehicles(vehiclesData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRoutes()
  }, [syncVersion])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Routes</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Manage route definitions and assigned vehicles</p>
          </div>

          {canCreateRoute ? (
            <button
              type='button'
              onClick={() => setIsCreateModalOpen(true)}
              className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              <FiPlus size={16} />
              Create Route
            </button>
          ) : null}
        </div>

        <div className='mt-3'>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Search by route name or assigned vehicle...'
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 md:max-w-md dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading routes...
        </div>
      ) : (
        <RoutesTable
          routes={routes}
          vehicles={vehicles}
          searchTerm={searchTerm}
          onAssign={canEditRoute ? async (vehicleId, routeId) => {
            await vehicleService.updateVehicleRoute(vehicleId, routeId)
            await loadRoutes()
          } : undefined}
          onRemove={canEditRoute ? async (vehicleId) => {
            await vehicleService.updateVehicleRoute(vehicleId, null)
            await loadRoutes()
          } : undefined}
          onEdit={canEditRoute ? (route) => {
            setSelectedRoute(route)
            setIsEditModalOpen(true)
          } : undefined}
          onDelete={canDeleteRoute ? (route) => {
            setSelectedRoute(route)
            setIsDeleteDialogOpen(true)
          } : undefined}
        />
      )}

      {canCreateRoute && isCreateModalOpen ? (
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4'>
          <div className='relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/30 bg-white  shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
            <button
              type='button'
              onClick={() => setIsCreateModalOpen(false)}
              className='absolute z-10 right-7 top-5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
              aria-label='Close create route modal'
            >
              <FiX size={16} />
            </button>
            <RouteForm
              isOpen={isCreateModalOpen}
              onCancel={() => setIsCreateModalOpen(false)}
              onSuccess={async () => {
                await loadRoutes()
                setIsCreateModalOpen(false)
              }}
            />
          </div>
        </div>
      ) : null}

      {canEditRoute ? (
        <EditRouteModal
          route={selectedRoute}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedRoute(null)
          }}
          onSuccess={loadRoutes}
        />
      ) : null}

      {canDeleteRoute ? (
        <DeleteRouteDialog
          route={selectedRoute}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setSelectedRoute(null)
          }}
          onSuccess={async () => {
            await loadRoutes()
            setIsDeleteDialogOpen(false)
            setSelectedRoute(null)
          }}
        />
      ) : null}
    </div>
  )
}
