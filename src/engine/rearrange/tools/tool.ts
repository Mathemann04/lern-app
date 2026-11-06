import { subterms } from '../../expr/compare.ts'
import { toolLatex } from '../../expr/print.ts'
import { substitute } from '../../expr/substitute.ts'
import { type Equation, type Expr, type Tool, type Var, add, eq, neg, num, variable } from '../../expr/types.ts'
import { ratNeg } from '../../rational.ts'

// Werkzeuge der Stufe 5 im Termbaum: ein Buchstabe mit eigenem Namen (aus der Schreibweise, also
// eindeutig) und dem Werkzeug dazu. So lassen sich Aufgaben wie \frac{\int_0^x e^t\,\mathrm{d}t}{e^x + a} = y
// mit den gewohnten Bauhelfern zusammensetzen.

export const toolExpr = (tool: Tool): Var => ({ kind: 'var', name: `§${toolLatex(tool)}`, tool })

// \frac{\mathrm{d}}{\mathrm{d}x}\left(body\right)
export const derivativeOf = (body: Expr, v = 'x'): Var => toolExpr({ kind: 'derivative', body, v })

// \int_{lower}^{upper} body \,\mathrm{d}t
export const integralOf = (body: Expr, lower: Expr, upper: Expr, v = 't'): Var => toolExpr({ kind: 'integral', body, v, lower, upper })

// \left[body\right]_{lower}^{upper}
export const bracketOf = (body: Expr, lower: Expr, upper: Expr, v = 't'): Var => toolExpr({ kind: 'bracket', body, v, lower, upper })

export type ToolVar = Var & { readonly tool: Tool }

const isToolVar = (e: Expr): e is ToolVar => e.kind === 'var' && e.tool !== undefined

// Werkzeuge in einer Gleichung, von links nach rechts
export function toolsIn(e: Equation): ToolVar[] {
  return [...subterms(e.lhs), ...subterms(e.rhs)].filter(isToolVar)
}

export const hasTool = (e: Equation) => toolsIn(e).length > 0

// Das Werkzeug in der Gleichung durch value ersetzen; steht es in einer Summe, kommen die Summanden
// des Werts ohne Klammer hinein: a - (\ln x + 1) → a - \ln x - 1
export const replaceTool = (e: Equation, tool: ToolVar, value: Expr): Equation => {
  const r = (side: Expr) => (contains(side, tool.name) ? spliced(substitute(side, tool.name, value), value) : side)
  return eq(r(e.lhs), r(e.rhs))
}

function negatedTerm(e: Expr): Expr {
  if (e.kind === 'neg') return e.arg
  if (e.kind === 'num') return num(ratNeg(e.value))
  return neg(e)
}

// Steht das Werkzeug (Name name) in dem Term?
const contains = (e: Expr, name: string) => subterms(e).some((x) => x.kind === 'var' && x.name === name)

// Summen, in denen der eingesetzte Wert als Summe steht, flach machen; mal 1 weglassen
function spliced(e: Expr, value: Expr): Expr {
  const visit = (x: Expr): Expr => {
    switch (x.kind) {
      case 'add':
        return add(
          ...x.terms.flatMap((t) => {
            const v = visit(t)
            if (value.kind === 'add' && (t === value || v === value)) return value.terms
            if (value.kind === 'add' && v.kind === 'neg' && v.arg === value) return value.terms.map(negatedTerm)
            return [v]
          }),
        )
      case 'mul': {
        // mal 1 fällt weg
        const factors = x.factors.map(visit).filter((f) => !(f.kind === 'num' && f.value.n === 1n && f.value.d === 1n))
        return factors.length === 0 ? num(1) : factors.length === 1 ? factors[0] : { ...x, factors }
      }
      case 'neg':
      case 'root':
      case 'fn':
        return { ...x, arg: visit(x.arg) }
      case 'div':
        return { ...x, num: visit(x.num), den: visit(x.den) }
      case 'pow':
        return { ...x, base: visit(x.base), exp: visit(x.exp) }
      case 'log':
        return { ...x, base: visit(x.base), arg: visit(x.arg) }
      default:
        return x
    }
  }
  return visit(e)
}

// Integrationsvariable als Term
export const boundVariable = (tool: Tool) => variable(tool.v)
