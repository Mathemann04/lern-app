import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  type Rational,
  parseDecimal,
  rat,
  ratAdd,
  ratDiv,
  ratEq,
  ratMul,
  ratPow,
  ratPowInt,
  ratSub,
  ratToNumber,
  toDecimalString,
} from './rational.ts'

const arbRational = fc
  .tuple(fc.bigInt({ min: -1000n, max: 1000n }), fc.bigInt({ min: 1n, max: 1000n }))
  .map(([n, d]) => rat(n, d))

describe('rat', () => {
  it('kürzt und macht den Nenner positiv', () => {
    expect(rat(6, -4)).toEqual({ n: -3n, d: 2n })
    expect(rat(0, 7)).toEqual({ n: 0n, d: 1n })
  })

  it('verbietet den Nenner 0', () => {
    expect(() => rat(1, 0)).toThrow()
  })
})

describe('Rechenregeln', () => {
  it('a + b − b = a', () => {
    fc.assert(fc.property(arbRational, arbRational, (a, b) => ratEq(ratSub(ratAdd(a, b), b), a)))
  })

  it('(a · b) : b = a für b ≠ 0', () => {
    fc.assert(
      fc.property(arbRational, arbRational, (a, b) => {
        fc.pre(b.n !== 0n)
        return ratEq(ratDiv(ratMul(a, b), b), a)
      }),
    )
  })

  it('Ergebnisse sind immer gekürzt', () => {
    fc.assert(
      fc.property(arbRational, arbRational, (a, b) => {
        const s: Rational = ratAdd(a, b)
        return ratEq(s, rat(s.n, s.d)) && s.d > 0n
      }),
    )
  })

  it('stimmt mit Gleitkomma-Rechnung überein', () => {
    fc.assert(
      fc.property(arbRational, arbRational, (a, b) => {
        expect(ratToNumber(ratAdd(a, b))).toBeCloseTo(ratToNumber(a) + ratToNumber(b), 9)
      }),
    )
  })
})

describe('Potenzen', () => {
  it('rechnet ganzzahlige Potenzen exakt', () => {
    expect(ratPowInt(rat(2, 3), 3n)).toEqual(rat(8, 27))
    expect(ratPowInt(rat(2, 3), -2n)).toEqual(rat(9, 4))
    expect(ratPowInt(rat(0), -1n)).toBeNull()
  })

  it('zieht Wurzeln nur, wenn das Ergebnis rational ist', () => {
    expect(ratPow(rat(4), rat(1, 2))).toEqual(rat(2))
    expect(ratPow(rat(8, 27), rat(2, 3))).toEqual(rat(4, 9))
    expect(ratPow(rat(4), rat(-1, 2))).toEqual(rat(1, 2))
    expect(ratPow(rat(2), rat(1, 2))).toBeNull()
  })

  it('lässt Wurzeln aus negativen Zahlen undefiniert (deutsche Konvention)', () => {
    expect(ratPow(rat(-8), rat(1, 3))).toBeNull()
    expect(ratPow(rat(-2), rat(3))).toEqual(rat(-8))
  })

  it('bricht bei riesigen Ergebnissen ab statt zu hängen', () => {
    expect(ratPowInt(rat(10), 100000n)).toBeNull()
  })
})

describe('Dezimalzahlen', () => {
  it('liest Komma und Punkt exakt ein', () => {
    expect(parseDecimal('2,5')).toEqual(rat(5, 2))
    expect(parseDecimal('0.125')).toEqual(rat(1, 8))
    expect(parseDecimal('-3')).toEqual(rat(-3))
    expect(parseDecimal('2,,5')).toBeNull()
  })

  it('schreibt abbrechende Brüche mit Dezimalkomma', () => {
    expect(toDecimalString(rat(5, 2))).toBe('2,5')
    expect(toDecimalString(rat(-1, 8))).toBe('-0,125')
    expect(toDecimalString(rat(3, 50))).toBe('0,06')
    expect(toDecimalString(rat(7))).toBe('7')
    expect(toDecimalString(rat(1, 3))).toBeNull()
  })

  it('Hin und zurück ergibt dieselbe Zahl', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -100000n, max: 100000n }), fc.integer({ min: 0, max: 5 }), (n, k) => {
        const value = rat(n, 10n ** BigInt(k))
        const text = toDecimalString(value)
        return text !== null && ratEq(parseDecimal(text)!, value)
      }),
    )
  })
})
