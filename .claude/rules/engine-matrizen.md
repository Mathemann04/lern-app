---
paths:
  - "src/engine/linalg/matrix*"
  - "src/engine/linalg/det*"
  - "src/engine/linalg/gauss*"
  - "src/engine/linalg/cramer*"
  - "src/engine/linalg/lgsp*"
  - "src/engine/linalg/eqs*"
  - "src/engine/linalg/inv*"
  - "src/engine/linalg/paramSlider*"
  - "src/engine/linalg/falk.ts"
  - "src/engine/linalg/sarrus*"
  - "src/ui/draw/SarrusScheme.tsx"
  - "src/ui/draw/FalkScheme.tsx"
  - "src/engine/explain/matrixCards.ts"
  - "src/engine/explain/detCards.ts"
  - "src/engine/explain/gaussCards.ts"
  - "src/engine/explain/cramerCards.ts"
  - "src/engine/explain/lgspCards.ts"
  - "src/engine/explain/eqsCards.ts"
  - "src/engine/explain/invCards.ts"
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
  ausgerechnet, Sarrus der Erklärung, Bilder, freier Modus).
- Sarrus zum Abspielen (Schritt 9b): `linalg/sarrus.ts` (Typ `SarrusFigure`: Name, Einträge, Produkte `plus`/`minus` in
  der Reihenfolge von `SARRUS_PLUS`/`SARRUS_MINUS` = Diagonalen im Schema mit fünf Spalten, `values` nur ohne Parameter,
  `result`), `GuidedStep.sarrus`. Beide `sarrusStep` (`detTasks.ts`, `spatTasks.ts`, damit auch Basis) hängen es an;
  jeder Schritt mit „Sarrus“ im Titel hat eins, sonst keiner. Oberfläche `ui/draw/SarrusScheme.tsx` (wie `FalkScheme`),
  Lernkarte nur bei genau einem Schritt mit Sarrus. Tests in `linalg/sarrus.test.ts` (Diagonalen des Bildes gegen
  Laplace, Rechnung = Erklärung).
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
  angezeigte Gleichungen gegen die Tabelle, falsche Lösungen erfüllen das System nicht).
- Bilder zum Gauß-Verfahren (Schritt 10b): `linalg/gaussFigures.ts` rechnet mit Kommazahlen aus den Zeilen (n = 2:
  Geraden als Strecken der halben Länge `LINE_HALF` um einen Punkt, n = 3: Ebenenstücke `PLANE_HALF`; n = 4 oder mehr als
  drei Zeilen: kein Bild). Mitte `Ctx.center` = `sceneCenter` (Lösung mit freien Variablen 0, ohne Lösung Schwerpunkt der
  Lotfußpunkte des Ursprungs). `elimDrawing` hängt als `GuidedStep.solvedDrawing` an jedem `elimStep` (neues Feld: Bild
  erst nach der Antwort, `TaskScreen` zeigt es statt `drawing`, Schlüssel je Schritt): Zeilen in den Farben a, b, c
  (`ROW_COLORS`), umgeformte gleiten mit `DrawSegment.slideFrom` bzw. `DrawPolygon.from` um den Drehpunkt
  (`pivotOf`: Schnittpunkt bzw. Punkt der Schnittgeraden nahe der Mitte, mit Richtung), Fehler `mistake` mit
  `DrawMistake.polygons` (rechte Seite alt, nur wenn 0,3 bis 6 Einheiten entfernt). `systemDrawing` ist `resultDrawing`
  (Zeilen Phase 1 bis m, Lösung Phase m + 1, Schnitte je zweier Zeilen blass bei „keine Lösung“). Neu in `figures.ts`:
  `DrawSegment.labelAt` (Name als Anteil der Strecke, dann in der Farbe der Strecke), `DrawPolygon.label`/`labelCorner`.
  Lernkarten: `VectorCardExample.vector.picture: 'step'` zeigt statt des Ergebnisbildes das erste `solvedDrawing`
  (`CardBody.tsx`). Tests in `linalg/gaussFigures.test.ts` (jedes Teil liegt auf der Zeile seiner Farbe, alte Lage auf der
  alten Zeile, Drehpunkt auf Stufenzeile, alter und neuer Zeile; Fehler auf der Zeile mit alter rechter Seite; Lösung auf
  allen Zeilen), Browser-Test in `e2e/matrices.spec.ts`.
