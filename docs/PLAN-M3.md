# Plan für Meilenstein 3: Gleichungen umstellen

Status: **freigegeben** (05.11.2026, 4. Fassung mit deiner Änderung: ab
Stufe 3 auch im Aufbau schwerer). Die 3. Fassung war am 30.10.2026
freigegeben; danach sind die Schritte 1 bis 3 entstanden.

Ziel von M3: Du kannst Gleichungen geführt und frei nach einer Variablen
auflösen, in 5 Stufen von $y = \frac{3(x - a)}{b} + c$ bis
$\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y$, mit Erklärungen, Lernkarten,
Fortschritt und gezieltem Üben. Das Thema „Gleichungen umstellen" im Gebiet
„Grundlagen" wird spielbar.

Teil A beschreibt in einfachen Worten, was in welcher Reihenfolge entsteht.
Teil B ist der technische Bauplan.

Neu in der 4. Fassung (nach den Brüchen in M2b):
- **Baukasten und Abwechslung auch hier.** Die Stufen 1 bis 3 werden neu
  aus einem Baukasten gebaut, wie bei den Brüchen (neue Schritte 4 und 5).
  Ziel: mindestens 100 verschiedene Formen je Stufe statt bisher 8 bis 26.
- **Die Stufen 4 und 5 entstehen gleich mit dem Baukasten**, mit demselben
  Ziel.
