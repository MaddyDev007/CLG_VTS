import { useEffect, useState } from 'react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { collegeService, type CollegeDetails } from '@services/collegeService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-2'>
      <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>{label}</span>
      <div className='rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-100'>
        {value || 'Not available'}
      </div>
    </div>
  )
}

export function CollegeDetailsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = location.pathname.endsWith('/edit')
  const [college, setCollege] = useState<CollegeDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const isDeletePending = college?.status === 'delete_pending'

  useEffect(() => {
    if (!id) {
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        const collegeData = await collegeService.getCollegeById(id)
        setCollege(collegeData)
        setName(collegeData.name)
        setStatus(collegeData.status === 'active' ? 'active' : 'inactive')
        setAdminName(collegeData.admin?.name ?? '')
        setAdminEmail(collegeData.admin?.email ?? '')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [id])

  const handleSave = async () => {
    if (!id) {
      return
    }

    const normalizedName = name.trim()
    const normalizedAdminName = adminName.trim()
    const normalizedAdminEmail = adminEmail.trim()

    if (!normalizedName || !normalizedAdminName || !normalizedAdminEmail) {
      setError('College name, status, admin name, and admin email are required.')
      return
    }

    if (!EMAIL_REGEX.test(normalizedAdminEmail)) {
      setError('Enter a valid admin email address.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      const response = await collegeService.updateCollege(id, {
        name: normalizedName,
        status,
        adminName: normalizedAdminName,
        adminEmail: normalizedAdminEmail,
      })

      setCollege(response.college)
      setName(response.college.name)
      setStatus(response.college.status === 'active' ? 'active' : 'inactive')
      setAdminName(response.college.admin?.name ?? normalizedAdminName)
      setAdminEmail(response.college.admin?.email ?? normalizedAdminEmail)
      setSuccessMessage(
        response.adminTemporaryPassword
          ? `College admin was missing and has been created. Temporary password: ${response.adminTemporaryPassword}`
          : 'College and college admin updated successfully.',
      )
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update college.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className='mx-auto w-full max-w-7xl rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
        Loading college details...
      </div>
    )
  }

  if (!college) {
    return (
      <div className='mx-auto w-full max-w-7xl rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
        College not found.
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <button
              type='button'
              onClick={() => navigate('/admin/colleges')}
              className='inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-[#38bdf8]'
            >
              <FiArrowLeft size={14} />
              Back to Colleges
            </button>
            <h2 className='mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>{college.name}</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>
              {isEditMode
                ? 'Edit college details and the assigned college admin.'
                : 'Read-only college details. Use Edit from the list page to make changes.'}
            </p>
          </div>

          {isEditMode ? (
            <button
              type='button'
              onClick={() => void handleSave()}
              disabled={isSaving || isDeletePending}
              className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              <FiSave size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          ) : null}
        </div>
      </section>

      {isDeletePending ? (
        <div className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300'>
          Delete request pending. Editing is disabled until the college admin approves or rejects the request.
        </div>
      ) : null}

      {error ? (
        <div className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300'>
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'>
          {successMessage}
        </div>
      ) : null}

      <section className='grid gap-5 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/30 bg-white/60 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
          <h3 className='text-base font-semibold text-slate-900 dark:text-slate-100'>College Details</h3>
          <div className='mt-4 grid gap-4'>
            {isEditMode ? (
              <>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isDeletePending}
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  />
                </label>

                <label className='space-y-2'>
                  <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as 'active' | 'inactive')}
                    disabled={isDeletePending}
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  >
                    <option value='active'>active</option>
                    <option value='inactive'>inactive</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <DetailField label='College Name' value={name} />
                <DetailField label='Status' value={status} />
              </>
            )}
          </div>
        </div>

        <div className='rounded-2xl border border-white/30 bg-white/60 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
          <h3 className='text-base font-semibold text-slate-900 dark:text-slate-100'>College Admin Details</h3>
          <div className='mt-4 grid gap-4'>
            {isEditMode ? (
              <>
                <label className='space-y-2'>
                  <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Admin Name</span>
                  <input
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                    disabled={isDeletePending}
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  />
                </label>

                <label className='space-y-2'>
                  <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Admin Email</span>
                  <input
                    type='email'
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    disabled={isDeletePending}
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  />
                </label>
              </>
            ) : (
              <>
                <DetailField label='Admin Name' value={adminName} />
                <DetailField label='Admin Email' value={adminEmail} />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
