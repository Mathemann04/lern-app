import { subterms } from '../expr/compare.ts'
import { type Expr, E, IMAG, PI, add, div, eq, fn, ln, log, mul, neg, num, pow, sqrt, variable } from '../expr/types.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import { limitParts, limitValue } from '../rearrange/tools/series.ts'
import { absOf, angleOf, argOf, derivativeOf, detOf, dotOf, integralOf, lengthOf, limitOf, odeOf, seriesOf, sumOf } from '../rearrange/tools/tool.ts'
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

// Eintrag nach Anteilen
function weighted<T extends readonly [number, ...unknown[]]>(rng: Rng, items: readonly T[]): T {
  const total = items.reduce((s, [w]) => s + w, 0)
  let r = rng.next() * total
  return items.find(([w]) => (r -= w) < 0) ?? items[0]
}

// Kern nach Anteilen wählen und bauen, andere Seite dazu; gesucht ist x
function buildTools(rng: Rng, n: ToolNames, cores: readonly ToolBuild[]): KitTask {
  const built = weighted(rng, cores)[1](rng, n)
  const other = built.other ?? otherSide(rng, n)
  const equationFor = built.other ? (rng.chance(0.75) ? eq(built.side, other) : eq(other, built.side)) : equation(rng, built.side, other)
  return { task: { equation: equationFor, target: 'x', conditions: built.conditions ?? [] }, label: built.label }
}

// Gesucht ist hier immer x
export function buildLevel5Tools(rng: Rng): KitTask {
  return buildTools(rng, toolNames(rng), LEVEL5_TOOL_CORES)
}

// --- Stufe 5, Teil 7b: Summen, Reihen und Grenzwerte (docs/PLAN-M3.md, „Stufe 5 neu") ---
//
// Die Summe läuft über k, der Grenzwert über n; beide Buchstaben kommen sonst nicht vor. Bei der
// endlichen geometrischen Summe ist die Anzahl n der Summanden gesucht, sonst x. Wie in Teil 7a steht
// das Werkzeug allein mit Schalen, in einem Bruch mit einem Baustein derselben Art, unter einer Wurzel
// oder im \ln, steckt in einer Ableitung oder einem Integral (Reihe abgeleitet, Reihe integriert), oder
// ein Grenzwert steht einer Reihe gegenüber.

const K = variable('k')
const NN = variable('n')

// Buchstaben ohne k, n und t (Summe, Grenzwert, Integral)
function seriesNames(rng: Rng, target = 'x'): ToolNames {
  const family = rng.pick(FAMILIES.filter((f) => !f.includes('t'))).filter((l) => l !== 'k' && l !== 'n')
  let i = 0
  return {
    unknown: variable(target),
    target,
    letter: () => variable(family[Math.min(i++, family.length - 1)]),
    mark: () => i,
    reset: (at) => {
      i = at
    },
  }
}

const below = (x: Expr, bound: Expr): Condition => ({ lhs: x, rel: '<', rhs: bound })
const above = (x: Expr, bound: Expr): Condition => ({ lhs: x, rel: '>', rhs: bound })

// Faktor vor dem Summanden: manchmal ein Buchstabe oder eine Zahl (aq^k, 3q^k)
const seriesFactor = (rng: Rng, n: Names, e: Expr): Expr => {
  const r = rng.next()
  if (r < 0.2) return mul(n.letter(), e)
  if (r < 0.3) return mul(k(rng, 2, 5), e)
  return e
}

// Geometrische Reihen in x, auch abgeleitet (k q^k) und integriert (\frac{q^k}{k}), mit 0 < q < 1
function seriesCore(rng: Rng, n: Names): ToolCore {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  const start = num(rng.chance(0.5) ? 0 : 1)
  const s = (body: Expr, label: string, extra: Partial<ToolCore> = {}, from: Expr = start): ToolCore => ({ tool: seriesOf(body, from), label: `Reihe: ${label}`, ...extra })
  const ekx = (m: number) => pow(E, neg(m === 1 ? mul(K, x) : mul(num(m), K, x)))
  if (r < 0.15) return s(seriesFactor(rng, n, pow(div(x, a), K)), '$\\left(\\frac{x}{a}\\right)^k$', { conditions: [below(x, a)] })
  if (r < 0.28) return s(seriesFactor(rng, n, pow(div(a, x), K)), '$\\left(\\frac{a}{x}\\right)^k$', { conditions: [above(x, a)] })
  if (r < 0.42) {
    const m = rng.chance(0.7) ? 1 : 2
    return s(seriesFactor(rng, n, ekx(m)), '$e^{-kx}$', { partner: pow(E, m === 1 ? x : mul(num(m), x)) })
  }
  if (r < 0.52) return s(seriesFactor(rng, n, pow(div(x, plus(x, a)), K)), '$\\left(\\frac{x}{x + a}\\right)^k$')
  if (r < 0.6) return s(seriesFactor(rng, n, pow(div(a, plus(x, a)), K)), '$\\left(\\frac{a}{x + a}\\right)^k$')
  if (r < 0.8) {
    // abgeleitet: \sum_{k=1}^{\infty} kq^k = \frac{q}{(1 - q)^2}, danach quadratisch
    const pick = rng.next()
    if (pick < 0.4) return s(mul(K, pow(x, K)), 'abgeleitet, danach quadratisch', { conditions: [below(x, num(1))] }, num(1))
    if (pick < 0.75) return s(mul(K, pow(div(x, a), K)), 'abgeleitet mit $\\frac{x}{a}$, danach quadratisch', { conditions: [below(x, a)] }, num(1))
    return s(mul(K, ekx(1)), 'abgeleitet mit $e^{-x}$, danach quadratisch', {}, num(1))
  }
  // integriert: \sum_{k=1}^{\infty} \frac{q^k}{k} = -\ln(1 - q)
  const pick = rng.next()
  if (pick < 0.35) return s(div(pow(x, K), K), 'integriert', { conditions: [below(x, num(1))] }, num(1))
  if (pick < 0.7) return s(div(pow(x, K), mul(K, pow(a, K))), 'integriert mit $\\frac{x}{a}$', { conditions: [below(x, a)] }, num(1))
  return s(div(ekx(1), K), 'integriert mit $e^{-x}$', {}, num(1))
}

// Grenzwerte, die auf e^{□} führen: \left(1 + \frac{x}{n}\right)^{sn}, \left(\frac{n + x}{n - x}\right)^n, …;
// Partner: e^{…} mit derselben Hochzahl wie der Grenzwert
function limitCore(rng: Rng, n: Names): ToolCore {
  const x = n.unknown
  const r = rng.next()
  const exponent = () => (rng.chance(0.6) ? NN : rng.chance(0.6) ? mul(k(rng, 2, 3), NN) : letters(n.letter(), NN))
  const l = (base: Expr, exp: Expr, label: string): ToolCore => {
    const tool = limitOf(pow(base, exp))
    const parts = limitParts(pow(base, exp), 'n')
    const value = parts && limitValue(parts)
    return { tool, label: `Grenzwert: ${label}`, ...(value && value.kind === 'pow' ? { partner: value } : {}) }
  }
  if (r < 0.28) return l(plus(num(1), div(x, NN)), exponent(), '$\\left(1 + \\frac{x}{n}\\right)^{sn}$')
  if (r < 0.38) return l(minus(num(1), div(x, NN)), exponent(), '$\\left(1 - \\frac{x}{n}\\right)^{sn}$')
  if (r < 0.47) return l(plus(num(1), div(letters(n.letter(), x), NN)), NN, '$\\left(1 + \\frac{ax}{n}\\right)^n$')
  if (r < 0.55) return l(plus(num(1), div(x, letters(n.letter(), NN))), NN, '$\\left(1 + \\frac{x}{an}\\right)^n$')
  if (r < 0.65) return l(plus(num(1), div(rng.chance(0.6) ? n.letter() : num(1), NN)), mul(x, NN), '$x$ in der Hochzahl')
  if (r < 0.82) return l(div(plus(NN, x), minus(NN, x)), exponent(), '$\\left(\\frac{n + x}{n - x}\\right)^n$')
  if (r < 0.92) return l(div(plus(NN, n.letter()), plus(NN, x)), exponent(), '$\\left(\\frac{n + a}{n + x}\\right)^n$')
  return l(div(NN, plus(NN, x)), exponent(), '$\\left(\\frac{n}{n + x}\\right)^n$')
}

