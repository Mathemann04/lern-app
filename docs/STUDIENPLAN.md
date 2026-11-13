# Studienplan: was das Modulhandbuch über die Fächer sagt

Stand: 13.11.2026. Der Nutzer hat am 13.11.2026 das **Modulhandbuch** des Studiengangs
Maschinenbau (Bachelor, THU, Fassung vom 09.11.2025, 155 Seiten) hochgeladen. Es ist öffentlich
auf der Seite der Hochschule abrufbar. Alle Pflichtmodule wurden gelesen, die Wahlpflichtmodule
nur überflogen. Hier steht in eigenen Worten, was für die App zählt: welche Fächer wann kommen,
wie geprüft wird, welche Themen das Handbuch nennt und **wo die App Lücken hat**. Namen von
Lehrenden stehen hier nicht.

**Rangfolge der Quellen:** Maßgeblich bleiben Skripte, Übungen und Altklausuren der Vorlesung
(docs/AUFGABENARTEN.md und die Dateien je Fach). Das Modulhandbuch ist nur der Rahmen: Es zeigt,
was in einem Fach vorkommen *darf*, und hilft, Lücken zu finden. Ein Thema, das nur im Handbuch
steht, kommt erst in die App, wenn Unterlagen der Vorlesung es bestätigen oder der Nutzer es will.

## Alle Pflichtmodule auf einen Blick

Jedes Modul hat 5 ECTS-Punkte (Ausnahmen: Praxissemester 28 + 2, Bachelorarbeit 15). Fast alle
werden mit einer **Klausur von 90 Minuten** geprüft.

| Semester | Modul | Prüfung | In der App |
| --- | --- | --- | --- |
| 1 | Mathematik 1 | Klausur 90 min, dazu ein Leistungsnachweis als Vorleistung | M1 bis M3, M6, M7, M9 |
| 1 | Physik 1 (**mit Chemie**) | Klausur 90 min, Vorleistung | Chemie: M4; Physik: M10 |
| 1 | Technische Mechanik 1: Statik | Klausur 90 min | M11 |
| 1 und 2 | Werkstoffkunde (mit Labor) | Klausur 90 min, Laborarbeit als Vorleistung | M5 |
| 1 | Konstruktion 1 | Klausur 90 min | **fehlt** (Vorschlag unten) |
| 1 | CAx 1 (CAD und Visualisieren) | Prüfung 30 min (Art nicht genannt) | **fehlt** (eignet sich nur zum Teil) |
| 2 | Mathematik 2 | Klausur 90 min | später |
| 2 | Physik 2 (mit Labor) | Klausur 90 min, Laborarbeit als Vorleistung | später |
| 2 | Technische Mechanik 2: Festigkeitslehre | Klausur 90 min | später |
| 2 | Konstruktion 2 | Klausur 90 min | später |
| 2 | CAx 2 (mit Präsentieren) | Klausur 90 min | eher nicht |
| 2 | Grundlagen der Informatik (Programmieren, z. B. Java) | sonstiger Leistungsnachweis | eher nicht |
| 3 | Mathematik 3, Technische Mechanik 3: Dynamik, Thermodynamik, Elektrotechnik/Messtechnik, Konstruktion 3, Betriebswirtschaftslehre | je Klausur 90 min | später |
| 4 | Regelungstechnik, Strömungslehre, Physikalisch-Technisches Labor | Klausur bzw. Labor | später |
| 4 oder 6 | Antriebstechnik, Automatisierungssysteme, Entwicklungsmethodik, Finite Elemente, KI-gestützte Datenanalyse, Konstruktion 4, Steuerungstechnik, Werkzeugmaschinen | meist Klausur 90 min | später |
| 5 | Praxisprojekt mit Ergänzung | Bericht, Referat | – |
| 6 | Projektarbeit | Bericht, Referat | – |
| 7 | Bachelorarbeit mit Seminar | Arbeit, Referat | – |

**Wichtig für die Reihenfolge der App:**
- **Chemie gehört zum Modul Physik 1.** Physik und Chemie zählen also zusammen zu einer
  Modulnote. Das passt zur Klausur in Teilen (docs/PLAN-M4.md).
- **Werkstoffkunde läuft über das 1. und 2. Semester.** Die Klausur liegt deshalb vermutlich
  erst am Ende des 2. Semesters. Das spricht dafür, M5 wie geplant nach Mathe, Physik und
  Mechanik zu bauen (Frage 2 unten).

## 1. Semester im Einzelnen

### Mathematik 1 (6 Stunden Vorlesung pro Woche)

