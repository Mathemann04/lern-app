import { type Rational, isInteger, isOne, ratCmp, ratSign } from '../rational.ts'
import { key } from './compare.ts'
import { toDisplayForm } from './display.ts'
import { normalize } from './normalize.ts'
import { type Expr, add, fn, log, mul, num, pow } from './types.ts'

// Endform eines Ergebnisses, zusammengefasst wie im Skript:
// - Produkte von Polynomen in Summen ausmultiplizieren: 3x²(x² + 9) − 2x⁴ → x⁴ + 27x²
// - gemeinsame Faktoren ausklammern: 2x e^x + x² e^x → x(x + 2)e^x
// - dabei gegen x im Nenner kürzen: (x − 2x ln x)/x⁴ → (1 − 2 ln x)/x³
// - Minus vor die Klammer ziehen, wenn alle Summanden negativ sind
// - Zahl mal Klammer als ganzes Ergebnis ausmultiplizieren
// Reine Polynome werden nicht ausgeklammert (12x² + 4x bleibt so).
// Jede Umformung ist wertgleich; die Eigenschaftstests in finalForm.test.ts prüfen das.
export function finalForm(e: Expr): Expr {
  const n = factorSums(expandPolynomialSums(normalize(e)))
  // Zahl mal Klammer als ganzes Ergebnis wird ausmultipliziert: −3(x² − 1) → 3 − 3x²
  const isNumberTimesSum = n.kind === 'mul' && n.factors.length === 2 && n.factors[0].kind === 'num' && n.factors[1].kind === 'add'
  return toDisplayForm(isNumberTimesSum ? normalize({ kind: 'add', terms: [n] }) : n)
}

// --- Hilfen auf Normalformen ---

// Nur Potenzen der Variablen (auch gebrochene oder negative Exponenten), Zahlen und
// Konstanten, z. B. 3x² − 5\sqrt[4]{x}. Solche Summen werden nie ausgeklammert.
function isPowerSum(e: Expr): boolean {
  switch (e.kind) {
    case 'num':
    case 'const':
    case 'var':
      return true
    case 'pow':
      return e.base.kind === 'var' && e.exp.kind === 'num'
    case 'mul':
      return e.factors.every(isPowerSum)
    case 'add':
      return e.terms.every(isPowerSum)
    default:
      return false
  }
}

// Polynom in den Variablen: Zahlen, Konstanten, Variablen, natürliche Potenzen davon
function isPolynomial(e: Expr): boolean {
  switch (e.kind) {
    case 'num':
    case 'const':
    case 'var':
      return true
    case 'pow':
      return (
        e.base.kind === 'var' && e.exp.kind === 'num' && isInteger(e.exp.value) && ratSign(e.exp.value) > 0
      )
    case 'mul':
      return e.factors.every(isPolynomial)
    case 'add':
      return e.terms.every(isPolynomial)
    default:
      return false
  }
}

function isNegativeTerm(t: Expr): boolean {
  if (t.kind === 'num') return ratSign(t.value) < 0
  return t.kind === 'mul' && t.factors[0].kind === 'num' && ratSign(t.factors[0].value) < 0
}

const negate = (t: Expr) => normalize(mul(num(-1), t))

function mapChildren(e: Expr, f: (child: Expr) => Expr): Expr {
  switch (e.kind) {
    case 'add':
      return normalize(add(...e.terms.map(f)))
    case 'mul':
      return normalize(mul(...e.factors.map(f)))
    case 'pow':
      return normalize(pow(f(e.base), f(e.exp)))
    case 'fn':
      return normalize(fn(e.name, f(e.arg)))
    case 'log':
      return normalize(log(f(e.base), f(e.arg)))
    default:
      return e
  }
}

// --- Ausmultiplizieren ---

const MAX_EXPANDED_TERMS = 40

function expandPolynomialSums(e: Expr): Expr {
  const inner = mapChildren(e, expandPolynomialSums)
  if (inner.kind !== 'add') return inner
  const terms = inner.terms.flatMap((t) => {
    if (t.kind !== 'mul' || !isPolynomial(t) || !t.factors.some((f) => f.kind === 'add')) return [t]
    return expandProduct(t.factors) ?? [t]
  })
  return normalize(add(...terms))
}

function expandProduct(factors: readonly Expr[]): Expr[] | null {
  let terms: Expr[] = [num(1)]
  for (const f of factors) {
    const parts = f.kind === 'add' ? f.terms : [f]
    terms = terms.flatMap((t) => parts.map((p) => normalize(mul(t, p))))
    if (terms.length > MAX_EXPANDED_TERMS) return null
  }
  return terms
}

// --- Ausklammern ---

type FactorInfo = { base: Expr; exponent: Rational }

