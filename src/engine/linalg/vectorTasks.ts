import type { GuidedStep } from '../guided/types.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { type Rational, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub, isZero } from '../rational.ts'
import { type Level, type TaskRef, seedBlock } from '../tasks/taskNumber.ts'
import { DOT_BUILDERS, DOT_KINDS_BY_LEVEL } from './dotTasks.ts'
import { DRAG_SHARE, buildDrag } from './dragTasks.ts'
import { PROJ_BUILDERS, PROJ_KINDS_BY_LEVEL } from './projTasks.ts'
import { FORCE_BUILDERS, FORCE_KINDS_BY_LEVEL } from './forceTasks.ts'
import { CROSS_BUILDERS, CROSS_KINDS_BY_LEVEL } from './crossTasks.ts'
import { SPAT_BUILDERS, SPAT_KINDS_BY_LEVEL } from './spatTasks.ts'
import { BASIS_BUILDERS, BASIS_KINDS_BY_LEVEL } from './basisTasks.ts'
import { LINE_BUILDERS, LINE_KINDS_BY_LEVEL } from './lineTasks.ts'
import { MATRIX_BUILDERS, MATRIX_KINDS_BY_LEVEL } from './matrixTasks.ts'
import { DET_BUILDERS, DET_KINDS_BY_LEVEL } from './detTasks.ts'
import { GAUSS_BUILDERS, GAUSS_KINDS_BY_LEVEL } from './gaussTasks.ts'
import { CRAMER_BUILDERS, CRAMER_KINDS_BY_LEVEL } from './cramerTasks.ts'
import { LGSP_BUILDERS, LGSP_KINDS_BY_LEVEL } from './lgspTasks.ts'
import { PLANE_BUILDERS, PLANE_KINDS_BY_LEVEL } from './planeTasks.ts'
import { LAGE_BUILDERS, LAGE_KINDS_BY_LEVEL } from './posTasks.ts'
import { ABSTAND_BUILDERS, ABSTAND_KINDS_BY_LEVEL } from './distTasks.ts'
import { WINKEL_BUILDERS, WINKEL_KINDS_BY_LEVEL } from './cutAngleTasks.ts'
import { type DrawArrow, type VectorDrawing, emptyDrawing } from './figures.ts'
import {
  type Built,
  type VectorKind,
  type VectorTask,
  type Wrong,
  CARD,
  PARAMS,
  choiceStep,
  connectStep,
  dimOf,
  drawable,
  ints,
  letters,
  math,
  negCount,
  nums,
  origin,
  pointsDrawing,
  pythagorean,
  signShape,
  zeroCount,
} from './taskKit.ts'
import {
  type Surd,
  type Vec,
  arrowName,
  coefLatex,
  columnLatex,
  pointLatex,
  ratFactorLatex,
  ratLatex,
  sqrtRat,
  surdLatex,
  vec,
  vecAdd,
  vecEq,
  vecLatex,
  vecName,
  vecNorm2,
  vecScale,
  vecSub,
} from './vec.ts'

export { CARD, type VectorKind, type VectorTask } from './taskKit.ts'

// Baukasten für die Tätigkeit „Vektoren", Baustein „Rechnen und Länge" (M7 Schritt 1, docs/PLAN-M7.md): Jede Art
// (kind) baut eine geführte Aufgabe mit Schritten, falschen Antworten aus typischen Fehlern (errorRules.ts) und Bildern
// (figures.ts). Alle Zahlen rechnet die Engine exakt (vec.ts). Die Stufe sagt nur, wie verschachtelt: 1 in der Ebene,
// 2 im Raum, 3 zwei Rechnungen zusammen, 4 mit Parameter oder in vier und fünf Dimensionen, 5 alles ineinander.


// Arten je Stufe (gleich oft)
export const KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['connect', 'combo', 'length', 'midpoint'],
  2: ['connect', 'combo', 'length', 'distance', 'midpoint', 'unit'],
  3: ['givenLength', 'parallelogram', 'equation', 'combo', 'distance'],
  4: ['paramLength', 'length', 'distance', 'unit', 'givenLength', 'midpoint'],
  5: ['paramDistance', 'givenLength', 'paramLength', 'equation', 'parallelogram'],
}



const squaresLatex = (v: Vec) => v.map((x) => `${ratFactorLatex(x)}^2`).join(' + ')

// Summe der Quadrate der Einträge mit falschen Antworten
function squaresStep(rng: Rng, name: string, v: Vec, drawing?: VectorDrawing): GuidedStep {
  const s = vecNorm2(v)
  const signWrong = v.reduce((acc, x) => ratAdd(acc, ratSign(x) < 0 ? ratNeg(ratMul(x, x)) : ratMul(x, x)), rat(0))
  const doubled = v.reduce((acc, x) => ratAdd(acc, ratMul(rat(2), ratAbs(x))), rat(0))
  const wrongs: Wrong[] = []
  if (negCount(v) > 0) wrongs.push({ content: math(ratLatex(signWrong)), rule: 'vec-square-sign' })
  wrongs.push({ content: math(ratLatex(doubled)), rule: 'vec-square-double' })
  const plain = v.reduce((acc, x) => ratAdd(acc, x), rat(0))
  wrongs.push({ content: math(ratLatex(plain)), rule: 'vec-length-abs-sum' })
  return choiceStep(rng, {
    id: 'quadrate',
    title: 'Summe der Quadrate',
    question: `Wie groß ist $\\lvert ${name} \\rvert^2$, die Summe der Quadrate der Einträge?`,
    correct: math(ratLatex(s)),
    wrongs,
    hint: `Quadriere jeden Eintrag, auch die negativen (ein Quadrat ist nie negativ), und addiere.`,
    explanation: {
      detailed: `Nach Pythagoras ist das Quadrat der Länge die Summe der Quadrate: $\\lvert ${name} \\rvert^2 = ${squaresLatex(v)} = ${ratLatex(s)}$.`,
      short: `$\\lvert ${name} \\rvert^2 = ${squaresLatex(v)} = ${ratLatex(s)}$.`,
    },
    established: [`\\lvert ${name} \\rvert^2 = ${squaresLatex(v)} = ${ratLatex(s)}`],
    cards: [CARD.laenge],
    ...(drawing ? { drawing } : {}),
  })
}

// Länge als Wurzel, vereinfacht; mit falschen Antworten
function rootLatex(s: Rational, len: Surd): string {
  const direct = `\\sqrt{${ratLatex(s)}}`
  const simple = surdLatex(len)
  return direct === simple ? direct : `${direct} = ${simple}`
}

function rootStep(rng: Rng, name: string, v: Vec, withSquares: boolean, drawing?: VectorDrawing): GuidedStep {
  const s = vecNorm2(v)
  const len = sqrtRat(s)
  const absSum = v.reduce((acc, x) => ratAdd(acc, ratAbs(x)), rat(0))
  const wrongs: Wrong[] = [
    { content: math(ratLatex(s)), rule: 'vec-length-no-root' },
    { content: math(ratLatex(absSum)), rule: 'vec-length-abs-sum' },
  ]
  if (!withSquares && negCount(v) > 0) {
    const signWrong = v.reduce((acc, x) => ratAdd(acc, ratSign(x) < 0 ? ratNeg(ratMul(x, x)) : ratMul(x, x)), rat(0))
    if (ratSign(signWrong) > 0) wrongs.push({ content: math(surdLatex(sqrtRat(signWrong))), rule: 'vec-square-sign' })
  }
  wrongs.push({ content: math(surdLatex(sqrtRat(absSum))), rule: 'vec-length-abs-sum' })
  if (!withSquares) {
    const doubled = v.reduce((acc, x) => ratAdd(acc, ratMul(rat(2), ratAbs(x))), rat(0))
    wrongs.push({ content: math(surdLatex(sqrtRat(doubled))), rule: 'vec-square-double' })
  }
  const formula = withSquares ? `\\lvert ${name} \\rvert = ${rootLatex(s, len)}` : `\\lvert ${name} \\rvert = \\sqrt{${squaresLatex(v)}} = ${rootLatex(s, len)}`
  return choiceStep(rng, {
    id: 'laenge',
    title: 'Länge',
    question: `Wie lang ist ${math(name)}?`,
    correct: math(surdLatex(len)),
    wrongs,
    hint: withSquares
      ? 'Die Summe der Quadrate ist das Quadrat der Länge. Ziehe die Wurzel und vereinfache sie, wenn es geht.'
      : 'Pythagoras: Quadriere die Einträge, addiere und ziehe die Wurzel.',
    explanation: {
      detailed: `Die Länge ist die Wurzel aus der Summe der Quadrate: $${formula}$.`,
      short: `$${formula}$.`,
    },
    established: [formula],
    cards: [CARD.laenge],
    ...(drawing ? { drawing } : {}),
  })
}

// Bild zur Länge: Pfeil mit Katheten (Ebene) bzw. Quader (Raum)
function lengthDrawing(dim: 2 | 3, name: string, v: Vec, from: Vec | null = null): VectorDrawing {
  const a = from ? nums(from) : origin(dim)
  const b = nums(from ? vecAdd(from, v) : v)
  const base = emptyDrawing(dim, dim === 2 ? `Die Einträge sind die Katheten, die Länge ist die Hypotenuse.` : `Die Einträge sind die Kanten eines Quaders, die Länge ist seine Raumdiagonale.`)
  const arrows: DrawArrow[] = [{ from: a, to: b, color: 'a', label: name }]
  if (dim === 2) {
    const corner = [b[0], a[1]]
    return {
      ...base,
      arrows,
      segments: [
        { from: a, to: corner, color: 'muted', dashed: true, phase: 1, label: ratLatex(ratAbs(v[0])) },
        { from: corner, to: b, color: 'muted', dashed: true, phase: 1, label: ratLatex(ratAbs(v[1])) },
      ],
    }
  }
  // Quader von a bis b: zwölf Kanten
  const corners = [0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k) => [i ? b[0] : a[0], j ? b[1] : a[1], k ? b[2] : a[2]])))
  const segments = corners.flatMap((c1, i) =>
    corners.slice(i + 1).flatMap((c2) => {
      const diff = c1.filter((x, k) => x !== c2[k]).length
      return diff === 1 ? [{ from: c1, to: c2, color: 'muted' as const, dashed: true, phase: 1 }] : []
    }),
  )
  return { ...base, arrows, segments }
}

