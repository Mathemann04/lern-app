---
paths:
  - "src/engine/linalg/**"
  - "src/ui/draw/**"
  - "src/engine/explain/vectorCards.ts"
  - "e2e/vectors.spec.ts"
---

# Notizen: Vektoren (M7) und Bilder zu Vektoren

Plan: docs/PLAN-M7.md. Tätigkeit „Vektoren“ (Id `vektoren`) im Gebiet „Vektoren und Matrizen“ (`lineare-algebra`, Farbe
`cyan`, Bild `vectors` in `AreaIcon.tsx`), Bausteine in `tasks/blocks.ts` (`VECTOR_BLOCKS`, Gruppe `vektor-grundlagen`,
`VECTOR_PLAYABLE_COMBOS`; Baustein `rechnen`, Code 21, Nummern `rechnen.2-4711`). Freier Modus seit Schritt 1b (`free: true`),
gezieltes Üben noch nicht (`focus: false`).

- `linalg/vec.ts`: Vektoren als Listen exakter Brüche (`rational.ts`), Längen als `Surd` (Zahl mal Wurzel, quadratfrei
  vereinfacht, `sqrtRat`), LaTeX: Spaltenvektoren `vecLatex`, Punkte `A(1 \mid 2)`, `coefLatex` für Faktoren vor Vektoren.
- `linalg/figures.ts`: Bilder als reine Daten (`VectorDrawing`: Ebene oder Raum, Pfeile, Punkte, Strecken, Flächen,
  Farben `a` blau, `b` orange, `r` Ergebnis violett, `c` blaugrün, `muted`, `bad`). `phase` > 0 erscheint beim
  „Abspielen“ nacheinander, `slideFrom` lässt einen Pfeil an seinen Platz gleiten. Namen sind LaTeX ohne `$`.
- `linalg/vectorTasks.ts`: Baukasten. Je Art (`VectorKind`) eine Funktion, die die ganze geführte Aufgabe baut (Schritte
  mit `choiceStep`: falsche Antworten ohne Doppelte, höchstens drei, aus `errorRules.ts`; Bilder; Ergebnis; Form;
  `answer` und `data` für die Gegenprobe in Tests). Arten je Stufe in `KINDS_BY_LEVEL`: Stufe 1 Ebene, 2 Raum, 3 zwei
  Rechnungen zusammen, 4 Parameter oder vier und fünf Dimensionen, 5 alles ineinander. Gibt eine Art in einem Schritt
  weniger als drei Antworten, zieht sie neu (Schleife). Kennzahlen der Abwechslung wie überall (100 Formen unter 200,
  keine über 3 %); die Form enthält Art, Dimension, Variante, Buchstaben und Zahl der negativen Einträge.
- `linalg/errorRules.ts`: 22 typische Fehler (`vec-…`), im Katalog `errorCatalog.ts` unter `vektoren`; Lernkarten in
  `explain/vectorCards.ts` (Ordner `vektoren`, Beispiele `{ vector: { kind, level, seed } }`, gerechnet vom Baukasten,
  in `CardBody.tsx` mit Bild und Rechenweg).
- `linalg/vectorEngine.ts`: Anschluss an `ui/courseEngines.ts` (planen, Form, neue Nummer, Beispiel).
- Oberfläche `src/ui/draw/`: `view.ts` (Ausschnitt der Ebene mit Gitter, Schritt 1, 2 oder 5; Raum mit Drehung um die
  senkrechte Achse und Kippen, Drehpunkt in der Mitte des Inhalts, Startblick `bestYaw`, damit kein Pfeil auf den
  Betrachter zeigt), `VectorFigure.tsx` (SVG, Namen als KaTeX darüber, „Abspielen“, Ziehen dreht im Raum, `compact` für
  Bild-Antworten ohne Knöpfe). Farben `--vec-*` in `index.css`, hell und dunkel. Im Lernbildschirm: `step.drawing` unter
  der Frage, `choice.drawing` als Antwort (zwei Spalten, wenn alle Antworten Bilder sind), `task.resultDrawing` beim
  Ergebnis.
- Freier Modus (Schritt 1b) `linalg/vectorFree.ts`: liest das Ergebnis der Aufgabe (`resultLatex`, `readResult`) in
  Teile (`vector` als Spalte, auch mit Faktor davor wie beim Einheitsvektor, `point`, `number`, `solutions` aus
  `t_1 = …,\; t_2 = …` oder `t_{1,2} = \pm …`; mehrere Teile mit `,\;` getrennt). Neue Arten müssen ihr Ergebnis so
  schreiben (`vectorFree.test.ts` prüft gegen `answer`). Typische Fehler: falsche Antworten des Schritts, dessen
  richtige Antwort diesen Teil liefert (auch Antworten ohne Namen, nur Wert). Prüfung je Eintrag numerisch, dann fertig?
  (`isFinishedNumber`: ganze Zahl, Kommazahl, gekürzter Bruch, k√r quadratfrei, Bruch mit höchstens einer Wurzel, nicht
  mehr kürzbar), gerundete Kommazahl als Hinweis, eine Lösung vergessen `vec-one-solution`. Urteil mit `marks` je
  Kästchen. Oberfläche: `FreeTask.entries`/`checkEntries` (`check/freeTask.ts`), Kästchen `ui/free/EntryInput.tsx`
  (je Kästchen ein `MathInput`, Namen „1. Eintrag“, „2. Koordinate“, „1. Lösung“, „Dein Ergebnis“, bei mehreren Teilen
  „… von Teil 2“; am Handy ohne Tastatur-Knopf im Kästchen, `.entry-box` in `index.css`), Tastatur `VECTOR_KEYBOARD`;
  Bild des ersten Schritts über der Eingabe, Bild zum Ergebnis in der Rückmeldung.
- Tests: `linalg/vectorTasks.test.ts` (Gegenprobe je Art mit Kommazahlen aus `data`, Antworten, Texte, Bilder, jeder
  Fehler kommt vor, Abwechslung), `linalg/vectorFree.test.ts` (freier Modus), `e2e/vectors.spec.ts`.
