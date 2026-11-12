import type { Explanation } from '../explain/texts.ts'
import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { buildClassifyParam, buildPerp } from './dotTasks.ts'
import { type DragCondition, type DragFrame, type DragLine, type DragStep, type DragTrap, dragPositions, dragSolutions, judgeDrag, paramOf } from './drag.ts'
import { vectorErrorRule } from './errorRules.ts'
import { type DrawArrow, type DrawPoint, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, CARD, POINT_LETTERS, VEC_LETTERS } from './taskKit.ts'
import { arrowName, columnLatex, pointLatex, vec, vecName } from './vec.ts'

// Zieh-Aufgaben des Bausteins „Skalarprodukt und Winkel" (M7 Schritt 2b, docs/PLAN-M7.md): Die Spitze eines Pfeils oder
// ein Punkt wird in der Ebene gezogen, bis eine Bedingung gilt; es gibt fast immer mehrere richtige Stellen. Jede Stelle
// rastet auf ganzen Zahlen ein und lässt sich auch ohne Ziehen über Knöpfe einstellen. Die Stufen wie sonst:
// 1 eine Bedingung (senkrecht, spitz, stumpf), 2 Skalarprodukt mit Wert, Winkel 45° oder 135°, rechter Winkel an einer Ecke,
// 3 zwei Bedingungen zusammen (senkrecht und Länge, rechter Winkel gegenüber einer Seite), 4 mit Parameter entlang einer
// Geraden und danach gerechnet wie in der Klausur, 5 ineinander (Diagonalen einer Raute, (a − b) ⊥ b, zwei Skalarprodukte).
// Das Bild zeigt nur Gegebenes; was beim Ziehen mitläuft, steht in DragStep (drag.ts).

// Anteil der Zieh-Aufgaben unter den Nummern des Bausteins „skalar"; mit eigenem Zufall vorweg gewählt, damit die übrigen
// Nummern ihre Aufgabe aus Schritt 2a behalten
export const DRAG_SHARE = 0.25

export const DRAG_VARIANTS: Readonly<Record<Level, readonly string[]>> = {
  1: ['perp', 'acute', 'obtuse'],
  2: ['dotValue', 'angle', 'rightAt'],
  3: ['perpLength', 'thales'],
  4: ['perpLine', 'acuteLine'],
  5: ['rhombus', 'thalesVec', 'twoDots'],
}

// ------------------------------------------------------------------ Hilfen

type V = readonly number[]
const O: V = [0, 0]
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1]
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]]
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]]
const scale = (k: number, a: V): V => [k * a[0], k * a[1]]
const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y))
const rot = (a: V): V => {
  const g = gcd(a[0], a[1]) || 1
  return [-a[1] / g, a[0] / g]
}
const same = (a: V, b: V) => a[0] === b[0] && a[1] === b[1]
const inFrame = (p: V, f: DragFrame) => p[0] >= f.xmin && p[0] <= f.xmax && p[1] >= f.ymin && p[1] <= f.ymax
const FRAME: DragFrame = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 }
const randVec = (rng: Rng, lo: number, hi: number): V => [rng.int(lo, hi), rng.int(lo, hi)]
const colLatex = (v: V) => columnLatex(v.map(String))
// c1 x + c2 y ohne Faktor 1 und ohne „+ −“
function linXY(c1: number, c2: number): string {
  const term = (c: number, v: string, first: boolean) => {
    if (c === 0) return ''
    const sign = c < 0 ? (first ? '-' : ' - ') : first ? '' : ' + '
    return `${sign}${Math.abs(c) === 1 ? '' : Math.abs(c)}${v}`
  }
  return term(c1, 'x', true) + term(c2, 'y', c1 === 0) || '0'
}
const signs = (...vs: V[]) => vs.map((v) => v.map((x) => (x < 0 ? '-' : x === 0 ? '0' : '+')).join('')).join(',')

// Bedingungen: Skalarprodukt von w mit p − from, Länge von p − from (Quadrat), allgemein
function dotCond(w: V, from: V, rel: '=' | '<' | '>', target: number, side: string): DragCondition {
  return { kind: 'quadratic', lin: w, quad: 0, c0: -dot(w, from), rel, target, side, dotWith: w }
}
const lengthCond = (target2: number, side: string): DragCondition => ({ kind: 'quadratic', lin: [0, 0], quad: 1, c0: 0, rel: '=', target: target2, side, lengthOf: true })
const general = (lin: V, quad: number, c0: number, rel: '=' | '<' | '>', target: number, side = ''): DragCondition => ({ kind: 'quadratic', lin, quad, c0, rel, target, side })
const trap = (rule: string, ...conditions: DragCondition[]): DragTrap => ({ conditions, rule })
// rechter Winkel am Punkt V zwischen V → W und V → p: (W − V) · (p − V) = 0
const rightAtCond = (V: V, W: V, side: string) => dotCond(sub(W, V), V, '=', 0, side)
// rechter Winkel bei p zwischen p → A und p → B: |p|² − (A + B) · p + A · B = 0
const rightAtP = (A: V, B: V, side: string) => general(scale(-1, add(A, B)), 1, dot(A, B), '=', 0, side)

const ZERO_NOTE = (bn: string) => `Der Nullvektor hat keine Richtung: Zieh die Spitze von $${bn}$ vom Ursprung weg.`
const NOT_MOVED = 'Zieh zuerst an eine andere Stelle.'

type Spec = {
  readonly mode: 'arrow' | 'point'
  readonly name: string
  readonly from: V
  readonly links?: readonly V[]
  readonly liveAngle?: V
  readonly liveSum?: V
  readonly liveDiff?: V
  readonly frame: DragFrame
  readonly line?: DragLine
  readonly conditions: readonly DragCondition[]
  readonly forbidden: readonly { readonly at: V; readonly note: string }[]
  readonly traps: readonly DragTrap[]
  readonly start?: V
}