// ------------------------------------------------------------------ Arten


// Verbindungsvektor: Stufe 1 in der Ebene mit „Welcher Pfeil?", sonst im Raum
function buildConnect(rng: Rng, level: Level): Built {
  const dim = level === 1 ? 2 : 3
  const [P, Q] = letters(rng).points
  let p = ints(rng, dim, -4, 4)
  let q = ints(rng, dim, -3, 5)
  while (vecEq(p, q) || negCount(p) === 0 || vecEq(vecSub(q, p), vecSub(p, q))) {
    p = ints(rng, dim, -4, 4)
    q = ints(rng, dim, -3, 5)
  }
  const name = arrowName(P, Q)
  const pts = [
    { name: P, at: p },
    { name: Q, at: q },
  ]
  if (rng.chance(0.35)) return buildEndpoint(rng, dim, P, Q, p, q)
  const steps: GuidedStep[] = []
  const caption = `Der Pfeil ${math(name)} beginnt bei $${P}$ und endet bei $${Q}$.`
  const result: VectorDrawing = { ...pointsDrawing(dim, pts, caption), arrows: [...pointsDrawing(dim, pts, caption).arrows, { from: nums(p), to: nums(q), color: 'r', label: name, phase: 1 }] }
  if (dim === 2) {
    const pick = (from: Vec, to: Vec, color: 'r' | 'bad' = 'r'): VectorDrawing => ({
      ...pointsDrawing(2, pts, '', false),
      arrows: [{ from: nums(from), to: nums(to), color }],
    })
    const zero = vec(0, 0)
    steps.push(
      choiceStep(rng, {
        id: 'pfeil',
        title: 'Bild',
        question: `Welcher Pfeil ist ${math(name)}?`,
        correct: `Pfeil von $${P}$ nach $${Q}$`,
        correctDrawing: pick(p, q),
        wrongs: [
          { content: `Pfeil von $${Q}$ nach $${P}$`, rule: 'vec-reversed', drawing: pick(q, p) },
          { content: `Pfeil vom Ursprung nach $${Q}$`, rule: 'vec-position-vector', drawing: pick(zero, q) },
          { content: `Pfeil von $${P}$ zum Punkt $${P} + ${Q}$`, rule: 'vec-added-points', drawing: pick(p, vecAdd(p, q)) },
        ],
        hint: `${math(name)} beginnt beim ersten Buchstaben und endet beim zweiten.`,
        explanation: { detailed: `${math(name)} führt vom Fuß $${P}$ zur Spitze $${Q}$.`, short: `Von $${P}$ nach $${Q}$.` },
        cards: [CARD.verbindung],
        drawing: pointsDrawing(2, pts, `Die Punkte $${P}$ und $${Q}$ mit ihren Ortsvektoren.`),
      }),
    )
  }
  steps.push(connectStep(rng, P, Q, p, q, dim === 3 ? pointsDrawing(3, pts, `Die Punkte $${P}$ und $${Q}$ im Raum.`) : undefined))
  const d = vecSub(q, p)
  return {
    kind: 'connect',
    instruction: `Berechne den Verbindungsvektor ${math(name)}.`,
    functionLatex: `${pointLatex(P, p)},\\; ${pointLatex(Q, q)}`,
    steps,
    cards: [CARD.verbindung],
    resultLatex: `${name} = ${vecLatex(d)}`,
    resultDrawing: result,
    form: `connect|${dim}|${P}|${signShape(p, q)}`,
    data: { p: nums(p), q: nums(q) },
    answer: nums(d),
  }
}

// Endpunkt aus Anfangspunkt und Verbindungsvektor: Q = P + PQ
function buildEndpoint(rng: Rng, dim: 2 | 3, P: string, Q: string, p: Vec, q: Vec): Built {
  const d = vecSub(q, p)
  const name = arrowName(P, Q)
  const slip = d.findIndex((x) => ratSign(x) < 0)
  const wrongs: Wrong[] = [
    { content: math(pointLatex(Q, vecSub(p, d))), rule: 'vec-reversed' },
    {
      content: math(pointLatex(Q, d)),
      rule: 'vec-position-vector',
      why: { detailed: `$${name}$ ist nur der Weg von $${P}$ nach $${Q}$. Der Punkt $${Q}$ liegt dort, wo dieser Weg ankommt, wenn er bei $${P}$ beginnt.`, short: `Der Weg beginnt bei $${P}$.` },
    },
    { content: math(pointLatex(Q, vecSub(d, p))), rule: 'vec-added-points' },
  ]
  if (slip >= 0) wrongs.push({ content: math(pointLatex(Q, q.map((x, i) => (i === slip ? ratSub(p[i], d[i]) : x)))), rule: 'vec-sign-slip' })
  const formula = `${Q} = ${P} + ${name} = ${vecLatex(p)} + ${vecLatex(d)} = ${vecLatex(q)}`
  const drawing: VectorDrawing = {
    ...emptyDrawing(dim, `Der Pfeil $${name}$ beginnt bei $${P}$; wo er endet, liegt $${Q}$.`),
    points: [
      { at: nums(p), label: P },
      { at: nums(q), label: Q, color: 'r', phase: 1 },
    ],
    arrows: [
      { from: origin(dim), to: nums(p), color: 'muted', ghost: true },
      { from: nums(p), to: nums(q), color: 'r', label: name, phase: 1, slideFrom: origin(dim) },
    ],
  }
  const step = choiceStep(rng, {
    id: 'endpunkt',
    title: 'Endpunkt',
    question: `Wo liegt $${Q}$?`,
    correct: math(pointLatex(Q, q)),
    wrongs,
    hint: `Gehe von $${P}$ aus den Weg $${name}$: Ortsvektor von $${P}$ plus $${name}$.`,
    explanation: { detailed: `Der Pfeil beginnt bei $${P}$ und endet bei $${Q}$: $${formula}$.`, short: `$${formula}$.` },
    established: [formula],
    cards: [CARD.verbindung],
    drawing: { ...drawing, points: drawing.points.slice(0, 1), arrows: drawing.arrows.slice(0, 1) },
  })
  return {
    kind: 'connect',
    instruction: `Der Pfeil $${name}$ beginnt bei $${P}$. Wo liegt $${Q}$?`,
    functionLatex: `${pointLatex(P, p)},\\; ${name} = ${vecLatex(d)}`,
    steps: [step],
    cards: [CARD.verbindung],
    resultLatex: pointLatex(Q, q),
    resultDrawing: drawing,
    form: `endpoint|${dim}|${P}|${signShape(p, d)}`,
    data: { p: nums(p), d: nums(d) },
    answer: nums(q),
  }
}

type Term = { readonly coef: Rational; readonly name: string; readonly v: Vec }

const termsLatex = (terms: readonly Term[]) => terms.map((t, i) => `${coefLatex(t.coef, i === 0)}${vecName(t.name)}`).join(' ')

// Vielfache und Summen: Stufe 1 in der Ebene (a − b, k·a, k·a − b), Stufe 2 im Raum k·a + m·b, Stufe 3 drei Vektoren
function buildCombo(rng: Rng, level: Level): Built {
  const dim = level === 1 ? 2 : 3
  const L = letters(rng).vecs
  const coefs = (): Rational[] => {
    const c = () => rat(rng.pick([2, 3, 4, -2, -3, -1, 1, 5]))
    if (level === 1) {
      const variant = rng.pick(['diff', 'scale', 'scaleDiff', 'diffScale'])
      if (variant === 'diff') return [rat(1), rat(-1)]
      if (variant === 'scale') return [rat(rng.pick([2, 3, 4, -2, -3]))]
      if (variant === 'scaleDiff') return [rat(rng.pick([2, 3, -2])), rat(-1)]
      return [rat(1), rat(rng.pick([-2, -3, 2, 3]))]
    }
    if (level === 2) {
      let k = c()
      let m = c()
      while (Math.abs(Number(k.n)) === 1 && Math.abs(Number(m.n)) === 1) m = c()
      return [k, m]
    }
    // Stufe 3: drei Vektoren oder ein halber
    if (rng.chance(0.5)) return [c(), c(), rat(rng.pick([1, -1]))]
    return [rat(rng.pick([1, -1, 1, 2])), rat(rng.pick([1, -1]), 2)]
  }
  for (;;) {
    const cs = coefs()
    const terms: Term[] = cs.map((coef, i) => {
      // ein halber Vektor hat gerade Einträge
      const half = coef.d === 2n
      const v = half ? vecScale(rat(2), ints(rng, dim, -3, 3, true)) : ints(rng, dim, -5, 5)
      return { coef, name: L[i], v }
    })
    const built = comboFromTerms(rng, dim, terms)
    if (built) return built
  }
}

