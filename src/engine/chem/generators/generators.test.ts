import { describe, expect, it } from 'vitest'
import { courseById } from '../../../ui/catalog.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import type { GuidedTaskBase } from '../../guided/types.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import { varietyStats } from '../../tasks/variety.ts'
import type { Level } from '../../tasks/taskNumber.ts'
import { elementBySymbol } from '../elements.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { calcForm, generatedCalc, generatorOf, generatorsOf } from './index.ts'
import { LIGHT_SOURCES, RYDBERG_TRANSITIONS, SCRIPT_TRANSITIONS, type Transition, lightValues, rydbergValues } from './light.ts'
import { formatText } from '../../quantity/numberDe.ts'

// Rechnungen des Atombaus (Plan M4, Teil B „Tests", Rechnungen): Form der Aufgaben, Ergebnis auf
// zweitem Weg, falsche Antworten, Schreibweise, Abwechslung je Stufe

const COURSE = 'chem-atombau'
// alle Themen mit Rechnungen
const CALC_COURSES = ['chem-atombau', 'chem-stoffmenge', 'chem-gleichungen', 'chem-loesungen', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-elektronen', 'chem-pse', 'chem-trends', 'chem-mwg', 'chem-energie']
// Abweichung mit Begründung (docs/PLAN-M4.md, S3b): Es gibt nur etwa 15 bis 25 sinnvolle Reaktionen bzw.
// Brennstoffe je Stufe; dort zählt, dass jede vorkommt und keine deutlich öfter als die anderen
const VARIETY: Readonly<Record<string, { distinct: number; maxShare: number }>> = {
  'chem-gleichungen': { distinct: 15, maxShare: 0.12 },
  // S5b: Es gibt nur etwa 40 sinnvolle Moleküle ohne Formalladungen, in den Grundlagen etwa 30
  'chem-molekuele': { distinct: 40, maxShare: 0.06 },
  // S5c: in den Grundlagen nur „stärkste Kraft“ mit etwa 30 Stoffen
  'chem-zmk': { distinct: 28, maxShare: 0.07 },
  // S5d: in den Grundlagen nur Hybridisierung an etwa 25 Atomen, sp und sp² mit wenigen Atomen
  'chem-metalle': { distinct: 20, maxShare: 0.1 },
  // S6a: in den Grundlagen nur die Elemente H bis Ar und wenige Schalen und Unterschalen (etwa 50 sinnvolle Formen)
  'chem-elektronen': { distinct: 45, maxShare: 0.06 },
  // S6c: etwa 30 Hauptgruppenelemente, 20 Ionen und 10 Elemente mit Ionisierungsenergien
  'chem-pse': { distinct: 40, maxShare: 0.07 },
  // S7a: etwa 20 Gasgleichgewichte; in den Grundlagen nur das Massenwirkungsgesetz (Zähler oder Nenner je Gleichgewicht)
  'chem-mwg': { distinct: 30, maxShare: 0.06 },
  // S7b: in den Grundlagen 17 Bildungen aus den Elementen und etwa 20 Phasenübergänge
  'chem-energie': { distinct: 30, maxShare: 0.06 },
}
const LEVELS: readonly Level[] = [1, 2, 3]
const SAMPLE = 400
const tasksOf = (level: Level, count = SAMPLE) => Array.from({ length: count }, (_, i) => ({ level, seed: GENERATED_MIN + i }))

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN(?![A-Z0-9])|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
    else expect(segment.text, `${context}: Unicode-Index außerhalb von $…$`).not.toMatch(/[₀-₉⁰-⁹⁺⁻]/)
  }
}

const latexOk = (latex: string, context: string) => expect(latexProblem(latex, { checkUgly: false }), `${context}: ${latex}`).toBeNull()

// Zahl aus der LaTeX-Schreibweise, z. B. „3{,}06 \cdot 10^{-19}"
function numberOf(latex: string): number {
  const match = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex)
  if (!match) throw new Error(latex)
  return Number(match[1].replace('{,}', '.')) * 10 ** Number(match[2] ?? 0)
}

