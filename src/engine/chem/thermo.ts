import { type Rational, parseDecimal, rat, ratAdd, ratMul, ratSub } from '../rational.ts'

// Thermodynamische Daten für das Thema „Energie bei Reaktionen" (S7b, Plan M4 Thema 5.2): Standardbildungsenthalpie ΔfH° in
// kJ/mol und Standardentropie S° in J/(mol · K) bei 298,15 K und 1013 hPa, mit einer Nachkommastelle. Quelle: NIST Chemistry
// WebBook bzw. CODATA-Schlüsselwerte (Tabellenwerke weichen in der letzten Stelle teils ab; jede Aufgabe nennt die Werte, mit
// denen sie rechnet). Elemente in ihrem Standardzustand haben ΔfH° = 0 (docs/CHEMIE.md §5), Kohlenstoff als Graphit; Phosphor
// kommt nicht vor. Gegenprobe mit einer zweiten Liste in generators/energie.test.ts.

export type State = 's' | 'l' | 'g'
export type ThermoSpecies = {
  // Schlüssel aus Formel und Zustand, z. B. „H2O(l)"
  readonly key: string
  readonly ce: string
  readonly state: State
  readonly name: string
  readonly dfh: string
  readonly s: string
  // Element im Standardzustand (ΔfH° = 0)
  readonly element?: boolean
}

const t = (ce: string, state: State, name: string, dfh: string, s: string, element = false): ThermoSpecies => ({ key: `${ce}(${state})`, ce, state, name, dfh, s, ...(element ? { element } : {}) })

export const THERMO: readonly ThermoSpecies[] = [
  // Elemente im Standardzustand
  t('H2', 'g', 'Wasserstoff', '0', '130.7', true),
  t('O2', 'g', 'Sauerstoff', '0', '205.2', true),
  t('N2', 'g', 'Stickstoff', '0', '191.6', true),
  t('Cl2', 'g', 'Chlor', '0', '223.1', true),
  t('C', 's', 'Kohlenstoff (Graphit)', '0', '5.7', true),
  t('S', 's', 'Schwefel', '0', '32.1', true),
  t('I2', 's', 'Iod', '0', '116.1', true),
  t('Mg', 's', 'Magnesium', '0', '32.7', true),
  t('Al', 's', 'Aluminium', '0', '28.3', true),
  t('Na', 's', 'Natrium', '0', '51.3', true),
  t('Fe', 's', 'Eisen', '0', '27.3', true),
  t('Ca', 's', 'Calcium', '0', '41.6', true),
  // Verbindungen
  t('H2O', 'l', 'Wasser', '-285.8', '70.0'),
  t('H2O', 'g', 'Wasserdampf', '-241.8', '188.8'),
  t('CO2', 'g', 'Kohlenstoffdioxid', '-393.5', '213.8'),
  t('CO', 'g', 'Kohlenstoffmonoxid', '-110.5', '197.7'),
  t('NH3', 'g', 'Ammoniak', '-45.9', '192.8'),
  t('CH4', 'g', 'Methan', '-74.9', '186.3'),
  t('C2H6', 'g', 'Ethan', '-84.0', '229.2'),
  t('C3H8', 'g', 'Propan', '-104.7', '270.3'),
  t('C4H10', 'g', 'Butan', '-125.7', '310.2'),
  t('C2H4', 'g', 'Ethen', '52.4', '219.3'),
  t('C2H2', 'g', 'Ethin', '227.4', '200.9'),
  t('CH3OH', 'l', 'Methanol', '-239.2', '126.8'),
  t('C2H5OH', 'l', 'Ethanol', '-277.7', '160.7'),
  t('C6H12O6', 's', 'Glucose', '-1273.3', '212.1'),
  t('SO2', 'g', 'Schwefeldioxid', '-296.8', '248.2'),
  t('SO3', 'g', 'Schwefeltrioxid', '-395.7', '256.8'),
  t('HCl', 'g', 'Chlorwasserstoff', '-92.3', '186.9'),
  t('HI', 'g', 'Iodwasserstoff', '26.5', '206.6'),
  t('NO2', 'g', 'Stickstoffdioxid', '33.2', '240.1'),
  t('N2O4', 'g', 'Distickstofftetraoxid', '9.1', '304.4'),
  t('O3', 'g', 'Ozon', '142.7', '238.9'),
  t('MgO', 's', 'Magnesiumoxid', '-601.6', '27.0'),
  t('Al2O3', 's', 'Aluminiumoxid', '-1675.7', '50.9'),
  t('NaCl', 's', 'Natriumchlorid', '-411.2', '72.1'),
  t('Fe2O3', 's', 'Eisen(III)-oxid', '-824.2', '87.4'),
  t('CaO', 's', 'Calciumoxid', '-634.9', '38.1'),
  t('CaCO3', 's', 'Calciumcarbonat', '-1207.6', '91.7'),
  t('Ca(OH)2', 's', 'Calciumhydroxid', '-985.2', '83.4'),
  t('H2O2', 'l', 'Wasserstoffperoxid', '-187.8', '109.6'),
]

