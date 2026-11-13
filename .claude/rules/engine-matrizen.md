---
paths:
  - "src/engine/linalg/matrix*"
  - "src/engine/linalg/det*"
  - "src/engine/linalg/gauss*"
  - "src/engine/linalg/falk.ts"
  - "src/ui/draw/FalkScheme.tsx"
  - "src/engine/explain/matrixCards.ts"
  - "src/engine/explain/detCards.ts"
  - "src/engine/explain/gaussCards.ts"
  - "e2e/matrices.spec.ts"
---

# Notizen: Matrizen und Gleichungssysteme (M7 ab Schritt 8a)

Plan: docs/PLAN-M7.md. Dieselbe Engine wie bei Vektoren (`.claude/rules/engine-vektoren.md`: `taskKit.ts`, `choiceStep`,
freier Modus `vectorFree.ts`, `buildVectorTask` wählt die Arten nach dem Baustein in der Nummer).

- Matrizen rechnen (Schritt 8a): eigene Tätigkeit `matrizen` (Farbe `rose`, Bild `matrices`, Lernkarten-Ordner `matrizen` in
  `explain/matrixCards.ts`), dieselbe Engine: Baustein `matrix` (Code 33, Gruppe `mat-rechnen`) in `MATRIX_BLOCKS`,
  `nextMatrixSeed` in `vectorEngine.ts`. `linalg/matrixTasks.ts`: Matrizen als Zeilen (`Mat<T>`), Einträge über einen
  `Ring` (Zahlen `Q` oder lineare Ausdrücke `L` = c0 + c1·a beim Parameter), `product` mit den Fehlern im Falk-Schema
  (`Falk`: noSum, plus, rowRow, colCol, entrywise), `falkFigure` (Schritt 8b, siehe unten), `retry`
  (baut neu, bis jeder Schritt drei Antworten hat), `arrange` (Angabe untereinander, wenn breiter als etwa 470 px).
  Arten in `MATRIX_KINDS_BY_LEVEL` (matBuild, matLinear, matTranspose, matProduct, matVector, matDefined,
  matTransposeProduct, matOuter, matParam, matExpression); Schritte `productFormatStep` (keiner bei n × n mal n × n),
  `entryStep`, `productStep`, `transposeStep` (quadratisch: „umgefüllt“ = „vergessen“), `combStep`. Ergebnis als Matrix
  `A = \begin{pmatrix} 1 & 2 \\ … \end{pmatrix}` (freier Modus: Teil `matrix` mit `cols`, Kästchen „Zeile 2, Spalte 1“;
  Formate wie `2 \times 3` liest `readPart` nicht als Zahl) oder Zahl. Bild `gridDrawing` bei 2 × 2: Einheitsquadrat,
  Parallelogramm mit `from` (wandert beim Abspielen), Bild des Gitters [0, 2]² gestrichelt, Spalten als Pfeile, dann
  $A\vec x$; vor dem Ergebnis nur Einheitsquadrat, $\vec e_1$, $\vec e_2$, $\vec x$. 27 Fehler `mat-…` in
  `linalg/matrixErrorRules.ts` (`vectorErrorRule` sucht auch dort, Katalog `matrizen`). Tests in
  `linalg/matrixTasks.test.ts` (eigene Matrizenrechnung mit Kommazahlen, Bild, Karten, freier Modus), Browser-Test
  `e2e/matrices.spec.ts`.
- Falk-Schema zum Abspielen (Schritt 8b): `linalg/falk.ts` (Typ `FalkFigure`: linke, rechte Matrix und Produkt als LaTeX,
  `terms[i][j][k]` wie in `falkEntry` geschrieben, `cells` = gefragte Einträge in Lesereihenfolge), `GuidedStep.falk`.
  `falkFigure` in `matrixTasks.ts` hängt es an `entryStep` (ein Feld), `productStep` (alle) und beide Schritte von
  `matOuter` (Zeile mal Spalte: ein Feld, Name ohne Index). Jeder Schritt `eintrag`/`produkt…` hat eins, sonst keiner.
  Oberfläche `ui/draw/FalkScheme.tsx` (`done` = Schritt gelöst; vorher Felder leer bzw. „?“, kein Knopf; danach
  „Abspielen“/„Alles zeigen“, Bilder per `setTimeout`, `data-falk` an den Feldern), im Lernbildschirm unter der Frage,
  auf Lernkarten das Schema des letzten Schritts mit Schema (`CardBody.tsx`). Die Erklärung verweist aufs Bild statt einer
  Tabelle. Tests in `matrixTasks.test.ts` (Gegenprobe mit Kommazahlen, Teilprodukte = Zeile mal Spalte, Felder passen zu
  `established`).
