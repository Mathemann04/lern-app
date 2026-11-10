import { contains, key } from '../expr/compare.ts'
import { type Expr, asRational, div, mul, neg, num, pow, sqrt, variable } from '../expr/types.ts'
import { reduceFrac, factoredPoly } from '../fraction/factor.ts'
import { type Frac, fracAdd, fracDiv, fracMul, fracNeg, fracOf } from '../fraction/frac.ts'
import {
  type Monomial,
  type Poly,
  type Term,
  constValue,
  isZeroPoly,
  monomial,
  monomialContent,
  polyAtom,
  polyConst,
  polyContent,
  polyDivideExact,
  polyMul,
  polyPow,
  polyScale,
  polySum,
} from '../fraction/poly.ts'
import { type Rational, isInteger, isOne, rat, ratAbs, ratDiv, ratNeg, ratSign } from '../rational.ts'

// Rechnen mit Gleichungsseiten als Brüche aus Polynomen (exakt, beliebig viele Buchstaben).
//
// Atome: Buchstaben heißen wie gedruckt (a, b, x, y). Teile ohne die gesuchte Variable, mit denen
// nur als Ganzes gerechnet wird (z. B. √(b² − y²)), bekommen Namen ~0, ~1, … Kommt die Wurzel der
// gesuchten Variable vor (√x), ist sie das Atom ~u mit x = (~u)²; so wird aus √x und x eine
// Gleichung in einer Unbekannten.

export const ROOT_ATOM = '~u'

export type Atoms = {
  readonly target: string
  // √target als Unbekannte (target = ROOT_ATOM²)
  readonly rootUnknown: boolean
  // Name → Teil, Schlüssel des Teils → Name
  readonly opaque: Map<string, Expr>
  readonly names: Map<string, string>
  // Wurzel mit der gesuchten Variable, mit der gerechnet wird wie mit einem Buchstaben, ihr Quadrat
  // ist der Term darunter: (y − √(x − a))² = y² − 2y√(x − a) + x − a
  readonly radical?: { readonly key: string; readonly square: Poly }
  // Baustein mit der gesuchten Variable wie e^x, 2^x oder ln x, der als Unbekannte gilt (die Variable
  // kommt nur in ihm vor): \frac{ae^x + b}{e^x - c} = y wird nach e^x aufgelöst
  readonly block?: { readonly key: string }
}

export const RADICAL_ATOM = '~r'
export const BLOCK_ATOM = '~b'

// Atome mit einem Baustein wie e^x als Unbekannter
export function blockAtoms(target: string, block: Expr): Atoms {
  const atoms: Atoms = { ...newAtoms(target), block: { key: key(block) } }
  atoms.opaque.set(BLOCK_ATOM, block)
  atoms.names.set(key(block), BLOCK_ATOM)
  return atoms
}

export const newAtoms = (target: string, rootUnknown = false): Atoms => ({ target, rootUnknown, opaque: new Map(), names: new Map() })

// Atome mit einer Wurzel wie √(x − a) als eigenem Zeichen; null, wenn unter der Wurzel kein Polynom steht
export function radicalAtoms(target: string, r: Expr): Atoms | null {
  if (r.kind !== 'root' || r.index !== 2) return null
  const square = toPoly(r.arg, newAtoms(target))
  if (!square) return null
  const atoms: Atoms = { ...newAtoms(target), radical: { key: key(r), square } }
  atoms.opaque.set(RADICAL_ATOM, r)
  atoms.names.set(key(r), RADICAL_ATOM)
  return atoms
}

// Potenzen der Wurzel ab 2 durch den Term darunter ersetzen
function reduceRadical(p: Poly, atoms: Atoms): Poly {
  const radical = atoms.radical
  if (!radical || !p.some((t) => t.mono.some(([a, k]) => a === RADICAL_ATOM && k >= 2))) return p
  return polySum(
    p.map((t) => {
      const k = t.mono.find(([a]) => a === RADICAL_ATOM)?.[1] ?? 0
      if (k < 2) return [t]
      const mono = t.mono.filter(([a]) => a !== RADICAL_ATOM).concat(k % 2 === 1 ? [[RADICAL_ATOM, 1] as const] : [])
      return polyMul([{ mono: monomial(mono), coef: t.coef }], polyPow(radical.square, Math.floor(k / 2)))
    }),
  )
}

