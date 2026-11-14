import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Quad, quadLatex } from './crossTasks.ts'
import { detStep, roots, sortRats } from './cramerTasks.ts'
import { type Mat, type PMat, DET_CARD, at, det, det2Step, lin, paramMatrix, pmat, polyOf, sarrusStep } from './detTasks.ts'
import { type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Op, combine, opFor, opLabel } from './gaussTasks.ts'
import { MAT_CARD, matLatex, productQ, productStepQ } from './matrixTasks.ts'
import { vectorErrorRule } from './errorRules.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex, vecLatex } from './vec.ts'

// Baustein „Inverse Matrix“ (M7 Schritt 12a) der Tätigkeit „Matrizen und Gleichungssysteme“: 2 × 2 mit der Formel
// (Hauptdiagonale tauschen, Nebendiagonale mit Minus, durch det A teilen), 3 × 3 mit Gauß-Jordan Zeile für Zeile
// ((A | E), Nullen unter und über der Diagonale mit ganzen Zahlen, zuletzt jede Zeile durch ihre Zahl auf der Diagonale;
// Nullzeile links heißt nicht invertierbar), Regeln ((AB)⁻¹ = B⁻¹A⁻¹, (λA)⁻¹ = A⁻¹/λ, (Aᵀ)⁻¹ = (A⁻¹)ᵀ, (A⁻¹)⁻¹ = A),
// Gleichungssystem über die Inverse (x = A⁻¹b) und mit Parameter (für welche a invertierbar, dann die Inverse für einen
// Wert). Alles exakt mit Brüchen.

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)
const PARAM = 'a'
const T = '^{\\mathsf T}'

export const INV_CARD = {
  formel: 'inv-formel',
  gaussJordan: 'inv-gauss-jordan',
  regeln: 'inv-regeln',
  system: 'inv-gleichungssystem',
  parameter: 'inv-parameter',
} as const

// Ergebnis „nicht invertierbar“ als Auswahl (freier Modus: CHOICE_SETS in vectorFree.ts)
export const INVERTIBLE = ['invertierbar', 'nicht invertierbar'] as const

// ------------------------------------------------------------------ Matrizen

type Tab = readonly (readonly Rational[])[]
const build = (m: number, n: number, f: (i: number, j: number) => Rational): Mat => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => f(i, j)))
const identity = (n: number): Mat => build(n, n, (i, j) => (i === j ? ONE : ZERO))
const transpose = (A: Mat): Mat => build(A[0].length, A.length, (i, j) => A[j][i])
const scale = (k: Rational, A: Mat): Mat => A.map((r) => r.map((x) => ratMul(k, x)))
const mul = (A: Mat, B: Mat): Mat => productQ(A, B)!
const matEq = (A: Mat, B: Mat) => A.length === B.length && A[0].length === B[0].length && A.every((r, i) => r.every((x, j) => ratEq(x, B[i][j])))
const sameTab = matEq
const maxAbs = (A: Tab) => Math.max(...A.flat().map((x) => Math.abs(num(x))))
const maxDen = (A: Mat) => Math.max(...A.flat().map((x) => Number(x.d)))
const negCount = (A: Mat) => A.flat().filter((x) => ratSign(x) < 0).length
const signMask = (A: Mat) => A.flat().map((x) => (isZero(x) ? '0' : ratSign(x) < 0 ? '-' : isOne(ratAbs(x)) ? '1' : '+')).join('')

// exakte Inverse (Gauß-Jordan mit Brüchen, unabhängig vom Rechenweg der Schritte); null, wenn nicht invertierbar
export function inverse(A: Mat): Mat | null {
  const n = A.length
  const M = A.map((r, i) => [...r, ...identity(n)[i]])
  for (let c = 0; c < n; c++) {
    const p = M.findIndex((r, i) => i >= c && !isZero(r[c]))
    if (p < 0) return null
    ;[M[p], M[c]] = [M[c], M[p]]
    const piv = M[c][c]
    M[c] = M[c].map((x) => ratDiv(x, piv))
    for (let i = 0; i < n; i++) {
      const f = M[i][c]
      if (i !== c && !isZero(f)) M[i] = M[i].map((x, k) => ratSub(x, ratMul(f, M[c][k])))
    }
  }
  return M.map((r) => r.slice(n))
}

const nonzero = (rng: Rng, lo: number, hi: number) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}
const randMat = (rng: Rng, n: number, lo: number, hi: number, zeros: number): Rational[][] => {
  const M = Array.from({ length: n }, () => Array.from({ length: n }, () => R(nonzero(rng, lo, hi))))
  for (let z = 0; z < zeros; z++) M[rng.int(0, n - 1)][rng.int(0, n - 1)] = ZERO
  return M
}

// mehrfach versuchen, bis jeder Schritt drei falsche Antworten hat
function retry(make: () => Built | null): Built {
  for (let k = 0; k < 3000; k++) {
    const built = make()
    if (built && built.steps.every((s) => s.choices.length >= 4)) return built
  }
  throw new Error('Inverse: keine Aufgabe mit genug Antworten gefunden')
}

const NAMES = ['A', 'B', 'M'] as const
const inv = (name: string) => `${name}^{-1}`
// Faktor vor einer Matrix: 1/5, -1/2, aber 1 bzw. -1 ohne Zahl
const coefLatex = (k: Rational) => (isOne(k) ? '' : ratEq(k, R(-1)) ? '-' : ratLatex(k))

// ------------------------------------------------------------------ 2 × 2 mit der Formel

const adjugate = (A: Mat): Mat => [
  [A[1][1], ratNeg(A[0][1])],
  [ratNeg(A[1][0]), A[0][0]],
]

// A⁻¹ = 1/det A · (d −b; −c a) und die typischen Fehler
function inverseStep(rng: Rng, name: string, A: Mat, cards: readonly string[], intro = '', letters: readonly string[] = ['a', 'b', 'c', 'd']): GuidedStep {
  const D = det(A)
  const adj = adjugate(A)
  const right = scale(ratDiv(ONE, D), adj)
  const [[a, b], [c, d]] = A
  const show = (X: Mat) => math(`${inv(name)} = ${matLatex(X)}`)
  const cands: [Mat | null, string][] = [
    [scale(ratDiv(ONE, D), [[a, ratNeg(b)], [ratNeg(c), d]]), 'inv-2-no-swap'],
    [scale(ratDiv(ONE, D), [[ratNeg(d), b], [c, ratNeg(a)]]), 'inv-2-sign'],
    [adj, 'inv-2-no-divide'],
    [scale(D, adj), 'inv-2-times-det'],
    [A.flat().some(isZero) ? null : A.map((r) => r.map((x) => ratDiv(ONE, x))), 'inv-reciprocal'],
  ]
  const wrongs: Wrong[] = []
  for (const [X, rule] of rng.shuffle(cands)) if (X && !matEq(X, right)) wrongs.push({ content: show(X), rule })
  const factor = coefLatex(ratDiv(ONE, D))
  const adjLatex = matLatex(adj)
  // Buchstaben der allgemeinen Formel; mit Parameter a heißen sie p, q, r, s (sonst stünde a doppelt)
  const [la, lb, lc, ld] = letters
  const general = `\\frac{1}{\\det ${name}} \\begin{pmatrix} ${ld} & -${lb} \\\\ -${lc} & ${la} \\end{pmatrix}`
  const calc = `${inv(name)} = ${general} = ${factor}${adjLatex}${isOne(ratAbs(D)) && isOne(D) ? '' : ` = ${matLatex(right)}`}`
  return choiceStep(rng, {
    id: 'inverse',
    title: 'Inverse mit der Formel',
    question: `${intro}Mit $\\det ${name} = ${ratLatex(D)}$: Wie lautet $${inv(name)}$?`,
    correct: show(right),
    wrongs,
    hint: 'Auf der Hauptdiagonale die beiden Zahlen tauschen, auf der Nebendiagonale nur das Vorzeichen wechseln, dann jeden Eintrag durch die Determinante teilen.',
    explanation: {
      detailed: `Für $${name} = \\begin{pmatrix} ${la} & ${lb} \\\\ ${lc} & ${ld} \\end{pmatrix}$ gilt $${inv(name)} = ${general}$: Die Hauptdiagonale tauscht ihre Zahlen, die Nebendiagonale wechselt nur das Vorzeichen, und alles wird durch $\\det ${name}$ geteilt. Hier: $${calc}$.`,
      short: `$${calc}$.`,
    },
    established: [`${inv(name)} = ${matLatex(right)}`],
    cards,
  })
}

