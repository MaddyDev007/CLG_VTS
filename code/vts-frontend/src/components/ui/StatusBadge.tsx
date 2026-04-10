import { clsx } from 'clsx'
import type { VehicleStatus } from '../../types/vehicle'
import type { Device } from '../../types/device'

type BadgeStatus = VehicleStatus | Device['status']

type StatusBadgeProps = {
  status: BadgeStatus
  className?: string
}

const statusStyles: Record<BadgeStatus, string> = {
  moving: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  idling: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  offline: 'bg-slate-200 text-slate-700 dark:bg-slate-500/30 dark:text-slate-200',
  stopped: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  assigned: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  unassigned: 'bg-slate-200 text-slate-700 dark:bg-slate-500/30 dark:text-slate-200',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