// Fertiger Zieh-Schritt: Start (vom Bauplan, beim Pfeil sonst der Fuß, beim Punkt eine Stelle, die weder richtig noch ein
// typischer Fehler ist) und eine richtige Stelle; null, wenn es keine richtige Stelle gibt. An der Startstelle selbst
// prüft die Engine nicht (Hinweis „Zieh zuerst …“), damit ein Druck auf „Prüfen“ ohne Ziehen nicht als Fehler zählt.
function makeDrag(rng: Rng, spec: Spec): DragStep | null {
  const whys: Record<string, Explanation> = {}
  for (const t of spec.traps) whys[t.rule] = vectorErrorRule(t.rule).why
  const build = (start: V): DragStep => {
    const own = spec.forbidden.some((f) => same(f.at, start))
    return { ...spec, color: 'b', start, solution: start, whys, forbidden: own ? spec.forbidden : [...spec.forbidden, { at: start, note: NOT_MOVED }] }
  }
  let step = build(spec.start ?? spec.from)
  if (!spec.start && spec.mode === 'point') {
    const plain = dragPositions(step).filter((p) => judgeDrag(step, p).kind === 'wrong')
    if (plain.length === 0) return null
    step = build(rng.pick(plain))
  }
  const solutions = dragSolutions(step)
  if (solutions.length === 0) return null
  return { ...step, solution: rng.pick(solutions) }
}

function frameOf(...ps: V[]): DragFrame {
  return {
    xmin: Math.min(FRAME.xmin, ...ps.map((p) => p[0])),
    xmax: Math.max(FRAME.xmax, ...ps.map((p) => p[0])),
    ymin: Math.min(FRAME.ymin, ...ps.map((p) => p[1])),
    ymax: Math.max(FRAME.ymax, ...ps.map((p) => p[1])),
  }
}

// Bild des Gegebenen mit festem Ausschnitt
function given(frame: DragFrame, caption: string, arrows: DrawArrow[], points: DrawPoint[] = [], segments: DrawSegment[] = []): VectorDrawing {
  return { ...emptyDrawing(2, caption), frame, arrows, points, segments }
}

// Schritt mit Ziehen; die einzige „Antwort" ist eine richtige Stelle als Text
function dragStep(drag: DragStep, drawing: VectorDrawing, question: string, hint: string, explanation: Explanation, cards: readonly string[]): GuidedStep {
  const at = drag.line ? `$${drag.line.param} = ${paramOf(drag.line, drag.solution)}$` : drag.mode === 'point' ? `$${pointLatex(drag.name, vec(...drag.solution))}$` : `$${drag.name} = ${colLatex(sub(drag.solution, drag.from))}$`
  return {
    id: 'ziehen',
    title: drag.mode === 'point' ? 'Punkt ziehen' : 'Pfeil ziehen',
    question,
    // bei genau einer richtigen Stelle ohne „Zum Beispiel“
    choices: [{ id: 'richtig', content: dragSolutions(drag).length === 1 ? at : `Zum Beispiel ${at}`, correct: true }],
    hint,
    explanation,
    cards,
    drawing,
    drag,
  }
}

// Ergebnis-Bild: Gegebenes mit der Lösung
function solved(drawing: VectorDrawing, drag: DragStep, caption: string, angle?: { at: V; u: V; v: V; label?: string }): VectorDrawing {
  const tip = drag.solution
  const extra: DrawArrow[] = drag.mode === 'arrow' ? [{ from: drag.from, to: tip, color: 'b', label: drag.name }] : []
  return {
    ...drawing,
    caption,
    arrows: [...drawing.arrows, ...extra],
    points: drag.mode === 'point' ? [...drawing.points, { at: tip, label: drag.name, color: 'b' }] : drawing.points,
    segments: [...drawing.segments, ...(drag.links ?? []).map((l) => ({ from: l, to: tip, color: 'b' as const }))],
    ...(angle ? { angles: [{ ...angle, color: 'r' as const }] } : {}),
  }
}

// Zwei Buchstaben für Vektoren und drei für Punkte
function names(rng: Rng) {
  const i = rng.int(0, 2)
  const v = VEC_LETTERS[i]
  const p = rng.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], [...POINT_LETTERS[2], 'T']] as const)
  return { an: vecName(v[0]), bn: vecName(v[1]), cn: vecName(v[2]), key: v[0], P: p }
}

type Result = { readonly task: Built } | null

// ------------------------------------------------------------------ Stufe 1: senkrecht, spitz, stumpf

