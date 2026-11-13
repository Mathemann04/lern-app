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
  // Tätigkeit „Geraden und Ebenen“ (M7 Schritt 6)
  { id: 'geo-formen', title: 'Formen' },
  // seit Schritt 7a
  { id: 'geo-lage', title: 'Lage, Abstände, Winkel' },
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
// „Projektion und Zerlegung“, Schritt 3b „Kräfte“, Schritt 4a „Kreuzprodukt und Fläche“, Schritt 4b „Spatprodukt und Volumen“, Schritt 5 „Linearkombination und Basis“.
export const VECTOR_BLOCKS: readonly Block[] = [
  { id: 'rechnen', title: 'Rechnen und Länge', note: 'Summe, Vielfache, Verbindungsvektor, Mittelpunkt, Länge, Einheitsvektor', group: 'vektor-grundlagen' },
  { id: 'skalar', title: 'Skalarprodukt und Winkel', note: 'senkrecht, spitz, stumpf, Winkel, Länge aus Winkel', group: 'vektor-grundlagen' },
  { id: 'projektion', title: 'Projektion und Zerlegung', note: 'Schatten, parallel und senkrecht zerlegen, Lotfußpunkt, Abstand', group: 'vektor-grundlagen' },
  { id: 'kraefte', title: 'Kräfte', note: 'Betrag und Winkel, Resultierende, schiefe Ebene, Arbeit, Drehmoment, Seilkräfte', group: 'vektor-grundlagen' },
  { id: 'kreuz', title: 'Kreuzprodukt und Fläche', note: 'Kreuzprodukt, Fläche von Parallelogramm und Dreieck, Normalenvektor, Abstand Punkt–Gerade', group: 'vektor-grundlagen' },
  { id: 'spat', title: 'Spatprodukt und Volumen', note: 'Spatprodukt mit Sarrus, komplanar, Rechtssystem, Volumen von Spat, Prisma, Pyramide und Tetraeder, Höhe', group: 'vektor-grundlagen' },
  { id: 'basis', title: 'Linearkombination und Basis', note: 'Linearkombination, Spann, linear unabhängig, Dimension und Basis, Koordinaten, Gleichungssysteme Schritt für Schritt', group: 'vektor-grundlagen' },
]

// Spielbare Mengen von Bausteinen je Stufe (wie REARRANGE_PLAYABLE_COMBOS)
export const VECTOR_PLAYABLE_COMBOS: Readonly<Record<1 | 2 | 3 | 4 | 5, readonly string[]>> = {
  1: ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis'],
  2: ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis'],
  3: ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis'],
  4: ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis'],
  5: ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis'],
}

// Geraden und Ebenen (M7 Schritt 6): „Geraden“ und „Ebenen“ (Formen); seit Schritt 7a „Lage“, Abstände und Winkel folgen in Schritt 7b
export const LINE_BLOCKS: readonly Block[] = [
  { id: 'gerade', title: 'Geraden', note: 'Parameterform, Punkt auf der Geraden, Punktprobe, Spurpunkte, Punkte mit Abstand', group: 'geo-formen' },
  { id: 'ebene', title: 'Ebenen', note: 'Parameter-, Normalen- und Koordinatenform, umrechnen, Hessesche Normalform, Spurpunkte', group: 'geo-formen' },
  { id: 'lage', title: 'Lage', note: 'zwei Geraden, Gerade und Ebene, zwei Ebenen, Schnittpunkt, Durchstoßpunkt, Schnittgerade', group: 'geo-lage' },
]

export const LINE_PLAYABLE_COMBOS: Readonly<Record<1 | 2 | 3 | 4 | 5, readonly string[]>> = {
  1: ['gerade', 'ebene', 'lage'],
  2: ['gerade', 'ebene', 'lage'],
  3: ['gerade', 'ebene', 'lage'],
  4: ['gerade', 'ebene', 'lage'],
  5: ['gerade', 'ebene', 'lage'],
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
  // Tätigkeit „Vektoren“ (M7 Schritt 3b): Kräfte („kraefte.1-4711“)
  kraefte: 24,
  // Tätigkeit „Vektoren“ (M7 Schritt 4a): Kreuzprodukt und Fläche („kreuz.1-4711“)
  kreuz: 25,
  // Tätigkeit „Vektoren“ (M7 Schritt 4b): Spatprodukt und Volumen („spat.1-4711“)
  spat: 26,
  // Tätigkeit „Vektoren“ (M7 Schritt 5): Linearkombination und Basis („basis.1-4711“)
  basis: 27,
  // Tätigkeit „Geraden und Ebenen“ (M7 Schritt 6): Geraden („gerade.1-4711“) und Ebenen („ebene.1-4711“)
  gerade: 28,
  ebene: 29,
  // M7 Schritt 7a: Lage („lage.1-4711“)
  lage: 30,
}
