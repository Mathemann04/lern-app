import { describe, expect, it } from 'vitest'
import { examState, gradeExam, itemsOf, totalPoints, truthOf, withAnswer } from '../../exam/grade.ts'
import type { ExamAnswers, ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { EXAM_GIVEN_MASSES } from '../generators/shared.ts'
import { TASK4_POINTS, buildTask4 } from './task4.ts'

// Klausuraufgabe 4 (S4c): Aufbau, Ergebnis auf zweitem Weg, Punkte, Folgefehler, Teilpunkte

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)
const RULES = new Set(CHEM_ERROR_RULES.map((r) => r.id))
const numberOf = (latex: string) => {
  const m = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex.replace(/\\,(?=\d)/g, ''))!
  return Number(m[1].replace('{,}', '.')) * 10 ** Number(m[2] ?? 0)
}
const MOLAR: Record<string, number> = { C: 12, H: 1, O: 16 }
const molarOf = (formula: string) => {
  let sum = 0
  for (const [, symbol, count] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) sum += MOLAR[symbol] * Number(count || 1)
  return sum
}
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

// Antworten der Reihe nach: die vorgegebene, sonst die mit den bisherigen Antworten richtige (Folgefehler)
function followUp(task: ExamTask, forced: Record<string, (ids: { expected: string; options: readonly { id: string; errorRuleId?: string; share?: unknown }[] }) => string | undefined>): ExamAnswers {
  let answers: ExamAnswers = {}
  for (const item of itemsOf(task)) {
    const state = examState(task, answers).find((s) => s.item.id === item.id)!
    const build = state.build!
    const pick = forced[item.id]?.(build) ?? build.expected
    answers = withAnswer(task, answers, item.id, pick)
  }
  return answers
}

describe('Klausuraufgabe 4: Aufbau', () => {
  it('14 Punkte, jede Frage mit zwei bis vier verschiedenen Antworten und genau einer richtigen', () => {
    for (const seed of SEEDS) {
      const task = buildTask4(seed)
      expect(totalPoints(task)).toBe(TASK4_POINTS)
      for (const part of task.parts) expect(part.items.reduce((s, i) => s + i.points, 0), `${seed} ${part.id}`).toBe(part.points)
      for (const [id, { build }] of truthOf(task)) {
        const ids = build.options.map((o) => o.id)
        expect(new Set(ids).size, `${seed} ${id}`).toBe(ids.length)
        expect(ids.length, `${seed} ${id}`).toBeGreaterThanOrEqual(2)
        expect(ids.length, `${seed} ${id}`).toBeLessThanOrEqual(4)
        expect(ids.filter((x) => x === build.correct), `${seed} ${id}`).toHaveLength(1)
        for (const o of build.options) {
          if (o.id !== build.correct) expect(o.errorRuleId !== undefined || o.share !== undefined, `${seed} ${id} ${o.id}`).toBe(true)
          if (o.errorRuleId) expect(RULES.has(o.errorRuleId), o.errorRuleId).toBe(true)
        }
      }
    }
  })

  it('Texte und Formeln sind sauber, keine Zahlen der Altklausuren', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const task = buildTask4(seed)
      expect(latexProblem(task.givenLatex, { checkUgly: false })).toBeNull()
      for (const x of EXAM_GIVEN_MASSES) expect(task.givenLatex).not.toBe(x)
      const texts = [task.intro, task.note, ...task.parts.map((p) => p.prompt), ...itemsOf(task).map((i) => i.question)]
      for (const [, { build }] of truthOf(task)) texts.push(...build.options.map((o) => o.content), build.explanation.detailed)
      for (const text of texts) {
        expect(text, `${seed}`).not.toMatch(/undefined|NaN(?![A-Z0-9])|\[object|null/)
        for (const seg of parseRichText(text).flat()) if (seg.kind === 'math') expect(latexProblem(seg.latex, { checkUgly: false }), `${seed}: ${seg.latex}`).toBeNull()
      }
    }
  })

  it('Abwechslung: viele Brennstoffe, beide Arten von Teil d', () => {
    const fuels = new Set<string>()
    const kinds = new Set<string>()
    for (const seed of SEEDS) {
      const task = buildTask4(seed)
      fuels.add(task.givenLatex)
      kinds.add(task.parts[3].items[0].id)
    }
    expect(fuels.size).toBeGreaterThan(100)
    expect(kinds).toEqual(new Set(['stoffmenge-gas', 'stoffmenge-loesung']))
  })
})