// Endliche geometrische Summe, gesucht ist die Anzahl n: \sum_{k=0}^{n-1} aq^k = y mit q > 1
function sumCore(rng: Rng, n: Names): ToolCore {
  const N = n.unknown
  const [lower, upper] = rng.pick([
    [0, minus(N, num(1))],
    [1, N],
    [0, N],
  ] as const)
  const r = rng.next()
  let body: Expr
  let conditions: Condition[] = []
  let label: string
  if (r < 0.45) {
    const q = n.letter()
    body = pow(q, K)
    conditions = [above(q, num(1))]
    label = '$q^k$'
  } else if (r < 0.75) {
    body = pow(num(rng.pick([2, 3])), K)
    label = '$2^k$, $3^k$'
  } else {
    body = pow(E, letters(n.letter(), K))
    label = '$e^{ak}$'
  }
  const c = rng.next()
  const withFactor = c < 0.35 ? mul(n.letter(), body) : c < 0.55 ? mul(k(rng, 2, 5), body) : body
  return { tool: sumOf(withFactor, num(lower), upper), conditions, label: `Summe: ${label}, gesucht $n$` }
}

const seriesOrLimit = (rng: Rng, n: Names): ToolCore => (rng.chance(0.55) ? seriesCore(rng, n) : limitCore(rng, n))

// Schalen um eine Summe oder einen Grenzwert, das Werkzeug bleibt hinten (b + \sum …, nicht \sum … + b:
// dort wäre unklar, ob b noch zum Summanden gehört)
function trailingShells(rng: Rng, core: Expr, n: Names, max: number, min = 0): { e: Expr; count: number } {
  const count = rng.int(min, max)
  let e = core
  let additive = rng.chance(0.5)
  for (let i = 0; i < count; i++) {
    let kind = rng.pick(additive ? ADDITIVE : MULTIPLICATIVE)
    if (kind === 'divide' && hasFraction(e)) kind = 'times'
    e = kind === 'plus' ? plus(summand(rng, n), e) : kind === 'minus' ? minus(summand(rng, n), e) : shell(rng, e, n, kind)
    additive = !additive
  }
  return { e, count }
}

// Werkzeug allein, mit Schalen
function seriesShells(rng: Rng, n: ToolNames): Built {
  const c = seriesOrLimit(rng, n)
  const { e, count } = trailingShells(rng, c.tool, n, 3, 1)
  return { side: e, conditions: c.conditions, label: `${c.label}, ${count} Schalen` }
}

// Werkzeug im Bruch mit einem Baustein derselben Art: \frac{\lim_{n \to \infty}(1 + \frac{x}{n})^{2n}}{e^{2x} + a} = y
function seriesFraction(rng: Rng, n: ToolNames): Built {
  const start = n.mark()
  let c = seriesOrLimit(rng, n)
  for (let i = 0; i < 6 && !c.partner; i++) {
    n.reset(start)
    c = seriesOrLimit(rng, n)
  }
  const partner = c.partner ?? n.unknown
  const other = plus(maybeTimes(rng, n, partner, 0.3), constant(rng, n))
  const side = rng.chance(0.7) ? div(c.tool, other) : div(other, c.tool)
  return { side, conditions: c.conditions, label: `${c.label}, im Bruch` }
}

// Werkzeug unter einer Wurzel oder im \ln
function seriesInside(rng: Rng, n: ToolNames): Built {
  const c = seriesOrLimit(rng, n)
  const inner = rng.chance(0.4) ? plus(n.letter(), c.tool) : c.tool
  const side = rng.chance(0.5) ? sqrt(inner) : ln(inner)
  return { side, conditions: c.conditions, label: `${c.label}, ${side.kind === 'root' ? 'unter der Wurzel' : 'im $\\ln$'}` }
}

// Reihe in einer Ableitung oder einem Integral: \frac{\mathrm{d}}{\mathrm{d}x}\sum_{k=1}^{\infty} \frac{x^k}{k},
// \int_0^x \sum_{k=0}^{\infty} t^k\,\mathrm{d}t
function nestedSeries(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  let tool: Expr
  let conditions: Condition[]
  let label: string
  if (r < 0.5) {
    const pick = rng.next()
    const inner =
      pick < 0.4 ? seriesOf(div(pow(x, K), K), num(1)) : pick < 0.7 ? seriesOf(div(pow(x, K), mul(K, pow(a, K))), num(1)) : seriesOf(pow(div(x, a), K), num(rng.chance(0.5) ? 0 : 1))
    tool = derivativeOf(inner)
    conditions = [below(x, pick < 0.4 ? num(1) : a)]
    label = 'Reihe abgeleitet'
  } else {
    const pick = rng.next()
    const body = pick < 0.4 ? pow(T, K) : pick < 0.75 ? pow(div(T, a), K) : div(pow(T, K), pow(a, K))
    tool = integralOf(seriesOf(body, num(0)), num(0), x)
    conditions = [below(x, pick < 0.4 ? num(1) : a)]
    label = 'Reihe integriert'
  }
  const { e, count } = someShells(rng, tool, n, 2)
  return { side: e, conditions, label: `${label}, ${count} Schalen` }
}

// Grenzwert gegen Ableitung, danach quadratisch in e^x:
// \lim_{n \to \infty}\left(1 + \frac{x}{n}\right)^{2n} = \frac{\mathrm{d}}{\mathrm{d}x}\left(ae^x + bx\right)
function limitAndDerivative(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const r = rng.next()
  const body =
    r < 0.4 ? pow(plus(num(1), div(x, NN)), mul(num(2), NN)) : r < 0.7 ? pow(plus(num(1), div(mul(num(2), x), NN)), NN) : pow(div(plus(NN, x), minus(NN, x)), NN)
  const a = n.letter()
  const ex = pow(E, x)
  const derivative = rng.chance(0.6) ? derivativeOf(plus(mul(a, ex), letters(n.letter(), x))) : plus(derivativeOf(mul(a, ex)), n.letter())
  return { side: limitOf(body), other: derivative, label: 'Grenzwert gleich Ableitung, danach quadratisch' }
}

// Endliche Summe nach n, mit Schalen, unter einer Wurzel oder im \ln
function sumShells(rng: Rng, n: ToolNames): Built {
  const c = sumCore(rng, n)
  if (rng.chance(0.2)) return { side: ln(c.tool), conditions: c.conditions, label: `${c.label}, im $\\ln$` }
  const { e, count } = trailingShells(rng, c.tool, n, 2)
  return { side: e, conditions: c.conditions, label: `${c.label}, ${count} Schalen` }
}

const LEVEL5_SERIES_CORES: readonly ToolBuild[] = [
  [30, seriesShells],
  [14, seriesFraction],
  [12, seriesInside],
  [12, nestedSeries],
  [6, limitAndDerivative],
]

// Gesucht ist x, bei der endlichen Summe (Anteil 15 %) die Anzahl n
export function buildLevel5Series(rng: Rng): KitTask {
  if (rng.chance(0.15)) {
    const n = seriesNames(rng, 'n')
    const built = sumShells(rng, n)
    const other = otherSide(rng, n)
    return { task: { equation: equation(rng, built.side, other), target: 'n', conditions: built.conditions ?? [] }, label: built.label }
  }
  return buildTools(rng, seriesNames(rng), LEVEL5_SERIES_CORES)
}