function comboFromTerms(rng: Rng, dim: number, terms: readonly Term[]): Built | null {
  if (terms.some((t) => zeroCount(t.v) === dimOf(t.v))) return null
  const expr = termsLatex(terms)
  const scaled = terms.map((t) => vecScale(ratAbs(t.coef), t.v))
  const result = terms.reduce((acc, t) => vecAdd(acc, vecScale(t.coef, t.v)), vec(...origin(dim)))
  const steps: GuidedStep[] = []
  // je Vielfaches ein Schritt (Faktor ohne Vorzeichen; das Minus kommt beim Zusammenfassen)
  const single = terms.length === 1
  for (const [i, t] of terms.entries()) {
    // allein mit Vorzeichen (sonst fragt kein Schritt nach dem Ergebnis), in einer Summe ohne (das Minus kommt beim Zusammenfassen)
    const k = single ? t.coef : ratAbs(t.coef)
    if (ratAbs(k).n === 1n && ratAbs(k).d === 1n) continue
    const kv = single ? vecScale(k, t.v) : scaled[i]
    const kl = ratLatex(k)
    const first = t.v.findIndex((x) => !isZero(x))
    const last = t.v.length - 1 - [...t.v].reverse().findIndex((x) => !isZero(x))
    const only = (j: number) => t.v.map((x, idx) => (idx === j ? ratMul(k, x) : x))
    const wrongs: Wrong[] = [
      { content: math(vecLatex(only(first))), rule: 'vec-scale-first' },
      { content: math(vecLatex(only(last))), rule: 'vec-scale-first' },
    ]
    const neg = t.v.findIndex((x) => ratSign(x) < 0)
    if (single && ratSign(k) < 0) wrongs.push({ content: math(vecLatex(vecScale(ratAbs(k), t.v))), rule: 'vec-sign-slip', why: { detailed: 'Ein Minus vor dem Vektor dreht ihn um: Jeder Eintrag wechselt sein Vorzeichen.', short: 'Das Minus gilt für jeden Eintrag.' } })
    if (neg >= 0) wrongs.push({ content: math(vecLatex(kv.map((x, idx) => (idx === neg ? ratNeg(x) : x)))), rule: 'vec-sign-slip' })
    if (wrongs.filter((w) => w.content !== math(vecLatex(kv))).length < 2) return null
    const scaledName = `${kl}${vecName(t.name)}`
    steps.push(
      choiceStep(rng, {
        id: `vielfaches-${i + 1}`,
        title: 'Vielfaches',
        question: `Was ist $${scaledName}$?`,
        correct: math(vecLatex(kv)),
        wrongs,
        hint: `Nimm jeden Eintrag von $${vecName(t.name)}$ mit $${kl}$ mal.`,
        explanation: {
          detailed: `Die Zahl streckt den ganzen Pfeil, also jeden Eintrag: $${scaledName} = ${kl} \\cdot ${vecLatex(t.v)} = ${vecLatex(kv)}$.`,
          short: `$${scaledName} = ${vecLatex(kv)}$.`,
        },
        established: [`${scaledName} = ${vecLatex(kv)}`],
        cards: [CARD.rechnen],
      }),
    )
  }
  if (terms.length > 1) {
    const signs = terms.map((t) => ratSign(t.coef))
    const wrongs: Wrong[] = []
    // Vorzeichen übersehen: ein negativer Eintrag eines späteren Summanden mit falschem Vorzeichen
    for (let j = 1; j < terms.length; j++) {
      for (let i = 0; i < dim; i++) {
        if (ratSign(scaled[j][i]) >= 0) continue
        const wrong = result.map((x, idx) => (idx === i ? ratSub(x, ratMul(rat(2 * signs[j]), scaled[j][i])) : x))
        wrongs.push({ content: math(vecLatex(wrong)), rule: 'vec-sign-slip' })
      }
    }
    // Reihenfolge vertauscht beim Abziehen (zwei Summanden, der zweite mit Minus)
    if (terms.length === 2 && signs[1] < 0) {
      const reversed = vecSub(scaled[1], signs[0] < 0 ? vecScale(rat(-1), scaled[0]) : scaled[0])
      wrongs.splice(1, 0, { content: math(vecLatex(reversed)), rule: 'vec-reversed' })
    }
    if (new Set(wrongs.map((w) => w.content).filter((c) => c !== math(vecLatex(result)))).size < 2) return null
    const shown = terms.map((_, i) => ({ sign: signs[i] < 0 ? '-' : i === 0 ? '' : '+', v: scaled[i] }))
    const sumLatex = shown.map((s) => `${s.sign} ${vecLatex(s.v)}`).join(' ')
    steps.push(
      choiceStep(rng, {
        id: 'zusammenfassen',
        title: 'Zusammenfassen',
        question: `Was ist $${expr}$?`,
        correct: math(vecLatex(result)),
        wrongs: rng.shuffle(wrongs),
        hint: 'Rechne Eintrag für Eintrag und achte auf die Vorzeichen.',
        explanation: {
          detailed: `Eintrag für Eintrag: $${expr} = ${sumLatex} = ${vecLatex(result)}$.`,
          short: `$${sumLatex} = ${vecLatex(result)}$.`,
        },
        established: [`${expr} = ${sumLatex} = ${vecLatex(result)}`],
        cards: [CARD.rechnen],
      }),
    )
  }
  if (steps.length === 0) return null
  // Bild: die Vielfachen als Kette, der Ergebnispfeil vom Anfang zum Ende
  let drawing: VectorDrawing | undefined
  if (drawable(dim)) {
    const arrows: DrawArrow[] = []
    let at = vec(...origin(dim))
    const colors = ['a', 'b', 'c'] as const
    terms.forEach((t, i) => {
      const piece = vecScale(t.coef, t.v)
      const end = vecAdd(at, piece)
      arrows.push({ from: nums(at), to: nums(end), color: colors[i], label: `${coefLatex(t.coef, true)}${vecName(t.name)}`, phase: i === 0 ? 0 : i, ...(i > 0 ? { slideFrom: origin(dim) } : {}) })
      at = end
    })
    arrows.push({ from: origin(dim), to: nums(result), color: 'r', phase: terms.length, ...(terms.length > 1 ? {} : {}) })
    drawing = {
      ...emptyDrawing(dim, terms.length > 1 ? 'Die Pfeile werden aneinandergehängt. Der Ergebnispfeil führt vom Anfang bis zum Ende der Kette.' : 'Die Zahl streckt den Pfeil; ein Minus dreht ihn um.'),
      arrows: terms.length > 1 ? arrows : [{ from: origin(dim), to: nums(terms[0].v), color: 'a', ghost: true, label: vecName(terms[0].name) }, { ...arrows[0], color: 'r', phase: 1 }],
    }
  }
  const given = terms.map((t) => `${vecName(t.name)} = ${vecLatex(t.v)}`).join(',\\; ')
  const variant = terms.map((t) => (t.coef.d !== 1n ? 'h' : Math.abs(Number(t.coef.n)) === 1 ? (ratSign(t.coef) < 0 ? 'm' : 'p') : ratSign(t.coef) < 0 ? 'K' : 'k')).join('')
  return {
    kind: 'combo',
    instruction: `Berechne $${expr}$.`,
    functionLatex: given,
    steps,
    cards: [CARD.rechnen],
    resultLatex: `${expr} = ${vecLatex(result)}`,
    ...(drawing ? { resultDrawing: drawing } : {}),
    form: `combo|${dim}|${variant}|${terms[0].name}|${signShape(...terms.map((t) => t.v))}`,
    data: { coefs: terms.map((t) => Number(t.coef.n) / Number(t.coef.d)), ...Object.fromEntries(terms.map((t, i) => [`v${i}`, nums(t.v)])) },
    answer: nums(result),
  }
}

