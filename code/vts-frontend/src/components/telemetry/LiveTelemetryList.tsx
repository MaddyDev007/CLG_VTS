import { memo, type ReactElement, useMemo } from 'react'
import { List, type RowComponentProps } from 'react-window'
import { batteryMvToPercent, signalDbmToBars } from '@utils/telemetryFormat'
import type { TelemetryRecord } from '../../types/telemetry'

const LIST_HEIGHT = 500
const ROW_HEIGHT = 104
const TABLE_WIDTH = 1600

type LiveTelemetryListProps = {
  rows: TelemetryRecord[]
}

type LiveTelemetryRowData = {
  rows: TelemetryRecord[]
}

function batteryBadgeClasses(level: number): string {
  if (level > 70) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
  }

  if (level >= 30) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
  }

  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
}

function LiveTelemetryRowBase({
  index,
  style,
  rows,
}: RowComponentProps<LiveTelemetryRowData>): ReactElement | null {
  const row = rows[index]

  if (!row) {
    return null
  }

  const activeBars = signalDbmToBars(row.signal)
  const signalLabel = Number.isFinite(row.signal) ? `${Math.abs(row.signal)} dBm` : 'N/A'
  const batteryPercent = batteryMvToPercent(row.battery)
  const rawJson = JSON.stringify(row, null, 2)

  return (
    <div
      style={style}
      className='border-b border-slate-200/70 px-3 py-3 text-sm transition hover:bg-blue-50/60 dark:border-slate-700/70 dark:hover:bg-slate-800/60'
    >
      <div className='grid h-full w-[100px] grid-cols-[160px_140px_120px_110px_120px_160px_minmax(240px,1fr)_190px_260px] items-start gap-3'>
        <div className='min-w-0 font-medium text-slate-900 dark:text-slate-100'>
          <p className='truncate'>{row.vehicleName}</p>
        </div>
        <div className='text-slate-700 dark:text-slate-200'>{row.deviceId}</div>
        <div className='text-slate-700 dark:text-slate-200'>{row.speed} km/h</div>
        <div>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              row.ignition
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
            }`}
          >
            {row.ignition ? 'ON' : 'OFF'}
          </span>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${batteryBadgeClasses(
              batteryPercent,
            )}`}
          >
            {batteryPercent}%
          </span>
        </div>
        <div>
          <div className='inline-flex items-end gap-0.5' title={signalLabel}>
            {Array.from({ length: 4 }, (_, barIndex) => {
              const isActive = barIndex < activeBars
              const height = 6 + barIndex * 3
              return (
                <span
                  key={`${row.id}-live-bar-${barIndex}`}
                  className={`w-1 rounded-sm ${isActive ? 'bg-blue-600 dark:bg-[#38bdf8]' : 'bg-slate-300 dark:bg-slate-600'}`}
                  style={{ height }}
                />
              )
            })}
          </div>
          <span className='ml-2 text-xs text-slate-500 dark:text-slate-400'>{signalLabel}</span>
        </div>
        <div className='min-w-0 text-slate-700 dark:text-slate-200' title={row.address}>
          <p className='truncate'>{row.address?.trim() ? row.address : 'Unknown location'}</p>
          <p className='truncate text-xs text-slate-500 dark:text-slate-400'>
            {row.lat.toFixed(6)}, {row.lon.toFixed(6)}
          </p>
        </div>
        <div className='text-slate-700 dark:text-slate-200'>{new Date(row.timestamp).toLocaleString()}</div>
        <div>
          <pre className='h-20 w-[240px] overflow-y-scroll whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-[11px] leading-4 text-slate-700 dark:bg-slate-900 dark:text-slate-200'>
            {rawJson}
          </pre>
        </div>
      </div>
    </div>
  )
}

const LiveTelemetryRow = memo(LiveTelemetryRowBase) as typeof LiveTelemetryRowBase

export function LiveTelemetryList({ rows }: LiveTelemetryListProps) {
  const itemData = useMemo<LiveTelemetryRowData>(() => ({ rows }), [rows])

  return (
    <section className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <div className='overflow-x-auto'>
        <div className='mb-2 grid w-[1600px] grid-cols-[160px_140px_120px_110px_120px_160px_minmax(240px,1fr)_190px_260px] gap-3 border-b border-slate-200 px-3 pb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:text-slate-400'>
          <span>Vehicle</span>
          <span>Device</span>
          <span>Speed</span>
          <span>Ignition</span>
          <span>Battery</span>
          <span>Signal</span>
          <span>Location</span>
          <span>Timestamp</span>
          <span>Raw Data</span>
        </div>

        {rows.length ? (
          <List
            rowComponent={LiveTelemetryRow}
            rowCount={rows.length}
            rowHeight={ROW_HEIGHT}
            rowProps={itemData}
            overscanCount={6}
            style={{ height: LIST_HEIGHT, width: TABLE_WIDTH, overflowX: 'hidden' }}
          />
        ) : (
          <div className='px-4 py-6 text-sm text-slate-600 dark:text-slate-300'>
            No live telemetry rows available yet.
          </div>
        )}
      </div>
    </section>
  )
}
