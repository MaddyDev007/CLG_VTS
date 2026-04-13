import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RoutePreviewMap } from '@components/routes/RoutePreviewMap'
import { routeService } from '@services/routeService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import type { Route, RouteStop } from '../../types/route'
import type { Vehicle } from '../../types/vehicle'

export function RouteDetailPage() {
  const { routeId = '' } = useParams()
  const [route, setRoute] = useState<Route | null>(null)
  const [assignedVehicles, setAssignedVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const syncVersion = useScopedDataSyncVersion(['routes', 'vehicles'])

  useEffect(() => {
    const loadRoute = async () => {
      if (!routeId.trim()) {
        setRoute(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [data, vehicles] = await Promise.all([
          routeService.getRouteById(routeId),
          routeService.getRouteVehicles(routeId),
        ])
        setRoute(data)
        setAssignedVehicles(vehicles)
      } finally {
        setIsLoading(false)
      }
    }

    void loadRoute()
  }, [routeId, syncVersion])

  const orderedStops = useMemo<RouteStop[]>(
    () => (route ? [route.startStop, ...route.intermediateStops, route.endStop] : []),
    [route],
  )

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Route Detail</h2>
          <Link
            to='/routes'
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Back to Routes
          </Link>
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading route details...
        </div>
      ) : route ? (
        <>
          <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100'>Route Summary</h3>
            <div className='grid grid-cols-1 gap-3 text-sm md:grid-cols-3'>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Route Name:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{route.name}</span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Assigned Vehicles:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>
                  {assignedVehicles.length
                    ? assignedVehicles.map((vehicle) => vehicle.vehicleName).join(', ')
                    : 'Unassigned'}
                </span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Stops Count:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{route.stopsCount}</span>
              </p>
            </div>
          </section>

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Route Visualization</h3>
            <RoutePreviewMap
              startStop={route.startStop}
              endStop={route.endStop}
              intermediateStops={route.intermediateStops}
              heightClassName='h-[430px]'
            />
          </section>

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Stop List</h3>
            <ol className='list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200'>
              {orderedStops.map((stop) => (
                <li key={stop.id}>
                  {stop.name}
                  <span className='ml-2 text-xs text-slate-500 dark:text-slate-400'>
                    ({stop.lat}, {stop.lon})
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Invalid or unknown route ID: <span className='font-semibold'>{routeId || 'N/A'}</span>
        </div>
      )}
    </div>
  )
}
