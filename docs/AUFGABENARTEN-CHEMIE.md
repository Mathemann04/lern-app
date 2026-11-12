# Aufgabenarten und Rechenschemata aus den Unterlagen Chemie 1

Stand: 12.11.2026. Der Nutzer hat für „Unterlagen sichten“ (docs/ROADMAP.md) alle
Chemie-Unterlagen hochgeladen, die es gibt: die Übungsblätter „Atommodelle und
Trends“ und „Chemische Bindungen“ (je mit Musterlösung), das Übungsblatt
„Zwischenmolekulare Kräfte und Stöchiometrie, Teil 1“ (mit Musterlösung) und die
beiden Altklausuren (Sommer 2025, Winter 2025/26). Die Skripte waren schon bei S10
vollständig durchgesehen (Inhaltslandkarte in [CHEMIE.md](CHEMIE.md) §2).

Hier steht in eigenen Worten, **welche Arten** von Aufgaben es gibt, **nach
welchem Schema** man sie löst, welche **Fehler** typisch sind und **wo** sie in
der App stehen. Keine Aufgabentexte, keine Zahlen und keine Stoffe aus den
Unterlagen; die Unterlagen selbst liegen nie im Repo (CLAUDE.md, CHEMIE.md §9).
Ausgeschlossene Stoffe und Zahlen der Unterlagen stehen in CHEMIE.md §9.

Spalte „In der App“: Thema → Unterthema oder Rechenart. „neu“ heißt: noch nicht
vorhanden, mit Ziel (Schritt in docs/PLAN-M4.md).

## Ergebnis in Kürze

- **Teil 1 der Klausur (Aufgaben 1 bis 5)**: Jede Aufgabenart der Übungsblätter
  und der Altklausuren hat in der App schon Fragen oder Rechnungen, meist auf
  allen drei Stufen. Die Durchsicht fand **eine** kleine Lücke: die
  Ladungsbilanz einer Formel mit mehr als zwei Ionensorten (Abschnitt
  „Ionenbindung“).
- **Unterschied zur Klausur**: In der Klausur schreibt man selbst (Formel,
  Lewis-Formel, Gleichung, Ausdruck für K). Die App lässt dort meist wählen. Die
  Eingaben zum Selbst-Aufstellen sind als N2b bis N2f geplant (PLAN-M4.md, „Nach
  Teil 1 der Klausur“).
- **Teil 2 der Klausur (Aufgaben 6 und 7)**: Säure-Base und Redox fehlen noch,
  wie geplant (N3, N4). Ohne Skript lassen sie sich nicht genau zuschneiden; die
  Arten aus den Altklausuren stehen unten schon als Vorlage.
- **Punkte**: Die beiden Altklausuren verteilen die 50 Punkte etwas anders (im
  Winter mehr Gewicht auf Säure-Base und Redox, weniger auf Aufbau der Materie).
  Die Probeklausur folgt dem Winter (PLAN-M4.md, „Probeklausur“).

## 1 Aufbau der Materie (Klausuraufgabe 1)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Atommodelle beschreiben und je eine Grenze nennen | Modell → was es erklärt → was es nicht erklärt (kein Inneres; kein Kern; keine stabilen Atome und keine Linien; nur für Wasserstoff genau) | Grenzen zweier Modelle vertauscht | Atombau → Atommodelle (Fragen, Ordnen nach der Zeit) |
| Streuversuch deuten | fast leere Hülle → die meisten Teilchen fliegen durch; kleiner positiver Kern → Abstoßung, selten starke Ablenkung oder Umkehr; Größenordnungen Atom und Kern | Ablenkung durch Elektronen erklärt; Kern als groß angenommen | Atombau → Atommodelle |
| Ladung der Elementarteilchen | Proton +, Elektron −, Neutron 0 | Neutron und Proton vertauscht | Atombau (Fragen, Zuordnen), Klausuraufgabe 1 |
| Massenzahl, Ordnungszahl, Isotop erklären | Ordnungszahl = Protonen; Massenzahl = Protonen + Neutronen; Isotope: gleiche Protonen-, andere Neutronenzahl | Massenzahl als Neutronenzahl; Isotope mit anderer Protonenzahl | Atombau, Klausuraufgabe 1 |
| Protonen, Neutronen, Elektronen aus einem Kernsymbol, auch bei Ionen | p = unten; n = oben − unten; e = p − Ladung | Massenzahl als Neutronenzahl; Ladung mit falschem Vorzeichen verrechnet | Atombau → Rechnung `particles` (alle Stufen), Klausuraufgabe 1 |
| Schale und Orbital unterscheiden | Schale = alle Zustände mit gleichem n; Orbital = Aufenthaltsraum, keine Bahn, höchstens zwei Elektronen | Orbital als Kreisbahn | Elektronen (Fragen) |
| Valenzelektron erklären, Valenzkonfiguration wählen | äußerste besetzte Schale (Hauptgruppen) | innere Schale oder volle Konfiguration gewählt | Elektronen → `valenz`, Klausuraufgabe 1 |

