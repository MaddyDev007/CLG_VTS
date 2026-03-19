import type { ReactNode } from 'react'

type MetricCardProps = {
  title: string
  value: string
  hint?: string
  icon?: ReactNode
}

export function MetricCard({ title, value, hint, icon }: MetricCardProps) {
  return (
    <article className='group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-[#1e293b]'>
      <div className='pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-opacity group-hover:opacity-100 dark:bg-[#38bdf8]/20' />
      <div className='relative flex items-start justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>
            {title}
          </p>
          <p className='mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100'>{value}</p>
          {hint ? <p className='mt-2 text-sm text-blue-600 dark:text-[#38bdf8]'>{hint}</p> : null}
        </div>

        {icon ? (
          <div className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-[#38bdf8]'>
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  )
}
