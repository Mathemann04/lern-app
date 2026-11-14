import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Quad, quadLatex, termsLatex } from './crossTasks.ts'
import { type CramerCtx, detStep, roots, solLatex, sortRats } from './cramerTasks.ts'
import { type Lin, type PMat, DET_CARD, at, det, lin, paramMatrix, polyOf } from './detTasks.ts'
import {
  type Aff,
  type Case,
  type Stage,
  type Tab,
  GAUSS_CARD,
  LGS_CASES,
  LGS_CASE_RULES,
  SLIP_RULE,
  analyze,
  backSolve,
  elimCands,
  equivalent,
  opLabel,
  paramNames,
  rankOf,
  runGauss,
  sameAffine,
  sameTab,
  solutionLatex,
  tabLatex,
} from './gaussTasks.ts'
import { paramSlider } from './gaussFigures.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex, vecLatex } from './vec.ts'

// Baustein „Gleichungssysteme mit Parameter“ (M7 Schritt 11b, Klausur jedes Jahr) der Tätigkeit „Matrizen und
// Gleichungssysteme“. Zwei Wege wie in der Vorlesung:
// - Gauß mit Parameter: Die Stufen sind feste Zahlen, $a$ steht in der letzten Spalte und rechts (Zeile beliebig) oder in
//   der untersten Zeile auch vorne (steht sie oben, wird sie zuerst nach unten getauscht). Beim Nullen erzeugen (auch über
//   Kreuz) bleibt alles ein Polynom in $a$, und die letzte Zeile heißt $q(a)\,z = s(a)$: Für $q(a) \ne 0$ genau eine
//   Lösung, an den Nullstellen von $q$ (Sonderwerte) keine oder unendlich viele, je nachdem, ob $s$ dort $0$ ist. Gebaut
//   vorwärts: zufällige Zeilen, dann legen zwei Zahlen der Zeile mit $a$ Sonderwerte und Fälle fest (makeSym).
// - Determinante zuerst ($a$ irgendwo in der Matrix): $\det A$ als Polynom, Sonderwerte einzeln einsetzen und mit Gauß
//   (gaussTasks.ts) auf Stufenform bringen.
// Dazu der Rang von $A$ und $(A \mid \vec b)$, ein zweiter Parameter $b$ rechts, eine Unbekannte mit vorgegebenem Wert
// (mit dem Wert, der wegfällt) und die Lösungsmenge beim Sonderwert (Folgefehler „allgemeine Formel eingesetzt“).

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)

export const LGSP_CARD = {
  gauss: 'lgsp-gauss',
  rang: 'lgsp-rang',
  rechts: 'lgsp-rechts',
} as const

type Case2 = Exclude<Case, 'unique'>
const CASE_INDEX: Readonly<Record<Case, number>> = { unique: 0, none: 1, inf: 2 }

// ------------------------------------------------------------------ Einträge: c0 + c1·a + c2·a² + cb·b

type Poly = readonly [Rational, Rational, Rational, Rational]
type PT = readonly (readonly Poly[])[]
const P = (c0: Rational = ZERO, c1: Rational = ZERO, c2: Rational = ZERO, cb: Rational = ZERO): Poly => [c0, c1, c2, cb]
const PZERO = P()
const pAdd = (p: Poly, q: Poly): Poly => [ratAdd(p[0], q[0]), ratAdd(p[1], q[1]), ratAdd(p[2], q[2]), ratAdd(p[3], q[3])]
const pScale = (k: Rational, p: Poly): Poly => [ratMul(k, p[0]), ratMul(k, p[1]), ratMul(k, p[2]), ratMul(k, p[3])]
const pSub = (p: Poly, q: Poly) => pAdd(p, pScale(R(-1), q))
const pIsZero = (p: Poly) => p.every(isZero)
const pIsConst = (p: Poly) => isZero(p[1]) && isZero(p[2]) && isZero(p[3])
const pEq = (p: Poly, q: Poly) => p.every((x, i) => ratEq(x, q[i]))
const pAt = (p: Poly, a: Rational, b: Rational = ZERO) => ratAdd(ratAdd(p[0], ratMul(p[1], a)), ratAdd(ratMul(p[2], ratMul(a, a)), ratMul(p[3], b)))
// nur a einsetzen, b bleibt
const pAtA = (p: Poly, a: Rational): Poly => P(ratAdd(ratAdd(p[0], ratMul(p[1], a)), ratMul(p[2], ratMul(a, a))), ZERO, ZERO, p[3])
const pQuad = (p: Poly): Quad => ({ q2: p[2], q1: p[1], q0: p[0] })
const quadPoly = (q: Quad): Poly => P(q.q0, q.q1, q.q2)
const fromLin = (x: Lin): Poly => P(x.c0, x.c1)
const pLatex = (p: Poly) => termsLatex([[p[2], 'a^2'], [p[1], 'a'], [p[3], 'b'], [p[0], '']])
const terms = (p: Poly) => p.filter((x) => !isZero(x)).length
// Vorzeichen des ersten Glieds, wie pLatex schreibt (a², a, b, Zahl)
const leadNeg = (p: Poly) => ratSign([p[2], p[1], p[3], p[0]].find((x) => !isZero(x)) ?? ZERO) < 0
const ptAt = (T: PT, a: Rational, b: Rational = ZERO): Tab => T.map((r) => r.map((x) => pAt(x, a, b)))
const samePT = (A: PT, B: PT) => A.length === B.length && A.every((r, i) => r.every((x, j) => pEq(x, B[i][j])))

// Bild mit Schieberegler für a (Schritt 11c): die Zeilen der Aufgabe an jeder Stelle, b fest beim gefundenen Wert
const pNum = (p: Poly, a: number, b: number) => num(p[0]) + num(p[1]) * a + num(p[2]) * a * a + num(p[3]) * b
function sliderOf(T: PT, n: number, specials: readonly Rational[], o: { start?: Rational; targets?: readonly { value: Rational; note: string }[]; b?: Rational } = {}) {
  const b = o.b ? num(o.b) : 0
  const d = paramSlider({
    rowsAt: (a) => T.map((r) => r.map((x) => pNum(x, a, b))),
    n,
    specials: specials.map(num),
    ...(o.start ? { start: num(o.start) } : {}),
    ...(o.targets ? { targets: o.targets.map((t) => ({ value: num(t.value), note: t.note })) } : {}),
    ...(o.b ? { fixed: `Mit $b = ${ratLatex(o.b)}$.` } : {}),
  })
  return d ? { resultDrawing: d } : {}
}

// Glied „Faktor mal Variable“: 2x, -y, a\,z, -2a\,z, (a - 2)\,z
function termLatex(p: Poly, v: string, first: boolean): string {
  if (pIsZero(p)) return ''
  const sign = (neg: boolean) => (first ? (neg ? '-' : '') : neg ? ' - ' : ' + ')
  if (terms(p) > 1) return leadNeg(p) ? `${sign(true)}(${pLatex(pScale(R(-1), p))})\\,${v}` : `${sign(false)}(${pLatex(p)})\\,${v}`
  const idx = p.findIndex((x) => !isZero(x))
  const c = p[idx]
  const abs = ratAbs(c)
  const mono = ['', 'a', 'a^2', 'b'][idx]
  const body = idx === 0 ? `${isOne(abs) ? '' : ratLatex(abs)}${v}` : `${isOne(abs) ? '' : ratLatex(abs)}${mono}\\,${v}`
  return `${sign(ratSign(c) < 0)}${body}`
}
function equationLatex(row: readonly Poly[], vars: readonly string[]): string {
  const n = vars.length
  let out = ''
  row.slice(0, n).forEach((x, j) => {
    out += termLatex(x, vars[j], out === '')
  })
  return `${out === '' ? '0' : out} = ${pLatex(row[n])}`
}
const ROMAN = ['I', 'II', 'III'] as const
const roman = (i: number) => `\\text{${ROMAN[i]}}`
const systemLatex = (T: PT, vars: readonly string[]) => `\\begin{array}{ll} ${T.map((r, i) => `\\text{${ROMAN[i]}:} & ${equationLatex(r, vars)}`).join(' \\\\ ')} \\end{array}`
const matrixLatex = (T: PT, n: number) =>
  `A = \\begin{pmatrix} ${T.map((r) => r.slice(0, n).map(pLatex).join(' & ')).join(' \\\\ ')} \\end{pmatrix},\\quad \\vec b = \\begin{pmatrix} ${T.map((r) => pLatex(r[n])).join(' \\\\ ')} \\end{pmatrix}`

// Tabelle mit Einträgen in a (und b), Zeilennamen links, Umformungen rechts
function ptabLatex(T: PT, vars: readonly string[], notes: readonly (string | undefined)[] = []): string {
  const n = vars.length
  const withNotes = notes.some(Boolean)
  const head = ` & ${vars.join(' & ')} & ${withNotes ? ' & ' : ''}\\\\ \\hline`
  const rows = T.map((row, i) => `${roman(i)} & ${row.map(pLatex).join(' & ')}${withNotes ? ` & ${notes[i] ? `\\quad ${notes[i]}` : ''}` : ''}`)
  return `\\begin{array}{c|${'r'.repeat(n)}|r${withNotes ? 'l' : ''}} ${head} ${rows.join(' \\\\ ')} \\end{array}`
}

// Polynom in a zerlegt: 2(a - 1)(a + 3), -(a - 2), a(a - 1)
function factoredLatex(q: Quad, rs: readonly Rational[]): string {
  const lead = isZero(q.q2) ? q.q1 : q.q2
  const fac = (r: Rational) => (isZero(r) ? 'a' : `(a ${ratSign(r) > 0 ? '-' : '+'} ${ratLatex(ratAbs(r))})`)
  const body = rs.map(fac).join('')
  const single = rs.length === 1 && !isZero(rs[0])
  if (isOne(lead)) return single ? body.slice(1, -1) : body
  if (isOne(ratNeg(lead))) return `-${body}`
  return `${ratLatex(lead)}${body}`
}