const BY_KEY = new Map(THERMO.map((x) => [x.key, x]))
export const thermoByKey = (key: string) => BY_KEY.get(key)
export const dfhOf = (key: string): Rational => parseDecimal(BY_KEY.get(key)!.dfh)!
export const sOf = (key: string): Rational => parseDecimal(BY_KEY.get(key)!.s)!

// Reaktion mit Zuständen; Stoffe als [Koeffizient, Schlüssel]
export type Term = readonly [number, string]
export type ThermoReaction = {
  // fest, nie umbenennen (steckt in den Formen der letzten Aufgaben)
  readonly id: string
  readonly left: readonly Term[]
  readonly right: readonly Term[]
  // Bildung aus den Elementen (alle Edukte sind Elemente im Standardzustand): schon in den Grundlagen
  readonly formation?: boolean
  // Beschreibung, z. B. „Verbrennung von Methan"
  readonly title: string
}

const r = (id: string, title: string, left: Term[], right: Term[]): ThermoReaction => ({ id, title, left, right, ...(left.every(([, k]) => BY_KEY.get(k)!.element) ? { formation: true } : {}) })

export const THERMO_REACTIONS: readonly ThermoReaction[] = [
  // Bildung aus den Elementen
  r('h2o', 'Bildung von Wasser', [[2, 'H2(g)'], [1, 'O2(g)']], [[2, 'H2O(l)']]),
  r('co2', 'Verbrennung von Kohlenstoff', [[1, 'C(s)'], [1, 'O2(g)']], [[1, 'CO2(g)']]),
  r('co', 'unvollständige Verbrennung von Kohlenstoff', [[2, 'C(s)'], [1, 'O2(g)']], [[2, 'CO(g)']]),
  r('nh3', 'Ammoniaksynthese', [[1, 'N2(g)'], [3, 'H2(g)']], [[2, 'NH3(g)']]),
  r('so2', 'Verbrennung von Schwefel', [[1, 'S(s)'], [1, 'O2(g)']], [[1, 'SO2(g)']]),
  r('hcl', 'Chlorknallgas-Reaktion', [[1, 'H2(g)'], [1, 'Cl2(g)']], [[2, 'HCl(g)']]),
  r('mgo', 'Verbrennung von Magnesium', [[2, 'Mg(s)'], [1, 'O2(g)']], [[2, 'MgO(s)']]),
  r('al2o3', 'Verbrennung von Aluminium', [[4, 'Al(s)'], [3, 'O2(g)']], [[2, 'Al2O3(s)']]),
  r('nacl', 'Bildung von Kochsalz', [[2, 'Na(s)'], [1, 'Cl2(g)']], [[2, 'NaCl(s)']]),
  r('fe2o3', 'Rosten von Eisen', [[4, 'Fe(s)'], [3, 'O2(g)']], [[2, 'Fe2O3(s)']]),
  r('cao', 'Verbrennung von Calcium', [[2, 'Ca(s)'], [1, 'O2(g)']], [[2, 'CaO(s)']]),
  r('hi', 'Bildung von Iodwasserstoff', [[1, 'H2(g)'], [1, 'I2(s)']], [[2, 'HI(g)']]),
  r('no2', 'Bildung von Stickstoffdioxid', [[1, 'N2(g)'], [2, 'O2(g)']], [[2, 'NO2(g)']]),
  r('c2h2', 'Bildung von Ethin', [[2, 'C(s)'], [1, 'H2(g)']], [[1, 'C2H2(g)']]),
  r('c2h4', 'Bildung von Ethen', [[2, 'C(s)'], [2, 'H2(g)']], [[1, 'C2H4(g)']]),
  r('ch4', 'Bildung von Methan', [[1, 'C(s)'], [2, 'H2(g)']], [[1, 'CH4(g)']]),
  r('o3', 'Bildung von Ozon', [[3, 'O2(g)']], [[2, 'O3(g)']]),
  r('h2o-g', 'Bildung von Wasserdampf', [[2, 'H2(g)'], [1, 'O2(g)']], [[2, 'H2O(g)']]),
  r('c2h6', 'Bildung von Ethan', [[2, 'C(s)'], [3, 'H2(g)']], [[1, 'C2H6(g)']]),
  r('c3h8', 'Bildung von Propan', [[3, 'C(s)'], [4, 'H2(g)']], [[1, 'C3H8(g)']]),
  r('c4h10', 'Bildung von Butan', [[8, 'C(s)'], [10, 'H2(g)']], [[2, 'C4H10(g)']]),
  r('ch3oh', 'Bildung von Methanol', [[2, 'C(s)'], [4, 'H2(g)'], [1, 'O2(g)']], [[2, 'CH3OH(l)']]),
  r('c2h5oh', 'Bildung von Ethanol', [[4, 'C(s)'], [6, 'H2(g)'], [1, 'O2(g)']], [[2, 'C2H5OH(l)']]),
  r('so3-bildung', 'Bildung von Schwefeltrioxid', [[2, 'S(s)'], [3, 'O2(g)']], [[2, 'SO3(g)']]),
  r('h2o2-bildung', 'Bildung von Wasserstoffperoxid', [[1, 'H2(g)'], [1, 'O2(g)']], [[1, 'H2O2(l)']]),
  r('caoh2', 'Bildung von Calciumhydroxid', [[1, 'Ca(s)'], [1, 'O2(g)'], [1, 'H2(g)']], [[1, 'Ca(OH)2(s)']]),
  r('caco3', 'Bildung von Calciumcarbonat', [[2, 'Ca(s)'], [2, 'C(s)'], [3, 'O2(g)']], [[2, 'CaCO3(s)']]),
  r('n2o4', 'Bildung von Distickstofftetraoxid', [[1, 'N2(g)'], [2, 'O2(g)']], [[1, 'N2O4(g)']]),
  // weitere Reaktionen
  r('ch4-verbrennung', 'Verbrennung von Methan', [[1, 'CH4(g)'], [2, 'O2(g)']], [[1, 'CO2(g)'], [2, 'H2O(l)']]),
  r('c3h8-verbrennung', 'Verbrennung von Propan', [[1, 'C3H8(g)'], [5, 'O2(g)']], [[3, 'CO2(g)'], [4, 'H2O(l)']]),
  r('c2h6-verbrennung', 'Verbrennung von Ethan', [[2, 'C2H6(g)'], [7, 'O2(g)']], [[4, 'CO2(g)'], [6, 'H2O(l)']]),
  r('c4h10-verbrennung', 'Verbrennung von Butan', [[2, 'C4H10(g)'], [13, 'O2(g)']], [[8, 'CO2(g)'], [10, 'H2O(l)']]),
  r('ethanol-verbrennung', 'Verbrennung von Ethanol', [[1, 'C2H5OH(l)'], [3, 'O2(g)']], [[2, 'CO2(g)'], [3, 'H2O(l)']]),
  r('methanol-verbrennung', 'Verbrennung von Methanol', [[2, 'CH3OH(l)'], [3, 'O2(g)']], [[2, 'CO2(g)'], [4, 'H2O(l)']]),
  r('glucose-verbrennung', 'Verbrennung von Glucose', [[1, 'C6H12O6(s)'], [6, 'O2(g)']], [[6, 'CO2(g)'], [6, 'H2O(l)']]),
  r('ethin-verbrennung', 'Verbrennung von Ethin', [[2, 'C2H2(g)'], [5, 'O2(g)']], [[4, 'CO2(g)'], [2, 'H2O(l)']]),
  r('co-verbrennung', 'Verbrennung von Kohlenstoffmonoxid', [[2, 'CO(g)'], [1, 'O2(g)']], [[2, 'CO2(g)']]),
  r('kalkbrennen', 'Kalkbrennen', [[1, 'CaCO3(s)']], [[1, 'CaO(s)'], [1, 'CO2(g)']]),
  r('kalkloeschen', 'Kalklöschen', [[1, 'CaO(s)'], [1, 'H2O(l)']], [[1, 'Ca(OH)2(s)']]),
  r('hochofen', 'Reduktion von Eisenoxid im Hochofen', [[1, 'Fe2O3(s)'], [3, 'CO(g)']], [[2, 'Fe(s)'], [3, 'CO2(g)']]),
  r('thermit', 'Thermitreaktion', [[1, 'Fe2O3(s)'], [2, 'Al(s)']], [[1, 'Al2O3(s)'], [2, 'Fe(s)']]),
  r('so3', 'Oxidation von Schwefeldioxid', [[2, 'SO2(g)'], [1, 'O2(g)']], [[2, 'SO3(g)']]),
  r('shift', 'Wassergas-Shift-Reaktion', [[1, 'CO(g)'], [1, 'H2O(g)']], [[1, 'CO2(g)'], [1, 'H2(g)']]),
  r('ethan', 'Hydrierung von Ethen', [[1, 'C2H4(g)'], [1, 'H2(g)']], [[1, 'C2H6(g)']]),
  r('h2o2', 'Zerfall von Wasserstoffperoxid', [[2, 'H2O2(l)']], [[2, 'H2O(l)'], [1, 'O2(g)']]),
  r('reforming', 'Dampfreformierung', [[1, 'CH4(g)'], [1, 'H2O(g)']], [[1, 'CO(g)'], [3, 'H2(g)']]),
  r('no2-dimer', 'Dimerisierung von Stickstoffdioxid', [[2, 'NO2(g)']], [[1, 'N2O4(g)']]),
]