## 2 Elektronen in der Hülle (Übung Atommodelle, Klausuraufgabe 1)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Konfiguration eines Atoms aufstellen, Valenzelektronen zählen | Besetzungsreihenfolge (Energieleiter), ab Kalium mit Edelgaskern | 3d vor 4s gefüllt; Elektronen falsch gezählt | Elektronen → `konfiguration` |
| Konfiguration eines Ions, gleiches Edelgas benennen | Kation: Elektronen von der äußersten Schale weg; Anion: auffüllen; Vergleich mit dem Edelgas gleicher Elektronenzahl | Elektronen addiert statt abgezogen | Elektronen → `ion-konfiguration` |
| Übergangsmetall-Ion und Ausnahmen (Cr, Cu) | bei Kationen zuerst die 4s-Elektronen abgeben; Cu und Cr mit halb- oder vollbesetzter d-Unterschale | zuletzt eingefüllte (3d) zuerst abgegeben; Ausnahme übersehen | Elektronen → `ion-konfiguration`, `konfiguration` (Vertiefung, Klausurniveau) |
| Element aus einer Valenzkonfiguration erkennen, mit Ordnungszahl, Periode, Gruppe | höchstes n → Periode; Valenzelektronen → Gruppe; Elektronen zählen → Ordnungszahl | Periode aus der Zahl der Valenzelektronen | Elektronen → `element-aus-valenz`, PSE → `steckbrief-rueckwaerts` |
| Kapazitäten von Unterschalen und Schalen | s 1, p 3, d 5, f 7 Orbitale, je zwei Elektronen; Schale 2n² | n² statt 2n²; Unterschalen der Schale vergessen | Elektronen → `schale`, `unterschale` |
| Kästchen nach Hund besetzen, ungepaarte Elektronen zählen | erst einzeln mit gleichem Spin, dann paaren | zu früh gepaart | Elektronen → `kaestchen` (zum Antippen, N2a) |
| Besetzungen nach Pauli und Hund beurteilen | gleiche Spins in einem Kästchen → Pauli verletzt; Paar vor Einzelbesetzung → nicht der Grundzustand | „nicht Grundzustand“ mit „verboten“ verwechselt | Elektronen (Bildfragen), Denkfehler zu Pauli und Hund |

## 3 Periodensystem und Trends (Klausuraufgabe 2)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Was haben Elemente einer Periode bzw. Gruppe gemeinsam? | Periode: gleiche Zahl besetzter Schalen; Gruppe: gleiche Zahl Valenzelektronen → ähnliche Eigenschaften | Periode und Gruppe vertauscht | PSE (Fragen), Klausuraufgabe 2 |
| Welche Orbitale füllt ein Block? | Gruppen 1–2: s; 13–18: p; Nebengruppen: d | p und d vertauscht | PSE (Fragen), Klausuraufgabe 2 |
| Ordnungszahl deuten | Zahl der Protonen | Neutronen oder Schalen | PSE, Atombau |
| Trend in Worten (Radius, Ionisierungsenergie, Elektronegativität) | in der Periode nach rechts: Kernladung wirkt stärker → Radius kleiner, IE und EN größer; in der Gruppe nach unten umgekehrt | Richtung verdreht; Radius „wächst mit der Ordnungszahl“ | Trends (Fragen, Bild mit Pfeilen), Klausuraufgabe 2 |
| Elemente nach einer Größe ordnen und begründen | Lage im PSE → Regel → Reihenfolge | Periode und Gruppe gemischt ohne Vergleichbarkeit | Trends → `ordnen-…`, `vergleich-…` |
| Isoelektronische Ionen nach Radius ordnen | gleiche Elektronenzahl → mehr Protonen = kleiner | nach Ladungsbetrag oder Masse geordnet | Trends → `ionenradien` |

