import { PAULING } from './electronegativity.ts'
import { type Element, elementBySymbol } from './elements.ts'
import { placeOf } from './pse.ts'

// Trends im Periodensystem (Plan M4, Thema 2.2; docs/CHEMIE.md §4 und §6): Messwerte der Hauptgruppenelemente und die
// Regel, nach der die App ordnen lässt. Geordnet wird nur, wo Regel und Messwerte übereinstimmen: jedes Paar in
// derselben Periode oder Gruppe (nie über die Diagonale), ohne Edelgase und ohne die Paare aus §6, mit einem
// deutlichen Unterschied der Werte (mindestens 3 %). trends.test.ts prüft jede erlaubte Reihe gegen die Tabelle.
//
// Quellen (abgerufen 11.11.2026):
// - Atomradien: Kovalenzradien nach Cordero u. a. (2008), in pm (Kohlenstoff sp³). Nicht die Van-der-Waals-Radien.
// - Erste Ionisierungsenergie: NIST Atomic Spectra Database, in kJ/mol gerundet.
// - Elektronegativität: Pauling, PubChem (wie electronegativity.ts), ergänzt um die übrigen Hauptgruppen.
// - Ionenradien: Shannon (1976), Koordinationszahl 6, in pm.
// Die Elektronenaffinität wird nicht geordnet (die Messwerte folgen der Regel zu oft nicht, §6); sie kommt nur in
// Wissensfragen vor.

export type Property = 'radius' | 'ie' | 'en'

export const RADIUS: Readonly<Record<string, number>> = {
  Li: 128, Be: 96, B: 84, C: 76, N: 71, O: 66, F: 57,
  Na: 166, Mg: 141, Al: 121, Si: 111, P: 107, S: 105, Cl: 102,
  K: 203, Ca: 176, Ga: 122, Ge: 120, As: 119, Se: 120, Br: 120,
  Rb: 220, Sr: 195, In: 142, Sn: 139, Sb: 139, Te: 138, I: 139,
  Cs: 244, Ba: 215, Pb: 146, Bi: 148,
}

export const FIRST_IE: Readonly<Record<string, number>> = {
  Li: 520, Be: 900, B: 801, C: 1086, N: 1402, O: 1314, F: 1681,
  Na: 496, Mg: 738, Al: 578, Si: 787, P: 1012, S: 1000, Cl: 1251,
  K: 419, Ca: 590, Ga: 579, Ge: 762, As: 947, Se: 941, Br: 1140,
  Rb: 403, Sr: 550, In: 558, Sn: 709, Sb: 834, Te: 869, I: 1008,
  Cs: 376, Ba: 503, Pb: 716, Bi: 703,
}

// Pauling-Werte über die Tabelle in electronegativity.ts hinaus (PubChem)
const EN_EXTRA: Readonly<Record<string, string>> = {
  Rb: '0.82', Sr: '0.95', Cs: '0.79', Ba: '0.89', Ga: '1.81', Ge: '2.01', As: '2.18', Se: '2.55',
  In: '1.78', Sn: '1.96', Sb: '2.05', Te: '2.10', Pb: '2.33', Bi: '2.02',
}
export const EN: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries({ ...PAULING, ...EN_EXTRA })
    .filter(([s]) => s !== 'H')
    .map(([s, v]) => [s, Number(v)]),
)

export const VALUES: Readonly<Record<Property, Readonly<Record<string, number>>>> = { radius: RADIUS, ie: FIRST_IE, en: EN }

// Richtung der Zunahme nach der Regel: in der Periode nach rechts (+1) oder links (−1), in der Gruppe nach unten (+1)
// oder oben (−1)
export const RULE: Readonly<Record<Property, { readonly period: 1 | -1; readonly group: 1 | -1 }>> = {
  radius: { period: -1, group: 1 },
  ie: { period: 1, group: -1 },
  en: { period: 1, group: -1 },
}

