import { describe, expect, it } from 'vitest'
import { judgeNumber } from '../../quantity/judge.ts'
import { readNumber } from '../../quantity/numberDe.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import type { Rational } from '../../rational.ts'
import type { Level } from '../../tasks/taskNumber.ts'
import { chemCourseEngine } from '../engine.ts'
import { generatedCalc, generatorOf, generatorsOf } from './index.ts'

// Freier Modus (S8b, Plan M4 Teil B „Tests"): Rechnungen mit Zahlen zum Eintippen. Je Thema und Stufe viele
// Aufgaben: Rechenarten mit free haben in jeder Aufgabe einen Schritt mit numeric, die anderen keinen; die
// gerundete Lösung (wie sie als Antwort dasteht) wird angenommen, jede falsche Antwort abgelehnt und als ihr
// typischer Fehler erkannt.

const COURSES = ['chem-atombau', 'chem-stoffmenge', 'chem-gleichungen', 'chem-loesungen', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-elektronen', 'chem-pse', 'chem-trends', 'chem-mwg', 'chem-energie']
const LEVELS: readonly Level[] = [1, 2, 3]
const SAMPLES = 500

// Zahl aus einer Antwort wie „$3{,}98 \cdot 10^{-19}\,\mathrm{J}$" oder „$-430\,\mathrm{kJ/mol}$"; null bei Text
function numberOf(content: string): Rational | null {
  const m = /^\$([^$]*)\$$/.exec(content.trim())
  if (!m) return null
  const text = m[1]
    .split('\\,')[0]
    .replace(/\{,\}/g, ',')
    .replace(/\\cdot\s*10\^\{(-?\d+)\}/, 'e$1')
    .replace(/\s+/g, '')
  return readNumber(text)
}

describe('Freier Modus der Chemie-Rechnungen', () => {
  for (const course of COURSES) {
    for (const level of LEVELS) {
      if (generatorsOf(course, level).length === 0) continue
      it(`${course}, Stufe ${level}: Zahlen zum Eintippen nur in Rechenarten mit free, Lösung angenommen, Fehler erkannt`, () => {
        for (let i = 0; i < SAMPLES; i++) {
          const ref = { level, seed: GENERATED_MIN + 7919 * i }
          const generator = generatorOf(course, ref)!
          const task = generatedCalc(course, ref)!.task
          const numericSteps = task.steps.filter((s) => s.numeric)
          expect(numericSteps.length > 0, `${course} ${level}-${ref.seed} ${generator.kind}`).toBe(generator.free === true)
          for (const step of numericSteps) {
            const answer = step.numeric!
            const where = `${course} ${level}-${ref.seed} ${step.id}`
            const correct = step.choices.find((c) => c.correct)!
            const shown = numberOf(correct.content)
            // Antworten als Text (z. B. Ladung „2+") haben keine Zahl; dort zählt der genaue Wert
            if (shown) expect(judgeNumber(shown, answer).kind, `${where}: Lösung ${correct.content}`).toBe('correct')
            expect(judgeNumber(answer.value, answer).kind, where).toBe('correct')
            for (const wrong of step.choices.filter((c) => !c.correct)) {
              const value = numberOf(wrong.content)
              if (!value) continue
              expect(judgeNumber(value, answer), `${where}: ${wrong.content}`).toEqual({ kind: 'error', rule: wrong.errorRuleId })
            }
            for (const w of answer.wrongs) {
              expect(judgeNumber(w.value, answer).kind, `${where}: ${w.rule}`).not.toBe('correct')
              expect(w.why?.detailed, `${where}: ${w.rule}`).toBeTruthy()
            }
          }
        }
      })
    }
  }

  it('zieht im freien Modus nur Rechnungen mit Zahlen, auch bei angekreuzten Unterthemen ohne solche', () => {
    let seq = 0
    const engine = chemCourseEngine('chem-energie', () => ((seq = (seq * 9301 + 49297) % 233280) / 233280))
    for (let i = 0; i < 100; i++) {
      for (const level of LEVELS) {
        const seed = engine.nextSeed(level, undefined, undefined, true)
        expect(generatorOf('chem-energie', { level, seed })?.free, `${level}-${seed}`).toBe(true)
      }
      // „Hauptsätze und Entropie" hat keine Rechnung mit Zahlen: dann die der ganzen Stufe
      const seed = engine.nextSeed(2, undefined, new Set(['entropie']), true)
      expect(generatorOf('chem-energie', { level: 2, seed })?.free).toBe(true)
    }
    const molecules = chemCourseEngine('chem-molekuele')
    expect(LEVELS.map((l) => molecules.hasFree(l))).toEqual([false, false, false])
    expect(LEVELS.map((l) => chemCourseEngine('chem-mwg').hasFree(l))).toEqual([false, true, true])
  })
})
