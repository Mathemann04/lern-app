import { subterms } from '../expr/compare.ts'
import { type Expr, E, PI, add, div, eq, fn, ln, log, mul, neg, num, pow, sqrt, variable } from '../expr/types.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import { derivativeOf, integralOf } from '../rearrange/tools/tool.ts'
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

const LEVEL3_CORES: readonly Core[] = [
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

type Core = readonly [number, (rng: Rng, n: Names) => Built]

// Kern nach Anteilen wählen, bauen, andere Seite dazu
function buildFrom(rng: Rng, cores: readonly Core[], letterTarget: number): KitTask {
  const n = names(rng, rng.chance(letterTarget))
  const total = cores.reduce((s, [w]) => s + w, 0)
  let r = rng.next() * total
  const [, build] = cores.find(([w]) => (r -= w) < 0) ?? cores[0]
  const built = build(rng, n)
  const other = built.other ?? otherSide(rng, n)
  const equationFor = built.other ? (rng.chance(0.75) ? eq(built.side, other) : eq(other, built.side)) : equation(rng, built.side, other)
  return { task: { equation: equationFor, target: n.target, conditions: built.conditions ?? [] }, label: built.label }
}

export function buildLevel3(rng: Rng): KitTask {
  return buildFrom(rng, LEVEL3_CORES, 0.2)
}

// --- Stufe 4: verschachtelt mit e-Funktion, Logarithmus, Wurzeln in Wurzeln, Potenz- und
// Logarithmusgesetzen (Schritt 6a; docs/PLAN-M3.md, „Stufe 4 neu") ---
//
// Die Bausteine e^x, a^x und \ln stecken um einen Kern aus Stufe 3 herum (\ln eines Bruchs, e hoch
// einen Bruch, Wurzel aus einem \ln) oder in einem Kern drin (Bruch aus e^x oder \ln x); dazu Wurzeln
// in Wurzeln, Potenzen mit verschiedenen Hochzahlen oder Basen und mehrere Logarithmen. Schalen
// wie in Stufe 1.

// Hochzahl mit der Variable: x, kx, -kx, 2x, \frac{x}{k}, -\frac{x}{k}, x - c, -k(x - c)
function exponentIn(rng: Rng, n: Names, u: Expr): Expr {
  const r = rng.next()
  if (r < 0.15) return u
  if (r < 0.35) return letters(n.letter(), u)
  if (r < 0.5) return neg(letters(n.letter(), u))
  if (r < 0.6) return mul(k(rng, 2, 4), u)
  if (r < 0.7) return div(u, n.letter())
  if (r < 0.8) return neg(div(u, n.letter()))
  if (r < 0.9) return bracketIn(rng, n, u, true).expr
  return neg(mul(n.letter(), minus(u, n.letter())))
}

// Basis einer Potenz: meist e, sonst 2, 3, 10 oder ein Buchstabe
function powerBase(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.7) return E
  if (r < 0.9) return num(rng.pick([2, 3, 10]))
  return n.letter()
}

// Logarithmus: meist \ln, sonst \log_2, \log_{10} oder \log_a
function logOf(rng: Rng, n: Names, arg: Expr): Expr {
  const r = rng.next()
  if (r < 0.75) return ln(arg)
  if (r < 0.9) return log(num(rng.pick([2, 10])), arg)
  return log(n.letter(), arg)
}

// Logarithmus um einen Kern: \ln\frac{x + a}{x - b} = c, b\ln(2x - a) + c = y, \log_2\left(\sqrt{x} + a\right) = y
function logOfCore(rng: Rng, n: Names): Built {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.45) {
    const top = bracketIn(rng, n, u)
    const bottom = bracketIn(rng, n, u)
    const condition = positiveCondition(bottom, u)
    const { e, count } = someShells(rng, logOf(rng, n, div(top.expr, bottom.expr)), n, 2)
    return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: Logarithmus eines Bruchs, ${count} Schalen` }
  }
  if (r < 0.75) {
    const l = bracketIn(rng, n, u, false)
    const condition = positiveCondition(l, u)
    const { e, count } = someShells(rng, logOf(rng, n, l.expr), n, 3, 2)
    return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: Logarithmus einer Klammer, ${count} Schalen` }
  }
  const { e, count } = someShells(rng, logOf(rng, n, plus(sqrt(u), constant(rng, n))), n, 2, 1)
  return { side: e, label: `Baukasten: Logarithmus von $\\sqrt{x}$ plus Zahl, ${count} Schalen` }
}

