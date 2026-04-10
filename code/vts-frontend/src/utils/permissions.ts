import type { UserRole } from '@services/authService'
import { getActiveCollegeFilterId } from '@utils/collegeScope'

export type AppPage =
  | '/dashboard'
  | '/vehicles'
  | '/devices'
  | '/routes'
  | '/geofence'
  | '/trips'
  | '/live-map'
  | '/telemetry'
  | '/notifications'
  | '/overspeed'
  | '/idling'
  | '/stop'
  | '/users'
  | '/admin/colleges'

const studentHiddenPages = new Set<AppPage>(['/devices', '/telemetry', '/users', '/admin/colleges'])
const superAdminOnlyPages = new Set<AppPage>(['/admin/colleges'])

export function canCreate(role: UserRole | null): boolean {
  if (role === 'SUPER_ADMIN') {
    return Boolean(getActiveCollegeFilterId())
  }

  return role !== 'STUDENT' && role !== null
}

export function canEdit(role: UserRole | null): boolean {
  if (role === 'SUPER_ADMIN') {
    return Boolean(getActiveCollegeFilterId())
  }

  return role !== 'STUDENT' && role !== null
}

export function canDelete(role: UserRole | null): boolean {
  if (role === 'SUPER_ADMIN') {
    return Boolean(getActiveCollegeFilterId())
  }

  return role !== 'STUDENT' && role !== null
}

export function canAccessPage(role: UserRole | null, page: AppPage): boolean {
  if (superAdminOnlyPages.has(page)) {
    return role === 'SUPER_ADMIN'
  }

  if (role === 'STUDENT') {
    return !studentHiddenPages.has(page)
  }

  return true
}
