import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ZERO, isZero, rat, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { termsLatex } from './crossTasks.ts'
import { type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex } from './vec.ts'

// Baustein „Matrizen rechnen“ (M7 Schritt 8a) der Tätigkeit „Matrizen und Gleichungssysteme“: Format und Einträge,
// Summe und Vielfache, Transponierte, Produkt mit Falk-Schema, Matrix mal Vektor (Bild: das Einheitsquadrat wird zum
// Parallelogramm), „Welcher Ausdruck ist definiert?“, (AB)ᵀ, Zeile mal Spalte und Spalte mal Zeile, vertauschbar mit
// Parameter, längere Ausdrücke. Alles exakt mit Brüchen; Ergebnisse als Matrix (pmatrix mit &) oder Zahl.

// ------------------------------------------------------------------ Matrizen mit Einträgen beliebiger Art

// Einträge sind Zahlen (Rational) oder, beim Parameter, lineare Ausdrücke c0 + c1·a (Lin)
type Ring<T> = {
  readonly add: (x: T, y: T) => T
  readonly mul: (x: T, y: T) => T
  readonly zero: T
  readonly eq: (x: T, y: T) => boolean
  readonly latex: (x: T) => string
  // in Klammern, wenn es als Faktor nicht allein stehen kann
  readonly factor: (x: T) => string
}

export type Mat<T = Rational> = readonly (readonly T[])[]

const Q: Ring<Rational> = {
  add: ratAdd,
  mul: ratMul,
  zero: ZERO,
  eq: ratEq,
  latex: ratLatex,
  factor: (x) => (ratSign(x) < 0 ? `(${ratLatex(x)})` : ratLatex(x)),
}

type Lin = { readonly c0: Rational; readonly c1: Rational }
const lin = (c0: Rational, c1: Rational = ZERO): Lin => ({ c0, c1 })
const PARAM = 'a'
const linLatexOf = (x: Lin) => termsLatex([[x.c1, PARAM], [x.c0, '']])
const L: Ring<Lin> = {
  add: (x, y) => lin(ratAdd(x.c0, y.c0), ratAdd(x.c1, y.c1)),
  mul: (x, y) => {
    if (!isZero(x.c1) && !isZero(y.c1)) throw new Error('Parameter mal Parameter')
    return lin(ratMul(x.c0, y.c0), ratAdd(ratMul(x.c0, y.c1), ratMul(x.c1, y.c0)))
  },
  zero: lin(ZERO),
  eq: (x, y) => ratEq(x.c0, y.c0) && ratEq(x.c1, y.c1),
  latex: linLatexOf,
  factor: (x) => {
    const s = linLatexOf(x)
    return !isZero(x.c1) && !isZero(x.c0) ? `(${s})` : s.startsWith('-') ? `(${s})` : s
  },
}

const rowsOf = <T>(A: Mat<T>) => A.length
const colsOf = <T>(A: Mat<T>) => A[0].length
const formatOf = <T>(A: Mat<T>): readonly [number, number] => [rowsOf(A), colsOf(A)]
const sameFormat = <T, S>(A: Mat<T>, B: Mat<S>) => rowsOf(A) === rowsOf(B) && colsOf(A) === colsOf(B)
const build = <T>(m: number, n: number, f: (i: number, j: number) => T): Mat<T> => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => f(i, j)))
const transpose = <T>(A: Mat<T>): Mat<T> => build(colsOf(A), rowsOf(A), (i, j) => A[j][i])
// an der Gegendiagonale gespiegelt (typischer Fehler)
const antiTranspose = <T>(A: Mat<T>): Mat<T> => build(colsOf(A), rowsOf(A), (i, j) => A[rowsOf(A) - 1 - j][colsOf(A) - 1 - i])
// Einträge in Lesereihenfolge ins Format n × m umgefüllt (typischer Fehler)
const reshape = <T>(A: Mat<T>): Mat<T> => {
  const flat = A.flat()
  return build(colsOf(A), rowsOf(A), (i, j) => flat[i * rowsOf(A) + j])
}
const matEq = <T>(R: Ring<T>, A: Mat<T>, B: Mat<T>) => sameFormat(A, B) && A.every((row, i) => row.every((x, j) => R.eq(x, B[i][j])))
const matLatexR = <T>(R: Ring<T>, A: Mat<T>) => `\\begin{pmatrix} ${A.map((r) => r.map(R.latex).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`
export const matLatex = (A: Mat) => matLatexR(Q, A)
const add = (A: Mat, B: Mat): Mat => build(rowsOf(A), colsOf(A), (i, j) => ratAdd(A[i][j], B[i][j]))
const scale = (k: Rational, A: Mat): Mat => A.map((r) => r.map((x) => ratMul(k, x)))
const nums = (A: Mat): number[] => A.flat().map((x) => Number(x.n) / Number(x.d))
const identity = (n: number): Mat => build(n, n, (i, j) => rat(i === j ? 1 : 0))
const negCount = (A: Mat) => A.flat().filter((x) => ratSign(x) < 0).length
const fmtLatex = (m: number, n: number) => `${m} \\times ${n}`

// Eintrag (i, j) des Produkts und seine typischen Fehler im Falk-Schema; null, wenn der Fehler hier nicht geht
type Falk = 'right' | 'noSum' | 'plus' | 'rowRow' | 'colCol' | 'entrywise'
function falkEntry<T>(R: Ring<T>, A: Mat<T>, B: Mat<T>, i: number, j: number, how: Falk): { value: T; latex: string } | null {
  const n = colsOf(A)
  const sum = (terms: readonly (readonly [T, T])[], op: 'mul' | 'add') => {
    const value = terms.reduce((s, [x, y]) => R.add(s, op === 'mul' ? R.mul(x, y) : R.add(x, y)), R.zero)
    const latex = terms.map(([x, y]) => (op === 'mul' ? `${R.factor(x)} \\cdot ${R.factor(y)}` : `(${R.latex(x)} + ${R.factor(y)})`)).join(' + ')
    return { value, latex }
  }
  const ks = Array.from({ length: n }, (_, k) => k)
  switch (how) {
    case 'right':
      return sum(ks.map((k) => [A[i][k], B[k][j]] as const), 'mul')
    case 'noSum':
      return n < 2 ? null : sum([[A[i][0], B[0][j]]], 'mul')
    case 'plus':
      return sum(ks.map((k) => [A[i][k], B[k][j]] as const), 'add')
    case 'rowRow':
      return colsOf(B) !== n || j >= rowsOf(B) ? null : sum(ks.map((k) => [A[i][k], B[j][k]] as const), 'mul')
    case 'colCol':
      return rowsOf(A) !== n || i >= n ? null : sum(ks.map((k) => [A[k][i], B[k][j]] as const), 'mul')
    case 'entrywise':
      return i < rowsOf(B) && j < colsOf(B) && j < n ? sum([[A[i][j], B[i][j]]], 'mul') : null
  }
}

function product<T>(R: Ring<T>, A: Mat<T>, B: Mat<T>, how: Falk = 'right'): Mat<T> | null {
  if (colsOf(A) !== rowsOf(B)) return null
  if (how === 'entrywise' && !sameFormat(A, B)) return null
  const out: T[][] = []
  for (let i = 0; i < rowsOf(A); i++) {
    const row: T[] = []
    for (let j = 0; j < colsOf(B); j++) {
      const e = falkEntry(R, A, B, i, j, how)
      if (!e) return null
      row.push(e.value)
    }
    out.push(row)
  }
  return out
}
const mul = (A: Mat, B: Mat): Mat => product(Q, A, B)!

// Falk-Schema als Tabelle: B oben rechts, A unten links, darunter rechts das Produkt. hi = (Zeile, Spalte) des
// Eintrags: Zeile von A und Spalte von B fett, der Eintrag umrahmt, die übrigen Felder leer
function falkLatex<T>(R: Ring<T>, A: Mat<T>, B: Mat<T>, hi: readonly [number, number] | null): string {
  const n = colsOf(A)
  const p = colsOf(B)
  const C = product(R, A, B)!
  const bold = (s: string, on: boolean) => (on ? `\\mathbf{${s}}` : s)
  const top = B.map((row) => [...Array.from({ length: n }, () => ''), ...row.map((x, c) => bold(R.latex(x), hi !== null && c === hi[1]))].join(' & '))
  const bottom = A.map((row, r) => {
    const right = Array.from({ length: p }, (_, c) => (hi === null ? R.latex(C[r][c]) : r === hi[0] && c === hi[1] ? `\\boxed{${R.latex(C[r][c])}}` : ''))
    return [...row.map((x) => bold(R.latex(x), hi !== null && r === hi[0])), ...right].join(' & ')
  })
  return `\\begin{array}{${'r'.repeat(n)}|${'r'.repeat(p)}} ${top.join(' \\\\ ')} \\\\ \\hline ${bottom.join(' \\\\ ')} \\end{array}`
}

// ------------------------------------------------------------------ Zufall und Namen

export const MAT_CARD = {
  format: 'mat-format',
  rechnen: 'mat-rechnen',
  transponieren: 'mat-transponieren',
  produkt: 'mat-produkt',
  matrixVektor: 'mat-matrix-vektor',
  vertauschbar: 'mat-vertauschbar',
} as const

