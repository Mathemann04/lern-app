import { describe, expect, it } from 'vitest'
import { MATCH_INSTRUCTION, MATCH_SHOWN, MULTI_CORRECT, MULTI_INSTRUCTION, MULTI_SHOWN, QUIZ_INSTRUCTION, SHOWN_WRONG, planQuestion } from './plan.ts'
import type { MatchQuestion, Misconception, MultiChoice, Question } from './types.ts'

// Eigene kleine Frage für die Tests, unabhängig von den Sammlungen
const why = (text: string) => ({ detailed: `${text} (ausführlich)`, short: text })
const MISCONCEPTIONS: readonly Misconception[] = [
  { id: 'chem-mis-a', name: 'Fehler A', wrongText: 'A stimmt.', why: why('Warum A falsch ist') },
  { id: 'chem-mis-b', name: 'Fehler B', wrongText: 'B stimmt.', why: why('Warum B falsch ist') },
  { id: 'chem-mis-c', name: 'Fehler C', wrongText: 'C stimmt.', why: why('Warum C falsch ist') },
]
const QUESTION: Question = {
  kind: 'single',
  id: 'test-frage',
  no: 7,
  level: 2,
  fact: 'test',
  part: 'teil',
  title: 'Test',
  prompt: 'Welche Antwort stimmt?',
  correct: { id: 'r', text: 'Die richtige.' },
  wrong: [
    { id: 'f1', text: 'Falsch eins.', misconception: 'chem-mis-a' },
    { id: 'f2', text: 'Falsch zwei.', misconception: 'chem-mis-a', why: why('Eigener Text zu zwei') },
    { id: 'f3', text: 'Falsch drei.', misconception: 'chem-mis-b' },
    { id: 'f4', text: 'Falsch vier.', misconception: 'chem-mis-b' },
    { id: 'f5', text: 'Falsch fünf.', misconception: 'chem-mis-c' },
  ],
  hint: 'Ein Tipp.',
  explanation: why('Darum'),
  cards: ['karte-1', 'karte-2'],
}
const REF = { level: 2, seed: 500_357 } as const
const plan = (variant: number, focus?: string) => planQuestion(QUESTION, MISCONCEPTIONS, REF, variant, focus)
const VARIANTS = Array.from({ length: 50 }, (_, i) => i)

describe('Wissensfrage als geführte Aufgabe', () => {
  it('zeigt einen Schritt mit vier Antworten, genau eine richtig', () => {
    for (const variant of VARIANTS) {
      const task = plan(variant)
      expect(task.steps).toHaveLength(1)
      const [step] = task.steps
      expect(step.choices).toHaveLength(SHOWN_WRONG + 1)
      expect(step.choices.filter((c) => c.correct)).toEqual([{ id: 'r', content: 'Die richtige.', correct: true }])
      expect(new Set(step.choices.map((c) => c.id)).size).toBe(4)
    }
  })

  it('übernimmt Frage, Tipp, Erklärung, Karten und die richtige Antwort als Ergebnis', () => {
    const task = plan(3)
    const [step] = task.steps
    expect(task).toMatchObject({ ref: REF, instruction: QUIZ_INSTRUCTION, cards: QUESTION.cards, resultText: 'Die richtige.', resultQuestion: 'Welche Antwort stimmt?', questionId: 'test-frage' })
    expect(task.functionLatex).toBeUndefined()
    expect(task.resultLatex).toBeUndefined()
    expect(step).toMatchObject({ title: 'Test', question: 'Welche Antwort stimmt?', hint: 'Ein Tipp.', explanation: QUESTION.explanation, cards: QUESTION.cards })
  })

  it('gibt jeder falschen Antwort ihren Denkfehler und „Warum ist das falsch?"', () => {
    for (const variant of VARIANTS) {
      for (const choice of plan(variant).steps[0].choices.filter((c) => !c.correct)) {
        const option = QUESTION.wrong.find((o) => o.id === choice.id)!
        expect(choice.content).toBe(option.text)
        expect(choice.errorRuleId).toBe(option.misconception)
        // eigener Text der Antwort vor dem Text des Denkfehlers
        expect(choice.whyWrong).toEqual(option.why ?? MISCONCEPTIONS.find((m) => m.id === option.misconception)!.why)
      }
    }
  })

  it('zeigt bei gleicher Fassung immer dieselbe Aufgabe', () => {
    for (const variant of VARIANTS) expect(plan(variant)).toEqual(plan(variant))
  })

  it('wechselt mit der Fassung Auswahl und Reihenfolge der Antworten', () => {
    const orders = new Set(VARIANTS.map((v) => plan(v).steps[0].choices.map((c) => c.id).join(',')))
    const selections = new Set(VARIANTS.map((v) => plan(v).steps[0].choices.map((c) => c.id).sort().join(',')))
    expect(orders.size).toBeGreaterThan(20)
    // fünf falsche im Vorrat, drei gezeigt: zehn mögliche Auswahlen
    expect(selections.size).toBeGreaterThan(5)
    // die richtige Antwort steht nicht immer an derselben Stelle
    expect(new Set(VARIANTS.map((v) => plan(v).steps[0].choices.findIndex((c) => c.correct))).size).toBe(4)
  })

  it('nimmt beim gezielten Üben die Antwort des Denkfehlers sicher mit', () => {
    for (const variant of VARIANTS) {
      const ids = plan(variant, 'chem-mis-c').steps[0].choices.map((c) => c.id)
      expect(ids).toContain('f5')
      expect(ids).toHaveLength(4)
    }
    // ein Denkfehler, den die Frage nicht hat, ändert nichts
    expect(plan(4, 'chem-mis-gibt-es-nicht')).toEqual(plan(4))
  })

  it('meldet einen unbekannten Denkfehler', () => {
    const broken: Question = { ...QUESTION, wrong: QUESTION.wrong.map((o) => ({ ...o, misconception: 'chem-mis-unbekannt', why: undefined })) }
    expect(() => planQuestion(broken, MISCONCEPTIONS, REF, 0)).toThrow(/unbekannt/)
  })
})

