import { ONE, type Rational, isInteger, isOne, isZero, ratNeg, ratSub, rat } from '../rational.ts'
import { contains } from '../expr/compare.ts'
import { finalForm } from '../expr/finalForm.ts'
import { substitute } from '../expr/substitute.ts'
import {
  type Expr,
  type FnName,
  E,
  add,
  asRational,
  cos,
  div,
  fn,
  ln,
  log,
  mul,
  mulDot,
  neg,
  num,
  pow,
  root,
  sin,
  sqrt,
  sub,
  variable,
} from '../expr/types.ts'
import type { RuleId } from './rules.ts'

// Ableiten mit Protokoll: Für jeden Teilterm wird festgehalten, welche Regel gilt,
// aus welchen Teilen er besteht und was beim Einsetzen herauskommt.
// Daraus entstehen später die Schritte im geführten Modus und die Fehlerdiagnose.

// Platzhalter für die innere Funktion bei der Kettenregel: f(u) mit u = g(x)
export const PLACEHOLDER = 'u'
const U = variable(PLACEHOLDER)

export type DerivationParts = {
  // Produkt- und Quotientenregel: u · v bzw. u / v
  readonly u?: Expr
  readonly v?: Expr
  // Faktorregel: factor · rest bzw. rest / factor (divisor)
  readonly factor?: Expr
  readonly rest?: Expr
  readonly divisor?: boolean
  // Kettenregel: äußere Funktion mit Platzhalter u, innere Funktion
  readonly outer?: Expr
  readonly inner?: Expr
  // Potenzregel: base^exponent; a^x und log_a x: Basis a
  readonly base?: Expr
  readonly exponent?: Expr
  // Umschreiben: neue Schreibweise, z. B. 2/x → 2x^(−1)
  readonly rewritten?: Expr
}

export type Derivation = {
  readonly rule: RuleId
  // abgeleiteter Teilterm (Aufgabenform)
  readonly input: Expr
  readonly variable: string
  readonly parts: DerivationParts
  readonly children: readonly Derivation[]
  // Regel mit eingesetzten Teilen, vor dem Zusammenfassen, z. B. 2x · e^x + x² · e^x
  readonly formula: Expr
  // zusammengefasstes Ergebnis, z. B. x(x + 2)e^x
  readonly result: Expr
  // Position im Baum: Folge der Kind-Nummern ab der Wurzel
  readonly path: readonly number[]
  // gesetzt, wenn hier absichtlich eine Fehlerregel angewendet wurde
  readonly errorId?: string
}

// Ersetzt an einem Knoten das richtige Ergebnis durch ein falsches (für Fehlerregeln)
export type Override = (node: Derivation) => { formula: Expr; errorId: string } | null

export function derive(expr: Expr, variableName = 'x', override?: Override): Derivation {
  return deriveAt(expr, variableName, [], override)
}

// Alle Knoten des Baums, Wurzel zuerst
export function allNodes(d: Derivation): Derivation[] {
  return [d, ...d.children.flatMap(allNodes)]
}

function deriveAt(e: Expr, v: string, path: readonly number[], override?: Override): Derivation {
  const node = build(e, v, path, override)
  const wrong = override?.(node)
  if (!wrong) return node
  return { ...node, formula: wrong.formula, result: finalForm(wrong.formula), errorId: wrong.errorId }
}

// Exponent r, falls der Term eine reine Potenz der Variablen ist: x → 1, x^r → r,
// ⁿ√x → 1/n, ⁿ√(x^m) → m/n. Wurzeln nur, wenn m/n nicht ganzzahlig ist: √(x²) ist |x|, nicht x.
function variablePower(e: Expr, v: string): Rational | null {
  const isVar = (t: Expr) => t.kind === 'var' && t.name === v
  if (isVar(e)) return ONE
  if (e.kind === 'pow' && isVar(e.base)) return asRational(e.exp)
  if (e.kind === 'root') {
    let m: Rational | null = null
    if (isVar(e.arg)) m = ONE
    else if (e.arg.kind === 'pow' && isVar(e.arg.base)) m = asRational(e.arg.exp)
    if (!m || !isInteger(m)) return null
    const r = rat(m.n, BigInt(e.index))
    return isInteger(r) ? null : r
  }
  return null
}

// n · x^(n−1), mit ausgerechnetem Exponenten
function powerFormula(base: Expr, exponent: Expr): Expr {
  const r = asRational(exponent)
  if (!r) return mul(exponent, pow(base, sub(exponent, num(1))))
  const lowered = ratSub(r, ONE)
  if (isZero(lowered)) return num(r)
  const power = isOne(lowered) ? base : pow(base, num(lowered))
  return isOne(r) ? power : mul(num(r), power)
}

function basicDerivative(name: FnName, X: Expr): Expr {
  const square = pow(X, num(2))
  switch (name) {
    case 'ln':
      return div(num(1), X)
    case 'sin':
      return cos(X)
    case 'cos':
      return neg(sin(X))
    case 'tan':
      return div(num(1), pow(cos(X), num(2)))
    case 'cot':
      return neg(div(num(1), pow(sin(X), num(2))))
    case 'arcsin':
      return div(num(1), sqrt(sub(num(1), square)))
    case 'arccos':
      return neg(div(num(1), sqrt(sub(num(1), square))))
    case 'arctan':
      return div(num(1), add(num(1), square))
    case 'sinh':
      return fn('cosh', X)
    case 'cosh':
      return fn('sinh', X)
    case 'tanh':
      return div(num(1), pow(fn('cosh', X), num(2)))
    case 'arsinh':
      return div(num(1), sqrt(add(square, num(1))))
    case 'arcosh':
      return div(num(1), sqrt(sub(square, num(1))))
    case 'artanh':
      return div(num(1), sub(num(1), square))
  }
}

