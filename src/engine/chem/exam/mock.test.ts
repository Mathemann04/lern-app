import { describe, expect, it } from 'vitest'
import { truthOf } from '../../exam/grade.ts'
import { type MockAnswers, gradeMock, missingToPass, mockMax, openCountOf, remainingMs } from '../../exam/mock.ts'
import type { ExamTask } from '../../exam/types.ts'
import { CHEM_MOCK, chemMockExam } from './mock.ts'
import { TASK1_POINTS } from './task1.ts'
import { TASK2_POINTS } from './task2.ts'
import { TASK3_POINTS } from './task3.ts'
import { TASK4_POINTS } from './task4.ts'
import { TASK5_POINTS } from './task5.ts'

// Probeklausur Teil 1 (S9): Bauplan, gleiche Nummer = gleiche Klausur, Bewertung als Summe der Aufgaben

const IDS = Array.from({ length: 40 }, (_, i) => 1 + i * 2477)
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

describe('Probeklausur Chemie 1, Teil 1', () => {
  it('folgt dem Bauplan: Aufgaben 1 bis 5 mit 8, 6, 12, 14 und 10 Punkten, zusammen 50, in 45 Minuten', () => {
    expect([TASK1_POINTS, TASK2_POINTS, TASK3_POINTS, TASK4_POINTS, TASK5_POINTS]).toEqual([8, 6, 12, 14, 10])
    for (const id of IDS) {
      const exam = chemMockExam(id)
      expect(exam.tasks.map((t) => t.no)).toEqual([...CHEM_MOCK.tasks])
      expect(mockMax(exam)).toBe(CHEM_MOCK.points)
      expect(exam.minutes).toBe(CHEM_MOCK.minutes)
    }
    expect(CHEM_MOCK.points * 2).toBe(CHEM_MOCK.total)
  })

  it('dieselbe Nummer ergibt dieselbe Klausur, verschiedene Nummern verschiedene Aufgaben', () => {
    const a = chemMockExam(4711)
    const b = chemMockExam(4711)
    expect(a.tasks.map((t) => t.seed)).toEqual(b.tasks.map((t) => t.seed))
    expect(a.tasks.map((t) => t.task.intro)).toEqual(b.tasks.map((t) => t.task.intro))
    const seeds = new Set(IDS.map((id) => chemMockExam(id).tasks[3].seed))
    expect(seeds.size).toBe(IDS.length)
  })

  it('alles richtig gibt 50 Punkte, nichts beantwortet 0 Punkte mit allen Fragen offen', () => {
    for (const id of IDS.slice(0, 15)) {
      const exam = chemMockExam(id)
      const right: MockAnswers = Object.fromEntries(exam.tasks.map((t) => [String(t.no), truthAnswers(t.task)]))
      const full = gradeMock(exam, right)
      expect(full.points, String(id)).toBe(50)
      expect(full.tasks.map((t) => t.result.points)).toEqual([8, 6, 12, 14, 10])
      for (const t of exam.tasks) expect(openCountOf(t, right)).toBe(0)
      const empty = gradeMock(exam, {})
      expect(empty.points).toBe(0)
      for (const t of exam.tasks) expect(openCountOf(t, {})).toBe(truthOf(t.task).size)
    }
  })

  it('zählt jede Aufgabe für sich: eine Aufgabe richtig gibt genau ihre Punkte', () => {
    const exam = chemMockExam(99)
    for (const t of exam.tasks) {
      const result = gradeMock(exam, { [String(t.no)]: truthAnswers(t.task) })
      expect(result.points).toBe(result.tasks.find((r) => r.task.no === t.no)!.result.max)
    }
  })

  it('Uhr und Punkte zum Bestehen', () => {
    expect(remainingMs(1000, 45, 1000)).toBe(45 * 60_000)
    expect(remainingMs(1000, 45, 1000 + 44 * 60_000)).toBe(60_000)
    expect(remainingMs(1000, 45, 1000 + 50 * 60_000)).toBe(0)
    expect(missingToPass(31, CHEM_MOCK.passTotal)).toBe(9)
    expect(missingToPass(40, CHEM_MOCK.passTotal)).toBe(0)
    expect(missingToPass(47.5, CHEM_MOCK.passTotal)).toBe(0)
  })
})
