# Physik: Themen, Aufgabenarten und Rechenschemata aus der Vorlesung

Stand: 12.11.2026. Der Nutzer hat am 12.11.2026 die Unterlagen zu „Physik MB1a“
hochgeladen: Einführung, Kinematik Teil 1 und 2, Kräfte (Folien mit Lücken, die in
der Vorlesung gefüllt werden), Übungsblätter 1 bis 4 mit Lösungen, eine Mindmap zum
Lösen von Aufgaben und eine einseitige Formelsammlung (in der Klausur erlaubt:
Taschenrechner und ein eigenes Blatt). Alle Seiten wurden durchgesehen. Die
Unterlagen selbst liegen nicht im Repo (Urheberrecht, siehe CLAUDE.md). Hier steht in
eigenen Worten, **welche Arten** es gibt, **nach welchem Schema** man sie löst, welche
**Fehler** naheliegen oder in den Lösungen vorkamen und **wo** sie in der App
hinkommen. Aufgaben entstehen immer aus der Engine mit eigenen Zahlen und eigenen
Situationen.

Spalte „Wohin“: M10 = Fach Physik (docs/ROADMAP.md), M7 = Vektoren, M6b = Bilder.
Die Gliederung von M10 in Tätigkeiten steht unten unter „Vorschlag für M10“; sie
wird erst im Plan zu M10 festgelegt.

## Was die Vorlesung abdeckt