function variantSimple(rng: Rng, level: Level, variant: 'perp' | 'acute' | 'obtuse'): Result {
  const { an, bn, key } = names(rng)
  const a = randVec(rng, -4, 4)
  if (a[0] === 0 || a[1] === 0 || Math.abs(a[0]) === Math.abs(a[1])) return null
  const side = `${an} \\cdot ${bn}`
  const par = general([-a[1], a[0]], 0, 0, '=', 0)
  const conditions =
    variant === 'perp' ? [dotCond(a, O, '=', 0, side)] : [dotCond(a, O, variant === 'acute' ? '>' : '<', 0, side)]
  const traps =
    variant === 'perp'
      ? [trap('vec-angle-zero', par), trap('vec-perp-swap', general([a[0], -a[1]], 0, 0, '=', 0)), trap('vec-perp-swap', general([a[1], a[0]], 0, 0, '=', 0))]
      : [trap('vec-right-not-acute', dotCond(a, O, '=', 0, '')), trap('vec-angle-sign', dotCond(a, O, variant === 'acute' ? '<' : '>', 0, ''))]
  const frame = frameOf(a)
  const drag = makeDrag(rng, { mode: 'arrow', name: bn, from: O, liveAngle: a, frame, conditions, forbidden: [{ at: O, note: ZERO_NOTE(bn) }], traps })
  if (!drag) return null
  const drawing = given(frame, `$${an} = ${colLatex(a)}$ ist fest. Zieh die Spitze von $${bn}$; sie rastet auf ganzen Zahlen ein.`, [{ from: O, to: a, color: 'a', label: an }])
  const word = { perp: 'senkrecht auf', acute: 'spitz', obtuse: 'stumpf' }[variant]
  const question =
    variant === 'perp' ? `Zieh $${bn}$ so, dass $${bn}$ senkrecht auf $${an}$ steht.` : `Zieh $${bn}$ so, dass der Winkel zwischen $${an}$ und $${bn}$ ${word} ist.`
  // so wie beschrieben: vertauscht, ein Vorzeichen geändert (nicht gekürzt)
  const r: V = [-a[1], a[0]]
  const explanation: Explanation =
    variant === 'perp'
      ? {
          detailed: `Senkrecht heißt $${side} = 0$. Vertauschst du die Einträge von $${an}$ und änderst bei einem das Vorzeichen, ist das Skalarprodukt $0$, z. B. $${bn} = ${colLatex(r)}$. Jedes Vielfache davon steht auch senkrecht.`,
          short: `Senkrecht: $${side} = 0$, z. B. $${bn} = ${colLatex(r)}$.`,
        }
      : {
          detailed: `${variant === 'acute' ? 'Spitz' : 'Stumpf'} heißt $${side} ${variant === 'acute' ? '>' : '<'} 0$: Die Längen sind positiv, also hat das Skalarprodukt das Vorzeichen von $\\cos\\varphi$. ${variant === 'acute' ? 'Die Spitze liegt auf derselben Seite wie $' + an + '$' : 'Die Spitze liegt auf der anderen Seite als $' + an + '$'}, gemessen an der Geraden senkrecht zu $${an}$.`,
          short: `${variant === 'acute' ? 'Spitz' : 'Stumpf'}: $${side} ${variant === 'acute' ? '>' : '<'} 0$.`,
        }
  const hint =
    variant === 'perp'
      ? `Senkrecht heißt $${side} = 0$. Probiere: Einträge von $${an}$ vertauschen und bei einem das Vorzeichen ändern.`
      : `${variant === 'acute' ? 'Spitz' : 'Stumpf'} heißt: Skalarprodukt ${variant === 'acute' ? 'positiv' : 'negativ'}. Rechne $${side}$ mit deiner Stelle nach.`
  const step = dragStep(drag, drawing, question, hint, explanation, [CARD.senkrecht])
  const v = drag.solution
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)}`,
      steps: [step],
      cards: [CARD.skalar, CARD.senkrecht],
      resultLatex: `${side} ${variant === 'perp' ? '=' : variant === 'acute' ? '>' : '<'} 0,\\; \\text{z.\\,B. } ${bn} = ${colLatex(v)}`,
      resultDrawing: solved(drawing, drag, `Zum Beispiel $${bn} = ${colLatex(v)}$: $${side} = ${dot(a, v)}$.`, { at: O, u: a, v, label: variant === 'perp' ? '90^\\circ' : '\\varphi' }),
      form: `drag|${variant}|${level}|${key}|${signs(a)}|${Math.abs(a[0]) > Math.abs(a[1]) ? 'flach' : 'steil'}`,
      data: { a },
      answer: v,
      dragOnly: true,
    },
  }
}

// ------------------------------------------------------------------ Stufe 2

function variantDotValue(rng: Rng, level: Level): Result {
  const { an, bn, key } = names(rng)
  const a = randVec(rng, -4, 4)
  const b0 = randVec(rng, -5, 5)
  const k = dot(a, b0)
  if (a[0] === 0 || a[1] === 0 || k === 0 || Math.abs(k) > 20) return null
  const side = `${an} \\cdot ${bn}`
  const frame = frameOf(a)
  const traps = [
    trap('vec-dot-sign', dotCond(a, O, '=', -k, '')),
    trap('vec-dot-cross', general([a[1], a[0]], 0, 0, '=', k)),
    trap('vec-dot-sum', general([1, 1], 0, a[0] + a[1], '=', k)),
  ]
  const drag = makeDrag(rng, { mode: 'arrow', name: bn, from: O, liveAngle: a, frame, conditions: [dotCond(a, O, '=', k, side)], forbidden: [{ at: O, note: ZERO_NOTE(bn) }], traps })
  if (!drag) return null
  const drawing = given(frame, `$${an} = ${colLatex(a)}$ ist fest. Zieh die Spitze von $${bn}$.`, [{ from: O, to: a, color: 'a', label: an }])
  const question = `Zieh $${bn}$ so, dass $${side} = ${k}$ ist.`
  const v = drag.solution
  const step = dragStep(
    drag,
    drawing,
    question,
    `Für $${bn} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}$ soll $${linXY(a[0], a[1])} = ${k}$ werden. Rechne mit deiner Stelle nach.`,
    {
      detailed: `Für $${bn} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}$ ist $${side} = ${linXY(a[0], a[1])}$. Alle Spitzen mit $${linXY(a[0], a[1])} = ${k}$ liegen auf einer Geraden senkrecht zu $${an}$, z. B. $${bn} = ${colLatex(v)}$.`,
      short: `$${side} = ${k}$, z. B. $${bn} = ${colLatex(v)}$.`,
    },
    [CARD.skalar],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)}`,
      steps: [step],
      cards: [CARD.skalar],
      resultLatex: `\\text{z.\\,B. } ${bn} = ${colLatex(v)}`,
      resultDrawing: solved(drawing, drag, `Zum Beispiel $${bn} = ${colLatex(v)}$: $${side} = ${dot(a, v)}$.`),
      form: `drag|dotValue|${level}|${key}|${signs(a)}|${Math.sign(k)}`,
      data: { a, k: [k] },
      answer: v,
      dragOnly: true,
    },
  }
}

// Vektoren, zu denen ein ganzzahliger Pfeil im Winkel von 45° bzw. 135° passt
const ANGLE_BASES: readonly V[] = [[2, 1], [1, 2], [3, 1], [1, 3], [-2, 1], [-1, 2], [2, -1], [1, -3], [3, -1], [-1, 3], [2, 0], [0, 3], [3, 0], [0, -2], [-3, 0], [3, 2], [2, 3], [-3, 2]]

