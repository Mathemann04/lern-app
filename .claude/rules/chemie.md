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
