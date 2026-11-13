# Technische Mechanik 1: Aufgabenarten, Rechenschemata, Konventionen

Stand: 12.11.2026. Der Nutzer hat am 12.11.2026 die Unterlagen zu „Technische
Mechanik 1“ hochgeladen: acht Skripte (Kapitel 1 bis 8: Einführung, Grundlagen,
zentrales ebenes Kräftesystem, allgemeines ebenes Kräftesystem, ebene Tragwerke,
räumliche Statik, Schwerpunkte, Schnittgrößen) und die Übungsblätter 9 bis 19.
Die Unterlagen liegen nicht im Repo (Urheberrecht, siehe CLAUDE.md). Hier steht in
eigenen Worten, **welche Arten** von Aufgaben es gibt, **nach welchem Schema** man
sie löst, welche **Fehler** naheliegen und **welche Schreibweisen** die App genauso
übernehmen muss. Aufgaben entstehen später immer aus der Engine mit eigenen Zahlen
und eigenen Bildern; Skizzen aus Skript und Lehrbuch werden nie nachgezeichnet.

Am 13.11.2026 kamen 135 Fotos des Lehrbuchs „Technische Mechanik 1 (Statik)“ des
Nutzers dazu (ganzes Buch: Kapitel 1 bis 9 und Anhang). Was das Buch ergänzt, steht im
Abschnitt „Lehrbuch“ und bei Reibung; Inhalte, die nur im Buch stehen, sind so markiert.

Grundlage für M11 (Technische Mechanik, laut Roadmap das letzte Fach). In der Spalte
„Fehler“ steht (S), wenn das Skript selbst davor warnt; alle anderen sind aus dem
Stoff naheliegend vermutet.

## Was in den Unterlagen fehlt

- **Reibung (Kapitel 9):** kein Skript, nur die Blätter 18 (Haften nach Coulomb) und
  19 (Seilhaftung, Seilreibung). **Geklärt seit 13.11.2026:** Maßstab ist Kapitel 9 des
  Lehrbuchs (Haftung, Reibung, Haftungswinkel, Seilhaftung und Seilreibung). Zahlenwerte
  für Reibzahlen nimmt die App aus einer frei zugänglichen Tabelle, nicht aus dem Buch.
- **Lösungen:** Die meisten Blätter haben keine. Einige (9, 12, 16, 19) haben
  „Lösungsstellen“: nur die Ziffernfolge des Ergebnisses ohne Komma und Einheit, zur
  Selbstkontrolle. Blatt 18 hat nur zu einer Aufgabe einen Lösungshinweis.
- **Keine Altklausur.** Klausurniveau und Punkteverteilung sind noch unbekannt.
- Auf Blatt 17 und der passenden Skriptseite stehen die gegebenen Lagerwerte mit
  verschiedenen Vorzeichen. Lehre für die App: Jede Lagerreaktion wird mit ihrer
  eingezeichneten Bezugsrichtung angegeben, nie als nackte Zahl.

## Konventionen, die die App genauso verwenden muss

**Koordinaten und Drehsinn**
- Ebene Statik (Kapitel 3 bis 5): $x$ nach rechts, $y$ nach oben. Momente gegen den
  Uhrzeigersinn sind positiv. Erster Schritt jeder Rechnung: Koordinatensystem und
  Drehsinn festlegen.
- Winkel $\alpha$ einer Kraft wird gegen den Uhrzeigersinn ab der $x$-Achse gemessen:
  $F_x = F\cos\alpha$, $F_y = F\sin\alpha$, $F = \sqrt{F_x^2 + F_y^2}$.
- Moment einer Kraft um $A$ in der Ebene: $M^{(A)} = (x - x_A)F_y - (y - y_A)F_x$.
  Die App schreibt das Moment **um** einen Punkt mit hochgestelltem Punkt ($M^{(A)}$, wie
  das Lehrbuch) und das Einspannmoment **im** Lager $A$ als $M_A$, damit beides nicht
  verwechselt wird.
- Räumlich (Kapitel 6): rechtshändiges $x$-$y$-$z$-System, oft gedreht gezeichnet;
  Moment als $\vec M_A = \vec r_A \times \vec F$, immer in dieser Reihenfolge.
- **Schnittgrößen (Kapitel 8): $x$ entlang der Balkenachse, $z$ nach unten**, $y$ nach
  vorn. Das weicht von Kapitel 3 bis 5 ab; die App muss das je Aufgabe sichtbar
  machen (Achsenkreuz im Bild).

**Bezeichnungen**
- Kräfte $F$, $F_1, F_2, \ldots$; Resultierende $F_R$; Gewichtskraft $F_G$;
  resultierendes Moment $M_{RA}$; Einzelmoment $M_0$; Streckenlast $q$ bzw. $q_0$, ihre
  Resultierende $F_q$.
