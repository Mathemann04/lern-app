# Plan für Meilenstein 7: Vektoren, Geraden und Ebenen, Matrizen

Status: **freigegeben** (Nutzer, 12.11.2026: „Passt alles“). Schritte 1a, 1b, 2a, 2b und 3a fertig (12.11.2026), 3b, 4a, 4b, 5, 6, 7a, 7b, 8a, 8b, 9a, 9b, 10a, 10b und 11a fertig (13.11.2026), 11b und 11c fertig (14.11.2026); offen ab 12.

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
  gedeutet, gleicher Parameter für zwei Geraden, beim Ziehen (2b): nur vertauscht oder nur ein Vorzeichen geändert, rechter Winkel als spitz
  oder stumpf gezählt, rechter Winkel an der falschen Ecke, Seiten statt Diagonalen senkrecht, bei der Projektion (3a) die 15 Fehler aus Schritt 3a, bei den Kräften (3b) die 26 Fehler aus Schritt 3b, beim Kreuzprodukt (4a) die 14 Fehler aus Schritt 4a, beim Spatprodukt (4b) die 14 Fehler aus Schritt 4b, bei Linearkombination und Basis (5) die 20 Fehler aus Schritt 5, bei Geraden und Ebenen (6) die 33 Fehler aus Schritt 6 (Vorsilbe „gl-“), bei der Lage (7a) die 17 Fehler aus Schritt 7a, bei Abständen und Schnittwinkeln (7b) die 14 Fehler aus Schritt 7b, bei den Matrizen (8a) die 27 Fehler aus Schritt 8a (Vorsilbe „mat-“), bei den Determinanten (9a) die 37 Fehler aus Schritt 9a (Vorsilbe „det-“), beim Gauß-Verfahren (10a) die 34 Fehler aus Schritt 10a (Vorsilbe „gauss-“), bei der Cramerschen Regel (11a) die 10 Fehler aus Schritt 11a (Vorsilbe „cramer-“), bei Gleichungssystemen mit Parameter (11b) die 23 Fehler aus Schritt 11b (Vorsilbe „lgsp-“), bei der Inversen (12a) die 29 Fehler aus Schritt 12a (Vorsilbe „inv-“), cos statt sin bei Gerade–Ebene, „$A - 2$“ ohne $E$, auf der falschen
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
     nur vertauscht oder nur ein Vorzeichen geändert, rechter Winkel als spitz oder stumpf gezählt, rechter Winkel an der falschen Ecke,
     Seiten statt Diagonalen senkrecht.
3. **Projektion, Zerlegung und Kräfte**, in zwei Teilen:
   - **3a (fertig, 12.11.2026):** Baustein „Projektion und Zerlegung“ (`projektion`, Code 23) in den Stufen 1 bis 5,
     geführt und frei. Sechs Arten: Schatten $\vec a_{\parallel}$ von $\vec a$ auf $\vec b$ (Stufe 3 mit $\vec b$ aus
     zwei Punkten), Zerlegung in $\vec a_{\parallel}$ und $\vec a_{\perp}$ (Stufe 3 mit der Länge des Rests, Stufe 4 in
     vier und fünf Dimensionen), Länge des Schattens, Lotfußpunkt $F$ und Abstand eines Punktes von einer Geraden
     (Stufe 5 Gerade durch zwei Punkte), Parameter so, dass der Schatten ein gegebener Vektor ist (Stufe 4) bzw. eine
     gegebene Länge hat (Stufe 5, Betrag, zwei Lösungen), Schatten auf eine Ebene aus zwei senkrechten Vektoren mit
     Abstand (Stufe 5, auch in vier Dimensionen). Bilder: Knopf „Licht an“ (Lot fällt, Schatten wächst, senkrechter
     Rest mit rechtem Winkel erscheint) und „Typischen Fehler zeigen“ (Schatten rot, wenn durch $\lvert\vec b\rvert$
     statt $\lvert\vec b\rvert^2$ geteilt; nur, wenn er ins Bild passt). Zahlen so gezogen, dass Schatten und Rest
     beide gut zu sehen sind. Drei Lernkarten, 15 neue typische Fehler: durch die Länge statt ihr Quadrat geteilt, auf
     den falschen Vektor projiziert, Bruch umgedreht, Faktor mal den falschen Vektor, Rest falsch herum, Schatten
     addiert, ganzen Vektor abgezogen, Länge des Schattens durch das Quadrat geteilt, Betrag vergessen, durch das
     Längenquadrat teilen vergessen, Stützpunkt vergessen, vom falschen Punkt abgetragen, falsche Strecke gemessen,
     nur auf einen Vektor projiziert, Faktoren vertauscht.
   - **3b (fertig, 13.11.2026):** Baustein „Kräfte“ (`kraefte`, Code 24) in den Stufen 1 bis 5, geführt und frei, mit
     Einheiten (N, Nm, J, m). Sieben Arten: Kraft zerlegen (Winkel ab der $x$-Achse in allen Quadranten oder ab der
     $y$-Achse), Betrag und Winkel aus den Komponenten (Hilfswinkel über den Tangens, dann der Quadrant),
     Resultierende (Stufe 2 in Komponenten, Stufe 3 aus Betrag und Winkel, Stufe 4 Gegenkraft im Gleichgewicht),
     schiefe Ebene (Stufe 1 mit $\sin$ und $\cos$, Stufe 3 als Projektion wie in 3a, Stufe 4 waagrechte Haltekraft,
     Stufe 5 als Vektorgleichung mit der Normalenrichtung), Arbeit (Skalarprodukt, mit Punkten, mit Betrag und Winkel,
     umgestellt nach Winkel oder Weg, Stufe 5 mit Parameter), Drehmoment in der Ebene (um $O$, um $A$, zwei Kräfte,
     Stufe 5 Momentengleichgewicht), Seilkräfte am Knoten (Stufe 4 ein Seil waagrecht, Stufe 5 beide schräg). Bilder:
     Komponenten zum Abspielen, Winkel auch über $180^\circ$, Krafteck, schiefe Ebene als Szene mit rechtem Winkel,
     Knoten mit Seilen. Fünf Lernkarten, 26 neue typische Fehler: Sinus und Kosinus vertauscht, Vorzeichen nicht aus
     dem Quadranten, Betrag der Kraft vergessen, Bruch im Tangens umgedreht, Wert des Taschenrechners ungeprüft
     übernommen, falscher Quadrant, Beträge addiert statt Vektoren, abgezogen statt addiert, Gegenkraft mit falschem
     Vorzeichen, ganze Kraft statt Anteil, falsch umgestellt, am Hang $\sin$ und $\cos$ vertauscht, waagrechte
     Haltekraft wie die Hangabtriebskraft, Anteil der Haltekraft in der Normalkraft vergessen, Normalenrichtung
     falsch, Winkel zwischen Kraft und Weg vergessen, Vorzeichen der Arbeit falsch gedeutet, Reihenfolge im Moment
     vertauscht, Plus statt Minus im Moment, Skalarprodukt statt Moment, Hebel ab dem Ursprung, Hebelarm schräg
     gemessen, Drehsinn falsch abgelesen, Richtung nicht auf Länge 1 gebracht, falsche Komponente genommen,
     Seilkräfte vertauscht.
