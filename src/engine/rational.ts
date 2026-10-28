// Exakte Brüche aus ganzen Zahlen beliebiger Größe.
// Immer gekürzt, Nenner immer positiv. So entstehen nie Rundungsfehler wie 0,30000000000000004.

export type Rational = { readonly n: bigint; readonly d: bigint }

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

export function rat(n: bigint | number, d: bigint | number = 1n): Rational {
  let num = BigInt(n)
  let den = BigInt(d)
  if (den === 0n) throw new RangeError('Nenner darf nicht 0 sein')
  if (den < 0n) {
    num = -num
    den = -den
  }
  const g = gcd(num, den)
  return g === 1n ? { n: num, d: den } : { n: num / g, d: den / g }
}

export const ZERO = rat(0)
export const ONE = rat(1)
export const MINUS_ONE = rat(-1)

export const ratAdd = (a: Rational, b: Rational) => rat(a.n * b.d + b.n * a.d, a.d * b.d)
export const ratSub = (a: Rational, b: Rational) => rat(a.n * b.d - b.n * a.d, a.d * b.d)
export const ratMul = (a: Rational, b: Rational) => rat(a.n * b.n, a.d * b.d)
export const ratDiv = (a: Rational, b: Rational) => rat(a.n * b.d, a.d * b.n)
export const ratNeg = (a: Rational): Rational => ({ n: -a.n, d: a.d })
export const ratAbs = (a: Rational): Rational => (a.n < 0n ? ratNeg(a) : a)

export const ratSign = (a: Rational): -1 | 0 | 1 => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0)
export const ratEq = (a: Rational, b: Rational) => a.n === b.n && a.d === b.d
export const ratCmp = (a: Rational, b: Rational) => ratSign(ratSub(a, b))
export const isZero = (a: Rational) => a.n === 0n
export const isOne = (a: Rational) => a.n === 1n && a.d === 1n
export const isInteger = (a: Rational) => a.d === 1n

export function ratToNumber(a: Rational): number {
  return Number(a.n) / Number(a.d)
}

// Grenze für exakte Potenzen, damit Zufallsterme die Rechnung nicht sprengen
const MAX_RESULT_BITS = 4096n

function bitLength(x: bigint): bigint {
  return BigInt((x < 0n ? -x : x).toString(2).length)
}

// a^k für ganzzahliges k. null, wenn undefiniert (0 hoch negativ) oder zu groß.
export function ratPowInt(a: Rational, k: bigint): Rational | null {
  if (k === 0n) return ONE
  if (isZero(a)) return k > 0n ? ZERO : null
  const e = k < 0n ? -k : k
  if ((bitLength(a.n) + bitLength(a.d)) * e > MAX_RESULT_BITS) return null
  const p = rat(a.n ** e, a.d ** e)
  return k < 0n ? ratDiv(ONE, p) : p
}

// Ganzzahlige q-te Wurzel, falls exakt; sonst null
function exactRoot(x: bigint, q: bigint): bigint | null {
  if (x < 0n) return null
  if (x < 2n) return x
  const approx = Math.round(Number(x) ** (1 / Number(q)))
  if (!Number.isFinite(approx)) return null
  for (const candidate of [approx - 1, approx, approx + 1]) {
    if (candidate < 0) continue
    const c = BigInt(candidate)
    if (c ** q === x) return c
  }
  return null
}

// a^r exakt, z. B. 4^(1/2) = 2 oder 8^(2/3) = 4. null, wenn das Ergebnis nicht
// rational ist (2^(1/2)) oder undefiniert. Nach deutscher Schulkonvention sind
// gebrochene Potenzen (Wurzeln) negativer Zahlen nicht definiert.
export function ratPow(a: Rational, r: Rational): Rational | null {
  if (isInteger(r)) return ratPowInt(a, r.n)
  if (ratSign(a) < 0) return null
  if (isZero(a)) return ratSign(r) > 0 ? ZERO : null
  const rootN = exactRoot(a.n, r.d)
  const rootD = exactRoot(a.d, r.d)
  if (rootN === null || rootD === null) return null
  return ratPowInt(rat(rootN, rootD), r.n)
}

// Liest eine Dezimalzahl mit Komma oder Punkt exakt ein: „2,5" → 5/2
export function parseDecimal(text: string): Rational | null {
  const match = /^\s*(-?)(\d+)(?:[,.](\d+))?\s*$/.exec(text)
  if (!match) return null
  const [, sign, whole, fraction = ''] = match
  const value = rat(BigInt(whole + fraction), 10n ** BigInt(fraction.length))
  return sign ? ratNeg(value) : value
}

// Dezimalschreibweise mit Komma, falls der Bruch abbricht (Nenner nur aus 2 und 5): 5/2 → „2,5".
// Sonst null (z. B. 1/3).
export function toDecimalString(a: Rational): string | null {
  let rest = a.d
  let twos = 0n
  let fives = 0n
  while (rest % 2n === 0n) {
    rest /= 2n
    twos++
  }
  while (rest % 5n === 0n) {
    rest /= 5n
    fives++
  }
  if (rest !== 1n) return null
  const digits = twos > fives ? twos : fives
  const scaled = (ratAbs(a).n * 10n ** digits) / a.d
  const text = scaled.toString().padStart(Number(digits) + 1, '0')
  const whole = text.slice(0, text.length - Number(digits))
  const fraction = text.slice(text.length - Number(digits))
  return (a.n < 0n ? '-' : '') + whole + (fraction ? ',' + fraction : '')
}
