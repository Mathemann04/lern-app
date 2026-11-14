import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type Quad, quadLatex, termsLatex } from './crossTasks.ts'
import { type CramerCtx, detStep, roots, solLatex, sortRats } from './cramerTasks.ts'
import { type Lin, type PMat, DET_CARD, at, det, lin, paramMatrix, polyOf } from './detTasks.ts'
import {
  type Aff,
  type Case,
  type Stage,
  type Tab,
  GAUSS_CARD,
  LGS_CASES,
  LGS_CASE_RULES,
  SLIP_RULE,
  analyze,
  backSolve,
  elimCands,
  equivalent,
  opLabel,
  paramNames,
  rankOf,
  runGauss,
  sameAffine,
  sameTab,
  solutionLatex,
  tabLatex,
} from './gaussTasks.ts'
import { systemDrawing } from './gaussFigures.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex, vecLatex } from './vec.ts'

// Baustein „Gleichungssysteme mit Parameter“ (M7 Schritt 11b, Klausur jedes Jahr) der Tätigkeit „Matrizen und
// Gleichungssysteme“. Zwei Wege wie in der Vorlesung:
// - Gauß mit Parameter: Die Stufen-Spalten haben feste Zahlen, der Parameter $a$ steht nur in der letzten Spalte und
//   rechts. Dann bleibt beim Nullen erzeugen alles ein Polynom in $a$, und die letzte Zeile heißt $q(a)\,z = s(a)$:
//   Für $q(a) \ne 0$ genau eine Lösung, an den Nullstellen von $q$ (Sonderwerte) keine oder unendlich viele, je nachdem,
//   ob $s$ dort $0$ ist. Gebaut rückwärts aus der Stufenform E: T = D · L · E (L unten links ganzzahlig, D ±1).
// - Determinante zuerst ($a$ irgendwo in der Matrix): $\det A$ als Polynom, Sonderwerte einzeln einsetzen und mit Gauß
//   (gaussTasks.ts) auf Stufenform bringen.
// Dazu der Rang von $A$ und $(A \mid \vec b)$, ein zweiter Parameter $b$ rechts, eine Unbekannte mit vorgegebenem Wert
// (mit dem Wert, der wegfällt) und die Lösungsmenge beim Sonderwert (Folgefehler „allgemeine Formel eingesetzt“).

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)

export const LGSP_CARD = {
  gauss: 'lgsp-gauss',
  rang: 'lgsp-rang',
  rechts: 'lgsp-rechts',
} as const

type Case2 = Exclude<Case, 'unique'>
const CASE_INDEX: Readonly<Record<Case, number>> = { unique: 0, none: 1, inf: 2 }

// ------------------------------------------------------------------ Einträge: c0 + c1·a + c2·a² + cb·b

type Poly = readonly [Rational, Rational, Rational, Rational]
type PT = readonly (readonly Poly[])[]
const P = (c0: Rational = ZERO, c1: Rational = ZERO, c2: Rational = ZERO, cb: Rational = ZERO): Poly => [c0, c1, c2, cb]
const PZERO = P()
const pAdd = (p: Poly, q: Poly): Poly => [ratAdd(p[0], q[0]), ratAdd(p[1], q[1]), ratAdd(p[2], q[2]), ratAdd(p[3], q[3])]
const pScale = (k: Rational, p: Poly): Poly => [ratMul(k, p[0]), ratMul(k, p[1]), ratMul(k, p[2]), ratMul(k, p[3])]
const pSub = (p: Poly, q: Poly) => pAdd(p, pScale(R(-1), q))
const pIsZero = (p: Poly) => p.every(isZero)
const pIsConst = (p: Poly) => isZero(p[1]) && isZero(p[2]) && isZero(p[3])
const pEq = (p: Poly, q: Poly) => p.every((x, i) => ratEq(x, q[i]))
const pAt = (p: Poly, a: Rational, b: Rational = ZERO) => ratAdd(ratAdd(p[0], ratMul(p[1], a)), ratAdd(ratMul(p[2], ratMul(a, a)), ratMul(p[3], b)))
// nur a einsetzen, b bleibt
const pAtA = (p: Poly, a: Rational): Poly => P(ratAdd(ratAdd(p[0], ratMul(p[1], a)), ratMul(p[2], ratMul(a, a))), ZERO, ZERO, p[3])
const pQuad = (p: Poly): Quad => ({ q2: p[2], q1: p[1], q0: p[0] })
const quadPoly = (q: Quad): Poly => P(q.q0, q.q1, q.q2)
const fromLin = (x: Lin): Poly => P(x.c0, x.c1)
const pLatex = (p: Poly) => termsLatex([[p[2], 'a^2'], [p[1], 'a'], [p[3], 'b'], [p[0], '']])
const terms = (p: Poly) => p.filter((x) => !isZero(x)).length
const ptAt = (T: PT, a: Rational, b: Rational = ZERO): Tab => T.map((r) => r.map((x) => pAt(x, a, b)))
const samePT = (A: PT, B: PT) => A.length === B.length && A.every((r, i) => r.every((x, j) => pEq(x, B[i][j])))

// Glied „Faktor mal Variable“: 2x, -y, a\,z, -2a\,z, (a - 2)\,z
function termLatex(p: Poly, v: string, first: boolean): string {
  if (pIsZero(p)) return ''
  const sign = (neg: boolean) => (first ? (neg ? '-' : '') : neg ? ' - ' : ' + ')
  if (terms(p) > 1) return `${sign(false)}(${pLatex(p)})\\,${v}`
  const idx = p.findIndex((x) => !isZero(x))
  const c = p[idx]
  const abs = ratAbs(c)
  const mono = ['', 'a', 'a^2', 'b'][idx]
  const body = idx === 0 ? `${isOne(abs) ? '' : ratLatex(abs)}${v}` : `${isOne(abs) ? '' : ratLatex(abs)}${mono}\\,${v}`
  return `${sign(ratSign(c) < 0)}${body}`
}
function equationLatex(row: readonly Poly[], vars: readonly string[]): string {
  const n = vars.length
  let out = ''
  row.slice(0, n).forEach((x, j) => {
    out += termLatex(x, vars[j], out === '')
  })
  return `${out === '' ? '0' : out} = ${pLatex(row[n])}`
}
const ROMAN = ['I', 'II', 'III'] as const
const roman = (i: number) => `\\text{${ROMAN[i]}}`
const systemLatex = (T: PT, vars: readonly string[]) => `\\begin{array}{ll} ${T.map((r, i) => `\\text{${ROMAN[i]}:} & ${equationLatex(r, vars)}`).join(' \\\\ ')} \\end{array}`
const matrixLatex = (T: PT, n: number) =>
  `A = \\begin{pmatrix} ${T.map((r) => r.slice(0, n).map(pLatex).join(' & ')).join(' \\\\ ')} \\end{pmatrix},\\quad \\vec b = \\begin{pmatrix} ${T.map((r) => pLatex(r[n])).join(' \\\\ ')} \\end{pmatrix}`

// Tabelle mit Einträgen in a (und b), Zeilennamen links, Umformungen rechts
function ptabLatex(T: PT, vars: readonly string[], notes: readonly (string | undefined)[] = []): string {
  const n = vars.length
  const withNotes = notes.some(Boolean)
  const head = ` & ${vars.join(' & ')} & ${withNotes ? ' & ' : ''}\\\\ \\hline`
  const rows = T.map((row, i) => `${roman(i)} & ${row.map(pLatex).join(' & ')}${withNotes ? ` & ${notes[i] ? `\\quad ${notes[i]}` : ''}` : ''}`)
  return `\\begin{array}{c|${'r'.repeat(n)}|r${withNotes ? 'l' : ''}} ${head} ${rows.join(' \\\\ ')} \\end{array}`
}

