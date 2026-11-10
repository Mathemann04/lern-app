import { type Rational, ratCmp, ratMul, ratNeg, ratSign, ratToNumber, rat } from '../rational.ts'

// Zahlen in deutscher Schreibweise (docs/CHEMIE.md §3 und §7): exakt gerundet auf gültige Ziffern,
// Dezimalkomma, Zehnerpotenzen als „· 10ⁿ", keine Nullen am Ende. Allgemein (Chemie, später
// Werkstoffkunde und Physik). Der Leser für Eingaben kommt mit dem freien Modus (S8).

export type Rounded = {
  // gerundeter Wert, exakt
  readonly value: Rational
  // Ziffern ohne Komma (z. B. 398 für 3,98 · 10⁻¹⁹) und Zehnerexponent der ersten Ziffer (−19)
  readonly digits: bigint
  readonly exponent: number
}

const pow10 = (k: number): Rational => (k >= 0 ? rat(10n ** BigInt(k)) : rat(1n, 10n ** BigInt(-k)))

// Zehnerexponent der ersten gültigen Ziffer: 10^e ≤ |r| < 10^(e+1)
function exponentOf(r: Rational): number {
  let e = Math.floor(Math.log10(Math.abs(ratToNumber(r))))
  while (ratCmp(r, pow10(e)) < 0) e--
  while (ratCmp(r, pow10(e + 1)) >= 0) e++
  return e
}

// Auf gültige Ziffern runden (kaufmännisch, exakt); r ≠ 0
export function roundSignificant(r: Rational, significant = 3): Rounded {
  if (ratSign(r) === 0) return { value: r, digits: 0n, exponent: 0 }
  const negative = ratSign(r) < 0
  const abs = negative ? ratNeg(r) : r
  let exponent = exponentOf(abs)
  const scaled = ratMul(abs, pow10(significant - 1 - exponent))
  let digits = (2n * scaled.n + scaled.d) / (2n * scaled.d)
  if (digits === 10n ** BigInt(significant)) {
    digits /= 10n
    exponent++
  }
  // Nullen am Ende weglassen
  let shown = significant
  while (shown > 1 && digits % 10n === 0n) {
    digits /= 10n
    shown--
  }
  const value = ratMul(rat(negative ? -digits : digits), pow10(exponent - shown + 1))
  return { value, digits: negative ? -digits : digits, exponent }
}

// Ziffern mit Komma nach der ersten Ziffer bzw. als Dezimalzahl
function plain(digits: bigint, exponent: number, comma: string): string {
  const negative = digits < 0n
  const text = (negative ? -digits : digits).toString()
  const point = exponent + 1
  let result: string
  if (point <= 0) result = `0${comma}${'0'.repeat(-point)}${text}`
  else if (point >= text.length) result = text + '0'.repeat(point - text.length)
  else result = `${text.slice(0, point)}${comma}${text.slice(point)}`
  return (negative ? '-' : '') + result
}

export type FormatOptions = {
  readonly significant?: number
  // Zehnerpotenz immer (true), nie (false) oder ab 10⁴ und unter 10⁻² (Standard)
  readonly scientific?: boolean
}

// LaTeX, z. B. „3{,}98 \cdot 10^{-19}" oder „589"
export function formatLatex(r: Rational, options: FormatOptions = {}): string {
  return format(r, options, '{,}', (m, e) => `${m} \\cdot 10^{${e}}`)
}

// Text mit Unicode-Hochzahlen, z. B. „3,98 · 10⁻¹⁹" (für Vorlesehilfen und Tests)
export function formatText(r: Rational, options: FormatOptions = {}): string {
  const sup: Readonly<Record<string, string>> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
  return format(r, options, ',', (m, e) => `${m} · 10${[...String(e)].map((c) => sup[c]).join('')}`)
}

function format(r: Rational, { significant = 3, scientific }: FormatOptions, comma: string, power: (mantissa: string, exponent: number) => string): string {
  if (ratSign(r) === 0) return '0'
  const { digits, exponent } = roundSignificant(r, significant)
  const useScientific = scientific ?? (exponent >= 4 || exponent < -2)
  if (!useScientific) return plain(digits, exponent, comma)
  const mantissa = plain(digits, 0, comma)
  return exponent === 0 ? mantissa : power(mantissa, exponent)
}