// Länge eines Vektors: Stufe 1 in der Ebene (ganze Zahl), Stufe 2 im Raum, Stufe 4 in vier oder fünf Dimensionen.
// Arten: Länge eines Vektors, Abstand eines Punkts vom Ursprung, Länge eines Vielfachen (|k·a| = |k|·|a|)
function buildLength(rng: Rng, level: Level): Built {
  const dim = level === 1 ? 2 : level === 2 ? 3 : rng.pick([4, 5])
  const { vecs, points } = letters(rng)
  const variant = level === 4 ? 'plain' : rng.pick(['plain', 'point', 'scaled', 'sum'] as const)
  if (variant === 'sum') return buildSumLength(rng, level === 1 ? 2 : 3, vecs)
  const base = level === 2 && rng.chance(0.6) ? nonSquareVec(rng, 3) : pythagorean(rng, dim).v
  const k = variant === 'scaled' ? rat(rng.pick([2, 3, -2, -3])) : rat(1)
  const v = vecScale(k, base)
  const P = points[0]
  const kAbs = ratLatex(ratAbs(k))
  const name = variant === 'point' ? arrowName('O', P) : variant === 'scaled' ? `${coefLatex(k, true)}${vecName(vecs[0])}` : vecName(vecs[0])
  const steps: GuidedStep[] = []
  // Vielfaches: erst ausrechnen (ohne Vorzeichen), dann die Länge
  const drawn = variant === 'scaled' ? vecScale(ratAbs(k), base) : v
  if (variant === 'scaled') {
    const neg = base.findIndex((x) => ratSign(x) < 0)
    steps.push(
      choiceStep(rng, {
        id: 'vielfaches',
        title: 'Vielfaches',
        question: `Was ist $${kAbs}${vecName(vecs[0])}$?`,
        correct: math(vecLatex(drawn)),
        wrongs: [
          { content: math(vecLatex(base.map((x, i) => (i === 0 ? ratMul(ratAbs(k), x) : x)))), rule: 'vec-scale-first' },
          { content: math(vecLatex(base.map((x, i) => (i === base.length - 1 ? ratMul(ratAbs(k), x) : x)))), rule: 'vec-scale-first' },
          ...(neg >= 0 ? [{ content: math(vecLatex(drawn.map((x, i) => (i === neg ? ratNeg(x) : x)))), rule: 'vec-sign-slip' }] : []),
        ],
        hint: `Nimm jeden Eintrag mit $${kAbs}$ mal. Ein Minus davor ändert die Richtung, nicht die Länge.`,
        explanation: {
          detailed: `Jeder Eintrag wird gestreckt: $${kAbs}${vecName(vecs[0])} = ${vecLatex(drawn)}$. Ein Minus davor dreht den Pfeil nur um, die Länge bleibt.`,
          short: `$${kAbs}${vecName(vecs[0])} = ${vecLatex(drawn)}$.`,
        },
        established: [`${kAbs}${vecName(vecs[0])} = ${vecLatex(drawn)}`],
        cards: [CARD.rechnen],
      }),
    )
  }
  const plainDrawing = drawable(dim) ? lengthDrawing(dim, name, drawn) : undefined
  const drawing: VectorDrawing | undefined =
    plainDrawing && variant === 'point'
      ? { ...plainDrawing, points: [{ at: nums(v), label: P }], caption: `Der Abstand von $${P}$ zum Ursprung $O$ ist die Länge des Ortsvektors.` }
      : plainDrawing
  const rootName = variant === 'scaled' ? `${kAbs}${vecName(vecs[0])}` : name
  if (level === 1 || variant === 'scaled') steps.push(rootStep(rng, rootName, drawn, false, drawing))
  else steps.push(squaresStep(rng, name, v, drawing), rootStep(rng, name, v, true))
  const len = sqrtRat(vecNorm2(v))
  const given = variant === 'point' ? pointLatex(P, v) : `${vecName(vecs[0])} = ${vecLatex(base)}`
  const instruction = variant === 'point' ? `Wie weit ist $${P}$ vom Ursprung $O$ entfernt?` : `Wie lang ist $${name}$?`
  return {
    kind: 'length',
    instruction,
    functionLatex: given,
    steps,
    cards: variant === 'scaled' ? [CARD.rechnen, CARD.laenge] : [CARD.laenge],
    resultLatex: `\\lvert ${name} \\rvert = ${surdLatex(len)}`,
    ...(drawing ? { resultDrawing: drawing } : {}),
    ...(dim > 3 ? { note: 'In mehr als drei Dimensionen gibt es kein Bild, gerechnet wird genauso.' } : {}),
    form: `length|${dim}|${variant}|${variant === 'scaled' ? coefLatex(k, true) : ''}|${variant === 'point' ? P : vecs[0]}|${len.rad === 1n ? 'int' : 'root'}|${signShape(base)}`,
    answer: [surdNumber(len)],
    data: { v: nums(v) },
  }
}

// Länge einer Summe oder Differenz |a ± b|: erst zusammenfassen, dann die Länge
function buildSumLength(rng: Rng, dim: 2 | 3, vecs: readonly string[]): Built {
  for (;;) {
    const w = pythagorean(rng, dim).v
    const a = ints(rng, dim, -4, 5)
    const sign = rng.pick([1, -1])
    const b = sign > 0 ? vecSub(w, a) : vecSub(a, w)
    if (zeroCount(a) === dim || zeroCount(b) === dim) continue
    const terms: Term[] = [
      { coef: rat(1), name: vecs[0], v: a },
      { coef: rat(sign), name: vecs[1], v: b },
    ]
    const built = comboFromTerms(rng, dim, terms)
    if (!built) continue
    const name = termsLatex(terms)
    const drawing = lengthDrawing(dim, name, w)
    const len = sqrtRat(vecNorm2(w))
    return {
      kind: 'length',
      instruction: `Wie lang ist $${name}$?`,
      functionLatex: built.functionLatex,
      steps: [...built.steps, rootStep(rng, `(${name})`, w, false, drawing)],
      cards: [CARD.rechnen, CARD.laenge],
      resultLatex: `\\lvert ${name} \\rvert = ${surdLatex(len)}`,
      resultDrawing: drawing,
      form: `length|${dim}|sum|${sign}|${vecs[0]}|${signShape(a, b)}`,
      answer: [surdNumber(len)],
      data: { a: nums(a), b: nums(b), sign: [sign] },
    }
  }
}

const surdNumber = (s: Surd) => (Number(s.coef.n) / Number(s.coef.d)) * Math.sqrt(Number(s.rad))

// Vektor im Raum, dessen Länge keine ganze Zahl ist (teils mit Wurzel, die sich vereinfachen lässt)
function nonSquareVec(rng: Rng, dim: number): Vec {
  for (;;) {
    const v = ints(rng, dim, -5, 5)
    const s = vecNorm2(v)
    if (negCount(v) > 0 && zeroCount(v) < 2 && sqrtRat(s).rad !== 1n) return v
  }
}

// Abstand zweier Punkte: Verbindungsvektor, Quadrate, Wurzel
function buildDistance(rng: Rng, level: Level): Built {
  const dim = level === 2 ? 3 : level === 3 ? rng.pick([2, 3]) : rng.pick([4, 5])
  const [P, Q] = letters(rng).points
  let p = ints(rng, dim, -4, 4)
  while (negCount(p) === 0) p = ints(rng, dim, -4, 4)
  const d = level === 2 && rng.chance(0.5) ? nonSquareVec(rng, dim) : pythagorean(rng, dim).v
  const q = vecAdd(p, d)
  const name = arrowName(P, Q)
  const pts = [
    { name: P, at: p },
    { name: Q, at: q },
  ]
  const drawing = drawable(dim) ? { ...lengthDrawing(dim, name, d, p), points: pts.map((x) => ({ at: nums(x.at), label: x.name })) } : undefined
  const steps = [connectStep(rng, P, Q, p, q, drawable(dim) ? pointsDrawing(dim, pts, `Die Punkte $${P}$ und $${Q}$.`) : undefined), squaresStep(rng, name, d), rootStep(rng, name, d, true, drawing)]
  const len = sqrtRat(vecNorm2(d))
  return {
    kind: 'distance',
    instruction: `Wie weit sind die Punkte $${P}$ und $${Q}$ voneinander entfernt?`,
    functionLatex: `${pointLatex(P, p)},\\; ${pointLatex(Q, q)}`,
    steps,
    cards: [CARD.verbindung, CARD.laenge],
    resultLatex: `\\lvert ${name} \\rvert = ${surdLatex(len)}`,
    ...(drawing ? { resultDrawing: drawing } : {}),
    ...(dim > 3 ? { note: 'In mehr als drei Dimensionen gibt es kein Bild, gerechnet wird genauso.' } : {}),
    form: `distance|${dim}|${P}|${len.rad === 1n ? 'int' : 'root'}|${signShape(p, d)}`,
    data: { p: nums(p), q: nums(q) },
    answer: [Number(len.coef.n) / Number(len.coef.d) * Math.sqrt(Number(len.rad))],
  }
}

// Mittelpunkt einer Strecke
function buildMidpoint(rng: Rng, level: Level): Built {
  const dim = level === 1 ? 2 : level === 2 ? 3 : rng.pick([4, 5])
  const [P, Q] = letters(rng).points
  for (;;) {
    const p = ints(rng, dim, -5, 5)
    const q = ints(rng, dim, -5, 5)
    const sum = vecAdd(p, q)
    // Stufe 1: ganze Zahlen
    if (level === 1 && sum.some((x) => x.n % 2n !== 0n)) continue
    if (vecEq(p, q) || negCount(p) + negCount(q) === 0 || zeroCount(p) === dim) continue
    const m = vecScale(rat(1, 2), sum)
    const halfDiff = vecScale(rat(1, 2), vecSub(q, p))
    const mLatex = (v: Vec) => pointLatex('M', v)
    const pts = [
      { name: P, at: p },
      { name: Q, at: q },
    ]
    const drawing: VectorDrawing | undefined = drawable(dim)
      ? {
          ...emptyDrawing(dim, `Der Mittelpunkt $M$ liegt genau in der Mitte zwischen $${P}$ und $${Q}$.`),
          points: [...pts.map((x) => ({ at: nums(x.at), label: x.name })), { at: nums(m), label: 'M', color: 'r', phase: 1 }],
          segments: [{ from: nums(p), to: nums(q), color: 'muted' }],
          arrows: pts.map((x) => ({ from: origin(dim), to: nums(x.at), color: 'muted' as const, ghost: true })),
        }
      : undefined
    const formula = `M = \\tfrac{1}{2}\\left(${vecLatex(p)} + ${vecLatex(q)}\\right) = ${vecLatex(m)}`
    const step = choiceStep(rng, {
      id: 'mittelpunkt',
      title: 'Mittelpunkt',
      question: `Wo liegt der Mittelpunkt $M$ der Strecke $\\overline{${P}${Q}}$?`,
      correct: math(mLatex(m)),
      wrongs: [
        { content: math(mLatex(halfDiff)), rule: 'vec-midpoint-half-diff' },
        { content: math(mLatex(sum)), rule: 'vec-midpoint-no-half' },
        { content: math(mLatex(vecScale(rat(1, 2), vecSub(p, q)))), rule: 'vec-midpoint-half-diff' },
      ],
      hint: 'Der Mittelpunkt ist der Durchschnitt der beiden Punkte, Eintrag für Eintrag.',
      explanation: { detailed: `Durchschnitt der Ortsvektoren: $${formula}$.`, short: `$${formula}$.` },
      established: [formula],
      cards: [CARD.mittelpunkt],
      ...(drawing ? { drawing: { ...drawing, points: drawing.points.filter((x) => x.label !== 'M') } } : {}),
    })
    return {
      kind: 'midpoint',
      instruction: `Bestimme den Mittelpunkt $M$ der Strecke $\\overline{${P}${Q}}$.`,
      functionLatex: `${pointLatex(P, p)},\\; ${pointLatex(Q, q)}`,
      steps: [step],
      cards: [CARD.mittelpunkt],
      resultLatex: mLatex(m),
      ...(drawing ? { resultDrawing: drawing } : {}),
      form: `midpoint|${dim}|${P}|${m.some((x) => x.d !== 1n) ? 'half' : 'int'}|${signShape(p, q)}`,
      data: { p: nums(p), q: nums(q) },
      answer: nums(m),
    }
  }
}

