import { type Reduced, reduceFrac } from './factor.ts'
import { type Frac, fracAdd, fracDiv, fracEquals, fracMul, fracNeg, startsNegative } from './frac.ts'
import { type Poly, isZeroPoly, polyConst, polyNeg } from './poly.ts'
import { rat, ratSign } from '../rational.ts'
import {
  type FractionTask,
  type Part,
  type Signed,
  type TreeNode,
  type TreeTerm,
  expanded,
  factoredShown,
  isUnaryMinus,
  leaf,
  part,
  plus,
  sumNode,
  term,
  treeFrac,
} from './task.ts'

// Rechenbäume (Aufgabenform „tree", M2b) Stück für Stück: Der nächste Teil, der sich wie eine
// gewohnte Bruchaufgabe rechnen lässt (Summe aus Brüchen, mal, geteilt, Klammer mal Klammer,
// Doppelbruch), wird zur Teilaufgabe; ihr Ergebnis ersetzt ihn im Baum. So rechnet man von innen
// nach außen, Klammern zuerst, Punkt vor Strich. Dezimalzahlen werden vorher zu Brüchen.

type Leaf = Extract<TreeNode, { kind: 'leaf' }>

export type TreeStage = {
  // Baum vor und nach diesem Teil
  readonly before: TreeNode
  readonly after: TreeNode
  // der gerechnete Teil (ein Knoten von before)
  readonly node: TreeNode
  // derselbe Teil als gewohnte Bruchaufgabe
  readonly task: FractionTask
}

// --- Umbauen ---

export function replaceNode(n: TreeNode, target: TreeNode, replacement: TreeNode): TreeNode {
  if (n === target) return replacement
  switch (n.kind) {
    case 'leaf':
      return n
    case 'sum':
      return { kind: 'sum', terms: n.terms.map((t) => ({ sign: t.sign, node: replaceNode(t.node, target, replacement) })) }
    default:
      return { kind: n.kind, left: replaceNode(n.left, target, replacement), right: replaceNode(n.right, target, replacement) }
  }
}

const positive = (n: TreeNode): TreeNode => (isUnaryMinus(n) ? (n as Extract<TreeNode, { kind: 'sum' }>).terms[0].node : n)

// Minus nach außen: −a · b → −(a · b); in Summen wird es zum Vorzeichen des Summanden. Eine Summe
// mit einem Summanden ohne Minus ist der Summand selbst.
export function normalize(n: TreeNode): TreeNode {
  switch (n.kind) {
    case 'leaf':
      return n
    case 'sum': {
      const terms: TreeTerm[] = []
      for (const t of n.terms) {
        const node = normalize(t.node)
        if (isUnaryMinus(node)) terms.push(term((-t.sign) as 1 | -1, positive(node)))
        else if (node.kind === 'sum' && node.terms.length === 1) terms.push(term((t.sign * node.terms[0].sign) as 1 | -1, node.terms[0].node))
        else terms.push(term(t.sign, node))
      }
      return terms.length === 1 && terms[0].sign > 0 ? terms[0].node : sumNode(...terms)
    }
    default: {
      const left = normalize(n.left)
      const right = normalize(n.right)
      const sign = (isUnaryMinus(left) ? -1 : 1) * (isUnaryMinus(right) ? -1 : 1)
      const node: TreeNode = { kind: n.kind, left: positive(left), right: positive(right) }
      return sign < 0 ? sumNode(term(-1, node)) : node
    }
  }
}

// Gekürzter Bruch als Blatt; ganz negativer Zähler als Minus davor
export function leafOfReduced(r: Reduced): TreeNode {
  const negative = r.num.length > 0 && startsNegative(r.num) && r.num.every((t) => ratSign(t.coef) < 0)
  const num: Poly = negative ? polyNeg(r.num) : r.num
  const node = leaf(part(expanded(num), factoredShown(r.den)))
  return negative ? sumNode(term(-1, node)) : node
}

export const leafOfFrac = (f: Frac, hints: readonly Poly[] = []): TreeNode => leafOfReduced(reduceFrac(f, hints))

// --- Dezimalzahlen ---

export const hasDecimal = (n: TreeNode): boolean =>
  n.kind === 'leaf' ? n.decimal !== undefined : n.kind === 'sum' ? n.terms.some((t) => hasDecimal(t.node)) : hasDecimal(n.left) || hasDecimal(n.right)

