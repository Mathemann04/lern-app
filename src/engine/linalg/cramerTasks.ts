import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Quad, quadAt, quadLatex, termsLatex } from './crossTasks.ts'
import { type Lin, type Mat, type PMat, DET_CARD, at, det, lin, linFactor, linLatex, paramMatrix, pmat, polyOf, sarrusStep } from './detTasks.ts'
import { type VectorDrawing, emptyDrawing } from './figures.ts'
import { paramSlider, systemDrawing } from './gaussFigures.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex, vecLatex } from './vec.ts'

// Baustein „Cramersche Regel“ (M7 Schritt 11a) der Tätigkeit „Matrizen und Gleichungssysteme“: Ein quadratisches
// Gleichungssystem $A\vec x = \vec b$ mit $\det A \ne 0$ hat genau eine Lösung, jede Unbekannte ist
// $\det A_k / \det A$, wobei in $A_k$ die Spalte der Unbekannten durch $\vec b$ ersetzt ist. Stufe 1 und 2 ohne
// Parameter (2 × 2 ganz, 3 × 3 nur eine Unbekannte), Stufe 3 zwei Unbekannte mit Cramer und die dritte durch Einsetzen,
// Stufe 4 und 5 mit Parameter $a$ in der Matrix: wann anwendbar, die Unbekannte als Bruch in $a$ und für welches $a$ sie
// einen vorgegebenen Wert hat (Stufe 5 auch mit einem Wert, bei dem $\det A = 0$ wäre und der wegfällt). Alles exakt mit
// Brüchen, Determinanten als Polynom in $a$ (höchstens quadratisch, `polyOf` aus detTasks.ts).

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)
const PARAM = 'a'

export const CRAMER_CARD = {
  regel: 'cramer-regel',
  parameter: 'cramer-parameter',
} as const

const VARS = ['x', 'y', 'z'] as const
const constMat = (A: Mat): PMat => A.map((r) => r.map((x) => lin(x)))
const hasParam = (A: PMat) => A.some((r) => r.some((x) => !isZero(x.c1)))

// ------------------------------------------------------------------ Polynome in a (höchstens quadratisch)

const qConst = (x: Rational): Quad => ({ q2: ZERO, q1: ZERO, q0: x })
const qSub = (p: Quad, q: Quad): Quad => ({ q2: ratSub(p.q2, q.q2), q1: ratSub(p.q1, q.q1), q0: ratSub(p.q0, q.q0) })
const qScale = (k: Rational, q: Quad): Quad => ({ q2: ratMul(k, q.q2), q1: ratMul(k, q.q1), q0: ratMul(k, q.q0) })
const qIsZero = (q: Quad) => isZero(q.q2) && isZero(q.q1) && isZero(q.q0)
const qIsConst = (q: Quad) => isZero(q.q2) && isZero(q.q1)
const qLatex = (q: Quad) => quadLatex(q, PARAM)
const dq = (A: PMat) => polyOf(A, det)

// rationale Wurzel einer nicht negativen Zahl (null, wenn sie nicht aufgeht)
function ratSqrt(x: Rational): Rational | null {
  if (ratSign(x) < 0) return null
  const s = (v: bigint) => {
    const r = BigInt(Math.round(Math.sqrt(Number(v))))
    return r * r === v ? r : null
  }
  const [n, d] = [s(x.n), s(x.d)]
  return n === null || d === null ? null : rat(n, d)
}

// rationale Nullstellen, aufsteigend (null: keine rationale, unendlich viele oder keine)
export function roots(q: Quad): Rational[] | null {
  if (isZero(q.q2)) {
    if (isZero(q.q1)) return null
    return [ratDiv(ratNeg(q.q0), q.q1)]
  }
  const disc = ratSub(ratMul(q.q1, q.q1), ratMul(R(4), ratMul(q.q2, q.q0)))
  const w = ratSqrt(disc)
  if (!w) return null
  const two = ratMul(R(2), q.q2)
  const r = [ratDiv(ratSub(ratNeg(q.q1), w), two), ratDiv(ratAdd(ratNeg(q.q1), w), two)]
  const sorted = ratSign(ratSub(r[0], r[1])) <= 0 ? r : [r[1], r[0]]
  return isZero(w) ? [sorted[0]] : sorted
}

// Bruch zweier Polynome; gleich, wenn über Kreuz malgenommen dasselbe herauskommt (Grad höchstens 4: sieben Stellen)
type Frac = { readonly num: Quad; readonly den: Quad }
const SAMPLES = [-3, -2, -1, 0, 1, 2, 3].map(R)
const fracEq = (f: Frac, g: Frac) => SAMPLES.every((t) => ratEq(ratMul(quadAt(f.num, t), quadAt(g.den, t)), ratMul(quadAt(g.num, t), quadAt(f.den, t))))
const fracLatex = (f: Frac) => (qIsZero(f.num) ? '0' : `\\frac{${qLatex(f.num)}}{${qLatex(f.den)}}`)

// ------------------------------------------------------------------ Matrizen und Schreibweisen

const replaceCol = (A: PMat, k: number, b: readonly Rational[]): PMat => A.map((r, i) => r.map((x, j) => (j === k ? lin(b[i]) : x)))
const replaceRow = (A: PMat, k: number, b: readonly Rational[]): PMat => A.map((r, i) => (i === k ? b.map((x) => lin(x)) : r))
const samePMat = (A: PMat, B: PMat) => A.every((r, i) => r.every((x, j) => ratEq(x.c0, B[i][j].c0) && ratEq(x.c1, B[i][j].c1)))
const matName = (k: number) => `A_${VARS[k]}`