// e hoch einen Kern: ae^{-kx} + b = y, y = a\left(1 - e^{-\frac{x}{k}}\right), e^{\frac{x}{x + a}} = b
function expOfCore(rng: Rng, n: Names): Built {
  const u = n.unknown
  const b = powerBase(rng, n)
  const r = rng.next()
  if (r < 0.25) {
    // Bruch in der Hochzahl
    const top = rng.chance(0.4) ? head(rng, n, u) : bracketIn(rng, n, u).expr
    const bottom = bracketIn(rng, n, u)
    const condition = positiveCondition(bottom, u)
    const { e, count } = someShells(rng, pow(b, div(top, bottom.expr)), n, 2)
    return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: Bruch in der Hochzahl, ${count} Schalen` }
  }
  if (r < 0.45) {
    // Sättigung: a\left(1 - e^{-kx}\right)
    const p = pow(b, exponentIn(rng, n, u))
    const inner = rng.chance(0.7) ? minus(num(1), p) : minus(p, num(1))
    const { e, count } = someShells(rng, letters(n.letter(), inner), n, 1)
    return { side: e, label: `Baukasten: Sättigung mit e-Funktion, ${count} Schalen` }
  }
  const { e, count } = someShells(rng, pow(b, exponentIn(rng, n, u)), n, 3, 2)
  return { side: e, label: `Baukasten: e-Funktion mit Schalen, ${count} Schalen` }
}

// Bruch aus e^x oder \ln x: \frac{ae^x + b}{e^x - c} = y, \frac{a}{1 + be^{-kx}} = y,
// \frac{a + \ln x}{b - \ln x} = y, a\ln x + b = c\ln x + d
function blockFraction(rng: Rng, n: Names): Built {
  const u = n.unknown
  const block = rng.chance(0.65) ? pow(powerBase(rng, n), exponentIn(rng, n, u)) : logOf(rng, n, rng.chance(0.7) ? u : letters(n.letter(), u))
  const r = rng.next()
  if (r < 0.3) {
    // logistisches Wachstum: \frac{a}{1 + be^{-kx}}
    const den = plus(rng.chance(0.6) ? num(1) : constant(rng, n), letters(n.letter(), block))
    const { e, count } = someShells(rng, div(n.letter(), den), n, 1)
    return { side: e, label: `Baukasten: logistisch, ${count} Schalen` }
  }
  if (r < 0.75) {
    const top = rng.chance(0.3) ? block : bracketIn(rng, n, block).expr
    const { e, count } = someShells(rng, div(top, bracketIn(rng, n, block).expr), n, 1)
    return { side: e, label: `Baukasten: Bruch aus $e^x$ oder $\\ln x$, ${count} Schalen` }
  }
  // Baustein auf beiden Seiten
  const term = () => (rng.chance(0.5) ? plus(head(rng, n, block), constant(rng, n)) : minus(head(rng, n, block), constant(rng, n)))
  return { side: term(), other: term(), label: 'Baukasten: $e^x$ oder $\\ln x$ auf beiden Seiten' }
}

// Wurzel aus einem Logarithmus oder einer e-Funktion: \sqrt{a + \ln\frac{x}{b}} = y, b\sqrt{e^{kx} - a} = y
function rootOfBlock(rng: Rng, n: Names): Built {
  const u = n.unknown
  const inner = rng.chance(0.5)
    ? logOf(rng, n, rng.chance(0.5) ? div(u, n.letter()) : bracketIn(rng, n, u, false).expr)
    : pow(powerBase(rng, n), exponentIn(rng, n, u))
  const arg = rng.chance(0.6) ? plus(constant(rng, n), inner) : minus(inner, constant(rng, n))
  const { e, count } = someShells(rng, sqrt(arg), n, 2, 1)
  return { side: e, label: `Baukasten: Wurzel aus $\\ln$ oder $e^x$, ${count} Schalen` }
}

// Logarithmus einer Summe mit Wurzel: y = \ln\left(a + \sqrt{x + b}\right), y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)
function logOfRoot(rng: Rng, n: Names): Built {
  const u = n.unknown
  const under = rng.chance(0.5) ? plus(constant(rng, n), pow(E, exponentIn(rng, n, u))) : bracketIn(rng, n, u).expr
  const arg = plus(rng.chance(0.4) ? num(1) : constant(rng, n), sqrt(under))
  const { e, count } = someShells(rng, logOf(rng, n, arg), n, 2, 1)
  return { side: e, label: `Baukasten: Logarithmus einer Summe mit Wurzel, ${count} Schalen` }
}

// Wurzeln in Wurzeln: \sqrt{a + \sqrt{b + \sqrt{x}}} = y, \sqrt{a + b\sqrt{x - c}} = y
function nestedRoots(rng: Rng, n: Names): Built {
  const u = n.unknown
  const l = bracketIn(rng, n, u)
  const plain = rng.chance(0.5)
  const innermost = plain ? sqrt(u) : sqrt(l.expr)
  const condition = plain ? null : positiveCondition(l, u)
  const middle = sqrt(plus(constant(rng, n), rng.chance(0.3) ? letters(n.letter(), innermost) : innermost))
  const deep = rng.chance(0.5)
  const outer = deep ? sqrt(plus(constant(rng, n), middle)) : middle
  const { e, count } = someShells(rng, outer, n, 2, 1)
  return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: Wurzeln in Wurzeln, ${count} Schalen` }
}

// Potenzen derselben Basis mit verschiedenen Hochzahlen: a \cdot 2^{x + 1} - b \cdot 2^x = c
function powerSums(rng: Rng, n: Names): Built {
  const u = n.unknown
  const b = rng.chance(0.6) ? num(rng.pick([2, 3, 5, 10])) : rng.chance(0.5) ? E : n.letter()
  const g = rng.chance(0.75) ? u : mul(k(rng, 2, 3), u)
  const shift = rng.int(1, 2)
  const shifted = pow(b, rng.chance(0.7) ? plus(g, num(shift)) : minus(g, num(shift)))
  const coefficient = (e: Expr) => (rng.chance(0.6) ? mul(rng.chance(0.7) ? n.letter() : k(rng, 2, 5), e) : e)
  const [first, second] = rng.shuffle([coefficient(shifted), coefficient(pow(b, g))])
  const sum = rng.chance(0.6) ? minus(first, second) : plus(first, second)
  const { e, count } = someShells(rng, sum, n, 2, 1)
  return { side: e, label: `Baukasten: Potenzen derselben Basis, ${count} Schalen` }
}

// Potenzen verschiedener Basen: 3^{2x - 1} = a \cdot 5^x, a^x \cdot b^{2x - 1} = c, \frac{2^{x + 1}}{3^x} = y
function powerVsPower(rng: Rng, n: Names): Built {
  const u = n.unknown
  const pool: Expr[] = [num(2), num(3), num(5), E, n.letter(), n.letter()]
  const [b1, b2] = rng.shuffle(pool).slice(0, 2)
  const exponent = (): Expr => {
    const r = rng.next()
    if (r < 0.4) return u
    if (r < 0.7) return rng.chance(0.5) ? plus(mul(k(rng, 2, 3), u), num(1)) : minus(mul(k(rng, 2, 3), u), num(1))
    return rng.chance(0.5) ? plus(u, num(rng.int(1, 2))) : minus(u, num(rng.int(1, 2)))
  }
  const p1 = pow(b1, exponent())
  const p2 = pow(b2, exponent())
  if (rng.chance(0.4)) {
    // mit Faktor oder Bruch auf beiden Seiten: \frac{a \cdot 3^{2x - 1}}{b} = c \cdot 5^x
    const side = rng.chance(0.5) ? div(mul(n.letter(), p1), n.letter()) : mul(n.letter(), p1)
    return { side, other: mul(n.letter(), p2), label: 'Baukasten: Potenz gegen Potenz' }
  }
  const side = rng.chance(0.65) ? mul(p1, p2) : div(p1, p2)
  const { e, count } = someShells(rng, side, n, 1)
  return { side: e, label: `Baukasten: Produkt von Potenzen, ${count} Schalen` }
}

// Mehrere Logarithmen: \ln(x + a) + \ln(x - a) = b, \log_2(x + a) - \log_2 x = b
function logSums(rng: Rng, n: Names): Built {
  const u = n.unknown
  const r0 = rng.next()
  const base = r0 < 0.7 ? E : r0 < 0.85 ? num(rng.pick([2, 10])) : n.letter()
  const L = (arg: Expr) => (base === E ? ln(arg) : log(base, arg))
  const a = constant(rng, n)
  const r = rng.next()
  let sum: Expr
  let conditions: Condition[] = []
  if (r < 0.35) {
    sum = plus(L(plus(u, a)), L(minus(u, a)))
    conditions = [{ lhs: u, rel: '>', rhs: a }]
  } else if (r < 0.7) {
    const top = rng.chance(0.6) ? plus(u, a) : plus(head(rng, n, u), a)
    sum = rng.chance(0.7) ? minus(L(top), L(u)) : minus(L(u), L(top))
  } else {
    const b = constant(rng, n)
    sum = minus(L(plus(u, a)), L(minus(u, b)))
    conditions = [{ lhs: u, rel: '>', rhs: b }]
  }
  const { e, count } = someShells(rng, sum, n, 2, 1)
  return { side: e, conditions, label: `Baukasten: mehrere Logarithmen, ${count} Schalen` }
}

