import { subterms } from '../expr/compare.ts'
import { type Expr, add, div, eq, mul, neg, num, variable } from '../expr/types.ts'
import type { RearrangeTask } from '../rearrange/task.ts'
import type { Rng } from '../random/rng.ts'

// Baukasten für Umstell-Aufgaben (M3, 4. Fassung; docs/PLAN-M3.md, „Abwechslung"). Jede Gleichung
// entsteht aus einem Kern (die Stelle, an der die gesuchte Variable steckt) und Schalen (Rechnungen,
// die um den Kern gelegt werden), dazu die andere Seite und wonach aufgelöst wird. Ob eine Aufgabe
// taugt (lösbar, prüfbar, nicht zu lang, nicht zu leicht), entscheidet rearrangeTerms.ts.

export type KitTask = {
  readonly task: RearrangeTask
  // Art des Kerns und Zahl der Schalen, für die Galerie
  readonly label: string
}

// --- Buchstaben ---

// Buchstaben-Familien: meist a, b, c, …, manchmal andere. In der Reihenfolge, in der sie gebraucht
// werden; die gesuchte Variable heißt x oder (manchmal) wie ein Buchstabe der Familie, dann kommt x
// als gewöhnlicher Buchstabe vor.
const FAMILIES: readonly (readonly string[])[] = [
  ['a', 'b', 'c', 'd', 'g', 'h', 'k'],
  ['a', 'b', 'c', 'd', 'g', 'h', 'k'],
  ['a', 'b', 'c', 'd', 'g', 'h', 'k'],
  ['k', 'm', 'n', 'p', 'q', 'r', 's'],
  ['p', 'q', 'r', 's', 't', 'u', 'v'],
  ['m', 'n', 'p', 'q', 'r', 's', 't'],
  ['r', 's', 't', 'u', 'v', 'w', 'z'],
]

type Names = {
  readonly unknown: Expr
  readonly target: string
  // nächster freier Buchstabe
  letter(): Expr
}

function names(rng: Rng, letterTarget: boolean): Names {
  const family = rng.pick(FAMILIES)
  // gesucht ist ein Buchstabe: dann steht x als gewöhnlicher Buchstabe mit drin
  const target = letterTarget ? family[0] : 'x'
  const queue = letterTarget ? ['x', ...family.slice(1)] : [...family]
  let i = 0
  return {
    unknown: variable(target),
    target,
    letter: () => variable(queue[Math.min(i++, queue.length - 1)]),
  }
}

// --- kleine Bausteine ---

const termsOf = (e: Expr): readonly Expr[] => (e.kind === 'add' ? e.terms : [e])
// Summe ohne geschachtelte Summen
const plus = (...parts: Expr[]): Expr => add(...parts.flatMap(termsOf))
const minus = (a: Expr, b: Expr): Expr => plus(a, neg(b))
const k = (rng: Rng, min = 2, max = 9) => num(rng.int(min, max))
// Produkt zweier Buchstaben in alphabetischer Reihenfolge: bx statt xb
const letters = (a: Expr, b: Expr): Expr => (a.kind === 'var' && b.kind === 'var' && a.name > b.name ? mul(b, a) : mul(a, b))

// Summand ohne die gesuchte Variable: b, 3b, bc, \frac{b}{c}, 5
function summand(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.5) return n.letter()
  if (r < 0.7) return mul(k(rng), n.letter())
  if (r < 0.8) return letters(n.letter(), n.letter())
  if (r < 0.9) return div(n.letter(), n.letter())
  return k(rng)
}

// Faktor: 3, b, 2b
function factor(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.4) return k(rng)
  if (r < 0.85) return n.letter()
  return mul(k(rng), n.letter())
}

// Nenner: 4, b, 2b, b + c
function denominator(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.35) return k(rng)
  if (r < 0.75) return n.letter()
  if (r < 0.85) return mul(k(rng), n.letter())
  return plus(n.letter(), n.letter())
}

// --- Schalen ---