4. **Kreuzprodukt und Spatprodukt**, in zwei Teilen:
   - **4a (fertig, 13.11.2026):** Baustein „Kreuzprodukt und Fläche“ (`kreuz`, Code 25) in den Stufen 1 bis 5, geführt
     und frei. Sechs Arten: Kreuzprodukt (Schema mit Hilfszeilen in der Erklärung; Stufe 2 dazu $\vec b \times \vec a$),
     Fläche von Parallelogramm und Dreieck (Stufe 1 in der $x$-$y$-Ebene, Stufe 2 Dreieck aus Punkten, Stufe 3 vierte
     Ecke und Fläche), Normalenvektor (Ebene durch drei Punkte, Länge $1$, gegebene Länge mit zwei Lösungen), Abstand
     Punkt–Gerade als Fläche durch Grundseite (Stufe 5 mit der Fläche des Dreiecks), parallel mit Parameter, Fläche mit
     Parameter (Stufe 4 gegeben, zwei Lösungen; Stufe 5 am kleinsten). Bilder im Raum zum Drehen: Parallelogramm bzw.
     Dreieck, beim Abspielen erscheint die Fläche, die Normale wächst bis zur Länge der Fläche, dann der rechte Winkel;
     beim Abstand Parallelogramm und Lot mit Lotfußpunkt. Frei: zwei Vektoren als Lösungen in beliebiger Reihenfolge.
     Vier Lernkarten, 14 neue typische Fehler: Vorzeichen der mittleren Komponente, Reihenfolge vertauscht, Plus statt
     Minus, falsche Zeilen im Schema, Einträge an derselben Stelle malgenommen, beim Dreieck die Hälfte vergessen, beim
     Parallelogramm halbiert, Längen malgenommen (Winkel vergessen), Skalarprodukt statt Kreuzprodukt, nur auf Länge 1
     gebracht, Fläche statt Abstand, durch das Quadrat der Grundseite geteilt, parallel und senkrecht verwechselt,
     Scheitel ohne die 2.
   - **4b (fertig, 13.11.2026):** Baustein „Spatprodukt und Volumen“ (`spat`, Code 26) in den Stufen 1 bis 5, geführt
     und frei. Sechs Arten: Spatprodukt (Stufe 1 über Kreuz- und Skalarprodukt, Stufe 2 mit Sarrus und Rechts- oder
     Linkssystem), Volumen von Spat, Prisma, Pyramide und Tetraeder (Stufe 1 Spat, Stufe 2 alle vier, Stufe 3 aus
     Punkten), komplanar (Stufe 2 drei Vektoren, Stufe 3 vier Punkte in einer Ebene; bei der Hälfte komplanar), Höhe über
     der Grundfläche (Stufe 3 Spat, Stufe 4 Tetraeder aus Punkten, Stufe 5 dazu Fläche und Volumen), komplanar mit
     Parameter (Stufe 4 eine Lösung, Stufe 5 Parameter in zwei Vektoren mit Sarrus, quadratisch, zwei Lösungen), Volumen
     mit Parameter (Betrag, zwei Lösungen; Stufe 5 Spitze mit Parameter). Bild: Grundfläche, dann zieht sich der Körper
     beim Knopf „Aufziehen“ aus ihr auf; bei der Höhe fällt das Lot mit rechtem Winkel. Frei: Rechtssystem,
     Linkssystem oder komplanar zum Antippen. Drei Lernkarten, 14 neue typische Fehler: Haupt- und Nebendiagonalen
     vertauscht, Nebendiagonalen addiert, nur eine Diagonale je Richtung, zweimal das Kreuzprodukt, Rechts- und
     Linkssystem verwechselt, komplanar falsch erkannt, Betrag vergessen, Faktor des Körpers verwechselt, Faktor
     vergessen, Längen malgenommen wie beim Quader, schräge Kante statt Höhe, Volumen statt Höhe, durch das Quadrat der
     Grundfläche geteilt, beim Tetraeder das Drittel vergessen.
5. **Linearkombination und Basis (fertig, 13.11.2026):** Baustein „Linearkombination und Basis“ (`basis`, Code 27) in den
   Stufen 1 bis 5, geführt und frei. Sieben Arten: Linearkombination bestimmen (Stufe 1 in der Ebene, Stufe 2 im Raum
   mit Probe), liegt ein Vektor im Spann (Stufe 2 im Raum, Stufe 3 in vier Dimensionen; bei der Hälfte nicht), linear
   unabhängig (Stufe 1 mit der $2 	imes 2$-Determinante, Stufe 2 mit Sarrus; bei der Hälfte abhängig), Dimension und
   Basis des Spanns (drei oder vier Vektoren im Raum, Dimension 1, 2 oder 3), Koordinaten in einer Basis mit Gauß
   (Stufe 3 ganze Zahlen, Stufe 4 Brüche), Parameter so, dass ein Vektor im Spann liegt (Stufe 4 im Raum, Stufe 5 in
   vier Dimensionen mit Probe), Parameter so, dass drei Vektoren abhängig sind (Stufe 5 dazu der dritte als
   Linearkombination). Kleine Gleichungssysteme Schritt für Schritt: aufstellen, eliminieren, einsetzen, Probe. Bild:
   Spann als Ebene im Raum, beim „Abspielen“ hängen sich die Vielfachen aneinander und treffen das Ziel oder verfehlen
   es (rote Strecke). Frei: „linear unabhängig“ oder „linear abhängig“ und „im Spann“ oder „nicht im Spann“ zum
   Antippen. Drei Lernkarten, 20 neue typische Fehler: Einträge eines Vektors in eine Gleichung geschrieben, Faktoren
   den falschen Vektoren zugeordnet, Zielvektor mit falschem Vorzeichen, rechte Seite 0 statt Zielvektor, übrige
   Gleichungen nicht geprüft, im Spann übersehen, rechte Seite nicht mitgerechnet, Vorzeichen beim Abziehen, beim Einsetzen das Vorzeichen
   nicht gedreht, nicht durch den Faktor geteilt, abhängig und unabhängig verwechselt, unabhängig mit senkrecht
   verwechselt, Faustregel „kein Nullvektor“ umgedreht, nur paarweise auf parallel geprüft, Anzahl der Vektoren statt
   Dimension, zu viele Vektoren gestrichen, parallele Vektoren mitgezählt, Zahl der Einträge statt Dimension, Plus statt
   Minus bei der $2 \times 2$-Determinante, Einträge eines Vektors miteinander malgenommen.
