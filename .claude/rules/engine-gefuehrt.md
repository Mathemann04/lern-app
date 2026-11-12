---
paths:
  - "src/engine/guided/**"
  - "src/engine/errorCatalog.ts"
  - "src/ui/guided/**"
---

# Notizen: Mathe-Engine – Schrittplaner für den geführten Modus

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

Teil der Mathe-Engine `src/engine/` (reines TypeScript, ohne React).

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
    doppelten Winkel nur „mit dem einfachen Winkel" (nicht die Funktion, die danach
    allein dasteht: das verriete zwei falsche Antworten), mit Tipp je Funktion,
    Erklärung mit $\alpha$ und $\beta$ und „Warum ist das falsch?" mit genau der Regel
    der Aufgabe, `theoremQuestion`, `theoremHint`, `theoremExplanation`, `theoremWhy`);
    nach der $pq$-Formel „Welche der beiden Lösungen passt?" mit der
    Scheinlösung als falscher Antwort und dem Grund (`rejectReason`); nach dem
    Substituieren sprechen Fragen von $u$ (`step.unknown`);
    ist √x oder ein Baustein wie $e^x$ die Unbekannte, sprechen
    Fragen und Antworten davon, `unknownOf`; Bedingung des Ergebnisses wie „Gilt für
    $a \neq c$."; Logarithmen auf beiden Seiten (M6 4b-2): Weichen mit eigener Frage und Irrwegen für Basiswechsel,
    Faktor als Hochzahl, Zahl als Logarithmus und Entlogarithmieren, Lernkarte `rearrange-log-equation`). Gemeinsame Typen in `guided/types.ts`
  - `errorCatalog.ts`: typische Fehler aller Themen mit Namen, je Thema
  - Gleichungen mit Zahlen (M6 Schritt 4b-3): Schritt `probe` als „Setze $x = 4$ in die Gleichung der Aufgabe ein. Ist es
    eine Lösung?“ mit Ja / Nein: Scheinlösung / Nein: nicht im Definitionsbereich (`probeStep`; „Ja“ bei einer verworfenen
    Zahl ist `eq-spurious-root`, die anderen falschen Gründe nur mit `PROBE_WHY`), unter „Bisher“ „$x = 0$ entfällt“;
    `rootNegative` als „Wie geht es weiter?“ mit „Keine Lösung“, „Beide Seiten quadrieren“ (`eq-root-negative-squared`) und
    „Das Minus weglassen“; am Ende steht das Ergebnis bzw. $\mathbb{L} = \{\,\}$ unter „Bisher“; Lernkarte
    `rearrange-number-equation`