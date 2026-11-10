# Rechenweg (Arbeitstitel)

Mathe-Lern-App im Stil von Brilliant: Aufgaben Schritt für Schritt selbst
lösen, geführt (Multiple Choice mit typischen Fehlern als falschen Optionen)
oder frei (Eingabe über Mathe-Tastatur, mathematische Prüfung). Zuerst für
den Nutzer zugeschnitten: Maschinenbau, 1. Semester, THU, „Mathematik MB1".

- Vision und Anforderungen: [docs/VISION.md](docs/VISION.md)
- Maßstab fürs Niveau: das Buch des Nutzers „Mathe für Ingenieure",
  Kapitel und ihre Themen in der App: [docs/LEHRBUCH.md](docs/LEHRBUCH.md)
- Meilensteine und aktueller Stand: [docs/ROADMAP.md](docs/ROADMAP.md)
- Laufender Plan: [docs/PLAN-M3.md](docs/PLAN-M3.md) (Gleichungen umstellen,
  4. Fassung, freigegeben): erst Baukasten und Abwechslung in den Stufen 1
  bis 3 wie bei den Brüchen (Schritte 4 und 5; ab Stufe 3 Kerne ineinander,
  Test der Umformungen), dann die Stufen 4 und 5 (Schritte 6 bis 9; Stufe 4
  in drei Teilen, 6a bis 6c fertig; Schritt 7 in drei Teilen, 7a bis 7c fertig;
  Schritt 8 in drei Teilen, 8a bis 8c fertig; als Nächstes Schritt 9).
  Abgeschlossen:
  [docs/PLAN-M1.md](docs/PLAN-M1.md), [docs/PLAN-M2.md](docs/PLAN-M2.md),
  [docs/PLAN-M2b.md](docs/PLAN-M2b.md) (Brüche nachschärfen: Abwechslung und
  Profi-Niveau)

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
  `prepareFree` für frei, `formOf` für die Form einer Aufgabe). Bei einer
  neuen Aufgabe zieht `PracticePage.tsx` (`PickNewTask`) eine Nummer, deren
  Form nicht unter den letzten zehn dieser Stufe ist (`src/ui/recentForms.ts`,
  eigener Speicherschlüssel `rechenweg-formen`).
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
  gezählt). Startseite, Gebiet, Einstellungen,
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
- `src/engine/`: Mathe-Engine, reines TypeScript
  - `rational.ts`: exakte Brüche (bigint)
  - `expr/types.ts`: Termbaum in *Aufgabenform* (Bruch, Wurzel, Minus bleiben,
    wie geschrieben) mit Bauhelfern; Konstanten $e$, $\pi$ und $\mathrm{i}$
    (`IMAG`, gerechnet nur in der Bruch-Engine, reell ausgewertet `NaN`);
    Werkzeuge der Stufe 5 beim Umstellen (`Tool`: Ableitung, bestimmtes
    Integral, Stammfunktion mit Grenzen, endliche Summe, Reihe, Grenzwert
    $n \to \infty$, Lösung einer Differentialgleichung mit Anfangswerten,
    Determinante $2 \times 2$ oder $3 \times 3$ mit den Einträgen statt eines
    Rumpfs, Betrag und Winkel einer komplexen Zahl, Länge, Skalarprodukt und Winkel
    von Vektoren mit ihren Einträgen, Additionstheorem bzw. doppelter Winkel mit der
    Funktion als Rumpf wie $\sin(x + a)$, $\cos(2x)$, `toolBodies`, `mapToolBodies`) als
    Buchstabe mit eigenem Namen und
    `tool` (`Var.tool`): gesetzt von `print.ts` (`toolLatex`; Summe, Reihe und
    Grenzwert in Klammern, wenn danach noch etwas steht; die
    Differentialgleichung als $f(x)$, mit Malpunkt davor, die Gleichung selbst
    über `odeLatex`; die Determinante als
    $\det\begin{pmatrix} \dots \end{pmatrix}$, im $\ln$ und in Potenzen mit großen
    Klammern; Betrag mit $\left\lvert \dots \right\rvert$, im $\ln$ ohne Klammern,
    $\arg\left(\dots\right)$, Vektoren als Spalten, der Winkel dazwischen mit
    $\sphericalangle$; ein Additionstheorem wie die Funktion selbst, im Quadrat
    $\sin^{2}(x + a)$), numerisch
    ausgewertet von `evaluate.ts` (Ableitung mit Richardson-Extrapolation,
    Integral adaptiv mit Gauß-Legendre, Summe Summand für Summand bzw.
    geometrisch fortgesetzt, Reihe über Teilsummen, Grenzwert mit großen $n$
    und Neville-Extrapolation, Differentialgleichung mit Runge-Kutta und
    Richardson-Extrapolation, Determinante mit dem Gauß-Verfahren, Betrag und
    Winkel mit komplexen Zahlen (Hauptwert des Winkels), Winkel zwischen Vektoren
    nach Kahan, ein Additionstheorem als die Funktion selbst, als Gegenprobe), `contains` und
    `variablesOf` sehen ihre freien Buchstaben (`toolBound`, `toolLimits`)
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
    zusammengefasst, gekürzt, kein offenes Produkt wie $3 \cdot 3b^2$,
    keine Dezimalzahl, bei „Wurzel beseitigen" keine Wurzel im Nenner, bei
    Partialbrüchen eine Summe aus ganzem Teil und einfachen Brüchen mit
    einer Zahl im Zähler, jeder Nenner einmal, bei komplexen Zahlen
    $a + b\,\mathrm{i}$ oder ein gekürzter Bruch mit reellem Nenner, ohne
    $\mathrm{i}$ im Nenner und ohne Potenz von $\mathrm{i}$, bei Grenzwerten
    eine Zahl (ein Term mit dem richtigen Grenzwert ist noch nicht fertig),
    bei Teleskopsummen bis $n$ ein Bruch in $n$, sonst eine Zahl (bei der
    Reihe ist ein Term in $n$ mit dem richtigen Grenzwert noch nicht fertig),
    bei $\frac{1}{\cosh x - \sinh x}$ kein $\cosh x$ oder $\sinh x$ im Nenner;
    sonst typischer Fehler, bei Rechenbäumen auch Fehler
    einer Teilrechnung bis zum Ergebnis weitergerechnet);
    `check/rearrangeAnswer.ts`: freie Eingabe beim Umstellen (rechte Seite
    oder Gleichung, `parseLatexEquation`; $x$ noch nicht allein, aber für
    die Lösung richtig: „noch nicht aufgelöst"; Vergleich an Prüfstellen;
    fertig: ein Bruch, auch unter Wurzel oder im Quadrat, zusammengefasst,
    gekürzt; eine Wurzel aus einem Bruch zählt wie ein Buchstabe, z. B.
    $b + \sqrt{\frac{y}{a}}$; ab Stufe 4 (`lenient`) jede gleichwertige Form
    ohne Doppelbruch, $\ln$, $e^{…}$, Winkel- und Umkehrfunktionen zählen wie
    Buchstaben; die Endform der Engine zählt immer als fertig, auch mit anderer
    Reihenfolge der Summanden und Faktoren; steht noch $u$
    aus der Substitution da: Hinweis, zurück einzusetzen; sonst
    typischer Fehler; passt das Ergebnis zu mehreren und steckt einer davon im
    Ausrechnen eines Werkzeugs (Stufe 5), werden alle genannt und keiner gezählt;
    $\pi$-Taste, wenn $\pi$ im Ergebnis steht oder ein Winkel einer komplexen Zahl in
    der Aufgabe;
    die Doppelbruch-Prüfung, die freie Prüfung und Baukasten gemeinsam nutzen,
    steht in `rearrange/finished.ts`)
  - `parse/latex.ts`: liest die Eingabe der Mathe-Tastatur (LaTeX) ein, mit
    verständlichen Fehlermeldungen
  - `explain/`: Textbausteine für Erklärungen (ausführlich/kurz), Tipps und
    „Warum ist das falsch?" (`texts.ts`); Format Text mit `$…$`-Formeln.
    Lernkarten (`cards.ts`: Ordner `TOPICS`, je Regel Formel, Merksatz,
    Beispiele, typische Fehler; Ordner „Brüche" in `fractionCards.ts`, in
    Stufe 5 „Bausteine mit eigenen Regeln", „Dritte Potenzen", „Wurzeln
    im Nenner beseitigen", „Polynomdivision", „Partialbruchzerlegung" und
    „Komplexe Zahlen teilen", „Grenzwerte von Brüchen", „Teleskopsummen",
    „Hyperbelfunktionen") und
    durchgerechnete Beispiele (`example.ts` aus `derive`,
    `fractionExample.ts` aus der Bruch-Engine, bei Partialbrüchen mit den
    Gleichungen für die Zahlen). Texte für Brüche in
    `fractionTexts.ts`. Umstellen: Texte, Tipps und falsche Umformungen
    (Irrwege mit eigener Erklärung) in `rearrangeTexts.ts`, Ordner
    „Gleichungen umstellen" in `rearrangeCards.ts` (Beispiele sind
    Umstell-Aufgaben; Stufe 3: Hauptnenner, Kehrwert, Wurzel und Quadrat
    mit Klammer im Quadrat und zwei Wurzeln; Stufe 4: „e-Funktion und
    Logarithmus", „Logarithmus- und Potenzgesetze", „Umkehrfunktionen",
    „Winkel- und Hyperbelfunktionen", „Substitution", „$pq$-Formel"; Stufe 5:
    „Stammfunktionen und Partialbrüche", „Geometrische Summe und Reihe",
    „Grenzwert $\left(1 + \frac{x}{n}\right)^n \to e^x$",
    „Differentialgleichungen $f' = kf$ und $f'' = k^2 f$", „Determinanten",
    „Betrag und Winkel komplexer Zahlen", „Vektoren: Länge, Skalarprodukt, Winkel",
    „Additionstheoreme"),
    durchgerechnete Beispiele in `rearrangeExample.ts`
  - `guided/plan.ts`: Schrittplaner für den geführten Modus (Regelwahl, dann je
    Summand ein Schritt; Produkt/Quotient: u', v', Einsetzen; Kette: äußere,
    innere Ableitung, Zusammensetzen, ab Stufe 4 ohne eigenen Außen-Schritt;
    u^v (Stufe 5): Logarithmieren, rechte Seite ableiten, mit f malnehmen;
    implizit (Stufe 5): Term mit y ableiten, beide Seiten ableiten, nach y'
    auflösen; Antworten aus Fehlerregeln; je Schritt die passenden
    Lernkarten). `guided/fractionPlan.ts`: dasselbe für Brüche (Hauptnenner,
    erweitern, zusammenfassen, kürzen; Zähler und Nenner zerlegen mit Tipp
    je Art, `factorMethods`: ausklammern, binomisch, $x^2 + px + q$, Zahl vorn,
    zwei Buchstaben, in Gruppen, dritte Potenzen; Doppelbruch: erst Zähler, dann Nenner als ein Bruch; Malnehmen
    und Kürzen in einem Schritt; ab Stufe 4 Erweitern und Zusammenfassen in
    einem Schritt; ein Schritt ohne passenden typischen Fehler geht im
    nächsten auf, im letzten ist die Antwort das Ergebnis; falsche
    Ergebnisse mit Klammern als Produkt, `productFormExpr`; Stufe 5: Regel
    anwenden, Ausmultiplizieren, Wurzel beseitigen (mit dem Gegenstück
    erweitern, dann ausmultiplizieren), Partialbrüche `planPartial`
    (Polynomdivision, Nenner zerlegen, Ansatz, je Zahl eine Frage, zuletzt
    die Zerlegung), komplexe Zahlen (Potenzen von $\mathrm{i}$, mit dem
    konjugiert Komplexen erweitern, ausmultiplizieren, aufteilen; Schritte
    `imag-…`), Hyperbelfunktionen wie Winkelfunktionen ($\frac{1}{\cosh x - \sinh x}$:
    mit dem Gegenstück erweitern, ausmultiplizieren, Regel), Grenzwerte `planLimit` ($x \to a$: die Schritte des Bruchs
    selbst mit dem Limes in „Bisher", dann einsetzen; $n \to \infty$: durch
    die höchste Potenz teilen, dann der Grenzwert), Teleskopsummen
    `planTelescope` (Nenner zerlegen, Summand in Partialbrüche zerlegen, danach
    die Summe ausgeschrieben in „Bisher", was übrig bleibt, zusammenfassen bzw.
    Grenzwert der Teilsumme $s_n$), innerer Doppelbruch zuerst, bei mehreren
    Rechenarten jede Klammer zu einem Bruch; Rechenbaum `planTree`: erst
    Dezimalzahlen, dann „Was rechnest du zuerst?", wenn Punkt vor Strich
    oder eine Klammer zählt, dann je Teilrechnung die Schritte der passenden
    Form, im letzten Schritt auch falsche Ergebnisse aus falscher
    Reihenfolge). `guided/rearrangePlan.ts`:
    dasselbe fürs Umstellen (je Umformung „Was machst du als Nächstes?" mit
    einer Frage zum Ziel und Irrwegen, dann „Was kommt heraus?" mit
    falschen Gleichungen aus den Fehlerregeln; ohne passenden Fehler steht
    die Gleichung gleich unter „Bisher"; ab Stufe 3 die Umformung nur an
    Weichen, `isJunction`, auch $e$ hoch, logarithmieren, Logarithmus- und
    Potenzgesetze, Umkehrfunktionen, Quadrat ersetzen, durch $\cos x$ teilen,
    substituieren, alles nach links, Normalform, $pq$-Formel, zurück einsetzen;
    Stufe 5: erst „Was steht da eigentlich?" mit den Werkzeug-Schritten als
    „Was kommt heraus?" (beim Ableiten die Fehler und Lernkarten aus
    „Ableiten"; beim Grenzwert darf die falsche Gleichung ohne $x$ sein, „1 hoch
    unendlich ist 1"; bei der Differentialgleichung erklärt die Lösung Ansatz und
    Konstanten aus den Anfangswerten, `odeExplanation`; bei der Determinante
    zeigt die Erklärung die Produkte mit Malpunkt bzw. Linie, Eintrag und
    Vorzeichen beim Entwickeln, `detExplanation`; bei Betrag und Winkel Real- und
    Imaginärteil (Euler-Form zuerst) und die Regel für Produkt, Bruch und Quadrat, bei
    Vektoren Skalarprodukt und Längen, `polarExplanation`; eigene Tipps bei der
    Euler-Form und bei zwei Faktoren mit $x$, `polarHint`; beim spitzen Winkel als
    Buchstaben „Was machst du als Nächstes?" zu $1 - \cos^2 y = \sin^2 y$ mit Irrwegen,
    `acuteQuestion`, und am Ende „Schreibe mit $\tan y$" mit Erklärung,
    `acuteExplanation`; beim Additionstheorem nennt die Frage die Funktion, beim
    doppelten Winkel von $\cos$ die Funktion, die danach allein dastehen soll, mit
    Tipp je Funktion und Erklärung mit $\alpha$ und $\beta$, `theoremQuestion`,
    `theoremHint`, `theoremExplanation`);
    nach der $pq$-Formel „Welche der beiden Lösungen passt?" mit der
    Scheinlösung als falscher Antwort und dem Grund (`rejectReason`); nach dem
    Substituieren sprechen Fragen von $u$ (`step.unknown`);
    ist √x oder ein Baustein wie $e^x$ die Unbekannte, sprechen
    Fragen und Antworten davon, `unknownOf`; Bedingung des Ergebnisses wie „Gilt für
    $a \neq c$."). Gemeinsame Typen in `guided/types.ts`
  - `errorCatalog.ts`: typische Fehler aller Themen mit Namen, je Thema
  - `fraction/`: Bruch-Engine (Brüche aus Polynomen, exakt): `poly.ts`
    (Polynome in mehreren Buchstaben; $1 \pm \sin x$ mit der 1 vorn),
    `frac.ts` (Bruch, Termbaum ↔ Polynom; $e^x$, $\ln x$, $\sin x$,
    $\cos x$, $\sinh x$, $\cosh x$ (`SH`, `CH`), $\sqrt{x}$ als eigene Buchstaben, ebenso Wurzeln aus jedem
    Buchstaben wie $\sqrt{a}$ (`Ra`) und $\sqrt{x + h}$ (`Rx+h`, gerechnet
    mit $h = (\sqrt{x + h})^2 - x$, geschrieben wieder als $h$), die Zahl $e$
    nur in falschen Ergebnissen; Vergleich `fracEquals` mit $(\sqrt{x})^2 = x$,
    $\sin^2 x + \cos^2 x = 1$ und $\sinh$, $\cosh$ über $e^x$ (`hyperbolicToExp`);
    Regeln der Quadrate `trigRewrite`, auch $\cosh^2 x - \sinh^2 x = 1$), `factor.ts` (zerlegen, Hauptnenner,
    kürzen; Ergebnis: Zähler ausmultipliziert, Nenner in Faktoren, kleinerer
    Grad zuerst; auch mit Zahl vor $x^2$, mit zwei Buchstaben gleichen Grads wie
    $a^2 - ab - 2b^2$ (auch $\sqrt{x}$ und $\sqrt{a}$), dritte Potenzen
    wie $a^3 - b^3$ und in Gruppen wie $ax - ay + bx - by$, `groupFactor`),
    `task.ts` (Aufgabenformen: kürzen, plus/minus, mal, geteilt,
    Doppelbruch, mehrere Rechenarten `mixed`, verschachtelter Doppelbruch
    `nested`; Partialbruchzerlegung `partial`; komplexe Zahlen teilen
    `imaginary`; Grenzwert `limit` mit dem Bruch als `inner`, Limes davor
    `limitedLatex`; Teleskopsumme `telescope` mit Summand, Startwert und oberer
    Grenze $n$, Zahl oder $\infty$; Zähler wie $(x + h)^2 - x^2$ oder $(x + h)^3 - x^3$; Regel eines
    Bausteins `rule`, auch „Wurzel beseitigen" `conjugate`;
    Rechenbaum `tree` aus Plus/Minus, Mal, Geteilt, Klammern, Doppelbruch,
    Blätter auch als Dezimalzahl;
    Aufgaben mit Wurzel durchgehend in $\sqrt{x}$, `withRoots`;
    Doppelbrüche in Zwischenständen in voller Größe, `readableLatex`), `solve.ts`
    (Rechenweg, verbotene Zahlen, Ergebnis mit $\tan x$ bzw. ausmultipliziertem
    Nenner bei Wurzeln; Wurzel beseitigen `solveConjugate` mit dem Gegenstück
    `conjugateOf`, Ergebnis ohne Wurzel im Nenner `rationalizedFrac`;
    Rechenbaum `solveTree` Teilrechnung für
    Teilrechnung; Partialbrüche `solvePartial`), `partial.ts`
    (Partialbruchzerlegung: Polynomdivision, Nenner in Linearfaktoren, auch
    doppelt, Ansatz mit $A$, $B$, $C$, Zahlen durch Einsetzen der
    Nullstellen und Koeffizientenvergleich, `partialWorkOf`; falsche
    Zahlen weitergerechnet `termsWith`), `complex.ts` (komplexe Zahlen:
    $\mathrm{i}$ als Atom `i` mit $\mathrm{i}^2 = -1$, `reduceImag` in
    `frac.ts`, auch beim Vergleich; Real- und Imaginärteil `imagParts`,
    konjugiert Komplexes `conjugateFactor`, Ergebnis $a + b\,\mathrm{i}$
    `complexExpr`; Buchstaben gelten als reell), `limit.ts` (Grenzwerte:
    Wert an der Stelle `fracValueAt`, auch mit $\sqrt{x}$; $n \to \infty$ über
    die höchsten Potenzen `limitAtInfinity`; durch die höchste Potenz geteilt
    `dividedFracExpr`; Rechenweg `limitWork`/`solveLimit` in `solve.ts`),
    `telescope.ts` (Teleskopsummen: Summand über die Partialbruchzerlegung als
    $A(g(k) - g(k + d))$, was übrig bleibt `remainingFrac`/`remainingExpr`, die
    ausgeschriebene Summe `writtenLatex`, typische Fehler als abgewandelte
    Rechnung `TeleVariant`; Rechenweg `teleWork`/`solveTelescope` in
    `solve.ts`), `tree.ts` (Rechenbaum: Stufen `treeStages`, jede Stufe
    eine der Formen oben, von innen nach außen, Punkt vor Strich;
    falsche Reihenfolgen für die Fehler), `errorRules.ts` (typische Fehler,
    Ids `frac-…`; `freeOnly`: nur für die Diagnose im freien Modus).
    Buchstaben: alle Kleinbuchstaben außer $e$ und $i$
  - `rearrange/`: Umstell-Engine (Gleichungen nach einer Variablen
    auflösen): `algebra.ts` (Seiten als Brüche aus Polynomen mit beliebigen
    Buchstaben, Teile ohne die Variable wie √(b² − y²) als eigene Zeichen
    `~0`, √x als Unbekannte `~u`, bei zwei Wurzeln die zweite wie √(x − a)
    als eigenes Zeichen `~r` mit (~r)² = x − a, `radicalAtoms`; ein Baustein
    wie $e^x$, $2^x$, $\ln x$ oder $\sin(2x)$ (nur im Quadrat: $\sin^2 x$), in dem
    allein die Variable steckt, als Unbekannte `~b`, `blockAtoms`; Endform: ein Bruch, gekürzt,
    Buchstaben-Faktor ausgeklammert; steht vor einer Klammer allein der Winkel eines
    Buchstabens wie $\cos y$, kommt er dahinter: $(a^2 + b^2)\cos y$), `isolate.ts`
    (Rechenweg: von außen nach innen schälen; vor dem Wurzelziehen oder
    Quadrieren eine Summe mit Brüchen zuerst zu einem Bruch; bei mehrfacher
    Variable Doppelbruch mit Brüchen im Nenner erweitern (Schritt `extend`),
    Nenner beseitigen (Klammern wie in der Aufgabe geschrieben),
    ausmultiplizieren, sortieren, ausklammern, teilen; Wurzel allein stellen
    und quadrieren mit Bedingung `requires`, steht danach noch eine Wurzel in
    einer Klammer: ausmultiplizieren, die Wurzel allein stellen, ausklammern,
    teilen, noch einmal quadrieren; Endform des Quadrats eines Bruchs mit
    Summe im Nenner als $\left(\frac{by + a}{y - 1}\right)^2$; Stufe 4: $e$
    hoch beide Seiten `exp`, $\ln$ auf beiden Seiten `log` (vorher eine Summe
    mit Brüchen zu einem Bruch), Logarithmusgesetze `logLaw`, Logarithmen
    zusammenfassen `logCombine`, Potenzgesetz $a^{m + n} = a^m a^n$
    `powerLaw`, Baustein als Unbekannte `unknownAtoms`, verschiedene Basen
    über beide Seiten logarithmieren; Wurzeln in Wurzeln bleiben im Ergebnis
    ineinander; Teil 6b: Umkehrfunktion auf beiden Seiten `arc` (Bereich der
    Aufgabe sorgt für den Hauptwert, `requires` für den Definitionsbereich),
    Funktion gegen eine Umkehrfunktion `trig`, ein Quadrat mit
    $\sin^2 u + \cos^2 u = 1$ bzw. $\cosh^2 u - \sinh^2 u = 1$ ersetzen
    `pythagoras` (auch $\cos^2 u$ neben $\sin u$), durch $\cos u$ teilen
    `tanQuotient`; Teil 6c: kommt die Variable in verschiedenen Potenzen eines
    Bausteins vor ($e^{2x}$ und $e^x$ bzw. $e^{-x}$, $x$ und $\sqrt{x}$,
    $\sin^2 x$ und $\sin x$, $\ln^2 x$, $x^4$ und $x^2$) und wird die Gleichung
    damit quadratisch, substituieren `substitute` (danach wird nach $u$
    aufgelöst, `unknown`), quadratisch in $u$ oder $x$: alles nach links
    `zero`, Normalform `normalize`, $pq$-Formel `pq` (die Gleichung danach
    enthält die passende Lösung, angezeigt mit $\pm$ über `stepEquationLatex`),
    passende Lösung wählen `choose` (beide Lösungen an Zufallsstellen geprüft:
    $x$ positiv, Bedingungen der Aufgabe, Gleichung vom Anfang; passt nicht
    genau eine, gilt die Aufgabe als nicht lösbar; Grund `reason`), zurück
    einsetzen `resubstitute`; `solveTask` löst mit den Bedingungen der Aufgabe;
    Wurzeln aus Brüchen in Summen im Ergebnis als
    $\frac{\sqrt{a^2 + 4b}}{2}$; beim Sortieren links nicht
    lauter Minus; Schrittnamen `stepLabel`; Stufe 5: erst die Werkzeuge
    ausrechnen, dann umstellen, dazu Logarithmen mit und ohne Variable
    zusammenfassen, mal $b$ statt durch $\frac{1}{b}$, Summe vor $x^2$ bei der
    $pq$-Formel, nach $x^2$ auflösen, wenn $x$ nur als $x^2$ vorkommt, Wurzel im
    Nenner wegmultiplizieren und quadrieren; Wege, an denen die Engine vor
    Teil 7b hängen blieb (Zusammenfassen ohne Änderung, Ausmultiplizieren im
    Kreis), markiert `solution.novel`, damit ältere Vorlagen ihre Aufgaben
    behalten; bei der Normalform das Minus vor dem Bruch; Teil 8b: bei einem
    spitzen Winkel als Buchstaben, Bedingung wie $y < \frac{\pi}{2}$ an einen
    Buchstaben, nach dem nicht aufgelöst wird (`acuteLetters`), nach dem
    Ausklammern $1 - \cos^2 y$ durch $\sin^2 y$ ersetzen (Schritt `pythagoras` mit
    der Summe als `operand`) und das Ergebnis mit $\tan y$ schreiben (`acuteForm`;
    steht noch kein $\sin y$ da, nennt die Beschriftung auch $1 - \cos^2 y = \sin^2 y$),
    typische Fehler dazu `acutePythagorasWrong` (Quadrat vergessen) und `acuteTanWrong`
    ($\frac{\cos y}{\sin y}$ als $\tan y$); ältere Aufgaben haben keine solche
    Bedingung), `tools/` (Stufe 5:
    `tool.ts` Werkzeuge bauen (`derivativeOf`, `integralOf`, `bracketOf`,
    `sumOf`, `seriesOf`, `limitOf`, `odeOf`, `detOf`, `absOf`, `argOf`, `lengthOf`,
    `dotOf`, `angleOf`, `theoremOf`; bei der
    Differentialgleichung steht die Gleichung im Namen) und ersetzen, das innerste zuerst
    (`activeTool`: Reihe in einer Ableitung), `integrate.ts` Stammfunktionen
    aus einer Tafel als Faktor mal Term mit typischen Fehlern, Partialbrüche
    über die Bruch-Engine, Grenzen einsetzen; `series.ts` Summand als
    $c \cdot q^k$ (auch $k q^k$, $\frac{q^k}{k}$), geometrische Summe und Reihe,
    Grenzwert $\left(\frac{n + p}{n + r}\right)^{sn} \to e^{s(p - r)}$, mit
    typischen Fehlern; `ode.ts` Differentialgleichungen $f' = \pm kf$, Abkühlen
    $f' = k(b - f)$ und $f'' = k^2 f$ mit $f(0) = a$, $f'(0) = 0$ bzw. $f(0) = 0$,
    $f'(0) = b$: Lösung in Exponentialform ($\frac{a}{2}e^{kx} + \frac{a}{2}e^{-kx}$,
    danach Substitution und $pq$-Formel), typische Fehler, Ansatz und Konstanten
    für die Erklärung (`odeWork`); `determinant.ts` Determinanten: $2 \times 2$
    als Hauptdiagonale minus Nebendiagonale mit aufgeräumten Produkten
    (`product`: Zahl vorn, Buchstaben sortiert, $e^{x} \cdot e^{-x} = 1$,
    $x \cdot x = x^2$), $3 \times 3$ nur mit einer Zeile oder Spalte mit zwei
    Nullen, nach ihr entwickelt (`expansionLine`, die Unterdeterminante ist ein
    neues Werkzeug), typische Fehler (bei „in Zeilen oder Spalten" die Variante,
    in der alle Buchstaben bleiben); `polar.ts` Betrag und Winkel komplexer Zahlen:
    Faktoren $p + q\mathrm{i}$ mit Potenz (`complexFactors`, auch Euler-Form
    $e^{\mathrm{i}x} = \cos x + \mathrm{i}\sin x$), Betrag $\sqrt{p^2 + q^2}$ (ein Bruch unter
    einer Wurzel, $\left\lvert z^2\right\rvert$ ohne Wurzel, $\lvert 3 + 4\mathrm{i}\rvert = 5$
    vorn, $\lvert 1 + \mathrm{i}\rvert$ unter der Wurzel), Winkel $\arctan\frac{q}{p}$ bei
    positivem Realteil (beim Quadrieren doppelt, Standardwinkel fester Faktoren
    addiert bzw. abgezogen, zwei Faktoren mit $x$ erst ausmultipliziert), typische
    Fehler, Real- und Imaginärteil für die Erklärung (`polarWork`, auch Euler-Form und
    zusammengefasste Wurzeln); `vector.ts`
    Länge, Skalarprodukt (Produkte wie bei Determinanten aufgeräumt) und Winkel als
    $\arccos\frac{\vec u \cdot \vec v}{\lvert\vec u\rvert \cdot \lvert\vec v\rvert}$ (Länge 1 fällt
    weg, gleich lange Vektoren ohne Wurzel), typische Fehler (zur Länge eigene:
    Einträge addiert, Wurzel vergessen; keiner, nach dem kein $x$ mehr dasteht);
    `theorem.ts` Additionstheoreme ($\sin$, $\cos$, $\tan$ von $p \pm q$) und
    doppelter Winkel ($\sin(2p) = 2\sin p \cdot \cos p$; $\cos(2p)$ in der Form, nach der
    nur noch eine Funktion dasteht: $1 - 2\sin^2 p$ bzw. $2\cos^2 p - 1$, `doubleCosForm`),
    typische Fehler (gliedweise, Vorzeichen in der Mitte, falsch gepaart; die $2$ vor
    die Funktion gezogen oder vergessen, Plus statt Minus, die Formen verwechselt),
    Regel mit $\alpha$ und $\beta$ für die Erklärung (`theoremWork`);
    `tidy.ts` Quadrate, Produkte und Summen aufräumen;
    `steps.ts` Werkzeug-Schritte `derive`,
    `partial`, `antiderivative`, `bounds`, `sumFormula`, `series`, `limit`, `ode`,
    `det`, `detExpand`, `abs`, `arg`, `length`, `dot`, `angle`, `addition`,
    `doubleAngle` und ihre typischen
    Fehler, beim Ableiten die aus „Ableiten" mit ihrer Stelle; steht in der Aufgabe
    schon $= 0$, bleiben die Fehler im Werkzeug-Schritt erhalten),
    `check.ts`
    (Prüfstellen: Buchstaben zufällig positiv, Variable aus dem Ergebnis,
    Bedingungen der Aufgabe, Zwischenwerte aus `requires` nicht riesig;
    mit Summe, Reihe, Grenzwert oder Differentialgleichung nur Stellen, an
    denen sich die Aufgabe numerisch ausrechnen lässt;
    mit $u$ nach einer Substitution `withSubstitution`;
    Gegenprobe durch Einsetzen; für falsche Gleichungen `definedSomewhere` (mit
    Additionstheorem nur im Bereich der Aufgabe) und `dependsOn`), `errorRules.ts`
    (typische Fehler, Ids `eq-…`, beim Zusammenfassen die aus „Brüche";
    falsche Gleichungen vor einer Substitution mit eigener Substitution
    weitergerechnet;
    je Klammer ein Fehler beim Ausmultiplizieren; nie eine Gleichung, die doch
    stimmt; in Aufgaben mit Betrag, Winkel, Vektoren oder Additionstheoremen keine, in
    der $x$ keine Rolle mehr spielt, keine, die für kein $x$ definiert ist, und keine
    zwei, die anders geschrieben dieselbe sind; mit Additionstheoremen auch keine, in der
    sich $x$ als gemeinsamer Faktor wegkürzt wie $2\cos x = y\cos x$, und keine mit
    einer Seite, die nur noch 0 ist), `task.ts` (Aufgabe, Bedingungen; mit Differentialgleichungen
    stehen sie je Funktion in einer Zeile über der Gleichung, `givenLatex`,
    `\begin{gathered}`; ohne sie bleibt `taskLatex` wie bisher; `taskFormLatex`
    ohne gathered und ohne den Namen pmatrix)
  - `random/rng.ts`: Zufall mit Startwert; `tasks/`: Aufgaben-Nummern
    („3-48213"), Vorlagen je Stufe (`derivativeTerms.ts`,
    `fractionTerms.ts`, `rearrangeTerms.ts`; Umstellen Stufen 1 bis 4 aus dem
    Baukasten `rearrangeKit.ts`: Kern mit der Variable, Schalen drumherum, andere
    Seite, manchmal nach einem Buchstaben aufgelöst; Stufe 3 mit Kernen
    ineinander, gegeneinander oder in einer Summe (`LEVEL3_CORES`: $x$ in
    Zähler und Nenner, Bruch gleich Bruch, Brüche mit verschiedenen Nennern,
    Klammern mit $x^2$, das sich weghebt, Kehrwerte, Wurzel aus einem Bruch,
    $x^2$ unter der Wurzel, zwei Wurzeln, $\sqrt{x}$ in Zähler und Nenner,
    Klammer oder Bruch im Quadrat mit Bedingung, Doppelbrüche); Stufe 4
    verschachtelt (`LEVEL4_CORES`: $\ln$ um einen Kern, $e$ hoch einen Kern,
    Bruch aus $e^x$ oder $\ln x$, Wurzel aus $\ln$ oder $e^x$, $\ln$ einer
    Summe mit Wurzel, Wurzeln in Wurzeln, Potenzen derselben bzw.
    verschiedener Basen, mehrere Logarithmen), dazu mit festem Anteil
    (`share`, 35 %, die übrigen Nummern behalten ihre Aufgabe)
    `LEVEL4_TRIG_CORES`: Bruch aus $\sin x$ oder $\tanh x$, Winkelfunktion mit
    Schalen oder unter einer Wurzel, Umkehrfunktion um einen Kern, Quadrate mit
    $\sin^2 x + \cos^2 x = 1$, Sinus und Kosinus in jedem Summanden, $e$ hoch oder
    $\ln$ um eine Winkelfunktion, mit Bereich wie $x < \frac{\pi}{2}$; Teil 6c
    `LEVEL4_QUADRATIC_CORES` (Anteil 40 % der Nummern, die nicht schon zu 6b
    gehören): $e^{2x}$ und $e^x$, $e^x$ und $e^{-x}$, $x$ und $\sqrt{x}$,
    $\sin^2 x$ und $\sin x$ (auch $\cos^2 x = a\sin x$), Logarithmen, die danach
    quadratisch werden, $\ln^2 x$, $x^4$ und $x^2$, Bruch oder Produkt, danach
    quadratisch; so gebaut, dass genau eine Lösung der $pq$-Formel passt (nur
    Schalen, die das Vorzeichen von $q$ nicht ändern); Stufe 5
    `buildLevel5Tools` (Teil 7a): eine Ableitung oder ein Integral (auch mit
    Partialbrüchen) allein mit Schalen, im Bruch mit einem Baustein derselben
    Art, unter einer Wurzel oder im $\ln$, oder zwei Werkzeuge mit demselben
    Baustein, Integrationsvariable $t$; Teil 7b `buildLevel5Series` (eigene
    Vorlage mit Anteil 40 %): geometrische Reihen in $x$, auch abgeleitet und
    integriert, Grenzwerte auf $e^{\square}$, endliche Summen nach der Anzahl
    $n$, mit Schalen (Werkzeug hinten), im Bruch, unter Wurzel oder $\ln$, Reihe
    in einer Ableitung oder einem Integral, Grenzwert gleich Ableitung;
    Summenindex $k$, Grenzwert über $n$; Teil 7c `buildLevel5Ode` (Anteil 30 %
    der Nummern, die nicht zu 7b gehören): $f' = \pm kf$, Abkühlen, $f'' = k^2 f$,
    mit Schalen (erster Ordnung mindestens zwei), im Bruch mit $e^{kx}$, unter
    Wurzel oder $\ln$, zwei Funktionen $f$ und $g$ mit derselben Rate; Rate $k$
    oder eine Zahl, Funktionen $f$ und $g$ (diese Buchstaben sonst nicht);
    Teil 8a `buildLevel5Det` (Anteil 25 % der Nummern, die weder zu 7b noch zu 7c
    gehören, als letzte Vorlage): $2 \times 2$, danach quadratisch ($e^{x}$ und
    $e^{-x}$, $x(x + c)$, $\sqrt{x}$, $\ln x$ mit $x > 1$, $\sin x$ und $\cos x$
    mit $x < \frac{\pi}{2}$ …; allein, mit einer Schale, unter Wurzel oder $\ln$)
    oder linear (mit Schalen oder im Bruch mit seinem Baustein), $3 \times 3$ um
    einen $2 \times 2$-Kern (Eintrag nie 1, auf einem Minus-Feld des Schachbretts
    die Spalten des Kerns getauscht, ohne Schalen; keine Kerne, nach denen nur ein
    Polynom in $x$ dasteht, denn $c\left(bx^2 - ax\right) = y$ löst die Engine nicht),
    Integral gleich Determinante; in einer $2 \times 2$-Determinante keine 0, kein
    Minus vor einem Eintrag, nie derselbe Eintrag zweimal in einer Spalte;
    Teil 8b `buildLevel5Polar` (Anteil 30 % der Nummern aus 7a, als letzte
    Vorlage): Betrag (Bruch mit $x$ oben und unten, $x$ im Real- und Imaginärteil,
    Baustein, fester Faktor, Quadrat, gegen den Realteil, Euler-Form mit $x < \pi$),
    Winkel (Quadrat, fester Faktor mit Standardwinkel, Baustein, $x$ im Real- und
    Imaginärteil, Produkt mit $x$ in beiden Faktoren), Vektoren (Winkel mit einer
    Achse mit $y < \frac{\pi}{2}$, zwischen gleich langen Vektoren, Länge, Skalarprodukt,
    auch $= 0$); jeder Faktor mit $x$ hat Real- und Imaginärteil, beim Winkel einen
    positiven Realteil; $\mathrm{i}$ vor einer Funktion, Wurzel oder e-Funktion vorn
    ($a + \mathrm{i}\ln x$);
    Teil 8c `buildLevel5Theorem` (Anteil 35 % der Nummern aus 7a, als letzte Vorlage,
    immer mit $x < \frac{\pi}{2}$): Additionstheorem gegen $\sin x$ oder $\cos x$ (Beispiel
    aus dem Plan $b\sin(x + a) = y\cos x$), im Bruch damit, Bruch aus zwei
    Additionstheoremen mit verschiedenen Winkeln; $\cos(2x)$ gegen $\sin x$ oder $\cos x$
    (danach quadratisch), im Bruch damit, in einer Summe, gegen $\sin^2 x$ oder
    $\cos^2 x$; $x$ steht nie nur in einem einzigen Additionstheorem; jede Gleichung
    des Rechenwegs und jede falsche Antwort höchstens 21 em breit (in den Antworten
    passen am Handy etwa 23 em), darum keine zwei Additionstheoreme nebeneinander;
    Filter in
    `rearrangeTerms.ts`: Mindestzahl der Umformungen je Stufe, Doppelbrüche
    erst ab Stufe 3, Ergebnis höchstens 90 bzw. ab Stufe 4 120 Zeichen (Stufe
    5: 100, ohne Wurzel aus einer Summe mit Brüchen, mit Buchstaben; Länge der
    Aufgabe mit $\sum$ und $\lim$ so breit wie drei Zeichen, ohne die Zeilen
    der Differentialgleichung, die je höchstens 64 Zeichen haben; Vorlagen mit
    `narrow` (Teil 7c): Ergebnis höchstens 90 Zeichen, keine Wurzel aus mehr
    als drei Summanden, damit es am Handy in eine Zeile passt; Aufgaben mit
    Determinante, Betrag, Winkel, Vektoren oder Additionstheorem nach ihrer Breite, höchstens 12 em,
    geschätzt in `latexWidth.ts` und am Browser kalibriert (auch $\arg$,
    $\sphericalangle$, schmale Betragsstriche), ihr Ergebnis höchstens 16,5 em und
    ohne Doppelbruch; mit Additionstheorem jede Gleichung des Rechenwegs und jede
    falsche Antwort höchstens 21 em, im Ergebnis kein Minus direkt unter der Wurzel
    oder in der Klammer wie $\sqrt{-\frac{a}{y - 2a + b}}$),
    Gegenprobe der Aufgabe an den Prüfstellen), `focus.ts` und `fractionFocus.ts` (Aufgaben für
    gezieltes Üben; Brüche: reihum durch die Stufen, je Runde zwölf Versuche,
    seltene Fehler in ihrer Vorlage `focus`, `likelyFractionTemplate`;
    `PracticePage.tsx` zeigt während der Suche einen Hinweis); Baukasten der Brüche `fractionKit.ts` (Stufen 1 und 2:
    Rechenbaum zufällig aus Teilen, Rechenarten und Bruchteilen, mit
    Filtern gegen zu einfache oder zu lange Aufgaben; Stufen 3 und 4: je
    Aufgabe eine „Welt" aus Klammern, `level3World`/`level4World`, daraus
    Zähler und Nenner, dazu Kürzen `worldReduce` und Doppelbrüche
    `worldComplex`; Stufe 5: alles ineinander `buildLevel5Kit` mit Doppelbruch
    auch im Inneren, Doppelbruch im Doppelbruch `worldNested`,
    Differenzenquotienten `differenceQuotient`, dritte Potenzen `cubeTask`,
    Wurzeln `rootTask`, Bausteine gemischt `blockPairTask`,
    Partialbrüche `partialTask`, komplexe Zahlen `imaginaryTask`,
    Grenzwerte `limitTask`, Teleskopsummen `telescopeTask`; Hyperbelfunktionen
    `hyperbolicTask` in `fractionTerms.ts`; die
    Vorlagen der Stufe 5 haben Anteile
    `weight`, später dazugekommene Vorlagen einen festen Anteil `share`,
    vorweg mit eigenem Zufall gewählt, damit die übrigen Nummern ihre
    Aufgabe behalten); Abwechslung
    `variety.ts` (Form einer Aufgabe `formOfLatex`: Zahlen und Vorzeichen
    zusammengefasst, Buchstaben der Reihe nach benannt, auch in Produkten wie
    $ax$; Kennzahlen
    `varietyStats`; `pickFresh`) und `forms.ts` (Form je Thema;
    Partialbrüche mit eigenem Vorsatz „zerlegen:"; beim Umstellen mit der
    Differentialgleichung, `taskFormLatex`)
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
