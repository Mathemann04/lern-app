# Plan für Meilenstein 7: Vektoren, Geraden und Ebenen, Matrizen

Status: **freigegeben** (Nutzer, 12.11.2026: „Passt alles“). Schritte 1a, 1b, 2a und 2b fertig (12.11.2026).

Entwurf zum Ansehen und Anfassen (privat, nur für den Nutzer):
https://claude.ai/artifact/WXe4sjavAGF64jyAWSa3hi. Er zeigt acht Bilder und Aufgaben im geplanten Stil. Die Seite ist
nicht im Repo, weil sie nur ein Muster ist; die App baut alles neu aus der Engine.

## Warum

- Die Vorlesung ist bei Vektoren und Matrizen (Übungen 5 und 6). Vektoren, Geraden und Ebenen, Matrizen, Determinanten
  und Gleichungssysteme bringen rund die Hälfte der Klausurpunkte (docs/AUFGABENARTEN.md, „Die Klausur“).
- **Wunsch des Nutzers (mehrmals, zuletzt 12.11.2026):** viel mehr Bilder und Animationen, wie bei Brilliant, besonders
  im Design. Vektoren eignen sich dafür besonders gut. Darum bekommt M7 seine Bilder **von Anfang an**, nicht erst in
  M6b. Die Zeichen-Grundlage, die M6b geplant hatte, entsteht schon in M7 Schritt 1. M6b nutzt sie danach für Graphen
  (Funktionen, Polynome, Ableiten).

## Grundprinzip: wie in M6

Auf der Mathe-Seite kommen drei Tätigkeiten dazu, jede als Kachel mit eigener Farbe und eigenem Bild:

| Tätigkeit | Farbe (Vorschlag) | Bausteine |
| --- | --- | --- |
| **Vektoren** | Cyan | Rechnen und Länge (Summe, Vielfache, Verbindungsvektor, Mittelpunkt, Einheitsvektor, Vektor gegebener Länge), Skalarprodukt und Winkel, Projektion und Zerlegung, Kreuzprodukt und Fläche, Spatprodukt und Volumen, Linearkombination und Basis, Kräfte (Betrag und Winkel, schiefe Ebene, Arbeit, Drehmoment) |
| **Geraden und Ebenen** | Smaragdgrün | Geraden (Parameterform, Punkt auf Gerade), Ebenen (Parameter-, Normalen-, Koordinatenform, Hesse, Spurpunkte), Lage (Gerade–Gerade, Gerade–Ebene, Ebene–Ebene), Abstände, Winkel |
| **Matrizen und Gleichungssysteme** | Rosé | Matrizen rechnen (Formate, Falk-Schema, Transponierte, „Welche Ausdrücke sind definiert?“), Determinanten (2×2, Sarrus, Entwicklung, Regeln), Gauß (eindeutig, keine, unendlich viele Lösungen), Gleichungssysteme mit Parameter (mit Rang und Cramer), Inverse (Formel, Gauß-Jordan), Matrizengleichungen nach $X$ |

Die Stufen heißen wie in M6 und bringen nie neuen Stoff:

| Stufe | Name | Bei M7 |
| --- | --- | --- |
| 1 | Einstieg | ein Baustein, in der Ebene, kleine ganze Zahlen, ein bis zwei Schritte |
| 2 | Grundlagen | ein Baustein, im Raum, mehrere Schritte |
| 3 | Kombiniert | zwei Bausteine zusammen, z. B. Winkel und Fläche, Projektion und Länge, Determinante und Inverse |
| 4 | Klausur | wie in der Klausur: mit Parameter, ohne Taschenrechner, Ergebnisse exakt (Brüche, Wurzeln) |
| 5 | Profi | alles ineinander: Vektor gegebener Länge senkrecht zu zwei Vektoren (zwei Lösungen), Volumen mit Parameter, Gleichungssystem mit Parameter und allen Sonderfällen, Matrizengleichung mit Transponierter und Inverser, Abstand windschiefer Geraden |

Abwechslung wie überall: Baukasten statt fester Vorlagen (Anzahl der Dimensionen, Art der Frage, Rechenart, gesuchte
Größe, Buchstaben für Punkte und Parameter); Kennzahlen-Test je Baustein und Stufe wie in docs/PLAN-M2b.md.

## Neue Arten von Aufgaben

