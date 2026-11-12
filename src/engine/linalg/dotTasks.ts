import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isInteger, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type DrawAngle, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, CARD, PARAMS, choiceStep, ints, letters, math, negCount, nums, origin, signShape, zeroCount } from './taskKit.ts'
import { type Surd, type Vec, arrowName, coefLatex, columnLatex, pointLatex, ratLatex, sqrtRat, surdLatex, surdValue, vec, vecAdd, vecDot, vecLatex, vecName, vecNorm2, vecScale } from './vec.ts'

// Baukasten für den Baustein „Skalarprodukt und Winkel" der Tätigkeit „Vektoren" (M7 Schritt 2, docs/PLAN-M7.md):
// Skalarprodukt, spitz, recht oder stumpf, senkrecht mit Parameter, Winkel zwischen Vektoren und im Dreieck, Länge aus
// Längen und Winkel. Alle Zahlen rechnet die Engine exakt (vec.ts); besondere Winkel kommen aus einer Liste von Paaren
// ganzzahliger Vektoren, deren Kosinus ein Wert der Tabelle ist. Stufen wie bei „Rechnen und Länge": 1 Ebene, 2 Raum,
// 3 zwei Rechnungen zusammen, 4 mit Parameter wie in der Klausur, 5 alles ineinander.

export const DOT_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['dot', 'classify', 'perp'],
  2: ['dot', 'classify', 'perp', 'angle'],
  3: ['angle', 'triangleAngle', 'lengthAngle', 'dot'],
  4: ['perp', 'classifyParam', 'lengthAngle', 'angle'],
  5: ['perp', 'rightParam', 'lengthAngle', 'triangleAngle'],
}

// Arten des Winkels in der Reihenfolge der Antworten (auch für den freien Modus, vectorFree.ts)
export const ANGLE_TYPES = ['spitz', 'rechtwinklig', 'stumpf'] as const
const typeIndex = (d: Rational) => (ratSign(d) > 0 ? 0 : ratSign(d) === 0 ? 1 : 2)

// ------------------------------------------------------------------ Hilfen

const num = (r: Rational) => Number(r.n) / Number(r.d)
const deg = (phi: number) => `${phi}^\\circ`
// Eintrag als Faktor: negative Zahlen und Summen in Klammern
const factor = (x: string) => (x.startsWith('-') || / [+-] /.test(x) ? `(${x})` : x)
const dotTerms = (a: readonly string[], b: readonly string[]) => a.map((x, i) => `${factor(x)} \\cdot ${factor(b[i])}`).join(' + ')
// c·t mit c als ganzer Zahl: t, -t, 3t
const termT = (c: number, t: string) => (c === 1 ? t : c === -1 ? `-${t}` : `${c}${t}`)
const constPart = (k: number) => (k === 0 ? '' : ` ${k > 0 ? '+' : '-'} ${Math.abs(k)}`)
// C·t + K
const linLatex = (C: number, K: number, t: string) => (C === 0 ? String(K) : `${termT(C, t)}${constPart(K)}`)
// t² + m·t + K
const polyLatex = (m: number, K: number, t: string) => `${t}^2${m === 0 ? '' : ` ${m > 0 ? '+' : '-'} ${termT(Math.abs(m), t)}`}${constPart(K)}`
// (t − r)
const rootFactor = (r: number, t: string) => (r === 0 ? t : `(${t} ${r > 0 ? '-' : '+'} ${Math.abs(r)})`)
const ratText = (r: Rational) => ratLatex(r)

// cos φ = d / √(n2): als Zahl mal Wurzel, Wurzel im Zähler (−1/√2 = −√2/2)
export function cosSurd(d: Rational, n2: Rational): Surd {
  const s = sqrtRat(n2)
  return { coef: ratDiv(d, ratMul(s.coef, rat(s.rad))), rad: s.rad }
}

const lengthLatex = (n2: Rational) => surdLatex(sqrtRat(n2))
// Kommazahl mit einer Stelle in deutscher Schreibweise
const decimal1 = (x: number) => x.toFixed(1).replace('.', '{,}')

// Besondere Winkel: cos² = k/4 mit Vorzeichen
const SPECIAL: Readonly<Record<number, { readonly k: number; readonly sign: 1 | -1 }>> = {
  30: { k: 3, sign: 1 },
  45: { k: 2, sign: 1 },
  60: { k: 1, sign: 1 },
  120: { k: 1, sign: -1 },
  135: { k: 2, sign: -1 },
  150: { k: 3, sign: -1 },
}
const PLANE_ANGLES = [45, 135]
const SPACE_ANGLES = [30, 45, 60, 120, 135, 150]

type Pairs = Map<number, (readonly [readonly number[], readonly number[]])[]>
const PAIR_CACHE = new Map<number, Pairs>()

// Alle Paare kleiner ganzzahliger Vektoren mit besonderem Winkel (einmal gerechnet). Ebene: Einträge bis 5 ohne Null;
// Raum: bis 3, höchstens eine Null; vier Dimensionen: bis 2, höchstens zwei Nullen. Mindestens ein negativer Eintrag.
function anglePairs(dim: number): Pairs {
  const cached = PAIR_CACHE.get(dim)
  if (cached) return cached
  const R = dim === 2 ? 5 : dim === 3 ? 3 : 2
  const maxZeros = dim === 2 ? 0 : dim === 3 ? 1 : 2
  const vs: number[][] = []
  const rec = (p: number[]) => {
    if (p.length === dim) {
      if (p.filter((x) => x === 0).length <= maxZeros) vs.push(p)
      return
    }
    for (let x = -R; x <= R; x++) rec([...p, x])
  }
  rec([])
  const pairs: Pairs = new Map(SPACE_ANGLES.map((phi) => [phi, []]))
  for (const a of vs) {
    const na = a.reduce((s, x) => s + x * x, 0)
    for (const b of vs) {
      if (!a.some((x) => x < 0) && !b.some((x) => x < 0)) continue
      const d = a.reduce((s, x, i) => s + x * b[i], 0)
      if (d === 0) continue
      const nb = b.reduce((s, x) => s + x * x, 0)
      for (const phi of SPACE_ANGLES) {
        const { k, sign } = SPECIAL[phi]
        if (Math.sign(d) === sign && 4 * d * d === k * na * nb) pairs.get(phi)!.push([a, b])
      }
    }
  }
  PAIR_CACHE.set(dim, pairs)
  return pairs
}

function specialPair(rng: Rng, dim: number): { readonly a: Vec; readonly b: Vec; readonly phi: number } {
  const phi = rng.pick(dim === 2 ? PLANE_ANGLES : SPACE_ANGLES)
  const [a, b] = rng.pick(anglePairs(dim).get(phi)!)
  return { a: vec(...a), b: vec(...b), phi }
}

const drawableDim = (dim: number): dim is 2 | 3 => dim === 2 || dim === 3

// Zwei Pfeile vom Ursprung mit dem Winkel dazwischen
function pairDrawing(dim: 2 | 3, an: string, bn: string, a: Vec, b: Vec, caption: string, angleLabel?: string): VectorDrawing {
  const o = origin(dim)
  const angle: DrawAngle = { at: o, u: nums(a), v: nums(b), color: 'r', ...(angleLabel ? { label: angleLabel } : {}) }
  return {
    ...emptyDrawing(dim, caption),
    arrows: [
      { from: o, to: nums(a), color: 'a', label: an },
      { from: o, to: nums(b), color: 'b', label: bn },
    ],
    angles: [angle],
  }
}

function dotCaption(an: string, bn: string, d: Rational): string {
  const s = ratSign(d)
  const head = `$${an} \\cdot ${bn} = ${ratText(d)}$ ist`
  if (s > 0) return `${head} positiv: Der Winkel $\\varphi$ zwischen den Pfeilen ist spitz.`
  if (s < 0) return `${head} negativ: Der Winkel $\\varphi$ zwischen den Pfeilen ist stumpf.`
  return `${head} gleich $0$: Die Pfeile stehen senkrecht aufeinander.`
}

// ------------------------------------------------------------------ Schritte

