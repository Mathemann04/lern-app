import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isInteger, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { crossStep, normStep } from './crossTasks.ts'
import { type DrawPoint } from './figures.ts'
import { GL_CARD } from './lineTasks.ts'
import {
  AXIS_OF,
  COORDS,
  coordLatex,
  crossVec,
  dOf,
  insertLatex,
  isParallel,
  lhsLatex,
  normalFormLatex,
  paramFormLatex,
  pickDir,
  pickPoint,
  planeDirections,
  planeFigure,
  primitive,
  sameCoord,
  samePlane,
  traceFigure,
} from './lineKit.ts'
import { type Built, type VectorKind, type Wrong, CARD, choiceStep, connectStep, math, nums, pointsDrawing, signShape } from './taskKit.ts'
import { type Vec, pointLatex, ratFactorLatex, ratLatex, vec, vecAdd, vecDot, vecIsZero, vecLatex, vecNeg, vecScale, vecSub } from './vec.ts'

// Baustein „Ebenen" der Tätigkeit „Geraden und Ebenen" (M7 Schritt 6): Punktprobe in der Koordinatenform, Koordinatenform
// aus Normalenform, Parameterform, drei Punkten oder Achsenabschnitten (Stufe 4 und 5 dazu ein Punkt mit Unbekannter),
// Parameterform aus drei Punkten oder aus der Koordinatenform, Hessesche Normalform, Spurpunkte und Spurdreieck.

export const PLANE_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['planeContains', 'planeCoord', 'planeTraces'],
  2: ['planeContains', 'planeCoord', 'planeParam', 'planeHesse', 'planeTraces'],
  3: ['planeCoord', 'planeParam', 'planeHesse', 'planeTraces'],
  4: ['planeCoord', 'planeHesse', 'planeTraces'],
  5: ['planeCoord', 'planeHesse', 'planeTraces'],
}

export const IN_PLANE = ['in der Ebene', 'nicht in der Ebene'] as const

const PLANE_NAMES = ['E', 'F'] as const
const PLANE_PARAMS = [
  ['r', 's'],
  ['\\lambda', '\\mu'],
  ['s', 't'],
] as const
const PLANE_POINTS = [
  ['A', 'B', 'C'],
  ['P', 'Q', 'R'],
  ['K', 'L', 'M'],
] as const

const fac = ratFactorLatex
const show = ratLatex
// Den Hinweis „Zum Drehen im Bild ziehen“ setzt das Bild selbst
const caption3 = (text: string) => text
const sumOf = (v: Vec) => v.reduce((s, x) => ratAdd(s, x), rat(0))

// ------------------------------------------------------------------ Schritte

type WrongCoord = { readonly n: Vec; readonly d: Rational; readonly rule: string }

// Koordinatenform aus Normalenvektor n und Punkt p: d = n · p. Falsche Formen, die dieselbe Ebene beschreiben, fallen weg
// pName: Name des Punkts (ohne Name: der Stützpunkt)
export function coordStep(rng: Rng, o: { readonly name: string; readonly n: Vec; readonly p: Vec; readonly pName?: string; readonly extra?: readonly WrongCoord[]; readonly from?: Vec }): GuidedStep {
  const pText = o.pName ? `den Punkt $${o.pName}$` : `den Stützpunkt $${pointLatex('P', o.p)}$`
  const d = dOf(o.n, o.p)
  const wrongs: WrongCoord[] = [
    { n: o.n, d: ratNeg(d), rule: 'gl-d-sign' },
    { n: o.p, d, rule: 'gl-normal-point-swapped' },
    { n: o.n, d: sumOf(o.p), rule: 'gl-insert-no-coef' },
    ...(o.extra ?? []),
  ]
  const form = coordLatex(o.name, o.n, d)
  const shrunk = o.from && !o.from.every((x, i) => ratEq(x, o.n[i])) ? `Den Normalenvektor darfst du kürzen: statt $${vecLatex(o.from)}$ reicht $\\vec n = ${vecLatex(o.n)}$. ` : ''
  const dCalc = `d = \\vec n \\cdot ${vecLatex(o.p)} = ${insertLatex(o.n, o.p)} = ${show(d)}`
  return choiceStep(rng, {
    id: 'koordinatenform',
    title: 'Koordinatenform',
    question: `Wie lautet die Koordinatenform von $${o.name}$?`,
    correct: math(form),
    wrongs: rng.shuffle(wrongs.filter((w) => !sameCoord(o.n, d, w.n, w.d))).map((w) => ({ content: math(coordLatex(o.name, w.n, w.d)), rule: w.rule })),
    hint: `Die Einträge des Normalenvektors stehen vor $x$, $y$ und $z$. Die Zahl rechts bekommst du, wenn du ${pText} links einsetzt.`,
    explanation: {
      detailed: `${shrunk}Links steht $${lhsLatex(o.n)}$. Für die rechte Seite setzt du ${pText} ein: $${dCalc}$. Also $${form}$.`,
      short: `$${dCalc}$, also $${form}$.`,
    },
    established: [dCalc, form],
    cards: [GL_CARD.koordinaten],
  })
}

