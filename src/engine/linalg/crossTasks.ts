import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type DrawAngle, type DrawArrow, type DrawPoint, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, CARD, LENGTH_POOLS, PARAMS, VEC_LETTERS, choiceStep, connectStep, ints, math, negCount, nums, signShape, zeroCount } from './taskKit.ts'
import {
  type Surd,
  type Vec,
  arrowName,
  columnLatex,
  pointLatex,
  ratLatex,
  sqrtRat,
  surdLatex,
  surdValue,
  surdVecLatex,
  vec,
  vecAdd,
  vecDot,
  vecIsZero,
  vecLatex,
  vecName,
  vecNeg,
  vecNorm2,
  vecScale,
  vecSub,
} from './vec.ts'

// Baukasten für den Baustein „Kreuzprodukt und Fläche" der Tätigkeit „Vektoren" (M7 Schritt 4a, docs/PLAN-M7.md):
// Kreuzprodukt mit dem Schema (Hilfszeilen), Fläche von Parallelogramm und Dreieck, Normalenvektor (auch auf Länge 1 oder
// eine gegebene Länge gebracht, zwei Lösungen), Abstand eines Punktes von einer Geraden, parallel mit Parameter, Fläche
// mit Parameter (gegeben oder am kleinsten). Alles exakt (vec.ts). Bilder im Raum zum Drehen: Parallelogramm bzw.
// Dreieck, beim „Abspielen" wächst die Normale bis zur Länge der Fläche.

export const CROSS_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['cross', 'crossArea'],
  2: ['cross', 'crossArea', 'crossNormal'],
  3: ['crossArea', 'crossNormal', 'crossDistance'],
  4: ['crossParallel', 'crossAreaParam', 'crossNormal'],
  5: ['crossAreaParam', 'crossNormal', 'crossDistance'],
}

// ------------------------------------------------------------------ Rechnen

const num = (r: Rational) => Number(r.n) / Number(r.d)
const m = ratMul
const s = ratSub

// Kreuzprodukt und die typischen Fehler, alle bilinear in a und b (gilt deshalb auch mit Parameter, siehe paramCross)
type CrossFn = (a: Vec, b: Vec) => Vec
export const cross: CrossFn = (a, b) => [s(m(a[1], b[2]), m(a[2], b[1])), s(m(a[2], b[0]), m(a[0], b[2])), s(m(a[0], b[1]), m(a[1], b[0]))]
// mittlere Komponente mit falschem Vorzeichen: a1 b3 − a3 b1
const middleSign: CrossFn = (a, b) => cross(a, b).map((x, i) => (i === 1 ? ratNeg(x) : x))
// Reihenfolge vertauscht: b × a
const orderSwap: CrossFn = (a, b) => vecNeg(cross(a, b))
// Plus statt Minus im Schema
const plusCross: CrossFn = (a, b) => [ratAdd(m(a[1], b[2]), m(a[2], b[1])), ratAdd(m(a[2], b[0]), m(a[0], b[2])), ratAdd(m(a[0], b[1]), m(a[1], b[0]))]
// falsche Zeile abgedeckt: jede Komponente mit der Rechnung einer anderen
const rowsCross: CrossFn = (a, b) => {
  const c = cross(a, b)
  return [c[2], c[0], c[1]]
}
// Einträge an derselben Stelle malgenommen
const entrywise: CrossFn = (a, b) => a.map((x, i) => m(x, b[i]))

const unit = (j: number): Vec => vec(...[0, 1, 2].map((i) => (i === j ? 1 : 0)))
const isParallel = (a: Vec, b: Vec) => vecIsZero(cross(a, b))

// Vektor mit Parameter: base + t · slope (Einträge linear in t)
type PVec = { readonly base: Vec; readonly slope: Vec }
const pAt = (p: PVec, t: Rational): Vec => vecAdd(p.base, vecScale(t, p.slope))

// Kreuzprodukt (oder ein Fehler davon), wenn einer der beiden Vektoren einen Parameter an der Stelle j hat
function paramCross(f: CrossFn, a: Vec, b: Vec, j: number, inA: boolean): PVec {
  const e = unit(j)
  return inA ? { base: f(a, b), slope: f(e, b) } : { base: f(a, b), slope: f(a, e) }
}

// |base + t slope|² = q2 t² + q1 t + q0
type Quad = { readonly q2: Rational; readonly q1: Rational; readonly q0: Rational }
const normQuad = (p: PVec): Quad => ({ q2: vecNorm2(p.slope), q1: m(rat(2), vecDot(p.base, p.slope)), q0: vecNorm2(p.base) })
const quadAt = (q: Quad, t: Rational) => ratAdd(ratAdd(m(q.q2, m(t, t)), m(q.q1, t)), q.q0)

// ------------------------------------------------------------------ LaTeX

const factor = (x: string) => (x.startsWith('-') ? `(${x})` : x)
// Summe von Termen mit Koeffizient: [Koeffizient, Buchstabe] (Buchstabe leer: Zahl)
function termsLatex(terms: readonly (readonly [Rational, string])[]): string {
  const parts = terms.filter(([c]) => !isZero(c))
  if (parts.length === 0) return '0'
  return parts
    .map(([c, x], i) => {
      const abs = ratAbs(c)
      const body = x === '' ? ratLatex(abs) : abs.n === 1n && abs.d === 1n ? x : `${ratLatex(abs)}${x.startsWith('\\') ? ' ' : ''}${x}`
      const neg = ratSign(c) < 0
      return i === 0 ? `${neg ? '-' : ''}${body}` : ` ${neg ? '-' : '+'} ${body}`
    })
    .join('')
}
// Eintrag linear im Parameter: 3t - 2 (der Parameter zuerst)
const linLatex = (c0: Rational, c1: Rational, t: string) => termsLatex([[c1, t], [c0, '']])
const pvecLatex = (p: PVec, t: string) => columnLatex(p.base.map((x, i) => linLatex(x, p.slope[i], t)))
const quadLatex = (q: Quad, t: string) => termsLatex([[q.q2, `${t}^2`], [q.q1, t], [q.q0, '']])
// Vektor mit Parameter an der Stelle j (dort steht nur der Buchstabe)
const withParamLatex = (v: Vec, j: number, t: string) => columnLatex(v.map((x, i) => (i === j ? t : ratLatex(x))))

// Schema mit Hilfszeilen: a und b nebeneinander, die ersten beiden Zeilen noch einmal darunter
const schemaLatex = (a: readonly string[], b: readonly string[]) =>
  `\\begin{array}{rr} ${[0, 1, 2].map((i) => `${a[i]} & ${b[i]}`).join(' \\\\ ')} \\\\ \\hline ${[0, 1].map((i) => `${a[i]} & ${b[i]}`).join(' \\\\ ')} \\end{array}`
// Rechnung je Komponente über Kreuz: a_p · b_q − a_q · b_p
const crossTerms = (a: readonly string[], b: readonly string[]) =>
  columnLatex([0, 1, 2].map((i) => {
    const [p, q] = [(i + 1) % 3, (i + 2) % 3]
    return `${factor(a[p])} \\cdot ${factor(b[q])} - ${factor(a[q])} \\cdot ${factor(b[p])}`
  }))
const squares = (v: Vec) => v.map((x) => (x.d === 1n && ratSign(x) >= 0 ? `${ratLatex(x)}^2` : `\\left(${ratLatex(x)}\\right)^2`)).join(' + ')
const half = (x: Surd): Surd => ({ coef: ratDiv(x.coef, rat(2)), rad: x.rad })
const lengthOf = (v: Vec) => sqrtRat(vecNorm2(v))
// Kette ohne doppeltes Glied
const chain = (...parts: readonly string[]) => parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(' = ')
const rootChain = (v: Vec) => chain(`\\sqrt{${squares(v)}}`, `\\sqrt{${ratLatex(vecNorm2(v))}}`, surdLatex(lengthOf(v)))

// ------------------------------------------------------------------ Schritte

