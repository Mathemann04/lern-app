import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, ONE, ZERO, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub, toDecimalString } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { termsLatex } from './crossTasks.ts'
import type { VectorDrawing } from './figures.ts'
import { elimDrawing, sceneCenter, systemDrawing } from './gaussFigures.ts'
import { type Built, type VectorKind, type Wrong, choiceStep, math } from './taskKit.ts'
import { ratLatex, vecLatex } from './vec.ts'

// Baustein „Gauß-Verfahren“ (M7 Schritt 10a) der Tätigkeit „Matrizen und Gleichungssysteme“: Gleichungssystem als
// Tabelle aufschreiben (erweiterte Koeffizientenmatrix), Spalte für Spalte Nullen unter der Stufe erzeugen (bei 0 oben
// Zeilen tauschen, Kommazahlen vorher wegskalieren), die Stufenform deuten (genau eine, keine oder unendlich viele
// Lösungen) und rückwärts einsetzen, bei unendlich vielen Lösungen mit freien Variablen als Parameter. Alles exakt mit
// Brüchen; die Aufgaben werden rückwärts gebaut (Stufenform, dann gemischt), damit alles ohne Taschenrechner aufgeht.

type Row = readonly Rational[]
type Tab = readonly Row[]
type Case = 'unique' | 'none' | 'inf'
type Fmt = (x: Rational) => string

const R = (k: number) => rat(k)
const num = (x: Rational) => Number(x.n) / Number(x.d)

// Antworten bei „Wie viele Lösungen?“ (auch im freien Modus, vectorFree.ts) und die Fehler je wahrer und gewählter Antwort
export const LGS_CASES = ['genau eine Lösung', 'keine Lösung', 'unendlich viele Lösungen'] as const
const CASE_INDEX: Readonly<Record<Case, number>> = { unique: 0, none: 1, inf: 2 }
export const LGS_CASE_RULES: readonly (readonly string[])[] = [
  ['', 'gauss-unique-none', 'gauss-unique-inf'],
  ['gauss-contradiction-value', '', 'gauss-contradiction-zero'],
  ['gauss-free-missed', 'gauss-zero-row-none', ''],
]

export const GAUSS_CARD = {
  tabelle: 'gauss-tabelle',
  faelle: 'gauss-faelle',
  rueckwaerts: 'gauss-rueckwaerts',
  tricks: 'gauss-tricks',
} as const

const ROMAN = ['I', 'II', 'III', 'IV'] as const
const roman = (i: number) => `\\text{${ROMAN[i]}}`

// ------------------------------------------------------------------ Zahlen und Schreibweisen

// Kommazahl mit deutschem Komma, wenn sie abbricht; sonst Bruch
const decLatex: Fmt = (x) => (isInteger(x) ? ratLatex(x) : (toDecimalString(x)?.replace(',', '{,}') ?? ratLatex(x)))

// Summe aus Zahl mal Buchstabe (Buchstabe '' = Zahl allein), mit eigenem Zahlenformat
function sideLatex(terms: readonly (readonly [Rational, string])[], fmt: Fmt): string {
  const parts = terms.filter(([c]) => !isZero(c))
  if (parts.length === 0) return '0'
  return parts
    .map(([c, x], i) => {
      const abs = ratAbs(c)
      const body = x === '' ? fmt(abs) : isOne(abs) ? x : `${fmt(abs)}${x.startsWith('\\') ? ' ' : ''}${x}`
      const neg = ratSign(c) < 0
      return i === 0 ? `${neg ? '-' : ''}${body}` : ` ${neg ? '-' : '+'} ${body}`
    })
    .join('')
}

// Tabelle mit Kopfzeile (Variablen), Zeilennamen links und Umformungen rechts
function tabLatex(T: Tab, vars: readonly string[], notes: readonly (string | undefined)[] = [], fmt: Fmt = ratLatex): string {
  const n = vars.length
  const withNotes = notes.some(Boolean)
  const spec = `c|${'r'.repeat(n)}|r${withNotes ? 'l' : ''}`
  const head = ` & ${vars.join(' & ')} & ${withNotes ? ' & ' : ''}\\\\ \\hline`
  const rows = T.map((row, i) => `${roman(i)} & ${row.map(fmt).join(' & ')}${withNotes ? ` & ${notes[i] ? `\\quad ${notes[i]}` : ''}` : ''}`)
  return `\\begin{array}{${spec}} ${head} ${rows.join(' \\\\ ')} \\end{array}`
}

// Eine Gleichung, wie sie dasteht: Glieder links und rechts (Variable -1 = Zahl)
type Term = { readonly c: Rational; readonly v: number }
type Shown = { readonly left: readonly Term[]; readonly right: readonly Term[] }
const shownLatex = (s: Shown, vars: readonly string[], fmt: Fmt) => {
  const side = (ts: readonly Term[]) => sideLatex(ts.map((t) => [t.c, t.v < 0 ? '' : vars[t.v]] as const), fmt)
  return `${side(s.left)} = ${side(s.right)}`
}
const standard = (row: Row, n: number): Shown => ({
  left: row.slice(0, n).flatMap((c, v) => (isZero(c) ? [] : [{ c, v }])),
  right: [{ c: row[n], v: -1 }],
})
const systemLatex = (rows: readonly Shown[], vars: readonly string[], fmt: Fmt = ratLatex) =>
  `\\begin{array}{ll} ${rows.map((s, i) => `\\text{${ROMAN[i]}:} & ${shownLatex(s, vars, fmt)}`).join(' \\\\ ')} \\end{array}`

// ------------------------------------------------------------------ exakte Hilfen

const sameTab = (A: Tab, B: Tab) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((x, j) => ratEq(x, B[i][j])))

// reduzierte Stufenform (zum Vergleichen: gleiche Zeilen bis auf Umformungen)
function rref(T: Tab): Rational[][] {
  const M = T.map((r) => [...r])
  const m = M.length
  const w = M[0].length
  let r = 0
  for (let c = 0; c < w && r < m; c++) {
    let p = r
    while (p < m && isZero(M[p][c])) p++
    if (p === m) continue
    ;[M[p], M[r]] = [M[r], M[p]]
    const piv = M[r][c]
    M[r] = M[r].map((x) => ratDiv(x, piv))
    for (let i = 0; i < m; i++) {
      if (i === r || isZero(M[i][c])) continue
      const f = M[i][c]
      M[i] = M[i].map((x, k) => ratSub(x, ratMul(f, M[r][k])))
    }
    r++
  }
  return M
}
// Zeile 0 … 0 | c mit c ≠ 0 in der reduzierten Stufenform
const inconsistent = (A: Tab) => rref(A).some((r) => r.slice(0, -1).every(isZero) && !isZero(r[r.length - 1]))
// gleichwertig: dieselben Zeilen bis auf Umformungen (gleiche reduzierte Stufenform). Ohne Lösung haben alle Tabellen mit
// denselben Zeilen links dieselbe reduzierte Stufenform, egal was rechts steht; dort zählt der Rechenfehler selbst, und
// nur genau dieselbe Tabelle fällt weg (Entscheidung in docs/ENTSCHEIDUNGEN.md, 13.11.2026)
const equivalent = (A: Tab, B: Tab) => (inconsistent(A) || inconsistent(B) ? sameTab(A, B) : sameTab(rref(A), rref(B)))
const rankOf = (vs: readonly (readonly Rational[])[]) => (vs.length === 0 ? 0 : rref(vs).filter((r) => r.some((x) => !isZero(x))).length)

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b))

// ------------------------------------------------------------------ Gauß Schritt für Schritt

