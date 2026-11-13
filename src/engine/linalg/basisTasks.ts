import type { GuidedStep } from '../guided/types.ts'
import type { Rng } from '../random/rng.ts'
import { type Rational, isInteger, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type DrawArrow, type DrawColor, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Built, type VectorKind, type Wrong, CARD, choiceStep, ints, math, negCount, nums, signShape, zeroCount } from './taskKit.ts'
import { type PVec, type Quad, cross, linLatex, termsLatex } from './crossTasks.ts'
import { bodyDrawing, sarrusOne, sarrusPlus, sarrusStep, spatProduct, tripleQuad } from './spatTasks.ts'
import { type Vec, coefLatex, columnLatex, ratLatex, vec, vecAdd, vecDot, vecLatex, vecName, vecScale } from './vec.ts'

// Baukasten für den Baustein „Linearkombination und Basis" der Tätigkeit „Vektoren" (M7 Schritt 5, docs/PLAN-M7.md):
// Linearkombination bestimmen (kleine Gleichungssysteme Schritt für Schritt: aufstellen, eliminieren, einsetzen, Probe),
// liegt ein Vektor im Spann, linear unabhängig (Determinante 2 × 2 oder Sarrus), Dimension und Basis des Spanns,
// Koordinaten bezüglich einer Basis (Gauß mit drei Unbekannten), Parameter so, dass ein Vektor im Spann liegt, und
// Parameter so, dass drei Vektoren keine Basis sind. Alles exakt (vec.ts). Bilder: Der Spann als Ebene im Raum, beim
// „Abspielen" laufen die Vielfachen aneinander und treffen das Ziel oder verfehlen es.

export const BASIS_KINDS_BY_LEVEL: Readonly<Record<Level, readonly VectorKind[]>> = {
  1: ['basisComb', 'basisIndep'],
  2: ['basisComb', 'basisSpan', 'basisIndep'],
  3: ['basisCoords', 'basisDim', 'basisSpan'],
  4: ['basisCoords', 'basisSpanParam', 'basisParam'],
  5: ['basisSpanParam', 'basisParam'],
}

// Ergebnisse zum Antippen im freien Modus (vectorFree.ts)
export const INDEPENDENCE = ['linear unabhängig', 'linear abhängig'] as const
export const SPAN_ANSWERS = ['im Spann', 'nicht im Spann'] as const

// ------------------------------------------------------------------ Rechnen

const num = (r: Rational) => Number(r.n) / Number(r.d)
const m = ratMul
const R = (n: number) => rat(n)
const sumOf = (xs: readonly Rational[]) => xs.reduce((s, x) => ratAdd(s, x), rat(0))
const fac = (x: string) => (x.startsWith('-') ? `(${x})` : x)

// Zwei Vektoren parallel (auch einer der Nullvektor): alle 2 × 2-Unterdeterminanten 0
function parallel(u: Vec, v: Vec): boolean {
  for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) if (!isZero(ratSub(m(u[i], v[j]), m(u[j], v[i])))) return false
  return true
}
const det2 = (a: Vec, b: Vec, i = 0, j = 1) => ratSub(m(a[i], b[j]), m(a[j], b[i]))
const combine = (ks: readonly Rational[], vs: readonly Vec[]): Vec => vs.reduce((s, v, i) => vecAdd(s, vecScale(ks[i], v)), vs[0].map(() => rat(0)))

function gcdInt(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a
}

// Eine Gleichung: Faktoren vor den Unbekannten, rechte Seite r (+ rt · Parameter)
type Row = { readonly c: readonly Rational[]; readonly r: Rational; readonly rt?: Rational }

// Zeile i der Vektorgleichung k1·v1 + k2·v2 + … = Ziel (rechts optional mit Parameter)
const rowsOf = (vs: readonly Vec[], target: Vec, slope?: Vec): Row[] => target.map((r, i) => ({ c: vs.map((v) => v[i]), r, ...(slope ? { rt: slope[i] } : {}) }))

// a·R1 − b·R2
const rowComb = (a: Rational, R1: Row, b: Rational, R2: Row): Row => ({ c: R1.c.map((x, i) => ratSub(m(a, x), m(b, R2.c[i]))), r: ratSub(m(a, R1.r), m(b, R2.r)) })

// Faktoren, mit denen R1 und R2 malgenommen werden, damit die Unbekannte y wegfällt: f1·R1 − f2·R2 (ggT gekürzt, f1 > 0)
function eliminators(R1: Row, R2: Row, y: number): readonly [Rational, Rational] {
  let [f1, f2] = [R2.c[y], R1.c[y]]
  if (isInteger(f1) && isInteger(f2)) {
    const g = gcdInt(f1.n, f2.n)
    if (g > 1n) [f1, f2] = [rat(f1.n / g), rat(f2.n / g)]
  }
  return ratSign(f1) < 0 ? [ratNeg(f1), ratNeg(f2)] : [f1, f2]
}

// Wert der linken Seite einer Gleichung mit eingesetzten Unbekannten
const lhsValue = (row: Row, xs: readonly Rational[]) => sumOf(row.c.map((c, i) => m(c, xs[i])))

// ------------------------------------------------------------------ LaTeX

const ROMAN = ['I', 'II', 'III', 'IV'] as const
const tag = (label: string) => `\\text{${label}}`

function rowLatex(row: Row, unk: readonly string[], t = 't'): string {
  const lhs = termsLatex(row.c.map((x, i) => [x, unk[i]] as const))
  const rhs = row.rt && !isZero(row.rt) ? linLatex(row.r, row.rt, t) : ratLatex(row.r)
  return `${lhs} = ${rhs}`
}

const systemLatex = (rows: readonly Row[], unk: readonly string[], labels: readonly string[], t = 't') =>
  `\\begin{array}{ll} ${rows.map((r, i) => `${tag(`${labels[i]}:`)} & ${rowLatex(r, unk, t)}`).join(' \\\\ ')} \\end{array}`

// Summe von Produkten Faktor · Wert: 2 \cdot 3 - 1 \cdot (-2)
// (explicit: auch 1 \cdot 2, damit bei der Probe kein „-3 = -3" entsteht)
function productsLatex(pairs: readonly (readonly [Rational, Rational])[], explicit = false): string {
  const used = pairs.filter(([c]) => !isZero(c))
  if (used.length === 0) return '0'
  return used
    .map(([c, v], i) => {
      const body = !explicit && isZero(ratSub(ratAbs(c), rat(1))) ? fac(ratLatex(v)) : `${ratLatex(ratAbs(c))} \\cdot ${fac(ratLatex(v))}`
      const neg = ratSign(c) < 0
      return i === 0 ? `${neg ? '-' : ''}${body}` : ` ${neg ? '-' : '+'} ${body}`
    })
    .join('')
}

// λ \vec a + μ \vec b = \vec v
const combLatex = (unk: readonly string[], names: readonly string[], target: string) => `${names.map((n, i) => `${unk[i]} ${n}`).join(' + ')} = ${target}`
const valuesLatex = (unk: readonly string[], xs: readonly Rational[]) => xs.map((x, i) => `${unk[i]} = ${ratLatex(x)}`).join(',\\; ')

// ------------------------------------------------------------------ Schritte

// Gleichungssystem aus der Vektorgleichung aufstellen
function systemStep(
  rng: Rng,
  o: { readonly names: readonly string[]; readonly vs: readonly Vec[]; readonly target: string; readonly targetLatex: string; readonly rows: readonly Row[]; readonly unk: readonly string[]; readonly t?: string },
): GuidedStep {
  const labels = o.rows.map((_, i) => ROMAN[i])
  const sys = (rows: readonly Row[]) => math(systemLatex(rows, o.unk, labels, o.t))
  const n = o.rows.length
  const swap = (row: Row): Row => ({ ...row, c: row.c.map((_, i) => (i === 0 ? row.c[1] : i === 1 ? row.c[0] : row.c[i])) })
  const wrongs: Wrong[] = []
  // quadratisch: die Einträge eines Vektors in eine Gleichung geschrieben
  if (o.vs.length === n) wrongs.push({ content: sys(o.rows.map((row, i) => ({ ...row, c: o.vs[i] }))), rule: 'vec-lc-transposed' })
  wrongs.push(
    ...rng.shuffle<Wrong>([
      { content: sys(o.rows.map((row) => ({ c: row.c, r: ratNeg(row.r), ...(row.rt ? { rt: ratNeg(row.rt) } : {}) }))), rule: 'vec-lc-target-sign' },
      { content: sys(o.rows.map(swap)), rule: 'vec-lc-swapped' },
      { content: sys(o.rows.map((row) => ({ c: row.c, r: rat(0) }))), rule: 'vec-lc-homogeneous' },
    ]),
  )
  const eq = combLatex(o.unk, o.names, o.target)
  const full = `${o.vs.map((v, i) => `${o.unk[i]} ${vecLatex(v)}`).join(' + ')} = ${o.targetLatex}`
  return choiceStep(rng, {
    id: 'system',
    title: 'Gleichungssystem aufstellen',
    question: `Welches Gleichungssystem gehört zu $${eq}$?`,
    correct: sys(o.rows),
    wrongs,
    hint: `Schreib die Vektorgleichung Zeile für Zeile: In Gleichung (I) stehen die ersten Einträge aller Vektoren, in (II) die zweiten, und so weiter. Vor jedem Eintrag steht der Faktor seines Vektors.`,
    explanation: {
      detailed: `Ausgeschrieben heißt $${eq}$: $${full}$. Jede Zeile ist eine Gleichung: $${systemLatex(o.rows, o.unk, labels, o.t)}$.`,
      short: `Zeile für Zeile: $${systemLatex(o.rows, o.unk, labels, o.t)}$.`,
    },
    cards: [CARD.linearkombination],
  })
}