function build(e: Expr, v: string, path: readonly number[], override?: Override): Derivation {
  const X = variable(v)
  const child = (expr: Expr, index: number, name = v) => deriveAt(expr, name, [...path, index], override)
  const node = (rule: RuleId, parts: DerivationParts, children: Derivation[], formula: Expr): Derivation => ({
    rule,
    input: e,
    variable: v,
    parts,
    children,
    formula,
    result: finalForm(formula),
    path,
  })

  // f(u) mit u = inner: f'(inner) · inner'
  const chain = (outer: Expr, inner: Expr): Derivation => {
    const outerDerivation = child(outer, 0, PLACEHOLDER)
    const innerDerivation = child(inner, 1)
    const outerAtInner = substitute(outerDerivation.result, PLACEHOLDER, inner)
    return node('chain', { outer, inner }, [outerDerivation, innerDerivation], mulDot(outerAtInner, innerDerivation.result))
  }

  const rewrite = (rewritten: Expr): Derivation => {
    const inner = child(rewritten, 0)
    return node('rewrite', { rewritten }, [inner], inner.result)
  }

  if (!contains(e, v)) return node('constant', {}, [], num(0))

  switch (e.kind) {
    case 'var':
      return node('power', { base: e, exponent: num(1) }, [], num(1))

    case 'add': {
      const children = e.terms.map((t, i) => child(t, i))
      return node('sum', {}, children, add(...children.map((c) => c.result)))
    }

    case 'neg': {
      // −(3 · u) wird als ein Faktor −3 behandelt, nicht als −1 und 3
      if (e.arg.kind === 'mul') {
        const constants = e.arg.factors.filter((f) => !contains(f, v))
        const dependents = e.arg.factors.filter((f) => contains(f, v))
        const constant = constants.length === 1 ? constants[0] : mul(...constants)
        if (constants.length > 0 && constant.kind === 'num') {
          const rest = dependents.length === 1 ? dependents[0] : mul(...dependents)
          const factor = num(ratNeg(constant.value))
          const inner = child(rest, 0)
          return node('constantFactor', { factor, rest }, [inner], mulDot(factor, inner.result))
        }
      }
      const inner = child(e.arg, 0)
      return node('constantFactor', { factor: num(-1), rest: e.arg }, [inner], neg(inner.result))
    }

    case 'mul': {
      const constants = e.factors.filter((f) => !contains(f, v))
      const dependents = e.factors.filter((f) => contains(f, v))
      const rest = dependents.length === 1 ? dependents[0] : mul(...dependents)
      if (constants.length > 0) {
        const factor = constants.length === 1 ? constants[0] : mul(...constants)
        const inner = child(rest, 0)
        return node('constantFactor', { factor, rest }, [inner], mulDot(factor, inner.result))
      }
      // Mehr als zwei Faktoren: u = erster Faktor, v = Rest
      const [u, ...others] = dependents
      const w = others.length === 1 ? others[0] : mul(...others)
      const du = child(u, 0)
      const dw = child(w, 1)
      return node('product', { u, v: w }, [du, dw], add(mulDot(du.result, w), mulDot(u, dw.result)))
    }

    case 'div': {
      if (!contains(e.den, v)) {
        const inner = child(e.num, 0)
        return node('constantFactor', { factor: e.den, rest: e.num, divisor: true }, [inner], div(inner.result, e.den))
      }
      const r = contains(e.num, v) ? null : variablePower(e.den, v)
      if (r) {
        const power = pow(X, num(ratNeg(r)))
        return rewrite(e.num.kind === 'num' && isOne(e.num.value) ? power : mul(e.num, power))
      }
      const du = child(e.num, 0)
      const dv = child(e.den, 1)
      const numerator = add(mulDot(du.result, e.den), neg(mulDot(e.num, dv.result)))
      return node('quotient', { u: e.num, v: e.den }, [du, dv], div(numerator, pow(e.den, num(2))))
    }

    case 'pow': {
      const baseDepends = contains(e.base, v)
      const expDepends = contains(e.exp, v)
      if (baseDepends && !expDepends) {
        if (e.base.kind === 'var') return node('power', { base: e.base, exponent: e.exp }, [], powerFormula(e.base, e.exp))
        return chain(pow(U, e.exp), e.base)
      }
      if (!baseDepends) {
        const isE = e.base.kind === 'const' && e.base.name === 'e'
        if (e.exp.kind === 'var') {
          return isE
            ? node('exp', { base: e.base }, [], pow(E, X))
            : node('expBase', { base: e.base }, [], mulDot(pow(e.base, X), ln(e.base)))
        }
        return chain(pow(e.base, U), e.exp)
      }
      // Basis und Exponent hängen von x ab: u^v = e^(v · ln u)
      const inner = child(mul(e.exp, ln(e.base)), 0)
      return node('logarithmic', { u: e.base, v: e.exp }, [inner], mulDot(e, inner.result))
    }

    case 'root': {
      const r = variablePower(e, v)
      if (r) return rewrite(pow(X, num(r)))
      return chain(root(U, e.index), e.arg)
    }

    case 'fn':
      if (e.arg.kind === 'var' && e.arg.name === v) return node(e.name, {}, [], basicDerivative(e.name, X))
      return chain(fn(e.name, U), e.arg)

    case 'log':
      if (contains(e.base, v)) return rewrite(div(ln(e.arg), ln(e.base)))
      if (e.arg.kind === 'var' && e.arg.name === v) {
        return node('logBase', { base: e.base }, [], div(num(1), mulDot(X, ln(e.base))))
      }
      return chain(log(e.base, U), e.arg)

    case 'num':
    case 'const':
      return node('constant', {}, [], num(0))
  }
}
