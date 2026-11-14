# Plan für Meilenstein 13: Klausurmodus Mathematik 1

Status: **Entwurf, wartet auf das OK des Nutzers** (14.11.2026).

Entwurf zum Ansehen und Anfassen (privat, nur für den Nutzer):
https://claude.ai/artifact/8tnuyMe7BEYgd4oVXjKwFU. Er zeigt die Klausur-Karte,
den Klausur-Überblick, eine Klausuraufgabe auf dem Aufgabenblatt, „Rechenweg vergleichen“ mit Punkten, die Auswertung
einer Probeklausur und vier Bilder der neuen Bausteine. Die Seite ist nicht im Repo, weil sie nur ein Muster ist; die
App baut alles neu aus der Engine.

## Warum

- Wunsch des Nutzers (14.11.2026): „Der wichtigste Punkt ist ein adäquater Klausurmodus für Mathematik.“
- Die echte Klausur ist seit Jahren gleich gebaut (docs/AUFGABENARTEN.md, „Die Klausur: Aufbau und Gewicht“): 90 Minuten,
  100 Punkte, ohne Taschenrechner, ein Ergebnis ohne Rechenweg gibt keine Punkte, Kontrollwerte stehen oft dabei.
  Sie besteht aus 13 Bausteinen; elf kommen jedes Jahr, zwei fast jedes Jahr.
- Die Hälfte (lineare Algebra) ist mit M7 fertig, die andere Hälfte (Analysis) fehlt fast ganz. Die App übt heute
  einzelne Schritte, aber nie eine ganze Klausuraufgabe so, wie sie auf dem Blatt steht.

## Grundprinzip

1. **Auf Papier rechnen wie in der Klausur.** Die Klausuraufgabe steht wie auf dem Aufgabenblatt da: Ausgangslage,
   Teilaufgaben a, b, c mit Punkten, Kontrollwerte. Du rechnest auf Papier, ohne Taschenrechner.
2. **Rechenweg vergleichen und Punkte vergeben.** Danach zeigt die App die Musterlösung Schritt für Schritt, jeder
   Schritt mit seinen Punkten (Bewertungsschema der App). Du hakst ab: „Hab ich so“, „Folgefehler“ (mit einem falschen
   Wert von vorher richtig weitergerechnet) oder „Fehlt oder falsch“. So lernst du, dass ein Ergebnis ohne Rechenweg
   kaum Punkte bringt: Das Endergebnis allein ist nur ein kleiner Teil der Punkte.
3. **Die App prüft, wo sie kann.** Ergebnisse und Zwischenergebnisse kannst du eintippen (Mathe-Tastatur wie im freien
   Modus). Die Engine prüft sie mathematisch und setzt den Haken selbst. Passt dein Wert zu einem typischen Fehler,
   sagt sie welcher („Dein Ergebnis passt zu: Vorzeichen beim Zeilentausch vergessen“) und zeigt „Warum ist das falsch?“.
4. **Hilfe beim Üben, nicht in der Probeklausur.** Kommst du nicht weiter, öffnet „Ich komme nicht weiter“ den Teil als
   geführte Aufgabe (Schritte mit Auswahl wie heute). Ein so gelöster Teil zählt beim Üben höchstens halb.
5. **Erkannte Fehler zählen.** Was du als „Fehlt oder falsch“ markierst, kannst du einem typischen Fehler zuordnen
   (Auswahl aus den Fehlern dieses Schritts oder „Anderer Fehler“). Das fließt in die Fehlerstatistik, und der Teil
   kommt in die Wiederholung (mit neuen Zahlen).

**Nichts wird aus den Themen genommen** (Wunsch des Nutzers): Alle Tätigkeiten, Bausteine und Stufen bleiben, auch Stoff,
der nie in der Klausur kommt. Was Klausurstoff ist, zeigt nur der Klausurmodus.

## Die Klausur-Karte

Auf der Seite von Mathematik MB1 ganz oben (wie bei Chemie 1, Wunsch des Nutzers vom 13.11.2026: die Klausur-Karte
gehört ins Fach, nicht auf die Startseite), im Blaugrün der App:

| Kachel | Inhalt |
| --- | --- |
| Wiederholen | fällige Klausurteile und Aufgaben über alle Mathe-Tätigkeiten; sonst dezent „nichts fällig“ |
| Probeklausur | „90 Minuten, 100 Punkte“, läuft eine: „Nr. 12 läuft: weiterschreiben“, sonst das letzte Ergebnis |
| Klausur-Überblick | „Wie sicher je Baustein“ |

## Klausur-Überblick

Je Baustein eine Zeile, geordnet wie in der Klausur (erst Analysis, dann lineare Algebra):

| Baustein | in der Klausur | Punkte | Üben in der App |
| --- | --- | --- | --- |
| Gebrochen-rationale Funktion untersuchen | 9 von 9 | 9–12 | Tätigkeit „Funktion untersuchen“ (neu) |
| Funktion aus einem Graphen ablesen | 7 von 9 | 4–5 | Tätigkeit „Funktionen“ (neu) |
| Umkehrfunktion mit Definitions- und Wertebereich | 5 von 9 | 3–5 | Tätigkeit „Funktionen“ (neu) |
| Drei verschachtelte Ableitungen | 9 von 9 | 9–10 | „Ableiten“ (nachgeschärft) |
| Tangenten | 9 von 9 | 4–8 | Tätigkeit „Funktion untersuchen“ (neu) |
| Kurvendiskussion mit e oder ln | 9 von 9 | 11–15 | Tätigkeit „Funktion untersuchen“ (neu) |
| Grenzwert mit L'Hospital | 9 von 9 | 4 | Tätigkeit „Grenzwerte“ (neu) |
| Inverse einer 3×3-Matrix | 9 von 9 | 6–7 | „Matrizen und Gleichungssysteme“, Inverse Matrix |
| Vektoren mit Parameter | 9 von 9 | 9–12 | „Vektoren“ |
| Lineares Gleichungssystem mit Parameter | 9 von 9 | 7–11 | „Matrizen und Gleichungssysteme“ |
| Geraden und Ebenen | 9 von 9 | 5–12 | „Geraden und Ebenen“ |
| Matrizen („Welche Ausdrücke sind definiert?“, Matrizengleichung) | 9 von 9 | 8–12 | „Matrizen und Gleichungssysteme“ |
| Determinante mit Parameter | 9 von 9 | 6–7 | „Matrizen und Gleichungssysteme“, Determinanten |

Jede Zeile zeigt außerdem, **wie sicher** du bist (aus den letzten drei Versuchen, wie bei Chemie: noch nicht geübt,
unsicher, fast sicher, sicher) und hat zwei Knöpfe: „Klausuraufgabe üben“ und „Bausteine üben“ (springt zur Tätigkeit
mit den passenden Bausteinen angekreuzt, Stufe 4). Bausteine, die in der App noch fehlen, stehen grau mit „kommt noch“
da. Oben eine Zeile mit der letzten und der besten Probeklausur.

## Eine Klausuraufgabe üben

Ablauf (im Entwurf zum Anklicken):

1. **Aufgabenblatt:** Titel mit Punkten („Aufgabe 9 · Determinante mit Parameter · 7 Punkte“), Ausgangslage mit Formeln,
   Teilaufgaben a, b, c … mit Punkten, wo die Klausur es tut ein Kontrollwert („Zur Kontrolle: $\det A = 2(a - 1)(a + 3)$“).
   Hinweis „Ohne Taschenrechner. Rechne auf Papier.“ Jede Aufgabe hat eine Nummer zum Wiederholen.
2. **Rechnen:** Je Teil ein Feld „Ergebnis eintippen (freiwillig)“. Unten der Knopf „Rechenweg vergleichen“.
3. **Vergleichen:** Je Teil die Schritte der Musterlösung mit Punkten, z. B. bei der Inversen: Tabelle $(A \mid E)$
   aufgestellt (0,5 P.), erste Spalte (1,5 P.), zweite Spalte (1,5 P.), dritte Spalte (1,5 P.), Inverse abgelesen (0,5 P.),
   Probe (0,5 P.). Je Schritt die drei Knöpfe. Eingetippte Werte sind schon geprüft. Bei „Fehlt oder falsch“ klappt
   „Was ist passiert?“ auf (typische Fehler dieses Schritts zum Antippen, mit Erklärung und Lernkarte).