// neue Zeile = p · Zeile target − q · Zeile der Stufe
type Op = { readonly target: number; readonly p: Rational; readonly q: Rational }
type Stage =
  | { readonly kind: 'swap'; readonly row: number; readonly other: number; readonly col: number; readonly before: Tab; readonly after: Tab }
  | { readonly kind: 'elim'; readonly row: number; readonly col: number; readonly ops: readonly Op[]; readonly before: Tab; readonly after: Tab }

const combine = (p: Rational, ri: Row, q: Rational, rr: Row): Rational[] => ri.map((x, j) => ratSub(ratMul(p, x), ratMul(q, rr[j])))

// Vielfaches mit ganzer Zahl, sonst über Kreuz (3 · II − 2 · I), vorne immer positiv
function opFor(a: Rational, b: Rational, target: number): Op {
  const k = ratDiv(b, a)
  if (isInteger(k)) return { target, p: ONE, q: k }
  const g = gcd(a.n, b.n)
  const [p, q] = a.n < 0n ? [-a.n / g, -b.n / g] : [a.n / g, b.n / g]
  return { target, p: rat(p), q: rat(q) }
}

function opLabel(o: Op, row: number): string {
  const left = isOne(o.p) ? roman(o.target) : `${ratLatex(o.p)} \\cdot ${roman(o.target)}`
  const k = ratAbs(o.q)
  return `${left} ${ratSign(o.q) < 0 ? '+' : '-'} ${isOne(k) ? '' : `${ratLatex(k)} \\cdot `}${roman(row)}`
}

type RowFn = (p: Rational, ri: Row, q: Rational, rr: Row, col: number) => Rational[]
const applyOps = (M: Tab, row: number, col: number, ops: readonly Op[], f: RowFn): Tab =>
  M.map((r, i) => {
    const o = ops.find((x) => x.target === i)
    return o ? f(o.p, r, o.q, M[row], col) : r
  })

function runGauss(T: Tab, n: number): Stage[] {
  let M: Tab = T
  const m = T.length
  const stages: Stage[] = []
  let r = 0
  for (let c = 0; c < n && r < m; c++) {
    let p = r
    while (p < m && isZero(M[p][c])) p++
    if (p === m) continue
    if (p !== r) {
      const after = M.map((x) => [...x])
      ;[after[p], after[r]] = [after[r], after[p]]
      stages.push({ kind: 'swap', row: r, other: p, col: c, before: M, after })
      M = after
    }
    const ops: Op[] = []
    for (let i = r + 1; i < m; i++) if (!isZero(M[i][c])) ops.push(opFor(M[r][c], M[i][c], i))
    if (ops.length > 0) {
      const after = applyOps(M, r, c, ops, (pp, ri, qq, rr) => combine(pp, ri, qq, rr))
      stages.push({ kind: 'elim', row: r, col: c, ops, before: M, after })
      M = after
    }
    r++
  }
  return stages
}

type Pivot = { readonly row: number; readonly col: number }
// Stufen der Stufenform, Widerspruchszeile, Nullzeilen
function analyze(F: Tab, n: number) {
  const pivots: Pivot[] = []
  let contradiction = -1
  let zeroRows = 0
  F.forEach((row, i) => {
    const col = row.slice(0, n).findIndex((x) => !isZero(x))
    if (col >= 0) pivots.push({ row: i, col })
    else if (!isZero(row[n])) {
      if (contradiction < 0) contradiction = i
    } else zeroRows++
  })
  const kase: Case = contradiction >= 0 ? 'none' : pivots.length === n ? 'unique' : 'inf'
  return { pivots, contradiction, zeroRows, kase }
}

// ------------------------------------------------------------------ rückwärts einsetzen (Werte linear in den Parametern)

type Aff = readonly Rational[]
const affAdd = (a: Aff, b: Aff): Aff => a.map((x, i) => ratAdd(x, b[i]))
const affScale = (k: Rational, a: Aff): Aff => a.map((x) => ratMul(k, x))
const affEq = (a: Aff, b: Aff) => a.every((x, i) => ratEq(x, b[i]))
const affLatex = (a: Aff, params: readonly string[]) => termsLatex([[a[0], ''], ...params.map((p, k) => [a[k + 1], p] as const)])

type SlipKind = 'sign' | 'forgot' | 'coef' | 'flip' | 'sub'
const SLIP_RULE: Readonly<Record<SlipKind, string>> = {
  sign: 'gauss-backsub-sign',
  forgot: 'gauss-divide-forgot',
  coef: 'gauss-backsub-coef',
  flip: 'gauss-divide-flip',
  sub: 'gauss-divide-sub',
}
type Slip = { readonly row: number; readonly kind: SlipKind }

// Werte aller Variablen; mit slip wird eine Zeile falsch aufgelöst (null: Fehler hier nicht möglich oder ohne Wirkung)
function backSolve(F: Tab, n: number, pivots: readonly Pivot[], free: readonly number[], slip?: Slip): Aff[] | null {
  const s = free.length
  const zero: Aff = Array.from({ length: s + 1 }, () => ZERO)
  const vals: Aff[] = Array.from({ length: n }, () => zero)
  free.forEach((j, k) => {
    vals[j] = zero.map((_, i) => (i === k + 1 ? ONE : ZERO))
  })
  for (let k = pivots.length - 1; k >= 0; k--) {
    const { row, col } = pivots[k]
    const a = F[row][col]
    const rest = Array.from({ length: n - col - 1 }, (_, i) => col + 1 + i).filter((j) => !isZero(F[row][j]))
    const sum = rest.reduce((acc, j) => affAdd(acc, affScale(F[row][j], vals[j])), zero)
    const rhs = zero.map((_, i) => (i === 0 ? F[row][n] : ZERO))
    const minus = affAdd(rhs, affScale(R(-1), sum))
    let v = affScale(ratDiv(ONE, a), minus)
    if (slip && slip.row === row) {
      const sumZero = sum.every(isZero)
      switch (slip.kind) {
        case 'sign':
          if (sumZero) return null
          v = affScale(ratDiv(ONE, a), affAdd(rhs, sum))
          break
        case 'forgot':
          if (isOne(a)) return null
          v = minus
          break
        case 'coef': {
          if (!rest.some((j) => !isOne(ratAbs(F[row][j])) && !vals[j].every(isZero))) return null
          const plain = rest.reduce((acc, j) => affAdd(acc, affScale(R(ratSign(F[row][j])), vals[j])), zero)
          v = affScale(ratDiv(ONE, a), affAdd(rhs, affScale(R(-1), plain)))
          break
        }
        case 'flip':
          if (s > 0 || !sumZero || isZero(F[row][n]) || isOne(ratAbs(a))) return null
          v = [ratDiv(a, F[row][n])]
          break
        case 'sub':
          if (s > 0 || !sumZero) return null
          v = [ratSub(F[row][n], a)]
          break
      }
    }
    vals[col] = v
  }
  return vals
}

// ------------------------------------------------------------------ Bau der Tabelle (rückwärts aus der Stufenform)

type Spec = {
  readonly m: number
  readonly n: number
  readonly kase: Case
  readonly pivots: readonly number[]
  readonly swap: boolean
  readonly cross: boolean
  readonly decimals: number
  readonly display: 'eq' | 'tab'
  readonly vars: readonly string[]
}

const nonzero = (rng: Rng, lo: number, hi: number) => {
  for (;;) {
    const k = rng.int(lo, hi)
    if (k !== 0) return k
  }
}

