import type { ReactNode } from 'react'
import { FiActivity, FiClock, FiTrendingUp, FiZap } from 'react-icons/fi'
import { formatDistance, formatDurationDetail } from '@utils/tripFormat'

type TripSummaryCardProps = {
  distance: number
  duration: number
  averageSpeed: number
  maxSpeed: number
}

type MetricCardProps = {
  label: string
  value: string
  icon: ReactNode
}

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <article className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='flex items-center gap-2 text-slate-500 dark:text-slate-300'>
        {icon}
        <p className='text-xs uppercase tracking-[0.1em]'>{label}</p>
      </div>
      <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{value}</p>
    </article>
  )
}

export function TripSummaryCard({ distance, duration, averageSpeed, maxSpeed }: TripSummaryCardProps) {
  return (
    <section className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
      <MetricCard
        label='Distance'
        value={formatDistance(distance)}
        icon={<FiActivity className='text-blue-600 dark:text-[#38bdf8]' size={16} />}
      />
      <MetricCard
        label='Duration'
        value={formatDurationDetail(duration)}
        icon={<FiClock className='text-blue-600 dark:text-[#38bdf8]' size={16} />}
      />
      <MetricCard
        label='Average Speed'
        value={`${Math.round(averageSpeed)} km/h`}
        icon={<FiTrendingUp className='text-blue-600 dark:text-[#38bdf8]' size={16} />}
      />
      <MetricCard
        label='Max Speed'
        value={`${Math.round(maxSpeed)} km/h`}
        icon={<FiZap className='text-blue-600 dark:text-[#38bdf8]' size={16} />}
      />
    </section>
  )
}
