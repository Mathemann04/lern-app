// Gauß-Jordan als Bild zum Abspielen (M7 Schritt 12c), reine Daten wie Falk-Schema (falk.ts) und Sarrus (sarrus.ts).
// Die Oberfläche (ui/draw/JordanScheme.tsx) zeigt die Tabelle (A | E) und geht Bild für Bild durch das Verfahren:
// Zeilen tauschen, Nullen unter der Diagonale, Nullen über der Diagonale, zuletzt jede Zeile durch ihre Zahl auf der
// Diagonale. Links entsteht so Schritt für Schritt E, rechts A⁻¹ (oder links eine Nullzeile: nicht invertierbar).
// Alle Einträge sind LaTeX, gerechnet von linalg/invTasks.ts (jordanTables).

export type JordanFrame = {
  // Zeilen der Tabelle, je 2n Einträge (links vom Strich n, rechts n) als LaTeX
  readonly rows: readonly (readonly string[])[]
  // Umformung je Zeile als LaTeX (z. B. „\text{II} - 2 \cdot \text{I}“ oder „: 3“), leer bei unveränderten Zeilen
  readonly notes: readonly string[]
  // Zeilen, die sich in diesem Bild geändert haben
  readonly changed: readonly number[]
  // Feld der Stufenzahl, mit der umgeformt wird (Zeile, Spalte ab 0)
  readonly pivot?: readonly [number, number]
  // neu erzeugte Nullen links (Zeile, Spalte ab 0)
  readonly zeros: readonly (readonly [number, number])[]
  // Namen über der linken und rechten Hälfte (nur am Anfang und am Ende, z. B. „A“ und „E“, „E“ und „A^{-1}“)
  readonly labels?: readonly [string, string]
  // was in diesem Bild geschieht (Text mit Formeln)
  readonly caption: string
}

export type JordanFigure = {
  // Name der Matrix, z. B. „A“
  readonly name: string
  readonly n: number
  // Bild 0 ist die Starttabelle (A | E), das letzte das Ergebnis
  readonly frames: readonly JordanFrame[]
  // links eine Nullzeile: nicht invertierbar
  readonly singular: boolean
}
