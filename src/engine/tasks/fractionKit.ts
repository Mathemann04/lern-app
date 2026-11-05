import { factoredPoly, reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import { type Poly, atomsOf, constValue, polyAdd, polyContent, polyAtom, polyConst, polyDivideExact, polyEquals, polyMul, polyNeg, polyPow, polyProduct, polyScale, polySub, polySum, primitivePart, totalDegree } from '../fraction/poly.ts'
import { reduceImag, rootOf, sumRootOf } from '../fraction/frac.ts'
import { complexParts, imagParts } from '../fraction/complex.ts'
import { rat, ratAbs, ratDiv } from '../rational.ts'
import { fractionWrongAnswers } from '../fraction/errorRules.ts'
import { type FracSolution, cancelledFactor, isPlayableTree, solveFraction, solveTree } from '../fraction/solve.ts'
import { toLatex } from '../expr/print.ts'
import {
  type FractionTask,
  type Part,
  type Shown,
  type Signed,
  type TreeNode,
  type TreeTerm,
  binomialShown,
  expanded,
  factoredShown,
  leaf,
  minus,
  plus,
  overNode,
  part,
  partExpr,
  partFrac,
  productNode,
  quotientNode,
  sumNode,
  isWhole,
  shownPoly,
  taskFrac,
  taskLatex,
  term,
  treeFrac,
  treeLeaves,
} from '../fraction/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import type { Level } from './taskNumber.ts'

// Baukasten für Bruchaufgaben (M2b): Statt weniger fester Vorlagen wird jede Aufgabe aus Teilen
// zusammengesetzt: zwei bis vier Brüche, Rechenarten gemischt (Punkt vor Strich, Klammern,
// Doppelbruch), je Stufe eigene Arten von Brüchen. So unterscheiden sich Aufgaben in ihrer Form,
// nicht nur in den Zahlen (Kennzahlen: fractionTerms.test.ts).

type LeafMaker = (rng: Rng) => TreeNode

type Kit = {
  // Anzahl der Brüche mit Gewichten, z. B. [[2, 3], [3, 4], [4, 2]]
  readonly sizes: ReadonlyArray<readonly [number, number]>
  // Rechenart eines Knotens mit Gewichten
  readonly ops: ReadonlyArray<readonly [TreeNode['kind'], number]>
  // Blätter: der Reihe nach mit Gewichten
  readonly leaves: ReadonlyArray<readonly [LeafMaker, number]>
  // höchstens eine Dezimalzahl je Aufgabe (Stufe 1)
  readonly decimal?: LeafMaker
  // Grenzen: größter Betrag von Zahlen in Teil- und Endergebnissen, Länge der Aufgabe
  readonly maxNumber: number
  readonly maxLatex: number
  // zusätzliche Bedingung an den Baum, z. B. mindestens ein echter Bruch
  readonly accept?: (root: TreeNode, rng: Rng) => boolean
  // bekannte Faktoren der Aufgabe (Klammern der Welt, Stufen 3 und 4)
  readonly hints?: readonly Poly[]
  // zusätzliche Bedingung an das Ergebnis, z. B. nicht zu lang
  readonly result?: (solution: FracSolution) => boolean
  // Doppelbruch auch im Inneren (Stufe 5: Doppelbruch im Doppelbruch)
  readonly nestedOver?: boolean
  // Blätter mit dem Wert 1 erlaubt (Kettenbrüche wie \frac{1}{1 + \frac{1}{x}})
  readonly ones?: boolean
}

const weighted = <T>(rng: Rng, items: ReadonlyArray<readonly [T, number]>): T => {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rng.next() * total
  for (const [item, w] of items) {
    r -= w
    if (r < 0) return item
  }
  return items[items.length - 1][0]
}

const numberPart = (n: number, d = 1): Part => part(expanded(polyConst(n)), expanded(polyConst(d)))
const polyPart = (n: Poly, d: Poly): Part => part(expanded(n), expanded(d))

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

// --- Bäume ---

// Teilt n in k positive Teile
function split(rng: Rng, n: number, k: number): number[] {
  const parts = Array.from({ length: k }, () => 1)
  for (let rest = n - k; rest > 0; rest--) parts[rng.int(0, k - 1)]++
  return parts
}

function randomNode(rng: Rng, kit: Kit, size: number, depth: number, state: { decimals: number }): TreeNode {
  if (size === 1) {
    if (kit.decimal && state.decimals === 0 && rng.chance(0.15)) {
      state.decimals++
      return kit.decimal(rng)
    }
    return weighted(rng, kit.leaves)(rng)
  }
  // Doppelbruch nicht im Doppelbruch (Stufe 5: eine Ebene tiefer), Tiefe begrenzt
  const ops = kit.ops.filter(([op]) => !(op === 'over' && depth > (kit.nestedOver ? 1 : 0)))
  const op = depth >= 2 ? 'sum' : weighted(rng, ops)
  if (op === 'sum') {
    // meist zwei Summanden (darin weitere Rechenarten), seltener drei nebeneinander
    const k = size === 2 || rng.chance(0.65) ? 2 : Math.min(size, 3)
    const terms: TreeTerm[] = []
    split(rng, size, k).forEach((s, i) => {
      const node = randomNode(rng, kit, s, depth + 1, state)
      // eine Summe als Summand: nach einem Minus in Klammern, sonst ohne Klammer eingereiht
      if (node.kind === 'sum') {
        if (i > 0 && rng.chance(0.7)) terms.push(term(-1, node))
        else terms.push(...node.terms)
        return
      }
      // erster Summand meist mit Plus
      terms.push(term(i === 0 ? (rng.chance(0.15) ? -1 : 1) : rng.chance(0.5) ? -1 : 1, node))
    })
    return sumNode(...terms)
  }
  const [l, r] = split(rng, size, 2)
  const left = randomNode(rng, kit, l, depth + 1, state)
  const right = randomNode(rng, kit, r, depth + 1, state)
  // a · (b · c) und a · (b : c) ohne überflüssige Klammer: (a · b) · c bzw. (a · b) : c
  if (op === 'product' && (right.kind === 'product' || right.kind === 'quotient')) return { kind: right.kind, left: productNode(left, right.left), right: right.right }
  if (op === 'product') return productNode(left, right)
  if (op === 'quotient') return quotientNode(left, right)
  return overNode(left, right)
}

// --- Prüfen ---

const biggest = (f: Frac): number => Math.max(...[...f.num, ...f.den].map((t) => Math.abs(Number(t.coef.n)) + Number(t.coef.d)))

// Aufgabe aus einem Baum: brauchbar? (Wert nicht 0, Zahlen klein, spielbar, nicht zu lang); einteilige
// Bäume ohne Dezimalzahl werden zur gewohnten Aufgabenform (Summe, mal, geteilt, Doppelbruch)
export function taskFromTree(root: TreeNode, kit: Pick<Kit, 'maxNumber' | 'maxLatex' | 'hints' | 'result' | 'ones'>, level: Level): FractionTask | null {
  const t: Extract<FractionTask, { kind: 'tree' }> = { kind: 'tree', root, hints: kit.hints ?? [] }
  let solution
  try {
    const value = treeFrac(root)
    if (value.num.length === 0) return null
    solution = solveTree(t)
  } catch {
    return null
  }
  if (!isPlayableTree(t)) return null
  const reduced = reduceFrac(solution.value, t.hints)
  if (biggest({ num: reduced.num, den: factoredPoly(reduced.den) }) > kit.maxNumber) return null
  // Teilergebnisse klein und nicht ±1 (sonst folgt „mal 1" oder „geteilt durch 1"); kein Blatt ist 1
  for (const [i, stage] of solution.stages.entries()) {
    if (biggest(stage.solution.value) > kit.maxNumber * 4) return null
    if (stage.solution.reduced.num.length > 4) return null
    const r = stage.solution.reduced
    const one = r.den.factors.length === 0 && r.num.length === 1 && r.num[0].mono.length === 0 && ratAbs(ratDiv(r.num[0].coef, r.den.coef)).n === 1n && ratAbs(ratDiv(r.num[0].coef, r.den.coef)).d === 1n
    if ((one || r.num.length === 0) && i < solution.stages.length - 1) return null
  }
  if (!kit.ones && treeLeaves(root).some((l) => { const v = partFrac(l.part); return polyEquals(v.num, v.den) })) return null
  if (level >= 2 && atomsOf(reduced.num).length === 0 && reduced.den.factors.length === 0) return null
  if (totalDegree(reduced.num) > 6) return null
  if (kit.result && !kit.result(solution)) return null
  const simple = solution.stages.length === 1 && solution.steps[0]?.kind !== 'decimal' ? solution.stages[0].task : t
  if (taskLatex(simple).length > kit.maxLatex) return null
  // geführt braucht die letzte Frage falsche Ergebnisse aus typischen Fehlern
  if (!fractionWrongAnswers(simple).some((w) => w.value && !w.freeOnly)) return null
  return simple
}

export function buildFromKit(rng: Rng, kit: Kit, level: Level): FractionTask {
  for (;;) {
    const size = weighted(rng, kit.sizes)
    const root = randomNode(rng, kit, size, 0, { decimals: 0 })
    if (kit.accept && !kit.accept(root, rng)) continue
    const task = taskFromTree(root, kit, level)
    if (task) return task
  }
}

// --- Stufe 1: Zahlenbrüche ---

// echter Bruch a/b (gekürzt), manchmal unecht
function numberFraction(rng: Rng): TreeNode {
  const d = rng.int(2, 12)
  const options = Array.from({ length: d * (rng.chance(0.2) ? 2 : 1) - 1 }, (_, i) => i + 1).filter((n) => gcd(n, d) === 1 && n !== d)
  return leaf(numberPart(rng.pick(options), d))
}

const wholeNumber = (rng: Rng): TreeNode => leaf(numberPart(rng.int(2, 6)))

// Dezimalzahlen mit kurzem Bruch
const DECIMALS: ReadonlyArray<readonly [string, number, number]> = [
  ['0,1', 1, 10],
  ['0,2', 1, 5],
  ['0,25', 1, 4],
  ['0,3', 3, 10],
  ['0,4', 2, 5],
  ['0,5', 1, 2],
  ['0,6', 3, 5],
  ['0,75', 3, 4],
  ['0,8', 4, 5],
  ['1,2', 6, 5],
  ['1,25', 5, 4],
  ['1,5', 3, 2],
  ['1,75', 7, 4],
  ['2,5', 5, 2],
  ['0,125', 1, 8],
  ['0,375', 3, 8],
]

function decimalLeaf(rng: Rng): TreeNode {
  const [shown, n, d] = rng.pick(DECIMALS)
  return leaf(numberPart(n, d), shown)
}

export const LEVEL1_KIT: Kit = {
  sizes: [
    [2, 1],
    [3, 4],
    [4, 4],
  ],
  ops: [
    ['sum', 3.5],
    ['product', 2],
    ['quotient', 2],
    ['over', 1.5],
  ],
  leaves: [
    [numberFraction, 5],
    [wholeNumber, 2],
  ],
  decimal: decimalLeaf,
  maxNumber: 150,
  maxLatex: 110,
  // mindestens ein echter Bruch (nicht nur ganze Zahlen und Dezimalzahlen); drei Brüche nur mit Plus
  // und Minus seltener, damit diese Grundform nicht überwiegt
  accept: (root, rng) => {
    const plain = (n: TreeNode) => n.kind === 'leaf' && !n.decimal && !isWhole(n.part)
    if (root.kind === 'sum' && root.terms.length === 3 && root.terms.every((t) => plain(t.node)) && rng.chance(0.5)) return false
    return treeLeaves(root).some(plain) && !hasTrivialPart(root)
  },
}

// Zu einfache Teile: zwei ganze Zahlen mal, geteilt oder als Bruch (2 · 5), oder dieselbe Zahl mit
// Plus und Minus nebeneinander (5 − 5)
function hasTrivialPart(n: TreeNode): boolean {
  const whole = (m: TreeNode) => m.kind === 'leaf' && !m.decimal && isWhole(m.part)
  if (n.kind === 'leaf') return false
  if (n.kind === 'sum') {
    const cancels = n.terms.some((a, i) =>
      n.terms.some((b, j) => i !== j && a.sign !== b.sign && a.node.kind === 'leaf' && b.node.kind === 'leaf' && fracEqualsPart(a.node.part, b.node.part)),
    )
    return cancels || n.terms.some((t) => hasTrivialPart(t.node))
  }
  return (whole(n.left) && whole(n.right)) || hasTrivialPart(n.left) || hasTrivialPart(n.right)
}

const fracEqualsPart = (a: Part, b: Part) => {
  const [fa, fb] = [partFrac(a), partFrac(b)]
  return polyEquals(polyMul(fa.num, fb.den), polyMul(fb.num, fa.den))
}

// Großen Bruch kürzen: 84/126
export function bigReduce(rng: Rng): FractionTask {
  const d = rng.int(3, 12)
  const n = rng.pick(Array.from({ length: d - 1 }, (_, i) => i + 1).filter((k) => gcd(k, d) === 1))
  const k = rng.pick([12, 14, 15, 16, 18, 21, 24, 28, 35, 36])
  return { kind: 'reduce', part: numberPart(n * k, d * k), hints: [] }
}

// --- Stufe 2: Buchstaben in Produkten ---

const LETTER_POOL = ['a', 'b', 'c', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z']

// Produkt k · Buchstaben mit Hochzahlen
const mono = (k: number, letters: ReadonlyArray<readonly [string, number]>): Poly =>
  letters.reduce((p, [l, e]) => (e > 0 ? polyMul(p, polyAtom(l, e)) : p), polyConst(k))

// Bruch aus zwei Produkten, gekürzt (gekürzt wird in der Aufgabe über Kreuz, nicht im einzelnen Bruch)
function reducedLeaf(num: Poly, den: Poly): TreeNode {
  const r = reduceFrac({ num, den })
  return leaf(polyPart(r.num, factoredPoly(r.den)))
}

// Blätter für einen Satz Buchstaben
function monomialLeaves(letters: readonly string[]): ReadonlyArray<readonly [LeafMaker, number]> {
  const some = (rng: Rng, max: number) =>
    rng
      .shuffle([...letters])
      .slice(0, rng.int(1, Math.min(2, letters.length)))
      .map((l) => [l, rng.int(1, max)] as const)
  const coef = (rng: Rng) => rng.pick([1, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15])
  return [
    // \frac{3a^2}{4b}
    [(rng) => reducedLeaf(mono(coef(rng), some(rng, 3)), mono(coef(rng), some(rng, 3))), 5],
    // \frac{2}{3x}
    [(rng) => reducedLeaf(polyConst(rng.int(1, 7)), mono(coef(rng), some(rng, 2))), 3],
    // \frac{a}{b}
    [
      (rng) => {
        const [u, v] = rng.shuffle([...letters])
        return v ? leaf(polyPart(polyAtom(u), polyAtom(v))) : reducedLeaf(polyConst(rng.int(1, 5)), polyAtom(u))
      },
      1,
    ],
    // 2a oder eine Zahl
    [(rng) => leaf(polyPart(rng.chance(0.5) ? mono(rng.int(2, 5), some(rng, 2)) : polyConst(rng.int(2, 5)), polyConst(1))), 1],
  ]
}

export function level2Kit(rng: Rng): Kit {
  const letters = rng.shuffle([...LETTER_POOL]).slice(0, rng.int(1, 3))
  return {
    sizes: [
      [2, 4],
      [3, 4],
      [4, 1],
    ],
    ops: [
      ['sum', 4],
      ['product', 3],
      ['quotient', 3],
      ['over', 1],
    ],
    leaves: monomialLeaves(letters),
    maxNumber: 200,
    maxLatex: 120,
  }
}

// Großes Produkt kürzen, auch mit Minus: \frac{-15r^2s^3t}{25rs^5t^2}
export function monomialReduce(rng: Rng): FractionTask {
  const letters = rng.shuffle([...LETTER_POOL]).slice(0, rng.int(2, 3))
  const g = rng.pick([2, 3, 4, 5, 6, 7])
  const top = mono(g * rng.pick([1, 2, 3, 5]) * (rng.chance(0.3) ? -1 : 1), letters.map((l) => [l, rng.int(0, 4)] as const))
  const bottom = mono(g * rng.pick([1, 2, 3, 4, 5]), letters.map((l) => [l, rng.int(0, 4)] as const))
  return { kind: 'reduce', part: polyPart(top, bottom), hints: [] }
}

// --- Stufen 3 und 4: Summen in Zähler und Nenner ---

// Welt einer Aufgabe: Buchstaben (bzw. Bausteine wie e^x) und Klammern, aus denen Zähler und Nenner
// gebaut werden. So haben die Brüche einer Aufgabe gemeinsame Faktoren: Hauptnenner, Kürzen über
// Kreuz, Kürzen nach dem Zerlegen.
export type World = {
  readonly letters: readonly string[]
  readonly factors: readonly Poly[]
  // nur diese Zähler und Nenner (statt beliebiger Produkte der Klammern), z. B. bei dritten Potenzen
  readonly products?: readonly Poly[]
}

// a · u + b (bzw. a · u + b · v)
const linearIn = (a: number, u: string, b: number, v?: string): Poly =>
  polyAdd(polyScale(polyAtom(u), rat(a)), v ? polyScale(polyAtom(v), rat(b)) : polyConst(b))

const call = <T>(rng: Rng, items: ReadonlyArray<readonly [() => T, number]>): T => weighted(rng, items)()

const LETTER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['a', 'b'],
  ['x', 'y'],
  ['m', 'n'],
  ['r', 's'],
  ['u', 'v'],
  ['p', 'q'],
]

// x meistens, sonst ein anderer Buchstabe
const oneLetter = (rng: Rng) => rng.pick(['x', 'x', 'x', 'a', 'b', 't', 'z', 'u', 'y', 'n'])

const distinctNonZero = (rng: Rng, count: number, max: number): number[] => {
  const values: number[] = []
  while (values.length < count) {
    const v = (rng.chance(0.5) ? 1 : -1) * rng.int(1, max)
    if (!values.includes(v)) values.push(v)
  }
  return values
}

// Stufe 3: x ± p (auch 2x ± 3 für Quadrate wie (2x − 3)²) oder zwei Buchstaben a ± b
export function level3World(rng: Rng): World {
  if (rng.chance(0.3)) {
    const [u, v] = rng.pick(LETTER_PAIRS)
    return { letters: [u, v], factors: [linearIn(1, u, 1, v), linearIn(1, u, -1, v)] }
  }
  const u = oneLetter(rng)
  if (rng.chance(0.25)) {
    const k = rng.int(2, 3)
    const q = rng.pick([1, 2, 4, 5].filter((n) => gcd(n, k) === 1))
    return { letters: [u], factors: [linearIn(k, u, q), linearIn(k, u, -q)] }
  }
  const p = rng.int(1, 6)
  return { letters: [u], factors: [linearIn(1, u, p), linearIn(1, u, -p)] }
}

// Stufe 4: drei Klammern x − r (auch mit Zahl vorn wie 2x − 3), zwei Buchstaben wie a − 2b, Gruppen
// wie (a + b)(x − y), Bausteine e^x, ln x, sin x, cos x
export function level4World(rng: Rng): World {
  const kind = weighted(rng, [
    ['one', 5],
    ['two', 2],
    ['group', 2],
    ['block', 1.5],
  ] as const)
  if (kind === 'two') {
    const [u, v] = rng.pick(LETTER_PAIRS)
    return { letters: [u, v], factors: distinctNonZero(rng, 3, 3).map((c) => linearIn(1, u, c, v)) }
  }
  if (kind === 'group') {
    const [[s, s2], [t, t2]] = rng.shuffle([...LETTER_PAIRS]).slice(0, 2)
    // (a + b) bzw. (a + 2): erster Faktor; (x − y) und (x + y) bzw. (x − 3) und (x + 3): zweiter
    const first = rng.chance(0.5) ? linearIn(1, s, rng.pick([1, -1]), s2) : linearIn(1, s, (rng.chance(0.5) ? 1 : -1) * rng.int(1, 4))
    const twoLetters = rng.chance(0.5)
    const m = twoLetters ? 1 : rng.int(1, 4)
    const second = (sign: number) => (twoLetters ? linearIn(1, t, sign * m, t2) : linearIn(1, t, sign * m))
    return { letters: [s, t], factors: [first, second(1), second(-1)] }
  }
  if (kind === 'block') {
    const u = rng.pick(['E', 'L', 'S', 'C'])
    // bei sin und cos nicht 1: 1 − sin² x wäre schon eine Regel der Winkelfunktionen
    const min = u === 'S' || u === 'C' ? 2 : 1
    const p = rng.int(min, 4)
    return { letters: [u], factors: [linearIn(1, u, p), linearIn(1, u, -p)] }
  }
  const u = oneLetter(rng)
  const roots = distinctNonZero(rng, 3, 6)
  const factors = roots.map((r) => linearIn(1, u, -r))
  // Zahl vorn: 2x − 3, 3x + 1
  if (rng.chance(0.4)) {
    const k = rng.int(2, 3)
    factors[2] = linearIn(k, u, rng.pick([1, 2, 4, 5].filter((n) => gcd(n, k) === 1)) * (rng.chance(0.5) ? 1 : -1))
  }
  return { letters: [u], factors }
}

// Zähler oder Nenner aus der Welt: eine oder zwei Klammern (eine auch im Quadrat), dazu manchmal
// eine Zahl oder ein Buchstabe davor, z. B. 2x − 6, x² + 3x, x² − 9, x² + 6x + 9
function worldPoly(rng: Rng, w: World, brackets: number): Poly {
  if (w.products) return rng.chance(0.2) ? polyScale(rng.pick(w.products), rat(rng.int(2, 3))) : rng.pick(w.products)
  const chosen = rng.shuffle([...w.factors]).slice(0, brackets)
  let p = polyProduct(chosen)
  if (brackets === 1 && rng.chance(0.2)) p = polyMul(p, chosen[0])
  if (rng.chance(0.25)) p = polyScale(p, rat(rng.int(2, 4)))
  else if (brackets === 1 && rng.chance(0.3)) p = polyMul(p, polyAtom(rng.pick(w.letters)))
  return p
}

function worldNumerator(rng: Rng, w: World): Poly {
  return call(rng, [
    [() => polyConst(rng.int(1, 6)), 4],
    [() => polyAtom(rng.pick(w.letters)), 2],
    [() => polyScale(polyAtom(rng.pick(w.letters)), rat(rng.int(2, 5))), 1],
    [() => rng.pick(w.factors), 3],
    [() => polyScale(rng.pick(w.factors), rat(rng.int(2, 3))), 1],
  ])
}

// Bruch mit Summen: Nenner aus der Welt, Zähler klein; der einzelne Bruch ist schon gekürzt (gekürzt
// wird erst in der Aufgabe, z. B. über Kreuz). Manchmal steht eine Klammer vertauscht da: b − a.
function termLeaf(rng: Rng, w: World): TreeNode {
  for (;;) {
    const den = worldPoly(rng, w, rng.chance(0.45) ? 2 : 1)
    const num = worldNumerator(rng, w)
    const f = { num, den }
    if (cancelledFactor(f, reduceFrac(f, w.factors), w.factors)) continue
    if (isDifference(den) && rng.chance(0.3)) return leaf(part(expanded(num), expanded(polyNeg(den), true)))
    return leaf(polyPart(num, den))
  }
}

// Einfacher Bruch: 3/x, 1/x², eine ganze Zahl, x, a/b
function simpleLeaf(rng: Rng, w: World): TreeNode {
  const [u, v] = rng.shuffle([...w.letters])
  return call(rng, [
    [() => leaf(polyPart(polyConst(rng.int(1, 5)), polyAtom(u, rng.int(1, 2)))), 4],
    [() => leaf(numberPart(rng.int(1, 4))), 2],
    [() => leaf(polyPart(polyAtom(u), polyConst(1))), 1],
    [() => (v ? leaf(polyPart(polyAtom(u), polyAtom(v))) : leaf(polyPart(polyConst(rng.int(1, 3)), polyAtom(u)))), 1],
  ])
}

// Kürzen: Zähler und Nenner mit gemeinsamem Faktor, ausmultipliziert, z. B. \frac{x^2 - 9}{2x + 6},
// \frac{a^2 - b^2}{ab - b^2}, \frac{2x^2 - x - 3}{x^2 - 1}, \frac{3 - x}{x^2 - 9}
export function worldReduce(rng: Rng, w: World, level: Level): FractionTask {
  // Stufe 4: Klammer mit Zahl vorn (2x − 3) oft im Zähler, damit 2x² − x − 3 zu zerlegen ist
  const lead = level >= 4 ? w.factors.find((f) => f[0].coef.n !== 1n) : undefined
  for (;;) {
    const useLead = lead !== undefined && rng.chance(0.6)
    const common = useLead ? rng.pick(w.factors.filter((f) => f !== lead)) : rng.pick(w.factors)
    const cofactor = () =>
      call(rng, [
        [() => polyConst(1), 2],
        [() => polyConst(rng.int(2, 6)), 2],
        [() => polyAtom(rng.pick(w.letters)), 2],
        [() => polyScale(polyAtom(rng.pick(w.letters)), rat(rng.int(2, 4))), 1],
        [() => rng.pick(w.factors.filter((f) => f !== common)), 3],
        [() => common, 1],
      ])
    const [a, b] = [useLead ? lead : cofactor(), cofactor()]
    if (constValue(a) && constValue(b)) continue
    const num = polyMul(common, a)
    const den = polyMul(common, b)
    // vertauschte Differenz im Zähler: 3 − x statt x − 3
    const flip = isDifference(num) && rng.chance(0.4)
    const task: FractionTask = { kind: 'reduce', part: part(expanded(flip ? polyNeg(num) : num, flip), expanded(den)), hints: w.factors }
    if (isUsable(task, level, 110)) return task
  }
}

// Differenz aus zwei Summanden (x − 3, a − b): vertauscht geschrieben 3 − x, b − a
const isDifference = (p: Poly) => p.length === 2 && (p[0].coef.n < 0n) !== (p[1].coef.n < 0n)

// Ergebnis nicht zu lang: Zähler mit höchstens drei Summanden und Grad 3
const shortResult = (solution: FracSolution) =>
  solution.reduced.num.length <= 3 && totalDegree(solution.reduced.num) <= 3 && toLatex(solution.result).length <= 70

// Brauchbar: Zahlen klein, Ergebnis mit Buchstabe und kurz, falsche Antworten aus typischen Fehlern,
// nicht zu lang
function isUsable(task: FractionTask, level: Level, maxLatex: number): boolean {
  const solution = solveFraction(task)
  const reduced = solution.reduced
  if (!shortResult(solution)) return false
  if (biggest({ num: reduced.num, den: factoredPoly(reduced.den) }) > 200) return false
  if (level >= 2 && atomsOf(reduced.num).length === 0 && reduced.den.factors.length === 0) return false
  if (taskLatex(task).length > maxLatex) return false
  return fractionWrongAnswers(task, solution).some((wr) => wr.value && !wr.freeOnly)
}

function worldKit(w: World, level: Level): Kit {
  const four = level >= 4
  return {
    sizes: four
      ? [
          [2, 5],
          [3, 3],
          [4, 1],
        ]
      : [
          [2, 5],
          [3, 2],
        ],
    ops: [
      ['sum', 5],
      ['product', 2],
      ['quotient', 2],
      ...(four ? ([['over', 2]] as const) : []),
    ],
    leaves: [
      [(rng) => termLeaf(rng, w), 5],
      [(rng) => simpleLeaf(rng, w), four ? 2.5 : 1.5],
    ],
    maxNumber: 200,
    maxLatex: four ? 130 : 115,
    hints: w.factors,
    result: shortResult,
    // mindestens ein Bruch mit einer Summe im Zähler oder Nenner
    accept: (root) => treeLeaves(root).some((l) => partFrac(l.part).den.length >= 2 || partFrac(l.part).num.length >= 2),
  }
}

export function buildLevel3(rng: Rng): FractionTask {
  const w = level3World(rng)
  return rng.chance(0.3) ? worldReduce(rng, w, 3) : buildFromKit(rng, worldKit(w, 3), 3)
}

// Doppelbruch: oben und unten je ein Bruch oder eine Summe aus zwei Brüchen, z. B.
// \frac{\frac{1}{a} - \frac{1}{b}}{\frac{1}{a^2} - \frac{1}{b^2}}, \frac{1 + \frac{2}{x}}{1 - \frac{4}{x^2}}
function worldComplex(rng: Rng, w: World, level: Level): FractionTask {
  const one = (simple: number) => (rng.chance(simple) ? simpleLeaf(rng, w) : termLeaf(rng, w))
  // zwei Brüche mit verschiedenen Nennern (nicht \frac{5}{x} + \frac{5}{x})
  const pair = (): TreeNode => {
    for (;;) {
      const [a, b] = [one(0.8), one(0.6)]
      if (a.kind === 'leaf' && b.kind === 'leaf' && polyEquals(partFrac(a.part).den, partFrac(b.part).den)) continue
      return sumNode(term(1, a), term(rng.chance(0.5) ? -1 : 1, b))
    }
  }
  const side = (size: number) => (size === 1 ? one(0.4) : pair())
  for (;;) {
    const [top, bottom] = rng.pick([
      [2, 2],
      [2, 2],
      [2, 1],
      [1, 2],
    ])
    const task = taskFromTree(overNode(side(top), side(bottom)), { maxNumber: 200, maxLatex: 130, hints: w.factors, result: shortResult }, level)
    if (task) return task
  }
}

export function buildLevel4(rng: Rng): FractionTask {
  const w = level4World(rng)
  const kind = weighted(rng, [
    ['reduce', 3],
    ['complex', 1.5],
    ['kit', 5.5],
  ] as const)
  if (kind === 'reduce') return worldReduce(rng, w, 4)
  if (kind === 'complex') return worldComplex(rng, w, 4)
  return buildFromKit(rng, worldKit(w, 4), 4)
}

// --- Stufe 5: Profi, quer durch das ganze Thema (M2b Schritt 3) ---

// Dritte Potenzen: u − c und u² + cu + c² (zusammen u³ − c³), dazu u + c für u² − c²; ebenso
// u³ + c³, mit Zahl vorn (8x³ − 27) oder mit zwei Buchstaben (a³ − b³). Zähler und Nenner nur aus
// diesen Teilen, damit jede dritte Potenz als solche zu erkennen ist.
export function cubeWorld(rng: Rng): World {
  const s = rng.pick([1, -1])
  let letters: string[]
  let lin: Poly
  let mirror: Poly
  let quad: Poly
  if (rng.chance(0.35)) {
    const [a, b] = rng.pick(LETTER_PAIRS)
    const ab = polyMul(polyAtom(a), polyAtom(b))
    letters = [a, b]
    lin = linearIn(1, a, -s, b)
    mirror = linearIn(1, a, s, b)
    quad = polySum([polyAtom(a, 2), polyScale(ab, rat(s)), polyAtom(b, 2)])
  } else {
    const u = oneLetter(rng)
    const k = rng.chance(0.25) ? 2 : 1
    const c = k === 2 ? rng.pick([1, 3]) : rng.int(1, 3)
    letters = [u]
    lin = linearIn(k, u, -s * c)
    mirror = linearIn(k, u, s * c)
    quad = polySum([polyScale(polyAtom(u, 2), rat(k * k)), polyScale(polyAtom(u), rat(s * k * c)), polyConst(c * c)])
  }
  const cube = polyMul(lin, quad)
  return { letters, factors: [lin, quad, mirror], products: [lin, mirror, polyMul(lin, mirror), cube, cube, quad, polyMul(polyAtom(letters[0]), lin)] }
}

// Zwei Bausteine gemischt, z. B. e^x und ln x: (e^x + 2) und (\ln x − 3)(\ln x + 3)
const BLOCK_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['E', 'L'],
  ['E', 'L'],
  ['E', 'S'],
  ['L', 'S'],
  ['E', 'C'],
  ['L', 'C'],
]

