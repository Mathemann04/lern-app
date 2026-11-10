import { type Species, species } from './equation.ts'

// Reaktionen zum Ausgleichen (Thema „Reaktionsgleichungen", Plan M4, Thema 4.1). Nur Edukte und
// Produkte; die Koeffizienten rechnet die Engine (equation.ts, balance). Zweiatomige Elemente als X₂,
// Phosphor als P (docs/CHEMIE.md §3). Die Liste ist bewusst klein: Es gibt nicht beliebig viele
// sinnvolle Reaktionen einer Stufe (Abweichung von den Kennzahlen der Abwechslung, docs/PLAN-M4.md).

export type Reaction = {
  // fest, nie umbenennen (steckt in den Formen der letzten Aufgaben)
  readonly id: string
  // was passiert, z. B. „Magnesium verbrennt"
  readonly name: string
  readonly reactants: readonly Species[]
  readonly products: readonly Species[]
  readonly levels: readonly (1 | 2 | 3)[]
}

const r = (id: string, name: string, left: string, right: string, levels: readonly (1 | 2 | 3)[]): Reaction => ({
  id,
  name,
  reactants: left.split(' + ').map(species),
  products: right.split(' + ').map(species),
  levels,
})

export const REACTIONS: readonly Reaction[] = [
  // Grundlagen: zwei oder drei Stoffe
  r('knallgas', 'Wasserstoff verbrennt mit Sauerstoff zu Wasser', 'H2 + O2', 'H2O', [1]),
  r('elektrolyse', 'Wasser wird durch Strom in Wasserstoff und Sauerstoff zerlegt', 'H2O', 'H2 + O2', [1]),
  r('natriumchlorid', 'Natrium reagiert mit Chlor zu Natriumchlorid', 'Na + Cl2', 'NaCl', [1]),
  r('kaliumchlorid', 'Kalium reagiert mit Chlor zu Kaliumchlorid', 'K + Cl2', 'KCl', [1]),
  r('chlorwasserstoff', 'Wasserstoff reagiert mit Chlor zu Chlorwasserstoff', 'H2 + Cl2', 'HCl', [1]),
  r('magnesiumoxid', 'Magnesium verbrennt zu Magnesiumoxid', 'Mg + O2', 'MgO', [1]),
  r('calciumoxid', 'Calcium reagiert mit Sauerstoff zu Calciumoxid', 'Ca + O2', 'CaO', [1]),
  r('kupferoxid', 'Kupfer reagiert mit Sauerstoff zu Kupfer(II)-oxid', 'Cu + O2', 'CuO', [1]),
  r('zinkoxid', 'Zink reagiert mit Sauerstoff zu Zinkoxid', 'Zn + O2', 'ZnO', [1]),
  r('lithiumoxid', 'Lithium reagiert mit Sauerstoff zu Lithiumoxid', 'Li + O2', 'Li2O', [1]),
  r('natriumoxid', 'Natrium reagiert mit Sauerstoff zu Natriumoxid', 'Na + O2', 'Na2O', [1]),
  r('peroxid', 'Wasserstoffperoxid zerfällt in Wasser und Sauerstoff', 'H2O2', 'H2O + O2', [1]),
  r('quecksilberoxid', 'Quecksilberoxid zerfällt beim Erhitzen in Quecksilber und Sauerstoff', 'HgO', 'Hg + O2', [1]),
  r('schwefeltrioxid', 'Schwefeldioxid reagiert mit Sauerstoff zu Schwefeltrioxid', 'SO2 + O2', 'SO3', [1]),
  r('stickstoffdioxid', 'Stickstoffmonoxid reagiert mit Sauerstoff zu Stickstoffdioxid', 'NO + O2', 'NO2', [1]),
  // Vertiefung: größere Gleichungen
  r('ammoniak', 'Ammoniaksynthese aus Stickstoff und Wasserstoff', 'N2 + H2', 'NH3', [2]),
  r('aluminiumoxid', 'Aluminium verbrennt zu Aluminiumoxid', 'Al + O2', 'Al2O3', [2]),
  r('rosten', 'Eisen rostet zu Eisen(III)-oxid', 'Fe + O2', 'Fe2O3', [2]),
  r('eisenchlorid', 'Eisen reagiert mit Chlor zu Eisen(III)-chlorid', 'Fe + Cl2', 'FeCl3', [2]),
  r('aluminiumchlorid', 'Aluminium reagiert mit Chlor zu Aluminiumchlorid', 'Al + Cl2', 'AlCl3', [2]),
  r('hochofen', 'Eisen(III)-oxid wird im Hochofen mit Kohlenstoffmonoxid zu Eisen reduziert', 'Fe2O3 + CO', 'Fe + CO2', [2]),
  r('eisen-kohle', 'Eisen(III)-oxid reagiert mit Kohlenstoff zu Eisen', 'Fe2O3 + C', 'Fe + CO2', [2]),
  r('thermit', 'Thermitverfahren: Aluminium reagiert mit Eisen(III)-oxid', 'Al + Fe2O3', 'Al2O3 + Fe', [2]),
  r('magnesium-saeure', 'Magnesium reagiert mit Salzsäure', 'Mg + HCl', 'MgCl2 + H2', [2]),
  r('zink-saeure', 'Zink reagiert mit Salzsäure', 'Zn + HCl', 'ZnCl2 + H2', [2]),
  r('aluminium-saeure', 'Aluminium reagiert mit Salzsäure', 'Al + HCl', 'AlCl3 + H2', [2]),
  r('kalkwasser', 'Calciumhydroxid reagiert mit Salzsäure', 'Ca(OH)2 + HCl', 'CaCl2 + H2O', [2]),
  r('neutralisation', 'Schwefelsäure reagiert mit Natronlauge', 'H2SO4 + NaOH', 'Na2SO4 + H2O', [2]),
  r('kaliumchlorat', 'Kaliumchlorat zerfällt beim Erhitzen', 'KClO3', 'KCl + O2', [2]),
  r('natrium-wasser', 'Natrium reagiert mit Wasser', 'Na + H2O', 'NaOH + H2', [2]),
  r('calcium-wasser', 'Calcium reagiert mit Wasser', 'Ca + H2O', 'Ca(OH)2 + H2', [2]),
  r('photosynthese', 'Photosynthese', 'CO2 + H2O', 'C6H12O6 + O2', [2]),
  r('phosphor', 'Phosphor verbrennt zu Phosphor(V)-oxid', 'P + O2', 'P4O10', [2]),
  r('natron', 'Natriumhydrogencarbonat zerfällt beim Erhitzen', 'NaHCO3', 'Na2CO3 + H2O + CO2', [2]),
]

