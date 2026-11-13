import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratDiv, ratEq, ratMul, ratNeg, ratSign } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { crossStep, termsLatex, withParamLatex } from './crossTasks.ts'
import { anglePairs, cosSurd, dotStep, lengthsStep } from './dotTasks.ts'
import { type DrawAngle, type DrawPoint, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { COORDS, at, coordLatex, crossVec, isParallel, normalFormLatex, paramFormLatex, pickDir, pickPoint, planeDirections } from './lineKit.ts'
import { GL_CARD, solveStep } from './lineTasks.ts'
import { directionsFor, threePoints } from './planeTasks.ts'
import { PATCH, patch, stack } from './posTasks.ts'
import { type Built, type VectorKind, type Wrong, CARD, choiceStep, connectStep, math, nums, signShape } from './taskKit.ts'
import { type Surd, type Vec, pointLatex, ratFactorLatex, ratLatex, surdLatex, surdValue, vec, vecAdd, vecDot, vecIsZero, vecLatex, vecNorm2, vecScale } from './vec.ts'

// Baustein „Schnittwinkel" der Tätigkeit „Geraden und Ebenen" (M7 Schritt 7b): Winkel zwischen zwei Geraden (Richtungen,
// cos mit Betrag), zwischen Gerade und Ebene (Richtung und Normale, sin mit Betrag) und zwischen zwei Ebenen (Normalen,
// cos mit Betrag). Besondere Winkel in Grad, sonst cos bzw. sin exakt; Stufe 4 Parameter so, dass die Geraden, Gerade und
// Ebene oder die Ebenen senkrecht stehen; Stufe 5 aus Punkten.

export const WINKEL_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['angleLines', 'angleLinePlane', 'anglePlanes'],
  2: ['angleLines', 'angleLinePlane', 'anglePlanes'],
  3: ['angleLines', 'angleLinePlane', 'anglePlanes'],
  4: ['angleLines', 'angleLinePlane', 'anglePlanes'],
  5: ['angleLines', 'angleLinePlane', 'anglePlanes'],
}

type Mode = 'lines' | 'linePlane' | 'planes'

const show = ratLatex
const fac = ratFactorLatex
const num = (r: Rational) => Number(r.n) / Number(r.d)
const nonzero = (rng: Rng, xs: readonly number[] = [-2, -1, 1, 2]) => rat(rng.pick(xs))
const tooBig = (v: Vec, lim = 12) => v.some((x) => Math.abs(num(x)) > lim)
const deg = (phi: number) => `${phi}^\\circ`
const decimal1 = (x: number) => x.toFixed(1).replace('.', '{,}')
const SWAP: Readonly<Record<number, number>> = { 30: 45, 45: 60, 60: 45 }
// zweite Verwechslung der Tabelle (Gerade und Ebene, wo 180° − φ kein typischer Fehler ist)
const SWAP2: Readonly<Record<number, number>> = { 30: 60, 45: 30, 60: 30 }

// Besonderes Paar mit dem Winkel alpha zwischen den Vektoren (in der Ebene nur 45° und 135°)
function specialPair(rng: Rng, dim: 2 | 3, mode: Mode): { readonly a: Vec; readonly b: Vec; readonly phi: number } {
  const alpha = rng.pick(dim === 2 ? [45, 135] : [30, 45, 60, 120, 135, 150])
  const [a, b] = rng.pick(anglePairs(dim).get(alpha)!)
  const phi = mode === 'linePlane' ? Math.abs(90 - alpha) : alpha > 90 ? 180 - alpha : alpha
  return { a: vec(...a), b: vec(...b), phi }
}

// cos² bzw. sin² kein besonderer Wert (dann ist das Ergebnis der Wert der Winkelfunktion)
function isGeneral(a: Vec, b: Vec): boolean {
  const d = vecDot(a, b)
  const p = ratMul(vecNorm2(a), vecNorm2(b))
  if (isZero(d) || p.n > 180n) return false
  const c2 = ratDiv(ratMul(d, d), p)
  return ![rat(1, 4), rat(1, 2), rat(3, 4), rat(1)].some((x) => ratEq(x, c2))
}

const fnOf = (mode: Mode) => (mode === 'linePlane' ? '\\sin' : '\\cos')

// ------------------------------------------------------------------ Schritte

