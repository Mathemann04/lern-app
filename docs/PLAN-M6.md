# Plan für Meilenstein 6: Neue Struktur

Status: **ausführlicher Plan, Fragen beantwortet (12.11.2026)** (Entwurf vom
10.11.2026, ausgearbeitet am 12.11.2026). Gebaut wird nach dem Klausur-Sprint
von M4 und vor M12 (Nachschlagewerk), M6b und M5, damit die neuen Fächer
gleich in der neuen Struktur entstehen. Erst nach dem OK wird programmiert.

Der Nutzer hat den Entwurf als Bild (Design-Canvas „Rechenweg – neue Struktur
(Entwurf)“ mit Startseite, Mathe-Seite, der Seite „Gleichungen umstellen“ und
einer Aufgabe mit „Überspringen“). Die Abschnitte bis „Befunde der
Durchsicht“ beschreiben den Entwurf in Worten; „Teil A“ und „Teil B“ machen
daraus Schritte und Bauplan.

## Warum

- Die Stufe bedeutet heute zwei Dinge auf einmal: wie schwer eine Aufgabe ist
  und welcher Stoff dazukommt. Stufe 5 von „Brüche“ enthält komplexe Zahlen,
  Grenzwerte, Teleskopsummen und Hyperbelfunktionen; Stufe 5 von „Gleichungen
  umstellen“ Differentialgleichungen, Determinanten, Vektoren und mehr.
- Die Kacheln sagen deshalb nicht, was drinsteckt, und einzelne Themen
  (z. B. Determinanten) lassen sich nicht gezielt üben.
- Die Startseite ist voller blasser „kommt bald“-Kacheln.

## Grundprinzip: drei getrennte Fragen

1. **Was tust du?** Die Tätigkeit ist die Kachel. Mathe: „Vereinfachen“
   (Brüche und Terme kürzen, zusammenfassen, zerlegen), „Gleichungen
   umstellen“, „Ableiten“; später „Integrieren“.
2. **Womit?** Bausteine zum Ankreuzen. Vorschlag für „Gleichungen umstellen“,
   in Gruppen:
   - Grundlagen: Brüche, Wurzeln, Potenzen, Logarithmus, e-Funktion
   - Funktionen: Winkelfunktionen, Hyperbelfunktionen
   - Aus späteren Kapiteln: komplexe Zahlen, Vektoren, Determinanten, Summen
     und Reihen, Grenzwerte, Ableitungen, Integrale, Differentialgleichungen

   Jede Tätigkeit zeigt nur ihre passenden Bausteine; was dort nicht vorkommt
   (beim Ableiten z. B. Determinanten), erscheint nicht oder ausgegraut.
3. **Wie schwer?** Die Stufe heißt nur noch „wie verschachtelt“:
   1 Einstieg (ein Baustein, wenige Schritte), 2 Grundlagen (ein Baustein,
   mehrere Schritte), 3 Kombiniert (zwei Bausteine ineinander), 4 Klausur
   (mehrere verschachtelt), 5 Profi (alles ineinander, „kaum noch schwerer“).
   **Eine höhere Stufe bringt nie neuen Stoff.** Jeder Baustein braucht
   deshalb Aufgaben ab Stufe 1.

**Ein Thema gezielt üben** heißt: nur einen Baustein ankreuzen (Knopf „nur“
neben jedem Baustein). Eigene Themenseiten braucht es dafür nicht.

## Bedienung

- **Kein Kopf mehr:** Die Zeile mit Logo und „Rechenweg“ entfällt auf allen
  Seiten, ebenso jede Begrüßung („Was übst du heute?“). Am Laptop bleibt oben
  nur das Menü.
- **Startseite:** oben „Weitermachen“ (letzte Auswahl, Stufe, Modus), darunter
  **nur die Fächer** als große Kacheln mit Bild (Mathematik MB1, Chemie 1).
  Fächer, die noch fehlen (Werkstoffkunde, Physik, Technische Mechanik),
  stehen in **einer** Zeile „Demnächst“ statt in blassen Kacheln.
- **Seite eines Fachs:** erst hier erscheinen die Tätigkeiten. Mathe:
  „Vereinfachen“, „Gleichungen umstellen“, „Ableiten“ und „Mathe mischen“,
  darunter „Demnächst: Integrieren“. Chemie: ihre Gebiete wie bisher und
  „Themen mischen“.