// Skalarprodukt zweier Vektoren mit Zahlen
function dotStep(rng: Rng, an: string, bn: string, a: Vec, b: Vec, drawing?: VectorDrawing): GuidedStep {
  const d = vecDot(a, b)
  const prods = a.map((x, i) => ratMul(x, b[i]))
  const wrongs: Wrong[] = [{ content: math(vecLatex(prods)), rule: 'vec-dot-vector' }]
  const slip = prods.findIndex((p, i) => !isZero(p) && (ratSign(a[i]) < 0 || ratSign(b[i]) < 0))
  if (slip >= 0) wrongs.push({ content: math(ratText(ratSub(d, ratMul(rat(2), prods[slip])))), rule: 'vec-dot-sign' })
  const n = a.length
  wrongs.push({ content: math(ratText(a.reduce((s, x, i) => ratAdd(s, ratMul(x, b[n - 1 - i])), rat(0)))), rule: 'vec-dot-cross' })
  wrongs.push({ content: math(ratText(a.reduce((s, x, i) => ratAdd(s, ratAdd(x, b[i])), rat(0)))), rule: 'vec-dot-sum' })
  const formula = `${an} \\cdot ${bn} = ${dotTerms(a.map(ratLatex), b.map(ratLatex))} = ${ratText(d)}`
  return choiceStep(rng, {
    id: 'skalarprodukt',
    title: 'Skalarprodukt',
    question: `Wie groß ist $${an} \\cdot ${bn}$?`,
    correct: math(ratText(d)),
    wrongs,
    hint: 'Nimm die Einträge an derselben Stelle mal und addiere die Produkte.',
    explanation: { detailed: `Eintrag für Eintrag malnehmen, dann addieren: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.skalar],
    ...(drawing ? { drawing } : {}),
  })
}

// Längen zweier Vektoren in einem Schritt
function lengthsStep(rng: Rng, names: readonly [string, string], vs: readonly [Vec, Vec]): GuidedStep {
  const line = (vals: readonly string[]) => math(vals.map((x, i) => `\\lvert ${names[i]} \\rvert = ${x}`).join(',\\; '))
  const wrongs: Wrong[] = [
    { content: line(vs.map((v) => ratLatex(vecNorm2(v)))), rule: 'vec-length-no-root' },
    { content: line(vs.map((v) => ratLatex(v.reduce((s, x) => ratAdd(s, ratAbs(x)), rat(0))))), rule: 'vec-length-abs-sum' },
  ]
  const signed = vs.map((v) => v.reduce((s, x) => ratAdd(s, ratSign(x) < 0 ? ratNeg(ratMul(x, x)) : ratMul(x, x)), rat(0)))
  if (vs.some((v) => negCount(v) > 0) && signed.every((x) => ratSign(x) > 0)) wrongs.push({ content: line(signed.map((x) => lengthLatex(x))), rule: 'vec-square-sign' })
  const squares = (v: Vec) => v.map((x) => `${x.n < 0n ? `(${ratLatex(x)})` : ratLatex(x)}^2`).join(' + ')
  const forms = vs.map((v, i) => {
    const direct = `\\sqrt{${ratLatex(vecNorm2(v))}}`
    const simple = lengthLatex(vecNorm2(v))
    return `\\lvert ${names[i]} \\rvert = \\sqrt{${squares(v)}} = ${direct === simple ? direct : `${direct} = ${simple}`}`
  })
  return choiceStep(rng, {
    id: 'laengen',
    title: 'Längen',
    question: `Wie lang sind $${names[0]}$ und $${names[1]}$?`,
    correct: line(vs.map((v) => lengthLatex(vecNorm2(v)))),
    wrongs,
    hint: 'Je Vektor: Einträge quadrieren, addieren, Wurzel ziehen.',
    explanation: { detailed: `Pythagoras für beide: $${forms[0]}$ und $${forms[1]}$.`, short: `$${forms[0]}$, $${forms[1]}$.` },
    established: forms,
    cards: [CARD.laenge],
  })
}

// cos φ aus Skalarprodukt und den Quadraten der Längen
function cosStep(rng: Rng, an: string, bn: string, d: Rational, n2a: Rational, n2b: Rational, approx: boolean): GuidedStep {
  const cos = cosSurd(d, ratMul(n2a, n2b))
  const la = lengthLatex(n2a)
  const lb = lengthLatex(n2b)
  const wrongs: Wrong[] = [
    { content: math(ratText(ratDiv(d, ratMul(n2a, n2b)))), rule: 'vec-cos-squared' },
    { content: math(surdLatex(cosSurd(d, n2a))), rule: 'vec-cos-one-length' },
    { content: math(surdLatex(cosSurd(d, n2b))), rule: 'vec-cos-one-length' },
  ]
  const formula = `\\cos\\varphi = \\frac{${an} \\cdot ${bn}}{\\lvert ${an} \\rvert \\, \\lvert ${bn} \\rvert} = \\frac{${ratText(d)}}{${la} \\cdot ${lb}} = ${surdLatex(cos)}`
  const value = surdValue(cos)
  const more = approx ? ` Mit dem Taschenrechner: $\\varphi = \\arccos\\left(${surdLatex(cos)}\\right) \\approx ${decimal1((Math.acos(value) * 180) / Math.PI)}^\\circ$.` : ''
  return choiceStep(rng, {
    id: 'kosinus',
    title: 'Kosinus',
    question: `Wie groß ist $\\cos\\varphi$?`,
    correct: math(surdLatex(cos)),
    wrongs,
    hint: 'Teile das Skalarprodukt durch das Produkt der beiden Längen und vereinfache.',
    explanation: { detailed: `Aus $${an} \\cdot ${bn} = \\lvert ${an} \\rvert \\, \\lvert ${bn} \\rvert \\cos\\varphi$ folgt $${formula}$.${more}`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.winkel],
  })
}

const TABLE_SWAP: Readonly<Record<number, number>> = { 30: 45, 45: 60, 60: 45, 120: 135, 135: 120, 150: 135 }

// Winkel aus dem Kosinus (besonderer Wert)
function angleStep(rng: Rng, cos: Surd, phi: number, first: readonly Wrong[] = []): GuidedStep {
  const c = surdLatex(cos)
  const line = (x: number) => math(`\\varphi = ${deg(x)}`)
  const wrongs: Wrong[] = [
    ...first,
    { content: line(180 - phi), rule: 'vec-angle-supplement' },
    { content: line(90 - phi), rule: 'vec-angle-arcsin' },
    { content: line(TABLE_SWAP[phi]), rule: 'vec-angle-table' },
  ]
  const obtuse = phi > 90 ? ` Der Kosinus ist negativ, also ist der Winkel stumpf: $${deg(180 - phi)}$ hat den Kosinus $${c.replace(/^-/, '')}$, gesucht ist der Nebenwinkel.` : ''
  return choiceStep(rng, {
    id: 'winkel',
    title: 'Winkel',
    question: 'Wie groß ist der Winkel $\\varphi$?',
    correct: line(phi),
    wrongs,
    hint: 'Lies den Winkel aus der Tabelle der besonderen Werte ab. Ein negativer Kosinus gehört zu einem stumpfen Winkel.',
    explanation: { detailed: `$\\varphi = \\arccos\\left(${c}\\right) = ${deg(phi)}$.${obtuse}`, short: `$\\varphi = \\arccos\\left(${c}\\right) = ${deg(phi)}$.` },
    established: [`\\varphi = ${deg(phi)}`],
    cards: [CARD.winkel],
  })
}

// spitz, recht oder stumpf aus dem Vorzeichen des Skalarprodukts
function classifyStep(rng: Rng, an: string, bn: string, d: Rational, viaCos = false): GuidedStep {
  const idx = typeIndex(d)
  const labels = ['spitz ($\\varphi < 90^\\circ$)', 'rechtwinklig ($\\varphi = 90^\\circ$)', 'stumpf ($\\varphi > 90^\\circ$)']
  const wrongs: Wrong[] = labels.flatMap((label, j) => (j === idx ? [] : [{ content: label, rule: j === 1 || idx === 1 ? 'vec-angle-zero' : 'vec-angle-sign' }]))
  if (idx === 1) wrongs.push({ content: 'parallel ($\\varphi = 0^\\circ$)', rule: 'vec-angle-zero' })
  const word = ['positiv', 'gleich $0$', 'negativ'][idx]
  const what = viaCos ? '$\\cos\\varphi$' : `$${an} \\cdot ${bn} = ${ratText(d)}$`
  return choiceStep(rng, {
    id: 'art',
    title: 'Spitz, recht oder stumpf?',
    question: `Welchen Winkel schließen $${an}$ und $${bn}$ ein?`,
    correct: labels[idx],
    wrongs,
    hint: 'Das Vorzeichen des Skalarprodukts ist das Vorzeichen von $\\cos\\varphi$: positiv heißt spitz, gleich $0$ heißt senkrecht, negativ heißt stumpf.',
    explanation: {
      detailed: `${what} ist ${word}. Weil die Längen positiv sind, hat $\\cos\\varphi$ dasselbe Vorzeichen wie das Skalarprodukt: Der Winkel ist ${ANGLE_TYPES[idx]}.`,
      short: `${what} ist ${word}: ${ANGLE_TYPES[idx]}.`,
    },
    established: [`\\text{${ANGLE_TYPES[idx]}}`],
    cards: [CARD.senkrecht],
  })
}

// Zwei Lösungen einer quadratischen Gleichung t² + m·t + K = 0 mit ganzen Lösungen r1 < r2
function quadStep(rng: Rng, t: string, r1: number, r2: number, m: number, K: number): GuidedStep {
  const sol = `${t}_1 = ${r1},\\; ${t}_2 = ${r2}`
  const wrongs: Wrong[] = [
    { content: math(`${t} = ${r2}`), rule: 'vec-one-solution' },
    { content: math(`${t} = ${r1}`), rule: 'vec-one-solution' },
  ]
  if (m !== 0) wrongs.push({ content: math(`${t}_1 = ${-r2},\\; ${t}_2 = ${-r1}`), rule: 'vec-param-solve' })
  const poly = polyLatex(m, K, t)
  return choiceStep(rng, {
    id: 'loesungen',
    title: 'Lösungen',
    question: `Für welche Werte von $${t}$ gilt das?`,
    correct: math(sol),
    wrongs,
    hint:
      m === 0
        ? `Bring die Zahl nach rechts und ziehe die Wurzel. Denk an beide Vorzeichen.`
        : `pq-Formel: $${t}_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q}$, oder in zwei Faktoren zerlegen.`,
    explanation: {
      detailed: `$${poly} = ${rootFactor(r1, t)}${rootFactor(r2, t)} = 0$, also $${sol}$. Probe: Einsetzen ergibt jeweils $0$.`,
      short: `$${rootFactor(r1, t)}${rootFactor(r2, t)} = 0$: $${sol}$.`,
    },
    established: [sol],
    cards: [CARD.senkrecht],
  })
}

// ------------------------------------------------------------------ Arten

// Skalarprodukt: Stufe 1 in der Ebene, Stufe 2 im Raum, Stufe 3 mit einer Summe davor
function buildDot(rng: Rng, level: Level): Built {
  if (level >= 3) return buildDotCombo(rng)
  const dim = level === 1 ? 2 : 3
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  for (;;) {
    const a = ints(rng, dim, -6, 6)
    const b = ints(rng, dim, -6, 6)
    if (zeroCount(a) > dim - 2 || zeroCount(b) > dim - 2 || negCount(a) + negCount(b) === 0) continue
    const step = dotStep(rng, an, bn, a, b, pairDrawing(dim, an, bn, a, b, `Die Pfeile $${an}$ und $${bn}$ mit dem Winkel $\\varphi$ zwischen ihnen.`, '\\varphi'))
    if (step.choices.length < 4) continue
    const d = vecDot(a, b)
    return {
      kind: 'dot',
      instruction: `Berechne das Skalarprodukt $${an} \\cdot ${bn}$.`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)}`,
      steps: [step],
      cards: [CARD.skalar],
      resultLatex: `${an} \\cdot ${bn} = ${ratText(d)}`,
      resultDrawing: pairDrawing(dim, an, bn, a, b, dotCaption(an, bn, d), ratSign(d) === 0 ? deg(90) : '\\varphi'),
      form: `dot|${dim}|${vecs[0]}|${signShape(a, b)}|${ratSign(d)}`,
      data: { a: nums(a), b: nums(b) },
      answer: [num(d)],
    }
  }
}