export function blockPairWorld(rng: Rng): World {
  const [a, b] = rng.shuffle([...rng.pick(BLOCK_PAIRS)])
  const p = (rng.chance(0.5) ? 1 : -1) * rng.int(1, 3)
  // bei sin und cos nicht 1: 1 − sin² x wäre eine Regel der Winkelfunktionen
  const q = rng.int(b === 'S' || b === 'C' ? 2 : 1, 3)
  return { letters: [a, b], factors: [linearIn(1, a, p), linearIn(1, b, -q), linearIn(1, b, q)] }
}

export function level5World(rng: Rng): World {
  return call(rng, [
    [() => level4World(rng), 6],
    [() => cubeWorld(rng), 1.5],
    [() => blockPairWorld(rng), 1.5],
  ])
}

// Rechenarten im Baum (Plus/Minus, mal, geteilt, Bruchstrich)
function opKinds(n: TreeNode): Set<string> {
  if (n.kind === 'leaf') return new Set()
  const inner = n.kind === 'sum' ? n.terms.map((t) => opKinds(t.node)) : [opKinds(n.left), opKinds(n.right)]
  return new Set([n.kind, ...inner.flatMap((k) => [...k])])
}

const hasSumLeaf = (root: TreeNode) => treeLeaves(root).some((l) => partFrac(l.part).den.length >= 2 || partFrac(l.part).num.length >= 2)

