import { useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { AddUserModal, type CreateUserPayload } from '@components/users/AddUserModal'
import { EditUserModal, type EditableUser } from '@components/users/EditUserModal'
import { DeleteUserDialog } from '@components/users/DeleteUserDialog'
import { UsersTable } from '@components/users/UsersTable'
import type { UserRole } from '@services/authService'
import { collegeService, type CollegeOption } from '@services/collegeService'
import { userService, type UserRecord } from '@services/userService'
import { useAuthStore } from '@store/authStore'
import { useCollegeFilterStore } from '@store/collegeFilterStore'
import { GLOBAL_SCOPE_KEY, useScopedDataSyncVersion } from '@store/dataSyncStore'

const roleLevel: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  COLLEGE_ADMIN: 3,
  FLEET_MANAGER: 2,
  STUDENT: 1,
}

type AssignableRole = 'FLEET_MANAGER' | 'STUDENT'

function toAssignableRole(role: EditableUser['role']): AssignableRole {
  return role === 'STUDENT' ? 'STUDENT' : 'FLEET_MANAGER'
}

export function UsersPage() {
  const currentUserRole = useAuthStore((state) => state.role) ?? 'STUDENT'
  const currentUser = useAuthStore((state) => state.user)
  const selectedCollegeId = useCollegeFilterStore((state) => state.selectedCollegeId)
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN'
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)
  const [colleges, setColleges] = useState<CollegeOption[]>([])
  const usersSyncVersion = useScopedDataSyncVersion(['users'])
  const collegesSyncVersion = useScopedDataSyncVersion(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [selectedCollegeId, usersSyncVersion])

  useEffect(() => {
    const loadColleges = async () => {
      const data = await collegeService.getCollegeOptions()
      setColleges(data)
    }

    void loadColleges()
  }, [collegesSyncVersion])

  const availableAssignableRoles = useMemo<AssignableRole[]>(() => {
    if (currentUserRole === 'SUPER_ADMIN') {
      return selectedCollegeId ? ['FLEET_MANAGER', 'STUDENT'] : []
    }

    if (currentUserRole === 'COLLEGE_ADMIN') {
      return ['FLEET_MANAGER', 'STUDENT']
    }

    if (currentUserRole === 'FLEET_MANAGER') {
      return ['STUDENT']
    }

    return []
  }, [currentUserRole, selectedCollegeId])

  const canCreateUsers = availableAssignableRoles.length > 0

  const scopedCollegeName = useMemo(() => {
    if (isSuperAdmin) {
      return colleges.find((college) => college.id === selectedCollegeId)?.name ?? null
    }

    return colleges[0]?.name ?? null
  }, [colleges, isSuperAdmin, selectedCollegeId])

  const addUserHelperText = useMemo(() => {
    if (isSuperAdmin && !selectedCollegeId) {
      return 'Select a college to add users.'
    }

    if (currentUserRole === 'FLEET_MANAGER') {
      return 'Fleet managers can create student accounts only.'
    }

    return scopedCollegeName
      ? `New users will be added to ${scopedCollegeName}.`
      : 'Users are created inside the active college scope.'
  }, [currentUserRole, isSuperAdmin, scopedCollegeName, selectedCollegeId])

  const filteredUsers = useMemo(() => {
    const visibleUsers = users.filter((user) => {
      if (user.role === 'SUPER_ADMIN' || user.role === 'COLLEGE_ADMIN') {
        return false
      }

      if (roleLevel[user.role] >= roleLevel[currentUserRole]) {
        return false
      }

      if (currentUser?.id) {
        return user.id !== currentUser.id
      }

      if (currentUser?.email) {
        return user.email !== currentUser.email
      }

      return true
    })

    const query = search.trim().toLowerCase()
    if (!query) {
      return visibleUsers
    }

    return visibleUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    )
  }, [currentUser?.email, currentUser?.id, currentUserRole, search, users])

  const handleCreate = async (payload: CreateUserPayload) => {
    if (isSuperAdmin) {
      if (!selectedCollegeId) {
        throw new Error('Select a college to add users.')
      }

      await userService.createUser({
        ...payload,
        collegeId: selectedCollegeId,
      })
      await loadUsers()
      return
    }

    await userService.createUser(payload)
    await loadUsers()
  }

  const handleToggleStatus = async (user: UserRecord) => {
    await userService.updateUserStatus(user.id, user.status === 'active' ? 'disabled' : 'active')
    await loadUsers()
  }

  const handleDelete = async (userId: string) => {
    await userService.deleteUser(userId)
    await loadUsers()
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Users</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>
              {scopedCollegeName ? `Users for selected college: ${scopedCollegeName}` : 'Manage college-scoped users and roles'}
            </p>
          </div>

          {canCreateUsers ? (
            <button
              type='button'
              onClick={() => setIsAddOpen(true)}
              className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              <FiPlus size={16} />
              Add User
            </button>
          ) : null}
        </div>

        <div className='mt-4'>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search by name, email, or role...'
            className='w-full max-w-md rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading users...
        </div>
      ) : (
        <UsersTable
          users={filteredUsers}
          currentUser={{
            id: currentUser?.id ?? users.find((user) => user.email === currentUser?.email)?.id ?? null,
            role: currentUserRole,
            email: currentUser?.email ?? null,
          }}
          onEdit={(user) =>
            setEditingUser({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              collegeId: user.collegeId,
              collegeName: user.collegeName,
              status: user.status,
            })
          }
          onDelete={(user) => setDeletingUser(user)}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {canCreateUsers ? (
        <AddUserModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onCreate={handleCreate}
          currentUserRole={currentUserRole}
          availableRoles={availableAssignableRoles}
          scopedCollegeName={scopedCollegeName}
          helperText={addUserHelperText}
        />
      ) : null}

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={async (payload) => {
          await userService.updateUser(payload.id, {
            name: payload.name,
            role: toAssignableRole(payload.role),
            collegeId: isSuperAdmin && selectedCollegeId ? selectedCollegeId : payload.collegeId ?? undefined,
            status: payload.status,
          })
          await loadUsers()
        }}
        availableRoles={availableAssignableRoles}
        scopedCollegeName={scopedCollegeName}
      />

      <DeleteUserDialog
        isOpen={Boolean(deletingUser)}
        userId={deletingUser?.id ?? null}
        onClose={() => setDeletingUser(null)}
        onDelete={handleDelete}
      />
    </div>
  )
}