// ------------------------------------------------------------------ Gauß mit Parameter (Stufen-Zahlen ohne a)

// Produkt zweier Einträge; null, wenn es über a² hinausgeht oder a mal b ergäbe
function pMul(p: Poly, q: Poly): Poly | null {
  if ((!isZero(p[3]) && !pIsConst(q)) || (!isZero(q[3]) && !pIsConst(p))) return null
  const c3 = ratAdd(ratMul(p[1], q[2]), ratMul(p[2], q[1]))
  const c4 = ratMul(p[2], q[2])
  if (!isZero(c3) || !isZero(c4)) return null
  return P(
    ratMul(p[0], q[0]),
    ratAdd(ratMul(p[0], q[1]), ratMul(p[1], q[0])),
    ratAdd(ratAdd(ratMul(p[0], q[2]), ratMul(p[1], q[1])), ratMul(p[2], q[0])),
    ratAdd(ratMul(p[0], q[3]), ratMul(p[3], q[0])),
  )
}

// neue Zeile = p · Zeile target − q · Zeile der Stufe. p ist eine Zahl (vorne positiv); q darf a enthalten: Dann wird die
// Stufenzeile mit einem Ausdruck in a malgenommen, die umgeformte Zeile aber nur mit einer Zahl (das bleibt erlaubt)
type POp = { readonly target: number; readonly p: Rational; readonly q: Poly }
type PStage = { readonly row: number; readonly col: number; readonly ops: readonly POp[]; readonly before: PT; readonly after: PT }

const gcdN = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcdN(b, a % b))
// ganzes Vielfaches, sonst über Kreuz wie opFor in gaussTasks.ts (Einträge ganzzahlig)
function pOpFor(piv: Rational, e: Poly, target: number): POp {
  const k = e.map((x) => ratDiv(x, piv))
  if (k.every(isInteger)) return { target, p: ONE, q: P(k[0], k[1], k[2], k[3]) }
  const g = e.reduce((acc, x) => gcdN(acc, x.n), piv.n)
  const sg = piv.n < 0n ? -1n : 1n
  return { target, p: rat((sg * piv.n) / g), q: P(...(e.map((x) => rat((sg * x.n) / g)) as [Rational, Rational, Rational, Rational])) }
}
const applyOp = (o: POp, ri: readonly Poly[], rr: readonly Poly[]): Poly[] | null => {
  const out: Poly[] = []
  for (let j = 0; j < ri.length; j++) {
    const m = pMul(o.q, rr[j])
    if (!m) return null
    out.push(pSub(pScale(o.p, ri[j]), m))
  }
  return out
}

// Spalte für Spalte ohne Tausch; die Stufen müssen feste Zahlen sein (sonst null)
function runParam(T: PT, n: number): PStage[] | null {
  let M = T
  const stages: PStage[] = []
  for (let c = 0; c < n - 1; c++) {
    const piv = M[c][c]
    if (!pIsConst(piv) || isZero(piv[0])) return null
    const ops: POp[] = []
    for (let i = c + 1; i < M.length; i++) if (!pIsZero(M[i][c])) ops.push(pOpFor(piv[0], M[i][c], i))
    if (ops.length === 0) continue
    const before = M
    const after: Poly[][] = []
    for (const [i, r] of M.entries()) {
      const o = ops.find((x) => x.target === i)
      const row = o ? applyOp(o, r, before[c]) : [...r]
      if (!row) return null
      after.push(row)
    }
    stages.push({ row: c, col: c, ops, before, after })
    M = after
  }
  return stages
}
// Faktor als LaTeX: Zahl, a-Glied oder Klammer
const pFactor = (p: Poly) => {
  const s = pLatex(p)
  return s.startsWith('-') || terms(p) > 1 ? `(${s})` : s
}
function pOpLabel(o: POp, row: number): string {
  if (pIsConst(o.q)) return opLabel({ target: o.target, p: o.p, q: o.q[0] }, row)
  const left = isOne(o.p) ? roman(o.target) : `${ratLatex(o.p)} \\cdot ${roman(o.target)}`
  const neg = leadNeg(o.q)
  const q = neg ? pScale(R(-1), o.q) : o.q
  const s = pLatex(q)
  return `${left} ${neg ? '+' : '-'} ${terms(q) === 1 ? s : `(${s})`} \\cdot ${roman(row)}`
}

// zwei Stellen, an denen nichts Besonderes passiert: Dort zeigt Gauß mit Zahlen, ob zwei Tabellen gleichwertig sind
const GENERIC: readonly (readonly [Rational, Rational])[] = [
  [rat(17, 7), rat(-13, 5)],
  [rat(-23, 9), rat(19, 4)],
]
const ptEquivalent = (A: PT, B: PT) => samePT(A, B) || GENERIC.some(([a, b]) => equivalent(ptAt(A, a, b), ptAt(B, a, b)))

// falsche Tabellen zu einer Umformung (wie elimCands in gaussTasks.ts, mit Einträgen in a)
function pCands(rng: Rng, st: PStage, n: number): [PT, string][] {
  const { row, col, ops, before, after } = st
  const apply = (f: (o: POp, ri: readonly Poly[], rr: readonly Poly[]) => (Poly | null)[]): PT | null => {
    const out: Poly[][] = []
    for (const [i, r] of before.entries()) {
      const o = ops.find((x) => x.target === i)
      const res = o ? f(o, r, before[row]) : [...r]
      if (res.some((x) => !x)) return null
      out.push(res as Poly[])
    }
    return out
  }
  // ein Glied p · x − q · y mit der Zahl k statt q (für „nur das Vorzeichen von q“)
  const sg = (q: Poly) => {
    const lead = [q[2], q[1], q[0]].find((x) => !isZero(x)) ?? ONE
    return P(R(ratSign(lead)))
  }
  const term = (o: POp, x: Poly, y: Poly, q: Poly = o.q) => {
    const m = pMul(q, y)
    return m ? pSub(pScale(o.p, x), m) : null
  }
  const cands: [PT | null, string][] = [
    [apply((o, ri, rr) => ri.map((x, j) => (j === n ? x : term(o, x, rr[j])))), 'gauss-rhs'],
    [apply((o, ri, rr) => ri.map((x, j) => (j === n ? term(o, x, rr[j], sg(o.q)) : term(o, x, rr[j])))), 'gauss-rhs-multiple'],
    [apply((o, ri, rr) => ri.map((x, j) => (j === col ? PZERO : term(o, x, rr[j], sg(o.q))))), 'gauss-first-only'],
  ]
  // Vorzeichenfehler bei einem Eintrag, am liebsten in der Spalte mit a oder rechts
  const slips: [number, number][] = []
  for (const o of ops) for (let j = col + 1; j <= n; j++) if (!pIsZero(before[row][j])) slips.push([o.target, j])
  const ranked = rng.shuffle(slips).sort((p, q) => Number(q[1] >= n - 1) - Number(p[1] >= n - 1))
  for (const [t, j] of ranked.slice(0, 2)) {
    const o = ops.find((x) => x.target === t)!
    const m = pMul(o.q, before[row][j])
    if (m) cands.push([after.map((r, i) => (i === t ? r.map((x, jj) => (jj === j ? pAdd(pScale(o.p, before[t][jj]), m) : x)) : r)), 'gauss-sign'])
  }
  return cands.filter((c): c is [PT, string] => c[0] !== null)
}

type Sys = { readonly vars: readonly string[]; readonly n: number }

function pElimStep(rng: Rng, st: PStage, idx: number, sys: Sys): GuidedStep | null {
  const { n, vars } = sys
  const { row, col, ops, before, after } = st
  const notes = after.map((_, i) => {
    const o = ops.find((x) => x.target === i)
    return o ? pOpLabel(o, row) : undefined
  })
  const cands = pCands(rng, st, n)
  const wrongs: Wrong[] = []
  const seen: PT[] = [after]
  for (const [W, rule] of [cands[0], ...rng.shuffle(cands.slice(1))]) {
    if (seen.some((S) => samePT(S, W)) || ptEquivalent(W, after)) continue
    seen.push(W)
    wrongs.push({ content: math(ptabLatex(W, vars, notes)), rule })
  }
  if (wrongs.length < 3) return null
  // Beispielrechnung: am liebsten ein Eintrag mit a
  const withA = after.findIndex((r, i) => ops.some((o) => o.target === i) && r.some((x) => !pIsConst(x)))
  const example = withA >= 0 ? withA : ops[0].target
  const o = ops.find((x) => x.target === example)!
  const j = after[example].findIndex((x, jj) => jj > col && !pIsConst(x))
  const jj = j >= 0 ? j : n
  const negConst = leadNeg(o.q)
  const qShown = negConst ? pScale(R(-1), o.q) : o.q
  const qPart = pIsConst(qShown) && isOne(qShown[0]) ? '' : `${pFactor(qShown)} \\cdot `
  const first = isOne(o.p) ? pLatex(before[example][jj]) : `${ratLatex(o.p)} \\cdot ${pFactor(before[example][jj])}`
  const calc = `${first} ${negConst ? '+' : '-'} ${qPart}${pFactor(before[row][jj])} = ${pLatex(after[example][jj])}`
  const cross = ops.some((x) => !isOne(x.p))
  const withParam = ops.some((x) => !pIsConst(x.q))
  const crossNote = cross ? ' Geht es nicht mit einem ganzzahligen Vielfachen, nimmst du über Kreuz mal: Zeile mal Stufenzahl, minus Stufenzeile mal Zahl der Zeile.' : ''
  const paramNote = withParam ? ' Steht in der Spalte schon $a$, nimmst du die Stufenzeile mit diesem Ausdruck mal und ziehst sie ab. Das ist erlaubt: Die umgeformte Zeile wird nur mit einer festen Zahl malgenommen, nie mit etwas, das $0$ werden kann.' : ''
  return choiceStep(rng, {
    id: `spalte-${idx}`,
    title: `Spalte ${col + 1}: Nullen erzeugen`,
    question: `Erzeuge in Spalte ${col + 1} unter der $${ratLatex(before[row][col][0])}$ in Zeile ${ROMAN[row]} Nullen. Wie sieht die Tabelle danach aus?\n$${ptabLatex(before, vars)}$`,
    correct: math(ptabLatex(after, vars, notes)),
    wrongs,
    hint: `Zieh von jeder Zeile darunter so ein Vielfaches von Zeile ${ROMAN[row]} ab, dass in Spalte ${col + 1} eine $0$ entsteht${cross ? ' (wenn nötig über Kreuz)' : ''}. Rechne jede Zahl mit, auch die Einträge mit $a$ und die rechte Seite.`,
    explanation: {
      detailed: `Umformungen: ${ops.map((x) => `$${pOpLabel(x, row)}$`).join(', ')}.${crossNote} Die Stufenzahl $${ratLatex(before[row][col][0])}$ hängt nicht von $a$ ab, darum geht das wie ohne Parameter.${paramNote} Ein Eintrag mit $a$ wird genauso umgerechnet, zum Beispiel in Zeile ${ROMAN[example]}, Spalte ${jj < n ? `von $${vars[jj]}$` : 'rechts'}: $${calc}$.`,
      short: `${ops.map((x) => `$${pOpLabel(x, row)}$`).join(', ')}, jede Zahl mitrechnen.`,
    },
    cards: [LGSP_CARD.gauss, GAUSS_CARD.tabelle],
  })
}