// Zu einfach oder doppelt: zwei ganze Zahlen in einer Summe (3 + 3), zwei gleiche Brüche
function isPlain(root: TreeNode): boolean {
  const latex = treeLeaves(root).map((l) => toLatex(partExpr(l.part)))
  if (new Set(latex).size < latex.length) return false
  const numbers = (n: TreeNode): boolean => {
    if (n.kind === 'leaf') return false
    if (n.kind === 'sum') return n.terms.filter((t) => t.node.kind === 'leaf' && constValue(partFrac(t.node.part).num) !== null && constValue(partFrac(t.node.part).den) !== null).length >= 2 || n.terms.some((t) => numbers(t.node))
    return numbers(n.left) || numbers(n.right)
  }
  return !numbers(root)
}

// Ergebnis der Stufe 5: kurz, im Nenner höchstens eine Klammer mit drei Summanden, keine längere
const profiResult = (solution: FracSolution) => {
  const sizes = solution.reduced.den.factors.map((f) => f.poly.length)
  return shortResult(solution) && sizes.every((n) => n <= 3) && sizes.filter((n) => n === 3).length <= 1
}

// Alles ineinander: drei oder vier Brüche, mindestens zwei Rechenarten (oft drei), Doppelbruch auch
// im Inneren
function level5Kit(w: World): Kit {
  return {
    sizes: [
      [3, 5],
      [4, 3],
    ],
    ops: [
      ['sum', 4],
      ['product', 2],
      ['quotient', 2],
      ['over', 2.5],
    ],
    leaves: [
      [(rng) => termLeaf(rng, w), 5],
      [(rng) => simpleLeaf(rng, w), 2.5],
    ],
    maxNumber: 200,
    maxLatex: 140,
    hints: w.factors,
    result: profiResult,
    nestedOver: true,
    accept: (root, rng) => {
      const kinds = opKinds(root)
      return hasSumLeaf(root) && isPlain(root) && kinds.size >= 2 && (kinds.size >= 3 || rng.chance(0.5))
    },
  }
}