- **Stufe 4 in drei Teilen** (6a bis 6c), jeder für sich zum Ausprobieren.
- **Deine Änderung: ab Stufe 3 schwerer im Aufbau.** Die Kerne werden
  ineinander gesetzt und gegeneinander gestellt, nicht nur Schalen
  drumherum gelegt. Ein Test misst die Länge der Rechenwege (siehe
  „Ab Stufe 3: Kerne ineinander").
- **Vier neue typische Fehler** für die Stufen 1 bis 3.
- **Schritte neu gezählt:** Die bisherigen Schritte 4 bis 7 heißen jetzt 6
  bis 9.

Geändert gegenüber den ersten Fassungen (deine Rückmeldungen):
- **Mathe und Physik getrennt:** M3 ist reine Mathematik mit $x$, $y$ und
  Buchstaben wie $a$, $b$, $c$, $k$. Formeln mit Zeichen der Physik
  ($R_1$, $v_0$, $\alpha$) kommen in M6 ins Fach Physik, zusammen mit
  deiner Idee „Aufgabe lesen, Formel wählen, umstellen".
- **Stufe 3** bekommt zusätzlich Wurzeln (bisher Stufe 4).
- **Stufe 4: verschachtelt.** e-Funktion und $\ln$ ineinander, Wurzeln in
  Wurzeln, Potenz- und Logarithmusgesetze, Winkel- und Hyperbelfunktionen,
  Substitution und $pq$-Formel mit Scheinlösungen.
- **Stufe 5: quer durch die Mathematik.** In jeder Gleichung steckt ein
  Stück aus einem anderen Gebiet: Ableitung, Integral, Summe oder Reihe,
  Grenzwert, komplexe Zahl, Determinante, Vektor, Differentialgleichung.
  Erst musst du es ausrechnen, dann umstellen.

---

## Teil A: Was entsteht

### Mathe und Physik: wie es zusammenpasst

Auf der Startseite gibt es die Fächer Mathe und Physik schon. Vorschlag für
die Aufteilung:

| Wo | Thema | Was du übst | Wann |
| --- | --- | --- | --- |
| Mathe → Grundlagen | Brüche | Bruchterme kürzen, zusammenfassen, Doppelbrüche | fertig (M2) |
| Mathe → Grundlagen | **Gleichungen umstellen** | Nach einer Variablen auflösen, vom Handwerk bis quer durch die Mathematik | **M3** |
| Physik → Formeln mit Einheiten | Formeln umstellen | Echte Formeln aus Physik und Technischer Mechanik mit ihren Zeichen ($R_1$, $v_0$, $\alpha$, $\tau$) | M6 |
| Physik → Formeln mit Einheiten | Aufgaben lösen | Textaufgabe lesen, die passende Formel wählen, sagen, nach welcher Größe umgestellt wird, umstellen, Werte mit Einheiten einsetzen | M6 |
| Physik → Formeln mit Einheiten | Einheiten umrechnen (falls gewünscht) | km/h in m/s, mm² in m², MPa in N/mm² | M6 |

So passt es zusammen:
- **Mathe ist das Handwerk, Physik die Anwendung.** In Mathe lernst du die
  Umformungen ohne Ablenkung durch Zeichen und Einheiten. In Physik kommt
  dazu: Welche Formel passt zur Aufgabe, und was kommt mit Einheit heraus?
- **Nichts doppelt:** Physik rechnet mit derselben Mathe-Engine wie
  „Gleichungen umstellen" und „Brüche". Muss in einer Physik-Aufgabe eine
  Seite zu einem Bruch zusammengefasst werden, rechnet die Bruch-Engine
  mit, mit denselben typischen Fehlern.
- **Lernkarten:** Physik bekommt Karten zu Formeln und Einheiten. Für das
  Umstellen selbst verweist sie auf die Mathe-Karten, statt sie zu kopieren.
- **Fortschritt** wird je Thema getrennt gezählt, wie bisher.

### Welche Gleichungen?

- **Reine Mathematik:** die Variablen $x$ und $y$, dazu Buchstaben wie
  $a$, $b$, $c$, $d$, $k$, $q$. Aufgelöst wird meist nach $x$, manchmal
  nach einem der Buchstaben (z. B. nach $a$ oder $n$).
- **Eindeutige Lösung:** Jede Aufgabe nennt ihre Bedingungen, z. B. „alle
  Buchstaben sind positiv", „$x > a$" oder „$0 < x < 1$". Dadurch gibt es
  genau eine Lösung, und nie wird durch 0 geteilt. Eintippen musst du die
  Bedingungen nicht. Wo zwei Lösungen herauskommen (z. B. aus der
  $pq$-Formel), gehört das Aussortieren der falschen zur Aufgabe.
- **Stufen 4 und 5 greifen vor:** Logarithmusgesetze, Integrale, Reihen,
  komplexe Zahlen und Determinanten bekommen später eigene Themen (M4, M5),
  in denen du sie von Grund auf übst. Hier brauchst du sie als Werkzeug.
  Für jedes Werkzeug gibt es eine kurze Lernkarte.

### Abwechslung: Baukasten statt fester Vorlagen (neu in der 4. Fassung)

Ich habe nachgemessen wie bei den Brüchen: je Stufe die Aufgaben 1 bis 200,
ohne die Zahlen verglichen und mit den Buchstaben der Reihe nach benannt.
Übrig bleibt die **Form** der Aufgabe.

| Stufe | Verschiedene Formen | Häufigste Form | Dieselbe Form schon unter den 4 Aufgaben davor |
| --- | --- | --- | --- |
| 1 | 8 | 46-mal | bei 100 von 200 Aufgaben |
| 2 | 11 | 33-mal | bei 68 von 200 |
| 3 | 26 | 24-mal | bei 29 von 200 |

Ziel wie bei den Brüchen: mindestens **100 Formen** je Stufe, keine Form
öfter als in 3 von 100 Aufgaben. Die Brüche haben jetzt 158 bis 196 Formen
je Stufe.

Der Grund: Jede Stufe hat nur fünf bis acht feste Vorlagen mit wenigen
Unterarten, darin ändern sich nur Zahlen und Buchstaben. In Stufe 1 ist fast
jede vierte Aufgabe $y = \frac{k(x \pm a)}{b} \pm c$. Die App meidet zwar
schon die Formen deiner letzten zehn Aufgaben, aber bei acht Formen geht
das nicht.

**Der Baukasten: Kern und Schalen.** Jede Gleichung entsteht aus zwei Teilen:
- **Kern:** die Stelle, an der die gesuchte Variable steckt. In Stufe 1
  steht sie einmal da, in Stufe 2 mehrfach oder im Nenner, in Stufe 3 in
  Zähler und Nenner, unter einer Wurzel oder im Quadrat.
- **Schalen:** Rechnungen, die um den Kern gelegt werden: plus oder minus
  etwas, mal oder durch etwas, eine Klammer mit Zahl oder Buchstabe davor,
  ein Minus davor, ein Bruchstrich mit einer Summe darunter.

Dazu wechseln:
- die **andere Seite:** $y$, ein Buchstabe, eine Summe, ein Bruch, oder
  ebenfalls Teile mit der Variable;
- **wonach** aufgelöst wird: meist $x$, oft auch ein Buchstabe mittendrin
  (z. B. nach $a$, $m$ oder $k$);
- die **Buchstaben:** viele verschiedene, höchstens sieben je Aufgabe (so
  viele passen auf die Tastatur); Zahlen auch als Bruch wie $\frac{1}{2}$.

Gelöst wird von außen nach innen: erst die Schalen abtragen, dann den Kern
lösen. Das übst du in jeder Aufgabe, aber in immer anderer Zusammenstellung.

**So entstehen die Aufgaben.** Feste Gleichungen braucht es nicht. Ich lege
nur die Bausteine fest (welche Kerne und Schalen es gibt und wie sie sich
verbinden lassen). Ein Zufallsgenerator setzt daraus je Aufgaben-Nummer eine
Gleichung zusammen. Die Engine löst sie selbst Schritt für Schritt und prüft
die Lösung durch Einsetzen. Was nicht eindeutig lösbar ist, zu lang wird
oder sich nicht sauber lösen lässt, wird verworfen und neu gezogen.

**Ab Stufe 3: Kerne ineinander (dein Wunsch).** Damit die Gleichungen nicht
nur länger, sondern im Aufbau schwerer werden, verbindet der Baukasten ab
Stufe 3 mehrere Kerne:
- **Kern im Kern:** z. B. eine Wurzel aus einem Bruch, in dem $x$ oben und
  unten steht; ein Doppelbruch mit $x$ im inneren Bruch; in Stufe 4 der
  $\ln$ eines solchen Bruchs oder ein Bruch aus $e^x$.
- **Kern gegen Kern:** auf beiden Seiten etwas mit $x$, z. B. Bruch gleich
  Bruch, Klammer mal Klammer gleich Klammer im Quadrat, Potenz gleich
  Potenz.
- **Mehrere Kerne in einer Summe:** mehrere Brüche mit $x$ in
  verschiedenen Nennern, zwei Wurzeln, zwei Potenzen mit $x$ im Exponenten.

Dazu kommen die Schalen. So hat jede Aufgabe ab Stufe 3 mindestens zwei
verbundene Kerne. Ein Test misst die Länge der Rechenwege: heute brauchen
die Aufgaben der Stufe 3 im Mittel 4,6 Umformungen. Neu sollen es im Mittel
mindestens 6 sein, in Stufe 4 mindestens 7 und in Stufe 5 mindestens 8, dort
dazu das Ausrechnen des Werkzeugs.

**Stufe 1 neu: Die Variable kommt einmal vor, zwei bis vier Schalen**
- plus und minus, mal und durch, Klammern auch ineinander
- Minus vor einer Klammer oder einem Bruch
- Brüche mit Buchstaben oder Summen im Nenner
- gesucht ist $x$ oder ein Buchstabe mittendrin

$y = \frac{3(x - a)}{b} + c$ ·
$a - \frac{x - b}{4} = c$ ·
$k - 2\left(a - \frac{x}{b}\right) = c$ ·
$\frac{a(bx + c)}{d} = y$ ·
$\frac{x + 2a}{b + c} - d = y$ ·
$y = m(x - a) + b$ nach $a$ ·
$y = \frac{a + b}{c} - d$ nach $b$

**Stufe 2 neu: Die Variable kommt mehrfach vor oder steht im Nenner**
- $x$ auf beiden Seiten, in Klammern, auch mit Minus davor
- Brüche mit Zahlen im Nenner, in denen $x$ steht (Hauptnenner aus Zahlen)
- $x$ im Nenner, mit Schalen drumherum
- gesucht ist auch ein Buchstabe, der zweimal vorkommt

$ax + b = cx + d$ ·
$\frac{x + a}{2} - \frac{x - b}{3} = c$ ·
$a(x - b) - c(x + d) = x$ ·
$5x - a(3 - x) = bx$ ·
$\frac{a}{x} + b = \frac{c}{x}$ ·
$y = \frac{a}{b - x} + c$ ·
$ax + b = a + c$ nach $a$

**Stufe 3 neu: Brüche und Wurzeln, Kerne ineinander**
- $x$ in Zähler und Nenner, Bruch gleich Bruch, mehrere Brüche mit $x$ in
  verschiedenen Nennern (Hauptnenner wie $x^2 - b^2$)
- Doppelbrüche mit $x$ im inneren Bruch
- Klammern, bei denen sich $x^2$ weghebt, z. B. $(x + a)(x - b) = (x + c)^2$
- Kehrwerte addieren, auch drei, aufgelöst nach jedem Buchstaben
- Wurzeln: aus einem Bruch mit $x$ oben und unten, Summe oder Differenz
  zweier Wurzeln (zweimal quadrieren), $\sqrt{x}$ in Zähler und Nenner
- Quadrate: $x^2$ und Klammern im Quadrat (mit Bedingung wie $x > b$)
- Schalen aus Stufe 1 drumherum

$\frac{a}{x - b} - \frac{c}{x + b} = \frac{d}{x^2 - b^2}$ ·
$\frac{a}{1 + \frac{b}{x}} = c$ ·
$(x + a)(x - b) = (x + c)^2$ ·
$b\sqrt{\frac{x + a}{x - a}} - c = y$ ·
$\frac{\sqrt{x} + a}{\sqrt{x} - b} = y$ ·
$\sqrt{x + a} + \sqrt{x - a} = y$ ·
$\frac{1}{a} = \frac{1}{x} + \frac{1}{b} + \frac{1}{c}$ nach $b$ ·
$y = \frac{a + x}{a - x}$ nach $a$ ·
$a\left(\frac{x}{b} - 1\right)^2 = y$ mit $x > b$

**Stufe 4 neu: Verschachtelt, in beide Richtungen.** Die Bausteine $e^x$,
$a^x$, $\ln$, $\sin$, $\cos$, $\tan$, $\sinh$, $\cosh$ stecken um einen Kern
aus Stufe 3 herum ($\ln$ eines Bruchs, $e$ hoch einen Bruch, Wurzel aus
einem $\ln$) und in einem solchen Kern drin (Bruch aus $e^x$, Bruch aus
$\sin x$). Dazu $x$ mehrfach im Exponenten, Logarithmusgesetze, Substitution
und $pq$-Formel mit Scheinlösungen. Bis zu drei Ebenen tief, dazu Schalen.

$\ln\frac{x + a}{x - a} = b$ ·
$\frac{a e^{x} + b}{e^{x} - c} = y$ ·
$a \cdot 2^{x + 1} - b \cdot 2^{x} = c$ ·
$3^{2x - 1} = a \cdot 5^{x}$ ·
$\ln(x + a) + \ln(x - a) = b$ ·
$e^{2x} - a e^{x} = b$ ·
$\sqrt{a + \ln\frac{x}{b}} = y$ ·
$\frac{a + \sin x}{a - \sin x} = y$ ·
$\cosh x = a \sinh x$ ·
$y = \frac{a}{1 + b e^{-k(x - c)}}$

**Stufe 5 neu: Werkzeug und Kern verbunden.** Das Werkzeug (Ableitung,
Integral, Reihe, Grenzwert, komplexe Zahl, Determinante, Vektor,
Differentialgleichung) liefert nicht nur eine einfache Seite, sondern steckt
selbst in einem Kern aus Stufe 3 oder 4 (Werkzeug im Bruch, Bruch im
Werkzeug). Manchmal steht auf beiden Seiten etwas zum Ausrechnen.

$\frac{\int_0^x e^{t}\,\mathrm{d}t}{e^{x} + a} = y$ ·
$\det\begin{pmatrix} e^{x} & a \\ e^{-x} & b \end{pmatrix} = y$ ·
$\sum_{k=1}^{\infty}\left(\frac{a}{x}\right)^k = y$ ·
$\int_0^x e^{t}\,\mathrm{d}t = \det\begin{pmatrix} a & e^{x} \\ 1 & b \end{pmatrix}$

In beiden Stufen gilt auch das Ziel von 100 Formen. Die Beispiele aus der
Tabelle „Stufen: Beispiele mit Lösung" (unten) bleiben drin.

**Messen statt hoffen** (wie bei den Brüchen):
- Ein Test prüft bei jeder Änderung: je Stufe unter 200 Aufgaben mindestens
  100 Formen, keine öfter als in 3 von 100.
- Ab Stufe 3 misst er auch die Länge der Rechenwege (siehe oben).
- Die Formel-Galerie zeigt die Zahlen unter „Abwechslung je Stufe".
- Die Rechnungen und Lösungen kommen wie immer aus der Engine; die
  Beispiele oben zeigen nur die Art der Aufgaben.
- Die alten Aufgaben-Nummern der Stufen 1 bis 3 zeigen danach andere
  Aufgaben. Dein Fortschritt bleibt.

### Stufen: Beispiele mit Lösung

Die Tabellen zeigen typische Aufgaben jeder Stufe mit Lösung. In den Stufen
1 bis 3 kommen sie jetzt aus dem Baukasten (oben).

**Stufe 1: Mehrere Schritte, die Variable kommt einmal vor**

| Aufgabe | Lösung |
| --- | --- |
| $y = \frac{3(x - a)}{b} + c$ nach $x$ | $x = \frac{by - bc + 3a}{3}$ |
| $y = m(x - a) + b$ nach $m$ | $m = \frac{y - b}{x - a}$ |
| $\frac{x}{a} - \frac{b}{c} = d$ nach $x$ | $x = \frac{ab + acd}{c}$ |

**Stufe 2: Die Variable kommt mehrfach vor oder steht im Nenner**

| Aufgabe | Lösung |
| --- | --- |
| $a x + b = c x + d$ nach $x$ | $x = \frac{d - b}{a - c}$ |
| $a(x + b) = c(x - d)$ nach $x$ | $x = \frac{ab + cd}{c - a}$ |
| $\frac{a}{x} + b = c$ nach $x$ | $x = \frac{a}{c - b}$ |
| $y = \frac{a}{b - x}$ nach $x$ | $x = \frac{by - a}{y}$ |

**Stufe 3: Brüche und Wurzeln, die Variable kommt mehrfach vor**

| Aufgabe | Lösung |
| --- | --- |
| $y = \frac{2x + 1}{x - 3}$ nach $x$ | $x = \frac{3y + 1}{y - 2}$ |
| $\frac{1}{x} + \frac{1}{a} = \frac{1}{b}$ nach $a$ | $a = \frac{bx}{x - b}$ |
| $\frac{a}{x + b} = \frac{c}{x - b}$ nach $x$ | $x = \frac{b(a + c)}{a - c}$ |
| $y = \sqrt{\frac{x + a}{x - a}}$ nach $x$ | $x = \frac{a(y^2 + 1)}{y^2 - 1}$ |
| $y = a\sqrt{b^2 - x^2}$ nach $x$ | $x = \frac{\sqrt{a^2 b^2 - y^2}}{a}$ |
| $y = \sqrt{x + a} - \sqrt{x}$ nach $x$ (zweimal quadrieren) | $x = \frac{\left(a - y^2\right)^2}{4y^2}$ |

**Stufe 4: Verschachtelt**

| Aufgabe | Lösung |
| --- | --- |
| $y = \frac{a}{\left(1 + b e^{-kx}\right)^2}$ | $x = \frac{1}{k} \ln\frac{b\sqrt{y}}{\sqrt{a} - \sqrt{y}}$ |
| $y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)$ | $x = \frac{1}{2}\ln\left(e^{2y} - 2e^{y}\right)$ |
| $y = \sqrt{a + \sqrt{b + \sqrt{x}}}$ | $x = \left(\left(y^2 - a\right)^2 - b\right)^2$ |
| $a^{x} \cdot b^{2x - 1} = c$ | $x = \frac{\ln(bc)}{\ln\left(ab^2\right)}$ |
| $\log_a x + \log_a(x + b) = c$ (eine Lösung der $pq$-Formel fällt weg) | $x = \frac{\sqrt{b^2 + 4a^c} - b}{2}$ |
| $\frac{\sin x + \cos x}{\sin x - \cos x} = y$ | $x = \arctan\frac{y + 1}{y - 1}$ |
| $y = a\cos^2 x + b\sin^2 x$ | $x = \arcsin\sqrt{\frac{y - a}{b - a}}$ |
| $y = \frac{e^x - e^{-x}}{2}$ (mit $u = e^x$) | $x = \ln\left(y + \sqrt{y^2 + 1}\right)$ |

