// Elektronegativität nach Pauling (docs/CHEMIE.md §4 und §5). Erst die Hauptgruppen-Elemente, die in
// Molekülen und Salzen vorkommen; die übrigen kommen mit S6 (Trends im Periodensystem).
//
// Quellen (abgerufen 11.11.2026):
// - PAULING: PubChem, Periodic Table, Spalte „Electronegativity“ (Pauling-Skala, zwei Nachkommastellen).
// - ROUNDED: ältere, auf eine Nachkommastelle gerundete Pauling-Tabelle, wie sie in Schulbüchern und älteren
//   Skripten steht (C 2,5; O 3,5; Cl 3,0). Sie dient nur zum Abgleich: Die App fragt eine Bindungsart aus
//   ΔEN nur ab, wenn beide Tabellen dieselbe ergeben (CHEMIE.md §5).

export const PAULING: Readonly<Record<string, string>> = {
  H: '2.20',
  Li: '0.98',
  Be: '1.57',
  B: '2.04',
  C: '2.55',
  N: '3.04',
  O: '3.44',
  F: '3.98',
  Na: '0.93',
  Mg: '1.31',
  Al: '1.61',
  Si: '1.90',
  P: '2.19',
  S: '2.58',
  Cl: '3.16',
  K: '0.82',
  Ca: '1.00',
  Br: '2.96',
  I: '2.66',
}

export const ROUNDED: Readonly<Record<string, string>> = {
  H: '2.1',
  Li: '1.0',
  Be: '1.5',
  B: '2.0',
  C: '2.5',
  N: '3.0',
  O: '3.5',
  F: '4.0',
  Na: '0.9',
  Mg: '1.2',
  Al: '1.5',
  Si: '1.8',
  P: '2.1',
  S: '2.5',
  Cl: '3.0',
  K: '0.8',
  Ca: '1.0',
  Br: '2.8',
  I: '2.5',
}

// Elektronegativität in Hundertsteln (ganze Zahl, damit Differenzen exakt sind)
export function enHundredths(symbol: string, table: Readonly<Record<string, string>> = PAULING): number {
  const value = table[symbol]
  if (value === undefined) throw new Error(`Keine Elektronegativität für ${symbol}`)
  return Math.round(Number(value) * 100)
}

// Bindungsart aus ΔEN (CHEMIE.md §5): unter 0,5 unpolar, 0,5 bis 1,8 polar, darüber Ionenbindung
export type BondType = 'unpolar' | 'polar' | 'ionisch'

export function bondTypeOf(deltaHundredths: number): BondType {
  if (deltaHundredths < 50) return 'unpolar'
  if (deltaHundredths <= 180) return 'polar'
  return 'ionisch'
}

// ΔEN einer Bindung in Hundertsteln
export const deltaEn = (a: string, b: string, table: Readonly<Record<string, string>> = PAULING) => Math.abs(enHundredths(a, table) - enHundredths(b, table))

// Darf die App nach der Bindungsart fragen? Beide Tabellen gleich, mindestens 0,1 von jeder Grenze entfernt
export function bondTypeAskable(a: string, b: string): boolean {
  const d = deltaEn(a, b)
  if (Math.abs(d - 50) < 10 || Math.abs(d - 180) < 10) return false
  return bondTypeOf(d) === bondTypeOf(deltaEn(a, b, ROUNDED))
}

// ΔEN als Zahl mit Komma für LaTeX, z. B. „1{,}24"
export const enLatex = (hundredths: number) => `${Math.floor(hundredths / 100)}{,}${String(hundredths % 100).padStart(2, '0')}`
