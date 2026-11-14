import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { termsLatex } from './crossTasks.ts'
import type { VectorDrawing } from './figures.ts'
import { elimDrawing, paramSlider, sceneCenter, systemDrawing } from './gaussFigures.ts'
import { LGS_CASES } from './gaussTasks.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex, vecLatex } from './vec.ts'

// Baustein „Einsetzen, Gleichsetzen, Addieren“ (M7 Schritt 10c) der Tätigkeit „Matrizen und Gleichungssysteme“: die drei
// Schulverfahren für kleine Gleichungssysteme Schritt für Schritt.
// - Einsetzen: eine Gleichung nach einer Unbekannten auflösen, in die andere einsetzen, lösen, zurückrechnen.
// - Gleichsetzen: beide Gleichungen nach derselben Unbekannten auflösen, gleichsetzen, lösen, zurückrechnen.
// - Addieren: so malnehmen, dass beim Addieren eine Unbekannte wegfällt.
// Stufe 1 Verfahren vorgegeben, eine Unbekannte steht fast allein; Stufe 2 Zahlen nicht 1, manchmal „Welches Verfahren?“;
// Stufe 3 Gleichungen erst ordnen (Klammern, beide Seiten, Brüche), auch keine oder unendlich viele Lösungen; Stufe 4 drei
// Gleichungen (eine mit nur zwei Unbekannten) oder Unbekannte im Nenner ($u = \frac{1}{x}$); Stufe 5 alles ineinander,
// auch mit Parameter. Alles exakt mit Brüchen; Gleichungen als Zeilen (Zahlen vor den Unbekannten, rechte Seite).

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)
const ROMAN = ['I', 'II', 'III'] as const
const rn = (i: number) => `\\text{${ROMAN[i]}}`

export const EQS_CARD = {
  einsetzen: 'eqs-einsetzen',
  gleichsetzen: 'eqs-gleichsetzen',
  addieren: 'eqs-addieren',
  wann: 'eqs-wann',
  tricks: 'eqs-tricks',
} as const

type Method = 'subst' | 'equal' | 'add'
type Case = 'unique' | 'none' | 'inf'
const METHOD_CARD: Readonly<Record<Method, string>> = { subst: EQS_CARD.einsetzen, equal: EQS_CARD.gleichsetzen, add: EQS_CARD.addieren }
const METHOD_NAME: Readonly<Record<Method, string>> = { subst: 'Einsetzungsverfahren', equal: 'Gleichsetzungsverfahren', add: 'Additionsverfahren' }
const CASE_INDEX: Readonly<Record<Case, number>> = { unique: 0, none: 1, inf: 2 }

// Gleichung: Zahlen vor den Unbekannten (a) und rechte Seite (c); Term: Zahlen vor den Unbekannten und Zahl (t)
export type Row = { readonly a: readonly Rational[]; readonly c: Rational }
type Expr = { readonly a: readonly Rational[]; readonly t: Rational }

// ------------------------------------------------------------------ Rechnen mit Gleichungen

const solveFor = (r: Row, v: number): Expr => ({ a: r.a.map((x, j) => (j === v ? ZERO : ratNeg(ratDiv(x, r.a[v])))), t: ratDiv(r.c, r.a[v]) })
const substitute = (r: Row, v: number, E: Expr): Row => ({
  a: r.a.map((x, j) => (j === v ? ZERO : ratAdd(x, ratMul(r.a[v], E.a[j])))),
  c: ratSub(r.c, ratMul(r.a[v], E.t)),
})
// v = E als Gleichung: v − (Zahlen vor den anderen) = t
const rowOfExpr = (v: number, E: Expr): Row => ({ a: E.a.map((x, j) => (j === v ? ONE : ratNeg(x))), c: E.t })
const lin = (p: Rational, r: Row, q: Rational, s: Row): Row => ({ a: r.a.map((x, j) => ratAdd(ratMul(p, x), ratMul(q, s.a[j]))), c: ratAdd(ratMul(p, r.c), ratMul(q, s.c)) })
const lhsAt = (r: Row, x: readonly Rational[]) => r.a.reduce((s, a, j) => ratAdd(s, ratMul(a, x[j])), ZERO)
const isFlatRow = (r: Row) => r.a.every(isZero)

// gleichwertig: dieselbe Lösungsmenge (Vielfaches; links nur 0: beide wahr oder beide falsch)
export function rowsEquivalent(p: Row, q: Row): boolean {
  const [pf, qf] = [isFlatRow(p), isFlatRow(q)]
  if (pf || qf) return pf && qf && isZero(p.c) === isZero(q.c)
  const j = p.a.findIndex((x) => !isZero(x))
  if (isZero(q.a[j])) return false
  const k = ratDiv(q.a[j], p.a[j])
  return p.a.every((x, i) => ratEq(ratMul(k, x), q.a[i])) && ratEq(ratMul(k, p.c), q.c)
}

// ------------------------------------------------------------------ Schreibweisen

const term = (c: Rational, v: string) => termsLatex([[c, v]])
export const rowLatex = (r: Row, vars: readonly string[]) => `${termsLatex(r.a.map((x, j) => [x, vars[j]] as const))} = ${ratLatex(r.c)}`
const exprLatex = (E: Expr, vars: readonly string[]) => termsLatex([...E.a.map((x, j) => [x, vars[j]] as const), [E.t, ''] as const])
// Glieder mit eigenem Vorzeichen aneinanderhängen
const join = (pieces: readonly string[]) => pieces.map((p, i) => (i === 0 ? p : p.startsWith('-') ? ` - ${p.slice(1)}` : ` + ${p}`)).join('')
const prefix = (k: Rational) => (isOne(k) ? '' : isOne(ratNeg(k)) ? '-' : ratLatex(k))
const paren = (x: Rational) => (ratSign(x) < 0 ? `(${ratLatex(x)})` : ratLatex(x))
// Zahl mal Wert, z. B. 2 \cdot (-3) - 4
function products(list: readonly (readonly [Rational, Rational])[], t: Rational, first?: Rational): string {
  const pieces = list.filter(([c]) => !isZero(c)).map(([c, x]) => `${ratSign(c) < 0 ? '-' : ''}${isOne(ratAbs(c)) ? '' : `${ratLatex(ratAbs(c))} \\cdot `}${paren(x)}`)
  if (first !== undefined) pieces.unshift(ratLatex(first))
  if (!isZero(t) || pieces.length === 0) pieces.push(ratLatex(t))
  return join(pieces)
}
const systemLatex = (lines: readonly string[], names: readonly string[]) => `\\begin{array}{ll} ${lines.map((l, i) => `${names[i]}\\colon & ${l}`).join(' \\\\ ')} \\end{array}`
const valuesLatex = (vars: readonly string[], x: readonly Rational[], shown: readonly number[]) => shown.map((j) => `${vars[j]} = ${ratLatex(x[j])}`).join(',\\; ')
const knownText = (vars: readonly string[], x: readonly Rational[], idx: readonly number[]) => idx.map((j) => `$${vars[j]} = ${ratLatex(x[j])}$`).join(' und ')

// Wrongs ohne doppelte Inhalte und ohne die richtige Antwort
function distinct(correct: string, cands: readonly Wrong[]): Wrong[] {
  const seen = new Set([correct])
  const out: Wrong[] = []
  for (const w of cands) {
    if (seen.has(w.content)) continue
    seen.add(w.content)
    out.push(w)
  }
  return out
}

// ------------------------------------------------------------------ Kontext

type Ctx = {
  readonly vars: readonly string[]
  // Namen der Gleichungen als LaTeX (\text{I}, \text{II}')
  readonly names: readonly string[]
  readonly cards: readonly string[]
}

// ------------------------------------------------------------------ Schritte

// Gleichung nach einer Unbekannten auflösen
function solveStep(rng: Rng, ctx: Ctx, row: Row, name: string, v: number, id: string): { step: GuidedStep; E: Expr } {
  const { vars } = ctx
  const E = solveFor(row, v)
  const av = row.a[v]
  const others = row.a.map((_, j) => j).filter((j) => j !== v && !isZero(row.a[j]))
  const show = (F: Expr) => math(`${vars[v]} = ${exprLatex(F, vars)}`)
  const cands: Wrong[] = [{ content: show({ a: E.a.map(ratNeg), t: E.t }), rule: 'eqs-solve-sign' }]
  if (others.length > 1) for (const j of others) cands.push({ content: show({ a: E.a.map((x, k) => (k === j ? ratNeg(x) : x)), t: E.t }), rule: 'eqs-solve-sign' })
  if (!isOne(ratAbs(av))) {
    cands.push({ content: show({ a: row.a.map((x, j) => (j === v ? ZERO : ratNeg(x))), t: E.t }), rule: 'eqs-solve-divide' })
    cands.push({ content: show({ a: E.a, t: row.c }), rule: 'eqs-solve-divide' })
  }
  cands.push({ content: show({ a: E.a.map(ratNeg), t: ratNeg(E.t) }), rule: 'eqs-solve-minus' })
  if (!isZero(E.t)) cands.push({ content: show({ a: E.a, t: ratNeg(E.t) }), rule: ratSign(av) < 0 ? 'eqs-solve-minus' : 'eqs-solve-sign' })
  const correct = show(E)
  const moved: Expr = { a: row.a.map((x, j) => (j === v ? ZERO : ratNeg(x))), t: row.c }
  const first = `${term(av, vars[v])} = ${exprLatex(moved, vars)}`
  const detail = isOne(av) ? `$${first}$` : `$${first}$, dann durch $${ratLatex(av)}$ teilen: $${vars[v]} = ${exprLatex(E, vars)}$`
  return {
    E,
    step: choiceStep(rng, {
      id,
      title: `Nach $${vars[v]}$ auflösen`,
      question: `Löse Gleichung $${name}$ nach $${vars[v]}$ auf: $${rowLatex(row, vars)}$`,
      correct,
      wrongs: distinct(correct, rng.shuffle(cands)),
      hint: `Bring alle Glieder ohne $${vars[v]}$ auf die rechte Seite (das Vorzeichen wechselt)${isOne(av) ? '' : ` und teile dann **jedes** Glied durch $${ratLatex(av)}$`}.`,
      explanation: {
        detailed: `Glieder ohne $${vars[v]}$ nach rechts bringen, dabei wechselt ihr Vorzeichen: ${detail}.`,
        short: `$${vars[v]} = ${exprLatex(E, vars)}$.`,
      },
      established: [`${vars[v]} = ${exprLatex(E, vars)}`],
      cards: [EQS_CARD.einsetzen],
    }),
  }
}