6. **Geraden und Ebenen, Formen (fertig, 13.11.2026):** Tätigkeit „Geraden und Ebenen“ (Id `geraden`, Farbe Smaragdgrün,
   Bild: Ebene, von einer Geraden durchstoßen) mit den Bausteinen „Geraden“ (`gerade`, Code 28) und „Ebenen“ (`ebene`,
   Code 29) in den Stufen 1 bis 5, geführt und frei. Geraden, fünf Arten: Parameterform durch zwei Punkte (Stufe 1 in der
   Ebene, 2 im Raum) oder durch einen Punkt parallel zu einer Geraden (3), Punkt zu einem Parameterwert (1, 2) oder mit
   gegebener Koordinate (2, 3), Punktprobe (1 Ebene, 2 Raum; bei der Hälfte nicht drauf), drei Punkte auf einer Geraden
   (3), Unbekannte in den Koordinaten (4 mit gegebener Geraden, 5 mit der Geraden durch zwei Punkte), Spurpunkte (2
   Schnitt mit den Achsen, 3 mit zwei Koordinatenebenen, 4 mit allen dreien und Brüchen, 5 zwei und ihr Abstand),
   Punkte mit gegebenem Abstand vom Stützpunkt (4, 5; zwei Lösungen). Ebenen, fünf Arten: Punktprobe in der
   Koordinatenform (1) bzw. erst aus der Normalenform umrechnen (2), Koordinatenform aus der Normalenform (1), der
   Parameterform mit Kreuzprodukt (2), drei Punkten oder Achsenabschnitten (3), dazu ein Punkt mit Unbekannter (4 aus
   der Parameterform, 5 aus drei Punkten), Parameterform aus drei Punkten (2) oder aus der Koordinatenform (3, zwei
   Variablen frei wählen), Hessesche Normalform (2 aus der Koordinatenform, 3 aus der Normalenform, 4 aus der
   Parameterform, 5 aus drei Punkten; rechts negativ: mal $-1$), Spurpunkte (1 und 2 ganze, 3 Brüche, 4 aus der
   Parameterform, 5 aus drei Punkten). Bilder: Gerade mit Stützvektor, Richtung und gestrichelter Geraden zum Abspielen,
   Punkte darauf; Ebene als Stück mit Richtungen und Normale; Spurdreieck mit verlängerten Achsen. Frei: Parameterform in
   Spalten (jeder andere Stützpunkt und jedes Vielfache der Richtung ist richtig, die falsche Spalte wird markiert),
   Koordinatenform in vier Kästchen (jedes Vielfache ist richtig; nur rechts falsch: nur dieses Kästchen markiert),
   Hessesche Normalform nur genau normiert, Punktprobe zum Antippen, zwei Punkte in beliebiger Reihenfolge. Sechs
   Lernkarten im eigenen Ordner, 33 neue typische Fehler: Stützvektor und Richtung vertauscht, Ortsvektor statt
   Richtungsvektor, Stützpunkt der gegebenen Geraden genommen, Stützvektor der anderen Geraden als Richtung, Parameterwert
   nicht eingesetzt, Parameter mal Stützvektor, Vorzeichen beim Auflösen nach dem Parameter, malgenommen statt geteilt,
   nur eine Zeile geprüft, Punktprobe falsch gedeutet, nur der Stützpunkt zählt, falsche Koordinate gleich 0 gesetzt,
   Richtung nicht auf Länge 1 gebracht, Vorzeichen der rechten Seite, Normalenvektor und Punkt vertauscht, Zahlen vor
   $x$, $y$, $z$ vergessen, Koordinaten an der falschen Stelle eingesetzt, Richtungsvektor als Normalenvektor, zweimal
   dieselbe Richtung, Vorzeichen beim Auflösen nach einer Koordinate, Stützvektor vergessen, Normalenvektor als
   Richtung, Achsenabschnitte als Zahlen vor $x$, $y$, $z$, rechte Seite nicht mit malgenommen, nicht normiert, rechte
   Seite negativ gelassen, durch das Quadrat der Länge geteilt, nur die linke Seite geteilt, Bruch beim Spurpunkt
   umgedreht, nicht durch den Faktor geteilt, Vorzeichen beim Spurpunkt, auf der falschen Achse eingetragen, mit $0$
   statt der rechten Seite verglichen.
7. **Lage, Abstände, Winkel**, in zwei Teilen:
   - **7a (fertig, 13.11.2026):** Baustein „Lage“ (`lage`, Code 30, Gruppe „Lage, Abstände, Winkel“) in den Stufen 1 bis 5,
     geführt und frei. Sechs Arten: Lage zweier Geraden als Entscheidungsbaum (Richtungen parallel? Faktor je Zeile;
     Punktprobe mit dem Stützpunkt; sonst gleichsetzen mit zwei Parametern, eliminieren, einsetzen, Probe in der dritten
     Gleichung; Stufe 1 in der Ebene, 2 im Raum, 3 mit $g$ durch zwei Punkte; jede Lage kommt vor), Schnittpunkt (Stufe 1
     Ebene, 2 Raum, 4 Parameter $a$ im Stützvektor aus der dritten Gleichung, 5 dazu $g$ durch zwei Punkte), Lage Gerade
     und Ebene (einsetzen: eine Lösung, keine oder jede; Stufe 4 Parameter $a$ mit $\vec n \cdot \vec v = 0$ und
     Punktprobe, Stufe 5 $a$ und $b$ so, dass die Gerade in der Ebene liegt, Ebene in Normalenform), Durchstoßpunkt
     (Stufe 1 und 2 Koordinatenform, 3 Parameterform mit Kreuzprodukt), Lage zweier Ebenen (Normalen und rechte Seite;
     Stufe 3 aus Normalen- oder Parameterform, Stufe 4 Parameter $a$ bzw. $a$ und $b$), Schnittgerade (Stufe 3 eine
     Variable frei wählen, Stufe 4 Parameterform in die Koordinatenform einsetzen, Stufe 5 Ebene durch drei Punkte). Bilder
     im Raum (in Stufe 1 in der Ebene): Geraden mit Richtungspfeil, Ebenenstücke, Schnittpunkt, Durchstoßpunkt und
     Schnittgerade zum Abspielen; bei Fragen nach der Lage erst beim Ergebnis. Frei: Lage zum Antippen, Schnittpunkt,
     Parameter und Schnittgerade in Kästchen (jede Gleichung derselben Geraden ist richtig). Drei Lernkarten, 17 neue
     typische Fehler: gleicher Parameter für beide Geraden, Vorzeichen beim Herüberbringen, Richtungen bzw. Normalen nicht
     verglichen, identisch und echt parallel verwechselt, nicht parallel heißt nicht windschief, dritte Gleichung nicht
     geprüft, Vielfaches nicht erkannt, Vielfaches nur in einer Zeile geprüft, Parameter in die falsche Gerade
     eingesetzt, Stützvektor beim Einsetzen vergessen, liegt in der Ebene und parallel verwechselt, Richtung und Normale
     falsch gedeutet, rechte Seite nicht verglichen, frei gewählte Variable weggelassen, ihre Zeile vergessen, beim
     Einsetzen nur einen Teil berücksichtigt, gleiche Einträge statt Vielfaches.
   - **7b (fertig, 13.11.2026):** Bausteine „Abstände“ (`abstand`, Code 31) und „Schnittwinkel“ (`schnittwinkel`, Code 32)
     in der Gruppe „Lage, Abstände, Winkel“, Stufen 1 bis 5, geführt und frei. Abstände, vier Arten: Punkt–Ebene (Stufe 1
     Koordinatenform mit ganzzahliger Länge der Normalen, 2 Normalenform oder Hessesche Normalform, 3 Parameterform mit
     Kreuzprodukt, 4 Punkt mit Parameter $a$ und gegebenem Abstand, zwei Lösungen, 5 Lotgerade, Lotfußpunkt und
     Spiegelpunkt), Punkt–Gerade über den Lotfußpunkt (allgemeiner Punkt $F_t$, $\overrightarrow{PF_t} \cdot \vec v = 0$,
     $t$, $F$, Länge; Stufe 1 Ebene, 2 Raum, 3 Gerade durch zwei Punkte, 5 Spiegelpunkt), zwei Geraden (Stufe 2
     parallel, 3 parallel oder windschief, 4 windschief mit $g$ durch zwei Punkte, 5 beide durch zwei Punkte mit Prüfung
     „nicht parallel“; windschief mit $\vec n = \vec v \times \vec w$), parallele Ebenen bzw. Gerade parallel zur Ebene
     (Stufe 1 gleiche Normale, 2 Vielfaches, 3 Gerade, 4 Ebene in Normalenform; ein Punkt der einen in die andere). Bild:
     Knopf „Lot fällen“ (Lot mit Lotfußpunkt, dann rechter Winkel, beim Spiegeln der Spiegelpunkt), windschief die
     kürzeste Verbindung mit zwei rechten Winkeln. Schnittwinkel, drei Arten: zwei Geraden, Gerade und Ebene ($\sin$),
     zwei Ebenen; Stufe 1 und 2 besondere Winkel in Grad, 3 Ebene in Parameterform oder allgemein ($\cos\varphi$ bzw.
     $\sin\varphi$ exakt) bzw. Winkel zu einer Koordinatenebene, 4 Parameter so, dass senkrecht, 5 aus Punkten. Erster
     Schritt „Welche Formel?“ (Richtungen bzw. Normalen, Betrag, $\sin$ bei Gerade und Ebene). Bild mit Winkelbogen am
     Schnittpunkt, bei Gerade und Ebene zum Schatten der Geraden, bei Ebenen senkrecht zur Schnittgeraden. Vier
     Lernkarten, 14 neue typische Fehler: Betrag vergessen (Abstand negativ), rechte Seite nicht abgezogen, beim Betrag
     nur ein Fall, Ortsvektor statt Verbindungsvektor, mit dem Stützvektor statt der Richtung malgenommen, Abstand vom
     Ursprung, Lotfußpunkt statt Spiegelpunkt, Spiegelpunkt in die falsche Richtung, Abstand der Stützpunkte statt der
     Geraden, rechte Seiten ohne gleiche Normalen verglichen, Betrag vergessen (Winkel stumpf), cos statt sin bei Gerade
     und Ebene, Stützvektor statt Richtung, Richtung der Ebene statt Normale.
