import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { crossStep, linLatex, normStep, termsLatex } from './crossTasks.ts'
import { dotStep } from './dotTasks.ts'
import { type DrawAngle, type DrawPoint, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { COORDS, at, coordLatex, crossVec, insertLatex, isParallel, normalFormLatex, paramFormLatex, pickDir, pickPoint, planeDirections, primitive } from './lineKit.ts'
import { GL_CARD, type WrongLine, formStep, pointStep, solveStep } from './lineTasks.ts'
import { coordStep, directionsFor, hesseNormal, hesseStep } from './planeTasks.ts'
import { PATCH, footN, insertStep, parallelStep, patch, stack } from './posTasks.ts'
import { type Built, type VectorKind, type Wrong, CARD, choiceStep, connectStep, math, nums, signShape } from './taskKit.ts'
import { type Surd, type Vec, columnLatex, pointLatex, ratFactorLatex, ratLatex, sqrtRat, surdLatex, surdValue, vecAdd, vecDot, vecIsZero, vecLatex, vecNorm2, vecScale, vecSub } from './vec.ts'

// Baustein „Abstände" der Tätigkeit „Geraden und Ebenen" (M7 Schritt 7b): Abstand Punkt–Ebene (Hessesche Normalform bzw.
// Formel mit Betrag; Ebene in Koordinaten-, Normalen- oder Parameterform; mit Parameter zwei Lösungen; Lotfußpunkt und
// Spiegelpunkt über die Lotgerade), Abstand Punkt–Gerade über den Lotfußpunkt (allgemeiner Punkt F_t, Verbindungsvektor
// senkrecht zur Richtung; Spiegelpunkt), parallele und windschiefe Geraden (Kreuzprodukt als Normale), parallele Ebenen
// und Gerade parallel zur Ebene (Punkt der einen in die andere einsetzen).

export const ABSTAND_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['distPointPlane', 'distPointLine', 'distParallel'],
  2: ['distPointPlane', 'distPointLine', 'distLines', 'distParallel'],
  3: ['distPointPlane', 'distPointLine', 'distLines', 'distParallel'],
  4: ['distPointPlane', 'distLines', 'distParallel'],
  5: ['distPointPlane', 'distPointLine', 'distLines'],
}

const show = ratLatex
const fac = ratFactorLatex
const m = ratMul
const num = (r: Rational) => Number(r.n) / Number(r.d)
const nonzero = (rng: Rng, xs: readonly number[] = [-3, -2, -1, 1, 2, 3]) => rat(rng.pick(xs))
const tooBig = (v: Vec, lim = 12) => v.some((x) => Math.abs(num(x)) > lim)
const POINT_NAMES = ['P', 'Q', 'R'] as const
const PLANE_NAMES = ['E', 'F'] as const

// Abstand |s| / √n2 als Zahl mal Wurzel (mit Vorzeichen, wenn signed)
function distOf(s: Rational, n2: Rational, signed = false): Surd {
  const L = sqrtRat(n2)
  return { coef: ratDiv(signed ? s : ratAbs(s), m(L.coef, rat(L.rad))), rad: L.rad }
}

// Klasse eines Abstands für die Form (ganz, Bruch, Wurzel)
const distClass = (x: Surd) => (x.rad === 1n ? (x.coef.d === 1n ? 'int' : 'frac') : x.coef.d === 1n ? 'root' : 'fracroot')

// linke Seite minus rechte Seite: 2x - y + 3z - 6
const minusRhsLatex = (n: Vec, d: Rational) => termsLatex([...n.map((c, i) => [c, COORDS[i]] as const), [ratNeg(d), '']])

// Punkt mit einem Parameter an Stelle j: P(1 \mid a \mid 2)
const paramPointLatex = (name: string, p: Vec, j: number, a: string) => `${name}(${p.map((x, i) => (i === j ? a : show(x))).join(' \\mid ')})`

// ------------------------------------------------------------------ Schritte

// Punkt in n · x − d einsetzen (s = n · P − d)
function insertValueStep(rng: Rng, o: { readonly E: string; readonly n: Vec; readonly d: Rational; readonly P: Vec; readonly pName: string; readonly card: string; readonly drawing?: VectorDrawing }): { readonly step: GuidedStep; readonly s: Rational } {
  const val = vecDot(o.n, o.P)
  const s = ratSub(val, o.d)
  const rot = [o.P[1], o.P[2], o.P[0]]
  const wrongs: Wrong[] = [
    { content: math(show(val)), rule: 'gl-dist-rhs' },
    { content: math(show(ratAdd(val, o.d))), rule: 'gl-move-sign' },
    { content: math(show(ratSub(vecDot(o.n, rot), o.d))), rule: 'gl-insert-swapped' },
  ].filter((w) => w.content !== math(show(s)))
  const calc = `${insertLatex(o.n, o.P)} - ${fac(o.d)} = ${show(s)}`
  const step = choiceStep(rng, {
    id: 'einsetzen',
    title: 'Einsetzen',
    question: `Bring in $${o.E}$ alles auf eine Seite: $${minusRhsLatex(o.n, o.d)}$. Welche Zahl ergibt sich, wenn du $${pointLatex(o.pName, o.P)}$ einsetzt?`,
    correct: math(show(s)),
    wrongs: rng.shuffle(wrongs),
    hint: `Setz die Koordinaten von $${o.pName}$ für $x$, $y$ und $z$ ein und zieh die rechte Seite $${show(o.d)}$ ab.`,
    explanation: { detailed: `Eingesetzt: $${calc}$. Wäre das $0$, läge $${o.pName}$ in $${o.E}$.`, short: `$${calc}$.` },
    established: [calc],
    cards: [o.card],
    ...(o.drawing ? { drawing: o.drawing } : {}),
  })
  return { step, s }
}

// Abstand d = |s| / |n|
function distStep(rng: Rng, o: { readonly s: Rational; readonly n: Vec; readonly nName: string; readonly extra?: readonly Wrong[]; readonly card: string; readonly lead: string }): { readonly step: GuidedStep; readonly d: Surd } {
  const n2 = vecNorm2(o.n)
  const d = distOf(o.s, n2)
  const L = sqrtRat(n2)
  const line = (x: string) => math(`d = ${x}`)
  const wrongs: Wrong[] = []
  if (ratSign(o.s) < 0) wrongs.push({ content: line(surdLatex(distOf(o.s, n2, true))), rule: 'gl-dist-abs' })
  wrongs.push(...(o.extra ?? []))
  if (!ratEq(n2, rat(1))) wrongs.push({ content: line(show(ratAbs(o.s))), rule: 'gl-hesse-not-normed' })
  wrongs.push({ content: line(show(ratDiv(ratAbs(o.s), n2))), rule: 'gl-hesse-square' })
  const formula = `d = \\frac{\\lvert ${show(o.s)} \\rvert}{${surdLatex(L)}} = ${surdLatex(d)}`
  const step = choiceStep(rng, {
    id: 'abstand',
    title: 'Abstand',
    question: 'Wie groß ist der Abstand $d$?',
    correct: line(surdLatex(d)),
    wrongs,
    hint: `${o.lead} Nimm den Betrag (ein Abstand ist nie negativ) und teile durch die Länge $\\lvert ${o.nName} \\rvert = ${surdLatex(L)}$.`,
    explanation: { detailed: `${o.lead} $${formula}$.`, short: `$${formula}$.` },
    established: [`d = ${surdLatex(d)}`],
    cards: [o.card],
  })
  return { step, d }
}

