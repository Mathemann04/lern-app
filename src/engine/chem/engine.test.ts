import { describe, expect, it } from 'vitest'
import { createRng } from '../random/rng.ts'
import { VARIANTS, decodeSeed, questionSeed } from '../quiz/numbers.ts'
import type { QuestionBank } from '../quiz/types.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { courseById } from '../../ui/catalog.ts'
import { CHEM_TOPICS, chemTopic } from './banks.ts'
import { type ChemCourseEngine, chemCourseEngine, topicEngine } from './engine.ts'

const seeded = (seed: string) => {
  const rng = createRng(seed)
  return () => rng.next()
}

// nächste Frage, die nextSeed liefert (erzeugte Rechnungen dazwischen übersprungen)
function nextQuestionNo(engine: ChemCourseEngine, level: 1 | 2 | 3, shown?: ReadonlySet<number>, parts?: ReadonlySet<string>): number {
  for (let i = 0; i < 1000; i++) {
    const decoded = decodeSeed(engine.nextSeed(level, shown, parts))
    if (decoded?.kind === 'question') return decoded.no
    if (decoded?.kind !== 'generated') throw new Error('weder Frage noch Rechnung')
  }
  throw new Error('keine Frage')
}

// Nummern der Fragen, die nextSeed in so vielen Zügen von Fragen liefert
function drawNos(engine: ChemCourseEngine, level: 1 | 2 | 3, draws: number, shown?: ReadonlySet<number>, parts?: ReadonlySet<string>): Set<number> {
  const nos = new Set<number>()
  for (let i = 0; i < draws; i++) nos.add(nextQuestionNo(engine, level, shown, parts))
  return nos
}

const sorted = (nos: Iterable<number>) => [...nos].sort((a, b) => a - b)

const WITH_QUESTIONS = CHEM_TOPICS.filter((t) => t.bank.questions.length > 0)

