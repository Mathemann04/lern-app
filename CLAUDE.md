# Rechenweg (Arbeitstitel)

Mathe-Lern-App im Stil von Brilliant: Aufgaben Schritt für Schritt selbst
lösen, geführt (Multiple Choice mit typischen Fehlern als falschen Optionen)
oder frei (Eingabe über Mathe-Tastatur, mathematische Prüfung). Zuerst für
den Nutzer zugeschnitten: Maschinenbau, 1. Semester, THU, „Mathematik MB1".

- Vision und Anforderungen: [docs/VISION.md](docs/VISION.md)
- Maßstab fürs Niveau: das Buch des Nutzers „Mathe für Ingenieure",
  Kapitel und ihre Themen in der App: [docs/LEHRBUCH.md](docs/LEHRBUCH.md)
- Meilensteine und aktueller Stand: [docs/ROADMAP.md](docs/ROADMAP.md)
- Plan für den laufenden Meilenstein: [docs/PLAN-M2b.md](docs/PLAN-M2b.md)
  (Brüche nachschärfen: Abwechslung und Profi-Niveau). Pausiert nach Schritt 3: [docs/PLAN-M3.md](docs/PLAN-M3.md)
  (Gleichungen umstellen). Abgeschlossen: [docs/PLAN-M1.md](docs/PLAN-M1.md),
  [docs/PLAN-M2.md](docs/PLAN-M2.md)

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
  Startseite) → Gebiete (Kacheln, ohne spielbares Thema blass mit „kommt
  bald") → Themen (Stufe und Art wählen, üben; ohne spielbare Stufe blass
  mit „kommt bald"); neue Inhalte dort eintragen. Je Thema: Stufen mit
  Vorschau-Formeln und `available` (geführt spielbar), `free` (freier
  Modus da), `focus` (gezieltes Üben da), Lernkarten-Ordner `cards`. Jedes
  Gebiet hat eine Farbe (`tone`) und ein Bild, jedes Thema ein Bild
  (`AreaIcon.tsx`, SVG in der Tonleiter `tone-*`). Die Engine eines Themas
  lädt `courseEngines.ts` erst beim Üben (`planGuidedTask` für geführt,
  `prepareFree` für frei).
  Seiten über `#/…` (`routes.ts`): Start `#/` („Weitermachen" und die
  Fächer), Gebiet `#/gebiet/grundlagen`, Thema `#/thema/brueche`,
  geführt üben `#/ueben/brueche/1` (neue Aufgabe) bzw.
  `#/ueben/brueche/1-4711` (bestimmte Aufgabe), frei üben
  `#/frei/ableiten/1-4711` (ohne freien Modus geht es geführt weiter),
  gezielt üben mit `?fokus=<Fehlerregel>` (z. B.
  `#/ueben/ableiten/2?fokus=cos-sign`); alte Adressen ohne Thema
  (`#/ueben/1-4711`) gehören zum Ableiten. Lernkarten in Ordnern nach
  Themen `#/karten`, `#/karten/brueche`, `#/karten/ableitungen/product`,
  `#/fortschritt` (je Thema ein Abschnitt),
  `#/einstellungen`, Testseite `#/galerie` (Link in den Einstellungen;
  Übersicht wie die Startseite: Fach, Gebiete, Themen aus `GALLERY_COURSES`
  in `catalog.ts`, dazu die Schreibweise-Beispiele aus `samples.ts`, auch die
  für Stufe 5 von „Gleichungen umstellen"; je Thema eine Seite
  `#/galerie/brueche` mit Stufen und Aufgaben). Startseite, Gebiet, Einstellungen,
  `routes.ts` und `catalog.ts` kommen ohne Mathe-Engine und KaTeX aus
  (Ladezeit); alle anderen Seiten lädt `App.tsx` erst bei Bedarf. Ob es
  eine Lernkarte oder einen typischen Fehler aus der Adresse gibt, prüfen
  `cards/cardRoute.ts` und `practice.ts`. Hauptmenü `MainNav.tsx`: am Handy
  Leiste unten (Start, Lernkarten, Fortschritt, Einstellungen), ab `md` oben
  im Kopf, in Aufgaben ausgeblendet (das X führt zum Thema). Unterseiten
  haben oben `BackLink` („← Ordner", eine Ebene höher).
  Lernbildschirm geführt in `src/ui/guided/`, frei in `src/ui/free/`
  (für alle Themen gleich: Beschriftung, Tastatur und Prüfung kommen aus
  der Engine des Themas als `FreeTask`; MathLive mit eigener
  Bildschirm-Tastatur `keyboard.ts`, je Thema über `keyboardLayouts`:
  Ableiten mit zwei Seiten „Standard" (mit Taste y) und „Mehr Funktionen",
  Brüche mit den Buchstaben der Aufgabe, bei Bausteinen $e^x$, ln, sin,
  cos, tan, bei Wurzeln √; Umstellen mit allen Buchstaben der Aufgabe
  (bis zu sieben) und √; wird erst im freien Modus geladen), gemeinsame Teile in
  `src/ui/task/`. Lernkarten in
  `src/ui/cards/` (`CardSheet.tsx`: Fenster über der Aufgabe, die
  Zurück-Taste schließt nur das Fenster). Lange Formeln in
  `FitWidth` (`src/ui/FitWidth.tsx`) setzen sich selbst kleiner, bis sie
  passen (ohne Umbruch); im geführten Modus nur Antworten, die eine
  einzige Formel sind, Antworten mit Text brechen um. Texte mit Formeln
  über `RichText` (Formeln zwischen `$…$`). Arbeitsauftrag und Hinweis
  unter der Aufgabe (z. B. „Alle Buchstaben stehen für positive Zahlen.",
  `note`) zeigt `TaskIntro` in `src/ui/task/TaskParts.tsx`.
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
    Fehler? implizit: Vergleich auf der Kurve, `y` muss stehen bleiben);
    `check/freeTask.ts`: gemeinsame Typen des freien Modus (Urteil
    richtig / noch nicht fertig / unlesbar / falsch, Tastatur);
    `check/derivativeFree.ts`: freier Modus beim Ableiten;
    `check/fractionAnswer.ts`: freie Eingabe bei Brüchen (exakter
    Wertvergleich, mit Wurzel in √x umgerechnet, dann fertig? ein Bruch,
    zusammengefasst, gekürzt; sonst typischer Fehler);
    `check/rearrangeAnswer.ts`: freie Eingabe beim Umstellen (rechte Seite
    oder Gleichung, `parseLatexEquation`; $x$ noch nicht allein, aber für
    die Lösung richtig: „noch nicht aufgelöst"; Vergleich an Prüfstellen;
    fertig: ein Bruch, auch unter Wurzel oder im Quadrat, zusammengefasst,
    gekürzt; sonst typischer Fehler)
  - `parse/latex.ts`: liest die Eingabe der Mathe-Tastatur (LaTeX) ein, mit
    verständlichen Fehlermeldungen
  - `explain/`: Textbausteine für Erklärungen (ausführlich/kurz), Tipps und
    „Warum ist das falsch?" (`texts.ts`); Format Text mit `$…$`-Formeln.
    Lernkarten (`cards.ts`: Ordner `TOPICS`, je Regel Formel, Merksatz,
    Beispiele, typische Fehler; Ordner „Brüche" in `fractionCards.ts`, bis
    „Bausteine mit eigenen Regeln" in Stufe 5) und
    durchgerechnete Beispiele (`example.ts` aus `derive`,
    `fractionExample.ts` aus der Bruch-Engine). Texte für Brüche in
    `fractionTexts.ts`. Umstellen: Texte, Tipps und falsche Umformungen
    (Irrwege mit eigener Erklärung) in `rearrangeTexts.ts`, Ordner
    „Gleichungen umstellen" in `rearrangeCards.ts` (Beispiele sind
    Umstell-Aufgaben; Stufe 3: Hauptnenner, Kehrwert, Wurzel und Quadrat),
    durchgerechnete Beispiele in `rearrangeExample.ts`
  - `guided/plan.ts`: Schrittplaner für den geführten Modus (Regelwahl, dann je
    Summand ein Schritt; Produkt/Quotient: u', v', Einsetzen; Kette: äußere,
    innere Ableitung, Zusammensetzen, ab Stufe 4 ohne eigenen Außen-Schritt;
    u^v (Stufe 5): Logarithmieren, rechte Seite ableiten, mit f malnehmen;
    implizit (Stufe 5): Term mit y ableiten, beide Seiten ableiten, nach y'
    auflösen; Antworten aus Fehlerregeln; je Schritt die passenden
    Lernkarten). `guided/fractionPlan.ts`: dasselbe für Brüche (Hauptnenner,
    erweitern, zusammenfassen, kürzen; Zähler und Nenner zerlegen mit Tipp
    je Art; Doppelbruch: erst Zähler, dann Nenner als ein Bruch; Malnehmen
    und Kürzen in einem Schritt; ab Stufe 4 Erweitern und Zusammenfassen in
    einem Schritt; ein Schritt ohne passenden typischen Fehler geht im
    nächsten auf, im letzten ist die Antwort das Ergebnis; falsche
    Ergebnisse mit Klammern als Produkt, `productFormExpr`; Stufe 5: Regel
    anwenden, Ausmultiplizieren, innerer Doppelbruch zuerst, bei mehreren
    Rechenarten jede Klammer zu einem Bruch). `guided/rearrangePlan.ts`:
    dasselbe fürs Umstellen (je Umformung „Was machst du als Nächstes?" mit
    einer Frage zum Ziel und Irrwegen, dann „Was kommt heraus?" mit
    falschen Gleichungen aus den Fehlerregeln; ohne passenden Fehler steht
    die Gleichung gleich unter „Bisher"; ab Stufe 3 die Umformung nur an
    Weichen, `isJunction`; ist √x die Unbekannte, sprechen Fragen und
    Antworten von √x, `unknownOf`; Bedingung des Ergebnisses wie „Gilt für
    $a \neq c$."). Gemeinsame Typen in `guided/types.ts`
  - `errorCatalog.ts`: typische Fehler aller Themen mit Namen, je Thema
  - `fraction/`: Bruch-Engine (Brüche aus Polynomen, exakt): `poly.ts`
    (Polynome in mehreren Buchstaben; $1 \pm \sin x$ mit der 1 vorn),
    `frac.ts` (Bruch, Termbaum ↔ Polynom; $e^x$, $\ln x$, $\sin x$,
    $\cos x$, $\sqrt{x}$ als eigene Buchstaben, die Zahl $e$ nur in falschen
    Ergebnissen; Vergleich `fracEquals` mit $(\sqrt{x})^2 = x$ und
    $\sin^2 x + \cos^2 x = 1$), `factor.ts` (zerlegen, Hauptnenner,
    kürzen; Ergebnis: Zähler ausmultipliziert, Nenner in Faktoren),
    `task.ts` (Aufgabenformen: kürzen, plus/minus, mal, geteilt,
    Doppelbruch, mehrere Rechenarten `mixed`, verschachtelter Doppelbruch
    `nested`; Zähler wie $(x + h)^2 - x^2$; Regel eines Bausteins `rule`;
    Aufgaben mit Wurzel durchgehend in $\sqrt{x}$, `withRoots`;
    Doppelbrüche in Zwischenständen in voller Größe, `readableLatex`), `solve.ts`
    (Rechenweg, verbotene Zahlen, Ergebnis mit $\tan x$ bzw. ausmultipliziertem
    Nenner bei Wurzeln), `errorRules.ts` (typische Fehler, Ids `frac-…`;
    `freeOnly`: nur für die Diagnose im freien Modus)
  - `rearrange/`: Umstell-Engine (Gleichungen nach einer Variablen
    auflösen): `algebra.ts` (Seiten als Brüche aus Polynomen mit beliebigen
    Buchstaben, Teile ohne die Variable wie √(b² − y²) als eigene Zeichen
    `~0`, √x als Unbekannte `~u`; Endform: ein Bruch, gekürzt, Buchstaben-
    Faktor ausgeklammert), `isolate.ts` (Rechenweg: von außen nach innen
    schälen; bei mehrfacher Variable Nenner beseitigen, ausmultiplizieren,
    sortieren, ausklammern, teilen; Wurzel allein stellen und quadrieren mit
    Bedingung `requires`; Schrittnamen `stepLabel`), `check.ts`
    (Prüfstellen: Buchstaben zufällig positiv, Variable aus dem Ergebnis,
    Bedingungen der Aufgabe; Gegenprobe durch Einsetzen), `errorRules.ts`
    (typische Fehler, Ids `eq-…`, beim Zusammenfassen die aus „Brüche";
    nie eine Gleichung, die doch stimmt), `task.ts` (Aufgabe, Bedingungen)
  - `random/rng.ts`: Zufall mit Startwert; `tasks/`: Aufgaben-Nummern
    („3-48213"), Vorlagen je Stufe (`derivativeTerms.ts`,
    `fractionTerms.ts`, `rearrangeTerms.ts`), `focus.ts` und `fractionFocus.ts` (Aufgaben für
    gezieltes Üben)
- `src/state/`: Speichern auf dem Gerät (`storage.ts`, Version 3, robust
  gegen kaputten Inhalt, alte Versionen werden umgezogen: bis Version 2
  gehört alles zum Ableiten), gemeinsamer Zustand (`store.ts`),
  Einstellungen (`settings.ts`: Stufe je Thema, zuletzt geübtes Thema,
  „Geführt"/„Frei" für alle, hell/dunkel) und Fortschritt je Thema mit
  Fehlerstatistik und 8-von-10-Vorschlag (`progress.ts`)
- `e2e/`: Browser-Tests (Playwright). Im freien Modus vor dem Tippen warten,
  bis das Feld bereit ist und den Fokus hat (`math-field[data-ready]`,
  `toBeFocused`): MathLive setzt den Fokus leicht verzögert.
- `.github/workflows/app.yml`: prüft jeden Pull Request, veröffentlicht `main`
- Farben zentral in `src/index.css`:
  - `accent-*` ist die Farbe des Gebiets: `data-tone="blue"` an einer Seite
    oder Kachel färbt alles darin, ohne Angabe Blaugrün (App). `App.tsx`
    setzt den Ton je Seite (`toneOf`).
  - Dunkles Design über die Klasse `dark` am html-Element (Einstellung
    „Aussehen", `useTheme.ts`, Skript in `index.html`). Die Leitern `zinc`,
    `red`, `green`, `amber` werden dort umgedreht, deshalb `bg-surface`
    statt `bg-white`, `bg-raised` für den gewählten Teil eines Umschalters,
    `text-on-accent` auf farbigen Knöpfen, nie `text-white` auf Farbe.
  - Dort auch die dezenten Animationen (`animate-*`, aus bei „Bewegung
    reduzieren").

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
  „Gleichungen umstellen"). Neue Themen gleich so planen; Brüche werden in
  M2b nachgeschärft, danach Umstellen und Ableiten (docs/ROADMAP.md,
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
- **Engine-Regeln:** Definitionsbereich nach deutscher Schulkonvention
  (Wurzeln und gebrochene Exponenten nur für Zahlen ≥ 0, auch die dritte
  Wurzel; variable Exponenten nur für Basis > 0). Vereinfachen darf den
  Definitionsbereich vergrößern (x/x → 1), nie verkleinern und nie einen Wert
  ändern; z. B. (u^a)^k → u^(a·k) nur für ganzzahliges k. Die Zufallstests in
  `normalize.test.ts` und `finalForm.test.ts` prüfen das; nach Änderungen
  mehrmals laufen lassen. Numerische Vergleiche nur an aussagekräftigen,
  stabilen Stellen (Rundungseffekte sonst als Scheinfehler).
- **Fehlerregeln:** Jede neue Fehlerregel bekommt ein Katalogbeispiel in
  `errorRules.test.ts` und einen Eintrag im Katalog (Ableiten:
  docs/PLAN-M1.md, Brüche: docs/PLAN-M2.md, Umstellen: docs/PLAN-M3.md).
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