// Abstand aus der Hesseschen Normalform: d = |n0 · P − d0|
function hesseDistStep(rng: Rng, o: { readonly n0: Vec; readonly d0: Rational; readonly P: Vec; readonly pName: string; readonly E: string }): { readonly step: GuidedStep; readonly d: Rational } {
  const val = vecDot(o.n0, o.P)
  const s = ratSub(val, o.d0)
  const line = (x: Rational) => math(`d = ${show(x)}`)
  const wrongs: Wrong[] = []
  if (ratSign(s) < 0) wrongs.push({ content: line(s), rule: 'gl-dist-abs' })
  wrongs.push({ content: line(ratAbs(val)), rule: 'gl-dist-rhs' }, { content: line(ratAbs(ratAdd(val, o.d0))), rule: 'gl-move-sign' })
  const calc = `d = \\left\\lvert ${insertLatex(o.n0, o.P)} - ${fac(o.d0)} \\right\\rvert = \\lvert ${show(s)} \\rvert = ${show(ratAbs(s))}`
  const step = choiceStep(rng, {
    id: 'abstand',
    title: 'Abstand',
    question: `Setz $${pointLatex(o.pName, o.P)}$ in die Hessesche Normalform ein. Wie groß ist der Abstand $d$ von $${o.pName}$ zu $${o.E}$?`,
    correct: line(ratAbs(s)),
    wrongs: wrongs.filter((w) => w.content !== line(ratAbs(s))),
    hint: 'In der Hesseschen Normalform hat der Normalenvektor die Länge $1$: Punkt einsetzen, rechte Seite abziehen, Betrag nehmen. Fertig ist der Abstand.',
    explanation: { detailed: `$${calc}$. Durch die Länge musst du nicht mehr teilen, das hat die Hessesche Normalform schon getan.`, short: `$${calc}$.` },
    established: [`d = ${show(ratAbs(s))}`],
    cards: [GL_CARD.abstandEbene, GL_CARD.hesse],
  })
  return { step, d: ratAbs(s) }
}

// Spiegelpunkt P' = 2F − P (Lotfußpunkt F)
function mirrorStep(rng: Rng, o: { readonly N: string; readonly P: Vec; readonly F: Vec; readonly card: string }): GuidedStep {
  const name = `${o.N}'`
  const PF = vecSub(o.F, o.P)
  const right = vecAdd(o.F, PF)
  const wrongs: Wrong[] = [
    { content: math(pointLatex(name, o.F)), rule: 'gl-mirror-foot' },
    { content: math(pointLatex(name, vecSub(o.P, vecScale(rat(2), PF)))), rule: 'gl-mirror-side' },
    { content: math(pointLatex(name, vecAdd(o.F, o.P))), rule: 'vec-added-points' },
  ]
  const calc = `\\overrightarrow{O${name}} = ${vecLatex(o.P)} + 2 \\cdot ${vecLatex(PF)} = ${vecLatex(right)}`
  return choiceStep(rng, {
    id: 'spiegelpunkt',
    title: 'Spiegelpunkt',
    question: `Welcher Punkt ist der Spiegelpunkt $${name}$?`,
    correct: math(pointLatex(name, right)),
    wrongs,
    hint: `Geh von $${o.N}$ aus zweimal den Weg $\\overrightarrow{${o.N}F}$: einmal bis zum Lotfußpunkt, dann noch einmal genauso weit.`,
    explanation: { detailed: `$\\overrightarrow{${o.N}F} = ${vecLatex(PF)}$, also $${calc}$. $F$ liegt genau in der Mitte zwischen $${o.N}$ und $${name}$.`, short: `$${calc}$.` },
    established: [pointLatex(name, right)],
    cards: [o.card],
  })
}

// Allgemeiner Punkt F_t der Geraden und Verbindungsvektor P → F_t
function genVecStep(rng: Rng, o: { readonly N: string; readonly P: Vec; readonly p: Vec; readonly v: Vec; readonly t: string; readonly g: string }): GuidedStep {
  const col = (base: Vec, slope: Vec) => math(columnLatex(base.map((x, i) => linLatex(x, slope[i], o.t))))
  const base = vecSub(o.p, o.P)
  const right = col(base, o.v)
  const wrongs: Wrong[] = [
    { content: col(vecSub(o.P, o.p), vecScale(rat(-1), o.v)), rule: 'vec-reversed' },
    { content: col(o.p, o.v), rule: 'gl-foot-position' },
    { content: col(vecAdd(o.p, o.P), o.v), rule: 'vec-added-points' },
  ]
  const name = `\\overrightarrow{${o.N}F_${o.t}}`
  return choiceStep(rng, {
    id: 'lotvektor',
    title: 'Verbindungsvektor',
    question: `$F_${o.t}$ ist ein beliebiger Punkt von $${o.g}$ (zum Parameter $${o.t}$). Wie lautet $${name}$?`,
    correct: right,
    wrongs: wrongs.filter((w) => w.content !== right),
    hint: `Spitze minus Fuß: Ortsvektor von $F_${o.t}$ (die Parameterform von $${o.g}$) minus Ortsvektor von $${o.N}$, Zeile für Zeile.`,
    explanation: {
      detailed: `$F_${o.t}$ hat den Ortsvektor $${vecLatex(o.p)} + ${o.t} ${vecLatex(o.v)}$. Davon ziehst du $${vecLatex(o.P)}$ ab: $${name} = ${right.slice(1, -1)}$.`,
      short: `$${name} = ${right.slice(1, -1)}$.`,
    },
    established: [`${name} = ${right.slice(1, -1)}`],
    cards: [GL_CARD.abstandGerade, CARD.verbindung],
  })
}

// Bedingung: Verbindungsvektor senkrecht zur Richtung → Gleichung für t
function footCondStep(rng: Rng, o: { readonly N: string; readonly P: Vec; readonly p: Vec; readonly v: Vec; readonly vName?: string; readonly t: string }): { readonly step: GuidedStep; readonly c0: Rational; readonly c1: Rational } {
  const vn = o.vName ?? '\\vec v'
  const base = vecSub(o.p, o.P)
  const c0 = vecDot(base, o.v)
  const c1 = vecNorm2(o.v)
  const eq = (a: Rational, b: Rational, rhs = '0') => math(`${linLatex(a, b, o.t)} = ${rhs}`)
  const right = eq(c0, c1)
  const wrongs: Wrong[] = []
  const pv = vecDot(o.v, o.p)
  if (!isZero(pv)) wrongs.push({ content: eq(vecDot(base, o.p), pv), rule: 'gl-foot-support' })
  wrongs.push({ content: eq(c0, c1, '1'), rule: 'vec-perp-one' }, { content: eq(ratNeg(c0), c1), rule: 'vec-sign-slip' })
  const name = `\\overrightarrow{${o.N}F_${o.t}}`
  const terms = o.v.map((x, i) => `${fac(x)} \\cdot \\left(${linLatex(base[i], x, o.t)}\\right)`).join(' + ')
  const step = choiceStep(rng, {
    id: 'bedingung',
    title: 'Senkrecht',
    question: `Im Lotfußpunkt steht $${name}$ senkrecht auf dem Richtungsvektor $${vn} = ${vecLatex(o.v)}$. Welche Gleichung für $${o.t}$ entsteht?`,
    correct: right,
    wrongs: wrongs.filter((w) => w.content !== right),
    hint: `Senkrecht heißt: Skalarprodukt gleich $0$. Rechne $${name} \\cdot ${vn}$ Zeile für Zeile aus und fasse zusammen.`,
    explanation: { detailed: `$${name} \\cdot ${vn} = ${terms} = ${right.slice(1, -1)}$.`, short: `${right}.` },
    established: [right.slice(1, -1)],
    cards: [GL_CARD.abstandGerade],
  })
  return { step, c0, c1 }
}

