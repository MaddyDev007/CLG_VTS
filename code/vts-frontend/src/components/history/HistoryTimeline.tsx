import { useMemo, useState } from 'react'
import type { HistoryEvent } from '../../types/history'

type HistoryTimelineProps = {
  events: HistoryEvent[]
  pageSize?: number
}

function eventDotClass(type: HistoryEvent['type']): string {
  if (type === 'trip_start') {
    return 'bg-emerald-500'
  }
  if (type === 'trip_end') {
    return 'bg-blue-500'
  }
  if (type === 'stop') {
    return 'bg-rose-500'
  }
  return 'bg-orange-500'
}

function eventLabel(type: HistoryEvent['type']): string {
  if (type === 'trip_start') {
    return 'Trip Start'
  }
  if (type === 'trip_end') {
    return 'Trip End'
  }
  if (type === 'stop') {
    return 'Stop'
  }
  return 'Idling'
}

export function HistoryTimeline({ events, pageSize = 20 }: HistoryTimelineProps) {
  const [page, setPage] = useState(1)
  const resolveLocation = (location: string) => (location.trim().length > 0 ? location : 'Location unavailable')

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    [events],
  )

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedEvents.slice(startIndex, startIndex + pageSize)
  }, [currentPage, pageSize, sortedEvents])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Timeline Events</h3>
        <p className='text-xs text-slate-600 dark:text-slate-300'>
          Page {currentPage} of {totalPages}
        </p>
      </div>

      {pagedEvents.length ? (
        <div className='relative space-y-4 pl-6 before:absolute before:bottom-0 before:left-[9px] before:top-0 before:w-px before:bg-slate-300 dark:before:bg-slate-600'>
          {pagedEvents.map((event, index) => (
            <article key={`${event.type}-${event.time}-${index}`} className='relative'>
              <span
                className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#1e293b] ${eventDotClass(event.type)}`}
              />
              <p className='text-sm font-semibold text-slate-900 dark:text-slate-100'>{eventLabel(event.type)}</p>
              <time className='text-xs text-slate-600 dark:text-slate-300'>
                {new Date(event.time).toLocaleString()}
              </time>
              <p className='mt-1 text-sm text-slate-700 dark:text-slate-200'>{resolveLocation(event.location)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className='text-sm text-slate-600 dark:text-slate-300'>No timeline events available.</p>
      )}

      <footer className='mt-4 flex justify-end gap-2'>
        <button
          type='button'
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Previous
        </button>
        <button
          type='button'
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage >= totalPages}
          className='rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Next
        </button>
      </footer>
    </section>
  )
}
