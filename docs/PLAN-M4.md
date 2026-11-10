# Plan für Meilenstein 4: Chemie 1

Status: **Entwurf, wartet auf deine Freigabe** (10.11.2026). Grundlage sind
deine Skripte, Übungsblätter und die beiden Altklausuren (Sommer 2025 und
Winter 2025/26) sowie deine Antworten: Wissensfragen **und** Rechenaufgaben,
drei Stufen, Probeklausur gleich mit einplanen.

Ziel von M4: Ein neues Fach „Chemie 1“ auf der Startseite. Du übst jedes
Thema aus deiner Vorlesung in drei Stufen, mit Wissensfragen (Auswahl,
Zuordnen, Ordnen) und mit Rechnungen, die die App selbst erzeugt und
nachrechnet. Dazu Lernkarten, Fortschritt, „Gezielt üben“, Wiederholung
falsch beantworteter Fragen und eine **Probeklausur** wie die echte (45
Minuten, 50 Punkte, 7 Aufgaben). Alles funktioniert offline.

Feste Regeln für alle Chemie-Inhalte (Schreibweise, Datentabellen,
Grenzfälle, typische Denkfehler) stehen in [CHEMIE.md](CHEMIE.md). Sie gelten
über M4 hinaus.

## Teil A: Was entsteht

### Urheberrecht: was ins Repo kommt und was nicht

Das Repo und die App sind öffentlich. Deine Skripte dürfen laut Hinweis
darin nicht veröffentlicht werden, auch nicht in Auszügen. Deshalb:

- Skripte, Klausuren und alle Auszüge daraus kommen **nie** ins Repo. Sie
  liegen nur während einer Sitzung im Arbeitsordner.
- Alle Fragen, Erklärungen und Lernkarten schreibe ich **in eigenen
  Worten**. Keine Folientexte, keine Aufgabentexte aus den Klausuren, keine
  kopierten Bilder; Skizzen (Atome, Gitter, Lewis-Formeln, Kästchen)
  zeichne ich selbst.
- Im Repo stehen keine Namen von Lehrenden.
- Bevor eine Fragensammlung ins Repo kommt, vergleiche ich sie außerhalb des
  Repos mit dem Skripttext: Kein Satz darf acht oder mehr Wörter am Stück mit
  dem Skript teilen.
- Fakten selbst (z. B. „Isotope unterscheiden sich in der Neutronenzahl“)
  sind frei. Die Fragen dazu formuliere ich neu.

Weil jede neue Sitzung ohne deine Dateien startet, steht in
[CHEMIE.md](CHEMIE.md) eine **Inhaltslandkarte** in eigenen Worten: welches
Skript welche Themen behandelt. Für den Wortvergleich und zum Nachlesen
brauche ich zu jedem Schritt das passende Skript noch einmal (ich sage
jeweils, welches).

### Aufbau in der App

Auf der Startseite steht unter „Mathematik MB1“ das neue Fach **„Chemie 1“**.
Die Gebiete folgen der Reihenfolge der Klausur, die Themen sind nach den
Klausuraufgaben geschnitten:

| Gebiet | Themen | In den Altklausuren |
| --- | --- | --- |
| 1. Aufbau der Materie | Atombau (Stoffe und Trennverfahren, Elementarteilchen, Kernsymbol, Isotope, Ionen, Atommodelle und Licht); Elektronen (Quantenzahlen, Orbitale, Elektronenkonfiguration) | Aufgabe 1, etwa 13 % der Punkte |
| 2. Periodensystem (kurz PSE) | Aufbau des PSE (Perioden, Gruppen, Blöcke, Valenzelektronen, Ionenladung, Edelgasregel); Trends (Atomradius, Ionisierungsenergie, Elektronegativität, Elektronenaffinität, Metallcharakter) | Aufgabe 2, etwa 8 % |
| 3. Chemische Bindung | Ionenbindung und Salze; Moleküle (Lewis-Formel, Gestalt, Polarität, Namen); zwischenmolekulare Kräfte; als Zusatz Metallbindung, Hybridisierung und Molekülorbitale | Aufgabe 3, etwa 13 % |
| 4. Stöchiometrie | Reaktionsgleichungen; Stoffmenge und Umsatz; Gase und Lösungen | Aufgabe 4 und 6c, etwa 21 % und mehr |
| 5. Gleichgewicht und Energie | Gleichgewicht (Massenwirkungsgesetz, Le Chatelier, Katalysator); Energie (exotherm/endotherm, Reaktionsenthalpie, Entropie, freie Enthalpie) | Aufgabe 5, etwa 10 % |
| 6. Säuren und Basen | wird nach dem Skript zugeschnitten | Aufgabe 6, etwa 19 % |
| 7. Redox und Elektrochemie | wird nach dem Skript zugeschnitten | Aufgabe 7, etwa 16 % |

- Gebiete ohne spielbares Thema sind blass mit „kommt bald“, wie in Mathe.
- Jede Themenseite zeigt, ob und mit wie vielen Punkten das Thema in den
  Altklausuren vorkam.
- Jedes Gebiet bekommt eine Kachel **„Klausuraufgabe N üben“**: eine Aufgabe
  wie Aufgabe N der Klausur, quer durch die Themen des Gebiets, ohne Zeit,
  mit Punkten und Lösungsweg.
- Unter den Gebieten steht die Kachel **„Probeklausur · 45 min · 50 Punkte“**.
- Lernkarten liegen je Thema in einem eigenen Ordner, die Fehlerstatistik
  und „Gezielt üben“ funktionieren wie in Mathe.

### Drei Stufen

| Stufe | Was das heißt |
| --- | --- |
| **Grundlagen** | Begriffe und Definitionen in einem Schritt, wie die Auswahlfragen der Klausur. Rechnungen, die eine Formel oder Regel anwenden, mit glatten Zahlen und bekannten Stoffen. |
| **Vertiefung** | Was die Übungsblätter und die Skripte genauer behandeln: begründen, zuordnen, ordnen. Rechnungen mit zwei bis drei Schritten, Molmassen aus dem PSE der App, unbekanntere Stoffe, krumme Zahlen. |
| **Klausurniveau** | Form und Umfang wie die Altklausuren, dazu die Tiefe der Übungsblätter. Rechnungen mit drei bis fünf Schritten, alle Fallen der Klausuren (z. B. zwei Stoffe mit gleicher Molmasse). Das ist die Stufe „kaum noch schwerer“: alles, was in der Klausur drankommen kann, gemischt durch das ganze Thema. |

Die Schrittzahlen meinen Rechenschritte (eine Formel anwenden, eine
Einheit umrechnen, ein Verhältnis bilden), nicht die einzelnen Fragen im
geführten Modus; dort fragt die App auch Zwischenangaben wie Protonen,
Neutronen und Elektronen oder die Ladungen eines Salzes einzeln ab.

Die App nennt die Stufen überall mit Namen („Vertiefung“ statt „Stufe 2“).
Nach 8 von 10 richtig schlägt sie wie bisher die nächste Stufe vor.

### Aufgabenarten

**Wissensfragen** (von mir geschrieben, in eigenen Worten):

| Art | So sieht sie aus |
| --- | --- |
| Einfachauswahl | Vier Antworten, genau eine richtig, wie in der Klausur. Die drei falschen kommen aus einem Vorrat von vier bis sechs typischen Denkfehlern, die Reihenfolge wechselt. |
| „Wähle alle richtigen“ | Vier bis sechs Aussagen, davon eine bis vier richtig. Für „Warum …?“-Fragen. Nach dem Prüfen siehst du je Aussage: richtig gewählt, zu Unrecht gewählt (mit Begründung) oder vergessen. |
| Zuordnen | Drei bis sechs Paare, z. B. Teilchen ↔ Ladung, Molekül ↔ Gestalt. Bei wenigen kurzen Zielen tippst du Knöpfe je Zeile an, sonst wählst du aus einer Liste. |
| Ordnen | Drei bis fünf Glieder mit Pfeilknöpfen nach oben und unten, z. B. Atommodelle nach der Zeit, Elemente nach Atomradius. Nur wo die Reihenfolge eindeutig ist. |
| Bild wählen | z. B. die richtige Lewis-Formel unter mehreren selbst gezeichneten. |

- Jede falsche Antwort ist ein **typischer Denkfehler** mit eigenem Text
  „Warum ist das falsch?“. Der Text benennt den Fehler und die Regel, verrät
  aber nicht die richtige Antwort.
- Manche Fragen sind Vorlagen, die die App aus ihren Tabellen füllt, z. B.
  „Welche Ladung hat das Ion von {Element}?“. So gibt es mehr Abwechslung.
- Fragen, die du falsch beantwortest, kommen später wieder: erst nach drei
  anderen Aufgaben, dann nach einem Tag, drei Tagen, einer Woche und drei
  Wochen (je richtig beantwortet eine Pause länger). Fällige Wiederholungen
  kommen zuerst; sonst kommen Fragen, die du noch nicht gesehen hast, vor
  solchen, die du schon richtig hattest.
- Unter jeder Frage gibt es den Knopf **„Frage melden“**. Er merkt sich die
  Frage auf deinem Gerät; in den Einstellungen kannst du die Liste kopieren
  und mir in der nächsten Sitzung schicken („Fortschritt löschen“ lässt sie
  stehen). Handgeschriebenes Wissen kann die App nicht selbst nachrechnen,
  deshalb ist dein Blick wichtig.

**Rechen- und Aufstellaufgaben** (von der App erzeugt und exakt
nachgerechnet), geführt und frei wie in Mathe:

- **Geführt:** Der Rechenweg läuft in Schritten, je Schritt wählst du aus.
  Die falschen Antworten sind die Ergebnisse typischer Fehler, z. B. das
  Stoffmengen-Verhältnis umgedreht. „Bisher“ zeigt, was schon gerechnet ist
  (etwa die Tabelle aus n, M und m).
- **Frei:** Du gibst das Ergebnis selbst ein:
  - Zahlen über einen eigenen Ziffernblock (Komma, Minus, „·10ⁿ“); über dem
    Feld steht, wie die App die Zahl gelesen hat. Auf Klausurniveau wählst
    du auch die Einheit.
  - Koeffizienten: ein Feld vor jedem Stoff einer Reaktionsgleichung.
  - Formeln über eine eigene Tastatur mit Elementsymbolen, Ziffern,
    Klammern und Ladungen (keine Autokorrektur des Handys).
  - Elektronenkonfigurationen über Knöpfe für die Unterschalen (1s, 2s, 2p
    usw., auch [Ne] und [Ar] als Kurzschreibweise für die Elektronen des
    Edelgases davor) mit der Zahl der Elektronen.
- Ergebnisse gelten als richtig, wenn sie höchstens 1 % neben dem genauen
  Wert liegen. Liegt die Zahl 1 bis 4 % daneben, sagt die App „Fast: prüfe
  deine Rundung“, das zählt nicht als Fehler. Passt die Zahl zu einem
  typischen Fehler, nennt die App ihn. Einzelheiten in
  [CHEMIE.md](CHEMIE.md).
- Protonen-, Neutronen- und Elektronenzahlen, Koeffizienten, Indizes,
  Ladungen und Oxidationszahlen müssen genau stimmen.
- Wissensfragen gibt es nur geführt. Wer „Frei“ übt, bekommt nur Rechnungen;
  fällige Wiederholungen von Fragen kommen beim geführten Üben. Hat eine
  Stufe keine Rechnung, geht „Frei“ dort geführt weiter, mit kurzem Hinweis.

