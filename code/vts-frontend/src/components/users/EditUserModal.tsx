import { useEffect, useState } from 'react'

type RoleOption = 'FLEET_MANAGER' | 'STUDENT'
type StatusOption = 'active' | 'disabled'

export type EditableUser = {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT'
  collegeId?: string | null
  collegeName?: string | null
  status: StatusOption
}

type EditUserModalProps = {
  user: EditableUser | null
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: EditableUser) => Promise<void> | void
  availableRoles: RoleOption[]
  scopedCollegeName?: string | null
}

export function EditUserModal({ user, isOpen, onClose, onSave, availableRoles, scopedCollegeName }: EditUserModalProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<RoleOption>('FLEET_MANAGER')
  const [status, setStatus] = useState<StatusOption>('active')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user || !isOpen) {
      return
    }

    setName(user.name)
    setRole(user.role === 'STUDENT' ? 'STUDENT' : 'FLEET_MANAGER')
    setStatus(user.status)
    setError('')
    setIsSaving(false)
  }, [isOpen, user])

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0])
    }
  }, [availableRoles, role])

  if (!isOpen || !user || availableRoles.length === 0) {
    return null
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave?.({
        ...user,
        name: name.trim(),
        role,
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
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Email</span>
            <input
              value={user.email}
              readOnly
              className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
            />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as RoleOption)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              {availableRoles.map((availableRole) => (
                <option key={availableRole} value={availableRole}>
                  {availableRole}
                </option>
              ))}
            </select>
          </label>

          {scopedCollegeName ? (
            <div className='rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College Scope</span>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>{scopedCollegeName}</p>
            </div>
          ) : null}

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusOption)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              <option value='active'>Active</option>
              <option value='disabled'>Disabled</option>
            </select>
          </label>
        </div>

        {error ? <p className='mt-3 text-sm text-rose-600 dark:text-rose-300'>{error}</p> : null}

        <div className='mt-5 flex flex-wrap justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={isSaving}
            className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
