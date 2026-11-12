---
paths:
  - "src/engine/*.ts"
  - "src/engine/expr/**"
  - "src/engine/derive/**"
  - "src/engine/check/**"
  - "src/engine/parse/**"
  - "src/engine/explain/**"
---

# Notizen: Mathe-Engine – Terme, Ableiten, Prüfen, Einlesen, Texte

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

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
    `simplify` = Normalform als *Anzeigeform* (schöne Schreibweise). Seit M6
    Schritt 4c bleibt eine ungerade Wurzel in der Normalform eine Wurzel
    (`makeOddRoot`: Faktoren einzeln, $(\sqrt[3]{u})^k$ mit ganzen Potenzen
    herausgezogen, Zahlen exakt mit `ratRoot`); $u^{p/q}$ mit ungeradem $q$ wird
    dazu umgekehrt zur Wurzel, feste Werte ohne Buchstaben bleiben Potenzen;
    die Anzeige schreibt $(\sqrt[3]{u})^2$ als $\sqrt[3]{u^2}$
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
    verständlichen Fehlermeldungen; Größen mit Index (`U_0`, `U_{0}` → Name `U_0`, mehrere Zeichen
    `R_{12}`) und griechische Buchstaben als Größen (`GREEK`, Name `\lambda`, auch ohne Klammer nach
    $\sin$), so geschrieben, wie `print.ts` sie ausgibt (M6 Schritt 4b-1); `latexChecks.ts` zählt eine
    Ziffer im Index nicht als Faktor
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
    Logarithmus", „Logarithmus- und Potenzgesetze", „Logarithmen auf beiden Seiten" (M6 4b-2, Stufe 1), „Umkehrfunktionen",
    „Winkel- und Hyperbelfunktionen", „Substitution", „$pq$-Formel"; Stufe 5:
    „Stammfunktionen und Partialbrüche", „Geometrische Summe und Reihe",
    „Grenzwert $\left(1 + \frac{x}{n}\right)^n \to e^x$",
    „Differentialgleichungen $f' = kf$ und $f'' = k^2 f$", „Determinanten",
    „Betrag und Winkel komplexer Zahlen", „Vektoren: Länge, Skalarprodukt, Winkel",
    „Additionstheoreme"),
    durchgerechnete Beispiele in `rearrangeExample.ts`
  - Freier Modus bei Gleichungen mit Zahlen (M6 Schritt 4b-3, `checkNumberAnswer` in `check/rearrangeAnswer.ts`): eine
    Zahl oder „Keine Lösung“ (Knopf, Eingabe `NO_SOLUTION_INPUT` aus `check/freeTask.ts`, `FreeTask.noSolution`); eine von
    der Probe verworfene Zahl ist `eq-spurious-root` mit Erklärung `PROBE_WHY.kept`; „Keine Lösung“, obwohl es eine gibt,
    bzw. eine Zahl, obwohl es keine gibt: Hinweis auf die Probe, ohne die Lösung zu verraten