**Besondere Eingaben im geführten Modus:**
- **Orbital-Kästchen:** Tippen schaltet leer → ↑ → ↓ → ↑↓. So lassen sich
  auch Fehler gegen die Hund'sche Regel zeigen. Verstöße gegen das
  Pauli-Prinzip (zwei gleiche Pfeile in einem Kästchen) kommen als Bild zum
  Beurteilen („Welche Besetzung ist erlaubt?“).
- **Baukasten fürs Massenwirkungsgesetz:** je Stoff Zähler oder Nenner und
  der Exponent.
- **Lewis-Formeln:** in Grundlagen und Vertiefung als Bild zur Auswahl; auf
  Klausurniveau ein Baukasten, in dem du um jedes Atom Bindungsstriche und
  freie Elektronenpaare an feste Plätze tippst. Danach bindende und freie
  Paare zählen und die Gestalt wählen, wie in Klausuraufgabe 3b.

Kein freies Zeichnen und kein Ziehen mit dem Finger (verträgt sich am Handy
schlecht mit dem Scrollen).

### Beispiel einer Wissensfrage (Grundlagen, Atombau)

„Zwei Atome sind Isotope desselben Elements. Was gilt für sie immer?“
- richtig: Sie haben verschieden viele Neutronen.
- „Sie haben verschieden viele Protonen.“ → Warum falsch: Die Protonenzahl
  legt fest, welches Element es ist. Mit anderer Protonenzahl wäre es ein
  anderes Element.
- „Sie haben verschieden viele Elektronen.“ → Warum falsch: Das
  unterscheidet ein Ion vom neutralen Atom, nicht zwei Isotope.
- „Sie haben mehr Neutronen als Protonen.“ → Warum falsch: Gewöhnlicher
  Wasserstoff hat gar kein Neutron und ist trotzdem ein Isotop.
- im Vorrat außerdem: „Sie haben verschiedene Ordnungszahlen.“, „Ihre Kerne
  sind verschieden stark geladen.“

### Beispiel einer geführten Rechnung (Klausurniveau, Stöchiometrie)

„Butan C₄H₁₀ verbrennt vollständig. Welche Masse an CO₂ bildet sich aus
5,8 g Butan? Rechne mit M(C) = 12, M(H) = 1 und M(O) = 16 g/mol.“

| Schritt | Richtig | Falsche Antworten (Fehler) |
| --- | --- | --- |
| 1. Gleichung | 2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O | C₄H₁₀ + 6 O₂ → 4 CO₂ + 5 H₂O (Sauerstoff nicht ausgeglichen); Index statt Koeffizient geändert; CO statt CO₂ |
| 2. M(C₄H₁₀) | 58 g/mol | 13 (Indizes vergessen); 34 (Ordnungszahlen statt Molmassen); 116 (Koeffizient mitgerechnet) |
| 3. n(Butan) | 0,1 mol | 336 mol (m · M statt m : M); 10 mol (M : m statt m : M) |
| 4. n(CO₂) | 0,4 mol | 0,1 mol (1 : 1); 0,8 mol (nur der Koeffizient des Produkts); 0,025 mol (Verhältnis umgedreht) |
| 5. m(CO₂) | 17,6 g | 0,00909 g (n : M statt n · M); 23,2 g (Molmasse des Butans statt des CO₂, oder Massen statt Stoffmengen ins Verhältnis gesetzt: beides ergibt immer denselben Wert); 11,2 g (Molmasse von CO statt CO₂) |

Ausgeglichen wird immer mit den **kleinsten ganzen Zahlen**. Eine Gleichung
mit 13/2 O₂ oder mit verdoppelten Koeffizienten ist chemisch richtig; sie
erscheint deshalb nie als falsche Antwort. Im freien Modus heißt sie „noch
nicht fertig“.

### Themen im Einzelnen

Für jedes Thema: was in welcher Stufe drankommt, welche Rechnungen die App
erzeugt und mit welchen typischen Fehlern, welche Lernkarten es gibt.
Fragenzahl: zum Start mindestens 15 Fragen je Thema und Stufe (zusammen etwa
600), danach wächst der Vorrat, vor allem bei klausurnahen Themen. Die
Lernkarten haben Regel oder Formel, einen Merksatz in eigenen Worten,
Beispiele (bei Rechnungen rechnet sie die App, bei Wissenskarten stehen sie
in eigenen Worten und werden geprüft wie die Fragen) und die typischen
Fehler.

#### 1.1 Atombau (Klausur Sommer 2025: 1a bis 1d; Winter 2025/26: 1a bis 1c)
- Grundlagen: Reinstoffe und Gemische, Elemente und Verbindungen;
  Trennverfahren und ihr Prinzip (Dichte, Löslichkeit, Teilchengröße,
  Siedetemperatur, Anhaften an einer Oberfläche); physikalischer Vorgang oder chemische Reaktion; Ladung
  und Masse von Proton, Neutron und Elektron; Ordnungszahl und Massenzahl;
  Isotope; Protonen, Neutronen und Elektronen neutraler Atome aus dem
  Kernsymbol.
- Vertiefung: Ionen (wie ³⁷Cl⁻); fehlende Angaben in einer Tabelle
  ergänzen; Größe von Kern und Atom; Atommodelle (Dalton, Thomson,
  Rutherford, Bohr, Orbitalmodell) mit ihren Grenzen; Streuversuch; Energie
  des Lichts E = h · f = h · c/λ; Linienspektrum und Wellenlänge eines
  Übergangs im Wasserstoffatom (Rydberg-Formel), Energie zum Ablösen des
  Elektrons; Welle und Teilchen (λ = h/(m · v)); warum ein Orbital keine
  Bahn ist.
- Klausurniveau: die Atombau-Teile von Klausuraufgabe 1 am Stück mit
  wechselnden Atomen und Ionen; Begründungsfragen zu den Modellen.
- Rechnung „Protonen, Neutronen, Elektronen“ (Grundlagen: neutrale Atome;
  ab Vertiefung auch Ionen und fehlende Angaben; geführt: Element aus der
  Ordnungszahl → Protonen → Neutronen = A − Z → Elektronen mit Ladung).
  Fehler: Neutronen gleich Massenzahl; Protonen und Neutronen vertauscht;
  Ionenladung vergessen; Ladung mit falschem Vorzeichen verrechnet; Element
  über die Massenzahl bestimmt.
- Rechnung „Energie des Lichts“ (Vertiefung). Fehler: nm nicht in m
  umgerechnet; Formel falsch umgestellt. Dazu der Denkfehler „längere
  Wellenlänge, mehr Energie“ als Wissensfrage.
- Rechnungen „Übergang im Wasserstoffatom“ und „Welle eines Teilchens“
  (Vertiefung). Fehler: Quadrate vergessen; Kehrwert vergessen;
  Lichtgeschwindigkeit statt Geschwindigkeit des Teilchens; Masse in g statt
  kg.
- Lernkarten: Stoffe einteilen; Trennverfahren; Elementarteilchen;
  Kernsymbol lesen; Isotope; Ionen; Atommodelle; Energie des Lichts;
  Linienspektrum und Rydberg-Formel; Welle und Teilchen.

#### 1.2 Elektronen (Klausur Sommer 2025: 1e, 1f; Winter 2025/26: 1d, 1e)
- Grundlagen: Quantenzahlen und ihre Bedeutung; s, p, d, f mit 1, 3, 5, 7
  Orbitalen; Pauli-Prinzip und Hund'sche Regel; Konfiguration von H bis Ne;
  Valenzelektronen.
- Vertiefung: Konfiguration bis Kr in Kästchen und als Schreibweise (4s vor
  3d); ungepaarte Elektronen; höchstens 2n² Elektronen je Schale; Ionen
  (bei Fe²⁺ wird 4s zuerst geleert); Ausnahmen Cr und Cu (Pd und Ag nur
  als Wissensfrage).
- Klausurniveau: Valenzkonfiguration wie in der Klausur; Besetzungen
  beurteilen; „Sind diese Quantenzahlen erlaubt?“; Element aus der
  Konfiguration bestimmen.
- Rechnungen (Elemente bis Kr und ihre Ionen): Kästchen besetzen und
  Konfiguration schreiben (Fehler: 3d vor 4s besetzt, z. B. K als [Ar] 3d¹,
  die Schreibweise [Ar] 3d⁶ 4s² ist dagegen richtig; Hund verletzt; s³ oder
  p⁷; Summe ungleich Z; Ausnahme bei Cr oder Cu nicht beachtet; bei Ionen 3d
  statt 4s geleert); Valenzkonfiguration
  (Fehler: Rumpfelektronen mitgezählt, Ion statt Atom, falsche Schale);
  Quantenzahlen (Fehler: l bis n statt n − 1, negative m vergessen); Elektronen je
  Schale (Fehler: 2n statt 2n²).
- Lernkarten: Quantenzahlen; Orbitale; Pauli; Hund; Besetzungsreihenfolge;
  Ausnahmen; Valenzelektronen; Ionen von Übergangsmetallen.

#### 2.1 Aufbau des PSE (Klausur 2a bis 2c)
- Grundlagen: Ordnungszahl; Periode = Zahl der Schalen; Gruppe = gleiche
  Zahl an Valenzelektronen; Haupt- und Nebengruppen; s-, p- und d-Block;
  Metalle, Halbmetalle, Nichtmetalle; Edelgasregel; Ionenladung aus der
  Hauptgruppe.
- Vertiefung: isoelektronische Teilchen (Na⁺, Mg²⁺ und O²⁻ wie Ne);
  Ionisierungsenergie und ihr Sprung; Valenzkonfiguration aus Periode und
  Gruppe.
- Klausurniveau: die Auswahlfragen der Klausur mit wechselnden Gruppen und
  Perioden; Element aus einem Steckbrief („Periode 3, fünf
  Valenzelektronen“); Ionenladung aus der Folge der Ionisierungsenergien.
- Rechnungen: Steckbrief in beide Richtungen (Fehler: Periode als Zahl der
  Valenzelektronen; Gruppennummer 13 bis 18 als Zahl der Valenzelektronen
  (Al mit 13); Fe als VIII. Hauptgruppe); Ionenladung (Fehler: P⁵⁺, Na⁻,
  Al¹³⁺); Sprung der Ionisierungsenergie (Fehler: größter Wert statt größter
  Sprung).
- Lernkarten: Aufbau des PSE; Blöcke; Valenzelektronen und Gruppe; Metalle
  und Nichtmetalle; Edelgasregel; Ionen bilden; Ionisierungsenergie.

#### 2.2 Trends im PSE (Klausur 2d)
- Grundlagen: Richtung der Trends in Periode und Gruppe für Atomradius,
  Ionisierungsenergie, Elektronegativität, Elektronenaffinität und
  Metallcharakter; Fluor hat die höchste Elektronegativität.
- Vertiefung: begründen (Kernladung, Schalen, Abschirmung); drei bis fünf
  Elemente ordnen; Ionenradien einer isoelektronischen Reihe; Unterschied
  zwischen Elektronegativität und Elektronenaffinität.