// (a + k·b) · c bzw. a · (b + k·c): erst zusammenfassen, dann das Skalarprodukt
function buildDotCombo(rng: Rng): Built {
  const dim = rng.pick([2, 3])
  const { vecs } = letters(rng)
  const [A, B, C] = vecs.map(vecName)
  for (;;) {
    const a = ints(rng, dim, -4, 4)
    const b = ints(rng, dim, -4, 4)
    const c = ints(rng, dim, -4, 4)
    if ([a, b, c].some((v) => zeroCount(v) > dim - 2) || negCount(b) === 0) continue
    const k = rng.pick([2, 3, -2, -3])
    const left = rng.chance(0.5)
    // u = x + k·y wird zuerst ausgerechnet
    const [x, y, other] = left ? [a, b, c] : [b, c, a]
    const [xn, yn, on] = left ? [A, B, C] : [B, C, A]
    const u = vecAdd(x, vecScale(rat(k), y))
    const sum = `${xn} ${coefLatex(rat(k), false)}${yn}`
    const neg = y.findIndex((v) => ratSign(v) < 0)
    const wrongs: Wrong[] = [
      { content: math(vecLatex(x.map((v, i) => ratAdd(v, i === 0 ? ratMul(rat(k), y[i]) : y[i])))), rule: 'vec-scale-first' },
      { content: math(vecLatex(u.map((v, i) => (i === neg ? ratSub(v, ratMul(rat(2 * k), y[i])) : v)))), rule: 'vec-sign-slip' },
      { content: math(vecLatex(x.map((v, i) => ratAdd(v, i === dim - 1 ? ratMul(rat(k), y[i]) : y[i])))), rule: 'vec-scale-first' },
    ]
    const step1 = choiceStep(rng, {
      id: 'summe',
      title: 'Zusammenfassen',
      question: `Was ist $${sum}$?`,
      correct: math(vecLatex(u)),
      wrongs,
      hint: `Erst jeden Eintrag von $${yn}$ mit $${k}$ malnehmen, dann Eintrag für Eintrag addieren.`,
      explanation: { detailed: `$${sum} = ${vecLatex(x)} ${k < 0 ? '-' : '+'} ${Math.abs(k)}${vecLatex(y)} = ${vecLatex(u)}$.`, short: `$${sum} = ${vecLatex(u)}$.` },
      established: [`${sum} = ${vecLatex(u)}`],
      cards: [CARD.rechnen],
    })
    const un = `(${sum})`
    const [pn, qn, p, q] = left ? [un, on, u, other] : [on, un, other, u]
    const step2 = dotStep(rng, pn, qn, p, q)
    if (step1.choices.length < 3 || step2.choices.length < 4) continue
    const d = vecDot(p, q)
    return {
      kind: 'dot',
      instruction: `Berechne $${pn} \\cdot ${qn}$.`,
      functionLatex: `${A} = ${vecLatex(a)},\\; ${B} = ${vecLatex(b)},\\; ${C} = ${vecLatex(c)}`,
      steps: [step1, step2],
      cards: [CARD.rechnen, CARD.skalar],
      resultLatex: `${pn} \\cdot ${qn} = ${ratText(d)}`,
      resultDrawing: drawableDim(dim) ? pairDrawing(dim, pn, qn, p, q, dotCaption(pn, qn, d), ratSign(d) === 0 ? deg(90) : '\\varphi') : undefined,
      form: `dot|${dim}|${left ? 'left' : 'right'}|${k}|${vecs[0]}|${signShape(a, b, c)}`,
      data: { a: nums(a), b: nums(b), c: nums(c), k: [k], left: [left ? 1 : 0] },
      answer: [num(d)],
    }
  }
}

// Ein Vektor senkrecht zu a mit kleinen Einträgen (null, wenn keiner gefunden)
function perpendicularTo(rng: Rng, a: Vec): Vec | null {
  if (a.length === 2) {
    const g = gcd(Math.abs(Number(a[0].n)), Math.abs(Number(a[1].n)))
    const base = vec(-Number(a[1].n) / g, Number(a[0].n) / g)
    const m = rng.pick([1, -1, 2, -2].filter((k) => base.every((x) => Math.abs(k * num(x)) <= 8)).concat([1]))
    return vecScale(rat(m), base)
  }
  for (let i = 0; i < 400; i++) {
    const b = ints(rng, a.length, -4, 4)
    if (zeroCount(b) <= 1 && isZero(vecDot(a, b))) return b
  }
  return null
}
const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y))

