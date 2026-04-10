import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { FiActivity, FiEye, FiEyeOff, FiLock, FiMail, FiMapPin, FiShield } from 'react-icons/fi'
import { useAuthStore } from '@store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = useMemo(
    () => Boolean(email.trim()) && Boolean(password.trim()) && !isLoading,
    [email, password, isLoading],
  )

  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-emerald-500/25 blur-3xl' />
        <div className='absolute bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/25 blur-3xl' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_48%)]' />
        <div className='absolute inset-0 bg-[linear-gradient(120deg,_rgba(15,23,42,0.9)_0%,_rgba(15,23,42,0.7)_45%,_rgba(2,6,23,0.95)_100%)]' />
        <div className='absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:48px_48px]' />
      </div>

      <div className='relative z-10 mx-auto grid w-full max-w-6xl gap-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr] lg:p-10'>
        <section className='flex flex-col justify-between gap-8'>
          <div>
            <div className='inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200'>
              VTS Command
            </div>
            <h1 className='mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl'>
              Command your fleet with live telemetry and intelligent alerts.
            </h1>
            <p className='mt-3 text-sm text-slate-300'>
              VTS gives you a unified view of vehicles, routes, and safety events in real time.
            </p>
          </div>

          <div className='grid gap-3 text-sm text-slate-200 sm:grid-cols-2'>
            <div className='rounded-2xl border border-white/10 bg-slate-900/55 p-4'>
              <FiMapPin className='text-cyan-300' size={18} />
              <p className='mt-2 font-semibold'>Live Location</p>
              <p className='text-xs text-slate-400'>Track vehicles with second‑by‑second updates.</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-900/55 p-4'>
              <FiActivity className='text-emerald-300' size={18} />
              <p className='mt-2 font-semibold'>Operational Insights</p>
              <p className='text-xs text-slate-400'>Trips, idling, overspeed, and stop events.</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-900/55 p-4'>
              <FiShield className='text-amber-300' size={18} />
              <p className='mt-2 font-semibold'>Safety Alerts</p>
              <p className='text-xs text-slate-400'>Actionable notifications for every incident.</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-900/55 p-4'>
              <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>Fleet Pulse</p>
              <div className='mt-3 grid grid-cols-3 gap-3 text-center'>
                <div>
                  <p className='text-lg font-semibold text-white'>128</p>
                  <p className='text-[11px] text-slate-400'>Active</p>
                </div>
                <div>
                  <p className='text-lg font-semibold text-white'>6</p>
                  <p className='text-[11px] text-slate-400'>Alerts</p>
                </div>
                <div>
                  <p className='text-lg font-semibold text-white'>14</p>
                  <p className='text-[11px] text-slate-400'>Idle</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='relative rounded-3xl border border-white/15 bg-slate-900/70 p-6 shadow-xl'>
          <div className='absolute inset-x-4 top-4 h-20 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-transparent to-emerald-400/20 blur-2xl' />
          <div className='relative'>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>Secure Access</p>
            <h2 className='mt-3 text-2xl font-semibold text-white'>Sign in</h2>
            <p className='mt-2 text-sm text-slate-300'>Access the operations dashboard.</p>
          </div>

          <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
            <label className='block space-y-2'>
              <span className='text-sm font-medium text-slate-200'>Email</span>
              <div className='relative'>
                <FiMail className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={16} />
                <input
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder='you@vts.local'
                  autoComplete='email'
                  className='w-full rounded-xl border border-white/15 bg-slate-950/60 px-10 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30'
                />
              </div>
            </label>

            <label className='block space-y-2'>
              <span className='text-sm font-medium text-slate-200'>Password</span>
              <div className='relative'>
                <FiLock className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder='Enter your password'
                  autoComplete='current-password'
                  className='w-full rounded-xl border border-white/15 bg-slate-950/60 px-10 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((prev) => !prev)}
                  className='absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-cyan-200'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </label>

            {error ? (
              <p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200'>{error}</p>
            ) : null}

            <button
              type='submit'
              disabled={!canSubmit}
              className='w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className='mt-6 border-t border-white/10 pt-4 text-xs text-slate-400'>
            Use your registered account credentials to continue.
          </div>
        </section>
      </div>
    </main>
  )
}