function makeTable(rng: Rng, spec: Spec, level: Level): Tab | null {
  const { m, n, pivots } = spec
  const pool = level <= 2 ? [1, 1, 1, -1, 2] : [1, 1, -1, 2, -2, 3]
  const x0 = Array.from({ length: n }, () => R(rng.int(-3, 4)))
  const E: Rational[][] = Array.from({ length: m }, (_, i) => {
    if (i >= pivots.length) return Array.from({ length: n + 1 }, () => ZERO)
    const pc = pivots[i]
    const row = Array.from({ length: n }, (_, j) => (j < pc ? ZERO : j === pc ? R(i === 0 ? rng.pick([1, 1, 1, -1, 2]) : rng.pick(pool)) : R(rng.int(-3, 3))))
    return [...row, row.reduce((s, c, j) => ratAdd(s, ratMul(c, x0[j])), ZERO)]
  })
  if (spec.kase === 'none') E[pivots.length][n] = R(nonzero(rng, -5, 5))
  // unten links mischen: L (Diagonale 1), Faktoren je Zeile D, beim Tausch eine Zeile ohne Anteil von Zeile I nach oben
  const L = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (i === j ? 1 : j < i ? rng.int(-3, 3) : 0)))
  const D = Array.from({ length: m }, () => (rng.chance(0.3) ? -1 : 1))
  if (spec.cross) {
    const i = rng.int(0, m - 1)
    D[i] *= rng.pick([2, 3, 2])
  }
  let swapWith = -1
  if (spec.swap) {
    swapWith = rng.int(1, m - 1)
    L[swapWith][0] = 0
  }
  let T: Rational[][] = L.map((l, i) => E[0].map((_, k) => l.reduce((s, x, j) => ratAdd(s, ratMul(R(x * D[i]), E[j][k])), ZERO)))
  if (swapWith > 0) [T[0], T[swapWith]] = [T[swapWith], T[0]]
  if (T.some((row) => row.slice(0, n).every(isZero))) return null
  // erste Spalte voll besetzt (beim Tausch: oben 0, sonst nicht 0)
  if (!T.every((row, i) => (spec.swap && i === 0 ? isZero(row[0]) : !isZero(row[0])))) return null
  if (T.some((row) => row.slice(0, n).some((x) => Math.abs(num(x)) > (level <= 2 ? 9 : 12)) || Math.abs(num(row[n])) > 30)) return null
  if (T.flat().filter((x) => ratSign(x) < 0).length < 2) return null
  // keine zwei gleichen Zeilen (sonst sieht man es ohne Rechnung)
  if (T.some((r, i) => T.some((q, k) => k > i && sameTab([r], [q])))) return null
  T = T.map((r) => [...r])
  return T
}

// ------------------------------------------------------------------ Schritte

// center: Mitte der Bilder (Lösung bzw. ein Punkt der Lösungsmenge, Schritt 10b)
type Ctx = { readonly vars: readonly string[]; readonly n: number; readonly center: readonly number[] }
const numsTab = (M: Tab) => M.map((r) => r.map(num))

// Aufstellen der Tabelle aus Gleichungen, wie sie dastehen; falsche aus typischen Abschreibfehlern
function setupShown(rng: Rng, T: Tab, n: number): { shown: Shown[]; wrongs: [Tab, string][] } {
  const m = T.length
  const shown = T.map((r) => standard(r, n))
  const wrongs: [Tab, string][] = []
  const rows = rng.shuffle(Array.from({ length: m }, (_, i) => i))
  const [orderRow, sideRow] = rows
  const constRow = m >= 3 ? rows[2] : orderRow
  const replace = (i: number, row: Row) => T.map((r, k) => (k === i ? row : r))
  // in Reihenfolge des Aufschreibens in die Spalten gefüllt
  const appearance = (ts: readonly Term[], rhs: Rational) => {
    const coefs = ts.filter((t) => t.v >= 0).map((t) => t.c)
    return [...coefs, ...Array.from({ length: n - coefs.length }, () => ZERO), rhs]
  }
  // Reihenfolge vertauscht
  const ord = shown[orderRow].left
  if (ord.length >= 2) {
    let perm = rng.shuffle(ord)
    if (perm.every((t, i) => t.v === ord[i].v)) perm = [...ord].reverse()
    shown[orderRow] = { ...shown[orderRow], left: perm }
    wrongs.push([replace(orderRow, appearance(perm, T[orderRow][n])), 'gauss-setup-order'])
  }
  // ein Glied auf der rechten Seite
  const sl = shown[sideRow].left
  if (sl.length >= 2) {
    const moved = rng.pick(sl)
    shown[sideRow] = { left: sl.filter((t) => t !== moved), right: [{ c: T[sideRow][n], v: -1 }, { c: ratNeg(moved.c), v: moved.v }] }
    wrongs.push([replace(sideRow, T[sideRow].map((x, j) => (j === moved.v ? ratNeg(x) : x))), 'gauss-setup-side'])
  }
  // Zahl auf der linken Seite: … - 5 = 0
  if (!isZero(T[constRow][n]) && constRow !== sideRow) {
    shown[constRow] = { left: [...shown[constRow].left, { c: ratNeg(T[constRow][n]), v: -1 }], right: [{ c: ZERO, v: -1 }] }
    wrongs.push([replace(constRow, T[constRow].map((x, j) => (j === n ? ratNeg(x) : x))), 'gauss-setup-const'])
  }
  // Lücke: fehlende Variable nicht als 0 eingetragen
  for (let i = 0; i < m; i++) {
    if (i === orderRow || i === sideRow) continue
    const gap = T[i].slice(0, n).findIndex((x, j) => isZero(x) && T[i].slice(j + 1, n).some((y) => !isZero(y)))
    if (gap >= 0) {
      wrongs.push([replace(i, appearance(standard(T[i], n).left, T[i][n])), 'gauss-setup-gap'])
      break
    }
  }
  if (m === n) wrongs.push([T.map((r, i) => [...T.map((x) => x[i]), r[n]]), 'gauss-setup-transposed'])
  return { shown, wrongs }
}

function tableWrongs(right: Tab, cands: readonly (readonly [Tab, string])[], ctx: Ctx, notes: readonly (string | undefined)[] = [], fmt: Fmt = ratLatex): Wrong[] {
  const out: Wrong[] = []
  const seen: Tab[] = [right]
  for (const [W, rule] of cands) {
    if (seen.some((S) => sameTab(S, W)) || equivalent(W, right)) continue
    seen.push(W)
    out.push({ content: math(tabLatex(W, ctx.vars, notes, fmt)), rule })
  }
  return out
}

function setupStep(rng: Rng, T: Tab, wrongs: readonly [Tab, string][], ctx: Ctx): GuidedStep {
  return choiceStep(rng, {
    id: 'tabelle',
    title: 'Tabelle aufstellen',
    question: 'Wie lautet die Tabelle (erweiterte Koeffizientenmatrix) zu diesem Gleichungssystem?',
    correct: math(tabLatex(T, ctx.vars)),
    wrongs: tableWrongs(T, rng.shuffle(wrongs), ctx),
    hint: `Bring jede Gleichung in die Form ${ctx.vars.map((v) => `$\\square\\,${v}$`).join(' + ')} $=$ Zahl. Jede Variable hat ihre feste Spalte; fehlt sie, steht dort $0$.`,
    explanation: {
      detailed: `Jede Gleichung wird eine Zeile, jede Variable eine Spalte (${ctx.vars.map((v) => `$${v}$`).join(', ')}), rechts vom Strich steht die Zahl. Glieder auf der rechten Seite wechseln beim Rüberbringen das Vorzeichen, Zahlen auf der linken Seite ebenso. Fehlt eine Variable, steht in ihrer Spalte $0$.`,
      short: 'Jede Variable in ihre Spalte, Zahlen nach rechts, fehlende Variable als $0$.',
    },
    cards: [GAUSS_CARD.tabelle],
  })
}

