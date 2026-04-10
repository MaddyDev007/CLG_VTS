import { useEffect, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { AddGeofenceModal } from '@components/geofence/AddGeofenceModal'
import { DeleteGeofenceDialog } from '@components/geofence/DeleteGeofenceDialog'
import { EditGeofenceModal } from '@components/geofence/EditGeofenceModal'
import { GeofenceList } from '@components/geofence/GeofenceList'
import { GeofenceMap } from '@components/map/GeofenceMap'
import { geofenceService } from '@services/geofenceService'
import { useAuthStore } from '@store/authStore'
import { canCreate, canDelete, canEdit } from '@utils/permissions'
import type { Geofence } from '../../types/geofence'

export function GeofencePage() {
  const role = useAuthStore((state) => state.role)
  const canCreateGeofence = canCreate(role)
  const canEditGeofence = canEdit(role)
  const canDeleteGeofence = canDelete(role)
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null)
  const [deletingGeofence, setDeletingGeofence] = useState<Geofence | null>(null)
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null)

  const loadGeofences = async () => {
    setIsLoading(true)
    try {
      const data = await geofenceService.getGeofences()
      setGeofences(data)
      setSelectedGeofence((prev) => {
        if (prev && data.some((geofence) => geofence.id === prev.id)) {
          return prev
        }
        return data[0] ?? null
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadGeofences()
  }, [])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Geofences</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Create and manage geofence boundaries</p>
          </div>

          {canCreateGeofence ? (
            <button
              type='button'
              onClick={() => setIsAddModalOpen(true)}
              className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              <FiPlus size={16} />
              Add Geofence
            </button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading geofences...
        </div>
      ) : (
        <>
          {selectedGeofence ? (
            <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
              <div className='mb-3'>
                <h3 className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                  {selectedGeofence.name}
                </h3>
                <p className='text-sm text-slate-600 dark:text-slate-300'>{selectedGeofence.address}</p>
              </div>
              <div className='h-[360px] overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700'>
                <GeofenceMap
                  center={[selectedGeofence.lat, selectedGeofence.lon]}
                  lat={selectedGeofence.lat}
                  lon={selectedGeofence.lon}
                  radius={selectedGeofence.radius}
                />
              </div>
            </section>
          ) : null}

          <GeofenceList
            geofences={geofences}
            selectedId={selectedGeofence?.id ?? null}
            onSelect={(geofence) => setSelectedGeofence(geofence)}
            onDelete={canDeleteGeofence ? (geofence) => setDeletingGeofence(geofence) : undefined}
            onEdit={canEditGeofence ? (geofence) => setEditingGeofence(geofence) : undefined}
          />
        </>
      )}

      {canCreateGeofence ? (
        <AddGeofenceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadGeofences}
        />
      ) : null}

      {canEditGeofence ? (
        <EditGeofenceModal
          isOpen={Boolean(editingGeofence)}
          geofence={editingGeofence}
          onClose={() => setEditingGeofence(null)}
          onSuccess={loadGeofences}
        />
      ) : null}

      {canDeleteGeofence ? (
        <DeleteGeofenceDialog
          isOpen={Boolean(deletingGeofence)}
          geofence={deletingGeofence}
          onClose={() => setDeletingGeofence(null)}
          onSuccess={loadGeofences}
        />
      ) : null}
    </div>
  )
}
