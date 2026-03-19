import { FiX } from 'react-icons/fi'
import { geofenceService } from '@services/geofenceService'
import { GeofenceForm, type GeofenceFormValues } from './GeofenceForm'

type AddGeofenceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

export function AddGeofenceModal({ isOpen, onClose, onSuccess }: AddGeofenceModalProps) {
  if (!isOpen) {
    return null
  }

  const handleSave = async (values: GeofenceFormValues) => {
    await geofenceService.createGeofence(values)
    await onSuccess()
    onClose()
  }

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full h-full overflow-auto max-w-4xl rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Add Geofence</h3>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            aria-label='Close add geofence modal'
          >
            <FiX size={16} />
          </button>
        </div>

        <GeofenceForm onSave={handleSave} onCancel={onClose} saveLabel='Create Geofence' />
      </div>
    </div>
  )
}