8. **Matrizen rechnen**, in zwei Teilen:
   - **8a (fertig, 13.11.2026):** Tätigkeit „Matrizen und Gleichungssysteme“ (Id `matrizen`, Farbe Rosé, Bild: Matrix in
     Klammern mit hervorgehobener Zeile und Spalte) mit dem Baustein „Matrizen rechnen“ (`matrix`, Code 33, Gruppe
     „Matrizen“) in den Stufen 1 bis 5, geführt und frei. Zehn Arten: Matrix aus einer Vorschrift $a_{ij}$ mit Format
     (Stufe 1), Summe und Vielfache (1 eine Rechnung, 2 mit Vielfachem oder Transponierter vorweg), Transponierte (1),
     Produkt mit Format, einem Eintrag im Falk-Schema und dem ganzen Produkt (2 kleine, 3 auch $3 \times 3$ und „Welches
     der Produkte ist definiert?“), Matrix mal Vektor (2 in der Ebene mit Bild, 3 im Raum; erst $A\vec e_j$ = Spalte),
     „Welcher Ausdruck ist definiert?“ unter vier mit drei Matrizen, dann berechnen (3, ab 4 mit Transponierter),
     $(AB)^{\mathsf T}$ mit Regel, Produkt, Transponierter (3, 4), Zeile mal Spalte und Spalte mal Zeile (4), für welches
     $a$ gilt $AB = BA$ (4 mit $2 \times 2$, 5 mit $3 \times 3$; $B = \lambda A(a^*) + \mu E$, genau ein Wert),
     längere Ausdrücke $A B^{\mathsf T} - kC$, $(A + kB)^{\mathsf T} C$, $A^{\mathsf T} A - kE$ (5). Falk-Schema als Tabelle
     in der Erklärung (Zeile und Spalte fett, Eintrag umrahmt). Bild bei Matrix mal Vektor: Einheitsquadrat, beim Abspielen
     wird es zum Parallelogramm der Spalten, das Gitter $[0, 2]^2$ verzerrt sich mit, dann erscheint $A\vec x$. Frei: Matrix
     im Raster aus Kästchen („Zeile 2, Spalte 1“), falscher Eintrag markiert. Sechs Lernkarten, 27 neue typische Fehler:
     Zeilen und Spalten beim Format vertauscht, Anzahl der Einträge statt Format, Zeile und Spalte beim Eintrag vertauscht,
     Zahl nur mit der ersten Zeile malgenommen, Zahl addiert statt malgenommen, Minus nur beim ersten Eintrag, falsch herum
     abgezogen, Summe verschiedener Formate, an der falschen Diagonale gespiegelt, Einträge nur ins neue Format umgefüllt,
     $(AB)^{\mathsf T} = A^{\mathsf T} B^{\mathsf T}$, nur die Reihenfolge getauscht, Transponieren vergessen, Format des
     Produkts aus den falschen Zahlen, nur das erste Produkt, addiert statt malgenommen, Zeile mal Zeile, Spalte mal Spalte, Plus und Minus verwechselt, Eintrag für
     Eintrag malgenommen, Reihenfolge vertauscht, Produkt mit unpassenden Formaten, Zeile mal Spalte und Spalte mal Zeile
     verwechselt, Zeile statt Spalte genommen ($A\vec e_j$), $kE$ von jedem Eintrag abgezogen, Vorzeichen beim Auflösen,
     $AB = BA$ für jedes $a$.
   - **8b (fertig, 13.11.2026):** Falk-Schema als Bild über den Antworten in jedem Schritt zum Produkt (ein Eintrag, das
     ganze Produkt, Zeile mal Spalte, Spalte mal Zeile, $AB$ und $BA$ mit Parameter) und auf der Lernkarte „Produkt mit dem
     Falk-Schema“: rechte Matrix oben rechts, linke unten links. Vor der Antwort sind die gefragten Felder leer (ein
     einzelner Eintrag mit „?“), und es gibt nichts abzuspielen. Danach stehen die Einträge da, und „Abspielen“ geht
     Eintrag für Eintrag durch: Zeile und Spalte leuchten auf, das gerade malgenommene Paar ist umrahmt, die Rechnung
     darunter wächst Produkt für Produkt, zuletzt erscheint der Eintrag in seinem Feld (der erste langsam, die übrigen
     schneller; „Alles zeigen“ springt ans Ende). Bei „Bewegung reduzieren“ zeigt der Knopf gleich das Ende. Die Tabelle
     in der Erklärung ist dafür weggefallen. Nebenbei: Sternchen für Fettdruck auf den Lernkarten zu Geraden und Matrizen
     entfernt (die App kennt keinen Fettdruck; ein Test verbietet sie jetzt).