// Polynom in a zerlegt: 2(a - 1)(a + 3), -(a - 2), a(a - 1)
function factoredLatex(q: Quad, rs: readonly Rational[]): string {
  const lead = isZero(q.q2) ? q.q1 : q.q2
  const fac = (r: Rational) => (isZero(r) ? 'a' : `(a ${ratSign(r) > 0 ? '-' : '+'} ${ratLatex(ratAbs(r))})`)
  const body = rs.map(fac).join('')
  const single = rs.length === 1 && !isZero(rs[0])
  if (isOne(lead)) return single ? body.slice(1, -1) : body
  if (isOne(ratNeg(lead))) return `-${body}`
  return `${ratLatex(lead)}${body}`
}

// ------------------------------------------------------------------ Gauß mit Parameter (feste Stufen-Zahlen)

type POp = { readonly target: number; readonly k: Rational }
type PStage = { readonly row: number; readonly col: number; readonly ops: readonly POp[]; readonly before: PT; readonly after: PT }

function runParam(T: PT, n: number): PStage[] | null {
  let M = T
  const stages: PStage[] = []
  for (let c = 0; c < n - 1; c++) {
    const piv = M[c][c]
    if (!pIsConst(piv) || isZero(piv[0])) return null
    const ops: POp[] = []
    for (let i = c + 1; i < M.length; i++) {
      const e = M[i][c]
      if (pIsZero(e)) continue
      if (!pIsConst(e)) return null
      const k = ratDiv(e[0], piv[0])
      if (!isInteger(k)) return null
      ops.push({ target: i, k })
    }
    if (ops.length === 0) continue
    const before = M
    const after = M.map((r, i) => {
      const o = ops.find((x) => x.target === i)
      return o ? r.map((x, j) => pSub(x, pScale(o.k, before[c][j]))) : r
    })
    stages.push({ row: c, col: c, ops, before, after })
    M = after
  }
  return stages
}
const pOpLabel = (o: POp, row: number) => opLabel({ target: o.target, p: ONE, q: o.k }, row)

// zwei Stellen, an denen nichts Besonderes passiert: Dort zeigt Gauß mit Zahlen, ob zwei Tabellen gleichwertig sind
const GENERIC: readonly (readonly [Rational, Rational])[] = [
  [rat(17, 7), rat(-13, 5)],
  [rat(-23, 9), rat(19, 4)],
]
const ptEquivalent = (A: PT, B: PT) => samePT(A, B) || GENERIC.some(([a, b]) => equivalent(ptAt(A, a, b), ptAt(B, a, b)))

// falsche Tabellen zu einer Umformung (wie elimCands in gaussTasks.ts, mit Einträgen in a)
function pCands(rng: Rng, st: PStage, n: number): [PT, string][] {
  const { row, col, ops, before, after } = st
  const apply = (f: (k: Rational, ri: readonly Poly[], rr: readonly Poly[]) => Poly[]): PT =>
    before.map((r, i) => {
      const o = ops.find((x) => x.target === i)
      return o ? f(o.k, r, before[row]) : r
    })
  const sg = (k: Rational) => R(ratSign(k))
  const cands: [PT, string][] = [
    [apply((k, ri, rr) => ri.map((x, j) => (j === n ? x : pSub(x, pScale(k, rr[j]))))), 'gauss-rhs'],
    [apply((k, ri, rr) => ri.map((x, j) => pSub(x, pScale(j === n ? sg(k) : k, rr[j])))), 'gauss-rhs-multiple'],
    [apply((k, ri, rr) => ri.map((x, j) => (j === col ? PZERO : pSub(x, pScale(sg(k), rr[j]))))), 'gauss-first-only'],
  ]
  // Vorzeichenfehler bei einem Eintrag, am liebsten in der Spalte mit a oder rechts
  const slips: [number, number][] = []
  for (const o of ops) for (let j = col + 1; j <= n; j++) if (!pIsZero(before[row][j])) slips.push([o.target, j])
  const ranked = rng.shuffle(slips).sort((p, q) => Number(q[1] >= n - 1) - Number(p[1] >= n - 1))
  for (const [t, j] of ranked.slice(0, 2)) {
    const k = ops.find((o) => o.target === t)!.k
    cands.push([after.map((r, i) => (i === t ? r.map((x, jj) => (jj === j ? pAdd(before[t][jj], pScale(k, before[row][jj])) : x)) : r)), 'gauss-sign'])
  }
  return cands
}

type Sys = { readonly vars: readonly string[]; readonly n: number }

function pElimStep(rng: Rng, st: PStage, idx: number, sys: Sys): GuidedStep | null {
  const { n, vars } = sys
  const { row, col, ops, before, after } = st
  const notes = after.map((_, i) => {
    const o = ops.find((x) => x.target === i)
    return o ? pOpLabel(o, row) : undefined
  })
  const cands = pCands(rng, st, n)
  const wrongs: Wrong[] = []
  const seen: PT[] = [after]
  for (const [W, rule] of [cands[0], ...rng.shuffle(cands.slice(1))]) {
    if (seen.some((S) => samePT(S, W)) || ptEquivalent(W, after)) continue
    seen.push(W)
    wrongs.push({ content: math(ptabLatex(W, vars, notes)), rule })
  }
  if (wrongs.length < 3) return null
  const withA = after.findIndex((r, i) => ops.some((o) => o.target === i) && r.some((x) => !pIsConst(x)))
  const example = withA >= 0 ? withA : ops[0].target
  const o = ops.find((x) => x.target === example)!
  const j = after[example].findIndex((x, jj) => jj > col && !pIsConst(x))
  const jj = j >= 0 ? j : n
  const kAbs = ratAbs(o.k)
  const calc = `${pLatex(before[example][jj]) === '0' ? '0' : `(${pLatex(before[example][jj])})`} ${ratSign(o.k) < 0 ? '+' : '-'} ${isOne(kAbs) ? '' : `${ratLatex(kAbs)} \\cdot `}${pLatex(before[row][jj]).startsWith('-') || terms(before[row][jj]) > 1 ? `(${pLatex(before[row][jj])})` : pLatex(before[row][jj])} = ${pLatex(after[example][jj])}`
  return choiceStep(rng, {
    id: `spalte-${idx}`,
    title: `Spalte ${col + 1}: Nullen erzeugen`,
    question: `Erzeuge in Spalte ${col + 1} unter der $${ratLatex(before[row][col][0])}$ in Zeile ${ROMAN[row]} Nullen. Wie sieht die Tabelle danach aus?\n$${ptabLatex(before, vars)}$`,
    correct: math(ptabLatex(after, vars, notes)),
    wrongs,
    hint: `Zieh von jeder Zeile darunter so ein Vielfaches von Zeile ${ROMAN[row]} ab, dass in Spalte ${col + 1} eine $0$ entsteht. Rechne jede Zahl mit, auch die Einträge mit $a$ und die rechte Seite.`,
    explanation: {
      detailed: `Umformungen: ${ops.map((x) => `$${pOpLabel(x, row)}$`).join(', ')}. Die Stufenzahl $${ratLatex(before[row][col][0])}$ hängt nicht von $a$ ab, darum geht das wie ohne Parameter. Ein Eintrag mit $a$ wird genauso umgerechnet, zum Beispiel in Zeile ${ROMAN[example]}, Spalte ${jj < n ? `von $${vars[jj]}$` : 'rechts'}: $${calc}$.`,
      short: `${ops.map((x) => `$${pOpLabel(x, row)}$`).join(', ')}, jede Zahl mitrechnen.`,
    },
    cards: [LGSP_CARD.gauss, GAUSS_CARD.tabelle],
  })
}

// ------------------------------------------------------------------ Schritte zu den Sonderwerten

const neLatex = (xs: readonly Rational[]) => math(xs.map((r) => `a \\ne ${ratLatex(r)}`).join(',\\; '))
const eqLatex = (xs: readonly Rational[]) => math(solLatex(sortRats(xs)))
const sameSet = (xs: readonly Rational[], ys: readonly Rational[]) => xs.length === ys.length && xs.every((x) => ys.some((y) => ratEq(x, y)))