export const buildLevel5Kit = (rng: Rng): FractionTask => buildFromKit(rng, level5Kit(level5World(rng)), 5)

// Doppelbruch im Doppelbruch: \frac{1}{1 - \frac{1}{1 + \frac{2}{x}}}, \frac{a - \frac{b}{1 + \frac{b}{a}}}{a + b}
export function worldNested(rng: Rng): FractionTask {
  const w = rng.chance(0.7) ? level3World(rng) : level4World(rng)
  const sign = (): 1 | -1 => (rng.chance(0.5) ? -1 : 1)
  const small = () =>
    call(rng, [
      [() => leaf(numberPart(rng.int(1, 3))), 3],
      [() => leaf(polyPart(polyAtom(rng.pick(w.letters)), polyConst(1))), 2],
      [() => simpleLeaf(rng, w), 2],
    ])
  for (;;) {
    const inner = overNode(small(), sumNode(term(1, small()), term(sign(), rng.chance(0.7) ? simpleLeaf(rng, w) : termLeaf(rng, w))))
    const withInner = sumNode(term(1, small()), term(sign(), inner))
    const other = rng.chance(0.6) ? small() : termLeaf(rng, w)
    const root = rng.chance(0.7) ? overNode(other, withInner) : overNode(withInner, other)
    if (!isPlain(root)) continue
    const task = taskFromTree(root, { maxNumber: 200, maxLatex: 140, hints: w.factors, result: profiResult, ones: true }, 5)
    if (task) return task
  }
}

