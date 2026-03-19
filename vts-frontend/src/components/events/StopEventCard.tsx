import { FiClock, FiMapPin, FiTruck } from 'react-icons/fi'
import { formatDuration } from '@utils/time'

type StopEventCardProps = {
  vehicleName: string
  duration: number
  startTime: string
  endTime: string
  location: string
}

export function StopEventCard({ vehicleName, duration, startTime, endTime, location }: StopEventCardProps) {
  const resolvedLocation = location.trim().length > 0 ? location : 'Location unavailable'

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5'>
        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>
            <FiTruck size={14} /> Vehicle
          </p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{vehicleName}</p>
        </article>

        <article className='rounded-xl border border-orange-200 bg-orange-50/90 p-3 dark:border-orange-500/40 dark:bg-orange-500/10'>
          <p className='mb-1 text-xs uppercase tracking-[0.08em] text-orange-700 dark:text-orange-300'>Stop Duration</p>
          <p className='text-xl font-bold text-orange-700 dark:text-orange-300'>{formatDuration(duration)}</p>
        </article>

        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>
            <FiClock size={14} /> Start Time
          </p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{new Date(startTime).toLocaleString()}</p>
        </article>

        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>
            <FiClock size={14} /> End Time
          </p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{new Date(endTime).toLocaleString()}</p>
        </article>

        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>
            <FiMapPin size={14} /> Location
          </p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{resolvedLocation}</p>
        </article>
      </div>
    </section>
  )
}
