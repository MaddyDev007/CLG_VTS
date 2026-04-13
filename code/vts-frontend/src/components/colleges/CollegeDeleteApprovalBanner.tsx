import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collegeService, type CollegeSummary } from '@services/collegeService'
import { useAuthStore } from '@store/authStore'
import { GLOBAL_SCOPE_KEY, useScopedDataSyncVersion } from '@store/dataSyncStore'

export function CollegeDeleteApprovalBanner() {
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const logout = useAuthStore((state) => state.logout)
  const [college, setCollege] = useState<CollegeSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState('')
  const syncVersion = useScopedDataSyncVersion(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })

  useEffect(() => {
    if (role !== 'COLLEGE_ADMIN') {
      setCollege(null)
      return
    }

    const loadCollege = async () => {
      setIsLoading(true)
      setError('')
      try {
        const colleges = await collegeService.getColleges()
        setCollege(colleges[0] ?? null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load college status.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadCollege()
  }, [role, syncVersion])

  if (role !== 'COLLEGE_ADMIN' || isLoading || college?.status !== 'delete_pending') {
    return error ? (
      <div className='mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300'>
        {error}
      </div>
    ) : null
  }

  const handleApprove = async () => {
    if (!college) {
      return
    }

    const confirmed = window.confirm(
      'Approve deletion for this college? This will remove the college and log you out if deletion succeeds.',
    )
    if (!confirmed) {
      return
    }

    setIsApproving(true)
    setError('')
    try {
      await collegeService.deleteCollege(college.id)
      logout()
      navigate('/login', { replace: true })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to approve college deletion.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!college) {
      return
    }

    const confirmed = window.confirm('Reject this delete request and keep the college active?')
    if (!confirmed) {
      return
    }

    setIsRejecting(true)
    setError('')
    try {
      const response = await collegeService.cancelDeleteCollege(college.id)
      setCollege(response.college)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to reject delete request.')
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className='mb-5 rounded-2xl border border-rose-300 bg-rose-50/90 px-5 py-4 text-rose-900 shadow-lg shadow-rose-900/5 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-100'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h3 className='text-base font-semibold'>Your college has a pending delete request</h3>
          <p className='mt-1 text-sm text-rose-700 dark:text-rose-200'>
            Review this request carefully. Approving will permanently remove the college after validation.
          </p>
          {error ? <p className='mt-2 text-sm font-medium text-rose-700 dark:text-rose-200'>{error}</p> : null}
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={() => void handleReject()}
            disabled={isApproving || isRejecting}
            className='rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-700 dark:text-rose-100 dark:hover:bg-rose-900/40'
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
          <button
            type='button'
            onClick={() => void handleApprove()}
            disabled={isApproving || isRejecting}
            className='rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}
