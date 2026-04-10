import type { ReactNode } from 'react'

type WelcomeCardProps = {
  name: string
  role: string
  actions?: ReactNode
}

export function WelcomeCard({ name, role, actions }: WelcomeCardProps) {
  return (
    <section className='relative overflow-hidden rounded-3xl border border-white/30 bg-white/55 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/80 dark:shadow-black/20'>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,_rgba(37,99,235,0.08),_transparent_35%,_rgba(15,23,42,0.04)_100%)] dark:bg-[linear-gradient(110deg,_rgba(30,41,59,0.6),_rgba(51,65,85,0.22)_45%,_rgba(56,189,248,0.12)_100%)]' />
      <div className='pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.14),_transparent_62%)] dark:bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.16),_transparent_62%)]' />
      <div className='relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-[#38bdf8]'>
            Welcome Back
          </p>
          <h2 className='mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100'>{name}</h2>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
            Role: <span className='font-semibold text-slate-900 dark:text-slate-100'>{role}</span>
          </p>
        </div>
        {actions ? <div className='w-full max-w-xl lg:min-w-[320px]'>{actions}</div> : null}
      </div>
    </section>
  )
}