- **Bilder** im bisherigen Stil (`AreaIcon.tsx`, Tonleiter je Bereich), je
  Fach und je Tätigkeit ein Bild und eine Farbe. Vorschlag aus dem Entwurf:
  Mathematik Kurve mit Tangente (blau), Chemie Atom (indigo), Vereinfachen
  Bruch-Kreis (orange), Gleichungen umstellen Waage (blau), Ableiten
  Steigungsdreieck (violett), Mischen Kärtchen mit Häkchen (blaugrün).
- **Seite einer Tätigkeit:**
  - „Was soll drankommen?“ mit Schnellwahl „Alle“, „Keine“, „Meine
    Schwächen“; Bausteine in Gruppen, je Baustein der Fortschritt in Prozent
    und der Knopf „nur“.
  - „Wie verschachtelt?“ mit den Stufen 1 bis 5 und einer Beispielaufgabe aus
    der aktuellen Auswahl.
  - „Geführt“ oder „Frei“, dann der Start-Knopf („Geführt üben · 3
    Bausteine“); ohne angekreuzten Baustein ist er gesperrt.
  - Link zu den Lernkarten der angekreuzten Bausteine.
  - Auswahl, Stufe und Modus werden je Tätigkeit gespeichert.
- **Fortschritt je Baustein:** Anteil ohne Fehler je Baustein. „Meine
  Schwächen“ kreuzt die Bausteine mit den meisten Fehlern an (aus der
  Fehlerstatistik, Fehlerregeln einem Baustein zugeordnet).
- **„Überspringen“** in jeder Aufgabe, geführt und frei (Wunsch des Nutzers,
  10.11.2026): ein Knopf unten im Lernbildschirm, der sofort die nächste
  Aufgabe zeigt, mit kurzem Hinweis „Aufgabe übersprungen“. Eine übersprungene
  Aufgabe zählt nicht als Fehler, nicht als gelöst und nicht für „8 von 10“;
  die Fehlerstatistik bleibt unberührt. Eine übersprungene Wissensfrage kommt
  später in derselben Runde wieder. Gilt auch beim Mischen und beim gezielten
  Üben.
- **Chemie** bleibt wie seit S1b (Thema → Unterthemen ankreuzen → Stufe,
  dazu „Themen mischen“). Die Auswahl-Teile von dort (`PartPicker.tsx`,
  `MixScreen.tsx`, `selection.ts`, `mix.ts`) werden für Mathe
  wiederverwendet, damit die App überall gleich funktioniert.

## Was technisch dafür nötig ist (ausgearbeitet in Teil B)

- **Schlagworte je Baustein** an Vorlagen, Kernen und Werkzeugen der
  Baukästen (Brüche, Umstellen, Ableiten). Eine Aufgabe wird nur aus den
  angekreuzten Bausteinen und der gewählten Verschachtelung gezogen.
- **Leichte Aufgaben je Baustein:** Determinanten, Vektoren, komplexe Zahlen,
  Reihen, Grenzwerte, Integrale und Differentialgleichungen stecken heute nur
  in Stufe 5. Die Rechenteile gibt es schon.
- **Keine leeren Kombinationen:** Test, dass jede Auswahl aus einem Baustein
  in jeder Stufe genug verschiedene Aufgaben liefert (Kennzahlen aus
  PLAN-M2b.md).
- **Nichts geht verloren:** alte Adressen und Aufgabennummern (z. B.
  `#/ueben/brueche/5-1234`) funktionieren weiter; Fortschritt,
  Fehlerstatistik und Einstellungen ziehen um (Speicher-Version erhöhen, mit
  Umzug wie bisher).
- Fehlerregeln, Lernkarten und „Gezielt üben“ je Baustein zuordnen.
- Schritte (Vorschlag, Reihenfolge im Plan festlegen): Kopf entfernen,
  Startseite mit Fächern und Fach-Seiten; „Überspringen“;
  Schlagworte und Auswahl für „Gleichungen umstellen“; dasselbe für
  „Vereinfachen“ und „Ableiten“; leichte Aufgaben je Baustein; Fortschritt je
  Baustein und „Meine Schwächen“.

## Offene Fragen

Sind jetzt in Teil A unter „Fragen an dich“ beantwortet oder gestellt.

