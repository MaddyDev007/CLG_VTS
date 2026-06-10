import { useEffect, useState, type FormEvent } from 'react'
import { FiX } from 'react-icons/fi'
import { deviceService } from '@services/deviceService'
import type { Device } from '../../types/device'

type DeviceEditToast = {
  type: 'success' | 'warning' | 'error'
  message: string
}

type EditDeviceModalProps = {
  isOpen: boolean
  device: Device | null
  onClose: () => void
  onSuccess: () => Promise<void> | void
  onToast: (toast: DeviceEditToast) => void
}

const IMEI_REGEX = /^\d{15}$/
const DEVICE_ID_REGEX = /^[A-Z0-9_]{3,32}$/
const MIN_INTERVAL_MS = 1000
const MAX_INTERVAL_MS = 60000

export function EditDeviceModal({ isOpen, device, onClose, onSuccess, onToast }: EditDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('')
  const [imei, setImei] = useState('')
  const [ignitionOnIntervalMs, setIgnitionOnIntervalMs] = useState('5000')
  const [ignitionOffIntervalMs, setIgnitionOffIntervalMs] = useState('10000')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'saving' | 'waiting-ack'>('idle')

  useEffect(() => {
    if (!isOpen || !device) {
      return
    }

    setDeviceName(device.deviceId)
    setImei(device.imei)
    setIgnitionOnIntervalMs(String(device.ignitionOnIntervalMs ?? device.telemetryIntervalMs ?? 5000))
    setIgnitionOffIntervalMs(String(device.ignitionOffIntervalMs ?? device.telemetryIntervalMs ?? 10000))
    setError('')
    setIsSubmitting(false)
    setSubmitPhase('idle')
  }, [isOpen, device])

  if (!isOpen || !device) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const currentIgnitionOnInterval = device.ignitionOnIntervalMs ?? device.telemetryIntervalMs ?? 5000
    const currentIgnitionOffInterval = device.ignitionOffIntervalMs ?? device.telemetryIntervalMs ?? 10000

    if (!DEVICE_ID_REGEX.test(deviceName.trim())) {
      setError('Device name must be 3-32 chars (A-Z, 0-9, underscore)')
      return
    }

    if (!IMEI_REGEX.test(imei.trim())) {
      setError('IMEI must be numeric and exactly 15 digits')
      return
    }

    const parsedIgnitionOnInterval = Number(ignitionOnIntervalMs)
    const parsedIgnitionOffInterval = Number(ignitionOffIntervalMs)
    const intervalsAreValid = [parsedIgnitionOnInterval, parsedIgnitionOffInterval].every(
      (interval) => Number.isInteger(interval) && interval >= MIN_INTERVAL_MS && interval <= MAX_INTERVAL_MS,
    )
    if (!intervalsAreValid) {
      setError(`Both telemetry intervals must be between ${MIN_INTERVAL_MS} and ${MAX_INTERVAL_MS} ms`)
      return
    }

    const metadataChanged = deviceName.trim() !== device.deviceId || imei.trim() !== device.imei
    const intervalChanged =
      parsedIgnitionOnInterval !== currentIgnitionOnInterval ||
      parsedIgnitionOffInterval !== currentIgnitionOffInterval

    if (!metadataChanged && !intervalChanged) {
      onClose()
      return
    }

    setIsSubmitting(true)

    try {
      let commandImei = device.imei

      if (metadataChanged) {
        setSubmitPhase('saving')
        try {
          const response = await deviceService.updateDevice(device.id, {
            deviceId: deviceName.trim(),
            imei: imei.trim(),
          })
          commandImei = response.device.imei
        } catch {
          await onSuccess()
          const message = 'Failed to update device'
          setError(message)
          onToast({ type: 'error', message })
          return
        }
      }

      if (intervalChanged) {
        setSubmitPhase('waiting-ack')
        const intervalResponse = await deviceService.updateTelemetryIntervals(commandImei, {
          ignitionOnInterval: parsedIgnitionOnInterval,
          ignitionOffInterval: parsedIgnitionOffInterval,
        })

        if (intervalResponse.status === 'timeout') {
          const message = 'Device not responding (timeout)'
          setError(message)
          onToast({ type: 'warning', message })
          return
        }
      }

      await onSuccess()
      onToast({
        type: 'success',
        message: intervalChanged ? 'Interval updated successfully' : 'Device updated successfully',
      })
      onClose()
    } catch {
      const message = intervalChanged ? 'Failed to update device interval' : 'Failed to update device'
      setError(message)
      onToast({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
      setSubmitPhase('idle')
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
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Device Name</label>
            <input
              value={deviceName}
              onChange={(event) => setDeviceName(event.target.value.toUpperCase())}
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

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>
              Ignition ON Interval (ms)
            </label>
            <input
              type='number'
              min={MIN_INTERVAL_MS}
              max={MAX_INTERVAL_MS}
              step={1000}
              value={ignitionOnIntervalMs}
              onChange={(event) => setIgnitionOnIntervalMs(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>
              Ignition OFF Interval (ms)
            </label>
            <input
              type='number'
              min={MIN_INTERVAL_MS}
              max={MAX_INTERVAL_MS}
              step={1000}
              value={ignitionOffIntervalMs}
              onChange={(event) => setIgnitionOffIntervalMs(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
            <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
              Changes apply only after the device sends an ACK. Allowed range: {MIN_INTERVAL_MS}-{MAX_INTERVAL_MS} ms.
            </p>
          </div>

          <p className='text-xs text-slate-500 dark:text-slate-400'>Assigned vehicle cannot be edited here.</p>

          {submitPhase === 'waiting-ack' ? (
            <p className='text-sm text-amber-600 dark:text-amber-300'>Waiting for device ACK...</p>
          ) : null}

          {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

          <div className='flex justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              {submitPhase === 'waiting-ack' ? 'Updating device...' : isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
