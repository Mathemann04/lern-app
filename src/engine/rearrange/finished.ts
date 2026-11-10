import { subterms } from '../expr/compare.ts'
import type { Expr } from '../expr/types.ts'

// Ist ein Ergebnis fertig? Teile der Prüfung im freien Modus (check/rearrangeAnswer.ts), die auch der
// Baukasten braucht (tasks/rearrangeTerms.ts: Ergebnisse mit Determinante ohne Doppelbruch).

// Kommt ein Bruch vor? Hochzahlen zählen nicht (x^{\frac{1}{2}} ist kein Bruch)
export function hasFraction(e: Expr): boolean {
  switch (e.kind) {
    case 'div':
      return true
    case 'add':
      return e.terms.some(hasFraction)
    case 'mul':
      return e.factors.some(hasFraction)
    case 'neg':
    case 'root':
    case 'fn':
      return hasFraction(e.arg)
    case 'pow':
      return hasFraction(e.base)
    case 'log':
      return hasFraction(e.base) || hasFraction(e.arg)
    default:
      return false
  }
}

// Doppelbruch irgendwo (außerhalb von Wurzeln, Logarithmen und Hochzahlen)?
export function hasNestedFraction(e: Expr): boolean {
  return subterms(e).some((s) => s.kind === 'div' && (hasLooseFraction(s.num) || hasLooseFraction(s.den)))
}

// Bruch außerhalb von Wurzeln? Eine Wurzel aus einem Bruch zählt in einer Summe wie ein Buchstabe:
// b + \sqrt{\frac{y}{a}} ist fertig; ebenso \ln\frac{a}{b} und e^{\frac{a}{b}}
export function hasLooseFraction(e: Expr): boolean {
  if (e.kind === 'root' || e.kind === 'fn' || e.kind === 'log') return false
  if (e.kind === 'add') return e.terms.some(hasLooseFraction)
  if (e.kind === 'mul') return e.factors.some(hasLooseFraction)
  if (e.kind === 'neg') return hasLooseFraction(e.arg)
  return hasFraction(e)
}