// Punktprobe in der Koordinatenform: einsetzen und vergleichen, in einem Schritt (falsche Antworten aus Rechenfehlern)
export function probeStep(rng: Rng, o: { readonly name: string; readonly n: Vec; readonly d: Rational; readonly P: Vec; readonly pName: string }): { readonly step: GuidedStep; readonly on: boolean } {
  const val = vecDot(o.n, o.P)
  const on = ratEq(val, o.d)
  const verdict = (w: Rational) => `$${show(w)} ${ratEq(w, o.d) ? '=' : '\\ne'} ${show(o.d)}$: $${o.pName}$ liegt ${ratEq(w, o.d) ? '' : 'nicht '}in $${o.name}$.`
  const slips: { readonly w: Rational; readonly rule: string }[] = []
  const neg = o.n.findIndex((c, i) => ratSign(ratMul(c, o.P[i])) < 0)
  if (neg >= 0) slips.push({ w: ratSub(val, ratMul(rat(2), ratMul(o.n[neg], o.P[neg]))), rule: 'vec-sign-slip' })
  slips.push({ w: vecDot(o.n, [o.P[1], o.P[2], o.P[0]]), rule: 'gl-insert-swapped' })
  slips.push({ w: sumOf(o.P), rule: 'gl-insert-no-coef' })
  const wrongs: Wrong[] = rng.shuffle(slips.filter((s) => !ratEq(s.w, val)).map((s) => ({ content: `Links kommt $${show(s.w)}$ heraus. ${verdict(s.w)}`, rule: s.rule })))
  if (on && !isZero(o.d)) wrongs.push({ content: `$${show(val)} \\ne 0$: $${o.pName}$ liegt nicht in $${o.name}$.`, rule: 'gl-probe-zero' })
  else wrongs.push({ content: `Links kommt $${show(val)}$ heraus, eine Zahl wie rechts: $${o.pName}$ liegt in $${o.name}$.`, rule: 'gl-probe-misread' })
  const insert = `${insertLatex(o.n, o.P)} = ${show(val)}`
  return {
    on,
    step: choiceStep(rng, {
      id: 'probe',
      title: 'Punktprobe',
      question: `Liegt $${o.pName}$ in $${o.name}$?`,
      correct: `$${insert}$, also ${verdict(val)}`,
      wrongs,
      hint: `Setz die Koordinaten von $${o.pName}$ für $x$, $y$ und $z$ ein und vergleiche mit der rechten Seite.`,
      explanation: { detailed: `Einsetzen: $${insert}$. ${verdict(val)}`, short: `$${insert}$: ${on ? 'stimmt' : 'stimmt nicht'}.` },
      established: [insert],
      cards: [GL_CARD.punktprobe],
    }),
  }
}

// Hessesche Normalform aus der Koordinatenform n · x = d mit ganzzahliger Länge von n
function hesseStep(rng: Rng, o: { readonly name: string; readonly n: Vec; readonly d: Rational; readonly len: number }): { readonly step: GuidedStep; readonly n0: Vec; readonly d0: Rational } {
  const L = rat(o.len)
  const flip = ratSign(o.d) < 0
  const n0 = vecScale(ratDiv(rat(flip ? -1 : 1), L), o.n)
  const d0 = ratDiv(flip ? ratNeg(o.d) : o.d, L)
  const form = coordLatex(o.name, n0, d0)
  const wrongs: WrongCoord[] = [
    { n: o.n, d: o.d, rule: 'gl-hesse-not-normed' },
    { n: vecScale(ratDiv(rat(flip ? -1 : 1), ratMul(L, L)), o.n), d: ratDiv(flip ? ratNeg(o.d) : o.d, ratMul(L, L)), rule: 'gl-hesse-square' },
    // rechts negativ: dieser Fehler vor „nur links geteilt“ (höchstens drei falsche Antworten, „nicht normiert“ und
    // „durch das Quadrat“ immer dabei, damit der freie Modus sie erkennt)
    ...(flip ? [{ n: vecNeg(n0), d: ratNeg(d0), rule: 'gl-hesse-d-sign' }] : []),
    { n: n0, d: flip ? ratNeg(o.d) : o.d, rule: 'gl-hesse-only-lhs' },
  ]
  // Zähler n' · x − d' mit d' = |d| ≥ 0 (bei d < 0 ist n' = −n)
  const fraction = `\\frac{${lhsLatex(flip ? vecNeg(o.n) : o.n)}${isZero(o.d) ? '' : ` - ${show(ratAbs(o.d))}`}}{${o.len}} = 0`
  const signNote = flip ? `Rechts steht $${show(o.d)} < 0$: Multiplizier zuerst mit $-1$, damit rechts eine Zahl $\\ge 0$ steht. ` : ''
  return {
    n0,
    d0,
    step: choiceStep(rng, {
      id: 'hesse',
      title: 'Hessesche Normalform',
      question: `Wie lautet die Hessesche Normalform von $${o.name}$?`,
      correct: math(form),
      wrongs: wrongs.filter((w) => !(w.n.every((x, i) => ratEq(x, n0[i])) && ratEq(w.d, d0))).map((w) => ({ content: math(coordLatex(o.name, w.n, w.d)), rule: w.rule })),
      hint: `Teile die ganze Gleichung durch die Länge des Normalenvektors, $${o.len}$. Rechts muss danach eine Zahl $\\ge 0$ stehen.`,
      explanation: {
        detailed: `${signNote}Dann teilst du beide Seiten durch $\\lvert \\vec n \\rvert = ${o.len}$: $${form}$, gleichbedeutend $${fraction}$. Jetzt ist der Normalenvektor ein Einheitsvektor, und rechts steht der Abstand der Ebene vom Ursprung.`,
        short: `${signNote}Durch $${o.len}$ geteilt: $${form}$.`,
      },
      established: [form, `${o.name}\\colon ${fraction}`],
      cards: [GL_CARD.hesse],
    }),
  }
}

