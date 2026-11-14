import { describe, expect, it } from 'vitest'
import { GUESS_LOWER, GUESS_MARGIN, lengthStat, visibleLength } from '../quiz/answerLength.ts'
import { GENERATED_MIN, VARIANTS, questionSeed } from '../quiz/numbers.ts'
import { planQuestion } from '../quiz/plan.ts'
import { CHEM_TOPICS } from './banks.ts'
import { generatedCalc, generatorsOf } from './generators/index.ts'

// Ratefallen (S12): Je Thema und Stufe darf die richtige Antwort nicht viel öfter die längste (oder die kürzeste) sein
// als bei Zufall, sonst kommt man durch Raten weit. Gemessen an allen Fassungen der Fragen mit einer richtigen Antwort und
// an 300 erzeugten Rechnungen je Stufe (jeder Schritt mit Antworten zum Auswählen); Auswahlen, deren längste Antwort
// kürzer als 30 Zeichen ist, zählen nicht. Erlaubt: Wert bei Zufall minus 15 bis plus 10 Prozentpunkte. Gilt für alle neuen Fragen mit.

type Choices = readonly { readonly content: string; readonly correct: boolean }[]
// Gruppen mit weniger Auswahlen sagen nichts (wenige lange Antworten wiegen sonst zu schwer)
const MIN_COUNT = 20

function bankChoices(course: string, level: 1 | 2 | 3): Choices[] {
  const topic = CHEM_TOPICS.find((t) => t.bank.course === course)!
  const out: Choices[] = []
  for (const q of topic.bank.questions) {
    if (q.kind !== 'single' || q.level !== level || topic.bank.retired.includes(q.no)) continue
    for (let v = 0; v < VARIANTS; v++) out.push(planQuestion(q, topic.misconceptions, { level, seed: questionSeed(q.no, v) }, v).steps[0].choices)
  }
  return out
}

function calcChoices(course: string, level: 1 | 2 | 3): Choices[] {
  if (generatorsOf(course, level).length === 0) return []
  const out: Choices[] = []
  for (let s = 0; s < 300; s++) {
    const calc = generatedCalc(course, { level, seed: GENERATED_MIN + s * 977 })
    if (calc) for (const step of calc.task.steps) out.push(step.choices)
  }
  return out
}

const percent = (x: number) => `${Math.round(x * 100)} %`

describe('Ratefallen: Länge der richtigen Antwort', () => {
  it('zählt Formeln nach ihrem Inhalt', () => {
    expect(visibleLength('Wasser')).toBe(6)
    expect(visibleLength('$\\ce{H2O}$')).toBe(3)
    expect(visibleLength('$\\frac{1}{2}$ mol')).toBe(6)
    expect(visibleLength('Bei $\\Delta H < 0$ exotherm')).toBe(4 + 4 + 9)
  })

  const cells = CHEM_TOPICS.flatMap((t) => ([1, 2, 3] as const).flatMap((level) => [
    [t.bank.course, level, 'Fragen'] as const,
    [t.bank.course, level, 'Rechnungen'] as const,
  ]))
  it.each(cells)('%s, Stufe %i, %s: richtige Antwort nicht zu oft die längste oder kürzeste', (course, level, kind) => {
    const stat = lengthStat(kind === 'Fragen' ? bankChoices(course, level) : calcChoices(course, level))
    if (stat.count < MIN_COUNT) return
    const limit = stat.chance + GUESS_MARGIN
    expect(stat.longest, `längste: ${percent(stat.longest)} bei ${stat.count} Auswahlen, erlaubt ${percent(limit)}`).toBeLessThanOrEqual(limit)
    expect(stat.shortest, `kürzeste: ${percent(stat.shortest)} bei ${stat.count} Auswahlen, erlaubt ${percent(limit)}`).toBeLessThanOrEqual(limit)
    // auch nicht fast nie: sonst streicht man längste und kürzeste und rät aus der Mitte (nur bei Fragen; die Texte der
    // Rechnungen kommen aus wenigen festen Bausteinen, dort zählt nur die Obergrenze)
    if (kind === 'Rechnungen') return
    const lower = stat.chance - GUESS_LOWER
    expect(stat.longest, `längste: ${percent(stat.longest)} bei ${stat.count} Auswahlen, mindestens ${percent(lower)}`).toBeGreaterThanOrEqual(lower)
    expect(stat.shortest, `kürzeste: ${percent(stat.shortest)} bei ${stat.count} Auswahlen, mindestens ${percent(lower)}`).toBeGreaterThanOrEqual(lower)
  })
})