Bisher gibt es „geführt“ (Schritt für Schritt mit Auswahl, falsche Antworten aus typischen Fehlern) und „frei“
(Eingabe mit der Mathe-Tastatur). M7 bringt dazu:

1. **Eingabe eines Vektors oder einer Matrix** im freien Modus: je Eintrag ein Kästchen mit der Mathe-Tastatur
   (Brüche und Wurzeln möglich). Die Engine prüft jeden Eintrag und markiert falsche einzeln.
2. **Bild wählen:** „Welcher Pfeil ist $\overrightarrow{AB}$?“, vier Bilder als Antworten; die falschen aus typischen
   Fehlern (falsch herum abgezogen, Ortsvektor, addiert). Im geführten Modus auch als einzelner Schritt.
3. **Pfeil ziehen** (Bilder zum Anfassen): „Zieh $\vec b$ so, dass er senkrecht auf $\vec a$ steht“, „… dass der Winkel
   stumpf ist“, „… dass $\vec b$ doppelt so lang ist“. Der Pfeil rastet auf ganzen Zahlen ein; die Engine prüft. Jede
   Zieh-Aufgabe lässt sich auch ohne Ziehen lösen (Koordinaten eintippen), damit sie mit Vorlesehilfe geht.
4. **Schemata als Tabelle:** Kreuzprodukt mit Hilfszeilen, Sarrus mit leuchtenden Diagonalen, Falk-Schema (Zeile mal
   Spalte leuchtet auf), Gauß-Tabelle mit Zeilenumformungen als Auswahl, Gauß-Jordan für die Inverse, Entwicklung mit
   Schachbrett der Vorzeichen.
5. **Entscheidungsbaum:** Lage zweier Geraden Schritt für Schritt (Richtungen parallel? Punkt auf der anderen?
   Gleichungssystem mit zwei Parametern, dritte Gleichung prüfen).

## Bilder und Animationen

Gestaltung wie im Entwurf: weiße Karten (dunkel im dunklen Design), kräftige Farben je Vektor ($\vec a$ blau, $\vec b$
orange, Ergebnis violett, dritter Vektor blaugrün), dicke runde Pfeile, feines Gitter, Formeln über KaTeX darunter.
Animationen starten nur auf Knopfdruck („Abspielen“) und entfallen, wenn am Gerät „Bewegung reduzieren“ eingestellt ist
(dann gleich das fertige Bild). Jedes Bild hat eine Beschreibung für Vorlesehilfen.

| Baustein | Bild | Bewegung |
| --- | --- | --- |
| Rechnen | Pfeile im Gitter, Verbindungsvektor zwischen Punkten | Addition: zweiter Pfeil wandert an die Spitze des ersten, Summenpfeil wächst; Vielfaches streckt oder dreht um |
| Skalarprodukt und Winkel | Winkelbogen, rechter Winkel als Quadrat, Hinweis spitz, recht, stumpf | Pfeil ziehen, Skalarprodukt und Winkel laufen mit |
| Projektion und Zerlegung | Lot, Schatten, rechter Winkel | „Licht an“: Lot fällt, Schatten wächst, senkrechter Rest erscheint; „Typischen Fehler zeigen“ zeichnet den falschen Schatten rot |
| Kreuzprodukt und Fläche | Parallelogramm im Raum, Normale | Bild zum Drehen; Normale wächst bis zur Länge der Fläche |
| Spatprodukt und Volumen | Spat, Prisma, Pyramide, Tetraeder | Spat zieht sich aus dem Parallelogramm auf |
| Linearkombination und Basis | Spann als Gerade oder Ebene im Raum | Vielfache laufen entlang, Ziel wird getroffen oder nicht |
| Kräfte | Kräfte am Punkt, schiefe Ebene | Kräfte hängen sich aneinander; Zerlegung wie bei der Projektion |
| Geraden und Ebenen | Gerade mit Stützpunkt und Richtung, Ebene als Stück mit Normale, Spurpunkte | Punkt läuft entlang der Geraden (Parameter); windschiefe Geraden zum Drehen, am Ende der Abstand |
| Abstände und Winkel | Lot auf die Ebene, Lotfußpunkt | Lot fällt |
| Matrizen rechnen | Falk-Schema | Zeile und Spalte leuchten, Eintrag entsteht; Matrix verzerrt das Gitter |
| Determinanten | Einheitsquadrat und Parallelogramm (2×2), Spat (3×3) | Gitter verzerrt sich von $E$ zu $A$; Vorzeichen als gespiegeltes Bild; Fläche 0 heißt nicht invertierbar |
| Gauß | zwei Geraden (zwei Unbekannte), drei Ebenen (drei Unbekannte) | Richtige Umformung dreht die Gerade um den Schnittpunkt; „rechts vergessen“ schiebt sie weg (rot) |
| Mit Parameter | Geraden oder Ebenen mit Schieberegler | bei den Sonderwerten parallel (keine Lösung) oder gleich (unendlich viele) |