const MAT_LETTERS = [
  ['A', 'B', 'C'],
  ['M', 'N', 'K'],
  ['P', 'Q', 'R'],
] as const

const T = '^{\\mathsf T}'

// Matrix mit kleinen ganzen Zahlen: mindestens ein negativer Eintrag, höchstens ein Drittel Nullen
function randMat(rng: Rng, m: number, n: number, lo = -3, hi = 5): Mat {
  for (;;) {
    const A = build(m, n, () => rat(rng.int(lo, hi)))
    const flat = A.flat()
    if (flat.some((x) => ratSign(x) < 0) && flat.filter(isZero).length * 3 <= flat.length) return A
  }
}

// Wiederholt den Bau, bis jeder Schritt mindestens drei Antworten hat (sonst fielen falsche Antworten weg, die zufällig
// gleich der richtigen sind)
function retry(make: () => Built): Built {
  for (let k = 0; k < 60; k++) {
    const built = make()
    if (built.steps.length > 0 && built.steps.every((s) => s.choices.length >= 3)) return built
  }
  throw new Error('Matrizen: keine Aufgabe mit genug Antworten gefunden')
}

const nameEq = (name: string, A: Mat) => `${name} = ${matLatex(A)}`
// Angabe: Matrizen nebeneinander; wird es zu breit für das Handy (geschätzt in Pixeln bei voller Größe, FitWidth
// verkleinert bis 70 %), stehen sie zeilenweise untereinander
const ROW_WIDTH = 470
function arrange(parts: readonly { readonly latex: string; readonly cols: number }[]): string {
  const rows: string[][] = [[]]
  let width = 0
  for (const p of parts) {
    const w = 60 + 55 * p.cols
    if (rows[rows.length - 1].length > 0 && width + 30 + w > ROW_WIDTH) {
      rows.push([])
      width = 0
    }
    width += (rows[rows.length - 1].length > 0 ? 30 : 0) + w
    rows[rows.length - 1].push(p.latex)
  }
  const lines = rows.map((r) => r.join(',\\; '))
  return lines.length === 1 ? lines[0] : `\\begin{array}{l} ${lines.join(' \\\\[10pt] ')} \\end{array}`
}
const given = (names: readonly string[], mats: readonly Mat[]) => arrange(names.map((nm, i) => ({ latex: nameEq(nm, mats[i]), cols: colsOf(mats[i]) })))

// ------------------------------------------------------------------ Schritte

// Format eines Produkts (m × n)(n × p) = m × p
// Bei lauter gleichen Formaten (n × n mal n × n) gibt es nichts zu fragen: dann kein Schritt
function productFormatStep(rng: Rng, expr: string, fa: readonly [number, number], fb: readonly [number, number], extra: readonly Wrong[] = []): GuidedStep[] {
  const [m, n] = fa
  const p = fb[1]
  if (m === n && n === p && extra.length === 0) return []
  const right = fmtLatex(m, p)
  const wrongs: Wrong[] = [
    ...extra,
    { content: math(fmtLatex(n, n)), rule: 'mat-product-format' },
    { content: math(fmtLatex(p, m)), rule: 'mat-format-swap' },
    { content: math(fmtLatex(m, n)), rule: 'mat-product-format' },
    { content: math(fmtLatex(n, p)), rule: 'mat-product-format' },
  ]
  return [choiceStep(rng, {
    id: 'format',
    title: 'Format',
    question: `Welches Format hat $${expr}$?`,
    correct: math(right),
    wrongs,
    hint: 'Schreib die Formate der beiden Faktoren nebeneinander (eine Transponierte hat Zeilen und Spalten getauscht). Die inneren Zahlen müssen gleich sein, das Ergebnis hat die äußeren.',
    explanation: {
      detailed: `$(${fmtLatex(m, n)}) \\cdot (${fmtLatex(fb[0], p)})$: Innen steht zweimal $${n}$, das passt. Das Ergebnis hat so viele Zeilen wie die linke Matrix ($${m}$) und so viele Spalten wie die rechte ($${p}$): $${right}$.`,
      short: `Innen gleich, außen bleibt: $${right}$.`,
    },
    established: [`${expr} \\in \\mathbb{R}^{${right}}`],
    cards: [MAT_CARD.produkt],
  })]
}

// ein Eintrag des Produkts mit dem Falk-Schema
function entryStep<T>(rng: Rng, R: Ring<T>, A: Mat<T>, B: Mat<T>, expr: string, i: number, j: number): GuidedStep {
  const name = `(${expr})_{${i + 1}${j + 1}}`
  const right = falkEntry(R, A, B, i, j, 'right')!
  const line = (e: { value: T; latex: string }) => math(`${name} = ${e.latex} = ${R.latex(e.value)}`)
  const wrongs: Wrong[] = []
  const rules: Readonly<Record<Exclude<Falk, 'right'>, string>> = { noSum: 'mat-falk-no-sum', rowRow: 'mat-row-row', colCol: 'mat-col-col', entrywise: 'mat-entrywise', plus: 'mat-falk-plus' }
  for (const how of rng.shuffle(['noSum', 'rowRow', 'colCol', 'entrywise', 'plus'] as const)) {
    const e = falkEntry(R, A, B, i, j, how)
    if (e && !R.eq(e.value, right.value)) wrongs.push({ content: line(e), rule: rules[how] })
  }
  return choiceStep(rng, {
    id: 'eintrag',
    title: 'Falk-Schema',
    question: `Wie lautet der Eintrag $${name}$ (Zeile $${i + 1}$, Spalte $${j + 1}$)?`,
    correct: line(right),
    wrongs,
    hint: `Nimm die $${i + 1}$. Zeile der linken Matrix und die $${j + 1}$. Spalte der rechten. Multipliziere sie Eintrag für Eintrag und addiere die Produkte.`,
    explanation: {
      detailed: `Im Falk-Schema steht die rechte Matrix oben, die linke unten links. Der Eintrag $${name}$ sitzt dort, wo sich die $${i + 1}$. Zeile und die $${j + 1}$. Spalte kreuzen (fett):\n$${falkLatex(R, A, B, [i, j])}$\nZeile mal Spalte: $${right.latex} = ${R.latex(right.value)}$.`,
      short: `Zeile $${i + 1}$ mal Spalte $${j + 1}$: $${R.latex(right.value)}$.`,
    },
    established: [`${name} = ${R.latex(right.value)}`],
    cards: [MAT_CARD.produkt],
  })
}

// das ganze Produkt; falsche Antworten aus den Fehlern im Falk-Schema, dazu andere (z. B. vergessenes Transponieren)
function productStep<T>(rng: Rng, R: Ring<T>, A: Mat<T>, B: Mat<T>, expr: string, extra: readonly { readonly M: Mat<T>; readonly rule: string }[] = [], id = 'produkt'): GuidedStep {
  const C = product(R, A, B)!
  const show = (X: Mat<T>) => math(`${expr} = ${matLatexR(R, X)}`)
  const wrongs: Wrong[] = []
  const push = (X: Mat<T> | null, rule: string) => {
    if (X && !matEq(R, X, C)) wrongs.push({ content: show(X), rule })
  }
  for (const e of extra) push(e.M, e.rule)
  const variants: [Mat<T> | null, string][] = [
    [product(R, B, A), 'mat-order-swap'],
    [sameFormat(A, B) ? build(rowsOf(A), colsOf(A), (i, j) => R.mul(A[i][j], B[i][j])) : null, 'mat-entrywise'],
    [product(R, A, B, 'rowRow'), 'mat-row-row'],
    [product(R, A, B, 'colCol'), 'mat-col-col'],
    [product(R, A, B, 'plus'), 'mat-falk-plus'],
    [product(R, A, B, 'noSum'), 'mat-falk-no-sum'],
  ]
  for (const [X, rule] of variants) push(X, rule)
  return choiceStep(rng, {
    id,
    title: 'Produkt',
    question: `Wie lautet $${expr}$?`,
    correct: show(C),
    wrongs,
    hint: 'Jeder Eintrag ist Zeile der linken Matrix mal Spalte der rechten. Das Falk-Schema hilft: rechte Matrix oben, linke unten links.',
    explanation: {
      detailed: `Im Falk-Schema steht jeder Eintrag dort, wo sich seine Zeile der linken und seine Spalte der rechten Matrix kreuzen:\n$${falkLatex(R, A, B, null)}$`,
      short: 'Zeile mal Spalte, für jeden Eintrag.',
    },
    established: [`${expr} = ${matLatexR(R, C)}`],
    cards: [MAT_CARD.produkt],
  })
}

