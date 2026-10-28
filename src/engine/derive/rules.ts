import type { FnName } from '../expr/types.ts'

// Alle Ableitungsregeln der Engine. Die Formeln dienen zur Anzeige (später auch für Lernkarten).

export type RuleId =
  | 'constant'
  | 'power'
  | 'constantFactor'
  | 'sum'
  | 'product'
  | 'quotient'
  | 'chain'
  | 'rewrite'
  | 'logarithmic'
  | 'exp'
  | 'expBase'
  | 'logBase'
  | FnName

export type RuleInfo = {
  readonly name: string
  // Regel als LaTeX, z. B. (u \cdot v)' = u' \cdot v + u \cdot v'
  readonly formula: string
}

export const RULES: Readonly<Record<RuleId, RuleInfo>> = {
  constant: { name: 'Konstante', formula: "(c)' = 0" },
  power: { name: 'Potenzregel', formula: "(x^n)' = n \\cdot x^{n-1}" },
  constantFactor: { name: 'Faktorregel', formula: "(c \\cdot u)' = c \\cdot u'" },
  sum: { name: 'Summenregel', formula: "(u + v)' = u' + v'" },
  product: { name: 'Produktregel', formula: "(u \\cdot v)' = u' \\cdot v + u \\cdot v'" },
  quotient: {
    name: 'Quotientenregel',
    formula: "\\left(\\frac{u}{v}\\right)' = \\frac{u' \\cdot v - u \\cdot v'}{v^2}",
  },
  chain: { name: 'Kettenregel', formula: "\\bigl(f(g(x))\\bigr)' = f'(g(x)) \\cdot g'(x)" },
  rewrite: {
    name: 'Als Potenz schreiben',
    formula: '\\frac{1}{x^n} = x^{-n}, \\quad \\sqrt[n]{x^m} = x^{\\frac{m}{n}}',
  },
  logarithmic: {
    name: 'Logarithmisches Ableiten',
    formula: "\\bigl(u^v\\bigr)' = u^v \\cdot \\bigl(v \\cdot \\ln u\\bigr)'",
  },
  exp: { name: 'e-Funktion', formula: "(e^x)' = e^x" },
  expBase: { name: 'Exponentialfunktion zur Basis a', formula: "(a^x)' = a^x \\cdot \\ln a" },
  logBase: { name: 'Logarithmus zur Basis a', formula: "(\\log_a x)' = \\frac{1}{x \\cdot \\ln a}" },
  ln: { name: 'Natürlicher Logarithmus', formula: "(\\ln x)' = \\frac{1}{x}" },
  sin: { name: 'Sinus', formula: "(\\sin x)' = \\cos x" },
  cos: { name: 'Kosinus', formula: "(\\cos x)' = -\\sin x" },
  tan: { name: 'Tangens', formula: "(\\tan x)' = \\frac{1}{\\cos^2 x}" },
  cot: { name: 'Kotangens', formula: "(\\cot x)' = -\\frac{1}{\\sin^2 x}" },
  arcsin: { name: 'Arkussinus', formula: "(\\arcsin x)' = \\frac{1}{\\sqrt{1 - x^2}}" },
  arccos: { name: 'Arkuskosinus', formula: "(\\arccos x)' = -\\frac{1}{\\sqrt{1 - x^2}}" },
  arctan: { name: 'Arkustangens', formula: "(\\arctan x)' = \\frac{1}{1 + x^2}" },
  sinh: { name: 'Sinus hyperbolicus', formula: "(\\sinh x)' = \\cosh x" },
  cosh: { name: 'Kosinus hyperbolicus', formula: "(\\cosh x)' = \\sinh x" },
  tanh: { name: 'Tangens hyperbolicus', formula: "(\\tanh x)' = \\frac{1}{\\cosh^2 x}" },
  arsinh: {
    name: 'Areasinus hyperbolicus',
    formula: "(\\operatorname{arsinh} x)' = \\frac{1}{\\sqrt{x^2 + 1}}",
  },
  arcosh: {
    name: 'Areakosinus hyperbolicus',
    formula: "(\\operatorname{arcosh} x)' = \\frac{1}{\\sqrt{x^2 - 1}}",
  },
  artanh: {
    name: 'Areatangens hyperbolicus',
    formula: "(\\operatorname{artanh} x)' = \\frac{1}{1 - x^2}",
  },
}
