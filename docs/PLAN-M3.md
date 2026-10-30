# Plan für Meilenstein 3: Formeln umstellen

Status: **Entwurf** (30.10.2026), wartet auf deine Freigabe.

Ziel von M3: Du kannst Formeln geführt und frei nach einer Größe umstellen,
in 5 Stufen von $F = m \cdot a$ bis $U = U_0\left(1 - e^{-\frac{t}{\tau}}\right)$,
mit Erklärungen, Lernkarten, Fortschritt und gezieltem Üben. Das Thema
„Formeln umstellen" im Gebiet „Grundlagen" wird spielbar.

Teil A beschreibt in einfachen Worten, was in welcher Reihenfolge entsteht.
Teil B ist der technische Bauplan.

---

## Teil A: Was entsteht

### Welche Formeln?

Vorschlag: vor allem Formeln aus Technik und Physik, wie sie dir im Studium
begegnen ($F = m \cdot a$, $p = \frac{F}{A}$, $E = \frac{1}{2} m v^2$,
$\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$). Dazu in jeder Stufe auch
Gleichungen mit $x$ und $y$, damit das Umstellen nicht an bestimmte Formeln
gebunden ist.

- **Ohne Einheiten:** Die kommen in M6 („Physik: Formeln umstellen, mit
  Einheiten").
- **Größen sind positiv**, wie in der Technik üblich (Masse, Länge, Zeit,
  Widerstand …). Deshalb gibt es beim Wurzelziehen kein $\pm$: Aus
  $v^2 = \frac{2E}{m}$ wird $v = \sqrt{\frac{2E}{m}}$.
- **Durch 0 wird nie geteilt.** Wo das nicht selbstverständlich ist, nennt
  die App die Bedingung, z. B. $R \neq R_2$.

### Stufen (Vorschlag)

| Stufe | Inhalt | Beispiele |
| --- | --- | --- |
| 1 | Ein Schritt: eine Gegenoperation, die gesuchte Größe steht oben | $F = m \cdot a$ nach $m$, $v = \frac{s}{t}$ nach $s$, $y = x + 5$ nach $x$ |
| 2 | Zwei oder drei Schritte, die Größe steht im Nenner | $v = \frac{s}{t}$ nach $t$, $s = s_0 + v \cdot t$ nach $t$, $p = \frac{F}{A}$ nach $A$, $y = 3x - 4$ nach $x$ |
| 3 | Quadrate, Wurzeln, Klammern | $E = \frac{1}{2} m v^2$ nach $v$, $A = \pi r^2$ nach $r$, $T = 2\pi\sqrt{\frac{l}{g}}$ nach $l$, $L = L_0(1 + \alpha\,\Delta T)$ nach $\alpha$ |
| 4 | Uni-Niveau: Die Größe kommt mehrfach vor (ausklammern), Brüche und Kehrwerte | $\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$ nach $R_1$, $L = L_0(1 + \alpha\,\Delta T)$ nach $L_0$, $a x + b = c x + d$ nach $x$, $y = \frac{2x + 1}{x - 3}$ nach $x$ |
| 5 | Profi: e-Funktion und $\ln$, Winkelfunktionen | $N = N_0\, e^{-\lambda t}$ nach $t$, $U = U_0\left(1 - e^{-\frac{t}{\tau}}\right)$ nach $t$, $F_x = F \cos\alpha$ nach $\alpha$ |

Bewusst nicht in M3:
- **Quadratische Gleichungen** mit $pq$-Formel (z. B.
  $s = v_0 t + \frac{1}{2} a t^2$ nach $t$): passen besser zu „weitere
  Themen aus MB1" (M5). Nach $v_0$ oder $a$ umstellen geht aber schon hier.
- **Gleichungssysteme** (mehrere Gleichungen gleichzeitig): später.
- **Logarithmusgesetze** wie $\ln(a \cdot b) = \ln a + \ln b$: kommen mit
  M4. In Stufe 5 brauchst du nur $\ln(e^x) = x$.

### So läuft eine Aufgabe ab

**Geführt:** Je Umformung zwei Fragen, ab Stufe 3 eine.
- „Was machst du als Nächstes?" Die Antworten sind Umformungen wie
  „auf beiden Seiten $-\frac{1}{R_2}$", „beide Seiten mal $t$",
  „Kehrwert auf beiden Seiten". Falsche Antworten sind typische Irrwege.
- „Was kommt heraus?" Die Antworten sind die Formel nach der Umformung. Die
  falschen Antworten entstehen aus typischen Fehlern, z. B. ein vergessener
  Vorzeichenwechsel.
- Ab Stufe 3 ist der Rechenweg gröber: Gefragt ist nur die Formel nach dem
  nächsten Schritt.
- Wie gewohnt gibt es einen Tipp vor der Antwort und „Warum ist das falsch?"
  nach einer falschen Antwort. Unter „Bisher" stehen die Formeln von oben
  nach unten.

**Frei:** Du tippst die umgestellte Formel ein, z. B.
$R_1 = \frac{R R_2}{R_2 - R}$ (oder nur die rechte Seite).
- Richtig ist jede gleichwertige Form, die fertig ist.
- Fertig heißt:
  - Die gesuchte Größe steht allein links und kommt rechts nicht mehr vor.
  - Die rechte Seite ist zusammengefasst: kein Bruch im Bruch, gekürzt.
- Steht die Größe rechts noch, sagt die App: „Noch nicht aufgelöst: $R_1$
  steht auch rechts." Das zählt nicht als Fehler.
- Typische Fehler werden erkannt und benannt.
- Die Mathe-Tastatur hat Tasten für die Größen der Formel, z. B. $R$, $R_1$,
  $R_2$ oder $\alpha$, damit du keine tiefgestellten Zeichen tippen musst.

### Beispiel: So sieht eine geführte Aufgabe aus

Aufgabe: Stelle $\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$ nach $R_1$ um.

1. **Was machst du als Nächstes?**
   - Richtig: auf beiden Seiten $-\frac{1}{R_2}$ ✓
   - Falsch:
     - „Kehrwert von jedem Summanden" (führt zu $R = R_1 + R_2$)
     - „nur rechts $-\frac{1}{R_2}$" (ändert man nur eine Seite, stimmt die
       Gleichung nicht mehr)
   - Erlaubte Umformungen, die nur nicht weiterführen (z. B. „beide Seiten
     mal $R$"), gelten nie als falsch und kommen deshalb nicht als falsche
     Antwort vor.
2. **Was kommt heraus?**
   - Richtig: $\frac{1}{R} - \frac{1}{R_2} = \frac{1}{R_1}$ ✓
   - Falsch: $\frac{1}{R} + \frac{1}{R_2} = \frac{1}{R_1}$ (Vorzeichen
     beim Rüberbringen nicht gewechselt)
3. **Fasse die linke Seite zu einem Bruch zusammen.** (wie bei den Brüchen)
   - Richtig: $\frac{R_2 - R}{R R_2} = \frac{1}{R_1}$ ✓
   - Falsch: $\frac{1}{R - R_2} = \frac{1}{R_1}$ (Nenner subtrahiert)
4. **Kehrwert auf beiden Seiten:**
   - Richtig: $R_1 = \frac{R R_2}{R_2 - R}$ ✓, gilt für $R \neq R_2$
   - Falsch: $R_1 = R - R_2$ (Kehrwert gliedweise genommen)

### Wann ist ein Ergebnis fertig?
- Die gesuchte Größe steht allein auf einer Seite, auf der anderen kommt
  sie nicht vor.
- Die andere Seite ist zusammengefasst, wie bei den Brüchen: ein Bruch
  (kein Bruch im Bruch), gekürzt, Klammern in Summen ausmultipliziert.
- Gleichwertige Formen zählen alle, z. B. $\frac{2E}{m}$ und
  $\frac{2}{m}E$, oder $\frac{R R_2}{R_2 - R}$ und
  $-\frac{R R_2}{R - R_2}$.
- Bei Wurzeln zählt $\sqrt{\frac{2E}{m}}$ genauso wie
  $\frac{\sqrt{2E}}{\sqrt{m}}$.

### Katalog der Fehlerregeln (Vorschlag)

| Umformung | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Rüberbringen | Vorzeichen nicht gewechselt | $y = x + b \Rightarrow x = y + b$ |
| Gegenoperation | falsche Gegenoperation (mal statt geteilt) | $F = m a \Rightarrow a = F \cdot m$ |
| Teilen | nur einen Summanden geteilt | $y = 2x + 4 \Rightarrow \frac{y}{2} = x + 4$ |
| Bruch | Bruch beim Auflösen auf den Kopf gestellt | $v = \frac{s}{t} \Rightarrow t = \frac{v}{s}$ |
| Kehrwert | Kehrwert gliedweise genommen | $\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2} \Rightarrow R = R_1 + R_2$ |
| Wurzel | Wurzel vergessen | $v^2 = \frac{2E}{m} \Rightarrow v = \frac{2E}{m}$ |
| Wurzel | Wurzel nur aus einem Teil gezogen | $v^2 = \frac{2E}{m} \Rightarrow v = \frac{\sqrt{2E}}{m}$ |
| Quadrieren | nur einen Faktor quadriert | $T = 2\pi\sqrt{\frac{l}{g}} \Rightarrow T^2 = 2\pi \frac{l}{g}$ |
| Klammer | durch den ersten Summanden der Klammer statt durch die Klammer geteilt | $L = L_0(1 + \alpha\,\Delta T) \Rightarrow L - 1 = L_0\,\alpha\,\Delta T$ |
| Ausklammern | Größe steht noch auf beiden Seiten | $a x = b - c x \Rightarrow x = \frac{b - c x}{a}$ |
| e-Funktion | $\ln$ vergessen | $e^{-\lambda t} = \frac{N}{N_0} \Rightarrow -\lambda t = \frac{N}{N_0}$ |
| Logarithmus | $\ln$ einer Differenz gliedweise | $\ln\left(1 - \frac{U}{U_0}\right) = \ln 1 - \ln\frac{U}{U_0}$ |
| Winkel | Kehrwert statt Umkehrfunktion | $\cos\alpha = \frac{F_x}{F} \Rightarrow \alpha = \frac{F}{F_x}$ |

