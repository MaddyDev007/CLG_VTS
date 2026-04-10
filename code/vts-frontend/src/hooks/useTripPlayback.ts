import { useEffect, useMemo, useState } from 'react'
import type { TripPlaybackPoint } from '../types/trip'

export type TripPlaybackSpeed = 1 | 2 | 4

type UseTripPlaybackResult = {
  currentPointIndex: number
  isPlaying: boolean
  speed: TripPlaybackSpeed
  currentPoint: TripPlaybackPoint | null
  play: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: TripPlaybackSpeed) => void
  setCurrentPointIndex: (index: number) => void
}

const TICK_MS = 500

export function useTripPlayback(routePoints: TripPlaybackPoint[]): UseTripPlaybackResult {
  const [currentPointIndex, setCurrentPointIndexState] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeedState] = useState<TripPlaybackSpeed>(1)

  useEffect(() => {
    setCurrentPointIndexState(0)
    setIsPlaying(false)
  }, [routePoints])

  useEffect(() => {
    if (!isPlaying || routePoints.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      setCurrentPointIndexState((current) => {
        if (current >= routePoints.length - 1) {
          setIsPlaying(false)
          return current
        }

        const nextIndex = current + speed
        if (nextIndex >= routePoints.length - 1) {
          setIsPlaying(false)
          return routePoints.length - 1
        }

        return nextIndex
      })
    }, TICK_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isPlaying, routePoints.length, speed])

  const currentPoint = useMemo(
    () => routePoints[currentPointIndex] ?? null,
    [currentPointIndex, routePoints],
  )

  const play = () => {
    if (routePoints.length <= 1) {
      return
    }

    if (currentPointIndex >= routePoints.length - 1) {
      setCurrentPointIndexState(0)
    }
    setIsPlaying(true)
  }

  const pause = () => {
    setIsPlaying(false)
  }

  const reset = () => {
    setIsPlaying(false)
    setCurrentPointIndexState(0)
  }

  const setSpeed = (nextSpeed: TripPlaybackSpeed) => {
    setSpeedState(nextSpeed)
  }

  const setCurrentPointIndex = (index: number) => {
    if (!routePoints.length) {
      setCurrentPointIndexState(0)
      return
    }

    const boundedIndex = Math.max(0, Math.min(routePoints.length - 1, index))
    setCurrentPointIndexState(boundedIndex)
  }

  return {
    currentPointIndex,
    isPlaying,
    speed,
    currentPoint,
    play,
    pause,
    reset,
    setSpeed,
    setCurrentPointIndex,
  }
}
