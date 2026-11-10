import { describe, expect, it } from 'vitest'
import { QUIZ_INSTRUCTION, SHOWN_WRONG, planQuestion } from './plan.ts'
import type { Misconception, Question } from './types.ts'

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
    expect(task).toMatchObject({ ref: REF, instruction: QUIZ_INSTRUCTION, cards: QUESTION.cards, resultText: 'Die richtige.', questionId: 'test-frage' })
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
