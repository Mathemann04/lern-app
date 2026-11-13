import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { DET_ERROR_RULES } from './detErrorRules.ts'
import { DET_CARD, DET_KINDS_BY_LEVEL } from './detTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 9a: Baustein „Determinanten“. Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (Determinante nach
// Laplace mit der ersten Zeile, nicht das Gauß-Verfahren der Engine); keine falsche Antwort ist gleich der richtigen; jede
// Entwicklung im Text wird ausgerechnet; jeder Fehler kommt vor und steht auf einer Karte; Abwechslung; freier Modus.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('determinante', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const rows = (flat: readonly number[], n: number): N => Array.from({ length: n }, (_, i) => flat.slice(i * n, (i + 1) * n))
const sameFlat = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => close(x, b[i]))

// Laplace nach der ersten Zeile
function laplace(A: N): number {
  if (A.length === 1) return A[0][0]
  return A[0].reduce((s, x, j) => s + (j % 2 === 0 ? 1 : -1) * x * laplace(A.slice(1).map((r) => r.filter((_, c) => c !== j))), 0)
}

function expected(task: VectorTask): number[] {
  const d = task.data
  switch (task.kind) {
    case 'detTwo':
    case 'detSarrus': {
      const v = laplace(rows(d.A, d.n[0]))
      return task.answer.length === 2 ? [v, Math.abs(v)] : [v]
    }
    case 'detTriangle':
    case 'detExpand':
    case 'detEliminate':
      return [laplace(rows(d.A, d.n[0]))]
    case 'detRowOps':
      return [laplace(rows(d.C, d.n[0])) * d.d[0]]
    case 'detRules': {
      const n = d.n[0]
      const dets = d.A.length > 0 ? [laplace(rows(d.A, 3)), d.d[1]] : d.d
      const one = (kind: number, k: number, v: number) => (kind === 2 ? 1 / v : kind === 3 ? v ** k : v)
      return [d.lam[0] ** n * d.kinds.reduce((s, kind, i) => s * one(kind, d.k[i], dets[i]), 1)]
    }
    case 'detParam': {
      const n = d.n[0]
      const A = (a: number) => rows(d.A0.map((x, i) => x + a * (d.A1[i] - x)), n)
      // −1 liegt auf derselben Geraden (Einträge linear im Parameter)
      expect(sameFlat(rows(d.Am, n).flat(), A(-1).flat())).toBe(true)
      const [r1, r2] = task.answer
      expect(Math.abs(laplace(A(r1)))).toBeLessThan(1e-9)
      expect(Math.abs(laplace(A(r2)))).toBeLessThan(1e-9)
      // genau diese beiden: det A(a) = c (a − r1)(a − r2) an weiteren Stellen
      const c = laplace(A(r1 + r2 + 0.5)) / ((r2 + 0.5) * (r1 + 0.5))
      expect(Math.abs(c)).toBeGreaterThan(1e-9)
      for (const a of [-2.3, 0.7, 4.1]) expect(close(laplace(A(a)), c * (a - r1) * (a - r2))).toBe(true)
      return [r1, r2]
    }
    default:
      throw new Error(`unbekannte Art ${task.kind}`)
  }
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

function checkDrawing(drawing: VectorDrawing, context: string) {
  for (const c of drawingCoordinates(drawing)) {
    expect(c.length, context).toBe(drawing.dim)
    for (const x of c) expect(Number.isFinite(x), context).toBe(true)
  }
  expectRenderable(drawing.caption, context)
}

// Entwicklung wie „\det A = 2 \cdot \begin{vmatrix} … \end{vmatrix} - (-1) \cdot \begin{vmatrix} … \end{vmatrix}“ ausrechnen
function evalExpansion(latex: string): number | null {
  const rhs = latex.replace(/^\$|\$$/g, '').split(' = ').slice(1).join(' = ')
  if (/[a-z]/.test(rhs.replace(/\\(begin|end)\{vmatrix\}|\\cdot/g, ''))) return null
  const replaced = rhs.replace(/\\begin\{vmatrix\}(.*?)\\end\{vmatrix\}/g, (_, body: string) => {
    const M = body.split('\\\\').map((r) => r.split('&').map((x) => Number(x.trim())))
    return `(${laplace(M)})`
  })
  const tokens = replaced.replace(/\\cdot/g, '*').match(/\d+(?:\.\d+)?|[-+*()]/g) ?? []
  let i = 0
  const atom = (): number => {
    const t = tokens[i++]
    if (t === '(') {
      const v = sum()
      i++
      return v
    }
    if (t === '-') return -atom()
    return Number(t)
  }
  const prod = (): number => {
    let v = atom()
    while (tokens[i] === '*') {
      i++
      v *= atom()
    }
    return v
  }
  const sum = (): number => {
    let v = prod()
    while (tokens[i] === '+' || tokens[i] === '-') v = tokens[i++] === '+' ? v + prod() : v - prod()
    return v
  }
  return sum()
}

describe('Determinanten', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(DET_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expect(sameFlat(task.answer, expected(task)), `${context}: ${task.answer.join(',')}`).toBe(true)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect(sameFlat(parts!.flatMap((p) => p.values), task.answer), context).toBe(true)
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBeGreaterThanOrEqual(3)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(DET_ERROR_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        if (step.drawing) checkDrawing(step.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      if (task.resultDrawing) checkDrawing(task.resultDrawing, context)
    }
  })

  it('keine falsche Antwort hat denselben Wert wie die richtige', () => {
    let compared = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        for (const step of task.steps) {
          const right = readResult(step.choices.find((c) => c.correct)!.content)
          if (!right) continue
          for (const c of step.choices.filter((c) => !c.correct)) {
            const wrong = readResult(c.content)
            if (!wrong || wrong.length !== right.length) continue
            const same = right.every((r, i) => wrong[i].shape === r.shape && wrong[i].cols === r.cols && sameFlat(wrong[i].values, r.values))
            expect(same, `${task.form} ${step.id}: ${c.content}`).toBe(false)
            compared++
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(1000)
  })

  it('jede Entwicklung in den Antworten: die richtige ergibt die Determinante, keine falsche', () => {
    let checked = 0
    for (const level of [2, 3, 4, 5] as const)
      for (const task of tasks(level, 150).filter((t) => t.kind === 'detExpand')) {
        const step = task.steps.find((s) => s.id === 'entwickeln' || s.id === 'entwickeln-1')!
        for (const c of step.choices) {
          const v = evalExpansion(c.content)
          expect(v, c.content).not.toBeNull()
          expect(close(v!, task.answer[0]), `${task.form}: ${c.content}`).toBe(c.correct)
          checked++
        }
      }
    expect(checked).toBeGreaterThan(500)
  })

  it('Sarrus: die richtige Antwort ist die Determinante der Matrix im Schritt (auch bei Unterdeterminanten)', () => {
    let checked = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 100))
        for (const step of task.steps.filter((s) => s.id.startsWith('sarrus'))) {
          const m = /Sarrus mit den ersten beiden Spalten daneben:\n\$\\begin\{array\}\{rrr\|rr\} (.*?) \\end\{array\}\$/s.exec(step.explanation.detailed)
          expect(m, step.explanation.detailed).not.toBeNull()
          const M = m![1].split('\\\\').map((r) => r.split('&').slice(0, 3).map((x) => x.trim()))
          if (M.flat().some((x) => /a/.test(x))) continue
          const value = readResult(step.choices.find((c) => c.correct)!.content)![0].values[0]
          expect(close(value, laplace(M.map((r) => r.map(Number)))), task.form).toBe(true)
          checked++
        }
    expect(checked).toBeGreaterThan(200)
  })

  it('Bild 2 × 2: Parallelogramm aus den Spalten, Fläche |det A|; Bild 3 × 3: Spat aus den Spalten', () => {
    let drawn = 0
    for (const task of tasks(1, 150)) {
      if (task.kind === 'detTwo') {
        const A = rows(task.data.A, 2)
        const par = task.resultDrawing!.polygons[1].points
        expect(sameFlat(par[1] as number[], [A[0][0], A[1][0]]), task.form).toBe(true)
        expect(sameFlat(par[3] as number[], [A[0][1], A[1][1]]), task.form).toBe(true)
        // Fläche des Parallelogramms (Schnürsenkel) = |det|
        const area = Math.abs(par.reduce((s, p, i) => s + p[0] * par[(i + 1) % 4][1] - par[(i + 1) % 4][0] * p[1], 0)) / 2
        expect(close(area, Math.abs(task.answer[0])), task.form).toBe(true)
        drawn++
      }
    }
    for (const task of tasks(2, 150).filter((t) => t.kind === 'detSarrus' && t.answer.length === 2)) {
      const A = rows(task.data.A, 3)
      const tips = task.resultDrawing!.arrows.map((a) => a.to)
      for (let j = 0; j < 3; j++) expect(sameFlat(tips[j] as number[], [A[0][j], A[1][j], A[2][j]]), task.form).toBe(true)
      drawn++
    }
    expect(drawn).toBeGreaterThan(80)
  })

  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art kommt vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 100)) seen.add(task.kind)
    expect([...seen].sort()).toEqual([...new Set(Object.values(DET_KINDS_BY_LEVEL).flat())].sort())
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Determinanten: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(DET_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const rule of DET_ERROR_RULES) expect(shown.has(rule.id), rule.id).toBe(true)
    for (const rule of DET_ERROR_RULES) expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(DET_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        expect(sameFlat(task.answer, expected(task)), card.id).toBe(true)
        examples++
      }
    }
    expect(examples).toBe(13)
  })
})

