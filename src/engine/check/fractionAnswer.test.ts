import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, IMAG, add, cos, exp, fn, mul, num, pow, sin, sqrt, sub, variable, x } from '../expr/types.ts'
import { toFrac } from '../fraction/frac.ts'
import { type Poly, polyDivideExact } from '../fraction/poly.ts'
import { type BlockRule, type FractionShape, type FractionTask, type Part, expanded, isReadableTask, minus, part, plus, taskLatex, withRoots } from '../fraction/task.ts'
import { generateFractionTask } from '../tasks/fractionTerms.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { rat } from '../rational.ts'
import { type FractionVerdict, checkFractionAnswer, prepareFractionCheck, prepareFractionFree } from './fractionAnswer.ts'

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const task = (s: FractionShape): FractionTask => ({ ...s, hints: [] }) as FractionTask
const [a, b, h] = ['a', 'b', 'h'].map(variable)

// Kurzform eines Urteils: „correct", „unfinished:numerator", „knownError:frac-minus-bracket" …
function short(v: FractionVerdict): string {
  if (v.kind === 'unfinished') return `unfinished:${v.reason}`
  if (v.kind === 'knownError') return `knownError:${v.wrong.rule.id}`
  return v.kind
}

describe('Beispiel aus dem Plan: 3/(x − 1) − 2/(x + 1)', () => {
  const context = prepareFractionCheck(task({ kind: 'sum', terms: [plus(fr(num(3), sub(x, num(1)))), minus(fr(num(2), add(x, num(1))))] }))
  const check = (latex: string) => short(checkFractionAnswer(context, latex))

  it('nimmt jede fertige Form an, auch mit ausmultipliziertem Nenner', () => {
    expect(check('\\frac{x+5}{x^2-1}')).toBe('correct')
    expect(check('\\frac{x+5}{(x+1)(x-1)}')).toBe('correct')
    expect(check('\\frac{5+x}{(x-1)\\cdot(x+1)}')).toBe('correct')
    expect(check('-\\frac{x+5}{1-x^2}')).toBe('correct')
  })

  it('sagt bei richtigen, aber unfertigen Formen, was noch fehlt', () => {
    expect(check('\\frac{3x+3-2x+2}{x^2-1}')).toBe('unfinished:numerator')
    expect(check('\\frac{3(x+1)-2(x-1)}{(x-1)(x+1)}')).toBe('unfinished:numerator')
    expect(check('\\frac{x+5}{x^2+1-2}')).toBe('unfinished:denominator')
    expect(check('\\frac{3}{x-1}-\\frac{2}{x+1}')).toBe('unfinished:several')
    expect(check('\\frac{2x+10}{2x^2-2}')).toBe('unfinished:not-reduced')
    expect(check('\\frac{\\frac{x+5}{x-1}}{x+1}')).toBe('unfinished:nested')
  })

  it('erkennt die vergessene Klammer, auch weitergekürzt', () => {
    expect(check('\\frac{x+1}{x^2-1}')).toBe('knownError:frac-minus-bracket')
    expect(check('\\frac{1}{x-1}')).toBe('knownError:frac-minus-bracket')
  })

  it('erkennt falsches Vorzeichen und falschen Zahlenfaktor', () => {
    expect(check('-\\frac{x+5}{x^2-1}')).toBe('wrongSign')
    expect(check('\\frac{2x+10}{x^2-1}')).toBe('wrongFactor')
    expect(check('\\frac{x}{x^2-1}')).toBe('wrong')
  })

  it('meldet Unlesbares und fremde Buchstaben', () => {
    expect(check('\\frac{x+5}{')).toBe('unreadable')
    expect(checkFractionAnswer(context, '\\frac{X+5}{X^2-1}')).toEqual({ kind: 'unreadable', message: 'Schreibe $x$ bitte klein.' })
    expect(checkFractionAnswer(context, '\\frac{a+5}{a^2-1}')).toEqual({ kind: 'unreadable', message: 'In der Aufgabe kommt nur $x$ vor. Was soll $a$ bedeuten?' })
  })
})