// --- Stufe 5, Teil 7c: Differentialgleichungen (docs/PLAN-M3.md, „Stufe 5 neu") ---
//
// Gegeben ist eine Funktion f durch ihre Differentialgleichung mit Anfangswerten: Wachstum und Abnahme
// f' = \pm kf, Abkühlen f' = k(b - f) und f'' = k^2 f mit f(0) = a, f'(0) = 0 bzw. f(0) = 0, f'(0) = b.
// In der Gleichung steht f(x); erst wird die Differentialgleichung gelöst, dann umgestellt (bei
// f'' = k^2 f über die Substitution u = e^{kx} und die pq-Formel). Dazu Schalen, ein Bruch mit e^{kx},
// eine Wurzel oder ein \ln, oder zwei Funktionen f und g. Die Rate heißt k (oder ist eine Zahl), die
// Funktionen f und g; diese Buchstaben kommen sonst nicht vor.

const F = variable('f')
const G = variable('g')

// Buchstaben ohne f, g und k; reicht die Familie nicht, kommen weitere dazu (kein „h + h")
const SPARE_LETTERS = ['m', 'n', 'p', 'q', 'r', 's', 'u', 'v', 'w', 'z']
function odeNames(rng: Rng): ToolNames {
  const chosen = rng.pick(FAMILIES).filter((l) => l !== 'g' && l !== 'k')
  const family = [...chosen, ...SPARE_LETTERS.filter((l) => !chosen.includes(l))]
  let i = 0
  return {
    unknown: variable('x'),
    target: 'x',
    letter: () => variable(family[Math.min(i++, family.length - 1)]),
    mark: () => i,
    reset: (at) => {
      i = at
    },
  }
}

// Rate: meist k, sonst eine Zahl
const odeRate = (rng: Rng): Expr => (rng.chance(0.65) ? K : num(rng.pick([2, 3])))
// Anfangswert: meist ein Buchstabe, sonst eine Zahl von 2 bis 5
const initialValue = (rng: Rng, n: Names): Expr => (rng.chance(0.8) ? n.letter() : k(rng, 2, 5))
// rate · f, mit Minus vorn: -kf, -2f
const rateTimes = (rate: Expr, f: Expr, sign: 1 | -1): Expr => {
  const e = mul(rate, f)
  return sign === 1 ? e : rate.kind === 'num' ? mul(num(-rate.value.n), f) : neg(e)
}
// e^{\pm rate · x}
const expOfRate = (rate: Expr, x: Expr, sign: 1 | -1): Expr => {
  const e = rate.kind === 'num' && rate.value.n === 1n ? x : mul(rate, x)
  return pow(E, sign === 1 ? e : neg(e))
}

// Wachstum oder Abnahme: f' = kf bzw. f' = -kf, f(0) = a; Partner e^{\pm kx}
function growthCore(rng: Rng, n: Names, f = F): ToolCore {
  const rate = odeRate(rng)
  const sign = rng.chance(0.5) ? 1 : -1
  const tool = odeOf(rateTimes(rate, f, sign), 1, [initialValue(rng, n)], f.kind === 'var' ? f.name : 'f')
  return { tool, partner: expOfRate(rate, n.unknown, sign), label: sign === 1 ? "DGL: $f' = kf$" : "DGL: $f' = -kf$" }
}

// Abkühlen: f' = k(b - f), f(0) = a mit a > b; Partner e^{-kx}
function coolingCore(rng: Rng, n: Names): ToolCore {
  const rate = odeRate(rng)
  const a = n.letter()
  const b = n.letter()
  return { tool: odeOf(mul(rate, minus(b, F)), 1, [a]), conditions: [above(a, b)], partner: expOfRate(rate, n.unknown, -1), label: "DGL: Abkühlen $f' = k(b - f)$" }
}

// f'' = k^2 f (auch 4f, 9f, f) mit f(0) = a, f'(0) = 0 oder f(0) = 0, f'(0) = b
function secondCore(rng: Rng, n: Names): ToolCore {
  const r = rng.next()
  const square = r < 0.6 ? pow(K, num(2)) : r < 0.75 ? num(4) : r < 0.9 ? num(9) : null
  const body = square ? mul(square, F) : F
  const even = rng.chance(0.6)
  const initial = even ? [initialValue(rng, n), num(0)] : [num(0), initialValue(rng, n)]
  return { tool: odeOf(body, 2, initial), label: `DGL: $f'' = k^2 f$, ${even ? "$f'(0) = 0$" : '$f(0) = 0$'}` }
}

const firstOrderCore = (rng: Rng, n: Names): ToolCore => (rng.chance(0.55) ? growthCore(rng, n) : coolingCore(rng, n))
const odeCore = (rng: Rng, n: Names): ToolCore => (rng.chance(0.75) ? secondCore(rng, n) : firstOrderCore(rng, n))

// DGL mit Schalen; erster Ordnung mindestens zwei (sonst zu wenige Umformungen). Bei f'' = k^2 f meist
// nur malnehmen oder teilen: Mit Plus und Minus steht nach der pq-Formel eine lange Wurzel im Ergebnis.
function odeShells(rng: Rng, n: ToolNames): Built {
  const c = odeCore(rng, n)
  const second = c.label.includes("f''")
  const cooling = c.label.includes('Abkühlen')
  const { e, count } = second
    ? rng.chance(0.7)
      ? odeScaleShells(rng, c.tool, n, 2, rng.chance(0.25) ? 0 : 1)
      : someShells(rng, c.tool, n, 2, 1)
    : someShells(rng, c.tool, n, 3, cooling ? 1 : 2)
  return { side: e, conditions: c.conditions, label: `${c.label}, ${count} Schalen` }
}

// Schalen, die nur malnehmen oder teilen; ein Faktor kommt in den Zähler: \frac{4f(x)}{3}
function odeScaleShells(rng: Rng, core: Expr, n: Names, max: number, min = 0): { e: Expr; count: number } {
  const count = rng.int(min, max)
  let e = core
  for (let i = 0; i < count; i++) {
    if (rng.chance(0.5) && !hasFraction(e)) e = div(e, denominator(rng, n))
    else {
      const f = factor(rng, n)
      e = e.kind === 'div' ? div(letters(f, e.num), e.den) : letters(f, e)
    }
  }
  return { e, count }
}

// DGL erster Ordnung im Bruch mit ihrem Baustein: \frac{f(x)}{e^{kx} + b} = y
function odeFraction(rng: Rng, n: ToolNames): Built {
  const c = firstOrderCore(rng, n)
  const other = plus(maybeTimes(rng, n, c.partner!, 0.3), constant(rng, n))
  const side = rng.chance(0.7) ? div(c.tool, other) : div(other, c.tool)
  const { e } = someShells(rng, side, n, 1)
  return { side: e, conditions: c.conditions, label: `${c.label}, im Bruch` }
}

// DGL unter einer Wurzel oder im \ln, mit Schalen
function odeInside(rng: Rng, n: ToolNames): Built {
  const c = odeCore(rng, n)
  const inner = rng.chance(0.4) ? plus(n.letter(), c.tool) : c.tool
  const outer = rng.chance(0.5) ? sqrt(inner) : ln(inner)
  const { e } = someShells(rng, outer, n, 2, c.label.includes("f''") ? 0 : 1)
  return { side: e, conditions: c.conditions, label: `${c.label}, ${outer.kind === 'root' ? 'unter der Wurzel' : 'im $\\ln$'}` }
}

// Zwei Funktionen: f' = kf und g' = -kg (dieselbe Rate); f(x) - g(x) = y (danach quadratisch, genau eine
// Lösung passt), f(x) = g(x) + c oder f(x) = g(x) mit g(0) > f(0)
function twoOdes(rng: Rng, n: ToolNames): Built {
  const rate = odeRate(rng)
  const a = initialValue(rng, n)
  const b = n.letter()
  const f = odeOf(rateTimes(rate, F, 1), 1, [a])
  const g = odeOf(rateTimes(rate, G, -1), 1, [b], 'g')
  const r = rng.next()
  if (r < 0.5) return { side: minus(f, g), label: "DGL: $f' = kf$ und $g' = -kg$, $f(x) - g(x)$" }
  if (r < 0.8) return { side: f, other: plus(g, n.letter()), label: "DGL: $f' = kf$ und $g' = -kg$, $f(x) = g(x) + c$" }
  const { e } = someShells(rng, f, n, 1)
  return { side: e, other: g, conditions: e === f ? [above(b, a)] : [], label: "DGL: $f' = kf$ und $g' = -kg$, $f(x) = g(x)$" }
}

