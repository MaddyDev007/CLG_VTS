import type { UserRole } from './authService'
import { apiClient } from '../api/apiClient'

export type UserStatus = 'active' | 'disabled'

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
  role: UserRole
  collegeId?: string
  collegeName?: string
}

export type UpdateUserInput = Partial<Omit<UserRecord, 'id' | 'email' | 'createdAt'>> & {
  collegeName?: string
}

class UserService {
  async getUsers(): Promise<UserRecord[]> {
    return apiClient.get<UserRecord[]>('/users')
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