## Befunde der Durchsicht (11.11.2026)

- Die Fach-Seite bekommt neben Üben, Lernkarten und Klausur einen Platz für
  „Nachschlagen“ (M12), damit das Nachschlagewerk ohne neuen Umbau dazukommt.
- „Fortschritt“ ist rund 16 Bildschirme lang (jede Stufe jedes Themas, Mathe
  zuerst, auch nie geübte). Neu: je Fach kurz, Geübtes zuerst, Einzelheiten
  erst beim Antippen. Den Klausur-Überblick für Chemie baut S11 schon vorher;
  M6 übernimmt ihn.
- Heute fällige Wiederholung sichtbar machen (S11) und in die neue Startseite
  übernehmen.
- Die Nummer der Aufgabe („Aufgabe 1-505136“) steht über jeder Aufgabe, wird
  aber nur für „Frage melden“ gebraucht: kleiner oder erst dort zeigen.

## Teil A: Was entsteht

### Bausteine je Tätigkeit (Vorschlag)

Ein Baustein ist ein Stück Stoff, z. B. „Wurzeln“ oder „Determinanten“.
**Immer erlaubt** und kein Baustein ist das Handwerkszeug jeder Aufgabe:
Klammern, Punkt vor Strich, mal und durch eine Zahl oder einen Buchstaben,
auf beide Seiten bringen (beim Umstellen „Schalen“ genannt). Die Stufe sagt,
wie viele Schalen und wie viele Bausteine ineinander stecken.

**Gleichungen umstellen** (heute Stufen 1 bis 5 mit allen Kernen):

| Gruppe | Bausteine |
| --- | --- |
| Grundlagen | Brüche (x im Nenner, Doppelbrüche), Wurzeln, Quadrate und Potenzen, e-Funktion und Potenzen mit anderer Basis, Logarithmus (auch lg und $\log_2$), Beträge (Fallunterscheidung, neu), quadratisch (pq-Formel, Substitution) |
| Funktionen | Winkelfunktionen (mit Umkehrfunktionen und Additionstheoremen), Hyperbelfunktionen |
| Aus späteren Kapiteln | Ableitungen, Integrale, Summen und Reihen, Grenzwerte, Differentialgleichungen, Determinanten, komplexe Zahlen, Vektoren |

**Vereinfachen** (heute „Brüche“):

| Gruppe | Bausteine |
| --- | --- |
| Zahlen | Zahlenbrüche (mit Dezimalzahlen) |
| Terme | Buchstaben in Produkten, Ausklammern und binomische Formeln, Zerlegen (Zahl vorn, in Gruppen, Polynomdivision, Horner-Schema), Doppelbrüche, dritte Potenzen |
| Gesetze (früher M8) | Potenzgesetze, Wurzelgesetze (Wurzeln als Potenzen, Nenner rational machen), Logarithmengesetze (als Summe schreiben, zu einem Logarithmus zusammenfassen) |
| Funktionen | Wurzeln, e-Funktion und Logarithmus, Winkelfunktionen, Hyperbelfunktionen |
| Aus späteren Kapiteln | Partialbruchzerlegung, Differenzenquotienten, Grenzwerte, Teleskopsummen, komplexe Zahlen |

**Ableiten** (zwei Gruppen; eine Aufgabe braucht aus beiden Gruppen nur
angekreuzte Bausteine):

| Gruppe | Bausteine |
| --- | --- |
| Funktionen | Potenzen und Wurzeln, e-Funktion, Logarithmus, Winkelfunktionen, Umkehrfunktionen (arcsin, arctan …), Hyperbelfunktionen |
| Regeln | Produktregel, Quotientenregel, Kettenregel, logarithmisch ableiten, implizit ableiten, zweite Ableitung |
| Schreibweise | andere Variable als $x$ (z. B. $t$) und Buchstaben als feste Größen (z. B. $\omega$, $\varphi$, $a$) |

Faktor- und Summenregel sind immer erlaubt (Handwerkszeug).

### Stufen: nur noch „wie verschachtelt“