// Welche Formel? (Richtungen bzw. Normalen, Betrag, cos oder sin)
function formulaStep(rng: Rng, o: { readonly mode: Mode; readonly an: string; readonly bn: string; readonly paramPlane: boolean; readonly uName?: string; readonly drawing?: VectorDrawing }): GuidedStep {
  const fn = fnOf(o.mode)
  const f = (fun: string, a: string, b: string, abs = true) =>
    math(`${fun}\\varphi = \\frac{${abs ? '\\lvert ' : ''}${a} \\cdot ${b}${abs ? ' \\rvert' : ''}}{\\lvert ${a} \\rvert \\, \\lvert ${b} \\rvert}`)
  const right = f(fn, o.an, o.bn)
  const wrongs: Wrong[] = [{ content: f(fn, o.an, o.bn, false), rule: 'gl-angle-abs' }]
  if (o.mode === 'linePlane') {
    wrongs.push({ content: f('\\cos', o.an, o.bn), rule: 'gl-angle-plane-cos' })
    wrongs.push(o.paramPlane ? { content: f('\\sin', o.an, o.uName ?? '\\vec u'), rule: 'gl-angle-plane-dirs' } : { content: f('\\sin', o.an, '\\vec p'), rule: 'gl-angle-support' })
  } else {
    wrongs.push({ content: f('\\sin', o.an, o.bn), rule: 'vec-angle-arcsin' })
    if (o.mode === 'lines') wrongs.push({ content: f('\\cos', '\\vec p', '\\vec q'), rule: 'gl-angle-support' })
    else if (o.paramPlane) wrongs.push({ content: f('\\cos', '\\vec u', o.bn), rule: 'gl-angle-plane-dirs' })
  }
  const what = {
    lines: `Der Schnittwinkel zweier Geraden ist der Winkel zwischen ihren Richtungsvektoren $${o.an}$ und $${o.bn}$, und zwar der spitze (höchstens $90^\\circ$): deshalb der Betrag.`,
    linePlane: `Gerechnet wird mit dem Richtungsvektor $${o.an}$ und dem Normalenvektor $${o.bn}$. Der Winkel zur Normalen ergänzt den gesuchten Winkel zu $90^\\circ$, deshalb $\\sin$ statt $\\cos$; der Betrag macht den Winkel spitz.`,
    planes: `Der Winkel zwischen zwei Ebenen ist der Winkel zwischen ihren Normalenvektoren $${o.an}$ und $${o.bn}$, und zwar der spitze (höchstens $90^\\circ$): deshalb der Betrag.`,
  }[o.mode]
  return choiceStep(rng, {
    id: 'formel',
    title: 'Formel',
    question: 'Mit welcher Formel berechnest du den Schnittwinkel $\\varphi$?',
    correct: right,
    wrongs,
    hint: o.mode === 'linePlane' ? 'Richtung der Geraden und Normale der Ebene; der Winkel zur Normalen ist $90^\\circ - \\varphi$.' : o.mode === 'lines' ? 'Es zählt nur, wohin die Geraden laufen. Schnittwinkel sind nie stumpf.' : 'Ebenen vergleichst du über ihre Normalen. Schnittwinkel sind nie stumpf.',
    explanation: { detailed: `${what} Also $${right.slice(1, -1)}$.`, short: right },
    cards: [GL_CARD.schnittwinkel],
    ...(o.drawing ? { drawing: o.drawing } : {}),
  })
}

// Wert von cos φ bzw. sin φ mit Betrag
function valueStep(rng: Rng, o: { readonly mode: Mode; readonly an: string; readonly bn: string; readonly a: Vec; readonly b: Vec; readonly general: boolean }): { readonly step: GuidedStep; readonly value: Surd } {
  const fn = fnOf(o.mode)
  const d = vecDot(o.a, o.b)
  const [n2a, n2b] = [vecNorm2(o.a), vecNorm2(o.b)]
  const value = cosSurd(ratAbs(d), ratMul(n2a, n2b))
  const line = (x: string) => math(`${fn}\\varphi = ${x}`)
  const wrongs: Wrong[] = []
  if (ratSign(d) < 0) wrongs.push({ content: line(surdLatex(cosSurd(d, ratMul(n2a, n2b)))), rule: 'gl-angle-abs' })
  wrongs.push({ content: line(show(ratDiv(ratAbs(d), ratMul(n2a, n2b)))), rule: 'vec-cos-squared' })
  wrongs.push({ content: line(surdLatex(cosSurd(ratAbs(d), n2a))), rule: 'vec-cos-one-length' }, { content: line(surdLatex(cosSurd(ratAbs(d), n2b))), rule: 'vec-cos-one-length' })
  const la = surdLatex(cosSurd(n2a, n2a))
  const lb = surdLatex(cosSurd(n2b, n2b))
  const formula = `${fn}\\varphi = \\frac{\\lvert ${show(d)} \\rvert}{${la} \\cdot ${lb}} = ${surdLatex(value)}`
  const approx = o.general ? ` Mit dem Taschenrechner: $\\varphi = \\arc${fn.slice(1)}\\left(${surdLatex(value)}\\right) \\approx ${decimal1(angleOf(o.mode, surdValue(value)))}^\\circ$.` : ''
  const step = choiceStep(rng, {
    id: 'wert',
    title: o.mode === 'linePlane' ? 'Sinus' : 'Kosinus',
    question: `Wie groß ist $${fn}\\varphi$?`,
    correct: line(surdLatex(value)),
    wrongs,
    hint: `Betrag des Skalarprodukts durch das Produkt der beiden Längen, dann vereinfachen.`,
    explanation: { detailed: `$${formula}$.${approx}`, short: `$${formula}$.` },
    established: [formula],
    cards: [GL_CARD.schnittwinkel, CARD.winkel],
  })
  return { step, value }
}

// Grad aus cos bzw. sin
const angleOf = (mode: Mode, x: number) => ((mode === 'linePlane' ? Math.asin(x) : Math.acos(x)) * 180) / Math.PI

// Winkel aus der Tabelle der besonderen Werte
function degreeStep(rng: Rng, o: { readonly mode: Mode; readonly value: Surd; readonly phi: number }): GuidedStep {
  const fn = fnOf(o.mode)
  const line = (x: number) => math(`\\varphi = ${deg(x)}`)
  const wrongs: Wrong[] = [
    o.mode === 'linePlane' ? { content: line(SWAP2[o.phi]), rule: 'vec-angle-table' } : { content: line(180 - o.phi), rule: 'gl-angle-abs' },
    { content: line(90 - o.phi), rule: o.mode === 'linePlane' ? 'gl-angle-plane-cos' : 'vec-angle-arcsin' },
    { content: line(SWAP[o.phi]), rule: 'vec-angle-table' },
  ]
  const v = surdLatex(o.value)
  return choiceStep(rng, {
    id: 'winkel',
    title: 'Winkel',
    question: 'Wie groß ist der Schnittwinkel $\\varphi$?',
    correct: line(o.phi),
    wrongs,
    hint: `Lies den Winkel aus der Tabelle der besonderen Werte ab. Ein Schnittwinkel liegt zwischen $0^\\circ$ und $90^\\circ$.`,
    explanation: { detailed: `$\\varphi = \\arc${fn.slice(1)}\\left(${v}\\right) = ${deg(o.phi)}$.`, short: `$\\varphi = ${deg(o.phi)}$.` },
    established: [`\\varphi = ${deg(o.phi)}`],
    cards: [GL_CARD.schnittwinkel],
  })
}

