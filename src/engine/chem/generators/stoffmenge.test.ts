import { describe, expect, it } from 'vitest'
import { cardById } from '../../explain/cards.ts'
import { isChemExample } from '../../explain/cards.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import type { Level } from '../../tasks/taskNumber.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { IUPAC } from '../iupac.testdata.ts'
import { substanceById } from '../substances.ts'
import { generatedCalc } from './index.ts'

// „Stoffmenge und Umsatz" (S3a): Ergebnisse auf zweitem Weg, mit Gleitkommazahlen und den genaueren
// IUPAC-Werten bzw. aus den gegebenen Angaben nachgerechnet

const COURSE = 'chem-stoffmenge'
const NA = 6.022e23
const refs = (level: Level, count = 400) => Array.from({ length: count }, (_, i) => ({ level, seed: GENERATED_MIN + i }))

// Zahl aus der LaTeX-Schreibweise: „3{,}01 \cdot 10^{23}", „74{,}1"
function numberOf(latex: string): number {
  const match = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex)
  if (!match) throw new Error(latex)
  return Number(match[1].replace('{,}', '.')) * 10 ** Number(match[2] ?? 0)
}
// Zahl rechts vom letzten „=" bzw. „≈"
const lastNumber = (latex: string) => numberOf(latex.split(/=|\\approx/).at(-1)!)

const iupacMass = (formula: string) => [...atomCounts(parseFormula(formula))].reduce((sum, [symbol, n]) => sum + n * IUPAC[symbol], 0)

describe('Molmasse: auf zweitem Weg', () => {
  it.each([1, 2, 3] as const)('Stufe %i: liegt höchstens 1 % neben dem Wert mit IUPAC-Atommassen', (level) => {
    let seen = 0
    for (const ref of refs(level)) {
      const calc = generatedCalc(COURSE, ref)!
      if (!calc.form.startsWith('molmasse:')) continue
      seen++
      const shown = lastNumber(calc.task.resultLatex!)
      const exact = iupacMass(calc.substance)
      expect(Math.abs(shown / exact - 1), `${calc.substance}: ${shown} statt ${exact}`).toBeLessThan(0.01)
      // die Aufgabe nennt die Werte jedes Elements
      for (const symbol of atomCounts(parseFormula(calc.substance)).keys()) expect(calc.task.note, symbol).toContain(String.raw`M(\ce{${symbol}})`)
    }
    expect(seen).toBeGreaterThan(50)
  })
})

describe('Stoffmenge, Masse und Teilchenzahl: auf zweitem Weg', () => {
  it.each([1, 2, 3] as const)('Stufe %i: Ergebnis passt zu den Angaben', (level) => {
    const kinds = new Set<string>()
    for (const ref of refs(level)) {
      const calc = generatedCalc(COURSE, ref)!
      if (!calc.form.startsWith('stoffmenge:')) continue
      const subtype = calc.form.split(':')[2]
      kinds.add(subtype)
      const given = lastNumber(calc.task.functionLatex!)
      const result = lastNumber(calc.task.resultLatex!)
      // M aus m und n (Probe eines unbekannten Stoffs): M = m / n, passend zum Stoff der Erklärung
      if (subtype === 'M-from-m-n') {
        const m = numberOf(calc.task.functionLatex!)
        expect(Math.abs(result / (m / given) - 1), calc.task.functionLatex!).toBeLessThan(0.006)
        expect(Math.abs(result / iupacMass(calc.substance) - 1), calc.substance).toBeLessThan(0.01)
        expect(calc.task.steps.at(-1)!.explanation.detailed).toContain(substanceById(calc.substance)!.name)
        continue
      }
      // M mit den Werten der Aufgabe: aus dem Schritt „Molmasse" oder aus der Aufgabe
      const molarStep = calc.task.steps.find((s) => s.id === 'molmasse')
      const fromNote = /M\(\\ce\{[^}]+\}\) = ([^$]+)\$/.exec(calc.task.note!)
      const s = substanceById(calc.substance)!
      // „N aus n" braucht keine Molmasse
      const mass = molarStep ? lastNumber([molarStep.established].flat()[0]!.replace(/\\,\\mathrm\{g\/mol\}/, '')) : fromNote ? numberOf(fromNote[1]) : iupacMass(s.id)
      expect(Math.abs(mass / iupacMass(s.id) - 1), s.id).toBeLessThan(0.01)
      const expected: Record<string, number> = {
        'n-from-m': given / mass,
        'm-from-n': given * mass,
        'N-from-n': given * NA,
        'N-from-m': (given / mass) * NA,
        'm-from-N': (given / NA) * mass,
      }
      let value = expected[subtype]
      if (subtype === 'atoms-from-m') {
        const symbol = /N\(\\ce\{([A-Z][a-z]?)\}\)/.exec(calc.task.resultLatex!)![1]
        value = (given / mass) * NA * atomCounts(s.formula).get(symbol)!
      }
      // auf drei Ziffern gerundet, Zwischenwerte exakt
      expect(Math.abs(result / value - 1), `${calc.task.functionLatex} → ${calc.task.resultLatex}`).toBeLessThan(0.006)
      // falsche Antworten mindestens 6 % neben der richtigen
      for (const step of calc.task.steps) {
        const right = numberOf(step.choices.find((c) => c.correct)!.content)
        for (const c of step.choices.filter((c) => !c.correct)) if (/\d/.test(c.content) && !c.content.includes(':')) expect(Math.abs(numberOf(c.content) / right - 1)).toBeGreaterThan(0.06)
      }
    }
    expect(kinds.size).toBe(level === 3 ? 3 : 4)
  })
})