// Zeile mit a in der ersten Spalte steht oben: zuerst nach unten tauschen
function paramSwapStep(rng: Rng, T: PT, other: number, vars: readonly string[]): GuidedStep {
  const e = pLatex(T[0][0])
  const ef = pFactor(T[0][0])
  return choiceStep(rng, {
    id: 'tausch',
    title: 'Zeile mit $a$',
    question: `In Zeile I steht in der ersten Spalte $${e}$, ein Ausdruck mit $a$. Wie fängst du am besten an?\n$${ptabLatex(T, vars)}$`,
    correct: `Zeilen I und ${ROMAN[other]} tauschen, damit die Zeile mit $a$ unten steht`,
    wrongs: [
      { content: `Zeile I durch $${e}$ teilen, damit vorne eine $1$ steht`, rule: 'lgsp-divide-param' },
      { content: `Die Zeilen darunter mit $${ef}$ malnehmen und dann Vielfache von Zeile I abziehen`, rule: 'lgsp-multiply-param' },
      { content: 'Für $a$ eine Zahl einsetzen, zum Beispiel $a = 1$, und dann rechnen', rule: 'lgsp-fix-param' },
    ],
    hint: 'Die Zahlen, unter denen du Nullen erzeugst, sollten nicht von $a$ abhängen. Die Reihenfolge der Gleichungen darfst du ändern.',
    explanation: {
      detailed: `Mit $${e}$ als Stufe müsstest du durch einen Ausdruck mit $a$ teilen oder andere Zeilen damit malnehmen. Beides geht schief, wenn er für ein $a$ gleich $0$ wird. Die Reihenfolge der Gleichungen spielt keine Rolle: Tausch Zeile I mit Zeile ${ROMAN[other]}. Dann sind die Stufen feste Zahlen, und $a$ wird nur mitgerechnet.`,
      short: `Zeilen I und ${ROMAN[other]} tauschen: Stufen ohne $a$.`,
    },
    established: [`\\text{I} \\leftrightarrow \\text{${ROMAN[other]}}`],
    cards: [LGSP_CARD.gauss, GAUSS_CARD.tricks],
  })
}

// ------------------------------------------------------------------ Schritte zu den Sonderwerten

const neLatex = (xs: readonly Rational[]) => math(xs.map((r) => `a \\ne ${ratLatex(r)}`).join(',\\; '))
const eqLatex = (xs: readonly Rational[]) => math(solLatex(sortRats(xs)))
const sameSet = (xs: readonly Rational[], ys: readonly Rational[]) => xs.length === ys.length && xs.every((x) => ys.some((y) => ratEq(x, y)))

// Wann genau eine Lösung? src: aus der letzten Zeile der Stufenform (q, s) oder aus der Determinante
type CondSource = { readonly kind: 'row'; readonly q: Quad; readonly rhs: Poly; readonly v: string; readonly table: string; readonly withB: boolean } | { readonly kind: 'det'; readonly D: Quad }
function conditionStep(rng: Rng, src: CondSource, rs: readonly Rational[]): GuidedStep {
  const wrongs: Wrong[] = [
    { content: eqLatex(rs), rule: 'lgsp-cond-flip' },
    { content: 'für alle $a$', rule: 'lgsp-cond-all' },
  ]
  const flipped = sortRats(rs.map(ratNeg))
  const extra: Wrong[] = []
  if (!sameSet(flipped, rs)) extra.push({ content: neLatex(flipped), rule: 'det-root-sign' })
  if (rs.length === 2) for (const r of rng.shuffle([...rs])) extra.push({ content: neLatex([r]), rule: 'lgsp-one-root' })
  if (src.kind === 'row' && !src.withB) {
    const us = roots(pQuad(src.rhs))
    if (us && us.length > 0 && !sameSet(us, rs) && !sameSet(sortRats(us), flipped)) extra.unshift({ content: neLatex(sortRats(us)), rule: 'lgsp-cond-rhs' })
  }
  wrongs.push(...rng.shuffle(extra))
  const poly = src.kind === 'row' ? src.q : src.D
  const zero = rs.map((r) => `$a = ${ratLatex(r)}$`).join(' und ')
  const fact = rs.length > 0 && !(isOne(ratAbs(isZero(poly.q2) ? poly.q1 : poly.q2)) && rs.length === 1) ? ` = ${factoredLatex(poly, rs)}` : ''
  const forB = src.kind === 'row' && src.withB ? ', und zwar für jedes $b$' : ''
  return choiceStep(rng, {
    id: 'bedingung',
    title: 'Genau eine Lösung?',
    question:
      src.kind === 'row'
        ? `Die Stufenform ist fertig. Für welche $a$ hat das System genau eine Lösung${src.withB ? ' (egal, welches $b$)' : ''}?\n$${src.table}$`
        : `Es ist $\\det A = ${quadLatex(src.D, 'a')}$. Für welche $a$ hat das System genau eine Lösung?`,
    correct: neLatex(rs),
    wrongs,
    hint:
      src.kind === 'row'
        ? `Sieh dir die letzte Zeile an: $${src.v}$ hat eine Stufe, solange die Zahl davor nicht $0$ ist.`
        : 'Genau eine Lösung gibt es genau dann, wenn $\\det A \\ne 0$ ist.',
    explanation: {
      detailed:
        src.kind === 'row'
          ? `Die letzte Zeile heißt $${termLatex(quadPoly(src.q), src.v, true)} = ${pLatex(src.rhs)}$. Ist $${quadLatex(src.q, 'a')} \\ne 0$, hat jede Unbekannte eine Stufe: genau eine Lösung${forB}. Es ist $${quadLatex(src.q, 'a')}${fact} = 0$ genau für ${zero}. Das sind die Sonderwerte: Dort fällt die letzte Stufe weg, und es gibt keine oder unendlich viele Lösungen.`
          : `Genau eine Lösung gibt es genau dann, wenn $\\det A \\ne 0$ ist. Es ist $${quadLatex(src.D, 'a')}${fact} = 0$ genau für ${zero}. Für diese Sonderwerte gibt es keine oder unendlich viele Lösungen; welches, zeigt erst Gauß.`,
      short: `$${quadLatex(poly, 'a')}${fact} = 0$ für ${zero}; sonst genau eine Lösung.`,
    },
    established: [rs.map((r) => `a \\ne ${ratLatex(r)}`).join(',\\; ')],
    cards: src.kind === 'row' ? [LGSP_CARD.gauss] : [LGSP_CARD.gauss, DET_CARD.parameter],
  })
}

// Für welche a keine bzw. unendlich viele Lösungen? (die Sonderwerte mit ihrem Fall)
type Special = { readonly r: Rational; readonly kase: Case2; readonly why: string }
function specialStep(rng: Rng, specials: readonly Special[], ask: Case2, question: string, rhsRoots: readonly Rational[] = []): GuidedStep {
  const right = specials.filter((x) => x.kase === ask).map((x) => x.r)
  const others = specials.filter((x) => x.kase !== ask)
  const wrongs: Wrong[] = []
  const add = (xs: readonly Rational[], rule: string) => {
    if (xs.length > 0 && xs.length <= 2 && !sameSet(xs, right)) wrongs.push({ content: eqLatex(xs), rule })
  }
  for (const o of others) {
    const rule = LGS_CASE_RULES[CASE_INDEX[o.kase]][CASE_INDEX[ask]]
    add([o.r], rule)
    if (right.length === 1) add([...right, o.r], rule)
  }
  if (right.length === 2) for (const r of rng.shuffle([...right])) add([r], 'lgsp-one-root')
  const flipped = right.map(ratNeg)
  if (!flipped.some((f) => specials.some((x) => ratEq(x.r, f)))) add(flipped, 'det-root-sign')
  const fromRhs = rhsRoots.filter((u) => !specials.some((x) => ratEq(x.r, u)))
  if (fromRhs.length > 0) add([fromRhs[0]], 'lgsp-cond-rhs')
  // „genau eine Lösung“ mit dem Sonderfall verwechselt: alle a außer den Sonderwerten
  wrongs.push({ content: neLatex(specials.map((x) => x.r)), rule: 'lgsp-special-swapped' })
  const ordered = rng.shuffle(wrongs).sort((p, q) => Number(q.rule.startsWith('gauss')) - Number(p.rule.startsWith('gauss')))
  ordered.splice(Math.min(ordered.length, rng.int(1, 2)), 0, { content: `für kein $a$`, rule: 'lgsp-special-missed' })
  return choiceStep(rng, {
    id: 'sonderfall',
    title: 'Sonderwerte',
    question,
    correct: eqLatex(right),
    wrongs: ordered,
    hint: 'Setz jeden Sonderwert einzeln ein. Heißt die letzte Zeile dann $0 = c$ mit $c \\ne 0$, gibt es keine Lösung; heißt sie $0 = 0$, unendlich viele.',
    explanation: {
      detailed: `${specials.map((x) => x.why).join(' ')} Also ${ask === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'} für $${solLatex(right)}$.`,
      short: specials.map((x) => `$a = ${ratLatex(x.r)}$: ${LGS_CASES[CASE_INDEX[x.kase]]}`).join(', ') + '.',
    },
    established: [solLatex(right)],
    cards: [LGSP_CARD.gauss, GAUSS_CARD.faelle],
  })
}

