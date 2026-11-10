import { type Formula, parseFormula } from './formula.ts'

// Stoffe für Rechnungen (Molmasse, Stoffmenge, später Umsatz): Summenformel und deutscher Name nach
// docs/CHEMIE.md §3 (Kohlenstoffdioxid, Eisen(III)-oxid mit Bindestrich). Gruppen nach Schwierigkeit:
// einfache Formeln, Formeln mit Klammer, Formeln mit Kristallwasser.

export type SubstanceKind = 'simple' | 'bracket' | 'hydrate'

export type Substance = {
  // fest, nie umbenennen (steckt in den Formen der letzten Aufgaben): die Formel wie geschrieben
  readonly id: string
  readonly name: string
  readonly kind: SubstanceKind
  readonly formula: Formula
}

const s = (text: string, name: string, kind: SubstanceKind): Substance => ({ id: text, name, kind, formula: parseFormula(text) })

export const SUBSTANCES: readonly Substance[] = [
  // Elemente aus zweiatomigen Molekülen
  s('H2', 'Wasserstoff', 'simple'),
  s('O2', 'Sauerstoff', 'simple'),
  s('N2', 'Stickstoff', 'simple'),
  s('Cl2', 'Chlor', 'simple'),
  // Moleküle
  s('H2O', 'Wasser', 'simple'),
  s('CO2', 'Kohlenstoffdioxid', 'simple'),
  s('CO', 'Kohlenstoffmonoxid', 'simple'),
  s('NH3', 'Ammoniak', 'simple'),
  s('CH4', 'Methan', 'simple'),
  s('C2H6', 'Ethan', 'simple'),
  s('C3H8', 'Propan', 'simple'),
  s('C4H10', 'Butan', 'simple'),
  s('C8H18', 'Octan', 'simple'),
  s('CH3OH', 'Methanol', 'simple'),
  s('C2H5OH', 'Ethanol', 'simple'),
  s('C6H12O6', 'Glucose', 'simple'),
  s('SO2', 'Schwefeldioxid', 'simple'),
  s('SO3', 'Schwefeltrioxid', 'simple'),
  s('NO2', 'Stickstoffdioxid', 'simple'),
  s('N2O', 'Distickstoffmonoxid', 'simple'),
  s('H2O2', 'Wasserstoffperoxid', 'simple'),
  s('HCl', 'Chlorwasserstoff', 'simple'),
  s('H2SO4', 'Schwefelsäure', 'simple'),
  s('HNO3', 'Salpetersäure', 'simple'),
  s('H3PO4', 'Phosphorsäure', 'simple'),
  // Salze und Oxide ohne Klammer
  s('NaCl', 'Natriumchlorid', 'simple'),
  s('KCl', 'Kaliumchlorid', 'simple'),
  s('MgCl2', 'Magnesiumchlorid', 'simple'),
  s('CaCl2', 'Calciumchlorid', 'simple'),
  s('MgO', 'Magnesiumoxid', 'simple'),
  s('CaO', 'Calciumoxid', 'simple'),
  s('Al2O3', 'Aluminiumoxid', 'simple'),
  s('Fe2O3', 'Eisen(III)-oxid', 'simple'),
  s('CuO', 'Kupfer(II)-oxid', 'simple'),
  s('ZnO', 'Zinkoxid', 'simple'),
  s('NaOH', 'Natriumhydroxid', 'simple'),
  s('KOH', 'Kaliumhydroxid', 'simple'),
  s('CaCO3', 'Calciumcarbonat', 'simple'),
  s('Na2CO3', 'Natriumcarbonat', 'simple'),
  s('NaHCO3', 'Natriumhydrogencarbonat', 'simple'),
  s('Na2SO4', 'Natriumsulfat', 'simple'),
  s('CuSO4', 'Kupfer(II)-sulfat', 'simple'),
  s('KNO3', 'Kaliumnitrat', 'simple'),
  s('AgNO3', 'Silbernitrat', 'simple'),
  s('KMnO4', 'Kaliumpermanganat', 'simple'),
  s('NH4Cl', 'Ammoniumchlorid', 'simple'),
  // mit Klammer
  s('Ca(OH)2', 'Calciumhydroxid', 'bracket'),
  s('Mg(OH)2', 'Magnesiumhydroxid', 'bracket'),
  s('Ba(OH)2', 'Bariumhydroxid', 'bracket'),
  s('Zn(OH)2', 'Zinkhydroxid', 'bracket'),
  s('Al(OH)3', 'Aluminiumhydroxid', 'bracket'),
  s('Fe(OH)3', 'Eisen(III)-hydroxid', 'bracket'),
  s('Ca(NO3)2', 'Calciumnitrat', 'bracket'),
  s('Mg(NO3)2', 'Magnesiumnitrat', 'bracket'),
  s('Cu(NO3)2', 'Kupfer(II)-nitrat', 'bracket'),
  s('Pb(NO3)2', 'Blei(II)-nitrat', 'bracket'),
  s('Al2(SO4)3', 'Aluminiumsulfat', 'bracket'),
  s('Fe2(SO4)3', 'Eisen(III)-sulfat', 'bracket'),
  s('Ca3(PO4)2', 'Calciumphosphat', 'bracket'),
  s('(NH4)2SO4', 'Ammoniumsulfat', 'bracket'),
  s('(NH4)3PO4', 'Ammoniumphosphat', 'bracket'),
  // mit Kristallwasser
  s('CuSO4*5H2O', 'Kupfer(II)-sulfat-Pentahydrat', 'hydrate'),
  s('MgSO4*7H2O', 'Magnesiumsulfat-Heptahydrat', 'hydrate'),
  s('FeSO4*7H2O', 'Eisen(II)-sulfat-Heptahydrat', 'hydrate'),
  s('ZnSO4*7H2O', 'Zinksulfat-Heptahydrat', 'hydrate'),
  s('CaSO4*2H2O', 'Calciumsulfat-Dihydrat (Gips)', 'hydrate'),
  s('CaCl2*2H2O', 'Calciumchlorid-Dihydrat', 'hydrate'),
  s('BaCl2*2H2O', 'Bariumchlorid-Dihydrat', 'hydrate'),
  s('CoCl2*6H2O', 'Cobalt(II)-chlorid-Hexahydrat', 'hydrate'),
  s('Na2CO3*10H2O', 'Natriumcarbonat-Decahydrat (Kristallsoda)', 'hydrate'),
  s('Na2SO4*10H2O', 'Natriumsulfat-Decahydrat', 'hydrate'),
]

export const substancesOf = (...kinds: SubstanceKind[]) => SUBSTANCES.filter((x) => kinds.includes(x.kind))
export const substanceById = (id: string) => SUBSTANCES.find((x) => x.id === id)