const LEVEL5_ODE_CORES: readonly ToolBuild[] = [
  [40, odeShells],
  [16, odeFraction],
  [20, odeInside],
  [16, twoOdes],
]

// Gesucht ist x
export function buildLevel5Ode(rng: Rng): KitTask {
  return buildTools(rng, odeNames(rng), LEVEL5_ODE_CORES)
}

// --- Stufe 5, Teil 8a: Determinanten (docs/PLAN-M3.md, „Stufe 5 neu") ---
//
// In der Gleichung steht eine Determinante, in deren Einträgen x steckt: 2 × 2 (Hauptdiagonale minus
// Nebendiagonale) oder 3 × 3 mit einer Zeile oder Spalte, in der zwei Nullen stehen (erst nach ihr entwickeln,
// dann die 2 × 2-Unterdeterminante ausrechnen). Danach ist die Gleichung meist quadratisch in e^{x}, x, \sqrt{x}
// oder \ln x (Substitution, pq-Formel) oder hat \sin^2 x und \cos^2 x. Dazu Schalen, eine Wurzel oder ein \ln,
// ein Bruch oder ein Integral auf der anderen Seite. Damit kein typischer Fehler zufällig die richtige
// Gleichung ergibt: in einer 2 × 2-Determinante keine 0 und kein Minus vor einem Eintrag, nie zweimal
// derselbe Eintrag in einer Spalte.

// 2 × 2-Kern, Einträge zeilenweise
type DetCore = {
  readonly rows: readonly (readonly Expr[])[]
  // danach quadratisch (pq-Formel): nur Schalen und andere Seiten, die q < 0 erhalten
  readonly quadratic: boolean
  // Substitution u = e^{x}: die andere Seite steckt später in p, darum nur malnehmen oder teilen
  readonly scale?: boolean
  // Wert zwischen -1 und 1 (\sin^2 x - \cos^2 x): nicht unter eine Wurzel oder in einen \ln
  readonly bounded?: boolean
  readonly conditions?: readonly Condition[]
  // Baustein für den Bruch \frac{D}{e^{x} + c}
  readonly partner?: Expr
  // so viele Schalen mindestens (danach linear: sonst zu wenige Umformungen)
  readonly minShells?: number
  readonly label: string
}

// Anteil, als Unterdeterminante einer 3 × 3-Determinante geeignet, Bauplan. Nicht geeignet: Kerne mit
// Winkelfunktionen oder vielen Umformungen und solche, die danach nur ein Polynom in x, \sqrt{x} oder e^{x}
// sind: c\left(bx^2 - ax\right) = y löst die Engine nicht (sie teilt durch c und nimmt wieder mit c mal).
type DetKind = readonly [number, boolean, (rng: Rng, n: Names) => DetCore]

// e^{x}, e^{-x}, e^{2x}
const expOf = (x: Expr, m: 1 | -1 | 2): Expr => pow(E, m === 1 ? x : m === -1 ? neg(x) : mul(num(2), x))

// e^{x} und e^{-x}, auch gespiegelt: be^{x} - ae^{-x}
function detExpPair(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = n.letter()
  const b = coefficient(rng, n)
  const rows = rng.chance(0.5) ? [[expOf(x, 1), expOf(x, -1)], [a, b]] : [[expOf(x, 1), a], [expOf(x, -1), b]]
  return { rows, quadratic: true, scale: true, label: '$e^{x}$ und $e^{-x}$' }
}

// e^{x} und e^{x} + c: e^{x}\left(e^{x} + c\right) - ab
function detExpShifted(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = n.letter()
  const b = coefficient(rng, n)
  return { rows: [[expOf(x, 1), a], [b, plus(expOf(x, 1), constant(rng, n))]], quadratic: true, scale: true, label: '$e^{x}$ und $e^{x} + c$' }
}

// e^{2x} und e^{x}: be^{2x} - ae^{x}
function detExpSquare(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = coefficient(rng, n)
  const b = n.letter()
  const rows = rng.chance(0.5) ? [[expOf(x, 2), a], [expOf(x, 1), b]] : [[expOf(x, 2), expOf(x, 1)], [a, b]]
  return { rows, quadratic: true, scale: true, label: '$e^{2x}$ und $e^{x}$' }
}

// lauter e-Potenzen: e^{2x} - e^{-2x}
function detExpOnly(_rng: Rng, n: Names): DetCore {
  const x = n.unknown
  return { rows: [[expOf(x, 1), expOf(x, -1)], [expOf(x, -1), expOf(x, 1)]], quadratic: true, scale: true, label: 'nur $e^{x}$ und $e^{-x}$' }
}

// x und x + c: x(x + c) - ab
function detXShifted(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = n.letter()
  const b = coefficient(rng, n)
  return { rows: [[x, a], [b, plus(x, constant(rng, n))]], quadratic: true, label: '$x$ und $x + c$' }
}

// x^2 und x: bx^2 - ax
function detXSquare(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = coefficient(rng, n)
  const b = n.letter()
  return { rows: rng.chance(0.5) ? [[square(x), a], [x, b]] : [[square(x), x], [a, b]], quadratic: true, label: '$x^2$ und $x$' }
}

// x und \frac{1}{x}: bx - \frac{a}{x}
function detXReciprocal(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = n.letter()
  const b = coefficient(rng, n)
  const rows = rng.chance(0.5) ? [[x, a], [div(num(1), x), b]] : [[x, div(num(1), x)], [a, b]]
  return { rows, quadratic: true, label: '$x$ und $\\frac{1}{x}$' }
}

// x + a und x - a: (x + a)(x - a) - bc, danach steht nur noch x^2 da
function detXPlusMinus(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = constant(rng, n)
  const b = n.letter()
  return { rows: [[plus(x, a), b], [coefficient(rng, n), minus(x, a)]], quadratic: false, label: '$x + a$ und $x - a$' }
}

// x und \sqrt{x}: bx - a\sqrt{x}
function detXRoot(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = coefficient(rng, n)
  const b = n.letter()
  return { rows: rng.chance(0.5) ? [[x, sqrt(x)], [a, b]] : [[x, a], [sqrt(x), b]], quadratic: true, label: '$x$ und $\\sqrt{x}$' }
}

// \sqrt{x} und \sqrt{x} + b: \sqrt{x}\left(\sqrt{x} + b\right) - a
function detRootShifted(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = n.letter()
  const r = rng.chance(0.5) ? num(1) : n.letter()
  return { rows: [[sqrt(x), a], [r, plus(sqrt(x), constant(rng, n))]], quadratic: true, label: '$\\sqrt{x}$ und $\\sqrt{x} + b$' }
}

// \ln x und \ln x + b: \ln x\left(\ln x + b\right) - a, mit x > 1 (sonst passen beide Lösungen der pq-Formel)
function detLnShifted(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const a = n.letter()
  const r = rng.chance(0.5) ? num(1) : n.letter()
  return { rows: [[ln(x), a], [r, plus(ln(x), constant(rng, n))]], quadratic: true, conditions: [above(x, num(1))], label: '$\\ln x$ und $\\ln x + b$' }
}

// \sin x und \cos x über Kreuz: \sin^2 x - \cos^2 x oder umgekehrt, mit x < \frac{\pi}{2}
function detTrig(rng: Rng, n: Names): DetCore {
  const x = n.unknown
  const [p, q] = rng.chance(0.6) ? [fn('sin', x), fn('cos', x)] : [fn('cos', x), fn('sin', x)]
  return { rows: [[p, q], [q, p]], quadratic: true, bounded: true, conditions: angleConditions('sin', x, x), label: '$\\sin x$ und $\\cos x$' }
}

