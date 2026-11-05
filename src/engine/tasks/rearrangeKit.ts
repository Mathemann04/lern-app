import { subterms } from '../expr/compare.ts'
import { type Expr, add, div, eq, mul, neg, num, pow, sqrt, variable } from '../expr/types.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
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

// --- Stufe 3: Brüche, Wurzeln und Quadrate, Kerne ineinander (docs/PLAN-M3.md, „Ab Stufe 3") ---
//
// Jede Aufgabe verbindet mindestens zwei Kerne: ein Kern im anderen (Wurzel aus einem Bruch, Bruch
// im Bruch), Kern gegen Kern (Bruch gleich Bruch, Klammer mal Klammer gleich Klammer im Quadrat) oder
// mehrere Kerne in einer Summe (Brüche mit verschiedenen Nennern, zwei Wurzeln, Kehrwerte). Dazu
// kommen Schalen wie in Stufe 1.

type Built = { readonly side: Expr; readonly other?: Expr; readonly conditions?: readonly Condition[]; readonly label: string }

// Zahl oder Buchstabe als Summand in einer Klammer: b, 3, 2b
function constant(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.65) return n.letter()
  if (r < 0.85) return k(rng)
  return mul(k(rng), n.letter())
}

// Vorderteil mit der Variable: x, 2x, bx
function head(rng: Rng, n: Names, u: Expr): Expr {
  const r = rng.next()
  if (r < 0.65) return u
  if (r < 0.85) return mul(k(rng, 2, 5), u)
  return letters(n.letter(), u)
}

type Linear = { readonly expr: Expr; readonly head: Expr; readonly rest: Expr; readonly sign: 1 | -1 | 0 }

// Klammer, linear in u: x + b, 2x - b, b - x (sign: +1 Kopf minus Rest, −1 Rest minus Kopf, 0 Summe)
function bracketIn(rng: Rng, n: Names, u: Expr, allowSum = true): Linear {
  const h = head(rng, n, u)
  const rest = constant(rng, n)
  const r = rng.next()
  if (allowSum && r < 0.4) return { expr: rng.chance(0.75) ? plus(h, rest) : plus(rest, h), head: h, rest, sign: 0 }
  if (r < 0.85) return { expr: minus(h, rest), head: h, rest, sign: 1 }
  return { expr: minus(rest, h), head: h, rest, sign: -1 }
}

// Bedingung, unter der die Klammer positiv ist: x - b → x > b, 2x - b → x > \frac{b}{2}, b - x → x < b
function positiveCondition(l: Linear, u: Expr): Condition | null {
  if (l.sign === 0) return null
  const coefficient = l.head === u ? null : l.head.kind === 'mul' ? l.head.factors[0] : null
  const bound = coefficient ? div(l.rest, coefficient) : l.rest
  return { lhs: u, rel: l.sign > 0 ? '>' : '<', rhs: bound }
}

// Schalen um einen Kern: min bis max, abwechselnd additiv und malnehmend
function someShells(rng: Rng, core: Expr, n: Names, max: number, min = 0): { e: Expr; count: number } {
  const count = rng.int(min, max)
  return { e: shells(rng, core, n, count), count }
}

// x in Zähler und Nenner: y = \frac{ax + b}{x - c}, mit Schalen
function moebius(rng: Rng, n: Names): Built {
  const u = n.unknown
  const top = rng.chance(0.25) ? head(rng, n, u) : bracketIn(rng, n, u).expr
  const bottom = bracketIn(rng, n, u).expr
  const { e, count } = someShells(rng, div(top, bottom), n, 2, 1)
  return { side: e, label: `Baukasten: Variable in Zähler und Nenner, ${count} Schalen` }
}

