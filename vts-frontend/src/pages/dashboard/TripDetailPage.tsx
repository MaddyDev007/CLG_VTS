import { useEffect, useMemo, useState } from 'react'
import { FiClock, FiMapPin, FiNavigation, FiTruck } from 'react-icons/fi'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PlaybackControls } from '@components/trips/PlaybackControls'
import { TripPlaybackMap } from '@components/trips/TripPlaybackMap'
import { TripSummaryCard } from '@components/trips/TripSummaryCard'
import { useTripPlayback } from '@hooks/useTripPlayback'
import { tripService } from '@services/tripService'
import { vehicleService } from '@services/vehicleService'
import { formatDistance, formatDurationDetail } from '@utils/tripFormat'
import { durationMsBetween } from '@utils/time'
import type { Trip, TripPlaybackPoint } from '../../types/trip'

type TripState = {
  trip?: Partial<Trip> & {
    id: string
    vehicleId?: string
    startTime: string
    endTime: string
    distance: number
    maxSpeed?: number
  }
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

function deriveDuration(startTime: string, endTime: string): number {
  return durationMsBetween(startTime, endTime)
}

function normalizeTrip(input: TripState['trip']): Trip | null {
  if (!input) {
    return null
  }

  return {
    id: input.id,
    vehicleId: input.vehicleId ?? 'veh-1',
    vehicleName: input.vehicleName ?? `Vehicle ${input.vehicleId ?? ''}`.trim(),
    startLocation:
      input.startLocation && input.startLocation.trim().length > 0
        ? input.startLocation
        : 'Start location unavailable',
    endLocation:
      input.endLocation && input.endLocation.trim().length > 0 ? input.endLocation : 'End location unavailable',
    startTime: input.startTime,
    endTime: input.endTime,
    duration: input.duration ?? deriveDuration(input.startTime, input.endTime),
    distance: input.distance,
  }
}

function generateFallbackPlayback(trip: Trip): TripPlaybackPoint[] {
  const pointCount = randomInt(20, 40)
  const startMs = new Date(trip.startTime).getTime()
  const endMs = new Date(trip.endTime).getTime()
  const totalMs = Math.max(endMs - startMs, pointCount * 60 * 1000)
  const stepMs = Math.max(30 * 1000, Math.floor(totalMs / pointCount))

  const routeSeed = Number(trip.vehicleId.replace('veh-', '')) || 1
  const baseLat = 28.6139 + routeSeed * 0.01
  const baseLon = 77.209 + routeSeed * 0.01
  const deltaLat = randomBetween(0.03, 0.12)
  const deltaLon = randomBetween(0.03, 0.12)

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / Math.max(1, pointCount - 1)
    return {
      timestamp: new Date(startMs + stepMs * index).toISOString(),
      lat: Number((baseLat + deltaLat * progress + randomBetween(-0.002, 0.002)).toFixed(6)),
      lon: Number((baseLon + deltaLon * progress + randomBetween(-0.002, 0.002)).toFixed(6)),
      speed: randomInt(10, 78),
    }
  })
}