function variantAngle(rng: Rng, level: Level): Result {
  const { an, bn, key } = names(rng)
  const a = rng.pick(ANGLE_BASES)
  const deg = rng.pick([45, 135])
  const side = '\\varphi'
  const frame = frameOf(a)
  const traps = [trap('vec-angle-supplement', { kind: 'angle', with: a, deg: 180 - deg, side: '' })]
  const drag = makeDrag(rng, { mode: 'arrow', name: bn, from: O, liveAngle: a, frame, conditions: [{ kind: 'angle', with: a, deg, side }], forbidden: [{ at: O, note: ZERO_NOTE(bn) }], traps })
  if (!drag) return null
  const drawing = given(frame, `$${an} = ${colLatex(a)}$ ist fest. Zieh die Spitze von $${bn}$.`, [{ from: O, to: a, color: 'a', label: an }])
  const question = `Zieh $${bn}$ so, dass $${an}$ und $${bn}$ einen Winkel von $${deg}^\\circ$ einschließen.`
  const v = drag.solution
  const cos = deg === 45 ? '\\frac{\\sqrt{2}}{2}' : '-\\frac{\\sqrt{2}}{2}'
  const step = dragStep(
    drag,
    drawing,
    question,
    `$\\cos ${deg}^\\circ = ${cos}$. Prüfe mit $\\cos\\varphi = \\frac{${an} \\cdot ${bn}}{\\lvert ${an} \\rvert \\cdot \\lvert ${bn} \\rvert}$.`,
    {
      detailed: `Gesucht ist $\\cos\\varphi = \\frac{${an} \\cdot ${bn}}{\\lvert ${an} \\rvert \\cdot \\lvert ${bn} \\rvert} = ${cos}$. Zum Beispiel $${bn} = ${colLatex(v)}$: $${an} \\cdot ${bn} = ${dot(a, v)}$, $\\lvert ${an} \\rvert^2 = ${dot(a, a)}$, $\\lvert ${bn} \\rvert^2 = ${dot(v, v)}$, und $\\frac{${dot(a, v)}}{\\sqrt{${dot(a, a) * dot(v, v)}}} = ${cos}$.`,
      short: `$\\cos\\varphi = ${cos}$, z. B. $${bn} = ${colLatex(v)}$.`,
    },
    [CARD.winkel],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)}`,
      steps: [step],
      cards: [CARD.skalar, CARD.winkel],
      resultLatex: `\\text{z.\\,B. } ${bn} = ${colLatex(v)}`,
      resultDrawing: solved(drawing, drag, `Zum Beispiel $${bn} = ${colLatex(v)}$: Der Winkel ist $${deg}^\\circ$.`, { at: O, u: a, v, label: `${deg}^\\circ` }),
      form: `drag|angle|${level}|${key}|${deg}|${signs(a)}`,
      data: { a, deg: [deg] },
      answer: v,
      dragOnly: true,
    },
  }
}

// Dreieck mit zwei festen Ecken; die dritte wird gezogen
function triangle(rng: Rng): { A: V; B: V } | null {
  const A = randVec(rng, -4, 4)
  const B = randVec(rng, -4, 4)
  const d = sub(B, A)
  if (d[0] === 0 && d[1] === 0) return null
  if (Math.hypot(...d) < 2.5) return null
  return { A, B }
}

function variantRightAt(rng: Rng, level: Level): Result {
  const { P, key } = names(rng)
  const [An, Bn, Cn] = P
  const t = triangle(rng)
  if (!t) return null
  const atA = rng.chance(0.5)
  const [Vn, Wn] = atA ? [An, Bn] : [Bn, An]
  const [Vp, Wp] = atA ? [t.A, t.B] : [t.B, t.A]
  const side = `${arrowName(Vn, Wn)} \\cdot ${arrowName(Vn, Cn)}`
  const frame = frameOf(t.A, t.B)
  const traps = [
    trap('vec-right-wrong-corner', rightAtCond(Wp, Vp, '')),
    trap('vec-right-wrong-corner', rightAtP(t.A, t.B, '')),
  ]
  const drag = makeDrag(rng, {
    mode: 'point',
    name: Cn,
    from: Vp,
    links: [t.A, t.B],
    liveAngle: sub(Wp, Vp),
    frame,
    conditions: [rightAtCond(Vp, Wp, side)],
    forbidden: [
      { at: t.A, note: `Dann fallen $${Cn}$ und $${An}$ zusammen, und es gibt kein Dreieck.` },
      { at: t.B, note: `Dann fallen $${Cn}$ und $${Bn}$ zusammen, und es gibt kein Dreieck.` },
    ],
    traps,
  })
  if (!drag) return null
  const drawing = given(frame, `$${An}$ und $${Bn}$ sind fest. Zieh den Punkt $${Cn}$.`, [], [{ at: t.A, label: An }, { at: t.B, label: Bn }], [{ from: t.A, to: t.B, color: 'muted' }])
  const question = `Zieh $${Cn}$ so, dass das Dreieck $${An}${Bn}${Cn}$ bei $${Vn}$ einen rechten Winkel hat.`
  const c = drag.solution
  const step = dragStep(
    drag,
    drawing,
    question,
    `Rechter Winkel bei $${Vn}$: Die Pfeile von $${Vn}$ zu den anderen Ecken stehen senkrecht, $${side} = 0$.`,
    {
      detailed: `Beide Pfeile beginnen bei $${Vn}$: $${arrowName(Vn, Wn)} = ${colLatex(sub(Wp, Vp))}$ und $${arrowName(Vn, Cn)} = ${Cn} - ${Vn}$. Rechter Winkel heißt $${side} = 0$. Alle passenden Punkte liegen auf der Geraden durch $${Vn}$ senkrecht zu $${arrowName(Vn, Wn)}$, z. B. $${pointLatex(Cn, vec(...c))}$.`,
      short: `$${side} = 0$, z. B. $${pointLatex(Cn, vec(...c))}$.`,
    },
    [CARD.senkrecht],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${pointLatex(An, vec(...t.A))},\\; ${pointLatex(Bn, vec(...t.B))}`,
      steps: [step],
      cards: [CARD.verbindung, CARD.senkrecht],
      resultLatex: `\\text{z.\\,B. } ${pointLatex(Cn, vec(...c))}`,
      resultDrawing: solved(drawing, drag, `Zum Beispiel $${pointLatex(Cn, vec(...c))}$: rechter Winkel bei $${Vn}$.`, { at: Vp, u: sub(Wp, Vp), v: sub(c, Vp) }),
      form: `drag|rightAt|${level}|${An}|${atA ? 'A' : 'B'}|${signs(sub(t.B, t.A))}|${key}`,
      data: { A: t.A, B: t.B, at: [atA ? 0 : 1] },
      answer: c,
      dragOnly: true,
    },
  }
}

// ------------------------------------------------------------------ Stufe 3: zwei Bedingungen