type ShellKind = 'plus' | 'minus' | 'minus-before' | 'times' | 'divide'
const ADDITIVE: readonly ShellKind[] = ['plus', 'plus', 'minus', 'minus-before']
const MULTIPLICATIVE: readonly ShellKind[] = ['times', 'times', 'divide', 'divide']

// Legt eine Schale um e. Additive und malnehmende Schalen wechseln sich ab, damit jede Schale eine
// eigene Umformung ist.
function shell(rng: Rng, e: Expr, n: Names, kind: ShellKind): Expr {
  switch (kind) {
    case 'plus':
      return rng.chance(0.7) ? plus(e, summand(rng, n)) : plus(summand(rng, n), e)
    case 'minus':
      return minus(e, summand(rng, n))
    case 'minus-before':
      return minus(summand(rng, n), e)
    case 'times': {
      const f = factor(rng, n)
      // Bruch mal Faktor: Faktor in den Zähler (\frac{3(x - a)}{b})
      if (e.kind === 'div') return div(mul(f, e.num), e.den)
      return letters(f, e)
    }
    case 'divide':
      return div(e, denominator(rng, n))
  }
}

const hasFraction = (e: Expr) => subterms(e).some((s) => s.kind === 'div')

function shells(rng: Rng, core: Expr, n: Names, count: number): Expr {
  let e = core
  let additive = rng.chance(0.5)
  for (let i = 0; i < count; i++) {
    let kind = rng.pick(additive ? ADDITIVE : MULTIPLICATIVE)
    // kein Bruch im Bruch
    if (kind === 'divide' && hasFraction(e)) kind = 'times'
    e = shell(rng, e, n, kind)
    additive = !additive
  }
  return e
}

// --- andere Seite ---

function otherSide(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.45) return variable('y')
  if (r < 0.65) return n.letter()
  if (r < 0.8) return rng.chance(0.5) ? plus(n.letter(), n.letter()) : minus(n.letter(), n.letter())
  if (r < 0.9) return mul(k(rng), n.letter())
  return div(n.letter(), n.letter())
}

// Gleichung mit der Seite der Variable links oder rechts; „y = …" steht meist links
function equation(rng: Rng, side: Expr, other: Expr) {
  const isY = other.kind === 'var' && other.name === 'y'
  return rng.chance(isY ? 0.6 : 0.2) ? eq(other, side) : eq(side, other)
}

// --- Stufe 1: die Variable kommt einmal vor, zwei bis vier Schalen ---

export function buildLevel1(rng: Rng): KitTask {
  const n = names(rng, rng.chance(0.25))
  const r = rng.next()
  const count = r < 0.2 ? 2 : r < 0.7 ? 3 : 4
  const side = shells(rng, n.unknown, n, count)
  return {
    task: { equation: equation(rng, side, otherSide(rng, n)), target: n.target, conditions: [] },
    label: `Baukasten: Variable einmal, ${count} Schalen`,
  }
}

// --- Stufe 2: die Variable kommt mehrfach vor oder steht im Nenner ---

// Summand mit der Variable u: 3u, bu, u, 3(u − b), b(u + c), \frac{u + b}{3}, \frac{u}{b}, 3(b − u)
function unknownTerm(rng: Rng, u: Expr, n: Names, numberDenominator: boolean): Expr {
  const bracket = () => (rng.chance(0.75) ? (rng.chance(0.5) ? plus(u, summand(rng, n)) : minus(u, summand(rng, n))) : minus(summand(rng, n), u))
  if (numberDenominator) return div(rng.chance(0.75) ? bracket() : u, k(rng, 2, 6))
  const r = rng.next()
  if (r < 0.2) return mul(k(rng), u)
  if (r < 0.35) return letters(n.letter(), u)
  if (r < 0.45) return u
  if (r < 0.7) return mul(factor(rng, n), bracket())
  if (r < 0.85) return div(u, rng.chance(0.5) ? k(rng, 2, 6) : n.letter())
  return div(bracket(), k(rng, 2, 6))
}

// Zahl mal Variable (3x, x): zwei davon auf einer Seite wären gleich zusammenzufassen (9x + x)
const isNumberMultiple = (e: Expr, u: Expr) => e === u || (e.kind === 'mul' && e.factors.length === 2 && e.factors[0].kind === 'num' && e.factors[1] === u)

