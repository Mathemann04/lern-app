import { describe, expect, it } from 'vitest'
import { simplify } from '../expr/display.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, eq, exp, fn, mul, num, pow, sin, sqrt, x, y } from '../expr/types.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { type Verdict, checkAnswer, prepareAnswerCheck, prepareImplicitCheck } from './answer.ts'

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

describe('Stufe 5: implizites Ableiten (x² + y² = 25)', () => {
  const context = prepareImplicitCheck(eq(add(pow(x, num(2)), pow(y, num(2))), num(25)))
  const check = (latex: string) => checkAnswer(context, latex)

  it('zählt richtige Formen als richtig, auch mit „y\' =" davor', () => {
    for (const latex of ['-\\frac{x}{y}', "y'=-\\frac{x}{y}", '\\frac{-2x}{2y}', '-x\\cdot y^{-1}']) expect(check(latex).kind, latex).toBe('correct')
  })

  it('benennt Fehler beim Auflösen und beim Ableiten', () => {
    expect(check('\\frac{x}{y}').kind).toBe('wrongSign')
    expect(check('-\\frac{y}{x}')).toMatchObject({ kind: 'solveMistake', mistake: 'reciprocal' })
    expect(check('\\frac{25-2x}{2y}')).toMatchObject({ kind: 'knownError', wrong: { errorRule: { id: 'implicit-constant-side-kept' } } })
    expect(check('-\\frac{3x}{y}').kind).toBe('wrongFactor')
  })

  it('verlangt y im Ergebnis und kein y\'', () => {
    expect(check('-\\frac{x}{\\sqrt{25-x^2}}').kind).toBe('keepY')
    expect(check("-\\frac{x}{y'}").kind).toBe('unreadable')
    expect(check('-\\frac{x}{Y}')).toEqual({ kind: 'unreadable', message: 'Schreibe $y$ bitte klein.' })
    expect(check('-\\frac{x}{z}')).toMatchObject({ kind: 'unreadable', message: expect.stringMatching(/nur \$x\$ und \$y\$/) })
  })
})

// Implizite Aufgabe: Lösung in mehreren Formen richtig, jeder typische Fehler erkannt
function checkImplicitTask(equation: Parameters<typeof prepareImplicitCheck>[0], label: string) {
  const context = prepareImplicitCheck(equation)
  for (const form of [context.result, simplify(context.result)]) {
    const latex = toLatex(form)
    expect(checkAnswer(context, latex).kind, `${label}: ${latex}`).toBe('correct')
    expect(checkAnswer(context, `y' = ${latex}`).kind, `${label}: y' = ${latex}`).toBe('correct')
  }
  for (const wrong of context.wrongAnswers) {
    const latex = toLatex(wrong.solved!)
    expect(checkAnswer(context, latex).kind, `${label}: ${latex} (${wrong.errorRule.id})`).toBe('knownError')
  }
  for (const { mistake, result } of context.mistakes) {
    const latex = toLatex(result)
    // Kann mit einem Fehler beim Ableiten zusammenfallen, der zuerst genannt wird
    const expected = ['knownError', mistake === 'sign' ? 'wrongSign' : 'solveMistake']
    expect(expected, `${label}: ${latex} (${mistake})`).toContain(checkAnswer(context, latex).kind)
  }
}

describe.each(LEVELS)('alle Aufgaben der Stufe %i', (level) => {
  it('erkennt die Lösung in mehreren Formen und jedes typische falsche Ergebnis', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const { task } = generateDerivativeTask({ level, seed })
      if (task.kind !== 'function') {
        checkImplicitTask(task.equation, `${level}-${seed}`)
        continue
      }
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
