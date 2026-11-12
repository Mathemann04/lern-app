// Bausteine der Tätigkeiten (M6, docs/PLAN-M6.md „Bausteine je Tätigkeit"): ein Stück Stoff wie „Wurzeln" oder
// „Determinanten", das man ankreuzen kann. Reine Daten ohne Engine, damit die Seiten ohne Mathe-Engine laden.
// Ids sind fest und werden nie umbenannt (sie stehen in den Einstellungen auf dem Gerät).

export type BlockGroup = { readonly id: string; readonly title: string }

export type Block = {
  readonly id: string
  // reiner Text ohne Formeln
  readonly title: string
  // kurzer Zusatz unter dem Titel (reiner Text)
  readonly note?: string
  // Id der Gruppe
  readonly group: string
}

export const BLOCK_GROUPS: readonly BlockGroup[] = [
  { id: 'grundlagen', title: 'Grundlagen' },
  { id: 'funktionen', title: 'Funktionen' },
  { id: 'spaeter', title: 'Aus späteren Kapiteln' },
  // Tätigkeit „Vektoren“ (M7)
  { id: 'vektor-grundlagen', title: 'Grundlagen' },
]

// Gleichungen umstellen. „Lineare Gleichungen" sind die Aufgaben ganz ohne andere Bausteine (die Variable steht nur
// in Klammern, Summen und Produkten); Klammern, Punkt vor Strich, mal und durch und auf beide Seiten bringen sind kein
// Baustein, sondern Handwerkszeug jeder Aufgabe.
export const REARRANGE_BLOCKS: readonly Block[] = [
  { id: 'linear', title: 'Lineare Gleichungen', note: 'Klammern, Variable mehrfach, nach einem Buchstaben', group: 'grundlagen' },
  { id: 'brueche', title: 'Brüche', note: 'Variable im Nenner, Doppelbrüche', group: 'grundlagen' },
  { id: 'wurzeln', title: 'Wurzeln', group: 'grundlagen' },
  { id: 'potenzen', title: 'Quadrate und Potenzen', note: 'auch Wurzel ziehen', group: 'grundlagen' },
  { id: 'exp', title: 'e-Funktion', note: 'auch andere Basen wie 2 hoch x', group: 'grundlagen' },
  { id: 'log', title: 'Logarithmus', note: 'ln und Logarithmen zu anderen Basen', group: 'grundlagen' },
  { id: 'quadratisch', title: 'Quadratische Gleichungen', note: 'pq-Formel, Substitution', group: 'grundlagen' },
  { id: 'winkel', title: 'Winkelfunktionen', note: 'mit Umkehrfunktionen und Additionstheoremen', group: 'funktionen' },
  { id: 'hyperbel', title: 'Hyperbelfunktionen', group: 'funktionen' },
  { id: 'ableitung', title: 'Ableitungen', group: 'spaeter' },
  { id: 'integral', title: 'Integrale', group: 'spaeter' },
  { id: 'reihen', title: 'Summen und Reihen', group: 'spaeter' },
  { id: 'grenzwert', title: 'Grenzwerte', group: 'spaeter' },
  { id: 'dgl', title: 'Differentialgleichungen', group: 'spaeter' },
  { id: 'det', title: 'Determinanten', group: 'spaeter' },
  { id: 'komplex', title: 'Komplexe Zahlen', note: 'Betrag und Winkel', group: 'spaeter' },
  { id: 'vektoren', title: 'Vektoren', note: 'Länge, Skalarprodukt, Winkel', group: 'spaeter' },
]

// Vektoren (M7, docs/PLAN-M7.md): Schritt 1 bringt „Rechnen und Länge“, Schritt 2 „Skalarprodukt und Winkel“, Schritt 3a
// „Projektion und Zerlegung“; die übrigen Bausteine folgen in den Schritten 3b bis 5.
export const VECTOR_BLOCKS: readonly Block[] = [
  { id: 'rechnen', title: 'Rechnen und Länge', note: 'Summe, Vielfache, Verbindungsvektor, Mittelpunkt, Länge, Einheitsvektor', group: 'vektor-grundlagen' },
  { id: 'skalar', title: 'Skalarprodukt und Winkel', note: 'senkrecht, spitz, stumpf, Winkel, Länge aus Winkel', group: 'vektor-grundlagen' },
  { id: 'projektion', title: 'Projektion und Zerlegung', note: 'Schatten, parallel und senkrecht zerlegen, Lotfußpunkt, Abstand', group: 'vektor-grundlagen' },
]

// Spielbare Mengen von Bausteinen je Stufe (wie REARRANGE_PLAYABLE_COMBOS)
export const VECTOR_PLAYABLE_COMBOS: Readonly<Record<1 | 2 | 3 | 4 | 5, readonly string[]>> = {
  1: ['rechnen', 'skalar', 'projektion'],
  2: ['rechnen', 'skalar', 'projektion'],
  3: ['rechnen', 'skalar', 'projektion'],
  4: ['rechnen', 'skalar', 'projektion'],
  5: ['rechnen', 'skalar', 'projektion'],
}

// Feste Nummer je Baustein für Aufgabennummern mit Baustein wie „exp.1-4711" (M6 Schritt 4, taskNumber.ts). Gilt für alle
// Tätigkeiten (dieselbe Id heißt überall derselbe Baustein); nie ändern, neue Bausteine bekommen die nächste freie Nummer.
export const BLOCK_CODES: Readonly<Record<string, number>> = {
  linear: 1,
  brueche: 2,
  wurzeln: 3,
  potenzen: 4,
  exp: 5,
  log: 6,
  quadratisch: 7,
  winkel: 8,
  hyperbel: 9,
  ableitung: 10,
  integral: 11,
  reihen: 12,
  grenzwert: 13,
  dgl: 14,
  det: 15,
  komplex: 16,
  vektoren: 17,
  // kein Baustein, sondern eine Sammlung: Aufgaben aus der Formelsammlung (formulas.ts, „formel.2-1")
  formel: 18,
  // kein Baustein, sondern eine Sammlung: Logarithmen auf beiden Seiten, verschiedene Basen (logEquationKinds.ts,
  // „logeq.2-4711", M6 Schritt 4b-2)
  logeq: 19,
  // kein Baustein, sondern eine Sammlung: Gleichungen mit Zahlen (numberEquationKinds.ts, „zahlen.2-4711", M6 Schritt 4b-3)
  zahlen: 20,
  // Tätigkeit „Vektoren“ (M7 Schritt 1): Rechnen und Länge („rechnen.1-4711“)
  rechnen: 21,
  // Tätigkeit „Vektoren“ (M7 Schritt 2): Skalarprodukt und Winkel („skalar.1-4711“)
  skalar: 22,
  // Tätigkeit „Vektoren“ (M7 Schritt 3a): Projektion und Zerlegung („projektion.1-4711“)
  projektion: 23,
}
