# Plan für Meilenstein 2: Brüche

Status: **freigegeben** (29.10.2026) mit zwei Wünschen des Nutzers:
„fiesere" Bausteine wie Wurzeln und Winkelfunktionen in den hohen Stufen
und ein neues Aussehen (dunkles Design, Farben je Gebiet, neue Symbole).

Ziel von M2: Du kannst Bruchaufgaben aller 5 Stufen geführt und frei lösen,
von Zahlenbrüchen bis zu Doppelbrüchen mit $x$, mit Erklärungen,
Lernkarten und Fortschritt. Dafür lernt die App, mehrere Themen
nebeneinander zu führen, und bekommt ein neues Aussehen.

Teil A beschreibt in einfachen Worten, was in welcher Reihenfolge entsteht.
Teil B ist der technische Bauplan.

---

## Aufteilung: Brüche und Formeln umstellen getrennt

Auf Wunsch des Nutzers:
- „Brüche" und „Formeln umstellen" werden zwei eigene Themen im Gebiet
  „Grundlagen" (Mathematik MB1), jedes mit fünf Stufen.
- Es werden auch zwei Meilensteine daraus: M2 Brüche, M3 Formeln umstellen.
  Die späteren Meilensteine rücken eine Nummer weiter.
- Brüche kommen zuerst, weil man sie beim Umstellen ständig braucht, z. B.
  wenn $\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$ nach $R_1$ aufgelöst
  werden soll.
- Im Gebiet „Grundlagen" stehen danach drei Themen:
  - „Brüche"
  - „Formeln umstellen", blass mit „kommt bald"
  - „Potenzen, Wurzeln, Logarithmen", blass mit „kommt bald"
- Weitere Grundlagen-Themen (z. B. Gleichungen, Ungleichungen, Beträge)
  lassen sich später dort einreihen.

---

## Teil A: Was entsteht

### Stufen (Vorschlag)

| Stufe | Inhalt | Beispiele |
| --- | --- | --- |
| 1 | Zahlenbrüche: kürzen, erweitern, plus, minus, mal, geteilt; ganze Zahl und Bruch | $\frac{3}{4} + \frac{5}{6}$, $\frac{3}{4} : \frac{2}{5}$, $2 - \frac{3}{5}$ |
| 2 | Buchstaben in Produkten: Potenzen kürzen, gleichnamig machen, mal und geteilt | $\frac{6x^2y}{9xy^3}$, $\frac{2}{x} - \frac{1}{x^2}$, $\frac{3a}{4b} \cdot \frac{8b^2}{9a}$ |
| 3 | Summen in Zähler und Nenner: ausklammern, binomische Formeln, kürzen; Nenner wie $x+1$ und $x-1$ | $\frac{x^2-9}{2x+6}$, $\frac{1}{x-1} + \frac{2}{x+1}$ |
| 4 | Uni-Niveau: Hauptnenner aus Faktoren, $x^2 + px + q$ zerlegen, Doppelbrüche; statt $x$ auch Bausteine wie $e^x$, $\ln x$, $\sin x$ | $\frac{x}{x^2-1} - \frac{1}{x+1}$, $\frac{1 + \frac{1}{x}}{1 - \frac{1}{x^2}}$, $\frac{e^{2x}-1}{e^x+1}$, $\frac{2}{\sin x} - \frac{1}{\sin^2 x}$ |
| 5 | Profi: mehrere Rechenarten in einer Aufgabe, verschachtelte Doppelbrüche, zwei Variablen; Wurzeln und Winkelfunktionen mit ihren Regeln | $\frac{\frac{1}{x+h} - \frac{1}{x}}{h}$, $\frac{x-1}{\sqrt{x}-1}$, $\frac{1}{1-\sin x} + \frac{1}{1+\sin x}$, $\frac{\frac{1}{\cos x} - \cos x}{\sin x}$ |

„Fiesere" Bausteine (Wunsch des Nutzers), damit die hohen Stufen
fordernder werden:
- **Stufe 4:** Statt $x$ steht ein Baustein wie $e^x$, $\ln x$ oder
  $\sin x$. Man rechnet damit genau wie mit $x$, muss den Baustein aber
  erst als „eine Größe" erkennen, z. B.
  $\frac{e^{2x}-1}{e^x+1} = \frac{(e^x-1)(e^x+1)}{e^x+1} = e^x - 1$.