| Stufe | Name (Vorschlag) | Umstellen | Vereinfachen | Ableiten |
| --- | --- | --- | --- | --- |
| 1 | Einstieg | ein Baustein, ein bis zwei Schalen | ein Baustein, kurz | eine Funktion, eine Regel |
| 2 | Grundlagen | ein Baustein, mehrere Schalen | ein Baustein, mehrere Teile | eine Regel, mehrere Funktionen |
| 3 | Kombiniert | zwei Bausteine ineinander oder nebeneinander | zwei Bausteine zusammen | zwei Regeln ineinander |
| 4 | Klausur | mehrere verschachtelt | mehrere verschachtelt | mehrere Regeln verschachtelt |
| 5 | Profi | alles ineinander, kaum noch schwerer | wie heute Stufe 5 | wie heute Stufe 5 |

Ist **nur ein** Baustein angekreuzt, steckt er in den Stufen 3 bis 5 in sich
selbst oder in mehr Schalen (z. B. Wurzel in Wurzel, Determinante mit einem
Bruch als Eintrag nur, wenn auch „Brüche“ angekreuzt ist). Eine Stufe bringt
nie Stoff, der nicht angekreuzt ist.

Heutige Aufgaben gehen nicht verloren: Die Aufgaben der heutigen Stufen
werden mit ihren Bausteinen beschriftet und in die passende neue Stufe
einsortiert. Neu gebaut werden nur die leichten Aufgaben für die Bausteine,
die es heute erst spät gibt.

### Schritte

Jeder Schritt lässt sich einzeln ausprobieren. Nach jedem Schritt: Tests,
Prüfung im Browser (Handy und Laptop, hell und dunkel), Pull Request.

#### Schritt 1: Aufgeräumte Startseite und Fach-Seiten

- Kopfzeile mit Logo und „Rechenweg“ und die Begrüßung entfallen; am Laptop
  bleibt oben nur das Menü.
- Startseite: oben „Weitermachen“, Probeklausur und fällige Wiederholung
  (aus S11), darunter nur die Fächer als große Kacheln mit Bild; fehlende
  Fächer in einer Zeile „Demnächst“.
- Neue Seite je Fach (`#/fach/mathe`, `#/fach/chemie`): Mathe zeigt vorerst
  die heutigen Gebiete und Themen, Chemie ihre Gebiete und „Themen mischen“;
  dazu Platz für „Lernkarten“, „Klausur“ und später „Nachschlagen“ (M12).
- Aufgabennummer klein unten statt groß über der Aufgabe.
- Fortschritt: je Fach kurz, Geübtes zuerst, Einzelheiten beim Antippen; der
  Klausur-Überblick aus S11 bleibt.
- Alte Adressen (`#/gebiet/…`, `#/thema/…`) funktionieren weiter.

#### Schritt 2: „Überspringen“

- Knopf „Überspringen“ unten in jeder Aufgabe (geführt und frei, Mathe und
  Chemie, auch beim Mischen, Wiederholen und gezielten Üben); kurzer Hinweis
  „Aufgabe übersprungen“, dann die nächste.
- Zählt nicht als Fehler, nicht als gelöst, nicht für „8 von 10“; die
  Fehlerstatistik bleibt unberührt. Eine übersprungene Wissensfrage kommt
  später in derselben Runde wieder. In Probeklausur und Klausuraufgaben gibt
  es den Knopf nicht (dort springt man schon heute).

#### Schritt 3: „Gleichungen umstellen“ mit Bausteinen (Grundgerüst)

- Mathe-Seite mit den Tätigkeiten als Kacheln: „Vereinfachen“, „Gleichungen
  umstellen“, „Ableiten“, „Mathe mischen“ (erst ab Schritt 8 spielbar),
  „Demnächst: Integrieren“. „Vereinfachen“ und „Ableiten“ führen bis zu ihren
  Schritten auf die heutigen Themenseiten.
- Seite „Gleichungen umstellen“: „Was soll drankommen?“ mit „Alle“, „Keine“,
  Bausteinen in Gruppen und Knopf „nur“; „Wie verschachtelt?“ mit Stufen 1
  bis 5 und einer Beispielaufgabe aus der Auswahl; „Geführt“ oder „Frei“;
  Start-Knopf („Geführt üben · 3 Bausteine“), ohne Auswahl gesperrt; Link zu
  den Lernkarten der angekreuzten Bausteine. Gespeichert je Tätigkeit.
- Die heutigen Aufgaben bekommen ihre Bausteine und neuen Stufen. Bausteine,
  die es heute erst ab Stufe 4 oder 5 gibt, sind in niedrigeren Stufen
  vorerst blass mit „erst ab Stufe 4“ (wie bei Chemie „erst ab
  Vertiefung“); die Schritte 4 und 5 füllen das auf.
