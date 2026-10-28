import { isInteger, ratAbs, ratSign, toDecimalString } from '../rational.ts'
import type { Equation, Expr, FnName } from './types.ts'

// Gibt einen Term als LaTeX aus, in deutscher Schreibweise wie im Skript:
// echte Brüche, Dezimalkomma, Malpunkt nur wo nötig, \sin^2 x, ln, Klammern nur wo nötig.
// Der Baum wird genau so ausgegeben, wie er gebaut ist (keine Umformung).

const FN_LATEX: Record<FnName, string> = {
  sin: '\\sin',
  cos: '\\cos',
  tan: '\\tan',
  cot: '\\cot',
  ln: '\\ln',
  arcsin: '\\arcsin',
  arccos: '\\arccos',
  arctan: '\\arctan',
  sinh: '\\sinh',
  cosh: '\\cosh',
  tanh: '\\tanh',
  arsinh: '\\operatorname{arsinh}',
  arcosh: '\\operatorname{arcosh}',
  artanh: '\\operatorname{artanh}',
}

// Bei diesen Funktionen wird die Potenz über den Namen geschrieben: \sin^2 x
const POWER_ON_NAME = new Set<FnName>(['sin', 'cos', 'tan', 'cot', 'sinh', 'cosh', 'tanh'])

export function toLatex(e: Expr): string {
  switch (e.kind) {
    case 'num':
      return printNum(e)
    case 'const':
      return e.name === 'e' ? 'e' : '\\pi'
    case 'var':
      return e.name
    case 'add':
      return printSum(e.terms)
    case 'mul':
      return e.explicit ? printExplicitProduct(e.factors) : printProduct(e.factors)
    case 'neg':
      return '-' + (e.arg.kind === 'add' || isNegative(e.arg) ? paren(toLatex(e.arg)) : toLatex(e.arg))
    case 'div':
      return `\\frac{${toLatex(e.num)}}{${toLatex(e.den)}}`
    case 'pow':
      return printPow(e.base, e.exp)
    case 'root':
      return e.index === 2 ? `\\sqrt{${toLatex(e.arg)}}` : `\\sqrt[${e.index}]{${toLatex(e.arg)}}`
    case 'fn':
      return FN_LATEX[e.name] + printArg(e.arg)
    case 'log':
      return `\\log_{${toLatex(e.base)}}` + printArg(e.arg)
  }
}

export function equationToLatex(equation: Equation): string {
  return `${toLatex(equation.lhs)} = ${toLatex(equation.rhs)}`
}

function printNum(e: Extract<Expr, { kind: 'num' }>): string {
  const v = e.value
  if (e.decimal) {
    const text = toDecimalString(v)
    // {,} verhindert, dass KaTeX nach dem Komma einen Abstand setzt
    if (text !== null) return text.replace(',', '{,}')
  }
  if (isInteger(v)) return v.n.toString()
  const sign = ratSign(v) < 0 ? '-' : ''
  const abs = ratAbs(v)
  return `${sign}\\frac{${abs.n}}{${abs.d}}`
}

// Große Klammern nur, wenn ein Bruch darin steht
function paren(latex: string): string {
  return latex.includes('\\frac') ? `\\left(${latex}\\right)` : `(${latex})`
}

// Beginnt der Term mit einem Minus?
function isNegative(e: Expr): boolean {
  switch (e.kind) {
    case 'num':
      return ratSign(e.value) < 0
    case 'neg':
      return true
    case 'mul':
      return e.factors.length > 0 && e.factors[0].kind === 'num' && ratSign(e.factors[0].value) < 0
    default:
      return false
  }
}

// Der Term ohne sein führendes Minus (nur für Terme, bei denen isNegative gilt)
function withoutMinus(e: Expr): Expr {
  switch (e.kind) {
    case 'num':
      return { ...e, value: ratAbs(e.value) }
    case 'neg':
      return e.arg
    case 'mul': {
      const [first, ...rest] = e.factors
      const abs = ratAbs((first as Extract<Expr, { kind: 'num' }>).value)
      if (abs.n === 1n && abs.d === 1n) return rest.length === 1 ? rest[0] : { kind: 'mul', factors: rest }
      return { kind: 'mul', factors: [{ ...first, value: abs } as Expr, ...rest] }
    }
    default:
      return e
  }
}

