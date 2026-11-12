import {
  type Rational,
  ONE,
  ZERO,
  isInteger,
  isOne,
  isZero,
  ratAdd,
  ratMul,
  ratNeg,
  ratPow,
  ratRoot,
  ratSign,
} from '../rational.ts'
import { compareExpr, key, subterms } from './compare.ts'
import { evaluate } from './evaluate.ts'
import { type Expr, type FnName, num } from './types.ts'

// Normalform: eine feste, eindeutige Schreibweise zum Vergleichen und Vereinfachen.
// - nur Zahl, Konstante, Variable, Summe, Produkt, Potenz, Funktion, Logarithmus
//   (Minus → ·(−1), Bruch → ·(…)^(−1), gerade Wurzel → ^(1/n)),
// - ungerade Wurzeln bleiben Wurzeln, denn ∛x ist auch für x < 0 definiert, x^(1/3) nicht
//   (M6 Schritt 4c): Zahlfaktoren und Faktoren werden einzeln gezogen (∛(−8x) = −2∛x),
//   ∛(u^k) wird (∛u)^k, (∛u)³ wird u,
// - Summen und Produkte flach und sortiert, Zahlen zusammengefasst,
// - gleichartige Summanden zusammengefasst (2x + 3x = 5x),
// - in Summen „Zahl mal Klammer" aufgelöst (x − (x + 1) = −1),
// - Potenzen gleicher Basis zusammengefasst (x² · x³ = x⁵).
//
// Jede Umformung ist auf dem Definitionsbereich des Ausgangsterms wertgleich.
// Der Definitionsbereich darf dabei größer werden (x/x → 1), nie kleiner.
// Deshalb z. B. (x²)^(1/2) → bleibt stehen (wäre |x|, nicht x).

const ZERO_NUM = num(0)
const ONE_NUM = num(1)

export function normalize(e: Expr): Expr {
  switch (e.kind) {
    case 'num':
      return e.decimal ? num(e.value) : e
    case 'const':
    case 'var':
      return e
    case 'neg':
      return makeMul([num(-1), normalize(e.arg)])
    case 'div':
      return makeMul([normalize(e.num), makePow(normalize(e.den), num(-1))])
    case 'root':
      return e.index % 2 === 1 ? makeOddRoot(normalize(e.arg), e.index) : makePow(normalize(e.arg), num(1, e.index))
    case 'add':
      return makeAdd(e.terms.map(normalize))
    case 'mul':
      return makeMul(e.factors.map(normalize))
    case 'pow':
      return makePow(normalize(e.base), normalize(e.exp))
    case 'fn':
      return makeFn(e.name, normalize(e.arg))
    case 'log':
      return makeLog(normalize(e.base), normalize(e.arg))
  }
}

// Zerlegt einen Summanden in Zahlfaktor und Rest: 3x² → [3, x²]
function splitCoefficient(term: Expr): [Rational, Expr] {
  if (term.kind === 'mul' && term.factors[0].kind === 'num') {
    const rest = term.factors.slice(1)
    return [term.factors[0].value, rest.length === 1 ? rest[0] : { kind: 'mul', factors: rest }]
  }
  return [ONE, term]
}

function withCoefficient(c: Rational, rest: Expr): Expr {
  if (isOne(c)) return rest
  const factors = rest.kind === 'mul' ? rest.factors : [rest]
  return { kind: 'mul', factors: [num(c), ...factors] }
}

// Innerhalb einer Summe wird „Zahl mal Klammer" aufgelöst: x − (x + 1) → x − x − 1.
// Als eigenständiges Produkt bleibt 2(x + 1) stehen.
function summands(t: Expr): readonly Expr[] {
  if (t.kind === 'add') return t.terms
  if (t.kind === 'mul' && t.factors.length === 2 && t.factors[0].kind === 'num' && t.factors[1].kind === 'add') {
    const c = t.factors[0]
    return t.factors[1].terms.map((term) => makeMul([c, term]))
  }
  return [t]
}

