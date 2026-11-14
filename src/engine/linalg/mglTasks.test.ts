import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { parseLatex } from '../parse/latex.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { vectorErrorRule } from './errorRules.ts'
import { MGL_ERROR_RULES } from './mglErrorRules.ts'
import { MGL_CARD, MGL_DISCARDED, MGL_KINDS_BY_LEVEL } from './mglTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 12b: Baustein „Matrizengleichungen“. Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet: Die
// Lösung X wird in die Gleichung eingesetzt, wie sie in der Aufgabe steht (mit (XᵀA)ᵀ, (X⁻¹A)⁻¹, AXA⁻¹ oder ganz
// transponiert), und ohne (X⁻¹A)⁻¹ ist die Gleichung linear in X: Ihre Abbildung wird aus Einheitsmatrizen aufgebaut und
// das System eigenständig gelöst (genau eine Lösung). Mit Parameter: genau für die angegebenen a von −30 bis 30 ist die
// Gleichung nicht eindeutig lösbar. Die Klammer M und die rechte Seite der Schritte passen zur Gleichung.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('matgleichung', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const sameN = (A: N, B: N) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((x, j) => close(x, B[i][j])))
const rowsOf = (flat: readonly number[], cols: number): N => Array.from({ length: flat.length / cols }, (_, i) => flat.slice(i * cols, (i + 1) * cols))
const mulN = (A: N, B: N): N => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)))
const addN = (A: N, B: N): N => A.map((r, i) => r.map((x, j) => x + B[i][j]))
const scaleN = (k: number, A: N): N => A.map((r) => r.map((x) => k * x))
const transposeN = (A: N): N => A[0].map((_, j) => A.map((r) => r[j]))
const zeroN = (n: number): N => Array.from({ length: n }, () => Array<number>(n).fill(0))

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

// Gleichung der Aufgabe aus task.data: linke minus rechte Seite für ein X (bei Parameter für den Wert a)
type Eq = { n: number; side: number; wrap: number; residual: (X: N, a: number) => N; constPart: N }
function equationOf(task: VectorTask): Eq {
  const [n, side, wrap] = task.data.shape
  const A = rowsOf(task.data.A, n)
  const terms = rowsOf(task.data.terms, 5)
  const tBase = task.data.tBase
  const shownC = (c: number) => {
    const G = rowsOf(task.data[`C${c}`], n)
    const t = wrap === 3 ? !tBase[c] : !!tBase[c]
    return t ? transposeN(G) : G
  }
  const pValue = (X: N): N => {
    const L = side === 0
    if (wrap === 0) return L ? mulN(A, X) : mulN(X, A)
    if (wrap === 1) return L ? transposeN(mulN(transposeN(X), A)) : transposeN(mulN(A, transposeN(X)))
    if (wrap === 2) return L ? inverseN(mulN(inverseN(X)!, A))! : inverseN(mulN(A, inverseN(X)!))!
    if (wrap === 3) return L ? mulN(transposeN(X), transposeN(A)) : mulN(transposeN(A), transposeN(X))
    if (wrap === 4) return mulN(mulN(A, X), inverseN(A)!)
    return mulN(mulN(inverseN(A)!, X), A)
  }
  const value = (X: N, a: number, withP: boolean, withX: boolean, withC: boolean) => {
    let out = zeroN(n)
    for (const [s, type, k0, k1, c] of terms) {
      const sign = s === 0 ? 1 : -1
      if (type === 0 && withP) out = addN(out, scaleN(sign, pValue(X)))
      if (type === 1 && withX) out = addN(out, scaleN(sign * (k0 + k1 * a), wrap === 3 ? transposeN(X) : X))
      if (type === 2 && withC) out = addN(out, scaleN(sign * k0, shownC(c)))
    }
    return out
  }
  return { n, side, wrap, residual: (X, a) => value(X, a, true, true, true), constPart: value(zeroN(n), 0, false, false, true) }
}

// lineare Abbildung X ↦ Rest(X) − Rest(0) als n² × n²-Matrix (nur ohne (X⁻¹A)⁻¹)
function linearPart(eq: Eq, a: number): N {
  const { n } = eq
  const base = eq.residual(zeroN(n), a)
  const cols: number[][] = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const U = zeroN(n)
      U[i][j] = 1
      cols.push(addN(eq.residual(U, a), scaleN(-1, base)).flat())
    }
  return transposeN(cols)
}

function verify(task: VectorTask, context: string) {
  const eq = equationOf(task)
  const n = eq.n
  const X = rowsOf(task.answer, n)
  const a0 = task.data.a0?.[0] ?? 0
  expect(sameN(eq.residual(X, a0), zeroN(n)), `${context}: X erfüllt die Gleichung`).toBe(true)
  expect(X.flat().every(Number.isInteger), context).toBe(true)
  if (eq.wrap === 2) {
    expect(inverseN(X), context).not.toBeNull()
    return
  }
  // eigenständig gelöst: genau eine Lösung, und es ist X
  const J = linearPart(eq, a0)
  const Ji = inverseN(J)
  expect(Ji, context).not.toBeNull()
  const rhs = eq.residual(zeroN(n), a0).flat().map((x) => [-x])
  expect(sameN(rowsOf(mulN(Ji!, rhs).flat(), n), X), context).toBe(true)
  if (task.data.roots) {
    const zeros: number[] = []
    for (let a = -30; a <= 30; a++) if (!inverseN(linearPart(eq, a))) zeros.push(a)
    expect(zeros, context).toEqual([...task.data.roots].sort((p, q) => p - q))
  }
}