- Lagerreaktionen nach dem Punkt benannt: $F_{Ax}$, $F_{Ay}$ (Festlager), $F_B$
  (Loslager, Pendelstütze), $M_A$ (Einspannung); im Gelenk $G$: $F_{Gx}$, $F_{Gy}$;
  Kontakt: Normalkraft $F_N$ senkrecht zur Fläche.
- Stabkräfte im Fachwerk: im Skript uneinheitlich ($F_i$ oder $S_i$). Vorschlag für
  die App: $S_1, S_2, \ldots$; Knoten mit römischen Zahlen.
- Schnittgrößen $N$, $Q$, $M$ als Funktionen $N(x)$, $Q(x)$, $M(x)$; räumlich $N$,
  $Q_y$, $Q_z$, $M_T$, $M_y$, $M_z$.
- Reibung: $\mu_0$ für Haften, $\mu$ für Gleiten; Haftungskraft $H$ (Reaktionskraft,
  Richtung frei annehmbar), Reibungskraft $R$ (eingeprägt, Richtung festgelegt).

**Vorzeichen**
- Unbekannte Kräfte werden in positiver Achsrichtung angenommen. Ein negatives
  Ergebnis heißt: Die Kraft zeigt in Wirklichkeit andersherum (nicht: falsch
  gerechnet). Das Ergebnis bleibt mit Vorzeichen stehen.
- Fachwerk: alle Stabkräfte als Zug angesetzt (Pfeil vom Knoten weg); positiv heißt
  Zug, negativ Druck.
- Schnittgrößen: Das Schnittufer, dessen Normale in $+x$ zeigt, ist das positive
  (beim Balken das linke Teil). Dort zeigen positive $N$, $Q$ in Achsrichtung, $M$
  dreht positiv um $y$; am negativen Ufer alles gegengleich. Positive Werte werden im
  Diagramm **nach unten** aufgetragen, Flächen mit ⊕ und ⊖ und Eckwerten.
- Rahmen: gestrichelte Bezugsfaser, je gerades Teilstück ein eigenes $x$-$z$-System,
  $z$ zeigt zur Strichlinie; die Strichlinie bleibt auf derselben Seite (beim Rahmen
  innen), die Koordinaten laufen gleichsinnig.

**Lager in der Ebene** (Wertigkeit = Zahl der übertragenen Größen)

| Lager | überträgt | Wertigkeit |
| --- | --- | --- |
| Loslager | Kraft senkrecht zur Gleitfläche | 1 |
| Pendelstütze, Stab | Kraft in Stabrichtung (Zug oder Druck) | 1 |
| Seil | nur Zug in Seilrichtung | 1 |
| Festlager | $F_x$ und $F_y$ | 2 |
| Gelenk | $F_x$ und $F_y$, kein Moment | 2 |
| Schiebehülse | Querkraft und Moment | 2 |
| Einspannung | $F_x$, $F_y$ und Moment | 3 |

Glatte Berührung: Kraft senkrecht zur Fläche. Seilrolle: Seilkraft auf beiden Seiten
gleich groß. Reibung wird weggelassen, wenn nichts anderes dasteht.

**Lager im Raum:** Pendelstütze 1, zweiwertige Stütze 2, Festlager (Bock) 3,
Kugelgelenk 3 (nur Kräfte), Kreuzgelenk 4, Schiebehülse 4, Festlager mit Hülse und
Scharniergelenk 5, Einspannung 6. Achtung: Bei Wellen heißen die Lager im üblichen
Sinn „Loslager“ (2 Kräfte) und „Festlager“ (3 Kräfte); das ist nicht das fünfwertige
Festlager der Tabelle. Die App trennt beides mit eigenen Namen.

**Statische Bestimmtheit**
- Einteilig eben: $f = 3 - a$, nötig $f = 0$, und kinematisch zulässig: Die drei
  Lagerkräfte sind nicht alle parallel und gehen nicht alle durch einen Punkt.
- Mehrteilig eben: $f = 3n - a - z$ ($n$ Teile, $a$ Lagerreaktionen, $z$
  Zwischenreaktionen). $f = 0$: in der Regel bestimmt; $f < 0$: $|f|$-fach unbestimmt;
  $f > 0$: verschieblich. Die Bedingung ist notwendig, nicht hinreichend.
- Fachwerk: $f = 2k - s - a$ ($k$ Knoten, $s$ Stäbe).
- Räumlich einteilig: genau 6 Lagerreaktionen, und nicht beweglich.
- Die Bestimmtheit hängt nur von der Lagerung ab, nie von der Last.