// Spurpunkte einer Ebene in Koordinatenform (alle Einträge ungleich 0): je Achse ein Schritt
function traceSteps(rng: Rng, name: string, n: Vec, d: Rational): GuidedStep[] {
  return [0, 1, 2].map((i) => {
    const S = `S_${AXIS_OF[i]}`
    const x = ratDiv(d, n[i])
    const on = (k: number, val: Rational) => pointLatex(S, [0, 1, 2].map((j) => (j === k ? val : rat(0))))
    const wrongs: Wrong[] = rng.shuffle([
      { content: math(on(i, ratDiv(n[i], d))), rule: 'gl-trace-flipped' },
      { content: math(on(i, d)), rule: 'gl-trace-no-divide' },
      { content: math(on(i, ratNeg(x))), rule: 'gl-trace-sign' },
      { content: math(on((i + 1) % 3, x)), rule: 'gl-trace-axis' },
    ])
    const others = COORDS.filter((_, j) => j !== i)
    const eq = `${show(n[i]) === '1' ? '' : show(n[i]) === '-1' ? '-' : show(n[i])}${COORDS[i]} = ${show(d)}`
    // Faktor 1: Die Gleichung ist schon die Lösung
    const solved = show(n[i]) === '1' ? '' : `, also $${COORDS[i]} = ${show(x)}$`
    return choiceStep(rng, {
      id: `spur-${COORDS[i]}`,
      title: `Spurpunkt auf der $${COORDS[i]}$-Achse`,
      question: `Wo schneidet $${name}$ die $${COORDS[i]}$-Achse?`,
      correct: math(on(i, x)),
      wrongs,
      hint: `Auf der $${COORDS[i]}$-Achse sind $${others[0]} = 0$ und $${others[1]} = 0$. Setz das ein und löse nach $${COORDS[i]}$ auf.`,
      explanation: {
        detailed: `Mit $${others[0]} = ${others[1]} = 0$ bleibt $${eq}$${solved}. Der Spurpunkt ist $${on(i, x)}$.`,
        short: `$${eq} \\;\\Rightarrow\\; ${on(i, x)}$.`,
      },
      established: [on(i, x)],
      cards: [GL_CARD.spur],
    })
  })
}

// Parameterform aufstellen, falsche Formen, die dieselbe Ebene beschreiben, fallen weg
type WrongPlane = { readonly p: Vec; readonly u: Vec; readonly v: Vec; readonly rule: string }
function paramStep(rng: Rng, o: { readonly name: string; readonly p: Vec; readonly u: Vec; readonly v: Vec; readonly r: string; readonly s: string; readonly wrongs: readonly WrongPlane[]; readonly hint: string; readonly why: string; readonly card: string }): GuidedStep {
  const form = paramFormLatex(o.name, o.p, [
    [o.r, o.u],
    [o.s, o.v],
  ])
  return choiceStep(rng, {
    id: 'parameterform',
    title: 'Parameterform',
    question: `Wie lautet eine Gleichung von $${o.name}$ in Parameterform?`,
    correct: math(form),
    wrongs: rng.shuffle(o.wrongs.filter((w) => !samePlane(o.p, o.u, o.v, w.p, w.u, w.v))).map((w) => ({
      content: math(
        paramFormLatex(o.name, w.p, [
          [o.r, w.u],
          [o.s, w.v],
        ]),
      ),
      rule: w.rule,
    })),
    hint: o.hint,
    explanation: { detailed: `${o.why} Also $${form}$.`, short: `$${form}$.` },
    established: [form],
    cards: [o.card],
  })
}

// ------------------------------------------------------------------ Zahlen

// Normalenvektoren mit ganzzahliger Länge (Hesse), Einträge ohne Null
const HESSE_POOL: readonly (readonly number[])[] = [
  [1, 2, 2, 3],
  [2, 3, 6, 7],
  [1, 4, 8, 9],
  [2, 6, 9, 11],
  [4, 4, 7, 9],
  [6, 6, 7, 11],
  [3, 4, 12, 13],
  [2, 10, 11, 15],
]

function hesseNormal(rng: Rng): { readonly n: Vec; readonly len: number } {
  const row = rng.pick(HESSE_POOL)
  const e = rng.shuffle(row.slice(0, 3)).map((x) => (rng.chance(0.4) ? -x : x))
  return { n: vec(...e), len: row[3] }
}

// Zwei Richtungen senkrecht auf n, gemischt (ganzzahlig, nicht parallel)
export function directionsFor(rng: Rng, n: Vec): readonly [Vec, Vec] {
  for (;;) {
    const [u0, w0] = planeDirections(n)
    const k = rat(rng.pick([-1, 0, 1]))
    const u = primitive(vecAdd(u0, vecScale(k, w0)))
    const w = rng.chance(0.5) ? w0 : vecNeg(w0)
    if (isParallel(u, w)) continue
    if ([...u, ...w].some((x) => Math.abs(Number(x.n)) > 12)) continue
    return rng.chance(0.5) ? [u, w] : [w, u]
  }
}

function names(rng: Rng) {
  const [A, B, C] = rng.pick(PLANE_POINTS)
  const [r, s] = rng.pick(PLANE_PARAMS)
  return { A, B, C, r, s, E: rng.pick(PLANE_NAMES) }
}

// Drei Punkte einer Ebene (nicht auf einer Geraden), Richtungen AB und AC
export function threePoints(rng: Rng): { readonly a: Vec; readonly b: Vec; readonly c: Vec; readonly u: Vec; readonly w: Vec } {
  for (;;) {
    const a = pickPoint(rng, 3, 4)
    const b = pickPoint(rng, 3, 4)
    const c = pickPoint(rng, 3, 4)
    const u = vecSub(b, a)
    const w = vecSub(c, a)
    const n = crossVec(u, w)
    if (vecIsZero(n) || vecIsZero(a)) continue
    // Normale gekürzt nicht zu groß (Rechnung ohne Taschenrechner)
    if (primitive(n).some((x) => Math.abs(Number(x.n)) > 9)) continue
    return { a, b, c, u, w }
  }
}

const formOfNormal = (n: Vec) => `${n.filter(isZero).length}z${n.filter((x) => ratSign(x) < 0).length}`

// ------------------------------------------------------------------ Arten