// Nur ein Sonderwert: Was gilt dort? (Fall mit Begründung aus der letzten Zeile; c = Zahl rechts beim Sonderwert)
function singleCaseStep(rng: Rng, r: Rational, kase: Case2, rowText: string, c: Rational, v: string, question: string, why: string): GuidedStep {
  const general: Wrong = { content: 'genau eine Lösung, wie für alle anderen $a$', rule: 'lgsp-general-formula' }
  const wrongs: Wrong[] =
    kase === 'none'
      ? [
          { content: 'unendlich viele Lösungen, denn links steht nur noch $0$', rule: 'gauss-contradiction-zero' },
          { content: `genau eine Lösung, nämlich $${v} = ${ratLatex(c)}$`, rule: 'gauss-contradiction-value' },
          general,
        ]
      : [
          { content: 'keine Lösung, denn links steht nur noch $0$', rule: 'gauss-zero-row-none' },
          { content: `genau eine Lösung, nämlich $${v} = 0$`, rule: 'gauss-free-missed' },
          general,
        ]
  return choiceStep(rng, {
    id: 'sonderfall',
    title: 'Sonderwert',
    question,
    correct: `${LGS_CASES[CASE_INDEX[kase]]}, denn die letzte Zeile heißt $${rowText}$`,
    wrongs,
    hint: 'Setz den Sonderwert ein. Heißt die letzte Zeile dann $0 = c$ mit $c \\ne 0$, gibt es keine Lösung; heißt sie $0 = 0$, unendlich viele.',
    explanation: {
      detailed: `${why} Für alle anderen $a$ gibt es genau eine Lösung.`,
      short: `$a = ${ratLatex(r)}$: ${LGS_CASES[CASE_INDEX[kase]]}.`,
    },
    established: [`\\text{${LGS_CASES[CASE_INDEX[kase]]}}`],
    cards: [LGSP_CARD.gauss, GAUSS_CARD.faelle],
  })
}
const singleResult = (r: Rational, kase: Case2) => `a = ${ratLatex(r)},\\; \\text{${LGS_CASES[CASE_INDEX[kase]]}}`

// Ränge und was daraus folgt (beim Sonderwert: Rang von A ist n − 1)
const rankText = (ra: number, rb: number, c: Case) => `$\\operatorname{rg}(A) = ${ra}$, $\\operatorname{rg}(A \\mid \\vec b) = ${rb}$: ${LGS_CASES[CASE_INDEX[c]]}`
function rankStep(rng: Rng, question: string, kase: Case2, n: number): GuidedStep {
  const k = n - 1
  const wrongs: Wrong[] =
    kase === 'none'
      ? [
          { content: rankText(n, n, 'unique'), rule: 'lgsp-rank-augmented' },
          { content: rankText(k, k, 'inf'), rule: 'lgsp-rank-rhs' },
          { content: rankText(k, n, 'inf'), rule: 'lgsp-rank-unequal' },
        ]
      : [
          { content: rankText(k, k, 'unique'), rule: 'lgsp-rank-full' },
          { content: rankText(k, n, 'none'), rule: 'lgsp-rank-zero-row' },
          { content: rankText(n, n, 'unique'), rule: 'lgsp-rank-rows' },
        ]
  const rb = kase === 'none' ? n : k
  return choiceStep(rng, {
    id: 'rang',
    title: 'Rang',
    question,
    correct: rankText(k, rb, kase),
    wrongs,
    hint: 'Der Rang ist die Zahl der Zeilen der Stufenform, die nicht nur aus Nullen bestehen. Für $A$ zählt nur links vom Strich, für $(A \\mid \\vec b)$ auch rechts.',
    explanation: {
      detailed: `Links vom Strich bleiben ${k} Stufen: $\\operatorname{rg}(A) = ${k}$. ${kase === 'none' ? `Die letzte Zeile ist links eine Nullzeile, rechts aber nicht: Für $(A \\mid \\vec b)$ zählt sie mit, $\\operatorname{rg}(A \\mid \\vec b) = ${n}$. Die Ränge sind verschieden, also ist das System nicht lösbar: keine Lösung.` : `Die letzte Zeile ist auch rechts $0$, sie zählt bei keinem Rang: $\\operatorname{rg}(A \\mid \\vec b) = ${k}$. Die Ränge sind gleich, also lösbar; aber $${k} < ${n}$ Unbekannte, darum ist ${n - k === 1 ? 'eine' : `${n - k}`} frei wählbar: unendlich viele Lösungen.`}`,
      short: kase === 'none' ? `$\\operatorname{rg}(A) = ${k} < \\operatorname{rg}(A \\mid \\vec b) = ${n}$: keine Lösung.` : `$\\operatorname{rg}(A) = \\operatorname{rg}(A \\mid \\vec b) = ${k} < ${n}$: unendlich viele Lösungen.`,
    },
    cards: [LGSP_CARD.rang],
  })
}

// ------------------------------------------------------------------ Bau vorwärts mit Ziel

// Wo steht a? last: in der letzten Spalte und rechts (Zeile beliebig); first/mid: in der ersten bzw. zweiten Spalte der
// untersten Zeile (sonst teilte Gauß durch a); square: zusätzlich a² in der letzten Spalte; upper: eine andere Zeile hat
// a in der letzten Spalte (mit first/mid entsteht so a² beim Nullen erzeugen); swapTop: die Zeile mit a steht oben und wird
// zuerst nach unten getauscht (nur bei first)
type Place = 'last' | 'first' | 'mid'
type SymSpec = {
  readonly n: 2 | 3
  readonly cases: readonly Case2[]
  readonly withB: boolean
  readonly place: Place
  readonly square: boolean
  readonly upper: boolean
  readonly swapTop: boolean
  readonly level: Level
}
type SymSystem = {
  // Angabe (bei swapTop mit der Zeile mit a oben) und die Tabelle, mit der Gauß rechnet
  readonly T: PT
  readonly work: PT
  readonly swapWith: number
  readonly F: PT
  readonly stages: readonly PStage[]
  readonly rs: readonly Rational[]
  readonly cases: readonly Case2[]
  readonly q: Quad
  readonly s: Quad
  readonly beta: Rational
  readonly spec: SymSpec
}

const nonzero = (rng: Rng, lo: number, hi: number) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}
const quadAtR = (q: Quad, a: Rational) => pAt(quadPoly(q), a)
const constQ = (c: Rational): Quad => ({ q2: ZERO, q1: ZERO, q0: c })
// Stufenzahl oben links: meist 2 oder 3, selten 1 (Wunsch des Nutzers, 14.11.2026: nicht fast immer Einsen)
const PIVOTS = [2, 3, -2, -3, 2, 3, -2, -3, 4, -4, 1, -1]
const smallInt = (x: Rational, lim: number) => isInteger(x) && Math.abs(num(x)) <= lim