// Glied „Zahl mal Variable“ mit Parameter: 2x, -x, a\,x, -2a\,x, (a + 1)\,y
function termLatex(x: Lin, v: string, first: boolean): string {
  if (isZero(x.c0) && isZero(x.c1)) return ''
  const sign = (neg: boolean) => (first ? (neg ? '-' : '') : neg ? ' - ' : ' + ')
  if (isZero(x.c1)) {
    const abs = ratAbs(x.c0)
    return `${sign(ratSign(x.c0) < 0)}${isOne(abs) ? '' : ratLatex(abs)}${v}`
  }
  if (isZero(x.c0)) {
    const abs = ratAbs(x.c1)
    return `${sign(ratSign(x.c1) < 0)}${isOne(abs) ? '' : ratLatex(abs)}${PARAM}\\,${v}`
  }
  return `${sign(false)}(${linLatex(x)})\\,${v}`
}
function equationLatex(row: readonly Lin[], rhs: Rational): string {
  let out = ''
  row.forEach((x, j) => {
    out += termLatex(x, VARS[j], out === '')
  })
  return `${out} = ${ratLatex(rhs)}`
}
const ROMAN = ['I', 'II', 'III'] as const
const systemLatex = (A: PMat, b: readonly Rational[]) =>
  `\\begin{array}{ll} ${A.map((r, i) => `\\text{${ROMAN[i]}:} & ${equationLatex(r, b[i])}`).join(' \\\\ ')} \\end{array}`

const negCount = (A: PMat, b: readonly Rational[]) => [...A.flat().map((x) => x.c0), ...b].filter((x) => ratSign(x) < 0).length
const paramMask = (A: PMat) => A.flatMap((r, i) => r.map((x, j) => (isZero(x.c1) ? '' : `${i}${j}`))).join('')

// ------------------------------------------------------------------ Schritte

export type CramerCtx = { readonly A: PMat; readonly b: readonly Rational[]; readonly n: number }

const valueLine = (name: string, q: Quad) => math(`${name} = ${qLatex(q)}`)
function valueWrongs(name: string, right: Quad, cands: readonly (readonly [Quad | null, string])[]): Wrong[] {
  const out: Wrong[] = []
  const seen: Quad[] = [right]
  for (const [q, rule] of cands) {
    if (!q || seen.some((s) => qIsZero(qSub(s, q)))) continue
    seen.push(q)
    out.push({ content: valueLine(name, q), rule })
  }
  return out
}

const det2Latex = (M: PMat) => `${linFactor(M[0][0])} \\cdot ${linFactor(M[1][1])} - ${linFactor(M[0][1])} \\cdot ${linFactor(M[1][0])}`
const D2 = {
  plus: (M: Mat) => ratAdd(ratMul(M[0][0], M[1][1]), ratMul(M[0][1], M[1][0])),
  swap: (M: Mat) => ratSub(ratMul(M[0][1], M[1][0]), ratMul(M[0][0], M[1][1])),
  rows: (M: Mat) => ratSub(ratMul(M[0][0], M[0][1]), ratMul(M[1][0], M[1][1])),
}

// Determinante von A bzw. A_k: 2 × 2 mit Formel (falsch auch Zeile statt Spalte ersetzt, andere Spalte), 3 × 3 mit Sarrus
export function detStep(rng: Rng, ctx: CramerCtx, k: number | null, id: string, cards: readonly string[]): GuidedStep {
  const { A, b, n } = ctx
  const M = k === null ? A : replaceCol(A, k, b)
  const name = `\\det ${k === null ? 'A' : matName(k)}`
  const intro = k === null ? '' : ` Dabei ist $${matName(k)}$ die Matrix $A$, in der die Spalte von $${VARS[k]}$ durch $\\vec b$ ersetzt ist.`
  if (n === 3) {
    const step = sarrusStep(rng, name, M, { id, cards })
    return k === null ? step : { ...step, question: `${step.question}${intro}\n$${matName(k)} = ${pmat(M)}$` }
  }
  const right = dq(M)
  const cands: [Quad, string][] = [
    [polyOf(M, D2.plus), 'det-2-plus'],
    [polyOf(M, D2.swap), 'det-2-swap'],
    [polyOf(M, D2.rows), 'det-2-rows'],
  ]
  if (k !== null) {
    cands.unshift([dq(replaceRow(A, k, b)), 'cramer-row'], [dq(replaceCol(A, 1 - k, b)), 'cramer-col'])
  }
  const ordered = k === null ? rng.shuffle(cands) : [...rng.shuffle(cands.slice(0, 2)), ...rng.shuffle(cands.slice(2))]
  const products = det2Latex(M)
  const shown = `$${name} = ${products} = ${qLatex(right)}$`
  return choiceStep(rng, {
    id,
    title: k === null ? 'Determinante' : `Determinante für $${VARS[k]}$`,
    question: k === null ? `Wie groß ist $\\det A$ für $A = ${pmat(A)}$?` : `Wie groß ist $${name}$?${intro}`,
    correct: valueLine(name, right),
    wrongs: valueWrongs(name, right, ordered),
    hint:
      k === null
        ? 'Hauptdiagonale (oben links mal unten rechts) minus Nebendiagonale (oben rechts mal unten links).'
        : `Schreib $A$ ab und ersetze die ${k + 1}. **Spalte** (die Zahlen vor $${VARS[k]}$) durch $\\vec b$. Dann Hauptdiagonale minus Nebendiagonale.`,
    explanation: {
      detailed: `${k === null ? '' : `$${matName(k)} = ${pmat(M)}$: Die ${k + 1}. Spalte von $A$ ist durch $\\vec b = ${vecLatex(b)}$ ersetzt. `}Hauptdiagonale minus Nebendiagonale: ${shown}.`,
      short: shown,
    },
    established: [`${name} = ${qLatex(right)}`],
    cards,
  })
}

