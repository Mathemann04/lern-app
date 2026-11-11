import { describe, expect, it } from 'vitest'
import { type ExamAnswers, type ExamOption } from '../../exam/types.ts'
import { examState, gradeExam, numberAnswer, truthOf } from '../../exam/grade.ts'
import { formatText, readNumber } from '../../quantity/numberDe.ts'
import { type Rational, parseDecimal, ratDiv, ratMul } from '../../rational.ts'
import { chemExamTask } from './index.ts'

// Klausuraufgaben frei (S8c): Zahlen eintippen statt auswählen. Die angezeigte Zahl einer Antwort eingetippt ergibt
// dieselbe Bewertung wie die Auswahl; knapp daneben („fast") volle Punkte mit Hinweis; eigene falsche Zahlen
// rechnen in späteren Fragen weiter (Folgefehler).

// Zahl aus einer Antwort wie „$3{,}98 \cdot 10^{-19}\,\mathrm{J}$"; null bei Text
function numberOf(content: string): Rational | null {
  const m = /^\$([^$]*)\$$/.exec(content.trim())
  if (!m) return null
  return readNumber(m[1].split('\\,')[0].replace(/\{,\}/g, ',').replace(/\\cdot\s*10\^\{(-?\d+)\}/, 'e$1').replace(/\s+/g, ''))
}
// so, wie man es eintippen würde (drei gültige Ziffern reichen nicht immer; hier zwölf)
const typed = (r: Rational) => numberAnswer(formatText(r, { significant: 12, scientific: true }).replace(' · 10', 'e').replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => ({ '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' })[c]!))

const SEEDS = Array.from({ length: 40 }, (_, i) => 1 + 977 * i)

describe('Klausuraufgaben frei', () => {
  for (const no of [1, 2, 3, 4, 5]) {
    it(`Aufgabe ${no}: eingetippte Zahlen bewertet wie die gewählten Antworten`, () => {
      let numericItems = 0
      for (const seed of SEEDS) {
        const task = chemExamTask(no, seed)!
        const truth = truthOf(task)
        // alle richtig gewählt, außer einer Zahlenfrage, die eingetippt wird
        const base: Record<string, string> = Object.fromEntries([...truth].map(([id, t]) => [id, t.option.id]))
        for (const [id, t] of truth) {
          if (!t.build.numeric) continue
          numericItems++
          for (const option of t.build.options) {
            const value = numberOf(option.content)
            expect(value, `${no}/${seed} ${id}: ${option.content}`).not.toBeNull()
            const answers: ExamAnswers = { ...base, [id]: typed(value!) }
            const chosen = examState(task, answers).find((s) => s.item.id === id)!.chosen!
            if (option.id === t.build.correct) expect(chosen.id, `${no}/${seed} ${id}`).toBe(option.id)
            else expect(chosen.errorRuleId, `${no}/${seed} ${id}: ${option.content}`).toBe(option.errorRuleId)
          }
          // 2,5 % daneben: volle Punkte, mit Hinweis
          const right = numberOf(t.option.content)!
          const result = gradeExam(task, { ...base, [id]: typed(ratMul(right, parseDecimal('1.025')!)) })
          const item = result.parts.flatMap((p) => p.items).find((r) => r.item.id === id)!
          expect([item.status, item.close], `${no}/${seed} ${id}`).toEqual(['richtig', true])
          expect(result.points).toBe(result.max)
        }
      }
      // Aufgaben 2 und 3 haben keine Zahlen zum Eintippen
      if (no === 2 || no === 3) expect(numericItems).toBe(0)
      else expect(numericItems).toBeGreaterThan(0)
    })
  }

  it('Aufgabe 4: eine eigene falsche Molmasse rechnet weiter, die Rechnung damit gibt volle Punkte (Folgefehler)', () => {
    for (const seed of SEEDS) {
      const task = chemExamTask(4, seed)!
      const truth = truthOf(task)
      const fuelMolar = [...truth.keys()].find((id) => id.startsWith('molmasse-') && task.parts[1].items[0].id === id)!
      const right = truth.get(fuelMolar)!.option.value as Rational
      const own = ratMul(right, parseDecimal('1.2')!)
      const answers: Record<string, string> = Object.fromEntries([...truth].map(([id, t]) => [id, t.option.id]))
      answers[fuelMolar] = typed(own)
      // Stoffmenge mit der eigenen Molmasse gerechnet und eingetippt
      const mFuel = readNumber(task.givenLatex.split('=')[1].replace('\\,\\mathrm{g}', '').replace(/\{,\}/g, ',').trim())!
      answers['stoffmenge-brennstoff'] = typed(ratDiv(mFuel, own))
      const states = examState(task, answers)
      const chosen: ExamOption = states.find((s) => s.item.id === 'stoffmenge-brennstoff')!.chosen!
      const build = states.find((s) => s.item.id === 'stoffmenge-brennstoff')!.build!
      expect(chosen.id, `4/${seed}`).toBe(build.expected)
      const result = gradeExam(task, answers)
      const status = (id: string) => result.parts.flatMap((p) => p.items).find((r) => r.item.id === id)!.status
      expect(status(fuelMolar)).toBe('falsch')
      expect(status('stoffmenge-brennstoff')).toBe('folgefehler')
    }
  })

  it('nimmt keine Zahl bei Fragen ohne Zahl und Unsinn als offene Frage', () => {
    const task = chemExamTask(4, 5)!
    const states = examState(task, { gleichung: numberAnswer('12'), 'molmasse-O2': numberAnswer('1,2,3') })
    expect(states.find((s) => s.item.id === 'gleichung')!.chosen).toBeNull()
    expect(states.find((s) => s.item.id === 'molmasse-O2')!.chosen).toBeNull()
  })
})