// Zufällige Zeilen; die Zahl t0 in der letzten Spalte der Zeile mit a legt einen Sonderwert fest, die rechte Seite
// v0 + v1·a (+ β b) der Zeile mit a die Fälle. Was die übrigen Zeilen beitragen, rechnet Gauß selbst (zweimal: mit 0 und 1)
function makeSym(rng: Rng, spec: SymSpec): SymSystem | null {
  const { n, cases } = spec
  const count = cases.length
  const lim = spec.level <= 2 ? 9 : 12
  const ia = spec.place === 'last' ? rng.int(0, n - 1) : n - 1
  const base: Poly[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => {
      if (j === n) return P(R(rng.int(-9, 9)))
      if (j === 0) return P(R(i === 0 ? rng.pick(PIVOTS) : nonzero(rng, -6, 6)))
      return P(R(rng.int(-5, 6)))
    }),
  )
  if (spec.place === 'first') base[ia][0] = P(R(rng.pick([0, 0, 1, -1, 2, -2, 3])), R(rng.pick([1, -1])))
  if (spec.place === 'mid') base[ia][1] = P(R(rng.int(-4, 4)), R(rng.pick([1, -1])))
  if (spec.upper) {
    const iu = rng.pick(Array.from({ length: n }, (_, i) => i).filter((i) => i !== ia))
    base[iu][n - 1] = P(base[iu][n - 1][0], R(rng.pick([1, -1])))
  }
  const a1 = spec.place === 'last' ? R(spec.square ? rng.pick([0, 0, 1, -1]) : rng.pick([1, -1, 2, -2, 1, -1])) : ZERO
  const a2 = spec.square ? R(rng.pick([1, -1])) : ZERO
  const build = (t0: Rational, rhs: Poly): PT => base.map((r, i) => (i !== ia ? r : r.map((x, j) => (j === n - 1 ? P(t0, a1, a2) : j === n ? rhs : x))))
  const lastRow = (W: PT) => {
    const st = runParam(W, n)
    return st && st.length === n - 1 ? st[st.length - 1].after[n - 1] : null
  }
  const L0 = lastRow(build(ZERO, PZERO))
  const L1 = lastRow(build(ONE, P(ONE)))
  if (!L0 || !L1 || !L0.slice(0, n - 1).every(pIsZero)) return null
  const kappa = pSub(L1[n - 1], L0[n - 1])
  if (!pIsConst(kappa) || isZero(kappa[0]) || !pEq(pSub(L1[n], L0[n]), kappa)) return null
  const k = kappa[0]
  const qRest = pQuad(L0[n - 1])
  if ((isZero(qRest.q2) ? (isZero(qRest.q1) ? 0 : 1) : 2) !== count) return null
  // ein Sonderwert über t0, bei a² der zweite aus der Gleichung
  let t0: Rational | null = null
  let rs: Rational[] | null = null
  for (const r of rng.shuffle([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])) {
    const t = ratDiv(ratNeg(quadAtR(qRest, R(r))), k)
    if (!smallInt(t, lim)) continue
    const found = roots({ ...qRest, q0: ratAdd(qRest.q0, ratMul(k, t)) })
    if (!found || found.length !== count || found.some((x) => !isInteger(x) || isZero(x) || Math.abs(num(x)) > 6)) continue
    if (count === 2 && ratEq(ratAbs(found[0]), ratAbs(found[1]))) continue
    t0 = t
    rs = found
    break
  }
  if (!t0 || !rs) return null
  // rechte Seite der Zeile mit a: rechts in der letzten Zeile steht sR(a) + κ · (v0 + v1 a + β b)
  const sR = pQuad(L0[n])
  let w1 = R(rng.pick([0, 0, 1, -1]))
  let v0: Rational
  let beta = ZERO
  const infs = rs.filter((_, i) => cases[i] === 'inf')
  if (spec.withB) {
    beta = R(rng.pick([1, -1, 1, -1, 2, -2]))
    const r = rs[0]
    const bStar = R(nonzero(rng, -6, 6))
    if (ratEq(bStar, r)) return null
    v0 = ratSub(ratSub(ratDiv(ratNeg(quadAtR(sR, r)), k), ratMul(w1, r)), ratMul(beta, bStar))
  } else if (infs.length === 2) {
    const [r1, r2] = infs
    w1 = ratDiv(ratNeg(ratSub(quadAtR(sR, r1), quadAtR(sR, r2))), ratMul(k, ratSub(r1, r2)))
    if (!smallInt(w1, 3)) return null
    v0 = ratSub(ratDiv(ratNeg(quadAtR(sR, r1)), k), ratMul(w1, r1))
  } else if (infs.length === 1) v0 = ratSub(ratDiv(ratNeg(quadAtR(sR, infs[0])), k), ratMul(w1, infs[0]))
  else v0 = R(rng.int(-9, 9))
  if (!smallInt(v0, 30)) return null
  const work = build(t0, P(v0, w1, ZERO, beta))
  const stages = runParam(work, n)
  if (!stages || stages.length !== n - 1) return null
  const F = stages[stages.length - 1].after
  const last = F[n - 1]
  const q = pQuad(last[n - 1])
  const s: Quad = { q2: last[n][2], q1: last[n][1], q0: last[n][0] }
  const found = roots(q)
  if (!found || !sameSet(found, rs)) return null
  if (!spec.withB && rs.some((r, i) => isZero(quadAtR(s, r)) !== (cases[i] === 'inf'))) return null
  // kleine Zahlen in der Angabe und unterwegs, genug Minus, keine zwei gleichen Zeilen
  if (work.some((r) => r.slice(0, n).some((x) => Math.abs(num(x[0])) > lim) || Math.abs(num(r[n][0])) > 30)) return null
  if (work.flat().some((x) => [x[1], x[2], x[3]].some((y) => Math.abs(num(y)) > 9))) return null
  if (stages.some((st) => st.after.some((r) => r.some((x) => x.some((y) => Math.abs(num(y)) > 60))))) return null
  if (work.flat().filter((x) => ratSign(x[0]) < 0).length < 2) return null
  if (work.some((r, i) => work.some((o, j) => j > i && r.every((x, c) => pEq(x, o[c]))))) return null
  const T = spec.swapTop ? work.map((r, i) => (i === 0 ? work[n - 1] : i === n - 1 ? work[0] : r)) : work
  return { T, work, swapWith: spec.swapTop ? n - 1 : -1, F, stages, rs, cases, q, s, beta: last[n][3], spec }
}

// Lage von a je Stufe und Zahl der Sonderwerte
function placeSpec(rng: Rng, level: Level, n: 2 | 3, count: number): Pick<SymSpec, 'place' | 'square' | 'upper' | 'swapTop'> {
  if (count === 2) {
    const kind = rng.pick(n === 3 ? (['square', 'first', 'mid'] as const) : (['square', 'first'] as const))
    if (kind === 'square') return { place: 'last', square: true, upper: false, swapTop: false }
    return { place: kind, square: false, upper: true, swapTop: kind === 'first' && level >= 3 && rng.chance(0.3) }
  }
  const place = rng.pick(n === 3 ? (['last', 'last', 'first', 'mid'] as const) : (['last', 'last', 'first'] as const))
  return { place, square: false, upper: place === 'last' && level >= 3 && rng.chance(0.4), swapTop: place === 'first' && level >= 2 && rng.chance(0.5) }
}

// ------------------------------------------------------------------ Aufgaben

const VARS: Readonly<Record<2 | 3, readonly (readonly string[])[]>> = {
  2: [['x', 'y']],
  3: [['x', 'y', 'z'], ['x', 'y', 'z'], ['x_1', 'x_2', 'x_3']],
}

function shown(rng: Rng, T: PT, vars: readonly string[]) {
  const eq = rng.chance(0.6)
  return { eq, functionLatex: eq ? systemLatex(T, vars) : matrixLatex(T, vars.length), what: eq ? 'Das Gleichungssystem' : 'Das System $A\\vec x = \\vec b$' }
}
const signs = (T: PT) => T.map((r) => r.map((x) => '0+-'[(ratSign(x[0]) + 3) % 3]).join('')).join(',')
const paramMask = (T: PT) => T.map((r) => r.map((x) => (pIsConst(x) ? '' : x[3] && !isZero(x[3]) ? 'b' : isZero(x[2]) ? 'a' : 'q')).join('.')).join(',')
const dataOf = (T: PT) => ({
  T0: T.flat().map((x) => num(x[0])),
  T1: T.flat().map((x) => num(x[1])),
  T2: T.flat().map((x) => num(x[2])),
  TB: T.flat().map((x) => num(x[3])),
  n: [T.length],
})

// Erklärung je Sonderwert aus der letzten Zeile
function rowWhy(sys: SymSystem, r: Rational, kase: Case2, v: string): string {
  const rhs = quadAtR(sys.s, r)
  return `Für $a = ${ratLatex(r)}$ wird die letzte Zeile zu $0 \\cdot ${v} = ${ratLatex(rhs)}$: ${kase === 'none' ? 'ein Widerspruch, keine Lösung.' : `eine Nullzeile, $${v}$ ist frei wählbar, unendlich viele Lösungen.`}`
}

function symSteps(rng: Rng, sys: SymSystem, s: Sys): GuidedStep[] | null {
  const steps: GuidedStep[] = sys.swapWith >= 0 ? [paramSwapStep(rng, sys.T, sys.swapWith, s.vars)] : []
  let idx = 0
  for (const st of sys.stages) {
    idx++
    const step = pElimStep(rng, st, idx, s)
    if (!step) return null
    steps.push(step)
  }
  return steps
}

// Stufe 1 und 2 (2 × 2), 2 und 3 (3 × 3): Gauß mit Parameter. Ein Sonderwert: Was gilt dort? Zwei: für welche a keine
// bzw. unendlich viele Lösungen?
function buildSym(rng: Rng, level: Level, kind: 'lgspTwo' | 'lgspThree', cases: readonly Case2[]): Built | null {
  const n = kind === 'lgspTwo' ? 2 : 3
  const sys = makeSym(rng, { n, cases, withB: false, ...placeSpec(rng, level, n, cases.length), level })
  if (!sys) return null
  const vars = rng.pick(VARS[n])
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const v = vars[n - 1]
  const table = ptabLatex(sys.F, vars)
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table, withB: false }, sys.rs))
  if (level >= 3) {
    const i = rng.int(0, sys.rs.length - 1)
    const r = sys.rs[i]
    steps.push(rankStep(rng, `Setz $a = ${ratLatex(r)}$ in die Stufenform ein. Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(ptAt(sys.F, r), vars)}$`, sys.cases[i], n))
  }
  const disp = shown(rng, sys.T, vars)
  const form = `${kind}|${disp.eq ? 'eq' : 'mat'}|${sys.cases.join('')}|${sys.spec.place}${sys.spec.square ? 'q' : ''}${sys.spec.upper ? 'u' : ''}${sys.swapWith >= 0 ? 's' : ''}|${vars[0]}|${signs(sys.T)}|${paramMask(sys.T)}|${sys.rs.map((r) => ratSign(r)).join('')}`
  if (sys.rs.length === 1) {
    const [r] = sys.rs
    const [kase] = sys.cases
    const c = quadAtR(sys.s, r)
    steps.push(singleCaseStep(rng, r, kase, `0 \\cdot ${v} = ${ratLatex(c)}`, c, v, `Was gilt für den Sonderwert $a = ${ratLatex(r)}$?\n$${table}$`, rowWhy(sys, r, kase, v)))
    return {
      kind,
      instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welches $a$ hat es nicht genau eine Lösung, und was gilt dort? Rechne mit dem Gauß-Verfahren.`,
      functionLatex: disp.functionLatex,
      steps,
      cards: [LGSP_CARD.gauss, ...(level >= 3 ? [LGSP_CARD.rang] : [])],
      resultLatex: singleResult(r, kase),
      ...sliderOf(sys.T, n, sys.rs),
      form,
      data: { ...dataOf(sys.T), single: [1] },
      answer: [num(r), CASE_INDEX[kase]],
    }
  }
  const specials: Special[] = sys.rs.map((r, i) => ({ r, kase: sys.cases[i], why: rowWhy(sys, r, sys.cases[i], v) }))
  const ask = rng.pick(sys.cases)
  const askText = ask === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'
  steps.push(specialStep(rng, specials, ask, `Für welche $a$ hat das System ${askText}?\n$${table}$`, roots(sys.s) ?? []))
  const right = sys.rs.filter((_, i) => sys.cases[i] === ask)
  return {
    kind,
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welche $a$ hat es ${askText}? Rechne mit dem Gauß-Verfahren.`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, ...(level >= 3 ? [LGSP_CARD.rang] : [])],
    resultLatex: solLatex(sortRats(right)),
    ...sliderOf(sys.T, n, sys.rs, { start: right[0] }),
    form: `${form}|${ask}`,
    data: { ...dataOf(sys.T), ask: [CASE_INDEX[ask]] },
    answer: sortRats(right).map(num),
  }
}