const ERROR_IDS = new Set(CHEM_ERROR_RULES.map((r) => r.id))

describe.each(CALC_COURSES)('Rechnungen %s: Aufbau jeder Aufgabe', (COURSE) => {
  it.each(LEVELS)('Stufe %i: Schritte mit genau einer richtigen Antwort und typischen Fehlern', (level) => {
    for (const ref of tasksOf(level)) {
      const calc = generatedCalc(COURSE, ref)!
      const task: GuidedTaskBase = calc.task
      const context = `${level}-${ref.seed}`
      expect(task.ref).toEqual(ref)
      expect(task.steps.length, context).toBeGreaterThan(0)
      for (const step of task.steps) {
        expect(step.choices.filter((c) => c.correct), context).toHaveLength(1)
        expect(step.choices.length, context).toBeGreaterThanOrEqual(2)
        expect(step.choices.length, context).toBeLessThanOrEqual(4)
        const contents = step.choices.map((c) => c.content)
        expect(new Set(contents).size, `${context}: ${contents.join(' | ')}`).toBe(contents.length)
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(ERROR_IDS.has(c.errorRuleId!), `${context}: ${c.errorRuleId}`).toBe(true)
          expect(generatorOf(COURSE, ref)!.errors, context).toContain(c.errorRuleId)
          expect(c.whyWrong?.detailed, context).toBeTruthy()
        }
        expect(step.cards.length, context).toBeGreaterThan(0)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...contents]) expectRenderable(text, context)
        for (const line of [step.established ?? []].flat()) latexOk(line, context)
      }
      if (task.functionLatex) latexOk(task.functionLatex, context)
      if (task.resultLatex) latexOk(task.resultLatex, context)
      for (const text of [task.instruction, task.note ?? '', task.resultText ?? '']) if (text) expectRenderable(text, context)
    }
  })

  it('gibt für dieselbe Nummer dieselbe Aufgabe', () => {
    for (const level of LEVELS) for (const ref of tasksOf(level, 20)) expect(generatedCalc(COURSE, ref)).toEqual(generatedCalc(COURSE, ref))
  })

  it('hat Rechenarten nur in Stufen mit Rechnungen, mit Unterthemen des Themas', () => {
    const parts = new Set(courseById(COURSE)!.course.parts!.map((p) => p.id))
    for (const level of LEVELS) {
      expect(generatorsOf(COURSE, level).length, `Stufe ${level}`).toBeGreaterThan(0)
      for (const g of generatorsOf(COURSE, level)) {
        expect(parts.has(g.part), g.kind).toBe(true)
        expect(courseById(COURSE)!.course.parts!.find((p) => p.id === g.part)!.levels, g.kind).toContain(level)
      }
    }
    expect(generatorsOf(COURSE, 4)).toEqual([])
    expect(generatedCalc(COURSE, { level: 4, seed: GENERATED_MIN })).toBeNull()
  })
})

