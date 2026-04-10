import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    setIsSaving(true)
    try {
      await onSubmit?.({ currentPassword, newPassword })
      setMessage('Password updated successfully.')
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
          <div className='relative'>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
            <button
              type='button'
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className='absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-cyan-300'
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
              {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>New Password</span>
          <div className='relative'>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
            <button
              type='button'
              onClick={() => setShowNewPassword((prev) => !prev)}
              className='absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-cyan-300'
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </label>

        <label className='space-y-1'>
          <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Confirm Password</span>
          <div className='relative'>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className='absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-cyan-300'
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
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