describe('Klausuraufgabe 4: auf zweitem Weg', () => {
  it('Masse des Produkts und Gasvolumen wie mit Gleitkommazahlen gerechnet (höchstens 1 % daneben)', () => {
    for (const seed of SEEDS) {
      const task = buildTask4(seed)
      const truth = truthOf(task)
      const eq = truth.get('gleichung')!.option.id
      const terms = /\\ce\{(.*) -> (.*)\}/.exec(eq)!
      const coefficient = (formula: string) => {
        for (const t of `${terms[1]} + ${terms[2]}`.split(' + ')) {
          const [c, f] = t.includes(' ') ? t.split(' ') : ['1', t]
          if (f === formula) return Number(c)
        }
        throw new Error(formula)
      }
      const fuel = /\\ce\{(\w+)\}/.exec(task.givenLatex)![1]
      const mFuel = numberOf(task.givenLatex.split('=')[1])
      const nFuel = mFuel / molarOf(fuel)
      const target = /\\ce\{(\w+)\}/.exec(task.parts[2].prompt.split('Gramm')[1])![1]
      const mTarget = (nFuel * coefficient(target)) / coefficient(fuel) * molarOf(target)
      expect(Math.abs(numberOf(truth.get('masse-produkt')!.option.id) / mTarget - 1), `${seed}`).toBeLessThan(0.01)
      const gasItem = truth.get('volumen-gas')
      if (gasItem) {
        const gas = /\\ce\{(\w+)\}/.exec(task.parts[3].prompt)![1]
        const v = ((nFuel * coefficient(gas)) / coefficient(fuel)) * 22.4
        expect(Math.abs(numberOf(gasItem.option.id) / v - 1), `${seed}`).toBeLessThan(0.01)
      }
    }
  })
})