// Kommazahlen wegskalieren: Zeilen mit 10, 4, 5 oder 2 malnehmen
function scaleStep(rng: Rng, T: Tab, scaled: readonly (readonly [number, Rational])[], ctx: Ctx): GuidedStep {
  const n = ctx.n
  const S = T.map((r, i) => {
    const k = scaled.find(([j]) => j === i)?.[1]
    return k ? r.map((x) => ratDiv(x, k)) : r
  })
  const factor = (i: number) => scaled.find(([j]) => j === i)?.[1]
  const notes = T.map((_, i) => (factor(i) ? `${ratLatex(factor(i)!)} \\cdot ${roman(i)}` : undefined))
  const variant = (f: (x: Rational, j: number, k: Rational, row: Row) => Rational): Tab => S.map((r, i) => (factor(i) ? r.map((x, j) => f(x, j, factor(i)!, r)) : r))
  const first = (row: Row) => row.findIndex((x) => !isZero(x))
  const cands: [Tab, string][] = [
    [variant((x, j, k) => (j === n ? x : ratMul(k, x))), 'gauss-rhs'],
    [variant((x, j, k, row) => (j === first(row) ? ratMul(k, x) : x)), 'gauss-scale-first'],
    [variant((x, _j, k) => (isInteger(x) ? x : ratMul(k, x))), 'gauss-scale-decimals'],
  ]
  const ex = scaled[0]
  return choiceStep(rng, {
    id: 'skalieren',
    title: 'Kommazahlen wegschaffen',
    question: 'Nimm die Gleichungen mit Kommazahlen so mal, dass nur ganze Zahlen dastehen. Wie sieht die Tabelle dann aus?',
    correct: math(tabLatex(T, ctx.vars, notes, decLatex)),
    wrongs: tableWrongs(T, rng.shuffle(cands), ctx, notes, decLatex),
    hint: 'Eine Gleichung darfst du mit einer Zahl (nicht $0$) malnehmen, aber dann jedes Glied, auch die rechte Seite.',
    explanation: {
      detailed: `Mit Kommazahlen verrechnet man sich leicht. Darum zuerst jede Zeile mit Kommazahlen mit einer passenden Zahl malnehmen, zum Beispiel Zeile ${ROMAN[ex[0]]} mit $${ratLatex(ex[1])}$: Aus $${sideLatex(S[ex[0]].slice(0, n).map((c, v) => [c, ctx.vars[v]] as const), decLatex)} = ${decLatex(S[ex[0]][n])}$ wird $${sideLatex(T[ex[0]].slice(0, n).map((c, v) => [c, ctx.vars[v]] as const), ratLatex)} = ${ratLatex(T[ex[0]][n])}$. Jedes Glied wird malgenommen, auch die rechte Seite.`,
      short: 'Jede Zeile mit Kommazahlen ganz malnehmen, auch rechts.',
    },
    cards: [GAUSS_CARD.tricks],
  })
}

function swapStep(rng: Rng, st: Extract<Stage, { kind: 'swap' }>, idx: number, ctx: Ctx): GuidedStep {
  const v = ctx.vars[st.col]
  const correct = `Zeilen ${ROMAN[st.row]} und ${ROMAN[st.other]} tauschen`
  return choiceStep(rng, {
    id: `tausch-${idx}`,
    title: 'Zeilen tauschen',
    question: `In Spalte ${st.col + 1} (bei $${v}$) steht in Zeile ${ROMAN[st.row]} eine $0$, darunter aber nicht. Was tust du?\n$${tabLatex(st.before, ctx.vars)}$`,
    correct,
    wrongs: [
      { content: 'Abbrechen: Das System hat keine Lösung.', rule: 'gauss-zero-pivot-none' },
      { content: `$${v} = 0$ setzen und weiterrechnen`, rule: 'gauss-zero-pivot-zero' },
      { content: `Spalte ${st.col + 1} überspringen${st.col + 1 < ctx.n ? ` und mit Spalte ${st.col + 2} weitermachen` : ''}`, rule: 'gauss-zero-pivot-skip' },
    ],
    hint: 'Die Reihenfolge der Gleichungen ist egal. Hol eine Zeile nach oben, die in dieser Spalte keine $0$ hat.',
    explanation: {
      detailed: `Mit einer $0$ oben lassen sich darunter keine Nullen erzeugen. Weil die Reihenfolge der Gleichungen keine Rolle spielt, tauschst du Zeile ${ROMAN[st.row]} mit Zeile ${ROMAN[st.other]}, die in Spalte ${st.col + 1} keine $0$ hat. Danach geht es normal weiter:\n$${tabLatex(st.after, ctx.vars)}$`,
      short: `Zeile ${ROMAN[st.row]} mit Zeile ${ROMAN[st.other]} tauschen.`,
    },
    established: [`\\text{${ROMAN[st.row]}} \\leftrightarrow \\text{${ROMAN[st.other]}}`],
    cards: [GAUSS_CARD.tricks],
  })
}