// Welche Matrix ist A_k? (3 × 3) Falsch: Zeile ersetzt, andere Spalten ersetzt
function matrixStep(rng: Rng, ctx: CramerCtx, k: number, cards: readonly string[]): GuidedStep {
  const { A, b } = ctx
  const right = replaceCol(A, k, b)
  const cands: [PMat, string][] = [[replaceRow(A, k, b), 'cramer-row'], ...[0, 1, 2].filter((j) => j !== k).map((j) => [replaceCol(A, j, b), 'cramer-col'] as [PMat, string])]
  const wrongs: Wrong[] = []
  const seen: PMat[] = [right]
  for (const [W, rule] of cands) {
    if (seen.some((S) => samePMat(S, W))) continue
    seen.push(W)
    wrongs.push({ content: math(`${matName(k)} = ${pmat(W)}`), rule })
  }
  return choiceStep(rng, {
    id: `matrix-${VARS[k]}`,
    title: `Matrix für $${VARS[k]}$`,
    question: `Für $${VARS[k]}$ brauchst du die Matrix $${matName(k)}$. Welche ist es?\n$A = ${pmat(A)},\\quad \\vec b = ${vecLatex(b)}$`,
    correct: math(`${matName(k)} = ${pmat(right)}`),
    wrongs,
    hint: `Die Spalten von $A$ gehören zu den Unbekannten: 1. Spalte zu $x$, 2. zu $y$, 3. zu $z$. Für $${VARS[k]}$ ersetzt du **seine Spalte** durch $\\vec b$, die übrigen bleiben.`,
    explanation: {
      detailed: `In $${matName(k)}$ steht $\\vec b$ an der Stelle der Spalte von $${VARS[k]}$, das ist die ${k + 1}. Spalte. Die anderen beiden Spalten bleiben wie in $A$: $${matName(k)} = ${pmat(right)}$.`,
      short: `${k + 1}. Spalte durch $\\vec b$ ersetzt.`,
    },
    cards,
  })
}

// Wert einer Unbekannten: Quotient (ohne Parameter als Zahl, mit Parameter als Bruch in a)
// vector: die übrigen Unbekannten sind bekannt, die Antwort ist gleich die Lösung als Vektor (Schritt „Lösung“)
function quotientStep(rng: Rng, ctx: CramerCtx, k: number, cards: readonly string[], vector?: readonly Rational[]): GuidedStep {
  const { A, b, n } = ctx
  const D = dq(A)
  const Dk = dq(replaceCol(A, k, b))
  const v = VARS[k]
  const withParam = hasParam(A)
  const others = Array.from({ length: n }, (_, j) => j).filter((j) => j !== k)
  const cands: [Frac, string][] = [
    [{ num: D, den: Dk }, 'cramer-flip'],
    [{ num: Dk, den: qConst(ONE) }, 'cramer-no-divide'],
    ...others.map((j) => [{ num: dq(replaceCol(A, j, b)), den: D }, 'cramer-col'] as [Frac, string]),
    [{ num: dq(replaceRow(A, k, b)), den: D }, 'cramer-row'],
  ]
  const right: Frac = { num: Dk, den: D }
  const show = (f: Frac) => {
    if (!withParam) {
      const val = ratDiv(f.num.q0, f.den.q0)
      return vector ? math(`\\vec x = ${vecLatex(vector.map((e, j) => (j === k ? val : e)))}`) : math(`${v} = ${ratLatex(val)}`)
    }
    return math(`${v} = ${qIsConst(f.den) && isOne(f.den.q0) ? qLatex(f.num) : fracLatex(f)}`)
  }
  const wrongs: Wrong[] = []
  const seen: Frac[] = [right]
  for (const [f, rule] of [...rng.shuffle(cands.slice(0, 2)), ...rng.shuffle(cands.slice(2))]) {
    // Kehrwert nur, wenn er definiert ist
    if (qIsZero(f.den) || (!withParam && isZero(f.den.q0)) || seen.some((s) => fracEq(s, f))) continue
    seen.push(f)
    wrongs.push({ content: show(f), rule })
  }
  const quotient = `\\frac{\\det ${matName(k)}}{\\det A}`
  const value = withParam ? fracLatex(right) : `\\frac{${qLatex(Dk)}}{${qLatex(D)}} = ${ratLatex(ratDiv(Dk.q0, D.q0))}`
  const full = withParam ? fracLatex(right) : ratLatex(ratDiv(Dk.q0, D.q0))
  const solution = vector?.map((e, j) => (j === k ? ratDiv(Dk.q0, D.q0) : e))
  return choiceStep(rng, {
    id: vector ? 'loesung' : `wert-${v}`,
    title: vector ? 'Lösung' : `$${v}$ ausrechnen`,
    question: `Mit $\\det A = ${qLatex(D)}$ und $\\det ${matName(k)} = ${qLatex(Dk)}$: ${vector ? `Was ergibt sich für $${v}$, und wie lautet damit die Lösung $\\vec x$?` : `Wie groß ist $${v}$?`}`,
    correct: show(right),
    wrongs,
    hint: `Cramersche Regel: $${v} = ${quotient}$. Oben steht die Determinante mit ersetzter Spalte, unten die von $A$.`,
    explanation: {
      detailed: `Nach der Cramerschen Regel ist $${v} = ${quotient} = ${value}$.${withParam ? ` Das gilt für alle $${PARAM}$ mit $\\det A \\ne 0$.` : ''}`,
      short: `$${v} = ${quotient} = ${value}$.`,
    },
    established: [solution ? `\\vec x = ${vecLatex(solution)}` : `${v} = ${full}`],
    cards,
  })
}