- Cramersche Regel (Schritt 11a): Baustein `cramer` (Code 36, Gruppe `mat-lgs`), `linalg/cramerTasks.ts`, Arten in
  `CRAMER_KINDS_BY_LEVEL` (cramerTwo, cramerThree, cramerPair, cramerParam, cramerParamThree). Matrizen als `PMat` mit
  Einträgen `Lin` (c0 + c1·a) aus `detTasks.ts` (dort exportiert: `Mat`, `Lin`, `PMat`, `lin`, `at`, `linLatex`, `linFactor`,
  `pmat`, `det`, `polyOf`, `sarrusStep`, `paramMatrix`), rechte Seite `b` ohne Parameter; Determinanten als `Quad` über
  `polyOf`. Unbekannte immer x, y, z (der freie Modus liest `x_1 = …` als erste von zwei Lösungen), Matrizen `A_x`, `A_y`,
  `A_z`. Schritte `detStep` (2 × 2 mit Formel, falsch auch `cramer-row`/`cramer-col`; 3 × 3 `sarrusStep`, Ids `det`,
  `det-x` …), `matrixStep` (Id `matrix-z`, nur 3 × 3), `quotientStep` (Id `wert-z`; mit `vector` als Schritt `loesung`, der
  gleich den Vektor nennt; mit Parameter ein Bruch in a, falsche nie gleichwertig über `fracEq` an sieben Stellen),
  `conditionStep` (`bedingung`), `targetStep` (`vorgabe`: Dk = c·D, Werte mit D = 0 fallen weg), `insertStep` (dritte
  Unbekannte durch Einsetzen, Fehler `gauss-backsub-…`). Bau: ohne Parameter rückwärts aus einer ganzen Lösung oder mit
  Brüchen aus zufälligem b; mit Parameter 2 × 2 mit Nullstellen von det A ganz und nicht 0 (`pickTarget` sucht c),
  3 × 3 aus `paramMatrix`, mit Falle (`trap`, vor den Versuchen gewählt) b aus zwei Spalten von A an einer Nullstelle
  (dort auch det A_k = 0), sonst rückwärts aus einer Lösung an einer Stelle a0 (`targetFor`). 10 Fehler `cramer-…` in
  `linalg/cramerErrorRules.ts`, zwei Karten in `explain/cramerCards.ts`. Bild beim Ergebnis ohne Parameter:
  `systemDrawing` aus `gaussFigures.ts`. Tests in `linalg/cramerTasks.test.ts` (Gegenprobe mit eigenem Gauß, mit
  Parameter alle ganzen a von −30 bis 30, jede Determinante des Rechenwegs an mehreren Stellen, keine Wörter im
  Formelsatz).