describe('weitere Aufgabenformen', () => {
  it('Zahlenbrüche: gekürzt, ungekürzt, Zähler und Nenner addiert', () => {
    const context = prepareFractionCheck(task({ kind: 'sum', terms: [plus(fr(num(3), num(4))), plus(fr(num(5), num(6)))] }))
    const check = (latex: string) => short(checkFractionAnswer(context, latex))
    expect(check('\\frac{19}{12}')).toBe('correct')
    expect(check('\\frac{38}{24}')).toBe('unfinished:not-reduced')
    expect(check('\\frac{9}{12}+\\frac{10}{12}')).toBe('unfinished:several')
    expect(check('\\frac{9+10}{12}')).toBe('unfinished:numerator')
    // ohne Hauptnenner (nur im freien Modus) und nach dem Erweitern
    expect(check('\\frac{8}{10}')).toBe('knownError:frac-add-across')
    expect(check('\\frac{19}{24}')).toBe('knownError:frac-add-across')
  })

  it('Doppelbruch', () => {
    const context = prepareFractionCheck(
      task({ kind: 'complex', top: [plus(fr(num(1))), plus(fr(num(1), x))], bottom: [plus(fr(num(1))), minus(fr(num(1), pow(x, num(2))))] }),
    )
    const check = (latex: string) => short(checkFractionAnswer(context, latex))
    expect(check('\\frac{x}{x-1}')).toBe('correct')
    expect(check('\\frac{\\frac{x+1}{x}}{\\frac{x^2-1}{x^2}}')).toBe('unfinished:nested')
    expect(check('\\frac{x^2+x}{x^2-1}')).toBe('unfinished:not-reduced')
  })

  it('zwei Buchstaben und ein Zahlbruch vor dem Term', () => {
    const [a, b] = [variable('a'), variable('b')]
    const context = prepareFractionCheck(task({ kind: 'product', left: fr(mul(num(3), a), mul(num(4), b)), right: fr(mul(num(8), pow(b, num(2))), mul(num(9), a)) }))
    const check = (latex: string) => short(checkFractionAnswer(context, latex))
    expect(check('\\frac{2b}{3}')).toBe('correct')
    expect(check('\\frac{2}{3}b')).toBe('correct')
    expect(check('\\frac{24ab^2}{36ab}')).toBe('unfinished:not-reduced')
    expect(checkFractionAnswer(context, '\\frac{2x}{3}')).toEqual({ kind: 'unreadable', message: 'In der Aufgabe kommen nur $a$ und $b$ vor. Was soll $x$ bedeuten?' })
  })

  it('Bausteine wie e^x', () => {
    const free = prepareFractionFree({ level: 4, seed: 1 })
    expect(free.keyboard).toEqual({ kind: 'fraction', letters: ['x'], blocks: true, root: false })
    // 4-1: (e^{2x} − 4)/(4e^{2x} + 8e^x)
    expect(free.check('\\frac{e^x-2}{4e^x}').kind).toBe('correct')
    expect(free.check('\\frac{e^{2x}-4}{4e^{2x}+8e^x}').kind).toBe('unfinished')
  })
})

