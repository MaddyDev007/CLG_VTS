import { useEffect, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { AddDeviceModal } from '@components/devices/AddDeviceModal'
import { DeleteDeviceDialog } from '@components/devices/DeleteDeviceDialog'
import { DeviceTable } from '@components/devices/DeviceTable'
import { EditDeviceModal } from '@components/devices/EditDeviceModal'
import { deviceService } from '@services/deviceService'
import type { Device } from '../../types/device'

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)

  const loadDevices = async () => {
    setIsLoading(true)
    const data = await deviceService.getDevices()
    setDevices(data)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadDevices()
  }, [])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Devices</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Manage hardware devices and assignments</p>
          </div>

          <button
            type='button'
            onClick={() => setIsAddModalOpen(true)}
            className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
          >
            <FiPlus size={16} />
            Add Device
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading devices...
        </div>
      ) : (
        <DeviceTable
          devices={devices}
          onEdit={(device) => setEditingDevice(device)}
          onDelete={(device) => setDeletingDevice(device)}
        />
      )}

      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadDevices}
      />

      <EditDeviceModal
        isOpen={Boolean(editingDevice)}
        device={editingDevice}
        onClose={() => setEditingDevice(null)}
        onSuccess={loadDevices}
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