// Bedingung für senkrecht (Stufe 4)
function perpCondStep(rng: Rng, o: { readonly mode: Mode; readonly an: string; readonly bn: string }): GuidedStep {
  const dot0 = math(`${o.an} \\cdot ${o.bn} = 0`)
  const par = math(`${o.an} = k \\cdot ${o.bn}`)
  const right = o.mode === 'linePlane' ? par : dot0
  const wrongs: Wrong[] =
    o.mode === 'linePlane'
      ? [
          { content: dot0, rule: 'gl-lp-normal' },
          { content: math(`${o.an} = ${o.bn}`), rule: 'gl-normal-factor' },
        ]
      : [
          { content: par, rule: 'vec-parallel-dot' },
          { content: math(`${o.an} \\cdot ${o.bn} = 1`), rule: 'vec-perp-one' },
        ]
  const why = {
    lines: `Senkrechte Geraden haben senkrechte Richtungen: $${right.slice(1, -1)}$.`,
    planes: `Senkrechte Ebenen haben senkrechte Normalen: $${right.slice(1, -1)}$.`,
    linePlane: `Steht die Gerade senkrecht auf der Ebene, läuft sie in Richtung der Normalen: $${o.an}$ ist ein Vielfaches von $${o.bn}$.`,
  }[o.mode]
  return choiceStep(rng, {
    id: 'bedingung',
    title: 'Bedingung',
    question: o.mode === 'linePlane' ? 'Wann steht die Gerade senkrecht auf der Ebene?' : o.mode === 'lines' ? 'Wann stehen die Geraden senkrecht aufeinander?' : 'Wann stehen die Ebenen senkrecht aufeinander?',
    correct: right,
    wrongs,
    hint: o.mode === 'linePlane' ? 'Die Normale steht senkrecht auf der Ebene. Eine Gerade senkrecht zur Ebene läuft also wie die Normale.' : 'Senkrecht heißt: Skalarprodukt gleich $0$.',
    explanation: { detailed: why, short: right },
    cards: [GL_CARD.schnittwinkel],
  })
}

// ------------------------------------------------------------------ Bilder

type Nm = readonly number[]
const addN = (a: Nm, b: Nm) => a.map((x, i) => x + b[i])
const scaleN = (k: number, a: Nm) => a.map((x) => k * x)
const dotN = (a: Nm, b: Nm) => a.reduce((s, x, i) => s + x * b[i], 0)
const crossN = (a: Nm, b: Nm) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unitN = (a: Nm) => scaleN(1 / Math.hypot(...a), a)

function lineThrough(S: Nm, v: Nm, name: string, color: 'a' | 'b', phase?: number): DrawSegment {
  const u = scaleN(3.2, unitN(v))
  return { from: addN(S, scaleN(-1, u)), to: addN(S, u), color, label: name, ...(phase ? { phase } : {}) }
}

// Zwei Geraden durch S mit dem spitzen Winkel
function linesFigure(dim: 2 | 3, S: Vec, v: Vec, w: Vec, g: string, h: string, label: string, caption: string): VectorDrawing {
  const [Sn, vn, wn] = [nums(S), nums(v), nums(w)]
  const w2 = dotN(vn, wn) < 0 ? scaleN(-1, wn) : wn
  const angles: DrawAngle[] = [{ at: Sn, u: vn, v: w2, color: 'r', label, phase: 1 }]
  return { ...emptyDrawing(dim, caption), segments: [lineThrough(Sn, vn, g, 'a'), lineThrough(Sn, wn, h, 'b')], points: [{ at: Sn, label: 'S', color: 'r' }], angles }
}

// Gerade durchstößt die Ebene in S; Winkel zwischen Gerade und ihrem Schatten in der Ebene
function linePlaneFigure(S: Vec, n: Vec, v: Vec, g: string, label: string, caption: string): VectorDrawing {
  const [Sn, nn, vn] = [nums(S), nums(n), nums(v)]
  const shadow = addN(vn, scaleN(-dotN(vn, nn) / dotN(nn, nn), nn))
  const flat = Math.hypot(...shadow) > 1e-9
  // senkrecht auf der Ebene: rechter Winkel zu einer Richtung der Ebene
  const angles: DrawAngle[] = [{ at: Sn, u: vn, v: flat ? shadow : nums(planeDirections(n)[0]), color: 'r', label, phase: 2 }]
  const segments: DrawSegment[] = [lineThrough(Sn, vn, g, 'a')]
  if (flat) segments.push({ from: Sn, to: addN(Sn, scaleN(2.6, unitN(shadow))), color: 'muted', dashed: true, phase: 1 })
  return { ...emptyDrawing(3, caption), polygons: [patch(Sn, n, PATCH, 'c', 0)], segments, points: [{ at: Sn, label: 'S', color: 'r' }], angles }
}