describe('Protonen, Neutronen, Elektronen: Ergebnis auf zweitem Weg', () => {
  // „$\ce{^{37}_{17}Cl^-}$: 17 Protonen, 20 Neutronen, 18 Elektronen"
  const LINE = /^\$\\ce\{\^\{(\d+)\}_\{(\d+)\}([A-Z][a-z]?)(?:\^(?:\{(\d)([+-])\}|([+-])))?\}\$: (\d+) Proton(?:en)?, (\d+) Neutron(?:en)?, (\d+) Elektron(?:en)?$/

  it.each(LEVELS)('Stufe %i: Kernsymbol, Element und Teilchenzahlen passen zusammen', (level) => {
    let ions = 0
    for (const ref of tasksOf(level)) {
      const calc = generatedCalc(COURSE, ref)!
      if (!calc.form.startsWith('pne:')) continue
      for (const line of calc.task.resultText!.split('\n')) {
        const m = LINE.exec(line)
        expect(m, line).not.toBeNull()
        const [, a, z, symbol, size, sign, single, p, n, e] = m!
        const charge = sign ? Number(size) * (sign === '+' ? 1 : -1) : single ? (single === '+' ? 1 : -1) : 0
        if (charge !== 0) ions++
        expect(elementBySymbol(symbol)?.z, line).toBe(Number(z))
        expect(elementBySymbol(symbol)?.isotopes, line).toContain(Number(a))
        if (charge !== 0) expect(elementBySymbol(symbol)?.ions, line).toContain(charge)
        // Protonen + Neutronen = Massenzahl, Protonen − Elektronen = Ladung
        expect(Number(p) + Number(n), line).toBe(Number(a))
        expect(Number(p) - Number(e), line).toBe(charge)
        expect(Number(p), line).toBe(Number(z))
      }
      // die richtigen Antworten stehen in der Lösung
      for (const step of calc.task.steps) {
        const right = step.choices.find((c) => c.correct)!.content
        if (!step.id.endsWith('q') && /^\$\d+\$$/.test(right)) expect(calc.task.resultText! + calc.task.functionLatex!, right).toContain(right.slice(1, -1))
      }
    }
    if (level === 1) expect(ions).toBe(0)
    else expect(ions).toBeGreaterThan(SAMPLE / 4)
  })

  it('zeigt in den Grundlagen nur ungeladene Atome ohne Frage nach der Ladung', () => {
    for (const ref of tasksOf(1)) {
      const task = generatedCalc(COURSE, ref)!.task
      expect(task.steps.map((s) => s.id)).not.toContain('q')
    }
  })
})

describe('Energie des Lichts: Ergebnis auf zweitem Weg', () => {
  const h = 6.626e-34
  const c = 3e8

  it('rechnet mit E · λ = h · c und f · λ = c, auf drei Ziffern gerundet', () => {
    for (const source of LIGHT_SOURCES) {
      const energy = lightValues('energy', source.nm)
      expect(Number(energy.correct.n) / Number(energy.correct.d) / ((h * c) / (source.nm * 1e-9)) - 1).toBeCloseTo(0, 12)
      const frequency = lightValues('frequency', source.nm)
      expect(Number(frequency.correct.n) / Number(frequency.correct.d) / (c / (source.nm * 1e-9)) - 1).toBeCloseTo(0, 12)
      // aus der gerundeten Energie zurück: fast wieder die Wellenlänge der Quelle
      const wavelength = lightValues('wavelength', source.nm)
      expect(Math.abs(Number(wavelength.correct.n) / Number(wavelength.correct.d) / source.nm - 1)).toBeLessThan(0.006)
    }
  })

  it('zeigt Lösung und falsche Antworten, die zur Aufgabe passen', () => {
    let seen = 0
    for (const ref of tasksOf(2)) {
      const calc = generatedCalc(COURSE, ref)!
      if (!calc.form.startsWith('licht:')) continue
      seen++
      const [step] = calc.task.steps
      const given = numberOf(calc.task.functionLatex!)
      const right = numberOf(step.choices.find((c) => c.correct)!.content)
      // gegenprobe mit Gleitkommazahlen und den gerundeten Angaben
      const expected = calc.form === 'licht:energy' ? (h * c) / (given * 1e-9) : calc.form === 'licht:frequency' ? c / (given * 1e-9) : ((h * c) / given) * 1e9
      expect(Math.abs(right / expected - 1), calc.task.functionLatex).toBeLessThan(0.006)
      // falsche Antworten mindestens 6 % daneben, untereinander mindestens 3 %
      const wrong = step.choices.filter((c) => !c.correct).map((c) => numberOf(c.content))
      for (const w of wrong) expect(Math.abs(w / right - 1)).toBeGreaterThan(0.06)
      for (const [i, w] of wrong.entries()) for (const v of wrong.slice(i + 1)) expect(Math.abs(w / v - 1)).toBeGreaterThan(0.03)
      expect(calc.task.note).toContain('6{,}626')
    }
    expect(seen).toBeGreaterThan(SAMPLE / 10)
  })
})

