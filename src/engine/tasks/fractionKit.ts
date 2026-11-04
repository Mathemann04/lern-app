import { factoredPoly, reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import { type Poly, atomsOf, polyAtom, polyConst, polyEquals, polyMul, totalDegree } from '../fraction/poly.ts'
import { ratAbs, ratDiv } from '../rational.ts'
import { fractionWrongAnswers } from '../fraction/errorRules.ts'
import { isPlayableTree, solveTree } from '../fraction/solve.ts'
import {
  type FractionTask,
  type Part,
  type TreeNode,
  type TreeTerm,
  expanded,
  leaf,
  overNode,
  part,
  partFrac,
  productNode,
  quotientNode,
  sumNode,
  isWhole,
  taskLatex,
  term,
  treeFrac,
  treeLeaves,
} from '../fraction/task.ts'
import { type Rng } from '../random/rng.ts'
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
  // Doppelbruch nicht im Doppelbruch, Tiefe begrenzt
  const ops = kit.ops.filter(([op]) => !(op === 'over' && depth > 0))
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
export function taskFromTree(root: TreeNode, kit: Pick<Kit, 'maxNumber' | 'maxLatex'>, level: Level): FractionTask | null {
  const t: Extract<FractionTask, { kind: 'tree' }> = { kind: 'tree', root, hints: [] }
  let solution
  try {
    const value = treeFrac(root)
    if (value.num.length === 0) return null
    solution = solveTree(t)
  } catch {
    return null
  }
  if (!isPlayableTree(t)) return null
  const reduced = reduceFrac(solution.value)
  if (biggest({ num: reduced.num, den: factoredPoly(reduced.den) }) > kit.maxNumber) return null
  // Teilergebnisse klein und nicht ±1 (sonst folgt „mal 1" oder „geteilt durch 1"); kein Blatt ist 1
  for (const [i, stage] of solution.stages.entries()) {
    if (biggest(stage.solution.value) > kit.maxNumber * 4) return null
    if (stage.solution.reduced.num.length > 4) return null
    const r = stage.solution.reduced
    const one = r.den.factors.length === 0 && r.num.length === 1 && r.num[0].mono.length === 0 && ratAbs(ratDiv(r.num[0].coef, r.den.coef)).n === 1n && ratAbs(ratDiv(r.num[0].coef, r.den.coef)).d === 1n
    if ((one || r.num.length === 0) && i < solution.stages.length - 1) return null
  }
  if (treeLeaves(root).some((l) => { const v = partFrac(l.part); return polyEquals(v.num, v.den) })) return null
  if (level >= 2 && atomsOf(reduced.num).length === 0 && reduced.den.factors.length === 0) return null
  if (totalDegree(reduced.num) > 6) return null
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
