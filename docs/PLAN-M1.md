# Plan für Meilenstein 1: Grundgerüst + Ableitungsregeln

Status: **freigegeben** (28.10.2026), in Arbeit.

Ziel von M1: Du kannst Ableitungsaufgaben aller 5 Stufen geführt und frei
lösen, mit Erklärungen, Lernkarten und Fortschritt, am Handy und am Laptop,
auch offline.

Der Plan hat zwei Teile: Teil A beschreibt in einfachen Worten, was in welcher
Reihenfolge entsteht. Teil B ist der technische Bauplan, damit jede neue
Sitzung genau weiß, wie die Teile zusammenpassen.

---

## Teil A: Was entsteht, Schritt für Schritt

Jeder Schritt endet gleich: Tests laufen, ich prüfe die App im Browser in
Handy- und Laptopgröße, committe, pushe und sage dir in wenigen Sätzen, was du
ausprobieren kannst. Pro Sitzung schaffen wir etwa ein bis zwei Schritte.

### Schritt 1: Grundgerüst und Handy-Zugang
- Leeres App-Gerüst mit Startseite „Rechenweg" und ein paar gesetzten
  Beispielformeln (Bruchstriche, Wurzeln, Dezimalkomma).
- Installierbar auf dem Homescreen, läuft offline.
- Sobald du einen Pull Request übernimmst, wird die App automatisch neu
  veröffentlicht. Du öffnest sie am Handy unter
  https://mathemann04.github.io/lern-app/ (siehe Entscheidung 1 unten).
- Erste Design-Grundlagen (Schrift, Farben, Abstände) als Vorschlag mit
  Screenshots, damit du früh sagen kannst, ob dir die Richtung gefällt.

**Ausprobieren:** Link am Handy öffnen, „Zum Home-Bildschirm" hinzufügen,
Flugmodus an, App öffnen. Sie startet trotzdem.

### Schritt 2: Mathe-Engine, Teil 1: Terme und Schreibweise
- Die Engine kann Terme speichern, vereinfachen, mit exakten Brüchen rechnen,
  an Zahlenstellen auswerten und sauber als Formel ausgeben (deutsche
  Schreibweise).
- Zufallsaufgaben mit einer „Aufgaben-Nummer": Dieselbe Nummer erzeugt immer
  dieselbe Aufgabe. So lassen sich Fehler später genau nachstellen.

**Ausprobieren:** Eine Formel-Galerie (Testseite) zeigt zufällige Terme aller
Stufen. Du prüfst: Sieht alles aus wie im Skript?

### Schritt 3: Mathe-Engine, Teil 2: Ableiten mit Rechenweg
- Die Engine leitet ab und protokolliert dabei jeden Schritt: welche Regel,
  was ist $u$, $v$, innere und äußere Funktion, welches Zwischenergebnis.
- Regeln: Potenz-, Faktor-, Summen-, Produkt-, Quotienten-, Kettenregel sowie
  $e^x$, $\ln x$, $\sin x$, $\cos x$.
- Fehlerregeln für diese Regeln (Katalog unten).
- Tests: Jede Ableitung wird an vielen Stellen mit einer rein numerischen
  Näherung verglichen. Das ist eine unabhängige Gegenprobe, die nicht auf der
  Engine selbst beruht.

**Ausprobieren:** Die Formel-Galerie zeigt zu jedem Term die Ableitung, den
Rechenweg und die typischen falschen Ergebnisse.

### Schritt 4: Geführter Modus (Stufe 1)
- Der eigentliche Lernbildschirm: ein Schritt pro Bildschirm, Multiple Choice,
  sofortiges Feedback, Tipp auf Wunsch, „Warum ist das falsch?".
- Erklärungen „Ausführlich" und „Kurz", global und pro Aufgabe ein- und
  ausschaltbar (Einstellungsseite).

**Ausprobieren:** Stufe-1-Aufgaben wie $4x^3 - \frac{2}{x} + \sqrt{x}$
komplett geführt lösen, absichtlich falsch antworten und die Erklärung lesen.

### Schritt 5: Stufen 2 und 3 im geführten Modus
- Aufgaben mit $e^x$, $\ln$, $\sin$, $\cos$, Produkt-, Quotienten- und
  Kettenregel.