// Eine Unbekannte (x) aus zwei Gleichungen: die andere (y) fällt durch f1·R1 − f2·R2 weg. Liefert dazu den Wert mit
// vergessener rechter Seite (Folgefehler beim Einsetzen)
function elimValueStep(
  rng: Rng,
  o: { readonly id: string; readonly rows: readonly [Row, Row]; readonly labels: readonly [string, string]; readonly x: number; readonly y: number; readonly unk: readonly string[]; readonly sol: readonly Rational[] },
): GuidedStep {
  const [R1, R2] = o.rows
  const [f1, f2] = eliminators(R1, R2, o.y)
  const row = rowComb(f1, R1, f2, R2)
  const D = row.c[o.x]
  const val = ratDiv(row.r, D)
  const line = (v: Rational) => math(`${o.unk[o.x]} = ${ratLatex(v)}`)
  const rhsForgot = ratDiv(m(f1, R1.r), D)
  const wrongs: Wrong[] = [
    { content: line(rhsForgot), rule: 'vec-gauss-rhs' },
    { content: line(ratDiv(ratAdd(m(f1, R1.r), m(f2, R2.r)), D)), rule: 'vec-gauss-sign' },
    ...rng.shuffle<Wrong>([
      { content: line(o.sol[o.y]), rule: 'vec-lc-swapped' },
      { content: line(ratNeg(val)), rule: 'vec-gauss-sign' },
    ]),
  ]
  const comb = termsLatex([
    [f1, tag(o.labels[0])],
    [ratNeg(f2), tag(o.labels[1])],
  ])
  const dx = termsLatex([[D, o.unk[o.x]]])
  const solved = isZero(ratSub(D, rat(1))) ? '' : `, also $${o.unk[o.x]} = ${ratLatex(val)}$`
  return choiceStep(rng, {
    id: o.id,
    title: `$${o.unk[o.x]}$ bestimmen`,
    question: `Nimm (${o.labels[0]}) und (${o.labels[1]}) so mal, dass $${o.unk[o.y]}$ beim Abziehen wegfällt. Was ergibt sich für $${o.unk[o.x]}$?`,
    correct: line(val),
    wrongs,
    hint: `Bring die Faktoren vor $${o.unk[o.y]}$ auf dieselbe Zahl und zieh die Gleichungen ab, links **und** rechts. Dann bleibt nur $${o.unk[o.x]}$ übrig.`,
    explanation: {
      detailed: `$${rowLatex(R1, o.unk)}$ und $${rowLatex(R2, o.unk)}$. Rechne $${comb}$: Links fällt $${o.unk[o.y]}$ weg, rechts gilt dasselbe: $${productsLatex([[f1, R1.r], [ratNeg(f2), R2.r]])} = ${ratLatex(row.r)}$. Es bleibt $${dx} = ${ratLatex(row.r)}$${solved}.`,
      short: `$${comb}$: $${dx} = ${ratLatex(row.r)}$${solved}.`,
    },
    established: [`${o.unk[o.x]} = ${ratLatex(val)}`],
    cards: [CARD.linearkombination],
  })
}

// In eine Gleichung einsetzen und nach der Unbekannten target auflösen
function backsubStep(
  rng: Rng,
  o: {
    readonly id: string
    readonly row: Row
    readonly label: string
    readonly target: number
    readonly known: readonly (readonly [number, Rational])[]
    readonly unk: readonly string[]
  },
): GuidedStep {
  const ct = o.row.c[o.target]
  const S = sumOf(o.known.map(([j, x]) => m(o.row.c[j], x)))
  const rest = ratSub(o.row.r, S)
  const val = ratDiv(rest, ct)
  const name = o.unk[o.target]
  const line = (v: Rational) => math(`${name} = ${ratLatex(v)}`)
  const wrongs: Wrong[] = []
  if (!isZero(S)) wrongs.push({ content: line(ratDiv(ratAdd(o.row.r, S), ct)), rule: 'vec-backsub-sign' })
  const others: Wrong[] = []
  if (!isZero(ratSub(ct, rat(1)))) others.push({ content: line(rest), rule: 'vec-backsub-divide' })
  if (o.known.length === 1) {
    // bekannten Wert vor den falschen Faktor gesetzt (Faktoren vertauscht)
    const [j, x] = o.known[0]
    if (!isZero(o.row.c[j])) others.push({ content: line(ratDiv(ratSub(o.row.r, m(ct, x)), o.row.c[j])), rule: 'vec-lc-swapped' })
  }
  if (o.known.length === 2) {
    const [[j1, x1], [j2, x2]] = o.known
    const swapped = ratAdd(m(o.row.c[j1], x2), m(o.row.c[j2], x1))
    others.push({ content: line(ratDiv(ratSub(o.row.r, swapped), ct)), rule: 'vec-lc-swapped' })
  }
  wrongs.push(...rng.shuffle(others))
  const knownText = o.known.map(([j, x]) => `$${o.unk[j]} = ${ratLatex(x)}$`).join(' und ')
  const knownPairs = o.known.filter(([j]) => !isZero(o.row.c[j])).map(([j, x]) => [o.row.c[j], x] as const)
  const targetTerm = termsLatex([[ct, name]])
  const lhs = knownPairs.length ? `${productsLatex(knownPairs)} ${ratSign(ct) < 0 ? '-' : '+'} ${termsLatex([[ratAbs(ct), name]])}` : targetTerm
  const after = isZero(ratSub(ct, rat(1))) ? '' : ` und $${name} = ${ratLatex(val)}$`
  return choiceStep(rng, {
    id: o.id,
    title: `$${name}$ einsetzen`,
    question: `Setze ${knownText} in (${o.label}) ein. Was ergibt sich für $${name}$?`,
    correct: line(val),
    wrongs,
    hint: `Einsetzen, die bekannten Zahlen ausrechnen und auf die andere Seite bringen (mit umgedrehtem Vorzeichen), dann durch den Faktor vor $${name}$ teilen.`,
    explanation: {
      detailed: `(${o.label}): $${rowLatex(o.row, o.unk)}$. Eingesetzt: $${lhs} = ${ratLatex(o.row.r)}$, also $${targetTerm} = ${ratLatex(rest)}$${after}.`,
      short: `$${targetTerm} = ${ratLatex(rest)}$${after}.`,
    },
    established: [`${name} = ${ratLatex(val)}`],
    cards: [CARD.linearkombination],
  })
}

// Probe in den übrigen Gleichungen; mode 'span' schließt daraus, ob das Ziel im Spann liegt
function probeStep(
  rng: Rng,
  o: { readonly rows: readonly Row[]; readonly labels: readonly string[]; readonly xs: readonly [Rational, Rational]; readonly unk: readonly string[]; readonly target: string; readonly mode: 'span' | 'check' },
): GuidedStep {
  const verdict = (xs: readonly [Rational, Rational], flip: boolean) => {
    let all = true
    const parts = o.rows.map((row, i) => {
      const pairs = row.c.map((c, j) => [c, xs[j]] as const)
      let value = lhsValue(row, xs)
      let shown = productsLatex(pairs, true)
      // ein Produkt mit falschem Vorzeichen (das erste, das nicht 0 ist)
      if (flip && i === 0) {
        const k = pairs.findIndex(([c, x]) => !isZero(m(c, x)))
        if (k >= 0) {
          value = ratSub(value, m(rat(2), m(pairs[k][0], pairs[k][1])))
          shown = productsLatex(pairs.map(([c, x], j) => (j === k ? ([ratNeg(c), x] as const) : ([c, x] as const))), true)
        }
      }
      const ok = isZero(ratSub(value, row.r))
      all &&= ok
      return ok ? `(${o.labels[i]}): $${shown} = ${ratLatex(value)}$ stimmt` : `(${o.labels[i]}): $${shown} = ${ratLatex(value)} \\ne ${ratLatex(row.r)}$, stimmt nicht`
    })
    const end = o.mode === 'span' ? (all ? ` Also liegt $${o.target}$ im Spann.` : ` Also liegt $${o.target}$ nicht im Spann.`) : all ? '' : ' Also gibt es keine Lösung.'
    return { text: `${parts.join('; ')}.${end}`, all }
  }
  const right = verdict(o.xs, false)
  const wrongs: Wrong[] = []
  if (o.mode === 'span' && !right.all) wrongs.push({ content: `Keine Probe nötig: $${o.unk[0]}$ und $${o.unk[1]}$ sind bestimmt, also liegt $${o.target}$ im Spann.`, rule: 'vec-lc-no-check' })
  if (o.mode === 'span' && right.all)
    wrongs.push({ content: `${right.text.replace(/ Also liegt .*$/, '')} Trotzdem liegt $${o.target}$ nicht im Spann: Zwei Vektoren spannen nicht den ganzen Raum auf.`, rule: 'vec-lc-span-denied' })
  const swapped = [o.xs[1], o.xs[0]] as const
  // vertauschte Werte ändern nur etwas, wenn die Faktoren vor beiden Unbekannten in einer Gleichung verschieden sind
  const others: Wrong[] = [{ content: verdict(o.xs, true).text, rule: 'vec-dot-sign' }]
  if (o.rows.some((row) => !isZero(ratSub(lhsValue(row, swapped), lhsValue(row, o.xs))))) others.push({ content: verdict(swapped, false).text, rule: 'vec-lc-swapped' })
  wrongs.push(...rng.shuffle(others))
  const values = `$${o.unk[0]} = ${ratLatex(o.xs[0])}$ und $${o.unk[1]} = ${ratLatex(o.xs[1])}$`
  const rest = o.rows.length === 1 ? `die übrige Gleichung (${o.labels[0]})` : `die übrigen Gleichungen (${o.labels.join('), (')})`
  return choiceStep(rng, {
    id: 'probe',
    title: 'Probe',
    question: `Setze ${values} in ${rest} ein. Was folgt?`,
    correct: right.text,
    wrongs,
    hint: `Zwei Gleichungen legen $${o.unk[0]}$ und $${o.unk[1]}$ fest. Erst wenn auch jede übrige Gleichung stimmt, ist $${o.target}$ wirklich eine Linearkombination.`,
    explanation: {
      detailed: `${right.text} ${right.all ? `Alle Gleichungen gelten mit denselben Zahlen.` : `Mit diesen Zahlen klappt es nicht, und andere gibt es nicht: Die ersten Gleichungen legen sie fest.`}`,
      short: right.text,
    },
    cards: [CARD.linearkombination],
  })
}