// det A bei 2 × 2 (aus detTasks.ts); bei det A = 0 fällt „Diagonalen vertauscht“ weg (−0 = 0), dann kommt „nur die
// Hauptdiagonale“ dazu
function detTwoStep(rng: Rng, name: string, A: Mat): GuidedStep {
  const step = det2Step(rng, `\\det ${name}`, A)
  const out = { ...step, cards: [INV_CARD.formel, DET_CARD.zwei] }
  const main = ratMul(A[0][0], A[1][1])
  const content = math(`\\det ${name} = ${ratLatex(main)}`)
  if (step.choices.length >= 4 || ratEq(main, det(A)) || step.choices.some((c) => c.content === content)) return out
  const extra = { id: `falsch-${step.choices.length}`, content, correct: false, errorRuleId: 'inv-det-main', whyWrong: vectorErrorRule('inv-det-main').why }
  return { ...out, choices: rng.shuffle([...step.choices, extra]) }
}

// Matrix mit det ±1 (ganzzahlige Inverse): P · L · U mit kleinen Zahlen
function unimodular(rng: Rng, n: number): Mat {
  const L = build(n, n, (i, j) => (i === j ? ONE : i > j ? R(rng.int(-2, 2)) : ZERO))
  const U = build(n, n, (i, j) => (i === j ? R(rng.pick([1, -1])) : i < j ? R(rng.int(-2, 2)) : ZERO))
  const M = mul(L, U)
  return rng.shuffle([...M])
}

// det A = 0: nicht invertierbar
function singularTwoStep(rng: Rng, name: string, A: Mat): GuidedStep {
  return choiceStep(rng, {
    id: 'invertierbar',
    title: 'Invertierbar?',
    question: `Es ist $\\det ${name} = 0$. Was folgt daraus?`,
    correct: `$${name}$ ist nicht invertierbar, denn $\\det ${name} = 0$.`,
    wrongs: [
      { content: `$${inv(name)} = ${matLatex(adjugate(A))}$`, rule: 'inv-singular-formula' },
      { content: `$${name}$ ist invertierbar, denn keine Zeile von $${name}$ ist eine Nullzeile.`, rule: 'inv-singular-rows' },
      { content: `$${inv(name)}$ ist die Nullmatrix.`, rule: 'inv-singular-zero' },
    ],
    hint: `In der Formel steht $\\frac{1}{\\det ${name}}$. Was passiert bei $\\det ${name} = 0$?`,
    explanation: {
      detailed: `Die Formel teilt durch $\\det ${name}$, und das geht bei $0$ nicht. Allgemein gilt: Eine quadratische Matrix ist genau dann invertierbar, wenn ihre Determinante nicht $0$ ist. Hier sind die Spalten Vielfache voneinander, das Parallelogramm hat die Fläche $0$, und es gibt keinen Weg zurück.`,
      short: `$\\det ${name} = 0$: nicht invertierbar.`,
    },
    established: ['\\text{nicht invertierbar}'],
    cards: [INV_CARD.formel],
  })
}

// Bild bei 2 × 2: A macht aus dem Einheitsquadrat das Parallelogramm seiner Spalten, A⁻¹ macht es rückgängig. Die
// Spalten von A⁻¹ sind die Pfeile, die A auf e₁ und e₂ bringt.
export const INV_SPAN = 9
const INV_MIN = 0.45
export function inverseDrawing(A: Mat, name: string, prefix = ''): VectorDrawing | undefined {
  const B = inverse(A)
  if (!B) return undefined
  const col = (M: Mat, j: number) => [num(M[0][j]), num(M[1][j])]
  const [a1, a2, s1, s2] = [col(A, 0), col(A, 1), col(B, 0), col(B, 1)]
  const O = [0, 0]
  const plus = (p: readonly number[], q: readonly number[]) => p.map((x, i) => x + q[i])
  const sq = [O, [1, 0], [1, 1], [0, 1]]
  const par = [O, a1, plus(a1, a2), a2]
  const back = [O, s1, plus(s1, s2), s2]
  const all = [...sq, ...par, ...back]
  for (const c of [0, 1]) if (Math.max(...all.map((p) => p[c])) - Math.min(...all.map((p) => p[c])) > INV_SPAN) return undefined
  // zu kurze Pfeile der Inversen gehen neben dem Quadrat unter
  if ([s1, s2].some((p) => Math.hypot(p[0], p[1]) < INV_MIN)) return undefined
  const low = name.toLowerCase()
  const area = ratLatex(ratAbs(det(A)))
  const caption =
    `${prefix}$${name}$ macht aus dem Einheitsquadrat (grau) das Parallelogramm seiner Spalten $\\vec ${low}_1$ (blau) und $\\vec ${low}_2$ (orange) mit der Fläche $|\\det ${name}| = ${area}$. ` +
    `$${inv(name)}$ macht das rückgängig: Beim Abspielen zieht sich das Parallelogramm zurück auf das Quadrat, $\\vec ${low}_1$ wird wieder $\\vec e_1$ und $\\vec ${low}_2$ wieder $\\vec e_2$. ` +
    `Die Spalten $\\vec s_1$ und $\\vec s_2$ von $${inv(name)}$ (violett) sind genau die Pfeile, die $${name}$ auf $\\vec e_1$ und $\\vec e_2$ bringt; ihr Parallelogramm (blaugrün) hat die Fläche $\\frac{1}{|\\det ${name}|}$.`
  return {
    ...emptyDrawing(2, caption),
    playLabel: 'Rückgängig machen',
    polygons: [
      { points: sq, color: 'muted' },
      { points: par, color: 'a' },
      { points: sq, from: par, color: 'r', phase: 1 },
      { points: back, color: 'c', phase: 2 },
    ],
    arrows: [
      { from: O, to: a1, color: 'a', label: `\\vec ${low}_1` },
      { from: O, to: a2, color: 'b', label: `\\vec ${low}_2` },
      { from: O, to: s1, color: 'r', label: '\\vec s_1', phase: 2 },
      { from: O, to: s2, color: 'r', label: '\\vec s_2', phase: 2 },
    ],
  }
}
const withDrawing = (d: VectorDrawing | undefined) => (d ? { resultDrawing: d } : {})

// ------------------------------------------------------------------ Gauß-Jordan

const ROMAN = ['I', 'II', 'III', 'IV'] as const
const roman = (i: number) => `\\text{${ROMAN[i]}}`

// Tabelle (A | E) mit Zeilennamen, Strich in der Mitte und Umformungen rechts daneben
function jordanLatex(M: Tab, n: number, notes: readonly (string | undefined)[] = []): string {
  const withNotes = notes.some(Boolean)
  const spec = `c|${'r'.repeat(n)}|${'r'.repeat(n)}${withNotes ? 'l' : ''}`
  const rows = M.map((row, i) => `${roman(i)} & ${row.map(ratLatex).join(' & ')}${withNotes ? ` & ${notes[i] ? `\\quad ${notes[i]}` : ''}` : ''}`)
  return `\\begin{array}{${spec}} ${rows.join(' \\\\ ')} \\end{array}`
}

type JStage =
  | { readonly kind: 'swap'; readonly row: number; readonly other: number; readonly col: number; readonly before: Tab; readonly after: Tab }
  | { readonly kind: 'elim'; readonly dir: 'down' | 'up'; readonly row: number; readonly col: number; readonly ops: readonly Op[]; readonly before: Tab; readonly after: Tab }

