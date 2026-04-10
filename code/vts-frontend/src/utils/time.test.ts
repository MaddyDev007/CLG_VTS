import { describe, expect, it } from 'vitest'
import { formatDuration } from './time'

describe('formatDuration', () => {
  it('formats 78 seconds as 1 min 18 sec', () => {
    expect(formatDuration(78000)).toBe('1 min 18 sec')
  })

  it('formats 45 seconds as seconds only', () => {
    expect(formatDuration(45000)).toBe('45 sec')
  })

  it('formats 1 hour as hr/min', () => {
    expect(formatDuration(3600000)).toBe('1 hr 0 min')
  })

  it('handles invalid or negative input', () => {
    expect(formatDuration(-500)).toBe('0 sec')
    expect(formatDuration(Number.NaN)).toBe('0 sec')
  })
})
