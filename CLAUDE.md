# Rechenweg (Arbeitstitel)

Mathe-Lern-App im Stil von Brilliant: Aufgaben Schritt für Schritt selbst
lösen, geführt (Multiple Choice mit typischen Fehlern als falschen Optionen)
oder frei (Eingabe über Mathe-Tastatur, mathematische Prüfung). Zuerst für
den Nutzer zugeschnitten: Maschinenbau, 1. Semester, THU, „Mathematik MB1".

- Vision und Anforderungen: [docs/VISION.md](docs/VISION.md)
- Maßstab fürs Niveau: das Buch des Nutzers „Mathe für Ingenieure",
  Kapitel und ihre Themen in der App: [docs/LEHRBUCH.md](docs/LEHRBUCH.md)
- Aufgabenarten und Rechenschemata aus allen Unterlagen der Vorlesung (in eigenen
  Worten, mit Ziel in der App): [docs/AUFGABENARTEN.md](docs/AUFGABENARTEN.md);
  dasselbe je Fach: Chemie [docs/AUFGABENARTEN-CHEMIE.md](docs/AUFGABENARTEN-CHEMIE.md),
  Werkstoffkunde [docs/WERKSTOFFKUNDE.md](docs/WERKSTOFFKUNDE.md), Physik
  [docs/PHYSIK.md](docs/PHYSIK.md), Technische Mechanik 1 mit festen Schreibweisen
  [docs/MECHANIK.md](docs/MECHANIK.md)
- Meilensteine und aktueller Stand: [docs/ROADMAP.md](docs/ROADMAP.md)
- Laufender Plan: [docs/PLAN-M7.md](docs/PLAN-M7.md) (Vektoren, Geraden und
  Ebenen, Matrizen; freigegeben 12.11.2026, Schritte 1a und 1b fertig), vorgezogen vor den
  Rest von [docs/PLAN-M6.md](docs/PLAN-M6.md) (fertig bis Schritt 4c);
  danach
  M12 und der Rest von [docs/PLAN-M4.md](docs/PLAN-M4.md) (Chemie 1, Klausur-Sprint
  S1 bis S11 fertig, offen N2 bis N5), Reihenfolge in docs/ROADMAP.md unter
  „Vorgemerkt“; feste Regeln für alle Chemie-Inhalte:
  [docs/CHEMIE.md](docs/CHEMIE.md). Abgeschlossen:
  [docs/PLAN-M1.md](docs/PLAN-M1.md), [docs/PLAN-M2.md](docs/PLAN-M2.md),
  [docs/PLAN-M2b.md](docs/PLAN-M2b.md) (Brüche nachschärfen: Abwechslung und
  Profi-Niveau), [docs/PLAN-M3.md](docs/PLAN-M3.md) (Gleichungen umstellen,
  4. Fassung)

## Sparsam arbeiten (Kontingent des Nutzers)
- **Lesen:** Zu Beginn nur diese Datei. Von docs/ROADMAP.md die Tabelle oben
  und den Abschnitt des laufenden Meilensteins, vom laufenden Plan nur die
  Abschnitte, die der aktuelle Schritt braucht (Überschriften vorher mit
  `grep -n '^#'` ansehen). Alles andere nur, wenn die Aufgabe es braucht.
- **Notizen je Bereich** stehen in `.claude/rules/` (Übersicht unter
  „Aufbau“). Claude Code lädt sie automatisch, sobald du eine Datei des
  Bereichs liest oder änderst. Bist du unsicher, ob eine Regel gilt, lies die
  passende Datei ausdrücklich, statt zu raten.
- **Große Dateien** nicht ganz lesen: erst gezielt suchen, dann nur den
  passenden Ausschnitt.
- **Tests während der Arbeit** nur für den geänderten Bereich, z. B.
  `npx vitest run src/engine/fraction`. Die volle Prüfung (`npm run check`,
  `npm run e2e`) einmal am Ende des Schritts vor dem Pull Request. GitHub
  prüft jeden Pull Request zusätzlich vollständig.
