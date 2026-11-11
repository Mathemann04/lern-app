import { describe, expect, it } from 'vitest'
import { MULTI_CORRECT, MULTI_INSTRUCTION, MULTI_SHOWN, QUIZ_INSTRUCTION, SHOWN_WRONG, planQuestion } from './plan.ts'
import type { Misconception, MultiChoice, Question } from './types.ts'

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
