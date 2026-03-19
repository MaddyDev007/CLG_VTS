import { useEffect, useState, type FormEvent } from 'react'
import { FiX } from 'react-icons/fi'
import { deviceService } from '@services/deviceService'
import type { Device } from '../../types/device'

type EditDeviceModalProps = {
  isOpen: boolean
  device: Device | null
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

const IMEI_REGEX = /^\d{15}$/
const DEVICE_ID_REGEX = /^[A-Z0-9_]{3,32}$/

export function EditDeviceModal({ isOpen, device, onClose, onSuccess }: EditDeviceModalProps) {
  const [deviceId, setDeviceId] = useState('')
  const [imei, setImei] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !device) {
      return
    }

    setDeviceId(device.deviceId)
    setImei(device.imei)
    setError('')
    setIsSubmitting(false)
  }, [isOpen, device])

  if (!isOpen || !device) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

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
      await deviceService.updateDevice(device.id, {
        deviceId: deviceId.trim(),
        imei: imei.trim(),
      })

      await onSuccess()
      onClose()
    } catch {
      setError('Failed to update device')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-lg rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Edit Device</h3>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            aria-label='Close edit device modal'
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
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>IMEI Number</label>
            <input
              value={imei}
              onChange={(event) => setImei(event.target.value)}
              inputMode='numeric'
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </div>

          <p className='text-xs text-slate-500 dark:text-slate-400'>Assigned vehicle cannot be edited here.</p>

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
