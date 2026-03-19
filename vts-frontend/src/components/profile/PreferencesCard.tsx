import { useEffect, useState } from 'react'
import type { NotificationPreferences } from '../../types/profile'
import { TimezoneSelector } from './TimezoneSelector'
import { NotificationPreferences as NotificationPreferencesForm } from './NotificationPreferences'
import { profileService } from '@services/profileService'

type PreferencesCardProps = {
  timezone: string
  preferences: NotificationPreferences
  onSave?: (payload: { timezone: string; preferences: NotificationPreferences }) => Promise<void> | void
}

const DEFAULT_TIMEZONE = 'Asia/Kolkata'
const DEFAULT_PREFERENCES: NotificationPreferences = {
  overspeed: true,
  idling: true,
  geofence: true,
  stop: true,
  deviceOffline: true,
}

export function PreferencesCard({ timezone, preferences, onSave }: PreferencesCardProps) {
  const [selectedTimezone, setSelectedTimezone] = useState(timezone || DEFAULT_TIMEZONE)
  const [values, setValues] = useState(preferences)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    setSelectedTimezone(timezone || DEFAULT_TIMEZONE)
    setValues(preferences)
    setMessage('')
    setError('')
  }, [preferences, timezone])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      await profileService.updatePreferences({ timezone: selectedTimezone, preferences: values })
      await onSave?.({ timezone: selectedTimezone, preferences: values })
      setMessage('Preferences updated.')
      setShowToast(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update preferences.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSelectedTimezone(DEFAULT_TIMEZONE)
    setValues(DEFAULT_PREFERENCES)
    setMessage('')
    setError('')
  }

  useEffect(() => {
    if (!showToast) {
      return
    }
    const timer = window.setTimeout(() => setShowToast(false), 2500)
    return () => window.clearTimeout(timer)
  }, [showToast])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      {showToast ? (
        <div className='fixed right-6 top-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'>
          Preferences saved
        </div>
      ) : null}
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Preferences</h3>
        <p className='text-sm text-slate-600 dark:text-slate-300'>Manage timezone and notification settings</p>
      </div>

      <div className='space-y-4'>
        <TimezoneSelector value={selectedTimezone} onChange={setSelectedTimezone} />

        <div>
          <p className='mb-2 text-sm font-medium text-slate-700 dark:text-slate-200'>Notification Preferences</p>
          <NotificationPreferencesForm value={values} onChange={setValues} />
        </div>
      </div>

      {message ? <p className='mt-3 text-sm text-emerald-600 dark:text-emerald-300'>{message}</p> : null}
      {error ? <p className='mt-3 text-sm text-rose-600 dark:text-rose-300'>{error}</p> : null}

      <div className='mt-4 flex flex-wrap justify-end gap-2'>
        <button
          type='button'
          onClick={handleReset}
          className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Reset Defaults
        </button>
        <button
          type='button'
          onClick={handleSave}
          disabled={isSaving}
          className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </section>
  )
}