// Determinante zweier Vektoren der Ebene
function det2Step(rng: Rng, an: string, bn: string, a: Vec, b: Vec): GuidedStep {
  const D = det2(a, b)
  const name = `\\det(${an}, ${bn})`
  const line = (v: Rational) => math(`${name} = ${ratLatex(v)}`)
  const wrongs: Wrong[] = [
    { content: line(ratAdd(m(a[0], b[1]), m(a[1], b[0]))), rule: 'vec-det2-plus' },
    { content: line(ratSub(m(a[0], a[1]), m(b[0], b[1]))), rule: 'vec-det2-rows' },
    { content: line(ratNeg(D)), rule: 'vec-sarrus-swap' },
  ]
  const matrix = `\\begin{pmatrix} ${ratLatex(a[0])} & ${ratLatex(b[0])} \\\\ ${ratLatex(a[1])} & ${ratLatex(b[1])} \\end{pmatrix}`
  const calc = `${fac(ratLatex(a[0]))} \\cdot ${fac(ratLatex(b[1]))} - ${fac(ratLatex(a[1]))} \\cdot ${fac(ratLatex(b[0]))}`
  return choiceStep(rng, {
    id: 'det',
    title: 'Determinante',
    question: `Wie groß ist $${name} = \\det ${matrix}$?`,
    correct: line(D),
    wrongs,
    hint: 'Die Vektoren als Spalten: Hauptdiagonale (links oben mal rechts unten) minus Nebendiagonale (rechts oben mal links unten).',
    explanation: {
      detailed: `Hauptdiagonale minus Nebendiagonale: $${name} = ${calc} = ${ratLatex(D)}$. Der Betrag ist die Fläche des Parallelogramms aus $${an}$ und $${bn}$.`,
      short: `$${name} = ${calc} = ${ratLatex(D)}$.`,
    },
    established: [`${name} = ${ratLatex(D)}`],
    cards: [CARD.unabhaengig],
  })
}

// Linear abhängig oder unabhängig aus der Determinante, mit falschen Begründungen
function indepStep(rng: Rng, o: { readonly names: readonly string[]; readonly vs: readonly Vec[]; readonly D: Rational; readonly detName: string }): GuidedStep {
  const dep = isZero(o.D)
  const detText = dep ? `$${o.detName} = 0$` : `$${o.detName} = ${ratLatex(o.D)} \\ne 0$`
  const correct = dep ? `linear abhängig, denn ${detText}` : `linear unabhängig, denn ${detText}`
  const wrongs: Wrong[] = [{ content: dep ? `linear unabhängig, denn ${detText}` : `linear abhängig, denn ${detText}`, rule: 'vec-indep-swapped' }]
  const others: Wrong[] = []
  if (dep) {
    others.push({ content: `linear unabhängig, denn keiner der Vektoren ist der Nullvektor`, rule: 'vec-indep-no-zero' })
    if (o.vs.length > 2) others.push({ content: `linear unabhängig, denn keine zwei der Vektoren sind parallel`, rule: 'vec-indep-pairwise' })
  } else {
    const pairs = o.vs.flatMap((u, i) => o.vs.slice(i + 1).map((w, k) => [i, i + 1 + k, vecDot(u, w)] as const)).filter(([, , d]) => !isZero(d))
    if (pairs.length) {
      const [i, j, d] = pairs[0]
      others.push({ content: `linear abhängig, denn $${o.names[i]} \\cdot ${o.names[j]} = ${ratLatex(d)} \\ne 0$, die beiden stehen nicht senkrecht`, rule: 'vec-indep-perp' })
    }
  }
  wrongs.push(...rng.shuffle(others))
  const list = o.names.map((n) => `$${n}$`).join(', ')
  return choiceStep(rng, {
    id: 'unabhaengig',
    title: 'Linear unabhängig?',
    question: `Sind ${list} linear unabhängig?`,
    correct,
    wrongs,
    hint: 'Determinante ungleich $0$: linear unabhängig. Determinante gleich $0$: linear abhängig, einer lässt sich aus den anderen kombinieren.',
    explanation: {
      detailed: dep
        ? `${detText}: Die Vektoren spannen ${o.vs.length === 2 ? 'kein Parallelogramm auf, sie liegen auf einer Geraden' : 'keinen Spat auf, sie liegen in einer Ebene'}. Also sind sie linear abhängig.`
        : `${detText}: Die Vektoren spannen ${o.vs.length === 2 ? 'ein echtes Parallelogramm' : 'einen echten Spat'} auf. Also sind sie linear unabhängig. Senkrecht müssen sie dafür nicht stehen.`,
      short: dep ? `${detText}: linear abhängig.` : `${detText}: linear unabhängig.`,
    },
    established: [`\\text{${INDEPENDENCE[dep ? 1 : 0]}}`],
    cards: [CARD.unabhaengig],
  })
}

// ------------------------------------------------------------------ Bilder

type Item = { readonly v: Vec; readonly name: string; readonly color: DrawColor }
type ChainLink = { readonly k: Rational; readonly v: Vec; readonly name: string; readonly color: DrawColor }

const add = (p: readonly number[], q: readonly number[]) => p.map((x, i) => x + q[i])
const scale = (k: number, p: readonly number[]) => p.map((x) => k * x)
const dotN = (p: readonly number[], q: readonly number[]) => p.reduce((s, x, i) => s + x * q[i], 0)

// Koordinaten (α, β) eines Punktes in der Ebene aus p und q (kleinste Quadrate; liegt er nicht darin: sein Lotfußpunkt)
function planeCoords(p: readonly number[], q: readonly number[], x: readonly number[]): readonly [number, number] {
  const [pp, pq, qq, xp, xq] = [dotN(p, p), dotN(p, q), dotN(q, q), dotN(x, p), dotN(x, q)]
  const d = pp * qq - pq * pq
  return [(xp * qq - xq * pq) / d, (xq * pp - xp * pq) / d]
}

function spanFigure(o: {
  readonly dim: 2 | 3
  readonly items: readonly Item[]
  readonly caption: string
  // Ebene durch den Ursprung (Raum)
  readonly plane?: readonly [Vec, Vec]
  // Vielfache, die beim Abspielen aneinander laufen
  readonly chain?: readonly ChainLink[]
  readonly target?: Item
  // die Kette verfehlt das Ziel: rote Strecke zum Ziel
  readonly miss?: boolean
  // gestrichelte Gerade durch den Ursprung
  readonly line?: Vec
  // Parallelogramm aus zwei Vektoren (Ebene)
  readonly parallelogram?: readonly [Vec, Vec]
}): VectorDrawing {
  const zero = Array.from({ length: o.dim }, () => 0)
  const ghost = !!o.chain?.length
  const arrows: DrawArrow[] = o.items.map((it) => ({ from: zero, to: nums(it.v), color: it.color, label: it.name, ...(ghost ? { ghost: true } : {}) }))
  const segments: DrawSegment[] = []
  const polygons: DrawPolygon[] = []
  const links = (o.chain ?? []).filter((l) => !isZero(l.k))
  let at = zero
  links.forEach((l, i) => {
    const to = add(at, scale(num(l.k), nums(l.v)))
    arrows.push({ from: at, to, color: l.color, label: `${coefLatex(l.k, true)}${l.name}`, phase: i + 1, ...(i > 0 ? { slideFrom: zero } : {}) })
    at = to
  })
  if (o.target) arrows.push({ from: zero, to: nums(o.target.v), color: 'r', label: o.target.name })
  if (o.miss && o.target) segments.push({ from: at, to: nums(o.target.v), color: 'bad', dashed: true, phase: links.length + 1 })
  if (o.plane) {
    const [p, q] = o.plane.map(nums)
    const pts = [zero, p, q, ...arrows.map((a) => a.to), ...arrows.map((a) => a.from)]
    const cs = pts.map((x) => planeCoords(p, q, x))
    const lo = (k: 0 | 1) => Math.min(...cs.map((c) => c[k])) - 0.35
    const hi = (k: 0 | 1) => Math.max(...cs.map((c) => c[k])) + 0.35
    const corner = (al: number, be: number) => add(scale(al, p), scale(be, q))
    polygons.push({ points: [corner(lo(0), lo(1)), corner(hi(0), lo(1)), corner(hi(0), hi(1)), corner(lo(0), hi(1))], color: 'muted' })
  }
  if (o.parallelogram) {
    const [p, q] = o.parallelogram.map(nums)
    polygons.push({ points: [zero, p, add(p, q), q], color: 'c', phase: 1 })
  }
  if (o.line) {
    const d = nums(o.line)
    const reach = Math.max(1, ...o.items.map((it) => Math.abs(dotN(nums(it.v), d) / dotN(d, d)))) * 1.25
    segments.push({ from: scale(-reach, d), to: scale(reach, d), color: 'muted', dashed: true, phase: 1 })
  }
  return { ...emptyDrawing(o.dim, o.caption), arrows, segments, polygons }
}