const valueOf = (latex: string) => {
  const r = parseLatex(latex.trim())
  if (!r.ok) throw new Error(latex)
  return evaluate(r.expr, {})
}
// Matrix aus einer Antwort „… = \begin{pmatrix} … \end{pmatrix}“
function matrixOf(content: string): N {
  const body = /\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/s.exec(content)![1]
  return body.split('\\\\').map((r) => r.split('&').map((x) => valueOf(x)))
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -|\+ \+|\(\s*\)|\\frac\{1\}\{1\}|\b1E\b|\b1X\b/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind !== 'math') continue
    expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
    expect(segment.latex.replace(/\\text\{[^}]*\}/g, ''), `${context}: ${segment.latex}`).not.toMatch(/\b(oder|und|für|genau)\b/)
  }
}

describe('Matrizengleichungen', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(MGL_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      verify(task, context)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect(parts!.flatMap((p) => p.values), context).toEqual([...task.answer])
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      expect(task.steps.some((s) => s.id === 'malnehmen'), context).toBe(true)
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
    expect(MGL_DISCARDED.count).toBe(0)
  })

  it('Klammer M und rechte Seite passen zur Gleichung, falsche nicht', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const eq = equationOf(task)
        const a0 = task.data.a0?.[0] ?? 0
        const klammer = task.steps.find((s) => s.id === 'klammer')
        if (klammer) {
          // linker Teil der Gleichung (ohne die gegebenen Matrizen) ist M·Y bzw. Y·M, bei ganz transponierter Gleichung transponiert
          const M = matrixOf(klammer.choices.find((c) => c.correct)!.content)
          const Y = rowsOf(Array.from({ length: eq.n * eq.n }, (_, i) => ((i * 7) % 5) - 2), eq.n)
          let got = addN(eq.residual(Y, a0), scaleN(-1, eq.residual(zeroN(eq.n), a0)))
          if (eq.wrap === 3) got = transposeN(got)
          expect(sameN(got, eq.side === 0 ? mulN(M, Y) : mulN(Y, M)), `${task.form} klammer`).toBe(true)
          for (const w of klammer.choices.filter((c) => !c.correct)) expect(sameN(matrixOf(w.content), M), `${task.form} ${w.errorRuleId}`).toBe(false)
          checked++
        }
        const rechts = task.steps.find((s) => s.id === 'rechts')
        if (rechts) {
          const R = matrixOf(rechts.choices.find((c) => c.correct)!.content)
          const want = scaleN(-1, eq.wrap === 3 ? transposeN(eq.constPart) : eq.constPart)
          expect(sameN(R, want), `${task.form} rechts`).toBe(true)
          for (const w of rechts.choices.filter((c) => !c.correct)) expect(sameN(matrixOf(w.content), R), `${task.form} ${w.errorRuleId}`).toBe(false)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(500)
  })

  it('Bild bei 2 × 2 (Schritt 12c): X verzerrt das Gitter, die Probe bringt die Spalten auf R, der Fehler nicht', () => {
    const par = (M: N) => [[0, 0], [M[0][0], M[1][0]], [M[0][0] + M[0][1], M[1][0] + M[1][1]], [M[0][1], M[1][1]]]
    const pts = (ps: readonly (readonly number[])[]) => ps.map((p) => [...p])
    const col = (M: N, j: number) => [M[0][j], M[1][j]]
    let drawings = 0
    let probes = 0
    let mistakes = 0
    const sides = new Set<number>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 120)) {
        const d = task.resultDrawing
        const eq = equationOf(task)
        if (eq.n === 3) {
          expect(d, task.form).toBeUndefined()
          continue
        }
        if (!d) continue
        drawings++
        const context = `${task.form}`
        const X = rowsOf(task.answer, 2)
        const a0 = task.data.a0?.[0] ?? 0
        // Einheitsquadrat wird zum Parallelogramm der Spalten von X, die Gitterlinien liegen darin
        const xPar = d.polygons.find((p) => p.color === 'c')!
        expect(sameN(pts(xPar.points), par(X)), context).toBe(true)
        expect(sameN(pts(xPar.from!), [[0, 0], [1, 0], [1, 1], [0, 1]]), context).toBe(true)
        for (const [j, label] of ['\\vec x_1', '\\vec x_2'].entries()) expect(sameN([[...d.arrows.find((a) => a.label === label)!.to]], [col(X, j)]), context).toBe(true)
        const Xi = inverseN(X)
        if (Xi)
          for (const sg of d.segments.filter((x) => x.color === 'c'))
            for (const q of [sg.from, sg.to]) {
              const back = mulN(Xi, [[q[0]], [q[1]]]).flat()
              expect(back.every((v) => v > -1e-9 && v < 1 + 1e-9), context).toBe(true)
            }
        expectRenderable(d.caption, context)
        // keine zwei Pfeile von X, M, R oder dem Fehler liegen übereinander
        const tips = [...d.arrows.filter((a) => !a.ghost), ...(d.mistake?.arrows ?? [])].map((a) => a.to)
        tips.forEach((p, i) => tips.forEach((q, j) => j > i && expect(Math.abs(p[0] * q[1] - p[1] * q[0]) > 1e-9 || p[0] * q[0] + p[1] * q[1] < 0, context).toBe(true)))
        const rPar = d.polygons.find((p) => p.color === 'r')
        if (!rPar) {
          expect(d.mistake, context).toBeUndefined()
          continue
        }
        probes++
        sides.add(eq.side)
        expect([4, 5], context).not.toContain(eq.wrap)
        // rechte Seite R und Matrix M der aufgelösten Gleichung M X = R bzw. X M = R, eigenständig aus der Gleichung
        const R = scaleN(-1, eq.wrap === 3 ? transposeN(eq.constPart) : eq.constPart)
        let M: N
        if (eq.wrap === 2) M = inverseN(rowsOf(task.data.A, 2))!
        else {
          const got = addN(eq.residual([[1, 0], [0, 1]], a0), scaleN(-1, eq.residual(zeroN(2), a0)))
          M = eq.wrap === 3 ? transposeN(got) : got
        }
        expect(sameN(eq.side === 0 ? mulN(M, X) : mulN(X, M), R), context).toBe(true)
        expect(sameN(pts(rPar.points), par(R)), context).toBe(true)
        expect(sameN(pts(rPar.from!), par(eq.side === 0 ? X : M)), context).toBe(true)
        if (eq.side === 1) for (const [j, label] of ['\\vec m_1', '\\vec m_2'].entries()) expect(sameN([[...d.arrows.find((a) => a.label === label)!.to]], [col(M, j)]), context).toBe(true)
        if (d.mistake) {
          mistakes++
          // X von der falschen Seite: X' = R M⁻¹ bzw. M⁻¹ R; das Produkt landet nicht auf R
          const Mi = inverseN(M)!
          const W = eq.side === 0 ? mulN(R, Mi) : mulN(Mi, R)
          const WR = eq.side === 0 ? mulN(M, W) : mulN(W, M)
          expect(sameN(pts(d.mistake.polygons![0].points), par(WR)), context).toBe(true)
          expect(sameN(WR, R), context).toBe(false)
          expectRenderable(d.mistake.caption, context)
        }
      }
    }
    expect(drawings).toBeGreaterThan(350)
    expect(probes).toBeGreaterThan(150)
    expect(mistakes).toBeGreaterThan(25)
    expect([...sides].sort()).toEqual([0, 1])
  })

  it('jede Art der Angabe kommt vor: ordnen, ausklammern, beide Seiten, Transponierte, Inverse, AXA⁻¹, ganz transponiert, Gauß-Jordan', () => {
    const wraps = new Set<number>()
    const sides = new Set<number>()
    const ids = new Set<string>()
    for (const level of LEVELS)
      for (const task of tasks(level, 100)) {
        wraps.add(task.data.shape[2])
        sides.add(task.data.shape[1])
        for (const s of task.steps) ids.add(s.id)
      }
    expect([...wraps].sort()).toEqual([0, 1, 2, 3, 4, 5])
    expect([...sides].sort()).toEqual([0, 1])
    for (const id of ['aufloesen', 'ordnen', 'ausklammern', 'malnehmen', 'klammer', 'rechts', 'det', 'inverse', 'produkt', 'produkt-2', 'det-a', 'bedingung', 'ablesen']) expect(ids.has(id), id).toBe(true)
  })

  it.each(cells)('Stufe %i: Abwechslung (100 Formen unter 200, keine über 3 %)', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art kommt vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 60)) seen.add(task.kind)
    expect([...seen].sort()).toEqual([...new Set(Object.values(MGL_KINDS_BY_LEVEL).flat())].sort())
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Matrizengleichungen: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(MGL_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const id of used) expect(shown.has(id), id).toBe(true)
    for (const rule of MGL_ERROR_RULES) {
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      // oxlint-disable-next-line no-control-regex
      for (const text of [rule.name, rule.wrongFormula, rule.why.detailed, rule.why.short]) expect(text, rule.id).not.toMatch(/[\u0000-\u001f]/)
    }
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(MGL_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        verify(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(6)
  })
})

// Zahlen als LaTeX für den freien Modus
const latexOf = (x: number) => (Number.isInteger(x) ? String(x) : String(x))

describe('Matrizengleichungen: freier Modus', () => {
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
              check.parts.map((p, j) => (j === i ? w.values : p.values).map((x) => (Number.isInteger(x) ? String(x) : fracLatex(x)))),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    for (const id of ['mgl-mult-side', 'inv-not-inverted', 'mat-entrywise']) expect(found.has(id), id).toBe(true)
  })
})

function fracLatex(x: number): string {
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}
