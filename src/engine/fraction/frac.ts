import { E as EULER, IMAG, asRational, type Expr, add, div, exp, fn, ln, mul, neg, num, pow, sin, cos, sqrt, variable, x } from '../expr/types.ts'
import { type Rational, isInteger, isOne, rat, ratNeg, ratSign } from '../rational.ts'
import {
  type Monomial,
  type Poly,
  atomsOf,
  isZeroPoly,
  leadingCoef,
  polyAdd,
  polyAtom,
  polyConst,
  polyMul,
  polyNeg,
  polyPow,
  polyScale,
  polySub,
  polySubstitute,
  polySum,
} from './poly.ts'

// Brüche aus zwei Polynomen (Zähler, Nenner) und die Übersetzung zwischen Termbaum und Polynom.
//
// Atome: Buchstaben (alle Kleinbuchstaben außer e und i) und Bausteine, mit denen man rechnet wie mit einem Buchstaben:
// E = e^x (E² = e^{2x}), L = ln x, S = sin x, C = cos x, R = √x. Dazu e, die Eulersche Zahl, für
// falsche Ergebnisse wie e^2.
//
// Bausteine mit eigenen Regeln (Stufe 5):
// - R = √x mit R² = x: In Aufgaben mit Wurzel wird nur mit R gerechnet (x als R², rootForm).
//   Ebenso √a (Ra) und √(x + h) (Rx+h, mit h = (√(x + h))² − x), siehe „Wurzeln“ unten.
// - S² + C² = 1: Beim Vergleichen wird C² durch 1 − S² ersetzt, bis höchstens C¹ übrig bleibt
//   (trigRewrite, isZeroValue).
// - tan x = S / C
// - Hyperbelfunktionen SH = sinh x, CH = cosh x mit CH² − SH² = 1 (trigRewrite); tanh x = SH / CH.
//   Beim Vergleichen werden sie durch e^x ausgedrückt (hyperbolicToExp), so ist auch
//   cosh x + sinh x = e^x gleichwertig.
// - i, die imaginäre Einheit, mit i² = −1 (komplexe Zahlen, siehe complex.ts)

export type Frac = { readonly num: Poly; readonly den: Poly }

// alle Kleinbuchstaben außer e (Eulersche Zahl) und i (imaginäre Einheit)
const LETTERS = new Set([...'abcdfghjklmnopqrstuvwxyz'])

// --- Rechnen ---

export const fracOf = (p: Poly): Frac => ({ num: p, den: polyConst(1) })

export const fracAdd = (a: Frac, b: Frac): Frac => ({
  num: polyAdd(polyMul(a.num, b.den), polyMul(b.num, a.den)),
  den: polyMul(a.den, b.den),
})

export const fracNeg = (a: Frac): Frac => ({ num: polyNeg(a.num), den: a.den })

export const fracSub = (a: Frac, b: Frac): Frac => fracAdd(a, fracNeg(b))

export const fracMul = (a: Frac, b: Frac): Frac => ({ num: polyMul(a.num, b.num), den: polyMul(a.den, b.den) })

export function fracDiv(a: Frac, b: Frac): Frac {
  if (isZeroPoly(b.num)) throw new RangeError('Teilen durch null')
  return { num: polyMul(a.num, b.den), den: polyMul(a.den, b.num) }
}

// --- Wurzeln ---

// Wurzeln als Bausteine: R = √x, Ra = √a (je Buchstabe), Rx+h = √(x + h) (beim
// Differenzenquotienten). Gerechnet wird mit der Wurzel: Der Buchstabe darunter wird zu ihrem
// Quadrat (x = R², a = Ra²), bei √(x + h) wird h zu (√(x + h))² − x.
export const isRootAtom = (atom: string) => atom === 'R' || /^R[a-z]/.test(atom)
export const rootOf = (letter: string) => (letter === 'x' ? 'R' : `R${letter}`)
export const sumRootOf = (letter: string) => `R${letter}+h`
export const isSumRoot = (atom: string) => isRootAtom(atom) && atom.includes('+')

// Buchstaben unter der Wurzel: R → [x], Ra → [a], Rx+h → [x, h]
export const radicandLetters = (atom: string): string[] => (atom === 'R' ? ['x'] : atom.slice(1).split('+'))

