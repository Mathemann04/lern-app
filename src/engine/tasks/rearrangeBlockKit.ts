import { type Expr, E, div, eq, fn, ln, log, mul, neg, num, pow, sqrt, variable } from '../expr/types.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import type { Rng } from '../random/rng.ts'
import {
  type Built,
  type KitTask,
  type Names,
  type TrigName,
  angleConditions,
  angleIn,
  bracketIn,
  constant,
  equation,
  exponentIn,
  head,
  k,
  letters,
  logOf,
  minus,
  names,
  nestedRoots,
  otherSide,
  plus,
  positiveCondition,
  positiveShells,
  powerBase,
  powerSums,
  powerVsPower,
  shells,
  someShells,
  trigName,
  trigOf,
  trigQuotient,
  twoRoots,
} from './rearrangeKit.ts'
import type { Level } from './taskNumber.ts'

// Aufgaben eines einzelnen Bausteins (M6 Schritt 4, docs/PLAN-M6.md „Stufen: nur noch wie verschachtelt"): Stufe 1 ein
// Baustein mit ein bis zwei Schalen, Stufe 2 mit mehreren Schalen oder auf beiden Seiten, ab Stufe 3 der Baustein in sich
// selbst (e hoch e hoch x, Wurzel in Wurzel, Bruch im Bruch), nebeneinander oder in mehr Schalen. Ob eine Aufgabe taugt
// (lösbar, nicht zu leicht, nicht zu lang und genau dieser Baustein), entscheidet rearrangeTerms.ts.
// In welchen Stufen ein Baustein solche Aufgaben hat, steht in rearrangeFamilies.ts.

// variant: Zahl von 0 bis 1, die die Art der Aufgabe wählt; sie steht je Nummer vorab fest (rearrangeTerms.ts), damit Arten,
// die öfter verworfen werden (lange Ergebnisse), trotzdem in ihrem Anteil vorkommen
type FamilyBuild = (rng: Rng, n: Names, level: Level, variant: number) => Built

// Variable einfach vervielfacht oder geteilt: x, 3x, bx, \frac{x}{b}
function simple(rng: Rng, n: Names): Expr {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.4) return u
  if (r < 0.6) return mul(k(rng, 2, 5), u)
  if (r < 0.8) return letters(n.letter(), u)
  return div(u, n.letter())
}

// Inneres vervielfacht, geteilt oder mit Minus: A, 2A, bA, \frac{A}{b}, -A
function scaled(rng: Rng, n: Names, inner: Expr, allowMinus = true): Expr {
  const r = rng.next()
  if (r < 0.45) return inner
  if (r < 0.6) return mul(k(rng, 2, 4), inner)
  if (r < 0.75) return letters(n.letter(), inner)
  if (r < 0.88 || !allowMinus) return div(inner, n.letter())
  return neg(inner)
}

// Seite mit dem Baustein B auf beiden Seiten: 3B + b = cB - d (zusammenfassen, dann den Baustein auflösen)
// Rechts steht der Baustein immer mit einem Buchstaben davor, damit er sich nicht weghebt.
function bothSides(rng: Rng, n: Names, block: Expr): { side: Expr; other: Expr } {
  const term = (front: Expr) => (rng.chance(0.5) ? plus(front, constant(rng, n)) : minus(front, constant(rng, n)))
  return { side: term(head(rng, n, block)), other: term(letters(n.letter(), block)) }
}

// Zahl der Schalen nach Stufe: 1 bis 2, 2 bis 3, …
const SHELLS: Record<Level, readonly [number, number]> = { 1: [1, 2], 2: [2, 3], 3: [1, 2], 4: [1, 3], 5: [1, 2] }
function withShells(rng: Rng, n: Names, core: Expr, level: Level): { e: Expr; count: number } {
  const [min, max] = SHELLS[level]
  return someShells(rng, core, n, max, min)
}

// --- Lineare Gleichungen (ab Stufe 3): die Variable mehrfach, in Klammern ineinander, auf beiden Seiten ---

