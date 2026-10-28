import { key } from '../engine/expr/compare.ts'
import { toLatex } from '../engine/expr/print.ts'
import type { Derivation } from '../engine/derive/derive.ts'
import { RULES } from '../engine/derive/rules.ts'
import { Formula } from './Formula.tsx'

// Rechenweg als verschachtelte Liste: Regel, Teile, eingesetzte Formel, Ergebnis.
// Vorläufige Ansicht für die Testseite; der geführte Modus (Schritt 4) zeigt ihn Schritt für Schritt.
export function DerivationView({ derivation }: { derivation: Derivation }) {
  return (
    <ol className="space-y-3">
      <DerivationStep node={derivation} />
    </ol>
  )
}

const prime = (input: string) => String.raw`\left(${input}\right)'`

function partsLatex(node: Derivation): string | null {
  const { parts } = node
  switch (node.rule) {
    case 'product':
    case 'quotient':
      return String.raw`u = ${toLatex(parts.u!)}, \quad v = ${toLatex(parts.v!)}`
    case 'chain':
      return String.raw`\text{außen: } ${toLatex(parts.outer!)}, \quad \text{innen: } u = ${toLatex(parts.inner!)}`
    case 'constantFactor':
      return String.raw`\text{${parts.divisor ? 'Teiler' : 'Faktor'}: } ${toLatex(parts.factor!)}`
    case 'rewrite':
      return `${toLatex(node.input)} = ${toLatex(parts.rewritten!)}`
    case 'logarithmic':
      return String.raw`u = ${toLatex(parts.u!)}, \quad v = ${toLatex(parts.v!)}`
    default:
      return null
  }
}

function DerivationStep({ node }: { node: Derivation }) {
  const rule = RULES[node.rule]
  const formula = toLatex(node.formula)
  const result = toLatex(node.result)
  const sameAsFormula = key(node.formula) === key(node.result) || formula === result
  const parts = partsLatex(node)
  const hasChildren = node.children.length > 0

  return (
    <li className="space-y-1">
      <p className="text-sm">
        <span className="font-medium text-accent-700">{rule.name}</span>
        {hasChildren && (
          <span className="ml-2 text-zinc-500">
            <Formula tex={rule.formula} />
          </span>
        )}
      </p>
      {parts && (
        <div className="overflow-x-auto text-sm text-zinc-600">
          <Formula tex={parts} />
        </div>
      )}
      <div className="overflow-x-auto">
        <Formula tex={`${prime(toLatex(node.input))} = ${formula}${sameAsFormula ? '' : ` = ${result}`}`} />
      </div>
      {hasChildren && (
        <ol className="mt-2 space-y-3 border-l-2 border-zinc-100 pl-3">
          {node.children.map((child) => (
            <DerivationStep key={child.path.join(',')} node={child} />
          ))}
        </ol>
      )}
    </li>
  )
}
