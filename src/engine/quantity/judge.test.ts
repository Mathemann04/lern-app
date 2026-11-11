import { describe, expect, it } from 'vitest'
import { parseDecimal, rat } from '../rational.ts'
import { type NumericAnswer, judgeNumber } from './judge.ts'
import { readNumber } from './numberDe.ts'

const d = (t: string) => parseDecimal(t)!

describe('Zahlen lesen (freier Modus)', () => {
  it('liest Komma, Punkt, Minus und Zehnerpotenzen in allen üblichen Schreibweisen', () => {
    const cases: [string, string][] = [
      ['0,1', '0.1'],
      ['0.1', '0.1'],
      [',5', '0.5'],
      ['-3', '-3'],
      ['−2,5', '-2.5'],
      ['1,8·10^-5', '0.000018'],
      ['1,8 · 10⁻⁵', '0.000018'],
      ['1,8*10^-5', '0.000018'],
      ['1,8e-5', '0.000018'],
      ['6,02E23', '602000000000000000000000'],
      ['2e3', '2000'],
      ['12', '12'],
    ]
    for (const [text, value] of cases) expect(readNumber(text), text).toEqual(d(value))
  })

  it('lehnt Unvollständiges und Unsinn ab', () => {
    for (const text of ['', '-', ',', '1,5e', '1,2,3', 'abc', '1e', '10^', '1,5·10^']) expect(readNumber(text), text).toBeNull()
  })
})

describe('Urteil über eine eingetippte Zahl (docs/CHEMIE.md §7)', () => {
  const answer: NumericAnswer = { value: d('17.6'), unit: '\\mathrm{g}', wrongs: [{ rule: 'fehler-a', value: d('35.2') }, { rule: 'fehler-b', value: d('8.8') }] }

  it('richtig bis 1 %, typischer Fehler bis 1 % neben seinem Wert, fast bis 4 %, sonst falsch', () => {
    expect(judgeNumber(d('17.6'), answer)).toEqual({ kind: 'correct' })
    expect(judgeNumber(d('17.77'), answer)).toEqual({ kind: 'correct' })
    expect(judgeNumber(d('17.43'), answer)).toEqual({ kind: 'correct' })
    expect(judgeNumber(d('35.3'), answer)).toEqual({ kind: 'error', rule: 'fehler-a' })
    expect(judgeNumber(d('8.8'), answer)).toEqual({ kind: 'error', rule: 'fehler-b' })
    expect(judgeNumber(d('18'), answer)).toEqual({ kind: 'close' })
    expect(judgeNumber(d('17'), answer)).toEqual({ kind: 'close' })
    expect(judgeNumber(d('18.5'), answer)).toEqual({ kind: 'wrong' })
    expect(judgeNumber(d('-17.6'), answer)).toEqual({ kind: 'wrong' })
  })

  it('verlangt genaue Werte, wo sie genau stimmen müssen (ohne „fast")', () => {
    const exact: NumericAnswer = { value: rat(20), unit: '', exact: true, wrongs: [{ rule: 'tausch', value: rat(17) }] }
    expect(judgeNumber(rat(20), exact)).toEqual({ kind: 'correct' })
    expect(judgeNumber(d('20.1'), exact)).toEqual({ kind: 'wrong' })
    expect(judgeNumber(rat(19), exact)).toEqual({ kind: 'wrong' })
    expect(judgeNumber(rat(17), exact)).toEqual({ kind: 'error', rule: 'tausch' })
  })

  it('nimmt weitere richtige Werte an (z. B. mit gerundetem Zwischenergebnis) und den nächsten Fehler', () => {
    const also: NumericAnswer = { value: rat(100), unit: '', also: [rat(103)], wrongs: [{ rule: 'a', value: rat(200) }, { rule: 'b', value: rat(201) }] }
    expect(judgeNumber(rat(103), also).kind).toBe('correct')
    expect(judgeNumber(rat(201), also)).toEqual({ kind: 'error', rule: 'b' })
    expect(judgeNumber(rat(200), also)).toEqual({ kind: 'error', rule: 'a' })
  })

  it('verlangt bei der Lösung 0 genau 0', () => {
    const zero: NumericAnswer = { value: rat(0), unit: '', wrongs: [] }
    expect(judgeNumber(rat(0), zero).kind).toBe('correct')
    expect(judgeNumber(d('0.001'), zero).kind).toBe('wrong')
  })
})