Das Handbuch nennt diese Themen. Abgleich mit den Unterlagen (docs/AUFGABENARTEN.md) und der App:

| Thema laut Handbuch | Stand |
| --- | --- |
| Elementare Funktionen und Umkehrfunktionen (rational, trigonometrisch, Exponential-, Hyperbelfunktionen) | in Unterlagen und Plan (M6, M9) |
| **Kurven in Parameterdarstellung, Polarkoordinaten** | **neu**: in keiner Übersicht und in keinem Plan |
| Vektorrechnung (Skalar-, Vektor-, Spatprodukt, Zerlegung, lineare Unabhängigkeit, Basis) | in der App (M7) |
| Geraden und Ebenen, Schnitt- und Abstandsprobleme | in der App (M7) |
| Gleichungssysteme mit Gauß, Lösungsverhalten | geplant (M7, Schritte 10 und 11) |
| Matrizen und Determinanten, inverse Matrix, Matrizengleichungen, Entwicklungssatz | teils in der App, Rest geplant (M7, Schritt 12) |
| **Orthogonale Matrizen, Drehungen; lineare Abbildungen mit Matrizen** | **neu**: in keinem Plan (Matrix mal Vektor mit Bild gibt es seit M7 Schritt 8a) |
| Struktur eines Vektorraums | nur als Theorie für Lernkarten vermerkt |
| Grenzwerte von Folgen und Funktionen, Stetigkeit | geplant (M9) |
| Ableitungsregeln, höhere Ableitungen | in der App (M1, M6) |
| **Krümmung ebener Kurven** (Krümmungsmaß, nicht nur links/rechts gekrümmt) | **neu**: nur das Krümmungsverhalten der Kurvendiskussion ist geplant |
| Kurvenuntersuchung, Extremwertaufgaben | geplant (M9, „Funktion untersuchen“) |
| Taylorpolynom und Taylorreihe, Regeln von L'Hospital | geplant (M9) |
| **Newton-Verfahren für Nullstellen** | **neu**: geplant ist nur die Interpolation nach Newton |

Die vier neuen Themen kamen in der Klausur-Übersicht von docs/AUFGABENARTEN.md nicht vor. Kapitel 2
des Skripts fehlt aber noch in den Unterlagen; es könnte genau diese Themen enthalten (Frage 1
unten). Vorschlag, wohin sie gehören, falls sie drankommen:
- **Drehmatrizen und orthogonale Matrizen:** in M7 Schritt 12 (zu Inverse und Matrizengleichungen,
  denn bei orthogonalen Matrizen ist die Inverse die Transponierte). Bild: das Einheitsquadrat
  dreht sich, Längen und Winkel bleiben gleich.
- **Newton-Verfahren:** in M9, als Schritt-für-Schritt-Tabelle mit Bild (Tangente schneidet die
  x-Achse, der nächste Wert entsteht). Nutzt die Ableitungen aus M1.
- **Parameterkurven, Polarkoordinaten, Krümmung:** in M9 bei „Funktionen“ und mit den Bildern aus
  M6b (Punkt läuft die Kurve entlang, Krümmungskreis schmiegt sich an).

### Physik 1 mit Chemie (6 Stunden pro Woche, eine Klausur)

**Physik** laut Handbuch: Bewegungen (Kinematik), Newtons Gesetze, Gravitation, Arbeit, Energie,
Leistung, Impuls, elastische und unelastische Stöße, Rotation starrer Körper mit Drehmoment,
Massenträgheitsmoment und Drehimpuls; Schwingungen (frei und ungedämpft, gedämpft mit konstanter
und mit geschwindigkeitsabhängiger Dämpfung, erzwungen, Resonanz, gekoppelt).

Abgleich mit docs/PHYSIK.md: Kinematik, Würfe, Drehbewegungen und Kräfte sind gesichtet. Für die
zweite Hälfte fehlen noch Unterlagen: Arbeit, Energie, Leistung, Stöße, Schwingungen (schon
bekannt) und **neu laut Handbuch: Rotation starrer Körper mit Drehmoment,
Massenträgheitsmoment und Drehimpuls**. Wellen stehen in der Inhaltsübersicht der Vorlesung,
aber nicht im Handbuch.

**Chemie** laut Handbuch: Aufbau der Materie und Grundkräfte, Stöchiometrie, chemische Bindung,
Periodensystem, Säuren und Basen, amorphe Festkörper, Gläser, Keramik, Lösungen und ihre
Eigenschaften, Struktur und Eigenschaften.

