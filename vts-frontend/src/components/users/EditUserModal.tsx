import { useEffect, useMemo, useState } from 'react'
import type { CollegeOption } from '@services/collegeService'

type RoleOption = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT'
type StatusOption = 'active' | 'disabled'
type CollegeMode = 'existing' | 'new'

export type EditableUser = {
  id: string
  name: string
  email: string
  role: RoleOption
  collegeId?: string | null
  collegeName?: string | null
  status: StatusOption
}

type EditUserModalProps = {
  user: EditableUser | null
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: EditableUser & { collegeNameInput?: string }) => Promise<void> | void
  colleges: CollegeOption[]
  isLoadingColleges?: boolean
}

export function EditUserModal({ user, isOpen, onClose, onSave, colleges, isLoadingColleges = false }: EditUserModalProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<RoleOption>('SUPER_ADMIN')
  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  const [newCollegeName, setNewCollegeName] = useState('')
  const [collegeMode, setCollegeMode] = useState<CollegeMode>('existing')
  const [status, setStatus] = useState<StatusOption>('active')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const shouldShowCollegeField = role !== 'SUPER_ADMIN'
  const canCreateNewCollege = role === 'COLLEGE_ADMIN'
  const collegeOptions = useMemo(() => {
    const mapped = colleges.map((college) => ({ label: college.name, value: college.id }))

    if (user?.collegeId && user.collegeName && !mapped.some((college) => college.value === user.collegeId)) {
      return [{ label: user.collegeName, value: user.collegeId }, ...mapped]
    }

    return mapped
  }, [colleges, user?.collegeId, user?.collegeName])
  const selectedCollegeLabel = useMemo(
    () => collegeOptions.find((college) => college.value === selectedCollegeId)?.label ?? '',
    [collegeOptions, selectedCollegeId],
  )

  useEffect(() => {
    if (!user || !isOpen) {
      return
    }

    setName(user.name)
    setRole(user.role)
    setSelectedCollegeId(user.collegeId ?? '')
    setNewCollegeName(user.collegeName ?? '')
    setCollegeMode(user.collegeId ? 'existing' : 'new')
    setStatus(user.status)
    setError('')
    setIsSaving(false)
  }, [isOpen, user])

  useEffect(() => {
    if (role === 'SUPER_ADMIN') {
      setSelectedCollegeId('')
      setNewCollegeName('')
      setCollegeMode('existing')
      return
    }

    if (role !== 'COLLEGE_ADMIN' && collegeMode === 'new') {
      setCollegeMode('existing')
    }

    if (collegeMode === 'existing' && !selectedCollegeId && collegeOptions.length === 1) {
      setSelectedCollegeId(collegeOptions[0].value)
    }
  }, [collegeMode, collegeOptions, role, selectedCollegeId])

  if (!isOpen || !user) {
    return null
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    if (shouldShowCollegeField) {
      if (collegeMode === 'existing' && !selectedCollegeId) {
        setError('Select a college.')
        return
      }

      if (collegeMode === 'new' && !newCollegeName.trim()) {
        setError('Enter a college name.')
        return
      }
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave?.({
        ...user,
        name: name.trim(),
        role,
        collegeId: shouldShowCollegeField && collegeMode === 'existing' ? selectedCollegeId : undefined,
        collegeName: shouldShowCollegeField ? (collegeMode === 'existing' ? colleges.find((item) => item.id === selectedCollegeId)?.name ?? null : newCollegeName.trim()) : null,
        collegeNameInput: shouldShowCollegeField && collegeMode === 'new' ? newCollegeName.trim() : undefined,
        status,
      })
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update user.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-lg rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Edit User</h3>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Update user profile and access</p>
        </div>

        <div className='space-y-3'>
          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]' />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Email</span>
            <input value={user.email} readOnly className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300' />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as RoleOption)} className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'>
              <option value='SUPER_ADMIN'>SUPER_ADMIN</option>
              <option value='COLLEGE_ADMIN'>COLLEGE_ADMIN</option>
              <option value='FLEET_MANAGER'>FLEET_MANAGER</option>
              <option value='STUDENT'>STUDENT</option>
            </select>
          </label>

          {shouldShowCollegeField ? (
            <div className='space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40'>
              <div className='space-y-1'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College</span>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  {canCreateNewCollege ? 'Keep the current college, switch to another one, or enter a new college name.' : 'Choose the college this user belongs to.'}
                </p>
              </div>

              {canCreateNewCollege ? (
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    type='button'
                    onClick={() => setCollegeMode('existing')}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      collegeMode === 'existing'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-[#38bdf8] dark:bg-sky-950/40 dark:text-sky-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200'
                    }`}
                  >
                    Existing college
                  </button>
                  <button
                    type='button'
                    onClick={() => setCollegeMode('new')}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      collegeMode === 'new'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-[#38bdf8] dark:bg-sky-950/40 dark:text-sky-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200'
                    }`}
                  >
                    New college
                  </button>
                </div>
              ) : null}

              {collegeMode === 'existing' ? (
                <label className='space-y-1'>
                  <span className='text-sm text-slate-600 dark:text-slate-300'>Select college</span>
                  <select
                    value={selectedCollegeId}
                    onChange={(event) => setSelectedCollegeId(event.target.value)}
                    disabled={isLoadingColleges}
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  >
                    <option value=''>{isLoadingColleges ? 'Loading colleges...' : 'Select college'}</option>
                    {collegeOptions.map((college) => (
                      <option key={college.value} value={college.value}>
                        {college.label}
                      </option>
                    ))}
                  </select>
                  {selectedCollegeLabel ? (
                    <p className='text-xs font-medium text-emerald-700 dark:text-emerald-300'>Selected: {selectedCollegeLabel}</p>
                  ) : null}
                </label>
              ) : (
                <label className='space-y-1'>
                  <span className='text-sm text-slate-600 dark:text-slate-300'>Enter new college name</span>
                  <input value={newCollegeName} onChange={(event) => setNewCollegeName(event.target.value)} placeholder='Enter college name' className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]' />
                </label>
              )}
            </div>
          ) : null}

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusOption)} className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'>
              <option value='active'>Active</option>
              <option value='disabled'>Disabled</option>
            </select>
          </label>
        </div>

        {error ? <p className='mt-3 text-sm text-rose-600 dark:text-rose-300'>{error}</p> : null}

        <div className='mt-5 flex flex-wrap justify-end gap-2'>
          <button type='button' onClick={onClose} className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'>
            Cancel
          </button>
          <button type='button' onClick={handleSave} disabled={isSaving} className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
