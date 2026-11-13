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
  Aufbau wie bei Brilliant in `catalog.ts`: Fächer (seit M6 Schritt 1 große
  Kacheln auf der Startseite mit `description`, `icon`, `tone`; Fächer ohne
  spielbares Gebiet, `isSubjectAvailable`, nur in der Zeile „Demnächst“) →
  Seite des Fachs `#/fach/<id>` (`SubjectScreen.tsx`: Klausur-Karte bei Fächern
  mit `mock`, spielbare Gebiete als Kacheln, „Themen mischen“, kommende
  Gebiete in „Demnächst“, Lernkarten unter „Nachlesen“, dort später auch
  „Nachschlagen“; in Fächern mit `activities`, also Mathe seit M6 Schritt 3, statt der Gebiete
  die Tätigkeiten als Kacheln in ihrer Farbe, `subjectCourses`, `CourseTile` aus `AreaScreen.tsx`,
  und „Demnächst“ aus `soon`) → Gebiete → Themen (Stufe und Art wählen, üben; ohne spielbare Stufe blass
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
  Seiten über `#/…` (`routes.ts`): Start `#/` (ohne Kopf mit Logo und ohne
  Begrüßung: „Weitermachen", Klausur-Karte, Fächer, „Demnächst"), Fach
  `#/fach/chemie`, Gebiet `#/gebiet/grundlagen`, Thema `#/thema/brueche`,
  geführt üben `#/ueben/brueche/1` (neue Aufgabe) bzw.
  `#/ueben/brueche/1-4711` (bestimmte Aufgabe), frei üben
  `#/frei/ableiten/1-4711` (ohne freien Modus geht es geführt weiter),
  gezielt üben mit `?fokus=<Fehlerregel>` (z. B.
  `#/ueben/ableiten/2?fokus=cos-sign`); alte Adressen ohne Thema
  (`#/ueben/1-4711`) gehören zum Ableiten. Lernkarten in Ordnern nach
  Themen `#/karten`, `#/karten/brueche`, `#/karten/ableitungen/product`,
  `#/fortschritt` (je Fach, siehe unten),
  `#/einstellungen`, Testseite `#/galerie` (Link in den Einstellungen;
  Übersicht wie die Startseite: Fach, Gebiete, Themen aus `GALLERY_COURSES`
  in `catalog.ts`, dazu die Schreibweise-Beispiele aus `samples.ts`, auch die
  für Stufe 5 von „Gleichungen umstellen"; je Thema eine Seite
  `#/galerie/brueche` mit Stufen und Aufgaben und „Abwechslung je Stufe":
  Formen der Aufgaben 1 bis 200 je Stufe, auf Knopfdruck in kleinen Portionen
  gezählt). Startseite, Fach, Gebiet, Einstellungen, Mischseite,
  `routes.ts` und `catalog.ts` kommen ohne Mathe-Engine und KaTeX aus
  (Ladezeit); alle anderen Seiten lädt `App.tsx` erst bei Bedarf. Ob es
  eine Lernkarte oder einen typischen Fehler aus der Adresse gibt, prüfen
  `cards/cardRoute.ts` und `practice.ts`. Hauptmenü `MainNav.tsx`: am Handy
  Leiste unten (Start, Lernkarten, Fortschritt, Einstellungen), ab `md` oben
  rechts (sonst nichts im Kopf), in Aufgaben ausgeblendet (das X führt zum Thema). Unterseiten
  haben oben `BackLink` („← Ordner", eine Ebene höher; Gebiet, Mischung und
  Klausur-Überblick führen zur Seite ihres Fachs). Die Nummer einer Aufgabe
  steht klein ganz unten (`TaskFooter` in `TaskParts.tsx`), über der Aufgabe nur
  „Stufe 2 · Leite ab“. Daneben, solange die Aufgabe offen ist, „Überspringen“
  (`TaskFooter`, M6 Schritt 2; Ziel wie „Nächste Aufgabe“ über `nextTaskHref` in
  `routes.ts`; `src/ui/skip.ts` merkt sich die übersprungene Aufgabe nur im
  Arbeitsspeicher, bis eine andere gezeigt ist: `taskShown` in `useRememberForm`;
  die nächste zeigt „Aufgabe übersprungen“, `SkipNotice`). Nichts wird als
  gelöst oder Fehler gezählt; Fehler davor bleiben gezählt. Fortschritt `#/fortschritt` je Fach: geübte Themen als
  kurze Karten (zuletzt geübtes oben, letzte zehn Aufgaben, häufigster Fehler),
  „Einzelheiten“ klappt Stufen und Fehler mit „Gezielt üben“ auf; nicht
  geübte Themen in einer Zeile.
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
  über `RichText` (Formeln zwischen `$…$`). Die Gleichung oben in einer Aufgabe steht in `FitWidth` (`TaskIntro`, Mathe
  seit M6 Schritt 4 wie Chemie; vorher brach KaTeX lange Gleichungen nach dem Gleichheitszeichen um). Arbeitsauftrag und Hinweis
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
- `.github/workflows/app.yml` installiert den Test-Browser notfalls ohne Zusatzpakete (`--with-deps` scheitert, wenn GitHub
  die Ubuntu-Server nicht erreicht; dann fiel bis 11.11.2026 auch die Veröffentlichung aus).
- `#/klausur/<fach>` (Klausur-Überblick, Fächer mit `mock`) und `#/wiederholen/<fach>` (heute fällige Wiederholung, leitet zur Aufgabe mit
  `?wiederholen=<fach>`; Vorrang `fokus` vor `mischen` vor `wiederholen`; `taskExitHref` in `routes.ts` sagt, wohin X und „Zur
  Übersicht" führen). Beide lädt `App.tsx` erst bei Bedarf; Startseite und Überblick kommen ohne Chemie-Engine und KaTeX aus (nur
  `engine/quiz/schedule.ts` und `numbers.ts`). Der Fortschritt verweist oben auf den Klausur-Überblick.
- Tätigkeiten (M6 Schritt 3): ein Thema mit `blockCombos` (bisher „Gleichungen umstellen") hat statt
  `CourseScreen.tsx` die Seite `ActivityScreen.tsx` (gleiche Adresse `#/thema/<id>`): „Was soll
  drankommen?" (Bausteine in Gruppen, „Alle", „Keine", „nur"), „Wie verschachtelt?" (Stufen 1 bis 5 als
  Umschalter, am Handy nur die Zahl, Kurzname `name` an der Stufe; ein Beispiel aus der Auswahl über
  `exampleLatex` der Engine, „Anderes Beispiel"), Art und Knopf „Stufe 3 geführt üben · 2 Bausteine",
  gesperrt mit Hinweis und Knopf „Stufe 5 wählen". Gemeinsame Teile in `CourseParts.tsx` (`ModeSwitch`,
  `LevelProgressLine`, `CourseLinks`). Eigene Farbe eines Themas `tone` (sonst die des Gebiets,
  `courseTone`): Vereinfachen orange, Gleichungen umstellen blau, Ableiten violett. Die Tätigkeit
  „Vereinfachen" ist bis Schritt 6 die Seite der Brüche (Id `brueche`). Zurück-Links der Mathe-Themen
  und -Gebiete führen zur Seite des Fachs.