// Term für v in eine Gleichung einsetzen, Klammer ausmultiplizieren, zusammenfassen
function insertStep(
  rng: Rng,
  ctx: Ctx,
  src: { readonly row: Row; readonly v: number; readonly E: Expr; readonly name: string },
  target: { readonly row: Row; readonly name: string },
  id: string,
  extra: { readonly solvedDrawing?: VectorDrawing } = {},
): { step: GuidedStep; row: Row } {
  const { vars } = ctx
  const { v, E } = src
  const T = target.row
  const av = T.a[v]
  const right = substitute(T, v, E)
  // Glieder der Klammer in ihrer Reihenfolge (Unbekannte, dann Zahl); erstes Glied
  const parts: { j: number; c: Rational }[] = [...E.a.map((c, j) => ({ j, c })).filter((p) => !isZero(p.c)), ...(isZero(E.t) ? [] : [{ j: -1, c: E.t }])]
  const withFactors = (f: (k: number) => Rational): Row => {
    const a = T.a.map((x, j) => (j === v ? ZERO : x))
    let c = T.c
    parts.forEach((p, k) => {
      if (p.j < 0) c = ratSub(c, ratMul(f(k), p.c))
      else a[p.j] = ratAdd(a[p.j], ratMul(f(k), p.c))
    })
    return { a, c }
  }
  const cands: [Row, string][] = []
  if (!isOne(av) && parts.length > 1) cands.push([withFactors((k) => (k === 0 ? av : ONE)), 'eqs-bracket-partial'])
  if (ratSign(av) < 0 && parts.length > 1) cands.push([withFactors((k) => (k === 0 ? av : ratNeg(av))), 'eqs-bracket-sign'])
  cands.push([substitute(src.row, v, E), 'eqs-same-equation'])
  if (!isZero(E.t)) cands.push([{ a: right.a, c: ratAdd(T.c, ratMul(av, E.t)) }, 'gauss-backsub-sign'])
  const correct = math(rowLatex(right, vars))
  const wrongs = distinct(
    correct,
    cands.filter(([r]) => !rowsEquivalent(r, right)).map(([r, rule]) => ({ content: math(rowLatex(r, vars)), rule })),
  )
  const inserted = join(T.a.map((x, j) => (j === v ? `${prefix(av)}(${exprLatex(E, vars)})` : isZero(x) ? '' : term(x, vars[j]))).filter((s) => s !== ''))
  const expanded = termsLatex(T.a.flatMap((x, j) => (j === v ? parts.map((p) => [ratMul(av, p.c), p.j < 0 ? '' : vars[p.j]] as const) : isZero(x) ? [] : [[x, vars[j]] as const])))
  const flat = isFlatRow(right)
  return {
    row: right,
    step: {
      ...choiceStep(rng, {
        id,
        title: 'Einsetzen',
        question: `Setz $${vars[v]} = ${exprLatex(E, vars)}$ aus $${src.name}$ in Gleichung $${target.name}$ ein und fass zusammen (Zahlen rechts). Welche Gleichung entsteht?\n$${target.name}\\colon ${rowLatex(T, vars)}$`,
        correct,
        wrongs,
        hint: `Ersetze $${vars[v]}$ durch den ganzen Term **in Klammern**. Die Zahl vor der Klammer nimmt **jedes** Glied darin mal, auch mit seinem Vorzeichen.`,
        explanation: {
          detailed: `Eingesetzt: $${inserted} = ${ratLatex(T.c)}$. Klammer ausmultipliziert: $${expanded} = ${ratLatex(T.c)}$. Zusammengefasst, Zahlen nach rechts: $${rowLatex(right, vars)}$.${flat ? ' Alle Unbekannten sind weggefallen.' : ` Jetzt kommt $${vars[v]}$ nicht mehr vor.`}`,
          short: `$${inserted} = ${ratLatex(T.c)}$, also $${rowLatex(right, vars)}$.`,
        },
        established: [rowLatex(right, vars)],
        cards: [EQS_CARD.einsetzen],
      }),
      ...extra,
    },
  }
}

// Wert einer Unbekannten aus K · o = D
function valueStep(rng: Rng, ctx: Ctx, row: Row, o: number, id: string, cards: readonly string[]): GuidedStep {
  const { vars } = ctx
  const K = row.a[o]
  const D = row.c
  const val = ratDiv(D, K)
  const show = (x: Rational) => math(`${vars[o]} = ${ratLatex(x)}`)
  const cands: Wrong[] = []
  if (!isOne(K)) cands.push({ content: show(D), rule: 'gauss-divide-forgot' })
  if (!isZero(D)) cands.push({ content: show(ratDiv(K, D)), rule: 'gauss-divide-flip' })
  cands.push({ content: show(ratSub(D, K)), rule: 'gauss-divide-sub' })
  const correct = show(val)
  return choiceStep(rng, {
    id,
    title: `$${vars[o]}$ ausrechnen`,
    question: `Aus $${rowLatex(row, vars)}$: Wie groß ist $${vars[o]}$?`,
    correct,
    wrongs: distinct(correct, rng.shuffle(cands)),
    hint: `Teile beide Seiten durch die Zahl vor $${vars[o]}$.`,
    explanation: { detailed: `Beide Seiten durch $${ratLatex(K)}$ teilen: $${vars[o]} = \\frac{${ratLatex(D)}}{${ratLatex(K)}} = ${ratLatex(val)}$.`, short: `$${vars[o]} = ${ratLatex(val)}$.` },
    established: [`${vars[o]} = ${ratLatex(val)}`],
    cards,
  })
}

// Gleichsetzen: v = E1 und v = E2, daraus die andere Unbekannte o
function equateStep(rng: Rng, ctx: Ctx, E1: Expr, E2: Expr, v: number, o: number, extra: { readonly solvedDrawing?: VectorDrawing }): { step: GuidedStep; value: Rational } {
  const { vars } = ctx
  const K = ratSub(E1.a[o], E2.a[o])
  const D = ratSub(E2.t, E1.t)
  const val = ratDiv(D, K)
  const show = (x: Rational) => math(`${vars[o]} = ${ratLatex(x)}`)
  const cands: Wrong[] = []
  const sum = ratAdd(E1.a[o], E2.a[o])
  if (!isZero(sum)) cands.push({ content: show(ratDiv(D, sum)), rule: 'eqs-equate-sign' })
  if (!isZero(E1.t)) cands.push({ content: show(ratDiv(ratAdd(E2.t, E1.t), K)), rule: 'gauss-backsub-sign' })
  if (!isZero(D)) cands.push({ content: show(ratDiv(K, D)), rule: 'gauss-divide-flip' })
  if (!isOne(K)) cands.push({ content: show(D), rule: 'gauss-divide-forgot' })
  const correct = show(val)
  const eq = `${exprLatex(E1, vars)} = ${exprLatex(E2, vars)}`
  return {
    value: val,
    step: {
      ...choiceStep(rng, {
        id: `wert-${vars[o]}`,
        title: 'Gleichsetzen',
        question: `Beide Gleichungen sind nach $${vars[v]}$ aufgelöst: $${vars[v]} = ${exprLatex(E1, vars)}$ und $${vars[v]} = ${exprLatex(E2, vars)}$. Setz gleich: Was ergibt sich für $${vars[o]}$?`,
        correct,
        wrongs: distinct(correct, rng.shuffle(cands)),
        hint: `Zweimal dasselbe $${vars[v]}$: Die beiden Terme sind gleich. Bring alles mit $${vars[o]}$ auf eine Seite, die Zahlen auf die andere (Vorzeichen wechselt), und teile.`,
        explanation: {
          detailed: `Gleichgesetzt: $${eq}$. Alles mit $${vars[o]}$ nach links, die Zahlen nach rechts: $${term(K, vars[o])} = ${ratLatex(D)}$${isOne(K) ? '' : `, also $${vars[o]} = ${ratLatex(val)}$`}.`,
          short: `$${eq}$, also $${vars[o]} = ${ratLatex(val)}$.`,
        },
        established: [`${vars[o]} = ${ratLatex(val)}`],
        cards: [EQS_CARD.gleichsetzen],
      }),
      ...extra,
    },
  }
}

// Faktoren für das Addieren: p · I + q · II lässt e wegfallen (p > 0, kleinste ganze Zahlen)
const gcdBig = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcdBig(b, a % b))
function factorsFor(r1: Row, r2: Row, e: number): [Rational, Rational] {
  const [a1, a2] = [r1.a[e], r2.a[e]]
  const g = gcdBig(a1.n, a2.n)
  const [P, Q] = [ratDiv(ratAbs(a2), rat(g)), ratDiv(ratAbs(a1), rat(g))]
  return [P, ratSign(a1) === ratSign(a2) ? ratNeg(Q) : Q]
}
const opLabel = (p: Rational, q: Rational, n1: string, n2: string) => join([`${prefix(p)}${isOne(ratAbs(p)) ? '' : ' \\cdot '}${n1}`, `${prefix(q)}${isOne(ratAbs(q)) ? '' : ' \\cdot '}${n2}`])

function factorStep(rng: Rng, ctx: Ctx, rows: readonly [Row, Row], e: number): GuidedStep {
  const { vars, names } = ctx
  const [p, q] = factorsFor(rows[0], rows[1], e)
  const kills = (x: Rational, y: Rational) => isZero(ratAdd(ratMul(x, rows[0].a[e]), ratMul(y, rows[1].a[e])))
  const [P, Q] = [ratAbs(p), ratAbs(q)]
  const s = ratSign(q) < 0 ? -1 : 1
  const sg = (x: Rational) => (s < 0 ? ratNeg(x) : x)
  const cands: [Rational, Rational, string][] = [
    [p, ratNeg(q), 'eqs-add-sign'],
    [Q, sg(P), 'eqs-factor-swap'],
    [ONE, q, 'eqs-factor-one'],
    [p, sg(ONE), 'eqs-factor-one'],
  ]
  const label = (x: Rational, y: Rational) => math(opLabel(x, y, names[0], names[1]))
  const correct = label(p, q)
  const wrongs = distinct(
    correct,
    rng.shuffle(cands.filter(([x, y]) => !kills(x, y))).map(([x, y, rule]) => ({ content: label(x, y), rule })),
  )
  const prod = (k: Rational, i: number) => `${isOne(k) ? '' : `${ratLatex(k)} \\cdot `}${paren(rows[i].a[e])}`
  return choiceStep(rng, {
    id: 'faktoren',
    title: 'Womit malnehmen?',
    question: `Mit welcher Rechnung fällt $${vars[e]}$ weg?\n$${systemLatex(rows.map((r) => rowLatex(r, vars)), names)}$`,
    correct,
    wrongs,
    hint: `Nimm die Gleichungen so mal, dass vor $${vars[e]}$ dieselbe Zahl steht, einmal mit Plus und einmal mit Minus. Dann heben sie sich beim Addieren auf.`,
    explanation: {
      detailed: `Vor $${vars[e]}$ stehen $${ratLatex(rows[0].a[e])}$ und $${ratLatex(rows[1].a[e])}$. Mit $${opLabel(p, q, names[0], names[1])}$ wird daraus $${prod(p, 0)} ${ratSign(q) < 0 ? '-' : '+'} ${prod(Q, 1)} = 0$: $${vars[e]}$ fällt weg.`,
      short: `$${opLabel(p, q, names[0], names[1])}$: vor $${vars[e]}$ ergibt sich $0$.`,
    },
    cards: [EQS_CARD.addieren],
  })
}