describe('Klausuraufgabe 4: Punkte', () => {
  it('alles richtig: 14 Punkte; nichts beantwortet: 0', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const task = buildTask4(seed)
      expect(gradeExam(task, truthAnswers(task)).points).toBe(14)
      expect(gradeExam(task, {}).points).toBe(0)
    }
  })

  it('Folgefehler: falsche Molmasse des Brennstoffs kostet nur den Punkt in b', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask4(seed)
      const fuelMolar = itemsOf(task).find((i) => i.id.startsWith('molmasse-'))!.id
      const answers = followUp(task, { [fuelMolar]: (b) => b.options.find((o) => o.errorRuleId)?.id })
      const result = gradeExam(task, answers)
      expect(result.points, `${seed}`).toBe(13)
      const c = result.parts.find((p) => p.part.id === 'c')!
      expect(c.points).toBe(4)
      expect(c.items.some((r) => r.status === 'folgefehler'), `${seed}`).toBe(true)
    }
  })

  it('Folgefehler über Teile: falsche Gleichung kostet nur a', () => {
    let seen = 0
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask4(seed)
      const answers = followUp(task, { gleichung: (b) => b.options.find((o) => o.errorRuleId)?.id })
      const truth = truthOf(task).get('gleichung')!
      if (answers.gleichung === truth.option.id) continue
      seen++
      const result = gradeExam(task, answers)
      expect(result.parts.map((p) => p.points), `${seed}`).toEqual([0, 4, 4, 4])
    }
    expect(seen).toBeGreaterThan(70)
  })

  it('halbe Punkte für eine ausgeglichene Gleichung mit Bruch oder nicht gekürzt', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const task = buildTask4(seed)
      const answers = followUp(task, { gleichung: (b) => b.options.find((o) => o.share)!.id })
      const result = gradeExam(task, answers)
      expect(result.parts[0].items[0].status).toBe('teilweise')
      expect(result.points, `${seed}`).toBe(13)
    }
  })

  it('Teilpunkte: Zwischenschritte richtig, Ergebnis falsch', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const task = buildTask4(seed)
      const answers = followUp(task, { 'masse-produkt': (b) => b.options.find((o) => o.errorRuleId)?.id })
      const c = gradeExam(task, answers).parts.find((p) => p.part.id === 'c')!
      expect(c.points, `${seed}`).toBe(2)
    }
  })

  it('Fehler im selben Teil: Folgefehler im Ergebnis kostet den Zwischenschritt', () => {
    const wrongFirst = (id: string) => ({ [id]: (b: { options: readonly { id: string; errorRuleId?: string }[] }) => b.options.find((o) => o.errorRuleId)?.id })
    let gas = 0
    let solution = 0
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask4(seed)
      const c = gradeExam(task, followUp(task, wrongFirst('stoffmenge-brennstoff'))).parts[2]
      expect(c.points, `${seed}`).toBe(3)
      const d = task.parts[3]
      const first = d.items[0].id
      const points = gradeExam(task, followUp(task, wrongFirst(first))).parts[3].points
      if (first === 'stoffmenge-gas') {
        gas++
        expect(points, `${seed}`).toBe(2)
      } else {
        solution++
        expect(points, `${seed}`).toBe(3)
      }
    }
    expect(gas).toBeGreaterThan(10)
    expect(solution).toBeGreaterThan(10)
  })

  it('verrät nichts: Nach einer falschen Antwort steht die ganz richtige nicht zusätzlich zur Wahl', () => {
    let seen = 0
    for (const seed of SEEDS.slice(0, 100)) {
      const task = buildTask4(seed)
      const fuelMolar = itemsOf(task).find((i) => i.id.startsWith('molmasse-'))!.id
      const answers = followUp(task, { [fuelMolar]: (b) => b.options.find((o) => o.errorRuleId)?.id, gleichung: (b) => b.options.find((o) => o.errorRuleId)?.id })
      for (const state of examState(task, answers)) {
        const build = state.build!
        if (build.expected === build.correct) continue
        seen++
        expect(build.options.map((o) => o.id), `${seed} ${state.item.id}`).not.toContain(build.correct)
      }
    }
    expect(seen).toBeGreaterThan(200)
  })

  it('falsche Molmassen mindestens 6 % neben der richtigen und 3 % auseinander', () => {
    const value = (id: string) => numberOf(id)
    for (const seed of SEEDS) {
      for (const [id, { build }] of truthOf(buildTask4(seed))) {
        if (!id.startsWith('molmasse')) continue
        const wrong = build.options.filter((o) => o.id !== build.correct).map((o) => value(o.id))
        const right = value(build.correct)
        for (const w of wrong) expect(Math.abs(w / right - 1), `${seed} ${id}`).toBeGreaterThanOrEqual(0.06)
        for (const [i, w] of wrong.entries()) for (const v of wrong.slice(i + 1)) expect(Math.abs(w / v - 1), `${seed} ${id}`).toBeGreaterThanOrEqual(0.03)
      }
    }
  })

  it('eine neue Antwort löscht die Antworten, die davon abhängen, sonst nichts', () => {
    const task = buildTask4(7)
    const all = truthAnswers(task)
    const other = truthOf(task).get('gleichung')!.build.options.find((o) => o.id !== all.gleichung)!.id
    const next = withAnswer(task, all, 'gleichung', other)
    expect(next.gleichung).toBe(other)
    expect(next['stoffmenge-produkt']).toBeUndefined()
    expect(next['masse-produkt']).toBeUndefined()
    expect(next['stoffmenge-brennstoff']).toBe(all['stoffmenge-brennstoff'])
    for (const id of Object.keys(all).filter((id) => id.startsWith('molmasse-'))) expect(next[id]).toBe(all[id])
  })
})

describe('Klausuraufgabe 4, Teil d: Lösung ansetzen', () => {
  it('wiegt nur Feststoffe ab; bei Hydraten gilt c für das wasserfreie Salz', () => {
    let solutions = 0
    let hydrates = 0
    for (const seed of SEEDS) {
      const part = buildTask4(seed).parts[3]
      if (part.items[0].id !== 'stoffmenge-loesung') continue
      solutions++
      expect(part.prompt).not.toMatch(/\\ce\{(HCl|H2SO4|HNO3|H3PO4|H2O2|CH3OH|C2H5OH)\}/)
      expect(part.prompt).toContain('Maßkolben')
      if (/hydrat/.test(part.prompt)) {
        hydrates++
        expect(part.prompt).toMatch(/c\(\\ce\{[^}*]+\}\)/)
        expect(part.prompt).toMatch(/Vorrätig ist nur das \w*hydrat/)
      }
    }
    expect(solutions).toBeGreaterThan(50)
    expect(hydrates).toBeGreaterThan(3)
  })
})
