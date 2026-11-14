import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Quad, quadAt, quadLatex, termsLatex } from './crossTasks.ts'
import { type VectorDrawing, emptyDrawing } from './figures.ts'
import { bodyDrawing } from './spatTasks.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { sarrusFigure } from './sarrus.ts'
import { ratLatex } from './vec.ts'

// Baustein „Determinanten“ (M7 Schritt 9a) der Tätigkeit „Matrizen und Gleichungssysteme“: 2 × 2 mit Fläche als Bild,
// Sarrus mit Volumen als Bild, Dreiecksmatrix, Entwicklung mit dem Schachbrett (bis 5 × 5, nach der Zeile oder Spalte
// mit den meisten Nullen), Zeilenumformungen (Tausch, Faktor, Vielfaches addieren), Nullen erzeugen und entwickeln,
// Regeln (det(λA), det Aᵀ, det A⁻¹, det(Aᵏ), det(AB)) und Determinante mit Parameter (nicht invertierbar, Spalten
// linear abhängig). Alles exakt mit Brüchen; Einträge mit Parameter sind linear (c0 + c1·a), die Determinante dann
// höchstens quadratisch.

// ------------------------------------------------------------------ Matrizen

export type Mat = readonly (readonly Rational[])[]
export type Lin = { readonly c0: Rational; readonly c1: Rational }
export type PMat = readonly (readonly Lin[])[]

const PARAM = 'a'
export const lin = (c0: Rational, c1: Rational = ZERO): Lin => ({ c0, c1 })
const constMat = (A: Mat): PMat => A.map((r) => r.map((x) => lin(x)))
export const at = (A: PMat, a: Rational): Mat => A.map((r) => r.map((x) => ratAdd(x.c0, ratMul(x.c1, a))))
const hasParam = (A: PMat) => A.some((r) => r.some((x) => !isZero(x.c1)))
const num = (x: Rational) => Number(x.n) / Number(x.d)
const nums = (A: Mat) => A.flat().map(num)
const R = (k: number) => rat(k)

export const linLatex = (x: Lin) => termsLatex([[x.c1, PARAM], [x.c0, '']])
// als Faktor: in Klammern, wenn negativ oder eine Summe
export const linFactor = (x: Lin) => {
  const s = linLatex(x)
  return (!isZero(x.c1) && !isZero(x.c0)) || s.startsWith('-') ? `(${s})` : s
}
const fac = (x: Rational) => (ratSign(x) < 0 ? `(${ratLatex(x)})` : ratLatex(x))
const env = (A: PMat, e: string) => `\\begin{${e}} ${A.map((r) => r.map(linLatex).join(' & ')).join(' \\\\ ')} \\end{${e}}`
export const pmat = (A: PMat) => env(A, 'pmatrix')
const vmat = (A: PMat) => env(A, 'vmatrix')
export const detMatLatex = (A: Mat) => pmat(constMat(A))

const minorOf = <T>(A: readonly (readonly T[])[], i: number, j: number): T[][] => A.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j))

// Determinante exakt mit dem Gauß-Verfahren (Brüche)
export function det(A: Mat): Rational {
  const n = A.length
  const M = A.map((r) => [...r])
  let d = ONE
  for (let c = 0; c < n; c++) {
    let p = c
    while (p < n && isZero(M[p][c])) p++
    if (p === n) return ZERO
    if (p !== c) {
      ;[M[p], M[c]] = [M[c], M[p]]
      d = ratNeg(d)
    }
    d = ratMul(d, M[c][c])
    for (let r = c + 1; r < n; r++) {
      const f = ratDiv(M[r][c], M[c][c])
      if (!isZero(f)) M[r] = M[r].map((x, k) => ratSub(x, ratMul(f, M[c][k])))
    }
  }
  return d
}

// Wert einer Rechnung mit der Matrix als Polynom im Parameter (höchstens quadratisch): aus drei Stellen, mit Probe
export function polyOf(A: PMat, f: (M: Mat) => Rational): Quad {
  const [v0, v1, vm] = [f(at(A, ZERO)), f(at(A, ONE)), f(at(A, R(-1)))]
  const q: Quad = { q2: ratSub(ratDiv(ratAdd(v1, vm), R(2)), v0), q1: ratDiv(ratSub(v1, vm), R(2)), q0: v0 }
  if (!ratEq(quadAt(q, R(2)), f(at(A, R(2)))) || !ratEq(quadAt(q, R(-3)), f(at(A, R(-3))))) throw new Error('Determinante: Grad über 2')
  return q
}
const qConst = (x: Rational): Quad => ({ q2: ZERO, q1: ZERO, q0: x })
const qEq = (p: Quad, q: Quad) => ratEq(p.q2, q.q2) && ratEq(p.q1, q.q1) && ratEq(p.q0, q.q0)
const qAdd = (p: Quad, q: Quad): Quad => ({ q2: ratAdd(p.q2, q.q2), q1: ratAdd(p.q1, q.q1), q0: ratAdd(p.q0, q.q0) })
const qScale = (k: Rational, q: Quad): Quad => ({ q2: ratMul(k, q.q2), q1: ratMul(k, q.q1), q0: ratMul(k, q.q0) })
const qLatex = (q: Quad) => quadLatex(q, PARAM)
const detQ = (A: PMat) => polyOf(A, det)
// q = c · p für eine Zahl c (p nicht 0)
const isMultiple = (q: Quad, p: Quad) => {
  const [a, b] = [[q.q2, q.q1, q.q0], [p.q2, p.q1, p.q0]]
  return a.every((x, i) => a.every((y, j) => ratEq(ratMul(x, b[j]), ratMul(y, b[i]))))
}

// ------------------------------------------------------------------ Karten, Namen, Zufall

export const DET_CARD = {
  zwei: 'det-zwei',
  sarrus: 'det-sarrus',
  entwickeln: 'det-entwickeln',
  umformen: 'det-umformen',
  regeln: 'det-regeln',
  parameter: 'det-parameter',
} as const

const NAMES = ['A', 'B', 'M', 'P'] as const
const PAIRS = [
  ['A', 'B'],
  ['M', 'N'],
  ['P', 'Q'],
] as const

const nonzero = (rng: Rng, lo = -3, hi = 4) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}
const negCount = (A: Mat) => A.flat().filter((x) => ratSign(x) < 0).length
const zeroCount = (A: Mat) => A.flat().filter(isZero).length
const negMask = (xs: readonly Rational[]) => xs.map((x) => (ratSign(x) < 0 ? '1' : '0')).join('')

// Wiederholt den Bau, bis jeder Schritt mindestens drei Antworten hat; null heißt: Zahlen ungeeignet, neu ziehen
function retry(make: () => Built | null): Built {
  for (let k = 0; k < 400; k++) {
    const built = make()
    if (built && built.steps.length > 0 && built.steps.every((s) => s.choices.length >= 3)) return built
  }
  throw new Error('Determinanten: keine Aufgabe mit genug Antworten gefunden')
}

const valueLine = (name: string, q: Quad) => math(`${name} = ${qLatex(q)}`)
// falsche Werte ohne Doppelte und ohne den richtigen
function valueWrongs(name: string, right: Quad, cands: readonly (readonly [Quad | null, string])[]): Wrong[] {
  const out: Wrong[] = []
  const seen: Quad[] = [right]
  for (const [q, rule] of cands) {
    if (!q || seen.some((s) => qEq(s, q))) continue
    seen.push(q)
    out.push({ content: valueLine(name, q), rule })
  }
  return out
}

// ------------------------------------------------------------------ 2 × 2 und Sarrus

const det2Latex = (M: PMat) => `${linFactor(M[0][0])} \\cdot ${linFactor(M[1][1])} - ${linFactor(M[0][1])} \\cdot ${linFactor(M[1][0])}`

export function det2Step(rng: Rng, name: string, A: Mat): GuidedStep {
  const [[a, b], [c, d]] = A
  const right = det(A)
  const line = (x: Rational) => math(`${name} = ${ratLatex(x)}`)
  const wrongs: Wrong[] = []
  for (const [x, rule] of rng.shuffle([
    [ratAdd(ratMul(a, d), ratMul(b, c)), 'det-2-plus'],
    [ratSub(ratMul(b, c), ratMul(a, d)), 'det-2-swap'],
    [ratSub(ratMul(a, b), ratMul(c, d)), 'det-2-rows'],
  ] as const))
    if (!ratEq(x, right)) wrongs.push({ content: line(x), rule })
  return choiceStep(rng, {
    id: 'det',
    title: 'Determinante',
    question: `Wie groß ist $${name}$?`,
    correct: line(right),
    wrongs,
    hint: 'Hauptdiagonale (oben links mal unten rechts) minus Nebendiagonale (oben rechts mal unten links).',
    explanation: {
      detailed: `Hauptdiagonale minus Nebendiagonale: $${name} = ${det2Latex(constMat(A))} = ${ratLatex(ratMul(a, d))} - ${fac(ratMul(b, c))} = ${ratLatex(right)}$.`,
      short: `$${det2Latex(constMat(A))} = ${ratLatex(right)}$.`,
    },
    established: [`${name} = ${ratLatex(right)}`],
    cards: [DET_CARD.zwei],
  })
}