9. **Determinanten**, in zwei Teilen:
   - **9a (fertig, 13.11.2026):** Baustein „Determinanten“ (`determinante`, Code 34, Gruppe „Determinanten“) in der Tätigkeit
     „Matrizen und Gleichungssysteme“, Stufen 1 bis 5, geführt und frei. Acht Arten: $2 \times 2$ (Stufe 1, oft mit der
     Fläche des Parallelogramms aus den Spalten), Sarrus (Stufe 1; Stufe 2 oft mit dem Volumen des Spats aus den Spalten),
     Dreiecksmatrix (Stufe 2, $3 \times 3$ und $4 \times 4$), Entwickeln mit dem Schachbrett (Stufe 2 $3 \times 3$ nach
     einer Zeile oder Spalte mit einer Null, Stufe 3 $4 \times 4$ mit drei Nullen, Stufe 4 mit zwei Nullen und zwei
     Unterdeterminanten, Stufe 5 $5 \times 5$ zweimal entwickeln; ab $4 \times 4$ zuerst „Wie berechnest du am
     geschicktesten?“), Zeilenumformungen ($\det A$ bekannt, $B$ aus Tausch, Faktor und Vielfachen der Zeilen
     $\vec z_1, \vec z_2, \dots$; Stufe 3 $3 \times 3$, Stufe 5 $4 \times 4$ mit allem), Nullen erzeugen und entwickeln
     (Stufe 4), Regeln (Stufe 3 $\det(\lambda X)$ mit $X^{\mathsf T}$, $X^{-1}$ oder $X^k$, Stufe 4 mit zwei Matrizen und
     „Zerlegen“, Stufe 5 dazu $\det A$ erst mit Sarrus), mit Parameter (Stufe 4 $3 \times 3$, Stufe 5 $4 \times 4$ erst
     entwickeln; „nicht invertierbar“, „Spalten bzw. Zeilen linear abhängig“, „$A\vec x = \vec 0$ hat mehr als eine
     Lösung“, zwei ganzzahlige Lösungen). Bilder: Einheitsquadrat wird beim Abspielen zum Parallelogramm der Spalten
     (Fläche $\lvert\det A\rvert$, Orientierung bei negativer Determinante), Spat der Spalten zieht sich auf. Frei: Zahl,
     Fläche bzw. Volumen, zwei Lösungen in beliebiger Reihenfolge. Sechs Lernkarten, 37 neue typische Fehler: Plus statt
     Minus bei $2 \times 2$, Diagonalen vertauscht, Zeilen statt Diagonalen, Nebendiagonalen addiert, nur eine Diagonale je
     Richtung, Haupt- und Nebendiagonalen vertauscht, nur die Hauptdiagonale, Sarrus bei großer Matrix, Betrag vergessen,
     halbiert, Faktor eines anderen Körpers, Diagonale addiert, Gegendiagonale, 0 ohne Nullzeile, Schachbrett vergessen,
     Schachbrett falsch angesetzt, falsche Zeile oder Spalte gestrichen, Eintrag vergessen, Vorzeichen beim Tausch, Faktor
     vergessen, Faktor hoch $n$, durch den Faktor geteilt, Vielfaches verändert die Determinante, Vielfaches macht sie 0,
     addiert statt abgezogen, nur den ersten Eintrag verändert, falsch herum abgezogen, $\lambda$ statt $\lambda^n$,
     Transponieren verändert sie, Kehrwert vergessen, Inverse wie das Negative, Potenz als Faktor, Potenz vergessen, Summe
     statt Produkt, invertierbar verwechselt,
     $\det A = 1$ gefordert, Vorzeichen der Nullstellen. Nebenbei: `**fett**` in Erklärungen und Fehlertexten wird jetzt fett gesetzt (bisher
     standen die Sternchen sichtbar da); auf Lernkarten bleibt es seit 8b verboten.
   - **9b (fertig, 13.11.2026):** Sarrus als Bild über den Antworten in jedem Schritt mit Sarrus (Determinanten, auch
     Unterdeterminanten beim Entwickeln und mit Parameter; Spatprodukt; Linearkombination und Basis) und auf den Lernkarten,
     deren Beispiel genau einen Schritt mit Sarrus hat: die Matrix zwischen Determinantenstrichen, die ersten beiden
     Spalten blass rechts daneben. Vor der Antwort nur das Schema, ohne Knopf. Danach „Abspielen“: erst leuchten die
     abgeschriebenen Spalten, dann nacheinander die drei Diagonalen nach rechts unten (blau, Plus) und die drei nach links
     unten (orange, Minus) wie mit einem Textmarker, die drei Felder umrahmt; die Rechnung darunter wächst Produkt für
     Produkt (Plus-Zeile, Minus-Zeile, Ergebnis untereinander), am Ende stehen alle sechs Diagonalen dünn hinter den
     Zahlen. „Alles zeigen“ springt ans Ende, bei „Bewegung reduzieren“ gleich. Die Erklärung behält das Schema als
     Text (der freie Modus hat kein Bild).