// Für welche a lässt sich die Cramersche Regel anwenden? (det A ≠ 0)
function conditionStep(rng: Rng, D: Quad, rs: readonly Rational[]): GuidedStep {
  const ne = (xs: readonly Rational[]) => math(xs.map((r) => `${PARAM} \\ne ${ratLatex(r)}`).join(' \\text{ und } '))
  const eq = (xs: readonly Rational[]) => math(xs.map((r) => `${PARAM} = ${ratLatex(r)}`).join(' \\text{ oder } '))
  const wrongs: Wrong[] = [
    { content: eq(rs), rule: 'cramer-cond-flip' },
    { content: 'für alle $a$', rule: 'cramer-cond-all' },
  ]
  // Vorzeichen der Nullstellen vertauscht, nur wenn das eine andere Menge ist (nicht bei ±r)
  const flipped = rs.map(ratNeg)
  if (!flipped.every((r) => rs.some((q) => ratEq(q, r)))) wrongs.push({ content: ne(sortRats(flipped)), rule: 'det-root-sign' })
  const zero = rs.map((r) => math(`${PARAM} = ${ratLatex(r)}`)).join(' oder ')
  return choiceStep(rng, {
    id: 'bedingung',
    title: 'Wann anwendbar?',
    question: `Es ist $\\det A = ${qLatex(D)}$. Für welche $${PARAM}$ darfst du die Cramersche Regel anwenden?`,
    correct: ne(rs),
    wrongs,
    hint: 'Die Cramersche Regel teilt durch $\\det A$. Wann geht das nicht?',
    explanation: {
      detailed: `Die Regel teilt durch $\\det A$, und sie gilt nur, wenn das System genau eine Lösung hat. Beides heißt $\\det A \\ne 0$. Es ist $${qLatex(D)} = 0$ genau für ${zero}. Für alle anderen $${PARAM}$ hat das System genau eine Lösung.`,
      short: `$\\det A = ${qLatex(D)} = 0$ für ${zero}; sonst anwendbar.`,
    },
    established: [rs.map((r) => `${PARAM} \\ne ${ratLatex(r)}`).join(',\\; ')],
    cards: [CRAMER_CARD.parameter],
  })
}

// Lösungen als Text: a = 2 bzw. a_1 = …,\; a_2 = …
export function solLatex(xs: readonly Rational[]): string {
  if (xs.length === 1) return `${PARAM} = ${ratLatex(xs[0])}`
  return `${PARAM}_1 = ${ratLatex(xs[0])},\\; ${PARAM}_2 = ${ratLatex(xs[1])}`
}
export const sortRats = (xs: readonly Rational[]) => [...xs].sort((p, q) => ratSign(ratSub(p, q)))

// Für welches a hat die Unbekannte den Wert c? Dk(a) = c · D(a), Werte mit D(a) = 0 fallen weg
function targetStep(rng: Rng, D: Quad, Dk: Quad, k: number, c: Rational, valid: readonly Rational[], excluded: readonly Rational[]): GuidedStep {
  const v = VARS[k]
  const E = qSub(Dk, qScale(c, D))
  const wrongs: Wrong[] = []
  const add = (xs: Rational[] | null, rule: string) => {
    if (xs && xs.length > 0) wrongs.push({ content: math(solLatex(sortRats(xs))), rule })
  }
  if (excluded.length > 0) add([...valid, ...excluded], 'cramer-excluded')
  // quadratisch mit zwei Lösungen: eine vergessen
  if (valid.length === 2) for (const r of rng.shuffle([...valid])) add([r], 'cramer-one-root')
  // Kehrwert: D = c · Dk; nur Zähler: Dk = c
  add(isZero(c) ? null : roots(qSub(D, qScale(c, Dk))), 'cramer-flip')
  add(roots(qSub(Dk, qConst(c))), 'cramer-target-numerator')
  // Vorzeichenfehler beim Auflösen
  if (isZero(E.q2)) add([ratDiv(E.q0, E.q1)], 'cramer-solve-sign')
  else add(roots({ q2: E.q2, q1: ratNeg(E.q1), q0: E.q0 }), 'det-root-sign')
  const eqn = `${qLatex(Dk)} = ${isOne(c) ? '' : `${ratLatex(c)} \\cdot `}(${qLatex(D)})`
  const rs = roots(E)!
  const solved = rs.map((r) => `$${PARAM} = ${ratLatex(r)}$`).join(' und ')
  const dropped = excluded.length > 0 ? ` Aber für $${PARAM} = ${ratLatex(excluded[0])}$ ist $\\det A = 0$: Dort gilt die Regel nicht, das System hat dann keine eindeutige Lösung. Dieser Wert fällt weg.` : ''
  return choiceStep(rng, {
    id: 'vorgabe',
    title: 'Wert vorgegeben',
    question: `Für welche $${PARAM}$ hat das System genau eine Lösung, und zwar mit $${v} = ${ratLatex(c)}$?`,
    correct: math(solLatex(valid)),
    wrongs,
    hint: `Setz den Bruch für $${v}$ gleich $${ratLatex(c)}$ und nimm mit dem Nenner mal. Prüf am Ende, ob $\\det A \\ne 0$ ist.`,
    explanation: {
      detailed: `$${v} = ${ratLatex(c)}$ heißt $\\det ${matName(k)} = ${ratLatex(c)} \\cdot \\det A$, also $${isZero(c) ? `${qLatex(Dk)} = 0` : eqn}$. Zusammengefasst: $${qLatex(E)} = 0$, das ergibt ${solved}.${dropped}`,
      short: `$${qLatex(E)} = 0$${excluded.length > 0 ? `, ohne $${PARAM} = ${ratLatex(excluded[0])}$ (dort $\\det A = 0$)` : ''}: $${solLatex(valid)}$.`,
    },
    established: [solLatex(valid)],
    cards: [CRAMER_CARD.parameter],
  })
}

