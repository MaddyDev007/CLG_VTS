import { useEffect, useState, type FormEvent } from 'react'
import { FiX } from 'react-icons/fi'
import { deviceService } from '@services/deviceService'
import { vehicleService } from '@services/vehicleService'
import { routeService } from '@services/routeService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import type { Device } from '../../types/device'
import type { Route } from '../../types/route'
import type { Vehicle, VehicleType } from '../../types/vehicle'

const vehicleTypes: VehicleType[] = ['Bus', 'Car', 'Van', 'Truck']

type EditVehicleModalProps = {
  vehicle: Vehicle | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

export function EditVehicleModal({ vehicle, isOpen, onClose, onSuccess }: EditVehicleModalProps) {
  const [vehicleName, setVehicleName] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('Bus')
  const [deviceId, setDeviceId] = useState('')
  const [routeId, setRouteId] = useState('')
  const [speedLimit, setSpeedLimit] = useState('75')
  const [devices, setDevices] = useState<Device[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const syncVersion = useScopedDataSyncVersion(['devices', 'routes', 'vehicles'])

  useEffect(() => {
    if (!isOpen || !vehicle) {
      return
    }

    setVehicleName(vehicle.vehicleName)
    setVehicleType(vehicle.vehicleType)
    setDeviceId(vehicle.deviceId === 'unassigned' ? '' : vehicle.deviceId)
    setRouteId(vehicle.routeId ?? '')
    setSpeedLimit(String(vehicle.speedLimit ?? 75))
    setError('')
  }, [isOpen, vehicle, syncVersion])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const loadDevices = async () => {
      const unassignedDevices = await deviceService.getUnassignedDevices()
      if (!vehicle || vehicle.deviceId === 'unassigned') {
        setDevices(unassignedDevices)
        return
      }

      const currentAssigned = await deviceService.getDeviceByUid(vehicle.deviceId)
      const merged = currentAssigned
        ? [currentAssigned, ...unassignedDevices.filter((item) => item.deviceId !== currentAssigned.deviceId)]
        : unassignedDevices
      setDevices(merged)
    }

    void loadDevices()

    const loadRoutes = async () => {
      const data = await routeService.getRoutes()
      setRoutes(data)
    }

    void loadRoutes()
  }, [isOpen, vehicle])

  if (!isOpen || !vehicle) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!vehicleName.trim()) {
      setError('Vehicle name is required')
      return
    }

    const parsedSpeedLimit = Number(speedLimit)
    if (!Number.isFinite(parsedSpeedLimit) || parsedSpeedLimit <= 0) {
      setError('Speed limit must be a positive number')
      return
    }

    setIsSubmitting(true)

    try {
      await vehicleService.updateVehicle(vehicle.id, {
        vehicleName: vehicleName.trim(),
        vehicleType,
        deviceId: deviceId.trim(),
        routeId: routeId.trim() ? routeId.trim() : null,
        speedLimit: parsedSpeedLimit,
        updatedAt: new Date().toISOString(),
      })

      await onSuccess()
      onClose()
    } catch {
      setError('Failed to update vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-lg rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Edit Vehicle</h3>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            aria-label='Close edit vehicle modal'
          >
            <FiX size={16} />
          </button>
        </div>

        <form className='space-y-3' onSubmit={handleSubmit}>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Vehicle Name</label>
            <input
              value={vehicleName}
              onChange={(event) => setVehicleName(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value as VehicleType)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Device Assignment</label>
            <select
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              <option value=''>No device assigned</option>
              {devices.map((device) => (
                <option key={device.id} value={device.deviceId}>
                  {device.deviceId} ({device.status})
                </option>
              ))}
              </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Assign Route</label>
            <select
              value={routeId}
              onChange={(event) => setRouteId(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              <option value=''>Unassigned</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>
              Speed Limit (km/h)
            </label>
            <input
              type='number'
              min={1}
              value={speedLimit}
              onChange={(event) => setSpeedLimit(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </div>

          {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

          <div className='flex justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
