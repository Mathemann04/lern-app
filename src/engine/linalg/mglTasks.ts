import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Quad, quadLatex } from './crossTasks.ts'
import { detStep, roots, sortRats } from './cramerTasks.ts'
import { type Lin, type Mat, type PMat, DET_CARD, det, lin, polyOf } from './detTasks.ts'
import { vectorErrorRule } from './errorRules.ts'
import { type DrawArrow, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { INV_CARD, detTwoStep, inverse, inverseStep, jordanOk, jordanSteps, unimodular } from './invTasks.ts'
import { MAT_CARD, arrange, combStep, matLatex, productQ, productStepQ } from './matrixTasks.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex } from './vec.ts'

// Baustein „Matrizengleichungen“ (M7 Schritt 12b) der Tätigkeit „Matrizen und Gleichungssysteme“: erst allgemein nach X
// auflösen wie beim Umstellen (Transponierte und Inverse mit den Regeln auflösen, Glieder mit X nach links, eine Zahl als
// Vielfaches von E schreiben, X auf seiner Seite ausklammern, von derselben Seite mit der Inversen malnehmen), dann
// einsetzen und ausrechnen (Klammer, rechte Seite, Inverse, Produkt). Mit Parameter: für welche a eindeutig lösbar
// (det M ≠ 0), dann X für einen Wert. Alles exakt mit Brüchen; X kommt ganzzahlig heraus.

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)
const PARAM = 'a'
const T = '^{\\mathsf T}'

export const MGL_CARD = {
  aufloesen: 'mgl-aufloesen',
  umformen: 'mgl-umformen',
  parameter: 'mgl-parameter',
} as const

// ------------------------------------------------------------------ Matrizen

const build = (n: number, f: (i: number, j: number) => Rational): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => f(i, j)))
const identity = (n: number): Mat => build(n, (i, j) => (i === j ? ONE : ZERO))
const transpose = (A: Mat): Mat => build(A.length, (i, j) => A[j][i])
const add = (A: Mat, B: Mat): Mat => build(A.length, (i, j) => ratAdd(A[i][j], B[i][j]))
const scale = (k: Rational, A: Mat): Mat => A.map((r) => r.map((x) => ratMul(k, x)))
const mul = (A: Mat, B: Mat): Mat => productQ(A, B)!
const plusE = (P: Mat, k: Rational): Mat => add(P, scale(k, identity(P.length)))
const matEq = (A: Mat, B: Mat) => A.every((r, i) => r.every((x, j) => ratEq(x, B[i][j])))
const maxAbs = (A: Mat) => Math.max(...A.flat().map((x) => Math.abs(num(x))))
const maxDen = (A: Mat) => Math.max(...A.flat().map((x) => Number(x.d)))
const negCount = (A: Mat) => A.flat().filter((x) => ratSign(x) < 0).length
const symmetric = (A: Mat) => matEq(A, transpose(A))
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

// ------------------------------------------------------------------ Gleichungen

// L: Matrix links von X (AX), R: rechts (XA)
type Side = 'L' | 'R'
// so steht die Gleichung in der Aufgabe: wie aufgelöst (none), mit (XᵀA)ᵀ (tProduct), mit (X⁻¹A)⁻¹ (inv), ganz
// transponiert (tWhole), AXA⁻¹ (conj), A⁻¹XA (conjInv)
type Wrap = 'none' | 'tProduct' | 'inv' | 'tWhole' | 'conj' | 'conjInv'
const WRAP_CODE: Readonly<Record<Wrap, number>> = { none: 0, tProduct: 1, inv: 2, tWhole: 3, conj: 4, conjInv: 5 }
// Glied der aufgelösten Gleichung: das Glied mit der Matrix (P), ein Vielfaches von X (Zahl oder mit Parameter) oder
// ein Vielfaches einer gegebenen Matrix (Nummer c)
type Term = { readonly t: 'P' } | { readonly t: 'x'; readonly k: Lin } | { readonly t: 'c'; readonly k: Rational; readonly c: number }
type Shape = {
  readonly n: 2 | 3
  readonly side: Side
  readonly wrap: Wrap
  // aufgelöste Gleichung; das Glied P steht links
  readonly lhs: readonly Term[]
  readonly rhs: readonly Term[]
  // Seiten in der Aufgabe vertauscht (B = AX)
  readonly flip: boolean
  // je gegebener Matrix: in der aufgelösten Gleichung transponiert
  readonly tBase: readonly boolean[]
}
type RTerm = { readonly k: Rational; readonly c: number }
// Gleichung nach dem Ordnen: (P + βE) X = Σ k · C
type Form = { readonly beta: Lin; readonly rt: readonly RTerm[] }

const LETTERS = [
  ['A', 'B', 'C', 'D'],
  ['P', 'Q', 'S', 'U'],
  ['K', 'L', 'N', 'V'],
  ['F', 'G', 'H', 'W'],
] as const

const linZero = (x: Lin) => isZero(x.c0) && isZero(x.c1)
const linAdd = (x: Lin, y: Lin) => lin(ratAdd(x.c0, y.c0), ratAdd(x.c1, y.c1))
const linNeg = (x: Lin) => lin(ratNeg(x.c0), ratNeg(x.c1))
const linAt = (x: Lin, a: Rational) => ratAdd(x.c0, ratMul(x.c1, a))
const hasParam = (x: Lin) => !isZero(x.c1)

type Piece = { readonly neg: boolean; readonly text: string }
// k · body mit Vorzeichen: 2X, -X, aX, (2 - a)X
function coefPiece(k: Lin, body: string): Piece {
  const one = (c: Rational, rest: string) => `${isOne(ratAbs(c)) ? '' : ratLatex(ratAbs(c))}${rest}`
  if (!hasParam(k)) return { neg: ratSign(k.c0) < 0, text: one(k.c0, body) }
  if (isZero(k.c0)) return { neg: ratSign(k.c1) < 0, text: one(k.c1, `${PARAM}${body}`) }
  return { neg: false, text: `(${ratLatex(k.c0)} ${ratSign(k.c1) < 0 ? '-' : '+'} ${one(k.c1, PARAM)})${body}` }
}
const sumLatex = (ps: readonly Piece[]) => (ps.length === 0 ? '0' : ps.map((p, i) => `${i === 0 ? (p.neg ? '-' : '') : p.neg ? ' - ' : ' + '}${p.text}`).join(''))

// Ansicht: wie das Glied P, X und die gegebenen Matrizen geschrieben werden
type View = { readonly p: string; readonly x: string; readonly c: (c: number) => string }
function piece(t: Term, v: View): Piece {
  if (t.t === 'P') return { neg: false, text: v.p }
  if (t.t === 'x') return coefPiece(t.k, v.x)
  return coefPiece(lin(t.k), v.c(t.c))
}
const sideLatex = (ts: readonly Term[], v: View) => sumLatex(ts.map((t) => piece(t, v)))
const eqLatex = (s: Shape, v: View, flip = s.flip) => (flip ? `${sideLatex(s.rhs, v)} = ${sideLatex(s.lhs, v)}` : `${sideLatex(s.lhs, v)} = ${sideLatex(s.rhs, v)}`)

type Ctx = {
  readonly s: Shape
  readonly names: readonly string[] // names[0]: Matrix im Glied P, names[1 + c]: gegebene Matrix c
}
const cName = (ctx: Ctx, c: number, t: boolean) => `${ctx.names[1 + c]}${t ? T : ''}`
const aName = (ctx: Ctx) => ctx.names[0]
// Matrix im Glied P der aufgelösten Gleichung
const pName = (ctx: Ctx) => (ctx.s.wrap === 'tProduct' ? `${aName(ctx)}${T}` : ctx.s.wrap === 'inv' ? `${aName(ctx)}^{-1}` : aName(ctx))
const pTerm = (_ctx: Ctx, p: string, side: Side) => (side === 'L' ? `${p}X` : `X${p}`)
const conjText = (ctx: Ctx) => (ctx.s.wrap === 'conj' ? `${aName(ctx)}X${aName(ctx)}^{-1}` : `${aName(ctx)}^{-1}X${aName(ctx)}`)
function baseView(ctx: Ctx): View {
  const conj = ctx.s.wrap === 'conj' || ctx.s.wrap === 'conjInv'
  return { p: conj ? conjText(ctx) : pTerm(ctx, pName(ctx), ctx.s.side), x: 'X', c: (c) => cName(ctx, c, ctx.s.tBase[c]) }
}
// so steht die Gleichung in der Aufgabe
function shownView(ctx: Ctx): View {
  const a = aName(ctx)
  const { side, wrap } = ctx.s
  if (wrap === 'tProduct') return { ...baseView(ctx), p: side === 'L' ? `(X${T}${a})${T}` : `(${a}X${T})${T}` }
  if (wrap === 'inv') return { ...baseView(ctx), p: side === 'L' ? `(X^{-1}${a})^{-1}` : `(${a}X^{-1})^{-1}` }
  if (wrap === 'tWhole') return { p: side === 'L' ? `X${T}${a}${T}` : `${a}${T}X${T}`, x: `X${T}`, c: (c) => cName(ctx, c, !ctx.s.tBase[c]) }
  return baseView(ctx)
}

