import { clsx } from 'clsx'
import type { UserRole } from '@services/authService'

type RoleBadgeProps = {
  role: UserRole
}

const roleStyles: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200',
  COLLEGE_ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  FLEET_MANAGER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  STUDENT: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        roleStyles[role],
      )}
    >
      {role}
    </span>
  )
}