// Paare, die laut docs/CHEMIE.md §6 nie verglichen werden (zusätzlich zur Prüfung gegen die Messwerte)
const EXCLUDED: Readonly<Record<Property, readonly (readonly [string, string])[]>> = {
  radius: [['As', 'Se'], ['As', 'Br'], ['Se', 'Br'], ['Sn', 'Sb'], ['Te', 'I'], ['Pb', 'Bi']],
  ie: [['Be', 'B'], ['Mg', 'Al'], ['Ca', 'Ga'], ['Sr', 'In'], ['N', 'O'], ['P', 'S'], ['As', 'Se'], ['Sb', 'Te'], ['Pb', 'Bi'], ['Al', 'Ga'], ['Sn', 'Pb'], ['B', 'Al']],
  en: [['K', 'Rb'], ['Al', 'Ga'], ['B', 'Al'], ['Si', 'Ge'], ['Ge', 'Sn'], ['Ga', 'In'], ['Sn', 'Pb'], ['In', 'Tl'], ['Bi', 'Sb'], ['Pb', 'Bi']],
}

const excluded = (prop: Property, a: string, b: string) => EXCLUDED[prop].some(([x, y]) => (x === a && y === b) || (x === b && y === a))

// Wert nach der Regel: größer oder kleiner? +1: b größer als a, −1: a größer; null: nicht vergleichbar (Diagonale)
export function ruleOrder(prop: Property, a: Element, b: Element): 1 | -1 | null {
  const pa = placeOf(a)
  const pb = placeOf(b)
  if (pa.period === pb.period && pa.group !== pb.group) return (Math.sign(pb.group - pa.group) * RULE[prop].period) as 1 | -1
  if (pa.group === pb.group && pa.period !== pb.period) return (Math.sign(pb.period - pa.period) * RULE[prop].group) as 1 | -1
  return null
}

// Darf dieses Paar gefragt werden? Gleiche Periode oder Gruppe, keine Edelgase, nicht ausgeschlossen, Messwerte folgen
// der Regel mit mindestens 3 % Unterschied
export function comparable(prop: Property, a: Element, b: Element): boolean {
  const va = VALUES[prop][a.symbol]
  const vb = VALUES[prop][b.symbol]
  if (va === undefined || vb === undefined || excluded(prop, a.symbol, b.symbol)) return false
  const rule = ruleOrder(prop, a, b)
  if (rule === null) return false
  // Ionisierungsenergie und Elektronegativität nie innerhalb der Gruppen 13 und 14 (§6)
  const pa = placeOf(a)
  if (prop !== 'radius' && pa.group === placeOf(b).group && (pa.group === 13 || pa.group === 14)) return false
  const measured = Math.sign(vb - va)
  return measured === rule && Math.abs(vb - va) / Math.min(va, vb) >= 0.03
}

// Reihe nach steigendem Wert ordnen (nach der Regel; nur für erlaubte Reihen)
export const ascending = (prop: Property, els: readonly Element[]) => [...els].sort((a, b) => VALUES[prop][a.symbol] - VALUES[prop][b.symbol])

// alle Paare einer Reihe vergleichbar?
export const allComparable = (prop: Property, els: readonly Element[]) => els.every((a, i) => els.slice(i + 1).every((b) => comparable(prop, a, b)))

export const TREND_ELEMENTS: readonly Element[] = Object.keys(RADIUS).map((s) => elementBySymbol(s)!)

// --- Ionenradien isoelektronischer Reihen ---

export type IonRadius = { readonly symbol: string; readonly charge: number; readonly radius: number }
export const ISOELECTRONIC: readonly { readonly like: string; readonly ions: readonly IonRadius[] }[] = [
  {
    like: 'Ne',
    ions: [
      { symbol: 'O', charge: -2, radius: 140 },
      { symbol: 'F', charge: -1, radius: 133 },
      { symbol: 'Na', charge: 1, radius: 102 },
      { symbol: 'Mg', charge: 2, radius: 72 },
      { symbol: 'Al', charge: 3, radius: 54 },
    ],
  },
  {
    like: 'Ar',
    ions: [
      { symbol: 'S', charge: -2, radius: 184 },
      { symbol: 'Cl', charge: -1, radius: 181 },
      { symbol: 'K', charge: 1, radius: 138 },
      { symbol: 'Ca', charge: 2, radius: 100 },
    ],
  },
]