// Transponierte
function transposeStep(rng: Rng, name: string, A: Mat): GuidedStep {
  const right = transpose(A)
  const show = (X: Mat) => math(`${name}${T} = ${matLatex(X)}`)
  const wrongs: Wrong[] = []
  // quadratisch: umgefüllt heißt unverändert, das zählt als „vergessen“
  for (const [X, rule] of [
    [rowsOf(A) === colsOf(A) ? A : reshape(A), rowsOf(A) === colsOf(A) ? 'mat-transpose-ignored' : 'mat-transpose-reshape'],
    [antiTranspose(A), 'mat-transpose-anti'],
    [A, 'mat-transpose-ignored'],
  ] as const)
    if (!matEq(Q, X, right)) wrongs.push({ content: show(X), rule })
  return choiceStep(rng, {
    id: 'transponiert',
    title: 'Transponieren',
    question: `Wie lautet $${name}${T}$?`,
    correct: show(right),
    wrongs,
    hint: `Die erste Zeile von $${name}$ wird die erste Spalte von $${name}${T}$, die zweite Zeile die zweite Spalte und so weiter.`,
    explanation: {
      detailed: `Beim Transponieren werden Zeilen zu Spalten: $(${name}${T})_{ij} = ${name.length === 1 ? name.toLowerCase() : name}_{ji}$. Aus dem Format $${fmtLatex(rowsOf(A), colsOf(A))}$ wird $${fmtLatex(colsOf(A), rowsOf(A))}$, die Hauptdiagonale bleibt stehen.`,
      short: 'Zeilen werden zu Spalten.',
    },
    established: [`${name}${T} = ${matLatex(right)}`],
    cards: [MAT_CARD.transponieren],
  })
}

// λX + μY (μ darf negativ sein, Y darf fehlen); Fehler: Zahl nur an der ersten Zeile, Zahl addiert, Minus nur beim
// ersten Eintrag, falsch herum abgezogen
type Term = { readonly k: Rational; readonly name: string; readonly M: Mat }
const termLatex = (t: Term, first: boolean) => {
  const abs = ratSign(t.k) < 0 ? ratNeg(t.k) : t.k
  const coef = ratEq(abs, rat(1)) ? '' : ratLatex(abs)
  const sign = ratSign(t.k) < 0 ? (first ? '-' : ' - ') : first ? '' : ' + '
  return `${sign}${coef}${t.name}`
}
export const combLatex = (terms: readonly Term[]) => terms.map((t, i) => termLatex(t, i === 0)).join('')
const combValue = (terms: readonly Term[]) => terms.map((t) => scale(t.k, t.M)).reduce(add)

function combStep(rng: Rng, terms: readonly Term[], id = 'summe', name?: string): GuidedStep {
  const expr = name ?? combLatex(terms)
  const right = combValue(terms)
  const show = (X: Mat) => math(`${expr} = ${matLatex(X)}`)
  const wrongs: Wrong[] = []
  const push = (X: Mat, rule: string) => {
    if (!matEq(Q, X, right)) wrongs.push({ content: show(X), rule })
  }
  const scaled = terms.findIndex((t) => !ratEq(t.k, rat(1)) && !ratEq(t.k, rat(-1)))
  if (scaled >= 0) {
    const t = terms[scaled]
    const absK = ratSign(t.k) < 0 ? ratNeg(t.k) : t.k
    const rowOnly = t.M.map((r, i) => (i === 0 ? r.map((x) => ratMul(absK, x)) : r))
    push(combValue(terms.map((s, i) => (i === scaled ? { ...s, k: ratSign(s.k) < 0 ? rat(-1) : rat(1), M: rowOnly } : s))), 'mat-scalar-row')
    const added = t.M.map((r) => r.map((x) => ratAdd(x, absK)))
    push(combValue(terms.map((s, i) => (i === scaled ? { ...s, k: ratSign(s.k) < 0 ? rat(-1) : rat(1), M: added } : s))), 'mat-scalar-added')
  }
  const minus = terms.findIndex((t, i) => i > 0 && ratSign(t.k) < 0)
  if (minus >= 0) {
    // Minus nur beim ersten Eintrag: Alle anderen Einträge des Terms werden addiert
    const t = terms[minus]
    const k = ratNeg(t.k)
    const parts = terms.map((s, i) => (i === minus ? scale(k, s.M).map((r, a) => r.map((x, b) => (a === 0 && b === 0 ? ratNeg(x) : x))) : scale(s.k, s.M)))
    push(parts.reduce(add), 'mat-minus-first')
    push(scale(rat(-1), right), 'mat-sub-reversed')
  }
  return choiceStep(rng, {
    id,
    title: terms.length > 1 ? 'Summe' : 'Vielfaches',
    question: `Wie lautet $${expr}$?`,
    correct: show(right),
    wrongs,
    hint: terms.length > 1 ? 'Rechne Stelle für Stelle: jede Zahl vor einer Matrix mal jeden ihrer Einträge, dann die Einträge an derselben Stelle zusammenzählen.' : 'Nimm jeden Eintrag mit der Zahl mal.',
    explanation: {
      detailed:
        terms.length > 1
          ? `Summe und Vielfache rechnest du **Stelle für Stelle**: Der Eintrag oben links ist $${terms.map((t, i) => `${i === 0 ? (ratSign(t.k) < 0 ? '-' : '') : ratSign(t.k) < 0 ? ' - ' : ' + '}${ratEq(t.k, rat(1)) || ratEq(t.k, rat(-1)) ? '' : `${ratLatex(ratSign(t.k) < 0 ? ratNeg(t.k) : t.k)} \\cdot `}${Q.factor(t.M[0][0])}`).join('')} = ${ratLatex(right[0][0])}$, die anderen genauso.`
          : `Jeder Eintrag wird mit $${ratLatex(terms[0].k)}$ malgenommen, in allen Zeilen.`,
      short: 'Stelle für Stelle.',
    },
    established: [`${expr} = ${matLatex(right)}`],
    cards: [MAT_CARD.rechnen],
  })
}

// ------------------------------------------------------------------ Arten

// Format und Einträge: A = (a_ij) aus einer Vorschrift
const RULES: readonly { readonly latex: string; readonly f: (i: number, j: number) => number }[] = [
  { latex: 'i - j', f: (i, j) => i - j },
  { latex: '2i - j', f: (i, j) => 2 * i - j },
  { latex: 'i - 2j', f: (i, j) => i - 2 * j },
  { latex: 'i^2 - j', f: (i, j) => i * i - j },
  { latex: 'j^2 - i', f: (i, j) => j * j - i },
  { latex: 'i \\cdot j - j', f: (i, j) => i * j - j },
  { latex: 'i + 2j - 4', f: (i, j) => i + 2 * j - 4 },
  { latex: '3i - 2j', f: (i, j) => 3 * i - 2 * j },
  { latex: 'j - 2i + 1', f: (i, j) => j - 2 * i + 1 },
  { latex: 'i \\cdot (j - 2)', f: (i, j) => i * (j - 2) },
]

function buildMatBuild(rng: Rng, _level: Level): Built {
  return retry(() => {
    const [m, n] = rng.pick([
      [2, 3],
      [3, 2],
      [2, 4],
      [4, 2],
      [3, 4],
      [4, 3],
    ] as const)
    const ruleIdx = rng.int(0, RULES.length - 1)
    const rule = RULES[ruleIdx]
    const name = rng.pick(['A', 'B', 'M'])
    const A = build(m, n, (i, j) => rat(rule.f(i + 1, j + 1)))
    const lower = name.toLowerCase()
    const show = (X: Mat) => math(`${name} = ${matLatex(X)}`)
    const steps: GuidedStep[] = [
      choiceStep(rng, {
        id: 'format',
        title: 'Format',
        question: `Wie viele Zeilen und Spalten hat $${name}$?`,
        correct: `$${m}$ Zeilen, $${n}$ Spalten`,
        wrongs: [
          { content: `$${n}$ Zeilen, $${m}$ Spalten`, rule: 'mat-format-swap' },
          { content: `eine Zeile mit $${m * n}$ Einträgen`, rule: 'mat-format-count' },
        ],
        hint: 'Im Format steht zuerst die Zahl der Zeilen (waagrecht), dann die der Spalten (senkrecht).',
        explanation: { detailed: `$${fmtLatex(m, n)}$ heißt: $${m}$ Zeilen (waagrecht) und $${n}$ Spalten (senkrecht), zusammen $${m * n}$ Einträge.`, short: 'Zeilen zuerst, Spalten später.' },
        cards: [MAT_CARD.format],
      }),
      choiceStep(rng, {
        id: 'matrix',
        title: 'Einträge',
        question: `Wie lautet $${name}$?`,
        correct: show(A),
        wrongs: [
          { content: show(build(m, n, (i, j) => rat(rule.f(j + 1, i + 1)))), rule: 'mat-index-swap' },
          { content: show(build(n, m, (i, j) => rat(rule.f(i + 1, j + 1)))), rule: 'mat-format-swap' },
          { content: show(build(n, m, (i, j) => rat(rule.f(j + 1, i + 1)))), rule: 'mat-format-swap' },
        ],
        hint: `Setz für $i$ die Nummer der Zeile und für $j$ die Nummer der Spalte ein, z. B. $${lower}_{12}$: $i = 1$, $j = 2$.`,
        explanation: {
          detailed: `Zum Beispiel $${lower}_{12} = ${rule.f(1, 2)}$ (Zeile 1, Spalte 2) und $${lower}_{21} = ${rule.f(2, 1)}$ (Zeile 2, Spalte 1). So füllst du alle $${m * n}$ Felder.`,
          short: `$i$ = Zeile, $j$ = Spalte.`,
        },
        established: [`${name} = ${matLatex(A)}`],
        cards: [MAT_CARD.format],
      }),
    ]
    return {
      kind: 'matBuild',
      instruction: `Schreib die Matrix $${name}$ aus.`,
      functionLatex: `${name} = (${lower}_{ij}) \\in \\mathbb{R}^{${fmtLatex(m, n)}},\\; ${lower}_{ij} = ${rule.latex}`,
      steps,
      cards: [MAT_CARD.format],
      resultLatex: `${name} = ${matLatex(A)}`,
      form: `matBuild|${m}x${n}|${ruleIdx}|${name}`,
      data: { A: nums(A), shape: [m, n], rule: [ruleIdx] },
      answer: nums(A),
    }
  })
}