const LEVEL4_CORES: readonly Core[] = [
  [12, logOfCore],
  [12, expOfCore],
  [14, blockFraction],
  [8, rootOfBlock],
  [8, logOfRoot],
  [10, nestedRoots],
  [10, powerSums],
  [10, powerVsPower],
  [10, logSums],
]

export function buildLevel4(rng: Rng): KitTask {
  return buildFrom(rng, LEVEL4_CORES, 0.15)
}

// --- Stufe 4, Teil 6b: Winkel- und Hyperbelfunktionen, Umkehrfunktionen ---
//
// \sin, \cos, \tan, \sinh, \cosh, \tanh als Baustein in einem Kern (Bruch, Summe auf beiden Seiten,
// Quadrate mit \sin^2 x + \cos^2 x = 1, Quotient mit \tan x = \frac{\sin x}{\cos x}) und Umkehrfunktionen
// um einen Kern (\arctan\frac{x + a}{x - b} = c). Damit die Lösung eindeutig ist, nennt die Aufgabe den
// Bereich des Winkels, z. B. x < \frac{\pi}{2} (x ist positiv wie alle Buchstaben).

type TrigName = 'sin' | 'cos' | 'tan' | 'sinh' | 'cosh' | 'tanh'

// Funktion: meist Winkelfunktionen, seltener Hyperbelfunktionen
function trigName(rng: Rng, allowed: readonly TrigName[] = ['sin', 'sin', 'cos', 'cos', 'tan', 'tan', 'sinh', 'cosh', 'tanh']): TrigName {
  return rng.pick(allowed)
}

// Winkel mit der Variable: x, 2x, bx, \frac{x}{b}
function angleIn(rng: Rng, n: Names, u: Expr): Expr {
  const r = rng.next()
  if (r < 0.45) return u
  if (r < 0.7) return mul(k(rng, 2, 3), u)
  if (r < 0.85) return letters(n.letter(), u)
  return div(u, n.letter())
}

// Bereich, in dem die Funktion umkehrbar ist: \sin und \tan bis \frac{\pi}{2}, \cos bis \pi (im Quadrat
// oder unter einer Wurzel bis \frac{\pi}{2}); Hyperbelfunktionen brauchen nur x > 0.
// Winkel kx: \frac{\pi}{2k}, bx: \frac{\pi}{2b}, \frac{x}{b}: \frac{b\pi}{2}
function angleConditions(name: TrigName, angle: Expr, u: Expr, half = false): Condition[] {
  if (name === 'sinh' || name === 'cosh' || name === 'tanh') return []
  const quarter = half || name !== 'cos'
  let bound: Expr
  if (angle.kind === 'mul') {
    const f = angle.factors[0]
    bound = quarter ? div(PI, f.kind === 'num' ? num(f.value.n * 2n) : mul(num(2), f)) : div(PI, f)
  } else if (angle.kind === 'div') {
    bound = quarter ? div(mul(angle.den, PI), num(2)) : mul(angle.den, PI)
  } else bound = quarter ? div(PI, num(2)) : PI
  return [{ lhs: u, rel: '<', rhs: bound }]
}

const trigOf = (name: TrigName, angle: Expr) => fn(name, angle)

// Bruch aus \sin x oder \tanh x: \frac{a + \sin x}{a - \sin x} = y, \frac{a}{b + c\tan x} = y,
// a\cos(2x) + b = c\cos(2x) + d
function trigFraction(rng: Rng, n: Names): Built {
  const u = n.unknown
  const name = trigName(rng)
  const angle = angleIn(rng, n, u)
  const block = trigOf(name, angle)
  const conditions = angleConditions(name, angle, u)
  const r = rng.next()
  if (r < 0.3) {
    const den = plus(rng.chance(0.5) ? num(1) : constant(rng, n), letters(n.letter(), block))
    const { e, count } = someShells(rng, div(n.letter(), den), n, 1)
    return { side: e, conditions, label: `Baukasten: Bruch mit $\\${name}$ im Nenner, ${count} Schalen` }
  }
  if (r < 0.75) {
    const top = rng.chance(0.3) ? block : bracketIn(rng, n, block).expr
    const { e, count } = someShells(rng, div(top, bracketIn(rng, n, block).expr), n, 1)
    return { side: e, conditions, label: `Baukasten: Bruch aus $\\${name}$, ${count} Schalen` }
  }
  const term = () => (rng.chance(0.5) ? plus(head(rng, n, block), constant(rng, n)) : minus(head(rng, n, block), constant(rng, n)))
  return { side: term(), other: term(), conditions, label: `Baukasten: $\\${name}$ auf beiden Seiten` }
}

// Winkelfunktion mit Schalen, auch unter einer Wurzel: a\sin(2x) + b = y, y = \sqrt{a - \cos x}
function trigShells(rng: Rng, n: Names): Built {
  const u = n.unknown
  const name = trigName(rng)
  const angle = angleIn(rng, n, u)
  const block = trigOf(name, angle)
  if (rng.chance(0.35)) {
    const arg = rng.chance(0.5) ? plus(constant(rng, n), letters(n.letter(), block)) : minus(constant(rng, n), block)
    const { e, count } = someShells(rng, sqrt(arg), n, 2, 1)
    return { side: e, conditions: angleConditions(name, angle, u), label: `Baukasten: Wurzel aus $\\${name}$, ${count} Schalen` }
  }
  const { e, count } = someShells(rng, block, n, 4, 3)
  return { side: e, conditions: angleConditions(name, angle, u), label: `Baukasten: $\\${name}$ mit Schalen, ${count} Schalen` }
}

// Umkehrfunktion um einen Kern: y = a\arctan\frac{x}{b} + c, \arcsin\frac{x - a}{b} = y,
// \arctan\frac{x + a}{x - b} = c, \arctan\left(e^{x} - a\right) = y
function arcOfCore(rng: Rng, n: Names): Built {
  const u = n.unknown
  const arc = rng.pick(['arcsin', 'arccos', 'arctan', 'arctan'] as const)
  const r = rng.next()
  if (r < 0.35) {
    const inner = rng.chance(0.5) ? div(u, n.letter()) : div(bracketIn(rng, n, u, false).expr, n.letter())
    const { e, count } = someShells(rng, fn(arc, inner), n, 3, 1)
    return { side: e, label: `Baukasten: $\\${arc}$ um einen Bruch, ${count} Schalen` }
  }
  if (r < 0.65) {
    // x in Zähler und Nenner in der Umkehrfunktion
    const top = rng.chance(0.4) ? head(rng, n, u) : bracketIn(rng, n, u).expr
    const bottom = bracketIn(rng, n, u)
    const condition = positiveCondition(bottom, u)
    const { e, count } = someShells(rng, fn('arctan', div(top, bottom.expr)), n, 2)
    return { side: e, conditions: condition ? [condition] : [], label: `Baukasten: $\\arctan$ eines Bruchs mit $x$ oben und unten, ${count} Schalen` }
  }
  if (r < 0.85) {
    // e-Funktion oder Wurzel in der Umkehrfunktion
    const inner = rng.chance(0.5) ? minus(pow(E, exponentIn(rng, n, u)), constant(rng, n)) : plus(sqrt(u), constant(rng, n))
    const { e, count } = someShells(rng, fn('arctan', inner), n, 2, 1)
    return { side: e, label: `Baukasten: $\\arctan$ um $e^x$ oder $\\sqrt{x}$, ${count} Schalen` }
  }
  // Areafunktion
  const area = rng.pick(['arsinh', 'artanh'] as const)
  const { e, count } = someShells(rng, fn(area, div(u, n.letter())), n, 3, 2)
  return { side: e, label: `Baukasten: $\\operatorname{${area}}$ mit Schalen, ${count} Schalen` }
}

