import type { GeofenceSearchResult } from '../types/geofence'

const DEBOUNCE_MS = 350
const MAX_RESULTS = 6

let debounceTimer: number | undefined
let pendingResolve: ((results: GeofenceSearchResult[]) => void) | null = null

function normalizeQuery(query: string): string {
  return query.trim()
}

export function searchLocation(query: string): Promise<GeofenceSearchResult[]> {
  const normalizedQuery = normalizeQuery(query)

  if (!normalizedQuery) {
    return Promise.resolve([])
  }

  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
  }

  if (pendingResolve) {
    pendingResolve([])
    pendingResolve = null
  }

  return new Promise<GeofenceSearchResult[]>((resolve, reject) => {
    pendingResolve = resolve

    debounceTimer = window.setTimeout(async () => {
      pendingResolve = null
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('q', normalizedQuery)
        url.searchParams.set('format', 'json')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('limit', String(MAX_RESULTS))

        const response = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          resolve([])
          return
        }

        const data = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>
        const results = data
          .map((item) => ({
            displayName: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
          }))
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon))

        resolve(results)
      } catch (error) {
        reject(error)
      }
    }, DEBOUNCE_MS)
  })
}
