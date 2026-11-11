import { describe, expect, it } from 'vitest'
import { createRng } from '../../random/rng.ts'
import { moleculeById, vseprOf } from '../molecules.ts'
import { MO_SPECIES, bondOrderTask, domainsOf, dopeTask, hybridSites, hybridTask, piOf, sigmaOf, sigmaPiTask } from './metalle.ts'

// Rechnungen „Metallbindung und Hybridisierung" (S5d): Daten gegen eine zweite Liste, Katalogbeispiele der Rechenfehler

// Zweite, unabhängig eingetragene Liste: Bindungsordnungen (Lehrbuchwerte)
const BO: Readonly<Record<string, number>> = { H2: 1, 'H2+': 0.5, He2: 0, 'He2+': 0.5, Li2: 1, Be2: 0, B2: 1, C2: 2, N2: 3, 'N2+': 2.5, O2: 2, 'O2+': 2.5, 'O2-': 1.5, F2: 1, Ne2: 0 }
// Valenzelektronen je Atom (für die Summe bindend + antibindend)
const VE: Readonly<Record<string, number>> = { H: 1, He: 2, Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, Ne: 8 }

const wrongIn = (calc: { task: { steps: readonly { id: string; choices: readonly { errorRuleId?: string; content: string }[] }[] } } | null, step: string, rule: string) =>
  calc?.task.steps.find((s) => s.id === step)?.choices.find((c) => c.errorRuleId === rule)?.content

// erste Aufgabe einer Rechenart zu einem Stoff
function findTask<T extends { substance: string }>(make: (i: number) => T | null, substance: string): T {
  for (let i = 0; i < 3000; i++) {
    const calc = make(i)
    if (calc?.substance === substance) return calc
  }
  throw new Error(`keine Aufgabe zu ${substance}`)
}

describe('Daten Metallbindung und Hybridisierung', () => {
  it('Bindungsordnungen wie in der zweiten Liste, Elektronen passen zur Ladung', () => {
    expect(MO_SPECIES.length).toBe(Object.keys(BO).length)
    for (const sp of MO_SPECIES) {
      expect((sp.bonding - sp.antibonding) / 2, sp.id).toBe(BO[sp.id])
      const el = sp.id.match(/^[A-Z][a-z]?/)![0]
      const charge = sp.id.endsWith('+') ? 1 : sp.id.endsWith('-') ? -1 : 0
      expect(sp.bonding + sp.antibonding, sp.id).toBe(2 * VE[el] - charge)
    }
  })

  it('Hybridisierung passt zur Gestalt (2, 3, 4 Richtungen) bei Molekülen mit Zentralatom', () => {
    for (const s of hybridSites(3)) {
      if (s.mol.central !== s.atom) continue
      const { x, e } = vseprOf(s.mol)
      expect(domainsOf(s), s.mol.id).toBe(x + e)
    }
    expect(sigmaOf(moleculeById('C2H4')!)).toBe(5)
    expect(piOf(moleculeById('C2H4')!)).toBe(1)
    expect(sigmaOf(moleculeById('C2H2')!)).toBe(3)
    expect(piOf(moleculeById('C2H2')!)).toBe(2)
    expect(piOf(moleculeById('CO2')!)).toBe(2)
  })
})

