import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Row, ROMAN, probeStep as systemProbeStep, solveTwo, systemLatex } from './basisTasks.ts'
import { crossStep, linLatex, termsLatex, withParamLatex } from './crossTasks.ts'
import { type DrawColor, type DrawPoint, type DrawPolygon, type VectorDrawing, emptyDrawing } from './figures.ts'
import { COORDS, at, coordLatex, crossVec, isParallel, lineSegment, normalFormLatex, paramFormLatex, pickDir, pickPoint, planeDirections, primitive } from './lineKit.ts'
import { GL_CARD, type WrongLine, decideStep, formStep, pointStep, rowTs, solveStep } from './lineTasks.ts'
import { coordStep, directionsFor, probeStep as planeProbeStep, threePoints } from './planeTasks.ts'
import { type Built, type VectorKind, type Wrong, CARD, choiceStep, connectStep, math, nums, signShape } from './taskKit.ts'
import { type Vec, columnLatex, pointLatex, ratFactorLatex, ratLatex, vecAdd, vecDot, vecIsZero, vecLatex, vecScale, vecSub } from './vec.ts'

// Baustein „Lage" der Tätigkeit „Geraden und Ebenen" (M7 Schritt 7a): gegenseitige Lage zweier Geraden (identisch, echt
// parallel, Schnittpunkt, windschief) als Entscheidungsbaum (Richtungen parallel? Stützpunkt auf der anderen? sonst
// Gleichungssystem mit zwei Parametern und Probe in der dritten Zeile), Schnittpunkt (Stufe 4 und 5 mit Parameter im
// Stützvektor), Lage einer Geraden zu einer Ebene (einsetzen: eine Lösung, keine, jede), Durchstoßpunkt, Parameter so,
// dass die Gerade parallel ist bzw. in der Ebene liegt, Lage zweier Ebenen (Normalen und rechte Seite vergleichen, mit
// Parameter) und Schnittgerade (eine Variable frei wählen bzw. Parameterform einsetzen).

export const LAGE_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['posLines', 'meetLines', 'posLinePlane', 'meetLinePlane'],
  2: ['posLines', 'meetLines', 'posLinePlane', 'meetLinePlane', 'posPlanes'],
  3: ['posLines', 'meetLinePlane', 'posPlanes', 'meetPlanes'],
  4: ['meetLines', 'posLinePlane', 'posPlanes', 'meetPlanes'],
  5: ['meetLines', 'posLinePlane', 'meetPlanes'],
}

// Antworten (freier Modus: Auswahl, vectorFree.ts) und die Fehler je wahrer und gewählter Antwort
export const LINE_PAIR = ['identisch', 'echt parallel', 'Schnittpunkt', 'windschief'] as const
export const LINE_PAIR_RULES: readonly (readonly string[])[] = [
  ['', 'gl-pos-same-parallel', 'gl-pos-dirs', 'gl-pos-dirs'],
  ['gl-pos-same-parallel', '', 'gl-pos-dirs', 'gl-pos-dirs'],
  ['gl-pos-dirs', 'gl-pos-dirs', '', 'gl-pos-skew-hasty'],
  ['gl-pos-dirs', 'gl-pos-dirs', 'gl-pos-third-row', ''],
]
export const LINE_PLANE = ['liegt in der Ebene', 'parallel zur Ebene', 'Durchstoßpunkt'] as const
export const LINE_PLANE_RULES: readonly (readonly string[])[] = [
  ['', 'gl-lp-zero-equation', 'gl-lp-normal'],
  ['gl-lp-zero-equation', '', 'gl-lp-normal'],
  ['gl-lp-normal', 'gl-lp-normal', ''],
]
export const PLANE_PAIR = ['gleich', 'parallel', 'Schnittgerade'] as const
export const PLANE_PAIR_RULES: readonly (readonly string[])[] = [
  ['', 'gl-pp-rhs', 'gl-pos-dirs'],
  ['gl-pp-rhs', '', 'gl-pos-dirs'],
  ['gl-pos-dirs', 'gl-pos-dirs', ''],
]

const show = ratLatex
const fac = ratFactorLatex
const m = ratMul
const num = (r: Rational) => Number(r.n) / Number(r.d)
const nonzero = (rng: Rng, xs: readonly number[] = [-3, -2, -1, 1, 2, 3]) => rat(rng.pick(xs))
const tooBig = (v: Vec, lim = 12) => v.some((x) => Math.abs(num(x)) > lim)
const sumOf = (xs: readonly Rational[]) => xs.reduce((s, x) => ratAdd(s, x), rat(0))
// k · Name: \vec v, -\vec v, 2 \cdot \vec v
const multLatex = (k: Rational, name: string) => (ratEq(k, rat(1)) ? name : ratEq(k, rat(-1)) ? `-${name}` : `${show(k)} \\cdot ${name}`)
// Angabe mit zwei Gleichungen untereinander (passt so auch am Handy)
const stack = (...rows: readonly string[]) => `\\begin{array}{l} ${rows.join(' \\\\[4pt] ')} \\end{array}`
const sameRats = (a: readonly Rational[], b: readonly Rational[]) => a.length === b.length && a.every((x, i) => ratEq(x, b[i]))

const PARAM_PAIRS = [
  ['t', 's'],
  ['r', 's'],
  ['\\lambda', '\\mu'],
] as const
const LINE_PAIRS = [
  ['g', 'h'],
  ['h', 'g'],
  ['g_1', 'g_2'],
] as const
const POINT_PAIRS = [
  ['A', 'B'],
  ['P', 'Q'],
  ['K', 'L'],
] as const
const PLANE_PARAMS = [
  ['r', 's'],
  ['\\lambda', '\\mu'],
] as const

function lineNames(rng: Rng) {
  const [t, s] = rng.pick(PARAM_PAIRS)
  const [g, h] = rng.pick(LINE_PAIRS)
  const [A, B] = rng.pick(POINT_PAIRS)
  return { t, s, g, h, A, B }
}

// ------------------------------------------------------------------ Schritte

// Sind zwei Richtungs- bzw. Normalenvektoren parallel? Faktor je Zeile
function parallelStep(rng: Rng, o: { readonly vn: string; readonly wn: string; readonly v: Vec; readonly w: Vec; readonly what: string; readonly card: string }): GuidedStep {
  const par = isParallel(o.v, o.w)
  const ks = o.v.map((x, i) => (isZero(x) ? null : ratDiv(o.w[i], x)))
  const factors = o.v
    .map((x, i) => `$${COORDS[i]}$: ${isZero(x) ? (isZero(o.w[i]) ? 'beide $0$' : `$0$ und $${show(o.w[i])}$`) : `$k = ${show(o.w[i])} : ${fac(x)} = ${show(ks[i]!)}$`}`)
    .join(', ')
  const wrongs: Wrong[] = []
  let correct: string
  if (par) {
    const k = ks.find((x) => x !== null)!
    correct = `Ja: $${o.wn} = ${multLatex(k, o.vn)}$.`
    wrongs.push(
      { content: `Nein: Die Einträge von $${o.vn}$ und $${o.wn}$ sind verschieden.`, rule: 'gl-parallel-missed' },
      { content: `Nein: $${o.vn} \\cdot ${o.wn} = ${show(vecDot(o.v, o.w))} \\ne 0$.`, rule: 'vec-parallel-dot' },
    )
  } else {
    // zwei Zeilen, die sich widersprechen
    let pair: readonly [number, number] = [0, 1]
    search: for (let i = 0; i < o.v.length; i++)
      for (let j = i + 1; j < o.v.length; j++)
        if (!isZero(ratSub(m(o.v[i], o.w[j]), m(o.v[j], o.w[i])))) {
          pair = [i, j]
          break search
        }
    const [i, j] = pair
    const z = ks[i] === null ? i : ks[j] === null ? j : -1
    correct =
      z >= 0
        ? `Nein: In der Zeile für $${COORDS[z]}$ ist der Eintrag von $${o.vn}$ gleich $0$, der von $${o.wn}$ nicht.`
        : `Nein: Die Zeile für $${COORDS[i]}$ ergibt $k = ${show(ks[i]!)}$, die für $${COORDS[j]}$ aber $k = ${show(ks[j]!)}$.`
    const seen = new Set<string>()
    for (const [r, k] of ks.entries()) {
      if (k === null || isZero(k) || seen.has(show(k))) continue
      seen.add(show(k))
      wrongs.push({ content: `Ja: Aus der Zeile für $${COORDS[r]}$ folgt $${o.wn} = ${multLatex(k, o.vn)}$.`, rule: 'gl-dir-one-row' })
    }
    if (isZero(vecDot(o.v, o.w))) wrongs.push({ content: `Ja: $${o.vn} \\cdot ${o.wn} = 0$.`, rule: 'vec-parallel-dot' })
  }
  return choiceStep(rng, {
    id: 'parallel',
    title: o.what,
    question: `Sind die ${o.what} $${o.vn} = ${vecLatex(o.v)}$ und $${o.wn} = ${vecLatex(o.w)}$ parallel?`,
    correct,
    wrongs: rng.shuffle(wrongs),
    hint: `Parallel heißt: $${o.wn} = k \\cdot ${o.vn}$ mit **demselben** Faktor $k$ in jeder Zeile. Rechne $k$ in jeder Zeile aus.`,
    explanation: {
      detailed: `Faktor je Zeile: ${factors}. ${par ? 'Überall derselbe Faktor: parallel.' : 'Nicht überall derselbe Faktor: nicht parallel.'}`,
      short: correct,
    },
    cards: [o.card],
  })
}

