import type { Expr } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import type { RearrangeSolution } from '../rearrange/isolate.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import { FORMULAS, FORMULA_TASKS, type Formula, type FormulaTask } from './formulas.ts'
import type { Level } from './taskNumber.ts'

// Aufgaben aus der Formelsammlung (formulas.ts, M6 Schritt 4b): Formel, Größe, nach der aufgelöst wird, und darunter, was
// die Zeichen bedeuten.

function parsed(latex: string): Expr {
  const result = parseLatex(latex)
  if (!result.ok) throw new Error(`Formel ${latex}: ${result.message}`)
  return result.expr
}

const formulaById = (id: string): Formula => {
  const formula = FORMULAS.find((f) => f.id === id)
  if (!formula) throw new Error(`Unbekannte Formel ${id}`)
  return formula
}

function condition(latex: string): Condition {
  const match = /^(.+?)\s*([<>])\s*(.+)$/.exec(latex)
  if (!match) throw new Error(`Bedingung ${latex}`)
  return { lhs: parsed(match[1]), rel: match[2] as '<' | '>', rhs: parsed(match[3]) }
}

// „Schwingungsdauer eines Fadenpendels: $T$ Schwingungsdauer, $l$ Länge des Fadens, $g$ Fallbeschleunigung."
export const formulaContext = (formula: Formula) => `${formula.name}: ${formula.quantities.map(([symbol, meaning]) => `$${symbol}$ ${meaning}`).join(', ')}.`

// Die Umstell-Aufgabe zu einer Formel und Größe
export function formulaRearrangeTask(formula: Formula, target: string): RearrangeTask {
  const [lhs, rhs] = formula.latex.split('=')
  return {
    equation: { lhs: parsed(lhs), rhs: parsed(rhs) },
    target,
    conditions: (formula.conditions ?? []).map(condition),
    context: formulaContext(formula),
  }
}

// Aufgabe Nummer s (ab 1); null, wenn es sie nicht gibt oder sie zu einer anderen Stufe gehört
export function formulaTaskAt(level: Level, s: number): { readonly entry: FormulaTask; readonly task: RearrangeTask } | null {
  const entry = FORMULA_TASKS[s - 1]
  if (!entry || entry.level !== level) return null
  return { entry, task: formulaRearrangeTask(formulaById(entry.formula), entry.target) }
}

// Stufe nach der Zahl der Umformungen: bis 3 Einstieg, bis 5 Grundlagen, sonst Kombiniert
export const formulaLevel = (solution: RearrangeSolution): Level => (solution.steps.length <= 3 ? 1 : solution.steps.length <= 5 ? 2 : 3)
