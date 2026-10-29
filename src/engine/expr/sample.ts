import type { Rng } from '../random/rng.ts'
import { type Env, evaluate } from './evaluate.ts'
import type { Expr } from './types.ts'

const SCAN_FROM = -10
const SCAN_TO = 10
const SCAN_STEP = 0.02

// Sucht zufällige Stellen, an denen alle Terme definiert sind.
// Zuerst wird der Bereich −10 … 10 in kleinen Schritten abgetastet, dann wird um
// zufällig gewählte gültige Rasterpunkte herum gewürfelt. So werden auch kleine
// oder abseits liegende Definitionsbereiche gefunden (z. B. arcsin(5x): |x| ≤ 0,2).
// Liefert höchstens `count` Stellen; keine, wenn die Terme nirgends definiert sind.
export function samplePoints(exprs: readonly Expr[], rng: Rng, count: number, variable = 'x'): Env[] {
  const isDefined = (value: number) => exprs.every((e) => !Number.isNaN(evaluate(e, { [variable]: value })))

  const grid: number[] = []
  for (let value = SCAN_FROM; value <= SCAN_TO + 1e-9; value += SCAN_STEP) {
    if (isDefined(value)) grid.push(value)
  }
  if (grid.length === 0) return []

  const points: Env[] = []
  for (let attempt = 0; attempt < count * 20 && points.length < count; attempt++) {
    const value = rng.pick(grid) + (rng.next() - 0.5) * SCAN_STEP
    if (isDefined(value)) points.push({ [variable]: value })
  }
  return points
}

// Zufällige Stellen für mehrere voneinander unabhängige Variablen, z. B. x, y und y' beim
// impliziten Ableiten. Werte zwischen −4 und 4; nur Stellen, an denen alle Terme definiert sind.
export function sampleEnvs(exprs: readonly Expr[], rng: Rng, count: number, variables: readonly string[]): Env[] {
  const points: Env[] = []
  for (let attempt = 0; attempt < count * 50 && points.length < count; attempt++) {
    const env: Env = Object.fromEntries(variables.map((name) => [name, (rng.next() * 2 - 1) * 4]))
    if (exprs.every((e) => !Number.isNaN(evaluate(e, env)))) points.push(env)
  }
  return points
}