const constTerms = (ts: readonly Term[]) => ts.filter((t): t is Extract<Term, { t: 'c' }> => t.t === 'c')
const xTerms = (ts: readonly Term[]) => ts.filter((t): t is Extract<Term, { t: 'x' }> => t.t === 'x')
const sumLin = (xs: readonly Lin[]) => xs.reduce(linAdd, lin(ZERO))
// richtig geordnet: X-Glieder nach links, die anderen nach rechts, jeweils mit Vorzeichenwechsel
function ordered(s: Shape, slip: { readonly x?: boolean; readonly c?: boolean } = {}): Form {
  const right = xTerms(s.rhs).map((t) => (slip.x ? t.k : linNeg(t.k)))
  const beta = sumLin([...xTerms(s.lhs).map((t) => t.k), ...right])
  const rt = [...constTerms(s.rhs).map((t) => ({ k: t.k, c: t.c })), ...constTerms(s.lhs).map((t) => ({ k: slip.c ? t.k : ratNeg(t.k), c: t.c }))]
  return { beta, rt }
}
const formEq = (f: Form, g: Form) => ratEq(f.beta.c0, g.beta.c0) && ratEq(f.beta.c1, g.beta.c1) && f.rt.length === g.rt.length && f.rt.every((r, i) => ratEq(r.k, g.rt[i].k) && r.c === g.rt[i].c)
const needsOrder = (s: Shape) => xTerms(s.rhs).length > 0 || constTerms(s.lhs).length > 0 || xTerms(s.lhs).length > 1

const rLatex = (ctx: Ctx, rt: readonly RTerm[]) => sumLatex(rt.map((r) => coefPiece(lin(r.k), cName(ctx, r.c, ctx.s.tBase[r.c]))))
// rechte Seite als Faktor: B oder (B - C)
const rFactor = (ctx: Ctx, rt: readonly RTerm[]) => (rt.length === 1 && isOne(rt[0].k) ? rLatex(ctx, rt) : `(${rLatex(ctx, rt)})`)
const rSimple = (rt: readonly RTerm[]) => rt.length === 1 && isOne(rt[0].k)

// Koeffizient von X nach dem Ausklammern: A - 2E, A^T + aE, (2 - a) …
// ohne E (e = ''): die Zahl allein, auch 1 (typischer Fehler „A - 1“)
function mExpr(ctx: Ctx, beta: Lin, e = 'E'): string {
  if (linZero(beta)) return pName(ctx)
  const p = coefPiece(beta, e)
  return sumLatex([{ neg: false, text: pName(ctx) }, p.text === '' ? { ...p, text: '1' } : p])
}
const mParen = (ctx: Ctx, beta: Lin, e = 'E') => (linZero(beta) ? pName(ctx) : `(${mExpr(ctx, beta, e)})`)
// Inverse des Koeffizienten: (A - 2E)^{-1}, A^{-1}, (A^T)^{-1}; bei A^{-1} hebt sie sich auf
function mInv(ctx: Ctx, beta: Lin): string {
  if (!linZero(beta)) return `${mParen(ctx, beta)}^{-1}`
  if (ctx.s.wrap === 'inv') return aName(ctx)
  if (ctx.s.wrap === 'tProduct') return `(${pName(ctx)})^{-1}`
  return `${pName(ctx)}^{-1}`
}
const withX = (side: Side, m: string) => (side === 'L' ? `${m}X` : `X${m}`)
const orderedLatex = (ctx: Ctx, f: Form) => `${sumLatex([{ neg: false, text: baseView(ctx).p }, ...(linZero(f.beta) ? [] : [coefPiece(f.beta, 'X')])])} = ${rLatex(ctx, f.rt)}`
const factoredLatex = (ctx: Ctx, f: Form, side = ctx.s.side, e = 'E') => `${withX(side, mParen(ctx, f.beta, e))} = ${rLatex(ctx, f.rt)}`
// X = M⁻¹R bzw. X = RM⁻¹
const solvedLatex = (ctx: Ctx, f: Form, side = ctx.s.side, inv = mInv(ctx, f.beta)) => `X = ${side === 'L' ? `${inv}${rFactor(ctx, f.rt)}` : `${rFactor(ctx, f.rt)}${inv}`}`

// zwei Fehler auf einmal: Id des ersten, „Warum falsch?“ erklärt beide
function twoWhy(a: string, b: string) {
  const [p, q] = [vectorErrorRule(a).why, vectorErrorRule(b).why]
  return { detailed: `Hier stecken zwei Fehler. ${p.detailed} Außerdem: ${q.detailed}`, short: `${p.short} ${q.short}` }
}

// ------------------------------------------------------------------ Schritte: allgemein auflösen

// Transponierte bzw. Inverse auflösen
function wrapStep(rng: Rng, ctx: Ctx): GuidedStep {
  const { s } = ctx
  const a = aName(ctx)
  const shown = shownView(ctx)
  const base = baseView(ctx)
  const correct = math(eqLatex(s, base))
  const other: Side = s.side === 'L' ? 'R' : 'L'
  const with_ = (v: Partial<View>) => math(eqLatex(s, { ...base, ...v }))
  let wrongs: Wrong[]
  let question: string
  let hint: string
  let detailed: string
  if (s.wrap === 'tProduct') {
    wrongs = [
      { content: with_({ p: pTerm(ctx, `${a}${T}`, other) }), rule: 'mat-transpose-rule' },
      { content: with_({ p: s.side === 'L' ? `${a}${T}X${T}` : `X${T}${a}${T}` }), rule: 'mgl-transpose-twice' },
      { content: with_({ p: pTerm(ctx, a, s.side) }), rule: 'mat-transpose-ignored' },
    ]
    question = `Löse $${shown.p}$ auf. Wie lautet die Gleichung dann?\n$${eqLatex(s, shown)}$`
    hint = `Beim Transponieren eines Produkts dreht sich die Reihenfolge um, und zweimal transponieren hebt sich auf.`
    detailed = `Mit $(YZ)${T} = Z${T}Y${T}$ und $(X${T})${T} = X$ wird $${shown.p} = ${base.p}$. Die Reihenfolge dreht sich um, $${a}$ wird transponiert, und die Transponierte von $X${T}$ ist wieder $X$. Damit: $${eqLatex(s, base)}$.`
  } else if (s.wrap === 'inv') {
    const xi = 'X^{-1}'
    wrongs = [
      { content: with_({ p: pTerm(ctx, `${a}^{-1}`, other) }), rule: 'inv-order' },
      { content: with_({ p: s.side === 'L' ? `${a}^{-1}${xi}` : `${xi}${a}^{-1}` }), rule: 'inv-inverse-twice' },
      { content: with_({ p: s.side === 'L' ? `${xi}${a}^{-1}` : `${a}^{-1}${xi}` }), rule: 'inv-order', why: twoWhy('inv-order', 'inv-inverse-twice') },
    ]
    question = `Löse $${shown.p}$ auf. Wie lautet die Gleichung dann?\n$${eqLatex(s, shown)}$`
    hint = `Beim Invertieren eines Produkts dreht sich die Reihenfolge um, und zweimal invertieren hebt sich auf.`
    detailed = `Mit $(YZ)^{-1} = Z^{-1}Y^{-1}$ und $(X^{-1})^{-1} = X$ wird $${shown.p} = ${base.p}$. Damit: $${eqLatex(s, base)}$.`
  } else {
    // ganze Gleichung transponieren
    wrongs = [
      { content: with_({ p: pTerm(ctx, a, other) }), rule: 'mat-transpose-rule' },
      { content: with_({ c: shown.c }), rule: 'mat-transpose-ignored' },
      { content: with_({ p: s.side === 'L' ? `${a}X${T}` : `X${T}${a}`, x: `X${T}` }), rule: 'mgl-transpose-twice' },
    ]
    question = `In der Gleichung steht $X$ nur transponiert. Transponiere beide Seiten. Wie lautet die Gleichung dann?\n$${eqLatex(s, shown)}$`
    hint = `Jedes Glied wird transponiert: Bei Produkten dreht sich die Reihenfolge um, und zweimal transponieren hebt sich auf, auch bei den gegebenen Matrizen.`
    detailed = `Sind zwei Matrizen gleich, sind es auch ihre Transponierten, und $(Y + Z)${T} = Y${T} + Z${T}$. Jedes Glied für sich: $(${shown.p})${T} = ${base.p}$ (Reihenfolge umgedreht), $(X${T})${T} = X$, und eine gegebene Matrix bekommt ein $${T}$ dazu bzw. verliert es. Damit: $${eqLatex(s, base)}$.`
  }
  return choiceStep(rng, {
    id: 'aufloesen',
    title: s.wrap === 'inv' ? 'Inverse auflösen' : 'Transponierte auflösen',
    question,
    correct,
    wrongs: rng.shuffle(wrongs),
    hint,
    explanation: { detailed, short: `$${eqLatex(s, base)}$.` },
    established: [eqLatex(s, base)],
    cards: [MGL_CARD.umformen],
  })
}