// Wann genau eine Lösung? src: aus der letzten Zeile der Stufenform (q, s) oder aus der Determinante
type CondSource = { readonly kind: 'row'; readonly q: Quad; readonly rhs: Poly; readonly v: string; readonly table: string; readonly withB: boolean } | { readonly kind: 'det'; readonly D: Quad }
function conditionStep(rng: Rng, src: CondSource, rs: readonly Rational[]): GuidedStep {
  const wrongs: Wrong[] = [
    { content: eqLatex(rs), rule: 'lgsp-cond-flip' },
    { content: 'für alle $a$', rule: 'lgsp-cond-all' },
  ]
  const flipped = sortRats(rs.map(ratNeg))
  const extra: Wrong[] = []
  if (!sameSet(flipped, rs)) extra.push({ content: neLatex(flipped), rule: 'det-root-sign' })
  if (rs.length === 2) for (const r of rng.shuffle([...rs])) extra.push({ content: neLatex([r]), rule: 'lgsp-one-root' })
  if (src.kind === 'row' && !src.withB) {
    const us = roots(pQuad(src.rhs))
    if (us && us.length > 0 && !sameSet(us, rs) && !sameSet(sortRats(us), flipped)) extra.unshift({ content: neLatex(sortRats(us)), rule: 'lgsp-cond-rhs' })
  }
  wrongs.push(...rng.shuffle(extra))
  const poly = src.kind === 'row' ? src.q : src.D
  const zero = rs.map((r) => `$a = ${ratLatex(r)}$`).join(' und ')
  const fact = rs.length > 0 && !(isOne(ratAbs(isZero(poly.q2) ? poly.q1 : poly.q2)) && rs.length === 1) ? ` = ${factoredLatex(poly, rs)}` : ''
  const forB = src.kind === 'row' && src.withB ? ', und zwar für jedes $b$' : ''
  return choiceStep(rng, {
    id: 'bedingung',
    title: 'Genau eine Lösung?',
    question:
      src.kind === 'row'
        ? `Die Stufenform ist fertig. Für welche $a$ hat das System genau eine Lösung${src.withB ? ' (egal, welches $b$)' : ''}?\n$${src.table}$`
        : `Es ist $\\det A = ${quadLatex(src.D, 'a')}$. Für welche $a$ hat das System genau eine Lösung?`,
    correct: neLatex(rs),
    wrongs,
    hint:
      src.kind === 'row'
        ? `Sieh dir die letzte Zeile an: $${src.v}$ hat eine Stufe, solange die Zahl davor nicht $0$ ist.`
        : 'Genau eine Lösung gibt es genau dann, wenn $\\det A \\ne 0$ ist.',
    explanation: {
      detailed:
        src.kind === 'row'
          ? `Die letzte Zeile heißt $${termLatex(quadPoly(src.q), src.v, true)} = ${pLatex(src.rhs)}$. Ist $${quadLatex(src.q, 'a')} \\ne 0$, hat jede Unbekannte eine Stufe: genau eine Lösung${forB}. Es ist $${quadLatex(src.q, 'a')}${fact} = 0$ genau für ${zero}. Das sind die Sonderwerte: Dort fällt die letzte Stufe weg, und es gibt keine oder unendlich viele Lösungen.`
          : `Genau eine Lösung gibt es genau dann, wenn $\\det A \\ne 0$ ist. Es ist $${quadLatex(src.D, 'a')}${fact} = 0$ genau für ${zero}. Für diese Sonderwerte gibt es keine oder unendlich viele Lösungen; welches, zeigt erst Gauß.`,
      short: `$${quadLatex(poly, 'a')}${fact} = 0$ für ${zero}; sonst genau eine Lösung.`,
    },
    established: [rs.map((r) => `a \\ne ${ratLatex(r)}`).join(',\\; ')],
    cards: src.kind === 'row' ? [LGSP_CARD.gauss] : [LGSP_CARD.gauss, DET_CARD.parameter],
  })
}

// Für welche a keine bzw. unendlich viele Lösungen? (die Sonderwerte mit ihrem Fall)
type Special = { readonly r: Rational; readonly kase: Case2; readonly why: string }
function specialStep(rng: Rng, specials: readonly Special[], ask: Case2, question: string, rhsRoots: readonly Rational[] = []): GuidedStep {
  const right = specials.filter((x) => x.kase === ask).map((x) => x.r)
  const others = specials.filter((x) => x.kase !== ask)
  const wrongs: Wrong[] = []
  const add = (xs: readonly Rational[], rule: string) => {
    if (xs.length > 0 && xs.length <= 2 && !sameSet(xs, right)) wrongs.push({ content: eqLatex(xs), rule })
  }
  for (const o of others) {
    const rule = LGS_CASE_RULES[CASE_INDEX[o.kase]][CASE_INDEX[ask]]
    add([o.r], rule)
    if (right.length === 1) add([...right, o.r], rule)
  }
  if (right.length === 2) for (const r of rng.shuffle([...right])) add([r], 'lgsp-one-root')
  const flipped = right.map(ratNeg)
  if (!flipped.some((f) => specials.some((x) => ratEq(x.r, f)))) add(flipped, 'det-root-sign')
  const fromRhs = rhsRoots.filter((u) => !specials.some((x) => ratEq(x.r, u)))
  if (fromRhs.length > 0) add([fromRhs[0]], 'lgsp-cond-rhs')
  // „genau eine Lösung“ mit dem Sonderfall verwechselt: alle a außer den Sonderwerten
  wrongs.push({ content: neLatex(specials.map((x) => x.r)), rule: 'lgsp-cond-flip' })
  const ordered = rng.shuffle(wrongs).sort((p, q) => Number(q.rule.startsWith('gauss')) - Number(p.rule.startsWith('gauss')))
  ordered.splice(Math.min(ordered.length, rng.int(1, 2)), 0, { content: `für kein $a$`, rule: 'lgsp-special-missed' })
  return choiceStep(rng, {
    id: 'sonderfall',
    title: 'Sonderwerte',
    question,
    correct: eqLatex(right),
    wrongs: ordered,
    hint: 'Setz jeden Sonderwert einzeln ein. Heißt die letzte Zeile dann $0 = c$ mit $c \\ne 0$, gibt es keine Lösung; heißt sie $0 = 0$, unendlich viele.',
    explanation: {
      detailed: `${specials.map((x) => x.why).join(' ')} Also ${ask === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'} für $${solLatex(right)}$.`,
      short: specials.map((x) => `$a = ${ratLatex(x.r)}$: ${LGS_CASES[CASE_INDEX[x.kase]]}`).join(', ') + '.',
    },
    established: [solLatex(right)],
    cards: [LGSP_CARD.gauss, GAUSS_CARD.faelle],
  })
}