// Sarrus (3 × 3) und seine typischen Fehler; Einträge dürfen den Parameter enthalten
const MAIN = [
  [[0, 0], [1, 1], [2, 2]],
  [[0, 1], [1, 2], [2, 0]],
  [[0, 2], [1, 0], [2, 1]],
] as const
const ANTI = [
  [[0, 2], [1, 1], [2, 0]],
  [[0, 0], [1, 2], [2, 1]],
  [[0, 1], [1, 0], [2, 2]],
] as const
type Diag = readonly (readonly [number, number])[]
const prodOf = (M: Mat, d: Diag) => d.reduce((s, [i, j]) => ratMul(s, M[i][j]), ONE)
const sumOf = (M: Mat, ds: readonly Diag[]) => ds.reduce((s, d) => ratAdd(s, prodOf(M, d)), ZERO)
const SARRUS = {
  right: (M: Mat) => ratSub(sumOf(M, MAIN), sumOf(M, ANTI)),
  plus: (M: Mat) => ratAdd(sumOf(M, MAIN), sumOf(M, ANTI)),
  one: (M: Mat) => ratSub(prodOf(M, MAIN[0]), prodOf(M, ANTI[0])),
  swap: (M: Mat) => ratSub(sumOf(M, ANTI), sumOf(M, MAIN)),
  diag: (M: Mat) => prodOf(M, MAIN[0]),
}

export function sarrusLatex(A: PMat): { readonly scheme: string; readonly products: string } {
  const L = A.map((r) => r.map(linLatex))
  const F = A.map((r) => r.map(linFactor))
  const scheme = `\\begin{array}{rrr|rr} ${L.map((r) => [...r, r[0], r[1]].join(' & ')).join(' \\\\ ')} \\end{array}`
  const p = (d: Diag) => d.map(([i, j]) => F[i][j]).join(' \\cdot ')
  return { scheme, products: `${MAIN.map(p).join(' + ')} - ${ANTI.map(p).join(' - ')}` }
}

export function sarrusStep(rng: Rng, name: string, A: PMat, opts: { readonly id?: string; readonly cards?: readonly string[] } = {}): GuidedStep {
  const right = polyOf(A, SARRUS.right)
  const withParam = hasParam(A)
  // mit Parameter ohne „vertauscht“: −p(a) hat dieselben Nullstellen (wie beim Spatprodukt)
  const cands: [Quad, string][] = rng.shuffle([
    [polyOf(A, SARRUS.plus), 'det-sarrus-plus'],
    [polyOf(A, SARRUS.one), 'det-sarrus-one'],
    [polyOf(A, SARRUS.diag), 'det-triangle-not'],
    ...(withParam ? [] : [[polyOf(A, SARRUS.swap), 'det-sarrus-swap'] as [Quad, string]]),
  ])
  const { scheme, products } = sarrusLatex(A)
  const M = at(A, ZERO)
  // mit Parameter auch kein anderes Vielfaches von p(a) (z. B. Nebendiagonalen addiert gleich −p(a)): gleiche Nullstellen
  const offered = withParam ? cands.filter(([q]) => !isMultiple(q, right)) : cands
  const six = withParam ? '' : termsLatex([...MAIN.map((d) => [prodOf(M, d), ''] as const), ...ANTI.map((d) => [ratNeg(prodOf(M, d)), ''] as const)])
  const values = six !== '' && six !== qLatex(right) ? ` = ${six}` : ''
  const sarrus = sarrusFigure(name, A.map((r) => r.map(linLatex)), A.map((r) => r.map(linFactor)), values.slice(3), qLatex(right))
  const step = choiceStep(rng, {
    id: opts.id ?? 'sarrus',
    title: 'Sarrus',
    question: `Wie groß ist $${name}$?`,
    correct: valueLine(name, right),
    wrongs: valueWrongs(name, right, offered),
    hint: 'Schreib die ersten beiden Spalten noch einmal rechts daneben. Drei Diagonalen nach rechts unten zählen mit Plus, drei nach links unten mit Minus.',
    explanation: {
      detailed: `Sarrus mit den ersten beiden Spalten daneben:\n$${scheme}$\nDrei Diagonalen nach rechts unten positiv, drei nach links unten negativ: $${name} = ${products}${values} = ${qLatex(right)}$.`,
      short: `$${name} = ${products} = ${qLatex(right)}$.`,
    },
    established: [`${name} = ${qLatex(right)}`],
    cards: opts.cards ?? [DET_CARD.sarrus],
  })
  return { ...step, sarrus }
}

// ------------------------------------------------------------------ Bilder: Fläche und Volumen

const colsOf = (A: Mat) => A[0].map((_, j) => A.map((r) => r[j]))

// Einheitsquadrat und das Parallelogramm aus den Spalten; mit Ergebnis wird das Quadrat beim Abspielen zum Parallelogramm
function areaDrawing(A: Mat, name: string, full: boolean): VectorDrawing {
  const [s1, s2] = colsOf(A).map((c) => c.map(num))
  const low = name.toLowerCase()
  const sq = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  const par = [[0, 0], s1, [s1[0] + s2[0], s1[1] + s2[1]], s2]
  const d = det(A)
  const area = ratLatex(ratAbs(d))
  if (!full)
    return {
      ...emptyDrawing(2, `Die Spalten $\\vec ${low}_1$ und $\\vec ${low}_2$ von $${name}$ spannen ein Parallelogramm auf.`),
      polygons: [{ points: par, color: 'c' }],
      arrows: [
        { from: [0, 0], to: s1, color: 'a', label: `\\vec ${low}_1` },
        { from: [0, 0], to: s2, color: 'b', label: `\\vec ${low}_2` },
      ],
    }
  const turn =
    ratSign(d) > 0
      ? `Weil $\\det ${name} > 0$ ist, liegt $\\vec ${low}_2$ wie $\\vec e_2$ gegen den Uhrzeigersinn von $\\vec ${low}_1$ aus.`
      : `Weil $\\det ${name} < 0$ ist, liegt $\\vec ${low}_2$ im Uhrzeigersinn von $\\vec ${low}_1$ aus: Die Orientierung kehrt sich um.`
  return {
    ...emptyDrawing(2, `$${name}$ macht aus dem Einheitsquadrat (Fläche $1$) das Parallelogramm der Spalten mit der Fläche $\\lvert\\det ${name}\\rvert = ${area}$. ${turn}`),
    polygons: [
      { points: sq, color: 'muted' },
      { points: par, color: 'c', phase: 1, from: sq },
    ],
    arrows: [
      { from: [0, 0], to: [1, 0], color: 'muted', label: '\\vec e_1', ghost: true },
      { from: [0, 0], to: [0, 1], color: 'muted', label: '\\vec e_2', ghost: true },
      { from: [0, 0], to: s1, color: 'a', label: `\\vec ${low}_1`, phase: 1 },
      { from: [0, 0], to: s2, color: 'b', label: `\\vec ${low}_2`, phase: 1 },
    ],
  }
}

function spatDrawing(A: Mat, name: string, full: boolean): VectorDrawing {
  const low = name.toLowerCase()
  const [c1, c2, c3] = colsOf(A)
  const names = [`\\vec ${low}_1`, `\\vec ${low}_2`, `\\vec ${low}_3`] as const
  const caption = full
    ? `Die Spalten von $${name}$ spannen einen Spat auf; sein Volumen ist $\\lvert\\det ${name}\\rvert = ${ratLatex(ratAbs(det(A)))}$.`
    : `Die drei Spalten von $${name}$ als Pfeile.`
  return bodyDrawing('spat', names, c1, c2, c3, caption, full ? { result: true } : {})
}

// Fläche bzw. Volumen aus den Spalten: Betrag der Determinante
function measureStep(rng: Rng, name: string, A: Mat): GuidedStep {
  const d = det(A)
  const two = A.length === 2
  const sym = two ? 'F' : 'V'
  const right = ratAbs(d)
  const line = (x: Rational) => math(`${sym} = ${ratLatex(x)}`)
  const cands: [Rational, string][] = [
    [d, 'det-abs'],
    ...(two
      ? ([
          [ratDiv(right, R(2)), 'det-area-half'],
          [ratAbs(ratMul(A[0][0], A[1][1])), 'det-triangle-not'],
          [ratAbs(ratAdd(ratMul(A[0][0], A[1][1]), ratMul(A[0][1], A[1][0]))), 'det-2-plus'],
        ] as [Rational, string][])
      : ([
          [ratDiv(right, R(6)), 'det-volume-factor'],
          [ratDiv(right, R(2)), 'det-volume-factor'],
          [ratAbs(SARRUS.plus(A)), 'det-sarrus-plus'],
        ] as [Rational, string][])),
  ]
  const wrongs: Wrong[] = []
  for (const [x, rule] of cands) if (!ratEq(x, right) && !wrongs.some((w) => w.content === line(x))) wrongs.push({ content: line(x), rule })
  const low = name.toLowerCase()
  const what = two ? `die Fläche $F$ des Parallelogramms, das die Spalten $\\vec ${low}_1$ und $\\vec ${low}_2$ aufspannen` : `das Volumen $V$ des Spats, den die Spalten von $${name}$ aufspannen`
  return choiceStep(rng, {
    id: two ? 'flaeche' : 'volumen',
    title: two ? 'Fläche' : 'Volumen',
    question: `Wie groß ist ${what}?`,
    correct: line(right),
    wrongs,
    hint: two ? 'Die Fläche des Parallelogramms aus den Spalten ist der Betrag der Determinante.' : 'Das Volumen des Spats aus den Spalten ist der Betrag der Determinante (wie beim Spatprodukt).',
    explanation: {
      detailed: `${two ? 'Fläche' : 'Volumen'} ist nie negativ: $${sym} = \\lvert\\det ${name}\\rvert = \\lvert ${ratLatex(d)} \\rvert = ${ratLatex(right)}$. Das Vorzeichen von $\\det ${name}$ sagt nur, ob ${two ? 'die Spalten gegen den Uhrzeigersinn aufeinander folgen' : 'die Spalten ein Rechtssystem bilden'} (positiv) oder nicht.`,
      short: `$${sym} = \\lvert ${ratLatex(d)} \\rvert = ${ratLatex(right)}$.`,
    },
    established: [`${sym} = ${ratLatex(right)}`],
    cards: [two ? DET_CARD.zwei : DET_CARD.sarrus],
    drawing: two ? areaDrawing(A, name, false) : spatDrawing(A, name, false),
  })
}