describe('Rechenfehler Metallbindung und Hybridisierung: Katalogbeispiele', () => {
  it('Hybridisierung: NH₃ als sp², CO₂ als sp³, H₂O mit 6 Richtungen, CH₄ mit 5, Hochzahl verwechselt', () => {
    const nh3 = findTask((i) => hybridTask(3, createRng(`h${i}`), { level: 3, seed: 10000 + i }, 'chem-hyb-lone-pairs-ignored'), 'NH3:N')
    expect(wrongIn(nh3, 'hybrid', 'chem-hyb-lone-pairs-ignored')).toBe(String.raw`$\mathrm{sp^{2}}$`)
    const co2 = findTask((i) => hybridTask(3, createRng(`c${i}`), { level: 3, seed: 10000 + i }, 'chem-hyb-multiple-counted'), 'CO2:C')
    expect(wrongIn(co2, 'hybrid', 'chem-hyb-multiple-counted')).toBe(String.raw`$\mathrm{sp^{3}}$`)
    const h2o = findTask((i) => hybridTask(3, createRng(`w${i}`), { level: 3, seed: 10000 + i }, 'chem-hyb-valence'), 'H2O:O')
    expect(wrongIn(h2o, 'richtungen', 'chem-hyb-valence')).toBe('$6$')
    const ch4 = findTask((i) => hybridTask(3, createRng(`m${i}`), { level: 3, seed: 10000 + i }, 'chem-hyb-all-atoms'), 'CH4:C')
    expect(wrongIn(ch4, 'richtungen', 'chem-hyb-all-atoms')).toBe('$5$')
    const bf3 = findTask((i) => hybridTask(3, createRng(`b${i}`), { level: 3, seed: 10000 + i }, 'chem-hyb-exponent'), 'BF3:B')
    expect(wrongIn(bf3, 'hybrid', 'chem-hyb-exponent')).toBe(String.raw`$\mathrm{sp^{3}}$`)
  })

  it('σ und π: CO₂ mit 4 σ, C₂H₄ mit 4 σ und 2 π, HCN mit 1 π, C₂H₄ mit 5 π', () => {
    const make = (rule: string) => (i: number) => sigmaPiTask(3, createRng(`s${rule}${i}`), { level: 3, seed: 10000 + i }, rule)
    expect(wrongIn(findTask(make('chem-sigma-all-lines'), 'CO2'), 'sigma', 'chem-sigma-all-lines')).toBe('$4$')
    expect(wrongIn(findTask(make('chem-sigma-multiple-only'), 'C2H4'), 'sigma', 'chem-sigma-multiple-only')).toBe('$4$')
    expect(wrongIn(findTask(make('chem-pi-all-lines'), 'C2H4'), 'pi', 'chem-pi-all-lines')).toBe('$2$')
    expect(wrongIn(findTask(make('chem-pi-per-bond'), 'HCN'), 'pi', 'chem-pi-per-bond')).toBe('$1$')
    expect(wrongIn(findTask(make('chem-pi-single'), 'C2H4'), 'pi', 'chem-pi-single')).toBe('$5$')
  })

  it('Dotierung: P mit 15 Valenzelektronen, B mit 4, P als p-Leiter', () => {
    const make = (rule: string) => (i: number) => dopeTask(2, createRng(`d${rule}${i}`), { level: 2, seed: 10000 + i }, rule)
    expect(wrongIn(findTask(make('chem-dope-group-number'), 'Si-P'), 'valenz', 'chem-dope-group-number')).toBe('$15$')
    expect(wrongIn(findTask(make('chem-dope-host-valence'), 'Si-B'), 'valenz', 'chem-dope-host-valence')).toBe('$4$')
    expect(wrongIn(findTask(make('chem-dope-swapped'), 'Si-P'), 'typ', 'chem-dope-swapped')).toMatch(/p-Leiter/)
  })

  it('Bindungsordnung: O₂ mit 4 und 6, He₂ mit 1, He₂ und O₂ gebunden oder nicht', () => {
    const make = (rule: string) => (i: number) => bondOrderTask(3, createRng(`o${rule}${i}`), { level: 3, seed: 10000 + i }, rule)
    expect(wrongIn(findTask(make('chem-bo-not-halved'), 'O2'), 'ordnung', 'chem-bo-not-halved')).toBe('$4$')
    expect(wrongIn(findTask(make('chem-bo-added'), 'O2'), 'ordnung', 'chem-bo-added')).toBe('$6$')
    expect(wrongIn(findTask(make('chem-bo-bonding-only'), 'He2'), 'ordnung', 'chem-bo-bonding-only')).toBe('$1$')
    expect(wrongIn(findTask(make('chem-bo-zero-stable'), 'He2'), 'stabil', 'chem-bo-zero-stable')).toMatch(/^Ja/)
    expect(wrongIn(findTask(make('chem-bo-half-unstable'), 'H2+'), 'stabil', 'chem-bo-half-unstable')).toMatch(/^Nein/)
    expect(wrongIn(findTask(make('chem-bo-antibonding-blocks'), 'O2'), 'stabil', 'chem-bo-antibonding-blocks')).toMatch(/^Nein/)
  })
})