// Summe und Vielfache (Stufe 1 eine Rechnung, Stufe 2 erst ein Vielfaches oder eine Transponierte)
function buildMatLinear(rng: Rng, level: Level): Built {
  return retry(() => {
    const [X, Y] = rng.pick(MAT_LETTERS)
    const [m, n] = level === 1 ? rng.pick([[2, 2], [2, 3], [3, 2]] as const) : rng.pick([[3, 3], [2, 3], [3, 2], [2, 4]] as const)
    const withT = level >= 2 && rng.chance(0.4)
    // mit Transponierter: X hat das Format n × m, gerechnet wird mit Xᵀ
    const A0 = randMat(rng, withT ? n : m, withT ? m : n)
    const A = withT ? transpose(A0) : A0
    const B = randMat(rng, m, n)
    const LEVEL1_PAIRS: readonly (readonly [number, number])[] = [[2, 0], [1, -1], [1, 2], [3, -1], [-2, 0], [2, -1]]
    const [k, l] = level === 1 ? rng.pick(LEVEL1_PAIRS) : [rng.pick([2, 3, -2]), rng.pick([-2, -3, 2, -1])]
    const nameX = withT ? `${X}${T}` : X
    const terms: Term[] = [{ k: rat(k), name: nameX, M: A }, ...(l !== 0 ? [{ k: rat(l), name: Y, M: B }] : [])]
    const expr = combLatex(terms)
    const steps: GuidedStep[] = []
    if (withT) steps.push(transposeStep(rng, X, A0))
    else if (level >= 2) steps.push(combStep(rng, [terms[0]], 'vielfaches'))
    steps.push(combStep(rng, terms))
    const R = combValue(terms)
    const mats = withT ? [A0, B] : l !== 0 ? [A, B] : [A]
    const names = l !== 0 ? [X, Y] : [X]
    return {
      kind: 'matLinear',
      instruction: `Berechne $${expr}$.`,
      functionLatex: given(names, mats),
      steps,
      cards: [MAT_CARD.rechnen, ...(withT ? [MAT_CARD.transponieren] : [])],
      resultLatex: `${expr} = ${matLatex(R)}`,
      form: `matLinear|${m}x${n}|${k},${l}|${withT ? 'T' : ''}|${X}|${negCount(A)},${negCount(B)}`,
      data: { A: nums(A0), shapeA: formatOf(A0), B: l !== 0 ? nums(B) : [], kl: [k, l], t: [withT ? 1 : 0] },
      answer: nums(R),
    }
  })
}

// Transponierte (Stufe 1)
function buildMatTranspose(rng: Rng, _level: Level): Built {
  return retry(() => {
    const [m, n] = rng.pick([[2, 3], [3, 2], [2, 4], [4, 2], [3, 4]] as const)
    const name = rng.pick(['A', 'B', 'M', 'P'])
    const A = randMat(rng, m, n, -4, 6)
    const R = transpose(A)
    return {
      kind: 'matTranspose',
      instruction: `Bilde die Transponierte $${name}${T}$.`,
      functionLatex: nameEq(name, A),
      steps: [transposeStep(rng, name, A)],
      cards: [MAT_CARD.transponieren],
      resultLatex: `${name}${T} = ${matLatex(R)}`,
      form: `matTranspose|${m}x${n}|${name}|${negCount(A)}`,
      data: { A: nums(A), shape: [m, n] },
      answer: nums(R),
    }
  })
}

// Produkt mit Falk-Schema; Stufe 3 manchmal „Welches Produkt ist definiert?“
const PRODUCT_SHAPES: Readonly<Record<number, readonly (readonly [number, number, number])[]>> = {
  2: [
    [2, 2, 2],
    [2, 3, 2],
    [3, 2, 2],
    [2, 2, 3],
    [1, 3, 2],
    [3, 2, 1],
  ],
  3: [
    [3, 3, 3],
    [2, 3, 3],
    [3, 2, 3],
    [2, 3, 1],
    [3, 3, 2],
    [2, 4, 2],
  ],
}

function buildMatProduct(rng: Rng, level: Level): Built {
  return retry(() => {
    const [X, Y] = rng.pick(MAT_LETTERS)
    const [m, n, p] = rng.pick(PRODUCT_SHAPES[Math.min(level, 3)])
    const A = randMat(rng, m, n)
    const B = randMat(rng, n, p)
    // Stufe 3: Matrizen in vertauschter Reihenfolge gegeben, nur eins der Produkte definiert
    const oneWay = level >= 3 && m !== p && rng.chance(0.5)
    const [first] = oneWay && rng.chance(0.5) ? [Y, X] : [X, Y]
    const steps: GuidedStep[] = []
    // gerechnet wird Links · Rechts = A · B; die Namen: X für A, Y für B
    const expr = `${X}${Y}`
    if (oneWay) {
      const answers = [`nur $${X}${Y}$`, `nur $${Y}${X}$`, 'beide', 'keins']
      const nm = (k: number) => `${k}`
      steps.push(
        choiceStep(rng, {
          id: 'definiert',
          title: 'Definiert?',
          question: `Welches der Produkte $${X}${Y}$ und $${Y}${X}$ ist definiert?`,
          correct: answers[0],
          wrongs: answers.slice(1).map((content) => ({ content, rule: 'mat-product-undefined' })),
          hint: 'Ein Produkt ist definiert, wenn die linke Matrix so viele Spalten hat wie die rechte Zeilen.',
          explanation: {
            detailed: `$${X} \\in \\mathbb{R}^{${fmtLatex(m, n)}}$, $${Y} \\in \\mathbb{R}^{${fmtLatex(n, p)}}$. Bei $${X}${Y}$ treffen sich $${nm(n)}$ Spalten und $${nm(n)}$ Zeilen: passt. Bei $${Y}${X}$ träfen sich $${nm(p)}$ Spalten und $${nm(m)}$ Zeilen: passt nicht.`,
            short: `Nur $${X}${Y}$: Spalten von $${X}$ = Zeilen von $${Y}$.`,
          },
          cards: [MAT_CARD.produkt],
        }),
      )
    }
    steps.push(...productFormatStep(rng, expr, [m, n], [n, p]))
    if (m * p > 1) steps.push(entryStep(rng, Q, A, B, expr, rng.int(0, m - 1), rng.int(0, p - 1)))
    steps.push(productStep(rng, Q, A, B, expr))
    const C = mul(A, B)
    const names = first === X ? [X, Y] : [Y, X]
    const mats = first === X ? [A, B] : [B, A]
    return {
      kind: 'matProduct',
      instruction: oneWay ? 'Berechne das Produkt der beiden Matrizen, das definiert ist.' : `Berechne $${expr}$.`,
      functionLatex: given(names, mats),
      steps,
      cards: [MAT_CARD.produkt],
      resultLatex: `${expr} = ${matLatex(C)}`,
      form: `matProduct|${m}${n}${p}|${oneWay ? (first === X ? 'o1' : 'o2') : ''}|${X}|${negCount(A)},${negCount(B)}`,
      data: { A: nums(A), B: nums(B), shape: [m, n, p] },
      answer: nums(C),
    }
  })
}

// Matrix mal Vektor; in der Ebene mit Bild: Einheitsquadrat wird zum Parallelogramm, Spalten sind die Bilder von e₁, e₂
function gridDrawing(A: Mat, x: readonly number[], name: string, full: boolean): VectorDrawing {
  const a = nums(A)
  const img = (p: readonly number[]) => [a[0] * p[0] + a[1] * p[1], a[2] * p[0] + a[3] * p[1]]
  const sq = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  const base = emptyDrawing(
    2,
    full
      ? `$${name}$ bildet das Einheitsquadrat auf das Parallelogramm ab, das die Spalten von $${name}$ aufspannen; das ganze Gitter verzerrt sich mit. Der Pfeil $\\vec x$ wird zu $${name}\\vec x$.`
      : `Das Einheitsquadrat mit $\\vec e_1$ und $\\vec e_2$ und der Vektor $\\vec x$.`,
  )
  if (!full)
    return {
      ...base,
      polygons: [{ points: sq, color: 'muted' }],
      arrows: [
        { from: [0, 0], to: [1, 0], color: 'a', label: '\\vec e_1' },
        { from: [0, 0], to: [0, 1], color: 'b', label: '\\vec e_2' },
        { from: [0, 0], to: [...x], color: 'muted', label: '\\vec x', ghost: true },
      ],
    }
  // Bild des Gitters [0, 2]²: Linien x = k und y = k
  const grid = [0, 1, 2].flatMap((k) => [
    { from: img([k, 0]), to: img([k, 2]), color: 'muted' as const, dashed: true, phase: 1 },
    { from: img([0, k]), to: img([2, k]), color: 'muted' as const, dashed: true, phase: 1 },
  ])
  return {
    ...base,
    polygons: [
      { points: sq, color: 'muted' },
      { points: sq.map(img), color: 'c', phase: 1, from: sq },
    ],
    segments: grid,
    arrows: [
      { from: [0, 0], to: [1, 0], color: 'muted', ghost: true },
      { from: [0, 0], to: [0, 1], color: 'muted', ghost: true },
      { from: [0, 0], to: img([1, 0]), color: 'a', label: `${name}\\vec e_1`, phase: 1 },
      { from: [0, 0], to: img([0, 1]), color: 'b', label: `${name}\\vec e_2`, phase: 1 },
      { from: [0, 0], to: [...x], color: 'muted', label: '\\vec x', ghost: true },
      { from: [0, 0], to: img(x), color: 'r', label: `${name}\\vec x`, phase: 2 },
    ],
  }
}