// a × b in einem Schritt; das Schema mit Hilfszeilen steht in der Erklärung. Mit Parameter (param) ohne „Reihenfolge
// vertauscht": −(a × b) ist bei Fläche und Parallelität gleich viel wert.
type Param = { readonly j: number; readonly inA: boolean; readonly t: string }
function crossStep(rng: Rng, an: string, bn: string, a: Vec, b: Vec, param?: Param, id = 'kreuz'): GuidedStep {
  const name = `${an} \\times ${bn}`
  const show = (p: PVec) => math(`${name} = ${param ? pvecLatex(p, param.t) : vecLatex(p.base)}`)
  const of = (f: CrossFn): PVec => (param ? paramCross(f, a, b, param.j, param.inA) : { base: f(a, b), slope: vec(0, 0, 0) })
  const others: Wrong[] = [
    ...(param ? [] : [{ content: show(of(orderSwap)), rule: 'vec-cross-order' }]),
    { content: show(of(plusCross)), rule: 'vec-cross-plus' },
    { content: show(of(rowsCross)), rule: 'vec-cross-rows' },
    { content: show(of(entrywise)), rule: 'vec-cross-entrywise' },
  ]
  const wrongs: Wrong[] = [{ content: show(of(middleSign)), rule: 'vec-cross-middle-sign' }, ...rng.shuffle(others)]
  const sa = a.map((x, i) => (param?.inA && i === param.j ? param.t : ratLatex(x)))
  const sb = b.map((x, i) => (param && !param.inA && i === param.j ? param.t : ratLatex(x)))
  const c = of(cross)
  const result = param ? pvecLatex(c, param.t) : vecLatex(c.base)
  const formula = `${name} = ${crossTerms(sa, sb)} = ${result}`
  const probe = param ? '' : ` Probe: $(${name}) \\cdot ${an} = 0$ und $(${name}) \\cdot ${bn} = 0$, das Ergebnis steht senkrecht auf beiden.`
  return choiceStep(rng, {
    id,
    title: 'Kreuzprodukt',
    question: `Wie lautet $${name}$?`,
    correct: show(c),
    wrongs,
    hint: 'Schreib beide Vektoren nebeneinander und die ersten beiden Zeilen noch einmal darunter. Für jede Komponente deckst du ihre Zeile ab und rechnest mit den zwei Zeilen darunter über Kreuz: links oben mal rechts unten minus rechts oben mal links unten.',
    explanation: {
      detailed: `Schema mit Hilfszeilen: $${schemaLatex(sa, sb)}$. Für jede Komponente deckst du ihre Zeile ab und rechnest mit den zwei Zeilen darunter über Kreuz: $${formula}$.${probe}`,
      short: `$${formula}$.`,
    },
    established: [formula],
    cards: [CARD.kreuz],
  })
}

// b × a aus a × b: nur das Vorzeichen dreht sich
function swapStep(rng: Rng, an: string, bn: string, a: Vec, b: Vec): GuidedStep {
  const c = cross(a, b)
  const name = `${bn} \\times ${an}`
  const line = (v: Vec) => math(`${name} = ${vecLatex(v)}`)
  const wrongs: Wrong[] = [
    { content: line(c), rule: 'vec-cross-order' },
    { content: line(c.map((x, i) => (i === 1 ? x : ratNeg(x)))), rule: 'vec-cross-middle-sign' },
    { content: line(entrywise(b, a)), rule: 'vec-cross-entrywise' },
  ]
  const formula = `${name} = -(${an} \\times ${bn}) = ${vecLatex(vecNeg(c))}`
  return choiceStep(rng, {
    id: 'vertauscht',
    title: 'Reihenfolge vertauscht',
    question: `Wie lautet $${name}$?`,
    correct: line(vecNeg(c)),
    wrongs,
    hint: 'Beim Kreuzprodukt zählt die Reihenfolge. Vertauschst du die Vektoren, zeigt das Ergebnis in die Gegenrichtung.',
    explanation: {
      detailed: `Im Schema tauschen die beiden Spalten den Platz, also wird jede Komponente zu „rechts oben mal links unten minus …": Jedes Vorzeichen dreht sich. $${formula}$. Rechte-Hand-Regel: Mit Daumen $${bn}$ und Zeigefinger $${an}$ zeigt der Mittelfinger in die Gegenrichtung von $${an} \\times ${bn}$.`,
      short: `$${formula}$.`,
    },
    established: [formula],
    cards: [CARD.kreuz],
  })
}

