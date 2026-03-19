import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from '@hooks/useTheme'

type VehicleActivityBarDatum = {
  label: 'moving' | 'idling' | 'stopped' | 'offline'
  count: number
}

type VehicleActivityBarChartProps = {
  data?: VehicleActivityBarDatum[]
}

const defaultData: VehicleActivityBarDatum[] = [
  { label: 'moving', count: 64 },
  { label: 'idling', count: 22 },
  { label: 'stopped', count: 35 },
  { label: 'offline', count: 7 },
]

const statusColors: Record<VehicleActivityBarDatum['label'], string> = {
  moving: '#22c55e',
  idling: '#eab308',
  stopped: '#f97316',
  offline: '#94a3b8',
}

export function VehicleActivityBarChart({ data = defaultData }: VehicleActivityBarChartProps) {
  const { isDark } = useTheme()
  const axisColor = isDark ? '#cbd5e1' : '#334155'
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tooltipBg = isDark ? '#0f172a' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1'

  return (
    <article className='rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#1e293b]/70 dark:shadow-black/20'>
      <header className='mb-3'>
        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Vehicle Activity</h3>
      </header>

      <div className='h-[300px] w-full min-w-0'>
        <ResponsiveContainer width='100%' height='100%' minWidth={0} minHeight={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke={gridColor} />
            <XAxis dataKey='label' tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 10,
                color: axisColor,
              }}
              formatter={(value) => [`${value ?? 0}`, 'Count']}
            />
            <Bar dataKey='count' radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={statusColors[entry.label]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