const reduceFracRadical = (f: Frac, atoms: Atoms): Frac => (atoms.radical ? { num: reduceRadical(f.num, atoms), den: reduceRadical(f.den, atoms) } : f)

function opaqueAtom(e: Expr, atoms: Atoms): Frac {
  const k = key(e)
  let name = atoms.names.get(k)
  if (!name) {
    name = `~${atoms.opaque.size}`
    atoms.names.set(k, name)
    atoms.opaque.set(name, e)
  }
  return fracOf(polyAtom(name))
}

const isTargetRoot = (e: Expr, atoms: Atoms) => e.kind === 'root' && e.index === 2 && e.arg.kind === 'var' && e.arg.name === atoms.target

function power(base: Frac, k: number): Frac | null {
  if (k < 0 && isZeroPoly(base.num)) return null
  const up = { num: polyPow(base.num, Math.abs(k)), den: polyPow(base.den, Math.abs(k)) }
  return k >= 0 ? up : { num: up.den, den: up.num }
}

// Wert eines Terms als Bruch aus Polynomen; null, wenn die gesuchte Variable in einem Teil steckt,
// mit dem sich nicht rechnen lässt (z. B. √(x + a)), oder wenn durch 0 geteilt wird
export function toRat(e: Expr, atoms: Atoms): Frac | null {
  if (atoms.block && (e.kind === 'pow' || e.kind === 'fn' || e.kind === 'log') && key(e) === atoms.block.key) return fracOf(polyAtom(BLOCK_ATOM))
  switch (e.kind) {
    case 'num':
      return fracOf(polyConst(e.value))
    case 'var':
      // mit einem Baustein als Unbekannter darf die Variable nicht außerhalb vorkommen
      if (atoms.block && e.name === atoms.target) return null
      return e.name === atoms.target && atoms.rootUnknown ? fracOf(polyAtom(ROOT_ATOM, 2)) : fracOf(polyAtom(e.name))
    case 'add': {
      let sum = fracOf(polyConst(0))
      for (const t of e.terms) {
        const f = toRat(t, atoms)
        if (!f) return null
        sum = fracAdd(sum, f)
      }
      return sum
    }
    case 'mul': {
      let product = fracOf(polyConst(1))
      for (const factor of e.factors) {
        const f = toRat(factor, atoms)
        if (!f) return null
        product = fracMul(product, f)
      }
      return reduceFracRadical(product, atoms)
    }
    case 'neg': {
      const f = toRat(e.arg, atoms)
      return f && fracNeg(f)
    }
    case 'div': {
      const a = toRat(e.num, atoms)
      const b = toRat(e.den, atoms)
      return a && b && !isZeroPoly(b.num) ? fracDiv(a, b) : null
    }
    case 'pow': {
      const k = asRational(e.exp)
      if (k && isInteger(k)) {
        const base = toRat(e.base, atoms)
        const p = base && power(base, Number(k.n))
        return p && reduceFracRadical(p, atoms)
      }
      break
    }
    case 'root':
      if (atoms.rootUnknown && isTargetRoot(e, atoms)) return fracOf(polyAtom(ROOT_ATOM))
      if (atoms.radical && key(e) === atoms.radical.key) return fracOf(polyAtom(RADICAL_ATOM))
      break
  }
  return contains(e, atoms.target) ? null : opaqueAtom(e, atoms)
}

// Polynom eines Terms (Nenner 1 nach dem Kürzen); sonst null
export function toPoly(e: Expr, atoms: Atoms): Poly | null {
  const f = toRat(e, atoms)
  return f && polyDivideExact(f.num, f.den)
}

// --- Schreibweise ---

const isLetterAtom = (atom: string) => !atom.startsWith('~')

