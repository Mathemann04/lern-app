import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { MATRIX_ERROR_RULES } from './matrixErrorRules.ts'
import { MATRIX_KINDS_BY_LEVEL } from './matrixTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 8a: Baustein „Matrizen rechnen“ der Tätigkeit „Matrizen und Gleichungssysteme“. Jede Aufgabe wird
// unabhängig mit Kommazahlen nachgerechnet (eigene Matrizenrechnung, nicht die der Engine); keine falsche Antwort ist
// gleich der richtigen; jeder Fehler kommt vor und steht auf einer Karte; Abwechslung je Stufe; freier Modus.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('matrix', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const reshapeRows = (flat: readonly number[], m: number, n: number): N => Array.from({ length: m }, (_, i) => flat.slice(i * n, (i + 1) * n))
const tr = (A: N): N => A[0].map((_, j) => A.map((r) => r[j]))
const mm = (A: N, B: N): N => {
  expect(A[0].length).toBe(B.length)
  return A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)))
}
const lin = (k: number, A: N, l: number, B: N): N => A.map((r, i) => r.map((x, j) => k * x + l * B[i][j]))
const flat = (A: N) => A.flat()
const sameFlat = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => close(x, b[i]))

// Vorschriften der Art matBuild, hier noch einmal unabhängig aufgeschrieben (gleiche Reihenfolge wie in matrixTasks.ts)
const RULES: readonly ((i: number, j: number) => number)[] = [
  (i, j) => i - j,
  (i, j) => 2 * i - j,
  (i, j) => i - 2 * j,
  (i, j) => i * i - j,
  (i, j) => j * j - i,
  (i, j) => i * j - j,
  (i, j) => i + 2 * j - 4,
  (i, j) => 3 * i - 2 * j,
  (i, j) => j - 2 * i + 1,
  (i, j) => i * (j - 2),
]