- Alte Aufgabennummern (`#/ueben/umstellen/5-1234`) zeigen weiter genau
  dieselbe Aufgabe; Fortschritt und Fehlerstatistik ziehen um.

#### Schritt 4: Umstellen, leichte Aufgaben für Grundlagen und Funktionen

- Ab Stufe 1 einzeln übbar: e-Funktion, Logarithmus, quadratisch,
  Winkelfunktionen, Hyperbelfunktionen (heute erst ab Stufe 4).
- Test: jeder Baustein allein liefert in jeder Stufe genug verschiedene
  Aufgaben (Kennzahlen aus PLAN-M2b.md).
- Umgesetzt am 12.11.2026 für alle neun Bausteine aus „Grundlagen“ und
  „Funktionen“ in allen fünf Stufen (Einzelheiten in docs/ENTSCHEIDUNGEN.md).

#### Schritt 4b: Gleichungen wie auf den Übungsblättern (neu, Wunsch des Nutzers 12.11.2026)

Aus den Unterlagen der Vorlesung (Übersicht in [AUFGABENARTEN.md](AUFGABENARTEN.md)),
mit eigenen Zahlen und Buchstaben:
- **Gleichungen mit Zahlen lösen:** Ergebnis eine Zahl, mit Definitionsbereich
  und Probe; auch Scheinlösungen und „keine Lösung“ (Wurzel gleich negativer
  Zahl). Die Engine braucht dafür Gleichungen ohne Buchstaben und als Antwort
  „keine Lösung“.
- **Logarithmen auf beiden Seiten:** Zahl als Logarithmus schreiben, Faktor als
  Hochzahl, zusammenfassen, entlogarithmieren, danach linear oder quadratisch;
  verschiedene Basen über den Basiswechsel. Die Engine kann das heute noch nicht.
- **Formeln aus Technik und Physik** nach jeder Größe umstellen (eigene
  Formelsammlung: Schwingungsdauer von Pendel und Federpendel, Fallweg,
  Bewegungsenergie, Linsengleichung, Plattenkondensator, Reihen- und
  Parallelschaltung, Entladen eines Kondensators, Abkühlen); Größen mit ihren
  Zeichen, ohne Einheiten (mit Einheiten in M10).
- Alles einsortiert in die Bausteine (Logarithmus, Wurzeln, …); Tests wie in
  Schritt 4.
- In drei Teilen zum einzelnen Ausprobieren: **4b-1** Formeln aus Technik und
  Physik (fertig 12.11.2026: 27 Formeln, 48 Aufgaben, Nummern `formel.2-1`, Größen
  mit Index und griechische Buchstaben auch in der Eingabe), **4b-2** Logarithmen
  auf beiden Seiten (fertig 12.11.2026: neun Arten in Stufe 1 bis 4, Nummern `logeq.2-4711`, vier neue Schritte,
  Lernkarte „Logarithmen auf beiden Seiten“), **4b-3** Gleichungen mit Zahlen (fertig 12.11.2026: 14 Arten in Stufe 1
  bis 4 mit Nummern `zahlen.2-4711`, Wurzeln, Brüche mit verbotenem Wert, Logarithmen, $e^{2x}$ mit Substitution; Probe
  als eigene Frage, „keine Lösung“ geführt und frei mit eigenem Knopf; Lernkarte „Gleichungen mit Zahlen: Probe und
  keine Lösung“). Gleichungen mit zwei Lösungen (z. B. $x^2 = 9$) kommen noch nicht vor.

#### Schritt 4c: Ungerade Wurzeln aus negativen Zahlen (Entscheidung 12.11.2026)

Fertig 12.11.2026: $\sqrt[3]{-8} = -2$ wie im Skript, $x^{1/3}$ weiter nur für $x \ge 0$ (Engine, Normalform, Anzeige,
Zufallstests); neue Art „Hochzahl 3“ bei den Gleichungen mit Zahlen in Stufe 1 (Nummern wie `zahlen.1-5`), typischer
Fehler „Minus verloren“, Frage und Erklärung beim Ziehen der dritten Wurzel, Lernkarte „Dritte Wurzel und Hochzahl 3“.
Einzelheiten in docs/ENTSCHEIDUNGEN.md.

