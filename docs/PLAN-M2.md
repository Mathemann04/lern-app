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

Umgesetzt:
- Bruch-Engine in `src/engine/fraction/`:
  - `poly.ts`: Polynome in mehreren Buchstaben mit exakten Zahlen
  - `frac.ts`: Brüche daraus, Übersetzung Termbaum ↔ Polynom; die
    Bausteine $e^x$, $\ln x$, $\sin x$, $\cos x$ zählen als eigene
    Buchstaben
  - `factor.ts`: Zerlegen, Hauptnenner, Kürzen
  - `task.ts`: Aufgabenformen kürzen, plus/minus, mal, geteilt, Doppelbruch
  - `solve.ts`: Rechenweg
  - `errorRules.ts`: 23 typische Fehler
- Vorlagen in `src/engine/tasks/fractionTerms.ts`, 14 Vorlagen für die
  Stufen 1 bis 4. Aufgaben-Nummern wie beim Ableiten; brauchbar ist eine
  Aufgabe nur, wenn das Ergebnis nicht 0 ist, ab Stufe 2 noch einen
  Buchstaben enthält und die Zahlen klein bleiben.
- Schreibweise der Ergebnisse:
  - Zähler ausmultipliziert, Nenner in Faktoren in der Reihenfolge der
    Aufgabe
  - ein Minus vor den Bruch, wenn der ganze Zähler negativ ist, z. B.
    $-\frac{2x + 9}{(x + 3)(x - 3)}$; sonst beginnt der Zähler mit Plus,
    z. B. $\frac{b - a}{ab}$ (geändert in Schritt 3)
  - Produkte alphabetisch ($ax$, $2xy$)
- Rechenweg mit dem ganzen Zwischenstand je Schritt. Beim Kürzen steht, durch
  welchen Faktor gekürzt wird.