function elimStep(rng: Rng, st: Extract<Stage, { kind: 'elim' }>, idx: number, ctx: Ctx, showBefore: boolean): GuidedStep | null {
  const n = ctx.n
  const { row, col, ops, before, after } = st
  const notes = after.map((_, i) => {
    const o = ops.find((x) => x.target === i)
    return o ? opLabel(o, row) : undefined
  })
  const sgn = (q: Rational) => R(ratSign(q))
  const cands: [Tab, string][] = [
    [applyOps(before, row, col, ops, (p, ri, q, rr) => combine(p, ri, q, rr).map((x, j) => (j === n ? ri[j] : x))), 'gauss-rhs'],
    [applyOps(before, row, col, ops, (p, ri, q, rr) => combine(p, ri, q, rr).map((x, j) => (j === n ? ratSub(ratMul(p, ri[j]), ratMul(sgn(q), rr[j])) : x))), 'gauss-rhs-multiple'],
    [applyOps(before, row, col, ops, (p, ri, q, rr, c) => ri.map((x, j) => (j === c ? ZERO : ratSub(ratMul(p, x), ratMul(sgn(q), rr[j]))))), 'gauss-first-only'],
  ]
  // Vorzeichenfehler bei einem Eintrag (am liebsten, wo ein Minus abgezogen wird)
  const slips: [number, number][] = []
  for (const o of ops)
    for (let j = col + 1; j <= n; j++) if (!isZero(before[row][j])) slips.push([o.target, j])
  const ranked = rng.shuffle(slips).sort((a, b) => Number(ratSign(ratMul(ops.find((o) => o.target === b[0])!.q, before[row][b[1]])) < 0) - Number(ratSign(ratMul(ops.find((o) => o.target === a[0])!.q, before[row][a[1]])) < 0))
  for (const [t, j] of ranked.slice(0, 2)) {
    const W = after.map((r, i) => (i === t ? r.map((x, k) => (k === j ? ratAdd(ratMul(ops.find((o) => o.target === t)!.p, before[t][k]), ratMul(ops.find((o) => o.target === t)!.q, before[row][k])) : x)) : r))
    cands.push([W, 'gauss-sign'])
  }
  const wrongs = tableWrongs(after, [cands[0], ...rng.shuffle(cands.slice(1))], ctx, notes)
  if (wrongs.length < 3) return null
  const o = ops[0]
  const ri = before[o.target]
  const rr = before[row]
  const pf = isOne(o.p) ? '' : `${ratLatex(o.p)} \\cdot `
  const rhsCalc = `${pf}${ratSign(ri[n]) < 0 && !isOne(o.p) ? `(${ratLatex(ri[n])})` : ratLatex(ri[n])} - ${ratSign(o.q) < 0 ? `(${ratLatex(o.q)})` : ratLatex(o.q)} \\cdot ${ratSign(rr[n]) < 0 ? `(${ratLatex(rr[n])})` : ratLatex(rr[n])} = ${ratLatex(after[o.target][n])}`
  const pivot = before[row][col]
  const crossNote = ops.some((x) => !isOne(x.p)) ? ' Geht das nicht mit einem ganzzahligen Vielfachen, nimmst du über Kreuz mal: Zeile mal Zahl der Stufe, minus Stufenzeile mal Zahl der Zeile.' : ''
  // Bild nach der Antwort: Geraden bzw. Ebenen, die umgeformten drehen sich (Schritt 10b)
  const solvedDrawing = elimDrawing({ before: numsTab(before), after: numsTab(after), row, targets: ops.map((x) => ({ target: x.target, label: opLabel(x, row) })), n, vars: ctx.vars, center: ctx.center })
  const step = choiceStep(rng, {
    id: `spalte-${idx}`,
    title: `Spalte ${col + 1}: Nullen erzeugen`,
    question: `Erzeuge in Spalte ${col + 1} unter der $${ratLatex(pivot)}$ in Zeile ${ROMAN[row]} Nullen. Wie sieht die Tabelle danach aus?${showBefore ? `\n$${tabLatex(before, ctx.vars)}$` : ''}`,
    correct: math(tabLatex(after, ctx.vars, notes)),
    wrongs,
    hint: `Zieh von jeder Zeile darunter so ein Vielfaches von Zeile ${ROMAN[row]} ab, dass in Spalte ${col + 1} eine $0$ entsteht. Rechne jede Zahl der Zeile mit, auch rechts vom Strich.`,
    explanation: {
      detailed: `Umformungen: ${ops.map((x) => `$${opLabel(x, row)}$`).join(', ')}.${crossNote} Jede Zahl der Zeile wird umgerechnet, auch die rechte Seite, zum Beispiel rechts in Zeile ${ROMAN[o.target]}: $${rhsCalc}$.`,
      short: `${ops.map((x) => `$${opLabel(x, row)}$`).join(', ')}, jede Zahl mitrechnen.`,
    },
    cards: [GAUSS_CARD.tabelle],
  })
  return solvedDrawing ? { ...step, solvedDrawing } : step
}

// Stufenform deuten
function caseStep(rng: Rng, F: Tab, info: ReturnType<typeof analyze>, ctx: Ctx): GuidedStep {
  const n = ctx.n
  const { kase, pivots, contradiction, zeroRows } = info
  const zeroRhs = pivots.some((p) => isZero(F[p.row][n]) && F[p.row].slice(0, n).filter((x) => !isZero(x)).length === 1)
  const rules: Readonly<Record<Case, Readonly<Record<Case, string>>>> = {
    unique: { unique: '', none: zeroRhs ? 'gauss-zero-rhs-none' : 'gauss-unique-none', inf: zeroRows > 0 ? 'gauss-zero-row-inf' : 'gauss-unique-inf' },
    none: { unique: 'gauss-contradiction-value', none: '', inf: 'gauss-contradiction-zero' },
    inf: { unique: 'gauss-free-missed', none: zeroRows > 0 ? 'gauss-zero-row-none' : 'gauss-under-none', inf: '' },
  }
  const free = n - pivots.length
  const detailed =
    kase === 'none'
      ? `Zeile ${ROMAN[contradiction]} heißt $${ctx.vars.map((v) => `0 \\cdot ${v}`).join(' + ')} = ${ratLatex(F[contradiction][n])}$, also $0 = ${ratLatex(F[contradiction][n])}$. Das ist ein Widerspruch: Keine Wahl der Variablen erfüllt diese Gleichung. Das System hat keine Lösung.`
      : kase === 'unique'
        ? `Jede der ${n} Variablen hat eine Stufe, und keine Zeile heißt $0 = c$ mit $c \\ne 0$.${zeroRows > 0 ? ' Eine Nullzeile $0 = 0$ ist immer wahr und fällt einfach weg.' : ''}${zeroRhs ? ' Eine $0$ rechts heißt nur, dass diese Variable $0$ ist.' : ''} Also gibt es genau eine Lösung.`
        : `Es bleibt kein Widerspruch, aber nur ${pivots.length} Stufe${pivots.length === 1 ? '' : 'n'} für ${n} Variablen${zeroRows > 0 ? ' (Nullzeilen $0 = 0$ fallen weg)' : ''}. ${free === 1 ? 'Eine Variable ist' : `${free} Variablen sind`} frei wählbar: unendlich viele Lösungen.`
  return choiceStep(rng, {
    id: 'deuten',
    title: 'Stufenform deuten',
    question: `Die Tabelle hat jetzt Stufenform. Wie viele Lösungen hat das System?\n$${tabLatex(F, ctx.vars)}$`,
    correct: LGS_CASES[CASE_INDEX[kase]],
    wrongs: (['unique', 'none', 'inf'] as const).filter((c) => c !== kase).map((c) => ({ content: LGS_CASES[CASE_INDEX[c]], rule: rules[kase][c] })),
    hint: 'Sieh dir die unteren Zeilen an: Steht links nur noch $0$? Dann kommt es auf die Zahl rechts an. Und zähl die Stufen gegen die Zahl der Variablen.',
    explanation: { detailed, short: kase === 'none' ? `$0 = ${ratLatex(F[contradiction][n])}$: Widerspruch, keine Lösung.` : kase === 'unique' ? 'Jede Variable hat eine Stufe, kein Widerspruch.' : `Weniger Stufen als Variablen, kein Widerspruch: ${free} frei.` },
    established: [`\\text{${LGS_CASES[CASE_INDEX[kase]]}}`],
    cards: [GAUSS_CARD.faelle],
  })
}

// freie Variablen wählen: die Spalten ohne Stufe
function freeStep(rng: Rng, F: Tab, pivots: readonly Pivot[], free: readonly number[], params: readonly string[], more: readonly string[], ctx: Ctx): GuidedStep | null {
  const n = ctx.n
  const r = pivots.length
  const cols = (S: readonly number[]) => Array.from({ length: n }, (_, j) => j).filter((j) => !S.includes(j)).map((j) => F.map((row) => row[j]))
  const valid = (S: readonly number[]) => rankOf(cols(S)) === r
  const label = (S: readonly number[], names: readonly string[]) => math(S.map((j, k) => `${ctx.vars[j]} = ${names[k]}`).join(',\\; '))
  const subsets = (k: number, from = 0): number[][] => (k === 0 ? [[]] : Array.from({ length: n - from }, (_, i) => from + i).flatMap((j) => subsets(k - 1, j + 1).map((s) => [j, ...s])))
  const wrongs: Wrong[] = []
  for (const S of rng.shuffle(subsets(free.length))) if (!valid(S)) wrongs.push({ content: label(S, params), rule: 'gauss-free-pivot' })
  const extra = rng.pick(Array.from({ length: n }, (_, j) => j).filter((j) => !free.includes(j)))
  wrongs.splice(1, 0, { content: label([...free, extra].sort((a, b) => a - b), more), rule: 'gauss-free-count' })
  wrongs.splice(1, 0, { content: 'Keine: Jede Variable ist festgelegt.', rule: 'gauss-free-none' })
  if (wrongs.length < 3) return null
  return choiceStep(rng, {
    id: 'frei',
    title: 'Freie Variablen',
    question: `Welche Variablen wählst du frei, wenn du rückwärts einsetzt?\n$${tabLatex(F, ctx.vars)}$`,
    correct: label(free, params),
    wrongs,
    hint: 'Frei sind die Variablen, in deren Spalte keine Stufe beginnt. Ihre Zahl ist Variablen minus Stufen.',
    explanation: {
      detailed: `Stufen beginnen in den Spalten von ${pivots.map((p) => `$${ctx.vars[p.col]}$`).join(', ')}. Die übrigen ${free.map((j) => `$${ctx.vars[j]}$`).join(', ')} haben keine Stufe: Sie sind frei, du setzt ${free.map((j, k) => `$${ctx.vars[j]} = ${params[k]}$`).join(', ')}. Es sind $${n} - ${r} = ${n - r}$. Die Variablen mit Stufe ergeben sich dann Zeile für Zeile von unten.`,
      short: `Spalten ohne Stufe: ${free.map((j, k) => `$${ctx.vars[j]} = ${params[k]}$`).join(', ')}.`,
    },
    established: [free.map((j, k) => `${ctx.vars[j]} = ${params[k]}`).join(',\\; ')],
    cards: [GAUSS_CARD.rueckwaerts],
  })
}