function variantPerpLength(rng: Rng, level: Level): Result {
  const { an, bn, key } = names(rng)
  const a = randVec(rng, -4, 4)
  if (a[0] === 0 || a[1] === 0 || Math.abs(a[0]) === Math.abs(a[1])) return null
  const g = gcd(a[0], a[1])
  // gleich lang wie a, doppelt so lang, halb so lang oder eine Länge als Zahl
  const kind = rng.pick(['same', 'double', 'half', 'number'] as const)
  const factor = kind === 'same' ? 1 : kind === 'double' ? 2 : kind === 'half' ? 0.5 : rng.pick([1, 2, 3]) / g
  const base: V = [-a[1], a[0]]
  const target = scale(factor, base)
  if (!target.every((x) => Number.isInteger(x) && Math.abs(x) <= 5)) return null
  const L2 = dot(target, target)
  if (L2 === 0) return null
  const sideDot = `${an} \\cdot ${bn}`
  const sideLen = `\\lvert ${bn} \\rvert^2`
  const lengthWord = { same: `genauso lang wie $${an}$`, double: `doppelt so lang wie $${an}$`, half: `halb so lang wie $${an}$`, number: `$\\lvert ${bn} \\rvert = ${Number.isInteger(Math.sqrt(L2)) ? Math.sqrt(L2) : `\\sqrt{${L2}}`}$` }[kind]
  const frame = frameOf(a)
  const traps = [
    trap('vec-angle-zero', general([-a[1], a[0]], 0, 0, '=', 0), lengthCond(L2, '')),
    trap('vec-perp-swap', general([a[0], -a[1]], 0, 0, '=', 0), lengthCond(L2, '')),
    trap('vec-perp-swap', general([a[1], a[0]], 0, 0, '=', 0), lengthCond(L2, '')),
  ]
  const drag = makeDrag(rng, { mode: 'arrow', name: bn, from: O, frame, conditions: [dotCond(a, O, '=', 0, sideDot), lengthCond(L2, sideLen)], forbidden: [{ at: O, note: ZERO_NOTE(bn) }], traps })
  if (!drag) return null
  const drawing = given(frame, `$${an} = ${colLatex(a)}$ ist fest. Zieh die Spitze von $${bn}$.`, [{ from: O, to: a, color: 'a', label: an }])
  const question = `Zieh $${bn}$ so, dass $${bn}$ senkrecht auf $${an}$ steht und ${lengthWord} ist.`
  const v = drag.solution
  const step = dragStep(
    drag,
    drawing,
    question,
    `Zwei Bedingungen: $${sideDot} = 0$ und $${sideLen} = ${L2}$. Erst die Richtung senkrecht zu $${an}$ suchen, dann die Länge anpassen.`,
    {
      detailed: `Senkrecht: $${sideDot} = 0$, also ein Vielfaches von $${colLatex(rot(a))}$. Länge: $${sideLen} = ${L2}$${kind === 'number' ? '' : ` (denn $\\lvert ${an} \\rvert^2 = ${dot(a, a)}$)`}. Es gibt genau zwei Lösungen, entgegengesetzt: $${colLatex(target)}$ und $${colLatex(scale(-1, target))}$.`,
      short: `$${sideDot} = 0$ und $${sideLen} = ${L2}$: $${colLatex(target)}$ oder $${colLatex(scale(-1, target))}$.`,
    },
    [CARD.senkrecht, CARD.laenge],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)}`,
      steps: [step],
      cards: [CARD.senkrecht, CARD.laenge],
      resultLatex: `${bn}_1 = ${colLatex(target)},\\; ${bn}_2 = ${colLatex(scale(-1, target))}`,
      resultDrawing: {
        ...solved(drawing, drag, `Zwei Lösungen: $${colLatex(target)}$ und $${colLatex(scale(-1, target))}$.`, { at: O, u: a, v: target }),
        arrows: [...drawing.arrows, { from: O, to: target, color: 'b', label: `${bn}_1` }, { from: O, to: scale(-1, target), color: 'c', label: `${bn}_2` }],
      },
      form: `drag|perpLength|${level}|${kind}|${key}|${signs(a)}`,
      data: { a, L2: [L2] },
      answer: v,
      dragOnly: true,
    },
  }
}

function variantThales(rng: Rng, level: Level): Result {
  const { P, key } = names(rng)
  const [An, Bn, Cn] = P
  const t = triangle(rng)
  if (!t) return null
  const side = `${arrowName(Cn, An)} \\cdot ${arrowName(Cn, Bn)}`
  const frame = frameOf(t.A, t.B)
  const traps = [trap('vec-right-wrong-corner', rightAtCond(t.A, t.B, '')), trap('vec-right-wrong-corner', rightAtCond(t.B, t.A, ''))]
  const drag = makeDrag(rng, {
    mode: 'point',
    name: Cn,
    from: O,
    links: [t.A, t.B],
    frame,
    conditions: [rightAtP(t.A, t.B, side)],
    forbidden: [
      { at: t.A, note: `Dann fallen $${Cn}$ und $${An}$ zusammen, und es gibt kein Dreieck.` },
      { at: t.B, note: `Dann fallen $${Cn}$ und $${Bn}$ zusammen, und es gibt kein Dreieck.` },
    ],
    traps,
  })
  if (!drag) return null
  const c = drag.solution
  const drawing = given(frame, `$${An}$ und $${Bn}$ sind fest. Zieh den Punkt $${Cn}$.`, [], [{ at: t.A, label: An }, { at: t.B, label: Bn }], [{ from: t.A, to: t.B, color: 'muted' }])
  const question = `Zieh $${Cn}$ so, dass das Dreieck $${An}${Bn}${Cn}$ bei $${Cn}$ einen rechten Winkel hat.`
  const step = dragStep(
    drag,
    drawing,
    question,
    `Beide Pfeile beginnen bei $${Cn}$: $${side} = 0$. Alle passenden Punkte liegen auf einem Kreis mit der Strecke $${An}${Bn}$ als Durchmesser (Satz des Thales).`,
    {
      detailed: `Rechter Winkel bei $${Cn}$ heißt $${side} = (${An} - ${Cn}) \\cdot (${Bn} - ${Cn}) = 0$. Die Punkte, die das erfüllen, liegen auf dem Kreis über $${An}${Bn}$ (Thaleskreis), z. B. $${pointLatex(Cn, vec(...c))}$: $${arrowName(Cn, An)} = ${colLatex(sub(t.A, c))}$, $${arrowName(Cn, Bn)} = ${colLatex(sub(t.B, c))}$, Skalarprodukt $${dot(sub(t.A, c), sub(t.B, c))}$.`,
      short: `$${side} = 0$, z. B. $${pointLatex(Cn, vec(...c))}$.`,
    },
    [CARD.senkrecht, CARD.verbindung],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${pointLatex(An, vec(...t.A))},\\; ${pointLatex(Bn, vec(...t.B))}`,
      steps: [step],
      cards: [CARD.verbindung, CARD.senkrecht],
      resultLatex: `\\text{z.\\,B. } ${pointLatex(Cn, vec(...c))}`,
      resultDrawing: solved(drawing, drag, `Zum Beispiel $${pointLatex(Cn, vec(...c))}$: rechter Winkel bei $${Cn}$.`, { at: c, u: sub(t.A, c), v: sub(t.B, c) }),
      form: `drag|thales|${level}|${An}|${signs(sub(t.B, t.A))}|${key}`,
      data: { A: t.A, B: t.B },
      answer: c,
      dragOnly: true,
    },
  }
}

