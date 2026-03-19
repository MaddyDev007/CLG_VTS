import { useEffect, useMemo, useState } from 'react'
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
          <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5'>
              <p className='lg:col-span-1'>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Vehicle:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{trip.vehicleName}</span>
              </p>
              <p className='lg:col-span-2'>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Start:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{trip.startLocation}</span>
              </p>
              <p className='lg:col-span-2'>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>End:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{trip.endLocation}</span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Duration:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{formatDurationDetail(trip.duration)}</span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Distance:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{formatDistance(trip.distance)}</span>
              </p>
              <p className='sm:col-span-2'>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Start Time:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{new Date(trip.startTime).toLocaleString()}</span>
              </p>
              <p className='sm:col-span-2'>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>End Time:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{new Date(trip.endTime).toLocaleString()}</span>
              </p>
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
