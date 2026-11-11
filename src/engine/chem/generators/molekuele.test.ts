import { describe, expect, it } from 'vitest'
import { cardById } from '../../explain/cards.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import { deltaEn, enLatex } from '../electronegativity.ts'
import { figureById } from '../figures.ts'
import { MOL_COMPOUNDS, PREFIXES, compoundFormula, compoundName } from '../molNames.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { bondingPairs, freePairs, lonePairsOf, moleculeById, typeLatex, valenceElectrons, vseprOf } from '../molecules.ts'
import { generatedCalc } from './index.ts'
import { MOLEKUELE_BANK, ORDER_ANGLE_IDS } from '../bank/molekuele.ts'

// Rechnungen und Lernkarten zum Thema „Moleküle" (S5b): Karten rechnen wie die Engine, Namen wie eine zweite Liste,
// Lösungen stimmen mit den Moleküldaten überein

const COURSE = 'chem-molekuele'
const mol = (id: string) => moleculeById(id)!
const cardText = (id: string) => JSON.stringify(cardById(id))

// Zweite, unabhängig eingetragene Liste der Namen
const NAMES: Readonly<Record<string, string>> = {
  CO: 'Kohlenstoffmonoxid',
  CO2: 'Kohlenstoffdioxid',
  NO: 'Stickstoffmonoxid',
  NO2: 'Stickstoffdioxid',
  N2O: 'Distickstoffmonoxid',
  N2O3: 'Distickstofftrioxid',
  SO2: 'Schwefeldioxid',
  SO3: 'Schwefeltrioxid',
  CS2: 'Kohlenstoffdisulfid',
  PCl3: 'Phosphortrichlorid',
  PCl5: 'Phosphorpentachlorid',
  PBr3: 'Phosphortribromid',
  SF6: 'Schwefelhexafluorid',
  SiCl4: 'Siliciumtetrachlorid',
  SiF4: 'Siliciumtetrafluorid',
  NF3: 'Stickstofftrifluorid',
  OF2: 'Sauerstoffdifluorid',
  BF3: 'Bortrifluorid',
  BCl3: 'Bortrichlorid',
  ClF3: 'Chlortrifluorid',
  SCl2: 'Schwefeldichlorid',
  S2Cl2: 'Dischwefeldichlorid',
  P4O10: 'Tetraphosphordecaoxid',
  P4O6: 'Tetraphosphorhexaoxid',
  CCl4: 'Kohlenstofftetrachlorid',
}

describe('Namen von Molekülverbindungen', () => {
  it('rechnet jeden Namen wie die zweite Liste', () => {
    expect(MOL_COMPOUNDS.length).toBe(Object.keys(NAMES).length)
    for (const c of MOL_COMPOUNDS) expect(compoundName(c.parts), compoundFormula(c.parts)).toBe(NAMES[compoundFormula(c.parts)])
  })
})