**Gleichgewicht**
- Zentral eben: $\sum F_x = 0$, $\sum F_y = 0$ (2 Gleichungen, keine Momente).
- Allgemein eben: zusätzlich $\sum M_A = 0$ um einen frei wählbaren Punkt. Ersatzformen
  mit zwei oder drei Momentengleichungen nur, wenn die Bezugspunkte passend liegen
  (drei Punkte nicht auf einer Geraden).
- Räumlich: 6 Gleichungen; Momentenachsen so wählen, dass möglichst viele Unbekannte
  herausfallen.

**Weitere Regeln**
- Die vier Axiome: Trägheit, Verschiebung längs der Wirkungslinie (nur am starren
  Körper), Reaktion ($\vec F_{12} = -\vec F_{21}$), Parallelogramm.
- Drei nicht parallele Kräfte im Gleichgewicht: Ihre Wirkungslinien schneiden sich in
  einem Punkt (drei parallele Kräfte können auch im Gleichgewicht sein).
- Kräftepaar: Resultierende null, nur Drehwirkung $M = F \cdot h$, frei verschiebbar.
- Nullstäbe: (1) unbelasteter Knoten mit zwei Stäben, die nicht in einer Linie liegen:
  beide null; (2) belasteter Knoten mit zwei Stäben, Last in Richtung des einen: der
  andere null; (3) unbelasteter Knoten mit drei Stäben, zwei in einer Linie: der dritte
  null.
- Ritterschnitt: durch drei Stäbe, die nicht alle am selben Knoten hängen.
- Schnittgrößen am geraden Balken: $\frac{dQ}{dx} = -q$, $\frac{dM}{dx} = Q$; $M$ hat ein
  Extremum, wo $Q = 0$. Einzelkraft: Sprung in $Q$, Knick in $M$. Einzelmoment: Sprung in
  $M$. Gelenk und freies Ende: $M = 0$. An Rahmenecken ohne Einzelmoment geht $M$ stetig
  über.
- Faustregel: nur Einzellasten → $Q$ konstant, $M$ linear; konstante Streckenlast →
  linear, quadratisch; Dreieckslast → quadratisch, kubisch.
- Schwerpunkt: $x_S = \frac{\sum x_i A_i}{\sum A_i}$ (ebenso mit Gewicht, Volumen,
  Länge); Ausschnitte zählen negativ; Symmetrieachsen sind Schwereachsen. Tabelle der
  Grundflächen im Skript: Dreiecke, Parallelogramm, Trapez, Kreisausschnitt, Halbkreis,
  Kreisabschnitt, Fläche unter einer Parabel; Linie nur der Kreisbogen
  ($r\frac{\sin\alpha}{\alpha}$). Keine Körpertabelle, kein Satz von Guldin.
- Haften: $|H| \le H_0 = \mu_0 N$; nur im Grenzfall gilt Gleichheit. Gleiten: $R = \mu N$,
  entgegen der Relativbewegung, $\mu < \mu_0$. Haftungswinkel $\varrho_0$ mit
  $\tan\varrho_0 = \mu_0$ (Haftungskeil in der Ebene, Haftungskegel im Raum).
- Seil um eine Trommel (Euler-Eytelwein), $\alpha$ im Bogenmaß:
  $S_1 e^{-\mu_0\alpha} \le S_2 \le S_1 e^{\mu_0\alpha}$; beim Gleiten $\mu$ statt $\mu_0$,
  welches Ende stärker gespannt ist, folgt aus der Rutschrichtung.

## Kräfte in der Ebene (Kapitel 2 bis 4, Blätter 9 und 10)