const applyOps = (M: Tab, row: number, ops: readonly Op[], f: (p: Rational, ri: readonly Rational[], q: Rational, rr: readonly Rational[]) => Rational[]): Tab =>
  M.map((r, i) => {
    const o = ops.find((x) => x.target === i)
    return o ? f(o.p, r, o.q, M[row]) : r
  })

// Gauß-Jordan wie in der Vorlesung, nur mit ganzen Zahlen: nach unten Spalte für Spalte (bei 0 oben tauschen), dann von
// rechts nach links Nullen über der Diagonale; jede Umformung „p · Zeile − q · Stufenzeile“. singular: In einer Spalte
// gibt es ab der Diagonale keine Zahl ungleich 0 mehr (links entsteht eine Nullzeile).
export function runJordan(A: Mat): { readonly stages: readonly JStage[]; readonly start: Tab; readonly final: Tab; readonly singular: number } {
  const n = A.length
  const start: Tab = A.map((r, i) => [...r, ...identity(n)[i]])
  let M = start
  const stages: JStage[] = []
  for (let c = 0; c < n; c++) {
    let p = c
    while (p < n && isZero(M[p][c])) p++
    if (p === n) return { stages, start, final: M, singular: c }
    if (p !== c) {
      const after = M.map((x) => [...x])
      ;[after[p], after[c]] = [after[c], after[p]]
      stages.push({ kind: 'swap', row: c, other: p, col: c, before: M, after })
      M = after
    }
    const ops: Op[] = []
    for (let i = c + 1; i < n; i++) if (!isZero(M[i][c])) ops.push(opFor(M[c][c], M[i][c], i))
    if (ops.length > 0) {
      const after = applyOps(M, c, ops, combine)
      stages.push({ kind: 'elim', dir: 'down', row: c, col: c, ops, before: M, after })
      M = after
    }
  }
  for (let c = n - 1; c >= 1; c--) {
    const ops: Op[] = []
    for (let i = 0; i < c; i++) if (!isZero(M[i][c])) ops.push(opFor(M[c][c], M[i][c], i))
    if (ops.length > 0) {
      const after = applyOps(M, c, ops, combine)
      stages.push({ kind: 'elim', dir: 'up', row: c, col: c, ops, before: M, after })
      M = after
    }
  }
  return { stages, start, final: M, singular: -1 }
}

function tableWrongs(right: Tab, cands: readonly (readonly [Tab, string])[], n: number, notes: readonly (string | undefined)[] = []): Wrong[] {
  const out: Wrong[] = []
  const seen: Tab[] = [right]
  for (const [W, rule] of cands) {
    if (seen.some((S) => sameTab(S, W))) continue
    seen.push(W)
    out.push({ content: math(jordanLatex(W, n, notes)), rule })
  }
  return out
}

// Starttabelle (A | E)
function startStep(rng: Rng, name: string, A: Mat, start: Tab): GuidedStep {
  const n = A.length
  const E = identity(n)
  const cands: [Tab, string][] = [
    [E.map((r, i) => [...r, ...A[i]]), 'inv-start-swap'],
    [A.map((r) => [...r, ...r.map(() => ZERO)]), 'inv-start-zero'],
    [transpose(A).map((r, i) => [...r, ...E[i]]), 'inv-start-transpose'],
  ]
  return choiceStep(rng, {
    id: 'start',
    title: 'Starttabelle',
    question: `Mit welcher Tabelle beginnt das Gauß-Jordan-Verfahren für $${inv(name)}$?`,
    correct: math(jordanLatex(start, n)),
    wrongs: tableWrongs(start, cands, n),
    hint: `Links steht die Matrix, deren Inverse du suchst, rechts vom Strich die Einheitsmatrix $E$.`,
    explanation: {
      detailed: `Du schreibst $(${name} \\mid E)$: links $${name}$, rechts die Einheitsmatrix (Einsen auf der Diagonale, sonst Nullen). Dann formst du die Zeilen so um, dass links $E$ entsteht. Weil jede Umformung auf die ganze Zeile wirkt, steht am Ende rechts $${inv(name)}$: $(${name} \\mid E) \\to (E \\mid ${inv(name)})$.`,
      short: `$(${name} \\mid E)$: links $${name}$, rechts $E$.`,
    },
    cards: [INV_CARD.gaussJordan],
  })
}

// falsche Tabellen zu einer Umformung: rechte Hälfte vergessen, Vielfaches nur beim ersten Eintrag, Vorzeichenfehler
function jordanCands(rng: Rng, st: Extract<JStage, { kind: 'elim' }>, n: number): [Tab, string][] {
  const { row, col, ops, before, after } = st
  const sgn = (q: Rational) => R(ratSign(q))
  const cands: [Tab, string][] = [
    [applyOps(before, row, ops, (p, ri, q, rr) => combine(p, ri, q, rr).map((x, j) => (j >= n ? ri[j] : x))), 'inv-right-forgot'],
    [applyOps(before, row, ops, (p, ri, q, rr) => ri.map((x, j) => (j === col ? ZERO : ratSub(ratMul(p, x), ratMul(sgn(q), rr[j]))))), 'gauss-first-only'],
  ]
  // Vorzeichenfehler bei einem Eintrag (am liebsten, wo ein Minus abgezogen wird, und rechts vom Strich)
  const slips: [number, number][] = []
  for (const o of ops) for (let j = 0; j < 2 * n; j++) if (j !== col && !isZero(before[row][j])) slips.push([o.target, j])
  const opOf = (t: number) => ops.find((o) => o.target === t)!
  const negative = (s: readonly [number, number]) => Number(ratSign(ratMul(opOf(s[0]).q, before[row][s[1]])) < 0)
  const ranked = rng.shuffle(slips).sort((a, b) => negative(b) - negative(a))
  for (const [t, j] of ranked.slice(0, 2)) {
    const o = opOf(t)
    const W = after.map((r, i) => (i === t ? r.map((x, k) => (k === j ? ratAdd(ratMul(o.p, before[t][k]), ratMul(o.q, before[row][k])) : x)) : r))
    cands.push([W, 'gauss-sign'])
  }
  return cands
}

function jordanElimStep(rng: Rng, st: Extract<JStage, { kind: 'elim' }>, n: number, name: string): GuidedStep | null {
  const { row, col, ops, before, after, dir } = st
  const notes = after.map((_, i) => {
    const o = ops.find((x) => x.target === i)
    return o ? opLabel(o, row) : undefined
  })
  const cands = jordanCands(rng, st, n)
  const wrongs = tableWrongs(after, [cands[0], ...rng.shuffle(cands.slice(1))], n, notes)
  if (wrongs.length < 3) return null
  const pivot = ratLatex(before[row][col])
  const where = dir === 'down' ? 'unter' : 'über'
  const crossNote = ops.some((x) => !isOne(x.p)) ? ' Geht es nicht mit einem ganzzahligen Vielfachen, nimmst du über Kreuz mal: Zeile mal Zahl der Stufe, minus Stufenzeile mal Zahl der Zeile.' : ''
  const upNote = dir === 'up' ? ` Über der Diagonale arbeitest du von rechts nach links: Die Zeile ${ROMAN[row]} hat links nur noch eine Zahl, so bleiben die schon erzeugten Nullen stehen.` : ''
  return choiceStep(rng, {
    id: `${dir === 'down' ? 'unten' : 'oben'}-${col + 1}`,
    title: `Spalte ${col + 1}: Nullen ${where} der Diagonale`,
    question: `Erzeuge in Spalte ${col + 1} ${where} der $${pivot}$ in Zeile ${ROMAN[row]} Nullen. Wie sieht die Tabelle danach aus?\n$${jordanLatex(before, n)}$`,
    correct: math(jordanLatex(after, n, notes)),
    wrongs,
    hint: `Zieh von den Zeilen ${where} der Diagonale so ein Vielfaches von Zeile ${ROMAN[row]} ab, dass in Spalte ${col + 1} eine $0$ entsteht. Rechne jede Zahl der Zeile mit, auch rechts vom Strich.`,
    explanation: {
      detailed: `Umformungen: ${ops.map((x) => `$${opLabel(x, row)}$`).join(', ')}.${crossNote}${upNote} Die rechte Hälfte rechnest du genauso mit: Was mit $${name}$ geschieht, geschieht auch mit $E$.`,
      short: `${ops.map((x) => `$${opLabel(x, row)}$`).join(', ')}, beide Hälften mitrechnen.`,
    },
    cards: [INV_CARD.gaussJordan],
  })
}

