import { describe, expect, it } from 'vitest'
import { PAULING, ROUNDED, bondTypeAskable, bondTypeOf, deltaEn } from './electronegativity.ts'
import { figureById, shapeFigureById } from './figures.ts'
import { LEWIS_VARIANTS, type LewisVariant, lewisFigure, lewisValid } from './lewis.ts'
import {
  MOLECULES,
  VALENCE,
  angleOf,
  bondingPairs,
  countsOf,
  electronsAround,
  formulaCounts,
  freePairs,
  lonePairsOf,
  moleculeById,
  shapeOf,
  valenceElectrons,
  vseprOf,
} from './molecules.ts'

// Gegenprobe der Moleküldaten (Plan M4, Thema 3.2): Formel, Elektronen, Oktett, Gestalt, Polarität und Lewis-Bilder

// Zweite, unabhängig eingetragene Liste: Typ AXₙEₘ und Gestalt bekannter Moleküle (Lehrbuchwerte)
const SHAPES: readonly [string, string, string][] = [
  ['CH4', '4:0', 'tetraedrisch'],
  ['NH3', '3:1', 'trigonal-pyramidal'],
  ['H2O', '2:2', 'gewinkelt'],
  ['CO2', '2:0', 'linear'],
  ['HCN', '2:0', 'linear'],
  ['BF3', '3:0', 'trigonal-planar'],
  ['CH2O', '3:0', 'trigonal-planar'],
  ['SO2', '2:1', 'gewinkelt'],
  ['PCl3', '3:1', 'trigonal-pyramidal'],
  ['CCl4', '4:0', 'tetraedrisch'],
  ['PCl5', '5:0', 'trigonal-bipyramidal'],
  ['SF6', '6:0', 'oktaedrisch'],
  ['NOCl', '2:1', 'gewinkelt'],
]

// Dipolmoleküle laut Lehrbuch (zweite Liste)
const DIPOLES = ['HF', 'HCl', 'HBr', 'H2O', 'NH3', 'CH2O', 'COCl2', 'PCl3', 'NF3', 'HOCl', 'CHCl3', 'CH2Cl2', 'CH3Cl', 'CH3OH', 'H2O2', 'N2H4', 'SO2']
const NOT_DIPOLES = ['H2', 'F2', 'Cl2', 'Br2', 'CH4', 'SiH4', 'CCl4', 'CO2', 'N2', 'CS2', 'BF3', 'BCl3', 'CF4', 'SiCl4', 'C2H4', 'C2H2', 'C2H6', 'PCl5', 'SF6']

describe('Moleküldaten', () => {
  it('hat etwa 40 Moleküle mit eindeutigen Ids', () => {
    expect(MOLECULES.length).toBeGreaterThanOrEqual(40)
    expect(new Set(MOLECULES.map((m) => m.id)).size).toBe(MOLECULES.length)
  })

  it.each(MOLECULES.map((m) => [m.id, m] as const))('%s: Atome passen zur Summenformel, Bindungen verbinden alles', (_, mol) => {
    expect(Object.fromEntries(countsOf(mol))).toEqual(Object.fromEntries(formulaCounts(mol)))
    // zusammenhängend
    const seen = new Set([0])
    let grew = true
    while (grew) {
      grew = false
      for (const [a, b] of mol.bonds)
        if (seen.has(a) !== seen.has(b)) {
          seen.add(a)
          seen.add(b)
          grew = true
        }
    }
    expect(seen.size).toBe(mol.atoms.length)
    expect(mol.bonds.length).toBe(mol.atoms.length - 1)
  })

  it.each(MOLECULES.map((m) => [m.id, m] as const))('%s: Oktett (H zwei, markierte Ausnahmen), Elektronen gezählt', (_, mol) => {
    for (const [i, a] of mol.atoms.entries()) {
      const lp = lonePairsOf(mol, i)
      expect(Number.isInteger(lp) && lp >= 0, `${a.el}`).toBe(true)
      const around = electronsAround(mol, i)
      if (a.el === 'H') expect(around).toBe(2)
      else if (a.el === 'B') expect(around).toBe(mol.sextet ? 6 : 8)
      else if (mol.expanded && i === mol.central) expect(around).toBeGreaterThan(8)
      else expect(around, a.el).toBe(8)
    }
    expect(2 * (bondingPairs(mol) + freePairs(mol))).toBe(valenceElectrons(mol))
    expect(Boolean(mol.sextet)).toBe(mol.atoms.some((a) => a.el === 'B'))
  })

  it('Gestalt wie in der zweiten Liste', () => {
    for (const [id, type, shape] of SHAPES) {
      const { x, e, shape: s } = vseprOf(moleculeById(id)!)
      expect(`${x}:${e}`, id).toBe(type)
      expect(s, id).toBe(shape)
    }
    expect(shapeOf(3, 1)).toBe('trigonal-pyramidal')
    expect(angleOf(2, 2)).toBe(String.raw`kleiner als $109{,}5^\circ$`)
    expect(angleOf(3, 0)).toBe(String.raw`$120^\circ$`)
  })

  it('Polarität wie in der zweiten Liste; ohne Angabe nur die Grenzfälle aus CHEMIE.md §6', () => {
    for (const id of DIPOLES) expect(moleculeById(id)!.dipole, id).toBe(true)
    for (const id of NOT_DIPOLES) expect(moleculeById(id)!.dipole, id).toBe(false)
    const open = MOLECULES.filter((m) => m.dipole === null).map((m) => m.id)
    expect(open.sort()).toEqual(['H2S', 'HCN', 'NCl3', 'NOCl', 'OF2', 'PH3', 'SCl2'])
  })

  it('Dipol nur mit polaren Bindungen und unsymmetrischer Gestalt (die Gestalt entscheidet)', () => {
    for (const mol of MOLECULES.filter((m) => m.dipole !== null && m.central !== undefined)) {
      const { e } = vseprOf(mol)
      const ligands = mol.bonds.filter(([a, b]) => a === mol.central || b === mol.central).map(([a, b]) => mol.atoms[a === mol.central ? b : a].el)
      const symmetric = e === 0 && new Set(ligands).size === 1 && mol.bonds.every(([, , o]) => o === mol.bonds[0][2])
      if (symmetric) expect(mol.dipole, mol.id).toBe(false)
      else expect(mol.dipole, mol.id).toBe(true)
    }
  })

  it('Dipol nur mit mindestens einer polaren Bindung (nach den Pauling-Werten der App)', () => {
    for (const mol of MOLECULES.filter((m) => m.dipole === true))
      expect(mol.bonds.some(([a, b]) => bondTypeOf(deltaEn(mol.atoms[a].el, mol.atoms[b].el)) !== 'unpolar'), mol.id).toBe(true)
  })

  it('Valenzelektronen nach der Hauptgruppe', () => {
    expect(VALENCE).toMatchObject({ H: 1, C: 4, N: 5, O: 6, Cl: 7 })
    expect(valenceElectrons(moleculeById('CO2')!)).toBe(16)
    expect(valenceElectrons(moleculeById('HCN')!)).toBe(10)
  })
})