**Lernkarten** bekommen dieselben Bilder (je Baustein mindestens eins, mit „Abspielen“).

## Technik (kurz)

- **Engine** `src/engine/linalg/`: Vektoren und Matrizen mit exakten Zahlen (Brüche aus `rational.ts`, Wurzeln für
  Längen über die Term-Engine), Skalar-, Kreuz- und Spatprodukt, Determinante mit Rechenweg, Gauß und Gauß-Jordan
  mit jedem Zwischenschritt, Rang, Lösungsmengen mit Parametern, Determinante als Polynom im Parameter. Zahlen werden
  so gewählt, dass alles ohne Taschenrechner aufgeht. Winkel nur exakt, wo es geht ($60^\circ$, $\frac{\pi}{4}$),
  sonst als $\arccos(\ldots)$.
- **Bilder** rechnet die Engine aus den Daten der Aufgabe (`linalg/figures.ts`, wie `chem/figures.ts`): Pfeile, Punkte,
  Flächen, Lage im Raum. Tests prüfen, dass Bild und Aufgabe zusammenpassen (z. B. Spitze des Pfeils = Ergebnis,
  Normale senkrecht auf beiden Pfeilen, Schnittpunkt liegt auf beiden Geraden).
- **Zeichen-Grundlage** `src/ui/draw/` (für M7 und später M6b): Koordinatensystem mit Gitter, Pfeile mit Namen, Punkte,
  Flächen, räumliche Ansicht zum Drehen (eigene Projektion wie beim Ionengitter in Chemie, keine Zusatzbibliothek, also
  klein und offline), Abspielen mit „Bewegung reduzieren“, Ziehen mit Finger und Maus mit Einrasten. Farben aus der
  Tonleiter, hell und dunkel.
- **Fehlerregeln** (Katalog in diesem Plan, wächst je Schritt): falsch herum abgezogen, Betrag vergessen, $\frac{1}{2}$
  bzw. $\frac{1}{6}$ vergessen, Vorzeichen der mittleren Komponente beim Kreuzprodukt, Reihenfolge beim Kreuzprodukt,
  $\lvert\vec b\rvert$ statt $\lvert\vec b\rvert^2$ bei der Projektion, Projektion verwechselt, zweite Lösung (±)
  vergessen, Zeile statt Spalte (Falk, Cramer), Produkt nicht definiert, $(AB)^{\mathsf T} = A^{\mathsf T}B^{\mathsf T}$,
  $\lambda$ statt $\lambda^n$, Vorzeichen beim Zeilentausch, Sarrus bei 4×4, rechte Seite vergessen, Nullzeile falsch
  gedeutet, gleicher Parameter für zwei Geraden, beim Ziehen (2b): nur vertauscht ohne Vorzeichen, rechter Winkel als spitz
  oder stumpf gezählt, rechter Winkel an der falschen Ecke, Seiten statt Diagonalen senkrecht, cos statt sin bei Gerade–Ebene, „$A - 2$“ ohne $E$, auf der falschen
  Seite ausgeklammert. Jede mit Katalogbeispiel, eigenem Text für „Warum ist das falsch?“ und Platz auf einer Lernkarte
  (Regeln aus CLAUDE.md).
- **Aufgabennummern** wie seit M6 mit Baustein (`taskNumber.ts`); neue Bausteine bekommen die nächsten freien Nummern in
  `BLOCK_CODES`. Der heutige Baustein „Vektoren“ beim Umstellen bleibt, wie er ist.

## Schritte

Reihenfolge wie in der Vorlesung (Vektoren, Geraden und Ebenen, Matrizen, Determinanten, Gleichungssysteme). Jeder
Schritt lässt sich einzeln ausprobieren; danach Tests, Prüfung im Browser (Handy und Laptop, hell und dunkel), Pull
Request.