// ------------------------------------------------------------------ Stufe 4: mit Parameter entlang einer Geraden

// Gerade b(t) = base + t · dir im Ausschnitt: alle t, deren Spitze im Rahmen liegt
function lineRange(base: V, dir: V, frame: DragFrame): readonly [number, number] | null {
  const ts = Array.from({ length: 41 }, (_, i) => i - 20).filter((t) => inFrame(add(base, scale(t, dir)), frame))
  return ts.length < 4 ? null : [ts[0], ts[ts.length - 1]]
}

function lineDrag(rng: Rng, a: V, base: V, dir: V, t: string, an: string, bn: string, conditions: DragCondition[], traps: DragTrap[]): { drag: DragStep; drawing: VectorDrawing; frame: DragFrame } | null {
  const frame = frameOf(a)
  const range = lineRange(base, dir, frame)
  if (!range) return null
  const line: DragLine = { base, dir, param: t, tmin: range[0], tmax: range[1] }
  const at = (s: number) => add(base, scale(s, dir))
  // Start: ein t, an dem die Spitze nicht der Nullvektor ist, nicht richtig und kein typischer Fehler
  const forbidden = [{ at: O, note: ZERO_NOTE(bn) }]
  const probe: DragStep = { mode: 'arrow', name: bn, color: 'b', from: O, frame, line, conditions, forbidden, traps, start: at(range[0]), solution: at(range[0]), whys: {} }
  const ts = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i)
  const starts = ts.filter((s) => judgeDrag(probe, at(s)).kind === 'wrong')
  const anyWrong = ts.filter((s) => judgeDrag(probe, at(s)).kind !== 'correct' && judgeDrag(probe, at(s)).kind !== 'invalid')
  const pick = starts.length > 0 ? starts : anyWrong
  if (pick.length === 0) return null
  const drag = makeDrag(rng, { mode: 'arrow', name: bn, from: O, liveAngle: a, frame, line, conditions, forbidden, traps, start: at(rng.pick(pick)) })
  if (!drag) return null
  const ends = [at(range[0]), at(range[1])]
  const drawing = given(frame, `$${an}$ ist fest. Die Spitze von $${bn}$ läuft auf der gestrichelten Geraden; der Wert von $${t}$ steht darunter.`, [{ from: O, to: a, color: 'a', label: an }], [], [{ from: ends[0], to: ends[1], color: 'muted', dashed: true }])
  return { drag, drawing, frame }
}

function variantPerpLine(rng: Rng, level: Level): Result {
  const built = buildPerp(rng, 1)
  const { pa, pb, qb } = built.data
  const t = (built.resultLatex ?? '').split(' = ')[0]
  const [an, bn] = (built.functionLatex ?? '').split(',\\; ').map((x) => x.split(' = ')[0])
  const side = `${an} \\cdot ${bn}`
  const made = lineDrag(rng, pa, pb, qb, t, an, bn, [dotCond(pa, O, '=', 0, side)], [trap('vec-perp-one', dotCond(pa, O, '=', 1, ''))])
  if (!made) return null
  const { drag, drawing } = made
  const question = `Zieh die Spitze von $${bn}$ entlang der Geraden, bis $${bn}$ senkrecht auf $${an}$ steht.`
  // eigene Erklärung: die des nächsten Schritts verriete dessen Gleichung
  const step = dragStep(
    drag,
    drawing,
    question,
    `Senkrecht heißt $${side} = 0$. Beobachte den Winkelbogen und rechne an deiner Stelle nach.`,
    {
      detailed: `Senkrecht heißt $${side} = 0$. Beim Ziehen ändert sich nur der Eintrag mit $${t}$, und nur an einer Stelle der Geraden stehen die Pfeile senkrecht. Wie man diese Stelle ohne Ausprobieren findet, rechnest du als Nächstes.`,
      short: `Senkrecht heißt $${side} = 0$.`,
    },
    [CARD.senkrecht],
  )
  return {
    task: {
      ...built,
      kind: 'drag',
      instruction: `${built.instruction} Zieh zuerst die Spitze von $${bn}$, dann rechne.`,
      steps: [step, ...built.steps],
      form: `drag|perpLine|${level}|${built.form}`,
    },
  }
}

function variantAcuteLine(rng: Rng, level: Level): Result {
  const built = buildClassifyParam(rng, 2)
  const { a, b, i, s, want } = built.data
  const t = built.steps[1].choices.find((c) => c.correct)!.content.replace(/^\$/, '').split(' ')[0]
  const [an, bn] = (built.functionLatex ?? '').split(',\\; ').map((x) => x.split(' = ')[0])
  const dir: V = i[0] === 0 ? [s[0], 0] : [0, s[0]]
  const side = `${an} \\cdot ${bn}`
  const acute = want[0] === 0
  const conditions = [dotCond(a, O, acute ? '>' : '<', 0, side)]
  const traps = [trap('vec-right-not-acute', dotCond(a, O, '=', 0, '')), trap('vec-angle-sign', dotCond(a, O, acute ? '<' : '>', 0, ''))]
  const made = lineDrag(rng, a, b, dir, t, an, bn, conditions, traps)
  if (!made) return null
  const { drag, drawing } = made
  const word = acute ? 'spitz' : 'stumpf'
  const question = `Zieh die Spitze von $${bn}$ entlang der Geraden, bis der Winkel zwischen $${an}$ und $${bn}$ ${word} ist.`
  const step = dragStep(
    drag,
    drawing,
    question,
    `${acute ? 'Spitz' : 'Stumpf'} heißt $${side} ${acute ? '>' : '<'} 0$.`,
    { detailed: `${acute ? 'Spitz' : 'Stumpf'} heißt $${side} ${acute ? '>' : '<'} 0$. Das gilt nicht nur an einer Stelle, sondern für alle $${t}$ auf einer Seite der Grenze, an der die Pfeile senkrecht stehen. Welche das sind, rechnest du als Nächstes aus.`, short: `$${side} ${acute ? '>' : '<'} 0$.` },
    [CARD.senkrecht],
  )
  return {
    task: {
      ...built,
      kind: 'drag',
      instruction: `${built.instruction} Zieh zuerst die Spitze von $${bn}$, dann rechne.`,
      steps: [step, ...built.steps],
      form: `drag|acuteLine|${level}|${built.form}`,
    },
  }
}

