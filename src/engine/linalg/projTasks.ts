import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { cosSurd, dotStep } from './dotTasks.ts'
import { type DrawArrow, type DrawMistake, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, CARD, PARAMS, choiceStep, connectStep, ints, letters, math, negCount, nums, origin, signShape, zeroCount } from './taskKit.ts'
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
  vecLatex,
  vecLength,
  vecName,
  vecNorm2,
  vecScale,
  vecSub,
} from './vec.ts'

// Baukasten für den Baustein „Projektion und Zerlegung" der Tätigkeit „Vektoren" (M7 Schritt 3a, docs/PLAN-M7.md):
// Schatten (Projektion) von a auf b, Zerlegung in einen Teil parallel und einen senkrecht zu b, Länge des Schattens,
// Lotfußpunkt und Abstand eines Punktes von einer Geraden, Parameter so, dass der Schatten passt, Projektion auf eine
// Ebene aus zwei senkrechten Vektoren. Alles exakt (vec.ts); die Zahlen werden so gezogen, dass die Brüche klein bleiben.
// Bilder mit „Licht an": Das Lot fällt, der Schatten wächst, der senkrechte Rest erscheint; „Typischen Fehler zeigen"
// zeichnet den Schatten rot, der beim Teilen durch die Länge statt durch ihr Quadrat entsteht.

export const PROJ_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['projection', 'decompose', 'shadowLength'],
  2: ['projection', 'decompose', 'shadowLength', 'foot'],
  3: ['decompose', 'foot', 'projection'],
  4: ['decompose', 'projParam', 'foot'],
  5: ['spanProjection', 'foot', 'projParam'],
}

// ------------------------------------------------------------------ Hilfen

const num = (r: Rational) => Number(r.n) / Number(r.d)
const parName = (an: string) => `${an}_{\\parallel}`
const perpName = (an: string) => `${an}_{\\perp}`
// größter Nenner der Einträge
const maxDen = (v: Vec) => v.reduce((m, x) => (x.d > m ? x.d : m), 1n)
// Bruch mit dem Minus davor: -\frac{6}{14}
const fracLatex = (n: Rational, d: Rational) => {
  const neg = ratSign(n) * ratSign(d) < 0
  const top = ratLatex(ratAbs(n))
  const bottom = ratLatex(ratAbs(d))
  return `${neg ? '-' : ''}\\frac{${top}}{${bottom}}`
}
// Rechnung „Bruch = Ergebnis", ohne den Bruch, wenn er schon das Ergebnis ist oder oben 0 steht
const quotient = (n: Rational, d: Rational) => {
  const q = ratLatex(ratDiv(n, d))
  return isZero(n) || (ratAbs(d).n === 1n && ratAbs(d).d === 1n) ? q : `${fracLatex(n, d)} = ${q}`
}
const factor = (x: string) => (x.startsWith('-') ? `(${x})` : x)
// Zahl mal Vektor ohne Faktor 1: v, -v, 2 · v
const timesVec = (k: Rational, v: Vec) => {
  const abs = ratAbs(k)
  const body = abs.n === 1n && abs.d === 1n ? vecLatex(v) : `${ratLatex(abs)} \\cdot ${vecLatex(v)}`
  return ratSign(k) < 0 ? `-${body}` : body
}
// Summand „+ k · v" bzw. „- |k| · v"
const plusVec = (k: Rational, v: Vec) => ` ${ratSign(k) < 0 ? '-' : '+'} ${timesVec(ratAbs(k), v)}`
// Kette „a = b = c" ohne doppeltes Glied
const chain = (...parts: readonly string[]) => parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(' = ')
const dotTerms = (a: Vec, b: Vec) => a.map((x, i) => `${factor(ratLatex(x))} \\cdot ${factor(ratLatex(b[i]))}`).join(' + ')
// Quadrate der Einträge: negative Zahlen und Brüche in Klammern
const squares = (v: Vec) => v.map((x) => (x.d === 1n && ratSign(x) >= 0 ? `${ratLatex(x)}^2` : `\\left(${ratLatex(x)}\\right)^2`)).join(' + ')
// k·x ohne Faktor 1: x, -x, 2\,x
const kc = (k: number, x: string) => (k === 1 ? x : k === -1 ? `-${x}` : `${k}\\,${x}`)
const isParallel = (a: Vec, b: Vec) => {
  const d = vecDot(a, b)
  const p = ratMul(vecNorm2(a), vecNorm2(b))
  const dd = ratMul(d, d)
  return dd.n === p.n && dd.d === p.d
}
const lengthLatex = (v: Vec) => surdLatex(vecLength(v))
// Vektor mal Zahl mit Wurzel: c·√r · v
const surdTimes = (s: Surd, v: Vec) => (s.rad === 1n ? vecLatex(vecScale(s.coef, v)) : surdVecLatex(vecScale(s.coef, v), s.rad))
const surdNum = (s: Surd) => surdValue(s)
const termT = (c: number, t: string) => (c === 1 ? t : c === -1 ? `-${t}` : `${c}${t}`)
const linLatex = (C: number, K: number, t: string) => `${termT(C, t)}${K === 0 ? '' : ` ${K > 0 ? '+' : '-'} ${Math.abs(K)}`}`

// Zerlegung von a längs b
type Split = {
  readonly a: Vec
  readonly b: Vec
  readonly d: Rational
  readonly nb2: Rational
  readonly k: Rational
  readonly par: Vec
  readonly perp: Vec
}

function split(a: Vec, b: Vec): Split {
  const d = vecDot(a, b)
  const nb2 = vecNorm2(b)
  const k = ratDiv(d, nb2)
  const par = vecScale(k, b)
  return { a, b, d, nb2, k, par, perp: vecSub(a, par) }
}

// a und b zufällig mit kleinen Brüchen im Schatten (Nenner höchstens den), nicht parallel, Skalarprodukt nicht 0
function pickSplit(rng: Rng, dim: number, R: number, den: bigint): Split {
  const zmax = dim <= 2 ? 0 : 1
  for (let i = 0; i < 20000; i++) {
    const a = ints(rng, dim, -R, R)
    const b = ints(rng, dim, -R, R)
    if (zeroCount(a) > zmax || zeroCount(b) > zmax || negCount(a) + negCount(b) === 0) continue
    const s = split(a, b)
    if (isZero(s.d) || num(s.nb2) <= 1 || isParallel(a, b) || maxDen(s.par) > den) continue
    // Schatten und Rest beide gut zu sehen: cos² des Winkels zwischen 1/16 und 15/16
    const cos2 = num(ratDiv(ratMul(s.d, s.d), ratMul(vecNorm2(a), s.nb2)))
    if (cos2 < 1 / 16 || cos2 > 15 / 16) continue
    return s
  }
  throw new Error('Keine Zerlegung gefunden')
}

