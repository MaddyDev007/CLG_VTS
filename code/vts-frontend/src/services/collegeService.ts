import { apiClient } from '../api/apiClient'
import { GLOBAL_SCOPE_KEY, invalidateDataSync } from '@store/dataSyncStore'

export type CollegeAdminSummary = {
  id: string
  name: string
  email: string
  status: 'active' | 'disabled'
}

export type CollegeStatus = 'active' | 'inactive' | 'delete_pending'

export type CollegeSummary = {
  id: string
  name: string
  status: CollegeStatus
  createdAt: string
  admin: CollegeAdminSummary | null
}

export type CollegeDetails = CollegeSummary

export type CollegeOption = {
  id: string
  name: string
}

export type UpdateCollegeInput = {
  name?: string
  status?: 'active' | 'inactive'
  adminName?: string
  adminEmail?: string
}

export type CreateCollegeInput = {
  name: string
  status?: 'active' | 'inactive'
  adminName: string
  adminEmail: string
}

export type CollegeMutationResponse = {
  success: true
  college: CollegeDetails
  adminTemporaryPassword?: string
}

export type CollegeStatusMutationResponse = {
  success: true
  college: CollegeDetails
}

class CollegeService {
  async getColleges(options?: { includeAll?: boolean }): Promise<CollegeSummary[]> {
    const path = options?.includeAll ? '/colleges?includeAll=true' : '/colleges'
    return apiClient.get<CollegeSummary[]>(path)
  }

  async getCollegeOptions(): Promise<CollegeOption[]> {
    const colleges = await this.getColleges()
    return colleges.map((college) => ({
      id: college.id,
      name: college.name,
    }))
  }

  async getCollegeById(collegeId: string): Promise<CollegeDetails> {
    return apiClient.get<CollegeDetails>(`/colleges/${collegeId}`)
  }

  async createCollege(payload: CreateCollegeInput): Promise<CollegeMutationResponse> {
    const response = await apiClient.post<CollegeMutationResponse>('/colleges', payload)
    invalidateDataSync(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })
    return response
  }

  async updateCollege(collegeId: string, payload: UpdateCollegeInput): Promise<CollegeMutationResponse> {
    const response = await apiClient.patch<CollegeMutationResponse>(`/colleges/${collegeId}`, payload)
    invalidateDataSync(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })
    return response
  }

  async requestDeleteCollege(collegeId: string): Promise<CollegeStatusMutationResponse> {
    const response = await apiClient.patch<CollegeStatusMutationResponse>(`/colleges/${collegeId}/request-delete`)
    invalidateDataSync(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })
    return response
  }

  async cancelDeleteCollege(collegeId: string): Promise<CollegeStatusMutationResponse> {
    const response = await apiClient.patch<CollegeStatusMutationResponse>(`/colleges/${collegeId}/cancel-delete`)
    invalidateDataSync(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })
    return response
  }

  async deleteCollege(collegeId: string): Promise<{ success: true }> {
    const response = await apiClient.delete<{ success: true }>(`/colleges/${collegeId}`)
    invalidateDataSync(['colleges'], { scopeKey: GLOBAL_SCOPE_KEY })
    return response
  }
}

export const collegeService = new CollegeService()
