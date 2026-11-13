---
paths:
  - "src/engine/linalg/**"
  - "src/ui/draw/**"
  - "src/engine/explain/vectorCards.ts"
  - "e2e/vectors.spec.ts"
  - "src/engine/explain/lineCards.ts"
  - "e2e/lines.spec.ts"
  - "src/engine/explain/matrixCards.ts"
  - "e2e/matrices.spec.ts"
---

# Notizen: Vektoren (M7) und Bilder zu Vektoren

Plan: docs/PLAN-M7.md. Tätigkeit „Vektoren“ (Id `vektoren`) im Gebiet „Vektoren und Matrizen“ (`lineare-algebra`, Farbe
`cyan`, Bild `vectors` in `AreaIcon.tsx`), Bausteine in `tasks/blocks.ts` (`VECTOR_BLOCKS`, Gruppe `vektor-grundlagen`,
`VECTOR_PLAYABLE_COMBOS`; Bausteine `rechnen`, Code 21, Nummern `rechnen.2-4711`, seit Schritt 2a `skalar`, Code 22, seit
Schritt 3a `projektion`, Code 23, seit Schritt 3b `kraefte`, Code 24, seit Schritt 4a `kreuz`, Code 25, seit Schritt 4b `spat`, Code 26, seit Schritt 5 `basis`, Code 27;
jeder Baustein allein spielbar, `buildVectorTask` wählt die Arten nach dem Baustein in der Nummer). Freier Modus seit Schritt 1b (`free: true`),
gezieltes Üben noch nicht (`focus: false`).

- `linalg/vec.ts`: Vektoren als Listen exakter Brüche (`rational.ts`), Längen als `Surd` (Zahl mal Wurzel, quadratfrei
  vereinfacht, `sqrtRat`), LaTeX: Spaltenvektoren `vecLatex`, Punkte `A(1 \mid 2)`, `coefLatex` für Faktoren vor Vektoren.