1. **Zeichen-Grundlage und Tätigkeit „Vektoren“ mit „Rechnen und Länge“**, in zwei Teilen:
   - **1a (fertig, 12.11.2026):** Kachel „Vektoren“ (eigenes Gebiet „Vektoren und Matrizen“, Farbe Cyan), Baustein
     „Rechnen und Länge“ in den Stufen 1 bis 5, geführt. Elf Arten im Baukasten: Verbindungsvektor (Stufe 1 mit
     „Welcher Pfeil?“ und vier Bildern als Antworten), Endpunkt, Summen und Vielfache, Länge (auch Abstand vom
     Ursprung, Länge eines Vielfachen, Länge einer Summe), Abstand zweier Punkte, Mittelpunkt, Einheitsvektor, Vektor
     gegebener Länge (gleich- oder gegensinnig, Stufe 5 zu einem Verbindungsvektor), vierter Punkt eines
     Parallelogramms (Stufe 5 mit Diagonale), Vektorgleichung, Länge und Abstand mit Parameter (zwei Lösungen). Stufe 4
     auch in vier und fünf Dimensionen. 22 typische Fehler mit Text und Lernkarte, acht Lernkarten mit Bild. Bilder:
     Gitter mit Zahlen an den Achsen, Raum zum Drehen (Startblick so, dass kein Pfeil auf den Betrachter zeigt),
     „Abspielen“ (Pfeile hängen sich aneinander, Katheten und Quader erscheinen, Punkte tauchen auf).
   - **1b (fertig, 12.11.2026):** freier Modus mit Eingabe in Kästchen: ein Vektor als Spalte in Klammern, ein Punkt
     als Zeile $Q(\square \mid \square \mid \square)$, eine Länge als Zahl, zwei Lösungen in beliebiger Reihenfolge,
     beim Parallelogramm der Stufe 5 Punkt und Länge. Falsche Einträge rot markiert, leere und nicht fertige gelb.
     Typische Fehler wie im geführten Modus (aus den falschen Antworten des Schritts, der das Ergebnis liefert), eine
     Lösung vergessen, gerundete Kommazahl. Fertig ist eine ganze Zahl, eine Kommazahl, ein gekürzter Bruch oder ein
     Vielfaches einer vereinfachten Wurzel, auch mit der Wurzel im Nenner wie $\frac{3}{\sqrt{14}}$.
2. **Skalarprodukt und Winkel**, in zwei Teilen:
   - **2a (fertig, 12.11.2026):** Baustein „Skalarprodukt und Winkel“ (`skalar`, Code 22) in den Stufen 1 bis 5, geführt
     und frei. Acht Arten: Skalarprodukt (Stufe 3 mit Summe davor), spitz, recht oder stumpf, senkrecht mit Parameter
     (Stufe 5 quadratisch, zwei Lösungen), Winkel (besondere Winkel in Grad, sonst $\cos\varphi$ exakt und spitz oder
     stumpf), Innenwinkel im Dreieck, Länge aus Längen und Winkel (Stufe 4 im Bogenmaß, Stufe 5 rückwärts),
     spitz oder stumpf mit Parameter (Ungleichung), rechter Winkel im Dreieck mit Parameter. Bilder mit Winkelbogen und
     rechtem Winkel. Frei: Winkel in Grad, Art des Winkels zum Antippen, Ungleichung mit „<“ oder „>“. Vier Lernkarten.
     Typische Fehler: Skalarprodukt als Vektor, Vorzeichen im Produkt, über Kreuz, addiert statt malgenommen, spitz und
     stumpf verwechselt, senkrecht falsch erkannt, Längen ohne Wurzel im Nenner, nur durch eine Länge geteilt,
     Vorzeichen des Kosinus übersehen, Sinus und Kosinus verwechselt, besondere Werte verwechselt, Pfeil nicht am
     Scheitel, Skalarprodukt gleich 1 gesetzt, falsch nach dem Parameter aufgelöst, Ungleichung falsch umgedreht,
     Mittelglied vergessen, Kosinus vergessen, Zahl vor dem Vektor nicht quadriert.
   - **2b (fertig, 12.11.2026):** Zieh-Aufgaben im Baustein „Skalarprodukt und Winkel“ (ein Viertel der Nummern, mit
     eigenem Zufall gewählt, damit die übrigen ihre Aufgabe behalten; immer in der Ebene). Die Spitze von $\vec b$ oder
     ein Punkt rastet auf ganzen Zahlen ein (entlang einer Geraden auf ganzen Werten des Parameters) und lässt sich ohne
     Ziehen mit „−“ und „+“ oder durch Eintippen einstellen. 13 Arten: Stufe 1 senkrecht, spitz, stumpf (mit
     mitlaufendem Winkelbogen); Stufe 2 Skalarprodukt mit Wert, Winkel $45^\circ$ oder $135^\circ$, rechter Winkel an
     einer gegebenen Ecke; Stufe 3 senkrecht und gegebene Länge (zwei Lösungen), rechter Winkel gegenüber einer Seite
     (Thaleskreis); Stufe 4 Spitze entlang einer Geraden mit Parameter, danach Gleichung bzw. Ungleichung wie in 2a;
     Stufe 5 Diagonalen einer Raute senkrecht, $(\vec a - \vec b) \perp \vec b$, zwei Bedingungen mit eindeutiger
     Lösung. Rückmeldung mit der Rechnung an der eigenen Stelle; „Prüfen“ am Start zählt nicht. Frei: ohne eindeutiges
     Ergebnis wird gezogen, mit Parameter wird getippt und das Bild dient zum Ausprobieren. Vier neue typische Fehler:
     nur vertauscht ohne Vorzeichen, rechter Winkel als spitz oder stumpf gezählt, rechter Winkel an der falschen Ecke,
     Seiten statt Diagonalen senkrecht.