type Slip = { readonly f: Form; readonly why?: ReturnType<typeof twoWhy> }
// Fehler beim Rüberbringen: Vorzeichen bei den X-Gliedern bzw. bei den übrigen nicht gewechselt
function moveSlips(s: Shape): Slip[] {
  const right = ordered(s)
  const out: Slip[] = []
  for (const slip of [{ x: true }, { c: true }, { x: true, c: true }]) {
    const f = ordered(s, slip)
    if (!formEq(f, right) && !out.some((o) => formEq(o.f, f))) out.push({ f })
  }
  return out
}

// Ordnen ohne eigenen Schritt: Erklärung und Tipp des nächsten Schritts sagen es
type OrderNote = { readonly text: string; readonly hint: string }
function orderNoteFor(ctx: Ctx): OrderNote {
  const combined = xTerms([...ctx.s.lhs, ...ctx.s.rhs]).length > 1
  return {
    text: `Zuerst ordnen: Glieder mit $X$ nach links, die übrigen nach rechts; wechselt ein Glied die Seite, wechselt es sein Vorzeichen${combined ? ', und die Vielfachen von $X$ fasst du zusammen' : ''}: $${orderedLatex(ctx, ordered(ctx.s))}$. `,
    hint: 'Bring zuerst die Glieder mit $X$ nach links und die übrigen nach rechts; dabei wechselt das Vorzeichen. ',
  }
}

function orderStep(rng: Rng, ctx: Ctx, cur: string, slips: readonly Slip[]): GuidedStep {
  const f = ordered(ctx.s)
  const right = orderedLatex(ctx, f)
  const combined = xTerms([...ctx.s.lhs, ...ctx.s.rhs]).length > 1
  return choiceStep(rng, {
    id: 'ordnen',
    title: 'Ordnen',
    question: `Bring alle Glieder mit $X$ auf die linke Seite und alle übrigen auf die rechte. Wie lautet die Gleichung dann?\n$${cur}$`,
    correct: math(right),
    wrongs: slips.map((sl) => ({ content: math(orderedLatex(ctx, sl.f)), rule: 'mgl-move-sign' })),
    hint: `Wechselt ein Glied die Seite, wechselt es sein Vorzeichen. Die Matrix bleibt dabei auf ihrer Seite von $X$.${combined ? ' Glieder wie $2X$ und $-X$ fasst du zusammen.' : ''}`,
    explanation: {
      detailed: `Wie bei Gleichungen mit Zahlen: Auf beiden Seiten dasselbe addieren oder abziehen, dann wechselt das Glied die Seite und sein Vorzeichen.${combined ? ' Die Vielfachen von $X$ fasst du zusammen.' : ''} Die Matrix bleibt auf ihrer Seite von $X$, denn Matrizen darf man nicht vertauschen. Damit: $${right}$.`,
      short: `$${right}$.`,
    },
    established: [right],
    cards: [MGL_CARD.aufloesen],
  })
}

// X ausklammern; dabei die Zahl als Vielfaches von E schreiben
function factorStep(rng: Rng, ctx: Ctx, cur: string, slips: readonly Slip[], pre: OrderNote | null): GuidedStep {
  const f = ordered(ctx.s)
  const other: Side = ctx.s.side === 'L' ? 'R' : 'L'
  const right = factoredLatex(ctx, f)
  const noE = factoredLatex(ctx, f, ctx.s.side, '')
  const wrongs: Wrong[] = [
    ...slips.slice(0, 1).map((sl) => ({ content: math(factoredLatex(ctx, sl.f)), rule: 'mgl-move-sign' })),
    ...rng.shuffle<Wrong>([
      { content: math(noE), rule: 'mgl-no-e' },
      { content: math(factoredLatex(ctx, f, other)), rule: 'mgl-factor-side' },
      { content: math(factoredLatex(ctx, f, other, '')), rule: 'mgl-no-e', why: twoWhy('mgl-no-e', 'mgl-factor-side') },
    ]),
  ]
  const p = baseView(ctx).p
  const lead = { neg: false, text: p }
  const chain = `${sumLatex([lead, coefPiece(f.beta, 'X')])} = ${sumLatex([lead, coefPiece(f.beta, ctx.s.side === 'L' ? 'EX' : 'XE')])} = ${withX(ctx.s.side, mParen(ctx, f.beta))}`
  return choiceStep(rng, {
    id: 'ausklammern',
    title: '$X$ ausklammern',
    question: `${pre ? 'Ordne die Gleichung und klammere $X$ aus' : 'Klammere $X$ aus'}. Wie lautet die Gleichung dann?\n$${cur}$`,
    correct: math(right),
    wrongs,
    hint: `${pre?.hint ?? ''}Eine Zahl kann man nicht zu einer Matrix addieren. Schreib die Zahl vor $X$ als Vielfaches der Einheitsmatrix: $X = EX = XE$. Und $X$ bleibt beim Ausklammern auf seiner Seite.`,
    explanation: {
      detailed: `${pre?.text ?? ''}Weil $EX = X$ und $XE = X$ ist, darfst du die Zahl vor $X$ als Vielfaches von $E$ schreiben. Dann lässt sich $X$ ausklammern, und zwar ${ctx.s.side === 'L' ? 'nach rechts, weil es in' : 'nach links, weil es in'} $${p}$ ${ctx.s.side === 'L' ? 'rechts' : 'links'} steht: $${chain}$.`,
      short: `$${chain}$.`,
    },
    established: [right],
    cards: [MGL_CARD.aufloesen],
  })
}