// Länge eines Vektors (mit Name)
function normStep(rng: Rng, name: string, v: Vec, id = 'laenge', card: string = CARD.flaeche): GuidedStep {
  const line = (x: string) => math(`${name} = ${x}`)
  const n2 = vecNorm2(v)
  const wrongs: Wrong[] = [
    { content: line(ratLatex(n2)), rule: 'vec-length-no-root' },
    { content: line(ratLatex(v.reduce((acc, x) => ratAdd(acc, ratAbs(x)), rat(0)))), rule: 'vec-length-abs-sum' },
  ]
  const signed = v.reduce((acc, x) => ratAdd(acc, ratSign(x) < 0 ? ratNeg(m(x, x)) : m(x, x)), rat(0))
  if (negCount(v) > 0 && ratSign(signed) > 0) wrongs.push({ content: line(surdLatex(sqrtRat(signed))), rule: 'vec-square-sign' })
  const formula = `${name} = ${rootChain(v)}`
  return choiceStep(rng, {
    id,
    title: 'Länge',
    question: `Wie groß ist $${name}$?`,
    correct: line(surdLatex(sqrtRat(n2))),
    wrongs,
    hint: 'Einträge quadrieren, addieren, Wurzel ziehen.',
    explanation: { detailed: `Pythagoras: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [card, CARD.laenge],
  })
}

type Shape = 'par' | 'tri'
const SHAPE_NAME: Readonly<Record<Shape, string>> = { par: 'Parallelogramms', tri: 'Dreiecks' }

// Fläche aus dem Kreuzprodukt: Parallelogramm |a × b|, Dreieck die Hälfte
function areaStep(rng: Rng, shape: Shape, an: string, bn: string, a: Vec, b: Vec): GuidedStep {
  const c = cross(a, b)
  const full = lengthOf(c)
  const area = shape === 'tri' ? half(full) : full
  const line = (x: Surd | Rational) => math(`A = ${'rad' in x ? surdLatex(x) : ratLatex(x)}`)
  const scale = (x: Surd) => (shape === 'tri' ? half(x) : x)
  const lengths = sqrtRat(m(vecNorm2(a), vecNorm2(b)))
  const wrongs: Wrong[] = [
    shape === 'tri' ? { content: line(full), rule: 'vec-area-half-forgotten' } : { content: line(half(full)), rule: 'vec-area-half-parallelogram' },
    { content: line(shape === 'tri' ? ratDiv(vecNorm2(c), rat(2)) : vecNorm2(c)), rule: 'vec-length-no-root' },
    ...rng.shuffle<Wrong>([
      { content: line(scale(lengths)), rule: 'vec-area-lengths' },
      { content: line(scale({ coef: ratAbs(vecDot(a, b)), rad: 1n })), rule: 'vec-area-dot' },
    ]),
  ]
  const name = `${an} \\times ${bn}`
  const formula =
    shape === 'tri'
      ? chain(`A = \\frac{1}{2}\\,\\lvert ${name} \\rvert`, `\\frac{1}{2} \\cdot ${surdLatex(full)}`, surdLatex(area))
      : `A = \\lvert ${name} \\rvert = ${rootChain(c)}`
  const lengthLine = `\\lvert ${name} \\rvert = ${rootChain(c)}`
  return choiceStep(rng, {
    id: 'flaeche',
    title: 'Fläche',
    question: `Wie groß ist die Fläche $A$ des ${SHAPE_NAME[shape]}?`,
    correct: line(area),
    wrongs,
    hint:
      shape === 'tri'
        ? `Das Dreieck ist die Hälfte des Parallelogramms aus $${an}$ und $${bn}$. Dessen Fläche ist die Länge von $${name}$.`
        : `Die Fläche des Parallelogramms aus $${an}$ und $${bn}$ ist die Länge von $${name}$.`,
    explanation: {
      detailed:
        shape === 'tri'
          ? `Die Länge des Kreuzprodukts ist die Fläche des Parallelogramms: $${lengthLine}$. Das Dreieck ist die Hälfte davon: $${formula}$.`
          : `Die Länge des Kreuzprodukts ist die Fläche des Parallelogramms, das $${an}$ und $${bn}$ aufspannen: $${formula}$.`,
      short: `$${shape === 'tri' ? `${lengthLine},\\; ${formula}` : formula}$.`,
    },
    established: shape === 'tri' ? [lengthLine, formula] : [formula],
    cards: [CARD.flaeche],
  })
}

// ------------------------------------------------------------------ Bilder

const add = (p: readonly number[], q: readonly number[]) => p.map((x, i) => x + q[i])
const len = (v: readonly number[]) => Math.hypot(...v)

// Normale so lang wie die Fläche, höchstens 1,6-mal so lang wie der längere der beiden Pfeile (sonst verkürzt)
function normalArrow(o: readonly number[], cn: readonly number[], a: Vec, b: Vec): { readonly to: readonly number[]; readonly short: boolean } {
  const limit = 1.6 * Math.max(len(nums(a)), len(nums(b)))
  const k = len(cn) > limit ? limit / len(cn) : 1
  return { to: add(o, cn.map((x) => k * x)), short: k < 1 }
}

type SpanOpts = {
  readonly shape: Shape
  // Fuß beider Pfeile (Punkt P bei Punkten)
  readonly o?: Vec
  // Namen der Ecken (Punkte), sonst keine
  readonly corners?: readonly string[]
  // mit Normale (Ergebnis): Name und Vektor
  readonly normal?: { readonly c: readonly number[]; readonly label: string }
  // zweite Normale in Gegenrichtung (zwei Lösungen)
  readonly opposite?: string
  // in der Ebene zeichnen (dritter Eintrag 0)
  readonly flat?: true
}

// a und b vom selben Fuß, dazwischen Parallelogramm oder Dreieck; mit Ergebnis erscheinen beim Abspielen Fläche, Normale
// und rechter Winkel nacheinander
function spanDrawing(an: string, bn: string, a: Vec, b: Vec, caption: string, opts: SpanOpts): VectorDrawing {
  const dim = opts.flat ? 2 : 3
  const cut = (v: readonly number[]) => (opts.flat ? v.slice(0, 2) : v)
  const o = cut(opts.o ? nums(opts.o) : [0, 0, 0])
  const [pa, pb] = [cut(nums(a)), cut(nums(b))]
  const A = add(o, pa)
  const B = add(o, pb)
  const AB = add(A, pb)
  const result = !!opts.normal || !!opts.opposite
  const phase = (k: number) => (result ? { phase: k } : {})
  const polygons: DrawPolygon[] = [{ points: opts.shape === 'tri' ? [o, A, B] : [o, A, AB, B], color: 'c', ...phase(1) }]
  const segments: DrawSegment[] =
    opts.shape === 'tri'
      ? [{ from: A, to: B, color: 'muted' }]
      : [
          { from: A, to: AB, color: 'muted', dashed: true },
          { from: B, to: AB, color: 'muted', dashed: true },
        ]
  const arrows: DrawArrow[] = [
    { from: o, to: A, color: 'a', label: an },
    { from: o, to: B, color: 'b', label: bn },
  ]
  const angles: DrawAngle[] = []
  if (opts.normal && !opts.flat) {
    const n = normalArrow(o, opts.normal.c, a, b)
    arrows.push({ from: o, to: n.to, color: 'r', label: opts.normal.label, phase: 2 })
    angles.push({ at: o, u: n.to.map((x, i) => x - o[i]), v: pa, color: 'r', phase: 3 })
    if (opts.opposite) arrows.push({ from: o, to: o.map((x, i) => 2 * x - n.to[i]), color: 'r', label: opts.opposite, phase: 3 })
  }
  const points: DrawPoint[] = (opts.corners ?? []).map((label, i) => ({ at: [o, A, opts.shape === 'tri' ? B : AB, B][i], label }))
  return { ...emptyDrawing(dim, caption), arrows, segments, polygons, points, ...(angles.length ? { angles } : {}) }
}

const shortNote = (o: Vec | undefined, c: Vec, a: Vec, b: Vec) => (normalArrow(o ? nums(o) : [0, 0, 0], nums(c), a, b).short ? ' Die Normale ist verkürzt gezeichnet.' : '')

// ------------------------------------------------------------------ Zahlen

// a und b im Raum, nicht parallel, höchstens zmax Nullen je Vektor, mindestens ein negativer Eintrag
function pickPair(rng: Rng, R: number, zmax: number, zmin = 0): readonly [Vec, Vec] {
  for (;;) {
    const a = ints(rng, 3, -R, R)
    const b = ints(rng, 3, -R, R)
    const zeros = zeroCount(a) + zeroCount(b)
    if (zeroCount(a) > zmax || zeroCount(b) > zmax || zeros < zmin || negCount(a) + negCount(b) === 0) continue
    if (isParallel(a, b) || isZero(cross(a, b)[1])) continue
    return [a, b]
  }
}

const PT_LETTERS = [
  ['P', 'Q', 'R', 'S'],
  ['K', 'L', 'M', 'N'],
  ['U', 'V', 'W', 'X'],
] as const

function names(rng: Rng) {
  const i = rng.int(0, 2)
  const v = VEC_LETTERS[i]
  return { an: vecName(v[0]), bn: vecName(v[1]), key: v[0], pts: PT_LETTERS[rng.int(0, 2)] }
}

const areaClass = (x: Surd) => (x.rad === 1n ? (x.coef.d === 1n ? 'int' : 'frac') : x.coef.d === 1n ? 'root' : 'fracroot')

// ------------------------------------------------------------------ Arten

// Kreuzprodukt: Stufe 1 kleine Zahlen mit Nullen in einem Schritt, Stufe 2 dazu b × a
function buildCross(rng: Rng, level: Level): Built {
  const { an, bn, key } = names(rng)
  for (;;) {
    const [a, b] = level === 1 ? pickPair(rng, 3, 1, 1) : pickPair(rng, 5, 0)
    const c = cross(a, b)
    const ask = spanDrawing(an, bn, a, b, `Das Kreuzprodukt steht senkrecht auf dem Parallelogramm aus $${an}$ und $${bn}$.`, { shape: 'par' })
    const first = { ...crossStep(rng, an, bn, a, b), drawing: ask }
    const steps = level === 1 ? [first] : [first, swapStep(rng, an, bn, a, b)]
    if (steps.some((st) => st.choices.length < 3)) continue
    const name = `${an} \\times ${bn}`
    return {
      kind: 'cross',
      instruction: level === 1 ? `Berechne das Kreuzprodukt $${name}$.` : `Berechne $${name}$ und $${bn} \\times ${an}$.`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)}`,
      steps,
      cards: [CARD.kreuz],
      resultLatex: level === 1 ? `${name} = ${vecLatex(c)}` : `${name} = ${vecLatex(c)},\\; ${bn} \\times ${an} = ${vecLatex(vecNeg(c))}`,
      resultDrawing: spanDrawing(an, bn, a, b, `$${name}$ steht senkrecht auf $${an}$ und $${bn}$ und ist so lang, wie das Parallelogramm Fläche hat.${shortNote(undefined, c, a, b)}`, {
        shape: 'par',
        normal: { c: nums(c), label: name },
      }),
      form: `cross|${level}|${key}|${signShape(a, b)}|${zeroCount(c)}|${negCount(c)}|${areaClass(lengthOf(c))}`,
      data: { a: nums(a), b: nums(b) },
      answer: level === 1 ? nums(c) : [...nums(c), ...nums(vecNeg(c))],
    }
  }
}

// Fläche: Stufe 1 in der Ebene aus zwei Vektoren, Stufe 2 im Raum (Parallelogramm aus Vektoren oder Dreieck aus Punkten),
// Stufe 3 Parallelogramm aus drei Ecken mit der vierten Ecke
function buildCrossArea(rng: Rng, level: Level): Built {
  const { an, bn, key, pts } = names(rng)
  const shape: Shape = rng.chance(0.5) ? 'tri' : 'par'
  const fromPoints = level === 3 || (level === 2 && shape === 'tri')
  const realShape: Shape = level === 3 ? 'par' : shape
  for (;;) {
    let a: Vec
    let b: Vec
    if (level === 1) {
      const p = ints(rng, 2, -4, 4, true)
      const q = ints(rng, 2, -4, 4)
      a = vec(...p, 0)
      b = vec(...q, 0)
      if (isParallel(a, b) || negCount(a) + negCount(b) === 0 || zeroCount(q) > 1) continue
    } else [a, b] = pickPair(rng, 4, 1)
    const c = cross(a, b)
    const area = realShape === 'tri' ? half(lengthOf(c)) : lengthOf(c)
    const flat = level === 1
    const P = fromPoints ? ints(rng, 3, -3, 4) : undefined
    const [P1, P2, P3, P4] = pts
    // Ecken: Dreieck P1 P2 P3; Parallelogramm P1 P2 P3 P4 mit P2 = P1 + a, P4 = P1 + b, gesucht P3
    const Q = P ? vecAdd(P, a) : undefined
    const R = P ? vecAdd(P, b) : undefined
    const vA = fromPoints ? arrowName(P1, P2) : an
    const vB = fromPoints ? arrowName(P1, realShape === 'tri' ? P3 : P4) : bn
    const corners = fromPoints ? (realShape === 'tri' ? [P1, P2, P3] : [P1, P2, P3, P4]) : undefined
    const ask = spanDrawing(vA, vB, a, b, fromPoints ? `Die Ecken des ${SHAPE_NAME[realShape]} im Raum.` : `Das ${realShape === 'tri' ? 'Dreieck' : 'Parallelogramm'} aus $${an}$ und $${bn}$.`, {
      shape: realShape,
      ...(P ? { o: P } : {}),
      ...(corners ? { corners } : {}),
      ...(flat ? { flat } : {}),
    })
    const steps: GuidedStep[] = []
    if (fromPoints) {
      steps.push({ ...connectStep(rng, P1, P2, P!, Q!), drawing: ask })
      steps.push(connectStep(rng, P1, realShape === 'tri' ? P3 : P4, P!, R!))
    }
    let corner: Vec | undefined
    if (level === 3) {
      corner = vecAdd(Q!, b)
      const line = (v: Vec) => math(pointLatex(P3, v))
      steps.push(
        choiceStep(rng, {
          id: 'ecke',
          title: 'Vierte Ecke',
          question: `Wo liegt die vierte Ecke $${P3}$?`,
          correct: line(corner),
          wrongs: [
            { content: line(vecSub(vecAdd(P!, Q!), R!)), rule: 'vec-parallelogram-corner' },
            { content: line(vecSub(vecAdd(P!, R!), Q!)), rule: 'vec-parallelogram-corner' },
          ],
          hint: `Gegenüberliegende Seiten sind gleich: $${arrowName(P2, P3)} = ${arrowName(P1, P4)}$.`,
          explanation: {
            detailed: `Von $${P2}$ aus gehst du denselben Weg wie von $${P1}$ nach $${P4}$: $${P3} = ${P2} + ${arrowName(P1, P4)} = ${vecLatex(Q!)} + ${vecLatex(b)} = ${vecLatex(corner)}$.`,
            short: `$${P3} = ${P2} + ${arrowName(P1, P4)} = ${vecLatex(corner)}$.`,
          },
          established: [`${P3} = ${P2} + ${arrowName(P1, P4)} = ${vecLatex(corner)}`],
          cards: [CARD.parallelogramm],
        }),
      )
    }
    const cs = crossStep(rng, vA, vB, a, b)
    steps.push(fromPoints ? cs : { ...cs, drawing: ask })
    steps.push(areaStep(rng, realShape, vA, vB, a, b))
    if (steps.some((st) => st.choices.length < 3)) continue
    const what = realShape === 'tri' ? 'Dreiecks' : 'Parallelogramms'
    const instruction = flat
      ? `Die Vektoren $${an}$ und $${bn}$ liegen in der $x$-$y$-Ebene. Wie groß ist die Fläche $A$ des ${realShape === 'tri' ? 'Dreiecks' : 'Parallelogramms'}, das sie aufspannen?`
      : level === 3
        ? `$${P1}$, $${P2}$ und $${P4}$ sind Ecken des Parallelogramms $${P1}${P2}${P3}${P4}$. Bestimme die vierte Ecke $${P3}$ und die Fläche $A$.`
        : fromPoints
          ? `Wie groß ist die Fläche $A$ des Dreiecks $${P1}${P2}${P3}$?`
          : `Wie groß ist die Fläche $A$ des ${what}, das $${an}$ und $${bn}$ aufspannen?`
    const given = fromPoints
      ? [pointLatex(P1, P!), pointLatex(P2, Q!), pointLatex(realShape === 'tri' ? P3 : P4, R!)].join(',\\; ')
      : `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)}`
    const resultCaption = flat
      ? `Das Kreuzprodukt $${vecLatex(c)}$ steht senkrecht auf der Ebene; seine Länge ist die Fläche des Parallelogramms${realShape === 'tri' ? ', das Dreieck ist die Hälfte davon' : ''}.`
      : `Die Normale $${vA} \\times ${vB}$ ist so lang, wie das Parallelogramm Fläche hat${realShape === 'tri' ? ', das Dreieck ist die Hälfte davon' : ''}.${shortNote(P, c, a, b)}`
    return {
      kind: 'crossArea',
      instruction,
      functionLatex: given,
      steps,
      cards: [CARD.flaeche, CARD.kreuz],
      resultLatex: `${corner ? `${pointLatex(P3, corner)},\\; ` : ''}A = ${surdLatex(area)}`,
      resultDrawing: spanDrawing(vA, vB, a, b, resultCaption, {
        shape: realShape,
        ...(P ? { o: P } : {}),
        ...(corners ? { corners } : {}),
        ...(flat ? { flat } : { normal: { c: nums(c), label: `${vA} \\times ${vB}` } }),
      }),
      form: `crossArea|${level}|${realShape}|${fromPoints ? 'pts' : 'vec'}|${key}|${signShape(a, b)}|${areaClass(area)}`,
      data: { a: nums(a), b: nums(b), ...(P ? { P: nums(P) } : {}) },
      answer: [...(corner ? nums(corner) : []), surdValue(area)],
    }
  }
}

// Vektoren a, b mit a × b = λ·m und ganzzahliger Länge von m (aus LENGTH_POOLS): Normale gegebener Länge ohne Wurzel
function pickNormalPair(rng: Rng): { readonly a: Vec; readonly b: Vec; readonly mv: Vec; readonly ell: number } {
  for (;;) {
    const row = rng.pick(LENGTH_POOLS[3])
    const mv = vec(...rng.shuffle(row.slice(0, 3)).map((x) => (rng.chance(0.5) ? -x : x)))
    const a = ints(rng, 3, -4, 4)
    const b = ints(rng, 3, -4, 4)
    if (!isZero(vecDot(a, mv)) || !isZero(vecDot(b, mv)) || isParallel(a, b) || zeroCount(a) > 1 || zeroCount(b) > 1) continue
    if (vecNorm2(cross(a, b)).n > 900n) continue
    return { a, b, mv, ell: row[3] }
  }
}

// Normalenvektor: Stufe 2 der Ebene durch drei Punkte, Stufe 3 auf Länge 1 gebracht, Stufe 4 gegebene Länge (zwei
// Lösungen), Stufe 5 dasselbe zu drei Punkten
function buildCrossNormal(rng: Rng, level: Level): Built {
  const { an, bn, key, pts } = names(rng)
  const [P1, P2, P3] = pts
  const fromPoints = level === 2 || level === 5
  for (;;) {
    let a: Vec
    let b: Vec
    let L = 0
    if (level >= 4) {
      const pick = pickNormalPair(rng)
      ;[a, b] = [pick.a, pick.b]
      L = pick.ell * rng.int(1, 3)
    } else [a, b] = pickPair(rng, level === 2 ? 4 : 3, 1)
    const c = cross(a, b)
    const P = fromPoints ? ints(rng, 3, -3, 4) : undefined
    const vA = fromPoints ? arrowName(P1, P2) : an
    const vB = fromPoints ? arrowName(P1, P3) : bn
    const corners = fromPoints ? [P1, P2, P3] : undefined
    const shape: Shape = fromPoints ? 'tri' : 'par'
    const ask = spanDrawing(vA, vB, a, b, fromPoints ? `Die Ebene durch $${P1}$, $${P2}$ und $${P3}$.` : `Gesucht ist ein Vektor, der senkrecht auf $${an}$ und $${bn}$ steht.`, {
      shape,
      ...(P ? { o: P } : {}),
      ...(corners ? { corners } : {}),
    })
    const steps: GuidedStep[] = []
    if (fromPoints) steps.push({ ...connectStep(rng, P1, P2, P!, vecAdd(P!, a)), drawing: ask }, connectStep(rng, P1, P3, P!, vecAdd(P!, b)))
    const cs = crossStep(rng, vA, vB, a, b)
    steps.push(fromPoints ? cs : { ...cs, drawing: ask })
    const name = `${vA} \\times ${vB}`
    const cl = lengthOf(c)
    let resultLatex = `\\vec n = ${vecLatex(c)}`
    let answer = nums(c)
    let labels = { n: '\\vec n', opposite: undefined as string | undefined }
    let instruction = `Bestimme einen Normalenvektor $\\vec n = ${name}$ der Ebene durch $${P1}$, $${P2}$ und $${P3}$.`
    let variant = 'plain'
    if (level === 3) {
      steps.push(normStep(rng, `\\lvert ${name} \\rvert`, c, 'laenge', CARD.normale))
      // n⁰ = c / |c| = c · √r / (k r) bei |c| = k √r
      const scaleBy = ratDiv(rat(1), m(cl.coef, rat(cl.rad)))
      const unitLatex = cl.rad === 1n ? vecLatex(vecScale(ratDiv(rat(1), cl.coef), c)) : surdVecLatex(vecScale(scaleBy, c), cl.rad)
      const line = (x: string) => math(`\\vec n^{\\,0} = ${x}`)
      const times = cl.rad === 1n ? vecLatex(vecScale(cl.coef, c)) : surdVecLatex(vecScale(cl.coef, c), cl.rad)
      const lenLatex = surdLatex(cl)
      steps.push(
        choiceStep(rng, {
          id: 'normieren',
          title: 'Länge 1',
          question: `Wie lautet der Normalenvektor $\\vec n^{\\,0}$ mit der Länge $1$?`,
          correct: line(unitLatex),
          wrongs: [
            { content: line(vecLatex(vecScale(ratDiv(rat(1), vecNorm2(c)), c))), rule: 'vec-unit-squared' },
            { content: line(times), rule: 'vec-unit-times' },
          ],
          hint: `Teile jeden Eintrag von $${name}$ durch seine Länge.`,
          explanation: {
            detailed: `$\\vec n^{\\,0} = \\frac{1}{\\lvert ${name} \\rvert}\\,(${name}) = \\frac{1}{${lenLatex}}${vecLatex(c)} = ${unitLatex}$.${cl.rad === 1n ? '' : ' Die Wurzel im Nenner wird dabei weggeschafft: mit ihr erweitern.'}`,
            short: `$\\vec n^{\\,0} = \\frac{1}{${lenLatex}}${vecLatex(c)} = ${unitLatex}$.`,
          },
          established: [`\\vec n^{\\,0} = ${unitLatex}`],
          cards: [CARD.normale, CARD.einheit],
        }),
      )
      resultLatex = `\\vec n^{\\,0} = ${unitLatex}`
      answer = nums(c).map((x) => x / surdValue(cl))
      labels = { n: '\\vec n^{\\,0}', opposite: undefined }
      instruction = `Bestimme einen Vektor $\\vec n^{\\,0}$ der Länge $1$, der senkrecht auf $${an}$ und $${bn}$ steht. Nimm dazu $${name}$.`
      variant = `unit-${areaClass(cl)}`
    }
    if (level >= 4) {
      steps.push(normStep(rng, `\\lvert ${name} \\rvert`, c, 'laenge', CARD.normale))
      const k = ratDiv(rat(L), cl.coef)
      const n1 = vecScale(k, c)
      const both = (v: Vec) => math(`\\vec n_1 = ${vecLatex(v)},\\; \\vec n_2 = ${vecLatex(vecNeg(v))}`)
      const unitV = vecScale(ratDiv(rat(1), cl.coef), c)
      const wrongs: Wrong[] = [
        { content: math(`\\vec n = ${vecLatex(n1)}`), rule: 'vec-one-solution' },
        { content: both(vecScale(rat(L), c)), rule: 'vec-not-normalized' },
        { content: both(unitV), rule: 'vec-normal-no-length' },
      ]
      const formula = `\\vec n_{1,2} = \\pm \\frac{${L}}{${surdLatex(cl)}}\\,${vecLatex(c)}`
      steps.push(
        choiceStep(rng, {
          id: 'laenge-l',
          title: `Länge ${L}`,
          question: `Welche Vektoren der Länge $${L}$ stehen senkrecht auf $${vA}$ und $${vB}$?`,
          correct: both(n1),
          wrongs,
          hint: `Erst auf die Länge $1$ bringen (durch $\\lvert ${name} \\rvert$ teilen), dann mit $${L}$ malnehmen. Auch der Gegenvektor steht senkrecht.`,
          explanation: {
            detailed: `Senkrecht auf beiden steht jedes Vielfache von $${name}$. Mit der Länge $${L}$: $${formula}$, also $\\vec n_1 = ${vecLatex(n1)}$ und $\\vec n_2 = ${vecLatex(vecNeg(n1))}$. Zwei Lösungen, denn der Gegenvektor ist genauso lang.`,
            short: `$${formula}$.`,
          },
          established: [`${formula}`],
          cards: [CARD.normale],
        }),
      )
      resultLatex = `\\vec n_1 = ${vecLatex(n1)},\\; \\vec n_2 = ${vecLatex(vecNeg(n1))}`
      answer = [...nums(n1), ...nums(vecNeg(n1))]
      labels = { n: '\\vec n_1', opposite: '\\vec n_2' }
      instruction = fromPoints
        ? `Bestimme alle Vektoren der Länge $${L}$, die senkrecht auf der Ebene durch $${P1}$, $${P2}$ und $${P3}$ stehen.`
        : `Bestimme alle Vektoren der Länge $${L}$, die senkrecht auf $${an}$ und $${bn}$ stehen.`
      variant = `len-${L / Number(cl.coef.n) === 1 ? 'same' : 'scaled'}`
    }
    if (steps.some((st) => st.choices.length < 3)) continue
    const normal = level >= 4 ? vecScale(ratDiv(rat(L), cl.coef), c) : c
    const given = fromPoints
      ? [pointLatex(P1, P!), pointLatex(P2, vecAdd(P!, a)), pointLatex(P3, vecAdd(P!, b))].join(',\\; ')
      : `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)}`
    return {
      kind: 'crossNormal',
      instruction,
      functionLatex: given,
      steps,
      cards: [CARD.normale, CARD.kreuz],
      resultLatex,
      resultDrawing: spanDrawing(vA, vB, a, b, `${level >= 4 ? '$\\vec n_1$ und $\\vec n_2$ stehen' : `$${labels.n}$ steht`} senkrecht auf $${vA}$ und $${vB}$.${level === 3 ? ' Er hat die Länge $1$.' : shortNote(P, normal, a, b)}`, {
        shape,
        ...(P ? { o: P } : {}),
        ...(corners ? { corners } : {}),
        normal: { c: level === 3 ? nums(c).map((x) => x / surdValue(cl)) : nums(normal), label: labels.n },
        ...(labels.opposite ? { opposite: labels.opposite } : {}),
      }),
      form: `crossNormal|${level}|${fromPoints ? 'pts' : 'vec'}|${variant}|${key}|${signShape(a, b)}|${zeroCount(c)}`,
      data: { a: nums(a), b: nums(b), ...(P ? { P: nums(P) } : {}), ...(L ? { L: [L] } : {}) },
      answer,
    }
  }
}

// Abstand eines Punktes von einer Geraden: d = |v × PQ| / |v|; Stufe 5 aus drei Punkten mit der Fläche des Dreiecks
function buildCrossDistance(rng: Rng, level: Level): Built {
  const { an, key, pts } = names(rng)
  const [P1, P2, P3] = pts
  const withArea = level === 5
  for (;;) {
    const [v, w] = pickPair(rng, level === 5 ? 4 : 3, 1)
    const P = ints(rng, 3, -3, 3)
    const Q = vecAdd(P, w)
    const c = cross(v, w)
    // d² = |c|² / |v|²
    const d = sqrtRat(ratDiv(vecNorm2(c), vecNorm2(v)))
    const vn = withArea ? arrowName(P1, P2) : an
    const wn = withArea ? arrowName(P1, P3) : arrowName(P1, P2)
    const target = withArea ? P3 : P2
    const steps: GuidedStep[] = []
    const k = ratDiv(vecDot(v, w), vecNorm2(v))
    const ask = distDrawing(vn, wn, P, v, w, P1, target, `Gesucht ist der Abstand von $${target}$ zur Geraden ${withArea ? `durch $${P1}$ und $${P2}$` : `$g$`}.`, false)
    if (withArea) steps.push({ ...connectStep(rng, P1, P2, P, vecAdd(P, v)), drawing: ask }, connectStep(rng, P1, P3, P, Q))
    else steps.push({ ...connectStep(rng, P1, P2, P, Q), drawing: ask })
    steps.push(crossStep(rng, vn, wn, v, w))
    const area = half(lengthOf(c))
    if (withArea) steps.push(areaStep(rng, 'tri', vn, wn, v, w))
    const line = (x: Surd | Rational) => math(`d = ${'rad' in x ? surdLatex(x) : ratLatex(x)}`)
    const cl = lengthOf(c)
    const vl = lengthOf(v)
    const wrongs: Wrong[] = [
      { content: line(cl), rule: 'vec-height-no-divide' },
      { content: line(sqrtRat(ratDiv(vecNorm2(c), m(vecNorm2(v), vecNorm2(v))))), rule: 'vec-height-squared' },
      { content: line(sqrtRat(ratDiv(m(vecDot(v, w), vecDot(v, w)), vecNorm2(v)))), rule: 'vec-dist-shadow' },
      { content: line(ratDiv(vecNorm2(c), vecNorm2(v))), rule: 'vec-length-no-root' },
    ]
    const name = `${vn} \\times ${wn}`
    const formula = withArea
      ? `d = \\frac{2A}{\\lvert ${vn} \\rvert} = \\frac{\\lvert ${name} \\rvert}{\\lvert ${vn} \\rvert} = ${chain(`\\frac{${surdLatex(cl)}}{${surdLatex(vl)}}`, surdLatex(d))}`
      : `d = \\frac{\\lvert ${name} \\rvert}{\\lvert ${vn} \\rvert} = ${chain(`\\frac{${surdLatex(cl)}}{${surdLatex(vl)}}`, surdLatex(d))}`
    steps.push(
      choiceStep(rng, {
        id: 'abstand',
        title: 'Abstand',
        question: withArea ? `Wie groß ist der Abstand $d$ von $${P3}$ zur Geraden durch $${P1}$ und $${P2}$?` : `Wie groß ist der Abstand $d$ von $${P2}$ zur Geraden $g$?`,
        correct: line(d),
        wrongs,
        hint: withArea
          ? `Fläche = Grundseite mal Höhe durch 2. Die Grundseite ist $\\lvert ${vn} \\rvert$, die Höhe ist der gesuchte Abstand.`
          : `Das Parallelogramm aus $${vn}$ und $${wn}$ hat die Fläche $\\lvert ${name} \\rvert$ = Grundseite mal Höhe. Die Grundseite ist $\\lvert ${vn} \\rvert$, die Höhe ist der Abstand.`,
        explanation: {
          detailed: `Die Höhe des Parallelogramms aus $${vn}$ und $${wn}$ ist der Abstand. Fläche durch Grundseite: $\\lvert ${vn} \\rvert = ${rootChain(v)}$ und $\\lvert ${name} \\rvert = ${rootChain(c)}$, also $${formula}$.`,
          short: `$${formula}$.`,
        },
        established: [`\\lvert ${vn} \\rvert = ${surdLatex(vl)}`, formula],
        cards: [CARD.abstandKreuz],
      }),
    )
    if (steps.some((st) => st.choices.length < 3)) continue
    // die Gerade nicht durch einen anderen Ecken-Namen: bei Stufe 3 Gerade g durch P1 mit Richtung v
    const given = withArea
      ? [pointLatex(P1, P), pointLatex(P2, vecAdd(P, v)), pointLatex(P3, Q)].join(',\\; ')
      : `g\\colon\\; \\vec x = ${vecLatex(P)} + s\\,${vecLatex(v)},\\; ${pointLatex(P2, Q)}`
    return {
      kind: 'crossDistance',
      instruction: withArea
        ? `Wie groß ist die Fläche $A$ des Dreiecks $${P1}${P2}${P3}$, und welchen Abstand $d$ hat $${P3}$ von der Geraden durch $${P1}$ und $${P2}$?`
        : `Die Gerade $g$ geht durch $${pointLatex(P1, P)}$ in Richtung $${an} = ${vecLatex(v)}$. Wie groß ist der Abstand $d$ des Punktes $${P2}$ von $g$?`,
      functionLatex: given,
      steps,
      cards: [CARD.abstandKreuz, CARD.kreuz],
      resultLatex: withArea ? `A = ${surdLatex(area)},\\; d = ${surdLatex(d)}` : `d = ${surdLatex(d)}`,
      resultDrawing: distDrawing(vn, wn, P, v, w, P1, target, `Fläche des Parallelogramms durch die Grundseite $\\lvert ${vn} \\rvert$ ergibt die Höhe $d$, den Abstand von $${target}$ zur Geraden.`, true),
      form: `crossDistance|${level}|${key}|${signShape(v, w)}|${ratSign(k)}|${areaClass(d)}`,
      data: { P: nums(P), v: nums(v), Q: nums(Q) },
      answer: withArea ? [surdValue(area), surdValue(d)] : [surdValue(d)],
    }
  }
}

// Gerade durch P in Richtung v, Punkt Q = P + w; mit Ergebnis: Parallelogramm, Lot von Q auf F und rechter Winkel
function distDrawing(vn: string, wn: string, P: Vec, v: Vec, w: Vec, Pn: string, Qn: string, caption: string, result: boolean): VectorDrawing {
  const k = num(ratDiv(vecDot(v, w), vecNorm2(v)))
  const [p, vv, ww] = [nums(P), nums(v), nums(w)]
  const f = add(p, vv.map((x) => k * x))
  const q = add(p, ww)
  const lo = Math.min(0, k) - 0.4
  const hi = Math.max(1, k) + 0.4
  return {
    ...emptyDrawing(3, caption),
    segments: [
      { from: add(p, vv.map((x) => lo * x)), to: add(p, vv.map((x) => hi * x)), color: 'muted', dashed: true },
      ...(result ? [{ from: q, to: f, color: 'r' as const, label: 'd', phase: 2 }] : []),
    ],
    polygons: result ? [{ points: [p, add(p, vv), add(add(p, vv), ww), q], color: 'c', phase: 1 }] : [],
    arrows: [
      { from: p, to: add(p, vv), color: 'a', label: vn },
      { from: p, to: q, color: 'b', label: wn },
    ],
    points: [
      { at: p, label: Pn },
      { at: q, label: Qn },
      ...(result ? [{ at: f, label: 'F', color: 'r' as const, phase: 2 }] : []),
    ],
    ...(result ? { angles: [{ at: f, u: vv.map((x) => -x), v: q.map((x, i) => x - f[i]), color: 'r' as const, phase: 2 }] } : {}),
  }
}

// Parallel mit Parameter: a × b = 0 (Stufe 4)
function buildCrossParallel(rng: Rng): Built {
  const { an, bn, key } = names(rng)
  const t = rng.pick(PARAMS)
  for (;;) {
    const a = ints(rng, 3, -4, 4, true)
    const k = rat(rng.pick([2, -2, 3, -3, -1]))
    const b = vecScale(k, a)
    if (negCount(a) === 0 || b.some((x) => Math.abs(num(x)) > 12)) continue
    const j = rng.int(0, 2)
    const inA = rng.chance(0.4)
    // der Vektor mit Parameter hat an der Stelle j eine 0 als Grundwert
    const a0 = inA ? a.map((x, i) => (i === j ? rat(0) : x)) : a
    const b0 = inA ? b : b.map((x, i) => (i === j ? rat(0) : x))
    const param: Param = { j, inA, t }
    const tValue = inA ? a[j] : b[j]
    const c = paramCross(cross, a0, b0, j, inA)
    // eine Komponente mit Parameter, aus der t folgt
    const i = [0, 1, 2].find((x) => !isZero(c.slope[x]))!
    const [u0, w0] = [c.base[i], c.slope[i]]
    const dotBase = vecDot(a0, b0)
    const dotSlope = inA ? b[j] : a[j]
    const steps: GuidedStep[] = [crossStep(rng, an, bn, a0, b0, param)]
    const line = (x: Rational) => math(`${t} = ${ratLatex(x)}`)
    const eq = `${linLatex(u0, w0, t)} = 0`
    const wrongs: Wrong[] = [{ content: line(ratNeg(tValue)), rule: 'vec-param-solve' }]
    if (!isZero(dotSlope)) wrongs.push({ content: line(ratDiv(ratNeg(dotBase), dotSlope)), rule: 'vec-parallel-dot' })
    if (!isZero(u0)) wrongs.push({ content: line(ratDiv(ratNeg(w0), u0)), rule: 'vec-param-solve' })
    const name = `${an} \\times ${bn}`
    const kTimes = num(k) === -1 ? `-${an}` : `${ratLatex(k)}\\,${an}`
    const after = vecLatex(cross(inA ? a : a0, inA ? b0 : b))
    steps.push(
      choiceStep(rng, {
        id: 'parameter',
        title: 'Parameter',
        question: `Für welches $${t}$ sind $${an}$ und $${bn}$ parallel?`,
        correct: line(tValue),
        wrongs: [wrongs[0], ...rng.shuffle(wrongs.slice(1))],
        hint: `Parallel heißt $${name} = \\vec 0$: Jede Komponente muss $0$ sein. Nimm eine Komponente, in der $${t}$ vorkommt.`,
        explanation: {
          detailed: `Parallel heißt $${name} = \\vec 0$. Aus der ${['ersten', 'zweiten', 'dritten'][i]} Komponente: $${eq}$, also $${t} = ${ratLatex(tValue)}$. Probe: Mit $${t} = ${ratLatex(tValue)}$ wird $${name} = ${after}$, und $${bn} = ${kTimes}$.`,
          short: `$${eq} \\Rightarrow ${t} = ${ratLatex(tValue)}$.`,
        },
        established: [`${eq} \\Rightarrow ${t} = ${ratLatex(tValue)}`],
        cards: [CARD.normale],
      }),
    )
    if (steps.some((st) => st.choices.length < 3)) continue
    const A = inA ? a0 : a
    const B = inA ? b : b0
    return {
      kind: 'crossParallel',
      instruction: `Für welchen Wert von $${t}$ sind $${an}$ und $${bn}$ parallel? Rechne mit dem Kreuzprodukt.`,
      functionLatex: `${an} = ${inA ? withParamLatex(A, j, t) : vecLatex(A)},\\; ${bn} = ${inA ? vecLatex(B) : withParamLatex(B, j, t)}`,
      steps,
      cards: [CARD.normale, CARD.kreuz],
      resultLatex: `${t} = ${ratLatex(tValue)}`,
      resultDrawing: {
        ...emptyDrawing(3, `Mit $${t} = ${ratLatex(tValue)}$ ist $${bn} = ${kTimes}$: Beide liegen auf einer Geraden, das Parallelogramm hat keine Fläche.`),
        arrows: [
          { from: [0, 0, 0], to: nums(b), color: 'b', label: bn },
          { from: [0, 0, 0], to: nums(a), color: 'a', label: an },
        ],
      },
      form: `crossParallel|${inA ? 'a' : 'b'}|${j}|${num(k)}|${key}|${t}|${negCount(a)}`,
      data: { a: nums(a0), b: nums(b0), j: [j], inA: [inA ? 1 : 0] },
      answer: [num(tValue)],
    }
  }
}

// Fläche mit Parameter: Stufe 4 gegebene Fläche (zwei Lösungen), Stufe 5 kleinste Fläche
function buildCrossAreaParam(rng: Rng, level: Level): Built {
  const { an, bn, key } = names(rng)
  const t = rng.pick(PARAMS)
  const shape: Shape = rng.chance(0.5) ? 'tri' : 'par'
  for (;;) {
    const a = ints(rng, 3, -3, 3)
    const j = rng.int(0, 2)
    const b0 = ints(rng, 3, -4, 4).map((x, i) => (i === j ? rat(0) : x))
    if (zeroCount(a) > 1 || negCount(a) + negCount(b0) === 0) continue
    const param: Param = { j, inA: false, t }
    const c = paramCross(cross, a, b0, j, false)
    if (vecIsZero(c.slope)) continue
    const q = normQuad(c)
    if (isZero(q.q1)) continue
    const name = `${an} \\times ${bn}`
    const steps: GuidedStep[] = [crossStep(rng, an, bn, a, b0, param)]
    const qLatex = quadLatex(q, t)
    const area = (T: Rational) => (shape === 'tri' ? half(sqrtRat(T)) : sqrtRat(T))
    if (level === 4) {
      const t1 = rat(rng.int(-4, 4))
      const T = quadAt(q, t1)
      const t2 = ratSub(ratDiv(ratNeg(q.q1), q.q2), t1)
      if (isZero(T) || t2.d > 2n || Math.abs(num(t2)) > 8 || (t1.n === t2.n && t1.d === t2.d)) continue
      const A = area(T)
      const target = shape === 'tri' ? `(2A)^2` : 'A^2'
      const eqLine = (rhs: string, poly = qLatex) => math(`${poly} = ${rhs}`)
      const wrongs: Wrong[] = [
        { content: eqLine(surdLatex(shape === 'tri' ? { coef: m(A.coef, rat(2)), rad: A.rad } : A)), rule: 'vec-length-target-not-squared' },
        shape === 'tri' ? { content: eqLine(ratLatex(ratDiv(T, rat(4)))), rule: 'vec-area-half-forgotten' } : { content: eqLine(ratLatex(m(T, rat(4)))), rule: 'vec-area-half-parallelogram' },
        { content: eqLine(ratLatex(T), termsLatex([[q.q2, `${t}^2`], [q.q0, '']])), rule: 'vec-binomial-middle' },
      ]
      const eqFormula = `\\lvert ${name} \\rvert^2 = ${target}: \\quad ${qLatex} = ${ratLatex(T)}`
      steps.push(
        choiceStep(rng, {
          id: 'gleichung',
          title: 'Gleichung',
          question: `Welche Gleichung muss $${t}$ erfüllen?`,
          correct: eqLine(ratLatex(T)),
          wrongs,
          hint: `${shape === 'tri' ? `Dreieck: $A = \\frac{1}{2}\\lvert ${name} \\rvert$, also $\\lvert ${name} \\rvert = 2A$` : `Parallelogramm: $A = \\lvert ${name} \\rvert$`}. Quadriere, dann fällt die Wurzel weg: Summe der Quadrate der Einträge.`,
          explanation: {
            detailed: `Die Summe der Quadrate der Einträge von $${name}$ ist $\\lvert ${name} \\rvert^2 = ${qLatex}$ (binomische Formeln). ${shape === 'tri' ? `Mit $2A = ${surdLatex({ coef: m(A.coef, rat(2)), rad: A.rad })}$` : `Mit $A = ${surdLatex(A)}$`}: $${eqFormula}$.`,
            short: `$${eqFormula}$.`,
          },
          established: [eqFormula],
          cards: [CARD.flaeche, CARD.parameter],
        }),
      )
      const [lo, hi] = num(t1) < num(t2) ? [t1, t2] : [t2, t1]
      const sol = (x: Rational, y: Rational) => math(`${t}_1 = ${ratLatex(x)},\\; ${t}_2 = ${ratLatex(y)}`)
      const solWrongs: Wrong[] = [
        { content: math(`${t} = ${ratLatex(rng.pick([lo, hi]))}`), rule: 'vec-one-solution' },
        { content: sol(ratNeg(hi), ratNeg(lo)), rule: 'vec-param-solve' },
      ]
      // ohne Mittelglied: q2 t² + q0 = T
      const noMid = ratDiv(ratSub(T, q.q0), q.q2)
      if (ratSign(noMid) > 0) solWrongs.push({ content: math(`${t}_{1,2} = \\pm ${surdLatex(sqrtRat(noMid))}`), rule: 'vec-binomial-middle' })
      const normalForm = termsLatex([[rat(1), `${t}^2`], [ratDiv(q.q1, q.q2), t], [ratDiv(ratSub(q.q0, T), q.q2), '']])
      steps.push(
        choiceStep(rng, {
          id: 'loesungen',
          title: 'Lösungen',
          question: `Für welche Werte von $${t}$ hat das ${shape === 'tri' ? 'Dreieck' : 'Parallelogramm'} die Fläche $${surdLatex(A)}$?`,
          correct: sol(lo, hi),
          wrongs: solWrongs,
          hint: 'Alles auf eine Seite, durch die Zahl vor dem Quadrat teilen, dann pq-Formel. Es gibt zwei Lösungen.',
          explanation: {
            detailed: `Durch $${ratLatex(q.q2)}$ geteilt: $${normalForm} = 0$. Die pq-Formel liefert $${t}_1 = ${ratLatex(lo)}$ und $${t}_2 = ${ratLatex(hi)}$. Probe: Einsetzen ergibt beide Male $${ratLatex(T)}$.`,
            short: `$${normalForm} = 0 \\Rightarrow ${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}$.`,
          },
          established: [`${normalForm} = 0`, `${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`],
          cards: [CARD.flaeche, CARD.parameter],
        }),
      )
      if (steps.some((st) => st.choices.length < 3)) continue
      const b1 = pAt({ base: b0, slope: unit(j) }, lo)
      return {
        kind: 'crossAreaParam',
        instruction: `Für welche Werte von $${t}$ hat das ${shape === 'tri' ? 'Dreieck' : 'Parallelogramm'}, das $${an}$ und $${bn}$ aufspannen, die Fläche $A = ${surdLatex(A)}$?`,
        functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${withParamLatex(b0, j, t)}`,
        steps,
        cards: [CARD.flaeche, CARD.kreuz],
        resultLatex: `${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`,
        resultDrawing: spanDrawing(an, bn, a, b1, `Für $${t} = ${ratLatex(lo)}$: Die Normale ist so lang, wie das Parallelogramm Fläche hat${shape === 'tri' ? ', das Dreieck ist die Hälfte davon' : ''}.${shortNote(undefined, cross(a, b1), a, b1)}`, {
          shape,
          normal: { c: nums(cross(a, b1)), label: name },
        }),
        form: `crossAreaParam|4|${shape}|${j}|${key}|${t}|${signShape(a, b0)}|${t2.d > 1n ? 'frac' : 'int'}|${areaClass(A)}`,
        data: { a: nums(a), b: nums(b0), j: [j], A: [surdValue(A)], tri: [shape === 'tri' ? 1 : 0] },
        answer: [num(lo), num(hi)],
      }
    }
    // Stufe 5: kleinste Fläche am Scheitel t* = −q1 / (2 q2)
    const tStar = ratDiv(ratNeg(q.q1), m(rat(2), q.q2))
    const Qmin = quadAt(q, tStar)
    if (tStar.d > 2n || Math.abs(num(tStar)) > 6 || isZero(Qmin)) continue
    const Amin = area(Qmin)
    const sqLine = (poly: string) => math(`\\lvert ${name} \\rvert^2 = ${poly}`)
    const squareWrongs: Wrong[] = [{ content: sqLine(termsLatex([[q.q2, `${t}^2`], [q.q0, '']])), rule: 'vec-binomial-middle' }]
    const slopeAbs = c.slope.reduce((acc, x) => ratAdd(acc, ratAbs(x)), rat(0))
    if (!(slopeAbs.n === q.q2.n && slopeAbs.d === q.q2.d)) squareWrongs.push({ content: sqLine(quadLatex({ ...q, q2: slopeAbs }, t)), rule: 'vec-param-square' })
    squareWrongs.push({ content: sqLine(quadLatex({ ...q, q1: ratNeg(q.q1) }, t)), rule: 'vec-dot-sign' })
    const sqFormula = `\\lvert ${name} \\rvert^2 = ${c.base.map((x, i) => `\\left(${linLatex(x, c.slope[i], t)}\\right)^2`).join(' + ')} = ${qLatex}`
    steps.push(
      choiceStep(rng, {
        id: 'quadrat',
        title: 'Quadrat der Länge',
        question: `Wie lautet $\\lvert ${name} \\rvert^2$?`,
        correct: sqLine(qLatex),
        wrongs: squareWrongs,
        hint: 'Quadriere jeden Eintrag mit der binomischen Formel und addiere.',
        explanation: { detailed: `$${sqFormula}$. Die Fläche ist am kleinsten, wo dieser Ausdruck am kleinsten ist.`, short: `$${sqFormula}$.` },
        established: [sqFormula],
        cards: [CARD.flaeche, CARD.parameter],
      }),
    )
    const tLine = (x: Rational) => math(`${t} = ${ratLatex(x)}`)
    const vertex = `${t} = -\\frac{${ratLatex(q.q1)}}{2 \\cdot ${ratLatex(q.q2)}} = ${ratLatex(tStar)}`
    steps.push(
      choiceStep(rng, {
        id: 'scheitel',
        title: 'Kleinste Stelle',
        question: `Für welches $${t}$ ist die Fläche am kleinsten?`,
        correct: tLine(tStar),
        wrongs: [
          { content: tLine(ratDiv(ratNeg(q.q1), q.q2)), rule: 'vec-area-min-vertex' },
          { content: tLine(ratNeg(tStar)), rule: 'vec-param-solve' },
        ],
        hint: `Die Parabel $${qLatex}$ hat ihren tiefsten Punkt am Scheitel: Ableitung gleich $0$ setzen.`,
        explanation: {
          detailed: `Die Fläche ist am kleinsten, wo $\\lvert ${name} \\rvert^2$ am kleinsten ist. Ableitung gleich $0$: $${termsLatex([[m(rat(2), q.q2), t], [q.q1, '']])} = 0$, also $${vertex}$.`,
          short: `$${vertex}$.`,
        },
        established: [vertex],
        cards: [CARD.flaeche],
      }),
    )
    const aLine = (x: Surd | Rational) => math(`A = ${'rad' in x ? surdLatex(x) : ratLatex(x)}`)
    const wrongT = ratDiv(ratNeg(q.q1), q.q2)
    const areaWrongs: Wrong[] = [
      shape === 'tri' ? { content: aLine(sqrtRat(Qmin)), rule: 'vec-area-half-forgotten' } : { content: aLine(half(sqrtRat(Qmin))), rule: 'vec-area-half-parallelogram' },
      { content: aLine(shape === 'tri' ? ratDiv(Qmin, rat(2)) : Qmin), rule: 'vec-length-no-root' },
    ]
    if (!isZero(quadAt(q, wrongT))) areaWrongs.push({ content: aLine(area(quadAt(q, wrongT))), rule: 'vec-area-min-vertex' })
    const aFormula =
      shape === 'tri'
        ? `A = \\frac{1}{2}\\sqrt{${ratLatex(Qmin)}} = ${surdLatex(Amin)}`
        : `A = ${chain(`\\sqrt{${ratLatex(Qmin)}}`, surdLatex(Amin))}`
    steps.push(
      choiceStep(rng, {
        id: 'flaeche',
        title: 'Kleinste Fläche',
        question: `Wie groß ist die kleinste Fläche?`,
        correct: aLine(Amin),
        wrongs: areaWrongs,
        hint: `Setze $${t} = ${ratLatex(tStar)}$ in $\\lvert ${name} \\rvert^2$ ein und zieh die Wurzel${shape === 'tri' ? '; das Dreieck ist die Hälfte' : ''}.`,
        explanation: {
          detailed: `Eingesetzt: $\\lvert ${name} \\rvert^2 = ${ratLatex(Qmin)}$, also $${aFormula}$.`,
          short: `$${aFormula}$.`,
        },
        established: [aFormula],
        cards: [CARD.flaeche],
      }),
    )
    if (steps.some((st) => st.choices.length < 3)) continue
    const bStar = pAt({ base: b0, slope: unit(j) }, tStar)
    return {
      kind: 'crossAreaParam',
      instruction: `Für welchen Wert von $${t}$ hat das ${shape === 'tri' ? 'Dreieck' : 'Parallelogramm'}, das $${an}$ und $${bn}$ aufspannen, die kleinste Fläche? Wie groß ist sie?`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${withParamLatex(b0, j, t)}`,
      steps,
      cards: [CARD.flaeche, CARD.kreuz],
      resultLatex: `${t} = ${ratLatex(tStar)},\\; A = ${surdLatex(Amin)}`,
      resultDrawing: spanDrawing(an, bn, a, bStar, `Für $${t} = ${ratLatex(tStar)}$ ist die Normale am kürzesten, die Fläche am kleinsten.${shortNote(undefined, cross(a, bStar), a, bStar)}`, {
        shape,
        normal: { c: nums(cross(a, bStar)), label: name },
      }),
      form: `crossAreaParam|5|${shape}|${j}|${key}|${t}|${signShape(a, b0)}|${tStar.d > 1n ? 'frac' : 'int'}|${areaClass(Amin)}`,
      data: { a: nums(a), b: nums(b0), j: [j], tri: [shape === 'tri' ? 1 : 0] },
      answer: [num(tStar), surdValue(Amin)],
    }
  }
}

export const CROSS_BUILDERS = {
  cross: buildCross,
  crossArea: buildCrossArea,
  crossNormal: buildCrossNormal,
  crossDistance: buildCrossDistance,
  crossParallel: (rng: Rng) => buildCrossParallel(rng),
  crossAreaParam: buildCrossAreaParam,
} satisfies Readonly<Record<string, (rng: Rng, level: Level) => Built>>