// letzte Unbekannte durch Einsetzen in eine Gleichung (Fehler wie beim Rückwärts-Einsetzen im Gauß-Verfahren)
function insertStep(rng: Rng, ctx: CramerCtx, x: readonly Rational[], m: number): GuidedStep | null {
  const A = ctx.A.map((r) => r.map((e) => e.c0))
  const rows = rng.shuffle([0, 1, 2]).filter((i) => !isZero(A[i][m]))
  // am liebsten eine Zeile, in der die gesuchte Zahl nicht 1 ist und die anderen mitspielen
  rows.sort((p, q) => Number(isOne(ratAbs(A[q][m]))) - Number(isOne(ratAbs(A[p][m]))))
  const i = rows[0]
  const c = A[i][m]
  const known = [0, 1, 2].filter((j) => j !== m)
  const rest = known.reduce((s, j) => ratAdd(s, ratMul(A[i][j], x[j])), ZERO)
  const bi = ctx.b[i]
  const right = ratDiv(ratSub(bi, rest), c)
  const plain = known.reduce((s, j) => ratAdd(s, ratMul(R(ratSign(A[i][j])), x[j])), ZERO)
  const cands: [Rational | null, string][] = [
    [isZero(rest) ? null : ratDiv(ratAdd(bi, rest), c), 'gauss-backsub-sign'],
    [isOne(c) ? null : ratSub(bi, rest), 'gauss-divide-forgot'],
    [known.some((j) => !isOne(ratAbs(A[i][j])) && !isZero(A[i][j]) && !isZero(x[j])) ? ratDiv(ratSub(bi, plain), c) : null, 'gauss-backsub-coef'],
    [isZero(ratSub(bi, rest)) || isOne(ratAbs(c)) ? null : ratDiv(c, ratSub(bi, rest)), 'gauss-divide-flip'],
  ]
  const full = (val: Rational) => x.map((e, j) => (j === m ? val : e))
  const wrongs: Wrong[] = []
  const seen: Rational[] = [right]
  for (const [w, rule] of rng.shuffle(cands)) {
    if (!w || seen.some((s) => ratEq(s, w))) continue
    seen.push(w)
    wrongs.push({ content: math(`\\vec x = ${vecLatex(full(w))}`), rule })
  }
  if (wrongs.length < 3) return null
  const v = VARS[m]
  const eq = equationLatex(ctx.A[i], bi)
  const knownText = known.map((j) => `$${VARS[j]} = ${ratLatex(x[j])}$`).join(' und ')
  const solved = `${termsLatex([[c, v]])} = ${ratLatex(ratSub(bi, rest))}`
  return choiceStep(rng, {
    id: 'loesung',
    title: 'Dritte Unbekannte',
    question: `Mit ${knownText} brauchst du für $${v}$ keine dritte Determinante: Setz in Gleichung ${ROMAN[i]} ein. Wie lautet die Lösung $\\vec x$?`,
    correct: math(`\\vec x = ${vecLatex(x)}`),
    wrongs,
    hint: 'Bekannte Werte einsetzen, auf die rechte Seite bringen (Vorzeichen wechselt) und durch die Zahl vor der gesuchten Variablen teilen.',
    explanation: {
      detailed: `Gleichung ${ROMAN[i]}: $${eq}$. Mit ${knownText} eingesetzt und nach rechts gebracht: $${solved}$, also $${v} = ${ratLatex(right)}$. Zusammen: $\\vec x = ${vecLatex(x)}$.`,
      short: `$${solved}$, also $${v} = ${ratLatex(right)}$.`,
    },
    established: [`\\vec x = ${vecLatex(x)}`],
    cards: [CRAMER_CARD.regel],
  })
}

// ------------------------------------------------------------------ Bau

const nonzero = (rng: Rng, lo: number, hi: number) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}
// zufällige Matrix, einige Nullen erst ab Stufe 2
function randMat(rng: Rng, n: number, zeros: number): Mat {
  const M = Array.from({ length: n }, () => Array.from({ length: n }, () => R(nonzero(rng, -4, 5))))
  for (let z = 0; z < zeros; z++) M[rng.int(0, n - 1)][rng.int(0, n - 1)] = ZERO
  return M
}
const mulVec = (A: Mat, x: readonly Rational[]) => A.map((r) => r.reduce((s, a, j) => ratAdd(s, ratMul(a, x[j])), ZERO))
const small = (xs: readonly Rational[], lim: number) => xs.every((x) => Math.abs(num(x)) <= lim)

// mehrfach versuchen, bis jeder Schritt drei falsche Antworten hat
function retry(make: () => Built | null): Built {
  for (let k = 0; k < 2000; k++) {
    const built = make()
    if (built && built.steps.every((s) => s.choices.length >= 4)) return built
  }
  throw new Error('Cramer: keine Aufgabe mit genug Antworten gefunden')
}

const optionalDrawing = (A: Mat, b: readonly Rational[], x: readonly Rational[]) => {
  const d = systemDrawing({ T: A.map((r, i) => [...r.map(num), num(b[i])]), n: A.length, solution: { p: x.map(num), dirs: [] } })
  return d ? { resultDrawing: d } : {}
}