// mit der Inversen malnehmen: X = M⁻¹R bzw. RM⁻¹ (bei (X⁻¹A)⁻¹ mit A, bei AXA⁻¹ von beiden Seiten)
function solveStep(rng: Rng, ctx: Ctx, cur: string, slips: readonly Slip[], param: boolean, pre: OrderNote | null): GuidedStep {
  const { s } = ctx
  const f = ordered(s)
  const a = aName(ctx)
  const other: Side = s.side === 'L' ? 'R' : 'L'
  const rf = rFactor(ctx, f.rt)
  let right: string
  let wrongs: Wrong[]
  let detailed: string
  let hint: string
  const conjLR = s.wrap === 'conj' ? [`${a}^{-1}`, a] : [a, `${a}^{-1}`]
  const render = (g: Form) => (s.wrap === 'conj' || s.wrap === 'conjInv' ? `X = ${conjLR[0]}${rFactor(ctx, g.rt)}${conjLR[1]}` : solvedLatex(ctx, g))
  const slipWrongs = slips.slice(0, 1).map((sl) => ({ content: math(render(sl.f)), rule: 'mgl-move-sign' }))
  // nur das erste Glied der rechten Seite malgenommen
  const restLatex = f.rt
    .slice(1)
    .map((r) => coefPiece(lin(r.k), cName(ctx, r.c, s.tBase[r.c])))
    .map((p) => `${p.neg ? ' - ' : ' + '}${p.text}`)
    .join('')
  const firstR = rLatex(ctx, f.rt.slice(0, 1))
  const partInv = s.wrap === 'inv' ? aName(ctx) : mInv(ctx, f.beta)
  const part: Wrong[] = rSimple(f.rt) ? [] : [{ content: math(`X = ${s.side === 'L' ? `${partInv}${firstR}` : `${firstR}${partInv}`}${restLatex}`), rule: 'mgl-mult-part' }]
  if (s.wrap === 'conj' || s.wrap === 'conjInv') {
    const [l, r] = conjLR
    right = render(f)
    wrongs = [
      ...slipWrongs,
      ...rng.shuffle<Wrong>([
        { content: math(`X = ${rLatex(ctx, f.rt)}`), rule: 'mgl-cancel' },
        { content: math(`X = ${r}${rf}${l}`), rule: 'mgl-mult-side' },
        { content: math(`X = ${l}${rf}${l}`), rule: 'mgl-conj-same' },
      ]),
    ]
    hint = `Nimm von links mit der Inversen der linken Matrix mal und von rechts mit der Inversen der rechten. Kürzen wie bei Zahlen geht nicht, weil Matrizen nicht vertauschbar sind.`
    detailed = `Links neben $X$ steht $${s.wrap === 'conj' ? a : `${a}^{-1}`}$, rechts $${s.wrap === 'conj' ? `${a}^{-1}` : a}$. Von links mit $${l}$ und von rechts mit $${r}$ malnehmen: $${l}\\,${baseView(ctx).p}\\,${r} = EXE = X$. Auf der rechten Seite genauso: $${right}$. Die beiden Matrizen um $X$ heben sich nicht einfach auf, denn $X$ steht zwischen ihnen.`
  } else if (s.wrap === 'inv' && linZero(f.beta)) {
    const pi = `${a}^{-1}`
    right = solvedLatex(ctx, f)
    wrongs = [
      ...slipWrongs,
      ...rng.shuffle<Wrong>([
        { content: math(solvedLatex(ctx, f, other)), rule: 'mgl-mult-side' },
        { content: math(solvedLatex(ctx, f, s.side, pi)), rule: 'mgl-mult-inverse' },
        { content: math(`X = \\frac{${rLatex(ctx, f.rt)}}{${pi}}`), rule: 'inv-divide' },
        ...part,
      ]),
    ]
    hint = `Welche Matrix macht $${pi}$ rückgängig? Mit ihr nimmst du von der Seite mal, auf der $${pi}$ steht.`
    detailed = `$${pi}$ steht ${s.side === 'L' ? 'links' : 'rechts'} von $X$. Rückgängig macht sie $${a}$, denn $${s.side === 'L' ? `${a}${pi}` : `${pi}${a}`} = E$. Also beide Seiten von ${s.side === 'L' ? 'links' : 'rechts'} mit $${a}$ malnehmen: $${right}$.`
  } else {
    const m = mParen(ctx, f.beta)
    const inv = mInv(ctx, f.beta)
    right = solvedLatex(ctx, f)
    const sumWrong: Wrong[] = []
    if (!linZero(f.beta)) {
      // (P + βE)⁻¹ gliedweise: P⁻¹ + 1/β E
      const pinv = ctx.s.wrap === 'tProduct' ? `(${pName(ctx)})^{-1}` : `${pName(ctx)}^{-1}`
      const b = f.beta
      const frac = hasParam(b) && !isZero(b.c0) ? `\\frac{1}{${ratLatex(b.c0)} ${ratSign(b.c1) < 0 ? '-' : '+'} ${isOne(ratAbs(b.c1)) ? '' : ratLatex(ratAbs(b.c1))}${PARAM}}` : null
      const neg = hasParam(b) ? isZero(b.c0) && ratSign(b.c1) < 0 : ratSign(b.c0) < 0
      const den = hasParam(b) ? (isZero(b.c0) ? `${isOne(ratAbs(b.c1)) ? '' : ratLatex(ratAbs(b.c1))}${PARAM}` : '') : ratLatex(ratAbs(b.c0))
      const termE = frac ? ` + ${frac}E` : ` ${neg ? '-' : '+'} ${den === '1' ? '' : `\\frac{1}{${den}}`}E`
      sumWrong.push({ content: math(solvedLatex(ctx, f, s.side, `(${pinv}${termE})`)), rule: 'mgl-inverse-sum' })
    }
    wrongs = [
      ...slipWrongs,
      ...rng.shuffle<Wrong>([
        { content: math(solvedLatex(ctx, f, other)), rule: 'mgl-mult-side' },
        { content: math(`X = \\frac{${rLatex(ctx, f.rt)}}{${mExpr(ctx, f.beta)}}`), rule: 'inv-divide' },
        { content: math(solvedLatex(ctx, f, s.side, m)), rule: 'inv-not-inverted' },
        ...sumWrong,
        ...part,
      ]),
    ]
    hint = `Durch eine Matrix teilen gibt es nicht. Nimm beide Seiten mit der Inversen von $${m}$ mal, und zwar von der Seite, auf der $${m}$ steht.`
    detailed = `$${m}$ steht ${s.side === 'L' ? 'links' : 'rechts'} von $X$. Also beide Seiten von ${s.side === 'L' ? 'links' : 'rechts'} mit $${inv}$ malnehmen${param ? ' (das geht, wenn die Klammer invertierbar ist)' : ''}: $${s.side === 'L' ? `${inv}${m}X = EX = X` : `X${m}${inv} = XE = X`}$. Die ganze andere Seite wird malgenommen: $${right}$.`
  }
  return choiceStep(rng, {
    id: 'malnehmen',
    title: 'Nach $X$ auflösen',
    question: `${pre ? 'Ordne die Gleichung und löse nach $X$ auf' : 'Löse nach $X$ auf'}, noch ohne Zahlen. Wie lautet $X$?\n$${cur}$`,
    correct: math(right),
    wrongs,
    hint: `${pre?.hint ?? ''}${hint}`,
    explanation: { detailed: `${pre?.text ?? ''}${detailed}`, short: `$${right}$.` },
    established: [right],
    cards: [s.wrap === 'none' || s.wrap === 'tWhole' || s.wrap === 'tProduct' ? MGL_CARD.aufloesen : MGL_CARD.umformen],
  })
}

// ------------------------------------------------------------------ Schritte: einsetzen und ausrechnen

// M = P + βE als Zahlen
function bracketStep(rng: Rng, ctx: Ctx, P: Mat, A: Mat, b: Rational, intro: string): GuidedStep {
  const n = P.length
  const right = plusE(P, b)
  const show = (X: Mat) => math(`M = ${matLatex(X)}`)
  const anti = build(n, (i, j) => (i + j === n - 1 ? ratAdd(P[i][j], b) : P[i][j]))
  const cands: [Mat, string][] = [
    [P.map((r) => r.map((x) => ratAdd(x, b))), ratSign(b) < 0 ? 'mat-identity-all' : 'mgl-e-all'],
    [plusE(P, ratNeg(b)), 'mat-plus-minus'],
    [anti, 'mgl-e-anti'],
  ]
  if (ctx.s.wrap === 'tProduct' && !symmetric(A)) cands.push([plusE(A, b), 'mat-transpose-ignored'])
  const wrongs: Wrong[] = []
  for (const [X, rule] of rng.shuffle(cands)) if (!matEq(X, right)) wrongs.push({ content: show(X), rule })
  const bE = sumLatex([{ neg: false, text: pName(ctx) }, coefPiece(lin(b), 'E')])
  // kE wie geschrieben: 3E, -E
  const kE = sumLatex([coefPiece(lin(b), 'E')])
  const tNote = ctx.s.wrap === 'tProduct' ? ` Vorher $${aName(ctx)}$ transponieren: $${pName(ctx)} = ${matLatex(P)}$.` : ''
  return choiceStep(rng, {
    id: 'klammer',
    title: 'Klammer ausrechnen',
    question: `${intro}Wie lautet $M = ${bE}$?`,
    correct: show(right),
    wrongs,
    hint: `$${kE}$ hat $${ratLatex(b)}$ auf der Hauptdiagonale und sonst Nullen.${ctx.s.wrap === 'tProduct' ? ' Transponieren nicht vergessen.' : ''}`,
    explanation: {
      detailed: `$${kE}$ hat $${ratLatex(b)}$ auf der Hauptdiagonale und sonst $0$. Also ändert sich nur die Hauptdiagonale.${tNote} Damit $M = ${bE} = ${matLatex(right)}$.`,
      short: `Nur auf der Hauptdiagonale $${ratLatex(b)}$ dazu: $M = ${matLatex(right)}$.`,
    },
    established: [`M = ${matLatex(right)}`],
    cards: [MGL_CARD.aufloesen, MAT_CARD.rechnen],
  })
}

// rechte Seite ausrechnen (Summe, Vielfache, Transponierte)
function rhsStep(rng: Rng, ctx: Ctx, rt: readonly RTerm[], given: readonly Mat[]): GuidedStep {
  const base = (c: number) => (ctx.s.tBase[c] ? transpose(given[c]) : given[c])
  const terms = rt.map((r) => ({ k: r.k, name: cName(ctx, r.c, ctx.s.tBase[r.c]), M: base(r.c) }))
  const extra = rt.some((r) => ctx.s.tBase[r.c] && !symmetric(given[r.c])) ? [{ M: rt.map((r) => scale(r.k, given[r.c])).reduce(add), rule: 'mat-transpose-ignored' }] : []
  // Rechenzeichen vor dem letzten Glied verwechselt
  if (terms.length > 1) extra.push({ M: terms.map((t, i) => scale(i === terms.length - 1 ? ratNeg(t.k) : t.k, t.M)).reduce(add), rule: 'mat-plus-minus' })
  return combStep(rng, terms, 'rechts', undefined, rng.shuffle(extra))
}