// Länge der Strecke von N nach F (d = |F − P|), falsch auch die Länge des Ortsvektors von F
function footLengthStep(rng: Rng, o: { readonly N: string; readonly P: Vec; readonly F: Vec; readonly card: string }): { readonly step: GuidedStep; readonly d: Surd } {
  const PF = vecSub(o.F, o.P)
  const d = sqrtRat(vecNorm2(PF))
  const line = (x: string) => math(`d = ${x}`)
  const wrongs: Wrong[] = [
    { content: line(surdLatex(sqrtRat(vecNorm2(o.F)))), rule: 'gl-foot-origin' },
    { content: line(show(vecNorm2(PF))), rule: 'vec-length-no-root' },
    { content: line(show(PF.reduce((s, x) => ratAdd(s, ratAbs(x)), rat(0)))), rule: 'vec-length-abs-sum' },
  ]
  const squares = PF.map((x) => (ratSign(x) < 0 ? `(${show(x)})^2` : `${show(x)}^2`)).join(' + ')
  const calc = `d = \\lvert \\overrightarrow{${o.N}F} \\rvert = \\left\\lvert ${vecLatex(PF)} \\right\\rvert = \\sqrt{${squares}} = ${surdLatex(d)}`
  const step = choiceStep(rng, {
    id: 'abstand',
    title: 'Abstand',
    question: `Der Abstand ist die Länge der Strecke von $${o.N}$ zum Lotfußpunkt $F$. Wie groß ist $d$?`,
    correct: line(surdLatex(d)),
    wrongs: wrongs.filter((w) => w.content !== line(surdLatex(d))),
    hint: `Bilde $\\overrightarrow{${o.N}F}$ (Spitze minus Fuß) und berechne seine Länge: Einträge quadrieren, addieren, Wurzel ziehen.`,
    explanation: { detailed: `$${calc}$.`, short: `$${calc}$.` },
    established: [`d = ${surdLatex(d)}`],
    cards: [o.card, CARD.laenge],
  })
  return { step, d }
}

// Lotfußpunkt von P auf die Gerade p + t·v: Verbindungsvektor, Bedingung, t, F, Abstand
function footSteps(rng: Rng, o: { readonly N: string; readonly P: Vec; readonly p: Vec; readonly v: Vec; readonly vName?: string; readonly t: string; readonly g: string; readonly card: string; readonly length: boolean }): { readonly steps: GuidedStep[]; readonly F: Vec; readonly t0: Rational; readonly d: Surd } {
  const gen = genVecStep(rng, o)
  const cond = footCondStep(rng, o)
  const solved = solveStep(rng, {
    id: 'parameter',
    title: 'Parameter',
    question: `Für welches $${o.t}$ ist die Gleichung erfüllt?`,
    t: o.t,
    target: rat(0),
    p: cond.c0,
    v: cond.c1,
    lead: 'Die Gleichung lautet',
    card: GL_CARD.abstandGerade,
  })
  const F = at(o.p, o.v, solved.t)
  const pt = pointStep(rng, { Q: 'F', p: o.p, v: o.v, t: solved.t, tName: o.t, slips: solved.slips, question: 'Welcher Punkt ist der Lotfußpunkt $F$?', card: GL_CARD.abstandGerade })
  const steps = [gen, cond.step, solved.step, pt]
  const len = footLengthStep(rng, { N: o.N, P: o.P, F, card: o.card })
  if (o.length) steps.push(len.step)
  return { steps, F, t0: solved.t, d: len.d }
}

// ------------------------------------------------------------------ Bilder

type Nm = readonly number[]
const subN = (a: Nm, b: Nm) => a.map((x, i) => x - b[i])
const addN = (a: Nm, b: Nm) => a.map((x, i) => x + b[i])
const scaleN = (k: number, a: Nm) => a.map((x) => k * x)
const lenN = (a: Nm) => Math.hypot(...a)

// Lot von X auf einen Punkt Y mit rechtem Winkel (along: Richtung in der Geraden bzw. Ebene)
function lotParts(X: Nm, Y: Nm, along: Nm, label: string, phase: number): { readonly segments: DrawSegment[]; readonly angles: DrawAngle[] } {
  return {
    segments: [{ from: X, to: Y, color: 'r', label, phase }],
    angles: [{ at: Y, u: subN(X, Y), v: along, color: 'r', phase: phase + 1 }],
  }
}

// Ebenenstück um den Lotfußpunkt, so groß, dass das Lot gut zu sehen ist
const patchAround = (center: Nm, n: Vec, lot: number, color: 'c' | 'a' | 'b', phase = 0): DrawPolygon => patch(center, n, Math.max(PATCH, 0.7 * lot), color, phase)

// Punkt und Ebene, mit Lot (Phase 1, rechter Winkel Phase 2), wahlweise Spiegelpunkt (Phase 3)
function pointPlaneFigure(o: { readonly n: Vec; readonly d: Rational; readonly pts: readonly { readonly P: Vec; readonly N: string }[]; readonly lot: boolean; readonly mirror?: Vec; readonly caption: string }): VectorDrawing {
  const feet = o.pts.map((x) => footN(nums(x.P), o.n, o.d))
  const lot = Math.max(...o.pts.map((x, i) => lenN(subN(nums(x.P), feet[i]))))
  const along = nums(planeDirections(o.n)[0])
  const points: DrawPoint[] = o.pts.map((x) => ({ at: nums(x.P), label: x.N, color: 'a' }))
  const segments: DrawSegment[] = []
  const angles: DrawAngle[] = []
  if (o.lot)
    o.pts.forEach((x, i) => {
      const parts = lotParts(nums(x.P), feet[i], along, o.pts.length === 1 ? 'd' : '', 1)
      segments.push(...parts.segments)
      angles.push(...parts.angles)
      points.push({ at: feet[i], label: o.pts.length === 1 ? 'F' : '', color: 'r', phase: 1 })
    })
  if (o.lot && o.mirror) {
    segments.push({ from: feet[0], to: nums(o.mirror), color: 'r', dashed: true, phase: 3 })
    points.push({ at: nums(o.mirror), label: `${o.pts[0].N}'`, color: 'r', phase: 3 })
  }
  return { ...emptyDrawing(3, o.caption), polygons: [patchAround(feet[0], o.n, lot, 'c')], points, segments, angles, ...(o.lot ? { playLabel: 'Lot fällen' } : {}) }
}

// Gerade(n) und Punkt mit Lot auf die erste Gerade
function pointLineFigure(o: { readonly dim: 2 | 3; readonly lines: readonly { readonly name: string; readonly p: Vec; readonly v: Vec; readonly ts: readonly number[]; readonly color: 'a' | 'b' }[]; readonly P: Vec; readonly N: string; readonly F: Vec; readonly lot: boolean; readonly mirror?: Vec; readonly caption: string }): VectorDrawing {
  const segs: DrawSegment[] = o.lines.map((l) => {
    const [pn, vn] = [nums(l.p), nums(l.v)]
    const lo = Math.min(-1, ...l.ts) - 0.6
    const hi = Math.max(1.6, ...l.ts) + 0.6
    return { from: addN(pn, scaleN(lo, vn)), to: addN(pn, scaleN(hi, vn)), color: l.color, label: l.name }
  })
  const points: DrawPoint[] = [{ at: nums(o.P), label: o.N, color: 'a' }]
  const angles: DrawAngle[] = []
  if (o.lot) {
    const parts = lotParts(nums(o.P), nums(o.F), nums(o.lines[0].v), 'd', 1)
    segs.push(...parts.segments)
    angles.push(...parts.angles)
    points.push({ at: nums(o.F), label: 'F', color: 'r', phase: 1 })
    if (o.mirror) {
      segs.push({ from: nums(o.F), to: nums(o.mirror), color: 'r', dashed: true, phase: 3 })
      points.push({ at: nums(o.mirror), label: `${o.N}'`, color: 'r', phase: 3 })
    }
  }
  return { ...emptyDrawing(o.dim, o.caption), segments: segs, points, angles, ...(o.lot ? { playLabel: 'Lot fällen' } : {}) }
}

// ------------------------------------------------------------------ Punkt und Ebene