- Gleichungssysteme mit Parameter (Schritt 11b): Baustein `lgsparam` (Code 37, Gruppe `mat-lgs`), `linalg/lgspTasks.ts`, Arten
  in `LGSP_KINDS_BY_LEVEL` (lgspTwo, lgspThree, lgspDet, lgspRhs, lgspTarget, lgspFull). Einträge als `Poly` = [c0, c1, c2,
  cb] (c0 + c1·a + c2·a² + cb·b), `pMul` (null über a² oder bei a·b). Gauß mit Parameter: `makeSym` baut vorwärts (seit
  14.11.2026): zufällige Zeilen (oben links meist 2 oder 3, `PIVOTS`), a nach `placeSpec` (`last`: letzte Spalte, Zeile
  beliebig; `first`/`mid`: vorne in der untersten Zeile; `square`: a²; `upper`: a auch in der letzten Spalte einer anderen
  Zeile; `swapTop`: Zeile mit a steht oben, Schritt `tausch` mit `paramSwapStep`). Gauß zweimal mit Probe-Werten (0 und 1)
  für die Zahl t0 in der letzten Spalte und die rechte Seite v0 + v1·a (+ βb) der Zeile mit a: t0 legt einen Sonderwert
  fest, v0, v1 die Fälle. `runParam`: Spalte für Spalte ohne Tausch, Stufen feste Zahlen, `pOpFor` ganzes Vielfaches oder
  über Kreuz, `POp` = p · Zeile − q · Stufenzeile (q darf a enthalten); `pOpLabel` mit führendem Minus als „+ (a + 2)“.
  `pElimStep` (falsche Tabellen `pCands` wie `elimCands`, gleichwertig über `ptEquivalent`: Gauß in Zahlen an zwei krummen
  Stellen). Determinante zuerst (`buildDet`, Stufe 2 bis 5): `paramSystemMatrix` (2 × 2 an ein oder zwei Stellen, 3 × 3 eine
  Stelle oder `paramMatrix`), b so, dass ein Sonderwert unendlich viele hat oder keiner; `detStep` aus `cramerTasks.ts`,
  `numericStep` (Gauß in Zahlen beim Sonderwert, Fehler aus `elimCands` der letzten Umformung). Schritte `conditionStep`
  (`bedingung`), bei einem Sonderwert `singleCaseStep` (`sonderfall`: „Was gilt dort?“, Fall mit Begründung, Ergebnis
  `a = 3,\; \text{keine Lösung}`, `data.single`), bei zweien `specialStep` (`sonderfall`, Fehler aus `LGS_CASE_RULES`),
  `rankStep` (`rang`: Ränge mit Folgerung), `b-wert`, `vorgabe`, `loesung` (mit `backSolve` aus `gaussTasks.ts`, falsch auch
  der Punkt aus der gekürzten allgemeinen Formel). Aus `gaussTasks.ts` exportiert: `tabLatex`, `runGauss`, `analyze`,
  `equivalent`, `rankOf`, `opLabel`, `elimCands` (aus `elimStep` herausgelöst, gleiche Zufallsfolge), `backSolve` u. a.;
  aus `cramerTasks.ts`: `detStep`, `roots`, `solLatex`, `sortRats`. Ergebnis `a = …` (ein oder zwei Werte), `a = …,\; b =
  …`, Sonderwert mit Fall oder die Lösungsmenge `L\colon \vec x = …` (Bild `systemDrawing` beim Sonderwert). 23 Fehler
  `lgsp-…` in `linalg/lgspErrorRules.ts`, drei Karten in `explain/lgspCards.ts`. Tests in `linalg/lgspTasks.test.ts` (Fall für
  jedes ganze a von −30 bis 30 mit eigenem Rang in Kommazahlen, jede Tabelle gleichwertig zur Aufgabe an mehreren Stellen,
  Ränge gegen die Aufgabe beim Sonderwert, Anteil der Einsen und der Umformungen über Kreuz, Tausch).
- Zahlen im Gauß-Verfahren (14.11.2026): oben links `TOP_PIVOTS` (meist 2 oder 3), über Kreuz auch in Stufe 1 und 2 und bei
  den meisten Arten mit Zufall; `gaussTasks.test.ts` misst den Anteil der Einsen und der Umformungen über Kreuz.
