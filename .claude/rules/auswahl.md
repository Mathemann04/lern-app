---
paths:
  - "src/ui/PartPicker.tsx"
  - "src/ui/selection.ts"
  - "src/ui/MixScreen.tsx"
  - "src/ui/mix.ts"
  - "src/ui/PracticePage.tsx"
  - "src/ui/practice.ts"
  - "src/ui/catalog.ts"
  - "src/state/settings.ts"
  - "src/state/questionRounds.ts"
  - "src/engine/chem/engine.ts"
  - "src/engine/quiz/**"
---

# Notizen: Ankreuzen, was drankommt, und Themen mischen

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

- Ankreuzen, was drankommt (S1b, allgemein gebaut, später auch für Mathe):
  **Unterthemen** als `parts` am Thema in `catalog.ts` (Id, Titel ohne
  Formeln, Stufen mit Aufgaben; ein Test vergleicht mit der Sammlung), jede
  Frage mit `part`. Themenseite: „Was soll drankommen?" mit Kästchen
  (`PartPicker.tsx`, gemeinsam mit der Mischseite; Unterthemen ohne Fragen in
  der Stufe blass mit „erst ab Vertiefung"), gespeichert als nicht
  angekreuzte `skipParts` in den Einstellungen; Auswahl, Rückfall auf alle und
  Texte in `src/ui/selection.ts` (ohne Engine); gibt es zu den angekreuzten in
  der Stufe keine Fragen, ist der Üben-Knopf nicht klickbar. Die Engine wählt
  mit `nextSeed(level, shown, parts)`, `questionNos` nennt die Fragen der
  Auswahl, nur sie beginnen eine neue Runde (`startNewRound` mit Nummern).
  **Themen mischen** (`mix` am Fach, Chemie 1): Kachel auf der Startseite
  unter dem letzten spielbaren Gebiet (Bild `mix`), Seite `#/mischen/<fach>`
  (`MixScreen.tsx`: Stufe, Themen nach Gebieten ankreuzen, Unterthemen
  aufklappbar; gespeichert in `mix[fach]` mit Stufe und nicht angekreuzten
  Themen), `#/mischen/<fach>/<stufe>` würfelt (`MixPracticePage` in
  `PracticePage.tsx`, `pickMixed` in `src/ui/mix.ts`: Thema gewichtet nach der
  Zahl der Fragen seiner Auswahl, darin reihum wie sonst, Runden je Thema; so
  bleiben die Themen gemischt) und leitet zur Aufgabe mit
  `?mischen=<fach>` weiter (`fokus` gewinnt). Dort steht über der Aufgabe das
  Thema, X, „Zur Übersicht" und „Nächste Aufgabe" führen zur Mischung, kein
  „Eine Stufe höher?"; Fortschritt, Fehler, Runden und Formen zählen beim
  Thema; „Weitermachen" setzt über `lastMix` die Mischung fort (`null`, sobald
  ein Thema allein geübt wird).
  **Überspringen** (M6 Schritt 2): Eine übersprungene Wissensfrage verlässt die
  Runde (`forgetShown` in `questionRounds.ts`) und zählt bei der nächsten Wahl wie
  gezeigt (`avoid` in `pickNewSeed` und `dueInSelection`, `avoidOf` in `pickMixed`,
  aus `avoidedQuestion` in `ui/skip.ts`), außer sie ist die letzte offene Frage der
  Runde. „Wiederholen“ (`ReviewPage.tsx`) nimmt zuerst eine andere fällige Frage; ist
  nur die übersprungene fällig: „Nur noch die übersprungene Frage ist fällig“.
  **Bausteine der Mathe-Tätigkeiten** (M6 Schritt 3, bisher „Gleichungen umstellen"): dieselben `parts`
  und `skipParts`, dazu `group` und `note` am Unterthema und `blockCombos` am Thema (je Stufe die
  Mengen von Bausteinen, die zusammen in einer Aufgabe vorkommen, aus `engine/tasks/rearrangeCombos.ts`).
  Eine Aufgabe kommt nur dran, wenn alle ihre Bausteine angekreuzt sind: `hasTasks` in `selection.ts`
  (spielbar, wenn eine Menge ganz angekreuzt ist), `missingBlocks` (was man dazunehmen kann, nur
  zusammen mit einem angekreuzten), `blockedHint` (Hinweis beim gesperrten Knopf, auch bei
  „Weitermachen"), `playableLevels`, `partWords` („Bausteine" statt „Unterthemen"). `PartPicker.tsx`
  zeigt Bausteine in Gruppen (`BLOCK_GROUPS`) mit Knopf „nur", am Laptop in zwei Spalten. Die Engine
  bekommt die angekreuzten über `nextSeed(level, shown, parts)` (`engine/tasks/rearrangePick.ts`);
  `questionNoOf` erkennt Wissensfragen an `questionNos`, nicht an `nextSeed`. Bei Bausteinen **nie
  Rückfall auf alle** (`selectedParts` gibt die angekreuzten zurück, auch wenn die Stufe gesperrt ist):
  Die Übungsseite zeigt dann „Gerade gibt es hier keine Aufgabe.“ mit Hinweis und „Zur Auswahl“
  (`NoTasksForSelection` in `PracticePage.tsx`), „Eine Stufe höher?“ kommt nur, wenn die Auswahl in
  der nächsten Stufe spielbar ist (`LevelUpSuggestion.tsx`, gilt auch für Chemie).