// „Wähle alle richtigen“ (N1): kleinster erlaubter Vorrat (zwei richtige, drei falsche) und ein großer
const MULTI: MultiChoice = {
  ...QUESTION,
  kind: 'multi',
  id: 'test-mehrfach',
  prompt: 'Welche Aussagen stimmen?',
  correct: [
    { id: 'r1', text: 'Richtig eins.' },
    { id: 'r2', text: 'Richtig zwei.' },
    { id: 'r3', text: 'Richtig drei.' },
    { id: 'r4', text: 'Richtig vier.' },
    { id: 'r5', text: 'Richtig fünf.' },
  ],
}
const SMALL: MultiChoice = { ...MULTI, id: 'test-klein', correct: MULTI.correct.slice(0, 2), wrong: QUESTION.wrong.slice(0, 3) }
const planMulti = (q: MultiChoice, variant: number, focus?: string) => planQuestion(q, MISCONCEPTIONS, REF, variant, focus)
const MANY = Array.from({ length: 400 }, (_, i) => i)

describe('„Wähle alle richtigen" als geführte Aufgabe', () => {
  it.each([
    ['großer Vorrat', MULTI],
    ['kleinster Vorrat', SMALL],
  ] as const)('%s: vier bis sechs Aussagen, eine bis vier richtig, mindestens eine falsch, keine doppelt', (_, q) => {
    for (const variant of MANY) {
      const [step] = planMulti(q, variant).steps
      expect(step.multi).toBe(true)
      const right = step.choices.filter((c) => c.correct).length
      expect(step.choices.length).toBeGreaterThanOrEqual(MULTI_SHOWN.min)
      expect(step.choices.length).toBeLessThanOrEqual(MULTI_SHOWN.max)
      expect(right).toBeGreaterThanOrEqual(MULTI_CORRECT.min)
      expect(right).toBeLessThanOrEqual(MULTI_CORRECT.max)
      expect(step.choices.length - right).toBeGreaterThanOrEqual(1)
      expect(new Set(step.choices.map((c) => c.id)).size).toBe(step.choices.length)
    }
  })

  it('wechselt Zahl der Aussagen, Zahl der richtigen und Auswahl', () => {
    const steps = MANY.map((v) => planMulti(MULTI, v).steps[0])
    expect(new Set(steps.map((s) => s.choices.length))).toEqual(new Set([4, 5, 6]))
    expect(new Set(steps.map((s) => s.choices.filter((c) => c.correct).length))).toEqual(new Set([1, 2, 3, 4]))
    expect(new Set(steps.map((s) => s.choices.map((c) => c.id).sort().join(','))).size).toBeGreaterThan(100)
  })

  it('gibt jeder falschen Aussage ihren Denkfehler und nennt im Ergebnis genau die richtigen der Fassung', () => {
    for (const variant of VARIANTS) {
      const task = planMulti(MULTI, variant)
      const [step] = task.steps
      expect(task.instruction).toBe(MULTI_INSTRUCTION)
      for (const c of step.choices.filter((x) => !x.correct)) expect(c.whyWrong).toBeDefined()
      expect(task.resultText).toBe(step.choices.filter((c) => c.correct).map((c) => c.content).join('\n'))
      expect(planMulti(MULTI, variant)).toEqual(task)
    }
  })

  it('nimmt beim gezielten Üben die Aussage des Denkfehlers sicher mit', () => {
    for (const variant of MANY) expect(planMulti(SMALL, variant, 'chem-mis-b').steps[0].choices.some((c) => c.errorRuleId === 'chem-mis-b')).toBe(true)
  })

  it('lässt die Einfachauswahl ohne Merkmal multi', () => {
    expect(plan(0).steps[0].multi).toBeUndefined()
  })
})

