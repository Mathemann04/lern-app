---
paths:
  - "src/engine/fraction/**"
  - "src/engine/**/*fraction*"
---

# Notizen: Mathe-Engine – Brüche

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

Teil der Mathe-Engine `src/engine/` (reines TypeScript, ohne React).

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