Dazu kommen die bekannten Fehler aus „Brüche", wenn eine Seite zu einem
Bruch zusammengefasst wird (z. B. Zähler plus Zähler, Nenner plus Nenner).

Wenn dir typische Fehler aus deinen Übungen fehlen, sag es.

### Schritte

#### Schritt 1: Mathe-Engine fürs Umstellen
- Die Engine stellt Formeln Schritt für Schritt nach einer Größe um. Jeder
  Schritt wird mitgeschrieben: welche Umformung, und die Formel danach.
- Typische Fehler (Katalog oben) liefern die falschen Antworten.
- Aufgaben-Vorlagen für die Stufen 1 bis 3, mit Aufgaben-Nummer.
- Formeln mit tiefgestellten Zeichen ($R_1$, $v_0$) und griechischen
  Buchstaben ($\alpha$, $\lambda$, $\tau$) werden sauber gesetzt.
- Tests: Jede Lösung wird in die Ausgangsformel eingesetzt und an vielen
  Zahlenstellen geprüft.

**Ausprobieren:** In der Formel-Galerie gibt es „Umstellen" mit zufälligen
Aufgaben, Rechenweg und typischen falschen Ergebnissen.

#### Schritt 2: Thema freischalten, Stufen 1 und 2 geführt
- „Formeln umstellen" im Gebiet „Grundlagen" lässt sich öffnen und üben.
- Geführter Modus mit Erklärungen, Tipps und „Warum ist das falsch?".
- Neuer Lernkarten-Ordner „Formeln umstellen": Gegenoperation, Rüberbringen
  mit Vorzeichenwechsel, Größe im Nenner.
