---
paths:
  - "src/engine/rearrange/**"
  - "src/engine/**/*rearrange*"
---

# Notizen: Mathe-Engine – Gleichungen umstellen

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

Teil der Mathe-Engine `src/engine/` (reines TypeScript, ohne React).

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
    aufgelöst, `unknown`; $ae^{-x}$ wird $\frac{a}{u}$, `reciprocalFolded`, beim
    Malnehmen mit dem Hauptnenner ein Bruch als Vorzahl gekürzt, `termTimes`),
    quadratisch in $u$ oder $x$: alles nach links
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
    einer Seite, die nur noch 0 ist), `task.ts` (Aufgabe, Bedingungen; bei Formeln `context` mit Name und Bedeutung der Zeichen, `conditionsText` dann
    „Alle Größen sind positiv“; mit Differentialgleichungen
    stehen sie je Funktion in einer Zeile über der Gleichung, `givenLatex`,
    `\begin{gathered}`; ohne sie bleibt `taskLatex` wie bisher; `taskFormLatex`
    ohne gathered und ohne den Namen pmatrix)
  - Bausteine und Verzeichnis (M6 Schritt 3, Einzelheiten in `engine-aufgaben.md`): Ändert sich der
    Rechenweg oder eine Vorlage, ändern sich die Bausteine einzelner Nummern; dann
    `node scripts/rearrange-index.ts` laufen lassen (`rearrangeIndex.test.ts` meldet es sonst). Seit Schritt 4
    gehört ein Quadrat wie $x^2$, das die pq-Formel löst, zu „Quadratische Gleichungen“, nicht zu „Quadrate und
    Potenzen“. Die Engine löst noch nicht: Logarithmen auf beiden Seiten mit einer Zahl dazu
    ($\log_2(x - a) = \log_2(b - x) + 1$), verschiedene Basen ($\ln$ und $\log_3$ desselben Terms), Gleichungen nur
    mit Zahlen wie $3\sqrt{x} + 4 = x$, $a x^n = y$ mit Buchstaben als Hochzahl, $\sqrt[3]{\ldots}$ in der Aufgabe,
    eine Wurzel in einer Wurzel als Baustein auf beiden Seiten (geplant in M6 4b, docs/AUFGABENARTEN.md)