Gesucht ist jeweils $x$.

**Stufe 5: Quer durch die Mathematik**

| Gebiet | Aufgabe | Lösung |
| --- | --- | --- |
| Ableitung | $\frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{x^2}{x + a}\right) = y$ | $x = \frac{a}{\sqrt{1 - y}} - a$ |
| Ableitung | $\frac{\mathrm{d}}{\mathrm{d}x}\left(x\sqrt{x^2 + a^2}\right) = y$ | $x = \sqrt{\left(\frac{y + \sqrt{y^2 + 8a^2}}{4}\right)^2 - a^2}$ |
| Integral | $\int_0^x \frac{t}{t^2 + a^2}\,\mathrm{d}t = y$ | $x = a\sqrt{e^{2y} - 1}$ |
| Integral (Partialbrüche) | $\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y$ | $x = \frac{ab\,e^{by}}{a + b - a\,e^{by}}$ |
| Summe | $\sum_{k=0}^{n-1} a q^k = y$ nach $n$ | $n = \frac{\ln\left(1 + \frac{(q - 1)y}{a}\right)}{\ln q}$ |
| Reihe | $\sum_{k=1}^{\infty} k x^k = y$ | $x = \frac{2y + 1 - \sqrt{4y + 1}}{2y}$ |
| Grenzwert | $\lim_{n \to \infty}\left(\frac{n + x}{n - x}\right)^n = y$ | $x = \frac{1}{2}\ln y$ |
| Komplexe Zahlen | $\left\lvert\frac{x + a\,\mathrm{i}}{x - b\,\mathrm{i}}\right\rvert = y$ | $x = \sqrt{\frac{a^2 - b^2 y^2}{y^2 - 1}}$ |
| Komplexe Zahlen | $\arg\left((x + a\,\mathrm{i})^2\right) = y$ | $x = \frac{a}{\tan\frac{y}{2}}$ |
| Determinante | $\det\begin{pmatrix} 1 & x & x^2 \\ 1 & a & a^2 \\ 1 & b & b^2 \end{pmatrix} = y$ | $x = \frac{a + b}{2} + \sqrt{\frac{(b - a)^2}{4} + \frac{y}{b - a}}$ |
| Determinante | $\det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y$ | $x = \ln\frac{y + \sqrt{y^2 + 4ab}}{2b}$ |
| Additionstheorem | $\sin(x + a) = y\cos x$ | $x = \arctan\frac{y - \sin a}{\cos a}$ |
| Vektoren | $\begin{pmatrix} x \\ a \\ b \end{pmatrix}$ und $\begin{pmatrix} 1 \\ 0 \\ 0 \end{pmatrix}$ schließen den Winkel $y$ ein | $x = \frac{\sqrt{a^2 + b^2}}{\tan y}$ |
| Differentialgleichung | $f'' = k^2 f$, $f(0) = a$, $f'(0) = 0$ und $f(x) = y$ | $x = \frac{1}{k}\ln\frac{y + \sqrt{y^2 - a^2}}{a}$ |
| Reihe und Ableitung | $\frac{\mathrm{d}}{\mathrm{d}x}\sum_{k=1}^{\infty}\frac{x^k}{k} = y$ | $x = 1 - \frac{1}{y}$ |
| Reihe und Integral | $\int_0^x \sum_{k=0}^{\infty} t^k\,\mathrm{d}t = y$ | $x = 1 - e^{-y}$ |

Gesucht ist jeweils $x$, wenn nicht anders angegeben.

Alle Lösungen in diesen Tabellen habe ich nachgerechnet, unabhängig vom
Lösungsweg:
- $x$ und die Buchstaben zufällig im erlaubten Bereich gewählt;
- die linke Seite numerisch ausgerechnet: Ableitung, Integral, Summe,
  Grenzwert, komplexe Zahl und Determinante jeweils direkt mit Zahlen;
- die Lösung liefert wieder dasselbe $x$.

In der App kommen alle Aufgaben und Lösungen aus der Engine, mit
Zufallszahlen und Aufgaben-Nummer wie bei den Brüchen.

Bewusst nicht in M3: **Gleichungssysteme** (mehrere Gleichungen
gleichzeitig) und Gleichungen, die sich nicht von Hand nach $x$ auflösen
lassen (z. B. $x e^x = y$).

### So läuft eine Aufgabe ab

**Geführt:**
- **Stufen 1 und 2:** Je Umformung zwei Fragen.
  - „Was machst du als Nächstes?" Die Antworten sind Umformungen wie
    „auf beiden Seiten $-c$", „beide Seiten mal $(x - 3)$", „$x$
    ausklammern". Falsche Antworten sind typische Irrwege.
  - „Was kommt heraus?" Die Antworten sind die Gleichung nach der
    Umformung. Die falschen entstehen aus typischen Fehlern.
    Gibt es für eine Umformung keinen typischen Fehler, entfällt die
    Frage und die Gleichung steht gleich unter „Bisher".
