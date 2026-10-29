# Roadmap

Stand: 29.10.2026

| Meilenstein | Inhalt | Status |
| --- | --- | --- |
| M1 | Grundgerüst + Ableitungsregeln (beide Modi, 5 Stufen, Erklärungen, Lernkarten, Fortschritt) | in Arbeit |
| M2 | Brüche und Formeln umstellen (Bruchrechnung, Doppelbrüche, nach einer Variablen auflösen) | offen |
| M3 | Potenz-, Wurzel- und Logarithmusgesetze | offen |
| M4 | weitere Themen aus Mathematik MB1 | offen |
| M5 | Physik: Formeln umstellen, mit Einheiten | offen |
| M6 | Technische Mechanik: Freischnitt, Gleichgewicht, Lagerkräfte, statische Bestimmtheit | offen |
| Später | Konto und Sync, Teilen mit Kommilitonen, App-Store-Version, optional KI-Hilfe | offen |

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
- [ ] 12. Feinschliff und Abschluss von M1

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