// ------------------------------------------------------------------ Bilder

// Strecke der Geraden durch from in Richtung dir, über die Parameter lo bis hi
const lineSegment = (from: readonly number[], dir: readonly number[], lo: number, hi: number): DrawSegment => ({
  from: from.map((x, i) => x + lo * dir[i]),
  to: from.map((x, i) => x + hi * dir[i]),
  color: 'muted',
  dashed: true,
})

// Rechter Winkel am Lotfußpunkt: zur Geraden (zurück zum Stützpunkt bzw. in Richtung dir) und zur Spitze
function rightAngle(foot: readonly number[], dir: readonly number[], tip: readonly number[], phase?: number) {
  return { at: foot, u: dir.map((x) => -x), v: tip.map((x, i) => x - foot[i]), color: 'r' as const, ...(phase ? { phase } : {}) }
}

// Schatten zu lang, weil durch |b| statt |b|² geteilt: nur, wenn er noch ins Bild passt
function shadowMistake(start: readonly number[], dir: Vec, s: Split, tip: readonly number[], name: string, dirName: string): DrawMistake | undefined {
  const len = (v: readonly number[]) => Math.hypot(...v)
  const wrong = start.map((x, i) => x + surdNum(cosSurd(s.d, s.nb2)) * num(dir[i]))
  const extent = Math.max(len(tip.map((x, i) => x - start[i])), len(nums(dir)))
  if (len(wrong.map((x, i) => x - start[i])) > 1.7 * extent) return undefined
  return {
    arrows: [{ from: start, to: wrong, color: 'bad' }],
    segments: [{ from: tip, to: wrong, color: 'bad', dashed: true }],
    caption: `Rot: der Schatten, wenn du durch $\\lvert ${dirName} \\rvert$ statt durch $\\lvert ${dirName} \\rvert^2$ teilst. Er ist $\\lvert ${dirName} \\rvert = ${surdLatex(sqrtRat(s.nb2))}$-mal so lang wie $${name}$, und die rote Strecke zur Spitze steht nicht senkrecht auf der Geraden.`,
  }
}

// a und b vom Ursprung, die Gerade durch b; mit Ergebnis: Lot (Licht an), Schatten, senkrechter Rest, rechter Winkel
function projDrawing(dim: 2 | 3, an: string, bn: string, s: Split, caption: string, result: boolean): VectorDrawing {
  const o = origin(dim)
  const [a, b, par] = [nums(s.a), nums(s.b), nums(s.par)]
  const k = num(s.k)
  const lo = Math.min(0, result ? k : 0) - 0.35
  const hi = Math.max(1, result ? k : 1) + 0.35
  const base: VectorDrawing = {
    ...emptyDrawing(dim, caption),
    segments: [lineSegment(o, b, lo, hi)],
    arrows: [
      { from: o, to: a, color: 'a', label: an },
      { from: o, to: b, color: 'b', label: bn },
    ],
  }
  if (!result) return base
  const mistake = shadowMistake(o, s.b, s, a, parName(an), bn)
  return {
    ...base,
    segments: [...base.segments, { from: a, to: par, color: 'muted', dashed: true, phase: 1 }],
    arrows: [...base.arrows, { from: o, to: par, color: 'r', label: parName(an), phase: 2 }, { from: par, to: a, color: 'c', label: perpName(an), phase: 3 }],
    angles: [rightAngle(par, b.map((x) => x * Math.sign(k)), a, 3)],
    playLabel: 'Licht an',
    ...(mistake ? { mistake } : {}),
  }
}

// ------------------------------------------------------------------ Schritte

// k = a·b / |b|² (mit Rechnung in der Erklärung)
function factorStep(rng: Rng, an: string, bn: string, s: Split, kName = 'k', id = 'faktor'): GuidedStep {
  const line = (x: string) => math(`${kName} = ${x}`)
  const wrongs: Wrong[] = [
    { content: line(surdLatex(cosSurd(s.d, s.nb2))), rule: 'vec-proj-not-squared' },
    { content: line(ratLatex(ratDiv(s.d, vecNorm2(s.a)))), rule: 'vec-proj-swapped' },
    { content: line(ratLatex(ratDiv(s.nb2, s.d))), rule: 'vec-proj-inverted' },
  ]
  const dotLine = `${an} \\cdot ${bn} = ${dotTerms(s.a, s.b)} = ${ratLatex(s.d)}`
  const normLine = `\\lvert ${bn} \\rvert^2 = ${squares(s.b)} = ${ratLatex(s.nb2)}`
  const kLine = `${kName} = \\frac{${an} \\cdot ${bn}}{\\lvert ${bn} \\rvert^2} = ${quotient(s.d, s.nb2)}`
  return choiceStep(rng, {
    id,
    title: 'Faktor',
    question: `Der Schatten von $${an}$ ist ein Vielfaches von $${bn}$: $${kName}\\,${bn}$. Wie groß ist $${kName}$?`,
    correct: line(ratLatex(s.k)),
    wrongs,
    hint: `Teile das Skalarprodukt $${an} \\cdot ${bn}$ durch $\\lvert ${bn} \\rvert^2 = ${bn} \\cdot ${bn}$, die Summe der Quadrate (ohne Wurzel).`,
    explanation: { detailed: `$${dotLine}$ und $${normLine}$, also $${kLine}$.`, short: `$${kLine}$.` },
    established: [dotLine, normLine, kLine],
    cards: [CARD.projektion],
  })
}