- **Ab Stufe 3:** Routine-Umformungen fragt die App nur noch als „Was kommt
  heraus?". „Was machst du als Nächstes?" kommt nur noch an den Weichen:
  mit dem Nenner malnehmen, alles mit $x$ auf eine Seite, ausklammern,
  quadrieren, $\ln$ anwenden, substituieren, welche Lösung passt.
- **Stufe 5:** Zuerst „Was steht da eigentlich?": Ableitung, Integral,
  Summe, Grenzwert, Betrag, Determinante usw. ausrechnen, mit den typischen
  Fehlern dieses Gebiets. Danach wird umgestellt wie in den Stufen davor.
- Wie gewohnt: ein Tipp vor der Antwort, „Warum ist das falsch?" nach einer
  falschen Antwort, unter „Bisher" die Gleichungen von oben nach unten.

**Frei:** Du tippst das Ergebnis ein, z. B. $x = \frac{3y + 1}{y - 2}$
(oder nur die rechte Seite).
- Richtig ist jede gleichwertige Form, die fertig ist.
- Steht $x$ rechts noch, sagt die App: „Noch nicht aufgelöst: $x$ steht
  auch rechts." Das zählt nicht als Fehler.
- Typische Fehler werden erkannt und benannt.
- Die Mathe-Tastatur hat die Buchstaben der Aufgabe und je nach Stufe
  Wurzel, $e^{\square}$, $\ln$, $\sin$, $\cos$, $\tan$, $\arcsin$,
  $\arctan$.

### Beispiel: So sieht eine geführte Aufgabe in Stufe 5 aus

Aufgabe: Löse $\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y$ nach $x$ auf
(alle Buchstaben positiv, $x > a$).

1. **Was steht da eigentlich?** Zerlege in Partialbrüche:
   - Richtig: $\frac{1}{t(t + b)} = \frac{1}{b}\left(\frac{1}{t} - \frac{1}{t + b}\right)$ ✓
   - Falsch: $\frac{1}{t} - \frac{1}{t + b}$ (Faktor $\frac{1}{b}$
     vergessen)
2. **Stammfunktion:**
   - Richtig: $\frac{1}{b}\left(\ln t - \ln(t + b)\right)$ ✓
   - Falsch: $\frac{1}{b}\left(\ln t + \ln(t + b)\right)$ (Minus verloren)
3. **Grenzen einsetzen:**
   - Richtig: $\frac{1}{b}\left(\ln\frac{x}{x + b} - \ln\frac{a}{a + b}\right) = y$ ✓
   - Falsch: $\frac{1}{b}\left(\ln\frac{a}{a + b} - \ln\frac{x}{x + b}\right) = y$
     (Grenzen vertauscht)
4. **Logarithmusgesetz, mal $b$:**
   - Richtig: $\ln\frac{x(a + b)}{a(x + b)} = by$ ✓
   - Falsch: $\frac{\ln\frac{x}{x + b}}{\ln\frac{a}{a + b}} = by$
     (Differenz der $\ln$ als Quotient)
5. **$e$ hoch beide Seiten:**
   - Richtig: $\frac{x(a + b)}{a(x + b)} = e^{by}$ ✓
   - Falsch: $\frac{x(a + b)}{a(x + b)} = by$ ($\ln$ nur weggelassen)
6. **Mit dem Nenner malnehmen, alles mit $x$ nach links, ausklammern:**
   - Richtig: $x\left(a + b - a\,e^{by}\right) = ab\,e^{by}$ ✓
   - Falsch: $x\left(a + b - e^{by}\right) = ab\,e^{by}$ (beim Ausmultiplizieren
     das $a$ vergessen)
7. **Teilen:**
   - Richtig: $x = \frac{ab\,e^{by}}{a + b - a\,e^{by}}$ ✓

### Wann ist ein Ergebnis fertig?
- Die gesuchte Variable steht allein auf einer Seite, auf der anderen kommt
  sie nicht vor.
- Kein Bruch direkt im Zähler oder Nenner eines Bruchs (kein Doppelbruch).
- In den Stufen 1 bis 3 ist die andere Seite außerdem zusammengefasst, wie
  bei den Brüchen: ein Bruch, gekürzt.
- Gleichwertige Formen zählen alle, z. B. $\frac{d - b}{a - c}$ und
  $\frac{b - d}{c - a}$, oder $\frac{1}{2}\ln y$ und $\ln\sqrt{y}$.

### Katalog der Fehlerregeln (Vorschlag)

**Umstellen (alle Stufen)**

| Umformung | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Rüberbringen | Vorzeichen nicht gewechselt | $y = x + b \Rightarrow x = y + b$ |
| Gegenoperation | mal statt geteilt | $y = ax \Rightarrow x = ay$ |
| Teilen | nur einen Summanden geteilt | $ax = y + b \Rightarrow x = \frac{y}{a} + b$ |
| Bruch | Bruch auf den Kopf gestellt | $y = \frac{a}{x} \Rightarrow x = \frac{y}{a}$ |
| Mit dem Nenner malnehmen | Klammer um den Nenner vergessen | $y = \frac{2x + 1}{x - 3} \Rightarrow yx - 3 = 2x + 1$ |
| Klammer | nur den ersten Summanden malgenommen | $a(x + b) \Rightarrow ax + b$ |
| Ausklammern | die 1 vergessen | $xy - x = 3y + 1 \Rightarrow x \cdot y = 3y + 1$ |
| Kehrwert | Kehrwert gliedweise genommen | $\frac{1}{x} + \frac{1}{a} = \frac{1}{b} \Rightarrow x + a = b$ |
| Wurzel | Wurzel gliedweise gezogen | $x^2 = b^2 - \frac{y^2}{a^2} \Rightarrow x = b - \frac{y}{a}$ |
| Quadrieren | nur einen Teil quadriert | $\frac{y}{a} = \sqrt{b^2 - x^2} \Rightarrow \frac{y^2}{a} = b^2 - x^2$ |
| Quadrieren | Mittelglied vergessen | $\left(y + \sqrt{x}\right)^2 = y^2 + x$ |
| Verschachtelte Wurzel | innere Wurzel gleich mit aufgelöst | $y = \sqrt{a + \sqrt{b + \sqrt{x}}} \Rightarrow y^2 = a + b + \sqrt{x}$ |
| Malnehmen | nicht jeden Summanden malgenommen (neu in der 4. Fassung, `eq-multiply-one-term`) | $\frac{x}{a} = c - b \Rightarrow x = ac - b$, auch $\frac{x + a}{2} - \frac{x - b}{3} = c \Rightarrow 3(x + a) - 2(x - b) = c$ |
| Minus vor der Klammer | Vorzeichen nur beim ersten Summanden gewechselt (neu in der 4. Fassung, `eq-minus-bracket`) | $a - c(x - d) = a - cx - cd$ |
| Ausklammern | das Minus verloren (neu in der 4. Fassung, `eq-factor-sign`) | $ax - bx = c \Rightarrow x(a + b) = c$ |
| Quadrat | halbiert statt die Wurzel gezogen (neu in der 4. Fassung, `eq-square-halved`) | $x^2 = c \Rightarrow x = \frac{c}{2}$ |

**e-Funktion, $\ln$, Potenzen, Winkelfunktionen (ab Stufe 4)**

| Umformung | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| e-Funktion | $\ln$ vergessen | $e^{kx} = w \Rightarrow kx = w$ |
| e-Funktion | Minus im Exponenten verloren | $e^{-kx} = w \Rightarrow kx = \ln w$ |
| $\ln$ | durch $k$ im $\ln$ geteilt | $kx = \ln w \Rightarrow x = \ln\frac{w}{k}$ |
| $\ln$ | $\ln$ einer Summe auseinandergezogen | $\ln\left(1 + e^{2x}\right) = \ln 1 + 2x$ |
| Logarithmusgesetz | Produkt der Logarithmen statt Summe | $\ln\left(a^x b^{2x - 1}\right) = x\ln a \cdot (2x - 1)\ln b$ |
| Logarithmusgesetz | Differenz der $\ln$ als Quotient | $\ln u - \ln v = \frac{\ln u}{\ln v}$ |
| Potenzgesetz | Exponent nur auf einen Faktor | $\left(ab^2\right)^x = a\,b^{2x}$ |
| $pq$-Formel | Vorzeichen von $p$ nicht gewechselt | $u^2 - 2yu - 1 = 0 \Rightarrow u = -y \pm \sqrt{y^2 + 1}$ |
| Lösung wählen | Scheinlösung nicht verworfen | $\log_a x$ mit negativem $x$, oder $u = e^x$ negativ |
| Substitution | nicht zurückgerechnet | $x = y + \sqrt{y^2 + 1}$ statt $\ln\left(\ldots\right)$ |
| Winkelfunktion | Quadrat vergessen | $\cos^2 x = 1 - \sin x$ |
| Umkehrfunktion | falsche Umkehrfunktion | $\tan x = w \Rightarrow x = \frac{1}{\tan w}$ |

