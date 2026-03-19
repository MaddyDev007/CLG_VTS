import { apiClient } from '../api/apiClient'

export type CollegeOption = {
  id: string
  name: string
}

class CollegeService {
  async getColleges(): Promise<CollegeOption[]> {
    return apiClient.get<CollegeOption[]>('/colleges')
  }
}

export const collegeService = new CollegeService()