// Addieren: neue Gleichung p · I + q · II ohne e; Wert der übrigen Unbekannten k (oder 0 = D)
function combineStep(rng: Rng, ctx: Ctx, rows: readonly [Row, Row], e: number, k: number, extra: { readonly solvedDrawing?: VectorDrawing }): { step: GuidedStep; row: Row } {
  const { vars, names } = ctx
  const [p, q] = factorsFor(rows[0], rows[1], e)
  const N = lin(p, rows[0], q, rows[1])
  const op = opLabel(p, q, names[0], names[1])
  const scaled = (k: Rational, i: number) => (isOne(k) ? '' : `$${ratLatex(k)} \\cdot ${names[i]}\\colon ${rowLatex(lin(k, rows[i], ZERO, rows[i]), vars)}$, `)
  const lines = `${scaled(p, 0)}${scaled(ratAbs(q), 1)}`
  const K = N.a[k]
  if (isZero(K)) {
    // keine Unbekannte bleibt: 0 = D (wird im nächsten Schritt gedeutet)
    return { row: N, step: { ...caseStep(rng, N, `Rechne $${op}$. Was bleibt übrig, und was heißt das?\n$${systemLatex(rows.map((r) => rowLatex(r, vars)), names)}$`, [EQS_CARD.addieren, EQS_CARD.wann], `${lines}zusammen ($${op}$): $${rowLatex(N, vars)}$.`, vars[k]), ...extra } }
  }
  const val = ratDiv(N.c, K)
  const show = (x: Rational) => math(`${vars[k]} = ${ratLatex(x)}`)
  const cands: Wrong[] = []
  const oneSide = ratAdd(ratMul(R(ratSign(p)), rows[0].c), ratMul(R(ratSign(q)), rows[1].c))
  if (!isOne(ratAbs(p)) || !isOne(ratAbs(q))) cands.push({ content: show(ratDiv(oneSide, K)), rule: 'eqs-one-side' })
  const Kw = ratSub(ratMul(p, rows[0].a[k]), ratMul(q, rows[1].a[k]))
  if (ratSign(q) < 0) {
    if (!isZero(Kw)) cands.push({ content: show(ratDiv(N.c, Kw)), rule: 'eqs-sub-sign' })
    cands.push({ content: show(ratDiv(ratSub(ratMul(p, rows[0].c), ratMul(q, rows[1].c)), K)), rule: 'eqs-sub-sign' })
  }
  if (!isZero(N.c)) cands.push({ content: show(ratDiv(K, N.c)), rule: 'gauss-divide-flip' })
  if (!isOne(K)) cands.push({ content: show(N.c), rule: 'gauss-divide-forgot' })
  const correct = show(val)
  return {
    row: N,
    step: {
      ...choiceStep(rng, {
        id: `wert-${vars[k]}`,
        title: 'Addieren',
        question: `Rechne $${op}$. Welcher Wert ergibt sich für $${vars[k]}$?\n$${systemLatex(rows.map((r) => rowLatex(r, vars)), names)}$`,
        correct,
        wrongs: distinct(correct, rng.shuffle(cands)),
        hint: 'Nimm jede Gleichung **ganz** mal, auch die rechte Seite, und rechne dann Glied für Glied zusammen (bei Minus jedes Vorzeichen umdrehen).',
        explanation: {
          detailed: `${lines}zusammen ($${op}$): $${rowLatex(N, vars)}$${isOne(K) ? '' : `, also $${vars[k]} = ${ratLatex(val)}$`}.`,
          short: `$${op}$: $${rowLatex(N, vars)}$, $${vars[k]} = ${ratLatex(val)}$.`,
        },
        established: [`${vars[k]} = ${ratLatex(val)}`],
        cards: [EQS_CARD.addieren],
      }),
      ...extra,
    },
  }
}

// Alle Unbekannten sind weggefallen: 0 = D deuten
function caseStep(rng: Rng, row: Row, question: string, cards: readonly string[], why: string, v0: string): GuidedStep {
  const none = !isZero(row.c)
  const eq = `0 = ${ratLatex(row.c)}`
  const some = 'die Unbekannten'
  const wrongs: Wrong[] = none
    ? [
        { content: `unendlich viele Lösungen, denn ${some} sind weggefallen`, rule: 'eqs-contradiction-inf' },
        { content: `genau eine Lösung, nämlich $${v0} = ${ratLatex(row.c)}$`, rule: 'eqs-contradiction-value' },
      ]
    : [
        { content: `keine Lösung, denn ${some} sind weggefallen`, rule: 'eqs-zero-none' },
        { content: `genau eine Lösung, nämlich $${v0} = 0$`, rule: 'eqs-zero-unique' },
      ]
  return choiceStep(rng, {
    id: 'deuten',
    title: 'Was bleibt?',
    question,
    correct: none ? `keine Lösung, denn $${eq}$ ist nie erfüllt` : `unendlich viele Lösungen, denn $${eq}$ gilt immer`,
    wrongs,
    hint: 'Fallen alle Unbekannten weg, bleibt eine Aussage ohne Unbekannte. Ist sie falsch, erfüllt nichts beide Gleichungen; ist sie wahr, schränkt sie nichts ein.',
    explanation: {
      detailed: `${why} ${none ? `$${eq}$ ist falsch, egal was du einsetzt: Kein Zahlenpaar erfüllt beide Gleichungen, das System hat keine Lösung. Die Geraden sind parallel.` : `$${eq}$ ist immer wahr: Beide Gleichungen sagen dasselbe. Jeder Punkt der einen Gleichung ist eine Lösung, also unendlich viele. Die Geraden sind gleich.`}`,
      short: none ? `$${eq}$: Widerspruch, keine Lösung.` : `$${eq}$: immer wahr, unendlich viele Lösungen.`,
    },
    established: [`\\text{${LGS_CASES[none ? 1 : 2]}}`],
    cards,
  })
}

// Lösungsmenge bei unendlich vielen Lösungen (zwei Unbekannte): eine Unbekannte frei
type LineSet = { readonly p: readonly Rational[]; readonly r: readonly Rational[] }
const setLatex = (s: LineSet) => `L\\colon \\vec x = ${vecLatex(s.p)} + t ${vecLatex(s.r)}`
function sameLine(s: LineSet, w: LineSet): boolean {
  const cr = (u: readonly Rational[], v: readonly Rational[]) => ratSub(ratMul(u[0], v[1]), ratMul(u[1], v[0]))
  if (w.r.every(isZero)) return false
  return isZero(cr(s.r, w.r)) && isZero(cr(s.r, [ratSub(w.p[0], s.p[0]), ratSub(w.p[1], s.p[1])]))
}
function setStep(rng: Rng, ctx: Ctx, row: Row): { step: GuidedStep; set: LineSet } {
  const { vars } = ctx
  // frei: die Unbekannte, deren Partnerin die Zahl ±1 hat (sonst die zweite)
  const f = isOne(ratAbs(row.a[0])) ? 1 : isOne(ratAbs(row.a[1])) ? 0 : 1
  const s = 1 - f
  const p = [ZERO, ZERO]
  const r = [ZERO, ZERO]
  p[s] = ratDiv(row.c, row.a[s])
  r[s] = ratNeg(ratDiv(row.a[f], row.a[s]))
  r[f] = ONE
  const set: LineSet = { p, r }
  const cands: [LineSet, string][] = [
    [{ p: r, r: p }, 'gauss-param-swap'],
    [{ p, r: r.map((x, j) => (j === f ? ZERO : x)) }, 'gauss-param-free-one'],
    [{ p, r: r.map((x, j) => (j === s ? ratNeg(x) : x)) }, 'gauss-backsub-sign'],
    [{ p: p.map(ratNeg), r }, 'eqs-set-point'],
  ]
  const correct = math(setLatex(set))
  const wrongs = distinct(
    correct,
    rng.shuffle(cands.filter(([w]) => !sameLine(set, w))).map(([w, rule]) => ({ content: math(setLatex(w)), rule })),
  )
  const solved = `${vars[s]} = ${exprLatex({ a: [f === 0 ? r[s] : ZERO, f === 1 ? r[s] : ZERO], t: p[s] }, vars)}`
  return {
    set,
    step: choiceStep(rng, {
      id: 'loesung',
      title: 'Lösungsmenge',
      question: `Beide Gleichungen sagen dasselbe: $${rowLatex(row, vars)}$. Wähle $${vars[f]} = t$ frei. Wie lautet die Lösungsmenge?`,
      correct,
      wrongs,
      hint: `Setz $${vars[f]} = t$ und löse nach $${vars[s]}$ auf. Die Zahlen ohne $t$ bilden den Stützvektor, die Zahlen vor $t$ die Richtung (bei $${vars[f]}$ eine $1$).`,
      explanation: {
        detailed: `Mit $${vars[f]} = t$ wird $${solved.replaceAll(vars[f], 't')}$. Also $x$ und $y$ zusammen: $${setLatex(set)}$. Jeder Wert von $t$ gibt eine Lösung.`,
        short: `$${vars[f]} = t$: $${setLatex(set)}$.`,
      },
      established: [setLatex(set)],
      cards: [EQS_CARD.wann],
    }),
  }
}

