import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type StatColor = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'slate'

type StatCardProps = {
  title: string
  value: string | number
  icon: ReactNode
  color: StatColor
  trend?: string
}

const colorStyles: Record<StatColor, { accent: string; glow: string }> = {
  cyan: {
    accent: 'text-cyan-600 dark:text-cyan-300',
    glow: 'bg-cyan-500/15 dark:bg-cyan-400/20',
  },
  emerald: {
    accent: 'text-emerald-600 dark:text-emerald-300',
    glow: 'bg-emerald-500/15 dark:bg-emerald-400/20',
  },
  amber: {
    accent: 'text-amber-600 dark:text-amber-300',
    glow: 'bg-amber-500/15 dark:bg-amber-400/20',
  },
  rose: {
    accent: 'text-rose-600 dark:text-rose-300',
    glow: 'bg-rose-500/15 dark:bg-rose-400/20',
  },
  violet: {
    accent: 'text-violet-600 dark:text-violet-300',
    glow: 'bg-violet-500/15 dark:bg-violet-400/20',
  },
  blue: {
    accent: 'text-blue-600 dark:text-[#38bdf8]',
    glow: 'bg-blue-500/15 dark:bg-[#38bdf8]/20',
  },
  slate: {
    accent: 'text-slate-600 dark:text-slate-300',
    glow: 'bg-slate-500/15 dark:bg-slate-400/20',
  },
}

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const palette = colorStyles[color]

  return (
    <article className='group relative overflow-hidden rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div
        className={clsx(
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100',
          palette.glow,
        )}
      />

      <div className='relative'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>
            {title}
          </p>
          <span
            className={clsx(
              'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 dark:border-slate-600 dark:bg-slate-900/50',
              palette.accent,
            )}
          >
            {icon}
          </span>
        </div>

        <p className='mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100'>{value}</p>

        {trend ? <p className={clsx('mt-2 text-sm font-medium', palette.accent)}>{trend}</p> : null}
      </div>
    </article>
  )
}
