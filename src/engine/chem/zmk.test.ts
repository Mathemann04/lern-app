import { describe, expect, it } from 'vitest'
import { cardById } from '../explain/cards.ts'
import { createRng } from '../random/rng.ts'
import { generatedCalc } from './generators/index.ts'
import { UNCLEAR, ZMK_STEPS, boilTask, pickBoilSet, ruleOf, similarMasses, solveTask } from './generators/zmk.ts'
import { bondTypeAskable, bondTypeOf, deltaEn, PAULING } from './electronegativity.ts'
import { atomCounts, parseFormula } from './formula.ts'
import { moleculeById } from './molecules.ts'
import { BOIL_GROUPS, ZMK_SUBSTANCES, forceOf, orderByBoil, orderByRule, zmkById } from './zmk.ts'

// Gegenprobe der Stoffdaten „Zwischenmolekulare Kräfte" (S5c): Siedepunkte gegen eine zweite Liste, Kräfte gegen die
// Moleküldaten, jede Vergleichsgruppe passt zu ihrer Regel, Katalogbeispiele der Rechenfehler

// Zweite, unabhängig eingetragene Liste: Siedepunkte in °C bei Normaldruck (CRC Handbook), auf ganze Grad
const BOIL: Readonly<Record<string, number>> = {
  He: -269, Ne: -246, Ar: -186, Kr: -153, Xe: -108, H2: -253, N2: -196, O2: -183, F2: -188, Cl2: -34, Br2: 59, I2: 184,
  CH4: -162, SiH4: -112, NH3: -33, H2O: 100, H2S: -60, HF: 20, HCl: -85, HBr: -67, HI: -35,
  C2H6: -89, C3H8: -42, C4H10: -1, C5H12: 36, C6H14: 69, C7H16: 98, C8H18: 126,
  CH3OH: 65, C2H5OH: 78, C3H7OH: 97, C4H9OH: 118, CH3Cl: -24, CH2Cl2: 40, CHCl3: 61, CCl4: 77,
  CH2O: -19, CH3CHO: 20, CH3COCH3: 56, CH3OCH3: -24,
}

// alle Teilmengen mit zwei oder drei Stoffen
function subsets(ids: readonly string[]): string[][] {
  const out: string[][] = []
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      out.push([ids[i], ids[j]])
      for (let k = j + 1; k < ids.length; k++) out.push([ids[i], ids[j], ids[k]])
    }
  return out
}

describe('Stoffdaten zwischenmolekulare Kräfte', () => {
  it('Siedepunkte wie in der zweiten Liste', () => {
    expect(ZMK_SUBSTANCES.length).toBe(Object.keys(BOIL).length)
    for (const x of ZMK_SUBSTANCES) expect(x.boil, x.id).toBe(BOIL[x.id])
  })

  it('Polarität wie in den Moleküldaten, Wasserstoffbrücken nur mit H an N, O oder F', () => {
    for (const x of ZMK_SUBSTANCES) {
      const mol = moleculeById(x.id)
      if (mol && mol.dipole !== null) expect(x.polar, x.id).toBe(mol.dipole)
      if (x.hBond) expect(x.id, x.id).toMatch(/OH$|^NH3$|^H2O$|^HF$/)
    }
    expect(forceOf(zmkById('HCl'))).toBe('dipol-dipol')
    expect(forceOf(zmkById('CCl4'))).toBe('van-der-waals')
    expect(forceOf(zmkById('C2H5OH'))).toBe('wasserstoffbruecken')
    expect(forceOf(zmkById('CH3OCH3'))).toBe('dipol-dipol')
  })

  it('jede Auswahl aus einer Vergleichsgruppe mit 10 K Abstand folgt ihrer Regel', () => {
    let checked = 0
    for (const group of BOIL_GROUPS)
      for (const ids of subsets(group.ids)) {
        const boils = ids.map((id) => zmkById(id).boil).sort((a, b) => a - b)
        if (boils.some((b, i) => i > 0 && b - boils[i - 1] < 10)) continue
        expect(orderByRule(ids, ruleOf(ids)), ids.join()).toEqual(orderByBoil(ids))
        checked++
      }
    expect(checked).toBeGreaterThan(80)
    // Auswahlen der Aufgaben
    for (let i = 0; i < 200; i++) {
      const ids = pickBoilSet(3, createRng(`z${i}`))
      if (ids) expect(orderByRule(ids, ruleOf(ids))).toEqual(orderByBoil(ids))
    }
  })

  it('fragt Dipol-Dipol-Kräfte nur bei Stoffen mit einer sicher polaren Bindung (CHEMIE.md §5)', () => {
    for (const x of ZMK_SUBSTANCES.filter((x) => forceOf(x) === 'dipol-dipol' && !UNCLEAR.has(x.id))) {
      const els = [...atomCounts(parseFormula(x.id)).keys()].filter((el) => PAULING[el] !== undefined)
      const ok = els.some((a) => els.some((b) => a !== b && bondTypeAskable(a, b) && bondTypeOf(deltaEn(a, b)) === 'polar'))
      expect(ok, x.id).toBe(true)
    }
    expect(UNCLEAR.has('HI')).toBe(true)
  })

  it('begründet mit „ähnlicher Molmasse" nur, wo die Molmassen wirklich ähnlich sind', () => {
    expect(ruleOf(['H2O', 'H2S'])).toBe('force-then-mass')
    expect(ruleOf(['HF', 'HCl'])).toBe('force-then-mass')
    expect(ruleOf(['C2H6', 'CH2O', 'CH3OH'])).toBe('force')
    for (const group of BOIL_GROUPS) for (const ids of subsets(group.ids)) if (ruleOf(ids) === 'force') expect(similarMasses(ids), ids.join()).toBe(true)
  })

  it('fragt bei Edelgasen nicht nach Atombindungen', () => {
    for (let seed = 10000; seed < 10600; seed++) {
      const calc = generatedCalc('chem-zmk', { level: 3, seed })!
      if (!/^(He|Ne|Ar|Kr|Xe)$/.test(calc.substance)) continue
      expect(calc.task.steps.map((s) => s.id)).not.toContain('sieden')
      for (const step of calc.task.steps) for (const c of step.choices) expect(c.content).not.toMatch(/Atombindung/)
    }
  })

  it('Lernkarte „Siedepunkte vergleichen" nennt die Siedepunkte der Daten', () => {
    const text = JSON.stringify(cardById('zmk-siedepunkte'))
    for (const id of ['F2', 'Cl2', 'Br2', 'C3H8', 'CH3CHO', 'C2H5OH']) expect(text, id).toContain(`${zmkById(id).boil} °C`.replace('-', '−'))
  })
})

