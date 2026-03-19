import type { NotificationPreferences } from '../types/profile'
import type { UserProfile } from '../types/profile'
import { apiClient } from '../api/apiClient'

export type UpdatePreferencesPayload = {
  timezone: string
  preferences: NotificationPreferences
}

type UpdatePreferencesResponse = {
  success: true
  message: string
}

export type UpdateProfilePayload = {
  name?: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

class ProfileService {
  async getProfile(): Promise<Omit<UserProfile, 'timezone'>> {
    return apiClient.get<Omit<UserProfile, 'timezone'>>('/profile')
  }

  async updatePreferences(payload: UpdatePreferencesPayload): Promise<UpdatePreferencesResponse> {
    return apiClient.patch<UpdatePreferencesResponse>('/profile/preferences', payload)
  }

  async getPreferences(): Promise<UpdatePreferencesPayload> {
    return apiClient.get<UpdatePreferencesPayload>('/profile/preferences')
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<{ success: true }> {
    return apiClient.patch<{ success: true }>('/profile', payload)
  }

  async changePassword(payload: ChangePasswordPayload): Promise<{ success: true }> {
    return apiClient.post<{ success: true }>('/profile/change-password', payload)
  }
}

export const profileService = new ProfileService()
