# Entscheidungen

Wörtlich aus docs/ROADMAP.md hierher verschoben (Stand vor dem Umbau).
Neue Entscheidungen unten anfügen.

- 28.10.2026: Plan M1 freigegeben. Stufe 4 vorgezogen (Schritt 7).
- 28.10.2026: Handy-Test über GitHub Pages, Repo ist dafür öffentlich.
  Adresse: https://mathemann04.github.io/lern-app/
- 28.10.2026: Claude erstellt am Ende jeder Sitzung den Pull Request selbst.
- 28.10.2026: Definitionsbereich nach deutscher Schulkonvention: Wurzeln aus
  negativen Zahlen sind nicht definiert, auch nicht die dritte Wurzel
  (änderbar, falls das Skript es anders handhabt). Für ungerade Wurzeln ersetzt seit M6 Schritt 4c (12.11.2026).
- 29.10.2026: Geführter Modus für Produkt und Quotient: $u'$, $v'$, dann
  Einsetzen (Antworten als eingesetzte Formel, Ergebnis danach
  zusammengefasst). Kettenregel: äußere Ableitung nach $u$, innere
  Ableitung, Zusammensetzen. Ein Faktor davor wird beim Einsetzen mitgeführt.
- 29.10.2026: Bei der Regelwahl gilt die Produktregel bei Brüchen und bei
  Potenzen wie $\sin^2 x$ nie als falsch (gleichwertiger Weg).
- 29.10.2026: Neue Fehlerregeln: $(\ln x)' = \ln x$, $(\ln x)' = \frac{1}{\ln x}$,
  Exponent nicht als Faktor nach vorne geholt ($(x^3)' = x^2$).
- 29.10.2026: Freier Modus: Eingabe mit MathLive und eigener
  Bildschirm-Tastatur (lädt erst im freien Modus, offline vorgehalten),
  eigener Leser für die Eingabe (`src/engine/parse/`). Richtig ist jede
  gleichwertige Form; geprüft an den Werten im Definitionsbereich, nicht nur
  über die Normalform (die darf den Definitionsbereich vergrößern). Erkannt
  werden alle typischen Fehler, dazu „Funktion selbst eingegeben",
  „Vorzeichen falsch" und „falscher Zahlenfaktor". Moduswahl „Geführt/Frei"
  auf der Startseite, gespeichert.
- 29.10.2026: Stufe 4 geführt und frei. Rechenweg gröber: Bei der
  Kettenregel entfällt der eigene Schritt „Äußere Ableitung"; deren typische
  Fehler erscheinen beim Zusammensetzen. Bleibt bei der Regelwahl keine
  sicher falsche Regel, kommt die Faktorregel als falsche Option dazu (wenn
  sie nirgends gebraucht wird); sonst entfällt die Regelwahl (etwa 4 % der
  Stufe-4-Aufgaben).
- 29.10.2026: Endform löst Doppelbrüche auf (wie im Skript):
  $\frac{(-3x^4 + x^3 - 3x^2 + 2x)e^{-3x}}{(x^2+1)^{3/2}}$ statt eines
  Bruchs im Bruch. Lange Formeln werden am Handy automatisch etwas kleiner
  gesetzt.
- 29.10.2026: Fortschritt: Eine Aufgabe zählt als „ohne Fehler", wenn keine
  falsche Antwort gegeben wurde (Tipp ist erlaubt, aufgedeckter Lösungsweg im
  freien Modus nicht). Vorschlag „Eine Stufe höher?" bei mindestens 8 von den
  letzten 10 Aufgaben einer Stufe ohne Fehler; nach „Später" erst wieder nach
  10 weiteren Aufgaben. Fehlerstatistik zählt im geführten Modus nur den
  ersten Fehlgriff je Schritt, im freien Modus jeden typischen Fehler einmal
  je Aufgabe. Gezieltes Üben sucht Aufgaben, in denen genau dieser Fehler
  passieren kann, zuerst in der gewählten Stufe; im geführten Modus erscheint
  er dann sicher als Antwort. Speicher-Format Version 2 (mit Fortschritt).
- 29.10.2026: Lernkarten: eine Karte je Regel der Stufen 1 bis 4 (15 Karten)
  mit Formel, Merksatz, Beispielen mit Rechenweg aus der Engine und typischen
  Fehlern. Aus einer Aufgabe öffnen sie sich als Fenster über der Aufgabe;
  bei der Regelwahl mit allen angebotenen Regeln, damit die Antwort nicht
  verraten wird. Beispiele, die Teil der Aufgabe sind, werden dort nicht
  gezeigt. Lernkarten zählen wie ein Tipp (Aufgabe bleibt „ohne Fehler").
- 29.10.2026: Lernkarten in Ordnern nach Themen (bisher „Ableitungen"), im
  Ordner die Namen der Formeln mit den Formeln. Hauptmenü als Leiste unten
  (Start, Lernkarten, Fortschritt, Einstellungen), am Laptop oben; in
  Aufgaben ausgeblendet. Unterseiten haben oben einen Zurück-Knopf.
- 29.10.2026: Stufe 5 (ohne implizites Ableiten) geführt und frei.
  Logarithmisches Ableiten in vier Schritten (Regel, Logarithmieren, rechte
  Seite ableiten, mit $f(x)$ malnehmen). Neue typische Fehler für
  $x^x$, $\arcsin$, $\sinh$, $\tanh$ und die Areafunktionen. Die Ableitung
  der Umkehrfunktion steht als Herleitung auf der Lernkarte; eigene
  Aufgaben dazu bei Bedarf später. Mathe-Tastatur mit zweiter Seite „Mehr
  Funktionen". Aufgaben zum impliziten Ableiten wurden bis Schritt 11
  übersprungen.
- 29.10.2026: Implizites Ableiten geführt und frei. Geführt in drei
  Schritten: einen Term mit $y$ ableiten (die neue Idee: Faktor $y'$),
  beide Seiten ableiten, nach $y'$ auflösen. Ergebnis $y'$ in $x$ und $y$;
  im freien Modus zählt jede Form, die auf der Kurve denselben Wert hat
  (mit „$y' =$" davor oder ohne). Wer $y$ durch einen Term mit $x$ ersetzt,
  bekommt den Hinweis, $y$ stehen zu lassen. Taste $y$ auf der
  Mathe-Tastatur (statt $\pi$, das in keiner Aufgabe vorkommt). Namen
  typischer Fehler setzen Zeichen wie $y$ oder $\ln a$ jetzt als Formel.
- 29.10.2026: Aufbau wie bei Brilliant: Startseite mit den Fächern als
  Überschriften und ihren Gebieten als Kacheln (Kommendes blass mit
  „kommt bald"), Gebiet → Themen → Stufen. Karte „Weitermachen" ganz oben.
  Ableiten gehört zur Differentialrechnung. Neue Fächer, Gebiete und Themen
  kommen in `src/ui/catalog.ts` dazu.
- 29.10.2026: Meilenstein 1 abgeschlossen (Schritt 12: Animationen,
  Tippflächen, Ladezeit).
- 29.10.2026: Brüche und Formeln umstellen getrennt (Wunsch des Nutzers):
  zwei Themen im Gebiet „Grundlagen" und zwei Meilensteine (M2 Brüche,
  M3 Formeln umstellen); die späteren Meilensteine rücken eine Nummer
  weiter.
- 29.10.2026: Plan M2 freigegeben mit zwei Ergänzungen des Nutzers:
  „fiesere" Bausteine in den Stufen 4 und 5 ($e^x$, $\ln x$, $\sin x$;
  in Stufe 5 auch $\sqrt{x}$ und Winkelfunktionen mit ihren Regeln) und
  ein neues Aussehen als Schritt 1 (dunkles Design wie das Gerät oder fest
  gewählt, Farben je Gebiet, farbige Symbole wie bei Brilliant).
- 29.10.2026: Neues Aussehen (Schritt 1 von M2): Hell/Dunkel in den
  Einstellungen („Automatisch" wie das Gerät, „Hell", „Dunkel"). Farben je
  Gebiet: Grundlagen orange, Differentialrechnung blau, Integralrechnung
  violett, Formeln mit Einheiten pink, Statik türkis; Startseite, Menü und
  Einstellungen bleiben Blaugrün. Farbige Bilder für Gebiete und Themen;
  „kommt bald" zeigt das Bild blass.
- 29.10.2026: Bruch-Engine (Schritt 2 von M2): rechnet exakt mit Polynomen
  statt mit Zahlenstellen, zerlegt wie im Skript (ausklammern, binomische
  Formeln, $x^2 + px + q$), Ergebnis mit ausmultipliziertem Zähler und
  Nenner in Faktoren; „gilt für $x \neq \dots$" bei Aufgaben mit $x$. 23
  typische Fehler, Bruchaufgaben in der Formel-Galerie.
- 30.10.2026: Mehrere Themen (Schritt 3 von M2): Das Gebiet „Grundlagen"
  ist offen mit „Brüche" (Stufe 1 und 2 geführt), „Formeln umstellen" und
  „Potenzen, Wurzeln, Logarithmen" kommen bald. Jedes Thema merkt sich
  seine Stufe, „Weitermachen" führt zum zuletzt geübten Thema, Fortschritt
  und häufigste Fehler stehen je Thema. Speicher Version 3; der alte Stand
  gehört zum Ableiten. Adressen mit Thema (`#/ueben/brueche/1-88`), alte
  Adressen führen zum Ableiten. Der freie Modus fehlt bei Brüchen noch
  (Schritt 5), deshalb steht „Frei" dort auf „kommt bald".
- 30.10.2026: Geführter Modus für Brüche: Ein Schritt ohne passenden
  typischen Fehler wird nicht einzeln abgefragt (z. B. der Hauptnenner bei
  $2 - \frac{3}{5}$), Malnehmen und Kürzen sind ein Schritt. Zwei neue
  typische Fehler: „Nur den Zähler oder nur den Nenner gekürzt" und „Beim
  Malnehmen den Kehrwert genommen". „Zähler plus Zähler, Nenner plus
  Nenner" gibt es im geführten Modus nach dem Erweitern
  ($\frac{9}{12} + \frac{10}{12} = \frac{19}{24}$). Gezieltes Üben
  funktioniert für Brüche schon (vorgezogen aus Schritt 7).
- 30.10.2026: Schreibweise der Brüche: Der Zähler beginnt möglichst mit
  Plus ($\frac{b - a}{ab}$ statt $-\frac{a - b}{ab}$); nur wenn alles
  negativ ist, steht das Minus vor dem Bruch.
- 30.10.2026: Stufen 3 und 4 bei Brüchen (Schritt 4 von M2): Zerlegen mit
  Tipps je Art (ausklammern, binomische Formel, $x^2 + px + q$),
  Hauptnenner mit Termen, Doppelbrüche Schritt für Schritt; ab Stufe 4 sind
  Erweitern und Zusammenfassen ein Schritt. Sieben neue Lernkarten, darunter
  „Bausteine wie $e^x$". Falsche Ergebnisse mit Klammern bleiben als
  Produkt stehen.
- 30.10.2026: Freier Modus für Brüche (Schritt 5 von M2): Richtig ist jede
  gleichwertige Form, die fertig ist (ein Bruch, zusammengefasst,
  vollständig gekürzt); der Nenner darf ausmultipliziert oder als Produkt
  dastehen. Richtig gerechnet, aber nicht fertig gibt einen Hinweis, was
  fehlt, und zählt nicht als Fehler. Die Mathe-Tastatur zeigt nur die
  Buchstaben der Aufgabe (bei Bausteinen dazu $e^x$, $\ln$, $\sin$,
  $\cos$). Der freie Modus ist für alle Themen gleich gebaut; neue Themen
  liefern nur noch Tastatur und Prüfung.
- 30.10.2026: Fehler behoben (vom Nutzer gemeldet): Im dunklen Design war
  die Eingabe im freien Modus auf manchen Handys schwarz auf schwarz. Das
  Eingabefeld nimmt seine Farben jetzt aus der App statt vom Browser,
  Cursor und Markierung folgen der Einstellung „Aussehen". Die Spalten der
  Mathe-Tastatur stehen jetzt genau untereinander.
- 30.10.2026: Stufe 5 bei Brüchen (Schritt 6 von M2): mehrere Rechenarten,
  verschachtelte Doppelbrüche, zwei Variablen (Differenzenquotient),
  Wurzeln und Winkelfunktionen mit ihren Regeln, e-Funktion. Ergebnisse wie
  im Skript ($\frac{6}{\cos^2 x}$, $\tan x$, $\frac{2\sqrt{x}}{x - 25}$);
  im freien Modus zählt jede gekürzte Form, auch $\frac{6}{1 - \sin^2 x}$.
  Drei neue typische Fehler: „Quadrat vergessen", „Beim Quadrieren das
  Mittelglied vergessen" (auch $(x + h)^2 = x^2 + h^2$) und „Im Inneren
  einer Funktion gekürzt" ($\frac{e^{2x}}{e^x} = e^2$; die Variante mit
  $\sin(2x)$ entfällt, weil $\sin(2x)$ in keiner Aufgabe vorkommt). Neue
  Lernkarte „Bausteine mit eigenen Regeln".
- 30.10.2026: Meilenstein 2 abgeschlossen (Schritt 7: Durchgang durch alle
  Seiten der Brüche, lange Formeln setzen sich kleiner statt umzubrechen,
  Doppelbrüche in voller Größe, Tippflächen mindestens 44 px, Offline-Test
  für Brüche). Als Nächstes: Plan für M3 (Formeln umstellen).
- 30.10.2026: Plan M3 überarbeitet (Wunsch des Nutzers): deutlich
  schwerere Aufgaben, vor allem in Stufe 5 (e-Funktion, $\ln$,
  Substitution, $pq$-Formel). Mathe und Physik getrennt: M3 heißt
  „Gleichungen umstellen" (reine Mathematik mit $x$, $y$, $a$, $b$, $c$,
  $k$); Formeln mit Zeichen der Physik und „Aufgaben lösen" (Formel wählen,
  umstellen, Werte mit Einheiten einsetzen) kommen in M6 (heute M10) und nutzen
  dieselbe Engine.
- 30.10.2026: Plan M3, 3. Fassung (Wunsch des Nutzers: Stufen 4 und 5
  noch schwerer, „fast alle Themengebiete"): Stufe 3 mit Wurzeln, Stufe 4
  verschachtelt (e und $\ln$ ineinander, Wurzeln in Wurzeln, Potenz- und
  Logarithmusgesetze, Winkel- und Hyperbelfunktionen, Scheinlösungen),
  Stufe 5 quer durch die Mathematik (Ableitung, Integral, Summe und Reihe,
  Grenzwert, komplexe Zahl, Determinante, Vektor, Differentialgleichung:
  erst ausrechnen, dann umstellen). 7 statt 6 Schritte.
- 30.10.2026: Plan M3 freigegeben. Schritt 1: Umstell-Engine für die
  Stufen 1 bis 3 (schälen von außen nach innen; bei mehrfacher Variable
  Nenner beseitigen, ausmultiplizieren, sortieren, ausklammern, teilen;
  Wurzeln allein stellen und quadrieren, √x als Unbekannte), Endform über
  die Bruch-Engine mit beliebigen Buchstaben, elf typische Fehler plus die
  Fehler aus „Brüche" beim Zusammenfassen, Galerie „Umstellen". Gegenprobe
  durch Einsetzen; beim Quadrieren merkt sich die Engine, wann es eine
  Lösung gibt (z. B. $y^2 < a$ bei $y = \sqrt{x + a} - \sqrt{x}$).
  „Geteilt, obwohl die Variable noch auf beiden Seiten steht" ist keine
  Fehlerregel: Die Gleichung stimmt ja, sie ist nur nicht fertig (im freien
  Modus „noch nicht aufgelöst").
- 30.10.2026: Formel-Galerie aufgebaut wie die Startseite (Wunsch des
  Nutzers): Übersicht mit Fach, Gebieten und Themen als Kacheln, je Thema
  eine eigene Seite (`#/galerie/brueche`). Schreibweise-Beispiele für
  Stufe 5 von „Gleichungen umstellen" (Integral, Summe, Grenzwert,
  Determinante, komplexe Zahlen, Vektor) schon jetzt zum Prüfen. Das Thema
  heißt jetzt „Gleichungen umstellen". Neues App-Symbol: vier Entwürfe
  liegen dem Nutzer zur Auswahl vor.
- 30.10.2026: Neues App-Symbol „Wurzel-Weg" (Wahl des Nutzers aus vier
  Entwürfen): Wurzelzeichen, dessen Strich zu einem gelben Ziel-Punkt führt,
  auf einem Verlauf in Blaugrün (`scripts/generate-icons.ts`).
- 30.10.2026: Stufe 5 soll in jedem Thema „kaum noch schwerer" sein (Wunsch
  des Nutzers). Ableiten und Brüche werden direkt nach M3 nachgeschärft
  (siehe „Vorgemerkt"); neue Themen werden gleich so geplant.
- 30.10.2026: Thema „Gleichungen umstellen" freigeschaltet (Schritt 2 von
  M3), Stufen 1 und 2 geführt. Je Umformung erst „Was machst du als
  Nächstes?" mit einer Frage zum Ziel (z. B. „Wie wirst du $+c$ auf der
  rechten Seite los?"; falsche Antworten sind Irrwege wie „nur auf der
  linken Seite" mit eigener Erklärung), dann „Was kommt heraus?" mit
  falschen Gleichungen aus den typischen Fehlern. Gibt es für eine
  Umformung keinen typischen Fehler, steht ihr Ergebnis gleich unter
  „Bisher". Die Bedingung des Ergebnisses steht dabei (z. B. „Gilt für
  $a \neq c$."). Neuer Lernkarten-Ordner mit vier Karten. Antworten aus
  Text brechen jetzt in allen Themen um, statt kleiner zu werden; nur
  Formeln setzen sich kleiner. Freier Modus und gezieltes Üben folgen in
  Schritt 3 bzw. 7.
- 30.10.2026: „Gleichungen umstellen" Stufe 3 geführt und frei für die
  Stufen 1 bis 3 (Schritt 3 von M3). Frei: Eingabe der rechten Seite oder
  einer ganzen Gleichung; stimmt sie für die Lösung, aber $x$ steht noch
  nicht allein, heißt es „Richtig umgeformt, aber noch nicht fertig" (kein
  Fehler). Fertig heißt: ein Bruch, zusammengefasst, gekürzt; ein Bruch
  unter einer Wurzel oder im Quadrat zählt wie ein Bruch
  ($\sqrt{\frac{a - y^2}{6}}$, $\left(\frac{a - y^2}{2y}\right)^2$).
  Verglichen wird an Prüfstellen im erlaubten Bereich, falsche Ergebnisse
  der typischen Fehler auch dort, wo sie nur an wenigen Stellen definiert
  sind. Eigene Tastatur mit allen Buchstaben der Aufgabe. Drei neue
  Lernkarten: Mit dem Hauptnenner malnehmen, Kehrwert, Wurzel und Quadrat.
  Ist $\sqrt{x}$ die Unbekannte, sprechen Frage und Antworten beim
  Sortieren von $\sqrt{x}$ (vorher stach die richtige Antwort heraus).