| Art | Schema (kurz) | Fehler | Wohin |
| --- | --- | --- | --- |
| Kraft zerlegen und zusammensetzen: Betrag und Winkel ↔ Komponenten | Winkel ab $x$-Achse; $F_x = F\cos\alpha$, $F_y = F\sin\alpha$; zurück über Pythagoras und $\tan\alpha = \frac{F_y}{F_x}$ mit Blick auf den Quadranten | sin und cos vertauscht (Winkel zu einer anderen Achse gemessen); Vorzeichen im 2. bis 4. Quadranten; arctan im falschen Quadranten; Rechner im Bogenmaß | M11 |
| Resultierende mehrerer Kräfte mit gemeinsamem Punkt, rechnerisch | jede Kraft als Spalte, Komponenten summieren, Betrag und Winkel | Beträge statt Vektoren addiert | M11 |
| Dasselbe zeichnerisch (Krafteck, Parallelogramm, Zerlegen nach zwei Wirkungslinien) | Pfeile Spitze an Ende, Reihenfolge egal; Zerlegen mit Parallelen | Krafteck nicht im Kreis gerichtet | M11 mit Bildern zum Anfassen (nach M6b) |
| Gleichgewicht am Knoten (zwei Stäbe, Seile an einer Öse, Walze auf glatter schiefer Ebene oder an einer Stufe, Seilrolle) | Freischneiden, Unbekannte positiv annehmen, $\sum F_x = 0$, $\sum F_y = 0$ allgemein aufstellen, mit Buchstaben auflösen, Zahlen erst am Schluss | Kraft eingezeichnet, die das Teil selbst ausübt (S); Zahlen zu früh (S); mehr als 2 Unbekannte (S); Seil auf Druck; Normalkraft schräg; negatives Ergebnis als Fehler gedeutet | M11 |
| Resultierende paralleler Kräfte, Hebelgesetz, auch verschachtelt (Mobile, Waage) | $F_R = F_1 + F_2$ mit Vorzeichen, Lage aus $F_1 a_1 = F_2 a_2$; bei Verschachtelung wird die Teilresultierende zur Last der nächsten Ebene | Lage zur falschen Kraft hin (Kehrwert) | M11 |
| Moment einer Kraft und Summe von Kräftepaaren | Kraft mal senkrechter Hebelarm mit Vorzeichen nach Drehsinn, oder Koordinatenformel | Drehsinn vergessen (S); Hebelarm schräg gemessen; Moment einer Kraft wie Kräftepaar behandelt (S) | M11 |
| Kräftesystem auf einen Punkt zurückführen | $F_R$ aus den Komponenten, $M_{RA} = \sum M_{iA}$ | Bezugspunkt gewechselt | M11 |
| Superposition: Lastfälle einzeln lösen, skalieren, addieren | lineare Überlagerung | – | M11 (Lernkarte, Stufe 5) |

## Tragwerke in der Ebene (Kapitel 5, Blätter 11 bis 13)

| Art | Schema (kurz) | Fehler | Wohin |
| --- | --- | --- | --- |
| Lagerreaktionen am einteiligen Tragwerk (Balken, Winkelhebel, Rahmen; schräge Lasten, Loslager auf schräger Fläche, Feder, Seil über Rollen) | Koordinaten und Drehsinn, freischneiden, Reaktionen einzeichnen, Momentengleichung um den Punkt mit den meisten Unbekannten, dann Kraftgleichungen, Betrag und Winkel der Lagerkraft, Probe mit weiterer Momentengleichung | Loslager mit zwei Komponenten; Moment der Einspannung vergessen; Seilkraft an der Rolle nur einmal gezählt; Hebelarm schräg | M11 (Kernstück) |
| Statische Bestimmtheit prüfen | $a$, $z$, $n$ bzw. $k$, $s$ abzählen, $f$ ausrechnen, kinematische Sonderfälle prüfen | Formel erfüllt, aber alle Lagerkräfte parallel oder durch einen Punkt (S); $z$ je Teil statt je Verbindung gezählt | M11 (Wissensfrage und Rechnung) |
| Mehrteiliges Tragwerk mit Gelenk (Dreigelenkbogen, Gelenkträger, Stehleiter mit Seil, Kurbeltrieb mit Pendelstab) | $f$ prüfen, in Gelenken trennen, Zwischenreaktionen gegengleich, je Teil 3 Gleichungen; geschickt: am Ganzen $\sum M$ um ein Lager, am Teil $\sum M$ um das Gelenk | Moment im Gelenk angesetzt; Zwischenreaktion an beiden Teilen gleich gerichtet; innere Kraft im Gesamtsystem eingezeichnet (S) | M11, Stufe 4 bis 5 |
| Fachwerk, Knotenpunktverfahren | Bestimmtheit, Lagerreaktionen am Ganzen, Nullstäbe, dann Knoten mit höchstens 2 unbekannten Stäben, je Knoten 2 Gleichungen, Zug/Druck angeben | Druck als positiv gelesen; Nullstab-Regel am belasteten Knoten angewandt; bewegliches Fachwerk nicht erkannt (S) | M11 |
| Fachwerk, Ritterschnitt | Schnitt durch 3 Stäbe, Momentengleichung um den Schnittpunkt zweier Stäbe (Ritterpunkt) gibt die dritte Stabkraft direkt | Schnitt durch 3 Stäbe am selben Knoten; falscher Ritterpunkt | M11 |
| Umgekehrte Aufgabe: eine Stabkraft bekannt, Last und übrige Stäbe gesucht | dieselben Gleichungen, andere Unbekannte | – | M11, Stufe 5 |

## Räumliche Statik (Kapitel 6, Blätter 14 und 15)