describe.each(WITH_QUESTIONS.map((t) => [t.bank.course, t] as const))('Chemie-Engine: %s', (course, topic) => {
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
    // erzeugte Rechnungen gibt es nur in Stufen mit Rechnungen
    expect(engine.resolve({ level: 4, seed: 12_345 })).toBeNull()
    expect(() => engine.planGuidedTask({ level: 1, seed: unused })).toThrow()
  })

  it('zieht neue Nummern aus Fragen der gewählten Stufe, mit wechselnder Fassung, und aus Rechnungen', () => {
    for (const level of [1, 2, 3] as const) {
      const inLevel = questions.filter((q) => q.level === level)
      if (inLevel.length === 0) continue
      const drawn = new Set<number>()
      const variants = new Set<number>()
      for (let i = 0; i < 600; i++) {
        const seed = engine.nextSeed(level)
        expect(engine.resolve({ level, seed })).toBe(level)
        const decoded = decodeSeed(seed)
        if (decoded?.kind === 'generated') continue
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
        const no = nextQuestionNo(engine, level, shown)
        expect(shown.has(no), `Zug ${i + 1}: Frage ${no} doppelt`).toBe(false)
        shown.add(no)
      }
      // so viele Züge wie Fragen: jede genau einmal (bei 20 Fragen 20 verschiedene)
      expect([...shown].sort((a, b) => a - b)).toEqual([...inLevel].sort((a, b) => a - b))
      // Alle waren dran: wieder aus allen Fragen der Stufe
      const again = new Set<number>()
      for (let i = 0; i < 200; i++) again.add(nextQuestionNo(engine, level, shown))
      expect(again.size).toBe(inLevel.length)
      // Fragen anderer Stufen in der Runde stören nicht
      const others = new Set(questions.filter((q) => q.level !== level).map((q) => q.no))
      expect(engine.resolve({ level, seed: engine.nextSeed(level, others) })).toBe(level)
    }
  })

  describe('Unterthemen (S1b)', () => {
    const parts = courseById(course)?.course.parts ?? []
    const nosOf = (level: number, ids: readonly string[]) => questions.filter((q) => q.level === level && ids.includes(q.part)).map((q) => q.no)
    const allOf = (level: number) => questions.filter((q) => q.level === level).map((q) => q.no)

    it('zieht nur Fragen der angekreuzten Unterthemen, einzeln und zu zweit', () => {
      for (const level of [1, 2, 3] as const) {
        const inLevel = parts.filter((p) => p.levels.includes(level) && nosOf(level, [p.id]).length > 0).map((p) => p.id)
        for (const id of inLevel) {
          const drawn = drawNos(engine, level, 300, undefined, new Set([id]))
          expect(sorted(drawn), `Stufe ${level}, ${id}`).toEqual(sorted(nosOf(level, [id])))
        }
        if (inLevel.length < 2) continue
        const pair = inLevel.slice(0, 2)
        // eines davon darf es in der Stufe nicht geben: zählt nicht
        const withMissing = new Set([...pair, ...parts.filter((p) => !p.levels.includes(level)).map((p) => p.id)])
        expect(sorted(drawNos(engine, level, 400, undefined, withMissing)), `Stufe ${level}, ${pair.join(' + ')}`).toEqual(sorted(nosOf(level, pair)))
      }
    })

    it('fällt auf alle Fragen der Stufe zurück, wenn es zur Auswahl dort keine gibt', () => {
      for (const level of [1, 2, 3] as const) {
        const missing = parts.filter((p) => !p.levels.includes(level)).map((p) => p.id)
        for (const selection of [new Set<string>(), new Set(['gibt-es-nicht']), ...(missing.length > 0 ? [new Set(missing)] : [])]) {
          expect(sorted(drawNos(engine, level, 400, undefined, selection)), `Stufe ${level}, ${[...selection].join(' + ')}`).toEqual(sorted(allOf(level)))
          expect(sorted(engine.questionNos(level, selection))).toEqual(sorted(allOf(level)))
        }
      }
    })

    it('zieht innerhalb der Auswahl zuerst Fragen, die in der Runde noch nicht dran waren', () => {
      for (const level of [1, 2, 3] as const) {
        for (const part of parts.filter((p) => p.levels.includes(level) && nosOf(level, [p.id]).length > 0)) {
          const selection = new Set([part.id])
          const chosen = nosOf(level, [part.id])
          // Fragen anderer Unterthemen in der Runde stören nicht; von der Auswahl ist eine offen
          const shown = new Set([...allOf(level).filter((no) => !chosen.includes(no)), ...chosen.slice(1)])
          expect(sorted(drawNos(engine, level, 20, shown, selection)), `Stufe ${level}, ${part.id}`).toEqual([chosen[0]])
          // alle der Auswahl dran: wieder alle der Auswahl, keine anderen
          const done = new Set([...shown, chosen[0]])
          expect(sorted(drawNos(engine, level, 300, done, selection)), `Stufe ${level}, ${part.id}`).toEqual(sorted(chosen))
        }
      }
    })

    it('nennt mit questionNos genau die Fragen, unter denen gezogen wird', () => {
      for (const level of [1, 2, 3] as const) {
        expect(engine.questionNos(level)).toEqual(allOf(level))
        const withQuestions = parts.filter((p) => nosOf(level, [p.id]).length > 0)
        const selections = [undefined, ...withQuestions.map((p) => new Set([p.id])), new Set(withQuestions.slice(1, 3).map((p) => p.id))]
        for (const selection of selections) {
          const nos = engine.questionNos(level, selection)
          expect(sorted(drawNos(engine, level, 400, undefined, selection)), `Stufe ${level}`).toEqual(sorted(nos))
          for (const no of nos) expect(engine.resolve({ level, seed: no })).toBe(level)
        }
      }
    })
  })

  it('zieht bei einer Auswahl nur mit Rechnungen (z. B. Umsatz) nur Rechnungen und nennt keine Fragen', () => {
    for (const level of [1, 2, 3] as const) {
      for (const part of (courseById(course)?.course.parts ?? []).filter((p) => p.levels.includes(level))) {
        if (questions.some((q) => q.level === level && q.part === part.id)) continue
        const selection = new Set([part.id])
        expect(engine.questionNos(level, selection), part.id).toEqual([])
        for (let i = 0; i < 20; i++) expect(decodeSeed(engine.nextSeed(level, undefined, selection))?.kind, part.id).toBe('generated')
      }
    }
  })

  it('nennt als Form den Fakt der Frage, in jeder Fassung gleich', () => {
    for (const q of questions) {
      expect(engine.formOf({ level: q.level, seed: q.no })).toBe(`q:${q.fact}`)
      expect(engine.formOf({ level: q.level, seed: questionSeed(q.no, 31) })).toBe(`q:${q.fact}`)
    }
  })

  it('plant jede Frage in jeder Fassung mit vier Antworten, genau eine richtig („Wähle alle richtigen“: vier bis sechs, mindestens eine falsch; Zuordnen: vier bis sechs Zeilen)', () => {
    for (const q of questions) {
      for (const variant of [0, 1, 2, 49]) {
        const task = engine.planGuidedTask({ level: q.level, seed: questionSeed(q.no, variant) })
        const [step] = task.steps
        const right = step.choices.filter((c) => c.correct).length
        if (q.kind === 'match') {
          expect(step.match?.rows.length, q.id).toBeGreaterThanOrEqual(4)
          expect(step.match?.rows.length, q.id).toBeLessThanOrEqual(6)
          expect(new Set(step.match?.rows.map((r) => r.answer)).size, q.id).toBeGreaterThanOrEqual(2)
        } else if (q.kind === 'multi') {
          expect(step.multi, q.id).toBe(true)
          expect(step.choices.length, q.id).toBeGreaterThanOrEqual(4)
          expect(step.choices.length, q.id).toBeLessThanOrEqual(6)
          expect(right, q.id).toBeGreaterThanOrEqual(1)
          expect(right, q.id).toBeLessThan(step.choices.length)
        } else {
          expect(step.choices, q.id).toHaveLength(4)
          expect(right, q.id).toBe(1)
        }
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
  it('nennt für eine Stufe ohne Fragen keine Nummern (und stürzt nicht ab)', () => {
    const [topic] = CHEM_TOPICS
    const bank: QuestionBank = { ...topic.bank, questions: topic.bank.questions.filter((q) => q.level === 1) }
    const engine = topicEngine({ bank, misconceptions: topic.misconceptions }, seeded('leer'))
    expect(engine.questionNos(2)).toEqual([])
    expect(engine.questionNos(2, new Set(['stoffe']))).toEqual([])
    // dort kommen nur Rechnungen; in einer Stufe ohne beides gibt es nichts zu ziehen
    for (let i = 0; i < 20; i++) expect(decodeSeed(engine.nextSeed(2))?.kind).toBe('generated')
    expect(() => engine.nextSeed(4)).toThrow()
  })

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
    for (let i = 0; i < 100; i++) expect(nextQuestionNo(engine, first.level as 1)).not.toBe(first.no)
    // Auch in einer Runde, in der alle übrigen schon dran waren, kommt die gelöschte Frage nicht wieder
    const seenAllButRetired = new Set(rest.filter((q) => q.level === first.level).map((q) => q.no))
    for (let i = 0; i < 100; i++) expect(nextQuestionNo(engine, first.level as 1, seenAllButRetired)).not.toBe(first.no)
    // Ist außer der gelöschten nur noch eine Frage offen, kommt genau sie
    const fewSeen = new Set([...seenAllButRetired].slice(0, -1))
    const [last] = [...seenAllButRetired].slice(-1)
    for (let i = 0; i < 20; i++) expect(nextQuestionNo(engine, first.level as 1, fewSeen)).toBe(last)
    // auch nicht über ihr Unterthema
    expect(engine.questionNos(first.level, new Set([first.part]))).not.toContain(first.no)
    expect(engine.questionNos(first.level)).not.toContain(first.no)
  })
})

describe.each(CHEM_TOPICS.filter((t) => t.bank.questions.length === 0).map((t) => [t.bank.course] as const))('Chemie-Engine ohne Fragen: %s', (course) => {
  const engine = chemCourseEngine(course, seeded(course))

  it('zieht nur Rechnungen, auch mit angekreuzten Unterthemen, und nennt keine Fragen', () => {
    const parts = courseById(course)?.course.parts ?? []
    for (const level of [1, 2, 3] as const) {
      expect(engine.questionNos(level)).toEqual([])
      for (const selection of [undefined, ...parts.map((p) => new Set([p.id])), new Set(['gibt-es-nicht'])]) {
        for (let i = 0; i < 30; i++) {
          const seed = engine.nextSeed(level, undefined, selection)
          expect(decodeSeed(seed)?.kind).toBe('generated')
          expect(engine.resolve({ level, seed })).toBe(level)
          expect(engine.planGuidedTask({ level, seed }).steps.length).toBeGreaterThan(0)
        }
      }
    }
    expect(engine.resolve({ level: 1, seed: 101 })).toBeNull()
  })
})