// Punktprobe: Koordinatenform gegeben (Stufe 1) oder Normalenform, erst umrechnen (Stufe 2)
function buildPlaneContains(rng: Rng, level: Level): Built {
  for (;;) {
    const { E } = names(rng)
    const P = rng.pick(['P', 'Q', 'D'])
    const n = pickDir(rng, 3, 4, 1)
    const p = pickPoint(rng, 3, 3)
    const d = dOf(n, p)
    if (isZero(d)) continue
    const [u, w] = planeDirections(n)
    const on = rng.chance(0.5)
    let X = vecAdd(vecAdd(p, vecScale(rat(rng.pick([-1, 1, 2])), primitive(u))), vecScale(rat(rng.pick([-1, 1])), primitive(w)))
    if (!on) X = X.map((x, i) => (i === rng.int(0, 2) ? ratAdd(x, rat(rng.pick([-2, -1, 1, 2]))) : x))
    if (on !== ratEq(vecDot(n, X), d) || X.some((x) => Math.abs(Number(x.n)) > 9)) continue
    const steps: GuidedStep[] = []
    if (level >= 2) {
      const s1 = coordStep(rng, { name: E, n, p })
      if (s1.choices.length < 4) continue
      steps.push(s1)
    }
    const probe = probeStep(rng, { name: E, n, d, P: X, pName: P })
    if (probe.step.choices.length < 3) continue
    steps.push(probe.step)
    const [U, W] = [primitive(u), primitive(w)]
    const drawing = planeFigure({ p, u: U, w: W, name: E, n, points: [{ at: nums(X), label: P, color: on ? 'r' : 'c', phase: 3 }], play: true, caption: caption3(`$${P}$ liegt ${on ? '' : 'nicht '}in $${E}$.`) })
    const given = level >= 2 ? normalFormLatex(E, n, p) : coordLatex(E, n, d)
    return {
      kind: 'planeContains',
      instruction: `Liegt $${P}$ in der Ebene $${E}$?`,
      functionLatex: `${given},\\; ${pointLatex(P, X)}`,
      steps,
      cards: [GL_CARD.punktprobe, GL_CARD.koordinaten],
      resultLatex: `\\text{${IN_PLANE[on ? 0 : 1]}}`,
      resultDrawing: drawing,
      form: `planeContains|${level}|${on ? 'on' : 'off'}|${E}|${P}|${formOfNormal(n)}|${signShape(p, X)}`,
      data: { n: nums(n), d: [Number(d.n)], P: nums(X) },
      answer: [on ? 0 : 1],
    }
  }
}