// ------------------------------------------------------------------ Zahlen

const NAME_SETS = [
  ['a', 'b', 'c', 'd', 'v'],
  ['u', 'v', 'w', 'z', 'x'],
  ['p', 'q', 'r', 's', 'y'],
] as const
const COEF_SETS = [
  ['\\lambda', '\\mu', '\\nu'],
  ['\\alpha', '\\beta', '\\gamma'],
] as const
const PARAM_NAMES = ['t', 'k'] as const
const COLORS: readonly DrawColor[] = ['a', 'b', 'c', 'muted']

function names(rng: Rng) {
  const i = rng.int(0, 2)
  const j = rng.int(0, 1)
  const set = NAME_SETS[i]
  return { vn: set.slice(0, 4).map(vecName), target: vecName(set[4]), unk: COEF_SETS[j], key: `${set[0]}${j}` }
}

// Faktor ungleich 0 aus [-r, r]
const nonzero = (rng: Rng, r: number) => {
  let x = 0
  while (x === 0) x = rng.int(-r, r)
  return x
}
const sgnKey = (xs: readonly Rational[]) => xs.map((x) => (ratSign(x) > 0 ? '+' : ratSign(x) < 0 ? '-' : '0')).join('')
const allDistinct = (xs: readonly Rational[]) => xs.every((x, i) => xs.every((y, j) => i === j || !isZero(ratSub(x, y))))

// zwei nicht parallele Vektoren mit kleinen Einträgen; b ohne Null (b wird beim Eliminieren gebraucht)
function pickPair(rng: Rng, dim: number, r: number): readonly [Vec, Vec] {
  for (;;) {
    const a = ints(rng, dim, -r, r)
    const b = ints(rng, dim, -r, r, true)
    if (zeroCount(a) > 1 || negCount(a) + negCount(b) === 0 || parallel(a, b)) continue
    return [a, b]
  }
}

// Zwei Zeilen i, j zum Lösen (b dort nicht 0, eindeutig lösbar); die übrigen für die Probe
function pickRows(rng: Rng, a: Vec, b: Vec): readonly [number, number] | null {
  const pairs: [number, number][] = []
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (!isZero(det2(a, b, i, j)) && !isZero(b[i]) && !isZero(b[j])) pairs.push([i, j])
  return pairs.length ? rng.pick(pairs) : null
}

// λ, μ verschieden und nicht 0
function pickCoefs(rng: Rng, r: number): readonly [Rational, Rational] {
  for (;;) {
    const [x, y] = [nonzero(rng, r), nonzero(rng, r)]
    if (x !== y) return [R(x), R(y)]
  }
}

const tooBig = (v: Vec, lim: number) => v.some((x) => Math.abs(num(x)) > lim)

// ------------------------------------------------------------------ Arten

// λ und μ aus zwei Zeilen: Schritt für λ (μ fällt weg), dann μ durch Einsetzen
function solveTwo(rng: Rng, rows: readonly Row[], i: number, j: number, unk: readonly string[], sol: readonly [Rational, Rational]): GuidedStep[] {
  const step = elimValueStep(rng, { id: 'erste', rows: [rows[i], rows[j]], labels: [ROMAN[i], ROMAN[j]], x: 0, y: 1, unk, sol })
  const back = rng.pick([i, j])
  return [
    step,
    backsubStep(rng, {
      id: 'zweite',
      row: rows[back],
      label: ROMAN[back],
      target: 1,
      known: [[0, sol[0]]],
      unk,
    }),
  ]
}

// Linearkombination: λ a + μ b = v. Stufe 1 in der Ebene, Stufe 2 im Raum mit Probe in der dritten Gleichung
function buildComb(rng: Rng, level: Level): Built {
  const { vn, target, unk, key } = names(rng)
  const dim = level === 1 ? 2 : 3
  for (;;) {
    const [a, b] = pickPair(rng, dim, 4)
    const [l, mu] = pickCoefs(rng, 3)
    const v = combine([l, mu], [a, b])
    if (tooBig(v, 14) || zeroCount(v) > 1) continue
    const rc = pickRows(rng, a, b)
    if (!rc) continue
    const [i, j] = rc
    const rows = rowsOf([a, b], v)
    const steps: GuidedStep[] = [systemStep(rng, { names: [vn[0], vn[1]], vs: [a, b], target, targetLatex: vecLatex(v), rows, unk })]
    steps.push(...solveTwo(rng, rows, i, j, unk, [l, mu]))
    const k = [0, 1, 2].find((x) => x !== i && x !== j)
    if (dim === 3) steps.push(probeStep(rng, { rows: [rows[k!]], labels: [ROMAN[k!]], xs: [l, mu], unk, target, mode: 'check' }))
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = [
      { v: a, name: vn[0], color: 'a' },
      { v: b, name: vn[1], color: 'b' },
    ]
    const plane = dim === 3 ? { plane: [a, b] as const } : {}
    steps[0] = { ...steps[0], drawing: spanFigure({ dim, items, target: { v, name: target, color: 'r' }, ...plane, caption: `Gesucht sind die Vielfachen von $${vn[0]}$ und $${vn[1]}$, die aneinandergehängt bei der Spitze von $${target}$ ankommen.` }) }
    return {
      kind: 'basisComb',
      instruction: `Schreib $${target}$ als Linearkombination von $${vn[0]}$ und $${vn[1]}$: Bestimme $${unk[0]}$ und $${unk[1]}$ mit $${combLatex(unk, vn.slice(0, 2), target)}$.`,
      functionLatex: `${vn[0]} = ${vecLatex(a)},\\; ${vn[1]} = ${vecLatex(b)},\\; ${target} = ${vecLatex(v)}`,
      steps,
      cards: [CARD.linearkombination],
      resultLatex: valuesLatex(unk, [l, mu]),
      resultDrawing: spanFigure({
        dim,
        items,
        target: { v, name: target, color: 'r' },
        ...plane,
        chain: [
          { k: l, v: a, name: vn[0], color: 'a' },
          { k: mu, v: b, name: vn[1], color: 'b' },
        ],
        caption: `$${ratLatex(l)}$-mal $${vn[0]}$ und dann $${ratLatex(mu)}$-mal $${vn[1]}$ führt genau zur Spitze von $${target}$.`,
      }),
      form: `basisComb|${level}|${key}|${i}${j}|${signShape(a, b)}|${sgnKey([l, mu])}`,
      data: { a: nums(a), b: nums(b), v: nums(v) },
      answer: [num(l), num(mu)],
    }
  }
}