function jordanSwapStep(rng: Rng, st: Extract<JStage, { kind: 'swap' }>, n: number): GuidedStep {
  return choiceStep(rng, {
    id: `tausch-${st.col + 1}`,
    title: 'Zeilen tauschen',
    question: `In Spalte ${st.col + 1} steht auf der Diagonale in Zeile ${ROMAN[st.row]} eine $0$, darunter aber nicht. Was tust du?\n$${jordanLatex(st.before, n)}$`,
    correct: `Zeilen ${ROMAN[st.row]} und ${ROMAN[st.other]} ganz tauschen, links und rechts vom Strich`,
    wrongs: [
      { content: 'Abbrechen: Die Matrix ist nicht invertierbar.', rule: 'inv-zero-pivot' },
      { content: `Zeilen ${ROMAN[st.row]} und ${ROMAN[st.other]} nur links vom Strich tauschen, rechts bleibt $E$ stehen`, rule: 'inv-right-forgot' },
      { content: `Spalte ${st.col + 1} überspringen${st.col + 1 < n ? ` und mit Spalte ${st.col + 2} weitermachen` : ''}`, rule: 'gauss-zero-pivot-skip' },
    ],
    hint: 'Die Reihenfolge der Zeilen darfst du ändern. Hol eine Zeile nach oben, die in dieser Spalte keine $0$ hat, und zwar die ganze Zeile.',
    explanation: {
      detailed: `Mit einer $0$ auf der Diagonale lassen sich darunter keine Nullen erzeugen. Zeilen tauschen ist eine erlaubte Umformung, also tauschst du Zeile ${ROMAN[st.row]} mit Zeile ${ROMAN[st.other]}, und zwar beide Hälften:\n$${jordanLatex(st.after, n)}$`,
      short: `Zeile ${ROMAN[st.row]} mit Zeile ${ROMAN[st.other]} ganz tauschen.`,
    },
    established: [`\\text{${ROMAN[st.row]}} \\leftrightarrow \\text{${ROMAN[st.other]}}`],
    cards: [INV_CARD.gaussJordan],
  })
}

// Links eine Nullzeile: nicht invertierbar
function singularJordanStep(rng: Rng, name: string, F: Tab, n: number, zeroRow: number): GuidedStep {
  return choiceStep(rng, {
    id: 'deuten',
    title: 'Invertierbar?',
    question: `Links vom Strich ist Zeile ${ROMAN[zeroRow]} eine Nullzeile:\n$${jordanLatex(F, n)}$\nWas folgt daraus?`,
    correct: `$${name}$ ist nicht invertierbar: Die Zeilen links sind linear abhängig, links kann nie ganz $E$ entstehen.`,
    wrongs: [
      { content: `$${name}$ ist invertierbar, denn rechts vom Strich steht keine Nullzeile.`, rule: 'inv-singular-right' },
      { content: `Zeilen tauschen und weiterrechnen, dann ist $${name}$ invertierbar.`, rule: 'inv-singular-swap' },
      { content: `$${inv(name)}$ ist die Nullmatrix.`, rule: 'inv-singular-zero' },
    ],
    hint: 'Links soll am Ende $E$ stehen. Lässt sich das mit einer Nullzeile noch erreichen?',
    explanation: {
      detailed: `Links soll am Ende die Einheitsmatrix stehen. Eine Nullzeile links heißt: Die Zeilen von $${name}$ sind linear abhängig (der Rang ist kleiner als ${n}). Zeilenumformungen ändern den Rang nicht, also können links nie ${n} unabhängige Zeilen wie in $E$ stehen. Damit ist $${name}$ nicht invertierbar, und es gilt $\\det ${name} = 0$. Was rechts vom Strich steht, spielt dafür keine Rolle.`,
      short: `Nullzeile links: Zeilen linear abhängig, nicht invertierbar ($\\det ${name} = 0$).`,
    },
    established: ['\\text{nicht invertierbar}'],
    cards: [INV_CARD.gaussJordan],
  })
}

// Diagonale auf 1 bringen und ablesen: A⁻¹ = D⁻¹ · M
function readStep(rng: Rng, name: string, F: Tab, n: number, A: Mat): GuidedStep {
  const diag = F.map((r, i) => r[i])
  const Mr: Mat = F.map((r) => r.slice(n))
  const right: Mat = Mr.map((r, i) => r.map((x) => ratDiv(x, diag[i])))
  const D = det(A)
  const cands: [Mat, string][] = [
    [Mr, 'inv-scale-forgot'],
    [Mr.map((r, i) => r.map((x) => ratMul(x, diag[i]))), 'inv-scale-multiply'],
    [transpose(right), 'inv-read-transpose'],
    [scale(ratDiv(ONE, D), Mr), 'inv-scale-det'],
  ]
  const show = (X: Mat) => math(`${inv(name)} = ${matLatex(X)}`)
  const wrongs: Wrong[] = []
  for (const [X, rule] of rng.shuffle(cands)) if (!matEq(X, right)) wrongs.push({ content: show(X), rule })
  const notes = diag.map((d) => (isOne(d) ? undefined : `: ${ratSign(d) < 0 ? `(${ratLatex(d)})` : ratLatex(d)}`))
  const done = F.map((_, i) => [...identity(n)[i], ...right[i]])
  return choiceStep(rng, {
    id: 'ablesen',
    title: 'Diagonale auf 1, ablesen',
    question: `Links stehen nur noch Zahlen auf der Diagonale:\n$${jordanLatex(F, n)}$\nTeile jede Zeile durch ihre Zahl auf der Diagonale. Wie lautet $${inv(name)}$?`,
    correct: show(right),
    wrongs,
    hint: 'Jede Zeile ganz durch ihre Zahl auf der Diagonale teilen, auch rechts vom Strich. Dann steht links $E$ und rechts die Inverse.',
    explanation: {
      detailed: `${diag.some((d) => !isOne(d)) ? `Jede Zeile durch ihre Zahl auf der Diagonale geteilt (${notes.map((x, i) => (x ? `Zeile ${ROMAN[i]} durch $${ratLatex(diag[i])}$` : '')).filter(Boolean).join(', ')}), ergibt` : 'Auf der Diagonale stehen schon Einsen:'} $${jordanLatex(done, n)}$. Links steht $E$, rechts $${inv(name)}$ (Zeile für Zeile abgelesen, nicht gespiegelt).`,
      short: `Jede Zeile durch ihre Zahl auf der Diagonale, rechts ablesen.`,
    },
    established: [`${inv(name)} = ${matLatex(right)}`],
    cards: [INV_CARD.gaussJordan],
  })
}

// alle Schritte des Gauß-Jordan-Verfahrens (null: zu wenige falsche Antworten)
function jordanSteps(rng: Rng, name: string, A: Mat, withStart: boolean): { steps: GuidedStep[]; singular: boolean; swaps: number; ups: number } | null {
  const n = A.length
  const run = runJordan(A)
  const steps: GuidedStep[] = []
  if (withStart) steps.push(startStep(rng, name, A, run.start))
  for (const st of run.stages) {
    if (st.kind === 'swap') steps.push(jordanSwapStep(rng, st, n))
    else {
      const s = jordanElimStep(rng, st, n, name)
      if (!s) return null
      steps.push(s)
    }
  }
  if (run.singular >= 0) {
    const zero = run.final.findIndex((r) => r.slice(0, n).every(isZero))
    if (zero < 0) return null
    steps.push(singularJordanStep(rng, name, run.final, n, zero))
  } else steps.push(readStep(rng, name, run.final, n, A))
  return { steps, singular: run.singular >= 0, swaps: run.stages.filter((s) => s.kind === 'swap').length, ups: run.stages.filter((s) => s.kind === 'elim' && s.dir === 'up').length }
}

