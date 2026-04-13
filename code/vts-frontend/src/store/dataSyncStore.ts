import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { useCollegeFilterStore } from './collegeFilterStore'

export type DataSyncTopic =
  | 'vehicles'
  | 'devices'
  | 'routes'
  | 'geofences'
  | 'trips'
  | 'telemetry'
  | 'notifications'
  | 'users'
  | 'colleges'
  | 'profile'
  | 'history'
  | 'events'

export const GLOBAL_SCOPE_KEY = '__global__'
export const TENANT_SCOPE_KEY = '__tenant__'
export const SUPER_ADMIN_UNSCOPED_SCOPE_KEY = '__super_admin_unscoped__'

type DataSyncStore = {
  versions: Record<string, number>
  invalidate: (topics: DataSyncTopic[], scopeKey: string) => void
  reset: () => void
}

function buildVersionKey(scopeKey: string, topic: DataSyncTopic) {
  return `${scopeKey}:${topic}`
}

export function resolveActiveDataScopeKey(): string {
  const role = useAuthStore.getState().role
  if (role === 'SUPER_ADMIN') {
    return useCollegeFilterStore.getState().selectedCollegeId ?? SUPER_ADMIN_UNSCOPED_SCOPE_KEY
  }

  return TENANT_SCOPE_KEY
}

export const useDataSyncStore = create<DataSyncStore>()((set) => ({
  versions: {},
  invalidate: (topics, scopeKey) => {
    set((state) => {
      const nextVersions = { ...state.versions }

      topics.forEach((topic) => {
        const key = buildVersionKey(scopeKey, topic)
        nextVersions[key] = (nextVersions[key] ?? 0) + 1
      })

      return { versions: nextVersions }
    })
  },
  reset: () => set({ versions: {} }),
}))

export function invalidateDataSync(
  topics: DataSyncTopic | DataSyncTopic[],
  options?: { scopeKey?: string | null },
) {
  const nextTopics = Array.isArray(topics) ? topics : [topics]
  const scopeKey = options?.scopeKey ?? resolveActiveDataScopeKey()
  useDataSyncStore.getState().invalidate(nextTopics, scopeKey)
}

export function useScopedDataSyncVersion(
  topics: DataSyncTopic[],
  options?: { scopeKey?: string },
): string {
  const role = useAuthStore((state) => state.role)
  const selectedCollegeId = useCollegeFilterStore((state) => state.selectedCollegeId)

  const scopeKey =
    options?.scopeKey ??
    (role === 'SUPER_ADMIN' ? selectedCollegeId ?? SUPER_ADMIN_UNSCOPED_SCOPE_KEY : TENANT_SCOPE_KEY)

  return useDataSyncStore((state) =>
    topics.map((topic) => state.versions[buildVersionKey(scopeKey, topic)] ?? 0).join(':'),
  )
}