// ------------------------------------------------------------------ Entwickeln mit dem Schachbrett

type Line = { readonly row: boolean; readonly idx: number }
const lineOf = <T>(A: readonly (readonly T[])[], line: Line): T[] => A.map((_, k) => (line.row ? A[line.idx][k] : A[k][line.idx]))
const posOf = (line: Line, k: number): readonly [number, number] => (line.row ? [line.idx, k] : [k, line.idx])
const lineWord = (line: Line) => `${line.idx + 1}. ${line.row ? 'Zeile' : 'Spalte'}`
const signAt = (i: number, j: number) => ((i + j) % 2 === 0 ? 1 : -1)
const checkerLatex = (n: number) =>
  `\\begin{pmatrix} ${Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (signAt(i, j) > 0 ? '+' : '-')).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`

// Zeilen und Spalten mit ihrer Zahl von Nullen (Parameter zählt als nicht 0)
function allLines(n: number): Line[] {
  return [...Array.from({ length: n }, (_, i) => ({ row: true, idx: i })), ...Array.from({ length: n }, (_, i) => ({ row: false, idx: i }))]
}
const zerosIn = (A: PMat, line: Line) => lineOf(A, line).filter((x) => isZero(x.c0) && isZero(x.c1)).length
// die Zeile bzw. Spalte hat echt mehr Nullen als jede andere
const uniqueBest = (A: PMat, line: Line) => allLines(A.length).every((l) => (l.row === line.row && l.idx === line.idx) || zerosIn(A, l) < zerosIn(A, line))

type How = 'right' | 'ignored' | 'shift' | 'minor' | 'factor'
type ExpTerm = { readonly sign: 1 | -1; readonly coef: Rational | null; readonly minor: PMat; readonly at: readonly [number, number] }

function expansion(A: PMat, line: Line, how: How): ExpTerm[] {
  const n = A.length
  const out: ExpTerm[] = []
  lineOf(A, line).forEach((x, k) => {
    if (!isZero(x.c1)) throw new Error('Determinante: Parameter in der Zeile, nach der entwickelt wird')
    if (isZero(x.c0)) return
    const [i, j] = posOf(line, k)
    const s = signAt(i, j)
    const minor = how === 'minor' ? (line.row ? minorOf(A, i, (j + 1) % n) : minorOf(A, (i + 1) % n, j)) : minorOf(A, i, j)
    out.push({ sign: how === 'ignored' ? 1 : how === 'shift' ? (-s as 1 | -1) : s, coef: how === 'factor' ? null : x.c0, minor, at: [i, j] })
  })
  return out
}
const expansionValue = (terms: readonly ExpTerm[]) => terms.reduce((s, t) => qAdd(s, qScale(ratMul(R(t.sign), t.coef ?? ONE), detQ(t.minor))), qConst(ZERO))
const expansionLatex = (terms: readonly ExpTerm[], show: (t: ExpTerm) => string = (t) => vmat(t.minor)) =>
  terms
    .map((t, x) => {
      const sg = t.sign < 0 ? (x === 0 ? '-' : ' - ') : x === 0 ? '' : ' + '
      return `${sg}${t.coef ? `${fac(t.coef)} \\cdot ` : ''}${show(t)}`
    })
    .join('')
const minorName = (name: string, at: readonly [number, number]) => `${name}_{${at[0] + 1}${at[1] + 1}}`

// Welche Zeile oder Spalte? (ab 4 × 4)
function methodStep(rng: Rng, name: string, A: PMat, line: Line): GuidedStep {
  const n = A.length
  const zeros = zerosIn(A, line)
  return choiceStep(rng, {
    id: 'methode',
    title: 'Vorgehen',
    question: `Wie berechnest du $\\det ${name}$ am geschicktesten?`,
    correct: `Nach der ${lineWord(line)} entwickeln: Dort stehen ${zeros} Nullen.`,
    wrongs: [
      { content: `Mit Sarrus: die ersten ${n - 1} Spalten noch einmal rechts daneben schreiben.`, rule: 'det-sarrus-big' },
      { content: 'Die Einträge der Hauptdiagonale malnehmen.', rule: 'det-triangle-not' },
      { content: `Gar nicht nötig: $\\det ${name} = 0$, weil die ${lineWord(line)} fast nur Nullen hat.`, rule: 'det-zero-row' },
    ],
    hint: 'Sarrus gilt nur für $3 \\times 3$. Bei größeren Matrizen entwickelst du nach einer Zeile oder Spalte; je mehr Nullen darin, desto weniger Unterdeterminanten.',
    explanation: {
      detailed: `Sarrus gibt es nur für $3 \\times 3$. Beim Entwickeln fällt jeder Summand weg, dessen Eintrag $0$ ist. Die ${lineWord(line)} hat ${zeros} Nullen, mehr als jede andere Zeile oder Spalte; ${n - zeros === 1 ? 'es bleibt eine Unterdeterminante' : `es bleiben ${n - zeros} Unterdeterminanten`} der Größe $${n - 1} \\times ${n - 1}$.`,
      short: `Nach der ${lineWord(line)} entwickeln (${zeros} Nullen).`,
    },
    cards: [DET_CARD.entwickeln],
  })
}

function expandStep(rng: Rng, name: string, A: PMat, line: Line, id = 'entwickeln'): GuidedStep {
  const n = A.length
  const right = expansion(A, line, 'right')
  const value = expansionValue(right)
  const head = `\\det ${name} = `
  const wrongs: Wrong[] = []
  const seen = new Set<string>([expansionLatex(right)])
  for (const [how, rule] of rng.shuffle([
    ['ignored', 'det-checker-ignored'],
    ['shift', 'det-checker-shift'],
    ['minor', 'det-minor-wrong'],
    ['factor', 'det-expand-factor'],
  ] as const)) {
    const terms = expansion(A, line, how)
    const latex = expansionLatex(terms)
    // nie eine falsche Entwicklung, die zufällig denselben Wert hat
    if (seen.has(latex) || qEq(expansionValue(terms), value)) continue
    seen.add(latex)
    wrongs.push({ content: math(head + latex), rule })
  }
  const named = expansionLatex(right, (t) => `\\det ${minorName(name, t.at)}`)
  const zeros = zerosIn(A, line)
  return choiceStep(rng, {
    id,
    title: 'Entwickeln',
    question: `Entwickle $\\det ${name}$ nach der ${lineWord(line)}. Was ergibt sich?`,
    correct: math(head + expansionLatex(right)),
    wrongs,
    hint: `Jeder Eintrag der ${lineWord(line)} mal die Determinante ohne seine Zeile und Spalte. Das Vorzeichen kommt aus dem Schachbrett, oben links $+$.`,
    explanation: {
      detailed: `Schachbrett der Vorzeichen: $${checkerLatex(n)}$. ${zeros === 1 ? 'Die Null' : `Die ${zeros} Nullen`} der ${lineWord(line)} ${zeros === 1 ? 'fällt' : 'fallen'} weg. Für jeden übrigen Eintrag streichst du seine Zeile und Spalte (Unterdeterminante $\\det ${name}_{ij}$): $\\det ${name} = ${named}$.`,
      short: `$\\det ${name} = ${named}$.`,
    },
    cards: [DET_CARD.entwickeln],
  })
}

// ------------------------------------------------------------------ Arten

// 2 × 2 (Stufe 1), oft mit der Fläche aus den Spalten
function buildDetTwo(rng: Rng, _level: Level): Built {
  return retry(() => {
    const name = rng.pick(NAMES)
    const A: Mat = [
      [R(nonzero(rng, -4, 5)), R(rng.int(-4, 5))],
      [R(rng.int(-4, 5)), R(nonzero(rng, -4, 5))],
    ]
    const d = det(A)
    if (isZero(d) || negCount(A) === 0 || (isZero(A[0][1]) && isZero(A[1][0]))) return null
    const area = rng.chance(0.5)
    const dn = `\\det ${name}`
    const steps = [det2Step(rng, dn, A)]
    if (area) steps.push(measureStep(rng, name, A))
    return {
      kind: 'detTwo',
      instruction: area ? `Berechne $${dn}$ und die Fläche des Parallelogramms aus den Spalten.` : `Berechne $${dn}$.`,
      functionLatex: `${name} = ${detMatLatex(A)}`,
      steps,
      cards: [DET_CARD.zwei],
      resultLatex: area ? `${dn} = ${ratLatex(d)},\\; F = ${ratLatex(ratAbs(d))}` : `${dn} = ${ratLatex(d)}`,
      resultDrawing: areaDrawing(A, name, true),
      form: `detTwo|${area ? 'F' : ''}|${negMask(A.flat())}|${zeroCount(A)}|${name}|${ratSign(d)}`,
      data: { A: nums(A), n: [2] },
      answer: area ? [num(d), num(ratAbs(d))] : [num(d)],
    }
  })
}

// 3 × 3 mit Sarrus (Stufe 1); Stufe 2 oft mit dem Volumen des Spats aus den Spalten
function randFull(rng: Rng, n: number, lo = -3, hi = 4): Mat {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => R(rng.int(lo, hi))))
}