4. **Ergebnis:** Punkte je Teil und gesamt, „Das solltest du üben“ (Bausteine mit verlorenen Punkten), „Neue Aufgabe
   dieser Art“.

**Bewertungsschema:** Punkte je Schritt nach dem Schema der App (geschätzt nach den Punkten der Altklausuren, wie bei
Chemie: „Punkte nach dem Schema der App, Teilpunkte geschätzt“). Folgefehler zählen nicht doppelt, auch über Teile hinweg.
Ein Endergebnis ohne die Schritte davor gibt höchstens die Punkte des letzten Schritts.

**Kontrollwerte:** wie in der Klausur bei $f'$, $f''$, der Determinante mit Parameter und ähnlichen Zwischenergebnissen.
Steht ein Kontrollwert da, rechnet der nächste Teil mit ihm weiter; „zeigen Sie“-Teile (z. B. „Zeigen Sie, dass
$f'(x) = \ldots$“) gibt es wie in der Klausur.

**Abwechslung:** Klausuraufgaben setzen sich aus den Baukästen der Tätigkeiten zusammen. Welche Teile eine Aufgabe hat,
wechselt wie in den Altklausuren (z. B. bei „Vektoren mit Parameter“ aus Winkel, Vektor gegebener Länge senkrecht zu
zwei Vektoren, Dreiecksfläche, spitz oder stumpf je nach Parameter, komplanar, Volumen mit zwei Lösungen, Projektion).
Die App merkt sich die letzten Formen; ein Test misst die Abwechslung je Baustein (Kennzahlen aus docs/PLAN-M2b.md).

## Probeklausur

- **Deckblatt** wie in der echten Klausur: 90 Minuten, 100 Punkte, Hilfsmittel Formelsammlung und fünf eigene Blätter,
  kein Taschenrechner. Uhr läuft rückwärts, „Ohne Zeitdruck“ wählbar, Stand bleibt beim Neuladen erhalten, das Hauptmenü
  ist ausgeblendet (alles wie bei Chemie).
- **Aufbau:** die elf Bausteine, die jedes Jahr kommen, dazu „Graph ablesen“ (in etwa 7 von 9 Probeklausuren) und
  „Umkehrfunktion“ (in etwa 5 von 9). Die Punkte je Aufgabe liegen in den Spannen der Altklausuren und ergeben zusammen
  genau 100. Kleine Bausteine dürfen wie in der Klausur zusammen in einer Aufgabe stehen (z. B. Inverse als Teil der
  Matrizen-Aufgabe), so sind es 10 bis 12 Aufgaben. Was in den letzten drei Probeklausuren vorkam, wird gemieden.
- **Teil-Probeklausuren** (Vorschlag): „Nur lineare Algebra“ und „Nur Analysis“, je 45 Minuten und etwa 50 Punkte.
  „Nur lineare Algebra“ geht sofort nach Schritt 2 (die Bausteine sind alle da), die ganze Klausur ab Schritt 9.
- **Während der Klausur:** Aufgabenblatt mit allen Aufgaben, frei springen, Ergebnisse eintippen (freiwillig),
  Formelsammlung aus den Lernkarten. Keine Rückmeldung, keine Hilfe.
- **Korrektur nach der Abgabe:** wie beim Üben (Rechenweg vergleichen, abhaken), eingetippte Ergebnisse sind schon
  geprüft. Eine eingetippte Zahl knapp daneben gibt es in Mathe nicht: Alles ist exakt.
- **Auswertung:** Punkte je Aufgabe und Baustein, Balken je Baustein, „Für eine 1,0 braucht es etwa 90 Punkte“ (aus den
  Altklausuren); eine Note nur, wenn der Notenschlüssel bekannt ist. „Das solltest du üben“ mit den drei Bausteinen mit
  den meisten verlorenen Punkten (Knöpfe „Klausuraufgabe üben“ und „Bausteine üben“). Teile mit verlorenen Punkten kommen
  in die Wiederholung. Ergebnisse bleiben gespeichert (Verlauf).

## Neue Tätigkeiten und Bausteine

Wie in M6 und M7: jede Tätigkeit als Kachel mit Farbe und Bild, Bausteine zum Ankreuzen, fünf Stufen (Stufe = nur
Verschachtelung, nie neuer Stoff), geführt und frei, Lernkarten, Fehlerregeln mit Texten, Bilder von Anfang an.
Farben (Vorschlag wie im Entwurf): „Grenzwerte“ himmelblau, „Funktionen“ pink, „Funktion untersuchen“ fuchsia.

### Tätigkeit „Grenzwerte“ (neu, Gebiet Differentialrechnung)

| Baustein | Inhalt |
| --- | --- |
| Einsetzen und Kürzen | erst einsetzen, Art bestimmen ($\frac{0}{0}$, $\frac{c}{0}$, Zahl); kürzen, mit dem Gegenstück erweitern |
| L'Hospital | nur bei $\frac{0}{0}$ oder $\frac{\infty}{\infty}$, Zähler und Nenner getrennt ableiten, mehrfach, Stelle auch ungleich 0 (z. B. $\tan(\pi x)$ bei $x \to 1$) |
| Produkte und Differenzen | $0 \cdot \infty$ als Bruch (geschickt wählen), $\infty - \infty$ auf einen Nenner |
| Einseitig | $\frac{c}{0}$ mit Vorzeichen von links und rechts, Grenzwert existiert nicht |

Stufen: 1 einsetzen oder einmal L'Hospital; 2 mit Kettenregel, $\frac{\infty}{\infty}$, Stelle ungleich 0; 3 zweimal,
einseitig, $0 \cdot \infty$; 4 wie in der Klausur; 5 alles ineinander, Parameter so wählen, dass der Grenzwert existiert,
$1^\infty$ über $e^{\ldots}$. Grenzwerte für $n \to \infty$ bleiben in M9.

**Bild „Hineinzoomen“:** Zähler und Nenner als zwei Graphen. Beim Abspielen zoomt das Bild auf die Stelle $x_0$, beide
Kurven werden fast zu Geraden, ihre Steigungen erscheinen; der Grenzwert ist das Verhältnis der Steigungen. „Typischen
Fehler zeigen“: L'Hospital ohne $\frac{0}{0}$ (die Kurven treffen sich nicht in einem Punkt der Achse, rot).

### „Ableiten“ nachgeschärft (M6 Schritt 7 wird vorgezogen)

M6 Schritt 7 („Ableiten“ mit Bausteinen) kommt in M13, weil „Ableiten“ ohnehin umgebaut wird; so wird es nur einmal
angefasst. Bausteine wie in docs/PLAN-M6.md (Funktionen: Potenzen und Wurzeln, e-Funktion, Logarithmus, Winkelfunktionen,
Umkehrfunktionen, Hyperbelfunktionen; Regeln: Produkt, Quotient, Kette, logarithmisch, implizit, zweite Ableitung).
Neu und nachgeschärft:
- **Fallen wie in der Klausur** in allen Stufen ab 3: Konstanten wie $\ln 3$, $\pi^2$, $e^{\pi}$, $\arctan\sqrt{\pi}$
  (Ableitung 0, Faktor bleibt), $x^{e}$, $\sin(x^2)$ neben $\sin^2 x$, $\tan' = 1 + \tan^2$, vorher umformen (Wurzeln als
  Potenzen, ln zerlegen, $\ln(e^{\ldots})$ vereinfachen).