// Quadrate: y = a\cos^2 x + b\sin^2 x, a\sin^2 x = b\cos^2 x + c, a\cosh^2 x - b\sinh^2 x = y
function trigSquares(rng: Rng, n: Names): Built {
  const u = n.unknown
  const hyperbolic = rng.chance(0.3)
  const [s, c] = hyperbolic ? (['sinh', 'cosh'] as const) : (['sin', 'cos'] as const)
  const angle = rng.chance(0.6) ? u : angleIn(rng, n, u)
  const sq = (name: TrigName) => pow(trigOf(name, angle), num(2))
  const [first, second] = rng.shuffle([s, c])
  const conditions = angleConditions(s, angle, u, true)
  const coefficient = () => (rng.chance(0.75) ? n.letter() : k(rng, 2, 5))
  if (rng.chance(0.4)) {
    const term = mul(coefficient(), sq(second))
    const other = rng.chance(0.6) ? plus(term, constant(rng, n)) : rng.chance(0.5) ? minus(term, constant(rng, n)) : minus(constant(rng, n), term)
    return { side: mul(coefficient(), sq(first)), other, conditions, label: `Baukasten: $\\${first}^2$ gegen $\\${second}^2$` }
  }
  const sum = rng.chance(0.6) ? plus(mul(coefficient(), sq(first)), mul(coefficient(), sq(second))) : minus(mul(coefficient(), sq(first)), mul(coefficient(), sq(second)))
  const { e, count } = someShells(rng, sum, n, 2)
  return { side: e, conditions, label: `Baukasten: $\\${first}^2$ und $\\${second}^2$, ${count} Schalen` }
}

// Sinus und Kosinus in jedem Summanden: \frac{a\sin x + b\cos x}{\sin x - c\cos x} = y, a\sin x = b\cos x + c\sin x
function trigQuotient(rng: Rng, n: Names): Built {
  const u = n.unknown
  const hyperbolic = rng.chance(0.25)
  const [s, c] = hyperbolic ? (['sinh', 'cosh'] as const) : (['sin', 'cos'] as const)
  const angle = rng.chance(0.6) ? u : angleIn(rng, n, u)
  const conditions = angleConditions(s === 'sin' ? 'tan' : 'tanh', angle, u)
  const term = (name: TrigName) => (rng.chance(0.4) ? trigOf(name, angle) : mul(rng.chance(0.75) ? n.letter() : k(rng, 2, 5), trigOf(name, angle)))
  const pairSum = () => {
    const [p, q] = rng.shuffle([term(s), term(c)])
    return rng.chance(0.55) ? plus(p, q) : minus(p, q)
  }
  if (rng.chance(0.6)) {
    const { e, count } = someShells(rng, div(pairSum(), pairSum()), n, 1)
    return { side: e, conditions, label: `Baukasten: Bruch aus $\\${s}$ und $\\${c}$, ${count} Schalen` }
  }
  const [left, right] = rng.chance(0.5) ? [term(s), rng.chance(0.5) ? pairSum() : term(c)] : [pairSum(), term(s === 'sin' ? 'cos' : 'cosh')]
  return { side: left, other: right, conditions, label: `Baukasten: $\\${s}$ gegen $\\${c}$` }
}

// e-Funktion und Logarithmus um eine Winkelfunktion: b\,e^{a\sin x} = y, \ln(a + \tan x) = y
function trigInExp(rng: Rng, n: Names): Built {
  const u = n.unknown
  const name = trigName(rng, ['sin', 'cos', 'tan', 'tan', 'sinh', 'tanh'])
  const angle = rng.chance(0.6) ? u : angleIn(rng, n, u)
  const block = trigOf(name, angle)
  const conditions = angleConditions(name, angle, u)
  const core = rng.chance(0.5) ? pow(powerBase(rng, n), rng.chance(0.5) ? block : letters(n.letter(), block)) : logOf(rng, n, plus(constant(rng, n), block))
  const { e, count } = someShells(rng, core, n, 2, 1)
  return { side: e, conditions, label: `Baukasten: $\\${name}$ in $e$ hoch oder $\\ln$, ${count} Schalen` }
}

const LEVEL4_TRIG_CORES: readonly Core[] = [
  [16, trigFraction],
  [10, trigShells],
  [16, arcOfCore],
  [14, trigSquares],
  [14, trigQuotient],
  [10, trigInExp],
]

// Gesucht ist hier immer x: in den Funktionen steckt das Neue
export function buildLevel4Trig(rng: Rng): KitTask {
  return buildFrom(rng, LEVEL4_TRIG_CORES, 0)
}

// --- Stufe 4, Teil 6c: Substitution und pq-Formel mit Scheinlösungen ---
//
// Gleichungen, die nach einer Substitution (u = e^x, u = \sqrt{x}, u = \sin x, u = \ln x, u = x^2) oder
// gleich in x quadratisch werden. Die Kerne sind so gebaut, dass von den beiden Lösungen der
// pq-Formel genau eine passt: q < 0 (Lösungen mit verschiedenen Vorzeichen) oder, bei
// \frac{e^x + e^{-x}}{2}, das Produkt der Lösungen 1 (nur eine gibt x > 0). Schalen, die das
// Vorzeichen von q ändern könnten, gibt es bei diesen Kernen nicht (positiveShells).

// Andere Seite, sicher positiv: y, b, 3b, \frac{b}{c}, b + c
function positiveSide(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.45) return variable('y')
  if (r < 0.7) return n.letter()
  if (r < 0.82) return mul(k(rng), n.letter())
  if (r < 0.92) return div(n.letter(), n.letter())
  return plus(n.letter(), n.letter())
}

// Schalen, die q < 0 erhalten: mal, geteilt, minus eine positive Zahl
function positiveShells(rng: Rng, core: Expr, n: Names, max: number, min = 0): { e: Expr; count: number } {
  const count = rng.int(min, max)
  let e = core
  for (let i = 0; i < count; i++) {
    const r = rng.next()
    if (r < 0.4 && !hasFraction(e)) e = div(e, denominator(rng, n))
    else if (r < 0.75 || e.kind === 'div') e = letters(factor(rng, n), e)
    else e = minus(e, summand(rng, n))
  }
  return { e, count }
}