10. **Gauß**, in zwei Teilen:
    - **10a (fertig, 13.11.2026):** Baustein „Gauß-Verfahren“ (`gauss`, Code 35, Gruppe „Gleichungssysteme“) in der Tätigkeit
      „Matrizen und Gleichungssysteme“, Stufen 1 bis 5, geführt und frei. Acht Arten: zwei Gleichungen mit zwei Unbekannten
      (Stufe 1), drei mal drei (Stufe 2; Stufe 3 auch über Kreuz wie $3 \cdot \text{II} - 2 \cdot \text{I}$), mit Zeilentausch
      und überbestimmt (Stufe 3), unterbestimmt, eine Gleichung bleibt (zwei Parameter) und Kommazahlen (Stufe 4), vier
      Unbekannte, unterbestimmt mit vier Unbekannten, Kommazahlen mit Tausch (Stufe 5). Jede Art in allen passenden Fällen
      (genau eine, keine, unendlich viele Lösungen). Schritte: Tabelle aus Gleichungen aufstellen (Glied rechts, Zahl links,
      andere Reihenfolge, fehlende Variable) oder Kommazahlen wegschaffen, je Spalte die ganze Tabelle nach den Umformungen
      (Umformung rechts daneben), Zeilen tauschen, Stufenform deuten, freie Variablen wählen, rückwärts einsetzen, Lösung als
      Vektor bzw. Lösungsmenge $\vec x = \vec p + t\,\vec r$. Frei: Vektor, „keine Lösung“ zum Antippen, Lösungsmenge in
      Kästchen (jede Darstellung derselben Menge zählt). Vier Lernkarten, 34 neue typische Fehler: Reihenfolge des
      Aufschreibens, Vorzeichen beim Rüberbringen (Variable, Zahl), fehlende Variable nicht als 0, Zeilen und Spalten
      vertauscht, rechte Seite nicht umgeformt, rechts das Vielfache vergessen, Vielfaches nur beim ersten Eintrag,
      Vorzeichenfehler beim Abziehen, beim Malnehmen nur die erste Zahl bzw. nur die Kommazahlen, bei 0 oben „keine Lösung“,
      Variable 0 gesetzt, Spalte übersprungen, keine bzw. unendlich viele Lösungen ohne Grund, 0 rechts als Widerspruch,
      Nullzeile als „unendlich viele“, Widerspruch als Wert gelesen, Widerspruch und Nullzeile verwechselt (beide Richtungen),
      freie Variable übersehen, weniger Stufen als Variablen als „keine Lösung“, Variable mit Stufe frei gewählt, keine bzw. zu viele frei, Vorzeichen beim Rüberbringen,
      nicht geteilt, Zahl vor der Variablen vergessen, falsch herum geteilt, abgezogen statt geteilt, Reihenfolge der
      Variablen, die 1 der freien Variablen vergessen, Stützvektor und Richtung vertauscht.
    - **10b (fertig, 13.11.2026):** Bilder bei zwei Unbekannten (jede Zeile eine Gerade) und drei Unbekannten (jede Zeile
      eine Ebene, zum Drehen), bei vier Unbekannten keins. Nach der Antwort in jedem Schritt „Nullen erzeugen“: die Zeilen
      in ihren Farben (I blau, II orange, III blaugrün); „Abspielen“ dreht jede umgeformte Gerade um ihren Schnittpunkt mit
      der Stufenzeile (Ebene um die Schnittgerade, gestrichelt) aus der alten Lage (blass gestrichelt) in die neue, die
      parallel zur Achse der weggefallenen Variablen liegt. „Typischen Fehler zeigen“: rechte Seite nicht mitgerechnet, die
      Gerade bzw. Ebene liegt parallel verschoben (rot) und geht nicht mehr durch den Schnitt. Wird eine Zeile zu $0 = c$,
      bleibt ihre alte Lage blass, die Beschreibung sagt „keine Gerade mehr“ (ohne die Antwort des nächsten Schritts zu
      verraten). Vor der Antwort kein Bild (es verriete sie), auch nicht im freien Modus. Beim Ergebnis (auch im freien
      Modus in der Rückmeldung): die Gleichungen nacheinander, dann die Lösung (Punkt $S$, Lösungsgerade violett, dieselbe
      Gerade bzw. Ebene); ohne Lösung nennt die Beschreibung den Grund (parallel, nicht alle durch einen Punkt mit grauen
      Schnittpunkten, parallele Schnittgeraden gestrichelt). Lernkarten: „Tabelle und Stufenform“ mit der Drehung, die
      übrigen mit dem Bild zum Ergebnis.
    - **10c (fertig, 14.11.2026; Wunsch des Nutzers):** Baustein „Einsetzen, Gleichsetzen,
      Addieren“ (`einsetzen`, Code 38, Gruppe „Gleichungssysteme“) in der Tätigkeit „Matrizen und Gleichungssysteme“, Stufen 1
      bis 5, geführt und frei. Die drei Schulverfahren Schritt für Schritt: **Einsetzen** (eine Gleichung nach einer
      Unbekannten auflösen, am besten nach der, die schon fast allein steht; in die andere einsetzen; lösen; zurückrechnen),
      **Gleichsetzen** (beide nach derselben Unbekannten auflösen, gleichsetzen, lösen, zurückrechnen), **Addieren** (so
      malnehmen, dass beim Addieren eine Unbekannte wegfällt). Manchmal die Frage „Welches Verfahren passt hier am besten?“
      (y steht schon allein: Einsetzen; beide nach y aufgelöst: Gleichsetzen; gleiche oder entgegengesetzte Zahlen: Addieren).
      Stufen: 1 zwei Gleichungen mit ganzen Zahlen, Verfahren vorgegeben, eine Unbekannte steht fast allein; 2 alle drei
      Verfahren, Zahlen vor den Unbekannten nicht 1, Lösung ganzzahlig; 3 Gleichungen erst ordnen (Klammern, Unbekannte auf
      beiden Seiten, Brüche wegschaffen), Lösung auch als Bruch, auch keine oder unendlich viele Lösungen ($0 = 5$, $0 = 0$);
      4 drei Gleichungen, die sich durch Einsetzen lösen lassen (eine mit nur zwei Unbekannten), oder Unbekannte im Nenner mit
      $u = \frac{1}{x}$; 5 alles ineinander, auch mit Parameter. Zahlen wie seit 11b nicht fast immer 1. Typische Fehler:
      Vorzeichen beim Auflösen, Klammer beim Einsetzen vergessen ($-2(3 - y) \to -6 - 2y$), nur eine Seite malgenommen,
      addiert statt abgezogen, zweite Unbekannte nicht ausgerechnet, $0 = 0$ als „keine Lösung“ gedeutet, in die eben
      umgeformte Gleichung zurückgesetzt (ergibt $0 = 0$). Bilder: jede Gleichung eine Gerade, Lösung als Schnittpunkt; beim
      Addieren dreht sich die neue Gerade durch den Schnittpunkt (wie 10b), bei keiner Lösung parallele Geraden. Frei: Lösung
      in Kästchen, „keine Lösung“ zum Antippen, Lösungsmenge. Lernkarten je Verfahren und „Welches Verfahren wann?“.
      **Umgesetzt:** sieben Arten (Einsetzen, Gleichsetzen, Addieren in Stufe 1 und 2, Stufe 2 in knapp der Hälfte mit
      „Welches Verfahren passt?“; Ordnen in Stufe 3 mit Gliedern auf beiden Seiten, Klammer $k(px + q)$ oder Brüchen, dazu
      etwa je ein Sechstel keine bzw. unendlich viele Lösungen; drei Gleichungen und Unbekannte im Nenner in Stufe 4 und 5,
      in Stufe 5 mit einer Gleichung zum Ordnen bzw. einem Bruch rechts; Parameter vor einer Unbekannten in Stufe 5:
      Addieren, Sonderwert, „Was gilt dort?“). Ergebnis als $x = \dots,\; y = \dots$, „keine Lösung“, Lösungsmenge oder
      $a = \dots$ mit Fall. Fünf Lernkarten (je Verfahren, „Welches Verfahren wann?“, „Drei Gleichungen, Nenner,
      Parameter“), 30 neue typische Fehler (`eqs-…`) und sieben aus dem Gauß-Verfahren (Rüberbringen, Teilen,
      Lösungsmenge). Bilder: nach dem Einsetzen, Gleichsetzen und Addieren dreht sich die neue Gerade durch den
      Schnittpunkt (wie 10b), beim Ergebnis Geraden mit Schnittpunkt, parallel oder gleich (bei drei Gleichungen Ebenen).
