import { describe, expect, it } from 'vitest'
import { truthOf } from '../../exam/grade.ts'
import { type MockAnswers, gradeMock, missingToPass, mockMax, openCountOf, practiceHints, remainingMs } from '../../exam/mock.ts'
import { CARDS } from '../../explain/cards.ts'
import { decodeSeed } from '../../quiz/numbers.ts'
import { createRng } from '../../random/rng.ts'
import { chemTopic } from '../banks.ts'
import type { ExamTask } from '../../exam/types.ts'
import { CHEM_MOCK, chemMockExam, mockSubstances, pickMockId } from './mock.ts'
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

describe('Probeklausur: Verlauf, Wiederholung und Übungsvorschläge (S9b)', () => {
  it('Wissensfragen tragen ihr Thema und ihre Nummer für die Wiederholung, und die Nummer passt zur Frage', () => {
    let count = 0
    for (const id of IDS.slice(0, 20)) {
      for (const t of chemMockExam(id).tasks) {
        for (const item of t.task.parts.flatMap((p) => p.items)) {
          if (!item.review) continue
          count++
          const decoded = decodeSeed(item.review.seed)
          expect(decoded?.kind, item.id).toBe('question')
          const q = chemTopic(item.review.course)!.bank.questions.find((x) => decoded?.kind === 'question' && x.no === decoded.no)
          expect(q?.title, item.id).toBe(item.title)
        }
      }
    }
    expect(count).toBeGreaterThan(40)
  })

  it('schlägt die Themen mit den meisten verlorenen Punkten vor; alles richtig: nichts', () => {
    const exam = chemMockExam(7)
    const right: MockAnswers = Object.fromEntries(exam.tasks.map((t) => [String(t.no), truthAnswers(t.task)]))
    const topicOf = (card: string) => CARDS.find((c) => c.id === card)?.topic
    expect(practiceHints(gradeMock(exam, right), topicOf)).toEqual([])
    // nur Aufgabe 4 offen: alles, was fehlt, gehört zu Themen der Stöchiometrie
    const without4 = Object.fromEntries(Object.entries(right).filter(([no]) => no !== '4'))
    const hints = practiceHints(gradeMock(exam, without4), topicOf, 10)
    expect(hints.reduce((s, h) => s + h.lost, 0)).toBeCloseTo(14, 0)
    for (const h of hints) expect(['chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen']).toContain(h.course)
    // nichts beantwortet: alle Punkte verloren, höchstens drei Vorschläge, absteigend
    const all = practiceHints(gradeMock(exam, {}), topicOf)
    expect(all).toHaveLength(3)
    expect(all[0].lost).toBeGreaterThanOrEqual(all[2].lost)
  })

  it('jede Frage hat eine Lernkarte mit einem Thema', () => {
    for (const id of IDS.slice(0, 20)) {
      for (const t of chemMockExam(id).tasks) {
        for (const item of t.task.parts.flatMap((p) => p.items)) expect(item.cards.some((c) => CARDS.find((x) => x.id === c)?.topic), `${id} ${item.id}`).toBe(true)
      }
    }
  })

  it('meidet Stoffe der letzten drei Probeklausuren: deutlich weniger gleiche Stoffe als zufällig', () => {
    // Elemente, um die sich ein Teil dreht („Element: …"), als Name
    expect(mockSubstances(chemMockExam(1)).some((s) => /^[A-Z][a-zäöü]+$/.test(s) && s.length > 3)).toBe(true)
    expect(mockSubstances(chemMockExam(1))).not.toContain('CO2')
    const rng = createRng('meiden')
    const random = () => rng.int(0, 999_999) / 1_000_000
    let picked = 0
    let plain = 0
    for (let k = 0; k < 8; k++) {
      const recent = [rng.int(1, 99_999), rng.int(1, 99_999), rng.int(1, 99_999)]
      const used = new Set(recent.flatMap((x) => mockSubstances(chemMockExam(x))))
      const id = pickMockId(recent, random)
      expect(recent).not.toContain(id)
      picked += mockSubstances(chemMockExam(id)).filter((s) => used.has(s)).length
      plain += mockSubstances(chemMockExam(rng.int(1, 99_999))).filter((s) => used.has(s)).length
    }
    expect(picked).toBeLessThan(plain * 0.6)
  })
})