// Stufe 4 und 5: Parameter b rechts. Für welche a und b unendlich viele Lösungen?
function buildRhs(rng: Rng, level: Level): Built | null {
  const n = level >= 5 || rng.chance(0.5) ? 3 : 2
  const sys = makeSym(rng, { n, cases: ['none'], withB: true, ...placeSpec(rng, level, n, 1), level })
  if (!sys || isZero(sys.beta)) return null
  const r = sys.rs[0]
  const sr = quadAtR(sys.s, r)
  const bStar = ratDiv(ratNeg(sr), sys.beta)
  if (!isInteger(bStar) || isZero(bStar) || ratEq(bStar, r) || Math.abs(num(bStar)) > 12) return null
  const vars = rng.pick(VARS[n])
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const v = vars[n - 1]
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table: ptabLatex(sys.F, vars), withB: true }, sys.rs))
  // b beim Sonderwert
  const atR = sys.F.map((row) => row.map((x) => pAtA(x, r)))
  const rhsR = atR[n - 1][n]
  const bWrongs: Wrong[] = []
  const add = (x: Rational, rule: string) => {
    if (!ratEq(x, bStar) && !bWrongs.some((w) => w.content === math(`b = ${ratLatex(x)}`))) bWrongs.push({ content: math(`b = ${ratLatex(x)}`), rule })
  }
  add(ratNeg(bStar), 'lgsp-b-sign')
  if (!isOne(ratAbs(sys.beta))) add(ratNeg(sr), 'lgsp-b-divide')
  bWrongs.push({ content: 'für jedes $b$', rule: 'lgsp-b-ignored' }, { content: 'für kein $b$', rule: 'lgsp-b-none' })
  steps.push(
    choiceStep(rng, {
      id: 'b-wert',
      title: 'Parameter rechts',
      question: `Setz den Sonderwert $a = ${ratLatex(r)}$ ein. Für welches $b$ hat das System dann unendlich viele Lösungen?\n$${ptabLatex(atR, vars)}$`,
      correct: math(`b = ${ratLatex(bStar)}`),
      wrongs: [bWrongs[0], ...rng.shuffle(bWrongs.slice(1))],
      hint: 'Links steht in der letzten Zeile nur noch $0$. Unendlich viele Lösungen gibt es, wenn auch rechts $0$ steht.',
      explanation: {
        detailed: `Für $a = ${ratLatex(r)}$ heißt die letzte Zeile $0 = ${pLatex(rhsR)}$. Sie ist $0 = 0$ genau für $${pLatex(rhsR)} = 0$, also $b = ${ratLatex(bStar)}$: Dann fällt sie weg, $${v}$ ist frei wählbar, und es gibt unendlich viele Lösungen. Für jedes andere $b$ ist sie ein Widerspruch: keine Lösung.`,
        short: `$${pLatex(rhsR)} = 0$ für $b = ${ratLatex(bStar)}$.`,
      },
      established: [`b = ${ratLatex(bStar)}`],
      cards: [LGSP_CARD.rechts],
    }),
  )
  if (level >= 5) {
    const other = ratAdd(bStar, R(rng.pick([1, 2, -1, 3])))
    steps.push(rankStep(rng, `Für $a = ${ratLatex(r)}$ und $b \\ne ${ratLatex(bStar)}$, zum Beispiel $b = ${ratLatex(other)}$: Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(ptAt(sys.F, r, other), vars)}$`, 'none', n))
  }
  const disp = shown(rng, sys.T, vars)
  return {
    kind: 'lgspRhs',
    instruction: `${disp.what} hängt von den Parametern $a$ und $b$ ab. Für welche $a$ und $b$ hat es unendlich viele Lösungen?`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, LGSP_CARD.rechts],
    resultLatex: `a = ${ratLatex(r)},\\; b = ${ratLatex(bStar)}`,
    ...sliderOf(sys.T, n, sys.rs, { b: bStar }),
    form: `lgspRhs|${n}|${disp.eq ? 'eq' : 'mat'}|${sys.spec.place}${sys.spec.upper ? 'u' : ''}${sys.swapWith >= 0 ? 's' : ''}|${vars[0]}|${signs(sys.T)}|${paramMask(sys.T)}|${ratSign(r)}${ratSign(bStar)}|${num(sys.beta)}`,
    data: dataOf(sys.T),
    answer: [num(r), num(bStar)],
  }
}