function buildDetSarrus(rng: Rng, level: Level): Built {
  return retry(() => {
    const name = rng.pick(NAMES)
    const A = randFull(rng, 3, level === 1 ? -2 : -3, level === 1 ? 3 : 4)
    const d = det(A)
    if (isZero(d) || Math.abs(num(d)) > 80 || negCount(A) < 2 || zeroCount(A) > 2) return null
    const volume = level >= 2 && rng.chance(0.6)
    const dn = `\\det ${name}`
    const steps = [sarrusStep(rng, dn, constMat(A))]
    if (volume) steps.push(measureStep(rng, name, A))
    return {
      kind: 'detSarrus',
      instruction: volume ? `Berechne $${dn}$ und das Volumen des Spats aus den Spalten.` : `Berechne $${dn}$.`,
      functionLatex: `${name} = ${detMatLatex(A)}`,
      steps,
      cards: [DET_CARD.sarrus],
      resultLatex: volume ? `${dn} = ${ratLatex(d)},\\; V = ${ratLatex(ratAbs(d))}` : `${dn} = ${ratLatex(d)}`,
      ...(volume ? { resultDrawing: spatDrawing(A, name, true) } : {}),
      form: `detSarrus|${volume ? 'V' : ''}|${negMask(A[0])}${negMask(A[1])}|${zeroCount(A)}|${name}|${ratSign(d)}`,
      data: { A: nums(A), n: [3] },
      answer: volume ? [num(d), num(ratAbs(d))] : [num(d)],
    }
  })
}

// Dreiecksmatrix (Stufe 2): Produkt der Hauptdiagonale
function buildDetTriangle(rng: Rng, _level: Level): Built {
  return retry(() => {
    const name = rng.pick(NAMES)
    const n = rng.pick([3, 4, 4])
    const upper = rng.chance(0.5)
    const A: Mat = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? R(nonzero(rng, -3, 4)) : (upper ? j > i : j < i) ? R(rng.int(-4, 6)) : ZERO)),
    )
    const diag = A.map((r, i) => r[i])
    const d = det(A)
    if (Math.abs(num(d)) > 150 || negCount(A) < 2) return null
    const dn = `\\det ${name}`
    const anti = A.reduce((s, r, i) => ratMul(s, r[n - 1 - i]), ONE)
    const sum = diag.reduce(ratAdd, ZERO)
    const step = choiceStep(rng, {
      id: 'dreieck',
      title: 'Dreiecksmatrix',
      question: `Wie groß ist $${dn}$?`,
      correct: valueLine(dn, qConst(d)),
      wrongs: valueWrongs(dn, qConst(d), [
        [qConst(sum), 'det-triangle-sum'],
        [qConst(anti), 'det-triangle-anti'],
        [qConst(ZERO), 'det-zero-row'],
      ]),
      hint: `${upper ? 'Unter' : 'Über'} der Hauptdiagonale stehen nur Nullen. Was bleibt übrig, wenn du nach der ersten ${upper ? 'Spalte' : 'Zeile'} entwickelst?`,
      explanation: {
        detailed: `$${name}$ ist eine ${upper ? 'obere' : 'untere'} Dreiecksmatrix: ${upper ? 'unter' : 'über'} der Hauptdiagonale stehen nur Nullen. Entwickelst du immer wieder nach der ersten ${upper ? 'Spalte' : 'Zeile'}, bleibt jedes Mal nur der Eintrag auf der Diagonale. Also ist die Determinante das Produkt der Hauptdiagonale: $${dn} = ${diag.map(fac).join(' \\cdot ')} = ${ratLatex(d)}$.`,
        short: `Produkt der Diagonale: $${diag.map(fac).join(' \\cdot ')} = ${ratLatex(d)}$.`,
      },
      established: [`${dn} = ${ratLatex(d)}`],
      cards: [DET_CARD.umformen],
    })
    return {
      kind: 'detTriangle',
      instruction: `Berechne $${dn}$.`,
      functionLatex: `${name} = ${detMatLatex(A)}`,
      steps: [step],
      cards: [DET_CARD.umformen],
      resultLatex: `${dn} = ${ratLatex(d)}`,
      form: `detTriangle|${n}|${upper ? 'o' : 'u'}|${negMask(diag)}|${negCount(A)}|${name}`,
      data: { A: nums(A), n: [n] },
      answer: [num(d)],
    }
  })
}

// Matrix mit einer Zeile oder Spalte voller Nullen (bis auf die Einträge an keep), sonst Einträge ohne 0, dazu
// höchstens extra weitere Nullen; null, wenn diese Zeile nicht eindeutig die meisten Nullen hat
function lineMatrix(rng: Rng, n: number, line: Line, keep: readonly number[], extra: number): Mat | null {
  const A = Array.from({ length: n }, () => Array.from({ length: n }, () => R(nonzero(rng))))
  for (let k = 0; k < n; k++) {
    const [i, j] = posOf(line, k)
    if (!keep.includes(k)) A[i][j] = ZERO
  }
  for (let e = 0; e < extra; e++) {
    const [i, j] = [rng.int(0, n - 1), rng.int(0, n - 1)]
    if ((line.row ? i : j) !== line.idx) A[i][j] = ZERO
  }
  // bei 3 × 3 mit einer Null hat die Spalte durch diese Null genauso viele: dann sagt die Aufgabe, wonach entwickelt wird
  return n < 4 || uniqueBest(constMat(A), line) ? A : null
}

// Matrix um eine Zeile r und Spalte c größer machen, B bleibt als Unterdeterminante A_rc; nach der Zeile r (row) bzw.
// Spalte c wird entwickelt: dort steht nur der Eintrag pivot
function embed(rng: Rng, B: PMat, r: number, c: number, row: boolean, pivot: Rational): PMat {
  const n = B.length + 1
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === r && j === c) return lin(pivot)
      if (row ? i === r : j === c) return lin(ZERO)
      if (i === r || j === c) return lin(R(nonzero(rng)))
      return B[i < r ? i : i - 1][j < c ? j : j - 1]
    }),
  )
}

const pickLine = (rng: Rng, n: number): Line => ({ row: rng.chance(0.5), idx: rng.int(0, n - 1) })

// Entwickeln (Stufe 2: 3 × 3, Stufe 3: 4 × 4 mit einem Eintrag, Stufe 4: mit zwei, Stufe 5: 5 × 5 zweimal)
function buildDetExpand(rng: Rng, level: Level): Built {
  return retry(() => {
    const name = rng.pick(NAMES)
    const steps: GuidedStep[] = []
    let A: PMat
    let line: Line
    const extraWrongs: [Quad, string][] = []
    if (level <= 4) {
      const n = level === 2 ? 3 : 4
      line = pickLine(rng, n)
      const count = level === 3 ? 1 : 2
      const keep = rng.shuffle(Array.from({ length: n }, (_, k) => k)).slice(0, count)
      const M = lineMatrix(rng, n, line, keep, n === 4 ? rng.int(0, 1) : 0)
      if (!M) return null
      A = constMat(M)
      if (n === 4) steps.push(methodStep(rng, name, A, line))
      steps.push(expandStep(rng, name, A, line))
      if (n === 4) for (const [x, t] of expansion(A, line, 'right').entries()) steps.push(sarrusStep(rng, `\\det ${minorName(name, t.at)}`, t.minor, { id: `sarrus-${x + 1}`, cards: [DET_CARD.sarrus, DET_CARD.entwickeln] }))
    } else {
      // 5 × 5: nach einer Zeile (Spalte) mit vier Nullen, die Unterdeterminante 4 × 4 nach einer mit drei Nullen
      const inner: Line = pickLine(rng, 4)
      const B0 = lineMatrix(rng, 4, inner, [rng.int(0, 3)], rng.int(0, 1))
      if (!B0) return null
      const B = constMat(B0)
      const [r, c] = [rng.int(0, 4), rng.int(0, 4)]
      line = { row: inner.row, idx: inner.row ? r : c }
      A = embed(rng, B, r, c, inner.row, R(nonzero(rng, -3, 3)))
      if (!uniqueBest(A, line)) return null
      const bName = name === 'B' ? 'C' : 'B'
      steps.push(methodStep(rng, name, A, line))
      steps.push(expandStep(rng, name, A, line, 'entwickeln-1'))
      // B = A_rc: ab hier B mit eigenen Unterdeterminanten
      const step2 = expandStep(rng, bName, B, inner, 'entwickeln-2')
      steps.push({ ...step2, question: `Weiter mit der Unterdeterminante $${bName} = ${minorName(name, [r, c])} = ${pmat(B)}$. Entwickle $\\det ${bName}$ nach der ${lineWord(inner)}. Was ergibt sich?` })
      const t = expansion(B, inner, 'right')[0]
      steps.push(sarrusStep(rng, `\\det ${minorName(bName, t.at)}`, t.minor, { cards: [DET_CARD.sarrus, DET_CARD.entwickeln] }))
      // Folgefehler in der inneren Entwicklung
      const outer = expansion(A, line, 'right')[0]
      const k = ratMul(R(outer.sign), outer.coef!)
      for (const [how, rule] of [
        ['ignored', 'det-checker-ignored'],
        ['factor', 'det-expand-factor'],
      ] as const)
        extraWrongs.push([qScale(k, expansionValue(expansion(B, inner, how))), rule])
    }
    const value = detQ(A)
    if (!qEq(value, expansionValue(expansion(A, line, 'right')))) throw new Error('Determinante: Entwicklung falsch')
    const d = value.q0
    if (isZero(d) || Math.abs(num(d)) > 2000) return null
    const dn = `\\det ${name}`
    const terms = expansion(A, line, 'right')
    const parts = terms.map((t, x) => `${t.sign < 0 ? (x === 0 ? '-' : ' - ') : x === 0 ? '' : ' + '}${fac(t.coef!)} \\cdot ${fac(detQ(t.minor).q0)}`).join('')
    const minors = terms.map((t) => (t.minor.length === 2 ? `$${vmat(t.minor)} = ${det2Latex(t.minor)} = ${ratLatex(detQ(t.minor).q0)}$` : `$\\det ${minorName(name, t.at)} = ${ratLatex(detQ(t.minor).q0)}$`))
    const wertWrongs = valueWrongs(dn, value, [
      [expansionValue(expansion(A, line, 'ignored')), 'det-checker-ignored'],
      [expansionValue(expansion(A, line, 'shift')), 'det-checker-shift'],
      [expansionValue(expansion(A, line, 'factor')), 'det-expand-factor'],
      ...extraWrongs,
      [expansionValue(expansion(A, line, 'minor')), 'det-minor-wrong'],
    ])
    steps.push(
      choiceStep(rng, {
        id: 'wert',
        title: 'Zusammensetzen',
        question: `Wie groß ist $${dn}$?`,
        correct: valueLine(dn, value),
        wrongs: wertWrongs,
        hint: 'Setz die Werte der Unterdeterminanten ein, mit den Vorzeichen aus dem Schachbrett und den Einträgen davor.',
        explanation: {
          detailed: level === 5 ? `Erst $\\det ${name === 'B' ? 'C' : 'B'}$ aus der zweiten Entwicklung, dann eingesetzt in die erste: $${dn} = ${ratLatex(d)}$.` : `Unterdeterminanten: ${minors.join(', ')}. Eingesetzt: $${dn} = ${parts} = ${ratLatex(d)}$.`,
          short: `$${dn} = ${ratLatex(d)}$.`,
        },
        established: [`${dn} = ${ratLatex(d)}`],
        cards: [DET_CARD.entwickeln],
      }),
    )
    const n = A.length
    const M = at(A, ZERO)
    return {
      kind: 'detExpand',
      instruction: `Berechne $${dn}$.`,
      functionLatex: `${name} = ${pmat(A)}`,
      steps,
      cards: [DET_CARD.entwickeln, ...(n >= 4 ? [DET_CARD.sarrus] : [])],
      resultLatex: `${dn} = ${ratLatex(d)}`,
      form: `detExpand|${n}|${line.row ? 'z' : 's'}${line.idx}|${terms.map((t) => t.at.join('')).join(',')}|${negCount(M)}|${zeroCount(M)}|${name}`,
      data: { A: nums(M), n: [n] },
      answer: [num(d)],
    }
  })
}