// Zurückrechnen: v aus einer Gleichung mit den bekannten Werten; Antwort mit den Werten aller gezeigten Unbekannten
function backStep(
  rng: Rng,
  ctx: Ctx,
  src: { readonly row: Row; readonly text: string; readonly expr?: Expr },
  v: number,
  known: readonly Rational[],
  shown: readonly number[],
  opts: { readonly id: string; readonly title: string; readonly cards: readonly string[]; readonly names?: readonly string[] },
): { step: GuidedStep; x: Rational[] } {
  const { vars } = ctx
  const { row } = src
  const others = row.a.map((_, j) => j).filter((j) => j !== v && !isZero(row.a[j]))
  const rest = others.reduce((s, j) => ratAdd(s, ratMul(row.a[j], known[j])), ZERO)
  const av = row.a[v]
  const val = ratDiv(ratSub(row.c, rest), av)
  const x = known.map((e, j) => (j === v ? val : e))
  const names = opts.names ?? vars
  const show = (y: readonly Rational[], idx = shown) => math(idx.map((j) => `${names[j]} = ${ratLatex(y[j])}`).join(',\\; '))
  const withV = (w: Rational) => x.map((e, j) => (j === v ? w : e))
  const cands: Wrong[] = []
  if (!isZero(rest)) cands.push({ content: show(withV(ratDiv(ratAdd(row.c, rest), av))), rule: src.expr ? 'eqs-insert-sign' : 'gauss-backsub-sign' })
  if (!isOne(av)) cands.push({ content: show(withV(ratSub(row.c, rest))), rule: 'gauss-divide-forgot' })
  if (others.some((j) => !isOne(ratAbs(row.a[j])) && !isZero(known[j]))) {
    const plain = others.reduce((s, j) => ratAdd(s, ratMul(R(ratSign(row.a[j])), known[j])), ZERO)
    cands.push({ content: show(withV(ratDiv(ratSub(row.c, plain), av))), rule: 'gauss-backsub-coef' })
  }
  if (shown.length === 2 && !ratEq(x[shown[0]], x[shown[1]])) {
    const sw = [...x]
    ;[sw[shown[0]], sw[shown[1]]] = [x[shown[1]], x[shown[0]]]
    cands.push({ content: show(sw), rule: 'eqs-swap-values' })
  }
  const missing = { content: show(x, shown.filter((j) => j !== v)), rule: 'eqs-second-missing' }
  const correct = show(x)
  const knownIdx = others.length > 0 ? others : shown.filter((j) => j !== v)
  const calc = src.expr
    ? `$${vars[v]} = ${products(src.expr.a.map((c, j) => [c, known[j]] as const), src.expr.t)} = ${ratLatex(val)}$`
    : `$${term(av, vars[v])} = ${products(others.map((j) => [ratNeg(row.a[j]), known[j]] as const), ZERO, row.c)} = ${ratLatex(ratSub(row.c, rest))}$${isOne(av) ? '' : `, also $${vars[v]} = ${ratLatex(val)}$`}`
  return {
    x,
    step: choiceStep(rng, {
      id: opts.id,
      title: opts.title,
      question: `Setz ${knownText(vars, known, knownIdx)} in $${src.text}$ ein. Wie lautet ${shown.length > 2 ? 'die Lösung' : `das Ergebnis`}?`,
      correct,
      wrongs: rng.shuffle([...distinct(correct, cands), missing]),
      hint: `Bekannte Werte in Klammern einsetzen, ausrechnen und nach $${vars[v]}$ auflösen. Am Ende alle Unbekannten angeben.`,
      explanation: {
        detailed: `Eingesetzt: ${calc}. Zusammen: $${valuesLatex(names, x, shown)}$.`,
        short: `${calc}.`,
      },
      established: [valuesLatex(names, x, shown)],
      cards: opts.cards,
    }),
  }
}

// Welches Verfahren passt? (vor dem Lösen, Stufe 2)
const METHOD_TEXT: Readonly<Record<Method | 'gauss', string>> = {
  subst: 'Einsetzen, denn eine Gleichung ist schon nach einer Unbekannten aufgelöst, die andere nicht',
  equal: 'Gleichsetzen, denn beide Gleichungen sind nach derselben Unbekannten aufgelöst',
  add: 'Addieren, denn keine Unbekannte steht allein, aber vor einer stehen gleiche oder entgegengesetzte Zahlen',
  gauss: 'Gauß-Verfahren mit Tabelle, denn das geht immer',
}
function methodStep(rng: Rng, method: Method, why: string): GuidedStep {
  const rule = 'Steht eine Unbekannte schon allein, setzt du ein; sind beide Gleichungen nach derselben aufgelöst, setzt du gleich; steht keine allein, aber vor einer Unbekannten gleiche oder entgegengesetzte Zahlen, addierst du.'
  const reason = (m: Method | 'gauss') =>
    m === 'gauss' ? `Das Gauß-Verfahren geht zwar immer, ist bei zwei Gleichungen aber ein Umweg. ${rule}` : `Die Begründung passt nicht zu diesen Gleichungen. ${rule}`
  const wrongs: Wrong[] = (['subst', 'equal', 'add', 'gauss'] as const)
    .filter((m) => m !== method)
    .map((m) => ({ content: METHOD_TEXT[m], rule: 'eqs-method', why: { detailed: reason(m), short: 'Auf die Form der Gleichungen achten.' } }))
  return choiceStep(rng, {
    id: 'verfahren',
    title: 'Welches Verfahren?',
    question: 'Welches Verfahren passt hier am besten?',
    correct: METHOD_TEXT[method],
    wrongs,
    hint: 'Schau auf die Form: Steht eine Unbekannte schon allein? Sind beide Gleichungen nach derselben aufgelöst? Stehen vor einer Unbekannten gleiche oder entgegengesetzte Zahlen?',
    explanation: { detailed: why, short: why },
    cards: [EQS_CARD.wann],
  })
}

// ------------------------------------------------------------------ Bilder

const nrow = (r: Row) => [...r.a.map(num), num(r.c)]
// Bild nach dem Wegfallen einer Unbekannten: Gleichung `target` wird zur neuen, Gleichung `kept` bleibt
function turnDrawing(rows: readonly Row[], kept: number, target: number, after: Row, label: string, vars: readonly string[]): VectorDrawing | undefined {
  if (rows.length !== 2 || rows[0].a.length !== 2) return undefined
  const before = rows.map(nrow)
  const d = elimDrawing({ before, after: before.map((r, i) => (i === target ? nrow(after) : r)), row: kept, targets: [{ target, label }], n: 2, vars, center: sceneCenter(before, 2) })
  return d && { ...d, caption: d.caption.replaceAll('Zeile', 'Gleichung') }
}
function resultPicture(rows: readonly Row[], kase: Case, x: readonly Rational[] | null, set: LineSet | null) {
  const n = rows[0].a.length
  if (n > 3) return {}
  const solution = kase === 'none' ? null : kase === 'inf' && set ? { p: set.p.map(num), dirs: [set.r.map(num)] } : { p: x!.map(num), dirs: [] }
  const d = systemDrawing({ T: rows.map(nrow), n, solution })
  return d ? { resultDrawing: d } : {}
}

// ------------------------------------------------------------------ Lösen mit einem Verfahren (zwei Unbekannte)

type Solved = { readonly steps: GuidedStep[]; readonly kase: Case; readonly x: Rational[] | null; readonly set: LineSet | null }

type TwoSpec = {
  readonly rows: readonly [Row, Row]
  // die beiden Unbekannten (Stellen in vars)
  readonly pair: readonly [number, number]
  readonly method: Method
  // Einsetzen: Gleichung i nach v; Gleichsetzen: beide nach v; Addieren: v fällt weg
  readonly i: number
  readonly v: number
  // schon aufgelöst angezeigt (Stelle der Unbekannten) je Gleichung
  readonly solvedShown: readonly (number | null)[]
  // bekannte Werte der übrigen Unbekannten (drei Gleichungen) und gezeigte Unbekannte im Ergebnis
  readonly known: readonly Rational[]
  readonly shown: readonly number[]
  readonly drawings: boolean
  // Text der Gleichungen für „Setz … in … ein“
  readonly texts: readonly string[]
  readonly backCards: readonly string[]
  readonly finalId: string
  // Vorsilbe der Ids (Teilsystem bei drei Gleichungen)
  readonly tag: string
}

function solveTwo(rng: Rng, ctx: Ctx, s: TwoSpec): Solved | null {
  const { rows, method, v, vars } = { ...s, vars: ctx.vars }
  const o = s.pair[0] === v ? s.pair[1] : s.pair[0]
  // jede Gleichung enthält beide Unbekannten (sonst gibt es nichts aufzulösen bzw. wegfallen zu lassen)
  if (rows.some((r) => isZero(r.a[v]) || isZero(r.a[o]))) return null
  const steps: GuidedStep[] = []
  const pic = (kept: number, target: number, after: Row, label: string) => {
    const d = s.drawings ? turnDrawing(rows, kept, target, after, label, vars) : undefined
    return d ? { solvedDrawing: d } : {}
  }
  if (method === 'subst' || method === 'equal') {
    const exprs: (Expr | null)[] = [null, null]
    const solvedIdx = method === 'subst' ? [s.i] : [0, 1]
    for (const k of solvedIdx) {
      if (s.solvedShown[k] === v) exprs[k] = solveFor(rows[k], v)
      else {
        const r = solveStep(rng, ctx, rows[k], ctx.names[k], v, `${s.tag}aufloesen-${k + 1}`)
        steps.push(r.step)
        exprs[k] = r.E
      }
    }
    if (method === 'subst') {
      const i = s.i
      const j = 1 - i
      const E = exprs[i]!
      const ins = insertStep(rng, ctx, { row: rows[i], v, E, name: ctx.names[i] }, { row: rows[j], name: ctx.names[j] }, `${s.tag}einsetzen`)
      steps.push({ ...ins.step, ...pic(i, j, ins.row, '\\text{Einsetzen}') })
      const R = ins.row
      if (isFlatRow(R)) return degenerate(rng, ctx, steps, rows, R, `Nach dem Einsetzen bleibt $${rowLatex(R, vars)}$.`, vars[o])
      if (!isOne(R.a[o])) steps.push(valueStep(rng, ctx, R, o, `wert-${vars[o]}`, [EQS_CARD.einsetzen]))
      const known = s.known.map((e, j) => (j === o ? ratDiv(R.c, R.a[o]) : e))
      const back = backStep(rng, ctx, { row: rowOfExpr(v, E), text: `${vars[v]} = ${exprLatex(E, vars)}`, expr: E }, v, known, s.shown, { id: s.finalId, title: 'Zurückrechnen', cards: s.backCards })
      steps.push(back.step)
      return { steps, kase: 'unique', x: back.x, set: null }
    }
    const [E1, E2] = [exprs[0]!, exprs[1]!]
    if (ratEq(E1.a[o], E2.a[o])) return null
    const after: Row = { a: E1.a.map((x, j) => (j === v ? ZERO : ratSub(x, E2.a[j]))), c: ratSub(E2.t, E1.t) }
    const eq = equateStep(rng, ctx, E1, E2, v, o, pic(0, 1, after, '\\text{Gleichsetzen}'))
    steps.push(eq.step)
    const known = s.known.map((e, j) => (j === o ? eq.value : e))
    const useFirst = rng.chance(0.5)
    const E = useFirst ? E1 : E2
    const back = backStep(rng, ctx, { row: rowOfExpr(v, E), text: `${vars[v]} = ${exprLatex(E, vars)}`, expr: E }, v, known, s.shown, { id: s.finalId, title: 'Zurückrechnen', cards: s.backCards })
    steps.push(back.step)
    return { steps, kase: 'unique', x: back.x, set: null }
  }
  // Addieren: v fällt weg
  const [p, q] = factorsFor(rows[0], rows[1], v)
  if (!isOne(p) || !isOne(ratAbs(q))) steps.push(factorStep(rng, ctx, rows, v))
  const N = lin(p, rows[0], q, rows[1])
  const comb = combineStep(rng, ctx, rows, v, o, pic(0, 1, N, opLabel(p, q, ctx.names[0], ctx.names[1])))
  steps.push(comb.step)
  if (isFlatRow(N)) return degenerate(rng, ctx, steps, rows, N, null, vars[o])
  const known = s.known.map((e, j) => (j === o ? ratDiv(N.c, N.a[o]) : e))
  // zurück in die Gleichung mit der einfacheren Zahl vor v
  const k = ratAbs(rows[0].a[v]).n <= ratAbs(rows[1].a[v]).n ? 0 : 1
  const back = backStep(rng, ctx, { row: rows[k], text: `${ctx.names[k]}\\colon ${s.texts[k]}` }, v, known, s.shown, { id: s.finalId, title: 'Zurückrechnen', cards: s.backCards })
  steps.push(back.step)
  return { steps, kase: 'unique', x: back.x, set: null }
}