Abgleich mit docs/AUFGABENARTEN-CHEMIE.md: Fast alles ist in der App oder geplant (Säuren und Basen
in N3). Nicht in den Unterlagen gesehen: **Gläser, Keramik als eigenes Thema und
Lösungseigenschaften** (z. B. Löslichkeit, Siede- und Gefrierpunkt von Lösungen). Umgekehrt steht
Redox und Elektrochemie in der Vorlesung, aber nicht im Handbuch. Es gilt die Vorlesung
(docs/CHEMIE.md); die Lücken kommen nur dazu, wenn ein Skript sie bestätigt (Frage 3 unten).

### Technische Mechanik 1: Statik

Laut Handbuch: Kraft und Axiome, Schnittprinzip, Freischneiden, Kräfte mit gemeinsamem
Angriffspunkt, allgemeine Kräftesysteme mit Moment, ebene Trag- und Fachwerke mit Lagern,
Gelenken und statischer Bestimmtheit, räumliche Statik, Schwerpunkte (Linie, Fläche, Volumen),
Schnittgrößen (Balken, Rahmen, gekrümmte Träger, zusammengesetzte Tragwerke, räumlich), Reibung
mit Haften, Gleiten und Seilreibung. Gleichungssysteme werden **von Hand** gelöst.

Abgleich mit docs/MECHANIK.md: alles schon in der Übersicht. Bestätigt: Seilreibung gehört dazu
(dort fehlte bisher eine Unterlage mit der Formel), und das Lösen von Gleichungssystemen von Hand
steht ausdrücklich im Inhalt des Moduls. Das stützt M7 Schritt 10 (Gauß) auch für Mechanik.

### Werkstoffkunde (1. und 2. Semester, mit Labor)

Laut Handbuch: Werkstoffgruppen, Aufbau und Eigenschaften, thermisch aktivierte Vorgänge,
Legierungen und Zustandsdiagramme, Eigenschaften gezielt beeinflussen, Stahl und Gusseisen
(Herstellung, Verarbeitung, Wärmebehandlung), Nichteisenmetalle, Werkstoffprüfung zerstörend und
zerstörungsfrei mit Demolabor, **Korrosion und Korrosionsschutz**, wahlweise Kunststoffe.

Abgleich mit docs/WERKSTOFFKUNDE.md: deckt sich mit den 15 Kapiteln der Vorlesung. Korrosion
steht im Handbuch als eigenes Thema; in der Kapitelliste der Vorlesung taucht sie nicht eigens
auf. Passt gut zu Redox aus Chemie (N4), sobald Unterlagen dazu da sind.

### Konstruktion 1 (noch nicht in der App)

Laut Handbuch: Überblick über die Fertigungsverfahren in Hauptgruppen (Urformen, Umformen,
Trennen, Fügen, Beschichten) mit Vor- und Nachteilen, Qualität und Wirtschaftlichkeit;
fertigungsgerechtes Gestalten je Verfahren (Gießen, Biegen, Fräsen, Drehen, Bohren, Schweißen,
Nieten, Schrauben, Lackieren); Grundzüge des technischen Zeichnens mit **Toleranzen, Passungen
und Oberflächenrauheit**. Klausur 90 Minuten.

Was davon in die App passt (Vorschlag, Entscheidung beim Nutzer):
- **Wissensfragen** wie in Chemie: Verfahren seiner Hauptgruppe zuordnen, Vor- und Nachteile,
  „Welches Verfahren passt zu diesem Bauteil?“, Gestaltungsregeln richtig oder falsch (mit selbst
  gezeichneten Bauteilen, z. B. Wanddicke beim Gießen, Radius beim Biegen).
- **Rechnungen** aus der Engine: Passungen (Höchst- und Mindestmaß, Höchst- und Mindestspiel bzw.
  Übermaß, Art der Passung bestimmen), Toleranzen addieren. Bild: Toleranzfelder von Bohrung und
  Welle als Balken.
- Dafür braucht es die Unterlagen der Vorlesung (Skript, Übungen, Altklausur).

### CAx 1 (noch nicht in der App)

Laut Handbuch: ein 3D-CAD-Programm bedienen, Teile und Baugruppen modellieren, Zeichnungen
ableiten; dazu Skizzieren, Projektionsmethoden und Grundregeln des technischen Zeichnens. Die
Bedienung des CAD-Programms lässt sich in der App nicht üben. **Räumliches Vorstellen** schon:
„Welche Ansicht gehört zu diesem Körper?“ (Vorder-, Seiten- und Draufsicht), mit der räumlichen
Ansicht aus M7. Das wäre eine Aufgabe ganz im Stil von Brilliant, aber eine Idee für später.

## 2. Semester (Vorschau)