export function decimalLeaves(n: TreeNode): Leaf[] {
  if (n.kind === 'leaf') return n.decimal ? [n] : []
  if (n.kind === 'sum') return n.terms.flatMap((t) => decimalLeaves(t.node))
  return [...decimalLeaves(n.left), ...decimalLeaves(n.right)]
}

// Dezimalzahlen als (gekürzte) Brüche geschrieben
export function withoutDecimals(n: TreeNode): TreeNode {
  if (n.kind === 'leaf') return n.decimal ? leaf(n.part) : n
  if (n.kind === 'sum') return { kind: 'sum', terms: n.terms.map((t) => ({ sign: t.sign, node: withoutDecimals(t.node) })) }
  return { kind: n.kind, left: withoutDecimals(n.left), right: withoutDecimals(n.right) }
}

// --- Teilaufgaben ---

const isLeaf = (n: TreeNode): n is Leaf => n.kind === 'leaf'

// Ein Blatt oder eine Summe aus Blättern als Summanden einer gewohnten Aufgabe
function sideOf(n: TreeNode): Signed[] | null {
  if (isLeaf(n)) return [plus(n.part)]
  if (n.kind === 'sum' && n.terms.every((t) => isLeaf(t.node))) return n.terms.map((t) => ({ sign: t.sign, part: (t.node as Leaf).part }))
  return null
}

// Der Knoten als gewohnte Bruchaufgabe; null, wenn darin noch etwas zu rechnen ist
export function asTask(n: TreeNode, hints: readonly Poly[]): FractionTask | null {
  switch (n.kind) {
    case 'leaf':
      return null
    case 'sum':
      return n.terms.length >= 2 && n.terms.every((t) => isLeaf(t.node)) ? { kind: 'sum', terms: sideOf(n)!, hints } : null
    case 'product':
    case 'quotient': {
      // Klammer mal bzw. geteilt durch einen Bruch als Ganzes (mixed); steht rechts eine Klammer,
      // wird sie vorher als eigener Teil gerechnet
      const left = sideOf(n.left)
      if (!left || !isLeaf(n.right)) return null
      if (isLeaf(n.left)) return { kind: n.kind, left: n.left.part, right: n.right.part, hints }
      return { kind: 'mixed', op: n.kind === 'product' ? 'mul' : 'div', left, right: [plus(n.right.part)], hints }
    }
    case 'over': {
      const top = sideOf(n.left)
      const bottom = sideOf(n.right)
      return top && bottom ? { kind: 'complex', top, bottom, hints } : null
    }
  }
}

// Der nächste Teil: von außen gesucht, damit z. B. (a + b) · (c − d) als Ganzes gerechnet wird;
// sonst von links nach rechts im Inneren
export function nextNode(n: TreeNode, hints: readonly Poly[]): TreeNode | null {
  if (asTask(n, hints)) return n
  switch (n.kind) {
    case 'leaf':
      return null
    case 'sum':
      for (const t of n.terms) {
        const found = nextNode(t.node, hints)
        if (found) return found
      }
      return null
    default:
      return nextNode(n.left, hints) ?? nextNode(n.right, hints)
  }
}

// Die Teile der Reihe nach; der Baum ist danach ein Blatt (ggf. mit Minus davor)
export function treeStages(root: TreeNode, hints: readonly Poly[], solve: (t: FractionTask) => Reduced): TreeStage[] {
  const stages: TreeStage[] = []
  let current = normalize(withoutDecimals(root))
  for (let guard = 0; guard < 20; guard++) {
    const node = nextNode(current, hints)
    if (!node) return stages
    const task = asTask(node, hints)!
    const after = normalize(replaceNode(current, node, leafOfReduced(solve(task))))
    stages.push({ before: current, after, node, task })
    current = after
  }
  throw new Error('Rechenbaum zu tief')
}

// --- Andere Rechenwege, wie sie bei typischen Fehlern entstehen (für falsche Antworten) ---