## 4 Ionenbindung und Salze (Übung Bindungen I, Klausuraufgabe 3a)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Typische Ionenladung aus der Gruppe | Metalle geben ab (Gruppe 1, 2, 13), Nichtmetalle nehmen auf (16: −2, 17: −1); Edelgasregel als Begründung | Vorzeichen falsch; Gruppe 13 als +1 | PSE → `ionenladung` |
| Formel aus zwei Elementen oder aus Ionen | Ladungen kreuzen, auf kleinste ganze Zahlen kürzen; Molekül-Ionen in Klammern | nicht gekürzt; Klammer vergessen; Ladung als Index der eigenen Ionensorte | Salze → `salzformel` (Formel aus Namen), Klausuraufgabe 3 |
| Name aus Formel, mit römischer Ziffer bei mehreren möglichen Ladungen | Kation, dann Anion mit „-id“ (Molekül-Ionen eigene Namen); Ziffer = Ladung eines Ions | Ziffer als Anzahl der Ionen; Ziffer weggelassen | Salze → Name aus Formel, Ladung des Kations |
| Zerfall beim Lösen, Leitfähigkeit fest – Schmelze – Lösung | Gitter löst sich, Ionen hydratisiert und beweglich; fest leitet nicht | Lösung aus Atomen; fester Kristall leitet | Salze → `zerfall`, Fragen |
| Eigenschaften der Ionenkristalle (hoher Schmelzpunkt, spröde) | starke Anziehung im Gitter; verschobene Ebenen → gleiche Ladungen nebeneinander → Bruch | spröde „weil schwach gebunden“ | Ionenbindung (Fragen) |
| **Ladungsbilanz einer Formel mit mehreren Ionensorten prüfen** | je Ionensorte Anzahl · Ladung, alles addieren, Summe muss null sein | Ladung des Molekül-Ions aus der Zahl der O-Atome geraten; eine Ionensorte vergessen | **neu**: Rechenart „Ladungsbilanz“ bei Salze (Vertiefung, Klausurniveau), mit Mineralen und Doppelsalzen; Ziel N5 |

## 5 Metallbindung (Übung Bindungen II)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Elektronengasmodell erklären | positive Atomrümpfe, bewegliche Valenzelektronen, ungerichtete Anziehung | Rümpfe abwechselnd geladen wie im Salz | Metallbindung (Fragen) |
| Eigenschaften begründen: elektrische und Wärmeleitung, Verformbarkeit | bewegliche Elektronen; Ebenen gleiten ohne Bruch | Verformbarkeit „wegen schwacher Bindung“ | Metallbindung (Fragen) |
| Widerstand beim Erwärmen | stärkere Gitterschwingungen → mehr Stöße → Widerstand steigt | Widerstand sinkt oder bleibt | Metallbindung (Fragen) |
| Legierung erklären | Werkstoff aus mehreren Elementen, mindestens eines ein Metall; Fremdatome behindern das Gleiten | nur aus Metallen | Metallbindung (Fragen, Karte) |
| Metall und Ionenkristall vergleichen (Teilchen, Leitung, Verformbarkeit) | Tabelle aus drei Merkmalen | Merkmale vertauscht | Metallbindung (Fragen, Zuordnen) |
| Werkstoff für eine Anwendung wählen (Leiter oder Isolator) | Bindungsart → Eigenschaft → Eignung | Keramik als Leiter | Metallbindung (Fragen) |

Anwendungsfragen, die über die Bindung hinausgehen (z. B. Biokompatibilität),
gehören zur Werkstoffkunde (M5).

