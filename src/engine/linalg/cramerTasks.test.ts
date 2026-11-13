import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { parseLatex } from '../parse/latex.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { CRAMER_ERROR_RULES } from './cramerErrorRules.ts'
import { CRAMER_CARD, CRAMER_KINDS_BY_LEVEL } from './cramerTasks.ts'
import { DET_ERROR_RULES } from './detErrorRules.ts'
import { GAUSS_ERROR_RULES } from './gaussErrorRules.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 11a: Baustein „Cramersche Regel“. Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (eigenes
// Gauß-Verfahren mit Spaltenpivot, nicht die Determinanten der Engine): Lösung bzw. gefragte Unbekannte stimmt; mit
// Parameter wird jede ganze Zahl von −30 bis 30 eingesetzt, und genau die angegebenen haben genau eine Lösung mit dem
// gefragten Wert; jede Determinante im Rechenweg stimmt (mit Parameter an mehreren Stellen); keine falsche Antwort ist
// gleichwertig; jeder Fehler kommt vor und steht auf einer Karte; Abwechslung; freier Modus.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('cramer', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const VARS = ['x', 'y', 'z']

// Lösung mit Spaltenpivot; null, wenn die Matrix (fast) singulär ist
function solve(A: N, b: readonly number[]): number[] | null {
  const n = A.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9) return null
    ;[M[p], M[c]] = [M[c], M[p]]
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c]
      M[i] = M[i].map((x, k) => x - f * M[c][k])
    }
  }
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) x[i] = (M[i][n] - x.reduce((s, v, j) => (j > i ? s + M[i][j] * v : s), 0)) / M[i][i]
  return x
}
// Determinante mit Spaltenpivot
function detN(A: N): number {
  const M = A.map((r) => [...r])
  const n = M.length
  let d = 1
  for (let c = 0; c < n; c++) {
    let p = c
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (M[p][c] === 0) return 0
    if (p !== c) {
      ;[M[p], M[c]] = [M[c], M[p]]
      d = -d
    }
    d *= M[c][c]
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c]
      M[i] = M[i].map((x, k) => x - f * M[c][k])
    }
  }
  return d
}

function system(task: VectorTask) {
  const n = task.data.n[0]
  const rows = (flat: readonly number[]) => Array.from({ length: n }, (_, i) => flat.slice(i * n, (i + 1) * n))
  const [A0, A1] = [rows(task.data.A0), rows(task.data.A1)]
  // Einträge linear im Parameter
  const at = (a: number): N => A0.map((r, i) => r.map((x, j) => x + a * (A1[i][j] - x)))
  return { n, at, b: task.data.b, k: task.data.k?.[0], c: task.data.c?.[0], param: A0.some((r, i) => r.some((x, j) => x !== A1[i][j])) }
}
const withCol = (A: N, k: number, b: readonly number[]) => A.map((r, i) => r.map((x, j) => (j === k ? b[i] : x)))

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind !== 'math') continue
    expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
    // keine Wörter im Formelsatz (außer in \text)
    expect(segment.latex.replace(/\\text\{[^}]*\}/g, ''), `${context}: ${segment.latex}`).not.toMatch(/\b(oder|und|für|genau)\b/)
  }
}

// unabhängige Gegenprobe des Ergebnisses
function verify(task: VectorTask, context: string) {
  const { n, at, b, k, c, param } = system(task)
  if (!param) {
    const x = solve(at(0), b)
    expect(x, context).not.toBeNull()
    if (task.kind === 'cramerThree') expect(close(task.answer[0], x![k!]), context).toBe(true)
    else expect(task.answer.every((v, i) => close(v, x![i])), context).toBe(true)
    return
  }
  // mit Parameter: genau die angegebenen ganzen Zahlen haben eine eindeutige Lösung mit x_k = c
  const good: number[] = []
  for (let a = -30; a <= 30; a++) {
    if (Math.abs(detN(at(a))) < 1e-9) continue
    const x = solve(at(a), b)!
    if (close(x[k!], c!)) good.push(a)
  }
  expect([...task.answer].sort((p, q) => p - q), context).toEqual(good)
  expect(good.length, context).toBeGreaterThan(0)
  expect(n, context).toBe(task.kind === 'cramerParamThree' ? 3 : 2)
}

const valueOf = (latex: string, a: number) => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(latex)
  return evaluate(r.expr, { a })
}

