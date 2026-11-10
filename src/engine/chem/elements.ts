// Tabelle der Elemente für die Chemie-Rechnungen (docs/CHEMIE.md §4): Ordnungszahl 1 bis 56 sowie
// Platin, Gold, Quecksilber, Blei und Bismut. Je Element: Symbol, deutscher Name (Schreibweise wie in
// docs/CHEMIE.md §3: Silicium, Bismut, Iod), Molmasse mit einer Nachkommastelle wie im PSE der Klausur
// (als Text; gerechnet wird exakt mit rational.ts), Massenzahlen der Isotope, die für Aufgaben in Frage
// kommen, und die typischen Ionenladungen.
//
// Quellen (abgerufen 10.11.2026):
// - Molmassen: IUPAC, Standard-Atomgewichte (Tabelle 2021, gekürzt auf eine Nachkommastelle).
//   Genauere Werte nur in elements.test.ts zur Gegenprobe.
// - Isotope: die in der Natur vorkommenden Isotope (IUPAC, Isotopenhäufigkeiten), dazu Tritium (³H)
//   und ¹⁴C als bekannte Beispiele aus dem Unterricht. Technetium hat kein natürliches Isotop und
//   kommt deshalb in Aufgaben zu Teilchenzahlen nicht vor.
// - Ionenladungen: nur die Ladungen, die in der Vorlesung und in Lehrbüchern als typisch gelten
//   (Hauptgruppen nach der Gruppe, bei Nebengruppen die üblichen wie Fe²⁺ und Fe³⁺). Leere Liste: In
//   Aufgaben kommt das Element nur als ungeladenes Atom vor.
// Spalten für spätere Schritte (Elektronegativität, Radien, Ionisierungsenergie, Elektronenaffinität,
// Metallcharakter) kommen mit den Schritten dazu, die sie brauchen (S5, S6), je mit Quelle.

export type Element = {
  // Ordnungszahl
  readonly z: number
  readonly symbol: string
  // deutscher Name
  readonly name: string
  // Molmasse in g/mol mit einer Nachkommastelle, als Text mit Punkt (z. B. „35.5"); bei Technetium
  // die Massenzahl des langlebigsten Isotops
  readonly molarMass: string
  // Massenzahlen der Isotope für Aufgaben, aufsteigend
  readonly isotopes: readonly number[]
  // typische Ionenladungen (mit Vorzeichen)
  readonly ions: readonly number[]
}

const e = (z: number, symbol: string, name: string, molarMass: string, isotopes: readonly number[], ions: readonly number[] = []): Element => ({
  z,
  symbol,
  name,
  molarMass,
  isotopes,
  ions,
})