// Bruch gleich Bruch: \frac{a}{x - b} = \frac{c}{x + d}, auch \frac{x + a}{x - b} = \frac{x + c}{x - d}
function crossFractions(rng: Rng, n: Names): Built {
  const u = n.unknown
  const sameTop = rng.chance(0.35)
  // mit x oben: Nenner x ± …, sonst bleibt x^2 stehen
  const den = () => (sameTop ? (rng.chance(0.5) ? plus(u, constant(rng, n)) : minus(u, constant(rng, n))) : bracketIn(rng, n, u).expr)
  const top = (sign: boolean) => (sameTop ? (sign ? plus(u, constant(rng, n)) : minus(u, constant(rng, n))) : constant(rng, n))
  const leftTop = top(rng.chance(0.5))
  const left = div(rng.chance(0.3) ? letters(factor(rng, n), leftTop) : leftTop, den())
  const right = div(top(rng.chance(0.5)), den())
  const side: Expr = left
  return { side, other: right, label: sameTop ? 'Baukasten: Bruch gleich Bruch, $x^2$ hebt sich weg' : 'Baukasten: Bruch gleich Bruch' }
}

// Mehrere Brüche mit der Variable in verschiedenen Nennern: \frac{a}{x - b} - \frac{c}{x + b} = \frac{d}{x^2 - b^2}
function fractionSum(rng: Rng, n: Names): Built {
  const u = n.unknown
  const s = n.letter()
  const p = plus(u, s)
  const m = minus(u, s)
  const dens = rng.shuffle([p, m])
  const term = (den: Expr) => div(constant(rng, n), den)
  const r = rng.next()
  if (r < 0.25) {
    // \frac{x + c}{x - b} - 1 = \frac{d}{x + b}: x^2 hebt sich weg
    const top = rng.chance(0.5) ? plus(u, constant(rng, n)) : minus(u, constant(rng, n))
    const side = rng.chance(0.5) ? minus(div(top, dens[0]), num(1)) : minus(num(1), div(top, dens[0]))
    return { side, other: term(dens[1]), label: 'Baukasten: Brüche mit verschiedenen Nennern, $x^2$ hebt sich weg' }
  }
  const left = rng.chance(0.5) ? plus(term(dens[0]), term(dens[1])) : minus(term(dens[0]), term(dens[1]))
  const product = r < 0.55 ? minus(pow(u, num(2)), pow(s, num(2))) : mul(p, m)
  const right = r < 0.8 ? div(constant(rng, n), product) : div(constant(rng, n), rng.pick(dens))
  return { side: left, other: right, label: 'Baukasten: Brüche mit verschiedenen Nennern' }
}

// Klammern, bei denen sich x^2 weghebt: (x + a)(x - b) = (x + c)^2, (x + a)^2 - (x - b)^2 = c
function cancellingSquares(rng: Rng, n: Names): Built {
  const u = n.unknown
  const bracket = () => (rng.chance(0.5) ? plus(u, constant(rng, n)) : minus(u, constant(rng, n)))
  // durch einen Nenner: \frac{(x + a)(x - b)}{c} = …
  const over = (e: Expr) => div(e, denominator(rng, n))
  const r = rng.next()
  if (r < 0.3) {
    const left = mul(bracket(), bracket())
    const right = pow(bracket(), num(2))
    return rng.chance(0.5)
      ? { side: over(minus(left, right)), other: otherSide(rng, n), label: 'Baukasten: Klammern, $x^2$ hebt sich weg' }
      : { side: left, other: plus(right, over(constant(rng, n))), label: 'Baukasten: Klammern, $x^2$ hebt sich weg' }
  }
  if (r < 0.55) return { side: over(minus(pow(bracket(), num(2)), pow(bracket(), num(2)))), other: otherSide(rng, n), label: 'Baukasten: Quadrate, $x^2$ hebt sich weg' }
  if (r < 0.75) {
    // gleicher Nenner auf beiden Seiten: \frac{x(x + a)}{c} = \frac{(x - b)(x + d)}{c}
    const den = denominator(rng, n)
    return { side: div(mul(u, bracket()), den), other: div(mul(bracket(), bracket()), den), label: 'Baukasten: Klammern, $x^2$ hebt sich weg' }
  }
  // Bruch mit Quadrat im Zähler: \frac{(x + a)^2}{x + b} = x + c
  return { side: div(pow(bracket(), num(2)), bracket()), other: bracket(), label: 'Baukasten: Quadrat im Bruch, $x^2$ hebt sich weg' }
}