// Zwei Geraden gleichsetzen: Gleichungssystem mit zwei verschiedenen Parametern (Parameter a rechts in einer Zeile)
function lineSystemStep(
  rng: Rng,
  o: { readonly g: string; readonly h: string; readonly t: string; readonly s: string; readonly gLatex: string; readonly hLatex: string; readonly rows: readonly Row[]; readonly drawing?: VectorDrawing },
): GuidedStep {
  const labels = o.rows.map((_, i) => ROMAN[i])
  const sys = (rows: readonly Row[], unk: readonly string[]) => systemLatex(rows, unk, labels, 'a')
  const keep = (r: Row) => (r.rt ? { rt: r.rt } : {})
  const wrongs: Wrong[] = [
    { content: math(sys(o.rows.map((r) => ({ c: [ratAdd(r.c[0], r.c[1])], r: r.r, ...keep(r) })), [o.t])), rule: 'gl-same-param' },
    ...rng.shuffle<Wrong>([
      { content: math(sys(o.rows.map((r) => ({ c: r.c, r: ratNeg(r.r), ...(r.rt ? { rt: ratNeg(r.rt) } : {}) })), [o.t, o.s])), rule: 'gl-move-sign' },
      { content: math(sys(o.rows.map((r) => ({ c: [r.c[0], ratNeg(r.c[1])], r: r.r, ...keep(r) })), [o.t, o.s])), rule: 'gl-move-sign' },
    ]),
  ]
  const right = sys(o.rows, [o.t, o.s])
  return choiceStep(rng, {
    id: 'system',
    title: 'Gleichsetzen',
    question: `Setze $${o.g}$ und $${o.h}$ gleich. Welches Gleichungssystem entsteht?`,
    correct: math(right),
    wrongs,
    hint: `Jede Gerade behält ihren eigenen Parameter. Setz die Parameterformen gleich, bring die Glieder mit $${o.t}$ und $${o.s}$ nach links und die Zahlen nach rechts, Zeile für Zeile.`,
    explanation: {
      detailed: `Gleichsetzen: $${o.gLatex} = ${o.hLatex}$. Zeile für Zeile, das Glied mit $${o.s}$ nach links und den Stützvektor von $${o.g}$ nach rechts (Vorzeichen drehen): $${right}$.`,
      short: `$${right}$.`,
    },
    cards: [GL_CARD.lageGeraden],
    ...(o.drawing ? { drawing: o.drawing } : {}),
  })
}

// Parameter a im Stützvektor von h aus der dritten Gleichung
function aFromRowStep(rng: Rng, o: { readonly row: Row; readonly label: string; readonly t: string; readonly s: string; readonly t0: Rational; readonly s0: Rational }): { readonly step: GuidedStep; readonly a: Rational } {
  const [cv, cw] = o.row.c
  const pk = ratNeg(o.row.r)
  const lhs = ratAdd(m(cv, o.t0), m(cw, o.s0))
  const a = ratAdd(lhs, pk)
  const line = (x: Rational) => math(`a = ${show(x)}`)
  const wrongs: Wrong[] = [
    { content: line(ratSub(lhs, pk)), rule: 'gl-move-sign' },
    { content: line(ratAdd(ratAdd(m(cv, o.s0), m(cw, o.t0)), pk)), rule: 'vec-lc-swapped' },
    { content: line(ratAdd(ratSub(m(cv, o.t0), m(cw, o.s0)), pk)), rule: 'vec-sign-slip' },
  ].filter((w) => w.content !== line(a))
  const rowText = `${termsLatex([
    [cv, o.t],
    [cw, o.s],
  ])} = ${linLatex(o.row.r, rat(1), 'a')}`
  const step = choiceStep(rng, {
    id: 'a',
    title: 'Parameter $a$',
    question: `Setze $${o.t} = ${show(o.t0)}$ und $${o.s} = ${show(o.s0)}$ in (${o.label}) ein. Für welches $a$ stimmt diese Gleichung auch?`,
    correct: line(a),
    wrongs,
    hint: `Die beiden anderen Gleichungen legen $${o.t}$ und $${o.s}$ fest. Die Geraden schneiden sich nur, wenn auch (${o.label}) stimmt: Setz ein und löse nach $a$ auf.`,
    explanation: {
      detailed: `(${o.label}): $${rowText}$. Eingesetzt: $${show(lhs)} = ${linLatex(o.row.r, rat(1), 'a')}$, also $a = ${show(lhs)} ${ratSign(pk) < 0 ? '-' : '+'} ${show(ratAbs(pk))} = ${show(a)}$.`,
      short: `$${show(lhs)} = ${linLatex(o.row.r, rat(1), 'a')}$, also $a = ${show(a)}$.`,
    },
    established: [`a = ${show(a)}`],
    cards: [GL_CARD.lageGeraden],
  })
  return { step, a }
}

// Schnittpunkt zweier Geraden: t in g einsetzen, Probe mit s in h
function meetStep(rng: Rng, o: { readonly g: string; readonly h: string; readonly t: string; readonly s: string; readonly p: Vec; readonly v: Vec; readonly q: Vec; readonly w: Vec; readonly t0: Rational; readonly s0: Rational }): GuidedStep {
  const S = at(o.p, o.v, o.t0)
  const wrongs: Wrong[] = rng.shuffle([
    { content: math(pointLatex('S', at(o.q, o.w, o.t0))), rule: 'gl-meet-wrong-line' },
    { content: math(pointLatex('S', at(o.p, o.v, o.s0))), rule: 'gl-meet-wrong-line' },
    { content: math(pointLatex('S', vecAdd(vecScale(o.t0, o.p), o.v))), rule: 'gl-param-on-support' },
  ])
  const calcG = `${vecLatex(o.p)} + ${fac(o.t0)} \\cdot ${vecLatex(o.v)} = ${vecLatex(S)}`
  const calcH = `${vecLatex(o.q)} + ${fac(o.s0)} \\cdot ${vecLatex(o.w)} = ${vecLatex(S)}`
  return choiceStep(rng, {
    id: 'schnittpunkt',
    title: 'Schnittpunkt',
    question: 'Welcher Punkt ist der Schnittpunkt $S$?',
    correct: math(pointLatex('S', S)),
    wrongs,
    hint: `Setz $${o.t} = ${show(o.t0)}$ in $${o.g}$ ein (oder $${o.s} = ${show(o.s0)}$ in $${o.h}$): Jeder Parameter gehört zu seiner eigenen Geraden.`,
    explanation: {
      detailed: `$${o.t} = ${show(o.t0)}$ in $${o.g}$: $${calcG}$. Probe mit $${o.s} = ${show(o.s0)}$ in $${o.h}$: $${calcH}$. Also $${pointLatex('S', S)}$.`,
      short: `$${calcG}$.`,
    },
    established: [pointLatex('S', S)],
    cards: [GL_CARD.lageGeraden],
  })
}

// Entscheidung: Lage zweier Geraden
function linePosStep(rng: Rng, o: { readonly truth: number; readonly dim: number; readonly g: string; readonly h: string; readonly t: string; readonly s: string; readonly used: string }): GuidedStep {
  const { g, h } = o
  const right = [
    `Identisch: Die Richtungen sind parallel, und der Stützpunkt von $${h}$ liegt auf $${g}$.`,
    `Echt parallel: Die Richtungen sind parallel, aber der Stützpunkt von $${h}$ liegt nicht auf $${g}$.`,
    o.dim === 2 ? 'Sie schneiden sich: Die Richtungen sind nicht parallel, und in der Ebene schneiden sich solche Geraden immer.' : 'Sie schneiden sich: Die Richtungen sind nicht parallel, und das Gleichungssystem hat eine Lösung.',
    'Windschief: Die Richtungen sind nicht parallel, und das Gleichungssystem hat keine Lösung.',
  ][o.truth]
  const options: Readonly<Record<number, readonly Wrong[]>> = {
    0: [
      { content: 'Echt parallel: Die Richtungen sind parallel.', rule: 'gl-pos-same-parallel' },
      { content: `Sie schneiden sich: Der Stützpunkt von $${h}$ liegt auf $${g}$.`, rule: 'gl-pos-dirs' },
      { content: 'Windschief: Die Stützvektoren sind verschieden.', rule: 'gl-pos-dirs' },
    ],
    1: [
      { content: 'Identisch: Die Richtungen sind parallel.', rule: 'gl-pos-same-parallel' },
      { content: `Windschief: Der Stützpunkt von $${h}$ liegt nicht auf $${g}$.`, rule: 'gl-pos-dirs' },
      { content: 'Sie schneiden sich: Die Stützvektoren sind verschieden.', rule: 'gl-pos-dirs' },
    ],
    2: [
      { content: 'Windschief: Die Richtungen sind nicht parallel.', rule: 'gl-pos-skew-hasty' },
      { content: `Identisch: $${g}$ und $${h}$ haben einen gemeinsamen Punkt.`, rule: 'gl-pos-dirs' },
      { content: 'Echt parallel: Die Stützvektoren sind verschieden.', rule: 'gl-pos-dirs' },
    ],
    3: [
      { content: `Sie schneiden sich: Aus ${o.used} folgen Werte für $${o.t}$ und $${o.s}$.`, rule: 'gl-pos-third-row' },
      { content: 'Echt parallel: Das Gleichungssystem hat keine Lösung.', rule: 'gl-pos-dirs' },
      { content: 'Identisch: Die Richtungen sind nicht parallel.', rule: 'gl-pos-dirs' },
    ],
  }
  return choiceStep(rng, {
    id: 'lage',
    title: 'Lage',
    question: `Wie liegen $${g}$ und $${h}$ zueinander?`,
    correct: right,
    wrongs: options[o.truth],
    hint: `Richtungen parallel: Dann entscheidet der Stützpunkt von $${h}$ (auf $${g}$: identisch, sonst echt parallel). Nicht parallel: Dann entscheidet das Gleichungssystem (Lösung: Schnittpunkt, keine Lösung: windschief).`,
    explanation: { detailed: `${right} Merke: erst die Richtungen vergleichen, dann Punktprobe bzw. Gleichungssystem.`, short: right },
    cards: [GL_CARD.lageGeraden],
  })
}

