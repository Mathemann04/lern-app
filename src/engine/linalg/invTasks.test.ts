import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { parseLatex } from '../parse/latex.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { vectorErrorRule } from './errorRules.ts'
import { INV_ERROR_RULES } from './invErrorRules.ts'
import { INV_CARD, INV_KINDS_BY_LEVEL } from './invTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 12a: Baustein „Inverse Matrix“. Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (eigenes
// Gauß-Jordan mit Spaltenpivot, nicht die Brüche der Engine): Inverse, „nicht invertierbar“ genau bei det A = 0, Regeln
// über die ausmultiplizierte Matrix, Gleichungssystem durch Lösen, mit Parameter jede ganze Zahl von −30 bis 30. Jede
// Tabelle des Gauß-Jordan-Verfahrens ist gleichwertig zu (A | E) (links = rechts · A), jede falsche nicht; keine falsche
// Inverse ist die Inverse; jeder Fehler kommt vor und steht auf einer Karte; Abwechslung; freier Modus; Bild.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('inverse', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const sameN = (A: N, B: N) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((x, j) => close(x, B[i][j])))
const rowsOf = (flat: readonly number[], cols: number): N => Array.from({ length: flat.length / cols }, (_, i) => flat.slice(i * cols, (i + 1) * cols))
const mulN = (A: N, B: N): N => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)))
const transposeN = (A: N): N => A[0].map((_, j) => A.map((r) => r[j]))

// Inverse mit Spaltenpivot; null, wenn (fast) singulär
function inverseN(A: N): N | null {
  const n = A.length
  const M = A.map((r, i) => [...r, ...r.map((_, j) => (i === j ? 1 : 0))])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9) return null
    ;[M[p], M[c]] = [M[c], M[p]]
    const piv = M[c][c]
    M[c] = M[c].map((x) => x / piv)
    for (let i = 0; i < n; i++) {
      if (i === c) continue
      const f = M[i][c]
      M[i] = M[i].map((x, k) => x - f * M[c][k])
    }
  }
  return M.map((r) => r.slice(n))
}

const valueOf = (latex: string, vars: Record<string, number> = {}) => {
  const r = parseLatex(latex.trim())
  if (!r.ok) throw new Error(latex)
  return evaluate(r.expr, vars)
}
// Matrix aus einer Antwort „Name = \begin{pmatrix} … \end{pmatrix}“
function matrixOf(content: string): N {
  const body = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/s.exec(content)![1]
  return body.split('\\\\').map((r) => r.split('&').map((x) => valueOf(x)))
}
// Tabelle (L | R) aus einer Antwort mit \begin{array}{c|rrr|rrr…}
function tableOf(content: string, n: number): { L: N; R: N } {
  const body = /\\begin\{array\}\{[^}]*\}(.*?)\\end\{array\}/s.exec(content)![1]
  const rows = body.split('\\\\').map((r) => r.split('&').slice(1, 1 + 2 * n).map((x) => valueOf(x)))
  return { L: rows.map((r) => r.slice(0, n)), R: rows.map((r) => r.slice(n)) }
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind !== 'math') continue
    expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
    expect(segment.latex.replace(/\\text\{[^}]*\}/g, ''), `${context}: ${segment.latex}`).not.toMatch(/\b(oder|und|für|genau)\b/)
  }
}

// die gefragte Matrix der Aufgabe (bei invParam für den gewählten Wert)
function matrixA(task: VectorTask): N {
  const n = task.data.n[0]
  if (task.kind === 'invParam') {
    const [A0, A1] = [rowsOf(task.data.A0, n), rowsOf(task.data.A1, n)]
    const a = task.data.a0[0]
    return A0.map((r, i) => r.map((x, j) => x + a * (A1[i][j] - x)))
  }
  if (task.kind === 'invRules') return rowsOf(task.data.M0, n)
  return rowsOf(task.data.A, n)
}

// unabhängige Gegenprobe des Ergebnisses
function verify(task: VectorTask, context: string) {
  const n = task.data.n[0]
  if (task.kind === 'invRules') {
    const Ms = [rowsOf(task.data.M0, n), rowsOf(task.data.M1, n)]
    const [k, ...flat] = task.data.asked
    let P: N = Ms[0].map((r, i) => r.map((_, j) => (i === j ? k : 0)))
    for (let f = 0; f < flat.length; f += 3) {
      const [base, inv, t] = flat.slice(f, f + 3)
      let X = Ms[base]
      if (inv) X = inverseN(X)!
      if (t) X = transposeN(X)
      P = mulN(P, X)
    }
    expect(sameN(rowsOf(task.answer, n), inverseN(P)!), context).toBe(true)
    return
  }
  if (task.kind === 'invSystem') {
    const A = rowsOf(task.data.A, n)
    const cols = task.data.B.length / n
    const X = mulN(inverseN(A)!, rowsOf(task.data.B, cols))
    expect(sameN(rowsOf(task.answer, cols), X), context).toBe(true)
    return
  }
  const A = matrixA(task)
  const inv = inverseN(A)
  if (!inv) {
    expect(task.answer, context).toEqual([1])
    expect(task.resultLatex, context).toBe('\\text{nicht invertierbar}')
    return
  }
  expect(sameN(rowsOf(task.answer, n), inv), context).toBe(true)
  expect(sameN(mulN(A, rowsOf(task.answer, n)), A.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)))), context).toBe(true)
  if (task.kind === 'invParam') {
    // genau die angegebenen ganzen a machen A nicht invertierbar
    const [A0, A1] = [rowsOf(task.data.A0, n), rowsOf(task.data.A1, n)]
    const zeros: number[] = []
    for (let a = -30; a <= 30; a++) if (!inverseN(A0.map((r, i) => r.map((x, j) => x + a * (A1[i][j] - x))))) zeros.push(a)
    expect(zeros, context).toEqual([...task.data.roots].sort((p, q) => p - q))
  }
}