function printSum(terms: readonly Expr[]): string {
  return terms
    .map((term, i) => {
      if (isNegative(term)) {
        const abs = printSummand(withoutMinus(term))
        return i === 0 ? `-${abs}` : ` - ${abs}`
      }
      const text = printSummand(term)
      return i === 0 ? text : ` + ${text}`
    })
    .join('')
}

function printSummand(term: Expr): string {
  return term.kind === 'add' || isNegative(term) ? paren(toLatex(term)) : toLatex(term)
}

function printProduct(rawFactors: readonly Expr[]): string {
  // Verschachtelte Produkte sehen genauso aus wie ein flaches Produkt
  const factors = rawFactors.flatMap((f) => (f.kind === 'mul' && !f.explicit && !isNegative(f) ? f.factors : [f]))
  const [first, ...rest] = factors

  if (first.kind === 'num' && ratSign(first.value) < 0) {
    const abs = ratAbs(first.value)
    const isMinusOne = abs.n === 1n && abs.d === 1n
    if (isMinusOne && rest.length > 0) return '-' + printProduct(rest)
    return '-' + printProduct([{ ...first, value: abs }, ...rest])
  }

  const parts = factors.map((f, i) => printFactor(f, i))
  let out = parts[0]
  for (let i = 1; i < factors.length; i++) {
    if (needsDot(factors[i - 1], factors[i], parts[i])) out += ' \\cdot '
    else if (/\\[a-zA-Z]+$/.test(out) && /^[a-zA-Z]/.test(parts[i])) out += ' '
    out += parts[i]
  }
  return out
}

// Eingesetzte Formel: Faktoren als Einheit, überall Malpunkt (2x \cdot e^{x})
function printExplicitProduct(factors: readonly Expr[]): string {
  return factors
    .map((f, i) => {
      if (f.kind === 'add' || f.kind === 'neg' || (i > 0 && isNegative(f))) return paren(toLatex(f))
      return toLatex(f)
    })
    .join(' \\cdot ')
}

function printFactor(f: Expr, index: number): string {
  if (f.kind === 'add' || f.kind === 'neg') return paren(toLatex(f))
  if (index > 0 && isNegative(f)) return paren(toLatex(f))
  return toLatex(f)
}

// Malpunkt, wo Nebeneinanderschreiben missverständlich wäre:
// vor Zahlen (2 · 3, x · 2), vor Brüchen (2 · 1/x wäre sonst „2 1/x"),
// vor negativen Faktoren und nach Funktionen ohne Klammer (\sin x \cdot \cos x).
function needsDot(left: Expr, right: Expr, rightLatex: string): boolean {
  if (/^[\d-]/.test(rightLatex) || isNegative(right)) return true
  if (right.kind === 'div') return true
  return endsWithBareArgument(left)
}

function endsWithBareArgument(e: Expr): boolean {
  switch (e.kind) {
    case 'fn':
    case 'log':
      return isBareArgument(e.arg)
    case 'pow':
      return e.base.kind === 'fn' && POWER_ON_NAME.has(e.base.name) && isPositiveIntegerLiteral(e.exp)
        ? isBareArgument(e.base.arg)
        : false
    default:
      return false
  }
}

// Funktionsargumente ohne Klammer: \sin x, \ln 2, \cos \pi
function isBareArgument(arg: Expr): boolean {
  if (arg.kind === 'var' || arg.kind === 'const') return true
  return arg.kind === 'num' && !arg.decimal && isInteger(arg.value) && ratSign(arg.value) >= 0
}

function printArg(arg: Expr): string {
  return isBareArgument(arg) ? ` ${toLatex(arg)}` : paren(toLatex(arg))
}

function isPositiveIntegerLiteral(e: Expr): boolean {
  return e.kind === 'num' && isInteger(e.value) && ratSign(e.value) > 0
}

function printPow(base: Expr, exponent: Expr): string {
  const exp = toLatex(exponent)
  if (base.kind === 'fn' && POWER_ON_NAME.has(base.name) && isPositiveIntegerLiteral(exponent)) {
    return `${FN_LATEX[base.name]}^{${exp}}${printArg(base.arg)}`
  }
  const simpleBase =
    base.kind === 'var' ||
    base.kind === 'const' ||
    (base.kind === 'num' && !base.decimal && isInteger(base.value) && ratSign(base.value) >= 0)
  const b = toLatex(base)
  return `${simpleBase ? b : paren(b)}^{${exp}}`
}
