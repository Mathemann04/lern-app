# Plan für Meilenstein 6: Neue Struktur (Entwurf)

Status: **Entwurf**, festgehalten am 10.11.2026 auf Wunsch des Nutzers.
Gebaut wird **nach Abschluss von M4 (Chemie 1) und vor M5 (Werkstoffkunde)**,
damit Werkstoffkunde gleich in der neuen Struktur entsteht. Vor dem Bauen wird
aus diesem Entwurf der ausführliche Plan mit Schritten (Teil A und Teil B wie
bei M1 bis M4); erst nach dem OK des Nutzers wird programmiert.

Der Nutzer hat den Entwurf als Bild (Design-Canvas „Rechenweg – neue Struktur
(Entwurf)“ mit der Startseite und der Seite „Gleichungen umstellen“). Dieses
Dokument beschreibt denselben Stand in Worten.

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

- **Startseite:** oben „Weitermachen“ (letzte Auswahl, Stufe, Modus). Je Fach
  nur, was es schon gibt: Mathe mit den Kacheln der Tätigkeiten und „Mathe
  mischen“; Chemie wie bisher mit ihren Gebieten und „Themen mischen“. Alles,
  was noch fehlt, steht in **einer** Zeile „Demnächst“ statt in blassen Kacheln.
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
- **Chemie** bleibt wie seit S1b (Thema → Unterthemen ankreuzen → Stufe,
  dazu „Themen mischen“). Die Auswahl-Teile von dort (`PartPicker.tsx`,
  `MixScreen.tsx`, `selection.ts`, `mix.ts`) werden für Mathe
  wiederverwendet, damit die App überall gleich funktioniert.

## Was technisch dafür nötig ist (für den ausführlichen Plan)

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
- Schritte (Vorschlag, Reihenfolge im Plan festlegen): Startseite aufräumen;
  Schlagworte und Auswahl für „Gleichungen umstellen“; dasselbe für
  „Vereinfachen“ und „Ableiten“; leichte Aufgaben je Baustein; Fortschritt je
  Baustein und „Meine Schwächen“.

## Offene Fragen für den ausführlichen Plan

- Genaue Liste der Bausteine je Tätigkeit, abgeglichen mit
  [LEHRBUCH.md](LEHRBUCH.md) und der Vorlesung MB1 (der Nutzer ergänzt
  fehlende).
- M7 (Vektoren) und M8 (Potenz-, Wurzel- und Logarithmusgesetze): als
  Bausteine oder eigene Tätigkeiten in dieser Struktur statt als eigene
  Gebiete?
- Namen der Stufen (Vorschlag oben).
- „Integrieren“ als eigene Tätigkeit (heute nur als Werkzeug in Stufe 5 von
  „Gleichungen umstellen“).