| Modul | Themen laut Handbuch | Was die App schon kann |
| --- | --- | --- |
| Mathematik 2 | Integralrechnung (Regeln, Partialbrüche, partielle Integration, Substitution), Anwendungen (Flächen, Volumen, Bogenlänge, Rotationskörper, Schwerpunkte, Mittelwerte, Arbeit, Trägheitsmomente), uneigentliche und numerische Integrale, komplexe Zahlen mit Eulerformel, Fourierreihen und -transformation, Differentialgleichungen (Trennung der Veränderlichen, linear mit konstanten Koeffizienten, Schwingungen, Systeme, numerisch), Eigenwerte und Hauptachsentransformation | Partialbruchzerlegung und komplexe Zahlen (Brüche Stufe 5), Integrale beim Umstellen (Stufe 5), Ableiten als Grundlage; Matrizen aus M7 für Eigenwerte |
| Physik 2 | Wärmelehre (ideales Gas, Hauptsätze, Zustandsänderungen, Kreisprozesse, Entropie), Elektrizität (Feld, Potential, Kondensator, Ohm, Kirchhoff, Halbleiter), Magnetismus (Lorentzkraft, Induktion, Spule, Transformator); Labor mit Protokollen | Formeln umstellen mit Zeichen der Physik (M6 Schritt 4b-1, z. B. Plattenkondensator); Physik-Grundlage aus M10 |
| Technische Mechanik 2: Festigkeitslehre | Zug und Druck, Wärmedehnung, zulässige Spannung und Sicherheit, Kerbwirkung, Biegung mit Flächenmomenten, Schub, Torsion, Mohrscher Spannungskreis, Vergleichsspannung, Knicken nach Euler | baut auf M11 auf (Schnittgrößen, Schwerpunkte) |
| Konstruktion 2 | Federn, Schweiß-, Schraub-, Stift- und Nietverbindungen, Wellen und Achsen, Lager, Toleranzen und Passungen | Passungen aus dem Vorschlag zu Konstruktion 1 |
| CAx 2 | fortgeschrittenes CAD, technischer Bericht, Präsentieren | eher nichts für die App |
| Grundlagen der Informatik | Programmieren lernen (Java o. ä.), Zahlensysteme, einfache Algorithmen | höchstens Zahlensysteme (umrechnen) als kleines Thema |

## 3. Semester und später (nur Überblick)

- **Mathematik 3:** Laplace-Transformation, Funktionen mehrerer Veränderlicher (partielle
  Ableitungen, Gradient, Extremwerte mit Nebenbedingung, Fehlerrechnung), Mehrfach- und
  Linienintegrale.
- **Technische Mechanik 3: Dynamik:** Bewegung von Punkt und starrem Körper, Kinetik,
  Schwingungen.
- **Thermodynamik:** vertieft Physik 2 (Kreisprozesse wie Carnot, Otto, Diesel, Joule,
  Clausius-Rankine, offene Systeme, Enthalpie, Entropie, Dampf, Wärmepumpe).
- **Elektrotechnik/Messtechnik:** Gleich- und Wechselstrom mit komplexer Rechnung, Felder,
  Drehstrom, Messen im Labor.
- Wahlpflichtmodule mit Mathe-Bezug: „Angewandte Mathematik für Ingenieure“ (Numerik mit
  MATLAB) und „Höhere Mathematik“ (Theorie).

Die Engine der App (Terme, Ableiten, Umstellen, komplexe Zahlen, Matrizen) trägt viele dieser
Fächer mit. Ein eigener Meilenstein für das 2. Semester lohnt sich, sobald die Klausuren des
1. Semesters vorbei sind.

## Fragen an den Nutzer

1. **Mathe:** Kommen in der Vorlesung Parameterkurven, Polarkoordinaten, Drehmatrizen, das
   Krümmungsmaß oder das Newton-Verfahren dran? (Am besten Kapitel 2 des Skripts hochladen, das
   noch fehlt.)
2. **Werkstoffkunde:** Ist die Klausur am Ende des 1. oder erst des 2. Semesters? Danach richtet
   sich, wann M5 kommt.
3. **Chemie:** Kommen Gläser, Keramik oder Eigenschaften von Lösungen (Siede- und Gefrierpunkt,
   Löslichkeit) in Teil 2 der Chemie-Klausur dran?
4. **Konstruktion 1:** Soll das Fach in die App (Wissensfragen und Passungen rechnen)? Dann
   bitte die Unterlagen in einer eigenen Sitzung hochladen; danach entsteht eine Übersicht wie
   bei den anderen Fächern.
