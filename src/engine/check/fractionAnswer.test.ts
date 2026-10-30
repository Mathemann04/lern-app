import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, mul, num, pow, sub, variable, x } from '../expr/types.ts'
import { toFrac } from '../fraction/frac.ts'
import { type Poly, polyDivideExact } from '../fraction/poly.ts'
import { type FractionShape, type FractionTask, type Part, expanded, isReadableTask, minus, part, plus, taskLatex } from '../fraction/task.ts'
import { generateFractionTask } from '../tasks/fractionTerms.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { type FractionVerdict, checkFractionAnswer, prepareFractionCheck, prepareFractionFree } from './fractionAnswer.ts'

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const task = (s: FractionShape): FractionTask => ({ ...s, hints: [] }) as FractionTask

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
    // 4-1: (cos² x − 4)/(cos x + 2)
    expect(free.check('\\cos x-2').kind).toBe('correct')
    expect(free.check('\\frac{\\cos^2x-4}{\\cos x+2}').kind).toBe('unfinished')
  })
})

describe('Stufe 5: Bausteine mit Regeln', () => {
  const free = (seedLatex: string) => {
    for (let seed = 1; seed <= 400; seed++) {
      const g = generateFractionTask({ level: 5, seed })
      if (taskLatex(g.task) === seedLatex) return prepareFractionCheck(g.task)
    }
    throw new Error(`nicht gefunden: ${seedLatex}`)
  }
  const verdict = (context: ReturnType<typeof prepareFractionCheck>, latex: string) => short(checkFractionAnswer(context, latex))

  it('Wurzel: √x und x^{1/2} gelten, x = (√x)² wird verstanden', () => {
    const context = free('\\frac{x - 9}{\\sqrt{x} - 3}')
    expect(context.root).toBe(true)
    expect(verdict(context, '\\sqrt{x}+3')).toBe('correct')
    expect(verdict(context, 'x^{\\frac{1}{2}}+3')).toBe('correct')
    expect(verdict(context, '\\frac{x-9}{\\sqrt{x}-3}')).toBe('unfinished:not-reduced')
    expect(verdict(context, '\\sqrt{x}-3')).toBe('knownError:frac-binomial-confused')
  })

  it('sin² x + cos² x = 1: jede gleich lange Endform zählt', () => {
    const context = free('\\frac{3}{1 - \\sin x} + \\frac{3}{1 + \\sin x}')
    expect(verdict(context, '\\frac{6}{\\cos^2x}')).toBe('correct')
    expect(verdict(context, '\\frac{6}{1-\\sin^2x}')).toBe('correct')
    expect(verdict(context, '\\frac{6}{\\cos x}')).toBe('knownError:frac-square-forgotten')
  })

  it('tan x und sin x / cos x', () => {
    const context = free('\\frac{\\frac{1}{\\cos x} - \\cos x}{\\sin x}')
    expect(verdict(context, '\\tan x')).toBe('correct')
    expect(verdict(context, '\\frac{\\sin x}{\\cos x}')).toBe('correct')
    expect(verdict(context, '\\frac{\\sin^2x}{\\sin x\\cos x}')).toBe('unfinished:not-reduced')
  })

  it('e-Funktion und zwei Variablen', () => {
    expect(verdict(free('\\frac{e^{2x} - 4e^{x}}{e^{x}}'), 'e^2-4')).toBe('knownError:frac-cancel-inside')
    const quotient = free('\\frac{\\frac{4}{x + h} - \\frac{4}{x}}{h}')
    expect(quotient.letters).toEqual(['x', 'h'])
    expect(verdict(quotient, '-\\frac{4}{x(x+h)}')).toBe('correct')
    expect(verdict(quotient, '-\\frac{4}{x^2+hx}')).toBe('correct')
    expect(verdict(quotient, '\\frac{-\\frac{4h}{x(x+h)}}{h}')).toBe('unfinished:nested')
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
        if (!step.expr) continue
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