// Summe Faktor · (Zeile) beim Einsetzen: 2\left(3t + 1\right) - \left(t - 2\right)
function substLatex(n: Vec, rows: readonly string[]): string {
  const parts = n
    .map((c, i) => [c, rows[i]] as const)
    .filter(([c]) => !isZero(c))
    .map(([c, r], i) => {
      const abs = ratAbs(c)
      const sign = ratSign(c) < 0 ? (i === 0 ? '-' : ' - ') : i === 0 ? '' : ' + '
      return `${sign}${ratEq(abs, rat(1)) ? '' : `${show(abs)} \\cdot `}\\left(${r}\\right)`
    })
  return parts.length ? parts.join('') : '0'
}

// linke Seite nach dem Einsetzen: Faktoren vor den Parametern, dann die Zahl; fällt jeder Parameter weg: 0 \cdot t + 3
function insertedLatex(c0: Rational, cs: readonly Rational[], params: readonly string[], d: Rational): string {
  const lhs = cs.every(isZero)
    ? `0 \\cdot ${params[0]}${isZero(c0) ? '' : ratSign(c0) < 0 ? ` - ${show(ratAbs(c0))}` : ` + ${show(c0)}`}`
    : termsLatex([...cs.map((c, i) => [c, params[i]] as const), [c0, '']])
  return `${lhs} = ${show(d)}`
}

// Gerade bzw. Ebene in Parameterform zeilenweise in eine Koordinatenform n · x = d einsetzen
function insertStep(
  rng: Rng,
  o: { readonly into: string; readonly from: string; readonly n: Vec; readonly d: Rational; readonly p: Vec; readonly dirs: readonly (readonly [string, Vec])[]; readonly card: string; readonly drawing?: VectorDrawing },
): { readonly step: GuidedStep; readonly c0: Rational; readonly cs: readonly Rational[] } {
  const params = o.dirs.map(([x]) => x)
  const c0 = vecDot(o.n, o.p)
  const cs = o.dirs.map(([, v]) => vecDot(o.n, v))
  const rot = (v: Vec) => [v[1], v[2], v[0]]
  const cands: { readonly c0: Rational; readonly cs: readonly Rational[]; readonly rule: string }[] = []
  if (!isZero(c0)) cands.push({ c0: rat(0), cs, rule: 'gl-insert-dirs-only' })
  cands.push({ c0: sumOf(o.p), cs: o.dirs.map(([, v]) => sumOf(v)), rule: 'gl-insert-no-coef' })
  cands.push({ c0: vecDot(o.n, rot(o.p)), cs: o.dirs.map(([, v]) => vecDot(o.n, rot(v))), rule: 'gl-insert-swapped' })
  const neg = o.n.findIndex((c, i) => ratSign(m(c, o.p[i])) < 0)
  if (neg >= 0) cands.push({ c0: ratSub(c0, m(rat(2), m(o.n[neg], o.p[neg]))), cs, rule: 'vec-sign-slip' })
  const wrongs: Wrong[] = rng.shuffle(cands.filter((x) => !(ratEq(x.c0, c0) && sameRats(x.cs, cs))).map((x) => ({ content: math(insertedLatex(x.c0, x.cs, params, o.d)), rule: x.rule })))
  const eq = insertedLatex(c0, cs, params, o.d)
  const rows = o.p.map((x, i) => termsLatex([...o.dirs.map(([t, v]) => [v[i], t] as const), [x, '']]))
  const subst = `${substLatex(o.n, rows)} = ${show(o.d)}`
  const step = choiceStep(rng, {
    id: 'einsetzen',
    title: 'Einsetzen',
    question: `Setz die Zeilen von $${o.from}$ für $x$, $y$ und $z$ in $${o.into}$ ein. Welche Gleichung entsteht?`,
    correct: math(eq),
    wrongs,
    hint: `Ersetze in $${o.into}$ jedes $x$, $y$ und $z$ durch die passende Zeile von $${o.from}$, mit Klammern, und fasse zusammen.`,
    explanation: { detailed: `Eingesetzt: $${subst}$. Zusammengefasst: $${eq}$.`, short: `$${subst}$, also $${eq}$.` },
    established: [eq],
    cards: [o.card],
    ...(o.drawing ? { drawing: o.drawing } : {}),
  })
  return { step, c0, cs }
}

// Entscheidung: Lage einer Geraden zur Ebene (nach dem Einsetzen oder nach Parameter und Punktprobe)
function linePlanePosStep(rng: Rng, o: { readonly truth: number; readonly mode: 'insert' | 'probe'; readonly t: string; readonly c0: Rational; readonly d: Rational; readonly t0?: Rational; readonly g: string; readonly E: string }): GuidedStep {
  const { t, g, E } = o
  const eq = `${show(o.c0)} = ${show(o.d)}`
  const right =
    o.mode === 'insert'
      ? [
          `Liegt in der Ebene: $${t}$ fällt weg, und $${eq}$ stimmt. Jedes $${t}$ erfüllt die Gleichung.`,
          `Parallel zur Ebene: $${t}$ fällt weg, und $${eq}$ ist falsch. Kein $${t}$ erfüllt die Gleichung.`,
          `Durchstoßpunkt: Die Gleichung hat genau eine Lösung, $${t} = ${show(o.t0 ?? rat(0))}$.`,
        ][o.truth]
      : [
          `Liegt in der Ebene: $\\vec v$ steht senkrecht auf $\\vec n$, und der Stützpunkt von $${g}$ liegt in $${E}$.`,
          `Parallel zur Ebene: $\\vec v$ steht senkrecht auf $\\vec n$, aber der Stützpunkt von $${g}$ liegt nicht in $${E}$.`,
        ][o.truth]
  const options: readonly (readonly Wrong[])[] =
    o.mode === 'insert'
      ? [
          [
            { content: `Parallel zur Ebene: $${t}$ fällt weg, also gibt es keine Lösung.`, rule: 'gl-lp-zero-equation' },
            { content: 'Durchstoßpunkt: Die Gleichung ist erfüllt.', rule: 'gl-lp-normal' },
          ],
          [
            { content: `Liegt in der Ebene: $${t}$ fällt weg, also ist jedes $${t}$ eine Lösung.`, rule: 'gl-lp-zero-equation' },
            { content: `Durchstoßpunkt: Der Richtungsvektor steht senkrecht auf dem Normalenvektor.`, rule: 'gl-lp-normal' },
          ],
          [
            { content: 'Liegt in der Ebene: Die Gleichung hat eine Lösung.', rule: 'gl-lp-normal' },
            { content: `Parallel zur Ebene: Der Faktor vor $${t}$ ist nicht $0$.`, rule: 'gl-lp-normal' },
          ],
        ]
      : [
          [
            { content: `Parallel zur Ebene: $\\vec v$ steht senkrecht auf $\\vec n$.`, rule: 'gl-lp-zero-equation' },
            { content: `Durchstoßpunkt: $\\vec v$ steht senkrecht auf $\\vec n$, also auch auf $${E}$.`, rule: 'gl-lp-normal' },
          ],
          [
            { content: `Liegt in der Ebene: $\\vec v$ steht senkrecht auf $\\vec n$.`, rule: 'gl-lp-zero-equation' },
            { content: `Durchstoßpunkt: $\\vec v$ steht senkrecht auf $\\vec n$, also auch auf $${E}$.`, rule: 'gl-lp-normal' },
          ],
        ]
  return choiceStep(rng, {
    id: 'lage',
    title: 'Lage',
    question: `Wie liegt $${g}$ zu $${E}$?`,
    correct: right,
    wrongs: options[o.truth],
    hint: `Fällt $${t}$ weg (der Richtungsvektor steht senkrecht auf dem Normalenvektor), ist $${g}$ parallel zu $${E}$; stimmt die Gleichung trotzdem (ein Punkt von $${g}$ liegt in $${E}$), liegt $${g}$ ganz in $${E}$. Bleibt $${t}$ stehen, gibt es genau einen Durchstoßpunkt.`,
    explanation: { detailed: `${right} Merke: $\\vec n \\cdot \\vec v = 0$ heißt parallel oder drin, sonst Durchstoßpunkt.`, short: right },
    cards: [GL_CARD.lageGeradeEbene],
  })
}

// Entscheidung: Lage zweier Ebenen (k: Faktor der Normalen, wenn parallel)
function planePosStep(rng: Rng, o: { readonly truth: number; readonly k?: Rational; readonly d: Rational; readonly e: Rational; readonly E: string; readonly F: string }): GuidedStep {
  const { E, F } = o
  const k = o.k ?? rat(1)
  const kd = m(k, o.d)
  const right = [
    `Gleich: Die Gleichung von $${F}$ ist das $${show(k)}$-Fache der von $${E}$, auch rechts: $${show(k)} \\cdot ${fac(o.d)} = ${show(o.e)}$.`,
    `Parallel: Links ist $${F}$ das $${show(k)}$-Fache von $${E}$, rechts aber $${show(k)} \\cdot ${fac(o.d)} = ${show(kd)} \\ne ${show(o.e)}$.`,
    'Schnittgerade: Die Normalenvektoren sind nicht parallel.',
  ][o.truth]
  const options: readonly (readonly Wrong[])[] = [
    [
      { content: 'Parallel: Die Normalenvektoren sind parallel.', rule: 'gl-pp-rhs' },
      { content: 'Schnittgerade: Die Zahlen rechts sind verschieden.', rule: 'gl-pos-dirs' },
    ],
    [
      { content: 'Gleich: Die Normalenvektoren sind parallel.', rule: 'gl-pp-rhs' },
      { content: 'Schnittgerade: Die Gleichungen sind verschieden.', rule: 'gl-pos-dirs' },
    ],
    [
      { content: 'Parallel: Die Zahlen rechts sind verschieden.', rule: 'gl-pos-dirs' },
      { content: 'Gleich: Beide Gleichungen haben gemeinsame Lösungen.', rule: 'gl-pos-dirs' },
    ],
  ]
  return choiceStep(rng, {
    id: 'lage',
    title: 'Lage',
    question: `Wie liegen $${E}$ und $${F}$ zueinander?`,
    correct: right,
    wrongs: options[o.truth],
    hint: `Sind die Normalenvektoren parallel, sind die Ebenen parallel oder gleich: Dann entscheidet, ob auch die rechte Seite mit demselben Faktor mitgeht. Sonst schneiden sie sich in einer Geraden.`,
    explanation: { detailed: `${right} Merke: erst die Normalen vergleichen, dann die rechten Seiten.`, short: right },
    cards: [GL_CARD.lageEbenen],
  })
}