- Fortschritt und häufigste Fehler wie bei den anderen Themen.

**Ausprobieren:** Start → „Grundlagen" → „Formeln umstellen" → Stufe 1
üben, z. B. $v = \frac{s}{t}$ nach $t$.

#### Schritt 3: Stufen 3 und 4 geführt
- Quadrate und Wurzeln, Klammern, die Größe mehrfach (ausklammern),
  Kehrwerte.
- Zum Zusammenfassen einer Seite rechnet die Bruch-Engine aus M2 mit.
- Neue Lernkarten: Wurzel und Quadrat, Klammern, Ausklammern, Kehrwert.

**Ausprobieren:** $\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$ nach $R_1$
und $E = \frac{1}{2} m v^2$ nach $v$ geführt lösen.

#### Schritt 4: Freier Modus
- Ergebnis eintippen, Tastatur mit den Größen der Formel.
- Hinweis, wenn die gesuchte Größe noch auf beiden Seiten steht oder die
  rechte Seite noch nicht zusammengefasst ist.
- Typische Fehler werden erkannt und benannt, der Lösungsweg lässt sich
  aufdecken.

**Ausprobieren:** $L = L_0(1 + \alpha\,\Delta T)$ nach $L_0$ frei lösen,
einmal richtig, einmal mit dem Fehler „durch den ersten Summanden geteilt".