// Teil mit der Variable: 3(x - b), b(2x + c), \frac{x - b}{3}, 4x, bx; kind 'bracket' nur mit Klammer (zwei Teile
// nebeneinander sollen nicht gleich zusammenzufassen sein wie 7x + 3x)
function linearPiece(rng: Rng, n: Names, kind: 'any' | 'bracket' = 'any'): Expr {
  const r = rng.next()
  const bracket = () => bracketIn(rng, n, n.unknown).expr
  if (r < 0.55) return letters(rng.chance(0.5) ? n.letter() : k(rng), bracket())
  if (r < 0.8 || kind === 'bracket') return div(bracket(), rng.chance(0.5) ? n.letter() : k(rng))
  return head(rng, n, n.unknown)
}

const linear: FamilyBuild = (rng, n, level) => {
  const sum = () => (rng.chance(0.6) ? plus(linearPiece(rng, n, 'bracket'), linearPiece(rng, n)) : minus(linearPiece(rng, n, 'bracket'), linearPiece(rng, n)))
  if (level === 3) {
    return { side: shells(rng, linearPiece(rng, n, 'bracket'), n, 1), other: linearPiece(rng, n), label: 'Baustein lineare Gleichungen: Variable auf beiden Seiten in Klammern' }
  }
  if (level === 4) return { side: sum(), other: rng.chance(0.5) ? linearPiece(rng, n) : plus(linearPiece(rng, n), constant(rng, n)), label: 'Baustein lineare Gleichungen: Variable dreimal in Klammern' }
  // Stufe 5: Summe mit der Variable in einer Klammer, darum eine Schale, auf beiden Seiten
  const side = rng.chance(0.6) ? letters(rng.chance(0.5) ? n.letter() : k(rng), sum()) : div(sum(), rng.chance(0.5) ? n.letter() : k(rng))
  const shelled = rng.chance(0.5) ? plus(side, constant(rng, n)) : side
  return { side: shelled, other: rng.chance(0.5) ? linearPiece(rng, n) : sum(), label: 'Baustein lineare Gleichungen: Klammern ineinander, Variable mehrfach' }
}

// --- Brüche: Variable im Nenner (Stufe 1), ab Stufe 4 Doppelbrüche, Kettenbrüche, Variable oben und unten ---

// Nenner mit der Variable: x, 3x, bx, x + b, x - b, b - x, 2x - b
function denominatorWith(rng: Rng, n: Names): { e: Expr; conditions: Condition[] } {
  if (rng.chance(0.45)) return { e: head(rng, n, n.unknown), conditions: [] }
  const l = bracketIn(rng, n, n.unknown)
  const condition = positiveCondition(l, n.unknown)
  return { e: l.expr, conditions: condition ? [condition] : [] }
}

// Zähler ohne Variable: b, 3, 2b
const numerator = (rng: Rng, n: Names): Expr => (rng.chance(0.65) ? n.letter() : rng.chance(0.5) ? k(rng) : mul(k(rng), n.letter()))

const brueche: FamilyBuild = (rng, n, level, r) => {
  const u = n.unknown
  if (level === 1) {
    const den = denominatorWith(rng, n)
    const { e, count } = withShells(rng, n, div(numerator(rng, n), den.e), 1)
    return { side: e, conditions: den.conditions, label: `Baustein Brüche: Variable im Nenner, ${count} Schalen` }
  }
  if (r < 0.35) {
    // Bruch im Bruch, in Stufe 5 dreifach: \frac{a}{b + \frac{c}{x - d}}
    const den = denominatorWith(rng, n)
    let e = div(numerator(rng, n), den.e)
    const depth = level === 5 ? 2 : 1
    // weiter außen eher Zahlen, sonst zu viele Buchstaben
    const part = () => (rng.chance(0.5) ? k(rng) : n.letter())
    for (let i = 0; i < depth; i++) e = div(part(), rng.chance(0.6) ? plus(part(), e) : minus(part(), e))
    const shelled = someShells(rng, e, n, level === 5 ? 2 : 1, level === 5 ? 1 : 0)
    return { side: shelled.e, conditions: den.conditions, label: `Baustein Brüche: Kettenbruch, ${shelled.count} Schalen` }
  }
  if (r < 0.6) {
    // Variable in Zähler und Nenner: \frac{ax + b}{x - c}
    const top = rng.chance(0.3) ? head(rng, n, u) : bracketIn(rng, n, u).expr
    const bottom = bracketIn(rng, n, u)
    const condition = positiveCondition(bottom, u)
    const { e, count } = someShells(rng, div(top, bottom.expr), n, level === 5 ? 3 : 2, level === 5 ? 2 : 1)
    return { side: e, conditions: condition ? [condition] : [], label: `Baustein Brüche: Variable in Zähler und Nenner, ${count} Schalen` }
  }
  if (r < 0.8 || level === 5) {
    // Doppelbruch mit Brüchen oben und unten: \frac{a + \frac{b}{x}}{c - \frac{d}{x}}
    const den = rng.chance(0.6) ? u : simple(rng, n)
    const inner = () => div(constant(rng, n), den)
    const part = (s: Expr) => (rng.chance(0.5) ? plus(s, inner()) : minus(s, inner()))
    const { e, count } = someShells(rng, div(part(constant(rng, n)), part(constant(rng, n))), n, level === 5 ? 2 : 1, level === 5 ? 1 : 0)
    return { side: e, label: `Baustein Brüche: Doppelbruch, ${count} Schalen` }
  }
  // derselbe Nenner auf beiden Seiten: \frac{a}{x - b} + c = \frac{d}{x - b} - g
  const den = denominatorWith(rng, n)
  const term = () => (rng.chance(0.5) ? plus(div(numerator(rng, n), den.e), constant(rng, n)) : minus(div(numerator(rng, n), den.e), constant(rng, n)))
  return { side: term(), other: term(), conditions: den.conditions, label: 'Baustein Brüche: derselbe Nenner auf beiden Seiten' }
}