// Faktoren eines Monoms in gewohnter Reihenfolge: Buchstaben alphabetisch (die gesuchte Variable
// eingereiht), dann √x, dann Teile wie √(b² − y²)
function monoFactors(m: Monomial, atoms: Atoms): Expr[] {
  const letters: Array<[string, number]> = []
  let rootPart = false
  const others: Array<[string, number]> = []
  for (const [atom, k] of m) {
    if (atom === ROOT_ATOM) {
      if (k >= 2) letters.push([atoms.target, Math.floor(k / 2)])
      rootPart = k % 2 === 1
    } else if (isLetterAtom(atom)) letters.push([atom, k])
    else others.push([atom, k])
  }
  letters.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  others.sort(([a], [b]) => (a < b ? -1 : 1))
  // (e^y)^2 als e^{2y}, (p^{8y})^2 als p^{16y}
  const asPower = (base: Expr, k: number) => (k === 1 ? base : isVariablePower(base) ? pow(base.base, timesNumber(k, base.exp)) : pow(base, num(k)))
  return [
    ...letters.map(([name, k]) => asPower(variable(name), k)),
    ...(rootPart ? [sqrt(variable(atoms.target))] : []),
    ...others.map(([name, k]) => asPower(atoms.opaque.get(name)!, k)),
  ]
}

// Potenz mit einer Hochzahl, die keine Zahl ist (e^y, 10^{2y})
const isVariablePower = (e: Expr): e is Extract<Expr, { kind: 'pow' }> => e.kind === 'pow' && asRational(e.exp) === null

// k · Hochzahl: 2 · y → 2y, 2 · 3y → 6y, 2 · (y + 1) → 2(y + 1)
function timesNumber(k: number, e: Expr): Expr {
  if (e.kind === 'neg') return neg(timesNumber(k, e.arg))
  if (e.kind === 'num') return num(e.value.n * BigInt(k), e.value.d)
  if (e.kind === 'mul' && e.factors[0].kind === 'num') return mul(num(e.factors[0].value.n * BigInt(k), e.factors[0].value.d), ...e.factors.slice(1))
  return mul(num(k), e)
}

// c · Monom, Minus außen; Bruch als Vorzahl über den Term: \frac{x}{2}
function termExpr(coef: Rational, m: Monomial, atoms: Atoms): Expr {
  if (ratSign(coef) < 0) return neg(termExpr(ratNeg(coef), m, atoms))
  const factors = monoFactors(m, atoms)
  if (factors.length === 0) return num(coef)
  if (isOne(coef)) return mul(...factors)
  if (!isInteger(coef)) {
    const top = coef.n === 1n ? mul(...factors) : mul(num(coef.n), ...factors)
    return div(top, num(coef.d))
  }
  return mul(num(coef), ...factors)
}

const startsNegative = (p: Poly) => p.length > 0 && ratSign(p[0].coef) < 0

// Summanden-Reihenfolge wie geschrieben: möglichst mit Plus beginnen, die Summanden mit Plus in ihrer
// Reihenfolge vorn (3 − x statt −x + 3, y + b − am statt −am + y + b)
function orderedTerms(p: Poly): Term[] {
  if (!startsNegative(p)) return [...p]
  return [...p.filter((t) => ratSign(t.coef) > 0), ...p.filter((t) => ratSign(t.coef) < 0)]
}

export function polyToExpr(p: Poly, atoms: Atoms): Expr {
  if (p.length === 0) return num(0)
  const terms = orderedTerms(p).map((t) => termExpr(t.coef, t.mono, atoms))
  return terms.length === 1 ? terms[0] : { kind: 'add', terms }
}

// Polynom mit ausgeklammertem gemeinsamem Faktor, wenn er einen Buchstaben enthält:
// ay² + a → a(y² + 1), 2by + 2b → 2b(y + 1); sonst ausmultipliziert (3y + 1)
const TRIG_NAMES: ReadonlySet<string> = new Set(['sin', 'cos', 'tan'])

