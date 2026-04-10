import { useCallback, useEffect, useMemo, useState } from 'react'
import { VehicleMap } from '@components/map/VehicleMap'
import { StatusBadge } from '@components/ui/StatusBadge'
import { VehicleListPanel } from '@components/vehicles/VehicleListPanel'
import { useVehicleSocket } from '@hooks/useVehicleSocket'
import { vehicleService } from '@services/vehicleService'
import { routeService } from '@services/routeService'
import { geofenceService } from '@services/geofenceService'
import type { Vehicle } from '../../types/vehicle'
import type { Route } from '../../types/route'
import type { Geofence } from '../../types/geofence'

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]
const DEFAULT_ZOOM = 13

export function LiveMapPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [mapZoom] = useState(DEFAULT_ZOOM)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showGeofences, setShowGeofences] = useState(true)

  const loadVehicles = useCallback(async () => {
    const nextVehicles = await vehicleService.getVehicles({ page: 1, limit: 500 })
    setVehicles(nextVehicles)

    setSelectedVehicleId((currentSelectedId) => {
      const fallbackId = nextVehicles[0]?.id ?? null
      const validSelectedId =
        currentSelectedId && nextVehicles.some((vehicle) => vehicle.id === currentSelectedId)
          ? currentSelectedId
          : fallbackId

      if (!currentSelectedId && validSelectedId) {
        const focusedVehicle = nextVehicles.find((vehicle) => vehicle.id === validSelectedId)

        if (focusedVehicle) {
          setMapCenter([focusedVehicle.lat, focusedVehicle.lon])
        }
      }

      return validSelectedId
    })

  }, [])

  useVehicleSocket((payload) => {
    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === payload.vehicleId
          ? {
              ...vehicle,
              lat: payload.lat,
              lon: payload.lng,
              speed: payload.speed,
              status: payload.status,
              lastSeen: payload.timestamp,
            }
          : vehicle,
      ),
    )
  })

  useEffect(() => {
    const loadStaticLayers = async () => {
      const [nextRoutes, nextGeofences] = await Promise.all([
        routeService.getRoutes(),
        geofenceService.getGeofences(),
      ])
      setRoutes(nextRoutes)
      setGeofences(nextGeofences)
    }

    void loadStaticLayers()
  }, [])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id)
    setMapCenter([vehicle.lat, vehicle.lon])
  }

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  )

  return (
    <div className='mx-auto w-full max-w-7xl'>
      <section className='grid grid-cols-1 gap-5 xl:grid-cols-10'>
        <div className='xl:col-span-7'>
          <article className='flex h-[560px] lg:h-[85vh] flex-col rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <header className='mb-3 flex items-center justify-between gap-3'>
              <div>
                <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Live Map</h2>
                <p className='text-sm text-slate-600 dark:text-slate-300'>Realtime vehicle updates</p>
              </div>
              {selectedVehicle ? (
                <p className='text-xs font-medium text-blue-600 dark:text-[#38bdf8]'>
                  Tracking: {selectedVehicle.vehicleName}
                </p>
              ) : null}
            </header>

            <div className='mb-3 flex flex-wrap items-center gap-3 text-xs'>
              <label className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200'>
                <input
                  type='checkbox'
                  checked={showRoutes}
                  onChange={(event) => setShowRoutes(event.target.checked)}
                  className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-900'
                />
                Show Routes
              </label>
              <label className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200'>
                <input
                  type='checkbox'
                  checked={showGeofences}
                  onChange={(event) => setShowGeofences(event.target.checked)}
                  className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-900'
                />
                Show Geofences
              </label>
            </div>

            <div className='h-[720px] w-full overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
              <VehicleMap
                vehicles={vehicles}
                routes={showRoutes ? routes : []}
                geofences={showGeofences ? geofences : []}
                center={mapCenter}
                zoom={mapZoom}
                onVehicleClick={handleVehicleSelect}
                selectedVehicleId={selectedVehicleId}
              />
            </div>

            <div className='mt-3 flex flex-wrap gap-2 text-xs'>
              <StatusBadge status='moving' className='px-2.5 py-1' />
              <StatusBadge status='idling' className='px-2.5 py-1' />
              <StatusBadge status='stopped' className='px-2.5 py-1' />
              <StatusBadge status='offline' className='px-2.5 py-1' />
            </div>
          </article>
        </div>

        <div className='xl:col-span-3 h-[85vh] '>
          <VehicleListPanel
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={handleVehicleSelect}
          />
        </div>
      </section>
    </div>
  )
}