- **Bessere falsche Antworten:** aus der Durchsicht vom 14.11.2026 waren sie zu leicht (z. B. Summen- und Quotientenregel
  bei $(\ln x)^2$). Jede falsche Antwort kommt aus einem typischen Fehler, der an genau dieser Stelle passieren kann.
- **Klausurformat:** „Bestimmen Sie die Ableitungen. Vereinfachen ist nicht verlangt.“ mit drei Funktionen (a, b, c).
- **Bild „Tangente und Steigung“:** Graph von $f$ mit einer Tangente, die entlang läuft; darunter wächst der Graph von
  $f'$ mit (Steigung der Tangente = Wert von $f'$). Nach der Antwort: Graph deiner Ableitung daneben, bei einem Fehler
  rot, wo sie nicht passt.

### Tätigkeit „Funktionen“ (neu, Gebiet Funktionen)

| Baustein | Inhalt |
| --- | --- |
| Definitionsbereich und Wertemenge | Bedingungen aufschreiben (Nenner, Wurzel, ln), Ungleichungen lösen, schneiden; Wertemenge über Asymptoten, Monotonie oder den ausgeschlossenen Wert der Umkehrfunktion |
| Umkehrfunktion | umkehrbar (streng monoton, auch zeigen), nach $x$ auflösen, $x$ und $y$ tauschen, Definitions- und Wertebereich tauschen; auch mit Parameter; Funktionen wie $\frac{c}{a + b\,e^{\pm x}}$ und $\ln(\ldots)$; Skizze durch Verschieben und Spiegeln |
| Graph ablesen | Schwingung $A\cos(\omega x + \varphi) + b$: Ruhelage, Amplitude, Periode, Kreisfrequenz, Phasenwinkel, Laufzeitdifferenz; auch $r\arctan(x - a) + b$ |