// Punkt vor Strich missachtet: in der äußersten Summe von links nach rechts gerechnet,
// a − b · c als (a − b) · c. null, wenn das nichts ändert.
export function leftToRight(root: TreeNode): Frac | null {
  if (root.kind !== 'sum' || !root.terms.some((t) => t.node.kind === 'product' || t.node.kind === 'quotient')) return null
  let acc: Frac | null = null
  for (const t of root.terms) {
    const chain = chainOf(t.node)
    const [first, ...rest] = chain
    const firstValue = t.sign < 0 ? fracNeg(treeFrac(first.node)) : treeFrac(first.node)
    acc = acc === null ? firstValue : fracAdd(acc, firstValue)
    for (const link of rest) {
      const v = treeFrac(link.node)
      if (link.op === 'mul') acc = fracMul(acc, v)
      else if (isZeroPoly(v.num)) return null
      else acc = fracDiv(acc, v)
    }
  }
  return acc
}

type Link = { readonly op: 'mul' | 'div'; readonly node: TreeNode }

// a · b : c als Kette [a, ·b, :c] (beim ersten Glied zählt op nicht); rechte Teile, die selbst mal
// oder geteilt sind, stehen in Klammern und bleiben ein Glied
function chainOf(n: TreeNode): Link[] {
  if (n.kind === 'product' || n.kind === 'quotient') return [...chainOf(n.left), { op: n.kind === 'product' ? 'mul' : 'div', node: n.right }]
  return [{ op: 'mul', node: n }]
}

// Minus vor der Klammer nur auf den ersten Summanden: a − (b − c) als a − b − c. Je Klammer nach
// einem Minus ein Ergebnis.
export function minusBracketMistakes(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = []
  const visit = (n: TreeNode) => {
    if (n.kind === 'sum') {
      n.terms.forEach((t, i) => {
        if (t.sign < 0 && t.node.kind === 'sum' && t.node.terms.length >= 2) {
          const [first, ...rest] = t.node.terms
          const opened = [term((-first.sign) as 1 | -1, first.node), ...rest]
          out.push(replaceNode(root, n, sumNode(...n.terms.slice(0, i), ...opened, ...n.terms.slice(i + 1))))
        }
        visit(t.node)
      })
    } else if (n.kind !== 'leaf') {
      visit(n.left)
      visit(n.right)
    }
  }
  visit(root)
  return out
}

// Klammer übersehen: (a − b) : c als a − b : c, a · (b + c) als a · b + c
export function bracketIgnoredMistakes(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = []
  const visit = (n: TreeNode) => {
    if (n.kind === 'product' || n.kind === 'quotient') {
      const join = (l: TreeNode, r: TreeNode): TreeNode => ({ kind: n.kind, left: l, right: r })
      if (n.left.kind === 'sum' && n.left.terms.length >= 2) {
        const terms = n.left.terms
        const last = terms[terms.length - 1]
        out.push(replaceNode(root, n, sumNode(...terms.slice(0, -1), term(last.sign, join(last.node, n.right)))))
      }
      if (n.right.kind === 'sum' && n.right.terms.length >= 2) {
        const [first, ...rest] = n.right.terms
        const head = first.sign < 0 ? sumNode(term(-1, join(n.left, first.node))) : join(n.left, first.node)
        out.push(replaceNode(root, n, sumNode(term(1, head), ...rest)))
      }
    }
    if (n.kind === 'sum') n.terms.forEach((t) => visit(t.node))
    else if (n.kind !== 'leaf') {
      visit(n.left)
      visit(n.right)
    }
  }
  visit(root)
  return out
}

// Dezimalzahl mit falsch gezählten Stellen: 0,75 als 75/10 oder 75/1000
export function decimalMistakes(root: TreeNode): Array<{ readonly leaf: Leaf; readonly wrong: Part; readonly tree: TreeNode }> {
  const out: Array<{ leaf: Leaf; wrong: Part; tree: TreeNode }> = []
  for (const d of decimalLeaves(root)) {
    const [whole, fraction = ''] = d.decimal!.split(',')
    const digits = BigInt(`${whole}${fraction}`)
    const places = fraction.length
    for (const shift of [places - 1, places + 1]) {
      if (shift < 1) continue
      const wrong = part(expanded(polyConst(rat(digits))), expanded(polyConst(rat(10n ** BigInt(shift)))))
      out.push({ leaf: d, wrong, tree: replaceNode(root, d, leaf(wrong)) })
    }
  }
  return out
}

// Ist der Bruch ein anderer Wert als correct und definiert?
export const differs = (v: Frac, correct: Frac) => !isZeroPoly(v.den) && !fracEquals(v, correct)
