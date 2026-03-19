import { useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { AddUserModal, type CreateUserPayload } from '@components/users/AddUserModal'
import { EditUserModal, type EditableUser } from '@components/users/EditUserModal'
import { DeleteUserDialog } from '@components/users/DeleteUserDialog'
import { UsersTable } from '@components/users/UsersTable'
import { userService, type UserRecord } from '@services/userService'
import { collegeService, type CollegeOption } from '@services/collegeService'
import { useAuthStore } from '@store/authStore'

export function UsersPage() {
  const currentUserRole = useAuthStore((state) => state.role) ?? 'STUDENT'
  const canCreateUsers = currentUserRole !== 'STUDENT'
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)
  const [colleges, setColleges] = useState<CollegeOption[]>([])
  const [isLoadingColleges, setIsLoadingColleges] = useState(true)

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
  }, [])

  useEffect(() => {
    const loadColleges = async () => {
      setIsLoadingColleges(true)
      try {
        const data = await collegeService.getColleges()
        setColleges(data)
      } finally {
        setIsLoadingColleges(false)
      }
    }

    void loadColleges()
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return users
    }
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    )
  }, [search, users])

  const handleCreate = async (payload: CreateUserPayload) => {
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
            <p className='text-sm text-slate-600 dark:text-slate-300'>Manage platform users and roles</p>
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
          colleges={colleges}
          isLoadingColleges={isLoadingColleges}
          currentUserRole={currentUserRole}
        />
      ) : null}

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={async (payload) => {
          await userService.updateUser(payload.id, {
            name: payload.name,
            role: payload.role,
            collegeId: payload.collegeId,
            collegeName: payload.collegeNameInput,
            status: payload.status,
          })
          await loadUsers()
        }}
        colleges={colleges}
        isLoadingColleges={isLoadingColleges}
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