// Liegt v im Spann von a und b? Stufe 2 im Raum, Stufe 3 in vier Dimensionen (zwei Gleichungen zur Probe)
function buildSpan(rng: Rng, level: Level): Built {
  const { vn, target, unk, key } = names(rng)
  const dim = level === 2 ? 3 : 4
  const inSpan = rng.chance(0.5)
  for (;;) {
    const [a, b] = pickPair(rng, dim, dim === 3 ? 4 : 3)
    const [l, mu] = pickCoefs(rng, 3)
    const w = combine([l, mu], [a, b])
    const rc = pickRows(rng, a, b)
    if (!rc) continue
    const [i, j] = rc
    const rest = Array.from({ length: dim }, (_, x) => x).filter((x) => x !== i && x !== j)
    const off = rng.pick(rest)
    const v = inSpan ? w : w.map((x, k) => (k === off ? ratAdd(x, R(nonzero(rng, 3))) : x))
    if (tooBig(v, 14) || zeroCount(v) > 1) continue
    const rows = rowsOf([a, b], v)
    const steps: GuidedStep[] = [systemStep(rng, { names: [vn[0], vn[1]], vs: [a, b], target, targetLatex: vecLatex(v), rows, unk })]
    steps.push(...solveTwo(rng, rows, i, j, unk, [l, mu]))
    steps.push(probeStep(rng, { rows: rest.map((x) => rows[x]), labels: rest.map((x) => ROMAN[x]), xs: [l, mu], unk, target, mode: 'span' }))
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = [
      { v: a, name: vn[0], color: 'a' },
      { v: b, name: vn[1], color: 'b' },
    ]
    if (dim === 3)
      steps[0] = { ...steps[0], drawing: spanFigure({ dim: 3, items, plane: [a, b], caption: `Der Spann von $${vn[0]}$ und $${vn[1]}$ ist eine Ebene durch den Ursprung. Liegt $${target}$ darin?` }) }
    const answer = inSpan ? 0 : 1
    return {
      kind: 'basisSpan',
      instruction: `Liegt $${target}$ im Spann von $${vn[0]}$ und $${vn[1]}$? Lässt sich also $${combLatex(unk, vn.slice(0, 2), target)}$ lösen?`,
      functionLatex: `${vn[0]} = ${vecLatex(a)},\\; ${vn[1]} = ${vecLatex(b)},\\; ${target} = ${vecLatex(v)}`,
      steps,
      cards: [CARD.linearkombination],
      resultLatex: `\\text{${SPAN_ANSWERS[answer]}}`,
      ...(dim === 3
        ? {
            resultDrawing: spanFigure({
              dim: 3,
              items,
              plane: [a, b],
              target: { v, name: target, color: 'r' },
              chain: [
                { k: l, v: a, name: vn[0], color: 'a' },
                { k: mu, v: b, name: vn[1], color: 'b' },
              ],
              miss: !inSpan,
              caption: inSpan
                ? `Die Vielfachen von $${vn[0]}$ und $${vn[1]}$ treffen die Spitze von $${target}$: $${target}$ liegt in der Ebene.`
                : `Die Vielfachen aus den ersten Gleichungen verfehlen $${target}$ (rot): $${target}$ ragt aus der Ebene heraus.`,
            }),
          }
        : {}),
      form: `basisSpan|${level}|${inSpan ? 'in' : 'out'}|${key}|${i}${j}${off}|${signShape(a, b)}|${sgnKey([l, mu])}`,
      data: { a: nums(a), b: nums(b), v: nums(v) },
      answer: [answer],
    }
  }
}

// Linear unabhängig? Stufe 1 zwei Vektoren der Ebene (Determinante 2 × 2), Stufe 2 drei im Raum (Sarrus); bei der Hälfte
// abhängig
function buildIndep(rng: Rng, level: Level): Built {
  const { vn, key } = names(rng)
  const dep = rng.chance(0.5)
  const dim = level === 1 ? 2 : 3
  for (;;) {
    let vs: Vec[]
    let ks: readonly Rational[] = []
    if (dim === 2) {
      const a = ints(rng, 2, -4, 4, true)
      if (dep) {
        const k = rng.pick([rat(2), rat(-2), rat(3), rat(-3), rat(-1), rat(1, 2), rat(-1, 2)])
        const b = vecScale(k, a)
        if (!b.every(isInteger) || tooBig(b, 9)) continue
        vs = [a, b]
        ks = [k]
      } else vs = [a, ints(rng, 2, -4, 4, true)]
    } else {
      const [a, b] = pickPair(rng, 3, 4)
      if (dep) {
        ks = pickCoefs(rng, 2)
        const c = combine(ks, [a, b])
        if (tooBig(c, 9) || zeroCount(c) > 1) continue
        vs = [a, b, c]
      } else vs = [a, b, ints(rng, 3, -4, 4)]
    }
    if (vs.some((v) => zeroCount(v) === v.length)) continue
    if (vs.length === 3 && [[0, 1], [0, 2], [1, 2]].some(([x, y]) => parallel(vs[x], vs[y]))) continue
    if (negCount(vs[0]) + negCount(vs[1]) === 0) continue
    const nm = vn.slice(0, vs.length)
    const detName = `\\det(${nm.join(', ')})`
    const D = dim === 2 ? det2(vs[0], vs[1]) : spatProduct(vs[0], vs[1], vs[2])
    if (isZero(D) !== dep || Math.abs(num(D)) > 60) continue
    const first =
      dim === 2
        ? det2Step(rng, nm[0], nm[1], vs[0], vs[1])
        : sarrusStep(rng, nm[0], nm[1], nm[2], ...(vs.map((v) => ({ base: v, slope: vec(0, 0, 0) })) as [PVec, PVec, PVec]), 't', { name: detName, title: 'Determinante mit Sarrus', card: CARD.unabhaengig })
    const steps = [first, indepStep(rng, { names: nm, vs, D, detName })]
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = vs.map((v, i) => ({ v, name: nm[i], color: COLORS[i] }))
    // in der Ebene kein Bild vor dem Ergebnis: Zwei Pfeile auf einer Geraden verrieten „abhängig“
    if (dim === 3) steps[0] = { ...steps[0], drawing: bodyDrawing('spat', [nm[0], nm[1], nm[2]], vs[0], vs[1], vs[2], `Das Parallelogramm aus $${nm[0]}$ und $${nm[1]}$. Wo $${nm[2]}$ liegt, sagt die Determinante.`, { withoutC: true }) }
    const resultDrawing =
      dim === 2
        ? dep
          ? spanFigure({ dim: 2, items, line: vs[0], caption: `$${nm[1]} = ${coefLatex(ks[0], true)}${nm[0]}$: Beide liegen auf einer Geraden durch den Ursprung, das Parallelogramm ist flach.` })
          : spanFigure({ dim: 2, items, parallelogram: [vs[0], vs[1]], caption: `Das Parallelogramm hat die Fläche $${ratLatex(ratAbs(D))}$: Die beiden Vektoren zeigen in verschiedene Richtungen.` })
        : dep
          ? spanFigure({
              dim: 3,
              items,
              plane: [vs[0], vs[1]],
              chain: [
                { k: ks[0], v: vs[0], name: nm[0], color: 'a' },
                { k: ks[1], v: vs[1], name: nm[1], color: 'b' },
              ],
              caption: `$${nm[2]}$ liegt in der Ebene von $${nm[0]}$ und $${nm[1]}$: $${nm[2]} = ${coefLatex(ks[0], true)}${nm[0]} ${coefLatex(ks[1], false)}${nm[1]}$.`,
            })
          : bodyDrawing('spat', [nm[0], nm[1], nm[2]], vs[0], vs[1], vs[2], `Die drei Vektoren spannen einen echten Spat auf (Volumen $${ratLatex(ratAbs(D))}$).`, { result: true })
    return {
      kind: 'basisIndep',
      instruction: `Sind ${nm.map((n) => `$${n}$`).join(', ')} linear unabhängig? Entscheide mit der Determinante.`,
      functionLatex: nm.map((n, i) => `${n} = ${vecLatex(vs[i])}`).join(',\\; '),
      steps,
      cards: [CARD.unabhaengig],
      resultLatex: `${detName} = ${ratLatex(D)},\\; \\text{${INDEPENDENCE[dep ? 1 : 0]}}`,
      resultDrawing,
      form: `basisIndep|${level}|${dep ? 'dep' : 'ind'}|${key}|${signShape(...vs)}|${ks.map(ratLatex).join(',')}`,
      data: Object.fromEntries(vs.map((v, i) => [`v${i}`, nums(v)])),
      answer: [num(D), dep ? 1 : 0],
    }
  }
}

// Dimension und Basis des Spanns von drei oder vier Vektoren im Raum (Stufe 3)
type DimCase = 'd3' | 'd2' | 'd1' | 'four3' | 'four2'