// a_∥ = k·b
function parStep(rng: Rng, an: string, bn: string, s: Split, kName = 'k'): GuidedStep {
  const pn = parName(an)
  const line = (x: string) => math(`${pn} = ${x}`)
  const wrongs: Wrong[] = [
    { content: line(surdTimes(cosSurd(s.d, s.nb2), s.b)), rule: 'vec-proj-not-squared' },
    { content: line(vecLatex(vecScale(ratDiv(s.d, vecNorm2(s.a)), s.a))), rule: 'vec-proj-swapped' },
    { content: line(vecLatex(vecScale(s.k, s.a))), rule: 'vec-proj-times-a' },
  ]
  const formula = chain(pn, `${kName}\\,${bn}`, timesVec(s.k, s.b), vecLatex(s.par))
  return choiceStep(rng, {
    id: 'schatten',
    title: 'Schatten',
    question: `Wie lautet der Schatten $${pn}$ von $${an}$ auf $${bn}$?`,
    correct: line(vecLatex(s.par)),
    wrongs,
    hint: `Der Schatten liegt auf der Geraden von $${bn}$: Nimm $${bn}$ mal den Faktor $${kName}$, Eintrag für Eintrag.`,
    explanation: { detailed: `$${pn} = \\frac{${an} \\cdot ${bn}}{\\lvert ${bn} \\rvert^2}\\,${bn}$, also $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.projektion],
  })
}

// a_⊥ = a − a_∥ mit Probe
function perpStep(rng: Rng, an: string, bn: string, s: Split): GuidedStep {
  const [pn, qn] = [parName(an), perpName(an)]
  const line = (v: Vec) => math(`${qn} = ${vecLatex(v)}`)
  const wrongs: Wrong[] = [
    { content: line(vecSub(s.par, s.a)), rule: 'vec-rest-reversed' },
    { content: line(vecAdd(s.a, s.par)), rule: 'vec-rest-added' },
    { content: line(vecSub(s.a, s.b)), rule: 'vec-rest-minus-b' },
  ]
  const formula = `${qn} = ${an} - ${pn} = ${vecLatex(s.a)} - ${vecLatex(s.par)} = ${vecLatex(s.perp)}`
  const probe = `${qn} \\cdot ${bn} = ${dotTerms(s.perp, s.b)} = 0`
  return choiceStep(rng, {
    id: 'rest',
    title: 'Senkrechter Teil',
    question: `Wie lautet der Teil $${qn}$, der senkrecht auf $${bn}$ steht?`,
    correct: line(s.perp),
    wrongs,
    hint: `Was von $${an}$ übrig bleibt, wenn du den Schatten wegnimmst: $${an} = ${pn} + ${qn}$.`,
    explanation: { detailed: `Aus $${an} = ${pn} + ${qn}$ folgt $${formula}$. Probe: $${probe}$.`, short: `$${formula}$.` },
    established: [formula, probe],
    cards: [CARD.zerlegung],
  })
}

// Länge eines Vektors (mit Name)
function lengthStep(rng: Rng, name: string, v: Vec, id = 'laenge'): GuidedStep {
  const line = (x: string) => math(`${name} = ${x}`)
  const n2 = vecNorm2(v)
  const wrongs: Wrong[] = [
    { content: line(ratLatex(n2)), rule: 'vec-length-no-root' },
    { content: line(ratLatex(v.reduce((acc, x) => ratAdd(acc, ratAbs(x)), rat(0)))), rule: 'vec-length-abs-sum' },
  ]
  const signed = v.reduce((acc, x) => ratAdd(acc, ratSign(x) < 0 ? ratNeg(ratMul(x, x)) : ratMul(x, x)), rat(0))
  if (negCount(v) > 0 && ratSign(signed) > 0) wrongs.push({ content: line(surdLatex(sqrtRat(signed))), rule: 'vec-square-sign' })
  const direct = `\\sqrt{${ratLatex(n2)}}`
  const simple = surdLatex(sqrtRat(n2))
  const formula = `${name} = \\sqrt{${squares(v)}} = ${direct === simple ? direct : `${direct} = ${simple}`}`
  return choiceStep(rng, {
    id,
    title: 'Länge',
    question: `Wie groß ist $${name}$?`,
    correct: line(simple),
    wrongs,
    hint: 'Einträge quadrieren, addieren, Wurzel ziehen.',
    explanation: { detailed: `Pythagoras: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.laenge],
  })
}