// Zeilenumformungen (Stufe 3 mit 3 × 3, Stufe 5 mit 4 × 4): B entsteht aus A durch Tausch, Faktor und Vielfache
const zv = (k: number) => `\\vec z_{${k + 1}}`
type RowSpec = { readonly main: number; readonly k: number; readonly add?: { readonly from: number; readonly m: number } }
const rowLatex = (r: RowSpec, withK = true) => termsLatex([[R(withK ? r.k : 1), zv(r.main)], ...(r.add ? [[R(r.add.m), zv(r.add.from)] as const] : [])])
const tupleLatex = (rows: readonly RowSpec[], withK: boolean, withAdd: boolean) => `\\det(${rows.map((r) => rowLatex(withAdd ? r : { main: r.main, k: r.k }, withK)).join(',\\, ')})`
const factorLatex = (ks: readonly number[], pow: number | null) => ks.map((k) => (pow ? `${k < 0 ? `(${k})` : k}^{${pow}}` : k < 0 ? `(${k})` : `${k}`)).join(' \\cdot ')

// Vertauschungen, die die Reihenfolge sortieren (wie Auswahl-Sortieren)
function swapsOf(perm: readonly number[]): [number, number][] {
  const p = [...perm]
  const out: [number, number][] = []
  for (let i = 0; i < p.length; i++) {
    const j = p.indexOf(i)
    if (j !== i) {
      ;[p[i], p[j]] = [p[j], p[i]]
      out.push([i, j])
    }
  }
  return out
}

function buildDetRowOps(rng: Rng, level: Level): Built {
  return retry(() => {
    const n = level >= 5 ? 4 : 3
    const [X, Y] = rng.pick(PAIRS)
    let perm = rng.shuffle(Array.from({ length: n }, (_, i) => i))
    if (perm.every((p, i) => p === i)) perm = perm.map((_, i) => (i === 0 ? 1 : i === 1 ? 0 : i))
    const scaleCount = level >= 5 ? rng.int(1, 2) : rng.pick([0, 1, 1])
    const addCount = level >= 5 ? rng.int(1, 2) : scaleCount === 0 ? 1 : rng.pick([0, 1])
    const rows: RowSpec[] = perm.map((p) => ({ main: p, k: 1 }))
    for (const i of rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, scaleCount)) rows[i] = { ...rows[i], k: rng.pick([2, 3, -2, -3]) }
    // Vielfache: nur von Zeilen, die selbst nichts dazubekommen (sonst änderte sich die Determinante)
    const targets = rng.shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, addCount)
    for (const i of targets) {
      const sources = Array.from({ length: n }, (_, j) => j).filter((j) => j !== i && !targets.includes(j))
      if (sources.length === 0) return null
      rows[i] = { ...rows[i], add: { from: rows[rng.pick(sources)].main, m: rng.pick([2, -2, 3, -3, -1]) } }
    }
    const d = rng.pick([2, 3, 4, 5, -2, -3, -4, -5, 6, -6])
    // Gegenprobe: Koeffizientenmatrix C (Zeile i von B = Σ C_ij z_j), det B = det C · det A
    const C: Mat = rows.map((r) => Array.from({ length: n }, (_, j) => R((j === r.main ? r.k : 0) + (r.add && r.add.from === j ? r.add.m : 0))))
    const sgn = swapsOf(perm).length % 2 === 0 ? 1 : -1
    const K = rows.reduce((s, r) => s * r.k, 1)
    if (!ratEq(det(C), R(sgn * K))) throw new Error('Determinante: Umformungen falsch gerechnet')
    const right = sgn * K * d
    const scaled = rows.filter((r) => r.k !== 1).map((r) => r.k)
    const added = rows.filter((r) => r.add).map((r) => r.add!.m)
    const steps: GuidedStep[] = []
    const dB = `\\det ${Y}`
    const plain = tupleLatex(rows, false, true)
    if (scaled.length > 0) {
      const show = (f: string) => math(`${dB} = ${f}${f ? ' \\cdot ' : ''}${plain}`)
      const prodK = scaled.reduce((s, k) => s * k, 1)
      steps.push(
        choiceStep(rng, {
          id: 'faktor',
          title: 'Faktor vorziehen',
          question: `Was gilt für den Faktor in ${scaled.length === 1 ? 'der Zeile' : 'den Zeilen'} von $${Y}$?`,
          correct: show(factorLatex(scaled, null)),
          wrongs: [
            { content: show(factorLatex(scaled, n)), rule: 'det-row-scale-all' },
            { content: show(''), rule: 'det-row-scale-forgot' },
            { content: show(`${prodK < 0 ? '-' : ''}\\frac{1}{${Math.abs(prodK)}}`), rule: 'det-row-scale-inverse' },
          ],
          hint: 'Ein Faktor in einer einzigen Zeile kommt einmal vor die Determinante, nicht hoch $n$ wie bei $\\det(\\lambda A)$.',
          explanation: {
            detailed: `Die Determinante ist in jeder Zeile linear: Steht in einer Zeile das $k$-Fache, ist die Determinante $k$-mal so groß. Hier: $${dB} = ${factorLatex(scaled, null)} \\cdot ${plain}$.`,
            short: `Faktor je Zeile einmal: $${factorLatex(scaled, null)}$.`,
          },
          cards: [DET_CARD.umformen],
        }),
      )
    }
    const bare = tupleLatex(rows, false, false)
    if (added.length > 0) {
      const mk = added.reduce((s, m) => s * m, 1)
      const show = (f: string) => math(`${plain} = ${f}`)
      steps.push(
        choiceStep(rng, {
          id: 'addieren',
          title: 'Vielfache addieren',
          question: `In ${added.length === 1 ? 'einer Zeile' : 'zwei Zeilen'} steht zusätzlich das Vielfache einer anderen Zeile. Was gilt?`,
          correct: show(bare),
          wrongs: [
            // Produkt der Vielfachen 1 (zweimal −1): wäre richtig, dann nicht
            ...(mk === 1 ? [] : [{ content: show(`${mk < 0 ? `(${mk})` : mk} \\cdot ${bare}`), rule: 'det-add-changes' }]),
            { content: show('0'), rule: 'det-add-zero' },
          ],
          hint: 'Addiert man zu einer Zeile das Vielfache einer anderen Zeile, ändert sich die Determinante nicht.',
          explanation: {
            detailed: `Zerlegt man die Zeile mit dem Vielfachen, entsteht eine zweite Determinante mit zwei parallelen Zeilen, und die ist $0$. Also darf das Vielfache weg: $${plain} = ${bare}$.`,
            short: 'Vielfaches einer anderen Zeile addieren ändert nichts.',
          },
          cards: [DET_CARD.umformen],
        }),
      )
    }
    const swaps = swapsOf(perm)
    const swapText = swaps.length === 1 ? 'eine Vertauschung' : `${swaps.length} Vertauschungen`
    const kd = (x: number) => qConst(R(x))
    const powK = scaled.reduce((s, k) => s * k ** n, 1)
    const wrongs = valueWrongs(dB, kd(right), [
      [kd(-right), 'det-swap-sign'],
      [kd(sgn * powK * d), 'det-row-scale-all'],
      [kd(sgn * d), 'det-row-scale-forgot'],
      [added.length ? kd(right * added.reduce((s, m) => s * m, 1)) : null, 'det-add-changes'],
      [kd(0), 'det-add-zero'],
    ])
    steps.push(
      choiceStep(rng, {
        id: 'wert',
        title: 'Vertauschen',
        question: `Wie groß ist $${dB}$?`,
        correct: valueLine(dB, kd(right)),
        wrongs,
        hint: `Bring die Zeilen in die Reihenfolge $${Array.from({ length: n }, (_, i) => zv(i)).join(', ')}$. Jede Vertauschung zweier Zeilen dreht das Vorzeichen.`,
        explanation: {
          detailed: `$${bare}$ hat die Zeilen von $${X}$ in anderer Reihenfolge. Sortieren braucht ${swapText}${swaps.length > 0 ? ` (${swaps.map(([i, j]) => `Platz ${i + 1} und ${j + 1}`).join(', ')})` : ''}, das Vorzeichen ist also $${sgn > 0 ? '+' : '-'}$. Zusammen: $${dB} = ${scaled.length ? `${factorLatex(scaled, null)} \\cdot ` : ''}(${sgn > 0 ? '+1' : '-1'}) \\cdot ${fac(R(d))} = ${right}$.`,
          short: `${swapText}: Vorzeichen $${sgn > 0 ? '+' : '-'}$, $${dB} = ${right}$.`,
        },
        established: [`${dB} = ${right}`],
        cards: [DET_CARD.umformen],
      }),
    )
    const rowsOfX = Array.from({ length: n }, (_, i) => zv(i)).join(', ')
    return {
      kind: 'detRowOps',
      instruction: `$${X}$ ist eine $${n} \\times ${n}$-Matrix mit den Zeilen $${rowsOfX}$ und $\\det ${X} = ${d}$. Berechne $${dB}$.`,
      functionLatex: `${Y} = \\begin{pmatrix} ${rows.map((r) => rowLatex(r)).join(' \\\\ ')} \\end{pmatrix}`,
      steps,
      cards: [DET_CARD.umformen],
      resultLatex: `${dB} = ${right}`,
      form: `detRowOps|${n}|${perm.join('')}|${rows.map((r) => (r.k !== 1 ? 'k' : '') + (r.add ? 'm' : '')).join(',')}|${X}|${d < 0 ? '-' : '+'}`,
      data: { C: nums(C), n: [n], d: [d] },
      answer: [right],
    }
  })
}