// keine oder unendlich viele Lösungen: deuten (falls nicht schon beim Addieren) und bei unendlich vielen die Lösungsmenge
function degenerate(rng: Rng, ctx: Ctx, steps: GuidedStep[], rows: readonly [Row, Row], R: Row, why: string | null, left: string): Solved {
  if (why !== null) steps.push(caseStep(rng, R, `Nach dem Einsetzen bleibt $${rowLatex(R, ctx.vars)}$. Was heißt das?`, [EQS_CARD.wann], why, left))
  if (!isZero(R.c)) return { steps, kase: 'none', x: null, set: null }
  const base = rows.find((r) => !isFlatRow(r))!
  const st = setStep(rng, ctx, base)
  steps.push(st.step)
  return { steps, kase: 'inf', x: null, set: st.set }
}

// ------------------------------------------------------------------ Gleichungen in unordentlicher Form (Stufe 3 und 5)

type Messy = { readonly latex: string; readonly row: Row; readonly wrongs: readonly (readonly [Row, string])[]; readonly form: string }
const nonzero = (rng: Rng, lo: number, hi: number) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}

// ein Glied mit Unbekannter nach rechts, eine Zahl nach links
function moveForm(rng: Rng, row: Row, vars: readonly string[]): Messy | null {
  const idx = row.a.map((_, j) => j).filter((j) => !isZero(row.a[j]))
  if (idx.length < 2) return null
  const j = rng.pick(idx)
  const c1 = R(nonzero(rng, -6, 6))
  const left: (readonly [Rational, string])[] = idx.filter((k) => k !== j).map((k) => [row.a[k], vars[k]] as const)
  if (rng.chance(0.5)) left.push([c1, ''])
  else left.unshift([c1, ''])
  const rc = ratAdd(row.c, c1)
  const rightTerms: (readonly [Rational, string])[] = rng.chance(0.5) ? [[ratNeg(row.a[j]), vars[j]], [rc, '']] : [[rc, ''], [ratNeg(row.a[j]), vars[j]]]
  const neg = row.a.map((x, k) => (k === j ? ratNeg(x) : x))
  return {
    latex: `${termsLatex(left)} = ${termsLatex(rightTerms)}`,
    row,
    wrongs: [
      [{ a: neg, c: row.c }, 'eqs-order-side'],
      [{ a: row.a, c: ratAdd(rc, c1) }, 'eqs-order-const'],
      [{ a: neg, c: ratAdd(rc, c1) }, 'eqs-order-side'],
    ],
    form: `m${j}`,
  }
}

// Klammer: k(p·v + q), ein anderes Glied rechts
function bracketForm(rng: Rng, row: Row, vars: readonly string[]): Messy | null {
  const idx = row.a.map((_, j) => j).filter((j) => !isZero(row.a[j]))
  const options = idx.flatMap((j) => [2, 3, 4, 5, -2, -3].filter((k) => isInteger(ratDiv(row.a[j], R(k)))).map((k) => [j, k] as const))
  if (options.length === 0 || idx.length < 2) return null
  const [j, k] = rng.pick(options)
  const m = rng.pick(idx.filter((x) => x !== j))
  const p = ratDiv(row.a[j], R(k))
  const q = R(nonzero(rng, -5, 5))
  const r = ratAdd(row.c, ratMul(R(k), q))
  const inner = termsLatex([[p, vars[j]], [q, '']])
  const lhs = join([`${prefix(R(k))}(${inner})`, ...idx.filter((x) => x !== j && x !== m).map((x) => term(row.a[x], vars[x]))])
  const rhs = rng.chance(0.5) ? termsLatex([[r, ''], [ratNeg(row.a[m]), vars[m]]]) : termsLatex([[ratNeg(row.a[m]), vars[m]], [r, '']])
  return {
    latex: `${lhs} = ${rhs}`,
    row,
    wrongs: [
      [{ a: row.a, c: ratSub(r, q) }, 'eqs-bracket-partial'],
      [{ a: row.a, c: ratAdd(r, ratMul(R(k), q)) }, k < 0 ? 'eqs-bracket-sign' : 'eqs-order-const'],
      [{ a: row.a.map((x, i) => (i === m ? ratNeg(x) : x)), c: row.c }, 'eqs-order-side'],
    ],
    form: `k${j}${k < 0 ? '-' : '+'}`,
  }
}

const lcm = (a: number, b: number) => (a * b) / Number(gcdBig(BigInt(a), BigInt(b)))
// Brüche: n1·x/p ± n2·y/q = r, ein Bruch auf der rechten Seite; die Zeile hat ganze Zahlen (mit dem Hauptnenner malgenommen)
function fractionForm(rng: Rng, point: readonly Rational[], vars: readonly string[]): Messy {
  const [p, q] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2)
  const coprime = (n: number, d: number) => gcdBig(BigInt(n), BigInt(d)) === 1n
  const pickNum = (d: number) => rng.pick([1, 1, 2, 3, -1, -2].filter((n) => coprime(Math.abs(n), d)))
  const [n1, n2] = [pickNum(p), pickNum(q)]
  const L = lcm(p, q)
  const r = ratAdd(ratDiv(ratMul(R(n1), point[0]), R(p)), ratDiv(ratMul(R(n2), point[1]), R(q)))
  const row: Row = { a: [R((L * n1) / p), R((L * n2) / q)], c: ratMul(R(L), r) }
  const frac = (n: number, d: number, v: string) => `${n < 0 ? '-' : ''}\\frac{${Math.abs(n) === 1 ? '' : Math.abs(n)}${v}}{${d}}`
  const second = frac(-n2, q, vars[1])
  const rhs = isZero(r) ? second : `${ratLatex(r)} ${second.startsWith('-') ? '-' : '+'} ${second.replace(/^-/, '')}`
  return {
    latex: `${frac(n1, p, vars[0])} = ${rhs}`,
    row,
    wrongs: [
      [{ a: row.a, c: r }, 'eqs-one-side'],
      [{ a: [R(n1), R(n2)], c: r }, 'eqs-fraction-drop'],
      [{ a: [row.a[0], ratNeg(row.a[1])], c: row.c }, 'eqs-order-side'],
    ],
    form: `f${p}${q}`,
  }
}

function orderStep(rng: Rng, ctx: Ctx, m: Messy, k: number): GuidedStep {
  const { vars } = ctx
  const correct = math(rowLatex(m.row, vars))
  const wrongs = distinct(
    correct,
    rng.shuffle(m.wrongs.filter(([r]) => !rowsEquivalent(r, m.row)).map(([r, rule]) => ({ content: math(rowLatex(r, vars)), rule }))),
  )
  const shape = vars.length === 2 ? 'ax + by = c' : 'ax + by + cz = d'
  const fr = m.form.startsWith('f')
  const br = m.form.startsWith('k')
  return choiceStep(rng, {
    id: `ordnen-${k + 1}`,
    title: 'Ordnen',
    question: `Bring Gleichung $${ctx.names[k]}$ in die Form $${shape}$: $${m.latex}$`,
    correct,
    wrongs,
    hint: `${fr ? 'Nimm die **ganze** Gleichung mit dem Hauptnenner mal, auch die rechte Seite. ' : ''}${br ? 'Multiplizier die Klammer aus: Die Zahl davor nimmt jedes Glied mal. ' : ''}Bring die Unbekannten nach links, die Zahlen nach rechts; was die Seite wechselt, wechselt das Vorzeichen.`,
    explanation: {
      detailed: `${fr ? 'Mit dem Hauptnenner malnehmen (jedes Glied, auch rechts), dann die' : br ? 'Klammer ausmultiplizieren, dann die' : 'Die'} Glieder mit Unbekannten nach links und die Zahlen nach rechts bringen (Vorzeichen wechselt): $${rowLatex(m.row, vars)}$.`,
      short: `$${rowLatex(m.row, vars)}$.`,
    },
    established: [rowLatex(m.row, vars)],
    cards: [EQS_CARD.wann],
  })
}

// ------------------------------------------------------------------ Bau

const XY = ['x', 'y'] as const
const XYZ = ['x', 'y', 'z'] as const
const small = (rows: readonly Row[], lim: number) => rows.every((r) => [...r.a, r.c].every((x) => Math.abs(num(x)) <= lim))
const det2 = (r: readonly Row[], i = 0, j = 1) => ratSub(ratMul(r[0].a[i], r[1].a[j]), ratMul(r[0].a[j], r[1].a[i]))
const sgn = (x: Rational) => '0+-'[(ratSign(x) + 3) % 3]
const shape = (rows: readonly Row[]) => rows.map((r) => r.a.map((x) => (isZero(x) ? '0' : isOne(ratAbs(x)) ? (ratSign(x) < 0 ? 'm' : '1') : sgn(x))).join('')).join('.')
const dataOf = (rows: readonly Row[]) => ({ rows: rows.flatMap(nrow), n: [rows[0].a.length], m: [rows.length] })

function retry(make: () => Built | null): Built {
  for (let k = 0; k < 3000; k++) {
    const built = make()
    if (built && built.steps.every((s) => s.choices.length >= (s.id === 'deuten' ? 3 : 4))) return built
  }
  throw new Error('Einsetzen, Gleichsetzen, Addieren: keine Aufgabe mit genug Antworten gefunden')
}

const solvedLatex = (r: Row, v: number, vars: readonly string[]) => `${vars[v]} = ${exprLatex(solveFor(r, v), vars)}`
const resultOf = (sol: Solved, vars: readonly string[], shown: readonly number[]) =>
  sol.kase === 'none' ? `\\text{${LGS_CASES[1]}}` : sol.kase === 'inf' ? setLatex(sol.set!) : valuesLatex(vars, sol.x!, shown)
const answerOf = (sol: Solved, shown: readonly number[]) =>
  sol.kase === 'none' ? [1] : sol.kase === 'inf' ? [...sol.set!.p, ...sol.set!.r].map(num) : shown.map((j) => num(sol.x![j]))

