import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiPlus, FiX, FiXCircle } from 'react-icons/fi'
import { CollegeScopeRequiredNotice } from '@components/colleges/CollegeScopeRequiredNotice'
import { AddDeviceModal } from '@components/devices/AddDeviceModal'
import { DeleteDeviceDialog } from '@components/devices/DeleteDeviceDialog'
import { DeviceTable } from '@components/devices/DeviceTable'
import { EditDeviceModal } from '@components/devices/EditDeviceModal'
import { deviceService } from '@services/deviceService'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { isSuperAdminCollegeScopeRequired } from '@utils/collegeScope'
import type { Device } from '../../types/device'

type DeviceToast = {
  type: 'success' | 'warning' | 'error'
  message: string
}

export function DevicesPage() {
  const collegeScopeRequired = isSuperAdminCollegeScopeRequired()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [toast, setToast] = useState<DeviceToast | null>(null)
  const syncVersion = useScopedDataSyncVersion(['devices', 'vehicles'])

  const loadDevices = async () => {
    setIsLoading(true)
    try {
      if (collegeScopeRequired) {
        setDevices([])
        return
      }

      const data = await deviceService.getDevices()
      setDevices(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDevices()
  }, [collegeScopeRequired, syncVersion])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [toast])

  const toastIcon =
    toast?.type === 'success' ? (
      <FiCheckCircle size={16} />
    ) : toast?.type === 'warning' ? (
      <FiAlertTriangle size={16} />
    ) : (
      <FiXCircle size={16} />
    )

  const toastClasses =
    toast?.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200'
      : toast?.type === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200'
        : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200'

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      {toast ? (
        <div className='pointer-events-none fixed right-4 top-20 z-50 w-[360px] max-w-[calc(100vw-2rem)]'>
          <div
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-slate-900/10 ${toastClasses}`}
          >
            <div className='flex items-start gap-3'>
              <span className='mt-0.5'>{toastIcon}</span>
              <p className='text-sm font-medium'>{toast.message}</p>
            </div>
            <button
              type='button'
              onClick={() => setToast(null)}
              className='rounded-md p-1 transition hover:bg-black/5 dark:hover:bg-white/10'
              aria-label='Dismiss device status toast'
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Devices</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Manage hardware devices and assignments</p>
          </div>

          <button
            type='button'
            onClick={() => setIsAddModalOpen(true)}
            disabled={collegeScopeRequired}
            className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
          >
            <FiPlus size={16} />
            Add Device
          </button>
        </div>
      </section>

      {collegeScopeRequired ? (
        <CollegeScopeRequiredNotice
          title='Please select a college before managing devices'
          description='As a super admin, device creation and device lists are college-scoped. Choose a college from the top bar, then add or manage devices for that college.'
        />
      ) : null}

      {!collegeScopeRequired && isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading devices...
        </div>
      ) : !collegeScopeRequired ? (
        <DeviceTable
          devices={devices}
          onEdit={(device) => setEditingDevice(device)}
          onDelete={(device) => setDeletingDevice(device)}
        />
      ) : null}

      <AddDeviceModal
        isOpen={isAddModalOpen && !collegeScopeRequired}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadDevices}
      />

      <EditDeviceModal
        isOpen={Boolean(editingDevice)}
        device={editingDevice}
        onClose={() => setEditingDevice(null)}
        onSuccess={loadDevices}
        onToast={setToast}
      />

      <DeleteDeviceDialog
        isOpen={Boolean(deletingDevice)}
        device={deletingDevice}
        onClose={() => setDeletingDevice(null)}
        onSuccess={loadDevices}
      />
    </div>
  )
}