// Nullen erzeugen und entwickeln (Stufe 4): Pivot ±1 oben links, Vielfache der ersten Zeile abziehen
function buildDetEliminate(rng: Rng, _level: Level): Built {
  return retry(() => {
    const name = rng.pick(NAMES)
    const n = rng.pick([3, 4])
    const p = R(rng.pick([1, 1, -1]))
    const A: Rational[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === 0 && j === 0 ? p : j === 0 ? R(nonzero(rng, -3, 3)) : R(rng.int(-3, 4)))))
    const f = (i: number) => ratDiv(A[i][0], p)
    const E: Mat = A.map((r, i) => (i === 0 ? r : r.map((x, k) => ratSub(x, ratMul(f(i), A[0][k])))))
    const signE: Mat = A.map((r, i) => (i === 0 ? r : r.map((x, k) => ratAdd(x, ratMul(f(i), A[0][k])))))
    const firstE: Mat = A.map((r, i) => (i === 0 ? r : r.map((x, k) => (k === 0 ? ZERO : x))))
    const revE: Mat = A.map((r, i) => (i === 0 ? r : r.map((x, k) => ratSub(ratMul(f(i), A[0][k]), x))))
    if (E.flat().some((x) => Math.abs(num(x)) > 20) || signE.flat().some((x) => Math.abs(num(x)) > 25)) return null
    const d = det(A)
    if (isZero(d) || Math.abs(num(d)) > 400 || !ratEq(det(E), d)) return null
    const name2 = `${name}'`
    const show = (M: Mat) => math(`${name2} = ${detMatLatex(M)}`)
    const same = (M: Mat, N: Mat) => M.every((r, i) => r.every((x, j) => ratEq(x, N[i][j])))
    const mats: [Mat, string][] = rng.shuffle([
      [signE, 'det-elim-sign'],
      [firstE, 'det-elim-first'],
      ...(ratEq(det(revE), d) ? [] : [[revE, 'det-elim-reversed'] as [Mat, string]]),
    ])
    const steps: GuidedStep[] = [
      choiceStep(rng, {
        id: 'eliminieren',
        title: 'Nullen erzeugen',
        question: `Zieh von jeder Zeile darunter das passende Vielfache der ersten Zeile ab, sodass in der ersten Spalte unter der $${ratLatex(p)}$ Nullen stehen. Welche Matrix $${name2}$ entsteht?`,
        correct: show(E),
        wrongs: mats.filter(([M]) => !same(M, E)).map(([M, rule]) => ({ content: show(M), rule })),
        hint: `Neue Zeile $i$ = Zeile $i$ minus $k$ mal Zeile 1, Eintrag für Eintrag; $k$ ist der erste Eintrag der Zeile $i$${ratEq(p, ONE) ? '' : ' geteilt durch $-1$'}. Die erste Zeile bleibt.`,
        explanation: {
          detailed: `${A.slice(1)
            .map((_, x) => {
              const i = x + 1
              const k = f(i)
              return `Zeile ${i + 1}: $z_${i + 1} ${ratSign(k) < 0 ? '+' : '-'} ${ratEq(ratAbs(k), ONE) ? '' : ratLatex(ratAbs(k))}z_1$`
            })
            .join(', ')}. Vielfache einer anderen Zeile abziehen ändert die Determinante nicht: $\\det ${name2} = \\det ${name}$.`,
          short: 'Vielfache der ersten Zeile abziehen, Determinante bleibt.',
        },
        established: [`${name2} = ${detMatLatex(E)}`],
        cards: [DET_CARD.umformen],
      }),
    ]
    const minor = minorOf(E, 0, 0)
    const minorName = `\\det ${name2}_{11}`
    if (n === 4) steps.push(sarrusStep(rng, minorName, constMat(minor), { cards: [DET_CARD.sarrus, DET_CARD.entwickeln] }))
    const dn = `\\det ${name}`
    const diag = E.reduce((s, r, i) => ratMul(s, r[i]), ONE)
    steps.push(
      choiceStep(rng, {
        id: 'wert',
        title: 'Entwickeln',
        question: `Entwickle nach der ersten Spalte. Wie groß ist $${dn}$?`,
        correct: valueLine(dn, qConst(d)),
        wrongs: valueWrongs(dn, qConst(d), [
          [qConst(det(signE)), 'det-elim-sign'],
          [qConst(det(firstE)), 'det-elim-first'],
          [qConst(diag), 'det-triangle-not'],
          [qConst(det(revE)), 'det-elim-reversed'],
          [qConst(ratNeg(d)), 'det-checker-shift'],
        ]),
        hint: `In der ersten Spalte von $${name2}$ steht nur noch oben links etwas. Also bleibt nur ein Summand: dieser Eintrag mal die Determinante ohne Zeile 1 und Spalte 1.`,
        explanation: {
          detailed: `Nach der ersten Spalte entwickelt (Vorzeichen oben links $+$): $${dn} = \\det ${name2} = ${fac(p)} \\cdot ${vmat(constMat(minor))} = ${fac(p)} \\cdot ${fac(det(minor))} = ${ratLatex(d)}$.`,
          short: `$${dn} = ${fac(p)} \\cdot ${fac(det(minor))} = ${ratLatex(d)}$.`,
        },
        established: [`${dn} = ${ratLatex(d)}`],
        cards: [DET_CARD.umformen, DET_CARD.entwickeln],
      }),
    )
    return {
      kind: 'detEliminate',
      instruction: `Berechne $${dn}$: erst Nullen in der ersten Spalte erzeugen, dann entwickeln.`,
      functionLatex: `${name} = ${detMatLatex(A)}`,
      steps,
      cards: [DET_CARD.umformen, DET_CARD.entwickeln],
      resultLatex: `${dn} = ${ratLatex(d)}`,
      form: `detEliminate|${n}|${ratLatex(p)}|${negMask(A.map((r) => r[0]))}|${negCount(A)}|${name}`,
      data: { A: nums(A), n: [n] },
      answer: [num(d)],
    }
  })
}