const DET_QUADRATIC: readonly DetKind[] = [
  [14, true, detExpPair],
  [7, false, detExpShifted],
  [8, false, detExpSquare],
  [3, true, detExpOnly],
  [8, true, detXShifted],
  [6, false, detXSquare],
  [6, true, detXReciprocal],
  [5, true, detXPlusMinus],
  [5, false, detXRoot],
  [4, false, detRootShifted],
  [5, false, detLnShifted],
  [4, false, detTrig],
]

// Danach linear in einem Baustein: be^{x} - a, e^{2x} - ab, x^2 - ab, b\ln x - a, b\tan x - a, b\sinh x - a,
// b\cosh x - a
const DET_LINEAR: readonly DetKind[] = [
  [22, true, (rng, n) => ({ rows: [[expOf(n.unknown, 1), n.letter()], [num(1), coefficient(rng, n)]], quadratic: false, partner: expOf(n.unknown, 1), label: '$e^{x}$, linear' })],
  [16, true, (rng, n) => ({ rows: [[expOf(n.unknown, 1), n.letter()], [coefficient(rng, n), expOf(n.unknown, 1)]], quadratic: false, label: '$e^{x}$ auf der Diagonale' })],
  [16, true, (rng, n) => ({ rows: [[n.unknown, n.letter()], [coefficient(rng, n), n.unknown]], quadratic: false, minShells: 2, label: '$x$ auf der Diagonale' })],
  [18, true, (rng, n) => ({ rows: [[ln(n.unknown), n.letter()], [num(1), coefficient(rng, n)]], quadratic: false, partner: ln(n.unknown), label: '$\\ln x$, linear' })],
  [10, false, (rng, n) => ({ rows: [[fn('tan', n.unknown), n.letter()], [num(1), coefficient(rng, n)]], quadratic: false, conditions: angleConditions('tan', n.unknown, n.unknown), minShells: 2, label: '$\\tan x$, linear' })],
  [8, false, (rng, n) => ({ rows: [[fn('sinh', n.unknown), n.letter()], [num(1), coefficient(rng, n)]], quadratic: false, minShells: 2, label: '$\\sinh x$, linear' })],
  [8, false, (rng, n) => ({ rows: [[fn('cosh', n.unknown), n.letter()], [num(1), coefficient(rng, n)]], quadratic: false, minShells: 2, label: '$\\cosh x$, linear' })],
]

// 2 × 2, danach meist quadratisch: allein, mit einer Schale, unter einer Wurzel oder im \ln
function detQuadratic(rng: Rng, n: ToolNames): Built {
  const c = weighted(rng, DET_QUADRATIC)[2](rng, n)
  const d = detOf(c.rows)
  const other = c.scale ? simpleSide(rng, n) : positiveSide(rng, n)
  if (!c.bounded && rng.chance(0.25)) {
    const side = rng.chance(0.5) ? sqrt(d) : ln(d)
    return { side, other, conditions: c.conditions, label: `Determinante ${c.label}, ${side.kind === 'root' ? 'unter der Wurzel' : 'im $\\ln$'}` }
  }
  // (x + a)(x - a) - bc: eine Schale (die Einträge sind schon breit)
  const { e, count } = c.scale ? scaleShells(rng, d, n, 1) : c.quadratic ? positiveShells(rng, d, n, 1) : someShells(rng, d, n, 1, 1)
  return { side: e, other, conditions: c.conditions, label: `Determinante ${c.label}, ${count} Schalen` }
}

// 2 × 2, danach linear: mit Schalen oder im Bruch mit seinem Baustein, \frac{D}{e^{x} + c} = y
function detLinear(rng: Rng, n: ToolNames): Built {
  const c = weighted(rng, DET_LINEAR)[2](rng, n)
  const d = detOf(c.rows)
  if (c.partner && rng.chance(0.4)) {
    const other = plus(maybeTimes(rng, n, c.partner, 0.3), constant(rng, n))
    return { side: rng.chance(0.7) ? div(d, other) : div(other, d), conditions: c.conditions, label: `Determinante ${c.label}, im Bruch` }
  }
  const { e, count } = someShells(rng, d, n, 2, c.minShells ?? 1)
  return { side: e, conditions: c.conditions, label: `Determinante ${c.label}, ${count} Schalen` }
}

// 3 × 3 um einen 2 × 2-Kern (er wird die Unterdeterminante): Eintrag c an der Stelle (i, j), nie 1, der Rest
// seiner Zeile oder Spalte 0, die übrigen gestrichenen Felder Zahlen von 1 bis 3. Steht c auf einem
// Minus-Feld des Schachbretts, tauschen die Spalten des Kerns, damit c mal die Determinante des Kerns
// herauskommt (sonst hätte die Gleichung meist keine Lösung). Ohne Schalen: Entwickeln und Ausrechnen
// sind schon zwei Umformungen. Der Kern ist meist einer, nach dem die Gleichung quadratisch wird.
function detThree(rng: Rng, n: ToolNames): Built {
  const kinds = (rng.chance(0.6) ? DET_QUADRATIC : DET_LINEAR).filter(([, minor]) => minor)
  const c = weighted(rng, kinds)[2](rng, n)
  const entry = rng.chance(0.75) ? n.letter() : k(rng, 2, 3)
  const i = rng.int(0, 2)
  const j = rng.int(0, 2)
  const byRow = rng.chance(0.5)
  const core = (i + j) % 2 === 1 ? c.rows.map(([p, q]) => [q, p]) : c.rows
  const rows = [0, 1, 2].map((r) =>
    [0, 1, 2].map((s) => {
      if (r === i && s === j) return entry
      if (byRow ? r === i : s === j) return num(0)
      if (r === i || s === j) return k(rng, 1, 3)
      return core[r < i ? r : r - 1][s < j ? s : s - 1]
    }),
  )
  const other = c.scale ? simpleSide(rng, n) : positiveSide(rng, n)
  return { side: detOf(rows), other, conditions: c.conditions, label: `Determinante $3 \\times 3$ um ${c.label}` }
}

// Integral gleich Determinante: \int_0^x e^t\,\mathrm{d}t = \det\begin{pmatrix} a & e^{x} \\ 1 & b \end{pmatrix}
function detVersusIntegral(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const b = coefficient(rng, n)
  const diagonal = detOf([[expOf(x, 1), a], [b, expOf(x, 1)]])
  const r = rng.next()
  if (r < 0.3) return { side: integralOf(pow(E, T), num(0), x), other: detOf([[a, expOf(x, 1)], [num(1), b]]), label: 'Integral gleich Determinante, linear' }
  if (r < 0.55) return { side: integralOf(pow(E, T), num(0), x), other: diagonal, label: 'Integral gleich Determinante, danach quadratisch' }
  if (r < 0.8) return { side: integralOf(pow(E, mul(num(2), T)), num(0), x), other: diagonal, label: 'Integral gleich Determinante, $e^{2t}$' }
  const logs = detOf([[ln(x), a], [b, ln(x)]])
  return { side: integralOf(div(num(1), T), num(1), x), other: logs, conditions: [above(x, num(1))], label: 'Integral gleich Determinante, $\\ln x$' }
}

// 3 × 3 wird fast nie verworfen, 2 × 2 öfter: Mit diesen Anteilen ist etwa jede vierte Aufgabe 3 × 3
const LEVEL5_DET_CORES: readonly ToolBuild[] = [
  [55, detQuadratic],
  [15, detLinear],
  [18, detThree],
  [5, detVersusIntegral],
]

// Gesucht ist x
export function buildLevel5Det(rng: Rng): KitTask {
  return buildTools(rng, toolNames(rng), LEVEL5_DET_CORES)
}