// Stufe 4 und 5: Unbekannte mit vorgegebenem Wert (Stufe 5 oft mit einem Wert, der wegfällt)
function buildTarget(rng: Rng, level: Level, trap: boolean): Built | null {
  const n = level >= 5 || rng.chance(0.6) ? 3 : 2
  const cases: Case2[] = trap ? rng.shuffle(['inf', 'none']) : level >= 5 && rng.chance(0.5) ? ['none', 'none'] : ['none']
  const sys = makeSym(rng, { n, cases, withB: false, ...placeSpec(rng, level, n, cases.length), level })
  if (!sys) return null
  const vars = rng.pick(VARS[n])
  const v = vars[n - 1]
  // Wert c so, dass s(a) = c · q(a) kleine ganze Lösungen hat
  let pick: { c: Rational; valid: Rational[]; excluded: Rational[]; E: Quad } | null = null
  for (const cc of rng.shuffle([-3, -2, -1, 1, 2, 3, 0])) {
    const c = R(cc)
    const E: Quad = { q2: ratSub(sys.s.q2, ratMul(c, sys.q.q2)), q1: ratSub(sys.s.q1, ratMul(c, sys.q.q1)), q0: ratSub(sys.s.q0, ratMul(c, sys.q.q0)) }
    if (isZero(E.q2) && isZero(E.q1)) continue
    const rr = roots(E)
    if (!rr || !rr.every((x) => isInteger(x) && Math.abs(num(x)) <= 9)) continue
    const excluded = rr.filter((x) => sys.rs.some((y) => ratEq(x, y)))
    const valid = rr.filter((x) => !excluded.some((y) => ratEq(x, y)))
    if (valid.length === 0 || (excluded.length > 0) !== trap) continue
    pick = { c, valid, excluded, E }
    break
  }
  if (!pick) return null
  const { c, valid, excluded, E } = pick
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const table = ptabLatex(sys.F, vars)
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table, withB: false }, sys.rs))
  const wrongs: Wrong[] = []
  const add = (xs: Rational[] | null, rule: string) => {
    if (xs && xs.length > 0 && xs.length <= 2 && !sameSet(xs, valid)) wrongs.push({ content: eqLatex(xs), rule })
  }
  if (excluded.length > 0) add([...valid, ...excluded], 'lgsp-excluded')
  if (valid.length === 2) for (const x of rng.shuffle([...valid])) add([x], 'lgsp-one-root')
  const sub = (p: Quad, k: Rational, q: Quad): Quad => ({ q2: ratSub(p.q2, ratMul(k, q.q2)), q1: ratSub(p.q1, ratMul(k, q.q1)), q0: ratSub(p.q0, ratMul(k, q.q0)) })
  const keep = (xs: Rational[] | null) => xs?.filter((x) => !sys.rs.some((y) => ratEq(x, y))) ?? null
  add(isZero(c) ? null : keep(roots(sub(sys.q, c, sys.s))), 'lgsp-target-flip')
  add(keep(roots(sub(sys.s, ONE, constQ(c)))), 'lgsp-target-numerator')
  if (isZero(E.q2)) add([ratDiv(E.q0, E.q1)], 'cramer-solve-sign')
  else add(roots({ q2: E.q2, q1: ratNeg(E.q1), q0: E.q0 }), 'det-root-sign')
  const qL = quadLatex(sys.q, 'a')
  const sL = quadLatex(sys.s, 'a')
  const eqn = isZero(c) ? `${sL} = 0` : `${sL} = ${isOne(c) ? '' : `${ratLatex(c)} \\cdot `}(${qL})`
  const solved = (roots(E) ?? []).map((x) => `$a = ${ratLatex(x)}$`).join(' und ')
  const dropped = excluded.length > 0 ? ` Aber $a = ${ratLatex(excluded[0])}$ ist ein Sonderwert: Dort ist $${qL} = 0$, die letzte Stufe fällt weg, und es gibt keine eindeutige Lösung. Dieser Wert fällt weg.` : ''
  steps.push(
    choiceStep(rng, {
      id: 'vorgabe',
      title: 'Wert vorgegeben',
      question: `Für $a$ ohne die Sonderwerte ist $${v} = \\frac{${sL}}{${qL}}$. Für welche $a$ hat das System genau eine Lösung, und zwar mit $${v} = ${ratLatex(c)}$?`,
      correct: eqLatex(valid),
      wrongs,
      hint: `Setz den Bruch gleich $${ratLatex(c)}$ und nimm mit dem Nenner mal. Prüf am Ende, ob ein Wert ein Sonderwert ist.`,
      explanation: {
        detailed: `$${v} = ${ratLatex(c)}$ heißt $${eqn}$. Zusammengefasst: $${quadLatex(E, 'a')} = 0$, das ergibt ${solved}.${dropped}`,
        short: `$${quadLatex(E, 'a')} = 0$${excluded.length > 0 ? `, ohne $a = ${ratLatex(excluded[0])}$ (Sonderwert)` : ''}: $${solLatex(valid)}$.`,
      },
      established: [solLatex(valid)],
      cards: [LGSP_CARD.rechts],
    }),
  )
  const disp = shown(rng, sys.T, vars)
  return {
    kind: 'lgspTarget',
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welche $a$ hat es genau eine Lösung, und zwar mit $${v} = ${ratLatex(c)}$?`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, LGSP_CARD.rechts],
    resultLatex: solLatex(sortRats(valid)),
    ...sliderOf(sys.T, n, sys.rs, { start: sortRats(valid)[0], targets: valid.map((x) => ({ value: x, note: `$${v} = ${ratLatex(c)}$` })) }),
    form: `lgspTarget|${n}|${disp.eq ? 'eq' : 'mat'}|${sys.cases.join('')}|${sys.spec.place}${sys.spec.square ? 'q' : ''}${sys.swapWith >= 0 ? 's' : ''}|${excluded.length}|${valid.length}|${vars[0]}|${ratSign(c)}|${signs(sys.T)}|${paramMask(sys.T)}`,
    data: { ...dataOf(sys.T), k: [n - 1], c: [num(c)] },
    answer: sortRats(valid).map(num),
  }
}

// Stufe 5: alle Fälle, Lösungsmenge beim Sonderwert mit unendlich vielen Lösungen
function buildFull(rng: Rng, level: Level): Built | null {
  const cases: Case2[] = rng.shuffle(['inf', 'none'])
  const sys = makeSym(rng, { n: 3, cases, withB: false, ...placeSpec(rng, level, 3, 2), level })
  if (!sys) return null
  const vars = rng.pick(VARS[3])
  const n = 3
  const v = vars[2]
  const iInf = sys.cases.indexOf('inf')
  const r1 = sys.rs[iInf]
  // Lösungsmenge bei a = r1 (ganze Zahlen)
  const Fr = ptAt(sys.F, r1)
  const info = analyze(Fr, n)
  if (info.kase !== 'inf' || info.pivots.length !== 2) return null
  const free = [2]
  const vals = backSolve(Fr, n, info.pivots, free)!
  if (vals.some((a) => a.some((x) => !isInteger(x) || Math.abs(num(x)) > 12))) return null
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const table = ptabLatex(sys.F, vars)
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table, withB: false }, sys.rs))
  const specials: Special[] = sys.rs.map((r, i) => ({ r, kase: sys.cases[i], why: rowWhy(sys, r, sys.cases[i], v) }))
  steps.push(specialStep(rng, specials, 'none', `Für welche $a$ hat das System keine Lösung?\n$${table}$`))
  steps.push(rankStep(rng, `Setz $a = ${ratLatex(r1)}$ in die Stufenform ein. Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(Fr, vars)}$`, 'inf', n))
  // Lösungsmenge
  const pool = paramNames(rng)
  const params = [pool[0] === 't' ? 't' : pool[0]]
  const split = (vs: readonly Aff[]) => ({ p: vs.map((a) => a[0]), dirs: [vs.map((a) => a[1])] })
  const sol = split(vals)
  const right = solutionLatex(sol.p, sol.dirs, params)
  const slipped = info.pivots.flatMap((pv) =>
    (['sign', 'forgot', 'coef', 'flip', 'sub'] as const).flatMap((kind) => {
      const w = backSolve(Fr, n, info.pivots, free, { row: pv.row, kind })
      return w ? [[split(w).p, split(w).dirs, SLIP_RULE[kind]] as [Aff, Aff[], string]] : []
    }),
  )
  const cands: [Aff, Aff[], string][] = rng.shuffle(slipped)
  cands.unshift([sol.p, [sol.dirs[0].map((x, i) => (i === 2 ? ZERO : x))], 'gauss-param-free-one'])
  if (sol.p.some((x) => !isZero(x))) cands.splice(1, 0, [sol.dirs[0], [sol.p], 'gauss-param-swap'])
  const wrongs: Wrong[] = []
  // allgemeine Formel beim Sonderwert: gekürzter Bruch für z (Grenzwert s'/q'), dann ein einziger Punkt
  const dq = ratAdd(sys.q.q1, ratMul(R(2), ratMul(sys.q.q2, r1)))
  const ds = ratAdd(sys.s.q1, ratMul(R(2), ratMul(sys.s.q2, r1)))
  if (!isZero(dq)) {
    const zg = ratDiv(ds, dq)
    const point = sol.p.map((x, i) => ratAdd(x, ratMul(zg, sol.dirs[0][i])))
    if (point.every((x) => Math.abs(num(x)) <= 40)) wrongs.push({ content: math(`\\vec x = ${vecLatex(point)}`), rule: 'lgsp-general-formula' })
  }
  const seen: [Aff, Aff[]][] = [[sol.p, sol.dirs]]
  for (const [p, dirs, rule] of cands) {
    if (rankOf(dirs) !== dirs.length || seen.some(([sp, sd]) => sameAffine(sp, sd, p, dirs))) continue
    seen.push([p, dirs])
    wrongs.push({ content: math(solutionLatex(p, dirs, params)), rule })
  }
  if (wrongs.length < 3) return null
  const known = info.pivots.map((pv) => `$${vars[pv.col]} = ${termsLatex([[vals[pv.col][0], ''], [vals[pv.col][1], params[0]]])}$`).reverse().join(', ')
  steps.push(
    choiceStep(rng, {
      id: 'loesung',
      title: 'Lösungsmenge',
      question: `Für $a = ${ratLatex(r1)}$ gibt es unendlich viele Lösungen. Mit $${v} = ${params[0]}$: Wie lautet die Lösungsmenge?\n$${tabLatex(Fr, vars)}$`,
      correct: math(right),
      wrongs: [wrongs[0], ...rng.shuffle(wrongs.slice(1))],
      hint: `Setz den Sonderwert in die Stufenform ein (nicht in die Formel für den allgemeinen Fall). Die Nullzeile fällt weg, $${v} = ${params[0]}$ ist frei; rechne von unten nach oben.`,
      explanation: {
        detailed: `Für $a = ${ratLatex(r1)}$ ist die letzte Zeile $0 = 0$ und fällt weg. Mit $${v} = ${params[0]}$ ergibt sich von unten nach oben ${known}. Als Vektor: $${right}$. Die Formel für $${v}$ aus dem allgemeinen Fall gilt hier nicht, denn sie teilt durch $${quadLatex(sys.q, 'a')}$, und das ist bei $a = ${ratLatex(r1)}$ gleich $0$.`,
        short: `$${right}$.`,
      },
      established: [right],
      cards: [LGSP_CARD.gauss, GAUSS_CARD.rueckwaerts],
    }),
  )
  const disp = shown(rng, sys.T, vars)
  return {
    kind: 'lgspFull',
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Untersuche, für welche $a$ es genau eine, keine oder unendlich viele Lösungen hat, und gib die Lösungsmenge für den Fall mit unendlich vielen Lösungen an.`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, LGSP_CARD.rang],
    resultLatex: right,
    ...sliderOf(sys.T, n, sys.rs, { start: r1 }),
    form: `lgspFull|${disp.eq ? 'eq' : 'mat'}|${sys.cases.join('')}|${sys.spec.place}${sys.spec.square ? 'q' : ''}${sys.swapWith >= 0 ? 's' : ''}|${vars[0]}|${params[0]}|${signs(sys.T)}|${paramMask(sys.T)}`,
    data: { ...dataOf(sys.T), inf: [num(r1)] },
    answer: [...sol.p, ...sol.dirs.flat()].map(num),
  }
}

// ------------------------------------------------------------------ Determinante zuerst (a irgendwo in der Matrix)

// Stufenform beim Sonderwert, mit Gauß in Zahlen (Fehler aus der letzten Umformung)
function numericStep(rng: Rng, T: Tab, r: Rational, idx: number, vars: readonly string[]): { step: GuidedStep; F: Tab } | null {
  const n = vars.length
  const stages = runGauss(T, n)
  const lastStage = stages.at(-1)
  if (!lastStage || lastStage.kind !== 'elim') return null
  if (stages.some((st) => st.after.some((row) => row.some((x) => !isInteger(x) || Math.abs(num(x)) > 40)))) return null
  const F = lastStage.after
  const cands = elimCands(rng, lastStage as Extract<Stage, { kind: 'elim' }>, n)
  const wrongs: Wrong[] = []
  const seen: Tab[] = [F]
  for (const [W, rule] of [cands[0], ...rng.shuffle(cands.slice(1))]) {
    if (seen.some((S) => sameTab(S, W)) || equivalent(W, F)) continue
    seen.push(W)
    wrongs.push({ content: math(tabLatex(W, vars)), rule })
  }
  if (wrongs.length < 3) return null
  const ops = stages.flatMap((st) => (st.kind === 'swap' ? [`$\\text{${ROMAN[st.row]}} \\leftrightarrow \\text{${ROMAN[st.other]}}$`] : st.ops.map((o) => `$${opLabel(o, st.row)}$`)))
  return {
    F,
    step: choiceStep(rng, {
      id: `stufenform-${idx}`,
      title: `Sonderwert $a = ${ratLatex(r)}$`,
      question: `Setz $a = ${ratLatex(r)}$ ein und bring die Tabelle mit dem Gauß-Verfahren auf Stufenform. Was kommt heraus?\n$${tabLatex(T, vars)}$`,
      correct: math(tabLatex(F, vars)),
      wrongs,
      hint: 'Jetzt stehen nur noch Zahlen da: Erzeuge Spalte für Spalte Nullen unter den Stufen und rechne jede Zahl mit, auch rechts vom Strich.',
      explanation: {
        detailed: `Mit $a = ${ratLatex(r)}$ ist es ein ganz normales Gleichungssystem. Umformungen: ${ops.join(', ')}. Weil $\\det A = 0$ ist, bleibt in der letzten Zeile links nur $0$ übrig.`,
        short: `${ops.join(', ')}.`,
      },
      cards: [LGSP_CARD.gauss, GAUSS_CARD.tabelle],
    }),
  }
}