// ------------------------------------------------------------------ Stufe 5

function variantRhombus(rng: Rng, level: Level): Result {
  const { an, bn, key } = names(rng)
  const a = randVec(rng, -4, 4)
  if (dot(a, a) < 5) return null
  const side = `(${an} + ${bn}) \\cdot (${an} - ${bn})`
  const frame = frameOf(a)
  const drag = makeDrag(rng, {
    mode: 'arrow',
    name: bn,
    from: O,
    liveSum: a,
    liveDiff: a,
    frame,
    conditions: [general([0, 0], -1, dot(a, a), '=', 0, side)],
    forbidden: [
      { at: O, note: ZERO_NOTE(bn) },
      { at: a, note: `Dann ist $${an} - ${bn}$ der Nullvektor; es gibt kein Parallelogramm.` },
      { at: scale(-1, a), note: `Dann ist $${an} + ${bn}$ der Nullvektor; es gibt kein Parallelogramm.` },
    ],
    traps: [trap('vec-diagonals-sides', dotCond(a, O, '=', 0, ''))],
  })
  if (!drag) return null
  const v = drag.solution
  const drawing = given(frame, `$${an} = ${colLatex(a)}$ ist fest. Beim Ziehen erscheinen die Diagonalen $${an} + ${bn}$ und $${an} - ${bn}$ des Parallelogramms.`, [{ from: O, to: a, color: 'a', label: an }])
  const question = `Zieh $${bn}$ so, dass $${an} + ${bn}$ senkrecht auf $${an} - ${bn}$ steht (und $${bn} \\neq \\pm ${an}$).`
  const step = dragStep(
    drag,
    drawing,
    question,
    `Multipliziere aus: $${side} = \\lvert ${an} \\rvert^2 - \\lvert ${bn} \\rvert^2$. Was heißt das für die Länge von $${bn}$?`,
    {
      detailed: `$${side} = ${an} \\cdot ${an} - ${an} \\cdot ${bn} + ${bn} \\cdot ${an} - ${bn} \\cdot ${bn} = \\lvert ${an} \\rvert^2 - \\lvert ${bn} \\rvert^2$. Die Diagonalen stehen also senkrecht, wenn $\\lvert ${bn} \\rvert^2 = \\lvert ${an} \\rvert^2 = ${dot(a, a)}$ ist: Das Parallelogramm ist eine Raute. Zum Beispiel $${bn} = ${colLatex(v)}$.`,
      short: `$${side} = \\lvert ${an} \\rvert^2 - \\lvert ${bn} \\rvert^2 = 0$: gleich lang, z. B. $${bn} = ${colLatex(v)}$.`,
    },
    [CARD.betragWinkel, CARD.senkrecht],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)}`,
      steps: [step],
      cards: [CARD.betragWinkel, CARD.senkrecht],
      resultLatex: `\\lvert ${bn} \\rvert = \\lvert ${an} \\rvert,\\; \\text{z.\\,B. } ${bn} = ${colLatex(v)}`,
      resultDrawing: {
        ...solved(drawing, drag, `Zum Beispiel $${bn} = ${colLatex(v)}$: gleich lang wie $${an}$, die Diagonalen stehen senkrecht.`),
        arrows: [...drawing.arrows, { from: O, to: v, color: 'b', label: bn }, { from: O, to: add(a, v), color: 'r', label: `${an} + ${bn}` }, { from: v, to: a, color: 'c', label: `${an} - ${bn}` }],
        segments: [{ from: a, to: add(a, v), color: 'muted', dashed: true }, { from: v, to: add(a, v), color: 'muted', dashed: true }],
        angles: [{ at: add(v, scale(0.5, sub(a, v))), u: add(a, v), v: sub(a, v), color: 'r' }],
      },
      form: `drag|rhombus|${level}|${key}|${signs(a)}`,
      data: { a },
      answer: v,
      dragOnly: true,
    },
  }
}

function variantThalesVec(rng: Rng, level: Level): Result {
  const { an, bn, key } = names(rng)
  const a = randVec(rng, -5, 5)
  if (dot(a, a) < 8) return null
  const side = `(${an} - ${bn}) \\cdot ${bn}`
  const frame = frameOf(a)
  const drag = makeDrag(rng, {
    mode: 'arrow',
    name: bn,
    from: O,
    liveDiff: a,
    frame,
    conditions: [general(a, -1, 0, '=', 0, side)],
    forbidden: [
      { at: O, note: ZERO_NOTE(bn) },
      { at: a, note: `Dann ist $${an} - ${bn}$ der Nullvektor und hat keine Richtung.` },
    ],
    traps: [],
  })
  if (!drag) return null
  const v = drag.solution
  const drawing = given(frame, `$${an} = ${colLatex(a)}$ ist fest. Beim Ziehen erscheint $${an} - ${bn}$ von der Spitze von $${bn}$ zur Spitze von $${an}$.`, [{ from: O, to: a, color: 'a', label: an }])
  const question = `Zieh $${bn}$ so, dass $${an} - ${bn}$ senkrecht auf $${bn}$ steht (beide nicht der Nullvektor).`
  const step = dragStep(
    drag,
    drawing,
    question,
    `$${side} = ${an} \\cdot ${bn} - \\lvert ${bn} \\rvert^2$. Im Bild: Der Pfeil $${an} - ${bn}$ führt von der Spitze von $${bn}$ zur Spitze von $${an}$, dort soll ein rechter Winkel sein.`,
    {
      detailed: `$${side} = ${an} \\cdot ${bn} - ${bn} \\cdot ${bn} = 0$. Im Bild bilden $${bn}$, $${an} - ${bn}$ und $${an}$ ein Dreieck mit rechtem Winkel an der Spitze von $${bn}$; die Spitze liegt also auf dem Thaleskreis über $${an}$. Zum Beispiel $${bn} = ${colLatex(v)}$: $${an} \\cdot ${bn} = ${dot(a, v)}$ und $\\lvert ${bn} \\rvert^2 = ${dot(v, v)}$.`,
      short: `$${an} \\cdot ${bn} = \\lvert ${bn} \\rvert^2$, z. B. $${bn} = ${colLatex(v)}$.`,
    },
    [CARD.senkrecht, CARD.betragWinkel],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)}`,
      steps: [step],
      cards: [CARD.senkrecht, CARD.betragWinkel],
      resultLatex: `${an} \\cdot ${bn} = \\lvert ${bn} \\rvert^2,\\; \\text{z.\\,B. } ${bn} = ${colLatex(v)}`,
      resultDrawing: {
        ...solved(drawing, drag, `Zum Beispiel $${bn} = ${colLatex(v)}$: rechter Winkel an der Spitze von $${bn}$.`),
        arrows: [...drawing.arrows, { from: O, to: v, color: 'b', label: bn }, { from: v, to: a, color: 'c', label: `${an} - ${bn}` }],
        angles: [{ at: v, u: scale(-1, v), v: sub(a, v), color: 'r' }],
      },
      form: `drag|thalesVec|${level}|${key}|${signs(a)}`,
      data: { a },
      answer: v,
      dragOnly: true,
    },
  }
}