describe('Rechenfehler zwischenmolekulare Kräfte: Katalogbeispiele', () => {
  const rng = () => createRng('katalog')
  const wrongIn = (step: { choices: readonly { errorRuleId?: string; content: string }[] } | null, rule: string) => step?.choices.find((c) => c.errorRuleId === rule)?.content

  it('Wasserstoffbrücken: CH₄ wegen H, HCl wegen Cl, NH₃ übersehen', () => {
    expect(wrongIn(ZMK_STEPS.forceStep(zmkById('CH4'), rng(), 'chem-zmk-any-h'), 'chem-zmk-any-h')).toBe('Wasserstoffbrücken')
    expect(wrongIn(ZMK_STEPS.forceStep(zmkById('HCl'), rng(), 'chem-zmk-h-other'), 'chem-zmk-h-other')).toBe('Wasserstoffbrücken')
    expect(wrongIn(ZMK_STEPS.forceStep(zmkById('NH3'), rng(), 'chem-zmk-hbond-missed'), 'chem-zmk-hbond-missed')).toBe('Dipol-Dipol-Kräfte')
  })

  it('Polarität: CCl₄ mit Dipol-Dipol-Kräften, HCl nur mit Van der Waals, Atombindungen statt Kräften', () => {
    expect(wrongIn(ZMK_STEPS.forceStep(zmkById('CCl4'), rng(), 'chem-zmk-polar-bond'), 'chem-zmk-polar-bond')).toBe('Dipol-Dipol-Kräfte')
    expect(wrongIn(ZMK_STEPS.forceStep(zmkById('HCl'), rng(), 'chem-zmk-polar-ignored'), 'chem-zmk-polar-ignored')).toBe('Van-der-Waals-Kräfte')
    expect(wrongIn(ZMK_STEPS.evaporateStep(zmkById('H2O'), rng(), 'chem-zmk-intra'), 'chem-zmk-intra')).toMatch(/Atombindungen/)
  })

  it('Siedepunkte: H₂O < H₂S nach der Molmasse, I₂ < Br₂ < Cl₂ umgedreht', () => {
    let massOnly = false
    let reversed = false
    for (let i = 0; i < 400 && !(massOnly && reversed); i++) {
      const calc = boilTask(3, createRng(`b${i}`), { level: 3, seed: 10000 + i }, i % 2 ? 'chem-zmk-mass-only' : 'chem-zmk-reversed')
      const order = calc?.task.steps[0]
      if (!order) continue
      if (calc.substance === 'H2O-H2S' && wrongIn(order, 'chem-zmk-mass-only') === String.raw`$\ce{H2O}$ < $\ce{H2S}$`) massOnly = true
      if (calc.substance === 'Br2-Cl2-I2' && wrongIn(order, 'chem-zmk-reversed') === String.raw`$\ce{I2}$ < $\ce{Br2}$ < $\ce{Cl2}$`) reversed = true
    }
    expect(massOnly).toBe(true)
    expect(reversed).toBe(true)
  })

  it('Lösen: Iod in Wasser, weil sich Gegensätze anziehen', () => {
    let seen = false
    for (let i = 0; i < 300 && !seen; i++) {
      const calc = solveTask(2, createRng(`l${i}`), { level: 2, seed: 10000 + i }, 'chem-zmk-like-reversed')
      if (calc?.substance === 'I2') seen = wrongIn(calc.task.steps[0], 'chem-zmk-like-reversed') === 'in Wasser, weil sich Gegensätze anziehen'
    }
    expect(seen).toBe(true)
  })
})