function buildDim(rng: Rng, level: Level): Built {
  const { vn, key } = names(rng)
  const kind = rng.pick<DimCase>(['d3', 'd2', 'd2', 'd1', 'four3', 'four2'])
  for (;;) {
    let vs: Vec[]
    if (kind === 'd1') {
      const a = ints(rng, 3, -3, 3)
      if (zeroCount(a) > 1 || gcdInt(gcdInt(a[0].n, a[1].n), a[2].n) !== 1n) continue
      const [k, l] = [rng.pick([2, -2, 3, -1, -3]), rng.pick([2, -2, 3, -1, -3])]
      if (k === l) continue
      vs = [a, vecScale(R(k), a), vecScale(R(l), a)]
    } else {
      const [a, b] = pickPair(rng, 3, 3)
      const cMix = combine(pickCoefs(rng, 2), [a, b])
      const c = kind === 'd2' || kind === 'four2' ? cMix : ints(rng, 3, -3, 3)
      vs = [a, b, c]
      if (kind === 'four3') vs.push(ints(rng, 3, -3, 3, true))
      if (kind === 'four2') vs.push(combine(pickCoefs(rng, 2), [a, b]))
    }
    if (vs.some((v) => tooBig(v, 9) || zeroCount(v) > 1)) continue
    const pairs = vs.flatMap((u, i) => vs.slice(i + 1).map((w) => parallel(u, w)))
    if (kind !== 'd1' && pairs.some(Boolean)) continue
    const D = spatProduct(vs[0], vs[1], vs[2])
    const dim = kind === 'd3' || kind === 'four3' ? 3 : kind === 'd1' ? 1 : 2
    if ((dim === 3) !== !isZero(D) || Math.abs(num(D)) > 60) continue
    const n = vs.length
    const nm = vn.slice(0, n)
    const U = `\\operatorname{span}(${nm.join(', ')})`
    const detName = `\\det(${nm[0]}, ${nm[1]}, ${nm[2]})`
    const pv = (v: Vec): PVec => ({ base: v, slope: vec(0, 0, 0) })
    const steps: GuidedStep[] = []
    const list = (k: number) => (k === 1 ? `nur $${nm[0]}$` : `${nm.slice(0, k - 1).map((x) => `$${x}$`).join(', ')} und $${nm[k - 1]}$`)
    if (n === 4)
      steps.push(
        choiceStep(rng, {
          id: 'faustregel',
          title: 'Vier Vektoren im Raum',
          question: `Können ${list(4)} linear unabhängig sein?`,
          correct: 'Nein: Im Raum sind mehr als drei Vektoren immer linear abhängig.',
          wrongs: rng.shuffle<Wrong>([
            { content: 'Ja: Keine zwei von ihnen sind parallel.', rule: 'vec-indep-pairwise' },
            { content: 'Ja: Keiner von ihnen ist der Nullvektor.', rule: 'vec-indep-no-zero' },
          ]),
          hint: 'Der Raum hat drei Richtungen. Mehr als drei Vektoren können nicht alle in neue Richtungen zeigen.',
          explanation: {
            detailed: `Im Raum gibt es höchstens drei linear unabhängige Vektoren. Von vier Vektoren lässt sich deshalb immer einer aus den anderen kombinieren. Die Frage ist nur, wie viele Richtungen übrig bleiben: Das sagt die Determinante von $${nm[0]}$, $${nm[1]}$, $${nm[2]}$.`,
            short: 'Mehr als drei Vektoren im Raum sind immer linear abhängig.',
          },
          cards: [CARD.unabhaengig],
        }),
      )
    // alle parallel: ohne Determinante (Sarrus gäbe fast nur 0), die Vielfachen sieht man direkt
    if (dim > 1) steps.push(sarrusStep(rng, nm[0], nm[1], nm[2], pv(vs[0]), pv(vs[1]), pv(vs[2]), 't', { name: detName, title: 'Determinante mit Sarrus', card: CARD.basis }))
    const dimName = `\\dim U`
    const line = (k: number) => math(`${dimName} = ${k}`)
    const dWrongs: Wrong[] = []
    if (n !== dim) dWrongs.push({ content: line(n), rule: 'vec-dim-count' })
    if (dim === 3) dWrongs.push({ content: line(2), rule: 'vec-indep-swapped' })
    if (dim === 2 && n === 4) dWrongs.push({ content: line(3), rule: 'vec-dim-entries' })
    if (dim === 1) dWrongs.push({ content: line(2), rule: 'vec-dim-parallel' })
    if (dim > 1) dWrongs.push({ content: line(dim === 3 ? 1 : dim - 1), rule: 'vec-dim-too-low' })
    const piv = vs[0].findIndex((x) => !isZero(x))
    const why =
      dim === 3
        ? `$${detName} = ${ratLatex(D)} \\ne 0$: $${nm[0]}$, $${nm[1]}$, $${nm[2]}$ sind linear unabhängig und zeigen in drei Richtungen.${n === 4 ? ` $${nm[3]}$ bringt keine neue Richtung dazu.` : ''}`
        : dim === 2
          ? `$${detName} = 0$: Die drei liegen in einer Ebene. $${nm[0]}$ und $${nm[1]}$ sind nicht parallel, also zwei Richtungen.${n === 4 ? ` Auch $${nm[3]}$ liegt in dieser Ebene, denn $\\det(${nm[0]}, ${nm[1]}, ${nm[3]}) = 0$.` : ''}`
          : `$${nm[1]} = ${coefLatex(ratDiv(vs[1][piv], vs[0][piv]), true)}${nm[0]}$ und $${nm[2]} = ${coefLatex(ratDiv(vs[2][piv], vs[0][piv]), true)}${nm[0]}$: Alle liegen auf einer Geraden, es gibt nur eine Richtung.`
    steps.push(
      choiceStep(rng, {
        id: 'dimension',
        title: 'Dimension',
        question: `Welche Dimension hat $U = ${U}$?`,
        correct: line(dim),
        wrongs: dWrongs,
        hint: 'Die Dimension zählt die Richtungen: so viele Vektoren, wie höchstens linear unabhängig sind. Abhängige Vektoren bringen keine neue Richtung dazu.',
        explanation: { detailed: `${why} Also $${dimName} = ${dim}$.`, short: `$${dimName} = ${dim}$.` },
        established: [`${dimName} = ${dim}`],
        cards: [CARD.basis],
      }),
    )
    if (n === 4 || dim < 3) {
      const bWrongs: Wrong[] = [{ content: `${list(n)}`, rule: 'vec-dim-count' }]
      if (dim > 1) bWrongs.push({ content: list(dim - 1), rule: 'vec-dim-too-low' })
      if (dim < n - 1) bWrongs.push({ content: list(dim + 1), rule: dim === 1 ? 'vec-dim-parallel' : 'vec-dim-count' })
      steps.push(
        choiceStep(rng, {
          id: 'basis',
          title: 'Basis',
          question: `Welche Vektoren bilden eine Basis von $U$?`,
          correct: list(dim),
          wrongs: bWrongs,
          hint: 'Eine Basis: so viele linear unabhängige Vektoren aus $U$, wie die Dimension sagt. Nicht mehr (dann wären sie abhängig) und nicht weniger (dann fehlt eine Richtung).',
          explanation: {
            detailed: `$${dimName} = ${dim}$, also braucht die Basis ${dim === 1 ? 'einen Vektor' : `${dim} linear unabhängige Vektoren`}: ${list(dim)}. ${dim === 1 ? `Jeder der Vektoren allein ginge auch.` : `Die übrigen sind Linearkombinationen davon.`}`,
            short: `Basis: ${list(dim)}.`,
          },
          cards: [CARD.basis],
        }),
      )
    }
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = vs.map((v, i) => ({ v, name: nm[i], color: COLORS[i] }))
    const caption =
      dim === 3
        ? `Der Spann ist der ganze Raum: $${nm[0]}$, $${nm[1]}$, $${nm[2]}$ spannen einen echten Spat auf.`
        : dim === 2
          ? `Alle Vektoren liegen in einer Ebene durch den Ursprung: Der Spann ist diese Ebene.`
          : `Alle Vektoren liegen auf einer Geraden durch den Ursprung: Der Spann ist diese Gerade.`
    let resultDrawing: VectorDrawing
    if (dim === 3) {
      const body = bodyDrawing('spat', [nm[0], nm[1], nm[2]], vs[0], vs[1], vs[2], caption, { result: true })
      resultDrawing = n === 4 ? { ...body, arrows: [...body.arrows, { from: [0, 0, 0], to: nums(vs[3]), color: 'muted', label: nm[3] }] } : body
    } else resultDrawing = spanFigure({ dim: 3, items, ...(dim === 2 ? { plane: [vs[0], vs[1]] as const } : { line: vs[0] }), caption })
    return {
      kind: 'basisDim',
      instruction: `Welche Dimension hat $U = ${U}$, und welche der Vektoren bilden eine Basis von $U$?`,
      functionLatex: nm.map((x, i) => `${x} = ${vecLatex(vs[i])}`).join(',\\; '),
      steps,
      cards: [CARD.basis, CARD.unabhaengig],
      resultLatex: `${dimName} = ${dim}`,
      resultDrawing,
      form: `basisDim|${level}|${kind}|${key}|${signShape(...vs)}`,
      data: Object.fromEntries(vs.map((v, i) => [`v${i}`, nums(v)])),
      answer: [dim],
    }
  }
}