// Abstand Punkt–Ebene: Stufe 1 Koordinatenform, 2 Normalenform oder Hessesche Normalform, 3 Parameterform, 4 Parameter im
// Punkt (zwei Lösungen), 5 Lotfußpunkt und Spiegelpunkt
function buildPointPlane(rng: Rng, level: Level): Built {
  if (level === 4) return buildPointPlaneParam(rng)
  if (level === 5) return buildMirrorPlane(rng)
  for (;;) {
    const E = rng.pick(PLANE_NAMES)
    const N = rng.pick(POINT_NAMES)
    const variant = level === 1 ? 'coord' : level === 2 ? rng.pick(['normal', 'hesse'] as const) : 'param'
    const P0 = pickPoint(rng, 3, 3)
    let n: Vec
    let len = 0
    let u: Vec = []
    let w: Vec = []
    let raw: Vec = []
    if (variant === 'coord' || variant === 'hesse') ({ n, len } = hesseNormal(rng))
    else if (variant === 'normal') n = pickDir(rng, 3, 3, 1)
    else {
      ;[u, w] = directionsFor(rng, pickDir(rng, 3, 3, 1))
      raw = crossVec(u, w)
      n = primitive(raw)
      if (tooBig(u, 6) || tooBig(w, 6)) continue
    }
    const d = vecDot(n, P0)
    const P = pickPoint(rng, 3, 4)
    const s = ratSub(vecDot(n, P), d)
    if (isZero(s) || Math.abs(num(s)) > 45) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.abstandEbene]
    const before = pointPlaneFigure({ n, d, pts: [{ P, N }], lot: false, caption: `Wie weit ist $${N}$ von $${E}$ entfernt?` })
    let given = stack(coordLatex(E, n, d), pointLatex(N, P))
    if (variant === 'normal') {
      given = stack(normalFormLatex(E, n, P0), pointLatex(N, P))
      const co = coordStep(rng, { name: E, n, p: P0 })
      if (co.choices.length < 4) continue
      steps.push({ ...co, drawing: before })
      cards.push(GL_CARD.koordinaten)
    }
    if (variant === 'param') {
      given = stack(
        paramFormLatex(E, P0, [
          ['r', u],
          ['s', w],
        ]),
        pointLatex(N, P),
      )
      const cs = crossStep(rng, '\\vec u', '\\vec w', u, w)
      const co = coordStep(rng, { name: E, n, p: P0, from: raw })
      if (cs.choices.length < 4 || co.choices.length < 4) continue
      steps.push({ ...cs, question: `Die Richtungen von $${E}$ heißen $\\vec u$ und $\\vec w$. Ein Normalenvektor steht senkrecht auf beiden. Wie lautet $\\vec u \\times \\vec w$?`, drawing: before }, co)
      cards.push(CARD.kreuz, GL_CARD.koordinaten)
    }
    const norm = normStep(rng, '\\lvert \\vec n \\rvert', n, 'laenge', GL_CARD.abstandEbene)
    let dist: Surd
    if (variant === 'hesse') {
      const h = hesseStep(rng, { name: E, n, d, len })
      const hd = hesseDistStep(rng, { n0: h.n0, d0: h.d0, P, pName: N, E })
      steps.push({ ...norm, drawing: before }, h.step, hd.step)
      cards.push(GL_CARD.hesse)
      dist = { coef: hd.d, rad: 1n }
    } else {
      const ins = insertValueStep(rng, { E, n, d, P, pName: N, card: GL_CARD.abstandEbene })
      const ds = distStep(rng, { s: ins.s, n, nName: '\\vec n', card: GL_CARD.abstandEbene, lead: `Abstand $= \\frac{\\lvert \\vec n \\cdot \\vec p - d \\rvert}{\\lvert \\vec n \\rvert}$ (Formel aus der Hesseschen Normalform).` })
      steps.push(variant === 'coord' ? { ...norm, drawing: before } : norm, ins.step, ds.step)
      dist = ds.d
    }
    if (steps.some((st) => st.choices.length < 3)) continue
    const dL = surdLatex(dist)
    return {
      kind: 'distPointPlane',
      instruction: `Wie weit ist der Punkt $${N}$ von der Ebene $${E}$ entfernt?`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: `d = ${dL}`,
      resultDrawing: pointPlaneFigure({ n, d, pts: [{ P, N }], lot: true, caption: `Das Lot von $${N}$ auf $${E}$ trifft im Lotfußpunkt $F$ senkrecht auf; seine Länge ist der Abstand $d = ${dL}$.` }),
      form: `distPointPlane|${variant}|${E}|${N}|${distClass(dist)}|${ratSign(s)}|${signShape(n, P)}`,
      data: { n: nums(n), d: [num(d)], P: nums(P) },
      answer: [surdValue(dist)],
    }
  }
}

// Stufe 4: Punkt mit Parameter a, gegebener Abstand D: |n_j a + c0| / L = D, zwei Lösungen
function buildPointPlaneParam(rng: Rng): Built {
  for (;;) {
    const E = rng.pick(PLANE_NAMES)
    const N = rng.pick(POINT_NAMES)
    const { n, len } = hesseNormal(rng)
    const d = vecDot(n, pickPoint(rng, 3, 3))
    const j = rng.int(0, 2)
    const P = pickPoint(rng, 3, 4).map((x, i) => (i === j ? rat(0) : x))
    const D = rng.int(1, 4)
    const c0 = ratSub(vecDot(n, P), d)
    const c1 = n[j]
    const DL = rat(D * len)
    const sol = (k: Rational) => ratDiv(ratSub(k, c0), c1)
    const [a1, a2] = [sol(ratNeg(DL)), sol(DL)].sort((x, y) => num(x) - num(y))
    if ([a1, a2].some((x) => Math.abs(num(x)) > 25)) continue
    const expr = (b: Rational) => math(linLatex(b, c1, 'a'))
    const restVal = vecDot(n, P)
    const insWrongs: Wrong[] = [
      { content: expr(restVal), rule: 'gl-dist-rhs' },
      { content: expr(ratAdd(restVal, d)), rule: 'gl-move-sign' },
      { content: expr(ratAdd(c0, c1)), rule: 'gl-param-forgotten' },
    ]
    const Pa = paramPointLatex(N, P, j, 'a')
    const ins = choiceStep(rng, {
      id: 'einsetzen',
      title: 'Einsetzen',
      question: `Bring in $${E}$ alles auf eine Seite: $${minusRhsLatex(n, d)}$. Was ergibt sich, wenn du $${Pa}$ einsetzt?`,
      correct: expr(c0),
      wrongs: insWrongs.filter((w) => w.content !== expr(c0)),
      hint: `Setz die Koordinaten von $${N}$ ein (an der Stelle von $${COORDS[j]}$ steht $a$), fasse zusammen und zieh die rechte Seite $${show(d)}$ ab.`,
      explanation: {
        detailed: `Ohne die Zeile mit $a$ ergibt das Einsetzen $${show(restVal)}$, die Zeile mit $${COORDS[j]} = a$ bringt $${termsLatex([[c1, 'a']])}$ dazu, und die rechte Seite $${show(d)}$ wird abgezogen: $${linLatex(c0, c1, 'a')}$.`,
        short: `$${linLatex(c0, c1, 'a')}$.`,
      },
      established: [linLatex(c0, c1, 'a')],
      cards: [GL_CARD.abstandEbene],
    })
    const pair = (x: Rational, y: Rational) => {
      const [lo, hi] = [x, y].sort((p, q) => num(p) - num(q))
      return math(`a_1 = ${show(lo)},\\; a_2 = ${show(hi)}`)
    }
    const right = pair(a1, a2)
    const L2 = rat(D * len * len)
    const eqWrongs: Wrong[] = [
      { content: math(`a = ${show(sol(DL))}`), rule: 'gl-dist-one-case' },
      { content: pair(sol(rat(-D)), sol(rat(D))), rule: 'gl-hesse-not-normed' },
      { content: pair(sol(ratNeg(L2)), sol(L2)), rule: 'gl-hesse-square' },
    ]
    const eq = `\\frac{\\lvert ${linLatex(c0, c1, 'a')} \\rvert}{${len}} = ${D}`
    const solveText = `${linLatex(c0, c1, 'a')} = \\pm ${D * len}`
    const eqStep = choiceStep(rng, {
      id: 'loesungen',
      title: 'Betragsgleichung',
      question: `Für welche $a$ hat $${N}$ von $${E}$ den Abstand $${D}$?`,
      correct: right,
      wrongs: eqWrongs.filter((w) => w.content !== right),
      hint: `Abstand $= \\frac{\\lvert \\ldots \\rvert}{\\lvert \\vec n \\rvert}$. Mal $\\lvert \\vec n \\rvert = ${len}$ nehmen, dann den Betrag auflösen: Der Inhalt ist $+${D * len}$ oder $-${D * len}$.`,
      explanation: { detailed: `$${eq}$, also $${solveText}$. Beide Fälle nach $a$ auflösen: $a = ${show(a1)}$ oder $a = ${show(a2)}$. Auf jeder Seite von $${E}$ liegt ein Punkt.`, short: `$${solveText}$, also $a = ${show(a1)}$ oder $a = ${show(a2)}$.` },
      established: [right.slice(1, -1)],
      cards: [GL_CARD.abstandEbene],
    })
    const norm = normStep(rng, '\\lvert \\vec n \\rvert', n, 'laenge', GL_CARD.abstandEbene)
    // Bild vorher: Ebene und die Punkte P(a) als gestrichelte Gerade (ohne die Lösungen)
    const P0n = nums(P)
    const axisDir = [0, 1, 2].map((i) => (i === j ? 1 : 0))
    const plain = pointPlaneFigure({ n, d, pts: [{ P, N: '' }], lot: false, caption: `Alle Punkte $${Pa}$ liegen auf einer Geraden parallel zur $${COORDS[j]}$-Achse. Welche haben von $${E}$ den Abstand $${D}$?` })
    const before: VectorDrawing = { ...plain, points: [], segments: [{ from: addN(P0n, scaleN(-4, axisDir)), to: addN(P0n, scaleN(4, axisDir)), color: 'a', dashed: true }] }
    const steps = [{ ...norm, drawing: before }, ins, eqStep]
    if (steps.some((st) => st.choices.length < 3)) continue
    const P1 = P.map((x, i) => (i === j ? a1 : x))
    const P2 = P.map((x, i) => (i === j ? a2 : x))
    return {
      kind: 'distPointPlane',
      instruction: `Für welche $a$ hat der Punkt $${Pa}$ von der Ebene $${E}$ den Abstand $${D}$?`,
      functionLatex: coordLatex(E, n, d),
      steps,
      cards: [GL_CARD.abstandEbene],
      resultLatex: `a_1 = ${show(a1)},\\; a_2 = ${show(a2)}`,
      resultDrawing: pointPlaneFigure({
        n,
        d,
        pts: [
          { P: P1, N: `${N}_1` },
          { P: P2, N: `${N}_2` },
        ],
        lot: true,
        caption: `Zwei Punkte haben von $${E}$ den Abstand $${D}$: einer auf jeder Seite.`,
      }),
      form: `distPointPlane|param|${j}|${D}|${E}|${N}|${ratSign(c0)}|${signShape(n, P)}`,
      data: { n: nums(n), d: [num(d)], P: nums(P), j: [j], D: [D] },
      answer: [num(a1), num(a2)],
    }
  }
}

