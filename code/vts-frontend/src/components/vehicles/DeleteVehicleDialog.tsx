import { useEffect, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { vehicleService } from '@services/vehicleService'
import type { Vehicle } from '../../types/vehicle'

type DeleteVehicleDialogProps = {
  vehicle: Vehicle | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

export function DeleteVehicleDialog({ vehicle, isOpen, onClose, onSuccess }: DeleteVehicleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setIsDeleting(false)
    }
  }, [isOpen, vehicle?.id])

  if (!isOpen || !vehicle) {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      await vehicleService.deleteVehicle(vehicle.id)
      await onSuccess()
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete vehicle')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-md rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-3 flex items-start gap-2'>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'>
            <FiAlertTriangle size={16} />
          </span>
          <div>
            <h3 className='text-base font-semibold text-slate-900 dark:text-slate-100'>Delete Vehicle</h3>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
              Are you sure you want to delete this vehicle?
            </p>
          </div>
        </div>

        <p className='rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
          {vehicle.vehicleName}
        </p>

        {error ? <p className='mt-2 text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

        <div className='mt-4 flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className='rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-rose-500 dark:hover:bg-rose-400'
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