// ------------------------------------------------------------------ Bilder

type N = readonly number[]
const addN = (a: N, b: N) => a.map((x, i) => x + b[i])
const scaleN = (k: number, a: N) => a.map((x) => k * x)
const lenN = (a: N) => Math.hypot(...a)
const unitN = (a: N) => scaleN(1 / lenN(a), a)
const crossN = (a: N, b: N) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dotN = (a: N, b: N) => a.reduce((s, x, i) => s + x * b[i], 0)

// Stück einer Ebene (Quadrat mit halber Seite size) um center
function patch(center: N, n: Vec, size: number, color: DrawColor, phase: number): DrawPolygon {
  const nn = nums(n)
  const e1 = unitN(nums(planeDirections(n)[0]))
  const e2 = unitN(crossN(nn, e1))
  const c = (a: number, b: number) => addN(addN(center, scaleN(a * size, e1)), scaleN(b * size, e2))
  return { points: [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], color, phase }
}

// Lotfußpunkt von x auf die Ebene n · y = d (als Zahlen)
const footN = (x: N, n: Vec, d: Rational) => {
  const nn = nums(n)
  return addN(x, scaleN((num(d) - dotN(nn, x)) / dotN(nn, nn), nn))
}

type LineSpec = { readonly name: string; readonly p: Vec; readonly v: Vec; readonly ts: readonly number[]; readonly color: DrawColor; readonly dir: string }

// Geraden (mit Richtungspfeil am Stützpunkt), Punkte und Ebenenstücke; Ebenen zuerst, dann die Geraden, dann die Punkte
function sceneFigure(dim: 2 | 3, o: { readonly lines: readonly LineSpec[]; readonly points?: readonly DrawPoint[]; readonly polygons?: readonly DrawPolygon[]; readonly caption: string }): VectorDrawing {
  const base = (o.polygons ?? []).reduce((x, p) => Math.max(x, p.phase ?? 0), 0)
  const segments = o.lines.map((l, i) => ({ ...lineSegment(l.p, l.v, l.ts), color: l.color, label: l.name, phase: base + i + 1 }))
  const arrows = o.lines.map((l, i) => ({ from: nums(l.p), to: addN(nums(l.p), nums(l.v)), color: l.color, label: l.dir, phase: base + i + 1 }))
  const last = base + o.lines.length + 1
  const points = (o.points ?? []).map((p) => ({ ...p, phase: p.phase ?? last }))
  return { ...emptyDrawing(dim, o.caption), segments, arrows, points, polygons: o.polygons ?? [] }
}

const PATCH = 3

// ------------------------------------------------------------------ Arten: zwei Geraden

// Lage zweier Geraden (posLines: Stufe 1 Ebene, 2 Raum, 3 g durch zwei Punkte) und Schnittpunkt (meetLines: Stufe 1 Ebene,
// 2 Raum, 4 mit Parameter a im Stützvektor von h, 5 dazu g durch zwei Punkte)
function buildLinePair(rng: Rng, level: Level, meet: boolean): Built {
  for (;;) {
    const dim = level === 1 ? 2 : 3
    const { t, s, g, h, A, B } = lineNames(rng)
    const via = level === 3 || level === 5
    const withA = meet && level >= 4
    const truth = meet ? 2 : dim === 2 ? rng.pick([0, 1, 2, 2]) : rng.pick([0, 1, 2, 3])
    let p: Vec
    let v: Vec
    let q: Vec
    let w: Vec
    let t0 = rat(0)
    let s0 = rat(0)
    let ij: readonly [number, number] = [0, 1]
    let k3 = -1
    if (truth <= 1) {
      p = pickPoint(rng, dim, 4)
      v = pickDir(rng, dim, 3, 0)
      w = vecScale(nonzero(rng, [-3, -2, -1, 2, 3]), v)
      t0 = nonzero(rng, [-2, -1, 1, 2, 3])
      q = at(p, v, t0)
      if (truth === 1) {
        const j = rng.int(0, dim - 1)
        q = q.map((x, i) => (i === j ? ratAdd(x, nonzero(rng, [-2, -1, 1, 2])) : x))
      }
    } else {
      const S0 = pickPoint(rng, dim, 4)
      v = pickDir(rng, dim, 3, dim === 3 ? 1 : 0)
      w = pickDir(rng, dim, 3, dim === 3 ? 1 : 0)
      if (isParallel(v, w)) continue
      t0 = nonzero(rng)
      s0 = nonzero(rng)
      if (ratEq(t0, s0) || ratEq(t0, ratNeg(s0))) continue
      p = at(S0, v, ratNeg(t0))
      q = at(S0, w, ratNeg(s0))
      if (dim === 3) {
        // dritte Zeile: dort, wo w eine 0 hat (sonst beliebig); in den beiden anderen muss s vorkommen
        const zero = w.findIndex(isZero)
        k3 = zero >= 0 ? zero : rng.int(0, 2)
        const rest = [0, 1, 2].filter((x) => x !== k3)
        ij = [rest[0], rest[1]]
      }
      const [i, j] = ij
      if (isZero(w[i]) || isZero(w[j]) || isZero(ratSub(m(v[i], w[j]), m(v[j], w[i])))) continue
      if (truth === 3) q = q.map((x, i2) => (i2 === k3 ? ratAdd(x, nonzero(rng, [-2, -1, 1, 2])) : x))
    }
    if (tooBig(p) || tooBig(q) || vecIsZero(p) || vecIsZero(q)) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.lageGeraden]
    const b = vecAdd(p, v)
    const vn = via ? `\\overrightarrow{${A}${B}}` : '\\vec v'
    if (via) {
      const c = connectStep(rng, A, B, p, b)
      if (c.choices.length < 3) continue
      steps.push(c)
      cards.push(CARD.verbindung)
    }
    const gLatex = paramFormLatex(g, p, [[t, v]])
    const a0 = withA ? ratAdd(ratAdd(p[k3], m(t0, v[k3])), m(ratNeg(s0), w[k3])) : rat(0)
    const qShown = withA ? withParamLatex(q, k3, 'a') : vecLatex(q)
    const hLatex = `${h}\\colon \\vec x = ${qShown} + ${s} ${vecLatex(w)}`
    const lines: LineSpec[] = [
      { name: g, p, v, ts: [0, num(t0)], color: 'a', dir: vn },
      { name: h, p: q, v: w, ts: [0, num(s0)], color: 'b', dir: '\\vec w' },
    ]
    const S = at(p, v, t0)
    if (!meet) steps.push(parallelStep(rng, { vn, wn: '\\vec w', v, w, what: 'Richtungsvektoren', card: GL_CARD.lageGeraden }))
    if (!meet && dim === 2 && truth === 2) {
      // in der Ebene: nicht parallel heißt schneiden, ohne Gleichungssystem
    } else if (truth <= 1) {
      // Name des Stützpunkts von h: nicht wie einer der Punkte von g
      const Qn = via && B === 'Q' ? 'R' : 'Q'
      const decided = decideStep(rng, { P: Qn, ts: rowTs(q, p, v), i0: 0, t, question: `Liegt der Stützpunkt $${pointLatex(Qn, q)}$ von $${h}$ auf $${g}$?`, subject: `$${Qn}$ auf $${g}$` })
      steps.push({ ...decided.step, cards: [GL_CARD.lageGeraden, GL_CARD.punktprobe] })
    } else {
      const rows: Row[] = Array.from({ length: dim }, (_, i) =>
        withA && i === k3 ? { c: [v[i], ratNeg(w[i])], r: ratNeg(p[i]), rt: rat(1) } : { c: [v[i], ratNeg(w[i])], r: ratSub(q[i], p[i]) },
      )
      const before = meet ? sceneFigure(dim, { lines, caption: `Wo treffen sich $${g}$ und $${h}$?` }) : undefined
      const gEq = `${vecLatex(p)} + ${t} ${vecLatex(v)}`
      const hEq = `${qShown} + ${s} ${vecLatex(w)}`
      steps.push(lineSystemStep(rng, { g, h, t, s, gLatex: gEq, hLatex: hEq, rows, ...(before ? { drawing: before } : {}) }))
      steps.push(...solveTwo(rng, rows, ij[0], ij[1], [t, s], [t0, s0]).map((st) => ({ ...st, cards: [GL_CARD.lageGeraden] })))
      if (dim === 3) {
        if (withA) steps.push(aFromRowStep(rng, { row: rows[k3], label: ROMAN[k3], t, s, t0, s0 }).step)
        else {
          const probe = systemProbeStep(rng, { rows: [rows[k3]], labels: [ROMAN[k3]], xs: [t0, s0], unk: [t, s], target: '', mode: 'check' })
          steps.push({
            ...probe,
            hint: `Zwei Gleichungen legen $${t}$ und $${s}$ fest. Nur wenn auch (${ROMAN[k3]}) mit denselben Werten stimmt, haben die Geraden einen gemeinsamen Punkt.`,
            cards: [GL_CARD.lageGeraden],
          })
        }
      }
      if (meet) steps.push(meetStep(rng, { g, h, t, s, p, v, q: withA ? q.map((x, i) => (i === k3 ? a0 : x)) : q, w, t0, s0 }))
    }
    if (!meet) steps.push(linePosStep(rng, { truth, dim, g, h, t, s, used: `(${ROMAN[ij[0]]}) und (${ROMAN[ij[1]]})` }))
    if (steps.some((st) => st.choices.length < 3)) continue
    const qReal = withA ? q.map((x, i) => (i === k3 ? a0 : x)) : q
    if (withA && (tooBig(qReal) || vecIsZero(qReal))) continue
    const captions = [
      `$${g}$ und $${h}$ sind identisch: Beide Gleichungen beschreiben dieselbe Gerade.`,
      `$${g}$ und $${h}$ sind echt parallel.`,
      `$${g}$ und $${h}$ schneiden sich in $S$.`,
      `$${g}$ und $${h}$ sind windschief: nicht parallel, und sie treffen sich nicht.`,
    ]
    const points: DrawPoint[] = [...(via ? [{ at: nums(p), label: A, color: 'a' as const }, { at: nums(b), label: B, color: 'a' as const }] : []), ...(truth === 2 ? [{ at: nums(S), label: 'S', color: 'r' as const }] : [])]
    const drawing = sceneFigure(dim, { lines: [lines[0], { ...lines[1], p: qReal }], points, caption: captions[truth] })
    const given = via ? stack(`${pointLatex(A, p)},\\; ${pointLatex(B, b)}`, hLatex) : stack(gLatex, hLatex)
    const intro = via ? `Die Gerade $${g}$ geht durch $${A}$ und $${B}$. ` : ''
    const form = `${dim}|${via ? 'pts' : 'form'}|${k3}|${t}|${g}|${signShape(p, v, w)}`
    if (!meet) {
      return {
        kind: 'posLines',
        instruction: `${intro}Wie liegen die Geraden $${g}$ und $${h}$ zueinander?`,
        functionLatex: given,
        steps,
        cards,
        resultLatex: `\\text{${LINE_PAIR[truth]}}`,
        resultDrawing: drawing,
        form: `posLines|${truth}|${form}`,
        data: { p: nums(p), v: nums(v), q: nums(q), w: nums(w) },
        answer: [truth],
      }
    }
    return {
      kind: 'meetLines',
      instruction: withA ? `${intro}Für welches $a$ schneiden sich $${g}$ und $${h}$? Bestimme dann den Schnittpunkt $S$.` : `${intro}Die Geraden $${g}$ und $${h}$ schneiden sich. Bestimme den Schnittpunkt $S$.`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: `${withA ? `a = ${show(a0)},\\; ` : ''}${pointLatex('S', S)}`,
      resultDrawing: drawing,
      form: `meetLines|${withA ? 'a' : 'plain'}|${num(t0)}|${num(s0)}|${form}`,
      data: { p: nums(p), v: nums(v), q: nums(qReal), w: nums(w), ...(withA ? { k: [k3] } : {}) },
      answer: [...(withA ? [num(a0)] : []), ...nums(S)],
    }
  }
}

