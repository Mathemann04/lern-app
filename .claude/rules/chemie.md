---
paths:
  - "src/engine/chem/**"
  - "src/engine/quiz/**"
  - "src/engine/explain/chem/**"
  - "src/ui/chem/**"
  - "src/state/reports.ts"
  - "src/ui/ErrorShape.tsx"
  - "docs/CHEMIE.md"
  - "docs/PLAN-M4.md"
---

# Notizen: Chemie (Oberfläche und Engine)

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

- Chemie (M4, Plan docs/PLAN-M4.md, Regeln docs/CHEMIE.md): Fach „Chemie 1"
  mit eigenen Stufennamen (`levelNames` am Fach, `levelName()` in
  `catalog.ts` überall statt „Stufe n": Grundlagen, Vertiefung,
  Klausurniveau, Stufen 1 bis 3), Themen-Ids `chem-…` (Säure-Base und Redox
  als „kommt bald"). Wissensfragen im geführten Bildschirm ohne Term
  (`GuidedTaskBase` in `guided/types.ts`: Aufgabe als Text, Ergebnis
  `resultText` mit der Frage `resultQuestion`), Knopf „Frage melden"
  (`src/state/reports.ts`, Schlüssel `rechenweg-meldungen`, Liste zum
  Kopieren in den Einstellungen, „Fortschritt löschen" lässt sie stehen),
  Galerie „Fragen durchsehen" `#/galerie/chem-atombau`
  (`src/ui/chem/QuestionGallery.tsx`, mit Unterthema je Frage und Zählung je
  Unterthema und Stufe), Lernkarten mit Text-Beispielen
  (`ChemCardExample`, `formulas` darf leer sein), Denkfehler als Aussage
  statt Formel (`wrongText`, `src/ui/ErrorShape.tsx`). Engine:
  `src/engine/quiz/` (allgemein, auch für Werkstoffkunde: `types.ts` Format
  der Fragen und Denkfehler `chem-mis-…`, `plan.ts` Frage → geführte Aufgabe
  mit vier Antworten aus dem Vorrat, `numbers.ts` Aufgabennummern: 1 bis 9999
  Frage in Grundform, 10000 bis 499999 erzeugte Rechnungen, 500000 + 50 ·
  Nummer + Fassung) und `src/engine/chem/` (`engine.ts` für alle
  `chem-…`-Themen mit `nextSeed`, `questionNos` und `resolve` in `CourseEngine`, `banks.ts`,
  `bank/<thema>.ts` mit Nummern Stufe · 100 + n, `misconceptions/<thema>.ts`
  nur Name und falsche Aussage für die Fehlerstatistik, `<thema>Why.ts` die
  Erklärungen, `misconceptions/index.ts`); Lernkarten in
  `explain/chem/<thema>Cards.ts`. Die Inhaltsdateien entstehen aus geprüften
  Inhalten (in eigenen Worten, Wortvergleich mit den Skripten außerhalb des
  Repos). mhchem (`\ce`, `\pu`) fest in `renderFormula.ts` und
  `expr/latexChecks.ts`.
- Rechnungen (ab S2, Plan M4 Teil B „Chemie-Engine"): `src/engine/chem/elements.ts`
  (Tabelle Z 1 bis 56 sowie Pt, Au, Hg, Pb, Bi: Symbol, Name, Molmasse als Text
  mit einer Nachkommastelle, Isotope für Aufgaben, typische Ionenladungen;
  weitere Spalten kommen mit S5/S6, Gegenprobe in `elements.test.ts`),
  `errorRules.ts` (Rechenfehler `chem-…` mit Name, Katalogformel und „Warum ist
  das falsch?", in `errorCatalog.ts` beim Thema), `generators/` (`shared.ts`
  Grundform `ChemGenerator` mit Unterthema `part`, Anteil je Stufe `weights`,
  möglichen Fehlern `errors`; `stepChoices`: richtige und bis zu drei falsche
  Antworten, gleiche Werte einmal, `focus` sicher dabei; `index.ts` Nummer →
  Rechenart nach Anteil und Aufgabe, `calcForm` mit „@Stoff": `pickFresh` in
  `tasks/variety.ts` nimmt denselben Stoff nicht zweimal hintereinander;
  `particles.ts` Protonen, Neutronen, Elektronen aus Kernsymbol oder Tabelle
  mit Lücken, Klausurniveau zwei Teilchen; `light.ts` Energie, Frequenz,
  Wellenlänge mit 13 Lichtquellen, `lightValues` exakt), `focus.ts`
  (gezieltes Üben: Frage mit dem Denkfehler oder Rechnung mit dem Rechenfehler,
  über `practice.ts`). `engine.ts`: `nextSeed` zieht mit Anteil `CALC_SHARE`
  (35 %) eine Rechnung, wo Fragen und Rechnungen der Auswahl da sind; Runden
  zählen nur Fragen. Zahlen: `src/engine/quantity/numberDe.ts` (exakt gerundet
  auf gültige Ziffern, ohne Nullen am Ende, Dezimalkomma, „· 10ⁿ"). Galerie:
  `src/ui/chem/CalcGallery.tsx` (Beispiele je Stufe, Abwechslung, Rechenfehler).
- Stoffmenge (S3a): `chem/formula.ts` (Summenformeln mit Klammern und Kristallwasser
  `*`, `atomCounts` auch wie typische Fehler zählen: `ignoreIndices`,
  `bracketOnLast`, `withoutAdducts`; `formulaCe` für mhchem), `chem/substances.ts`
  (71 Stoffe mit Namen, `simple`/`bracket`/`hydrate`), `chem/molarMass.ts` (Werte
  `pse` mit einer Nachkommastelle oder `rounded` ganz, Cl 35,5, Cu 63,5;
  Ordnungszahlen als Fehler), `generators/stoffmenge.ts` (Rechenarten `molmasse`
  und `stoffmenge` mit Untertypen n aus m, m aus n, N aus n, N aus m, m aus N,
  Atome aus m), Toleranz der falschen Antworten in `shared.ts` (`tolerantWrongs`).
  Ein Thema ohne Wissensfragen (leere Sammlung, so Stoffmenge bis S3c) zieht mit
  `nextSeed` nur Rechnungen und zählt in der Mischung `CALC_ONLY_WEIGHT` (15,
  `ui/mix.ts`). Wissensfragen (S3c): `bank/stoffmenge.ts`, `bank/gleichungen.ts`,
  Denkfehler `chem-mis-st-…` und `chem-mis-gl-…`.
  Genauere IUPAC-Werte nur in `chem/iupac.testdata.ts`.
- Reaktionsgleichungen (S3b): `chem/equation.ts` (Stoffe `species`, Gleichung mit
  Koeffizienten, `balance` über die Atombilanz mit exakten Brüchen: eindeutige
  Lösung, alle positiv, kleinste ganze Zahlen, sonst `null`; `isBalanced`,
  `equationCe` für mhchem mit Brüchen als `13/2`), `chem/reactions.ts` (34 Reaktionen
  mit Stufen, 15 Brennstoffe), `generators/gleichungen.ts` (Rechenarten
  `ausgleichen`: richtige Gleichung wählen, falsche aus `indexChanged`, `singleAtom`,
  `partly`, dann `probeStep`; `verbrennung`: C und H, O₂, ganzzahlig machen; falsche
  Gleichungen mit denselben Stoffen sind nie ausgeglichen). Abwechslung dort mit
  eigener Kennzahl (`VARIETY` in `generators.test.ts`).
- Umsatz (S4a): `generators/umsatz.ts` (Rechenart `umsatz`, Unterthema `umsatz` von
  „Stoffmenge und Umsatz“; Reaktionen aus `reactions.ts`, gegebener Stoff ein Edukt,
  gesucht Produkt oder Edukt; nutzt `molarSteps`, `nStep` aus `stoffmenge.ts`), Zahlen
  der Altklausuren in `shared.ts` (`EXAM_GIVEN_MASSES`, `usesExamNumbers`, für alle
  Rechnungen mit gegebener Masse). Auswahl nur mit Rechnungen: `questionNos` leer,
  `nextSeed` nur Rechnungen (`candidatesOf` in `engine.ts`). Chemie-Aufgaben setzen
  ihre große Formel mit `FitWidth` (`TaskIntro` in `ui/task/TaskParts.tsx`).
- Gase und Lösungen (S4b): `generators/loesungen.ts` (Rechenarten `konzentration`,
  `anteile`, `gase` je Unterthema; `calcStep` für einen Schritt mit Toleranz, `stacked`
  setzt Angaben untereinander; Gase aus der Stoffliste und Edelgase; Gasgesetz mit
  R = 8,314, T = ϑ + 273,15, Druck in hPa oder bar; Gas aus einer Reaktion bei
  Normbedingungen mit `GAS_REACTIONS` und Brennstoffen), Karten `loesungenCards.ts`,
  Fragen `bank/loesungen.ts` (Denkfehler `chem-mis-lo-…`); Grenzen: `SOLUBILITY` (g je 100 g Wasser,
  80 % der Sättigung, höchstens 5 mol/L), `MAX_BAR` für Gase, die sich verflüssigen; Lösungen der
  Altklausuren über `usesExamSolution` in `shared.ts`.
- Klausuraufgabe üben (S4c): allgemein in `src/engine/exam/` (`types.ts`: Aufgabe aus Teilen,
  Fragen mit `build(chosen, truth)`, Antworten hängen von früheren Antworten ab; `grade.ts`:
  `examState`, `withAnswer` löscht abhängige Antworten, `gradeExam` mit Folgefehlern, halben
  Punkten `share` und Teilpunkten, `final` gibt die Punkte des Teils); Chemie in
  `chem/exam/` (`task4.ts` Klausuraufgabe 4, `index.ts` Nummer → Aufgabe und Fehlertexte),
  Seite `ui/exam/ExamTaskPage.tsx` unter `#/klausur/chemie/aufgabe/4[/<nummer>]`, Kachel
  im Gebiet über `exam` am Gebiet in `catalog.ts` (`examAreaOf`). `pickSolution` in
  `generators/loesungen.ts` liefert die Lösung für Teil d.
- Ionenbindung und Salze (S5a): `chem/ions.ts` (Kationen und Anionen mit Name, Ladung,
  Formel, Molekül-Ion; `isAllowedSalt` nur echte Salze, `isSoluble`, `meltsAsIons`,
  `saltFormula`, `saltName` mit Bindestrich bei römischer Ziffer, `ionCe`),
  `generators/salze.ts` (Formel aus Namen, Name aus Formel, Zerfall in Wasser oder Schmelze,
  Born-Haber mit `METALS`, `HALOGENS`, `FORMATION`), Karten `ionenCards.ts`, Fragen
  `bank/ionen.ts` (Denkfehler `chem-mis-io-…`). Bilder: `chem/figures.ts` (Ionengitter als
  Lagen in der Elementarzelle, Linien zu nächsten Nachbarn, `coordinationOf`), gezeichnet
  von `ui/chem/ChemFigure.tsx`; Fragen und Schritte mit `figure`, Karten mit `figures`.
  Testmuster gegen Platzhalter erlauben `NaN` in Formeln wie NaNO₂ (`NaN(?![A-Z0-9])`).
- Moleküle (S5b): `chem/molecules.ts` (43 Moleküle: Atome mit Lage x, y für die Lewis-Formel,
  Bindungen mit Ordnung, `central`, `dipole` true/false/null = nicht fragen, `sextet` für Bor,
  `expanded` ohne Lewis-Formel; `lonePairsOf`, `vseprOf`, `shapeOf`, `angleOf` als Text mit
  `^\circ`, `typeLatex`), `chem/lewis.ts` (Lewis-Bild `lewis:<Molekül>[:<Fehler>]`, falsche
  Formeln aus `LEWIS_VARIANTS`, freie Paare weg von den Bindungen, `lewisValid`), räumliches Bild
  `gestalt:<Molekül>` in `chem/figures.ts` (Richtungen je Typ, Keulen für freie Paare),
  `chem/electronegativity.ts` (Pauling und gerundete Tabelle, `bondTypeAskable`), `chem/molNames.ts`
  (Namen mit Vorsilben aus den Anzahlen), `generators/molekuele.ts` (Rechenarten `lewis`, `gestalt`,
  `polaritaet`, `molname`; `MOLECULE_STEPS` für die Katalogtests), Karten `molekueleCards.ts`, Fragen
  `bank/molekuele.ts` (Denkfehler `chem-mis-mo-…`). Antworten als Bild: `figure` an `Choice`
  (`TaskScreen` zeichnet `FigureDrawing`, der Text ist die Beschreibung für Vorlesehilfen), Bild im
  Ergebnis `resultFigure`.
- Zwischenmolekulare Kräfte (S5c): `chem/zmk.ts` (40 Stoffe: `polar`, `hBond`, Siedepunkt `boil`;
  `forceOf`, Vergleichsgruppen `BOIL_GROUPS` mit Regel, `orderByRule`, `orderByBoil`),
  `generators/zmk.ts` (Rechenarten `zmk-kraft`, `zmk-sieden` mit `pickBoilSet` und `ruleOf`,
  `zmk-loesen`; `ZMK_STEPS` für die Katalogtests), Karten `zmkCards.ts`, Fragen `bank/zmk.ts`
  (Denkfehler `chem-mis-zk-…`), Gegenprobe `chem/zmk.test.ts`.
- Metallbindung und Hybridisierung (S5d): `generators/metalle.ts` (Rechenarten `hybrid` mit
  `hybridSites` aus den Moleküldaten, `sigma-pi` nur Moleküle mit Mehrfachbindung und Lewis-Bild,
  `dotierung` mit Fremdatomen der III. und V. Hauptgruppe in Si oder Ge, `bindungsordnung` mit
  `MO_SPECIES`), Karten `metalleCards.ts`, Fragen `bank/metalle.ts` (Denkfehler `chem-mis-me-…`),
  Katalogbeispiele und Gegenprobe in `generators/metalle.test.ts`.
- Klausuraufgabe 3 (S5e): `chem/exam/task3.ts` (Teile aus Schritten der Rechnungen über `fromStep`:
  Antworten, Rechenfehler, Bild und Erklärung übernommen; `pickSalt`, `ionsStep`, `formulaStep` aus
  `generators/salze.ts`, `MOLECULE_STEPS`, `ZMK_STEPS`, `boilTask`, `dopeTask`, `hybridTask`), Kachel über
  `exam: { task: 3 }` am Gebiet `chem-bindung`. `ExamOption.figure` zeigt Bilder als Antworten
  (`ui/exam/ExamTaskPage.tsx`); `givenLatex` darf leer sein.
- Elektronen (S6a): `chem/electrons.ts` (Besetzungsreihenfolge `AUFBAU` bis 6p, `atomConfig` mit Ausnahmen
  `EXCEPTIONS`, in Aufgaben nur `TASK_EXCEPTIONS` Cr und Cu; `ionConfig`: Kationen geben das größte n ab,
  `removeLast` als Fehler; `coreOf` Edelgaskern mit weniger Elektronen, `configLatex`, `configKey` zum Vergleichen;
  Kästchen `hundBoxes`, `pairedFirstBoxes`, Bild-Id `kaestchen:<Kern>/<Unterschale>=<Kästchen>` mit `0 u d 2 x`,
  gezeichnet von `ChemFigure.tsx` als `BoxFigure`; `mainGroupOf`, `valenceConfig`, `MAIN_GROUP`),
  `generators/elektronen.ts` (Rechenarten `konfiguration`, `kaestchen`, `ion-konfiguration`, `valenz`,
  `element-aus-valenz`, `schale`, `unterschale`, `quantenzahlen-erlaubt`; falsche Konfigurationen mit dem Kern der
  Lösung, wo er passt; Kationen mit Edelgaskonfiguration kurz als [Ar]), Rechenfehler in `chem/elektronenRules.ts`
  (in `CHEM_ERROR_RULES` eingehängt), Karten `elektronenCards.ts`, Fragen `bank/elektronen.ts` (`cfg` schreibt
  Konfigurationen), Denkfehler `chem-mis-el-…`, Gegenprobe `chem/electrons.test.ts` (zweite Liste nach NIST),
  Katalogbeispiele `generators/elektronen.test.ts`.
- Klausuraufgabe 1 (S6b): `chem/exam/task1.ts` (Teile aus Wissensfragen über `planQuestion` und Rechnungen,
  `particleItem` für Protonen, Neutronen, Elektronen in einer Antwort, `valenceTask`, Licht aus
  `LIGHT_GENERATORS`), `fromStep` jetzt in `chem/exam/fromStep.ts` (übernimmt `whyWrong` als `ExamOption.why`);
  `chemErrorInfo` kennt auch Denkfehler (nur den Namen). Kachel über `exam: { task: 1 }` am Gebiet `chem-materie`.
- Aufbau des Periodensystems (S6c): `chem/pse.ts` (`placeOf`: Periode, Gruppe 1 bis 18, Block aus der Konfiguration,
  auch Pd; `valenceOf`, `mainGroupName`, `elementAt`, `kindOf` mit Halbmetallen, `IONIZATION` und `jumpAfter`),
  Bild `pse:<Symbol>` (`pseFigureById` in `figures.ts`, gezeichnet als `PseFigure`), `generators/pse.ts` (Rechenarten
  `steckbrief`, `steckbrief-rueckwaerts`, `ionenladung` mit `ION_ELEMENTS`, `ionisierung`; `narrow` schränkt beim
  gezielten Üben nie auf null ein), Rechenfehler `chem/pseRules.ts`, Karten `pseCards.ts`, Fragen `bank/pse.ts`
  (Denkfehler `chem-mis-pse-…`), Gegenprobe `chem/pse.test.ts`, Katalogbeispiele `generators/pse.test.ts`.
- Trends im Periodensystem (S6d): `chem/trends.ts` (`RADIUS`, `FIRST_IE`, `EN`, `VALUES`, Richtung `RULE`, `comparable` mit
  `EXCLUDED` aus §6, `allComparable`, `ascending`, `ISOELECTRONIC` Ionenradien), Bild `pse-trend:<Größe>[:A,B]` mit
  Pfeilen (`TREND_ARROWS`, `pseTrendFigureById`; `PseFigure.marks` statt einer Markierung), `generators/trends.ts`
  (je Größe `vergleich-…` und `ordnen-…`, dazu `ionenradien`; `pairs`, `lines`), Rechenfehler `chem/trendRules.ts`,
  Karten `trendsCards.ts`, Fragen `bank/trends.ts` (Denkfehler `chem-mis-tr-…`), Tests `generators/trends.test.ts`.
- Klausuraufgabe 2 (S6e): `chem/exam/task2.ts` (Teil a aus `steckbriefTask` mit drei Schritten, Teil b aus `orderTask`
  der Trends oder `ionTask` aus `generators/pse.ts`), Kachel über `exam: { task: 2 }` am Gebiet `chem-periodensystem`.
- Chemisches Gleichgewicht (S7a): `chem/equilibria.ts` (20 Gasgleichgewichte mit `dH` in kJ oder `null` = nie nach der
  Temperatur fragen; `gasCount`, `speciesCount`, `pressureShift`, `temperatureShift`, `concentrationShift`, `equilibriumCe`
  mit `<=>` und (g)), `generators/mwg.ts` (Rechenarten `mwg`, `k-wert`, `k-raten` mit Buchstaben-Reaktionen `GENERIC`,
  `le-chatelier` mit Eingriff im Form-Text, `ausbeute`; `sideLatex` mit Varianten der Fehler, `expressionStep`,
  `pressureAskable`), Rechenfehler `chem/mwgRules.ts`, Karten `mwgCards.ts`, Fragen `bank/mwg.ts` (Denkfehler
  `chem-mis-gg-…`), Tests `generators/mwg.test.ts`. Bild `energie:<exo|endo>[:kat]` (`energyFigureById` in `figures.ts`,
  gezeichnet als `Energy` in `ChemFigure.tsx`). Im Fließtext nie das Wort „null“ (die Tests suchen es als Platzhalter).
- Energie bei Reaktionen (S7b): `chem/thermo.ts` (`THERMO` mit ΔfH° und S° als Text, Schlüssel `H2O(l)`, `element`;
  `THERMO_REACTIONS` mit `formation`, `sideSum` mit Fehlern `noCoef` und `waterGas`, `reactionDH`, `reactionDS`,
  `reactionCe` mit `->`), `generators/energie.ts` (Rechenarten `reaktionsenthalpie`, `entropie` mit Phasenübergängen
  und `GAS_DS_REACTIONS`, `gibbs`, `bereich` mit `spontaneousRange`, `grenztemperatur` mit `LIMIT_REACTIONS`, `dg-k`;
  `dec` schreibt exakte Dezimalzahlen, `toDecimalString` liefert schon das Komma), Rechenfehler `chem/energieRules.ts`,
  Karten `energieCards.ts`, Fragen `bank/energie.ts` (Denkfehler `chem-mis-en-…`), Tests `generators/energie.test.ts`.
  Hochgestellte Ziffern wie in ΔG⁰ nur in Formeln (`$\Delta G^{0}$`), auch in Titeln.
- Klausuraufgabe 5 (S7c): `chem/exam/task5.ts` (a aus Wissensfragen `EQUILIBRIUM_QUESTIONS` und `CATALYST_QUESTIONS`, b aus
  `expressionStep`, c letzter Schritt von `leChatelierTask`, d aus `dhTask` auf Klausurniveau ohne Bildungen, e aus
  `gibbsTask` oder `rangeTask`), Kachel über `exam: { task: 5 }` am Gebiet `chem-gleichgewicht`.
- Wiederholung (S8a): Regeln rein in `engine/quiz/schedule.ts` (`afterAnswer`, `noteShown`, `courseReviews`, `otherVariant`),
  Speicher `state/reviews.ts` (Schlüssel `rechenweg-wiederholung`, `rememberTaskShown` in `useRememberForm`, `recordReview` im
  `TaskScreen` nur bei Wissensfragen über `questionNoOf`, `clearReviews` bei „Fortschritt löschen"); `pickNewSeed` und
  `pickMixed` nehmen `review`/`reviewOf` (fällige zuerst über `dueInSelection`, wartende zählen wie gezeigt), nur beim
  geführten Üben.
- Frei rechnen (S8b): `GuidedStep.numeric` (`NumericAnswer` in `engine/quantity/judge.ts`: Wert, Einheit als LaTeX, `exact`,
  Fehlerwerte mit `why`, `also` für weitere richtige Werte, `note`), gebaut mit `tolerantNumeric`, `exactNumeric`,
  `numericWrong`, `unitOf` in `generators/shared.ts` (`tolerantWrongs` gibt jetzt `value` mit). Rechenarten mit Zahlen tragen
  `free: true` (`free.test.ts` prüft: jede ihrer Aufgaben hat einen Schritt mit `numeric`, die anderen keinen; gerundete
  Lösung angenommen, jede falsche Antwort als ihr Fehler erkannt). Engine: `nextSeed(level, shown, parts, free)`,
  `hasFree(level)`; Katalog `LevelPreview.free` und `isFreeAt` (vergleicht `catalog.test.ts`). Oberfläche: `TaskScreen` mit
  `free` (Ziffernblock `ui/numeric/NumberAnswer.tsx`, Rückmeldung `TypedFeedback`), `PracticePage` zeigt Chemie frei dort statt
  im MathLive-Bildschirm. Browser-Tests `e2e/chem-free.spec.ts` (rechnen die Antworten mit der Engine aus `src/`).
- Klausuraufgaben frei (S8c): `ExamItemBuild.numeric` und `correctValue` (aus `fromStep` und `numberOptions` in `task4.ts`),
  Antworten `zahl:<Eingabe>` (`numberAnswer`, `typedText`, `typedOption` in `engine/exam/grade.ts`; `ItemState.close`,
  `ItemResult.close`), Schalter `ModeSwitch` und ein offener Ziffernblock je Teil in `ui/exam/ExamTaskPage.tsx` (`NumberAnswer`
  mit `onSubmit`, `submitLabel`, `initial`). Tests `chem/exam/free.test.ts`, Browser-Test in `e2e/chem-free.spec.ts`.
- Probeklausur (S9a): allgemein `engine/exam/mock.ts` (`MockExam` aus Aufgaben mit Nummer und Startwert, `gradeMock` je Aufgabe
  mit `gradeExam`, `openCountOf`, `remainingMs`, `missingToPass`), Chemie `chem/exam/mock.ts` (`CHEM_MOCK`: 45 min, Aufgaben 1
  bis 5, 50 Punkte, bestanden mit 40 von 100; `chemMockExam(id)`), Katalog `mock` am Fach (`mockSubjectOf`, Test vergleicht mit
  der Engine), Seite `ui/exam/MockExamPage.tsx` (Deckblatt, Schreiben, Auswertung), gemeinsame Teile mit „Klausuraufgabe N
  üben" in `ui/exam/ExamParts.tsx` und `ui/exam/examText.ts`, Kachel `MockTile` in `HomeScreen.tsx`, Bild `exam` in
  `AreaIcon.tsx`. Browser-Tests `e2e/chem-mock.spec.ts`.
- Probeklausur, Rest (S9b): Hilfsmittel `ui/exam/ExamTools.tsx` (Knöpfe „Periodensystem" mit Tabelle aus `ELEMENTS` und `placeOf`,
  „Formelsammlung" aus den Karten in `ui/exam/formulaCards.ts`, Test `formulaCards.test.ts`; Fenster über `ui/useSheetHistory.ts` wie
  die Lernkarten), Stoffe meiden `mockSubstances` und `pickMockId` in `chem/exam/mock.ts`, „Das solltest du üben" `practiceHints` in
  `engine/exam/mock.ts` (Thema über die erste Lernkarte der Frage), Wiederholung über `ExamItem.review` (Wissensfragen in
  `task1.ts` und `task5.ts`), nachgeführt von `recordExamResult` in `ui/exam/examText.ts` (auch bei „Klausuraufgabe N üben"). In
  Browser-Tests die Knöpfe mit `exact: true` suchen (Antworten enthalten das Wort „Periodensystem").
- „Wähle alle richtigen" (N1a): `MultiChoice` in `quiz/types.ts` (`kind: 'multi'`, `correct` als Liste, Vorrat mindestens
  zwei richtige und drei falsche; `correctOptionsOf` für beide Arten), `planMulti` in `quiz/plan.ts` (vier bis sechs
  Aussagen, eine bis vier richtig, mindestens eine falsch, `MULTI_SHOWN`, `MULTI_CORRECT`; Ergebnis die richtigen der
  Fassung, je Zeile eine), Schritt mit `multi: true` (`guided/types.ts`), Anzeige `MultiAnswers` in
  `ui/guided/TaskScreen.tsx` (ankreuzen mit `aria-pressed`, „Prüfen" einmal, danach je Aussage `data-verdict` hit,
  wrong, missed, skipped). In den Sammlungen Helfer `multiAt` (Ids der richtigen `r1`, `r2`, …), Fragen am Ende unter
  „Wähle alle richtigen (N1)"; jede Aussage ein Satz mit Punkt, die Frage nennt „Aussagen" (`bank.test.ts`).
  Klausuraufgaben (`task1.ts`, `task5.ts`) nehmen nur Einfachauswahl. Browser-Tests für die Einfachauswahl ziehen mit
  `ensureQuestion` neu, wenn eine Frage mit Aussagen kommt.
- Zuordnen (N1b): `MatchQuestion` in `quiz/types.ts` (`pairs` mit `left`/`right`, `traps` = Zeile, falsches Ziel eines anderen
  Paars, Denkfehler; `misconceptionsIn` für alle Arten, genutzt von `focus.ts` und `cards.test.ts`), `planMatch` in `quiz/plan.ts`
  (vier bis sechs Paare `MATCH_SHOWN`, Ziel-Ids `z-<erstes Paar mit diesem Ziel>`, beim gezielten Üben Zeile und Paar des
  falschen Ziels sicher dabei; `choices` leer, `match` mit `rows` und `targets` in `guided/types.ts`), Anzeige `MatchAnswers` in
  `ui/guided/TaskScreen.tsx` (Knöpfe bei höchstens vier Zielen mit höchstens 16 Zeichen, sonst aufklappbare Liste; `data-verdict`
  right/wrong). Paare möglichst aus den Tabellen der Engine (Beispiel `MOLECULE_ION_NAMES` in `bank/ionen.ts`); `bank.test.ts`
  prüft Vorrat, eindeutige linke Einträge, Ziele und Verwechslungen. Fragen am Ende unter „Zuordnen (N1b)", Ids mit „-zuordnen-".
- Ordnen (N1c): `OrderQuestion` in `quiz/types.ts` (`items` in richtiger Reihenfolge von `first` nach `last`, `traps` als `reversed`
  oder `swap` mit `before`/`after`), `planOrder` in `quiz/plan.ts` (vier oder fünf Glieder `ORDER_SHOWN` als Teilfolge, Start nie
  richtig, beim gezielten Üben die Glieder des Tauschs sicher dabei; `orderTrapsIn` erkennt die Fehler einer gelegten Reihenfolge,
  bei ganz umgedreht nur diesen), Schritt `order` in `guided/types.ts`, Anzeige `OrderAnswers` und `OrderTrapWhy` in
  `ui/guided/TaskScreen.tsx` (Pfeilknöpfe „Nach oben"/„Nach unten", `data-verdict`). Reihenfolgen aus Messwerten mit Gegenprobe
  (Beispiel `RADIUS_PERIOD3` in `bank/trends.ts`, Test in `generators/trends.test.ts` mit `allComparable`). Ids mit „-ordnen-".
- Kästchen antippen (N2a): `GuidedStep.boxes` (`BoxInputStep` in `guided/types.ts`: Kern, Zeilen mit Unterschale, Orbitalen und
  richtiger Zahl, `alternatives` als Zahlen je Zeile für 3d vor 4s und Ausnahmen, `whys`), Urteil `judgeBoxes` in `chem/boxInput.ts`
  (Zahl je Zeile, dann Form: Paare zu früh `chem-el-hund`, gemischte Spins `chem-el-hund-spin`; `nextBox`, `solutionBoxes`,
  `totalMatches`), gebaut in `boxTask` (`generators/elektronen.ts`; ohne `boxes` beim gezielten Üben von `chem-el-pauli`),
  Anzeige `BoxAnswers` in `ui/guided/TaskScreen.tsx` (Rückmeldung über `judged` und `TypedFeedback` mit `note`). Test
  `chem/boxInput.test.ts` prüft gegen die falschen Bilder der Auswahl.
- Inhalts-Check (S10): Ausschlüsse nach CHEMIE.md §9 `EXAM_PARTICLES`/`isExamParticle` (`generators/particles.ts`), `EXERCISE_LINES`,
  `EXERCISE_IONS` (`generators/trends.ts`), `SCRIPT_TRANSITIONS` (Rydberg in `generators/light.ts`, `rydbergValues`,
  `RYDBERG_TRANSITIONS`), `EXAM_VALENCE_ELEMENTS` (Klausuraufgabe 1); `directionStep` fragt absichtlich anders als Altklausur 2d
  (`NAME.dative`). Moleküle: `splitStep` zählt Paare am Zentralatom (nur Moleküle mit `central`; Fehler
  `chem-lewis-free-whole-molecule`), `OTHER_NAMES` und Vorsilben bis nona in `molNames.ts`; `chem/zmk.ts` mit `structure`
  (Bauhinweis ab Stufe 3), `MELT` und `roomStateOf` (Zustand bei 20 bis 25 °C), `FORCE_NAME` mit den Begriffen des Skripts.
  Metalle: Cl₂ in `MO_SPECIES`, Karten `met-einlagerung`, `met-mehrzentren`. Gleichgewicht: `positionNote` (Lage nur bei K ≥ 10 bzw.
  ≤ 0,1), Fundstellen über `folie(n)`; K_GG auch im Thema Energie (Test in `generators/energie.test.ts`). Klausur: kein `final` bei
  unabhängigen Fragen (task1 bis 3), `paperFirst` an `ExamItem` (Knopf „Auf Papier gelöst, Antworten zeigen" in
  `ui/exam/ExamParts.tsx`), zusätzliche falsche Antworten `chem/exam/extraOptions.ts`, Wissensfragen der Altklausuren
  `chem/exam/knowledge.ts`, „knapp daneben" in der Probeklausur halb (`MOCK_CLOSE_SHARE`, `gradeExam(…, { closeShare })`), „freiwillig?"
  gegen das eigene ΔG (`dgSign` in `task5.ts`). Wortvergleich mit den Unterlagen: Skript `ngram.py` im Arbeitsordner der Sitzung
  (acht Wörter am Stück), nie ins Repo.
  Stöchiometrie (S10): Reaktionen mit `equilibrium` (Ammoniak, SO₃, NO₂) stehen mit ⇌ (`reactionLatex` in `chem/reactions.ts`), nie im
  Umsatz (`UMSATZ_REACTIONS`); Umsatz auch vom Produkt aus (Form `aus-produkt`); Untertyp `M-from-m-n` (Rechenfehler
  `chem-molar-m-times-n`, `chem-molar-n-over-m`); abgewogen nur Feststoffe (`WEIGH_IDS`, `NOT_WEIGHED`, `hydrateInfo` in
  `generators/loesungen.ts`, auch Klausuraufgabe 4 Teil d); `EXAM_GIVEN_MASSES` schließt auch Zahlen der Übungsblätter und
  Rechenbeispiele des Skripts aus; unvollständige Verbrennung nur in der Vertiefung.
  Nachgeholt (S10, Musterlösung Bindungen): `splitQuestion` in `generators/molekuele.ts` (immer „in der Lewis-Formel … am Zentralatom“,
  bei Mehrfachbindung mit Hinweis; VSEPR-Zählung nie als falsche Antwort), O₂ in `molecules.ts` (44 Moleküle), `sigma-pi` mit allen
  Molekülen mit Mehrfachbindung (auch O₂, N₂), `EXERCISE_SALTS`/`isExcludedSalt` in `generators/salze.ts` (auch `saltPart` in task3),
  Legierung auf `met-metallbindung`, Denkfehler `chem-mis-mo-lone-whole-molecule` und `chem-mis-me-alloy-metals-only`.
- Klausur-Start (S11, allgemein für Fächer mit `mock`): Karte „Klausur Teil N" oben im Fach auf der Startseite (`ExamStartCard` in
  `HomeScreen.tsx`, ersetzt `MockTile`) mit „Wiederholen" (Zahl der fälligen Fragen, bei 0 „nichts fällig" ohne Link), „Probeklausur"
  und „Klausur-Überblick". Überblick `ui/exam/ExamOverviewPage.tsx` unter `#/klausur/<fach>`: je Klausuraufgabe die Stufe „wie sicher"
  aus den letzten drei Versuchen (`ui/examOverview.ts`: `examAttempts` mit Übungen aus `state/examPractice.ts` und den Aufgabenpunkten
  in `MockRecord.tasks` in der Reihenfolge `mockTaskOrder`, Test gegen `CHEM_MOCK.tasks`; `confidenceOf` unter 50 % unsicher, unter 80 %
  fast sicher, sonst sicher), dazu letzte und beste Probeklausur und die Wiederholung. „Wiederholen" `#/wiederholen/<fach>`
  (`ui/ReviewPage.tsx`, `ui/reviewPick.ts`, `dueAcross` in `engine/quiz/schedule.ts`): die am längsten fällige Frage aller Themen in
  anderer Fassung, Stufe über `resolve`, Weiterleitung mit `?wiederholen=<fach>`; dort führen X und „Zur Übersicht" zur Startseite,
  „Nächste Aufgabe" zur nächsten fälligen Frage; kein Stufenvorschlag; `lastCourse` und `lastMix` bleiben. Browser-Tests
  `e2e/exam-start.spec.ts`.
- Ratefallen (S12): `engine/quiz/answerLength.ts` (`visibleLength`: Formeln nach ihrem Inhalt; `lengthStat`: Anteil „richtige
  ist die längste/kürzeste“ und Wert bei Zufall; Auswahlen mit längster Antwort unter 30 Zeichen zählen nicht), Test
  `chem/guessing.test.ts` je Thema, Stufe und Art (Fragen: Zufall − 15 bis + 10 Prozentpunkte; Rechnungen nur die Obergrenze).
  Neue Fragen gleich so schreiben: falsche Antworten so genau wie die richtige (mit Begründung, wenn die richtige eine hat),
  und je Stufe soll die richtige mal die längste, mal die kürzeste, meist in der Mitte sein.