// Zuordnen (N1b): sieben Paare, zwei Ziele kommen doppelt vor, drei Verwechslungen
const MATCH: MatchQuestion = {
  ...QUESTION,
  kind: 'match',
  id: 'test-zuordnen',
  prompt: 'Was gehört zusammen?',
  pairs: [
    { id: 'a', left: 'A', right: 'eins' },
    { id: 'b', left: 'B', right: 'eins' },
    { id: 'c', left: 'C', right: 'zwei' },
    { id: 'd', left: 'D', right: 'zwei' },
    { id: 'e', left: 'E', right: 'drei' },
    { id: 'f', left: 'F', right: 'vier' },
    { id: 'g', left: 'G', right: 'fünf' },
  ],
  traps: [
    { pair: 'a', right: 'zwei', misconception: 'chem-mis-a' },
    { pair: 'e', right: 'fünf', misconception: 'chem-mis-b', why: why('Eigener Text zu E') },
    { pair: 'g', right: 'drei', misconception: 'chem-mis-c' },
  ],
}
const planMatch = (variant: number, focus?: string) => planQuestion(MATCH, MISCONCEPTIONS, REF, variant, focus)

describe('Zuordnen als geführte Aufgabe', () => {
  it('zeigt vier bis sechs Zeilen, mindestens zwei Ziele, jede Antwort unter den Zielen, Ziele ohne Doppel', () => {
    for (const variant of MANY) {
      const task = planMatch(variant)
      const [step] = task.steps
      const match = step.match!
      expect(task.instruction).toBe(MATCH_INSTRUCTION)
      expect(step.choices).toEqual([])
      expect(match.rows.length).toBeGreaterThanOrEqual(MATCH_SHOWN.min)
      expect(match.rows.length).toBeLessThanOrEqual(MATCH_SHOWN.max)
      expect(match.targets.length).toBeGreaterThanOrEqual(2)
      expect(new Set(match.targets.map((t) => t.content)).size).toBe(match.targets.length)
      for (const row of match.rows) {
        const pair = MATCH.pairs.find((p) => p.id === row.id)!
        expect(row.content).toBe(pair.left)
        expect(match.targets.find((t) => t.id === row.answer)?.content).toBe(pair.right)
        // Verwechslungen nur, wenn ihr Ziel dasteht, und nie die richtige Zuordnung
        for (const trap of row.traps) {
          expect(match.targets.map((t) => t.id)).toContain(trap.target)
          expect(trap.target).not.toBe(row.answer)
        }
      }
      // genau die Ziele der gezeigten Zeilen
      expect(new Set(match.targets.map((t) => t.id))).toEqual(new Set(match.rows.map((r) => r.answer)))
      expect(planMatch(variant)).toEqual(task)
    }
  })

  it('wechselt Auswahl und Reihenfolge der Paare und nennt im Ergebnis jedes Paar', () => {
    const tasks = MANY.map((v) => planMatch(v))
    expect(new Set(tasks.map((t) => t.steps[0].match!.rows.map((r) => r.id).join(','))).size).toBeGreaterThan(100)
    expect(new Set(tasks.map((t) => t.steps[0].match!.rows.length))).toEqual(new Set([4, 5, 6]))
    const task = planMatch(3)
    const { rows, targets } = task.steps[0].match!
    expect(task.resultText).toBe(rows.map((r) => `${r.content}: ${targets.find((t) => t.id === r.answer)!.content}`).join('\n'))
  })

  it('gibt Verwechslungen ihren Denkfehler und den eigenen Text vor dem des Denkfehlers', () => {
    const traps = MANY.flatMap((v) => planMatch(v).steps[0].match!.rows.flatMap((r) => r.traps.map((t) => ({ row: r.id, ...t }))))
    expect(new Set(traps.map((t) => t.errorRuleId))).toEqual(new Set(['chem-mis-a', 'chem-mis-b', 'chem-mis-c']))
    for (const t of traps) {
      if (t.row === 'e') expect(t.whyWrong).toEqual(why('Eigener Text zu E'))
      else expect(t.whyWrong).toEqual(MISCONCEPTIONS.find((m) => m.id === t.errorRuleId)!.why)
    }
  })

  it('zeigt beim gezielten Üben sicher die Zeile mit der Verwechslung und ihr falsches Ziel', () => {
    for (const variant of MANY) {
      for (const focus of ['chem-mis-a', 'chem-mis-b', 'chem-mis-c']) {
        const rows = planMatch(variant, focus).steps[0].match!.rows
        expect(rows.some((r) => r.traps.some((t) => t.errorRuleId === focus)), `${variant} ${focus}`).toBe(true)
      }
    }
  })
})