describe('Elektronegativität', () => {
  it('Pauling-Werte aus CHEMIE.md §4', () => {
    expect(PAULING).toMatchObject({ H: '2.20', C: '2.55', N: '3.04', O: '3.44', F: '3.98', Cl: '3.16' })
    expect(ROUNDED).toMatchObject({ C: '2.5', O: '3.5', Cl: '3.0' })
    for (const el of Object.keys(PAULING)) expect(Math.abs(Number(PAULING[el]) - Number(ROUNDED[el])), el).toBeLessThan(0.21)
  })

  it('Bindungsart nach den Grenzen 0,5 und 1,8; abgefragt nur, wo beide Tabellen gleich sind', () => {
    expect(bondTypeOf(deltaEn('O', 'H'))).toBe('polar')
    expect(bondTypeOf(deltaEn('C', 'H'))).toBe('unpolar')
    expect(bondTypeOf(deltaEn('Na', 'Cl'))).toBe('ionisch')
    expect(bondTypeAskable('C', 'H')).toBe(true)
    // H–F 1,78 liegt zu nah an 1,8; O–Cl ist mit der gerundeten Tabelle 0,5
    expect(bondTypeAskable('H', 'F')).toBe(false)
    expect(bondTypeAskable('O', 'Cl')).toBe(false)
    expect(bondTypeAskable('C', 'N')).toBe(false)
  })
})

describe('Lewis-Formeln als Bilder', () => {
  const drawable = MOLECULES.filter((m) => !m.expanded)

  it.each(drawable.map((m) => [m.id, m] as const))('%s: richtige Formel stimmt, jede falsche nicht', (_, mol) => {
    const correct = lewisFigure(mol)!
    expect(lewisValid(mol, correct)).toBe(true)
    expect(figureById(correct.id)).toBe(correct)
    const descriptions = new Set([correct.description])
    for (const variant of Object.keys(LEWIS_VARIANTS) as LewisVariant[]) {
      const wrong = lewisFigure(mol, variant)
      if (!wrong) continue
      expect(lewisValid(mol, wrong), `${mol.id} ${variant}`).toBe(false)
      expect(descriptions.has(wrong.description), `${mol.id} ${variant}`).toBe(false)
      descriptions.add(wrong.description)
    }
    // jedes Molekül außer H₂ (nur in Wissensfragen) hat mindestens zwei falsche Formeln
    if (mol.id !== 'H2') expect(descriptions.size, mol.id).toBeGreaterThanOrEqual(3)
  })

  it('setzt freie Paare weg von den Bindungen', () => {
    const h2o = lewisFigure(moleculeById('H2O')!)!
    expect(h2o.atoms[0].pairs).toHaveLength(2)
    const nh3 = lewisFigure(moleculeById('NH3')!)!
    // Paar oben (270°), Partner links, rechts, unten
    expect(nh3.atoms[0].pairs).toEqual([270])
    const cl = lewisFigure(moleculeById('HCl')!)!
    expect(cl.atoms[1].pairs).toEqual([0, 90, 270])
    expect(cl.description).toBe('H mit 1 Bindungsstrich; Cl mit 1 Bindungsstrich und 3 freien Paaren')
  })

  it('zeichnet keine Lewis-Formel bei erweitertem Oktett', () => {
    expect(figureById('lewis:SO2')).toBeUndefined()
    expect(figureById('lewis:XY')).toBeUndefined()
  })
})

describe('Gestalt als Bild', () => {
  it.each(MOLECULES.filter((m) => m.central !== undefined).map((m) => [m.id, m] as const))('%s: Partner und Paare in den Richtungen des Modells', (_, mol) => {
    const fig = shapeFigureById(`gestalt:${mol.id}`)!
    const { x, e } = vseprOf(mol)
    expect(fig.atoms).toHaveLength(x + 1)
    expect(fig.lobes).toHaveLength(e)
    const dirs = [...fig.atoms.slice(1), ...fig.lobes]
    for (const d of dirs) expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 6)
    // kleinster Winkel zwischen zwei Richtungen wie im Modell
    let min = 180
    for (const [i, a] of dirs.entries())
      for (const b of dirs.slice(i + 1)) min = Math.min(min, (Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) * 180) / Math.PI)
    const expected = { 2: 180, 3: 120, 4: 109.47, 5: 90, 6: 90 }[x + e]!
    expect(min, mol.id).toBeCloseTo(expected, 1)
  })
})