- Stufenwahl: Du wählst die Stufe, sie bleibt gespeichert.

**Ausprobieren:** Stufe wechseln, Aufgaben wie $x^2 e^x$, $\sin(3x)$,
$e^{x^2}\cos x$, $\frac{\ln x}{x^2}$ lösen.

### Schritt 6: Freier Modus
- Eingabe mit Mathe-Tastatur (auch am Handy), Dezimalkomma.
- Prüfung auf Gleichwertigkeit: $e^x(x^2+2x)$ und $2x e^x + x^2 e^x$ zählen
  beide als richtig.
- Erkennt typische Fehler und nennt sie konkret.
- Danach: Lösungsweg Schritt für Schritt aufdecken.
- Aus dem freien Modus kannst du jederzeit in den geführten wechseln.

**Ausprobieren:** Dieselbe Aufgabe in verschiedenen richtigen Formen
eintippen, dann absichtlich die innere Ableitung vergessen.

### Schritt 7: Stufe 4 (dein Uni-Niveau, deshalb vorgezogen)
- Zusätzlich $a^x$, $\log_a x$, $\tan x$, $\arctan x$; mehrere Regeln
  verschachtelt, z. B. $\frac{x^2 e^{-3x}}{\sqrt{1+x^2}}$ oder
  $\ln\left(\frac{x^2+1}{x-1}\right)$.
- Geführt und frei.
- Der Rechenweg wird gröber: Was in Stufe 1 bis 3 geübt wurde, ist hier ein
  einzelner Schritt, damit eine Aufgabe nicht 20 Bildschirme lang wird.

**Ausprobieren:** Stufe 4 wählen und Aufgaben in beiden Modi lösen.

### Schritt 8: Fortschritt und Fehlerstatistik
- Fortschritt pro Thema und Stufe.
- Vorschlag „Eine Stufe höher?" nach 8 von 10 richtig (nie automatisch).
- „Deine häufigsten Fehler" mit gezieltem Üben: Aufgaben, in denen genau
  dieser Fehler passieren kann.

**Ausprobieren:** 10 Aufgaben lösen und den Vorschlag sehen; einen Fehler
mehrmals machen und das gezielte Üben starten.

### Schritt 9: Lernkarten
- Pro Regel eine Karte: Regel, Merksatz, durchgerechnetes Beispiel. Das
  Beispiel rechnet die Engine, nicht ich von Hand.
- Aufrufbar aus dem Menü und direkt aus jeder Aufgabe.

### Schritt 10: Stufe 5, Teil 1
- Logarithmisches Ableiten ($x^x$, $x^{\sin x}$), Umkehrfunktionen
  ($\arcsin$, $\arccos$, Ableitung der Umkehrfunktion), Hyperbelfunktionen
  ($\sinh$, $\cosh$, $\tanh$ und ihre Umkehrfunktionen).

### Schritt 11: Stufe 5, Teil 2: implizites Ableiten
- Aufgaben mit $x$ und $y$, z. B. $x^2 + y^2 = 25$ oder $x y + e^y = 1$,
  Ergebnis $y'$ in Abhängigkeit von $x$ und $y$.

### Schritt 12: Feinschliff und Abschluss von M1
- Dezente Animationen, Startseite und Themenübersicht, letzte
  Design-Politur, Ladezeit, Offline-Test, Bedienbarkeit (große Tippflächen,
  gut lesbar).
- Doku aktualisieren, M1 abhaken.

---

## Entscheidungen

### Entscheidung 1: Handy-Test über GitHub Pages (entschieden: Weg B)
Das Repo ist öffentlich, die App wird über GitHub Pages veröffentlicht:
https://mathemann04.github.io/lern-app/

Veröffentlicht wird immer der Stand von `main`, also erst nachdem du einen
Pull Request übernommen hast. Diese Adresse installierst du auf dem
Homescreen.

### Entscheidung 2: Pull Requests (entschieden: ja)
Claude erstellt am Ende jeder Sitzung den Pull Request selbst. Du drückst auf
GitHub nur noch „Merge pull request" und „Confirm merge".