#### Schritt 5: Umstellen, leichte Aufgaben aus späteren Kapiteln (in Teilen)

- 5a: Ableitungen, Integrale, Summen und Reihen, Grenzwerte ab Stufe 1
  (z. B. $\frac{\mathrm{d}}{\mathrm{d}x}\left(x^2\right) = y$ nach $x$, dann mit einer Schale).
- 5b: Differentialgleichungen, Determinanten ab Stufe 1.
- 5c: komplexe Zahlen und Vektoren ab Stufe 1 (Betrag, Winkel, Länge,
  Skalarprodukt).
- 5d: Beträge (neu: zwei Fälle, mehrere Lösungen). Nach den Übungsblättern:
  ein oder zwei Beträge, Lösung eine Zahl, zwei Zahlen, leere Menge oder ein
  ganzer Bereich; geführt als Fallunterscheidung (Fallgrenzen, Bereiche, je
  Bereich ohne Betrag lösen, gegen den Bereich prüfen, vereinigen), dazu die
  Kandidaten-Methode; typische Fehler aus den Lösungen als Fehlerregeln
  (Fallgrenze bei 0, nur ersten Summanden negiert, Bereich nicht geprüft, Probe
  in der Fallgleichung, „immer wahr“ nicht als Bereich gedeutet, vier statt drei
  Bereiche); Liste in [AUFGABENARTEN.md](AUFGABENARTEN.md).
- Danach ist jeder Baustein in jeder Stufe übbar; „gezielt üben“ je
  Fehlerregel bleibt.

#### Schritt 6: „Vereinfachen“ mit Bausteinen

- Wie Schritt 3 für die heutigen „Brüche“, dazu die neuen Bausteine
  Potenz-, Wurzel- und Logarithmengesetze (früher M8) und leichte Aufgaben für
  Wurzeln, e-Funktion und Logarithmus, Winkel- und Hyperbelfunktionen,
  Partialbrüche, Differenzenquotienten, Grenzwerte, Teleskopsummen, komplexe
  Zahlen (heute nur in Stufe 5).
- Aus den Übungsblättern ([AUFGABENARTEN.md](AUFGABENARTEN.md)): Terme in die
  Form $a^x$ bringen, negative Hochzahlen beseitigen, Nenner rational machen
  (auch mit dem Gegenstück), Logarithmen aus zwei gegebenen Werten abschätzen,
  Basiswechsel, Doppelbrüche aus Formeln, quadratische Terme zerlegen (Vieta).

#### Schritt 7: „Ableiten“ mit Bausteinen

- Wie Schritt 3 für das heutige „Ableiten“, mit den Gruppen „Funktionen“
  und „Regeln“; leichte Aufgaben für Umkehr- und Hyperbelfunktionen,
  logarithmisch und implizit ableiten (heute nur in Stufe 5).
- Aus den Übungsblättern ([AUFGABENARTEN.md](AUFGABENARTEN.md)): Ableitung an
  einer Stelle mit Einheit deuten (z. B. Geschwindigkeit zu Beschleunigung),
  Differenzenquotient (h-Methode), höhere Ableitungen, Variable $t$,
  logarithmisch ableiten wie $f(x)^{g(x)}$.

#### Schritt 8: „Mathe mischen“

- Tätigkeiten und Bausteine quer durch Mathe ankreuzen, eine Stufe, Aufgaben
  kommen gemischt (wie „Themen mischen“ in Chemie).

#### Schritt 9: Fortschritt je Baustein und „Meine Schwächen“

- Je Baustein der Anteil ohne Fehler (in Prozent) neben dem Kästchen.
- „Meine Schwächen“ kreuzt die Bausteine mit den meisten Fehlern an (jede
  Fehlerregel gehört zu einem Baustein).
- Lernkarten und „Gezielt üben“ nach Bausteinen geordnet.

#### Schritt 10: Abschluss von M6

- Prüfung aus mehreren Blickwinkeln, Doku, alte Adressen ein letztes Mal
  durchgetestet.
- Klausur-Karte nur noch im Fach (Wunsch des Nutzers, 13.11.2026): Das ganze
  Feld „Chemie 1 · Klausur Teil 1“ (Wiederholen, Probeklausur,
  Klausur-Überblick) wandert von der Startseite auf die Seite des Fachs
  Chemie 1. Die Startseite zeigt dann nur „Weitermachen“ und die Fächer.

