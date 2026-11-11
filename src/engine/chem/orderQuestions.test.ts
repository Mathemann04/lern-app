import { describe, expect, it } from 'vitest'
import { ratToNumber } from '../rational.ts'
import { CONCENTRATION_ORDER, CONCENTRATION_ORDER_ITEMS } from './bank/loesungen.ts'
import { DG_ORDER_KJ, ENERGIE_BANK } from './bank/energie.ts'
import { K_ORDER_EXPONENTS, MWG_BANK } from './bank/mwg.ts'
import { MOLAR_MASS_ORDER, PARTICLE_ORDER } from './bank/stoffmenge.ts'
import { molarMass } from './molarMass.ts'
import { substanceById } from './substances.ts'

// Ordnen (N1c): Gegenproben der Reihenfolgen, die die App selbst ausrechnet. Benachbarte Glieder liegen mindestens
// 3 % auseinander, damit Rundung nichts an der Reihenfolge ändert; jede Vertauschung ist genau die Reihenfolge, die
// der typische Fehler ergibt.

const GAP = 1.03
const M = (id: string, mode = {}) => ratToNumber(molarMass(substanceById(id)!.formula, 'pse', mode))
const Mr = (id: string) => ratToNumber(molarMass(substanceById(id)!.formula, 'rounded'))
const expectStrictlyRising = (values: readonly number[], context: string) => {
  for (let i = 1; i < values.length; i++) expect(values[i] / values[i - 1], `${context}: Glied ${i + 1}`).toBeGreaterThanOrEqual(GAP)
}
const swaps = (q: { traps: readonly { kind: string }[] }) => q.traps.filter((t): t is { kind: 'swap'; before: string; after: string; misconception: string } => t.kind === 'swap')

describe('Ordnen: Gegenproben', () => {
  it('molare Massen steigen mit deutlichem Abstand; ohne Klammer bzw. Kristallwasser kippt die Vertauschung', () => {
    const ids = MOLAR_MASS_ORDER.items.map((i) => i.id)
    expectStrictlyRising(ids.map((id) => M(id)), MOLAR_MASS_ORDER.id)
    for (const t of swaps(MOLAR_MASS_ORDER)) {
      const mode = t.misconception === 'chem-mis-st-bracket' ? { bracketOnLast: true } : { withoutAdducts: true }
      expect(M(t.before, mode), `${t.before} mit dem Fehler`).toBeLessThan(M(t.after))
    }
  })

  it('gleich schwere Portionen: Teilchenzahl fällt mit deutlichem Abstand', () => {
    const ids = PARTICLE_ORDER.items.map((i) => i.id)
    expectStrictlyRising(ids.map((id) => Mr(id)), PARTICLE_ORDER.id)
  })

  it('Konzentrationen fallen mit deutlichem Abstand; die Vertauschungen folgen Gramm je Liter bzw. der Masse', () => {
    const grams = (id: string) => Number(CONCENTRATION_ORDER_ITEMS.find((x) => x.id === id)!.grams.replace('{,}', '.'))
    const liters = (id: string) => CONCENTRATION_ORDER_ITEMS.find((x) => x.id === id)!.mL / 1000
    const c = (id: string) => grams(id) / M(id) / liters(id)
    const ids = CONCENTRATION_ORDER.items.map((i) => i.id)
    expectStrictlyRising([...ids].reverse().map(c), CONCENTRATION_ORDER.id)
    // Werte der Erklärung
    expect(ids.map((id) => Math.round(c(id) * 1000) / 1000)).toEqual([0.8, 0.5, 0.4, 0.2, 0.1])
    for (const t of swaps(CONCENTRATION_ORDER)) {
      if (t.misconception === 'chem-mis-lo-c-mixup') expect(grams(t.before) / liters(t.before)).toBeGreaterThan(grams(t.after) / liters(t.after))
      else expect(grams(t.before)).toBeGreaterThan(grams(t.after))
    }
  })

  it('Lage nach K und K aus ΔG⁰ (25 °C) fallen mit deutlichem Abstand', () => {
    const kOrder = MWG_BANK.questions.find((q) => q.id === 'gg-v-ordnen-k-lage')!
    expect(kOrder.kind === 'order' && kOrder.items.map((i) => i.id)).toEqual(K_ORDER_EXPONENTS.map((e) => `k${e}`))
    expectStrictlyRising([...K_ORDER_EXPONENTS].reverse().map((e) => 10 ** e), 'K')
    const dgOrder = ENERGIE_BANK.questions.find((q) => q.id === 'en-k-ordnen-dg-k')!
    expect(dgOrder.kind === 'order' && dgOrder.items.map((i) => i.id)).toEqual(DG_ORDER_KJ.map((dg) => `dg${dg}`))
    const k = (dg: number) => Math.exp((-dg * 1000) / (8.314 * 298.15))
    expectStrictlyRising([...DG_ORDER_KJ].reverse().map(k), 'K aus ΔG⁰')
  })
})
