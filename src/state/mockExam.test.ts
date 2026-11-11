import { describe, expect, it } from 'vitest'
import { MAX_MOCK_HISTORY, MOCK_KEY, loadMockSession, parseMockHistory, parseMockSession } from './mockExam.ts'

// Probeklausur auf dem Gerät (S9): robust gegen kaputten Inhalt

const SESSION = {
  subject: 'chemie',
  id: 4711,
  startedAt: 1_700_000_000_000,
  timed: true,
  answers: { '1': { ladung: 'a' }, '4': { 'molmasse-CO2': 'zahl:44' } },
  current: 4,
  submittedAt: null,
  timeUp: false,
}

describe('Probeklausur speichern', () => {
  it('liest eine gespeicherte Klausur', () => {
    expect(parseMockSession(JSON.stringify(SESSION))).toEqual(SESSION)
  })

  it('gibt bei nichts, kaputtem oder unpassendem Inhalt keine Klausur', () => {
    expect(parseMockSession(null)).toBeNull()
    expect(parseMockSession('')).toBeNull()
    expect(parseMockSession('{kaputt')).toBeNull()
    expect(parseMockSession('[]')).toBeNull()
    expect(parseMockSession(JSON.stringify({ ...SESSION, id: 0 }))).toBeNull()
    expect(parseMockSession(JSON.stringify({ ...SESSION, startedAt: 'gestern' }))).toBeNull()
    expect(parseMockSession(JSON.stringify({ ...SESSION, subject: 'Chemie 1' }))).toBeNull()
  })

  it('lässt unlesbare Antworten einzeln weg und ergänzt fehlende Angaben', () => {
    const parsed = parseMockSession(JSON.stringify({ ...SESSION, answers: { '1': { a: 3, b: 'x' }, abc: { c: 'y' }, '2': 'z' }, current: -1, submittedAt: 'bald' }))
    expect(parsed?.answers).toEqual({ '1': { b: 'x' } })
    expect(parsed?.current).toBe(1)
    expect(parsed?.submittedAt).toBeNull()
  })

  it('liest aus dem Speicher und übersteht einen gesperrten Speicher', () => {
    const store = { getItem: (key: string) => (key === MOCK_KEY ? JSON.stringify(SESSION) : null), setItem: () => {} }
    expect(loadMockSession(store)?.id).toBe(4711)
    const broken = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {},
    }
    expect(loadMockSession(broken)).toBeNull()
  })
})

describe('Verlauf der Probeklausuren', () => {
  const RECORD = { subject: 'chemie', id: 12, at: 1_700_000_000_000, points: 31.5, max: 50, tasks: [6, 4, 8.5, 7, 6], timed: true, minutes: 41, timeUp: false }

  it('liest gespeicherte Ergebnisse und lässt Unlesbares einzeln weg', () => {
    expect(parseMockHistory(JSON.stringify([RECORD]))).toEqual([RECORD])
    expect(parseMockHistory(JSON.stringify([RECORD, { ...RECORD, points: -1 }, { ...RECORD, tasks: 'x' }, 7, null]))).toEqual([RECORD])
    expect(parseMockHistory('{kaputt')).toEqual([])
    expect(parseMockHistory(null)).toEqual([])
  })

  it('hält höchstens die neuesten Ergebnisse', () => {
    const many = Array.from({ length: MAX_MOCK_HISTORY + 5 }, (_, i) => ({ ...RECORD, id: i + 1 }))
    const parsed = parseMockHistory(JSON.stringify(many))
    expect(parsed).toHaveLength(MAX_MOCK_HISTORY)
    expect(parsed[0].id).toBe(1)
  })
})
