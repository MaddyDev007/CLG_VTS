import { useMemo, useState } from 'react'
import { FiEdit, FiPlay, FiSlash, FiTrash2 } from 'react-icons/fi'
import type { UserRole } from '@services/authService'
import type { UserRecord } from '@services/userService'

type UsersTableProps = {
  users: UserRecord[]
  currentUser: {
    id?: string | null
    role: UserRole
    email?: string | null
  }
  onEdit: (user: UserRecord) => void
  onDelete: (user: UserRecord) => void
  onToggleStatus: (user: UserRecord) => void
}

type SortKey = 'name' | 'email' | 'role' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const roleLevel: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  COLLEGE_ADMIN: 3,
  FLEET_MANAGER: 2,
  STUDENT: 1,
}

export function UsersTable({ users, currentUser, onEdit, onDelete, onToggleStatus }: UsersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedUsers = useMemo(() => {
    const sorted = [...users]
    sorted.sort((a, b) => {
      let left: string | number = a[sortKey]
      let right: string | number = b[sortKey]

      if (sortKey === 'createdAt') {
        left = new Date(a.createdAt).getTime()
        right = new Date(b.createdAt).getTime()
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left
      }

      const compare = String(left).localeCompare(String(right))
      return sortDirection === 'asc' ? compare : -compare
    })

    return sorted
  }, [sortDirection, sortKey, users])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return ''
    }
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[960px] border-collapse text-sm'>
          <thead>
            <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('name')}>
                  Name{sortIndicator('name')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('email')}>
                  Email{sortIndicator('email')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('role')}>
                  Role{sortIndicator('role')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>College</th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('status')}>
                  Status{sortIndicator('status')}
                </button>
              </th>
              <th className='px-3 py-2 font-semibold'>
                <button type='button' onClick={() => handleSort('createdAt')}>
                  Created{sortIndicator('createdAt')}
                </button>
              </th>
              <th className='px-3 py-2 text-right font-semibold'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length ? (
              sortedUsers.map((user) => {
                const isCurrentUser =
                  (currentUser.id ? user.id === currentUser.id : false) ||
                  (!currentUser.id && currentUser.email ? user.email === currentUser.email : false)
                const canManage =
                  !isCurrentUser && roleLevel[user.role] < roleLevel[currentUser.role]

                return (
                  <tr
                    key={user.id}
                    className='border-b border-slate-200/70 transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
                  >
                    <td className='px-3 py-3 font-medium text-slate-900 dark:text-slate-100'>{user.name}</td>
                    <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{user.email}</td>
                    <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>{user.role}</td>
                    <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                      {user.collegeName ?? user.collegeId ?? '-'}
                    </td>
                    <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className='px-3 py-3 text-slate-700 dark:text-slate-200'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-3 py-3 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        {canManage ? (
                          <button
                            type='button'
                            onClick={() => onEdit(user)}
                            className='inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
                          >
                            <FiEdit size={14} />
                            Edit
                          </button>
                        ) : null}
                        {canManage ? (
                          <button
                            type='button'
                            onClick={() => onToggleStatus(user)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              user.status === 'active'
                                ? 'border border-amber-300 text-amber-700 hover:border-amber-500 hover:text-amber-600 dark:border-amber-500/60 dark:text-amber-200 dark:hover:border-amber-400 dark:hover:text-amber-100'
                                : 'border border-emerald-300 text-emerald-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-emerald-500/60 dark:text-emerald-200 dark:hover:border-emerald-400 dark:hover:text-emerald-100'
                            }`}
                          >
                            {user.status === 'active' ? <FiSlash size={14} /> : <FiPlay size={14} />}
                            {user.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        ) : null}
                        {canManage ? (
                          <button
                            type='button'
                            onClick={() => onDelete(user)}
                            className='inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-600 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200'
                          >
                            <FiTrash2 size={14} />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className='px-3 py-6 text-center text-sm text-slate-600 dark:text-slate-300'>
                  No users match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