### Vorschläge, zu denen du jederzeit etwas sagen kannst
Diese setze ich so um, wenn du nichts anderes sagst:
- **Design:** hell, viel Weiß, eine ruhige Akzentfarbe (Blaugrün), Grün und
  Rot nur für richtig/falsch. Du siehst es in Schritt 1 auf Screenshots.
- **Wann zählt eine Aufgabe als „richtig"** (für 8 von 10)? Wenn du sie ohne
  falsche Antwort gelöst hast. Einen Tipp anzuschauen zählt nicht als Fehler.
- **Modus:** Du wählst vor der Aufgabe „Geführt" oder „Frei", die App merkt
  sich deine Wahl.
- **Stufen-Vorlagen und Fehlerkatalog:** siehe unten. Wenn dir typische
  Fehler aus deinen Übungen fehlen, sag es mir. Die sind Gold wert.

---

## Teil B: Technischer Bauplan

### Tech-Stack
Deine Vorschläge passen, ich übernehme sie alle:
Vite, React, TypeScript, Tailwind, KaTeX, MathLive, Vitest.

Ergänzungen:
- **vite-plugin-pwa:** macht die App installierbar und offline nutzbar.
- **fast-check:** erzeugt in Tests automatisch tausende Zufallsaufgaben pro
  Regel und Stufe und findet bei einem Fehler das kleinste Gegenbeispiel.
- **Playwright:** steuert einen echten Browser, macht Screenshots in Handy-
  und Laptopgröße und spielt Aufgaben automatisch durch.

Bewusst **nicht** verwendet:
- **Fertige Computer-Algebra-Bibliotheken** (z. B. mathjs, Compute Engine)
  für die Engine: Sie können ableiten, liefern aber keinen Rechenweg mit
  Regeln, keine Fehlerregeln und keine kontrollierbare Ausgabeform. Die
  Engine wird deshalb selbst gebaut und gegen numerische Näherungen getestet.
- **MathLives eingebaute Auswertung** zum Einlesen der Eingabe: Ein eigener
  kleiner Leser für genau die Zeichen, die unsere Tastatur erzeugt, ist
  kleiner, versteht das Dezimalkomma und gibt verständliche Fehlermeldungen.

### Ordnerstruktur
```
src/
  engine/        Mathe-Engine, reines TypeScript ohne Oberfläche
    expr/        Termbaum, exakte Brüche, Vereinfachen, Auswerten,
                 Definitionsbereich, LaTeX-Ausgabe
    parse/       LaTeX der Mathe-Tastatur -> Termbaum
    random/      Zufall mit Seed
    derive/      Ableiten mit Protokoll (Ableitungsbaum)
    rules/       Regelkatalog (Id, Name, Formel, Merksatz, Lernkarte)
    errors/      Fehlerregeln
    tasks/       Vorlagen pro Stufe, Schrittplaner
    explain/     Textbausteine (ausführlich/kurz)
    check/       Gleichwertigkeit, Fehlerdiagnose
  ui/            React-Komponenten und Bildschirme
  state/         Einstellungen, Fortschritt, Fehlerstatistik, Speicher
e2e/             Playwright-Tests
```
Die Engine kennt kein React. Spätere Themen (M2 ff.) bauen auf `expr/`,
`parse/`, `check/` und `random/` auf.

### Kern-Entscheidungen der Engine
1. **Drei Formen eines Terms.** Die *Aufgabenform* behält die Struktur, wie
   sie geschrieben ist (Bruch bleibt Bruch, Wurzel bleibt Wurzel), denn davon
   hängt ab, welche Regel die richtige ist. Die *Normalform* (negative und
   gebrochene Exponenten, sortiert, zusammengefasst) dient zum Vergleichen
   und Vereinfachen. Die *Anzeigeform* schreibt eine Normalform wieder schön
   auf (Brüche, Wurzeln, fallender Grad).
2. **Zahlen exakt.** Koeffizienten sind Brüche aus ganzen Zahlen, nie
   Gleitkommazahlen. Dezimalzahlen der Eingabe ($0{,}5$) werden exakt
   eingelesen.
3. **Ableitungsbaum.** `derive(term)` liefert pro Knoten: Regel, Teile
   ($u$, $v$, innere/äußere Funktion), Kind-Ableitungen, Ergebnis direkt nach
   Anwenden der Regel und vereinfachtes Ergebnis.