- Bei Aufgaben nur mit $x$ nennt die Engine die verbotenen Zahlen
  („gilt für $x \neq -3$"). Dazu zählen auch die Nullstellen des Teilers
  bei „geteilt" und beim Doppelbruch.
- Tests mit 300 Aufgaben je Stufe; vor dem Commit einmal mit 3000 geprüft:
  - Ergebnis exakt gleichwertig und an Zahlenstellen gegengeprüft
  - jeder Schritt wertgleich
  - Ergebnis vollständig gekürzt
  - falsche Antworten nie gleichwertig, im selben Schritt nicht doppelt
  - verbotene Zahlen wirklich verboten
  - jeder typische Fehler kommt in Aufgaben vor
- Formel-Galerie mit Umschalter „Ableiten / Brüche", in der Farbe des
  Gebiets.

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

Umgesetzt:
- Katalog (`src/ui/catalog.ts`): Jedes Thema hat seine Stufen mit Vorschau,
  dazu die Angaben, ob es den freien Modus und gezieltes Üben schon gibt.
  Grundlagen zeigt „Brüche", „Formeln umstellen" (kommt bald) und
  „Potenzen, Wurzeln, Logarithmen" (kommt bald), je mit eigenem Bild.
- Adressen mit Thema: `#/ueben/brueche/1-88`, `#/frei/ableiten/2-4`; alte
  Adressen ohne Thema führen zum Ableiten. Bei Brüchen führt `#/frei/…`
  zum geführten Modus mit derselben Aufgabe, bis Schritt 5 fertig ist.
- Speicher Version 3: Stufe je Thema, zuletzt geübtes Thema, jede gelöste
  Aufgabe mit ihrem Thema, „Eine Stufe höher?" je Thema. Version 2 wird
  umgezogen, alles Bisherige gehört zum Ableiten (Tests für den Umzug,
  Browser-Test mit altem Speicherstand).
- Gemeinsame Typen des geführten Modus in `src/engine/guided/types.ts`;
  `src/ui/courseEngines.ts` lädt die Engine eines Themas erst beim Üben.
  Typische Fehler aller Themen mit Namen in `src/engine/errorCatalog.ts`.
- Schrittplaner für Brüche (`src/engine/guided/fractionPlan.ts`):
  - plus, minus: Hauptnenner, erweitern, Zähler zusammenfassen, kürzen
  - mal: Malnehmen und Kürzen in einem Schritt (die Antwort ist das
    fertige Ergebnis)
  - geteilt: Kehrwert, dann Malnehmen und Kürzen
  - kürzen: Zähler und Nenner zerlegen (wenn nötig), kürzen
  - Ein Schritt ohne passenden typischen Fehler wird nicht einzeln
    abgefragt: Der Hauptnenner steht dann in der Frage zum Erweitern (z. B.
    bei $2 - \frac{3}{5}$), andere Schritte gehen im nächsten oder im
    vorigen auf. Im letzten Schritt ist die Antwort das fertige Ergebnis.
  - Unter „Bisher" steht jeder Zwischenstand, am Ende „Gilt für
    $x \neq \dots$".
- Texte (`src/engine/explain/fractionTexts.ts`): Erklärung je Schritt mit
  den Zahlen der Aufgabe (z. B. welcher Bruch mit welchem Faktor erweitert
  wird), Tipps und zu jedem typischen Fehler ein eigener Text für „Warum
  ist das falsch?".
- Zwei neue typische Fehler, damit jede Frage mindestens eine passende
  falsche Antwort hat (Katalog unten): „Nur den Zähler oder nur den Nenner
  gekürzt" und „Beim Malnehmen den Kehrwert genommen". „Zähler plus
  Zähler, Nenner plus Nenner" gibt es im geführten Modus jetzt nach dem
  Erweitern ($\frac{9}{12} + \frac{10}{12} = \frac{19}{24}$); die Form
  ohne Hauptnenner ($\frac{1}{2} + \frac{1}{3} = \frac{2}{5}$) bleibt für
  den freien Modus.
- Lernkarten-Ordner „Brüche" (`src/engine/explain/fractionCards.ts`):
  Kürzen, Erweitern, Plus und minus, Malnehmen, Teilen (ab Stufe 1),
  Potenzen kürzen (ab Stufe 2). Die durchgerechneten Beispiele rechnet die
  Bruch-Engine (`fractionExample.ts`).
- Fortschrittsseite mit einem Abschnitt je Thema (Stufen und häufigste
  Fehler).
- Vorgezogen aus Schritt 7: Gezieltes Üben auch für Brüche
  (`src/engine/tasks/fractionFocus.ts`), auf der Fortschrittsseite und auf
  den Lernkarten.
- Tests: je Stufe 300 Aufgaben geführt (1 bis 3 falsche Antworten je Frage,
  richtige mit dem Wert der Aufgabe, falsche nie; ein anderer gemeinsamer
  Nenner wird nie als falsch angeboten; Ergebnis numerisch gegengeprüft;
  alle Texte setzbar, „Warum ist das falsch?" verrät die Antwort nicht),
  Lernkarten, Speicher-Umzug, Adressen; Browser-Tests für Brüche, alte
  Adressen und „Weitermachen" mit zwei Themen.

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

Umgesetzt:
- Stufe 3 und 4 sind spielbar (die drei Beispiele oben sind die Aufgaben
  3-189, 4-1998 und 4-37).
- Zerlegen: Zähler und Nenner je ein Schritt. Tipp, Erklärung und Lernkarte
  passen zur Art des Zerlegens (ausklammern, binomische Formel,
  $x^2 + px + q$).
- Hauptnenner mit Termen: Die Erklärung zerlegt zuerst die Nenner
  ($x^2 - 1 = (x + 1)(x - 1)$) und nennt das Produkt der Nenner als
  möglichen, aber unnötig großen gemeinsamen Nenner.
- Doppelbruch: Gefragt ist erst der Zähler als ein Bruch, dann der Nenner,
  dann die Malaufgabe mit dem Kehrwert, dann das Kürzen; „Bisher" zeigt den
  ganzen Doppelbruch. Beim Zusammenfassen im Doppelbruch heißt „Zähler und
  Nenner addiert" ohne Hauptnenner
  ($\frac{1}{x} + \frac{1}{4} = \frac{2}{x + 4}$).
- Ab Stufe 4 sind Erweitern und Zusammenfassen ein Schritt.
- Falsche Ergebnisse, deren Zähler ein Produkt aus Klammern ist, bleiben als
  Produkt stehen ($x(x + 3)(x - 3)$ statt $x^3 - 9x$), so wie man sie nach
  dem Fehler hinschreibt.
- Nach dem Kürzen einer vertauschten Differenz sagt die Erklärung, dass das
  Minus stehen bleibt.
- Neue Lernkarten: Ausklammern, binomische Formeln, Hauptnenner mit Termen,
  Kürzen bei Summen (ab Stufe 3), $x^2 + px + q$ zerlegen, Doppelbrüche,
  Bausteine wie $e^x$ (ab Stufe 4).
- Tests: Schrittplaner für alle vier Stufen mit je 300 Aufgaben, einmal mit
  3000 geprüft; jeder typische Fehler der Stufen 1 bis 4 steht auf einer
  Karte und lässt sich gezielt üben; Browser-Tests für Stufe 3 und 4.

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

Umgesetzt:
- „Frei" gibt es jetzt auch bei Brüchen, Stufe 1 bis 4. Das Beispiel oben
  ist die Aufgabe 3-11641, ein Zahlenbeispiel ist 1-949
  ($\frac{3}{4} + \frac{5}{6}$).
- Prüfung (`src/engine/check/fractionAnswer.ts`): Erst wird der Wert exakt
  verglichen (als Bruch aus Polynomen, keine Zahlenstellen). Ist er gleich,
  wird geprüft, ob die Eingabe fertig ist:
  - ein einziger Bruch (ein Minus davor und $\frac{2}{3}b$ sind erlaubt),
    sonst „Fasse noch zu einem einzigen Bruch zusammen"
  - kein Bruch im Bruch, sonst „Löse den Doppelbruch auf"
  - Zähler und Nenner zusammengefasst: keine Klammer in einer Summe, keine
    gleichartigen Summanden; ein Nenner als Produkt wie $(x - 1)(x + 1)$
    darf stehen bleiben
  - vollständig gekürzt: Der Nenner hat denselben Grad wie im gekürzten
    Ergebnis, und die Zahlen oben und unten haben keinen gemeinsamen Teiler
- Richtig, aber nicht fertig: gelber Kasten mit dem Hinweis, zählt nicht als
  Fehler.
- Sonst wird mit den falschen Ergebnissen aller typischen Fehler verglichen,
  auch der nur für den freien Modus („Zähler plus Zähler, Nenner plus
  Nenner" ohne Hauptnenner). Dazu „Bis auf das Vorzeichen" und „Bis auf
  einen Zahlenfaktor". Ein erkannter Fehler zeigt seinen Namen und „Warum
  ist das falsch?".
- Mathe-Tastatur je Aufgabe: Ziffern, Bruch, Malpunkt, Minus, Klammern,
  Hochzahl und die Buchstaben der Aufgabe (z. B. $a$ und $b$); bei
  Bausteinen auch $e^{\square}$, $\ln$, $\sin$, $\cos$. Fremde Buchstaben
  meldet die App („In der Aufgabe kommt nur $x$ vor").
- Lösungsweg aufdecken wie beim Ableiten, mit den Schritten des geführten
  Modus.
- Der freie Modus ist jetzt für alle Themen gleich gebaut
  (`src/engine/check/freeTask.ts`): Jedes Thema liefert Beschriftung,
  Tastatur und Prüfung, die Oberfläche bleibt dieselbe. Das Ableiten nutzt
  dafür `check/derivativeFree.ts`, unverändert für dich.
- Tests: je Stufe 200 Zufallsaufgaben (das Ergebnis der Engine ist richtig,
  jeder Zwischenschritt richtig oder „noch nicht fertig", die Aufgabe selbst
  nie fertig, jedes falsche Ergebnis eines typischen Fehlers wird erkannt),
  Beispiele für jeden Hinweis; Browser-Tests für die Beispiele oben und die
  Tastatur am Handy.

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

Umgesetzt:
- Stufe 5 ist spielbar, geführt und frei. Sechs Arten von Aufgaben, zum
  Beispiel:
  - Winkelfunktionen: $\frac{3}{1 - \sin x} + \frac{3}{1 + \sin x}$
    (Aufgabe 5-1), $\frac{\frac{1}{\cos x} - \cos x}{\sin x} = \tan x$
    (5-84), $\frac{1}{\sin^2 x} - 1$ (5-12)
  - Wurzeln: $\frac{x - 9}{\sqrt{x} - 3}$ (5-2),
    $\frac{1}{\sqrt{x} - 5} + \frac{1}{\sqrt{x} + 5}$ (5-19)
  - zwei Variablen: $\frac{\frac{4}{x + h} - \frac{4}{x}}{h}$ (5-9),
    $\frac{(a + 3b)^2 - a^2}{b}$ (5-3)
  - mehrere Rechenarten:
    $\left(\frac{x}{y} - \frac{y}{x}\right) : \frac{x - y}{xy}$ (5-15),
    $\left(1 + \frac{1}{x - 1}\right) \cdot \frac{x^2 - 1}{2x}$ (5-6)
  - verschachtelte Doppelbrüche:
    $\frac{x}{1 - \frac{1}{1 + \frac{1}{x}}}$ (5-17)
  - e-Funktion: $\frac{e^{2x} - 4e^x}{e^x}$ (5-8)
- Neue Schritte im geführten Modus:
  - „Regel anwenden": $\sin^2 x + \cos^2 x = 1$ im Zähler oder Nenner,
    bei Wurzeln $(\sqrt{x} - 5)(\sqrt{x} + 5) = x - 25$
  - „Ausmultiplizieren": $(x + h)^2$ mit binomischer Formel
  - „Innerer Doppelbruch": erst der innere, dann wie gewohnt
  - „Erste Klammer": bei mehreren Rechenarten jede Klammer zu einem
    Bruch; bei „geteilt" zuerst mit dem Kehrwert malnehmen
- Die Engine kennt die Regeln der Bausteine: Mit $\sqrt{x}$ rechnet sie
  durchgehend in $\sqrt{x}$ ($x = (\sqrt{x})^2$), beim Vergleichen gilt
  $\sin^2 x + \cos^2 x = 1$, und $\tan x = \frac{\sin x}{\cos x}$. Die
  Ergebnisse stehen wie im Skript: $\frac{6}{\cos^2 x}$, $\tan x$,
  $\frac{2\sqrt{x}}{x - 25}$. Faktoren wie $1 - \sin x$ behalten die $1$
  vorn.
- Freier Modus: Jede gekürzte Form zählt, auch
  $\frac{6}{1 - \sin^2 x}$ statt $\frac{6}{\cos^2 x}$ oder
  $\frac{\sin x}{\cos x}$ statt $\tan x$. $\sqrt{x}$ darf auch als
  $x^{\frac{1}{2}}$ eingegeben werden. Die Tastatur hat bei Wurzeln eine
  Wurzeltaste und bei Winkelfunktionen zusätzlich $\tan$.
- Drei neue typische Fehler (Katalog unten): „Quadrat vergessen", „Beim
  Quadrieren das Mittelglied vergessen", „Im Inneren einer Funktion
  gekürzt".
- Neue Lernkarte „Bausteine mit eigenen Regeln" (ab Stufe 5); die Karten
  „Binomische Formeln" und „Doppelbrüche" erklären zusätzlich das
  Ausmultiplizieren und Doppelbrüche im Doppelbruch.
- Tests: je Stufe 300 Aufgaben (einmal mit 2000 geprüft), wie bei den
  anderen Stufen exakt und an Zahlenstellen gegengeprüft; jeder neue Fehler
  mit Katalogbeispiel, auf einer Karte und gezielt übbar; freie Eingabe mit
  Beispielen für Wurzel, Winkelfunktionen und zwei Variablen;
  Browser-Tests für Stufe 5 geführt und frei.

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

### Katalog der Fehlerregeln

Umgesetzt in `src/engine/fraction/errorRules.ts` (Ids mit `frac-`), je mit
Katalogbeispiel in `errorRules.test.ts`. Die Fehler beim Hauptnenner gibt es
nur im geführten Modus (mit einem falschen Hauptnenner kann man nicht
weiterrechnen). Die Fehler zu Bausteinen gibt es seit Schritt 6 (Stufe 5).

| Rechenart | Typischer Fehler | Beispiel (falsch) |
| --- | --- | --- |
| Plus, minus | Zähler plus Zähler, Nenner plus Nenner | $\frac{1}{2} + \frac{1}{3} = \frac{2}{5}$ |
| Plus, minus | Nenner gleichnamig gemacht, Zähler nicht erweitert | $\frac{1}{2} + \frac{1}{3} = \frac{2}{6}$ |
| Plus, minus | Klammer um den zweiten Zähler vergessen | $3(x+1) - 2(x-1) = 3x + 3 - 2x - 2$ |
| Plus, minus | ganze Zahl nur zum Zähler addiert (nicht erweitert) | $1 + \frac{2}{x} = \frac{3}{x}$ |
| Erweitern | mit dem eigenen Nenner erweitert | $\frac{3}{x-1} = \frac{3(x-1)}{(x-1)(x+1)}$ |
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
| Doppelbruch | Term im Nenner in den Zähler geholt | $\frac{\frac{a}{b}}{x} = \frac{ax}{b}$ |
| Potenzen | Exponenten geteilt statt abgezogen | $\frac{x^6}{x^2} = x^3$ |
| Kürzen | nur den Zähler oder nur den Nenner gekürzt (neu in Schritt 3) | $\frac{14}{12} = \frac{7}{12}$ |
| Mal | beim Malnehmen den Kehrwert genommen (neu in Schritt 3) | $\frac{3}{4} \cdot \frac{2}{5} = \frac{3 \cdot 5}{4 \cdot 2}$ |
| Bausteine | im Inneren einer Funktion gekürzt (neu in Schritt 6) | $\frac{e^{2x}}{e^x} = e^2$ |
| Quadrieren | beim Quadrieren das Mittelglied vergessen (neu in Schritt 6) | $(\sqrt{x}+1)^2 = x + 1$, $(x + h)^2 = x^2 + h^2$ |
| Bausteine | Quadrat vergessen (neu in Schritt 6) | $1 - \cos^2 x = \sin x$, $(\sqrt{x})^2 = \sqrt{x}$ |

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
