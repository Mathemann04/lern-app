# Plan für Meilenstein 3: Gleichungen umstellen

Status: **Entwurf, 2. Fassung** (30.10.2026), wartet auf deine Freigabe.

Ziel von M3: Du kannst Gleichungen geführt und frei nach einer Variablen
auflösen, in 5 Stufen von $y = \frac{3(x - a)}{b} + c$ bis
$y = \frac{e^x - e^{-x}}{2}$, mit Erklärungen, Lernkarten, Fortschritt und
gezieltem Üben. Das Thema „Gleichungen umstellen" im Gebiet „Grundlagen"
wird spielbar.

Teil A beschreibt in einfachen Worten, was in welcher Reihenfolge entsteht.
Teil B ist der technische Bauplan.

Geändert gegenüber der 1. Fassung (deine Rückmeldung):
- **Deutlich schwerere Aufgaben**, vor allem in Stufe 5 (e-Funktion, $\ln$,
  Substitution, $pq$-Formel).
- **Mathe und Physik getrennt:** M3 ist reine Mathematik mit $x$, $y$ und
  Buchstaben wie $a$, $b$, $c$, $k$. Formeln mit Zeichen der Physik
  ($R_1$, $v_0$, $\alpha$) kommen in M6 ins Fach Physik, zusammen mit
  deiner Idee „Aufgabe lesen, Formel wählen, umstellen".

---

## Teil A: Was entsteht

### Mathe und Physik: wie es zusammenpasst

Auf der Startseite gibt es die Fächer Mathe und Physik schon. Vorschlag für
die Aufteilung:

| Wo | Thema | Was du übst | Wann |
| --- | --- | --- | --- |
| Mathe → Grundlagen | Brüche | Bruchterme kürzen, zusammenfassen, Doppelbrüche | fertig (M2) |
| Mathe → Grundlagen | **Gleichungen umstellen** | Nach einer Variablen auflösen: das Handwerk, mit $x$, $y$, $a$, $b$, $c$, $k$ | **M3** |
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
  $a$, $b$, $c$, $d$, $k$, $m$. Aufgelöst wird meist nach $x$, manchmal
  nach einem der Buchstaben (z. B. nach $a$).
- **Eindeutige Lösung:** Jede Aufgabe nennt ihre Bedingungen, z. B. „alle
  Buchstaben sind positiv" oder „$x > a$". Dadurch gibt es kein $\pm$ beim
  Wurzelziehen und nie eine Division durch 0. Eintippen musst du die
  Bedingungen nicht.
- **Schwierigkeit wie in der Klausur:** Ab Stufe 2 kommt die Variable
  mehrfach vor, ab Stufe 3 in Brüchen, ab Stufe 4 unter Wurzeln und in
  Umkehrfunktionen, in Stufe 5 in der e-Funktion und im Quadrat.

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

**Stufe 3: Brüche, in denen die Variable mehrfach vorkommt**

| Aufgabe | Lösung |
| --- | --- |
| $y = \frac{2x + 1}{x - 3}$ nach $x$ | $x = \frac{3y + 1}{y - 2}$ |
| $\frac{1}{x} + \frac{1}{a} = \frac{1}{b}$ nach $a$ | $a = \frac{bx}{x - b}$ |
| $\frac{x + a}{x - a} = b$ nach $x$ | $x = \frac{ab + a}{b - 1}$ |
| $\frac{a}{x + b} = \frac{c}{x - b}$ nach $x$ | $x = \frac{b(a + c)}{a - c}$ |
| $\frac{x}{a} + \frac{x}{b} = 1$ nach $x$ | $x = \frac{ab}{a + b}$ |

**Stufe 4: Wurzeln, Potenzen und Umkehrfunktionen**