// Einheitsvektor: Länge, dann durch die Länge teilen
function buildUnit(rng: Rng, level: Level): Built {
  const dim = level === 2 ? 3 : rng.pick([4, 5])
  const L = letters(rng).vecs
  const name = vecName(L[0])
  const v = level === 2 && rng.chance(0.5) ? nonSquareVec(rng, 3) : pythagorean(rng, dim).v
  const s = vecNorm2(v)
  const len = sqrtRat(s)
  const lenL = surdLatex(len)
  const unit = `\\frac{1}{${lenL}}${vecLatex(v)}`
  const unitName = `${name}^{\\,0}`
  const drawing: VectorDrawing | undefined = drawable(dim)
    ? {
        ...emptyDrawing(dim, `Der Einheitsvektor zeigt in dieselbe Richtung wie $${name}$ und hat die Länge $1$.`),
        arrows: [
          { from: origin(dim), to: nums(v), color: 'a', label: name },
          { from: origin(dim), to: nums(v).map((x) => x / (Number(len.coef.n) / Number(len.coef.d) * Math.sqrt(Number(len.rad)))), color: 'r', label: unitName, phase: 1 },
        ],
      }
    : undefined
  const steps = [
    squaresStep(rng, name, v),
    rootStep(rng, name, v, true),
    choiceStep(rng, {
      id: 'einheitsvektor',
      title: 'Einheitsvektor',
      question: `Wie lautet der Einheitsvektor $${unitName}$?`,
      correct: math(unit),
      wrongs: [
        { content: math(`\\frac{1}{${ratLatex(s)}}${vecLatex(v)}`), rule: 'vec-unit-squared' },
        { content: math(`${lenL}${vecLatex(v)}`), rule: 'vec-unit-times' },
        { content: math(`\\frac{1}{${ratLatex(v.reduce((a, x) => ratAdd(a, ratAbs(x)), rat(0)))}}${vecLatex(v)}`), rule: 'vec-length-abs-sum' },
      ],
      hint: `Teile $${name}$ durch seine Länge: $${unitName} = \\frac{1}{\\lvert ${name} \\rvert}\\,${name}$.`,
      explanation: {
        detailed: `Teilt man durch die Länge, hat der neue Vektor die Länge $1$ und dieselbe Richtung: $${unitName} = ${unit}$.`,
        short: `$${unitName} = ${unit}$.`,
      },
      established: [`${unitName} = ${unit}`],
      cards: [CARD.einheit],
      ...(drawing ? { drawing: { ...drawing, arrows: drawing.arrows.slice(0, 1) } } : {}),
    }),
  ]
  return {
    kind: 'unit',
    instruction: `Bestimme den Einheitsvektor von $${name}$.`,
    functionLatex: `${name} = ${vecLatex(v)}`,
    steps,
    cards: [CARD.laenge, CARD.einheit],
    resultLatex: `${unitName} = ${unit}`,
    ...(drawing ? { resultDrawing: drawing } : {}),
    form: `unit|${dim}|${L[0]}|${len.rad === 1n ? 'int' : 'root'}|${signShape(v)}`,
    data: { v: nums(v) },
    answer: nums(v).map((x) => x / (Number(len.coef.n) / Number(len.coef.d) * Math.sqrt(Number(len.rad)))),
  }
}

// Vektor gegebener Länge gleichsinnig oder gegensinnig zu a (Stufe 5: zu einem Verbindungsvektor)
function buildGivenLength(rng: Rng, level: Level): Built {
  const dim = level === 3 ? rng.pick([2, 3]) : level === 4 ? rng.pick([4, 5]) : rng.pick([3, 4])
  const fromPoints = level === 5 || (level === 3 && rng.chance(0.4))
  const { vecs, points } = letters(rng)
  const { v: a, length: l0 } = pythagorean(rng, dim)
  let target = rng.int(2, 12)
  while (target === l0) target = rng.int(2, 12)
  const same = rng.chance(0.5)
  const sign = same ? 1 : -1
  const k = rat(sign * target, l0)
  const result = vecScale(k, a)
  const P = points[0]
  const Q = points[1]
  const p = fromPoints ? ints(rng, dim, -3, 3) : null
  const q = p ? vecAdd(p, a) : null
  const name = fromPoints ? arrowName(P, Q) : vecName(vecs[0])
  const resName = vecName(fromPoints ? vecs[0] : vecs[1])
  const dirWord = same ? 'gleichsinnig' : 'gegensinnig'
  const drawing: VectorDrawing | undefined = drawable(dim)
    ? {
        ...emptyDrawing(dim, `$${resName}$ liegt auf derselben Geraden wie $${name}$, ${same ? 'in dieselbe Richtung' : 'in die Gegenrichtung'}, und hat die Länge $${target}$.`),
        arrows: [
          { from: origin(dim), to: nums(a), color: 'a', label: name },
          { from: origin(dim), to: nums(result), color: 'r', label: resName, phase: 1 },
        ],
      }
    : undefined
  const steps: GuidedStep[] = []
  if (p && q) steps.push(connectStep(rng, P, Q, p, q))
  steps.push(rootStep(rng, name, a, false, drawing ? { ...drawing, arrows: drawing.arrows.slice(0, 1) } : undefined))
  const signL = same ? '' : '-'
  const formula = `${resName} = ${signL}\\frac{${target}}{${l0}}${vecLatex(a)} = ${vecLatex(result)}`
  steps.push(
    choiceStep(rng, {
      id: 'gegebene-laenge',
      title: `Länge ${target}`,
      question: `Welcher Vektor hat die Länge $${target}$ und ist ${dirWord} zu $${name}$?`,
      correct: math(vecLatex(result)),
      wrongs: [
        { content: math(vecLatex(vecScale(rat(sign * target), a))), rule: 'vec-not-normalized' },
        { content: math(vecLatex(vecScale(ratNeg(k), a))), rule: 'vec-direction-sign' },
        { content: math(vecLatex(vecScale(rat(sign * target, l0 * l0), a))), rule: 'vec-unit-squared' },
      ],
      hint: `Erst auf die Länge $1$ bringen (durch $${l0}$ teilen), dann mit $${target}$ malnehmen; ${same ? 'gleichsinnig: positiver Faktor' : 'gegensinnig: negativer Faktor'}.`,
      explanation: { detailed: `Einheitsvektor mal gewünschte Länge, ${same ? 'mit Plus' : 'mit Minus für die Gegenrichtung'}: $${formula}$.`, short: `$${formula}$.` },
      established: [formula],
      cards: [CARD.einheit],
    }),
  )
  return {
    kind: 'givenLength',
    instruction: `Bestimme den Vektor $${resName}$ der Länge $${target}$, der ${dirWord} zu $${name}$ ist.`,
    functionLatex: p && q ? `${pointLatex(P, p)},\\; ${pointLatex(Q, q)}` : `${name} = ${vecLatex(a)}`,
    steps,
    cards: [CARD.laenge, CARD.einheit],
    resultLatex: `${resName} = ${vecLatex(result)}`,
    ...(drawing ? { resultDrawing: drawing } : {}),
    form: `givenLength|${dim}|${same ? 'same' : 'opp'}|${fromPoints ? P : vecs[0]}|${resName}|${result.some((x) => x.d !== 1n) ? 'frac' : 'int'}|${signShape(a)}`,
    data: { a: nums(a), target: [target], sign: [sign], ...(p && q ? { p: nums(p), q: nums(q) } : {}) },
    answer: nums(result),
  }
}