// Regeln (Stufe 3: λ und eine Matrix, Stufe 4: λ und zwei Matrizen, Stufe 5: dazu det A erst mit Sarrus)
type FKind = 'plain' | 'T' | 'inv' | 'pow'
type Factor = { readonly name: string; readonly kind: FKind; readonly k: number; readonly d: Rational }
const factorExpr = (f: Factor) => (f.kind === 'T' ? `${f.name}^{\\mathsf T}` : f.kind === 'inv' ? `${f.name}^{-1}` : f.kind === 'pow' ? `${f.name}^{${f.k}}` : f.name)
const detOf = (f: Factor) => (f.kind === 'plain' || f.kind === 'T' ? `\\det ${factorExpr(f)}` : `\\det(${factorExpr(f)})`)
const factorValue = (f: Factor): Rational => (f.kind === 'inv' ? ratDiv(ONE, f.d) : f.kind === 'pow' ? Array.from({ length: f.k }, () => f.d).reduce(ratMul, ONE) : f.d)
// typische Fehler je Faktor, jeder mit seinem eigenen Namen; nur die, die einen anderen Wert geben
function factorSlips(f: Factor): [Rational, string][] {
  const right = factorValue(f)
  const cands: [Rational, string][] =
    f.kind === 'T'
      ? [
          [ratNeg(f.d), 'det-transpose'],
          [ratDiv(ONE, f.d), 'det-transpose'],
        ]
      : f.kind === 'inv'
        ? [
            [f.d, 'det-inverse'],
            [ratNeg(f.d), 'det-inverse-negative'],
          ]
        : f.kind === 'pow'
          ? [
              [ratMul(R(f.k), f.d), 'det-power'],
              [f.d, 'det-power-forgot'],
            ]
          : []
  return cands.filter(([x], i) => !ratEq(x, right) && !cands.slice(0, i).some(([y]) => ratEq(x, y)))
}
const powR = (x: Rational, n: number) => Array.from({ length: n }, () => x).reduce(ratMul, ONE)
const lamLatex = (lam: Rational) => (ratEq(lam, R(-1)) ? '-' : ratLatex(lam))
const lamPow = (lam: Rational, n: number) => `${ratSign(lam) < 0 || lam.d !== 1n ? `\\left(${ratLatex(lam)}\\right)` : ratLatex(lam)}^{${n}}`

function buildDetRules(rng: Rng, level: Level): Built {
  return retry(() => {
    const [X, Y] = rng.pick(PAIRS)
    const n = level >= 5 ? 3 : rng.pick([2, 3, 4])
    const lam = rng.pick([R(2), R(3), R(-2), R(-1), rat(1, 2), R(2), R(-1)])
    if (Math.abs(num(powR(lam, n))) > 81) return null
    const steps: GuidedStep[] = []
    let dA = R(rng.pick([2, 3, 4, 5, -2, -3, -4, -5]))
    let given = ''
    let givenA: number[] = []
    if (level >= 5) {
      const A = randFull(rng, 3, -2, 3)
      dA = det(A)
      if (isZero(dA) || Math.abs(num(dA)) > 6 || negCount(A) < 2) return null
      steps.push(sarrusStep(rng, `\\det ${X}`, constMat(A)))
      given = `${X} = ${detMatLatex(A)}`
      givenA = nums(A)
    }
    const dB = R(rng.pick([2, 3, 4, -2, -3, -1, 1]))
    const kinds: readonly FKind[] = level === 3 ? ['T', 'inv', 'pow'] : ['plain', 'T', 'inv', 'pow']
    const pick = (name: string, d: Rational): Factor => {
      const kind = rng.pick(kinds)
      return { name, kind, k: kind === 'pow' ? rng.pick([2, 3]) : 1, d }
    }
    const factors: Factor[] = level === 3 ? [pick(X, dA)] : [pick(X, dA), pick(Y, dB)]
    if (factors.length === 2 && factors.every((f) => f.kind === 'plain')) return null
    const expr = `\\det(${lamLatex(lam)}${factors.map(factorExpr).join(' ')})`
    const vals = factors.map(factorValue)
    const prodV = vals.reduce(ratMul, ONE)
    const lamN = powR(lam, n)
    const right = ratMul(lamN, prodV)
    if (Math.abs(num(right)) > 500 || right.d > 64n) return null
    const dets = factors.map(detOf)
    if (factors.length === 2) {
      const show = (pre: string, sum: boolean) => math(`${expr} = ${pre} \\cdot ${sum ? `(${dets.join(' + ')})` : dets.join(' \\cdot ')}`)
      const lp = lamPow(lam, n)
      const wrongs: Wrong[] = []
      if (!ratEq(lam, lamN)) wrongs.push({ content: show(fac(lam), false), rule: 'det-scalar-power' })
      wrongs.push({ content: show(lp, true), rule: 'det-product-sum' })
      if (!ratEq(lam, lamN)) wrongs.push({ content: show(fac(lam), true), rule: 'det-product-sum' })
      steps.push(
        choiceStep(rng, {
          id: 'zerlegen',
          title: 'Zerlegen',
          question: `Wie zerlegst du $${expr}$ für $${n} \\times ${n}$-Matrizen?`,
          correct: show(lp, false),
          wrongs,
          hint: 'Die Determinante eines Produkts ist das Produkt der Determinanten. Eine Zahl vor der Matrix steckt in jeder der $n$ Zeilen.',
          explanation: {
            detailed: `$\\det(\\lambda M) = \\lambda^n \\det M$, weil der Faktor $\\lambda$ aus jeder der $${n}$ Zeilen herauskommt, und $\\det(MN) = \\det M \\cdot \\det N$: $${expr} = ${lp} \\cdot ${dets.join(' \\cdot ')}$.`,
            short: `$${lp} \\cdot ${dets.join(' \\cdot ')}$.`,
          },
          cards: [DET_CARD.regeln],
        }),
      )
    }
    // einzelne Determinanten
    const pairLatex = (vs: readonly Rational[]) => math(factors.map((f, i) => `${detOf(f)} = ${ratLatex(vs[i])}`).join(',\\; '))
    const slips = factors.map(factorSlips)
    const singleWrongs: Wrong[] = []
    // je Faktor seine Fehler (der andere richtig); bei zwei Faktoren dazu beide mit dem ersten Fehler
    slips.forEach((list, i) => {
      for (const [x, rule] of list) singleWrongs.push({ content: pairLatex(vals.map((v, j) => (j === i ? x : v))), rule })
    })
    if (factors.length === 2 && slips[0].length > 0 && slips[1].length > 0) singleWrongs.push({ content: pairLatex([slips[0][0][0], slips[1][0][0]]), rule: slips[0][0][1] })
    const ruleText = (f: Factor) =>
      f.kind === 'T' ? `$\\det ${f.name}^{\\mathsf T} = \\det ${f.name}$` : f.kind === 'inv' ? `$\\det(${f.name}^{-1}) = \\frac{1}{\\det ${f.name}}$` : f.kind === 'pow' ? `$\\det(${f.name}^{${f.k}}) = (\\det ${f.name})^{${f.k}}$` : `$\\det ${f.name}$ ist gegeben`
    steps.push(
      choiceStep(rng, {
        id: 'einzeln',
        title: 'Einzelne Determinanten',
        question: `Wie groß ${factors.length === 1 ? 'ist' : 'sind'} ${factors.map((f) => `$${detOf(f)}$`).join(' und ')}?`,
        correct: pairLatex(vals),
        wrongs: singleWrongs,
        hint: 'Transponieren ändert die Determinante nicht, die Inverse hat den Kehrwert, eine Potenz potenziert die Determinante.',
        explanation: {
          detailed: `${factors.map(ruleText).join(', ')}. Mit $\\det ${X} = ${ratLatex(dA)}$${factors.length === 2 ? ` und $\\det ${Y} = ${ratLatex(dB)}$` : ''}: ${factors.map((f, i) => `$${detOf(f)} = ${ratLatex(vals[i])}$`).join(', ')}.`,
          short: factors.map((f, i) => `$${detOf(f)} = ${ratLatex(vals[i])}$`).join(', '),
        },
        cards: [DET_CARD.regeln],
      }),
    )
    const q = (x: Rational | null) => (x ? qConst(x) : null)
    // Wert mit einem Fehler beim Faktor i
    const slipped = (i: number, x: Rational) => ratMul(lamN, vals.reduce((s, v, j) => ratMul(s, j === i ? x : v), ONE))
    steps.push(
      choiceStep(rng, {
        id: 'wert',
        title: 'Zusammensetzen',
        question: `Wie groß ist $${expr}$?`,
        correct: valueLine(expr, qConst(right)),
        wrongs: valueWrongs(expr, qConst(right), [
          [q(ratMul(lam, prodV)), 'det-scalar-power'],
          ...slips.flatMap((list, i) => list.map(([x, rule]) => [q(slipped(i, x)), rule] as [Quad | null, string])),
          [factors.length === 2 ? q(ratMul(lamN, ratAdd(vals[0], vals[1]))) : null, 'det-product-sum'],
        ]),
        hint: `$\\det(\\lambda M) = \\lambda^n \\det M$ mit $n = ${n}$, dann die einzelnen Determinanten malnehmen.`,
        explanation: {
          detailed: `$${expr} = ${lamPow(lam, n)} \\cdot ${vals.map(fac).join(' \\cdot ')} = ${ratLatex(lamN)} \\cdot ${fac(prodV)} = ${ratLatex(right)}$.`,
          short: `$${lamPow(lam, n)} \\cdot ${vals.map(fac).join(' \\cdot ')} = ${ratLatex(right)}$.`,
        },
        established: [`${expr} = ${ratLatex(right)}`],
        cards: [DET_CARD.regeln],
      }),
    )
    const known = [...(level >= 5 ? [] : [`\\det ${X} = ${ratLatex(dA)}`]), ...(factors.length === 2 ? [`\\det ${Y} = ${ratLatex(dB)}`] : [])]
    return {
      kind: 'detRules',
      instruction: `$${X}${factors.length === 2 ? `, ${Y}` : ''} \\in \\mathbb{R}^{${n} \\times ${n}}$${factors.length === 2 || level < 5 ? ` mit $${known.join(',\\; ')}$` : ''}. Berechne $${expr}$.`,
      functionLatex: level >= 5 ? given : known.join(',\\; '),
      steps,
      cards: [DET_CARD.regeln],
      resultLatex: `${expr} = ${ratLatex(right)}`,
      form: `detRules|${n}|${ratLatex(lam)}|${factors.map((f) => f.kind + f.k).join(',')}|${X}|${ratSign(dA)}${ratSign(dB)}`,
      data: { lam: [num(lam)], n: [n], kinds: factors.map((f) => ['plain', 'T', 'inv', 'pow'].indexOf(f.kind)), k: factors.map((f) => f.k), d: [num(dA), num(dB)], A: givenA },
      answer: [num(right)],
    }
  })
}

