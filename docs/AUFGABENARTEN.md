# Aufgabenarten und Rechenschemata aus der Vorlesung MB1

Stand: 12.11.2026. Der Nutzer hat am 12.11.2026 alle Unterlagen zu „Mathematik
MB1" hochgeladen (Übungsblätter 1 und 2, Übungen 1 bis 4 mit handschriftlichen
Lösungen, Vorlesungsmitschrift mit 53 Seiten) und gewünscht, dass alle
Aufgabenarten und Rechenschemata daraus in die App kommen. Die Unterlagen selbst
liegen nicht im Repo (Urheberrecht, siehe CLAUDE.md). Hier steht in eigenen
Worten, **welche Arten** es gibt, **nach welchem Schema** man sie löst, welche
**Fehler** in den Lösungen vorkamen und **wo** sie in der App hinkommen. Aufgaben
entstehen immer aus der Engine mit eigenen Zahlen; Formen wie „|ax + b| = c“
sind nur Muster.

Spalte „Wohin": M6 = laufender Meilenstein (docs/PLAN-M6.md, Schritt), M7, M9
usw. = spätere Meilensteine (docs/ROADMAP.md).

## Grundlagen

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Wurzelgleichungen mit Zahlen: Wurzel gleich Zahl, Wurzel gleich negative Zahl (keine Lösung), zwei Wurzeln, $a\sqrt{x} + b = x$, Quadrat einer Summe mit $\sqrt{x}$, Wurzel aus einem Betrag | Definitionsbereich (unter der Wurzel ≥ 0), Wurzel allein stellen, quadrieren (bei zwei Wurzeln zweimal), lösen, **Probe in der Ausgangsgleichung** (Scheinlösungen); bei $a\sqrt{x} + b = x$ auch $u = \sqrt{x} \ge 0$ | Probe vergessen, Scheinlösung behalten | M6 4b (mit Buchstaben schon heute) |
| Logarithmische Gleichungen: Logarithmen auf beiden Seiten, Zahl dazu, Faktor vor dem Logarithmus, verschiedene Basen ($\ln$ und $\log_3$ desselben Terms) | Definitionsbereich (Argumente > 0), Faktor als Hochzahl hineinziehen, Zahl als Logarithmus derselben Basis schreiben, zusammenfassen, entlogarithmieren, lineare oder quadratische Gleichung lösen, gegen den Definitionsbereich prüfen; verschiedene Basen über $\log_a b = \frac{\ln b}{\ln a}$ | Zahl nicht als glatten Logarithmus erkannt, früh gerundet, Definitionsbereich nicht geprüft | M6 4b (Engine braucht Logarithmen auf beiden Seiten und Basiswechsel) |
| Betragsgleichungen mit einem oder zwei Beträgen; Lösung eine Zahl, zwei Zahlen, leere Menge oder ein ganzer Halbstrahl | **Fallunterscheidung:** Inhalt jedes Betrags gleich 0 setzen (Fallgrenzen), Zahlengerade in Bereiche teilen (bei zwei Beträgen drei), je Bereich den Betrag durch $+(\ldots)$ oder $-(\ldots)$ ersetzen (ganze Klammer), lösen, gegen die Bedingung des Bereichs prüfen; immer wahr heißt ganzer Bereich, nie wahr heißt keine Lösung; vereinigen. **Kandidaten:** je Betrag beide Vorzeichen, alle Kandidaten in die Ausgangsgleichung einsetzen | Fallgrenze bei 0 statt bei der Nullstelle des Inhalts; nur den ersten Summanden negiert; Minus vor dem Betrag nicht verteilt; Lösung nicht mit dem Bereich verglichen; Probe in der Fallgleichung; „immer wahr“ nicht als Bereich gedeutet; vier statt drei Bereiche | M6 5d |
| Formeln aus Technik und Physik nach einer Größe umstellen (Schwingungsdauer, Kondensator, …) und Doppelbrüche darin auflösen | von außen nach innen umkehren (teilen, quadrieren gegen Wurzel, Kehrwert, Logarithmus gegen Potenz); Doppelbruch: Teilbrüche gleichnamig, mit dem Kehrwert malnehmen, kürzen | – | M6 4b (Größen mit eigenen Zeichen), mit Einheiten M10 |
| Quadratische Terme zerlegen (Vieta) | zwei Zahlen mit Summe $-p$ und Produkt $q$, sonst Nullstellen über die $pq$-Formel | falsche Faktoren, Vorzeichen in der Formel | M6 Schritt 6 (Vereinfachen, Zerlegen) |
| Potenzen und Wurzeln: Term in die Form $a^x$ bringen, negative Hochzahlen beseitigen | Wurzeln als Potenzen, Potenzgesetze, am Ende ohne negative Hochzahl | – | M6 Schritt 6 (Potenz- und Wurzelgesetze) |
| Nenner rational machen | mit der Wurzel erweitern; bei Summen mit dem Gegenstück (dritte binomische Formel) | – | M6 Schritt 6 |
| Logarithmen ohne Rechner aus zwei gegebenen Werten (z. B. $\ln 2$ und $\ln 5$) abschätzen; Basiswechsel | Zahl als Produkt, Quotient oder Potenz der bekannten Zahlen schreiben, Logarithmengesetze; $\log(x + y)$ lässt sich nicht zerlegen | Basiswechsel falsch herum | M6 Schritt 6 (Logarithmengesetze) |
| Mengen: Venn-Diagramme, Zahlenmengen schneiden, Mengen aufzählen, Teilmengen mit Eigenschaften, Sätze in Mengensprache und zurück | Definitionen der Mengenoperationen | – | M9 (Mengen und Summen), Venn-Diagramme mit M6b |
| Summen und Produkte mit $\sum$ und $\prod$ ausrechnen und schreiben | ausschreiben, Indexverschiebung, Teleskopsumme; Bildungsgesetz finden, Vorzeichenwechsel mit $(-1)^k$; Produkt mit einem Faktor 0 | Faktor 0 übersehen | M9 (Mengen und Summen) |