// geeignet für Gauß-Jordan: Zahlen in allen Tabellen klein; singulär nur mit Nullzeile ganz unten nach dem Weg nach unten
function jordanOk(A: Mat, limit: number, singular: boolean): boolean {
  const run = runJordan(A)
  const tabs = [run.start, ...run.stages.map((s) => s.after)]
  if (tabs.some((t) => maxAbs(t) > limit)) return false
  if (singular) return run.singular === A.length - 1 && run.final[A.length - 1].slice(0, A.length).every(isZero)
  if (run.singular >= 0) return false
  // keine Zeile darf vorzeitig schon ganz fertig sein (sonst gibt es zu wenig zu tun)
  return true
}

// ------------------------------------------------------------------ Regeln

// Faktor eines Produkts: Matrix M (Buchstabe), invertiert und/oder transponiert
type Fac = { readonly base: number; readonly inv: boolean; readonly t: boolean }
type Rule = { readonly k: Rational; readonly facs: readonly Fac[] }
const facLatex = (names: readonly string[], f: Fac) => (f.inv && f.t ? `(${inv(names[f.base])})${T}` : f.inv ? inv(names[f.base]) : f.t ? `${names[f.base]}${T}` : names[f.base])
const ruleLatex = (names: readonly string[], r: Rule) => `${coefLatex(r.k)}${r.facs.map((f) => facLatex(names, f)).join('')}`
// Wert mit den Matrizen M (nicht invertiert) und ihren Inversen
function ruleValue(r: Rule, Ms: readonly Mat[], Is: readonly Mat[]): Mat {
  const mats = r.facs.map((f) => {
    const X = f.inv ? Is[f.base] : Ms[f.base]
    return f.t ? transpose(X) : X
  })
  return scale(r.k, mats.reduce((P, X) => mul(P, X)))
}
// (k X₁ X₂)⁻¹ = 1/k · X₂⁻¹ X₁⁻¹; (Mᵀ)⁻¹ = (M⁻¹)ᵀ, (M⁻¹)⁻¹ = M
const invertRule = (r: Rule): Rule => ({ k: ratDiv(ONE, r.k), facs: [...r.facs].reverse().map((f) => ({ ...f, inv: !f.inv })) })

type RuleSlip = 'order' | 'factor' | 'transpose' | 'twice'
const SLIP_RULE: Readonly<Record<RuleSlip, string>> = { order: 'inv-order', factor: 'inv-factor', transpose: 'inv-transpose-drop', twice: 'inv-inverse-twice' }
// falsch umgeformt: Reihenfolge beibehalten, Faktor nicht umgedreht, Transponieren vergessen, Inverse der Inversen bleibt invers
function slipped(asked: Rule, slips: readonly RuleSlip[]): Rule {
  const right = invertRule(asked)
  const order = slips.includes('order')
  const facs = (order ? [...asked.facs].map((f) => ({ ...f, inv: !f.inv })) : right.facs).map((f) => {
    const orig = asked.facs.find((g) => g.base === f.base)!
    return {
      ...f,
      t: slips.includes('transpose') ? false : f.t,
      inv: slips.includes('twice') && orig.inv ? true : f.inv,
    }
  })
  return { k: slips.includes('factor') ? asked.k : right.k, facs }
}
const sameRule = (p: Rule, q: Rule) => ratEq(p.k, q.k) && p.facs.length === q.facs.length && p.facs.every((f, i) => f.base === q.facs[i].base && f.inv === q.facs[i].inv && f.t === q.facs[i].t)

// ------------------------------------------------------------------ Bau

// Stufe 1 und 2: 2 × 2 mit der Formel (Stufe 2 auch nicht invertierbar)
function buildTwo(rng: Rng, level: Level, singular: boolean): Built | null {
  const name = rng.pick(NAMES)
  let A: Mat
  if (singular) {
    const r = [R(nonzero(rng, -4, 5)), R(nonzero(rng, -4, 5))]
    const k = R(rng.pick([2, -2, 3, -1, -3]))
    A = rng.chance(0.5) ? [r, r.map((x) => ratMul(k, x))] : [[r[0], ratMul(k, r[0])], [r[1], ratMul(k, r[1])]]
  } else {
    A = randMat(rng, 2, -4, 6, level >= 2 && rng.chance(0.3) ? 1 : 0)
    const D = det(A)
    if (isZero(D) || (level <= 1 ? Math.abs(num(D)) > 2 : Math.abs(num(D)) > 12 || Math.abs(num(D)) < 2)) return null
  }
  const steps: GuidedStep[] = [{ ...detTwoStep(rng, name, A), question: `Berechne zuerst die Determinante. Wie groß ist $\\det ${name}$?` }]
  const Ai = inverse(A)
  if (singular) steps.push(singularTwoStep(rng, name, A))
  else steps.push(inverseStep(rng, name, A, [INV_CARD.formel]))
  return {
    kind: 'invTwo',
    instruction: `Berechne die Inverse von $${name}$ mit der Formel für $2 \\times 2$-Matrizen, falls es sie gibt.`,
    functionLatex: `${name} = ${matLatex(A)}`,
    steps,
    cards: [INV_CARD.formel],
    resultLatex: Ai ? `${inv(name)} = ${matLatex(Ai)}` : '\\text{nicht invertierbar}',
    ...(Ai ? withDrawing(inverseDrawing(A, name)) : {}),
    form: `invTwo|${name}|${singular ? 'sing' : ratLatex(det(A))}|${signMask(A)}`,
    data: { A: A.flat().map(num), n: [2] },
    answer: Ai ? Ai.flat().map(num) : [1],
  }
}

type JordanCase = 'plain' | 'swap' | 'singular' | 'triangle' | 'two'

// Matrix für Gauß-Jordan nach Fall
function jordanMatrix(rng: Rng, level: Level, kase: JordanCase): Mat {
  const hi = level >= 5 ? 5 : 4
  if (kase === 'two') return randMat(rng, 2, -4, 5, 0)
  if (kase === 'triangle') {
    const M = randMat(rng, 3, -3, hi, 0)
    for (let i = 1; i < 3; i++) for (let j = 0; j < i; j++) M[i][j] = ZERO
    for (let i = 0; i < 3; i++) M[i][i] = R(rng.pick([1, -1, 2, -2, 1, 3]))
    return M
  }
  const M = randMat(rng, 3, -3, hi, rng.int(0, level >= 4 ? 1 : 2))
  if (kase === 'singular') {
    const [p, q] = [nonzero(rng, -2, 2), rng.int(-2, 2)]
    M[2] = M[0].map((x, j) => ratAdd(ratMul(R(p), x), ratMul(R(q), M[1][j])))
    return M
  }
  if (kase === 'swap') {
    if (rng.chance(0.5)) {
      M[0][0] = ZERO
    } else {
      // zweite Zeile = Vielfaches der ersten + Zahl nur in Spalte 3: nach dem Nullen steht in Spalte 2 eine 0
      M[0][0] = R(rng.pick([1, -1, 2, 1]))
      const m = R(nonzero(rng, -2, 2))
      M[1] = M[0].map((x, j) => ratAdd(ratMul(m, x), j === 2 ? R(nonzero(rng, -3, 3)) : ZERO))
    }
  }
  return M
}