// Spitz, recht oder stumpf? Erst das Skalarprodukt, dann das Vorzeichen deuten
function buildClassify(rng: Rng, level: Level): Built {
  const dim = level === 1 ? 2 : 3
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  const s = rng.pick([1, 1, 0, -1, -1])
  for (;;) {
    const a = ints(rng, dim, -5, 5)
    if (zeroCount(a) > dim - 2) continue
    const b = s === 0 ? perpendicularTo(rng, a) : ints(rng, dim, -5, 5)
    if (!b || zeroCount(b) > dim - 2 || negCount(a) + negCount(b) === 0) continue
    const d = vecDot(a, b)
    if (ratSign(d) !== s) continue
    const steps = [dotStep(rng, an, bn, a, b), classifyStep(rng, an, bn, d)]
    if (steps[0].choices.length < 4) continue
    const idx = typeIndex(d)
    return {
      kind: 'classify',
      instruction: `Ist der Winkel zwischen $${an}$ und $${bn}$ spitz, recht oder stumpf?`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)}`,
      steps,
      cards: [CARD.skalar, CARD.senkrecht],
      resultLatex: `${an} \\cdot ${bn} = ${ratText(d)},\\; \\text{${ANGLE_TYPES[idx]}}`,
      resultDrawing: pairDrawing(dim, an, bn, a, b, dotCaption(an, bn, d), idx === 1 ? deg(90) : '\\varphi'),
      form: `classify|${dim}|${s}|${vecs[0]}|${signShape(a, b)}`,
      data: { a: nums(a), b: nums(b) },
      answer: [num(d), idx],
    }
  }
}

// Gleichung C·t + K = 0 für senkrecht mit falschen Antworten
function perpEquationStep(rng: Rng, t: string, an: string, bn: string, terms: string, C: number, K: number, slipK: number | null): GuidedStep {
  const lin = linLatex(C, K, t)
  const wrongs: Wrong[] = [{ content: math(`${lin} = 1`), rule: 'vec-perp-one' }]
  wrongs.push({ content: math(`${slipK !== null ? linLatex(C, slipK, t) : linLatex(-C, K, t)} = 0`), rule: 'vec-dot-sign' })
  return choiceStep(rng, {
    id: 'gleichung',
    title: 'Gleichung',
    question: `Welche Gleichung muss $${t}$ erfüllen, damit $${an} \\perp ${bn}$ gilt?`,
    correct: math(`${lin} = 0`),
    wrongs,
    hint: 'Senkrecht heißt: Skalarprodukt gleich $0$. Rechne das Skalarprodukt mit dem Parameter aus und fasse zusammen.',
    explanation: { detailed: `Senkrecht heißt Skalarprodukt $0$: $${an} \\cdot ${bn} = ${terms} = ${lin}$, also $${lin} = 0$.`, short: `$${an} \\cdot ${bn} = ${lin} = 0$.` },
    established: [`${an} \\cdot ${bn} = ${terms} = ${lin}`, `${lin} = 0`],
    cards: [CARD.senkrecht],
  })
}

// Für welches t stehen a und b senkrecht? Stufe 1 Ebene, 2 Raum, 4 Parameter in beiden Vektoren (auch Brüche),
// Stufe 5 quadratisch (zwei Lösungen)
export function buildPerp(rng: Rng, level: Level): Built {
  if (level === 5) return buildPerpQuadratic(rng)
  const dim = level === 1 ? 2 : level === 2 ? 3 : rng.pick([3, 4])
  const t = rng.pick(PARAMS)
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  for (;;) {
    // Konstanten p und Faktoren q vor t je Eintrag
    const pa = Array.from({ length: dim }, () => rng.int(-5, 5))
    const pb = Array.from({ length: dim }, () => rng.int(-5, 5))
    const qa = Array.from({ length: dim }, () => 0)
    const qb = Array.from({ length: dim }, () => 0)
    const ib = rng.int(0, dim - 1)
    qb[ib] = rng.pick([1, 1, 2, -1, 3, -2])
    pb[ib] = 0
    let ia = -1
    if (level === 4) {
      ia = rng.pick(Array.from({ length: dim }, (_, i) => i).filter((i) => i !== ib))
      qa[ia] = rng.pick([1, 2, -1, 3])
      pa[ia] = 0
    }
    const fixed = Array.from({ length: dim }, (_, i) => i).filter((i) => i !== ia && i !== ib)
    if (fixed.filter((i) => pa[i] === 0 || pb[i] === 0).length > (dim === 2 ? 0 : 1)) continue
    if (pa[ib] === 0 || (ia >= 0 && pb[ia] === 0)) continue
    if (![...pa, ...pb].some((x) => x < 0)) continue
    const C = pa.reduce((s, x, i) => s + x * qb[i] + qa[i] * pb[i], 0)
    const K = pa.reduce((s, x, i) => s + x * pb[i], 0)
    if (C === 0 || K === 0) continue
    const t0 = rat(-K, C)
    if (Math.abs(num(t0)) > 10 || t0.d > 9n) continue
    if (level < 4 && !isInteger(t0)) continue
    if (level === 4 && isInteger(t0) && rng.chance(0.6)) continue
    const ea = pa.map((x, i) => (qa[i] !== 0 ? termT(qa[i], t) : String(x)))
    const eb = pb.map((x, i) => (qb[i] !== 0 ? termT(qb[i], t) : String(x)))
    const terms = dotTerms(ea, eb)
    const slip = fixed.find((i) => pa[i] * pb[i] !== 0 && (pa[i] < 0 || pb[i] < 0))
    const step1 = perpEquationStep(rng, t, an, bn, terms, C, K, slip === undefined ? null : K - 2 * pa[slip] * pb[slip])
    const tL = ratText(t0)
    const step2 = choiceStep(rng, {
      id: 'parameter',
      title: `Wert von ${t === '\\lambda' ? 'λ' : t}`,
      question: `Welcher Wert von $${t}$ löst die Gleichung?`,
      correct: math(`${t} = ${tL}`),
      wrongs: [
        { content: math(`${t} = ${ratText(rat(K, C))}`), rule: 'vec-param-solve' },
        { content: math(`${t} = ${ratText(rat(-C, K))}`), rule: 'vec-param-solve' },
        { content: math(`${t} = ${ratText(rat(1 - K, C))}`), rule: 'vec-perp-one' },
      ],
      hint: `Bring die Zahl ohne $${t}$ auf die andere Seite und teile durch die Zahl vor $${t}$.`,
      explanation: { detailed: `$${termT(C, t)} = ${-K}$, also $${t} = ${tL}$. Probe: Einsetzen ergibt $0$.`, short: `$${t} = ${tL}$.` },
      established: [`${t} = ${tL}`],
      cards: [CARD.senkrecht],
    })
    if (step1.choices.length < 3 || step2.choices.length < 3) continue
    const av = pa.map((x, i) => ratAdd(rat(x), ratMul(rat(qa[i]), t0)))
    const bv = pb.map((x, i) => ratAdd(rat(x), ratMul(rat(qb[i]), t0)))
    if (av.every(isZero) || bv.every(isZero)) continue
    const drawing = drawableDim(dim) ? pairDrawing(dim, an, bn, av, bv, `Für $${t} = ${tL}$ steht $${an}$ senkrecht auf $${bn}$.`, deg(90)) : undefined
    return {
      kind: 'perp',
      instruction: `Für welchen Wert von $${t}$ stehen $${an}$ und $${bn}$ senkrecht aufeinander?`,
      functionLatex: `${an} = ${columnLatex(ea)},\\; ${bn} = ${columnLatex(eb)}`,
      steps: [step1, step2],
      cards: [CARD.skalar, CARD.senkrecht],
      resultLatex: `${t} = ${tL}`,
      ...(drawing ? { resultDrawing: drawing } : {}),
      ...(dim > 3 ? { note: 'In mehr als drei Dimensionen gibt es kein Bild, gerechnet wird genauso.' } : {}),
      form: `perp|${dim}|${ib}${ia >= 0 ? ia : ''}|${qb[ib]}|${t}|${isInteger(t0) ? 'int' : 'frac'}|${ratSign(t0)}|${vecs[0]}`,
      data: { pa, qa, pb, qb },
      answer: [num(t0)],
    }
  }
}

// Teiler d von R mit |d| und |R/d| höchstens max, mit zufälligem Vorzeichen
function splitProduct(rng: Rng, R: number, max: number): readonly [number, number] | null {
  const ds = Array.from({ length: max }, (_, i) => i + 1).filter((d) => R % d === 0 && Math.abs(R / d) <= max)
  if (ds.length === 0) return null
  const d = rng.pick(ds) * (rng.chance(0.5) ? -1 : 1)
  return [d, R / d]
}

// Gleichung t² + m·t + K = 0 mit falschen Antworten
function quadEquationStep(rng: Rng, t: string, question: string, terms: string, lhsName: string, m: number, K: number, hint: string): GuidedStep {
  const poly = polyLatex(m, K, t)
  const wrongs: Wrong[] = [{ content: math(`${poly} = 1`), rule: 'vec-perp-one' }]
  wrongs.push({ content: math(`${m !== 0 ? polyLatex(-m, K, t) : polyLatex(0, -K, t)} = 0`), rule: 'vec-dot-sign' })
  if (m + 2 !== 0) wrongs.push({ content: math(`${linLatex(m + 2, K, t)} = 0`), rule: 'vec-square-double' })
  return choiceStep(rng, {
    id: 'gleichung',
    title: 'Gleichung',
    question,
    correct: math(`${poly} = 0`),
    wrongs,
    hint,
    explanation: { detailed: `$${lhsName} = ${terms} = ${poly}$, und das muss $0$ sein.`, short: `$${poly} = 0$.` },
    established: [`${lhsName} = ${terms} = ${poly}`, `${poly} = 0`],
    cards: [CARD.senkrecht],
  })
}

// Stufe 5: t steht in beiden Vektoren an derselben Stelle, das Skalarprodukt ist quadratisch in t
function buildPerpQuadratic(rng: Rng): Built {
  const t = rng.pick(PARAMS)
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  for (;;) {
    const r1 = rng.int(-6, 5)
    const r2 = rng.int(r1 + 1, 6)
    if (r1 === 0 || r2 === 0) continue
    const m = -(r1 + r2)
    const K = r1 * r2
    const i = rng.int(0, 2)
    const [j, k] = [0, 1, 2].filter((x) => x !== i)
    const pa = [0, 0, 0]
    const pb = [0, 0, 0]
    pa[j] = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
    pb[j] = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
    const split = splitProduct(rng, K - pa[j] * pb[j], 7)
    if (!split) continue
    ;[pa[k], pb[k]] = split
    pb[i] = m
    if (![...pa, ...pb].some((x) => x < 0)) continue
    const qa = [0, 0, 0].map((_, x) => (x === i ? 1 : 0))
    const qb = qa
    const ea = pa.map((x, n) => (n === i ? t : String(x)))
    const eb = pb.map((x, n) => (n === i ? `${t}${constPart(m)}` : String(x)))
    const terms = dotTerms(ea, eb)
    const step1 = quadEquationStep(rng, t, `Welche Gleichung muss $${t}$ erfüllen, damit $${an} \\perp ${bn}$ gilt?`, terms, `${an} \\cdot ${bn}`, m, K, 'Senkrecht heißt Skalarprodukt $0$. Multipliziere den Eintrag mit $' + t + '$ aus und fasse zusammen.')
    const step2 = quadStep(rng, t, r1, r2, m, K)
    if (step1.choices.length < 3 || step2.choices.length < 3) continue
    const at = (r: number) => [vec(...pa.map((x, n) => x + qa[n] * r)), vec(...pb.map((x, n) => x + qb[n] * r))] as const
    const [a1, b1] = at(r1)
    const [a2, b2] = at(r2)
    const o = origin(3)
    const drawing: VectorDrawing = {
      ...emptyDrawing(3, `Für $${t} = ${r1}$ (blau und orange) und für $${t} = ${r2}$ (violett und blaugrün) stehen die Pfeile senkrecht aufeinander.`),
      arrows: [
        { from: o, to: nums(a1), color: 'a', label: an, phase: 1 },
        { from: o, to: nums(b1), color: 'b', label: bn, phase: 1 },
        { from: o, to: nums(a2), color: 'r', phase: 2 },
        { from: o, to: nums(b2), color: 'c', phase: 2 },
      ],
      angles: [
        { at: o, u: nums(a1), v: nums(b1), color: 'b', phase: 1 },
        { at: o, u: nums(a2), v: nums(b2), color: 'c', phase: 2 },
      ],
    }
    return {
      kind: 'perp',
      instruction: `Für welche Werte von $${t}$ stehen $${an}$ und $${bn}$ senkrecht aufeinander?`,
      functionLatex: `${an} = ${columnLatex(ea)},\\; ${bn} = ${columnLatex(eb)}`,
      steps: [step1, step2],
      cards: [CARD.skalar, CARD.senkrecht],
      resultLatex: `${t}_1 = ${r1},\\; ${t}_2 = ${r2}`,
      resultDrawing: drawing,
      form: `perp|3|q${i}|${m === 0 ? 'pm' : Math.sign(m)}|${t}|${vecs[0]}|${signShape(vec(...pa), vec(...pb))}`,
      data: { pa, qa, pb, qb },
      answer: [r1, r2],
    }
  }
}

// Winkel zwischen zwei Vektoren: besonderer Wert (Grad) oder cos φ mit spitz, recht oder stumpf
function buildAngle(rng: Rng, level: Level): Built {
  const general = level >= 3 && rng.chance(0.5)
  const dim = level === 2 ? 3 : level === 3 ? (general ? 3 : rng.pick([2, 3])) : general ? rng.pick([3, 4]) : 4
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  for (;;) {
    let a: Vec
    let b: Vec
    let phi = 0
    if (general) {
      const R = dim === 4 ? 3 : 4
      a = ints(rng, dim, -R, R)
      b = ints(rng, dim, -R, R)
      if (zeroCount(a) > 1 || zeroCount(b) > 1 || negCount(a) + negCount(b) === 0) continue
      const d = vecDot(a, b)
      const p = ratMul(vecNorm2(a), vecNorm2(b))
      if (isZero(d) || p.n > 300n) continue
      const c2 = ratDiv(ratMul(d, d), p)
      if ([rat(1, 4), rat(1, 2), rat(3, 4), rat(1)].some((x) => x.n === c2.n && x.d === c2.d)) continue
    } else {
      ;({ a, b, phi } = specialPair(rng, dim))
    }
    const d = vecDot(a, b)
    const n2a = vecNorm2(a)
    const n2b = vecNorm2(b)
    const cos = cosSurd(d, ratMul(n2a, n2b))
    const pic = drawableDim(dim)
    const steps = [
      // Bei „spitz oder stumpf" kein Bild vor dem Ergebnis: Es verriete die Antwort
      dotStep(rng, an, bn, a, b, pic && !general ? pairDrawing(dim, an, bn, a, b, `Gesucht ist der Winkel $\\varphi$ zwischen $${an}$ und $${bn}$.`, '\\varphi') : undefined),
      lengthsStep(rng, [an, bn], [a, b]),
      cosStep(rng, an, bn, d, n2a, n2b, general),
      general ? classifyStep(rng, an, bn, d, true) : angleStep(rng, cos, phi),
    ]
    if (steps[0].choices.length < 4 || steps.some((s) => s.choices.length < 3)) continue
    const idx = typeIndex(d)
    const cosL = surdLatex(cos)
    const caption = general
      ? `$\\cos\\varphi = ${cosL}$ ist ${idx === 0 ? 'positiv' : 'negativ'}: Der Winkel ist ${ANGLE_TYPES[idx]}, etwa $${decimal1((Math.acos(surdValue(cos)) * 180) / Math.PI)}^\\circ$.`
      : `Der Winkel zwischen $${an}$ und $${bn}$ beträgt $${deg(phi)}$.`
    return {
      kind: 'angle',
      instruction: general
        ? `Berechne $\\cos\\varphi$ für den Winkel $\\varphi$ zwischen $${an}$ und $${bn}$. Ist der Winkel spitz, recht oder stumpf?`
        : `Wie groß ist der Winkel $\\varphi$ zwischen $${an}$ und $${bn}$?`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)}`,
      steps,
      cards: [CARD.skalar, CARD.winkel],
      resultLatex: general ? `\\cos\\varphi = ${cosL},\\; \\text{${ANGLE_TYPES[idx]}}` : `\\varphi = ${deg(phi)}`,
      ...(pic ? { resultDrawing: pairDrawing(dim, an, bn, a, b, caption, general ? '\\varphi' : deg(phi)) } : {}),
      ...(dim > 3 ? { note: 'In mehr als drei Dimensionen gibt es kein Bild, gerechnet wird genauso.' } : {}),
      form: `angle|${dim}|${general ? `gen${idx}` : phi}|${vecs[0]}|${signShape(a, b)}`,
      data: { a: nums(a), b: nums(b) },
      answer: general ? [surdValue(cos), idx] : [phi],
    }
  }
}

