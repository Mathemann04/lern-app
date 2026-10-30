import { type Env, evaluate } from '../expr/evaluate.ts'
import type { Equation, Expr } from '../expr/types.ts'
import type { Rng } from '../random/rng.ts'
import { type RearrangeTask, taskVariables, variablesOf } from './task.ts'

// Prüfstellen fürs Umstellen, unabhängig vom Rechenweg: Die Buchstaben (außer der gesuchten
// Variable) werden zufällig positiv gewählt, die gesuchte Variable kommt aus dem Ergebnis. Nur Stellen,
// an denen sie positiv ist und die Bedingungen der Aufgabe gelten, zählen.

const SMALLEST = 0.3
const LARGEST = 8
// Werte außerhalb dieses Bereichs sagen wenig aus (Rundung)
const MAX_VALUE = 1e6

// requires: Terme, die ≥ 0 sein müssen, damit es eine Lösung gibt (aus dem Rechenweg, z. B. beim
// Quadrieren von Wurzeln); sie schränken nur ein, wo geprüft wird
export function samplePoints(task: RearrangeTask, result: Expr, rng: Rng, count: number, requires: readonly Expr[] = []): Env[] {
  const letters = [...new Set([...taskVariables(task), ...variablesOf(result)])].filter((name) => name !== task.target)
  const points: Env[] = []
  for (let attempt = 0; attempt < count * 80 && points.length < count; attempt++) {
    // gleichmäßig auf logarithmischer Skala: kleine und große Werte gleich oft
    const env: Record<string, number> = {}
    for (const name of letters) env[name] = SMALLEST * (LARGEST / SMALLEST) ** rng.next()
    const value = evaluate(result, env)
    if (!(value > 1e-3) || value > MAX_VALUE) continue
    env[task.target] = value
    if (!task.conditions.every((c) => satisfied(evaluate(c.lhs, env), c.rel, evaluate(c.rhs, env)))) continue
    if (requires.every((r) => evaluate(r, env) > 1e-9)) points.push(env)
  }
  return points
}

// Mit Abstand erfüllt, damit Rundung nicht entscheidet
function satisfied(a: number, rel: '<' | '>', b: number): boolean {
  const margin = 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))
  return rel === '<' ? a < b - margin : a > b + margin
}

// Gilt die Gleichung an der Stelle? null, wenn eine Seite dort nicht definiert ist
export function holds(e: Equation, env: Env): boolean | null {
  const l = evaluate(e.lhs, env)
  const r = evaluate(e.rhs, env)
  if (Number.isNaN(l) || Number.isNaN(r)) return null
  return Math.abs(l - r) <= 1e-7 * Math.max(1, Math.abs(l), Math.abs(r))
}

// Gilt die Gleichung an (fast) allen Stellen, an denen sie definiert ist? Mindestens die Hälfte der
// Stellen muss definiert sein.
export function holdsAt(e: Equation, points: readonly Env[]): boolean {
  const results = points.map((p) => holds(e, p)).filter((r) => r !== null)
  return results.length >= points.length / 2 && results.length > 0 && results.every(Boolean)
}

// Gilt die Gleichung an höchstens der Hälfte der definierten Stellen (sicher eine andere Gleichung)?
export function clearlyFails(e: Equation, points: readonly Env[]): boolean {
  const results = points.map((p) => holds(e, p)).filter((r) => r !== null)
  if (results.length === 0) return true
  return results.filter(Boolean).length <= results.length / 2
}

// Hat der Term an den Stellen einen anderen Wert als die gesuchte Variable?
export function differsFromTarget(e: Expr, target: string, points: readonly Env[]): boolean {
  const values = points.map((p) => [evaluate(e, p), p[target]] as const).filter(([v]) => !Number.isNaN(v))
  if (values.length === 0) return true
  const same = values.filter(([v, t]) => Math.abs(v - t) <= 1e-7 * Math.max(1, Math.abs(t))).length
  return same <= values.length / 2
}
