import { clsx } from 'clsx'
import type { UserStatus } from '@services/userService'

type UserStatusBadgeProps = {
  status: UserStatus
}

const statusStyles: Record<UserStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  disabled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}
