import { type Env, evaluate } from '../expr/evaluate.ts'
import type { Equation } from '../expr/types.ts'
import type { Rng } from '../random/rng.ts'

// Punkte auf einer Kurve F(x, y) = 0 (implizites Ableiten) und die Steigung y' dort, rein
// numerisch: unabhängige Gegenprobe zur Rechnung der Engine. Gefunden werden die Punkte mit
// dem Newton-Verfahren in y bei festem x.

// F(x, y) = linke Seite − rechte Seite, dazu die Größe der Seiten (für relative Genauigkeit)
function residual(equation: Equation, x: number, y: number): { value: number; scale: number } {
  const left = evaluate(equation.lhs, { x, y })
  const right = evaluate(equation.rhs, { x, y })
  return { value: left - right, scale: Math.max(1, Math.abs(left), Math.abs(right)) }
}

// Ableitung von F nach y (zentraler Differenzenquotient)
function slopeInY(equation: Equation, x: number, y: number): number {
  const h = 1e-6 * Math.max(1, Math.abs(y))
  return (residual(equation, x, y + h).value - residual(equation, x, y - h).value) / (2 * h)
}

// y mit F(x, y) = 0, ausgehend von start; null, wenn das Verfahren nicht sauber konvergiert
export function solveForY(equation: Equation, x: number, start: number): number | null {
  let y = start
  for (let i = 0; i < 80; i++) {
    const { value } = residual(equation, x, y)
    const slope = slopeInY(equation, x, y)
    if (!Number.isFinite(value) || !Number.isFinite(slope) || Math.abs(slope) < 1e-10) return null
    const step = value / slope
    y -= step
    if (Math.abs(step) <= 1e-14 * Math.max(1, Math.abs(y))) break
  }
  const { value, scale } = residual(equation, x, y)
  return Number.isFinite(y) && Math.abs(value) <= 1e-10 * scale ? y : null
}

const STARTS = [-4, -2, -1, -0.5, 0.5, 1, 2, 4]

// Zufällige Punkte (x, y) auf der Kurve. Nicht an Stellen, an denen die Kurve senkrecht steht
// (dort ist F nach y abgeleitet 0 und y' nicht definiert).
export function curvePoints(equation: Equation, rng: Rng, count: number): Env[] {
  const points: Env[] = []
  for (let attempt = 0; attempt < count * 40 && points.length < count; attempt++) {
    const x = (rng.next() * 2 - 1) * 4
    const y = solveForY(equation, x, rng.pick(STARTS) * (0.5 + rng.next()))
    if (y === null || Math.abs(y) > 50) continue
    if (Math.abs(slopeInY(equation, x, y)) < 1e-3 * residual(equation, x, y).scale) continue
    points.push({ x, y })
  }
  return points
}

// Steigung y' der Kurve im Punkt (x0, y0), indem man auf der Kurve ein Stück nach links und
// rechts geht (Richardson-verbesserter Differenzenquotient). null, wenn das nicht sicher gelingt.
export function numericImplicitDerivative(equation: Equation, x0: number, y0: number): number | null {
  const yAt = (x: number) => solveForY(equation, x, y0)
  const quotient = (h: number) => {
    const [plus, minus] = [yAt(x0 + h), yAt(x0 - h)]
    if (plus === null || minus === null) return null
    // auf einen anderen Kurvenast gesprungen?
    if (Math.abs(plus - y0) > 1e3 * h || Math.abs(minus - y0) > 1e3 * h) return null
    return (plus - minus) / (2 * h)
  }
  const h = 1e-4 * Math.max(1, Math.abs(x0))
  const [coarse, fine] = [quotient(h), quotient(h / 2)]
  if (coarse === null || fine === null) return null
  const estimate = (4 * fine - coarse) / 3
  // zwei Schrittweiten müssen zusammenpassen
  return Math.abs(estimate - fine) <= 1e-5 * Math.max(1, Math.abs(estimate)) ? estimate : null
}
