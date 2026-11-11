import { elementBySymbol } from './elements.ts'

// Namen von Molekülverbindungen aus zwei Nichtmetallen (Plan M4, Thema 3.2): Das weniger elektronegative Element
// steht vorn, das zweite bekommt die Endung -id; Vorsilben zählen die Atome. Am ersten Element entfällt „mono";
// am zweiten bleibt es (Kohlenstoffmonoxid), „mono" vor „oxid" verliert sein o. Andere Vokale bleiben stehen
// (Tetraphosphordecaoxid). Die Namen rechnet die Engine aus den Anzahlen; Tests prüfen sie gegen eine Liste.

export type MolCompound = {
  // [erstes Element, Anzahl, zweites Element, Anzahl]
  readonly parts: readonly [string, number, string, number]
  readonly level: 2 | 3
}

export const PREFIXES: Readonly<Record<number, string>> = { 1: 'mono', 2: 'di', 3: 'tri', 4: 'tetra', 5: 'penta', 6: 'hexa', 7: 'hepta', 10: 'deca' }

const STEMS: Readonly<Record<string, string>> = { O: 'oxid', F: 'fluorid', Cl: 'chlorid', Br: 'bromid', S: 'sulfid' }

const c = (a: string, x: number, b: string, y: number, level: 2 | 3 = 2): MolCompound => ({ parts: [a, x, b, y], level })

// Nur Verbindungen mit eindeutigem Namen nach diesen Regeln (keine mit „tetroxid"/„pentoxid"-Varianten wie N₂O₄)
export const MOL_COMPOUNDS: readonly MolCompound[] = [
  c('C', 1, 'O', 1),
  c('C', 1, 'O', 2),
  c('N', 1, 'O', 1),
  c('N', 1, 'O', 2),
  c('N', 2, 'O', 1),
  c('N', 2, 'O', 3, 3),
  c('S', 1, 'O', 2),
  c('S', 1, 'O', 3),
  c('C', 1, 'S', 2),
  c('P', 1, 'Cl', 3),
  c('P', 1, 'Cl', 5),
  c('P', 1, 'Br', 3),
  c('S', 1, 'F', 6),
  c('Si', 1, 'Cl', 4),
  c('Si', 1, 'F', 4),
  c('N', 1, 'F', 3),
  c('O', 1, 'F', 2, 3),
  c('B', 1, 'F', 3),
  c('B', 1, 'Cl', 3),
  c('Cl', 1, 'F', 3, 3),
  c('S', 1, 'Cl', 2),
  c('S', 2, 'Cl', 2, 3),
  c('P', 4, 'O', 10, 3),
  c('P', 4, 'O', 6, 3),
  c('C', 1, 'Cl', 4),
]

// Summenformel, z. B. „N2O"
export const compoundFormula = ([a, x, b, y]: readonly [string, number, string, number]) => `${a}${x > 1 ? x : ''}${b}${y > 1 ? y : ''}`

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Name aus den Anzahlen; firstPrefix/secondPrefix: wie viele Atome die Vorsilbe nennt (für Fehler), null ohne Vorsilbe
export function compoundName(parts: readonly [string, number, string, number], counts: { first: number | null; second: number | null } = { first: parts[1], second: parts[3] }): string {
  const [a, , b] = parts
  const first = elementBySymbol(a)!.name.toLowerCase()
  const firstPrefix = counts.first === null || counts.first === 1 ? '' : PREFIXES[counts.first]
  const stem = STEMS[b]
  let secondPrefix = counts.second === null ? '' : PREFIXES[counts.second]
  if (secondPrefix === 'mono' && stem.startsWith('o')) secondPrefix = 'mon'
  return capitalize(`${firstPrefix}${first}${secondPrefix}${stem}`)
}

export const compoundId = (m: MolCompound) => compoundFormula(m.parts)
