import type { Expr } from './types.ts'

// Ersetzt jede Variable `name` durch `replacement`, z. B. u → 3x in \cos u
export function substitute(e: Expr, name: string, replacement: Expr): Expr {
  const s = (child: Expr) => substitute(child, name, replacement)
  switch (e.kind) {
    case 'num':
    case 'const':
      return e
    case 'var':
      return e.name === name ? replacement : e
    case 'add':
      return { ...e, terms: e.terms.map(s) }
    case 'mul':
      return { ...e, factors: e.factors.map(s) }
    case 'neg':
    case 'root':
    case 'fn':
      return { ...e, arg: s(e.arg) }
    case 'div':
      return { ...e, num: s(e.num), den: s(e.den) }
    case 'pow':
      return { ...e, base: s(e.base), exp: s(e.exp) }
    case 'log':
      return { ...e, base: s(e.base), arg: s(e.arg) }
  }
}