// Koordinaten bezüglich einer Basis: λ a + μ b + ν c = v mit Gauß (Stufe 3 ganze Zahlen, Stufe 4 Brüche)
function buildCoords(rng: Rng, level: Level): Built {
  const { vn, target, unk, key } = names(rng)
  for (;;) {
    const a = ints(rng, 3, -3, 3, true)
    const [b, c] = [ints(rng, 3, -3, 3), ints(rng, 3, -3, 3)]
    if (zeroCount(b) > 1 || zeroCount(c) > 1) continue
    const D = spatProduct(a, b, c)
    if (isZero(D) || Math.abs(num(D)) > (level === 3 ? 30 : 6) || (level === 4 && Math.abs(num(D)) < 2)) continue
    let sol: Rational[]
    let v: Vec
    if (level === 3) {
      sol = [R(rng.int(-3, 3)), R(rng.int(-3, 3)), R(rng.int(-3, 3))]
      // keine Koordinate 0: sonst fiele ein falscher Faktor vor dieser Unbekannten in der Probe nicht auf
      if (sol.some(isZero)) continue
      v = combine(sol, [a, b, c])
    } else {
      v = ints(rng, 3, -6, 6)
      // Cramer: Spalte i durch v ersetzt
      sol = [spatProduct(v, b, c), spatProduct(a, v, c), spatProduct(a, b, v)].map((x) => ratDiv(x, D))
      if (sol.every(isInteger) || sol.some(isZero) || sol.some((x) => Math.abs(num(x)) > 8)) continue
    }
    if (!allDistinct(sol) || tooBig(v, 20) || zeroCount(v) > 1) continue
    const rows = rowsOf([a, b, c], v)
    // Pivot: Zeile mit dem kleinsten Faktor vor λ
    const p = [0, 1, 2].reduce((best, i) => (Math.abs(num(a[i])) < Math.abs(num(a[best])) ? i : best), rng.int(0, 2))
    const others = [0, 1, 2].filter((i) => i !== p)
    const factors = others.map((i) => eliminators(rows[i], rows[p], 0))
    const reduced = others.map((i, k) => rowComb(factors[k][0], rows[i], factors[k][1], rows[p]))
    if (reduced.some((r) => isZero(r.c[1]) || isZero(r.c[2]) || r.c.some((x) => Math.abs(num(x)) > 30))) continue
    const labels = others.map((i) => `${ROMAN[i]}'`)
    const sysR = (rs: readonly Row[]) => math(systemLatex(rs, unk, labels))
    const variant = (f: (r: Row, k: number) => Row) => sysR(reduced.map(f))
    const elim = choiceStep(rng, {
      id: 'eliminieren',
      title: `$${unk[0]}$ eliminieren`,
      question: `Zieh passende Vielfache von (${ROMAN[p]}) von den anderen Gleichungen ab, sodass $${unk[0]}$ wegfällt. Welche Gleichungen bleiben?`,
      correct: sysR(reduced),
      wrongs: [
        { content: variant((r, k) => ({ ...r, r: m(factors[k][0], rows[others[k]].r) })), rule: 'vec-gauss-rhs' },
        ...rng.shuffle<Wrong>([
          { content: variant((r, k) => ({ ...r, r: ratAdd(m(factors[k][0], rows[others[k]].r), m(factors[k][1], rows[p].r)) })), rule: 'vec-gauss-sign' },
          { content: variant((r, k) => ({ ...r, c: r.c.map((x, j) => (j === 1 ? ratAdd(m(factors[k][0], rows[others[k]].c[1]), m(factors[k][1], rows[p].c[1])) : x)) })), rule: 'vec-gauss-sign' },
        ]),
      ],
      hint: `Nimm (${ROMAN[p]}) als Hilfsgleichung. Bring den Faktor vor $${unk[0]}$ in beiden Gleichungen auf dieselbe Zahl und zieh ab, links und rechts.`,
      explanation: {
        detailed: others
          .map((i, k) => {
            const comb = termsLatex([
              [factors[k][0], tag(ROMAN[i])],
              [ratNeg(factors[k][1]), tag(ROMAN[p])],
            ])
            return `$${tag(`${labels[k]}`)} = ${comb}$: $${rowLatex(reduced[k], unk)}$`
          })
          .join('. ')
          .concat('. Übrig sind zwei Gleichungen mit zwei Unbekannten.'),
        short: `$${systemLatex(reduced, unk, labels)}$.`,
      },
      cards: [CARD.linearkombination],
    })
    const nuStep = elimValueStep(rng, { id: 'dritte', rows: [reduced[0], reduced[1]], labels: [labels[0], labels[1]], x: 2, y: 1, unk, sol })
    const backRow = rng.int(0, 1)
    const muStep = backsubStep(rng, {
      id: 'zweite',
      row: reduced[backRow],
      label: labels[backRow],
      target: 1,
      known: [[2, sol[2]]],
      unk,
    })
    const lStep = backsubStep(rng, { id: 'erste', row: rows[p], label: ROMAN[p], target: 0, known: [[1, sol[1]], [2, sol[2]]], unk })
    const steps = [systemStep(rng, { names: [vn[0], vn[1], vn[2]], vs: [a, b, c], target, targetLatex: vecLatex(v), rows, unk }), elim, nuStep, muStep, lStep]
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = [
      { v: a, name: vn[0], color: 'a' },
      { v: b, name: vn[1], color: 'b' },
      { v: c, name: vn[2], color: 'c' },
    ]
    steps[0] = { ...steps[0], drawing: spanFigure({ dim: 3, items, target: { v, name: target, color: 'r' }, caption: `Drei Richtungen und das Ziel $${target}$.` }) }
    return {
      kind: 'basisCoords',
      instruction: `$${vn[0]}$, $${vn[1]}$, $${vn[2]}$ bilden eine Basis des Raums. Bestimme die Koordinaten von $${target}$ in dieser Basis, also $${unk[0]}$, $${unk[1]}$, $${unk[2]}$ mit $${combLatex(unk, vn.slice(0, 3), target)}$.`,
      functionLatex: `${vn[0]} = ${vecLatex(a)},\\; ${vn[1]} = ${vecLatex(b)},\\; ${vn[2]} = ${vecLatex(c)},\\; ${target} = ${vecLatex(v)}`,
      steps,
      cards: [CARD.basis, CARD.linearkombination],
      resultLatex: valuesLatex(unk, sol),
      resultDrawing: spanFigure({
        dim: 3,
        items,
        target: { v, name: target, color: 'r' },
        chain: [
          { k: sol[0], v: a, name: vn[0], color: 'a' },
          { k: sol[1], v: b, name: vn[1], color: 'b' },
          { k: sol[2], v: c, name: vn[2], color: 'c' },
        ],
        caption: `Mit den Koordinaten $${valuesLatex(unk, sol)}$ führen die Vielfachen genau zu $${target}$.`,
      }),
      form: `basisCoords|${level}|${key}|${p}|${signShape(a, b, c)}|${sgnKey(sol)}`,
      data: { a: nums(a), b: nums(b), c: nums(c), v: nums(v) },
      answer: sol.map(num),
    }
  }
}

// Parameter so, dass v im Spann von a und b liegt: v hat den Parameter in einem Eintrag. Stufe 4 im Raum, Stufe 5 in vier
// Dimensionen mit einer Probe
function buildSpanParam(rng: Rng, level: Level): Built {
  const { vn, target, unk, key } = names(rng)
  const t = rng.pick(PARAM_NAMES)
  const dim = level === 4 ? 3 : 4
  for (;;) {
    const [a, b] = pickPair(rng, dim, dim === 3 ? 4 : 3)
    const [l, mu] = pickCoefs(rng, 3)
    const w = combine([l, mu], [a, b])
    if (tooBig(w, 14) || zeroCount(w) > 1) continue
    const rc = pickRows(rng, a, b)
    if (!rc) continue
    const [i, j] = rc
    const rest = rng.shuffle(Array.from({ length: dim }, (_, x) => x).filter((x) => x !== i && x !== j))
    const k = rest[0]
    if (isZero(a[k]) && isZero(b[k])) continue
    const s = rng.pick([1, 1, 2, -1, 3, -2])
    const tStar = rng.int(-4, 4)
    const c0 = ratSub(w[k], R(s * tStar))
    if (Math.abs(num(c0)) > 12 || [l, mu].some((x) => isZero(ratSub(x, R(tStar))))) continue
    const base = w.map((x, x2) => (x2 === k ? c0 : x))
    const slope = w.map((_, x2) => (x2 === k ? R(s) : R(0)))
    const rows = rowsOf([a, b], base, slope)
    const vLatex = columnLatex(base.map((x, x2) => (x2 === k ? linLatex(c0, R(s), t) : ratLatex(x))))
    const steps: GuidedStep[] = [systemStep(rng, { names: [vn[0], vn[1]], vs: [a, b], target, targetLatex: vLatex, rows, unk, t })]
    steps.push(...solveTwo(rng, rows, i, j, unk, [l, mu]))
    if (dim === 4) steps.push(probeStep(rng, { rows: [rows[rest[1]]], labels: [ROMAN[rest[1]]], xs: [l, mu], unk, target, mode: 'check' }))
    // Gleichung mit dem Parameter
    const row = rows[k]
    const pairs = row.c.map((c, x) => [c, [l, mu][x]] as const)
    const val = lhsValue(row, [l, mu])
    const tOf = (value: Rational) => ratDiv(ratSub(value, c0), R(s))
    const line = (x: Rational) => math(`${t} = ${ratLatex(x)}`)
    const flipAt = pairs.findIndex(([c, x]) => !isZero(m(c, x)))
    const flipped = flipAt >= 0 ? ratSub(val, m(rat(2), m(pairs[flipAt][0], pairs[flipAt][1]))) : val
    const wrongs: Wrong[] = [
      { content: line(ratDiv(ratAdd(val, c0), R(s))), rule: 'vec-param-solve' },
      ...rng.shuffle<Wrong>([
        { content: line(tOf(ratAdd(m(row.c[0], mu), m(row.c[1], l)))), rule: 'vec-lc-swapped' },
        { content: line(tOf(flipped)), rule: 'vec-dot-sign' },
        { content: line(ratNeg(R(tStar))), rule: 'vec-param-solve' },
      ]),
    ]
    const tTerm = linLatex(c0, R(s), t)
    steps.push(
      choiceStep(rng, {
        id: 'parameter',
        title: `$${t}$ bestimmen`,
        question: `Setze $${unk[0]} = ${ratLatex(l)}$ und $${unk[1]} = ${ratLatex(mu)}$ in (${ROMAN[k]}) ein. Für welches $${t}$ stimmt sie?`,
        correct: line(R(tStar)),
        wrongs,
        hint: `Links steht eine Zahl, rechts ein Term mit $${t}$. Setz beides gleich und stell nach $${t}$ um.`,
        explanation: {
          detailed: `(${ROMAN[k]}): $${productsLatex(pairs)} = ${tTerm}$, also $${ratLatex(val)} = ${tTerm}$ und $${t} = ${tStar}$. Nur für diesen Wert liegt $${target}$ im Spann.`,
          short: `$${ratLatex(val)} = ${tTerm}$, also $${t} = ${tStar}$.`,
        },
        established: [`${t} = ${tStar}`],
        cards: [CARD.linearkombination, CARD.parameter],
      }),
    )
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = [
      { v: a, name: vn[0], color: 'a' },
      { v: b, name: vn[1], color: 'b' },
    ]
    if (dim === 3) steps[0] = { ...steps[0], drawing: spanFigure({ dim: 3, items, plane: [a, b], caption: `Der Spann von $${vn[0]}$ und $${vn[1]}$ ist eine Ebene. Für ein passendes $${t}$ liegt $${target}$ darin.` }) }
    return {
      kind: 'basisSpanParam',
      instruction: `Für welchen Wert von $${t}$ liegt $${target}$ im Spann von $${vn[0]}$ und $${vn[1]}$?`,
      functionLatex: `${vn[0]} = ${vecLatex(a)},\\; ${vn[1]} = ${vecLatex(b)},\\; ${target} = ${vLatex}`,
      steps,
      cards: [CARD.linearkombination, CARD.parameter],
      resultLatex: `${t} = ${tStar}`,
      ...(dim === 3
        ? {
            resultDrawing: spanFigure({
              dim: 3,
              items,
              plane: [a, b],
              target: { v: w, name: target, color: 'r' },
              chain: [
                { k: l, v: a, name: vn[0], color: 'a' },
                { k: mu, v: b, name: vn[1], color: 'b' },
              ],
              caption: `Für $${t} = ${tStar}$ ist $${target} = ${coefLatex(l, true)}${vn[0]} ${coefLatex(mu, false)}${vn[1]}$ und liegt in der Ebene.`,
            }),
          }
        : {}),
      form: `basisSpanParam|${level}|${key}|${t}|${i}${j}${k}|${s}|${signShape(a, b)}|${sgnKey([l, mu, R(tStar)])}`,
      data: { a: nums(a), b: nums(b), base: nums(base), slope: nums(slope) },
      answer: [tStar],
    }
  }
}

