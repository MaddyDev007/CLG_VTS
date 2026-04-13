import { useEffect, useMemo, useState } from 'react'
import { fetchStops, type Stop } from '@services/geofenceService'
import { routeService } from '@services/routeService'
import { RoutePreviewMap } from '@components/routes/RoutePreviewMap'
import { useScopedDataSyncVersion } from '@store/dataSyncStore'
import { generateRoutePolyline } from '@utils/routePolyline'
import { getActiveCollegeFilterId } from '@utils/collegeScope'
import type { RouteStop } from '../../types/route'

type RouteFormProps = {
  collegeId?: string
  isOpen?: boolean
  onCancel?: () => void
  onSuccess?: () => Promise<void> | void
}

const DEFAULT_COLLEGE_ID = ''

function toRouteStop(stop: Stop): RouteStop {
  return {
    id: stop.id,
    name: stop.name,
    lat: stop.lat,
    lon: stop.lon,
  }
}

export function RouteForm({
  collegeId = DEFAULT_COLLEGE_ID,
  isOpen,
  onCancel,
  onSuccess,
}: RouteFormProps) {
  const resolvedCollegeId = collegeId || getActiveCollegeFilterId() || DEFAULT_COLLEGE_ID
  const [routeName, setRouteName] = useState('')
  const [startStopId, setStartStopId] = useState('')
  const [endStopId, setEndStopId] = useState('')
  const [intermediateStopIds, setIntermediateStopIds] = useState<string[]>([''])
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoadingStops, setIsLoadingStops] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedRouteObject, setGeneratedRouteObject] = useState<{ name: string; stops: RouteStop[] } | null>(null)
  const [routePolyline, setRoutePolyline] = useState('')
  const [validationError, setValidationError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [reloadStopsToken, setReloadStopsToken] = useState(0)
  const syncVersion = useScopedDataSyncVersion(['geofences'])

  useEffect(() => {
    if (isOpen === false) {
      return
    }

    let mounted = true

    async function loadStops() {
      setIsLoadingStops(true)

      try {
        const nextStops = await fetchStops()
        if (!mounted) {
          return
        }

        setStops(nextStops)
      } finally {
        if (mounted) {
          setIsLoadingStops(false)
        }
      }
    }

    void loadStops()

    return () => {
      mounted = false
    }
  }, [isOpen, reloadStopsToken, syncVersion])

  const stopMap = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops])

  const selectedStartStop = startStopId ? stopMap.get(startStopId) ?? null : null
  const selectedEndStop = endStopId ? stopMap.get(endStopId) ?? null : null
  const hasSameEndpoints = Boolean(selectedStartStop && selectedEndStop && selectedStartStop.id === selectedEndStop.id)
  const selectedIntermediateStops = useMemo(
    () =>
      intermediateStopIds
        .map((stopId) => stopMap.get(stopId))
        .filter((stop): stop is Stop => Boolean(stop))
        .map(toRouteStop),
    [intermediateStopIds, stopMap],
  )
  const isValid = Boolean(routeName.trim() && selectedStartStop && selectedEndStop && !hasSameEndpoints)

  useEffect(() => {
    if (isValid) {
      setValidationError('')
      return
    }

    const messages: string[] = []
    if (!routeName.trim()) {
      messages.push('Route name is required.')
    }
    if (!selectedStartStop) {
      messages.push('Start stop must be selected.')
    }
    if (!selectedEndStop) {
      messages.push('End stop must be selected.')
    }
    if (hasSameEndpoints) {
      messages.push('Start and end stops cannot be the same.')
    }
    if (!isLoadingStops && stops.length === 0) {
      messages.push('No stops available. Add geofences marked as stops to continue.')
    }

    setValidationError(messages.join(' '))
  }, [hasSameEndpoints, isLoadingStops, isValid, routeName, selectedEndStop, selectedStartStop, stops.length])

  useEffect(() => {
    if (!selectedStartStop || !selectedEndStop) {
      setGeneratedRouteObject(null)
      setRoutePolyline('')
      return
    }

    const orderedStops: RouteStop[] = [
      toRouteStop(selectedStartStop),
      ...selectedIntermediateStops,
      toRouteStop(selectedEndStop),
    ]

    const routeObject = {
      name: routeName.trim(),
      stops: orderedStops,
    }

    setGeneratedRouteObject(routeObject)
    setRoutePolyline(generateRoutePolyline(orderedStops))
  }, [routeName, selectedEndStop, selectedIntermediateStops, selectedStartStop])

  const handleCreateRoute = async () => {
    if (!selectedStartStop || !selectedEndStop) {
      setSaveError('Start and end stops are required.')
      return
    }

    if (selectedStartStop.id === selectedEndStop.id) {
      setSaveError('Start and end stops cannot be the same.')
      return
    }

    if (!isValid) {
      setSaveError('Please complete the required route details before saving.')
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      await routeService.createRoute({
        collegeId: resolvedCollegeId || undefined,
        name: routeName.trim(),
        startStop: toRouteStop(selectedStartStop),
        endStop: toRouteStop(selectedEndStop),
        intermediateStops: selectedIntermediateStops,
      })

      await onSuccess?.()
      setRouteName('')
      setStartStopId('')
      setEndStopId('')
      setIntermediateStopIds([''])
      setSaveError('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to create route.')
    } finally {
      setIsSaving(false)
    }
  }

  const stopSelectDisabled = isLoadingStops || stops.length === 0

  const renderStopOptions = (placeholder: string) => (
    <>
      <option value=''>{placeholder}</option>
      {isLoadingStops ? <option value='' disabled>Loading stops...</option> : null}
      {!isLoadingStops && stops.length === 0 ? <option value='' disabled>No stops available</option> : null}
      {!isLoadingStops
        ? stops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.name}
            </option>
          ))
        : null}
    </>
  )

  return (
    <section className='rounded-2xl bg-white/55 p-5  backdrop-blur-xl  dark:bg-[#1e293b]/70'>
      <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Route Form</h2>

      <div className='mt-4 grid grid-cols-1 gap-6 lg:grid-cols-1'>
        <div className='space-y-3'>
          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Route Name</span>
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              placeholder='Enter route name'
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Start Stop</span>
            <select
              disabled={stopSelectDisabled}
              value={startStopId}
              onChange={(event) => {
                const nextStart = event.target.value
                setStartStopId(nextStart)
                setIntermediateStopIds((prev) => prev.filter((stopId) => stopId !== nextStart))
              }}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              {renderStopOptions('Select start stop')}
            </select>
          </label>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>End Stop</span>
            <select
              disabled={stopSelectDisabled}
              value={endStopId}
              onChange={(event) => {
                const nextEnd = event.target.value
                setEndStopId(nextEnd)
                setIntermediateStopIds((prev) => prev.filter((stopId) => stopId !== nextEnd))
              }}
              className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            >
              {renderStopOptions('Select end stop')}
            </select>
          </label>
        </div>

        <div className='space-y-3'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>
                Intermediate Stops
              </span>
              <button
                type='button'
                onClick={() => setIntermediateStopIds((prev) => [...prev, ''])}
                disabled={stopSelectDisabled}
                className='inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
              >
                Add Stop
              </button>
            </div>
            {intermediateStopIds.map((stopId, index) => {
              const takenIds = new Set(
                intermediateStopIds.filter((_, i) => i !== index).filter((id) => id),
              )
              const availableStops = stops.filter(
                (stop) =>
                  stop.id !== startStopId &&
                  stop.id !== endStopId &&
                  (!takenIds.has(stop.id) || stop.id === stopId),
              )

              return (
                <div key={`intermediate-${index}`} className='flex items-center gap-2'>
                  <select
                    disabled={stopSelectDisabled}
                    value={stopId}
                    onChange={(event) => {
                      const next = event.target.value
                      setIntermediateStopIds((prev) =>
                        prev.map((value, idx) => (idx === index ? next : value)),
                      )
                    }}
                    className='w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  >
                    <option value=''>Select stop</option>
                    {isLoadingStops ? <option value='' disabled>Loading stops...</option> : null}
                    {!isLoadingStops && availableStops.length === 0 ? (
                      <option value='' disabled>No stops available</option>
                    ) : null}
                    {availableStops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    onClick={() =>
                      setIntermediateStopIds((prev) => prev.filter((_, idx) => idx !== index))
                    }
                    className='rounded-lg border border-rose-300 px-2.5 py-2 text-xs font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-600 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200'
                  >
                    Remove
                  </button>
                </div>
              )
            })}
            <button
              type='button'
              onClick={() => setReloadStopsToken((value) => value + 1)}
              disabled={isLoadingStops}
              className='mt-1 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            >
              {isLoadingStops ? 'Loading stops...' : 'Reload Stops'}
            </button>
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Only geofences marked as stop locations appear here.
            </p>
          </div>

          <label className='space-y-1'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>College ID</span>
            <input
              value={resolvedCollegeId}
              readOnly
              className='w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
            />
          </label>
        </div>
      </div>

      {validationError ? (
        <p className='mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'>
          {validationError}
        </p>
      ) : null}
      {saveError ? (
        <p className='mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'>
          {saveError}
        </p>
      ) : null}

      <div className='mt-4 flex flex-wrap justify-end gap-2'>
        {onCancel ? (
          <button
            type='button'
            onClick={onCancel}
            className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Cancel
          </button>
        ) : null}
        <button
          type='button'
          onClick={handleCreateRoute}
          disabled={!isValid || isSaving}
          className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
        >
          {isSaving ? 'Saving...' : 'Create Route'}
        </button>
      </div>

      <div className='mt-5 space-y-3'>
        <div className='rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40'>
          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400'>
            Route Preview Map
          </p>
          <div className='mt-2 h-[320px] overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
            <RoutePreviewMap
              startStop={selectedStartStop}
              endStop={selectedEndStop}
              intermediateStops={selectedIntermediateStops}
              heightClassName='h-[320px]'
            />
          </div>
        </div>

        <div className='rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40'>
          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400'>
            Generated Route Object JSON Preview
          </p>
          <pre className='mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-cyan-100'>
            {generatedRouteObject ? JSON.stringify(generatedRouteObject, null, 2) : 'No route generated yet'}
          </pre>
        </div>

        <div className='rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40'>
          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400'>
            Route Polyline String
          </p>
          <p className='mt-1 break-all text-sm text-slate-700 dark:text-slate-200'>
            {routePolyline || 'Select route stops to generate polyline'}
          </p>
        </div>
      </div>
    </section>
  )
}