// Ränge und was daraus folgt (beim Sonderwert: Rang von A ist n − 1)
const rankText = (ra: number, rb: number, c: Case) => `$\\operatorname{rg}(A) = ${ra}$, $\\operatorname{rg}(A \\mid \\vec b) = ${rb}$: ${LGS_CASES[CASE_INDEX[c]]}`
function rankStep(rng: Rng, question: string, kase: Case2, n: number): GuidedStep {
  const k = n - 1
  const wrongs: Wrong[] =
    kase === 'none'
      ? [
          { content: rankText(n, n, 'unique'), rule: 'lgsp-rank-augmented' },
          { content: rankText(k, k, 'inf'), rule: 'lgsp-rank-rhs' },
          { content: rankText(k, n, 'inf'), rule: 'lgsp-rank-unequal' },
        ]
      : [
          { content: rankText(k, k, 'unique'), rule: 'lgsp-rank-full' },
          { content: rankText(k, n, 'none'), rule: 'lgsp-rank-zero-row' },
          { content: rankText(n, n, 'unique'), rule: 'lgsp-rank-rows' },
        ]
  const rb = kase === 'none' ? n : k
  return choiceStep(rng, {
    id: 'rang',
    title: 'Rang',
    question,
    correct: rankText(k, rb, kase),
    wrongs,
    hint: 'Der Rang ist die Zahl der Zeilen der Stufenform, die nicht nur aus Nullen bestehen. Für $A$ zählt nur links vom Strich, für $(A \\mid \\vec b)$ auch rechts.',
    explanation: {
      detailed: `Links vom Strich bleiben ${k} Stufen: $\\operatorname{rg}(A) = ${k}$. ${kase === 'none' ? `Die letzte Zeile ist links eine Nullzeile, rechts aber nicht: Für $(A \\mid \\vec b)$ zählt sie mit, $\\operatorname{rg}(A \\mid \\vec b) = ${n}$. Die Ränge sind verschieden, also ist das System nicht lösbar: keine Lösung.` : `Die letzte Zeile ist auch rechts $0$, sie zählt bei keinem Rang: $\\operatorname{rg}(A \\mid \\vec b) = ${k}$. Die Ränge sind gleich, also lösbar; aber $${k} < ${n}$ Unbekannte, darum ist ${n - k === 1 ? 'eine' : `${n - k}`} frei wählbar: unendlich viele Lösungen.`}`,
      short: kase === 'none' ? `$\\operatorname{rg}(A) = ${k} < \\operatorname{rg}(A \\mid \\vec b) = ${n}$: keine Lösung.` : `$\\operatorname{rg}(A) = \\operatorname{rg}(A \\mid \\vec b) = ${k} < ${n}$: unendlich viele Lösungen.`,
    },
    cards: [LGSP_CARD.rang],
  })
}

// ------------------------------------------------------------------ Bau rückwärts aus der Stufenform

type SymSpec = {
  readonly n: 2 | 3
  readonly cases: readonly Case2[]
  readonly withB: boolean
  readonly paramUpper: boolean
  readonly level: Level
}
type SymSystem = { readonly T: PT; readonly F: PT; readonly stages: readonly PStage[]; readonly rs: readonly Rational[]; readonly cases: readonly Case2[]; readonly q: Quad; readonly s: Quad; readonly beta: Rational }

const nonzero = (rng: Rng, lo: number, hi: number) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}
const mulQ = (p: Quad, l: Quad): Quad => ({ q2: ratAdd(ratMul(p.q1, l.q1), ratAdd(ratMul(p.q2, l.q0), ratMul(p.q0, l.q2))), q1: ratAdd(ratMul(p.q1, l.q0), ratMul(p.q0, l.q1)), q0: ratMul(p.q0, l.q0) })
const linQ = (r: Rational): Quad => ({ q2: ZERO, q1: ONE, q0: ratNeg(r) })
const constQ = (c: Rational): Quad => ({ q2: ZERO, q1: ZERO, q0: c })
const scaleQ = (k: Rational, q: Quad): Quad => ({ q2: ratMul(k, q.q2), q1: ratMul(k, q.q1), q0: ratMul(k, q.q0) })
const quadAtR = (q: Quad, a: Rational) => pAt(quadPoly(q), a)

function makeSym(rng: Rng, spec: SymSpec): SymSystem | null {
  const { n, cases } = spec
  const count = cases.length
  const pool = [-4, -3, -2, -1, 1, 2, 3, 4, 5]
  const rs = sortRats(rng.shuffle(pool).slice(0, count).map(R))
  if (count === 2 && ratEq(ratAbs(rs[0]), ratAbs(rs[1]))) return null
  const c = R(count === 1 ? rng.pick([1, 1, -1, 2, -2, 3]) : rng.pick([1, 1, -1]))
  const q = scaleQ(c, rs.map(linQ).reduce(mulQ, constQ(ONE)))
  // rechte Seite der letzten Zeile: 0 an den Sonderwerten mit unendlich vielen Lösungen, sonst nicht
  const infs = rs.filter((_, i) => cases[i] === 'inf')
  const sigma = R(nonzero(rng, -3, 3))
  let s: Quad
  if (infs.length > 0) s = scaleQ(sigma, infs.map(linQ).reduce(mulQ, constQ(ONE)))
  else if (rng.chance(0.4)) s = constQ(R(nonzero(rng, -6, 6)))
  else s = scaleQ(sigma, linQ(R(rng.int(-4, 5))))
  if (rs.some((r, i) => isZero(quadAtR(s, r)) !== (cases[i] === 'inf'))) return null
  const beta = spec.withB ? R(rng.pick([1, -1, 1, -1, 2, -2])) : ZERO
  // obere Zeilen: feste Stufen, Lösung x0 für alle a
  const small = spec.level <= 2
  const x0 = Array.from({ length: n }, () => R(small ? rng.int(-2, 2) : rng.int(-3, 3)))
  const upperParam = spec.paramUpper ? rng.int(0, n - 2) : -1
  const E: Poly[][] = []
  for (let i = 0; i < n - 1; i++) {
    const row: Poly[] = Array.from({ length: n }, (_, j) => {
      if (j < i) return PZERO
      if (j === i) return P(R(i === 0 ? rng.pick([1, 1, -1, 2, 1]) : rng.pick([1, -1, 2, 1, -2])))
      if (j === n - 1 && i === upperParam) return P(R(rng.int(-2, 2)), R(rng.pick([1, -1])))
      return P(R(small ? rng.int(-2, 2) : rng.int(-3, 3)))
    })
    const rhs = row.reduce((acc, x, j) => pAdd(acc, pScale(x0[j], x)), PZERO)
    E.push([...row, rhs])
  }
  E.push([...Array.from({ length: n - 1 }, () => PZERO), quadPoly(q), P(s.q0, s.q1, s.q2, beta)])
  // unten links mischen (erste Spalte voll besetzt), Zeilen auch mal mit −1
  const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : j === 0 && i > 0 ? (small ? nonzero(rng, -2, 2) : nonzero(rng, -3, 3)) : j < i ? rng.int(-2, 2) : 0)))
  const D = Array.from({ length: n }, () => (rng.chance(0.3) ? -1 : 1))
  const T: PT = L.map((l, i) => E[0].map((_, k) => l.reduce((acc, x, j) => pAdd(acc, pScale(R(x * D[i]), E[j][k])), PZERO)))
  // kleine Zahlen, genug Minus, keine zwei gleichen Zeilen
  const coefs = T.flat()
  if (coefs.some((x) => x.some((y) => Math.abs(num(y)) > 14))) return null
  if (T.some((r) => r.slice(0, n).some((x) => Math.abs(num(x[0])) > (spec.level <= 2 ? 9 : 12)))) return null
  if (T.flat().filter((x) => ratSign(x[0]) < 0).length < 2) return null
  if (T.some((r, i) => T.some((o, k) => k > i && r.every((x, j) => pEq(x, o[j]))))) return null
  const stages = runParam(T, n)
  if (!stages || stages.length !== n - 1) return null
  const F = stages[stages.length - 1].after
  if (stages.some((st) => st.after.some((r) => r.some((x) => x.some((y) => Math.abs(num(y)) > 30))))) return null
  // letzte Zeile: q(a) z = s(a) + β b (bis aufs Vorzeichen wie geplant)
  const last = F[n - 1]
  if (!last.slice(0, n - 1).every(pIsZero)) return null
  const qF = pQuad(last[n - 1])
  const sF: Quad = { q2: last[n][2], q1: last[n][1], q0: last[n][0] }
  const found = roots(qF)
  if (!found || !sameSet(found, rs)) return null
  return { T, F, stages, rs, cases, q: qF, s: sF, beta: last[n][3] }
}

// ------------------------------------------------------------------ Aufgaben