// --- Wurzeln: Wurzel mit Schalen, auf beiden Seiten, Wurzeln in Wurzeln, zwei Wurzeln ---

function rootOf(rng: Rng, n: Names, inner: Expr): Expr {
  const root = sqrt(inner)
  return rng.chance(0.35) ? letters(rng.chance(0.7) ? n.letter() : k(rng, 2, 5), root) : root
}

const wurzeln: FamilyBuild = (rng, n, level, r) => {
  const u = n.unknown
  if (level === 1) {
    const inner = rng.chance(0.55) ? simple(rng, n) : bracketIn(rng, n, u).expr
    const { e, count } = withShells(rng, n, rootOf(rng, n, inner), 1)
    return { side: e, label: `Baustein Wurzeln: Wurzel mit ${count} Schalen` }
  }
  if (level === 2) {
    if (r < 0.75) {
      const inner = rng.chance(0.5) ? bracketIn(rng, n, u).expr : shells(rng, u, n, rng.int(1, 2))
      const { e, count } = withShells(rng, n, rootOf(rng, n, inner), 2)
      return { side: e, label: `Baustein Wurzeln: Wurzel aus einer Klammer, ${count} Schalen` }
    }
    return { ...bothSides(rng, n, sqrt(rng.chance(0.5) ? simple(rng, n) : bracketIn(rng, n, u).expr)), label: 'Baustein Wurzeln: Wurzel auf beiden Seiten' }
  }
  if (r < 0.4) {
    // Wurzel in Wurzel mit Schalen dazwischen (in Stufe 5 mehr Schalen)
    const inner = sqrt(rng.chance(0.5) ? simple(rng, n) : bracketIn(rng, n, u).expr)
    const outer = rootOf(rng, n, rng.chance(0.35) ? plus(constant(rng, n), inner) : shells(rng, inner, n, level === 5 ? 2 : rng.int(1, 2)))
    const shelled = someShells(rng, outer, n, 2, level === 5 ? 2 : 1)
    return { side: shelled.e, label: `Baustein Wurzeln: Wurzel in Wurzel, ${shelled.count} Schalen` }
  }
  if (r < 0.55 && level === 4) return nestedRoots(rng, n)
  if (r < 0.7) {
    const built = twoRoots(rng, n)
    return { ...built, side: shells(rng, built.side, n, level === 5 ? rng.int(1, 2) : rng.int(0, 1)) }
  }
  // Wurzel aus einer Klammer mit Schalen auf beiden Seiten, darum Schalen
  const block = sqrt(shells(rng, rng.chance(0.5) ? simple(rng, n) : bracketIn(rng, n, u).expr, n, rng.int(1, 2)))
  const both = bothSides(rng, n, block)
  return { side: shells(rng, both.side, n, level === 5 ? 2 : 1), other: both.other, label: 'Baustein Wurzeln: Wurzel auf beiden Seiten mit Schalen' }
}

// --- Quadrate und Potenzen: x^2, x^3, Klammer hoch 2 mit Bedingung, Potenzen ineinander ---