function buildGauss(rng: Rng, level: Level, kase: JordanCase): Built | null {
  const name = rng.pick(NAMES)
  const A = jordanMatrix(rng, level, kase)
  const n = A.length
  const D = det(A)
  const singular = kase === 'singular'
  if (singular !== isZero(D)) return null
  if (!singular && (Math.abs(num(D)) > (level <= 3 ? 8 : 12) || maxDen(inverse(A)!) > 12)) return null
  if (!jordanOk(A, level <= 3 ? 24 : level === 4 ? 36 : 48, singular)) return null
  const js = jordanSteps(rng, name, A, level <= 3)
  if (!js) return null
  if ((kase === 'swap') !== js.swaps > 0) return null
  const Ai = inverse(A)
  return {
    kind: 'invGauss',
    instruction: `Berechne $${inv(name)}$ mit dem Gauß-Jordan-Verfahren, falls es die Inverse gibt.`,
    functionLatex: `${name} = ${matLatex(A)}`,
    steps: js.steps,
    cards: [INV_CARD.gaussJordan],
    resultLatex: Ai ? `${inv(name)} = ${matLatex(Ai)}` : '\\text{nicht invertierbar}',
    ...(Ai && n === 2 ? withDrawing(inverseDrawing(A, name)) : {}),
    form: `invGauss|${kase}|${n}|${name}|${js.steps.length}|${js.ups}|${negCount(A)}|${A.flat().filter(isZero).length}|${singular ? 0 : Math.abs(num(D))}|${A.map((r) => r.map((x) => (isZero(x) ? 0 : 1)).join('')).join('.')}`,
    data: { A: A.flat().map(num), n: [n] },
    answer: Ai ? Ai.flat().map(num) : [1],
  }
}

// Regel-Vorlagen: gefragter Ausdruck als Rule; Stufe 3 mit zwei Besonderheiten, ab 4 mit dreien
function ruleTemplate(rng: Rng, level: Level): Rule {
  const k = R(rng.pick([2, 3, -2, 4, -3, 5]))
  const plain = (base: number): Fac => ({ base, inv: false, t: false })
  const tr = (base: number): Fac => ({ base, inv: false, t: true })
  const iv = (base: number): Fac => ({ base, inv: true, t: false })
  const two = rng.chance(0.5)
  const pair = (f: Fac, g: Fac) => (two ? [f, g] : [g, f])
  const options: Rule[] =
    level <= 3
      ? [
          { k, facs: [plain(0), plain(1)] },
          { k: ONE, facs: pair(tr(0), plain(1)) },
          { k: ONE, facs: pair(iv(0), plain(1)) },
          { k, facs: [tr(0)] },
          { k, facs: [iv(0)] },
        ]
      : [
          { k, facs: pair(tr(0), plain(1)) },
          { k, facs: pair(iv(0), plain(1)) },
          { k: ONE, facs: pair(tr(0), iv(1)) },
          { k, facs: pair(tr(0), tr(1)) },
        ]
  return rng.pick(options)
}

function buildRules(rng: Rng, level: Level): Built | null {
  const asked = ruleTemplate(rng, level)
  const n = level >= 5 || (level === 4 && rng.chance(0.4)) ? 3 : 2
  const names = rng.pick([['A', 'B'], ['M', 'N'], ['P', 'Q']] as const)
  const used = [...new Set(asked.facs.map((f) => f.base))]
  // Matrizen mit ganzzahliger Inverse (det ±1), damit gegebene und gesuchte Matrizen glatt sind
  const Ms: Mat[] = []
  const Is: Mat[] = []
  for (let b = 0; b < 2; b++) {
    const M = unimodular(rng, n)
    const I = inverse(M)!
    if (maxAbs(M) > 6 || maxAbs(I) > 9) return null
    Ms.push(M)
    Is.push(I)
  }
  const right = invertRule(asked)
  // gegeben ist, was die richtige Umformung braucht: M⁻¹ bzw. M
  const given = used.map((b) => {
    const f = right.facs.find((x) => x.base === b)!
    return { name: f.inv ? inv(names[b]) : names[b], M: f.inv ? Is[b] : Ms[b] }
  })
  const askedLatex = `(${ruleLatex(names, asked)})^{-1}`
  // falsche Umformungen: jede Besonderheit einzeln, dann zu zweit
  const kinds: RuleSlip[] = []
  if (asked.facs.length === 2) kinds.push('order')
  if (!isOne(asked.k)) kinds.push('factor')
  if (asked.facs.some((f) => f.t)) kinds.push('transpose')
  if (asked.facs.some((f) => f.inv)) kinds.push('twice')
  const slipSets: RuleSlip[][] = [...kinds.map((s) => [s]), ...kinds.flatMap((s, i) => kinds.slice(i + 1).map((t) => [s, t]))]
  // zwei Fehler auf einmal: Id des ersten, „Warum falsch?“ erklärt beide
  const wrongRules: [Rule, string, RuleSlip[]][] = []
  for (const set of slipSets) {
    const w = slipped(asked, set)
    if (!sameRule(w, right) && !wrongRules.some(([x]) => sameRule(x, w))) wrongRules.push([w, SLIP_RULE[set[0]], set])
  }
  const whyOf = (set: readonly RuleSlip[]) => {
    if (set.length === 1) return undefined
    const parts = set.map((s) => vectorErrorRule(SLIP_RULE[s]).why)
    return { detailed: `Hier stecken zwei Fehler. ${parts.map((p) => p.detailed).join(' Außerdem: ')}`, short: parts.map((p) => p.short).join(' ') }
  }
  const value = ruleValue(right, Ms, Is)
  if (maxAbs(value) > 40) return null
  // falsche Werte dürfen nicht zufällig richtig sein
  if (wrongRules.some(([w]) => matEq(ruleValue(w, Ms, Is), value))) return null
  const rewrite = ruleLatex(names, right)
  const steps: GuidedStep[] = [
    choiceStep(rng, {
      id: 'regel',
      title: 'Regeln anwenden',
      question: `Wie lässt sich $${askedLatex}$ mit den gegebenen Matrizen schreiben?`,
      correct: math(`${askedLatex} = ${rewrite}`),
      wrongs: wrongRules.map(([w, rule, set]) => {
        const why = whyOf(set)
        return { content: math(`${askedLatex} = ${ruleLatex(names, w)}`), rule, ...(why ? { why } : {}) }
      }),
      hint: 'Beim Invertieren eines Produkts dreht sich die Reihenfolge um, jeder Faktor wird invertiert, eine Zahl wird zum Kehrwert, und Transponieren und Invertieren dürfen die Plätze tauschen.',
      explanation: {
        detailed: `Mit $(XY)^{-1} = Y^{-1}X^{-1}$ (Reihenfolge dreht sich um), $(\\lambda X)^{-1} = \\frac{1}{\\lambda}X^{-1}$, $(X${T})^{-1} = (X^{-1})${T}$ und $(X^{-1})^{-1} = X$ wird $${askedLatex} = ${rewrite}$.`,
        short: `$${askedLatex} = ${rewrite}$.`,
      },
      established: [`${askedLatex} = ${rewrite}`],
      cards: [INV_CARD.regeln],
    }),
  ]
  // malnehmen (Transponierte gleich eingesetzt; Fehler: Transponieren vergessen), dann die Zahl
  const mats = right.facs.map((f) => {
    const g = given.find((x) => x.name === (f.inv ? inv(names[f.base]) : names[f.base]))!
    return { latex: facLatex(names, f), M: f.t ? transpose(g.M) : g.M, plain: g.M }
  })
  const core = mats.length === 2 ? mul(mats[0].M, mats[1].M) : mats[0].M
  const untransposed = mats.length === 2 ? mul(mats[0].plain, mats[1].plain) : mats[0].plain
  const coreLatex = mats.map((m) => m.latex).join('')
  if (mats.length === 2) {
    const extra = matEq(untransposed, core) ? [] : [{ M: untransposed, rule: 'mat-transpose-ignored' }]
    steps.push(productStepQ(rng, mats[0].M, mats[1].M, coreLatex, extra))
  }
  if (!isOne(right.k)) {
    const show = (X: Mat) => math(`${askedLatex} = ${matLatex(X)}`)
    const single = mats.length === 1
    const cands: [Mat, string][] = [
      [scale(asked.k, core), 'inv-factor'],
      ...(single && !matEq(untransposed, core) ? [[scale(right.k, untransposed), 'mat-transpose-ignored'] as [Mat, string]] : []),
      [core.map((r, i) => (i === 0 ? r.map((x) => ratMul(right.k, x)) : r)), 'mat-scalar-row'],
      [core.map((r) => r.map((x) => ratAdd(x, right.k))), 'mat-scalar-added'],
    ]
    const wrongs: Wrong[] = []
    for (const [X, rule] of cands) if (!matEq(X, value)) wrongs.push({ content: show(X), rule })
    // nach dem Produkt ist der Rest bekannt; bei einem einzelnen Faktor steht nur der Ausdruck da
    const known = single ? '' : ` mit $${coreLatex} = ${matLatex(core)}$`
    const tNote = single && right.facs[0].t ? `Transponieren: Die Zeilen von $${given[0].name}$ werden zu Spalten, $${coreLatex} = ${matLatex(core)}$. ` : ''
    steps.push(
      choiceStep(rng, {
        id: 'faktor',
        title: 'Zahl davor',
        question: `Es ist $${askedLatex} = ${coefLatex(right.k)}${coreLatex}$${known}. Wie lautet $${askedLatex}$?`,
        correct: show(value),
        wrongs,
        hint: `Eine Zahl vor einer Matrix wird mit jedem Eintrag malgenommen.${tNote ? ' Vorher transponieren: Zeilen werden zu Spalten.' : ''}`,
        explanation: {
          detailed: `${tNote}Jeder Eintrag von $${coreLatex}$ wird mit $${ratLatex(right.k)}$ malgenommen: $${askedLatex} = ${ratLatex(right.k)} \\cdot ${matLatex(core)} = ${matLatex(value)}$.`,
          short: `Jeden Eintrag mal $${ratLatex(right.k)}$.`,
        },
        established: [`${askedLatex} = ${matLatex(value)}`],
        cards: [INV_CARD.regeln, MAT_CARD.rechnen],
      }),
    )
  } else if (mats.length === 1) return null
  const givenLatex = given.map((g) => `${g.name} = ${matLatex(g.M)}`).join(',\\quad ')
  return {
    kind: 'invRules',
    instruction: `Gegeben ${given.length === 1 ? 'ist' : 'sind'} nur ${given.map((g) => `$${g.name}$`).join(' und ')}. Berechne $${askedLatex}$ mit den Regeln für Inverse, ohne eine neue Inverse auszurechnen.`,
    functionLatex: n === 3 && given.length === 2 ? `\\begin{array}{l} ${given.map((g) => `${g.name} = ${matLatex(g.M)}`).join(' \\\\[10pt] ')} \\end{array}` : givenLatex,
    steps,
    cards: [INV_CARD.regeln],
    resultLatex: `${askedLatex} = ${matLatex(value)}`,
    form: `invRules|${n}|${names[0]}|${ruleLatex(['X', 'Y'], asked)}|${negCount(value)}|${given.map((g) => negCount(g.M)).join(',')}`,
    data: { asked: [num(asked.k), ...asked.facs.flatMap((f) => [f.base, Number(f.inv), Number(f.t)])], M0: Ms[0].flat().map(num), M1: Ms[1].flat().map(num), n: [n] },
    answer: value.flat().map(num),
  }
}

