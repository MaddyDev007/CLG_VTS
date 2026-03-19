import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FiX } from 'react-icons/fi'
import { routeService } from '@services/routeService'
import { fetchStops, type Stop } from '@services/geofenceService'
import type { Route } from '../../types/route'

type EditRouteModalProps = {
  route: Route | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

export function EditRouteModal({ route, isOpen, onClose, onSuccess }: EditRouteModalProps) {
  const [routeName, setRouteName] = useState('')
  const [startStopId, setStartStopId] = useState('')
  const [endStopId, setEndStopId] = useState('')
  const [intermediateStopIds, setIntermediateStopIds] = useState<string[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [isLoadingStops, setIsLoadingStops] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!route || !isOpen) {
      return
    }

    const currentRoute = route
    let mounted = true

    setIsLoadingStops(true)
    setRouteName(currentRoute.name)
    setStartStopId(currentRoute.startStop.id)
    setEndStopId(currentRoute.endStop.id)
    const nextIntermediate = currentRoute.intermediateStops.map((stop) => stop.id)
    setIntermediateStopIds(nextIntermediate.length > 0 ? nextIntermediate : [''])
    setError('')

    async function loadStops() {
      try {
        const stopLocations = await fetchStops()
        const mergedStops = [
          ...stopLocations,
          currentRoute.startStop,
          currentRoute.endStop,
          ...currentRoute.intermediateStops,
        ].reduce<Stop[]>((acc, stop) => {
          if (acc.some((item) => item.id === stop.id)) {
            return acc
          }
          acc.push({
            id: stop.id,
            name: stop.name,
            lat: stop.lat,
            lon: stop.lon,
          })
          return acc
        }, [])

        if (!mounted) {
          return
        }

        setStops(mergedStops)
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
  }, [isOpen, route])

  const stopMap = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops])
  const selectedStartStop = startStopId ? stopMap.get(startStopId) ?? null : null
  const selectedEndStop = endStopId ? stopMap.get(endStopId) ?? null : null
  const hasSameEndpoints = Boolean(selectedStartStop && selectedEndStop && selectedStartStop.id === selectedEndStop.id)
  const intermediateStops = useMemo(
    () =>
      intermediateStopIds
        .map((stopId) => stopMap.get(stopId))
        .filter((stop): stop is Stop => Boolean(stop))
        .map((stop) => ({
          id: stop.id,
          name: stop.name,
          lat: stop.lat,
          lon: stop.lon,
        })),
    [intermediateStopIds, stopMap],
  )
  const isValid = Boolean(routeName.trim() && selectedStartStop && selectedEndStop && !hasSameEndpoints)

  if (!isOpen || !route) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!routeName.trim()) {
      setError('Route name is required')
      return
    }

    if (!selectedStartStop || !selectedEndStop) {
      setError('Start stop and end stop are required')
      return
    }

    if (selectedStartStop.id === selectedEndStop.id) {
      setError('Start and end stops cannot be the same')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await routeService.updateRoute(route.id, {
        name: routeName.trim(),
        startStop: {
          id: selectedStartStop.id,
          name: selectedStartStop.name,
          lat: selectedStartStop.lat,
          lon: selectedStartStop.lon,
        },
        endStop: {
          id: selectedEndStop.id,
          name: selectedEndStop.name,
          lat: selectedEndStop.lat,
          lon: selectedEndStop.lon,
        },
        intermediateStops,
      })
      await onSuccess()
      onClose()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update route')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4'>
      <div className='w-full max-w-lg max-h-[550px] overflow-y-auto rounded-2xl border border-white/30 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#1e293b]'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Edit Route</h3>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            aria-label='Close edit route modal'
          >
            <FiX size={16} />
          </button>
        </div>

        {isLoadingStops ? (
          <p className='text-sm text-slate-600 dark:text-slate-300'>Loading route options...</p>
        ) : (
          <form className='space-y-3' onSubmit={handleSubmit}>
          <div>
            <label className='mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200'>Route Name</label>
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
            />
          </div>

          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <label className='space-y-1'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Start Stop</span>
              <select
                disabled={stops.length === 0}
                value={startStopId}
                onChange={(event) => {
                  const nextStart = event.target.value
                  setStartStopId(nextStart)
                  setIntermediateStopIds((prev) => prev.filter((stopId) => stopId !== nextStart))
                }}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
              >
                <option value=''>Select start stop</option>
                {stops.length === 0 ? <option value='' disabled>No stops available</option> : null}
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </label>

            <label className='space-y-1'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>End Stop</span>
              <select
                disabled={stops.length === 0}
                value={endStopId}
                onChange={(event) => {
                  const nextEnd = event.target.value
                  setEndStopId(nextEnd)
                  setIntermediateStopIds((prev) => prev.filter((stopId) => stopId !== nextEnd))
                }}
                className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
              >
                <option value=''>Select end stop</option>
                {stops.length === 0 ? <option value='' disabled>No stops available</option> : null}
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>Intermediate Stops</span>
              <button
                type='button'
                onClick={() => setIntermediateStopIds((prev) => [...prev, ''])}
                className='inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
              >
                Add Stop
              </button>
            </div>
            {intermediateStopIds.length === 0 ? (
              <p className='text-xs text-slate-500 dark:text-slate-400'>No intermediate stops selected.</p>
            ) : null}
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
                    disabled={stops.length === 0}
                    value={stopId}
                    onChange={(event) => {
                      const next = event.target.value
                      setIntermediateStopIds((prev) =>
                        prev.map((value, idx) => (idx === index ? next : value)),
                      )
                    }}
                    className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-[#38bdf8]'
                  >
                    <option value=''>Select stop</option>
                    {availableStops.length === 0 ? <option value='' disabled>No stops available</option> : null}
                    {availableStops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    onClick={() => setIntermediateStopIds((prev) => prev.filter((_, idx) => idx !== index))}
                    className='rounded-lg border border-rose-300 px-2.5 py-2 text-xs font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-600 dark:border-rose-500/60 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:text-rose-200'
                  >
                    Remove
                  </button>
                </div>
              )
            })}
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Only geofences marked as stop locations appear here.
            </p>
          </div>

          {!isLoadingStops && stops.length === 0 ? (
            <p className='text-sm text-slate-500 dark:text-slate-400'>No stops available.</p>
          ) : null}
          {error ? <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p> : null}

          <div className='flex justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSaving || !isValid}
              className='rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