describe('Inverse Matrix', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(INV_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      verify(task, context)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect(parts!.flatMap((p) => p.values), context).toEqual([...task.answer])
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBe(4)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(() => vectorErrorRule(c.errorRuleId!), `${where}: ${c.errorRuleId}`).not.toThrow()
          expectRenderable(c.whyWrong!.detailed, where)
        }
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
    }
  })

  it('jede Tabelle im Gauß-Jordan-Verfahren ist gleichwertig zu (A | E), keine falsche; links Nullen wie gefragt', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        if (task.kind !== 'invGauss' && task.kind !== 'invParam') continue
        const A = matrixA(task)
        const n = A.length
        // (L | R) entsteht aus (A | E) durch Zeilenumformungen genau dann, wenn L = R · A und R invertierbar ist
        const fits = (t: { L: N; R: N }) => sameN(t.L, mulN(t.R, A)) && inverseN(t.R) !== null
        for (const step of task.steps.filter((s) => /^(start|unten|oben)/.test(s.id))) {
          const right = tableOf(step.choices.find((c) => c.correct)!.content, n)
          expect(fits(right), `${task.form} ${step.id}`).toBe(true)
          const m = /^(unten|oben)-(\d)$/.exec(step.id)
          if (m) {
            const c = Number(m[2]) - 1
            right.L.forEach((r, i) => {
              if (m[1] === 'unten' ? i > c : i < c) expect(r[c], `${task.form} ${step.id}`).toBe(0)
            })
          }
          for (const w of step.choices.filter((x) => !x.correct)) expect(fits(tableOf(w.content, n)), `${task.form} ${step.id} ${w.errorRuleId}`).toBe(false)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(400)
  })

  it('jede angebotene Inverse (Formel und Ablesen) stimmt bzw. ist falsch', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        for (const step of task.steps.filter((s) => s.id === 'inverse' || s.id === 'ablesen')) {
          const A = task.kind === 'invSystem' ? rowsOf(task.data.A, task.data.n[0]) : matrixA(task)
          const inv = inverseN(A)!
          expect(sameN(matrixOf(step.choices.find((c) => c.correct)!.content), inv), `${task.form} ${step.id}`).toBe(true)
          for (const w of step.choices.filter((c) => !c.correct)) expect(sameN(matrixOf(w.content), inv), `${task.form} ${step.id} ${w.errorRuleId}`).toBe(false)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(300)
  })

  it('nicht invertierbar kommt vor, nur bei det A = 0; Zeilentausch kommt vor', () => {
    let singular = 0
    let swaps = 0
    for (const level of [2, 4, 5] as const) {
      for (const task of tasks(level, 150)) {
        if (task.resultLatex === '\\text{nicht invertierbar}') {
          singular++
          expect(inverseN(matrixA(task)), task.form).toBeNull()
        }
        if (task.steps.some((s) => s.id.startsWith('tausch'))) swaps++
      }
    }
    expect(singular).toBeGreaterThan(20)
    expect(swaps).toBeGreaterThan(20)
  })

  it('Bild bei 2 × 2: A bringt die Spalten der Inversen auf e₁ und e₂, das Parallelogramm zurück aufs Quadrat', () => {
    let drawings = 0
    for (const level of [1, 2, 4] as const) {
      for (const task of tasks(level, 80)) {
        const d = task.resultDrawing
        if (!d) continue
        const A = matrixA(task)
        expect(A.length, task.form).toBe(2)
        const back = d.polygons.find((p) => p.color === 'c')!
        const corners = back.points.map((p) => mulN(A, [[p[0]], [p[1]]]).map((r) => r[0]))
        expect(sameN(corners, [[0, 0], [1, 0], [1, 1], [0, 1]]), task.form).toBe(true)
        const par = d.polygons.find((p) => p.color === 'a')!
        expect(sameN(par.points.map((p) => [...p]), [[0, 0], [A[0][0], A[1][0]], [A[0][0] + A[0][1], A[1][0] + A[1][1]], [A[0][1], A[1][1]]]), task.form).toBe(true)
        expectRenderable(d.caption, task.form)
        drawings++
      }
    }
    expect(drawings).toBeGreaterThan(80)
  })

  it('Gauß-Jordan zum Abspielen (Schritt 12c): jedes Bild ist gleichwertig zu (A | E), am Ende (E | A⁻¹) bzw. eine Nullzeile', () => {
    let checked = 0
    let singular = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const withJordan = task.steps.filter((s) => s.jordan)
        const jordanSteps = task.steps.filter((s) => /^(start|unten|oben|tausch|ablesen)/.test(s.id) || (s.id === 'deuten' && task.kind === 'invGauss'))
        if (jordanSteps.length === 0) {
          expect(withJordan, task.form).toEqual([])
          continue
        }
        // genau ein Bild, am letzten Schritt des Verfahrens
        expect(withJordan.length, task.form).toBe(1)
        const step = withJordan[0]
        expect(step, task.form).toBe(jordanSteps.at(-1))
        const f = step.jordan!
        const A = matrixA(task)
        const n = A.length
        expect(f.n, task.form).toBe(n)
        // ein Bild je Umformung, dazu Start und Ende
        expect(f.frames.length, task.form).toBe(task.steps.filter((s) => /^(unten|oben|tausch)/.test(s.id)).length + 2)
        const E = A.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)))
        f.frames.forEach((fr, k) => {
          const where = `${task.form} Bild ${k}`
          const rows = fr.rows.map((r) => r.map((x) => valueOf(x)))
          const [L, R] = [rows.map((r) => r.slice(0, n)), rows.map((r) => r.slice(n))]
          expect(rows.every((r) => r.length === 2 * n), where).toBe(true)
          // aus (A | E) durch Zeilenumformungen: L = R · A, R invertierbar
          expect(sameN(L, mulN(R, A)) && inverseN(R) !== null, where).toBe(true)
          if (k === 0) expect(sameN(L, A) && sameN(R, E), where).toBe(true)
          for (const [r, c] of fr.zeros) expect(L[r][c], where).toBe(0)
          if (fr.pivot) expect(L[fr.pivot[0]][fr.pivot[1]], where).not.toBe(0)
          if (k > 0 && k < f.frames.length - 1) expect(fr.changed.length, where).toBeGreaterThan(0)
          fr.notes.forEach((x, r) => {
            if (x) expect(latexProblem(x, { checkUgly: false }), where).toBeNull()
            if (x !== '') expect(fr.changed, where).toContain(r)
          })
          for (const x of [...fr.rows.flat(), ...(fr.labels ?? [])]) expect(latexProblem(x, { checkUgly: false }), where).toBeNull()
          expectRenderable(fr.caption, where)
        })
        const last = f.frames.at(-1)!.rows.map((r) => r.map((x) => valueOf(x)))
        const inv = inverseN(A)
        expect(f.singular, task.form).toBe(inv === null)
        if (inv) {
          expect(sameN(last.map((r) => r.slice(0, n)), E), task.form).toBe(true)
          expect(sameN(last.map((r) => r.slice(n)), inv), task.form).toBe(true)
        } else {
          expect(last.some((r) => r.slice(0, n).every((x) => x === 0)), task.form).toBe(true)
          singular++
        }
        checked++
      }
    }
    expect(checked).toBeGreaterThan(150)
    expect(singular).toBeGreaterThan(10)
  })

  it.each(cells)('Stufe %i: Abwechslung (100 Formen unter 200, keine über 3 %)', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art kommt vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 60)) seen.add(task.kind)
    expect([...seen].sort()).toEqual([...new Set(Object.values(INV_KINDS_BY_LEVEL).flat())].sort())
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Inverse Matrix: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(INV_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const id of used) expect(shown.has(id), id).toBe(true)
    for (const rule of INV_ERROR_RULES) {
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      // oxlint-disable-next-line no-control-regex
      for (const text of [rule.name, rule.wrongFormula, rule.why.detailed, rule.why.short]) expect(text, rule.id).not.toMatch(/[\u0000-\u001f]/)
    }
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(INV_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        verify(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(10)
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

describe('Inverse Matrix: freier Modus', () => {
  it('nimmt das Ergebnis an und erkennt typische Fehler', () => {
    const found = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => (p.shape === 'choice' ? [p.options![p.values[0]]] : p.values.map(latexOf)))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        check.wrongs.forEach((ws, i) => {
          for (const w of ws) {
            const verdict = checkVectorEntries(
              check,
              check.parts.map((p, j) => (p.shape === 'choice' ? [p.options![(j === i ? w.values : p.values)[0]]] : (j === i ? w.values : p.values).map(latexOf))),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    for (const id of ['inv-2-no-divide', 'inv-scale-forgot', 'inv-read-transpose', 'inv-factor', 'inv-singular-right']) expect(found.has(id), id).toBe(true)
  })
})
