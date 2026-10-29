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
- [ ] 7. Stufe 4 (vorgezogen, wichtigstes Niveau)
- [ ] 8. Fortschritt und Fehlerstatistik
- [ ] 9. Lernkarten
- [ ] 10. Stufe 5: logarithmisches Ableiten, Umkehr- und Hyperbelfunktionen
- [ ] 11. Stufe 5: implizites Ableiten
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