- **Stufe 5:** Zusätzlich braucht man die Regeln der Bausteine:
  - $(\sqrt{x})^2 = x$, z. B. $\frac{x-1}{\sqrt{x}-1} = \sqrt{x}+1$
  - $\sin^2 x + \cos^2 x = 1$, z. B.
    $\frac{1}{1-\sin x} + \frac{1}{1+\sin x} = \frac{2}{\cos^2 x}$
  - $\tan x = \frac{\sin x}{\cos x}$, z. B.
    $\frac{\frac{1}{\cos x} - \cos x}{\sin x} = \tan x$

Bewusst nicht in M2:
- **Gemischte Zahlen** wie $2\frac{1}{3}$: An der Uni unüblich, und man
  verwechselt sie leicht mit $2 \cdot \frac{1}{3}$. Ergebnisse stehen als
  $\frac{7}{3}$.
- **Wurzeln im Nenner beseitigen** („Nenner rational machen") als eigene
  Aufgabe: kommt mit den Wurzeln in M4. Steht im Ergebnis eine Wurzel im
  Nenner, zählt aber auch die Form ohne Wurzel im Nenner.
- **Polynomdivision**: kommt mit der Partialbruchzerlegung bei der
  Integralrechnung.

### Wann ist ein Ergebnis fertig?
- Ein einziger Bruch, vollständig gekürzt, Zähler und Nenner
  zusammengefasst. Kürzt sich der Nenner ganz weg, ist das Ergebnis ein
  Term ohne Bruch, z. B. $a - b$.
- Der Nenner darf in Klammern stehen oder ausmultipliziert sein:
  $\frac{3x-1}{(x-1)(x+1)}$ und $\frac{3x-1}{x^2-1}$ zählen beide.
- Bei Wurzeln und Winkelfunktionen gibt es oft mehrere gleich gute
  Endformen, z. B. $\frac{2}{\cos^2 x}$ und $\frac{2}{1-\sin^2 x}$. Dann
  zählt jede, die nicht länger ist als die Lösung der App.
- Die App zeigt die Lösung mit dem Nenner in Klammern, so wie er beim
  Hauptnenner entsteht, und nennt die ausmultiplizierte Form in der
  Erklärung.
- **Definitionsbereich:** Nach dem Kürzen sagt die App, für welche $x$ das
  Ergebnis gilt, z. B. $\frac{x^2-9}{2x+6} = \frac{x-3}{2}$ für
  $x \neq -3$. Eintippen musst du das nicht.

### Schritt 1: Neues Aussehen (Wunsch des Nutzers)
- **Dunkles Design:** Die App richtet sich nach deinem Gerät (hell oder
  dunkel). In den Einstellungen lässt es sich auch fest wählen: „Wie das
  Gerät", „Hell", „Dunkel". Die Mathe-Tastatur macht mit.
- **Farben je Gebiet** statt überall Grün. Vorschlag:
  - Grundlagen orange
  - Differentialrechnung blau
  - Integralrechnung violett
  - Formeln mit Einheiten pink
  - Statik türkis
- Die Farbe zieht sich durch alles, was zum Gebiet gehört: Kachel,
  Gebiets- und Themenseite, Aufgaben, Lernkarten, Fortschritt. Startseite,
  Menü und Einstellungen behalten das Blaugrün der App. Richtig bleibt grün,
  falsch rot.
- **Neue Symbole:** farbige Bilder für Gebiete und Themen, ähnlich wie bei
  Brilliant. Die Karte „Weitermachen" zeigt das Bild des Themas.
- Du bekommst vorher Bilder (hell und dunkel) und kannst Farben und
  Symbole ändern lassen.

**Ausprobieren:** Am Handy das dunkle Design einschalten (oder in den
Einstellungen „Dunkel" wählen) und durch Gebiete, Themen und Aufgaben
klicken.

Umgesetzt:
- Einstellungen → „Aussehen": „Automatisch" (wie das Gerät, wechselt mit),
  „Hell", „Dunkel". Die Wahl gilt schon beim Öffnen, ohne helles
  Aufblitzen. Mathe-Tastatur und Statusleiste machen mit.
- Farben wie vorgeschlagen. Die Farbe gilt auf der Kachel, der Gebiets- und
  Themenseite, in Aufgaben samt Lernkarten-Fenster, im Lernkarten-Ordner, in
  der Karte „Weitermachen" und beim Fortschritt.
- Bilder (Brilliant-Stil, je in der Farbe des Gebiets):
  - Grundlagen: gestapelte Bausteine
  - Differentialrechnung: Kurve mit Tangente
  - Integralrechnung: Fläche unter einer Kurve mit Rechteckstreifen
  - Formeln mit Einheiten: Messuhr
  - Statik: Balken auf Fest- und Loslager mit Kraftpfeil
  - Thema Ableiten: Parabel mit Tangente und Steigungsdreieck
- „Kommt bald" zeigt das Bild blass.
- Nebenbei behoben: Die Fortschrittsseite stürzte ab, wenn ein gespeicherter
  typischer Fehler in der App nicht mehr vorkommt; solche Einträge werden
  jetzt übersprungen.

### Schritt 2: Mathe-Engine für Brüche
- Die Engine rechnet mit Brüchen aus Termen:
  - kürzen und erweitern
  - Hauptnenner finden
  - plus, minus, mal, geteilt
  - Doppelbrüche auflösen
  - Zähler und Nenner in Faktoren zerlegen (ausklammern, binomische Formeln,
    $x^2 + px + q$)
- Jeder Rechenweg wird mitgeschrieben. Die typischen Fehler (Katalog unten)
  liefern die falschen Ergebnisse.
- Aufgaben-Vorlagen für die Stufen 1 bis 4, wieder mit Aufgaben-Nummer.
- Tests: Jede Lösung wird exakt und zusätzlich an Zahlenstellen gegen die
  Aufgabe geprüft.

**Ausprobieren:** Die Formel-Galerie zeigt zufällige Bruchaufgaben mit
Lösung, Rechenweg und typischen falschen Ergebnissen. Du prüfst, ob die
Aufgaben aussehen wie in deinen Übungen.

### Schritt 3: Mehrere Themen, Brüche Stufe 1 und 2 geführt
- Das Gebiet „Grundlagen" lässt sich öffnen und zeigt die drei Themen von
  oben.
- Jedes Thema merkt sich seine eigene Stufe.
- „Weitermachen" führt zum zuletzt geübten Thema.
- Fortschritt und häufigste Fehler stehen getrennt je Thema. Dein
  bisheriger Fortschritt beim Ableiten bleibt erhalten.
- Geführter Modus für Stufe 1 und 2 mit Erklärungen, Tipps und „Warum ist
  das falsch?".
- Neuer Lernkarten-Ordner „Brüche" mit den Karten für Stufe 1 und 2:
  kürzen, erweitern, plus und minus, mal, geteilt, Potenzen kürzen.

**Ausprobieren:**
- Start → „Grundlagen" → „Brüche" → Stufe 1 üben.
- Danach prüfen:
  - Die Karte „Weitermachen" führt zu den Brüchen.
  - Beim Ableiten ist noch deine alte Stufe eingestellt.

### Schritt 4: Stufen 3 und 4 geführt
- Neu: in Faktoren zerlegen, Hauptnenner aus Faktoren, Doppelbrüche.
- Ab Stufe 4 wird der Rechenweg gröber, wie beim Ableiten: Was in den
  Stufen davor geübt wurde, ist dort ein einzelner Schritt.
- Neu in Stufe 4: Bausteine wie $e^x$, $\ln x$, $\sin x$ statt $x$.
- Neue Lernkarten:
  - Ausklammern
  - binomische Formeln
  - $x^2 + px + q$ zerlegen
  - Hauptnenner mit Termen
  - Doppelbrüche

**Ausprobieren:** $\frac{x^2-9}{2x+6}$,
$\frac{x}{x^2-1} - \frac{1}{x+1}$ und
$\frac{1 + \frac{1}{x}}{1 - \frac{1}{x^2}}$ geführt lösen.

### Schritt 5: Freier Modus für Brüche
- Du tippst das Ergebnis ein. Die Mathe-Tastatur zeigt die Buchstaben, die
  in der Aufgabe vorkommen.
- Richtig ist jede gleichwertige Form, die fertig ist (siehe oben).
- Ist die Eingabe richtig, aber noch nicht fertig, sagt die App, was fehlt.
  Das zählt nicht als Fehler, du rechnest einfach weiter. Mögliche
  Hinweise:
  - „Noch nicht vollständig gekürzt"
  - „Fasse noch zu einem Bruch zusammen"
  - „Im Bruch steht noch ein Bruch"
  - „Fasse den Zähler noch zusammen"
- Typische Fehler werden erkannt und benannt.
- Danach lässt sich der Lösungsweg Schritt für Schritt aufdecken.

**Ausprobieren:**
- $\frac{3}{x-1} - \frac{2}{x+1}$ zuerst als $\frac{x+5}{x^2-1}$ eingeben.
- Dann ungekürzt eingeben.
- Zum Schluss absichtlich die Klammer nach dem Minus vergessen.

### Schritt 6: Stufe 5 geführt und frei
- Mehrere Rechenarten in einer Aufgabe.
- Verschachtelte Doppelbrüche.
- Zwei Variablen, z. B. der Differenzenquotient
  $\frac{\frac{1}{x+h} - \frac{1}{x}}{h}$, den du von der Herleitung der
  Ableitung kennst.
- Wurzeln und Winkelfunktionen mit ihren Regeln ($(\sqrt{x})^2 = x$,
  $\sin^2 x + \cos^2 x = 1$, $\tan x = \frac{\sin x}{\cos x}$), dazu eine
  Lernkarte „Bausteine mit eigenen Regeln".

**Ausprobieren:** Stufe 5 in beiden Modi.

### Schritt 7: Gezieltes Üben, Feinschliff, Abschluss von M2
- „Deine häufigsten Fehler" mit „Gezielt üben" auch für Brüche.
- Letzte Design-Politur, Offline-Test, Doku, M2 abhaken.

Pro Sitzung schaffen wir etwa ein bis zwei Schritte.

### Beispiel: So sieht eine geführte Aufgabe aus

Aufgabe: Fasse zu einem Bruch zusammen und kürze so weit wie möglich:
$\frac{3}{x-1} - \frac{2}{x+1}$

1. **Was ist der Hauptnenner?**
   - Richtig: $(x-1)(x+1)$ ✓
   - Falsch:
     - $2x$ (die Nenner addiert)
     - $x-1$ (einen Faktor vergessen)
2. **Erweitere beide Brüche auf den Hauptnenner.**
   - Richtig: $\frac{3(x+1)}{(x-1)(x+1)} - \frac{2(x-1)}{(x-1)(x+1)}$ ✓
   - Falsch:
     - $\frac{3}{(x-1)(x+1)} - \frac{2}{(x-1)(x+1)}$ (nur die Nenner
       erweitert)
     - $\frac{3(x-1)}{(x-1)(x+1)} - \frac{2(x+1)}{(x-1)(x+1)}$ (mit dem
       eigenen Nenner erweitert)
3. **Fasse die Zähler zusammen.**
   - Richtig: $\frac{x+5}{(x-1)(x+1)}$ ✓
   - Falsch:
     - $\frac{x+1}{(x-1)(x+1)}$ (Klammer nach dem Minus vergessen:
       $3x + 3 - 2x - 2$)
     - $\frac{x+2}{(x-1)(x+1)}$ (beim Ausmultiplizieren nur den ersten
       Summanden malgenommen)
4. **Ergebnis:** $\frac{x+5}{(x-1)(x+1)} = \frac{x+5}{x^2-1}$ für
   $x \neq \pm 1$. Die Erklärung sagt, warum sich nichts mehr kürzen lässt:
   $x+5$ hat keinen Faktor mit dem Nenner gemeinsam.

Lässt sich am Ende kürzen, kommt ein eigener Schritt: Zähler zerlegen, dann
kürzen. Falsche Antworten dort sind zum Beispiel aus einer Summe gekürzt
oder beim Kürzen die $1$ im Zähler vergessen.

Im freien Modus zählen hier $\frac{x+5}{x^2-1}$ und
$\frac{x+5}{(x+1)(x-1)}$ als richtig. Bei $\frac{3x+3-2x+2}{x^2-1}$ sagt die
App „Fasse den Zähler noch zusammen". Bei $\frac{x+1}{x^2-1}$ und beim
weitergekürzten $\frac{1}{x-1}$ sagt sie: „Nach dem Minus fehlt die
Klammer: $-2(x-1) = -2x + 2$." Beide Eingaben haben denselben Wert, deshalb
erkennt die App den Fehler in beiden.

### Katalog der Fehlerregeln (Vorschlag)

| Rechenart | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Plus, minus | Zähler plus Zähler, Nenner plus Nenner | $\frac{1}{2} + \frac{1}{3} = \frac{2}{5}$ |
| Plus, minus | Nenner gleichnamig gemacht, Zähler nicht erweitert | $\frac{1}{2} + \frac{1}{3} = \frac{2}{6}$ |
| Plus, minus | Klammer um den zweiten Zähler vergessen | $3(x+1) - 2(x-1) = 3x + 3 - 2x - 2$ |
| Plus, minus | ganze Zahl nur zum Zähler addiert | $1 + \frac{2}{x} = \frac{3}{x}$ |
| Hauptnenner | größter gemeinsamer Teiler statt kleinstem gemeinsamen Vielfachen | Hauptnenner von $\frac{1}{4}$ und $\frac{1}{6}$: $2$ |
| Hauptnenner | Nenner addiert statt malgenommen | Hauptnenner von $\frac{1}{x-1}$ und $\frac{1}{x+1}$: $2x$ |
| Hauptnenner | einen Faktor vergessen | Hauptnenner von $\frac{1}{x^2}$ und $\frac{1}{x(x+1)}$: $x(x+1)$ |
| Ausmultiplizieren | nur den ersten Summanden malgenommen | $3(x+1) = 3x + 1$ |
| Mal | Zahl mit Zähler und Nenner malgenommen | $3 \cdot \frac{2}{5} = \frac{6}{15}$ |
| Geteilt | Kehrwert vergessen | $\frac{3}{4} : \frac{2}{5} = \frac{6}{20}$ |
| Geteilt | Kehrwert vom ersten statt vom zweiten Bruch | $\frac{3}{4} : \frac{2}{5} = \frac{4}{3} \cdot \frac{2}{5}$ |
| Kürzen | nur einen Summanden gekürzt | $\frac{2x+6}{2} = x + 6$ |
| Kürzen | aus einer Summe gekürzt | $\frac{x^2+1}{x} = x + 1$ |
| Kürzen | $1$ im Zähler vergessen | $\frac{x+1}{(x+1)(x-2)} = x - 2$ |
| Kürzen | Vorzeichen bei vertauschter Differenz | $\frac{x-1}{1-x} = 1$ |
| Potenzen | Exponenten falsch herum abgezogen | $\frac{x^2}{x^5} = x^3$ |
| Zerlegen | falsch ausgeklammert | $2x + 6 = 2(x+6)$ |
| Zerlegen | binomische Formeln verwechselt | $x^2 - 9 = (x-3)^2$ |
| Zerlegen | Vorzeichen bei $x^2 + px + q$ vertauscht | $x^2 - x - 6 = (x+3)(x-2)$ |
| Doppelbruch | mit dem Nenner statt mit seinem Kehrwert malgenommen | $\frac{\frac{1}{2}}{\frac{3}{4}} = \frac{1}{2} \cdot \frac{3}{4}$ |
| Doppelbruch | Zahl im Nenner in den Zähler geholt | $\frac{\frac{a}{b}}{c} = \frac{ac}{b}$ |
| Potenzen | Exponenten geteilt statt abgezogen | $\frac{x^6}{x^2} = x^3$ |
| Bausteine | im Inneren einer Funktion gekürzt | $\frac{\sin(2x)}{2} = \sin x$, $\frac{e^{2x}}{e^x} = e^2$ |
| Bausteine | binomische Formel bei der Wurzel vergessen | $(\sqrt{x}+1)^2 = x + 1$ |
| Bausteine | Quadrat vergessen | $1 - \cos^2 x = \sin x$ |

Wenn dir typische Fehler aus deinen Übungen fehlen, sag es. Die sind Gold
wert.

---

## Teil B: Technischer Bauplan

### Neues Aussehen (Schritt 1)
- **Farben über Variablen:** Die Oberfläche nutzt weiter die Farbnamen
  `zinc`, `accent`, `red`, `green`, `amber`. Im dunklen Design werden diese
  Farbleitern umgedreht (Schritt 50 wird dunkel, Schritt 900 hell), wie bei
  Radix Colors. Dazu kommen wenige feste Rollen:
  - `surface` für den Seitenhintergrund
  - `raised` für erhobene Flächen
  - `on-accent` für Schrift auf farbigen Knöpfen
  So braucht nicht jede Klasse eine eigene Dunkel-Variante.
- **Ton je Gebiet:** `data-tone="blue"` an einer Seite setzt die
  `accent`-Farben für alles darin. Tailwind liest die Akzentfarben über
  `@theme inline` direkt aus diesen Variablen. Bilder nutzen die
  Tonleiter `tone-*`.
- **Hell/Dunkel:** Einstellung `theme` (`system`, `light`, `dark`).
  - Ein kleines Skript in `index.html` setzt die Klasse `dark` schon vor dem
    ersten Bild, damit nichts aufblitzt.
  - MathLive bekommt `theme` am `body`.
  - Die Farbe der Statusleiste (`theme-color`) passt sich an.
- **Bilder:** `AreaIcon.tsx` mit Bildern je Gebiet und Thema, als SVG in
  den Farben des Tons. Keine Bilddateien, damit alles offline und scharf
  bleibt.

### Mehrere Themen (Schritt 3)
- **Katalog** (`src/ui/catalog.ts`):
  - Jedes Thema bekommt seine Stufen-Vorschau mit Titel, Beispielen und der
    Angabe, ob die Stufe spielbar ist. `derivativeLevels` aus `samples.ts`
    zieht dorthin.
  - Ein Thema ohne spielbare Stufe steht blass mit „kommt bald" da.
  - Ein Gebiet ist offen, sobald eines seiner Themen spielbar ist.
- **Schnittstelle je Thema:** Jedes Thema hat in der Engine ein Modul mit
  derselben Schnittstelle:
  - `planGuidedTask(ref, focus)`
  - `prepareCheck(ref)` und `checkAnswer(context, latex)`
  - `findTaskWithError(errorId, levels, rng)`
  - Namen und Texte der Fehlerregeln
  - Buchstaben für die Tastatur
  - Lernkarten-Ordner
  `GuidedTask`, `GuidedStep` und `Verdict` werden gemeinsame Typen. Die
  Bildschirme in `guided/`, `free/` und `task/` kennen nur die
  Schnittstelle. `App.tsx` lädt das Modul eines Themas erst bei Bedarf
  (Ladezeit, Offline wie bisher).
- **Adressen:**
  - `#/ueben/<thema>/<stufe>` bzw. `#/ueben/<thema>/<stufe>-<seed>`,
    entsprechend `#/frei/…`
  - Alte Adressen wie `#/ueben/1` führen weiter zu Ableiten.
  - Aufgaben-Nummern bleiben „3-48213" je Thema.
- **Speicher Version 3:**
  - eigene Stufe je Thema, zuletzt geübtes Thema
  - jeder Versuch mit seinem Thema
  - „Eine Stufe höher?" je Thema
  - Version 2 wird umgezogen; alles Bisherige zählt zu Ableiten. Tests für
    den Umzug.
- **Fehlerregeln:** Ids sind über alle Themen eindeutig (Brüche mit der
  Vorsilbe `frac-`). Fortschrittsseite mit einem Abschnitt je Thema.

### Engine für Brüche (`src/engine/fraction/`)
1. **Polynome zum Rechnen** (`poly.ts`):
   - Zähler und Nenner werden intern als Polynome mit exakten Bruchzahlen
     geführt, auch mit mehreren Variablen ($x$, $y$, $a$, $b$, $h$).
   - Damit sind Gleichheit, Kürzen und Hauptnenner exakt, ohne Rundung.
   - Angezeigt wird weiter über den Termbaum in Aufgabenform, damit Klammern
     und Faktoren so stehen wie im Rechenweg.
2. **Faktoren sind bekannt:**
   - Die Vorlagen bauen Zähler und Nenner aus Faktoren ($3$, $x$, $x+3$,
     $x^2+1$, …).
   - Die Engine kennt dadurch die Zerlegung jedes Nenners. Kürzen ist
     Probedivision durch diese Faktoren (genaue Division, auch bei mehreren
     Variablen), der Hauptnenner das kleinste gemeinsame Vielfache der
     Faktorlisten.
   - Einen beliebigen Term zerlegen muss die Engine nicht. Zum Zerlegen wie
     im Skript (`factor.ts`): ausklammern (Zahl und Potenzen), binomische
     Formeln, $x^2 + px + q$ mit ganzzahligen Nullstellen.
3. **Bausteine** wie $\sqrt{x}$, $e^x$, $\ln x$, $\sin x$, $\cos x$,
   $\tan x$ (Stufen 4 und 5):
   - Intern wie eigene Buchstaben behandelt, z. B. $s = \sin x$.
   - Dazu die Regeln zwischen ihnen:
     - $(\sqrt{x})^2 = x$: gerechnet wird mit $t = \sqrt{x}$, also $x = t^2$
     - $e^{kx} = (e^x)^k$
     - $\tan x = \frac{\sin x}{\cos x}$
     - $\sin^2 x + \cos^2 x = 1$: beim Vergleichen wird $\cos^2 x$ so lange
       durch $1 - \sin^2 x$ ersetzt, bis höchstens $\cos x$ übrig bleibt
   - Definitionsbereich der Bausteine nach den Engine-Regeln (Wurzel nur
     für $x \geq 0$, $\ln$ nur für $x > 0$).
   - Hier ist die numerische Gegenprobe in den Tests besonders wichtig.
   - „Fertig" heißt bei Bausteinen mit Regeln: nicht länger als die
     Lösung, weil es mehrere gleich gute Endformen gibt.
4. **Gleichwertig** heißt $N_1 \cdot D_2 = N_2 \cdot D_1$ als Polynome. Das
   ist exakt. In den Tests kommt eine unabhängige Gegenprobe an Zahlenstellen
   dazu.
5. **Rechenweg** (`steps.ts`): eine Folge von Umformungen, jede mit vorher
   und nachher:
   - Hauptnenner
   - erweitern
   - Zähler zusammenfassen
   - zerlegen
   - kürzen
   - mit dem Kehrwert malnehmen
   - Doppelbruch auflösen

   Eine Fehlerregel (`errorRules.ts`) führt genau eine Umformung falsch aus,
   der Rest wird richtig gerechnet. Falsche Ergebnisse werden gefiltert:
   nicht gleichwertig zur Lösung und paarweise verschieden.
6. **Vorlagen** (`src/engine/tasks/fractionTerms.ts`):
   - je Stufe mit Zufallsparametern
   - kleine, „schöne" Zahlen
   - nie trivial: Es gibt immer etwas zu tun, und Kürzen ergibt nicht
     einfach $1$
7. **Schrittplaner** (`src/engine/guided/fractionPlan.ts`):
   - Plus und minus: Hauptnenner, erweitern, Zähler zusammenfassen, kürzen
     (nur wenn möglich)
   - Kürzen: Zähler zerlegen, Nenner zerlegen, kürzen
   - Geteilt: mit dem Kehrwert malnehmen, dann wie mal
   - Doppelbruch: Zähler und Nenner je zu einem Bruch, mit dem Kehrwert
     malnehmen, kürzen
   - Ab Stufe 4 sind Erweitern und Zusammenfassen ein Schritt.
   - Ein gleichwertiger anderer Weg gilt nie als falsch. Deshalb wird z. B.
     das Produkt der Nenner bei der Frage nach dem Hauptnenner nicht als
     falsche Antwort angeboten, wenn es ein gemeinsamer Nenner ist.
8. **Prüfen der freien Eingabe** (`src/engine/check/fractionAnswer.ts`):
   - Erst gleichwertig, dann fertig?
   - Fertig heißt:
     - ein Bruch, Vorzeichen davor erlaubt
     - kein Bruch in Zähler oder Nenner
     - Zähler und Nenner zusammengefasst: keine gleichartigen Summanden,
       keine Klammer in einer Summe
     - vollständig gekürzt
   - „Vollständig gekürzt" lässt sich ohne allgemeinen größten gemeinsamen
     Teiler prüfen:
     - Die gekürzte Lösung $P/Q$ ist bis auf einen Zahlfaktor eindeutig.
     - Eine gleichwertige Eingabe $N/D$ ist also genau dann gekürzt, wenn
       $D$ denselben Grad hat wie $Q$ und die Zahlfaktoren von Zähler und
       Nenner teilerfremd sind.
   - Typische Fehler: Eingabe gegen die vorberechneten falschen Ergebnisse
     vergleichen.
9. **Definitionsbereich:**
   - Ausgeschlossen sind alle Stellen, an denen ein Nenner der Aufgabe null
     wird. Das gilt auch für innere Nenner und für den Bruch, durch den
     geteilt wird.
   - Bei Aufgaben mit einer Variablen steht „für $x \neq \dots$" beim
     Ergebnis.
10. **Lernkarten:**
   - Ordner „Brüche" in `explain/cards.ts`.
   - Die Beispiele rechnet die Bruch-Engine.
   - `cards.test.ts` prüft auch hier: Jede Regel und jeder typische Fehler
     steht auf einer Karte.
11. **Tastatur:** Die erste Seite bekommt bei Brüchen Ziffern, Bruch,
    Klammern, Hochzahl und die Buchstaben der Aufgabe. Funktionen wie
    $\sin$ fallen dort weg.

### Tests
- Jede Stufe, tausende Zufallsaufgaben:
  - Lösung exakt gleichwertig zur Aufgabe und numerisch gegengeprüft
  - jeder Schritt des Rechenwegs wertgleich zum vorigen
  - Die eigene Lösung besteht die Prüfung „fertig".
  - Jede falsche Option ist nicht gleichwertig zur Lösung und zu den
    anderen.
  - KaTeX setzt alles.
  - Schönheitsregeln: kein $1 \cdot$, kein $+\,-$, keine überflüssigen
    Klammern
- Jede Fehlerregel: Katalogbeispiel in einem Test und ein eigener Text in
  den Erklärungen. „Warum ist das falsch?" verrät nicht das Ergebnis.
- Freie Eingabe:
  - Sammlung richtiger Formen wird angenommen.
  - Unfertige Formen bekommen den richtigen Hinweis.
  - Typische Fehler werden richtig benannt.
- Speicher-Umzug von Version 2 auf 3 ohne Verlust.
- Browser-Tests: je Stufe eine Aufgabe geführt und frei, alte Adressen,
  Weitermachen mit zwei Themen, offline.

### Fertig heißt (pro Schritt)
- Tests, Typprüfung und Build ohne Fehler.
- Im Browser geprüft in Handy- und Laptopgröße.
- Commit und Push, ROADMAP abgehakt.
- Kurze Nachricht an dich, was du ausprobieren kannst.

---

## Bekannte Risiken
- **Was „fertig" heißt, handhaben Lehrbücher unterschiedlich**, z. B. ob
  der Nenner ausmultipliziert werden muss. Wir lassen beides zu. Verlangt
  dein Skript etwas anderes, sag es.
- **Speicher-Umzug:** Dein Fortschritt beim Ableiten muss erhalten bleiben.
  Das prüfen eigene Tests und ein Browser-Test mit altem Speicherstand.