describe('Stoffmenge: Rechenweg aus den angezeigten Zahlen', () => {
  it.each([1, 2, 3] as const)('Stufe %i: Jeder Folgeschritt rechnet mit dem angezeigten Ergebnis des Schritts davor', (level) => {
    const chained = ['stoffmenge', 'teilchen', 'masse', 'atome-element']
    let checked = 0
    for (const ref of refs(level)) {
      const steps = generatedCalc(COURSE, ref)!.task.steps.filter((x) => chained.includes(x.id))
      for (let i = 1; i < steps.length; i++) {
        const previous = steps[i - 1].choices.find((c) => c.correct)!.content.replace(/^\$|\$$/g, '').replace(/\\,\\mathrm\{[^}]*\}$/, '')
        const line = [steps[i].established].flat()[0]!
        expect(line, `${level}-${ref.seed}`).toContain(previous)
        // das angezeigte Ergebnis ergibt sich aus den angezeigten Zahlen (auf drei Ziffern gerundet)
        const p = numberOf(previous)
        const shown = numberOf(steps[i].choices.find((c) => c.correct)!.content)
        const factor =
          steps[i].id === 'teilchen'
            ? NA
            : steps[i].id === 'atome-element'
              ? Number(/= (\d+) \\cdot/.exec(line)![1])
              : steps[i].id === 'masse'
                ? numberOf(/\\cdot ([\d{},]+)\\,\\mathrm\{g\/mol\}/.exec(line)![1])
                : null
        if (factor !== null) expect(shown, line).toBeCloseTo(Number((p * factor * (1 + 1e-12)).toPrecision(3)), -Math.floor(Math.log10(shown)) + 4)
        checked++
      }
    }
    if (level > 1) expect(checked).toBeGreaterThan(50)
  })
})

describe('Lernkarten „Stoffmenge und Umsatz": Zahlen wie die Engine', () => {
  // Ergebniszeile jedes Beispiels, nachgerechnet
  const results = (id: string) =>
    cardById(id)!
      .examples.filter(isChemExample)
      .flatMap((e) => e.lines.filter((l) => l.label === 'Ergebnis').map((l) => lastNumber(l.latex!)))

  it('stimmen', () => {
    expect(results('stoffmenge-mol')).toEqual([expect.closeTo(0.5 * NA, -21), 2])
    expect(results('stoffmenge-molmasse')).toEqual([44, 58])
    expect(results('stoffmenge-n-m-m')).toEqual([0.1, 9])
    expect(results('stoffmenge-formeln')).toEqual([74.1, 249.6])
    expect(Math.abs(iupacMass('Ca(OH)2') / 74.1 - 1)).toBeLessThan(0.002)
    expect(Math.abs(iupacMass('CuSO4*5H2O') / 249.6 - 1)).toBeLessThan(0.002)
  })
})