- Determinanten (Schritt 9a): Baustein `determinante` (Code 34, Gruppe `mat-det`; `det` gehört dem Umstellen) in
  `MATRIX_BLOCKS`, `linalg/detTasks.ts`, Arten in `DET_KINDS_BY_LEVEL` (detTwo, detSarrus, detTriangle, detExpand,
  detRowOps, detRules, detEliminate, detParam). Einträge als `Lin` (c0 + c1·a), Werte als `Quad` über `polyOf` (drei
  Stellen, Probe an zwei weiteren: Determinante höchstens quadratisch, Parameter an zwei Stellen in verschiedenen Zeilen
  und Spalten); `det` exakt mit Gauß. Schritte `det2Step`, `sarrusStep` (`SARRUS`: right, plus, one, swap, diag; mit
  Parameter ohne swap und ohne Vielfache), `measureStep` (Fläche `F` bzw. Volumen `V` = Betrag), `methodStep` (ab 4 × 4), `expandStep`
  (`expansion(A, line, how)`: right, ignored, shift, minor, factor; falsche nur mit anderem Wert), Unterdeterminanten
  `\begin{vmatrix}`, Namen `A_{ij}`, bei 5 × 5 `B = A_{rc}` (`embed` baut die größere Matrix um B). Entwickelt wird ab
  4 × 4 nach der Zeile oder Spalte mit echt den meisten Nullen (`uniqueBest`). Umformungen: Zeilen `\vec z_{i}`
  (`RowSpec`: Hauptzeile, Faktor k, Vielfaches nur von Zeilen ohne eigenes), Gegenprobe über die Koeffizientenmatrix C.
  Regeln: `Factor` (plain, T, inv, pow) mit `factorSlips` (je Fehler sein eigener Name); mit Parameter bietet Sarrus kein Vielfaches von p(a) an (`isMultiple`). Bilder `areaDrawing` (Einheitsquadrat wird zum Parallelogramm
  der Spalten, Orientierung in der Beschreibung) und `spatDrawing` (`bodyDrawing('spat', …)` aus `spatTasks.ts`). 37
  Fehler `det-…` in `linalg/detErrorRules.ts` (`vectorErrorRule` sucht dort, Katalog `matrizen`), sechs Karten `det-…` in
  `explain/detCards.ts` (Ordner `matrizen`). Ergebnisse `\det A = 5`, dazu `F = 5` bzw. `V = 5`, `\det(2A^{-1}) = …`,
  `a_1 = …,\; a_2 = …`. Tests in `linalg/detTasks.test.ts` (Laplace mit Kommazahlen, jede Entwicklung in den Antworten
  ausgerechnet, Sarrus der Erklärung, Bilder, freier Modus). Sarrus als Animation folgt in 9b (wie `falk.ts`).
- Gauß-Verfahren (Schritt 10a): Baustein `gauss` (Code 35, Gruppe `mat-lgs` „Gleichungssysteme“) in `MATRIX_BLOCKS`,
  `linalg/gaussTasks.ts`, Arten in `GAUSS_KINDS_BY_LEVEL` (gaussTwo, gaussThree, gaussPivot, gaussOver, gaussUnder, gaussPlane,
  gaussDecimal, gaussBig). Bau rückwärts: Stufenform `E` mit festen Stufen-Spalten (`Spec.pivots`) und Fall (`unique`,
  `none`, `inf`), dann `T = P · D · L · E` (L unten links ganzzahlig, D Faktoren je Zeile, bei `cross` auch 2 oder 3; beim
  Tausch eine Zeile ohne Anteil von Zeile I nach oben). `runGauss` rechnet wie in der Vorlesung: Spalte für Spalte, bei 0
  oben mit der ersten Zeile darunter tauschen, sonst `II − k · I` (ganzzahlig) bzw. über Kreuz `p · II − q · I`. Filter:
  Fall und Stufen wie gewollt, Tausch und Über-Kreuz genau wie in `Spec`, kein Tausch an einer Zeile 0 … 0 | c, Zahlen klein, erste Spalte voll besetzt, keine
  zwei gleichen Zeilen, Lösung ganzzahlig. `retry` hält die Art (Fall, Stufen …) für 400 Versuche fest, damit die Fälle so
  oft kommen wie geplant. Schritte: `setupStep` (Gleichungen mit Glied rechts, Zahl links, vertauschter Reihenfolge,
  Lücke), `scaleStep` (Kommazahlen mit 10, 2, 4 oder 5 wegschaffen), `swapStep`, `elimStep` (ganze Tabelle mit
  Umformungen rechts, Ids `spalte-1` …; vorher gezeigt, außer sie steht schon als Aufgabe da), `caseStep` (Id `deuten`,
  Antworten `LGS_CASES`, Fehler je wahrem und gewähltem Fall), `freeStep` (nur wenn es drei falsche gibt: Mengen, ohne die
  die übrigen Spalten nicht den vollen Rang haben), `valueStep` (die unteren höchstens zwei Stufen einzeln, ohne genug falsche Antworten rechnet sie `loesung` mit, von unten nach oben; Werte `Aff`
  linear in den Parametern, Fehler über `backSolve` mit `Slip`), `loesung` (Vektor bzw. `L\colon \vec x = … + t …`).
  Falsche Tabellen nie gleichwertig: `equivalent` vergleicht die reduzierte Stufenform, ohne Lösung nur genau dieselbe
  Tabelle. Tabellen als `\begin{array}{c|rrr|rl}` mit Kopfzeile und Zeilennamen; Kommazahlen mit `{,}` (`decLatex`).
  Ergebnis „keine Lösung“ als Auswahl (`CHOICE_SETS` in `vectorFree.ts` mit `LGS_CASE_RULES`); Lösungsmenge im freien Modus
  wie eine Gerade bzw. Ebene (jede Darstellung zählt; zwei Parameter nur im Raum). 34 Fehler `gauss-…` in
  `linalg/gaussErrorRules.ts`, vier Karten in `explain/gaussCards.ts`. Tests in `linalg/gaussTasks.test.ts` (Gegenprobe
  mit eigenem Rang in Kommazahlen, jede Tabelle des Rechenwegs gleichwertig zur Aufgabe und mit Nullen unter der Stufe,
  angezeigte Gleichungen gegen die Tabelle, falsche Lösungen erfüllen das System nicht). Bilder (Geraden und Ebenen) folgen
  in 10b.