function expected(task: VectorTask): number[] {
  const d = task.data
  switch (task.kind) {
    case 'matBuild': {
      const [m, n] = d.shape
      return flat(Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => RULES[d.rule[0]](i + 1, j + 1))))
    }
    case 'matLinear': {
      const [m0, n0] = d.shapeA
      const A0 = reshapeRows(d.A, m0, n0)
      const A = d.t[0] ? tr(A0) : A0
      const [k, l] = d.kl
      const B = l !== 0 ? reshapeRows(d.B, A.length, A[0].length) : A.map((r) => r.map(() => 0))
      return flat(lin(k, A, l, B))
    }
    case 'matTranspose':
      return flat(tr(reshapeRows(d.A, d.shape[0], d.shape[1])))
    case 'matProduct': {
      const [m, n, p] = d.shape
      return flat(mm(reshapeRows(d.A, m, n), reshapeRows(d.B, n, p)))
    }
    case 'matVector': {
      const dim = d.x.length
      return flat(mm(reshapeRows(d.A, dim, dim), d.x.map((x) => [x])))
    }
    case 'matDefined': {
      const X = reshapeRows(d.X, d.fx[0], d.fx[1])
      const Y = reshapeRows(d.Y, d.fy[0], d.fy[1])
      const kind = ['prod', 'sum', 'tprodL', 'tprodR', 'tsum'][d.kind[0]]
      if (kind === 'prod') return flat(mm(X, Y))
      if (kind === 'tprodL') return flat(mm(tr(X), Y))
      if (kind === 'tprodR') return flat(mm(X, tr(Y)))
      if (kind === 'tsum') return flat(lin(1, tr(X), 1, Y))
      throw new Error(kind)
    }
    case 'matTransposeProduct': {
      const [m, n, p] = d.shape
      return flat(tr(mm(reshapeRows(d.A, m, n), reshapeRows(d.B, n, p))))
    }
    case 'matOuter': {
      const u = d.u.map((x) => [x])
      const v = d.v.map((x) => [x])
      return d.outer[0] ? flat(mm(u, tr(v))) : [d.u.reduce((s, x, i) => s + x * d.v[i], 0)]
    }
    case 'matParam': {
      const n = d.dim[0]
      const A = reshapeRows(d.A, n, n)
      const B = reshapeRows(d.B, n, n)
      // mit dem Wert vertauschbar, mit einem anderen nicht (die Bedingung ist linear im Parameter: genau ein Wert)
      expect(sameFlat(flat(mm(A, B)), flat(mm(B, A)))).toBe(true)
      const other = A.map((r, i) => r.map((x, j) => (i === d.pos[0] && j === d.pos[1] ? x + 1 : x)))
      expect(sameFlat(flat(mm(other, B)), flat(mm(B, other)))).toBe(false)
      return [A[d.pos[0]][d.pos[1]]]
    }
    case 'matExpression': {
      const M0 = reshapeRows(d.M0, d.F0[0], d.F0[1])
      const k = d.k[0]
      if (d.variant[0] === 0) {
        const M1 = reshapeRows(d.M1, d.F1[0], d.F1[1])
        const M2 = reshapeRows(d.M2, d.F2[0], d.F2[1])
        return flat(lin(1, mm(M0, tr(M1)), -Math.abs(k), M2))
      }
      if (d.variant[0] === 1) {
        const M1 = reshapeRows(d.M1, d.F1[0], d.F1[1])
        const M2 = reshapeRows(d.M2, d.F2[0], d.F2[1])
        return flat(mm(tr(lin(1, M0, k, M1)), M2))
      }
      const G = mm(tr(M0), M0)
      return flat(G.map((r, i) => r.map((x, j) => x - (i === j ? Math.abs(k) : 0))))
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

describe('Matrizen rechnen', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(MATRIX_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expect(sameFlat(task.answer, expected(task)), `${context}: ${task.answer.join(',')}`).toBe(true)
      expectRenderable(task.instruction, context)
      if (task.note) expectRenderable(task.note, context)
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
          expect(MATRIX_ERROR_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        if (step.drawing) checkDrawing(step.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      if (task.resultDrawing) checkDrawing(task.resultDrawing, context)
    }
  })

  it('keine falsche Antwort hat denselben Wert wie die richtige (gleiches Format, gleiche Zahlen)', () => {
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
    expect(compared).toBeGreaterThan(600)
  })

  it('Bild bei Matrix mal Vektor: Spitzen sind A e₁, A e₂ und A x, das Parallelogramm hat die Spalten als Seiten', () => {
    let drawn = 0
    for (const task of tasks(2, 150).filter((t) => t.kind === 'matVector')) {
      const d = task.data
      const A = reshapeRows(d.A, 2, 2)
      const arrows = task.resultDrawing!.arrows
      const tip = (label: string) => arrows.find((a) => a.label === label)!.to
      const name = task.functionLatex!.charAt(0)
      expect(sameFlat(tip(`${name}\\vec e_1`), [A[0][0], A[1][0]]), task.form).toBe(true)
      expect(sameFlat(tip(`${name}\\vec e_2`), [A[0][1], A[1][1]]), task.form).toBe(true)
      expect(sameFlat(tip(`${name}\\vec x`), task.answer), task.form).toBe(true)
      const par = task.resultDrawing!.polygons[1].points
      expect(sameFlat(par[2] as number[], [A[0][0] + A[0][1], A[1][0] + A[1][1]]), task.form).toBe(true)
      // vor dem Ergebnis kein Bild der Spalten
      expect(task.steps[0].drawing!.arrows.some((a) => a.label?.includes(name)), task.form).toBe(false)
      drawn++
    }
    expect(drawn).toBeGreaterThan(20)
  })

  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

// kleine Rechnung aus der Erklärung (ganze Zahlen, +, −, \cdot, Klammern) unabhängig auswerten
function evalSimple(latex: string): number {
  const tokens = latex.replace(/\\cdot/g, '*').match(/\d+|[-+*()]/g) ?? []
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

describe('Matrizen rechnen: Funde der Prüfung', () => {
  it('die Rechnung „oben links“ in der Erklärung stimmt (auch mit negativer Zahl vorn)', () => {
    let checked = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 150))
        for (const step of task.steps) {
          const m = /oben links (?:ist )?\$([^$=]+) = (-?\d+)\$/.exec(step.explanation.detailed)
          if (!m) continue
          expect(evalSimple(m[1]) === Number(m[2]), `${task.form} ${step.id}: ${m[0]}`).toBe(true)
          checked++
        }
    expect(checked).toBeGreaterThan(100)
  })

  it('der Tipp zum Format verrät kein Format, und beim Parameter steht die Lösung nicht als Eintrag in der zweiten Matrix', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 150)) {
        for (const step of task.steps.filter((s) => s.id === 'format')) expect(step.hint, task.form).not.toContain('\\times')
        if (task.kind === 'matParam') {
          const n = task.data.dim[0]
          expect(task.data.B[task.data.pos[0] * n + task.data.pos[1]], task.form).not.toBe(task.answer[0])
        }
      }
  })
})

