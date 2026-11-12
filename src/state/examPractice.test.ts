import { afterAll, describe, expect, it, vi } from 'vitest'
import {
  EXAM_PRACTICE_KEY,
  MAX_EXAM_PRACTICE,
  addExamPractice,
  clearExamPractice,
  loadExamPractice,
  parseExamPractice,
} from './examPractice.ts'

// Ergebnisse von „Klausuraufgabe N üben" auf dem Gerät (S11): robust gegen kaputten Inhalt

const RECORD = { subject: 'chemie', task: 4, points: 10.5, max: 14, at: 1_700_000_000_000 }

describe('Ergebnisse der Klausuraufgaben', () => {
  it('liest gespeicherte Ergebnisse und lässt Unlesbares einzeln weg', () => {
    expect(parseExamPractice(JSON.stringify([RECORD]))).toEqual([RECORD])
    const broken = [
      RECORD,
      { ...RECORD, points: -1 },
      { ...RECORD, points: 15 },
      { ...RECORD, max: 0, points: 0 },
      { ...RECORD, task: 0 },
      { ...RECORD, task: 1.5 },
      { ...RECORD, subject: 'Chemie!' },
      { ...RECORD, at: 'gestern' },
      7,
      null,
      [],
    ]
    expect(parseExamPractice(JSON.stringify(broken))).toEqual([RECORD])
    expect(parseExamPractice('{kaputt')).toEqual([])
    expect(parseExamPractice(JSON.stringify({ a: 1 }))).toEqual([])
    expect(parseExamPractice(null)).toEqual([])
  })

  it('hält höchstens die neuesten Ergebnisse', () => {
    const many = Array.from({ length: MAX_EXAM_PRACTICE + 30 }, (_, i) => ({ ...RECORD, at: i }))
    const parsed = parseExamPractice(JSON.stringify(many))
    expect(parsed).toHaveLength(MAX_EXAM_PRACTICE)
    expect(parsed[0].at).toBe(0)
  })

  it('liest aus dem Speicher und übersteht einen gesperrten Speicher', () => {
    const store = { getItem: (key: string) => (key === EXAM_PRACTICE_KEY ? JSON.stringify([RECORD]) : null), setItem: () => {} }
    expect(loadExamPractice(store)).toEqual([RECORD])
    const locked = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {},
    }
    expect(loadExamPractice(locked)).toEqual([])
  })

  describe('speichern und löschen', () => {
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) })
    afterAll(() => {
      vi.unstubAllGlobals()
    })

    it('legt das neueste Ergebnis vorn ab, nimmt Unpassendes nicht an und leert beim Löschen', () => {
      addExamPractice(RECORD)
      addExamPractice({ ...RECORD, task: 1, points: 8, max: 8, at: RECORD.at + 1 })
      addExamPractice({ ...RECORD, points: 20 })
      const stored = parseExamPractice(saved.get(EXAM_PRACTICE_KEY) ?? null)
      expect(stored.map((r) => r.task)).toEqual([1, 4])
      clearExamPractice()
      expect(parseExamPractice(saved.get(EXAM_PRACTICE_KEY) ?? null)).toEqual([])
    })
  })
})