const TRIANGLES = [
  ['A', 'B', 'C'],
  ['P', 'Q', 'R'],
  ['D', 'E', 'F'],
] as const

// Innenwinkel eines Dreiecks: beide Pfeile beginnen an der Ecke (Stufe 5: erst die Pfeile wählen)
function buildTriangleAngle(rng: Rng, level: Level): Built {
  const dim = level === 3 ? rng.pick([2, 3]) : 3
  const names = rng.pick(TRIANGLES)
  const vi = level === 5 ? rng.pick([1, 2]) : rng.int(0, 2)
  const [oi, qi] = [0, 1, 2].filter((k) => k !== vi)
  const [Vn, Pn, Qn] = [names[vi], names[oi], names[qi]]
  for (;;) {
    const { a: u, b: w, phi } = specialPair(rng, dim)
    const V = ints(rng, dim, -3, 3)
    const pts: Vec[] = []
    pts[vi] = V
    pts[oi] = vecAdd(V, u)
    pts[qi] = vecAdd(V, w)
    const un = arrowName(Vn, Pn)
    const wn = arrowName(Vn, Qn)
    const steps: GuidedStep[] = []
    if (level === 5) {
      steps.push(
        choiceStep(rng, {
          id: 'pfeile',
          title: 'Welche Pfeile?',
          question: `Zwischen welchen Pfeilen liegt der Innenwinkel bei $${Vn}$?`,
          correct: math(`${un} \\text{ und } ${wn}`),
          wrongs: [
            { content: math(`${arrowName(Pn, Vn)} \\text{ und } ${wn}`), rule: 'vec-angle-direction' },
            { content: math(`${un} \\text{ und } ${arrowName(Qn, Vn)}`), rule: 'vec-angle-direction' },
            { content: math(`${arrowName(Pn, Vn)} \\text{ und } ${arrowName(Pn, Qn)}`), rule: 'vec-angle-direction' },
          ],
          hint: `Beide Pfeile müssen an der Ecke $${Vn}$ beginnen.`,
          explanation: { detailed: `Der Winkel bei $${Vn}$ liegt zwischen den Seiten, die von $${Vn}$ ausgehen: $${un}$ und $${wn}$, beide mit dem Fuß bei $${Vn}$.`, short: `$${un}$ und $${wn}$ beginnen bei $${Vn}$.` },
          established: [`${un},\\; ${wn}`],
          cards: [CARD.winkel],
        }),
      )
    }
    const pair = (x: Vec, y: Vec) => math(`${un} = ${vecLatex(x)},\\; ${wn} = ${vecLatex(y)}`)
    const slip = V.findIndex((x) => ratSign(x) < 0)
    const vecWrongs: Wrong[] = [
      { content: pair(vecNeg(u), vecNeg(w)), rule: 'vec-reversed' },
      { content: pair(vecAdd(pts[oi], V), vecAdd(pts[qi], V)), rule: 'vec-added-points' },
    ]
    if (slip >= 0) vecWrongs.push({ content: pair(u.map((x, i) => (i === slip ? ratAdd(pts[oi][i], V[i]) : x)), w), rule: 'vec-sign-slip' })
    const picDrawing: VectorDrawing | undefined = drawableDim(dim)
      ? {
          ...emptyDrawing(dim, `Das Dreieck $${names.join('')}$; gesucht ist der Winkel bei $${Vn}$.`),
          points: names.map((n, k) => ({ at: nums(pts[k]), label: n })),
          polygons: [{ points: pts.map(nums), color: 'muted' }],
        }
      : undefined
    steps.push(
      choiceStep(rng, {
        id: 'verbindung',
        title: 'Seiten als Pfeile',
        question: `Wie lauten $${un}$ und $${wn}$?`,
        correct: pair(u, w),
        wrongs: vecWrongs,
        hint: 'Spitze minus Fuß; der Fuß ist bei beiden die Ecke des Winkels.',
        explanation: { detailed: `$${un} = ${Pn} - ${Vn} = ${vecLatex(u)}$ und $${wn} = ${Qn} - ${Vn} = ${vecLatex(w)}$.`, short: `$${un} = ${vecLatex(u)}$, $${wn} = ${vecLatex(w)}$.` },
        established: [`${un} = ${vecLatex(u)}`, `${wn} = ${vecLatex(w)}`],
        cards: [CARD.verbindung],
        ...(picDrawing ? { drawing: picDrawing } : {}),
      }),
    )
    const d = vecDot(u, w)
    const n2a = vecNorm2(u)
    const n2b = vecNorm2(w)
    const cos = cosSurd(d, ratMul(n2a, n2b))
    const first: Wrong[] = level === 5 ? [{ content: math(`\\varphi = ${deg(180 - phi)}`), rule: 'vec-angle-direction' }] : []
    steps.push(dotStep(rng, un, wn, u, w), lengthsStep(rng, [un, wn], [u, w]), cosStep(rng, un, wn, d, n2a, n2b, false), angleStep(rng, cos, phi, first))
    if (steps.some((s) => s.choices.length < 3)) continue
    const drawing: VectorDrawing | undefined = picDrawing
      ? {
          ...picDrawing,
          caption: `Der Innenwinkel bei $${Vn}$ liegt zwischen $${un}$ und $${wn}$ und beträgt $${deg(phi)}$.`,
          arrows: [
            { from: nums(V), to: nums(pts[oi]), color: 'a', label: un },
            { from: nums(V), to: nums(pts[qi]), color: 'b', label: wn },
          ],
          angles: [{ at: nums(V), u: nums(u), v: nums(w), color: 'r', label: deg(phi) }],
        }
      : undefined
    return {
      kind: 'triangleAngle',
      instruction: `Wie groß ist der Innenwinkel $\\varphi$ des Dreiecks $${names.join('')}$ bei $${Vn}$?`,
      functionLatex: names.map((n, k) => pointLatex(n, pts[k])).join(',\\; '),
      steps,
      cards: [CARD.verbindung, CARD.winkel],
      resultLatex: `\\varphi = ${deg(phi)}`,
      ...(drawing ? { resultDrawing: drawing } : {}),
      form: `triangleAngle|${dim}|${phi}|${vi}|${names[0]}|${signShape(V, u, w)}`,
      data: { P0: nums(pts[0]), P1: nums(pts[1]), P2: nums(pts[2]), v: [vi] },
      answer: [phi],
    }
  }
}
const vecNeg = (v: Vec): Vec => v.map(ratNeg)