// Zwei Ebenen durch X, Schnittgerade, Winkel zwischen den Richtungen senkrecht zur Schnittgeraden
function planesFigure(X: Vec, n1: Vec, n2: Vec, label: string, caption: string): VectorDrawing {
  const [Xn, a, b] = [nums(X), nums(n1), nums(n2)]
  const u = unitN(crossN(a, b))
  const e1 = unitN(crossN(u, a))
  let e2 = unitN(crossN(u, b))
  if (dotN(e1, e2) < 0) e2 = scaleN(-1, e2)
  const angles: DrawAngle[] = [{ at: Xn, u: e1, v: e2, color: 'r', label, phase: 2 }]
  const segments: DrawSegment[] = [
    { from: addN(Xn, scaleN(-1.4 * PATCH, u)), to: addN(Xn, scaleN(1.4 * PATCH, u)), color: 'r', dashed: true, phase: 1 },
    { from: Xn, to: addN(Xn, scaleN(PATCH, e1)), color: 'muted', phase: 2 },
    { from: Xn, to: addN(Xn, scaleN(PATCH, e2)), color: 'muted', phase: 2 },
  ]
  const points: DrawPoint[] = [{ at: Xn, color: 'r', phase: 1 }]
  return { ...emptyDrawing(3, caption), polygons: [patch(Xn, n1, PATCH, 'c', 0), patch(Xn, n2, PATCH, 'a', 0)], segments, points, angles }
}

const resultCaption = (special: boolean, phi: number, mode: Mode, value: Surd) =>
  special ? `Der Schnittwinkel beträgt $${deg(phi)}$.` : `$${fnOf(mode)}\\varphi = ${surdLatex(value)}$, also $\\varphi \\approx ${decimal1(angleOf(mode, surdValue(value)))}^\\circ$.`

// ------------------------------------------------------------------ Zwei Geraden

// Stufe 1 Ebene oder Raum, 2 Raum (h durch zwei Punkte möglich), 3 allgemeiner Winkel, 4 senkrecht mit Parameter, 5
// allgemein, beide Geraden durch zwei Punkte
function buildAngleLines(rng: Rng, level: Level): Built {
  for (;;) {
    const dim: 2 | 3 = level === 1 && rng.chance(0.5) ? 2 : 3
    const [g, h] = rng.pick([
      ['g', 'h'],
      ['g_1', 'g_2'],
    ] as const)
    const [t, s] = rng.pick([
      ['t', 's'],
      ['r', 's'],
      ['\\lambda', '\\mu'],
    ] as const)
    const general = level === 3 || level === 5
    let v: Vec
    let w: Vec
    let phi = 0
    if (level === 4) {
      v = pickDir(rng, 3, 3, 1)
      const [a1, b1] = planeDirections(v)
      w = vecAdd(vecScale(rat(rng.int(-1, 1)), a1), vecScale(nonzero(rng, [-1, 1]), b1))
      if (vecIsZero(w) || tooBig(w, 6)) continue
    } else if (general) {
      v = pickDir(rng, 3, 3, 1)
      w = pickDir(rng, 3, 3, 1)
      if (isParallel(v, w) || !isGeneral(v, w)) continue
    } else {
      ;({ a: v, b: w, phi } = specialPair(rng, dim, 'lines'))
      if (rng.chance(0.5)) w = vecScale(rat(-1), w)
    }
    const S = pickPoint(rng, dim, 3)
    const t0 = nonzero(rng)
    const s0 = nonzero(rng)
    const p = at(S, v, ratNeg(t0))
    const q = at(S, w, ratNeg(s0))
    if (tooBig(p) || tooBig(q) || vecIsZero(p) || vecIsZero(q)) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.schnittwinkel]
    const viaH = level === 2 ? rng.chance(0.5) : level === 5
    const viaG = level === 5
    const [A, B, C, D] = ['A', 'B', 'C', 'D']
    const vn = viaG ? `\\overrightarrow{${A}${B}}` : '\\vec v'
    const wn = viaH ? `\\overrightarrow{${C}${D}}` : '\\vec w'
    const before = linesFigure(dim, S, v, w, g, h, '\\varphi', `Gesucht ist der Schnittwinkel $\\varphi$ von $${g}$ und $${h}$.`)
    const gGiven = viaG ? `${pointLatex(A, p)},\\; ${pointLatex(B, vecAdd(p, v))}` : paramFormLatex(g, p, [[t, v]])
    const hGiven = viaH ? `${pointLatex(C, q)},\\; ${pointLatex(D, vecAdd(q, w))}` : paramFormLatex(h, q, [[s, w]])
    const intro = viaG ? `$${g}$ geht durch $${A}$ und $${B}$, $${h}$ durch $${C}$ und $${D}$. ` : viaH ? `$${h}$ geht durch $${C}$ und $${D}$. ` : ''
    if (level === 4) {
      // a an Stelle j im Richtungsvektor von g, so dass v · w = 0
      const js = [0, 1, 2].filter((i) => !isZero(w[i]))
      const j = rng.pick(js)
      const a0 = v[j]
      const rest = vecDot(
        v.map((x, i) => (i === j ? rat(0) : x)),
        w,
      )
      const cond = perpCondStep(rng, { mode: 'lines', an: '\\vec v', bn: '\\vec w' })
      const solved = solveStep(rng, {
        id: 'a',
        title: 'Parameter $a$',
        question: 'Für welches $a$ ist $\\vec v \\cdot \\vec w = 0$?',
        t: 'a',
        target: rat(0),
        p: rest,
        v: w[j],
        lead: '$\\vec v \\cdot \\vec w$ ausgerechnet:',
        card: GL_CARD.schnittwinkel,
      })
      steps.push({ ...cond, drawing: { ...before, angles: [], caption: 'Gesucht ist $ so, dass ein rechter Winkel entsteht.' } }, solved.step)
      if (steps.some((st) => st.choices.length < 3) || !ratEq(solved.t, a0)) continue
      const vShown = withParamLatex(v, j, 'a')
      return {
        kind: 'angleLines',
        instruction: `Für welches $a$ stehen die Geraden $${g}$ und $${h}$ senkrecht aufeinander?`,
        functionLatex: stack(`${g}\\colon \\vec x = ${vecLatex(p)} + ${t} ${vShown}`, hGiven),
        steps,
        cards,
        resultLatex: `a = ${show(a0)}`,
        resultDrawing: linesFigure(3, S, v, w, g, h, deg(90), `Mit $a = ${show(a0)}$ stehen $${g}$ und $${h}$ senkrecht aufeinander.`),
        form: `angleLines|perp|${j}|${t}|${g}|${signShape(v, w)}`,
        data: { v: nums(v), w: nums(w), j: [j] },
        answer: [num(a0)],
      }
    }
    if (viaG) {
      const c = connectStep(rng, A, B, p, vecAdd(p, v))
      if (c.choices.length < 3) continue
      steps.push(c)
      cards.push(CARD.verbindung)
    }
    if (viaH) {
      const c = { ...connectStep(rng, C, D, q, vecAdd(q, w)), id: 'verbindung-2' }
      if (c.choices.length < 3) continue
      steps.push(c)
      cards.push(CARD.verbindung)
    }
    steps.push(formulaStep(rng, { mode: 'lines', an: vn, bn: wn, paramPlane: false }))
    steps.push(dotStep(rng, vn, wn, v, w), lengthsStep(rng, [vn, wn], [v, w]))
    const val = valueStep(rng, { mode: 'lines', an: vn, bn: wn, a: v, b: w, general })
    steps.push(val.step)
    if (!general) steps.push(degreeStep(rng, { mode: 'lines', value: val.value, phi }))
    steps[0] = { ...steps[0], drawing: before }
    if (steps.some((st) => st.choices.length < 3)) continue
    return {
      kind: 'angleLines',
      instruction: `${intro}Die Geraden $${g}$ und $${h}$ schneiden sich. ${general ? 'Berechne $\\cos\\varphi$ für ihren Schnittwinkel $\\varphi$.' : 'Wie groß ist ihr Schnittwinkel $\\varphi$?'}`,
      functionLatex: stack(gGiven, hGiven),
      steps,
      cards,
      resultLatex: general ? `\\cos\\varphi = ${surdLatex(val.value)}` : `\\varphi = ${deg(phi)}`,
      resultDrawing: linesFigure(dim, S, v, w, g, h, general ? '\\varphi' : deg(phi), resultCaption(!general, phi, 'lines', val.value)),
      form: `angleLines|${dim}|${general ? 'gen' : phi}|${viaG ? 2 : viaH ? 1 : 0}|${t}|${g}|${ratSign(vecDot(v, w))}|${signShape(p, v, w)}`,
      data: { v: nums(v), w: nums(w) },
      answer: [general ? surdValue(val.value) : phi],
    }
  }
}

