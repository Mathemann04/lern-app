import { describe, expect, it } from 'vitest'
import { rat } from '../rational.ts'
import { equationToLatex, toLatex } from './print.ts'
import {
  type Expr,
  E,
  PI,
  add,
  cos,
  dec,
  div,
  eq,
  exp,
  fn,
  ln,
  log,
  mul,
  neg,
  num,
  pow,
  root,
  sin,
  sqrt,
  sub,
  x,
  y,
} from './types.ts'

// Feste Beispiele: So soll die Schreibweise aussehen. Ändert sich eine Ausgabe,
// muss das eine bewusste Entscheidung sein.
const cases: Array<[string, Expr, string]> = [
  ['Summe mit Bruch und Wurzel', add(mul(num(4), pow(x, num(3))), neg(div(num(2), x)), sqrt(x)), '4x^{3} - \\frac{2}{x} + \\sqrt{x}'],
  ['Produkt ohne Malpunkt', mul(pow(x, num(2)), exp(x)), 'x^{2}e^{x}'],
  ['Funktion mit Klammer', sin(mul(num(3), x)), '\\sin(3x)'],
  ['Funktion ohne Klammer', mul(exp(pow(x, num(2))), cos(x)), 'e^{x^{2}}\\cos x'],
  ['Bruch mit Funktion', div(ln(x), pow(x, num(2))), '\\frac{\\ln x}{x^{2}}'],
  [
    'verschachtelter Bruch',
    div(mul(pow(x, num(2)), exp(neg(mul(num(3), x)))), sqrt(add(num(1), pow(x, num(2))))),
    '\\frac{x^{2}e^{-3x}}{\\sqrt{1 + x^{2}}}',
  ],
  [
    'große Klammer um Bruch',
    ln(div(add(pow(x, num(2)), num(1)), sub(x, num(1)))),
    '\\ln\\left(\\frac{x^{2} + 1}{x - 1}\\right)',
  ],
  ['Potenz am Funktionsnamen', pow(sin(x), num(2)), '\\sin^{2} x'],
  ['Potenz am Funktionsnamen mit Klammer', pow(sin(mul(num(3), x)), num(2)), '\\sin^{2}(3x)'],
  ['Potenz von ln mit Klammer', pow(ln(x), num(2)), '(\\ln x)^{2}'],
  ['Dezimalkomma und Malpunkt', mul(dec(rat(3, 2)), pow(num(10), num(3))), '1{,}5 \\cdot 10^{3}'],
  ['Malpunkt nach Funktion ohne Klammer', mul(sin(x), cos(x)), '\\sin x \\cdot \\cos x'],
  ['kein Malpunkt nach Funktion mit Klammer', mul(sin(mul(num(2), x)), cos(x)), '\\sin(2x)\\cos x'],
  ['Malpunkt vor Bruch', mul(num(2), div(num(1), x)), '2 \\cdot \\frac{1}{x}'],
  ['Malpunkt vor Zahl', mul(x, num(2)), 'x \\cdot 2'],
  ['Malpunkt vor negativer Zahl', mul(x, num(-2)), 'x \\cdot (-2)'],
  ['Leerzeichen nach Befehl', mul(PI, x), '\\pi x'],
  ['Zahl vor Klammer', mul(num(2), add(x, num(1))), '2(x + 1)'],
  ['negativer erster Summand', add(neg(pow(x, num(2))), num(3)), '-x^{2} + 3'],
  ['negative Zahl als Summand', add(x, num(-2)), 'x - 2'],
  ['Minus eins als Faktor', mul(num(-1), x), '-x'],
  ['negativer Koeffizient', add(x, mul(num(-2), pow(x, num(2)))), 'x - 2x^{2}'],
  ['Minus vor Klammer', neg(add(x, num(1))), '-(x + 1)'],
  ['Logarithmus zur Basis', log(num(2), x), '\\log_{2} x'],
  ['Logarithmus mit Klammer', log(num(2), add(pow(x, num(2)), num(1))), '\\log_{2}(x^{2} + 1)'],
  ['dritte Wurzel', root(pow(x, num(2)), 3), '\\sqrt[3]{x^{2}}'],
  ['gebrochener Exponent', pow(x, num(2, 3)), 'x^{\\frac{2}{3}}'],
  ['negativer gebrochener Exponent', pow(x, num(-1, 2)), 'x^{-\\frac{1}{2}}'],
  ['negativer Bruch', num(-1, 2), '-\\frac{1}{2}'],
  ['Hyperbel-Umkehrfunktion', fn('arsinh', pow(x, num(2))), '\\operatorname{arsinh}(x^{2})'],
  ['Variabler Exponent', pow(x, sin(x)), 'x^{\\sin x}'],
  ['Klammer um Produkt als Basis', pow(mul(num(2), x), num(3)), '(2x)^{3}'],
  ['Klammer um Summe als Basis', pow(add(x, num(1)), num(5)), '(x + 1)^{5}'],
  ['e hoch Summe', exp(sub(pow(x, num(2)), mul(num(3), x))), 'e^{x^{2} - 3x}'],
  ['Konstante e als Basis', pow(E, x), 'e^{x}'],
]

describe('toLatex', () => {
  it.each(cases)('%s', (_name, expr, expected) => {
    expect(toLatex(expr)).toBe(expected)
  })

  it('schreibt Gleichungen', () => {
    expect(equationToLatex(eq(add(pow(x, num(2)), pow(y, num(2))), num(25)))).toBe('x^{2} + y^{2} = 25')
  })
})