// Determinante mit Parameter (Stufe 4: 3 × 3 mit Sarrus, Stufe 5: 4 × 4, erst entwickeln): wann nicht invertierbar?
const CONDITIONS = [
  { text: (n: string) => `$${n}$ nicht invertierbar ist`, ask: (n: string) => `ist $${n}$ nicht invertierbar` },
  { text: (n: string) => `die Spalten von $${n}$ linear abhängig sind`, ask: (n: string) => `sind die Spalten von $${n}$ linear abhängig` },
  { text: (n: string) => `die Zeilen von $${n}$ linear abhängig sind`, ask: (n: string) => `sind die Zeilen von $${n}$ linear abhängig` },
  { text: (n: string) => `$${n}\\vec x = \\vec 0$ mehr als eine Lösung hat`, ask: (n: string) => `hat $${n}\\vec x = \\vec 0$ mehr als eine Lösung` },
] as const

// 3 × 3 mit dem Parameter an zwei Stellen (verschiedene Zeilen und Spalten); Determinante quadratisch mit zwei
// ganzzahligen Nullstellen verschiedenen Betrags, nicht 0
export function paramMatrix(rng: Rng): { readonly M: PMat; readonly roots: readonly [Rational, Rational] } | null {
  const M: Lin[][] = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => lin(R(nonzero(rng)))))
  const [i1, i2] = rng.shuffle([0, 1, 2]).slice(0, 2)
  const [j1, j2] = rng.shuffle([0, 1, 2]).slice(0, 2)
  M[i1][j1] = lin(R(rng.pick([0, 0, 1, -1, 2])), R(rng.pick([1, 1, -1])))
  M[i2][j2] = lin(R(rng.pick([0, 1, -1, -2, 3])), R(rng.pick([1, 1, -1, 2])))
  const q = detQ(M)
  if (isZero(q.q2)) return null
  const disc = ratSub(ratMul(q.q1, q.q1), ratMul(R(4), ratMul(q.q2, q.q0)))
  if (ratSign(disc) <= 0 || disc.d !== 1n) return null
  const s = Math.round(Math.sqrt(Number(disc.n)))
  if (BigInt(s) * BigInt(s) !== disc.n) return null
  const r1 = ratDiv(ratSub(ratNeg(q.q1), R(s)), ratMul(R(2), q.q2))
  const r2 = ratDiv(ratAdd(ratNeg(q.q1), R(s)), ratMul(R(2), q.q2))
  if (r1.d !== 1n || r2.d !== 1n || isZero(r1) || isZero(r2) || ratEq(ratAbs(r1), ratAbs(r2)) || Math.abs(num(r1)) > 7 || Math.abs(num(r2)) > 7) return null
  return { M, roots: ratSign(ratSub(r1, r2)) < 0 ? [r1, r2] : [r2, r1] }
}

function buildDetParam(rng: Rng, level: Level): Built {
  return retry(() => {
    const name = rng.pick(NAMES)
    const pm = paramMatrix(rng)
    if (!pm) return null
    const cond = rng.int(0, CONDITIONS.length - 1)
    const c = CONDITIONS[cond]
    const steps: GuidedStep[] = [
      choiceStep(rng, {
        id: 'bedingung',
        title: 'Bedingung',
        question: `Woran erkennst du, dass ${c.text(name)}?`,
        correct: math(`\\det ${name} = 0`),
        wrongs: [
          { content: math(`\\det ${name} \\ne 0`), rule: 'det-invertible-flip' },
          { content: math(`\\det ${name} = 1`), rule: 'det-invertible-one' },
        ],
        hint: 'Eine quadratische Matrix ist genau dann invertierbar, wenn ihre Determinante nicht 0 ist.',
        explanation: {
          detailed: `Für eine quadratische Matrix sagen alle diese Aussagen dasselbe: nicht invertierbar, Spalten linear abhängig, Zeilen linear abhängig, $${name}\\vec x = \\vec 0$ hat mehr als eine Lösung. Und das gilt genau dann, wenn $\\det ${name} = 0$ ist.`,
          short: `Genau dann, wenn $\\det ${name} = 0$.`,
        },
        cards: [DET_CARD.parameter],
      }),
    ]
    let A: PMat = pm.M
    let scale = ONE
    if (level >= 5) {
      const row = rng.chance(0.5)
      const [r, cc] = [rng.int(0, 3), rng.int(0, 3)]
      const pivot = R(nonzero(rng, -3, 3))
      A = embed(rng, pm.M, r, cc, row, pivot)
      const line: Line = { row, idx: row ? r : cc }
      if (!uniqueBest(A, line)) return null
      scale = ratMul(R(signAt(r, cc)), pivot)
      steps.push(methodStep(rng, name, A, line))
      steps.push(expandStep(rng, name, A, line))
      steps.push(sarrusStep(rng, `\\det ${minorName(name, [r, cc])}`, pm.M, { cards: [DET_CARD.sarrus, DET_CARD.parameter] }))
    } else steps.push(sarrusStep(rng, `\\det ${name}`, A, { cards: [DET_CARD.sarrus, DET_CARD.parameter] }))
    const q = detQ(A)
    if (!qEq(q, qScale(scale, detQ(pm.M)))) throw new Error('Determinante mit Parameter: Entwicklung falsch')
    const [r1, r2] = pm.roots
    const sol = (x: Rational, y: Rational) => {
      const [u, v] = ratSign(ratSub(x, y)) <= 0 ? [x, y] : [y, x]
      return math(`${PARAM}_1 = ${ratLatex(u)},\\; ${PARAM}_2 = ${ratLatex(v)}`)
    }
    const lead = q.q2
    const factored = `${ratEq(lead, ONE) ? '' : ratEq(lead, R(-1)) ? '-' : ratLatex(lead)}(${termsLatex([[ONE, PARAM], [ratNeg(r1), '']])})(${termsLatex([[ONE, PARAM], [ratNeg(r2), '']])})`
    steps.push(
      choiceStep(rng, {
        id: 'nullstellen',
        title: 'Nullstellen',
        question: `Für welche $${PARAM}$ ist $\\det ${name} = 0$?`,
        correct: sol(r1, r2),
        wrongs: [
          { content: sol(ratNeg(r1), ratNeg(r2)), rule: 'det-root-sign' },
          { content: sol(r1, ratNeg(r2)), rule: 'det-root-sign' },
          { content: sol(ratNeg(r1), r2), rule: 'det-root-sign' },
        ],
        hint: `Setz die Determinante gleich $0$ und löse die quadratische Gleichung (${ratEq(lead, ONE) ? 'p-q-Formel' : 'erst durch die Zahl vor $a^2$ teilen, dann p-q-Formel'} oder Faktorisieren).`,
        explanation: {
          detailed: `$\\det ${name} = ${qLatex(q)} = ${factored} = 0$. Ein Produkt ist $0$, wenn ein Faktor $0$ ist: $${PARAM} = ${ratLatex(r1)}$ oder $${PARAM} = ${ratLatex(r2)}$. Für alle anderen $${PARAM}$ ist $${name}$ invertierbar.`,
          short: `$${factored} = 0$: $${PARAM} = ${ratLatex(r1)}$ oder $${PARAM} = ${ratLatex(r2)}$.`,
        },
        established: [`${PARAM}_1 = ${ratLatex(r1)},\\; ${PARAM}_2 = ${ratLatex(r2)}`],
        cards: [DET_CARD.parameter],
      }),
    )
    const M0 = at(A, ZERO)
    return {
      kind: 'detParam',
      instruction: `Für welche Werte von $${PARAM}$ ${c.ask(name)}?`,
      functionLatex: `${name} = ${pmat(A)}`,
      steps,
      cards: [DET_CARD.parameter, DET_CARD.sarrus],
      resultLatex: `${PARAM}_1 = ${ratLatex(r1)},\\; ${PARAM}_2 = ${ratLatex(r2)}`,
      form: `detParam|${A.length}|${cond}|${A.flatMap((r, i) => r.map((x, j) => (isZero(x.c1) ? '' : `${i}${j}`))).join('')}|${negCount(M0)}|${name}`,
      data: { A0: nums(at(A, ZERO)), A1: nums(at(A, ONE)), Am: nums(at(A, R(-1))), n: [A.length] },
      answer: [num(r1), num(r2)],
    }
  })
}

export const DET_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['detTwo', 'detSarrus'],
  2: ['detSarrus', 'detTriangle', 'detExpand'],
  3: ['detExpand', 'detRowOps', 'detRules'],
  4: ['detExpand', 'detEliminate', 'detRules', 'detParam'],
  5: ['detExpand', 'detParam', 'detRules', 'detRowOps'],
}

export const DET_BUILDERS: Readonly<Record<Extract<VectorKind, `det${string}`>, (rng: Rng, level: Level) => Built>> = {
  detTwo: buildDetTwo,
  detSarrus: buildDetSarrus,
  detTriangle: buildDetTriangle,
  detExpand: buildDetExpand,
  detRowOps: buildDetRowOps,
  detRules: buildDetRules,
  detEliminate: buildDetEliminate,
  detParam: buildDetParam,
}