// Matrix mit a: 2 × 2 (a an ein oder zwei Stellen) oder 3 × 3 (eine Stelle: det linear; zwei Stellen: paramMatrix)
function paramSystemMatrix(rng: Rng, n: 2 | 3, count: 1 | 2): { A: PMat; rs: Rational[] } | null {
  if (n === 3 && count === 2) {
    const pm = paramMatrix(rng)
    return pm ? { A: pm.M, rs: [...pm.roots] } : null
  }
  const M: Lin[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => lin(R(nonzero(rng, -6, 6)))))
  if (n === 3) M[rng.int(0, 2)][rng.int(0, 2)] = lin(ZERO)
  const spots: (readonly [number, number])[] =
    count === 2 ? [...rng.pick([[[0, 0], [1, 1]], [[0, 1], [1, 0]]] as const)] : [[rng.int(0, n - 1), rng.int(0, n - 1)] as const]
  for (const [i, j] of spots) M[i][j] = lin(R(rng.pick([0, 0, 1, -1, 2, -2])), R(rng.pick([1, 1, -1, 2])))
  const D = polyOf(M, det)
  if (isZero(D.q2) && isZero(D.q1)) return null
  const rs = roots(D)
  if (!rs || rs.length !== count || rs.some((r) => !isInteger(r) || isZero(r) || Math.abs(num(r)) > 6)) return null
  if (count === 2 && ratEq(ratAbs(rs[0]), ratAbs(rs[1]))) return null
  return { A: M, rs }
}

const mulVec = (A: Tab, x: readonly Rational[]) => A.map((r) => r.reduce((acc, a, j) => ratAdd(acc, ratMul(a, x[j])), ZERO))

function buildDet(rng: Rng, level: Level): Built | null {
  // Stufe 2: 2 × 2; Stufe 3: auch 3 × 3; ab Stufe 4 zwei Sonderwerte, Stufe 5 nur 3 × 3
  const n: 2 | 3 = level <= 2 ? 2 : level >= 5 ? 3 : rng.chance(0.5) ? 3 : 2
  const count: 1 | 2 = level >= 4 ? 2 : rng.chance(0.5) ? 2 : 1
  const pm = paramSystemMatrix(rng, n, count)
  if (!pm) return null
  const { A, rs } = pm
  // rechte Seite: an einem Sonderwert lösbar (unendlich viele) oder an keinem
  const wantInf = rng.chance(0.6)
  let b: Rational[]
  if (wantInf) {
    const r = rng.pick(rs)
    b = mulVec(at(A, r), Array.from({ length: n }, () => R(rng.int(-2, 3))))
  } else b = Array.from({ length: n }, () => R(rng.int(-6, 7)))
  if (b.every(isZero) || b.some((x) => Math.abs(num(x)) > 20) || b.filter(isZero).length > 1) return null
  const vars = n === 2 ? ['x', 'y'] : rng.pick(VARS[3])
  const tabAt = (r: Rational): Tab => at(A, r).map((row, i) => [...row, b[i]])
  const caseAt = (r: Rational): Case2 | null => {
    const M = at(A, r)
    const ra = rankOf(M)
    if (ra !== n - 1) return null
    return rankOf(tabAt(r)) === ra ? 'inf' : 'none'
  }
  const cases = rs.map(caseAt)
  if (cases.some((c) => c === null)) return null
  const ctx: CramerCtx = { A, b, n }
  const steps: GuidedStep[] = [detStep(rng, ctx, null, 'det', [LGSP_CARD.gauss, n === 3 ? DET_CARD.sarrus : DET_CARD.zwei])]
  const D = polyOf(A, det)
  steps.push(conditionStep(rng, { kind: 'det', D }, rs))
  const specials: Special[] = []
  const tables: Tab[] = []
  for (const [i, r] of rs.entries()) {
    const res = numericStep(rng, tabAt(r), r, i + 1, vars)
    if (!res) return null
    steps.push(res.step)
    tables.push(res.F)
    const kase = cases[i]!
    const info = analyze(res.F, n)
    if (info.kase !== kase) return null
    const lastRow = res.F[n - 1]
    specials.push({ r, kase, why: `Für $a = ${ratLatex(r)}$ endet die Stufenform mit der Zeile $0 = ${ratLatex(lastRow[n])}$: ${kase === 'none' ? 'ein Widerspruch, keine Lösung.' : 'eine Nullzeile, eine Unbekannte ist frei, unendlich viele Lösungen.'}` })
  }
  const T: PT = A.map((row, i) => [...row.map(fromLin), P(b[i])])
  const disp = shown(rng, T, vars)
  const formBase = `lgspDet|${n}|${disp.eq ? 'eq' : 'mat'}|${cases.join('')}|${vars[0]}|${signs(T)}|${paramMask(T)}`
  if (rs.length === 1) {
    const [r] = rs
    const kase = cases[0]!
    const c = tables[0][n - 1][n]
    steps.push(singleCaseStep(rng, r, kase, `0 = ${ratLatex(c)}`, c, vars[n - 1], `Was gilt für den Sonderwert $a = ${ratLatex(r)}$?\n$${tabLatex(tables[0], vars)}$`, specials[0].why))
    return {
      kind: 'lgspDet',
      instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welches $a$ hat es nicht genau eine Lösung, und was gilt dort? Bestimme zuerst $\\det A$.`,
      functionLatex: disp.functionLatex,
      steps,
      cards: [LGSP_CARD.gauss],
      resultLatex: singleResult(r, kase),
      ...sliderOf(T, n, rs),
      form: formBase,
      data: { ...dataOf(T), single: [1] },
      answer: [num(r), CASE_INDEX[kase]],
    }
  }
  if (level >= 4) {
    const i = rng.int(0, rs.length - 1)
    steps.push(rankStep(rng, `Für $a = ${ratLatex(rs[i])}$ hat die Stufenform diese Gestalt. Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(tables[i], vars)}$`, cases[i]!, n))
  }
  const ask = rng.pick(cases as Case2[])
  const askText = ask === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'
  const right = rs.filter((_, i) => cases[i] === ask)
  steps.push(specialStep(rng, specials, ask, `Für welche $a$ hat das System ${askText}?`))
  return {
    kind: 'lgspDet',
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welche $a$ hat es ${askText}? Bestimme zuerst $\\det A$ und untersuche dann die Sonderwerte einzeln.`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, ...(level >= 4 ? [LGSP_CARD.rang] : [])],
    resultLatex: solLatex(sortRats(right)),
    ...sliderOf(T, n, rs, { start: right[0] }),
    form: `${formBase}|${ask}`,
    data: { ...dataOf(T), ask: [CASE_INDEX[ask]] },
    answer: sortRats(right).map(num),
  }
}

// ------------------------------------------------------------------ Arten

// Fälle und Größe vor den Versuchen festlegen (sonst überwiegen die leichter zu bauenden)
function retry(make: () => (() => Built | null)): Built {
  for (let round = 0; round < 30; round++) {
    const attempt = make()
    for (let k = 0; k < 300; k++) {
      const built = attempt()
      if (built && built.steps.every((s) => s.choices.length >= 4)) return built
    }
  }
  throw new Error('Gleichungssystem mit Parameter: keine Aufgabe mit genug Antworten gefunden')
}

const symCases = (rng: Rng, level: Level, n: 2 | 3): Case2[] => {
  if (n === 2 || level <= 2) return [rng.pick(['none', 'inf'] as const)]
  return rng.pick([['none'], ['inf'], ['inf', 'none'], ['none', 'inf'], ['none', 'none'], ['inf', 'inf']] as const).slice()
}

export const LGSP_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['lgspTwo'],
  2: ['lgspTwo', 'lgspThree', 'lgspDet'],
  3: ['lgspThree', 'lgspDet'],
  4: ['lgspDet', 'lgspRhs', 'lgspTarget'],
  5: ['lgspFull', 'lgspRhs', 'lgspTarget', 'lgspDet'],
}

export const LGSP_BUILDERS: Readonly<Record<Extract<VectorKind, `lgsp${string}`>, (rng: Rng, level: Level) => Built>> = {
  lgspTwo: (rng, level) =>
    retry(() => {
      const cases = symCases(rng, level, 2)
      return () => buildSym(rng, level, 'lgspTwo', cases)
    }),
  lgspThree: (rng, level) =>
    retry(() => {
      const cases = symCases(rng, level, 3)
      return () => buildSym(rng, level, 'lgspThree', cases)
    }),
  lgspDet: (rng, level) => retry(() => () => buildDet(rng, level)),
  lgspRhs: (rng, level) => retry(() => () => buildRhs(rng, level)),
  lgspTarget: (rng, level) =>
    retry(() => {
      const trap = level >= 5 && rng.chance(0.5)
      return () => buildTarget(rng, level, trap)
    }),
  lgspFull: (rng, level) => retry(() => () => buildFull(rng, level)),
}
