import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CHECK_POINTS, arbExpr, closeEnough, hasNoisyRoot, reliableValue } from './arbitraries.ts'
import { key } from './compare.ts'
import { simplify, toDisplayForm } from './display.ts'
import { evaluate } from './evaluate.ts'
import { normalize } from './normalize.ts'
import { toLatex } from './print.ts'
import {
  type Expr,
  E,
  add,
  cos,
  div,
  exp,
  ln,
  mul,
  neg,
  num,
  pow,
  root,
  sin,
  sqrt,
  sub,
  x,
} from './types.ts'

const simplified = (e: Expr) => toLatex(simplify(e))

describe('Vereinfachen: feste Beispiele', () => {
  it.each<[string, Expr, string]>([
    ['fasst gleichartige Summanden zusammen', add(mul(num(2), x), mul(num(3), x)), '5x'],
    ['fasst Zahlen zusammen', add(num(2), x, num(3)), 'x + 5'],
    ['fasst Potenzen zusammen', mul(pow(x, num(2)), pow(x, num(3))), 'x^{5}'],
    ['kürzt x/x', div(x, x), '1'],
    ['negativer Exponent wird Bruch', mul(num(-2), pow(x, num(-2))), '-\\frac{2}{x^{2}}'],
    ['Exponent 1/2 wird Wurzel', mul(num(1, 2), pow(x, num(-1, 2))), '\\frac{1}{2\\sqrt{x}}'],
    ['Exponent −1/3 wird dritte Wurzel im Nenner', mul(num(2, 3), pow(x, num(-1, 3))), '\\frac{2}{3\\sqrt[3]{x}}'],
    ['Bruchkoeffizient vor Potenz', mul(num(2, 3), pow(x, num(2))), '\\frac{2}{3}x^{2}'],
    ['sortiert nach fallendem Grad', add(num(3), x, pow(x, num(2))), 'x^{2} + x + 3'],
    ['Faktoren in gewohnter Reihenfolge', mul(cos(x), exp(x), pow(x, num(2)), num(3)), '3x^{2}e^{x}\\cos x'],
    ['Quotient bleibt Quotient', div(ln(x), pow(x, num(2))), '\\frac{\\ln x}{x^{2}}'],
    ['e hoch negativ bleibt oben', exp(neg(mul(num(3), x))), 'e^{-3x}'],
    ['ganzzahlige Potenz eines Produkts', pow(mul(num(2), x), num(3)), '8x^{3}'],
    ['Wurzel aus Quadrat bleibt (wäre |x|)', sqrt(pow(x, num(2))), '\\sqrt{x^{2}}'],
    ['Quadrat einer Wurzel', pow(sqrt(x), num(2)), 'x'],
    ['ln(e^u) = u', ln(exp(pow(x, num(2)))), 'x^{2}'],
    ['e^(ln u) = u', exp(ln(x)), 'x'],
    ['Werte bei 0', add(sin(num(0)), cos(num(0))), '1'],
    ['exakte Wurzel aus Zahl', root(num(27), 3), '3'],
    ['nicht exakte Wurzel bleibt', sqrt(num(2)), '\\sqrt{2}'],
    ['Minus vor Klammer in einer Summe', sub(x, add(x, num(1))), '-1'],
    ['Zahl mal Klammer bleibt als Produkt', mul(num(2), add(x, num(1))), '2(x + 1)'],
    ['Minus vor Klammer allein bleibt', neg(add(x, num(1))), '-(x + 1)'],
    ['Produkt mit Klammer bleibt', mul(num(2), x, add(x, num(1))), '2x(x + 1)'],
    ['negativer Faktor vor Bruch', mul(num(-1), div(sin(x), x)), '-\\frac{\\sin x}{x}'],
    ['Summe mit Bruch, Wurzel', add(mul(num(4), pow(x, num(3))), neg(div(num(2), x)), sqrt(x)), '4x^{3} + \\sqrt{x} - \\frac{2}{x}'],
    ['Konstante vor Variable', mul(x, E), 'ex'],
    // M6 Schritt 4c: ungerade Wurzeln auch aus negativen Zahlen
    ['dritte Wurzel aus negativer Zahl', root(num(-8), 3), '-2'],
    ['fünfte Wurzel aus negativem Bruch', root(num(-1, 32), 5), '-\\frac{1}{2}'],
    ['Minus aus dritter Wurzel ziehen', root(num(-2), 3), '-\\sqrt[3]{2}'],
    ['Zahlfaktor aus dritter Wurzel ziehen', root(mul(num(-8), x), 3), '-2\\sqrt[3]{x}'],
    ['dritte Wurzel aus dritter Potenz', root(pow(x, num(3)), 3), 'x'],
    ['dritte Potenz der dritten Wurzel', pow(root(x, 3), num(3)), 'x'],
    ['ganze Potenz aus dritter Wurzel ziehen', root(pow(x, num(4)), 3), 'x\\sqrt[3]{x}'],
    ['x hoch 1/3 und dritte Wurzel gleich', pow(x, num(1, 3)), '\\sqrt[3]{x}'],
    ['x hoch 2/3 wird dritte Wurzel', pow(x, num(2, 3)), '\\sqrt[3]{x^{2}}'],
    ['dritte Wurzel aus Wurzel', root(sqrt(x), 3), '\\sqrt[6]{x}'],
    ['positive Summanden zuerst', add(cos(x), mul(num(-2), ln(x))), '\\cos x - 2\\ln x'],
  ])('%s', (_name, expr, expected) => {
    expect(simplified(expr)).toBe(expected)
  })
})

