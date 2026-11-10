import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { rat, ratToNumber } from '../rational.ts'
import { formatLatex, formatText, roundSignificant } from './numberDe.ts'

describe('Zahlen in deutscher Schreibweise', () => {
  it('rundet auf drei gültige Ziffern ohne Nullen am Ende', () => {
    expect(formatText(rat(176, 10))).toBe('17,6')
    expect(formatText(rat(1, 10))).toBe('0,1')
    expect(formatText(rat(58))).toBe('58')
    expect(formatText(rat(5000))).toBe('5000')
    expect(formatText(rat(12345))).toBe('1,23 · 10⁴')
    expect(formatText(rat(1, 300))).toBe('3,33 · 10⁻³')
    expect(formatText(rat(-25, 1000))).toBe('-0,025')
    expect(formatText(rat(9996, 1000))).toBe('10')
    expect(formatText(rat(1, 110))).toBe('9,09 · 10⁻³')
  })

  it('rundet exakt kaufmännisch, auch bei 5 an der vierten Stelle', () => {
    expect(formatText(rat(1235, 1000))).toBe('1,24')
    expect(formatText(rat(1245, 1000))).toBe('1,25')
    expect(formatText(rat(-1235, 1000))).toBe('-1,24')
  })

  it('setzt Energien eines Photons als Zehnerpotenz in LaTeX', () => {
    // h · c / λ mit h = 6,626 · 10⁻³⁴ J s, c = 3,00 · 10⁸ m/s, λ = 500 nm
    const energy = rat(6626n * 3n * 10n ** 15n, 5n * 10n ** 37n)
    expect(formatLatex(energy)).toBe('3{,}98 \\cdot 10^{-19}')
    expect(formatLatex(rat(5, 10 ** 7), { scientific: true })).toBe('5 \\cdot 10^{-7}')
    expect(formatLatex(rat(589), { scientific: false })).toBe('589')
  })

  it('liegt höchstens eine halbe Einheit der letzten Ziffer neben dem genauen Wert', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 ** 9 }), fc.integer({ min: 1, max: 10 ** 9 }), (n, d) => {
        const exact = rat(n, d)
        const { value, exponent } = roundSignificant(exact)
        const error = Math.abs(ratToNumber(value) - n / d)
        expect(error).toBeLessThanOrEqual(0.5 * 10 ** (exponent - 2) * (1 + 1e-9))
      }),
    )
  })
})