// eine Variable aus ihrer Zeile (rückwärts einsetzen)
function valueStep(rng: Rng, F: Tab, pv: Pivot, vals: readonly Aff[], slipped: readonly (readonly [Aff[], SlipKind])[], params: readonly string[], ctx: Ctx): GuidedStep | null {
  const n = ctx.n
  const { row, col } = pv
  const v = ctx.vars[col]
  const right = vals[col]
  const line = (a: Aff) => math(`${v} = ${affLatex(a, params)}`)
  const wrongs: Wrong[] = []
  const seen: Aff[] = [right]
  for (const [w, kind] of rng.shuffle(slipped)) {
    if (seen.some((s) => affEq(s, w[col]))) continue
    seen.push(w[col])
    wrongs.push({ content: line(w[col]), rule: SLIP_RULE[kind] })
  }
  if (wrongs.length < 3) return null
  const rest = Array.from({ length: n - col - 1 }, (_, i) => col + 1 + i).filter((j) => !isZero(F[row][j]))
  const eq = `${sideLatex(F[row].slice(0, n).map((c, j) => [c, ctx.vars[j]] as const), ratLatex)} = ${ratLatex(F[row][n])}`
  const known = rest.map((j) => `$${ctx.vars[j]} = ${affLatex(vals[j], params)}$`).join(', ')
  const a = F[row][col]
  const sum = rest.reduce((acc, j) => affAdd(acc, affScale(F[row][j], vals[j])), right.map(() => ZERO) as Aff)
  const moved = affAdd(right.map((_, i) => (i === 0 ? F[row][n] : ZERO)), affScale(R(-1), sum))
  const solved = `$${termsLatex([[a, v]])} = ${affLatex(moved, params)}$`
  return choiceStep(rng, {
    id: `wert-${col}`,
    title: 'Rückwärts einsetzen',
    question: `Was ergibt Zeile ${ROMAN[row]} für $${v}$?${known ? ` Bekannt ist schon ${known}.` : ''}\n$${eq}$`,
    correct: line(right),
    wrongs,
    hint: rest.length > 0 ? 'Setz die bekannten Werte ein, bring sie auf die rechte Seite (Vorzeichen wechselt) und teile durch die Zahl vor der gesuchten Variablen.' : 'Teile durch die Zahl vor der Variablen.',
    explanation: {
      detailed: `Zeile ${ROMAN[row]}: $${eq}$.${rest.length > 0 ? ` Mit ${known} und allem Bekannten nach rechts gebracht:` : ''} ${solved}, also $${v} = ${affLatex(right, params)}$.`,
      short: `${solved}, also $${v} = ${affLatex(right, params)}$.`,
    },
    established: [`${v} = ${affLatex(right, params)}`],
    cards: [GAUSS_CARD.rueckwaerts],
  })
}

// ------------------------------------------------------------------ Aufgabe

const paramNames = (rng: Rng) => (rng.chance(0.5) ? ['t', 's', 'r'] : ['\\lambda', '\\mu', '\\nu'])
// k Namen: lateinisch von hinten (t; s, t), griechisch von vorn (λ; λ, μ)
const takeNames = (pool: readonly string[], k: number) => (pool[0] === 't' ? [...pool.slice(0, k)].reverse() : pool.slice(0, k))

function sameAffine(p: Aff, dirs: readonly Aff[], q: Aff, dirs2: readonly Aff[]): boolean {
  const r = rankOf(dirs)
  if (rankOf(dirs2) !== r || rankOf([...dirs, ...dirs2]) !== r) return false
  return rankOf([...dirs, q.map((x, i) => ratSub(x, p[i]))]) === r
}

const solutionLatex = (p: Aff, dirs: readonly Aff[], params: readonly string[]) =>
  `L\\colon \\vec x = ${vecLatex(p)}${dirs.map((d, k) => ` + ${params[k]} ${vecLatex(d)}`).join('')}`

const optional = (resultDrawing: VectorDrawing | undefined) => (resultDrawing ? { resultDrawing } : {})

