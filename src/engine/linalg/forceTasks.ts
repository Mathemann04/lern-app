import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type DrawAngle, type DrawArrow, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, CARD, PARAMS, choiceStep, connectStep, ints, math, nums } from './taskKit.ts'
import { type Surd, type Vec, arrowName, columnLatex, pointLatex, ratLatex, sqrtRat, surdLatex, surdValue, vec, vecAdd, vecDot, vecLatex, vecNorm2, vecScale, vecSub } from './vec.ts'

// Baukasten für den Baustein „Kräfte" der Tätigkeit „Vektoren" (M7 Schritt 3b, docs/PLAN-M7.md): Kraft aus Betrag und
// Winkel zerlegen, Betrag und Winkel aus den Komponenten (mit Quadrant), Resultierende und Gleichgewicht, schiefe Ebene
// (auch als Zerlegung wie in Schritt 3a und mit waagrechter Haltekraft), Arbeit W = F · s, Drehmoment in der Ebene,
// Seilkräfte am Knoten. Schreibweise wie in der Technischen Mechanik (docs/MECHANIK.md): Winkel α gegen den
// Uhrzeigersinn ab der positiven x-Achse, F_x = F cos α, M_A = (x − x_A) F_y − (y − y_A) F_x, positiv gegen den
// Uhrzeigersinn. Alles exakt: besondere Winkel (30°, 45°, 60° und ihre Verwandten) und Zahlen als k·√r (vec.ts).

export const FORCE_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['forceComponents', 'forcePolar', 'incline', 'work'],
  2: ['forceComponents', 'forcePolar', 'resultant', 'work', 'torque'],
  3: ['resultant', 'incline', 'work', 'torque'],
  4: ['resultant', 'knot', 'work', 'torque', 'incline'],
  5: ['knot', 'torque', 'work', 'incline'],
}

// ------------------------------------------------------------------ Zahlen k·√r

const S = (coef: Rational, rad = 1n): Surd => (isZero(coef) ? { coef, rad: 1n } : { coef, rad })
const int = (n: number): Surd => S(rat(n))
const ratS = (r: Rational): Surd => S(r)
function sMul(a: Surd, b: Surd): Surd {
  const r = sqrtRat(rat(a.rad * b.rad))
  return S(ratMul(ratMul(a.coef, b.coef), r.coef), r.rad)
}
const sNeg = (a: Surd): Surd => S(ratNeg(a.coef), a.rad)
const sAbs = (a: Surd): Surd => S(ratAbs(a.coef), a.rad)
const sScale = (k: Rational, a: Surd): Surd => S(ratMul(k, a.coef), a.rad)
// Summe, wenn sie wieder k·√r ist (gleiche Wurzel oder ein Summand 0), sonst null
function sAdd(a: Surd, b: Surd): Surd | null {
  if (isZero(a.coef)) return b
  if (isZero(b.coef)) return a
  return a.rad === b.rad ? S(ratAdd(a.coef, b.coef), a.rad) : null
}
// Quadrat als Bruch
const sSq = (a: Surd): Rational => ratMul(ratMul(a.coef, a.coef), rat(a.rad))
const sl = surdLatex
const sv = surdValue
const sign = (a: Surd) => ratSign(a.coef)
// als Faktor in einer Rechnung: negative Zahlen und Brüche in Klammern
const sFactor = (a: Surd) => (sign(a) < 0 || a.coef.d > 1n ? `\\left(${sl(a)}\\right)` : sl(a))
const sSquare = (a: Surd) => (sign(a) >= 0 && a.coef.d === 1n && a.rad === 1n ? `${sl(a)}^2` : `\\left(${sl(a)}\\right)^2`)
const num = (r: Rational) => Number(r.n) / Number(r.d)
const deg = (x: number) => `${x}^\\circ`
const factor = (x: string) => (x.startsWith('-') ? `(${x})` : x)

// Einheiten (der freie Modus zeigt sie hinter dem Kästchen, vectorFree.ts)
const N = '\\,\\text{N}'
const NM = '\\,\\text{Nm}'
const J = '\\,\\text{J}'
const METER = '\\,\\text{m}'

// Vektor der Ebene mit Einträgen k·√r
type SV = readonly [Surd, Surd]
const svLatex = (v: SV) => columnLatex([sl(v[0]), sl(v[1])])
const svNums = (v: SV) => [sv(v[0]), sv(v[1])]
function svAdd(a: SV, b: SV): SV | null {
  const x = sAdd(a[0], b[0])
  const y = sAdd(a[1], b[1])
  return x && y ? [x, y] : null
}
const svNeg = (a: SV): SV => [sNeg(a[0]), sNeg(a[1])]
const fromVec = (v: Vec): SV => [ratS(v[0]), ratS(v[1])]

// ------------------------------------------------------------------ Winkel

// besondere Winkel: Kosinus und Sinus im ersten Quadranten
const TRIG: Readonly<Record<number, { readonly cos: Surd; readonly sin: Surd }>> = {
  30: { cos: S(rat(1, 2), 3n), sin: S(rat(1, 2)) },
  45: { cos: S(rat(1, 2), 2n), sin: S(rat(1, 2), 2n) },
  60: { cos: S(rat(1, 2)), sin: S(rat(1, 2), 3n) },
}
const TAN_LATEX: Readonly<Record<number, string>> = { 30: '\\frac{\\sqrt{3}}{3}', 45: '1', 60: '\\sqrt{3}' }
// verwechselter Tabellenwert
const TABLE_SWAP: Readonly<Record<number, number>> = { 30: 45, 45: 60, 60: 45 }
// Vorzeichen von x und y im Quadranten 1 bis 4
const QUAD: Readonly<Record<number, readonly [1 | -1, 1 | -1]>> = { 1: [1, 1], 2: [-1, 1], 3: [-1, -1], 4: [1, -1] }
const QUAD_WORDS = ['', 'rechts oben', 'links oben', 'links unten', 'rechts unten']
const fullAngle = (r: number, q: number) => [r, 180 - r, 180 + r, 360 - r][q - 1]
const signed = (s: Surd, sg: number) => (sg < 0 ? sNeg(s) : s)
// cos α bzw. sin α für α im Quadranten q mit Hilfswinkel r
const trigOf = (fn: 'cos' | 'sin', r: number, q: number) => signed(TRIG[r][fn], fn === 'cos' ? QUAD[q][0] : QUAD[q][1])

// Hilfswinkel und Quadrant einer Richtung, wenn sie besonders ist (tan² = 1/3, 1, 3), sonst null
function direction(v: SV): { readonly r: number; readonly q: number } | null {
  if (isZero(v[0].coef) || isZero(v[1].coef)) return null
  const ratio = ratDiv(sSq(v[1]), sSq(v[0]))
  const r = ratEq(ratio, rat(1)) ? 45 : ratEq(ratio, rat(3)) ? 60 : ratEq(ratio, rat(1, 3)) ? 30 : 0
  if (!r) return null
  const [sx, sy] = [sign(v[0]), sign(v[1])]
  return { r, q: sx > 0 ? (sy > 0 ? 1 : 4) : sy > 0 ? 2 : 3 }
}

// Betrag einer Kraft (nach dem Hilfswinkel gewählt, damit die Komponenten einfach bleiben); halves: auch ungerade
const MULTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25]
function pickMagnitude(rng: Rng, r: number, halves: boolean): Surd {
  const m = rng.pick(MULTS)
  if (r === 45) return rng.chance(0.6) ? S(rat(m), 2n) : int(2 * m)
  return halves && rng.chance(0.3) ? int(2 * m + 1) : int(2 * m)
}
// Art des Betrags für die Form: mit Wurzel, ungerade (halbe Komponenten), gerade; groß ab 20 (runde Zahlen)
const magKind = (F: Surd) => `${F.rad > 1n ? 'root' : F.coef.n % 2n === 1n ? 'odd' : 'even'}${F.coef.n >= 20n ? '+' : ''}`

// Namen einer Kraft: Betrag, Vektor, Komponenten, Winkel
type ForceName = { readonly s: string; readonly v: string; readonly x: string; readonly y: string; readonly a: string }
function forceName(sub: string): ForceName {
  return sub === ''
    ? { s: 'F', v: '\\vec F', x: 'F_x', y: 'F_y', a: '\\alpha' }
    : { s: `F_${sub}`, v: `\\vec F_${sub}`, x: `F_{${sub}x}`, y: `F_{${sub}y}`, a: `\\alpha_${sub}` }
}
// Namen ohne Index 1 oder 2 (der freie Modus liest „t_1 = …, t_2 = …" als zwei Lösungen)
const SINGLE_NAMES = ['', 'A', 'B', 'S'] as const

// ------------------------------------------------------------------ Bilder

const O = [0, 0]
// Winkel ab der positiven x-Achse (gegen den Uhrzeigersinn, auch über 180°)
const angleFromX = (to: readonly number[], label: string, color: DrawAngle['color'] = 'muted', phase?: number): DrawAngle => ({
  at: O,
  // Schenkel so lang wie der Pfeil: Der Bogen bekommt seine volle Größe (VectorFigure)
  u: [Math.hypot(...to), 0],
  v: to,
  color,
  label,
  ccw: true,
  ...(phase ? { phase } : {}),
})

function forcePicture(name: ForceName, F: SV, caption: string, angle: DrawAngle | undefined, comps: boolean): VectorDrawing {
  const [x, y] = svNums(F)
  const arrows: DrawArrow[] = [{ from: O, to: [x, y], color: 'a', label: name.v }]
  if (comps)
    arrows.push({ from: O, to: [x, 0], color: 'b', label: name.x, phase: 1 }, { from: [x, 0], to: [x, y], color: 'c', label: name.y, phase: 2 })
  return { ...emptyDrawing(2, caption), arrows, angles: angle ? [angle] : [] }
}

// ------------------------------------------------------------------ Schritte

// eine Komponente aus Betrag und Winkel; yMode: Winkel β zur positiven y-Achse gegeben (nur im 1. Quadranten)
function componentStep(rng: Rng, name: ForceName, F: Surd, r: number, q: number, axis: 'x' | 'y', yMode: boolean, drawing?: VectorDrawing): GuidedStep {
  const fn = axis === 'x' ? 'cos' : 'sin'
  const other = axis === 'x' ? 'sin' : 'cos'
  const sg = axis === 'x' ? QUAD[q][0] : QUAD[q][1]
  const value = sMul(F, trigOf(fn, r, q))
  const cname = axis === 'x' ? name.x : name.y
  const line = (s: Surd) => math(`${cname} = ${sl(s)}${N}`)
  const wrongs: Wrong[] = []
  if (q !== 1) wrongs.push({ content: line(sNeg(value)), rule: 'vec-force-sign' })
  if (r !== 45) wrongs.push({ content: line(sMul(F, signed(TRIG[r][other], sg))), rule: 'vec-force-sin-cos' })
  wrongs.push({ content: line(sMul(F, signed(TRIG[TABLE_SWAP[r]][fn], sg))), rule: 'vec-angle-table' })
  wrongs.push({ content: line(trigOf(fn, r, q)), rule: 'vec-force-no-magnitude' })
  // Winkel und Winkelfunktion so, wie sie in der Aufgabe stehen
  const angleName = yMode ? '\\beta' : name.a
  const given = yMode ? 90 - r : fullAngle(r, q)
  const fnGiven = yMode ? other : fn
  const formula = `${cname} = ${name.s} \\${fnGiven} ${angleName} = ${sl(F)} \\cdot \\${fnGiven} ${deg(given)} = ${sl(F)} \\cdot ${sFactor(trigOf(fn, r, q))} = ${sl(value)}${N}`
  const quadrant =
    q === 1 ? '' : ` $${deg(given)}$ liegt im ${q}. Quadranten (${QUAD_WORDS[q]}), dort ist $\\${fn}$ ${sg < 0 ? 'negativ' : 'positiv'}: $\\${fn} ${deg(given)} = ${sg < 0 ? '-' : ''}\\${fn} ${deg(r)}$.`
  const why = yMode
    ? ` Der Winkel $\\beta$ wird hier ab der $y$-Achse gemessen, darum gehört $\\${fnGiven}$ zu $${cname}$.`
    : ''
  return choiceStep(rng, {
    id: `komponente-${axis}`,
    title: axis === 'x' ? 'Komponente in x-Richtung' : 'Komponente in y-Richtung',
    question: `Wie groß ist $${cname}$?`,
    correct: line(value),
    wrongs,
    hint: yMode
      ? `Der Winkel liegt an der $y$-Achse an: $${name.y} = ${name.s}\\cos\\beta$, $${name.x} = ${name.s}\\sin\\beta$.`
      : `$${name.x} = ${name.s}\\cos${name.a}$, $${name.y} = ${name.s}\\sin${name.a}$. Das Vorzeichen zeigt der Quadrant.`,
    explanation: { detailed: `$${formula}$.${why}${quadrant}`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.kraft],
    ...(drawing ? { drawing } : {}),
  })
}