// m · s ohne Faktor 1
const sTerm = (m: number) => (m === 1 ? 's' : m === -1 ? '-s' : `${m}s`)

function variantTwoDots(rng: Rng, level: Level): Result {
  const { an, bn, cn, key } = names(rng)
  const a = randVec(rng, -4, 4)
  const c = randVec(rng, -4, 4)
  if (a[0] === 0 && a[1] === 0) return null
  if (a[0] * c[1] - a[1] * c[0] === 0) return null
  const b0 = scale(rng.pick([1, -1, 2, -2]), rot(a))
  if (!inFrame(b0, FRAME)) return null
  const k = dot(c, b0)
  if (k === 0) return null
  const sideA = `${an} \\cdot ${bn}`
  const sideC = `${cn} \\cdot ${bn}`
  const frame = frameOf(a, c)
  const drag = makeDrag(rng, {
    mode: 'arrow',
    name: bn,
    from: O,
    frame,
    conditions: [dotCond(a, O, '=', 0, sideA), dotCond(c, O, '=', k, sideC)],
    forbidden: [{ at: O, note: ZERO_NOTE(bn) }],
    traps: [trap('vec-dot-sign', dotCond(a, O, '=', 0, ''), dotCond(c, O, '=', -k, '')), trap('vec-angle-zero', general([-a[1], a[0]], 0, 0, '=', 0), dotCond(c, O, '=', k, ''))],
  })
  if (!drag) return null
  const v = drag.solution
  const drawing = given(frame, `$${an}$ und $${cn}$ sind fest. Zieh die Spitze von $${bn}$.`, [
    { from: O, to: a, color: 'a', label: an },
    { from: O, to: c, color: 'c', label: cn },
  ])
  const question = `Zieh $${bn}$ so, dass $${bn}$ senkrecht auf $${an}$ steht und $${sideC} = ${k}$ ist.`
  const step = dragStep(
    drag,
    drawing,
    question,
    `Erst die Richtung: senkrecht zu $${an}$ heißt ein Vielfaches von $${colLatex(rot(a))}$. Dann das Vielfache so wählen, dass $${sideC} = ${k}$ wird.`,
    {
      detailed: `Aus $${sideA} = 0$ folgt $${bn} = s \\cdot ${colLatex(rot(a))}$. Dann ist $${sideC} = ${sTerm(dot(c, rot(a)))} = ${k}$, also $s = ${k / dot(c, rot(a))}$ und $${bn} = ${colLatex(v)}$. Die Lösung ist eindeutig.`,
      short: `$${bn} = s \\cdot ${colLatex(rot(a))}$ mit $${sTerm(dot(c, rot(a)))} = ${k}$, also $s = ${k / dot(c, rot(a))}$: $${bn} = ${colLatex(v)}$.`,
    },
    [CARD.senkrecht, CARD.skalar],
  )
  return {
    task: {
      kind: 'drag',
      instruction: question.replace(/^Zieh /, 'Bestimme '),
      functionLatex: `${an} = ${colLatex(a)},\\; ${cn} = ${colLatex(c)}`,
      steps: [step],
      cards: [CARD.skalar, CARD.senkrecht],
      resultLatex: `${bn} = ${colLatex(v)}`,
      resultDrawing: solved(drawing, drag, `$${bn} = ${colLatex(v)}$: senkrecht auf $${an}$, und $${sideC} = ${k}$.`, { at: O, u: a, v }),
      form: `drag|twoDots|${level}|${key}|${signs(a, c)}`,
      data: { a, c, k: [k] },
      answer: v,
      dragOnly: true,
    },
  }
}

// ------------------------------------------------------------------ Auswahl

const VARIANTS: Readonly<Record<string, (rng: Rng, level: Level) => Result>> = {
  perp: (rng, level) => variantSimple(rng, level, 'perp'),
  acute: (rng, level) => variantSimple(rng, level, 'acute'),
  obtuse: (rng, level) => variantSimple(rng, level, 'obtuse'),
  dotValue: variantDotValue,
  angle: variantAngle,
  rightAt: variantRightAt,
  perpLength: variantPerpLength,
  thales: variantThales,
  perpLine: variantPerpLine,
  acuteLine: variantAcuteLine,
  rhombus: variantRhombus,
  thalesVec: variantThalesVec,
  twoDots: variantTwoDots,
}

export function buildDrag(rng: Rng, level: Level, variant?: string): Built {
  const name = variant ?? rng.pick(DRAG_VARIANTS[level])
  for (let i = 0; i < 2000; i++) {
    const r = VARIANTS[name](rng, level)
    if (r) return r.task
  }
  throw new Error(`Keine Zieh-Aufgabe ${name} in Stufe ${level}`)
}
