import { FiClock, FiMapPin, FiTruck, FiZap } from 'react-icons/fi'
import { formatDuration } from '@utils/time'

type OverspeedEventCardProps = {
  vehicleName: string
  maxSpeed: number
  speedLimit: number
  duration: number
  time: string
  location: string
}

export function OverspeedEventCard({
  vehicleName,
  maxSpeed,
  speedLimit,
  duration,
  time,
  location,
}: OverspeedEventCardProps) {
  const resolvedLocation = location.trim().length > 0 ? location : 'Location unavailable'

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3'>
        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>
            <FiTruck size={14} /> Vehicle
          </p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{vehicleName}</p>
        </article>

        <article className='rounded-xl border border-rose-200 bg-rose-50/90 p-3 dark:border-rose-500/40 dark:bg-rose-500/10'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-rose-700 dark:text-rose-300'>
            <FiZap size={14} /> Max Speed
          </p>
          <p className='font-semibold text-rose-700 dark:text-rose-300'>{maxSpeed} km/h</p>
        </article>

        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>Speed Limit</p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{speedLimit} km/h</p>
        </article>

        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>Duration</p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{formatDuration(duration)}</p>
        </article>

        <article className='rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50'>
          <p className='mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400'>
            <FiClock size={14} /> Time
          </p>
          <p className='font-semibold text-slate-900 dark:text-slate-100'>{new Date(time).toLocaleString()}</p>
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