Stufen: 1 ein Wert (Amplitude, Ruhelage, Definitionsbereich einer Wurzel); 2 Periode und $\omega$, Umkehrfunktion mit e
oder ln; 3 Phasenwinkel und Laufzeitdifferenz, Umkehrfunktion mit Bruch; 4 wie in der Klausur (ganze Schwingung, mit
Parameter, Monotonie zeigen, Skizze); 5 verschachtelt (Sinus- und Kosinusform ineinander, Wertemenge über die
Umkehrfunktion, $\arctan$-Graph mit Parameter). Die Umkehrfunktion nutzt die Umstell-Engine (M3, M6 Schritt 4b).

**Bilder:** Bei „Graph ablesen“ ist der Graph die Aufgabe. Nach den Antworten erscheinen Ruhelage, Amplitude und Periode als
farbige Maße; „Abspielen“ baut die Kurve aus $\cos x$ auf (strecken, stauchen, verschieben, heben), Schritt für Schritt.
„Typischen Fehler zeigen“: um $\varphi$ statt um $\frac{\varphi}{\omega}$ verschoben (rot). Bei der Umkehrfunktion
spiegelt sich der Graph beim Abspielen an $y = x$; Definitions- und Wertebereich stehen als farbige Balken an den Achsen
und tauschen die Achse.

### Tätigkeit „Funktion untersuchen“ (neu, Gebiet Differentialrechnung)

Zwei Gruppen wie bei „Ableiten“; eine Aufgabe braucht aus beiden Gruppen nur angekreuzte Bausteine:

| Gruppe | Bausteine |
| --- | --- |
| Funktionen | gebrochen-rational, mit e-Funktion, mit ln, Polynome |
| Fragen | Definitionsbereich und Lücken (hebbar oder Pol mit Ordnung), Nullstellen mit Ordnung, Asymptoten und Randverhalten (auch schräg mit Polynomdivision, mit Begründung), Vorzeichen (Vorzeichenschema mit Nullstellen und Polen), Monotonie und Extrema, Krümmung und Wendepunkte, Wertemenge, Tangenten (waagrecht mit Art des Extremums, durch einen Punkt außerhalb, parallele Tangenten zweier Funktionen, Parameter so wählen), Skizze (passenden Graphen wählen) |