// Betrag aus zwei Komponenten (Pythagoras); extra: weitere falsche Antworten vorn
function magnitudeStep(rng: Rng, label: string, xName: string, yName: string, v: SV, drawing?: VectorDrawing, extra: readonly Wrong[] = []): GuidedStep {
  const n2 = ratAdd(sSq(v[0]), sSq(v[1]))
  const mag = sqrtRat(n2)
  const line = (x: string) => math(`${label} = ${x}${N}`)
  const absSum = sAdd(sAbs(v[0]), sAbs(v[1]))
  const wrongs: Wrong[] = [
    ...extra,
    { content: line(ratLatex(n2)), rule: 'vec-length-no-root' },
    { content: absSum ? line(sl(absSum)) : math(`${label} = \\left(${sl(sAbs(v[0]))} + ${sl(sAbs(v[1]))}\\right)${N}`), rule: 'vec-length-abs-sum' },
  ]
  const neg = ratSub(sSq(v[0]), sSq(v[1]))
  if (sign(v[0]) * sign(v[1]) < 0 && ratSign(neg) !== 0) wrongs.push({ content: line(sl(sqrtRat(ratAbs(neg)))), rule: 'vec-square-sign' })
  const direct = `\\sqrt{${ratLatex(n2)}}`
  const simple = sl(mag)
  const formula = `${label} = \\sqrt{${xName}^2 + ${yName}^2} = \\sqrt{${sSquare(v[0])} + ${sSquare(v[1])}} = ${direct === simple ? direct : `${direct} = ${simple}`}${N}`
  return choiceStep(rng, {
    id: 'betrag',
    title: 'Betrag',
    question: `Wie groß ist $${label}$?`,
    correct: line(simple),
    wrongs,
    hint: 'Pythagoras: beide Komponenten quadrieren, addieren, Wurzel ziehen.',
    explanation: { detailed: `$${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.kraft],
    ...(drawing ? { drawing } : {}),
  })
}

// Hilfswinkel α' aus tan α' = |F_y| / |F_x|; final: im 1. Quadranten ist das schon der Winkel
function refAngleStep(rng: Rng, n: { x: string; y: string; a: string }, v: SV, r: number, final: boolean): GuidedStep {
  const a = final ? n.a : `${n.a}'`
  const line = (x: number) => math(`${a} = ${deg(x)}`)
  const wrongs: Wrong[] = []
  if (r !== 45) wrongs.push({ content: line(90 - r), rule: 'vec-force-tan-inverted' })
  wrongs.push({ content: line(TABLE_SWAP[r]), rule: 'vec-angle-table' })
  if (r === 45) wrongs.push({ content: line(30), rule: 'vec-angle-table' })
  const tan = `\\tan ${a} = \\frac{\\lvert ${n.y} \\rvert}{\\lvert ${n.x} \\rvert} = \\frac{${sl(sAbs(v[1]))}}{${sl(sAbs(v[0]))}} = ${TAN_LATEX[r]}`
  return choiceStep(rng, {
    id: final ? 'winkel' : 'hilfswinkel',
    title: final ? 'Winkel' : 'Hilfswinkel',
    question: final ? `Wie groß ist der Winkel $${a}$ zur positiven $x$-Achse?` : `Wie groß ist der spitze Hilfswinkel $${a}$ zwischen dem Pfeil und der $x$-Achse?`,
    correct: line(r),
    wrongs,
    hint: `$\\tan ${a} = \\frac{\\lvert ${n.y} \\rvert}{\\lvert ${n.x} \\rvert}$ (Gegenkathete durch Ankathete), dann den Winkel aus der Tabelle der besonderen Werte ablesen.`,
    explanation: {
      detailed: `$${tan}$, also $${a} = ${deg(r)}$, denn $\\tan 30^\\circ = \\frac{\\sqrt{3}}{3}$, $\\tan 45^\\circ = 1$, $\\tan 60^\\circ = \\sqrt{3}$.`,
      short: `$${tan}$, $${a} = ${deg(r)}$.`,
    },
    established: [tan, `${a} = ${deg(r)}`],
    cards: [CARD.kraft],
  })
}

// Winkel im richtigen Quadranten aus dem Hilfswinkel
function quadrantStep(rng: Rng, n: { x: string; y: string; a: string }, r: number, q: number): GuidedStep {
  const alpha = fullAngle(r, q)
  const line = (x: number) => math(`${n.a} = ${deg(x)}`)
  const wrongs: Wrong[] = []
  if (q === 2) wrongs.push({ content: line(-r), rule: 'vec-force-arctan' })
  if (q === 3) wrongs.push({ content: line(r), rule: 'vec-force-arctan' })
  for (const qq of [1, 2, 3, 4]) if (qq !== q) wrongs.push({ content: line(fullAngle(r, qq)), rule: 'vec-force-quadrant' })
  const ap = `${n.a}'`
  const rule = [ap, `180^\\circ - ${ap}`, `180^\\circ + ${ap}`, `360^\\circ - ${ap}`][q - 1]
  const [sx, sy] = QUAD[q]
  const signs = `$${n.x} ${sx < 0 ? '<' : '>'} 0$ und $${n.y} ${sy < 0 ? '<' : '>'} 0$`
  const calc = ` Mit $\\arctan\\frac{${n.y}}{${n.x}}$ liefert der Taschenrechner nur Winkel zwischen $-90^\\circ$ und $90^\\circ$, hier also eine falsche Richtung.`
  return choiceStep(rng, {
    id: 'quadrant',
    title: 'Quadrant',
    question: `Wie groß ist der Winkel $${n.a}$, gegen den Uhrzeigersinn ab der positiven $x$-Achse gemessen (zwischen $0^\\circ$ und $360^\\circ$)?`,
    correct: line(alpha),
    wrongs,
    hint: `Die Vorzeichen von $${n.x}$ und $${n.y}$ verraten den Quadranten: rechts oben $${ap}$, links oben $180^\\circ - ${ap}$, links unten $180^\\circ + ${ap}$, rechts unten $360^\\circ - ${ap}$.`,
    explanation: {
      detailed: `${signs}: Der Pfeil zeigt nach ${QUAD_WORDS[q]}, in den ${q}. Quadranten. Also $${n.a} = ${rule} = ${deg(alpha)}$.${q === 2 || q === 3 ? calc : ''}`,
      short: `${q}. Quadrant: $${n.a} = ${rule} = ${deg(alpha)}$.`,
    },
    established: [`${n.a} = ${deg(alpha)}`],
    cards: [CARD.kraft],
  })
}

// Winkel einer besonderen Richtung: im 1. Quadranten direkt, sonst Hilfswinkel und Quadrant
const angleSteps = (rng: Rng, n: { x: string; y: string; a: string }, v: SV, r: number, q: number): GuidedStep[] =>
  q === 1 ? [refAngleStep(rng, n, v, r, true)] : [refAngleStep(rng, n, v, r, false), quadrantStep(rng, n, r, q)]

// ------------------------------------------------------------------ Kraft zerlegen

function buildComponents(rng: Rng, level: Level): Built {
  const name = forceName(rng.pick(SINGLE_NAMES))
  const r = rng.pick([30, 45, 60])
  const q = level === 1 ? 1 : rng.pick([1, 2, 2, 3, 3, 4, 4])
  const yMode = q === 1 && rng.chance(0.35)
  const F = pickMagnitude(rng, r, true)
  const comps: SV = [sMul(F, trigOf('cos', r, q)), sMul(F, trigOf('sin', r, q))]
  const alpha = fullAngle(r, q)
  const angle: DrawAngle = yMode ? { at: O, u: [0, sv(F)], v: svNums(comps), color: 'muted', label: deg(90 - r) } : angleFromX(svNums(comps), deg(alpha))
  const question = forcePicture(name, comps, `Die Kraft $${name.v}$ mit $${name.s} = ${sl(F)}${N}$ ${yMode ? `und dem Winkel $\\beta = ${deg(90 - r)}$ zur $y$-Achse` : `unter $${name.a} = ${deg(alpha)}$`}.`, angle, false)
  const steps = [componentStep(rng, name, F, r, q, 'x', yMode, question), componentStep(rng, name, F, r, q, 'y', yMode)]
  const given = yMode ? `${name.s} = ${sl(F)}${N},\\; \\beta = ${deg(90 - r)}` : `${name.s} = ${sl(F)}${N},\\; ${name.a} = ${deg(alpha)}`
  return {
    kind: 'forceComponents',
    instruction: yMode
      ? `Die Kraft $${name.v}$ schließt mit der positiven $y$-Achse den Winkel $\\beta$ ein und zeigt nach rechts oben. Zerlege sie in ihre Komponenten $${name.x}$ und $${name.y}$.`
      : `Zerlege die Kraft $${name.v}$ in ihre Komponenten $${name.x}$ und $${name.y}$. Der Winkel $${name.a}$ wird gegen den Uhrzeigersinn ab der positiven $x$-Achse gemessen.`,
    functionLatex: given,
    steps,
    cards: [CARD.kraft],
    resultLatex: `${name.x} = ${sl(comps[0])}${N},\\; ${name.y} = ${sl(comps[1])}${N}`,
    resultDrawing: forcePicture(name, comps, `$${name.v} = ${svLatex(comps)}${N}$: erst nach rechts bzw. links ($${name.x}$), dann nach oben bzw. unten ($${name.y}$).`, angle, true),
    form: `forceComponents|${r}|${q}|${yMode ? 'y' : 'x'}|${magKind(F)}|${name.s}`,
    data: { F: [sv(F)], angle: [yMode ? 90 - r : alpha], fromY: [yMode ? 1 : 0] },
    answer: svNums(comps),
  }
}

// ------------------------------------------------------------------ Betrag und Winkel

function buildPolar(rng: Rng, level: Level): Built {
  const name = forceName(rng.pick(SINGLE_NAMES))
  const r = rng.pick([30, 45, 60])
  const q = level === 1 ? 1 : rng.pick([1, 2, 2, 3, 3, 4, 4])
  const asVector = rng.chance(0.5)
  const F = pickMagnitude(rng, r, true)
  const comps: SV = [sMul(F, trigOf('cos', r, q)), sMul(F, trigOf('sin', r, q))]
  const alpha = fullAngle(r, q)
  const question = forcePicture(name, comps, `Die Kraft $${name.v} = ${svLatex(comps)}${N}$.`, undefined, true)
  const steps = [magnitudeStep(rng, name.s, name.x, name.y, comps, question), ...angleSteps(rng, name, comps, r, q)]
  return {
    kind: 'forcePolar',
    instruction: `Wie groß ist die Kraft $${name.v}$, und unter welchem Winkel $${name.a}$ (gegen den Uhrzeigersinn ab der positiven $x$-Achse, zwischen $0^\\circ$ und $360^\\circ$) wirkt sie?`,
    functionLatex: asVector ? `${name.v} = ${svLatex(comps)}${N}` : `${name.x} = ${sl(comps[0])}${N},\\; ${name.y} = ${sl(comps[1])}${N}`,
    steps,
    cards: [CARD.kraft],
    resultLatex: `${name.s} = ${sl(F)}${N},\\; ${name.a} = ${deg(alpha)}`,
    resultDrawing: forcePicture(name, comps, `$${name.s} = ${sl(F)}${N}$ unter $${name.a} = ${deg(alpha)}$ (${QUAD_WORDS[q]}).`, angleFromX(svNums(comps), deg(alpha), 'r'), true),
    form: `forcePolar|${r}|${q}|${asVector ? 'vec' : 'comp'}|${magKind(F)}|${name.s}`,
    data: { Fx: [sv(comps[0])], Fy: [sv(comps[1])] },
    answer: [sv(F), alpha],
  }
}

// ------------------------------------------------------------------ Resultierende und Gleichgewicht

type Given = { readonly name: ForceName; readonly comps: SV; readonly polar?: { readonly F: Surd; readonly r: number; readonly q: number; readonly angle: number } }

// Komponenten einer Kraft aus Betrag und Winkel, als Vektor (Stufe 3 und 4)
function polarVectorStep(rng: Rng, g: Given): GuidedStep {
  const p = g.polar!
  const line = (v: SV) => math(`${g.name.v} = ${svLatex(v)}${N}`)
  const at = (cos: Surd, sin: Surd): SV => [sMul(p.F, cos), sMul(p.F, sin)]
  const [sx, sy] = QUAD[p.q]
  const wrongs: Wrong[] = []
  if (p.q !== 1) wrongs.push({ content: line(at(TRIG[p.r].cos, TRIG[p.r].sin)), rule: 'vec-force-sign' })
  if (p.r !== 45) wrongs.push({ content: line(at(signed(TRIG[p.r].sin, sx), signed(TRIG[p.r].cos, sy))), rule: 'vec-force-sin-cos' })
  const t = TRIG[TABLE_SWAP[p.r]]
  wrongs.push({ content: line(at(signed(t.cos, sx), signed(t.sin, sy))), rule: 'vec-angle-table' })
  wrongs.push({ content: line([trigOf('cos', p.r, p.q), trigOf('sin', p.r, p.q)]), rule: 'vec-force-no-magnitude' })
  const formula = `${g.name.v} = ${sl(p.F)} \\begin{pmatrix} \\cos ${deg(p.angle)} \\\\ \\sin ${deg(p.angle)} \\end{pmatrix} = ${svLatex(g.comps)}${N}`
  return choiceStep(rng, {
    id: `komponenten-${g.name.s}`,
    title: `Komponenten von $${g.name.v}$`,
    question: `Wie lautet $${g.name.v}$ in Komponenten?`,
    correct: line(g.comps),
    wrongs,
    hint: `$${g.name.v} = ${g.name.s}\\begin{pmatrix} \\cos ${g.name.a} \\\\ \\sin ${g.name.a} \\end{pmatrix}$; das Vorzeichen zeigt der Quadrant.`,
    explanation: { detailed: `$${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.kraft],
  })
}

// Kraft entlang einer Achse: Komponenten ohne Rechnung
const axisComps = (F: number, angle: number): SV => (angle === 0 ? [int(F), int(0)] : angle === 90 ? [int(0), int(F)] : angle === 180 ? [int(-F), int(0)] : [int(0), int(-F)])

// Summe der Kräfte (mit falschen Antworten)
function sumStep(rng: Rng, forces: readonly Given[], total: SV, label: string): GuidedStep {
  const line = (v: SV) => math(`${label} = ${svLatex(v)}${N}`)
  const last = forces[forces.length - 1]
  const wrongs: Wrong[] = []
  const minus = svAdd(total, svNeg(svAdd(last.comps, last.comps)!))
  if (minus) wrongs.push({ content: line(minus), rule: 'vec-force-subtracted' })
  // Vorzeichen übersehen: ein negativer Eintrag als positiv gezählt
  for (const f of forces) {
    const j = f.comps.findIndex((c) => sign(c) < 0)
    if (j < 0) continue
    const slipped = sAdd(total[j], sScale(rat(-2), f.comps[j]))
    if (slipped) wrongs.push({ content: line(j === 0 ? [slipped, total[1]] : [total[0], slipped]), rule: 'vec-sign-slip' })
    break
  }
  // Kraft längs einer Achse auf die falsche Achse gelegt
  for (const f of forces) {
    if (!f.polar || ![0, 90, 180, 270].includes(f.polar.angle)) continue
    const swapped: SV = [f.comps[1], f.comps[0]]
    const rest = forces.filter((g) => g !== f).reduce<SV | null>((acc, g) => (acc ? svAdd(acc, g.comps) : null), [int(0), int(0)])
    const wrong = rest && svAdd(rest, swapped)
    if (wrong) wrongs.push({ content: line(wrong), rule: 'vec-force-sin-cos' })
  }
  const terms = forces.map((f) => f.name.v).join(' + ')
  const formula = `${label} = ${terms} = ${forces.map((f) => svLatex(f.comps)).join(' + ')} = ${svLatex(total)}${N}`
  const axis = forces.filter((f) => f.polar && [0, 90, 180, 270].includes(f.polar.angle))
  const axisNote = axis.map((f) => ` $${f.name.v}$ zeigt unter $${deg(f.polar!.angle)}$ genau längs einer Achse: $${f.name.v} = ${svLatex(f.comps)}${N}$.`).join('')
  return choiceStep(rng, {
    id: 'summe',
    title: 'Summe',
    question: `Wie lautet $${label}$?`,
    correct: line(total),
    wrongs,
    hint: 'Alle Kräfte addieren, Eintrag für Eintrag; die Richtung steckt in den Vorzeichen.',
    explanation: { detailed: `$${formula}$.${axisNote}`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.resultierende],
  })
}

// Kräfte in Komponenten (Stufe 2) oder aus Betrag und Winkel (Stufe 3 und 4); Summe mit besonderem Winkel
function pickForces(rng: Rng, polar: boolean): { readonly forces: Given[]; readonly total: SV; readonly key: string } | null {
  if (!polar) {
    const k = rng.int(2, 8)
    const q = rng.int(1, 4)
    const R = vec(QUAD[q][0] * k, QUAD[q][1] * k)
    const n = rng.pick([2, 2, 3])
    const fs: Vec[] = []
    for (let i = 0; i < n - 1; i++) fs.push(ints(rng, 2, -9, 9))
    const lastF = fs.reduce((acc, f) => vecSub(acc, f), R)
    fs.push(lastF)
    if (fs.some((f) => f.every(isZero) || f.some((x) => Math.abs(num(x)) > 12)) || fs.every((f) => f.every((x) => ratSign(x) >= 0))) return null
    const forces = fs.map((f, i) => ({ name: forceName(String(i + 1)), comps: fromVec(f) }))
    return { forces, total: fromVec(R), key: `c${n}|${fs.map((f) => f.filter((x) => ratSign(x) < 0).length).join('')}` }
  }
  // F_1 schräg, F_2 längs einer Achse; die Summe ist wieder eine besondere Richtung
  const r1 = rng.pick([30, 45, 60])
  const q1 = rng.int(1, 4)
  const m = rng.pick([1, 2, 3, 4, 5])
  const F1 = r1 === 45 ? S(rat(m), 2n) : int(2 * m)
  const c1: SV = [sMul(F1, trigOf('cos', r1, q1)), sMul(F1, trigOf('sin', r1, q1))]
  // die Achse der rationalen Komponente (bei 30° y, bei 60° x; bei 45° beide)
  const along: 'x' | 'y' = r1 === 30 ? 'y' : r1 === 60 ? 'x' : rng.pick(['x', 'y'])
  const j = along === 'x' ? 0 : 1
  const base = num(c1[j].coef)
  const shift = rng.pick(r1 === 45 ? [-2] : [-2, 2, -4]) * base
  const F2 = Math.abs(shift)
  const angle2 = along === 'x' ? (shift > 0 ? 0 : 180) : shift > 0 ? 90 : 270
  const c2 = axisComps(F2, angle2)
  const total = svAdd(c1, c2)
  if (!total || !direction(total)) return null
  const forces: Given[] = [
    { name: forceName('1'), comps: c1, polar: { F: F1, r: r1, q: q1, angle: fullAngle(r1, q1) } },
    { name: forceName('2'), comps: c2, polar: { F: int(F2), r: 0, q: 0, angle: angle2 } },
  ]
  return { forces, total, key: `p${r1}${q1}${along}${shift / base}` }
}

const givenLatex = (g: Given) => (g.polar ? `${g.name.s} = ${sl(g.polar.F)}${N},\\; ${g.name.a} = ${deg(g.polar.angle)}` : `${g.name.v} = ${svLatex(g.comps)}${N}`)

function forcesDrawing(forces: readonly Given[], caption: string, result?: { readonly v: SV; readonly label: string; readonly angle: number }, sumOf?: SV): VectorDrawing {
  const colors = ['a', 'b', 'c'] as const
  const arrows: DrawArrow[] = forces.map((f, i) => ({ from: O, to: svNums(f.comps), color: colors[i], label: f.name.v }))
  if (!result) return { ...emptyDrawing(2, caption), arrows }
  // Krafteck: die Kräfte hängen sich aneinander, dann erscheint die Resultierende bzw. die Gegenkraft
  let tip = [0, 0]
  const chain: DrawArrow[] = forces.map((f, i) => {
    const from = tip
    tip = tip.map((x, k) => x + svNums(f.comps)[k])
    return { from, to: tip, color: colors[i], ghost: true, phase: 1, slideFrom: O }
  })
  const res: DrawArrow[] = sumOf
    ? [
        // die Gegenkraft schließt das Krafteck und greift am Punkt an
        { from: tip, to: [0, 0], color: 'r', ghost: true, phase: 2 },
        { from: O, to: svNums(result.v), color: 'r', label: result.label, phase: 2 },
      ]
    : [{ from: O, to: svNums(result.v), color: 'r', label: result.label, phase: 2 }]
  return {
    ...emptyDrawing(2, caption),
    arrows: [...arrows, ...chain, ...res],
    angles: [angleFromX(svNums(result.v), deg(result.angle), 'r', 2)],
  }
}

function buildResultant(rng: Rng, level: Level): Built {
  const equilibrium = level === 4
  const polar = level >= 3 && !(equilibrium && rng.chance(0.35))
  for (;;) {
    const picked = pickForces(rng, polar)
    if (!picked) continue
    const { forces, total, key } = picked
    const target = equilibrium ? svNeg(total) : total
    const dir = direction(target)!
    const res = forceName(equilibrium ? String(forces.length + 1) : 'R')
    const steps: GuidedStep[] = []
    for (const f of forces) if (f.polar && f.polar.r) steps.push(polarVectorStep(rng, f))
    const sumLabel = equilibrium ? `${forces.map((f) => f.name.v).join(' + ')}` : res.v
    steps.push(sumStep(rng, forces, total, sumLabel))
    if (equilibrium) {
      const line = (v: SV) => math(`${res.v} = ${svLatex(v)}${N}`)
      const j = total.findIndex((c) => !isZero(c.coef))
      const wrongs: Wrong[] = [
        { content: line(total), rule: 'vec-force-equilibrium-sign' },
        { content: line(j === 0 ? [target[0], total[1]] : [total[0], target[1]]), rule: 'vec-sign-slip' },
      ]
      const formula = `${res.v} = -\\left(${sumLabel}\\right) = ${svLatex(target)}${N}`
      steps.push(
        choiceStep(rng, {
          id: 'gegenkraft',
          title: 'Gegenkraft',
          question: `Welche Kraft $${res.v}$ hält $${forces.map((f) => f.name.v).join('$ und $')}$ das Gleichgewicht?`,
          correct: line(target),
          wrongs,
          hint: `Im Gleichgewicht ist die Summe aller Kräfte $\\vec 0$: $${sumLabel} + ${res.v} = \\vec 0$.`,
          explanation: { detailed: `Aus $${sumLabel} + ${res.v} = \\vec 0$ folgt $${formula}$.`, short: `$${formula}$.` },
          established: [formula],
          cards: [CARD.resultierende],
        }),
      )
    }
    // Beträge addiert: nur, wenn die Summe der Beträge eine Zahl k·√r ist
    const mags = forces.map((f) => f.polar?.F ?? sqrtRat(ratAdd(sSq(f.comps[0]), sSq(f.comps[1]))))
    const magSum = mags.reduce<Surd | null>((acc, m) => (acc ? sAdd(acc, m) : null), int(0))
    const extra: Wrong[] = magSum ? [{ content: math(`${res.s} = ${sl(magSum)}${N}`), rule: 'vec-force-add-magnitudes' }] : []
    steps.push(magnitudeStep(rng, res.s, res.x, res.y, target, undefined, extra), ...angleSteps(rng, res, target, dir.r, dir.q))
    if (steps.some((s) => s.choices.length < 3)) continue
    const alpha = fullAngle(dir.r, dir.q)
    const mag = sqrtRat(ratAdd(sSq(target[0]), sSq(target[1])))
    const names = forces.map((f) => `$${f.name.v}$`).join(forces.length === 2 ? ' und ' : ', ')
    return {
      kind: 'resultant',
      instruction: equilibrium
        ? `An einem Punkt greifen ${names} an. Welche Kraft $${res.v}$ (Betrag und Winkel $${res.a}$ ab der positiven $x$-Achse, zwischen $0^\\circ$ und $360^\\circ$) hält ihnen das Gleichgewicht?`
        : `An einem Punkt greifen ${names} an. Bestimme Betrag und Winkel $${res.a}$ (ab der positiven $x$-Achse, zwischen $0^\\circ$ und $360^\\circ$) der Resultierenden $${res.v}$.`,
      functionLatex: forces.map(givenLatex).join(',\\; '),
      steps,
      cards: [CARD.resultierende, CARD.kraft],
      resultLatex: `${res.s} = ${sl(mag)}${N},\\; ${res.a} = ${deg(alpha)}`,
      resultDrawing: forcesDrawing(
        forces,
        equilibrium
          ? `Hängt man die Kräfte aneinander, führt $${res.v}$ zurück zum Anfang: Zusammen ergeben sie $\\vec 0$.`
          : `Die Kräfte aneinandergehängt: $${res.v}$ führt vom Anfang zur Spitze der letzten, $${res.s} = ${sl(mag)}${N}$ unter $${deg(alpha)}$.`,
        { v: target, label: res.v, angle: alpha },
        equilibrium ? total : undefined,
      ),
      form: `resultant|${equilibrium ? 'eq' : 'sum'}|${key}|${dir.r}|${dir.q}`,
      data: {
        ...Object.fromEntries(forces.map((f, i) => [f.polar ? `p${i + 1}` : `c${i + 1}`, f.polar ? [sv(f.polar.F), f.polar.angle] : svNums(f.comps)])),
        eq: [equilibrium ? 1 : 0],
      },
      answer: [sv(mag), alpha],
    }
  }
}

// ------------------------------------------------------------------ Schiefe Ebene

// ebene Dreiecke mit ganzen Seiten: waagrecht w, senkrecht h, schräg c
const SLOPES = [
  [4, 3, 5],
  [3, 4, 5],
  [12, 5, 13],
  [5, 12, 13],
  [15, 8, 17],
  [8, 15, 17],
] as const

// Bild der schiefen Ebene: Dreieck, Körper auf der Mitte der schrägen Seite, Kräfte am Körper
function inclineDrawing(w: number, h: number, dirSign: 1 | -1, G: number, caption: string, parts?: { readonly H?: readonly number[]; readonly Nn: readonly number[]; readonly hold?: readonly number[] }, angleLabel?: string): VectorDrawing {
  // Größe des Dreiecks passend zu den Kräften
  const scale = (1.6 * G) / Math.hypot(w, h)
  const W = w * scale
  const Hh = h * scale
  // steigt nach rechts (dirSign 1) oder nach links
  const foot = dirSign > 0 ? [0, 0] : [W, 0]
  const top = dirSign > 0 ? [W, Hh] : [0, Hh]
  const corner = dirSign > 0 ? [W, 0] : [0, 0]
  const P = [(foot[0] + top[0]) / 2, (foot[1] + top[1]) / 2]
  const at = (v: readonly number[]) => P.map((x, i) => x + v[i])
  const arrows: DrawArrow[] = [{ from: P, to: at([0, -G]), color: 'a', label: '\\vec F_G' }]
  const angles: DrawAngle[] = [{ at: foot, u: [dirSign * W, 0], v: [top[0] - foot[0], top[1] - foot[1]], color: 'muted', label: angleLabel ?? '\\alpha' }]
  if (parts?.hold) arrows.push({ from: at(parts.hold.map((x) => -x)), to: P, color: 'b', label: '\\vec F' })
  if (parts?.H) {
    arrows.push({ from: P, to: at(parts.H), color: 'r', label: '\\vec F_H', phase: 1 })
    angles.push({ at: P, u: parts.H, v: parts.Nn, color: 'r', phase: 2 })
  }
  if (parts) arrows.push({ from: P, to: at(parts.Nn), color: 'c', label: '\\vec F_N', phase: 2 })
  return {
    ...emptyDrawing(2, caption),
    scene: true,
    polygons: [{ points: [foot, corner, top], color: 'muted' }],
    arrows,
    points: [{ at: P }],
    angles,
  }
}

function buildIncline(rng: Rng, level: Level): Built {
  if (level === 3) return buildInclineVector(rng)
  if (level === 5 || (level === 4 && rng.chance(0.5))) return buildInclineHoldVector(rng)
  const hold = level === 4
  const r = rng.pick([30, 45, 60])
  const dirSign = rng.pick([1, -1] as const)
  const m = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20])
  const nFirst = !hold && rng.chance(0.4)
  const sin = TRIG[r].sin
  const cos = TRIG[r].cos
  // Gewichtskraft so, dass alles einfach bleibt
  const G = hold ? (r === 30 ? int(3 * m) : int(m)) : int(2 * m)
  const FH = sMul(G, sin)
  const FN0 = sMul(G, cos)
  const [w, h] = [num(cos.coef) * Math.sqrt(Number(cos.rad)), num(sin.coef) * Math.sqrt(Number(sin.rad))]
  const g = sv(G)
  const line = (n: string, s: Surd) => math(`${n} = ${sl(s)}${N}`)
  const given = `F_G = ${sl(G)}${N},\\; \\alpha = ${deg(r)}`
  // Richtung längs der Ebene nach unten und senkrecht in die Ebene
  const down = [-dirSign * w, -h]
  const into = [dirSign * h, -w]
  if (!hold) {
    const hStep = choiceStep(rng, {
      id: 'hangabtrieb',
      title: 'Hangabtriebskraft',
      question: 'Wie groß ist die Hangabtriebskraft $F_H$ (der Anteil von $\\vec F_G$ längs der Ebene)?',
      correct: line('F_H', FH),
      wrongs: [
        { content: line('F_H', FN0), rule: 'vec-incline-sin-cos' },
        { content: line('F_H', sMul(G, TRIG[TABLE_SWAP[r]].sin)), rule: 'vec-angle-table' },
        { content: line('F_H', G), rule: 'vec-force-whole' },
      ],
      hint: 'Der Neigungswinkel steht im Kräftedreieck zwischen $\\vec F_G$ und der Senkrechten zur Ebene; die Hangabtriebskraft liegt ihm gegenüber.',
      explanation: {
        detailed: `$F_H = F_G\\sin\\alpha = ${sl(G)} \\cdot \\sin ${deg(r)} = ${sl(G)} \\cdot ${sFactor(sin)} = ${sl(FH)}${N}$. Probe: Je flacher die Ebene, desto kleiner $\\sin\\alpha$ und damit $F_H$.`,
        short: `$F_H = F_G\\sin\\alpha = ${sl(FH)}${N}$.`,
      },
      established: [`F_H = F_G\\sin\\alpha = ${sl(FH)}${N}`],
      cards: [CARD.schiefeEbene],
    })
    const nStep = choiceStep(rng, {
      id: 'normalkraft',
      title: 'Normalkraft',
      question: 'Wie groß ist die Normalkraft $F_N$ (der Anteil von $\\vec F_G$ senkrecht zur Ebene)?',
      correct: line('F_N', FN0),
      wrongs: [
        { content: line('F_N', FH), rule: 'vec-incline-sin-cos' },
        { content: line('F_N', sMul(G, TRIG[TABLE_SWAP[r]].cos)), rule: 'vec-angle-table' },
        { content: line('F_N', G), rule: 'vec-force-whole' },
      ],
      hint: 'Der Neigungswinkel liegt im Kräftedreieck an der Normalkraft an.',
      explanation: {
        detailed: `$F_N = F_G\\cos\\alpha = ${sl(G)} \\cdot \\cos ${deg(r)} = ${sl(G)} \\cdot ${sFactor(cos)} = ${sl(FN0)}${N}$.`,
        short: `$F_N = F_G\\cos\\alpha = ${sl(FN0)}${N}$.`,
      },
      established: [`F_N = F_G\\cos\\alpha = ${sl(FN0)}${N}`],
      cards: [CARD.schiefeEbene],
    })
    const question = inclineDrawing(w, h, dirSign, g, `Ein Körper mit $F_G = ${sl(G)}${N}$ auf einer glatten Ebene mit $\\alpha = ${deg(r)}$.`, undefined, deg(r))
    const steps = nFirst ? [{ ...nStep, drawing: question }, hStep] : [{ ...hStep, drawing: question }, nStep]
    if (steps.some((s) => s.choices.length < 3)) return buildIncline(rng, level)
    return {
      kind: 'incline',
      instruction: `Ein Körper liegt auf einer schiefen Ebene mit dem Neigungswinkel $\\alpha$. Zerlege seine Gewichtskraft $\\vec F_G$ in die Hangabtriebskraft $F_H$ längs der Ebene und die Normalkraft $F_N$ senkrecht zur Ebene.`,
      functionLatex: given,
      steps,
      cards: [CARD.schiefeEbene],
      resultLatex: `F_H = ${sl(FH)}${N},\\; F_N = ${sl(FN0)}${N}`,
      resultDrawing: inclineDrawing(w, h, dirSign, g, `$\\vec F_G = \\vec F_H + \\vec F_N$: $F_H = ${sl(FH)}${N}$ längs der Ebene, $F_N = ${sl(FN0)}${N}$ senkrecht hinein.`, { H: down.map((x) => x * sv(FH)), Nn: into.map((x) => x * sv(FN0)) }, deg(r)),
      form: `incline|basic|${r}|${dirSign}|${nFirst ? 'n' : 'h'}|${m % 5 === 0 ? 'round' : 'plain'}`,
      data: { G: [g], alpha: [r] },
      answer: [sv(FH), sv(FN0)],
    }
  }
  // Stufe 4: waagrechte Haltekraft F, glatte Ebene
  const F = sMul(G, tanOf(r))
  const FN = sAdd(sMul(G, cos), sMul(F, sin))!
  const eq = (s: string) => math(s)
  const steps = [
    choiceStep(rng, {
      id: 'gleichgewicht',
      title: 'Gleichgewicht längs der Ebene',
      question: 'Welche Gleichung gilt längs der Ebene?',
      correct: eq('F\\cos\\alpha = F_G\\sin\\alpha'),
      wrongs: [
        { content: eq('F = F_G\\sin\\alpha'), rule: 'vec-incline-hold-along' },
        { content: eq('F\\sin\\alpha = F_G\\cos\\alpha'), rule: 'vec-incline-sin-cos' },
        { content: eq('F\\cos\\alpha = F_G'), rule: 'vec-force-whole' },
      ],
      hint: 'Längs der Ebene zählt von jeder Kraft nur ihr Anteil in diese Richtung. Die Normalkraft hat dort keinen Anteil.',
      explanation: {
        detailed: 'Die waagrechte Kraft $F$ hat längs der Ebene den Anteil $F\\cos\\alpha$ (hangaufwärts), die Gewichtskraft den Anteil $F_G\\sin\\alpha$ (hangabwärts). Die Normalkraft steht senkrecht und zählt hier nicht. Gleichgewicht: $F\\cos\\alpha = F_G\\sin\\alpha$.',
        short: '$F\\cos\\alpha = F_G\\sin\\alpha$.',
      },
      established: ['F\\cos\\alpha = F_G\\sin\\alpha'],
      cards: [CARD.schiefeEbene],
      drawing: inclineDrawing(w, h, dirSign, g, `Ein Körper mit $F_G = ${sl(G)}${N}$ auf einer glatten Ebene mit $\\alpha = ${deg(r)}$ wird von einer waagrechten Kraft $\\vec F$ gehalten.`, undefined, deg(r)),
    }),
    choiceStep(rng, {
      id: 'haltekraft',
      title: 'Haltekraft',
      question: 'Wie groß ist die waagrechte Haltekraft $F$?',
      correct: line('F', F),
      wrongs: [
        { content: line('F', FH), rule: 'vec-incline-hold-along' },
        { content: line('F', sMul(G, tanOf(90 - r))), rule: 'vec-incline-sin-cos' },
        { content: line('F', sMul(G, inverse(TRIG[r].cos))), rule: 'vec-force-whole' },
      ],
      hint: 'Teile beide Seiten durch $\\cos\\alpha$: $F = F_G\\tan\\alpha$.',
      explanation: {
        detailed: `$F = F_G\\,\\frac{\\sin\\alpha}{\\cos\\alpha} = F_G\\tan\\alpha = ${sl(G)} \\cdot ${TAN_LATEX[r]} = ${sl(F)}${N}$.`,
        short: `$F = F_G\\tan\\alpha = ${sl(F)}${N}$.`,
      },
      established: [`F = F_G\\tan\\alpha = ${sl(F)}${N}`],
      cards: [CARD.schiefeEbene],
    }),
    choiceStep(rng, {
      id: 'normalkraft',
      title: 'Normalkraft',
      question: 'Wie groß ist die Normalkraft $F_N$, mit der die Ebene den Körper stützt?',
      correct: line('F_N', FN),
      wrongs: [
        { content: line('F_N', FN0), rule: 'vec-incline-normal-only' },
        ...(() => {
          const minus = sAdd(sMul(G, cos), sNeg(sMul(F, sin)))
          return minus ? [{ content: line('F_N', minus), rule: 'vec-sign-slip' }] : []
        })(),
        ...(() => {
          const swapped = sAdd(sMul(G, sin), sMul(F, cos))
          return swapped ? [{ content: line('F_N', swapped), rule: 'vec-incline-sin-cos' }] : []
        })(),
        { content: line('F_N', G), rule: 'vec-force-whole' },
      ],
      hint: 'Senkrecht zur Ebene drücken zwei Kräfte: der Anteil der Gewichtskraft und der Anteil der waagrechten Kraft.',
      explanation: {
        detailed: `Senkrecht zur Ebene: $F_N = F_G\\cos\\alpha + F\\sin\\alpha = ${sl(G)} \\cdot ${sFactor(cos)} + ${sl(F)} \\cdot ${sFactor(sin)} = ${sl(FN)}${N}$.`,
        short: `$F_N = F_G\\cos\\alpha + F\\sin\\alpha = ${sl(FN)}${N}$.`,
      },
      established: [`F_N = F_G\\cos\\alpha + F\\sin\\alpha = ${sl(FN)}${N}`],
      cards: [CARD.schiefeEbene],
    }),
  ]
  const fv = sv(F)
  return {
    kind: 'incline',
    instruction: `Ein Körper liegt auf einer glatten schiefen Ebene mit dem Neigungswinkel $\\alpha$. Eine waagrechte Kraft $\\vec F$ hält ihn fest. Wie groß sind $F$ und die Normalkraft $F_N$?`,
    functionLatex: given,
    steps,
    cards: [CARD.schiefeEbene],
    resultLatex: `F = ${sl(F)}${N},\\; F_N = ${sl(FN)}${N}`,
    resultDrawing: inclineDrawing(
      w,
      h,
      dirSign,
      g,
      `Gleichgewicht: $\\vec F_G$, die waagrechte Kraft $\\vec F$ ($F = ${sl(F)}${N}$) und die Normalkraft $\\vec F_N$ ($F_N = ${sl(FN)}${N}$) ergeben zusammen $\\vec 0$.`,
      { Nn: [-dirSign * h * sv(FN), w * sv(FN)], hold: [dirSign * fv, 0] },
      deg(r),
    ),
    form: `incline|hold|${r}|${dirSign}|${m % 5 === 0 ? 'round' : 'plain'}`,
    data: { G: [g], alpha: [r], hold: [1] },
    answer: [fv, sv(FN)],
  }
}

// tan eines besonderen Winkels als k·√r
const tanOf = (r: number): Surd => (r === 30 ? S(rat(1, 3), 3n) : r === 45 ? int(1) : S(rat(1), 3n))

// Stufe 3: schiefe Ebene als Zerlegung (wie in Schritt 3a): F_G auf die Richtung der Ebene projizieren
function buildInclineVector(rng: Rng): Built {
  for (;;) {
    const [w, h, c] = rng.pick(SLOPES)
    const dirSign = rng.pick([1, -1] as const)
    const j = rng.int(2, 8)
    const G = c * j
    const d = vec(dirSign * w, h)
    const g = vec(0, -G)
    const k = ratDiv(vecDot(g, d), vecNorm2(d))
    if (k.d > 5n) continue
    const H = vecScale(k, d)
    const Nv = vecSub(g, H)
    const [FH, FN] = [h * j, w * j]
    const kLine = (x: Rational) => math(`k = ${ratLatex(x)}`)
    const vLine = (n: string, v: Vec) => math(`${n} = ${vecLatex(v)}${N}`)
    const dotLine = `\\vec F_G \\cdot \\vec d = 0 \\cdot ${factor(String(dirSign * w))} + (${-G}) \\cdot ${h} = ${ratLatex(vecDot(g, d))}`
    const kFormula = `k = \\frac{\\vec F_G \\cdot \\vec d}{\\lvert \\vec d \\rvert^2} = \\frac{${ratLatex(vecDot(g, d))}}{${c * c}} = ${ratLatex(k)}`
    const pair = (a: string, b: string) => math(`F_H = ${a}${N},\\; F_N = ${b}${N}`)
    const steps = [
      choiceStep(rng, {
        id: 'faktor',
        title: 'Faktor',
        question: 'Die Hangabtriebskraft ist der Schatten von $\\vec F_G$ auf die Richtung $\\vec d$ der Ebene: $\\vec F_H = k\\,\\vec d$. Wie groß ist $k$?',
        correct: kLine(k),
        wrongs: [
          { content: kLine(ratDiv(vecDot(g, d), rat(c))), rule: 'vec-proj-not-squared' },
          { content: kLine(ratDiv(vecNorm2(d), vecDot(g, d))), rule: 'vec-proj-inverted' },
          { content: kLine(ratNeg(k)), rule: 'vec-dot-sign' },
        ],
        hint: 'Skalarprodukt $\\vec F_G \\cdot \\vec d$ durch $\\lvert \\vec d \\rvert^2$ (ohne Wurzel).',
        explanation: { detailed: `$${dotLine}$ und $\\lvert \\vec d \\rvert^2 = ${w * w} + ${h * h} = ${c * c}$, also $${kFormula}$.`, short: `$${kFormula}$.` },
        established: [dotLine, kFormula],
        cards: [CARD.schiefeEbene, CARD.projektion],
        drawing: inclineDrawing(w, h, dirSign, G, `Die Ebene steigt auf $${w}\\,\\text{m}$ um $${h}\\,\\text{m}$; Richtung $\\vec d = ${vecLatex(d)}$, Gewichtskraft $F_G = ${G}${N}$.`),
      }),
      choiceStep(rng, {
        id: 'hangabtrieb',
        title: 'Hangabtriebskraft',
        question: 'Wie lautet $\\vec F_H$?',
        correct: vLine('\\vec F_H', H),
        wrongs: [
          { content: vLine('\\vec F_H', vecScale(k, g)), rule: 'vec-proj-times-a' },
          { content: vLine('\\vec F_H', vecScale(ratNeg(k), d)), rule: 'vec-dot-sign' },
          { content: vLine('\\vec F_H', vecScale(ratDiv(vecDot(g, d), rat(c)), d)), rule: 'vec-proj-not-squared' },
        ],
        hint: '$\\vec F_H = k\\,\\vec d$, Eintrag für Eintrag.',
        explanation: { detailed: `$\\vec F_H = k\\,\\vec d = ${ratLatex(k)} \\cdot ${vecLatex(d)} = ${vecLatex(H)}${N}$. Er zeigt hangabwärts.`, short: `$\\vec F_H = ${vecLatex(H)}${N}$.` },
        established: [`\\vec F_H = ${vecLatex(H)}${N}`],
        cards: [CARD.schiefeEbene],
      }),
      choiceStep(rng, {
        id: 'normalkraft',
        title: 'Normalkraft',
        question: 'Wie lautet der Teil $\\vec F_N$ senkrecht zur Ebene?',
        correct: vLine('\\vec F_N', Nv),
        wrongs: [
          { content: vLine('\\vec F_N', vecSub(H, g)), rule: 'vec-rest-reversed' },
          { content: vLine('\\vec F_N', vecAdd(g, H)), rule: 'vec-rest-added' },
        ],
        hint: '$\\vec F_G = \\vec F_H + \\vec F_N$, also $\\vec F_N = \\vec F_G - \\vec F_H$.',
        explanation: {
          detailed: `$\\vec F_N = \\vec F_G - \\vec F_H = ${vecLatex(g)} - ${vecLatex(H)} = ${vecLatex(Nv)}${N}$. Probe: $\\vec F_N \\cdot \\vec d = 0$.`,
          short: `$\\vec F_N = ${vecLatex(Nv)}${N}$.`,
        },
        established: [`\\vec F_N = ${vecLatex(Nv)}${N}`],
        cards: [CARD.schiefeEbene, CARD.zerlegung],
      }),
      choiceStep(rng, {
        id: 'betraege',
        title: 'Beträge',
        question: 'Wie groß sind $F_H$ und $F_N$?',
        correct: pair(String(FH), String(FN)),
        wrongs: [
          { content: pair(String(FN), String(FH)), rule: 'vec-incline-sin-cos' },
          { content: pair(ratLatex(vecNorm2(H)), ratLatex(vecNorm2(Nv))), rule: 'vec-length-no-root' },
          { content: pair(String(G), String(G)), rule: 'vec-force-whole' },
        ],
        hint: 'Länge jedes Vektors mit Pythagoras.',
        explanation: {
          detailed: `$F_H = \\sqrt{${ratLatex(vecNorm2(H))}} = ${FH}${N}$ und $F_N = \\sqrt{${ratLatex(vecNorm2(Nv))}} = ${FN}${N}$. Probe: $\\sin\\alpha = \\frac{${h}}{${c}}$, $F_G\\sin\\alpha = ${FH}$.`,
          short: `$F_H = ${FH}${N}$, $F_N = ${FN}${N}$.`,
        },
        established: [`F_H = ${FH}${N}`, `F_N = ${FN}${N}`],
        cards: [CARD.schiefeEbene],
      }),
    ]
    if (steps.some((s) => s.choices.length < 3)) continue
    return {
      kind: 'incline',
      instruction: `Eine glatte schiefe Ebene steigt auf $${w}\\,\\text{m}$ waagrecht um $${h}\\,\\text{m}$ an (${dirSign > 0 ? 'nach rechts' : 'nach links'}). Zerlege die Gewichtskraft $\\vec F_G$ eines Körpers auf ihr in $\\vec F_H$ längs und $\\vec F_N$ senkrecht zur Ebene.`,
      functionLatex: `\\vec F_G = ${vecLatex(g)}${N},\\; \\vec d = ${vecLatex(d)}`,
      steps,
      cards: [CARD.schiefeEbene, CARD.projektion],
      resultLatex: `F_H = ${FH}${N},\\; F_N = ${FN}${N}`,
      resultDrawing: inclineDrawing(w, h, dirSign, G, `$\\vec F_G = \\vec F_H + \\vec F_N$ mit $F_H = ${FH}${N}$ und $F_N = ${FN}${N}$.`, { H: nums(H), Nn: nums(Nv) }),
      form: `incline|vec|${w}${h}|${dirSign}|${j}`,
      data: { G: [G], d: nums(d) },
      answer: [FH, FN],
    }
  }
}

// Stufe 5: Ebene aus einem Dreieck, waagrechte Haltekraft, Gleichgewicht als Vektorgleichung (Normalenrichtung selbst finden)
function buildInclineHoldVector(rng: Rng): Built {
  for (;;) {
    const [w, h, c] = rng.pick(SLOPES)
    const dirSign = rng.pick([1, -1] as const)
    const j = rng.int(1, 6)
    const G = w * j
    const Nmag = c * j
    const Fmag = h * j
    // Richtung der Ebene (aufwärts) und Normale vom Hang weg
    const d = vec(dirSign * w, h)
    const n = vec(rat(-dirSign * h, c), rat(w, c))
    const vLine = (v: Vec) => math(`\\vec n = ${vecLatex(v)}`)
    const line = (name: string, x: Rational) => math(`${name} = ${ratLatex(x)}${N}`)
    const steps = [
      choiceStep(rng, {
        id: 'normale',
        title: 'Richtung der Normalkraft',
        question: 'Die Normalkraft steht senkrecht auf der Ebene und zeigt vom Hang weg. Wie lautet ihr Einheitsvektor $\\vec n$?',
        correct: vLine(n),
        wrongs: [
          { content: vLine(vecScale(rat(-1), n)), rule: 'vec-incline-normal-dir' },
          { content: vLine(vecScale(rat(1, c), d)), rule: 'vec-incline-normal-dir' },
          { content: vLine(vecScale(rat(c), n)), rule: 'vec-knot-not-normalized' },
        ],
        hint: `Senkrecht auf $\\vec d = ${vecLatex(d)}$ steht $${vecLatex(vec(-dirSign * h, w))}$ (Einträge tauschen, ein Vorzeichen ändern); dann durch die Länge $${c}$ teilen.`,
        explanation: {
          detailed: `$${vecLatex(vec(-dirSign * h, w))} \\cdot ${vecLatex(d)} = 0$, und die $y$-Komponente ist positiv, also zeigt der Pfeil vom Hang weg. Länge $\\sqrt{${h * h} + ${w * w}} = ${c}$, also $\\vec n = ${vecLatex(n)}$.`,
          short: `$\\vec n = ${vecLatex(n)}$.`,
        },
        established: [`\\vec n = ${vecLatex(n)}`],
        cards: [CARD.schiefeEbene, CARD.resultierende],
        drawing: inclineDrawing(w, h, dirSign, G, `Die Ebene steigt auf $${w}\\,\\text{m}$ um $${h}\\,\\text{m}$; $F_G = ${G}${N}$, dazu eine waagrechte Haltekraft $\\vec F$.`),
      }),
      choiceStep(rng, {
        id: 'normalkraft',
        title: 'Gleichgewicht in y-Richtung',
        question: 'Nur $\\vec F_N = F_N\\,\\vec n$ und $\\vec F_G$ haben eine $y$-Komponente. Wie groß ist $F_N$?',
        correct: line('F_N', rat(Nmag)),
        wrongs: [
          { content: line('F_N', rat(G * w, c)), rule: 'vec-force-solve' },
          { content: line('F_N', rat(G * c, h)), rule: 'vec-knot-wrong-component' },
          { content: line('F_N', rat(G)), rule: 'vec-force-whole' },
        ],
        hint: '$y$-Richtung: $F_N \\cdot n_y - F_G = 0$, dann durch $n_y$ teilen.',
        explanation: {
          detailed: `$F_N \\cdot \\frac{${w}}{${c}} - ${G} = 0$, also $F_N = ${G} \\cdot \\frac{${c}}{${w}} = ${Nmag}${N}$.`,
          short: `$F_N = \\frac{F_G}{n_y} = ${Nmag}${N}$.`,
        },
        established: [`F_N \\cdot \\frac{${w}}{${c}} = ${G}`, `F_N = ${Nmag}${N}`],
        cards: [CARD.schiefeEbene, CARD.resultierende],
      }),
      choiceStep(rng, {
        id: 'haltekraft',
        title: 'Gleichgewicht in x-Richtung',
        question: 'Wie groß ist die waagrechte Haltekraft $F$?',
        correct: line('F', rat(Fmag)),
        wrongs: [
          { content: line('F', rat(G * h, c)), rule: 'vec-incline-hold-along' },
          { content: line('F', rat(Nmag * w, c)), rule: 'vec-knot-wrong-component' },
          { content: line('F', rat(Nmag)), rule: 'vec-force-whole' },
        ],
        hint: '$x$-Richtung: Die Haltekraft hebt den waagrechten Anteil der Normalkraft auf.',
        explanation: {
          detailed: `$F = F_N \\cdot \\lvert n_x \\rvert = ${Nmag} \\cdot \\frac{${h}}{${c}} = ${Fmag}${N}$; sie zeigt ${dirSign > 0 ? 'nach rechts' : 'nach links'}, gegen den Hang.`,
          short: `$F = F_N \\lvert n_x \\rvert = ${Fmag}${N}$.`,
        },
        established: [`F = ${Fmag}${N}`],
        cards: [CARD.schiefeEbene],
      }),
    ]
    if (steps.some((s) => s.choices.length < 3)) continue
    return {
      kind: 'incline',
      instruction: `Eine glatte schiefe Ebene steigt auf $${w}\\,\\text{m}$ waagrecht um $${h}\\,\\text{m}$ an (${dirSign > 0 ? 'nach rechts' : 'nach links'}). Ein Körper mit der Gewichtskraft $F_G$ wird von einer waagrechten Kraft $\\vec F$ gehalten. Stelle das Gleichgewicht $\\vec F_G + \\vec F + \\vec F_N = \\vec 0$ auf und bestimme $F$ und $F_N$.`,
      functionLatex: `F_G = ${G}${N},\\; \\vec d = ${vecLatex(d)}`,
      steps,
      cards: [CARD.schiefeEbene, CARD.resultierende],
      resultLatex: `F = ${Fmag}${N},\\; F_N = ${Nmag}${N}`,
      resultDrawing: inclineDrawing(w, h, dirSign, G, `Gleichgewicht: $\\vec F_G$, $\\vec F$ mit $F = ${Fmag}${N}$ und $\\vec F_N$ mit $F_N = ${Nmag}${N}$ ergeben zusammen $\\vec 0$.`, { Nn: nums(vecScale(rat(Nmag), n)), hold: [dirSign * Fmag, 0] }),
      form: `incline|holdVec|${w}${h}|${dirSign}|${j}`,
      data: { G: [G], d: nums(d), hold: [1] },
      answer: [Fmag, Nmag],
    }
  }
}

// ------------------------------------------------------------------ Arbeit

const WORK_NAMES = [
  { F: '\\vec F', s: '\\vec s' },
  { F: '\\vec F_1', s: '\\vec s' },
  { F: '\\vec F', s: '\\vec d' },
] as const

// W = F · s mit Zahlen
function workStep(rng: Rng, Fn: string, sn: string, F: Vec, s: Vec, drawing?: VectorDrawing): GuidedStep {
  const W = vecDot(F, s)
  const line = (x: string) => math(`W = ${x}${J}`)
  const dim = F.length
  const cross = F.reduce((acc, x, i) => ratAdd(acc, ratMul(x, s[(i + 1) % dim])), rat(0))
  const flip = F.findIndex((x, i) => ratSign(ratMul(x, s[i])) !== 0)
  const signWrong = flip < 0 ? W : ratSub(W, ratMul(rat(2), ratMul(F[flip], s[flip])))
  const noCos = sMul(sqrtRat(vecNorm2(F)), sqrtRat(vecNorm2(s)))
  const wrongs: Wrong[] = [
    { content: math(`W = ${vecLatex(F.map((x, i) => ratMul(x, s[i])))}`), rule: 'vec-dot-vector' },
    { content: line(sl(noCos)), rule: 'vec-work-no-cos' },
    { content: line(ratLatex(cross)), rule: 'vec-dot-cross' },
    { content: line(ratLatex(signWrong)), rule: 'vec-dot-sign' },
  ]
  const terms = F.map((x, i) => `${factor(ratLatex(x))} \\cdot ${factor(ratLatex(s[i]))}`).join(' + ')
  const formula = `W = ${Fn} \\cdot ${sn} = ${terms} = ${ratLatex(W)}${J}`
  return choiceStep(rng, {
    id: 'arbeit',
    title: 'Arbeit',
    question: `Wie groß ist die Arbeit $W = ${Fn} \\cdot ${sn}$?`,
    correct: line(ratLatex(W)),
    wrongs: rng.chance(0.5) ? wrongs : [wrongs[1], wrongs[0], wrongs[3], wrongs[2]],
    hint: 'Skalarprodukt: Einträge an gleicher Stelle malnehmen und alles addieren. Das Ergebnis ist eine Zahl.',
    explanation: { detailed: `$${formula}$ (Newton mal Meter ergibt Joule).`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.arbeit],
    ...(drawing ? { drawing } : {}),
  })
}

const SENSE = ['Die Kraft hilft bei der Bewegung ($W > 0$).', 'Die Kraft bremst die Bewegung ($W < 0$).', 'Die Kraft verrichtet keine Arbeit ($W = 0$).']
function workSenseStep(rng: Rng, W: Rational): GuidedStep {
  const idx = ratSign(W) > 0 ? 0 : ratSign(W) < 0 ? 1 : 2
  return choiceStep(rng, {
    id: 'deutung',
    title: 'Deutung',
    question: 'Was bedeutet das Vorzeichen der Arbeit?',
    correct: SENSE[idx],
    wrongs: SENSE.flatMap((t, i) => (i === idx ? [] : [{ content: t, rule: 'vec-work-sign' }])),
    hint: 'Positiv: Kraft und Weg zeigen eher in dieselbe Richtung (spitzer Winkel).',
    explanation: {
      detailed: idx === 0 ? 'Die Arbeit ist positiv: Der Winkel zwischen Kraft und Weg ist spitz, die Kraft schiebt mit.' : idx === 1 ? 'Die Arbeit ist negativ: Der Winkel ist stumpf, die Kraft wirkt gegen die Bewegung.' : 'Die Arbeit ist $0$: Kraft und Weg stehen senkrecht aufeinander.',
      short: SENSE[idx],
    },
    cards: [CARD.arbeit],
  })
}

function workDrawing(dim: 2 | 3, F: Vec, s: Vec, Fn: string, sn: string, caption: string, from?: Vec): VectorDrawing {
  const start = from ? nums(from) : Array.from({ length: dim }, () => 0)
  const at = (v: Vec) => start.map((x, i) => x + num(v[i]))
  return {
    ...emptyDrawing(dim, caption),
    arrows: [
      { from: start, to: at(s), color: 'b', label: sn },
      { from: start, to: at(F), color: 'a', label: Fn },
    ],
    angles: [{ at: start, u: nums(s), v: nums(F), color: 'muted' }],
    ...(from ? { points: [{ at: start, label: 'A' }, { at: at(s), label: 'B' }] } : {}),
  }
}

// Arbeit mit Beträgen und Winkel: Hilfswerte
const COS_SPECIAL: Readonly<Record<number, Surd>> = {
  30: TRIG[30].cos,
  45: TRIG[45].cos,
  60: TRIG[60].cos,
  120: sNeg(TRIG[60].cos),
  135: sNeg(TRIG[45].cos),
  150: sNeg(TRIG[30].cos),
}
const SIN_SPECIAL: Readonly<Record<number, Surd>> = { 30: TRIG[30].sin, 45: TRIG[45].sin, 60: TRIG[60].sin, 120: TRIG[60].sin, 135: TRIG[45].sin, 150: TRIG[30].sin }
const ANGLE_TABLE: Readonly<Record<number, number>> = { 30: 45, 45: 60, 60: 45, 120: 135, 135: 120, 150: 135 }

function buildWork(rng: Rng, level: Level): Built {
  const names = rng.pick(WORK_NAMES)
  if (level === 1 || level === 2) {
    const dim = level === 1 ? 2 : 3
    for (;;) {
      const F = ints(rng, dim, -6, 6)
      const s = ints(rng, dim, -6, 6)
      if (F.filter(isZero).length > dim - 2 || s.filter(isZero).length > dim - 2) continue
      const W = vecDot(F, s)
      // selten null
      if (isZero(W) && !rng.chance(0.25)) continue
      const pic = workDrawing(dim as 2 | 3, F, s, names.F, names.s, `Die Kraft $${names.F}$ wirkt, während sich der Körper um $${names.s}$ bewegt.`)
      const steps = [workStep(rng, names.F, names.s, F, s, pic), workSenseStep(rng, W)]
      if (steps.some((st) => st.choices.length < 3)) continue
      return {
        kind: 'work',
        instruction: `Ein Körper wird um $${names.s}$ verschoben (in Metern), während die Kraft $${names.F}$ (in Newton) auf ihn wirkt. Wie groß ist die Arbeit $W$?`,
        functionLatex: `${names.F} = ${vecLatex(F)}${N},\\; ${names.s} = ${vecLatex(s)}${METER}`,
        steps,
        cards: [CARD.arbeit],
        resultLatex: `W = ${ratLatex(W)}${J}`,
        resultDrawing: workDrawing(dim as 2 | 3, F, s, names.F, names.s, `$W = ${ratLatex(W)}${J}$: ${SENSE[ratSign(W) > 0 ? 0 : ratSign(W) < 0 ? 1 : 2].replace(/ \(.*\)\./, '.')}`),
        form: `work|plain|${dim}|${names.F}${names.s}|${ratSign(W)}|${F.filter((x) => ratSign(x) < 0).length}${s.filter((x) => ratSign(x) < 0).length}`,
        data: { F: nums(F), s: nums(s) },
        answer: [num(W)],
      }
    }
  }
  if (level === 3) return rng.chance(0.5) ? buildWorkPoints(rng, names) : buildWorkPolar(rng, names)
  if (level === 4) return buildWorkBack(rng)
  return buildWorkParam(rng)
}

// Stufe 3: Weg von A nach B
function buildWorkPoints(rng: Rng, names: { readonly F: string; readonly s: string }): Built {
  const dim = rng.pick([2, 3])
  for (;;) {
    const A = ints(rng, dim, -4, 4)
    const s = ints(rng, dim, -5, 5)
    const F = ints(rng, dim, -6, 6)
    if (s.filter(isZero).length > dim - 2 || F.filter(isZero).length > dim - 2) continue
    const B = vecAdd(A, s)
    const W = vecDot(F, s)
    if (isZero(W)) continue
    const sn = arrowName('A', 'B')
    const pic = workDrawing(dim as 2 | 3, F, s, names.F, sn, `Der Körper wird von $A$ nach $B$ verschoben; dabei wirkt $${names.F}$.`, A)
    const steps = [connectStep(rng, 'A', 'B', A, B, pic), workStep(rng, names.F, sn, F, s), workSenseStep(rng, W)]
    if (steps.some((st) => st.choices.length < 3)) continue
    return {
      kind: 'work',
      instruction: `Ein Körper wird von $A$ nach $B$ verschoben (Koordinaten in Metern). Dabei wirkt die konstante Kraft $${names.F}$ (in Newton). Wie groß ist die Arbeit $W$?`,
      functionLatex: `${pointLatex('A', A)},\\; ${pointLatex('B', B)},\\; ${names.F} = ${vecLatex(F)}${N}`,
      steps,
      cards: [CARD.arbeit, CARD.verbindung],
      resultLatex: `W = ${ratLatex(W)}${J}`,
      resultDrawing: workDrawing(dim as 2 | 3, F, s, names.F, sn, `$W = ${names.F} \\cdot ${sn} = ${ratLatex(W)}${J}$.`, A),
      form: `work|points|${dim}|${names.F}|${ratSign(W)}|${A.filter((x) => ratSign(x) < 0).length}`,
      data: { F: nums(F), A: nums(A), B: nums(B) },
      answer: [num(W)],
    }
  }
}

// Stufe 3: Beträge und Winkel; erst der Anteil der Kraft längs des Weges, dann die Arbeit
function buildWorkPolar(rng: Rng, names: { readonly F: string; readonly s: string }): Built {
  const phi = rng.pick([30, 45, 60, 120, 135, 150])
  const Fm = rng.pick([2, 4, 6, 8, 10, 12, 20, 30, 40, 50])
  const sm = rng.int(2, 9)
  const cos = COS_SPECIAL[phi]
  const Fpar = sMul(int(Fm), cos)
  const W = sMul(Fpar, int(sm))
  const lineF = (x: Surd) => math(`F_s = ${sl(x)}${N}`)
  const lineW = (x: Surd | string) => math(`W = ${typeof x === 'string' ? x : sl(x)}${J}`)
  const Fs = names.F.replace('\\vec ', '')
  const steps = [
    choiceStep(rng, {
      id: 'anteil',
      title: 'Anteil längs des Weges',
      question: `Wie groß ist der Anteil $F_s$ der Kraft in Richtung des Weges?`,
      correct: lineF(Fpar),
      wrongs: [
        { content: lineF(sMul(int(Fm), SIN_SPECIAL[phi])), rule: 'vec-angle-arcsin' },
        { content: lineF(sMul(int(Fm), COS_SPECIAL[ANGLE_TABLE[phi]])), rule: 'vec-angle-table' },
        { content: lineF(int(Fm)), rule: 'vec-work-no-cos' },
        { content: lineF(sNeg(Fpar)), rule: 'vec-angle-supplement' },
      ],
      hint: 'Der Anteil längs des Weges ist der Schatten der Kraft auf den Weg: Betrag mal Kosinus des Winkels dazwischen.',
      explanation: {
        detailed: `$F_s = ${Fs}\\cos\\varphi = ${Fm} \\cdot \\cos ${deg(phi)} = ${Fm} \\cdot ${sFactor(cos)} = ${sl(Fpar)}${N}$.${phi > 90 ? ' Der Winkel ist stumpf: Der Anteil zeigt gegen den Weg.' : ''}`,
        short: `$F_s = ${Fs}\\cos\\varphi = ${sl(Fpar)}${N}$.`,
      },
      established: [`F_s = ${sl(Fpar)}${N}`],
      cards: [CARD.arbeit, CARD.projektion],
      drawing: polarWorkDrawing(phi, names, `Kraft mit $${Fs} = ${Fm}${N}$ unter $\\varphi = ${deg(phi)}$ zum Weg mit $s = ${sm}${METER}$.`, false),
    }),
    choiceStep(rng, {
      id: 'arbeit',
      title: 'Arbeit',
      question: 'Wie groß ist die Arbeit $W$?',
      correct: lineW(W),
      wrongs: [
        { content: lineW(int(Fm * sm)), rule: 'vec-work-no-cos' },
        { content: lineW(sMul(Fpar, S(rat(1, sm)))), rule: 'vec-force-solve' },
        { content: lineW(sNeg(W)), rule: 'vec-work-sign' },
      ],
      hint: 'Arbeit ist der Anteil der Kraft längs des Weges mal die Länge des Weges.',
      explanation: {
        detailed: `$W = F_s \\cdot s = ${Fs}\\,s\\cos\\varphi = ${sFactor(Fpar)} \\cdot ${sm} = ${sl(W)}${J}$.`,
        short: `$W = ${Fs}\\,s\\cos\\varphi = ${sl(W)}${J}$.`,
      },
      established: [`W = ${sl(W)}${J}`],
      cards: [CARD.arbeit],
    }),
  ]
  return {
    kind: 'work',
    instruction: `Eine Kraft mit dem Betrag $${Fs}$ zieht einen Körper um die Strecke $s$. Kraft und Weg schließen den Winkel $\\varphi$ ein. Wie groß ist die Arbeit?`,
    functionLatex: `${Fs} = ${Fm}${N},\\; s = ${sm}${METER},\\; \\varphi = ${deg(phi)}`,
    steps,
    cards: [CARD.arbeit],
    resultLatex: `W = ${sl(W)}${J}`,
    resultDrawing: polarWorkDrawing(phi, names, `$W = ${Fs}\\,s\\cos\\varphi = ${sl(W)}${J}$; der Anteil $F_s$ ist der Schatten der Kraft auf den Weg (Bild nicht maßstäblich).`, true),
    form: `work|polar|${phi}|${Fs}|${Fm % 10 === 0 ? 'round' : 'plain'}`,
    data: { Fm: [Fm], s: [sm], phi: [phi] },
    answer: [sv(W)],
  }
}

// Stufe 4: Arbeit umstellen (Winkel bzw. Weg gesucht)
function buildWorkBack(rng: Rng): Built {
  const phi = rng.pick([30, 45, 60, 120, 135, 150])
  const Fm = rng.pick([2, 4, 6, 8, 10, 12, 20, 40])
  const sm = rng.int(2, 9)
  const cos = COS_SPECIAL[phi]
  const W = sMul(int(Fm * sm), cos)
  const askAngle = rng.chance(0.55)
  if (askAngle) {
    const line = (x: Surd | string) => math(`\\cos\\varphi = ${typeof x === 'string' ? x : sl(x)}`)
    const wrongCos = sMul(W, S(rat(1, Fm)))
    const steps = [
      choiceStep(rng, {
        id: 'kosinus',
        title: 'Kosinus',
        question: 'Wie groß ist $\\cos\\varphi$?',
        correct: line(cos),
        wrongs: [
          { content: line(wrongCos), rule: 'vec-cos-one-length' },
          { content: line(sMul(int(Fm * sm), inverse(W))), rule: 'vec-force-solve' },
          { content: line(sNeg(cos)), rule: 'vec-dot-sign' },
        ],
        hint: 'Stelle $W = F\\,s\\cos\\varphi$ nach $\\cos\\varphi$ um: durch $F$ und durch $s$ teilen.',
        explanation: {
          detailed: `$\\cos\\varphi = \\frac{W}{F\\,s} = \\frac{${sl(W)}}{${Fm} \\cdot ${sm}} = ${sl(cos)}$.`,
          short: `$\\cos\\varphi = \\frac{W}{F\\,s} = ${sl(cos)}$.`,
        },
        established: [`\\cos\\varphi = ${sl(cos)}`],
        cards: [CARD.arbeit, CARD.winkel],
      }),
      choiceStep(rng, {
        id: 'winkel',
        title: 'Winkel',
        question: 'Wie groß ist der Winkel $\\varphi$ zwischen Kraft und Weg?',
        correct: math(`\\varphi = ${deg(phi)}`),
        wrongs: [
          { content: math(`\\varphi = ${deg(180 - phi)}`), rule: 'vec-angle-supplement' },
          { content: math(`\\varphi = ${deg(phi < 90 ? 90 - phi : 270 - phi)}`), rule: 'vec-angle-arcsin' },
          { content: math(`\\varphi = ${deg(ANGLE_TABLE[phi])}`), rule: 'vec-angle-table' },
        ],
        hint: 'Lies den Winkel aus der Tabelle der besonderen Werte ab; ein negativer Kosinus gehört zu einem stumpfen Winkel.',
        explanation: {
          detailed: `$\\varphi = \\arccos\\left(${sl(cos)}\\right) = ${deg(phi)}$.${phi > 90 ? ' Die Arbeit ist negativ, die Kraft bremst: Der Winkel ist stumpf.' : ''}`,
          short: `$\\varphi = ${deg(phi)}$.`,
        },
        established: [`\\varphi = ${deg(phi)}`],
        cards: [CARD.arbeit, CARD.winkel],
      }),
    ]
    return {
      kind: 'work',
      instruction: 'Eine konstante Kraft verrichtet auf einem geraden Weg die Arbeit $W$. Unter welchem Winkel $\\varphi$ zum Weg zieht sie?',
      functionLatex: `W = ${sl(W)}${J},\\; F = ${Fm}${N},\\; s = ${sm}${METER}`,
      steps,
      cards: [CARD.arbeit],
      resultLatex: `\\varphi = ${deg(phi)}`,
      resultDrawing: anglePicture(phi, `$\\cos\\varphi = ${sl(cos)}$, also $\\varphi = ${deg(phi)}$.`),
      form: `work|backAngle|${phi}|${Fm % 10 === 0 ? 'round' : 'plain'}|${sm % 2}`,
      data: { W: [sv(W)], Fm: [Fm], s: [sm] },
      answer: [phi],
    }
  }
  // Weg gesucht
  const Fs = sMul(int(Fm), cos)
  const line = (x: Surd) => math(`s = ${sl(x)}${METER}`)
  const steps = [
    choiceStep(rng, {
      id: 'anteil',
      title: 'Anteil längs des Weges',
      question: 'Wie groß ist der Anteil $F_s = F\\cos\\varphi$ der Kraft in Richtung des Weges?',
      correct: math(`F_s = ${sl(Fs)}${N}`),
      wrongs: [
        { content: math(`F_s = ${sl(sMul(int(Fm), SIN_SPECIAL[phi]))}${N}`), rule: 'vec-angle-arcsin' },
        { content: math(`F_s = ${sl(sMul(int(Fm), COS_SPECIAL[ANGLE_TABLE[phi]]))}${N}`), rule: 'vec-angle-table' },
        { content: math(`F_s = ${Fm}${N}`), rule: 'vec-work-no-cos' },
      ],
      hint: 'Betrag der Kraft mal Kosinus des Winkels zum Weg.',
      explanation: { detailed: `$F_s = ${Fm} \\cdot \\cos ${deg(phi)} = ${sl(Fs)}${N}$.`, short: `$F_s = ${sl(Fs)}${N}$.` },
      established: [`F_s = ${sl(Fs)}${N}`],
      cards: [CARD.arbeit],
    }),
    choiceStep(rng, {
      id: 'weg',
      title: 'Weg',
      question: 'Wie lang ist der Weg $s$?',
      correct: line(int(sm)),
      wrongs: [
        { content: math(`s = ${sl(sMul(W, Fs))}${METER}`), rule: 'vec-force-solve' },
        { content: line(sMul(W, S(rat(1, Fm)))), rule: 'vec-work-no-cos' },
        { content: line(int(-sm)), rule: 'vec-dot-sign' },
      ],
      hint: '$W = F_s \\cdot s$: durch $F_s$ teilen.',
      explanation: { detailed: `$s = \\frac{W}{F_s} = \\frac{${sl(W)}}{${sl(Fs)}} = ${sm}${METER}$.`, short: `$s = \\frac{W}{F\\cos\\varphi} = ${sm}${METER}$.` },
      established: [`s = ${sm}${METER}`],
      cards: [CARD.arbeit],
    }),
  ]
  return {
    kind: 'work',
    instruction: 'Eine konstante Kraft zieht unter dem Winkel $\\varphi$ zum Weg und verrichtet dabei die Arbeit $W$. Wie lang ist der Weg $s$?',
    functionLatex: `W = ${sl(W)}${J},\\; F = ${Fm}${N},\\; \\varphi = ${deg(phi)}`,
    steps,
    cards: [CARD.arbeit],
    resultLatex: `s = ${sm}${METER}`,
    resultDrawing: anglePicture(phi, `$s = \\frac{W}{F\\cos\\varphi} = ${sm}${METER}$.`),
    form: `work|backPath|${phi}|${Fm % 10 === 0 ? 'round' : 'plain'}|${sm % 2}`,
    data: { W: [sv(W)], Fm: [Fm], phi: [phi] },
    answer: [sm],
  }
}

// 1 / (k·√r) als k'·√r
const inverse = (a: Surd): Surd => S(ratDiv(rat(1), ratMul(a.coef, rat(a.rad))), a.rad)

function anglePicture(phi: number, caption: string): VectorDrawing {
  const v = [3 * Math.cos((phi * Math.PI) / 180), 3 * Math.sin((phi * Math.PI) / 180)]
  return {
    ...emptyDrawing(2, caption),
    scene: true,
    arrows: [
      { from: O, to: [5, 0], color: 'b', label: '\\vec s' },
      { from: O, to: v, color: 'a', label: '\\vec F' },
    ],
    angles: [{ at: O, u: [5, 0], v, color: 'r', label: deg(phi) }],
  }
}

// Kraft unter dem Winkel φ zum Weg, als Szene (Längen nur angedeutet); mit Ergebnis der Schatten F_s auf dem Weg
function polarWorkDrawing(phi: number, names: { readonly F: string; readonly s: string }, caption: string, result: boolean): VectorDrawing {
  const tip = [3.4 * Math.cos((phi * Math.PI) / 180), 3.4 * Math.sin((phi * Math.PI) / 180)]
  const base = anglePicture(phi, caption)
  return {
    ...base,
    arrows: [
      { from: O, to: [5, 0], color: 'b', label: names.s },
      { from: O, to: tip, color: 'a', label: names.F },
      ...(result ? [{ from: O, to: [tip[0], 0], color: 'r' as const, label: 'F_s', phase: 2 }] : []),
    ],
    segments: result ? [{ from: tip, to: [tip[0], 0], color: 'muted', dashed: true, phase: 1 }] : [],
    angles: [{ at: O, u: [5, 0], v: tip, color: 'muted', label: deg(phi) }],
    ...(result ? { playLabel: 'Licht an' } : {}),
  }
}

// Stufe 5: zwei Kräfte, eine mit Parameter, Weg von A nach B; t so, dass die Arbeit stimmt
function buildWorkParam(rng: Rng): Built {
  const t = rng.pick(PARAMS)
  for (;;) {
    const A = ints(rng, 3, -4, 4)
    const s = ints(rng, 3, -4, 4)
    if (s.filter(isZero).length > 1) continue
    const F1 = ints(rng, 3, -5, 5)
    const base = ints(rng, 3, -5, 5)
    const i = rng.int(0, 2)
    if (isZero(s[i])) continue
    const c = rng.pick([1, -1, 2])
    const sol = rat(rng.int(-6, 6))
    // F_2 = base mit c·t an der Stelle i (base[i] als Zahl dazu)
    const R0 = vecAdd(F1, base)
    const C = c * num(s[i])
    const K = num(vecDot(R0, s))
    const W = C * num(sol) + K
    if (W === 0 || K === 0 || isZero(sol)) continue
    const B = vecAdd(A, s)
    const lin = (k: number, b: number) => `${k === 1 ? t : k === -1 ? `-${t}` : `${k}${t}`}${b === 0 ? '' : ` ${b > 0 ? '+' : '-'} ${Math.abs(b)}`}`
    const F2entries = base.map((x, j) => (j === i ? lin(c, num(x)) : ratLatex(x)))
    const Rentries = R0.map((x, j) => (j === i ? lin(c, num(x)) : ratLatex(x)))
    const R1entries = vecSub(F1, base).map((x, j) => (j === i ? lin(-c, num(F1[i]) - num(base[i])) : ratLatex(x)))
    const RLine = (e: readonly string[]) => math(`\\vec F_R = ${columnLatex(e)}`)
    const eqLine = (l: string, rhs: number) => math(`${l} = ${rhs}`)
    const tLine = (x: Rational) => math(`${t} = ${ratLatex(x)}`)
    const paren = (e: string) => (e.includes(' ') || e.startsWith('-') ? `(${e})` : e)
    const dotLine = Rentries.map((e, j) => `${paren(e)} \\cdot ${factor(ratLatex(s[j]))}`).join(' + ')
    const sn = arrowName('A', 'B')
    const steps = [
      connectStep(rng, 'A', 'B', A, B),
      choiceStep(rng, {
        id: 'resultierende',
        title: 'Resultierende',
        question: 'Wie lautet $\\vec F_R = \\vec F_1 + \\vec F_2$?',
        correct: RLine(Rentries),
        wrongs: [
          { content: RLine(R1entries), rule: 'vec-force-subtracted' },
          { content: RLine(Rentries.map((e, j) => (j === i ? lin(-c, num(R0[i])) : e))), rule: 'vec-sign-slip' },
        ],
        hint: 'Eintrag für Eintrag addieren; der Eintrag mit dem Parameter bleibt ein Term.',
        explanation: { detailed: `$\\vec F_R = ${vecLatex(F1)} + ${columnLatex(F2entries)} = ${columnLatex(Rentries)}$.`, short: `$\\vec F_R = ${columnLatex(Rentries)}$.` },
        established: [`\\vec F_R = ${columnLatex(Rentries)}`],
        cards: [CARD.resultierende],
      }),
      choiceStep(rng, {
        id: 'gleichung',
        title: 'Gleichung',
        question: `Welche Gleichung muss $${t}$ erfüllen, damit $\\vec F_R$ die Arbeit $W = ${W}${J}$ verrichtet?`,
        correct: eqLine(lin(C, K), W),
        wrongs: [
          { content: eqLine(lin(-C, K), W), rule: 'vec-dot-sign' },
          { content: eqLine(lin(C, K), -W), rule: 'vec-work-sign' },
        ],
        hint: `$W = \\vec F_R \\cdot ${sn}$: Skalarprodukt mit dem Parameter aufschreiben und gleich $${W}$ setzen.`,
        explanation: {
          detailed: `$\\vec F_R \\cdot ${sn} = ${dotLine} = ${lin(C, K)}$, und das soll $${W}$ sein.`,
          short: `$${lin(C, K)} = ${W}$.`,
        },
        established: [`${lin(C, K)} = ${W}`],
        cards: [CARD.arbeit],
      }),
      choiceStep(rng, {
        id: 'aufloesen',
        title: 'Auflösen',
        question: `Wie groß ist $${t}$?`,
        correct: tLine(sol),
        wrongs: [
          { content: tLine(ratDiv(rat(W + K), rat(C))), rule: 'vec-param-solve' },
          { content: tLine(ratDiv(rat(C), rat(W - K))), rule: 'vec-param-solve' },
          { content: tLine(rat(W - K - C)), rule: 'vec-force-solve' },
        ],
        hint: `Bring $${K}$ auf die andere Seite und teile durch $${C}$.`,
        explanation: {
          detailed: `$${lin(C, K)} = ${W} \\;\\Rightarrow\\; ${lin(C, 0)} = ${W - K} \\;\\Rightarrow\\; ${t} = ${ratLatex(sol)}$.`,
          short: `$${t} = ${ratLatex(sol)}$.`,
        },
        established: [`${t} = ${ratLatex(sol)}`],
        cards: [CARD.arbeit],
      }),
    ]
    if (steps.some((st) => st.choices.length < 3)) continue
    const F2 = base.map((x, j) => (j === i ? ratAdd(x, rat(c * num(sol))) : x))
    const FR = vecAdd(F1, F2)
    return {
      kind: 'work',
      instruction: `Ein Körper wird von $A$ nach $B$ verschoben (in Metern). Auf ihn wirken $\\vec F_1$ und $\\vec F_2$ (in Newton). Für welches $${t}$ verrichten beide zusammen die Arbeit $W = ${W}${J}$?`,
      functionLatex: `${pointLatex('A', A)},\\; ${pointLatex('B', B)},\\; \\vec F_1 = ${vecLatex(F1)},\\; \\vec F_2 = ${columnLatex(F2entries)}`,
      steps,
      cards: [CARD.arbeit, CARD.resultierende],
      resultLatex: `${t} = ${ratLatex(sol)}`,
      resultDrawing: workDrawing(3, FR, s, '\\vec F_R', sn, `Mit $${t} = ${ratLatex(sol)}$ ist $\\vec F_R = ${vecLatex(FR)}$ und $W = \\vec F_R \\cdot ${sn} = ${W}${J}$.`, A),
      form: `work|param|${t}|${i}|${c}|${Math.sign(W)}|${Math.sign(num(sol))}`,
      data: { A: nums(A), B: nums(B), F1: nums(F1), base: nums(base), i: [i], c: [c], W: [W] },
      answer: [num(sol)],
    }
  }
}

// ------------------------------------------------------------------ Drehmoment

const momentOf = (r: Vec, F: Vec): Rational => ratSub(ratMul(r[0], F[1]), ratMul(r[1], F[0]))

// Moment einer Kraft um einen Punkt; ref: Bezugspunkt (für den Fehler „Hebel ab dem Ursprung")
function momentStep(rng: Rng, id: string, Mname: string, r: Vec, F: Vec, rName: string, Fname: string, P?: Vec): GuidedStep {
  const M = momentOf(r, F)
  const line = (x: Rational) => math(`${Mname} = ${ratLatex(x)}${NM}`)
  const wrongs: Wrong[] = [
    { content: line(ratNeg(M)), rule: 'vec-torque-order' },
    { content: line(ratAdd(ratMul(r[0], F[1]), ratMul(r[1], F[0]))), rule: 'vec-torque-plus' },
    { content: line(vecDot(r, F)), rule: 'vec-torque-dot' },
  ]
  if (P) wrongs.unshift({ content: line(momentOf(P, F)), rule: 'vec-torque-no-reference' })
  const formula = `${Mname} = r_x F_y - r_y F_x = ${factor(ratLatex(r[0]))} \\cdot ${factor(ratLatex(F[1]))} - ${factor(ratLatex(r[1]))} \\cdot ${factor(ratLatex(F[0]))} = ${ratLatex(M)}${NM}`
  return choiceStep(rng, {
    id,
    title: 'Moment',
    question: `Wie groß ist das Moment $${Mname}$ von $${Fname}$?`,
    correct: line(M),
    wrongs,
    hint: `$${Mname} = r_x F_y - r_y F_x$ mit dem Hebel $${rName}$ vom Bezugspunkt zum Angriffspunkt.`,
    explanation: { detailed: `Mit $${rName} = ${vecLatex(r)}$: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.drehmoment],
  })
}

const SENSE_M = ['gegen den Uhrzeigersinn ($M > 0$)', 'im Uhrzeigersinn ($M < 0$)', 'gar nicht ($M = 0$)']
function senseStep(rng: Rng, M: Rational, point: string): GuidedStep {
  const idx = ratSign(M) > 0 ? 0 : ratSign(M) < 0 ? 1 : 2
  return choiceStep(rng, {
    id: 'drehsinn',
    title: 'Drehsinn',
    question: `In welche Richtung dreht das Moment um $${point}$?`,
    correct: SENSE_M[idx],
    wrongs: SENSE_M.flatMap((t, i) => (i === idx ? [] : [{ content: t, rule: 'vec-torque-sense' }])),
    hint: 'Vereinbarung: positiv heißt gegen den Uhrzeigersinn.',
    explanation: { detailed: `Das Moment ist ${idx === 0 ? 'positiv' : idx === 1 ? 'negativ' : 'gleich $0$'}, also dreht es ${SENSE_M[idx].replace(/ \(.*\)/, '')}.`, short: SENSE_M[idx] },
    cards: [CARD.drehmoment],
  })
}

type Load = { readonly P: Vec; readonly F: Vec; readonly name: string; readonly point: string }

function torqueDrawing(A: Vec, refName: string, loads: readonly Load[], caption: string, result: boolean): VectorDrawing {
  const colors = ['a', 'b', 'c'] as const
  return {
    ...emptyDrawing(2, caption),
    points: [{ at: nums(A), label: refName }, ...loads.map((l) => ({ at: nums(l.P), label: l.point }))],
    segments: loads.map((l) => ({ from: nums(A), to: nums(l.P), color: 'muted' as const, dashed: true, ...(result ? { phase: 1 } : {}) })),
    arrows: loads.map((l, i) => ({ from: nums(l.P), to: nums(vecAdd(l.P, l.F)), color: colors[i], label: l.name })),
  }
}

function buildTorque(rng: Rng, level: Level): Built {
  if (level === 5) return buildTorqueBalance(rng)
  const aboutOrigin = level === 2
  const two = level === 4
  const [refName, p1, p2] = rng.pick([
    ['A', 'P', 'Q'],
    ['B', 'C', 'D'],
    ['A', 'K', 'L'],
  ] as const)
  for (;;) {
    const A = aboutOrigin ? vec(0, 0) : ints(rng, 2, -4, 4)
    const ref = aboutOrigin ? 'O' : refName
    const loads: Load[] = [{ P: ints(rng, 2, -5, 5), F: ints(rng, 2, -6, 6), name: two ? '\\vec F_1' : '\\vec F', point: p1 }]
    if (two) loads.push({ P: ints(rng, 2, -5, 5), F: ints(rng, 2, -6, 6), name: '\\vec F_2', point: p2 })
    const rs = loads.map((l) => vecSub(l.P, A))
    if (rs.some((r) => r.some(isZero)) || loads.some((l) => l.F.filter(isZero).length > 1)) continue
    const Ms = loads.map((l, i) => momentOf(rs[i], l.F))
    const M = Ms.reduce((acc, x) => ratAdd(acc, x), rat(0))
    if (Ms.some(isZero) || isZero(M)) continue
    const Mname = `M_${ref}`
    const steps: GuidedStep[] = []
    const question = torqueDrawing(A, ref, loads, `Bezugspunkt $${ref}$, ${loads.map((l) => `$${l.name}$ greift bei $${l.point}$ an`).join(', ')}.`, false)
    if (level === 3) steps.push(connectStep(rng, refName, p1, A, loads[0].P, question))
    loads.forEach((l, i) => {
      const rName = aboutOrigin ? `\\vec r = \\overrightarrow{O${l.point}}` : arrowName(ref, l.point)
      const step = momentStep(rng, two ? `moment-${i + 1}` : 'moment', two ? `M_{${i + 1}}` : Mname, rs[i], l.F, rName, l.name, aboutOrigin ? undefined : l.P)
      steps.push(steps.length === 0 ? { ...step, drawing: question } : step)
    })
    if (two) {
      const line = (x: Rational) => math(`${Mname} = ${ratLatex(x)}${NM}`)
      const absSum = ratAdd(ratAbs(Ms[0]), ratAbs(Ms[1]))
      const formula = `${Mname} = M_1 + M_2 = ${ratLatex(Ms[0])} + ${factor(ratLatex(Ms[1]))} = ${ratLatex(M)}${NM}`
      steps.push(
        choiceStep(rng, {
          id: 'summe',
          title: 'Resultierendes Moment',
          question: `Wie groß ist das resultierende Moment $${Mname}$?`,
          correct: line(M),
          wrongs: [
            { content: line(ratSub(Ms[0], Ms[1])), rule: 'vec-force-subtracted' },
            { content: line(absSum), rule: 'vec-force-add-magnitudes' },
            { content: line(ratNeg(M)), rule: 'vec-torque-order' },
          ],
          hint: 'Momente um denselben Punkt werden mit ihren Vorzeichen addiert.',
          explanation: { detailed: `$${formula}$.`, short: `$${formula}$.` },
          established: [formula],
          cards: [CARD.drehmoment],
        }),
      )
    }
    steps.push(senseStep(rng, M, ref))
    if (steps.some((s) => s.choices.length < 3)) continue
    const given = [...(aboutOrigin ? [] : [pointLatex(refName, A)]), ...loads.flatMap((l) => [pointLatex(l.point, l.P), `${l.name} = ${vecLatex(l.F)}${N}`])].join(',\\; ')
    return {
      kind: 'torque',
      instruction: two
        ? `An einem Bauteil greifen zwei Kräfte an (Koordinaten in Metern). Wie groß ist das resultierende Moment um $${refName}$, und in welche Richtung dreht es?`
        : `Die Kraft $\\vec F$ greift im Punkt $${p1}$ an (Koordinaten in Metern). Wie groß ist ihr Moment um ${aboutOrigin ? 'den Ursprung $O$' : `den Punkt $${refName}$`}, und in welche Richtung dreht es?`,
      functionLatex: given,
      steps,
      cards: [CARD.drehmoment],
      resultLatex: `${Mname} = ${ratLatex(M)}${NM}`,
      resultDrawing: torqueDrawing(A, ref, loads, `$${Mname} = ${ratLatex(M)}${NM}$: Das Bauteil dreht um $${ref}$ ${SENSE_M[ratSign(M) > 0 ? 0 : 1].replace(/ \(.*\)/, '')}.`, true),
      form: `torque|${level}|${aboutOrigin ? 'O' : refName}|${ratSign(M)}|${loads.map((l) => l.F.map(ratSign).join('')).join(',')}|${two ? Ms.map(ratSign).join('') : rs[0].map(ratSign).join('')}`,
      data: { A: nums(A), ...Object.fromEntries(loads.flatMap((l, i) => [[`P${i + 1}`, nums(l.P)], [`F${i + 1}`, nums(l.F)]])) },
      answer: [num(M)],
    }
  }
}

// Stufe 5: Momentengleichgewicht um A; die Kraft F_B längs einer Achse hat unbekannten Betrag
const AXES = [
  { name: 'senkrecht nach unten', e: vec(0, -1) },
  { name: 'senkrecht nach oben', e: vec(0, 1) },
  { name: 'waagrecht nach rechts', e: vec(1, 0) },
  { name: 'waagrecht nach links', e: vec(-1, 0) },
] as const

function buildTorqueBalance(rng: Rng): Built {
  for (;;) {
    const A = ints(rng, 2, -3, 3)
    const n = rng.pick([1, 2])
    const loads: Load[] = Array.from({ length: n }, (_, i) => ({ P: ints(rng, 2, -5, 5), F: ints(rng, 2, -6, 6), name: `\\vec F_${i + 1}`, point: ['P', 'Q'][i] }))
    const axis = rng.pick(AXES)
    const B = ints(rng, 2, -5, 5)
    const rs = loads.map((l) => vecSub(l.P, A))
    const rB = vecSub(B, A)
    if (rs.some((r) => r.every(isZero)) || loads.some((l) => l.F.filter(isZero).length > 1)) continue
    const Ms = loads.map((l, i) => momentOf(rs[i], l.F))
    const M0 = Ms.reduce((acc, x) => ratAdd(acc, x), rat(0))
    // Moment von F_B = F · (r_B × e)
    const c = momentOf(rB, axis.e)
    if (isZero(c) || isZero(M0) || Ms.some(isZero) || rB.some(isZero)) continue
    const F = ratDiv(ratNeg(M0), c)
    if (ratSign(F) <= 0 || F.d > 4n) continue
    const lever = sqrtRat(vecNorm2(rB))
    const termF = (k: Rational) => `${isZero(k) ? '0' : ratLatex(k) === '1' ? '' : ratLatex(k) === '-1' ? '-' : ratLatex(k)}F`
    const exprLine = (k: Rational) => math(`M_B = ${termF(k)}`)
    const leverWrong = sMul(lever, int(ratSign(c)))
    const steps: GuidedStep[] = []
    const question = torqueDrawing(A, 'A', loads, `Bezugspunkt $A$; bei $B$ greift $\\vec F_B$ ${axis.name} an, ihr Betrag $F$ ist gesucht.`, false)
    const known = n === 1 ? 'M_1' : 'M_P + M_Q'
    loads.forEach((l, i) => {
      const step = momentStep(rng, `moment-${i + 1}`, n === 1 ? 'M_1' : `M_${l.point}`, rs[i], l.F, arrowName('A', l.point), l.name, l.P)
      steps.push(i === 0 ? { ...step, drawing: { ...question, points: [...question.points, { at: nums(B), label: 'B' }] } } : step)
    })
    steps.push(
      choiceStep(rng, {
        id: 'moment-b',
        title: 'Moment der gesuchten Kraft',
        question: `Wie groß ist das Moment von $\\vec F_B = F\\,${vecLatex(axis.e)}$ um $A$?`,
        correct: exprLine(c),
        wrongs: [
          { content: exprLine(ratNeg(c)), rule: 'vec-torque-order' },
          { content: exprLine(momentOf(B, axis.e)), rule: 'vec-torque-no-reference' },
          { content: math(`M_B = ${surdLatex(leverWrong)}F`), rule: 'vec-torque-lever' },
          { content: exprLine(ratAdd(ratMul(rB[0], axis.e[1]), ratMul(rB[1], axis.e[0]))), rule: 'vec-torque-plus' },
        ],
        hint: `Hebel $${arrowName('A', 'B')} = ${vecLatex(rB)}$; mit $\\vec F_B = ${vecLatex(axis.e)}\\cdot F$ ist $M_B = r_x F_y - r_y F_x$.`,
        explanation: {
          detailed: `$${arrowName('A', 'B')} = ${vecLatex(rB)}$, also $M_B = ${factor(ratLatex(rB[0]))} \\cdot ${factor(ratLatex(axis.e[1]))}F - ${factor(ratLatex(rB[1]))} \\cdot ${factor(ratLatex(axis.e[0]))}F = ${termF(c)}$. Hebelarm ist nur der Abstand quer zur Kraft.`,
          short: `$M_B = ${termF(c)}$.`,
        },
        established: [`M_B = ${termF(c)}`],
        cards: [CARD.drehmoment],
      }),
    )
    const line = (x: Rational) => math(`F = ${ratLatex(x)}${N}`)
    steps.push(
      choiceStep(rng, {
        id: 'gleichgewicht',
        title: 'Gleichgewicht',
        question: 'Wie groß muss $F$ sein, damit sich das Bauteil nicht um $A$ dreht?',
        correct: line(F),
        wrongs: [
          { content: line(ratNeg(F)), rule: 'vec-force-equilibrium-sign' },
          { content: line(ratDiv(c, ratNeg(M0))), rule: 'vec-force-solve' },
          { content: line(ratMul(ratNeg(M0), c)), rule: 'vec-force-solve' },
        ],
        hint: 'Alle Momente um $A$ zusammen ergeben $0$; dann nach $F$ auflösen.',
        explanation: {
          detailed: `$${known} + M_B = 0$: $${ratLatex(M0)} ${ratSign(c) < 0 ? '-' : '+'} ${termF(ratAbs(c))} = 0$, also $F = ${ratLatex(F)}${N}$.`,
          short: `$F = -\\frac{${known}}{${ratLatex(c)}} = ${ratLatex(F)}${N}$.`,
        },
        established: [`F = ${ratLatex(F)}${N}`],
        cards: [CARD.drehmoment, CARD.resultierende],
      }),
    )
    if (steps.some((s) => s.choices.length < 3)) continue
    const FB = vecScale(F, axis.e)
    const all: Load[] = [...loads, { P: B, F: FB, name: '\\vec F_B', point: 'B' }]
    return {
      kind: 'torque',
      instruction: `An einem Bauteil, das sich um $A$ drehen kann, greif${n === 1 ? 't die Kraft $\\vec F_1$' : 'en die Kräfte $\\vec F_1$ und $\\vec F_2$'} an (Koordinaten in Metern). Im Punkt $B$ wirkt zusätzlich eine Kraft $\\vec F_B$ ${axis.name}. Wie groß muss ihr Betrag $F$ sein, damit das resultierende Moment um $A$ gleich $0$ ist?`,
      functionLatex: [pointLatex('A', A), ...loads.flatMap((l) => [pointLatex(l.point, l.P), `${l.name} = ${vecLatex(l.F)}${N}`]), pointLatex('B', B)].join(',\\; '),
      steps,
      cards: [CARD.drehmoment],
      resultLatex: `F = ${ratLatex(F)}${N}`,
      resultDrawing: torqueDrawing(A, 'A', all, `Mit $F = ${ratLatex(F)}${N}$ heben sich die Momente um $A$ auf.`, true),
      form: `torque|5|${n}|${axis.name}|${ratSign(M0)}|${F.d > 1n ? 'frac' : 'int'}`,
      data: { A: nums(A), B: nums(B), e: nums(axis.e), ...Object.fromEntries(loads.flatMap((l, i) => [[`P${i + 1}`, nums(l.P)], [`F${i + 1}`, nums(l.F)]])) },
      answer: [num(F)],
    }
  }
}

// ------------------------------------------------------------------ Seilkräfte am Knoten

const ROPES = [
  [3, 4, 5],
  [4, 3, 5],
  [5, 12, 13],
  [12, 5, 13],
  [6, 8, 10],
  [8, 6, 10],
] as const

function unitStep(rng: Rng, id: string, P: string, K: Vec, Pv: Vec, len: number, drawing?: VectorDrawing): GuidedStep {
  const d = vecSub(Pv, K)
  const e = vecScale(rat(1, len), d)
  const name = `\\vec e_${P}`
  const line = (v: Vec) => math(`${name} = ${vecLatex(v)}`)
  const formula = `${name} = \\frac{${arrowName('K', P)}}{\\lvert ${arrowName('K', P)} \\rvert} = \\frac{1}{${len}}${vecLatex(d)} = ${vecLatex(e)}`
  return choiceStep(rng, {
    id,
    title: `Richtung des Seils zu $${P}$`,
    question: `Wie lautet der Einheitsvektor $${name}$ vom Knoten $K$ in Richtung $${P}$?`,
    correct: line(e),
    wrongs: [
      { content: line(d), rule: 'vec-knot-not-normalized' },
      { content: line(vecScale(rat(-1), e)), rule: 'vec-reversed' },
      { content: line(vecScale(rat(1, len * len), d)), rule: 'vec-unit-squared' },
    ],
    hint: `$${arrowName('K', P)} = ${P} - K$, dann durch seine Länge teilen.`,
    explanation: { detailed: `$${arrowName('K', P)} = ${vecLatex(d)}$ mit der Länge $\\sqrt{${num(vecNorm2(d))}} = ${len}$, also $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.resultierende, CARD.einheit],
    ...(drawing ? { drawing } : {}),
  })
}

function knotDrawing(K: Vec, anchors: readonly { name: string; at: Vec }[], G: number, caption: string, forces?: readonly Vec[]): VectorDrawing {
  // Kräfte verkleinert, damit sie neben die Seile passen
  const ropeLen = Math.min(...anchors.map((a) => Math.hypot(...nums(vecSub(a.at, K)))))
  const maxF = Math.max(G, ...(forces ?? []).map((f) => Math.hypot(...nums(f))))
  const k = (0.8 * ropeLen) / maxF
  const at = (v: readonly number[]) => nums(K).map((x, i) => x + k * v[i])
  const colors = ['r', 'c'] as const
  return {
    ...emptyDrawing(2, caption),
    points: [{ at: nums(K), label: 'K' }, ...anchors.map((a) => ({ at: nums(a.at), label: a.name }))],
    segments: anchors.map((a) => ({ from: nums(K), to: nums(a.at), color: 'muted' as const })),
    arrows: [
      { from: nums(K), to: at([0, -G]), color: 'a', label: '\\vec F_G' },
      ...(forces ?? []).map((f, i) => ({ from: nums(K), to: at(nums(f)), color: colors[i], label: `\\vec S_${anchors[i].name}`, phase: i + 1 })),
    ],
  }
}

function buildKnot(rng: Rng, level: Level): Built {
  const both = level === 5
  for (;;) {
    const K = ints(rng, 2, -3, 3)
    const [a1, b1, c1] = rng.pick(ROPES)
    const left = rng.chance(0.5)
    const u1 = vec(left ? -a1 : a1, b1)
    const A = vecAdd(K, u1)
    let B: Vec
    let c2 = 0
    if (both) {
      const r2 = rng.pick(ROPES)
      if (r2[0] * b1 === a1 * r2[1]) continue
      B = vecAdd(K, vec(left ? r2[0] : -r2[0], r2[1]))
      c2 = r2[2]
    } else {
      const L = rng.int(3, 8)
      B = vecAdd(K, vec(left ? L : -L, 0))
      c2 = L
    }
    const u2 = vecSub(B, K)
    // S_A e_A + S_B e_B = (0, G): mit Q = b1 a2 − a1 b2 (ohne Normierung) und Vielfachen der Längen
    const e1 = vecScale(rat(1, c1), u1)
    const e2 = vecScale(rat(1, c2), u2)
    const D = ratSub(ratMul(e1[0], e2[1]), ratMul(e1[1], e2[0]))
    const unitSA = ratDiv(ratNeg(e2[0]), D)
    const unitSB = ratDiv(e1[0], D)
    // kleinstes G (Vielfaches), bei dem beide Seilkräfte ganz sind
    const lcm = (x: bigint, y: bigint): bigint => {
      const g = (p: bigint, q: bigint): bigint => (q === 0n ? p : g(q, p % q))
      return (x * y) / g(x, y)
    }
    const step0 = lcm(unitSA.d, unitSB.d)
    const j = BigInt(rng.int(1, 3))
    // kleine Lasten mit 10 malnehmen (Newton wie im Alltag)
    const G = Number(step0 * j) * (Number(step0 * j) < 10 ? rng.pick([5, 10]) : 1)
    if (G > 300) continue
    const SA = ratMul(unitSA, rat(G))
    const SB = ratMul(unitSB, rat(G))
    if (ratSign(SA) <= 0 || ratSign(SB) <= 0) continue
    const anchors = [
      { name: 'A', at: A },
      { name: 'B', at: B },
    ]
    const question = knotDrawing(K, anchors, G, `Am Knoten $K$ hängt eine Last mit $F_G = ${G}${N}$; Seile führen zu $A$ und $B$.`)
    const steps: GuidedStep[] = [unitStep(rng, 'richtung-a', 'A', K, A, c1, question)]
    const line2 = (sa: Rational, sb: Rational) => math(`S_A = ${ratLatex(sa)}${N},\\; S_B = ${ratLatex(sb)}${N}`)
    if (both) {
      steps.push(unitStep(rng, 'richtung-b', 'B', K, B, c2))
      // ohne Normierung gelöst: Faktoren vor KA und KB
      const Dn = ratSub(ratMul(u1[0], u2[1]), ratMul(u1[1], u2[0]))
      const naSA = ratMul(ratDiv(ratNeg(u2[0]), Dn), rat(G))
      const naSB = ratMul(ratDiv(u1[0], Dn), rat(G))
      // x und y vertauscht: S_A e_Ay + S_B e_By = 0, S_A e_Ax + S_B e_Bx = G
      const Dw = ratSub(ratMul(e1[1], e2[0]), ratMul(e1[0], e2[1]))
      const wSA = ratMul(ratDiv(ratNeg(e2[1]), Dw), rat(G))
      const wSB = ratMul(ratDiv(e1[1], Dw), rat(G))
      const sys = `S_A ${vecLatex(e1)} + S_B ${vecLatex(e2)} = ${vecLatex(vec(0, G))}`
      steps.push(
        choiceStep(rng, {
          id: 'seilkraefte',
          title: 'Gleichgewicht',
          question: 'Wie groß sind die Seilkräfte $S_A$ und $S_B$?',
          correct: line2(SA, SB),
          wrongs: [
            { content: line2(SB, SA), rule: 'vec-knot-swapped' },
            { content: line2(naSA, naSB), rule: 'vec-knot-not-normalized' },
            { content: line2(wSA, wSB), rule: 'vec-knot-wrong-component' },
          ],
          hint: `Gleichgewicht: $S_A\\,\\vec e_A + S_B\\,\\vec e_B + \\vec F_G = \\vec 0$, getrennt nach $x$ und $y$; aus der $x$-Gleichung eine Kraft durch die andere ausdrücken.`,
          explanation: {
            detailed: `$${sys}$, also $x$: $${ratLatex(e1[0])}\\,S_A + ${factor(ratLatex(e2[0]))}\\,S_B = 0$ und $y$: $${ratLatex(e1[1])}\\,S_A + ${ratLatex(e2[1])}\\,S_B = ${G}$. Daraus $S_A = ${ratLatex(SA)}${N}$ und $S_B = ${ratLatex(SB)}${N}$.`,
            short: `$${sys}$: $S_A = ${ratLatex(SA)}${N}$, $S_B = ${ratLatex(SB)}${N}$.`,
          },
          established: [sys, `S_A = ${ratLatex(SA)}${N}`, `S_B = ${ratLatex(SB)}${N}`],
          cards: [CARD.resultierende],
        }),
      )
    } else {
      const line = (n: string, x: Rational) => math(`${n} = ${ratLatex(x)}${N}`)
      steps.push(
        choiceStep(rng, {
          id: 'seil-a',
          title: 'Gleichgewicht in y-Richtung',
          question: 'Das waagrechte Seil hat keinen Anteil nach oben. Wie groß ist $S_A$?',
          correct: line('S_A', SA),
          wrongs: [
            { content: line('S_A', rat(G * c1, a1)), rule: 'vec-knot-wrong-component' },
            { content: line('S_A', rat(G * b1, c1)), rule: 'vec-force-solve' },
            { content: line('S_A', rat(G)), rule: 'vec-force-whole' },
            { content: line('S_A', rat(G, b1)), rule: 'vec-knot-not-normalized' },
          ],
          hint: '$y$-Richtung: $S_A \\cdot e_{Ay} - F_G = 0$.',
          explanation: { detailed: `$S_A \\cdot \\frac{${b1}}{${c1}} = ${G}$, also $S_A = ${G} \\cdot \\frac{${c1}}{${b1}} = ${ratLatex(SA)}${N}$.`, short: `$S_A = \\frac{F_G}{e_{Ay}} = ${ratLatex(SA)}${N}$.` },
          established: [`S_A = ${ratLatex(SA)}${N}`],
          cards: [CARD.resultierende],
        }),
        choiceStep(rng, {
          id: 'seil-b',
          title: 'Gleichgewicht in x-Richtung',
          question: 'Wie groß ist die Kraft $S_B$ im waagrechten Seil?',
          correct: line('S_B', SB),
          wrongs: [
            { content: line('S_B', ratMul(SA, rat(b1, c1))), rule: 'vec-knot-wrong-component' },
            { content: line('S_B', SA), rule: 'vec-force-whole' },
            { content: line('S_B', ratMul(SA, rat(a1))), rule: 'vec-knot-not-normalized' },
          ],
          hint: '$x$-Richtung: Das waagrechte Seil hebt den waagrechten Anteil von $S_A$ auf.',
          explanation: { detailed: `$S_B = S_A \\cdot \\lvert e_{Ax} \\rvert = ${ratLatex(SA)} \\cdot \\frac{${a1}}{${c1}} = ${ratLatex(SB)}${N}$.`, short: `$S_B = S_A \\lvert e_{Ax} \\rvert = ${ratLatex(SB)}${N}$.` },
          established: [`S_B = ${ratLatex(SB)}${N}`],
          cards: [CARD.resultierende],
        }),
      )
    }
    if (steps.some((s) => s.choices.length < 3)) continue
    const forces = [vecScale(SA, e1), vecScale(SB, e2)]
    return {
      kind: 'knot',
      instruction: `Eine Last mit der Gewichtskraft $F_G$ hängt am Knoten $K$. Zwei Seile halten ihn, eins führt zu $A$, eins zu $B$ (Koordinaten in Metern${both ? '' : '; das Seil zu $B$ ist waagrecht'}). Wie groß sind die Seilkräfte $S_A$ und $S_B$?`,
      functionLatex: `${pointLatex('K', K)},\\; ${pointLatex('A', A)},\\; ${pointLatex('B', B)},\\; F_G = ${G}${N}`,
      steps,
      cards: [CARD.resultierende],
      resultLatex: `S_A = ${ratLatex(SA)}${N},\\; S_B = ${ratLatex(SB)}${N}`,
      resultDrawing: knotDrawing(K, anchors, G, `$S_A = ${ratLatex(SA)}${N}$, $S_B = ${ratLatex(SB)}${N}$; zusammen mit $\\vec F_G$ ergeben sie $\\vec 0$ (Kräfte verkleinert gezeichnet).`, forces),
      form: `knot|${both ? 'two' : 'flat'}|${a1}${b1}|${left ? 'l' : 'r'}|${c2}|${Number(j)}`,
      data: { K: nums(K), A: nums(A), B: nums(B), G: [G] },
      answer: [num(SA), num(SB)],
    }
  }
}

export const FORCE_BUILDERS = {
  forceComponents: buildComponents,
  forcePolar: buildPolar,
  resultant: buildResultant,
  incline: buildIncline,
  work: buildWork,
  torque: buildTorque,
  knot: buildKnot,
} satisfies Readonly<Record<string, (rng: Rng, level: Level) => Built>>
