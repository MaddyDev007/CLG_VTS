import type { KeyboardEvent } from 'react'
import { StatusBadge } from '@components/ui/StatusBadge'

export type VehicleCardProps = {
  vehicle: {
    id: string | number
    name: string
    speed: number
    messageTime?: string
    geofence?: string
    address?: string
    status: 'moving' | 'idling' | 'stopped' | 'offline'
    assignmentStatus: 'assigned' | 'unassigned'
  }
  onClick?: () => void
}

function formatMessageTime(messageTime?: string) {
  if (!messageTime) return '—'
  const parsed = new Date(messageTime)
  if (Number.isNaN(parsed.getTime())) return messageTime
  return parsed.toLocaleTimeString()
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const speedLabel = vehicle.speed === 0 ? 'Stopped' : `${vehicle.speed} km/h`
  const messageTime = formatMessageTime(vehicle.messageTime)
  const geofence = vehicle.geofence ?? 'Not in Any Geofence'
  const address = vehicle.address ?? '—'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      onClick?.()
    }
  }

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className='cursor-pointer space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition hover:shadow-lg dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800'
    >
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>{vehicle.name}</h3>
        <div className='flex items-center gap-2'>
          <StatusBadge status={vehicle.assignmentStatus} className='px-3 py-1' />
          <StatusBadge status={vehicle.status} className='px-3 py-1 uppercase' />
        </div>
      </div>

      <div className='text-sm text-slate-500 dark:text-gray-400'>
        Message Time: <span className='text-slate-800 dark:text-gray-200'>{messageTime}</span>
      </div>
      <div className='text-sm text-slate-500 dark:text-gray-400'>
        Geofence: <span className='text-cyan-600 dark:text-cyan-400'>{geofence}</span>
      </div>
      <div className='text-sm text-slate-500 dark:text-gray-400'>
        Address: <span className='text-slate-800 dark:text-gray-200'>{address}</span>
      </div>
      <div className='text-sm text-slate-500 dark:text-gray-400'>
        Speed: <span className='text-slate-800 dark:text-gray-200'>{speedLabel}</span>
      </div>
    </div>
  )
}