describe('Stufe 5: Bausteine mit Regeln', () => {
  const free = (s: FractionShape, rule?: BlockRule) => prepareFractionCheck(withRoots({ ...s, hints: [], ...(rule ? { rule } : {}) } as FractionTask))
  const verdict = (context: ReturnType<typeof prepareFractionCheck>, latex: string) => short(checkFractionAnswer(context, latex))

  it('Wurzel: √x und x^{1/2} gelten, x = (√x)² wird verstanden', () => {
    const context = free({ kind: 'reduce', part: fr(sub(x, num(9)), sub(sqrt(x), num(3))) })
    expect(context.root).toBe(true)
    expect(verdict(context, '\\sqrt{x}+3')).toBe('correct')
    expect(verdict(context, 'x^{\\frac{1}{2}}+3')).toBe('correct')
    expect(verdict(context, '\\frac{x-9}{\\sqrt{x}-3}')).toBe('unfinished:not-reduced')
    expect(verdict(context, '\\sqrt{x}-3')).toBe('knownError:frac-binomial-confused')
  })

  it('zwei Wurzeln: x − a = (√x − √a)(√x + √a)', () => {
    const context = free({ kind: 'reduce', part: fr(sub(x, a), sub(sqrt(x), sqrt(a))) })
    expect(context.letters).toEqual(['x', 'a'])
    expect(verdict(context, '\\sqrt{x}+\\sqrt{a}')).toBe('correct')
    expect(verdict(context, '\\sqrt{a}+\\sqrt{x}')).toBe('correct')
    expect(verdict(context, '\\frac{x-a}{\\sqrt{x}-\\sqrt{a}}')).toBe('unfinished:not-reduced')
  })

  it('Wurzel im Nenner beseitigen: erst fertig ohne Wurzel unten', () => {
    const context = free({ kind: 'reduce', part: fr(num(3), sub(sqrt(x), num(2))) }, { kind: 'conjugate', target: 'den' })
    expect(verdict(context, '\\frac{3\\sqrt{x}+6}{x-4}')).toBe('correct')
    expect(verdict(context, '\\frac{3}{\\sqrt{x}-2}')).toBe('unfinished:conjugate')
    expect(verdict(context, '\\frac{6\\sqrt{x}+12}{2x-8}')).toBe('unfinished:not-reduced')
    expect(verdict(context, '\\frac{3\\sqrt{x}+6}{x-2}')).toBe('knownError:frac-conjugate-square')
    expect(verdict(context, '\\frac{3}{x-4}')).toBe('knownError:frac-conjugate-one-side')
    const two = free({ kind: 'reduce', part: fr(num(1), add(sqrt(a), sqrt(b))) }, { kind: 'conjugate', target: 'den' })
    expect(verdict(two, '\\frac{\\sqrt{a}-\\sqrt{b}}{a-b}')).toBe('correct')
  })

  it('Differenzenquotient von √x: mit dem Gegenstück erweitern, h kürzen', () => {
    const context = free({ kind: 'reduce', part: fr(sub(sqrt(add(x, h)), sqrt(x)), h) }, { kind: 'conjugate', target: 'num' })
    expect(context.letters).toEqual(['x', 'h'])
    expect(verdict(context, '\\frac{1}{\\sqrt{x+h}+\\sqrt{x}}')).toBe('correct')
    expect(verdict(context, '\\frac{1}{\\sqrt{x}+\\sqrt{h+x}}')).toBe('correct')
    expect(verdict(context, '\\frac{\\sqrt{x+h}-\\sqrt{x}}{h}')).toBe('unfinished:conjugate')
    expect(verdict(context, '\\sqrt{x+h}+\\sqrt{x}')).toBe('knownError:frac-cancel-forgot-one')
  })

  it('dritte Potenzen: mit Mittelglied', () => {
    const context = free({ kind: 'reduce', part: fr(sub(pow(a, num(3)), pow(b, num(3))), sub(pow(a, num(2)), pow(b, num(2)))) })
    expect(verdict(context, '\\frac{a^2+ab+b^2}{a+b}')).toBe('correct')
    expect(verdict(context, '\\frac{a^2+b^2}{a+b}')).toBe('knownError:frac-cube-as-square')
  })

  it('sin² x + cos² x = 1: jede gleich lange Endform zählt', () => {
    const context = free(
      { kind: 'sum', terms: [plus(part(expanded(poly(num(3))), expanded(poly(sub(num(1), sin(x))), true))), plus(part(expanded(poly(num(3))), expanded(poly(add(num(1), sin(x))), true)))] },
      { kind: 'trig', prefer: 'C', target: 'den' },
    )
    expect(verdict(context, '\\frac{6}{\\cos^2x}')).toBe('correct')
    expect(verdict(context, '\\frac{6}{1-\\sin^2x}')).toBe('correct')
    expect(verdict(context, '\\frac{6}{\\cos x}')).toBe('knownError:frac-square-forgotten')
  })

  it('tan x und sin x / cos x', () => {
    const context = free({ kind: 'complex', top: [plus(fr(num(1), cos(x))), minus(fr(cos(x)))], bottom: [plus(fr(sin(x)))] }, { kind: 'trig', prefer: 'S', target: 'num' })
    expect(verdict(context, '\\tan x')).toBe('correct')
    expect(verdict(context, '\\frac{\\sin x}{\\cos x}')).toBe('correct')
    expect(verdict(context, '\\frac{\\sin^2x}{\\sin x\\cos x}')).toBe('unfinished:not-reduced')
  })

  it('e-Funktion und zwei Variablen', () => {
    expect(verdict(free({ kind: 'reduce', part: fr(sub(exp(mul(num(2), x)), mul(num(4), exp(x))), exp(x)) }), 'e^2-4')).toBe('knownError:frac-cancel-inside')
    const quotient = free({ kind: 'complex', top: [plus(fr(num(4), add(x, h))), minus(fr(num(4), x))], bottom: [plus(fr(h))] })
    expect(quotient.letters).toEqual(['x', 'h'])
    expect(verdict(quotient, '-\\frac{4}{x(x+h)}')).toBe('correct')
    expect(verdict(quotient, '-\\frac{4}{x^2+hx}')).toBe('correct')
    expect(verdict(quotient, '\\frac{-\\frac{4h}{x(x+h)}}{h}')).toBe('unfinished:nested')
  })
})

