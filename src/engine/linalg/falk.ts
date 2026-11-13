// Falk-Schema als Bild zum Abspielen (M7 Schritt 8b), reine Daten. Die Oberfläche (ui/draw/FalkScheme.tsx) zeigt die
// rechte Matrix oben rechts, die linke unten links und das Produkt unten rechts. Beim Abspielen leuchten für jeden Eintrag
// aus cells nacheinander seine Zeile der linken und seine Spalte der rechten Matrix auf, die Produkte erscheinen einzeln,
// zuletzt steht der Eintrag in seinem Feld. Alle Einträge sind LaTeX, gerechnet von linalg/matrixTasks.ts.
export type FalkFigure = {
  // Name des Produkts für die Zeile darunter, z. B. „AB“ oder „A B^{\mathsf T}“
  readonly name: string
  // linke Matrix (m × n), rechte Matrix (n × p), Produkt (m × p)
  readonly left: readonly (readonly string[])[]
  readonly top: readonly (readonly string[])[]
  readonly product: readonly (readonly string[])[]
  // terms[i][j][k]: k-tes Produkt des Eintrags (i, j), z. B. „2 \cdot (-1)“
  readonly terms: readonly (readonly (readonly string[])[])[]
  // Einträge, nach denen der Schritt fragt (Zeile, Spalte ab 0), in der Reihenfolge des Abspielens. Vor der Antwort
  // leer (bei einem einzigen mit Fragezeichen), danach ausgefüllt
  readonly cells: readonly (readonly [number, number])[]
}
