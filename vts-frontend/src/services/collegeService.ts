import { apiClient } from '../api/apiClient'

export type CollegeAdminSummary = {
  id: string
  name: string
  email: string
  status: 'active' | 'disabled'
}

export type CollegeSummary = {
  id: string
  name: string
  status: 'active' | 'inactive'
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
    return apiClient.post<CollegeMutationResponse>('/colleges', payload)
  }

  async updateCollege(collegeId: string, payload: UpdateCollegeInput): Promise<CollegeMutationResponse> {
    return apiClient.patch<CollegeMutationResponse>(`/colleges/${collegeId}`, payload)
  }
}

export const collegeService = new CollegeService()
