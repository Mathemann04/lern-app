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
`VECTOR_PLAYABLE_COMBOS`; Bausteine `rechnen`, Code 21, Nummern `rechnen.2-4711`, und seit Schritt 2a `skalar`, Code 22;
jeder Baustein allein spielbar, `buildVectorTask` wählt die Arten nach dem Baustein in der Nummer). Freier Modus seit Schritt 1b (`free: true`),
gezieltes Üben noch nicht (`focus: false`).

- `linalg/vec.ts`: Vektoren als Listen exakter Brüche (`rational.ts`), Längen als `Surd` (Zahl mal Wurzel, quadratfrei
  vereinfacht, `sqrtRat`), LaTeX: Spaltenvektoren `vecLatex`, Punkte `A(1 \mid 2)`, `coefLatex` für Faktoren vor Vektoren.
- `linalg/figures.ts`: Bilder als reine Daten (`VectorDrawing`: Ebene oder Raum, Pfeile, Punkte, Strecken, Flächen,
  Winkel `angles` (Bogen, bei 90° Quadrat; `anglePath` rechnet die Punkte, Radius wählt `VectorFigure` in Pixeln),
  Farben `a` blau, `b` orange, `r` Ergebnis violett, `c` blaugrün, `muted`, `bad`). `phase` > 0 erscheint beim
  „Abspielen“ nacheinander, `slideFrom` lässt einen Pfeil an seinen Platz gleiten. Namen sind LaTeX ohne `$`.
- `linalg/taskKit.ts`: gemeinsame Teile beider Baukästen (Typen `VectorKind`, `VectorTask`, `Built`, Karten `CARD`,
  `choiceStep`, Zufallszahlen, Buchstaben, `pythagorean`, `connectStep`, Bilder-Hilfen).
- `linalg/dotTasks.ts` (Schritt 2a): Baustein „Skalarprodukt und Winkel“, Arten in `DOT_KINDS_BY_LEVEL` (dot, classify,
  perp, angle, triangleAngle, lengthAngle, classifyParam, rightParam). Besondere Winkel aus `anglePairs` (alle Paare
  kleiner ganzzahliger Vektoren mit cos² = 1/4, 1/2, 3/4, einmal gerechnet; Ebene nur 45° und 135°), sonst
  $\cos\varphi$ exakt (`cosSurd`, Wurzel im Zähler) und spitz oder stumpf. Ergebnisse: Winkel `\varphi = 60^\circ`,
  Art `\text{spitz}` (`ANGLE_TYPES`), Ungleichung `t > \frac{3}{2}`. Bei „spitz, recht oder stumpf“ kein Bild vor dem
  Ergebnis (es verriete die Antwort). Tests in `dotTasks.test.ts`.
- `linalg/vectorTasks.ts`: Baukasten. Je Art (`VectorKind`) eine Funktion, die die ganze geführte Aufgabe baut (Schritte
  mit `choiceStep`: falsche Antworten ohne Doppelte, höchstens drei, aus `errorRules.ts`; Bilder; Ergebnis; Form;
  `answer` und `data` für die Gegenprobe in Tests). Arten je Stufe in `KINDS_BY_LEVEL`: Stufe 1 Ebene, 2 Raum, 3 zwei
  Rechnungen zusammen, 4 Parameter oder vier und fünf Dimensionen, 5 alles ineinander. Gibt eine Art in einem Schritt
  weniger als drei Antworten, zieht sie neu (Schleife). Kennzahlen der Abwechslung wie überall (100 Formen unter 200,
  keine über 3 %); die Form enthält Art, Dimension, Variante, Buchstaben und Zahl der negativen Einträge.
- `linalg/errorRules.ts`: 40 typische Fehler (22 aus Schritt 1, 18 zum Skalarprodukt) (`vec-…`), im Katalog `errorCatalog.ts` unter `vektoren`; Lernkarten in
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
  Teile (`vector` als Spalte, auch mit Faktor davor wie beim Einheitsvektor, `point`, `number` (mit `^\circ` am Ende:
  `suffix`, Kästchen mit Gradzeichen dahinter), `solutions` aus `t_1 = …,\; t_2 = …` oder `t_{1,2} = \pm …`, seit 2a
  `choice` aus `\text{spitz}` (Wert = Nummer der Antwort, Knöpfe zum Antippen, Fehler aus `choiceWrongs`) und
  `inequality` aus `t > …` (Werte ±1 und Grenze, Knöpfe „<“ und „>“ als Eintrag 0, dann ein Kästchen); mehrere Teile
  mit `,\;` getrennt). Neue Arten müssen ihr Ergebnis so
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