// Winkel im Bogenmaß
const RADIANS: Readonly<Record<number, string>> = { 30: '\\frac{\\pi}{6}', 45: '\\frac{\\pi}{4}', 60: '\\frac{\\pi}{3}', 120: '\\frac{2\\pi}{3}', 135: '\\frac{3\\pi}{4}', 150: '\\frac{5\\pi}{6}' }
const SIN: Readonly<Record<number, Surd>> = {
  30: { coef: rat(1, 2), rad: 1n },
  45: { coef: rat(1, 2), rad: 2n },
  60: { coef: rat(1, 2), rad: 3n },
  120: { coef: rat(1, 2), rad: 3n },
  135: { coef: rat(1, 2), rad: 2n },
  150: { coef: rat(1, 2), rad: 1n },
}
// Wurzel im Betrag von b: bei 45° und 135° |b| = q√2, bei 30° und 150° |b| = q√3, damit a · b rational ist
const RADICAND: Readonly<Record<number, number>> = { 30: 3, 45: 2, 60: 1, 120: 1, 135: 2, 150: 3 }

// c1·|a|² + c2·a·b + c3·|b|² (Faktor 1 weggelassen, c2 = 0 ohne Mittelglied)
function expansionLatex(c1: number, c2: number, c3: number, an: string, bn: string): string {
  const f = (c: number) => (c === 1 ? '' : String(c))
  const mid = c2 === 0 ? '' : ` ${c2 > 0 ? '+' : '-'} ${f(Math.abs(c2))}\\,${an} \\cdot ${bn}`
  return `${c1 < 0 ? '-' : ''}${f(Math.abs(c1))}\\lvert ${an} \\rvert^2${mid} + ${f(c3)}\\lvert ${bn} \\rvert^2`
}

// Länge von k·a + m·b aus Längen und Winkel (Stufe 3 und 4); Stufe 5 rückwärts: Winkel aus |a ± b|
function buildLengthAngle(rng: Rng, level: Level): Built {
  if (level === 5) return buildAngleFromLength(rng)
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  for (;;) {
    const phi = rng.pick(level === 3 ? [60, 120] : [30, 45, 135, 150])
    const p = rng.int(1, 6)
    const q = rng.int(1, level === 3 ? 6 : 4)
    const rb = RADICAND[phi]
    const b2 = q * q * rb
    // a · b = p · q√rb · cos φ
    const ab = rat(p * q * rb * SPECIAL[phi].sign, 2)
    const k = level === 3 && rng.chance(0.5) ? rng.pick([1, -1]) : rng.pick([1, -1, 2, -2, 3])
    const m = level === 3 && Math.abs(k) !== 1 ? rng.pick([1, -1]) : rng.pick([1, -1, 2, -2, 3, -3])
    if (k === 1 && m === 1 && level === 4) continue
    const S = ratAdd(ratAdd(rat(k * k * p * p), ratMul(rat(2 * k * m), ab)), rat(m * m * b2))
    const noMid = rat(k * k * p * p + m * m * b2)
    const flip = ratSub(S, ratMul(rat(4 * k * m), ab))
    const notSq = ratAdd(ratAdd(rat(Math.abs(k) * p * p), ratMul(rat(2 * k * m), ab)), rat(Math.abs(m) * b2))
    const expr = `${coefLatex(rat(k), true)}${an} ${coefLatex(rat(m), false)}${bn}`
    const bL = rb === 1 ? String(q) : surdLatex({ coef: rat(q), rad: BigInt(rb) })
    const phiL = level === 3 ? deg(phi) : RADIANS[phi]
    const expWrongs: Wrong[] = [
      { content: math(expansionLatex(k * k, 0, m * m, an, bn)), rule: 'vec-binomial-middle' },
      { content: math(expansionLatex(k * k, k * m, m * m, an, bn)), rule: 'vec-binomial-middle' },
    ]
    if (Math.abs(k) !== 1 || Math.abs(m) !== 1) expWrongs.push({ content: math(expansionLatex(Math.abs(k), 2 * k * m, Math.abs(m), an, bn)), rule: 'vec-coef-not-squared' })
    expWrongs.push({ content: math(expansionLatex(k * k, -2 * k * m, m * m, an, bn)), rule: 'vec-dot-sign' })
    const expansion = expansionLatex(k * k, 2 * k * m, m * m, an, bn)
    const step1 = choiceStep(rng, {
      id: 'ausmultiplizieren',
      title: 'Ausmultiplizieren',
      question: `Wie schreibst du $\\lvert ${expr} \\rvert^2$ mit Längen und Skalarprodukt?`,
      correct: math(expansion),
      wrongs: expWrongs,
      hint: `$\\lvert \\vec v \\rvert^2 = \\vec v \\cdot \\vec v$. Multipliziere $(${expr}) \\cdot (${expr})$ aus wie eine binomische Formel.`,
      explanation: { detailed: `$\\lvert ${expr} \\rvert^2 = (${expr}) \\cdot (${expr}) = ${expansion}$.`, short: `$\\lvert ${expr} \\rvert^2 = ${expansion}$.` },
      established: [`\\lvert ${expr} \\rvert^2 = ${expansion}`],
      cards: [CARD.betragWinkel],
    })
    const sin = SIN[phi]
    const sinWrong = sqrtRat(rat(rb * Number(sin.rad)))
    const step2 = choiceStep(rng, {
      id: 'skalarprodukt',
      title: 'Skalarprodukt',
      question: `Wie groß ist $${an} \\cdot ${bn}$?`,
      correct: math(ratText(ab)),
      wrongs: [
        { content: math(surdLatex({ coef: rat(p * q), rad: BigInt(rb) })), rule: 'vec-dot-no-cos' },
        { content: math(surdLatex({ coef: ratMul(rat(p * q), ratMul(sin.coef, sinWrong.coef)), rad: sinWrong.rad })), rule: 'vec-angle-arcsin' },
        { content: math(ratText(ratNeg(ab))), rule: 'vec-angle-supplement' },
      ],
      hint: `$${an} \\cdot ${bn} = \\lvert ${an} \\rvert \\, \\lvert ${bn} \\rvert \\cos\\varphi$, mit $\\cos${level === 3 ? deg(phi) : RADIANS[phi]}$ aus der Tabelle.`,
      explanation: {
        detailed: `$${an} \\cdot ${bn} = ${p} \\cdot ${bL} \\cdot \\cos${level === 3 ? deg(phi) : `\\left(${RADIANS[phi]}\\right)`} = ${ratText(ab)}$.`,
        short: `$${an} \\cdot ${bn} = ${ratText(ab)}$.`,
      },
      established: [`${an} \\cdot ${bn} = ${ratText(ab)}`],
      cards: [CARD.betragWinkel],
    })
    const len = sqrtRat(S)
    const wrongs3: Wrong[] = [
      { content: math(ratText(S)), rule: 'vec-length-no-root' },
      { content: math(surdLatex(sqrtRat(noMid))), rule: 'vec-binomial-middle' },
    ]
    if (ratSign(flip) > 0) wrongs3.push({ content: math(surdLatex(sqrtRat(flip))), rule: 'vec-dot-sign' })
    if (ratSign(notSq) > 0) wrongs3.push({ content: math(surdLatex(sqrtRat(notSq))), rule: 'vec-coef-not-squared' })
    const sum = `${k * k === 1 ? '' : `${k * k} \\cdot `}${p}^2 ${2 * k * m < 0 ? '-' : '+'} ${Math.abs(2 * k * m)} \\cdot ${factor(ratText(ab))} + ${m * m === 1 ? '' : `${m * m} \\cdot `}${b2}`
    const step3 = choiceStep(rng, {
      id: 'laenge',
      title: 'Länge',
      question: `Wie lang ist $${expr}$?`,
      correct: math(surdLatex(len)),
      wrongs: wrongs3,
      hint: `Setze $\\lvert ${an} \\rvert^2 = ${p * p}$, $\\lvert ${bn} \\rvert^2 = ${b2}$ und das Skalarprodukt ein, dann ziehe die Wurzel.`,
      explanation: { detailed: `$\\lvert ${expr} \\rvert^2 = ${sum} = ${ratText(S)}$, also $\\lvert ${expr} \\rvert = ${surdLatex(len)}$.`, short: `$\\lvert ${expr} \\rvert = \\sqrt{${ratText(S)}} = ${surdLatex(len)}$.` },
      established: [`\\lvert ${expr} \\rvert^2 = ${ratText(S)}`],
      cards: [CARD.betragWinkel],
    })
    if ([step1, step2, step3].some((s) => s.choices.length < 3)) continue
    // Bild in der Ebene: a waagerecht, b im Winkel φ
    const bLen = q * Math.sqrt(rb)
    const av = [p, 0]
    const bv = [bLen * Math.cos((phi * Math.PI) / 180), bLen * Math.sin((phi * Math.PI) / 180)]
    const ka = av.map((x) => k * x)
    const res = ka.map((x, i) => x + m * bv[i])
    const o = [0, 0]
    const base: VectorDrawing = {
      ...emptyDrawing(2, `$\\lvert ${an} \\rvert = ${p}$ und $\\lvert ${bn} \\rvert = ${bL}$ schließen den Winkel $${phiL}$ ein.`),
      arrows: [
        { from: o, to: av, color: 'a', label: an },
        { from: o, to: bv, color: 'b', label: bn },
      ],
      angles: [{ at: o, u: av, v: bv, color: 'muted', label: phiL }],
    }
    const result: VectorDrawing = {
      ...base,
      caption: `$${expr}$: erst $${coefLatex(rat(k), true)}${an}$, dann $${coefLatex(rat(m), true)}${bn}$ daran gehängt. Die Länge des violetten Pfeils ist $${surdLatex(len)}$.`,
      segments: [
        { from: o, to: ka, color: 'a', dashed: true, phase: 1 },
        { from: ka, to: res, color: 'b', dashed: true, phase: 2 },
      ],
      arrows: [...base.arrows, { from: o, to: res, color: 'r', label: expr, phase: 3 }],
    }
    return {
      kind: 'lengthAngle',
      instruction: `$${an}$ und $${bn}$ schließen den Winkel $\\varphi = ${phiL}$ ein. Wie lang ist $${expr}$?`,
      functionLatex: `\\lvert ${an} \\rvert = ${p},\\; \\lvert ${bn} \\rvert = ${bL},\\; \\varphi = ${phiL}`,
      steps: [{ ...step1, drawing: base }, step2, step3],
      cards: [CARD.betragWinkel],
      resultLatex: `\\lvert ${expr} \\rvert = ${surdLatex(len)}`,
      resultDrawing: result,
      form: `lengthAngle|${phi}|${k},${m}|${vecs[0]}|${p > q ? 'p' : 'q'}`,
      data: { p: [p], b: [bLen], phi: [phi], k: [k], m: [m] },
      answer: [surdValue(len)],
    }
  }
}