// Basis, die sicher positiv ist (Variable, Summe oder Klammer mit Bedingung), damit beim Wurzelziehen nur das Plus gilt
function positiveBase(rng: Rng, n: Names): { e: Expr; conditions: Condition[] } {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.4) return { e: u, conditions: [] }
  if (r < 0.55) return { e: div(u, n.letter()), conditions: [] }
  const l = bracketIn(rng, n, u)
  const condition = positiveCondition(l, u)
  return { e: l.expr, conditions: condition ? [condition] : [] }
}

const potenzen: FamilyBuild = (rng, n, level) => {
  const exponent = () => num(rng.pick([2, 2, 2, 3, 3, 4]))
  const base = positiveBase(rng, n)
  const power = rng.chance(0.3) ? letters(rng.chance(0.7) ? n.letter() : k(rng, 2, 5), pow(base.e, exponent())) : pow(base.e, exponent())
  if (level <= 2) {
    if (level === 2 && rng.chance(0.3)) return { ...bothSides(rng, n, pow(base.e, exponent())), conditions: base.conditions, label: 'Baustein Potenzen: Potenz auf beiden Seiten' }
    const { e, count } = withShells(rng, n, power, level)
    return { side: e, conditions: base.conditions, label: `Baustein Potenzen: Potenz mit ${count} Schalen` }
  }
  // Potenz in Potenz: das Innere ist immer sicher positiv (Potenz einer positiven Basis, dann nur plus, mal und geteilt
  // durch Buchstaben und Zahlen). Sonst hätte eine gerade Hochzahl eine zweite Lösung, und bei einer ungeraden stünde eine
  // dritte Wurzel aus einer möglicherweise negativen Zahl da.
  const inner = rng.chance(0.6) ? plus(power, constant(rng, n)) : growing(rng, n, power, level === 3 ? 1 : 2)
  let e = pow(inner, exponent())
  if (level === 5) e = pow(plus(growing(rng, n, e, 1), constant(rng, n)), num(rng.pick([2, 3])))
  const shelled = someShells(rng, e, n, 2, 1)
  return { side: shelled.e, conditions: base.conditions, label: `Baustein Potenzen: Potenz in Potenz, ${shelled.count} Schalen` }
}

// Schalen, die ein positives e positiv lassen: plus eine positive Zahl, mal oder geteilt durch eine (immer mindestens eine
// Summe, damit die Potenz darum nicht gleich zusammenfällt)
function growing(rng: Rng, n: Names, e: Expr, count: number): Expr {
  let out = e
  for (let i = 0; i < count; i++) {
    const r = rng.next()
    if (i === 0 || r < 0.5) out = rng.chance(0.7) ? plus(out, constant(rng, n)) : plus(constant(rng, n), out)
    else if (r < 0.8) out = letters(rng.chance(0.6) ? n.letter() : k(rng), out)
    else out = div(out, rng.chance(0.6) ? n.letter() : k(rng))
  }
  return out
}

// --- e-Funktion: e^x mit Schalen, Sättigung, auf beiden Seiten, e hoch e hoch x, Potenzgesetze ---

const expPower = (rng: Rng, n: Names, exponent: Expr) => pow(powerBase(rng, n), exponent)

// e hoch einen Kern, der selbst eine e-Funktion mit Schalen ist: e^{ae^{2x} - b}
function nestedExp(rng: Rng, n: Names, innerShells: number): Expr {
  const inner = shells(rng, expPower(rng, n, exponentIn(rng, n, n.unknown)), n, innerShells)
  return expPower(rng, n, scaled(rng, n, inner))
}