11. **Gleichungssysteme mit Parameter und Cramer**, in drei Teilen:
    - **11a (fertig, 13.11.2026):** Baustein „Cramersche Regel“ (`cramer`, Code 36, Gruppe „Gleichungssysteme“) in der
      Tätigkeit „Matrizen und Gleichungssysteme“, Stufen 1 bis 5, geführt und frei. Fünf Arten: $2 \times 2$ ganz (Stufe 1
      mit ganzen Zahlen, Stufe 2 auch mit Brüchen; $\det A$, $\det A_x$, $x$, $\det A_y$, Lösung als Vektor), $3 \times 3$
      nur eine Unbekannte (Stufe 2 und 3; Sarrus, „Welche Matrix ist $A_z$?“, Sarrus, Quotient), zwei Unbekannte mit Cramer
      und die dritte durch Einsetzen (Stufe 3 und 4), mit Parameter $a$ in der Matrix (Stufe 4 $2 \times 2$, Stufe 5 auch
      mit $\det A$ quadratisch): $\det A$ als Polynom, für welche $a$ anwendbar, $\det A_k$, die Unbekannte als Bruch in $a$,
      für welche $a$ es genau eine Lösung mit vorgegebenem Wert gibt; Stufe 5 $3 \times 3$ mit Parameter, in etwa der Hälfte
      mit einem Wert, bei dem $\det A = 0$ wäre und der wegfällt (Klausurfalle „durch einen Ausdruck geteilt, der 0 sein
      kann“). Bild beim Ergebnis ohne Parameter: Geraden bzw. Ebenen mit Schnittpunkt (aus Schritt 10b). Frei: Vektor,
      eine Zahl ($z = \frac{7}{3}$), $a = \dots$ bzw. zwei Lösungen in beliebiger Reihenfolge. Zwei Lernkarten, zehn neue
      typische Fehler: Zeile statt Spalte ersetzt, Spalte einer anderen Unbekannten, Bruch umgedreht, nicht durch
      $\det A$ geteilt, Bedingung umgedreht, $\det A = 0$ nicht geprüft, Wert mit $\det A = 0$ behalten, nur eine Lösung
      der quadratischen Gleichung, nur den Zähler gleich dem Wert gesetzt, Vorzeichen beim Auflösen nach $a$; dazu die
      Fehler bei $2 \times 2$ und Sarrus aus 9a und beim Einsetzen aus 10a.
    - **11b (fertig, 14.11.2026):** Baustein „Gleichungssysteme mit Parameter“ (`lgsparam`, Code 37, Gruppe
      „Gleichungssysteme“, Klausur jedes Jahr), Stufen 1 bis 5, geführt und frei. Zwei Wege: **Gauß mit Parameter** (die
      Stufen haben feste Zahlen, $a$ steht in der letzten Spalte und rechts; Nullen erzeugen mit den Einträgen in $a$, die
      letzte Zeile $q(a)\,z = s(a)$ deuten) und **Determinante zuerst** ($a$ irgendwo in der Matrix: $\det A$ als Polynom,
      jeden Sonderwert einsetzen und mit Gauß in Zahlen auf Stufenform bringen). Sechs Arten: $2 \times 2$ (Stufe 1 und 2),
      $3 \times 3$ (Stufe 2, ab Stufe 3 mit zwei Sonderwerten, $a^2$ in der Tabelle und Rang), Determinante zuerst (Stufe 3
      und 4), zweiter Parameter $b$ rechts (Stufe 4 und 5: für welche $a$ und $b$ unendlich viele), Unbekannte mit
      vorgegebenem Wert (Stufe 4 und 5, auch mit einem Sonderwert, der wegfällt), alle Fälle mit Lösungsmenge beim Sonderwert
      (Stufe 5). Schritte: Nullen erzeugen, „Für welche $a$ genau eine Lösung?“, Stufenform beim Sonderwert, Rang mit
      Folgerung, „Für welche $a$ keine bzw. unendlich viele Lösungen?“, $b$ beim Sonderwert, Wert vorgegeben, Lösungsmenge.
      Frei: $a = \dots$, zwei Werte, $a$ und $b$, Lösungsmenge in Kästchen. Drei Lernkarten, 23 neue typische Fehler:
      Bedingung umgedreht, Sonderfälle übersehen (durch einen Ausdruck mit $a$ geteilt), Nullstelle der rechten Seite,
      nur eine Lösung der quadratischen Gleichung, „für kein $a$“, Sonderwerte und übrige Werte verwechselt, sechs beim Rang (Widerspruchszeile bei $A$ gezählt, rechte
      Seite übersehen, verschiedene Ränge als lösbar, gleiche Ränge als genau eine Lösung, Nullzeile mitgezählt, Zeilen
      gezählt), vier beim Parameter rechts (Vorzeichen, nicht geteilt, für jedes $b$, für kein $b$), Wert behalten, der
      wegfällt, nur rechte Seite gleich dem Wert, Bruch umgedreht, allgemeine Formel auf den Sonderfall angewandt, beim Zeilentausch durch $a$ geteilt, mit $a$ malgenommen, Zahl für $a$
      eingesetzt; dazu die Fehler beim Nullen erzeugen und Deuten aus 10a.
      **Nachgeschärft (14.11.2026, Wunsch des Nutzers):** Zahlen nicht mehr fast immer 1 oben links (vorher 77–85 %, jetzt
      höchstens 30 %), Umformungen oft über Kreuz (auch mit $a$: $2 \cdot \text{III} + (a + 2) \cdot \text{I}$), $a$ auch
      vorne in der untersten Zeile oder in mehreren Zeilen; steht die Zeile mit $a$ oben, ist „nach unten tauschen“ der erste
      Schritt. Bei nur einem Sonderwert heißt die Frage „Was gilt dort?“ (vorher verriet „Für welche $a$ keine Lösung?“ die
      Antwort); frei: $a = \dots$ und die Auswahl. „Determinante zuerst“ schon ab Stufe 2 und auch in Stufe 5. Dasselbe für
      die Zahlen im Baustein „Gauß-Verfahren“ (10a).
    - **11c (fertig, 14.11.2026):** Bilder: Schieberegler für den Parameter (Geraden bzw. Ebenen bewegen sich, bei den Sonderwerten parallel
      oder gleich), Cramer als Flächen (2 × 2: $x$ ist das Verhältnis der Parallelogramme aus $\vec b, \vec a_2$ und
      $\vec a_1, \vec a_2$). **Umgesetzt:** Beim Ergebnis jeder Aufgabe mit Parameter $a$ (alle Arten von
      „Gleichungssysteme mit Parameter“, Cramer mit Parameter, „Einsetzen, Gleichsetzen, Addieren“ mit Parameter) ein
      Schieberegler: $a$ in Vierteln (bei großem Bereich Halben) von 3 unter bis 3 über den besonderen Stellen, die
      Sonderwerte und gesuchten Werte genau; je Stelle ein fertiges Bild im selben Ausschnitt. Start beim gesuchten Wert
      (bei Cramer und „Wert vorgegeben“ dort der Punkt $S$ in der Mitte, sonst beim ersten Sonderwert der Antwort). Unter dem
      Regler Knöpfe „$a = 3$ keine Lösung“ bzw. „$a = 4$ $y = 2$“. Die Beschreibung nennt je Stelle den Fall; läuft der
      Schnittpunkt weit weg, sagt sie „außerhalb des Bildes“. Mit zweitem Parameter $b$ steht $b$ fest beim gefundenen
      Wert. Kein Abspielen. Cramer als Flächen bei $2 \times 2$ ohne Parameter nach der Antwort zu $x$ und zur Lösung
      ($y$): Parallelogramm der Spalten (Fläche $|\det A|$), „Strecken und Scheren“: die Spalte der Unbekannten mit ihrem
      Wert gestreckt (grau), dann die Ecke parallel zur anderen Spalte bis $\vec b$ geschoben (blaugrün, Fläche
      $|\det A_k|$). Kein Bild bei Wert 0 oder wenn es breiter oder höher als 22 Einheiten würde (etwa ein Drittel der
      Aufgaben); auch auf der Lernkarte „Cramersche Regel“.