// ------------------------------------------------------------------ Arten: Gerade und Ebene

// Lage Gerade–Ebene (posLinePlane: Stufe 1 und 2 einsetzen, Stufe 4 Parameter a in der Richtung, Stufe 5 dazu b im
// Stützpunkt, Ebene in Normalenform) und Durchstoßpunkt (meetLinePlane: Stufe 1 und 2 Koordinatenform, 3 Parameterform)
function buildLinePlane(rng: Rng, level: Level, meet: boolean): Built {
  for (;;) {
    const t = rng.pick(['t', 'k'])
    const g = rng.pick(['g', 'h'])
    const E = rng.pick(['E', 'F'])
    const [r, s] = rng.pick(PLANE_PARAMS)
    const variant = meet ? (level === 3 ? 'param' : 'coord') : level === 4 ? 'a' : level === 5 ? 'ab' : 'coord'
    const P0 = pickPoint(rng, 3, 3)
    // Ebene: Normale n (in der Parameterform aus dem Kreuzprodukt, gekürzt)
    let n = pickDir(rng, 3, level === 1 ? 3 : 4, 1)
    let u: Vec = []
    let w: Vec = []
    let raw: Vec = n
    if (variant === 'param') {
      ;[u, w] = directionsFor(rng, n)
      raw = crossVec(u, w)
      n = primitive(raw)
      if (tooBig(u, 6) || tooBig(w, 6)) continue
    }
    const d = vecDot(n, P0)
    // Punktprobe nach dem Parameter (Stufe 4): rechts nie 0, sonst wäre „links 0, wie rechts“ eine richtige „falsche“ Antwort
    if (isZero(d) && (variant === 'a' || rng.chance(0.7))) continue
    const truth = meet ? 2 : variant === 'coord' ? rng.int(0, 2) : variant === 'a' ? rng.int(0, 1) : 0
    let p: Vec
    let v: Vec
    let t0 = rat(0)
    if (truth === 2) {
      v = pickDir(rng, 3, 3, 1)
      if (isZero(vecDot(n, v))) continue
      t0 = nonzero(rng)
      // in der Parameterform (Stufe 3) nicht der sichtbare Stützpunkt, sonst stünde das Ergebnis schon da
      const S0 = variant === 'param' ? vecAdd(at(P0, u, nonzero(rng, [-2, -1, 1, 2])), vecScale(nonzero(rng, [-2, -1, 1, 2]), w)) : P0
      p = at(S0, v, ratNeg(t0))
    } else {
      const [d1, d2] = directionsFor(rng, n)
      v = d1
      p = at(P0, d2, nonzero(rng, [-2, -1, 1, 2]))
      if (truth === 1) {
        const j = rng.pick([0, 1, 2].filter((x) => !isZero(n[x])))
        p = p.map((x, i) => (i === j ? ratAdd(x, nonzero(rng, [-2, -1, 1, 2])) : x))
      }
    }
    if (tooBig(p) || tooBig(v, 6) || vecIsZero(p)) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.lageGeradeEbene]
    // Parameter: a in der Richtung (Zeile j), b im Stützpunkt (Zeile k)
    const jc = [0, 1, 2].filter((x) => !isZero(n[x]) && !isZero(v[x]))
    const j = jc.length ? rng.pick(jc) : 0
    const k = rng.pick([0, 1, 2].filter((x) => !isZero(n[x])))
    if ((variant === 'a' || variant === 'ab') && (isZero(n[j]) || isZero(v[j]))) continue
    if (variant === 'ab' && isZero(p[k])) continue
    const vShown = variant === 'a' || variant === 'ab' ? withParamLatex(v, j, 'a') : vecLatex(v)
    const pShown = variant === 'ab' ? withParamLatex(p, k, 'b') : vecLatex(p)
    const lineLatex = `${g}\\colon \\vec x = ${pShown} + ${t} ${vShown}`
    let planeLatex = coordLatex(E, n, d)
    if (variant === 'param') {
      planeLatex = paramFormLatex(E, P0, [
        [r, u],
        [s, w],
      ])
      const cs = crossStep(rng, '\\vec u', '\\vec w', u, w)
      const co = coordStep(rng, { name: E, n, p: P0, from: raw })
      if (cs.choices.length < 4 || co.choices.length < 4) continue
      steps.push({ ...cs, question: `Die Richtungen von $${E}$ heißen $\\vec u$ und $\\vec w$. Ein Normalenvektor steht senkrecht auf beiden. Wie lautet $\\vec u \\times \\vec w$?` }, co)
      cards.push(CARD.kreuz, GL_CARD.koordinaten)
    }
    if (variant === 'ab') {
      planeLatex = normalFormLatex(E, n, P0)
      const co = coordStep(rng, { name: E, n, p: P0 })
      if (co.choices.length < 4) continue
      steps.push(co)
      cards.push(GL_CARD.koordinaten)
    }
    const center = truth === 2 ? nums(at(p, v, t0)) : footN(nums(p), n, d)
    const plane = patch(center, n, PATCH, 'c', 1)
    const S = at(p, v, t0)
    const lineSpec: LineSpec = { name: g, p, v, ts: [0, num(t0)], color: 'a', dir: '\\vec v' }
    const captions = [`$${g}$ liegt ganz in $${E}$.`, `$${g}$ ist parallel zu $${E}$: Sie haben keinen gemeinsamen Punkt.`, `$${g}$ durchstößt $${E}$ in $S$.`]
    const drawing = sceneFigure(3, { lines: [lineSpec], polygons: [plane], points: truth === 2 ? [{ at: nums(S), label: 'S', color: 'r' }] : [], caption: captions[truth] })
    const given = stack(planeLatex, lineLatex)
    const form = `${variant}|${t}|${g}|${E}|${n.filter(isZero).length}|${signShape(p, v, n)}`
    if (variant === 'coord' || variant === 'param') {
      const before = meet ? sceneFigure(3, { lines: [lineSpec], polygons: [plane], caption: `Wo durchstößt $${g}$ die Ebene $${E}$?` }) : undefined
      const ins = insertStep(rng, { into: E, from: g, n, d, p, dirs: [[t, v]], card: GL_CARD.lageGeradeEbene, ...(before && variant === 'coord' ? { drawing: before } : {}) })
      steps.push(ins.step)
      if (!meet) {
        steps.push(linePlanePosStep(rng, { truth, mode: 'insert', t, c0: ins.c0, d, t0, g, E }))
        if (steps.some((st) => st.choices.length < 3)) continue
        return {
          kind: 'posLinePlane',
          instruction: `Wie liegt die Gerade $${g}$ zur Ebene $${E}$?`,
          functionLatex: given,
          steps,
          cards,
          resultLatex: `\\text{${LINE_PLANE[truth]}}`,
          resultDrawing: drawing,
          form: `posLinePlane|${truth}|${form}`,
          data: { n: nums(n), d: [num(d)], p: nums(p), v: nums(v) },
          answer: [truth],
        }
      }
      const solved = solveStep(rng, { id: 'parameter', title: 'Parameter', question: `Für welches $${t}$ ist die Gleichung erfüllt?`, t, target: d, p: ins.c0, v: ins.cs[0], lead: 'Die Gleichung lautet', card: GL_CARD.lageGeradeEbene })
      const pt = pointStep(rng, { Q: 'S', p, v, t: t0, tName: t, slips: solved.slips, question: 'Welcher Punkt ist der Durchstoßpunkt $S$?', card: GL_CARD.lageGeradeEbene })
      steps.push(solved.step, pt)
      if (steps.some((st) => st.choices.length < 3)) continue
      return {
        kind: 'meetLinePlane',
        instruction: `Die Gerade $${g}$ durchstößt die Ebene $${E}$. Bestimme den Durchstoßpunkt $S$.`,
        functionLatex: given,
        steps,
        cards,
        resultLatex: pointLatex('S', S),
        resultDrawing: drawing,
        form: `meetLinePlane|${num(t0)}|${form}`,
        data: { n: nums(n), d: [num(d)], p: nums(p), v: nums(v), P0: nums(P0) },
        answer: nums(S),
      }
    }
    // Parameter a: n · v(a) = 0
    const rest = sumOf(n.map((c, i) => (i === j ? rat(0) : m(c, v[i]))))
    const aSolved = solveStep(rng, {
      id: 'a',
      title: 'Parameter $a$',
      question: `Für welches $a$ steht der Richtungsvektor von $${g}$ senkrecht auf dem Normalenvektor $\\vec n = ${vecLatex(n)}$?`,
      t: 'a',
      target: rat(0),
      p: rest,
      v: n[j],
      lead: `Parallel zu $${E}$ (oder ganz in $${E}$) heißt: $\\vec n \\cdot \\vec v = 0$. Ausgerechnet:`,
      card: GL_CARD.lageGeradeEbene,
    })
    steps.push(aSolved.step)
    const a0 = v[j]
    if (variant === 'a') {
      const probe = planeProbeStep(rng, { name: E, n, d, P: p, pName: 'P' })
      steps.push({ ...probe.step, question: `Liegt der Stützpunkt $${pointLatex('P', p)}$ von $${g}$ in $${E}$?`, cards: [GL_CARD.lageGeradeEbene, GL_CARD.punktprobe] })
      steps.push(linePlanePosStep(rng, { truth, mode: 'probe', t, c0: vecDot(n, p), d, g, E }))
      if (steps.some((st) => st.choices.length < 3)) continue
      return {
        kind: 'posLinePlane',
        instruction: `Für welches $a$ ist $${g}$ parallel zu $${E}$ oder liegt in $${E}$? Was davon gilt dann?`,
        functionLatex: given,
        steps,
        cards,
        resultLatex: `a = ${show(a0)},\\; \\text{${LINE_PLANE[truth]}}`,
        resultDrawing: drawing,
        form: `posLinePlane|${truth}|${j}|${form}`,
        data: { n: nums(n), d: [num(d)], p: nums(p), v: nums(v) },
        answer: [num(a0), truth],
      }
    }
    // Parameter b: n · p(b) = d
    const restP = sumOf(n.map((c, i) => (i === k ? rat(0) : m(c, p[i]))))
    const bSolved = solveStep(rng, {
      id: 'b',
      title: 'Parameter $b$',
      question: `Für welches $b$ liegt der Stützpunkt von $${g}$ in $${E}$?`,
      t: 'b',
      target: d,
      p: restP,
      v: n[k],
      lead: `Damit $${g}$ ganz in $${E}$ liegt, muss auch der Stützpunkt drin liegen: $\\vec n \\cdot \\vec p = ${show(d)}$. Ausgerechnet:`,
      card: GL_CARD.lageGeradeEbene,
    })
    steps.push(bSolved.step)
    if (steps.some((st) => st.choices.length < 3)) continue
    const b0 = p[k]
    return {
      kind: 'posLinePlane',
      instruction: `Für welche Werte von $a$ und $b$ liegt $${g}$ ganz in $${E}$?`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: `a = ${show(a0)},\\; b = ${show(b0)}`,
      resultDrawing: drawing,
      form: `posLinePlane|ab|${j}|${k}|${form}`,
      data: { n: nums(n), d: [num(d)], p: nums(p), v: nums(v) },
      answer: [num(a0), num(b0)],
    }
  }
}