describe('Matrizen rechnen: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(MATRIX_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const rule of MATRIX_ERROR_RULES) expect(shown.has(rule.id), rule.id).toBe(true)
    for (const rule of MATRIX_ERROR_RULES) expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const card of cardsInTopic('matrizen')) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        expect(sameFlat(task.answer, expected(task)), card.id).toBe(true)
        examples++
      }
    }
    expect(examples).toBe(14)
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

describe('Matrizen rechnen: freier Modus', () => {
  it('liest Matrizen mit ihrer Spaltenzahl, nimmt das Ergebnis an und markiert einen falschen Eintrag', () => {
    let matrices = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => p.values.map(entry))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        const part = check.parts[0]
        if (part.shape !== 'matrix') continue
        expect(part.cols, task.form).toBeGreaterThan(1)
        // ein Eintrag falsch: genau dieser markiert
        const changed = [input[0].map((x, i) => (i === 1 ? entry(part.values[1] + 1) : x))]
        const verdict = checkVectorEntries(check, changed)
        expect(verdict.kind, task.form).toBe('wrong')
        expect(verdict.marks![0].map((m, i) => (m ? i : -1)).filter((i) => i >= 0), task.form).toEqual([1])
        matrices++
      }
    }
    expect(matrices).toBeGreaterThan(150)
  })

  it('erkennt typische Fehler aus den Schritten (z. B. Reihenfolge vertauscht, an der falschen Diagonale gespiegelt)', () => {
    const found = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        for (const w of check.wrongs[0]) {
          const verdict = checkVectorEntries(check, [w.values.map(entry)])
          expect(verdict.kind, task.form).toBe('wrong')
          if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
        }
      }
    }
    for (const id of ['mat-order-swap', 'mat-transpose-anti', 'mat-transpose-reshape', 'mat-scalar-row', 'mat-index-swap', 'mat-col-row']) expect(found.has(id), id).toBe(true)
  })
})

