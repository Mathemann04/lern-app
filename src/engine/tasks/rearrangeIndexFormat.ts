// Aufbau des Verzeichnisses der Umstell-Aufgaben nach Bausteinen (scripts/rearrange-index.ts, rearrangeIndex.ts):
// wie viele Nummern je Stufe erfasst sind und mit welchen Zeichen die Stelle der Kombination geschrieben wird. Mehr Nummern
// in einer Stufe heißt mehr Aufgaben für seltene Bausteine (in Stufe 5 ist etwa jede 130. Aufgabe eine reine
// Determinanten-Aufgabe).

export const REARRANGE_INDEX_LEVELS: Readonly<Record<1 | 2 | 3 | 4 | 5, number>> = { 1: 3000, 2: 3000, 3: 4000, 4: 8000, 5: 12000 }

export const INDEX_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