- Klausurniveau: gemischt mit 2.1, Begründungen als „Wähle alle richtigen“.
- Ordnen nur, wo Regel und Messwerte übereinstimmen. Die echten Werte haben
  Ausnahmen (z. B. hat Mg eine höhere Ionisierungsenergie als Al); solche
  Paare fragt die App nicht ab. Ein Test prüft jede Reihenfolge gegen die
  Tabelle. Keine Vergleiche über die Diagonale. Atomradien sind
  Kovalenzradien (halber Abstand zweier gebundener Atome), siehe
  [CHEMIE.md](CHEMIE.md).
- Lernkarten: Atomradius; Ionisierungsenergie; Elektronegativität;
  Elektronenaffinität; Trends auf einen Blick (eigene Skizze).

#### 3.1 Ionenbindung und Salze (Klausur 3a)
- Grundlagen: Ionenbindung aus Metall und Nichtmetall; Eigenschaften von
  Salzen (hart, spröde, hoher Schmelzpunkt, leiten als Schmelze und in
  Lösung); Formeln einfacher Salze; Namen auf -id.
- Vertiefung: ungleiche Ladungen (Al₂O₃, Ca₃N₂); römische Ziffern
  (Eisen(III)-chlorid); Molekül-Ionen (Ca₃(PO₄)₂, Mg(NO₃)₂); Ionengitter mit
  Elementarzelle, Koordinationszahl und Polyeder (NaCl: 6, Oktaeder; CsCl:
  8, Würfel; ZnS: 4, Tetraeder); kristallin oder amorph; Zerfall in Ionen
  als Gleichung (NaCl(s) → Na⁺(aq) + Cl⁻(aq); in der Schmelze
  Al₂O₃ → 2 Al³⁺ + 3 O²⁻); Lösen von Salzen (wärmt oder kühlt).
- Klausurniveau: Ionen und Formel aus dem Namen und umgekehrt;
  Schmelzpunkte über Ladung und Abstand begründen; Born-Haber-Kreisprozess
  als Rechnung (alle Werte gegeben, nur Fluoride und Chloride, bei denen
  kein Verdampfungsschritt fehlt).
- Rechnungen: Salzformel (geführt: Ladung des Kations → Ladung des Anions →
  kleinstes gemeinsames Vielfaches → Indizes → Klammern; frei mit Index- und
  Ladungsfeldern). Fehler: nicht gekürzt (Mg₂S₂); Indizes vertauscht (Al₃O₂);
  1 : 1 (AlO); Klammer vergessen; falsche Ladung (P³⁺). Name ↔ Formel. Fehler:
  Index statt Ladung in der Klammer; Sulfid, Sulfit und Sulfat verwechselt.
  Zerfall in Ionen. Fehler: Koeffizienten der Ionen vergessen; Index als Teil
  des Ions (Al₂³⁺). Born-Haber. Fehler: Vorzeichen der Elektronenaffinität; ganze statt halbe
  Bindungsenergie; Schritt vergessen.
- Salze nennt die Aufgabe ausdrücklich „ionisch“, wie die Klausur. Ob eine
  Bindung ionisch ist, entscheidet die App nicht über die
  Elektronegativität, wenn der Unterschied unter 1,9 liegt (MgCl₂, Al₂O₃,
  AlCl₃, FeCl₃); eine Lernkarte erklärt, dass die Grenze fließend ist.
- Lernkarten: Ionenbindung; Formel eines Salzes; Namen von Salzen;
  Molekül-Ionen; Ionengitter; Eigenschaften von Salzen; Born-Haber; Salze
  lösen.

#### 3.2 Moleküle (Klausur 3b)
- Grundlagen: Elektronenpaarbindung; bindende und freie Elektronenpaare;
  Oktettregel (Wasserstoff: zwei Elektronen); Bindigkeit von H, O, N, C und
  den Halogenen; Gestalt nach dem Elektronenpaar-Abstoßungsmodell (linear,
  trigonal-planar, tetraedrisch, trigonal-pyramidal, gewinkelt); Gestalt von
  CH₄, NH₃, H₂O, CO₂.
- Vertiefung: Mehrfachbindungen (CO₂, HCN); Typ des Moleküls in der
  Schreibweise AXₙEₘ (A Zentralatom, X Bindungspartner, E freie Paare: AX₄,
  AX₃E, AX₂E₂ usw.) und seine Gestalt; Winkel 180°, 120°, 109,5°; Unterschied
  der Elektronegativität (ΔEN) und Bindungsart; Teilladungen δ+ und δ−;
  polare und unpolare Moleküle; Namen mit Vorsilben (Distickstoffmonoxid).
- Klausurniveau: Klausurformat mit wechselnden Molekülen (Lewis-Formel,
  Paare zählen, Gestalt); „Welche Moleküle sind Dipole?“; Kette Gestalt →
  Dipol → zwischenmolekulare Kraft.
- Rechnungen: Gestalt (geführt: Zentralatom → Bindungspartner → freie Paare
  → Typ AXₙEₘ → Gestalt). Fehler: Doppelbindung als zwei Paare gezählt (CO₂
  tetraedrisch); freie Paare vergessen (NH₃ trigonal-planar, H₂O linear);
  Anordnung der Paare statt Gestalt (NH₃ tetraedrisch). ΔEN (Werte stehen in
  der Aufgabe). Fehler: Werte addiert; mit dem Index malgenommen;
  Teilladungen vertauscht. Dipol. Fehler: polare Bindung mit Dipolmolekül
  gleichgesetzt (CO₂, CCl₄).
- Moleküldaten (etwa 40 Moleküle) sind feste Daten mit Tests. Ausnahmen
  sind markiert (BF₃ hat am Bor nur sechs Elektronen). Moleküle mit kleiner
  ΔEN, die trotzdem Dipole sind (H₂S, PH₃, NCl₃), fragt die App nicht nach
  der Polarität; SO₂ nach Gestalt und Polarität (gewinkelt, Dipol), nicht nach
  der Lewis-Formel.
- Lernkarten: Elektronenpaarbindung; Lewis-Formel in vier Schritten;
  Mehrfachbindungen; Gestalt der Moleküle (mit Tabelle AXₙEₘ); freie Paare
  brauchen Platz;
  Elektronegativität und Bindungsart; Teilladungen; Dipolmolekül; Namen von
  Molekülverbindungen.

#### 3.3 Zwischenmolekulare Kräfte (Klausur 3c)
- Grundlagen: Van-der-Waals-Kräfte, Dipol-Dipol-Kräfte und
  Wasserstoffbrücken, zwischen welchen Teilchen sie wirken und wie stark
  sie sind; alle schwächer als Atom- und Ionenbindungen;
  Wasserstoffbrücken nur bei H an N, O oder F.
- Vertiefung: Van-der-Waals-Kräfte wachsen mit der Größe der Moleküle;
  Siedepunkte ordnen (nur bei mindestens 10 K Abstand); Besonderheiten des
  Wassers; „Gleiches löst sich in Gleichem“.
- Klausurniveau: stärkste Kraft für mehrere Stoffe und die Reihenfolge der
  Siedepunkte begründen; Mischbarkeit; welche Kräfte beim Verdampfen
  überwunden werden.
- Lernkarten: die drei Kräfte; Wasserstoffbrücken; Wasser ist besonders;
  Gleiches löst sich in Gleichem.

#### 3.4 Zusatz: Metallbindung, Hybridisierung, Molekülorbitale
Kam in keiner Altklausur vor, steht aber in den Skripten. Deshalb ganz am
Ende von M4 und auf der Themenseite als „nicht in den Altklausuren“
gekennzeichnet. Die Karten zur Metallbindung nutzt später auch die
Werkstoffkunde.
- Grundlagen: Elektronengas; Eigenschaften von Metallen; Leiter,
  Halbleiter, Isolator; sp³, sp², sp mit Gestalt.
- Vertiefung: Metallgitter mit Koordinationszahl; warum Metalle verformbar
  und Salze spröde sind; Bändermodell; Dotierung; σ- und π-Bindungen zählen.
- Klausurniveau: Leitfähigkeit beim Erwärmen (Metall gegen Halbleiter);
  Schmelzflusselektrolyse von Aluminium; Bindungsordnung zweiatomiger
  Moleküle.
- Lernkarten: Metallbindung und Elektronengas; Metallgitter; verformbar oder
  spröde; Bändermodell; Halbleiter und Dotierung; Hybridisierung; σ- und
  π-Bindungen; Bindungsordnung.

#### 4.1 Reaktionsgleichungen (Klausur 4a)
- Grundlagen: Edukte und Produkte; Pfeile → und ⇌; Zustände (s) fest, (l)
  flüssig, (g) gasförmig, (aq) in Wasser gelöst; Erhaltung der Masse; Koeffizient und Index; zweiatomige Elemente als
  X₂ (H₂, O₂, N₂, Halogene); einfache Gleichungen ausgleichen.
- Vertiefung: größere Gleichungen (Ammoniaksynthese, Rosten, Salzbildung,
  Metall mit Sauerstoff); „Welche Gleichungen sind ausgeglichen?“.
- Klausurniveau: vollständige Verbrennung von Alkanen und Alkoholen
  aufstellen und ausgleichen (Formel steht in der Aufgabe, wie in der
  Klausur).
- Rechnung „Ausgleichen“ mit Koeffizienten-Feldern, geprüft über die
  Atombilanz, nicht gegen eine Musterlösung; geführt C → H → O → ganzzahlig
  machen. Fehler: Index statt Koeffizient geändert (MgO₂, H₂O₂); Sauerstoff
  nicht ausgeglichen; Sauerstoff im Wasser vergessen; nur teilweise
  verdoppelt; Einzelatom statt X₂; CO statt CO₂.
- Lernkarten: Reaktionsgleichung lesen; Ausgleichen Schritt für Schritt;
  Verbrennung; zweiatomige Elemente; Alkane von Methan bis Decan.

#### 4.2 Stoffmenge und Umsatz (Klausur 4b, 4c)
- Grundlagen: 1 mol = 6,022 · 10²³ Teilchen; molare Masse aus dem PSE;
  m = n · M; einfache Verhältnisse aus den Koeffizienten.
- Vertiefung: Formeln mit Klammern und Kristallwasser (Ca(OH)₂,
  Al₂(SO₄)₃, CuSO₄ · 5 H₂O); Teilchenzahl einer Stoffportion N = n · N_A
  (N_A: Avogadro-Konstante, 6,022 · 10²³ Teilchen je mol); Masse → Masse mit
  beliebigen Verhältnissen.
- Klausurniveau: Klausuraufgabe 4 komplett (Gleichung, alle Molmassen,
  Masse eines Produkts oder Bedarf an einem Edukt) mit wechselnden Stoffen;
  Probe über die Massenerhaltung; Fallen wie gleiche Molmassen.
- Rechnungen: Molmasse (geführt: Atome zählen → M je Element → Summe).
  Fehler: Index vergessen, auch Atom statt Molekül (M(CO₂) = 28,
  M(O₂) = 16); Ordnungszahl statt Molmasse; Koeffizient mitgerechnet;
  Klammer nicht malgenommen. Stoffmenge und Teilchenzahl. Fehler: n = m · M
  oder n = M : m; N = n : N_A. Umsatz in drei Schritten (Gleichung → Tabelle
  aus n, M, m → Verhältnis). Fehler: 1 : 1; Verhältnis umgedreht; nur der
  Koeffizient des Produkts; Molmasse des Edukts für das Produkt oder Massen
  statt Stoffmengen ins Verhältnis (beides ergibt immer denselben Wert);
  n : M statt n · M; Molmasse eines ähnlichen Stoffs (CO statt CO₂).