4. **Fehlerregeln** sind alternative, falsche Anwendungen einer Regel an
   genau einem Knoten. Der Rest wird korrekt gerechnet, so entstehen
   realistische Ein-Fehler-Ergebnisse. Jede erzeugte falsche Option wird
   gefiltert: numerisch nicht gleichwertig zur Lösung, paarweise
   verschieden, sauber darstellbar. Liefern zwei Fehlerregeln dasselbe
   Ergebnis (z. B. bei $x^2 e^x$, weil $(e^x)' = e^x$), wird die Option nur
   einmal gezeigt.
5. **Schritt 1 „Welche Regel brauchst du?"** fragt nach der äußersten Regel.
   Als falsche Optionen kommen nur Regeln, die an dieser Stelle sicher nicht
   passen. Eine Regel, die erst weiter innen gebraucht wird, oder ein
   gleichwertiger anderer Weg (Produktregel statt Quotientenregel nach
   Umschreiben) wird nie als „falsch" angeboten.
6. **Schrittplaner.** Wandelt den Ableitungsbaum in Bildschirm-Schritte um
   (Frage, richtige Option, falsche Optionen aus Fehlerregeln, Tipp,
   Erklärungen). Die Feinheit hängt von der Stufe ab.
7. **Gleichwertigkeit.** Erst Vergleich der Normalformen (schnell), sonst
   numerisch an mindestens 30 Zufallsstellen im Definitionsbereich der
   Aufgabe mit relativer Toleranz. Beim impliziten Ableiten an
   Zufallspunkten $(x, y)$.
8. **Fehlerdiagnose (frei).** Zu jeder Aufgabe werden alle
   Fehlerregel-Ergebnisse vorberechnet; die Eingabe wird mit jedem
   verglichen.
9. **Seeds.** Jede Aufgabe ist (Vorlage, Stufe, Seed) und damit
   reproduzierbar.
10. **Definitionsbereich** nach deutscher Schulkonvention: Wurzeln und
    gebrochene Exponenten nur für Zahlen ≥ 0 (auch die dritte Wurzel),
    Potenzen mit variablem Exponenten nur für Basis > 0. Vereinfachen darf
    den Definitionsbereich vergrößern, nie verkleinern.
11. **Erklärungen** sind Textbausteine je Regel und Fehlerregel in zwei
    Varianten mit Platzhaltern für die Terme der Aufgabe; Fachbegriffe
    kommen aus einem Glossar.

### Weitere technische Festlegungen
- Formeln immer über eine gemeinsame `<Formel>`-Komponente (KaTeX);
  Dezimalkomma als `{,}`, Malpunkt `\cdot`, nie `×`.
- MathLive wird erst geladen, wenn der freie Modus geöffnet wird (es ist
  groß). Die Tastatur fügt bei Funktionen die Klammern gleich mit ein, damit
  $\sin 3x$ nicht mehrdeutig ist.
- Speicher: `localStorage` mit Versionsnummer und Umzugsfunktion für spätere
  Formatänderungen, hinter einer kleinen Schnittstelle, damit später Sync oder
  Capacitor-Speicher eingesetzt werden können.
- Adressen innerhalb der App über `#/...`, damit sie auf jedem Hosting und
  später in Capacitor ohne Server-Einstellungen funktionieren.
- Service Worker mit Hinweis „Neue Version verfügbar", damit nach einem
  Update nicht die alte Version hängen bleibt.

### Tests (Qualitätssicherung)
- Jede Regel: Ableitung = numerische Ableitung an vielen Stellen.
- Jede Stufe, tausende Zufallsaufgaben (fast-check):
  - Lösung korrekt (numerisch gegengeprüft),
  - jede falsche Option ist nicht gleichwertig zur Lösung und zu den anderen,
  - jede Formel lässt sich mit KaTeX setzen,
  - Schönheitsregeln der Ausgabe: kein $1 \cdot x$, kein $x^1$, kein
    $+\,-$, keine Gleitkomma-Reste,
  - Aufgaben nicht trivial (z. B. keine Ableitung $0$).
- Leser: Ausgabe → Einlesen ergibt wieder denselben Term.
- Gleichwertigkeitsprüfung: Sammlung bekannter gleichwertiger Formen wird
  angenommen, Fehlerregel-Ergebnisse werden abgelehnt und richtig benannt.
- Lernkarten-Beispiele werden von der Engine berechnet und getestet.
- Playwright: je eine Aufgabe geführt und frei komplett durchspielen,
  Screenshots bei 390×844 (Handy) und 1280×800 (Laptop).

### Fertig heißt (pro Schritt)
`npm test`, Typprüfung und Build ohne Fehler; Screenshots geprüft; Commit
und Push; ROADMAP abgehakt; kurze Nachricht an dich mit „Das kannst du jetzt
ausprobieren".

---

## Vorschlag: Stufen-Vorlagen Ableitungen

| Stufe | Inhalt | Beispiele |
| --- | --- | --- |
| 1 | Potenz-, Faktor-, Summenregel; 2–4 Summanden aus $a x^n$ (auch negativ), $\frac{a}{x^n}$, $\sqrt{x}$, $\sqrt[n]{x^m}$, Konstanten | $4x^3 - \frac{2}{x} + \sqrt{x}$ |
| 2 | $e^x$, $\ln x$, $\sin x$, $\cos x$ einzeln oder mit genau einer Verknüpfung: Produkt mit einer Potenz oder Kettenregel mit linearer innerer Funktion | $x^2 e^x$, $\sin(3x)$, $e^{-2x}$ |
| 3 | Zwei Regeln kombiniert: Produkt + Kette, Quotientenregel, Kette mit nichtlinearer innerer Funktion | $e^{x^2}\cos x$, $\frac{\ln x}{x^2}$, $\ln(x^2+1)$, $\sin^2 x$ |
| 4 | Mehrere Regeln verschachtelt, zusätzlich $a^x$, $\log_a x$, $\tan x$, $\arctan x$ | $\frac{x^2 e^{-3x}}{\sqrt{1+x^2}}$, $\ln\left(\frac{x^2+1}{x-1}\right)$ |
| 5 | Logarithmisches Ableiten, implizites Ableiten, Umkehr- und Hyperbelfunktionen | $x^x$, $x^{\sin x}$, $x^2+y^2=25$, $\arcsin(2x)$, $\cosh(x^2)$ |

## Vorschlag: Katalog der Fehlerregeln

| Regel | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Potenz | Exponent nicht verringert | $(x^3)' = 3x^3$ |
| Potenz | bei negativem Exponenten in die falsche Richtung gezählt | $(x^{-2})' = -2x^{-1}$ |
| Potenz | Vorzeichen bei negativem Exponenten vergessen | $\left(\frac{1}{x}\right)' = \frac{1}{x^2}$ |
| Potenz | Wurzel: Faktor $\frac{1}{2}$ vergessen | $(\sqrt{x})' = \frac{1}{\sqrt{x}}$ |
| Potenz | gebrochener Exponent: 1 nur vom Zähler abgezogen | $\left(x^{\frac{2}{3}}\right)' = \frac{2}{3}x^{\frac{1}{3}}$ |
| Faktor | Faktor vergessen | $(5x^3)' = 3x^2$ |
| Summe | konstanter Summand bleibt stehen | $(x^2 + 5)' = 2x + 5$ |
| $e^x$ | Potenzregel auf $e^x$ angewendet | $(e^x)' = x e^{x-1}$ |
| $\sin$/$\cos$ | Vorzeichen vertauscht | $(\cos x)' = \sin x$ |
| Produkt | Ableitungen multipliziert | $(uv)' = u'v'$ |
| Produkt | zweiter Summand fehlt | $(uv)' = u'v$ |
| Quotient | Reihenfolge im Zähler vertauscht | $\frac{uv' - u'v}{v^2}$ |
| Quotient | Nenner nicht quadriert | $\frac{u'v - uv'}{v}$ |
| Quotient | Zähler und Nenner einzeln abgeleitet | $\frac{u'}{v'}$ |
| Kette | innere Ableitung vergessen | $(\sin(3x))' = \cos(3x)$ |
| Kette | äußere Ableitung an falscher Stelle | $(\sin(3x))' = 3\cos x$ |
| Kette | innere Ableitung in die äußere eingesetzt | $(\sin(x^2))' = \cos(2x)$ |
| Kette | mit der inneren Funktion statt mit der inneren Ableitung multipliziert | $\left(e^{x^2}\right)' = x^2 e^{x^2}$ |
| Schreibweise | $\sin^2 x$ als $\sin(x^2)$ gelesen | $(\sin^2 x)' = 2x\cos(x^2)$ |
| $a^x$ | Potenzregel angewendet | $(2^x)' = x \cdot 2^{x-1}$ |
| $a^x$ | Faktor $\ln a$ vergessen | $(2^x)' = 2^x$ |
| $\log_a$ | Faktor $\frac{1}{\ln a}$ vergessen | $(\log_2 x)' = \frac{1}{x}$ |
| $\tan$ | $\sin$ und $\cos$ im Nenner vertauscht | $(\tan x)' = \frac{1}{\sin^2 x}$ |
| $\arctan$ | Vorzeichen im Nenner | $(\arctan x)' = \frac{1}{1-x^2}$ |
| $\arctan$ | mit $\arcsin$ verwechselt | $(\arctan x)' = \frac{1}{\sqrt{1-x^2}}$ |
| $x^x$ | Potenzregel angewendet | $(x^x)' = x \cdot x^{x-1}$ |
| $x^x$ | wie $a^x$ behandelt | $(x^x)' = x^x \ln x$ |
| $\arccos$ | Vorzeichen vergessen | $(\arccos x)' = \frac{1}{\sqrt{1-x^2}}$ |
| $\cosh$ | Vorzeichen wie beim $\cos$ | $(\cosh x)' = -\sinh x$ |
| implizit | $y$ wie eine Konstante behandelt | $(y^2)' = 0$ |
| implizit | $y'$ vergessen | $(y^2)' = 2y$ |
| implizit | Produktregel bei $xy$ vergessen | $(xy)' = x\,y'$ |

## Beispiel: So sieht eine geführte Aufgabe aus

Aufgabe: $f(x) = x^2 e^x$

1. **Welche Regel brauchst du?** Produktregel ✓ (falsch: Kettenregel,
   Quotientenregel, Summenregel)
2. **$u = x^2$. Was ist $u'$?** $2x$ ✓ (falsch: $2x^2$, …)
3. **$v = e^x$. Was ist $v'$?** $e^x$ ✓ (falsch: $x e^{x-1}$, …)
4. **Setze ein: $f'(x) = u'v + uv'$** → $2x\,e^x + x^2 e^x$ ✓
   (falsch: $2x\,e^x$, d. h. $u' \cdot v'$; $2x\,e^x - x^2 e^x$)
5. **Fasse zusammen:** $f'(x) = (x^2 + 2x)\,e^x$

Erklärung zu Schritt 4:
- *Kurz:* $f'(x) = u'v + uv' = 2x \cdot e^x + x^2 \cdot e^x$
- *Ausführlich:* „Die Produktregel brauchst du, wenn zwei Teile
  malgenommen werden (diese Teile heißen *Faktoren*). Du leitest zuerst den
  ersten Faktor ab und lässt den zweiten stehen, dann umgekehrt, und addierst
  beides: …"

Im freien Modus zählen hier z. B. $e^x(x^2+2x)$ und $x e^x (x+2)$ als
richtig. Bei $2x\,e^x$ sagt die App: „Das ist $u' \cdot v'$. Bei der
Produktregel …"

## Bekannte Risiken
- **Implizites Ableiten:** Ergebnisse, die nur auf der Kurve gleich sind
  (z. B. mit $y = \sqrt{25-x^2}$ eingesetzt), erkennt die Prüfung in M1
  zunächst nicht als richtig. Wir zeigen dann einen Hinweis, $y$ stehen zu
  lassen.
- **iPhone:** Safari löscht gespeicherte Daten von Webseiten, die man
  wochenlang nicht öffnet. Auf dem Homescreen installiert passiert das
  nicht. Deshalb: App immer installieren. Eine Sicherungsfunktion
  (Fortschritt exportieren) kann später dazukommen.