const colLatex = (v: readonly Rational[]) => `\\begin{pmatrix} ${v.map(ratLatex).join(' \\\\ ')} \\end{pmatrix}`

function buildMatVector(rng: Rng, level: Level): Built {
  return retry(() => {
    const dim = level === 2 ? 2 : 3
    const name = rng.pick(['A', 'M', 'P'])
    let A = randMat(rng, dim, dim, -3, 3)
    // in der Ebene: nicht ausgeartet (Fläche nicht 0) und nicht schon diagonal
    while (dim === 2 && (ratEq(ratMul(A[0][0], A[1][1]), ratMul(A[0][1], A[1][0])) || (isZero(A[0][1]) && isZero(A[1][0])))) A = randMat(rng, 2, 2, -3, 3)
    const x = build(dim, 1, () => rat(rng.int(-2, 3)))
    if (x.every((r) => isZero(r[0]))) return { kind: 'matVector', instruction: '', steps: [], cards: [], form: '', data: {}, answer: [] } as unknown as Built
    const xs = nums(x)
    const j = rng.int(0, dim - 1)
    const e = build(dim, 1, (i) => rat(i === j ? 1 : 0))
    const ej = `\\vec e_${j + 1}`
    const column = (X: Mat) => colLatex(X.map((r) => r[0]))
    const steps: GuidedStep[] = []
    const Ae = mul(A, e)
    const unitWrongs: Wrong[] = []
    const row = transpose([A[j]])
    if (!matEq(Q, row, Ae)) unitWrongs.push({ content: math(`${name}${ej} = ${column(row)}`), rule: 'mat-col-row' })
    const plus = product(Q, A, e, 'plus')!
    if (!matEq(Q, plus, Ae)) unitWrongs.push({ content: math(`${name}${ej} = ${column(plus)}`), rule: 'mat-falk-plus' })
    steps.push(
      choiceStep(rng, {
        id: 'einheit',
        title: 'Bild eines Einheitsvektors',
        question: `Wohin bildet $${name}$ den Einheitsvektor $${ej}$ ab?`,
        correct: math(`${name}${ej} = ${column(Ae)}`),
        wrongs: unitWrongs,
        hint: `Rechne Zeile mal Vektor. In $${ej}$ ist nur der $${j + 1}$. Eintrag $1$, alle anderen sind $0$.`,
        explanation: {
          detailed: `In jeder Zeile bleibt nur der Eintrag der $${j + 1}$. Spalte übrig, weil die anderen mit $0$ malgenommen werden. Darum ist $${name}${ej}$ die $${j + 1}$. **Spalte** von $${name}$: Die Spalten einer Matrix sind die Bilder der Einheitsvektoren.`,
          short: `$${name}${ej}$ ist die $${j + 1}$. Spalte.`,
        },
        established: [`${name}${ej} = ${column(Ae)}`],
        cards: [MAT_CARD.matrixVektor],
        ...(dim === 2 ? { drawing: gridDrawing(A, xs, name, false) } : {}),
      }),
    )
    const Ax = mul(A, x)
    const vecWrongs = [
      { M: mul(transpose(A), x), rule: 'mat-col-row' },
      { M: product(Q, A, x, 'noSum')!, rule: 'mat-falk-no-sum' },
      { M: product(Q, A, x, 'plus')!, rule: 'mat-falk-plus' },
    ]
    const show = (X: Mat) => math(`${name}\\vec x = ${column(X)}`)
    steps.push(
      choiceStep(rng, {
        id: 'bild',
        title: 'Matrix mal Vektor',
        question: `Wie lautet $${name}\\vec x$?`,
        correct: show(Ax),
        wrongs: vecWrongs.filter((w) => !matEq(Q, w.M, Ax)).map((w) => ({ content: show(w.M), rule: w.rule })),
        hint: `Jeder Eintrag ist eine Zeile von $${name}$ mal $\\vec x$. Oder: $x_1$ mal die erste Spalte plus $x_2$ mal die zweite …`,
        explanation: {
          detailed: `Zeile mal Vektor: Der erste Eintrag ist $${falkEntry(Q, A, x, 0, 0, 'right')!.latex} = ${ratLatex(Ax[0][0])}$, die anderen genauso. Anders gesehen: $${name}\\vec x = ${xs.map((v, i) => `${Q.factor(rat(v))} \\cdot ${column(transpose([transpose(A)[i]]))}`).join(' + ')}$.`,
          short: 'Zeile mal Vektor, für jede Zeile.',
        },
        established: [`${name}\\vec x = ${column(Ax)}`],
        cards: [MAT_CARD.matrixVektor],
      }),
    )
    return {
      kind: 'matVector',
      instruction: `Berechne $${name}${ej}$ und $${name}\\vec x$.`,
      functionLatex: arrange([
        { latex: nameEq(name, A), cols: dim },
        { latex: `\\vec x = ${column(x)}`, cols: 1 },
      ]),
      steps,
      cards: [MAT_CARD.matrixVektor],
      resultLatex: `${name}\\vec x = ${column(Ax)}`,
      ...(dim === 2 ? { resultDrawing: gridDrawing(A, xs, name, true) } : {}),
      form: `matVector|${dim}|${j}|${name}|${negCount(A)}|${xs.filter((v) => v < 0).length}`,
      data: { A: nums(A), x: xs, j: [j] },
      answer: nums(Ax),
    }
  })
}

// „Welcher Ausdruck ist definiert?“ mit drei Matrizen, dann ausrechnen
type ExprKind = 'prod' | 'sum' | 'tprodL' | 'tprodR' | 'tsum'
type Cand = { readonly kind: ExprKind; readonly x: number; readonly y: number }
function candLatex(c: Cand, names: readonly string[]): string {
  const [X, Y] = [names[c.x], names[c.y]]
  switch (c.kind) {
    case 'prod':
      return `${X}${Y}`
    case 'sum':
      return `${X} + ${Y}`
    case 'tprodL':
      return `${X}${T} ${Y}`
    case 'tprodR':
      return `${X} ${Y}${T}`
    case 'tsum':
      return `${X}${T} + ${Y}`
  }
}
type Fmt = readonly [number, number]
function candFormat(c: Cand, f: readonly Fmt[]): Fmt | null {
  const tr = (g: Fmt): Fmt => [g[1], g[0]]
  const prod = (a: Fmt, b: Fmt): Fmt | null => (a[1] === b[0] ? [a[0], b[1]] : null)
  const sum = (a: Fmt, b: Fmt): Fmt | null => (a[0] === b[0] && a[1] === b[1] ? a : null)
  const [a, b] = [f[c.x], f[c.y]]
  switch (c.kind) {
    case 'prod':
      return prod(a, b)
    case 'sum':
      return sum(a, b)
    case 'tprodL':
      return prod(tr(a), b)
    case 'tprodR':
      return prod(a, tr(b))
    case 'tsum':
      return sum(tr(a), b)
  }
}
// Fehler, wenn ein nicht definierter Ausdruck als definiert gewählt wird
function undefinedRule(c: Cand, f: readonly Fmt[]): string {
  const plain: Cand = { ...c, kind: c.kind === 'tsum' ? 'sum' : c.kind === 'prod' || c.kind === 'sum' ? c.kind : 'prod' }
  if (c.kind !== plain.kind && candFormat(plain, f)) return 'mat-transpose-ignored'
  return c.kind === 'sum' || c.kind === 'tsum' ? 'mat-sum-formats' : 'mat-product-undefined'
}

const DEFINED_FORMATS: readonly Fmt[] = [
  [2, 3],
  [3, 2],
  [2, 2],
  [3, 3],
  [1, 3],
  [3, 1],
]

