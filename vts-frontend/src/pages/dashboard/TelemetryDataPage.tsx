import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TelemetryFilters, type TelemetryFilterPayload } from '@components/telemetry/TelemetryFilters'
import { LiveTelemetryList } from '@components/telemetry/LiveTelemetryList'
import { TelemetryTable } from '@components/telemetry/TelemetryTable'
import { socketService, type VehicleSocketPayload } from '@services/socketService'
import { telemetryService } from '@services/telemetryService'
import {
  applyTelemetryLiveUpdate,
  isTelemetryLiveModeEligible,
  limitTelemetryRows,
  normalizeTelemetryHistoryFilters,
  shouldAcceptLiveTelemetryRow,
  TELEMETRY_LIVE_MAX_ROWS,
  uniqueVehicleIdsFromSocketPayloads,
} from '@utils/telemetryLive'
import type { TelemetryRecord } from '../../types/telemetry'

const LIVE_BATCH_DELAY_MS = 200

export function TelemetryDataPage() {
  const [rows, setRows] = useState<TelemetryRecord[]>([])
  const [allRows, setAllRows] = useState<TelemetryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TelemetryFilterPayload>({ dateRange: 'today' })
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [liveStatusMessage, setLiveStatusMessage] = useState<string | null>(null)
  const [liveUpdateCount, setLiveUpdateCount] = useState(0)

  const liveQueueRef = useRef<VehicleSocketPayload[]>([])
  const liveFlushTimeoutRef = useRef<number | null>(null)
  const tableSectionRef = useRef<HTMLDivElement | null>(null)

  const canEnableLiveMode = useMemo(() => isTelemetryLiveModeEligible(filters), [filters])

  const loadBaseRows = useCallback(async () => {
    const data = await telemetryService.getTelemetry()
    setAllRows(data)
  }, [])

  const loadHistoryRows = useCallback(async () => {
    setIsLoading(true)
    try {
      const serviceFilters = normalizeTelemetryHistoryFilters(filters)
      const data = await telemetryService.getTelemetry(serviceFilters)
      const finalRows = filters.deviceId ? data.filter((row) => row.deviceId === filters.deviceId) : data
      setRows(finalRows)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const flushLiveQueue = useCallback(async () => {
    const payloads = liveQueueRef.current
    liveQueueRef.current = []
    liveFlushTimeoutRef.current = null

    const vehicleIds = uniqueVehicleIdsFromSocketPayloads(payloads)
    if (!vehicleIds.length) {
      return
    }

    const latestRows = await Promise.all(
      vehicleIds.map((vehicleId) => telemetryService.getLatestTelemetryByVehicle(vehicleId)),
    )

    const acceptedRows = latestRows.filter(
      (row): row is TelemetryRecord => row !== null && shouldAcceptLiveTelemetryRow(row, filters),
    )

    if (!acceptedRows.length) {
      return
    }

    setRows((currentRows) =>
      acceptedRows.reduce(
        (nextRows, row) => applyTelemetryLiveUpdate(nextRows, row, TELEMETRY_LIVE_MAX_ROWS),
        currentRows,
      ),
    )
    setLiveUpdateCount((count) => count + acceptedRows.length)
    tableSectionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [filters])

  const scheduleLiveFlush = useCallback(() => {
    if (liveFlushTimeoutRef.current) {
      return
    }

    liveFlushTimeoutRef.current = window.setTimeout(() => {
      void flushLiveQueue()
    }, LIVE_BATCH_DELAY_MS)
  }, [flushLiveQueue])

  useEffect(() => {
    void loadBaseRows()
  }, [loadBaseRows])

  useEffect(() => {
    if (isLiveMode) {
      return
    }

    void loadHistoryRows()
  }, [isLiveMode, loadHistoryRows])

  useEffect(() => {
    if (isLiveMode && !canEnableLiveMode) {
      setIsLiveMode(false)
      setLiveStatusMessage('Live mode disabled due to filters')
    }
  }, [canEnableLiveMode, isLiveMode])

  useEffect(() => {
    if (!isLiveMode) {
      if (liveFlushTimeoutRef.current) {
        window.clearTimeout(liveFlushTimeoutRef.current)
        liveFlushTimeoutRef.current = null
      }
      liveQueueRef.current = []
      return
    }

    const unsubscribe = socketService.subscribeToVehicleUpdates((payload) => {
      liveQueueRef.current.push(payload)
      scheduleLiveFlush()
    })

    return () => {
      unsubscribe()

      if (liveFlushTimeoutRef.current) {
        window.clearTimeout(liveFlushTimeoutRef.current)
        liveFlushTimeoutRef.current = null
      }
      liveQueueRef.current = []
    }
  }, [isLiveMode, scheduleLiveFlush])

  const handleFiltersChange = useCallback((nextFilters: TelemetryFilterPayload) => {
    setFilters(nextFilters)
  }, [])

  const handleLiveToggle = useCallback(() => {
    if (isLiveMode) {
      setIsLiveMode(false)
      setLiveStatusMessage('Live mode turned off. History view restored.')
      return
    }

    if (!canEnableLiveMode) {
      setLiveStatusMessage('Live mode is available only for the default Today view without extra filters.')
      return
    }

    setIsLiveMode(true)
    setLiveUpdateCount(0)
    setRows((currentRows) => limitTelemetryRows(currentRows, TELEMETRY_LIVE_MAX_ROWS))
    setLiveStatusMessage('Live mode enabled. New telemetry rows will stream in at the top.')
  }, [canEnableLiveMode, isLiveMode])

  const vehicleOptions = useMemo(() => {
    const byId = new Map<string, string>()
    allRows.forEach((row) => {
      if (!byId.has(row.vehicleId)) {
        byId.set(row.vehicleId, row.vehicleName)
      }
    })

    return Array.from(byId.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allRows])

  const deviceOptions = useMemo(() => {
    return Array.from(new Set(allRows.map((row) => row.deviceId))).sort((a, b) => a.localeCompare(b))
  }, [allRows])

  return (
    <div className='mx-auto w-full max-w-7xl space-y-5'>
      <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Telemetry Data</h2>
            <p className='text-sm text-slate-600 dark:text-slate-300'>
              History mode supports filtering and pagination. Live mode streams the newest telemetry rows.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {isLiveMode ? (
              <span className='rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'>
                LIVE
              </span>
            ) : null}
            <button
              type='button'
              onClick={handleLiveToggle}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isLiveMode
                  ? 'border border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 hover:text-rose-600 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-300'
                  : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-[#38bdf8] dark:text-slate-950 dark:hover:bg-cyan-300'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isLiveMode ? 'bg-rose-500 animate-pulse' : 'bg-white/80 dark:bg-slate-950/70'
                }`}
              />
              Live {isLiveMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {liveStatusMessage ? (
          <p className='mt-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200'>
            {liveStatusMessage}
          </p>
        ) : null}

        {isLiveMode ? (
          <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300'>
            <span className='rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800'>
              Buffered rows: {rows.length}/{TELEMETRY_LIVE_MAX_ROWS}
            </span>
            <span className='rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800'>New rows received: {liveUpdateCount}</span>
            <span className='rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'>
              Filters and pagination are locked while live mode is active
            </span>
          </div>
        ) : null}
      </section>

      <TelemetryFilters
        vehicles={vehicleOptions}
        devices={deviceOptions}
        onChange={handleFiltersChange}
        initialFilters={filters}
        disabled={isLiveMode}
      />

      {!canEnableLiveMode && !isLiveMode ? (
        <section className='rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'>
          Live mode is available only for the default Today view without vehicle, device, or ignition filters.
        </section>
      ) : null}

      <div ref={tableSectionRef}>
        {isLoading ? (
          <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300'>
            Loading telemetry...
          </div>
        ) : isLiveMode ? (
          <LiveTelemetryList rows={rows} />
        ) : (
          <TelemetryTable rows={rows} />
        )}
      </div>
    </div>
  )
}
