import { describe, expect, it } from 'vitest'
import { createRng } from '../random/rng.ts'
import { VARIANTS, decodeSeed, questionSeed } from '../quiz/numbers.ts'
import type { QuestionBank } from '../quiz/types.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { CHEM_TOPICS, chemTopic } from './banks.ts'
import { chemCourseEngine, topicEngine } from './engine.ts'

const seeded = (seed: string) => {
  const rng = createRng(seed)
  return () => rng.next()
}

describe.each(CHEM_TOPICS.map((t) => [t.bank.course, t] as const))('Chemie-Engine: %s', (course, topic) => {
  const engine = chemCourseEngine(course, seeded(course))
  const questions = topic.bank.questions

  it('ordnet jeder Nummer einer Frage ihre Stufe zu, auch über eine falsche Stufe in der Adresse', () => {
    for (const q of questions) {
      for (const level of LEVELS) {
        expect(engine.resolve({ level, seed: q.no }), q.id).toBe(q.level)
        expect(engine.resolve({ level, seed: questionSeed(q.no, 17) }), q.id).toBe(q.level)
      }
    }
  })

  it('kennt Nummern ohne Frage nicht', () => {
    const unused = Math.max(...questions.map((q) => q.no), ...topic.bank.retired) + 1
    expect(engine.resolve({ level: 1, seed: unused })).toBeNull()
    expect(engine.resolve({ level: 1, seed: questionSeed(unused, 3) })).toBeNull()
    // erzeugte Rechnungen gibt es in S1 noch nicht
    expect(engine.resolve({ level: 1, seed: 12_345 })).toBeNull()
    expect(() => engine.planGuidedTask({ level: 1, seed: unused })).toThrow()
  })

  it('zieht neue Nummern nur aus Fragen der gewählten Stufe, mit wechselnder Fassung', () => {
    for (const level of [1, 2, 3] as const) {
      const inLevel = questions.filter((q) => q.level === level)
      if (inLevel.length === 0) continue
      const drawn = new Set<number>()
      const variants = new Set<number>()
      for (let i = 0; i < 400; i++) {
        const seed = engine.nextSeed(level)
        expect(engine.resolve({ level, seed })).toBe(level)
        const decoded = decodeSeed(seed)
        if (decoded?.kind !== 'question') throw new Error(String(seed))
        drawn.add(decoded.no)
        variants.add(decoded.variant)
      }
      // bei 400 Zügen kommt jede Frage der Stufe vor
      expect(drawn.size).toBe(inLevel.length)
      expect(variants.size).toBeGreaterThan(VARIANTS / 2)
    }
  })

  it('zieht keine Frage doppelt, bevor alle der Stufe dran waren; danach beginnt eine neue Runde', () => {
    for (const level of [1, 2, 3] as const) {
      const inLevel = questions.filter((q) => q.level === level).map((q) => q.no)
      if (inLevel.length === 0) continue
      const shown = new Set<number>()
      for (let i = 0; i < inLevel.length; i++) {
        const decoded = decodeSeed(engine.nextSeed(level, shown))
        if (decoded?.kind !== 'question') throw new Error('keine Frage')
        expect(shown.has(decoded.no), `Zug ${i + 1}: Frage ${decoded.no} doppelt`).toBe(false)
        shown.add(decoded.no)
      }
      // so viele Züge wie Fragen: jede genau einmal (bei 20 Fragen 20 verschiedene)
      expect([...shown].sort((a, b) => a - b)).toEqual([...inLevel].sort((a, b) => a - b))
      // Alle waren dran: wieder aus allen Fragen der Stufe
      const again = new Set<number>()
      for (let i = 0; i < 200; i++) {
        const decoded = decodeSeed(engine.nextSeed(level, shown))
        if (decoded?.kind !== 'question') throw new Error('keine Frage')
        again.add(decoded.no)
      }
      expect(again.size).toBe(inLevel.length)
      // Fragen anderer Stufen in der Runde stören nicht
      const others = new Set(questions.filter((q) => q.level !== level).map((q) => q.no))
      expect(engine.resolve({ level, seed: engine.nextSeed(level, others) })).toBe(level)
    }
  })

  it('nennt als Form den Fakt der Frage, in jeder Fassung gleich', () => {
    for (const q of questions) {
      expect(engine.formOf({ level: q.level, seed: q.no })).toBe(`q:${q.fact}`)
      expect(engine.formOf({ level: q.level, seed: questionSeed(q.no, 31) })).toBe(`q:${q.fact}`)
    }
  })

  it('plant jede Frage in jeder Fassung mit vier Antworten, genau eine richtig', () => {
    for (const q of questions) {
      for (const variant of [0, 1, 2, 49]) {
        const task = engine.planGuidedTask({ level: q.level, seed: questionSeed(q.no, variant) })
        const [step] = task.steps
        expect(step.choices, q.id).toHaveLength(4)
        expect(step.choices.filter((c) => c.correct), q.id).toHaveLength(1)
        expect(task.questionId).toBe(q.id)
      }
      // Grundform und Fassung 0 sind dieselbe Aufgabe
      expect(engine.planGuidedTask({ level: q.level, seed: q.no }).steps).toEqual(engine.planGuidedTask({ level: q.level, seed: questionSeed(q.no, 0) }).steps)
    }
  })

  it('hat (noch) keinen freien Modus', () => {
    expect(() => engine.prepareFree({ level: 1, seed: questions[0].no })).toThrow()
  })
})

describe('Chemie-Engine: Sonderfälle', () => {
  it('kennt Themen ohne Fragensammlung nicht', () => {
    expect(chemTopic('chem-gibt-es-nicht')).toBeUndefined()
    expect(() => chemCourseEngine('chem-gibt-es-nicht')).toThrow()
  })

  it('behandelt gelöschte Fragen wie fehlende', () => {
    const [topic] = CHEM_TOPICS
    const [first, ...rest] = topic.bank.questions
    const bank: QuestionBank = { ...topic.bank, questions: rest, retired: [first.no] }
    const engine = topicEngine({ bank, misconceptions: topic.misconceptions }, seeded('gelöscht'))
    expect(engine.resolve({ level: first.level, seed: first.no })).toBeNull()
    for (let i = 0; i < 100; i++) expect(decodeSeed(engine.nextSeed(first.level))).not.toMatchObject({ no: first.no })
    // Auch in einer Runde, in der alle übrigen schon dran waren, kommt die gelöschte Frage nicht wieder
    const seenAllButRetired = new Set(rest.filter((q) => q.level === first.level).map((q) => q.no))
    for (let i = 0; i < 100; i++) expect(decodeSeed(engine.nextSeed(first.level, seenAllButRetired))).not.toMatchObject({ no: first.no })
    // Ist außer der gelöschten nur noch eine Frage offen, kommt genau sie
    const fewSeen = new Set([...seenAllButRetired].slice(0, -1))
    const [last] = [...seenAllButRetired].slice(-1)
    for (let i = 0; i < 20; i++) expect(decodeSeed(engine.nextSeed(first.level, fewSeen))).toMatchObject({ no: last })
  })
})