// Stufe 5: Lotgerade, Lotfußpunkt, Spiegelpunkt
function buildMirrorPlane(rng: Rng): Built {
  for (;;) {
    const E = rng.pick(PLANE_NAMES)
    const N = rng.pick(POINT_NAMES)
    const n = pickDir(rng, 3, 3, 1)
    const P0 = pickPoint(rng, 3, 3)
    const d = vecDot(n, P0)
    const [u] = directionsFor(rng, n)
    const F = at(P0, u, nonzero(rng, [-1, 1]))
    const t0 = nonzero(rng, [-2, -1, 1, 2])
    const P = at(F, n, ratNeg(t0))
    const P2 = at(F, n, t0)
    if (tooBig(P) || tooBig(P2, 14) || tooBig(F)) continue
    const t = rng.pick(['t', 'k'])
    const wrongLines: WrongLine[] = [
      { p: n, v: P, rule: 'gl-support-swapped' },
      { p: P, v: P, rule: 'gl-position-direction' },
      { p: P, v: u, rule: 'gl-normal-as-direction' },
    ]
    const lot = formStep(rng, {
      name: 'l',
      p: P,
      v: n,
      t,
      wrongs: wrongLines,
      hint: `Die Lotgerade geht durch $${N}$ und steht senkrecht auf $${E}$: Ihre Richtung ist der Normalenvektor von $${E}$.`,
      why: `Stützpunkt ist $${N}$, Richtung der Normalenvektor $\\vec n = ${vecLatex(n)}$ (die Zahlen vor $x$, $y$ und $z$).`,
    })
    const ins = insertStep(rng, { into: E, from: 'l', n, d, p: P, dirs: [[t, n]], card: GL_CARD.abstandEbene })
    const solved = solveStep(rng, { id: 'parameter', title: 'Parameter', question: `Für welches $${t}$ trifft $l$ die Ebene $${E}$?`, t, target: d, p: ins.c0, v: ins.cs[0], lead: 'Die Gleichung lautet', card: GL_CARD.abstandEbene })
    const pt = pointStep(rng, { Q: 'F', p: P, v: n, t: solved.t, tName: t, slips: solved.slips, question: 'Welcher Punkt ist der Lotfußpunkt $F$?', card: GL_CARD.abstandEbene })
    const mir = mirrorStep(rng, { N, P, F, card: GL_CARD.abstandEbene })
    const before = pointPlaneFigure({ n, d, pts: [{ P, N }], lot: false, caption: `Spiegle $${N}$ an $${E}$.` })
    const steps = [{ ...lot, title: 'Lotgerade', question: `Welche Gerade $l$ geht durch $${N}$ und steht senkrecht auf $${E}$?`, cards: [GL_CARD.abstandEbene], drawing: before }, ins.step, solved.step, pt, mir]
    if (steps.some((st) => st.choices.length < 3)) continue
    return {
      kind: 'distPointPlane',
      instruction: `Spiegle den Punkt $${N}$ an der Ebene $${E}$: Bestimme den Lotfußpunkt $F$ und den Spiegelpunkt $${N}'$.`,
      functionLatex: stack(coordLatex(E, n, d), pointLatex(N, P)),
      steps,
      cards: [GL_CARD.abstandEbene, GL_CARD.gerade],
      resultLatex: `${pointLatex('F', F)},\\; ${pointLatex(`${N}'`, P2)}`,
      resultDrawing: pointPlaneFigure({ n, d, pts: [{ P, N }], lot: true, mirror: P2, caption: `$F$ liegt in $${E}$ genau in der Mitte zwischen $${N}$ und $${N}'$.` }),
      form: `distPointPlane|mirror|${num(t0)}|${t}|${E}|${N}|${signShape(n, P)}`,
      data: { n: nums(n), d: [num(d)], P: nums(P) },
      answer: [...nums(F), ...nums(P2)],
    }
  }
}

// ------------------------------------------------------------------ Punkt und Gerade

// Senkrechter Versatz zu v (ganzzahlig, nicht 0)
function perpOffset(rng: Rng, v: Vec): Vec {
  if (v.length === 2) return vecScale(nonzero(rng, [-2, -1, 1, 2]), [ratNeg(v[1]), v[0]])
  const [a, b] = planeDirections(v)
  for (;;) {
    const r = vecAdd(vecScale(rat(rng.int(-1, 1)), a), vecScale(rat(rng.int(-1, 1)), b))
    if (!vecIsZero(r)) return r
  }
}