describe('Cramersche Regel', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(CRAMER_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      verify(task, context)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect([...parts!.flatMap((p) => p.values)].sort(), context).toEqual([...task.answer].sort())
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBe(4)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((c) => !c.correct)) {
          const known = [...CRAMER_ERROR_RULES, ...DET_ERROR_RULES, ...GAUSS_ERROR_RULES].some((r) => r.id === c.errorRuleId)
          expect(known, `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
    }
  })

  it('jede Determinante im Rechenweg stimmt, keine falsche ist gleich (mit Parameter an mehreren Stellen)', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        const { at, b } = system(task)
        for (const step of task.steps.filter((s) => s.id === 'det' || s.id.startsWith('det-'))) {
          const k = step.id === 'det' ? -1 : VARS.indexOf(step.id.slice(4))
          const M = (a: number) => (k < 0 ? at(a) : withCol(at(a), k, b))
          const value = (content: string) => content.replace(/^\$/, '').replace(/\$$/, '').split(' = ').at(-1)!
          const right = step.choices.find((c) => c.correct)!
          for (const a of [-2.5, 0.5, 1.7, 3]) expect(close(valueOf(value(right.content), a), detN(M(a))), `${task.form} ${step.id}`).toBe(true)
          for (const c of step.choices.filter((x) => !x.correct)) expect([-2.5, 0.5, 1.7, 3].every((a) => close(valueOf(value(c.content), a), detN(M(a)))), `${task.form} ${step.id} ${c.errorRuleId}`).toBe(false)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(900)
  })

  it('die Unbekannte als Zahl bzw. Bruch in a stimmt, falsche Werte sind andere; A_k ersetzt genau die Spalte', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        const { at, b } = system(task)
        for (const step of task.steps.filter((s) => s.id.startsWith('wert-'))) {
          const k = VARS.indexOf(step.id.slice(5))
          const value = (content: string) => content.replace(/^\$/, '').replace(/\$$/, '').split(' = ')[1]
          const want = (a: number) => solve(at(a), b)![k]
          const right = step.choices.find((c) => c.correct)!
          for (const a of [-2.5, 0.5, 1.7]) expect(close(valueOf(value(right.content), a), want(a)), `${task.form} ${step.id}`).toBe(true)
          for (const c of step.choices.filter((x) => !x.correct)) expect([-2.5, 0.5, 1.7].every((a) => close(valueOf(value(c.content), a), want(a))), `${task.form} ${step.id} ${c.errorRuleId}`).toBe(false)
          checked++
        }
        for (const step of task.steps.filter((s) => s.id.startsWith('matrix-'))) {
          const k = VARS.indexOf(step.id.slice(7))
          const right = step.choices.find((c) => c.correct)!
          const body = /\\begin\{pmatrix\}(.*)\\end\{pmatrix\}/.exec(right.content)![1]
          const rows = body.split('\\\\').map((r) => r.split('&').map((x) => x.trim()))
          rows.forEach((r, i) => expect(valueOf(r[k], 0), task.form).toBe(b[i]))
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(400)
  })

  it('mit Parameter: Bedingung sind genau die Nullstellen von det A; der Wert, der wegfällt, kommt vor', () => {
    let traps = 0
    for (const level of [4, 5] as const) {
      for (const task of tasks(level, 120)) {
        const step = task.steps.find((s) => s.id === 'bedingung')
        if (!step) continue
        const { at } = system(task)
        const right = step.choices.find((c) => c.correct)!.content
        const excluded = [...right.matchAll(/a \\ne (-?\d+)/g)].map((m) => Number(m[1]))
        const zeros: number[] = []
        for (let a = -30; a <= 30; a++) if (Math.abs(detN(at(a))) < 1e-9) zeros.push(a)
        expect(excluded, task.form).toEqual(zeros)
        // keine falsche Antwort schließt dieselben Werte aus (z. B. ±2 in anderer Reihenfolge)
        for (const c of step.choices.filter((x) => !x.correct)) {
          const other = [...c.content.matchAll(/a \\ne (-?\d+)/g)].map((m) => Number(m[1])).sort((p, q) => p - q)
          if (c.content.includes('\\ne')) expect(other, `${task.form} ${c.errorRuleId}`).not.toEqual(zeros)
        }
        const target = task.steps.find((s) => s.id === 'vorgabe')!
        if (target.choices.some((c) => c.errorRuleId === 'cramer-excluded')) traps++
      }
    }
    expect(traps).toBeGreaterThan(10)
  })

  it.each(cells)('Stufe %i: Abwechslung (100 Formen unter 200, keine über 3 %)', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art kommt vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 60)) seen.add(task.kind)
    expect([...seen].sort()).toEqual([...new Set(Object.values(CRAMER_KINDS_BY_LEVEL).flat())].sort())
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Cramersche Regel: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(CRAMER_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const id of used) expect(shown.has(id), id).toBe(true)
    for (const rule of CRAMER_ERROR_RULES) {
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      // keine Zeilenumbrüche oder Steuerzeichen (z. B. aus \ne beim Schreiben mit Skripten)
      // oxlint-disable-next-line no-control-regex
      for (const text of [rule.name, rule.wrongFormula, rule.why.detailed, rule.why.short]) expect(text, rule.id).not.toMatch(/[\u0000-\u001f]/)
    }
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(CRAMER_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        verify(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(4)
  })
})

// Zahlen als LaTeX für den freien Modus
const latexOf = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}

describe('Cramersche Regel: freier Modus', () => {
  it('nimmt das Ergebnis an und erkennt typische Fehler', () => {
    const found = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => p.values.map(latexOf))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        check.wrongs.forEach((ws, i) => {
          for (const w of ws) {
            const verdict = checkVectorEntries(
              check,
              check.parts.map((p, j) => (j === i ? w.values : p.values).map(latexOf)),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    for (const id of ['cramer-flip', 'cramer-no-divide', 'cramer-row', 'cramer-target-numerator', 'gauss-backsub-sign']) expect(found.has(id), id).toBe(true)
  })
})