- Lernkarten: Stoffmenge und Avogadro-Konstante; molare Masse; m = n · M;
  Atome oder Moleküle?; Umsatz in drei Schritten; die typischen Fehler beim
  Umsatz.

#### 4.3 Gase und Lösungen (Klausur 6c gehört rechnerisch hierher)
- Grundlagen: c = n/V in mol/L; Massenanteil; molares Volumen 22,4 L/mol
  bei 0 °C und 1013 hPa; Gasgesetz p · V = n · R · T.
- Vertiefung: jede Größe aus dem Gasgesetz mit Umrechnung (hPa, bar, °C, L,
  m³); Lösung ansetzen m = c · V · M; Massenkonzentration in g/L (nicht
  dasselbe wie die Dichte); ppm, ppb, ppt (Millionstel, Milliardstel,
  Billionstel); Vol-% (Volumenanteil in Prozent; beim Mischen addieren sich
  Volumina nicht genau).
- Klausurniveau: Lösung ansetzen wie Klausur 6c mit wechselnden Stoffen und
  Volumen; Masse → Gasvolumen in einer Reaktion; Bedingungen erkennen (22,4
  L/mol nur für Gase und nur bei 0 °C und 1013 hPa).
- Rechnungen. Fehler: mL statt L; c = V/n; Molmasse unvollständig (NH₄Cl
  ohne die H, NaOH nur mit M(Na)); °C statt K; hPa nicht in Pa umgerechnet; Massenanteil durch die Masse
  des Wassers statt der Lösung; ppb mit 10⁻¹² verwechselt;
  Massenkonzentration als V/m; Vol-% nicht durch 100 geteilt.
- Lernkarten: Konzentration; Lösung ansetzen; Massenanteil;
  Massenkonzentration und Dichte; Konzentrationsangaben im Vergleich; ppm und
  ppb; ideales Gasgesetz; molares Volumen; Norm- und Standardbedingungen.

#### 5.1 Gleichgewicht (Klausur 5a bis 5d)
- Grundlagen: Doppelpfeil; dynamisches Gleichgewicht (Hin- und Rückreaktion
  gleich schnell, die Konzentrationen ändern sich nicht mehr, sind aber im
  Allgemeinen nicht gleich groß); Produkte stehen im Zähler; exotherm und
  endotherm; Aktivierungsenergie und Energiediagramm; ein Katalysator senkt
  die Aktivierungsenergie, beschleunigt beide Richtungen, wird nicht
  verbraucht und ändert weder die Reaktionsenthalpie ΔH (Wärme, die frei
  wird oder gebraucht wird) noch die Lage des Gleichgewichts.
- Vertiefung: Massenwirkungsgesetz zu beliebigen Gasgleichgewichten; K
  (Gleichgewichtskonstante) aus Konzentrationen; was die Größe von K
  verrät; die Geschwindigkeit einer Reaktion hängt von den Konzentrationen
  ab; bei einer Reaktion, die in einem Schritt abläuft, gilt
  v_hin = k_hin · cᵃ(A) · cᵇ(B), im Gleichgewicht v_hin = v_rück, daher
  K = k_hin/k_rück (k: Geschwindigkeitskonstante der Hin- bzw.
  Rückreaktion; Aufgaben dazu nur mit Reaktionen, die als einstufig
  angegeben sind; die Lernkarte sagt, dass die Exponenten sonst gemessen
  werden); Le Chatelier für Druck, Temperatur und Konzentration.
- Klausurniveau: Massenwirkungsgesetz wie Klausur 5c mit wechselnden
  Reaktionen; „Welche Maßnahmen erhöhen die Ausbeute?“ (der Katalysator als
  Falle).
- Rechnungen: Massenwirkungsgesetz mit dem Baukasten. Fehler: Exponent passt
  nicht zum Koeffizienten; Zähler und Nenner vertauscht; Koeffizient als
  Faktor; Summe statt Produkt; K = k_rück/k_hin. Le Chatelier: Reaktion mit
  ΔH und Eingriff → Richtung. Fehler: Druck begünstigt die Seite mit mehr Gasteilchen;
  Erwärmen hilft immer den Produkten; Koeffizienten beim Zählen vergessen.
- Lernkarten: dynamisches Gleichgewicht; Massenwirkungsgesetz;
  Geschwindigkeit und K; Le Chatelier; exotherm und endotherm;
  Energiediagramm mit Katalysator; Katalysator.

#### 5.2 Energie
In den Altklausuren nur über 5.1 (Katalysator und Aktivierungsenergie,
exotherm); deshalb nach den klausurnahen Themen.
- Grundlagen: Vorzeichen von ΔH; Bildungsenthalpie (Elemente in ihrem
  Standardzustand haben 0, meist die stabilste Form unter
  Standardbedingungen, z. B. O₂(g), Br₂(l), I₂(s), Kohlenstoff als Graphit);
  erster und zweiter Hauptsatz (Energie bleibt erhalten; die Entropie eines
  abgeschlossenen Systems nimmt nie ab, bei freiwillig ablaufenden Vorgängen
  nimmt sie zu); Vorzeichen von ΔH und ΔS (Änderung der Entropie) beim
  Schmelzen und Verdampfen.
- Vertiefung: Reaktionsenthalpie aus Bildungsenthalpien; Entropie;
  ΔG = ΔH − T · ΔS (ΔG: freie Enthalpie, ΔG⁰ unter Standardbedingungen);
  freiwillig oder nicht.
- Klausurniveau: Temperatur, ab der (ΔH > 0, ΔS > 0) bzw. bis zu der
  (ΔH < 0, ΔS < 0) eine Reaktion freiwillig abläuft, T = ΔH/ΔS; K aus
  ΔG⁰ = −R · T · ln K.
- Fehler: Edukte minus Produkte; Koeffizienten vergessen; H₂O(g) statt
  H₂O(l) aus der Tabelle; °C statt K; J und kJ nicht angeglichen; lg statt
  ln. Dazu der Denkfehler „exergonisch heißt exotherm“ als Wissensfrage.
- Lernkarten: Bildungsenthalpie; Reaktionsenthalpie; Hauptsätze; Entropie;
  freie Enthalpie; freie Enthalpie und K.

#### 6 und 7: Säuren und Basen, Redox
Zusammen etwa 35 % der Klausurpunkte, aber noch ohne Skript. Nach den
Klausuren gehört dazu: Säuren und Basen nach Brønsted, Protolyse mit
korrespondierenden Paaren, pH, Puffer, Äquivalenzpunkt; Oxidationszahlen,
Redoxgleichungen, galvanische Zelle mit Standardpotentialen, Anode und
Kathode, Elektrolyse, ΔG = −z · F · E. Die Themen schneide ich zu, sobald
du die Skripte schickst. Was davon schon vorher geht, steht unter
„Probeklausur“.

### Katalog der Rechenfehler (Vorschlag)

Typische Fehler der Rechnungen, je mit Id und falschem Beispiel, wie bei
Mathe. Die Ids können sich beim Bauen noch ändern; Säure-Base und Redox
kommen mit ihren Schritten dazu. Die Denkfehler der Wissensfragen
(`chem-mis-…`) listet die Galerie aus dem Code.

