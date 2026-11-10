---
paths:
  - "src/engine/tasks/**"
  - "src/engine/random/**"
---

# Notizen: Mathe-Engine – Aufgaben, Vorlagen, Baukästen, Abwechslung

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

Teil der Mathe-Engine `src/engine/` (reines TypeScript, ohne React).

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
    Gegenprobe der Aufgabe an den Prüfstellen), `focus.ts`, `fractionFocus.ts` und
    `rearrangeFocus.ts` (Aufgaben für
    gezieltes Üben, erst beim gezielten Üben geladen, `practice.ts`; Umstellen: reihum durch
    die Stufen, je Runde acht Versuche, seltene Fehler nur in ihrer Vorlage `focus`,
    `likelyRearrangeTemplate`; Brüche: reihum durch die Stufen, je Runde zwölf Versuche,
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