// Koordinatenform: aus Normalenform (Stufe 1), Parameterform (2), drei Punkten oder Achsenabschnitten (3); Stufe 4 und 5
// danach ein Punkt mit Unbekannter (aus Parameterform bzw. drei Punkten)
function buildPlaneCoord(rng: Rng, level: Level): Built {
  for (;;) {
    const { E, A, B, C, r, s } = names(rng)
    const variant = level === 1 ? 'normal' : level === 2 ? 'param' : level === 3 ? rng.pick(['points', 'intercept'] as const) : level === 4 ? 'param' : 'points'
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.koordinaten]
    if (variant === 'intercept') {
      const ab = [rng.pick([-6, -4, -3, -2, 2, 3, 4, 6]), rng.pick([-6, -3, -2, -1, 1, 2, 3, 6]), rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])]
      const ints = rng.shuffle(ab)
      if (ints.every((x) => Math.abs(x) === Math.abs(ints[0]))) continue
      const recip = vec(...ints.map((x) => rat(1, x)))
      const n = primitive(recip)
      const k = ratDiv(n[0], recip[0])
      const d = k
      const form = coordLatex(E, n, d)
      const wrongs: WrongCoord[] = [
        { n: vec(...ints), d: rat(1), rule: 'gl-intercept-reciprocal' },
        { n, d: rat(1), rule: 'gl-intercept-rhs' },
        { n, d: ratNeg(d), rule: 'gl-d-sign' },
      ]
      const axisForm = `\\frac{x}{${ints[0]}} + \\frac{y}{${ints[1]}} + \\frac{z}{${ints[2]}} = 1`.replace(/\\frac\{(\w)\}\{-(\d)\}/g, '-\\frac{$1}{$2}').replace(/\+ -/g, '- ')
      const step = choiceStep(rng, {
        id: 'koordinatenform',
        title: 'Koordinatenform',
        question: `Wie lautet die Koordinatenform von $${E}$?`,
        correct: math(form),
        wrongs: rng.shuffle(wrongs.filter((w) => !sameCoord(n, d, w.n, w.d))).map((w) => ({ content: math(coordLatex(E, w.n, w.d)), rule: w.rule })),
        hint: 'Achsenabschnittsform: $\\frac{x}{a} + \\frac{y}{b} + \\frac{z}{c} = 1$, wobei $a$, $b$, $c$ die Schnittstellen mit den Achsen sind. Dann mit dem Hauptnenner malnehmen, auf beiden Seiten.',
        explanation: {
          detailed: `Achsenabschnittsform: $${axisForm}$. Mit $${show(k)}$ malnehmen (beide Seiten): $${form}$. Probe: $S_x$ eingesetzt ergibt $${show(n[0])} \\cdot ${fac(rat(ints[0]))} = ${show(d)}$.`,
          short: `$${axisForm}$, mal $${show(k)}$: $${form}$.`,
        },
        established: [axisForm, form],
        cards: [GL_CARD.koordinaten, GL_CARD.spur],
      })
      if (step.choices.length < 4) continue
      const S = ints.map((x, i) => [0, 1, 2].map((j) => (j === i ? rat(x) : rat(0))))
      return {
        kind: 'planeCoord',
        instruction: `Die Ebene $${E}$ schneidet die Achsen in $S_x$, $S_y$ und $S_z$. Wie lautet ihre Koordinatenform?`,
        functionLatex: S.map((x, i) => pointLatex(`S_${AXIS_OF[i]}`, x)).join(',\\; '),
        steps: [step],
        cards: [GL_CARD.koordinaten, GL_CARD.spur],
        resultLatex: form,
        resultDrawing: traceFigure(n, d, caption3(`Das Spurdreieck von $${E}$: Die Ebene schneidet jede Achse einmal.`)),
        form: `planeCoord|intercept|${ints.map((x) => (x < 0 ? 'n' : 'p') + Math.abs(x)).join('')}|${E}`,
        data: { n: nums(n), d: [Number(d.n) / Number(d.d)], S: ints },
        answer: [...nums(n), Number(d.n) / Number(d.d)],
      }
    }
    // Ebene: Stützpunkt p, Richtungen u und w, Normale n (gekürzt)
    let p: Vec
    let u: Vec
    let w: Vec
    let given: string
    let normalGiven: Vec | undefined
    const points: DrawPoint[] = []
    if (variant === 'points') {
      const t = threePoints(rng)
      ;[p, u, w] = [t.a, t.u, t.w]
      const s1 = connectStep(rng, A, B, t.a, t.b, pointsDrawing(3, [{ name: A, at: t.a }, { name: B, at: t.b }, { name: C, at: t.c }], caption3(`Die Punkte $${A}$, $${B}$ und $${C}$.`)))
      const s2 = { ...connectStep(rng, A, C, t.a, t.c), id: 'verbindung-2' }
      if (s1.choices.length < 3 || s2.choices.length < 3) continue
      steps.push(s1, s2)
      cards.push(CARD.verbindung)
      given = `${pointLatex(A, t.a)},\\; ${pointLatex(B, t.b)},\\; ${pointLatex(C, t.c)}`
      points.push({ at: nums(t.a), label: A }, { at: nums(t.b), label: B }, { at: nums(t.c), label: C })
    } else if (variant === 'param') {
      const n0 = pickDir(rng, 3, 3, 1)
      ;[u, w] = directionsFor(rng, n0)
      p = pickPoint(rng, 3, 4)
      given = paramFormLatex(E, p, [
        [r, u],
        [s, w],
      ])
    } else {
      const n0 = pickDir(rng, 3, 5, 1)
      p = pickPoint(rng, 3, 4)
      ;[u, w] = planeDirections(n0)
      normalGiven = n0
      given = normalFormLatex(E, n0, p)
    }
    // Normalenform: n ist gegeben, sonst aus dem Kreuzprodukt (gekürzt)
    const raw = crossVec(u, w)
    const n = normalGiven ?? primitive(raw)
    if (variant !== 'normal') {
      const [un, wn] = variant === 'points' ? [`\\overrightarrow{${A}${B}}`, `\\overrightarrow{${A}${C}}`] : ['\\vec u', '\\vec v']
      const sc = crossStep(rng, un, wn, u, w)
      if (sc.choices.length < 4) continue
      steps.push({ ...sc, question: `Ein Normalenvektor steht senkrecht auf beiden Richtungen. Wie lautet $${un} \\times ${wn}$?` })
      cards.push(CARD.kreuz)
    }
    const d = dOf(n, p)
    if (isZero(d)) continue
    const extra: WrongCoord[] = variant === 'normal' ? [] : [{ n: primitive(u), d: dOf(primitive(u), p), rule: 'gl-direction-as-normal' }]
    const sCoord = coordStep(rng, { name: E, n, p, ...(variant === 'points' ? { pName: A } : {}), extra, ...(variant !== 'normal' ? { from: raw } : {}) })
    if (sCoord.choices.length < 4) continue
    steps.push(sCoord)
    let result = coordLatex(E, n, d)
    let answer = [...nums(n), Number(d.n) / Number(d.d)]
    let instruction = variant === 'points' ? `Stelle die Koordinatenform der Ebene $${E}$ durch $${A}$, $${B}$ und $${C}$ auf.` : `Wie lautet die Koordinatenform von $${E}$?`
    let formTail = ''
    let drawPoints = points
    let unknown: Readonly<Record<string, readonly number[]>> = {}
    if (level >= 4) {
      // Punkt mit Unbekannter in einer Koordinate (Faktor ungleich 0)
      const D = rng.pick(['D', 'X', 'T'].filter((x) => x !== A && x !== B && x !== C))
      const ak = rng.pick(['a', 'k', 'c'].filter((x) => x !== r && x !== s))
      const X = vecAdd(vecAdd(p, vecScale(rat(rng.pick([-1, 1, 2])), u)), vecScale(rat(rng.pick([-1, 1])), w))
      const j = rng.pick([0, 1, 2].filter((i) => !isZero(n[i])))
      if (X.some((x) => Math.abs(Number(x.n)) > 12)) continue
      const rest = ratSub(d, ratSub(vecDot(n, X), ratMul(n[j], X[j])))
      const val = ratDiv(rest, n[j])
      const slips = [
        { v: ratDiv(ratSub(ratNeg(d), ratSub(vecDot(n, X), ratMul(n[j], X[j]))), n[j]), rule: 'gl-d-sign' },
        { v: ratMul(rest, n[j]), rule: 'gl-solve-multiply' },
        { v: ratDiv(ratNeg(rest), n[j]), rule: 'gl-solve-sign' },
      ].filter((x) => !ratEq(x.v, val))
      const entries = X.map((x, i) => (i === j ? ak : show(x)))
      const Dl = `${D}(${entries.join(' \\mid ')})`
      const inserted = n.map((c, i) => [c, i === j ? ak : X[i]] as const).filter(([c]) => !isZero(c))
      const lhs = inserted
        .map(([c, x], i) => {
          const sign = ratSign(c) < 0 ? (i === 0 ? '-' : ' - ') : i === 0 ? '' : ' + '
          const abs = show(ratAbs(c))
          return typeof x === 'string' ? `${sign}${abs === '1' ? '' : abs}${x}` : `${sign}${abs} \\cdot ${fac(x)}`
        })
        .join('')
      const eq = `${lhs} = ${show(d)}`
      const sv = choiceStep(rng, {
        id: 'unbekannte',
        title: 'Unbekannte',
        question: `Für welches $${ak}$ liegt $${D}$ in $${E}$?`,
        correct: math(`${ak} = ${show(val)}`),
        wrongs: slips.map((x) => ({ content: math(`${ak} = ${show(x.v)}`), rule: x.rule })),
        hint: `Setz $${D}$ in die Koordinatenform ein und löse nach $${ak}$ auf.`,
        explanation: { detailed: `Einsetzen: $${eq}$. Nach $${ak}$ aufgelöst: $${ak} = ${show(val)}$.`, short: `$${eq} \\;\\Rightarrow\\; ${ak} = ${show(val)}$.` },
        established: [eq, `${ak} = ${show(val)}`],
        cards: [GL_CARD.punktprobe],
      })
      if (sv.choices.length < 3) continue
      steps.push(sv)
      cards.push(GL_CARD.punktprobe)
      result = `${ak} = ${show(val)}`
      answer = [Number(val.n) / Number(val.d)]
      instruction = `Für welches $${ak}$ liegt $${Dl}$ in der Ebene $${E}$${variant === 'points' ? ` durch $${A}$, $${B}$ und $${C}$` : ''}?`
      given = `${given},\\; ${Dl}`
      formTail = `|${j}|${ak}|${isInteger(val) ? 'int' : 'frac'}`
      drawPoints = [...points, { at: nums(X), label: D, color: 'r', phase: 3 }]
      unknown = { X: nums(X), j: [j] }
    }
    const drawing = planeFigure({ p, u, w, name: E, n, points: drawPoints, showDirs: variant !== 'normal', play: true, caption: caption3(`Der Normalenvektor $\\vec n = ${vecLatex(n)}$ steht senkrecht auf $${E}$.`) })
    return {
      kind: 'planeCoord',
      instruction,
      functionLatex: given,
      steps,
      cards,
      resultLatex: result,
      resultDrawing: drawing,
      form: `planeCoord|${variant}|${level}|${E}|${formOfNormal(n)}|${signShape(p, u, w)}${formTail}`,
      data: { p: nums(p), u: nums(u), w: nums(w), n: nums(n), d: [Number(d.n) / Number(d.d)], ...unknown },
      answer,
    }
  }
}