// Abstand Punkt–Gerade: Stufe 1 in der Ebene, 2 im Raum, 3 Gerade durch zwei Punkte, 5 Spiegelpunkt
function buildPointLine(rng: Rng, level: Level): Built {
  for (;;) {
    const dim = level === 1 ? 2 : 3
    const via = level === 3
    const mirror = level === 5
    const g = rng.pick(['g', 'h'])
    const t = rng.pick(['t', 's', 'r'])
    const N = rng.pick(['P', 'Q', 'R'].filter((x) => !via || x !== 'R'))
    const p = pickPoint(rng, dim, 3)
    const v = pickDir(rng, dim, 3, dim === 3 ? 1 : 0)
    const t0 = nonzero(rng, [-2, -1, 1, 2])
    const F = at(p, v, t0)
    const P = vecAdd(F, perpOffset(rng, v))
    const P2 = vecSub(vecScale(rat(2), F), P)
    if (tooBig(P, 9) || tooBig(F, 9) || (mirror && tooBig(P2, 14)) || vecIsZero(P)) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.abstandGerade]
    const [A, B] = ['A', 'B']
    const b = vecAdd(p, v)
    const vName = via ? `\\overrightarrow{${A}${B}}` : '\\vec v'
    const lineSpec = { name: g, p, v, ts: [0, num(t0)], color: 'b' as const }
    const before = pointLineFigure({ dim, lines: [lineSpec], P, N, F, lot: false, caption: mirror ? `Spiegle $${N}$ an $${g}$.` : `Wie weit ist $${N}$ von $${g}$ entfernt?` })
    if (via) {
      const c = connectStep(rng, A, B, p, b, before)
      if (c.choices.length < 3) continue
      steps.push(c)
      cards.push(CARD.verbindung)
    }
    const foot = footSteps(rng, { N, P, p, v, vName, t, g, card: GL_CARD.abstandGerade, length: !mirror })
    steps.push(...foot.steps)
    if (!via) steps[0] = { ...steps[0], drawing: before }
    if (mirror) steps.push(mirrorStep(rng, { N, P, F, card: GL_CARD.abstandGerade }))
    if (steps.some((st) => st.choices.length < 3)) continue
    const dL = surdLatex(foot.d)
    const given = via ? stack(`${pointLatex(A, p)},\\; ${pointLatex(B, b)}`, pointLatex(N, P)) : stack(paramFormLatex(g, p, [[t, v]]), pointLatex(N, P))
    const intro = via ? `Die Gerade $${g}$ geht durch $${A}$ und $${B}$. ` : ''
    const shape = `${dim}|${t}|${g}|${N}|${num(t0)}|${signShape(p, v, P)}`
    if (mirror)
      return {
        kind: 'distPointLine',
        instruction: `Spiegle den Punkt $${N}$ an der Geraden $${g}$: Bestimme den Lotfußpunkt $F$ und den Spiegelpunkt $${N}'$.`,
        functionLatex: given,
        steps,
        cards,
        resultLatex: `${pointLatex('F', F)},\\; ${pointLatex(`${N}'`, P2)}`,
        resultDrawing: pointLineFigure({ dim, lines: [lineSpec], P, N, F, lot: true, mirror: P2, caption: `$F$ liegt auf $${g}$ genau in der Mitte zwischen $${N}$ und $${N}'$.` }),
        form: `distPointLine|mirror|${shape}`,
        data: { p: nums(p), v: nums(v), P: nums(P) },
        answer: [...nums(F), ...nums(P2)],
      }
    return {
      kind: 'distPointLine',
      instruction: `${intro}Bestimme den Lotfußpunkt $F$ von $${N}$ auf $${g}$ und den Abstand $d$ von $${N}$ zu $${g}$.`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: `${pointLatex('F', F)},\\; d = ${dL}`,
      resultDrawing: pointLineFigure({ dim, lines: [lineSpec], P, N, F, lot: true, caption: `Das Lot von $${N}$ auf $${g}$ trifft in $F$ senkrecht auf; der Abstand ist $d = ${dL}$.` }),
      form: `distPointLine|${via ? 'pts' : 'form'}|${distClass(foot.d)}|${shape}`,
      data: { p: nums(p), v: nums(v), P: nums(P) },
      answer: [...nums(F), surdValue(foot.d)],
    }
  }
}

// ------------------------------------------------------------------ Zwei Geraden

// Gerade als Strecke durchs Bild (alle wichtigen Parameterwerte darauf)
function lineSegOf(P: Vec, dir: Vec, ts: readonly number[], color: 'a' | 'b', name: string): DrawSegment {
  const lo = Math.min(-1, ...ts) - 0.6
  const hi = Math.max(1.6, ...ts) + 0.6
  return { from: addN(nums(P), scaleN(lo, nums(dir))), to: addN(nums(P), scaleN(hi, nums(dir))), color, label: name }
}

// Nächste Punkte zweier nicht paralleler Geraden (als Zahlen, nur fürs Bild)
function closest(p: Nm, v: Nm, q: Nm, w: Nm): { readonly t: number; readonly s: number } {
  const dot = (a: Nm, b: Nm) => a.reduce((x, y, i) => x + y * b[i], 0)
  const r = subN(q, p)
  const [a, b, c] = [dot(v, v), dot(v, w), dot(w, w)]
  const [e, f] = [dot(r, v), dot(r, w)]
  const det = a * c - b * b
  return { t: (e * c - b * f) / det, s: (b * e - a * f) / det }
}