| Teil | Themen |
| --- | --- |
| Einführung | SI-Basisgrößen und abgeleitete Einheiten, Vorsätze ($10^{24}$ bis $10^{-24}$, wichtig: G, M, k, h, c, m, µ, n, p), Einheiten umrechnen, Temperaturskalen, Messunsicherheit (zufällig/systematisch, Mittelwert, Standardabweichung, $1\sigma$/$2\sigma$/$3\sigma$), signifikante Stellen, Skalare und Vektoren, Vektorrechnung (wie Mathe), Polar-, Zylinder- und Kugelkoordinaten, Massenpunkt und Bezugssystem |
| Kinematik 1 | mittlere und momentane Geschwindigkeit und Beschleunigung, $x$-$t$-, $v$-$t$-, $a$-$t$-Diagramme (Steigung und Fläche), Ableiten und Integrieren mit Anfangswert, gleichförmige und gleichmäßig beschleunigte Bewegung, freier Fall, senkrechter Wurf; Drehbewegung: Winkel im Bogenmaß, $\omega$, $\alpha$, Periode und Frequenz, Bahngeschwindigkeit, Tangential- und Radialbeschleunigung, Gegenüberstellung Translation und Rotation |
| Kinematik 2 | Drehbewegung in Vektorform ($\vec v = \vec\omega \times \vec r$), Überlagerung von Bewegungen, waagerechter und schiefer Wurf in Komponenten, Bahngleichung, Wurfweite, Gipfelhöhe, Wurf von erhöhter Stelle (bester Winkel unter 45°), Vorgehen bei Würfen in fünf Schritten |
| Kräfte | Impuls und Impulserhaltung, Newtons drei Axiome, Masse und Gewicht, Freischneiden, Überlagerung von Kräften, Gleichgewicht in Komponenten (Vorgehen in sechs Schritten mit Plausibilitätsprüfung), Kraftstoß, Gravitationsgesetz, schiefe Ebene, Normalkraft, Haft-, Gleit- und Rollreibung, Reibung in Flüssigkeiten, Seilkräfte (Körper über Rolle, Kette von Körpern), Federn (Hooke, parallel und in Reihe, Spannung und Dehnung), Trägheitskräfte (d'Alembert, Aufzug), Zentripetal- und Zentrifugalkraft |
| Noch ohne Unterlagen | laut Inhaltsübersicht später im Semester: Arbeit, Energie, Leistung; Stöße; Schwingungen (frei, gedämpft, erzwungen, Resonanz) und Wellen. Kommen in diese Datei, sobald der Nutzer sie hochlädt |

Die Übungsblätter: Blatt 1 Einheiten, Genauigkeit und gleichförmige Bewegung; Blatt 2
gleichmäßig beschleunigte Bewegung, Fall, Wurf, Einholen, erste Drehbewegungen;
Blatt 3 Diagramme, Ableiten von Ortsfunktionen, Bogenmaß, Drehbewegung; Blatt 4
Bewegungen in Vektorform, waagerechter und schiefer Wurf (eine Aufgabe als frühere
Klausuraufgabe gekennzeichnet). Zu Kräften gibt es noch kein Übungsblatt.

## Grundlagen: Einheiten, Messen, Runden

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Einheiten umrechnen, auch in mehreren Schritten und mit Fremdeinheiten (Meile, Zoll, km/h, U/min) | Umrechnungsfaktor als Bruch mit Wert 1 schreiben, so ausrichten, dass sich die Einheiten kürzen, dann ausrechnen | Faktor falsch herum (3,6 malgenommen statt geteilt); Zwischeneinheit vergessen (Minuten nicht in Sekunden) | M10 |
| Flächen und Volumen umrechnen (mm², cm³, Hektoliter) | Faktor der Länge quadrieren bzw. hoch drei nehmen | Faktor nicht potenziert | M10 |
| Vorsätze | Vorsatz durch Zehnerpotenz ersetzen, Potenzen verrechnen, passenden neuen Vorsatz wählen | µ und m verwechselt, Exponent um 3 daneben | M10 |
| Auf Basiseinheiten zurückführen, Einheit einer Formel prüfen | Definitionsgleichung einsetzen ($F = ma$, $W = Fs$, $P = W/t$), kürzen | – | M10 |
| Temperatur zwischen °C, K und °F | $T/\mathrm{K} = \vartheta/{}^\circ\mathrm{C} + 273{,}15$; $\vartheta_F = \frac95 \vartheta_C + 32$ | 273 statt 273,15; Faktor oder 32 an der falschen Stelle | M10 |
| Genauigkeit einer Angabe ablesen | die letzte angegebene Stelle bestimmt den Bereich: ± eine halbe Einheit dieser Stelle | ± eine ganze Einheit | M10 |
| Signifikante Stellen zählen und Ergebnis runden | führende Nullen zählen nicht, nachgestellte nach dem Komma schon; Ergebnis so genau wie die ungenaueste Angabe; erst am Ende runden; bei Mehrdeutigkeit Zehnerpotenz-Schreibweise | führende Nullen mitgezählt; $1$ und $1{,}000$ gleichgesetzt; zu früh gerundet; Anzeige des Rechners übernommen | M10 |
| Messreihe auswerten | Mittelwert, Abweichungen, Quadrate, Summe durch $n-1$, Wurzel; Ergebnis $\bar x \pm k\sigma$ sinnvoll gerundet | durch $n$ geteilt; Wurzel vergessen; Abweichungen ohne Quadrat (heben sich auf) | M10 |
| Zufällige oder systematische Abweichung? (Wissensfrage) | systematisch: immer in dieselbe Richtung (Eichung, schräges Ablesen); zufällig: streut, wird durch Mitteln kleiner | geglaubt, Mitteln beseitige auch systematische Fehler | M10 (Wissensfragen) |
| Vektoren: Summe, Vielfaches, Betrag, Einheitsvektor, Skalarprodukt, Winkel, Projektion, Kreuzprodukt, senkrecht/parallel | wie in Mathe (docs/AUFGABENARTEN.md) | Skalarprodukt als Vektor; Vorzeichen der mittleren Komponente beim Kreuzprodukt; durch den Betrag zum Quadrat geteilt | M7 (Mathe), in Physik nur anwenden |
| Koordinaten umrechnen (polar, Zylinder, Kugel) | Formeln einsetzen; zurück: $r = \sqrt{x^2 + y^2}$, Winkel nach Quadrant | sin und cos bei $\theta$ vertauscht; Quadrant übersehen | M7 oder M9 (Mathe) |

## Bewegungen geradeaus (Kinematik)

Grundformeln bei konstanter Beschleunigung (die Engine rechnet sie, die App zeigt sie
auf Lernkarten): $v = v_0 + at$, $x = x_0 + v_0 t + \frac12 a t^2$,
$v^2 = v_0^2 + 2a(x - x_0)$, $\bar v = \frac{v_0 + v}{2}$; beim Fall $a = -g$ mit der
Achse nach oben, $g = 9{,}81\,\mathrm{m/s^2}$.

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Mittlere Geschwindigkeit aus zwei Orten und einer Zeitspanne | Achse festlegen, $\Delta x = x_2 - x_1$ mit Vorzeichen, durch $\Delta t$; negativ heißt gegen die Achse | Betrag statt Differenz; $x_1 - x_2$; Weg und Verschiebung gleichgesetzt | M10 |
| Fahrt in Abschnitten mit verschiedenen Geschwindigkeiten | je Abschnitt $t = s/v$, Zeiten addieren; mittlere Geschwindigkeit = Gesamtweg durch Gesamtzeit | Mittelwert der Geschwindigkeiten statt Gesamtweg durch Gesamtzeit; Einheiten gemischt | M10 |
| Messpunkte → Gerade → Bewegungsgleichung → Wert vorhersagen | Steigung als Geschwindigkeit, Achsenabschnitt als Startort, $x(t) = vt + x_0$ | Startort vergessen | M10 |
| Zeit, Weg oder Endgeschwindigkeit beim Beschleunigen oder Bremsen | Einheiten in SI, passende Grundformel wählen (die, in der die gesuchte und nur bekannte Größen stehen), allgemein umstellen, einsetzen | Bremsen mit $a > 0$; $\frac12$ vergessen; $v^2 = 2ax$ ohne $v_0$; km/h nicht umgerechnet; Faktorfragen: doppelte Geschwindigkeit gibt vierfachen Bremsweg, nicht doppelten | M10 |
| Freier Fall aus der Ruhe | $t = \sqrt{2h/g}$, $v = gt = \sqrt{2gh}$ | Wurzel vergessen; Masse eingesetzt (ablenkende Angabe) | M10 |
| Senkrechter Wurf nach oben | Achse nach oben, $a = -g$; Gipfel bei $v = 0$: $t_s = v_0/g$, $h = \frac{v_0^2}{2g}$; Rückkehr nach $2t_s$ mit $-v_0$ | $+g$ bei Achse nach oben; Steigzeit und Flugzeit verwechselt; im Gipfel $a = 0$ | M10 |
| Fallhöhe aus der Aufprallgeschwindigkeit und umgekehrt | Zeit aus $v = -gt$ in $y(t)$ einsetzen, ergibt $h = \frac{v^2}{2g}$ | Vorzeichen der Geschwindigkeit nach unten | M10 |
| Einholen oder Treffen zweier Körper | ein gemeinsamer Nullpunkt, beide Ortsfunktionen aufstellen, gleichsetzen, quadratische Gleichung in $t$ lösen, sinnvolle Lösung wählen und die andere deuten | Startort mit falschem Vorzeichen; Zeitverschiebung vergessen; negative oder unpassende Zeit behalten | M10 |
| Bewegung in mehreren Abschnitten (Fall, Bremsen, gleichmäßiges Sinken) | Skizze, je Abschnitt Art der Bewegung und Größen, Endwerte eines Abschnitts sind Startwerte des nächsten | Startwert nicht übernommen; zu viele, einander widersprechende Angaben nicht bemerkt | M10 |
| Diagramme ineinander umwandeln ($x$ → $v$ → $a$ über die Steigung, zurück über die Fläche) | abschnittsweise: konstante Steigung gibt eine Stufe, Knick gibt einen Sprung; Fläche unter $v(t)$ ist der Weg | Fläche und Steigung verwechselt; Startwert beim Integrieren vergessen | M10 mit M6b (Bilder) |
| Diagramm und Situation zuordnen (Wissensfrage) | auf Vorzeichen, waagerechte Stücke, Geraden und Grenzwerte achten; gleiche Beschleunigung heißt parallele $v$-$t$-Geraden | Steigung von $x$-$t$ als Beschleunigung gelesen | M10 mit M6b |
| Ortsfunktion als Polynom: mittlere und momentane Geschwindigkeit, Beschleunigung | $\bar v = \frac{x(t_2) - x(t_1)}{t_2 - t_1}$, $v = \dot x$, $a = \ddot x$ | mittlere und momentane Geschwindigkeit verwechselt | M10 (nutzt „Ableiten“) |
| Geschwindigkeit als Funktion (auch als Vektor): einsetzen, ableiten, integrieren mit Startort | komponentenweise; Integrationskonstante = Startwert | Konstante vergessen | M10 (nutzt „Ableiten“, Integrieren aus M9) |

## Würfe

Formeln (Start im Ursprung, Winkel $\varphi$ gegen die Waagerechte):
$v_{0x} = v_0 \cos\varphi$, $v_{0z} = v_0 \sin\varphi$, $x = v_0 \cos\varphi \cdot t$,
$z = -\frac g2 t^2 + v_0 \sin\varphi \cdot t$, Bahngleichung
$z(x) = -\frac{g}{2 v_0^2 \cos^2\varphi} x^2 + \tan\varphi \cdot x$, Steigzeit
$t_s = \frac{v_0 \sin\varphi}{g}$, Gipfelhöhe $h_s = \frac{v_0^2 \sin^2\varphi}{2g}$,
Wurfweite $x_W = \frac{v_0^2 \sin 2\varphi}{g}$ (größte bei 45°, nur bei gleicher
Abwurf- und Landehöhe).

**Achtung:** In der hochgeladenen Formelsammlung fehlt bei der Gipfelhöhe der
Faktor $\frac12$ (dort steht $\frac{v_0^2 \sin^2\varphi}{g}$; die Zeile davor ergibt
$-\frac12 X + X = \frac12 X$). Die App rechnet mit der richtigen Formel; der Nutzer
ist informiert. Auch die Lösungen der Übungsblätter enthalten einzelne Tippfehler
(Vorzeichen, Komma, Einheit von $g$); richtig ist, was die Engine nachrechnet.

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Vorgehen bei jedem Wurf (Schema der Vorlesung) | Situation ansehen, Koordinatensystem wählen, Bewegung in waagerecht (gleichförmig) und senkrecht (Fall) aufteilen und Angaben zuordnen, Richtungen getrennt rechnen, verbunden wird immer über die Zeit | Richtungen vermischt | M10 (Schritte im geführten Modus) |
| Waagerechter Wurf von einer Höhe | Fallzeit aus der Höhe $t = \sqrt{2h/g}$, Weite $d = v_0 t$; Aufprallgeschwindigkeit aus beiden Komponenten | Weite mit der Höhe statt mit der Zeit gerechnet | M10 |
| Waagerechter Wurf mit Ziel oder Hindernis: kleinste und größte Anfangsgeschwindigkeit | Zeit aus der einen Richtung holen, in die andere einsetzen; je Grenze einmal; Toleranz des Ziels ergibt einen Bereich für $v_0$ | nur eine Grenze bestimmt | M10 |
| Abwurfwinkel und Komponenten aus Betrag und einer Komponente | $\varphi = \arcsin\frac{v_{0z}}{v_0}$, $v_{0x} = v_0 \cos\varphi$ | sin und cos vertauscht; Rechner im Bogenmaß | M10 |
| Anfangsgeschwindigkeit aus einem Ort zu einer Zeit | $v_{0x} = \frac{\Delta x}{t}$, $v_{0z} = \frac{\Delta z}{t} + \frac12 g t$ | $v_{0z} = \frac{\Delta z}{t}$ | M10 |
| Wurfweite und Gipfelhöhe beim schiefen Wurf | Komponenten bilden, Formeln anwenden oder herleiten (Gipfel bei $v_z = 0$, Weite aus $z = 0$ mit $x \ne 0$) | $\sin\varphi$ statt $\sin 2\varphi$; Quadrat am Sinus vergessen; $\frac12$ bei $h_s$ vergessen; triviale Lösung $x = 0$ genommen | M10 |
| Schiefer Wurf mit anderer Landehöhe | quadratische Gleichung in $t$, positive Lösung; keine Symmetrie, keine Weitenformel | Weitenformel trotzdem benutzt; mit gerundetem Zwischenwert weitergerechnet | M10 (Stufe „Klausurniveau“) |
| Verständnisfragen zum Wurf | $v_x$ bleibt gleich, $v_z$ ändert sich gleichmäßig, Beschleunigung überall $(0, -g)$, auch im Gipfel; Masse spielt ohne Luftwiderstand keine Rolle; von erhöhter Stelle liegt der beste Winkel unter 45° | „im Gipfel ist $a = 0$“; „$v_x$ wird kleiner“; „schwere Körper fallen schneller“ | M10 (Wissensfragen) |

## Drehbewegungen

Formeln: $\theta = \frac sr$ in rad, eine Umdrehung $= 360^\circ = 2\pi$ rad,
$\omega = \dot\theta$, $\alpha = \dot\omega$, $\omega = \frac{2\pi}{T} = 2\pi f$,
$v = r\omega$, $a_t = r\alpha$, $a_r = \frac{v^2}{r} = \omega^2 r$; bei konstantem
$\alpha$ dieselben Formeln wie geradeaus ($\omega = \omega_0 + \alpha t$,
$\theta = \omega_0 t + \frac12 \alpha t^2$, $\omega^2 = \omega_0^2 + 2\alpha\theta$).

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Grad, Bogenmaß und Umdrehungen umrechnen; Bogenlänge | $\theta = \varphi \cdot \frac{2\pi}{360^\circ}$, $N = \frac{\theta}{2\pi}$, $s = r\theta$ | Durchmesser statt Radius; mit Grad gerechnet; Umdrehungen und rad verwechselt | M10 |
| Winkelgeschwindigkeit periodischer Drehungen | $\omega = \frac{2\pi}{T}$, $T$ in Sekunden | $\omega = f$ statt $2\pi f$; Periode nicht in Sekunden | M10 |
| Drehzahl in U/min | in rad/s mit $\frac{2\pi}{60}$; oder Umdrehungen direkt über die mittlere Drehzahl mal Zeit | $2\pi$ oder 60 vergessen | M10 |
| Gleichmäßig beschleunigte Drehung aus der Ruhe | $\omega = \alpha t$, $\theta = \frac12 \alpha t^2$, $N = \frac{\theta}{2\pi}$, $f = \frac{\omega}{2\pi}$ | wie geradeaus ($\frac12$ vergessen) | M10 |
| Anfangswinkelgeschwindigkeit aus dem Winkel in einem Zeitabschnitt | $\theta = \omega_0 t + \frac12 \alpha t^2$ nach $\omega_0$ umstellen; Vorlaufzeit $t = \frac{\omega_0}{\alpha}$ | – | M10 |
| Drehwinkel als Funktion der Zeit gegeben | Koeffizientenvergleich mit $\frac12 \alpha t^2$ oder ableiten, dann $v = r\omega$, $a_t = r\alpha$ | $\alpha$ gleich dem Koeffizienten statt doppelt so groß | M10 |
| Ketten- und Zahnradtrieb | gleiche Bahngeschwindigkeit am Umfang: $\omega_1 r_1 = \omega_2 r_2$ | gleiches $\omega$ angenommen | M10 |
| Drehung und Fall oder Wurf gekoppelt | Zeit aus der Bewegung geradeaus, dann Drehwinkel oder Umdrehungen in dieser Zeit | ablenkende Angaben (Masse, falsche Höhe) benutzt | M10 (Stufe „Klausurniveau“) |
| Verständnisfragen | alle Punkte eines starren Körpers haben dasselbe $\omega$, außen größeres $v$; $a_r$ zeigt zur Mitte; gegen den Uhrzeigersinn positiv | gleiche Bahngeschwindigkeit für alle Punkte; $a_r = \frac vr$ | M10 (Wissensfragen) |

## Kräfte

Formeln: $\vec p = m\vec v$, $\vec F = \frac{d\vec p}{dt}$, $\vec F_{res} = m\vec a$,
$\vec F_{A \to B} = -\vec F_{B \to A}$, Gleichgewicht $\sum F_x = 0$, $\sum F_y = 0$,
Kraftstoß $\Delta p = F \Delta t$, $F_G = G\frac{m_1 m_2}{r^2}$, schiefe Ebene
$F_H = F_G \sin\alpha$ und $F_N = F_G \cos\alpha$, Reibung $F_{RH} \le \mu_H F_N$,
$F_{RG} = \mu_G F_N$, $F_{RR} = \mu_R F_N$ (meist $\mu_H > \mu_G > \mu_R$), Haften auf
der Schräge solange $\tan\alpha \le \mu_H$, Feder $F = -kx$ (in der Technik $D$),
parallel $D = \sum D_i$, in Reihe $\frac1D = \sum \frac{1}{D_i}$, Trägheitskraft
$\vec F_T = -m\vec a$, Zentripetalkraft $F_Z = m\frac{v^2}{r} = m\omega^2 r$.

| Art | Schema (kurz) | Typische Fehler | Wohin |
| --- | --- | --- | --- |
| Vorgehen bei Kräften (Schema der Vorlesung, sechs Schritte) | Körper freischneiden, alle Kräfte einzeichnen, Achsen wählen (an der Schräge parallel und senkrecht zur Ebene), Kräfte zerlegen, Newton je Richtung, lösen, Plausibilität prüfen (Einheit, Grenzfälle) | Kräfte vergessen oder doppelt; actio und reactio am selben Körper | M10 (Schritte im geführten Modus) |
| Freikörperbild: welche Kräfte wirken? (Auswahl oder Pfeile antippen) | nur Kräfte auf den freigeschnittenen Körper; Gewicht und Normalkraft sind kein Paar nach dem 3. Axiom | Gewicht und Normalkraft als actio und reactio; Kraft in Bewegungsrichtung bei konstanter Geschwindigkeit | M10 mit M6b |
| Kraft, Masse oder Beschleunigung; Brems- oder Antriebskraft aus Weg oder Zeit | Einheiten in SI, $a$ aus der Bewegungsgleichung, $F = ma$; Masse aus Gewicht $m = F_G/g$ | km/h nicht umgerechnet; Masse und Gewicht verwechselt; $g$ vergessen oder doppelt | M10 |
| Gewicht auf anderen Himmelskörpern, $g$ aus dem Gravitationsgesetz | $g = G\frac{M}{R^2}$; Masse bleibt, Gewicht ändert sich | „Masse ist auf dem Mond kleiner“; $r$ nicht quadriert | M10 |
| Aufhängung an zwei Seilen | Freikörperbild am Knoten, Seilkräfte zerlegen, zwei Gleichungen, zwei Unbekannte lösen | sin und cos vertauscht; Winkel gegen die falsche Achse | M10 (nutzt Gleichungssysteme aus M9) |
| Kräfte addieren und zerlegen (Kräfteparallelogramm) | komponentenweise oder mit Kosinussatz $F = \sqrt{F_1^2 + F_2^2 + 2F_1F_2\cos\gamma}$, Richtung über arctan | Beträge einfach addiert | M10 |
| Schiefe Ebene: Hangabtrieb, Normalkraft; rutscht der Körper? Beschleunigung beim Gleiten | Zerlegung; $\tan\alpha$ mit $\mu_H$ vergleichen; $a = g(\sin\alpha - \mu_G\cos\alpha)$ | sin und cos vertauscht; $F_N = mg$ auch auf der Schräge; $\mu_H$ statt $\mu_G$ beim Gleiten | M10 |
| Zusätzliche Kraft am Hang oder auf der Ebene | Achsen entlang der Schräge, Newton in Hangrichtung; Richtung der Bewegung über das Vorzeichen; Normalkraft $mg \pm F_\perp$ bei Drücken oder Ziehen | Normalkraft nicht angepasst | M10 |
| Reibung bei wachsender Zugkraft | Grenze $\mu_H F_N$ ausrechnen; darunter ist die Reibung gleich der Zugkraft (Körper bleibt stehen), darüber gilt $\mu_G F_N$ | Haftreibung immer gleich $\mu_H F_N$ | M10 |
| Körper auf dem Tisch, über eine Rolle mit hängendem Körper verbunden (auch mit Reibung) | je Körper ein Freikörperbild, gleiche Beschleunigung und gleiche Seilkraft; $a = \frac{m}{M + m} g$ ohne Reibung | Seilkraft = Gewicht des hängenden Körpers; $a = g$; eine Masse vergessen | M10 |
| Kette von Körpern an einem Seil | $a = \frac{F}{\sum m}$; Seilkraft an einer Stelle = Masse dahinter mal $a$ | falsche Teilmasse | M10 |
| Federn | Auslenkung oder Kraft mit $F = kx$; Ersatzfeder parallel oder in Reihe | Formeln für parallel und Reihe vertauscht; Vorzeichen; Spannkraft eines beidseitig gezogenen Gummis doppelt gerechnet | M10 (nutzt „Brüche“) |
| Aufzug und Trägheitskräfte | scheinbares Gewicht $m(g \pm a)$; d'Alembert: $\sum \vec F + \vec F_T = 0$ | Vorzeichen von $a$ je Fahrtrichtung | M10 |
| Kreisbewegung | $F_Z = m\frac{v^2}{r}$, Umrechnung $v = \omega r$ | $\frac vr$ statt $\frac{v^2}{r}$; Zentrifugalkraft im ruhenden System als echte Kraft | M10 |
| Impuls und Kraftstoß | $p = mv$; $\Delta p = F\Delta t$; Impulserhaltung (Stöße folgen später) | Vorzeichen der Richtung | M10 |
| Verständnisfragen (Axiome, Reibung, Stick-Slip, Stribeck-Kurve, Reibung in Flüssigkeiten) | Wissenskarten; Bewegung braucht keine Kraft, Änderung der Bewegung schon | „ohne Kraft bleibt der Körper stehen“ | M10 (Wissensfragen) |

## Vorgehen beim Lösen (Mindmap der Vorlesung, in eigenen Worten)

1. **Verstehen:** Was ist gegeben, was gesucht, welche Bedingungen gibt es (auch
   versteckte)? Skizze, alle Größen mit Zeichen benennen.
2. **Plan:** ähnliche Aufgabe? Passende Formeln? In Teilaufgaben zerlegen; Sonderfälle
   ansehen.
3. **Ausführen:** jeden Schritt prüfen; erst allgemein ohne Zahlen umstellen, Zahlen
   zuletzt einsetzen.
4. **Rückschau** (in der Vorlesung besonders betont): plausibel? Grenzfälle? Einheit?
   Anderer Weg?

Daraus der geführte Modus in Physik (Vorschlag): gegebene und gesuchte Größen
zuordnen → Achse und Nullpunkt wählen → Art der Bewegung oder Kräfte je Richtung →
passende Formel wählen → allgemein umstellen (Mathe-Engine wie bei „Gleichungen
umstellen“) → Einheiten umrechnen und einsetzen → prüfen (Vorzeichen, Größenordnung,
bei zwei Lösungen die sinnvolle wählen). Jede falsche Option kommt aus der Liste der
typischen Fehler oben.

## Schreibweise der Vorlesung

Vektoren mit Pfeil, Beträge ohne Pfeil; Index 0 für Anfangswerte ($x_0$, $v_0$,
$\omega_0$), oft $t_0 = 0$; Querstrich für Mittelwerte ($\bar v$); Punkte für
Zeitableitungen ($\dot x$, $\ddot x$) neben $\frac{dx}{dt}$; beim Wurf die
Höhe als $z$ (Folien) oder $y$ (Übungsblätter), Winkel $\varphi$ (Folien) oder
$\alpha$ (Übungsblätter), Drehwinkel $\theta$; $x_W$ Wurfweite, $h_s$ und $t_s$
Gipfel; Kräfte $F_G$, $F_N$, $F_H$, $F_{RH}$/$F_{RG}$/$F_{RR}$ mit
$\mu_H$/$\mu_G$/$\mu_R$, $F_F$ Feder, $F_T$ Trägheit, $F_Z$ zentripetal, Seilkraft
$F_S$; Achse $x$ nach rechts, nach oben positiv, gegen den Uhrzeigersinn positiv;
Dezimalkomma, Malpunkt, Einheiten als Bruch (m/s²). In der App wird je Aufgabe eine
Schreibweise durchgehalten; eingetippte Antworten erkennen beide Varianten.

## Was die App dafür neu braucht

- **Größen mit Einheiten:** Zahl und Einheit zusammen, Umrechnen, Vorsätze, Prüfen
  einer eingetippten Antwort mit beliebiger passender Einheit (z. B. km/h oder m/s)
  und Toleranz wie bei Chemie (docs/CHEMIE.md).
- **Runden und signifikante Stellen** als eigener Prüfschritt.
- **Physikalische Situationen als Baukasten** (Bewegungsart, Abschnitte, Achsrichtung,
  gegebene und gesuchte Größen, ablenkende Angaben), damit Aufgaben einer Stufe sich
  nicht nur in den Zahlen unterscheiden (Kennzahlen aus docs/PLAN-M2b.md).
- **Bilder** (selbst gezeichnet, mit M6b): $x$-$t$-, $v$-$t$-, $a$-$t$-Diagramme
  übereinander, Tangente als Momentangeschwindigkeit, Wurfparabel mit Zerlegung von
  $v_0$, Kreis mit $\theta$, $v$, $a_t$, $a_r$, Freikörperbild zum Antippen, schiefe
  Ebene mit Zerlegung, Seile an einer Last, Körper und Rolle, Federn parallel und in
  Reihe, Reibungskraft gegen Zugkraft.
- **Mathe aus anderen Tätigkeiten:** Umstellen (vorhanden, mit Zeichen der Physik seit
  M6 4b-1), Ableiten (vorhanden), quadratische Gleichungen mit Auswahl der sinnvollen
  Lösung, Integrieren mit Anfangswert und lineare Gleichungssysteme (M9), Vektoren
  (M7), Winkelfunktionen und ihre Umkehrungen, Bogenmaß.

## Vorschlag für M10 (wird im Plan zu M10 entschieden)

Tätigkeiten im Fach Physik, je mit Bausteinen und Stufen wie in M6:

1. **Einheiten und Messwerte:** umrechnen (auch Flächen, Volumen, Winkel, Drehzahl),
   Vorsätze, Basiseinheiten, Temperatur, signifikante Stellen, Messreihen.
2. **Bewegungen berechnen:** gleichförmig, beschleunigt, Fall, senkrechter Wurf,
   Einholen, mehrere Abschnitte; Stufe 5 mit mehreren Phasen und zwei Lösungen.
3. **Diagramme lesen:** Steigung und Fläche, umwandeln, Situation zuordnen (mit M6b).
4. **Würfe:** waagerecht, schief, andere Landehöhe, Ziel und Hindernis.
5. **Drehbewegungen:** Bogenmaß, $\omega$, $\alpha$, Bahngrößen, Zahnräder, gekoppelt
   mit Fall.
6. **Kräfte:** Freikörperbild, Newton, Gleichgewicht, schiefe Ebene, Reibung, Seile
   und Rollen, Federn, Aufzug, Kreisbewegung.

Dazu Wissensfragen, Lernkarten, Nachschlagewerk (M12) mit der Formelsammlung des
Fachs und später eine Probeklausur. Arbeit, Energie, Stöße und Schwingungen kommen
dazu, sobald die Unterlagen da sind.