describe('Ungerade Wurzeln (M6 Schritt 4c)', () => {
  // Gleiche Normalform wie im Skript: ∛x = x^(1/3) dort, wo beide definiert sind
  it('gibt der dritten Wurzel und der Hochzahl 1/3 dieselbe Normalform', () => {
    expect(key(normalize(root(x, 3)))).toBe(key(normalize(pow(x, num(1, 3)))))
    expect(key(normalize(div(num(1), root(pow(x, num(2)), 3))))).toBe(key(normalize(pow(x, num(-2, 3)))))
  })

  it('fasst die dritte Wurzel mit Potenzen von x zusammen', () => {
    const same = (a: Expr, b: Expr) => expect(key(normalize(a)), toLatex(a)).toBe(key(normalize(b)))
    same(div(pow(x, num(2)), root(x, 3)), pow(x, num(5, 3)))
    same(div(root(x, 3), x), pow(x, num(-2, 3)))
    same(mul(sqrt(x), root(x, 3)), pow(x, num(5, 6)))
    expect(simplified(div(x, root(x, 3)))).toBe('\\sqrt[3]{x^{2}}')
    expect(simplified(add(root(x, 3), pow(x, num(2))))).toBe('x^{2} + \\sqrt[3]{x}')
  })

  it('behält den Wert für negative x (die Normalform verkleinert den Definitionsbereich nicht)', () => {
    for (const e of [root(x, 3), root(sub(x, num(5)), 3), root(mul(num(-27), pow(x, num(5))), 3), root(x, 5), div(num(1), root(x, 3))]) {
      for (const value of [-7.3, -2.1, -0.6]) expect(closeEnough(evaluate(normalize(e), { x: value }), evaluate(e, { x: value })), toLatex(e)).toBe(true)
    }
  })
})

describe('Vereinfachen: Eigenschaften für zufällige Terme', () => {
  it('ändert den Wert nicht (überall, wo der Ausgangsterm definiert ist)', () => {
    fc.assert(
      fc.property(arbExpr, (e) => {
        const n = normalize(e)
        for (const value of CHECK_POINTS) {
          const original = reliableValue(e, value)
          if (original === null || hasNoisyRoot(n, value)) continue
          const normalized = evaluate(n, { x: value })
          if (!closeEnough(original, normalized)) {
            throw new Error(`x = ${value}: ${toLatex(e)} = ${original}, Normalform ${toLatex(n)} = ${normalized}`)
          }
        }
      }),
      { numRuns: 3000 },
    )
  })

  it('ist beim zweiten Mal schon fertig (idempotent)', () => {
    fc.assert(
      fc.property(arbExpr, (e) => {
        const once = normalize(e)
        expect(key(normalize(once))).toBe(key(once))
      }),
      { numRuns: 2000 },
    )
  })

  it('schöne Form hat denselben Wert und dieselbe Normalform', () => {
    fc.assert(
      fc.property(arbExpr, (e) => {
        // Terme, die nirgends definiert sind (z. B. 0^(−1)), haben keine eindeutige Normalform
        fc.pre(CHECK_POINTS.some((value) => !Number.isNaN(evaluate(e, { x: value }))))
        const n = normalize(e)
        const d = toDisplayForm(n)
        expect(key(normalize(d))).toBe(key(n))
        for (const value of CHECK_POINTS) {
          const a = reliableValue(n, value)
          if (a === null || hasNoisyRoot(d, value)) continue
          const b = evaluate(d, { x: value })
          if (!closeEnough(a, b)) throw new Error(`x = ${value}: ${toLatex(n)} = ${a}, Anzeige ${toLatex(d)} = ${b}`)
        }
      }),
      { numRuns: 2000 },
    )
  })
})
