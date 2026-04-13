import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { HistoryTable } from '@components/vehicles/HistoryTable'
import { TripHistoryTable } from '@components/vehicles/TripHistoryTable'
import { TelemetryTable } from '@components/vehicles/TelemetryTable'
import { DeleteVehicleDialog } from '@components/vehicles/DeleteVehicleDialog'
import { VehicleEventsTable } from '@components/vehicles/VehicleEventsTable'
import { EditVehicleModal } from '@components/vehicles/EditVehicleModal'
import { VehicleInfoCard } from '@components/vehicles/VehicleInfoCard'
import { VehicleMap } from '@components/map/VehicleMap'
import { useVehicleSocket } from '@hooks/useVehicleSocket'
import { vehicleService } from '@services/vehicleService'
import { routeService } from '@services/routeService'
import { useAuthStore } from '@store/authStore'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { applyVehicleSocketPayload } from '@utils/vehicleRealtime'
import { canDelete, canEdit } from '@utils/permissions'
import type { Trip, Vehicle } from '../../types/vehicle'

type DetailTab = 'trips' | 'telemetry' | 'history' | 'events'

export function VehicleDetailPage() {
  const { vehicleId = '' } = useParams()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const canEditVehicle = canEdit(role)
  const canDeleteVehicle = canDelete(role)
  const canViewTelemetry = role !== 'STUDENT'

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTab, setActiveTab] = useState<DetailTab>('trips')
  const [routeName, setRouteName] = useState('Unassigned')
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const latestVehicleIdRef = useRef(vehicleId)
  const syncVersion = useScopedDataSyncVersion(['vehicles', 'routes', 'trips', 'history'])

  const loadVehicle = useCallback(async (showLoading = true) => {
    if (!vehicleId.trim()) {
      setVehicle(null)
      setTrips([])
      setIsLoadingVehicle(false)
      return
    }

    if (showLoading) {
      setIsLoadingVehicle(true)
    }
    const [nextVehicle, nextTrips, routes] = await Promise.all([
      vehicleService.getVehicleById(vehicleId),
      vehicleService.getVehicleTrips(vehicleId),
      routeService.getRoutes(),
    ])

    setVehicle(nextVehicle)
    setTrips(nextTrips)
    const matchedRoute = nextVehicle?.routeId ? routes.find((route) => route.id === nextVehicle.routeId) : undefined
    setRouteName(matchedRoute?.name ?? 'Unassigned')
    if (showLoading) {
      setIsLoadingVehicle(false)
    }
  }, [vehicleId])

  useEffect(() => {
    latestVehicleIdRef.current = vehicleId
  }, [vehicleId])

  useEffect(() => {
    void loadVehicle()
  }, [loadVehicle, syncVersion])

  useEffect(() => {
    if (!vehicleId.trim()) {
      setRouteName('Unassigned')
    }
  }, [vehicleId])

  useVehicleSocket((payload) => {
    if (payload.vehicleId !== latestVehicleIdRef.current) {
      return
    }

    setVehicle((currentVehicle) => (currentVehicle ? applyVehicleSocketPayload(currentVehicle, payload) : currentVehicle))
    void loadVehicle(false)
  })

  const totalDistance = useMemo(
    () => trips.reduce((sum, trip) => sum + trip.distance, 0).toFixed(1),
    [trips],
  )

  const mapCenter: [number, number] = vehicle ? [vehicle.lat, vehicle.lon] : [28.6139, 77.209]
  const resolvedAddress = vehicle?.address?.trim() ? vehicle.address : 'Unknown location'

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <div className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>Vehicle Detail</p>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>
              {vehicle?.vehicleName ?? 'Vehicle'}
            </h2>
          </div>
          <div className='flex items-center gap-2 md:w-max'>
            {/* <p className='rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-slate-900 dark:text-[#38bdf8]'>
              ID: {vehicleId || 'N/A'}
            </p>
            <p className='rounded-lg border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200'>
              Route: {routeName}
            </p> */}
            {canEditVehicle ? (
              <button
                type='button'
                onClick={() => setIsEditOpen(true)}
                className='inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
              >
                <FiEdit size={14} />
                Edit
              </button>
            ) : null}
            {canDeleteVehicle ? (
              <button
                type='button'
                onClick={() => setIsDeleteOpen(true)}
                className='inline-flex mr-5 items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-600 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200'
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            ) : null}
            <Link
              to='/vehicles'
              className='rounded-lg border  border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            >
              Back to Vehicles
            </Link>
          </div>
        </div>
      </div>

      {isLoadingVehicle ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading vehicle details...
        </div>
      ) : vehicle ? (
        <>
          <VehicleInfoCard
            vehicleName={vehicle.vehicleName}
            registrationNumber={vehicle.registrationNumber}
            status={vehicle.status}
            vehicleType={vehicle.vehicleType}
            assignedDevice={vehicle.deviceId}
            routeName={routeName}
            geofenceId={vehicle.geofenceId ?? null}
            geofenceName={vehicle.geofenceName ?? null}
            address={resolvedAddress}
            distanceTravelled={Number(totalDistance)}
            lastSeen={vehicle.lastSeen}
          />

          <section className='grid grid-cols-1 gap-3 md:grid-cols-4'>
            <article className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
              <p className='text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400'>Current Speed</p>
              <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{vehicle.speed} km/h</p>
            </article>
            <article className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
              <p className='text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400'>Speed Limit</p>
              <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>
                {vehicle.speedLimit} km/h
              </p>
            </article>
            <article className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
              <p className='text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400'>Trip Count</p>
              <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{trips.length}</p>
            </article>
            <article className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
              <p className='text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400'>Distance</p>
              <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{totalDistance} km</p>
            </article>
          </section>

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Live Position</h3>
            <div className='h-[420px] overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
              <VehicleMap vehicles={[vehicle]} center={mapCenter} zoom={15} preserveZoomOnCenterChange />
            </div>
          </section>

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <div className='mb-4 flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => setActiveTab('trips')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === 'trips'
                    ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Trips
              </button>
              {canViewTelemetry ? (
                <button
                  type='button'
                  onClick={() => setActiveTab('telemetry')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    activeTab === 'telemetry'
                      ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Telemetry
                </button>
              ) : null}
              {canViewTelemetry ? (
                <button
                  type='button'
                  onClick={() => setActiveTab('history')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  History
                </button>
              ) : null}
              <button
                type='button'
                onClick={() => setActiveTab('events')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === 'events'
                    ? 'bg-blue-600 text-white dark:bg-[#38bdf8] dark:text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Events
              </button>
            </div>

            {activeTab === 'trips' ? <TripHistoryTable vehicleId={vehicleId} /> : null}
            {activeTab === 'telemetry' && canViewTelemetry ? <TelemetryTable vehicleId={vehicleId} /> : null}
            {activeTab === 'history' && canViewTelemetry ? <HistoryTable vehicleId={vehicleId} /> : null}
            {activeTab === 'events' ? <VehicleEventsTable vehicleId={vehicleId} /> : null}
          </section>
        </>
      ) : (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Invalid or unknown vehicle ID: <span className='font-semibold'>{vehicleId || 'N/A'}</span>
        </div>
      )}

      {canEditVehicle ? (
        <EditVehicleModal
          vehicle={vehicle}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={loadVehicle}
        />
      ) : null}

      {canDeleteVehicle ? (
        <DeleteVehicleDialog
          isOpen={isDeleteOpen}
          vehicle={vehicle}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => navigate('/vehicles')}
        />
      ) : null}
    </div>
  )
}