// Differenzenquotienten \frac{f(x + h) - f(x)}{h} für f(x) = x², x³, \frac{k}{x}, \frac{k}{x^2},
// \frac{k}{x + c}, \frac{x}{x + c} und \sqrt{x} (mit dem Gegenstück erweitern)
export function differenceQuotient(rng: Rng): FractionTask {
  // x vor h: x + h (bei t stünde h vorn)
  const u = 'x'
  const [U, H] = [polyAtom(u), polyAtom('h')]
  const uh = polyAdd(U, H)
  const k = rng.chance(0.5) ? 1 : rng.int(2, 4)
  const c = (rng.chance(0.5) ? 1 : -1) * rng.int(1, 4)
  const shift = (p: Poly) => polyAdd(p, polyConst(c))
  const reduce = (num: Part['num'], den: Poly): FractionTask => ({ kind: 'reduce', part: part(num, expanded(den)), hints: [] })
  const complex = (top: Part, bottom: Part, hints: readonly Poly[]): FractionTask => ({
    kind: 'complex',
    top: [plus(top), minus(bottom)],
    bottom: [plus(part(expanded(H)))],
    hints,
  })
  return call(rng, [
    // \frac{(x + h)^2 - x^2}{h}, \frac{(x + 2h)^2 - x^2}{h}
    [() => reduce(binomialShown(polyAdd(U, polyScale(H, rat(rng.chance(0.3) ? 1 : rng.int(2, 3)))), polyAtom(u, 2)), H), 1],
    // \frac{(x + h)^3 - x^3}{h}
    [() => reduce(binomialShown(uh, polyAtom(u, 3), 3), H), 1],
    // \frac{\frac{k}{x + h} - \frac{k}{x}}{h}
    [() => complex(polyPart(polyConst(k), uh), polyPart(polyConst(k), U), [uh]), 1],
    // \frac{\frac{k}{(x + h)^2} - \frac{k}{x^2}}{h}
    [() => complex(part(expanded(polyConst(k)), factoredShown({ coef: rat(1), factors: [{ poly: uh, exp: 2 }] })), polyPart(polyConst(k), polyAtom(u, 2)), [uh]), 1.2],
    // \frac{\frac{k}{x + h + c} - \frac{k}{x + c}}{h}
    [() => complex(polyPart(polyConst(k), shift(uh)), polyPart(polyConst(k), shift(U)), [shift(uh), shift(U)]), 1],
    // \frac{\frac{x + h}{x + h + c} - \frac{x}{x + c}}{h}, auch mit Zahl: \frac{2x + 2h}{x + h + c}
    [() => complex(polyPart(polyScale(uh, rat(k)), shift(uh)), polyPart(polyScale(U, rat(k)), shift(U)), [shift(uh), shift(U)]), 1.2],
    // \frac{\frac{x + h + c}{x + h} - \frac{x + c}{x}}{h}
    [() => complex(polyPart(shift(uh), uh), polyPart(shift(U), U), [uh]), 1],
    // \frac{\sqrt{x + h} - \sqrt{x}}{h}: h = (\sqrt{x + h})^2 - (\sqrt{x})^2
    [
      () => {
        const [r, rh] = [polyAtom(rootOf(u)), polyAtom(sumRootOf(u))]
        const den = polySub(polyAtom(sumRootOf(u), 2), polyAtom(rootOf(u), 2))
        return { kind: 'reduce', part: part(expanded(polyScale(polySub(rh, r), rat(k))), expanded(den)), hints: [], rule: { kind: 'conjugate', target: 'num' } }
      },
      1.3,
    ],
  ])
}