export const rootAtomsOf = (p: Poly) => atomsOf(p).filter(isRootAtom)

// Buchstaben unter den Wurzeln durch die Wurzeln ausdrücken (erst h bei √(x + h), dann x = (√x)²)
export function rootFormWith(p: Poly, roots: readonly string[]): Poly {
  let q = p
  for (const r of roots.filter(isSumRoot)) {
    const [u, v] = radicandLetters(r)
    q = polySubstitute(q, v, polySub(polyAtom(r, 2), polyAtom(u)))
  }
  for (const r of roots.filter((a) => !isSumRoot(a))) q = polySubstitute(q, radicandLetters(r)[0], polyAtom(r, 2))
  return q
}

// Mit den Wurzeln, die vorkommen, umgeschrieben; ohne Wurzel unverändert
export function rootPoly(p: Poly): Poly {
  const roots = rootAtomsOf(p)
  return roots.length > 0 ? rootFormWith(p, roots) : p
}

// Ein Bruch mit den Wurzeln einer Aufgabe umgeschrieben (Eingabe im freien Modus)
export const rootForm = (f: Frac, roots: readonly string[] = ['R']): Frac => ({ num: rootFormWith(f.num, roots), den: rootFormWith(f.den, roots) })

// Zum Schreiben: (√(x + h))² als x + h, zusammengefasst; so wird (√(x + h))² − x wieder zu h
function displayRoots(p: Poly): Poly {
  const sums = atomsOf(p).filter((a) => isSumRoot(a) && p.some((t) => (t.mono.find(([b]) => b === a)?.[1] ?? 0) >= 2))
  let q = p
  for (const r of sums) {
    const [u, v] = radicandLetters(r)
    const radicand = polyAdd(polyAtom(rootOf(u), 2), polyAtom(v))
    q = polySum(
      q.map((t) => {
        const k = t.mono.find(([a]) => a === r)?.[1] ?? 0
        if (k < 2) return [t]
        const rest = { mono: [...t.mono.filter(([a]) => a !== r), ...(k % 2 === 1 ? [[r, 1] as const] : [])], coef: t.coef }
        return polyMul([rest], polyPow(radicand, Math.floor(k / 2)))
      }),
    )
  }
  return q
}

// Bausteine mit einer Regel für die Quadrate: sin² x + cos² x = 1 und cosh² x − sinh² x = 1
export type SquareAtom = 'S' | 'C' | 'SH' | 'CH'
export const isHyperbolicAtom = (atom: string) => atom === 'SH' || atom === 'CH'
export const partnerAtom = (atom: SquareAtom): SquareAtom => ({ S: 'C', C: 'S', SH: 'CH', CH: 'SH' } as const)[atom]

// Quadrat eines Bausteins durch den anderen: atom² = unit + sign · other²
export type SquareRule = { readonly unit: number; readonly sign: 1 | -1 }

// Die richtigen Regeln: cos² x = 1 − sin² x, sin² x = 1 − cos² x, cosh² x = 1 + sinh² x,
// sinh² x = cosh² x − 1
export const SQUARE_RULES: Readonly<Record<SquareAtom, SquareRule>> = {
  S: { unit: 1, sign: -1 },
  C: { unit: 1, sign: -1 },
  CH: { unit: 1, sign: 1 },
  SH: { unit: -1, sign: 1 },
}

// Regel anwenden: Potenzen ab 2 des einen Bausteins (atom) ersetzen, z. B. atom C: cos² x → 1 − sin² x,
// cos³ x → cos x (1 − sin² x); atom CH: cosh² x → 1 + sinh² x. Mit rule eine andere (falsche) Regel.
export function trigRewrite(p: Poly, atom: SquareAtom, rule: SquareRule = SQUARE_RULES[atom]): Poly {
  const other = partnerAtom(atom)
  const power = (t: Poly[number]) => t.mono.find(([a]) => a === atom)?.[1] ?? 0
  const square = polyAdd(polyConst(rule.unit), polyScale(polyAtom(other, 2), rat(rule.sign)))
  let result = p
  for (let k = Math.max(0, ...p.map(power)); k >= 2; k--) {
    const high = result.filter((t) => power(t) === k)
    if (high.length === 0) continue
    const lowered = high.map((t) => ({ mono: t.mono.map(([a, e]) => [a, a === atom ? e - 2 : e] as const), coef: t.coef }))
    result = polyAdd(polySub(result, high), polyMul(lowered, square))
  }
  return result
}