#### Schritt 5: Stufe 5 geführt und frei
- e-Funktion und $\ln$, Winkelfunktionen ($\arcsin$, $\arccos$,
  $\arctan$).
- Neue Lernkarten: e-Funktion und $\ln$, Umkehrfunktionen der
  Winkelfunktionen.

**Ausprobieren:** $U = U_0\left(1 - e^{-\frac{t}{\tau}}\right)$ nach $t$ in
beiden Modi.

#### Schritt 6: Gezieltes Üben, Feinschliff, Abschluss von M3
- „Deine häufigsten Fehler" mit „Gezielt üben" auch fürs Umstellen.
- Design-Durchgang, Offline-Test, Doku, M3 abhaken.

Pro Sitzung schaffen wir etwa ein bis zwei Schritte.

### Offene Fragen an dich
1. Passt die Mischung aus Formeln der Technik und Gleichungen mit $x$ und
   $y$, oder lieber nur eins davon?
2. Gibt es Formeln aus deinen Vorlesungen (MB1, Technische Mechanik,
   Physik), die unbedingt vorkommen sollen? Dann nehme ich sie als Vorlagen
   auf.
3. Quadratische Gleichungen ($pq$-Formel) später (Vorschlag), oder schon in
   Stufe 5?

---

## Teil B: Technischer Bauplan

### Größen mit Index und griechische Buchstaben
- **Termbaum:** Variablen heißen wie gedruckt, z. B. `R_1`, `v_0`,
  `alpha`, `Delta T` (eine Größe).
- **Schreibweise** (`print.ts`): `R_{1}`, `\alpha`, `\Delta T`.
- **Leser** (`parse/latex.ts`): liest `R_1`, `R_{1}`, `\alpha` und
  `\Delta T`. Tiefgestellte Zeichen gibt es bisher nur bei $\log_a$.
- **Bruch-Engine:** Die festen Buchstaben ($x, y, a, b, h$) werden zu
  beliebigen Größen. Die inneren Namen der Bausteine ($e^x$, $\ln x$,
  $\sin x$, $\cos x$, $\sqrt{x}$; bisher `E`, `L`, `S`, `C`, `R`) bekommen
  Namen, die sich nicht mit Größen wie $R$ oder $C$ verwechseln lassen.
- **Tastatur:** neue Art `formula` mit einer Taste je Größe der Formel
  (z. B. $R_1$ als eine Taste), dazu Bruch, Hochzahl, Wurzel und je nach
  Stufe $e^{\square}$, $\ln$, $\sin$, $\cos$, $\arcsin$, $\arccos$,
  $\arctan$.

### Umstell-Engine (`src/engine/rearrange/`)
1. **Aufgabe** (`task.ts`): Formel als Gleichung (`Equation` aus
   `expr/types.ts`), gesuchte Größe, Bedingungen ($R \neq R_2$). Schreibweise
   wie gestellt (Bruch, Wurzel und Klammer bleiben).
2. **Rechenweg** (`isolate.ts`): eine Folge von Umformungen, jede mit
   Operation und Gleichung danach:
   - auf beiden Seiten addieren bzw. subtrahieren
   - mit einem Term malnehmen bzw. durch ihn teilen
   - Kehrwert, Quadrieren, Wurzel ziehen, $\ln$ bzw. $e^{\square}$, Umkehrfunktion
   - Klammer ausmultiplizieren, Größe ausklammern, eine Seite zu einem Bruch
     zusammenfassen
   - Seiten tauschen (die gesuchte Größe nach links)

   Vorgehen: Kommt die Größe einmal vor, werden die Operationen um sie herum
   von außen nach innen rückgängig gemacht. Kommt sie mehrfach vor, wird
   ausmultipliziert, alles mit der Größe auf eine Seite gebracht,
   ausgeklammert und geteilt.
