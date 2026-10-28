import { toLatex } from '../expr/print.ts'
import type { Expr } from '../expr/types.ts'

// Bausteine für Texte mit Formeln (siehe richText.ts)

// Term als eingebettete Formel
export const m = (e: Expr) => `$${toLatex(e)}$`

// LaTeX als eingebettete Formel
export const tex = (latex: string) => `$${latex}$`

// Ableitungsstrich an einem Term: (4x^3)'
export const prime = (e: Expr) => String.raw`\left(${toLatex(e)}\right)'`

// Gleichungskette aus Termen bzw. LaTeX, gleiche Nachbarn werden zusammengefasst
export function chain(...parts: Array<Expr | string>): string {
  const latex = parts.map((p) => (typeof p === 'string' ? p : toLatex(p)))
  return latex.filter((p, i) => i === 0 || p !== latex[i - 1]).join(' = ')
}
