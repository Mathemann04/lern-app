// Zufällige Terme für Eigenschaftstests (fast-check). Nur in Tests verwendet.
import fc from 'fast-check'
import { type Expr, type FnName, E, PI, add, div, fn, log, mul, neg, num, pow, root, x } from './types.ts'

const smallInt = fc.integer({ min: -5, max: 5 })

const leaf: fc.Arbitrary<Expr> = fc.oneof(
  smallInt.map((n) => num(n)),
  fc.tuple(smallInt, fc.integer({ min: 1, max: 4 })).map(([n, d]) => num(n, d)),
  fc.constant(x),
  fc.constant(x),
  fc.constant(E),
  fc.constant(PI),
)

const exponent: fc.Arbitrary<Expr> = fc.oneof(
  fc.integer({ min: -3, max: 3 }).map((n) => num(n)),
  fc.tuple(fc.integer({ min: -3, max: 3 }), fc.integer({ min: 2, max: 3 })).map(([n, d]) => num(n, d)),
  fc.constant(x),
)

const fnNames: FnName[] = ['sin', 'cos', 'tan', 'ln', 'arctan', 'sinh', 'cosh']

export const arbExpr: fc.Arbitrary<Expr> = fc.letrec<{ e: Expr }>((tie) => ({
  e: fc.oneof(
    { maxDepth: 3, depthSize: 'small' },
    leaf,
    fc.array(tie('e'), { minLength: 2, maxLength: 3 }).map((terms) => add(...terms)),
    fc.array(tie('e'), { minLength: 2, maxLength: 3 }).map((factors) => mul(...factors)),
    tie('e').map(neg),
    fc.tuple(tie('e'), tie('e')).map(([a, b]) => div(a, b)),
    fc.tuple(tie('e'), exponent).map(([b, e]) => pow(b, e)),
    fc.tuple(tie('e'), fc.integer({ min: 2, max: 3 })).map(([a, n]) => root(a, n)),
    fc.tuple(fc.constantFrom(...fnNames), tie('e')).map(([name, a]) => fn(name, a)),
    tie('e').map((a) => log(num(2), a)),
  ),
})).e

// Feste Prüfstellen, absichtlich „krumm", damit keine Sonderfälle wie 0 oder 1 getroffen werden
export const CHECK_POINTS = [-2.31, -1.17, -0.43, 0.29, 0.77, 1.38, 2.64]

export function closeEnough(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b))
}