// sinh x = (e^{2x} − 1) / (2e^x), cosh x = (e^{2x} + 1) / (2e^x): ein Polynom mit sinh und cosh,
// mal (2e^x)^M genommen (M die höchste Summe der Hochzahlen), als Polynom in e^x. Hat genau dann
// überall den Wert 0, wenn p es hat. Ohne sinh und cosh unverändert.
export function hyperbolicToExp(p: Poly): Poly {
  const hyp = (t: Poly[number]) => t.mono.filter(([a]) => isHyperbolicAtom(a)).reduce((s, [, e]) => s + e, 0)
  const top = Math.max(0, ...p.map(hyp))
  if (top === 0) return p
  const E2 = polyAtom('E', 2)
  return polySum(
    p.map((t) => {
      const rest: Poly = [{ mono: t.mono.filter(([a]) => !isHyperbolicAtom(a)), coef: t.coef }]
      const sinh = polyPow(polyAdd(E2, polyConst(-1)), t.mono.find(([a]) => a === 'SH')?.[1] ?? 0)
      const cosh = polyPow(polyAdd(E2, polyConst(1)), t.mono.find(([a]) => a === 'CH')?.[1] ?? 0)
      const k = hyp(t)
      // (2e^x)^(M − k) für die übrigen Faktoren
      const filler = polyScale(polyAtom('E', top - k), rat(2 ** (top - k)))
      return polyMul(polyMul(rest, polyMul(sinh, cosh)), top === k ? polyConst(1) : filler)
    }),
  )
}

// --- Komplexe Zahlen ---

// i als eigenes Zeichen; i² = −1 wendet reduceImag an (i³ = −i, i⁴ = 1)
export const IMAG_ATOM = 'i'
const imagPowerOf = (t: Poly[number]) => t.mono.find(([a]) => a === IMAG_ATOM)?.[1] ?? 0
export const isImagTerm = (t: Poly[number]) => imagPowerOf(t) > 0

export function reduceImag(p: Poly): Poly {
  if (!p.some((t) => imagPowerOf(t) >= 2)) return p
  return polySum(
    p.map((t) => {
      const k = imagPowerOf(t)
      if (k < 2) return [t]
      const mono = [...t.mono.filter(([a]) => a !== IMAG_ATOM), ...(k % 2 === 1 ? [[IMAG_ATOM, 1] as const] : [])]
      return [{ mono, coef: Math.floor(k / 2) % 2 === 1 ? ratNeg(t.coef) : t.coef }]
    }),
  )
}

// Hat ein Polynom überall den Wert 0 (auch mit den Regeln der Bausteine)? Mit cos² x → 1 − sin² x
// und i² = −1 bleibt eine eindeutige Form übrig: genau dann 0, wenn das Polynom auf dem
// Einheitskreis 0 ist (Real- und Imaginärteil je 0).
export const isZeroValue = (p: Poly) => isZeroPoly(trigRewrite(reduceImag(rootPoly(hyperbolicToExp(p))), 'C'))

// Gleichwertig: Überkreuz-Malnehmen ergibt dasselbe Polynom (exakt, ohne Zahlenstellen), mit den
// Regeln der Bausteine: (√x)² = x und sin² x + cos² x = 1
export const fracEquals = (a: Frac, b: Frac) => isZeroValue(polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)))

export const fracAtoms = (f: Frac) => [...new Set([...atomsOf(f.num), ...atomsOf(f.den)])]

// --- Termbaum → Bruch ---

// Ganzzahliger Wert eines Exponenten, sonst null
function integerExponent(e: Expr): number | null {
  const r = asRational(e)
  return r && isInteger(r) ? Number(r.n) : null
}

// Hochzahl n/2 (z. B. bei x^{1/2}), sonst null
function halfExponent(e: Expr): number | null {
  const r = asRational(e)
  return r && r.d === 2n ? Number(r.n) : null
}

