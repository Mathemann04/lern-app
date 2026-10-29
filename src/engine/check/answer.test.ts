import { describe, expect, it } from 'vitest'
import { simplify } from '../expr/display.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, exp, fn, mul, num, pow, sin, sqrt, x } from '../expr/types.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { type Verdict, checkAnswer, prepareAnswerCheck } from './answer.ts'

function verdict(task: Expr, latex: string): Verdict {
  return checkAnswer(prepareAnswerCheck(task), latex)
}

const errorOf = (v: Verdict) => (v.kind === 'knownError' ? [v.wrong.errorRule.id, ...v.wrong.alsoMatches.map((r) => r.id)] : [])

describe('Beispiel aus dem Plan: x² eˣ', () => {
  const task = mul(pow(x, num(2)), exp(x))

  it.each(['e^x(x^2+2x)', '2xe^x+x^2e^x', 'xe^x\\left(x+2\\right)', '(x^2+2x)\\cdot e^{x}', "f'(x)=2x\\cdot e^x+x^2\\cdot e^x"])(
    'zählt %s als richtig',
    (latex) => {
      expect(verdict(task, latex).kind).toBe('correct')
    },
  )

  it('erkennt typische Fehler der Produktregel', () => {
    expect(errorOf(verdict(task, '2xe^x'))).toContain('product-derivatives-multiplied')
    expect(errorOf(verdict(task, '2xe^x-x^2e^x'))).toContain('product-minus')
  })
})

describe('Kettenregel: sin(3x)', () => {
  const task = sin(mul(num(3), x))

  it('zählt richtige Formen als richtig', () => {
    expect(verdict(task, '3\\cos\\left(3x\\right)').kind).toBe('correct')
    expect(verdict(task, '\\cos(3x)\\cdot3').kind).toBe('correct')
    expect(verdict(task, '3\\cos 3x').kind).toBe('correct')
  })

  it('benennt typische Fehler', () => {
    expect(errorOf(verdict(task, '\\cos(3x)'))).toContain('chain-inner-forgotten')
    expect(errorOf(verdict(task, '3\\cos x'))).toContain('chain-outer-wrong-argument')
    expect(errorOf(verdict(task, '-3\\cos(3x)'))).toContain('sin-sign')
  })

  it('erkennt Sonderfälle', () => {
    expect(verdict(task, '\\sin(3x)').kind).toBe('functionItself')
    expect(verdict(task, '6\\cos(3x)').kind).toBe('wrongFactor')
    expect(verdict(task, '\\cos(3x)+1').kind).toBe('wrong')
  })
})

describe('Eingaben, die sich nicht lesen lassen', () => {
  it('meldet Tippfehler und fremde Buchstaben', () => {
    const task = pow(x, num(2))
    expect(verdict(task, '2x+')).toMatchObject({ kind: 'unreadable' })
    expect(verdict(task, '2a')).toEqual({ kind: 'unreadable', message: 'In der Ableitung kommt nur $x$ vor. Was soll $a$ bedeuten?' })
    expect(verdict(task, '2X')).toEqual({ kind: 'unreadable', message: 'Schreibe $x$ bitte klein.' })
  })

  it('versteht Dezimalzahlen', () => {
    expect(verdict(sqrt(x), '0{,}5x^{-0{,}5}').kind).toBe('correct')
  })

  it('verlangt die Ableitung auch dort, wo sie definiert ist', () => {
    // 2\sqrt{x}\sqrt{x} stimmt nur für x ≥ 0 mit 2x überein
    expect(verdict(pow(x, num(2)), '2\\sqrt{x}\\sqrt{x}').kind).not.toBe('correct')
  })
})

describe('Stufe 5', () => {
  it('logarithmisches Ableiten: richtig, Potenzregel und vergessener Faktor', () => {
    const task = pow(x, x)
    expect(verdict(task, 'x^{x}\\left(\\ln\\left(x\\right)+1\\right)').kind).toBe('correct')
    expect(verdict(task, 'x^x\\ln x+x^x').kind).toBe('correct')
    expect(errorOf(verdict(task, 'x\\cdot x^{x-1}'))).toContain('logarithmic-power-rule')
    expect(errorOf(verdict(task, '\\ln x+1'))).toContain('logarithmic-factor-forgotten')
  })

  it('Areafunktionen, so wie MathLive sie schreibt', () => {
    const task = fn('arsinh', pow(x, num(2)))
    expect(verdict(task, '\\frac{2x}{\\sqrt{x^4+1}}').kind).toBe('correct')
    expect(errorOf(verdict(task, '\\frac{2x}{\\sqrt{x^4-1}}'))).toContain('arsinh-arcosh')
    expect(verdict(task, '\\operatorname{\\mathrm{arsinh}}\\left(x^2\\right)').kind).toBe('functionItself')
  })
})

describe.each(LEVELS)('alle Aufgaben der Stufe %i', (level) => {
  it('erkennt die Lösung in mehreren Formen und jedes typische falsche Ergebnis', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { task } = generateDerivativeTask({ level, seed })
      if (task.kind !== 'function') continue
      const context = prepareAnswerCheck(task.expr)
      const { derivation } = context
      const forms = [derivation.result, derivation.formula, simplify(derivation.result)]
      for (const form of forms) {
        const latex = toLatex(form)
        expect(checkAnswer(context, latex).kind, `${level}-${seed}: ${latex}`).toBe('correct')
      }
      for (const wrong of context.wrongAnswers) {
        const latex = toLatex(wrong.result)
        const v = checkAnswer(context, latex)
        expect(v.kind, `${level}-${seed}: ${latex} (${wrong.errorRule.id})`).toBe('knownError')
      }
    }
  })
})
