// Prüfhilfen für Tests: sauberer Formelsatz. Nur in Tests verwendet.
import katex from 'katex'

// Muster, die in sauber gesetzten Ergebnissen nie vorkommen dürfen
export const UGLY_PATTERNS: Array<[string, RegExp]> = [
  // ein Summand 1 vor \right) ist kein Faktor
  ['Faktor 1', /(?<![\d{,])1(?=[a-z(]|\\(?!right))/],
  ['Faktor 0', /(?<![\d{,])0(?=[a-z(]|\\(?!right))/],
  ['Exponent 1', /\^\{1\}/],
  ['Exponent 0', /\^\{0\}/],
  ['plus minus', /\+ -/],
  ['minus minus', /- -|--/],
  ['plus plus', /\+ \+/],
  ['mal 1', /\\cdot 1(?![\d,{])/],
  ['leere Klammer', /\(\)/],
  ['Zähler 0', /\\frac\{0\}/],
  ['Nenner 1', /\\frac\{[^{}]*\}\{1\}/],
  ['Malzeichen ×', /\\times/],
]

// Fehlermeldung, falls die Formel sich nicht setzen lässt oder unschön ist; sonst null
export function latexProblem(latex: string, { checkUgly = true } = {}): string | null {
  try {
    katex.renderToString(latex, { throwOnError: true, strict: 'error' })
  } catch (error) {
    return `lässt sich nicht setzen: ${latex} (${String(error)})`
  }
  if (!checkUgly) return null
  for (const [name, pattern] of UGLY_PATTERNS) {
    if (pattern.test(latex)) return `${name} in ${latex}`
  }
  return null
}