- 31.10.2026: Rückmeldung des Nutzers nach Schritt 3 von M3: Die Art gefällt,
  aber die Aufgaben sind viel zu ähnlich (gilt für alle Themen). Gemessen
  bei den Brüchen: Stufe 1 hat 5 Formen, Stufe 3 nur 9; bei 127 von 200
  Aufgaben der Stufe 1 kam dieselbe Form schon unter den vier davor. M3
  pausiert nach Schritt 3; zuerst M2b „Brüche nachschärfen" (Plan:
  [PLAN-M2b.md](PLAN-M2b.md)), dann die anderen Themen. Neue Arbeitsregel
  „Abwechslung" in CLAUDE.md.
- 31.10.2026: Plan M2b freigegeben mit Änderungen des Nutzers: mindestens
  100 Formen je Stufe; Stufe 5 zusätzlich mit Brüchen aus späteren Kapiteln
  (komplexe Zahlen teilen, Grenzwerte von Brüchen, Teleskopsummen,
  Hyperbelfunktionen) als eigener Schritt 5. Dezimalzahlen in Stufe 1: ja.
  Das Inhaltsverzeichnis seines Buchs „Mathe für Ingenieure" ist der
  Maßstab fürs Niveau (docs/LEHRBUCH.md).
- 04.11.2026: M2b Schritt 1 fertig. Brüche der Stufen 1 und 2 kommen aus
  einem Baukasten: zwei bis vier Brüche, Plus, Minus, Mal, Geteilt,
  Klammern, Doppelbrüche, in Stufe 1 auch Dezimalzahlen, in Stufe 2
  Buchstaben aus dem ganzen Alphabet (außer $e$ und $i$). Gemessen in je
  200 Aufgaben: Stufe 1 rund 160 Formen, Stufe 2 rund 200 (vorher 5 bzw.
  ähnlich wenige); keine Form öfter als 3 %. Die App merkt sich die letzten
  zehn Formen je Thema und Stufe und zieht bei „Nächste Aufgabe" eine
  andere (für alle Themen, auch Umstellen und Ableiten, dort mit den
  bisherigen Vorlagen). Gerechnet wird Teil für Teil („Teilrechnung"),
  vorher fragt die App „Was rechnest du zuerst?", wenn Punkt vor Strich oder
  eine Klammer zählt. Vier neue typische Fehler (von links nach rechts,
  Klammer übersehen, Minus vor der Klammer, Stellen der Dezimalzahl) und
  zwei Lernkarten. Frei: „noch nicht fertig", wenn noch ein Produkt wie
  $3 \cdot 3b^2$ oder eine Dezimalzahl dasteht. Zu einfache Teile
  ($2 \cdot 5$, $5 - 5$) und Zwischenergebnisse $0$ oder $1$ werden
  aussortiert. Alte Links auf einzelne Aufgaben der Stufen 1 und 2 zeigen
  jetzt andere Aufgaben.
- 04.11.2026: M2b Schritt 2 fertig. Stufen 3 und 4 kommen aus dem Baukasten:
  Jede Aufgabe hat eine „Welt" aus Klammern (z. B. $x - 3$, $x + 3$; $a - 2b$,
  $a + b$; $2x - 3$; $(a + b)$ und $(x - y)$; $e^x \pm 2$), aus der Zähler
  und Nenner gebaut werden; so haben die Brüche gemeinsame Faktoren.
  Stufe 3: ausklammern (auch Buchstaben), alle binomischen Formeln, zwei
  Buchstaben, vertauschte Differenzen, bis zu drei Brüche, Mal und Geteilt.
  Stufe 4: zerlegen mit Zahl vorn, mit zwei Buchstaben ($a^2 - ab - 2b^2$),
  in Gruppen ($ax - ay + bx - by$), Doppelbrüche mit Buchstaben, Bausteine.
  Gemessen in je 200 Aufgaben: rund 190 Formen je Stufe (vorher 9 bzw. 31),
  keine Form öfter als 2 %. Die Engine zerlegt jetzt auch mit zwei Buchstaben
  und in Gruppen, ohne dass die Aufgabe die Faktoren vorgibt. Neu: „Gilt
  für …" auch bei anderen Buchstaben als $x$, Tipps je Zerlege-Art, zwei
  neue typische Fehler und zwei Lernkarten; frei zählt „Bruch mal Zahl" als
  noch nicht fertig. Zu lange Ergebnisse und Nenner wie $-6 - b$ werden
  aussortiert. Alte Links auf einzelne Aufgaben der Stufen 3 und 4 zeigen
  jetzt andere Aufgaben.
- 04.11.2026: M2b Schritt 3 fertig. Stufe 5 hat sieben Vorlagen mit
  Anteilen: alles ineinander (drei oder vier Brüche, mindestens zwei
  Rechenarten, Doppelbruch auch im Inneren), Doppelbruch im Doppelbruch,
  Differenzenquotienten (auch $(x + h)^3$, $\frac{1}{(x + h)^2}$,
  $\frac{x}{x + c}$ und $\sqrt{x}$), dritte Potenzen ($a^3 - b^3$,
  $8x^3 - 27$), Wurzeln mit einem oder zwei Buchstaben (kürzen wie
  $\frac{x - a}{\sqrt{x} - \sqrt{a}}$, Wurzel im Nenner beseitigen,
  Summen), Winkelfunktionen und $e^x$, $\ln x$, $\sin x$, $\cos x$
  gemischt. Gemessen: 161 Formen in 200 Aufgaben, keine öfter als 2,5 %.
  Die Engine kennt Wurzeln aus jedem Buchstaben und $\sqrt{x + h}$
  (gerechnet mit $h = (\sqrt{x + h})^2 - x$, geschrieben wieder als $h$);
  „Wurzel beseitigen" ist eine eigene Regel (geführt: mit dem Gegenstück
  erweitern, dann ausmultiplizieren; frei: fertig erst ohne Wurzel im
  Nenner). Vier neue typische Fehler und zwei Lernkarten („Dritte
  Potenzen", „Wurzeln im Nenner beseitigen"). Zerlegungen schreiben die
  Klammer mit kleinerem Grad zuerst, $\cos x - 1$ nicht mehr als
  $-1 + \cos x$. Gezieltes Üben sucht seltene Fehler in ihrer Vorlage (`focus`, z. B. „Wurzeln“) und findet sie so zuverlässig.
  Alte Links auf einzelne Aufgaben der Stufe 5 zeigen jetzt andere
  Aufgaben.
