import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type DrawArrow, type DrawPoint, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, CARD, PARAMS, VEC_LETTERS, choiceStep, connectStep, ints, math, negCount, nums, signShape, zeroCount } from './taskKit.ts'
import { type PVec, type Quad, type Shape, areaClass, areaStep, chain, cross, crossStep, linLatex, middleSign, normStep, pAt, quadLatex, termsLatex } from './crossTasks.ts'
import { type Surd, type Vec, arrowName, columnLatex, pointLatex, ratLatex, sqrtRat, surdLatex, surdValue, vec, vecAdd, vecDot, vecLatex, vecName, vecNeg, vecNorm2, vecScale } from './vec.ts'

// Baukasten für den Baustein „Spatprodukt und Volumen" der Tätigkeit „Vektoren" (M7 Schritt 4b, docs/PLAN-M7.md):
// Spatprodukt (über das Kreuzprodukt oder mit Sarrus), Rechts- oder Linkssystem, komplanar (auch vier Punkte in einer
// Ebene), Volumen von Spat, Prisma, Pyramide und Tetraeder, Höhe über der Grundfläche, komplanar mit Parameter und
// Volumen mit Parameter (Betrag, zwei Lösungen). Alles exakt (vec.ts). Bilder im Raum zum Drehen: Beim „Abspielen" zieht
// sich der Körper aus der Grundfläche auf.

export const SPAT_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['spat', 'spatVolume'],
  2: ['spat', 'spatVolume', 'spatCoplanar'],
  3: ['spatVolume', 'spatCoplanar', 'spatHeight'],
  4: ['spatCoplanarParam', 'spatVolumeParam', 'spatHeight'],
  5: ['spatVolumeParam', 'spatHeight', 'spatCoplanarParam'],
}

// Lage dreier Vektoren aus dem Vorzeichen des Spatprodukts (wie spitz, recht, stumpf beim Skalarprodukt)
export const ORIENTATIONS = ['Rechtssystem', 'Linkssystem', 'komplanar'] as const
const orientIndex = (s: Rational) => (ratSign(s) > 0 ? 0 : ratSign(s) < 0 ? 1 : 2)

// ------------------------------------------------------------------ Rechnen

const num = (r: Rational) => Number(r.n) / Number(r.d)
const m = ratMul
const ZERO3 = vec(0, 0, 0)

// Spatprodukt und die typischen Fehler beim Sarrus, alle linear in jedem der drei Vektoren (Spalten der Matrix)
type Triple = (a: Vec, b: Vec, c: Vec) => Rational
const prod = (xs: readonly Rational[]) => xs.reduce((acc, x) => m(acc, x), rat(1))
const sum = (xs: readonly Rational[]) => xs.reduce((acc, x) => ratAdd(acc, x), rat(0))
// Hauptdiagonalen und Nebendiagonalen der Matrix mit den Spalten a, b, c (Sarrus)
const mainDiag = (a: Vec, b: Vec, c: Vec) => [[a[0], b[1], c[2]], [b[0], c[1], a[2]], [c[0], a[1], b[2]]] as const
const antiDiag = (a: Vec, b: Vec, c: Vec) => [[c[0], b[1], a[2]], [a[0], c[1], b[2]], [b[0], a[1], c[2]]] as const
export const spatProduct: Triple = (a, b, c) => vecDot(cross(a, b), c)
// Nebendiagonalen addiert
const sarrusPlus: Triple = (a, b, c) => ratAdd(sum(mainDiag(a, b, c).map(prod)), sum(antiDiag(a, b, c).map(prod)))
// nur eine Diagonale je Richtung, wie bei einer 2×2-Matrix
const sarrusOne: Triple = (a, b, c) => ratSub(prod(mainDiag(a, b, c)[0]), prod(antiDiag(a, b, c)[0]))
// Haupt- und Nebendiagonalen vertauscht
const sarrusSwap: Triple = (a, b, c) => ratNeg(spatProduct(a, b, c))
// mittlere Komponente des Kreuzprodukts mit falschem Vorzeichen
const middleSpat: Triple = (a, b, c) => vecDot(middleSign(a, b), c)

const constant = (v: Vec): PVec => ({ base: v, slope: ZERO3 })
const unit = (j: number): Vec => vec(...[0, 1, 2].map((i) => (i === j ? 1 : 0)))
// Vektor mit dem Parameter an der Stelle j (dort steht nur der Buchstabe)
const withParam = (v: Vec, j: number): PVec => ({ base: v.map((x, i) => (i === j ? rat(0) : x)), slope: unit(j) })

// Höchstens quadratisch im Parameter (der Parameter steht in höchstens zwei der drei Vektoren): aus drei Stellen
function quadOf(f: (t: Rational) => Rational): Quad {
  const [f0, f1, fm] = [f(rat(0)), f(rat(1)), f(rat(-1))]
  return { q2: ratSub(ratDiv(ratAdd(f1, fm), rat(2)), f0), q1: ratDiv(ratSub(f1, fm), rat(2)), q0: f0 }
}
const tripleQuad = (f: Triple, A: PVec, B: PVec, C: PVec) => quadOf((t) => f(pAt(A, t), pAt(B, t), pAt(C, t)))
const sameQuad = (p: Quad, q: Quad) => [p.q2, p.q1, p.q0].every((x, i) => isZero(ratSub(x, [q.q2, q.q1, q.q0][i])))
const isConst = (q: Quad) => isZero(q.q2) && isZero(q.q1)

// Nullstellen von q2 t² + q1 t + q0 (q2 ≠ 0), wenn rational und verschieden; sonst null
function rationalRoots(q: Quad): readonly [Rational, Rational] | null {
  if (isZero(q.q2)) return null
  const disc = ratSub(m(q.q1, q.q1), m(rat(4), m(q.q2, q.q0)))
  if (ratSign(disc) <= 0) return null
  const root = sqrtRat(disc)
  if (root.rad !== 1n) return null
  const two = m(rat(2), q.q2)
  const r1 = ratDiv(ratSub(ratNeg(q.q1), root.coef), two)
  const r2 = ratDiv(ratAdd(ratNeg(q.q1), root.coef), two)
  return num(r1) < num(r2) ? [r1, r2] : [r2, r1]
}

// ------------------------------------------------------------------ LaTeX

// Faktor in einem Produkt: negative Zahlen und Summen in Klammern
const fac = (x: string) => (x.startsWith('-') || / [+-] /.test(x) ? `(${x})` : x)
const entryOf = (p: PVec, i: number, t: string) => linLatex(p.base[i], p.slope[i], t)
const pvecLatex = (p: PVec, t: string) => columnLatex([0, 1, 2].map((i) => entryOf(p, i, t)))
const spatName = (an: string, bn: string, cn: string) => `(${an} \\times ${bn}) \\cdot ${cn}`
const surdOrRat = (x: Surd | Rational) => ('rad' in x ? surdLatex(x) : ratLatex(x))

// Körper: Spat, dreiseitiges Prisma (halber Spat), Pyramide mit Parallelogramm als Grundfläche, Tetraeder
type Body = 'spat' | 'prism' | 'pyramid' | 'tetra'
const BODY_FACTOR: Readonly<Record<Body, Rational>> = { spat: rat(1), prism: rat(1, 2), pyramid: rat(1, 3), tetra: rat(1, 6) }
const BODY_BASE: Readonly<Record<Body, Shape>> = { spat: 'par', prism: 'tri', pyramid: 'par', tetra: 'tri' }
const BODY_GEN: Readonly<Record<Body, string>> = { spat: 'des Spats', prism: 'des Prismas', pyramid: 'der Pyramide', tetra: 'des Tetraeders' }
const BODY_WORD: Readonly<Record<Body, string>> = { spat: 'Spat', prism: 'Prisma', pyramid: 'Pyramide', tetra: 'Tetraeder' }
const factorLatex = (f: Rational) => (f.n === 1n && f.d === 1n ? '' : `\\frac{${f.n}}{${f.d}}\\,`)
// falscher Faktor (Körper verwechselt): Tetraeder wie Pyramide und umgekehrt, Spat und Prisma wie Tetraeder
const WRONG_FACTOR: Readonly<Record<Body, Rational>> = { spat: rat(1, 6), prism: rat(1, 6), pyramid: rat(1, 6), tetra: rat(1, 3) }