| Aufgabe | Lösung |
| --- | --- |
| $y = \sqrt{\frac{x + a}{x - a}}$ nach $x$ | $x = \frac{a(y^2 + 1)}{y^2 - 1}$ |
| $y = a\sqrt{b^2 - x^2}$ nach $x$ | $x = \frac{\sqrt{a^2 b^2 - y^2}}{a}$ |
| $y = \left(\frac{ax + b}{c}\right)^3$ nach $x$ | $x = \frac{c\sqrt[3]{y} - b}{a}$ |
| $\sqrt{x + a} = \sqrt{x} + b$ nach $x$ (zweimal quadrieren) | $x = \left(\frac{a - b^2}{2b}\right)^2$ |
| $y = a \arctan\frac{x}{b} + c$ nach $x$ | $x = b \tan\frac{y - c}{a}$ |

**Stufe 5: e-Funktion, $\ln$, Substitution und $pq$-Formel**

| Aufgabe | Lösung |
| --- | --- |
| $y = \frac{a}{1 + b e^{-kx}}$ nach $x$ | $x = \frac{1}{k} \ln\frac{by}{a - y}$ |
| $y = \ln\frac{x + a}{x - a}$ nach $x$ | $x = \frac{a(e^y + 1)}{e^y - 1}$ |
| $y = \frac{a e^{kx} - b}{e^{kx} + c}$ nach $x$ | $x = \frac{1}{k} \ln\frac{b + cy}{a - y}$ |
| $y = x(x + a)$ nach $x$ | $x = \frac{\sqrt{a^2 + 4y} - a}{2}$ |
| $y = \frac{e^x - e^{-x}}{2}$ nach $x$ (mit $u = e^x$) | $x = \ln\left(y + \sqrt{y^2 + 1}\right)$ |

Alle Lösungen in diesen Tabellen habe ich nachgerechnet: $x$ und die
Buchstaben zufällig gewählt, $y$ ausgerechnet, die Lösung liefert wieder
dasselbe $x$. In der App kommen alle Aufgaben und Lösungen aus der Engine,
mit Zufallszahlen und Aufgaben-Nummer wie bei den Brüchen.

Bewusst nicht in M3:
- **Logarithmusgesetze** wie $\ln(ab) = \ln a + \ln b$: kommen mit M4. In
  Stufe 5 brauchst du nur $\ln(e^z) = z$, $e^{\ln z} = z$ und
  $-\ln z = \ln\frac{1}{z}$.
- **Gleichungssysteme** (mehrere Gleichungen gleichzeitig): später.

### So läuft eine Aufgabe ab

**Geführt:**
- **Stufen 1 und 2:** Je Umformung zwei Fragen.
  - „Was machst du als Nächstes?" Die Antworten sind Umformungen wie
    „auf beiden Seiten $-c$", „beide Seiten mal $(x - 3)$", „$x$
    ausklammern". Falsche Antworten sind typische Irrwege.
  - „Was kommt heraus?" Die Antworten sind die Gleichung nach der
    Umformung. Die falschen entstehen aus typischen Fehlern.
- **Ab Stufe 3:** Routine-Umformungen fragt die App nur noch als „Was kommt
  heraus?". „Was machst du als Nächstes?" kommt nur noch an den Weichen:
  mit dem Nenner malnehmen, alles mit $x$ auf eine Seite, ausklammern,
  quadrieren, $\ln$ anwenden, substituieren, welche Lösung passt.
- Wie gewohnt: ein Tipp vor der Antwort, „Warum ist das falsch?" nach einer
  falschen Antwort, unter „Bisher" die Gleichungen von oben nach unten.

**Frei:** Du tippst das Ergebnis ein, z. B. $x = \frac{3y + 1}{y - 2}$
(oder nur die rechte Seite).
- Richtig ist jede gleichwertige Form, die fertig ist.
- Steht $x$ rechts noch, sagt die App: „Noch nicht aufgelöst: $x$ steht
  auch rechts." Das zählt nicht als Fehler.