// Faktoren eines Summanden ohne Zahlfaktor: 3x²e^x → {x: 2, e^x: 1}
function factorInfo(term: Expr): Map<string, FactorInfo> | null {
  const factors = term.kind === 'mul' ? term.factors : [term]
  const info = new Map<string, FactorInfo>()
  for (const f of factors) {
    if (f.kind === 'num') continue
    if (f.kind === 'pow' && f.exp.kind === 'num') info.set(key(f.base), { base: f.base, exponent: f.exp.value })
    else info.set(key(f), { base: f, exponent: { n: 1n, d: 1n } })
  }
  return info
}

// Gemeinsame Faktoren aller Summanden (jeweils mit kleinstem positivem Exponenten)
function commonFactors(terms: readonly Expr[]): Expr[] {
  if (terms.some((t) => t.kind === 'num')) return []
  const infos = terms.map(factorInfo)
  const [first, ...others] = infos
  if (!first) return []
  const common: Expr[] = []
  for (const [k, { base, exponent }] of first) {
    if (base.kind === 'const') continue
    let min: Rational | null = exponent
    for (const other of others) {
      const match = other?.get(k)
      if (!match) {
        min = null
        break
      }
      if (ratCmp(match.exponent, min) < 0) min = match.exponent
    }
    if (min && ratSign(min) > 0) common.push(isOne(min) ? base : pow(base, num(min)))
  }
  return common
}

const divideAll = (terms: readonly Expr[], factors: readonly Expr[]) => {
  const divisor = pow(mul(...factors), num(-1))
  return terms.map((t) => normalize(mul(t, divisor)))
}

// Welche gemeinsamen Faktoren werden ausgeklammert?
// - Funktionsfaktoren (e^x, \sin x, (x² + 1)³ …) immer: 2x e^x + x² e^x → (x² + 2x)e^x
// - Potenzen von x nur, wenn sie gegen x im Nenner gekürzt werden können, oder wenn
//   danach ein Summand eine reine Zahl ist: 3x² \ln x + x² → x²(3 \ln x + 1).
//   Bei 2x \sin x + x² \cos x bleibt alles stehen.
function chooseFactors(terms: readonly Expr[], negativeVariablePower: boolean): Expr[] {
  if (terms.every(isPowerSum) && !negativeVariablePower) return []
  const common = commonFactors(terms)
  const isVariablePower = (f: Expr) => f.kind === 'var' || (f.kind === 'pow' && f.base.kind === 'var')
  const variablePowers = common.filter(isVariablePower)
  const others = common.filter((f) => !isVariablePower(f))
  if (variablePowers.length === 0) return others
  if (negativeVariablePower) return common
  const leavesNumber = divideAll(terms, variablePowers).some((t) => t.kind === 'num')
  return leavesNumber ? common : others
}

// Klammert in einer Summe aus. `isFactor`: Die Summe steht in einem Produkt (dann darf
// auch ein reines Minus vor die Klammer). `negativeVariablePower`: Im Produkt steht x im
// Nenner, gegen das ein ausgeklammertes x gekürzt werden kann.
function factorSum(sum: Extract<Expr, { kind: 'add' }>, negativeVariablePower: boolean, isFactor: boolean): Expr {
  const common = chooseFactors(sum.terms, negativeVariablePower)
  let rest: readonly Expr[] = sum.terms
  if (common.length > 0) {
    // Was in der Klammer bleibt, wird ausmultipliziert: 2x(x + 3) − 1 → 2x² + 6x − 1
    const remaining = expandPolynomialSums(normalize(add(...divideAll(sum.terms, common))))
    rest = remaining.kind === 'add' ? remaining.terms : [remaining]
  }
  let sign = 1
  if ((isFactor || common.length > 0) && rest.every(isNegativeTerm)) {
    rest = rest.map(negate)
    sign = -1
  }
  if (common.length === 0 && sign === 1) return sum
  return normalize(mul(num(sign), ...common, normalize(add(...rest))))
}

function hasNegativeVariablePower(factors: readonly Expr[]): boolean {
  return factors.some(
    (f) => f.kind === 'pow' && f.base.kind === 'var' && f.exp.kind === 'num' && ratSign(f.exp.value) < 0,
  )
}

function processTerms(sum: Extract<Expr, { kind: 'add' }>): Expr {
  return normalize(add(...sum.terms.map(factorSums)))
}

function factorSums(e: Expr): Expr {
  switch (e.kind) {
    case 'add': {
      const s = processTerms(e)
      return s.kind === 'add' ? factorSum(s, false, false) : s
    }
    case 'mul': {
      const negativePower = hasNegativeVariablePower(e.factors)
      const factors = e.factors.map((f) => {
        if (f.kind !== 'add') return factorSums(f)
        const s = processTerms(f)
        return s.kind === 'add' ? factorSum(s, negativePower, true) : s
      })
      return normalize(mul(...factors))
    }
    default:
      return mapChildren(e, factorSums)
  }
}
