# Rechenweg (Arbeitstitel)

Mathe-Lern-App im Stil von Brilliant: Aufgaben Schritt für Schritt selbst
lösen, geführt (Multiple Choice mit typischen Fehlern als falschen Optionen)
oder frei (Eingabe über Mathe-Tastatur, mathematische Prüfung). Zuerst für
den Nutzer zugeschnitten: Maschinenbau, 1. Semester, THU, „Mathematik MB1".

- Vision und Anforderungen: [docs/VISION.md](docs/VISION.md)
- Meilensteine und aktueller Stand: [docs/ROADMAP.md](docs/ROADMAP.md)
- Plan für den laufenden Meilenstein: [docs/PLAN-M1.md](docs/PLAN-M1.md)

Vor jeder Arbeit ROADMAP und den laufenden Plan lesen.

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
- `src/ui/`: Oberfläche (React). Formeln nur über `Formula`
  (`src/ui/Formula.tsx`), das setzt alles in voller Größe (`\displaystyle`).
  Seiten über `#/…` (`useHashRoute`), z. B. Testseite `#/galerie`.
- `src/engine/`: Mathe-Engine, reines TypeScript
  - `rational.ts`: exakte Brüche (bigint)
  - `expr/types.ts`: Termbaum in *Aufgabenform* (Bruch, Wurzel, Minus bleiben,
    wie geschrieben) mit Bauhelfern
  - `expr/normalize.ts`: *Normalform* zum Vergleichen; `expr/display.ts`:
    `simplify` = Normalform als *Anzeigeform* (schöne Schreibweise)
  - `expr/print.ts`: LaTeX in deutscher Schreibweise; `expr/evaluate.ts`,
    `expr/sample.ts`: Werte und Prüfstellen im Definitionsbereich
  - `expr/finalForm.ts`: Endform von Ergebnissen (Ausklammern, Kürzen,
    Ausmultiplizieren wie im Skript)
  - `derive/`: Ableiten mit Protokoll (`derive` liefert einen Ableitungsbaum mit
    Regel, Teilen, eingesetzter Formel und Ergebnis je Knoten), Regelkatalog
    (`rules.ts`), Fehlerregeln und falsche Ergebnisse (`errorRules.ts`)
  - `check/numeric.ts`: numerische Vergleiche und numerische Ableitung als
    unabhängige Gegenprobe
  - `random/rng.ts`: Zufall mit Startwert; `tasks/`: Aufgaben-Nummern
    („3-48213") und Vorlagen je Stufe
- `e2e/`: Browser-Tests (Playwright)
- `.github/workflows/app.yml`: prüft jeden Pull Request, veröffentlicht `main`
- Akzentfarbe zentral in `src/index.css` (`--color-accent-*`)

## Arbeitsregeln
- **Erst Plan, dann bauen.** Jeder Meilenstein in kleinen Schritten, die der
  Nutzer einzeln ausprobieren kann. Ohne OK des Nutzers zum Plan nicht
  programmieren.
- **Nach jedem Schritt:** Tests, Typprüfung und Build laufen lassen; im
  Browser in Handygröße (390×844) und Laptopgröße prüfen; committen und
  pushen; ROADMAP abhaken; dem Nutzer in wenigen Sätzen sagen, was sich jetzt
  ausprobieren lässt.
- **Mathematische Korrektheit zuerst.** Alle Lösungen, Zwischenschritte und
  Beispiele kommen aus der Engine, nie von Hand. Jede neue Regel,
  Fehlerregel oder Vorlage bekommt Tests: Ergebnis gegen numerische
  Gegenprobe, falsche Optionen nie gleichwertig zur Lösung.
- **Engine-Regeln:** Definitionsbereich nach deutscher Schulkonvention
  (Wurzeln und gebrochene Exponenten nur für Zahlen ≥ 0, auch die dritte
  Wurzel; variable Exponenten nur für Basis > 0). Vereinfachen darf den
  Definitionsbereich vergrößern (x/x → 1), nie verkleinern und nie einen Wert
  ändern; z. B. (u^a)^k → u^(a·k) nur für ganzzahliges k. Die Zufallstests in
  `normalize.test.ts` und `finalForm.test.ts` prüfen das; nach Änderungen
  mehrmals laufen lassen. Numerische Vergleiche nur an aussagekräftigen,
  stabilen Stellen (Rundungseffekte sonst als Scheinfehler).
- **Fehlerregeln:** Jede neue Fehlerregel bekommt ein Katalogbeispiel in
  `errorRules.test.ts` und einen Eintrag im Katalog in docs/PLAN-M1.md.
- **Schreibweise:** Formeln immer über KaTeX gesetzt, nie als Text wie
  „x^2/(3x+1)". Deutsche Konventionen: Dezimalkomma, Malpunkt, ln, f'(x).
- **Sprache:** Oberfläche, Erklärungen und Doku auf Deutsch, Code-Kommentare
  auf Deutsch, Bezeichner im Code auf Englisch.
- **Kommunikation:** Der Nutzer hat keine Programmierkenntnisse.
  - So schreiben, dass es jemand ohne Programmierkenntnisse versteht.
  - Fachwörter vermeiden. Wenn eins nötig ist, in wenigen Worten erklären.
  - Jede Antwort endet mit „Das musst du jetzt tun:" und nummerierten
    Schritten mit den genauen Namen der Knöpfe. Wenn nichts zu tun ist:
    „Nichts".
  - Nur bei Entscheidungen fragen, die wirklich beim Nutzer liegen (Aussehen,
    Inhalte, Kosten); sonst sinnvoll entscheiden und kurz sagen, was
    entschieden wurde.
- **Doku aktuell halten:** CLAUDE.md und docs/ROADMAP.md bei jeder Änderung
  am Stand oder an den Regeln mitpflegen.

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
