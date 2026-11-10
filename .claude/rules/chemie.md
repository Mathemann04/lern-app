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
  Thema ohne Wissensfragen: leere Sammlung `bank/stoffmenge.ts`, `nextSeed` zieht
  nur Rechnungen, in der Mischung Gewicht `CALC_ONLY_WEIGHT` (15, `ui/mix.ts`).
  Genauere IUPAC-Werte nur in `chem/iupac.testdata.ts`.