// Dritte Potenzen: kürzen wie \frac{x^3 - 8}{x^2 - 4}, \frac{a^2 - b^2}{a^3 - b^3}, oder im Baukasten
// mit Nennern wie x^3 + 27
export function cubeTask(rng: Rng): FractionTask {
  const w = cubeWorld(rng)
  const [lin, quad, mirror] = w.factors
  const cube = polyMul(lin, quad)
  if (rng.chance(0.4)) {
    const kit = worldKit(w, 4)
    // mindestens ein Bruch mit einer dritten Potenz
    const withCube = (root: TreeNode) => treeLeaves(root).some((l) => [partFrac(l.part).num, partFrac(l.part).den].some((q) => polyDivideExact(q, cube) !== null))
    return buildFromKit(rng, { ...kit, result: profiResult, accept: (root) => withCube(root) && isPlain(root) }, 5)
  }
  for (;;) {
    const other = call(rng, [
      [() => polyMul(lin, mirror), 3],
      [() => lin, 1],
      [() => polyMul(lin, polyAtom(rng.pick(w.letters))), 1],
      [() => polyScale(lin, rat(rng.int(2, 4))), 1],
      [() => polyMul(lin, lin), 1],
      [() => polyScale(quad, rat(rng.int(1, 3))), 0.7],
    ])
    const scaled = rng.chance(0.25) ? polyScale(cube, rat(rng.int(2, 3))) : cube
    const [num, den] = rng.chance(0.65) ? [scaled, other] : [other, scaled]
    const task: FractionTask = { kind: 'reduce', part: part(expanded(num), expanded(den)), hints: w.factors }
    if (isUsable(task, 5, 110)) return task
  }
}

// Wurzeln: √x mit einer Zahl (auch 2√x − 3) oder zwei Wurzeln wie √x und √a. Kürzen
// (\frac{x - a}{\sqrt{x} - \sqrt{a}}), Wurzel im Nenner beseitigen (\frac{3}{\sqrt{x} - 2}) und Summen
// (\frac{1}{\sqrt{a} - \sqrt{b}} + \frac{1}{\sqrt{a} + \sqrt{b}})
const ROOT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['x', 'a'],
  ['x', 'y'],
  ['a', 'b'],
  ['m', 'n'],
  ['u', 'v'],
  ['p', 'q'],
]

export function rootTask(rng: Rng): FractionTask {
  let w: World
  let first: Poly
  let second: Poly
  if (rng.chance(0.5)) {
    const [u, v] = rng.pick(ROOT_PAIRS)
    first = polyAtom(rootOf(u))
    second = polyAtom(rootOf(v))
    w = { letters: [rootOf(u), rootOf(v)], factors: [polySub(first, second), polyAdd(first, second)] }
  } else {
    const u = rng.pick(['x', 'x', 'x', 'a', 't'])
    const k = rng.chance(0.25) ? rng.int(2, 3) : 1
    first = polyScale(polyAtom(rootOf(u)), rat(k))
    second = polyConst(rng.pick([1, 2, 3, 4, 5].filter((n) => gcd(n, k) === 1)))
    w = { letters: [rootOf(u)], factors: [polySub(first, second), polyAdd(first, second)] }
  }
  return call(rng, [
    [() => worldReduce(rng, w, 5), 3],
    [() => conjugateTask(rng, w), 2.5],
    [() => rootSum(rng, w), 1.5],
  ])
}