// Parameter so, dass a, b, c(t) linear abhängig sind (keine Basis): Determinante linear in t. Stufe 5 schreibt c dann als
// Linearkombination von a und b
function buildParam(rng: Rng, level: Level): Built {
  const { vn, unk, key } = names(rng)
  const t = rng.pick(PARAM_NAMES)
  for (;;) {
    const [a, b] = pickPair(rng, 3, 3)
    const [k, l] = pickCoefs(rng, 2)
    const cStar = combine([k, l], [a, b])
    const n = cross(a, b)
    const js = [0, 1, 2].filter((j) => !isZero(n[j]))
    const j = rng.pick(js)
    const tStar = cStar[j]
    if (tooBig(cStar, 8) || zeroCount(cStar) > 1 || parallel(a, cStar) || parallel(b, cStar)) continue
    if (level === 5 && !allDistinct([tStar, k, l])) continue
    const C: PVec = { base: cStar.map((x, i) => (i === j ? rat(0) : x)), slope: cStar.map((_, i) => (i === j ? rat(1) : rat(0))) }
    const pv = (v: Vec): PVec => ({ base: v, slope: vec(0, 0, 0) })
    const nm = vn.slice(0, 3)
    const detName = `\\det(${nm.join(', ')})`
    const det = tripleQuad(spatProduct, pv(a), pv(b), C)
    const steps: GuidedStep[] = [sarrusStep(rng, nm[0], nm[1], nm[2], pv(a), pv(b), C, t, { name: detName, title: 'Determinante mit Sarrus', card: CARD.unabhaengig })]
    const root = (q: Quad) => (isZero(q.q2) && !isZero(q.q1) ? ratDiv(ratNeg(q.q0), q.q1) : null)
    const line = (x: Rational) => math(`${t} = ${ratLatex(x)}`)
    const tWrongs: Wrong[] = []
    if (!isZero(tStar)) tWrongs.push({ content: line(ratNeg(tStar)), rule: 'vec-param-solve' })
    for (const [f, rule] of [[sarrusPlus, 'vec-sarrus-plus'], [sarrusOne, 'vec-sarrus-one-diagonal']] as const) {
      const r = root(tripleQuad(f, pv(a), pv(b), C))
      if (r && !isZero(ratSub(r, tStar))) tWrongs.push({ content: line(r), rule })
    }
    tWrongs.push({ content: math(`${t} \\ne ${ratLatex(tStar)}`), rule: 'vec-indep-swapped' })
    const detLatex = termsLatex([
      [det.q1, t],
      [det.q0, ''],
    ])
    steps.push(
      choiceStep(rng, {
        id: 'parameter',
        title: `$${t}$ bestimmen`,
        question: `Für welchen Wert von $${t}$ sind $${nm[0]}$, $${nm[1]}$, $${nm[2]}$ linear abhängig?`,
        correct: line(tStar),
        wrongs: [tWrongs[0], ...rng.shuffle(tWrongs.slice(1))],
        hint: `Linear abhängig heißt: Die Determinante ist $0$. Setz $${detLatex}$ gleich $0$ und stell nach $${t}$ um.`,
        explanation: {
          detailed: `$${detName} = ${detLatex} = 0$ ergibt $${t} = ${ratLatex(tStar)}$. Für diesen Wert liegen die drei Vektoren in einer Ebene und sind keine Basis; für jeden anderen Wert sind sie eine Basis des Raums.`,
          short: `$${detLatex} = 0$, also $${t} = ${ratLatex(tStar)}$.`,
        },
        established: [`${t} = ${ratLatex(tStar)}`],
        cards: [CARD.unabhaengig, CARD.parameter],
      }),
    )
    if (level === 5) {
      const rc = pickRows(rng, a, b)
      if (!rc) continue
      const rows = rowsOf([a, b], cStar)
      steps.push(systemStep(rng, { names: [nm[0], nm[1]], vs: [a, b], target: nm[2], targetLatex: vecLatex(cStar), rows, unk }))
      steps.push(...solveTwo(rng, rows, rc[0], rc[1], unk, [k, l]))
    }
    if (steps.some((st) => st.choices.length < 3)) continue
    const items: Item[] = [
      { v: a, name: nm[0], color: 'a' },
      { v: b, name: nm[1], color: 'b' },
    ]
    steps[0] = { ...steps[0], drawing: spanFigure({ dim: 3, items, plane: [a, b], caption: `Die Ebene von $${nm[0]}$ und $${nm[1]}$. Für ein $${t}$ liegt auch $${nm[2]}$ darin.` }) }
    const cLatex = columnLatex(cStar.map((x, i) => (i === j ? t : ratLatex(x))))
    return {
      kind: 'basisParam',
      instruction:
        level === 4
          ? `Für welchen Wert von $${t}$ sind $${nm[0]}$, $${nm[1]}$, $${nm[2]}$ linear abhängig, also keine Basis des Raums?`
          : `Für welchen Wert von $${t}$ sind $${nm[0]}$, $${nm[1]}$, $${nm[2]}$ linear abhängig? Schreib $${nm[2]}$ für diesen Wert als Linearkombination $${combLatex(unk, nm.slice(0, 2), nm[2])}$.`,
      functionLatex: `${nm[0]} = ${vecLatex(a)},\\; ${nm[1]} = ${vecLatex(b)},\\; ${nm[2]} = ${cLatex}`,
      steps,
      cards: [CARD.unabhaengig, CARD.parameter],
      resultLatex: level === 4 ? `${t} = ${ratLatex(tStar)}` : `${t} = ${ratLatex(tStar)},\\; ${valuesLatex(unk, [k, l])}`,
      resultDrawing: spanFigure({
        dim: 3,
        items,
        plane: [a, b],
        target: { v: cStar, name: nm[2], color: 'r' },
        chain: [
          { k, v: a, name: nm[0], color: 'a' },
          { k: l, v: b, name: nm[1], color: 'b' },
        ],
        caption: `Für $${t} = ${ratLatex(tStar)}$ ist $${nm[2]} = ${coefLatex(k, true)}${nm[0]} ${coefLatex(l, false)}${nm[1]}$: Alle drei liegen in einer Ebene.`,
      }),
      form: `basisParam|${level}|${key}|${t}|${j}|${signShape(a, b)}|${sgnKey([k, l, tStar])}`,
      data: { a: nums(a), b: nums(b), c: nums(C.base), j: [j] },
      answer: level === 4 ? [num(tStar)] : [num(tStar), num(k), num(l)],
    }
  }
}

export const BASIS_BUILDERS = {
  basisComb: buildComb,
  basisSpan: buildSpan,
  basisIndep: buildIndep,
  basisDim: buildDim,
  basisCoords: buildCoords,
  basisSpanParam: buildSpanParam,
  basisParam: buildParam,
} satisfies Readonly<Record<string, (rng: Rng, level: Level) => Built>>