// Parallele Geraden (Stufe 2, 3) und windschiefe (Stufe 3; 4 mit g durch zwei Punkte; 5 beide durch zwei Punkte, erst
// prüfen, dass sie nicht parallel sind)
function buildLines(rng: Rng, level: Level): Built {
  for (;;) {
    const par = level === 2 || (level === 3 && rng.chance(0.5))
    const [g, h] = rng.pick([
      ['g', 'h'],
      ['g_1', 'g_2'],
    ] as const)
    const [t, s] = rng.pick([
      ['t', 's'],
      ['r', 's'],
      ['\\lambda', '\\mu'],
    ] as const)
    const steps: GuidedStep[] = []
    const cards: string[] = []
    if (par) {
      const p = pickPoint(rng, 3, 3)
      const v = pickDir(rng, 3, 3, 1)
      const t0 = nonzero(rng, [-2, -1, 1, 2])
      const F = at(p, v, t0)
      const q = vecAdd(F, perpOffset(rng, v))
      const w = vecScale(nonzero(rng, [-2, -1, 2, 3]), v)
      if (tooBig(q, 9) || tooBig(F, 9) || tooBig(w, 9)) continue
      const lines = [
        { name: g, p, v, ts: [0, num(t0)], color: 'a' as const },
        { name: h, p: q, v: w, ts: [0], color: 'b' as const },
      ]
      const before = pointLineFigure({ dim: 3, lines, P: q, N: 'Q', F, lot: false, caption: `Wie weit sind $${g}$ und $${h}$ voneinander entfernt?` })
      const pa = parallelStep(rng, { vn: '\\vec v', wn: '\\vec w', v, w, what: 'Richtungsvektoren', card: GL_CARD.abstandGerade })
      const foot = footSteps(rng, { N: 'Q', P: q, p, v, t, g, card: GL_CARD.abstandGerade, length: true })
      const first = foot.steps[0]
      steps.push({ ...pa, drawing: before }, { ...first, question: `Nimm den Stützpunkt $${pointLatex('Q', q)}$ von $${h}$. ${first.question}` }, ...foot.steps.slice(1))
      cards.push(GL_CARD.abstandGerade)
      if (steps.some((st) => st.choices.length < 3)) continue
      const dL = surdLatex(foot.d)
      return {
        kind: 'distLines',
        instruction: `Die Geraden $${g}$ und $${h}$ sind parallel. Wie weit sind sie voneinander entfernt?`,
        functionLatex: stack(paramFormLatex(g, p, [[t, v]]), paramFormLatex(h, q, [[s, w]])),
        steps,
        cards,
        resultLatex: `d = ${dL}`,
        resultDrawing: pointLineFigure({ dim: 3, lines, P: q, N: 'Q', F, lot: true, caption: `Jeder Punkt von $${h}$ hat von $${g}$ denselben Abstand $d = ${dL}$; hier gemessen vom Stützpunkt $Q$.` }),
        form: `distLines|par|${level}|${t}|${g}|${distClass(foot.d)}|${signShape(p, v, q)}`,
        data: { p: nums(p), v: nums(v), q: nums(q), w: nums(w) },
        answer: [surdValue(foot.d)],
      }
    }
    // windschief
    const viaG = level >= 4
    const viaH = level === 5
    const v = pickDir(rng, 3, 3, 1)
    const w = pickDir(rng, 3, 3, 1)
    if (isParallel(v, w)) continue
    const n = crossVec(v, w)
    if (tooBig(n, 10)) continue
    const p = pickPoint(rng, 3, 3)
    const q = pickPoint(rng, 3, 3)
    const pq = vecSub(q, p)
    const sv = vecDot(pq, n)
    if (isZero(sv) || vecIsZero(pq)) continue
    const [A, B, C, D] = ['A', 'B', 'C', 'D']
    const [Pn, Qn] = [viaG ? A : 'P', viaH ? C : 'Q']
    const vn = viaG ? `\\overrightarrow{${A}${B}}` : '\\vec v'
    const wn = viaH ? `\\overrightarrow{${C}${D}}` : '\\vec w'
    if (viaG) {
      const c = connectStep(rng, A, B, p, vecAdd(p, v))
      if (c.choices.length < 3) continue
      steps.push(c)
      cards.push(CARD.verbindung)
    }
    if (viaH) {
      const c = { ...connectStep(rng, C, D, q, vecAdd(q, w)), id: 'verbindung-2' }
      if (c.choices.length < 3) continue
      steps.push(c, parallelStep(rng, { vn, wn, v, w, what: 'Richtungsvektoren', card: GL_CARD.windschief }))
    }
    const cs = crossStep(rng, vn, wn, v, w)
    steps.push({ ...cs, question: `Ein Vektor $\\vec n$, der auf beiden Richtungen senkrecht steht, ist das Kreuzprodukt. Wie lautet $${vn} \\times ${wn}$?` })
    const pqStep = { ...connectStep(rng, Pn, Qn, p, q), id: 'verbindung-3', question: `Wie lautet der Vektor $\\overrightarrow{${Pn}${Qn}}$ zwischen den Stützpunkten?` }
    const ds = dotStep(rng, `\\overrightarrow{${Pn}${Qn}}`, '\\vec n', pq, n)
    const norm = normStep(rng, '\\lvert \\vec n \\rvert', n, 'laenge', GL_CARD.windschief)
    const dist = distStep(rng, {
      s: sv,
      n,
      nName: '\\vec n',
      extra: [{ content: math(`d = ${surdLatex(sqrtRat(vecNorm2(pq)))}`), rule: 'gl-skew-points' }],
      card: GL_CARD.windschief,
      lead: `Abstand $= \\frac{\\lvert \\overrightarrow{${Pn}${Qn}} \\cdot \\vec n \\rvert}{\\lvert \\vec n \\rvert}$: der Anteil von $\\overrightarrow{${Pn}${Qn}}$ in Richtung von $\\vec n$.`,
    })
    steps.push(pqStep, ds, norm, dist.step)
    const cl0 = closest(nums(p), nums(v), nums(q), nums(w))
    const plain: VectorDrawing = {
      ...emptyDrawing(3, `Wie weit sind $${g}$ und $${h}$ voneinander entfernt?`),
      segments: [lineSegOf(p, v, [0, cl0.t], 'a', g), lineSegOf(q, w, [0, cl0.s], 'b', h)],
      points: [
        { at: nums(p), label: Pn, color: 'a' },
        { at: nums(q), label: Qn, color: 'b' },
      ],
    }
    steps[0] = { ...steps[0], drawing: plain }
    cards.push(GL_CARD.windschief, CARD.kreuz)
    if (steps.some((st) => st.choices.length < 3)) continue
    const cl = closest(nums(p), nums(v), nums(q), nums(w))
    const X = addN(nums(p), scaleN(cl.t, nums(v)))
    const Y = addN(nums(q), scaleN(cl.s, nums(w)))
    const dL = surdLatex(dist.d)
    const drawing: VectorDrawing = {
      ...emptyDrawing(3, `Die kürzeste Verbindung steht auf beiden Geraden senkrecht; ihre Länge ist der Abstand $d = ${dL}$.`),
      segments: [lineSegOf(p, v, [0, cl.t], 'a', g), lineSegOf(q, w, [0, cl.s], 'b', h), { from: X, to: Y, color: 'r', label: 'd', phase: 1 }],
      points: [
        { at: nums(p), label: Pn, color: 'a' },
        { at: nums(q), label: Qn, color: 'b' },
      ],
      angles: [
        { at: X, u: subN(Y, X), v: nums(v), color: 'r', phase: 2 },
        { at: Y, u: subN(X, Y), v: nums(w), color: 'r', phase: 2 },
      ],
      playLabel: 'Lot fällen',
    }
    const gGiven = viaG ? `${pointLatex(A, p)},\\; ${pointLatex(B, vecAdd(p, v))}` : paramFormLatex(g, p, [[t, v]])
    const hGiven = viaH ? `${pointLatex(C, q)},\\; ${pointLatex(D, vecAdd(q, w))}` : paramFormLatex(h, q, [[s, w]])
    const intro = viaH ? `$${g}$ geht durch $${A}$ und $${B}$, $${h}$ durch $${C}$ und $${D}$. ` : viaG ? `$${g}$ geht durch $${A}$ und $${B}$. ` : ''
    return {
      kind: 'distLines',
      instruction: `${intro}Die Geraden $${g}$ und $${h}$ sind windschief. Wie weit sind sie voneinander entfernt?`,
      functionLatex: stack(gGiven, hGiven),
      steps,
      cards,
      resultLatex: `d = ${dL}`,
      resultDrawing: drawing,
      form: `distLines|skew|${level}|${t}|${g}|${distClass(dist.d)}|${ratSign(sv)}|${signShape(p, v, q, w)}`,
      data: { p: nums(p), v: nums(v), q: nums(q), w: nums(w) },
      answer: [surdValue(dist.d)],
    }
  }
}

// ------------------------------------------------------------------ Parallele Ebenen, Gerade parallel zur Ebene