// Parameterform: aus drei Punkten (Stufe 2) oder aus der Koordinatenform (Stufe 3, zwei Variablen frei wählen)
function buildPlaneParam(rng: Rng, level: Level): Built {
  for (;;) {
    const { E, A, B, C, r, s } = names(rng)
    if (level === 2) {
      const t = threePoints(rng)
      const s1 = connectStep(rng, A, B, t.a, t.b, pointsDrawing(3, [{ name: A, at: t.a }, { name: B, at: t.b }, { name: C, at: t.c }], caption3(`Die Punkte $${A}$, $${B}$ und $${C}$.`)))
      const s2 = { ...connectStep(rng, A, C, t.a, t.c), id: 'verbindung-2' }
      const wrongs: WrongPlane[] = [
        { p: t.a, u: t.b, v: t.c, rule: 'gl-position-direction' },
        { p: t.a, u: t.u, v: vecNeg(t.u), rule: 'gl-same-direction' },
        { p: t.u, u: t.a, v: t.w, rule: 'gl-support-swapped' },
      ]
      const s3 = paramStep(rng, {
        name: E,
        p: t.a,
        u: t.u,
        v: t.w,
        r,
        s,
        wrongs,
        hint: `Stützvektor: Ortsvektor von $${A}$. Richtungen: zwei Pfeile in der Ebene, die nicht parallel sind, z. B. $\\overrightarrow{${A}${B}}$ und $\\overrightarrow{${A}${C}}$.`,
        why: `Stützvektor: der Ortsvektor von $${A}$. Richtungsvektoren: $\\overrightarrow{${A}${B}}$ und $\\overrightarrow{${A}${C}}$; sie sind nicht parallel, weil die Punkte nicht auf einer Geraden liegen.`,
        card: GL_CARD.ebene,
      })
      if (s1.choices.length < 3 || s2.choices.length < 3 || s3.choices.length < 4) continue
      const n = primitive(crossVec(t.u, t.w))
      const drawing = planeFigure({ p: t.a, u: t.u, w: t.w, name: E, points: [{ at: nums(t.a), label: A }, { at: nums(t.b), label: B }, { at: nums(t.c), label: C }], showDirs: true, play: true, caption: caption3(`Von $${A}$ aus spannen $\\overrightarrow{${A}${B}}$ und $\\overrightarrow{${A}${C}}$ die Ebene auf.`) })
      return {
        kind: 'planeParam',
        instruction: `Stelle eine Gleichung der Ebene $${E}$ durch $${A}$, $${B}$ und $${C}$ in Parameterform auf.`,
        functionLatex: `${pointLatex(A, t.a)},\\; ${pointLatex(B, t.b)},\\; ${pointLatex(C, t.c)}`,
        steps: [s1, s2, s3],
        cards: [GL_CARD.ebene, CARD.verbindung],
        resultLatex: paramFormLatex(E, t.a, [
          [r, t.u],
          [s, t.w],
        ]),
        resultDrawing: drawing,
        form: `planeParam|points|${E}|${A}|${r}|${formOfNormal(n)}|${signShape(t.a, t.u, t.w)}`,
        data: { p: nums(t.a), u: nums(t.u), w: nums(t.w), A: nums(t.a), B: nums(t.b), C: nums(t.c) },
        answer: [...nums(t.a), ...nums(t.u), ...nums(t.w)],
      }
    }
    // Koordinatenform gegeben, nach einer Variablen mit Faktor ±1 auflösen, die beiden anderen frei wählen
    const k = rng.int(0, 2)
    const n = vec(...[0, 1, 2].map((i) => (i === k ? rng.pick([-1, 1]) : rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]))))
    const d = rat(rng.int(-6, 6))
    if (isZero(d)) continue
    const [i, j] = [0, 1, 2].filter((x) => x !== k)
    const e = (idx: number, val: Rational) => [0, 1, 2].map((x) => (x === idx ? val : rat(0)))
    const nk = n[k]
    // x_k = (d − n_i x_i − n_j x_j) / n_k
    const p = e(k, ratDiv(d, nk))
    const u = vecAdd(e(i, rat(1)), e(k, ratNeg(ratDiv(n[i], nk))))
    const w = vecAdd(e(j, rat(1)), e(k, ratNeg(ratDiv(n[j], nk))))
    const rhs = (() => {
      const terms = [
        [ratDiv(d, nk), ''],
        [ratNeg(ratDiv(n[i], nk)), COORDS[i]],
        [ratNeg(ratDiv(n[j], nk)), COORDS[j]],
      ] as const
      return terms
        .filter(([c]) => !isZero(c))
        .map(([c, x], idx) => {
          const abs = ratAbs(c)
          const body = x === '' ? show(abs) : abs.n === 1n && abs.d === 1n ? x : `${show(abs)}${x}`
          return idx === 0 ? `${ratSign(c) < 0 ? '-' : ''}${body}` : ` ${ratSign(c) < 0 ? '-' : '+'} ${body}`
        })
        .join('')
    })()
    const solvedEq = `${COORDS[k]} = ${rhs}`
    const wrongs: WrongPlane[] = [
      { p, u: vecAdd(e(i, rat(1)), e(k, ratDiv(n[i], nk))), v: vecAdd(e(j, rat(1)), e(k, ratDiv(n[j], nk))), rule: 'gl-coord-param-sign' },
      { p: vec(0, 0, 0), u, v: w, rule: 'gl-coord-param-support' },
      { p, u: n, v: w, rule: 'gl-normal-as-direction' },
    ]
    const step = paramStep(rng, {
      name: E,
      p,
      u,
      v: w,
      r,
      s,
      wrongs,
      hint: `Löse nach $${COORDS[k]}$ auf und setz $${COORDS[i]} = ${r}$, $${COORDS[j]} = ${s}$. Dann schreib $x$, $y$, $z$ untereinander und sortiere nach Zahl, $${r}$ und $${s}$.`,
      why: `Nach $${COORDS[k]}$ aufgelöst: $${solvedEq}$. Mit $${COORDS[i]} = ${r}$ und $${COORDS[j]} = ${s}$ steht in jeder Zeile Zahl plus Vielfache von $${r}$ und $${s}$; die Zahlen bilden den Stützvektor, die Faktoren die Richtungen.`,
      card: GL_CARD.ebene,
    })
    if (step.choices.length < 4) continue
    const drawing = planeFigure({ p, u, w, name: E, n, showDirs: true, play: true, caption: caption3(`Die Richtungen stehen senkrecht auf $\\vec n = ${vecLatex(n)}$.`) })
    return {
      kind: 'planeParam',
      instruction: `Wandle die Koordinatenform von $${E}$ in eine Parameterform um. Setz dabei $${COORDS[i]} = ${r}$ und $${COORDS[j]} = ${s}$.`,
      functionLatex: coordLatex(E, n, d),
      steps: [step],
      cards: [GL_CARD.ebene],
      resultLatex: paramFormLatex(E, p, [
        [r, u],
        [s, w],
      ]),
      resultDrawing: drawing,
      form: `planeParam|coord|${k}|${E}|${r}|${formOfNormal(n)}|${ratSign(d)}`,
      data: { n: nums(n), d: [Number(d.n)], p: nums(p), u: nums(u), w: nums(w) },
      answer: [...nums(p), ...nums(u), ...nums(w)],
    }
  }
}