const VARS: Readonly<Record<2 | 3, readonly (readonly string[])[]>> = {
  2: [['x', 'y']],
  3: [['x', 'y', 'z'], ['x', 'y', 'z'], ['x_1', 'x_2', 'x_3']],
}

function shown(rng: Rng, T: PT, vars: readonly string[]) {
  const eq = rng.chance(0.6)
  return { eq, functionLatex: eq ? systemLatex(T, vars) : matrixLatex(T, vars.length), what: eq ? 'Das Gleichungssystem' : 'Das System $A\\vec x = \\vec b$' }
}
const signs = (T: PT) => T.map((r) => r.map((x) => '0+-'[(ratSign(x[0]) + 3) % 3]).join('')).join(',')
const paramMask = (T: PT) => T.map((r) => r.map((x) => (pIsConst(x) ? '' : x[3] && !isZero(x[3]) ? 'b' : isZero(x[2]) ? 'a' : 'q')).join('.')).join(',')
const dataOf = (T: PT) => ({
  T0: T.flat().map((x) => num(x[0])),
  T1: T.flat().map((x) => num(x[1])),
  T2: T.flat().map((x) => num(x[2])),
  TB: T.flat().map((x) => num(x[3])),
  n: [T.length],
})

// Erklärung je Sonderwert aus der letzten Zeile
function rowWhy(sys: SymSystem, r: Rational, kase: Case2, v: string): string {
  const rhs = quadAtR(sys.s, r)
  return `Für $a = ${ratLatex(r)}$ wird die letzte Zeile zu $0 \\cdot ${v} = ${ratLatex(rhs)}$: ${kase === 'none' ? 'ein Widerspruch, keine Lösung.' : `eine Nullzeile, $${v}$ ist frei wählbar, unendlich viele Lösungen.`}`
}

function symSteps(rng: Rng, sys: SymSystem, s: Sys): GuidedStep[] | null {
  const steps: GuidedStep[] = []
  let idx = 0
  for (const st of sys.stages) {
    idx++
    const step = pElimStep(rng, st, idx, s)
    if (!step) return null
    steps.push(step)
  }
  return steps
}