// Bedingung: eindeutig lösbar genau für det M ≠ 0
function conditionStep(rng: Rng, D: Quad, rs: readonly Rational[]): GuidedStep {
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
    title: 'Wann eindeutig lösbar?',
    question: `Es ist $\\det M = ${quadLatex(D, PARAM)}$. Für welche $${PARAM}$ ist die Gleichung eindeutig lösbar?`,
    correct: ne(rs),
    wrongs,
    hint: `Den Schritt „mit $M^{-1}$ malnehmen“ gibt es nur, wenn $M$ invertierbar ist, also bei $\\det M \\ne 0$.`,
    explanation: {
      detailed: `Ist $M$ invertierbar, gibt es genau eine Lösung $X$; das ist genau bei $\\det M \\ne 0$ der Fall. Es ist $${quadLatex(D, PARAM)} = 0$ genau für ${zero}. Für alle anderen $${PARAM}$ ist die Gleichung eindeutig lösbar.`,
      short: `$\\det M = 0$ für ${zero}; sonst eindeutig lösbar.`,
    },
    established: [rs.map((r) => `${PARAM} \\ne ${ratLatex(r)}`).join(',\\; ')],
    cards: [MGL_CARD.parameter],
  })
}

// Inverse von M (2 × 2 mit Formel, 3 × 3 mit Gauß-Jordan); null bei zu wenigen Antworten
// param: Buchstaben der allgemeinen Formel p, q, r, s (a ist der Parameter)
function inverseSteps(rng: Rng, name: string, M: Mat, withDet: boolean, param = false): GuidedStep[] | null {
  if (M.length === 3) {
    if (!jordanOk(M, 48, false)) return null
    const js = jordanSteps(rng, name, M, false)
    if (!js) return null
    const [first, ...rest] = js.steps
    return [{ ...first, question: `Berechne $${name}^{-1}$ mit dem Gauß-Jordan-Verfahren, Start mit $(${name} \\mid E)$. ${first.question}` }, ...rest]
  }
  const out: GuidedStep[] = []
  if (withDet) out.push({ ...detTwoStep(rng, name, M), question: `Wie groß ist $\\det ${name}$?` })
  out.push(param ? inverseStep(rng, name, M, [INV_CARD.formel], '', ['p', 'q', 'r', 's']) : inverseStep(rng, name, M, [INV_CARD.formel]))
  return out
}

// ------------------------------------------------------------------ Bild (Schritt 12c)

// Wirkung von X im Gitter (nur 2 × 2): X macht aus dem Einheitsquadrat das Parallelogramm seiner Spalten, die Gitterlinien
// im Quadrat verzerren sich mit. Probe im Bild: Bei M X = R bringt M die Spalten von X auf die Spalten von R (erst X, dann
// M), bei X M = R bringt X die Spalten von M auf die von R (erst M, dann X). Typischer Fehler: X von der falschen Seite
// ausgerechnet, dann landet das Produkt nicht auf R. probe = null: nur X (bei A X A⁻¹).
export const MGL_SPAN = 12
const MGL_MIN = 0.45
// zwei Pfeile vom Ursprung in dieselbe Richtung liegen übereinander
const overlapping = (ps: readonly (readonly number[])[]) =>
  ps.some((p, i) => ps.some((q, j) => j > i && Math.abs(p[0] * q[1] - p[1] * q[0]) < 1e-9 && p[0] * q[0] + p[1] * q[1] > 0))
export type MglProbe = { readonly M: Mat; readonly mName: string; readonly miName: string; readonly R: Mat; readonly rName: string; readonly rIntro: string; readonly side: Side }
export function mglDrawing(X: Mat, probe: MglProbe | null): VectorDrawing | undefined {
  // nur mit Fläche: Ein X mit det X = 0 quetscht alles auf eine Gerade, dann liegen die Pfeile übereinander
  if (X.length !== 2 || isZero(det(X))) return undefined
  const v = (M: Mat, j: number): number[] => [num(M[0][j]), num(M[1][j])]
  const O = [0, 0]
  const sum = (p: readonly number[], q: readonly number[]) => [p[0] + q[0], p[1] + q[1]]
  const par = (M: Mat) => [O, v(M, 0), sum(v(M, 0), v(M, 1)), v(M, 1)]
  const sq = [O, [1, 0], [1, 1], [0, 1]]
  const img = (p: readonly number[]) => [num(X[0][0]) * p[0] + num(X[0][1]) * p[1], num(X[1][0]) * p[0] + num(X[1][1]) * p[1]]
  const fits = (pts: readonly (readonly number[])[]) => [0, 1].every((c) => Math.max(...pts.map((p) => p[c])) - Math.min(...pts.map((p) => p[c])) <= MGL_SPAN)
  const long = (M: Mat) => [0, 1].every((j) => Math.hypot(...v(M, j)) >= MGL_MIN)
  const mats = probe ? [X, probe.R, ...(probe.side === 'R' ? [probe.M] : [])] : [X]
  // passt die Probe nicht ins Bild (rechte Seite zu groß) oder läge ein Pfeil auf einem anderen (etwa bei einer Spalte
  // (1, 0) in M), zeigt es nur X
  if (probe && (!mats.every(long) || !fits([...sq, ...mats.flatMap(par)]) || overlapping(mats.flatMap((M) => [v(M, 0), v(M, 1)])))) return mglDrawing(X, null)
  if (!mats.every(long) || !fits([...sq, ...mats.flatMap(par)])) return undefined
  // Gitterlinien im Einheitsquadrat (bei 0, 1/2, 1) und ihr Bild unter X
  const grid: DrawSegment[] = [0, 0.5, 1].flatMap((k) => [
    { from: [k, 0], to: [k, 1], color: 'muted' as const, dashed: true },
    { from: [0, k], to: [1, k], color: 'muted' as const, dashed: true },
    { from: img([k, 0]), to: img([k, 1]), color: 'c' as const, dashed: true, phase: 1 },
    { from: img([0, k]), to: img([1, k]), color: 'c' as const, dashed: true, phase: 1 },
  ])
  const polygons: DrawPolygon[] = [
    { points: sq, color: 'muted' },
    { points: par(X), from: sq, color: 'c', phase: 1 },
  ]
  const arrows: DrawArrow[] = [
    { from: O, to: [1, 0], color: 'muted', label: '\\vec e_1', ghost: true },
    { from: O, to: [0, 1], color: 'muted', label: '\\vec e_2', ghost: true },
    { from: O, to: v(X, 0), color: 'a', label: '\\vec x_1', phase: 1 },
    { from: O, to: v(X, 1), color: 'b', label: '\\vec x_2', phase: 1 },
  ]
  const xText = `$X$ macht aus dem Einheitsquadrat (grau) das Parallelogramm seiner Spalten $\\vec x_1$ (blau) und $\\vec x_2$ (orange); die Gitterlinien im Quadrat verzerren sich mit (blaugrün), $\\vec e_1$ wird zu $\\vec x_1$ und $\\vec e_2$ zu $\\vec x_2$.`
  if (!probe) return { ...emptyDrawing(2, xText), polygons, arrows, segments: grid }
  const { M, mName, miName, R, rName, rIntro, side } = probe
  let probeText: string
  if (side === 'L') {
    polygons.push({ points: par(R), from: par(X), color: 'r', phase: 2 })
    arrows.push({ from: O, to: v(R, 0), color: 'r', label: '\\vec r_1', phase: 2 }, { from: O, to: v(R, 1), color: 'r', label: '\\vec r_2', phase: 2 })
    probeText = `Probe: $${mName}X = ${rName}$ heißt, $${mName}$ bringt die Spalten von $X$ auf die Spalten $\\vec r_1$ und $\\vec r_2$ ${rIntro} (violett). Beim Abspielen wirkt erst $X$, dann $${mName}$.`
  } else {
    polygons.push({ points: par(M), color: 'muted', phase: 2 }, { points: par(R), from: par(M), color: 'r', phase: 3 })
    arrows.push(
      { from: O, to: v(M, 0), color: 'muted', label: '\\vec m_1', phase: 2 },
      { from: O, to: v(M, 1), color: 'muted', label: '\\vec m_2', phase: 2 },
      { from: O, to: v(R, 0), color: 'r', label: '\\vec r_1', phase: 3 },
      { from: O, to: v(R, 1), color: 'r', label: '\\vec r_2', phase: 3 },
    )
    probeText = `Probe: $X${mName} = ${rName}$ heißt, $X$ bringt die Spalten $\\vec m_1$ und $\\vec m_2$ von $${mName}$ (grau) auf die Spalten $\\vec r_1$ und $\\vec r_2$ ${rIntro} (violett). Beim Abspielen wirkt erst $${mName}$, dann $X$.`
  }
  const drawing: VectorDrawing = { ...emptyDrawing(2, `${xText} ${probeText}`), polygons, arrows, segments: grid }
  // typischer Fehler: von der falschen Seite mit der Inversen malgenommen
  const Mi = inverse(M)
  if (!Mi) return drawing
  const W = side === 'L' ? mul(R, Mi) : mul(Mi, R)
  const WR = side === 'L' ? mul(M, W) : mul(W, M)
  if (matEq(WR, R) || !long(WR) || !fits([...sq, ...mats.flatMap(par), ...par(WR)]) || overlapping([...mats, WR].flatMap((M) => [v(M, 0), v(M, 1)]))) return drawing
  const wrongX = side === 'L' ? `${rName}${miName}` : `${miName}${rName}`
  const rightX = side === 'L' ? `${miName}${rName}` : `${rName}${miName}`
  const product = side === 'L' ? `${mName}X` : `X${mName}`
  return {
    ...drawing,
    mistake: {
      arrows: [
        { from: O, to: v(WR, 0), color: 'bad' },
        { from: O, to: v(WR, 1), color: 'bad' },
      ],
      segments: [],
      polygons: [{ points: par(WR), color: 'bad' }],
      caption: `${xText} Rot der typische Fehler: $X$ von der falschen Seite ausgerechnet, $X = ${wrongX}$ statt $X = ${rightX}$. Dann landet $${product}$ (rot) nicht auf den Spalten von $${rName}$ (violett): Die Probe geht nicht auf.`,
    },
  }
}