describe('Rydberg-Formel: Ergebnis auf zweitem Weg', () => {
  const h = 6.626e-34
  const c = 3e8
  const R = 1.097e7
  const num = (r: { n: bigint; d: bigint }) => Number(r.n) / Number(r.d)
  // 1/λ = R · (1/n² − 1/m²) mit Gleitkommazahlen, m = null: Elektron ganz gelöst
  const inverse = (t: Transition) => R * (1 / t.lower ** 2 - (t.upper === null ? 0 : 1 / t.upper ** 2))

  it('rechnet die Hausaufgabe des Skripts richtig nach, ohne sie je als Aufgabe zu stellen', () => {
    // Sprung 3 → 2: rote Linie bei etwa 656 nm; Lösen aus dem Grundzustand: etwa 2,18 · 10⁻¹⁸ J
    expect(formatText(rydbergValues('wavelength', { upper: 3, lower: 2 }).correct)).toBe('656')
    expect(formatText(rydbergValues('ionization', { upper: null, lower: 1 }).correct)).toBe('2,18 · 10⁻¹⁸')
    for (const t of SCRIPT_TRANSITIONS) expect(RYDBERG_TRANSITIONS, JSON.stringify(t)).not.toContainEqual(t)
  })

  it('rechnet jeden Sprung wie mit Gleitkommazahlen, falsche Werte nie gleich der Lösung', () => {
    for (const t of RYDBERG_TRANSITIONS) {
      const kinds = t.upper === null ? (['ionization'] as const) : (['wavelength', 'energy'] as const)
      for (const kind of kinds) {
        const { correct, wrong } = rydbergValues(kind, t)
        const expected = kind === 'wavelength' ? 1e9 / inverse(t) : h * c * inverse(t)
        expect(num(correct) / expected - 1, `${kind} ${JSON.stringify(t)}`).toBeCloseTo(0, 12)
        for (const w of wrong) expect(Math.abs(num(w.value) / expected - 1), `${kind} ${w.rule}`).toBeGreaterThan(0.06)
      }
    }
  })

  it('stellt in der Vertiefung Aufgaben mit passender Lösung, nie die Hausaufgabe des Skripts', () => {
    let seen = 0
    for (const ref of tasksOf(2, 1200)) {
      const calc = generatedCalc(COURSE, ref)!
      if (!calc.form.startsWith('rydberg:')) continue
      seen++
      const [, upper, lower] = /^h-(\d+|inf)-(\d+)$/.exec(calc.substance)!
      const t: Transition = { upper: upper === 'inf' ? null : Number(upper), lower: Number(lower) }
      expect(SCRIPT_TRANSITIONS, calc.substance).not.toContainEqual(t)
      const [step] = calc.task.steps
      const right = numberOf(step.choices.find((x) => x.correct)!.content)
      const expected = calc.form.startsWith('rydberg:wavelength') ? 1e9 / inverse(t) : h * c * inverse(t)
      expect(Math.abs(right / expected - 1), calc.substance).toBeLessThan(0.006)
      expect(calc.task.note).toContain('1{,}097')
    }
    expect(seen).toBeGreaterThan(60)
  })
})

describe.each(CALC_COURSES)('Rechnungen %s: Abwechslung je Stufe (Kennzahlen aus M2b)', (COURSE) => {
  it.each(LEVELS)('Stufe %i: unter 200 Aufgaben mindestens 100 Formen, keine öfter als 3 von 100', (level) => {
    const forms = tasksOf(level, 200).map((ref) => calcForm(generatedCalc(COURSE, ref)!))
    const { distinct, maxShare } = varietyStats(forms)
    const goal = VARIETY[COURSE] ?? { distinct: 100, maxShare: 0.03 }
    expect(distinct).toBeGreaterThanOrEqual(goal.distinct)
    expect(maxShare).toBeLessThanOrEqual(goal.maxShare)
  })
})
