import { describe, expect, it } from 'vitest'
import { createRng } from './rng.ts'

describe('createRng', () => {
  it('liefert bei gleichem Startwert dieselbe Folge', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('liefert bei benachbarten Startwerten verschiedene Folgen', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next())
  })

  it('bleibt in den Grenzen und trifft alle Werte', () => {
    const rng = createRng('grenzen')
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(-3, 3)
      expect(v).toBeGreaterThanOrEqual(-3)
      expect(v).toBeLessThanOrEqual(3)
      seen.add(v)
    }
    expect(seen.size).toBe(7)
  })

  it('mischt, ohne Elemente zu verlieren', () => {
    const shuffled = createRng(7).shuffle([1, 2, 3, 4, 5])
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