describe('Stufe 5: Partialbrüche', () => {
  const x2 = pow(x, num(2))
  const checker = (t: FractionTask) => {
    const context = prepareFractionCheck(t)
    return (latex: string) => short(checkFractionAnswer(context, latex))
  }

  it('Beispiel aus dem Plan: jede Reihenfolge und Schreibweise der Zerlegung', () => {
    const check = checker(task({ kind: 'partial', part: fr(sub(mul(num(5), x), num(1)), sub(sub(x2, x), num(2))) }))
    expect(check('\\frac{3}{x-2}+\\frac{2}{x+1}')).toBe('correct')
    expect(check('\\frac{2}{x+1}+\\frac{3}{x-2}')).toBe('correct')
    expect(check('\\frac{-3}{2-x}+\\frac{2}{x+1}')).toBe('correct')
    // noch nicht zerlegt bzw. ein Nenner doppelt
    expect(check('\\frac{5x-1}{(x-2)(x+1)}')).toBe('unfinished:partial')
    expect(check('\\frac{1}{x-2}+\\frac{2}{x-2}+\\frac{2}{x+1}')).toBe('unfinished:partial-combine')
    // bei x = 2 die Klammer x + 1 als 2 − 1 gerechnet
    expect(check('\\frac{9}{x-2}+\\frac{2}{x+1}')).toBe('knownError:frac-partial-insert-sign')
    expect(check('\\frac{3}{x-2}-\\frac{2}{x+1}')).toBe('wrong')
  })

  it('doppelter Faktor, Zahlen als Brüche', () => {
    const check = checker(task({ kind: 'partial', part: fr(add(x2, num(1)), mul(pow(sub(x, num(1)), num(2)), add(x, num(2)))) }))
    expect(check('\\frac{4}{9(x-1)}+\\frac{2}{3(x-1)^2}+\\frac{5}{9(x+2)}')).toBe('correct')
    expect(check('\\frac{1}{x-1}+\\frac{2}{3(x-1)^2}+\\frac{5}{9(x+2)}')).toBe('knownError:frac-partial-compare')
  })

  it('mit Polynomdivision: ganzer Teil und Rest', () => {
    const check = checker(task({ kind: 'partial', part: fr(add(x2, num(1)), sub(x, num(1))) }))
    expect(check('x+1+\\frac{2}{x-1}')).toBe('correct')
    expect(check('\\frac{2}{x-1}+x+1')).toBe('correct')
    expect(check('x+3-2+\\frac{2}{x-1}')).toBe('unfinished:partial-combine')
    expect(check('\\frac{2}{x-1}')).toBe('knownError:frac-partial-no-division')
    expect(check('x+1')).toBe('knownError:frac-division-remainder')
  })
})