// Schalen, die nur malnehmen oder teilen (die andere Seite steckt später in p, dort keine Summen)
function scaleShells(rng: Rng, core: Expr, n: Names, max: number, min = 0): { e: Expr; count: number } {
  const count = rng.int(min, max)
  let e = core
  for (let i = 0; i < count; i++) e = rng.chance(0.5) && !hasFraction(e) ? div(e, denominator(rng, n)) : letters(factor(rng, n), e)
  return { e, count }
}

// Andere Seite ohne Summe: y, b, 3b, \frac{b}{c}
function simpleSide(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.5) return variable('y')
  if (r < 0.75) return n.letter()
  if (r < 0.88) return mul(k(rng), n.letter())
  return div(n.letter(), n.letter())
}

// Koeffizient vor einem Baustein: b oder 3
const coefficient = (rng: Rng, n: Names): Expr => (rng.chance(0.65) ? n.letter() : k(rng, 2, 5))

// Baustein mal Koeffizient, manchmal ohne: e^{x}, be^{x}
const maybeTimes = (rng: Rng, n: Names, e: Expr, p = 0.5): Expr => (rng.chance(p) ? mul(coefficient(rng, n), e) : e)

// Potenzen eines Bausteins B = b^{kx}: power(m) = b^{mkx}, z. B. e^{x}, e^{2x}, e^{-x}; e^{3x}, e^{6x};
// a^{x}, a^{2x}; e^{kx}, e^{2kx}
function expPowers(rng: Rng, n: Names, u: Expr): (m: number) => Expr {
  const r0 = rng.next()
  const base = r0 < 0.72 ? E : r0 < 0.86 ? num(rng.pick([2, 3])) : n.letter()
  const r = rng.next()
  const factorOf: Expr | null = r < 0.62 ? null : r < 0.78 ? k(rng, 2, 3) : n.letter()
  const exponent = (m: number): Expr => {
    const sign = m < 0 ? -1 : 1
    const a = Math.abs(m)
    let e: Expr
    if (!factorOf) e = a === 1 ? u : mul(num(a), u)
    else if (factorOf.kind === 'num') e = mul(num(factorOf.value.n * BigInt(a)), u)
    else e = a === 1 ? letters(factorOf, u) : mul(num(a), factorOf, u)
    return sign < 0 ? neg(e) : e
  }
  return (m) => pow(base, exponent(m))
}

// e^{2x} und e^{x}: e^{2x} - ae^{x} = b, ae^{2x} = be^{x} + c, e^{x}\left(e^{x} + a\right) = b,
// e^{x} - ae^{-x} = y, \frac{e^{x} - e^{-x}}{2} = y, a\left(e^{x} + e^{-x}\right) = y, \ln\left(e^{2x} + ae^{x}\right) = b
function expQuadratic(rng: Rng, n: Names): Built {
  const power = expPowers(rng, n, n.unknown)
  const [b1, b2, bInv] = [power(1), power(2), power(-1)]
  const r = rng.next()
  if (r < 0.45) {
    const lead = maybeTimes(rng, n, b2, 0.35)
    const mid = maybeTimes(rng, n, b1, 0.8)
    const v = rng.next()
    let side: Expr
    let other: Expr | undefined
    if (v < 0.5) side = rng.chance(0.5) ? plus(lead, mid) : minus(lead, mid)
    else if (v < 0.8) {
      side = lead
      other = rng.chance(0.6) ? plus(mid, positiveSide(rng, n)) : minus(positiveSide(rng, n), mid)
    } else side = mul(b1, rng.chance(0.5) ? plus(b1, coefficient(rng, n)) : minus(b1, coefficient(rng, n)))
    if (!other && rng.chance(0.3)) {
      // außen \ln oder Wurzel
      const outer = rng.chance(0.5) ? logOf(rng, n, side) : sqrt(side)
      return { side: outer, label: 'Baukasten: $e^{2x}$ und $e^x$ in $\\ln$ oder Wurzel' }
    }
    const { e, count } = other ? { e: side, count: 0 } : positiveShells(rng, side, n, 1)
    return { side: e, ...(other ? { other } : { other: positiveSide(rng, n) }), label: `Baukasten: $e^{2x}$ und $e^x$, ${count} Schalen` }
  }
  if (r < 0.75) {
    // e^x und e^{-x} mit Minus: genau eine Lösung positiv
    const core = rng.chance(0.4) ? div(minus(b1, bInv), num(2)) : minus(maybeTimes(rng, n, b1, 0.3), maybeTimes(rng, n, bInv, 0.75))
    const { e, count } = scaleShells(rng, core, n, 1)
    return { side: e, other: simpleSide(rng, n), label: `Baukasten: $e^x$ und $e^{-x}$ mit Minus, ${count} Schalen` }
  }
  // e^x + e^{-x}: Produkt der Lösungen 1, x > 0 nimmt die größere
  const core = rng.chance(0.5) ? div(plus(b1, bInv), num(2)) : plus(b1, bInv)
  const { e, count } = scaleShells(rng, core, n, 1, core.kind === 'div' ? 0 : 1)
  return { side: e, other: simpleSide(rng, n), label: `Baukasten: $e^x$ und $e^{-x}$ mit Plus, ${count} Schalen` }
}

// x und \sqrt{x}: x - a\sqrt{x} = b, ax + b\sqrt{x} = c, \frac{x - a}{\sqrt{x}} = y, \sqrt{x}\left(\sqrt{x} + a\right) = b
function sqrtQuadratic(rng: Rng, n: Names): Built {
  const u = n.unknown
  const root = sqrt(u)
  const r = rng.next()
  if (r < 0.55) {
    const lead = maybeTimes(rng, n, u, 0.35)
    const mid = maybeTimes(rng, n, root, 0.85)
    const side = rng.chance(0.5) ? plus(lead, mid) : minus(lead, mid)
    const { e, count } = positiveShells(rng, side, n, 2)
    return { side: e, other: positiveSide(rng, n), label: `Baukasten: $x$ und $\\sqrt{x}$, ${count} Schalen` }
  }
  if (r < 0.8) {
    const { e, count } = scaleShells(rng, div(minus(u, constant(rng, n)), root), n, 1)
    return { side: e, other: simpleSide(rng, n), label: `Baukasten: $\\frac{x - a}{\\sqrt{x}}$, ${count} Schalen` }
  }
  const { e, count } = positiveShells(rng, mul(root, plus(root, constant(rng, n))), n, 1)
  return { side: e, other: positiveSide(rng, n), label: `Baukasten: $\\sqrt{x}$ mal Klammer, ${count} Schalen` }
}