// Cramer als Flächen (Schritt 11c, nur 2 × 2 ohne Parameter): Die Spalten a_1, a_2 von A spannen ein Parallelogramm mit
// der Fläche |det A| auf. Streckt man die Spalte der Unbekannten mit ihrem Wert, wird es so oft größer; schiebt man die
// Ecke dann parallel zur anderen Spalte bis b (Scheren), bleibt die Fläche gleich: Das Parallelogramm aus b und der
// anderen Spalte hat |det A_k|. Also ist die Unbekannte det A_k / det A (mit Vorzeichen: Umlaufsinn).
// Kein Bild bei Wert 0 (die Fläche fällt zu einer Strecke zusammen) oder wenn es zu groß würde.
export const AREA_SPAN = 22
export function cramerArea(A: Mat, b: readonly Rational[], k: 0 | 1): VectorDrawing | undefined {
  const col = (j: number) => [num(A[0][j]), num(A[1][j])]
  const D = det(A)
  const Dk = det(A.map((r, i) => r.map((e, j) => (j === k ? b[i] : e))))
  const value = ratDiv(Dk, D)
  if (isZero(value)) return undefined
  const x = num(value)
  const u = col(k)
  const w = col(1 - k)
  const bb = b.map(num)
  const plus = (p: readonly number[], q: readonly number[]) => p.map((e, i) => e + q[i])
  const times = (t: number, p: readonly number[]) => p.map((e) => t * e)
  const O = [0, 0]
  const base = [O, u, plus(u, w), w]
  const stretched = [O, times(x, u), plus(times(x, u), w), w]
  const sheared = [O, bb, plus(bb, w), w]
  const all = [...base, ...stretched, ...sheared]
  for (const c of [0, 1]) if (Math.max(0, ...all.map((p) => p[c])) - Math.min(0, ...all.map((p) => p[c])) > AREA_SPAN) return undefined
  const v = VARS[k]
  const [nu, nw] = k === 0 ? ['\\vec a_1', '\\vec a_2'] : ['\\vec a_2', '\\vec a_1']
  const flip = ratSign(value) < 0 ? ' (negativ: Die Richtung dreht sich um, der Umlaufsinn auch)' : ''
  const caption =
    `Die Spalten von $A$ sind $\\vec a_1$ (blau) und $\\vec a_2$ (orange). Ihr Parallelogramm hat die Fläche $|\\det A| = ${ratLatex(ratAbs(D))}$. ` +
    `Streckt man $${nu}$ mit $${v} = ${ratLatex(value)}$${flip}, ändert sich seine Fläche um den Faktor $${ratLatex(ratAbs(value))}$ (grau). ` +
    `Schiebt man die Ecke dann parallel zu $${nw}$ bis $\\vec b$, bleibt die Fläche gleich (Scheren): Das Parallelogramm aus $\\vec b$ und $${nw}$ (blaugrün) hat die Fläche $|\\det A_${v}| = ${ratLatex(ratAbs(Dk))}$. ` +
    `Darum ist $${v} = \\frac{\\det A_${v}}{\\det A}$, das Vorzeichen zählt den Umlaufsinn mit.`
  return {
    ...emptyDrawing(2, caption),
    playLabel: 'Strecken und Scheren',
    arrows: [
      { from: O, to: col(0), color: 'a', label: '\\vec a_1' },
      { from: O, to: col(1), color: 'b', label: '\\vec a_2' },
      { from: O, to: bb, color: 'r', label: '\\vec b' },
    ],
    polygons: [
      { points: base, color: k === 0 ? 'a' : 'b' },
      { points: stretched, from: base, color: 'muted', phase: 1 },
      { points: sheared, from: stretched, color: 'c', phase: 2 },
    ],
    segments: [{ from: times(x, u), to: bb, color: 'muted', dashed: true, phase: 2 }],
    points: [],
  }
}

const showSystem = (rng: Rng, A: PMat, b: readonly Rational[]) => {
  const eq = rng.chance(0.6)
  return {
    eq,
    functionLatex: eq ? systemLatex(A, b) : `A = ${pmat(A)},\\quad \\vec b = ${vecLatex(b)}`,
    what: eq ? 'das Gleichungssystem' : '$A\\vec x = \\vec b$',
  }
}
const dataOf = (A: PMat, b: readonly Rational[]) => ({
  A0: at(A, ZERO).flat().map(num),
  A1: at(A, ONE).flat().map(num),
  b: b.map(num),
  n: [A.length],
})

const withArea = (step: GuidedStep, d: VectorDrawing | undefined): GuidedStep => (d ? { ...step, solvedDrawing: d } : step)

// Stufe 1 (2 × 2, ganze Lösung) und 2 (Brüche möglich): beide Unbekannten
function buildTwo(rng: Rng, level: Level): Built | null {
  const A = randMat(rng, 2, 0)
  const D = det(A)
  if (isZero(D) || Math.abs(num(D)) > 25) return null
  let x: Rational[]
  let b: Rational[]
  if (level <= 1 || rng.chance(0.4)) {
    x = [R(rng.int(-4, 5)), R(rng.int(-4, 5))]
    b = mulVec(A, x)
  } else {
    b = [R(rng.int(-9, 9)), R(rng.int(-9, 9))]
    x = [0, 1].map((k) => ratDiv(det(replaceCol(constMat(A), k, b).map((r) => r.map((e) => e.c0))), D))
    if (x.every(isInteger) || x.some((v) => Number(v.d) > 12)) return null
  }
  if (!small(b, 30) || b.every(isZero)) return null
  const PA = constMat(A)
  const ctx: CramerCtx = { A: PA, b, n: 2 }
  const sys = showSystem(rng, PA, b)
  const cards = [CRAMER_CARD.regel]
  // y zusammen mit der Lösung (das Ergebnis ist der Vektor)
  const steps: GuidedStep[] = [
    detStep(rng, ctx, null, 'det', [CRAMER_CARD.regel, DET_CARD.zwei]),
    detStep(rng, ctx, 0, 'det-x', cards),
    withArea(quotientStep(rng, ctx, 0, cards), cramerArea(A, b, 0)),
    detStep(rng, ctx, 1, 'det-y', cards),
    withArea(quotientStep(rng, ctx, 1, cards, x), cramerArea(A, b, 1)),
  ]
  return {
    kind: 'cramerTwo',
    instruction: `Löse ${sys.what} mit der Cramerschen Regel.`,
    functionLatex: sys.functionLatex,
    steps,
    cards,
    resultLatex: `\\vec x = ${vecLatex(x)}`,
    ...optionalDrawing(A, b, x),
    form: `cramerTwo|${sys.eq ? 'eq' : 'mat'}|${x.every(isInteger) ? 'int' : 'frac'}|${negCount(PA, b)}|${A.flat().map((e) => (ratSign(e) < 0 ? '-' : isOne(ratAbs(e)) ? '1' : '+')).join('')}|${x.map((e) => '0+-'[(ratSign(e) + 3) % 3]).join('')}`,
    data: dataOf(PA, b),
    answer: x.map(num),
  }
}