### Antworten des Nutzers (12.11.2026)

1. Bausteine: passen; abgeglichen mit dem Vorlesungsmaterial MB1 (Mitschrift
   und Übungsblätter, nicht im Repo). Daraus ergänzt: Beträge beim
   Umstellen, Logarithmen zu anderen Basen, Gesetze bei „Vereinfachen“,
   zweite Ableitung und Buchstaben als feste Größen beim Ableiten.
2. M7 und M8 werden Bausteine bzw. Tätigkeiten in dieser Struktur (ja).
3. Namen der Stufen: Einstieg, Grundlagen, Kombiniert, Klausur, Profi (ja).
4. Ableiten: Regeln ankreuzbar (ja).

**Weitere Themen der Vorlesung** (nicht Teil von M6, als „Demnächst“ auf der
Mathe-Seite und in docs/ROADMAP.md vorgemerkt): Grenzwerte berechnen (Folgen
für $n \to \infty$, Funktionen mit $\frac{0}{0}$), Polynome (Nullstellen,
Linearfaktoren, Horner-Schema, Interpolation), Funktionen (Verschieben und
Strecken, Schwingungen $A\sin(\omega t + \varphi)$), Linearisieren und
Tangenten, lineare Gleichungssysteme (Gauß), Vektoren rechnen (Länge,
Projektion, Kreuz- und Spatprodukt, Fläche, Linearkombination, Basis),
Matrizen multiplizieren, Mengen und Summenzeichen.

**Beträge** brauchen eine neue Fähigkeit der Engine (zwei Fälle, mehrere
Lösungen). Sie kommen deshalb als eigener Teil nach Schritt 5 (5d).

## Teil B: Technischer Bauplan

### Aufgaben aus Bausteinen (`src/engine/tasks/`)

Umgesetzt in Schritt 3 (12.11.2026, Einzelheiten in docs/ENTSCHEIDUNGEN.md): Die Bausteine liest die Engine an der
Aufgabe selbst ab (`rearrangeBlocks.ts`), ein Verzeichnis der Nummern mit ihren Bausteinen (`rearrangeIndex.ts`, erzeugt
von `scripts/rearrange-index.ts`) findet passende Aufgaben sofort. Die alten Nummern bleiben die einzigen; die neue
Nummer mit Baustein und der Speicher-Umzug kommen erst mit den neuen Aufgaben je Baustein in Schritt 4. Die Art
(„Geführt“/„Frei“) je Tätigkeit kommt mit „Mathe mischen“ (Schritt 8).

- Neue Liste der Bausteine je Tätigkeit `blocks.ts` (feste Ids wie
  `wurzel`, `det`, nie umbenennen; Titel ohne Formeln; Gruppe), ohne
  Engine-Abhängigkeit, damit die Seiten ohne Mathe-Engine laden.
- Jede Vorlage, jeder Kern und jedes Werkzeug der Baukästen bekommt
  Schlagworte (Bausteine). Eine Aufgabe trägt die Vereinigung der
  Schlagworte ihrer Teile. Ein Test vergleicht die Schlagworte mit dem
  Inhalt der Aufgabe (z. B. kein `\sqrt` ohne `wurzel`, kein `\det` ohne
  `det`).
- **Aufgabennummer mit Baustein:** `<baustein>.<stufe>-<startwert>`, z. B.
  `det.2-4711`. Der Baustein ist der Hauptbaustein der Aufgabe; Partner in
  den Stufen 3 bis 5 wählt der erste Zufallszug. `tagsOf(baustein, stufe,
  startwert)` sagt die Schlagworte vorab, ohne die Aufgabe zu bauen. Die App
  wählt den Hauptbaustein gewichtet aus der Auswahl und probiert Startwerte,
  bis alle Schlagworte angekreuzt sind und die Form frisch ist (wie
  `pickFresh`). So bleibt jede Nummer eindeutig, unabhängig von der Auswahl.
- **Alte Nummern** `<stufe>-<startwert>` bauen weiter die heutige Aufgabe
  (die heutigen Erzeuger bleiben unverändert erhalten); neu gezogene Aufgaben
  bekommen die neue Form.
