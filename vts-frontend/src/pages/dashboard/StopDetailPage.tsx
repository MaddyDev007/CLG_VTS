import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StopEventCard } from '@components/events/StopEventCard'
import { StopMap } from '@components/events/StopMap'
import { StopPlaybackControls } from '@components/events/StopPlaybackControls'
import { useTripPlayback } from '@hooks/useTripPlayback'
import { stopService } from '@services/stopService'
import type { StopEvent } from '../../types/events'
import type { TripPlaybackPoint } from '../../types/trip'

export function StopDetailPage() {
  const { eventId = '' } = useParams()
  const [event, setEvent] = useState<StopEvent | null>(null)
  const [playback, setPlayback] = useState<TripPlaybackPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const requestIdRef = useRef(0)
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
    const loadEvent = async () => {
      const requestId = ++requestIdRef.current
      if (!eventId.trim()) {
        setEvent(null)
        setPlayback([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const [eventData, playbackData] = await Promise.all([
        stopService.getStopEventById(eventId),
        stopService.getStopPlayback(eventId),
      ])
      if (requestId !== requestIdRef.current) {
        return
      }
      setEvent(eventData)
      setPlayback(playbackData)
      setIsLoading(false)
    }

    void loadEvent()
  }, [eventId])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <div className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Stop Event Detail</h2>
          <Link
            to='/stop'
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Back to Stops
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading stop event...
        </div>
      ) : event ? (
        <>
          <StopEventCard
            vehicleName={event.vehicleName}
            duration={event.duration}
            startTime={event.startTime}
            endTime={event.endTime}
            location={event.location}
          />

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Stop Location</h3>
            <div className='h-[430px] overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
              <StopMap
                lat={event.lat}
                lon={event.lon}
                routePoints={playback}
                currentPointIndex={currentPointIndex}
              />
            </div>
          </section>

          <StopPlaybackControls
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
        </>
      ) : (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Invalid or unknown stop event ID: <span className='font-semibold'>{eventId || 'N/A'}</span>
        </div>
      )}
    </div>
  )
}