// ------------------------------------------------------------------ Arten: zwei Ebenen

const coordWithLatex = (name: string, n: Vec, j: number, rhs: string) =>
  `${name}\\colon ${termsLatex(n.map((c, i) => (i === j ? ([rat(1), `a${COORDS[i]}`] as const) : ([c, COORDS[i]] as const))))} = ${rhs}`

// Lage zweier Ebenen (posPlanes: Stufe 2 Koordinatenformen, 3 E in Normalen- oder Parameterform, 4 mit Parameter a in F,
// dazu b rechts)
function buildPosPlanes(rng: Rng, level: Level): Built {
  for (;;) {
    const [E, F] = rng.pick([
      ['E', 'F'],
      ['E_1', 'E_2'],
    ] as const)
    const [r, s] = rng.pick(PLANE_PARAMS)
    const variant = level === 2 ? 'coord' : level === 3 ? rng.pick(['normal', 'param'] as const) : rng.pick(['a', 'ab'] as const)
    const P0 = pickPoint(rng, 3, 3)
    let n = pickDir(rng, 3, 4, 1)
    let u: Vec = []
    let w: Vec = []
    let raw: Vec = n
    if (variant === 'param') {
      ;[u, w] = directionsFor(rng, n)
      raw = crossVec(u, w)
      n = primitive(raw)
      if (tooBig(u, 6) || tooBig(w, 6)) continue
    }
    const d = vecDot(n, P0)
    if (isZero(d)) continue
    const truth = variant === 'ab' ? 0 : variant === 'a' ? rng.int(0, 1) : rng.int(0, 2)
    const c = nonzero(rng, [-3, -2, 2, 3])
    let mv: Vec
    let e: Rational
    if (truth <= 1) {
      mv = vecScale(c, n)
      e = ratAdd(m(c, d), truth === 1 ? nonzero(rng, [-3, -2, -1, 1, 2, 3]) : rat(0))
    } else {
      mv = pickDir(rng, 3, 4, 1)
      if (isParallel(mv, n)) continue
      e = rat(rng.int(-8, 8))
    }
    if (tooBig(mv)) continue
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.lageEbenen]
    let eLatex = coordLatex(E, n, d)
    if (variant === 'normal') {
      eLatex = normalFormLatex(E, n, P0)
      const co = coordStep(rng, { name: E, n, p: P0 })
      if (co.choices.length < 4) continue
      steps.push(co)
      cards.push(GL_CARD.koordinaten)
    }
    if (variant === 'param') {
      eLatex = paramFormLatex(E, P0, [
        [r, u],
        [s, w],
      ])
      const cs = crossStep(rng, '\\vec u', '\\vec w', u, w)
      const co = coordStep(rng, { name: E, n, p: P0, from: raw })
      if (cs.choices.length < 4 || co.choices.length < 4) continue
      steps.push({ ...cs, question: `Die Richtungen von $${E}$ heißen $\\vec u$ und $\\vec w$. Ein Normalenvektor steht senkrecht auf beiden. Wie lautet $\\vec u \\times \\vec w$?` }, co)
      cards.push(CARD.kreuz, GL_CARD.koordinaten)
    }
    // Bild: zwei Ebenenstücke, bei Schnittgerade um einen Punkt der Geraden
    const nn = nums(n)
    const mn = nums(mv)
    let centers: readonly [N, N] = [footN([0, 0, 0], n, d), footN([0, 0, 0], mv, e)]
    let cut: VectorDrawing['segments'] = []
    if (truth === 2) {
      const dir = unitN(crossN(nn, mn))
      // Punkt der Schnittgeraden: n · x = d, m · x = e, dir · x = 0 (Cramer)
      const det3 = (a: N, b: N, cc: N) => dotN(a, crossN(b, cc))
      const D = det3(nn, mn, dir)
      const rhs = [num(d), num(e), 0]
      const X = [0, 1, 2].map((i) => {
        const rowsI = [nn, mn, dir].map((row, ri) => row.map((x, ci) => (ci === i ? rhs[ri] : x)))
        return det3(rowsI[0], rowsI[1], rowsI[2]) / D
      })
      centers = [X, X]
      cut = [{ from: addN(X, scaleN(-1.6 * PATCH, dir)), to: addN(X, scaleN(1.6 * PATCH, dir)), color: 'r', label: 'g', phase: 3 }]
    }
    const captions = [`$${E}$ und $${F}$ sind gleich.`, `$${E}$ und $${F}$ sind parallel.`, `$${E}$ und $${F}$ schneiden sich in einer Geraden.`]
    const drawingOf = (m2: Vec): VectorDrawing => ({
      ...emptyDrawing(3, captions[truth]),
      polygons: [patch(centers[0], n, PATCH, 'c', 1), ...(truth === 0 ? [] : [patch(centers[1], m2, PATCH, 'a', 2)])],
      segments: cut,
    })
    const form = `${variant}|${E}|${n.filter(isZero).length}|${signShape(n, mv)}`
    if (variant === 'coord' || variant === 'normal' || variant === 'param') {
      steps.push(parallelStep(rng, { vn: '\\vec n_1', wn: '\\vec n_2', v: n, w: mv, what: 'Normalenvektoren', card: GL_CARD.lageEbenen }))
      steps.push(planePosStep(rng, { truth, ...(truth <= 1 ? { k: c } : {}), d, e, E, F }))
      if (steps.some((st) => st.choices.length < 3)) continue
      return {
        kind: 'posPlanes',
        instruction: `Wie liegen die Ebenen $${E}$ und $${F}$ zueinander?`,
        functionLatex: stack(eLatex, coordLatex(F, mv, e)),
        steps,
        cards,
        resultLatex: `\\text{${PLANE_PAIR[truth]}}`,
        resultDrawing: drawingOf(mv),
        form: `posPlanes|${truth}|${form}`,
        data: { n: nums(n), d: [num(d)], m: nums(mv), e: [num(e)] },
        answer: [truth],
      }
    }
    // Parameter a in F (Zeile j) mit Normale c · n
    const j = rng.pick([0, 1, 2].filter((x) => !isZero(n[x])))
    const i0 = [0, 1, 2].find((x) => x !== j && !isZero(n[x]))!
    const a0 = mv[j]
    const line = (x: Rational) => math(`a = ${show(x)}`)
    const aStep = choiceStep(rng, {
      id: 'a',
      title: 'Parameter $a$',
      question: `Für welches $a$ ist der Normalenvektor von $${F}$ ein Vielfaches von $\\vec n_1 = ${vecLatex(n)}$?`,
      correct: line(a0),
      wrongs: [
        { content: line(n[j]), rule: 'gl-normal-factor' },
        { content: line(ratNeg(a0)), rule: 'vec-sign-slip' },
      ],
      hint: 'Bestimme den Faktor $k$ aus einer Zeile ohne $a$: Er muss in jeder Zeile derselbe sein.',
      explanation: {
        detailed: `Aus der Zeile für $${COORDS[i0]}$: $k = ${show(mv[i0])} : ${fac(n[i0])} = ${show(c)}$. Derselbe Faktor gilt für $${COORDS[j]}$: $a = ${show(c)} \\cdot ${fac(n[j])} = ${show(a0)}$.`,
        short: `$k = ${show(c)}$, also $a = ${show(a0)}$.`,
      },
      established: [`a = ${show(a0)}`],
      cards: [GL_CARD.lageEbenen],
    })
    steps.push(aStep)
    if (variant === 'a') {
      steps.push(planePosStep(rng, { truth, k: c, d, e, E, F }))
      if (steps.some((st) => st.choices.length < 3)) continue
      return {
        kind: 'posPlanes',
        instruction: `Für welches $a$ sind die Normalenvektoren von $${E}$ und $${F}$ parallel? Wie liegen die Ebenen dann zueinander?`,
        functionLatex: stack(eLatex, coordWithLatex(F, mv, j, show(e))),
        steps,
        cards,
        resultLatex: `a = ${show(a0)},\\; \\text{${PLANE_PAIR[truth]}}`,
        resultDrawing: drawingOf(mv),
        form: `posPlanes|${truth}|a|${j}|${form}`,
        data: { n: nums(n), d: [num(d)], m: nums(mv), e: [num(e)] },
        answer: [num(a0), truth],
      }
    }
    const lineB = (x: Rational) => math(`b = ${show(x)}`)
    const bStep = choiceStep(rng, {
      id: 'b',
      title: 'Parameter $b$',
      question: `Für welches $b$ sind die Ebenen gleich?`,
      correct: lineB(e),
      wrongs: [
        { content: lineB(d), rule: 'gl-pp-rhs' },
        { content: lineB(ratNeg(e)), rule: 'vec-sign-slip' },
      ],
      hint: `Gleiche Ebenen: Die ganze Gleichung von $${F}$ ist ein Vielfaches der von $${E}$, mit demselben Faktor auch rechts.`,
      explanation: { detailed: `Der Faktor ist $k = ${show(c)}$. Auch rechts: $b = ${show(c)} \\cdot ${fac(d)} = ${show(e)}$.`, short: `$b = ${show(c)} \\cdot ${fac(d)} = ${show(e)}$.` },
      established: [`b = ${show(e)}`],
      cards: [GL_CARD.lageEbenen],
    })
    steps.push(bStep)
    if (steps.some((st) => st.choices.length < 3)) continue
    return {
      kind: 'posPlanes',
      instruction: `Für welche Werte von $a$ und $b$ sind die Ebenen $${E}$ und $${F}$ gleich?`,
      functionLatex: stack(eLatex, coordWithLatex(F, mv, j, 'b')),
      steps,
      cards,
      resultLatex: `a = ${show(a0)},\\; b = ${show(e)}`,
      resultDrawing: drawingOf(mv),
      form: `posPlanes|ab|${j}|${form}`,
      data: { n: nums(n), d: [num(d)], m: nums(mv), e: [num(e)] },
      answer: [num(a0), num(e)],
    }
  }
}