function buildFrom(rng: Rng, kind: VectorKind, level: Level, spec: Spec): Built | null {
  const T = makeTable(rng, spec, level)
  if (!T) return null
  const { n, vars } = spec
  const ctx: Ctx = { vars, n, center: sceneCenter(numsTab(T), n) }
  const stages = runGauss(T, n)
  if (stages.some((s) => s.after.some((r) => r.some((x) => !isInteger(x) || Math.abs(num(x)) > (level <= 3 ? 30 : 40))))) return null
  if (spec.swap !== stages.some((s) => s.kind === 'swap')) return null
  // getauscht wird nur, wo oben noch eine Variable steht (nicht bei 0 … 0 | c: dort ist schon alles entschieden)
  if (stages.some((s) => s.kind === 'swap' && s.before[s.row].slice(0, n).every(isZero))) return null
  const crossUsed = stages.some((s) => s.kind === 'elim' && s.ops.some((o) => !isOne(o.p)))
  if (crossUsed !== spec.cross) return null
  const F = stages.length > 0 ? stages[stages.length - 1].after : T
  const info = analyze(F, n)
  if (info.kase !== spec.kase || info.pivots.map((p) => p.col).join() !== spec.pivots.join()) return null
  const steps: GuidedStep[] = []
  let functionLatex: string
  // Angabe: Gleichungen (mit Aufstellen oder Wegskalieren) oder gleich die Tabelle
  if (spec.decimals > 0) {
    const rows = rng.shuffle(T.map((_, i) => i)).slice(0, spec.decimals)
    const scaled: [number, Rational][] = []
    for (const i of rows) {
      const ks = rng.shuffle([10, 2, 4, 5]).map(R)
      const k = ks.find((kk) => {
        const S = T[i].map((x) => ratDiv(x, kk))
        return S.some((x) => !isInteger(x)) && S.slice(0, n).some((x) => isInteger(x) && !isZero(x))
      })
      if (!k) return null
      scaled.push([i, k])
    }
    scaled.sort((a, b) => a[0] - b[0])
    const S = T.map((r, i) => {
      const k = scaled.find(([j]) => j === i)?.[1]
      return k ? r.map((x) => ratDiv(x, k)) : r
    })
    functionLatex = systemLatex(S.map((r) => standard(r, n)), vars, decLatex)
    steps.push(scaleStep(rng, T, scaled, ctx))
  } else if (spec.display === 'eq') {
    const { shown, wrongs } = setupShown(rng, T, n)
    functionLatex = systemLatex(shown, vars)
    steps.push(setupStep(rng, T, wrongs, ctx))
  } else functionLatex = tabLatex(T, vars)
  let idx = 0
  for (const st of stages) {
    idx++
    if (st.kind === 'swap') steps.push(swapStep(rng, st, idx, ctx))
    else {
      // steht die Tabelle schon als Aufgabe da, nicht noch einmal zeigen
      const step = elimStep(rng, st, idx, ctx, steps.length > 0)
      if (!step) return null
      steps.push(step)
    }
  }
  steps.push(caseStep(rng, F, info, ctx))
  const cards = [GAUSS_CARD.tabelle, GAUSS_CARD.faelle]
  const formBase = `${kind}|${T.length}x${n}|${spec.kase}|${spec.pivots.join('')}|${spec.decimals > 0 ? 'd' : spec.display}|${spec.swap ? 's' : ''}${spec.cross ? 'c' : ''}|${vars[0]}|${T.map((r) => r.map((x) => '0+-'[(ratSign(x) + 3) % 3]).join('')).join(',')}`
  const data = { T: T.flat().map(num), m: [T.length], n: [n] }
  if (spec.kase === 'none')
    return {
      kind,
      instruction: 'Löse das Gleichungssystem mit dem Gauß-Verfahren.',
      functionLatex,
      steps,
      cards,
      resultLatex: `\\text{${LGS_CASES[1]}}`,
      ...optional(systemDrawing({ T: numsTab(T), n, solution: null })),
      form: formBase,
      data,
      answer: [1],
    }
  // rückwärts einsetzen
  const free = Array.from({ length: n }, (_, j) => j).filter((j) => !info.pivots.some((p) => p.col === j))
  const pool = paramNames(rng)
  const params = takeNames(pool, free.length)
  const vals = backSolve(F, n, info.pivots, free)!
  if (vals.some((a) => a.some((x) => !isInteger(x) || Math.abs(num(x)) > 12))) return null
  const slips: Slip[] = info.pivots.flatMap((p) => (['sign', 'forgot', 'coef', 'flip', 'sub'] as const).map((k) => ({ row: p.row, kind: k })))
  const slipped = slips.flatMap((s) => {
    const v = backSolve(F, n, info.pivots, free, s)
    return v ? [[v, s.kind, s.row] as const] : []
  })
  if (spec.kase === 'inf') {
    const fs = freeStep(rng, F, info.pivots, free, params, takeNames(pool, free.length + 1), ctx)
    if (fs) steps.push(fs)
  }
  // die unteren Stufen einzeln (höchstens zwei), die oberen zusammen in der Lösung
  const singles = info.pivots.slice(1).slice(-2).reverse()
  const shownRows = new Set<number>()
  for (const pv of singles) {
    const st = valueStep(
      rng,
      F,
      pv,
      vals,
      slipped.filter(([, , row]) => row === pv.row).map(([v, k]) => [v, k] as const),
      params,
      ctx,
    )
    if (st) {
      steps.push(st)
      shownRows.add(pv.row)
    }
  }
  // was keinen eigenen Schritt bekommt (zu wenige falsche Antworten), rechnet die Lösung mit, von unten nach oben
  const rest = info.pivots.filter((p) => !shownRows.has(p.row)).reverse()
  const restNames = rest.map((p) => `$${vars[p.col]}$`)
  const restWords = restNames.length === 1 ? restNames[0] : `${restNames.slice(0, -1).join(', ')} und ${restNames[restNames.length - 1]}`
  const restAsk = shownRows.size > 0 ? `Setz die bekannten Werte oben ein und rechne ${restWords} aus.` : `Rechne von unten nach oben ${restWords} aus.`
  if (spec.kase === 'unique') {
    const x = vals.map((a) => a[0])
    const right = math(`\\vec x = ${vecLatex(x)}`)
    const cands: [Rational[], string][] = rng.shuffle(slipped.map(([v, k]) => [v.map((a) => a[0]), SLIP_RULE[k]] as [Rational[], string]))
    // die Zeilen, die erst hier aufgelöst werden, zuerst
    cands.sort((a, b) => Number(!rest.some((p) => !ratEq(a[0][p.col], x[p.col]))) - Number(!rest.some((p) => !ratEq(b[0][p.col], x[p.col]))))
    cands.splice(1, 0, [[...x].reverse(), 'gauss-order'])
    const wrongs: Wrong[] = []
    const seen: Rational[][] = [x]
    for (const [w, rule] of cands) {
      if (seen.some((s) => s.every((y, i) => ratEq(y, w[i])))) continue
      seen.push(w)
      wrongs.push({ content: math(`\\vec x = ${vecLatex(w)}`), rule })
    }
    if (wrongs.length < 3) return null
    steps.push(
      choiceStep(rng, {
        id: 'loesung',
        title: 'Lösung',
        question: `${restAsk} Wie lautet die Lösung $\\vec x$?`,
        correct: right,
        wrongs,
        hint: 'Von unten nach oben: In jeder Zeile ist nur noch eine Variable unbekannt. Am Ende in der Reihenfolge der Spalten aufschreiben.',
        explanation: {
          detailed: `${rest.map((p) => `Zeile ${ROMAN[p.row]} ergibt $${vars[p.col]} = ${ratLatex(x[p.col])}$`).join(', ')}. Zusammen, in der Reihenfolge ${vars.map((v) => `$${v}$`).join(', ')}: $\\vec x = ${vecLatex(x)}$. Probe: Jede Gleichung der Aufgabe ist erfüllt.`,
          short: `$\\vec x = ${vecLatex(x)}$.`,
        },
        established: [`\\vec x = ${vecLatex(x)}`],
        cards: [GAUSS_CARD.rueckwaerts],
      }),
    )
    return {
      kind,
      instruction: 'Löse das Gleichungssystem mit dem Gauß-Verfahren.',
      functionLatex,
      steps,
      cards: [...cards, GAUSS_CARD.rueckwaerts],
      resultLatex: `\\vec x = ${vecLatex(x)}`,
      ...optional(systemDrawing({ T: numsTab(T), n, solution: { p: x.map(num), dirs: [] } })),
      form: formBase,
      data,
      answer: x.map(num),
    }
  }
  // unendlich viele: Lösungsmenge mit Parametern
  const split = (vs: readonly Aff[]) => ({ p: vs.map((a) => a[0]), dirs: free.map((_, k) => vs.map((a) => a[k + 1])) })
  const sol = split(vals)
  const right = solutionLatex(sol.p, sol.dirs, params)
  const cands: [Aff, Aff[], string][] = rng.shuffle(slipped.map(([v, k]) => [split(v).p, split(v).dirs, SLIP_RULE[k]] as [Aff, Aff[], string]))
  const noOne = free.map((j, k) => sol.dirs.map((d, kk) => (kk === k ? d.map((x, i) => (i === j ? ZERO : x)) : d)))[0]
  cands.unshift([sol.p, noOne, 'gauss-param-free-one'])
  if (free.length === 1 && sol.p.some((x) => !isZero(x))) cands.splice(1, 0, [sol.dirs[0], [sol.p], 'gauss-param-swap'])
  const wrongs: Wrong[] = []
  const seen: [Aff, Aff[]][] = [[sol.p, sol.dirs]]
  for (const [p, dirs, rule] of cands) {
    if (rankOf(dirs) !== dirs.length || seen.some(([sp, sd]) => sameAffine(sp, sd, p, dirs))) continue
    seen.push([p, dirs])
    wrongs.push({ content: math(solutionLatex(p, dirs, params)), rule })
  }
  if (wrongs.length < 3) return null
  const assign = free.map((j, k) => `$${vars[j]} = ${params[k]}$`).join(', ')
  steps.push(
    choiceStep(rng, {
      id: 'loesung',
      title: 'Lösungsmenge',
      question: `Mit ${assign}: ${restAsk} Schreib dann alle Lösungen als Vektor. Was stimmt?`,
      correct: math(right),
      wrongs,
      hint: `Schreib jede Variable als Zahl plus Vielfache der Parameter, auch die freien (${assign}). Die Zahlen bilden den Stützvektor, die Faktoren vor ${params.map((p) => `$${p}$`).join(' und ')} die Richtungen.`,
      explanation: {
        detailed: `${rest.map((p) => `Zeile ${ROMAN[p.row]} ergibt $${vars[p.col]} = ${affLatex(vals[p.col], params)}$`).join(', ')}. Alle Variablen: ${vars.map((v, j) => `$${v} = ${affLatex(vals[j], params)}$`).join(', ')}. Nach Zahlen und Parametern sortiert: $${right}$. In der Richtung steht bei der freien Variablen eine $1$.`,
        short: `$${right}$.`,
      },
      established: [right],
      cards: [GAUSS_CARD.rueckwaerts],
    }),
  )
  return {
    kind,
    instruction: 'Löse das Gleichungssystem mit dem Gauß-Verfahren.',
    functionLatex,
    steps,
    cards: [...cards, GAUSS_CARD.rueckwaerts],
    resultLatex: right,
    ...optional(systemDrawing({ T: numsTab(T), n, solution: { p: sol.p.map(num), dirs: sol.dirs.map((d) => d.map(num)) } })),
    form: `${formBase}|${params[0]}`,
    data: { ...data, free: free.map((j) => j) },
    answer: [...sol.p, ...sol.dirs.flat()].map(num),
  }
}