describe('Stufe 5: Grenzwerte', () => {
  const checker = (t: FractionTask) => {
    const context = prepareFractionCheck(t)
    return (latex: string) => short(checkFractionAnswer(context, latex))
  }

  it('x gegen 2: eine Zahl, gekürzt; ein Term ist noch nicht fertig', () => {
    const x2 = pow(x, num(2))
    const check = checker(task({ kind: 'limit', inner: task({ kind: 'reduce', part: fr(sub(x2, num(4)), add(sub(x2, mul(num(3), x)), num(2))) }), letter: 'x', to: rat(2) }))
    expect(check('4')).toBe('correct')
    expect(check('\\frac{8}{2}')).toBe('unfinished:not-reduced')
    expect(check('\\frac{x+2}{x-1}')).toBe('unfinished:limit-insert')
    expect(check('\\frac{x+1}{x-1}')).toBe('wrong')
    expect(check('0')).toBe('knownError:frac-limit-zero-zero')
    expect(check('5')).toBe('wrong')
  })

  it('n gegen unendlich', () => {
    const n = variable('n')
    const check = checker(task({ kind: 'limit', inner: task({ kind: 'reduce', part: fr(sub(mul(num(3), pow(n, num(2))), n), add(mul(num(2), pow(n, num(2))), num(5))) }), letter: 'n', to: 'infinity' }))
    expect(check('\\frac{3}{2}')).toBe('correct')
    expect(check('1{,}5')).toBe('unfinished:decimal')
    expect(check('\\frac{3-\\frac{1}{n}}{2+\\frac{5}{n^2}}')).toBe('unfinished:limit-infinity')
    expect(check('1')).toBe('knownError:frac-limit-infinity-one')
    expect(check('-\\frac{3}{2}')).toBe('wrongSign')
  })
})

describe('Stufe 5: Teleskopsummen', () => {
  const checker = (t: FractionTask) => {
    const context = prepareFractionCheck(t)
    return (latex: string) => short(checkFractionAnswer(context, latex))
  }
  const k = variable('k')
  const kk1 = fr(num(1), mul(k, add(k, num(1))))

  it('bis n: ein gekürzter Bruch in n', () => {
    const t = task({ kind: 'telescope', summand: kk1, index: 'k', from: 1, upper: { kind: 'letter', letter: 'n' } })
    expect(prepareFractionCheck(t).letters).toEqual(['n'])
    const check = checker(t)
    expect(check('\\frac{n}{n+1}')).toBe('correct')
    expect(check('1-\\frac{1}{n+1}')).toBe('unfinished:several')
    expect(check('1-\\frac{1}{n}')).toBe('knownError:frac-tele-last')
    expect(check('-\\frac{1}{n+1}')).toBe('knownError:frac-tele-head')
    expect(check('\\frac{k}{k+1}')).toBe('unreadable')
  })

  it('Reihe: gesucht ist eine Zahl, die Teilsumme ist noch nicht fertig', () => {
    const t = task({ kind: 'telescope', summand: fr(num(1), mul(k, add(k, num(2)))), index: 'k', from: 1, upper: { kind: 'infinity', letter: 'n' } })
    const check = checker(t)
    expect(check('\\frac{3}{4}')).toBe('correct')
    expect(check('\\frac{3}{4}-\\frac{1}{2n+2}-\\frac{1}{2n+4}')).toBe('unfinished:limit-infinity')
    expect(check('\\frac{1}{2}')).toBe('knownError:frac-tele-only-ends')
    expect(check('\\frac{3}{2}')).toBe('knownError:frac-tele-factor')
    expect(check('0')).toBe('knownError:frac-tele-head')
    expect(check('-\\frac{3}{4}')).toBe('knownError:frac-tele-swap')
  })

  it('bis zu einer Zahl: eine Zahl', () => {
    const t = task({ kind: 'telescope', summand: kk1, index: 'k', from: 1, upper: { kind: 'number', value: 99 } })
    expect(prepareFractionCheck(t).letters).toEqual([])
    const check = checker(t)
    expect(check('\\frac{99}{100}')).toBe('correct')
    expect(check('1-\\frac{1}{100}')).toBe('unfinished:several')
    expect(check('\\frac{98}{99}')).toBe('knownError:frac-tele-last')
  })
})