// ------------------------------------------------------------------ Aufbau einer Aufgabe

type Numbers = {
  readonly A: Mat // gegebene Matrix im Glied P (bei Parameter ohne a)
  readonly given: readonly Mat[]
  readonly a0?: Rational
  readonly roots?: readonly Rational[]
}

// Wert der aufgelösten rechten Seite
const rValue = (s: Shape, rt: readonly RTerm[], given: readonly Mat[]) => rt.map((r) => scale(r.k, s.tBase[r.c] ? transpose(given[r.c]) : given[r.c])).reduce(add)

function assemble(rng: Rng, kind: VectorKind, s: Shape, names: readonly string[], nums: Numbers): Built | null {
  const ctx: Ctx = { s, names }
  const f = ordered(s)
  const param = hasParam(f.beta)
  const a = aName(ctx)
  const { A, given } = nums
  const steps: GuidedStep[] = []
  const shown = eqLatex(s, shownView(ctx))
  let cur = shown
  if (s.wrap === 'tProduct' || s.wrap === 'inv' || s.wrap === 'tWhole') {
    steps.push(wrapStep(rng, ctx))
    cur = eqLatex(s, baseView(ctx))
  }
  // Ordnen als eigener Schritt nur mit drei falschen Antworten, sonst im nächsten Schritt mit
  let slips: Slip[] = []
  let orderNote: OrderNote | null = null
  if (needsOrder(s)) {
    const all = moveSlips(s)
    if (all.length >= 3) {
      steps.push(orderStep(rng, ctx, cur, all))
      cur = orderedLatex(ctx, f)
    } else {
      slips = rng.shuffle(all)
      orderNote = orderNoteFor(ctx)
    }
  }
  if (!linZero(f.beta)) {
    steps.push(factorStep(rng, ctx, cur, slips, orderNote))
    orderNote = null
    slips = []
    cur = factoredLatex(ctx, f)
  }
  steps.push(solveStep(rng, ctx, cur, slips, param, orderNote))
  // Zahlen
  const P = s.wrap === 'tProduct' ? transpose(A) : A
  const a0 = nums.a0 ?? ZERO
  const b0 = linAt(f.beta, a0)
  const Rv = rValue(s, f.rt, given)
  let X: Mat
  if (param) {
    const Mp: PMat = P.map((r, i) => r.map((x, j) => (i === j ? lin(ratAdd(x, f.beta.c0), f.beta.c1) : lin(x))))
    const D = polyOf(Mp, det)
    steps.push(detStep(rng, { A: Mp, b: [ZERO, ZERO], n: 2 }, null, 'det-a', [MGL_CARD.parameter, DET_CARD.zwei], 'M'))
    steps.push(conditionStep(rng, D, nums.roots!))
  }
  const named = !linZero(f.beta)
  const rName = rSimple(f.rt) ? rLatex(ctx, f.rt) : 'R'
  const rIntro = rSimple(f.rt) ? `von $${rName}$` : `der rechten Seite $R = ${rLatex(ctx, f.rt)}$`
  let probe: MglProbe | null = null
  if (s.wrap === 'inv') {
    // X = A R bzw. R A
    if (!rSimple(f.rt)) steps.push(rhsStep(rng, ctx, f.rt, given))
    const rn = rSimple(f.rt) ? rLatex(ctx, f.rt) : rFactor(ctx, f.rt)
    const Ai = inverse(A)!
    X = s.side === 'L' ? mul(A, Rv) : mul(Rv, A)
    probe = { M: inverse(A)!, mName: `${a}^{-1}`, miName: a, R: Rv, rName, rIntro, side: s.side }
    const other = s.side === 'L' ? mul(Rv, A) : mul(A, Rv)
    const wrongInv = s.side === 'L' ? mul(Ai, Rv) : mul(Rv, Ai)
    const extra = [
      { M: other, rule: 'mgl-mult-side' },
      { M: wrongInv, rule: 'mgl-mult-inverse' },
    ]
    steps.push(s.side === 'L' ? productStepQ(rng, A, Rv, `${a}${rn}`, extra) : productStepQ(rng, Rv, A, `${rn}${a}`, extra))
  } else if (s.wrap === 'conj' || s.wrap === 'conjInv') {
    if (!rSimple(f.rt)) steps.push(rhsStep(rng, ctx, f.rt, given))
    const inv = inverseSteps(rng, a, A, true)
    if (!inv) return null
    steps.push(...inv)
    const Ai = inverse(A)!
    const [L, Rm] = s.wrap === 'conj' ? [Ai, A] : [A, Ai]
    const [ln, rn] = s.wrap === 'conj' ? [`${a}^{-1}`, a] : [a, `${a}^{-1}`]
    const rf = rFactor(ctx, f.rt)
    const first = mul(L, Rv)
    X = mul(first, Rm)
    steps.push(productStepQ(rng, L, Rv, `${ln}${rf}`, [{ M: mul(Rv, L), rule: 'mgl-mult-side' }]))
    steps.push(productStepQ(rng, first, Rm, `${ln}${rf}${rn}`, [{ M: mul(first, L), rule: 'mgl-conj-same' }], 'produkt-2'))
  } else {
    const M = plusE(P, b0)
    if (isZero(det(M))) return null
    let mName = a
    if (named) {
      const intro = param ? `Setze $${PARAM} = ${ratLatex(a0)}$ ein. ` : ''
      steps.push(bracketStep(rng, ctx, P, A, b0, intro))
      mName = 'M'
    } else if (s.wrap === 'tProduct') return null
    if (!rSimple(f.rt)) steps.push(rhsStep(rng, ctx, f.rt, given))
    const inv = inverseSteps(rng, mName, M, !param, param)
    if (!inv) return null
    steps.push(...inv)
    const Mi = inverse(M)!
    X = s.side === 'L' ? mul(Mi, Rv) : mul(Rv, Mi)
    probe = { M, mName, miName: `${mName}^{-1}`, R: Rv, rName, rIntro, side: s.side }
    const rn = rSimple(f.rt) ? rLatex(ctx, f.rt) : rFactor(ctx, f.rt)
    const extra = [
      { M: s.side === 'L' ? mul(Rv, Mi) : mul(Mi, Rv), rule: 'mgl-mult-side' },
      { M: s.side === 'L' ? mul(M, Rv) : mul(Rv, M), rule: 'inv-not-inverted' },
    ]
    const mi = `${mName}^{-1}`
    steps.push(s.side === 'L' ? productStepQ(rng, Mi, Rv, `${mi}${rn}`, extra) : productStepQ(rng, Rv, Mi, `${rn}${mi}`, extra))
  }
  if (X.flat().every(isZero) || X.flat().some((v) => !isInteger(v)) || maxAbs(X) > 40) return null
  // (X⁻¹A)⁻¹ ist nur erklärt, wenn X invertierbar ist
  if (s.wrap === 'inv' && isZero(det(X))) return null
  // Angabe: Gleichung, darunter die Matrizen
  const mats = [{ latex: `${a} = ${matLatex(A)}`, cols: s.n }, ...given.map((G, c) => ({ latex: `${names[1 + c]} = ${matLatex(G)}`, cols: s.n }))]
  const cards = [MGL_CARD.aufloesen, ...(s.wrap === 'none' ? [] : [MGL_CARD.umformen]), ...(param ? [MGL_CARD.parameter] : [])]
  const terms = [...s.lhs.map((t) => [0, t] as const), ...s.rhs.map((t) => [1, t] as const)].flatMap(([side, t]) =>
    t.t === 'P' ? [side, 0, 0, 0, 0] : t.t === 'x' ? [side, 1, num(t.k.c0), num(t.k.c1), 0] : [side, 2, num(t.k), 0, t.c],
  )
  const sig = (ts: readonly Term[]) => ts.map((t) => (t.t === 'P' ? 'P' : t.t === 'x' ? `x${hasParam(t.k) ? 'a' : Math.sign(num(t.k.c0))}` : `c${num(t.k)}${s.tBase[t.c] ? 't' : ''}`)).join('')
  const jordan = steps.some((x) => x.id === 'ablesen')
  return {
    kind,
    instruction: param
      ? `Für welche $${PARAM}$ ist die Gleichung eindeutig lösbar? Löse sie allgemein nach $X$ auf und rechne $X$ für $${PARAM} = ${ratLatex(a0)}$ aus.`
      : `Löse die Gleichung zuerst allgemein nach $X$ auf. Setze dann die Matrizen ein und rechne $X$ aus.${jordan ? ' Die Inverse bestimmst du mit dem Gauß-Jordan-Verfahren.' : ''}`,
    functionLatex: `\\begin{array}{c} ${shown} \\\\[12pt] ${arrange(mats)} \\end{array}`,
    steps,
    cards,
    resultLatex: `X = ${matLatex(X)}`,
    ...(() => {
      const d = mglDrawing(X, probe)
      return d ? { resultDrawing: d } : {}
    })(),
    form: `${kind}|${s.n}|${s.wrap}|${s.side}|${s.flip ? 'f' : ''}|${sig(s.lhs)}=${sig(s.rhs)}|${a}|${param ? num(a0) : num(b0)}|${negCount(A)}|${negCount(X)}|${steps.length}`,
    data: {
      shape: [s.n, s.side === 'L' ? 0 : 1, WRAP_CODE[s.wrap], s.flip ? 1 : 0],
      terms,
      tBase: s.tBase.map(Number),
      A: A.flat().map(num),
      ...Object.fromEntries(given.map((G, c) => [`C${c}`, G.flat().map(num)])),
      ...(param ? { a0: [num(a0)], roots: nums.roots!.map(num) } : {}),
    },
    answer: X.flat().map(num),
  }
}