12. **Inverse und Matrizengleichungen:** 2×2 mit Formel, 3×3 mit Gauß-Jordan Zeile für Zeile, Matrizengleichung erst
    allgemein nach $X$ auflösen (wie beim Umstellen), dann ausrechnen. In drei Teilen:
    - **12a (fertig, 14.11.2026):** Baustein „Inverse Matrix“ (`inverse`, Code 39, neue Gruppe „Inverse und
      Matrizengleichungen“) in der Tätigkeit „Matrizen und Gleichungssysteme“, Stufen 1 bis 5, geführt und frei. Fünf Arten:
      $2 \times 2$ mit der Formel (Stufe 1 mit $|\det A| \le 2$, Stufe 2 mit Brüchen und in einem Fünftel nicht
      invertierbar), Gauß-Jordan (Stufe 2 $2 \times 2$ oder obere Dreiecksmatrix, Stufe 3 $3 \times 3$ mit Starttabelle,
      Stufe 4 und 5 auch mit Zeilentausch oder nicht invertierbar), Regeln (Stufe 3 bis 5: nur $A^{-1}$, $B^{-1}$ bzw. $A$
      gegeben, $(kAB)^{-1}$, $(A^{\mathsf T}B)^{-1}$, $(A^{-1}B)^{-1}$, $(kA^{\mathsf T})^{-1}$ …, ab Stufe 4 mit drei
      Besonderheiten und $3 \times 3$), Gleichungssystem über die Inverse (Stufe 3 $2 \times 2$: Ansatz, $\det A$, Inverse,
      $A^{-1}\vec b$; Stufe 4 $3 \times 3$ mit gegebener Inverse und zwei rechten Seiten, $X = A^{-1}(\vec b \;\; \vec c)$),
      mit Parameter (Stufe 4 $2 \times 2$, Stufe 5 $3 \times 3$ mit Sarrus: für welche $a$ invertierbar, dann $A^{-1}$ für
      einen Wert mit Formel bzw. Gauß-Jordan). Gauß-Jordan mit ganzen Zahlen: Spalte für Spalte Nullen unter der Diagonale
      (über Kreuz, wenn nötig), dann von rechts nach links darüber, zuletzt jede Zeile durch ihre Zahl auf der Diagonale
      („Diagonale auf 1, ablesen“). Bild bei $2 \times 2$ beim Ergebnis: „Rückgängig machen“ zieht das Parallelogramm der
      Spalten zurück aufs Einheitsquadrat, die Spalten $\vec s_1, \vec s_2$ von $A^{-1}$ erscheinen (nur bis 9 Einheiten
      Breite und Höhe). Frei: Matrix in Kästchen (auch Brüche), „nicht invertierbar“ zum Antippen, Vektor. Fünf Lernkarten,
      29 neue typische Fehler (`inv-…`): bei der Determinante nur die Hauptdiagonale, Kehrwert jedes Eintrags,
      Hauptdiagonale nicht getauscht, Minus an der falschen Diagonale, nicht durch bzw. mal $\det A$, Formel trotz
      $\det A = 0$, ohne Nullzeile für invertierbar gehalten, Nullmatrix als Inverse, wegen der rechten Seite für
      invertierbar gehalten, Nullzeile durch Tauschen wegschaffen, Starttabelle $(E \mid A)$, $(A \mid 0)$,
      $(A^{\mathsf T} \mid E)$, rechte Hälfte nicht mitgerechnet, bei einer 0 auf der Diagonale abgebrochen, Diagonale nicht
      auf 1, malgenommen statt geteilt, gespiegelt abgelesen, alles durch $\det A$ geteilt, $(AB)^{-1} = A^{-1}B^{-1}$,
      $(\lambda A)^{-1} = \lambda A^{-1}$, Transponieren vergessen, $(A^{-1})^{-1}$ nicht aufgehoben, von der falschen Seite
      malgenommen, mit $A$ statt $A^{-1}$, durch eine Matrix geteilt, Bedingung umgedreht, für jedes $a$; dazu Fehler aus
      Determinanten, Gauß-Verfahren und Matrizen rechnen.
    - **12b:** Baustein „Matrizengleichungen“ (`matgleichung`): erst allgemein nach $X$ auflösen, Schritt für Schritt wie
      beim Umstellen (Transponierte und Inverse mit den Regeln auflösen, $X$ auf eine Seite, Zahl als Vielfaches von $E$
      schreiben, $X$ links oder rechts ausklammern, von derselben Seite mit der Inversen malnehmen), dann einsetzen und
      ausrechnen; Stufe 5 mit Parameter (wann lösbar). Typische Fehler: „$A - 2$“ ohne $E$, auf der falschen Seite
      ausgeklammert oder malgenommen, durch eine Matrix geteilt, $AXA^{-1}$ zu $X$ gekürzt.
    - **12c:** Bilder: Gauß-Jordan zum Abspielen (links entsteht Schritt für Schritt $E$, rechts $A^{-1}$), bei
      Matrizengleichungen mit $2 \times 2$ die Wirkung von $X$ im Gitter.
13. **Abschluss:** Mischen über alle drei Tätigkeiten, Abwechslung gemessen, Prüfung aus mehreren Blickwinkeln, Doku.
    Dazu die Befunde der Durchsicht vom 14.11.2026 (docs/ROADMAP.md, „Vorgemerkt“): Gleichungssysteme mit Parameter
    auf Stufe 5 am Handy rechts abgeschnitten (Tabelle und $\vec b$, etwa jede 25. Aufgabe); große Vektorbilder auf
    eine Höhe begrenzen, bei der die Antworten noch zu sehen sind; Stufe 1 „in der Ebene“ passt nicht zu Kreuz- und
    Spatprodukt. Danach kommt M13 (Klausurmodus Mathe).

Größere Schritte (vor allem 1, 4, 10) werden bei Bedarf in Teile geteilt (1a, 1b …), damit jeder Teil schnell zum
Ausprobieren kommt.

## Fragen an den Nutzer

1. **Aussehen:** Passt der Stil im Entwurf? Was soll anders werden (Farben, Größe der Bilder, mehr oder weniger
   Bewegung)?
2. **Reihenfolge:** wie in der Vorlesung (Vektoren, Geraden und Ebenen, Matrizen, Determinanten, Gleichungssysteme).
   Falls die Klausur oder eine Übung etwas früher braucht, wird es vorgezogen.

Unterlagen braucht es für M7 vorerst nicht: Die Übersicht in docs/AUFGABENARTEN.md reicht. Wenn neue Übungsblätter zu
Geraden, Ebenen oder Matrizen dazukommen, ergänzt eine Sitzung die Übersicht.
