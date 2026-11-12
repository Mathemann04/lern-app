// Zufällige Terme für Eigenschaftstests (fast-check). Nur in Tests verwendet.
import fc from 'fast-check'
import { subterms } from './compare.ts'
import { evaluate } from './evaluate.ts'
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

// Wert eines Zufallsterms an einer Stelle, nur wenn er dort zuverlässig berechenbar ist.
// Kommazahlen runden; manche Zufallsterme verstärken das extrem:
// - ein Nenner wie x·(−3)·(1/3) + x ist mathematisch 0, wird aber als 10^(−16) berechnet,
// - \sin(\cosh(10x)) hängt bei großen Werten schon an der letzten Rundungsstelle.
// Solche Stellen erkennt man daran, dass sich der Wert bei winziger Verschiebung der
// Stelle sprunghaft ändert. Sie sind für Vergleiche wertlos und werden übersprungen.
export function reliableValue(e: Expr, at: number): number | null {
  const value = evaluate(e, { x: at })
  if (!Number.isFinite(value) || Math.abs(value) > 1e10 || !isStableAt(e, at) || hasCancellation(e, at) || hasNoisyRoot(e, at)) return null
  return value
}

// Wurzel aus Rundungsrauschen: Eine Wurzel oder gebrochene Potenz eines Werts, der fast 0 ist, vergrößert das Rauschen um
// viele Größenordnungen (\sqrt[3]{\sin \pi} ist mathematisch 0, am Rechner etwa 5 · 10⁻⁶, weil \sin \pi als 10⁻¹⁶
// herauskommt). Der Wert ist dort für Vergleiche wertlos, im Ausgangsterm (reliableValue) wie im umgeformten Term: Vergleiche
// überspringen eine Stelle auch dann, wenn erst die Umformung eine solche Wurzel enthält.
export function hasNoisyRoot(e: Expr, at: number): boolean {
  return subterms(e).some((s) => {
    const inner = s.kind === 'root' ? s.arg : s.kind === 'pow' && s.exp.kind === 'num' && s.exp.value.d !== 1n ? s.base : null
    if (inner === null) return false
    const value = evaluate(inner, { x: at })
    return value !== 0 && Math.abs(value) < 1e-12
  })
}

// Auslöschung: Eine Summe, deren Wert winzig gegen ihre Summanden ist (−x + sin π + x ist
// mathematisch 0, am Rechner etwa 2 · 10⁻¹⁶), ist nur Rundungsrauschen. Ein Logarithmus oder Bruch
// davon wäre ein Scheinwert, der sich beim Verschieben der Stelle nicht einmal ändert.
function hasCancellation(e: Expr, at: number): boolean {
  return subterms(e).some((s) => {
    if (s.kind !== 'add') return false
    const total = evaluate(s, { x: at })
    const scale = s.terms.reduce((acc, t) => acc + Math.abs(evaluate(t, { x: at })), 0)
    return total !== 0 && Number.isFinite(scale) && Math.abs(total) < 1e-9 * scale
  })
}

// Ändert sich der Wert bei winziger Verschiebung der Stelle kaum? (ohne Größengrenze,
// für echte Aufgaben wie e^{3x^2}, deren Werte von Natur aus riesig werden)
export function isStableAt(e: Expr, at: number): boolean {
  const value = evaluate(e, { x: at })
  const nudged = evaluate(e, { x: at * (1 + 1e-12) + 1e-12 })
  return Number.isFinite(value) && Number.isFinite(nudged) && Math.abs(nudged - value) <= 1e-9 * Math.max(1, Math.abs(value))
}