- `linalg/figures.ts`: Bilder als reine Daten (`VectorDrawing`: Ebene oder Raum, Pfeile, Punkte, Strecken, Flächen (mit
  `from` wandern die Ecken beim Abspielen an ihren Platz, Schritt 4b),
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
- Pfeil ziehen (Schritt 2b): `linalg/drag.ts` (reine Daten `DragStep` am Schritt, `GuidedStep.drag`: Pfeil von `from`
  oder Punkt mit Strecken zu `links`, Rahmen `frame`, wahlweise Gerade `line` mit Parameter; Bedingungen `quadratic`
  (lin · p + quad · |p|² + c0 rel target, Rückmeldung mit Rechnung über `dotWith` bzw. `lengthOf`) und `angle`;
  `forbidden` (Nullvektor, Start: „Zieh zuerst …“, zählt nicht), `traps` = typische Fehler, `judgeDrag`, `snapDrag`,
  `dragPositions`). `linalg/dragTasks.ts`: 13 Arten in `DRAG_VARIANTS` je Stufe, Art `drag` mit Anteil `DRAG_SHARE`
  (eigener Zufall in `buildVectorTask`), Form `drag|<Art>|…`; Stufe 4 baut auf `buildPerp(rng, 1)` und
  `buildClassifyParam(rng, 2)` aus `dotTasks.ts` und hängt deren Schritte an. `dragOnly`: kein eindeutiges Ergebnis,
  im freien Modus `FreeTask.drag`/`checkDrag` (`checkVectorDrag`); sonst Kästchen und Bild zum Ausprobieren.
  Oberfläche: `ui/draw/DragPad.tsx` (Bild plus „−“/„+“ je Eintrag, beim Pfeil als Spalte, beim Punkt $x_C$, $y_C$, bei
  der Geraden nur der Parameter), `VectorFigure` mit `drag` (mitlaufender Pfeil, Strecken, Winkelbogen, Summe und
  Differenz; Fläche `data-testid="drag-surface"`), `view.ts` mit `frame` (fester Ausschnitt) und `unproject`. Tests in
  `dragTasks.test.ts`: an jeder Stelle urteilt die Engine wie eine unabhängige Gegenprobe.
- Projektion und Zerlegung (Schritt 3a): `linalg/projTasks.ts`, Arten in `PROJ_KINDS_BY_LEVEL` (projection, decompose,
  shadowLength, foot, projParam, spanProjection). `pickSplit` zieht a und b mit kleinen Brüchen im Schatten und
  cos² zwischen 1/16 und 15/16 (Schatten und Rest gut sichtbar). Schritte `factorStep` (k = a·b/|b|², Rechnung in der
  Erklärung), `parStep`, `perpStep` (mit Probe), `lengthStep`, `distanceStep`; Namen `\vec a_{\parallel}`,
  `\vec a_{\perp}`, `\vec a_E`, Lotfußpunkt `F`. Bilder: `projDrawing` (Gerade durch b gestrichelt, mit Ergebnis Lot
  Phase 1, Schatten Phase 2, Rest und rechter Winkel Phase 3, `playLabel: 'Licht an'`) und `mistake` (rot der Schatten
  mit |b| statt |b|², `shadowMistake`, nur bis 1,7-mal so lang wie der längste Pfeil). Vor dem Ergebnis kein Schatten
  im Bild. In `figures.ts`: `playLabel`, `mistake` (`DrawMistake`), `withMistake` (rote Pfeile unter den richtigen),
  `drawingCoordinates` nimmt den Fehler mit (Ausschnitt springt nicht); `VectorFigure` mit Knopf „Typischen Fehler
  zeigen“/„Fehler ausblenden“ (`aria-pressed`). Stufe 5 mit Betrag: Skalarprodukt nie ohne Zahl (sonst wäre
  „Vorzeichen falsch“ gleichwertig). Tests in `projTasks.test.ts` (Gleichungen mit Betrag an vielen Stellen verglichen).
- Kräfte (Schritt 3b): `linalg/forceTasks.ts`, Arten in `FORCE_KINDS_BY_LEVEL` (forceComponents, forcePolar, resultant,
  incline, work, torque, knot). Zahlen als `Surd` (k·√r) mit `sMul`, `sAdd` (nur gleiche Wurzel, sonst null), Vektoren
  der Ebene `SV`; besondere Winkel aus `TRIG` (30°, 45°, 60°) mit Quadrant (`trigOf`, `fullAngle`, `direction` erkennt
  Hilfswinkel und Quadrant). Schritte `componentStep`, `magnitudeStep`, `refAngleStep` (tan α′), `quadrantStep`,
  `polarVectorStep`, `sumStep`, `momentStep` (M = r_x F_y − r_y F_x), `senseStep`, `workStep`, `unitStep`. Ergebnisse
  mit Einheit (`\,\text{N}`, `Nm`, `J`, `m`; der freie Modus zeigt sie als `suffix` hinter dem Kästchen, `readEntry`
  streicht getippte Einheiten), Namen nie mit Index 1 oder 2 (sonst „zwei Lösungen“). Bilder: `angleFromX` mit `ccw`
  (Bogen gegen den Uhrzeigersinn auch über 180°, `anglePath`; Schenkel `u` so lang wie der Pfeil, sonst wird der Bogen
  winzig), `forcesDrawing` (Krafteck, Gegenkraft am Punkt), `inclineDrawing` und Arbeit mit Winkel als `scene` (ohne
  Gitter, `planeView` ohne Ursprung), `knotDrawing` (Kräfte verkleinert), `torqueDrawing`. `planeView` lässt bei großen
  Zahlen 8 % Rand. Tests in `forceTasks.test.ts` (Gegenprobe mit Math.cos/sin, Gleichungen an vielen Stellen).
- Kreuzprodukt und Fläche (Schritt 4a): `linalg/crossTasks.ts`, Arten in `CROSS_KINDS_BY_LEVEL` (cross, crossArea,
  crossNormal, crossDistance, crossParallel, crossAreaParam). `cross` und die typischen Fehler als bilineare Funktionen
  (`CrossFn`: middleSign, orderSwap, plusCross, rowsCross, entrywise), mit Parameter über `paramCross` (Vektor
  `PVec` = base + t·slope, Quadrat der Länge `normQuad`). `crossStep` (ein Schritt, Schema mit Hilfszeilen
  `schemaLatex` in der Erklärung; mit Parameter ohne „Reihenfolge vertauscht“, weil −(a×b) dort gleich viel wert ist),
  `swapStep` (b × a), `normStep`, `areaStep` (Parallelogramm `par` oder Dreieck `tri`). Normale gegebener Länge ohne
  Wurzel: `pickNormalPair` (a, b senkrecht auf einer Richtung ganzzahliger Länge aus `LENGTH_POOLS`). Ergebnis zweier
  Vektoren `\vec n_1 = …,\; \vec n_2 = …`: im freien Modus in beliebiger Reihenfolge (`vectorPair` in `vectorFree.ts`),
  einer leer und der andere richtig: `vec-one-solution`. Flächen heißen `A`, Punkte deshalb `PT_LETTERS` (P Q R S, K L M
  N, U V W X). Bilder: `spanDrawing` (Pfeile vom selben Fuß, Fläche Phase 1, Normale Phase 2 so lang wie die Fläche,
  höchstens 1,6-mal der längere Pfeil, sonst verkürzt mit Hinweis `shortNote`, rechter Winkel Phase 3; Stufe 1 der
  Fläche in der Ebene `flat`), `distDrawing` (Gerade gestrichelt, Parallelogramm, Lot mit Lotfußpunkt `F`). Vor dem
  Ergebnis keine Normale und kein Lot im Bild. Tests in `crossTasks.test.ts` (Gegenprobe mit |a| |b| sin φ).
  `crossTasks.ts` gibt seine Helfer an Schritt 4b weiter (`crossStep`, `normStep`, `areaStep`, `termsLatex`, `quadLatex`,
  `linLatex`, `PVec`, `pAt`, `Quad`, `chain`).
- Spatprodukt und Volumen (Schritt 4b): `linalg/spatTasks.ts`, Arten in `SPAT_KINDS_BY_LEVEL` (spat, spatVolume,
  spatCoplanar, spatHeight, spatCoplanarParam, spatVolumeParam). Spatprodukt und Sarrus-Fehler als in jedem Vektor
  lineare Funktionen (`Triple`: spatProduct, sarrusPlus, sarrusOne, sarrusSwap, middleSpat); mit Parameter (Vektoren als
  `PVec`, Parameter in höchstens zwei Vektoren) über `quadOf` (Polynom aus den Werten bei 0, 1, −1). Schritte
  `sarrusStep` (Schema in der Erklärung), `dotSpatStep` ((a × b) · c, c auch mit Parameter), `orientStep`
  (`ORIENTATIONS`: Rechtssystem, Linkssystem, komplanar), `volumeStep` (Körper `Body` mit Faktor 1, 1/2, 1/3, 1/6),
  `heightStep`, `paramConnectStep`. Ergebnis `\text{Rechtssystem}`: im freien Modus eine zweite Auswahl
  (`CHOICE_SETS` in `vectorFree.ts`, Text vor den Knöpfen im `label` des Teils). Punkte `P Q R S`, `K L M N`, `E F G H`
  (nicht U V W X, weil das Volumen V heißt). Bilder: `bodyDrawing` (Grundfläche Phase 1, Seitenflächen und Deckel
  Phase 2 mit `from` = Lage in der Grundfläche, Knopf „Aufziehen“; Höhe Phase 3 mit rechtem Winkel; komplanar nur die
  Grundfläche). Vor dem Ergebnis nur die Grundfläche. Tests in `spatTasks.test.ts` (Gegenprobe mit der Determinante nach
  der ersten Zeile entwickelt, Höhe über Gram-Schmidt).
- Linearkombination und Basis (Schritt 5): `linalg/basisTasks.ts`, Arten in `BASIS_KINDS_BY_LEVEL` (basisComb,
  basisSpan, basisIndep, basisDim, basisCoords, basisSpanParam, basisParam). Gleichungen als `Row` (Faktoren `c`, rechts
  `r` + `rt`·Parameter), `rowsOf` aus der Vektorgleichung, `systemLatex` als `array` mit (I), (II), …. Schritte
  `systemStep` (falsch: Einträge eines Vektors in eine Gleichung, Faktoren vertauscht, Vorzeichen rechts, rechts 0),
  `elimValueStep` (f1·R1 − f2·R2 über `eliminators`, liefert den Wert mit vergessener rechter Seite als Folgefehler),
  `backsubStep` (einsetzen), `probeStep` (übrige Gleichungen; Antworten sind Text, `productsLatex(…, true)` mit
  „1 \cdot“), `det2Step`, `indepStep` (Antwort mit Begründung), bei drei Unbekannten Schritt „eliminieren“ mit
  (II'), (III'). Sarrus aus `spatTasks.ts` (`sarrusStep` mit `name`, `title`, `card`; `tripleQuad`, `sarrusPlus`,
  `sarrusOne` exportiert). Koeffizienten $\lambda, \mu, \nu$ oder $\alpha, \beta, \gamma$, alle verschieden und nicht 0
  (sonst fällt ein Fehler in der Probe nicht auf, und der freie Modus nähme die Fehler des falschen Schritts). Ergebnis
  `\text{linear unabhängig}` bzw. `\text{im Spann}`: Auswahlen `INDEPENDENCE`, `SPAN_ANSWERS` in `CHOICE_SETS`
  (`vectorFree.ts`). Bild `spanFigure`: gegebene Pfeile (mit Kette blass), Ebene durch den Ursprung (`plane`, Ecken aus
  den Koordinaten aller Punkte in der Ebene), Kette der Vielfachen (Phase 1, 2, 3, ab dem zweiten gleitend), Ziel
  violett, verfehlt: rote Strecke; Gerade `line`, Parallelogramm. In vier Dimensionen kein Bild, bei „linear unabhängig“ in der Ebene keins vor dem Ergebnis. Bei der Probe
  „Faktoren vertauscht“ nur, wenn sich dadurch ein Wert ändert. Tests in
  `basisTasks.test.ts` (Rang mit Gauß, Abstand zum Spann, falsche Gleichungssysteme werden von der Lösung nicht erfüllt).
- Geraden und Ebenen (Schritt 6): eigene Tätigkeit `geraden` (Farbe `emerald`, Bild `lines`, Lernkarten-Ordner
  `geraden` in `explain/lineCards.ts`), aber dieselbe Engine: Bausteine `gerade` (Code 28) und `ebene` (Code 29) in
  `LINE_BLOCKS` (Gruppe `geo-formen`; seit 7a dazu `lage`), `buildVectorTask` wählt nach dem Baustein, `nextLineSeed` in `vectorEngine.ts`.
  `linalg/lineKit.ts`: Schreibweisen (`paramFormLatex` „g\colon \vec x = … + t …“, `coordLatex` „E\colon 2x - y + 3z =
  6“, `normalFormLatex`, `insertLatex`), `primitive` (gekürzt), `isParallel`, `sameLine`, `samePlane`, `sameCoord` (falsche
  Formen, die dieselbe Gerade oder Ebene beschreiben, fallen weg), Bilder `lineFigure` (Stützvektor blass, Richtung,
  Gerade gestrichelt als Strecke, Phasen 1 bis 3), `planeFigure` (Parallelogramm um den Stützpunkt, Richtungen, Normale),
  `traceFigure` (Spurdreieck, Achsen bis zu den Spurpunkten gestrichelt; `bestYaw` in `ui/draw/view.ts` richtet auch
  Bilder ohne Pfeile nach der Fläche aus). `linalg/lineTasks.ts`: `LINE_KINDS_BY_LEVEL` (lineThrough, linePoint,
  lineContains, lineTrace, lineDistance), Schritte `formStep`, `solveStep` (Zeile nach dem Parameter auflösen, liefert die
  Fehl-Werte als `Slip` für Folgefehler), `pointStep`, `decideStep` (Punktprobe mit Begründung), Karten `GL_CARD`, Auswahlen
  `ON_LINE`, `COLLINEAR`. `linalg/planeTasks.ts`: `PLANE_KINDS_BY_LEVEL` (planeContains, planeCoord, planeParam,
  planeHesse, planeTraces), Schritte `coordStep` (d = n · p; ohne Punktnamen „den Stützpunkt“), `probeStep` (Einsetzen und
  Schluss in einem Schritt, falsche Antworten aus Rechenfehlern), `hesseStep`, `traceSteps`, `paramStep`; Normale aus
  `crossStep` (crossTasks.ts), gekürzt mit `primitive`; Hesse nur mit ganzzahliger Länge (`HESSE_POOL`), Ergebnis als
  Koordinatenform mit Brüchen und $d \ge 0$; Auswahl `IN_PLANE`. Fehler mit Vorsilbe `gl-` in `linalg/lineErrorRules.ts`
  (33; `vectorErrorRule` sucht in beiden Listen, Katalog `geraden` in `errorCatalog.ts` mit beiden). Freier Modus
  (`vectorFree.ts`): Teile `param` (Spalten, `params`; gleich, wenn Stützpunkt auf der Geraden bzw. in der Ebene und die
  Richtungen passen, `formFaults` markiert die falsche Spalte) und `equation` (Werte a, b, c, d aus der Gleichung durch
  Einsetzen von x, y, z; jedes Vielfache gilt, mit `exact` nur genau diese: Hesse, dann „Nicht normiert“ bzw. bei Faktor −1
  „Rechte Seite negativ gelassen“); Punkte auch `S_x`, `S_{xy}`, zwei Punkte `Q_1`, `Q_2` in beliebiger Reihenfolge.
  Tests in `linalg/lineTasks.test.ts` (Gegenprobe mit Kommazahlen, keine falsche Form gleichwertig, gleichwertige Formen
  im freien Modus richtig), Browser-Test `e2e/lines.spec.ts`.
- Lage (Schritt 7a): Baustein `lage` (Code 30, Gruppe `geo-lage` „Lage, Abstände, Winkel“), `linalg/posTasks.ts`, Arten in
  `LAGE_KINDS_BY_LEVEL` (posLines, meetLines, posLinePlane, meetLinePlane, posPlanes, meetPlanes). Nutzt Schritte anderer
  Bausteine (exportiert): `systemLatex`, `solveTwo`, `probeStep` (mode `check`), `Row`, `ROMAN` aus `basisTasks.ts` (Karten
  und Tipp beim Einbau überschrieben), `formStep`, `solveStep`, `pointStep`, `decideStep`, `rowTs` aus `lineTasks.ts`,
  `coordStep`, `probeStep`, `directionsFor`, `threePoints` aus `planeTasks.ts`, `crossStep`. Eigene Schritte:
  `parallelStep` (Faktor je Zeile; Namen der Geraden nie `k`, weil der Faktor so heißt), `lineSystemStep` (gleichsetzen,
  Parameter `a` rechts über `Row.rt`), `aFromRowStep`, `meetStep`, `insertStep` (Gerade oder Ebene in Parameterform in
  eine Koordinatenform, `insertedLatex` mit „0 \cdot t + 3“, wenn der Parameter wegfällt), die Entscheidungen
  `linePosStep`, `linePlanePosStep` (nach dem Einsetzen oder nach Parameter und Punktprobe), `planePosStep`. Antworten
  `LINE_PAIR`, `LINE_PLANE`, `PLANE_PAIR` mit Fehlertabellen `…_RULES` (wahr × gewählt), im freien Modus über `matrix` in
  `CHOICE_SETS` (`vectorFree.ts`); alle Wörter verschieden. Lage-Aufgaben: Ergebnis nur die Auswahl, kein Bild vor dem
  Ergebnis. Bilder `sceneFigure` (Ebenenstücke `patch`, Geraden mit Richtungspfeil, Punkte zuletzt), Schnittgerade als
  Strecke. Schnittgerade aus zwei Koordinatenformen: Konstruktion rückwärts (Richtung mit 1 an der frei gewählten Stelle,
  Normalen senkrecht darauf), aus der Parameterform: `m · w` = ±1 oder ±2 und teilt `m · u`. Fehler `gl-…` am Ende von
  `lineErrorRules.ts` (17, ab Nummer 34), Karten `gl-lage-geraden`, `gl-lage-gerade-ebene`, `gl-lage-ebenen`. Tests in
  `linalg/posTasks.test.ts` (Gegenprobe mit Kreuz- und Spatprodukt, jede Lage kommt vor, Fehlertabelle im freien Modus).
- Abstände und Schnittwinkel (Schritt 7b): Bausteine `abstand` (Code 31) und `schnittwinkel` (Code 32), Gruppe `geo-lage`.
  `linalg/distTasks.ts`, Arten in `ABSTAND_KINDS_BY_LEVEL` (distPointPlane, distPointLine, distLines, distParallel):
  Schritte `insertValueStep` (n · P − d), `distStep` (|s| / |n| als `Surd`, Fehler Betrag, nicht geteilt, Quadrat, dazu
  `extra`), `hesseDistStep`, `genVecStep` (Id `lotvektor`, Spalten mit t), `footCondStep`, `footSteps` (Lotfußpunkt mit
  `solveStep`, `pointStep`, Länge), `mirrorStep` (Punkt `P'`; der freie Modus liest Punktnamen mit Strich). Nutzt aus
  `posTasks.ts` (exportiert): `parallelStep`, `insertStep`, `patch`, `footN`, `stack`, `PATCH`; aus `planeTasks.ts`:
  `hesseStep`, `hesseNormal`. Bilder `pointPlaneFigure`, `pointLineFigure` (Lot Phase 1, rechter Winkel Phase 2,
  Spiegelpunkt Phase 3, Knopf „Lot fällen“), windschief kürzeste Verbindung über `closest`. `linalg/cutAngleTasks.ts`:
  `WINKEL_KINDS_BY_LEVEL` (angleLines, angleLinePlane, anglePlanes), Schritte `formulaStep` (Id `formel`, immer zuerst),
  `dotStep`, `lengthsStep` und `anglePairs` aus `dotTasks.ts`, `valueStep` (cos bzw. sin mit Betrag), `degreeStep`,
  `perpCondStep` (Stufe 4). Allgemein nur mit |a|²|b|² ≤ 180 (sonst krumme Wurzeln). Bilder `linesFigure`,
  `linePlaneFigure` (Winkel zum Schatten der Geraden; senkrecht: rechter Winkel zu einer Richtung der Ebene),
  `planesFigure` (Winkel senkrecht zur Schnittgeraden). Jede Aufgabe hat im ersten Schritt ein Bild ohne Lösung. 14 Fehler
  `gl-…` ab Nummer 51 in `lineErrorRules.ts`, Karten `gl-abstand-ebene`, `gl-abstand-gerade`, `gl-abstand-windschief`,
  `gl-schnittwinkel`. Tests in `linalg/distTasks.test.ts` (Abstand über Fläche und Kreuzprodukt, Winkel mit acos/asin,
  Schritt-Ids eindeutig, freier Modus mit Wurzeln und typischen Fehlern).
- Matrizen rechnen (Schritt 8a): eigene Tätigkeit `matrizen` (Farbe `rose`, Bild `matrices`, Lernkarten-Ordner `matrizen` in
  `explain/matrixCards.ts`), dieselbe Engine: Baustein `matrix` (Code 33, Gruppe `mat-rechnen`) in `MATRIX_BLOCKS`,
  `nextMatrixSeed` in `vectorEngine.ts`. `linalg/matrixTasks.ts`: Matrizen als Zeilen (`Mat<T>`), Einträge über einen
  `Ring` (Zahlen `Q` oder lineare Ausdrücke `L` = c0 + c1·a beim Parameter), `product` mit den Fehlern im Falk-Schema
  (`Falk`: noSum, plus, rowRow, colCol, entrywise), `falkLatex` (Tabelle, Zeile und Spalte fett, Eintrag umrahmt), `retry`
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
  `e2e/matrices.spec.ts`. Falk-Schema als Animation folgt in Schritt 8b.
- `linalg/vectorTasks.ts`: Baukasten. Je Art (`VectorKind`) eine Funktion, die die ganze geführte Aufgabe baut (Schritte
  mit `choiceStep`: falsche Antworten ohne Doppelte, höchstens drei, aus `errorRules.ts`; Bilder; Ergebnis; Form;
  `answer` und `data` für die Gegenprobe in Tests). Arten je Stufe in `KINDS_BY_LEVEL`: Stufe 1 Ebene, 2 Raum, 3 zwei
  Rechnungen zusammen, 4 Parameter oder vier und fünf Dimensionen, 5 alles ineinander. Gibt eine Art in einem Schritt
  weniger als drei Antworten, zieht sie neu (Schleife). Kennzahlen der Abwechslung wie überall (100 Formen unter 200,
  keine über 3 %); die Form enthält Art, Dimension, Variante, Buchstaben und Zahl der negativen Einträge.
- `linalg/errorRules.ts`: 133 typische Fehler (22 aus Schritt 1, 18 zum Skalarprodukt, 4 beim Ziehen, 15 zur Projektion, 26 zu Kräften, 14 zum Kreuzprodukt, 14 zum Spatprodukt, 20 zu Linearkombination und Basis) (`vec-…`), im Katalog `errorCatalog.ts` unter `vektoren`; Lernkarten in
  `explain/vectorCards.ts` (Ordner `vektoren`, Beispiele `{ vector: { kind, level, seed } }`, gerechnet vom Baukasten,
  in `CardBody.tsx` mit Bild und Rechenweg).
- `linalg/vectorEngine.ts`: Anschluss an `ui/courseEngines.ts` (planen, Form, neue Nummer, Beispiel).
- Oberfläche `src/ui/draw/`: `view.ts` (Ausschnitt der Ebene mit Gitter, Schritt 1, 2 oder 5; Raum mit Drehung um die
  senkrechte Achse und Kippen, Drehpunkt in der Mitte des Inhalts, Startblick `bestYaw`, damit kein Pfeil auf den
  Betrachter zeigt und die erste Fläche ohne `from` nicht von der Kante zu sehen ist, `faceFidelity`), `VectorFigure.tsx` (SVG, Namen als KaTeX darüber, „Abspielen“, Ziehen dreht im Raum, `compact` für
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
