import { subterms } from '../expr/compare.ts'
import { evaluate } from '../expr/evaluate.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { substitute } from '../expr/substitute.ts'
import type { Equation, Expr } from '../expr/types.ts'
import { rat } from '../rational.ts'
import { type RejectReason, numberExpr, probeReason } from './isolate.ts'

// Probe in der Ausgangsgleichung (M6 Schritt 4b-3): die Zahl eingesetzt, beide Seiten ausgerechnet. Für den Rechenweg der
// Lernkarten, den geführten Modus und die Erklärungen.

// Woran es im Definitionsbereich scheitert
export type DomainPart = 'root' | 'log' | 'denominator'

export type Probe = {
  // die Gleichung mit der Zahl statt x, z. B. \sqrt{2 \cdot 4 + 1} = 4 - 1
  readonly inserted: string
  // beide Seiten als Zahl, wenn sie glatt aufgehen
  readonly left: string | null
  readonly right: string | null
  readonly reason: RejectReason | null
  readonly domain: DomainPart | null
}

// Zahl als LaTeX, wenn sie ein einfacher Bruch ist (Nenner bis 12); sonst null
function plainNumber(v: number): string | null {
  if (!Number.isFinite(v)) return null
  for (let d = 1; d <= 12; d++) {
    const k = Math.round(v * d)
    if (Math.abs(k / d - v) < 1e-9 * Math.max(1, Math.abs(v))) return toLatex(numberExpr(rat(k, d)))
  }
  return null
}

export function probeOf(original: Equation, t: string, value: Expr): Probe {
  const x = evaluate(value, {})
  const inserted = equationToLatex({ lhs: substitute(original.lhs, t, value), rhs: substitute(original.rhs, t, value) })
  const reason = probeReason(original, t, x)
  const env = { [t]: x }
  const parts = [...subterms(original.lhs), ...subterms(original.rhs)]
  const undefinedAt = (kind: DomainPart) =>
    parts.some((s) => {
      if (kind === 'denominator') return s.kind === 'div' && Math.abs(evaluate(s.den, env)) < 1e-12
      if (kind === 'root') return s.kind === 'root' && s.index % 2 === 0 && evaluate(s.arg, env) < 0
      return (s.kind === 'log' || (s.kind === 'fn' && s.name === 'ln')) && !(evaluate(s.arg, env) > 0)
    })
  const domain = reason === 'domain' ? ((['denominator', 'root', 'log'] as const).find(undefinedAt) ?? null) : null
  return {
    inserted,
    left: reason === 'domain' ? null : plainNumber(evaluate(original.lhs, env)),
    right: reason === 'domain' ? null : plainNumber(evaluate(original.rhs, env)),
    reason,
    domain,
  }
}

// Eine Zeile für den Rechenweg: eingesetzt, dann 3 = 3 \;\checkmark bzw. 1 \neq -1 bzw. „nicht definiert"
export function probeLatex(p: Probe): string {
  if (p.reason === 'domain') return `${p.inserted} \\;\\text{ist nicht definiert}`
  const values = p.left !== null && p.right !== null ? ` \\;\\Rightarrow\\; ${p.left} ${p.reason ? '\\neq' : '='} ${p.right}` : ''
  return `${p.inserted}${values}${p.reason ? '' : ' \\;\\checkmark'}`
}

// Woran es im Definitionsbereich scheitert, als Satzteil: „ein Nenner wäre 0"
export const DOMAIN_TEXT: Record<DomainPart, string> = {
  denominator: 'ein Nenner wäre $0$',
  root: 'unter einer Wurzel stünde eine negative Zahl',
  log: 'ein Logarithmus hätte kein positives Argument',
}