| Art | Schema (kurz) | Fehler | Wohin |
| --- | --- | --- | --- |
| Kraft im Raum: Komponenten, Betrag, Richtungskosinus; Vektor zwischen zwei Punkten | Koordinatendifferenz, Betrag, Richtungskosinus | Koordinaten von $A$ nicht abgezogen | M11 (Vektoren aus M7) |
| Moment und Resultierende eines räumlichen Kräftesystems (Kräfte an einem Quader) | Angriffspunkte als Koordinaten, Kräfte in Komponenten, $\vec F_R$ summieren, je Kraft $\vec r_A \times \vec F$, summieren | Reihenfolge $\vec F \times \vec r$ (Vorzeichen); zyklische Reihenfolge verwechselt; Kraft parallel zur Achse oder durch die Achse liefert angeblich ein Moment; Moment hängt vom Bezugspunkt ab (S) | M11 (Kreuzprodukt aus M7) |
| Lagerreaktionen räumlich (Einspannung, Pendelstützen, Rahmen mit drei Lagern, Welle mit Zahnrad) | Wertigkeit = 6 prüfen, Reaktionen positiv ansetzen, 6 Gleichungen mit klug gewählten Achsen, Gegenprobe | Kugelgelenk mit Momenten; $z$ nach unten übersehen; Wellenlager mit Tabellenlager verwechselt | M11, Stufe 4 bis 5 |

## Schwerpunkte (Kapitel 7, Blatt 16)

| Art | Schema (kurz) | Fehler | Wohin |
| --- | --- | --- | --- |
| Zusammengesetzte Fläche (L-Profil, Blech mit Dreiecken und Kreisausschnitt) | in Grundformen zerlegen, Ausschnitte mit Minus, Symmetrie nutzen, Tabelle $A_i$, $x_i$, $y_i$, $A_i x_i$, $A_i y_i$, summieren, teilen | durch die Anzahl der Teile statt durch $\sum A_i$ geteilt; Ausschnitt addiert oder nur seine Fläche abgezogen (S); Überlappung doppelt; Teilschwerpunkt lokal statt global; Dreieck: $\frac{1}{3}$ von der falschen Seite | M11 |
| Zusammengesetzte Linie (Draht aus Strecken und Kreisbögen, auch räumlich) | wie oben mit Längen | Halbkreisbogen $\frac{2r}{\pi}$ mit Halbkreisfläche $\frac{4r}{3\pi}$ verwechselt | M11 |
| Einzelmassen im Raum | $x_S$, $y_S$, $z_S$ als gewichtete Mittel | ungewichteter Mittelwert | M11 |
| Schwerpunkt durch Integration (Dreieck, Kreisbogen, Streckenlast) | Streifen $dA$ bzw. $ds$ wählen, $\int x\, dA$ durch $A$ | – | M11, geführt als Herleitung; Integrale aus M9 |
| Resultierende einer Streckenlast | Fläche unter der Last, Angriff im Schwerpunkt (Dreieckslast bei $\frac{2}{3}$ vom spitzen Ende) | Dreieckslast in der Mitte angesetzt | M11 (vor Schnittgrößen) |

## Schnittgrößen (Kapitel 8, Blatt 17)

| Art | Schema (kurz) | Fehler | Wohin |
| --- | --- | --- | --- |
| Verläufe $Q(x)$, $M(x)$, $N(x)$ am geraden Balken als Funktion | Lagerreaktionen, Bereiche zwischen den Lasteinleitungen, je Bereich Schnitt bei $x$ mit positiven Schnittgrößen, Gleichgewicht am einfacheren Teil, Verläufe zeichnen, Kontrolle (Sprünge, $M = 0$ am freien Ende) | ganze Streckenlast statt des abgeschnittenen Teils (S); Pfeile am negativen Ufer falsch (S); $\frac{dQ}{dx} = +q$ | M11 |
| Punktweise: Werte an Stützstellen, dann je nach Lastart verbinden | Stützstellen links und rechts jeder Einzellast, an Anfang und Ende jeder Streckenlast, bei Parabeln ein Zwischenpunkt | zu wenige Stützstellen, Eckwerte fehlen (S); Sprung durch Einzelmoment fehlt oder in $Q$ eingetragen; kein Knick bei Einzelkraft | M11 |
| Durch Integration aus $q(x)$ (z. B. Dreieckslast am Kragträger) | zweimal integrieren, Konstanten aus Randbedingungen | Konstante vergessen | M11 (Integrale aus M9) |
| Größtes Moment | Nullstelle von $Q$, dort $M$ | $M_{max}$ unter der größten Last vermutet | M11 |
| Gelenkträger | erst Teile mit Zwischenreaktion, dann Schnittgrößen; Kontrolle $M = 0$ im Gelenk | Gelenkkraft im Gesamtsystem (S) | M11, Stufe 4 bis 5 |
| Rahmen (auch schiefwinklig, verzweigt) und Bogen | Strichlinie, Teilsysteme, alle drei Größen; an Ecken wechseln $N$ und $Q$ bei rechtem Winkel die Rollen, $M$ stetig | Strichlinie springt die Seite (S); ⊕/⊖ fehlt (S); Regel $\frac{dM}{dx} = Q$ am Bogen angewandt (S) | M11, Stufe 5 |
| Räumlicher Träger (abgewinkelt, eingespannt) | vom freien Ende her schneiden, 6 Gleichungen | – | M11, Stufe 5 |