- Freier Modus (M6 Schritt 4b-3): bei Gleichungen mit Zahlen neben „Prüfen“ der Knopf „Keine Lösung“ (`FreeTask.noSolution`).
- Freier Modus mit Kästchen (M7 Schritt 1b, `FreeTask.entries`): `ui/free/EntryInput.tsx`, je Kästchen ein `MathInput`
  (`autoFocus` nur im ersten), Markierung aus `FreeVerdict.marks` (rot bei falsch, sonst gelb). Browser-Tests tippen über
  `math-field[aria-label="…"]` mit `focus()`; Enter in einem Bruch prüft nicht, darum dort „Prüfen“ klicken.
  Eine Auswahl (`shape: 'choice'`) zeigt `label` als Text vor den Knöpfen, ohne Text „Der Winkel ist“ (seit M7 Schritt 4b
  auch „Lage der drei Vektoren:“ mit Rechtssystem, Linkssystem, komplanar).
- Ein `fieldset` wird im Browser nie schmaler als sein breitester Inhalt: Steht darin eine Formel mit `FitWidth`, braucht es
  `min-w-0` (Fehler vom 12.11.2026 auf der Seite „Gleichungen umstellen“, Browser-Test in `e2e/blocks.spec.ts`).
- Seit M7 Schritt 6 gibt es den Ton `emerald` (Geraden und Ebenen, smaragdgrün wie im Plan) und im freien Modus die Kästchen
  `param` (Parameterform: Spalten in Klammern, dazwischen „+ t“, Namen „2. Eintrag des Stützvektors“, „1. Eintrag des
  Richtungsvektors“ bzw. „… des 2. Richtungsvektors“; am Handy bricht die dritte Spalte um) und `equation`
  (Koordinatenform □ x + □ y + □ z = □, Namen „Zahl vor x“ … „Rechte Seite“) in `ui/free/EntryInput.tsx`.
- Seit M7 Schritt 8a gibt es den Ton `rose` (Matrizen und Gleichungssysteme, Rosé wie im Plan) und im freien Modus die
  Kästchen `matrix` (Raster in großen Klammern, `cols` Spalten, Namen „Zeile 2, Spalte 1“; bei vier Spalten schmaler) in
  `ui/free/EntryInput.tsx`.
- Seit M7 Schritt 8b das Falk-Schema als eigenes Bild `ui/draw/FalkScheme.tsx` (CSS-Raster statt SVG, Felder mit KaTeX,
  Linien `border-zinc-400`, Hervorhebung `bg-accent-100`/`bg-accent-200` mit Rahmen `ring-accent-*`; hell und dunkel über
  die Tonleiter), seitlich wischbar, wenn es nicht passt.