// Seite aus Summanden mit Vorzeichen
function sideOf(rng: Rng, terms: readonly Expr[]): Expr {
  return terms.slice(1).reduce((acc, t) => (rng.chance(0.55) ? plus(acc, t) : minus(acc, t)), terms[0])
}

// x auf beiden Seiten oder mehrfach auf einer Seite, auch in Klammern und Zahlenbrüchen
function linear(rng: Rng, n: Names): { equation: ReturnType<typeof eq>; label: string } {
  const fractions = rng.chance(0.25)
  const total = rng.int(2, 3)
  const both = rng.chance(0.65)
  const left: Expr[] = []
  const right: Expr[] = []
  for (let i = 0; i < total; i++) {
    const side = both && i === total - 1 ? right : left
    let t = unknownTerm(rng, n.unknown, n, fractions)
    for (let j = 0; j < 5 && isNumberMultiple(t, n.unknown) && side.some((s) => isNumberMultiple(s, n.unknown)); j++) t = unknownTerm(rng, n.unknown, n, fractions)
    side.push(t)
  }
  if (rng.chance(0.6)) left.push(summand(rng, n))
  if (right.length === 0 || rng.chance(0.5)) right.push(summand(rng, n))
  const l = sideOf(rng, rng.shuffle(left))
  const r = sideOf(rng, rng.shuffle(right))
  return {
    equation: rng.chance(0.5) ? eq(l, r) : eq(r, l),
    label: fractions ? 'Baukasten: Brüche mit Zahlen im Nenner' : both ? 'Baukasten: Variable auf beiden Seiten' : 'Baukasten: Variable mehrfach auf einer Seite',
  }
}

// Variable im Nenner, mit Schalen drumherum: y = \frac{a}{b - x} + c
function inDenominator(rng: Rng, n: Names): { equation: ReturnType<typeof eq>; label: string } {
  const u = n.unknown
  const r = rng.next()
  let den: Expr
  if (r < 0.25) den = u
  else if (r < 0.55) den = plus(u, summand(rng, n))
  else if (r < 0.8) den = minus(rng.chance(0.5) ? u : mul(k(rng), u), summand(rng, n))
  else den = minus(summand(rng, n), u)
  const core = div(rng.chance(0.6) ? n.letter() : k(rng), den)
  // \frac{a}{x} allein wäre zu leicht
  const count = rng.int(den === u ? 1 : 0, 2)
  // Schale um einen Bruch: zuerst etwas dazu, sonst wird es nur ein größerer Zähler
  let e: Expr = core
  for (let i = 0; i < count; i++) e = shell(rng, e, n, i % 2 === 0 ? rng.pick(ADDITIVE) : 'times')
  return { equation: equation(rng, e, otherSide(rng, n)), label: `Baukasten: Variable im Nenner, ${count} Schalen` }
}

// Variable zweimal im Nenner: \frac{a}{x} + b = \frac{c}{x}
function sameDenominator(rng: Rng, n: Names): { equation: ReturnType<typeof eq>; label: string } {
  const u = n.unknown
  const den = rng.chance(0.5) ? u : rng.chance(0.5) ? minus(u, n.letter()) : plus(u, n.letter())
  const left = rng.chance(0.5) ? plus(div(n.letter(), den), summand(rng, n)) : minus(summand(rng, n), div(n.letter(), den))
  const right = div(rng.chance(0.6) ? n.letter() : k(rng), den)
  return { equation: rng.chance(0.7) ? eq(left, right) : eq(right, left), label: 'Baukasten: Variable zweimal im Nenner' }
}

export function buildLevel2(rng: Rng): KitTask {
  const n = names(rng, rng.chance(0.2))
  const r = rng.next()
  const built = r < 0.6 ? linear(rng, n) : r < 0.88 ? inDenominator(rng, n) : sameDenominator(rng, n)
  return { task: { equation: built.equation, target: n.target, conditions: [] }, label: built.label }
}
