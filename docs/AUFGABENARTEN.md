# Aufgabenarten und Rechenschemata aus der Vorlesung MB1

Stand: 12.11.2026, zweite Fassung nach der großen Sichtung.

**Quellen:** Der Nutzer hat am 12.11.2026 zweimal Unterlagen zu „Mathematik MB1“
hochgeladen:
- **Erste Runde:** Übungsblätter 1 und 2, Übungen 1 bis 4 mit Lösungen, Vorlesungsmitschrift.
- **Zweite Runde (gut 80 Dateien):**
  - die Skript-Kapitel 1 und 3 bis 8, teils mit handschriftlichen Notizen
  - die Übungen 1 bis 6 des laufenden Semesters mit Lösungen
  - eine ältere Reihe von 14 Übungsblättern mit Lösungen
  - die Tests zu den Kapiteln 2 bis 8
  - 16 echte Altklausuren aus den Jahren 2015 bis 2026 und 10 Probe- und Übungsklausuren
  - einige Aufgabensammlungen (Ableitungen, Umkehrfunktionen, 4×4-Determinanten,
    Winkelgleichungen, Potenzen)

Alles wurde vollständig durchgesehen, große Teile von Helfern.

**Regeln dieser Datei:** Die Unterlagen selbst liegen nicht im Repo (Urheberrecht, siehe CLAUDE.md).
Hier steht in eigenen Worten:
- **welche Arten** von Aufgaben es gibt
- **nach welchem Schema** man sie löst
- welche **Fehler** typisch sind (aus Lösungen, Randnotizen und dem Aufbau der Aufgaben)
- **wo** sie in der App hinkommen

Aufgaben entstehen immer aus der Engine mit eigenen Zahlen. Formen wie
„$\lvert ax + b\rvert = c$“ sind nur Muster.

Spalte „Wohin“: M6 = laufender Meilenstein (docs/PLAN-M6.md, Schritt), M7, M9 usw. = spätere
Meilensteine (docs/ROADMAP.md), M12 = Nachschlagewerk, M6b = Bilder.

## Die Klausur: Aufbau und Gewicht

Die echten Klausuren seit 2015 sind fast jedes Jahr gleich gebaut:
- 100 Punkte in 10 bis 12 Aufgaben, für 1,0 etwa 90 Punkte
- kein Taschenrechner (spätestens seit 2018/19), darum gehen alle Ergebnisse exakt auf
  (Brüche, Wurzeln, ln, $\pi$)
