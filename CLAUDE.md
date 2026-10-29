# Rechenweg (Arbeitstitel)

Mathe-Lern-App im Stil von Brilliant: Aufgaben Schritt für Schritt selbst
lösen, geführt (Multiple Choice mit typischen Fehlern als falschen Optionen)
oder frei (Eingabe über Mathe-Tastatur, mathematische Prüfung). Zuerst für
den Nutzer zugeschnitten: Maschinenbau, 1. Semester, THU, „Mathematik MB1".

- Vision und Anforderungen: [docs/VISION.md](docs/VISION.md)
- Meilensteine und aktueller Stand: [docs/ROADMAP.md](docs/ROADMAP.md)
- Plan für den laufenden Meilenstein: [docs/PLAN-M2.md](docs/PLAN-M2.md)
  (abgeschlossen: [docs/PLAN-M1.md](docs/PLAN-M1.md))

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
  Aufbau wie bei Brilliant in `catalog.ts`: Fächer (Überschriften auf der
  Startseite) → Gebiete (Kacheln, ohne Thema blass mit „kommt bald") →
  Themen (Stufe und Art wählen, üben); neue Inhalte dort eintragen.
  Seiten über `#/…` (`routes.ts`): Start `#/` („Weitermachen" und die
  Fächer), Gebiet `#/gebiet/differentialrechnung`, Thema `#/thema/ableiten`,
  geführt üben `#/ueben/1` (neue
  Aufgabe) bzw. `#/ueben/1-4711` (bestimmte Aufgabe), frei üben `#/frei/1`
  bzw. `#/frei/1-4711`, gezielt üben mit `?fokus=<Fehlerregel>` (z. B.
  `#/ueben/2?fokus=cos-sign`), Lernkarten in Ordnern nach Themen `#/karten`,
  `#/karten/ableitungen`, `#/karten/ableitungen/product`, `#/fortschritt`,
  `#/einstellungen`, Testseite `#/galerie` (Link in den Einstellungen, mit
  den Schreibweise-Beispielen). Startseite, Gebiet, Einstellungen,
  `routes.ts` und `catalog.ts` kommen ohne Mathe-Engine und KaTeX aus
  (Ladezeit); alle anderen Seiten lädt `App.tsx` erst bei Bedarf. Ob es
  eine Lernkarte oder einen typischen Fehler aus der Adresse gibt, prüfen
  `cards/cardRoute.ts` und `practice.ts`. Hauptmenü `MainNav.tsx`: am Handy
  Leiste unten (Start, Lernkarten, Fortschritt, Einstellungen), ab `md` oben
  im Kopf, in Aufgaben ausgeblendet (das X führt zum Thema). Unterseiten
  haben oben `BackLink` („← Ordner", eine Ebene höher).
  Lernbildschirm geführt in `src/ui/guided/`, frei in `src/ui/free/`
  (MathLive mit eigener Bildschirm-Tastatur `keyboard.ts`, zwei Seiten
  „Standard" (mit Taste y) und „Mehr Funktionen", wird erst im freien Modus
  geladen), gemeinsame Teile in `src/ui/task/`. Lernkarten in
  `src/ui/cards/` (`CardSheet.tsx`: Fenster über der Aufgabe, die
  Zurück-Taste schließt nur das Fenster). Welche Stufen
  schon spielbar sind: `available` in `src/ui/samples.ts`. Lange Formeln in
  `FitWidth` (`src/ui/FitWidth.tsx`) setzen sich selbst kleiner, bis sie
  passen. Texte mit Formeln über
  `RichText` (Formeln zwischen `$…$`).
- `src/engine/`: Mathe-Engine, reines TypeScript
  - `rational.ts`: exakte Brüche (bigint)
  - `expr/types.ts`: Termbaum in *Aufgabenform* (Bruch, Wurzel, Minus bleiben,
    wie geschrieben) mit Bauhelfern
  - `expr/normalize.ts`: *Normalform* zum Vergleichen; `expr/display.ts`:
    `simplify` = Normalform als *Anzeigeform* (schöne Schreibweise)
  - `expr/print.ts`: LaTeX in deutscher Schreibweise; `expr/evaluate.ts`,
    `expr/sample.ts`: Werte und Prüfstellen im Definitionsbereich
  - `expr/finalForm.ts`: Endform von Ergebnissen (Ausklammern, Kürzen,
    Ausmultiplizieren, Doppelbrüche auflösen wie im Skript)
  - `derive/`: Ableiten mit Protokoll (`derive` liefert einen Ableitungsbaum mit
    Regel, Teilen, eingesetzter Formel und Ergebnis je Knoten; mit
    `dependent` hängt `y` von `x` ab: $(y)' = y'$), Regelkatalog
    (`rules.ts`), Fehlerregeln und falsche Ergebnisse (`errorRules.ts`;
    Namen mit Zeichen als Formel, z. B. `$y$ wie …`), implizites Ableiten
    (`implicit.ts`: beide Seiten ableiten, nach y' auflösen, typische Fehler
    beim Ableiten und Auflösen)
  - `check/numeric.ts`: numerische Vergleiche und numerische Ableitung als
    unabhängige Gegenprobe; `check/curve.ts`: Punkte auf einer Kurve
    (Newton) und ihre Steigung als Gegenprobe beim impliziten Ableiten;
    `check/answer.ts`: freie Eingabe prüfen (gleichwertig? welcher typische
    Fehler? implizit: Vergleich auf der Kurve, `y` muss stehen bleiben)
  - `parse/latex.ts`: liest die Eingabe der Mathe-Tastatur (LaTeX) ein, mit
    verständlichen Fehlermeldungen
  - `explain/`: Textbausteine für Erklärungen (ausführlich/kurz), Tipps und
    „Warum ist das falsch?" (`texts.ts`); Format Text mit `$…$`-Formeln.
    Lernkarten (`cards.ts`: Ordner `TOPICS`, je Regel Formel, Merksatz,
    Beispiele, typische Fehler) und durchgerechnete Beispiele (`example.ts`,
    aus `derive`)
  - `guided/plan.ts`: Schrittplaner für den geführten Modus (Regelwahl, dann je
    Summand ein Schritt; Produkt/Quotient: u', v', Einsetzen; Kette: äußere,
    innere Ableitung, Zusammensetzen, ab Stufe 4 ohne eigenen Außen-Schritt;
    u^v (Stufe 5): Logarithmieren, rechte Seite ableiten, mit f malnehmen;
    implizit (Stufe 5): Term mit y ableiten, beide Seiten ableiten, nach y'
    auflösen; Antworten aus Fehlerregeln; je Schritt die passenden
    Lernkarten)
  - `random/rng.ts`: Zufall mit Startwert; `tasks/`: Aufgaben-Nummern
    („3-48213"), Vorlagen je Stufe, `focus.ts` (Aufgaben für
    gezieltes Üben)
- `src/state/`: Speichern auf dem Gerät (`storage.ts`, Version 2, robust
  gegen kaputten Inhalt, alte Versionen werden umgezogen), gemeinsamer
  Zustand (`store.ts`), Einstellungen (`settings.ts`, auch die gewählte Stufe
  und „Geführt"/„Frei") und Fortschritt mit Fehlerstatistik und
  8-von-10-Vorschlag (`progress.ts`)
- `e2e/`: Browser-Tests (Playwright). Im freien Modus vor dem Tippen warten,
  bis das Feld bereit ist und den Fokus hat (`math-field[data-ready]`,
  `toBeFocused`): MathLive setzt den Fokus leicht verzögert.
- `.github/workflows/app.yml`: prüft jeden Pull Request, veröffentlicht `main`
- Akzentfarbe zentral in `src/index.css` (`--color-accent-*`), dort auch die
  dezenten Animationen (`animate-*`, aus bei „Bewegung reduzieren")

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
- **Lernkarten:** Jede Regel, die in Aufgaben vorkommt, braucht eine Karte in
  `explain/cards.ts`, und jede ihrer Fehlerregeln steht auf einer Karte
  (`cards.test.ts` prüft das). Beispiele nur als Term; den Rechenweg rechnet
  die Engine.
- **Texte:** „Warum ist das falsch?" benennt den Fehler und zeigt die Regel,
  verrät aber nicht das Endergebnis des Schritts. Jede Fehlerregel, die in einer
  Stufe vorkommt, braucht einen eigenen Text in `explain/texts.ts` (Tests
  verbieten den Rückfalltext). Beim Bearbeiten mit Skripten auf Backslashes
  achten (`\f` in `\frac` wird sonst zum Steuerzeichen).
- **Bedienbarkeit:** Knöpfe und Links mindestens 44 px hoch; Text nicht
  heller als `zinc-500`.
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