| Rechnung | Typischer Fehler (Id) | Beispiel (falsch) |
| --- | --- | --- |
| Protonen, Neutronen, Elektronen | Neutronen gleich Massenzahl (`chem-neutrons-mass-number`) | ³⁷Cl⁻: 37 Neutronen statt 20 |
| Protonen, Neutronen, Elektronen | Protonen und Neutronen vertauscht (`chem-protons-neutrons-swapped`) | ³⁷Cl⁻: 20 Protonen, 17 Neutronen |
| Protonen, Neutronen, Elektronen | Ionenladung vergessen (`chem-ion-charge-ignored`) | ³⁷Cl⁻: 17 Elektronen statt 18 |
| Protonen, Neutronen, Elektronen | Ladung mit falschem Vorzeichen (`chem-ion-charge-sign`) | ³⁷Cl⁻: 16 Elektronen |
| Protonen, Neutronen, Elektronen | Element über die Massenzahl bestimmt (`chem-element-from-mass`) | A = 37, Z = 17: Rubidium statt Chlor |
| Energie des Lichts | nm nicht in m umgerechnet (`chem-light-nm`) | 500 nm: 3,98 · 10⁻²⁸ J statt 3,98 · 10⁻¹⁹ J |
| Energie des Lichts | Formel falsch umgestellt (`chem-light-formula`) | E = h · λ/c |
| Übergang im H-Atom | Quadrate vergessen (`chem-rydberg-squares`) | 3 → 2: 547 nm statt 656 nm |
| Übergang im H-Atom | Kehrwert vergessen (`chem-rydberg-reciprocal`) | 1/λ als λ angegeben |
| Welle eines Teilchens | Lichtgeschwindigkeit statt Geschwindigkeit des Teilchens (`chem-debroglie-c`) | λ = h/(m · c) |
| Welle eines Teilchens | Masse in g statt kg (`chem-debroglie-gram`) | λ um den Faktor 1000 zu klein |
| Konfiguration | 3d vor 4s besetzt (`chem-3d-before-4s`) | K: [Ar] 3d¹ |
| Konfiguration | Hund'sche Regel verletzt (`chem-hund`) | N: 2p mit ↑↓, ↑ und einem leeren Kästchen |
| Konfiguration | Unterschale überfüllt (`chem-subshell-overfilled`) | Ne: 1s² 2s³ 2p⁵ |
| Konfiguration | Summe ungleich Z (`chem-electron-count`) | S: 1s² 2s² 2p⁶ 3s² 3p³ |
| Konfiguration | Ausnahme nicht beachtet (`chem-exception-ignored`) | Cr: [Ar] 4s² 3d⁴ |
| Konfiguration eines Ions | 3d statt 4s geleert (`chem-ion-3d-emptied`) | Fe²⁺: [Ar] 4s² 3d⁴ statt [Ar] 3d⁶ |
| Valenzkonfiguration | Rumpfelektronen mitgezählt (`chem-valence-core`) | Cl: 2s² 2p⁶ 3s² 3p⁵ |
| Valenzkonfiguration | Ion statt Atom (`chem-valence-ion`) | O: 2s² 2p⁶ |
| Valenzkonfiguration | falsche Schale (`chem-valence-shell`) | O: 3s² 3p⁴ |
| Quantenzahlen | l bis n statt bis n − 1 (`chem-l-up-to-n`) | n = 2, l = 2 „erlaubt“ |
| Quantenzahlen | negative m vergessen (`chem-m-positive`) | l = 1: nur m = 0 und 1 statt −1, 0, 1 |
| Elektronen je Schale | 2n statt 2n² (`chem-shell-2n`) | n = 3: 6 statt 18 |
| Steckbrief | Periode als Zahl der Valenzelektronen (`chem-period-as-valence`) | P: 3 statt 5 |
| Steckbrief, Ionenladung | Gruppennummer 13 bis 18 als Zahl der Valenzelektronen (`chem-group-number-as-valence`) | Al: 13 Valenzelektronen statt 3, Al¹³⁺ statt Al³⁺ |
| Steckbrief | Fe als Hauptgruppenelement (`chem-fe-main-group`) | Fe: VIII. Hauptgruppe |
| Ionenladung | Valenzelektronen abgegeben statt Oktett aufgefüllt (`chem-ion-valence-given`) | P⁵⁺ statt P³⁻ |
| Ionenladung | Vorzeichen vertauscht (`chem-ion-sign`) | Na⁻ statt Na⁺ |
| Ionisierungsenergien | größter Wert statt größter Sprung (`chem-ie-largest`) | Mg mit vier Werten: Mg⁴⁺ statt Mg²⁺ |
| Salzformel | nicht gekürzt (`chem-salt-not-reduced`) | Mg₂S₂ statt MgS |
| Salzformel | Indizes vertauscht (`chem-salt-swapped`) | Al₃O₂ statt Al₂O₃ |
| Salzformel | immer 1 : 1 (`chem-salt-one-to-one`) | AlO |
| Salzformel | Klammer vergessen (`chem-salt-bracket`) | Ca₃PO₄₂ statt Ca₃(PO₄)₂ |
| Salzformel | falsche Ionenladung (`chem-salt-charge`) | Calciumnitrid mit N⁵⁻: Ca₅N₂ statt Ca₃N₂ |
| Name ↔ Formel | Index statt Ladung in der Klammer (`chem-name-index`) | Fe₂O₃ als Eisen(II)-oxid |
| Name ↔ Formel | Endung verwechselt (`chem-name-suffix`) | Na₂SO₄ als Natriumsulfid |
| Zerfall in Ionen | Koeffizienten vergessen (`chem-dissociation-coefficients`) | Al₂O₃ → Al³⁺ + O²⁻ |
| Zerfall in Ionen | Index als Teil des Ions (`chem-dissociation-index`) | Al₂O₃ → Al₂³⁺ + O₃²⁻ |
| Born-Haber | Vorzeichen der Elektronenaffinität (`chem-bh-ea-sign`) | Cl: +349 statt −349 kJ/mol |
| Born-Haber | ganze statt halbe Bindungsenergie (`chem-bh-whole-bond`) | Cl₂: 243 statt 121,5 kJ/mol |
| Born-Haber | Schritt vergessen (`chem-bh-step-missing`) | Sublimation des Natriums fehlt |
| Gestalt | Doppelbindung als zwei Paare gezählt (`chem-vsepr-double-bond`) | CO₂ tetraedrisch |
| Gestalt | freie Paare vergessen (`chem-vsepr-lone-pairs`) | NH₃ trigonal-planar, H₂O linear |
| Gestalt | Anordnung der Paare statt Gestalt (`chem-vsepr-arrangement`) | NH₃ tetraedrisch |
| ΔEN | Werte addiert (`chem-den-added`) | H–Cl: 5,36 statt 0,96 |
| ΔEN | mit dem Index malgenommen (`chem-den-index`) | O–H in H₂O: 2,48 statt 1,24 |
| Teilladungen | vertauscht (`chem-partial-swapped`) | δ− am H und δ+ am Cl in HCl |
| Dipol | polare Bindung mit Dipolmolekül gleichgesetzt (`chem-polar-bond-dipole`) | CO₂ als Dipol |
| Formel aus dem Namen | Vorsilbe auf das falsche Element bezogen (`chem-prefix-element`) | Schwefeldioxid als S₂O |
| Ausgleichen | Index statt Koeffizient geändert (`chem-balance-index`) | Mg + O₂ → MgO₂ statt 2 Mg + O₂ → 2 MgO |
| Ausgleichen | Sauerstoff nicht ausgeglichen (`chem-balance-oxygen`) | C₄H₁₀ + 6 O₂ → 4 CO₂ + 5 H₂O |
| Ausgleichen | Sauerstoff im Wasser vergessen (`chem-balance-water-oxygen`) | C₃H₈ + 3 O₂ → 3 CO₂ + 4 H₂O |
| Ausgleichen | nur teilweise verdoppelt (`chem-balance-partly-doubled`) | 2 C₂H₆ + 7 O₂ → 2 CO₂ + 6 H₂O |
| Ausgleichen | Einzelatom statt X₂ (`chem-balance-single-atom`) | 2 H + O → H₂O |
| Ausgleichen | CO statt CO₂ (`chem-balance-co`) | 2 CH₄ + 3 O₂ → 2 CO + 4 H₂O |
| Molmasse | Index vergessen, auch Atom statt Molekül (`chem-molar-index`; beides ergibt bei Elementen denselben Wert) | M(CO₂) = 28 statt 44 g/mol; M(O₂) = 16 statt 32 g/mol |
| Molmasse | Ordnungszahlen statt Molmassen (`chem-molar-atomic-number`) | M(C₄H₁₀) = 34 g/mol |
| Molmasse | Koeffizient mitgerechnet (`chem-molar-coefficient`) | 2 C₄H₁₀: 116 g/mol |
| Molmasse | Klammer nicht malgenommen (`chem-molar-bracket`) | M(Ca(OH)₂) = 58,1 statt 74,1 g/mol |
| Stoffmenge | n = m · M (`chem-n-times`) | 5,8 g Butan: 336 mol |
| Stoffmenge | n = M : m (`chem-n-inverted`) | 5,8 g Butan: 10 mol |
| Teilchenzahl | N = n : N_A (`chem-particles-divided`) | 0,5 mol: 8,3 · 10⁻²⁵ |
| Umsatz | Verhältnis 1 : 1 (`chem-ratio-one`) | Butan → CO₂: 0,1 mol statt 0,4 mol |
| Umsatz | Verhältnis umgedreht (`chem-ratio-swapped`) | 0,025 mol |
| Umsatz | nur der Koeffizient des Produkts (`chem-ratio-product-only`) | 0,8 mol |
| Umsatz | Molmasse des Edukts für das Produkt oder Massen statt Stoffmengen ins Verhältnis (`chem-ratio-wrong-molar-mass`; beides ergibt immer m(Edukt) · ν(Produkt)/ν(Edukt)) | 5,8 g Butan → CO₂: 23,2 g statt 17,6 g |
| Umsatz | n : M statt n · M (`chem-mass-divided`) | 0,4 mol CO₂: 0,00909 g statt 17,6 g |
| Umsatz | Molmasse eines ähnlichen Stoffs (`chem-similar-molar-mass`) | CO statt CO₂: 11,2 g statt 17,6 g |
| Einheit | falsche Einheit gewählt (`chem-unit`) | 17,6 kg statt 17,6 g |
| Konzentration | mL statt L (`chem-ml-not-l`) | 0,1 mol in 200 mL: 0,0005 mol/L statt 0,5 mol/L |
| Konzentration | c = V/n (`chem-c-inverted`) | 2 L/mol |
| Lösung ansetzen | Molmasse unvollständig (`chem-molar-incomplete`) | M(NH₄Cl) = 49,5 statt 53,5 g/mol (die H vergessen) |
| Gasgesetz | °C statt K (`chem-celsius`) | T = 25 statt 298,15 K |
| Gasgesetz | hPa nicht in Pa umgerechnet (`chem-hpa`) | p = 1013 statt 101 300 Pa |
| Gasvolumen | 22,4 L/mol nicht bei 0 °C und 1013 hPa (`chem-vm-conditions`) | 1 mol Gas bei 25 °C und 1013 hPa: 22,4 L statt 24,5 L |
| Massenanteil | durch die Masse des Wassers statt der Lösung (`chem-fraction-solvent`) | 10 g Salz in 90 g Wasser: 11,1 % statt 10 % |
| Massenkonzentration | V/m (`chem-mass-conc-inverted`) | 3 g in 100 mL: 0,0333 L/g statt 30 g/L |
| ppm, ppb | ppb als 10⁻¹² (`chem-ppb`) | 5 ppb als 5 · 10⁻¹² |
| Vol-% | nicht durch 100 geteilt (`chem-vol-percent`) | 40 Vol-% von 0,5 L: 20 L statt 0,2 L |
| Massenwirkungsgesetz | Exponent passt nicht zum Koeffizienten (`chem-mwg-exponent`) | Ammoniaksynthese: c²(H₂) statt c³(H₂) |
| Massenwirkungsgesetz | Zähler und Nenner vertauscht (`chem-mwg-swapped`) | Edukte im Zähler |
| Massenwirkungsgesetz | Koeffizient als Faktor (`chem-mwg-factor`) | 2 · c(NH₃) statt c²(NH₃) |
| Massenwirkungsgesetz | Summe statt Produkt (`chem-mwg-sum`) | c(N₂) + c³(H₂) im Nenner |
| K aus Geschwindigkeiten | k_rück/k_hin statt k_hin/k_rück (`chem-k-rates`) | Kehrwert von K |
| Le Chatelier | Druck begünstige die Seite mit mehr Gasteilchen (`chem-lc-pressure`) | Ammoniaksynthese: Druck erhöhen → Edukte |
| Le Chatelier | Erwärmen helfe immer den Produkten (`chem-lc-heat`) | exotherme Reaktion: Erwärmen → Produkte |
| Le Chatelier | Koeffizienten beim Zählen vergessen (`chem-lc-count`) | H₂ + I₂ ⇌ 2 HI: Druck → Produkte |
| Reaktionsenthalpie | Edukte minus Produkte (`chem-dh-reversed`) | Vorzeichen umgedreht |
| Reaktionsenthalpie | Koeffizienten vergessen (`chem-dh-coefficients`) | jede Bildungsenthalpie nur einmal gezählt |
| Reaktionsenthalpie | H₂O(g) statt H₂O(l) aus der Tabelle (`chem-dh-water-gas`) | −241,8 statt −285,8 kJ/mol |
| freie Enthalpie | °C statt K (`chem-dg-celsius`) | T = 25 statt 298,15 K |
| freie Enthalpie | J und kJ nicht angeglichen (`chem-dg-units`) | ΔS in J/K mit ΔH in kJ verrechnet |
| K aus ΔG⁰ | lg statt ln (`chem-dg-lg`) | K = 10^(−ΔG⁰/(R · T)) |

### Probeklausur

**Ablauf**
- Start über die Kachel „Probeklausur“. Deckblatt wie in der echten Klausur:
  45 Minuten, 50 Punkte, 7 Aufgaben; Hilfsmittel Taschenrechner (deiner),
  Formelsammlung und PSE.
- In der App gibt es dafür ein eigenes PSE (Ordnungszahl, Symbol, Molmasse
  mit einer Nachkommastelle, wie das PSE der Klausur) und eine
  Formelsammlung aus den Lernkarten. Beides lässt sich während der Klausur
  aufrufen.
- Die Uhr läuft rückwärts; „Ohne Zeitdruck“ ist wählbar. Du springst frei
  zwischen den Aufgaben. Bis zur Abgabe gibt es keine Rückmeldung, keine
  Tipps und keine Lernkarten; das Hauptmenü ist ausgeblendet, und das X fragt
  nach (die Uhr läuft weiter). Die App merkt sich den Stand: Neu laden oder
  eine andere App öffnen verliert nichts.
- Jede Probeklausur hat eine Nummer, damit du sie wiederholen kannst. Die
  Stoffe wechseln; was in den letzten drei Probeklausuren vorkam, wird
  gemieden.

**Bauplan** (Punkte wie in der Klausur Winter 2025/26, weil dort die
Teilpunkte stehen; Teile aus beiden Altklausuren; Aufgabentexte in eigenen
Worten, andere Stoffe und Zahlen):

