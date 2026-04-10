type RadiusSliderProps = {
  value: number
  onChange: (radius: number) => void
  min?: number
  max?: number
  step?: number
}

export function RadiusSlider({ value, onChange, min = 50, max = 2000, step = 10 }: RadiusSliderProps) {
  return (
    <div>
      <div className='mb-1 flex items-center justify-between'>
        <label className='block text-sm font-medium text-slate-700 dark:text-slate-200'>
          Radius ({value} m)
        </label>
      </div>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700 dark:accent-[#38bdf8]'
      />
    </div>
  )
}