- Typische Fehler werden erkannt und benannt.
- Die Mathe-Tastatur hat die Buchstaben der Aufgabe und je nach Stufe
  Wurzel, $e^{\square}$, $\ln$, $\tan$, $\arctan$.

### Beispiel: So sieht eine geführte Aufgabe in Stufe 5 aus

Aufgabe: Löse $y = \frac{e^x - e^{-x}}{2}$ nach $x$ auf.

1. **Beide Seiten mal 2:** $2y = e^x - e^{-x}$
2. **Was machst du als Nächstes?**
   - Richtig: „Setze $u = e^x$" ✓
   - Falsch: „$\ln$ auf beiden Seiten" (führt zu $\ln$ einer Differenz,
     die sich nicht auseinanderziehen lässt)
3. **Was kommt heraus?** Mit $e^{-x} = \frac{1}{u}$:
   - Richtig: $2y = u - \frac{1}{u}$ ✓
   - Falsch: $2y = u + u$ (Minus im Exponenten als Minus vor dem Term
     gelesen)
4. **Mal $u$ und ordnen:** $u^2 - 2yu - 1 = 0$
5. **$pq$-Formel:**
   - Richtig: $u = y \pm \sqrt{y^2 + 1}$ ✓
   - Falsch: $u = -y \pm \sqrt{y^2 + 1}$ (Vorzeichen von $p$ nicht
     gewechselt), $u = y \pm \sqrt{y^2 - 1}$ (Vorzeichen von $q$ falsch)
6. **Welche Lösung passt?**
   - Richtig: $u = y + \sqrt{y^2 + 1}$, denn $u = e^x$ ist immer positiv ✓
   - Falsch: $u = y - \sqrt{y^2 + 1}$ (diese Zahl ist immer negativ)
7. **Zurück zu $x$:**
   - Richtig: $x = \ln\left(y + \sqrt{y^2 + 1}\right)$ ✓
   - Falsch: $x = y + \sqrt{y^2 + 1}$ (nicht zurückgerechnet),
     $x = \ln y + \ln\sqrt{y^2 + 1}$ ($\ln$ einer Summe auseinandergezogen)

### Wann ist ein Ergebnis fertig?
- Die gesuchte Variable steht allein auf einer Seite, auf der anderen kommt
  sie nicht vor.
- Die andere Seite ist zusammengefasst, wie bei den Brüchen: ein Bruch
  (kein Bruch im Bruch), gekürzt.
- Gleichwertige Formen zählen alle, z. B. $\frac{d - b}{a - c}$ und
  $\frac{b - d}{c - a}$, oder $\frac{1}{k}\ln\frac{by}{a - y}$ und
  $-\frac{1}{k}\ln\frac{a - y}{by}$.

### Katalog der Fehlerregeln (Vorschlag)