// Faktor k im Exponenten von e^{kx}: x → 1, 2x → 2, −x → −1; sonst null
function linearInX(e: Expr): number | null {
  if (e.kind === 'var') return e.name === 'x' ? 1 : null
  if (e.kind === 'neg') {
    const k = linearInX(e.arg)
    return k === null ? null : -k
  }
  if (e.kind === 'mul' && e.factors.length === 2 && e.factors[1].kind === 'var' && e.factors[1].name === 'x') {
    return integerExponent(e.factors[0])
  }
  return null
}

function power(base: Frac, k: number): Frac {
  const up = { num: polyPow(base.num, Math.abs(k)), den: polyPow(base.den, Math.abs(k)) }
  return k >= 0 ? up : { num: up.den, den: up.num }
}

// Wert eines Terms als Bruch aus Polynomen; null, wenn der Term etwas anderes enthält
// (z. B. eine Wurzel oder sin(2x)). Teilen durch null ergibt ebenfalls null.
export function toFrac(e: Expr): Frac | null {
  switch (e.kind) {
    case 'num':
      return fracOf(polyConst(e.value))
    case 'var':
      return LETTERS.has(e.name) ? fracOf(polyAtom(e.name)) : null
    case 'const':
      return e.name === 'e' ? fracOf(polyAtom('e')) : e.name === 'i' ? fracOf(polyAtom(IMAG_ATOM)) : null
    case 'root': {
      if (e.index !== 2) return null
      if (e.arg.kind === 'var' && LETTERS.has(e.arg.name)) return fracOf(polyAtom(rootOf(e.arg.name)))
      // √(x + h)
      const names = e.arg.kind === 'add' && e.arg.terms.every((t) => t.kind === 'var') ? e.arg.terms.map((t) => (t.kind === 'var' ? t.name : '')) : []
      const other = names.find((n) => n !== 'h')
      return names.length === 2 && names.includes('h') && other && LETTERS.has(other) ? fracOf(polyAtom(sumRootOf(other))) : null
    }
    case 'add': {
      let sum = fracOf(polyConst(0))
      for (const t of e.terms) {
        const f = toFrac(t)
        if (!f) return null
        sum = fracAdd(sum, f)
      }
      return sum
    }
    case 'mul': {
      let product = fracOf(polyConst(1))
      for (const factor of e.factors) {
        const f = toFrac(factor)
        if (!f) return null
        product = fracMul(product, f)
      }
      return product
    }
    case 'neg': {
      const f = toFrac(e.arg)
      return f && fracNeg(f)
    }
    case 'div': {
      const a = toFrac(e.num)
      const b = toFrac(e.den)
      return a && b && !isZeroPoly(b.num) ? fracDiv(a, b) : null
    }
    case 'pow': {
      if (e.base.kind === 'const' && e.base.name === 'e') {
        const k = linearInX(e.exp)
        if (k !== null) return power(fracOf(polyAtom('E')), k)
        // Zahl als Hochzahl: e^2 (Eulersche Zahl)
        const c = integerExponent(e.exp)
        return c === null ? null : power(fracOf(polyAtom('e')), c)
      }
      // x^{1/2} = √x, x^{3/2} = x√x (auch bei anderen Buchstaben)
      const half = e.base.kind === 'var' && LETTERS.has(e.base.name) ? halfExponent(e.exp) : null
      if (half !== null && e.base.kind === 'var') return power(fracOf(polyAtom(rootOf(e.base.name))), half)
      const k = integerExponent(e.exp)
      const base = toFrac(e.base)
      if (k === null || !base || (k < 0 && isZeroPoly(base.num))) return null
      return power(base, k)
    }
    case 'fn': {
      if (e.arg.kind !== 'var' || e.arg.name !== 'x') return null
      if (e.name === 'ln') return fracOf(polyAtom('L'))
      if (e.name === 'sin') return fracOf(polyAtom('S'))
      if (e.name === 'cos') return fracOf(polyAtom('C'))
      if (e.name === 'tan') return { num: polyAtom('S'), den: polyAtom('C') }
      if (e.name === 'sinh') return fracOf(polyAtom('SH'))
      if (e.name === 'cosh') return fracOf(polyAtom('CH'))
      if (e.name === 'tanh') return { num: polyAtom('SH'), den: polyAtom('CH') }
      return null
    }
    default:
      return null
  }
}

// --- Polynom → Termbaum ---

