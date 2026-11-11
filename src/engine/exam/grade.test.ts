import { describe, expect, it } from 'vitest'
import { rat } from '../rational.ts'
import { gradeExam, numberAnswer } from './grade.ts'
import { gradeMock, MOCK_CLOSE_SHARE } from './mock.ts'
import type { ExamItem, ExamTask } from './types.ts'

// Bewertung (Plan M4, „Bewertung"): unabhängige Fragen zählen jede für sich, final nur für ein Ergebnis, das aus den
// Fragen davor folgt; eingetippte Zahl knapp daneben: beim Üben volle Punkte, in der Probeklausur der Anteil

const explanation = { detailed: 'Weg.', short: 'Weg.' }

// Frage mit den Antworten „r" (richtig) und „f" (falsch)
function choice(id: string, points: number, extra: Partial<ExamItem> = {}): ExamItem {
  return {
    id,
    title: id,
    question: `${id}?`,
    points,
    dependsOn: [],
    cards: [],
    build: () => ({
      options: [
        { id: 'r', content: 'richtig' },
        { id: 'f', content: 'falsch' },
      ],
      expected: 'r',
      correct: 'r',
      explanation,
    }),
    ...extra,
  }
}

// Zahlenfrage mit dem Wert 10 (Toleranz wie in der Chemie)
function numberItem(id: string, points: number, final: boolean): ExamItem {
  return {
    id,
    title: id,
    question: `${id}?`,
    points,
    dependsOn: [],
    cards: [],
    ...(final ? { final: true } : {}),
    build: () => ({
      options: [
        { id: '10', content: '$10$', value: rat(10) },
        { id: '20', content: '$20$', value: rat(20) },
      ],
      expected: '10',
      correct: '10',
      explanation,
      numeric: { value: rat(10), unit: '', wrongs: [] },
    }),
  }
}

const task = (items: ExamItem[], points: number): ExamTask => ({ title: 'T', intro: '', givenLatex: '', note: '', parts: [{ id: 'a', prompt: '', points, items }] })

describe('Bewertung', () => {
  it('Lewis, Paare, Gestalt unabhängig: nur die Gestalt richtig gibt 1 von 3 Punkten, nicht alle', () => {
    const t = task([choice('lewis', 1), choice('paare', 1), choice('gestalt', 1)], 3)
    expect(gradeExam(t, { lewis: 'f', paare: 'f', gestalt: 'r' }).points).toBe(1)
    expect(gradeExam(t, { lewis: 'r', paare: 'f', gestalt: 'r' }).points).toBe(2)
    expect(gradeExam(t, { lewis: 'r', paare: 'r', gestalt: 'r' }).points).toBe(3)
  })

  it('Ergebnis eines Teils (final), das aus den Fragen davor folgt, gibt die vollen Punkte des Teils', () => {
    const t = task([choice('schritt', 1), choice('ergebnis', 1, { final: true })], 3)
    expect(gradeExam(t, { ergebnis: 'r' }).points).toBe(3)
    expect(gradeExam(t, { schritt: 'r', ergebnis: 'f' }).points).toBe(1)
  })

  it('eingetippte Zahl knapp daneben: beim Üben volle Punkte, in der Probeklausur der Anteil, mit Hinweis', () => {
    const t = task([numberItem('zahl', 2, false)], 2)
    const answers = { zahl: numberAnswer('10,25') }
    const practice = gradeExam(t, answers)
    expect(practice.points).toBe(2)
    expect(practice.parts[0].items[0].close).toBe(true)
    const mock = gradeExam(t, answers, { closeShare: MOCK_CLOSE_SHARE })
    expect(mock.points).toBe(2 * MOCK_CLOSE_SHARE)
    expect(mock.parts[0].items[0].status).toBe('teilweise')
    expect(mock.parts[0].items[0].close).toBe(true)
    // genau genug: volle Punkte auch in der Probeklausur
    expect(gradeExam(t, { zahl: numberAnswer('10,05') }, { closeShare: MOCK_CLOSE_SHARE }).points).toBe(2)
  })

  it('Ergebnis eines Teils knapp daneben: in der Probeklausur der Anteil der Punkte des Teils', () => {
    const t = task([choice('schritt', 1), numberItem('ergebnis', 2, true)], 4)
    const answers = { ergebnis: numberAnswer('10,25') }
    expect(gradeExam(t, answers).points).toBe(4)
    expect(gradeExam(t, answers, { closeShare: MOCK_CLOSE_SHARE }).points).toBe(4 * MOCK_CLOSE_SHARE)
  })

  it('die Probeklausur bewertet mit dem Anteil für knapp daneben', () => {
    const t = task([numberItem('zahl', 2, false)], 2)
    const result = gradeMock({ id: 1, minutes: 45, tasks: [{ no: 1, seed: 1, task: t }] }, { '1': { zahl: numberAnswer('10,25') } })
    expect(result.points).toBe(2 * MOCK_CLOSE_SHARE)
  })
})
