import { useEffect, useState } from 'react'
import { FiArrowRight, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { collegeService, type CollegeSummary } from '@services/collegeService'
import { GLOBAL_SCOPE_KEY, useScopedDataSyncVersion } from '@store/dataSyncStore'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CollegesPage() {
  const navigate = useNavigate()
  const [colleges, setColleges] = useState<CollegeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCollegeName, setNewCollegeName] = useState('')
  const [newCollegeStatus, setNewCollegeStatus] = useState<'active' | 'inactive'>('active')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [rowActionError, setRowActionError] = useState('')
  const [requestingDeleteId, setRequestingDeleteId] = useState<string | null>(null)
  const syncVersion = useScopedDataSyncVersion(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })

  const loadColleges = async () => {
    setIsLoading(true)
    try {
      const data = await collegeService.getColleges({ includeAll: true })
      setColleges(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadColleges()
  }, [syncVersion])

  const resetCreateForm = () => {
    setNewCollegeName('')
    setNewCollegeStatus('active')
    setAdminName('')
    setAdminEmail('')
    setCreateError('')
  }

  const handleCreateCollege = async () => {
    const normalizedCollegeName = newCollegeName.trim()
    const normalizedAdminName = adminName.trim()
    const normalizedAdminEmail = adminEmail.trim()

    if (!normalizedCollegeName || !normalizedAdminName || !normalizedAdminEmail) {
      setCreateError('College name, status, admin name, and admin email are required.')
      return
    }

    if (!EMAIL_REGEX.test(normalizedAdminEmail)) {
      setCreateError('Enter a valid admin email address.')
      return
    }

    setIsCreating(true)
    setCreateError('')
    setCreateSuccess('')
    try {
      const response = await collegeService.createCollege({
        name: normalizedCollegeName,
        status: newCollegeStatus,
        adminName: normalizedAdminName,
        adminEmail: normalizedAdminEmail,
      })

      setCreateSuccess(
        response.adminTemporaryPassword
          ? `College created. College admin login: ${normalizedAdminEmail}. Temporary password: ${response.adminTemporaryPassword}. If it is lost, open View Details and generate a new temporary password.`
          : 'College created successfully.',
      )
      resetCreateForm()
      setIsCreateOpen(false)
      await loadColleges()
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create college.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRequestDelete = async (college: CollegeSummary) => {
    if (college.status === 'delete_pending') {
      return
    }

    const confirmed = window.confirm(
      `Request deletion for ${college.name}? The assigned college admin will need to approve or reject it. Super admins can still delete an empty college directly from View Details if needed.`,
    )
    if (!confirmed) {
      return
    }

    setRowActionError('')
    setRequestingDeleteId(college.id)
    try {
      const response = await collegeService.requestDeleteCollege(college.id)
      setColleges((current) => current.map((item) => (item.id === college.id ? response.college : item)))
    } catch (error) {
      setRowActionError(error instanceof Error ? error.message : 'Failed to request college deletion.')
    } finally {
      setRequestingDeleteId(null)
    }
  }

  const renderStatusBadge = (status: CollegeSummary['status']) => {
    if (status === 'delete_pending') {
      return (
        <span className='rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold uppercase text-rose-700 dark:bg-rose-950/50 dark:text-rose-200'>
          Delete Request Pending
        </span>
      )
    }

    return (
      <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
        {status}
      </span>
    )
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>College Management</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>
              Global super admin view. Every college must have exactly one college admin.
            </p>
          </div>

          <button
            type='button'
            onClick={() => {
              setCreateError('')
              setCreateSuccess('')
              setIsCreateOpen((prev) => !prev)
            }}
            className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
          >
            <FiPlus size={16} />
            Create College
          </button>
        </div>

        {isCreateOpen ? (
          <div className='mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40'>
            <div className='grid gap-3 md:grid-cols-2'>
              <label className='space-y-1'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College Name</span>
                <input
                  value={newCollegeName}
                  onChange={(event) => setNewCollegeName(event.target.value)}
                  placeholder='Enter college name'
                  className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                />
              </label>

              <label className='space-y-1'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Status</span>
                <select
                  value={newCollegeStatus}
                  onChange={(event) => setNewCollegeStatus(event.target.value as 'active' | 'inactive')}
                  className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                >
                  <option value='active'>active</option>
                  <option value='inactive'>inactive</option>
                </select>
              </label>

              <label className='space-y-1'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Admin Name</span>
                <input
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  placeholder='Enter admin name'
                  className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                />
              </label>

              <label className='space-y-1'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Admin Email</span>
                <input
                  type='email'
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  placeholder='Enter admin email'
                  className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                />
              </label>
            </div>

            <div className='mt-4 flex flex-wrap justify-end gap-2'>
              <button
                type='button'
                onClick={() => {
                  resetCreateForm()
                  setIsCreateOpen(false)
                }}
                className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={() => void handleCreateCollege()}
                disabled={isCreating}
                className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isCreating ? 'Creating...' : 'Create College'}
              </button>
            </div>

            {createError ? <p className='mt-3 text-sm text-rose-600 dark:text-rose-300'>{createError}</p> : null}
          </div>
        ) : null}

        {createSuccess ? (
          <div className='mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'>
            {createSuccess}
          </div>
        ) : null}

        {rowActionError ? (
          <div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300'>
            {rowActionError}
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading colleges...
        </div>
      ) : colleges.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          No colleges found yet. Create your first college to get started.
        </div>
      ) : (
        <section className='overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-slate-200 dark:divide-slate-700'>
              <thead className='bg-slate-50/80 dark:bg-slate-900/40'>
                <tr className='text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  <th className='px-4 py-3'>College Name</th>
                  <th className='px-4 py-3'>College ID</th>
                  <th className='px-4 py-3'>College Admin</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 text-sm text-slate-700 dark:divide-slate-800 dark:text-slate-200'>
                {colleges.map((college) => (
                  <tr key={college.id}>
                    <td className='px-4 py-4 font-semibold'>{college.name}</td>
                    <td className='px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400'>{college.id}</td>
                    <td className='px-4 py-4'>
                      <div>{college.admin?.name ?? 'Admin missing'}</div>
                      <div className='text-xs text-slate-500 dark:text-slate-400'>
                        {college.admin?.email ?? 'Open details to create the required admin'}
                      </div>
                      {college.admin?.mustChangePassword ? (
                        <div className='mt-1 text-xs font-medium text-amber-600 dark:text-amber-300'>
                          Temporary password still active
                        </div>
                      ) : null}
                    </td>
                    <td className='px-4 py-4'>
                      {renderStatusBadge(college.status)}
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex flex-wrap gap-2'>
                        <button
                          type='button'
                          onClick={() => navigate(`/admin/colleges/${college.id}`)}
                          className='inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
                        >
                          <FiArrowRight size={14} />
                          View Details
                        </button>
                        <button
                          type='button'
                          onClick={() => navigate(`/admin/colleges/${college.id}/edit`)}
                          disabled={college.status === 'delete_pending'}
                          className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                        <button
                          type='button'
                          onClick={() => void handleRequestDelete(college)}
                          disabled={college.status !== 'active' || requestingDeleteId === college.id}
                          className='inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
                        >
                          <FiTrash2 size={14} />
                          {college.status === 'delete_pending'
                            ? 'Pending'
                            : college.status !== 'active'
                              ? 'Unavailable'
                            : requestingDeleteId === college.id
                              ? 'Requesting...'
                              : 'Request Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
