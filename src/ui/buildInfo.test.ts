import { describe, expect, it } from 'vitest'
import { formatBuildTime } from './buildInfo.ts'

describe('formatBuildTime', () => {
  it('zeigt Winterzeit in deutscher Schreibweise', () => {
    expect(formatBuildTime('2026-10-28T20:15:00Z')).toBe('28.10.2026, 21:15 Uhr')
  })

  it('berücksichtigt die Sommerzeit', () => {
    expect(formatBuildTime('2026-07-01T10:00:00Z')).toBe('01.07.2026, 12:00 Uhr')
  })
})