- Einsetzen, Gleichsetzen, Addieren (Schritt 10c): Baustein `einsetzen` (Code 38, Gruppe `mat-lgs`), `linalg/eqsTasks.ts`,
  Arten in `EQS_KINDS_BY_LEVEL` (eqsSubst, eqsEqual, eqsAdd in Stufe 1 und 2; eqsMessy in 3; eqsThree, eqsRecip in 4 und 5;
  eqsParam in 5). Gleichungen als `Row` (Zahlen `a`, rechte Seite `c`), Terme `Expr`; `solveFor`, `substitute`,
  `rowsEquivalent` (falsche Gleichungen nie gleichwertig). Kern `solveTwo` (zwei Unbekannte `pair`, Verfahren, Gleichung `i`,
  Unbekannte `v`, schon aufgelöst gezeigte `solvedShown`, Vorsilbe `tag` der Ids im Teilsystem): Schritte `solveStep`
  (`aufloesen-k`), `insertStep` (`einsetzen`, zusammengefasste Gleichung; Fehler Klammer nur erstes Glied, Minus vor der
  Klammer, in dieselbe Gleichung, Zahl ohne Vorzeichenwechsel), `valueStep` (`wert-x`, nur wenn vor der Unbekannten nicht 1
  steht), `equateStep`, `factorStep` (`faktoren`, nur wenn nicht beide Faktoren ±1; `factorsFor` kleinste Faktoren, p > 0),
  `combineStep` (`wert-…`, bei $0 = D$ gleich `caseStep`), `caseStep` (`deuten`, drei Antworten), `setStep` (Lösungsmenge,
  falsche nie dieselbe Gerade), `backStep` (Ergebnis `x = …,\; y = …`, falsch auch nur eine Unbekannte). Ordnen
  (`orderStep`, `ordnen-k`) mit `moveForm`, `bracketForm`, `fractionForm` (Fehler `eqs-order-side`, `eqs-order-const`,
  `eqs-bracket-…`, `eqs-one-side`, `eqs-fraction-drop`). Stufe 2 in 45 % mit `methodStep` (`verfahren`, Fehler `eqs-method`, dessen Text das richtige Verfahren nicht nennt). Bilder:
  `turnDrawing` (`elimDrawing` aus `gaussFigures.ts`, „Zeile“ → „Gleichung“) als `solvedDrawing` nach Einsetzen,
  Gleichsetzen und Addieren, `systemDrawing` beim Ergebnis (nicht bei Nenner und Parameter). 30 Fehler `eqs-…` in
  `linalg/eqsErrorRules.ts` (`eqs-sub-sign` nur beim Abziehen, `eqs-insert-sign` beim Einsetzen in $v = \dots$), dazu
  `gauss-…` (Rüberbringen, Teilen, Lösungsmenge); fünf Karten in
  `explain/eqsCards.ts`. Tests in `linalg/eqsTasks.test.ts` (eigener Gauß mit Rang in Kommazahlen, jede Gleichung im
  Rechenweg von der Lösung erfüllt und keine falsche gleichwertig, Auflösen, Faktoren, Lösungsmenge, Parameter, Substitution,
  Werte, Fälle, Bilder, freier Modus), Browser-Test in
  `e2e/matrices.spec.ts`.
- Bilder mit Parameter (Schritt 11c): `paramSlider` in `gaussFigures.ts` (Eingabe `rowsAt(a)` mit Kommazahlen, Sonderwerte,
  gesuchte Werte `targets` mit Text, `start`, `fixed`), Stellen aus `sliderValues`, je Stelle ein Bild aus `systemParts`
  (gemeinsam mit `systemDrawing`: Mitte fest, ohne Phasen, ohne Koordinaten von S, Teile weiter als `SLIDER_FAR` weg
  bleiben weg und die Beschreibung sagt es; Zeilen 0 = c werden genannt, nicht gezeichnet), Lösung über
  `numericSolution`. `VectorDrawing.slider` (`DrawSlider`: values, frames, start, marks) und `extent` (gemeinsamer
  Ausschnitt) in `figures.ts`; `lineDir` zeigt immer nach rechts (gleiche Geraden tragen ihre Namen an verschiedenen
  Enden). Angehängt als `resultDrawing` bei allen `lgsp…` (`sliderOf`, b fest beim gefundenen Wert), `cramerParam…`
  (`paramSliderOf`) und `eqsParam`. Cramer als Flächen: `cramerArea` in `cramerTasks.ts` (2 × 2 ohne Parameter, als
  `solvedDrawing` an `wert-x` und `loesung`; Flächen mit `from`, Knopf „Strecken und Scheren“, nicht bei Wert 0 oder
  über `AREA_SPAN`). Tests in `linalg/paramSlider.test.ts` (Zeilen aus `task.data` neu eingesetzt, eigener Rang, Fall
  in der Beschreibung, Knöpfe, S mit dem gesuchten Wert; Flächen = |det A| und |det A_k|, Verhältnis = Lösung).