// --- Stufe 5, Teil 8b: Betrag und Winkel (docs/PLAN-M3.md, Schritt 8b) ---
//
// Komplexe Zahlen: \lvert z\rvert und \arg z, z ein Bruch, Produkt oder Quadrat aus Zahlen p + q\mathrm{i} mit x im
// Real- oder Imaginärteil (auch e^{x}, \sqrt{x}, \ln x) oder in Euler-Form be^{\mathrm{i}x} - a. Vektoren als Spalten:
// Länge, Skalarprodukt und Winkel zwischen zwei Vektoren. Danach steht meist eine Wurzel, eine quadratische
// Gleichung, ein \arctan oder ein \arccos da. Damit kein typischer Fehler zufällig stimmt: Jeder Faktor mit x hat
// Real- und Imaginärteil, beim Winkel ist sein Realteil für alle x > 0 positiv, kein Bruch aus zwei gleich langen
// Zahlen; nie zwei Vektoren der Länge 1, nie zweimal derselbe Eintrag in einem Vektor mit zwei Einträgen.

// q\mathrm{i}: \mathrm{i}, a\mathrm{i}, (x + a)\mathrm{i}; vor einer Funktion, Wurzel oder e-Funktion steht \mathrm{i} vorn: \mathrm{i}\ln x
const imagPart = (q: Expr): Expr =>
  q.kind === 'num' && q.value.n === 1n && q.value.d === 1n ? IMAG : q.kind === 'fn' || q.kind === 'root' || (q.kind === 'pow' && q.base === E) ? mul(IMAG, q) : mul(q, IMAG)
// p + q\mathrm{i} und p - q\mathrm{i}
const complexNumber = (re: Expr, im: Expr): Expr => add(re, imagPart(im))
const conjugateNumber = (re: Expr, im: Expr): Expr => add(re, neg(imagPart(im)))
const twice = (x: Expr) => mul(num(2), x)
const lt = (x: Expr, bound: Expr): Condition => ({ lhs: x, rel: '<', rhs: bound })

// Teil mit x im Real- oder Imaginärteil: x, e^{x}, \sqrt{x} (selten \ln x mit x > 1)
function polarBlock(rng: Rng, x: Expr, withLog = false): { block: Expr; conditions: Condition[]; label: string } {
  const r = rng.next()
  if (r < 0.55) return { block: x, conditions: [], label: '$x$' }
  if (r < 0.8) return { block: pow(E, x), conditions: [], label: '$e^{x}$' }
  if (r < 0.92 || !withLog) return { block: sqrt(x), conditions: [], label: '$\\sqrt{x}$' }
  return { block: ln(x), conditions: [above(x, num(1))], label: '$\\ln x$' }
}

// Betrag eines Bruchs mit x oben und unten (Beispiel aus dem Plan): \left\lvert\frac{x + a\mathrm{i}}{x - b\mathrm{i}}\right\rvert = y
function absQuotient(rng: Rng, n: ToolNames): Built {
  const { block: u, label } = polarBlock(rng, n.unknown)
  const a = n.letter()
  const b = n.letter()
  const top = rng.chance(0.75) ? complexNumber(u, a) : complexNumber(a, u)
  const bottom = rng.chance(0.5) ? conjugateNumber(u, b) : complexNumber(u, b)
  const squared = rng.chance(0.2)
  const tool = absOf(squared ? div(pow(top, num(2)), pow(bottom, num(2))) : div(top, bottom))
  // malnehmen statt teilen: sonst stünde ein Bruch im Bruch
  const r = rng.next()
  const side = r < 0.5 ? tool : r < 0.7 ? ln(tool) : letters(factor(rng, n), tool)
  return { side, other: simpleSide(rng, n), label: `Betrag eines Bruchs, ${label} oben und unten${squared ? ', im Quadrat' : ''}` }
}

// x im Real- und Imaginärteil, danach quadratisch: \lvert x + (x + a)\mathrm{i}\rvert = y
function absBoth(rng: Rng, n: ToolNames): Built {
  const blockKind = rng.next()
  const u = blockKind < 0.7 ? n.unknown : blockKind < 0.9 ? pow(E, n.unknown) : sqrt(n.unknown)
  const a = n.letter()
  const r = rng.next()
  const [re, im] =
    r < 0.4 ? [u, plus(u, a)] : r < 0.6 ? [plus(u, a), u] : r < 0.8 || u !== n.unknown ? [u, plus(twice(u), a)] : [twice(u), plus(u, a)]
  const tool = absOf(complexNumber(re, im))
  // Substitution (e^{x}, \sqrt{x}): schon lang genug
  if (u !== n.unknown) return { side: tool, other: simpleSide(rng, n), label: 'Betrag, Baustein im Real- und Imaginärteil (Substitution)' }
  const s = rng.next()
  const side = s < 0.55 ? tool : s < 0.8 ? div(tool, n.letter()) : ln(tool)
  return { side, other: simpleSide(rng, n), label: 'Betrag, $x$ im Real- und Imaginärteil (danach quadratisch)' }
}

// Betrag mit Schalen: \frac{c\lvert x + a\mathrm{i}\rvert}{d} = y, \ln\lvert 2x + a\mathrm{i}\rvert = y
function absShells(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const re = rng.chance(0.6) ? x : twice(x)
  const tool = absOf(rng.chance(0.75) ? complexNumber(re, n.letter()) : complexNumber(n.letter(), re))
  if (rng.chance(0.3)) return { side: ln(tool), other: simpleSide(rng, n), label: 'Betrag im $\\ln$' }
  // mal und geteilt: \frac{c\lvert …\rvert}{d}
  return { side: div(letters(factor(rng, n), tool), denominator(rng, n)), other: simpleSide(rng, n), label: 'Betrag mit Schalen, 2 Schalen' }
}

// Baustein im Real- oder Imaginärteil: c\lvert e^{x} + a\mathrm{i}\rvert = y, \lvert a + \sqrt{x}\mathrm{i}\rvert - b = y
function absBlock(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const r = rng.next()
  const [u, conditions, label] = r < 0.45 ? [pow(E, x), [], '$e^{x}$'] : r < 0.85 ? [sqrt(x), [], '$\\sqrt{x}$'] : [ln(x), [above(x, num(1))], '$\\ln x$']
  const a = n.letter()
  const tool = absOf(rng.chance(0.6) ? complexNumber(u, a) : complexNumber(a, u))
  const { e, count } = u.kind === 'pow' ? scaleShells(rng, tool, n, 2, 1) : someShells(rng, tool, n, 2, 1)
  return { side: e, other: simpleSide(rng, n), conditions, label: `Betrag mit ${label}, ${count} Schalen` }
}

// Fester Faktor: \lvert(3 + 4\mathrm{i})(x + a\mathrm{i})\rvert = y, \left\lvert\frac{x + a\mathrm{i}}{1 + 2\mathrm{i}}\right\rvert = y
const SQUARE_MODULUS: readonly (readonly [number, number])[] = [
  [3, 4],
  [4, 3],
  [5, 12],
  [12, 5],
  [6, 8],
]
const ROOT_MODULUS: readonly (readonly [number, number])[] = [
  [1, 1],
  [1, 2],
  [2, 1],
  [1, 3],
]
function absFactor(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const u = rng.chance(0.75) ? x : pow(E, x)
  const z = complexNumber(u, n.letter())
  const [p, q] = rng.chance(0.55) ? rng.pick(SQUARE_MODULUS) : rng.pick(ROOT_MODULUS)
  const w = complexNumber(num(p), num(q))
  const r = rng.next()
  const tool = absOf(r < 0.6 ? mul(w, z) : div(z, w))
  const side = rng.chance(0.6) ? tool : r < 0.6 ? div(tool, n.letter()) : mul(n.letter(), tool)
  return { side, other: simpleSide(rng, n), label: `Betrag mit festem Faktor $${p} + ${q === 1 ? '' : q}\\mathrm{i}$` }
}