const expFamily: FamilyBuild = (rng, n, level, r) => {
  const u = n.unknown
  if (level === 1) {
    const { e, count } = withShells(rng, n, expPower(rng, n, exponentIn(rng, n, u)), 1)
    return { side: e, label: `Baustein e-Funktion: Potenz mit ${count} Schalen` }
  }
  if (level === 2) {
    if (r < 0.5) {
      const { e, count } = withShells(rng, n, expPower(rng, n, exponentIn(rng, n, u)), 2)
      return { side: e, label: `Baustein e-Funktion: Potenz mit ${count} Schalen` }
    }
    if (r < 0.75) {
      // Sättigung: a\left(1 - e^{-kx}\right)
      const p = expPower(rng, n, exponentIn(rng, n, u))
      const { e, count } = someShells(rng, letters(n.letter(), rng.chance(0.7) ? minus(num(1), p) : minus(p, num(1))), n, 1)
      return { side: e, label: `Baustein e-Funktion: Sättigung, ${count} Schalen` }
    }
    return { ...bothSides(rng, n, expPower(rng, n, exponentIn(rng, n, u))), label: 'Baustein e-Funktion: auf beiden Seiten' }
  }
  if (level === 3) {
    if (r < 0.45) {
      const { e, count } = someShells(rng, nestedExp(rng, n, 1), n, 2, 1)
      return { side: e, label: `Baustein e-Funktion: e hoch e-Funktion, ${count} Schalen` }
    }
    return r < 0.75 ? powerSums(rng, n) : powerVsPower(rng, n)
  }
  if (r < 0.55) {
    const { e, count } = someShells(rng, nestedExp(rng, n, 2), n, 2, 1)
    return { side: e, label: `Baustein e-Funktion: e hoch e-Funktion mit Schalen, ${count} Schalen` }
  }
  return { ...bothSides(rng, n, nestedExp(rng, n, 1)), label: 'Baustein e-Funktion: e hoch e-Funktion auf beiden Seiten' }
}

// --- Logarithmus: ln mit Schalen, auf beiden Seiten, ln von ln, zwei Logarithmen, danach linear ---

// Argument des Logarithmus: x, 3x, \frac{x}{b} oder eine Klammer mit Bedingung
function logArgument(rng: Rng, n: Names): { e: Expr; conditions: Condition[] } {
  if (rng.chance(0.5)) return { e: simple(rng, n), conditions: [] }
  const l = bracketIn(rng, n, n.unknown)
  const condition = positiveCondition(l, n.unknown)
  return { e: l.expr, conditions: condition ? [condition] : [] }
}

const logFamily: FamilyBuild = (rng, n, level, r) => {
  const u = n.unknown
  const arg = logArgument(rng, n)
  if (level <= 2) {
    if (level === 2 && rng.chance(0.3)) return { ...bothSides(rng, n, logOf(rng, n, arg.e)), conditions: arg.conditions, label: 'Baustein Logarithmus: auf beiden Seiten' }
    const { e, count } = withShells(rng, n, logOf(rng, n, arg.e), level)
    return { side: e, conditions: arg.conditions, label: `Baustein Logarithmus: Logarithmus mit ${count} Schalen` }
  }
  // ab Stufe 3: Logarithmus vom Logarithmus (in Stufe 5 auch statt „auf beiden Seiten“, das am Handy zu breit wird) oder
  // zwei Logarithmen
  if (r >= 0.45 && r < 0.8) {
    // zwei Logarithmen derselben Basis, danach linear: \ln(x + a) - \ln x = b, \log_2(x + a) - \log_2(x - b) = c
    const r0 = rng.next()
    const base = r0 < 0.7 ? E : r0 < 0.85 ? num(rng.pick([2, 10])) : n.letter()
    const L = (a: Expr) => (base === E ? ln(a) : log(base, a))
    const top = rng.chance(0.6) ? plus(u, constant(rng, n)) : plus(head(rng, n, u), constant(rng, n))
    const b = constant(rng, n)
    const r1 = rng.next()
    const second = r1 < 0.35 ? u : r1 < 0.65 ? head(rng, n, u) : minus(u, b)
    const conditions: Condition[] = r1 < 0.65 ? [] : [{ lhs: u, rel: '>', rhs: b }]
    const sum = rng.chance(0.7) ? minus(L(top), L(second)) : minus(L(second), L(top))
    const { e, count } = someShells(rng, sum, n, level === 5 ? 2 : 1, level === 5 ? 1 : 0)
    return { side: e, conditions, label: `Baustein Logarithmus: zwei Logarithmen, ${count} Schalen` }
  }
  return logOfLog(rng, n, level, arg)
}

// Logarithmus vom Logarithmus: \ln\left(a\ln(2x) + b\right)
function logOfLog(rng: Rng, n: Names, level: Level, arg: { e: Expr; conditions: Condition[] }): Built {
  const inner = shells(rng, logOf(rng, n, arg.e), n, level === 3 ? 1 : 2)
  const { e, count } = someShells(rng, logOf(rng, n, scaled(rng, n, inner, false)), n, 2, 1)
  return { side: e, conditions: arg.conditions, label: `Baustein Logarithmus: Logarithmus vom Logarithmus, ${count} Schalen` }
}