// Hessesche Normalform: aus der Koordinatenform (Stufe 2), der Normalenform (3), der Parameterform (4), drei Punkten (5)
function buildPlaneHesse(rng: Rng, level: Level): Built {
  for (;;) {
    const { E, A, B, C, r, s } = names(rng)
    const { n, len } = hesseNormal(rng)
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.hesse]
    const p = pickPoint(rng, 3, 4)
    let d = dOf(n, p)
    if (isZero(d)) continue
    let given: string
    let nn = n
    const points: DrawPoint[] = []
    const [u0, w0] = directionsFor(rng, n)
    let u = u0
    let w = w0
    if (level === 2) given = coordLatex(E, n, d)
    else if (level === 3) {
      given = normalFormLatex(E, n, p)
      const sc = coordStep(rng, { name: E, n, p })
      if (sc.choices.length < 4) continue
      steps.push(sc)
    } else {
      if (level === 5) {
        // drei Punkte: A = p, B = p + u, C = p + w
        const [b, c] = [vecAdd(p, u), vecAdd(p, w)]
        given = `${pointLatex(A, p)},\\; ${pointLatex(B, b)},\\; ${pointLatex(C, c)}`
        const s1 = connectStep(rng, A, B, p, b)
        const s2 = { ...connectStep(rng, A, C, p, c), id: 'verbindung-2' }
        if (s1.choices.length < 3 || s2.choices.length < 3) continue
        steps.push(s1, s2)
        points.push({ at: nums(p), label: A }, { at: nums(b), label: B }, { at: nums(c), label: C })
      } else
        given = paramFormLatex(E, p, [
          [r, u],
          [s, w],
        ])
      const [un, wn] = level === 5 ? [`\\overrightarrow{${A}${B}}`, `\\overrightarrow{${A}${C}}`] : ['\\vec u', '\\vec v']
      const raw = crossVec(u, w)
      const sc = crossStep(rng, un, wn, u, w)
      // n bis aufs Vorzeichen wie das Kreuzprodukt (gekürzt)
      nn = primitive(raw)
      d = dOf(nn, p)
      const sk = coordStep(rng, { name: E, n: nn, p, ...(level === 5 ? { pName: A } : {}), from: raw, extra: [{ n: primitive(u), d: dOf(primitive(u), p), rule: 'gl-direction-as-normal' }] })
      if (sc.choices.length < 4 || sk.choices.length < 4) continue
      steps.push({ ...sc, question: `Ein Normalenvektor steht senkrecht auf beiden Richtungen. Wie lautet $${un} \\times ${wn}$?` }, sk)
      cards.push(CARD.kreuz, GL_CARD.koordinaten)
    }
    if (level === 3) cards.push(GL_CARD.koordinaten)
    const sn = normStep(rng, '\\lvert \\vec n \\rvert', nn, 'laenge', GL_CARD.hesse)
    const h = hesseStep(rng, { name: E, n: nn, d, len })
    if (sn.choices.length < 3 || h.step.choices.length < 4) continue
    steps.push({ ...sn, question: `Wie lang ist der Normalenvektor $\\vec n = ${vecLatex(nn)}$?` }, h.step)
    const drawing = planeFigure({ p, u, w, name: E, n: nn, points, play: true, caption: caption3(`Rechts in der Hesseschen Normalform steht $${show(h.d0)}$: So weit ist $${E}$ vom Ursprung entfernt.`) })
    return {
      kind: 'planeHesse',
      instruction: level === 5 ? `Bestimme die Hessesche Normalform der Ebene $${E}$ durch $${A}$, $${B}$ und $${C}$.` : `Bestimme die Hessesche Normalform von $${E}$.`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: coordLatex(E, h.n0, h.d0),
      resultDrawing: drawing,
      form: `planeHesse|${level}|${ratSign(d)}|${len}|${E}|${formOfNormal(nn)}|${signShape(p)}`,
      data: { n: nums(nn), d: [Number(d.n) / Number(d.d)], p: nums(p) },
      answer: [...nums(h.n0), Number(h.d0.n) / Number(h.d0.d)],
    }
  }
}