// Abstand = Länge des Lots (senkrechter Teil); falsche Strecken: Schatten, ganzer Pfeil
function distanceStep(rng: Rng, name: string, perp: Vec, perpLabel: string, shadow: Vec, whole: Vec, question: string): GuidedStep {
  const line = (v: Vec) => math(`${name} = ${lengthLatex(v)}`)
  const wrongs: Wrong[] = [
    { content: line(shadow), rule: 'vec-dist-shadow' },
    { content: line(whole), rule: 'vec-dist-shadow' },
    { content: math(`${name} = ${ratLatex(vecNorm2(perp))}`), rule: 'vec-length-no-root' },
  ]
  const n2 = vecNorm2(perp)
  const formula = `${name} = \\lvert ${perpLabel} \\rvert = \\sqrt{${squares(perp)}} = ${surdLatex(sqrtRat(n2))}`
  return choiceStep(rng, {
    id: 'abstand',
    title: 'Abstand',
    question,
    correct: line(perp),
    wrongs,
    hint: 'Der Abstand ist die Länge des Lots, also des senkrechten Teils mit dem rechten Winkel.',
    explanation: { detailed: `Das Lot steht senkrecht auf der Geraden, seine Länge ist der kürzeste Abstand: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.lot],
  })
}

const dimFor = (level: Level, rng: Rng) => (level === 1 ? 2 : level === 2 ? 3 : rng.pick([2, 3]))
const drawableDim = (dim: number): dim is 2 | 3 => dim === 2 || dim === 3
const NO_PICTURE = 'In mehr als drei Dimensionen gibt es kein Bild, gerechnet wird genauso.'
const denForm = (v: Vec) => (maxDen(v) > 1n ? 'frac' : 'int')
// Faktor des Schattens: Vorzeichen und ob der Schatten kürzer oder länger als b ist (Form für die Abwechslung)
const kClass = (k: Rational) => `${ratSign(k)}${Math.abs(num(k)) < 1 ? 's' : Math.abs(num(k)) === 1 ? 'e' : 'l'}`

// ------------------------------------------------------------------ Arten

// Schatten von a auf b; Stufe 3: b als Verbindungsvektor zweier Punkte
function buildProjection(rng: Rng, level: Level): Built {
  const dim = dimFor(level, rng)
  const { vecs, points } = letters(rng)
  const an = vecName(vecs[0])
  const fromPoints = level === 3
  const [P, Q] = points
  const bn = fromPoints ? arrowName(P, Q) : vecName(vecs[1])
  for (;;) {
    const s = pickSplit(rng, dim, level === 1 ? 4 : 5, level === 1 ? 1n : 3n)
    const pd = drawableDim(dim)
    const question = pd ? projDrawing(dim, an, bn, s, `Gesucht ist der Schatten von $${an}$ auf der Geraden durch $${bn}$.`, false) : undefined
    let p: Vec = vec()
    const steps: GuidedStep[] = []
    if (fromPoints) {
      p = ints(rng, dim, -4, 4)
      steps.push(connectStep(rng, P, Q, p, vecAdd(p, s.b)))
    }
    if (level >= 2) steps.push(dotStep(rng, an, bn, s.a, s.b, fromPoints ? undefined : question))
    steps.push(level >= 2 ? factorStep(rng, an, bn, s) : withDrawing(factorStep(rng, an, bn, s), question))
    steps.push(parStep(rng, an, bn, s))
    if (steps.some((st) => st.choices.length < 3)) continue
    const pn = parName(an)
    return {
      kind: 'projection',
      instruction: fromPoints
        ? `Projiziere $${an}$ auf die Richtung von $${P}$ nach $${Q}$: Wie lautet der Schatten $${pn}$ von $${an}$ auf $${bn}$?`
        : `Wie lautet der Schatten $${pn}$ von $${an}$ auf $${bn}$ (die Projektion von $${an}$ auf $${bn}$)?`,
      functionLatex: fromPoints ? `${an} = ${vecLatex(s.a)},\\; ${pointLatex(P, p)},\\; ${pointLatex(Q, vecAdd(p, s.b))}` : `${an} = ${vecLatex(s.a)},\\; ${bn} = ${vecLatex(s.b)}`,
      steps,
      cards: [CARD.projektion],
      resultLatex: `${pn} = ${vecLatex(s.par)}`,
      ...(pd ? { resultDrawing: projDrawing(dim, an, bn, s, `Das Lot von der Spitze von $${an}$ trifft die Gerade durch $${bn}$ an der Spitze des Schattens $${pn}$.`, true) } : {}),
      form: `projection|${dim}|${fromPoints ? 'pts' : 'vec'}|${vecs[0]}|${signShape(s.a, s.b)}|${kClass(s.k)}|${denForm(s.par)}`,
      data: { a: nums(s.a), b: nums(s.b) },
      answer: nums(s.par),
    }
  }
}

const withDrawing = (step: GuidedStep, drawing?: VectorDrawing): GuidedStep => (drawing ? { ...step, drawing } : step)

// a = a_∥ + a_⊥; Stufe 3 dazu der Abstand der Spitze von der Geraden, Stufe 4 in vier und fünf Dimensionen
function buildDecompose(rng: Rng, level: Level): Built {
  const dim = level === 4 ? rng.pick([4, 5]) : dimFor(level, rng)
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  const withLength = level === 3
  for (;;) {
    const s = pickSplit(rng, dim, level === 4 ? 3 : level === 1 ? 4 : 5, level === 1 ? 1n : level === 4 ? 7n : 3n)
    const pd = drawableDim(dim)
    const question = pd ? projDrawing(dim, an, bn, s, `Zerlege $${an}$ in einen Teil längs der Geraden durch $${bn}$ und einen Teil senkrecht dazu.`, false) : undefined
    const [pn, qn] = [parName(an), perpName(an)]
    const steps: GuidedStep[] = []
    if (level >= 2) steps.push(dotStep(rng, an, bn, s.a, s.b, question))
    steps.push(level >= 2 ? factorStep(rng, an, bn, s) : withDrawing(factorStep(rng, an, bn, s), question))
    steps.push(parStep(rng, an, bn, s), perpStep(rng, an, bn, s))
    if (withLength) steps.push(lengthStep(rng, `\\lvert ${qn} \\rvert`, s.perp, 'rest-laenge'))
    if (steps.some((st) => st.choices.length < 3)) continue
    const tail = withLength ? `,\\; \\lvert ${qn} \\rvert = ${lengthLatex(s.perp)}` : ''
    return {
      kind: 'decompose',
      instruction: `Zerlege $${an}$ in einen Teil $${pn}$ parallel zu $${bn}$ und einen Teil $${qn}$ senkrecht zu $${bn}$.${withLength ? ` Wie lang ist $${qn}$ (der Abstand der Spitze von $${an}$ zur Geraden durch $${bn}$)?` : ''}`,
      functionLatex: `${an} = ${vecLatex(s.a)},\\; ${bn} = ${vecLatex(s.b)}`,
      steps,
      cards: [CARD.projektion, CARD.zerlegung],
      resultLatex: `${pn} = ${vecLatex(s.par)},\\; ${qn} = ${vecLatex(s.perp)}${tail}`,
      ...(pd ? { resultDrawing: projDrawing(dim, an, bn, s, `$${an} = ${pn} + ${qn}$: der Schatten auf der Geraden durch $${bn}$ und der Rest, der senkrecht darauf steht.`, true) } : { note: NO_PICTURE }),
      form: `decompose|${dim}|${withLength ? 'len' : 'plain'}|${vecs[0]}|${signShape(s.a, s.b)}|${kClass(s.k)}|${denForm(s.par)}`,
      data: { a: nums(s.a), b: nums(s.b) },
      answer: [...nums(s.par), ...nums(s.perp), ...(withLength ? [surdValue(vecLength(s.perp))] : [])],
    }
  }
}

// Länge des Schattens |a·b| / |b|
function buildShadowLength(rng: Rng, level: Level): Built {
  const dim = level === 1 ? 2 : 3
  const { vecs } = letters(rng)
  const an = vecName(vecs[0])
  const bn = vecName(vecs[1])
  const pn = parName(an)
  for (;;) {
    const s = pickSplit(rng, dim, 5, 6n)
    const nb = sqrtRat(s.nb2)
    const len = cosSurd(ratAbs(s.d), s.nb2)
    const line = (x: string) => math(`\\lvert ${pn} \\rvert = ${x}`)
    const wrongs: Wrong[] = [
      { content: line(ratLatex(ratDiv(ratAbs(s.d), s.nb2))), rule: 'vec-shadow-squared' },
      { content: line(surdLatex(cosSurd(ratAbs(s.d), vecNorm2(s.a)))), rule: 'vec-proj-swapped' },
    ]
    if (ratSign(s.d) < 0) wrongs.unshift({ content: line(surdLatex(cosSurd(s.d, s.nb2))), rule: 'vec-shadow-no-abs' })
    wrongs.push({ content: line(surdLatex({ coef: ratDiv(nb.coef, ratAbs(s.d)), rad: nb.rad })), rule: 'vec-proj-inverted' })
    const formula = `\\lvert ${pn} \\rvert = \\frac{\\lvert ${an} \\cdot ${bn} \\rvert}{\\lvert ${bn} \\rvert} = \\frac{${ratLatex(ratAbs(s.d))}}{${surdLatex(nb)}} = ${surdLatex(len)}`
    const question = projDrawing(dim, an, bn, s, `Wie lang ist der Schatten von $${an}$ auf der Geraden durch $${bn}$?`, false)
    const steps = [
      dotStep(rng, an, bn, s.a, s.b, question),
      lengthStep(rng, `\\lvert ${bn} \\rvert`, s.b),
      choiceStep(rng, {
        id: 'schatten-laenge',
        title: 'Länge des Schattens',
        question: `Wie lang ist der Schatten $${pn}$?`,
        correct: line(surdLatex(len)),
        wrongs,
        hint: `Betrag des Skalarprodukts durch die Länge von $${bn}$, einmal geteilt (nicht durch das Quadrat).`,
        explanation: {
          detailed: `$${formula}$.${ratSign(s.d) < 0 ? ` Das Skalarprodukt ist negativ: Der Schatten zeigt entgegen $${bn}$, seine Länge ist trotzdem positiv.` : ''}`,
          short: `$${formula}$.`,
        },
        established: [formula],
        cards: [CARD.projektion],
      }),
    ]
    if (steps.some((st) => st.choices.length < 3)) continue
    return {
      kind: 'shadowLength',
      instruction: `Wie lang ist der Schatten $${pn}$ von $${an}$ auf $${bn}$?`,
      functionLatex: `${an} = ${vecLatex(s.a)},\\; ${bn} = ${vecLatex(s.b)}`,
      steps,
      cards: [CARD.projektion],
      resultLatex: `\\lvert ${pn} \\rvert = ${surdLatex(len)}`,
      resultDrawing: projDrawing(
        dim,
        an,
        bn,
        s,
        `Der Schatten $${pn}$ ist $${surdLatex(len)}$ lang${ratSign(s.d) < 0 ? ` und zeigt entgegen $${bn}$, weil $${an} \\cdot ${bn}$ negativ ist` : ''}.`,
        true,
      ),
      form: `shadowLength|${dim}|${vecs[0]}|${signShape(s.a, s.b)}|${kClass(s.k)}|${len.rad === 1n ? 'rat' : 'root'}`,
      data: { a: nums(s.a), b: nums(s.b) },
      answer: [surdValue(len)],
    }
  }
}

const FOOT_NAMES = [
  { start: 'A', end: 'B', point: 'P', dir: 'v' },
  { start: 'B', end: 'C', point: 'Q', dir: 'u' },
  { start: 'S', end: 'T', point: 'R', dir: 'r' },
] as const

// Lotfußpunkt F von P auf die Gerade durch A mit Richtung v; ab Stufe 3 der Abstand, Stufe 5 Gerade durch zwei Punkte
function buildFoot(rng: Rng, level: Level): Built {
  const dim = level === 2 ? 2 : 3
  const names = rng.pick(FOOT_NAMES)
  const [A, B, P] = [names.start, names.end, names.point]
  const twoPoints = level === 5
  const vn = twoPoints ? arrowName(A, B) : vecName(names.dir)
  const apn = arrowName(A, P)
  const withDistance = level >= 3
  for (;;) {
    const s = pickSplit(rng, dim, 4, level === 2 ? 2n : level === 3 ? 3n : 6n)
    // s.a = AP, s.b = v
    const a0 = ints(rng, dim, -4, 4)
    if (zeroCount(a0) === dim) continue
    const p0 = vecAdd(a0, s.a)
    const f = vecAdd(a0, s.par)
    const pd = drawableDim(dim)
    const lineFrom = nums(a0)
    const k = num(s.k)
    const pic = (caption: string, result: boolean): VectorDrawing | undefined => {
      if (!pd) return undefined
      const [an, pn, fn, vnum] = [nums(a0), nums(p0), nums(f), nums(s.b)]
      const lo = Math.min(0, result ? k : 0) - 0.5
      const hi = Math.max(1, result ? k : 1) + 0.5
      const base: VectorDrawing = {
        ...emptyDrawing(dim, caption),
        segments: [lineSegment(an, vnum, lo, hi)],
        arrows: [
          { from: an, to: an.map((x, i) => x + vnum[i]), color: 'b', label: vn },
          { from: an, to: pn, color: 'a', label: apn },
        ],
        points: [
          { at: an, label: A },
          { at: pn, label: P },
          ...(twoPoints ? [{ at: an.map((x, i) => x + vnum[i]), label: B }] : []),
        ],
      }
      if (!result) return base
      const mistake = shadowMistake(an, s.b, s, pn, `\\overrightarrow{${A}F}`, vn)
      const lot: DrawArrow[] = [{ from: an, to: fn, color: 'r', label: `\\overrightarrow{${A}F}`, phase: 2 }]
      return {
        ...base,
        segments: [...base.segments, { from: pn, to: fn, color: 'muted', dashed: true, phase: 1 }, { from: fn, to: pn, color: 'c', phase: 3, ...(withDistance ? { label: 'd' } : {}) }],
        arrows: [...base.arrows, ...lot],
        points: [...base.points, { at: fn, label: 'F', color: 'r', phase: 3 }],
        angles: [rightAngle(fn, vnum.map((x) => x * (Math.sign(k) || 1)), pn, 3)],
        playLabel: 'Licht an',
        ...(mistake ? { mistake } : {}),
      }
    }
    const steps: GuidedStep[] = []
    if (twoPoints) steps.push(connectStep(rng, A, B, a0, vecAdd(a0, s.b), pic(`Die Gerade durch $${A}$ und $${B}$ und der Punkt $${P}$.`, false)))
    steps.push(twoPoints ? connectStep(rng, A, P, a0, p0) : connectStep(rng, A, P, a0, p0, pic(`Die Gerade durch $${A}$ in Richtung $${vn}$ und der Punkt $${P}$.`, false)))
    steps.push(factorStep(rng, apn, vn, s))
    // Lotfußpunkt F = A + k·v
    const pointLine = (v: Vec) => math(pointLatex('F', v))
    const wrongs: Wrong[] = [
      { content: pointLine(s.par), rule: 'vec-foot-no-start' },
      { content: pointLine(vecAdd(p0, s.par)), rule: 'vec-foot-from-p' },
      { content: pointLine(vecAdd(a0, vecScale(s.k, s.a))), rule: 'vec-proj-times-a' },
    ]
    const footLine = `\\overrightarrow{OF} = \\overrightarrow{O${A}} + k\\,${vn} = ${vecLatex(a0)}${plusVec(s.k, s.b)} = ${vecLatex(f)}`
    steps.push(
      choiceStep(rng, {
        id: 'fusspunkt',
        title: 'Lotfußpunkt',
        question: `Wo liegt der Lotfußpunkt $F$ von $${P}$ auf der Geraden?`,
        correct: pointLine(f),
        wrongs,
        hint: `Geh von $${A}$ aus den Schatten $k\\,${vn}$ entlang der Geraden.`,
        explanation: { detailed: `Der Schatten von $${apn}$ auf $${vn}$ führt von $${A}$ zum Lotfußpunkt: $${footLine}$, also $${pointLatex('F', f)}$.`, short: `$${footLine}$.` },
        established: [footLine],
        cards: [CARD.lot],
      }),
    )
    if (withDistance)
      steps.push(
        distanceStep(rng, 'd', vecSub(p0, f), `\\overrightarrow{F${P}}`, s.par, s.a, `Wie groß ist der Abstand $d$ von $${P}$ zur Geraden?`),
      )
    if (steps.some((st) => st.choices.length < 3)) continue
    const dist = vecLength(s.perp)
    const given = twoPoints
      ? `${pointLatex(A, a0)},\\; ${pointLatex(B, vecAdd(a0, s.b))},\\; ${pointLatex(P, p0)}`
      : `${pointLatex(A, a0)},\\; ${vn} = ${vecLatex(s.b)},\\; ${pointLatex(P, p0)}`
    const line = twoPoints ? `die Gerade durch $${A}$ und $${B}$` : `die Gerade durch $${A}$ in Richtung $${vn}$`
    return {
      kind: 'foot',
      instruction: `Bestimme den Lotfußpunkt $F$ von $${P}$ auf ${line}${withDistance ? ` und den Abstand $d$ von $${P}$ zu dieser Geraden` : ''}.`,
      functionLatex: given,
      steps,
      cards: [CARD.projektion, CARD.lot],
      resultLatex: `${pointLatex('F', f)}${withDistance ? `,\\; d = ${surdLatex(dist)}` : ''}`,
      ...(pd ? { resultDrawing: pic(`Das Lot von $${P}$ trifft die Gerade im rechten Winkel bei $F$${withDistance ? `; seine Länge ist der Abstand $d = ${surdLatex(dist)}$` : ''}.`, true) } : {}),
      form: `foot|${dim}|${twoPoints ? 'pts' : 'dir'}|${A}|${signShape(s.a, s.b)}|${ratSign(s.k)}|${denForm(f)}|${zeroCount(a0)}`,
      data: { A: lineFrom, v: nums(s.b), P: nums(p0) },
      answer: [...nums(f), ...(withDistance ? [surdValue(dist)] : [])],
    }
  }
}

// Stufe 4: t so, dass der Schatten ein gegebener Vektor ist (linear); Stufe 5: so, dass er eine gegebene Länge hat (Betrag,
// zwei Lösungen)
function buildProjParam(rng: Rng, level: Level): Built {
  const dim = rng.pick([2, 3])
  const { vecs } = letters(rng)
  const [an, bn, cn] = vecs.map(vecName)
  const t = rng.pick(PARAMS)
  const pn = parName(an)
  const byLength = level === 5
  for (;;) {
    // b mit ganzzahliger Länge, wenn die Länge des Schattens gesucht ist
    const b = byLength ? pythagoreanVec(rng, dim) : ints(rng, dim, -4, 4)
    if (!byLength && (zeroCount(b) > dim - 2 || num(vecNorm2(b)) <= 1)) continue
    const i = rng.int(0, dim - 1)
    if (isZero(b[i])) continue
    const sc = rng.pick([1, -1, 2, -2, 3])
    const p = ints(rng, dim, -5, 5)
    if (zeroCount(p) > 1) continue
    const nb2 = vecNorm2(b)
    const C = sc * num(b[i])
    const K = num(vecDot(p, b))
    const entries = p.map((x, j) => (j === i ? linLatex(sc, num(x), t) : ratLatex(x)))
    const aLatex = columnLatex(entries)
    const lin = linLatex(C, K, t)
    const dotLine = `${an} \\cdot ${bn} = ${entries.map((e, j) => `${e.includes(' ') || e.startsWith('-') ? `(${e})` : e} \\cdot ${factor(ratLatex(b[j]))}`).join(' + ')} = ${lin}`
    const aAt = (tv: Rational): Vec => p.map((x, j) => (j === i ? ratAdd(ratMul(rat(sc), tv), x) : x))
    if (!byLength) {
      const k = rng.pick([-2, -1, 1, 2, 3])
      const c = vecScale(rat(k), b)
      const rhs = k * num(nb2)
      const sol = ratDiv(rat(rhs - K), rat(C))
      if (sol.d > 6n || isZero(ratSub(rat(rhs), rat(K)))) continue
      const nb = sqrtRat(nb2)
      const eq = (l: string, r: string) => math(`${l} = ${r}`)
      const step1 = choiceStep(rng, {
        id: 'gleichung',
        title: 'Gleichung',
        question: `Welche Gleichung muss $${t}$ erfüllen, damit $${pn} = ${cn}$ gilt?`,
        correct: eq(lin, String(rhs)),
        wrongs: [
          { content: eq(lin, surdLatex({ coef: ratMul(rat(k), nb.coef), rad: nb.rad })), rule: 'vec-proj-not-squared' },
          { content: eq(lin, String(k)), rule: 'vec-proj-no-denominator' },
          { content: eq(linLatex(-C, K, t), String(rhs)), rule: 'vec-dot-sign' },
        ],
        hint: `$${cn} = ${kc(k, bn)}$. Der Schatten ist $\\frac{${an} \\cdot ${bn}}{\\lvert ${bn} \\rvert^2}\\,${bn}$, also muss $${an} \\cdot ${bn} = ${kc(k, `\\lvert ${bn} \\rvert^2`)}$ sein.`,
        explanation: {
          detailed: `$${cn} = ${kc(k, bn)}$, und der Schatten ist $\\frac{${an} \\cdot ${bn}}{\\lvert ${bn} \\rvert^2}\\,${bn}$. Also muss $\\frac{${an} \\cdot ${bn}}{\\lvert ${bn} \\rvert^2} = ${k}$ sein, d. h. $${an} \\cdot ${bn} = ${kc(k, `\\lvert ${bn} \\rvert^2`)} = ${rhs}$ wegen $\\lvert ${bn} \\rvert^2 = ${ratLatex(nb2)}$. Mit $${dotLine}$ heißt das $${lin} = ${rhs}$.`,
          short: `$${dotLine} = ${kc(k, `\\lvert ${bn} \\rvert^2`)} = ${rhs}$.`,
        },
        established: [dotLine, `\\lvert ${bn} \\rvert^2 = ${ratLatex(nb2)}`, `${lin} = ${rhs}`],
        cards: [CARD.projektion],
      })
      const tLine = (r: Rational) => math(`${t} = ${ratLatex(r)}`)
      const step2 = choiceStep(rng, {
        id: 'aufloesen',
        title: 'Auflösen',
        question: `Wie groß ist $${t}$?`,
        correct: tLine(sol),
        wrongs: [
          { content: tLine(ratDiv(rat(rhs + K), rat(C))), rule: 'vec-param-solve' },
          { content: tLine(ratDiv(rat(C), rat(rhs - K))), rule: 'vec-param-solve' },
          { content: tLine(ratDiv(rat(k - K), rat(C))), rule: 'vec-proj-no-denominator' },
        ],
        hint: K === 0 ? `Teile durch $${C}$.` : `Bring $${K}$ auf die andere Seite und teile durch $${C}$.`,
        explanation: {
          detailed: `$${lin} = ${rhs}${K === 0 ? '' : ` \\;\\Rightarrow\\; ${termT(C, t)} = ${rhs - K}`} \\;\\Rightarrow\\; ${t} = ${quotient(rat(rhs - K), rat(C))}$.`,
          short: `$${t} = ${quotient(rat(rhs - K), rat(C))}$.`,
        },
        established: [`${t} = ${ratLatex(sol)}`],
        cards: [CARD.projektion],
      })
      const steps = [step1, step2]
      if (steps.some((st) => st.choices.length < 3)) continue
      const a = aAt(sol)
      const s = split(a, b)
      const pd = drawableDim(dim) && !isParallel(a, b) && !isZero(s.d)
      return {
        kind: 'projParam',
        instruction: `Für welches $${t}$ ist der Schatten $${pn}$ von $${an}$ auf $${bn}$ gleich $${cn}$?`,
        functionLatex: `${an} = ${aLatex},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${vecLatex(c)}`,
        steps,
        cards: [CARD.projektion],
        resultLatex: `${t} = ${ratLatex(sol)}`,
        ...(pd && drawableDim(dim) ? { resultDrawing: projDrawing(dim, an, bn, s, `Mit $${t} = ${ratLatex(sol)}$ ist $${an} = ${vecLatex(a)}$, und sein Schatten auf $${bn}$ ist genau $${cn}$.`, true) } : {}),
        form: `projParam|${dim}|lin|${t}|${i}|${Math.sign(sc)}|${k}|${signShape(p, b)}|${sol.d > 1n ? 'frac' : 'int'}`,
        data: { p: nums(p), b: nums(b), c: nums(c), i: [i], s: [sc] },
        answer: [num(sol)],
      }
    }
    // Länge L: |a·b| = L·|b|; ohne Zahl ohne t (K = 0) wäre |−C·t| = |C·t| keine falsche Antwort
    if (K === 0) continue
    const lb = num(sqrtRat(nb2).coef)
    const L = rng.int(1, 3)
    const R = L * lb
    const t1 = ratDiv(rat(-R - K), rat(C))
    const t2 = ratDiv(rat(R - K), rat(C))
    if (t1.d > 4n || t2.d > 4n) continue
    const [lo, hi] = num(t1) < num(t2) ? [t1, t2] : [t2, t1]
    const absEq = (l: string, r: number) => math(`\\left\\lvert ${l} \\right\\rvert = ${r}`)
    const step1 = choiceStep(rng, {
      id: 'gleichung',
      title: 'Gleichung',
      question: `Welche Gleichung muss $${t}$ erfüllen, damit $\\lvert ${pn} \\rvert = ${L}$ gilt?`,
      correct: absEq(lin, R),
      wrongs: [
        { content: absEq(lin, L * lb * lb), rule: 'vec-shadow-squared' },
        { content: math(`${lin} = ${R}`), rule: 'vec-shadow-no-abs' },
        { content: absEq(linLatex(-C, K, t), R), rule: 'vec-dot-sign' },
      ],
      hint: `Die Länge des Schattens ist $\\frac{\\lvert ${an} \\cdot ${bn} \\rvert}{\\lvert ${bn} \\rvert}$. Rechne $\\lvert ${bn} \\rvert$ und das Skalarprodukt mit $${t}$ aus.`,
      explanation: {
        detailed: `$\\lvert ${bn} \\rvert = \\sqrt{${squares(b)}} = ${lb}$ und $${dotLine}$. Aus $\\frac{\\lvert ${an} \\cdot ${bn} \\rvert}{\\lvert ${bn} \\rvert} = ${L}$ folgt $\\left\\lvert ${lin} \\right\\rvert = ${L === 1 ? '' : `${L} \\cdot ${lb} = `}${R}$.`,
        short: `$\\left\\lvert ${lin} \\right\\rvert = ${L === 1 ? '' : `${L} \\cdot `}\\lvert ${bn} \\rvert = ${R}$.`,
      },
      established: [`\\lvert ${bn} \\rvert = ${lb}`, dotLine, `\\left\\lvert ${lin} \\right\\rvert = ${R}`],
      cards: [CARD.projektion],
    })
    const pair = (x: Rational, y: Rational) => {
      const [u, w] = num(x) < num(y) ? [x, y] : [y, x]
      return math(`${t}_1 = ${ratLatex(u)},\\; ${t}_2 = ${ratLatex(w)}`)
    }
    const sq = L * lb * lb
    const step2 = choiceStep(rng, {
      id: 'loesungen',
      title: 'Lösungen',
      question: `Welche Werte hat $${t}$?`,
      correct: pair(lo, hi),
      wrongs: [
        { content: math(`${t} = ${ratLatex(t2)}`), rule: 'vec-one-solution' },
        { content: pair(ratDiv(rat(-sq - K), rat(C)), ratDiv(rat(sq - K), rat(C))), rule: 'vec-shadow-squared' },
        { content: pair(ratDiv(rat(-R + K), rat(C)), ratDiv(rat(R + K), rat(C))), rule: 'vec-param-solve' },
      ],
      hint: `Ein Betrag gleich $${R}$ heißt: Der Inhalt ist $${R}$ oder $-${R}$. Löse beide Gleichungen.`,
      explanation: {
        detailed: `$${lin} = ${R}$ oder $${lin} = -${R}$. Daraus $${t} = ${quotient(rat(R - K), rat(C))}$ bzw. $${t} = ${quotient(rat(-R - K), rat(C))}$.`,
        short: `$${lin} = \\pm ${R}$: $${t}_1 = ${ratLatex(lo)}$, $${t}_2 = ${ratLatex(hi)}$.`,
      },
      established: [`${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`],
      cards: [CARD.projektion],
    })
    const steps = [step1, step2]
    if (steps.some((st) => st.choices.length < 3)) continue
    const a = aAt(hi)
    const s = split(a, b)
    const pd = drawableDim(dim) && !isParallel(a, b) && !isZero(s.d)
    return {
      kind: 'projParam',
      instruction: `Für welche $${t}$ ist der Schatten $${pn}$ von $${an}$ auf $${bn}$ genau $${L}$ lang?`,
      functionLatex: `${an} = ${aLatex},\\; ${bn} = ${vecLatex(b)}`,
      steps,
      cards: [CARD.projektion],
      resultLatex: `${t}_1 = ${ratLatex(lo)},\\; ${t}_2 = ${ratLatex(hi)}`,
      ...(pd && drawableDim(dim) ? { resultDrawing: projDrawing(dim, an, bn, s, `Mit $${t} = ${ratLatex(hi)}$ ist der Schatten $${L}$ lang; mit $${t} = ${ratLatex(lo)}$ ebenso, nur zeigt er in die andere Richtung.`, true) } : {}),
      form: `projParam|${dim}|len|${t}|${i}|${Math.sign(sc)}|${L}|${signShape(p, b)}|${lo.d > 1n || hi.d > 1n ? 'frac' : 'int'}`,
      data: { p: nums(p), b: nums(b), i: [i], s: [sc], L: [L] },
      answer: [num(lo), num(hi)],
    }
  }
}

// Vektor mit ganzzahliger Länge (kleine Einträge), mindestens zwei Einträge nicht 0
function pythagoreanVec(rng: Rng, dim: number): Vec {
  const pool = dim === 2 ? [[3, 4], [6, 8], [5, 12]] : [[1, 2, 2], [2, 3, 6], [2, 4, 4], [1, 4, 8], [4, 4, 7], [0, 3, 4], [0, 6, 8]]
  const row = rng.shuffle(rng.pick(pool)).map((x) => (rng.chance(0.4) ? -x : x))
  return vec(...row)
}

// ganzzahliger Vektor senkrecht zu allen gegebenen (Suche)
function perpendicularTo(rng: Rng, dim: number, others: readonly Vec[]): Vec | null {
  for (let i = 0; i < 2000; i++) {
    const v = ints(rng, dim, -3, 3)
    if (zeroCount(v) > 1) continue
    if (others.every((o) => isZero(vecDot(o, v)))) return v
  }
  return null
}

// Stufe 5: Schatten auf eine Ebene durch den Ursprung, aufgespannt von zwei senkrechten Vektoren, und der Abstand
function buildSpanProjection(rng: Rng): Built {
  const dim = rng.pick([3, 3, 4])
  const { vecs } = letters(rng)
  const [an, bn, cn] = vecs.map(vecName)
  for (;;) {
    const b = ints(rng, dim, -3, 3)
    if (zeroCount(b) > 1 || num(vecNorm2(b)) <= 1) continue
    const c = perpendicularTo(rng, dim, [b])
    if (!c) continue
    const a = ints(rng, dim, -4, 4)
    if (zeroCount(a) > 1) continue
    const sb = split(a, b)
    const sc = split(a, c)
    if (isZero(sb.d) || isZero(sc.d)) continue
    const aE = vecAdd(sb.par, sc.par)
    const rest = vecSub(a, aE)
    if (rest.every(isZero) || maxDen(aE) > 6n) continue
    const en = `${an}_E`
    const line = (v: Vec) => math(`${en} = ${vecLatex(v)}`)
    const aeLine = `${en} = k_{${vecs[1]}}\\,${bn} + k_{${vecs[2]}}\\,${cn} = ${timesVec(sb.k, b)}${plusVec(sc.k, c)} = ${vecLatex(aE)}`
    const steps: GuidedStep[] = [
      dotStep(rng, bn, cn, b, c),
      factorStep(rng, an, bn, sb, `k_{${vecs[1]}}`),
      factorStep(rng, an, cn, sc, `k_{${vecs[2]}}`, 'faktor-2'),
      choiceStep(rng, {
        id: 'ebene',
        title: 'Schatten auf der Ebene',
        question: `Wie lautet der Schatten $${en}$ von $${an}$ auf der Ebene?`,
        correct: line(aE),
        wrongs: [
          { content: line(sb.par), rule: 'vec-span-one-part' },
          { content: line(sc.par), rule: 'vec-span-one-part' },
          { content: line(vecAdd(vecScale(sc.k, b), vecScale(sb.k, c))), rule: 'vec-span-factors-swapped' },
        ],
        hint: `$${bn}$ und $${cn}$ stehen senkrecht aufeinander: Addiere die Schatten auf beide.`,
        explanation: { detailed: `Weil $${bn} \\cdot ${cn} = 0$ ist, darfst du einzeln projizieren und addieren: $${aeLine}$.`, short: `$${aeLine}$.` },
        established: [aeLine],
        cards: [CARD.zerlegung],
      }),
      distanceStep(rng, 'd', rest, `${an} - ${en}`, aE, a, `Wie weit ist die Spitze von $${an}$ von der Ebene entfernt?`),
    ]
    if (steps.some((st) => st.choices.length < 3)) continue
    const dist = vecLength(rest)
    let drawing: VectorDrawing | undefined
    if (dim === 3) {
      const [bv, cv, av, ev] = [nums(b), nums(c), nums(a), nums(aE)]
      const kb = num(sb.k)
      const kc = num(sc.k)
      const span = (x: number) => [Math.min(-0.4, x - 0.4), Math.max(1.3, x + 0.4)]
      const [b0, b1] = span(kb)
      const [c0, c1] = span(kc)
      const at = (x: number, y: number) => bv.map((v, i) => x * v + y * cv[i])
      drawing = {
        ...emptyDrawing(3, `Der Schatten $${en}$ liegt in der Ebene von $${bn}$ und $${cn}$; das Lot zur Spitze von $${an}$ ist $d = ${surdLatex(dist)}$ lang.`),
        polygons: [{ points: [at(b0, c0), at(b1, c0), at(b1, c1), at(b0, c1)], color: 'b' }],
        arrows: [
          { from: [0, 0, 0], to: av, color: 'a', label: an },
          { from: [0, 0, 0], to: bv, color: 'b', label: bn },
          { from: [0, 0, 0], to: cv, color: 'b', label: cn },
          { from: [0, 0, 0], to: ev, color: 'r', label: en, phase: 2 },
          { from: ev, to: av, color: 'c', phase: 3 },
        ],
        segments: [{ from: av, to: ev, color: 'muted', dashed: true, phase: 1 }],
        playLabel: 'Licht an',
      }
    }
    return {
      kind: 'spanProjection',
      instruction: `Die Ebene $E$ durch den Ursprung wird von $${bn}$ und $${cn}$ aufgespannt. Projiziere $${an}$ auf $E$ und bestimme den Abstand $d$ der Spitze von $${an}$ zu $E$.`,
      functionLatex: `${an} = ${vecLatex(a)},\\; ${bn} = ${vecLatex(b)},\\; ${cn} = ${vecLatex(c)}`,
      steps,
      cards: [CARD.projektion, CARD.zerlegung],
      resultLatex: `${en} = ${vecLatex(aE)},\\; d = ${surdLatex(dist)}`,
      ...(drawing ? { resultDrawing: drawing } : { note: NO_PICTURE }),
      form: `spanProjection|${dim}|${vecs[0]}|${signShape(a, b, c)}|${ratSign(sb.k)}${ratSign(sc.k)}|${denForm(aE)}`,
      data: { a: nums(a), b: nums(b), c: nums(c) },
      answer: [...nums(aE), surdValue(dist)],
    }
  }
}

export const PROJ_BUILDERS = {
  projection: buildProjection,
  decompose: buildDecompose,
  shadowLength: buildShadowLength,
  foot: buildFoot,
  projParam: buildProjParam,
  spanProjection: (rng: Rng) => buildSpanProjection(rng),
} satisfies Readonly<Record<string, (rng: Rng, level: Level) => Built>>