- **Unabhängige Prüfungen:** je Schritt höchstens eine, und nur bei
  Änderungen an Engine oder Inhalten (die inhaltliche Prüfung bei Chemie
  bleibt). Die Prüfung aus mehreren Blickwinkeln nur am Ende eines
  Meilensteins. Prüfer melden nur echte Fehler (falsche Mathematik oder
  Chemie, verletzte Regeln, fehlende Tests), keine Stilwünsche.
- **Größe:** Diese Datei bleibt unter 200 Zeilen, jede Datei in
  `.claude/rules/` unter 30 000 Zeichen (`src/instructions.test.ts` prüft
  das). Entscheidungen kommen nach docs/ENTSCHEIDUNGEN.md.

## Tech-Stack
PWA (installierbar, offline), später mit Capacitor als App.
Vite, React, TypeScript, Tailwind, KaTeX (Darstellung), MathLive (Eingabe),
vite-plugin-pwa, Vitest + fast-check (Tests), Playwright (Browser-Tests).
Kein Server, keine KI in der App; Daten lokal. Herzstück ist eine eigene
Mathe-Engine in `src/engine/` (reines TypeScript, ohne React).

## Befehle
- `npm install`: zuerst in jeder neuen Cloud-Sitzung (Pakete sind nicht
  vorinstalliert)
- `npm run dev`: Entwicklungsserver
- `npm run check`: Typprüfung, Stilprüfung (oxlint), Tests, Build
- `npm run e2e`: Browser-Tests in Handy- und Laptopgröße inkl. Offline-Test,
  gegen den Build unter `/lern-app/` wie auf GitHub Pages
- `node scripts/generate-icons.ts`: App-Symbol neu erzeugen

## Aufbau
Ausführliche Notizen je Bereich (wörtlich wie früher hier, jetzt ausgelagert):
- Oberfläche `src/ui/`, Browser-Tests `e2e/`, Veröffentlichung
  `.github/workflows/app.yml`, Farben `src/index.css`: `.claude/rules/ui.md`
- Chemie (`src/engine/chem/`, `src/engine/quiz/`, `src/ui/chem/`):
  `.claude/rules/chemie.md`; feste Regeln für Inhalte: docs/CHEMIE.md
- Ankreuzen, was drankommt, und Themen mischen (S1b, allgemein gebaut):
  `.claude/rules/auswahl.md`
- Mathe-Engine `src/engine/` (reines TypeScript, ohne React):
  - Terme, Ableiten, Prüfen, Einlesen, Texte und Lernkarten:
    `.claude/rules/engine-grundlagen.md`
  - Schrittplaner für den geführten Modus: `.claude/rules/engine-gefuehrt.md`
  - Brüche `fraction/`: `.claude/rules/engine-brueche.md`
  - Gleichungen umstellen `rearrange/`: `.claude/rules/engine-umstellen.md`
  - Aufgaben, Vorlagen, Baukästen, Abwechslung `tasks/`:
    `.claude/rules/engine-aufgaben.md`
  - Vektoren `linalg/` und Bilder `src/ui/draw/` (M7): `.claude/rules/engine-vektoren.md`
- Speichern auf dem Gerät `src/state/`: `.claude/rules/state.md`

## Arbeitsregeln
- **Erst Plan, dann bauen.** Jeder Meilenstein in kleinen Schritten, die der
  Nutzer einzeln ausprobieren kann. Ohne OK des Nutzers zum Plan nicht
  programmieren.
- **Nach jedem Schritt:** Tests, Typprüfung und Build laufen lassen; im
  Browser in Handygröße (390×844) und Laptopgröße prüfen, hell und dunkel; committen und
  pushen; ROADMAP abhaken; dem Nutzer in wenigen Sätzen sagen, was sich jetzt
  ausprobieren lässt.
