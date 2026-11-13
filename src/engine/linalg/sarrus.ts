// Sarrus als Bild zum Abspielen (M7 Schritt 9b), reine Daten wie das Falk-Schema (falk.ts). Die Oberfläche
// (ui/draw/SarrusScheme.tsx) zeigt die 3 × 3-Matrix mit den ersten beiden Spalten noch einmal rechts daneben. Beim
// Abspielen leuchten zuerst die zwei abgeschriebenen Spalten auf, dann nacheinander die drei Diagonalen nach rechts unten
// (Plus) und die drei nach links unten (Minus); die Rechnung darunter wächst Produkt für Produkt, zuletzt steht der Wert
// da. Alle Einträge sind LaTeX, gerechnet von linalg/detTasks.ts bzw. linalg/spatTasks.ts.

// Diagonalen im Schema mit fünf Spalten (Zeile, Spalte ab 0): nach rechts unten ab Spalte 0, 1, 2, nach links unten ab
// Spalte 2, 3, 4. Spalte 3 und 4 sind die Spalten 0 und 1 der Matrix. Die Reihenfolge ist die der Produkte.
export const SARRUS_PLUS: readonly (readonly (readonly [number, number])[])[] = [0, 1, 2].map((c) => [0, 1, 2].map((r) => [r, c + r] as const))
export const SARRUS_MINUS: readonly (readonly (readonly [number, number])[])[] = [2, 3, 4].map((c) => [0, 1, 2].map((r) => [r, c - r] as const))

export type SarrusFigure = {
  // Name der Determinante für die Rechnung, z. B. „\det A“ oder „(\vec a \times \vec b) \cdot \vec c“
  readonly name: string
  // Einträge der 3 × 3-Matrix als LaTeX (ohne Klammern)
  readonly matrix: readonly (readonly string[])[]
  // Produkte der Diagonalen in der Reihenfolge von SARRUS_PLUS bzw. SARRUS_MINUS, z. B. „2 \cdot (-1) \cdot 3“
  readonly plus: readonly string[]
  readonly minus: readonly string[]
  // die sechs Produkte ausgerechnet (leer, wenn das nichts Neues zeigt oder ein Parameter darin steht) und das Ergebnis
  readonly values: string
  readonly result: string
}

// baut das Bild aus den Einträgen; factors sind dieselben Einträge, als Faktor geschrieben (negative in Klammern)
export function sarrusFigure(name: string, matrix: readonly (readonly string[])[], factors: readonly (readonly string[])[], values: string, result: string): SarrusFigure {
  const cell = (r: number, c: number) => factors[r][c % 3]
  const product = (d: readonly (readonly [number, number])[]) => d.map(([r, c]) => cell(r, c)).join(' \\cdot ')
  return { name, matrix, plus: SARRUS_PLUS.map(product), minus: SARRUS_MINUS.map(product), values, result }
}

// die ganze Rechnung, wie sie nach dem Abspielen dasteht
export const sarrusProducts = (f: SarrusFigure) => `${f.plus.join(' + ')} - ${f.minus.join(' - ')}`