// ------------------------------------------------------------------ Schritte

// Spatprodukt mit Sarrus: Matrix mit den Spalten a, b, c, die ersten beiden Spalten noch einmal daneben
// Mit Parameter ohne „Diagonalen vertauscht": −s hat dieselben Nullstellen wie s
function sarrusStep(rng: Rng, an: string, bn: string, cn: string, A: PVec, B: PVec, C: PVec, t = 't'): GuidedStep {
  const name = spatName(an, bn, cn)
  const line = (q: Quad) => math(`${name} = ${quadLatex(q, t)}`)
  const s = tripleQuad(spatProduct, A, B, C)
  const withParam = [A, B, C].some((p) => !p.slope.every(isZero))
  const wrongs: Wrong[] = [
    ...(withParam ? [] : [{ content: line(tripleQuad(sarrusSwap, A, B, C)), rule: 'vec-sarrus-swap' }]),
    ...rng.shuffle<Wrong>([
      { content: line(tripleQuad(sarrusPlus, A, B, C)), rule: 'vec-sarrus-plus' },
      { content: line(tripleQuad(sarrusOne, A, B, C)), rule: 'vec-sarrus-one-diagonal' },
    ]),
  ]
  const M = [0, 1, 2].map((i) => [entryOf(A, i, t), entryOf(B, i, t), entryOf(C, i, t)])
  const matrix = `\\begin{pmatrix} ${M.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`
  const scheme = `\\begin{array}{rrr|rr} ${M.map((r) => [...r, r[0], r[1]].join(' & ')).join(' \\\\ ')} \\end{array}`
  const main = [[M[0][0], M[1][1], M[2][2]], [M[0][1], M[1][2], M[2][0]], [M[0][2], M[1][0], M[2][1]]]
  const anti = [[M[0][2], M[1][1], M[2][0]], [M[0][0], M[1][2], M[2][1]], [M[0][1], M[1][0], M[2][2]]]
  const prodLatex = (p: readonly string[]) => p.map(fac).join(' \\cdot ')
  const products = `${main.map(prodLatex).join(' + ')} - ${anti.map(prodLatex).join(' - ')}`
  const constants = isConst(tripleQuad(spatProduct, A, B, C)) && [A, B, C].every((p) => p.slope.every(isZero))
  // ohne Parameter: die sechs Produkte als Zahlen
  const values = constants
    ? ` = ${termsLatex([...mainDiag(A.base, B.base, C.base).map((p) => [prod(p), ''] as const), ...antiDiag(A.base, B.base, C.base).map((p) => [ratNeg(prod(p)), ''] as const)])}`
    : ''
  const result = quadLatex(s, t)
  const formula = `${name} = \\det ${matrix}`
  return choiceStep(rng, {
    id: 'spat',
    title: 'Spatprodukt mit Sarrus',
    question: `Wie groß ist $${name}$?`,
    correct: line(s),
    wrongs,
    hint: 'Das Spatprodukt ist die Determinante der Matrix mit den Spalten der drei Vektoren. Schreib die ersten beiden Spalten noch einmal daneben: drei Diagonalen nach rechts unten mit Plus, drei nach links unten mit Minus.',
    explanation: {
      detailed: `$${formula}$. Sarrus mit den ersten beiden Spalten daneben: $${scheme}$. Drei Diagonalen nach rechts unten zählen positiv, drei nach links unten negativ: $${name} = ${products}${values} = ${result}$.`,
      short: `$${name} = ${products} = ${result}$.`,
    },
    established: [`${name} = ${result}`],
    cards: [CARD.spat],
  })
}

// (a × b) · c, wenn a × b schon bekannt ist; c darf einen Parameter haben
function dotSpatStep(rng: Rng, an: string, bn: string, cn: string, a: Vec, b: Vec, C: PVec, t = 't'): GuidedStep {
  const n = cross(a, b)
  const name = spatName(an, bn, cn)
  const A = constant(a)
  const B = constant(b)
  const s = tripleQuad(spatProduct, A, B, C)
  const line = (q: Quad) => math(`${name} = ${quadLatex(q, t)}`)
  const vecLine = (p: PVec) => math(`${name} = ${pvecLatex(p, t)}`)
  // ein Summand mit falschem Vorzeichen (der erste, der nicht 0 ist)
  const terms = [0, 1, 2].map((i) => quadOf((x) => m(n[i], pAt(C, x)[i])))
  const slip = terms.findIndex((q) => !isConst(q) || !isZero(q.q0))
  const wrongs: Wrong[] = [{ content: line(tripleQuad(middleSpat, A, B, C)), rule: 'vec-cross-middle-sign' }]
  const others: Wrong[] = [
    { content: vecLine({ base: n.map((x, i) => m(x, C.base[i])), slope: n.map((x, i) => m(x, C.slope[i])) }), rule: 'vec-dot-vector' },
    { content: vecLine({ base: cross(n, C.base), slope: cross(n, C.slope) }), rule: 'vec-spat-cross-twice' },
  ]
  if (slip >= 0) {
    const q = terms[slip]
    others.push({ content: line({ q2: ratSub(s.q2, m(rat(2), q.q2)), q1: ratSub(s.q1, m(rat(2), q.q1)), q0: ratSub(s.q0, m(rat(2), q.q0)) }), rule: 'vec-dot-sign' })
  }
  wrongs.push(...rng.shuffle(others))
  const cLatex = pvecLatex(C, t)
  const termLatex = [0, 1, 2].map((i) => `${fac(ratLatex(n[i]))} \\cdot ${fac(entryOf(C, i, t))}`).join(' + ')
  const formula = `${name} = ${vecLatex(n)} \\cdot ${cLatex} = ${termLatex} = ${quadLatex(s, t)}`
  return choiceStep(rng, {
    id: 'spat',
    title: 'Spatprodukt',
    question: `Wie groß ist $${name}$?`,
    correct: line(s),
    wrongs,
    hint: `Nimm das Kreuzprodukt $${an} \\times ${bn}$ und bilde das Skalarprodukt mit $${cn}$: Einträge an derselben Stelle malnehmen und addieren.`,
    explanation: { detailed: `Skalarprodukt von $${an} \\times ${bn}$ mit $${cn}$: $${formula}$. Das Ergebnis ist ${C.slope.every(isZero) ? 'eine Zahl' : `ein Term in $${t}$`}, kein Vektor.`, short: `$${formula}$.` },
    established: [`${name} = ${quadLatex(s, t)}`],
    cards: [CARD.spat],
  })
}

// Rechtssystem, Linkssystem oder komplanar aus dem Vorzeichen des Spatprodukts
function orientStep(rng: Rng, an: string, bn: string, cn: string, s: Rational): GuidedStep {
  const idx = orientIndex(s)
  const labels = ['Rechtssystem (Spatprodukt $> 0$)', 'Linkssystem (Spatprodukt $< 0$)', 'komplanar (Spatprodukt $= 0$)']
  const wrongs: Wrong[] = labels.flatMap((label, j) => (j === idx ? [] : [{ content: label, rule: j === 2 || idx === 2 ? 'vec-spat-coplanar' : 'vec-spat-orientation' }]))
  const word = ['positiv', 'negativ', 'gleich $0$'][idx]
  const meaning = [
    `$${an}$, $${bn}$, $${cn}$ bilden in dieser Reihenfolge ein Rechtssystem (wie Daumen, Zeigefinger und Mittelfinger der rechten Hand).`,
    `$${an}$, $${bn}$, $${cn}$ bilden in dieser Reihenfolge ein Linkssystem: $${cn}$ liegt auf der anderen Seite der Ebene von $${an}$ und $${bn}$ als $${an} \\times ${bn}$.`,
    `Der Spat hat kein Volumen: Die drei Vektoren liegen in einer Ebene, sie sind komplanar.`,
  ][idx]
  return choiceStep(rng, {
    id: 'lage',
    title: 'Rechtssystem, Linkssystem oder komplanar?',
    question: `Was gilt für $${an}$, $${bn}$, $${cn}$?`,
    correct: labels[idx],
    wrongs,
    hint: 'Das Vorzeichen des Spatprodukts entscheidet: positiv heißt Rechtssystem, negativ Linkssystem, gleich $0$ heißt komplanar (alle drei in einer Ebene).',
    explanation: { detailed: `Das Spatprodukt ist ${word}. ${meaning}`, short: `Spatprodukt ${word}: ${ORIENTATIONS[idx]}.` },
    established: [`\\text{${ORIENTATIONS[idx]}}`],
    cards: [CARD.spat],
  })
}