// Betrag eines Quadrats: \frac{\left\lvert(x + a\mathrm{i})^2\right\rvert}{c} - d = y
function absPower(rng: Rng, n: ToolNames): Built {
  const tool = absOf(pow(complexNumber(n.unknown, n.letter()), num(2)))
  const { e, count } = someShells(rng, tool, n, 2, 2)
  return { side: e, other: simpleSide(rng, n), label: `Betrag eines Quadrats, ${count} Schalen` }
}

// Betrag gegen den Realteil: \frac{\lvert x + a\mathrm{i}\rvert}{x} = y, \lvert x + a\mathrm{i}\rvert - x = y
function absVersusX(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const tool = absOf(complexNumber(x, n.letter()))
  const r = rng.next()
  if (r < 0.45) return { side: div(tool, x), other: simpleSide(rng, n), label: 'Betrag durch den Realteil' }
  if (r < 0.75) return { side: div(x, tool), other: simpleSide(rng, n), label: 'Realteil durch den Betrag' }
  return { side: minus(tool, x), other: simpleSide(rng, n), label: 'Betrag minus Realteil' }
}

// Euler-Form: \left\lvert be^{\mathrm{i}x} - a\right\rvert = y mit x < \pi (danach Kosinussatz und \arccos)
function absEuler(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  if (r < 0.15) {
    // \left\lvert e^{\mathrm{i}x} + a\mathrm{i}\right\rvert = y mit x < \frac{\pi}{2}: danach \arcsin
    return { side: absOf(add(pow(E, mul(IMAG, x)), mul(a, IMAG))), other: simpleSide(rng, n), conditions: [lt(x, div(PI, num(2)))], label: 'Betrag in Euler-Form, danach $\\arcsin$' }
  }
  const euler = rng.chance(0.4) ? pow(E, mul(IMAG, x)) : mul(n.letter(), pow(E, mul(IMAG, x)))
  const body = rng.chance(0.5) ? add(euler, neg(a)) : add(a, euler)
  const tool = absOf(body)
  const s = rng.next()
  const side = s < 0.45 ? tool : s < 0.65 ? ln(tool) : s < 0.85 ? minus(tool, n.letter()) : div(tool, n.letter())
  return { side, other: simpleSide(rng, n), conditions: [lt(x, PI)], label: 'Betrag in Euler-Form (Kosinussatz)' }
}

// Winkel eines Quadrats (Beispiel aus dem Plan): \arg\left((x + a\mathrm{i})^2\right) = y, auch mit e^{x}, \sqrt{x}, \ln x
function argPower(rng: Rng, n: ToolNames): Built {
  const { block: u, conditions, label } = polarBlock(rng, n.unknown, true)
  const a = n.letter()
  const z = rng.chance(0.85) || u !== n.unknown ? complexNumber(u, a) : complexNumber(u, plus(u, a))
  const tool = argOf(pow(z, num(2)))
  const r = rng.next()
  const side = r < 0.5 ? tool : r < 0.75 ? div(tool, n.letter()) : plus(div(tool, n.letter()), n.letter())
  return { side, other: variable('y'), conditions, label: `Winkel eines Quadrats, ${label}` }
}

// Fester Faktor mit Standardwinkel: \arg\left((1 + \mathrm{i})(x + a\mathrm{i})\right) = y; beim Quadrat nur Faktoren mit
// negativem Winkel (sonst wäre der Winkel größer als \pi)
function argFactor(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const u = rng.chance(0.8) ? x : pow(E, x)
  const z = complexNumber(u, n.letter())
  const squared = rng.chance(0.3)
  const one = num(1)
  let body: Expr
  if (squared) body = rng.chance(0.6) ? div(pow(z, num(2)), complexNumber(one, one)) : mul(conjugateNumber(one, one), pow(z, num(2)))
  else {
    const r = rng.next()
    if (r < 0.35) body = mul(complexNumber(one, one), z)
    else if (r < 0.6) body = div(z, complexNumber(one, one))
    else if (r < 0.75) body = mul(conjugateNumber(one, one), z)
    else if (r < 0.88) body = mul(complexNumber(sqrt(num(3)), one), z)
    else body = mul(complexNumber(one, sqrt(num(3))), z)
  }
  const side = rng.chance(0.7) ? argOf(body) : div(argOf(body), n.letter())
  return { side, other: variable('y'), label: `Winkel mit festem Faktor${squared ? ' und Quadrat' : ''}` }
}

// Baustein im Real- oder Imaginärteil: c\arg\left(e^{x} + a\mathrm{i}\right) = y, \arg(a + \sqrt{x}\mathrm{i}) mit Schalen
function argBlock(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const r = rng.next()
  const [u, conditions, label] =
    r < 0.35
      ? [pow(E, x), [], '$e^{x}$']
      : r < 0.55
        ? [sqrt(x), [], '$\\sqrt{x}$']
        : r < 0.75
          ? [pow(x, num(2)), [], '$x^2$']
          : r < 0.85
            ? [pow(E, twice(x)), [], '$e^{2x}$']
            : [ln(x), [above(x, num(1))], '$\\ln x$']
  const a = n.letter()
  const inReal = rng.chance(0.7)
  const tool = argOf(inReal ? complexNumber(u, a) : complexNumber(a, u))
  const { e, count } = someShells(rng, tool, n, 2, inReal ? 1 : 2)
  return { side: e, other: variable('y'), conditions, label: `Winkel mit ${label} im ${inReal ? 'Real' : 'Imaginär'}teil, ${count} Schalen` }
}

// x im Real- und Imaginärteil: \arg\left(x + (x + a)\mathrm{i}\right) = y
function argBoth(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  const [re, im] = r < 0.4 ? [x, plus(x, a)] : r < 0.6 ? [x, plus(twice(x), a)] : r < 0.8 ? [plus(x, a), x] : [plus(x, a), minus(x, a)]
  const tool = argOf(complexNumber(re, im))
  const side = rng.chance(0.6) ? tool : div(tool, n.letter())
  return { side, other: variable('y'), label: 'Winkel, $x$ im Real- und Imaginärteil' }
}

// Produkt mit x in beiden Faktoren, erst ausmultipliziert: \arg\left((x + a\mathrm{i})(a - x\mathrm{i})\right) = y
function argProduct(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const body = rng.chance(0.5) ? mul(complexNumber(x, a), conjugateNumber(a, x)) : mul(conjugateNumber(a, x), complexNumber(x, a))
  const side = rng.chance(0.6) ? argOf(body) : div(argOf(body), n.letter())
  return { side, other: variable('y'), label: 'Winkel eines Produkts, $x$ in beiden Faktoren' }
}

// Einheitsvektor in Richtung der Achse i (von 0 an gezählt) mit dim Einträgen
const axis = (dim: number, i: number): Expr[] => Array.from({ length: dim }, (_, j) => num(j === i ? 1 : 0))
// a an Stelle i in sonst gegebenen Einträgen
const placed = (entries: readonly Expr[], i: number, e: Expr): Expr[] => [...entries.slice(0, i), e, ...entries.slice(i)]

// Winkel mit einer Achse (Beispiel aus dem Plan): \sphericalangle\left((x, a, b), (1, 0, 0)\right) = y mit y < \frac{\pi}{2}, danach
// 1 - \cos^2 y = \sin^2 y und das Ergebnis mit \tan y; oder x nur in der Länge: \sphericalangle\left((a, x), (1, 0)\right) = y
function angleAxis(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const acute = [lt(variable('y'), div(PI, num(2)))]
  if (rng.chance(0.25)) {
    const [a, i] = [n.letter(), rng.int(0, 1)]
    const u = i === 0 ? [a, x] : [x, a]
    return { side: angleOf(u, axis(2, i)), other: variable('y'), conditions: acute, label: 'Winkel mit einer Achse, $x$ nur in der Länge' }
  }
  const dim = rng.chance(0.6) ? 3 : 2
  const i = rng.int(0, dim - 1)
  const others = Array.from({ length: dim - 1 }, () => n.letter())
  const head = rng.chance(0.8) ? x : twice(x)
  return { side: angleOf(placed(others, i, head), axis(dim, i)), other: variable('y'), conditions: acute, label: `Winkel mit einer Achse, ${dim} Einträge` }
}

