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