// Volumen des Körpers aus dem Spatprodukt: Faktor mal Betrag
function volumeStep(rng: Rng, body: Body, an: string, bn: string, cn: string, a: Vec, b: Vec, c: Vec): GuidedStep {
  const s = spatProduct(a, b, c)
  const f = BODY_FACTOR[body]
  const V = m(f, ratAbs(s))
  const line = (x: Surd | Rational) => math(`V = ${surdOrRat(x)}`)
  const name = spatName(an, bn, cn)
  const wrongs: Wrong[] = []
  if (ratSign(s) < 0) wrongs.push({ content: line(m(f, s)), rule: 'vec-spat-abs' })
  const factorWrongs: Wrong[] = [{ content: line(m(WRONG_FACTOR[body], ratAbs(s))), rule: 'vec-volume-factor' }]
  if (body !== 'spat') factorWrongs.push({ content: line(ratAbs(s)), rule: 'vec-volume-no-factor' })
  const f2 = m(f, f)
  wrongs.push(
    factorWrongs[0],
    ...rng.shuffle<Wrong>([
      ...factorWrongs.slice(1),
      { content: line(sqrtRat(m(f2, m(vecNorm2(a), m(vecNorm2(b), vecNorm2(c)))))), rule: 'vec-volume-lengths' },
      { content: line(sqrtRat(m(f2, m(vecNorm2(cross(a, b)), vecNorm2(c))))), rule: 'vec-volume-slant' },
    ]),
  )
  const absLatex = ratSign(s) < 0 ? `\\lvert ${ratLatex(s)} \\rvert` : ratLatex(s)
  const formula =
    body === 'spat'
      ? `V = \\lvert ${name} \\rvert = ${ratSign(s) < 0 ? `${absLatex} = ` : ''}${ratLatex(V)}`
      : `V = ${factorLatex(f)}\\lvert ${name} \\rvert = \\frac{1}{${f.d}} \\cdot ${absLatex} = ${ratLatex(V)}`
  const why: Readonly<Record<Body, string>> = {
    spat: 'Der Betrag des Spatprodukts ist das Volumen des Spats.',
    prism: 'Das Prisma mit dem Dreieck aus den ersten beiden Vektoren als Grundfläche ist ein halber Spat.',
    pyramid: 'Eine Pyramide hat ein Drittel des Volumens des Spats mit derselben Grundfläche und Höhe.',
    tetra: 'Das Tetraeder hat die halbe Grundfläche einer Pyramide über dem Parallelogramm, also ein Sechstel des Spats.',
  }
  return choiceStep(rng, {
    id: 'volumen',
    title: 'Volumen',
    question: `Wie groß ist das Volumen $V$ ${BODY_GEN[body]}?`,
    correct: line(V),
    wrongs,
    hint: `${why[body]} Ein Volumen ist nie negativ: Nimm den Betrag.`,
    explanation: { detailed: `${why[body]} Volumen ist der Betrag: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.volumen],
  })
}

// Höhe über der Grundfläche: Spat h = V / G = |s| / |a × b|, Tetraeder h = 3V / A = |s| / |a × b| (dasselbe)
function heightStep(rng: Rng, body: 'spat' | 'tetra', an: string, bn: string, cn: string, a: Vec, b: Vec, c: Vec): GuidedStep {
  const s = spatProduct(a, b, c)
  const N = vecNorm2(cross(a, b))
  const h = sqrtRat(ratDiv(m(s, s), N))
  const line = (x: Surd | Rational) => math(`h = ${surdOrRat(x)}`)
  const name = spatName(an, bn, cn)
  const nName = `${an} \\times ${bn}`
  const G = sqrtRat(N)
  const wrongs: Wrong[] = [
    { content: line(m(BODY_FACTOR[body], ratAbs(s))), rule: 'vec-spat-height-volume' },
    { content: line(ratDiv(ratAbs(s), N)), rule: 'vec-spat-height-squared' },
  ]
  if (body === 'tetra') wrongs.unshift({ content: line({ coef: ratDiv(h.coef, rat(3)), rad: h.rad }), rule: 'vec-spat-height-third' })
  if (ratSign(s) < 0) wrongs.push({ content: line({ coef: ratNeg(h.coef), rad: h.rad }), rule: 'vec-spat-abs' })
  const tail = chain(`\\frac{${ratLatex(ratAbs(s))}}{${surdLatex(G)}}`, surdLatex(h))
  const formula =
    body === 'spat'
      ? `h = \\frac{V}{G} = \\frac{\\lvert ${name} \\rvert}{\\lvert ${nName} \\rvert} = ${tail}`
      : `h = \\frac{3V}{A} = \\frac{3 \\cdot \\frac{1}{6}\\lvert ${name} \\rvert}{\\frac{1}{2}\\lvert ${nName} \\rvert} = \\frac{\\lvert ${name} \\rvert}{\\lvert ${nName} \\rvert} = ${tail}`
  return choiceStep(rng, {
    id: 'hoehe',
    title: 'Höhe',
    question: `Wie groß ist die Höhe $h$ ${BODY_GEN[body]} über der Grundfläche?`,
    correct: line(h),
    wrongs: [wrongs[0], ...rng.shuffle(wrongs.slice(1))],
    hint:
      body === 'spat'
        ? `Volumen = Grundfläche mal Höhe. Die Grundfläche ist das Parallelogramm aus $${an}$ und $${bn}$, also $\\lvert ${nName} \\rvert$.`
        : `Volumen = $\\frac{1}{3}$ Grundfläche mal Höhe, also $h = \\frac{3V}{A}$. Die Grundfläche ist das Dreieck aus $${an}$ und $${bn}$.`,
    explanation: { detailed: `Nach der Höhe umgestellt: $${formula}$. Die Höhe ist der Abstand der Spitze von der Ebene der Grundfläche.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.hoeheSpat],
  })
}

// Verbindungsvektor zu einem Punkt mit Parameter: PS = S − P, an der Stelle j steht t − p_j
function paramConnectStep(rng: Rng, P: string, S: string, p: Vec, C: PVec, t: string): GuidedStep {
  const name = arrowName(P, S)
  const line = (q: PVec) => math(pvecLatex(q, t))
  const pS = { base: vecAdd(C.base, p), slope: C.slope }
  return choiceStep(rng, {
    id: 'verbindung',
    title: 'Verbindungsvektor',
    question: `Wie lautet ${math(name)}?`,
    correct: line(C),
    wrongs: [
      { content: line({ base: vecNeg(C.base), slope: vecNeg(C.slope) }), rule: 'vec-reversed' },
      { content: line({ base: vecAdd(pS.base, p), slope: C.slope }), rule: 'vec-added-points' },
    ],
    hint: `Spitze minus Fuß: Ortsvektor von $${S}$ minus Ortsvektor von $${P}$, Eintrag für Eintrag. Der Parameter bleibt stehen.`,
    explanation: {
      detailed: `$${name} = ${pvecLatex(pS, t)} - ${vecLatex(p)} = ${pvecLatex(C, t)}$.`,
      short: `$${name} = ${S} - ${P} = ${pvecLatex(C, t)}$.`,
    },
    established: [`${name} = ${pvecLatex(C, t)}`],
    cards: [CARD.verbindung],
  })
}