describe('Stufe 5: Hyperbelfunktionen', () => {
  const [sinh, cosh] = [fn('sinh', x), fn('cosh', x)]
  const checker = (t: FractionTask) => {
    const context = prepareFractionCheck(t)
    return (latex: string) => short(checkFractionAnswer(context, latex))
  }

  it('1/(cosh x − sinh x): cosh x + sinh x, auch e^x; im Nenner bleibt nur eine Zahl', () => {
    const t = { ...task({ kind: 'reduce', part: fr(num(2), sub(cosh, sinh)) }), rule: { kind: 'conjugate', target: 'den' } } as FractionTask
    const context = prepareFractionCheck(t)
    expect(context.hyperbolic).toBe(true)
    const check = checker(t)
    expect(check('2\\cosh x+2\\sinh x')).toBe('correct')
    expect(check('2(\\cosh x+\\sinh x)')).toBe('correct')
    expect(check('2e^x')).toBe('correct')
    expect(check('\\frac{2}{\\cosh x-\\sinh x}')).toBe('unfinished:hyperbolic')
    expect(check('\\frac{2\\cosh x+2\\sinh x}{\\cosh^2x-\\sinh^2x}')).toBe('unfinished:hyperbolic')
    expect(check('-2\\cosh x-2\\sinh x')).toBe('knownError:frac-hyp-swapped')
    expect(check('2\\cosh x-2\\sinh x')).toBe('knownError:frac-conjugate-sign')
    expect(check('2')).toBe('knownError:frac-conjugate-one-side')
  })

  it('cosh² x − sinh² x = 1 im Zähler', () => {
    const t = { ...task({ kind: 'reduce', part: fr(pow(sinh, num(2)), sub(cosh, num(1))) }), rule: { kind: 'trig', prefer: 'CH', target: 'num' } } as FractionTask
    const check = checker(t)
    expect(check('\\cosh x+1')).toBe('correct')
    expect(check('-\\cosh x-1')).toBe('knownError:frac-hyp-trig-sign')
    expect(check('\\frac{\\cosh^2x+1}{\\cosh x-1}')).toBe('knownError:frac-hyp-swapped')
    expect(check('1')).toBe('knownError:frac-square-forgotten')
  })

  it('1 − 1/cosh² x = tanh² x, auch als Bruch', () => {
    const t = { ...task({ kind: 'sum', terms: [plus(fr(num(1))), minus(fr(num(1), pow(cosh, num(2))))] }), rule: { kind: 'trig', prefer: 'SH', target: 'num' } } as FractionTask
    const check = checker(t)
    expect(check('\\tanh^2x')).toBe('correct')
    expect(check('\\frac{\\sinh^2x}{\\cosh^2x}')).toBe('correct')
    expect(check('-\\tanh^2x')).toBe('knownError:frac-hyp-trig-sign')
  })
})