describe('Lernkarten „Moleküle" rechnen wie die Engine', () => {
  it('Lewis-Formel: NH₃ und PCl₃', () => {
    expect(valenceElectrons(mol('NH3'))).toBe(8)
    expect(valenceElectrons(mol('PCl3'))).toBe(26)
    expect(bondingPairs(mol('PCl3'))).toBe(3)
    expect(freePairs(mol('PCl3'))).toBe(10)
    expect(cardText('mol-lewis')).toContain('5 + 3 \\\\cdot 7 = 26')
  })

  it('Mehrfachbindungen: CO₂ mit acht Paaren, HCN mit fünf', () => {
    expect(valenceElectrons(mol('CO2')) / 2).toBe(8)
    expect(bondingPairs(mol('CO2'))).toBe(4)
    expect(valenceElectrons(mol('HCN')) / 2).toBe(5)
    expect(bondingPairs(mol('HCN'))).toBe(4)
    expect(freePairs(mol('HCN'))).toBe(1)
  })

  it('Gestalt: Typen und Gestalten der Tabelle', () => {
    const text = cardText('mol-gestalt')
    for (const id of ['CO2', 'BF3', 'CH4', 'NH3', 'H2O', 'SO2']) {
      const { x, e, shape } = vseprOf(mol(id))
      expect(text, id).toContain(typeLatex(x, e).replace(/_\{(\d)\}/g, '_$1').replace(/\\/g, '\\\\'))
      expect(text, id).toContain(shape)
    }
    for (const card of ['mol-lewis', 'mol-mehrfach', 'mol-gestalt', 'mol-freie-paare', 'mol-dipol']) for (const f of cardById(card)!.figures ?? []) expect(figureById(f), f).toBeDefined()
  })

  it('Elektronegativität: O–H 1,24 und C–H 0,35', () => {
    expect(enLatex(deltaEn('O', 'H'))).toBe('1{,}24')
    expect(enLatex(deltaEn('C', 'H'))).toBe('0{,}35')
    expect(cardText('mol-en')).toContain('1{,}24')
    expect(cardText('mol-en')).toContain('0{,}35')
  })

  it('Dipole: CO₂ und CCl₄ unpolar, H₂O und CH₃Cl polar', () => {
    expect(mol('CO2').dipole).toBe(false)
    expect(mol('CCl4').dipole).toBe(false)
    expect(mol('H2O').dipole).toBe(true)
    expect(mol('CH3Cl').dipole).toBe(true)
  })

  it('Namen: N₂O und PCl₅', () => {
    expect(compoundName(['N', 2, 'O', 1])).toBe('Distickstoffmonoxid')
    expect(compoundName(['P', 1, 'Cl', 5])).toBe('Phosphorpentachlorid')
    expect(cardText('mol-namen')).toContain('Distickstoffmonoxid')
  })
})

describe('Rechnungen „Moleküle": Lösung passt zu den Daten', () => {
  it('Gestalt, Lewis-Formel und Polarität mit dem richtigen Ergebnis', () => {
    let seen = 0
    for (const level of [1, 2, 3] as const) {
      for (let i = 0; i < 150; i++) {
        const calc = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!
        const m = moleculeById(calc.substance)
        if (!m) continue
        const right = (id: string) => calc.task.steps.find((s) => s.id === id)?.choices.find((c) => c.correct)?.content
        if (calc.form.startsWith('gestalt')) {
          const { x, e, shape } = vseprOf(m)
          expect(right('partner')).toBe(`$${x}$`)
          expect(right('freie-paare')).toBe(`$${e}$`)
          expect(right('gestalt')).toBe(shape)
          expect(calc.task.resultFigure).toBe(`gestalt:${m.id}`)
          seen++
        }
        if (calc.form.startsWith('lewis')) {
          expect(right('valenz')).toBe(`$${valenceElectrons(m)}$`)
          const formula = calc.task.steps.find((s) => s.id === 'formel')!
          expect(formula.choices.find((c) => c.correct)!.figure).toBe(`lewis:${m.id}`)
          for (const c of formula.choices) expect(figureById(c.figure!), c.figure).toBeDefined()
          seen++
        }
        if (calc.form.startsWith('polar') && right('dipol')) {
          expect(right('dipol')!.startsWith('Ja')).toBe(m.dipole)
          seen++
        }
      }
    }
    expect(seen).toBeGreaterThan(200)
  })

  it('zeigt die Lewis-Formel bis zur Vertiefung unter der ersten Frage, im Klausurniveau nicht', () => {
    for (let i = 0; i < 100; i++) {
      for (const level of [1, 3] as const) {
        const calc = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!
        if (!calc.form.startsWith('gestalt')) continue
        expect(Boolean(calc.task.steps[0].figure)).toBe(level === 1)
      }
    }
  })
})