// \sin^2 x und \sin x: \sin^2 x + a\sin x = b, \cos^2 x = a\sin x, \tan^2 x - a\tan x = b,
// \sinh x\left(\sinh x + a\right) = y
function trigQuadratic(rng: Rng, n: Names): Built {
  const u = n.unknown
  const name = trigName(rng, ['sin', 'sin', 'sin', 'cos', 'cos', 'tan', 'tan', 'sinh', 'sinh'])
  const angle = rng.chance(0.65) ? u : angleIn(rng, n, u)
  const conditions = angleConditions(name, angle, u, true)
  const f = trigOf(name, angle)
  const square = pow(f, num(2))
  const r = rng.next()
  if (r < 0.3 && (name === 'sin' || name === 'cos')) {
    // \cos^2 x = a\sin x: erst mit \sin^2 x + \cos^2 x = 1 ersetzen
    const partner = pow(trigOf(name === 'sin' ? 'cos' : 'sin', angle), num(2))
    const side = maybeTimes(rng, n, partner, 0.4)
    return { side, other: mul(coefficient(rng, n), f), conditions, label: `Baukasten: $\\${name === 'sin' ? 'cos' : 'sin'}^2$ gegen $\\${name}$` }
  }
  if (r < 0.75) {
    const lead = maybeTimes(rng, n, square, 0.3)
    const mid = maybeTimes(rng, n, f, 0.8)
    const side = rng.chance(0.55) ? plus(lead, mid) : minus(lead, mid)
    const { e, count } = positiveShells(rng, side, n, 1)
    return { side: e, other: positiveSide(rng, n), conditions, label: `Baukasten: $\\${name}^2$ und $\\${name}$, ${count} Schalen` }
  }
  const { e, count } = positiveShells(rng, mul(f, plus(f, constant(rng, n))), n, 1)
  return { side: e, other: positiveSide(rng, n), conditions, label: `Baukasten: $\\${name}$ mal Klammer, ${count} Schalen` }
}

// Logarithmen, danach quadratisch in x: \ln x + \ln(x + a) = b, \log_2 x + \log_2(x - a) = b,
// 2\ln x - \ln(x + a) = b, (\ln x)^2 - a\ln x = b
function logQuadratic(rng: Rng, n: Names): Built {
  const u = n.unknown
  const r0 = rng.next()
  const base = r0 < 0.7 ? E : r0 < 0.85 ? num(rng.pick([2, 10])) : n.letter()
  const L = (arg: Expr) => (base === E ? ln(arg) : log(base, arg))
  const r = rng.next()
  if (r < 0.2) {
    // \ln x als Unbekannte, x > 1
    const lnx = ln(u)
    const side = rng.chance(0.5) ? minus(pow(lnx, num(2)), maybeTimes(rng, n, lnx, 0.8)) : plus(pow(lnx, num(2)), maybeTimes(rng, n, lnx, 0.8))
    const { e, count } = positiveShells(rng, side, n, 1)
    return { side: e, other: positiveSide(rng, n), conditions: [{ lhs: u, rel: '>', rhs: num(1) }], label: `Baukasten: $\\ln^2 x$ und $\\ln x$, ${count} Schalen` }
  }
  const a = constant(rng, n)
  let sum: Expr
  let conditions: Condition[] = []
  if (r < 0.45) sum = plus(L(u), L(plus(u, a)))
  else if (r < 0.65) {
    sum = plus(L(u), L(minus(u, a)))
    conditions = [{ lhs: u, rel: '>', rhs: a }]
  } else sum = minus(mul(num(2), L(u)), L(plus(u, a)))
  const { e, count } = someShells(rng, sum, n, 1)
  return { side: e, conditions, label: `Baukasten: Logarithmen, danach quadratisch, ${count} Schalen` }
}

// x^4 und x^2: x^4 - ax^2 = b, ax^4 = bx^2 + c, \frac{x^4 - a}{x^2} = y
function biquadratic(rng: Rng, n: Names): Built {
  const u = n.unknown
  const [x2, x4] = [pow(u, num(2)), pow(u, num(4))]
  const r = rng.next()
  if (r < 0.55) {
    const side = rng.chance(0.5) ? plus(maybeTimes(rng, n, x4, 0.3), maybeTimes(rng, n, x2, 0.8)) : minus(maybeTimes(rng, n, x4, 0.3), maybeTimes(rng, n, x2, 0.8))
    const { e, count } = positiveShells(rng, side, n, 1)
    return { side: e, other: positiveSide(rng, n), label: `Baukasten: $x^4$ und $x^2$, ${count} Schalen` }
  }
  if (r < 0.75) {
    const other = rng.chance(0.6) ? plus(maybeTimes(rng, n, x2, 0.8), positiveSide(rng, n)) : minus(positiveSide(rng, n), maybeTimes(rng, n, x2, 0.8))
    return { side: maybeTimes(rng, n, x4, 0.4), other, label: 'Baukasten: $x^4$ gegen $x^2$' }
  }
  const { e, count } = scaleShells(rng, div(minus(x4, constant(rng, n)), x2), n, 1)
  return { side: e, other: simpleSide(rng, n), label: `Baukasten: $\\frac{x^4 - a}{x^2}$, ${count} Schalen` }
}

// Bruch, danach quadratisch in x: x - \frac{a}{x} = y, \frac{a}{x + b} = x, x(x + a) = b,
// (x + a)(x - b) = c
function rationalQuadratic(rng: Rng, n: Names): Built {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.35) {
    const core = rng.chance(0.6) ? minus(maybeTimes(rng, n, u, 0.3), div(constant(rng, n), u)) : div(minus(pow(u, num(2)), constant(rng, n)), u)
    const { e, count } = scaleShells(rng, core, n, 1, 1)
    return { side: e, other: simpleSide(rng, n), label: `Baukasten: $x$ minus Bruch mit $x$ im Nenner, ${count} Schalen` }
  }
  if (r < 0.6) {
    const { e, count } = scaleShells(rng, div(n.letter(), plus(u, constant(rng, n))), n, 1)
    return { side: e, other: maybeTimes(rng, n, u, 0.3), label: `Baukasten: Bruch gleich $x$, ${count} Schalen` }
  }
  const b = bracketIn(rng, n, u)
  if (b.sign === 1 && rng.chance(0.6)) {
    const condition = positiveCondition(b, u)
    const { e, count } = positiveShells(rng, mul(plus(u, constant(rng, n)), b.expr), n, 1, 1)
    return { side: e, other: positiveSide(rng, n), conditions: condition ? [condition] : [], label: `Baukasten: Klammer mal Klammer, ${count} Schalen` }
  }
  const { e, count } = positiveShells(rng, mul(u, plus(u, constant(rng, n))), n, 2, 1)
  return { side: e, other: positiveSide(rng, n), label: `Baukasten: $x$ mal Klammer, ${count} Schalen` }
}