// ------------------------------------------------------------------ Zahlen

const x = (k: number): Term => ({ t: 'x', k: lin(R(k)) })
const xa = (s: number, c0 = 0): Term => ({ t: 'x', k: lin(R(c0), R(s)) })
const c = (k: number, i: number): Term => ({ t: 'c', k: R(k), c: i })
const P: Term = { t: 'P' }

// Glieder einer Seite mischen; P steht meist vorn
function arrangeSide(rng: Rng, ts: readonly Term[]): Term[] {
  const out = rng.shuffle([...ts])
  const p = out.findIndex((t) => t.t === 'P')
  if (p > 0 && rng.chance(0.6)) out.unshift(...out.splice(p, 1))
  return out
}
// rechts: die erste gegebene Matrix mit +1 vorn (die rechte Seite beginnt mit ihr)
function arrangeRight(rng: Rng, ts: readonly Term[]): Term[] {
  const out = rng.shuffle([...ts])
  const first = out.findIndex((t) => t.t === 'c' && isOne(t.k))
  const firstC = out.findIndex((t) => t.t === 'c')
  if (first > firstC && firstC >= 0) [out[first], out[firstC]] = [out[firstC], out[first]]
  return out
}

// gegebene Matrizen so, dass die aufgelöste rechte Seite R ergibt (die erste mit Faktor 1 wird ausgerechnet)
function split(rng: Rng, s: Shape, rt: readonly RTerm[], Rv: Mat, count: number): Mat[] | null {
  const base: (Mat | null)[] = Array.from({ length: count }, () => null)
  const fixed = rt.findIndex((r) => isOne(ratAbs(r.k)))
  let rest = Rv
  rt.forEach((r, i) => {
    if (i === fixed) return
    const V = randMat(rng, s.n, -4, 5, rng.int(0, 2))
    base[r.c] = V
    rest = add(rest, scale(ratNeg(r.k), V))
  })
  base[rt[fixed].c] = scale(ratDiv(ONE, rt[fixed].k), rest)
  if (base.some((V) => !V || maxAbs(V) > 12 || V.flat().every(isZero))) return null
  return base.map((V, i) => (s.tBase[i] ? transpose(V!) : V!))
}

// Koeffizient M mit kleiner Determinante und glatter Inverse
function coefMatrix(rng: Rng, n: 2 | 3, level: Level): Mat | null {
  const M = randMat(rng, n, -3, 4, n === 3 ? rng.int(1, 3) : rng.int(0, 1))
  const D = Math.abs(num(det(M)))
  if (D === 0) return null
  if (n === 2 && D > (level <= 1 ? 2 : level <= 3 ? 5 : 7)) return null
  if (n === 3 && (D > 4 || maxDen(inverse(M)!) > 4)) return null
  return M
}

// Zahlen für die Arten ohne (X⁻¹A)⁻¹ und AXA⁻¹: erst M und X, dann A = M − βE und die gegebenen Matrizen
function numbersFor(rng: Rng, s: Shape, level: Level): Numbers | null {
  const f = ordered(s)
  const count = constTerms([...s.lhs, ...s.rhs]).length
  if (s.wrap === 'inv' || s.wrap === 'conj' || s.wrap === 'conjInv') {
    const A = s.wrap === 'inv' ? randMat(rng, s.n, -3, 4, rng.int(0, s.n === 3 ? 3 : 1)) : unimodular(rng, 2)
    if (isZero(det(A)) || maxAbs(A) > 6 || A.flat().filter(isZero).length > (s.n === 3 ? 3 : 1)) return null
    const given = Array.from({ length: count }, (_, i) => {
      const G = randMat(rng, s.n, -3, 4, rng.int(0, 2))
      return s.tBase[i] ? transpose(G) : G
    })
    return { A, given }
  }
  if (hasParam(f.beta)) {
    // A mit ganzzahligen Eigenwerten: det(A + (c₀ + s·a)E) = 0 genau für ganze a
    const [l1, l2] = [R(rng.int(-3, 4)), R(rng.int(-3, 4))]
    let A: Mat
    if (rng.chance(0.4)) {
      const off = R(nonzero(rng, -3, 3))
      A = rng.chance(0.5) ? [[l1, off], [ZERO, l2]] : [[l1, ZERO], [off, l2]]
    } else {
      const U = unimodular(rng, 2)
      A = mul(mul(U, [[l1, ZERO], [ZERO, l2]]), inverse(U)!)
    }
    if (maxAbs(A) > 8 || A.flat().filter(isZero).length > 1) return null
    const Pm = s.wrap === 'tProduct' ? transpose(A) : A
    const Mp: PMat = Pm.map((r, i) => r.map((v, j) => (i === j ? lin(ratAdd(v, f.beta.c0), f.beta.c1) : lin(v))))
    const rs = roots(polyOf(Mp, det))
    if (!rs || rs.some((r) => !isInteger(r) || Math.abs(num(r)) > 8)) return null
    const choices = [-2, -1, 0, 1, 2, 3].filter((v) => !rs.some((r) => ratEq(r, R(v))))
    const a0 = R(rng.pick(choices))
    const M = plusE(Pm, linAt(f.beta, a0))
    const D = Math.abs(num(det(M)))
    if (D === 0 || D > 6) return null
    const X = randMat(rng, 2, -3, 4, rng.int(0, 1))
    const Rv = s.side === 'L' ? mul(M, X) : mul(X, M)
    if (maxAbs(Rv) > 30) return null
    const given = split(rng, s, f.rt, Rv, count)
    return given ? { A, given, a0, roots: rs } : null
  }
  const M = coefMatrix(rng, s.n, level)
  if (!M) return null
  const b = f.beta.c0
  const Pm = plusE(M, ratNeg(b))
  const A = s.wrap === 'tProduct' ? transpose(Pm) : Pm
  if (maxAbs(A) > 8 || A.flat().filter(isZero).length > (s.n === 3 ? 3 : 1)) return null
  if (s.wrap === 'tProduct' && symmetric(A)) return null
  const X = randMat(rng, s.n, -3, 4, rng.int(0, s.n === 3 ? 3 : 1))
  const Rv = s.side === 'L' ? mul(M, X) : mul(X, M)
  if (maxAbs(Rv) > 30) return null
  const given = split(rng, s, f.rt, Rv, count)
  return given ? { A, given } : null
}

// ------------------------------------------------------------------ Formen je Art und Stufe

const side = (rng: Rng): Side => (rng.chance(0.5) ? 'L' : 'R')
const smallK = (rng: Rng, ks: readonly number[] = [1, -1, 2, -2, 3, -3]) => rng.pick(ks)