function makeAdd(terms: readonly Expr[]): Expr {
  const flat = terms.flatMap(summands)
  let constant = ZERO
  const groups = new Map<string, { rest: Expr; coef: Rational }>()
  for (const term of flat) {
    if (term.kind === 'num') {
      constant = ratAdd(constant, term.value)
      continue
    }
    const [coef, rest] = splitCoefficient(term)
    const k = key(rest)
    const group = groups.get(k)
    if (group) group.coef = ratAdd(group.coef, coef)
    else groups.set(k, { rest, coef })
  }

  const result: Expr[] = []
  for (const { rest, coef } of groups.values()) {
    if (!isZero(coef)) result.push(withCoefficient(coef, rest))
  }
  if (!isZero(constant)) result.push(num(constant))
  if (result.length === 0) return ZERO_NUM
  if (result.length === 1) return result[0]
  return { kind: 'add', terms: result.sort(compareExpr) }
}

function makeMul(factors: readonly Expr[]): Expr {
  const flat = factors.flatMap((f) => (f.kind === 'mul' ? f.factors : [f]))
  let coef = ONE
  const groups = new Map<string, { base: Expr; exps: Expr[]; original: Expr }>()
  for (const factor of flat) {
    if (factor.kind === 'num') {
      coef = ratMul(coef, factor.value)
      continue
    }
    const [base, exponent] = factor.kind === 'pow' ? [factor.base, factor.exp] : [factor, ONE_NUM]
    const k = key(base)
    const group = groups.get(k)
    if (group) group.exps.push(exponent)
    else groups.set(k, { base, exps: [exponent], original: factor })
  }
  if (isZero(coef)) return ZERO_NUM

  const result: Expr[] = []
  let needsAnotherPass = false
  for (const { base, exps, original } of groups.values()) {
    if (exps.length === 1) {
      result.push(original)
      continue
    }
    const combined = makePow(base, makeAdd(exps))
    if (combined.kind === 'num' || combined.kind === 'mul') needsAnotherPass = true
    result.push(combined)
  }
  if (needsAnotherPass) return makeMul([num(coef), ...result])

  result.sort(compareExpr)
  if (result.length === 0) return num(coef)
  if (isOne(coef) && result.length === 1) return result[0]
  return { kind: 'mul', factors: isOne(coef) ? result : [num(coef), ...result] }
}

const isE = (e: Expr) => e.kind === 'const' && e.name === 'e'

function makePow(base: Expr, exponent: Expr): Expr {
  const r = exponent.kind === 'num' ? exponent.value : null
  if (r && isZero(r)) return ONE_NUM
  if (r && isOne(r)) return base
  if (base.kind === 'num') {
    if (r) {
      const value = ratPow(base.value, r)
      if (value) return num(value)
    }
    if (isOne(base.value)) return ONE_NUM
  }
  // (ⁿ√u)^k für ungerades n und ganzzahliges k: ganze Potenzen herausziehen, (∛u)⁴ = u · ∛u, (∛u)³ = u
  if (base.kind === 'root' && r && isInteger(r)) {
    const n = BigInt(base.index)
    const whole = r.n / n
    if (whole !== 0n) return makeMul([makePow(base.arg, num(whole)), makePow(base, num(r.n % n))])
  }
  // u^(p/q) mit ungeradem q als Wurzel: x^(2/3) → (∛x)². Das vergrößert nur den Definitionsbereich (x^(2/3) gilt
  // nur für x ≥ 0) und gibt ∛x und x^(1/3) dieselbe Normalform. Feste Werte ohne Buchstaben (2, e, \sqrt{2})
  // bleiben Potenzen, passend zu makeOddRoot.
  if (r && !isInteger(r) && r.d % 2n === 1n && !isFixedValue(base)) {
    return makePow(makeOddRoot(base, Number(r.d)), num(r.n))
  }
  // (ⁿ√u)^a mit nicht ganzzahligem a (√, Buchstabe): nur für ⁿ√u ≥ 0 definiert, also u ≥ 0; dann u^(a/n)
  if (base.kind === 'root' && !(r && isInteger(r))) return makePow(base.arg, makeMul([exponent, num(1, base.index)]))
  // (u^a)^k = u^(a·k) nur für ganzzahliges k; sonst wäre z. B. (x²)^(1/2) = x falsch
  if (base.kind === 'pow' && r && isInteger(r)) return makePow(base.base, makeMul([base.exp, exponent]))
  // (a · b)^k = a^k · b^k für ganzzahliges k
  if (base.kind === 'mul' && r && isInteger(r)) return makeMul(base.factors.map((f) => makePow(f, exponent)))
  // e^(ln u) = u
  if (isE(base) && exponent.kind === 'fn' && exponent.name === 'ln') return exponent.arg
  return { kind: 'pow', base, exp: exponent }
}