// Wurzel im Nenner beseitigen: \frac{3}{\sqrt{x} - 2}, \frac{\sqrt{x} + 1}{\sqrt{x} - 1}, \frac{\sqrt{a}}{\sqrt{a} + \sqrt{b}}
function conjugateTask(rng: Rng, w: World): FractionTask {
  const root = polyAtom(w.letters[0])
  for (;;) {
    const den = rng.pick(w.factors)
    const num = call(rng, [
      [() => polyConst(rng.int(1, 6)), 1.5],
      [() => polyScale(root, rat(rng.int(1, 3))), 2],
      [() => polyAtom(rng.pick(w.letters)), 1],
      [() => rng.pick(w.factors), 1.5],
      // \frac{\sqrt{x} + 1}{\sqrt{x} - 2}
      [() => polyAdd(root, polyConst((rng.chance(0.5) ? 1 : -1) * rng.int(1, 4))), w.letters.length === 1 ? 1.5 : 0],
    ])
    const task: FractionTask = { kind: 'reduce', part: part(expanded(num), expanded(den)), hints: [], rule: { kind: 'conjugate', target: 'den' } }
    // es kürzt sich nichts: Der Nenner bleibt, wie er ist
    const reduced = reduceFrac({ num, den })
    if (reduced.den.factors.length !== 1 || !polyEquals(reduced.den.factors[0].poly, primitivePart(den))) continue
    if (isUsable(task, 5, 110)) return task
  }
}

// Summe mit Wurzeln im Nenner: Hauptnenner (√x − 3)(√x + 3) = x − 9
function rootSum(rng: Rng, w: World): FractionTask {
  const [minusP, plusP] = w.factors
  const numer = () => (rng.chance(0.7) ? polyConst(rng.int(1, 4)) : polyAtom(rng.pick(w.letters)))
  for (;;) {
    const [a, b] = rng.shuffle([polyPart(numer(), minusP), polyPart(numer(), plusP)])
    const task: FractionTask = { kind: 'sum', terms: [plus(a), rng.chance(0.5) ? minus(b) : plus(b)], hints: w.factors, rule: { kind: 'root' } }
    if (isUsable(task, 5, 110)) return task
  }
}

// e^x, ln x, sin x und cos x gemischt: kürzen wie \frac{e^x \ln x - 2e^x + \ln x - 2}{\ln^2 x - 4} oder im Baukasten
export function blockPairTask(rng: Rng): FractionTask {
  const w = blockPairWorld(rng)
  return rng.chance(0.6) ? worldReduce(rng, w, 5) : buildFromKit(rng, { ...worldKit(w, 4), result: profiResult, accept: (root) => hasSumLeaf(root) && isPlain(root) }, 5)
}

// --- Partialbruchzerlegung (M2b Schritt 4) ---
//
// Nenner aus Linearfaktoren: zwei oder drei verschiedene (auch x und 2x − 1), ein doppelter, oder ein
// doppelter und ein einfacher. Die Zahlen des Ergebnisses (A, B, C) sind ganz und nicht 0, damit sich
// nichts kürzt. Manchmal mit ganzem Teil (Polynomdivision vorweg); der Nenner steht meist
// ausmultipliziert da, sonst in Faktoren. Jede Aufgabe hat mindestens einen typischen Fehler beim
// Bestimmen der Zahlen.
type PartialShape = 'two' | 'three' | 'double' | 'doubleOne'

export function partialTask(rng: Rng): FractionTask {
  const x = polyAtom('x')
  const lin = (r: number) => polyAdd(x, polyConst(-r))
  for (;;) {
    const shape = weighted<PartialShape>(rng, [
      ['two', 3],
      ['three', 1.2],
      ['double', 1.1],
      ['doubleOne', 1.7],
    ])
    const roots = rng.shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4])
    let factors: Array<{ poly: Poly; exp: number }>
    switch (shape) {
      case 'two': {
        // manchmal ein Faktor mit Zahl vor x: 2x − 1, 3x + 1
        const leading = rng.chance(0.25) ? polyAdd(polyScale(x, rat(rng.int(2, 3))), polyConst(rng.pick([-1, 1]))) : lin(roots[0])
        factors = [
          { poly: leading, exp: 1 },
          { poly: lin(roots[1]), exp: 1 },
        ]
        break
      }
      case 'three':
        factors = roots.slice(0, 3).map((r) => ({ poly: lin(r), exp: 1 }))
        break
      case 'double':
        factors = [{ poly: lin(roots.find((r) => r !== 0)!), exp: 2 }]
        break
      case 'doubleOne':
        factors = [
          { poly: lin(roots[0]), exp: 2 },
          { poly: lin(roots[1]), exp: 1 },
        ]
        break
    }
    if (rng.chance(0.5)) factors.reverse()
    const den = polyProduct(factors.map((f) => polyPow(f.poly, f.exp)))
    const degree = factors.reduce((s, f) => s + f.exp, 0)
    // Zähler aus den Zahlen des Ergebnisses: Summe von Zahl mal Nenner ohne den Faktor
    const rest = polySum(
      factors.flatMap((f) =>
        Array.from({ length: f.exp }, (_, k) => polyScale(polyDivideExact(den, polyPow(f.poly, k + 1))!, rat(rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])))),
      ),
    )
    if (rest.length === 0) continue
    // ganzer Teil: bei Nennern vom Grad 2 auch mit x
    const whole = rng.chance(degree === 2 ? 0.4 : 0.2)
    const quotient = !whole ? [] : degree === 2 && rng.chance(0.6) ? polyAdd(polyScale(x, rat(rng.pick([-2, -1, 1, 2]))), polyConst(rng.int(-3, 3))) : polyConst(rng.pick([-2, -1, 1, 2, 3]))
    const numerator = polyAdd(polyMul(quotient, den), rest)
    // in Faktoren nur ohne Polynomdivision (geteilt wird durch den ausmultiplizierten Nenner)
    const factoredDen = quotient.length === 0 && rng.chance(degree === 3 && !factors.some((f) => f.poly.length === 1) ? 0.5 : 0.2)
    const task: FractionTask = {
      kind: 'partial',
      part: part(expanded(numerator), factoredDen ? factoredShown({ coef: rat(1), factors }) : expanded(den)),
      hints: factors.map((f) => f.poly),
    }
    if (numerator.some((t) => Math.abs(Number(t.coef.n)) > 60 || t.coef.d !== 1n)) continue
    if (taskLatex(task).length > 90) continue
    if (fractionWrongAnswers(task).some((w) => w.rule.step === 'coef')) return task
  }
}

// --- Komplexe Zahlen teilen (M2b Schritt 5) ---
//
// Ein Bruch mit i im Nenner. Zähler: a + bi, nur a, nur bi, ein Produkt (a + bi)(c + di), ein
// Quadrat (a + bi)² oder mit einer Potenz wie a + b\mathrm{i}^3; Nenner: c + di, nur di oder mit
// Potenz. Manchmal mit Buchstaben (\frac{1}{a + b\mathrm{i}}, \frac{x + \mathrm{i}}{x - \mathrm{i}}),
// manchmal plus oder minus eine komplexe Zahl. Die Zahlen bleiben klein, das Ergebnis hat einen
// Imaginärteil, und es gibt mindestens drei typische Fehler.
type ImagNum = 'complex' | 'real' | 'imag' | 'product' | 'square' | 'power'
type ImagDen = 'complex' | 'imag' | 'power'

