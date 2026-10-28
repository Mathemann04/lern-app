import { describe, expect, it } from 'vitest'
import { createRng } from '../random/rng.ts'
import { evaluate } from './evaluate.ts'
import { samplePoints } from './sample.ts'
import { E, add, div, exp, fn, ln, log, mul, neg, num, pow, root, sin, sqrt, x, y } from './types.ts'

const at = (value: number) => ({ x: value })

describe('evaluate', () => {
  it('rechnet Grundterme aus', () => {
    // 4x³ − 2/x + √x an der Stelle 4: 256 − 0,5 + 2
    const f = add(mul(num(4), pow(x, num(3))), neg(div(num(2), x)), sqrt(x))
    expect(evaluate(f, at(4))).toBeCloseTo(257.5, 12)
    expect(evaluate(mul(pow(x, num(2)), exp(x)), at(1))).toBeCloseTo(Math.E, 12)
    expect(evaluate(log(num(2), num(8)), {})).toBeCloseTo(3, 12)
    expect(evaluate(add(x, y), { x: 1, y: 2 })).toBe(3)
  })

  it('rechnet gebrochene Exponenten und Wurzeln', () => {
    expect(evaluate(pow(x, num(2, 3)), at(8))).toBeCloseTo(4, 12)
    expect(evaluate(root(x, 3), at(27))).toBeCloseTo(3, 12)
  })

  it('liefert NaN außerhalb des Definitionsbereichs', () => {
    expect(evaluate(div(num(1), x), at(0))).toBeNaN()
    expect(evaluate(ln(x), at(0))).toBeNaN()
    expect(evaluate(ln(x), at(-1))).toBeNaN()
    expect(evaluate(sqrt(x), at(-1))).toBeNaN()
    expect(evaluate(fn('arcsin', x), at(2))).toBeNaN()
    expect(evaluate(fn('tan', num(0)), {})).toBe(0)
  })

  it('folgt der deutschen Konvention für Wurzeln negativer Zahlen', () => {
    expect(evaluate(root(x, 3), at(-8))).toBeNaN()
    expect(evaluate(pow(x, num(1, 3)), at(-8))).toBeNaN()
    // Ganzzahlige Exponenten sind für negative Zahlen definiert
    expect(evaluate(pow(x, num(3)), at(-2))).toBe(-8)
    expect(evaluate(pow(x, num(-2)), at(-2))).toBe(0.25)
  })

  it('definiert Potenzen mit variablem Exponenten nur für positive Basis', () => {
    expect(evaluate(pow(x, x), at(2))).toBe(4)
    expect(evaluate(pow(x, x), at(-2))).toBeNaN()
    expect(evaluate(pow(E, neg(x)), at(-2))).toBeCloseTo(Math.E ** 2, 12)
  })

  it('kennt fehlende Variablen nicht', () => {
    expect(evaluate(sin(y), at(1))).toBeNaN()
  })
})

describe('samplePoints', () => {
  it('findet Stellen nur im Definitionsbereich', () => {
    const f = ln(add(x, num(-3)))
    const points = samplePoints([f], createRng(1), 30)
    expect(points).toHaveLength(30)
    for (const p of points) expect(p.x).toBeGreaterThan(3)
  })

  it('findet auch kleine Definitionsbereiche', () => {
    const f = fn('arcsin', mul(num(5), x))
    expect(samplePoints([f], createRng(2), 30)).toHaveLength(30)
  })

  it('liefert nichts, wenn der Term nirgends definiert ist', () => {
    expect(samplePoints([ln(neg(pow(x, num(2))))], createRng(3), 10)).toHaveLength(0)
  })
})