## Reibung (Blätter 18 und 19, Lehrbuch Kapitel 9)

| Art | Schema (kurz) | Fehler | Wohin |
| --- | --- | --- | --- |
| Haften prüfen (gestapelte Körper, Körper auf schiefer Ebene) | Freischnitt mit Normal- und Haftkraft, Gleichgewicht gibt nötige Haftkraft, Vergleich mit $\mu_0 F_N$; bei mehreren Fugen rutscht die mit der kleinsten Reserve | Haftkraft ohne Prüfung gleich $\mu_0 F_N$ gesetzt; $\mu$ und $\mu_0$ verwechselt; Normalkraft mit sin statt cos | M11 |
| Grenzfall: größte Zugkraft, größter Neigungswinkel (Fahrzeug mit Antrieb oder Bremse an einer Achse) | Achslasten aus dem Momentengleichgewicht, nur angetriebene oder gebremste Räder übertragen Haftkraft, Gleichheit an der Grenze | alle Räder angesetzt | M11 |
| Selbstsperrung (Hebel an Trommel, Bandbremse) | Bedingung, unter der Gleichgewicht für jede Kraft hält: Ungleichung für ein Maß | Richtung der Ungleichung | M11 |
| Grenzen einer Kraft für Ruhe (Klotz auf rauer schiefer Ebene mit Zusatzkraft): untere Grenze gegen Abrutschen, obere gegen Hochschieben; ohne Kraft Ruhe, solange $\alpha \le \varrho_0$ | je Richtung eigener Freischnitt mit $H$ in Gegenrichtung der drohenden Bewegung, Haftbedingung einsetzen, Ungleichung lösen | nur eine Richtung untersucht; $H$ falsch herum | M11 |
| Leiter an der Wand (nur Boden rau, oder Boden und Wand rau: statisch unbestimmt, dann Grenzfall oder Haftungskeile) | Gleichgewicht, Haftbedingung an jeder rauen Stelle, Ungleichung für die Stellung | statisch unbestimmten Fall wie bestimmten gerechnet | M11, Stufe 5 |
| Schraube mit Flachgewinde: Moment zum Heben und Halten, Selbsthemmung | Steigungswinkel aus Ganghöhe und Umfang, Grenzen $F\tan(\alpha - \varrho_0) \le \frac{M}{r} \le F\tan(\alpha + \varrho_0)$, selbsthemmend für $\alpha \le \varrho_0$ | Vorzeichen von $\varrho_0$ vertauscht | M11, Stufe 5 (nur Lehrbuch) |
| Seil um Trommel oder Rollen (Bandbremse in beiden Drehrichtungen, Körper auf schiefer Ebene mit Gegengewicht, Klotz auf drehender Walze) | Umschlingungswinkel im Bogenmaß, stärker gespanntes Ende aus der Rutschrichtung, Seilkräfte verknüpfen, Momente an Scheibe und Hebel; beide Richtungen getrennt | Winkel in Grad; Seilenden vertauscht | M11 |

## Lehrbuch: was es ergänzt (Fotos vom 13.11.2026)

Das Buch folgt derselben Reihenfolge wie die Vorlesung und geht an einigen Stellen weiter.
Richtig für die App ist, was Skript und Buch gemeinsam sagen; die **Schreibweise kommt aus
dem Skript** (danach richtet sich die Klausur), nur wo das Skript nichts festlegt, aus dem
Buch. Tabellen und Bilder des Buchs werden nie übernommen, sondern selbst gestaltet.