| Aufgabe | Punkte | Teile |
| --- | --- | --- |
| 1 Aufbau der Materie | 5 | Ladungen zuordnen (1); Begriffsfrage, z. B. Massenzahl oder Isotope (1); Protonen, Neutronen und Elektronen aus einem Kernsymbol (1); Valenzelektron (1); Valenzkonfiguration (1) |
| 2 Periodensystem | 4 | vier Auswahlfragen aus: Ordnungszahl, Periode oder Gruppe, warum ähnliche Eigenschaften, Block, Trend |
| 3 Bindungen | 6 | Ionen und Formel eines Salzes (2); Lewis-Formel, Paare, Gestalt (3); zwischenmolekulare Kräfte (1) |
| 4 Stöchiometrie | 10 | Verbrennung eines Alkans oder Alkohols ausgleichen (2); Molmassen aller vier Stoffe (4); Masse eines Produkts (4) |
| 5 Gleichgewicht | 5 | Gleichgewicht (1); Katalysator (1); Massenwirkungsgesetz (2); Le Chatelier (1) |
| 6 Säure-Base | 10 | Brønsted (1); Protolyse mit Paaren (3); Lösung ansetzen (3); pH eines Puffers oder bei halber Neutralisation (2); Äquivalenzpunkt (1) |
| 7 Redox | 10 | Energieumwandlung bei Elektrolyse oder galvanischer Zelle (2); Oxidationszahlen in Teilchen oder in einer Reaktion mit Oxidation und Reduktion gekennzeichnet (4); freiwillige Reaktion aus Standardpotentialen mit Halbgleichungen oder ΔG = −z · F · E aus der Zellspannung (2); Anode, Kathode, Elektronenfluss (2) |

Je Probeklausur wählt die App für jeden Teil eine der Varianten.

**Bewertung**
- Auswahlfragen: ganz oder gar nicht. Zuordnen: anteilig je Paar.
- Rechnungen: Du gibst das Ergebnis ein und kannst jederzeit die
  Zwischenschritte aufklappen und ausfüllen; bis zur Abgabe sagt die App
  nicht, ob etwas stimmt. Bei der Auswertung gibt ein richtiges Ergebnis die
  vollen Punkte, sonst gibt es Teilpunkte für richtige Zwischenschritte.
- **Folgefehler zählen nicht doppelt**, auch über Teilaufgaben hinweg: Wer
  in 4a falsch ausgleicht oder in 4b eine Molmasse falsch hat und damit in
  4c richtig weiterrechnet, bekommt die Punkte für 4c.
- Ausgleichen: volle Punkte für die kleinsten ganzen Zahlen, halbe für
  richtig, aber nicht gekürzt oder mit Bruch.
- Lewis: Bild bzw. Baukasten 1 Punkt, Paare 1 Punkt, Gestalt 1 Punkt.
- Weil es keine Musterlösung gibt, steht in der Auswertung: „Punkte nach dem
  Schema der App, Teilpunkte geschätzt“.

**Auswertung**: Punkte je Aufgabe und Teil, deine Antwort neben der
richtigen, Lösungsweg und „Warum ist das falsch?“, Links zu Thema und
Lernkarte, Vorschlag „Das solltest du üben“. Erkannte Fehler zählen in deine
Fehlerstatistik; falsch beantwortete Fragen kommen in die Wiederholung. Die
Ergebnisse bleiben gespeichert (Verlauf). Eine Note zeigt die App erst, wenn
der Notenschlüssel bekannt ist.

**Solange die Skripte zu Säure-Base und Redox fehlen**: Probeklausur Teil 1
mit den Aufgaben 1 bis 5 (30 Punkte, 27 Minuten), deutlich gekennzeichnet.
„Lösung ansetzen“ (6c) ist reine Stöchiometrie und kann schon vorher als
Übung kommen. Ob ich die Aufgaben 6 und 7 schon vorher nach dem Muster der
Altklausuren baue (gekennzeichnet als „vorläufig, ohne Skript“),
entscheidest du (Frage 3 unten).

### Abwechslung

Die Regel aus CLAUDE.md gilt auch für Chemie, mit eigenen Kennzahlen, weil
Wissensfragen keine „Formen“ wie Mathe-Aufgaben haben:
- **Wissensfragen:** mindestens 15 je Thema und Stufe, bevor dort
  Wissensfragen gezogen werden; bis dahin ist eine Stufe nur mit ihren
  Rechnungen spielbar. Keine Frage kommt doppelt, bevor alle dran waren, und
  Fragen zum selben Fakt kommen nicht innerhalb von zehn Aufgaben zweimal
  (beides außer fälligen Wiederholungen). Bei jedem Wiederkommen zeigt eine
  Frage eine andere Fassung: andere falsche Antworten aus dem Vorrat, andere
  Reihenfolge, bei Vorlagen ein anderes Element.
- **Rechnungen:** Die App merkt sich die Form (Art der Rechnung, Untertyp und
  Stoffe; nicht die Zahlen) und wiederholt keine der letzten zehn. Es gelten
  die Kennzahlen aus M2b: unter 200 erzeugten Aufgaben einer Stufe mindestens
  100 Formen, keine Form öfter als 3 von 100, dazu derselbe Stoff nie zweimal
  hintereinander. Wo der Vorrat an Stoffen kleiner ist (z. B. etwa zwölf
  Gasgleichgewichte), darf ein Schritt mit Begründung abweichen; die
  Abweichung steht dann in diesem Plan.
- Ein Test misst das je Thema und Stufe; die Galerie zeigt es wie in Mathe.

### Schritte

Jeder Schritt lässt sich einzeln ausprobieren. Danach wie immer: Tests,
Typprüfung, Build, Browser in Handy- und Laptopgröße, hell und dunkel, eine
inhaltliche Prüfung der neuen Fragen (fachlich richtig, eindeutig, falsche
Antworten wirklich falsch, eigene Worte), Pull Request und ein kurzer
Bericht an dich. Die Reihenfolge richtet sich nach den Klausurpunkten;
ist die Vorlesung gerade woanders, ziehe ich das vor (Frage 1 unten).

#### Schritt 0: Plan (dieser Entwurf)
- PLAN-M4.md, CHEMIE.md, neue Reihenfolge in der ROADMAP.

#### Schritt 1: Gerüst und erstes Thema „Atombau“, in vier Teilen
- **1a: Fach und erste Fragen.** Fach „Chemie 1“ auf der Startseite mit
  allen Gebieten („kommt bald“); Stufennamen statt Zahlen; chemische Formeln
  im Formelsatz; Tabelle der Elemente mit Tests; Einfachauswahl mit „Warum
  ist das falsch?“; Atombau Grundlagen mit mindestens 15 Fragen, geführt;
  Lernkarten-Ordner „Atombau“ mit den Karten der Grundlagen; die Denkfehler
  in „Deine häufigsten Fehler“ (als Aussage statt Formel); Galerie-Seite
  „Fragen durchsehen“; Knopf „Frage melden“.
  Ausprobieren: Start → Chemie 1 → Aufbau der Materie → Atombau →
  Grundlagen, zehn Fragen.
- **1b: Erste Rechnung.** „Protonen, Neutronen, Elektronen“ geführt in allen
  drei Stufen (Vertiefung und Klausurniveau zunächst nur mit Rechnungen);
  Karten dazu; „Gezielt üben“ für jeden Fehler einer spielbaren Stufe.
  Ausprobieren: Vertiefung, ein Ion wie ³⁷Cl⁻ geführt, einmal absichtlich
  die Massenzahl als Neutronenzahl wählen.
- **1c: Freier Modus für Zahlen.** Ziffernblock, Toleranz, Rundungshinweis,
  Fehlererkennung; Protonen, Neutronen und Elektronen frei; Rechnung
  „Energie des Lichts“ geführt und frei, mit Lernkarte und „Gezielt üben“
  für ihre Fehler.
  Ausprobieren: Energie des Lichts frei, einmal grob gerundet (Hinweis
  „Fast“) und einmal ohne nm in m umzurechnen; Protonen, Neutronen und
  Elektronen eines Ions frei, einmal mit falschem Vorzeichen der Ladung.
- **1d: Weitere Fragearten und Wiederholung.** „Wähle alle richtigen“,
  Zuordnen, Ordnen; Wiederholung falsch beantworteter Fragen; Atombau
  Vertiefung (mit Atommodellen, Spektren, Welle und Teilchen) und
  Klausurniveau komplett.
  Ausprobieren: Atommodelle ordnen; eine Frage absichtlich falsch
  beantworten und sehen, dass sie nach drei Aufgaben wiederkommt.

#### Schritt 2: Stöchiometrie, in vier Teilen (größter Klausurblock)
- **2a: Stoffmenge und Molmasse.** Die App liest Summenformeln (Klammern,
  Kristallwasser), rechnet Molmassen mit Rechenweg; n, m, M und N geführt und
  frei; PSE der App zum Nachschlagen; Gebiet „Stöchiometrie“ öffnet sich.
  Ausprobieren: M(Ca(OH)₂) frei, einmal die Klammer vergessen.
- **2b: Reaktionsgleichungen.** Ausgleichen mit Koeffizienten-Feldern,
  Verbrennungen von Alkanen und Alkoholen, etwa 60 weitere Reaktionen;
  Wissensfragen zu Pfeilen, Zuständen und Massenerhaltung.
  Ausprobieren: eine Verbrennung frei ausgleichen, einmal einen Index
  ändern.
- **2c: Umsatz und Klausuraufgabe 4.** Umsatzrechnung in drei Schritten,
  Klausurniveau mit der ganzen Aufgabe 4; erste Kachel „Klausuraufgabe 4
  üben“; dafür die Bewertung mit Punkten, Teilpunkten und Folgefehlern, auch
  über Teilaufgaben hinweg (die Probeklausur nutzt sie später).
  Ausprobieren: Klausuraufgabe 4 üben, einmal absichtlich das Verhältnis
  umdrehen.
- **2d: Gase und Lösungen.** Gasgesetz, molares Volumen, Konzentration,
  Lösung ansetzen, Massenanteil, ppm; Gebiet 4 komplett.
  Ausprobieren: „Wie viel Gramm Natriumcarbonat für 200 mL Lösung mit 0,1
  mol/L?“ frei, einmal mit mL statt L.

#### Schritt 3: Bindungen, in drei Teilen
- **3a: Ionenbindung und Salze.** Salzformel mit Index- und Ladungsfeldern,
  Namen mit römischen Ziffern und Molekül-Ionen, Gitter, Born-Haber.
  Ausprobieren: Calciumphosphat frei; Eisen(III)-sulfat benennen.
- **3b: Moleküle.** Selbst gezeichnete Lewis-Formeln (Auswahl, auf
  Klausurniveau Baukasten), Paare zählen, Gestalt, ΔEN, Polarität, Namen;
  Formel aus dem Namen frei über die Element-Tastatur.
  Ausprobieren: PCl₃ im Klausurformat; „Welche Moleküle sind Dipole?“;
  Distickstoffmonoxid frei eintippen.
- **3c: Zwischenmolekulare Kräfte und Klausuraufgabe 3.**
  Ausprobieren: drei Stoffe nach Siedepunkt ordnen; Klausuraufgabe 3 üben.

#### Schritt 4: Elektronen und Periodensystem, in zwei Teilen
- **4a: Elektronen.** Orbital-Kästchen, Konfiguration bis Kr mit Ausnahmen
  (geführt und frei über Knöpfe für die Unterschalen), Valenzkonfiguration,
  Quantenzahlen; Gebiet 1 komplett, „Klausuraufgabe 1
  üben“.
  Ausprobieren: Eisen und Fe²⁺ in Kästchen; Klausuraufgabe 1 üben.
