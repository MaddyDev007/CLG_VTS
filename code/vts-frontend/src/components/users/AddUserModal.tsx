import { useEffect, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import type { UserRole } from '@services/authService'

type RoleOption = 'FLEET_MANAGER' | 'STUDENT'

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: RoleOption
}

type AddUserModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreate?: (payload: CreateUserPayload) => Promise<void> | void
  currentUserRole: UserRole
  availableRoles: RoleOption[]
  scopedCollegeName?: string | null
  helperText?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddUserModal({
  isOpen,
  onClose,
  onCreate,
  currentUserRole,
  availableRoles,
  scopedCollegeName,
  helperText,
}: AddUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RoleOption>('FLEET_MANAGER')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName('')
    setEmail('')
    setPassword('')
    setRole(availableRoles[0] ?? 'STUDENT')
    setError('')
    setIsSaving(false)
    setShowPassword(false)
  }, [availableRoles, currentUserRole, isOpen])

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0])
    }
  }, [availableRoles, role])

  if (!isOpen || availableRoles.length === 0) {
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

    setIsSaving(true)
    try {
      await onCreate?.({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
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
      <div className='w-full max-h-full max-w-lg overflow-y-scroll rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <form autoComplete='off' onSubmit={(event) => event.preventDefault()}>
          <input type='text' name='prevent-autofill-email' autoComplete='username' className='hidden' tabIndex={-1} />
          <input type='password' name='prevent-autofill-password' autoComplete='current-password' className='hidden' tabIndex={-1} />

          <div className='mb-4'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Add User</h3>
            <p className='text-sm text-slate-600 dark:text-slate-300'>
              {helperText ?? 'Create a new user for the active college scope'}
            </p>
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
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name='create-user-password'
                  autoComplete='new-password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((prev) => !prev)}
                  className='absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-cyan-300'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </label>

            <label className='space-y-1'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as RoleOption)}
                disabled={availableRoles.length === 0}
                className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
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
              onClick={handleCreate}
              disabled={isSaving}
              className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              {isSaving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