function buildMatDefined(rng: Rng, level: Level): Built {
  return retry(() => {
    const names = rng.pick(MAT_LETTERS)
    const f: Fmt[] = [rng.pick(DEFINED_FORMATS), rng.pick(DEFINED_FORMATS), rng.pick(DEFINED_FORMATS)]
    const cands: Cand[] = []
    for (const kind of ['prod', 'sum', 'tprodL', 'tprodR', 'tsum'] as const) for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (x !== y) cands.push({ kind, x, y })
    // Stufe 4: definiert ist ein Ausdruck mit Transponierter
    const okKinds: readonly ExprKind[] = level >= 4 ? ['tprodL', 'tprodR', 'tsum'] : ['prod', 'tprodL', 'tprodR', 'tsum']
    const defined = rng.shuffle(cands.filter((c) => okKinds.includes(c.kind) && candFormat(c, f)))
    const undef = rng.shuffle(cands.filter((c) => !candFormat(c, f)))
    if (defined.length === 0 || undef.length < 3) return { steps: [] } as unknown as Built
    const chosen = defined[0]
    // drei nicht definierte, möglichst mit verschiedenen Fehlern
    const picked: Cand[] = []
    for (const c of undef) if (picked.length < 3 && !picked.some((p) => undefinedRule(p, f) === undefinedRule(c, f))) picked.push(c)
    for (const c of undef) if (picked.length < 3 && !picked.includes(c)) picked.push(c)
    const mats = f.map(([m, n]) => randMat(rng, m, n, -2, 4))
    const exprLatex = candLatex(chosen, names)
    const steps: GuidedStep[] = [
      choiceStep(rng, {
        id: 'definiert',
        title: 'Definiert?',
        question: 'Welcher Ausdruck ist definiert?',
        correct: math(exprLatex),
        wrongs: picked.map((c) => ({ content: math(candLatex(c, names)), rule: undefinedRule(c, f) })),
        hint: 'Schreib zu jeder Matrix das Format (nach dem Transponieren vertauscht). Summe: gleiches Format. Produkt: Spalten links = Zeilen rechts.',
        explanation: {
          detailed: `Die Formate: ${names.map((nm, i) => `$${nm} \\in \\mathbb{R}^{${fmtLatex(...f[i])}}$`).join(', ')}. Beim Transponieren tauschen Zeilen und Spalten. $${exprLatex}$ passt: ${chosen.kind === 'tsum' ? 'beide Summanden haben dasselbe Format' : 'die linke Matrix hat so viele Spalten wie die rechte Zeilen'}.`,
          short: 'Summe: gleiches Format; Produkt: Spalten links = Zeilen rechts.',
        },
        cards: [MAT_CARD.produkt, MAT_CARD.rechnen],
      }),
    ]
    const [X, Y] = [mats[chosen.x], mats[chosen.y]]
    const [nX, nY] = [names[chosen.x], names[chosen.y]]
    let result: Mat
    if (chosen.kind === 'tsum') {
      steps.push(transposeStep(rng, nX, X))
      const R = add(transpose(X), Y)
      const show = (M2: Mat) => math(`${exprLatex} = ${matLatex(M2)}`)
      const wrongs: Wrong[] = []
      for (const [M2, rule] of [
        [sameFormat(X, Y) ? add(X, Y) : null, 'mat-transpose-ignored'],
        [add(reshape(X), Y), 'mat-transpose-reshape'],
        [add(antiTranspose(X), Y), 'mat-transpose-anti'],
        [build(rowsOf(Y), colsOf(Y), (i, j) => ratSub(transpose(X)[i][j], Y[i][j])), 'mat-plus-minus'],
      ] as const)
        if (M2 && !matEq(Q, M2, R)) wrongs.push({ content: show(M2), rule })
      steps.push(
        choiceStep(rng, {
          id: 'summe',
          title: 'Summe',
          question: `Wie lautet $${exprLatex}$?`,
          correct: show(R),
          wrongs,
          hint: 'Zähl die Einträge an derselben Stelle zusammen.',
          explanation: { detailed: `Stelle für Stelle: oben links $${ratLatex(transpose(X)[0][0])} + ${Q.factor(Y[0][0])} = ${ratLatex(R[0][0])}$, die anderen genauso.`, short: 'Stelle für Stelle.' },
          established: [`${exprLatex} = ${matLatex(R)}`],
          cards: [MAT_CARD.rechnen],
        }),
      )
      result = R
    } else {
      const L0 = chosen.kind === 'tprodL' ? transpose(X) : X
      const R0 = chosen.kind === 'tprodR' ? transpose(Y) : Y
      if (chosen.kind === 'tprodL') steps.push(transposeStep(rng, nX, X))
      if (chosen.kind === 'tprodR') steps.push(transposeStep(rng, nY, Y))
      steps.push(...productFormatStep(rng, exprLatex, formatOf(L0), formatOf(R0)))
      // vergessenes Transponieren, wenn es auch so ginge
      const ignored = chosen.kind === 'tprodL' ? product(Q, X, R0) : chosen.kind === 'tprodR' ? product(Q, L0, Y) : null
      steps.push(productStep(rng, Q, L0, R0, exprLatex, ignored ? [{ M: ignored, rule: 'mat-transpose-ignored' }] : []))
      result = mul(L0, R0)
    }
    return {
      kind: 'matDefined',
      instruction: 'Welcher der Ausdrücke ist definiert? Berechne ihn.',
      functionLatex: given(names, mats),
      note: `Zur Auswahl: ${[chosen, ...picked].map((c) => `$${candLatex(c, names)}$`).sort().join(', ')}.`,
      steps,
      cards: [MAT_CARD.produkt, MAT_CARD.transponieren],
      resultLatex: `${exprLatex} = ${matLatex(result)}`,
      form: `matDefined|${f.map((g) => g.join('')).join(',')}|${chosen.kind}${chosen.x}${chosen.y}|${names[0]}`,
      data: { X: nums(X), Y: nums(Y), fx: f[chosen.x], fy: f[chosen.y], kind: [['prod', 'sum', 'tprodL', 'tprodR', 'tsum'].indexOf(chosen.kind)] },
      answer: nums(result),
    }
  })
}

// (AB)ᵀ: Regel, Produkt, Transponierte
function buildMatTransposeProduct(rng: Rng, level: Level): Built {
  return retry(() => {
    const [X, Y] = rng.pick(MAT_LETTERS)
    const shapes: readonly (readonly [number, number, number])[] = level === 3 ? [[2, 2, 2], [2, 3, 2], [3, 2, 2], [2, 2, 3]] : [[2, 3, 2], [3, 2, 3], [2, 3, 3], [3, 3, 2], [3, 3, 3]]
    const [m, n, p] = rng.pick(shapes)
    const A = randMat(rng, m, n, -2, 4)
    const B = randMat(rng, n, p, -2, 4)
    const ab = `${X}${Y}`
    const tl = `(${ab})${T}`
    const steps: GuidedStep[] = [
      choiceStep(rng, {
        id: 'regel',
        title: 'Regel',
        question: `Welche Regel gilt für $${tl}$?`,
        correct: math(`${tl} = ${Y}${T} ${X}${T}`),
        wrongs: [
          { content: math(`${tl} = ${X}${T} ${Y}${T}`), rule: 'mat-transpose-rule' },
          { content: math(`${tl} = ${Y}${X}`), rule: 'mat-transpose-order-only' },
          { content: math(`${tl} = ${X}${Y}${T}`), rule: 'mat-transpose-rule' },
        ],
        hint: 'Prüf die Formate: Welche Reihenfolge passt nach dem Transponieren zusammen?',
        explanation: {
          detailed: `Beim Transponieren eines Produkts dreht sich die Reihenfolge um, und jeder Faktor wird transponiert. Die Formate bestätigen es: $${Y}${T}$ ist $${fmtLatex(p, n)}$, $${X}${T}$ ist $${fmtLatex(n, m)}$, zusammen $${fmtLatex(p, m)}$ wie $${tl}$.`,
          short: `Reihenfolge umdrehen, jeden Faktor transponieren.`,
        },
        cards: [MAT_CARD.transponieren],
      }),
    ]
    steps.push(productStep(rng, Q, A, B, ab))
    const C = mul(A, B)
    const R = transpose(C)
    const tWrongs: Wrong[] = []
    for (const [M2, rule] of [
      [product(Q, transpose(A), transpose(B)), 'mat-transpose-rule'],
      [rowsOf(C) === colsOf(C) ? null : reshape(C), 'mat-transpose-reshape'],
      [antiTranspose(C), 'mat-transpose-anti'],
      [C, 'mat-transpose-ignored'],
    ] as const)
      if (M2 && !matEq(Q, M2, R)) tWrongs.push({ content: math(`${tl} = ${matLatex(M2)}`), rule })
    steps.push(
      choiceStep(rng, {
        id: 'transponiert',
        title: 'Transponieren',
        question: `Wie lautet $${tl}$?`,
        correct: math(`${tl} = ${matLatex(R)}`),
        wrongs: tWrongs,
        hint: `Transponier das Ergebnis $${ab}$: Zeilen werden Spalten.`,
        explanation: { detailed: `Die erste Zeile von $${ab}$ wird die erste Spalte von $${tl}$ und so weiter. Zur Probe: $${Y}${T}${X}${T}$ gibt dieselbe Matrix.`, short: 'Zeilen werden Spalten.' },
        established: [`${tl} = ${matLatex(R)}`],
        cards: [MAT_CARD.transponieren],
      }),
    )
    return {
      kind: 'matTransposeProduct',
      instruction: `Berechne $${tl}$.`,
      functionLatex: given([X, Y], [A, B]),
      steps,
      cards: [MAT_CARD.transponieren, MAT_CARD.produkt],
      resultLatex: `${tl} = ${matLatex(R)}`,
      form: `matTransposeProduct|${m}${n}${p}|${X}|${negCount(A)},${negCount(B)}`,
      data: { A: nums(A), B: nums(B), shape: [m, n, p] },
      answer: nums(R),
    }
  })
}