// Stufe 3 (2 × 2, erst die Inverse) und 4 (3 × 3 mit gegebener Inverse, zwei rechte Seiten): x = A⁻¹ b
function buildSystem(rng: Rng, level: Level): Built | null {
  const n = level >= 4 ? 3 : 2
  const name = 'A'
  const A = randMat(rng, n, -3, 5, n === 3 ? rng.int(1, 3) : 0)
  const D = det(A)
  if (isZero(D) || (n === 3 && !isOne(ratAbs(D))) || (n === 2 && Math.abs(num(D)) > 10)) return null
  const Ai = inverse(A)!
  if (maxAbs(Ai) > 9) return null
  const cols = n === 3 ? 2 : 1
  const X: Mat = build(n, cols, () => R(rng.int(-3, 4)))
  const B = mul(A, X)
  if (maxAbs(B) > 25 || B.every((r) => r.every(isZero))) return null
  const vars = n === 2 ? ['x', 'y'] : ['x_1', 'x_2', 'x_3']
  const bName = cols === 1 ? '\\vec b' : '(\\vec b \\;\\; \\vec c)'
  const ansatz = choiceStep(rng, {
    id: 'ansatz',
    title: 'Ansatz',
    question: `Das System lautet $A\\vec x = \\vec b$, und $${name}$ ist invertierbar. Wie bekommst du $\\vec x$?`,
    correct: math(`\\vec x = ${inv(name)}\\vec b`),
    wrongs: [
      { content: math(`\\vec x = \\vec b\\, ${inv(name)}`), rule: 'inv-side' },
      { content: math(`\\vec x = ${name}\\vec b`), rule: 'inv-not-inverted' },
      { content: math(`\\vec x = \\frac{\\vec b}{${name}}`), rule: 'inv-divide' },
    ],
    hint: `Nimm beide Seiten von links mit $${inv(name)}$ mal. Durch eine Matrix teilen gibt es nicht.`,
    explanation: {
      detailed: `Beide Seiten von links mit $${inv(name)}$ malnehmen: $${inv(name)}${name}\\vec x = ${inv(name)}\\vec b$. Links steht $E\\vec x = \\vec x$, also $\\vec x = ${inv(name)}\\vec b$. Links, weil $${name}$ links von $\\vec x$ steht; Matrizen darf man nicht vertauschen.`,
      short: `Von links mit $${inv(name)}$ malnehmen: $\\vec x = ${inv(name)}\\vec b$.`,
    },
    established: [`\\vec x = ${inv(name)}\\vec b`],
    cards: [INV_CARD.system],
  })
  const steps: GuidedStep[] = [ansatz]
  if (n === 2) {
    steps.push(detTwoStep(rng, name, A))
    steps.push(inverseStep(rng, name, A, [INV_CARD.formel]))
  }
  const extra = [{ M: mul(A, B), rule: 'inv-not-inverted' }]
  steps.push(productStepQ(rng, Ai, B, `${inv(name)}${cols === 1 ? '\\vec b' : bName}`, extra))
  const rows = A.map((r) => {
    let out = ''
    r.forEach((x, j) => {
      if (isZero(x)) return
      const abs = ratAbs(x)
      const sign = out === '' ? (ratSign(x) < 0 ? '-' : '') : ratSign(x) < 0 ? ' - ' : ' + '
      out += `${sign}${isOne(abs) ? '' : ratLatex(abs)}${vars[j]}`
    })
    return out
  })
  const sysLatex = (c: number) => `\\begin{array}{l} ${rows.map((r, i) => `${r} = ${ratLatex(B[i][c])}`).join(' \\\\ ')} \\end{array}`
  const col = (M: Mat, c: number) => M.map((r) => r[c])
  return {
    kind: 'invSystem',
    instruction:
      n === 2
        ? `Löse das Gleichungssystem mit der Inversen der Koeffizientenmatrix $${name}$.`
        : `Die Inverse von $${name}$ ist gegeben. Löse damit die beiden Systeme $${name}\\vec x = \\vec b$ und $${name}\\vec y = \\vec c$ auf einmal: Die Lösungen sind die Spalten von $X = ${inv(name)}${bName}$.`,
    functionLatex:
      n === 2
        ? sysLatex(0)
        : `\\begin{array}{l} ${name} = ${matLatex(A)} \\\\[10pt] ${inv(name)} = ${matLatex(Ai)} \\\\[10pt] \\vec b = ${vecLatex(col(B, 0))},\\; \\vec c = ${vecLatex(col(B, 1))} \\end{array}`,
    steps,
    cards: [INV_CARD.system],
    resultLatex: n === 2 ? `\\vec x = ${vecLatex(col(X, 0))}` : `X = ${matLatex(X)}`,
    form: `invSystem|${n}|${ratLatex(D)}|${signMask(A)}|${negCount(X)}`,
    data: { A: A.flat().map(num), B: B.flat().map(num), n: [n] },
    answer: X.flat().map(num),
  }
}

