import { contains, subterms } from '../expr/compare.ts'
import { type Expr, type FnName, type Tool, toolBodies, toolBound, toolLimits } from '../expr/types.ts'
import type { RearrangeSolution } from '../rearrange/isolate.ts'
import type { RearrangeTask } from '../rearrange/task.ts'
import { REARRANGE_BLOCKS } from './blocks.ts'

// Bausteine einer Umstell-Aufgabe (M6 Schritt 3): welchen Stoff man braucht, um sie zu lösen. Abgelesen an der Aufgabe
// selbst, nicht an ihrer Vorlage, damit auch die Aufgaben der älteren Vorlagen ihre Bausteine bekommen.

const TOOL_BLOCK: Readonly<Record<Tool['kind'], string>> = {
  derivative: 'ableitung',
  integral: 'integral',
  bracket: 'integral',
  sum: 'reihen',
  series: 'reihen',
  limit: 'grenzwert',
  ode: 'dgl',
  det: 'det',
  abs: 'komplex',
  arg: 'komplex',
  length: 'vektoren',
  dot: 'vektoren',
  angle: 'vektoren',
  theorem: 'winkel',
}

const TRIG: ReadonlySet<FnName> = new Set(['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan'])
const HYPERBOLIC: ReadonlySet<FnName> = new Set(['sinh', 'cosh', 'tanh', 'arsinh', 'arcosh', 'artanh'])

// Zahl als Hochzahl (auch mit Minus davor), sonst null
function numericExponent(e: Expr): { readonly n: bigint; readonly d: bigint } | null {
  if (e.kind === 'num') return e.value
  if (e.kind === 'neg' && e.arg.kind === 'num') return { n: -e.arg.value.n, d: e.arg.value.d }
  return null
}

// Bausteine der Teile eines Terms, in denen die gesuchte Variable steckt. In einem Werkzeug (Integral, Summe, …) zählen
// Teile mit seiner gebundenen Variable nicht: Was beim Ausrechnen herauskommt (ln aus 1/t, der Bruch der geometrischen
// Reihe, die Wurzel einer Länge), gehört zum Baustein des Werkzeugs.
function collect(e: Expr, target: string, bound: ReadonlySet<string>, out: Set<string>) {
  for (const s of subterms(e)) {
    if (s.kind === 'var' && s.tool) {
      out.add(TOOL_BLOCK[s.tool.kind])
      const own = toolBound(s.tool)
      const inner = own ? new Set([...bound, own]) : bound
      for (const part of [...toolBodies(s.tool), ...toolLimits(s.tool)]) collect(part, target, inner, out)
      continue
    }
    if (!contains(s, target) || [...bound].some((b) => contains(s, b))) continue
    switch (s.kind) {
      case 'div':
        // Variable im Nenner oder Doppelbruch
        if (contains(s.den, target) || [s.num, s.den].some((p) => subterms(p).some((q) => q.kind === 'div'))) out.add('brueche')
        break
      case 'root':
        out.add('wurzeln')
        break
      case 'pow': {
        if (contains(s.exp, target)) {
          out.add('exp')
          break
        }
        const exponent = numericExponent(s.exp)
        if (!exponent) out.add('potenzen')
        else if (exponent.d !== 1n) out.add('wurzeln')
        else if (exponent.n >= 2n) out.add('potenzen')
        else if (exponent.n < 0n) out.add('brueche')
        break
      }
      case 'fn':
        if (TRIG.has(s.name)) out.add('winkel')
        else if (HYPERBOLIC.has(s.name)) out.add('hyperbel')
        else if (s.name === 'ln') out.add('log')
        break
      case 'log':
        out.add('log')
        break
    }
  }
}

// Bausteine der Aufgabe in der Reihenfolge der Liste (REARRANGE_BLOCKS): was in der Aufgabe steht (Werkzeuge und die
// Teile mit der gesuchten Variable, auch in den Rümpfen der Werkzeuge), dazu aus dem Rechenweg die quadratische Gleichung
// (Substitution oder pq-Formel) und, ohne Werkzeug, das Wurzelziehen (Quadrate und Potenzen, z. B. bei x/a = b/x). Was erst
// beim Lösen dazukommt (ln beim Lösen einer e-Gleichung, die Wurzel einer Länge), gehört zum Baustein, der es verlangt; so
// lässt sich fast jeder Baustein auch allein üben (Probe mit 2000 Aufgaben am 12.11.2026, docs/ENTSCHEIDUNGEN.md).
// Ohne jeden Baustein: „Lineare Gleichungen".
export function rearrangeTaskBlocks(task: RearrangeTask, solution: RearrangeSolution): string[] {
  const out = new Set<string>()
  collect(task.equation.lhs, task.target, new Set(), out)
  collect(task.equation.rhs, task.target, new Set(), out)
  const hasTool = [task.equation.lhs, task.equation.rhs].some((side) => subterms(side).some((t) => t.kind === 'var' && t.tool !== undefined))
  if (solution.steps.some((s) => s.kind === 'pq' || s.kind === 'substitute')) out.add('quadratisch')
  if (!hasTool && solution.steps.some((s) => s.kind === 'root')) out.add('potenzen')
  if (out.size === 0) out.add('linear')
  return REARRANGE_BLOCKS.map((b) => b.id).filter((id) => out.has(id))
}