// Zeile mal Spalte (Zahl) und Spalte mal Zeile (Matrix)
function buildMatOuter(rng: Rng, _level: Level): Built {
  return retry(() => {
    const dim = rng.pick([2, 3, 3, 4])
    const [u, v] = rng.pick([['u', 'v'], ['a', 'b'], ['p', 'q']] as const)
    const U = randMat(rng, dim, 1, -3, 4)
    const V = randMat(rng, dim, 1, -3, 4)
    const outer = rng.chance(0.5)
    const [nu, nv] = [`\\vec ${u}`, `\\vec ${v}`]
    const expr = outer ? `${nu}\\,${nv}${T}` : `${nu}${T} ${nv}`
    const dotV = mul(transpose(U), V)[0][0]
    const steps: GuidedStep[] = []
    const fmtRight = outer ? fmtLatex(dim, dim) : fmtLatex(1, 1)
    steps.push(
      choiceStep(rng, {
        id: 'format',
        title: 'Format',
        question: `Welches Format hat $${expr}$?`,
        correct: math(fmtRight),
        wrongs: [
          { content: math(outer ? fmtLatex(1, 1) : fmtLatex(dim, dim)), rule: 'mat-outer-inner' },
          { content: math(fmtLatex(dim, 1)), rule: 'mat-product-format' },
          { content: 'nicht definiert', rule: 'mat-outer-inner' },
        ],
        hint: 'Ein Vektor ist eine Spalte, transponiert eine Zeile. Schreib die Formate der beiden Faktoren nebeneinander: Innen gleich, außen bleibt.',
        explanation: {
          detailed: outer
            ? `$(${fmtLatex(dim, 1)}) \\cdot (${fmtLatex(1, dim)})$: Innen steht zweimal $1$, außen bleibt $${fmtLatex(dim, dim)}$, eine Matrix.`
            : `$(${fmtLatex(1, dim)}) \\cdot (${fmtLatex(dim, 1)})$: Innen steht zweimal $${dim}$, außen bleibt $${fmtLatex(1, 1)}$, eine Zahl.`,
          short: outer ? 'Spalte mal Zeile gibt eine Matrix.' : 'Zeile mal Spalte gibt eine Zahl.',
        },
        cards: [MAT_CARD.produkt],
      }),
    )
    const col = (X: Mat) => colLatex(X.map((r) => r[0]))
    let resultLatex: string
    let answer: number[]
    if (outer) {
      const R = mul(U, transpose(V))
      const show = (M2: Mat) => math(`${expr} = ${matLatex(M2)}`)
      const wrongs: Wrong[] = []
      const swapped = mul(V, transpose(U))
      if (!matEq(Q, swapped, R)) wrongs.push({ content: show(swapped), rule: 'mat-order-swap' })
      wrongs.push({ content: math(`${expr} = ${ratLatex(dotV)}`), rule: 'mat-outer-inner' })
      wrongs.push({ content: math(`${expr} = ${col(build(dim, 1, (i) => ratMul(U[i][0], V[i][0])))}`), rule: 'mat-entrywise' })
      steps.push(
        choiceStep(rng, {
          id: 'produkt',
          title: 'Spalte mal Zeile',
          question: `Wie lautet $${expr}$?`,
          correct: show(R),
          wrongs,
          hint: `Der Eintrag in Zeile $i$ und Spalte $j$ ist $${u}_i \\cdot ${v}_j$.`,
          explanation: { detailed: `Jede Zeile von $${nu}$ (eine Zahl) mal jede Spalte von $${nv}${T}$ (eine Zahl): oben links $${Q.factor(U[0][0])} \\cdot ${Q.factor(V[0][0])} = ${ratLatex(R[0][0])}$, in Zeile $i$ steht $${u}_i$ mal die ganze Zeile $${nv}${T}$.`, short: `Eintrag $${u}_i ${v}_j$.` },
          established: [`${expr} = ${matLatex(R)}`],
          cards: [MAT_CARD.produkt],
        }),
      )
      resultLatex = `${expr} = ${matLatex(R)}`
      answer = nums(R)
    } else {
      const e = falkEntry(Q, transpose(U), V, 0, 0, 'right')!
      const wrongs: Wrong[] = []
      for (const how of ['noSum', 'plus'] as const) {
        const w = falkEntry(Q, transpose(U), V, 0, 0, how)!
        if (!ratEq(w.value, dotV)) wrongs.push({ content: math(`${expr} = ${w.latex} = ${ratLatex(w.value)}`), rule: how === 'noSum' ? 'mat-falk-no-sum' : 'mat-falk-plus' })
      }
      wrongs.push({ content: math(`${expr} = ${matLatex(mul(U, transpose(V)))}`), rule: 'mat-outer-inner' })
      steps.push(
        choiceStep(rng, {
          id: 'produkt',
          title: 'Zeile mal Spalte',
          question: `Wie lautet $${expr}$?`,
          correct: math(`${expr} = ${e.latex} = ${ratLatex(dotV)}`),
          wrongs,
          hint: 'Zeile mal Spalte: Einträge paarweise malnehmen und addieren, wie beim Skalarprodukt.',
          explanation: { detailed: `$${expr}$ ist das Skalarprodukt $${nu} \\cdot ${nv}$: $${e.latex} = ${ratLatex(dotV)}$.`, short: 'Skalarprodukt.' },
          established: [`${expr} = ${ratLatex(dotV)}`],
          cards: [MAT_CARD.produkt],
        }),
      )
      resultLatex = `${expr} = ${ratLatex(dotV)}`
      answer = [Number(dotV.n) / Number(dotV.d)]
    }
    return {
      kind: 'matOuter',
      instruction: `Berechne $${expr}$.`,
      functionLatex: `${nu} = ${col(U)},\\; ${nv} = ${col(V)}`,
      steps,
      cards: [MAT_CARD.produkt],
      resultLatex,
      form: `matOuter|${dim}|${outer ? 'o' : 'i'}|${u}|${negCount(U)},${negCount(V)}`,
      data: { u: nums(U), v: nums(V), outer: [outer ? 1 : 0] },
      answer,
    }
  })
}

// vertauschbar mit Parameter: Für welches a gilt AB = BA? B = λ·A(a*) + μ·E ist genau für a = a* mit A vertauschbar
function buildMatParam(rng: Rng, level: Level): Built {
  return retry(() => {
    const dim = level >= 5 ? 3 : 2
    const [X, Y] = rng.pick(MAT_LETTERS)
    const star = rng.pick([-3, -2, -1, 1, 2, 3, 4])
    const A0 = randMat(rng, dim, dim, -2, 3)
    // Stelle des Parameters: nicht auf der Diagonale
    const pos = rng.pick(dim === 2 ? ([[0, 1], [1, 0]] as const) : ([[0, 1], [1, 0], [0, 2], [2, 1], [1, 2]] as const))
    const Astar = A0.map((r, i) => r.map((x, j) => (i === pos[0] && j === pos[1] ? rat(star) : x)))
    // |λ| ≥ 2: sonst stünde a* als Eintrag von B an derselben Stelle
    const lam = rng.pick([2, -2, 3])
    const mu = rng.pick([1, -1, 2, -2])
    const B = add(scale(rat(lam), Astar), scale(rat(mu), identity(dim)))
    if (B.flat().some((x) => Math.abs(Number(x.n)) > 12) || negCount(B) === 0) return { steps: [] } as unknown as Built
    const AL: Mat<Lin> = A0.map((r, i) => r.map((x, j) => (i === pos[0] && j === pos[1] ? lin(ZERO, rat(1)) : lin(x))))
    const BL: Mat<Lin> = B.map((r) => r.map((x) => lin(x)))
    const AB = product(L, AL, BL)!
    const BA = product(L, BL, AL)!
    // Eintrag, in dem sich die Seiten im Parameter unterscheiden
    const cells: [number, number][] = []
    for (let i = 0; i < dim; i++) for (let j = 0; j < dim; j++) if (!ratEq(AB[i][j].c1, BA[i][j].c1)) cells.push([i, j])
    if (cells.length === 0) return { steps: [] } as unknown as Built
    const [ci, cj] = rng.pick(cells)
    const lhs = AB[ci][cj]
    const rhs = BA[ci][cj]
    const aValue = ratDiv(ratSub(rhs.c0, lhs.c0), ratSub(lhs.c1, rhs.c1))
    if (!ratEq(aValue, rat(star))) throw new Error('Matrizen: Parameter falsch gebaut')
    const steps: GuidedStep[] = [productStep(rng, L, AL, BL, `${X}${Y}`, [], 'produkt-ab'), productStep(rng, L, BL, AL, `${Y}${X}`, [{ M: AB, rule: 'mat-order-swap' }], 'produkt-ba')]
    const eq = `${linLatexOf(lhs)} = ${linLatexOf(rhs)}`
    const wrongSign = ratDiv(ratSub(lhs.c0, rhs.c0), ratSub(lhs.c1, rhs.c1))
    const wrongs: Wrong[] = [{ content: `für jedes $${PARAM}$`, rule: 'mat-commute' }]
    if (!ratEq(wrongSign, aValue)) wrongs.push({ content: math(`${PARAM} = ${ratLatex(wrongSign)}`), rule: 'mat-param-sign' })
    steps.push(
      choiceStep(rng, {
        id: 'parameter',
        title: 'Vergleichen',
        question: `Für welches $${PARAM}$ gilt $${X}${Y} = ${Y}${X}$?`,
        correct: math(`${PARAM} = ${ratLatex(aValue)}`),
        wrongs,
        hint: `Vergleich die Einträge an derselben Stelle, z. B. Zeile $${ci + 1}$, Spalte $${cj + 1}$, und löse nach $${PARAM}$ auf.`,
        explanation: {
          detailed: `Zeile $${ci + 1}$, Spalte $${cj + 1}$: $${eq}$, also $${PARAM} = ${ratLatex(aValue)}$. Die übrigen Einträge stimmen für diesen Wert ebenfalls überein (Probe), sonst gäbe es kein passendes $${PARAM}$.`,
          short: `$${eq}$ nach $${PARAM}$ auflösen.`,
        },
        established: [`${PARAM} = ${ratLatex(aValue)}`],
        cards: [MAT_CARD.vertauschbar],
      }),
    )
    return {
      kind: 'matParam',
      instruction: `Für welchen Wert von $${PARAM}$ gilt $${X}${Y} = ${Y}${X}$?`,
      functionLatex: arrange([
        { latex: `${X} = ${matLatexR(L, AL)}`, cols: dim },
        { latex: nameEq(Y, B), cols: dim },
      ]),
      steps,
      cards: [MAT_CARD.vertauschbar, MAT_CARD.produkt],
      resultLatex: `${PARAM} = ${ratLatex(aValue)}`,
      form: `matParam|${dim}|${pos.join('')}|${ci}${cj}|${X}|${lam},${mu}|${negCount(A0)}`,
      data: { A: nums(Astar), B: nums(B), pos: [...pos], dim: [dim] },
      answer: [star],
    }
  })
}

