import { isInteger, ratToNumber } from '../rational.ts'
import { type Expr, type FnName, asRational } from './types.ts'

export type Env = Readonly<Record<string, number>>

// Wert eines Terms an einer Stelle. NaN, wenn der Term dort nicht definiert ist.
//
// Definitionsbereich nach deutscher Schulkonvention:
// - Wurzeln und gebrochene Exponenten nur für Zahlen ≥ 0 (auch die dritte Wurzel),
// - Potenzen mit variablem Exponenten (a^x, x^x) nur für Basis > 0,
// - ln und log nur für Zahlen > 0.
export function evaluate(e: Expr, env: Env): number {
  const value = evaluateRaw(e, env)
  return Number.isFinite(value) ? value : NaN
}

function evaluateRaw(e: Expr, env: Env): number {
  switch (e.kind) {
    case 'num':
      return ratToNumber(e.value)
    case 'const':
      return e.name === 'e' ? Math.E : Math.PI
    case 'var':
      return env[e.name] ?? NaN
    case 'add':
      return e.terms.reduce((sum, t) => sum + evaluate(t, env), 0)
    case 'mul':
      return e.factors.reduce((product, f) => product * evaluate(f, env), 1)
    case 'neg':
      return -evaluate(e.arg, env)
    case 'div': {
      const den = evaluate(e.den, env)
      return den === 0 ? NaN : evaluate(e.num, env) / den
    }
    case 'pow':
      return evaluatePow(e.base, e.exp, env)
    case 'root': {
      const a = evaluate(e.arg, env)
      if (!(a >= 0)) return NaN
      return e.index === 2 ? Math.sqrt(a) : e.index === 3 ? Math.cbrt(a) : a ** (1 / e.index)
    }
    case 'fn':
      return evaluateFn(e.name, evaluate(e.arg, env))
    case 'log': {
      const base = evaluate(e.base, env)
      const arg = evaluate(e.arg, env)
      if (!(base > 0) || base === 1 || !(arg > 0)) return NaN
      return Math.log(arg) / Math.log(base)
    }
  }
}

function evaluatePow(baseExpr: Expr, expExpr: Expr, env: Env): number {
  const base = evaluate(baseExpr, env)
  if (Number.isNaN(base)) return NaN
  const literal = asRational(expExpr)
  if (literal) {
    const r = ratToNumber(literal)
    if (isInteger(literal)) return base === 0 && r < 0 ? NaN : base ** r
    // Gebrochener Exponent = Wurzel: nur für Basis ≥ 0
    if (base < 0 || (base === 0 && r < 0)) return NaN
    return base ** r
  }
  const exponent = evaluate(expExpr, env)
  if (Number.isNaN(exponent)) return NaN
  if (baseExpr.kind === 'const' && baseExpr.name === 'e') return Math.exp(exponent)
  if (base > 0) return base ** exponent
  if (base === 0 && exponent > 0) return 0
  return NaN
}

function evaluateFn(name: FnName, a: number): number {
  if (Number.isNaN(a)) return NaN
  switch (name) {
    case 'sin':
      return Math.sin(a)
    case 'cos':
      return Math.cos(a)
    case 'tan':
      return Math.cos(a) === 0 ? NaN : Math.tan(a)
    case 'cot':
      return Math.sin(a) === 0 ? NaN : Math.cos(a) / Math.sin(a)
    case 'ln':
      return a > 0 ? Math.log(a) : NaN
    case 'arcsin':
      return Math.abs(a) <= 1 ? Math.asin(a) : NaN
    case 'arccos':
      return Math.abs(a) <= 1 ? Math.acos(a) : NaN
    case 'arctan':
      return Math.atan(a)
    case 'sinh':
      return Math.sinh(a)
    case 'cosh':
      return Math.cosh(a)
    case 'tanh':
      return Math.tanh(a)
    case 'arsinh':
      return Math.asinh(a)
    case 'arcosh':
      return a >= 1 ? Math.acosh(a) : NaN
    case 'artanh':
      return Math.abs(a) < 1 ? Math.atanh(a) : NaN
  }
}