// Zahlen als LaTeX für den freien Modus
const entry = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}

describe('Determinanten: freier Modus', () => {
  it('nimmt das Ergebnis an (Lösungen beim Parameter in beliebiger Reihenfolge) und erkennt typische Fehler', () => {
    const found = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => p.values.map(entry))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        if (task.kind === 'detParam') expect(checkVectorEntries(check, [[...input[0]].reverse()]).kind, task.form).toBe('correct')
        check.wrongs.forEach((ws, i) => {
          for (const w of ws) {
            const verdict = checkVectorEntries(
              check,
              check.parts.map((p, j) => (j === i ? w.values.map(entry) : p.values.map(entry))),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    for (const id of ['det-2-plus', 'det-sarrus-plus', 'det-abs', 'det-checker-shift', 'det-swap-sign', 'det-scalar-power', 'det-root-sign']) expect(found.has(id), id).toBe(true)
  })
})

describe('Determinanten: Umformungen', () => {
  it('beim Weglassen der Vielfachen ist keine falsche Antwort gleichwertig (kein Faktor 1)', () => {
    let checked = 0
    for (const level of [3, 5] as const)
      for (const task of tasks(level, 200).filter((t) => t.kind === 'detRowOps')) {
        for (const step of task.steps.filter((s) => s.id === 'addieren')) for (const c of step.choices.filter((c) => !c.correct)) expect(c.content, task.form).not.toMatch(/= 1 \\cdot/)
        checked++
      }
    expect(checked).toBeGreaterThan(80)
  })
})