// --- Quadratische Gleichungen: pq-Formel mit genau einer positiven Lösung ---
// Alles nach links gebracht, ist das Absolutglied negativ (x^2 + ax, x(bx - c) ohne Absolutglied, positive andere Seite);
// Schalen, die das erhalten (mal, geteilt, minus eine positive Zahl). Das Glied vor x ist ein einzelner Buchstabe oder eine
// Zahl, sonst stünde unter der Wurzel der pq-Formel eine lange Summe (am Handy nicht in einer Zeile).

// Quadrat: x^2, bx^2, 3x^2, \frac{x^2}{b}
function square(rng: Rng, n: Names): Expr {
  const u = n.unknown
  const x2 = pow(u, num(2))
  const r = rng.next()
  if (r < 0.45) return x2
  if (r < 0.7) return mul(n.letter(), x2)
  if (r < 0.85) return mul(k(rng, 2, 5), x2)
  return div(x2, n.letter())
}

// Glied mit x: bx, 3x, x, \frac{x}{b}
function linearTerm(rng: Rng, n: Names): Expr {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.45) return letters(n.letter(), u)
  if (r < 0.7) return mul(k(rng, 2, 9), u)
  if (r < 0.85) return u
  return div(u, n.letter())
}

// Andere Seite, sicher positiv: y, b, 3b, \\frac{b}{c}, b + c (seltener y als sonst, für mehr Abwechslung)
function quadraticSide(rng: Rng, n: Names): Expr {
  const r = rng.next()
  if (r < 0.3) return variable('y')
  if (r < 0.55) return n.letter()
  if (r < 0.7) return mul(k(rng), n.letter())
  if (r < 0.85) return div(n.letter(), n.letter())
  return plus(n.letter(), n.letter())
}

// Summand in x^2 und x ohne Absolutglied: x^2 + ax, bx^2 - 3x, x(x + a), x(bx - 3), bx(x - c)
function quadraticPart(rng: Rng, n: Names): Expr {
  const u = n.unknown
  const r = rng.next()
  if (r < 0.5) return rng.chance(0.5) ? plus(square(rng, n), linearTerm(rng, n)) : minus(square(rng, n), linearTerm(rng, n))
  const inner = (lead: Expr) => (rng.chance(0.5) ? plus(lead, constant(rng, n)) : minus(lead, constant(rng, n)))
  if (r < 0.8) return mul(u, inner(rng.chance(0.25) ? u : head(rng, n, u)))
  return mul(rng.chance(0.6) ? n.letter() : k(rng, 2, 5), u, inner(u))
}

const quadratisch: FamilyBuild = (rng, n, level, r) => {
  if (r < 0.25) {
    // Quadrat gegen x: ax^2 = bx + c, x^2 = 3x + b
    const lead = level === 1 ? square(rng, n) : positiveShells(rng, square(rng, n), n, level - 1, level >= 3 ? 1 : 0).e
    const other = rng.chance(0.75) ? plus(linearTerm(rng, n), quadraticSide(rng, n)) : plus(quadraticSide(rng, n), linearTerm(rng, n))
    return { side: lead, other, label: 'Baustein quadratisch: $x^2$ gegen $x$' }
  }
  const max = level === 1 ? 1 : level + 1 > 4 ? 4 : level
  const { e, count } = positiveShells(rng, quadraticPart(rng, n), n, max, level === 1 ? 0 : level === 2 ? 1 : level - 1)
  return { side: e, other: quadraticSide(rng, n), label: `Baustein quadratisch: pq-Formel, ${count} Schalen` }
}

// --- Winkel- und Hyperbelfunktionen ---

// Funktion des Winkels mit Bedingung für den Bereich: a\sin(2x), \cos\frac{x}{b}
function trigBlock(rng: Rng, n: Names, allowed: readonly TrigName[]): { e: Expr; conditions: Condition[]; name: TrigName } {
  const u = n.unknown
  const name = trigName(rng, allowed)
  const angle = rng.chance(0.4) ? u : angleIn(rng, n, u)
  return { e: trigOf(name, angle), conditions: angleConditions(name, angle, u), name }
}

