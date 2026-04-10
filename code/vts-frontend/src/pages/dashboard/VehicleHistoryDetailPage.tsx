import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HistoryMap } from '@components/history/HistoryMap'
import { HistoryPlaybackControls } from '@components/history/HistoryPlaybackControls'
import { HistoryTimeline } from '@components/history/HistoryTimeline'
import { useTripPlayback } from '@hooks/useTripPlayback'
import { historyService } from '@services/historyService'
import type { HistoryPoint, VehicleHistory } from '../../types/history'
import type { TripPlaybackPoint } from '../../types/trip'

export function VehicleHistoryDetailPage() {
  const { vehicleId = '' } = useParams()
  const [history, setHistory] = useState<VehicleHistory | null>(null)
  const [timeline, setTimeline] = useState<HistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const playbackPoints = useMemo<TripPlaybackPoint[]>(
    () =>
      timeline.map((point) => ({
        timestamp: point.timestamp,
        lat: point.lat,
        lon: point.lon,
        speed: point.speed,
      })),
    [timeline],
  )
  const {
    currentPointIndex,
    isPlaying,
    speed,
    play,
    pause,
    reset,
    setSpeed,
    setCurrentPointIndex,
  } = useTripPlayback(playbackPoints)

  useEffect(() => {
    const loadData = async () => {
      if (!vehicleId.trim()) {
        setHistory(null)
        setTimeline([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const [summary, points] = await Promise.all([
        historyService.getVehicleHistory(vehicleId),
        historyService.getVehicleHistoryTimeline(vehicleId),
      ])
      setHistory(summary)
      setTimeline(points)
      setIsLoading(false)
    }

    void loadData()
  }, [vehicleId])

  const events = useMemo(() => [], [])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicle History Detail</h2>
          <Link
            to='/history'
            className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-blue-600 hover:text-blue-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
          >
            Back to History
          </Link>
        </div>
      </section>

      {isLoading ? (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Loading vehicle history details...
        </div>
      ) : history ? (
        <>
          <section className='rounded-2xl border border-white/30 bg-white/55 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicle Summary</h3>
            <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5'>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Vehicle:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{history.vehicleName}</span>
              </p>
              <p className='sm:col-span-2'>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Last Location:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{history.lastLocation}</span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Last Seen:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>
                  {new Date(history.lastSeen).toLocaleString()}
                </span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Total Distance:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{history.totalDistance} km</span>
              </p>
              <p>
                <span className='font-semibold text-slate-900 dark:text-slate-100'>Total Trips:</span>{' '}
                <span className='text-slate-700 dark:text-slate-200'>{history.totalTrips}</span>
              </p>
            </div>
          </section>

          <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
            <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Map Visualization</h3>
            <div className='h-[430px] overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700'>
              <HistoryMap timeline={timeline} events={events} currentPointIndex={currentPointIndex} />
            </div>
          </section>

          <HistoryPlaybackControls
            timeline={timeline}
            currentPointIndex={currentPointIndex}
            isPlaying={isPlaying}
            speed={speed}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSpeedChange={setSpeed}
            onPointIndexChange={setCurrentPointIndex}
          />

          <HistoryTimeline events={events} />
        </>
      ) : (
        <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
          Invalid or unknown vehicle ID: <span className='font-semibold'>{vehicleId || 'N/A'}</span>
        </div>
      )}
    </div>
  )
}
