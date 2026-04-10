import type { UserRole } from './authService'
import { apiClient } from '../api/apiClient'
import { buildCollegeScopedPath, isSuperAdminCollegeScopeRequired } from '@utils/collegeScope'

export type UserStatus = 'active' | 'disabled'
export type ManageableUserRole = 'FLEET_MANAGER' | 'STUDENT'

export type UserRecord = {
  id: string
  name: string
  email: string
  role: UserRole
  collegeId?: string | null
  collegeName?: string | null
  status: UserStatus
  createdAt: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  role: ManageableUserRole
  collegeId?: string
}

export type UpdateUserInput = Partial<Omit<UserRecord, 'id' | 'email' | 'createdAt'>> & {
  role?: ManageableUserRole
}

export type UserListParams = {
  collegeId?: string
  role?: UserRole
  ignoreActiveCollegeScope?: boolean
}

class UserService {
  async getUsers(params?: UserListParams): Promise<UserRecord[]> {
    if (!params?.ignoreActiveCollegeScope && isSuperAdminCollegeScopeRequired()) {
      return []
    }

    const searchParams = new URLSearchParams()
    if (params?.collegeId) searchParams.set('collegeId', params.collegeId)
    if (params?.role) searchParams.set('role', params.role)

    const basePath = searchParams.toString() ? `/users?${searchParams.toString()}` : '/users'
    return apiClient.get<UserRecord[]>(
      buildCollegeScopedPath(basePath, {
        ignoreActiveCollegeScope: params?.ignoreActiveCollegeScope,
      }),
    )
  }

  async createUser(input: CreateUserInput): Promise<{ success: true; user: UserRecord }> {
    return apiClient.post<{ success: true; user: UserRecord }>('/users', input)
  }

  async updateUser(userId: string, updates: UpdateUserInput): Promise<{ success: true; user: UserRecord }> {
    return apiClient.patch<{ success: true; user: UserRecord }>(`/users/${userId}`, updates)
  }

  async deleteUser(userId: string): Promise<{ success: true }> {
    return apiClient.delete<{ success: true }>(`/users/${userId}`)
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<{ success: true; user: UserRecord }> {
    return apiClient.patch<{ success: true; user: UserRecord }>(`/users/${userId}/status`, { status })
  }
}

export const userService = new UserService()