// Umkehrfunktion um einen Bruch oder eine Klammer: \arctan\frac{x}{b}, \arcsin\frac{x - a}{b}, \operatorname{arsinh}(2x)
function arcBlock(rng: Rng, n: Names, names: readonly ('arcsin' | 'arccos' | 'arctan' | 'arsinh' | 'artanh')[], level: Level): Expr {
  const u = n.unknown
  const arc = rng.pick(names)
  const inner = level === 1 ? (rng.chance(0.7) ? div(u, n.letter()) : simple(rng, n)) : div(bracketIn(rng, n, u, false).expr, n.letter())
  return fn(arc, inner)
}

function functionFamily(kind: 'trig' | 'hyperbolic'): FamilyBuild {
  const allowed: readonly TrigName[] = kind === 'trig' ? ['sin', 'cos', 'tan'] : ['sinh', 'cosh', 'tanh']
  const arcs = kind === 'trig' ? (['arcsin', 'arccos', 'arctan', 'arctan'] as const) : (['arsinh', 'arsinh', 'artanh'] as const)
  const title = kind === 'trig' ? 'Winkelfunktionen' : 'Hyperbelfunktionen'
  return (rng, n, level, r) => {
    if (level <= 2) {
      if (r < 0.3) {
        const { e, count } = withShells(rng, n, arcBlock(rng, n, arcs, level), level)
        return { side: e, label: `Baustein ${title}: Umkehrfunktion mit ${count} Schalen` }
      }
      const block = trigBlock(rng, n, allowed)
      if (level === 2 && r < 0.55) return { ...bothSides(rng, n, block.e), conditions: block.conditions, label: `Baustein ${title}: $\\${block.name}$ auf beiden Seiten` }
      const { e, count } = withShells(rng, n, block.e, level)
      return { side: e, conditions: block.conditions, label: `Baustein ${title}: $\\${block.name}$ mit ${count} Schalen` }
    }
    if (r < 0.45) {
      // Sinus und Kosinus (bzw. sinh und cosh) in jedem Summanden, danach Tangens: a\\sin x = b\\cos x + c\\sin x
      const built = trigQuotient(rng, n, kind)
      const extra = level === 3 ? (rng.chance(0.5) ? 1 : 0) : level === 4 ? 1 : 2
      return built.other || extra === 0 ? built : { ...built, side: shells(rng, built.side, n, extra) }
    }
    // Umkehrfunktion um eine Funktion mit Schalen: \\arctan\\left(a\\sin(2x) - b\\right) = y, \\operatorname{arsinh}(a\\tanh x + b)
    const inner = trigBlock(rng, n, kind === 'trig' ? ['sin', 'cos', 'tan'] : ['sinh', 'tanh'])
    const outerName = kind === 'trig' ? rng.pick(['arctan', 'arctan', 'arcsin'] as const) : rng.pick(['arsinh', 'arsinh', 'artanh'] as const)
    const outer = fn(outerName, scaled(rng, n, shells(rng, inner.e, n, level === 3 ? 1 : level === 4 ? rng.int(1, 2) : 2), false))
    const { e, count } = someShells(rng, outer, n, 2, level === 5 ? 2 : 1)
    return { side: e, conditions: inner.conditions, label: `Baustein ${title}: Umkehrfunktion um eine Funktion, ${count} Schalen` }
  }
}

const FAMILIES: Readonly<Record<string, FamilyBuild>> = {
  linear,
  brueche,
  wurzeln,
  potenzen,
  exp: expFamily,
  log: logFamily,
  quadratisch,
  winkel: functionFamily('trig'),
  hyperbel: functionFamily('hyperbolic'),
}

export const hasFamilyBuilder = (block: string) => block in FAMILIES

// Aufgabe des Bausteins block in einer Stufe; gesucht ist x (bei linearen Gleichungen manchmal ein Buchstabe)
// variant wählt die Art (ohne Angabe gewürfelt)
export function buildFamilyTask(rng: Rng, block: string, level: Level, variant = rng.next()): KitTask {
  const build = FAMILIES[block]
  if (!build) throw new Error(`Keine Aufgaben für den Baustein ${block}`)
  const n = names(rng, block === 'linear' && rng.chance(0.25))
  const built = build(rng, n, level, variant)
  const other = built.other ?? otherSide(rng, n)
  const equationFor = built.other ? (rng.chance(0.75) ? eq(built.side, other) : eq(other, built.side)) : equation(rng, built.side, other)
  const task: RearrangeTask = { equation: equationFor, target: n.target, conditions: built.conditions ?? [] }
  return { task, label: built.label }
}