## 6 Moleküle, Gestalt, Hybridisierung (Übung Bindungen III bis V, Klausuraufgabe 3b)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Lewis-Formel zeichnen, bindende und freie Paare am Zentralatom zählen | Valenzelektronen zählen → Bindungen → restliche als freie Paare → Oktett prüfen | freie Paare des ganzen Moleküls gezählt; Oktett verletzt | Moleküle → `lewis` (Bild wählen), Klausuraufgabe 3; selbst zeichnen: N2f |
| Einfach-, Doppel-, Dreifachbindung unterscheiden | Zahl gemeinsamer Paare; Mehrfachbindung kürzer und stärker | länger und schwächer | Moleküle, Metalle → `sigma-pi` |
| Bindung polar oder unpolar über ΔEN | Differenz der Pauling-Werte; gleiche Atome → 0 | Summe statt Differenz | Moleküle → `polaritaet` |
| Molekül polar? (aus Gestalt) | Bindungsdipole + Gestalt → heben sie sich auf? | polare Bindungen = polares Molekül | Moleküle → `polaritaet`, Fragen |
| VSEPR-Typ, Gestalt, Winkel | AXₙEₘ am Zentralatom → Anordnung der Paare → Gestalt ohne freie Paare | Gestalt aus der Paar-Anordnung statt aus den Atomen; freie Paare vergessen | Moleküle → `gestalt` (mit räumlichem Bild) |
| Hybridisierung, σ- und π-Bindungen | Zahl der Bindungspartner + freie Paare → sp, sp², sp³; Doppelbindung = 1 σ + 1 π, Dreifach = 1 σ + 2 π | π-Bindungen bei der Hybridisierung mitgezählt | Metalle → `hybrid`, `sigma-pi` |

## 7 Zwischenmolekulare Kräfte (Übung, Klausuraufgabe 3c)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Begriffe erklären | Van-der-Waals bei allen Teilchen; Dipol-Dipol bei polaren; Wasserstoffbrücken bei H an N, O, F mit freiem Paar | Wasserstoffbrücke als kovalente Bindung; Van-der-Waals nur bei Ionen | ZMK (Fragen), Klausuraufgabe 3 |
| Stärkste Kraft eines Stoffs | H an N/O/F? → Brücken; sonst polar? → Dipol-Dipol; sonst Van-der-Waals | H-Brücke bei jedem H-haltigen Stoff | ZMK → `zmk-kraft` |
| Siedereihe ordnen und begründen | erst Art der Kraft, bei gleicher Art die Größe | nur nach Molmasse | ZMK → `zmk-sieden` |
| Mischbarkeit mit Wasser | Gleiches löst sich in Gleichem; OH-Gruppe → Brücken zu Wasser | unpolar mischbar | ZMK → `zmk-loesen`, Fragen |

## 8 Stöchiometrie (Übung Teil 1, Klausuraufgabe 4)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Gleichung ausgleichen | Atombilanz je Element, kleinste ganze Zahlen; nur Koeffizienten ändern | Indizes geändert | Gleichungen → `ausgleichen`; selbst eintippen: N2b |
| Vollständige Verbrennung eines Kohlenwasserstoffs | C → CO₂, H → H₂O, dann O₂; bei halben Zahlen alles verdoppeln | O₂ zuerst; halbe Koeffizienten stehen gelassen | Gleichungen → `verbrennung`, Klausuraufgabe 4 |
| Molare Masse aus Formel (mit gegebenen Atommassen) | Atome zählen (Indizes, Klammern) · Atommasse, summieren | Index nur aufs letzte Atom; Ordnungszahl statt Masse | Stoffmenge → `molmasse`, Klausuraufgabe 4 |
| n aus m, m aus n, M aus m und n | n = m / M (umstellen) | Bruch umgedreht | Stoffmenge → `stoffmenge` (alle Untertypen) |
| Umsatz: Masse eines Produkts aus Masse eines Edukts | m → n → Verhältnis der Koeffizienten → n → m | Verhältnis umgedreht; Massen direkt ins Verhältnis | Stoffmenge → `umsatz`, Klausuraufgabe 4 |

Atommassen: Die Klausuren geben ganze Zahlen vor, das Übungsblatt zwei
Nachkommastellen. Die App rechnet mit den Werten, die in der Aufgabe stehen (ganz
oder mit einer Nachkommastelle, CHEMIE.md §4); die Toleranz von 1 % deckt die
anderen Schreibweisen ab. Nichts zu tun.

## 9 Gleichgewicht (Klausuraufgabe 5)