// ------------------------------------------------------------------ Bilder

const add = (p: readonly number[], q: readonly number[]) => p.map((x, i) => x + q[i])
const mid = (p: readonly number[], q: readonly number[]) => p.map((x, i) => (x + q[i]) / 2)

type BodyOpts = {
  // Fuß der drei Pfeile (erster Punkt bei Punkten)
  readonly o?: Vec
  // Namen der Ecken am Fuß und an den drei Spitzen
  readonly corners?: readonly string[]
  // mit Ergebnis: Grundfläche Phase 1, der Körper zieht sich in Phase 2 aus der Grundfläche auf
  readonly result?: boolean
  // dazu die Höhe (Phase 3) mit rechtem Winkel
  readonly height?: boolean
  // ohne c (und ohne die vierte Ecke): vor dem Ergebnis, wenn das Bild „komplanar" oder die Lage verraten würde
  readonly withoutC?: boolean
}

// a, b, c vom selben Fuß; Grundfläche aus a und b (Parallelogramm oder Dreieck). Komplanar: nur die Grundfläche
export function bodyDrawing(body: Body, names: readonly [string, string, string], a: Vec, b: Vec, c: Vec, caption: string, opts: BodyOpts = {}): VectorDrawing {
  const o = opts.o ? nums(opts.o) : [0, 0, 0]
  const [pa, pb, pc] = [nums(a), nums(b), nums(c)]
  const tri = BODY_BASE[body] === 'tri'
  const base = tri ? [o, add(o, pa), add(o, pb)] : [o, add(o, pa), add(add(o, pa), pb), add(o, pb)]
  const arrows: DrawArrow[] = [
    { from: o, to: add(o, pa), color: 'a', label: names[0] },
    { from: o, to: add(o, pb), color: 'b', label: names[1] },
    ...(opts.withoutC ? [] : [{ from: o, to: add(o, pc), color: 'c' as const, label: names[2] }]),
  ]
  const polygons: DrawPolygon[] = [{ points: base, color: 'muted', ...(opts.result ? { phase: 1 } : {}) }]
  const segments: DrawSegment[] = []
  const flat = isZero(spatProduct(a, b, c))
  if (opts.result && !flat) {
    const apex = add(o, pc)
    base.forEach((p, i) => {
      const q = base[(i + 1) % base.length]
      if (body === 'spat' || body === 'prism') polygons.push({ points: [p, q, add(q, pc), add(p, pc)], color: 'c', phase: 2, from: [p, q, q, p] })
      else polygons.push({ points: [p, q, apex], color: 'c', phase: 2, from: [p, q, mid(p, q)] })
    })
    if (body === 'spat' || body === 'prism') polygons.push({ points: base.map((p) => add(p, pc)), color: 'c', phase: 2, from: base })
    for (const p of base.slice(1)) segments.push({ from: p, to: body === 'spat' || body === 'prism' ? add(p, pc) : apex, color: 'muted', phase: 2 })
  }
  const angles = []
  if (opts.result && opts.height && !flat) {
    // Lot von der Spitze von c auf die Ebene der Grundfläche
    const n = nums(cross(a, b))
    const k = (pc[0] * n[0] + pc[1] * n[1] + pc[2] * n[2]) / (n[0] ** 2 + n[1] ** 2 + n[2] ** 2)
    const top = add(o, pc)
    const foot = top.map((x, i) => x - k * n[i])
    segments.push({ from: top, to: foot, color: 'r', label: 'h', phase: 3 })
    angles.push({ at: foot, u: top.map((x, i) => x - foot[i]), v: pa, color: 'r' as const, phase: 3 })
  }
  const points: DrawPoint[] = (opts.corners ?? []).slice(0, opts.withoutC ? 3 : 4).map((label, i) => ({ at: [o, add(o, pa), add(o, pb), add(o, pc)][i], label }))
  return { ...emptyDrawing(3, caption), arrows, segments, polygons, points, ...(angles.length ? { angles } : {}), ...(opts.result && !flat ? { playLabel: 'Aufziehen' } : {}) }
}

// ------------------------------------------------------------------ Zahlen

const PT_LETTERS = [
  ['P', 'Q', 'R', 'S'],
  ['K', 'L', 'M', 'N'],
  ['E', 'F', 'G', 'H'],
] as const

function names(rng: Rng) {
  const v = VEC_LETTERS[rng.int(0, 2)]
  const p = rng.int(0, 2)
  return { an: vecName(v[0]), bn: vecName(v[1]), cn: vecName(v[2]), key: `${v[0]}${p}`, pts: PT_LETTERS[p] }
}

// drei Vektoren, nicht komplanar, höchstens zmax Nullen je Vektor, mindestens ein negativer Eintrag, kein Vektor parallel
// zu einem anderen
function pickTriple(rng: Rng, R: number, zmax: number, maxSpat = 60): readonly [Vec, Vec, Vec] {
  for (;;) {
    const [a, b, c] = [ints(rng, 3, -R, R), ints(rng, 3, -R, R), ints(rng, 3, -R, R)]
    if ([a, b, c].some((v) => zeroCount(v) > zmax)) continue
    if (negCount(a) + negCount(b) + negCount(c) === 0) continue
    if ([cross(a, b), cross(b, c), cross(a, c)].some((v) => v.every(isZero))) continue
    const s = spatProduct(a, b, c)
    if (isZero(s) || Math.abs(num(s)) > maxSpat) continue
    return [a, b, c]
  }
}

// c = λ a + μ b (komplanar) mit kleinen Einträgen
function coplanarThird(rng: Rng, a: Vec, b: Vec, R: number): Vec | null {
  const k = rng.pick([1, -1, 2, -2])
  const l = rng.pick([1, -1, 2, -2])
  const c = vecAdd(vecScale(rat(k), a), vecScale(rat(l), b))
  return c.some((x) => Math.abs(num(x)) > R) || zeroCount(c) > 1 ? null : c
}

// Wert des Parameters für das Bild vor dem Ergebnis: keine Lösung (avoid), Spat nicht flach, keine zwei Pfeile parallel
function showValue(A: PVec, B: PVec, C: PVec, avoid: readonly Rational[] = []): Rational | null {
  for (const x of [1, 2, -1, 3, -2, 0, 4, -3].map((k) => rat(k))) {
    const [u, v, w] = [pAt(A, x), pAt(B, x), pAt(C, x)]
    if (avoid.some((y) => isZero(ratSub(x, y))) || isZero(spatProduct(u, v, w))) continue
    if ([cross(u, v), cross(v, w), cross(u, w)].some((z) => z.every(isZero))) continue
    return x
  }
  return null
}

const sgn = (s: Rational) => (ratSign(s) > 0 ? '+' : ratSign(s) < 0 ? '-' : '0')

// ------------------------------------------------------------------ Arten