3. **Projektion, Zerlegung und Kräfte:** Animation „Licht an“, typischer Fehler im Bild, schiefe Ebene.
4. **Kreuzprodukt und Spatprodukt:** räumliche Ansicht zum Drehen, Schema mit Hilfszeilen, Flächen und Volumen
   (Spat, Prisma, Pyramide, Tetraeder), komplanar, Volumen mit Parameter.
5. **Linearkombination und Basis:** Spann im Raum, kleine Gleichungssysteme Schritt für Schritt.
6. **Geraden und Ebenen, Formen:** Tätigkeit „Geraden und Ebenen“; Parameter-, Normalen-, Koordinatenform, Hesse,
   umrechnen, Spurpunkte.
7. **Lage, Abstände, Winkel:** Entscheidungsbaum für zwei Geraden, Gerade–Ebene, Ebene–Ebene, alle Abstände mit Lot,
   Winkel mit cos bzw. sin.
8. **Matrizen rechnen:** Tätigkeit „Matrizen und Gleichungssysteme“; Formate, Falk-Schema animiert, Transponierte,
   „Welche Ausdrücke sind definiert?“, Matrix verzerrt das Gitter; Eingabe einer Matrix.
9. **Determinanten:** Fläche und Volumen als Bild, Sarrus animiert, Entwicklung mit Schachbrett, Umformungen, Regeln
   ($\det(\lambda A)$, $\det A^{\mathsf T}$, $\det A^{-1}$, $\det(AB)$), mit Parameter.
10. **Gauß:** Tabelle mit Zeilenumformungen, Geraden und Ebenen als Bild, alle drei Fälle, Lösung mit Parametern.
11. **Gleichungssysteme mit Parameter und Cramer:** Determinante als Polynom, Sonderfälle mit Schieberegler, Rang.
12. **Inverse und Matrizengleichungen:** 2×2 mit Formel, 3×3 mit Gauß-Jordan Zeile für Zeile, Matrizengleichung erst
    allgemein nach $X$ auflösen (wie beim Umstellen), dann ausrechnen.
13. **Abschluss:** Mischen über alle drei Tätigkeiten, Abwechslung gemessen, Prüfung aus mehreren Blickwinkeln, Doku.

Größere Schritte (vor allem 1, 4, 10) werden bei Bedarf in Teile geteilt (1a, 1b …), damit jeder Teil schnell zum
Ausprobieren kommt.

## Fragen an den Nutzer

1. **Aussehen:** Passt der Stil im Entwurf? Was soll anders werden (Farben, Größe der Bilder, mehr oder weniger
   Bewegung)?
2. **Reihenfolge:** wie in der Vorlesung (Vektoren, Geraden und Ebenen, Matrizen, Determinanten, Gleichungssysteme).
   Falls die Klausur oder eine Übung etwas früher braucht, wird es vorgezogen.

Unterlagen braucht es für M7 vorerst nicht: Die Übersicht in docs/AUFGABENARTEN.md reicht. Wenn neue Übungsblätter zu
Geraden, Ebenen oder Matrizen dazukommen, ergänzt eine Sitzung die Übersicht.