Stufen: 1 ein Merkmal an einer einfachen Funktion; 2 ein Merkmal mit mehreren Schritten (zerlegen, kürzen, Ordnung);
3 zwei Merkmale zusammen (Asymptote und Vorzeichen, Monotonie und Krümmung, waagrechte Tangente mit Art); 4 die ganze
Untersuchung wie in der Klausur (verkleideter Nenner, versteckter gemeinsamer Faktor, Randverhalten mit Begründung,
$f'$ nachweisen, Tangente durch einen Punkt außerhalb); 5 mit Parameter, globale Extrema mit Randwerten, Wendepunkte über
$u = e^x$, Funktion zu gegebenen Polen, Nullstellen und Asymptoten bauen.

**Bilder:** Der Graph entsteht mit der Untersuchung: Nach jeder Antwort kommt das Merkmal ins Bild (Pol als gestrichelte
Senkrechte, hebbare Lücke als Kringel, Nullstellen, Asymptote, Extrema, Wendepunkte); zum Schluss die ganze Kurve.
„Herauszoomen“ zeigt, wie sich die Kurve an die schräge Asymptote schmiegt. Das Vorzeichenschema liegt unter dem
Graphen, seine Felder färben die Kurve (über oder unter der Achse). Bei der Kurvendiskussion stehen $f$, $f'$ und $f''$
untereinander auf einer gemeinsamen Achse, ein Punkt läuft mit. Bei der Tangente durch einen Punkt außerhalb lässt sich
die Berührstelle ziehen; die Tangente dreht sich, bis sie den Punkt trifft (zwei Lösungen). Typische Fehler rot im Bild
(z. B. hebbare Lücke als Pol, Pol im Vorzeichenschema vergessen).

## Bausteine aus M7: was für die Klausur noch fehlt

Nach einer ersten Durchsicht ist fast alles da. Ergänzt wird in Schritt 1b und 1c (je mit Aufgaben in den Stufen 4 und 5):
- **Determinante mit Parameter $5 \times 5$** (heute mit Parameter bis $4 \times 4$; in der Klausur zweimal $5 \times 5$),
  danach am Stück $\det(\lambda A)$, $\det A^{\mathsf T}$, $\det A^{-1}$, $\det(A^k)$, Invertierbarkeit, Spalten linear
  abhängig, alles für dieselbe Matrix.
- **Spitz oder stumpf je nach Parameter** als Ungleichung im Parameter (heute „senkrecht mit Parameter“).
- **Ausdrücke mit einer Inversen einer nicht quadratischen Matrix** als Falle bei „Welche Ausdrücke sind definiert?“
  (prüfen, ob schon da).
- Die Durchsicht in Schritt 1 geht jeden Punkt der Spalte „Was genau“ der Klausur-Tabelle durch und ergänzt, was fehlt.

## Technik (kurz)

- **Klausuraufgaben mit Rechenweg** (`src/engine/exam/`): neue Art von Teil neben den Auswahlfragen aus Chemie: ein Teil
  hat Schritte mit Punkten, Musterlösung (LaTeX aus der Engine), optional einem erwarteten Wert zum Eintippen (Prüfung
  mit `src/engine/check/`) und den typischen Fehlern dieses Schritts mit ihren Werten. Bewertung aus den Haken und den
  geprüften Werten, Folgefehler wie bei Chemie (`grade.ts`). Die Mathe-Klausuraufgaben liegen je Baustein in
  `src/engine/mathExam/` und nutzen die Baukästen der Tätigkeiten mit **gemeinsamen Daten** (dieselben Vektoren oder
  dieselbe Funktion für alle Teile). Dafür bekommen die Baukästen Einstiege, denen man die Daten übergibt.
- **Analysis-Engine** `src/engine/analysis/`: Funktionen als Terme der Term-Engine; Polynome mit exakten Brüchen
  (zerlegen, Nullstellen mit Ordnung, Polynomdivision), Lücken, Pole, Asymptoten, Vorzeichenschema, Ableitungen aus
  `derive/`, Nullstellen von $f'$ und $f''$ exakt (Zahlen so gewählt, dass alles ohne Taschenrechner aufgeht),
  Randverhalten mit Begründung, Grenzwerte mit L'Hospital Schritt für Schritt. Zahlen fürs Zeichnen nur zum Zeichnen;
  alle gefragten Werte exakt. Tests: Ergebnisse gegen numerische Gegenprobe an stabilen Stellen, falsche Antworten nie
  gleichwertig zur Lösung, Definitionsbereich wie im Skript (Engine-Regeln in CLAUDE.md).
- **Graphen** `src/ui/draw/FunctionGraph.tsx` (eigene Zeichnung ohne Zusatzbibliothek, wie die Vektorbilder): Achsen,
  Gitter, Kurven aus Stützstellen der Engine (an Polen getrennt), Asymptoten, Punkte, Lücken, Tangente, Schieberegler,
  Zoom zum Abspielen; „Bewegung reduzieren“ zeigt gleich das fertige Bild. Tests prüfen, dass Bild und Aufgabe
  zusammenpassen (Punkte liegen auf der Kurve, Pole an den Nullstellen des Nenners, Tangente berührt).
- **Katalog:** Mathe bekommt `mock` und eine Liste der Klausur-Bausteine (Titel, Häufigkeit, Punktespanne, wo üben,
  schon da oder „kommt noch“); ein Test vergleicht mit der Engine. Neue Tätigkeiten und Bausteine bekommen die nächsten
  freien Nummern in `BLOCK_CODES`.
- **Speichern** (`src/state/`): Versuche je Klausur-Baustein (wie `examPractice.ts`), Probeklausuren über `mockExam.ts`
  (mit Fach „mathe“ und Art der Probeklausur), Haken der Korrektur, Wiederholung der Klausurteile.
- **Fehlerregeln** mit Vorsilben: `lim-` (Grenzwerte), `abl-` neu für Fallen beim Ableiten (bestehende bleiben), `fkt-`
  (Funktionen), `gr-` (gebrochen-rational), `kd-` (Kurvendiskussion), `tg-` (Tangenten). Erste Liste aus
  docs/AUFGABENARTEN.md: L'Hospital ohne unbestimmte Form, Quotientenregel statt getrennt abgeleitet, $1^\infty$ für 1
  gehalten; Konstante wie $x$ abgeleitet, $\sin(x^2)$ mit $\sin^2 x$ verwechselt; $x$ und $y$ nicht getauscht,
  ausgeschlossenen Wert übersehen, beide Vorzeichen der Wurzel behalten, um $\varphi$ statt $\frac{\varphi}{\omega}$
  verschoben, arccos nur in $[0, \pi]$ übersehen; Definitionsbereich aus der gekürzten Form, hebbare Lücke als Pol,
  Nullstelle außerhalb des Definitionsbereichs behalten, Pol im Vorzeichenschema vergessen, Ordnung vor dem Kürzen
  gezählt; $f' = 0$ für hinreichend gehalten, Randwerte bei globalen Extrema vergessen, Faktor $e^{\ldots}$ nicht als
  positiv erkannt; waagrechte Tangente sofort als Extremum gemeldet, $P$ für den Berührpunkt gehalten. Jede mit
  Katalogbeispiel, eigenem Text für „Warum ist das falsch?“ und Platz auf einer Lernkarte (Regeln aus CLAUDE.md). Der
  Katalog wächst je Schritt in diesem Plan.

## Schritte

Reihenfolge: zuerst der Klausurmodus mit den Bausteinen, die schon da sind (lineare Algebra, das läuft gerade in der
Vorlesung), dann die fehlenden Analysis-Bausteine in der Reihenfolge der Vorlesung, zum Schluss die ganze Probeklausur.
Jeder Schritt lässt sich einzeln ausprobieren; danach Tests, Prüfung im Browser (Handy und Laptop, hell und dunkel),
Pull Request.

1. **Klausurmodus mit den ersten Bausteinen**
   - **1a:** Klausur-Karte auf der Mathe-Seite, Klausur-Überblick (alle 13 Bausteine, fehlende als „kommt noch“),
     „Klausuraufgabe üben“ mit Aufgabenblatt, Ergebnis eintippen, „Rechenweg vergleichen“, Haken, Punkte, „Was ist
     passiert?“, „Ich komme nicht weiter“. Erste Klausuraufgaben: Inverse einer $3 \times 3$-Matrix und Determinante mit
     Parameter (mit dem neuen $5 \times 5$ und den Regeln am Stück).
   - **1b:** Klausuraufgaben Matrizen („Welche Ausdrücke sind definiert? Berechne sie.“, Matrizengleichung erst allgemein,
     dann ausrechnen) und Gleichungssystem mit Parameter.
   - **1c:** Klausuraufgaben Vektoren mit Parameter (mit „spitz oder stumpf je nach Parameter“) und Geraden und Ebenen;
     Durchsicht der M7-Bausteine gegen die Klausur-Tabelle abgeschlossen.
2. **Probeklausur „Nur lineare Algebra“** (45 Minuten, etwa 50 Punkte) mit Deckblatt, Uhr, Korrektur, Auswertung,
   „Das solltest du üben“, Wiederholung und Verlauf. Danach ist der Klausurmodus für die Hälfte der Punkte fertig.
3. **Graphen und „Grenzwerte“:** Zeichen-Grundlage für Graphen (`FunctionGraph`), Tätigkeit „Grenzwerte“ mit allen
   Bausteinen und Stufen, Bild „Hineinzoomen“, Klausuraufgabe „Grenzwert mit L'Hospital“.
4. **„Ableiten“ mit Bausteinen und nachgeschärft** (M6 Schritt 7 vorgezogen)
   - **4a:** Bausteine und Gruppen, Fallen, bessere falsche Antworten, Stufen neu verteilt.
   - **4b:** Bild „Tangente und Steigung“, Klausuraufgabe „Drei verschachtelte Ableitungen“.
5. **Tätigkeit „Funktionen“**
   - **5a:** Definitionsbereich und Wertemenge, Umkehrfunktion mit Bild „Spiegeln“, Klausuraufgabe „Umkehrfunktion“.
   - **5b:** Graph ablesen (Schwingungen, $\arctan$) mit Bild „Kurve aufbauen“, Klausuraufgabe „Graph ablesen“.
6. **Tätigkeit „Funktion untersuchen“, gebrochen-rational**
   - **6a:** Lücken, Pole, Nullstellen mit Ordnung, Vorzeichenschema, Graph entsteht mit.
   - **6b:** Asymptoten (auch schräg mit Polynomdivision), Skizze wählen, „Herauszoomen“, Klausuraufgabe
     „Gebrochen-rationale Funktion untersuchen“.
7. **Tangenten:** waagrecht mit Art, durch einen Punkt außerhalb (Berührstelle ziehen), parallele Tangenten, Parameter;
   Klausuraufgabe „Tangenten“.
8. **Kurvendiskussion mit e und ln**
   - **8a:** Definitionsbereich, Nullstellen, Randverhalten mit Begründung, $f'$ nachweisen, Monotonie, Extrema.
   - **8b:** Krümmung, Wendepunkte, Wertemenge, globale Extrema, Skizze, Bild $f$, $f'$, $f''$ untereinander;
     Klausuraufgabe „Kurvendiskussion“; Probeklausur „Nur Analysis“.
9. **Ganze Probeklausur** (90 Minuten, 100 Punkte) mit allen 13 Bausteinen.
10. **Abschluss:** Prüfung aus drei Blickwinkeln (Mathematik an vielen erzeugten Aufgaben mit eigener Rechnung, Regeln und
    Texte, Oberfläche), Doku, ROADMAP.

Größere Schritte werden bei Bedarf weiter geteilt, damit jeder Teil schnell zum Ausprobieren kommt.

## Bekannte Risiken

- **Selbst abhaken kann zu großzügig sein.** Darum prüft die App alles, was du eintippst, und das Endergebnis allein
  bringt wenig Punkte. Die Auswertung sagt ehrlich: „Punkte nach deinen Haken und dem Schema der App“.
- **Kurvendiskussion und Randverhalten** sind die größte neue Rechenarbeit für die Engine (Begründungen wie „e wächst
  schneller als jede Potenz“). Darum spät im Plan und in zwei Teilen.
- **Gemeinsame Daten über Teile hinweg** brauchen einen Umbau der Baukästen (Daten übergeben statt selbst ziehen). Er
  beginnt bei den M7-Bausteinen in Schritt 1, wo die Baukästen am saubersten getrennt sind.

## Fragen an den Nutzer

1. **Aussehen:** Passt der Entwurf (Klausur-Karte, Überblick, Aufgabenblatt, Vergleichen, Auswertung, Bilder)?
2. **Punkte vergeben:** Auf Papier rechnen, dann den Rechenweg vergleichen und selbst abhaken, mit Prüfung aller
   eingetippten Werte (Empfehlung, so ist es am nächsten an der echten Klausur), oder alles in der App eintippen und
   auswählen wie bei Chemie (die App bewertet allein, aber ohne eigenen Rechenweg auf Papier)?
3. **Teil-Probeklausuren:** „Nur lineare Algebra“ und „Nur Analysis“ zusätzlich zur ganzen Probeklausur (Empfehlung: ja,
   so geht die Probeklausur für die lineare Algebra schon nach Schritt 2)?
4. **Notenschlüssel:** Bekannt ist nur „für eine 1,0 etwa 90 Punkte“. Weißt du, ab wie vielen Punkten man besteht? Sonst
   zeigt die App keine Note.