// Stufe 1 parallele Ebenen mit gleichem Normalenvektor, 2 mit Vielfachem, 3 Gerade parallel zur Ebene, 4 dazu Ebene in
// Normalenform
function buildParallel(rng: Rng, level: Level): Built {
  for (;;) {
    const [E, F] = rng.pick([
      ['E', 'F'],
      ['E_1', 'E_2'],
    ] as const)
    if (level <= 2) {
      const n = level === 1 ? hesseNormal(rng).n : pickDir(rng, 3, 3, 1)
      const d = vecDot(n, pickPoint(rng, 3, 3))
      const k = level === 1 ? rat(1) : nonzero(rng, [-2, -1, 2, 3])
      const mv = vecScale(k, n)
      const e = m(k, ratAdd(d, nonzero(rng, [-12, -9, -6, -5, -3, 3, 5, 6, 9, 12])))
      if (isZero(e)) continue
      // Punkt Q von F auf einer Achse (zwei Koordinaten 0): am liebsten mit ganzer Zahl
      const idx = [0, 1, 2].filter((i) => !isZero(mv[i]))
      const ints = idx.filter((i) => ratDiv(e, mv[i]).d === 1n)
      const i = ints.length ? rng.pick(ints) : rng.pick(idx)
      const Q = [0, 1, 2].map((x) => (x === i ? ratDiv(e, mv[i]) : rat(0)))
      const on = (val: Rational) => math(pointLatex('Q', [0, 1, 2].map((x) => (x === i ? val : rat(0)))))
      const others = [0, 1, 2].filter((x) => x !== i)
      const qWrongs: Wrong[] = [
        { content: on(ratDiv(mv[i], e)), rule: 'gl-trace-flipped' },
        { content: on(e), rule: 'gl-trace-no-divide' },
        { content: on(ratNeg(ratDiv(e, mv[i]))), rule: 'gl-trace-sign' },
      ]
      const qStep = choiceStep(rng, {
        id: 'punkt',
        title: `Punkt von $${F}$`,
        question: `Nimm einen Punkt $Q$ von $${F}$: Setz $${COORDS[others[0]]} = 0$ und $${COORDS[others[1]]} = 0$. Welcher Punkt entsteht?`,
        correct: on(ratDiv(e, mv[i])),
        wrongs: qWrongs.filter((w) => w.content !== on(ratDiv(e, mv[i]))),
        hint: `Mit $${COORDS[others[0]]} = ${COORDS[others[1]]} = 0$ bleibt $${termsLatex([[mv[i], COORDS[i]]])} = ${show(e)}$. Nach $${COORDS[i]}$ auflösen.`,
        explanation: { detailed: `$${termsLatex([[mv[i], COORDS[i]]])} = ${show(e)}$, also $${COORDS[i]} = ${show(ratDiv(e, mv[i]))}$ und $${pointLatex('Q', Q)}$.`, short: `$${pointLatex('Q', Q)}$.` },
        established: [pointLatex('Q', Q)],
        cards: [GL_CARD.abstandEbene],
      })
      const before = pointPlaneFigure({ n, d, pts: [{ P: Q, N: 'Q' }], lot: false, caption: `Wie weit sind $${E}$ und $${F}$ voneinander entfernt?` })
      const ins = insertValueStep(rng, { E, n, d, P: Q, pName: 'Q', card: GL_CARD.abstandEbene })
      const extra: Wrong[] = ratEq(k, rat(1)) ? [] : [{ content: math(`d = ${surdLatex(distOf(ratSub(e, d), vecNorm2(n)))}`), rule: 'gl-planes-not-scaled' }]
      const ds = distStep(rng, { s: ins.s, n, nName: '\\vec n', extra, card: GL_CARD.abstandEbene, lead: `Der Abstand der Ebenen ist der Abstand von $Q$ zu $${E}$: $\\frac{\\lvert \\vec n \\cdot \\vec q - d \\rvert}{\\lvert \\vec n \\rvert}$.` })
      const norm = normStep(rng, '\\lvert \\vec n \\rvert', n, 'laenge', GL_CARD.abstandEbene)
      const steps: GuidedStep[] = []
      if (level === 2) steps.push({ ...parallelStep(rng, { vn: '\\vec n', wn: '\\vec m', v: n, w: mv, what: 'Normalenvektoren', card: GL_CARD.abstandEbene }), drawing: before })
      steps.push(level === 1 ? { ...qStep, drawing: before } : qStep, norm, ins.step, ds.step)
      if (steps.some((st) => st.choices.length < 3)) continue
      const dL = surdLatex(ds.d)
      const two = pointPlaneFigure({ n, d, pts: [{ P: Q, N: 'Q' }], lot: true, caption: `Jeder Punkt von $${F}$ hat von $${E}$ denselben Abstand $d = ${dL}$.` })
      const Fpatch = patch(nums(Q), n, PATCH, 'b', 0)
      return {
        kind: 'distParallel',
        instruction: `Die Ebenen $${E}$ und $${F}$ sind parallel. Wie weit sind sie voneinander entfernt?`,
        functionLatex: stack(coordLatex(E, n, d), coordLatex(F, mv, e)),
        steps,
        cards: [GL_CARD.abstandEbene],
        resultLatex: `d = ${dL}`,
        resultDrawing: { ...two, polygons: [...two.polygons, Fpatch] },
        form: `distParallel|planes|${num(k)}|${i}|${E}|${distClass(ds.d)}|${signShape(n)}|${ratSign(ins.s)}`,
        data: { n: nums(n), d: [num(d)], m: nums(mv), e: [num(e)] },
        answer: [surdValue(ds.d)],
      }
    }
    // Gerade parallel zur Ebene
    const g = rng.pick(['g', 'h'])
    const t = rng.pick(['t', 's'])
    const n = pickDir(rng, 3, 3, 1)
    const P0 = pickPoint(rng, 3, 3)
    const d = vecDot(n, P0)
    const [v, d2] = directionsFor(rng, n)
    let p = at(P0, d2, nonzero(rng, [-1, 1]))
    const j = rng.pick([0, 1, 2].filter((x) => !isZero(n[x])))
    p = p.map((x, i) => (i === j ? ratAdd(x, nonzero(rng, [-3, -2, -1, 1, 2, 3])) : x))
    if (tooBig(p, 9) || tooBig(v, 6) || vecIsZero(p)) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.abstandEbene]
    const before = pointPlaneFigure({ n, d, pts: [{ P: p, N: 'P' }], lot: false, caption: `Wie weit ist $${g}$ von $${E}$ entfernt?` })
    let plane = coordLatex(E, n, d)
    if (level === 4) {
      plane = normalFormLatex(E, n, P0)
      const co = coordStep(rng, { name: E, n, p: P0 })
      if (co.choices.length < 4) continue
      steps.push({ ...co, drawing: before })
      cards.push(GL_CARD.koordinaten)
    }
    const dt = dotStep(rng, '\\vec n', '\\vec v', n, v)
    steps.push({ ...dt, question: `Prüfe zuerst, dass $${g}$ parallel zu $${E}$ ist: Wie groß ist $\\vec n \\cdot \\vec v$?`, cards: [GL_CARD.abstandEbene, CARD.skalar], ...(level === 3 ? { drawing: before } : {}) })
    const norm = normStep(rng, '\\lvert \\vec n \\rvert', n, 'laenge', GL_CARD.abstandEbene)
    const ins = insertValueStep(rng, { E, n, d, P: p, pName: 'P', card: GL_CARD.abstandEbene })
    const ds = distStep(rng, { s: ins.s, n, nName: '\\vec n', card: GL_CARD.abstandEbene, lead: `$\\vec n \\cdot \\vec v = 0$: $${g}$ ist parallel zu $${E}$, jeder Punkt von $${g}$ hat denselben Abstand. Nimm den Stützpunkt $P$: $\\frac{\\lvert \\vec n \\cdot \\vec p - d \\rvert}{\\lvert \\vec n \\rvert}$.` })
    steps.push(norm, ins.step, ds.step)
    if (steps.some((st) => st.choices.length < 3)) continue
    const dL = surdLatex(ds.d)
    const fig = pointPlaneFigure({ n, d, pts: [{ P: p, N: 'P' }], lot: true, caption: `$${g}$ läuft parallel zu $${E}$ im Abstand $d = ${dL}$.` })
    const pn = nums(p)
    const vn2 = nums(v)
    return {
      kind: 'distParallel',
      instruction: `Zeige, dass $${g}$ parallel zu $${E}$ ist, und bestimme den Abstand.`,
      functionLatex: stack(plane, paramFormLatex(g, p, [[t, v]])),
      steps,
      cards,
      resultLatex: `d = ${dL}`,
      resultDrawing: { ...fig, segments: [{ from: addN(pn, scaleN(-1.6, vn2)), to: addN(pn, scaleN(1.6, vn2)), color: 'b', label: g }, ...fig.segments] },
      form: `distParallel|line|${level}|${t}|${g}|${E}|${distClass(ds.d)}|${ratSign(ins.s)}|${signShape(n, p, v)}`,
      data: { n: nums(n), d: [num(d)], p: nums(p), v: nums(v) },
      answer: [surdValue(ds.d)],
    }
  }
}

export const ABSTAND_BUILDERS = {
  distPointPlane: buildPointPlane,
  distPointLine: buildPointLine,
  distLines: buildLines,
  distParallel: buildParallel,
} as const satisfies Partial<Record<VectorKind, (rng: Rng, level: Level) => Built>>