- **4b: Periodensystem.** Aufbau des PSE und Trends; „Klausuraufgabe 2
  üben“.
  Ausprobieren: Na, Mg und Cl nach Atomradius ordnen; Klausuraufgabe 2.

#### Schritt 5: Gleichgewicht und Energie, in zwei Teilen
- **5a: Gleichgewicht.** Baukasten fürs Massenwirkungsgesetz, Le Chatelier,
  Katalysator; „Klausuraufgabe 5 üben“.
  Ausprobieren: Massenwirkungsgesetz einer Gasreaktion bauen; „Welche
  Maßnahmen erhöhen die Ausbeute?“.
- **5b: Energie.** Exotherm und endotherm, Reaktionsenthalpie aus
  Bildungsenthalpien, Entropie, freie Enthalpie.
  Ausprobieren: Reaktionsenthalpie einer Verbrennung geführt.

#### Schritt 6: Probeklausur Teil 1
- Aufgaben 1 bis 5 (30 Punkte, 27 Minuten), Uhr, Auswertung, Verlauf, PSE
  und Formelsammlung in der Klausur (Teilpunkte und Folgefehler gibt es seit
  2c).
  Ausprobieren: Chemie 1 → Probeklausur → schreiben, abgeben, Auswertung
  ansehen; mitten in der Klausur neu laden.

#### Schritt 7: Säuren und Basen (sobald das Skript da ist)
- Gebiet 6 mit seinen Themen, „Klausuraufgabe 6 üben“, Aufgabe 6 in der
  Probeklausur.

#### Schritt 8: Redox und Elektrochemie (sobald das Skript da ist)
- Gebiet 7 mit seinen Themen, „Klausuraufgabe 7 üben“; danach ist die
  Probeklausur vollständig (50 Punkte, 45 Minuten).
- Kommen die Skripte früher, ziehe ich die Schritte 7 und 8 vor.

#### Schritt 9: Zusatz Metallbindung, Hybridisierung, Molekülorbitale
- Thema 3.4. Kann auch in die Werkstoffkunde wandern, wenn du das lieber
  willst.

#### Schritt 10: Abschluss
- „Gezielt üben“ für jeden typischen Fehler (ein Test prüft alle);
  „Abwechslung je Stufe“ in der Galerie; Design-Durchgang über alle Seiten
  in Handy- und Laptopgröße, hell und dunkel; Offline-Test; Doku; M4
  abhaken.

### Offene Fragen an dich
Stehen am Ende der Nachricht im Chat; deine Antworten trage ich hier ein.
1. Wann ist deine Chemie-Klausur, und welches Kapitel ist gerade in der
   Vorlesung dran?
2. Wie bekomme ich die Skripte in späteren Sitzungen?
3. Säure-Base und Redox: Skripte schicken; Aufgaben 6 und 7 vorher schon
   vorläufig bauen?
4. Notenschlüssel der Klausur bekannt?
5. Farben und Startseite.
6. Platz der Werkstoffkunde in der Roadmap.

## Teil B: Technischer Bauplan

### Was allgemein wird (auch für die Werkstoffkunde)
- `src/engine/quiz/`: Fragen-Typen (`types.ts`), Frage → geführte Aufgabe
  mit gemischten Antworten (`plan.ts`; mit `focus` steht die passende falsche
  Antwort sicher dabei), Wiederholung (`schedule.ts`: Fächer 0 bis 4;
  fällige zuerst, dann ungesehene, dann schon richtig beantwortete),
  Prüfungen für Tests (`validate.ts`).
- `src/engine/quantity/`: deutsche Zahlen (`numberDe.ts`: Komma, „· 10ⁿ“,
  gültige Ziffern; Leser für Eingaben wie `0,1`, `0.1`, `1,8·10^-5`,
  `1,8e-5`), Größen mit Einheiten (`quantity.ts`) und die Urteile mit
  Toleranz; im freien Modus von Chemie, später auch Werkstoffkunde und
  Physik.
- `src/ui/numeric/`: Ziffernblock und freier Bildschirm für Zahlen (ohne
  MathLive).
- `src/engine/exam/`: Bauplan-Typen und Bewertung mit Teilpunkten und
  Folgefehlern (`grade.ts`; jeder Teil liefert `compute(eingabenBisher)`, auch
  über Teilaufgaben hinweg).
- Fach im Katalog (`src/ui/catalog.ts`): neue Felder `levelCount` (3 oder 5),
  `levelNames`, `tone`, `exam` (Minuten, Punkte); `levelName(course, level)`
  für alle Stellen, die heute „Stufe n“ schreiben (Aufgabe, Vorschlag
  „nächste Stufe“, Startseite, Themenseite mit Knopf „… üben“ und
  Stufenwahl, Seite „… kommt bald“, Lernkarten, Fortschritt). Adressen mit
  einer Stufe über `levelCount` leiten zur höchsten Stufe um. Freier Modus je
  Stufe über ein optionales `LevelPreview.free` (ohne Angabe gilt
  `Course.free`; angepasst in PracticePage, HomeScreen, CourseScreen,
  ProgressScreen, CardBody, catalog.test.ts). Gebiets- und Themen-Ids
  beginnen mit `chem-` (später `wk-`), nur Kleinbuchstaben a bis z (ohne
  Umlaute und ß) und Bindestriche, höchstens 40 Zeichen (Übungsadressen in
  `routes.ts`, `isId` in `storage.ts`), Gebiets-Ids verschieden von
  Themen-Ids.
- Werkstoffkunde wird ein eigenes Fach nach demselben Muster; nichts
  Allgemeines liegt unter `chem/`.

### Chemie-Engine (`src/engine/chem/`, reines TypeScript)
- `elements.ts`: eine Tabelle, Z 1 bis 56 sowie Pt, Au, Hg, Pb, Bi: Symbol,
  deutscher Name, Periode, Gruppe (1 bis 18 und Hauptgruppe I bis VIII),
  Block, Metall/Halbmetall/Nichtmetall, typische Ionenladungen, Molmasse mit
  einer Nachkommastelle (als Text, gerechnet exakt mit `rational.ts`), EN nach
  Pauling mit zwei Nachkommastellen, Atomradius (Kovalenzradius),
  Ionenradien, erste Ionisierungsenergie, Elektronenaffinität; je Spalte Quelle und Abrufdatum. Genauere
  Atommassen (IUPAC) nur in einer Testdatei zur Gegenprobe.
- `formula.ts`: liest `H2SO4`, `Ca(OH)2`, `CuSO4*5H2O`, `SO4^2-`, Zustände;
  Ausgabe als `\ce{…}` und als Text für Vorlesehilfen; verständliche
  Fehlermeldungen („Elementsymbole beginnen mit einem Großbuchstaben“).
- `equation.ts`, `balance.ts`: Reaktionsgleichungen; Ausgleichen über das
  Gleichungssystem der Atombilanz mit exakten Brüchen; Vorlagen mit mehr als
  einer unabhängigen Lösung fliegen raus; Koeffizienten positiv und
  teilerfremd.
- `molarMass.ts`: Molmasse mit Rechenweg.
- `electrons.ts`: Konfiguration nach der Besetzungsreihenfolge; Ausnahmen
  aus Daten für alle Elemente der Tabelle (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag,
  Pt, Au; ein Test vergleicht mit einer Referenzliste); Aufgaben erzeugt nur
  bis Kr; Edelgas-Kurzform, Ionen, Kästchen.
- `nomenclature.ts`, `molecules.ts`: Ionen und Salze, Namen mit Vorsilben;
  etwa 40 Moleküle mit Lewis-Daten (Atome, Bindungen, freie Paare, Lage für
  die Zeichnung), Gestalt, Winkel, Polarität (gespeichert), stärkste
  zwischenmolekulare Kraft, Siedepunkt, Ausnahmen markiert.
- `equilibrium.ts`, `thermo.ts`: Massenwirkungsgesetz, Le Chatelier,
  Reaktionsenthalpie, freie Enthalpie (je eine Datentabelle mit Quelle).
- Später `oxidation.ts`, `acidBase.ts`, `redox.ts`.
- `errorRules.ts`: Rechenfehler, Ids `chem-…`; jeder rechnet die Aufgabe
  falsch weiter. `misconceptions.ts`: Denkfehler bei Wissensfragen, Ids
  `chem-mis-…`, je mit falscher Aussage und „Warum ist das falsch?“
  (ausführlich und kurz); eine Antwort kann den Text überschreiben.
- `generators/*`: je Rechenart eine Datei mit derselben Grundform
  (`ChemTask`: Angabe, Schritte mit richtigem Wert, falsche Werte aus
  `errorRules.ts`, Teile für die Klausur mit Punkten und `compute`).
- `bank/*`: Wissensfragen je Thema, TypeScript (Typprüfung, `String.raw`).
  Jede Frage: feste Id, feste Nummer im Thema (nie neu vergeben, gelöschte
  in `RETIRED_NOS`), Stufe, Frage, Antworten, Tipp, Erklärung, Lernkarten,
  Fakt-Schlüssel `fact`, Fundstelle `ref` (Kurzname des Skripts und Folie,
  ohne Personen), optional `exam` (Aufgabe, Punkte).
- `task.ts` (Nummer → Aufgabe), `forms.ts` (eigene Form, nicht
  `formOfLatex`), `focus.ts` (Suche fürs gezielte Üben),
  `exam/blueprint.ts` (Bauplan).

### Aufgabennummern
Format wie bisher „Stufe-Nummer“ mit höchstens sechs Ziffern
(`parseTaskNumber` bleibt unverändert). Gleiche Nummer → gleiche Aufgabe.
- 1 bis 9999: Wissensfrage in Grundform (Nummer je Thema eindeutig, nie neu
  vergeben).
- 10000 bis 499999: erzeugte Rechnungen (eigener Zufallsbereich).
- 500000 bis 999999: Wissensfrage in einer Fassung: Nummer = 500000 + 50 ·
  Fragennummer + Fassung (0 bis 49). Die Fassung wählt die Füllung einer
  Vorlage, die gezeigten falschen Antworten und ihre Reihenfolge. Die
  Wiederholung merkt sich die Fragennummer und nimmt bei jedem Wiederkommen
  eine neue Fassung.
- Passt die Stufe der Adresse nicht zur Stufe der Frage, leitet die App auf
  die richtige Stufe um (gezählt wird die Stufe der Frage). Eine Nummer, zu
  der es nichts gibt (gelöschte Frage, Rechnung in einer Stufe ohne
  Rechnungen), behandelt sie wie eine fehlende Frage: Hinweis und neue
  Aufgabe.
- Die Wahl der nächsten Aufgabe (`pickSeed` statt `pickFresh` bei Chemie,
  auch in `newTaskHref` in `practice.ts` statt `randomSeed()`): erst eine
  fällige Frage, dann je nach Anteil eine ungesehene Frage oder eine erzeugte
  Rechnung mit frischer Form; im freien Modus nur Rechnungen. Öffnet eine
  `#/frei/…`-Adresse eine Wissensfrage, zeigt die App sie geführt, und
  „Nächste Aufgabe“ führt danach in den freien Modus zurück.
- Galerie und Abwechslungs-Test zählen bei Chemie die Rechnungen ab 10000.

