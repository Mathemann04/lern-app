# Roadmap

Stand: 30.10.2026

| Meilenstein | Inhalt | Status |
| --- | --- | --- |
| M1 | Grundgerüst + Ableitungsregeln (beide Modi, 5 Stufen, Erklärungen, Lernkarten, Fortschritt) | fertig |
| M2 | Brüche (Bruchrechnung, Bruchterme kürzen und zusammenfassen, Doppelbrüche); App für mehrere Themen | fertig |
| M3 | Gleichungen umstellen (nach einer Variablen auflösen: Brüche, Wurzeln, verschachtelte e- und ln-Gleichungen, Substitution; Stufe 5 quer durch die Mathematik mit Ableitungen, Integralen, Reihen, Grenzwerten, komplexen Zahlen, Determinanten) | in Arbeit |
| M4 | Potenz-, Wurzel- und Logarithmusgesetze | offen |
| M5 | weitere Themen aus Mathematik MB1 | offen |
| M6 | Physik: Formeln mit Einheiten (Formeln umstellen mit Zeichen der Physik; Aufgaben lösen: Formel wählen, umstellen, Werte mit Einheiten einsetzen) | offen |
| M7 | Technische Mechanik: Freischnitt, Gleichgewicht, Lagerkräfte, statische Bestimmtheit | offen |
| Später | Konto und Sync, Teilen mit Kommilitonen, App-Store-Version, optional KI-Hilfe | offen |

## Vorgemerkt

- **Stufe 5 überall auf Profi-Niveau** (Wunsch des Nutzers): In jedem Thema
  heißt Stufe 5 „kaum noch schwerer"; sie deckt fast das ganze Spektrum des
  Themas ab, so wie Stufe 5 von „Gleichungen umstellen". Für **Ableiten**
  und **Brüche** wird das nachgeschärft, direkt nach M3 als eigener
  Meilenstein (dann mit eigenem Plan). Grund: Die Werkzeuge aus Stufe 5 von
  M3 (Integrale, Reihen, Grenzwerte, Determinanten, komplexe Zahlen) lassen
  sich dort wiederverwenden. Neue Themen (M4 und später) werden gleich so
  geplant.

## M3: Schritte

Details: [PLAN-M3.md](PLAN-M3.md)

- [x] Plan M3 (3. Fassung, freigegeben)
- [x] 1. Mathe-Engine fürs Umstellen
- [x] 2. Thema „Gleichungen umstellen" freischalten, Stufen 1 und 2 geführt
- [ ] 3. Stufe 3 geführt, freier Modus für die Stufen 1 bis 3
- [ ] 4. Stufe 4 (verschachtelt) geführt und frei
- [ ] 5. Stufe 5, Teil 1: Ableitungen, Integrale, Reihen, Grenzwerte, Differentialgleichungen
- [ ] 6. Stufe 5, Teil 2: komplexe Zahlen, Determinanten, Vektoren, Additionstheoreme
- [ ] 7. Gezieltes Üben, Feinschliff, Abschluss von M3

## M2: Schritte

Details: [PLAN-M2.md](PLAN-M2.md)

- [x] Plan M2
- [x] 1. Neues Aussehen: dunkles Design, Farben je Gebiet, neue Symbole
- [x] 2. Mathe-Engine für Brüche
- [x] 3. Mehrere Themen, Brüche Stufe 1 und 2 geführt
- [x] 4. Stufen 3 und 4 geführt
- [x] 5. Freier Modus für Brüche
- [x] 6. Stufe 5 geführt und frei
- [x] 7. Gezieltes Üben, Feinschliff, Abschluss von M2 (gezieltes Üben für
  Brüche schon mit Schritt 3)

## M1: Schritte

Details: [PLAN-M1.md](PLAN-M1.md)

- [x] Projektdokumentation (VISION, ROADMAP, CLAUDE.md, Plan M1)
- [x] 1. Grundgerüst und Handy-Zugang
- [x] 2. Mathe-Engine: Terme und Schreibweise
- [x] 3. Mathe-Engine: Ableiten mit Rechenweg und Fehlerregeln
- [x] 4. Geführter Modus (Stufe 1) mit Erklärungen
- [x] 5. Stufen 2 und 3 im geführten Modus, Stufenwahl
- [x] 6. Freier Modus
- [x] 7. Stufe 4 (vorgezogen, wichtigstes Niveau)
- [x] 8. Fortschritt und Fehlerstatistik
- [x] 9. Lernkarten
- [x] 10. Stufe 5: logarithmisches Ableiten, Umkehr- und Hyperbelfunktionen
- [x] 11. Stufe 5: implizites Ableiten
- [x] 12. Feinschliff und Abschluss von M1

## Entscheidungen

- 28.10.2026: Plan M1 freigegeben. Stufe 4 vorgezogen (Schritt 7).
- 28.10.2026: Handy-Test über GitHub Pages, Repo ist dafür öffentlich.
  Adresse: https://mathemann04.github.io/lern-app/
- 28.10.2026: Claude erstellt am Ende jeder Sitzung den Pull Request selbst.
- 28.10.2026: Definitionsbereich nach deutscher Schulkonvention: Wurzeln aus
  negativen Zahlen sind nicht definiert, auch nicht die dritte Wurzel
  (änderbar, falls das Skript es anders handhabt).
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
  umstellen, Werte mit Einheiten einsetzen) kommen in M6 und nutzen
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
