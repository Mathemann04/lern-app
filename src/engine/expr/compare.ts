import type { Expr } from './types.ts'

// Eindeutiger Schlüssel eines Terms: gleicher Baum ⇔ gleicher Schlüssel.
// Die Schreibweise einer Zahl (Bruch oder Dezimalkomma) zählt nicht.
// Dient zum Vergleichen, Gruppieren und für eine feste Sortierreihenfolge.
export function key(e: Expr): string {
  switch (e.kind) {
    case 'num':
      return e.value.d === 1n ? `${e.value.n}` : `${e.value.n}/${e.value.d}`
    case 'const':
      return `#${e.name}`
    case 'var':
      return e.name
    case 'add':
      return `+(${e.terms.map(key).join(',')})`
    case 'mul':
      return `*(${e.factors.map(key).join(',')})`
    case 'neg':
      return `-(${key(e.arg)})`
    case 'div':
      return `/(${key(e.num)},${key(e.den)})`
    case 'pow':
      return `^(${key(e.base)},${key(e.exp)})`
    case 'root':
      return `root${e.index}(${key(e.arg)})`
    case 'fn':
      return `${e.name}(${key(e.arg)})`
    case 'log':
      return `log(${key(e.base)},${key(e.arg)})`
  }
}

export const equals = (a: Expr, b: Expr) => key(a) === key(b)

export function compareExpr(a: Expr, b: Expr): number {
  const ka = key(a)
  const kb = key(b)
  return ka < kb ? -1 : ka > kb ? 1 : 0
}

// Kommt die Variable im Term vor?
export function contains(e: Expr, name: string): boolean {
  switch (e.kind) {
    case 'num':
    case 'const':
      return false
    case 'var':
      return e.name === name
    case 'add':
      return e.terms.some((t) => contains(t, name))
    case 'mul':
      return e.factors.some((f) => contains(f, name))
    case 'neg':
    case 'root':
    case 'fn':
      return contains(e.arg, name)
    case 'div':
      return contains(e.num, name) || contains(e.den, name)
    case 'pow':
      return contains(e.base, name) || contains(e.exp, name)
    case 'log':
      return contains(e.base, name) || contains(e.arg, name)
  }
}