// Spatprodukt: Stufe 1 über das Kreuzprodukt, Stufe 2 mit Sarrus und Rechts- oder Linkssystem
function buildSpat(rng: Rng, level: Level): Built {
  const { an, bn, cn, key } = names(rng)
  for (;;) {
    const [a, b, c] = level === 1 ? pickTriple(rng, 3, 1, 40) : pickTriple(rng, 4, 1)
    const s = spatProduct(a, b, c)
    const name = spatName(an, bn, cn)
    const ask =
      level === 1
        ? bodyDrawing('spat', [an, bn, cn], a, b, c, `Die drei Vektoren $${an}$, $${bn}$, $${cn}$ vom selben Punkt aus.`)
        : bodyDrawing('spat', [an, bn, cn], a, b, c, `Das Parallelogramm aus $${an}$ und $${bn}$. Wo $${cn}$ liegt, sagt das Spatprodukt.`, { withoutC: true })
    const steps: GuidedStep[] =
      level === 1
        ? [{ ...crossStep(rng, an, bn, a, b), drawing: ask }, dotSpatStep(rng, an, bn, cn, a, b, constant(c))]
        : [{ ...sarrusStep(rng, an, bn, cn, constant(a), constant(b), constant(c)), drawing: ask }, orientStep(rng, an, bn, cn, s)]
    if (steps.some((st) => st.choices.length < 3)) continue
    const idx = orientIndex(s)
    return {
      kind: 'spat',
      instruction:
        level === 1
          ? `Berechne das Spatprodukt $${name}$: erst das Kreuzprodukt, dann das Skalarprodukt.`
          : `Berechne das Spatprodukt $${name}$ mit der Regel von Sarrus. Bilden $${an}$, $${bn}$, $${cn}$ ein Rechtssystem oder ein Linkssystem?`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${vecLatex(c)}`,
      steps,
      cards: [CARD.spat],
      resultLatex: level === 1 ? `${name} = ${ratLatex(s)}` : `${name} = ${ratLatex(s)},\\; \\text{${ORIENTATIONS[idx]}}`,
      resultDrawing: bodyDrawing('spat', [an, bn, cn], a, b, c, `Der Betrag $${ratLatex(ratAbs(s))}$ ist das Volumen des Spats aus $${an}$, $${bn}$, $${cn}$.${ratSign(s) < 0 ? ` Das Minus heißt: $${cn}$ liegt auf der anderen Seite als $${an} \\times ${bn}$.` : ''}`, { result: true }),
      form: `spat|${level}|${key}|${signShape(a, b, c)}|${sgn(s)}|${zeroCount(cross(a, b))}`,
      data: { a: nums(a), b: nums(b), c: nums(c) },
      answer: level === 1 ? [num(s)] : [num(s), idx],
    }
  }
}

const BODIES: readonly Body[] = ['spat', 'prism', 'pyramid', 'tetra']

function bodyText(body: Body, an: string, bn: string, cn: string): string {
  switch (body) {
    case 'spat':
      return `des Spats, den $${an}$, $${bn}$ und $${cn}$ aufspannen`
    case 'prism':
      return `des dreiseitigen Prismas mit dem Dreieck aus $${an}$ und $${bn}$ als Grundfläche und der Seitenkante $${cn}$`
    case 'pyramid':
      return `der Pyramide mit dem Parallelogramm aus $${an}$ und $${bn}$ als Grundfläche und der Spitze am Ende von $${cn}$`
    case 'tetra':
      return `des Tetraeders, das $${an}$, $${bn}$ und $${cn}$ aufspannen`
  }
}

// Volumen: Stufe 1 Spat über das Kreuzprodukt, Stufe 2 alle Körper mit Sarrus, Stufe 3 Tetraeder oder Spat aus Punkten
function buildSpatVolume(rng: Rng, level: Level): Built {
  const { an, bn, cn, key, pts } = names(rng)
  const body: Body = level === 1 ? 'spat' : level === 2 ? rng.pick(BODIES) : rng.pick<Body>(['tetra', 'tetra', 'spat'])
  const fromPoints = level === 3
  const wantNegative = rng.chance(0.5)
  for (;;) {
    let [a, b, c] = level === 1 ? pickTriple(rng, 3, 1, 40) : pickTriple(rng, 4, 1)
    // das Spatprodukt ist bei der Hälfte negativ (dann zählt der Betrag)
    if ((ratSign(spatProduct(a, b, c)) < 0) !== wantNegative) [a, b] = [b, a]
    const s = spatProduct(a, b, c)
    const P = fromPoints ? ints(rng, 3, -3, 3) : undefined
    const [P1, P2, P3, P4] = pts
    const [vA, vB, vC] = fromPoints ? [arrowName(P1, P2), arrowName(P1, P3), arrowName(P1, P4)] : [an, bn, cn]
    const corners = fromPoints ? [P1, P2, P3, P4] : undefined
    const opts = { ...(P ? { o: P } : {}), ...(corners ? { corners } : {}) }
    const ask = bodyDrawing(body, [vA, vB, vC], a, b, c, fromPoints ? `Die vier Ecken im Raum.` : `Die drei Vektoren vom selben Punkt aus.`, opts)
    const steps: GuidedStep[] = []
    if (fromPoints) {
      steps.push({ ...connectStep(rng, P1, P2, P!, vecAdd(P!, a)), drawing: ask })
      steps.push(connectStep(rng, P1, P3, P!, vecAdd(P!, b)), connectStep(rng, P1, P4, P!, vecAdd(P!, c)))
    }
    if (level === 1) steps.push({ ...crossStep(rng, an, bn, a, b), drawing: ask }, dotSpatStep(rng, an, bn, cn, a, b, constant(c)))
    else {
      const ss = sarrusStep(rng, vA, vB, vC, constant(a), constant(b), constant(c))
      steps.push(fromPoints ? ss : { ...ss, drawing: ask })
    }
    steps.push(volumeStep(rng, body, vA, vB, vC, a, b, c))
    if (steps.some((st) => st.choices.length < 3)) continue
    const V = m(BODY_FACTOR[body], ratAbs(s))
    const given = fromPoints
      ? [pointLatex(P1, P!), pointLatex(P2, vecAdd(P!, a)), pointLatex(P3, vecAdd(P!, b)), pointLatex(P4, vecAdd(P!, c))].join(',\\; ')
      : `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${vecLatex(c)}`
    const instruction = fromPoints
      ? body === 'tetra'
        ? `Wie groß ist das Volumen $V$ des Tetraeders $${P1}${P2}${P3}${P4}$?`
        : `Die Kanten $${P1}${P2}$, $${P1}${P3}$ und $${P1}${P4}$ spannen einen Spat auf. Wie groß ist sein Volumen $V$?`
      : `Wie groß ist das Volumen $V$ ${bodyText(body, an, bn, cn)}?`
    return {
      kind: 'spatVolume',
      instruction,
      functionLatex: given,
      steps,
      cards: [CARD.volumen, CARD.spat],
      resultLatex: `V = ${ratLatex(V)}`,
      resultDrawing: bodyDrawing(body, [vA, vB, vC], a, b, c, `${BODY_WORD[body]} über der Grundfläche aus $${vA}$ und $${vB}$: $V = ${factorLatex(BODY_FACTOR[body])}\\lvert ${spatName(vA, vB, vC)} \\rvert = ${ratLatex(V)}$.`, { ...opts, result: true }),
      form: `spatVolume|${level}|${body}|${fromPoints ? 'pts' : 'vec'}|${key}|${signShape(a, b, c)}|${sgn(s)}`,
      data: { a: nums(a), b: nums(b), c: nums(c), body: [BODIES.indexOf(body)], ...(P ? { P: nums(P) } : {}) },
      answer: [num(V)],
    }
  }
}

// Komplanar: Stufe 2 drei Vektoren, Stufe 3 vier Punkte in einer Ebene; bei der Hälfte komplanar, sonst Rechts- oder
// Linkssystem
function buildSpatCoplanar(rng: Rng, level: Level): Built {
  const { an, bn, cn, key, pts } = names(rng)
  const fromPoints = level === 3
  const coplanar = rng.chance(0.5)
  for (;;) {
    const [a, b, c0] = pickTriple(rng, level === 2 ? 4 : 3, 1)
    const c = coplanar ? coplanarThird(rng, a, b, 8) : c0
    if (!c) continue
    const s = spatProduct(a, b, c)
    const P = fromPoints ? ints(rng, 3, -3, 3) : undefined
    const [P1, P2, P3, P4] = pts
    const [vA, vB, vC] = fromPoints ? [arrowName(P1, P2), arrowName(P1, P3), arrowName(P1, P4)] : [an, bn, cn]
    const corners = fromPoints ? [P1, P2, P3, P4] : undefined
    const opts = { ...(P ? { o: P } : {}), ...(corners ? { corners } : {}) }
    const ask = bodyDrawing('spat', [vA, vB, vC], a, b, c, fromPoints ? `Die Punkte $${P1}$, $${P2}$, $${P3}$. Ob $${P4}$ in ihrer Ebene liegt, sagt das Spatprodukt.` : `Das Parallelogramm aus $${an}$ und $${bn}$. Wo $${cn}$ liegt, sagt das Spatprodukt.`, { ...opts, withoutC: true })
    const steps: GuidedStep[] = []
    if (fromPoints) {
      steps.push({ ...connectStep(rng, P1, P2, P!, vecAdd(P!, a)), drawing: ask })
      steps.push(connectStep(rng, P1, P3, P!, vecAdd(P!, b)), connectStep(rng, P1, P4, P!, vecAdd(P!, c)))
    }
    const ss = sarrusStep(rng, vA, vB, vC, constant(a), constant(b), constant(c))
    steps.push(fromPoints ? ss : { ...ss, drawing: ask }, orientStep(rng, vA, vB, vC, s))
    if (steps.some((st) => st.choices.length < 3)) continue
    const idx = orientIndex(s)
    const given = fromPoints
      ? [pointLatex(P1, P!), pointLatex(P2, vecAdd(P!, a)), pointLatex(P3, vecAdd(P!, b)), pointLatex(P4, vecAdd(P!, c))].join(',\\; ')
      : `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${vecLatex(c)}`
    const caption = coplanar
      ? fromPoints
        ? `Alle vier Punkte liegen in einer Ebene: $${vC}$ liegt in der Ebene von $${vA}$ und $${vB}$.`
        : `$${cn}$ liegt in der Ebene von $${an}$ und $${bn}$: Der Spat ist flach, sein Volumen ist $0$.`
      : `Der Spat hat das Volumen $${ratLatex(ratAbs(s))}$, die Vektoren sind nicht komplanar.`
    return {
      kind: 'spatCoplanar',
      instruction: fromPoints
        ? `Liegen $${P1}$, $${P2}$, $${P3}$ und $${P4}$ in einer Ebene? Entscheide mit dem Spatprodukt von $${vA}$, $${vB}$, $${vC}$: Rechtssystem, Linkssystem oder komplanar?`
        : `Sind $${an}$, $${bn}$, $${cn}$ komplanar? Wenn nicht: Bilden sie ein Rechtssystem oder ein Linkssystem?`,
      functionLatex: given,
      steps,
      cards: [CARD.spat],
      resultLatex: `${spatName(vA, vB, vC)} = ${ratLatex(s)},\\; \\text{${ORIENTATIONS[idx]}}`,
      resultDrawing: bodyDrawing('spat', [vA, vB, vC], a, b, c, caption, { ...opts, result: true }),
      form: `spatCoplanar|${level}|${coplanar ? 'flat' : sgn(s)}|${key}|${signShape(a, b, c)}`,
      data: { a: nums(a), b: nums(b), c: nums(c), ...(P ? { P: nums(P) } : {}) },
      answer: [num(s), idx],
    }
  }
}

// Höhe über der Grundfläche: Stufe 3 Spat aus Vektoren, Stufe 4 Tetraeder aus Punkten, Stufe 5 dazu Fläche und Volumen
function buildSpatHeight(rng: Rng, level: Level): Built {
  const { an, bn, cn, key, pts } = names(rng)
  const body: 'spat' | 'tetra' = level === 3 ? 'spat' : 'tetra'
  const fromPoints = level >= 4
  for (;;) {
    const [a, b, c] = pickTriple(rng, level === 3 ? 3 : 4, 1)
    const s = spatProduct(a, b, c)
    const n = cross(a, b)
    const P = fromPoints ? ints(rng, 3, -3, 3) : undefined
    const [P1, P2, P3, P4] = pts
    const [vA, vB, vC] = fromPoints ? [arrowName(P1, P2), arrowName(P1, P3), arrowName(P1, P4)] : [an, bn, cn]
    const corners = fromPoints ? [P1, P2, P3, P4] : undefined
    const opts = { ...(P ? { o: P } : {}), ...(corners ? { corners } : {}) }
    const ask = bodyDrawing(body, [vA, vB, vC], a, b, c, fromPoints ? `Das Tetraeder $${P1}${P2}${P3}${P4}$ mit der Grundfläche $${P1}${P2}${P3}$.` : `Der Spat steht auf dem Parallelogramm aus $${an}$ und $${bn}$.`, opts)
    const steps: GuidedStep[] = []
    if (fromPoints) {
      steps.push({ ...connectStep(rng, P1, P2, P!, vecAdd(P!, a)), drawing: ask })
      steps.push(connectStep(rng, P1, P3, P!, vecAdd(P!, b)), connectStep(rng, P1, P4, P!, vecAdd(P!, c)))
    }
    const cs = crossStep(rng, vA, vB, a, b)
    steps.push(fromPoints ? cs : { ...cs, drawing: ask })
    if (level === 5) steps.push(areaStep(rng, 'tri', vA, vB, a, b))
    else steps.push(normStep(rng, `\\lvert ${vA} \\times ${vB} \\rvert`, n, 'grundflaeche', CARD.hoeheSpat))
    steps.push(dotSpatStep(rng, vA, vB, vC, a, b, constant(c)))
    if (level === 5) steps.push(volumeStep(rng, 'tetra', vA, vB, vC, a, b, c))
    steps.push(heightStep(rng, body, vA, vB, vC, a, b, c))
    if (steps.some((st) => st.choices.length < 3)) continue
    const h = sqrtRat(ratDiv(m(s, s), vecNorm2(n)))
    const A = sqrtRat(ratDiv(vecNorm2(n), rat(4)))
    const V = m(rat(1, 6), ratAbs(s))
    const given = fromPoints
      ? [pointLatex(P1, P!), pointLatex(P2, vecAdd(P!, a)), pointLatex(P3, vecAdd(P!, b)), pointLatex(P4, vecAdd(P!, c))].join(',\\; ')
      : `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${vecLatex(c)}`
    const instruction =
      level === 3
        ? `Der Spat aus $${an}$, $${bn}$, $${cn}$ steht auf dem Parallelogramm aus $${an}$ und $${bn}$. Wie hoch ist er?`
        : level === 4
          ? `Wie groß ist die Höhe $h$ des Tetraeders $${P1}${P2}${P3}${P4}$ über der Grundfläche $${P1}${P2}${P3}$?`
          : `Bestimme für das Tetraeder $${P1}${P2}${P3}${P4}$ die Fläche $A$ des Dreiecks $${P1}${P2}${P3}$, das Volumen $V$ und die Höhe $h$ über $${P1}${P2}${P3}$.`
    return {
      kind: 'spatHeight',
      instruction,
      functionLatex: given,
      steps,
      cards: [CARD.hoeheSpat, CARD.volumen],
      resultLatex: level === 5 ? `A = ${surdLatex(A)},\\; V = ${ratLatex(V)},\\; h = ${surdLatex(h)}` : `h = ${surdLatex(h)}`,
      resultDrawing: bodyDrawing(body, [vA, vB, vC], a, b, c, `Die Höhe $h$ ist der Abstand der Spitze ${fromPoints ? `$${P4}$` : `von $${cn}$`} von der Ebene der Grundfläche.`, { ...opts, result: true, height: true }),
      form: `spatHeight|${level}|${key}|${signShape(a, b, c)}|${sgn(s)}|${areaClass(h)}`,
      data: { a: nums(a), b: nums(b), c: nums(c), ...(P ? { P: nums(P) } : {}) },
      answer: level === 5 ? [surdValue(A), num(V), surdValue(h)] : [surdValue(h)],
    }
  }
}

// Komplanar mit Parameter: Stufe 4 Parameter in c (eine Lösung), Stufe 5 Parameter in a und c (quadratisch, zwei
// Lösungen) mit Sarrus
function buildSpatCoplanarParam(rng: Rng, level: Level): Built {
  const { an, bn, cn, key } = names(rng)
  const t = rng.pick(PARAMS)
  for (;;) {
    const [a0, b, c0] = pickTriple(rng, 4, 1)
    const jc = rng.int(0, 2)
    const C = withParam(c0, jc)
    const ja = rng.int(0, 2)
    const A = level === 5 ? withParam(a0, ja) : constant(a0)
    const B = constant(b)
    const s = tripleQuad(spatProduct, A, B, C)
    const name = spatName(an, bn, cn)
    const tLine = (x: Rational) => math(`${t} = ${ratLatex(x)}`)
    const steps: GuidedStep[] = []
    const show = showValue(A, B, C)
    if (!show) continue
    const ask = bodyDrawing('spat', [an, bn, cn], pAt(A, show), b, pAt(C, show), `Für $${t} = ${ratLatex(show)}$. Gesucht ist das $${t}$, für das $${cn}$ in der Ebene von $${an}$ und $${bn}$ liegt.`)
    let solved: readonly Rational[]
    let resultLatex: string
    if (level === 4) {
      if (isZero(s.q1) || isZero(s.q0)) continue
      const t0 = ratDiv(ratNeg(s.q0), s.q1)
      if (t0.d > 2n || Math.abs(num(t0)) > 8) continue
      steps.push({ ...crossStep(rng, an, bn, a0, b, undefined, 'kreuz', true), drawing: ask }, dotSpatStep(rng, an, bn, cn, a0, b, C, t))
      const wrongs: Wrong[] = [{ content: tLine(ratNeg(t0)), rule: 'vec-param-solve' }, { content: tLine(ratDiv(ratNeg(s.q1), s.q0)), rule: 'vec-param-solve' }]
      const mid = tripleQuad(middleSpat, A, B, C)
      if (!isZero(mid.q1)) wrongs.push({ content: tLine(ratDiv(ratNeg(mid.q0), mid.q1)), rule: 'vec-cross-middle-sign' })
      const eq = `${quadLatex(s, t)} = 0`
      steps.push(
        choiceStep(rng, {
          id: 'parameter',
          title: 'Parameter',
          question: `Für welches $${t}$ sind $${an}$, $${bn}$, $${cn}$ komplanar?`,
          correct: tLine(t0),
          wrongs,
          hint: 'Komplanar heißt: Das Spatprodukt ist $0$. Setz es gleich $0$ und löse nach dem Parameter auf.',
          explanation: { detailed: `Komplanar heißt $${name} = 0$: $${eq}$, also $${t} = ${ratLatex(t0)}$.`, short: `$${eq} \\Rightarrow ${t} = ${ratLatex(t0)}$.` },
          established: [`${eq} \\Rightarrow ${t} = ${ratLatex(t0)}`],
          cards: [CARD.spat, CARD.parameter],
        }),
      )
      solved = [t0]
      resultLatex = `${t} = ${ratLatex(t0)}`
    } else {
      const roots = rationalRoots(s)
      if (!roots || roots.some((r) => r.d > 2n || Math.abs(num(r)) > 8) || isZero(s.q0)) continue
      const [lo, hi] = roots
      steps.push({ ...sarrusStep(rng, an, bn, cn, A, B, C, t), drawing: ask })
      const sol = (x: Rational, y: Rational) => math(`${t}_1 = ${ratLatex(x)},\\; ${t}_2 = ${ratLatex(y)}`)
      const wrongs: Wrong[] = [
        { content: tLine(rng.pick([lo, hi])), rule: 'vec-one-solution' },
        { content: sol(ratNeg(hi), ratNeg(lo)), rule: 'vec-param-solve' },
      ]
      for (const [f, rule] of [[sarrusPlus, 'vec-sarrus-plus'], [sarrusOne, 'vec-sarrus-one-diagonal']] as const) {
        const other = rationalRoots(tripleQuad(f, A, B, C))
        if (other && !sameQuad(tripleQuad(f, A, B, C), s)) wrongs.push({ content: sol(other[0], other[1]), rule })
      }
      const normalForm = termsLatex([[rat(1), `${t}^2`], [ratDiv(s.q1, s.q2), t], [ratDiv(s.q0, s.q2), '']])
      steps.push(
        choiceStep(rng, {
          id: 'loesungen',
          title: 'Lösungen',
          question: `Für welche Werte von $${t}$ sind $${an}$, $${bn}$, $${cn}$ komplanar?`,
          correct: sol(lo, hi),
          wrongs,
          hint: 'Spatprodukt gleich $0$ setzen, durch die Zahl vor dem Quadrat teilen, dann pq-Formel. Es gibt zwei Lösungen.',
          explanation: {
            detailed: `Komplanar heißt $${name} = 0$: $${quadLatex(s, t)} = 0$. ${s.q2.n === 1n && s.q2.d === 1n ? '' : `Durch $${ratLatex(s.q2)}$ geteilt: $${normalForm} = 0$. `}Die pq-Formel liefert $${t}_1 = ${ratLatex(lo)}$ und $${t}_2 = ${ratLatex(hi)}$.`,
            short: `$${normalForm} = 0 \\Rightarrow ${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}$.`,
          },
          established: [`${normalForm} = 0`, `${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`],
          cards: [CARD.spat, CARD.parameter],
        }),
      )
      solved = [lo, hi]
      resultLatex = `${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`
    }
    if (steps.some((st) => st.choices.length < 3)) continue
    // an jeder Lösung bleiben die drei Vektoren paarweise nicht parallel (sonst verdeckt im Bild ein Pfeil den anderen)
    const parallelAt = (x: Rational) => {
      const [u, w] = [pAt(A, x), pAt(C, x)]
      return [cross(u, b), cross(b, w), cross(u, w)].some((v) => v.every(isZero))
    }
    if (solved.some(parallelAt)) continue
    const [at, ct] = [pAt(A, solved[0]), pAt(C, solved[0])]
    const aGiven = level === 5 ? columnLatex([0, 1, 2].map((i) => entryOf(A, i, t))) : vecLatex(a0)
    return {
      kind: 'spatCoplanarParam',
      instruction: level === 4 ? `Für welchen Wert von $${t}$ sind $${an}$, $${bn}$, $${cn}$ komplanar?` : `Für welche Werte von $${t}$ sind $${an}$, $${bn}$, $${cn}$ komplanar? Rechne mit der Regel von Sarrus.`,
      functionLatex: `${an} = ${aGiven},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${pvecLatex(C, t)}`,
      steps,
      cards: [CARD.spat, CARD.parameter],
      resultLatex,
      resultDrawing: bodyDrawing('spat', [an, bn, cn], at, b, ct, `Für $${t} = ${ratLatex(solved[0])}$ liegt $${cn}$ in der Ebene von $${an}$ und $${bn}$: Der Spat ist flach.`, { result: true }),
      form: `spatCoplanarParam|${level}|${ja}${jc}|${key}|${t}|${signShape(a0, b, c0)}|${solved.some((r) => r.d > 1n) ? 'frac' : 'int'}`,
      data: { a: nums(A.base), b: nums(b), c: nums(C.base), ja: level === 5 ? [ja] : [], jc: [jc] },
      answer: solved.map(num),
    }
  }
}

// Volumen mit Parameter: Betrag, zwei Lösungen. Stufe 4 aus Vektoren (Parameter in c), Stufe 5 Tetraeder oder Pyramide
// aus Punkten (Parameter in einer Koordinate der Spitze)
function buildSpatVolumeParam(rng: Rng, level: Level): Built {
  const { an, bn, cn, key, pts } = names(rng)
  const t = rng.pick(PARAMS)
  const body: Body = level === 4 ? rng.pick(BODIES) : rng.pick<Body>(['tetra', 'tetra', 'pyramid'])
  const fromPoints = level === 5
  const f = BODY_FACTOR[body]
  for (;;) {
    const [a, b, c0] = pickTriple(rng, 4, 1)
    const j = rng.int(0, 2)
    const P = fromPoints ? ints(rng, 3, -3, 3) : undefined
    // Spitze S mit Parameter in Koordinate j: PS hat dort t − p_j
    const C: PVec = P ? { base: c0.map((x, i) => (i === j ? ratNeg(P[i]) : x)), slope: unit(j) } : withParam(c0, j)
    const s = tripleQuad(spatProduct, constant(a), constant(b), C)
    if (isZero(s.q1)) continue
    const V = rat(rng.int(1, 6))
    const target = ratDiv(V, f)
    const t1 = ratDiv(ratSub(target, s.q0), s.q1)
    const t2 = ratDiv(ratSub(ratNeg(target), s.q0), s.q1)
    if ([t1, t2].some((x) => x.d > 2n || Math.abs(num(x)) > 9)) continue
    const [lo, hi] = num(t1) < num(t2) ? [t1, t2] : [t2, t1]
    const [P1, P2, P3, P4] = pts
    const [vA, vB, vC] = fromPoints ? [arrowName(P1, P2), arrowName(P1, P3), arrowName(P1, P4)] : [an, bn, cn]
    const corners = fromPoints ? [P1, P2, P3, P4] : undefined
    const opts = { ...(P ? { o: P } : {}), ...(corners ? { corners } : {}) }
    const show = showValue(constant(a), constant(b), C, [lo, hi])
    if (!show) continue
    const ask = bodyDrawing(body, [vA, vB, vC], a, b, pAt(C, show), `Für $${t} = ${ratLatex(show)}$; gesucht ist $${t}$ für das Volumen $${ratLatex(V)}$.`, opts)
    const steps: GuidedStep[] = []
    if (fromPoints) {
      steps.push({ ...connectStep(rng, P1, P2, P!, vecAdd(P!, a)), drawing: ask })
      steps.push(connectStep(rng, P1, P3, P!, vecAdd(P!, b)), paramConnectStep(rng, P1, P4, P!, C, t))
    }
    const cs = crossStep(rng, vA, vB, a, b, undefined, 'kreuz', true)
    steps.push(fromPoints ? cs : { ...cs, drawing: ask }, dotSpatStep(rng, vA, vB, vC, a, b, C, t))
    const lin = quadLatex(s, t)
    const name = spatName(vA, vB, vC)
    const eqLine = (lhs: string, rhs: Rational) => math(`${lhs} = ${ratLatex(rhs)}`)
    const abs = `\\lvert ${lin} \\rvert`
    const eqWrongs: Wrong[] = [{ content: eqLine(lin, target), rule: 'vec-spat-abs' }, { content: eqLine(abs, ratDiv(V, WRONG_FACTOR[body])), rule: 'vec-volume-factor' }]
    if (body !== 'spat') eqWrongs.push({ content: eqLine(abs, V), rule: 'vec-volume-no-factor' })
    const eq = `${factorLatex(f)}\\lvert ${name} \\rvert = ${ratLatex(V)}`
    steps.push(
      choiceStep(rng, {
        id: 'gleichung',
        title: 'Gleichung',
        question: `Welche Gleichung muss $${t}$ erfüllen?`,
        correct: eqLine(abs, target),
        wrongs: [eqWrongs[0], ...rng.shuffle(eqWrongs.slice(1))],
        hint: `Volumen ${BODY_GEN[body]}: $V = ${factorLatex(f)}\\lvert ${name} \\rvert$. Der Betrag bleibt stehen, das Spatprodukt darf auch negativ sein.`,
        explanation: {
          detailed: `$${eq}$, also $${abs} = ${ratLatex(target)}$.${body === 'spat' ? '' : ` Dazu beide Seiten mal $${f.d}$.`}`,
          short: `$${abs} = ${ratLatex(target)}$.`,
        },
        established: [`${abs} = ${ratLatex(target)}`],
        cards: [CARD.volumen, CARD.parameter],
      }),
    )
    const sol = (x: Rational, y: Rational) => math(`${t}_1 = ${ratLatex(x)},\\; ${t}_2 = ${ratLatex(y)}`)
    const ordered = (x: Rational, y: Rational) => (num(x) < num(y) ? sol(x, y) : sol(y, x))
    const wt = ratDiv(V, WRONG_FACTOR[body])
    const solWrongs: Wrong[] = [
      { content: math(`${t} = ${ratLatex(t1)}`), rule: 'vec-spat-abs' },
      { content: sol(ratNeg(hi), ratNeg(lo)), rule: 'vec-param-solve' },
      { content: ordered(ratDiv(ratSub(wt, s.q0), s.q1), ratDiv(ratSub(ratNeg(wt), s.q0), s.q1)), rule: 'vec-volume-factor' },
    ]
    steps.push(
      choiceStep(rng, {
        id: 'loesungen',
        title: 'Lösungen',
        question: `Für welche Werte von $${t}$ ist $V = ${ratLatex(V)}$?`,
        correct: sol(lo, hi),
        wrongs: [solWrongs[0], ...rng.shuffle(solWrongs.slice(1))],
        hint: `Ein Betrag ist $${ratLatex(target)}$, wenn das Innere $${ratLatex(target)}$ oder $${ratLatex(ratNeg(target))}$ ist: zwei Gleichungen, zwei Lösungen.`,
        explanation: {
          detailed: `$${lin} = ${ratLatex(target)}$ ergibt $${t} = ${ratLatex(t1)}$, $${lin} = ${ratLatex(ratNeg(target))}$ ergibt $${t} = ${ratLatex(t2)}$.`,
          short: `$${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}$.`,
        },
        established: [`${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`],
        cards: [CARD.volumen, CARD.parameter],
      }),
    )
    if (steps.some((st) => st.choices.length < 3)) continue
    const given = fromPoints
      ? [pointLatex(P1, P!), pointLatex(P2, vecAdd(P!, a)), pointLatex(P3, vecAdd(P!, b)), `${P4}(${[0, 1, 2].map((i) => (i === j ? t : ratLatex(vecAdd(P!, c0)[i]))).join(' \\mid ')})`].join(',\\; ')
      : `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${pvecLatex(C, t)}`
    const instruction = fromPoints
      ? body === 'tetra'
        ? `Für welche Werte von $${t}$ hat das Tetraeder $${P1}${P2}${P3}${P4}$ das Volumen $V = ${ratLatex(V)}$?`
        : `Die Pyramide hat das Parallelogramm aus $${vA}$ und $${vB}$ als Grundfläche und die Spitze $${P4}$. Für welche Werte von $${t}$ hat sie das Volumen $V = ${ratLatex(V)}$?`
      : `Für welche Werte von $${t}$ ist $V = ${ratLatex(V)}$? Gemeint ist das Volumen ${bodyText(body, an, bn, cn)}.`
    const cLo = pAt(C, lo)
    return {
      kind: 'spatVolumeParam',
      instruction,
      functionLatex: given,
      steps,
      cards: [CARD.volumen, CARD.spat],
      resultLatex: `${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`,
      resultDrawing: bodyDrawing(body, [vA, vB, vC], a, b, cLo, `Für $${t} = ${ratLatex(lo)}$ hat ${BODY_WORD[body] === 'Spat' ? 'der' : BODY_WORD[body] === 'Pyramide' ? 'die' : 'das'} ${BODY_WORD[body]} das Volumen $${ratLatex(V)}$.`, { ...opts, result: true }),
      form: `spatVolumeParam|${level}|${body}|${j}|${key}|${t}|${signShape(a, b, c0)}|${lo.d > 1n || hi.d > 1n ? 'frac' : 'int'}`,
      data: { a: nums(a), b: nums(b), c: nums(C.base), j: [j], V: [num(V)], body: [BODIES.indexOf(body)] },
      answer: [num(lo), num(hi)],
    }
  }
}

export const SPAT_BUILDERS = {
  spat: buildSpat,
  spatVolume: buildSpatVolume,
  spatCoplanar: buildSpatCoplanar,
  spatHeight: buildSpatHeight,
  spatCoplanarParam: buildSpatCoplanarParam,
  spatVolumeParam: buildSpatVolumeParam,
} satisfies Readonly<Record<string, (rng: Rng, level: Level) => Built>>

