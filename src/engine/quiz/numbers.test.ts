import { describe, expect, it } from 'vitest'
import { MAX_SEED, formatTaskNumber, parseTaskNumber } from '../tasks/taskNumber.ts'
import { GENERATED_MAX, GENERATED_MIN, QUESTION_NO_MAX, VARIANTS, decodeSeed, questionSeed } from './numbers.ts'

describe('Aufgabennummern der Wissens-Themen', () => {
  it('liest Fragen in der Grundform (1 bis 9999)', () => {
    expect(decodeSeed(1)).toEqual({ kind: 'question', no: 1, variant: 0 })
    expect(decodeSeed(QUESTION_NO_MAX)).toEqual({ kind: 'question', no: QUESTION_NO_MAX, variant: 0 })
  })

  it('hält 10000 bis 499999 für erzeugte Rechnungen frei', () => {
    expect(decodeSeed(GENERATED_MIN)).toEqual({ kind: 'generated', seed: GENERATED_MIN })
    expect(decodeSeed(GENERATED_MAX)).toEqual({ kind: 'generated', seed: GENERATED_MAX })
  })

  it('liest Fragen in einer Fassung: 500000 + 50 · Nummer + Fassung', () => {
    expect(decodeSeed(500_050)).toEqual({ kind: 'question', no: 1, variant: 0 })
    expect(decodeSeed(500_099)).toEqual({ kind: 'question', no: 1, variant: 49 })
    expect(decodeSeed(500_100 + 7)).toEqual({ kind: 'question', no: 2, variant: 7 })
    expect(decodeSeed(MAX_SEED)).toEqual({ kind: 'question', no: QUESTION_NO_MAX, variant: VARIANTS - 1 })
  })

  it('kennt Nummern außerhalb aller Bereiche nicht', () => {
    for (const seed of [0, -3, 1.5, 500_000, 500_049, MAX_SEED + 1]) expect(decodeSeed(seed), String(seed)).toBeNull()
  })

  it('baut Nummern, die sich zurücklesen lassen und ins Format „Stufe-Nummer" passen', () => {
    for (const no of [1, 2, 15, 123, 4711, QUESTION_NO_MAX]) {
      for (const variant of [0, 1, 25, VARIANTS - 1]) {
        const seed = questionSeed(no, variant)
        expect(decodeSeed(seed)).toEqual({ kind: 'question', no, variant })
        expect(seed).toBeLessThanOrEqual(MAX_SEED)
        expect(parseTaskNumber(formatTaskNumber({ level: 3, seed }))).toEqual({ level: 3, seed })
      }
    }
  })

  it('lehnt unmögliche Fragennummern und Fassungen ab', () => {
    expect(() => questionSeed(0, 0)).toThrow()
    expect(() => questionSeed(QUESTION_NO_MAX + 1, 0)).toThrow()
    expect(() => questionSeed(1, VARIANTS)).toThrow()
    expect(() => questionSeed(1, -1)).toThrow()
  })
})