| Kapitel im Buch | Vorlesung | In der App |
| --- | --- | --- |
| 1 Grundbegriffe (Kraft, starrer Körper, Schnittprinzip, Wechselwirkung, Einheiten, Lösungsschema in vier Schritten) | Kapitel 1 und 2 | Lernkarten, Nachschlagewerk |
| 2 Kräfte mit gemeinsamem Angriffspunkt (eben und räumlich, auch zeichnerisch mit Sinus- und Kosinussatz) | Kapitel 3 | M11 |
| 3 Allgemeine Kraftsysteme (Kräftepaar, Moment, Reduktion auf einen Punkt mit vier Fällen, Gleichgewicht, Seileck; räumlich: Momentenvektor, Dyname, Kraftschraube und Zentralachse) | Kapitel 4 und 6 | M11; Seileck, Kraftschraube und Zentralachse nur im Buch: später, Stufe 5 |
| 4 Schwerpunkt (parallele Kräfte, Körper mit verschiedener Dichte, Fläche, Linie; statische Momente; Tabelle der Grundflächen) | Kapitel 7 | M11 |
| 5 Lagerreaktionen (Wertigkeit, Bestimmtheit, räumliche Lager, mehrteilige Tragwerke, Polplan für kinematische Bestimmtheit, Matrixform) | Kapitel 5 und 6 | M11; Polplan nur im Buch: Wissensfrage |
| 6 Fachwerke (Bildungsgesetze, Nullstäbe, Knotenpunktverfahren, Cremona-Plan, Ritterschnitt, Raumfachwerk) | Kapitel 5 | M11; Cremona-Plan nur im Buch: später |
| 7 Balken, Rahmen, Bogen (Schnittgrößen, Rand- und Übergangsbedingungen, Föppl-Symbol, punktweise, Rahmenecken, Kreisbogen, räumlich) | Kapitel 8 | M11; Föppl-Symbol nur im Buch: Stufe 5 |
| 8 Arbeit (Arbeit, Potential, virtuelle Verrückungen, Arbeitssatz, Stabilität einer Gleichgewichtslage) | fehlt | nur im Buch: erst, wenn es in der Vorlesung vorkommt |
| 9 Haftung und Reibung | nur Blätter 18 und 19 | M11 (Maßstab) |
| Anhang: Vektoren, lineare Gleichungssysteme (Gauß-Algorithmus, Cramersche Regel), englische Fachwörter | Mathematik MB1 | M7, M9 |

**Andere Schreibweisen im Buch** (die App bleibt beim Skript, erwähnt das Buch aber auf der
Lernkarte, damit beim Lesen nichts verwirrt): Vektoren fett statt mit Pfeil; Resultierende
$R$ statt $F_R$; Gewicht $G$ statt $F_G$; Lagerkräfte $A$, $B$ mit Komponenten $A_H$,
$A_V$ (horizontal, vertikal) statt $F_{Ax}$, $F_{Ay}$; Kontakt $N$ und $T$; Moment um $A$
als $M^{(A)}$ (übernommen, siehe oben); Schwerpunkt $x_s$; Kurzschrift für die Gleichungen
mit Pfeilen („→:“, „↑:“, Momentenpunkt mit Drehpfeil). Statische Momente
$S_y = \int x\,dA$, $S_x = \int y\,dA$ (Index „verdreht“, Stolperstein).

**Was das Buch an Aufgabenarten dazubringt** (nur die Art, eigene Zahlen):
- Gleichgewichtswinkel gesucht (Gewichte an Seilen über Rollen, Stange mit zwei Lasten).
- Wo muss das Lager hin, damit der Balken im Gleichgewicht ist?
- Grenze bis zum Abheben (Kontaktkraft wird null), sinnvoller Winkelbereich.
- Körper mit Ausschnitt oder Einsatz anderer Dichte (Schwerpunkt mit Dichten gewichtet).
- Rahmenecke: an einer rechtwinkligen, unbelasteten Ecke tauschen $N$ und $Q$ die Rollen
  (Vorzeichen je nach Lage der Strichlinie), $M$ bleibt gleich; Probe am Verzweigungspunkt.
- Kreisbogen: Schnittgrößen als Funktion des Winkels; Sprünge an einer Last gleich ihren
  Anteilen normal und tangential.
- Schnittgrößen mit Rand- und Übergangsbedingungen (Tabelle: gelenkig $M = 0$, Parallelführung
  $Q = 0$, Einspannung beide frei, freies Ende beide null); Einfeldträger mit Gleichstreckenlast
  $M_{max} = \frac{q_0 l^2}{8}$ in der Mitte als Kontrollwert.

**Rezepte und Warnungen aus dem Buch:** Lösungsschema in vier Schritten (Problem, Modell,
Lösen mit Freikörperbild und Abzählen „so viele Gleichungen wie Unbekannte“, Ergebnis
deuten); Ergebnisse nicht genauer als die Eingangsdaten; Momentenpunkt auf die
Wirkungslinien von Unbekannten legen, Probe um einen anderen Punkt; Symmetrie nutzen;
Grenzfälle prüfen; Kraft- und Momentenvektoren nie addieren; eine Kraft parallel zu
verschieben ändert ihre Wirkung (Versatzmoment); beim arctan den Quadranten beachten.
Winkel stehen in den Beispielen meist zur Waagrechten oder Senkrechten, nicht ab der
$x$-Achse: Die App übt beides (Fehlerregel „sin und cos vertauscht“).