// Ordnen (N1c): Reihenfolge der Bindungswinkel passt zu den Messwerten (ideale Winkel; Ammoniak etwa 107°, Wasser
// etwa 104,5° wie auf der Lernkarte) und zum Typ aus der Engine
describe('Ordnen: Bindungswinkel', () => {
  const MEASURED: Readonly<Record<string, number>> = { CO2: 180, BF3: 120, CH4: 109.5, NH3: 107 }
  const IDEAL: Readonly<Record<number, number>> = { 2: 180, 3: 120, 4: 109.5 }
  it('folgt den Messwerten und dem VSEPR-Typ', () => {
    const q = MOLEKUELE_BANK.questions.find((x) => x.id === 'mo-v-ordnen-winkel')
    if (q?.kind !== 'order') throw new Error('Frage fehlt')
    const ids = q.items.map((i) => i.id)
    expect([...ids].sort()).toEqual([...ORDER_ANGLE_IDS].sort())
    expect(ids).toEqual([...ids].sort((a, b) => MEASURED[b] - MEASURED[a]))
    for (const id of ids) {
      const { x, e } = vseprOf(moleculeById(id)!)
      // ohne freie Paare der ideale Winkel, mit freien Paaren kleiner
      if (e === 0) expect(MEASURED[id], id).toBe(IDEAL[x + e])
      else expect(MEASURED[id], id).toBeLessThan(IDEAL[x + e])
    }
  })
})

// Abgleich mit den Skripten (11.11.2026): Paare am Zentralatom, Vorsilben bis deca, zweiter Name von CCl₄,
// Formeln der Wasserstoffverbindungen aus der Zahl der Bindungen
describe('Moleküle: Ergänzungen nach dem Abgleich', () => {
  it('zählt bindende und freie Paare am Zentralatom, auch bei Molekülen nur mit H-Partnern', () => {
    let central = 0
    let hOnly = 0
    for (const level of [2, 3] as const) {
      for (let i = 0; i < 300; i++) {
        const calc = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!
        if (!calc.form.startsWith('lewis')) continue
        const m = moleculeById(calc.substance)!
        const step = calc.task.steps.find((s) => s.id === 'verteilung')
        if (m.central === undefined) {
          expect(step, m.id).toBeUndefined()
          continue
        }
        expect(step, m.id).toBeDefined()
        const right = step!.choices.find((c) => c.correct)!.content
        const bonding = m.bonds.filter(([a, b]) => a === m.central || b === m.central).reduce((s, [, , o]) => s + o, 0)
        const free = lonePairsOf(m, m.central)
        expect(right, m.id).toMatch(new RegExp(`^${bonding} bindende und ${free} frei`))
        expect(step!.question, m.id).toMatch(/am Zentralatom/)
        central++
        if (m.atoms.every((a, j) => j === m.central || a.el === 'H')) hOnly++
      }
    }
    expect(central).toBeGreaterThan(40)
    expect(hOnly).toBeGreaterThan(3)
  })

  it('kennt die Vorsilben bis deca, und die Karte nennt octa und nona', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => PREFIXES[n])).toEqual(['mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'])
    expect(cardText('mol-namen')).toContain('octa 8, nona 9')
  })

  it('nennt bei CCl₄ beide Namen', () => {
    let seen = 0
    for (let i = 0; i < 400 && seen < 2; i++) {
      const calc = generatedCalc(COURSE, { level: 2, seed: GENERATED_MIN + i })!
      if (calc.substance !== 'CCl4' || !calc.form.startsWith('name')) continue
      expect(calc.task.steps[0].explanation.detailed).toContain('Tetrachlormethan')
      seen++
    }
    expect(seen).toBeGreaterThan(0)
    expect(cardText('mol-namen')).toContain('Tetrachlormethan')
  })

  it('Wasserstoffverbindungen: so viele H wie dem Element zum Oktett fehlen', () => {
    const q = MOLEKUELE_BANK.questions.find((x) => x.id === 'mo-g-wasserstoffverbindungen')
    if (q?.kind !== 'single') throw new Error('Frage fehlt')
    const formulas = [...q.correct.text.matchAll(/\\ce\{([^}]+)\}/g)].map((m) => m[1])
    expect(formulas).toEqual(['HCl', 'H2S', 'PH3', 'SiH4'])
    const MAIN_GROUP: Readonly<Record<string, number>> = { Cl: 7, S: 6, P: 5, Si: 4 }
    for (const f of formulas) {
      const counts = atomCounts(parseFormula(f))
      const el = [...counts.keys()].find((e) => e !== 'H')!
      expect(counts.get('H'), f).toBe(8 - MAIN_GROUP[el])
      expect(counts.get(el), f).toBe(1)
    }
  })
})
