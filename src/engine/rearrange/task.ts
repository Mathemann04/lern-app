import { subterms } from '../expr/compare.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import type { Equation, Expr } from '../expr/types.ts'

// Eine Umstell-Aufgabe: Gleichung, gesuchte Variable und Bedingungen. Alle Buchstaben stehen für
// positive Zahlen; dazu kommen Bedingungen der Aufgabe wie x > a, damit die Lösung eindeutig ist.

export type Condition = { readonly lhs: Expr; readonly rel: '<' | '>'; readonly rhs: Expr }

export type RearrangeTask = {
  readonly equation: Equation
  readonly target: string
  readonly conditions: readonly Condition[]
}

// Alle Buchstaben eines Terms, alphabetisch
export function variablesOf(...exprs: readonly Expr[]): string[] {
  const names = new Set<string>()
  for (const e of exprs) for (const s of subterms(e)) if (s.kind === 'var') names.add(s.name)
  return [...names].sort()
}

export const taskVariables = (t: RearrangeTask) => variablesOf(t.equation.lhs, t.equation.rhs)

export const taskLatex = (t: RearrangeTask) => equationToLatex(t.equation)

export const conditionLatex = (c: Condition) => `${toLatex(c.lhs)} ${c.rel} ${toLatex(c.rhs)}`

export const instructionFor = (t: RearrangeTask) => `Löse nach $${t.target}$ auf.`

// „Alle Buchstaben stehen für positive Zahlen, dazu $x > a$."
export function conditionsText(t: RearrangeTask): string {
  const extra = t.conditions.map((c) => `$${conditionLatex(c)}$`).join(' und ')
  return `Alle Buchstaben stehen für positive Zahlen${extra ? `, dazu ${extra}` : ''}.`
}