- **Schwierigkeit:** Stufe 5 heißt in jedem Thema „kaum noch schwerer":
  verschachtelt und quer durch das ganze Thema (Vorbild: Stufe 5 von
  „Gleichungen umstellen"); in Fächern mit drei Stufen (Chemie) gilt das für
  die höchste Stufe „Klausurniveau". Neue Themen gleich so planen; Brüche und
  Umstellen sind nachgeschärft, Ableiten folgt später (docs/ROADMAP.md,
  „Vorgemerkt").
- **Abwechslung:** Aufgaben einer Stufe dürfen sich nicht nur in den Zahlen
  unterscheiden. Aufgaben aus einem Baukasten zusammensetzen (Anzahl der
  Teile, Rechenarten, Arten von Termen, Buchstaben), nicht aus wenigen
  festen Vorlagen. Die App merkt sich die Formen der letzten Aufgaben und
  wechselt ab. Ein Test misst die Abwechslung je Stufe (Kennzahlen in
  docs/PLAN-M2b.md); gilt für jedes Thema, auch für neue.
- **Mathematische Korrektheit zuerst.** Alle Lösungen, Zwischenschritte und
  Beispiele kommen aus der Engine, nie von Hand. Jede neue Regel,
  Fehlerregel oder Vorlage bekommt Tests: Ergebnis gegen numerische
  Gegenprobe, falsche Optionen nie gleichwertig zur Lösung.
- **Engine-Regeln:** Definitionsbereich wie im Skript (seit M6 Schritt 4c):
  gerade Wurzeln und gebrochene Exponenten (auch x^(1/3)) nur für Zahlen ≥ 0,
  ungerade Wurzeln für alle Zahlen (∛(−8) = −2); variable Exponenten nur für
  Basis > 0. Vereinfachen darf den
  Definitionsbereich vergrößern (x/x → 1), nie verkleinern und nie einen Wert
  ändern; z. B. (u^a)^k → u^(a·k) nur für ganzzahliges k. Die Zufallstests in
  `normalize.test.ts` und `finalForm.test.ts` prüfen das; nach Änderungen
  mehrmals laufen lassen. Numerische Vergleiche nur an aussagekräftigen,
  stabilen Stellen (Rundungseffekte sonst als Scheinfehler).
- **Unterlagen des Nutzers (Urheberrecht):** Skripte, Übungsblätter,
  Klausuren, Fotos aus Lehrbüchern und Auszüge daraus kommen nie ins Repo
  (es ist öffentlich), auch nicht in Testdateien oder Doku. Alle Inhalte in
  eigenen Worten, keine Folien- oder Aufgabentexte, keine kopierten Bilder,
  keine Namen von Lehrenden. Tabellen und Bilder aus einem Lehrbuch werden
  selbst gestaltet nachgebaut, nie abgezeichnet. Einzelheiten in
  docs/CHEMIE.md.
- **Chemie:** Richtig ist, was die Skripte der Vorlesung oder ein frei
  zugängliches Tabellenwerk sagen; handschriftliche Ergänzungen und
  Mitschriften liefern nur Ideen und falsche Antworten. Rechnungen,
  Gleichungen, Formeln, Konfigurationen und Trends rechnet die Engine;
  Wissensfragen und Beispiele auf Wissenskarten sichern Tests, eine
  inhaltliche Prüfung je Schritt und „Frage melden“ ab. Jede Rechnung nennt
  die Werte, mit denen sie rechnet. Abwechslung: Rechnungen mit den
  Kennzahlen aus M2b, Wissensfragen nach den Regeln in docs/PLAN-M4.md
  („Abwechslung“). Schreibweise, Daten, Grenzfälle und Toleranzen in
  docs/CHEMIE.md.
- **Fehlerregeln:** Jede neue Fehlerregel bekommt ein Katalogbeispiel in
  `errorRules.test.ts` und einen Eintrag im Katalog (Ableiten:
  docs/PLAN-M1.md, Brüche: docs/PLAN-M2.md, Umstellen: docs/PLAN-M3.md,
  Chemie: Rechenfehler in docs/PLAN-M4.md, Denkfehler der Wissensfragen in
  der Galerie).
- **Lernkarten:** Jede Regel, die in Aufgaben vorkommt, braucht eine Karte in
  `explain/cards.ts`, und jede ihrer Fehlerregeln steht auf einer Karte
  (`cards.test.ts` prüft das; bei Brüchen: jeder Fehler der spielbaren
  Stufen steht auf einer Karte, und jeder Fehler auf einer Karte lässt sich
  dort gezielt üben). Beispiele nur als Term, Bruch- oder Umstell-Aufgabe; den
  Rechenweg rechnet die Engine.
- **Texte:** „Warum ist das falsch?" benennt den Fehler und zeigt die Regel,
  verrät aber nicht das Endergebnis des Schritts. Jede Fehlerregel, die in einer
  Stufe vorkommt, braucht einen eigenen Text in `explain/texts.ts` bzw.
  `explain/fractionTexts.ts` bzw. `explain/rearrangeTexts.ts` (Tests
  verbieten den Rückfalltext). Beim Bearbeiten mit Skripten auf Backslashes
  achten (`\f` in `\frac` wird sonst zum Steuerzeichen).
- **Bilder:** Jedes Thema plant Bilder und Animationen von Anfang an, wie bei
  Brilliant (Wunsch des Nutzers). Die Engine rechnet sie aus der Aufgabe,
  Tests prüfen, dass Bild und Aufgabe zusammenpassen; Animationen nur auf
  Knopfdruck und ohne bei „Bewegung reduzieren“.
- **Bedienbarkeit:** Knöpfe und Links mindestens 44 px hoch; Text nicht
  heller als `zinc-500`.
- **Schreibweise:** Formeln immer über KaTeX gesetzt, nie als Text wie
  „x^2/(3x+1)". Deutsche Konventionen: Dezimalkomma, Malpunkt, ln, f'(x).
- **Sprache:** Oberfläche, Erklärungen und Doku auf Deutsch, Code-Kommentare
  auf Deutsch, Bezeichner im Code auf Englisch.
- **Kommunikation:** Der Nutzer hat keine Programmierkenntnisse.
  - So schreiben, dass es jemand ohne Programmierkenntnisse versteht.
  - Fachwörter vermeiden. Wenn eins nötig ist, in wenigen Worten erklären.
  - Jede Antwort nennt kurz den Stand (Meilenstein und Schritt, z. B. „M6,
    Schritt 4b-1“), empfiehlt für den nächsten Schritt den Aufwand in Claude
    („Mittel“, „Hoch“, „Sehr hoch“) und sagt, ob sich eine neue Sitzung lohnt
    (Wunsch des Nutzers, 12.11.2026).
  - Jede Antwort endet mit „Das musst du jetzt tun:" und nummerierten
    Schritten mit den genauen Namen der Knöpfe. Wenn nichts zu tun ist:
    „Nichts".
  - Nur bei Entscheidungen fragen, die wirklich beim Nutzer liegen (Aussehen,
    Inhalte, Kosten); sonst sinnvoll entscheiden und kurz sagen, was
    entschieden wurde.
- **Doku aktuell halten:** Stand in docs/ROADMAP.md, Entscheidungen in
  docs/ENTSCHEIDUNGEN.md, Wissen über einen Bereich in seiner Datei unter
  `.claude/rules/`. CLAUDE.md nur bei Regeln, die für alle Bereiche gelten.

## Git und Cloud-Sitzungen
- Jede Sitzung arbeitet auf einem eigenen Branch `claude/...`, nie direkt auf
  `main`.
- Am Ende jeder Sitzung erstellt Claude selbst einen Pull Request nach
  `main` (vom Nutzer so gewünscht). Der Nutzer übernimmt ihn mit
  „Merge pull request" und „Confirm merge".
- Neue Sitzungen starten mit dem Stand von `main`; nicht übernommene
  Branches sieht die nächste Sitzung also nicht.

## Veröffentlichung
- Das Repo ist öffentlich. Jeder Stand von `main` wird automatisch über
  GitHub Pages veröffentlicht: https://mathemann04.github.io/lern-app/
- Dort testet der Nutzer am Handy und installiert die App auf dem Homescreen.