// Stufe 2 und 3: 3 × 3, nur eine Unbekannte (Stufe 3 auch mit Bruch)
function buildThree(rng: Rng, level: Level): Built | null {
  const A = randMat(rng, 3, rng.int(1, 3))
  const D = det(A)
  if (isZero(D) || Math.abs(num(D)) > (level <= 2 ? 30 : 60)) return null
  const k = rng.int(0, 2)
  let x: Rational[]
  let b: Rational[]
  if (level <= 2 || rng.chance(0.4)) {
    x = [0, 1, 2].map(() => R(rng.int(-3, 4)))
    b = mulVec(A, x)
  } else {
    b = [0, 1, 2].map(() => R(rng.int(-6, 7)))
    const xk = ratDiv(det(replaceCol(constMat(A), k, b).map((r) => r.map((e) => e.c0))), D)
    if (isInteger(xk) || Number(xk.d) > 15) return null
    x = [0, 1, 2].map((j) => (j === k ? xk : ZERO))
  }
  if (!small(b, 30) || b.filter(isZero).length > 1) return null
  const PA = constMat(A)
  const ctx: CramerCtx = { A: PA, b, n: 3 }
  const sys = showSystem(rng, PA, b)
  const cards = [CRAMER_CARD.regel]
  const v = VARS[k]
  const steps = [detStep(rng, ctx, null, 'det', [CRAMER_CARD.regel, DET_CARD.sarrus]), matrixStep(rng, ctx, k, cards), detStep(rng, ctx, k, `det-${v}`, [CRAMER_CARD.regel, DET_CARD.sarrus]), quotientStep(rng, ctx, k, cards)]
  const xk = ratDiv(det(replaceCol(PA, k, b).map((r) => r.map((e) => e.c0))), D)
  return {
    kind: 'cramerThree',
    instruction: `Berechne mit der Cramerschen Regel nur die Unbekannte $${v}$ aus ${sys.what}.`,
    functionLatex: sys.functionLatex,
    steps,
    cards,
    resultLatex: `${v} = ${ratLatex(xk)}`,
    form: `cramerThree|${sys.eq ? 'eq' : 'mat'}|${v}|${isInteger(xk) ? 'int' : 'frac'}|${negCount(PA, b)}|${A.flat().map((e) => (isZero(e) ? '0' : '')).join('.')}`,
    data: { ...dataOf(PA, b), k: [k] },
    answer: [num(xk)],
  }
}

// Stufe 3 und 4: 3 × 3, zwei Unbekannte mit Cramer, die dritte durch Einsetzen
function buildPair(rng: Rng, _level: Level): Built | null {
  const A = randMat(rng, 3, rng.int(1, 2))
  const D = det(A)
  if (isZero(D) || Math.abs(num(D)) > 50) return null
  const x = [0, 1, 2].map(() => R(rng.int(-3, 4)))
  const b = mulVec(A, x)
  if (!small(b, 30) || b.filter(isZero).length > 1) return null
  const PA = constMat(A)
  const ctx: CramerCtx = { A: PA, b, n: 3 }
  const sys = showSystem(rng, PA, b)
  const m = rng.int(0, 2)
  const [k1, k2] = rng.shuffle([0, 1, 2].filter((j) => j !== m))
  const cards = [CRAMER_CARD.regel]
  const sc = [CRAMER_CARD.regel, DET_CARD.sarrus]
  const steps: GuidedStep[] = [
    detStep(rng, ctx, null, 'det', sc),
    matrixStep(rng, ctx, k1, cards),
    detStep(rng, ctx, k1, `det-${VARS[k1]}`, sc),
    quotientStep(rng, ctx, k1, cards),
    detStep(rng, ctx, k2, `det-${VARS[k2]}`, sc),
    quotientStep(rng, ctx, k2, cards),
  ]
  const last = insertStep(rng, ctx, x, m)
  if (!last) return null
  steps.push(last)
  return {
    kind: 'cramerPair',
    instruction: `Berechne $${VARS[k1]}$ und $${VARS[k2]}$ aus ${sys.what} mit der Cramerschen Regel, dann $${VARS[m]}$ durch Einsetzen.`,
    functionLatex: sys.functionLatex,
    steps,
    cards,
    resultLatex: `\\vec x = ${vecLatex(x)}`,
    ...optionalDrawing(A, b, x),
    form: `cramerPair|${sys.eq ? 'eq' : 'mat'}|${VARS[k1]}${VARS[k2]}|${negCount(PA, b)}|${A.flat().map((e) => (isZero(e) ? '0' : '')).join('.')}`,
    data: dataOf(PA, b),
    answer: x.map(num),
  }
}

// Lösungen für einen festen Wert c (null: nicht alle ganz und klein, keine, oder einer fällt weg)
function targetFor(D: Quad, Dk: Quad, Droots: readonly Rational[], c: Rational) {
  const E = qSub(Dk, qScale(c, D))
  if (qIsConst(E)) return null
  const rs = roots(E)
  if (!rs || !rs.every((r) => isInteger(r) && Math.abs(num(r)) <= 9) || rs.some((r) => Droots.some((d) => ratEq(d, r)))) return null
  return { c, valid: rs, excluded: [] as Rational[] }
}

// gesuchten Wert c so wählen, dass die Lösungen kleine ganze Zahlen sind; mit trap: ein Wert fällt weg (det A = 0)
function pickTarget(rng: Rng, D: Quad, Dk: Quad, Droots: readonly Rational[], trap: boolean) {
  for (const cc of rng.shuffle([-3, -2, -1, 1, 2, 3, 4, 0])) {
    const c = R(cc)
    const E = qSub(Dk, qScale(c, D))
    if (qIsConst(E)) continue
    const rs = roots(E)
    if (!rs || !rs.every((r) => isInteger(r) && Math.abs(num(r)) <= 9)) continue
    const excluded = rs.filter((r) => Droots.some((d) => ratEq(d, r)))
    const valid = rs.filter((r) => !excluded.some((e) => ratEq(e, r)))
    if (valid.length === 0 || excluded.length !== (trap ? 1 : 0)) continue
    return { c, valid, excluded }
  }
  return null
}