// Stufe 1 und 2: zwei Gleichungen, ein Verfahren (Stufe 2 manchmal mit „Welches Verfahren?“)
function buildBasic(rng: Rng, level: Level, method: Method): Built | null {
  const choose = level >= 2 && rng.chance(0.45)
  const x0 = [R(rng.int(-5, 6)), R(rng.int(-5, 6))]
  if (ratEq(x0[0], x0[1])) return null
  const v = rng.int(0, 1)
  const o = 1 - v
  const i = rng.int(0, 1)
  const coef = (lo: number, hi: number) => R(nonzero(rng, lo, hi))
  const big = () => R(rng.pick([2, 3, 4, 5, 6, -2, -3, -4, -5]))
  const rows: Row[] = [0, 1].map(() => ({ a: [ZERO, ZERO], c: ZERO }))
  const shown: (number | null)[] = [null, null]
  const make = (a: Rational[]): Row => ({ a, c: lhsAt({ a, c: ZERO }, x0) })
  if (method === 'subst') {
    const av = level <= 1 || choose ? R(rng.pick([1, 1, 1, -1])) : big()
    const ai: Rational[] = [ZERO, ZERO]
    ai[v] = av
    ai[o] = level <= 1 ? coef(-6, 6) : big()
    rows[i] = make(ai)
    const aj: Rational[] = [ZERO, ZERO]
    aj[v] = big()
    aj[o] = level <= 1 ? coef(-6, 6) : big()
    rows[1 - i] = make(aj)
    if (choose || (level <= 1 && isOne(av) && rng.chance(0.5))) shown[i] = v
    if (choose && !isOne(av)) return null
  } else if (method === 'equal') {
    for (const k of [0, 1]) {
      const a: Rational[] = [ZERO, ZERO]
      const both = level <= 1 ? rng.chance(0.7) : choose
      a[v] = both || level <= 1 ? R(rng.pick([1, 1, -1])) : big()
      a[o] = level <= 1 ? coef(-5, 5) : big()
      rows[k] = make(a)
      if (both && isOne(a[v])) shown[k] = v
    }
    if (choose && (shown[0] !== v || shown[1] !== v)) return null
    if (level >= 2 && !choose && rows.every((r) => isOne(ratAbs(r.a[v])))) return null
  } else {
    const e = v
    const a1 = R(nonzero(rng, -6, 6))
    const same = level <= 1 || choose
    const a2 = same ? (rng.chance(0.6) ? ratNeg(a1) : a1) : big()
    if (!same && ratEq(ratAbs(a1), ratAbs(a2))) return null
    if (same && isOne(ratAbs(a1)) && level >= 2) return null
    rows[0] = make(e === 0 ? [a1, coef(-6, 6)] : [coef(-6, 6), a1])
    rows[1] = make(e === 0 ? [a2, coef(-6, 6)] : [coef(-6, 6), a2])
    if (level >= 2 && rows.some((r) => isOne(ratAbs(r.a[o])))) return null
    const [p, q] = factorsFor(rows[0], rows[1], e)
    if (num(p) > 5 || Math.abs(num(q)) > 5) return null
  }
  if (isZero(det2(rows)) || !small(rows, level <= 1 ? 40 : 60)) return null
  const ctx: Ctx = { vars: XY, names: [rn(0), rn(1)], cards: [METHOD_CARD[method]] }
  const texts = rows.map((r, k) => (shown[k] !== null ? solvedLatex(r, shown[k]!, XY) : rowLatex(r, XY)))
  const sol = solveTwo(rng, ctx, {
    rows: [rows[0], rows[1]],
    pair: [0, 1],
    method,
    i,
    v,
    solvedShown: shown,
    known: [ZERO, ZERO],
    shown: [0, 1],
    drawings: true,
    texts,
    backCards: [METHOD_CARD[method]],
    finalId: 'loesung',
    tag: '',
  })
  if (!sol) return null
  const why =
    method === 'subst'
      ? `In Gleichung $${rn(i)}$ steht $${XY[v]}$ schon allein: Den Term setzt du direkt in die andere Gleichung ein.`
      : method === 'equal'
        ? `Beide Gleichungen sind nach $${XY[v]}$ aufgelöst: Du setzt die beiden Terme gleich.`
        : `Vor $${XY[v]}$ stehen $${ratLatex(rows[0].a[v])}$ und $${ratLatex(rows[1].a[v])}$: Beim ${ratEq(rows[0].a[v], rows[1].a[v]) ? 'Abziehen' : 'Addieren'} fällt $${XY[v]}$ sofort weg.`
  const steps = choose ? [methodStep(rng, method, why), ...sol.steps] : sol.steps
  const kind: VectorKind = method === 'subst' ? 'eqsSubst' : method === 'equal' ? 'eqsEqual' : 'eqsAdd'
  return {
    kind,
    instruction: choose ? 'Löse das Gleichungssystem mit dem passenden Verfahren.' : `Löse das Gleichungssystem mit dem ${METHOD_NAME[method]}.`,
    functionLatex: systemLatex(texts, ctx.names),
    steps,
    cards: [METHOD_CARD[method], ...(choose ? [EQS_CARD.wann] : [])],
    resultLatex: resultOf(sol, XY, [0, 1]),
    ...resultPicture(rows, sol.kase, sol.x, sol.set),
    form: `${kind}|${choose ? 'w' : ''}|${v}${i}|${shown.map((s) => (s === null ? '-' : s)).join('')}|${shape(rows)}|${x0.map(sgn).join('')}|${sgn(rows[0].c)}${sgn(rows[1].c)}`,
    data: dataOf(rows),
    answer: answerOf(sol, [0, 1]),
  }
}

// Stufe 3: Gleichungen erst ordnen, dann ein Verfahren; auch keine oder unendlich viele Lösungen
function buildMessy(rng: Rng, _level: Level, kase: Case): Built | null {
  const frac = () => (rng.chance(0.3) ? ratDiv(R(nonzero(rng, -7, 7)), R(rng.pick([2, 3]))) : R(rng.int(-5, 6)))
  const x0 = kase === 'unique' ? [frac(), frac()] : [R(rng.int(-4, 5)), R(rng.int(-4, 5))]
  if (kase === 'unique' && ratEq(x0[0], x0[1])) return null
  const coef = () => R(nonzero(rng, -6, 6))
  const make = (a: Rational[]): Row => ({ a, c: lhsAt({ a, c: ZERO }, x0) })
  const kinds = rng.shuffle(['move', 'bracket', 'fraction', 'plain'] as const)
  const forms: (Messy | null)[] = []
  const rows: Row[] = []
  for (let k = 0; k < 2; k++) {
    const want = k === 1 && forms[0] === null ? rng.pick(['move', 'bracket'] as const) : kinds[k]
    if (want === 'fraction' && (k === 0 || kase === 'unique')) {
      const f = fractionForm(rng, x0, XY)
      forms.push(f)
      rows.push(f.row)
      continue
    }
    let row: Row
    if (k === 1 && kase !== 'unique') {
      const lam = R(rng.pick([-3, -2, -1, 2, 3]))
      row = { a: rows[0].a.map((x) => ratMul(lam, x)), c: ratAdd(ratMul(lam, rows[0].c), kase === 'none' ? R(nonzero(rng, -6, 6)) : ZERO) }
    } else row = make([coef(), coef()])
    rows.push(row)
    forms.push(want === 'plain' ? null : want === 'move' ? moveForm(rng, row, XY) : (bracketForm(rng, row, XY) ?? moveForm(rng, row, XY)))
  }
  if (kase === 'unique' && isZero(det2(rows))) return null
  if (!small(rows, 60)) return null
  // Verfahren: Einsetzen, wenn eine Zahl ±1 ist; sonst meist Addieren
  const ones = rows.flatMap((r, k) => r.a.map((x, j) => (isOne(ratAbs(x)) ? [k, j] : null)).filter((p) => p !== null)) as [number, number][]
  const method: Method = kase !== 'unique' ? (ones.length > 0 && rng.chance(0.5) ? 'subst' : 'add') : ones.length > 0 ? rng.pick(['subst', 'subst', 'add', 'equal'] as const) : rng.pick(['add', 'add', 'subst', 'equal'] as const)
  const [i, v] = method === 'subst' && ones.length > 0 ? rng.pick(ones) : [rng.int(0, 1), rng.int(0, 1)]
  const ctx: Ctx = { vars: XY, names: [rn(0), rn(1)], cards: [METHOD_CARD[method], EQS_CARD.wann] }
  const steps: GuidedStep[] = forms.flatMap((f, k) => (f ? [orderStep(rng, ctx, f, k)] : []))
  const sol = solveTwo(rng, ctx, {
    rows: [rows[0], rows[1]],
    pair: [0, 1],
    method,
    i,
    v,
    solvedShown: [null, null],
    known: [ZERO, ZERO],
    shown: [0, 1],
    drawings: true,
    texts: rows.map((r) => rowLatex(r, XY)),
    backCards: [METHOD_CARD[method]],
    finalId: 'loesung',
    tag: '',
  })
  if (!sol || sol.kase !== kase) return null
  steps.push(...sol.steps)
  const shown = forms.map((f, k) => f?.latex ?? rowLatex(rows[k], XY))
  return {
    kind: 'eqsMessy',
    instruction: `Bring beide Gleichungen in die Form $ax + by = c$ und löse dann mit dem ${METHOD_NAME[method]}.`,
    functionLatex: systemLatex(shown, ctx.names),
    steps,
    cards: [EQS_CARD.wann, METHOD_CARD[method]],
    resultLatex: resultOf(sol, XY, [0, 1]),
    ...resultPicture(rows, sol.kase, sol.x, sol.set),
    form: `eqsMessy|${kase}|${method}|${v}${i}|${forms.map((f) => f?.form ?? 'p').join(',')}|${shape(rows)}|${x0.map((x) => (isInteger(x) ? sgn(x) : 'b')).join('')}`,
    data: dataOf(rows),
    answer: answerOf(sol, [0, 1]),
  }
}

