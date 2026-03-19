import { useEffect, useMemo, useState } from 'react'
import { overspeedService } from '@services/overspeedService'
import { idlingService } from '@services/idlingService'
import { stopService } from '@services/stopService'
import { formatDuration } from '@utils/time'
import type { IdlingEvent, OverspeedEvent, StopEvent } from '../../types/events'

type VehicleEventType = 'overspeed' | 'idling' | 'stop'

type VehicleEventRow = {
  id: string
  type: VehicleEventType
  startTime: string
  endTime: string
  duration: number
  location: string
  details?: string
}

type VehicleEventsTableProps = {
  vehicleId: string
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function toRow(event: OverspeedEvent | IdlingEvent | StopEvent, type: VehicleEventType): VehicleEventRow {
  let details = ''
  if (type === 'overspeed') {
    const overspeed = event as OverspeedEvent
    details = `Max ${overspeed.maxSpeed} km/h (Limit ${overspeed.speedLimit})`
  }
  return {
    id: event.id,
    type,
    startTime: event.startTime,
    endTime: event.endTime,
    duration: event.duration,
    location: event.location,
    details: details || undefined,
  }
}

export function VehicleEventsTable({ vehicleId }: VehicleEventsTableProps) {
  const [events, setEvents] = useState<VehicleEventRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true)
      const now = new Date()
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [overspeed, idling, stop] = await Promise.all([
        overspeedService.getOverspeedEvents({ vehicleId }),
        idlingService.getIdlingEvents({ vehicleId }),
        stopService.getStopEvents({
          vehicleId,
          startDate: start.toISOString(),
          endDate: now.toISOString(),
        }),
      ])

      const merged = [
        ...overspeed.map((event) => toRow(event, 'overspeed')),
        ...idling.map((event) => toRow(event, 'idling')),
        ...stop.map((event) => toRow(event, 'stop')),
      ]
      setEvents(merged)
      setIsLoading(false)
    }

    void loadEvents()
  }, [vehicleId])

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      ),
    [events],
  )

  if (isLoading) {
    return (
      <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
        Loading events...
      </div>
    )
  }

  if (sortedEvents.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
        No events found for this vehicle.
      </div>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[720px] border-collapse text-sm'>
        <thead>
          <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
            <th className='px-3 py-2 font-semibold'>Type</th>
            <th className='px-3 py-2 font-semibold'>Start</th>
            <th className='px-3 py-2 font-semibold'>End</th>
            <th className='px-3 py-2 font-semibold'>Duration</th>
            <th className='px-3 py-2 font-semibold'>Location</th>
            <th className='px-3 py-2 font-semibold'>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedEvents.map((event) => (
            <tr
              key={event.id}
              className='border-b border-slate-200/70 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-800/60'
            >
              <td className='px-3 py-3 capitalize'>{event.type}</td>
              <td className='px-3 py-3'>{formatDate(event.startTime)}</td>
              <td className='px-3 py-3'>{formatDate(event.endTime)}</td>
              <td className='px-3 py-3'>{formatDuration(event.duration)}</td>
              <td
                className='max-w-xs truncate px-3 py-3'
                title={event.location.trim().length > 0 ? event.location : 'Location unavailable'}
              >
                {event.location.trim().length > 0 ? event.location : 'Location unavailable'}
              </td>
              <td className='px-3 py-3 text-slate-500 dark:text-slate-300'>{event.details ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
