import { describe, expect, it } from 'vitest'
import { contains, subterms } from '../expr/compare.ts'
import { solveTask } from '../rearrange/isolate.ts'
import { taskLatex } from '../rearrange/task.ts'
import { createRng } from '../random/rng.ts'
import { rearrangeForm } from './forms.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { type Level, MAX_SEED } from './taskNumber.ts'
import { pickFresh, varietyStats } from './variety.ts'

// Abwechslung beim Umstellen (docs/PLAN-M3.md, 4. Fassung): Die Stufen aus dem Baukasten haben je
// Stufe viele Formen, keine zu häufig, und beim Ziehen keine Wiederholung.
const KIT_LEVELS: Level[] = [1, 2, 3, 4]

describe.each(KIT_LEVELS)('Abwechslung Stufe %i', (level) => {
  it('mindestens 100 Formen unter 200 Aufgaben, keine öfter als 3 von 100', () => {
    const stats = varietyStats(Array.from({ length: 200 }, (_, i) => rearrangeForm({ level, seed: i + 1 })))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('zehn neue Aufgaben nacheinander ohne doppelte Form', () => {
    const rng = createRng(`ziehen-umstellen:${level}`)
    const recent: string[] = []
    for (let i = 0; i < 10; i++) {
      const seed = pickFresh((s) => rearrangeForm({ level, seed: s }), recent, () => rng.int(1, MAX_SEED))
      recent.push(rearrangeForm({ level, seed }))
    }
    expect(new Set(recent).size).toBe(10)
  })
})

describe('Baukasten der Stufen 1 bis 4', () => {
  const tasks = (level: Level) => Array.from({ length: 200 }, (_, i) => generateRearrangeTask({ level, seed: i + 1 }).task)
  const count = (side: Parameters<typeof subterms>[0], t: string) => subterms(side).filter((s) => s.kind === 'var' && s.name === t).length

  it('Stufe 1: die gesuchte Variable kommt genau einmal vor, mindestens drei Umformungen', () => {
    for (const t of tasks(1)) {
      expect(count(t.equation.lhs, t.target) + count(t.equation.rhs, t.target)).toBe(1)
      expect(solveTask(t)!.steps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('Stufe 2: die gesuchte Variable kommt mehrfach vor oder steht im Nenner', () => {
    for (const t of tasks(2)) {
      const times = count(t.equation.lhs, t.target) + count(t.equation.rhs, t.target)
      const inDenominator = [t.equation.lhs, t.equation.rhs].some((side) => subterms(side).some((s) => s.kind === 'div' && contains(s.den, t.target)))
      expect(times >= 2 || inDenominator).toBe(true)
    }
  })

  it('Stufe 3: Kerne ineinander, im Mittel mindestens 6 Umformungen, jede mindestens 5', () => {
    const lengths = tasks(3).map((t) => solveTask(t)!.steps.length)
    expect(Math.min(...lengths)).toBeGreaterThanOrEqual(5)
    expect(lengths.reduce((a, b) => a + b, 0) / lengths.length).toBeGreaterThanOrEqual(6)
  })

  it('Stufe 3: Wurzel aus einer Klammer im Quadrat nur mit Bedingung, die das Vorzeichen festlegt', () => {
    for (const t of tasks(3)) {
      // (x - b)^2 = … braucht x > b, sonst gibt es zwei Lösungen; (x + b)^2 ist ohnehin positiv
      const root = solveTask(t)!.steps.find((s) => s.kind === 'root')
      const base = root && (root.after.lhs.kind === 'add' ? root.after.lhs : root.after.rhs)
      if (base?.kind === 'add' && base.terms.some((x) => x.kind === 'neg')) expect(t.conditions.length, taskLatex(t)).toBeGreaterThan(0)
    }
  })

  it('Stufe 4: verschachtelt, im Mittel mindestens 7 Umformungen, jede mindestens 6', () => {
    const lengths = tasks(4).map((t) => solveTask(t)!.steps.length)
    expect(Math.min(...lengths)).toBeGreaterThanOrEqual(6)
    expect(lengths.reduce((a, b) => a + b, 0) / lengths.length).toBeGreaterThanOrEqual(7)
  })

  it('Stufe 4: in jeder Aufgabe e-Funktion, Logarithmus oder Wurzeln in Wurzeln (oder die pq-Formel)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const g = generateRearrangeTask({ level: 4, seed })
      if (g.template.id === 'baukasten-4-quadratisch') continue
      const t = g.task
      const parts = [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side))
      const blocks = parts.some((s) => s.kind === 'fn' || s.kind === 'log' || (s.kind === 'pow' && contains(s.exp, t.target)))
      const nested = parts.some((s) => s.kind === 'root' && subterms(s.arg).some((r) => r.kind === 'root'))
      expect(blocks || nested, taskLatex(t)).toBe(true)
    }
  })

  it('Stufe 4, Teil 6b: gut ein Drittel mit Winkel-, Hyperbel- oder Umkehrfunktion, die übrigen Nummern behalten ihre Aufgabe', () => {
    const generated = Array.from({ length: 200 }, (_, i) => generateRearrangeTask({ level: 4, seed: i + 1 }))
    const trig = generated.filter((g) => g.template.id === 'baukasten-4-winkel')
    expect(trig.length).toBeGreaterThanOrEqual(50)
    expect(trig.length).toBeLessThanOrEqual(90)
    // Aufgaben aus Teil 6a unter ihren alten Nummern
    expect(taskLatex(generated[0].task)).toBe('y = \\frac{\\sqrt{t + \\sqrt{s + \\sqrt{x}}}}{u}')
    expect(taskLatex(generated[12].task)).toBe('s + \\log_{10}(x + 9) - \\log_{10}(x - r) = y')
    expect(taskLatex(generated[84].task)).toBe('y = b + \\ln\\left(\\frac{x - a}{x + 6}\\right)')
    for (const { task: t } of trig) {
      const fns = [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).filter((s) => s.kind === 'fn' && s.name !== 'ln')
      expect(fns.length, taskLatex(t)).toBeGreaterThan(0)
      // Winkelfunktionen nur mit Bereich, damit die Umkehrfunktion die Lösung liefert
      const angle = fns.some((s) => s.kind === 'fn' && (s.name === 'sin' || s.name === 'cos' || s.name === 'tan'))
      if (angle) expect(t.conditions.some((c) => c.rel === '<' && subterms(c.rhs).some((s) => s.kind === 'const' && s.name === 'pi')), taskLatex(t)).toBe(true)
    }
  })

  it('Stufe 4, Teil 6c: gut ein Fünftel mit Substitution oder pq-Formel, die Nummern aus 6b behalten ihre Aufgabe', () => {
    const generated = Array.from({ length: 200 }, (_, i) => generateRearrangeTask({ level: 4, seed: i + 1 }))
    const quadratic = generated.filter((g) => g.template.id === 'baukasten-4-quadratisch')
    expect(quadratic.length).toBeGreaterThanOrEqual(25)
    expect(quadratic.length).toBeLessThanOrEqual(70)
    // Aufgaben aus Teil 6b unter ihren alten Nummern
    expect(taskLatex(generated[15].task)).toBe('n\\cos^{2} x = m - k\\sin^{2} x')
    expect(taskLatex(generated[72].task)).toBe('\\frac{p\\sin x + 3\\cos x}{q\\sin x + \\cos x} = y')
    for (const { task: t } of quadratic) {
      const steps = solveTask(t)!.steps
      expect(steps.some((s) => s.kind === 'pq'), taskLatex(t)).toBe(true)
      // die andere Lösung fällt weg, mit Begründung
      expect(steps.find((s) => s.kind === 'choose')?.reason, taskLatex(t)).toBeDefined()
      const angle = [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).some((s) => s.kind === 'fn' && (s.name === 'sin' || s.name === 'cos' || s.name === 'tan'))
      if (angle) expect(t.conditions.some((c) => c.rel === '<' && subterms(c.rhs).some((s) => s.kind === 'const' && s.name === 'pi')), taskLatex(t)).toBe(true)
    }
    // Substitution mit e^x, √x, Winkelfunktion, ln und x^2 kommt vor, ebenso die pq-Formel ohne Substitution
    const blocks = new Set(quadratic.map((g) => solveTask(g.task)!.substitution?.expr.kind ?? 'ohne'))
    expect([...blocks].sort()).toEqual(['fn', 'ohne', 'pow', 'root'])
  })

  it.each([1, 2, 3, 4] as Level[])('Stufe %i: meist nach x, manchmal nach einem anderen Buchstaben', (level) => {
    const letters = tasks(level).filter((t) => t.target !== 'x').length
    // in Stufe 4 ist bei Winkelfunktionen und der pq-Formel immer x gesucht
    expect(letters).toBeGreaterThanOrEqual(level === 4 ? 10 : 20)
    expect(letters).toBeLessThanOrEqual(80)
  })
})