function shape(rng: Rng, n: 2 | 3, wrap: Wrap, lhs: readonly Term[], rhs: readonly Term[], tBase: readonly boolean[] = [], flip = false): Shape {
  const count = constTerms([...lhs, ...rhs]).length
  return { n, side: side(rng), wrap, lhs: arrangeSide(rng, lhs), rhs: arrangeRight(rng, rhs), flip, tBase: Array.from({ length: count }, (_, i) => tBase[i] ?? false) }
}

// β nicht 0 und klein
const betaOk = (s: Shape) => {
  const b = ordered(s).beta
  return hasParam(b) || (!isZero(b.c0) && Math.abs(num(b.c0)) <= 4)
}

function basicShape(rng: Rng, level: Level): Shape {
  const r = rng.next()
  if (level <= 1) return r < 0.45 ? shape(rng, 2, 'none', [P], [c(1, 0)], [], rng.chance(0.4)) : shape(rng, 2, 'none', [P, c(1, 1)], [c(1, 0)], [], rng.chance(0.25))
  if (r < 0.2) return shape(rng, 2, 'none', [P], [c(1, 0)], [], rng.chance(0.4))
  if (r < 0.6) return shape(rng, 2, 'none', [P, c(rng.pick([1, 1, 2]), 1)], [c(1, 0)], [], rng.chance(0.3))
  return shape(rng, 2, 'none', [P], [c(1, 0), c(rng.pick([-1, -1, -2]), 1)], [], rng.chance(0.3))
}

function factorShape(rng: Rng, level: Level): Shape {
  if (level <= 2) {
    const k = smallK(rng)
    const lhs = rng.chance(0.5) ? [P, x(k)] : [P]
    const rhs = lhs.length === 2 ? [c(1, 0)] : [x(k), c(1, 0)]
    return rng.chance(0.3) ? shape(rng, 2, 'none', [...lhs, c(1, 1)], rhs) : shape(rng, 2, 'none', lhs, rhs, [], lhs.length === 2 && rng.chance(0.3))
  }
  const n: 2 | 3 = level >= 5 ? (rng.chance(0.5) ? 3 : 2) : level === 4 && rng.chance(0.4) ? 3 : 2
  const [k1, k2] = [smallK(rng), smallK(rng, [1, -1, 2, -2])]
  if (level === 3) {
    return rng.chance(0.7) ? shape(rng, 2, 'none', [P, x(k1), c(1, 1)], [x(k2), c(1, 0)]) : shape(rng, 2, 'none', [P, x(k1)], [c(1, 0), x(k2), c(-1, 1)])
  }
  const k3 = rng.pick([1, 2, 1])
  const t = level >= 5 && rng.chance(0.5)
  const variants: (() => Shape)[] = [
    () => shape(rng, n, 'none', [P, x(k1), c(k3, 1)], [x(k2), c(1, 0)], [false, t]),
    () => shape(rng, n, 'none', [x(k1), P, c(1, 1)], [c(1, 0), x(k2)], [t, false]),
    () => shape(rng, n, 'none', [P, c(1, 1)], [x(k1), c(1, 0), c(-1, 2)], [false, false, t]),
  ]
  return rng.pick(variants)()
}

function wrapShape(rng: Rng, level: Level): Shape {
  const k = smallK(rng)
  if (level <= 3) {
    if (rng.chance(0.5)) return rng.chance(0.5) ? shape(rng, 2, 'tProduct', [P, x(k)], [c(1, 0)]) : shape(rng, 2, 'tProduct', [P], [x(k), c(1, 0)])
    return rng.chance(0.5) ? shape(rng, 2, 'inv', [P], [c(1, 0)], [], rng.chance(0.3)) : shape(rng, 2, 'inv', [P, c(1, 1)], [c(1, 0)])
  }
  const r = rng.next()
  if (level === 4) {
    if (r < 0.34) return shape(rng, 2, 'tProduct', [P, x(k), c(1, 1)], [x(smallK(rng, [1, -1, 2])), c(1, 0)])
    if (r < 0.67) return rng.chance(0.5) ? shape(rng, rng.chance(0.4) ? 3 : 2, 'inv', [P, c(1, 1)], [c(1, 0)]) : shape(rng, 2, 'inv', [P], [c(1, 0), c(-1, 1)])
    return shape(rng, 2, rng.chance(0.5) ? 'conj' : 'conjInv', rng.chance(0.5) ? [P] : [P, c(1, 1)], [c(1, 0)])
  }
  if (r < 0.4) {
    const t = [rng.chance(0.5), rng.chance(0.5)]
    return rng.chance(0.5)
      ? shape(rng, rng.chance(0.4) ? 3 : 2, 'tWhole', [P, x(k)], [c(1, 0), c(-1, 1)], t)
      : shape(rng, rng.chance(0.4) ? 3 : 2, 'tWhole', [P, c(1, 1)], [x(k), c(1, 0)], t)
  }
  if (r < 0.6) return shape(rng, 2, rng.chance(0.5) ? 'conj' : 'conjInv', [P, c(1, 1)], [c(1, 0)], [false, rng.chance(0.5)])
  if (r < 0.8) return shape(rng, 3, 'tProduct', [P, x(k)], [c(1, 0), c(-1, 1)])
  return shape(rng, 3, 'inv', [P, c(1, 1)], [c(1, 0)], [rng.chance(0.5)])
}

function paramShape(rng: Rng, level: Level): Shape {
  const s = rng.pick([1, -1])
  if (level <= 4) {
    return rng.chance(0.5)
      ? shape(rng, 2, 'none', rng.chance(0.4) ? [P, c(1, 1)] : [P], [xa(s), c(1, 0)])
      : shape(rng, 2, 'none', [P, xa(s)], [c(1, 0)], [], rng.chance(0.3))
  }
  const k = smallK(rng, [1, -1, 2, -2])
  if (rng.chance(0.35)) return shape(rng, 2, 'tWhole', [P, xa(s)], [c(1, 0), c(-1, 1)], [rng.chance(0.5), rng.chance(0.5)])
  return rng.chance(0.5) ? shape(rng, 2, 'none', [P, x(k), c(1, 1)], [xa(s), c(1, 0)], [false, rng.chance(0.4)]) : shape(rng, 2, 'none', [P, xa(s)], [x(k), c(1, 0), c(-1, 1)], [false, false, rng.chance(0.4)])
}

// Namen: Matrix im Glied P zuerst, dann die gegebenen
const namesFor = (rng: Rng) => rng.pick(LETTERS)

// Form taugt: X-Glieder heben sich nicht auf (außer ganz ohne), eine einzelne gegebene Matrix nie transponiert (sonst
// wäre die rechte Seite nur „Transponieren“)
function shapeOk(s: Shape): boolean {
  const noX = xTerms([...s.lhs, ...s.rhs]).length === 0
  if (!noX && !betaOk(s)) return false
  return !(ordered(s).rt.length === 1 && s.tBase.some(Boolean))
}

// für Tests: wie oft eine Form ohne passende Zahlen verworfen wurde (soll nie vorkommen, sonst verschiebt sich die Mischung)
export const MGL_DISCARDED = { count: 0 }

// Form vor den Versuchen festlegen (sonst überwiegen die leichter zu bauenden), dann Zahlen suchen, bis jeder Schritt
// drei falsche Antworten hat
function buildKind(rng: Rng, level: Level, kind: Extract<VectorKind, `mgl${string}`>, make: () => Shape): Built {
  for (let outer = 0; outer < 40; outer++) {
    let s = make()
    while (!shapeOk(s)) s = make()
    for (let k = 0; k < 300; k++) {
      const nums = numbersFor(rng, s, level)
      const built = nums && assemble(rng, kind, s, namesFor(rng), nums)
      if (built && built.steps.every((st) => st.choices.length >= 4)) return built
    }
    MGL_DISCARDED.count++
  }
  throw new Error('Matrizengleichungen: keine Aufgabe mit genug Antworten gefunden')
}

export const MGL_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['mglBasic'],
  2: ['mglBasic', 'mglFactor'],
  3: ['mglFactor', 'mglWrap'],
  4: ['mglFactor', 'mglWrap', 'mglParam'],
  5: ['mglFactor', 'mglWrap', 'mglParam'],
}

export const MGL_BUILDERS: Readonly<Record<Extract<VectorKind, `mgl${string}`>, (rng: Rng, level: Level) => Built>> = {
  mglBasic: (rng, level) => buildKind(rng, level, 'mglBasic', () => basicShape(rng, level)),
  mglFactor: (rng, level) => buildKind(rng, level, 'mglFactor', () => factorShape(rng, level)),
  mglWrap: (rng, level) => buildKind(rng, level, 'mglWrap', () => wrapShape(rng, level)),
  mglParam: (rng, level) => buildKind(rng, level, 'mglParam', () => paramShape(rng, level)),
}
