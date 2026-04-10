import { useMemo, useState } from 'react'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import { RouteMiniMap } from '@components/routes/RouteMiniMap'
import { Pagination } from '@components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import type { Route } from '../../types/route'
import type { Vehicle } from '../../types/vehicle'

type RoutesTableProps = {
  routes: Route[]
  vehicles: Vehicle[]
  searchTerm?: string
  onEdit?: (route: Route) => void
  onDelete?: (route: Route) => void
  onAssign?: (vehicleId: string, routeId: string) => Promise<void> | void
  onRemove?: (vehicleId: string) => Promise<void> | void
}

export function RoutesTable({
  routes,
  vehicles,
  searchTerm = '',
  onEdit,
  onDelete,
  onAssign,
  onRemove,
}: RoutesTableProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedVehicleByRoute, setSelectedVehicleByRoute] = useState<Record<string, string>>({})
  const showRouteActions = Boolean(onEdit || onDelete)
  const showAssignmentControls = Boolean(onAssign && onRemove)

  const vehiclesByRoute = useMemo(() => {
    const map = new Map<string, Vehicle[]>()
    vehicles.forEach((vehicle) => {
      if (!vehicle.routeId) {
        return
      }
      const existing = map.get(vehicle.routeId) ?? []
      existing.push(vehicle)
      map.set(vehicle.routeId, existing)
    })
    return map
  }, [vehicles])

  const unassignedVehicles = useMemo(
    () => vehicles.filter((vehicle) => !vehicle.routeId),
    [vehicles],
  )

  const filteredRoutes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return routes
    }

    return routes.filter((route) => {
      const matchesRoute = route.name.toLowerCase().includes(query)
      const assignedVehicles = vehiclesByRoute.get(route.id) ?? []
      const vehicleNames = assignedVehicles.map((vehicle) => vehicle.vehicleName.toLowerCase()).join(' ')
      const matchesVehicle = vehicleNames.includes(query) || 'unassigned'.includes(query)
      return matchesRoute || matchesVehicle
    })
  }, [routes, searchTerm, vehiclesByRoute])

  const paginatedRoutes = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredRoutes.slice(startIndex, startIndex + limit)
  }, [filteredRoutes, limit, page])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[1250px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>Route Name</th>
              <th className='px-3 py-2 font-semibold'>Assigned Vehicles</th>
              <th className='px-3 py-2 font-semibold'>Stops Count</th>
              <th className='px-3 py-2 font-semibold'>Status</th>
              <th className='px-3 py-2 font-semibold'>Map Preview</th>
              {showRouteActions ? <th className='px-3 py-2 text-right font-semibold'>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {paginatedRoutes.length ? (
              paginatedRoutes.map((route) => (
                <tr
                  key={route.id}
                  onClick={() => navigate(`/routes/${route.id}`)}
                  className='cursor-pointer border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                >
                  <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{route.name}</td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                    {(() => {
                      const assignedVehicles = vehiclesByRoute.get(route.id) ?? []
                      const selectedVehicleId = selectedVehicleByRoute[route.id] ?? ''
                      return (
                        <div className='space-y-2'>
                          <div className='flex flex-wrap gap-2'>
                            {assignedVehicles.length ? (
                              assignedVehicles.map((vehicle) => (
                                showAssignmentControls ? (
                                  <button
                                    key={vehicle.id}
                                    type='button'
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      void onRemove?.(vehicle.id)
                                    }}
                                    className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-rose-500/70 dark:hover:text-rose-300'
                                    title='Remove from route'
                                  >
                                    {vehicle.vehicleName}
                                    <span className='text-[10px] uppercase tracking-[0.1em] text-rose-500'>Remove</span>
                                  </button>
                                ) : (
                                  <span
                                    key={vehicle.id}
                                    className='inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200'
                                  >
                                    {vehicle.vehicleName}
                                  </span>
                                )
                              ))
                            ) : (
                              <span className='text-xs text-slate-500 dark:text-slate-400'>Unassigned</span>
                            )}
                          </div>
                          {showAssignmentControls ? (
                            <div className='flex flex-wrap items-center gap-2'>
                              <select
                                value={selectedVehicleId}
                                onChange={(event) => {
                                  event.stopPropagation()
                                  setSelectedVehicleByRoute((prev) => ({
                                    ...prev,
                                    [route.id]: event.target.value,
                                  }))
                                }}
                                onClick={(event) => event.stopPropagation()}
                                className='min-w-[200px] rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                              >
                                <option value=''>Assign vehicle...</option>
                                {unassignedVehicles.map((vehicle) => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.vehicleName}
                                  </option>
                                ))}
                              </select>
                              <button
                                type='button'
                                onClick={(event) => {
                                  event.stopPropagation()
                                  if (!selectedVehicleId) {
                                    return
                                  }
                                  void onAssign?.(selectedVehicleId, route.id)
                                  setSelectedVehicleByRoute((prev) => ({ ...prev, [route.id]: '' }))
                                }}
                                className='inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:border-blue-400/70'
                              >
                                Assign
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })()}
                  </td>
                  <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{route.stopsCount}</td>
                  <td className='px-3 py-3'>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        route.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {route.status === 'active' ? 'Active' : 'Idle'}
                    </span>
                  </td>
                  <td className='px-3 py-3'>
                    <RouteMiniMap
                      startStop={route.startStop}
                      endStop={route.endStop}
                      intermediateStops={route.intermediateStops}
                    />
                  </td>
                  {showRouteActions ? (
                    <td className='px-3 py-3 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {onEdit ? (
                          <button
                            type='button'
                            onClick={(event) => {
                              event.stopPropagation()
                              onEdit(route)
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
                              onDelete(route)
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
                <td colSpan={showRouteActions ? 6 : 5} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No routes match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        limit={limit}
        total={filteredRoutes.length}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
      />
    </section>
  )
}