// Stufe 4 und 5: drei Gleichungen; eine hat eine Unbekannte fast allein (Zahl ±1), eine enthält sie gar nicht
function buildThree(rng: Rng, level: Level): Built | null {
  const x0 = [0, 1, 2].map(() => R(rng.int(-4, 5)))
  const e = rng.int(0, 2)
  const [o1, o2] = [0, 1, 2].filter((j) => j !== e)
  const [iS, iT, iU] = rng.shuffle([0, 1, 2])
  const coef = () => R(nonzero(rng, -5, 5))
  const rows: Row[] = [0, 1, 2].map(() => ({ a: [], c: ZERO }))
  const make = (a: Rational[]): Row => ({ a, c: lhsAt({ a, c: ZERO }, x0) })
  const aS = [coef(), coef(), coef()]
  aS[e] = R(rng.pick([1, 1, -1]))
  rows[iS] = make(aS)
  const aT = [coef(), coef(), coef()]
  aT[e] = R(rng.pick([2, 3, -2, -3, 4]))
  rows[iT] = make(aT)
  const aU = [coef(), coef(), coef()]
  aU[e] = ZERO
  rows[iU] = make(aU)
  if (!small(rows, 40)) return null
  const names = [rn(0), rn(1), rn(2)]
  const ctx: Ctx = { vars: XYZ, names, cards: [EQS_CARD.tricks, EQS_CARD.einsetzen] }
  const steps: GuidedStep[] = []
  // Stufe 5: eine Gleichung erst ordnen
  const messyAt = level >= 5 ? rng.pick([iS, iT, iU]) : -1
  const messy = messyAt >= 0 ? (rng.chance(0.5) ? bracketForm(rng, rows[messyAt], XYZ) : null) ?? moveForm(rng, rows[messyAt], XYZ) : null
  if (messy) steps.push(orderStep(rng, ctx, messy, messyAt))
  const sv = solveStep(rng, ctx, rows[iS], names[iS], e, 'aufloesen')
  steps.push(sv.step)
  const ins = insertStep(rng, ctx, { row: rows[iS], v: e, E: sv.E, name: names[iS] }, { row: rows[iT], name: names[iT] }, 'einsetzen')
  steps.push(ins.step)
  const T2 = ins.row
  // Teilsystem aus II' und der Gleichung ohne e (in der Reihenfolge der Namen)
  const subRows: [Row, Row] = iT < iU ? [T2, rows[iU]] : [rows[iU], T2]
  const subNames = iT < iU ? [`${names[iT]}'`, names[iU]] : [names[iU], `${names[iT]}'`]
  if (isZero(det2(subRows, o1, o2)) || !small(subRows, 60)) return null
  const subCtx: Ctx = { vars: XYZ, names: subNames, cards: ctx.cards }
  const ones = subRows.flatMap((r, k) => [o1, o2].map((j) => (isOne(ratAbs(r.a[j])) ? [k, j] : null)).filter((p) => p !== null)) as [number, number][]
  const method: Method = ones.length > 0 && rng.chance(0.5) ? 'subst' : 'add'
  const [i, v] = method === 'subst' ? rng.pick(ones) : [0, rng.pick([o1, o2])]
  const sol = solveTwo(rng, subCtx, {
    rows: subRows,
    pair: [o1, o2],
    method,
    i,
    v,
    solvedShown: [null, null],
    known: [ZERO, ZERO, ZERO],
    shown: [o1, o2],
    drawings: false,
    texts: subRows.map((r) => rowLatex(r, XYZ)),
    backCards: [METHOD_CARD[method]],
    finalId: 'teilsystem',
    tag: 'teil-',
  })
  if (!sol || sol.kase !== 'unique') return null
  steps.push(...sol.steps)
  const last = backStep(rng, ctx, { row: rowOfExpr(e, sv.E), text: `${XYZ[e]} = ${exprLatex(sv.E, XYZ)}`, expr: sv.E }, e, sol.x!, [0, 1, 2], { id: 'loesung', title: `$${XYZ[e]}$ zurückrechnen`, cards: [EQS_CARD.tricks] })
  steps.push(last.step)
  const shownRows = rows.map((r, k) => (k === messyAt && messy ? messy.latex : rowLatex(r, XYZ)))
  return {
    kind: 'eqsThree',
    instruction: `Löse das Gleichungssystem. Tipp: ${messy ? 'Nach dem Ordnen ' : ''}Gleichung $${names[iS]}$ nach $${XYZ[e]}$ auflösen und in $${names[iT]}$ einsetzen; mit $${names[iU]}$ bleiben dann zwei Gleichungen mit zwei Unbekannten.`,
    functionLatex: systemLatex(shownRows, names),
    steps,
    cards: [EQS_CARD.tricks, METHOD_CARD[method]],
    resultLatex: valuesLatex(XYZ, last.x, [0, 1, 2]),
    ...resultPicture(rows, 'unique', last.x, null),
    form: `eqsThree|${e}|${iS}${iT}${iU}|${method}${v}|${messy?.form ?? '-'}|${shape(rows)}|${x0.map(sgn).join('')}`,
    data: dataOf(rows),
    answer: last.x.map(num),
  }
}

// Stufe 4 und 5: Unbekannte im Nenner, mit u = 1/x und v = 1/y wird das System linear
const RECIP_VALUES = [1, 2, 3, 4, -1, -2, -3, -4].map(R).concat([rat(1, 2), rat(-1, 2), rat(1, 3), rat(-1, 3), rat(2, 3), rat(-3, 2)])
function buildRecip(rng: Rng, level: Level): Built | null {
  const xy = [rng.pick(RECIP_VALUES), rng.pick(RECIP_VALUES)]
  if (ratEq(xy[0], xy[1])) return null
  const uv = xy.map((x) => ratDiv(ONE, x))
  const rows: Row[] = [0, 1].map(() => {
    const a = [R(nonzero(rng, -6, 6)), R(nonzero(rng, -6, 6))]
    return { a, c: lhsAt({ a, c: ZERO }, uv) }
  })
  if (rows.some((r) => !isInteger(r.c) || isZero(r.c) || isOne(ratAbs(r.c))) || isZero(det2(rows)) || !small(rows, 30)) return null
  const UV = ['u', 'v'] as const
  const fracOf = (c: Rational, v: string) => `${ratSign(c) < 0 ? '-' : ''}\\frac{${ratLatex(ratAbs(c))}}{${v}}`
  // Stufe 5: in einer Gleichung steht ein Bruch rechts
  const moved = level >= 5 ? rng.int(0, 1) : -1
  const lines = rows.map((r, k) => {
    if (k !== moved) return `${join([fracOf(r.a[0], 'x'), fracOf(r.a[1], 'y')])} = ${ratLatex(r.c)}`
    const rhs = fracOf(ratNeg(r.a[1]), 'y')
    return `${fracOf(r.a[0], 'x')} = ${ratLatex(r.c)} ${rhs.startsWith('-') ? '-' : '+'} ${rhs.replace(/^-/, '')}`
  })
  const names = [rn(0), rn(1)]
  const ctx: Ctx = { vars: UV, names, cards: [EQS_CARD.tricks] }
  const sysOf = (rs: readonly Row[]) => math(systemLatex(rs.map((r) => rowLatex(r, UV)), names))
  const inv = (x: Rational) => ratDiv(ONE, x)
  const cands: [Row[], string][] = [
    [rows.map((r) => ({ a: r.a, c: inv(r.c) })), 'eqs-recip-rhs'],
    [rows.map((r) => ({ a: r.a.map(inv), c: r.c })), 'eqs-recip-coef'],
    [rows.map((r) => ({ a: r.a.map(inv), c: inv(r.c) })), 'eqs-recip-coef'],
  ]
  if (moved >= 0) cands.unshift([rows.map((r, k) => (k === moved ? { a: [r.a[0], ratNeg(r.a[1])], c: r.c } : r)), 'eqs-order-side'])
  const correct = sysOf(rows)
  const subst = choiceStep(rng, {
    id: 'substitution',
    title: 'Substitution',
    question: `Setz $u = \\frac{1}{x}$ und $v = \\frac{1}{y}$${moved >= 0 ? ` und bring die Unbekannten nach links` : ''}. Welches Gleichungssystem entsteht?`,
    correct,
    wrongs: distinct(correct, rng.shuffle(cands.filter(([rs]) => rs.some((r, k) => !rowsEquivalent(r, rows[k])))).map(([rs, rule]) => ({ content: sysOf(rs), rule }))),
    hint: `Schreib $\\frac{3}{x}$ als $3 \\cdot \\frac{1}{x} = 3u$: Die Zahl im Zähler bleibt vor $u$ stehen${moved >= 0 ? '. Der Bruch rechts wechselt beim Rüberbringen sein Vorzeichen, die Zahl bleibt rechts.' : ', die rechte Seite bleibt, wie sie ist.'}`,
    explanation: {
      detailed: `Jeder Bruch $\\frac{k}{x}$ ist $k \\cdot \\frac{1}{x} = k\\,u$, ebenso $\\frac{k}{y} = k\\,v$${moved >= 0 ? '; den Bruch rechts bringst du nach links (Vorzeichen wechselt)' : ''}. Das System in $u$ und $v$ ist linear: $${systemLatex(rows.map((r) => rowLatex(r, UV)), names)}$.`,
      short: `$\\frac{k}{x} = k\\,u$, $\\frac{k}{y} = k\\,v$.`,
    },
    established: rows.map((r) => rowLatex(r, UV)),
    cards: [EQS_CARD.tricks],
  })
  const ones = rows.flatMap((r, k) => r.a.map((x, j) => (isOne(ratAbs(x)) ? [k, j] : null)).filter((p) => p !== null)) as [number, number][]
  const method: Method = ones.length > 0 && rng.chance(0.5) ? 'subst' : 'add'
  const [i, v] = method === 'subst' ? rng.pick(ones) : [0, rng.int(0, 1)]
  const sol = solveTwo(rng, ctx, {
    rows: [rows[0], rows[1]],
    pair: [0, 1],
    method,
    i,
    v,
    solvedShown: [null, null],
    known: [ZERO, ZERO],
    shown: [0, 1],
    drawings: false,
    texts: rows.map((r) => rowLatex(r, UV)),
    backCards: [METHOD_CARD[method]],
    finalId: 'teilsystem',
    tag: 'teil-',
  })
  if (!sol || sol.kase !== 'unique') return null
  // zurück: x = 1/u, y = 1/v
  const show = (a: Rational, b: Rational) => math(`x = ${ratLatex(a)},\\; y = ${ratLatex(b)}`)
  const back = [
    { content: show(uv[0], uv[1]), rule: 'eqs-recip-back' },
    { content: show(xy[0], uv[1]), rule: 'eqs-recip-back' },
    { content: show(uv[0], xy[1]), rule: 'eqs-recip-back' },
    { content: show(xy[1], xy[0]), rule: 'eqs-swap-values' },
  ]
  const right = show(xy[0], xy[1])
  const last = choiceStep(rng, {
    id: 'loesung',
    title: 'Zurück zu $x$ und $y$',
    question: `Mit $u = ${ratLatex(uv[0])}$ und $v = ${ratLatex(uv[1])}$: Wie lautet die Lösung in $x$ und $y$?`,
    correct: right,
    wrongs: distinct(right, rng.shuffle(back)),
    hint: 'Es war $u = \\frac{1}{x}$, also $x = \\frac{1}{u}$ (Kehrwert); ebenso $y = \\frac{1}{v}$.',
    explanation: {
      detailed: `$x = \\frac{1}{u}$ ist der Kehrwert von $u = ${ratLatex(uv[0])}$, also $x = ${ratLatex(xy[0])}$, und $y = \\frac{1}{v} = ${ratLatex(xy[1])}$. Beide sind nicht $0$, also erlaubt (durch $0$ teilen geht nicht).`,
      short: `$x = \\frac{1}{u} = ${ratLatex(xy[0])}$, $y = \\frac{1}{v} = ${ratLatex(xy[1])}$.`,
    },
    established: [`x = ${ratLatex(xy[0])},\\; y = ${ratLatex(xy[1])}`],
    cards: [EQS_CARD.tricks],
  })
  return {
    kind: 'eqsRecip',
    instruction: `Die Unbekannten stehen im Nenner. Löse mit $u = \\frac{1}{x}$, $v = \\frac{1}{y}$ und dem ${METHOD_NAME[method]}.`,
    functionLatex: systemLatex(lines, names),
    steps: [subst, ...sol.steps, last],
    cards: [EQS_CARD.tricks, METHOD_CARD[method]],
    resultLatex: `x = ${ratLatex(xy[0])},\\; y = ${ratLatex(xy[1])}`,
    form: `eqsRecip|${moved}|${method}${v}${i}|${shape(rows)}|${xy.map((x) => (isInteger(x) ? sgn(x) : `b${sgn(x)}`)).join('')}`,
    data: { ...dataOf(rows), recip: [1] },
    answer: xy.map(num),
  }
}

