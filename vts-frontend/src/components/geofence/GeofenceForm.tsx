import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { searchLocation } from '@services/locationSearchService'
import { RadiusSlider } from './RadiusSlider'
import { GeofenceMap } from '../map/GeofenceMap'
import type { GeofenceSearchResult } from '../../types/geofence'

export type GeofenceFormValues = {
  name: string
  address: string
  lat: number
  lon: number
  radius: number
  isStop: boolean
}

type GeofenceFormProps = {
  defaultCenter?: [number, number]
  initialValues?: Partial<GeofenceFormValues>
  onSave: (values: GeofenceFormValues) => Promise<void> | void
  onCancel?: () => void
  saveLabel?: string
}

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]

export function GeofenceForm({
  defaultCenter = DEFAULT_CENTER,
  initialValues,
  onSave,
  onCancel,
  saveLabel = 'Save Geofence',
}: GeofenceFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeofenceSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(initialValues?.address ?? '')
  const [geofenceName, setGeofenceName] = useState(initialValues?.name ?? '')
  const [lat, setLat] = useState(initialValues?.lat ?? defaultCenter[0])
  const [lon, setLon] = useState(initialValues?.lon ?? defaultCenter[1])
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialValues?.lat ?? defaultCenter[0],
    initialValues?.lon ?? defaultCenter[1],
  ])
  const [radius, setRadius] = useState(initialValues?.radius ?? 300)
  const [isStop, setIsStop] = useState(initialValues?.isStop ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const nextLat = initialValues?.lat ?? defaultCenter[0]
    const nextLon = initialValues?.lon ?? defaultCenter[1]

    setSelectedAddress(initialValues?.address ?? '')
    setGeofenceName(initialValues?.name ?? '')
    setLat(nextLat)
    setLon(nextLon)
    setMapCenter([nextLat, nextLon])
    setRadius(initialValues?.radius ?? 300)
    setIsStop(initialValues?.isStop ?? true)
    setSearchQuery('')
    setSearchResults([])
    setError('')
  }, [defaultCenter, initialValues])

  const formattedCoordinates = useMemo(
    () => ({
      lat: lat.toFixed(6),
      lon: lon.toFixed(6),
    }),
    [lat, lon],
  )

  const handleSearch = async () => {
    const query = searchQuery.trim()
    setError('')

    if (!query) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchLocation(query)
      setSearchResults(results)
      if (results.length === 0) {
        setError('No locations found. Try a more specific search.')
      }
    } catch {
      setError('Unable to search locations right now.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    searchLocation(query)
      .then((results) => {
        setSearchResults(results)
        if (results.length === 0) {
          setError('No locations found. Try a more specific search.')
        } else {
          setError('')
        }
      })
      .catch(() => {
        setError('Unable to search locations right now.')
        setSearchResults([])
      })
      .finally(() => {
        setIsSearching(false)
      })
  }, [searchQuery])

  const handleSelectLocation = (location: GeofenceSearchResult) => {
    setSelectedAddress(location.displayName)
    setLat(location.lat)
    setLon(location.lon)
    setMapCenter([location.lat, location.lon])
    setSearchResults([])
    setError('')
  }

  const handleShowCoordinates = () => {
    setMapCenter([lat, lon])
  }

  const handleMapLocationSelect = (nextLat: number, nextLon: number) => {
    setLat(nextLat)
    setLon(nextLon)
    setMapCenter([nextLat, nextLon])

    if (!selectedAddress.trim()) {
      setSelectedAddress(`Lat ${nextLat.toFixed(5)}, Lon ${nextLon.toFixed(5)}`)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!geofenceName.trim()) {
      setError('Geofence name is required.')
      return
    }

    const normalizedAddress =
      selectedAddress.trim() || `Lat ${lat.toFixed(5)}, Lon ${lon.toFixed(5)}`

    setIsSubmitting(true)

    try {
      await onSave({
        name: geofenceName.trim(),
        address: normalizedAddress,
        lat,
        lon,
        radius,
        isStop,
      })
    } catch {
      setError('Failed to save geofence.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-700 dark:bg-[#1e293b]/90'
    >
      <div className='relative'>
        <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Search Place</label>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder='Search location...'
            className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          />
          <button
            type='button'
            onClick={handleSearch}
            disabled={isSearching}
            className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 ? (
          <div className='absolute left-0 right-0 top-full z-20 mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#0f172a]'>
            {searchResults.map((result) => (
              <button
                key={`${result.displayName}-${result.lat}-${result.lon}`}
                type='button'
                onClick={() => handleSelectLocation(result)}
                className='block w-full border-b border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 last:border-b-0'
              >
                {result.displayName}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Geofence Name</label>
        <input
          value={geofenceName}
          onChange={(event) => setGeofenceName(event.target.value)}
          placeholder='e.g. Main Campus Boundary'
          className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
        />
      </div>

      <label className='flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200'>
        <input
          type='checkbox'
          checked={isStop}
          onChange={(event) => setIsStop(event.target.checked)}
          className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-[#38bdf8]'
        />
        Mark as stop location (route stop)
      </label>

      <div>
        <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Selected Address</label>
        <input
          value={selectedAddress}
          readOnly
          className='w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
          placeholder='Select a search result'
        />
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Latitude</label>
          <input
            value={formattedCoordinates.lat}
            readOnly
            className='w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Longitude</label>
          <input
            value={formattedCoordinates.lon}
            readOnly
            className='w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
          />
        </div>
      </div>

      <RadiusSlider value={radius} onChange={setRadius} />

      {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={handleShowCoordinates}
          className='rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Show Coordinates On Map
        </button>
        {onCancel ? (
          <button
            type='button'
            onClick={onCancel}
            className='rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Cancel
          </button>
        ) : null}
        <button
          type='submit'
          disabled={isSubmitting}
          className='rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
        >
          {isSubmitting ? 'Saving...' : saveLabel}
        </button>
      </div>

      <div className='h-[320px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700'>
        <GeofenceMap
          center={mapCenter}
          radius={radius}
          lat={lat}
          lon={lon}
          onLocationSelect={handleMapLocationSelect}
        />
      </div>
      <p className='text-xs text-slate-500 dark:text-slate-400'>
        Tip: Click on the map or drag the marker to set geofence center.
      </p>
    </form>
  )
}