### Oberfläche
- `guided/types.ts`: gemeinsame Basis `GuidedTaskBase`; bei Mathe bleibt
  `GuidedTask` mit `expr` und `result` wie heute. `GuidedStep` bekommt
  `interaction?` (Mehrfachauswahl, Zuordnen, Ordnen, Kästchen,
  Massenwirkungsgesetz, Lewis-Baukasten) und `figure?`. Ohne `interaction`
  bleibt alles wie heute.
- `TaskScreen` und `TaskIntro` arbeiten mit `GuidedTaskBase`: die Aufgabe als
  Text mit Formeln (`RichText`) oder als Formel; `expr` und `resultLatex`
  optional (`CardSheetButton` und `CardSheet` mit `task?`; `CardBody` hat
  es schon; Ergebnis-Kasten nur mit Ergebnis).
- Lernkarten: Chemie-Karten in `src/engine/explain/chemCards.ts`, je Thema
  ein Ordner in `TOPICS`. `CardExample` bekommt eine Chemie-Art, die die
  Chemie-Engine durchrechnet (nicht `example.ts`); Wissenskarten haben
  Beispiele als Text. `formulas` darf leer sein (`CardsScreen.tsx` und die
  Kartenliste in `CardSheet.tsx` zeigen dann den Merksatz statt
  `formulas[0]`, `CardBody.tsx` lässt den Formel-Kasten weg).
- Neue Teile in `src/ui/guided/interactions/` und `src/ui/chem/`
  (Abbildungen, Lewis-Formel als SVG mit `currentColor`, Kästchen,
  Koeffizienten, Element-Tastatur, Knöpfe für Konfigurationen),
  `src/ui/exam/` (erst bei Bedarf geladen).
- `CourseEngine` in `courseEngines.ts` unterscheidet `math` und `chem`.
- Formelsatz: die KaTeX-Erweiterung mhchem fest in `renderFormula.ts` und
  `latexChecks.ts` (etwa 8 KB mehr, nur im Formel-Teil, nie auf der
  Startseite). Keine Umlaute in `\ce{…}`.
- Fortschritt: `NamedError.wrongFormula` wird optional, neu ist `wrongText`
  (Aussage statt Formel); `ProgressScreen.tsx` und `CardBody.tsx` zeigen je
  nachdem Formel oder Aussage. Die Grenze `MAX_ATTEMPTS` (heute 1000 gelöste
  Aufgaben über alle Themen zusammen) gilt künftig je Thema (`addAttempt` in
  `progress.ts`, `readProgress` in `storage.ts`), damit viele schnelle
  Wissensfragen den Mathe-Verlauf nicht verdrängen.
- Speicher: Wiederholung im eigenen Schlüssel `rechenweg-fragen`, gemeldete
  Fragen in `rechenweg-meldungen`, laufende Probeklausur und Verlauf in
  `rechenweg-klausur`. Der Hauptspeicher `rechenweg` bleibt bei Version 3
  (keine Umzugsgefahr durch alte App-Versionen). „Fortschritt löschen“ leert
  `rechenweg-fragen` und `rechenweg-klausur`; die gemeldeten Fragen bleiben
  (eigener Knopf „Liste leeren“ in den Einstellungen).
- Adressen (neue Seiten in `routes.ts` und `App.tsx`): `#/klausur/chemie`
  (Start), `#/klausur/chemie/<nummer>` (laufend, ohne Hauptmenü wie eine
  Aufgabe, `showNav` in `App.tsx`), `#/klausur/chemie/<nummer>/ergebnis`,
  `#/klausur/chemie/aufgabe/<n>` (Klausuraufgabe N üben: würfelt eine
  Nummer und leitet weiter auf `#/klausur/chemie/aufgabe/<n>/<nummer>`,
  damit Neuladen dieselbe Aufgabe zeigt).
- Startseite: Überschrift und App-Beschreibung (`HomeScreen.tsx`,
  `index.html`, `vite.config.ts`, `e2e/home.spec.ts`) nach deiner Wahl.
- Neue Farbtöne in `src/index.css` und Bilder in `AreaIcon.tsx` (eigene
  SVG-Zeichnungen), je hell und dunkel auf Kontrast geprüft. Nicht `green`,
  `red`, `amber` (richtig, falsch, Tipp) und nicht die App-Farbe.

### Was sich für die vorhandenen Themen nicht ändern darf
- Gleiche Nummer → gleiche Aufgabe in Mathe; keine Änderung an
  Mathe-Erzeugern, `rng.ts`, `taskNumber.ts`.
- Alle Adressen bleiben gültig.
- Speicherschlüssel `rechenweg` und seine Bedeutung bleiben;
  `rechenweg-formen` bekommt nur neue Einträge.
- Mathe-Typen nur um optionale Felder ergänzt; Aufgaben ohne `interaction`
  und der freie Modus mit MathLive verhalten sich wie heute.
- Formelsatz für Mathe unverändert (mhchem fügt nur `\ce` und `\pu` hinzu).
- Bewusst angepasste Tests: `catalog.test.ts` (Stufenzahl je Fach;
  Prüfung des freien Modus über das Ergebnis der jeweiligen Engine statt
  `toLatex(plan.result)`), `cards.test.ts` (Ordner, Beispiele,
  Formelpflicht nur für Mathe-Karten, bekannte Fehler aller Fächer),
  `progress.test.ts` (Grenze je Thema), `e2e/home.spec.ts` (Überschriften,
  „kommt bald“). Sonst keine Mathe-Tests ändern.

### Tests
- **Fragen** (über alle Sammlungen): Einfachauswahl mit genau einer
  richtigen Antwort und mindestens vier falschen im Vorrat;
  Mehrfachauswahl mit mindestens einer richtigen und einer falschen;
  Antworten paarweise verschieden; Zuordnen eindeutig; Ordnen nur mit
  eindeutiger Reihenfolge; jede falsche Antwort mit Denkfehler und eigenem
  Text (kein Rückfalltext); Ids und Nummern eindeutig und nie neu vergeben;
  alle genannten Lernkarten und Fehler existieren; mindestens 15 Fragen je
  Stufe, in der Fragen gezogen werden.
- **Rechenfehler**: je Fehler ein Katalogbeispiel in `errorRules.test.ts`
  und ein eigener Text „Warum ist das falsch?“ (kein Rückfalltext).
- **Formelsatz**: Jeder Text setzt sich mit KaTeX im strengen Modus; keine
  Unicode-Indizes (₂, ⁺) außerhalb von `$…$`; kein `$` und kein Umlaut in
  `\ce{…}`.
- **Verbotene richtige Antworten**: Die Stolperstellen aus CHEMIE.md
  (z. B. MgO₂ als Produkt aus Magnesium und Sauerstoff, Ethan „sp²“, CO₂
  „gewinkelt“) stehen nie als
  richtige Antwort oder als Aussage auf einer Lernkarte.
- **Rechnungen**: jedes Ergebnis auf zweitem Weg geprüft (Umsatz über die
  direkte Formel und die Massenerhaltung, Gasgesetz durch Einsetzen,
  Born-Haber-Kreis schließt sich, Konfiguration gegen eine
  Referenztabelle, Reaktionsenthalpie der Umkehrreaktion = −ΔH);
  Ausgleichen über die Atom- und Ladungsbilanz mit fast-check; falsche
  Antworten bei Ergebnissen mit Toleranz liegen mindestens 6 % neben der
  Lösung und 3 % auseinander (beim pH 0,2 und 0,15), bei genauen Werten
  sind sie nur verschieden von der Lösung und untereinander; sonst fallen
  sie weg; zwei Fehler, die für jede Aufgabe denselben Wert liefern, haben
  eine gemeinsame Id; die gerundete Lösung wird im freien Modus
  angenommen, jede falsche Antwort abgelehnt.
- **Daten**: Molmassen gegen IUPAC; Gruppe und Periode passen zu Z;
  Ionenladung zur Hauptgruppe; Trends nur, wo Regel und Werte
  übereinstimmen; Moleküle: Valenzelektronen = 2 · (Bindungen + freie
  Paare), Oktett außer bei markierten Ausnahmen, Gestalt passt zu den
  Paaren; Stichproben gegen eine zweite, unabhängig eingetragene Liste.
- **Probeklausur**: jede Nummer ergibt 7 Aufgaben mit 50 Punkten (Teil 1:
  Aufgaben 1 bis 5 mit 30 Punkten), alles lösbar und gegengeprüft; Folgefehler-Test mit absichtlich
  falschem Zwischenwert, auch über Teilaufgaben hinweg.
- **Lernkarten**: ab 1a steht jeder Fehler einer spielbaren Stufe auf einer
  Karte, ab 1b lässt er sich gezielt üben; Schritt 10 prüft zusätzlich alle
  Fehler aller Themen.
- **Browser**: jede Frageart und Eingabe in Handy- und Laptopgröße, hell und
  dunkel; Probeklausur mit vorgespulter Uhr, Neuladen und Abgabe; offline.

### Neue Arbeitsregeln (kommen nach der Freigabe in CLAUDE.md)
- Richtig ist, was die Skripte der Vorlesung oder ein frei zugängliches
  Tabellenwerk sagen. Handschriftliche Ergänzungen und die
  Mitschriften-Mappen liefern nur Ideen und falsche Antworten, nie den
  Beleg für eine richtige.
- Rechnungen, Gleichungen, Formeln, Konfigurationen und Trends rechnet die
  Engine; Wissensfragen und die Beispiele auf Wissenskarten werden durch
  Tests, eine inhaltliche Prüfung je Schritt und „Frage melden“ abgesichert.
- Abwechslung: Rechnungen mit den Kennzahlen aus M2b (Abweichungen je
  Schritt mit Begründung in diesem Plan); Wissensfragen nach den eigenen
  Regeln unter „Abwechslung“ in diesem Plan (mindestens 15 je Stufe, keine
  doppelt, bevor alle dran waren, derselbe Fakt nicht innerhalb von zehn
  Aufgaben, neue Fassung bei jedem Wiederkommen).
- Jede Rechnung nennt die Werte, mit denen sie rechnet.
- Rechenfehler stehen im Katalog in diesem Plan (wie bei Mathe); die
  Denkfehler bei Wissensfragen listet die Galerie aus dem Code, statt sie
  von Hand in der Doku zu pflegen.

## Bekannte Risiken
- **Viel Text.** Etwa 600 Fragen mit Erklärungen und 100 bis 150 Denkfehler.
  Gegenmittel: Texte je Denkfehler statt je Antwort, Vorlagen aus Tabellen,
  Themen einzeln freischalten.
- **Fehler in Quellen.** Handschriftliche Ergänzungen und Mitschriften
  können Fehler enthalten.
  Gegenmittel: Rang der Quellen, Test der verbotenen Antworten, Prüfung je
  Schritt.
- **Toleranz gegen Fehlererkennung.** Rundungen liegen nahe an falschen
  Werten. Gegenmittel: feste Reihenfolge der Urteile und Mindestabstände.
- **Säure-Base und Redox fehlen** (35 % der Punkte). Gegenmittel: so früh wie
  möglich, wenn die Skripte da sind; bis dahin Probeklausur Teil 1.
- **Bedienung am Handy** bei Zuordnen, Ordnen, Kästchen und Lewis-Baukasten.
  Gegenmittel: große Knöpfe, kein Ziehen, Browser-Tests in 390 px.
- **Teilpunkte geschätzt.** Gegenmittel: offen so gekennzeichnet.
