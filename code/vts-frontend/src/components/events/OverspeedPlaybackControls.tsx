import type { TripPlaybackSpeed } from '../../hooks/useTripPlayback'
import type { TripPlaybackPoint } from '../../types/trip'

type OverspeedPlaybackControlsProps = {
  routePoints: TripPlaybackPoint[]
  currentPointIndex: number
  isPlaying: boolean
  speed: TripPlaybackSpeed
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: TripPlaybackSpeed) => void
  onPointIndexChange: (index: number) => void
}

export function OverspeedPlaybackControls({
  routePoints,
  currentPointIndex,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onPointIndexChange,
}: OverspeedPlaybackControlsProps) {
  const currentPoint = routePoints[currentPointIndex] ?? null

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <h3 className='mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100'>Playback Controls</h3>

      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={onPlay}
          disabled={routePoints.length === 0 || isPlaying}
          className='rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
        >
          Play
        </button>
        <button
          type='button'
          onClick={onPause}
          disabled={!isPlaying}
          className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Pause
        </button>
        <button
          type='button'
          onClick={onReset}
          disabled={routePoints.length === 0}
          className='rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#38bdf8] dark:hover:text-[#38bdf8]'
        >
          Reset
        </button>

        <label className='inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200'>
          Speed
          <select
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value) as TripPlaybackSpeed)}
            className='rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#38bdf8]'
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </label>
      </div>

      <div className='mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200'>
        <p>
          Point: {routePoints.length ? currentPointIndex + 1 : 0} / {routePoints.length}
        </p>
        <p>
          Current Timestamp:{' '}
          {currentPoint ? new Date(currentPoint.timestamp).toLocaleString() : 'No playback data'}
        </p>
      </div>

      <input
        type='range'
        min={0}
        max={Math.max(0, routePoints.length - 1)}
        step={1}
        value={Math.min(currentPointIndex, Math.max(0, routePoints.length - 1))}
        onChange={(event) => onPointIndexChange(Number(event.target.value))}
        className='mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700 dark:accent-[#38bdf8]'
        disabled={routePoints.length === 0}
      />
    </section>
  )
}