// Lösung eines 2 × 2-Systems (Cramer)
function solve2(a: Rational, b: Rational, c: Rational, d: Rational, r1: Rational, r2: Rational): readonly [Rational, Rational] {
  const det = ratSub(m(a, d), m(b, c))
  return [ratDiv(ratSub(m(r1, d), m(b, r2)), det), ratDiv(ratSub(m(a, r2), m(r1, c)), det)]
}

// Schnittgerade zweier Ebenen (meetPlanes): Stufe 3 zwei Koordinatenformen (eine Variable frei wählen), Stufe 4 E in
// Parameterform in F einsetzen, Stufe 5 E durch drei Punkte
function buildMeetPlanes(rng: Rng, level: Level): Built {
  for (;;) {
    const [E, F] = rng.pick([
      ['E', 'F'],
      ['E_1', 'E_2'],
    ] as const)
    const g = rng.pick(['g', 'h'])
    const steps: GuidedStep[] = []
    const cards: string[] = [GL_CARD.lageEbenen]
    let P: Vec
    let u: Vec
    let t: string
    let n: Vec
    let d: Rational
    let mv: Vec
    let e: Rational
    let given: string
    let form: string
    if (level === 3) {
      t = rng.pick(['t', 'r', '\\lambda'])
      const kf = rng.int(0, 2)
      const [i, j] = [0, 1, 2].filter((x) => x !== kf)
      u = [0, 1, 2].map((x) => (x === kf ? rat(1) : rat(rng.int(-3, 3))))
      if (isZero(u[i]) && isZero(u[j])) continue
      P = [0, 1, 2].map((x) => (x === kf ? rat(0) : rat(rng.int(-4, 4))))
      if (vecIsZero(P) || isParallel(P, u)) continue
      n = primitive(crossVec(u, pickDir(rng, 3, 3, 1)))
      mv = primitive(crossVec(u, pickDir(rng, 3, 3, 1)))
      if (vecIsZero(n) || vecIsZero(mv) || isParallel(n, mv) || tooBig(n, 6) || tooBig(mv, 6)) continue
      if (isZero(n[kf]) && isZero(mv[kf])) continue
      d = vecDot(n, P)
      e = vecDot(mv, P)
      const [xi, xj, xk] = [COORDS[i], COORDS[j], COORDS[kf]]
      const rows: Row[] = [
        { c: [n[i], n[j]], r: d, rt: ratNeg(n[kf]) },
        { c: [mv[i], mv[j]], r: e, rt: ratNeg(mv[kf]) },
      ]
      const sys = (rs: readonly Row[]) => math(systemLatex(rs, [xi, xj], ['I', 'II'], t))
      const right = systemLatex(rows, [xi, xj], ['I', 'II'], t)
      const s1 = choiceStep(rng, {
        id: 'system',
        title: 'Variable frei wählen',
        question: `Setze $${xk} = ${t}$. Welches Gleichungssystem bleibt für $${xi}$ und $${xj}$?`,
        correct: math(right),
        wrongs: rng.shuffle<Wrong>([
          { content: sys(rows.map((rw) => ({ ...rw, rt: ratNeg(rw.rt!) }))), rule: 'gl-move-sign' },
          { content: sys(rows.map((rw) => ({ ...rw, rt: rat(0) }))), rule: 'gl-free-dropped' },
        ]),
        hint: `Zwei Gleichungen, drei Unbekannte: Eine darfst du frei wählen. Ersetze $${xk}$ durch $${t}$ und bring das Glied mit $${t}$ nach rechts.`,
        explanation: {
          detailed: `Mit $${xk} = ${t}$ steht $${t}$ wie eine Zahl in beiden Gleichungen; das Glied kommt mit umgedrehtem Vorzeichen nach rechts: $${right}$.`,
          short: `$${right}$.`,
        },
        cards: [GL_CARD.lageEbenen],
      })
      // x_i und x_j in Abhängigkeit von t
      const base = solve2(n[i], n[j], mv[i], mv[j], d, e)
      const slope = solve2(n[i], n[j], mv[i], mv[j], ratNeg(n[kf]), ratNeg(mv[kf]))
      if (!sameRats(base, [P[i], P[j]]) || !sameRats(slope, [u[i], u[j]])) throw new Error('Schnittgerade falsch gerechnet')
      const pair = (b0: readonly Rational[], sl: readonly Rational[]) => math(`${xi} = ${linLatex(b0[0], sl[0], t)},\\; ${xj} = ${linLatex(b0[1], sl[1], t)}`)
      // Rechenweg: f1 · (I) − f2 · (II), x_j fällt weg
      let [f1, f2] = [mv[j], n[j]]
      if (ratSign(f1) < 0 || (isZero(f1) && ratSign(f2) > 0)) [f1, f2] = [ratNeg(f1), ratNeg(f2)]
      const D = ratSub(m(f1, n[i]), m(f2, mv[i]))
      const Rc = ratSub(m(f1, d), m(f2, e))
      const Rt = ratSub(m(f1, ratNeg(n[kf])), m(f2, ratNeg(mv[kf])))
      const back = isZero(n[j]) ? 'II' : 'I'
      const comb = termsLatex([
        [f1, '\\text{(I)}'],
        [ratNeg(f2), '\\text{(II)}'],
      ])
      const sol = `${xi} = ${linLatex(P[i], u[i], t)},\\; ${xj} = ${linLatex(P[j], u[j], t)}`
      const s2 = choiceStep(rng, {
        id: 'loesen',
        title: 'Auflösen',
        question: `Löse das Gleichungssystem nach $${xi}$ und $${xj}$ auf. Was ergibt sich?`,
        correct: pair(base, slope),
        wrongs: [
          { content: pair(base, slope.map(ratNeg)), rule: 'gl-move-sign' },
          { content: pair(base, [rat(0), rat(0)]), rule: 'gl-free-dropped' },
        ],
        hint: `Rechne wie bei zwei Unbekannten; $${t}$ läuft dabei als Zahl mit. Nimm die Gleichungen so mal, dass $${xj}$ beim Abziehen wegfällt.`,
        explanation: {
          detailed: `$${comb}$: $${termsLatex([[D, xi]])} = ${linLatex(Rc, Rt, t)}$, also $${xi} = ${linLatex(P[i], u[i], t)}$. In (${back}) eingesetzt: $${xj} = ${linLatex(P[j], u[j], t)}$.`,
          short: `$${sol}$.`,
        },
        established: [sol],
        cards: [GL_CARD.lageEbenen],
      })
      const flipped = u.map((x, idx) => (idx === kf ? x : ratNeg(x)))
      const wrongs: WrongLine[] = [
        { p: P, v: u.map((x, idx) => (idx === kf ? rat(0) : x)), rule: 'gl-free-row' },
        { p: u, v: P, rule: 'gl-support-swapped' },
        { p: P, v: flipped, rule: 'gl-move-sign' },
      ]
      const columns = [0, 1, 2].map((x) => (x === kf ? t : linLatex(P[x], u[x], t)))
      const s3 = formStep(rng, {
        name: g,
        p: P,
        v: u,
        t,
        wrongs,
        hint: `Schreib $${xi}$, $${xj}$ und $${xk} = ${t}$ untereinander: Die Zahlen ohne $${t}$ bilden den Stützvektor, die Faktoren vor $${t}$ den Richtungsvektor (bei $${xk}$ eine $1$).`,
        why: `Untereinander: $\\vec x = ${columnLatex(columns)}$. Die Zahlen ohne $${t}$ ergeben den Stützvektor, die Faktoren vor $${t}$ den Richtungsvektor.`,
      })
      steps.push(s1, s2, { ...s3, cards: [GL_CARD.lageEbenen, GL_CARD.gerade] })
      given = stack(coordLatex(E, n, d), coordLatex(F, mv, e))
      form = `coord|${kf}|${t}|${g}|${signShape(n, mv, P)}`
    } else {
      // Stufe 4: E in Parameterform; Stufe 5: E durch drei Punkte (Richtungen AB und AC)
      const [r, s] = rng.pick(PLANE_PARAMS)
      t = r
      let p: Vec
      let w: Vec
      const [A, B, C] = rng.pick([
        ['A', 'B', 'C'],
        ['P', 'Q', 'R'],
        ['K', 'L', 'M'],
      ] as const)
      let pts: readonly Vec[] = []
      if (level === 4) {
        const n0 = pickDir(rng, 3, 3, 1)
        ;[u, w] = directionsFor(rng, n0)
        p = pickPoint(rng, 3, 3)
        if (tooBig(u, 6) || tooBig(w, 6)) continue
      } else {
        const tp = threePoints(rng)
        ;[p, u, w] = [tp.a, tp.u, tp.w]
        pts = [tp.a, tp.b, tp.c]
      }
      // F so, dass sich s gut ausrechnen lässt: m · w = ±1 oder ±2 und teilt m · u
      let found: Vec | null = null
      for (let k = 0; k < 60 && !found; k++) {
        const cand = pickDir(rng, 3, 3, 1)
        const mw = vecDot(cand, w)
        const mu = vecDot(cand, u)
        if (isZero(mw) || Math.abs(num(mw)) > 2 || isZero(mu) || ratDiv(mu, mw).d !== 1n) continue
        if (isParallel(cand, crossVec(u, w))) continue
        found = cand
      }
      if (!found) continue
      mv = found
      const mw = vecDot(mv, w)
      const mu = vecDot(mv, u)
      const alpha = nonzero(rng)
      e = ratAdd(vecDot(mv, p), m(mw, alpha))
      const beta = ratNeg(ratDiv(mu, mw))
      P = vecAdd(p, vecScale(alpha, w))
      u = vecAdd(u, vecScale(beta, w))
      const uOld = vecSub(u, vecScale(beta, w))
      n = primitive(crossVec(uOld, w))
      d = vecDot(n, p)
      if (tooBig(P) || tooBig(u) || vecIsZero(P)) continue
      if (level === 5) {
        const s1 = connectStep(rng, A, B, pts[0], pts[1])
        const s2 = { ...connectStep(rng, A, C, pts[0], pts[2]), id: 'verbindung-2' }
        steps.push(s1, s2)
        cards.push(CARD.verbindung)
      }
      const eForm = paramFormLatex(E, p, [
        [r, uOld],
        [s, w],
      ])
      const ins = insertStep(rng, {
        into: F,
        from: E,
        n: mv,
        d: e,
        p,
        dirs: [
          [r, uOld],
          [s, w],
        ],
        card: GL_CARD.lageEbenen,
      })
      const c0 = ins.c0
      const lineS = (b0: Rational, sl: Rational) => math(`${s} = ${linLatex(b0, sl, r)}`)
      const sWrongs: Wrong[] = [
        { content: lineS(ratDiv(ratAdd(e, c0), mw), ratDiv(mu, mw)), rule: 'gl-move-sign' },
        { content: lineS(alpha, ratNeg(beta)), rule: 'gl-move-sign' },
      ]
      if (!ratEq(mw, rat(1))) sWrongs.push({ content: lineS(ratSub(e, c0), ratNeg(mu)), rule: 'vec-backsub-divide' })
      const rel = `${s} = ${linLatex(alpha, beta, r)}`
      const s3 = choiceStep(rng, {
        id: 'aufloesen',
        title: `Nach $${s}$ auflösen`,
        question: `Löse die Gleichung nach $${s}$ auf. Was ergibt sich?`,
        correct: math(rel),
        wrongs: rng.shuffle(sWrongs),
        hint: `Bring alles ohne $${s}$ auf die rechte Seite (Vorzeichen drehen) und teile durch den Faktor vor $${s}$.`,
        explanation: {
          detailed: `$${insertedLatex(c0, [mu, mw], [r, s], e)}$, also $${termsLatex([[mw, s]])} = ${linLatex(ratSub(e, c0), ratNeg(mu), r)}$ und $${rel}$.`,
          short: `$${rel}$.`,
        },
        established: [rel],
        cards: [GL_CARD.lageEbenen],
      })
      const wrongs: WrongLine[] = [
        { p, v: u, rule: 'gl-relation-partial' },
        { p: P, v: uOld, rule: 'gl-relation-partial' },
        { p: u, v: P, rule: 'gl-support-swapped' },
      ]
      const s4 = formStep(rng, {
        name: g,
        p: P,
        v: u,
        t: r,
        wrongs,
        hint: `Setz $${rel}$ in die Parameterform von $${E}$ ein und ordne nach $${r}$: Was ohne $${r}$ bleibt, ist der Stützvektor, der Faktor vor $${r}$ die Richtung.`,
        why: `Eingesetzt: $\\vec x = ${vecLatex(p)} + ${r} ${vecLatex(uOld)} + \\left(${linLatex(alpha, beta, r)}\\right) ${vecLatex(w)}$. Geordnet: Stützvektor $${vecLatex(p)} + ${fac(alpha)} \\cdot ${vecLatex(w)} = ${vecLatex(P)}$, Richtung $${vecLatex(uOld)} + ${fac(beta)} \\cdot ${vecLatex(w)} = ${vecLatex(u)}$.`,
      })
      const insQuestion =
        level === 5
          ? `Mit den Richtungen $\\overrightarrow{${A}${B}}$ und $\\overrightarrow{${A}${C}}$ ist $${eForm}$. Setz ihre Zeilen für $x$, $y$ und $z$ in $${F}$ ein. Welche Gleichung entsteht?`
          : ins.step.question
      steps.push({ ...ins.step, question: insQuestion }, s3, { ...s4, cards: [GL_CARD.lageEbenen, GL_CARD.gerade] })
      given = level === 5 ? stack(`${pointLatex(A, pts[0])},\\; ${pointLatex(B, pts[1])},\\; ${pointLatex(C, pts[2])}`, coordLatex(F, mv, e)) : stack(eForm, coordLatex(F, mv, e))
      form = `${level === 5 ? 'points' : 'param'}|${num(alpha)}|${num(beta)}|${r}|${g}|${signShape(p, uOld, w, mv)}`
    }
    if (steps.some((st) => st.choices.length < 3)) continue
    const dir = unitN(nums(u))
    const X = nums(P)
    const drawing: VectorDrawing = {
      ...emptyDrawing(3, `$${E}$ und $${F}$ schneiden sich in der Geraden $${g}$.`),
      polygons: [patch(X, n, PATCH, 'c', 1), patch(X, mv, PATCH, 'a', 2)],
      segments: [{ from: addN(X, scaleN(-1.6 * PATCH, dir)), to: addN(X, scaleN(1.6 * PATCH, dir)), color: 'r', label: g, phase: 3 }],
      points: [{ at: X, color: 'r', phase: 3 }],
      arrows: [{ from: X, to: addN(X, nums(u)), color: 'r', phase: 3 }],
    }
    return {
      kind: 'meetPlanes',
      instruction: level === 5 ? `Die Ebene $${E}$ geht durch die drei Punkte. Bestimme die Schnittgerade $${g}$ von $${E}$ und $${F}$.` : `Bestimme die Schnittgerade $${g}$ der Ebenen $${E}$ und $${F}$.`,
      functionLatex: given,
      steps,
      cards,
      resultLatex: paramFormLatex(g, P, [[t, u]]),
      resultDrawing: drawing,
      form: `meetPlanes|${form}`,
      data: { n: nums(n), d: [num(d)], m: nums(mv), e: [num(e)] },
      answer: [...nums(P), ...nums(u)],
    }
  }
}

export const LAGE_BUILDERS = {
  posLines: (rng: Rng, level: Level) => buildLinePair(rng, level, false),
  meetLines: (rng: Rng, level: Level) => buildLinePair(rng, level, true),
  posLinePlane: (rng: Rng, level: Level) => buildLinePlane(rng, level, false),
  meetLinePlane: (rng: Rng, level: Level) => buildLinePlane(rng, level, true),
  posPlanes: buildPosPlanes,
  meetPlanes: buildMeetPlanes,
} as const satisfies Partial<Record<VectorKind, (rng: Rng, level: Level) => Built>>