- 04.11.2026: M2b Schritt 4 fertig. Stufe 5 hat die Partialbruchzerlegung
  als eigene Aufgabenart („Zerlege in Partialbrüche"): Nenner aus zwei oder
  drei Linearfaktoren, mit doppeltem Faktor, oft mit Polynomdivision vorweg.
  Neue Engine `fraction/partial.ts` (Polynomdivision, Ansatz, Zahlen durch
  Einsetzen der Nullstellen und Koeffizientenvergleich, exakt; die Probe
  fasst die Zerlegung wieder zusammen). Geführt: Polynomdivision, Nenner
  zerlegen, Ansatz, je Zahl eine Frage, zuletzt die ganze Zerlegung. Frei:
  Summe einfacher Brüche, jede Reihenfolge, Zahlen auch als Bruch wie
  $\frac{4}{9(x - 1)}$. Sechs neue typische Fehler, zwei Lernkarten
  („Polynomdivision", „Partialbruchzerlegung"). Die neue Vorlage wird mit
  eigenem Zufall gewählt (etwa 15 % der Nummern); die übrigen Nummern der
  Stufe 5 behalten ihre Aufgabe, 5-123 ist jetzt eine Partialbruchaufgabe.
  Abwechslung weiter mindestens 100 Formen in 200 Aufgaben.
- 05.11.2026: M2b Schritt 5 in vier Teile aufgeteilt (komplexe Zahlen,
  Grenzwerte, Teleskopsummen, Hyperbelfunktionen), jeder für sich zum
  Ausprobieren. Teil 5a fertig: Stufe 5 hat „Komplexe Zahlen teilen" als
  eigene Aufgabenart. Die Bruch-Engine rechnet mit $\mathrm{i}$ und
  $\mathrm{i}^2 = -1$ (`fraction/complex.ts`); geführt: Potenzen von
  $\mathrm{i}$, mit dem konjugiert Komplexen erweitern, ausmultiplizieren,
  aufteilen; frei: Ergebnis als $a + b\,\mathrm{i}$, Taste $\mathrm{i}$ auf der
  Tastatur. Sieben neue typische Fehler, Lernkarte „Komplexe Zahlen teilen".
  Die Vorlage wird mit eigenem Zufall gewählt (etwa 8 % der Nummern); die
  Partialbruch-Nummern bleiben, von den übrigen Nummern der Stufe 5 zeigen
  einige jetzt eine Aufgabe mit komplexen Zahlen.
- 05.11.2026: M2b Teil 5b fertig: Stufe 5 hat „Grenzwerte" als eigene
  Aufgabenart. $x \to a$ mit $\frac{0}{0}$ (zerlegen, kürzen, einsetzen; auch
  Summen und Wurzeln) und $n \to \infty$ (durch die höchste Potenz teilen,
  auch „$\infty - \infty$"). Neue Engine `fraction/limit.ts`; geführt mit dem
  Limes in „Bisher", frei ist eine Zahl gesucht. Sieben neue typische Fehler,
  Lernkarte „Grenzwerte von Brüchen". Etwa 8 % der übrigen Nummern der
  Stufe 5 zeigen jetzt einen Grenzwert (in den Browser-Tests ersetzt: 5-204
  durch 5-101, 5-1537 durch 5-4778, 5-3326 durch 5-3734).
- 05.11.2026: M2b Teil 5c fertig: Stufe 5 hat „Teleskopsummen" als eigene
  Aufgabenart. Summand in Partialbrüche zerlegen, Summe ausschreiben, was
  übrig bleibt, dann zusammenfassen; bis $n$, bis zu einer Zahl oder als Reihe
  (Grenzwert der Teilsumme). Neue Engine `fraction/telescope.ts`, Gegenprobe
  mit einzeln addierten Teilsummen. Sechs neue typische Fehler, Lernkarte
  „Teleskopsummen". Etwa 8 % der übrigen Nummern der Stufe 5 zeigen jetzt eine
  Teleskopsumme (in den Browser-Tests ersetzt: 5-82 durch 5-25, 5-139 durch
  5-51).
- 05.11.2026: M2b Teil 5d fertig, damit Schritt 5 komplett: Stufe 5 hat
  „Hyperbelfunktionen" als eigene Aufgabenart. $\sinh x$ und $\cosh x$ sind
  Bausteine wie $\sin x$ und $\cos x$, mit $\cosh^2 x - \sinh^2 x = 1$; dazu
  $\frac{1}{\cosh x - \sinh x}$ mit dem Gegenstück erweitern. Frei zählt auch
  $e^x = \cosh x + \sinh x$; Tastatur mit $\sinh$, $\cosh$, $\tanh$. Zwei neue
  typische Fehler, Lernkarte „Hyperbelfunktionen". Etwa 6 % der übrigen
  Nummern der Stufe 5 zeigen jetzt Hyperbelfunktionen (die Nummern in den
  Browser-Tests sind gleich geblieben).
- 05.11.2026: M2b fertig (Schritt 6): Jeder typische Fehler der Brüche lässt
  sich gezielt üben, von der Lernkarte und vom Fortschritt aus (Test für alle
  Fehler). Die Suche nach einer passenden Aufgabe geht reihum durch die
  Stufen und ist im Mittel etwa 0,3 Sekunden schnell; solange steht ein
  Hinweis da. Die Formel-Galerie zählt je Thema die Formen jeder Stufe
  („Abwechslung je Stufe"); Brüche: 158 bis 196 Formen je Stufe unter 200
  Aufgaben, keine öfter als in 2,5 %. Design-Durchgang am Handy und Laptop,
  hell und dunkel. Als Nächstes: Plan für Baukasten und Abwechslung bei
  „Gleichungen umstellen" (Stufen 1 bis 3), danach M3 ab Schritt 4.
- 05.11.2026: Plan M3, 4. Fassung, freigegeben mit deiner Änderung (ab
  Stufe 3 Kerne ineinander und gegeneinander, Test der Umformungen).
- 05.11.2026: M3 Schritt 4 fertig: Die Stufen 1 und 2 von „Gleichungen
  umstellen" kommen aus einem Baukasten aus Kern und Schalen. Unter 200
  Aufgaben gibt es jetzt 195 bzw. 192 verschiedene Formen (vorher 8 und 11),
  keine öfter als in 2 von 100; etwa jede fünfte Aufgabe wird nach einem
  Buchstaben aufgelöst. Drei neue typische Fehler: nicht jeden Summanden
  malgenommen, Minus vor der Klammer nur beim ersten Summanden, beim
  Ausklammern das Minus verloren. Schönere Rechenwege (kein Doppelbruch
  mehr, wenn die Variable im Nenner steht; Minus vor einem Bruch bleibt als
  Klammer). Die alten Aufgaben-Nummern der Stufen 1 und 2 zeigen andere
  Aufgaben (Browser-Test: 1-1 durch 1-31 ersetzt).
- 05.11.2026: M3 Schritt 5 fertig: Stufe 3 von „Gleichungen umstellen"
  kommt aus dem Baukasten, mit Kernen ineinander, gegeneinander oder in einer
  Summe (zwölf Arten, z. B. Wurzel aus einem Bruch mit Schalen, zwei Wurzeln,
  Doppelbrüche, Bruch im Quadrat, Klammern mit $x^2$, das sich weghebt). 189
  Formen unter 200 Aufgaben (vorher 26), im Mittel 6,2 Umformungen (vorher
  4,6). Die Engine löst jetzt zwei verschiedene Wurzeln, erweitert
  Doppelbrüche und fasst vor dem Wurzelziehen zu einem Bruch zusammen. Neuer
  typischer Fehler: halbiert statt die Wurzel gezogen. Browser-Tests der
  Stufe 3 mit neuen Nummern (3-29 zwei Wurzeln, 3-2047 frei).
- 05.11.2026: M3 Schritt 6a fertig: Stufe 4 von „Gleichungen umstellen" ist
  spielbar, geführt und frei, mit e-Funktion und $\ln$ ineinander, Wurzeln in
  Wurzeln, Potenz- und Logarithmusgesetzen (neun Arten von Kernen aus dem
  Baukasten). 198 Formen unter 200 Aufgaben, im Mittel 7,3 Umformungen. Neue
  Umformungen: $e$ hoch beide Seiten, $\ln$ auf beiden Seiten,
  Logarithmusgesetze anwenden, Logarithmen zusammenfassen, Potenzgesetz. Zwölf
  neue typische Fehler, zwei neue Lernkarten, Tastatur mit $e^{\square}$, $\ln$
  und $\log_a$. Frei zählt ab Stufe 4 jede gleichwertige Form ohne Doppelbruch.
  Browser-Tests 4-8 (geführt) und 4-33 (frei).
- 05.11.2026: M3 Schritt 6b fertig: Stufe 4 hat jetzt auch Winkel- und
  Hyperbelfunktionen und Umkehrfunktionen (gut ein Drittel der Aufgaben, sechs
  Arten von Kernen: Bruch aus $\sin x$ oder $\tanh x$, Winkelfunktion mit
  Schalen oder unter einer Wurzel, Umkehrfunktion um einen Kern, Quadrate mit
  $\sin^2 x + \cos^2 x = 1$, Sinus und Kosinus in jedem Summanden, $e$ hoch oder
  $\ln$ um eine Winkelfunktion). Aufgaben mit $\sin$, $\cos$, $\tan$ nennen den
  Bereich wie $x < \frac{\pi}{2}$. Die übrigen Nummern behalten ihre Aufgabe;
  4-8 und 4-33 zeigen jetzt Winkelfunktionen, die Browser-Tests der Stufe 4
  laufen mit 4-13 und 4-27 (6a) sowie 4-16 und 4-73 (6b). 196 Formen unter 200
  Aufgaben, im Mittel 7,2 Umformungen. Neue Umformungen: Umkehrfunktion auf
  beiden Seiten, Funktion gegen eine Umkehrfunktion, Quadrat ersetzen, durch
  $\cos x$ teilen. Sieben neue typische Fehler, zwei neue Lernkarten
  („Umkehrfunktionen", „Winkel- und Hyperbelfunktionen"), zweite
  Tastaturseite „Funktionen". Nebenbei schönere Zwischenschritte: links beim
  Sortieren nicht lauter Minus, gekürzter Bruch nach dem Teilen durch den
  Faktor vor $e^x$ oder $\tan x$, $9(y + m)^2$ statt $(3(y + m))^2$.
- 05.11.2026: M3 Schritt 6c fertig, damit ist Stufe 4 komplett: Etwa jede
  fünfte Aufgabe wird quadratisch. Sechs Arten von Kernen: $e^{2x}$ und $e^x$
  (auch $e^x$ und $e^{-x}$ wie bei $\sinh$ und $\cosh$), $x$ und $\sqrt{x}$,
  $\sin^2 x$ und $\sin x$ (auch $\cos^2 x = a\sin x$), Logarithmen, die danach
  quadratisch werden ($\ln x + \ln(x + a) = b$), $x^4$ und $x^2$, Bruch oder
  Produkt, danach quadratisch. Neue Umformungen: substituieren ($u = e^x$),
  alles auf eine Seite, Normalform, $pq$-Formel (beide Lösungen mit $\pm$),
  passende Lösung wählen (die Scheinlösung fällt mit Begründung weg),
  zurück einsetzen. Die Nummern aus 6b behalten ihre Aufgabe, einige aus 6a
  zeigen jetzt quadratische Aufgaben; der Browser-Test „im ln geteilt" läuft
  jetzt mit 4-54, neu sind 4-9 geführt und frei. 196 Formen unter 200
  Aufgaben der Stufe 4, im Mittel 7,4 Umformungen. Sieben neue typische
  Fehler, zwei neue Lernkarten („Substitution", „$pq$-Formel"). Nebenbei:
  Wurzeln aus Brüchen in Ergebnissen ohne Bruch unter der Wurzel
  ($\frac{\sqrt{a^2 + 4b}}{2}$), das korrigiert auch ein Ergebnis der Stufe 3.
- 06.11.2026: M3 Schritt 7a fertig, Stufe 5 von „Gleichungen umstellen" ist
  spielbar (geführt und frei): In jeder Aufgabe steckt eine Ableitung oder ein
  Integral, das erst ausgerechnet wird („Was steht da eigentlich?"), dann wird
  umgestellt. Das Werkzeug steht allein, mit Schalen, in einem Bruch, unter
  einer Wurzel, im $\ln$, oder zwei Werkzeuge stehen in einer Gleichung. 185
  Formen unter 200 Aufgaben, im Mittel 8,6 Umformungen. Die Engine rechnet
  Ableitungen mit „Ableiten", Integrale über Partialbrüche, eine Tafel von
  Stammfunktionen und das Einsetzen der Grenzen; zur Gegenprobe rechnet sie
  jedes Werkzeug numerisch aus. Sieben neue typische Fehler beim Integrieren,
  dazu alle Fehler aus „Ableiten"; neue Lernkarte „Stammfunktionen und
  Partialbrüche". Browser-Tests mit 5-568 (das Integral aus dem Plan, geführt)
  und 5-83 (Ableitung, frei). Die Aufgaben der Stufen 1 bis 4 bleiben gleich.
- 06.11.2026: M3 Schritt 7b fertig: In Stufe 5 von „Gleichungen umstellen"
  stecken jetzt auch geometrische Summen (gesucht ist dann die Anzahl $n$),
  geometrische Reihen (auch abgeleitet und integriert) und Grenzwerte, die auf
  $e^{\square}$ führen; eine Reihe kann in einer Ableitung oder einem Integral
  stecken, ein Grenzwert einer Ableitung gegenüberstehen. 40 von 100 Nummern der
  Stufe 5, die übrigen behalten ihre Aufgabe. 193 Formen unter 200 Aufgaben, im
  Mittel 8,5 Umformungen. Sieben neue typische Fehler, zwei neue Lernkarten
  („Geometrische Summe und Reihe", „Grenzwert $\left(1 + \frac{x}{n}\right)^n \to
  e^x$"). Zur Gegenprobe rechnet die Engine Summen, Reihen und Grenzwerte
  numerisch. Die Aufgaben der Stufen 1 bis 4 bleiben gleich (bei der Normalform
  steht das Minus jetzt vor dem Bruch). Browser-Tests mit 5-120 (Grenzwert,
  geführt) und 5-484 (Summe nach $n$, frei).
- 09.11.2026: M3 Schritt 7c fertig: In Stufe 5 von „Gleichungen umstellen"
  stecken jetzt auch Differentialgleichungen mit Anfangswerten: Wachstum und
  Abnahme $f' = \pm kf$, Abkühlen $f' = k(b - f)$ und $f'' = k^2 f$, auch zwei
  Funktionen $f$ und $g$. Die Gleichung steht über der Aufgabe; erst wird sie
  gelöst (in Exponentialform), dann umgestellt, bei $f'' = k^2 f$ mit
  Substitution und $pq$-Formel. 30 % der Nummern, die nicht zu 7b gehören; alle
  anderen behalten ihre Aufgabe. 193 Formen unter 200 Aufgaben, im Mittel 8,7
  Umformungen. Acht neue typische Fehler, neue Lernkarte „Differentialgleichungen
  $f' = kf$ und $f'' = k^2 f$". Zur Gegenprobe löst die Engine die Gleichung
  numerisch (Runge-Kutta). Browser-Tests mit 5-427 (das Beispiel aus dem Plan,
  geführt und frei). Damit ist Schritt 7 fertig.
- 10.11.2026: M3 Schritt 8a fertig: In Stufe 5 von „Gleichungen umstellen"
  stecken jetzt auch Determinanten: $2 \times 2$ (Hauptdiagonale minus
  Nebendiagonale) und $3 \times 3$ mit einer Zeile oder Spalte mit zwei Nullen
  (erst danach entwickeln), danach meist quadratisch (Substitution und
  $pq$-Formel); auch „Integral gleich Determinante". Schritt 8 ist in drei Teile
  geteilt (8a Determinanten, 8b Betrag und Winkel, 8c Additionstheoreme), mit
  Anteilen 25 %, 30 % und 35 % der jeweils übrigen Nummern. 25 % der Nummern, die
  weder zu 7b noch zu 7c gehören, alle anderen behalten ihre Aufgabe. 194 Formen
  unter 200 Aufgaben, im Mittel 8,6 Umformungen. Sechs neue typische Fehler, neue
  Lernkarte „Determinanten". Zur Gegenprobe rechnet die Engine die Determinante
  mit dem Gauß-Verfahren. Aufgaben mit Matrix werden nach ihrer Breite in em
  gefiltert (am Browser kalibriert), damit sie am Handy in eine Zeile passen.
  Browser-Tests mit 5-1460 (das Beispiel aus dem Plan, geführt und frei) und
  5-9 ($3 \times 3$, nichts wischt seitlich). Im freien Modus der Stufe 5 nennt
  die App jetzt alle typischen Fehler, zu denen ein Ergebnis passt, wenn einer
  davon im Ausrechnen eines Werkzeugs steckt (vorher bekam oft die Determinante
  die Schuld für einen späteren Vorzeichenfehler); die Endform der Engine gilt im
  freien Modus in allen Stufen immer als fertig (vorher wurde sie z. B. bei 3-107
  mit einer Klammer unter der Wurzel abgelehnt).
- 10.11.2026: M3 Schritt 8b fertig: In Stufe 5 von „Gleichungen umstellen"
  stecken jetzt auch Betrag und Winkel komplexer Zahlen
  ($\left\lvert\frac{x + a\mathrm{i}}{x - b\mathrm{i}}\right\rvert = y$,
  $\arg\left((x + a\mathrm{i})^2\right) = y$, auch in Euler-Form) und Vektoren
  (Länge, Skalarprodukt, Winkel zwischen zwei Vektoren). 30 % der Nummern aus 7a,
  alle anderen behalten ihre Aufgabe. 195 Formen unter 200 Aufgaben, im Mittel 8,5
  Umformungen. Vierzehn neue typische Fehler, zwei neue Lernkarten. Beim Winkel mit
  einer Achse rechnet die Engine mit $1 - \cos^2 y = \sin^2 y$ weiter und schreibt
  das Ergebnis mit $\tan y$ (nur bei Aufgaben mit spitzem Winkel $y$, ältere
  Aufgaben bleiben gleich); geführt wird danach gefragt, mit typischen Fehlern.
  Im freien Modus gibt es eine $\pi$-Taste, wenn $\pi$ im Ergebnis steht oder ein
  Winkel einer komplexen Zahl in der Aufgabe. Unabhängige Prüfung aus vier
  Blickwinkeln (Mathematik, Baukasten, Didaktik, Tests): u. a. keine doppelten
  falschen Antworten mehr, keine ohne Lösung oder ohne $x$, eigene Fehler zur Länge
  von Vektoren, Euler-Formel in Tipp und Erklärung, mehr Abwechslung im Baukasten.
  Browser-Tests mit 5-1899 (Winkel mit der $x$-Achse, geführt, mit beiden
  Lernkarten), 5-465 (Betrag eines Bruchs, frei) und 5-1155 (Winkel mit festem
  Faktor, Lernkarte, $\pi$-Taste).
- 10.11.2026: M3 Schritt 8c fertig: In Stufe 5 von „Gleichungen umstellen"
  stecken jetzt auch Additionstheoreme ($b\sin(x + a) = y\cos x$) und der doppelte
  Winkel ($\cos(2x) = y\sin x$, danach Substitution und $pq$-Formel). 35 % der
  Nummern aus 7a, alle anderen behalten ihre Aufgabe. 195 Formen unter 200
  Aufgaben, im Mittel 8,5 Umformungen. Sieben neue typische Fehler, neue Lernkarte
  „Additionstheoreme". Jede Gleichung des Rechenwegs und jede falsche Antwort passt
  am Handy in eine Zeile (am Browser gemessen); darum gibt es keine zwei
  Additionstheoreme nebeneinander. Unabhängige Prüfung aus vier Blickwinkeln: u. a.
  keine falsche Antwort, die im Bereich der Aufgabe nirgends definiert ist, die Frage
  zum doppelten Winkel verrät keine falschen Antworten mehr, „Warum ist das falsch?"
  mit genau der Regel der Aufgabe, Tipp im freien Modus je nach Weg, mehr
  Abwechslung; nebenbei drei ältere Textfehler behoben („$x$ war nur ein
  Platzhalter", „noch einmal quadrieren" ohne Wurzel, „auf beiden Seiten").
  Browser-Tests mit 5-2333 (Beispiel aus dem Plan, geführt, Lernkarte) und 5-1539
  ($\cos(2x) = y\sin x$, frei). Damit ist Schritt 8 fertig.
- 10.11.2026: M3 Schritt 9 fertig, **M3 abgeschlossen**: „Gezielt üben" gibt es
  jetzt auch fürs Umstellen, für jeden der 90 typischen Fehler des Themas (auf den
  Lernkarten und unter „Deine häufigsten Fehler"). Die App sucht eine Aufgabe, in
  der genau dieser Fehler im geführten Modus als Antwort erscheint, seltene Fehler
  nur in ihrer Aufgabenart (z. B. die Fehler beim Betrag in „Betrag und Winkel");
  meist dauert das unter einer halben Sekunde, höchstens etwa zwei. Ein Test prüft
  alle Fehler. Die Suche wird erst beim gezielten Üben geladen, in allen Themen.
  Anzeige nach dem Substituieren: $\frac{a}{u}$ statt $a \cdot \frac{1}{u}$, nach dem
  Malnehmen $u^2 - a = uy$ statt $u^2 - ua \cdot \frac{1}{u} = uy$, mit einem Bruch als
  Vorzahl $au^2$ statt $2u \cdot \frac{a}{2}u$ (183 Aufgaben der Stufen 4 und 5
  zeigen schönere Zwischenschritte; Aufgaben und Ergebnisse bleiben gleich, verglichen
  über die Nummern 1 bis 300 bzw. 1 bis 1500). Design-Durchgang über alle Seiten des
  Themas (Thema, alle 21 Lernkarten, Fortschritt, Galerie, Aufgaben aller Stufen
  geführt und frei, gezielt üben) in Handy- und Laptopgröße, hell und dunkel: keine
  Funde. Neuer Browser-Test: Umstellen offline, geführt, frei und gezielt üben.
- 10.11.2026: Neue Reihenfolge der Roadmap (Wunsch des Nutzers): M4 Chemie 1,
  M5 Werkstoffkunde (Platz noch offen), M6 Themen einzeln üben, M7 Vektoren,
  danach die bisherigen Mathe-, Physik- und Mechanik-Meilensteine. Für Chemie
  (Antworten des Nutzers): Wissensfragen und Rechnungen, drei Stufen
  (Grundlagen, Vertiefung, Klausurniveau), Probeklausur gleich mit eingeplant.
  Grundlage sind die Skripte, Übungsblätter und zwei Altklausuren des Nutzers;
  sie kommen wegen des Urheberrechts nicht ins Repo. Plan als Entwurf in
  [PLAN-M4.md](PLAN-M4.md), feste Regeln in [CHEMIE.md](CHEMIE.md).
- 10.11.2026: Plan M4 freigegeben, mit Klausur-Sprint: Teil 1 der
  Chemie-Klausur ist in etwa zwei Wochen und prüft alles außer Säure-Base und
  Redox; die Klausur hat zwei Teile mit je 50 Punkten, bestanden mit zusammen
  40 von 100. Säure-Base und Redox erscheinen schon als Themen mit „kommt
  bald“. Skripte lädt der Nutzer je Schritt neu hoch. Farben je Gebiet,
  Startseite „Schritt für Schritt selbst lösen“, Werkstoffkunde direkt nach
  Chemie.
- 10.11.2026: M4 S1 fertig: Fach „Chemie 1“ auf der Startseite mit allen sieben
  Gebieten und 20 Themen (Säure-Base und Redox als „kommt bald“), Stufennamen
  Grundlagen, Vertiefung, Klausurniveau statt Zahlen, chemische Formeln mit mhchem.
  Thema Atombau mit 60 Wissensfragen (je Stufe 20), 68 typischen Denkfehlern mit
  „Warum ist das falsch?“ und 12 Lernkarten, alles in eigenen Worten, fachlich
  zweimal geprüft und mit den Skripten Wort für Wort verglichen (keine Folge von 8
  gleichen Wörtern). Fragen kommen reihum (keine doppelt, bevor alle dran waren),
  jede Frage zeigt bei jedem Wiederkommen andere falsche Antworten. Knopf „Frage
  melden“ mit Liste in den Einstellungen, Galerie „Fragen durchsehen“, neue Farben
  und Bilder. Die Elementtabelle kommt mit S2.
- 10.11.2026: M4 S1b fertig (Wunsch des Nutzers: wie bei der Mathe-Idee für M6 per
  Häkchen wählen, was drankommt; Antwort „Beides“). Jedes Chemie-Thema hat Unterthemen
  (Atombau: Stoffe, Trennverfahren, Reaktionen; Kern, Hülle und ihre Teilchen; Isotope
  und Ionen; Atommodelle; Licht und Spektren), auf der Themenseite ankreuzbar; die
  Kachel „Themen mischen“ unter „Chemie 1“ mischt die angekreuzten Themen (gewichtet
  nach der Zahl ihrer Fragen, Runden je Thema), „Weitermachen“ setzt eine Mischung fort.
  Ab S2 bringt jeder Schritt seine Unterthemen mit.
- 10.11.2026: M4 S2 fertig. Elemente-Tabelle (Z 1 bis 56, Pt, Au, Hg, Pb, Bi) zuerst
  nur mit den Spalten, die Rechnungen jetzt brauchen (Symbol, Name, Molmasse, Isotope,
  Ionenladungen); weitere Spalten kommen mit S5 und S6, jede mit Quelle. Rechnungen
  „Protonen, Neutronen, Elektronen“ (alle drei Stufen) und „Energie des Lichts“
  (Vertiefung), geführt, mit Lernkarten und „Gezielt üben“ für Rechen- und Denkfehler.
  Zwei Rechenfehler mehr als im Plan, weil sie in Tabellen mit Lücken typisch sind:
  Elektronen statt Protonen gezählt, Elektronen zur Massenzahl gezählt. Zahlen werden
  exakt gerechnet und auf drei gültige Ziffern ohne Nullen am Ende gezeigt. Derselbe
  Stoff kommt nie zweimal hintereinander. Der freie Modus der Rechnungen kommt mit S8.
- 10.11.2026: Neue Struktur als M6 festgehalten (Entwurf: [PLAN-M6.md](PLAN-M6.md)):
  Tätigkeit als Kachel, Bausteine ankreuzen, Stufe nur als Verschachtelung. Reihenfolge
  nach Chemie: erst M6, dann M5 (Werkstoffkunde).
- 10.11.2026: S3 in zwei Teile geteilt. S3a fertig: Thema „Stoffmenge und Umsatz“
  spielbar mit Rechnungen (Molmasse mit Rechenweg, Stoffmenge, Masse, Teilchenzahl,
  Atome eines Elements) und fünf Lernkarten, noch ohne Wissensfragen (erlaubt nach
  der Regel „mindestens 15 je Stufe, sonst nur Rechnungen“). In der Mischung zählt
  ein Thema nur mit Rechnungen wie eines mit 15 Fragen. Ganze Werte in Aufgaben wie
  in der Klausur, bei Chlor und Kupfer 35,5 und 63,5. Drei Rechenfehler mehr als im
  Plan: Kristallwasser vergessen, Masse geteilt statt malgenommen, Moleküle statt
  Atome gezählt. Die Skripte des Nutzers liegen nur in der Sitzung, nie im Repo.
- 10.11.2026: S3b fertig, S3 noch einmal geteilt (S3c: Wissensfragen). Thema
  „Reaktionsgleichungen“ spielbar mit Rechnungen: Die Engine gleicht über das
  Gleichungssystem der Atombilanz aus (exakte Brüche, eindeutige Lösung, kleinste
  ganze Zahlen); falsche Antworten sind nie die richtige Gleichung in anderen Zahlen.
  Verbrennungen in den Schritten der Klausur (C und H, O₂, ganzzahlig machen), in den
  Grundlagen Methan, Propan und Ethanol (ohne Bruch). Zwei Fehler mehr als im Plan
  (Koeffizient bzw. Index beim Zählen vergessen). Abwechslung mit eigener Kennzahl, weil
  es nur etwa 15 bis 25 sinnvolle Reaktionen je Stufe gibt.
- 10.11.2026: Mehr Bilder in Aufgaben (wie bei Brilliant): Chemie in S5 und S6
  (Gitter, Gestalt, Orbital-Kästchen, Ausschnitt des Periodensystems) und N2,
  Mathe als M6b direkt nach M6, vor M5. Bilder rechnet die Engine, Tests prüfen
  sie; Bilder zum Anfassen später.
- 10.11.2026: S3c fertig, damit S3 abgeschlossen. Wissensfragen zu
  „Reaktionsgleichungen“ (53) und „Stoffmenge und Umsatz“ (52) mit 36 bzw. 35 Denkfehlern,
  in eigenen Worten (maschineller Wortvergleich mit dem Skript: keine 6 gleichen Wörter
  am Stück), Zahlen und Gleichungen mit der Engine nachgerechnet, unabhängig fachlich
  geprüft. Neues Unterthema „Reaktionsgleichungen lesen“. Inhalte, die nicht im Skript
  stehen (unvollständige Verbrennung, zweiatomige Elemente, Festlegung von N_A seit
  2019), stützen sich auf Lehrbuchwissen und haben keine Fundstelle.
- 10.11.2026: S4 in drei Teile geteilt (S4a Umsatz, S4b Gase und Lösungen, S4c
  Klausuraufgabe 4 üben). S4a fertig: Umsatz in drei Schritten im Thema „Stoffmenge und
  Umsatz“, Fehler „Verhältnis 1 : 1“, „umgedreht“, „nur Koeffizient des gesuchten
  Stoffs“, „Molmasse des gegebenen Stoffs“, „ähnlicher Stoff“; n : M statt n · M nutzt den
  vorhandenen Fehler `chem-m-divided`. Wählt man nur „Umsatz“ an, kommen nur Rechnungen.
  Die Zahlen der Altklausuren schließen jetzt alle Rechnungen aus (vorher konnte die
  Stoffmengen-Rechnung 4,4 g Propan erzeugen).
- 10.11.2026: S4b fertig. Thema „Gase und Lösungen“ spielbar mit Rechnungen (Konzentration,
  Lösung ansetzen, Massenanteil, Massenkonzentration, ppm/ppb, Vol-%, molares Volumen,
  Gasgesetz, Gasvolumen aus einer Reaktion), acht Lernkarten und Wissensfragen. Die
  Massenkonzentration heißt in der App β (im Skript ρ), damit sie nicht mit der Dichte
  verwechselt wird. Im Skript steht bei einem Beispiel M(Cl) = 37 g/mol; die App rechnet
  wie das PSE mit 35,5 g/mol. Angaben mehrerer Größen stehen untereinander (Handy).
- 10.11.2026: S4b nach der fachlichen Prüfung: Aufgaben bleiben unter 80 % der Löslichkeit bei 20 °C
  (Tabellenwerte in `generators/loesungen.ts`) und höchstens 5 mol/L; NO₂ ist kein Gas für Aufgaben
  (siedet bei 21 °C), Butan nicht bei Normbedingungen, Gase, die sich unter Druck verflüssigen, nur
  bis zu einem sicheren Druck. Lösungen aus den Altklausuren (Stoff, Konzentration, Volumen) werden
  nie erzeugt. Vol-% bezieht sich in der App wie beim Alkoholgehalt auf die fertige Mischung (so auch
  im Skript; DIN 1310 nennt das Volumenkonzentration). Spurenstoffe nur in üblicher Größenordnung.
- 11.11.2026: S4c fertig. „Klausuraufgabe 4 üben" hat bis S8 Antworten zur Auswahl statt
  freier Eingabe; Folgefehler funktionieren trotzdem, weil die Antworten jeder Rechnung aus
  den eigenen früheren Antworten entstehen. Die ganz richtige Antwort steht dann nicht
  zusätzlich zur Wahl, sonst verrieten die Antworten, dass eine frühere falsch war. Ein
  Folgefehler im Ergebnis gibt die vollen Punkte eines Teils nur, wenn der Fehler aus einem
  früheren Teil stammt. Teil d) ist abwechselnd Gasvolumen oder Lösung ansetzen (Bauplan Teil 1, 14 Punkte).
  Die Auswertung wird noch nicht gespeichert; Verlauf kommt mit der Probeklausur (S9).
- 11.11.2026: S5 in vier Teile geteilt (S5a Ionenbindung und Salze, S5b Moleküle, S5c
  zwischenmolekulare Kräfte, Metallbindung und Hybridisierung, S5d Klausuraufgabe 3), damit
  jeder Teil einzeln ausprobierbar ist. In Salz-Aufgaben nur Salze, die es als Stoff gibt;
  ohne Blei und Zinn, ohne Zink- und Aluminiumphosphid (eher Atombindung), Aluminiumnitrid
  wie im Skript. Bilder der Ionengitter rechnet die Engine aus den Lagen der Ionen
  (`chem/figures.ts`), die Oberfläche zeichnet sie (`ui/chem/ChemFigure.tsx`); Koordinationszahl
  und Zahl der Formeleinheiten prüft ein Test am Bild. Born-Haber mit Werten aus NIST und CRC,
  dazu Rubidium und Caesium für mehr Abwechslung.
- 11.11.2026: S5a nach der fachlichen Prüfung: Salze in Wasser ohne Sulfide (S2- reagiert zu HS-), ohne
  Ammoniumphosphat und Aluminium nur als Nitrat und Sulfat; Schmelze ohne K2O, Rb2O und Cs2O (zersetzen
  sich vorher); kein Caesiumphosphid. Aluminiumoxid und Magnesiumchlorid kommen in „Formel aus dem Namen“
  nicht vor (fast wie Klausuraufgabe 3a). Neuer Rechenfehler „Weg zu den Ionen abgezogen statt addiert“
  (`chem-bh-ions-subtracted`) für die Bildungsenthalpie. Rubidium-Salze für mehr Abwechslung.
- 11.11.2026: S5b Moleküle. Abgleich mit Skript, Übungsblatt und Klausur: freie Paare als
  Striche am Atom, „VSEPR-Modell“, Typ AXₙEₘ (E = freies Paar am Zentralatom), Gestalten mit
  Bindestrich wie in der Musterlösung, „polares Molekül (Dipol)“ statt „Dipolmolekül“. Die
  Musterlösung zeichnet BF₃ ohne freie Paare am Fluor; die App zeichnet sie (jedes F braucht
  sein Oktett). Moleküle sind Daten mit Lage der Atome für die Lewis-Formel; alles andere
  rechnet die Engine. Lewis-Formeln stehen als Bilder zur Auswahl (`figure` an der Antwort);
  falsche Formeln entstehen aus typischen Fehlern (`chem/lewis.ts`). Gestalt als räumliches
  Bild mit Keulen für freie Paare, im Ergebnis gezeigt, damit die Frage nichts verrät.
  Elektronegativität erst für die Hauptgruppen-Elemente, die vorkommen, mit der gerundeten
  Tabelle zum Abgleich (`chem/electronegativity.ts`); weitere mit S6. Nach der fachlichen
  Prüfung: keine Polarität bei HCN, NOCl, OF₂, SCl₂ (dazu CHEMIE.md §6), Winkel nur bei
  gleichen Partnern, Erklärungen „Warum ist das falsch?“ ohne die Lösung des Schritts.
  Der Katalog-Fehler „mit dem Index malgenommen“ nimmt ΔEN mal den größeren Index.
- 11.11.2026: S5c in drei Teile geteilt: S5c zwischenmolekulare Kräfte, S5d Metallbindung,
  Hybridisierung und Molekülorbitale, S5e Klausuraufgabe 3. Zwischenmolekulare Kräfte mit den
  Begriffen des Skripts (Van-der-Waals-, Dipol-Dipol-Kräfte, Wasserstoffbrücken); Siedepunkte
  aus PubChem und CRC, ganzzahlig, im Repo mit zweiter Liste im Test. Siedepunkte ordnet die App
  nur in festen Vergleichsgruppen, deren Reihenfolge eine einfache Regel erklärt (Edelgase,
  Halogene, Alkane, Alkohole, Halogenwasserstoffe, Stoffe ähnlicher Molmasse, Wasser gegen
  Schwefelwasserstoff); die Stoffe der Übung (CH₄, HCl, H₂O als Reihe) kommen nicht zusammen
  vor. Schwefelwasserstoff wird nicht nach seiner stärksten Kraft gefragt (CHEMIE.md §6).
  In den Grundlagen gibt es nur eine Rechenart; Abwechslung mit eigener Kennzahl.
  Nach der fachlichen Prüfung: Iodwasserstoff wie Schwefelwasserstoff nicht nach seiner stärksten Kraft
  gefragt (ΔEN 0,46 nahe 0,5); „ähnliche Molmasse“ als Begründung nur bis 25 % Unterschied; Edelgase
  ohne Fragen zu Atombindungen; Propan-1-ol und Butan-1-ol statt „Propanol“ und „Butanol“ (Isomere
  sieden anders); Chlor- und Fluorwasserstoff nicht in „Lösen“ (sie reagieren mit Wasser). Zwei Fragen
  gestrichen (301 glich in der Form Klausuraufgabe 3c, 309 einer Übungsaufgabe), ersetzt durch 316 und
  317; Erklärungen „Warum ist das falsch?“ ohne die Lösung.
- 11.11.2026: S5d Metallbindung und Hybridisierung. Begriffe wie im Skript (Elektronengas,
  Atomrümpfe, Valenzband, Leitungsband, verbotene Zone, Löcher); „Donator“ und „Akzeptor“ nur
  als Zusatz auf der Karte. Hybridisierung zählt Partner und freie Paare wie die Musterlösung
  (PCl₃ sp³), nicht nur Partner wie eine handschriftliche Notiz im Skript. Bindungsordnung nur
  mit den Elektronenzahlen aus der Aufgabe, ohne Reihenfolge der Orbitale und ohne
  Paramagnetismus. Härte- und Schmelzpunkt-Trends der Metalle nicht gefragt (für Nebengruppen
  falsch); hexagonal dichteste Packung nur „schlecht formbar, gut gießbar“, nicht „spröde“.
  Katalogbeispiele der Rechenfehler von S5c und S5d stehen in `chem/zmk.test.ts` und
  `generators/metalle.test.ts` (Aufgaben werden dort gezielt gesucht).
  Nach der fachlichen Prüfung: keine Hybridisierung bei H₂S, PH₃ und SCl₂ (Winkel nahe 90°, Lehrbücher
  nehmen dort reine p-Orbitale an); in den Grundlagen auch sp und sp² (Hybridisierung zuerst gewählt, sp³
  in der Hälfte der Aufgaben); Bor mit Hinweis auf sechs Elektronen; die Frage zur Bindungsordnung lautet
  „Sagt das MO-Modell eine Bindung voraus?“ (Be₂, Ne₂ sind als schwach gebundene Teilchen bekannt); neue
  Rechenfehler `chem-hyb-too-few` und `chem-bo-one-pair`; eigene Erklärungen, die die Lösung nicht verraten.
- 11.11.2026: S5e „Klausuraufgabe 3 üben“ mit 12 Punkten nach dem Bauplan Teil 1 (nicht 6 Punkte
  wie in der Altklausur), damit auch Polarität, Metalle, Halbleiter und Hybridisierung geübt werden.
  Die Fragen nutzen die Schritte der Rechnungen (Rechenfehler und Erklärungen geprüft in S5a bis
  S5d); eine eigene fachliche Prüfung war nicht nötig, weil kein neuer Fachinhalt dazukam, nur
  Überschriften der Teile.
- 11.11.2026: S6 geteilt in S6a „Elektronen“, S6b „Klausuraufgabe 1 üben“, S6c Aufbau des
  Periodensystems, S6d Trends, S6e „Klausuraufgabe 2 üben“ (jeder Teil einzeln ausprobierbar).
  S6a: Die Engine rechnet jede Konfiguration selbst (Besetzungsreihenfolge, Ausnahmen nach dem
  NIST-Tabellenwerk, Ionen); Gegenprobe mit einer zweiten, von Hand eingetragenen Liste. Grundlagen
  bis Argon statt nur bis Neon (sonst zu wenig Abwechslung), immer ohne Edelgaskern (CHEMIE.md §3);
  erzeugte Konfigurationen und Valenzkonfigurationen nur bis Kr (CHEMIE.md §6). Kationen mit
  Edelgaskonfiguration kurz als [Ar], Anionen mit dem Kern des Atoms ([Ne] 3s² 3p⁶), damit man das
  Auffüllen sieht; falsche Konfigurationen mit demselben Kern wie die Lösung, damit der Kern nichts
  verrät. Kästchenbilder werden aus den Daten gezeichnet, auch als Antworten. Das Skript lag in
  dieser Sitzung nicht vor: Fundstellen nur mit dem Namen des Skripts, ohne Foliennummer; der
  Wortvergleich mit dem Skript folgt, sobald es hochgeladen ist.
  Nach der fachlichen Prüfung (Chemie ohne Befund): 58 Erklärungen „Warum ist das falsch?“ neu
  geschrieben, weil sie die Lösung verrieten; die allgemeinen Texte der Denkfehler nennen nur noch die
  Regel, ohne Tabellenwerte; eigene Texte für Pd und Ag; Valenzkonfigurationen nur bis Kr.
- 11.11.2026: S6b „Klausuraufgabe 1 üben“ (8 Punkte nach dem Bauplan Teil 1). Erstmals stehen
  Wissensfragen in einer Klausuraufgabe: Sie bringen ihren Denkfehler und ihre eigene Erklärung mit
  (`ExamOption.why`), die Auswertung zeigt beides und zählt den Denkfehler in die Fehlerstatistik. Teil c
  fragt Protonen, Neutronen und Elektronen in einer Antwort (wie in der Klausur ein Punkt für alle drei).
  Eine eigene fachliche Prüfung war nicht nötig: kein neuer Fachinhalt, nur geprüfte Fragen und Rechnungen
  aus S1, S2 und S6a.
- 11.11.2026: S6c Thema „Aufbau des Periodensystems“. Platz (Periode, Gruppe 1 bis 18, Block) aus der
  Elektronenkonfiguration gerechnet; Gegenprobe mit einer zweiten Liste. Aufeinanderfolgende Ionisierungsenergien
  von zehn Elementen (Li bis C, Na bis Si, K, Ca) nach NIST, ganzzahlig; ein Test prüft, dass der größte Sprung
  (als Verhältnis und als Unterschied) bei der Hauptgruppe liegt. Ionenladung nur für Ionen mit Edelgaskonfiguration
  (nicht Ga³⁺ oder In³⁺) bis zur 5. Periode. Halbmetalle B, Si, Ge, As, Sb, Te; Selen wird nicht eingeordnet.
  Metalle und Nichtmetalle nur als Wissensfragen. Ausschnitt des Periodensystems als Bild aus der Elementtabelle
  (Hauptgruppen oder Nebengruppen), im Ergebnis, damit er die Antwort nicht vorwegnimmt. Das Skript „Trends“ lag
  nicht vor: Fundstellen ohne Foliennummer, Wortvergleich folgt.
  Nach der fachlichen Prüfung: Steckbrief ohne Nb, Mo, Ru, Rh, Pd, Ag (CHEMIE.md §6); „nur s-Elektronen gezählt“
  nur bei zwei s-Elektronen außen; Erklärungen, die die Lösung verrieten, neu geschrieben; drei neue Denkfehler
  (Ladung falsch gezählt, Ionisierungsenergien falsch gezählt, alle Edelgase wie Helium), damit gezieltes Üben
  passende Antworten zeigt; Hauptgruppen überall mit der Nummer 1 bis 18 in Klammern (CHEMIE.md §3); vier
  Ionisierungsenergien auf die NIST-Werte korrigiert (Abweichung je 1 kJ/mol).
- 11.11.2026: S6d Thema „Trends im Periodensystem“. Messwerte als eigene Tabellen mit Quelle (`chem/trends.ts`); die
  App rechnet selbst aus, welche Paare und Reihen sie fragen darf (gleiche Periode oder Gruppe, Regel und Messwerte
  stimmen mit mindestens 3 % Unterschied überein, Paare aus CHEMIE.md §6 ausgeschlossen, Ionisierungsenergie und
  Elektronegativität nie innerhalb der Gruppen 13 und 14). Die Elektronenaffinität und der Metallcharakter kommen nur
  in Wissensfragen vor. Pauling-Werte der übrigen Hauptgruppen stehen in `trends.ts`, nicht in `electronegativity.ts`,
  damit Moleküle und zwischenmolekulare Kräfte unverändert bleiben. Bild: Hauptgruppen mit Pfeilen in Richtung der
  Zunahme. Das Skript „Trends“ lag nicht vor: Fundstellen ohne Foliennummer, Wortvergleich folgt.
  Nach der fachlichen Prüfung (Messwerte ohne Befund): Sb/Te bei der Ionisierungsenergie ausgeschlossen (§6);
  Fehler „zwei benachbarte Elemente vertauscht“ allgemein benannt; Erklärungen, die die Lösung verrieten oder
  nicht passten, neu geschrieben; Denkfehler zu den Edelgasen enger gefasst (Krypton hat nach Pauling eine etwas
  größere Elektronegativität als Brom); vier Ionen nur aus der Reihe wie Neon.
- 11.11.2026: S6e „Klausuraufgabe 2 üben“ (6 Punkte nach dem Bauplan Teil 1). Teil a fragt Periode, Gruppe und Block
  desselben Elements (ab Vertiefung, also auch Nebengruppen); Teil b wechselt zwischen einem Trend und einer
  Ionenladung. Eine eigene fachliche Prüfung war nicht nötig: kein neuer Fachinhalt, nur die geprüften Rechnungen
  aus S6c und S6d. Damit ist S6 abgeschlossen.
- 11.11.2026: S7a Thema „Chemisches Gleichgewicht“. S7 geteilt in S7a (Gleichgewicht), S7b (Energie) und S7c
  („Klausuraufgabe 5 üben“). Nur Gasgleichgewichte (CHEMIE.md §6); ΔH je Gleichung aus Standardbildungsenthalpien
  (NIST), auf ganze kJ gerundet, mit einer zweiten Liste im Test; wo die Tabellenwerke zu weit auseinanderliegen
  (PCl₅, COCl₂, NOCl) und bei H₂ + I₂ (§6) steht kein ΔH, und die App fragt dort nie nach der Temperatur. Die
  Gleichgewichtskonstante wird ohne Einheit angegeben (die Aufgabe sagt das). Geschwindigkeit und K nur an Reaktionen
  mit Buchstaben, deren Ablauf in einem Schritt die Aufgabe ausdrücklich annimmt; eine Karte sagt, dass man die
  Exponenten sonst messen muss. Le Chatelier in den Grundlagen nur als Wissensfrage, Rechnungen ab Vertiefung.
  Neues Bild: Energiediagramm (schematisch, ohne Zahlen). Das Skript „Chemische Reaktionen“ lag vor.
  Nach der fachlichen Prüfung (Chemie und ΔH-Werte ohne Befund): Erklärungen „Warum ist das falsch?“, die die Antwort
  verrieten, als Frage zum Weiterdenken neu geschrieben; Bilder unter Fragen mit einer Unterschrift, die nichts verrät
  (`energie:…:frage`); drei Tipps entschärft; eine falsche Antwort mit richtiger Richtung ersetzt; ein Satz mit acht
  Wörtern wie im Skript umformuliert.
- 11.11.2026: S7b Thema „Energie bei Reaktionen“. Eigene Tabelle `chem/thermo.ts` mit ΔfH° und S° (NIST bzw. CODATA, eine
  Nachkommastelle), Gegenprobe mit einer zweiten Liste und mit den ΔH der Gleichgewichte aus S7a. Jede Rechnung nennt die
  Werte, mit denen sie rechnet; steht flüssiges Wasser in der Gleichung, steht auch der Wert für Wasserdampf in der
  Tabelle (wie im Skript), damit der Fehler „falscher Zustand“ vorkommen kann. ΔH in kJ für die Gleichung, wie sie
  dasteht. Freie Enthalpie mit der Annahme, dass ΔH und ΔS kaum von der Temperatur abhängen (die Aufgabe sagt das);
  Reaktionen mit Flüssigkeiten oder leicht schmelzenden Stoffen (Natrium, Iod, Schwefel, Glucose) nur bei 25 °C, die
  übrigen bis 600 °C. Grenztemperatur nur für Reaktionen ohne Flüssigkeiten mit Ergebnis zwischen 250 und 2000 K.
  K aus ΔG⁰ mit $R = 8{,}314$ und 25 °C; ln K und K auf drei Ziffern. Die Summe der Edukte ist nur dann ein eigener
  Schritt, wenn dabei ein typischer Fehler passieren kann.
  Nach der fachlichen Prüfung (Tabellenwerte und Rechnungen ohne Befund): Erklärungen, die die Antwort verrieten, als Frage
  zum Weiterdenken neu geschrieben oder durch eigene Texte je Antwort ersetzt; zwei neue Rechenfehler, deren Erklärung zum
  Fehler passt („Wärme beim Wechsel des Aggregatzustands falsch eingeschätzt“, „273,15 abgezogen, obwohl das Ergebnis schon
  in Kelvin ist“); Calciumhydroxid nur bei 25 °C (es gibt oberhalb von etwa 500 °C Wasser ab); Kalkbrennen überall mit
  drei Ziffern (1120 K).
- 11.11.2026: S7c „Klausuraufgabe 5 üben“ (10 Punkte nach dem Bauplan Teil 1). Teil d hat zwei Fragen (Summe der Produkte,
  dann ΔH), außer wenn bei der Summe kein typischer Fehler passieren kann; dann zählt nur ΔH mit 3 Punkten. Teil e wechselt
  zwischen ΔG mit Urteil und dem Temperaturbereich. Eine eigene fachliche Prüfung war nicht nötig: kein neuer Fachinhalt,
  nur die geprüften Fragen und Rechnungen aus S7a und S7b. Damit ist S7 abgeschlossen.
- 11.11.2026: S8 geteilt, damit jeder Teil einzeln ausprobierbar ist: S8a Wiederholung falsch beantworteter Fragen,
  S8b frei rechnen in den Themen (Ziffernblock, Toleranz, Rundungshinweis, Fehlererkennung), S8c Klausuraufgaben frei.
  S8a: Die Wiederholung steht im eigenen Speichereintrag `rechenweg-wiederholung` (der im Plan genannte Schlüssel
  `rechenweg-fragen` hält seit S1 die Runden; so muss nichts umgezogen werden); „Fortschritt löschen“ leert ihn. „Nach drei
  anderen Aufgaben“ zählt alle gezeigten Aufgaben, auch Mathe und Rechnungen; Neuladen zählt nicht. Eine fällige Frage
  kommt beim Üben ihrer Stufe (und ihres Unterthemas, wenn angekreuzt) und in der Mischung zuerst, in einer anderen
  Fassung; bis sie fällig ist, kommt sie auch in der Runde nicht dran (außer es gibt sonst nichts). Richtig beantwortet,
  bevor sie fällig ist (z. B. nach Neuladen), ändert sich nichts. Über der Frage steht „Wiederholung“, nach einer falschen
  Antwort „Die Frage kommt nach drei anderen Aufgaben noch einmal.“ Nur Wissensfragen kommen wieder, Rechnungen nicht
  (dort hat jede Aufgabe neue Zahlen und Stoffe).
- 11.11.2026: S8b frei rechnen. Frei läuft eine Rechnung in denselben Schritten wie geführt; nur Schritte mit einer Zahl
  werden eingetippt, Gleichungen, Formeln, Namen, Konfigurationen und Urteile bleiben Auswahl (eigene Eingaben dafür mit
  N2). So gibt es auch frei „Bisher“, Tipps und Erklärungen je Schritt. Die Einheit steht fest neben dem Feld, auch auf
  Klausurniveau (wählbare Einheiten erst mit N2; Abweichung von CHEMIE.md §7). Neu gegenüber dem Plan: Nach einem Fehler
  lässt sich die Lösung des Schritts zeigen (sonst bliebe man bei einer Zahl hängen); der Schritt zählt dann als Fehler.
  Liegen zwei Fehlerwerte nah beieinander, nennt die App den nächsten. Bei $K$ aus $\ln K$ gilt auch das Ergebnis mit dem
  gerundeten $\ln K$ als richtig (bei großem $\ln K$ läge es sonst über 1 % daneben). Wer im Thema „Frei“ wählt, übt in
  Stufen ohne Rechnung mit Zahlen geführt; die Themenseite sagt das.
- 11.11.2026: S8c Klausuraufgaben frei. Eingetippte Zahlen knapp daneben (1 bis 4 %) geben in der Klausur die vollen
  Punkte, mit Hinweis auf die Rundung (in der echten Klausur kostet eine kleine Rundungsabweichung nichts). Eine eigene
  falsche Zahl rechnet in den späteren Fragen weiter, so zählen Folgefehler auch beim Eintippen; eine eingetippte Null
  nicht (durch sie ließe sich nicht teilen), dann geht es mit der erwarteten Zahl weiter. Der Schalter auf der Klausurseite
  ändert dieselbe Einstellung wie „Geführt“/„Frei“ auf den Themenseiten. Außerdem: Seit S7c schlug die Veröffentlichung
  fehl, weil GitHub beim Einrichten der Browser-Tests die Ubuntu-Server nicht erreichte; der Browser wird jetzt notfalls
  ohne Zusatzpakete installiert.
- 11.11.2026: S9 geteilt wie S8: **S9a** Probeklausur schreiben und auswerten, **S9b** Periodensystem und
  Formelsammlung in der Klausur, Verlauf, Stoffe der letzten drei Probeklausuren meiden, „Das solltest du üben“ und
  Wiederholung. S9a: Die Probeklausur Teil 1 sind die Klausuraufgaben 1 bis 5 (8, 6, 12, 14, 10 Punkte, wie der
  Bauplan), jede für sich bewertet wie beim Üben. Die Uhr läuft ab dem Start, auch wenn die App zu ist (wie in der echten
  Klausur); ist die Zeit um, gibt die App ab, auch beim nächsten Öffnen. Es gibt höchstens eine offene Probeklausur; eine
  neue beginnen bricht sie nach Rückfrage ab. „Fortschritt löschen“ löscht auch sie. Die Kachel steht unter „Themen
  mischen“ und zeigt eine laufende Klausur zum Weiterschreiben. Bis S9b steht auf dem Deckblatt, dass man eigenes
  Periodensystem und eigene Formelsammlung bereitlegt.
- 11.11.2026: S9b. Die Formelsammlung enthält nur Karten mit Rechenformeln und Konstanten (Kernsymbol, Ionen, Licht,
  Stoffmenge, Lösungen und Gase, Born-Haber, Bindungsordnung, Massenwirkungsgesetz, Energie), keine Wissenskarten: Deren
  Merksätze (z. B. Ionenladung je Hauptgruppe) wären in der Klausur schon die Antwort. Das Periodensystem zeigt die
  Elemente der App (Z 1 bis 56 sowie Pt, Au, Hg, Pb, Bi); die übrigen Plätze von Periode 6 bleiben leer, statt Werte ohne
  Prüfung nachzutragen. „Stoffe meiden“ liest die Stoffe an den Formeln in Aufgabentexten und Fragen ab (Verbindungen,
  dazu die Elemente in „Element: …“, das Salz und die Lichtquelle; O₂, CO₂ und H₂O jeder Verbrennung zählen nicht) und
  nimmt von 40 zufälligen Nummern die mit den wenigsten gleichen Stoffen. Ganz ohne Wiederholung geht es nicht, weil
  manche Teile nur wenige Stoffe haben (z. B. Si oder Ge beim Dotieren); im Test teilt die gewählte Klausur weniger als
  60 % so viele Stoffe mit den letzten drei wie eine zufällige. Beantwortete Wissensfragen gehen jetzt auch bei
  „Klausuraufgabe N üben“ in die Wiederholung. „Fortschritt löschen“ löscht auch den Verlauf der Probeklausuren.
- 11.11.2026: Teil 2 der Chemie-Klausur ist im Januar 2027. Nach Teil 1 geht es deshalb in der Reihenfolge des Plans
  weiter: N1 (Fragearten), N2 (Eingaben), dann N3 (Säure-Base) und N4 (Redox, Probeklausur Teil 2), zuletzt N5.
- 11.11.2026: N1 in drei Teile geteilt (N1a „Wähle alle richtigen“, N1b Zuordnen, N1c Ordnen). Bei „Wähle alle
  richtigen“ wird einmal geprüft, danach ist die Frage vorbei: Wer nach der Auswertung (richtig gewählt, zu Unrecht
  gewählt, vergessen) noch einmal prüfen dürfte, müsste nur die Markierungen abschreiben. Jeder Fehler zählt als ein
  Fehlversuch, die Frage kommt in die Wiederholung. In die Fehlerstatistik kommen die Denkfehler der zu Unrecht
  gewählten Aussagen; vergessene richtige Aussagen haben keinen eigenen Denkfehler. Es steht immer mindestens eine
  falsche Aussage da (sonst wäre „alle ankreuzen“ ein sicherer Weg). Klausuraufgaben und Probeklausur nehmen nur
  Fragen mit Einfachauswahl, wie die echte Klausur.
- 11.11.2026: N1b Zuordnen. Statt einer Auswahlliste des Browsers (die keine Formeln setzen kann) klappt bei vielen
  oder langen Zielen je Zeile eine Liste mit Knöpfen auf; bei höchstens vier kurzen Zielen stehen die Knöpfe direkt in
  der Zeile. Rechts stehen nur Ziele der gezeigten Paare, keine zusätzlichen Ablenker; dafür darf ein Ziel zu mehreren
  Zeilen passen. Der Hinweis „Dasselbe kann zu mehreren Zeilen passen“ steht nur da, wenn es in der Fassung so ist.
  Geprüft wird wie bei „Wähle alle richtigen“ einmal. In die Fehlerstatistik kommen nur gewählte typische
  Verwechslungen; eine andere falsche Zuordnung zählt als Fehlversuch, aber ohne Denkfehler.
- 11.11.2026: N1c Ordnen. Verschoben wird nur mit Pfeilknöpfen (wie im Plan: kein Ziehen, das stört am Handy das
  Scrollen). Gezeigt werden vier oder fünf Einträge; der Plan erlaubte drei bis fünf, aber drei lassen sich zu leicht
  raten. Typische Fehler sind „ganz umgedreht“ (z. B. der Trend falsch herum) oder „A vor B“ (z. B. schwerer heißt
  größer); ist alles umgedreht, nennt die App nur diesen Fehler, nicht dazu jede vertauschte Paarung. Bei der
  Beispielfrage zum Atomradius der 3. Periode fehlt Schwefel, weil er nur 2 bis 3 % neben Phosphor und Chlor liegt.
- 11.11.2026: N2 in sechs Teile geteilt (N2a Kästchen, N2b Koeffizienten, N2c Massenwirkungsgesetz, N2d Konfigurationen,
  N2e Element-Tastatur, N2f Lewis-Baukasten), Reihenfolge nach Nutzen für Teil 1 der Klausur. N2a: Bei den Kästchen gilt
  jede Lage der Elektronen in einer Reihe und beide Spinrichtungen als richtig, solange Pauli und Hund erfüllt sind (die
  Bilder der App zeichnen erst die Paare, dann ↑). Anders als bei den neuen Fragearten aus N1 darf man nach einem Fehler
  weiter tippen, wie bei der Auswahl und beim Eintippen von Zahlen: Die Rückmeldung nennt nur den Fehler, nicht die Lösung.
  N2a entstand parallel zur neuen Reihenfolge (S10, S11, dann M6 und M12); N2b bis N2f warten bis nach M6 und M12.
- 11.11.2026: Durchsicht der App nach dem Klausur-Sprint. Vor Teil 1 noch S10
  (Inhalts-Check aller Inhalte von Teil 1 gegen die Skripte, weil in zwei Tagen sehr
  viel entstanden ist und jeder Schritt nur einzeln geprüft wurde) und S11
  (Klausur-Start: Probeklausur und fällige Wiederholung oben, kurzer
  Klausur-Überblick). Nach Teil 1 zuerst M6, dann das neue Nachschlagewerk M12
  (Wunsch des Nutzers), dann N2 bis N5; so wartet der Umbau nicht bis Januar.
  Fotos aus dem Lehrbuch „Physik für Ingenieure“ (Kernphysik, Festkörperphysik)
  werden wie die Skripte nur in der Sitzung hochgeladen; ihre Tabellen und Bilder
  werden selbst gestaltet nachgebaut (CHEMIE.md §1, Quelle 6).
- 11.11.2026: S10 Inhalts-Check in einer Sitzung mit allen Unterlagen. Entscheidungen des Nutzers: In Klausuraufgaben und
  Probeklausur zeigen die Teile, die man in der Klausur selbst schreibt, ihre Antworten erst nach „Auf Papier gelöst,
  Antworten zeigen“; Klausuraufgabe 2 wird gemischt (Steckbrief und Reihe bleiben, dazu wechselnd Wissensfragen wie in
  den Altklausuren, gleiche Punkte). Weitere Festlegungen: Unabhängige Fragen eines Teils zählen einzeln; „knapp daneben“
  gibt in der Probeklausur halbe Punkte (beim Üben volle), weil ungenaues Runden in der echten Klausur Punkte kostet;
  Paare in Lewis-Formeln werden am Zentralatom gezählt wie in Vorlesung und Klausur; Gleichgewichtsreaktionen stehen
  immer mit ⇌, auch in Umsatzrechnungen; Fragen und Lernkarten nennen bei abweichenden Begriffen beide (App und Skript).
  Stoff über die Vorlesung hinaus wandert aus dem Klausurniveau in die Vertiefung oder wird gelöscht (Nummern in
  `retired`). Einzelheiten in PLAN-M4 (S10, „Probeklausur“) und CHEMIE.md §5, §6, §8, §9.
- 12.11.2026: S11 Klausur-Start. „Wie sicher“ je Klausuraufgabe aus dem Anteil der Punkte in den letzten drei Versuchen
  (Übung und Probeklausur zählen gleich), Grenzen 50 % und 80 %. „Wiederholen“ nimmt alle fälligen Fragen des Fachs,
  unabhängig von angekreuzten Unterthemen und Stufen (vor der Klausur soll nichts liegen bleiben), und ändert „Weitermachen“
  nicht. Die Probeklausur steht nur noch in der Karte oben, nicht zusätzlich unten.
- 12.11.2026: M6 ohne Fable gebaut (Rat: das Aussehen steht schon im Entwurf, der Hauptteil ist Rechenarbeit; Fable
  verbraucht das Kontingent etwa doppelt so schnell). Aufwand je Schritt „Hoch“, Schritt 3 und 5d „Sehr hoch“.
- 12.11.2026: M6 Schritt 1. Werkstoffkunde steht als Fach ohne Gebiete im Katalog, damit es in „Demnächst“ erscheint.
  „Demnächst“ trennt mit Kommas (Titel wie „Säuren und Basen“ enthalten selbst „und“). Die Klausur-Karte steht auf der
  Startseite (mit Namen des Fachs) und auf der Seite des Fachs. Gebiet, Mischung und Klausur-Überblick führen mit dem
  Zurück-Link zur Seite ihres Fachs. Die Gebiete der Mathe-Seite bleiben bis Schritt 3, dann kommen die Tätigkeiten.
  Fortschritt: geübt heißt mindestens eine gelöste Aufgabe oder ein Fehler im Thema; zuletzt geübtes Thema oben.
- 12.11.2026: M6 Schritt 2 „Überspringen“. Der Knopf steht unten neben der Aufgabennummer, nur solange die Aufgabe offen
  ist. Ein Fehler, der vor dem Überspringen passiert ist, bleibt in der Fehlerstatistik (er ist wirklich passiert); eine
  falsch beantwortete und dann übersprungene Frage kommt nicht in die Wiederholung (nur fertig beantwortete zählen). Was
  übersprungen wurde, merkt sich die App nur bis zur nächsten gezeigten Aufgabe und nicht auf dem Gerät. Ist in
  „Wiederholen“ nur die übersprungene Frage fällig, zeigt die Seite das, statt dieselbe Frage sofort wieder zu bringen.
- 12.11.2026: M6 Schritt 3 „Gleichungen umstellen“ mit Bausteinen. Die Bausteine einer Aufgabe liest die Engine an der
  Aufgabe selbst ab (was mit der Variable dasteht, auch in Werkzeugen, dazu pq-Formel bzw. Substitution und Wurzelziehen
  aus dem Rechenweg). Was erst beim Lösen entsteht, zählt nicht extra (ln beim Lösen einer e-Gleichung, die Wurzel einer
  Länge): Mit dieser strengeren Regel ließe sich in Stufe 5 nur noch „Winkelfunktionen“ allein üben (Probe mit 2000
  Aufgaben). Aufgaben ohne jeden Baustein heißen „Lineare Gleichungen“ (neuer Baustein, sonst könnte man sie nicht
  abwählen); „Beträge“ kommt erst mit Schritt 5d in die Liste. Damit auch seltene Auswahlen sofort Aufgaben finden
  (in Stufe 5 ist nur etwa jede 130. Aufgabe eine reine Determinanten-Aufgabe), gibt es ein Verzeichnis der Nummern 1 bis
  N je Stufe mit ihren Bausteinen (3000 bis 12000 je Stufe, erzeugt von einem Skript, geprüft von einem Test); die
  Aufgaben und ihre Nummern bleiben unverändert, mit allen Bausteinen wird weiter frei gewürfelt. Deshalb braucht es
  in diesem Schritt weder die neue Aufgabennummer `<baustein>.<stufe>-<startwert>` noch einen Speicher-Umzug: beides
  erst, wenn in Schritt 4 neue Aufgaben je Baustein dazukommen. Die Seite bleibt unter `#/thema/umstellen`. „Geführt“
  oder „Frei“ gilt weiter für alle Tätigkeiten (je Tätigkeit erst mit „Mathe mischen“ in Schritt 8, damit Mischen
  und einzelne Tätigkeiten nicht gegeneinander arbeiten). „Brüche“ heißt jetzt „Vereinfachen“; das kommende Thema
  „Potenzen, Wurzeln, Logarithmen“ ist aus dem Katalog genommen (wird Baustein bei „Vereinfachen“, Schritt 6).
  Farben nach dem Entwurf: Vereinfachen orange, Gleichungen umstellen blau, Ableiten violett.
  Nach der unabhängigen Prüfung: Bei Bausteinen fällt die App nie auf „alle“ zurück (sonst kämen z. B. über „Eine Stufe
  höher?“ Aufgaben mit nicht angekreuzten Bausteinen); gibt es zur Auswahl in einer Stufe nichts, zeigt die Übungsseite
  einen Hinweis. „Eine Stufe höher?“ schlägt nur Stufen vor, in denen es zur Auswahl Aufgaben gibt (auch in Chemie).

- 12.11.2026: M6 Schritt 4 „leichte Aufgaben je Baustein“. Gemacht für alle neun Bausteine aus „Grundlagen“ und
  „Funktionen“ (nicht nur die fünf aus dem Plan), damit jeder davon in jeder Stufe allein übbar ist. Neue Aufgaben
  eines einzelnen Bausteins tragen ihn in der Nummer (`exp.1-4711`); intern steckt er im Startwert (feste Nummer je
  Baustein mal einer Million plus Startwert, `BLOCK_CODES`), damit Speicher, Adressen und Ziehen weiter mit einer Zahl
  auskommen; deshalb kein Speicher-Umzug. Alte Nummern bauen dieselbe Aufgabe wie vorher. Wo die alten Vorlagen in einer
  Stufe genug Aufgaben mit nur diesem Baustein haben (mindestens 100 Formen unter 200), kommen sie von dort, sonst aus
  den neuen. Stufen je Baustein: 1 der Baustein mit ein bis zwei Schalen, 2 mit mehr Schalen oder auf beiden Seiten,
  ab 3 der Baustein in sich selbst (e hoch e-Funktion, Wurzel in Wurzel, Logarithmus vom Logarithmus, Kettenbruch,
  Potenz in Potenz, Umkehrfunktion um eine Winkelfunktion), nebeneinander (zwei Wurzeln, zwei Logarithmen, Sinus und
  Kosinus) und mit mehr Schalen. Quadrate von Winkelfunktionen ($\sin^2 x + \cos^2 x$) zählen weiter auch als
  „Quadrate und Potenzen“; ein Quadrat, das die pq-Formel löst ($x^2 + ax = y$), gehört jetzt zu „Quadratische
  Gleichungen“ (sonst gäbe es sie nie allein). Ziehen: erst einen angekreuzten Baustein (jeder gleich oft, auch
  ohne Auswahl), dann eine Aufgabe mit ihm, halb eigene Aufgaben des Bausteins, halb Aufgaben mit anderen
  angekreuzten. Damit kommen bei „alle Bausteine“ in Stufe 1 auch e-Funktion, Logarithmus und Winkelfunktionen
  dran (die Stufe sagt nur noch, wie verschachtelt). Die Art einer neuen Aufgabe steht je Nummer vorab fest, damit
  schwer zu bauende Arten (lange Ergebnisse werden verworfen) in ihrem Anteil vorkommen. Quadratische Gleichungen
  haben vor $x$ einen Buchstaben oder eine Zahl, sonst stünde unter der Wurzel der pq-Formel eine lange Summe. Jede
  neue Aufgabe wird an 128 Stellen durch Einsetzen geprüft; Aufgaben, bei denen sich eine Summe mit der Variable an
  einer Stelle fast aufhebt (dort kippt die Probe durch Rundung), werden nicht genommen.
- 12.11.2026: Alle Unterlagen der Vorlesung MB1 durchgesehen (Wunsch des Nutzers: alle Aufgabenarten und Schemata
  aufnehmen). Übersicht in eigenen Worten in docs/AUFGABENARTEN.md (keine Aufgabentexte, keine Zahlen aus den
  Unterlagen). Was zu laufenden Tätigkeiten passt, kommt in M6 (neu 4b: Gleichungen wie auf den Übungsblättern mit
  Zahlen, Logarithmen auf beiden Seiten und Formeln aus Technik und Physik; 5d Beträge nach dem Schema der Lösungen;
  6 und 7 ergänzt); neue Tätigkeiten (Polynome, Grenzwerte, Linearisieren, Funktionen, Mengen und Summen) in M9,
  Vektoren und Matrizen in M7.
  Nach der unabhängigen Prüfung: Bei „Quadrate und Potenzen“ ab Stufe 3 konnte eine Potenz um einen Ausdruck stehen, der
  negativ werden kann (zweite Lösung bei gerader Hochzahl, dritte Wurzel aus einer negativen Zahl bei ungerader); das
  Innere ist jetzt immer sicher positiv, ein Test prüft das für viele $x$. Lange Gleichungen oben in einer Mathe-Aufgabe
  werden am Handy kleiner gesetzt (wie bei Chemie) statt nach dem Gleichheitszeichen umzubrechen; neue Aufgaben je
  Baustein sind höchstens so breit, dass sie verkleinert in eine Zeile passen.
- 12.11.2026: M6 Schritt 4b in drei Teilen (Formeln, Logarithmen auf beiden Seiten, Gleichungen mit Zahlen), damit der
  Nutzer jeden einzeln ausprobieren kann. 4b-1: eigene Formelsammlung aus bekannten Formeln der Technik und Physik (keine
  aus den Unterlagen übernommenen Aufgaben), ohne Einheiten (die kommen mit M10). Jede Aufgabe ist eine Formel und eine
  Größe; Stufe nach der Zahl der Umformungen (bis 3 Einstieg, bis 5 Grundlagen, sonst Kombiniert), Bausteine wie bei allen
  Aufgaben aus der Aufgabe abgelesen; beides steht als Daten fest und ein Test rechnet es nach. Formeln kommen beim Ziehen
  in etwa jeder fünften Aufgabe eines Bausteins dran, für den es in der Stufe welche gibt (nur mit angekreuzten
  Bausteinen). Unter der Aufgabe steht der Name der Formel und was jedes Zeichen bedeutet. Der Leser für eingetippte
  Antworten versteht dafür Größen mit Index ($U_0$, $T_U$, $R_{12}$) und griechische Buchstaben als Größen ($\lambda$,
  $\varepsilon_r$; $\pi$ bleibt die Kreiszahl). Außerdem prüft der freie Modus Aufgaben mit e-Funktion, Logarithmus,
  Winkel- oder Hyperbelfunktion jetzt in jeder Stufe großzügig (jede gleichwertige Form ohne Doppelbruch), nicht erst ab
  Stufe 4, weil es sie seit Schritt 4 ab Stufe 1 gibt.
  Nach der unabhängigen Prüfung: $\frac{1}{2}at^2$ ergab beim Malnehmen mit 2 „$1at^2$“ im Rechenweg, die Formel steht
  jetzt als $\frac{at^2}{2}$ da, und alle Formel-Aufgaben laufen durch dieselben Prüfungen je Schritt wie die übrigen
  Aufgaben. $\epsilon$ und $\varepsilon$ (ebenso $\phi$/$\varphi$, $\theta$/$\vartheta$) gelten beim Eintippen als
  dasselbe Zeichen, weil MathLive aus getipptem „epsilon“ $\epsilon$ macht. Bedeutungen genauer (waagrechter Abstand,
  eingetauchtes Volumen, noch nicht zerfallene Kerne).
- 12.11.2026: M6 Schritt 4b-2, Logarithmen auf beiden Seiten und verschiedene Basen. Rechenweg wie im Skript: verschiedene
  Basen zuerst auf eine bringen (sind sie Potenzen derselben Zahl wie 2 und 4, auf die kleinere,
  $\log_4 u = \frac{\log_2 u}{2}$, sonst auf $e$, $\log_3 u = \frac{\ln u}{\ln 3}$), Brüche wegmultiplizieren, Faktoren als
  Hochzahl hineinziehen, Zahlen als Logarithmus derselben Basis schreiben ($3 = \log_2 8$, $1 = \ln e$, eine Zahl mit
  Minus als $-\log_3 9$, nicht als $\log_3\frac{1}{9}$), je Seite zusammenfassen, entlogarithmieren. Vier neue Schritte
  mit eigener Frage, Tipp, Erklärung und einer neuen Lernkarte „Logarithmen auf beiden Seiten“; fünf neue typische
  Fehler. Die Aufgaben sind eine eigene Sammlung mit Nummern wie „logeq.2-4711“ (wie die Formeln kein Baustein; ihre
  Bausteine sind Logarithmus, bei manchen Arten dazu „Quadratische Gleichungen“), neun Arten in den Stufen 1 bis 4, je
  Nummer vorab eine Art; sie kommen beim Ziehen in etwa jeder vierten Aufgabe eines passenden Bausteins dran.
  Abwechslung wie überall: unter 200 Aufgaben je Stufe mindestens 100 Formen, keine öfter als 3 von 100. Die neuen Wege
  der Engine sind markiert (`logPath`); ältere Vorlagen und die Aufgaben einzelner Bausteine nehmen solche Aufgaben
  nicht, damit alte Nummern dieselbe Aufgabe behalten. Den Definitionsbereich sichern Bedingungen der Aufgabe wie $x > b$
  und bei quadratischen Gleichungen die Probe mit der Gleichung vom Anfang; ein Buchstabe als Basis bekommt die
  Bedingung, größer als 1 zu sein. Stufe 5 bekommt keine eigenen Aufgaben dieser Art (dort bleibt es bei den
  Werkzeugen).
  Nach der unabhängigen Prüfung: Der Fehler „Summe der Logarithmen“ mit einer Zahl als Logarithmus ($\log_2 8 + \log_2 x$)
  galt zuerst bei jedem Zusammenfassen und gab 29 älteren Aufgaben der Stufe 5 eine zusätzliche falsche Antwort; er gilt
  jetzt nur nach „Zahl als Logarithmus“, ein Test sichert das. Mathematik, Bedingungen und Scheinlösungen hat die Prüfung
  an 480 Aufgaben unabhängig nachgerechnet, ohne Befund.

- 12.11.2026: Unterlagen zu Technische Mechanik 1 durchgesehen (Skripte Kapitel 1 bis 8, Übungsblätter 9 bis 19).
  Übersicht in eigenen Worten in docs/MECHANIK.md, dazu die Schreibweisen und Vorzeichenregeln, die die App genauso
  verwenden muss (Drehsinn gegen den Uhrzeigersinn positiv, Unbekannte positiv angenommen, Fachwerkstäbe als Zug,
  bei Schnittgrößen $z$ nach unten und positives Schnittufer, Diagramme positiv nach unten). Stabkräfte heißen in der
  App einheitlich $S_i$, weil das Skript zwei Schreibweisen mischt. Lagerreaktionen stehen in Aufgaben immer mit ihrer
  eingezeichneten Bezugsrichtung da, weil die Unterlagen an einer Stelle Werte mit verschiedenen Vorzeichen zeigen.
  Für Reibung gibt es kein Skript; vor dem Bau wird der Maßstab geklärt (Skript nachreichen oder frei zugängliches
  Lehrbuch). M11 bleibt am Ende der Reihenfolge.
- 12.11.2026: Unterlagen zu Physik MB1a durchgesehen (Einführung, Kinematik 1 und 2, Kräfte, Übungsblätter 1 bis 4
  mit Lösungen, Mindmap zum Lösen, Formelsammlung). Übersicht in eigenen Worten in docs/PHYSIK.md (keine Aufgabentexte,
  keine Zahlen, keine Namen). In der Formelsammlung fehlt bei der Gipfelhöhe des schiefen Wurfs der Faktor ½, und die
  Lösungen haben einzelne Tippfehler: Richtig ist in Physik, was die Engine nachrechnet, nicht die Formelsammlung. Vektoren
  und Koordinaten bleiben Mathe (M7), Physik wendet sie nur an. Der geführte Modus in Physik folgt dem Vorgehen der
  Vorlesung (gegeben/gesucht, Achse, Formel wählen, allgemein umstellen, einsetzen, prüfen). Die Aufteilung von M10 in
  Tätigkeiten ist nur ein Vorschlag und wird im Plan zu M10 entschieden.
- 12.11.2026: Werkstoffkunde-Unterlagen gesichtet (Kapitel 1 bis 7 mit Aufgabenblättern, alle Seiten, je Kapitel ein
  Helfer). Übersicht in eigenen Worten in docs/WERKSTOFFKUNDE.md, aufgebaut wie docs/AUFGABENARTEN.md, je Kapitel mit
  Inhalten, Formeln, Rechenschemata mit Fallen, Aufgabenarten, Denkfehlern, Bildern aus Daten und Unklarem. Festlegungen
  für M5: Wo Folienwerte von freien Tabellenwerken abweichen, gilt die Tabelle; Werte nur aus der Vorlesung werden als
  Richtwert gekennzeichnet; Bilder der Folien werden nie nachgezeichnet; in Formeln eindeutige Zeichen (z. B. $c_0$ für
  die Legierung statt des L der Vorlesung). Vier Fragen an den Nutzer stehen am Ende der Übersicht.
- 12.11.2026: Mathe-Unterlagen vollständig gesichtet (Skript-Kapitel 1 und 3 bis 8, Übungen, ältere Blätter,
  Tests, 16 Altklausuren, 10 Probe- und Übungsklausuren); docs/AUFGABENARTEN.md neu gefasst mit Aufbau und Gewicht
  der Klausur. Zwei Entscheidungen des Nutzers dazu:
  - **M7 (Vektoren und Matrizen) vorgezogen**: direkt nach M6 Schritt 4b und 4c, danach M6 ab Schritt 5. Grund: Die
    Vorlesung ist gerade dort, und lineare Algebra und Geometrie bringen rund die Hälfte der Klausurpunkte.
  - **Ungerade Wurzeln aus negativen Zahlen** sind künftig erlaubt wie im Skript ($\sqrt[3]{-8} = -2$); das ersetzt
    die Schulkonvention vom 28.10.2026 für Wurzeln. Gebrochene Hochzahlen wie $x^{1/3}$ bleiben nur für $x \ge 0$
    definiert (so auch das Skript). Umsetzung in M6 Schritt 4c; bis dahin gilt die alte Regel.
- 12.11.2026: M6 Schritt 4b-3, Gleichungen mit Zahlen. Eigene Sammlung mit Nummern wie „zahlen.2-4711“ (wie die
  Logarithmen kein Baustein; Art je Nummer fest, 14 Arten in Stufe 1 bis 4, beim Üben etwa jede vierte Aufgabe eines
  passenden Bausteins). Erst die Lösung, dann die Zahlen der Aufgabe, damit alles glatt aufgeht. $x$ ist hier eine
  beliebige reelle Zahl (nicht positiv wie die Buchstaben); Zahlen werden in jedem Schritt gleich ausgerechnet. Zum
  Schluss die **Probe in der Gleichung der Aufgabe**, als eigene Frage im geführten Modus („Ist $x = 4$ eine Lösung?“,
  Ja / Nein: Scheinlösung / Nein: nicht im Definitionsbereich); nach der $pq$-Formel für beide Zahlen. Ohne Lösung steht
  am Ende $\mathbb{L} = \{\,\}$; im freien Modus gibt es dafür einen Knopf „Keine Lösung“ neben „Prüfen“ (bei jeder
  Gleichung mit Zahlen, damit er nichts verrät). Eine Wurzel allein gleich einer negativen Zahl heißt sofort „keine
  Lösung“; wer trotzdem quadriert, macht den neuen typischen Fehler „Wurzel gleich negativer Zahl trotzdem quadriert“.
  Eine behaltene Scheinlösung zählt als „Scheinlösung genommen“. Gleichungen mit **zwei** Lösungen (z. B. $x^2 = 9$)
  kommen noch nicht vor, dafür bräuchte die Eingabe eine Lösungsmenge; die $pq$-Formel läuft nur mit glatten Zahlen
  (Normalform ohne Brüche). Die bisherigen Aufgaben mit Buchstaben bleiben unverändert (Verzeichnis neu erzeugt, gleich).
  Nebenbei behoben (Bildschirmfoto des Nutzers): Auf der Seite „Gleichungen umstellen“ ragten ab „Wie verschachtelt?“
  Stufen und Beispiel rechts über den Rahmen, weil ein Formularrahmen (fieldset) nie schmaler wird als sein breitester
  Inhalt; jetzt darf er schrumpfen, das Beispiel setzt sich kleiner, ein Browser-Test prüft das.
  Nach der unabhängigen Prüfung (500 Nummern je Stufe gegen eine eigene Suche aller Lösungen, Mathematik ohne Befund):
  Steht in der Normalform keine Zahl ($x^2 - 7x = 0$), sind „$x$ ausklammern“ und „durch $x$ teilen“ keine Irrwege mehr
  (ohne $x$ allein ebenso „Wurzel ziehen“). „Warum ist das falsch?“ beim Quadrieren einer Wurzel gleich negativer Zahl
  verrät nicht mehr, dass es keine Lösung gibt, sondern fragt, welche Werte eine Wurzel annehmen kann.
- 12.11.2026: M6 Schritt 4c, ungerade Wurzeln aus negativen Zahlen wie im Skript: $\sqrt[3]{-8} = -2$, auch fünfte
  Wurzeln; gerade Wurzeln und gebrochene Hochzahlen ($x^{1/3}$) weiter nur für Zahlen $\ge 0$. In der Normalform bleibt
  eine ungerade Wurzel eine Wurzel (sonst würde $\sqrt[3]{x} \to x^{1/3}$ den Definitionsbereich verkleinern): Zahlfaktoren
  und Faktoren werden einzeln gezogen ($\sqrt[3]{-8x} = -2\sqrt[3]{x}$), $(\sqrt[3]{u})^4 = u\sqrt[3]{u}$. Umgekehrt wird
  $u^{p/q}$ mit ungeradem $q$ zur Wurzel ($x^{2/3} \to (\sqrt[3]{x})^2$); das vergrößert nur den Definitionsbereich und gibt
  $\sqrt[3]{x}$ und $x^{1/3}$ dieselbe Normalform, damit beide Schreibweisen als gleich erkannt werden. Feste Werte ohne
  Buchstaben ($\sqrt[3]{2}$, $\sqrt[3]{\pi}$) bleiben Potenzen. Sichtbar wird das an einer neuen Art der Gleichungen mit Zahlen
  in Stufe 1 („hoch-drei“, z. B. $(x - 10)^3 = -8$; fester Anteil 20 % mit eigenem Zufall, die übrigen Nummern behalten ihre
  Art), am neuen typischen Fehler „Minus verloren“ (`eq-cube-root-sign`), an der Lernkarte „Dritte Wurzel und Hochzahl 3“ und
  an der Frage beim Wurzelziehen: bei der Hochzahl 3 heißt sie jetzt „Wie wirst du die Hochzahl $3$ los?“ (bisher fälschlich
  „das Quadrat“), mit Irrwegen „durch 3 teilen“, „mit $\pm$“ und, bei einer negativen Zahl, „keine Lösung“. Aufgaben mit
  Buchstaben bleiben so (Basen von Potenzen mit $x$ positiv). Wurzelgleichungen wie $\sqrt[3]{2x + 1} = -3$ (hoch 3 nehmen)
  löst die Engine noch nicht; vorgemerkt.
  Nach der unabhängigen Prüfung: Beim freien Ableiten liest die Prüfung Hochzahlen mit ungeradem Nenner als Wurzel
  (`oddPowersAsRoots` in `check/answer.ts`), sonst wäre $\frac{1}{3}x^{-\frac{2}{3}}$ als Ableitung von $\sqrt[3]{x}$ an den
  Stellen $x < 0$ gescheitert; die Normalform fasst $\sqrt[3]{u}$ mit Potenzen von $u$ zusammen ($\frac{x^2}{\sqrt[3]{x}}$ wie
  $x^{5/3}$, $\sqrt{x} \cdot \sqrt[3]{x} = x^{5/6}$, `mergeOddRoots`), und die Anzeige ordnet $\sqrt[3]{x}$ nach seinem Grad.
- 12.11.2026: M7 geplant ([PLAN-M7.md](PLAN-M7.md), wartet auf OK). Drei neue Tätigkeiten statt einer: „Vektoren“,
  „Geraden und Ebenen“, „Matrizen und Gleichungssysteme“, jede mit Bausteinen und den Stufen aus M6 (Stufe 1 in der
  Ebene, Stufe 4 mit Parameter wie in der Klausur). Auf Wunsch des Nutzers (mehrmals) Bilder und Animationen von Anfang
  an; die Zeichen-Grundlage aus M6b wird darum schon in M7 Schritt 1 gebaut, mit räumlicher Ansicht zum Drehen ohne
  Zusatzbibliothek (klein, offline). Neue Arten von Aufgaben: Vektor oder Matrix eingeben, Bild wählen, Pfeil ziehen,
  Schemata als Tabelle, Entscheidungsbaum. Animationen nur auf Knopfdruck. Reihenfolge wie in der Vorlesung. Dazu ein
  Entwurf zum Anfassen als private Seite für den Nutzer (nicht im Repo).
- 12.11.2026: M7 Schritt 1a. Vektoren als eigene Tätigkeit im neuen Gebiet „Vektoren und Matrizen“ (Farbe Cyan, Bild
  zweier aneinandergehängter Pfeile), Baustein „Rechnen und Länge“ mit Nummern wie `rechnen.2-4711` (Code 21). Eigene
  kleine Engine `src/engine/linalg/` mit exakten Brüchen und vereinfachten Wurzeln statt der Term-Engine: Vektoren sind
  Listen von Zahlen, das hält Baukasten und Prüfung einfach. Bilder sind reine Daten der Engine (`linalg/figures.ts`),
  gezeichnet in `src/ui/draw/` ohne Zusatzbibliothek; Namen an Pfeilen und Punkten setzt KaTeX über dem Bild (HTML statt
  SVG-Text, damit Pfeile über Buchstaben wie in den Formeln aussehen und Safari keine Probleme mit `foreignObject`
  macht). Stufe 4 heißt bei Vektoren „mit Parameter oder in vier und fünf Dimensionen“ (wie in Übung 5). Der freie
  Modus kommt als eigener Teil 1b, weil die Eingabe eines Vektors ein neues Eingabefeld braucht.

  Nach der unabhängigen Prüfung: Ein einzelnes Vielfaches mit negativem Faktor wird mit Vorzeichen gefragt (sonst fragte
  kein Schritt nach dem Ergebnis), neuer Fehler „Zahl vor dem Vektor vergessen“ (`vec-equation-no-divide`), Text zum
  Parallelogramm-Fehler berichtigt, Endpunkt „PQ minus P“ zählt als „Punkte addiert“, Tests rechnen Endpunkt, Länge
  einer Summe und Vektor gegebener Länge aus zwei Punkten aus den gegebenen Größen nach.
