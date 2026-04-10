import { useEffect, useState, type FormEvent } from 'react'
import { FiX } from 'react-icons/fi'
import { deviceService } from '@services/deviceService'
import { isSuperAdminCollegeScopeRequired } from '@utils/collegeScope'

type AddDeviceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

const IMEI_REGEX = /^\d{15}$/
const DEVICE_ID_REGEX = /^[A-Z0-9_]{3,32}$/

export function AddDeviceModal({ isOpen, onClose, onSuccess }: AddDeviceModalProps) {
  const collegeScopeRequired = isSuperAdminCollegeScopeRequired()
  const [deviceId, setDeviceId] = useState('')
  const [imei, setImei] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setDeviceId('')
      setImei('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (collegeScopeRequired) {
      setError('Select a college from the top bar before creating a device.')
      return
    }

    if (!DEVICE_ID_REGEX.test(deviceId.trim())) {
      setError('Device ID must be 3-32 chars (A-Z, 0-9, underscore)')
      return
    }

    if (!IMEI_REGEX.test(imei.trim())) {
      setError('IMEI must be numeric and exactly 15 digits')
      return
    }

    setIsSubmitting(true)

    try {
      await deviceService.createDevice({
        deviceId: deviceId.trim(),
        imei: imei.trim(),
      })

      await onSuccess()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Failed to create device'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-lg rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Add Device</h3>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            aria-label='Close add device modal'
          >
            <FiX size={16} />
          </button>
        </div>

        <form className='space-y-3' onSubmit={handleSubmit}>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Device ID</label>
            <input
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value.toUpperCase())}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
              placeholder='e.g. VTU_010'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>IMEI Number</label>
            <input
              value={imei}
              onChange={(event) => setImei(event.target.value)}
              inputMode='numeric'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
              placeholder='15-digit IMEI'
            />
          </div>

          <p className='text-xs text-slate-500 dark:text-slate-400'>
            createdAt and updatedAt are generated automatically on submit.
          </p>

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
              {isSubmitting ? 'Creating...' : 'Create Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