// ------------------------------------------------------------------ Gerade und Ebene

// Stufe 1 Koordinatenform, 2 Normalen- oder Koordinatenform, 3 Parameterform (Kreuzprodukt), 4 senkrecht mit Parameter,
// 5 Ebene durch drei Punkte, Gerade durch zwei Punkte, allgemein
function buildAngleLinePlane(rng: Rng, level: Level): Built {
  for (;;) {
    const E = rng.pick(['E', 'F'])
    const g = rng.pick(['g', 'h'])
    const t = rng.pick(['t', 's'])
    const [r, s] = rng.pick([
      ['r', 's'],
      ['\\lambda', '\\mu'],
    ] as const)
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.schnittwinkel]
    let n: Vec
    let v: Vec
    let phi = 0
    let general = level === 5 || (level === 3 && rng.chance(0.5))
    let P0: Vec
    let planeGiven: string
    let paramPlane = false
    let u: Vec = []
    let w: Vec = []
    let pts: Vec[] = []
    if (level === 4) {
      n = pickDir(rng, 3, 3, 1)
      const k = nonzero(rng, [-2, -1, 2, 3])
      v = vecScale(k, n)
      general = false
      P0 = pickPoint(rng, 3, 3)
      planeGiven = coordLatex(E, n, vecDot(n, P0))
    } else if (level === 5) {
      const tp = threePoints(rng)
      ;[P0, u, w, pts] = [tp.a, tp.u, tp.w, [tp.a, tp.b, tp.c]]
      n = crossVec(u, w)
      v = pickDir(rng, 3, 3, 1)
      if (tooBig(n, 15) || !isGeneral(n, v)) continue
      planeGiven = `${pointLatex('A', tp.a)},\\; ${pointLatex('B', tp.b)},\\; ${pointLatex('C', tp.c)}`
    } else {
      let n0: Vec
      if (general) {
        n0 = pickDir(rng, 3, 3, 1)
        v = pickDir(rng, 3, 3, 1)
      } else ({ a: n0, b: v, phi } = specialPair(rng, 3, 'linePlane'))
      P0 = pickPoint(rng, 3, 3)
      if (level === 3) {
        ;[u, w] = directionsFor(rng, n0)
        n = crossVec(u, w)
        paramPlane = true
        if (tooBig(u, 6) || tooBig(w, 6) || tooBig(n, 15)) continue
        planeGiven = paramFormLatex(E, P0, [
          [r, u],
          [s, w],
        ])
      } else {
        n = n0
        planeGiven = level === 2 && rng.chance(0.5) ? normalFormLatex(E, n, P0) : coordLatex(E, n, vecDot(n, P0))
      }
      if (general && !isGeneral(n, v)) continue
    }
    if (isZero(vecDot(n, v))) continue
    // Durchstoßpunkt S in der Ebene, Gerade durch S
    const [d1] = planeDirections(n)
    const S = at(P0, d1, nonzero(rng, [-1, 1]))
    const t0 = nonzero(rng)
    const p = at(S, v, ratNeg(t0))
    if (tooBig(p) || vecIsZero(p)) continue
    const nn = '\\vec n'
    const vn = level === 5 ? '\\overrightarrow{PQ}' : '\\vec v'
    const before = linePlaneFigure(S, n, v, g, '\\varphi', `Gesucht ist der Winkel $\\varphi$ zwischen $${g}$ und $${E}$.`)
    const lineGiven = level === 5 ? `${pointLatex('P', p)},\\; ${pointLatex('Q', vecAdd(p, v))}` : `${g}\\colon \\vec x = ${vecLatex(p)} + ${t} ${level === 4 ? '' : vecLatex(v)}`
    if (level === 4) {
      const js = [0, 1, 2].filter((i) => !isZero(n[i]))
      const j = rng.pick(js)
      const i = rng.pick(js.filter((x) => x !== j))
      const k = ratDiv(v[i], n[i])
      const a0 = v[j]
      const cond = perpCondStep(rng, { mode: 'linePlane', an: '\\vec v', bn: '\\vec n' })
      const rest = vecDot(
        v.map((x, i2) => (i2 === j ? rat(0) : x)),
        n,
      )
      const line = (x: Rational) => math(`a = ${show(x)}`)
      const aWrongs: Wrong[] = [
        { content: line(n[j]), rule: 'gl-normal-factor' },
        { content: line(ratMul(ratDiv(n[i], v[i]), n[j])), rule: 'gl-solve-multiply' },
        { content: line(ratNeg(ratDiv(rest, n[j]))), rule: 'gl-lp-normal' },
        { content: line(ratNeg(a0)), rule: 'vec-sign-slip' },
      ]
      const aStep = choiceStep(rng, {
        id: 'a',
        title: 'Parameter $a$',
        question: `Für welches $a$ ist $\\vec v = ${withParamLatex(v, j, 'a')}$ ein Vielfaches von $\\vec n = ${vecLatex(n)}$?`,
        correct: line(a0),
        wrongs: aWrongs.filter((x) => x.content !== line(a0)),
        hint: `Bestimme den Faktor $k$ aus der Zeile für $${COORDS[i]}$ (ohne $a$). Derselbe Faktor gilt in der Zeile mit $a$.`,
        explanation: {
          detailed: `Zeile für $${COORDS[i]}$: $k = ${show(v[i])} : ${fac(n[i])} = ${show(k)}$. Zeile mit $a$: $a = ${show(k)} \\cdot ${fac(n[j])} = ${show(a0)}$. Die übrigen Zeilen passen auch.`,
          short: `$k = ${show(k)}$, also $a = ${show(a0)}$.`,
        },
        established: [`a = ${show(a0)}`],
        cards: [GL_CARD.schnittwinkel],
      })
      steps.push({ ...cond, drawing: { ...before, angles: [], caption: 'Gesucht ist $ so, dass ein rechter Winkel entsteht.' } }, aStep)
      if (steps.some((st) => st.choices.length < 3)) continue
      return {
        kind: 'angleLinePlane',
        instruction: `Für welches $a$ steht die Gerade $${g}$ senkrecht auf der Ebene $${E}$?`,
        functionLatex: stack(planeGiven, `${lineGiven}${withParamLatex(v, j, 'a')}`),
        steps,
        cards,
        resultLatex: `a = ${show(a0)}`,
        resultDrawing: linePlaneFigure(S, n, v, g, deg(90), `Mit $a = ${show(a0)}$ läuft $${g}$ in Richtung der Normalen: senkrecht auf $${E}$.`),
        form: `angleLinePlane|perp|${j}|${num(k)}|${t}|${g}|${signShape(n, p)}`,
        data: { n: nums(n), v: nums(v), j: [j] },
        answer: [num(a0)],
      }
    }
    if (level === 5) {
      const c1 = connectStep(rng, 'A', 'B', pts[0], pts[1])
      const c2 = { ...connectStep(rng, 'A', 'C', pts[0], pts[2]), id: 'verbindung-2' }
      const cs = crossStep(rng, '\\overrightarrow{AB}', '\\overrightarrow{AC}', u, w)
      const c3 = { ...connectStep(rng, 'P', 'Q', p, vecAdd(p, v)), id: 'verbindung-3' }
      if ([c1, c2, c3].some((c) => c.choices.length < 3) || cs.choices.length < 4) continue
      steps.push(c1, c2, { ...cs, question: `Ein Normalenvektor $\\vec n$ von $${E}$ ist das Kreuzprodukt der Richtungen. Wie lautet $\\overrightarrow{AB} \\times \\overrightarrow{AC}$?` }, c3)
      cards.push(CARD.verbindung, CARD.kreuz)
    }
    if (paramPlane) {
      const cs = crossStep(rng, '\\vec u', '\\vec w', u, w)
      if (cs.choices.length < 4) continue
      steps.push({ ...cs, question: `Die Richtungen von $${E}$ heißen $\\vec u$ und $\\vec w$. Ein Normalenvektor $\\vec n$ steht senkrecht auf beiden. Wie lautet $\\vec u \\times \\vec w$?` })
      cards.push(CARD.kreuz)
    }
    steps.push(formulaStep(rng, { mode: 'linePlane', an: vn, bn: nn, paramPlane: paramPlane || level === 5, uName: level === 5 ? '\\overrightarrow{AB}' : '\\vec u' }))
    steps.push(dotStep(rng, vn, nn, v, n), lengthsStep(rng, [vn, nn], [v, n]))
    const val = valueStep(rng, { mode: 'linePlane', an: vn, bn: nn, a: v, b: n, general })
    steps.push(val.step)
    if (!general) steps.push(degreeStep(rng, { mode: 'linePlane', value: val.value, phi }))
    steps[0] = { ...steps[0], drawing: before }
    if (steps.some((st) => st.choices.length < 3)) continue
    const intro = level === 5 ? `$${E}$ geht durch $A$, $B$ und $C$, die Gerade $${g}$ durch $P$ und $Q$. ` : ''
    return {
      kind: 'angleLinePlane',
      instruction: `${intro}Die Gerade $${g}$ durchstößt die Ebene $${E}$. ${general ? 'Berechne $\\sin\\varphi$ für den Schnittwinkel $\\varphi$.' : 'Unter welchem Winkel $\\varphi$?'}`,
      functionLatex: stack(planeGiven, lineGiven),
      steps,
      cards,
      resultLatex: general ? `\\sin\\varphi = ${surdLatex(val.value)}` : `\\varphi = ${deg(phi)}`,
      resultDrawing: linePlaneFigure(S, n, v, g, general ? '\\varphi' : deg(phi), resultCaption(!general, phi, 'linePlane', val.value)),
      form: `angleLinePlane|${level}|${general ? 'gen' : phi}|${paramPlane ? 'param' : 'coord'}|${t}|${g}|${ratSign(vecDot(n, v))}|${signShape(n, v, p)}`,
      data: { n: nums(n), v: nums(v) },
      answer: [general ? surdValue(val.value) : phi],
    }
  }
}