// ------------------------------------------------------------------ Arten

// Art der Aufgabe (Fall, Stufen, Tausch …) bleibt für viele Versuche fest, damit die Fälle so oft vorkommen wie geplant;
// nur die Zahlen werden neu gezogen
function retry(make: () => (() => Built | null)): Built {
  for (let round = 0; round < 20; round++) {
    const attempt = make()
    for (let k = 0; k < 400; k++) {
      const built = attempt()
      if (built && built.steps.every((s) => s.choices.length >= 3)) return built
    }
  }
  throw new Error('Gauß: keine Aufgabe mit genug Antworten gefunden')
}

const VARS3 = [
  ['x', 'y', 'z'],
  ['x', 'y', 'z'],
  ['x_1', 'x_2', 'x_3'],
] as const
const VARS4 = ['x_1', 'x_2', 'x_3', 'x_4'] as const

const pickCase = (rng: Rng, weights: readonly Case[]) => rng.pick(weights)

function spec(rng: Rng, kind: VectorKind, level: Level): Spec {
  const display = rng.chance(0.5) ? 'eq' : 'tab'
  const base = { swap: false, cross: false, decimals: 0, display } as const
  switch (kind) {
    case 'gaussTwo': {
      const kase = pickCase(rng, ['unique', 'unique', 'unique', 'none', 'inf'])
      return { ...base, m: 2, n: 2, kase, pivots: kase === 'unique' ? [0, 1] : [0], vars: ['x', 'y'] }
    }
    case 'gaussThree':
    case 'gaussPivot': {
      const kase = pickCase(rng, ['unique', 'unique', 'none', 'inf'])
      return {
        ...base,
        m: 3,
        n: 3,
        kase,
        pivots: kase === 'unique' ? [0, 1, 2] : rng.pick([[0, 1], [0, 1], [0, 2]]),
        swap: kind === 'gaussPivot',
        cross: kind === 'gaussThree' && level >= 3,
        vars: rng.pick(VARS3),
      }
    }
    case 'gaussOver': {
      const kase = pickCase(rng, ['unique', 'unique', 'none'])
      return { ...base, m: 3, n: 2, kase, pivots: [0, 1], cross: rng.chance(0.3), vars: ['x', 'y'] }
    }
    case 'gaussUnder': {
      if (level <= 4) {
        const kase = pickCase(rng, ['inf', 'inf', 'inf', 'none'])
        return { ...base, m: 2, n: 3, kase, pivots: kase === 'none' ? [0] : rng.pick([[0, 1], [0, 2], [0, 1]]), vars: rng.pick(VARS3) }
      }
      const kase = pickCase(rng, ['inf', 'inf', 'inf', 'none'])
      return {
        ...base,
        m: 3,
        n: 4,
        kase,
        pivots: kase === 'none' ? rng.pick([[0, 1], [0, 2]]) : rng.pick([[0, 1, 2], [0, 1, 3], [0, 2, 3]]),
        swap: rng.chance(0.3),
        cross: rng.chance(0.4),
        vars: VARS4.slice(),
      }
    }
    case 'gaussPlane': {
      const kase = pickCase(rng, ['inf', 'inf', 'none'])
      return { ...base, m: 3, n: 3, kase, pivots: [0], vars: rng.pick(VARS3) }
    }
    case 'gaussDecimal': {
      const kase = pickCase(rng, ['unique', 'unique', 'none', 'inf'])
      return {
        ...base,
        m: 3,
        n: 3,
        kase,
        pivots: kase === 'unique' ? [0, 1, 2] : rng.pick([[0, 1], [0, 2]]),
        swap: level >= 5 && rng.chance(0.5),
        cross: level >= 5 && rng.chance(0.3),
        decimals: level >= 5 ? 2 : rng.pick([1, 2]),
        display: 'eq',
        vars: rng.pick(VARS3),
      }
    }
    default: {
      // gaussBig: 4 × 4
      const kase = pickCase(rng, ['unique', 'unique', 'none', 'inf'])
      return {
        ...base,
        m: 4,
        n: 4,
        kase,
        pivots: kase === 'unique' ? [0, 1, 2, 3] : rng.pick([[0, 1, 2], [0, 1, 3], [0, 2, 3]]),
        swap: rng.chance(0.3),
        cross: rng.chance(0.3),
        vars: VARS4.slice(),
      }
    }
  }
}

const builder = (kind: Extract<VectorKind, `gauss${string}`>) => (rng: Rng, level: Level) =>
  retry(() => {
    const sp = spec(rng, kind, level)
    return () => buildFrom(rng, kind, level, sp)
  })

export const GAUSS_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['gaussTwo'],
  2: ['gaussThree'],
  3: ['gaussThree', 'gaussPivot', 'gaussOver'],
  4: ['gaussUnder', 'gaussPlane', 'gaussDecimal'],
  5: ['gaussBig', 'gaussUnder', 'gaussDecimal'],
}

export const GAUSS_BUILDERS: Readonly<Record<Extract<VectorKind, `gauss${string}`>, (rng: Rng, level: Level) => Built>> = {
  gaussTwo: builder('gaussTwo'),
  gaussThree: builder('gaussThree'),
  gaussPivot: builder('gaussPivot'),
  gaussOver: builder('gaussOver'),
  gaussUnder: builder('gaussUnder'),
  gaussPlane: builder('gaussPlane'),
  gaussDecimal: builder('gaussDecimal'),
  gaussBig: builder('gaussBig'),
}