## Funktionen

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Graphen verschieben und strecken: $f(kx + d)$, $a \cdot f(x) + c$ | zwei Wege: markante Punkte umrechnen oder erst ausklammern $f(k(x + \frac{d}{k}))$ | um $d$ statt um $\frac{d}{k}$ verschoben | M6b (Bilder), M9 |
| Schwingungen $A\sin(\omega t + \varphi)$ ablesen und skizzieren | Amplitude, Periode $\frac{2\pi}{\omega}$, Verschiebung $-\frac{\varphi}{\omega}$ | wie oben | M6b, M9 |
| e- und Logarithmusfunktion, Umkehrfunktion, Hyperbelfunktionen, Formeln für Winkelfunktionen (nur Vorlesung) | – | – | Lernkarten und Nachschlagewerk (M12) |

## Polynome (eigene Tätigkeit nach M6)

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Polynome malnehmen | Koeffizientenschema: jede Zeile ein Faktor, Spalten nach Potenzen addieren | – | M9 Polynome |
| Polynomdivision lang und mit dem Horner-Schema (auch für Divisoren zweiten Grades) | Divisor normieren; links die Koeffizienten des Divisors ohne die führende 1 mit umgedrehtem Vorzeichen; spaltenweise addieren, hinter dem Trennstrich nur noch addieren (Rest) | Spaltensumme falsch, hinter dem Trennstrich weitergerechnet, Spalte des Absolutglieds vergessen | M9 Polynome |
| Unbekannte Koeffizienten einer Division bestimmen | ausmultiplizieren, Koeffizientenvergleich | – | M9 Polynome (Klausurniveau) |
| Funktionswert mit dem Horner-Schema | einzeiliges Horner-Schema | – | M9 Polynome |
| Nullstellen und Zerlegung in Linearfaktoren | ausklammern, Teiler des Absolutglieds probieren, mit Horner abspalten, Rest mit $pq$- oder $abc$-Formel, Fundamentalsatz | durch $(x - a)$ geteilt, obwohl $-a$ die Nullstelle ist; $-b$ in der $abc$-Formel | M9 Polynome |
| Interpolation nach Newton mit dividierten Differenzen | Tabelle der dividierten Differenzen, im Nenner die äußersten x-Werte; Polynom aufbauen und ausmultiplizieren; andere Wege: Gleichungssystem, Punkt für Punkt | Nenner aus benachbarten statt äußersten x-Werten | M9 Polynome |

