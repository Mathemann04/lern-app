# Plan für Meilenstein 3: Gleichungen umstellen

Status: **freigegeben** (30.10.2026, 3. Fassung).

Ziel von M3: Du kannst Gleichungen geführt und frei nach einer Variablen
auflösen, in 5 Stufen von $y = \frac{3(x - a)}{b} + c$ bis
$\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y$, mit Erklärungen, Lernkarten,
Fortschritt und gezieltem Üben. Das Thema „Gleichungen umstellen" im Gebiet
„Grundlagen" wird spielbar.

Teil A beschreibt in einfachen Worten, was in welcher Reihenfolge entsteht.
Teil B ist der technische Bauplan.

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

### Stufen (Vorschlag)

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

#### Schritt 4: Stufe 4 geführt und frei
- Verschachtelte e-Funktionen, $\ln$ und Wurzeln, Potenz- und
  Logarithmusgesetze, Winkel- und Hyperbelfunktionen, Substitution,
  $pq$-Formel mit Scheinlösungen.
- Neue Lernkarten: e-Funktion und $\ln$, Logarithmus- und Potenzgesetze
  (kurz), Substitution, $pq$-Formel, Umkehrfunktionen.

**Ausprobieren:** $\log_a x + \log_a(x + b) = c$ und
$y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)$ in beiden Modi.

#### Schritt 5: Stufe 5, Teil 1: Analysis
- Ableitungen (mit der Engine aus „Ableiten"), Integrale mit
  Partialbrüchen, Summen und Reihen, Grenzwerte, Differentialgleichungen.
- Neue Lernkarten (kurz): Stammfunktionen und Partialbrüche, geometrische
  Summe und Reihe, Grenzwert $\left(1 + \frac{x}{n}\right)^n \to e^x$,
  $f'' = k^2 f$.

**Ausprobieren:** $\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y$ geführt.

#### Schritt 6: Stufe 5, Teil 2: Algebra und Geometrie
- Komplexe Zahlen (Betrag, Winkel), Determinanten, Winkel zwischen
  Vektoren, Additionstheoreme.
- Neue Lernkarten (kurz): Betrag und Winkel komplexer Zahlen,
  Determinanten, Winkel zwischen Vektoren, Additionstheoreme.

**Ausprobieren:** $\det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y$
in beiden Modi.

#### Schritt 7: Gezieltes Üben, Feinschliff, Abschluss von M3
- „Deine häufigsten Fehler" mit „Gezielt üben" auch fürs Umstellen.
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