| Art | Schema | Typische Fehler | In der App |
| --- | --- | --- | --- |
| Was gilt im Gleichgewicht? | Hin- und Rückreaktion gleich schnell, Konzentrationen bleiben gleich (nicht gleich groß) | Reaktion steht still; gleich viel Produkt wie Edukt | Gleichgewicht (Fragen), Klausuraufgabe 5 |
| Was tut ein Katalysator? | senkt die Aktivierungsenergie, Gleichgewicht stellt sich schneller ein, Lage bleibt | verschiebt die Lage; wird verbraucht | Gleichgewicht, Energie (Fragen), Klausuraufgabe 5 |
| Ausdruck für K aufstellen | Produkte oben, Edukte unten, Koeffizienten als Exponenten | Koeffizient als Faktor; Bruch umgedreht | Gleichgewicht → `mwg`; selbst aufbauen: N2c |
| Le Chatelier bei exothermer Reaktion | Wärme ist „Produkt“ → kühlen begünstigt Produkte; Druck → Seite mit weniger Gasteilchen | Erwärmen; Katalysator | Gleichgewicht → `le-chatelier` |

## 10 Säuren und Basen (Klausuraufgabe 6, Teil 2) – noch nicht in der App

Zuschnitt nach dem Skript, sobald es da ist (N3). Aus den Altklausuren:

| Art | Schema | Typische Fehler (vermutet) | Ziel |
| --- | --- | --- | --- |
| Säure und Base nach Brønsted | Säure gibt ein Proton ab, Base nimmt eins auf | Elektronen statt Protonen; Base „gibt OH⁻ ab“ | N3, Fragen |
| Protolyse mit Wasser aufstellen, korrespondierende Paare kennzeichnen | wer gibt das Proton ab, wer nimmt es auf; Paar = Teilchen vor und nach der Protonenabgabe | Paare über Kreuz (Säure mit fremder Base); Wasser nur in einer Rolle | N3, Rechnung „Protolyse“ (Bausteine wählen) |
| Lauge oder Lösung ansetzen | n = c · V (V in Liter), dann m = n · M | mL nicht umgerechnet; M falsch | **schon vorhanden**: Lösungen → `konzentration` |
| pH eines Puffers bzw. bei halber Neutralisation | pKs = −lg Ks; pH = pKs + lg(Base/Säure); bei halber Neutralisation pH = pKs | Verhältnis umgedreht; ln statt lg; Ks statt pKs | N3, Rechnung mit Engine |
| pH am Äquivalenzpunkt | schwache Säure + starke Base → über 7; schwache Base + starke Säure → unter 7; stark + stark → 7 | immer 7 | N3, Fragen |

## 11 Redox und Elektrochemie (Klausuraufgabe 7, Teil 2) – noch nicht in der App

Zuschnitt nach dem Skript (N4). Aus den Altklausuren:

| Art | Schema | Typische Fehler (vermutet) | Ziel |
| --- | --- | --- | --- |
| Energieumwandlung | galvanische Zelle: chemisch → elektrisch; Elektrolyse: elektrisch → chemisch | Richtung vertauscht | N4, Fragen |
| Oxidationszahlen in Verbindungen und Molekül-Ionen | Element 0; H meist +1, O meist −2; Summe = Ladung des Teilchens | Summe null statt Ionenladung; Element nicht 0 | N4, Rechnung mit Engine |
| Oxidationszahlen in einer Gleichung, Oxidation und Reduktion kennzeichnen | Zahl steigt = Oxidation (Elektronenabgabe), sinkt = Reduktion | Begriffe vertauscht | N4 |
| ΔG aus der Zellspannung | ΔG = −z · F · E, z = übertragene Elektronen je Formelumsatz der gefragten Menge | z zu klein (Elektronen je Atom statt je Molekül); Vorzeichen; J und kJ | N4, Rechnung |
| Galvanische Zelle aus zwei Standardpotentialen | höheres E⁰ wird reduziert (Kathode), niedrigeres oxidiert (Anode); Teilgleichungen, Gesamtgleichung; Elektronen fließen von der Anode zur Kathode; ΔE = E(Kathode) − E(Anode) | Anode und Kathode vertauscht; Halbgleichung nicht umgedreht; Elektronen nicht ausgeglichen | N4, Rechnung und Klausuraufgabe 7 |

## Lehrbuch „Physik für Ingenieure“, Kapitel 8 (gesichtet am 12.11.2026)