3. **Endform** (`finish.ts`):
   - rationale rechte Seiten über die Bruch-Engine: ein Bruch, gekürzt,
     exakt, mit beliebig vielen Größen
   - Wurzeln, $e$ und $\ln$ über `expr/finalForm.ts`
4. **Fehlerregeln** (`errorRules.ts`): Jede Fehlerregel führt genau eine
   Umformung falsch aus, der Rest wird richtig gerechnet. Die falschen
   Ergebnisse werden gefiltert: nie gleichwertig zur Lösung, im selben
   Schritt nicht doppelt.
5. **Vorlagen** (`tasks/rearrangeTerms.ts`):
   - eine Liste von Formeln je Stufe mit den Größen, nach denen sinnvoll
     umgestellt wird
   - dazu Gleichungen mit $x$ und Zufallszahlen
   - Aufgaben-Nummern wie gehabt („2-4711")

### Prüfen
- **Gegenprobe:** Die Lösung wird in die Ausgangsformel eingesetzt. Beide
  Seiten müssen an vielen Zufallsstellen gleich sein (alle Größen positiv,
  im Definitionsbereich). Das ist unabhängig vom Rechenweg.
- **Exakter Vergleich:** Bei rationalen Formeln zusätzlich über die
  Bruch-Engine.
- **Jeder Schritt:** Die Gleichung nach dem Schritt hat dieselben Lösungen
  wie die davor.
- **Freie Eingabe** (`check/rearrangeAnswer.ts`):
  - „$R_1 = \ldots$" oder nur die rechte Seite
  - Steht die gesuchte Größe noch rechts: „noch nicht aufgelöst"
  - sonst gleichwertig zur Lösung? Dann fertig? (ein Bruch, gekürzt, kein
    Doppelbruch)
  - sonst: Vergleich mit den falschen Ergebnissen der typischen Fehler

### Oberfläche
- **Thema** `umstellen` in `catalog.ts`: Stufen mit Vorschau, `available`,
  `free`, `focus`, Lernkarten-Ordner.
- **Engine laden:** `courseEngines.ts` lädt die Umstell-Engine erst beim
  Üben (`planGuidedTask`, `prepareFree`).
- **Geführt:**
  - Schrittplaner `guided/rearrangePlan.ts` mit den gemeinsamen Typen aus
    `guided/types.ts`, sonst wie bei den Brüchen
  - „Was machst du als Nächstes?" ist eine Auswahl von Umformungen; die
    Antworten zeigen die Operation als Formel, z. B.
    $\left| -\frac{1}{R_2}\right.$
- **Lernkarten:** Ordner „Formeln umstellen", Beispiele rechnet die Engine.
- **Galerie:** Umschalter „Ableiten / Brüche / Umstellen".
- **Speicher:** kein neues Format nötig, Fortschritt je Thema gibt es schon.

### Tests
- **Je Stufe tausende Zufallsaufgaben:**
  - Lösung durch Einsetzen gegengeprüft
  - jeder Schritt mit denselben Lösungen
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
- **Browser-Tests:** je Stufe eine Aufgabe geführt und frei, Tastatur mit
  Indizes, offline.

### Fertig heißt (pro Schritt)
- Tests, Typprüfung und Build ohne Fehler.
- Im Browser geprüft in Handy- und Laptopgröße, hell und dunkel.
- Commit und Push, ROADMAP abgehakt.
- Kurze Nachricht an dich, was du ausprobieren kannst.

---

## Bekannte Risiken
- **Mehrere gleich gute Endformen**, z. B. $\frac{R R_2}{R_2 - R}$ und
  $\frac{1}{\frac{1}{R} - \frac{1}{R_2}}$ (das zweite ist ein Doppelbruch,
  also noch nicht fertig). Der Vergleich ist mathematisch, die Prüfung auf
  „fertig" folgt den Regeln von oben.
- **Bedingungen** wie $R \neq R_2$: Die App nennt sie beim Ergebnis.
  Eintippen musst du sie nicht.
- **Tiefgestellte Zeichen am Handy:** Deshalb gibt es je Größe eine eigene
  Taste.
- **Umbenennen in der Bruch-Engine:** Damit sich nichts verschiebt, laufen
  alle Tests der Brüche unverändert weiter.