| Umformung | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Rüberbringen | Vorzeichen nicht gewechselt | $y = x + b \Rightarrow x = y + b$ |
| Gegenoperation | mal statt geteilt | $y = ax \Rightarrow x = ay$ |
| Teilen | nur einen Summanden geteilt | $y = ax + b \Rightarrow \frac{y}{a} = x + b$ |
| Bruch | Bruch auf den Kopf gestellt | $y = \frac{a}{x} \Rightarrow x = \frac{y}{a}$ |
| Mit dem Nenner malnehmen | Klammer um den Nenner vergessen | $y = \frac{2x + 1}{x - 3} \Rightarrow yx - 3 = 2x + 1$ |
| Klammer | nur den ersten Summanden malgenommen | $a(x + b) \Rightarrow ax + b$ |
| Ausklammern | Variable steht noch auf beiden Seiten | $ax = b - cx \Rightarrow x = \frac{b - cx}{a}$ |
| Ausklammern | die 1 vergessen | $xy - x = 3y + 1 \Rightarrow x \cdot y = 3y + 1$ |
| Kehrwert | Kehrwert gliedweise genommen | $\frac{1}{x} + \frac{1}{a} = \frac{1}{b} \Rightarrow x + a = b$ |
| Wurzel | Wurzel gliedweise gezogen | $x^2 = b^2 - \frac{y^2}{a^2} \Rightarrow x = b - \frac{y}{a}$ |
| Quadrieren | nur einen Faktor quadriert | $y = a\sqrt{b^2 - x^2} \Rightarrow y^2 = a(b^2 - x^2)$ |
| Quadrieren | Mittelglied vergessen | $\left(\sqrt{x} + b\right)^2 = x + b^2$ |
| Umkehrfunktion | falsche Umkehrfunktion | $\arctan\frac{x}{b} = t \Rightarrow \frac{x}{b} = \arctan t$ |
| e-Funktion | $\ln$ vergessen | $e^{kx} = w \Rightarrow kx = w$ |
| e-Funktion | Minus im Exponenten verloren | $e^{-kx} = w \Rightarrow kx = \ln w$ |
| $\ln$ | durch $k$ im $\ln$ geteilt | $kx = \ln w \Rightarrow x = \ln\frac{w}{k}$ |
| $\ln$ | $\ln$ einer Summe auseinandergezogen | $\ln\left(1 + be^{-kx}\right) = \ln 1 + \ln\left(be^{-kx}\right)$ |
| $pq$-Formel | Vorzeichen von $p$ nicht gewechselt | $u^2 - 2yu - 1 = 0 \Rightarrow u = -y \pm \sqrt{y^2 + 1}$ |
| Lösung wählen | Lösung nicht geprüft | $u = e^x = y - \sqrt{y^2 + 1}$ (immer negativ) |
| Substitution | nicht zurückgerechnet | $x = y + \sqrt{y^2 + 1}$ statt $\ln\left(\ldots\right)$ |

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

#### Schritt 3: Stufen 3 und 4 geführt
- Brüche mit der Variable mehrfach, Kehrwerte, Wurzeln und Quadrieren
  (auch zweimal), Umkehrfunktionen.
- Zum Zusammenfassen einer Seite rechnet die Bruch-Engine aus M2 mit.
- Neue Lernkarten: Mit dem Nenner malnehmen, Kehrwert, Wurzel und Quadrat,
  Umkehrfunktionen.

**Ausprobieren:** $y = \frac{2x + 1}{x - 3}$ und
$\sqrt{x + a} = \sqrt{x} + b$ geführt lösen.

#### Schritt 4: Freier Modus
- Ergebnis eintippen, Tastatur mit den Buchstaben der Aufgabe.
- Hinweis, wenn $x$ noch auf beiden Seiten steht oder die rechte Seite noch
  nicht zusammengefasst ist.
- Typische Fehler werden erkannt und benannt, der Lösungsweg lässt sich
  aufdecken.

**Ausprobieren:** $y = \sqrt{\frac{x + a}{x - a}}$ frei lösen, einmal
richtig, einmal mit „Wurzel gliedweise gezogen".

#### Schritt 5: Stufe 5 geführt und frei
- e-Funktion und $\ln$, Substitution $u = e^x$, $pq$-Formel und die Wahl
  der passenden Lösung.
- Neue Lernkarten: e-Funktion und $\ln$, Substitution, $pq$-Formel.

**Ausprobieren:** $y = \frac{e^x - e^{-x}}{2}$ in beiden Modi.

#### Schritt 6: Gezieltes Üben, Feinschliff, Abschluss von M3
- „Deine häufigsten Fehler" mit „Gezielt üben" auch fürs Umstellen.
- Design-Durchgang, Offline-Test, Doku, M3 abhaken.

Pro Sitzung schaffen wir etwa ein bis zwei Schritte.