// Brennstoffe für die vollständige Verbrennung (Alkane CₙH₂ₙ₊₂ und Alkohole CₙH₂ₙ₊₁OH)
export type Fuel = { readonly id: string; readonly name: string; readonly species: Species; readonly levels: readonly (1 | 2 | 3)[] }

const fuel = (text: string, name: string, levels: readonly (1 | 2 | 3)[]): Fuel => ({ id: text, name, species: species(text), levels })

export const FUELS: readonly Fuel[] = [
  fuel('CH4', 'Methan', [1, 2, 3]),
  fuel('C2H6', 'Ethan', [2, 3]),
  fuel('C3H8', 'Propan', [1, 2, 3]),
  fuel('C4H10', 'Butan', [2, 3]),
  fuel('C5H12', 'Pentan', [3]),
  fuel('C6H14', 'Hexan', [3]),
  fuel('C7H16', 'Heptan', [3]),
  fuel('C8H18', 'Octan', [3]),
  fuel('C9H20', 'Nonan', [3]),
  fuel('C10H22', 'Decan', [3]),
  fuel('CH3OH', 'Methanol', [2, 3]),
  fuel('C2H5OH', 'Ethanol', [1, 2, 3]),
  fuel('C3H7OH', 'Propanol', [3]),
  fuel('C4H9OH', 'Butanol', [3]),
  fuel('C5H11OH', 'Pentanol', [3]),
]

// Produkte der vollständigen Verbrennung
export const CO2 = species('CO2')
export const H2O = species('H2O')
export const O2 = species('O2')
export const CO = species('CO')