export function TripDetailPage() {
  const { tripId = '' } = useParams()
  const location = useLocation()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [playback, setPlayback] = useState<TripPlaybackPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const {
    currentPointIndex,
    isPlaying,
    speed,
    play,
    pause,
    reset,
    setSpeed,
    setCurrentPointIndex,
  } = useTripPlayback(playback)

  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId.trim()) {
        setTrip(null)
        setPlayback([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const stateTrip = (location.state as TripState | null)?.trip
      let tripData = stateTrip ? normalizeTrip(stateTrip) : await tripService.getTripById(tripId)
      let playbackData = await tripService.getTripPlayback(tripId)

      if (!playbackData.length && tripData) {
        playbackData = generateFallbackPlayback(tripData)
      }

      if (tripData && !tripData.vehicleName && tripData.vehicleId) {
        const vehicle = await vehicleService.getVehicleById(tripData.vehicleId)
        tripData = { ...tripData, vehicleName: vehicle?.vehicleName ?? tripData.vehicleName }
      }

      setTrip(tripData)
      setPlayback(playbackData)
      setIsLoading(false)
    }

    void loadTrip()
  }, [location.state, tripId])

  const currentPoint = useMemo(
    () => playback[currentPointIndex] ?? null,
    [currentPointIndex, playback],
  )
  const maxSpeed = useMemo(() => playback.reduce((max, point) => Math.max(max, point.speed), 0), [playback])
  const averageSpeed = useMemo(() => {
    if (!playback.length) {
      return 0
    }

    const total = playback.reduce((sum, point) => sum + point.speed, 0)
    return total / playback.length
  }, [playback])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
        <div className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Trip Detail</h2>
          <Link
            to='/trips'
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Back to Trips
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading trip detail...
        </div>
      ) : trip ? (
        <>
          <section className='overflow-hidden rounded-[28px] border border-white/30 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/80 dark:shadow-black/20'>
            <div className='border-b border-slate-200/70 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-5 py-5 dark:border-slate-700/70 dark:from-slate-900/80 dark:via-[#1e293b]/90 dark:to-sky-950/40'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div className='space-y-3'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-500/30 dark:bg-slate-900/70 dark:text-sky-200'>
                    <FiTruck size={14} />
                    Trip Overview
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Assigned Vehicle</p>
                    <h3 className='mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{trip.vehicleName}</h3>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[30rem]'>
                  <div className='rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/65'>
                    <p className='text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400'>Duration</p>
                    <p className='mt-1 text-base font-semibold text-slate-900 dark:text-slate-100'>{formatDurationDetail(trip.duration)}</p>
                  </div>
                  <div className='rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/65'>
                    <p className='text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400'>Distance</p>
                    <p className='mt-1 text-base font-semibold text-slate-900 dark:text-slate-100'>{formatDistance(trip.distance)}</p>
                  </div>
                  <div className='rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/65'>
                    <p className='text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400'>Start</p>
                    <p className='mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100'>{new Date(trip.startTime).toLocaleTimeString()}</p>
                  </div>
                  <div className='rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/65'>
                    <p className='text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400'>End</p>
                    <p className='mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100'>{new Date(trip.endTime).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch'>
              <article className='rounded-3xl border border-emerald-200/70 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10'>
                <div className='flex items-center gap-2 text-emerald-700 dark:text-emerald-300'>
                  <FiMapPin size={16} />
                  <p className='text-xs font-semibold uppercase tracking-[0.16em]'>Start Point</p>
                </div>
                <p className='mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200'>{trip.startLocation}</p>
                <div className='mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400'>
                  <FiClock size={14} />
                  <span>{new Date(trip.startTime).toLocaleString()}</span>
                </div>
              </article>

              <div className='hidden items-center justify-center lg:flex'>
                <div className='flex h-full min-h-[8rem] items-center'>
                  <div className='flex h-full flex-col items-center justify-center gap-2'>
                    <span className='h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)] dark:shadow-[0_0_0_6px_rgba(16,185,129,0.22)]' />
                    <div className='h-20 w-px bg-gradient-to-b from-emerald-400 via-sky-400 to-rose-400 dark:from-emerald-400 dark:via-sky-400 dark:to-rose-400' />
                    <FiNavigation size={18} className='text-sky-500 dark:text-sky-300' />
                    <div className='h-20 w-px bg-gradient-to-b from-sky-400 via-rose-300 to-rose-400 dark:from-sky-400 dark:via-rose-400/70 dark:to-rose-400' />
                    <span className='h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,0.14)] dark:shadow-[0_0_0_6px_rgba(244,63,94,0.22)]' />
                  </div>
                </div>
              </div>

              <article className='rounded-3xl border border-rose-200/70 bg-rose-50/80 p-4 dark:border-rose-500/20 dark:bg-rose-500/10'>
                <div className='flex items-center gap-2 text-rose-700 dark:text-rose-300'>
                  <FiNavigation size={16} />
                  <p className='text-xs font-semibold uppercase tracking-[0.16em]'>Destination</p>
                </div>
                <p className='mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200'>{trip.endLocation}</p>
                <div className='mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400'>
                  <FiClock size={14} />
                  <span>{new Date(trip.endTime).toLocaleString()}</span>
                </div>
              </article>
            </div>
          </section>

          <TripSummaryCard
            distance={trip.distance}
            duration={trip.duration}
            averageSpeed={averageSpeed}
            maxSpeed={maxSpeed}
          />

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Map Playback View</h3>
            <div className='h-[430px] overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
              <TripPlaybackMap routePoints={playback} currentPointIndex={currentPointIndex} />
            </div>
          </section>

          <PlaybackControls
            routePoints={playback}
            currentPointIndex={currentPointIndex}
            isPlaying={isPlaying}
            speed={speed}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSpeedChange={setSpeed}
            onPointIndexChange={setCurrentPointIndex}
          />

          {currentPoint ? (
            <p className='text-sm text-slate-700 dark:text-slate-200'>
              Current speed at point: <span className='font-semibold'>{currentPoint.speed} km/h</span>
            </p>
          ) : null}
        </>
      ) : (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Invalid or unknown trip ID: <span className='font-semibold'>{tripId || 'N/A'}</span>
        </div>
      )}
    </div>
  )
}