describe('Stufe 5: komplexe Zahlen', () => {
  const z = (re: number, im: number) => add(num(re), mul(num(im), IMAG))
  const checker = (t: FractionTask) => {
    const context = prepareFractionCheck(t)
    return (latex: string) => short(checkFractionAnswer(context, latex))
  }

  it('fertig ist a + bi oder ein Bruch mit reellem Nenner', () => {
    const check = checker(task({ kind: 'imaginary', terms: [plus(fr(z(2, -1), z(3, 4)))] }))
    expect(check('\\frac{2}{25}-\\frac{11}{25}\\mathrm{i}')).toBe('correct')
    expect(check('\\frac{2}{25}-\\frac{11}{25}i')).toBe('correct')
    expect(check('\\frac{2-11i}{25}')).toBe('correct')
    expect(check('\\frac{2}{25}-\\frac{11i}{25}')).toBe('correct')
    // noch nicht fertig
    expect(check('\\frac{2-i}{3+4i}')).toBe('unfinished:imag-den')
    expect(check('\\frac{6-8i-3i+4i^2}{25}')).toBe('unfinished:imag-power')
    expect(check('\\frac{(2-i)(3-4i)}{25}')).toBe('unfinished:imag-combine')
    expect(check('\\frac{1}{25}+\\frac{1}{25}-\\frac{11}{25}i')).toBe('unfinished:imag-combine')
    expect(check('\\frac{4-22i}{50}')).toBe('unfinished:not-reduced')
    expect(check('0.08-0.44i')).toBe('unfinished:decimal')
    // Nenner mit c² − d²
    expect(check('-\\frac{2}{7}+\\frac{11}{7}i')).toBe('knownError:frac-imag-den')
  })

  it('typische Fehler beim Teilen', () => {
    const check = checker(task({ kind: 'imaginary', terms: [plus(fr(z(3, 4), z(1, -2)))] }))
    expect(check('-1+2i')).toBe('correct')
    expect(check('3-2i')).toBe('knownError:frac-imag-direct')
    expect(check('-1+10i')).toBe('knownError:frac-imag-split')
    expect(check('\\frac{11}{5}+2i')).toBe('knownError:frac-imag-squared')
  })

  it('mit Buchstaben: die Tastatur hat i, Buchstaben ohne i', () => {
    const t = task({ kind: 'imaginary', terms: [plus(fr(num(1), add(a, mul(b, IMAG))))] })
    expect(prepareFractionCheck(t).letters).toEqual(['a', 'b'])
    expect(prepareFractionCheck(t).imag).toBe(true)
    const check = checker(t)
    expect(check('\\frac{a}{a^2+b^2}-\\frac{b}{a^2+b^2}i')).toBe('correct')
    expect(check('\\frac{a-bi}{a^2+b^2}')).toBe('correct')
  })
})

describe.each([1, 2, 3, 4, 5] as Level[])('Zufallsaufgaben, Stufe %i', (level) => {
  const tasks = Array.from({ length: 200 }, (_, i) => ({ seed: i + 1, ...generateFractionTask({ level, seed: i + 1 }) }))

  it('nimmt das Ergebnis der Engine an, Zwischenschritte nie als falsch', () => {
    for (const { seed, task: t } of tasks) {
      const context = prepareFractionCheck(t)
      const context0 = `${level}-${seed}: ${taskLatex(t)}`
      expect(short(checkFractionAnswer(context, toLatex(context.solution.result))), context0).toBe('correct')
      for (const step of context.solution.steps) {
        // beim Rechenbaum zeigen nur diese Schritte den ganzen Zwischenstand (die anderen einen Teil)
        if (!step.expr || (t.kind === 'tree' && step.kind !== 'decimal' && step.kind !== 'part')) continue
        // Teleskopsumme: Zerlegen zeigt nur den Summanden, nicht die Summe
        if (t.kind === 'telescope' && (step.kind === 'factor-den' || step.kind === 'tele-split')) continue
        const verdict = checkFractionAnswer(context, toLatex(step.expr))
        expect(['correct', 'unfinished'], `${context0} ${step.kind}: ${toLatex(step.expr)}`).toContain(verdict.kind)
      }
      // die Aufgabe selbst ist noch nicht fertig (geteilt mit „:" liest die Tastatur nicht)
      if (isReadableTask(t)) expect(short(checkFractionAnswer(context, taskLatex(t))), context0).toMatch(/^unfinished/)
    }
  })

  it('erkennt die falschen Ergebnisse der typischen Fehler', () => {
    for (const { seed, task: t } of tasks) {
      const context = prepareFractionCheck(t)
      for (const w of context.wrongs) {
        if (!w.result) continue
        const verdict = checkFractionAnswer(context, toLatex(w.result))
        expect(verdict.kind, `${level}-${seed} ${w.rule.id}: ${toLatex(w.result)}`).toBe('knownError')
      }
    }
  })
})