// Stufe 1 und 2 (2 × 2), 2 und 3 (3 × 3): Gauß mit Parameter, für welche a keine bzw. unendlich viele Lösungen
function buildSym(rng: Rng, level: Level, kind: 'lgspTwo' | 'lgspThree', cases: readonly Case2[]): Built | null {
  const n = kind === 'lgspTwo' ? 2 : 3
  const sys = makeSym(rng, { n, cases, withB: false, paramUpper: level >= 3 && rng.chance(0.5), level })
  if (!sys) return null
  const vars = rng.pick(VARS[n])
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const v = vars[n - 1]
  const table = ptabLatex(sys.F, vars)
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table, withB: false }, sys.rs))
  const specials: Special[] = sys.rs.map((r, i) => ({ r, kase: sys.cases[i], why: rowWhy(sys, r, sys.cases[i], v) }))
  const ask = rng.pick(sys.cases)
  if (level >= 3) {
    const i = rng.int(0, sys.rs.length - 1)
    const r = sys.rs[i]
    steps.push(rankStep(rng, `Setz $a = ${ratLatex(r)}$ in die Stufenform ein. Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(ptAt(sys.F, r), vars)}$`, sys.cases[i], n))
  }
  const askText = ask === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'
  steps.push(specialStep(rng, specials, ask, `Für welche $a$ hat das System ${askText}?\n$${table}$`, roots(sys.s) ?? []))
  const disp = shown(rng, sys.T, vars)
  const right = sys.rs.filter((_, i) => sys.cases[i] === ask)
  return {
    kind,
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welche $a$ hat es ${askText}? Rechne mit dem Gauß-Verfahren.`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, ...(level >= 3 ? [LGSP_CARD.rang] : [])],
    resultLatex: solLatex(sortRats(right)),
    form: `${kind}|${disp.eq ? 'eq' : 'mat'}|${sys.cases.join('')}|${ask}|${vars[0]}|${signs(sys.T)}|${paramMask(sys.T)}|${sys.rs.map((r) => ratSign(r)).join('')}`,
    data: { ...dataOf(sys.T), ask: [CASE_INDEX[ask]] },
    answer: sortRats(right).map(num),
  }
}

// Stufe 4 und 5: Parameter b rechts. Für welche a und b unendlich viele Lösungen?
function buildRhs(rng: Rng, level: Level): Built | null {
  const n = level >= 5 || rng.chance(0.5) ? 3 : 2
  const sys = makeSym(rng, { n, cases: ['none'], withB: true, paramUpper: level >= 5 && rng.chance(0.5), level })
  if (!sys || isZero(sys.beta)) return null
  const r = sys.rs[0]
  const sr = quadAtR(sys.s, r)
  const bStar = ratDiv(ratNeg(sr), sys.beta)
  if (!isInteger(bStar) || isZero(bStar) || ratEq(bStar, r) || Math.abs(num(bStar)) > 12) return null
  const vars = rng.pick(VARS[n])
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const v = vars[n - 1]
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table: ptabLatex(sys.F, vars), withB: true }, sys.rs))
  // b beim Sonderwert
  const atR = sys.F.map((row) => row.map((x) => pAtA(x, r)))
  const rhsR = atR[n - 1][n]
  const bWrongs: Wrong[] = []
  const add = (x: Rational, rule: string) => {
    if (!ratEq(x, bStar) && !bWrongs.some((w) => w.content === math(`b = ${ratLatex(x)}`))) bWrongs.push({ content: math(`b = ${ratLatex(x)}`), rule })
  }
  add(ratNeg(bStar), 'lgsp-b-sign')
  if (!isOne(ratAbs(sys.beta))) add(ratNeg(sr), 'lgsp-b-divide')
  bWrongs.push({ content: 'für jedes $b$', rule: 'lgsp-b-ignored' }, { content: 'für kein $b$', rule: 'lgsp-b-none' })
  steps.push(
    choiceStep(rng, {
      id: 'b-wert',
      title: 'Parameter rechts',
      question: `Setz den Sonderwert $a = ${ratLatex(r)}$ ein. Für welches $b$ hat das System dann unendlich viele Lösungen?\n$${ptabLatex(atR, vars)}$`,
      correct: math(`b = ${ratLatex(bStar)}`),
      wrongs: [bWrongs[0], ...rng.shuffle(bWrongs.slice(1))],
      hint: 'Links steht in der letzten Zeile nur noch $0$. Unendlich viele Lösungen gibt es, wenn auch rechts $0$ steht.',
      explanation: {
        detailed: `Für $a = ${ratLatex(r)}$ heißt die letzte Zeile $0 = ${pLatex(rhsR)}$. Sie ist $0 = 0$ genau für $${pLatex(rhsR)} = 0$, also $b = ${ratLatex(bStar)}$: Dann fällt sie weg, $${v}$ ist frei wählbar, und es gibt unendlich viele Lösungen. Für jedes andere $b$ ist sie ein Widerspruch: keine Lösung.`,
        short: `$${pLatex(rhsR)} = 0$ für $b = ${ratLatex(bStar)}$.`,
      },
      established: [`b = ${ratLatex(bStar)}`],
      cards: [LGSP_CARD.rechts],
    }),
  )
  if (level >= 5) {
    const other = ratAdd(bStar, R(rng.pick([1, 2, -1, 3])))
    steps.push(rankStep(rng, `Für $a = ${ratLatex(r)}$ und $b \\ne ${ratLatex(bStar)}$, zum Beispiel $b = ${ratLatex(other)}$: Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(ptAt(sys.F, r, other), vars)}$`, 'none', n))
  }
  const disp = shown(rng, sys.T, vars)
  return {
    kind: 'lgspRhs',
    instruction: `${disp.what} hängt von den Parametern $a$ und $b$ ab. Für welche $a$ und $b$ hat es unendlich viele Lösungen?`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, LGSP_CARD.rechts],
    resultLatex: `a = ${ratLatex(r)},\\; b = ${ratLatex(bStar)}`,
    form: `lgspRhs|${n}|${disp.eq ? 'eq' : 'mat'}|${vars[0]}|${signs(sys.T)}|${paramMask(sys.T)}|${ratSign(r)}${ratSign(bStar)}|${num(sys.beta)}`,
    data: dataOf(sys.T),
    answer: [num(r), num(bStar)],
  }
}

// Stufe 4 und 5: Unbekannte mit vorgegebenem Wert (Stufe 5 oft mit einem Wert, der wegfällt)
function buildTarget(rng: Rng, level: Level, trap: boolean): Built | null {
  const n = level >= 5 || rng.chance(0.6) ? 3 : 2
  const cases: Case2[] = trap ? rng.shuffle(['inf', 'none']) : level >= 5 && rng.chance(0.5) ? ['none', 'none'] : ['none']
  const sys = makeSym(rng, { n, cases, withB: false, paramUpper: level >= 5 && rng.chance(0.4), level })
  if (!sys) return null
  const vars = rng.pick(VARS[n])
  const v = vars[n - 1]
  // Wert c so, dass s(a) = c · q(a) kleine ganze Lösungen hat
  let pick: { c: Rational; valid: Rational[]; excluded: Rational[]; E: Quad } | null = null
  for (const cc of rng.shuffle([-3, -2, -1, 1, 2, 3, 0])) {
    const c = R(cc)
    const E: Quad = { q2: ratSub(sys.s.q2, ratMul(c, sys.q.q2)), q1: ratSub(sys.s.q1, ratMul(c, sys.q.q1)), q0: ratSub(sys.s.q0, ratMul(c, sys.q.q0)) }
    if (isZero(E.q2) && isZero(E.q1)) continue
    const rr = roots(E)
    if (!rr || !rr.every((x) => isInteger(x) && Math.abs(num(x)) <= 9)) continue
    const excluded = rr.filter((x) => sys.rs.some((y) => ratEq(x, y)))
    const valid = rr.filter((x) => !excluded.some((y) => ratEq(x, y)))
    if (valid.length === 0 || (excluded.length > 0) !== trap) continue
    pick = { c, valid, excluded, E }
    break
  }
  if (!pick) return null
  const { c, valid, excluded, E } = pick
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const table = ptabLatex(sys.F, vars)
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table, withB: false }, sys.rs))
  const wrongs: Wrong[] = []
  const add = (xs: Rational[] | null, rule: string) => {
    if (xs && xs.length > 0 && xs.length <= 2 && !sameSet(xs, valid)) wrongs.push({ content: eqLatex(xs), rule })
  }
  if (excluded.length > 0) add([...valid, ...excluded], 'lgsp-excluded')
  if (valid.length === 2) for (const x of rng.shuffle([...valid])) add([x], 'lgsp-one-root')
  const sub = (p: Quad, k: Rational, q: Quad): Quad => ({ q2: ratSub(p.q2, ratMul(k, q.q2)), q1: ratSub(p.q1, ratMul(k, q.q1)), q0: ratSub(p.q0, ratMul(k, q.q0)) })
  const keep = (xs: Rational[] | null) => xs?.filter((x) => !sys.rs.some((y) => ratEq(x, y))) ?? null
  add(isZero(c) ? null : keep(roots(sub(sys.q, c, sys.s))), 'lgsp-target-flip')
  add(keep(roots(sub(sys.s, ONE, constQ(c)))), 'lgsp-target-numerator')
  if (isZero(E.q2)) add([ratDiv(E.q0, E.q1)], 'cramer-solve-sign')
  else add(roots({ q2: E.q2, q1: ratNeg(E.q1), q0: E.q0 }), 'det-root-sign')
  const qL = quadLatex(sys.q, 'a')
  const sL = quadLatex(sys.s, 'a')
  const eqn = isZero(c) ? `${sL} = 0` : `${sL} = ${isOne(c) ? '' : `${ratLatex(c)} \\cdot `}(${qL})`
  const solved = (roots(E) ?? []).map((x) => `$a = ${ratLatex(x)}$`).join(' und ')
  const dropped = excluded.length > 0 ? ` Aber $a = ${ratLatex(excluded[0])}$ ist ein Sonderwert: Dort ist $${qL} = 0$, die letzte Stufe fällt weg, und es gibt keine eindeutige Lösung. Dieser Wert fällt weg.` : ''
  steps.push(
    choiceStep(rng, {
      id: 'vorgabe',
      title: 'Wert vorgegeben',
      question: `Für $a$ ohne die Sonderwerte ist $${v} = \\frac{${sL}}{${qL}}$. Für welche $a$ hat das System genau eine Lösung, und zwar mit $${v} = ${ratLatex(c)}$?`,
      correct: eqLatex(valid),
      wrongs,
      hint: `Setz den Bruch gleich $${ratLatex(c)}$ und nimm mit dem Nenner mal. Prüf am Ende, ob ein Wert ein Sonderwert ist.`,
      explanation: {
        detailed: `$${v} = ${ratLatex(c)}$ heißt $${eqn}$. Zusammengefasst: $${quadLatex(E, 'a')} = 0$, das ergibt ${solved}.${dropped}`,
        short: `$${quadLatex(E, 'a')} = 0$${excluded.length > 0 ? `, ohne $a = ${ratLatex(excluded[0])}$ (Sonderwert)` : ''}: $${solLatex(valid)}$.`,
      },
      established: [solLatex(valid)],
      cards: [LGSP_CARD.rechts],
    }),
  )
  const disp = shown(rng, sys.T, vars)
  return {
    kind: 'lgspTarget',
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welche $a$ hat es genau eine Lösung, und zwar mit $${v} = ${ratLatex(c)}$?`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, LGSP_CARD.rechts],
    resultLatex: solLatex(sortRats(valid)),
    form: `lgspTarget|${n}|${disp.eq ? 'eq' : 'mat'}|${sys.cases.join('')}|${excluded.length}|${valid.length}|${vars[0]}|${ratSign(c)}|${signs(sys.T)}|${paramMask(sys.T)}`,
    data: { ...dataOf(sys.T), k: [n - 1], c: [num(c)] },
    answer: sortRats(valid).map(num),
  }
}