// Vierter Punkt eines Parallelogramms ABCD
function buildParallelogram(rng: Rng, level: Level): Built {
  const dim = level === 3 ? rng.pick([2, 3]) : 3
  const names = rng.pick([['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['E', 'F', 'G', 'H']] as const)
  const quad = names.join('')
  for (;;) {
    const A = ints(rng, dim, -3, 3)
    const u = ints(rng, dim, -3, 4)
    const w = ints(rng, dim, -3, 4)
    // nicht parallel
    const cross = dim === 2 ? ratSub(ratMul(u[0], w[1]), ratMul(u[1], w[0])) : rat(Number(vecNorm2(u).n) * Number(vecNorm2(w).n) - Number(dotNum(u, w)) ** 2)
    if (isZero(cross) || zeroCount(u) === dim || zeroCount(w) === dim) continue
    const P = [A, vecAdd(A, u), vecAdd(vecAdd(A, u), w), vecAdd(A, w)]
    const missing = rng.pick([3, 2, 1])
    // gegenüberliegende Seiten: fehlende Ecke X = Nachbar + (anderer Nachbar zum Gegenüber)
    const prev = (missing + 3) % 4
    const next = (missing + 1) % 4
    const opp = (missing + 2) % 4
    const X = names[missing]
    // X = prev + (opp → next)... im Parallelogramm gilt X = prev + next − opp
    const correct = vecSub(vecAdd(P[prev], P[next]), P[opp])
    const corner = vecSub(vecAdd(P[opp], P[next]), P[prev])
    const shift = vecSub(P[next], P[opp])
    const sideName = arrowName(names[opp], names[next])
    const known = [0, 1, 2, 3].filter((i) => i !== missing)
    const pts = known.map((i) => ({ name: names[i], at: P[i] }))
    const drawing: VectorDrawing | undefined = drawable(dim)
      ? {
          ...emptyDrawing(dim, `Im Parallelogramm $${quad}$ sind gegenüberliegende Seiten gleich lang und parallel.`),
          points: [...pts.map((x) => ({ at: nums(x.at), label: x.name })), { at: nums(correct), label: X, color: 'r', phase: 1 }],
          segments: [
            { from: nums(P[opp]), to: nums(P[next]), color: 'muted' },
            { from: nums(P[opp]), to: nums(P[prev]), color: 'muted' },
          ],
          polygons: [{ points: P.map(nums), color: 'r', phase: 1 }],
          arrows: [{ from: nums(P[prev]), to: nums(correct), color: 'b', label: sideName, phase: 1, slideFrom: nums(P[opp]) }],
        }
      : undefined
    const given = known.map((i) => pointLatex(names[i], P[i])).join(',\\; ')
    const step1 = choiceStep(rng, {
      id: 'seite',
      title: 'Gleiche Seiten',
      question: `Welcher Vektor führt von $${names[prev]}$ nach $${X}$?`,
      correct: math(sideName),
      wrongs: [
        { content: math(arrowName(names[next], names[opp])), rule: 'vec-reversed' },
        { content: math(arrowName(names[prev], names[opp])), rule: 'vec-parallelogram-corner' },
        { content: math(arrowName(names[opp], names[prev])), rule: 'vec-parallelogram-corner' },
      ],
      hint: `Gegenüberliegende Seiten sind gleich: Suche die Seite, die zu $\\overline{${names[prev]}${X}}$ parallel ist, und achte auf die Richtung.`,
      explanation: {
        detailed: `Die Seite $\\overline{${names[prev]}${X}}$ liegt gegenüber von $\\overline{${names[opp]}${names[next]}}$ und zeigt in dieselbe Richtung. Also $${arrowName(names[prev], X)} = ${sideName}$.`,
        short: `$${arrowName(names[prev], X)} = ${sideName}$.`,
      },
      established: [`${arrowName(names[prev], X)} = ${sideName} = ${vecLatex(shift)}`],
      cards: [CARD.parallelogramm],
      ...(drawing ? { drawing: { ...drawing, points: drawing.points.slice(0, 3), polygons: [], arrows: [] } } : {}),
    })
    const formula = `${X} = ${names[prev]} + ${sideName} = ${vecLatex(P[prev])} + ${vecLatex(shift)} = ${vecLatex(correct)}`
    const step2 = choiceStep(rng, {
      id: 'ecke',
      title: `Punkt ${X}`,
      question: `Wo liegt $${X}$?`,
      correct: math(pointLatex(X, correct)),
      wrongs: [
        { content: math(pointLatex(X, corner)), rule: 'vec-parallelogram-corner' },
        { content: math(pointLatex(X, vecSub(P[prev], shift))), rule: 'vec-reversed' },
        { content: math(pointLatex(X, shift)), rule: 'vec-position-vector', why: { detailed: `$${sideName}$ ist nur der Weg. Der Punkt $${X}$ liegt dort, wo dieser Weg ankommt, wenn er bei $${names[prev]}$ beginnt.`, short: `Der Weg beginnt bei $${names[prev]}$.` } },
      ],
      hint: `Gehe von $${names[prev]}$ aus den Weg $${sideName}$.`,
      explanation: { detailed: `$${formula}$.`, short: `$${formula}$.` },
      established: [formula],
      cards: [CARD.parallelogramm],
    })
    let steps = [step1, step2]
    let resultLatex = pointLatex(X, correct)
    let answer = nums(correct)
    let instruction = `Die Punkte bilden ein Parallelogramm $${quad}$. Wo liegt $${X}$?`
    // Stufe 5: dazu die Länge der Diagonale durch den neuen Punkt
    if (level === 5) {
      const diag = vecSub(correct, P[(missing + 2) % 4])
      const dName = arrowName(names[opp], X)
      const len = sqrtRat(vecNorm2(diag))
      steps = [...steps, connectStep(rng, names[opp], X, P[opp], correct), rootStep(rng, dName, diag, false)]
      resultLatex = `${resultLatex},\\; \\lvert ${dName} \\rvert = ${surdLatex(len)}`
      answer = [...answer, Number(len.coef.n) / Number(len.coef.d) * Math.sqrt(Number(len.rad))]
      instruction = `Die Punkte bilden ein Parallelogramm $${quad}$. Wo liegt $${X}$, und wie lang ist die Diagonale $\\overline{${names[opp]}${X}}$?`
    }
    if (new Set(steps.flatMap((s) => s.choices.length)).has(2)) continue
    return {
      kind: 'parallelogram',
      instruction,
      functionLatex: given,
      steps,
      cards: [CARD.parallelogramm],
      resultLatex,
      ...(drawing ? { resultDrawing: drawing } : {}),
      form: `parallelogram|${dim}|${X}|${level}|${signShape(A, u, w)}`,
      data: { A: nums(P[0]), B: nums(P[1]), C: nums(P[2]), D: nums(P[3]), missing: [missing] },
      answer,
    }
  }
}

const dotNum = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + Number(x.n) * Number(b[i].n), 0)

// Vektorgleichung k·x ± a = b nach x auflösen
function buildEquation(rng: Rng, level: Level): Built {
  const dim = level === 3 ? rng.pick([2, 3]) : 3
  const { vecs } = letters(rng)
  const [aL, bL] = [vecs[0], vecs[1]]
  const xL = '\\vec x'
  for (;;) {
    const k = rat(rng.pick(level === 5 ? [2, 3, 4, -2, -3, 5] : [2, 3, 4, -2, -3]))
    const sa = rng.pick([1, -1])
    const lead = rng.chance(0.5)
    const x = ints(rng, dim, -4, 4)
    const a = ints(rng, dim, -5, 5, false)
    if (zeroCount(x) === dim || zeroCount(a) === dim || negCount(a) === 0) continue
    // Stufe 5: Lösung mit Brüchen
    const xs = level === 5 && rng.chance(0.6) ? vecScale(rat(1, 2), x.map((v) => (v.n % 2n === 0n ? ratAdd(v, rat(1)) : v))) : x
    const b = vecAdd(vecScale(k, xs), vecScale(rat(sa), a))
    const A = vecName(aL)
    const B = vecName(bL)
    const kx = `${coefLatex(k, true)}${xL}`
    const aTerm = sa < 0 ? `- ${A}` : `+ ${A}`
    const lhs = lead ? `${kx} ${aTerm}` : `${sa < 0 ? '-' : ''}${A} ${ratSign(k) < 0 ? '-' : '+'} ${coefLatex(ratAbs(k), true)}${xL}`
    const eqLatex = `${lhs} = ${B}`
    const move = sa < 0 ? `$${A}$ auf beiden Seiten addieren` : `$${A}$ auf beiden Seiten abziehen`
    const wrongMove = sa < 0 ? `$${A}$ auf beiden Seiten abziehen` : `$${A}$ auf beiden Seiten addieren`
    const step1 = choiceStep(rng, {
      id: 'umformung',
      title: 'Umformung',
      question: 'Was machst du als Nächstes?',
      correct: move,
      wrongs: [
        { content: `Beide Seiten durch $${A}$ teilen`, rule: 'vec-divide-by-vector' },
        { content: wrongMove, rule: 'vec-sign-slip', why: { detailed: `So bleibt $${A}$ nicht weg, sondern steht doppelt da. Ein Summand verschwindet nur mit der Gegenrechnung: ${sa < 0 ? 'Minus' : 'Plus'} wird mit ${sa < 0 ? 'Plus' : 'Minus'} weggeschafft.`, short: 'Die Gegenrechnung schafft einen Summanden weg.' } },
        { content: `Beide Seiten durch $${B}$ teilen`, rule: 'vec-divide-by-vector' },
      ],
      hint: `Zuerst muss alles ohne $${xL}$ auf die andere Seite, wie bei einer Gleichung mit Zahlen. Durch Vektoren teilt man nie.`,
      explanation: {
        detailed: `Wie bei Zahlen: Erst den Summanden ohne $${xL}$ mit der Gegenrechnung wegschaffen, dann durch die Zahl vor $${xL}$ teilen. Teilen durch einen Vektor gibt es nicht.`,
        short: 'Erst die Gegenrechnung, dann durch die Zahl teilen.',
      },
      established: [`${coefLatex(k, true)}${xL} = ${B} ${sa < 0 ? '+' : '-'} ${A}`],
      cards: [CARD.gleichung],
    })
    const rhs = vecSub(b, vecScale(rat(sa), a))
    const kl = ratLatex(k)
    const partial = vecSub(vecScale(ratDiv(rat(1), k), b), vecScale(rat(sa), a))
    const inv = ratSign(k) < 0 ? `-\\frac{1}{${ratLatex(ratAbs(k))}}` : `\\frac{1}{${kl}}`
    const formula = `${xL} = ${inv}\\left(${B} ${sa < 0 ? '+' : '-'} ${A}\\right) = ${inv}${vecLatex(rhs)} = ${vecLatex(xs)}`
    const step2 = choiceStep(rng, {
      id: 'loesung',
      title: 'Lösung',
      question: `Was ist $${xL}$?`,
      correct: math(vecLatex(xs)),
      wrongs: [
        { content: math(vecLatex(partial)), rule: 'vec-equation-partial-divide' },
        { content: math(vecLatex(rhs)), rule: 'vec-equation-no-divide' },
        { content: math(vecLatex(vecScale(ratDiv(rat(1), k), vecAdd(b, vecScale(rat(sa), a))))), rule: 'vec-sign-slip' },
      ],
      hint: `Rechne erst die rechte Seite aus, dann teile jeden Eintrag durch $${kl}$.`,
      explanation: { detailed: `$${formula}$.`, short: `$${formula}$.` },
      established: [formula],
      cards: [CARD.gleichung],
    })
    if (step2.choices.length < 3) continue
    let drawing: VectorDrawing | undefined
    if (drawable(dim)) {
      const first = vecScale(rat(sa), a)
      drawing = {
        ...emptyDrawing(dim, `Gleichung als Kette: $${sa < 0 ? '-' : ''}${A}$ und $${coefLatex(k, true)}${xL}$ hintereinander ergeben $${B}$.`),
        arrows: [
          { from: origin(dim), to: nums(b), color: 'b', label: B },
          { from: origin(dim), to: nums(first), color: 'a', label: `${sa < 0 ? '-' : ''}${A}` },
          { from: nums(first), to: nums(b), color: 'r', label: `${coefLatex(k, true)}${xL}`, phase: 1, slideFrom: origin(dim) },
        ],
      }
    }
    const given = `${A} = ${vecLatex(a)},\\; ${B} = ${vecLatex(b)}`
    return {
      kind: 'equation',
      instruction: `Löse die Gleichung $${eqLatex}$ nach $${xL}$ auf.`,
      functionLatex: given,
      steps: [step1, step2],
      cards: [CARD.gleichung],
      resultLatex: `${xL} = ${vecLatex(xs)}`,
      ...(drawing ? { resultDrawing: drawing } : {}),
      form: `equation|${dim}|${lead ? 'kx' : 'ax'}|${sa}|${ratSign(k)}|${aL}|${xs.some((v) => v.d !== 1n) ? 'frac' : 'int'}`,
      data: { k: [Number(k.n) / Number(k.d)], sa: [sa], a: nums(a), b: nums(b) },
      answer: nums(xs),
    }
  }
}

const paramEntry = (c: number, t: string) => (c === 1 ? t : c === -1 ? `-${t}` : `${c}${t}`)

// Für welche Werte des Parameters hat der Vektor die gegebene Länge? (zwei Lösungen)
function buildParamLength(rng: Rng, level: Level): Built {
  const dim = level === 4 ? rng.pick([2, 3]) : rng.pick([3, 4])
  const { vecs } = letters(rng)
  const t = rng.pick(PARAMS)
  const name = vecName(vecs[0])
  for (;;) {
    const { v, length: L } = pythagorean(rng, dim)
    const i = rng.int(0, dim - 1)
    const e = Math.abs(Number(v[i].n))
    const divisors = [1, 2, 3].filter((c) => e % c === 0)
    const c = rng.pick(divisors) * (rng.chance(0.3) ? -1 : 1)
    const t0 = e / Math.abs(c)
    const others = v.filter((_, j) => j !== i)
    const rest = vecNorm2(others)
    if (Math.abs(c) === 1 && negCount(others) === 0) continue
    const entries = v.map((x, j) => (j === i ? paramEntry(c, t) : ratLatex(x)))
    const c2 = c * c
    const tSq = c2 === 1 ? `${t}^2` : `${c2}${t}^2`
    const restL = ratLatex(rest)
    const eqn = `${tSq} + ${restL} = ${L * L}`
    const signRest = others.reduce((acc, x) => ratAdd(acc, ratSign(x) < 0 ? ratNeg(ratMul(x, x)) : ratMul(x, x)), rat(0))
    const wrongs1: Wrong[] = [{ content: math(`${tSq} + ${restL} = ${L}`), rule: 'vec-length-target-not-squared' }]
    if (Math.abs(c) !== 1) wrongs1.push({ content: math(`${Math.abs(c)}${t}^2 + ${restL} = ${L * L}`), rule: 'vec-param-square' })
    if (negCount(others) > 0 && !isZero(signRest)) wrongs1.push({ content: math(`${tSq} ${ratSign(signRest) < 0 ? '-' : '+'} ${ratLatex(ratAbs(signRest))} = ${L * L}`), rule: 'vec-square-sign' })
    const squares = v.map((x, j) => (j === i ? `(${paramEntry(c, t)})^2` : `${ratFactorLatex(x)}^2`)).join(' + ')
    const step1 = choiceStep(rng, {
      id: 'gleichung',
      title: 'Gleichung',
      question: `Welche Gleichung beschreibt $\\lvert ${name} \\rvert = ${L}$?`,
      correct: math(eqn),
      wrongs: wrongs1,
      hint: `Die Summe der Quadrate ist das Quadrat der Länge. Quadriere den ganzen Eintrag mit $${t}$.`,
      explanation: { detailed: `$\\lvert ${name} \\rvert^2 = ${squares} = ${L * L}$, zusammengefasst $${eqn}$.`, short: `$${eqn}$.` },
      established: [`${squares} = ${L}^2`, `${eqn}`],
      cards: [CARD.parameter],
    })
    const sol = `${t}_1 = ${-t0},\\; ${t}_2 = ${t0}`
    const wrongs2: Wrong[] = [{ content: math(`${t} = ${t0}`), rule: 'vec-one-solution' }]
    if (t0 !== 1) wrongs2.push({ content: math(`${t}_1 = ${-t0 * t0},\\; ${t}_2 = ${t0 * t0}`), rule: 'vec-length-no-root' })
    const bad = (L - Number(rest.n)) / c2
    if (bad > 0) wrongs2.push({ content: math(`${t}_{1,2} = \\pm ${surdLatex(sqrtRat(rat(L - Number(rest.n), c2)))}`), rule: 'vec-length-target-not-squared' })
    wrongs2.push({ content: math(`${t} = ${-t0}`), rule: 'vec-one-solution' })
    const step2 = choiceStep(rng, {
      id: 'loesungen',
      title: 'Lösungen',
      question: `Für welche Werte von $${t}$ gilt das?`,
      correct: math(sol),
      wrongs: wrongs2,
      hint: `Bringe die Zahl nach rechts, teile durch die Zahl vor $${t}^2$ und ziehe die Wurzel. Denk an beide Vorzeichen.`,
      explanation: {
        detailed: `$${tSq} = ${L * L - Number(rest.n)}$, also $${t}^2 = ${t0 * t0}$ und $${t} = \\pm ${t0}$. Beide Vektoren haben die Länge $${L}$.`,
        short: `$${t}^2 = ${t0 * t0}$, also $${t} = \\pm ${t0}$.`,
      },
      established: [`${t}^2 = ${t0 * t0}`, sol],
      cards: [CARD.parameter],
    })
    if ([step1, step2].some((st) => st.choices.length < 3)) continue
    const v1 = v.map((x, j) => (j === i ? rat(c * -t0) : x))
    const v2 = v.map((x, j) => (j === i ? rat(c * t0) : x))
    const drawing: VectorDrawing | undefined = drawable(dim)
      ? {
          ...emptyDrawing(dim, `Zwei Vektoren haben die Länge $${L}$: einer für $${t} = ${-t0}$, einer für $${t} = ${t0}$.`),
          arrows: [
            { from: origin(dim), to: nums(v1), color: 'r', label: `${t} = ${-t0}`, phase: 1 },
            { from: origin(dim), to: nums(v2), color: 'c', label: `${t} = ${t0}`, phase: 2 },
          ],
        }
      : undefined
    return {
      kind: 'paramLength',
      instruction: `Für welche Werte von $${t}$ hat $${name}$ die Länge $${L}$?`,
      functionLatex: `${name} = ${columnLatex(entries)}`,
      steps: [step1, step2],
      cards: [CARD.laenge, CARD.parameter],
      resultLatex: sol,
      ...(drawing ? { resultDrawing: drawing } : {}),
      form: `paramLength|${dim}|${i}|${Math.abs(c)}|${c < 0 ? 'neg' : 'pos'}|${t}|${signShape(others)}`,
      data: { v: nums(v), i: [i], c: [c], L: [L] },
      answer: [-t0, t0],
    }
  }
}

// Für welche Werte des Parameters hat der Punkt B den Abstand L von A? (zwei verschiedene Lösungen)
function buildParamDistance(rng: Rng): Built {
  const dim = 3
  const [P, Q] = letters(rng).points
  const t = rng.pick(PARAMS)
  for (;;) {
    const { v, length: L } = pythagorean(rng, dim)
    const i = rng.int(0, dim - 1)
    const p = ints(rng, dim, -4, 4)
    if (isZero(p[i])) continue
    const e = Math.abs(Number(v[i].n))
    const qEntries = v.map((x, j) => (j === i ? t : ratLatex(ratAdd(p[j], x))))
    const pi = Number(p[i].n)
    const tMinus = pi < 0 ? `${t} + ${-pi}` : `${t} - ${pi}`
    const tPlus = pi < 0 ? `${t} - ${-pi}` : `${t} + ${pi}`
    const minusT = pi < 0 ? `${-pi * -1} - ${t}` : `${pi} - ${t}`
    const d = v.map((x, j) => (j === i ? tMinus : ratLatex(x)))
    const others = v.filter((_, j) => j !== i)
    const rest = vecNorm2(others)
    const name = arrowName(P, Q)
    const step1 = choiceStep(rng, {
      id: 'verbindung',
      title: 'Verbindungsvektor',
      question: `Wie lautet $${name}$?`,
      correct: math(columnLatex(d)),
      wrongs: [
        { content: math(columnLatex(v.map((x, j) => (j === i ? minusT : ratLatex(ratNeg(x)))))), rule: 'vec-reversed' },
        { content: math(columnLatex(v.map((x, j) => (j === i ? tPlus : ratLatex(x))))), rule: 'vec-sign-slip' },
        { content: math(columnLatex(v.map((x, j) => (j === i ? (pi < 0 ? `${t} - ${-pi}` : `${t} + ${pi}`) : ratLatex(ratAdd(ratAdd(p[j], x), p[j])))))), rule: 'vec-added-points' },
      ],
      hint: `Spitze minus Fuß, auch im Eintrag mit $${t}$.`,
      explanation: { detailed: `$${name} = ${Q} - ${P}$, Eintrag für Eintrag; im Eintrag mit $${t}$ bleibt $${tMinus}$ stehen.`, short: `$${name} = ${Q} - ${P}$.` },
      established: [`${name} = ${columnLatex(d)}`],
      cards: [CARD.verbindung],
    })
    const eqn = `(${tMinus})^2 + ${ratLatex(rest)} = ${L * L}`
    const signRest = others.reduce((acc, x) => ratAdd(acc, ratSign(x) < 0 ? ratNeg(ratMul(x, x)) : ratMul(x, x)), rat(0))
    const wrongs1: Wrong[] = [{ content: math(`(${tMinus})^2 + ${ratLatex(rest)} = ${L}`), rule: 'vec-length-target-not-squared' }]
    if (negCount(others) > 0 && !isZero(signRest)) wrongs1.push({ content: math(`(${tMinus})^2 ${ratSign(signRest) < 0 ? '-' : '+'} ${ratLatex(ratAbs(signRest))} = ${L * L}`), rule: 'vec-square-sign' })
    const dbl = others.reduce((acc, x) => ratAdd(acc, ratMul(rat(2), ratAbs(x))), rat(0))
    wrongs1.push({ content: math(`(${tMinus})^2 + ${ratLatex(dbl)} = ${L * L}`), rule: 'vec-square-double' })
    const step2 = choiceStep(rng, {
      id: 'gleichung',
      title: 'Gleichung',
      question: `Welche Gleichung beschreibt $\\lvert ${name} \\rvert = ${L}$?`,
      correct: math(eqn),
      wrongs: wrongs1,
      hint: 'Die Summe der Quadrate ist das Quadrat der Länge.',
      explanation: { detailed: `Quadrate addieren und gleich $${L}^2$ setzen: $${eqn}$.`, short: `$${eqn}$.` },
      established: [eqn, `(${tMinus})^2 = ${e * e}`],
      cards: [CARD.parameter],
    })
    const t1 = pi - e
    const t2 = pi + e
    const sol = `${t}_1 = ${t1},\\; ${t}_2 = ${t2}`
    const wrongs2: Wrong[] = [
      { content: math(`${t} = ${t2}`), rule: 'vec-one-solution' },
      { content: math(`${t}_1 = ${-pi - e},\\; ${t}_2 = ${-pi + e}`), rule: 'vec-sign-slip' },
    ]
    if (e !== 1) wrongs2.push({ content: math(`${t}_1 = ${pi - e * e},\\; ${t}_2 = ${pi + e * e}`), rule: 'vec-length-no-root' })
    const step3 = choiceStep(rng, {
      id: 'loesungen',
      title: 'Lösungen',
      question: `Für welche Werte von $${t}$ gilt das?`,
      correct: math(sol),
      wrongs: wrongs2,
      hint: `Ziehe die Wurzel aus $${e * e}$ mit beiden Vorzeichen und löse dann nach $${t}$ auf.`,
      explanation: { detailed: `$${tMinus} = \\pm ${e}$, also $${sol}$.`, short: `$${tMinus} = \\pm ${e}$.` },
      established: [`${tMinus} = \\pm ${e}`, sol],
      cards: [CARD.parameter],
    })
    if ([step1, step2, step3].some((st) => st.choices.length < 3)) continue
    const q1 = v.map((x, j) => (j === i ? rat(t1) : ratAdd(p[j], x)))
    const q2 = v.map((x, j) => (j === i ? rat(t2) : ratAdd(p[j], x)))
    const drawing: VectorDrawing = {
      ...emptyDrawing(3, `Zwei Punkte haben von $${P}$ den Abstand $${L}$.`),
      points: [{ at: nums(p), label: P }, { at: nums(q1), label: `${Q}_1`, color: 'r', phase: 1 }, { at: nums(q2), label: `${Q}_2`, color: 'c', phase: 2 }],
      arrows: [
        { from: nums(p), to: nums(q1), color: 'r', phase: 1 },
        { from: nums(p), to: nums(q2), color: 'c', phase: 2 },
      ],
    }
    return {
      kind: 'paramDistance',
      instruction: `Für welche Werte von $${t}$ hat $${Q}$ von $${P}$ den Abstand $${L}$?`,
      functionLatex: `${pointLatex(P, p)},\\; ${Q}(${qEntries.join(' \\mid ')})`,
      steps: [step1, step2, step3],
      cards: [CARD.verbindung, CARD.parameter],
      resultLatex: sol,
      resultDrawing: drawing,
      form: `paramDistance|${dim}|${i}|${pi < 0 ? 'neg' : 'pos'}|${t}|${P}|${signShape(others)}`,
      data: { p: nums(p), q: nums(vecAdd(p, v)), i: [i], L: [L] },
      answer: [t1, t2],
    }
  }
}

const BUILDERS: Readonly<Record<VectorKind, (rng: Rng, level: Level) => Built>> = {
  ...DOT_BUILDERS,
  ...PROJ_BUILDERS,
  ...FORCE_BUILDERS,
  ...CROSS_BUILDERS,
  ...SPAT_BUILDERS,
  ...BASIS_BUILDERS,
  ...LINE_BUILDERS,
  ...MATRIX_BUILDERS,
  ...DET_BUILDERS,
  ...GAUSS_BUILDERS,
  ...CRAMER_BUILDERS,
  ...LGSP_BUILDERS,
  ...PLANE_BUILDERS,
  ...LAGE_BUILDERS,
  ...ABSTAND_BUILDERS,
  ...WINKEL_BUILDERS,
  connect: buildConnect,
  combo: buildCombo,
  length: buildLength,
  distance: buildDistance,
  midpoint: buildMidpoint,
  unit: buildUnit,
  givenLength: buildGivenLength,
  parallelogram: buildParallelogram,
  equation: buildEquation,
  paramLength: buildParamLength,
  paramDistance: buildParamDistance,
  drag: (rng, level) => buildDrag(rng, level),
}

// Aufgabe zu einer Nummer (Stufe und Startwert); kind erzwingt eine Art (Lernkarten)
export function buildVectorTask(ref: TaskRef, kind?: VectorKind): VectorTask {
  const rng = createRng(`vektoren:${ref.level}:${ref.seed}`)
  // Baustein aus der Nummer: „skalar.2-4711" zieht aus dem Skalarprodukt, „projektion.2-4711" aus Projektion und
  // Zerlegung (Schritt 3a), „kraefte.2-4711" aus den Kräften (Schritt 3b), „kreuz.2-4711" aus Kreuzprodukt und Fläche
  // (Schritt 4a), „spat.2-4711" aus Spatprodukt und Volumen (Schritt 4b), „basis.2-4711" aus Linearkombination und Basis
  // (Schritt 5), „gerade.2-4711“ und „ebene.2-4711“ aus der Tätigkeit „Geraden und Ebenen“ (Schritt 6), „lage.2-4711“ aus dem Baustein „Lage“ (Schritt 7a), „abstand.2-4711“ und „schnittwinkel.2-4711“ aus Schritt 7b, „matrix.2-4711“ aus „Matrizen rechnen“ (Schritt 8a), „determinante.2-4711“ aus „Determinanten“ (Schritt 9a), „gauss.2-4711“ aus „Gauß-Verfahren“ (Schritt 10a), „cramer.2-4711“ aus „Cramersche Regel“ (Schritt 11a), „lgsparam.2-4711“ aus „Gleichungssysteme mit Parameter“ (Schritt 11b), alles andere aus
  // „Rechnen und Länge"
  const block = seedBlock(ref.seed)?.block
  const dotBlock = block === 'skalar'
  const kinds = dotBlock ? DOT_KINDS_BY_LEVEL : block === 'projektion' ? PROJ_KINDS_BY_LEVEL : block === 'kraefte' ? FORCE_KINDS_BY_LEVEL : block === 'kreuz' ? CROSS_KINDS_BY_LEVEL : block === 'spat' ? SPAT_KINDS_BY_LEVEL : block === 'basis' ? BASIS_KINDS_BY_LEVEL : block === 'gerade' ? LINE_KINDS_BY_LEVEL : block === 'ebene' ? PLANE_KINDS_BY_LEVEL : block === 'lage' ? LAGE_KINDS_BY_LEVEL : block === 'abstand' ? ABSTAND_KINDS_BY_LEVEL : block === 'schnittwinkel' ? WINKEL_KINDS_BY_LEVEL : block === 'matrix' ? MATRIX_KINDS_BY_LEVEL : block === 'determinante' ? DET_KINDS_BY_LEVEL : block === 'gauss' ? GAUSS_KINDS_BY_LEVEL : block === 'cramer' ? CRAMER_KINDS_BY_LEVEL : block === 'lgsparam' ? LGSP_KINDS_BY_LEVEL : KINDS_BY_LEVEL
  // Zieh-Aufgaben (Schritt 2b) mit festem Anteil und eigenem Zufall: Die übrigen Nummern behalten ihre Aufgabe
  const drag = dotBlock && createRng(`vektoren-ziehen:${ref.level}:${ref.seed}`).chance(DRAG_SHARE)
  const chosen = kind ?? (drag ? 'drag' : rng.pick(kinds[ref.level]))
  const built = BUILDERS[chosen](rng, ref.level)
  // Tipp im freien Modus: kurz der erste Schritt, ausführlich alle Schritte
  const ruleHint = { short: built.steps[0].hint, detailed: built.steps.map((s) => s.hint).join(' ') }
  return { ...built, ref, ruleHint, form: `${ref.level}:${built.form}` }
}

// Ergebnis in Worten für Tests (Zahlen der richtigen Antworten)
export const resultNumbers = (task: VectorTask): readonly number[] => task.answer
