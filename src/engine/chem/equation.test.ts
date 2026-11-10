import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { rat, ratMul } from '../rational.ts'
import { GENERATED_MIN } from '../quiz/numbers.ts'
import { balance, coefficientsOf, equationCe, equationLatex, isBalanced, sideCounts, species, withCoefficients } from './equation.ts'
import { cardsInTopic, isChemExample } from '../explain/cards.ts'
import { generatedCalc } from './generators/index.ts'
import { CO2, FUELS, H2O, O2, REACTIONS } from './reactions.ts'

// Reaktionsgleichungen: Ausgleichen über die Atombilanz (Plan M4, Teil B „Tests", Rechnungen)

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b))
const gcdAll = (xs: bigint[]) => xs.reduce(gcd)

describe('Ausgleichen', () => {
  it('gleicht die Beispiele aus Skript und Plan aus', () => {
    expect(equationCe(balance([species('H2'), species('O2')], [species('H2O')])!)).toBe('2 H2 + O2 -> 2 H2O')
    expect(equationCe(balance([species('C4H10'), O2], [CO2, H2O])!)).toBe('2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O')
    expect(equationCe(balance([species('C8H18'), O2], [CO2, H2O])!)).toBe('2 C8H18 + 25 O2 -> 16 CO2 + 18 H2O')
    expect(equationCe(balance([CO2, H2O], [species('C6H12O6'), O2])!)).toBe('6 CO2 + 6 H2O -> C6H12O6 + 6 O2')
    expect(equationCe(balance([species('Na'), species('Cl2')], [species('NaCl')])!)).toBe('2 Na + Cl2 -> 2 NaCl')
  })

  it('erkennt Gleichungen ohne oder ohne eindeutige Lösung', () => {
    // kein Sauerstoff rechts
    expect(balance([species('H2'), species('O2')], [species('H2')])).toBeNull()
    // zwei unabhängige Lösungen: H2 + O2 -> H2O + H2O2
    expect(balance([species('H2'), species('O2')], [species('H2O'), species('H2O2')])).toBeNull()
  })

  it.each([...REACTIONS.map((r) => [r.id, r.reactants, r.products] as const), ...FUELS.map((f) => [f.id, [f.species, O2], [CO2, H2O]] as const)])(
    '%s: ausgeglichen mit den kleinsten positiven ganzen Zahlen, Vielfache auch ausgeglichen',
    (_id, reactants, products) => {
      const eq = balance(reactants, products)!
      expect(eq).not.toBeNull()
      expect(isBalanced(eq)).toBe(true)
      const cs = coefficientsOf(eq)
      for (const c of cs) {
        expect(c.d).toBe(1n)
        expect(c.n > 0n).toBe(true)
      }
      expect(gcdAll(cs.map((c) => c.n))).toBe(1n)
      expect(latexProblem(equationLatex(eq), { checkUgly: false })).toBeNull()
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 12 }), (k, d) => {
          const scaled = withCoefficients(eq, cs.map((c) => ratMul(c, rat(k, d))))
          expect(isBalanced(scaled)).toBe(true)
        }),
        { numRuns: 20 },
      )
      // ein Koeffizient um 1 verändert: nicht mehr ausgeglichen
      for (let i = 0; i < cs.length; i++) expect(isBalanced(withCoefficients(eq, cs.map((c, j) => (j === i ? rat(c.n + 1n) : c))))).toBe(false)
      // Erhaltung der Masse: gleich viele Atome je Element
      const left = sideCounts(eq.reactants)
      const right = sideCounts(eq.products)
      for (const [symbol, n] of left) expect(right.get(symbol), symbol).toEqual(n)
    },
  )
})

// Gleichung aus der mhchem-Schreibweise der App zurücklesen: „2 C4H10 + 13/2 O2 -> 8 CO2 + 10 H2O"
function parseCe(text: string) {
  const [left, right] = text.split(' -> ')
  const side = (part: string) =>
    part.split(' + ').map((term) => {
      const [, coef = '1', formula] = /^(?:(\d+(?:\/\d+)?) )?(.+)$/.exec(term)!
      const [n, d = '1'] = coef.split('/')
      return { species: species(formula), coefficient: rat(BigInt(n), BigInt(d)) }
    })
  return { reactants: side(left), products: side(right) }
}
const formulasOf = (eq: ReturnType<typeof parseCe>) => [...eq.reactants, ...eq.products].map((t) => t.species.text).join(' ')

describe('Rechnung „Ausgleichen": Antworten', () => {
  it.each([1, 2, 3] as const)('Stufe %i: Ergebnis ausgeglichen; falsche Gleichungen mit denselben Stoffen nie ausgeglichen', (level) => {
    for (let i = 0; i < 300; i++) {
      const task = generatedCalc('chem-gleichungen', { level, seed: GENERATED_MIN + i })!.task
      const result = parseCe(/^\\ce\{(.*)\}$/.exec(task.resultLatex!)![1])
      expect(isBalanced(result), task.resultLatex).toBe(true)
      for (const step of task.steps) {
        for (const c of step.choices) {
          const m = /^\$\\ce\{(.* -> .*)\}\$$/.exec(c.content)
          if (!m) continue
          const eq = parseCe(m[1])
          if (c.correct) expect(isBalanced(eq), c.content).toBe(true)
          // derselbe Stoff mit anderen Koeffizienten: nie ausgeglichen (auch kein Vielfaches)
          else if (formulasOf(eq) === formulasOf(result)) expect(isBalanced(eq), `${c.errorRuleId}: ${c.content}`).toBe(false)
          // sonst ein anderer Stoff: falscher Index, Einzelatom oder CO statt CO2
          else expect(['chem-balance-index', 'chem-balance-single-atom', 'chem-balance-co'], c.content).toContain(c.errorRuleId)
        }
      }
    }
  })
})

describe('Lernkarten „Reaktionsgleichungen": Gleichungen wie die Engine', () => {
  it('endet jedes Beispiel mit einer Gleichung mit den Koeffizienten der Engine', () => {
    let checked = 0
    for (const card of cardsInTopic('chem-gleichungen')) {
      for (const example of card.examples.filter(isChemExample)) {
        const last = [...example.lines].reverse().find((l) => l.latex?.includes('->'))
        if (!last) continue
        const eq = parseCe(/^\\ce\{(.*)\}$/.exec(last.latex!)![1])
        // Brüche (Zwischenschritt) nur in Zeilen davor
        expect(coefficientsOf(eq).every((c) => c.d === 1n), last.latex).toBe(true)
        expect(equationCe(eq), card.id).toBe(equationCe(balance(eq.reactants.map((t) => t.species), eq.products.map((t) => t.species))!))
        checked++
      }
    }
    expect(checked).toBeGreaterThanOrEqual(5)
  })
})
