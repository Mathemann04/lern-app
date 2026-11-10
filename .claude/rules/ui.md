---
paths:
  - "src/ui/**"
  - "src/App.tsx"
  - "src/main.tsx"
  - "src/index.css"
  - "index.html"
  - "e2e/**"
  - ".github/**"
  - "playwright.config.ts"
---

# Notizen: Oberfläche, Browser-Tests, Veröffentlichung, Farben

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

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
  `prepareFree` für frei, `formOf` für die Form einer Aufgabe). Bei einer
  neuen Aufgabe zieht `PracticePage.tsx` (`PickNewTask`) eine Nummer, deren
  Form nicht unter den letzten zehn dieser Stufe ist (`src/ui/recentForms.ts`,
  eigener Speicherschlüssel `rechenweg-formen`); Wissensfragen kommen dabei
  reihum, keine doppelt, bevor alle der Stufe und der angekreuzten
  Unterthemen dran waren (`pickNewSeed` in
  `practice.ts`, Runde je Thema und Stufe in `src/state/questionRounds.ts`,
  Schlüssel `rechenweg-fragen`, „Fortschritt löschen" leert ihn).
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
  `#/galerie/brueche` mit Stufen und Aufgaben und „Abwechslung je Stufe":
  Formen der Aufgaben 1 bis 200 je Stufe, auf Knopfdruck in kleinen Portionen
  gezählt). Startseite, Gebiet, Einstellungen, Mischseite,
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
  cos, tan, bei Hyperbelfunktionen $e^x$, sinh, cosh, tanh, bei Wurzeln √,
  bei komplexen Zahlen $\mathrm{i}$; Umstellen mit allen Buchstaben der Aufgabe
  (bis zu sieben) und √, ab Stufe 4 mit $e^x$, ln und $\log_a$, mit $\pi$ im
  Ergebnis oder einem Winkel einer komplexen Zahl in der Aufgabe (Stufe 5) $\pi$, bei Winkel- und
  Hyperbelfunktionen mit zweiter Seite „Funktionen" (sin, cos, tan, ihre
  Umkehrfunktionen, sinh, cosh, tanh, Areafunktionen; auch bei $f'' = k^2 f$,
  für arcosh und arsinh); wird erst im
  freien Modus geladen), gemeinsame Teile in
  `src/ui/task/`. Lernkarten in
  `src/ui/cards/` (`CardSheet.tsx`: Fenster über der Aufgabe, die
  Zurück-Taste schließt nur das Fenster). Lange Formeln in
  `FitWidth` (`src/ui/FitWidth.tsx`) setzen sich selbst kleiner, bis sie
  passen (ohne Umbruch); im geführten Modus nur Antworten, die eine
  einzige Formel sind, Antworten mit Text brechen um. Texte mit Formeln
  über `RichText` (Formeln zwischen `$…$`). Arbeitsauftrag und Hinweis
  unter der Aufgabe (z. B. „Alle Buchstaben stehen für positive Zahlen.",
  `note`) zeigt `TaskIntro` in `src/ui/task/TaskParts.tsx`.
- `e2e/`: Browser-Tests (Playwright). Im freien Modus vor dem Tippen warten,
  bis das Feld bereit ist und den Fokus hat (`math-field[data-ready]`,
  `toBeFocused`): MathLive setzt den Fokus leicht verzögert.
- `.github/workflows/app.yml`: prüft jeden Pull Request, veröffentlicht `main`
- Farben zentral in `src/index.css`:
  - `accent-*` ist die Farbe des Gebiets: `data-tone="blue"` an einer Seite
    oder Kachel färbt alles darin, ohne Angabe Blaugrün (App); Töne orange,
    blue, violet, pink, cyan, indigo, sky, fuchsia. `App.tsx`
    setzt den Ton je Seite (`toneOf`).
  - Dunkles Design über die Klasse `dark` am html-Element (Einstellung
    „Aussehen", `useTheme.ts`, Skript in `index.html`). Die Leitern `zinc`,
    `red`, `green`, `amber` werden dort umgedreht, deshalb `bg-surface`
    statt `bg-white`, `bg-raised` für den gewählten Teil eines Umschalters,
    `text-on-accent` auf farbigen Knöpfen, nie `text-white` auf Farbe.
  - Dort auch die dezenten Animationen (`animate-*`, aus bei „Bewegung
    reduzieren").