// Kehrwerte addieren: \frac{1}{a} = \frac{1}{x} + \frac{1}{b}, auch mit Klammer im Nenner und nach jedem Buchstaben
function reciprocals(rng: Rng, n: Names): Built {
  const u = n.unknown
  const inner = rng.chance(0.25) ? u : bracketIn(rng, n, u, true).expr
  const one = () => (rng.chance(0.8) ? num(1) : k(rng, 2, 5))
  const terms: Expr[] = [div(one(), inner), div(one(), n.letter())]
  if (rng.chance(0.4)) terms.push(div(one(), n.letter()))
  const side = rng.shuffle(terms).reduce((acc: Expr, t) => (rng.chance(0.7) ? plus(acc, t) : minus(acc, t)))
  return { side, other: div(num(1), n.letter()), label: `Baukasten: ${terms.length} Kehrwerte` }
}

// Wurzel aus einem Bruch mit x oben und unten, mit Schalen: b\sqrt{\frac{x + a}{x - a}} - c = y
function rootOfFraction(rng: Rng, n: Names): Built {
  const u = n.unknown
  const top = bracketIn(rng, n, u)
  const bottom = bracketIn(rng, n, u)
  const conditions = [positiveCondition(bottom, u)].filter((c): c is Condition => c !== null)
  const { e, count } = someShells(rng, sqrt(div(top.expr, bottom.expr)), n, 2)
  return { side: e, conditions, label: `Baukasten: Wurzel aus einem Bruch, ${count} Schalen` }
}

// x^2 unter der Wurzel: a\sqrt{b^2 - x^2}, \sqrt{a - 3x^2}, mit Schalen
function rootCircle(rng: Rng, n: Names): Built {
  const u = n.unknown
  const sq = rng.chance(0.7) ? pow(u, num(2)) : mul(k(rng, 2, 5), pow(u, num(2)))
  const c = rng.chance(0.5) ? pow(n.letter(), num(2)) : n.letter()
  const { e, count } = someShells(rng, sqrt(minus(c, sq)), n, 3, 1)
  return { side: e, label: `Baukasten: $x^2$ unter der Wurzel, ${count} Schalen` }
}

// Zwei Wurzeln (zweimal quadrieren): \sqrt{x + a} + \sqrt{x - b} = y, \sqrt{x + a} - \sqrt{x} = y
function twoRoots(rng: Rng, n: Names): Built {
  const u = n.unknown
  const first = plus(u, constant(rng, n))
  const shift = rng.chance(0.35) ? null : constant(rng, n)
  const below = shift !== null && rng.chance(0.5)
  const second = shift === null ? u : below ? minus(u, shift) : plus(u, shift)
  // manchmal mit Faktor vor einer Wurzel: 2\sqrt{x + a}, b\sqrt{x}
  const withFactor = (e: Expr) => (rng.chance(0.3) ? letters(rng.chance(0.5) ? k(rng, 2, 4) : n.letter(), e) : e)
  const roots = rng.chance(0.5) ? [withFactor(sqrt(first)), sqrt(second)] : [sqrt(first), withFactor(sqrt(second))]
  // \sqrt{x - b} gibt es nur für x ≥ b
  const conditions: Condition[] = below ? [{ lhs: u, rel: '>', rhs: shift }] : []
  const single = () => (rng.chance(0.5) ? variable('y') : rng.chance(0.7) ? n.letter() : mul(k(rng, 2, 5), n.letter()))
  const r = rng.next()
  if (r < 0.4) return { side: plus(roots[0], roots[1]), other: single(), conditions, label: 'Baukasten: Summe zweier Wurzeln' }
  if (r < 0.75) return { side: minus(roots[0], roots[1]), other: single(), conditions, label: 'Baukasten: Differenz zweier Wurzeln' }
  return { side: roots[0], other: plus(roots[1], single()), conditions, label: 'Baukasten: Wurzel gegen Wurzel' }
}

// √x in Zähler und Nenner: \frac{\sqrt{x} + a}{\sqrt{x} - b} = y
function rootFraction(rng: Rng, n: Names): Built {
  const w = sqrt(n.unknown)
  const top = rng.chance(0.3) ? head(rng, n, w) : bracketIn(rng, n, w).expr
  const bottom = bracketIn(rng, n, w).expr
  const { e, count } = someShells(rng, div(top, bottom), n, 1)
  return { side: e, label: `Baukasten: $\\sqrt{x}$ in Zähler und Nenner, ${count} Schalen` }
}