// längere Ausdrücke (Stufe 5): A Bᵀ − kC, (A + kB)ᵀ C, Aᵀ A − kE
function buildMatExpression(rng: Rng, _level: Level): Built {
  return retry(() => {
    const [X, Y, Z] = rng.pick(MAT_LETTERS)
    const variant = rng.int(0, 2)
    const [m, n] = rng.pick([[2, 3], [3, 2], [2, 2], [3, 3]] as const)
    const k = rng.pick([2, 3, -2])
    const kk = rat(Math.abs(k))
    const steps: GuidedStep[] = []
    let expr: string
    let result: Mat
    let mats: Mat[]
    let names: string[]
    if (variant === 0) {
      // A Bᵀ − kC mit A, B ∈ m × n, C ∈ m × m
      const A = randMat(rng, m, n, -2, 3)
      const B = randMat(rng, m, n, -2, 3)
      const C = randMat(rng, m, m, -2, 3)
      expr = `${X} ${Y}${T} - ${ratLatex(kk)}${Z}`
      steps.push(...productFormatStep(rng, `${X} ${Y}${T}`, [m, n], [n, m], m !== n ? [{ content: 'nicht definiert', rule: 'mat-transpose-ignored' }] : []))
      steps.push(transposeStep(rng, Y, B))
      const ABt = mul(A, transpose(B))
      steps.push(productStep(rng, Q, A, transpose(B), `${X} ${Y}${T}`, m === n ? [{ M: mul(A, B), rule: 'mat-transpose-ignored' }] : []))
      steps.push(combStep(rng, [{ k: rat(1), name: `${X} ${Y}${T}`, M: ABt }, { k: ratNeg(kk), name: Z, M: C }], 'summe', expr))
      result = add(ABt, scale(ratNeg(kk), C))
      mats = [A, B, C]
      names = [X, Y, Z]
    } else if (variant === 1) {
      // (A + kB)ᵀ C mit A, B ∈ m × n, C ∈ m × p
      const p = rng.pick([1, 2, 3])
      const A = randMat(rng, m, n, -2, 3)
      const B = randMat(rng, m, n, -2, 2)
      const C = randMat(rng, m, p, -2, 3)
      const kv = rat(k)
      const sum: Term[] = [
        { k: rat(1), name: X, M: A },
        { k: kv, name: Y, M: B },
      ]
      const inner = combLatex(sum)
      expr = `(${inner})${T} ${Z}`
      steps.push(...productFormatStep(rng, expr, [n, m], [m, p], m !== n ? [{ content: 'nicht definiert', rule: 'mat-transpose-ignored' }] : []))
      steps.push(combStep(rng, sum, 'summe'))
      const S = combValue(sum)
      steps.push(transposeStep(rng, `(${inner})`, S))
      steps.push(productStep(rng, Q, transpose(S), C, expr, m === n ? [{ M: mul(S, C), rule: 'mat-transpose-ignored' }] : []))
      result = mul(transpose(S), C)
      mats = [A, B, C]
      names = [X, Y, Z]
    } else {
      // Aᵀ A − kE mit A ∈ m × n
      const A = randMat(rng, m, n, -2, 3)
      expr = `${X}${T} ${X} - ${ratLatex(kk)}E`
      steps.push(...productFormatStep(rng, `${X}${T} ${X}`, [n, m], [m, n], m !== n ? [{ content: 'nicht definiert', rule: 'mat-transpose-ignored' }, { content: math(fmtLatex(m, m)), rule: 'mat-order-swap' }] : []))
      steps.push(transposeStep(rng, X, A))
      const G = mul(transpose(A), A)
      steps.push(productStep(rng, Q, transpose(A), A, `${X}${T} ${X}`, m === n ? [{ M: mul(A, A), rule: 'mat-transpose-ignored' }] : []))
      result = add(G, scale(ratNeg(kk), identity(n)))
      const show = (M2: Mat) => math(`${expr} = ${matLatex(M2)}`)
      const wrongs: Wrong[] = []
      for (const [M2, rule] of [
        [G.map((r) => r.map((x) => ratSub(x, kk))), 'mat-identity-all'],
        [add(G, scale(kk, identity(n))), 'mat-plus-minus'],
        [add(scale(kk, identity(n)), scale(rat(-1), G)), 'mat-sub-reversed'],
      ] as const)
        if (!matEq(Q, M2, result)) wrongs.push({ content: show(M2), rule })
      steps.push(
        choiceStep(rng, {
          id: 'einheitsmatrix',
          title: 'Einheitsmatrix',
          question: `Wie lautet $${expr}$?`,
          correct: show(result),
          wrongs,
          hint: `$E$ hat Einsen auf der Hauptdiagonale und sonst Nullen.`,
          explanation: { detailed: `$${ratLatex(kk)}E$ hat $${ratLatex(kk)}$ auf der Hauptdiagonale und sonst $0$. Also wird nur auf der Diagonale $${ratLatex(kk)}$ abgezogen.`, short: `Nur auf der Diagonale abziehen.` },
          established: [`${expr} = ${matLatex(result)}`],
          cards: [MAT_CARD.rechnen],
        }),
      )
      mats = [A]
      names = [X]
    }
    return {
      kind: 'matExpression',
      instruction: `Berechne $${expr}$.`,
      functionLatex: given(names, mats),
      steps,
      cards: [MAT_CARD.produkt, MAT_CARD.transponieren, MAT_CARD.rechnen],
      resultLatex: `${expr} = ${matLatex(result)}`,
      form: `matExpression|${variant}|${m}x${n}|${variant === 1 ? k : Math.abs(k)}|${X}|${mats.map(negCount).join(',')}`,
      data: { variant: [variant], k: [k], ...Object.fromEntries(mats.map((M2, i) => [`M${i}`, nums(M2)])), ...Object.fromEntries(mats.map((M2, i) => [`F${i}`, [...formatOf(M2)]])) },
      answer: nums(result),
    }
  })
}

export const MATRIX_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['matBuild', 'matLinear', 'matTranspose'],
  2: ['matLinear', 'matProduct', 'matVector'],
  3: ['matProduct', 'matVector', 'matDefined', 'matTransposeProduct'],
  4: ['matDefined', 'matTransposeProduct', 'matOuter', 'matParam'],
  5: ['matExpression', 'matParam'],
}

export const MATRIX_BUILDERS: Readonly<Record<Extract<VectorKind, `mat${string}`>, (rng: Rng, level: Level) => Built>> = {
  matBuild: buildMatBuild,
  matLinear: buildMatLinear,
  matTranspose: buildMatTranspose,
  matProduct: buildMatProduct,
  matVector: buildMatVector,
  matDefined: buildMatDefined,
  matTransposeProduct: buildMatTransposeProduct,
  matOuter: buildMatOuter,
  matParam: buildMatParam,
  matExpression: buildMatExpression,
}