const LEVEL4_QUADRATIC_CORES: readonly Core[] = [
  [22, expQuadratic],
  [14, sqrtQuadratic],
  [18, trigQuadratic],
  [18, logQuadratic],
  [10, biquadratic],
  [18, rationalQuadratic],
]

// Gesucht ist hier immer x
export function buildLevel4Quadratic(rng: Rng): KitTask {
  return buildFrom(rng, LEVEL4_QUADRATIC_CORES, 0)
}

// --- Stufe 5, Teil 7a: Ableitungen und Integrale (docs/PLAN-M3.md, „Stufe 5 neu") ---
//
// In jeder Gleichung steckt ein Werkzeug: eine Ableitung oder ein Integral (auch eins mit
// Partialbrüchen). Erst wird es ausgerechnet, dann umgestellt. Das Werkzeug steht allein, mit
// Schalen, in einem Bruch mit einem Baustein derselben Art (\frac{\int_0^x e^t\,\mathrm{d}t}{e^x + a} = y),
// unter einer Wurzel oder im \ln; manchmal stehen zwei Werkzeuge in der Gleichung.

// Buchstaben ohne t (das ist die Integrationsvariable); reset: ab einer Stelle neu vergeben (wenn ein
// Kern noch einmal gewählt wird)
type ToolNames = Names & { readonly mark: () => number; readonly reset: (at: number) => void }

function toolNames(rng: Rng): ToolNames {
  const family = rng.pick(FAMILIES.filter((f) => !f.includes('t')))
  const queue = [...family]
  let i = 0
  return {
    unknown: variable('x'),
    target: 'x',
    letter: () => variable(queue[Math.min(i++, queue.length - 1)]),
    mark: () => i,
    reset: (at) => {
      i = at
    },
  }
}

const T = variable('t')
const square = (e: Expr) => pow(e, num(2))

// Werkzeug mit Bedingungen und einem Baustein derselben Art (für den Bruch: e^{kx} zu \int e^{kt})
type ToolCore = { readonly tool: Expr; readonly conditions?: readonly Condition[]; readonly partner?: Expr; readonly label: string }

// Zahl k ≠ 0 vor t bzw. x: 2, 3, -2
const rate = (rng: Rng, negative = true) => num(rng.int(1, 3) * (negative && rng.chance(0.3) ? -1 : 1))
const timesRate = (r: Expr, v: Expr) => (r.kind === 'num' && r.value.n === 1n ? v : r.kind === 'num' && r.value.n === -1n ? neg(v) : mul(r, v))

// Ableitungen, deren Ergebnis sich nach x auflösen lässt
function derivativeCore(rng: Rng, n: Names): ToolCore {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  const d = (body: Expr, label: string, extra: Partial<ToolCore> = {}): ToolCore => ({ tool: derivativeOf(body), label: `Ableitung: ${label}`, ...extra })
  if (r < 0.08) return d(div(square(x), plus(x, rng.chance(0.7) ? a : k(rng, 1, 5))), 'Quotientenregel, danach quadratisch')
  if (r < 0.16) return d(div(maybeTimes(rng, n, x, 0.3), plus(x, a)), 'Quotientenregel')
  if (r < 0.24) return d(sqrt(plus(square(x), rng.chance(0.6) ? a : square(a))), 'Kettenregel mit Wurzel')
  if (r < 0.3) return d(fn('arctan', div(x, a)), '$\\arctan$')
  if (r < 0.38) {
    const kx = timesRate(rate(rng, false), x)
    return d(ln(plus(pow(E, kx), a)), '$\\ln$ einer Summe mit $e^x$', { partner: pow(E, kx) })
  }
  if (r < 0.46) {
    const kx = timesRate(rate(rng), x)
    return d(plus(maybeTimes(rng, n, pow(E, kx), 0.4), letters(n.letter(), x)), '$e^{kx}$ und $x$', { partner: pow(E, kx) })
  }
  if (r < 0.52) {
    const angle = rng.chance(0.6) ? x : mul(k(rng, 2, 3), x)
    return d(fn('tan', angle), '$\\tan$', { conditions: angleConditions('tan', angle, x) })
  }
  if (r < 0.6) return d(ln(div(x, plus(x, a))), '$\\ln$ eines Bruchs, danach quadratisch')
  if (r < 0.67) return d(rng.chance(0.5) ? div(plus(square(x), a), x) : plus(x, div(a, x)), '$x$ plus Bruch')
  if (r < 0.72) return d(fn('arcsin', div(x, a)), '$\\arcsin$', { conditions: [{ lhs: x, rel: '<', rhs: a }] })
  if (r < 0.78) {
    const kx = timesRate(rate(rng, false), x)
    return d(rng.chance(0.5) ? fn('cosh', kx) : maybeTimes(rng, n, fn('sinh', kx), 0.3), 'Hyperbelfunktion')
  }
  if (r < 0.84) return d(rng.chance(0.5) ? mul(a, sqrt(x)) : sqrt(plus(maybeTimes(rng, n, x, 0.4), a)), 'Wurzel', { partner: sqrt(x) })
  if (r < 0.9) return d(maybeTimes(rng, n, mul(x, ln(x)), 0.3), 'Produktregel mit $\\ln$', { partner: ln(x) })
  if (r < 0.95) return d(minus(div(pow(x, num(3)), num(3)), letters(a, x)), 'Potenzen')
  return d(plus(div(num(1), plus(x, a)), letters(n.letter(), x)), 'Bruch plus $bx$')
}