**Werkzeuge aus anderen Gebieten (Stufe 5)**

| Gebiet | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Ableitung | Quotientenregel mit falschem Vorzeichen (wie bei „Ableiten") | $\left(\frac{x^2}{x + a}\right)' = \frac{x^2 - 2x(x + a)}{(x + a)^2}$ |
| Ableitung | innere Ableitung vergessen (wie bei „Ableiten") | $\left(\sqrt{x^2 + a^2}\right)' = \frac{1}{2\sqrt{x^2 + a^2}}$ |
| Integral | Faktor bei den Partialbrüchen vergessen | $\frac{1}{t(t + b)} = \frac{1}{t} - \frac{1}{t + b}$ |
| Integral | Faktor $\frac{1}{2}$ vergessen | $\int \frac{t}{t^2 + a^2}\,\mathrm{d}t = \ln\left(t^2 + a^2\right)$ |
| Integral | Grenzen vertauscht | $F(a) - F(x)$ statt $F(x) - F(a)$ |
| Summe | Anzahl der Summanden um eins verschoben | $\sum_{k=0}^{n-1} q^k = \frac{q^{n+1} - 1}{q - 1}$ |
| Reihe | Faktor $x$ vergessen | $\sum_{k=1}^{\infty} k x^k = \frac{1}{(1 - x)^2}$ |
| Grenzwert | „1 hoch unendlich ist 1" | $\lim_{n \to \infty}\left(\frac{n + x}{n - x}\right)^n = 1$ |
| Komplexe Zahlen | Betrag gliedweise | $\lvert x + a\,\mathrm{i}\rvert = x + a$ |
| Komplexe Zahlen | Winkel beim Quadrieren nicht verdoppelt | $\arg\left(z^2\right) = \arg z$ |
| Determinante | Plus statt Minus | $\det\begin{pmatrix} p & q \\ r & s \end{pmatrix} = ps + qr$ |
| Additionstheorem | gliedweise | $\sin(x + a) = \sin x + \sin a$ |
| Vektoren | nicht durch die Längen geteilt | $\cos\varphi = \vec{u} \cdot \vec{v}$ |
| Differentialgleichung | Anfangswert $f'(0) = 0$ nicht genutzt | $f(x) = a\,e^{kx}$ |

Dazu kommen die bekannten Fehler aus „Brüche", wenn eine Seite zu einem
Bruch zusammengefasst wird (z. B. Zähler plus Zähler, Nenner plus Nenner).

Wenn dir typische Fehler aus deinen Übungen fehlen, sag es.

### Schritte

#### Schritt 1: Mathe-Engine fürs Umstellen
- Die Engine löst Gleichungen Schritt für Schritt nach einer Variablen auf.
  Jeder Schritt wird mitgeschrieben: welche Umformung, und die Gleichung
  danach.
- Typische Fehler (Katalog oben) liefern die falschen Antworten.
- Aufgaben-Vorlagen für die Stufen 1 bis 3, mit Zufallszahlen und
  Aufgaben-Nummer.
- Tests: Jede Lösung wird in die Ausgangsgleichung eingesetzt und an vielen
  Zahlenstellen geprüft.

**Ausprobieren:** In der Formel-Galerie gibt es „Umstellen" mit zufälligen
Aufgaben, Rechenweg und typischen falschen Ergebnissen.

#### Schritt 2: Thema freischalten, Stufen 1 und 2 geführt
- Das Thema heißt jetzt „Gleichungen umstellen" (bisher „Formeln
  umstellen") und lässt sich öffnen und üben.
- Geführter Modus mit Erklärungen, Tipps und „Warum ist das falsch?".
- Neuer Lernkarten-Ordner „Gleichungen umstellen": Gegenoperation,
  Rüberbringen mit Vorzeichenwechsel, Variable im Nenner, Ausklammern.
- Fortschritt und häufigste Fehler wie bei den anderen Themen.

**Ausprobieren:** Start → „Grundlagen" → „Gleichungen umstellen" → Stufe 2
üben, z. B. $a(x + b) = c(x - d)$.

#### Schritt 3: Stufe 3 geführt, freier Modus für die Stufen 1 bis 3
- Brüche mit der Variable mehrfach, Kehrwerte, Wurzeln, zweimal
  quadrieren. Zum Zusammenfassen rechnet die Bruch-Engine aus M2 mit.
- Freier Modus: Ergebnis eintippen, Hinweis, wenn $x$ noch auf beiden
  Seiten steht oder die rechte Seite noch nicht zusammengefasst ist;
  typische Fehler werden erkannt.
- Neue Lernkarten: Mit dem Nenner malnehmen, Kehrwert, Wurzel und Quadrat.
- Umgesetzt: Eingabe als rechte Seite oder ganze Gleichung; ein Bruch unter
  einer Wurzel oder im Quadrat zählt als fertig, ein Bruch in einer Summe
  unter der Wurzel nicht ($\sqrt{b^2 - \frac{y^2}{a^2}}$).

**Ausprobieren:** $y = \sqrt{x + a} - \sqrt{x}$ geführt lösen, dann
$y = \sqrt{\frac{x + a}{x - a}}$ frei, einmal mit „Wurzel gliedweise
gezogen".

#### Schritt 4: Baukasten und Abwechslung, Stufen 1 und 2 (neu)
- Baukasten aus Kern und Schalen; die Stufen 1 und 2 kommen daraus.
- Geführt und frei für alle neuen Formen, auch nach einem Buchstaben
  aufgelöst.
- Drei neue typische Fehler: nicht jeden Summanden malgenommen, Minus vor
  Klammer oder Bruch, Vorzeichen beim Ausklammern; mit Texten und auf den
  Lernkarten. Gezielt üben lassen sie sich ab Schritt 9 (wie alle Fehler
  beim Umstellen).
- Test für die Abwechslung (100 Formen) für die Stufen 1 und 2.

**Ausprobieren:** In Stufe 1 und 2 je zehnmal „Nächste Aufgabe": keine Form
doppelt, mal nach $x$, mal nach einem Buchstaben aufgelöst.

**Umgesetzt:** Die Stufen 1 und 2 kommen aus dem Baukasten
(`tasks/rearrangeKit.ts`). Stufe 1: die Variable allein, darum zwei bis vier
Schalen (plus, minus, Minus davor, mal, durch; additive und malnehmende
wechseln sich ab, kein Bruch im Bruch), die andere Seite $y$, ein Buchstabe,
eine Summe, ein Produkt oder ein Bruch. Stufe 2: $x$ mehrfach (auf beiden
Seiten, in Klammern auch mit Minus davor, in Brüchen mit Zahlen im Nenner),
$x$ im Nenner mit bis zu zwei Schalen oder zweimal im selben Nenner. In etwa
jeder fünften Aufgabe wird nach einem Buchstaben aufgelöst, dann steht $x$
als gewöhnlicher Buchstabe mit drin. Buchstaben aus Familien wie
$a, b, c, \dots$ oder $p, q, r, \dots$, höchstens sieben je Aufgabe.
Gemessen unter den Aufgaben 1 bis 200: Stufe 1 195 Formen, Stufe 2 192
(vorher 8 und 11), keine öfter als in 2 von 100; im Mittel 4,1 bzw. 4,5
Umformungen. Die Form zählt Buchstaben in Produkten wie $ax$ jetzt einzeln,
auch den gesuchten (Brüche danach: 158 bis 194 Formen je Stufe).

Drei neue typische Fehler (Tabelle oben): nicht jeden Summanden
malgenommen (beim Malnehmen einer Summe und beim Malnehmen mit dem
Hauptnenner), Minus vor der Klammer nur beim ersten Summanden, beim
Ausklammern das Minus verloren; mit Texten, auf den Lernkarten „Gegenrechnung
auf beiden Seiten", „Variable mehrfach" und „Mit dem Hauptnenner malnehmen".
Beim Ausmultiplizieren gibt es jetzt je Klammer einen Fehler (bisher nur für
die erste Klammer einer Seite).

Der Rechenweg wurde dabei schöner: Ein Minus vor einem Bruch bleibt beim
Malnehmen mit dem Hauptnenner als Klammer stehen ($3x - (x - 7a)$, danach
ausmultiplizieren); steht die Variable im Nenner und auf der anderen Seite
eine Summe mit Brüchen, wird diese zuerst zu einem Bruch zusammengefasst
(„Bevor du mit dem Nenner malnimmst …"), so entsteht kein Doppelbruch; ein
Ergebnis hat nie $-1$ im Nenner. Bei falschen Umformungen heißt es „Nur die
linke Seite …" und Summen stehen in Klammern („mal $(b - 2)$").

#### Schritt 5: Stufe 3 aus dem Baukasten (neu)
- Kerne: $x$ in Zähler und Nenner, mehrere Brüche mit $x$ im Nenner,
  Doppelbrüche, Klammern mit $x^2$, das sich weghebt, Kehrwerte, Wurzeln,
  Quadrate; immer mindestens zwei Kerne ineinander oder gegeneinander,
  Schalen wie in Stufe 1.
- Die Engine lernt dazu: Summe zweier verschiedener Wurzeln, Doppelbrüche
  mit $x$ im inneren Bruch, Wurzel aus einem Bruch mit Schalen drumherum,
  schönere Endformen wie $\left(\frac{by + a}{y - 1}\right)^2$ statt
  ausmultipliziert.
- Test: im Mittel mindestens 6 Umformungen.
- Neuer typischer Fehler: halbiert statt die Wurzel gezogen.
- Die Lernkarte „Wurzel und Quadrat" bekommt Klammern im Quadrat.
- Test für die Abwechslung auch für Stufe 3.

**Ausprobieren:** $a\left(\frac{x}{b} - 1\right)^2 = y$ geführt, dann zehn
Aufgaben der Stufe 3 frei.

**Umgesetzt:** Stufe 3 kommt aus dem Baukasten (`buildLevel3` in
`tasks/rearrangeKit.ts`) mit zwölf Arten von Kernen, jede mit eigenen
Varianten, Schalen und anderen Seiten: $x$ in Zähler und Nenner (mit ein bis
zwei Schalen), Bruch gleich Bruch (auch mit $x$ oben, dann hebt sich $x^2$
weg), Brüche mit verschiedenen Nennern ($x - b$, $x + b$, $x^2 - b^2$, auch
$\frac{x + c}{x - b} - 1$), Klammern und Quadrate, bei denen sich $x^2$
weghebt (mit einem Nenner), Kehrwerte (zwei oder drei, mit Klammer im Nenner,
nach jedem Buchstaben), Wurzel aus einem Bruch mit Schalen, $x^2$ unter der
Wurzel mit Schalen, zwei Wurzeln (Summe, Differenz, Wurzel gegen Wurzel, auch
mit Faktor), $\sqrt{x}$ in Zähler und Nenner, Klammer im Quadrat mit
Bedingung ($x > b$, $x < b$, $x > \frac{b}{2}$), Bruch im Quadrat
$\left(\frac{x + a}{x - b}\right)^2$ und Doppelbrüche (Variable im inneren
Bruch, Bruch im Zähler, Brüche oben und unten). Gemessen unter den Aufgaben 1
bis 200: 189 Formen (vorher 26), keine öfter als in 2 von 100, im Mittel 6,2
Umformungen (vorher 4,6), jede mindestens 5. Der Filter prüft jetzt auch die
Aufgabe selbst an den Prüfstellen; Doppelbrüche gibt es erst ab Stufe 3.

Die Engine kann dazu: zwei verschiedene Wurzeln (die zweite Wurzel wird nach
dem ersten Quadrieren wie ein Buchstabe behandelt, ausmultipliziert, allein
gestellt, ausgeklammert und noch einmal quadriert), Doppelbrüche mit Brüchen
im Nenner erweitern (neuer Schritt „Den Doppelbruch mit $x$ erweitern"), vor
dem Wurzelziehen und Quadrieren die andere Seite zu einem Bruch
zusammenfassen, Klammern beim Malnehmen so, wie sie in der Aufgabe stehen
($\sqrt{x} - b$ statt $b - \sqrt{x}$), Endform
$\left(\frac{by + a}{y - 1}\right)^2$. Im freien Modus zählt eine Wurzel aus
einem Bruch wie ein Buchstabe ($b + \sqrt{\frac{y}{a}}$ ist fertig).

Neuer typischer Fehler `eq-square-halved` (halbiert statt die Wurzel
gezogen), mit Text und auf der Lernkarte „Wurzel und Quadrat"; die Karte
zeigt jetzt auch $(x - b)^2 = A$ mit Bedingung und zwei Wurzeln. Der Fehler
„Mittelglied vergessen" und das Sortieren ohne Vorzeichenwechsel gibt es auch
beim zweiten Quadrieren. Die alten Aufgaben-Nummern der Stufe 3 zeigen andere
Aufgaben; in Stufe 2 ändern sich einige Nummern, weil Doppelbrüche dort jetzt
ausdrücklich ausgeschlossen sind.

#### Schritt 6: Stufe 4 (verschachtelt), in drei Teilen
Gleich mit dem Baukasten gebaut, Kerne ineinander in beide Richtungen (siehe
„Stufe 4 neu"), im Mittel mindestens 7 Umformungen. Stufe 4 wird nach Teil
6a spielbar und wächst mit 6b und 6c.
- **6a:** e-Funktion und $\ln$ ineinander, Wurzeln in Wurzeln, Potenz- und
  Logarithmusgesetze
- **6b:** Winkel- und Hyperbelfunktionen, Umkehrfunktionen ($\arcsin$,
  $\arctan$)
- **6c:** Substitution und $pq$-Formel mit Scheinlösungen
- Neue Lernkarten: e-Funktion und $\ln$, Logarithmus- und Potenzgesetze
  (kurz), Substitution, $pq$-Formel, Umkehrfunktionen.

**Ausprobieren:** $\log_a x + \log_a(x + b) = c$ und
$y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)$ in beiden Modi.

#### Schritt 7: Stufe 5, Teil 1: Analysis
- Ableitungen (mit der Engine aus „Ableiten"), Integrale mit
  Partialbrüchen, Summen und Reihen, Grenzwerte, Differentialgleichungen.
- Neue Lernkarten (kurz): Stammfunktionen und Partialbrüche, geometrische
  Summe und Reihe, Grenzwert $\left(1 + \frac{x}{n}\right)^n \to e^x$,
  $f'' = k^2 f$.

**Ausprobieren:** $\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y$ geführt.

#### Schritt 8: Stufe 5, Teil 2: Algebra und Geometrie
- Komplexe Zahlen (Betrag, Winkel), Determinanten, Winkel zwischen
  Vektoren, Additionstheoreme.
- Neue Lernkarten (kurz): Betrag und Winkel komplexer Zahlen,
  Determinanten, Winkel zwischen Vektoren, Additionstheoreme.

**Ausprobieren:** $\det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y$
in beiden Modi.

#### Schritt 9: Gezieltes Üben, Feinschliff, Abschluss von M3
- „Deine häufigsten Fehler" mit „Gezielt üben" auch fürs Umstellen, für
  jeden typischen Fehler (ein Test prüft alle).
- Design-Durchgang, Offline-Test, Doku, M3 abhaken.

Pro Sitzung schaffen wir etwa ein bis zwei Schritte.

### Offene Fragen an dich
1. Passt die Aufteilung Mathe („Gleichungen umstellen", M3) und Physik
   („Formeln umstellen" und „Aufgaben lösen", M6)? Soll „Einheiten
   umrechnen" ein eigenes Thema in Physik werden?
2. Passt die Schwierigkeit jetzt? Wenn du Aufgaben aus deinen
   Übungsblättern hast, die vorkommen sollen, schick sie mir. Dann nehme
   ich sie als Vorlagen auf.

---

## Teil B: Technischer Bauplan

### Umstell-Engine (`src/engine/rearrange/`)
1. **Aufgabe** (`task.ts`): Gleichung (`Equation` aus `expr/types.ts`),
   gesuchte Variable, Bedingungen (alle Buchstaben positiv, dazu z. B.
   $x > a$ oder $0 < x < 1$). Schreibweise wie gestellt (Bruch, Wurzel und
   Klammer bleiben). Variablennamen sind beliebig, damit M6 dieselbe Engine
   mit $R_1$ oder $\alpha$ nutzen kann.
2. **Rechenweg** (`isolate.ts`): eine Folge von Umformungen, jede mit
   Operation und Gleichung danach:
   - auf beiden Seiten addieren bzw. subtrahieren
   - mit einem Term malnehmen bzw. durch ihn teilen (auch mit einem Nenner)
   - Kehrwert, Quadrieren, Wurzel ziehen, $\ln$ bzw. $e^{\square}$,
     Umkehrfunktion ($\arcsin$, $\arctan$, $\log_a$ ↔ $a^{\square}$)
   - Klammer ausmultiplizieren, Variable ausklammern, eine Seite zu einem
     Bruch zusammenfassen, Logarithmus- und Potenzgesetze
   - substituieren ($u = e^x$, $w = \sqrt{x^2 + a^2}$), $pq$-Formel,
     passende Lösung wählen (Bedingungen der Aufgabe), zurückrechnen
   - Seiten tauschen (die gesuchte Variable nach links)

   Vorgehen: Kommt die Variable einmal vor, werden die Operationen um sie
   herum von außen nach innen rückgängig gemacht. Kommt sie mehrfach vor:
   Nenner beseitigen, ausmultiplizieren, alles mit der Variable auf eine
   Seite, ausklammern, teilen. Kommt sie in verschiedenen Formen vor ($e^x$
   und $e^{-x}$, $x$ und $\sqrt{x}$): substituieren. Ist es danach
   quadratisch: $pq$-Formel.
3. **Endform** (`finish.ts`):
   - rationale Teile über die Bruch-Engine: ein Bruch, gekürzt, exakt
   - Teile ohne die gesuchte Variable, die keine Polynome sind ($e^{by}$,
     $\sqrt{y^2 + 1}$, $\tan\frac{y}{2}$), zählen für die Bruch-Engine als
     eigene Zeichen, wie bisher $e^x$ oder $\sqrt{x}$
   - Wurzeln, $e$ und $\ln$ sonst über `expr/finalForm.ts`
4. **Fehlerregeln** (`errorRules.ts`, Ids `eq-…`): Jede Fehlerregel führt
   genau eine Umformung falsch aus, der Rest wird richtig gerechnet. Die
   falschen Ergebnisse werden gefiltert: nie gleichwertig zur Lösung, im
   selben Schritt nicht doppelt.
5. **Vorlagen** (`tasks/rearrangeTerms.ts`): Gleichungsformen je Stufe mit
   Zufallszahlen und Bedingungen, Aufgaben-Nummern wie gehabt („2-4711").

### Baukasten und Abwechslung (`src/engine/tasks/rearrangeKit.ts`, neu in der 4. Fassung)
- **Kern** als kleine Erzeuger mit Art-Kennung, je Stufe eine Auswahl:
  - Stufe 1: die Variable allein, auch mit Faktor ($3x$, $bx$, $\frac{x}{a}$)
  - Stufe 2: Summen mit der Variable mehrfach, Klammern (auch mit Minus
    davor), Brüche mit Zahlen im Nenner, die Variable einmal im Nenner
  - Stufe 3: Variable in Zähler und Nenner, Bruch gleich Bruch, mehrere
    Brüche mit der Variable im Nenner, Kehrwertsummen, Wurzeln (auch aus
    einem Bruch, zwei Wurzeln, Wurzel im Nenner), Quadrate
- **Schalen:** `plus`, `minus`, `times`, `divide`, `bracket` (Faktor vor
  einer Klammer), `minus-before` (Minus vor Klammer oder Bruch), `over-sum`
  (durch eine Summe). Stufe 1: zwei bis vier, Stufen 2 und 3: null bis zwei.
- **Kerne verbinden (ab Stufe 3):** `nest` (Kern im Kern: ein Kern
  ersetzt die Variable in einem anderen), `versus` (Kern gegen Kern auf
  beiden Seiten), `sum` (mehrere Kerne in einer Summe). Jede Aufgabe ab
  Stufe 3 hat mindestens eine solche Verbindung; Stufe 4 und 5 bis zu drei
  Ebenen tief.
- **Andere Seite und Gesucht** zufällig; Buchstaben aus einem Vorrat (alle
  Kleinbuchstaben außer $e$ und $i$), höchstens sieben je Aufgabe.
- **Filter:** lösbar mit der Engine, das Ergebnis ohne die gesuchte
  Variable, an mindestens acht erlaubten Stellen prüfbar (dort erfüllt die
  Lösung auch die Aufgabe), Ergebnis
  höchstens 90 Zeichen LaTeX, Aufgabe am Handy nicht zu breit (`FitWidth`
  nicht unter 70 %), nicht zu leicht (Stufe 1: mindestens zwei Umformungen;
  Stufe 2: Variable mehrfach oder im Nenner), keine Gleichung, die für
  jedes $x$ gilt.
- **Rechenweg:** die vorhandene Umstell-Engine (`isolate.ts`). Neu, falls
  nötig: Minus vor einer Klammer, Klammern im Quadrat mit Bedingung
  (`requires`), Zahlenbrüche als Faktor. Wie immer hat jede Gleichung des
  Rechenwegs an den Prüfstellen dieselbe Lösung.
- **Form** (`rearrangeForm` in `tasks/forms.ts`): Buchstaben in Produkten
  wie $ax$ zählen künftig einzeln, auch der gesuchte (bisher blieb $ax$ als
  Ganzes stehen). Bei den Brüchen ändert das wenig (gemessen: 158 bis 194
  Formen je Stufe statt 158 bis 196).
- **Test** (`rearrangeTerms.test.ts`): Kennzahlen je Stufe über die
  Aufgaben 1 bis 200 (Formen; ab Stufe 3 auch die mittlere Zahl der
  Umformungen: 6, 7, 8); dazu wie bisher tausende Zufallsaufgaben je Stufe
  mit Gegenprobe durch Einsetzen, falsche Antworten nie richtig.
- **Länge:** Ergebnis höchstens 90 Zeichen LaTeX in den Stufen 1 bis 3,
  höchstens 120 in den Stufen 4 und 5; die Aufgabe am Handy wie oben.
- **Stufen 4 und 5:** derselbe Baukasten mit eigenen Kernen. Später
  dazukommende Vorlagen bekommen einen festen Anteil (`share`), vorweg mit
  eigenem Zufall gewählt wie bei den Brüchen, damit die übrigen Nummern
  ihre Aufgabe behalten.
- **Geführt:** `guided/rearrangePlan.ts` bleibt im Aufbau gleich; Texte
  und Irrwege für neue Umformungen (Minus vor einer Klammer) in
  `explain/rearrangeTexts.ts`.

### Stufe 5: erst ausrechnen, dann umstellen (`src/engine/rearrange/tools/`)
Jede Aufgabe der Stufe 5 enthält ein Werkzeug aus einem anderen Gebiet. Die
ersten Schritte rechnen es in einen gewöhnlichen Term um, jeweils mit eigener
Gegenprobe:

| Werkzeug | Ausrechnen | Gegenprobe (unabhängig) |
| --- | --- | --- |
| Ableitung | Engine aus „Ableiten" (`derive`), mit ihren Fehlerregeln | numerische Ableitung |
| Integral | Stammfunktionen aus einer kleinen Tafel, Partialbrüche über die Bruch-Engine, Grenzen einsetzen | Stammfunktion ableiten (`derive`), numerisch integrieren |
| Summe, Reihe | geometrische Summe und Reihe, auch abgeleitet und integriert | Teilsummen |
| Grenzwert | Formen, die auf $e^{\square}$ führen | großes $n$ einsetzen |
| Komplexe Zahl | Real- und Imaginärteil als Terme, Betrag, Winkel | mit Zahlen nachrechnen |
| Determinante | $2 \times 2$, $3 \times 3$ (Entwicklung) | numerisch |
| Vektoren | Skalarprodukt, Länge, Winkel | numerisch |
| Differentialgleichung | $f' = kf$ und $f'' = k^2 f$ mit Anfangswerten | einsetzen, numerisch ableiten |

- **Darstellung:** Neue Bausteine im Termbaum nur zum Setzen der Aufgabe
  (Ableitung, Integral, Summe, Grenzwert, Betrag, Winkel, Determinante,
  Vektor). KaTeX kann all das setzen. Gerechnet wird nach dem Ausrechnen mit
  gewöhnlichen Termen.
- **Freier Modus:** Eingetippt wird nur das Ergebnis für $x$; die Werkzeuge
  selbst musst du nicht eintippen.

### Bruch-Engine
- **Buchstaben:** bisher nur $x$, $y$, $a$, $b$, $h$; neu alle
  Kleinbuchstaben außer $e$ (das ist die Eulersche Zahl) und $i$ (die
  imaginäre Einheit).
- Die inneren Namen der Bausteine (`E`, `L`, `S`, `C`, `R`) sind
  Großbuchstaben und stören in M3 nicht. Umbenannt werden sie erst in M6,
  wenn Größen wie $R$ oder $C$ vorkommen.
- Alle Tests der Brüche laufen unverändert weiter.

### Prüfen
- **Gegenprobe ohne Rechenweg:** Erst werden die gesuchte Variable und die
  Buchstaben zufällig im erlaubten Bereich gewählt, dann die andere Seite
  ausgerechnet (in Stufe 5 mit der Gegenprobe des Werkzeugs, siehe oben).
  Die Lösung muss den gewählten Wert zurückliefern. Das ist unabhängig vom
  Rechenweg und trifft nur Stellen, an denen die Bedingungen gelten.
- **Exakter Vergleich:** Bei rationalen Lösungen zusätzlich über die
  Bruch-Engine.
- **Jeder Schritt:** Die Gleichung nach dem Schritt hat an den Prüfstellen
  dieselbe Lösung wie die davor.
- **Scheinlösungen:** Wo die $pq$-Formel oder das Quadrieren eine zweite
  Lösung liefert, prüft die Engine, dass sie die Bedingungen verletzt.
- **Freie Eingabe** (`check/rearrangeAnswer.ts`):
  - „$x = \ldots$" oder nur die rechte Seite
  - Steht die gesuchte Variable noch rechts: „noch nicht aufgelöst"
  - sonst gleichwertig zur Lösung? Dann fertig? (Regeln oben)
  - sonst: Vergleich mit den falschen Ergebnissen der typischen Fehler

### Oberfläche
- **Thema** `umstellen` in `catalog.ts` (Adresse bleibt `#/thema/umstellen`),
  neuer Titel „Gleichungen umstellen": Stufen mit Vorschau, `available`,
  `free`, `focus`, Lernkarten-Ordner.
- **Engine laden:** `courseEngines.ts` lädt die Umstell-Engine erst beim
  Üben (`planGuidedTask`, `prepareFree`).
- **Geführt:** Schrittplaner `guided/rearrangePlan.ts` mit den gemeinsamen
  Typen aus `guided/types.ts`, sonst wie bei den Brüchen.
  „Was machst du als Nächstes?" fragt nach dem Ziel („Wie wirst du den
  Nenner $b$ los?") und zeigt die Umformung in Worten mit Formel, z. B.
  „Beide Seiten mal $(x - 3)$"; Texte und Irrwege in
  `explain/rearrangeTexts.ts`.
- **Lange Aufgaben am Handy:** Determinanten, Integrale und verschachtelte
  Wurzeln setzen sich über `FitWidth` kleiner; wo das zu klein würde, steht
  die Aufgabe in zwei Zeilen (Werkzeug oben, „$= y$" darunter).
- **Tastatur:** Buchstaben der Aufgabe wie bei den Brüchen, dazu je nach
  Stufe Wurzel, $e^{\square}$, $\ln$, $\sin$, $\cos$, $\tan$, $\arcsin$,
  $\arctan$.
- **Lernkarten:** Ordner „Gleichungen umstellen", Beispiele rechnet die
  Engine. Die Karten zu den Werkzeugen sind kurz (Formel, Merksatz,
  typischer Fehler) und werden in M4 und M5 ausgebaut.
- **Galerie:** Umschalter „Ableiten / Brüche / Umstellen".
- **Speicher:** kein neues Format nötig, Fortschritt je Thema gibt es schon.

### Tests
- **Je Stufe tausende Zufallsaufgaben:**
  - Lösung durch Einsetzen gegengeprüft
  - jeder Schritt mit derselben Lösung
  - Endform fertig
  - falsche Antworten nie richtig
  - alles von KaTeX setzbar
- **Jedes Werkzeug der Stufe 5:** Ergebnis gegen seine numerische Gegenprobe.
- **Jede Fehlerregel:**
  - Katalogbeispiel in einem Test
  - eigener Text für „Warum ist das falsch?", der das Ergebnis nicht verrät
- **Lernkarten:** Jeder Fehler der spielbaren Stufen steht auf einer Karte
  und lässt sich dort gezielt üben.
- **Freie Eingabe:**
  - richtige Formen werden angenommen
  - „noch nicht aufgelöst" kommt an der richtigen Stelle
  - Fehler werden richtig benannt
- **Browser-Tests:** je Stufe eine Aufgabe geführt und frei, lange Aufgaben
  ragen am Handy nicht heraus, offline.

### Fertig heißt (pro Schritt)
- Tests, Typprüfung und Build ohne Fehler.
- Im Browser geprüft in Handy- und Laptopgröße, hell und dunkel.
- Commit und Push, ROADMAP abgehakt.
- Kurze Nachricht an dich, was du ausprobieren kannst.

---

## Ausblick: Physik (M6)

Nicht Teil von M3, aber so geplant, dass M3 dafür passt:
- **Formeln umstellen:** echte Formeln wie
  $\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$ nach $R_1$,
  $s = v_0 t + \frac{1}{2} a t^2$ nach $t$ oder
  $U = U_0\left(1 - e^{-\frac{t}{\tau}}\right)$ nach $t$. Die Rechnung macht
  die Engine aus M3; neu sind tiefgestellte Zeichen und griechische
  Buchstaben (Darstellung, Eingabe, je Größe eine Taste) und dass
  physikalische Größen positiv sind.
- **Aufgaben lösen:** eine kurze Textaufgabe mit gegebenen Werten.
  1. Welche Formel brauchst du? (Auswahl aus einer kleinen Formelsammlung)
  2. Nach welcher Größe stellst du um?
  3. Umstellen, geführt oder frei, mit der Engine aus M3
  4. Werte mit Einheiten einsetzen
  5. Ergebnis mit Einheit, sinnvoll gerundet

  Typische Fehler dort: falsche Formel, Größen verwechselt, Einheit nicht
  umgerechnet (km/h statt m/s), Zehnerpotenz falsch.
- **Einheiten umrechnen** als eigenes kleines Thema, wenn du es möchtest.

---

## Bekannte Risiken
- **Alte Aufgaben-Nummern ändern sich** (4. Fassung): Eine gespeicherte
  Nummer der Stufen 1 bis 3 zeigt danach eine andere Aufgabe. Der
  Fortschritt zählt weiter; die Browser-Tests bekommen neue Nummern.
- **Lange geführte Aufgaben:** Jede Schale ist eine Umformung mit bis zu
  zwei Fragen. Deshalb in Stufe 1 höchstens vier Schalen, in den Stufen 2
  und 3 höchstens zwei. Ab Stufe 3 fragt die App „Was machst du als
  Nächstes?" ohnehin nur an den Weichen.
- **Schwerere Aufgaben in Stufe 3 bis 5** brauchen mehr von der Engine
  (z. B. zwei verschiedene Wurzeln). Was sie noch nicht sauber lösen kann,
  verwirft der Generator; der Test der Umformungen zeigt, ob trotzdem genug
  schwere Aufgaben übrig bleiben.
- **Viel neuer Stoff in Stufe 5:** acht Werkzeuge mit eigener Rechnung und
  eigenen Fehlern. Deshalb zwei eigene Schritte (5 und 6) und je Werkzeug
  eine unabhängige Gegenprobe.
- **Mehrere gleich gute Endformen**, z. B. $\frac{d - b}{a - c}$ und
  $\frac{b - d}{c - a}$, oder $\frac{a}{\sqrt{1 - y}} - a$ und
  $\frac{a - a\sqrt{1 - y}}{\sqrt{1 - y}}$. Der Vergleich ist mathematisch,
  die Prüfung auf „fertig" folgt den Regeln von oben.
- **Bedingungen:** Ohne sie wären manche Lösungen nicht eindeutig (zwei
  Lösungen der $pq$-Formel, Winkel nur in einem Bereich eindeutig). Die
  Aufgabe nennt sie, Prüfstellen liegen nur dort, wo sie gelten.
- **Quadrieren** kann Scheinlösungen erzeugen. Die Vorlagen sind so
  gewählt, dass die Lösung gilt; die Gegenprobe prüft das bei jeder Aufgabe.
- **Lange Formeln am Handy:** Determinanten und Integrale sind breit.
  Browser-Tests prüfen, dass nichts seitlich herausragt.
- **Engine allgemein halten:** Damit M6 sie ohne Umbau nutzen kann, hängt
  nichts an bestimmten Buchstaben.
