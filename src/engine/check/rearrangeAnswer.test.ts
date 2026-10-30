import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, eq } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import type { RearrangeTask } from '../rearrange/task.ts'
import { generateRearrangeTask } from '../tasks/rearrangeTerms.ts'
import { checkRearrangeAnswer, prepareRearrangeCheck, prepareRearrangeFree, rearrangeFreeVerdict } from './rearrangeAnswer.ts'

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

const task = (lhs: string, rhs: string, target = 'x', conditions: RearrangeTask['conditions'] = []): RearrangeTask => ({ equation: eq(p(lhs), p(rhs)), target, conditions })
const check = (t: RearrangeTask, input: string) => checkRearrangeAnswer(prepareRearrangeCheck(t), input)

describe('Umstellen frei: richtige und fertige Ergebnisse', () => {
  const t = task('y', '\\frac{3(x-a)}{b}+c')

  it('nimmt das Ergebnis mit und ohne „x =" an, auch andersherum', () => {
    expect(check(t, '\\frac{by-bc+3a}{3}')).toEqual({ kind: 'correct' })
    expect(check(t, 'x=\\frac{by-bc+3a}{3}')).toEqual({ kind: 'correct' })
    expect(check(t, '\\frac{3a+by-bc}{3}=x')).toEqual({ kind: 'correct' })
    expect(check(t, '\\frac{b(y-c)+3a}{3}')).toEqual({ kind: 'unfinished', reason: 'numerator' })
    expect(check(t, '\\frac{1}{3}(by-bc+3a)')).toEqual({ kind: 'correct' })
  })

  it('gleichwertige Formen mit anderen Vorzeichen zählen', () => {
    const both = task('ax+b', 'cx+d')
    expect(check(both, '\\frac{d-b}{a-c}')).toEqual({ kind: 'correct' })
    expect(check(both, '\\frac{b-d}{c-a}')).toEqual({ kind: 'correct' })
    expect(check(both, '-\\frac{b-d}{a-c}')).toEqual({ kind: 'correct' })
  })

  it('ausgeklammerte Buchstaben sind erlaubt', () => {
    const t3 = task('\\frac{x-3a}{x-a}', 'b')
    expect(check(t3, '\\frac{a(b-3)}{b-1}')).toEqual({ kind: 'correct' })
    expect(check(t3, '\\frac{ab-3a}{b-1}')).toEqual({ kind: 'correct' })
  })

  it('Wurzeln: ein Bruch unter der Wurzel oder im Quadrat zählt wie ein Bruch', () => {
    const circle = task('y', '2\\sqrt{a^2-x^2}')
    expect(check(circle, '\\frac{\\sqrt{4a^2-y^2}}{2}')).toEqual({ kind: 'correct' })
    expect(check(circle, '\\sqrt{\\frac{4a^2-y^2}{4}}')).toEqual({ kind: 'correct' })
    expect(check(circle, '\\sqrt{a^2-\\frac{y^2}{4}}')).toEqual({ kind: 'unfinished', reason: 'several' })
    const diff = task('y', '\\sqrt{x+a}-\\sqrt{x}')
    expect(check(diff, '\\frac{(a-y^2)^2}{4y^2}')).toEqual({ kind: 'correct' })
    expect(check(diff, '\\left(\\frac{a-y^2}{2y}\\right)^2')).toEqual({ kind: 'correct' })
  })
})