## Differentialrechnung

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Ableitung an einer Stelle mit Einheit deuten (Kosten, Ladung, Geschwindigkeit) | ableiten, einsetzen, Einheit = Einheit der Funktion pro Einheit der Variable, Vorzeichen deuten | Ableitung von $\sin$ als $-\cos$, innere Ableitung, Wert nicht ausgerechnet | M6 Schritt 7 (Ableiten, Anwendungen) |
| Differenzenquotient (h-Methode) | aufstellen, $h$ ausklammern, kürzen, $h \to 0$ | – | M6 Schritt 7 |
| Ableitungsregeln an verschachtelten Termen, auch zweite und dritte Ableitung, andere Variable $t$ | Wurzeln und Brüche als Potenzen, Produkt-, Ketten-, Quotientenregel, Nenner nicht ausmultiplizieren | wie oben | M6 Schritt 7 |
| Logarithmisch ableiten: $f(x)^{g(x)}$, $a^x$, $x^x$ | $f^g = e^{g \ln f}$ und Kettenregel, oder $f' = f \cdot (\ln f)'$ | Potenz- oder e-Regel allein | M6 Schritt 7 |
| Linearisieren und Tangente, Näherungswerte | Stelle $x_0$ wählen (nah, leicht zu rechnen, keine Polstelle), $y = f(x_0) + f'(x_0)(x - x_0)$, einsetzen, mit dem genauen Wert vergleichen | Stelle an einer Polstelle, zu weit weg | M9 (Linearisieren) |

## Grenzwerte

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Grenzwerte für $n \to \infty$ und $x \to \pm\infty$ | erst ausmultiplizieren, wenn sich führende Glieder aufheben; dann die am schnellsten wachsenden Glieder (e-Funktion vor Potenz vor Logarithmus) bzw. höchste Potenz ausklammern; Wurzeln: höchste Potenz herausziehen; Ergebnis Zahl, $\pm\infty$ oder „existiert nicht“ | führende Glieder heben sich auf und wurden nicht ausmultipliziert | M9 Grenzwerte |
| Grenzwerte für $x \to x_0$ | einsetzen; bei $\frac{0}{0}$ kürzen oder mit dem Gegenstück erweitern; L'Hospital nur bei $\frac{0}{0}$ oder $\frac{\infty}{\infty}$, $0 \cdot \infty$ vorher als Bruch; einseitige Grenzwerte | L'Hospital ohne $\frac{0}{0}$ | M9 Grenzwerte |

## Vektoren und lineare Algebra (nur Vorlesung, noch ohne Übungsblatt)

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Vektoren: Summe, Vielfache, Länge, Einheitsvektor | – | durch Vektoren teilen oder Vektoren kürzen | M7 |
| Skalarprodukt, Winkel, Zerlegung parallel und senkrecht | $\vec a_\parallel = \frac{\vec a \cdot \vec b}{\lvert\vec b\rvert^2}\vec b$ | – | M7 (Länge, Skalarprodukt, Winkel schon als Baustein beim Umstellen) |
| Kreuzprodukt, Dreiecksfläche, Normalenvektor, Spatprodukt, Volumen | Schema mit Determinante, Fläche $\frac{1}{2}\lvert\vec a \times \vec b\rvert$ | – | M7 |
| Linearkombination prüfen, lineare Unabhängigkeit, Basis, Dimension | Gleichungssystem, Zeilenumformungen | – | M7 |
| Projektion auf eine Ebene | Normalgleichungen | – | M7 |
| Matrizen: rechnen, Falk-Schema, Einheitsmatrix, Gleichungssystem als $A\vec x = \vec b$, Inverse | Falk-Schema, Gauß | – | M7 |

## Stand der Umsetzung

- M6 Schritt 4 (12.11.2026): Gleichungen umstellen mit Buchstaben, je Baustein ab Stufe 1;
  darunter schon die Arten aus den Unterlagen, die mit Buchstaben gehen: Wurzel in
  Wurzel, zwei Wurzeln, zwei Logarithmen derselben Basis, $x$ und $\sqrt{x}$ (mit
  „Quadratische Gleichungen"), Formeln wie Schwingungsdauer (Engine kann sie schon,
  Aufgaben dazu kommen in 4b).
- Alles Übrige ist in docs/PLAN-M6.md (4b, 5d, 6, 7) und docs/ROADMAP.md (M7, M9)
  eingeplant.