- Heutige Aufgaben einsortieren: Die neuen Erzeuger je (Baustein, Stufe)
  rufen die heutigen Baukästen mit eingeschränkter Auswahl auf (z. B. nur
  Kerne mit `wurzel`, Anzahl der Schalen nach Stufe), statt sie zu kopieren.
- Abwechslung: Form je Baustein und Stufe (`forms.ts`), zuletzt gesehene
  Formen je Tätigkeit und Stufe; Kennzahlen-Test je Baustein allein und für
  „Alle“.

### Oberfläche (`src/ui/`)

- `routes.ts`: `#/fach/<fach>`, `#/taetigkeit/<id>` (Seite einer
  Tätigkeit), `#/ueben/<tätigkeit>/<nummer>` und `#/frei/…` mit der neuen
  Nummer; alte Adressen leiten weiter.
- `PartPicker.tsx` und `selection.ts` aus Chemie werden für Bausteine
  verwendet (Gruppen, „nur“, „Alle“, „Keine“, blass mit „erst ab Stufe N“);
  `MixScreen.tsx` und `mix.ts` für „Mathe mischen“.
- `catalog.ts`: Tätigkeiten statt Mathe-Gebiete, mit Bild und Farbe;
  Fächer mit Seite; Zeile „Demnächst“.
- `HomeScreen.tsx`, `MainNav.tsx`, `App.tsx`: Kopf weg, neue Startseite.
- „Überspringen“ in `src/ui/task/` (gemeinsam für geführt und frei).

### Speichern (`src/state/`)

- Speicher-Version 4 mit Umzug: Auswahl, Stufe und Modus je Tätigkeit;
  Fortschritt und Fehler je Aufgabe mit Tätigkeit und Bausteinen (alte
  Einträge bekommen ihre Bausteine aus der alten Nummer); „Weitermachen“
  zeigt auf die Tätigkeit.
- Übersprungene Aufgaben werden nicht gespeichert, nur die Runde der
  Wissensfragen merkt sie sich.

### Tests

- Jede Auswahl aus einem Baustein liefert in jeder Stufe genug verschiedene
  Aufgaben; jede Aufgabe enthält nur angekreuzte Bausteine.
- Schlagworte passen zum Inhalt; neue leichte Aufgaben mit numerischer
  Gegenprobe, falsche Optionen nie gleichwertig (wie bisher).
- Alte Nummern: Stichprobe von Nummern je Thema und Stufe baut dieselbe
  Aufgabe wie vorher (Abdruck vor dem Umbau gespeichert).
- Speicher-Umzug von Version 3 auf 4.
- Browser-Tests: Startseite, Fach-Seite, Tätigkeit ankreuzen und üben,
  Überspringen, alte Adressen.

### Risiken

- Größter Brocken sind die leichten Aufgaben je Baustein (Schritte 4 bis 7);
  Schritt 5 und 6 deshalb in Teilen.
- Die heutigen Baukästen sind auf Stufen gebaut; wo eine eingeschränkte
  Auswahl zu wenig Formen ergibt, braucht es eigene Kerne.

## Ausblick: M6b, Bilder in Mathe (direkt nach M6)

Wunsch des Nutzers vom 10.11.2026: wie bei Brilliant mehr mit Bildern lernen.
Da M6 jedem Baustein leichte Aufgaben gibt, bekommt er in M6b sein Bild:

- Gemeinsame Zeichen-Grundlage in `src/ui/` (SVG, Farben aus der Tonleiter,
  hell und dunkel): Koordinatensystem, Graph, Tangente, Fläche, Pfeile,
  Einheitskreis, Zahlenebene.
- Je Baustein ein Bild in Aufgaben und auf Lernkarten: Graph bei e-Funktion
  und Logarithmus, Tangente am Graphen beim Ableiten, Fläche beim Integral,
  Einheitskreis bei Winkelfunktionen, Pfeile bei Vektoren, Zahlenebene bei
  komplexen Zahlen.
- Neue Aufgabenart „Welcher Graph gehört zur Funktion?“ (Bilder als
  Antworten, falsche aus typischen Fehlern).
- Die Engine rechnet jedes Bild aus der Aufgabe; Tests prüfen, dass Bild und
  Aufgabe zusammenpassen (z. B. Punkte des Graphen gegen die Funktion).
- Später: Bilder zum Anfassen (Punkt verschieben, Steigung sehen).