// Bestimmte Integrale \int_{unten}^{x}, deren Ergebnis sich nach x auflösen lässt
function integralCore(rng: Rng, n: Names): ToolCore {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  const zero = num(0)
  const i = (body: Expr, lower: Expr, label: string, extra: Partial<ToolCore> = {}): ToolCore => ({ tool: integralOf(body, lower, x), label: `Integral: ${label}`, ...extra })
  if (r < 0.1) {
    const kr = rate(rng)
    return i(maybeTimes(rng, n, pow(E, timesRate(kr, T)), 0.3), zero, '$e^{kt}$', { partner: pow(E, timesRate(kr, x)) })
  }
  if (r < 0.18) return i(div(T, plus(square(T), rng.chance(0.6) ? square(a) : a)), zero, 'Zähler ist fast die Ableitung des Nenners')
  if (r < 0.28) {
    const b = n.letter()
    return i(div(num(1), mul(T, plus(T, b))), a, 'Partialbrüche', { conditions: [{ lhs: x, rel: '>', rhs: a }] })
  }
  if (r < 0.34) {
    const lower = mul(num(2), a)
    return i(div(num(1), minus(square(T), square(a))), lower, 'Partialbrüche mit $t^2 - a^2$', { conditions: [{ lhs: x, rel: '>', rhs: lower }] })
  }
  if (r < 0.4) {
    const b = n.letter()
    return i(div(plus(mul(num(2), T), a, b), mul(plus(T, a), plus(T, b))), zero, 'Partialbrüche, danach quadratisch')
  }
  if (r < 0.46) {
    const p = rng.int(1, 3)
    const q = p + rng.int(1, 4)
    return i(div(num((q - p) * rng.int(1, 3)), mul(plus(T, num(p)), plus(T, num(q)))), zero, 'Partialbrüche mit Zahlen')
  }
  if (r < 0.53) {
    const kr = rng.int(1, 3)
    const body = rng.chance(0.5) ? div(num(1), plus(T, a)) : div(n.letter(), plus(kr === 1 ? T : mul(num(kr), T), a))
    return i(body, zero, '$\\ln$ als Stammfunktion', { partner: ln(plus(x, a)) })
  }
  if (r < 0.58) return i(div(a, T), num(1), '$\\frac{1}{t}$', { partner: ln(x) })
  if (r < 0.64) return i(div(num(1), sqrt(plus(T, square(a)))), zero, 'Wurzel im Nenner')
  if (r < 0.7) return i(div(T, sqrt(plus(square(T), square(a)))), zero, 'Wurzel im Nenner, Kettenregel rückwärts')
  if (r < 0.75) return i(mul(T, pow(E, square(T))), zero, '$te^{t^2}$')
  if (r < 0.8) return i(div(num(1), plus(square(T), square(a))), zero, '$\\arctan$ als Stammfunktion')
  if (r < 0.88) {
    const name = rng.pick(['sin', 'cos', 'cosh'] as const)
    const kr = rng.int(1, 3)
    const angleT = kr === 1 ? T : mul(num(kr), T)
    const angleX = kr === 1 ? x : mul(num(kr), x)
    const conditions = name === 'cosh' ? [] : angleConditions(name === 'sin' ? 'cos' : 'sin', angleX, x)
    return i(fn(name, angleT), zero, `$\\${name}$`, { conditions, partner: fn(name === 'sin' ? 'cos' : name === 'cos' ? 'sin' : 'sinh', angleX) })
  }
  const body = rng.pick([plus(T, a), plus(mul(num(2), T), a), mul(k(rng, 2, 4), square(T)), plus(mul(num(3), square(T)), a)])
  return i(body, zero, 'Potenzen')
}

const toolCore = (rng: Rng, n: Names): ToolCore => (rng.chance(0.45) ? derivativeCore(rng, n) : integralCore(rng, n))

// Werkzeug allein, mit Schalen
function toolShells(rng: Rng, n: Names): Built {
  const c = toolCore(rng, n)
  const { e, count } = someShells(rng, c.tool, n, 1)
  return { side: e, conditions: c.conditions, label: `${c.label}, ${count} Schalen` }
}

// Werkzeug im Bruch mit einem Baustein derselben Art: \frac{\int_0^x e^t\,\mathrm{d}t}{e^x + a} = y
function toolFraction(rng: Rng, n: ToolNames): Built {
  const start = n.mark()
  let c = toolCore(rng, n)
  for (let i = 0; i < 6 && !c.partner; i++) {
    n.reset(start)
    c = toolCore(rng, n)
  }
  const partner = c.partner ?? n.unknown
  const other = plus(maybeTimes(rng, n, partner, 0.3), constant(rng, n))
  const side = rng.chance(0.7) ? div(c.tool, other) : div(other, c.tool)
  return { side, conditions: c.conditions, label: `${c.label}, im Bruch` }
}

// Werkzeug unter einer Wurzel oder im \ln
function toolInside(rng: Rng, n: Names): Built {
  const c = toolCore(rng, n)
  const inner = rng.chance(0.5) ? plus(c.tool, n.letter()) : c.tool
  const side = rng.chance(0.5) ? sqrt(inner) : ln(inner)
  return { side, conditions: c.conditions, label: `${c.label}, ${side.kind === 'root' ? 'unter der Wurzel' : 'im $\\ln$'}` }
}

// Ableitung, die denselben Baustein liefert wie das Integral: e^{kx} aus be^{kx} + cx, \ln x aus x\ln x,
// \cos(kx) aus \sin(kx), \sinh(kx) aus \cosh(kx); null bei anderen Bausteinen
function matchingDerivative(rng: Rng, n: Names, partner: Expr): Expr | null {
  const x = n.unknown
  if (partner.kind === 'pow') return derivativeOf(rng.chance(0.5) ? maybeTimes(rng, n, partner, 0.6) : plus(maybeTimes(rng, n, partner, 0.5), letters(n.letter(), x)))
  if (partner.kind === 'fn' && partner.name === 'ln') return derivativeOf(mul(partner.arg.kind === 'add' ? partner.arg : x, partner))
  if (partner.kind === 'fn' && partner.name === 'cos') return derivativeOf(fn('sin', partner.arg))
  if (partner.kind === 'fn' && partner.name === 'sinh') return derivativeOf(fn('cosh', partner.arg))
  return null
}

// Zwei Werkzeuge mit demselben Baustein: auf jeder Seite eins oder beide in einer Summe,
// \int_0^x e^{2t}\,\mathrm{d}t = \frac{\mathrm{d}}{\mathrm{d}x}\left(be^{2x}\right) - c
function twoTools(rng: Rng, n: ToolNames): Built {
  const start = n.mark()
  let c = integralCore(rng, n)
  let d = c.partner ? matchingDerivative(rng, n, c.partner) : null
  for (let i = 0; i < 12 && !d; i++) {
    n.reset(start)
    c = integralCore(rng, n)
    d = c.partner ? matchingDerivative(rng, n, c.partner) : null
  }
  if (!d) {
    n.reset(start)
    return toolShells(rng, n)
  }
  const conditions = c.conditions ?? []
  if (rng.chance(0.5)) {
    const other = rng.chance(0.5) ? d : minus(d, n.letter())
    return { side: c.tool, other, conditions, label: 'Integral gleich Ableitung' }
  }
  return { side: rng.chance(0.5) ? plus(d, c.tool) : minus(d, c.tool), conditions, label: 'Ableitung und Integral in einer Summe' }
}

type ToolBuild = readonly [number, (rng: Rng, n: ToolNames) => Built]

const LEVEL5_TOOL_CORES: readonly ToolBuild[] = [
  [40, toolShells],
  [22, toolFraction],
  [18, toolInside],
  [12, twoTools],
]

// Gesucht ist hier immer x
export function buildLevel5Tools(rng: Rng): KitTask {
  const n = toolNames(rng)
  const total = LEVEL5_TOOL_CORES.reduce((s, [w]) => s + w, 0)
  let r = rng.next() * total
  const [, build] = LEVEL5_TOOL_CORES.find(([w]) => (r -= w) < 0) ?? LEVEL5_TOOL_CORES[0]
  const built = build(rng, n)
  const other = built.other ?? otherSide(rng, n)
  const equationFor = built.other ? (rng.chance(0.75) ? eq(built.side, other) : eq(other, built.side)) : equation(rng, built.side, other)
  return { task: { equation: equationFor, target: 'x', conditions: built.conditions ?? [] }, label: built.label }
}
