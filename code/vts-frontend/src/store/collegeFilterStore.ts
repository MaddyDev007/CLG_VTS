import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CollegeFilterState = {
  selectedCollegeId: string | null
}

type CollegeFilterActions = {
  setSelectedCollegeId: (collegeId: string | null) => void
  clearSelectedCollegeId: () => void
}

type CollegeFilterStore = CollegeFilterState & CollegeFilterActions

export const useCollegeFilterStore = create<CollegeFilterStore>()(
  persist(
    (set) => ({
      selectedCollegeId: null,
      setSelectedCollegeId: (collegeId) => set({ selectedCollegeId: collegeId }),
      clearSelectedCollegeId: () => set({ selectedCollegeId: null }),
    }),
    {
      name: 'vts-super-admin-college-filter',
      partialize: (state) => ({
        selectedCollegeId: state.selectedCollegeId,
      }),
    },
  ),
)
