import { subterms } from '../expr/compare.ts'
import { equationToLatex, odeLatex, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, toolBound, toolLimits } from '../expr/types.ts'

// Eine Umstell-Aufgabe: Gleichung, gesuchte Variable und Bedingungen. Alle Buchstaben stehen für
// positive Zahlen; dazu kommen Bedingungen der Aufgabe wie x > a, damit die Lösung eindeutig ist.

export type Condition = { readonly lhs: Expr; readonly rel: '<' | '>'; readonly rhs: Expr }

export type RearrangeTask = {
  readonly equation: Equation
  readonly target: string
  readonly conditions: readonly Condition[]
}

// Alle Buchstaben eines Terms, alphabetisch; bei einem Werkzeug (Ableitung, Integral) seine freien
// Buchstaben (ohne die Integrationsvariable)
export function variablesOf(...exprs: readonly Expr[]): string[] {
  const names = new Set<string>()
  const visit = (e: Expr) => {
    for (const s of subterms(e)) {
      if (s.kind !== 'var') continue
      if (!s.tool) {
        names.add(s.name)
        continue
      }
      const { tool } = s
      const inner = variablesOf(tool.body).filter((n) => n !== toolBound(tool))
      for (const n of [...inner, ...variablesOf(...toolLimits(tool))]) names.add(n)
    }
  }
  for (const e of exprs) visit(e)
  return [...names].sort()
}

export const taskVariables = (t: RearrangeTask) => variablesOf(t.equation.lhs, t.equation.rhs)

// Differentialgleichungen der Aufgabe (Stufe 5), je Funktion eine Zeile mit den Anfangswerten, f vor g:
// f'' = k^{2}f,\; f(0) = a,\; f'(0) = 0
export function givenLatex(t: RearrangeTask): string[] {
  const lines = new Map<string, string>()
  for (const s of [...subterms(t.equation.lhs), ...subterms(t.equation.rhs)]) {
    if (s.kind === 'var' && s.tool?.kind === 'ode') lines.set(s.tool.v, odeLatex(s.tool))
  }
  return [...lines].sort(([a], [b]) => a.localeCompare(b)).map(([, line]) => line)
}

// Die Aufgabe als Formel; mit Differentialgleichungen stehen sie in eigenen Zeilen darüber
export function taskLatex(t: RearrangeTask): string {
  const given = givenLatex(t)
  const equation = equationToLatex(t.equation)
  return given.length === 0 ? equation : `\\begin{gathered}${[...given, equation].join(' \\\\ ')}\\end{gathered}`
}

// Für die Form der Aufgabe (tasks/forms.ts): wie taskLatex, aber ohne gathered (dessen Buchstaben
// würden sonst mitgezählt)
export const taskFormLatex = (t: RearrangeTask) => [...givenLatex(t), equationToLatex(t.equation)].join(' ; ')

export const conditionLatex = (c: Condition) => `${toLatex(c.lhs)} ${c.rel} ${toLatex(c.rhs)}`

export const instructionFor = (t: RearrangeTask) => `Löse nach $${t.target}$ auf.`

// „Alle Buchstaben stehen für positive Zahlen, dazu $x > a$."
export function conditionsText(t: RearrangeTask): string {
  const extra = t.conditions.map((c) => `$${conditionLatex(c)}$`).join(' und ')
  return `Alle Buchstaben stehen für positive Zahlen${extra ? `, dazu ${extra}` : ''}.`
}