// Stufe 5: Winkel aus |a|, |b| und |a ± b|
function buildAngleFromLength(rng: Rng): Built {
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  for (;;) {
    const phi = rng.pick([45, 60, 120, 135])
    const p = rng.int(1, 6)
    const q = rng.int(1, 5)
    const rb = RADICAND[phi]
    const b2 = q * q * rb
    const ab = rat(p * q * rb * SPECIAL[phi].sign, 2)
    const sg = rng.pick([1, -1])
    const S = ratAdd(rat(p * p + b2), ratMul(rat(2 * sg), ab))
    const expr = `${an} ${sg > 0 ? '+' : '-'} ${bn}`
    const bL = rb === 1 ? String(q) : surdLatex({ coef: rat(q), rad: BigInt(rb) })
    const sL = surdLatex(sqrtRat(S))
    const expansion = expansionLatex(1, 2 * sg, 1, an, bn)
    const step1 = choiceStep(rng, {
      id: 'ausmultiplizieren',
      title: 'Ausmultiplizieren',
      question: `Wie schreibst du $\\lvert ${expr} \\rvert^2$ mit Längen und Skalarprodukt?`,
      correct: math(expansion),
      wrongs: [
        { content: math(expansionLatex(1, 0, 1, an, bn)), rule: 'vec-binomial-middle' },
        { content: math(expansionLatex(1, -2 * sg, 1, an, bn)), rule: 'vec-dot-sign' },
        { content: math(expansionLatex(1, sg, 1, an, bn)), rule: 'vec-binomial-middle' },
      ],
      hint: `$\\lvert \\vec v \\rvert^2 = \\vec v \\cdot \\vec v$: wie eine binomische Formel ausmultiplizieren.`,
      explanation: { detailed: `$\\lvert ${expr} \\rvert^2 = (${expr}) \\cdot (${expr}) = ${expansion}$.`, short: `$\\lvert ${expr} \\rvert^2 = ${expansion}$.` },
      established: [`\\lvert ${expr} \\rvert^2 = ${expansion}`],
      cards: [CARD.betragWinkel],
    })
    const diff = ratSub(S, rat(p * p + b2))
    const wrongs2: Wrong[] = [
      { content: math(ratText(ratMul(rat(sg), diff))), rule: 'vec-binomial-middle' },
      { content: math(ratText(ratNeg(ab))), rule: 'vec-dot-sign' },
    ]
    const sRoot = sqrtRat(S)
    if (sRoot.rad === 1n) wrongs2.push({ content: math(ratText(ratDiv(ratMul(rat(sg), ratSub(sRoot.coef, rat(p * p + b2))), rat(2)))), rule: 'vec-length-target-not-squared' })
    const step2 = choiceStep(rng, {
      id: 'skalarprodukt',
      title: 'Skalarprodukt',
      question: `Wie groß ist $${an} \\cdot ${bn}$?`,
      correct: math(ratText(ab)),
      wrongs: wrongs2,
      hint: `Setze die Quadrate der Längen ein und löse nach $${an} \\cdot ${bn}$ auf.`,
      explanation: {
        detailed: `$${ratText(S)} = ${p * p} ${sg > 0 ? '+' : '-'} 2\\,${an} \\cdot ${bn} + ${b2}$, also $${an} \\cdot ${bn} = ${ratText(ab)}$.`,
        short: `$${an} \\cdot ${bn} = ${ratText(ab)}$.`,
      },
      established: [`${an} \\cdot ${bn} = ${ratText(ab)}`],
      cards: [CARD.betragWinkel],
    })
    const n2a = rat(p * p)
    const n2b = rat(b2)
    const cos = cosSurd(ab, ratMul(n2a, n2b))
    const steps = [step1, step2, cosStep(rng, an, bn, ab, n2a, n2b, false), angleStep(rng, cos, phi)]
    if (steps.some((s) => s.choices.length < 3)) continue
    const bLen = q * Math.sqrt(rb)
    const av = [p, 0]
    const bv = [bLen * Math.cos((phi * Math.PI) / 180), bLen * Math.sin((phi * Math.PI) / 180)]
    const res = av.map((x, i) => x + sg * bv[i])
    const o = [0, 0]
    const drawing: VectorDrawing = {
      ...emptyDrawing(2, `Mit $\\varphi = ${deg(phi)}$ hat $${expr}$ genau die Länge $${sL}$.`),
      arrows: [
        { from: o, to: av, color: 'a', label: an },
        { from: o, to: bv, color: 'b', label: bn },
        { from: o, to: res, color: 'r', label: expr, phase: 1 },
      ],
      angles: [{ at: o, u: av, v: bv, color: 'r', label: deg(phi) }],
    }
    return {
      kind: 'lengthAngle',
      instruction: `Es gilt $\\lvert ${an} \\rvert = ${p}$, $\\lvert ${bn} \\rvert = ${bL}$ und $\\lvert ${expr} \\rvert = ${sL}$. Welchen Winkel $\\varphi$ schließen $${an}$ und $${bn}$ ein?`,
      functionLatex: `\\lvert ${an} \\rvert = ${p},\\; \\lvert ${bn} \\rvert = ${bL},\\; \\lvert ${expr} \\rvert = ${sL}`,
      steps,
      cards: [CARD.betragWinkel, CARD.winkel],
      resultLatex: `\\varphi = ${deg(phi)}`,
      resultDrawing: drawing,
      form: `lengthAngle|rev|${phi}|${sg}|${vecs[0]}|${p > q ? 'p' : 'q'}`,
      data: { p: [p], b: [bLen], S: [num(S)], sg: [sg] },
      answer: [phi],
    }
  }
}

// Stufe 4: Für welche t ist der Winkel spitz bzw. stumpf? Lineare Ungleichung (beim Teilen durch eine negative Zahl umdrehen)
// forcedDim: für die Zieh-Aufgabe (dragTasks.ts) immer in der Ebene; sonst zieht der Zufall wie bisher
export function buildClassifyParam(rng: Rng, forcedDim?: 2 | 3): Built {
  const dim = forcedDim ?? rng.pick([2, 3])
  const t = rng.pick(PARAMS)
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  const want = rng.pick([0, 2])
  for (;;) {
    const a = Array.from({ length: dim }, () => rng.int(-5, 5))
    const b = Array.from({ length: dim }, () => rng.int(-5, 5))
    const i = rng.int(0, dim - 1)
    const s = rng.pick([1, 2, -1, -2, 3])
    b[i] = rng.pick([0, 0, 1, -1, 2, -3])
    const others = Array.from({ length: dim }, (_, j) => j).filter((j) => j !== i)
    if (a[i] === 0 || others.filter((j) => a[j] === 0 || b[j] === 0).length > dim - 2 || ![...a, ...b].some((x) => x < 0)) continue
    const C = a[i] * s
    const K = a.reduce((sum, x, j) => sum + x * b[j], 0)
    if (K === 0) continue
    const t0 = rat(-K, C)
    if (Math.abs(num(t0)) > 10) continue
    const ea = a.map(String)
    const eb = b.map((x, j) => (j === i ? `${termT(s, t)}${constPart(x)}` : String(x)))
    const terms = dotTerms(ea, eb)
    const lin = linLatex(C, K, t)
    const op = want === 0 ? '>' : '<'
    const opp = want === 0 ? '<' : '>'
    const slip = others.find((j) => a[j] * b[j] !== 0 && (a[j] < 0 || b[j] < 0))
    const wrongs1: Wrong[] = [
      { content: math(`${lin} ${opp} 0`), rule: 'vec-angle-sign' },
      { content: math(`${lin} = 0`), rule: 'vec-angle-zero' },
    ]
    if (slip !== undefined) wrongs1.push({ content: math(`${linLatex(C, K - 2 * a[slip] * b[slip], t)} ${op} 0`), rule: 'vec-dot-sign' })
    const word = ANGLE_TYPES[want]
    const step1 = choiceStep(rng, {
      id: 'bedingung',
      title: 'Bedingung',
      question: `Welche Bedingung muss $${t}$ erfüllen, damit der Winkel ${word} ist?`,
      correct: math(`${lin} ${op} 0`),
      wrongs: wrongs1,
      hint: `${want === 0 ? 'Spitz heißt: Skalarprodukt positiv.' : 'Stumpf heißt: Skalarprodukt negativ.'} Rechne das Skalarprodukt mit $${t}$ aus.`,
      explanation: {
        detailed: `${want === 0 ? 'Spitz' : 'Stumpf'} heißt $${an} \\cdot ${bn} ${op} 0$. Hier ist $${an} \\cdot ${bn} = ${terms} = ${lin}$.`,
        short: `$${an} \\cdot ${bn} = ${lin} ${op} 0$.`,
      },
      established: [`${an} \\cdot ${bn} = ${terms} = ${lin}`, `${lin} ${op} 0`],
      cards: [CARD.senkrecht],
    })
    // C·t op −K: durch C teilen, bei C < 0 umdrehen
    const rel = C > 0 ? op : opp
    const relOpp = C > 0 ? opp : op
    const tL = ratText(t0)
    const wrongL = ratText(rat(K, C))
    const step2 = choiceStep(rng, {
      id: 'loesung',
      title: 'Lösung',
      question: `Für welche Werte von $${t}$ gilt das?`,
      correct: math(`${t} ${rel} ${tL}`),
      wrongs: [
        { content: math(`${t} ${relOpp} ${tL}`), rule: 'vec-ineq-flip' },
        { content: math(`${t} ${rel} ${wrongL}`), rule: 'vec-param-solve' },
        { content: math(`${t} ${relOpp} ${wrongL}`), rule: 'vec-param-solve' },
      ],
      hint: `Bring die Zahl auf die andere Seite und teile durch $${C}$. ${C < 0 ? 'Achtung, die Zahl ist negativ.' : ''}`.trim(),
      explanation: {
        detailed: `$${termT(C, t)} ${op} ${-K}$. ${C < 0 ? `Beim Teilen durch die negative Zahl $${C}$ dreht sich das Zeichen um` : `Teilen durch $${C}$`}: $${t} ${rel} ${tL}$.`,
        short: `$${t} ${rel} ${tL}$.`,
      },
      established: [`${t} ${rel} ${tL}`],
      cards: [CARD.senkrecht],
    })
    if (step1.choices.length < 3 || step2.choices.length < 3) continue
    const bAt = vec(...b.map((x, j) => (j === i ? ratAdd(rat(x), ratMul(rat(s), t0)) : rat(x))))
    const aV = vec(...a)
    if (bAt.every(isZero)) continue
    const drawing = drawableDim(dim) ? pairDrawing(dim, an, bn, aV, bAt, `Bei $${t} = ${tL}$ stehen die Pfeile senkrecht. Für $${t} ${rel} ${tL}$ ist der Winkel ${word}.`, deg(90)) : undefined
    return {
      kind: 'classifyParam',
      instruction: `Für welche Werte von $${t}$ schließen $${an}$ und $${bn}$ einen ${word}en Winkel ein?`,
      functionLatex: `${an} = ${columnLatex(ea)},\\; ${bn} = ${columnLatex(eb)}`,
      steps: [step1, step2],
      cards: [CARD.skalar, CARD.senkrecht],
      resultLatex: `${t} ${rel} ${tL}`,
      ...(drawing ? { resultDrawing: drawing } : {}),
      form: `classifyParam|${dim}|${want}|${C > 0 ? 'pos' : 'neg'}|${i}|${t}|${isInteger(t0) ? 'int' : 'frac'}|${vecs[0]}`,
      data: { a, b, i: [i], s: [s], want: [want] },
      answer: [rel === '>' ? 1 : -1, num(t0)],
    }
  }
}