Der Nutzer hat Fotos des ganzen Kapitels „Atom- und Kernphysik“ hochgeladen. Nach
CHEMIE.md §1 dient das Buch als Gegenprobe und als Vorbild für Tabellen im
Nachschlagewerk; was über die Vorlesung hinausgeht, kommt nie in die Stufen.
Nichts aus dem Buch kommt ins Repo (Texte, Bilder, Tabellen, Zahlenbeispiele).

**Gegenprobe der Werte der App** (gerechnet mit den Werten der App):

| Größe | App | Buch | Urteil |
| --- | --- | --- | --- |
| Rydberg-Konstante | 1,097 · 10⁷ m⁻¹ | gleich auf vier Ziffern | passt |
| erste Linie der Balmer-Serie | etwa 656,3 nm | gemessen etwa 656,5 nm | passt (0,02 %) |
| Grenze der Balmer-Serie | etwa 364,6 nm | etwa 364,7 nm | passt |
| Ionisierungsenergie Wasserstoff aus h · c · R | etwa 13,6 eV | etwa 13,6 eV | passt |
| h, N_A, Massenverhältnis Proton : Elektron (1836) | wie im Buch gerundet | – | passt |
| Plätze je Unterschale, 2n² je Schale, Pauli, Quantenzahlen | wie im Buch | – | passt |
| Größe des Kerns | 10⁻¹⁵ m (Skript) | eher 10⁻¹⁴ m für schwere Kerne | Festlegung in CHEMIE.md §5 |

**Was das Kapitel bietet und wohin es passt:**

| Inhalt (in eigenen Worten) | Wohin |
| --- | --- |
| Geschichte der Atommodelle, Streuversuch, Größenordnungen von Atom, Kern und Teilchen | Nachschlagewerk Chemie (M12), Atombau |
| Linienspektrum des Wasserstoffs mit den Serien (Lyman, Balmer, Paschen, Brackett, Pfund), Bohrsche Postulate, Energien und Radien der Bohr-Bahnen | Nachschlagewerk Chemie (Vertiefung zu Licht und Rydberg-Formel); Rechnungen dazu nur, wenn die Vorlesung sie verlangt |
| Versuche zum Welle-Teilchen-Bild, Quantenzahlen und Entartung, Gestalt der Orbitale, Energieleiter der Unterschalen, Aufbau des PSE | Nachschlagewerk Chemie: Vorbild für selbst gezeichnete Tafeln (Orbitalformen, Energieleiter, Tabelle der Quantenzahlen) |
| Schrödinger-Gleichung, Operatoren, Unschärferelation, Quanten-Hall- und Tunneleffekt, Magnetismus von Elektron und Kern | über die Vorlesung hinaus; höchstens Physik (M10) |
| Röntgenstrahlung, Computertomografie, Molekülspektren | Physik (M10); Molekülorbitale höchstens als Vertiefung zu Zusatz 3.4 im Nachschlagewerk |
| Atomkern: Massenzahl, Isotope, Atommasseneinheit, Massendefekt und Bindungsenergie | Isotope und u schon in der App; Massendefekt und Bindungsenergie: Physik (M10) |
| Zerfallsarten (α, β⁻, β⁺, Elektroneneinfang, γ) mit Kerngleichungen | Physik (M10); im Nachschlagewerk Chemie als Ausblick bei Isotopen |
| Zerfallsgesetz, Halbwertszeit, Aktivität | Physik (M10); als Formel auch gut für „Gleichungen umstellen“ (e- und ln-Gleichungen) |
| Kernspaltung, Reaktoren, Kernfusion, Elementarteilchen | Physik (M10), nur Wissen |

Keine Rechenaufgabe des Kapitels gehört zum Stoff von Chemie 1; eine Gegenprobe
mit Aufgaben aus dem Buch entfällt deshalb. Das Kapitel Festkörperphysik
(Bändermodell, Halbleiter; passend zu Zusatz 3.4 und Werkstoffkunde) ist noch
nicht hochgeladen.

## Stand der Umsetzung

- Aufgaben 1 bis 5 der Klausur: vorhanden (M4, S1 bis S11, N1, N2a).
- Neu aus dieser Durchsicht: Ladungsbilanz mit mehreren Ionensorten (Ziel N5).
- Geplant: Eingaben zum Selbst-Aufstellen N2b bis N2f; Säure-Base N3; Redox N4
  (beide brauchen die Skripte).