// Potenz eines Atoms als Term: x², e^{2x}, \sin^2 x, (\ln x)^2; bei √x: (√x)² = x, (√x)³ = x√x
export function atomPowerExpr(atom: string, k: number): Expr {
  const base = atomExpr(atom)
  if (k === 1) return base
  if (atom === 'E') return exp(mul(num(k), x))
  if (isRootAtom(atom)) {
    const radicand = radicandExpr(atom)
    const whole = Math.floor(k / 2)
    const plain = whole === 1 ? radicand : pow(radicand, num(whole))
    return k % 2 === 0 ? plain : mul(plain, sqrt(radicand))
  }
  return pow(base, num(k))
}

// Term unter der Wurzel: x, a, x + h
function radicandExpr(atom: string): Expr {
  const letters = radicandLetters(atom).map((l) => variable(l))
  return letters.length === 1 ? letters[0] : add(...letters)
}

function atomExpr(atom: string): Expr {
  if (isRootAtom(atom)) return sqrt(radicandExpr(atom))
  switch (atom) {
    case 'E':
      return exp(x)
    case 'L':
      return ln(x)
    case 'S':
      return sin(x)
    case 'C':
      return cos(x)
    case 'SH':
      return fn('sinh', x)
    case 'CH':
      return fn('cosh', x)
    case 'e':
      return EULER
    case IMAG_ATOM:
      return IMAG
    default:
      return variable(atom)
  }
}

// Reihenfolge beim Schreiben eines Produkts: die Zahl e zuerst, dann Buchstaben alphabetisch
// (ax, 2xy), i hinter den Buchstaben (2b\mathrm{i}), Bausteine in fester Reihenfolge (\sin x \cos x,
// \sinh x \cosh x)
const BLOCK_ORDER = ['E', 'L', 'S', 'C', 'SH', 'CH', 'T', 'R']
export const displayRank = (atom: string) =>
  atom === 'e'
    ? 0
    : atom === IMAG_ATOM
      ? 122.5
    : BLOCK_ORDER.includes(atom)
      ? 100 + BLOCK_ORDER.indexOf(atom)
      : isRootAtom(atom)
        ? 100 + BLOCK_ORDER.indexOf('R') + (isSumRoot(atom) ? -0.5 : 0.5)
        : atom.charCodeAt(0)

export const monoExpr = (m: Monomial): Expr[] =>
  [...m].sort(([a], [b]) => displayRank(a) - displayRank(b)).map(([atom, k]) => atomPowerExpr(atom, k))

// c · Monom, mit Minus außen: −3x² → neg(3x²)
function termExpr(coef: Rational, mono: Monomial): Expr {
  if (ratSign(coef) < 0) return neg(termExpr(ratNeg(coef), mono))
  const factors = monoExpr(mono)
  if (factors.length === 0) return num(coef)
  if (isOne(coef)) return mul(...factors)
  // Bruch als Vorzahl über den Term schreiben: \frac{x}{2} statt \frac{1}{2}x
  if (!isInteger(coef)) {
    const top = coef.n === 1n ? mul(...factors) : mul(num(coef.n), ...factors)
    return div(top, num(coef.d))
  }
  return mul(num(coef), ...factors)
}

// Polynom als Summe; ascending: kleinster Grad zuerst (9 − x² statt −x² + 9). Mit i steht der
// Realteil vor dem Imaginärteil: 3 + 4\mathrm{i}, a - b\mathrm{i}
export function polyExpr(p: Poly, order: 'descending' | 'ascending' = 'descending'): Expr {
  const shown = displayRoots(p)
  if (shown.length === 0) return num(0)
  const ordered = order === 'ascending' ? [...shown].reverse() : shown
  const terms = ordered.some(isImagTerm) ? [...ordered.filter((t) => !isImagTerm(t)), ...ordered.filter(isImagTerm)] : ordered
  return add(...terms.map((t) => termExpr(t.coef, t.mono)))
}

// Hat der erste Summand (in der Schreibweise) ein Minus?
export const startsNegative = (p: Poly) => ratSign(leadingCoef(p)) < 0

export const fracConst = (n: number, d = 1): Frac => fracOf(polyConst(rat(n, d)))

export const fracScale = (f: Frac, c: Rational): Frac => ({ num: polyScale(f.num, c), den: f.den })
