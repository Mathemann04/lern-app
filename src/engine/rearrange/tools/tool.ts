import { subterms } from '../../expr/compare.ts'
import { odeLatex, toolLatex } from '../../expr/print.ts'
import { substitute } from '../../expr/substitute.ts'
import { type Equation, type Expr, type Tool, type Var, add, eq, mapToolBodies, neg, num, toolBodies, variable } from '../../expr/types.ts'
import { ratNeg } from '../../rational.ts'

// Werkzeuge der Stufe 5 im Termbaum: ein Buchstabe mit eigenem Namen (aus der Schreibweise, also
// eindeutig) und dem Werkzeug dazu. So lassen sich Aufgaben wie \frac{\int_0^x e^t\,\mathrm{d}t}{e^x + a} = y
// mit den gewohnten Bauhelfern zusammensetzen.

// (bei der Differentialgleichung mit der Gleichung und den Anfangswerten, gesetzt wird nur f(x))
export const toolExpr = (tool: Tool): Var => ({ kind: 'var', name: `§${tool.kind === 'ode' ? `${odeLatex(tool)}|` : ''}${toolLatex(tool)}`, tool })

// \frac{\mathrm{d}}{\mathrm{d}x}\left(body\right)
export const derivativeOf = (body: Expr, v = 'x'): Var => toolExpr({ kind: 'derivative', body, v })

// \int_{lower}^{upper} body \,\mathrm{d}t
export const integralOf = (body: Expr, lower: Expr, upper: Expr, v = 't'): Var => toolExpr({ kind: 'integral', body, v, lower, upper })

// \left[body\right]_{lower}^{upper}
export const bracketOf = (body: Expr, lower: Expr, upper: Expr, v = 't'): Var => toolExpr({ kind: 'bracket', body, v, lower, upper })

// \sum_{k=lower}^{upper} body
export const sumOf = (body: Expr, lower: Expr, upper: Expr, v = 'k'): Var => toolExpr({ kind: 'sum', body, v, lower, upper })

// \sum_{k=lower}^{\infty} body
export const seriesOf = (body: Expr, lower: Expr, v = 'k'): Var => toolExpr({ kind: 'series', body, v, lower })

// \lim_{n \to \infty} body
export const limitOf = (body: Expr, v = 'n'): Var => toolExpr({ kind: 'limit', body, v })

// f(x) mit f' = body bzw. f'' = body (body in f, z. B. k^2 f) und den Anfangswerten f(0), f'(0)
export const odeOf = (body: Expr, order: 1 | 2, initial: readonly Expr[], v = 'f', point: Expr = variable('x')): Var =>
  toolExpr({ kind: 'ode', order, body, v, initial, point })

// \det\begin{pmatrix} … \end{pmatrix}, Einträge zeilenweise (2 × 2 oder 3 × 3)
export const detOf = (rows: readonly (readonly Expr[])[]): Var => toolExpr({ kind: 'det', rows })

// Betrag und Winkel einer komplexen Zahl: \left\lvert x + a\mathrm{i} \right\rvert, \arg\left((x + a\mathrm{i})^{2}\right)
export const absOf = (body: Expr): Var => toolExpr({ kind: 'abs', body })
export const argOf = (body: Expr): Var => toolExpr({ kind: 'arg', body })

// Vektoren als Spalten: Länge, Skalarprodukt, Winkel dazwischen
export const lengthOf = (vector: readonly Expr[]): Var => toolExpr({ kind: 'length', vector })
export const dotOf = (left: readonly Expr[], right: readonly Expr[]): Var => toolExpr({ kind: 'dot', left, right })
export const angleOf = (left: readonly Expr[], right: readonly Expr[]): Var => toolExpr({ kind: 'angle', left, right })
// Teil 8c: \sin(x + a), \cos(2x) als Werkzeug (gesetzt wie die Funktion), ausgerechnet mit dem Additionstheorem
export const theoremOf = (body: Expr): Var => toolExpr({ kind: 'theorem', body })

export type ToolVar = Var & { readonly tool: Tool }

export const isToolVar = (e: Expr): e is ToolVar => e.kind === 'var' && e.tool !== undefined

// Werkzeuge in einer Gleichung, von links nach rechts
export function toolsIn(e: Equation): ToolVar[] {
  return [...subterms(e.lhs), ...subterms(e.rhs)].filter(isToolVar)
}

export const hasTool = (e: Equation) => toolsIn(e).length > 0

// Das Werkzeug in der Gleichung durch value ersetzen; steht es in einer Summe, kommen die Summanden
// des Werts ohne Klammer hinein: a - (\ln x + 1) → a - \ln x - 1
export const replaceTool = (e: Equation, tool: ToolVar, value: Expr): Equation => eq(replaceToolIn(e.lhs, tool, value), replaceToolIn(e.rhs, tool, value))

// dasselbe in einem Term (z. B. im Rumpf eines Werkzeugs drumherum)
export const replaceToolIn = (side: Expr, tool: ToolVar, value: Expr): Expr => (contains(side, tool.name) ? spliced(substitute(side, tool.name, value), value) : side)

// Das Werkzeug, das als Nächstes ausgerechnet wird: das innerste (\frac{\mathrm{d}}{\mathrm{d}x}\sum … erst die
// Reihe, dann die Ableitung); put setzt seinen Wert ein, auch im Rumpf der Werkzeuge drumherum
export type ActiveTool = { readonly tool: ToolVar; readonly put: (value: Expr) => Equation }

export function activeTool(e: Equation): ActiveTool | null {
  const [outer] = toolsIn(e)
  if (!outer) return null
  const inner = innermost(outer)
  return { tool: inner.tool, put: (value) => replaceTool(e, outer, inner.put(value)) }
}

function innermost(tool: ToolVar): { tool: ToolVar; put: (value: Expr) => Expr } {
  const inner = toolBodies(tool.tool).flatMap(subterms).find(isToolVar)
  if (!inner) return { tool, put: (value) => value }
  const deeper = innermost(inner)
  return { tool: deeper.tool, put: (value) => toolExpr(mapToolBodies(tool.tool, (body) => replaceToolIn(body, inner, deeper.put(value)))) }
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
        // mal 1 fällt weg; ein Minus im Faktor kommt vor das Produkt: b \cdot (-\ln(1 - x)) → -b\ln(1 - x)
        const visited = x.factors.map(visit).filter((f) => !(f.kind === 'num' && f.value.n === 1n && f.value.d === 1n))
        const negative = visited.filter((f) => f.kind === 'neg').length % 2 === 1
        const factors = visited.map((f) => (f.kind === 'neg' ? f.arg : f))
        const product = factors.length === 0 ? num(1) : factors.length === 1 ? factors[0] : { ...x, factors }
        return negative ? neg(product) : product
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