- erlaubt sind eine Formelsammlung und 5 handgeschriebene Blätter
- ein Ergebnis ohne Rechenweg gibt keine Punkte
- Zwischenergebnisse stehen oft „zur Kontrolle“ dabei (f', f'', Determinante), damit
  Folgefehler nicht durchschlagen

Etwa die Hälfte der Punkte ist Analysis, die andere Hälfte lineare Algebra und Geometrie.

**Die elf Bausteine und wie oft sie vorkamen** (Zählung über die neun Klausuren 2015 bis 2026
mit lesbarem Text; die übrigen sieben bestätigen das Bild):

| Baustein | Häufigkeit | Punkte | Was genau |
| --- | --- | --- | --- |
| Gebrochen-rationale Funktion untersuchen | 9/9 | 9–12 | Definitionslücken mit Art und Ordnung, Nullstellen mit Ordnung, Asymptoten (oft schräg), Vorzeichenschema, Skizze |
| Funktion aus einem Graphen ablesen | 7/9 | 4–5 | meist $A\cos(\omega x + \varphi) + b$ (Ruhelage, Amplitude, Periode, Kreisfrequenz, Phasenwinkel, Laufzeitdifferenz), einmal $r\arctan(x - a) + b$ |
| Umkehrfunktion mit Definitions- und Wertebereich | 5/9 | 3–5 | oft mit Parameter; Funktionen wie $\frac{c}{a + b\,e^{\pm x}}$ oder $\ln(\ldots)$ mit Verschieben und Spiegeln skizzieren, Monotonie zeigen |
| Drei verschachtelte Ableitungen | 9/9 | 9–10 | „Vereinfachen nicht verlangt“; mit arctan, arcsin, tan, ln, Wurzeln, $e^{\ldots}$; Konstanten wie $\ln 3$, $\pi^2$, $x^{e}$ als Falle |
| Tangenten | 9/9 | 4–8 | waagrechte Tangente (mit Art des Extremums), Tangente durch einen Punkt außerhalb (Berührstelle gesucht), parallele Tangenten zweier Funktionen |
| Kurvendiskussion einer e- oder ln-Funktion | 9/9 | 11–15 | Definitionsbereich, Nullstellen, Randverhalten mit Begründung, f' (oft nachweisen), Monotonie, Extrema, Krümmung, Wendepunkte, Wertemenge, Skizze |
| Grenzwert mit L'Hospital | 9/9 | 4 | $\frac{0}{0}$ mehrfach, $0 \cdot \infty$, $\infty - \infty$, einseitig, Stelle ungleich 0 |
| Inverse einer 3×3-Matrix | 9/9 | 6–7 | Gauß-Jordan |
| Vektoren mit Parameter | 9/9 | 9–12 | Winkel, Vektoren gegebener Länge senkrecht zu zwei Vektoren (±), Dreiecksfläche, orthogonal/spitz/stumpf je nach Parameter, komplanar, Spat- oder Tetraedervolumen (Betrag, zwei Lösungen), Projektion |
| Lineares Gleichungssystem mit Parameter | 9/9 | 7–11 | wann eindeutig lösbar (Determinante), Lösungsmenge für Sonderwerte, Rang, Lösung mit vorgegebener Komponente, teils zwei Parameter, Cramer für eine Unbekannte |
| Geraden und Ebenen | 9/9 | 5–12 | Lage zweier Geraden (oft mit Parameter), Abstand Punkt–Ebene, Punkt–Gerade, zwischen zwei Geraden; Ebene aufstellen; Schnitt Gerade–Ebene |
| Matrizen | 9/9 | 8–12 | „Welche Ausdrücke sind definiert? Berechne sie.“ (Formate, Transponierte, det, Inverse, Fallen wie Inverse einer nicht quadratischen Matrix); Matrizengleichung erst allgemein nach $X$ auflösen |
| Determinante mit Parameter | 9/9 | 6–7 | 4×4, zweimal 5×5, nach Zeilen mit vielen Nullen entwickeln; dann $\det(\lambda A) = \lambda^n \det A$, $\det A^{\mathsf T}$, $\det A^{-1}$, $\det(A^k)$, Invertierbarkeit, Spalten linear abhängig |

**Selten oder nur früher in der Klausur:**
- einmal (2018/19) ein Taylorpolynom 3. Grades mit Näherungswert
- in den Klausuren und Übungsklausuren 2012/13 (damals sechs Aufgaben zu je 20 Punkten, mit
  Taschenrechner):
  - implizites Ableiten mit Tangente
  - Stetigkeit und Differenzierbarkeit stückweiser Funktionen, Parameter so wählen, dass die
    Funktion glatt ist
  - Partialbruchzerlegung
  - Gleichungen mit ln, e und Beträgen
  - Winkelgleichungen
  - Potenzterme vereinfachen

**Nie in der Klausur:** komplexe Zahlen, Mengen, Summenzeichen, Horner-Schema,
Interpolation, Integrale.

Diese Themen kommen trotzdem in den Übungen vor und sind Grundlage für den Rest.

**Probeklausuren** haben denselben Aufbau, decken die echte Klausur aber nicht ganz ab.
Ein Beispiel: Die Probe vor 2018/19 hatte weder das Taylorpolynom noch die Frage
„waagrechte Tangente oder Extremum“.

**Ziel in der App:** eine Probeklausur Mathe wie bei Chemie, aus genau diesen Bausteinen,
ohne Taschenrechner, mit Kontrollwerten. Eingeplant als M13 direkt nach M7 (Wunsch des Nutzers, 14.11.2026:
„der wichtigste Punkt“), zusammen mit den Bausteinen, die noch fehlen (docs/ROADMAP.md).

## Das laufende Semester (WS 26/27)

| Übung | Themen |
| --- | --- |
| 1 | Logarithmische Gleichungen (auch zwei Basen), Logarithmen aus zwei bekannten Werten abschätzen, Betragsgleichungen mit einem und zwei Beträgen |
| 2 | Polynome malnehmen, zerlegen, Horner-Schema (Divisoren 2. und 3. Grades), unbekannte Koeffizienten, mehrfache Nullstellen; Graphen verschieben, strecken, spiegeln; Schwingungen skizzieren und ablesen |
| 3 | Interpolation (Newton, in der Lösung auch Lagrange), Ableitung mit Einheit deuten, Ableitungsregeln |
| 4 | Logarithmisch ableiten, Quotientenregel mit Kürzen, Linearisieren, Grenzwerte ($n \to \infty$, $x \to x_0$, L'Hospital) |
| 5 | Vektoren: Summe, Länge, Verbindungsvektor, Mittelpunkt, Vektor gegebener Länge, Zerlegung parallel und senkrecht (auch in 5 Dimensionen), Dreiecksfläche, Skalar- und Spatprodukt, Winkel |
| 6 | Linearkombination prüfen, Dimension und Basis, Projektion auf den Spann zweier Vektoren, Matrizenprodukte „wenn möglich“ mit Transponierten |

Die Vorlesung ist damit bei Vektoren und Matrizen. Nach Skript und älteren Blättern folgen
Geraden und Ebenen, Matrizen, Determinanten, Gleichungssysteme, dann Funktionen (Kapitel 4
und 5) und die Anwendungen der Ableitung (L'Hospital, Kurvendiskussion).

## Grundlagen

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Wurzelgleichungen mit Zahlen: Wurzel gleich Zahl, Wurzel gleich negative Zahl (keine Lösung), zwei Wurzeln, $a\sqrt{x} + b = x$, Quadrat einer Summe mit $\sqrt{x}$, Wurzel aus einem Betrag | Definitionsbereich (unter der Wurzel ≥ 0), Wurzel allein stellen, quadrieren (bei zwei Wurzeln zweimal), lösen, **Probe in der Ausgangsgleichung** (Quadrieren ist nur „⇒“); bei $a\sqrt{x} + b = x$ auch $u = \sqrt{x} \ge 0$ | Probe vergessen, Scheinlösung behalten; durch einen Term mit $x$ geteilt statt ausgeklammert (Lösung verloren) | M6 4b |
| Logarithmische Gleichungen: Logarithmen auf beiden Seiten, Zahl dazu, Faktor vor dem Logarithmus, verschiedene Basen | Definitionsbereich (Argumente > 0), Faktor als Hochzahl hineinziehen, Zahl als Logarithmus derselben Basis schreiben, zusammenfassen (nur „⇒“, der Definitionsbereich wird größer), entlogarithmieren, lösen, **gegen den Definitionsbereich prüfen**; verschiedene Basen über $\log_a b = \frac{\ln b}{\ln a}$ | Zahl nicht als glatten Logarithmus erkannt, früh gerundet, Definitionsbereich nicht geprüft; $\log(x + y)$ zerlegt; $\frac{\ln a}{\ln b}$ als $\ln\frac{a}{b}$ | M6 4b |
| **Exponentialgleichungen** | gleiche Basis: Hochzahlen gleichsetzen; verschiedene Basen: beide Seiten logarithmieren, $x$ ausklammern, oder nach Basen sortieren und $\left(\frac{a}{b}\right)^x$ bilden; gemeinsame Potenz ausklammern ($a^{x+k} + a^x$); $e^x$ und $e^{-x}$: mit $e^x$ malnehmen, $u = e^x$, quadratische Gleichung, $u \le 0$ verwerfen; Form „Zahl mal $(1 - e^{kx})$ = c“: e-Term allein stellen, dann ln; Satz vom Nullprodukt | $u \le 0$ behalten; Faktor wie $e^{-x} + 1$ gleich 0 gesetzt; ln einer Summe zerlegt | M6 4b |
| Anwendungen mit e und ln: Halbwertszeit, Zerfallskonstante, Verdopplungszeit, Zeit bis zu einem Prozentsatz, Abkühlung, Sättigung, Zuverlässigkeit, Dezibel, Zinseszins | Modell aufschreiben, Bedingung einsetzen, nach der Größe im Exponenten umstellen (ln) | Prozentsatz statt Anteil eingesetzt, Vorzeichen im Exponenten | M6 4b (Formelsammlung), mit Einheiten M10 |
| Betragsgleichungen und -ungleichungen mit einem oder zwei Beträgen; Lösung eine Zahl, zwei Zahlen, leere Menge oder ein ganzer Halbstrahl | **Fallunterscheidung:** Inhalt jedes Betrags gleich 0 setzen (Fallgrenzen), Zahlengerade in Bereiche teilen, je Bereich den Betrag durch $+(\ldots)$ oder $-(\ldots)$ ersetzen (ganze Klammer), lösen, gegen die Bedingung des Bereichs prüfen; immer wahr heißt ganzer Bereich, nie wahr heißt keine Lösung; vereinigen. **Kandidaten:** je Betrag beide Vorzeichen, alle in die Ausgangsgleichung einsetzen | Fallgrenze bei 0 statt bei der Nullstelle des Inhalts; nur den ersten Summanden negiert; Minus vor dem Betrag nicht verteilt; Lösung nicht mit dem Bereich verglichen; „immer wahr“ nicht als Bereich gedeutet; < und ≤ an der Fallgrenze vertauscht; $\sqrt{c^2} = c$ statt $\lvert c\rvert$ | M6 5d |
| Mengen am Zahlenstrahl als Intervall schreiben, einfache Ungleichungen ($\lvert x\rvert < c$, $\lvert x\rvert > c$, quadratische Ungleichung) | „und“ ergibt den Schnitt, „oder“ die Vereinigung; $\lvert x\rvert < c$ ist ein Band um 0, $\lvert x\rvert > c$ zwei Halbstrahlen; beim Malnehmen mit einer negativen Zahl dreht sich das Zeichen | Klammer bei $\infty$ geschlossen; Rand falsch ein- oder ausgeschlossen; Zeichen nicht gedreht; Grenzfälle (Betrag ≤ negative Zahl: keine Lösung) | M6 5d oder M9 |
| Formeln aus Technik und Physik nach einer Größe umstellen und Doppelbrüche darin auflösen | von außen nach innen umkehren; Doppelbruch: Teilbrüche gleichnamig, mit dem Kehrwert malnehmen, kürzen; beim Wurzelziehen ± beachten | – | M6 4b-1 (fertig), mit Einheiten M10 |
| Quadratische Terme zerlegen (Vieta), Scheitelform durch quadratisches Ergänzen, Zahl der Nullstellen über die Diskriminante | zwei Zahlen mit Summe $-p$ und Produkt $q$, sonst $pq$- oder $abc$-Formel; Ergänzen auch bei negativem oder gebrochenem Leitkoeffizienten | falsche Faktoren, Vorzeichen in der Formel; Buchstaben der Normal- und der Scheitelform verwechselt | M6 Schritt 6 |
| Potenzen und Wurzeln: Term in die Form $a^x$ bringen, negative Hochzahlen beseitigen, wissenschaftliche Schreibweise, $x^n = a$ lösen | Wurzeln als Potenzen, Potenzgesetze; bei geradem $n$ zwei Lösungen, bei ungeradem eine | Regel für $a^n + b^n$ oder $a^n b^m$ erfunden; $(a + b)^2 = a^2 + b^2$; $\sqrt{c^2} = c$ | M6 Schritt 6 |
| Nenner rational machen | mit der Wurzel erweitern; bei Summen mit dem Gegenstück (dritte binomische Formel); bei höheren Wurzeln passende Potenz ergänzen | – | M6 Schritt 6 |
| Logarithmen ohne Rechner: Wert im Kopf (Argument als Potenz der Basis, auch Bruch und Wurzel), aus zwei gegebenen Werten abschätzen, als Summe schreiben, zu einem Logarithmus zusammenfassen, Vorzeichen deuten | Logarithmengesetze, Basiswechsel; $\ln x < 0$ für $x < 1$ | Basiswechsel falsch herum; $\log(x + y)$ zerlegt; Vorzeichen bei ln eines Bruchs kleiner 1 | M6 Schritt 6 |
| Mengen: Beziehungen (Teilmenge, gleich, mehrere zugleich), Schnitt, Vereinigung, Differenz, Produktmenge $A \times B$, Venn-Diagramme, Zahlenmengen, Sätze in Mengensprache | Definitionen, Rechengesetze | $A \setminus B = B \setminus A$ angenommen; Reihenfolge im Paar; ausschließendes Oder | M9 (Mengen und Summen), Venn mit M6b |
| Summen und Produkte mit $\sum$ und $\prod$, Fakultät | ausschreiben, Indexverschiebung (Grenzen mitverschieben), Teleskopsumme, konstanter Summand (Zahl der Summanden), Startindex ≤ 0; Bildungsgesetz finden, $(-1)^k$; leere Summe 0, leeres Produkt 1, $0! = 1$ | Faktor 0 übersehen; Summanden falsch gezählt; $(-1)^k$ und $(-1)^{k+1}$ vertauscht | M9 (Mengen und Summen) |
| Trigonometrie: Grad und Bogenmaß, besondere Werte mit Vorzeichen je Quadrant, Additionstheoreme, Doppelwinkel, $\sin^2 + \cos^2 = 1$, $1 + \tan^2 = \frac{1}{\cos^2}$, Sinus- und Kosinussatz | Einheitskreis, Symmetrien | $\sin^2 x$ mit $\sin(x^2)$ verwechselt; Rechner auf Grad statt Bogenmaß | Aufgaben M9 (mit M6b), Formeln M12 |

## Funktionen

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Maximaler Definitionsbereich (Nenner, Wurzel, ln, Wurzel im Nenner, ln eines Betrags) | jede Bedingung aufschreiben (Nenner ≠ 0, Radikand ≥ 0, Argument > 0), Ungleichungen lösen (oft quadratisch), alles schneiden | ≥ statt > beim ln; Nennerbedingung vergessen; Zeichen nicht gedreht | M9 (Funktionen), Teile schon in M6 |
| Wertemenge | über Scheitel, Asymptoten, Monotonie oder den ausgeschlossenen Wert der Umkehrfunktion | – | M9 |
| Symmetrie prüfen | $f(-x)$ bilden und mit $f(x)$ und $-f(x)$ vergleichen; „weder noch“ mit einem Zahlenbeispiel belegen | nur auf gerade geprüft; Absolutglied übersehen | M9 |
| Umkehrfunktion berechnen (auch mit Parameter) mit Definitions- und Wertebereich | Umkehrbarkeit (streng monoton), nach $x$ auflösen, $x$ und $y$ tauschen; Definitions- und Wertebereich tauschen die Rollen; Graph an $y = x$ spiegeln; bei Hyperbelfunktionen $u = e^x$ und die negative Lösung verwerfen | $x$ und $y$ nicht getauscht; ausgeschlossenen Wert übersehen; beide Vorzeichen der Wurzel behalten | M6 4b (mit der Umstell-Engine), Graph M6b |
| Graphen verschieben, strecken, spiegeln: $a \cdot f(kx + d) + c$, $f(-x)$, $-f(x)$, $\lvert f(x)\rvert$; Graph aus einem Grundgraphen entwickeln (z. B. $\frac{c}{1 - e^{x}}$ aus $e^x$) | markante Punkte umrechnen oder erst ausklammern $f(k(x + \frac{d}{k}))$; Betrag: Teil unter der x-Achse spiegeln | um $d$ statt um $\frac{d}{k}$ verschoben; $x + a$ als Verschiebung nach rechts | M6b, M9 |
| Schwingungen $A\sin(\omega t + \varphi)$ bzw. $A\cos(\omega t + \varphi) + b$ ablesen und skizzieren; Sinus- und Kosinusform ineinander umrechnen; $a\cos\omega t + b\sin\omega t$ in eine Kosinusform bringen; gedämpfte Schwingung | Ruhelage $b$, Amplitude, Periode $\frac{2\pi}{\omega}$, Phasenwinkel, Laufzeitdifferenz $\frac{\varphi}{\omega}$ (Verschiebung nach links), Maximum aus $\omega t + \varphi = 0$; Umrechnung $A = \sqrt{a^2 + b^2}$ | Verschiebung $\varphi$ statt $\frac{\varphi}{\omega}$; arccos liefert nur Werte in $[0, \pi]$, Vorzeichen von $b$ übersehen | **Klausur:** Aufgabe „Graph ablesen“ mit M6b; Umrechnung M9 |
| Winkelgleichungen in $[0, 2\pi]$: $\sin x = a$, verschobene Argumente, quadratisch in sin oder cos, $\sin^2$ durch $1 - \cos^2$ ersetzen, Doppelwinkel, mit tan | Grundlösung mit arcsin, arccos, arctan, **zweite Lösungsschar**, $+2k\pi$, passende Werte auswählen; Substitution, $\lvert u\rvert > 1$ verwerfen; **ausklammern statt durch sin teilen**; bei tan Definitionsbereich | zweite Schar vergessen; durch $\sin x$ geteilt; Werte außerhalb des Intervalls | M9 (Funktionen und Schwingungen) |
| Arcus-Werte genau: $\arcsin$, $\arctan$ besonderer Werte, $\arcsin(\sin u)$ außerhalb des Hauptbereichs, $\tan(\arcsin a)$ | Hauptbereiche, Pythagoras mit Vorzeichen | $\arcsin(\sin u) = u$ angenommen; $\cos^{-1}$ als $\frac{1}{\cos}$ | M9 |
| Funktionstypen kennen: Potenz-, Wurzel-, e-, ln-, Winkel-, Arcus-, Hyperbelfunktionen (Definitionsbereich, Wertebereich, Nullstellen, Asymptoten, Symmetrie, Periode), Kettenlinie, logarithmische Achsen | Tabellen | – | Lernkarten und M12, Auswahlaufgaben M9 |
| Stückweise Funktionen, Stetigkeit | an der Nahtstelle linker Grenzwert, rechter Grenzwert und Funktionswert vergleichen; Parameter so wählen, dass die Funktion stetig ist (eine Gleichung je Nahtstelle); Betrag, Signum als stückweise Funktion | Seiten vertauscht; Nullstelle eines Abschnitts behalten, die nicht im Abschnitt liegt | M9 |
| Geradengleichungen und Funktionsterm aus Punkten (Gerade, Parabel durch drei Punkte) | Punkt-Steigung, zwei Punkte, parallel, senkrecht ($-\frac{1}{m}$); Parabel: Gleichungssystem | senkrechte Steigung $-m$ statt $-\frac{1}{m}$ | M9, Parabel mit Gauß in M7 |

## Polynome und gebrochen-rationale Funktionen

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Polynome malnehmen | Koeffizientenschema: jede Zeile ein Faktor, Spalten nach Potenzen addieren | – | M9 Polynome |
| Polynomdivision lang und mit dem Horner-Schema (Divisoren 2. und 3. Grades) | erst nach Potenzen sortieren, fehlende mit 0; Divisor normieren; links die Koeffizienten des Divisors ohne die führende 1 mit umgedrehtem Vorzeichen; hinter dem Trennstrich nur noch addieren (Rest) | Spaltensumme falsch, hinter dem Trennstrich weitergerechnet, Spalte des Absolutglieds vergessen | M9 Polynome |
| Unbekannte Koeffizienten einer Division bestimmen | Koeffizientenvergleich oder rückwärts im Horner-Schema ergänzen | – | M9 Polynome |
| Funktionswert mit dem Horner-Schema | einzeiliges Horner-Schema | – | M9 Polynome |
| Nullstellen und Zerlegung in Linearfaktoren, mehrfache Nullstellen | ausklammern, Teiler des Absolutglieds probieren, mit Horner abspalten (bei mehrfacher Nullstelle wiederholen), Rest mit $pq$- oder $abc$-Formel; biquadratisch substituieren; doppelte Nullstelle ist auch Nullstelle von $p'$ | durch $(x - a)$ geteilt, obwohl $-a$ die Nullstelle ist; $-b$ in der $abc$-Formel | M9 Polynome |
| Polynom mit vorgegebenen Nullstellen bauen; Polynom skizzieren | $c \cdot \prod (x - x_i)$; Verhalten für $\lvert x\rvert \to \infty$ aus dem Leitterm (vier Fälle); Vorzeichenwechsel nur bei ungerader Vielfachheit | – | M9 Polynome, Bild M6b |
| Interpolation nach Newton (dividierte Differenzen), auch Lagrange | Tabelle, im Nenner die äußersten x-Werte; Polynom aufbauen und ausmultiplizieren | Nenner aus benachbarten statt äußersten x-Werten | M9 Polynome |
| **Gebrochen-rationale Funktion untersuchen** (Klausur, jedes Jahr) | 1. Zähler und Nenner zerlegen (Nenner oft verkleidet: ausmultiplizierte dritte Potenz, versteckter gemeinsamer Faktor); 2. **Definitionsbereich aus der ungekürzten Form**; 3. kürzen; 4. Nullstellen aus dem gekürzten Zähler mit Ordnung, nur wenn im Definitionsbereich; 5. **hebbare Lücke** (verschwindet nach dem Kürzen, Wert der gekürzten Form), **Pol** mit Ordnung (Vorzeichenwechsel nur bei ungerader Ordnung); 6. Achsenabschnitt; 7. Asymptote: Zählergrad < Nennergrad → $y = 0$, gleich → Quotient der Leitkoeffizienten, um 1 größer → schräge Gerade aus der Polynomdivision; 8. Vorzeichenschema mit Nullstellen **und** Polen; 9. Skizze | Definitionsbereich aus der gekürzten Form; hebbare Lücke als Pol; Nullstelle außerhalb des Definitionsbereichs behalten; Pol im Vorzeichenschema vergessen; Ordnung vor dem Kürzen gezählt | **eigene Tätigkeit „Funktion untersuchen“** (M9, geführt in Teilschritten), Skizze mit M6b |
| Umkehraufgabe: Funktion mit gegebenen Polen, Nullstellen und Asymptoten angeben | Faktoren bauen, Grad passend wählen | – | M9 (Stufe 5) |
| Partialbruchzerlegung (Übungsklausuren bis 2015; in der App schon bei Brüchen Stufe 5) | erst Polynomdivision, Nenner zerlegen, Ansatz (auch doppelte Nullstelle, quadratischer Faktor ohne Nullstelle), Koeffizientenvergleich oder Einsetzen | – | vorhanden (M2b), ggf. M9 |

## Differentialrechnung

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Ableitungsregeln an verschachtelten Termen (Klausur: drei Funktionen, Vereinfachen nicht verlangt), auch zweite und dritte Ableitung, andere Variable $t$ | **vorher umformen:** Wurzeln und Brüche als Potenzen, Bruch mit Einzelnenner aufteilen, ln von Produkt, Quotient, Potenz und Wurzel erst zerlegen, $\ln(e^{\ldots})$ vereinfachen; dann Produkt-, Ketten-, Quotientenregel; Nenner nicht ausmultiplizieren; Bausteine arcsin, arccos, arctan, tan ($\tan' = 1 + \tan^2$), sinh, cosh | **Konstanten** wie $\ln 3$, $\pi^2$, $e^{\pi}$, $\arctan\sqrt{\pi}$ wie $x$ abgeleitet (Ableitung ist 0, Faktor bleibt); $x^{e}$ falsch; $\sin(x^2)$ mit $\sin^2 x$ verwechselt; Ableitung von $\sin$ als $-\cos$; innere Ableitung vergessen; Vorzeichen im Zähler der Quotientenregel | M6 Schritt 7 (Arcus- und tan-Bausteine prüfen) |
| Logarithmisch ableiten: $f(x)^{g(x)}$, $a^x$, $x^x$ | $f^g = e^{g \ln f}$ und Kettenregel, oder $f' = f \cdot (\ln f)'$ | Potenz- oder e-Regel allein | M6 Schritt 7 |
| Ableitung an einer Stelle mit Einheit deuten (Kosten, Ladung, Geschwindigkeit); Weg, Geschwindigkeit, Beschleunigung | ableiten, einsetzen, Einheit = Einheit der Funktion pro Einheit der Variable, Vorzeichen deuten | Wert nicht ausgerechnet | M6 Schritt 7 |
| Differenzenquotient (h-Methode) | aufstellen, $h$ ausklammern, kürzen, $h \to 0$ | – | M6 Schritt 7 |
| **Tangenten** (Klausur, jedes Jahr) | Tangente: $y = f(x_0) + f'(x_0)(x - x_0)$. **Waagrecht:** $f'(x) = 0$ lösen (oft mit e mal cos, dann tan, oder Quotient aus Quadraten). **Durch einen Punkt $P$ außerhalb:** Berührstelle $x_0$ unbekannt, $P$ in die Tangentengleichung einsetzen, nach $x_0$ lösen (meist zwei Lösungen). **Parallele Tangenten zweier Funktionen:** $f'(x) = g'(x)$. **Parameter so wählen**, dass eine Tangente durch einen Punkt geht | waagrechte Tangente sofort als Extremum gemeldet (doppelte Nullstelle von $f'$ ist ein Sattelpunkt); $P$ für den Berührpunkt gehalten | M6 Schritt 7 oder M9 (Stufe 4–5) |
| **Kurvendiskussion** (Klausur, jedes Jahr; Funktionen wie $(x + c)e^{kx}$, $x^a(\ln x - c)$, $\frac{\ln x}{x}$, $\frac{\ln x}{\sqrt{x}}$, $\sqrt{x}\ln x$, $(\ln x)^2 - \ln x$, $c\,e^{\text{quadratisch}}$, $\frac{e^x}{(e^x + 1)^2}$, Polynome) | Definitionsbereich, Nullstellen, Achsenabschnitt; Verhalten am Rand mit Begründung (L'Hospital oder „e wächst schneller als jede Potenz, ln langsamer“); $f'$ (oft „zeigen Sie“), Vorzeichenschema von $f'$ → Monotonie-Intervalle, Extrema (Vorzeichenwechsel oder $f''$); $f''$ → Krümmung, Wendepunkte (bei e-Funktionen oft über $u = e^x$); Wertemenge, globale Extrema (Randwerte vergleichen); Symmetrie; Skizze | $f' = 0$ für hinreichend gehalten; Randwerte bei globalen Extrema vergessen; Faktor $e^{\ldots}$ im Vorzeichenschema nicht als immer positiv erkannt | **eigene Tätigkeit „Funktion untersuchen“** (M9), Skizze M6b |
| Linearisieren und Tangente, Näherungswerte; Differential, Fehlerrechnung | Stelle $x_0$ wählen (nah, leicht zu rechnen, keine Polstelle), $y = f(x_0) + f'(x_0)(x - x_0)$, einsetzen, mit dem genauen Wert vergleichen; auch links von $x_0$ | Stelle an einer Polstelle, zu weit weg | M9 (Linearisieren) |
| Taylorpolynom (einmal in der Klausur) | Ableitungen an der Stelle, Formel, Näherungswert | Fakultät im Nenner vergessen | M9 (Linearisieren, Stufe 5) |
| Implizites Ableiten mit Tangente (nur bis 2013) | beide Seiten nach $x$ ableiten, $y' $ freistellen | – | später, niedrige Priorität |

## Grenzwerte

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Grenzwerte für $n \to \infty$ und $x \to \pm\infty$ | erst ausmultiplizieren, wenn sich führende Glieder aufheben; dann die am schnellsten wachsenden Glieder (e-Funktion vor Potenz vor Logarithmus) bzw. höchste Potenz ausklammern; Wurzeln: höchste Potenz herausziehen; Grenzwert mit Parameter als Term; Ergebnis Zahl, $\pm\infty$ oder „existiert nicht“ | führende Glieder heben sich auf und wurden nicht ausmultipliziert | M9 Grenzwerte |
| Grenzwerte für $x \to x_0$ (Klausur, jedes Jahr) | einsetzen; bei $\frac{0}{0}$ kürzen oder mit dem Gegenstück erweitern; **L'Hospital** nur bei $\frac{0}{0}$ oder $\frac{\infty}{\infty}$, Zähler und Nenner **getrennt** ableiten, mehrfach wenn nötig; einseitige Grenzwerte; Stelle auch ungleich 0 (z. B. bei $\tan(\pi x)$) | L'Hospital ohne unbestimmte Form (Ergebnis falsch); Quotientenregel statt getrennt abgeleitet; Kettenregel im Zähler vergessen; Wert besonderer Winkel falsch | M9 Grenzwerte |
| Weitere unbestimmte Formen: $0 \cdot \infty$, $\infty - \infty$, $1^\infty$, $0^0$, $\infty^0$ | $0 \cdot \infty$: als Bruch schreiben (geschickt wählen); $\infty - \infty$: auf einen Nenner bringen; Potenzformen: $f^g = e^{g \ln f}$, erst den Grenzwert des Exponenten, am Ende $e^{\ldots}$ | $1^\infty$ für 1 gehalten; L'Hospital direkt auf ein Produkt; am Ende das $e^{\ldots}$ vergessen | M9 Grenzwerte (Stufe 4–5) |

## Vektoren

Grundlage: Skript-Kapitel 3, Übungen 5 und 6 des laufenden Semesters, ältere Blätter, jede Klausur.

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Rechnen: Summe, Vielfache, Vektorterm vereinfachen, Vektorgleichung nach einem Vektor auflösen | koordinatenweise; wie Terme mit Buchstaben | durch einen Vektor geteilt oder Vektoren gekürzt | M7 (Term- und Umstell-Engine mit Vektorzeichen) |
| Verbindungsvektor, Länge, Mittelpunkt, Umfang, vierter Punkt eines Parallelogramms | „Spitze minus Fuß“, Betrag mit Pythagoras (auch in mehr als drei Dimensionen) | falsch herum subtrahiert | M7 |
| Einheitsvektor, Vektor gegebener Länge gleichsinnig, gegensinnig, senkrecht | normieren, mit der Länge malnehmen; senkrecht im Raum: Kreuzprodukt normieren | Gegenvorzeichen (zweite Lösung) vergessen | M7 |
| Skalarprodukt, Winkel, Richtungswinkel zu den Achsen; Vorzeichen deuten (spitz, recht, stumpf), auch mit Parameter; Betrag einer Linearkombination aus Beträgen und Winkel | $\cos\varphi = \frac{\vec a \cdot \vec b}{\lvert\vec a\rvert\,\lvert\vec b\rvert}$; spitz heißt Skalarprodukt > 0; $\lvert\vec a + \vec b\rvert^2$ ausmultiplizieren; Winkel ohne Rechner aus Vorzeichen und Größe des Kosinus abschätzen | $(\vec a \cdot \vec b)\vec c = \vec a(\vec b \cdot \vec c)$ angenommen; $(\vec a \cdot \vec b)^2 = a^2 b^2$; $\cos^{-1}$ als Kehrwert | M7 |
| Zerlegung parallel und senkrecht, Projektion auf eine Richtung, Projektion auf den Spann zweier Vektoren | $\vec a_\parallel = \frac{\vec a \cdot \vec b}{\lvert\vec b\rvert^2}\vec b$, $\vec a_\perp = \vec a - \vec a_\parallel$; Probe: Summe ergibt $\vec a$, $\vec a_\perp \cdot \vec b = 0$; auf einen Spann: Normalgleichungen | Projektion von $\vec a$ auf $\vec b$ mit der von $\vec b$ auf $\vec a$ verwechselt; $\lvert\vec b\rvert$ statt $\lvert\vec b\rvert^2$ im Nenner | M7 |
| Kreuzprodukt, Parallelogramm- und Dreiecksfläche, Normalenvektor, Parallelität (Kreuzprodukt = $\vec 0$) | Schema mit Hilfszeilen; Probe: Ergebnis senkrecht zu beiden; Fläche $\frac{1}{2}\lvert\vec a \times \vec b\rvert$; Fläche mit Parameter minimieren | Vorzeichen der mittleren Komponente; Reihenfolge; $\frac{1}{2}$ vergessen | M7 |
| Spatprodukt, Volumen von Spat, Prisma ($\frac{1}{2}$), Pyramide ($\frac{1}{3}$), Tetraeder ($\frac{1}{6}$), Oberfläche; komplanar; Rechtssystem | Sarrus; Volumen ist der **Betrag**; komplanar heißt Spatprodukt 0; vorgegebenes Volumen gibt zwei Lösungen | Betrag vergessen; $\frac{1}{3}$ und $\frac{1}{6}$ verwechselt | M7 |
| Linearkombination, lineare Unabhängigkeit (auch mit Parameter), Basis, Dimension des Spanns | Gleichungssystem oder Determinante; Faustregeln (Nullvektor, parallel, vier Vektoren im Raum) | – | M7 |
| Technik: Kräfte aus Betrag und Winkel, resultierende Kraft mit Winkel (Quadrant), schiefe Ebene (Hangabtrieb $\sin$, Normalkraft $\cos$), Arbeit $W = \vec F \cdot \vec s$, Drehmoment $\vec M = \vec r \times \vec F$, Last an Seil oder Ausleger, rechtwinkliges Dreieck nachweisen | Komponenten $\lvert\vec F\rvert(\cos\alpha, \sin\alpha)$, addieren, Betrag und Winkel zurück; Arbeit nach dem Winkel umstellen | sin und cos am Hang vertauscht; Quadrant des Winkels | M7, Einheiten M10 |

## Geraden und Ebenen

Grundlage: Skript-Kapitel 7, Blatt 13 und ältere Blätter, jede Klausur.

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Gerade aus Punkt und Richtung oder zwei Punkten; liegen Punkte auf einer Geraden, vier Punkte in einer Ebene | Parameterform; einsetzen bzw. Spatprodukt | – | M7 |
| Ebene: Parameter-, Normalen-, Koordinatenform, Hessesche Normalform; umrechnen; Spurpunkte, Schnittgeraden mit den Koordinatenebenen | drei Punkte → zwei Richtungen → Normalenvektor per Kreuzprodukt (kürzen) → Koordinatenform; Hesse: normieren, $d \ge 0$; zurück: zwei Variablen frei wählen | $d < 0$ nicht korrigiert; nicht normiert | M7 |
| Lage zweier Geraden (gleich, parallel, schneidend, windschief), auch mit Parameter im Stützvektor | Richtungen parallel? ja: Stützpunkt der einen auf der anderen? nein: Gleichungssystem mit **zwei verschiedenen** Parametern, dritte Gleichung prüfen | gleicher Parameterbuchstabe für beide Geraden; dritte Gleichung nicht geprüft | M7 (geführt als Entscheidungsbaum) |
| Lage Gerade–Ebene (liegt drin, parallel, Schnittpunkt), Ebene–Ebene (gleich, parallel, Schnittgerade), Gerade zu drei Ebenen | Gerade in die Koordinatenform einsetzen; Normalen vergleichen; Schnittgerade mit Gauß | – | M7 |
| Abstände: Punkt–Ebene, Punkt–Gerade (mit Lotfußpunkt), parallele Geraden, windschiefe Geraden, parallele Ebenen | Punkt–Ebene: in die Hesse-Form einsetzen, Betrag; Punkt–Gerade: $\frac{\lvert\vec v \times (\vec q - \vec p)\rvert}{\lvert\vec v\rvert}$ oder Lotfußpunkt über die Projektion; windschief: Spatprodukt durch $\lvert\vec v_1 \times \vec v_2\rvert$ | Betrag oder Normieren vergessen; nicht alles auf eine Seite gebracht | M7 |
| Winkel: Gerade–Gerade, Gerade–Ebene, Ebene–Ebene; Lotgerade, Schwerpunkt, Mittelpunkt | Kosinus mit Betrag im Zähler (spitzer Winkel); Gerade–Ebene mit **Sinus** (Richtung gegen Normale) | stumpfen Winkel angegeben; cos statt sin bei Gerade–Ebene | M7 |

## Matrizen, Determinanten, Gleichungssysteme

Grundlage: Skript-Kapitel 6 (und 1.8 für Gauß), Blätter 4 und 12, Übung 6, jede Klausur.

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Lineare Gleichungssysteme mit dem Gauß-Algorithmus: eindeutig, keine Lösung, unendlich viele (ein oder zwei Parameter), über- und unterbestimmt, mit Dezimalzahlen | Tabelle, Zeilenstufenform (Pivot wählen, bei 0 Zeilen tauschen, Brüche und Dezimalzahlen wegskalieren), Rückwärtseinsetzen; Nullzeile „0 = 0“ streichen, Widerspruch „0 = c“ heißt keine Lösung; freie Variablen sind die Spalten ohne Pivot; Lösung als Stützvektor plus Vielfache von Richtungen | Nullzeile mit Widerspruch verwechselt; Zeile „0 … 0 1 ∣ 0“ als „keine Lösung“ gedeutet; falsche Variable frei gewählt; Spalten getauscht und die Reihenfolge vergessen; Vorzeichen beim Einsetzen; Abschreibfehler | M7 (Tabellen-Baustein) |
| **Gleichungssystem mit Parameter** (Klausur, jedes Jahr) | Determinante der Koeffizientenmatrix als Polynom im Parameter, Nullstellen sind die Sonderfälle; sonst eindeutig; jeden Sonderfall einzeln in die Stufenform einsetzen (keine Lösung oder Gerade); Rang der Koeffizienten- und der erweiterten Matrix; lösbar genau bei gleichem Rang; Folgefragen: Lösung mit vorgegebener Komponente, Parameter auch als Quadrat, „hängt nicht von $b$ ab“ | durch einen Ausdruck geteilt, der 0 sein kann; Sonderfall vergessen; allgemeine Formel auf den Sonderfall angewandt | M7 (Stufe 5) |
| Cramersche Regel (oft nur für eine Unbekannte) | nur bei quadratischer Matrix und $\det A \ne 0$; Spalte $i$ durch $\vec b$ ersetzen | Zeile statt Spalte ersetzt | M7 |
| Matrizen rechnen: Summe, Vielfache, Produkt (Falk-Schema), Transponierte; „Welche Ausdrücke sind definiert?“; Format einer gesuchten Matrix $X$ | Produkt nur bei passenden Formaten; Spalte mal Zeile gibt eine Matrix, Zeile mal Spalte eine Zahl; $(AB)^{\mathsf T} = B^{\mathsf T} A^{\mathsf T}$; $AB \ne BA$; $AB$ kann Nullmatrix sein | Inverse oder Determinante einer nicht quadratischen Matrix gebildet; $(AB)^{\mathsf T} = A^{\mathsf T} B^{\mathsf T}$; Fangfrage „$0 \cdot A - 0 \cdot C$“ mit verschiedenen Formaten | M7 (ab Stufe 1) |
| Inverse: 2×2 mit Formel, 3×3 mit **Gauß-Jordan** (Klausur, jedes Jahr), auch mit Parameter; Gleichungssystem über die Inverse | $[A \mid E]$, Stufenform, Diagonale auf 1, oberhalb Nullen; Nullzeile links heißt nicht invertierbar; Probe durch Malnehmen; Regeln $(AB)^{-1} = B^{-1}A^{-1}$, $(\lambda A)^{-1} = \frac{1}{\lambda}A^{-1}$, $(A^{\mathsf T})^{-1} = (A^{-1})^{\mathsf T}$ | Reihenfolge bei $(AB)^{-1}$; $\lvert A\rvert$ als Betrag statt Determinante gelesen | M7 (geführt Zeile für Zeile) |
| **Matrizengleichung nach $X$ auflösen** (Klausur, jedes Jahr): mit Transponierten, Inversen, Einheitsmatrix | erst allgemein: Transponierte und Inverse mit den Regeln auflösen, $X$ auf eine Seite, **Zahl als Vielfaches von $E$ schreiben**, $X$ links oder rechts ausklammern, von derselben Seite mit der Inversen malnehmen; dann einsetzen und ausrechnen | „$A - 2$“ ohne $E$; auf der falschen Seite ausgeklammert oder multipliziert; durch eine Matrix geteilt; $AXA^{-1}$ zu $X$ gekürzt | M7 (Stufe 4–5, passt zur Umstell-Engine) |
| **Determinanten:** 2×2, 3×3 (Sarrus), 4×4 und 5×5 (Entwicklung nach Zeile oder Spalte mit vielen Nullen, Schachbrett-Vorzeichen), mit Umformungen; mit Parameter (Klausur, jedes Jahr) | Umformungen: Vielfaches einer Zeile addieren ändert nichts, Tausch dreht das Vorzeichen, Faktor einer Zeile vorziehen; Dreiecksmatrix: Produkt der Diagonale; Regeln $\det(\lambda A) = \lambda^n \det A$, $\det(AB) = \det A \cdot \det B$, $\det A^{\mathsf T} = \det A$, $\det A^{-1} = \frac{1}{\det A}$; Folgerungen: invertierbar, Spalten linear abhängig, $A\vec x = \vec 0$ eindeutig lösbar, Basis | Sarrus bei 4×4; Vorzeichen des Schachbretts; $\lambda$ statt $\lambda^n$; Vorzeichenwechsel beim Tausch vergessen | M7 |
| Theorie: Vektorraum, Untervektorraum (nur durch den Ursprung), gleichwertige Aussagen für reguläre Matrizen, drei Sichten auf ein Gleichungssystem; Anwendungen: Bedarfstabellen, Stabkräfte eines Dreibocks | – | – | Lernkarten, M12; Stabkräfte M11 |

## Was die Durchsicht sonst ergeben hat

- **Dritte Wurzel aus negativen Zahlen:** Das Skript (Kapitel 1 und 5) erlaubt ungerade Wurzeln
  aus negativen Zahlen. Die App folgt dem seit M6 Schritt 4c (12.11.2026): $\sqrt[3]{-8} = -2$,
  $x^{1/3}$ weiter nur für $x \ge 0$ (docs/ENTSCHEIDUNGEN.md). In der Klausur kommt der Fall kaum vor.
- **Fehler in den Unterlagen** (nicht übernehmen): ein Druckfehler bei den
  Additionstheoremen der Hyperbelfunktionen im Skript, einzelne Rechen- und Abschreibfehler in
  handschriftlichen Lösungen (z. B. Vorzeichen, Faktor beim Gleichnamigmachen, Wert eines
  besonderen Winkels). Das bestätigt die Regel, dass alle Lösungen aus der Engine kommen; die
  Fehler taugen als falsche Optionen.
- **Exakte Werte:** Manche Übungsaufgaben gehen nur mit gerundeten Zwischenwerten glatt auf.
  In der App werden Zahlen so gewählt, dass sie exakt aufgehen, wie in der Klausur.
- **Kurvendiskussion** steht in keinem Kapitel des Skripts als eigenes Thema (verteilt auf
  Kapitel 4, 5 und 8), ist aber die größte Klausuraufgabe. In der App bekommt sie darum eine
  eigene Tätigkeit.

## Stand der Umsetzung

- M6 Schritt 4 (12.11.2026): Gleichungen umstellen mit Buchstaben, je Baustein ab Stufe 1.
  Darunter sind schon die Arten aus den Unterlagen, die mit Buchstaben gehen:
  - Wurzel in Wurzel, zwei Wurzeln
  - zwei Logarithmen derselben Basis
  - $x$ und $\sqrt{x}$ (mit „Quadratische Gleichungen")
  - Formeln wie die Schwingungsdauer (Engine kann sie schon, Aufgaben dazu kommen in 4b)
- M6 Schritt 4b-1 (12.11.2026): Formeln aus Technik und Physik nach verschiedenen Größen
  umstellen. Die eigene Sammlung steht in `src/engine/tasks/formulas.ts`, darunter die
  Schwingungsdauer eines Pendels und der Plattenkondensator. Zeichen wie $U_0$ und
  $\varepsilon_r$ gehen auch beim Eintippen.
- M6 Schritt 4b-2 (12.11.2026): Logarithmen auf beiden Seiten mit Zahl und Faktor, verschiedene Basen über den
  Basiswechsel (Basen wie 2 und 4 auf die kleinere, sonst auf $\ln$), danach linear oder quadratisch; mit Buchstaben
  (Gleichungen mit Zahlen kommen in 4b-3).
- M6 Schritt 4b-3 (12.11.2026): Gleichungen mit Zahlen mit Probe in der Ausgangsgleichung: Wurzel gleich Zahl (auch gleich
  einer negativen Zahl: keine Lösung), Wurzel gleich Term mit $x$ und zwei Wurzeln (Scheinlösung), $x$ und $\sqrt{x}$,
  Brüche mit verbotenem Wert und Hauptnenner, Logarithmen mit Lösung außerhalb des Definitionsbereichs, $e^{2x}$ und
  $e^{x}$ ($u \le 0$ verwerfen). Lösung eine ganze Zahl, ein einfacher Bruch oder $\ln$ einer Zahl. Noch offen: zwei
  Lösungen als Lösungsmenge und Wurzel aus einem Betrag (mit 5d).
- Alles Übrige ist in docs/PLAN-M6.md (4b-3, 5d, 6, 7) und docs/ROADMAP.md (M7, M9)
  eingeplant. Neu nach der Sichtung (12.11.2026):
  - Exponentialgleichungen und Umkehrfunktionen für 4b
  - „Funktion untersuchen“ (gebrochen-rational und Kurvendiskussion) als eigene Tätigkeit in M9
  - Geraden und Ebenen, Gleichungssysteme, Matrizengleichungen und Determinanten mit Parameter
    in M7
  - später eine Probeklausur Mathe aus den elf Klausur-Bausteinen
