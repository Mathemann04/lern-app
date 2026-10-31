# Plan für M2b: Brüche nachschärfen

Status: **freigegeben** (31.10.2026) mit deinen Änderungen:
- mindestens **100 Formen je Stufe** (statt 80)
- Partialbruchzerlegung in Stufe 5, **dazu Themen aus späteren Kapiteln**
  deines Buchs, in denen Brüche vorkommen (Schritt 5)
- Dezimalzahlen in Stufe 1: ja (habe ich entschieden; „Rechnen mit reellen
  Zahlen" gehört zu Kapitel 1 deines Buchs)

Maßstab für das Niveau ist dein Buch „Mathe für Ingenieure" (Übersicht:
[LEHRBUCH.md](LEHRBUCH.md)).

Ziel: Die Bruch-Aufgaben werden **abwechslungsreich** und **deutlich
schwerer**. Keine Stufe soll sich anfühlen wie „dieselbe Aufgabe mit anderen
Zahlen". Stufe 5 wird „kaum noch schwerer" und deckt das ganze Thema ab, so
wie Stufe 5 von „Gleichungen umstellen". Danach gilt dasselbe für die anderen
Themen (siehe „Und danach").

Teil A beschreibt in einfachen Worten, was sich ändert. Teil B ist der
technische Bauplan.

---

## Teil A: Was sich ändert

### Warum sich die Aufgaben so ähnlich anfühlen

Ich habe nachgemessen: je Stufe 200 zufällige Aufgaben, jeweils ohne die
Zahlen verglichen. Übrig bleibt die **Form** der Aufgabe, z. B.
„Bruch plus Bruch" oder „Zahl durch Summe mit $x$".

| Stufe | Verschiedene Formen | Häufigste Form | Dieselbe Form schon unter den 4 Aufgaben davor |
| --- | --- | --- | --- |
| 1 | 5 | 64-mal | bei 127 von 200 Aufgaben |
| 2 | 39 | 19-mal | bei 29 von 200 |
| 3 | 9 | 31-mal | bei 83 von 200 |
| 4 | 31 | 17-mal | bei 33 von 200 |
| 5 | 34 | 15-mal | bei 26 von 200 |

Die Gründe:
- **Feste Vorlagen:** Jede Stufe hat nur zwei bis sechs Vorlagen mit je ein
  paar Unterarten. Darin ändern sich nur die Zahlen.
- **Immer gleich gebaut:** fast immer genau zwei Brüche, fast immer $x$,
  Nenner fast immer $x \pm$ Zahl.
- **Kein Gedächtnis:** Die App weiß nicht, welche Aufgabe du gerade hattest.
  Dieselbe Form kann direkt noch einmal kommen.

### Was dagegen hilft

1. **Baukasten statt fester Vorlagen.** Jede Aufgabe wird aus Bausteinen
   zusammengesetzt:
   - zwei bis vier Brüche
   - die vier Rechenarten gemischt, mit Punkt vor Strich und Klammern
   - verschiedene Arten von Nennern: Zahl, Produkt wie $6a^2b$, $2x - 6$,
     $x^2 - 9$, $x^2 - 5x + 6$, $2x^2 - x - 3$, $ax - ay + bx - by$
   - viele Buchstaben statt nur $x$
   - Bausteine wie $e^x$, $\ln x$, $\sin x$, $\sqrt{x}$

   Was in welcher Stufe vorkommt, steht unten.
2. **Abwechslung beim Ziehen.** Die App merkt sich die Formen deiner
   letzten zehn Aufgaben je Thema und Stufe. Eine neue Aufgabe hat eine
   andere Form.
3. **Messen statt hoffen.** Ein Test prüft die Abwechslung bei jeder Änderung:
   - Je Stufe gibt es unter 200 Aufgaben mindestens 100 verschiedene Formen.
   - Keine Form kommt in mehr als 3 von 100 Aufgaben vor.
   - In zehn Aufgaben nacheinander kommt keine Form doppelt.

### Die Stufen neu

Rechnungen und Lösungen kommen wie immer aus der Engine. Die Beispiele zeigen
nur die Art der Aufgaben.

**Stufe 1: Zahlenbrüche, sicher rechnen**
- bis zu vier Brüche, alle vier Rechenarten gemischt, Punkt vor Strich,
  Klammern
- ganze Zahlen, negative Brüche, Dezimalzahlen wie $0{,}75$
- große Zahlen kürzen, Doppelbruch aus Zahlen

$\frac{3}{4} - \frac{2}{3} \cdot \frac{9}{8}$ ·
$\left(\frac{5}{6} - \frac{3}{4}\right) : \frac{7}{12}$ ·
$0{,}75 + \frac{5}{6} - 2$ ·
$\frac{\frac{3}{4} - \frac{1}{6}}{\frac{7}{8}}$ ·
$\frac{84}{126}$ ·
$-\frac{2}{5} \cdot \left(\frac{1}{4} - \frac{3}{2}\right)$

**Stufe 2: Buchstaben in Produkten**
- viele verschiedene Buchstaben, Hochzahlen, Minuszeichen
- Hauptnenner aus Produkten wie $6a^2b$ und $4ab^3$, auch bei drei Brüchen
- Mal und Geteilt gemischt, Kürzen über Kreuz

$\frac{5}{6a^2b} - \frac{3}{4ab^3} + \frac{1}{3b}$ ·
$\frac{12m^3n}{18mn^4} \cdot \frac{9n^2}{4m}$ ·
$\frac{3x}{4y} : \frac{9x^2}{8y^3} - \frac{2}{3x}$ ·
$\frac{-15r^2s^3t}{25rs^5t^2}$ ·
$\frac{u}{v} - \frac{v}{u} + 2$

**Stufe 3: Summen in Zähler und Nenner**
- ausklammern, auch Buchstaben ($ab - b^2$)
- alle drei binomischen Formeln
- vertauschte Differenzen wie $b - a$ und $a - b$
- Nenner wie $2x - 6$, $x^2 - 9$, $a + b$, auch drei Brüche
- kürzen, Plus und Minus, Mal und Geteilt

$\frac{a^2 - b^2}{ab - b^2}$ ·
$\frac{4x^2 - 12x + 9}{6x - 9}$ ·
$\frac{3}{2x - 6} - \frac{x}{x^2 - 9}$ ·
$\frac{2a}{a - b} + \frac{a + b}{b - a}$ ·
$\frac{x + 1}{x - 1} - \frac{x - 1}{x + 1}$ ·
$\frac{x^2 - 4}{3x} \cdot \frac{6x^2}{x^2 + 4x + 4}$

**Stufe 4: Zerlegen und Doppelbrüche**
- $x^2 + px + q$ zerlegen, auch mit Zahl vorn ($2x^2 - x - 3$) und mit zwei
  Buchstaben ($a^2 - ab - 2b^2$)
- in Gruppen ausklammern: $ax - ay + bx - by$
- Hauptnenner aus drei zerlegten Nennern
- Mal und Geteilt mit Zerlegen und Kürzen
- Doppelbrüche mit Buchstaben
- Bausteine $e^x$, $\ln x$, $\sin x$, $\cos x$

$\frac{2x^2 - x - 3}{x^2 - 1}$ ·
$\frac{x^2 - 5x + 6}{x^2 - 9} : \frac{x - 2}{x^2 + 3x}$ ·
$\frac{1}{x^2 - 3x + 2} + \frac{1}{x^2 - 4x + 3} - \frac{2}{x^2 - 5x + 6}$ ·
$\frac{ax - ay + bx - by}{x^2 - y^2}$ ·
$\frac{\frac{1}{a} - \frac{1}{b}}{\frac{1}{a^2} - \frac{1}{b^2}}$ ·
$\frac{e^{2x} - 1}{e^{2x} + 2e^x + 1}$

**Stufe 5: Profi, kaum noch schwerer, quer durch das ganze Thema**
- **Alles ineinander:** alles aus den Stufen 1 bis 4 verschachtelt, drei
  Rechenarten in einer Aufgabe, Doppelbruch im Doppelbruch, mehrere
  Buchstaben.
- **Differenzenquotienten:** $\frac{f(x + h) - f(x)}{h}$ für
  $f(x) = x^3$, $\frac{1}{x^2}$, $\frac{x}{x + 1}$ und $\sqrt{x}$ (bei
  $\sqrt{x}$ mit der dritten binomischen Formel erweitern).
- **Dritte Potenzen:** $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$, ebenso
  $a^3 + b^3$.
- **Wurzeln im Nenner beseitigen**, auch mit zwei Wurzeln:
  $\frac{x - a}{\sqrt{x} - \sqrt{a}}$.
- **Winkelfunktionen, e-Funktion und $\ln$** gemischt.
- **Partialbruchzerlegung (Brüche rückwärts):** einen Bruch in einfache
  Brüche zerlegen, z. B. $\frac{5x - 1}{x^2 - x - 2}$ in
  $\frac{A}{x - 2} + \frac{B}{x + 1}$. Auch mit doppeltem Faktor im Nenner
  und mit Polynomdivision vorweg. Das brauchst du später beim Integrieren.
- **Brüche aus späteren Kapiteln** deines Buchs:
  - komplexe Zahlen teilen, mit dem konjugiert Komplexen erweitern:
    $\frac{3 + 4\mathrm{i}}{1 - 2\mathrm{i}}$, $\frac{1}{a + b\,\mathrm{i}}$ (Kapitel 3)
  - Grenzwerte von Brüchen: durch die höchste Potenz kürzen,
    $\lim_{n \to \infty} \frac{3n^2 - n}{2n^2 + 5}$, oder erst zerlegen und
    kürzen, $\lim_{x \to 2} \frac{x^2 - 4}{x^2 - 3x + 2}$ (Kapitel 4 und 5)
  - Teleskopsummen mit Partialbrüchen:
    $\sum_{k=1}^{n} \frac{1}{k(k + 1)}$ (Kapitel 4)
  - Hyperbelfunktionen mit $\cosh^2 x - \sinh^2 x = 1$:
    $\frac{1}{\cosh x - \sinh x}$ (Kapitel 2)

$\left(\frac{a}{a - b} - \frac{b}{a + b}\right) : \frac{a^2 + b^2}{a^2 - b^2} + \frac{2b}{a - b}$ ·
$\frac{\frac{1}{(x + h)^2} - \frac{1}{x^2}}{h}$ ·
$\frac{a^3 - b^3}{a^2 - b^2}$ ·
$\frac{x - a}{\sqrt{x} - \sqrt{a}}$ ·
$\frac{1}{1 - \frac{1}{1 - \frac{1}{x}}}$ ·
$\frac{\sin x}{1 - \cos x} + \frac{1 - \cos x}{\sin x}$ ·
$\frac{5x - 1}{x^2 - x - 2}$ zerlegen ·
$\frac{2 - \mathrm{i}}{3 + 4\mathrm{i}}$ ·
$\lim_{x \to 3} \frac{x^2 - 9}{x^2 - 2x - 3}$

### Neue typische Fehler (Vorschlag)

Dazu kommen die bisherigen Fehler aus M2 (Liste in
[PLAN-M2.md](PLAN-M2.md)).

| Wo | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Punkt vor Strich | von links nach rechts gerechnet | $\frac{1}{2} + \frac{1}{2} \cdot \frac{2}{3} = \frac{2}{3}$ |
| Klammer mit Minus | Minus nur auf den ersten Bruch | $\frac{1}{2} - \left(\frac{1}{3} - \frac{1}{4}\right) = \frac{1}{2} - \frac{1}{3} - \frac{1}{4}$ |
| Dezimalzahl | Stellen falsch gezählt | $0{,}75 = \frac{75}{10}$ |
| Zerlegen mit Zahl vorn | Zahl vorn vergessen | $2x^2 - x - 3 = (x + 1)\left(x - \frac{3}{2}\right)$ |
| In Gruppen ausklammern | Vorzeichen in der zweiten Gruppe | $ax - ay - bx + by = a(x - y) - b(x + y)$ |
| Dritte Potenz | wie ein Quadrat zerlegt | $a^3 - b^3 = (a - b)(a^2 + b^2)$ |
| Wurzel im Nenner | die Zahl beim Erweitern nicht quadriert | $\frac{1}{\sqrt{x} - 2} = \frac{\sqrt{x} + 2}{x - 2}$ |
| Partialbrüche | doppelten Faktor nur einmal angesetzt | $\frac{1}{(x - 1)^2(x + 1)} = \frac{A}{x - 1} + \frac{B}{x + 1}$ |
| Partialbrüche | beim Einsetzen das Vorzeichen verloren | $A = \frac{5 \cdot 2 - 1}{2 - 1}$ statt $\frac{5 \cdot 2 - 1}{2 + 1}$ |
| Partialbrüche | Polynomdivision vergessen | Zähler mit höherem Grad direkt zerlegt |

Die genaue Liste kommt im jeweiligen Schritt; jede Regel bekommt wie immer
eine Erklärung, eine Lernkarte und Tests.

### Schritte

Jeder Schritt lässt sich einzeln ausprobieren. Die alten Aufgaben-Nummern
zeigen danach andere Aufgaben (das betrifft nur Links auf einzelne Aufgaben;
dein Fortschritt bleibt).

#### Schritt 1: Baukasten, Abwechslung, Stufen 1 und 2
- Die Engine rechnet Aufgaben mit beliebig vielen Brüchen, Punkt vor Strich
  und Klammern: Schritt für Schritt von innen nach außen, geführt und frei.
- Die App merkt sich deine letzten Formen und wechselt ab.
- Stufen 1 und 2 neu, mit den neuen Fehlern zu Punkt vor Strich, Klammer
  und Dezimalzahl.

**Ausprobieren:** In Stufe 1 und 2 je zehnmal „Nächste Aufgabe": keine Form
doppelt, mal zwei, mal drei oder vier Brüche.

#### Schritt 2: Stufen 3 und 4
- Mehr Arten zu zerlegen: Zahl vorn, zwei Buchstaben, in Gruppen
  ausklammern, vertauschte Differenzen
- drei Nenner; Mal und Geteilt mit Zerlegen
- neue Lernkarten: „Zerlegen mit Zahl vorn", „In Gruppen ausklammern"

**Ausprobieren:** $\frac{2x^2 - x - 3}{x^2 - 1}$ geführt, dann zehn Aufgaben
der Stufe 4 frei.

#### Schritt 3: Stufe 5, Teil 1: alles ineinander
- verschachtelte Aufgaben mit drei Rechenarten
- Differenzenquotienten
- dritte Potenzen
- Wurzeln mit mehreren Buchstaben
- Winkelfunktionen, $e$ und $\ln$ gemischt
- neue Lernkarten: „Dritte Potenzen", „Wurzeln im Nenner beseitigen"

**Ausprobieren:** $\frac{x - a}{\sqrt{x} - \sqrt{a}}$ und ein
Differenzenquotient in beiden Arten (geführt und frei).

#### Schritt 4: Stufe 5, Teil 2: Partialbruchzerlegung
- **Geführt:**
  1. Nenner zerlegen
  2. Ansatz wählen
  3. $A$, $B$, $C$ bestimmen: Nullstellen einsetzen, bei doppeltem
     Faktor zusätzlich Koeffizienten vergleichen
  4. Ergebnis
- Vorweg bei Bedarf eine Polynomdivision.
- **Frei:** Du tippst die Summe der einfachen Brüche ein; die App prüft Wert
  und Form.
- Neue Lernkarten: „Partialbruchzerlegung" und „Polynomdivision".

**Ausprobieren:** $\frac{5x - 1}{x^2 - x - 2}$ geführt, dann
$\frac{x^2 + 1}{(x - 1)^2(x + 2)}$ frei.

#### Schritt 5: Stufe 5, Teil 3: Brüche aus späteren Kapiteln
- komplexe Zahlen teilen
- Grenzwerte von Brüchen
- Teleskopsummen
- Hyperbelfunktionen
- neue Lernkarten (kurz): „Komplexe Zahlen teilen", „Grenzwerte von
  Brüchen", „Teleskopsummen", „Hyperbelfunktionen"

**Ausprobieren:** $\frac{3 + 4\mathrm{i}}{1 - 2\mathrm{i}}$ und
$\lim_{n \to \infty} \frac{3n^2 - n}{2n^2 + 5}$ in beiden Arten.

#### Schritt 6: Gezieltes Üben, Feinschliff, Abschluss
- Jeder neue Fehler lässt sich aus der Lernkarte und dem Fortschritt gezielt
  üben.
- Die Formel-Galerie zeigt je Stufe, wie viele Formen es gibt.
- Design-Durchgang, Offline-Test, Doku, M2b abhaken.

### Und danach

1. **Gleichungen umstellen:** Die Stufen 1 bis 3 bekommen denselben Baukasten
   und dieselbe Abwechslung. Danach geht M3 mit den Schritten 4 bis 7
   weiter, gleich mit Abwechslung gebaut. Die Partialbruchzerlegung aus
   Schritt 4 nutzt dort das Integral in Stufe 5.
2. **Ableiten:** Abwechslung und Stufe 5 auf Profi-Niveau (eigener Plan).

### Deine Antworten
1. Partialbruchzerlegung und Polynomdivision in Stufe 5: ja, dazu Themen aus
   späteren Kapiteln (Schritt 5).
2. Mindestens 100 Formen je Stufe.

---

## Teil B: Technischer Bauplan

### Baukasten (`src/engine/fraction/build/`)
- **Rechenbaum statt fester Formen:** Eine neue Aufgabenform `tree` mit
  Knoten für Plus/Minus (beliebig viele Summanden), Mal, Geteilt, Klammer
  und Doppelbruch; Blätter sind Bruchteile (`Part`). Die bisherigen Formen
  (`sum`, `product`, `quotient`, `complex`, `mixed`, `nested`) werden zu
  Sonderfällen und bleiben für alte Vorlagen lesbar, bis Schritt 3 sie
  ablöst.
- **Rechenweg** (`solve.ts`): erst Dezimalzahlen in Brüche, dann den Baum von
  innen nach außen. Klammern zuerst, Punkt vor Strich. Je Knoten die
  bekannten Schritte (Hauptnenner, erweitern, zusammenfassen, malnehmen und
  kürzen, Kehrwert). Zum Schluss einmal kürzen.
- **Bausteine für Nenner und Zähler** als kleine Erzeuger mit Art-Kennung:
  - `number`, `monomial`
  - `linear` (auch $2x - 6$ und mit zwei Buchstaben)
  - `squares` (dritte binomische Formel), `square` (erste und zweite)
  - `trinomial` (auch mit Zahl vorn), `grouping`
  - `cubes`, `root`, `block` ($e^x$, $\ln x$, $\sin x$, $\cos x$)

  Jede Stufe legt fest, welche Arten, wie viele Brüche, welche
  Rechenarten und welche Buchstaben vorkommen.
- **Buchstaben:** alle Kleinbuchstaben außer $e$ und $i$. Je Aufgabe ein bis
  drei, zufällig gewählt. Die inneren Namen der Bausteine (`E`, `L`, `S`,
  `C`, `R`) bleiben Großbuchstaben.
- **Filter wie bisher:** Ergebnis nicht 0, ab Stufe 2 mit Buchstabe, Zahlen
  klein, kein Nenner, der überall 0 ist. Neu: Länge der Aufgabe am Handy
  begrenzt (`FitWidth` darf nicht unter 70 % gehen).

### Abwechslung
- **Form einer Aufgabe** (`fractionForm(task)`): der Rechenbaum ohne Zahlen,
  Buchstaben nach ihrer Reihenfolge benannt, Vorzeichen zusammengefasst, je
  Bruchteil die Art von Zähler und Nenner.
- **Ziehen:** Bei einer neuen Aufgabe probiert die App Aufgaben-Nummern, bis
  die Form nicht unter den letzten zehn Formen dieser Stufe ist (höchstens
  50 Versuche). Das geschieht auf der Übungsseite, wenn die Engine ohnehin
  geladen ist.
- **Speicher:** Liste der letzten Formen je Thema und Stufe im
  Fortschritt. Ältere Speicherstände ohne diese Liste funktionieren weiter
  (Version 3 bleibt, das Feld ist optional).
- **Test** (`fractionTerms.test.ts`): Kennzahlen aus Teil A je Stufe, über
  feste Aufgaben-Nummern, damit der Test stabil ist.
- Später für alle Themen: dieselbe Kennzahl (`formOf` je Engine) und
  dasselbe Ziehen, deshalb gemeinsam in `src/engine/tasks/variety.ts`.

### Brüche aus späteren Kapiteln (Schritt 5)
- **Komplexe Zahlen:** $\mathrm{i}$ als eigenes Zeichen der Bruch-Engine mit
  $\mathrm{i}^2 = -1$ (wie $(\sqrt{x})^2 = x$); Endform $a + b\,\mathrm{i}$,
  Gegenprobe mit komplexen Zahlen.
- **Grenzwerte:** $n \to \infty$ über die höchsten Potenzen von Zähler und
  Nenner; $x \to a$ mit $\frac{0}{0}$: zerlegen, kürzen, einsetzen.
  Gegenprobe: großes $n$ bzw. $x$ nahe $a$ einsetzen.
- **Teleskopsummen:** Partialbrüche, dann heben sich die Summanden bis auf
  den ersten und den letzten weg. Gegenprobe: Teilsummen ausrechnen.
- **Hyperbelfunktionen:** Bausteine $\sinh x$, $\cosh x$ mit
  $\cosh^2 x - \sinh^2 x = 1$, wie bei $\sin$ und $\cos$.

### Partialbruchzerlegung (`src/engine/fraction/partial.ts`)
- Eingabe: Bruch aus Polynomen in $x$ mit Nenner aus Linearfaktoren (auch
  doppelt). Bei Zählergrad ≥ Nennergrad vorweg die Polynomdivision.
- Ansatz je Faktor, Bestimmung über Nullstellen-Einsetzen. Bei doppelten
  Faktoren zusätzlich ein Koeffizientenvergleich. Exakt mit `rational.ts`.
- Gegenprobe: die Zerlegung wieder zusammenfassen (Bruch-Engine), Ergebnis
  gleich der Aufgabe.
- Freier Modus (`check/partialAnswer.ts`): Wert gleich? Jeder Summand ein
  echter Bruch mit Linearfaktor (bzw. dessen Quadrat) im Nenner, Zähler
  eine Zahl? Sonst typischer Fehler.

### Geführt und frei
- `guided/fractionPlan.ts` bekommt Schritte je Knoten des Rechenbaums. Die
  Fragen wie bisher („Was ist der Hauptnenner?", „Was kommt heraus?"), dazu
  „Was rechnest du zuerst?", wenn Punkt vor Strich oder Klammern zählen.
- Freier Modus wie bisher (`check/fractionAnswer.ts`); Diagnose zusätzlich
  mit den neuen Fehlern. Tastatur mit den Buchstaben der Aufgabe (bis zu
  drei) wie beim Umstellen.

### Tests
- **Je Stufe tausende Zufallsaufgaben:**
  - Ergebnis gegen den unabhängig gerechneten Wert (`taskFrac`)
  - jeder Schritt mit demselben Wert
  - Endform fertig
  - falsche Antworten nie richtig
  - alles von KaTeX setzbar
  - am Handy nicht zu breit
- **Abwechslung:** Kennzahlen aus Teil A.
- **Jede Fehlerregel:** Katalogbeispiel, eigener Text, Lernkarte.
- **Browser-Tests:** je Stufe eine Aufgabe geführt und frei, zehnmal
  „Nächste Aufgabe" ohne doppelte Form, offline.

### Fertig heißt (pro Schritt)
- Tests, Typprüfung und Build ohne Fehler.
- Im Browser geprüft in Handy- und Laptopgröße, hell und dunkel.
- Commit und Push, ROADMAP abgehakt.
- Kurze Nachricht an dich, was du ausprobieren kannst.

## Bekannte Risiken
- **Alte Aufgaben-Nummern ändern sich:** Eine gespeicherte Nummer zeigt
  danach eine andere Aufgabe. Der Fortschritt zählt weiter, nur
  Lesezeichen auf einzelne Aufgaben passen nicht mehr.
- **Lange Aufgaben am Handy:** Mit vier Brüchen und Klammern wird es breit.
  Deshalb ist die Länge begrenzt, und Browser-Tests prüfen, dass nichts
  herausragt.
- **Geführter Modus bei großen Aufgaben:** Viele kleine Schritte wären
  ermüdend. Ab Stufe 4 werden Routineschritte zusammengefasst, wie bisher
  (Erweitern und Zusammenfassen in einem Schritt).