export const thermoReactionById = (id: string) => THERMO_REACTIONS.find((x) => x.id === id)

// Summe Σ ν · Wert über eine Seite; mit Fehlern: Koeffizienten vergessen, H₂O(g) statt H₂O(l), Elemente mit 0
export type SumMode = { readonly noCoef?: boolean; readonly waterGas?: boolean }
export function sideSum(side: readonly Term[], value: (key: string) => Rational, mode: SumMode = {}): Rational {
  return side.reduce((acc, [coef, key]) => ratAdd(acc, ratMul(rat(mode.noCoef ? 1 : coef), value(mode.waterGas && key === 'H2O(l)' ? 'H2O(g)' : key))), rat(0))
}

export const reactionDH = (x: ThermoReaction, mode: SumMode = {}) => ratSub(sideSum(x.right, dfhOf, mode), sideSum(x.left, dfhOf, mode))
export const reactionDS = (x: ThermoReaction, mode: SumMode = {}) => ratSub(sideSum(x.right, sOf, mode), sideSum(x.left, sOf, mode))

// Gleichung mit Zuständen, z. B. „\ce{CH4(g) + 2 O2(g) -> CO2(g) + 2 H2O(l)}"
const sideCe = (side: readonly Term[]) => side.map(([c, k]) => `${c > 1 ? `${c} ` : ''}${k}`).join(' + ')
export const reactionCe = (x: ThermoReaction) => String.raw`\ce{${sideCe(x.left)} -> ${sideCe(x.right)}}`
// Stoffe einer Reaktion (ohne Doppelte)
export const keysOf = (x: ThermoReaction) => [...new Set([...x.left, ...x.right].map(([, k]) => k))]
