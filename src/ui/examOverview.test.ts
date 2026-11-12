import { describe, expect, it } from 'vitest'
import { CHEM_MOCK } from '../engine/chem/exam/mock.ts'
import type { MockRecord } from '../state/mockExam.ts'
import { subjectById } from './catalog.ts'
import { type ExamAttempt, CONFIDENCE_LABEL, confidenceOf, examAttempts, examTasksOf, mockSummary, mockTaskOrder, pointsText } from './examOverview.ts'

// Klausur-Überblick (S11): wie sicher je Klausuraufgabe, letzte und beste Probeklausur

const chemie = subjectById('chemie')!
const attempt = (points: number, max: number, at: number): ExamAttempt => ({ points, max, at, mock: false })
const mock = (at: number, tasks: number[], subject = 'chemie'): MockRecord => ({
  subject,
  id: at,
  at,
  points: tasks.reduce((a, b) => a + b, 0),
  max: 50,
  tasks,
  timed: true,
  minutes: 40,
  timeUp: false,
})

describe('Klausuraufgaben im Katalog', () => {
  it('nennt die Klausuraufgaben nach Nummer, in der Reihenfolge der Probeklausur der Engine', () => {
    expect(examTasksOf(chemie).map((t) => t.task)).toEqual([1, 2, 3, 4, 5])
    expect(mockTaskOrder(chemie)).toEqual([...CHEM_MOCK.tasks])
    expect(examTasksOf(chemie).reduce((sum, t) => sum + t.points, 0)).toBe(CHEM_MOCK.points)
    expect(examTasksOf(subjectById('mathe')!)).toEqual([])
  })
})

describe('Wie sicher', () => {
  it('ohne Versuch: noch nicht geübt', () => {
    expect(confidenceOf([])).toEqual({ level: 'new', share: null, last: null })
    expect(CONFIDENCE_LABEL.new).toBe('noch nicht geübt')
  })

  it('stuft nach dem Anteil der Punkte in den letzten drei Versuchen', () => {
    expect(confidenceOf([attempt(3, 8, 1)]).level).toBe('unsure')
    // genau 50 % und knapp darunter
    expect(confidenceOf([attempt(4, 8, 1)]).level).toBe('almost')
    expect(confidenceOf([attempt(3.5, 8, 1)]).level).toBe('unsure')
    // genau 80 % und knapp darunter
    expect(confidenceOf([attempt(8, 10, 1)]).level).toBe('sure')
    expect(confidenceOf([attempt(7.5, 10, 1)]).level).toBe('almost')
    expect(confidenceOf([attempt(14, 14, 1)])).toMatchObject({ level: 'sure', share: 1 })
  })

  it('nimmt nur die drei neuesten Versuche, der neueste ist „zuletzt"', () => {
    const attempts = [attempt(0, 8, 1), attempt(0, 8, 2), attempt(8, 8, 5), attempt(8, 8, 4), attempt(6, 8, 3)]
    const result = confidenceOf(attempts)
    expect(result.share).toBeCloseTo(22 / 24)
    expect(result.level).toBe('sure')
    expect(result.last).toEqual(attempt(8, 8, 5))
  })
})

describe('Versuche einer Klausuraufgabe', () => {
  it('nimmt Übungen und die Punkte der Aufgabe in Probeklausuren, die neuesten zuerst', () => {
    const practice = [
      { subject: 'chemie', task: 4, points: 7, max: 14, at: 30 },
      { subject: 'chemie', task: 3, points: 12, max: 12, at: 40 },
      { subject: 'mathe', task: 4, points: 14, max: 14, at: 50 },
    ]
    const history = [mock(20, [8, 6, 12, 10, 10]), mock(10, [1, 2, 3, 4, 5]), mock(60, [8, 6, 12], 'chemie'), mock(5, [0, 0, 0, 14, 0], 'physik')]
    const attempts = examAttempts(chemie, 4, practice, history)
    // die Probeklausur mit unpassender Zahl von Aufgaben zählt nicht
    expect(attempts).toEqual([
      { points: 7, max: 14, at: 30, mock: false },
      { points: 10, max: 14, at: 20, mock: true },
      { points: 4, max: 14, at: 10, mock: true },
    ])
    expect(confidenceOf(attempts).level).toBe('almost')
    expect(examAttempts(chemie, 1, practice, history).map((a) => a.points)).toEqual([8, 1])
    expect(examAttempts(chemie, 9, practice, history)).toEqual([])
  })
})

describe('Probeklausuren', () => {
  it('nennt die letzte und die beste des Fachs', () => {
    const history = [mock(30, [1, 1, 1, 1, 1]), mock(20, [8, 6, 12, 10, 10]), mock(10, [2, 2, 2, 2, 2]), mock(40, [8, 6, 12, 14, 10], 'physik')]
    const summary = mockSummary(chemie, history)
    expect(summary.last?.at).toBe(30)
    expect(summary.best?.at).toBe(20)
    expect(summary.count).toBe(3)
    expect(mockSummary(chemie, [])).toEqual({ last: null, best: null, count: 0 })
  })

  it('schreibt Punkte mit Komma', () => {
    expect(pointsText(10.5)).toBe('10,5')
    expect(pointsText(8)).toBe('8')
  })
})
