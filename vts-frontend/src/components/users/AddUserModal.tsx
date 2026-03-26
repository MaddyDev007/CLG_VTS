import { useEffect, useMemo, useState } from 'react'
import type { CollegeOption } from '@services/collegeService'
import type { UserRole } from '@services/authService'

type RoleOption = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT'
type CollegeMode = 'existing' | 'new'

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: RoleOption
  collegeId?: string
  collegeName?: string
}

type AddUserModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreate?: (payload: CreateUserPayload) => Promise<void> | void
  colleges: CollegeOption[]
  isLoadingColleges?: boolean
  currentUserRole: UserRole
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddUserModal({
  isOpen,
  onClose,
  onCreate,
  colleges,
  isLoadingColleges = false,
  currentUserRole,
}: AddUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RoleOption>('SUPER_ADMIN')
  const [collegeMode, setCollegeMode] = useState<CollegeMode>('existing')
  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  const [newCollegeName, setNewCollegeName] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const availableRoles = useMemo<RoleOption[]>(() => {
    if (currentUserRole === 'SUPER_ADMIN') {
      return ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER', 'STUDENT']
    }

    if (currentUserRole === 'COLLEGE_ADMIN') {
      return ['FLEET_MANAGER', 'STUDENT']
    }

    if (currentUserRole === 'FLEET_MANAGER') {
      return ['STUDENT']
    }

    return []
  }, [currentUserRole])
  const shouldShowCollegeField = currentUserRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN'
  const canCreateNewCollege = role === 'COLLEGE_ADMIN'
  const collegeOptions = useMemo(() => colleges.map((college) => ({ label: college.name, value: college.id })), [colleges])
  const selectedCollegeLabel = useMemo(
    () => collegeOptions.find((college) => college.value === selectedCollegeId)?.label ?? '',
    [collegeOptions, selectedCollegeId],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setName('')
    setEmail('')
    setPassword('')
    setRole(currentUserRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : currentUserRole === 'COLLEGE_ADMIN' ? 'FLEET_MANAGER' : 'STUDENT')
    setCollegeMode('existing')
    setSelectedCollegeId('')
    setNewCollegeName('')
    setError('')
    setIsSaving(false)
  }, [currentUserRole, isOpen])

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0])
    }
  }, [availableRoles, role])

  useEffect(() => {
    if (!shouldShowCollegeField) {
      setCollegeMode('existing')
      setSelectedCollegeId('')
      setNewCollegeName('')
      return
    }

    if (role !== 'COLLEGE_ADMIN' && collegeMode === 'new') {
      setCollegeMode('existing')
      setNewCollegeName('')
    }

    if (collegeMode === 'existing' && !selectedCollegeId && colleges.length === 1) {
      setSelectedCollegeId(colleges[0].id)
    }
  }, [collegeMode, colleges, role, selectedCollegeId, shouldShowCollegeField])

  if (!isOpen) {
    return null
  }

  if (availableRoles.length === 0) {
    return null
  }

  const handleCreate = async () => {
    setError('')

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    const trimmedCollegeName = newCollegeName.trim()

    if (shouldShowCollegeField) {
      if (collegeMode === 'existing' && !selectedCollegeId) {
        setError('Select a college.')
        return
      }

      if (collegeMode === 'new' && !trimmedCollegeName) {
        setError('Enter a college name.')
        return
      }
    }

    setIsSaving(true)
    try {
      await onCreate?.({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        collegeId: shouldShowCollegeField && collegeMode === 'existing' ? selectedCollegeId : undefined,
        collegeName: shouldShowCollegeField && collegeMode === 'new' ? trimmedCollegeName : undefined,
      })
      onClose()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create user.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-h-full overflow-y-scroll max-w-lg rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <form autoComplete='off' onSubmit={(event) => event.preventDefault()}>
          <input type='text' name='prevent-autofill-email' autoComplete='username' className='hidden' tabIndex={-1} />
          <input type='password' name='prevent-autofill-password' autoComplete='current-password' className='hidden' tabIndex={-1} />
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Add User</h3>
          <p className='text-sm text-slate-600 dark:text-slate-300'>Create a new platform user</p>
        </div>

        <div className='space-y-3'>
          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Name</span>
            <input
              name='create-user-name'
              autoComplete='off'
              value={name}
              onChange={(event) => setName(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Email</span>
            <input
              type='email'
              name='create-user-email'
              autoComplete='off'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Password</span>
            <input
              type='password'
              name='create-user-password'
              autoComplete='new-password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value as RoleOption)} className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'>
              {availableRoles.map((availableRole) => (
                <option key={availableRole} value={availableRole}>
                  {availableRole}
                </option>
              ))}
            </select>
          </label>

          {shouldShowCollegeField ? (
            <div className='space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40'>
              <div className='space-y-1'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College</span>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  {canCreateNewCollege ? 'Choose an existing college or create a new one.' : 'Choose the college this user belongs to.'}
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
                  <input
                    value={newCollegeName}
                    onChange={(event) => setNewCollegeName(event.target.value)}
                    placeholder='Enter college name'
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  />
                </label>
              )}
            </div>
          ) : null}
        </div>

        {error ? <p className='mt-3 text-sm text-rose-600 dark:text-rose-300'>{error}</p> : null}

        <div className='mt-5 flex flex-wrap justify-end gap-2'>
          <button type='button' onClick={onClose} className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'>
            Cancel
          </button>
          <button type='button' onClick={handleCreate} disabled={isSaving} className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'>
            {isSaving ? 'Creating...' : 'Create User'}
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}
