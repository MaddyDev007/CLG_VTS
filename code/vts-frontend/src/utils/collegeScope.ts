import { useAuthStore } from '@store/authStore'
import { useCollegeFilterStore } from '@store/collegeFilterStore'

type BuildCollegeScopedPathOptions = {
  collegeId?: string | null
  ignoreActiveCollegeScope?: boolean
}

function appendQueryParam(path: string, key: string, value: string): string {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

export function getActiveCollegeFilterId(): string | null {
  const role = useAuthStore.getState().role

  if (role !== 'SUPER_ADMIN') {
    return null
  }

  return useCollegeFilterStore.getState().selectedCollegeId
}

export function isSuperAdminCollegeScopeRequired(): boolean {
  const role = useAuthStore.getState().role
  return role === 'SUPER_ADMIN' && !getActiveCollegeFilterId()
}

export function buildCollegeScopedPath(path: string, options?: BuildCollegeScopedPathOptions): string {
  if (options?.ignoreActiveCollegeScope) {
    return path
  }

  const collegeId = options?.collegeId ?? getActiveCollegeFilterId()
  if (!collegeId) {
    return path
  }

  return appendQueryParam(path, 'collegeId', collegeId)
}

export function filterByActiveCollege<T>(items: T[]): T[] {
  const selectedCollegeId = getActiveCollegeFilterId()
  const role = useAuthStore.getState().role

  if (role !== 'SUPER_ADMIN') {
    return items
  }

  if (!selectedCollegeId) {
    return []
  }

  if (!Array.isArray(items)) {
    return items
  }

  return items.filter((item) => {
    if (!item || typeof item !== 'object' || !('collegeId' in item)) {
      return true
    }

    return item.collegeId === selectedCollegeId
  })
}