// Klammer im Quadrat mit Bedingung: a\left(\frac{x}{b} - 1\right)^2 = y mit x > b, \frac{(x - a)^2}{b} + c = y
function squareBracket(rng: Rng, n: Names): Built {
  const u = n.unknown
  if (rng.chance(0.3)) {
    // \frac{x}{b} - 1 > 0 ⟺ x > b
    const b = n.letter()
    const base = minus(div(u, b), num(1))
    const { e, count } = someShells(rng, pow(base, num(2)), n, 3, 1)
    return { side: e, conditions: [{ lhs: u, rel: '>', rhs: b }], label: `Baukasten: Klammer im Quadrat, ${count} Schalen` }
  }
  const l = bracketIn(rng, n, u, false)
  const condition = positiveCondition(l, u)
  const { e, count } = someShells(rng, pow(l.expr, num(2)), n, 3, 2)
  return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: Klammer im Quadrat, ${count} Schalen` }
}

// Bruch mit x oben und unten im Quadrat: \left(\frac{x + a}{x - b}\right)^2 = y mit x > b. Der Zähler
// ist immer positiv, die Bedingung macht den Nenner positiv, dann gilt beim Wurzelziehen nur das Plus.
function squareOfFraction(rng: Rng, n: Names): Built {
  const u = n.unknown
  const top = rng.chance(0.3) ? head(rng, n, u) : plus(head(rng, n, u), constant(rng, n))
  const bottom = bracketIn(rng, n, u)
  const condition = positiveCondition(bottom, u)
  const { e, count } = someShells(rng, pow(div(top, bottom.expr), num(2)), n, 1)
  return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: Bruch im Quadrat, ${count} Schalen` }
}

// Doppelbrüche: \frac{a}{1 + \frac{b}{x}} = c, \frac{x - \frac{a}{b}}{x + c} = y, \frac{a + \frac{b}{x}}{c - \frac{d}{x}} = y
function doubleFraction(rng: Rng, n: Names): Built {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.4) {
    const den = rng.chance(0.5) ? plus(constant(rng, n), div(constant(rng, n), u)) : minus(constant(rng, n), div(constant(rng, n), u))
    return { side: div(constant(rng, n), den), label: 'Baukasten: Doppelbruch, Variable im inneren Bruch' }
  }
  if (r < 0.65) {
    const top = rng.chance(0.5) ? plus(u, div(n.letter(), n.letter())) : minus(u, div(n.letter(), n.letter()))
    const { e, count } = someShells(rng, div(top, bracketIn(rng, n, u).expr), n, 1)
    return { side: e, label: `Baukasten: Doppelbruch, Bruch im Zähler, ${count} Schalen` }
  }
  const inner = (den: Expr) => div(constant(rng, n), den)
  const part = (s: Expr, den: Expr) => (rng.chance(0.5) ? plus(s, inner(den)) : minus(s, inner(den)))
  const both = rng.chance(0.6)
  const side = div(part(constant(rng, n), u), part(constant(rng, n), both ? u : n.letter()))
  return { side, label: 'Baukasten: Doppelbruch mit Brüchen oben und unten' }
}

const LEVEL3_CORES: ReadonlyArray<readonly [number, (rng: Rng, n: Names) => Built]> = [
  [14, moebius],
  [6, crossFractions],
  [6, fractionSum],
  [5, cancellingSquares],
  [8, reciprocals],
  [13, rootOfFraction],
  [7, rootCircle],
  [14, twoRoots],
  [9, rootFraction],
  [5, squareBracket],
  [7, squareOfFraction],
  [13, doubleFraction],
]

export function buildLevel3(rng: Rng): KitTask {
  const n = names(rng, rng.chance(0.2))
  const total = LEVEL3_CORES.reduce((s, [w]) => s + w, 0)
  let r = rng.next() * total
  const [, build] = LEVEL3_CORES.find(([w]) => (r -= w) < 0) ?? LEVEL3_CORES[0]
  const built = build(rng, n)
  const other = built.other ?? otherSide(rng, n)
  const equationFor = built.other ? (rng.chance(0.75) ? eq(built.side, other) : eq(other, built.side)) : equation(rng, built.side, other)
  return { task: { equation: equationFor, target: n.target, conditions: built.conditions ?? [] }, label: built.label }
}
