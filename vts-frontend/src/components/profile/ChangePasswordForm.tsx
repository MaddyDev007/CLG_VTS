import { useState } from 'react'

type ChangePasswordFormProps = {
  onSubmit?: (payload: { currentPassword: string; newPassword: string }) => Promise<void> | void
}

export function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleUpdate = async () => {
    setError('')
    setMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setIsSaving(true)
    try {
      await onSubmit?.({ currentPassword, newPassword })
      setMessage('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update password.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Change Password</h3>
        <p className='text-sm text-slate-600 dark:text-slate-300'>Update your login credentials</p>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Current Password</span>
          <input
            type='password'
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>New Password</span>
          <input
            type='password'
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Confirm Password</span>
          <input
            type='password'
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
        </label>
      </div>

      {message ? <p className='mt-3 text-sm text-emerald-600 dark:text-emerald-300'>{message}</p> : null}
      {error ? <p className='mt-3 text-sm text-rose-600 dark:text-rose-300'>{error}</p> : null}

      <div className='mt-4 flex flex-wrap justify-end gap-2'>
        <button
          type='button'
          onClick={handleUpdate}
          disabled={isSaving}
          className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
        >
          {isSaving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </section>
  )
}
