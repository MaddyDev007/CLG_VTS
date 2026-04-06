import { useEffect, useMemo, useState } from 'react'
import { collegeService, type CollegeOption } from '@services/collegeService'
import { useAuthStore } from '@store/authStore'
import { useCollegeFilterStore } from '@store/collegeFilterStore'

type CollegeScopeSelectorProps = {
  className?: string
  compact?: boolean
}

export function CollegeScopeSelector({ className = '', compact = false }: CollegeScopeSelectorProps) {
  const role = useAuthStore((state) => state.role)
  const selectedCollegeId = useCollegeFilterStore((state) => state.selectedCollegeId)
  const setSelectedCollegeId = useCollegeFilterStore((state) => state.setSelectedCollegeId)
  const [colleges, setColleges] = useState<CollegeOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (role !== 'SUPER_ADMIN') {
      return
    }

    const loadColleges = async () => {
      setIsLoading(true)
      try {
        const data = await collegeService.getCollegeOptions()
        setColleges(data)

        if (selectedCollegeId && !data.some((college) => college.id === selectedCollegeId)) {
          setSelectedCollegeId(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadColleges()
  }, [role, selectedCollegeId, setSelectedCollegeId])

  const selectedCollegeName = useMemo(
    () => colleges.find((college) => college.id === selectedCollegeId)?.name ?? null,
    [colleges, selectedCollegeId],
  )

  if (role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <div className={`flex min-w-[240px] flex-col gap-1 ${className}`}>
      {!compact ? (
        <span className='text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
          College Scope
        </span>
      ) : null}
      <select
        value={selectedCollegeId ?? ''}
        onChange={(event) => setSelectedCollegeId(event.target.value || null)}
        disabled={isLoading}
        className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-[#38bdf8]'
      >
        <option value=''>{isLoading ? 'Loading colleges...' : 'Select a college'}</option>
        {colleges.map((college) => (
          <option key={college.id} value={college.id}>
            {college.name}
          </option>
        ))}
      </select>
      {!compact ? (
        <span className='text-xs text-slate-500 dark:text-slate-400'>
          {selectedCollegeName ? `Scoped to ${selectedCollegeName}` : 'Scoped pages require a college selection.'}
        </span>
      ) : null}
    </div>
  )
}