// ------------------------------------------------------------------ Zwei Ebenen

// Stufe 1 Koordinatenform, 2 eine in Normalenform, 3 Parameterform oder Koordinatenebene (allgemein), 4 senkrecht mit
// Parameter, 5 Ebene durch drei Punkte, allgemein
function buildAnglePlanes(rng: Rng, level: Level): Built {
  for (;;) {
    const [E, F] = rng.pick([
      ['E', 'F'],
      ['E_1', 'E_2'],
    ] as const)
    const [r, s] = rng.pick([
      ['r', 's'],
      ['\\lambda', '\\mu'],
    ] as const)
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.schnittwinkel]
    let n1: Vec
    let n2: Vec
    let phi = 0
    let X = pickPoint(rng, 3, 3)
    let general = level === 5
    let paramPlane = false
    let u: Vec = []
    let w: Vec = []
    let pts: Vec[] = []
    let axis = -1
    if (level === 4) {
      n1 = pickDir(rng, 3, 3, 1)
      const [a1, b1] = planeDirections(n1)
      n2 = vecAdd(vecScale(rat(rng.int(-1, 1)), a1), vecScale(nonzero(rng, [-1, 1]), b1))
      if (vecIsZero(n2) || tooBig(n2, 6)) continue
    } else if (level === 5) {
      const tp = threePoints(rng)
      ;[X, u, w, pts] = [tp.a, tp.u, tp.w, [tp.a, tp.b, tp.c]]
      n1 = crossVec(u, w)
      n2 = pickDir(rng, 3, 3, 1)
      if (tooBig(n1, 15) || !isGeneral(n1, n2)) continue
    } else if (level === 3) {
      general = rng.chance(0.5)
      let n0: Vec
      if (general) {
        n0 = pickDir(rng, 3, 3, 1)
        axis = rng.chance(0.5) ? rng.int(0, 2) : -1
        // F ist die Koordinatenebene: der gemeinsame Punkt im Bild liegt in ihr
        if (axis >= 0) X = X.map((x, i) => (i === axis ? rat(0) : x))
        n2 = axis >= 0 ? [0, 1, 2].map((i) => rat(i === axis ? 1 : 0)) : pickDir(rng, 3, 3, 1)
      } else ({ a: n0, b: n2, phi } = specialPair(rng, 3, 'planes'))
      if (axis < 0) {
        ;[u, w] = directionsFor(rng, n0)
        n1 = crossVec(u, w)
        paramPlane = true
        if (tooBig(u, 6) || tooBig(w, 6) || tooBig(n1, 15)) continue
      } else n1 = n0
      if (general && !isGeneral(n1, n2)) continue
    } else {
      ;({ a: n1, b: n2, phi } = specialPair(rng, 3, 'planes'))
      if (rng.chance(0.5)) n2 = vecScale(rat(-1), n2)
    }
    if (isParallel(n1, n2)) continue
    const nE = '\\vec n_1'
    const nF = '\\vec n_2'
    const before = planesFigure(X, n1, n2, '\\varphi', `Gesucht ist der Winkel $\\varphi$ zwischen $${E}$ und $${F}$.`)
    let eGiven = level === 2 && rng.chance(0.5) ? normalFormLatex(E, n1, X) : coordLatex(E, n1, vecDot(n1, X))
    if (paramPlane)
      eGiven = paramFormLatex(E, X, [
        [r, u],
        [s, w],
      ])
    if (level === 5) eGiven = `${pointLatex('A', pts[0])},\\; ${pointLatex('B', pts[1])},\\; ${pointLatex('C', pts[2])}`
    const planeNames = ['x\\text{-}y', 'x\\text{-}z', 'y\\text{-}z']
    const axisPlane = axis === 2 ? planeNames[0] : axis === 1 ? planeNames[1] : planeNames[2]
    const fGiven = axis >= 0 ? `${F}\\colon ${COORDS[axis]} = 0 \\;\\; (${axisPlane}\\text{-Ebene})` : coordLatex(F, n2, vecDot(n2, X))
    if (level === 4) {
      const js = [0, 1, 2].filter((i) => !isZero(n2[i]))
      const j = rng.pick(js)
      const a0 = n1[j]
      const rest = vecDot(
        n1.map((x, i) => (i === j ? rat(0) : x)),
        n2,
      )
      const cond = perpCondStep(rng, { mode: 'planes', an: nE, bn: nF })
      const solved = solveStep(rng, {
        id: 'a',
        title: 'Parameter $a$',
        question: `Für welches $a$ ist $${nE} \\cdot ${nF} = 0$?`,
        t: 'a',
        target: rat(0),
        p: rest,
        v: n2[j],
        lead: `$${nE} \\cdot ${nF}$ ausgerechnet:`,
        card: GL_CARD.schnittwinkel,
      })
      steps.push({ ...cond, drawing: { ...before, angles: [], caption: 'Gesucht ist $ so, dass ein rechter Winkel entsteht.' } }, solved.step)
      if (steps.some((st) => st.choices.length < 3) || !ratEq(solved.t, a0)) continue
      const eWithA = `${E}\\colon ${termsLatex(n1.map((c, i) => (i === j ? ([rat(1), `a${COORDS[i]}`] as const) : ([c, COORDS[i]] as const))))} = ${show(vecDot(n1, X))}`
      return {
        kind: 'anglePlanes',
        instruction: `Für welches $a$ stehen die Ebenen $${E}$ und $${F}$ senkrecht aufeinander?`,
        functionLatex: stack(eWithA, fGiven),
        steps,
        cards,
        resultLatex: `a = ${show(a0)}`,
        resultDrawing: planesFigure(X, n1, n2, deg(90), `Mit $a = ${show(a0)}$ stehen $${E}$ und $${F}$ senkrecht aufeinander.`),
        form: `anglePlanes|perp|${j}|${E}|${signShape(n1, n2)}`,
        data: { n: nums(n1), m: nums(n2), j: [j] },
        answer: [num(a0)],
      }
    }
    if (level === 5) {
      const c1 = connectStep(rng, 'A', 'B', pts[0], pts[1])
      const c2 = { ...connectStep(rng, 'A', 'C', pts[0], pts[2]), id: 'verbindung-2' }
      const cs = crossStep(rng, '\\overrightarrow{AB}', '\\overrightarrow{AC}', u, w)
      if ([c1, c2].some((c) => c.choices.length < 3) || cs.choices.length < 4) continue
      steps.push(c1, c2, { ...cs, question: `Ein Normalenvektor $${nE}$ von $${E}$ ist das Kreuzprodukt der Richtungen. Wie lautet $\\overrightarrow{AB} \\times \\overrightarrow{AC}$?` })
      cards.push(CARD.verbindung, CARD.kreuz)
    }
    if (paramPlane) {
      const cs = crossStep(rng, '\\vec u', '\\vec w', u, w)
      if (cs.choices.length < 4) continue
      steps.push({ ...cs, question: `Die Richtungen von $${E}$ heißen $\\vec u$ und $\\vec w$. Der Normalenvektor $${nE}$ steht senkrecht auf beiden. Wie lautet $\\vec u \\times \\vec w$?` })
      cards.push(CARD.kreuz)
    }
    steps.push(formulaStep(rng, { mode: 'planes', an: nE, bn: nF, paramPlane }))
    steps.push(dotStep(rng, nE, nF, n1, n2), lengthsStep(rng, [nE, nF], [n1, n2]))
    const val = valueStep(rng, { mode: 'planes', an: nE, bn: nF, a: n1, b: n2, general })
    steps.push(val.step)
    if (!general) steps.push(degreeStep(rng, { mode: 'planes', value: val.value, phi }))
    steps[0] = { ...steps[0], drawing: before }
    if (steps.some((st) => st.choices.length < 3)) continue
    const intro = level === 5 ? `$${E}$ geht durch $A$, $B$ und $C$. ` : ''
    return {
      kind: 'anglePlanes',
      instruction: `${intro}${general ? `Berechne $\\cos\\varphi$ für den Schnittwinkel $\\varphi$ von $${E}$ und $${F}$.` : `Unter welchem Winkel $\\varphi$ schneiden sich $${E}$ und $${F}$?`}`,
      functionLatex: stack(eGiven, fGiven),
      steps,
      cards,
      resultLatex: general ? `\\cos\\varphi = ${surdLatex(val.value)}` : `\\varphi = ${deg(phi)}`,
      resultDrawing: planesFigure(X, n1, n2, general ? '\\varphi' : deg(phi), resultCaption(!general, phi, 'planes', val.value)),
      form: `anglePlanes|${level}|${general ? 'gen' : phi}|${paramPlane ? 'param' : axis >= 0 ? `axis${axis}` : 'coord'}|${E}|${ratSign(vecDot(n1, n2))}|${signShape(n1, n2)}`,
      data: { n: nums(n1), m: nums(n2) },
      answer: [general ? surdValue(val.value) : phi],
    }
  }
}


export const WINKEL_BUILDERS = {
  angleLines: buildAngleLines,
  angleLinePlane: buildAngleLinePlane,
  anglePlanes: buildAnglePlanes,
} as const satisfies Partial<Record<VectorKind, (rng: Rng, level: Level) => Built>>