describe('Umstellen frei: noch nicht fertig', () => {
  const t = task('y', '\\frac{3(x-a)}{b}+c')

  it('mehrere Brüche, Doppelbruch, nicht gekürzt', () => {
    expect(check(t, '\\frac{b(y-c)}{3}+a')).toEqual({ kind: 'unfinished', reason: 'several' })
    expect(check(t, '\\frac{by-bc}{3}+a')).toEqual({ kind: 'unfinished', reason: 'several' })
    expect(check(t, '\\frac{2by-2bc+6a}{6}')).toEqual({ kind: 'unfinished', reason: 'not-reduced' })
    expect(check(t, '\\frac{\\frac{b(y-c)}{3}+a}{1}')).toEqual({ kind: 'unfinished', reason: 'nested' })
    expect(check(t, '\\frac{by-bc+2a+a}{3}')).toEqual({ kind: 'unfinished', reason: 'numerator' })
  })

  it('x noch auf beiden Seiten oder nicht allein: richtig umgeformt, aber nicht aufgelöst', () => {
    const both = task('a(x+b)', 'c(x-d)')
    expect(check(both, '\\frac{cx-cd-ab}{a}')).toEqual({ kind: 'unfinished', reason: 'not-isolated' })
    expect(check(both, 'x(c-a)=ab+cd')).toEqual({ kind: 'unfinished', reason: 'not-isolated' })
    // gilt immer, sagt nichts über x; gilt nicht für die Lösung
    expect(check(both, 'x')).toEqual({ kind: 'wrong' })
    expect(check(both, '2x')).toEqual({ kind: 'wrong' })
    expect(check(both, 'x(c-a)=ab-cd')).toEqual({ kind: 'wrong' })
  })
})

describe('Umstellen frei: Fehler', () => {
  it('erkennt typische Fehler', () => {
    const both = task('a(x+b)', 'c(x-d)')
    const v = check(both, '\\frac{c-a}{ab+cd}')
    expect(v.kind).toBe('knownError')
    if (v.kind === 'knownError') expect(v.wrong.rule.id).toBe('eq-fraction-flipped')
    const circle = task('y', '2\\sqrt{a^2-x^2}')
    const root = check(circle, 'a-\\frac{y}{2}')
    expect(root.kind === 'knownError' && root.wrong.rule.id).toBe('eq-root-termwise')
  })

  it('falsches Vorzeichen', () => {
    expect(check(task('ax+b', 'cx+d'), '\\frac{d-b}{c-a}')).toEqual({ kind: 'wrongSign' })
  })

  it('unlesbar: fremde Buchstaben, Großbuchstaben, zwei Gleichheitszeichen', () => {
    const t = task('y', 'm(x-a)+b', 'm')
    expect(check(t, 'z')).toEqual({ kind: 'unreadable', message: 'In der Aufgabe kommen nur $a$, $b$, $m$, $x$ und $y$ vor. Was soll $z$ bedeuten?' })
    expect(check(t, '\\frac{Y-b}{x-a}')).toEqual({ kind: 'unreadable', message: 'Schreibe $y$ bitte klein.' })
    expect(check(t, 'm=1=1').kind).toBe('unreadable')
    expect(check(t, 'm=').kind).toBe('unreadable')
  })

  it('Texte für die Oberfläche', () => {
    expect(rearrangeFreeVerdict({ kind: 'unfinished', reason: 'not-isolated' }, 'x').message).toContain('$x$ muss allein')
    const free = prepareRearrangeFree({ level: 3, seed: 3 })
    expect(free.answerLabel).toBe('x =')
    expect(free.keyboard).toMatchObject({ kind: 'rearrange', root: true })
  })
})

describe('Umstellen frei: Zufallsaufgaben der Stufen 1 bis 3', () => {
  for (const level of [1, 2, 3] as const) {
    it(`Stufe ${level}: Lösung richtig, falsche Ergebnisse als Fehler erkannt`, () => {
      for (let seed = 1; seed <= 80; seed++) {
        const t = generateRearrangeTask({ level, seed }).task
        const context = prepareRearrangeCheck(t)
        const label = `${level}-${seed}: ${toLatex(t.equation.lhs)} = ${toLatex(t.equation.rhs)}`
        const result = toLatex(context.solution.result)
        expect(context.points.length, label).toBeGreaterThanOrEqual(12)
        expect(checkRearrangeAnswer(context, result), `${label}: ${result}`).toEqual({ kind: 'correct' })
        expect(checkRearrangeAnswer(context, `${t.target} = ${result}`), label).toEqual({ kind: 'correct' })
        for (const w of context.wrongs) {
          if (!w.result) continue
          const verdict = checkRearrangeAnswer(context, toLatex(w.result))
          expect(verdict.kind, `${label}: ${w.rule.id} ${toLatex(w.result)}`).toBe('knownError')
        }
      }
    }, 60_000)
  }
})