const IMAG_LETTER_PAIRS = [
  ['a', 'b'],
  ['x', 'y'],
  ['u', 'v'],
  ['p', 'q'],
  ['r', 's'],
] as const

export function imaginaryTask(source: Rng): FractionTask {
  // eigener Zufall: Die Nummern, für die diese Vorlage gewählt wird, haben sonst einen Zufall mit
  // ähnlichem Anfang, und Minus käme bei den ersten Nummern kaum vor
  const rng = createRng(`komplex:${source.int(0, 999_999_999)}`)
  const unit = (k = 1) => polyAtom('i', k)
  // re + im·i^k
  const z = (re: number | Poly, im: number | Poly, k = 1): Poly =>
    polyAdd(typeof re === 'number' ? polyConst(re) : re, polyMul(typeof im === 'number' ? polyConst(im) : im, unit(k)))
  const small = () => rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
  // c + di mit teilerfremden Zahlen und kleinem c² + d²
  const denPair = (): [number, number] => {
    for (;;) {
      const [c, d] = [small(), small()]
      if (gcd(c, d) === 1 && c * c + d * d <= 25) return [c, d]
    }
  }
  for (;;) {
    let num: Shown
    let den: Shown
    if (rng.chance(0.2)) {
      // Buchstaben: zwei Buchstaben (a + bi) oder ein Buchstabe mit Zahl (x + 2i)
      const [p, q] = rng.pick(IMAG_LETTER_PAIRS)
      const [a, b] = [polyAtom(p), polyAtom(q)]
      const two = rng.chance(0.6)
      const second = two ? b : polyConst(rng.int(1, 3))
      const d = z(a, rng.chance(0.5) ? second : polyNeg(second))
      // Zähler: eine Zahl, das konjugiert Komplexe des Nenners, die Teile vertauscht (b + ai) bzw.
      // mit anderer Zahl (x + 3i), nur der Buchstabe oder nur i
      const numerators = [
        () => polyConst(rng.pick([1, 1, 2, 3])),
        () => z(a, polyNeg(imagPartOf(d))),
        () => (two ? z(imagPartOf(d), a) : z(a, small())),
        () => a,
        () => polyMul(polyConst(rng.pick([1, 1, 2, -1])), unit()),
      ]
      num = expanded(rng.pick(numerators)())
      den = expanded(d)
      if (polyEquals(shownPolyOf(num), shownPolyOf(den))) continue
    } else {
      const nk = weighted<ImagNum>(rng, [
        ['complex', 3],
        ['real', 1.2],
        ['imag', 0.8],
        ['product', 1],
        ['square', 0.7],
        ['power', 1],
      ])
      const dk = weighted<ImagDen>(rng, [
        ['complex', 4],
        ['imag', 1],
        ['power', 0.8],
      ])
      const re = () => rng.int(1, 6) * (rng.chance(0.75) ? 1 : -1)
      switch (nk) {
        case 'complex':
          num = expanded(z(re(), small()))
          break
        case 'real':
          num = expanded(polyConst(rng.pick([1, 2, 3, 4, 5, 6, 10])))
          break
        case 'imag':
          num = expanded(polyMul(polyConst(small()), unit()))
          break
        case 'product': {
          const [f, g] = [z(rng.int(1, 3), small()), z(rng.int(1, 3), small())]
          if (polyEquals(f, g) || ratAbs(polyContent(f)).n !== 1n || ratAbs(polyContent(g)).n !== 1n) continue
          num = factoredShown({ coef: rat(1), factors: [{ poly: f, exp: 1 }, { poly: g, exp: 1 }] })
          break
        }
        case 'square': {
          const f = z(rng.int(1, 3), small())
          if (ratAbs(polyContent(f)).n !== 1n) continue
          num = factoredShown({ coef: rat(1), factors: [{ poly: f, exp: 2 }] })
          break
        }
        case 'power':
          num = expanded(z(re(), small(), rng.pick([2, 3, 3, 4, 5, 7])))
          break
      }
      if (dk === 'imag') den = expanded(polyMul(polyConst(rng.pick([1, 2, 3, 4, -1, -2])), unit()))
      else if (dk === 'power') den = expanded(z(rng.int(1, 3), rng.pick([1, -1, 2]), rng.pick([3, 3, 5, 7])))
      else den = expanded(z(...denPair()))
      // kein Faktor oben, der sich gegen den Nenner kürzt: \frac{(1 - 3i)(3 + i)}{3 + i}
      const d = primitivePart(reduceImag(shownPoly(den)))
      if (num.form === 'factored' && num.factored.factors.some((f) => polyEquals(primitivePart(f.poly), d))) continue
    }
    const terms: Signed[] = [plus(part(num, den))]
    // plus oder minus eine komplexe Zahl, meist dahinter (nur ohne Buchstaben, sonst wird es unübersichtlich)
    const letters = atomsOf(shownPoly(den)).some((atom) => atom !== 'i')
    // minus: meist eine komplexe Zahl mit Real- und Imaginärteil (das Minus gilt für beide Teile)
    const sign = rng.chance(0.75) ? -1 : 1
    if (!letters && rng.chance(0.6)) {
      const extra =
        sign < 0 && rng.chance(0.8)
          ? z(rng.int(1, 4), small())
          : weighted<() => Poly>(rng, [
              [() => z(rng.int(1, 4), small()), 3],
              [() => polyMul(polyConst(rng.int(1, 4)), unit()), 1],
              [() => polyConst(rng.int(1, 5)), 1],
            ])()
      const whole = part(expanded(extra))
      if (rng.chance(0.8)) terms.push(sign > 0 ? plus(whole) : minus(whole))
      else terms.splice(0, 1, plus(whole), sign > 0 ? plus(terms[0].part) : minus(terms[0].part))
    }
    const task: FractionTask = { kind: 'imaginary', terms, hints: [] }
    if (taskLatex(task).length > 110) continue
    // nichts, was sich vorher kürzen lässt: \frac{4}{4\mathrm{i}}, \frac{6 - 4\mathrm{i}}{2 + 2\mathrm{i}}
    const [cn, cd] = [polyContent(reduceImag(shownPoly(num))), polyContent(reduceImag(shownPoly(den)))]
    if (gcd(Number(cn.n), Number(cd.n)) > 1 || (atomsOf(shownPoly(num)).length === 1 && polyEquals(primitivePart(shownPoly(num)), primitivePart(shownPoly(den))))) continue
    const value = complexParts(taskFrac(task))
    // Ergebnis mit Imaginärteil und kleinen Zahlen
    if (value.im.num.length === 0) continue
    const sizes = [value.re, value.im].map((f) => reduceFrac(f))
    if (sizes.some((r) => r.num.some((t) => Math.abs(Number(t.coef.n)) > 40) || Number(r.den.coef.n) > 60)) continue
    if (fractionWrongAnswers(task).length >= 3) return task
  }
}

const shownPolyOf = (s: Shown) => shownPoly(s)
const imagPartOf = (p: Poly) => imagParts(p).im