// Stufe 5: alle Fälle, Lösungsmenge beim Sonderwert mit unendlich vielen Lösungen
function buildFull(rng: Rng, level: Level): Built | null {
  const cases: Case2[] = rng.shuffle(['inf', 'none'])
  const sys = makeSym(rng, { n: 3, cases, withB: false, paramUpper: rng.chance(0.5), level })
  if (!sys) return null
  const vars = rng.pick(VARS[3])
  const n = 3
  const v = vars[2]
  const iInf = sys.cases.indexOf('inf')
  const r1 = sys.rs[iInf]
  // Lösungsmenge bei a = r1 (ganze Zahlen)
  const Fr = ptAt(sys.F, r1)
  const info = analyze(Fr, n)
  if (info.kase !== 'inf' || info.pivots.length !== 2) return null
  const free = [2]
  const vals = backSolve(Fr, n, info.pivots, free)!
  if (vals.some((a) => a.some((x) => !isInteger(x) || Math.abs(num(x)) > 12))) return null
  const s: Sys = { vars, n }
  const steps = symSteps(rng, sys, s)
  if (!steps) return null
  const table = ptabLatex(sys.F, vars)
  steps.push(conditionStep(rng, { kind: 'row', q: sys.q, rhs: sys.F[n - 1][n], v, table, withB: false }, sys.rs))
  const specials: Special[] = sys.rs.map((r, i) => ({ r, kase: sys.cases[i], why: rowWhy(sys, r, sys.cases[i], v) }))
  steps.push(specialStep(rng, specials, 'none', `Für welche $a$ hat das System keine Lösung?\n$${table}$`))
  steps.push(rankStep(rng, `Setz $a = ${ratLatex(r1)}$ in die Stufenform ein. Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(Fr, vars)}$`, 'inf', n))
  // Lösungsmenge
  const pool = paramNames(rng)
  const params = [pool[0] === 't' ? 't' : pool[0]]
  const split = (vs: readonly Aff[]) => ({ p: vs.map((a) => a[0]), dirs: [vs.map((a) => a[1])] })
  const sol = split(vals)
  const right = solutionLatex(sol.p, sol.dirs, params)
  const slipped = info.pivots.flatMap((pv) =>
    (['sign', 'forgot', 'coef', 'flip', 'sub'] as const).flatMap((kind) => {
      const w = backSolve(Fr, n, info.pivots, free, { row: pv.row, kind })
      return w ? [[split(w).p, split(w).dirs, SLIP_RULE[kind]] as [Aff, Aff[], string]] : []
    }),
  )
  const cands: [Aff, Aff[], string][] = rng.shuffle(slipped)
  cands.unshift([sol.p, [sol.dirs[0].map((x, i) => (i === 2 ? ZERO : x))], 'gauss-param-free-one'])
  if (sol.p.some((x) => !isZero(x))) cands.splice(1, 0, [sol.dirs[0], [sol.p], 'gauss-param-swap'])
  const wrongs: Wrong[] = []
  // allgemeine Formel beim Sonderwert: gekürzter Bruch für z (Grenzwert s'/q'), dann ein einziger Punkt
  const dq = ratAdd(sys.q.q1, ratMul(R(2), ratMul(sys.q.q2, r1)))
  const ds = ratAdd(sys.s.q1, ratMul(R(2), ratMul(sys.s.q2, r1)))
  if (!isZero(dq)) {
    const zg = ratDiv(ds, dq)
    const point = sol.p.map((x, i) => ratAdd(x, ratMul(zg, sol.dirs[0][i])))
    if (point.every((x) => Math.abs(num(x)) <= 40)) wrongs.push({ content: math(`\\vec x = ${vecLatex(point)}`), rule: 'lgsp-general-formula' })
  }
  const seen: [Aff, Aff[]][] = [[sol.p, sol.dirs]]
  for (const [p, dirs, rule] of cands) {
    if (rankOf(dirs) !== dirs.length || seen.some(([sp, sd]) => sameAffine(sp, sd, p, dirs))) continue
    seen.push([p, dirs])
    wrongs.push({ content: math(solutionLatex(p, dirs, params)), rule })
  }
  if (wrongs.length < 3) return null
  const known = info.pivots.map((pv) => `$${vars[pv.col]} = ${termsLatex([[vals[pv.col][0], ''], [vals[pv.col][1], params[0]]])}$`).reverse().join(', ')
  steps.push(
    choiceStep(rng, {
      id: 'loesung',
      title: 'Lösungsmenge',
      question: `Für $a = ${ratLatex(r1)}$ gibt es unendlich viele Lösungen. Mit $${v} = ${params[0]}$: Wie lautet die Lösungsmenge?\n$${tabLatex(Fr, vars)}$`,
      correct: math(right),
      wrongs: [wrongs[0], ...rng.shuffle(wrongs.slice(1))],
      hint: `Setz den Sonderwert in die Stufenform ein (nicht in die Formel für den allgemeinen Fall). Die Nullzeile fällt weg, $${v} = ${params[0]}$ ist frei; rechne von unten nach oben.`,
      explanation: {
        detailed: `Für $a = ${ratLatex(r1)}$ ist die letzte Zeile $0 = 0$ und fällt weg. Mit $${v} = ${params[0]}$ ergibt sich von unten nach oben ${known}. Als Vektor: $${right}$. Die Formel für $${v}$ aus dem allgemeinen Fall gilt hier nicht, denn sie teilt durch $${quadLatex(sys.q, 'a')}$, und das ist bei $a = ${ratLatex(r1)}$ gleich $0$.`,
        short: `$${right}$.`,
      },
      established: [right],
      cards: [LGSP_CARD.gauss, GAUSS_CARD.rueckwaerts],
    }),
  )
  const disp = shown(rng, sys.T, vars)
  const drawing = systemDrawing({ T: Fr.map((r) => r.map(num)), n, solution: { p: sol.p.map(num), dirs: sol.dirs.map((d) => d.map(num)) } })
  return {
    kind: 'lgspFull',
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Untersuche, für welche $a$ es genau eine, keine oder unendlich viele Lösungen hat, und gib die Lösungsmenge für den Fall mit unendlich vielen Lösungen an.`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, LGSP_CARD.rang],
    resultLatex: right,
    ...(drawing ? { resultDrawing: drawing } : {}),
    form: `lgspFull|${disp.eq ? 'eq' : 'mat'}|${sys.cases.join('')}|${vars[0]}|${params[0]}|${signs(sys.T)}|${paramMask(sys.T)}`,
    data: { ...dataOf(sys.T), inf: [num(r1)] },
    answer: [...sol.p, ...sol.dirs.flat()].map(num),
  }
}

// ------------------------------------------------------------------ Determinante zuerst (a irgendwo in der Matrix)

// Stufenform beim Sonderwert, mit Gauß in Zahlen (Fehler aus der letzten Umformung)
function numericStep(rng: Rng, T: Tab, r: Rational, idx: number, vars: readonly string[]): { step: GuidedStep; F: Tab } | null {
  const n = vars.length
  const stages = runGauss(T, n)
  const lastStage = stages.at(-1)
  if (!lastStage || lastStage.kind !== 'elim') return null
  if (stages.some((st) => st.after.some((row) => row.some((x) => !isInteger(x) || Math.abs(num(x)) > 40)))) return null
  const F = lastStage.after
  const cands = elimCands(rng, lastStage as Extract<Stage, { kind: 'elim' }>, n)
  const wrongs: Wrong[] = []
  const seen: Tab[] = [F]
  for (const [W, rule] of [cands[0], ...rng.shuffle(cands.slice(1))]) {
    if (seen.some((S) => sameTab(S, W)) || equivalent(W, F)) continue
    seen.push(W)
    wrongs.push({ content: math(tabLatex(W, vars)), rule })
  }
  if (wrongs.length < 3) return null
  const ops = stages.flatMap((st) => (st.kind === 'swap' ? [`$\\text{${ROMAN[st.row]}} \\leftrightarrow \\text{${ROMAN[st.other]}}$`] : st.ops.map((o) => `$${opLabel(o, st.row)}$`)))
  return {
    F,
    step: choiceStep(rng, {
      id: `stufenform-${idx}`,
      title: `Sonderwert $a = ${ratLatex(r)}$`,
      question: `Setz $a = ${ratLatex(r)}$ ein und bring die Tabelle mit dem Gauß-Verfahren auf Stufenform. Was kommt heraus?\n$${tabLatex(T, vars)}$`,
      correct: math(tabLatex(F, vars)),
      wrongs,
      hint: 'Jetzt stehen nur noch Zahlen da: Erzeuge Spalte für Spalte Nullen unter den Stufen und rechne jede Zahl mit, auch rechts vom Strich.',
      explanation: {
        detailed: `Mit $a = ${ratLatex(r)}$ ist es ein ganz normales Gleichungssystem. Umformungen: ${ops.join(', ')}. Weil $\\det A = 0$ ist, bleibt in der letzten Zeile links nur $0$ übrig.`,
        short: `${ops.join(', ')}.`,
      },
      cards: [LGSP_CARD.gauss, GAUSS_CARD.tabelle],
    }),
  }
}

// Matrix mit a: 2 × 2 (a an ein oder zwei Stellen) oder 3 × 3 (eine Stelle: det linear; zwei Stellen: paramMatrix)
function paramSystemMatrix(rng: Rng, n: 2 | 3, count: 1 | 2): { A: PMat; rs: Rational[] } | null {
  if (n === 3 && count === 2) {
    const pm = paramMatrix(rng)
    return pm ? { A: pm.M, rs: [...pm.roots] } : null
  }
  const M: Lin[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => lin(R(nonzero(rng, -4, 5)))))
  if (n === 3) M[rng.int(0, 2)][rng.int(0, 2)] = lin(ZERO)
  const spots: (readonly [number, number])[] =
    count === 2 ? [...rng.pick([[[0, 0], [1, 1]], [[0, 1], [1, 0]]] as const)] : [[rng.int(0, n - 1), rng.int(0, n - 1)] as const]
  for (const [i, j] of spots) M[i][j] = lin(R(rng.pick([0, 0, 1, -1, 2, -2])), R(rng.pick([1, 1, -1, 2])))
  const D = polyOf(M, det)
  if (isZero(D.q2) && isZero(D.q1)) return null
  const rs = roots(D)
  if (!rs || rs.length !== count || rs.some((r) => !isInteger(r) || isZero(r) || Math.abs(num(r)) > 6)) return null
  if (count === 2 && ratEq(ratAbs(rs[0]), ratAbs(rs[1]))) return null
  return { A: M, rs }
}

const mulVec = (A: Tab, x: readonly Rational[]) => A.map((r) => r.reduce((acc, a, j) => ratAdd(acc, ratMul(a, x[j])), ZERO))

function buildDet(rng: Rng, level: Level): Built | null {
  const n: 2 | 3 = level >= 4 ? (rng.chance(0.6) ? 3 : 2) : rng.chance(0.5) ? 3 : 2
  const count: 1 | 2 = level >= 4 ? 2 : n === 2 ? (rng.chance(0.5) ? 2 : 1) : 1
  const pm = paramSystemMatrix(rng, n, count)
  if (!pm) return null
  const { A, rs } = pm
  // rechte Seite: an einem Sonderwert lösbar (unendlich viele) oder an keinem
  const wantInf = rng.chance(0.6)
  let b: Rational[]
  if (wantInf) {
    const r = rng.pick(rs)
    b = mulVec(at(A, r), Array.from({ length: n }, () => R(rng.int(-2, 3))))
  } else b = Array.from({ length: n }, () => R(rng.int(-6, 7)))
  if (b.every(isZero) || b.some((x) => Math.abs(num(x)) > 20) || b.filter(isZero).length > 1) return null
  const vars = n === 2 ? ['x', 'y'] : rng.pick(VARS[3])
  const tabAt = (r: Rational): Tab => at(A, r).map((row, i) => [...row, b[i]])
  const caseAt = (r: Rational): Case2 | null => {
    const M = at(A, r)
    const ra = rankOf(M)
    if (ra !== n - 1) return null
    return rankOf(tabAt(r)) === ra ? 'inf' : 'none'
  }
  const cases = rs.map(caseAt)
  if (cases.some((c) => c === null)) return null
  const ctx: CramerCtx = { A, b, n }
  const steps: GuidedStep[] = [detStep(rng, ctx, null, 'det', [LGSP_CARD.gauss, n === 3 ? DET_CARD.sarrus : DET_CARD.zwei])]
  const D = polyOf(A, det)
  steps.push(conditionStep(rng, { kind: 'det', D }, rs))
  const specials: Special[] = []
  const tables: Tab[] = []
  for (const [i, r] of rs.entries()) {
    const res = numericStep(rng, tabAt(r), r, i + 1, vars)
    if (!res) return null
    steps.push(res.step)
    tables.push(res.F)
    const kase = cases[i]!
    const info = analyze(res.F, n)
    if (info.kase !== kase) return null
    const lastRow = res.F[n - 1]
    specials.push({ r, kase, why: `Für $a = ${ratLatex(r)}$ endet die Stufenform mit der Zeile $0 = ${ratLatex(lastRow[n])}$: ${kase === 'none' ? 'ein Widerspruch, keine Lösung.' : 'eine Nullzeile, eine Unbekannte ist frei, unendlich viele Lösungen.'}` })
  }
  if (level >= 4) {
    const i = rng.int(0, rs.length - 1)
    steps.push(rankStep(rng, `Für $a = ${ratLatex(rs[i])}$ hat die Stufenform diese Gestalt. Welche Ränge haben $A$ und $(A \\mid \\vec b)$, und was folgt daraus?\n$${tabLatex(tables[i], vars)}$`, cases[i]!, n))
  }
  const ask = rng.pick(cases as Case2[])
  const askText = ask === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'
  const right = rs.filter((_, i) => cases[i] === ask)
  steps.push(specialStep(rng, specials, ask, `Für welche $a$ hat das System ${askText}?`))
  const T: PT = A.map((row, i) => [...row.map(fromLin), P(b[i])])
  const disp = shown(rng, T, vars)
  return {
    kind: 'lgspDet',
    instruction: `${disp.what} hängt vom Parameter $a$ ab. Für welche $a$ hat es ${askText}? Bestimme zuerst $\\det A$ und untersuche dann die Sonderwerte einzeln.`,
    functionLatex: disp.functionLatex,
    steps,
    cards: [LGSP_CARD.gauss, ...(level >= 4 ? [LGSP_CARD.rang] : [])],
    resultLatex: solLatex(sortRats(right)),
    form: `lgspDet|${n}|${disp.eq ? 'eq' : 'mat'}|${cases.join('')}|${ask}|${vars[0]}|${signs(T)}|${paramMask(T)}`,
    data: { ...dataOf(T), ask: [CASE_INDEX[ask]] },
    answer: sortRats(right).map(num),
  }
}

// ------------------------------------------------------------------ Arten

// Fälle und Größe vor den Versuchen festlegen (sonst überwiegen die leichter zu bauenden)
function retry(make: () => (() => Built | null)): Built {
  for (let round = 0; round < 30; round++) {
    const attempt = make()
    for (let k = 0; k < 300; k++) {
      const built = attempt()
      if (built && built.steps.every((s) => s.choices.length >= 4)) return built
    }
  }
  throw new Error('Gleichungssystem mit Parameter: keine Aufgabe mit genug Antworten gefunden')
}

const symCases = (rng: Rng, level: Level, n: 2 | 3): Case2[] => {
  if (n === 2 || level <= 2) return [rng.pick(['none', 'inf'] as const)]
  return rng.pick([['inf', 'none'], ['none', 'inf'], ['none', 'none'], ['inf', 'inf'], ['inf', 'none']] as const).slice()
}

export const LGSP_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['lgspTwo'],
  2: ['lgspTwo', 'lgspThree'],
  3: ['lgspThree', 'lgspDet'],
  4: ['lgspDet', 'lgspRhs', 'lgspTarget'],
  5: ['lgspFull', 'lgspRhs', 'lgspTarget'],
}

export const LGSP_BUILDERS: Readonly<Record<Extract<VectorKind, `lgsp${string}`>, (rng: Rng, level: Level) => Built>> = {
  lgspTwo: (rng, level) =>
    retry(() => {
      const cases = symCases(rng, level, 2)
      return () => buildSym(rng, level, 'lgspTwo', cases)
    }),
  lgspThree: (rng, level) =>
    retry(() => {
      const cases = symCases(rng, level, 3)
      return () => buildSym(rng, level, 'lgspThree', cases)
    }),
  lgspDet: (rng, level) => retry(() => () => buildDet(rng, level)),
  lgspRhs: (rng, level) => retry(() => () => buildRhs(rng, level)),
  lgspTarget: (rng, level) =>
    retry(() => {
      const trap = level >= 5 && rng.chance(0.5)
      return () => buildTarget(rng, level, trap)
    }),
  lgspFull: (rng, level) => retry(() => () => buildFull(rng, level)),
}