// c − t mit ganzer Zahl c
const minusT = (c: number, t: string) => (c === 0 ? `-${t}` : `${c} - ${t}`)
const plusT = (c: number, t: string) => (c === 0 ? t : `${c} + ${t}`)
const tMinus = (c: number, t: string) => `${t}${constPart(-c)}`

// Stufe 5: Für welche t hat das Dreieck ABC bei C(t) einen rechten Winkel? Quadratisch, zwei Lösungen
function buildRightParam(rng: Rng): Built {
  const names = rng.pick(TRIANGLES)
  const [An, Bn, Cn] = names
  const t = rng.pick(PARAMS)
  for (;;) {
    const r1 = rng.int(-5, 5)
    const r2 = rng.int(r1 + 1, 6)
    const i = rng.int(0, 2)
    const [j, k] = [0, 1, 2].filter((x) => x !== i)
    const Ai = rng.int(-4, 4)
    const Bi = r1 + r2 - Ai
    if (Math.abs(Bi) > 6) continue
    const K = r1 * r2 - Ai * Bi
    // u = A − C, w = B − C in den Einträgen ohne t
    const u = [0, 0, 0]
    const w = [0, 0, 0]
    u[j] = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])
    w[j] = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])
    const R = K - u[j] * w[j]
    if (R === 0) continue
    const split = splitProduct(rng, R, 6)
    if (!split) continue
    ;[u[k], w[k]] = split
    const C = [0, 0, 0].map(() => rng.int(-3, 3))
    C[i] = 0
    const A = C.map((x, n) => (n === i ? Ai : x + u[n]))
    const B = C.map((x, n) => (n === i ? Bi : x + w[n]))
    const at = (r: number) => C.map((x, n) => (n === i ? r : x))
    // nicht entartet: A, B, C(t) nicht auf einer Geraden
    const degenerate = (r: number) => {
      const c = at(r)
      const x = A.map((v, n) => v - c[n])
      const y = B.map((v, n) => v - c[n])
      return x[1] * y[2] - x[2] * y[1] === 0 && x[2] * y[0] - x[0] * y[2] === 0 && x[0] * y[1] - x[1] * y[0] === 0
    }
    if (degenerate(r1) || degenerate(r2)) continue
    const ca = u.map((x, n) => (n === i ? minusT(Ai, t) : String(x)))
    const cb = w.map((x, n) => (n === i ? minusT(Bi, t) : String(x)))
    const CA = arrowName(Cn, An)
    const CB = arrowName(Cn, Bn)
    const pair = (x: readonly string[], y: readonly string[]) => math(`${CA} = ${columnLatex(x)},\\; ${CB} = ${columnLatex(y)}`)
    const step1 = choiceStep(rng, {
      id: 'verbindung',
      title: 'Seiten als Pfeile',
      question: `Wie lauten $${CA}$ und $${CB}$?`,
      correct: pair(ca, cb),
      wrongs: [
        { content: pair(ca, w.map((x, n) => (n === i ? tMinus(Bi, t) : String(-x)))), rule: 'vec-reversed' },
        { content: pair(u.map((x, n) => (n === i ? plusT(Ai, t) : String(x))), cb), rule: 'vec-sign-slip' },
        { content: pair(A.map((x, n) => (n === i ? plusT(Ai, t) : String(x + C[n]))), B.map((x, n) => (n === i ? plusT(Bi, t) : String(x + C[n])))), rule: 'vec-added-points' },
      ],
      hint: `Beide Pfeile beginnen bei $${Cn}$: Spitze minus Fuß, auch im Eintrag mit $${t}$.`,
      explanation: { detailed: `$${CA} = ${An} - ${Cn}$ und $${CB} = ${Bn} - ${Cn}$, Eintrag für Eintrag.`, short: `$${CA} = ${An} - ${Cn}$, $${CB} = ${Bn} - ${Cn}$.` },
      established: [`${CA} = ${columnLatex(ca)}`, `${CB} = ${columnLatex(cb)}`],
      cards: [CARD.verbindung],
    })
    const m = -(r1 + r2)
    const P = r1 * r2
    const step2 = quadEquationStep(rng, t, `Welche Gleichung muss $${t}$ für einen rechten Winkel bei $${Cn}$ erfüllen?`, dotTerms(ca, cb), `${CA} \\cdot ${CB}`, m, P, `Rechter Winkel bei $${Cn}$: $${CA} \\cdot ${CB} = 0$. Multipliziere aus und fasse zusammen.`)
    const step3 = quadStep(rng, t, r1, r2, m, P)
    if ([step1, step2, step3].some((s) => s.choices.length < 3)) continue
    const [c1, c2] = [at(r1), at(r2)]
    const sub = (x: readonly number[], y: readonly number[]) => x.map((v, n) => v - y[n])
    const drawing: VectorDrawing = {
      ...emptyDrawing(3, `Für $${t} = ${r1}$ und für $${t} = ${r2}$ liegt bei $${Cn}$ ein rechter Winkel.`),
      points: [{ at: A, label: An }, { at: B, label: Bn }, { at: c1, label: `${Cn}_1`, color: 'r', phase: 1 }, { at: c2, label: `${Cn}_2`, color: 'c', phase: 2 }],
      segments: [
        { from: A, to: B, color: 'muted' },
        { from: c1, to: A, color: 'r', phase: 1 },
        { from: c1, to: B, color: 'r', phase: 1 },
        { from: c2, to: A, color: 'c', phase: 2 },
        { from: c2, to: B, color: 'c', phase: 2 },
      ],
      angles: [
        { at: c1, u: sub(A, c1), v: sub(B, c1), color: 'r', phase: 1 },
        { at: c2, u: sub(A, c2), v: sub(B, c2), color: 'c', phase: 2 },
      ],
    }
    const cEntries = C.map((x, n) => (n === i ? t : String(x)))
    return {
      kind: 'rightParam',
      instruction: `Für welche Werte von $${t}$ hat das Dreieck $${names.join('')}$ bei $${Cn}$ einen rechten Winkel?`,
      functionLatex: `${pointLatex(An, vec(...A))},\\; ${pointLatex(Bn, vec(...B))},\\; ${Cn}(${cEntries.join(' \\mid ')})`,
      steps: [step1, step2, step3],
      cards: [CARD.verbindung, CARD.senkrecht],
      resultLatex: `${t}_1 = ${r1},\\; ${t}_2 = ${r2}`,
      resultDrawing: drawing,
      form: `rightParam|${i}|${m === 0 ? 'pm' : Math.sign(m)}|${t}|${names[0]}|${signShape(vec(...u), vec(...w))}`,
      data: { A, B, C, i: [i] },
      answer: [r1, r2],
    }
  }
}

export const DOT_BUILDERS = {
  dot: buildDot,
  classify: (rng: Rng, level: Level) => buildClassify(rng, level),
  perp: buildPerp,
  angle: buildAngle,
  triangleAngle: buildTriangleAngle,
  lengthAngle: buildLengthAngle,
  classifyParam: (rng: Rng) => buildClassifyParam(rng),
  rightParam: (rng: Rng) => buildRightParam(rng),
} satisfies Readonly<Record<string, (rng: Rng, level: Level) => Built>>