// Gleich lange Vektoren (gespiegelt): \sphericalangle\left((x, a), (x, -a)\right) = y, auch mit bx, \sqrt{x}, e^{x}
function angleMirror(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const r = rng.next()
  const u = r < 0.5 ? x : r < 0.65 ? mul(n.letter(), x) : r < 0.8 ? sqrt(x) : pow(E, x)
  const a = rng.chance(0.7) ? n.letter() : k(rng, 2, 5)
  const first = rng.chance(0.75)
  const left = first ? [u, a] : [a, u]
  const right = first ? [u, neg(a)] : [neg(a), u]
  return { side: angleOf(left, right), other: variable('y'), label: 'Winkel zwischen gleich langen Vektoren (gespiegelt)' }
}

// Gleich lange Vektoren (gedreht): \sphericalangle\left((x, a, b), (x, b, -a)\right) = y mit y < \frac{\pi}{2}
function angleRotated(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const u = rng.chance(0.75) ? x : rng.chance(0.5) ? sqrt(x) : pow(E, x)
  const a = n.letter()
  const b = rng.chance(0.75) ? n.letter() : k(rng, 2, 5)
  return { side: angleOf([u, a, b], [u, b, neg(a)]), other: variable('y'), conditions: [lt(variable('y'), div(PI, num(2)))], label: 'Winkel zwischen gleich langen Vektoren (gedreht)' }
}

// Länge, danach quadratisch: \left\lvert(x, x + a, b)\right\rvert = y
function lengthQuadratic(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const r = rng.next()
  let entries: Expr[]
  let conditions: Condition[] = []
  if (r < 0.45) entries = [x, plus(x, a), n.letter()]
  else if (r < 0.7) entries = [x, plus(x, a)]
  else if (r < 0.85) {
    entries = [x, minus(x, a), n.letter()]
    conditions = [above(x, a)]
  } else entries = [x, sqrt(x), a]
  if (rng.chance(0.4)) entries = [entries[1], entries[0], ...entries.slice(2)]
  const tool = lengthOf(entries)
  const side = rng.chance(0.65) ? tool : div(tool, n.letter())
  return { side, other: simpleSide(rng, n), conditions, label: `Länge eines Vektors, danach quadratisch, ${entries.length} Einträge` }
}

// Länge mit e^{x} und e^{-x} (Substitution): \left\lvert(e^{x}, e^{-x})\right\rvert = y
function lengthSubstitution(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  if (rng.chance(0.3)) return { side: lengthOf([x, div(num(1), x)]), other: simpleSide(rng, n), conditions: [above(x, num(1))], label: 'Länge von $(x, \\frac{1}{x})$' }
  const entries = rng.chance(0.5) ? [pow(E, x), pow(E, neg(x))] : [pow(E, neg(x)), pow(E, x)]
  return { side: lengthOf(entries), other: simpleSide(rng, n), label: 'Länge von $(e^{x}, e^{-x})$ (Substitution)' }
}

// Länge mit Schalen oder gegen x: \ln\left\lvert(x, a, b)\right\rvert = y, \frac{\left\lvert(x, a)\right\rvert}{x} = y
function lengthShells(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const r = rng.next()
  if (r < 0.35) return { side: ln(lengthOf([x, n.letter(), n.letter()])), other: simpleSide(rng, n), label: 'Länge im $\\ln$' }
  if (r < 0.6) return { side: div(lengthOf([pow(E, x), n.letter()]), n.letter()), other: simpleSide(rng, n), label: 'Länge mit $e^{x}$' }
  if (r < 0.8) return { side: div(lengthOf([x, n.letter()]), x), other: simpleSide(rng, n), label: 'Länge durch einen Eintrag' }
  const c = n.letter()
  return { side: lengthOf([x, n.letter(), n.letter()]), other: mul(c, x), label: 'Länge gleich Vielfaches von $x$' }
}

// Skalarprodukt, danach quadratisch: (x, a) \cdot (x + b, -c) = y, auch unter einer Wurzel oder im \ln
function dotQuadratic(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const b = n.letter()
  const c = n.letter()
  const swap = rng.chance(0.35)
  const left = swap ? [a, x] : [x, a]
  const right = swap ? [neg(c), plus(x, b)] : [plus(x, b), neg(c)]
  const tool = dotOf(left, right)
  const r = rng.next()
  const side = r < 0.55 ? tool : r < 0.8 ? sqrt(tool) : ln(tool)
  return { side, other: simpleSide(rng, n), label: 'Skalarprodukt, danach quadratisch' }
}

// Senkrecht: Skalarprodukt gleich 0, (x + a, 1) \cdot (x - a, -b) = 0
function dotOrthogonal(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const b = n.letter()
  const r = rng.next()
  if (r < 0.4) return { side: dotOf([plus(x, a), num(1)], [minus(x, a), neg(b)]), other: num(0), label: 'Senkrechte Vektoren, $(x + a)(x - a)$' }
  if (r < 0.75) return { side: dotOf([x, a], [plus(x, b), neg(n.letter())]), other: num(0), label: 'Senkrechte Vektoren, danach quadratisch' }
  return { side: dotOf([pow(E, x), a], [pow(E, x), neg(b)]), other: num(0), label: 'Senkrechte Vektoren mit $e^{x}$' }
}

// Skalarprodukt mit Bausteinen: (e^{x}, e^{-x}) \cdot (a, -b) = y, (\sqrt{x}, x) \cdot (-a, b) = y
function dotBlocks(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const a = n.letter()
  const b = n.letter()
  if (rng.chance(0.6)) {
    const left = rng.chance(0.5) ? [pow(E, x), pow(E, neg(x))] : [pow(E, neg(x)), pow(E, x)]
    const right = left[0].kind === 'pow' && left[0].exp === x ? [a, neg(b)] : [neg(b), a]
    return { side: dotOf(left, right), other: simpleSide(rng, n), label: 'Skalarprodukt mit $e^{x}$ und $e^{-x}$' }
  }
  // mit Minus vor a: genau eine Lösung der pq-Formel passt, und der Fehler „Minus verloren“ ist möglich
  return { side: dotOf([sqrt(x), x], [neg(a), b]), other: simpleSide(rng, n), label: 'Skalarprodukt mit $\\sqrt{x}$ und $x$' }
}

// Skalarprodukt im Bruch mit seinem Baustein: \frac{(e^{x}, 1) \cdot (e^{x}, -a)}{e^{x} + b} = y
function dotFraction(rng: Rng, n: ToolNames): Built {
  const x = n.unknown
  const u = rng.chance(0.6) ? pow(E, x) : x
  const tool = dotOf([u, num(1)], [u, neg(n.letter())])
  return { side: div(tool, plus(u, n.letter())), other: simpleSide(rng, n), label: `Skalarprodukt im Bruch mit ${u === x ? '$x$' : '$e^{x}$'}` }
}

const LEVEL5_POLAR_CORES: readonly ToolBuild[] = [
  // komplexe Zahlen: Betrag
  [10, absQuotient],
  [7, absBoth],
  [4, absShells],
  [5, absBlock],
  [5, absFactor],
  [2, absPower],
  [3, absVersusX],
  [7, absEuler],
  // komplexe Zahlen: Winkel
  [7, argPower],
  [6, argFactor],
  [4, argBlock],
  [4, argBoth],
  [3, argProduct],
  // Vektoren
  [9, angleAxis],
  [8, angleMirror],
  [5, angleRotated],
  [6, lengthQuadratic],
  [3, lengthSubstitution],
  [3, lengthShells],
  [4, dotQuadratic],
  [3, dotOrthogonal],
  [4, dotBlocks],
  [2, dotFraction],
]

// Gesucht ist x
export function buildLevel5Polar(rng: Rng): KitTask {
  return buildTools(rng, toolNames(rng), LEVEL5_POLAR_CORES)
}