### Offene Fragen an dich
1. Passt die Aufteilung Mathe („Gleichungen umstellen", M3) und Physik
   („Formeln umstellen" und „Aufgaben lösen", M6)? Soll „Einheiten
   umrechnen" ein eigenes Thema in Physik werden?
2. Passt die Schwierigkeit der Stufen? Wenn du Aufgaben aus deinen
   Übungsblättern hast, die vorkommen sollen, schick sie mir. Dann nehme
   ich sie als Vorlagen auf.

---

## Teil B: Technischer Bauplan

### Umstell-Engine (`src/engine/rearrange/`)
1. **Aufgabe** (`task.ts`): Gleichung (`Equation` aus `expr/types.ts`),
   gesuchte Variable, Bedingungen (alle Buchstaben positiv, dazu z. B.
   $x > a$). Schreibweise wie gestellt (Bruch, Wurzel und Klammer bleiben).
   Variablennamen sind beliebig, damit M6 dieselbe Engine mit $R_1$ oder
   $\alpha$ nutzen kann.
2. **Rechenweg** (`isolate.ts`): eine Folge von Umformungen, jede mit
   Operation und Gleichung danach:
   - auf beiden Seiten addieren bzw. subtrahieren
   - mit einem Term malnehmen bzw. durch ihn teilen (auch mit einem Nenner)
   - Kehrwert, Quadrieren, Wurzel ziehen, $\ln$ bzw. $e^{\square}$,
     Umkehrfunktion ($\tan$/$\arctan$, $\sin$/$\arcsin$, $\cos$/$\arccos$)
   - Klammer ausmultiplizieren, Variable ausklammern, eine Seite zu einem
     Bruch zusammenfassen
   - substituieren ($u = e^x$), $pq$-Formel, passende Lösung wählen,
     zurückrechnen
   - Seiten tauschen (die gesuchte Variable nach links)

   Vorgehen: Kommt die Variable einmal vor, werden die Operationen um sie
   herum von außen nach innen rückgängig gemacht. Kommt sie mehrfach vor:
   Nenner beseitigen, ausmultiplizieren, alles mit der Variable auf eine
   Seite, ausklammern, teilen. Ist sie danach quadratisch: $pq$-Formel.
3. **Endform** (`finish.ts`):
   - rationale Teile über die Bruch-Engine: ein Bruch, gekürzt, exakt
   - Teile ohne die gesuchte Variable, die keine Polynome sind ($e^y$,
     $\sqrt[3]{y}$, $\sqrt{a^2 + 4y}$, $\tan\frac{y - c}{a}$), zählen für die
     Bruch-Engine als eigene Zeichen, wie bisher $e^x$ oder $\sqrt{x}$
   - Wurzeln, $e$ und $\ln$ sonst über `expr/finalForm.ts`
4. **Fehlerregeln** (`errorRules.ts`, Ids `eq-…`): Jede Fehlerregel führt
   genau eine Umformung falsch aus, der Rest wird richtig gerechnet. Die
   falschen Ergebnisse werden gefiltert: nie gleichwertig zur Lösung, im
   selben Schritt nicht doppelt.
5. **Vorlagen** (`tasks/rearrangeTerms.ts`): Gleichungsformen je Stufe mit
   Zufallszahlen und Bedingungen, Aufgaben-Nummern wie gehabt („2-4711").

### Bruch-Engine
- **Buchstaben:** bisher nur $x$, $y$, $a$, $b$, $h$; neu alle
  Kleinbuchstaben außer $e$ (das ist die Eulersche Zahl).
- Die inneren Namen der Bausteine (`E`, `L`, `S`, `C`, `R`) sind
  Großbuchstaben und stören in M3 nicht. Umbenannt werden sie erst in M6,
  wenn Größen wie $R$ oder $C$ vorkommen.
- Alle Tests der Brüche laufen unverändert weiter.

### Prüfen
- **Gegenprobe ohne Rechenweg:** Erst werden die gesuchte Variable und die
  Buchstaben zufällig im erlaubten Bereich gewählt, dann die andere Seite
  ausgerechnet. Die Lösung muss den gewählten Wert zurückliefern. Das ist
  unabhängig vom Rechenweg und trifft nur Stellen, an denen die Bedingungen
  gelten.
- **Exakter Vergleich:** Bei rationalen Lösungen zusätzlich über die
  Bruch-Engine.
- **Jeder Schritt:** Die Gleichung nach dem Schritt hat an den Prüfstellen
  dieselbe Lösung wie die davor.
- **Freie Eingabe** (`check/rearrangeAnswer.ts`):
  - „$x = \ldots$" oder nur die rechte Seite
  - Steht die gesuchte Variable noch rechts: „noch nicht aufgelöst"
  - sonst gleichwertig zur Lösung? Dann fertig? (ein Bruch, gekürzt, kein
    Doppelbruch)
  - sonst: Vergleich mit den falschen Ergebnissen der typischen Fehler

### Oberfläche
- **Thema** `umstellen` in `catalog.ts` (Adresse bleibt `#/thema/umstellen`),
  neuer Titel „Gleichungen umstellen": Stufen mit Vorschau, `available`,
  `free`, `focus`, Lernkarten-Ordner.
- **Engine laden:** `courseEngines.ts` lädt die Umstell-Engine erst beim
  Üben (`planGuidedTask`, `prepareFree`).
- **Geführt:** Schrittplaner `guided/rearrangePlan.ts` mit den gemeinsamen
  Typen aus `guided/types.ts`, sonst wie bei den Brüchen.
  „Was machst du als Nächstes?" zeigt die Umformung als Formel, z. B.
  $\left| \cdot (x - 3)\right.$.
- **Tastatur:** Buchstaben der Aufgabe wie bei den Brüchen, dazu je nach
  Stufe Wurzel, dritte Wurzel, $e^{\square}$, $\ln$, $\tan$, $\arctan$.
- **Lernkarten:** Ordner „Gleichungen umstellen", Beispiele rechnet die
  Engine.
- **Galerie:** Umschalter „Ableiten / Brüche / Umstellen".
- **Speicher:** kein neues Format nötig, Fortschritt je Thema gibt es schon.

### Tests
- **Je Stufe tausende Zufallsaufgaben:**
  - Lösung durch Einsetzen gegengeprüft
  - jeder Schritt mit derselben Lösung
  - Endform fertig
  - falsche Antworten nie richtig
  - alles von KaTeX setzbar
- **Jede Fehlerregel:**
  - Katalogbeispiel in einem Test
  - eigener Text für „Warum ist das falsch?", der das Ergebnis nicht verrät
- **Lernkarten:** Jeder Fehler der spielbaren Stufen steht auf einer Karte
  und lässt sich dort gezielt üben.
- **Freie Eingabe:**
  - richtige Formen werden angenommen
  - „noch nicht aufgelöst" kommt an der richtigen Stelle
  - Fehler werden richtig benannt
- **Browser-Tests:** je Stufe eine Aufgabe geführt und frei, offline.

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
- **Mehrere gleich gute Endformen**, z. B. $\frac{d - b}{a - c}$ und
  $\frac{b - d}{c - a}$, oder $\frac{bx}{x - b}$ und
  $\frac{1}{\frac{1}{b} - \frac{1}{x}}$ (das zweite ist ein Doppelbruch,
  also noch nicht fertig). Der Vergleich ist mathematisch, die Prüfung auf
  „fertig" folgt den Regeln von oben.
- **Bedingungen:** Ohne sie wären manche Lösungen nicht eindeutig (zwei
  Lösungen der $pq$-Formel, $\pm$ bei Wurzeln). Die Aufgabe nennt sie,
  Prüfstellen liegen nur dort, wo sie gelten.
- **Zweimal quadrieren** kann Scheinlösungen erzeugen. Die Vorlagen sind so
  gewählt, dass die Lösung gilt; die Gegenprobe prüft das bei jeder Aufgabe.
- **Engine allgemein halten:** Damit M6 sie ohne Umbau nutzen kann, hängt
  nichts an bestimmten Buchstaben.