const VALUE_AT_ZERO: Partial<Record<FnName, number>> = {
  sin: 0,
  tan: 0,
  arcsin: 0,
  arctan: 0,
  sinh: 0,
  tanh: 0,
  arsinh: 0,
  artanh: 0,
  cos: 1,
  cosh: 1,
}

function makeFn(name: FnName, arg: Expr): Expr {
  if (arg.kind === 'num' && isZero(arg.value) && VALUE_AT_ZERO[name] !== undefined) {
    return num(VALUE_AT_ZERO[name])
  }
  if (name === 'ln') {
    if (arg.kind === 'num' && isOne(arg.value)) return ZERO_NUM
    if (isE(arg)) return ONE_NUM
    // ln(e^u) = u
    if (arg.kind === 'pow' && isE(arg.base)) return arg.exp
  }
  return { kind: 'fn', name, arg }
}

function makeLog(base: Expr, arg: Expr): Expr {
  if (arg.kind === 'num' && isOne(arg.value)) return ZERO_NUM
  if (key(base) === key(arg)) return ONE_NUM
  return { kind: 'log', base, arg }
}

// Ungerade Wurzel ⁿ√u (n ungerade) in Normalform. Jede Umformung gilt für alle reellen u:
// ⁿ√(a · b) = ⁿ√a · ⁿ√b, ⁿ√(u^k) = (ⁿ√u)^k für ganzzahliges k, ⁿ√(ᵐ√u) = ⁿᵐ√u, ⁿ√(−8) exakt.
// Eine Zahl ohne exakte Wurzel wird zur Potenz (positiv: ∛2 = 2^(1/3); negativ: ∛(−2) = −2^(1/3)).
function makeOddRoot(arg: Expr, n: number): Expr {
  if (arg.kind === 'num') {
    const exact = ratRoot(arg.value, n)
    if (exact) return num(exact)
    if (ratSign(arg.value) < 0) return makeMul([num(-1), makePow(num(ratNeg(arg.value)), num(1, n))])
    return makePow(arg, num(1, n))
  }
  // Fester positiver Wert ohne Buchstaben (e, π, 2^(1/2)): Potenz wie bei Zahlen (passend zu makePow)
  if (isFixedValue(arg) && evaluate(arg, {}) > 0) return makePow(arg, num(1, n))
  if (arg.kind === 'mul') return makeMul(arg.factors.map((f) => makeOddRoot(f, n)))
  if (arg.kind === 'pow' && arg.exp.kind === 'num' && isInteger(arg.exp.value)) return makePow(makeOddRoot(arg.base, n), arg.exp)
  // Potenz mit gebrochener oder variabler Hochzahl: nur für w ≥ 0 (bzw. w > 0) definiert, nie negativ; dann
  // ⁿ√(w^a) = w^(a/n) mit demselben Definitionsbereich
  if (arg.kind === 'pow') return makePow(arg.base, makeMul([arg.exp, num(1, n)]))
  if (arg.kind === 'root' && arg.index % 2 === 1) return makeOddRoot(arg.arg, n * arg.index)
  return { kind: 'root', arg, index: n }
}

// Term ohne Buchstaben und ohne i (z. B. e, π, 2^(1/2), 1 − π)
const isFixedValue = (e: Expr) => subterms(e).every((t) => t.kind !== 'var' && !(t.kind === 'const' && t.name === 'i'))