## Bilder, die die App selbst zeichnen muss

Alles neu gestaltet, nie nach Vorlage: Lagersymbole (Festlager, Loslager auch schräg,
Pendelstütze, Einspannung, Schiebehülse, Gelenk, Seil, Rolle), Balken und Rahmen mit
Maßketten, Kraftpfeilen mit Winkel, Momentbögen und Streckenlasten; Achsenkreuz mit
Drehsinn; Freikörperbilder (auch zweiteilig gegengleich); Krafteck und Parallelogramm;
Fachwerke mit Knoten- und Stabnummern, Schnittlinie und markierten Nullstäben;
zusammengesetzte Flächen mit Ausschnitten und Schwerpunkten; $N$-, $Q$-, $M$-Diagramme
untereinander mit gleicher $x$-Skala (positiv nach unten, ⊕/⊖, Eckwerte); Reibung mit
Klotz, schiefer Ebene, Seil um Scheibe. Räumliches nur vereinfacht: Quader und
achsparallele Rahmen in fester Schrägansicht oder in drei Ansichten. Grundlage ist die
Zeichen-Grundlage aus M6b.

## Benötigte Mathematik (und wo die App sie schon übt)

- Winkelfunktionen, Grad und Bogenmaß, Quadrant beim arctan: Bausteine in M6, Bilder in M6b.
- Vektoren in 2D und 3D, Betrag, Kreuzprodukt: M7.
- Lineare Gleichungssysteme mit 2 bis 6 Unbekannten, meist durch geschickte Wahl entkoppelt: M7/M9.
- Umstellen und allgemein mit Buchstaben rechnen („Zahlen erst am Schluss“): M3/M6.
- Polynome bis Grad 3 abschnittsweise, Ableiten, Integrieren, Extremum: M1, M9.
- e-Funktion und ln (Seilreibung), Ungleichungen (Haftgrenze, Selbstsperrung): M6.

## Ideen für die App (für den Plan von M11)

- **Kern ist ein Löser für Tragwerke in der Engine:** Beschreibung (Teile, Lager, Lasten,
  Maße als Vielfache von $a$) → Gleichungssystem → exakte Lösung mit Brüchen und Probe;
  aus derselben Beschreibung zeichnet die App das Bild. Daraus entstehen Lagerreaktionen,
  Bestimmtheit, Gelenkträger, Fachwerke und Schnittgrößen.
- **Baukasten für Abwechslung:** Lagerart (Fest–Los, Einspannung, Los schräg, Kragarm),
  Zahl und Art der Lasten (Einzelkraft, schräge Kraft, Einzelmoment, Rechteck- und
  Dreieckslast auch auf Teilstrecken), Zahl der Teile und Bereiche; Winkel und Längen aus
  „schönen“ Werten, damit nichts knapp an einer Grenze liegt.
- **Allgemein und mit Zahlen:** Viele Ergebnisse als Term in $F$, $a$, $q$ prüfbar mit der
  vorhandenen Mathe-Engine; Zahlenergebnisse mit Toleranz und Einheit.
- **Geführt:** je Schritt eine Auswahl, falsche Optionen aus den Fehlern oben, z. B. „Welches
  Freikörperbild stimmt?“, „Welche Gleichung ist $\sum M_A = 0$?“, „Welcher $M$-Verlauf gehört
  zum Balken?“, „Wo liegt $M_{max}$?“, „Zug oder Druck?“, „Haftet oder rutscht er?“.
- **Antippen im Bild:** Nullstäbe markieren, Ritterpunkt wählen, Stützstellen setzen.
- **Wissensfragen und Lernkarten:** Axiome, Lagertabellen (eben und räumlich), Begriffe
  (Stab, Balken, Bogen, Scheibe, Rahmen), Annahmen des idealen Fachwerks, Nullstab-Regeln,
  Bestimmtheit (notwendig, nicht hinreichend), Faustregel für Verläufe, Konventionen der
  Schnittufer, Haften und Gleiten.
- **Selbstkontrolle wie auf den Blättern:** Die „Lösungsstellen“-Idee (Ziffernfolge ohne
  Komma) könnte die App als kleinen Tipp anbieten, bevor sie die Lösung zeigt.
- **Nachschlagewerk (M12):** Lagertabellen, Schwerpunkttabelle der Grundflächen,
  Faustregel-Tabelle, Formeln für Bestimmtheit, alle Konventionen dieser Datei.