// Stufe 4 (2 × 2) und 5 (2 × 2 mit zwei Parametern, 3 × 3): mit Parameter a
function buildParam(rng: Rng, level: Level, n: 2 | 3, trap: boolean): Built | null {
  let A: PMat
  let Droots: Rational[]
  if (n === 3) {
    const pm = paramMatrix(rng)
    if (!pm) return null
    A = pm.M
    Droots = [...pm.roots]
  } else {
    const M = randMat(rng, 2, 0).map((r) => r.map((e) => lin(e)))
    const spots = rng.shuffle([[0, 0], [0, 1], [1, 0], [1, 1]] as const)
    const count = level >= 5 && rng.chance(0.6) ? 2 : 1
    const pos = count === 2 ? rng.pick([[[0, 0], [1, 1]], [[0, 1], [1, 0]]] as const) : [spots[0]]
    for (const [i, j] of pos) M[i][j] = lin(R(rng.pick([0, 0, 1, -1, 2, -2])), R(rng.pick([1, 1, -1, 2])))
    A = M
    const rs = roots(dq(A))
    if (!rs || rs.some((r) => !isInteger(r) || isZero(r) || Math.abs(num(r)) > 7)) return null
    Droots = rs
  }
  const D = dq(A)
  if (qIsConst(D)) return null
  const k = rng.int(0, n - 1)
  let b: Rational[]
  let fixed: Rational | null = null
  if (trap) {
    // b aus zwei Spalten von A an der Stelle r: Dort ist auch det A_k = 0
    const r = rng.pick(Droots)
    const Ar = at(A, r)
    const [i, j] = [0, 1, 2].filter((c) => c !== k)
    const [u, w] = [nonzero(rng, -2, 2), nonzero(rng, -2, 2)]
    b = Ar.map((row) => ratAdd(ratMul(R(u), row[i]), ratMul(R(w), row[j])))
  } else if (n === 3) {
    // rückwärts: an einer Stelle a0 mit det A ≠ 0 die Lösung x vorgeben; gesucht ist dann x_k = c an a0 (und vielleicht noch einer Stelle)
    const a0 = R(rng.pick([-3, -2, -1, 1, 2, 3, 4].filter((v) => !Droots.some((d) => ratEq(d, R(v))))))
    const x = [0, 1, 2].map(() => R(rng.int(-3, 4)))
    b = mulVec(at(A, a0), x)
    fixed = x[k]
  } else b = Array.from({ length: n }, () => R(rng.int(-6, 7)))
  if (!small(b, 20) || b.filter(isZero).length > 1) return null
  const Dk = dq(replaceCol(A, k, b))
  if (qIsZero(Dk)) return null
  const t = fixed ? targetFor(D, Dk, Droots, fixed) : pickTarget(rng, D, Dk, Droots, trap)
  if (!t) return null
  const ctx: CramerCtx = { A, b, n }
  const sys = showSystem(rng, A, b)
  const v = VARS[k]
  const pc = [CRAMER_CARD.parameter, n === 3 ? DET_CARD.sarrus : DET_CARD.zwei]
  const steps: GuidedStep[] = [detStep(rng, ctx, null, 'det', pc), conditionStep(rng, D, Droots)]
  if (n === 3) steps.push(matrixStep(rng, ctx, k, [CRAMER_CARD.regel]))
  steps.push(detStep(rng, ctx, k, `det-${v}`, pc), quotientStep(rng, ctx, k, [CRAMER_CARD.parameter]), targetStep(rng, D, Dk, k, t.c, t.valid, t.excluded))
  return {
    kind: n === 3 ? 'cramerParamThree' : 'cramerParam',
    instruction: `Das Gleichungssystem hängt vom Parameter $${PARAM}$ ab. Für welche $${PARAM}$ hat es genau eine Lösung mit $${v} = ${ratLatex(t.c)}$? Rechne mit der Cramerschen Regel.`,
    functionLatex: sys.functionLatex,
    steps,
    cards: [CRAMER_CARD.regel, CRAMER_CARD.parameter],
    resultLatex: solLatex(t.valid),
    ...paramSliderOf(A, b, Droots, t.valid, `$${v} = ${ratLatex(t.c)}$`),
    form: `cramerParam|${n}|${sys.eq ? 'eq' : 'mat'}|${v}|${paramMask(A)}|${t.excluded.length}|${t.valid.length}|${negCount(A, b)}|${isZero(D.q2) ? 1 : 2}|${ratSign(t.c)}|${at(A, ZERO).flat().map((e) => '0+-'[(ratSign(e) + 3) % 3]).join('')}`,
    data: { ...dataOf(A, b), k: [k], c: [num(t.c)] },
    answer: t.valid.map(num),
  }
}

// Schieberegler für a (Schritt 11c): Sonderwerte mit det A = 0, die gesuchten Werte mit ihrem Text
function paramSliderOf(A: PMat, b: readonly Rational[], Droots: readonly Rational[], valid: readonly Rational[], note: string) {
  const d = paramSlider({
    rowsAt: (a) => A.map((r, i) => [...r.map((e) => num(e.c0) + num(e.c1) * a), num(b[i])]),
    n: A.length,
    specials: Droots.map(num),
    targets: valid.map((x) => ({ value: num(x), note })),
    start: num(valid[0]),
  })
  return d ? { resultDrawing: d } : {}
}

// ------------------------------------------------------------------ Arten

export const CRAMER_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['cramerTwo'],
  2: ['cramerTwo', 'cramerThree'],
  3: ['cramerThree', 'cramerPair'],
  4: ['cramerParam', 'cramerPair'],
  5: ['cramerParamThree', 'cramerParam'],
}

export const CRAMER_BUILDERS: Readonly<Record<Extract<VectorKind, `cramer${string}`>, (rng: Rng, level: Level) => Built>> = {
  cramerTwo: (rng, level) => retry(() => buildTwo(rng, level)),
  cramerThree: (rng, level) => retry(() => buildThree(rng, level)),
  cramerPair: (rng, level) => retry(() => buildPair(rng, level)),
  cramerParam: (rng, level) => retry(() => buildParam(rng, level, 2, false)),
  // Wert, der wegfällt, in etwa der Hälfte (vor den Versuchen festgelegt, sonst überwiegt die leichter zu bauende Art)
  cramerParamThree: (rng, level) => {
    const trap = rng.chance(0.5)
    return retry(() => buildParam(rng, level, 3, trap))
  },
}