export const ELEMENTS: readonly Element[] = [
  e(1, 'H', 'Wasserstoff', '1.0', [1, 2, 3], [1, -1]),
  e(2, 'He', 'Helium', '4.0', [3, 4]),
  e(3, 'Li', 'Lithium', '6.9', [6, 7], [1]),
  e(4, 'Be', 'Beryllium', '9.0', [9], [2]),
  e(5, 'B', 'Bor', '10.8', [10, 11]),
  e(6, 'C', 'Kohlenstoff', '12.0', [12, 13, 14]),
  e(7, 'N', 'Stickstoff', '14.0', [14, 15], [-3]),
  e(8, 'O', 'Sauerstoff', '16.0', [16, 17, 18], [-2]),
  e(9, 'F', 'Fluor', '19.0', [19], [-1]),
  e(10, 'Ne', 'Neon', '20.2', [20, 21, 22]),
  e(11, 'Na', 'Natrium', '23.0', [23], [1]),
  e(12, 'Mg', 'Magnesium', '24.3', [24, 25, 26], [2]),
  e(13, 'Al', 'Aluminium', '27.0', [27], [3]),
  e(14, 'Si', 'Silicium', '28.1', [28, 29, 30]),
  e(15, 'P', 'Phosphor', '31.0', [31], [-3]),
  e(16, 'S', 'Schwefel', '32.1', [32, 33, 34, 36], [-2]),
  e(17, 'Cl', 'Chlor', '35.5', [35, 37], [-1]),
  e(18, 'Ar', 'Argon', '39.9', [36, 38, 40]),
  e(19, 'K', 'Kalium', '39.1', [39, 40, 41], [1]),
  e(20, 'Ca', 'Calcium', '40.1', [40, 42, 43, 44, 46, 48], [2]),
  e(21, 'Sc', 'Scandium', '45.0', [45], [3]),
  e(22, 'Ti', 'Titan', '47.9', [46, 47, 48, 49, 50]),
  e(23, 'V', 'Vanadium', '50.9', [50, 51]),
  e(24, 'Cr', 'Chrom', '52.0', [50, 52, 53, 54], [3]),
  e(25, 'Mn', 'Mangan', '54.9', [55], [2]),
  e(26, 'Fe', 'Eisen', '55.8', [54, 56, 57, 58], [2, 3]),
  e(27, 'Co', 'Cobalt', '58.9', [59], [2, 3]),
  e(28, 'Ni', 'Nickel', '58.7', [58, 60, 61, 62, 64], [2]),
  e(29, 'Cu', 'Kupfer', '63.5', [63, 65], [1, 2]),
  e(30, 'Zn', 'Zink', '65.4', [64, 66, 67, 68, 70], [2]),
  e(31, 'Ga', 'Gallium', '69.7', [69, 71], [3]),
  e(32, 'Ge', 'Germanium', '72.6', [70, 72, 73, 74, 76]),
  e(33, 'As', 'Arsen', '74.9', [75]),
  e(34, 'Se', 'Selen', '79.0', [74, 76, 77, 78, 80, 82], [-2]),
  e(35, 'Br', 'Brom', '79.9', [79, 81], [-1]),
  e(36, 'Kr', 'Krypton', '83.8', [78, 80, 82, 83, 84, 86]),
  e(37, 'Rb', 'Rubidium', '85.5', [85, 87], [1]),
  e(38, 'Sr', 'Strontium', '87.6', [84, 86, 87, 88], [2]),
  e(39, 'Y', 'Yttrium', '88.9', [89], [3]),
  e(40, 'Zr', 'Zirconium', '91.2', [90, 91, 92, 94, 96]),
  e(41, 'Nb', 'Niob', '92.9', [93]),
  e(42, 'Mo', 'Molybdän', '96.0', [92, 94, 95, 96, 97, 98, 100]),
  e(43, 'Tc', 'Technetium', '98', []),
  e(44, 'Ru', 'Ruthenium', '101.1', [96, 98, 99, 100, 101, 102, 104]),
  e(45, 'Rh', 'Rhodium', '102.9', [103]),
  e(46, 'Pd', 'Palladium', '106.4', [102, 104, 105, 106, 108, 110]),
  e(47, 'Ag', 'Silber', '107.9', [107, 109], [1]),
  e(48, 'Cd', 'Cadmium', '112.4', [106, 108, 110, 111, 112, 113, 114, 116], [2]),
  e(49, 'In', 'Indium', '114.8', [113, 115], [3]),
  e(50, 'Sn', 'Zinn', '118.7', [112, 114, 115, 116, 117, 118, 119, 120, 122, 124], [2, 4]),
  e(51, 'Sb', 'Antimon', '121.8', [121, 123]),
  e(52, 'Te', 'Tellur', '127.6', [120, 122, 123, 124, 125, 126, 128, 130], [-2]),
  e(53, 'I', 'Iod', '126.9', [127], [-1]),
  e(54, 'Xe', 'Xenon', '131.3', [124, 126, 128, 129, 130, 131, 132, 134, 136]),
  e(55, 'Cs', 'Caesium', '132.9', [133], [1]),
  e(56, 'Ba', 'Barium', '137.3', [130, 132, 134, 135, 136, 137, 138], [2]),
  e(78, 'Pt', 'Platin', '195.1', [190, 192, 194, 195, 196, 198], [2]),
  e(79, 'Au', 'Gold', '197.0', [197], [1, 3]),
  e(80, 'Hg', 'Quecksilber', '200.6', [196, 198, 199, 200, 201, 202, 204], [2]),
  e(82, 'Pb', 'Blei', '207.2', [204, 206, 207, 208], [2, 4]),
  e(83, 'Bi', 'Bismut', '209.0', [209], [3]),
]

const BY_Z = new Map(ELEMENTS.map((el) => [el.z, el]))
const BY_SYMBOL = new Map(ELEMENTS.map((el) => [el.symbol, el]))

// Element mit dieser Ordnungszahl; undefined, wenn es nicht in der Tabelle steht
export const elementByZ = (z: number): Element | undefined => BY_Z.get(z)
export const elementBySymbol = (symbol: string): Element | undefined => BY_SYMBOL.get(symbol)