// Für welche a ist A invertierbar? (det A ≠ 0)
function conditionStep(rng: Rng, D: Quad, rs: readonly Rational[], name: string): GuidedStep {
  const ne = (xs: readonly Rational[]) => math(xs.map((r) => `${PARAM} \\ne ${ratLatex(r)}`).join(' \\text{ und } '))
  const eq = (xs: readonly Rational[]) => math(xs.map((r) => `${PARAM} = ${ratLatex(r)}`).join(' \\text{ oder } '))
  const wrongs: Wrong[] = [
    { content: eq(rs), rule: 'inv-cond-flip' },
    { content: 'für alle $a$', rule: 'inv-cond-all' },
  ]
  const flipped = rs.map(ratNeg)
  if (!flipped.every((r) => rs.some((q) => ratEq(q, r)))) wrongs.push({ content: ne(sortRats(flipped)), rule: 'det-root-sign' })
  const zero = rs.map((r) => math(`${PARAM} = ${ratLatex(r)}`)).join(' oder ')
  return choiceStep(rng, {
    id: 'bedingung',
    title: 'Wann invertierbar?',
    question: `Es ist $\\det ${name} = ${quadLatex(D, PARAM)}$. Für welche $${PARAM}$ ist $${name}$ invertierbar?`,
    correct: ne(rs),
    wrongs,
    hint: `Eine quadratische Matrix ist genau dann invertierbar, wenn ihre Determinante nicht $0$ ist.`,
    explanation: {
      detailed: `$${name}$ ist genau dann invertierbar, wenn $\\det ${name} \\ne 0$ ist. Es ist $${quadLatex(D, PARAM)} = 0$ genau für ${zero}. Für alle anderen $${PARAM}$ gibt es $${inv(name)}$.`,
      short: `$\\det ${name} = 0$ für ${zero}; sonst invertierbar.`,
    },
    established: [rs.map((r) => `${PARAM} \\ne ${ratLatex(r)}`).join(',\\; ')],
    cards: [INV_CARD.parameter],
  })
}

// Stufe 4 (2 × 2, Formel) und 5 (3 × 3 mit Sarrus und Gauß-Jordan): mit Parameter a
function buildParam(rng: Rng, _level: Level, n: 2 | 3): Built | null {
  let A: PMat
  let rs: Rational[]
  if (n === 3) {
    const pm = paramMatrix(rng)
    if (!pm) return null
    A = pm.M
    rs = [...pm.roots]
  } else {
    const M = randMat(rng, 2, -4, 5, 0).map((r) => r.map((e) => lin(e)))
    const spots = rng.shuffle([[0, 0], [0, 1], [1, 0], [1, 1]] as const)
    const pos = rng.chance(0.4) ? rng.pick([[[0, 0], [1, 1]], [[0, 1], [1, 0]]] as const) : [spots[0]]
    for (const [i, j] of pos) M[i][j] = lin(R(rng.pick([0, 1, -1, 2, -2, 3])), R(rng.pick([1, 1, -1, 2])))
    A = M
    const found = roots(polyOf(A, det))
    if (!found || found.some((r) => !isInteger(r) || Math.abs(num(r)) > 7)) return null
    rs = found
  }
  const D = polyOf(A, det)
  if (isZero(D.q2) && isZero(D.q1)) return null
  // Wert für a: nicht Nullstelle, Inverse mit kleinen Nennern, Gauß-Jordan mit kleinen Zahlen
  const a0 = R(rng.pick([-2, -1, 0, 1, 2, 3].filter((v) => !rs.some((r) => ratEq(r, R(v))))))
  const A0 = at(A, a0)
  const d0 = det(A0)
  if (isZero(d0) || Math.abs(num(d0)) > (n === 2 ? 10 : 8)) return null
  const Ai = inverse(A0)!
  if (maxDen(Ai) > 12) return null
  const name = 'A'
  const steps: GuidedStep[] = []
  if (n === 2) steps.push(detStep(rng, { A, b: [ZERO, ZERO], n: 2 }, null, 'det', [INV_CARD.parameter, DET_CARD.zwei]))
  else steps.push(sarrusStep(rng, `\\det ${name}`, A, { id: 'det', cards: [INV_CARD.parameter, DET_CARD.sarrus] }))
  steps.push(conditionStep(rng, D, rs, name))
  const valueIntro = `Für $${PARAM} = ${ratLatex(a0)}$ ist $${name} = ${matLatex(A0)}$. `
  if (n === 2) steps.push(inverseStep(rng, name, A0, [INV_CARD.formel, INV_CARD.parameter], valueIntro, ['p', 'q', 'r', 's']))
  else {
    if (!jordanOk(A0, 48, false)) return null
    const js = jordanSteps(rng, name, A0, false)
    if (!js) return null
    const [first, ...rest] = js.steps
    steps.push({ ...first, question: `${valueIntro}${first.question}` }, ...rest)
  }
  return {
    kind: 'invParam',
    instruction: `Die Matrix hängt vom Parameter $${PARAM}$ ab. Für welche $${PARAM}$ ist $${name}$ invertierbar? Berechne $${inv(name)}$ für $${PARAM} = ${ratLatex(a0)}$${n === 3 ? ' mit dem Gauß-Jordan-Verfahren' : ''}.`,
    functionLatex: `${name} = ${pmat(A)}`,
    steps,
    cards: [INV_CARD.parameter],
    resultLatex: `${inv(name)} = ${matLatex(Ai)}`,
    ...(n === 2 ? withDrawing(inverseDrawing(A0, name, `Für $${PARAM} = ${ratLatex(a0)}$: `)) : {}),
    form: `invParam|${n}|${rs.length}|${ratLatex(a0)}|${A.flatMap((r, i) => r.map((x, j) => (isZero(x.c1) ? '' : `${i}${j}`))).join('')}|${negCount(A0)}|${steps.length}`,
    data: { A0: at(A, ZERO).flat().map(num), A1: at(A, ONE).flat().map(num), a0: [num(a0)], roots: rs.map(num), n: [n] },
    answer: Ai.flat().map(num),
  }
}

// ------------------------------------------------------------------ Arten

export const INV_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['invTwo'],
  2: ['invTwo', 'invGauss'],
  3: ['invGauss', 'invRules', 'invSystem'],
  4: ['invGauss', 'invRules', 'invSystem', 'invParam'],
  5: ['invGauss', 'invParam', 'invRules'],
}

// Fall beim Gauß-Jordan-Verfahren vor den Versuchen festlegen (sonst überwiegt der leichter zu bauende)
function jordanCase(rng: Rng, level: Level): JordanCase {
  if (level <= 2) return rng.pick(['two', 'triangle'] as const)
  if (level === 3) return rng.pick(['plain', 'plain', 'plain', 'swap'] as const)
  return rng.pick(['plain', 'swap', 'swap', 'singular'] as const)
}

export const INV_BUILDERS: Readonly<Record<Extract<VectorKind, `inv${string}`>, (rng: Rng, level: Level) => Built>> = {
  invTwo: (rng, level) => {
    const singular = level >= 2 && rng.chance(0.2)
    return retry(() => buildTwo(rng, level, singular))
  },
  invGauss: (rng, level) => {
    const kase = jordanCase(rng, level)
    return retry(() => buildGauss(rng, level, kase))
  },
  invRules: (rng, level) => retry(() => buildRules(rng, level)),
  invSystem: (rng, level) => retry(() => buildSystem(rng, level)),
  invParam: (rng, level) => {
    const n = level >= 5 ? 3 : 2
    return retry(() => buildParam(rng, level, n))
  },
}