- Inverse Matrix (Schritt 12a): Baustein `inverse` (Code 39, Gruppe `mat-inv` „Inverse und Matrizengleichungen“),
  `linalg/invTasks.ts`, Arten in `INV_KINDS_BY_LEVEL` (invTwo, invGauss, invRules, invSystem, invParam). `inverse(A)` exakt
  (null bei det 0). Schritte: `detTwoStep` (`det2Step` aus `detTasks.ts`, bei det 0 kommt `inv-det-main` dazu, weil
  „Diagonalen vertauscht“ dann gleich ist), `inverseStep` (Id `inverse`, Formel), `singularTwoStep` (`invertierbar`).
  Gauß-Jordan: `runJordan` (nach unten mit `opFor`/`combine` aus `gaussTasks.ts`, bei 0 tauschen, dann von rechts nach
  links nach oben; `singular` = Spalte ohne Stufe), Tabellen `jordanLatex` (`c|rrr|rrr` mit Zeilennamen und Umformungen),
  Schritte `startStep` (`start`, nur bis Stufe 3), `jordanElimStep` (`unten-k`, `oben-k`; falsch: rechte Hälfte vergessen,
  Vielfaches nur beim ersten Eintrag, Vorzeichen), `jordanSwapStep` (`tausch-k`), `singularJordanStep` (`deuten`),
  `readStep` (`ablesen`: durch die Diagonale teilen). `jordanOk` begrenzt die Zahlen in allen Tabellen; nicht invertierbar
  nur mit Nullzeile ganz unten. Fall (`JordanCase`) vor den Versuchen gewählt. Regeln: `Rule` (Zahl k, Faktoren `Fac` mit
  inv/t), `invertRule`, `slipped` (order, factor, transpose, twice), Matrizen mit det ±1 aus `unimodular`; Schritte
  `regel`, `produkt` (`productStepQ` aus `matrixTasks.ts` mit Falk-Schema, Transponierte gleich eingesetzt, Fehler
  `mat-transpose-ignored`), `faktor`. Gleichungssystem: `ansatz`, bei 2 × 2 Determinante und Inverse, dann `produkt`.
  Parameter: `detStep` aus `cramerTasks.ts` bzw. `sarrusStep`, `bedingung`, dann Formel bzw. Gauß-Jordan beim Wert a0.
  Ergebnis Matrix `A^{-1} = …` bzw. `\text{nicht invertierbar}` (Auswahl `INVERTIBLE` in `CHOICE_SETS`), Vektor oder
  `X = …`. Bild `inverseDrawing` bei 2 × 2 (Parallelogramm zurück aufs Quadrat, Spalten $\vec s_1, \vec s_2$ von
  $A^{-1}$; nicht über `INV_SPAN` oder bei zu kurzen Pfeilen). 29 Fehler `inv-…` in `linalg/invErrorRules.ts`, fünf Karten
  in `explain/invCards.ts`. Tests in `linalg/invTasks.test.ts` (Gegenprobe mit eigener Inversen in Kommazahlen, jede
  Tabelle links = rechts · A, falsche nicht; Bild: A bringt die Ecken zurück aufs Quadrat), Browser-Test in
  `e2e/matrices.spec.ts`.