// M7 Schritt 8b: Falk-Schema als Bild zum Abspielen. Linke und rechte Matrix, Produkt und jedes Teilprodukt werden
// unabhängig mit Kommazahlen nachgerechnet; das Bild gehört genau zu den Schritten „Eintrag“ und „Produkt“ und passt zu
// dem, was der Schritt danach feststellt.
describe('Matrizen rechnen: Falk-Schema zum Abspielen', () => {
  // Zahl aus LaTeX: ganze Zahl oder Bruch, auch negativ, ohne Parameter
  const num = (s: string): number | null => {
    const t = s.replace(/^\((.*)\)$/, '$1').trim()
    const frac = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(t)
    if (frac) return (frac[1] ? -1 : 1) * (Number(frac[2]) / Number(frac[3]))
    return /^-?\d+$/.test(t) ? Number(t) : null
  }
  const numMat = (M: readonly (readonly string[])[]): N | null => {
    const out = M.map((r) => r.map(num))
    return out.flat().every((x) => x !== null) ? (out as N) : null
  }

  it('jedes Schema stimmt mit der Gegenprobe, die Teilprodukte sind Zeile mal Spalte, die Felder passen zum Schritt', () => {
    let numeric = 0
    let withParam = 0
    const ids = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 120)) {
        for (const step of task.steps) {
          const where = `${level}-${task.ref.seed} ${task.form} ${step.id}`
          const isProduct = step.id === 'eintrag' || step.id.startsWith('produkt')
          expect(!!step.falk, where).toBe(isProduct)
          const f = step.falk
          if (!f) continue
          ids.add(step.id)
          const m = f.left.length
          const n = f.top.length
          const p = f.top[0].length
          expect(f.left.every((r) => r.length === n), where).toBe(true)
          expect(f.product.length, where).toBe(m)
          expect(f.product.every((r) => r.length === p), where).toBe(true)
          // Teilprodukte: k-tes ist Eintrag (i, k) links mal Eintrag (k, j) oben
          const strip = (s: string) => s.replace(/^\((.*)\)$/, '$1')
          for (let i = 0; i < m; i++)
            for (let j = 0; j < p; j++) {
              expect(f.terms[i][j].length, where).toBe(n)
              f.terms[i][j].forEach((t, k) => {
                const [x, y] = t.split(' \\cdot ')
                expect([strip(x), strip(y)], where).toEqual([f.left[i][k], f.top[k][j]])
              })
            }
          for (const tex of [...f.left.flat(), ...f.top.flat(), ...f.product.flat(), ...f.terms.flat(2)]) expect(latexProblem(tex, { checkUgly: false }), `${where}: ${tex}`).toBeNull()
          // Felder: beim Eintrag genau einer, beim Produkt alle in Lesereihenfolge
          if (step.id === 'eintrag' || m * p === 1) expect(f.cells.length, where).toBe(1)
          else expect(f.cells, where).toEqual(Array.from({ length: m * p }, (_, c) => [Math.floor(c / p), c % p]))
          // was der Schritt feststellt, steht im Schema
          const fact = (Array.isArray(step.established) ? step.established : [step.established]).join(' ')
          for (const [i, j] of f.cells) expect(fact, where).toContain(f.product[i][j])
          if (m * p === 1) expect([`${f.name} = ${f.product[0][0]}`, `${f.name} = \\begin{pmatrix} ${f.product[0][0]} \\end{pmatrix}`], where).toContain(fact)
          else if (step.id === 'eintrag') {
            const [i, j] = f.cells[0]
            expect(fact, where).toBe(`(${f.name})_{${i + 1}${j + 1}} = ${f.product[i][j]}`)
          } else expect(fact, where).toContain(`\\begin{pmatrix} ${f.product.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`)
          // unabhängig nachgerechnet
          const L = numMat(f.left)
          const R = numMat(f.top)
          if (L && R) {
            const C = mm(L, R)
            const P = numMat(f.product)!
            expect(sameFlat(flat(P), flat(C)), where).toBe(true)
            for (let i = 0; i < m; i++)
              for (let j = 0; j < p; j++) {
                const sum = f.terms[i][j].reduce((s, t) => s + t.split(' \\cdot ').map((x) => num(x)!).reduce((a, b) => a * b, 1), 0)
                expect(close(sum, C[i][j]), where).toBe(true)
              }
            numeric++
          } else withParam++
        }
      }
    }
    expect(numeric).toBeGreaterThan(200)
    expect(withParam).toBeGreaterThan(5)
    expect(ids.has('eintrag') && ids.has('produkt') && ids.has('produkt-ab') && ids.has('produkt-ba')).toBe(true)
  })

  it('die Lernkarte zum Produkt zeigt ein Schema in jedem Beispiel', () => {
    const card = cardById('mat-produkt')!
    for (const ex of card.examples.filter(isVectorExample)) {
      const task = buildVectorTask({ level: ex.vector.level, seed: blockSeed('rechnen', ex.vector.seed) }, ex.vector.kind)
      expect(task.steps.some((s) => s.falk), ex.vector.kind).toBe(true)
    }
  })
})