// Spurpunkte einer Ebene: Koordinatenform mit ganzen Achsenabschnitten (Stufe 1 und 2), mit Brüchen (3), aus der
// Parameterform (4), aus drei Punkten (5)
function buildPlaneTraces(rng: Rng, level: Level): Built {
  for (;;) {
    const { E, A, B, C, r, s } = names(rng)
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.spur]
    let n: Vec
    let d: Rational
    let given: string
    if (level <= 2) {
      const ints = [0, 1, 2].map(() => rng.pick(level === 1 ? [-4, -3, -2, 2, 3, 4, 6] : [-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]))
      n = primitive(vec(...ints.map((x) => rat(1, x))))
      d = ratDiv(n[0], rat(1, ints[0]))
      given = coordLatex(E, n, d)
    } else if (level === 3) {
      n = pickDir(rng, 3, 5, 0)
      d = rat(rng.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]))
      given = coordLatex(E, n, d)
      if (n.every((x) => isInteger(ratDiv(d, x)))) continue
    } else {
      let p: Vec
      let u: Vec
      let w: Vec
      if (level === 5) {
        const t = threePoints(rng)
        ;[p, u, w] = [t.a, t.u, t.w]
        given = `${pointLatex(A, t.a)},\\; ${pointLatex(B, t.b)},\\; ${pointLatex(C, t.c)}`
        const s1 = connectStep(rng, A, B, t.a, t.b)
        const s2 = { ...connectStep(rng, A, C, t.a, t.c), id: 'verbindung-2' }
        if (s1.choices.length < 3 || s2.choices.length < 3) continue
        steps.push(s1, s2)
      } else {
        const n0 = pickDir(rng, 3, 3, 0)
        ;[u, w] = directionsFor(rng, n0)
        p = pickPoint(rng, 3, 4)
        given = paramFormLatex(E, p, [
          [r, u],
          [s, w],
        ])
      }
      const [un, wn] = level === 5 ? [`\\overrightarrow{${A}${B}}`, `\\overrightarrow{${A}${C}}`] : ['\\vec u', '\\vec v']
      const raw = crossVec(u, w)
      n = primitive(raw)
      d = dOf(n, p)
      const sc = crossStep(rng, un, wn, u, w)
      const sk = coordStep(rng, { name: E, n, p, ...(level === 5 ? { pName: A } : {}), from: raw, extra: [{ n: primitive(u), d: dOf(primitive(u), p), rule: 'gl-direction-as-normal' }] })
      if (sc.choices.length < 4 || sk.choices.length < 4) continue
      steps.push({ ...sc, question: `Ein Normalenvektor steht senkrecht auf beiden Richtungen. Wie lautet $${un} \\times ${wn}$?` }, sk)
      cards.push(CARD.kreuz, GL_CARD.koordinaten)
    }
    if (n.some(isZero) || isZero(d)) continue
    const S = n.map((x) => ratDiv(d, x))
    if (S.some((x) => Math.abs(Number(x.n) / Number(x.d)) > 12)) continue
    const ts = traceSteps(rng, E, n, d)
    if (ts.some((x) => x.choices.length < 4)) continue
    steps.push(...ts)
    const result = S.map((x, i) => pointLatex(`S_${AXIS_OF[i]}`, [0, 1, 2].map((j) => (j === i ? x : rat(0))))).join(',\\; ')
    return {
      kind: 'planeTraces',
      instruction: `Bestimme die Spurpunkte von $${E}$${level === 5 ? ` durch $${A}$, $${B}$ und $${C}$` : ''}, also die Schnittpunkte mit den Achsen.`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: result,
      resultDrawing: traceFigure(n, d, caption3(`Die Spurpunkte spannen das Spurdreieck auf, das Stück von $${E}$ zwischen den Achsen.`)),
      form: `planeTraces|${level}|${S.map((x) => (isInteger(x) ? 'i' : 'f') + (ratSign(x) < 0 ? 'n' : 'p')).join('')}|${n.map((x) => (Math.abs(Number(x.n)) > 2 ? 'g' : 'k')).join('')}|${E}|${formOfNormal(n)}`,
      data: { n: nums(n), d: [Number(d.n) / Number(d.d)] },
      answer: S.flatMap((x, i) => [0, 1, 2].map((j) => (j === i ? Number(x.n) / Number(x.d) : 0))),
    }
  }
}

export const PLANE_BUILDERS = {
  planeContains: buildPlaneContains,
  planeCoord: buildPlaneCoord,
  planeParam: buildPlaneParam,
  planeHesse: buildPlaneHesse,
  planeTraces: buildPlaneTraces,
} as const satisfies Partial<Record<VectorKind, (rng: Rng, level: Level) => Built>>