// Stufe 5: Parameter a vor einer Unbekannten; Addieren lässt die andere wegfallen, übrig bleibt (Faktor mit a) · w = D
function buildParam(rng: Rng): Built | null {
  const w = rng.int(0, 1)
  const e = 1 - w
  const pr = rng.int(0, 1)
  const a0 = R(nonzero(rng, -5, 5))
  const k = R(rng.pick([2, 3, -2, 1, -1]))
  const be = [R(nonzero(rng, -5, 5)), R(nonzero(rng, -5, 5))]
  if (ratEq(ratAbs(be[0]), ratAbs(be[1])) && rng.chance(0.5)) return null
  const other = R(nonzero(rng, -6, 6))
  // Zeile pr: (k a + l) w + be[pr] e = c, andere Zeile: other w + be e = c'
  const tmp: [Row, Row] = [{ a: [ZERO, ZERO], c: ZERO }, { a: [ZERO, ZERO], c: ZERO }]
  const withE = (r: number) => (e === 0 ? [be[r], ZERO] : [ZERO, be[r]])
  tmp[0] = { a: withE(0), c: ZERO }
  tmp[1] = { a: withE(1), c: ZERO }
  const [p, q] = factorsFor(tmp[0], tmp[1], e)
  const fp = pr === 0 ? p : q
  const fo = pr === 0 ? q : p
  // fp · (k a0 + l) + fo · other = 0
  const l = ratSub(ratDiv(ratNeg(ratMul(fo, other)), fp), ratMul(k, a0))
  if (!isInteger(l) || Math.abs(num(l)) > 9) return null
  const none = rng.chance(0.6)
  const cs = [R(rng.int(-6, 7)), R(rng.int(-6, 7))]
  if (!none) {
    // rechte Seiten so, dass p c1 + q c2 = 0
    const m = R(nonzero(rng, -2, 2))
    cs[0] = ratMul(ratAbs(q), m)
    cs[1] = ratMul(ratMul(ratAbs(p), m), R(ratSign(q) < 0 ? 1 : -1))
  }
  const Dn = ratAdd(ratMul(p, cs[0]), ratMul(q, cs[1]))
  if (none === isZero(Dn)) return null
  // Zeilen an einer Stelle a (für die Gegenprobe)
  const rowAt = (a: Rational, r: number): Row => {
    const arr = [ZERO, ZERO]
    arr[w] = r === pr ? ratAdd(ratMul(k, a), l) : other
    arr[e] = be[r]
    return { a: arr, c: cs[r] }
  }
  const at = (a: Rational): [Row, Row] => [rowAt(a, 0), rowAt(a, 1)]
  const vars = XY
  const names = [rn(0), rn(1)]
  const ctx: Ctx = { vars, names, cards: [EQS_CARD.tricks, EQS_CARD.addieren] }
  const pLatex = (kk: Rational, ll: Rational) => termsLatex([[kk, 'a'], [ll, '']])
  const coefLatex = (kk: Rational, ll: Rational, v: string) => (isZero(ll) ? `${term(kk, 'a')}\\,${v}` : `(${pLatex(kk, ll)})\\,${v}`)
  const lineOf = (r: number) => {
    const t: string[] = []
    for (const j of [0, 1]) {
      if (j === w) t.push(r === pr ? coefLatex(k, l, vars[w]) : term(other, vars[w]))
      else t.push(term(be[r], vars[e]))
    }
    return `${join(t)} = ${ratLatex(cs[r])}`
  }
  const lines = [lineOf(0), lineOf(1)]
  const steps: GuidedStep[] = []
  const rows0 = at(ZERO)
  if (!isOne(p) || !isOne(ratAbs(q))) steps.push({ ...factorStep(rng, ctx, rows0, e), question: `Mit welcher Rechnung fällt $${vars[e]}$ weg?\n$${systemLatex(lines, names)}$` })
  // neue Gleichung (P a + P0) w = D
  const P = ratMul(fp, k)
  const P0 = ratAdd(ratMul(fp, l), ratMul(fo, other))
  const op = opLabel(p, q, names[0], names[1])
  const eqLatex = (pa: Rational, p0: Rational, d: Rational) => `${isZero(pa) ? term(p0, vars[w]) : coefLatex(pa, p0, vars[w])} = ${ratLatex(d)}`
  const oneSide = ratAdd(ratMul(R(ratSign(p)), cs[0]), ratMul(R(ratSign(q)), cs[1]))
  const cands: Wrong[] = [
    ...(ratSign(q) < 0
      ? [
          { content: math(eqLatex(P, ratSub(ratMul(fp, l), ratMul(fo, other)), Dn)), rule: 'eqs-sub-sign' },
          { content: math(eqLatex(P, P0, ratSub(ratMul(p, cs[0]), ratMul(q, cs[1])))), rule: 'eqs-sub-sign' },
        ]
      : []),
    ...(ratEq(oneSide, Dn) ? [] : [{ content: math(eqLatex(P, P0, oneSide)), rule: 'eqs-one-side' }]),
    ...(isOne(fp) ? [] : [{ content: math(eqLatex(k, P0, Dn)), rule: 'eqs-factor-term' }]),
  ]
  const correct = math(eqLatex(P, P0, Dn))
  steps.push(
    choiceStep(rng, {
      id: 'addieren',
      title: 'Addieren',
      question: `Rechne $${op}$. Welche Gleichung bleibt?\n$${systemLatex(lines, names)}$`,
      correct,
      wrongs: distinct(correct, rng.shuffle(cands)),
      hint: `Rechne Glied für Glied wie ohne Parameter; vor $${vars[w]}$ steht danach ein Term mit $a$. Die rechte Seite gehört dazu.`,
      explanation: {
        detailed: `Mit $${op}$ fällt $${vars[e]}$ weg. Vor $${vars[w]}$ bleibt $${pLatex(P, P0)}$, rechts $${ratLatex(Dn)}$: $${eqLatex(P, P0, Dn)}$.`,
        short: `$${eqLatex(P, P0, Dn)}$.`,
      },
      established: [eqLatex(P, P0, Dn)],
      cards: [EQS_CARD.addieren, EQS_CARD.tricks],
    }),
  )
  // Sonderwert: P a + P0 = 0
  const show = (x: Rational) => math(`a = ${ratLatex(x)}`)
  const sw: Wrong[] = [
    { content: show(ratNeg(a0)), rule: 'eqs-param-sign' },
    { content: show(ZERO), rule: 'eqs-param-zero' },
    ...(isOne(ratAbs(P)) ? [] : [{ content: show(ratNeg(P0)), rule: 'gauss-divide-forgot' }]),
    ...(isZero(P0) ? [] : [{ content: show(ratDiv(P, ratNeg(P0))), rule: 'gauss-divide-flip' }]),
  ]
  const right = show(a0)
  steps.push(
    choiceStep(rng, {
      id: 'sonderwert',
      title: 'Sonderwert',
      question: `Aus $${eqLatex(P, P0, Dn)}$ willst du durch $${pLatex(P, P0)}$ teilen. Für welches $a$ geht das nicht?`,
      correct: right,
      wrongs: distinct(right, rng.shuffle(sw)),
      hint: `Teilen geht nur durch eine Zahl ungleich $0$. Wann ist $${pLatex(P, P0)} = 0$?`,
      explanation: {
        detailed: `$${pLatex(P, P0)} = 0$ heißt $a = ${ratLatex(a0)}$. Für alle anderen $a$ darfst du teilen und bekommst genau eine Lösung.`,
        short: `$${pLatex(P, P0)} = 0$ für $a = ${ratLatex(a0)}$.`,
      },
      established: [`a = ${ratLatex(a0)}`],
      cards: [EQS_CARD.tricks],
    }),
  )
  const flat: Row = { a: [ZERO, ZERO], c: Dn }
  steps.push(caseStep(rng, flat, `Was gilt für $a = ${ratLatex(a0)}$? Dann heißt die Gleichung $${rowLatex(flat, vars)}$.`, [EQS_CARD.tricks, EQS_CARD.wann], `Für $a = ${ratLatex(a0)}$ steht vor $${vars[w]}$ eine $0$, es bleibt $${rowLatex(flat, vars)}$.`, vars[w]))
  const kase: Case = none ? 'none' : 'inf'
  if (!steps.every((s) => s.choices.length >= (s.id === 'deuten' ? 3 : 4))) return null
  // Schieberegler für a (Schritt 11c): die beiden Geraden an jeder Stelle
  const slider = paramSlider({
    rowsAt: (x) =>
      [0, 1].map((r) => {
        const row = [0, 0, num(cs[r])]
        row[w] = r === pr ? num(k) * x + num(l) : num(other)
        row[e] = num(be[r])
        return row
      }),
    n: 2,
    specials: [num(a0)],
  })
  return {
    kind: 'eqsParam',
    instruction: `Das Gleichungssystem hängt von $a$ ab. Für welches $a$ hat es nicht genau eine Lösung, und was gilt dort? Rechne mit dem ${METHOD_NAME.add}.`,
    functionLatex: systemLatex(lines, names),
    steps,
    cards: [EQS_CARD.tricks, EQS_CARD.addieren],
    resultLatex: `a = ${ratLatex(a0)},\\; \\text{${LGS_CASES[CASE_INDEX[kase]]}}`,
    ...(slider ? { resultDrawing: slider } : {}),
    form: `eqsParam|${w}${pr}|${kase}|${sgn(k)}${isOne(ratAbs(k)) ? 1 : ''}|${sgn(a0)}|${isZero(l) ? 0 : 1}|${be.map(sgn).join('')}|${sgn(other)}`,
    data: { ...dataOf(at(ZERO)), A1: at(ONE).flatMap(nrow), special: [num(a0)] },
    answer: [num(a0), CASE_INDEX[kase]],
  }
}

// ------------------------------------------------------------------ Arten

export const EQS_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['eqsSubst', 'eqsEqual', 'eqsAdd'],
  2: ['eqsSubst', 'eqsEqual', 'eqsAdd'],
  3: ['eqsMessy'],
  4: ['eqsThree', 'eqsRecip'],
  5: ['eqsThree', 'eqsRecip', 'eqsParam'],
}

export const EQS_BUILDERS: Readonly<Record<Extract<VectorKind, `eqs${string}`>, (rng: Rng, level: Level) => Built>> = {
  eqsSubst: (rng, level) => retry(() => buildBasic(rng, level, 'subst')),
  eqsEqual: (rng, level) => retry(() => buildBasic(rng, level, 'equal')),
  eqsAdd: (rng, level) => retry(() => buildBasic(rng, level, 'add')),
  // Fall vor den Versuchen festgelegt (sonst überwiegt der leichter zu bauende)
  eqsMessy: (rng, level) => {
    const kase: Case = rng.pick(['unique', 'unique', 'unique', 'unique', 'none', 'inf'] as const)
    return retry(() => buildMessy(rng, level, kase))
  },
  eqsThree: (rng, level) => retry(() => buildThree(rng, level)),
  eqsRecip: (rng, level) => retry(() => buildRecip(rng, level)),
  eqsParam: (rng) => retry(() => buildParam(rng)),
}
