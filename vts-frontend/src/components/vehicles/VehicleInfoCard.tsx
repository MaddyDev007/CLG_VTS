import { FiClock, FiMapPin, FiRadio, FiSmartphone, FiTruck } from 'react-icons/fi'
import { StatusBadge } from '@components/ui/StatusBadge'
import type { VehicleStatus, VehicleType } from '../../types/vehicle'

type VehicleInfoCardProps = {
  vehicleName: string
  registrationNumber: string
  status: VehicleStatus
  vehicleType: VehicleType
  assignedDevice: string
  routeName: string
  geofenceId?: string | null
  geofenceName?: string | null
  address: string
  distanceTravelled: number
  lastSeen: string
}

export function VehicleInfoCard({
  vehicleName,
  registrationNumber,
  status,
  vehicleType,
  assignedDevice,
  routeName,
  geofenceId,
  geofenceName,
  address,
  distanceTravelled,
  lastSeen,
}: VehicleInfoCardProps) {
  const resolvedGeofence =
    geofenceId && geofenceId.trim().length > 0
      ? geofenceName?.trim()
        ? geofenceName
        : 'Geofence'
      : 'Not in any geofence'
  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>{vehicleName}</h3>
          <p className='text-sm text-slate-600 dark:text-slate-300'>{registrationNumber}</p>
        </div>
        

        <StatusBadge status={status} className='px-3 py-1' />
      </div>

      <div className='mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3 dark:text-slate-200'>
        <p className='inline-flex items-start gap-2 sm:col-span-2 lg:col-span-3'>
          <FiMapPin className='mt-0.5 text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Address:</span> {address}
          </span>
        </p>

        <p className='inline-flex items-center gap-2'>
          <FiRadio className='text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Distance Travelled:</span> {distanceTravelled.toFixed(1)} km
          </span>
        </p>

        <p className='inline-flex items-center gap-2'>
          <FiTruck className='text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Vehicle Type:</span> {vehicleType}
          </span>
        </p>

        <p className='inline-flex items-center gap-2'>
          <FiSmartphone className='text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Assigned Device:</span> {assignedDevice}
          </span>
        </p>

        <p className='inline-flex items-center gap-2'>
          <FiMapPin className='text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Route:</span> {routeName}
          </span>
        </p>

        <p className='inline-flex items-center gap-2'>
          <FiMapPin className='text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Geofence:</span> {resolvedGeofence}
          </span>
        </p>

        <p className='inline-flex items-center gap-2'>
          <FiClock className='text-blue-600 dark:text-[#38bdf8]' size={16} />
          <span>
            <span className='font-semibold'>Last Seen:</span> {new Date(lastSeen).toLocaleString()}
          </span>
        </p>
      </div>
    </section>
  )
}