export function contentExpr(p: Poly, atoms: Atoms): Expr {
  const mono = monomialContent(p)
  if (p.length < 2 || mono.length === 0) return polyToExpr(p, atoms)
  // Vorzahl positiv, die Klammer beginnt möglichst mit Plus: a(1 − b) statt −a(b − 1)
  const c = ratAbs(polyContent(p))
  const rest = polyScale(polyDivideExact(p, [{ mono, coef: rat(1) }])!, ratDiv(rat(1), c))
  // steht vor der Klammer allein der Kosinus (Sinus, Tangens) eines Winkels als Buchstabe, kommt er dahinter:
  // (k^2 + m^2)\cos y statt \cos y \cdot (k^2 + m^2) (Teil 8b; ältere Aufgaben wie 5\ln a \cdot (1 - g) bleiben)
  const angle = isOne(c) && mono.every(([atom]) => {
    const f = atoms.opaque.get(atom)
    return f?.kind === 'fn' && TRIG_NAMES.has(f.name) && f.arg.kind === 'var'
  })
  const product = (r: Poly) => (angle ? mul(polyToExpr(r, atoms), termExpr(c, mono, atoms)) : mul(termExpr(c, mono, atoms), polyToExpr(r, atoms)))
  if (rest.every((t) => ratSign(t.coef) < 0)) return neg(product(polyScale(rest, rat(-1))))
  return product(rest)
}

const negativeCount = (p: Poly) => p.filter((t) => ratSign(t.coef) < 0).length

// Vorzeichen für Zähler und Nenner: möglichst wenige Minus, bei Gleichstand im Nenner weniger,
// sonst Nenner mit Plus vorn: \frac{ab + cd}{c - a} statt \frac{-ab - cd}{a - c}
function chooseSign(n: Poly, d: Poly): 1 | -1 {
  const keep = [negativeCount(n) + negativeCount(d), negativeCount(d), startsNegative(d) ? 1 : 0]
  const flip = [n.length - negativeCount(n) + d.length - negativeCount(d), d.length - negativeCount(d), startsNegative(d) ? 0 : 1]
  for (let i = 0; i < keep.length; i++) if (keep[i] !== flip[i]) return flip[i] < keep[i] ? -1 : 1
  return 1
}

// Gekürzter Bruch in Endform: ein Bruch, Zähler und Nenner ausmultipliziert mit ausgeklammertem
// Buchstaben-Faktor, Minus vor dem Bruch nur, wenn der Zähler ganz negativ ist
export function niceFrac(f: Frac, atoms: Atoms, hints: readonly Poly[] = []): Expr {
  const r = reduceFrac(f, hints)
  let n = r.num
  let d = factoredPoly(r.den)
  // Zahl im Nenner immer positiv (nie \frac{…}{-1}), sonst möglichst wenige Minus
  const den = constValue(d)
  if (den ? ratSign(den) < 0 : chooseSign(n, d) < 0) {
    n = polyScale(n, rat(-1))
    d = polyScale(d, rat(-1))
  }
  const dConst = constValue(d)
  if (dConst && isOne(dConst)) return contentExpr(n, atoms)
  if (n.length > 0 && negativeCount(n) === n.length) {
    return neg(dConst ? div(contentExpr(polyScale(n, rat(-1)), atoms), num(dConst)) : div(contentExpr(polyScale(n, rat(-1)), atoms), contentExpr(d, atoms)))
  }
  return div(contentExpr(n, atoms), contentExpr(d, atoms))
}

// Quadratwurzel eines Polynoms, wenn es ein Quadrat eines Monoms ist (4a²y⁴ → 2ay²); sonst null
export function monomialSqrt(p: Poly): Poly | null {
  if (p.length !== 1) return null
  const [{ mono, coef }] = p
  if (ratSign(coef) <= 0 || mono.some(([, k]) => k % 2 !== 0)) return null
  const rootOf = (n: bigint) => {
    const r = BigInt(Math.round(Math.sqrt(Number(n))))
    return r * r === n ? r : null
  }
  const rn = rootOf(coef.n)
  const rd = rootOf(coef.d)
  if (rn === null || rd === null) return null
  return [{ mono: mono.map(([a, k]) => [a, k / 2] as const), coef: rat(rn, rd) }]
}
