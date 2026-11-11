import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Aufbau des Periodensystems“ (Ids wie in pse.ts). Die Texte nennen
// den Fehler und die Regel, aber nicht die Antwort einer Frage; wo eine Frage genau danach fragt, hat die Antwort
// einen eigenen Text.

export const PSE_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-pse-mass-order': {
    detailed: 'Nach der Masse geordnet, stünden einige Paare in der falschen Reihenfolge (Argon ist schwerer als Kalium). Das heutige Periodensystem ordnet nach einer Größe, die für jedes Element eine ganze Zahl ist.',
    short: 'Die Masse ist nicht das Ordnungsprinzip.',
  },
  'chem-mis-pse-z-meaning': {
    detailed: 'Alle Teilchen im Kern zählt die Massenzahl. Die Ordnungszahl zählt nur eine Teilchensorte, und genau diese legt fest, um welches Element es sich handelt.',
    short: 'Das ist die Massenzahl.',
  },
  'chem-mis-pse-row-column': {
    detailed: 'Zeile und Spalte haben verschiedene Bedeutungen: Die eine nennt die äußerste Schale, die andere, wie viele Elektronen darin sitzen. Prüfe, welche hier gefragt ist.',
    short: 'Zeile und Spalte verwechselt.',
  },
  'chem-mis-pse-period-similar': {
    detailed: 'Innerhalb einer Periode ändert sich die Zahl der Valenzelektronen von Element zu Element; die Eigenschaften reichen vom Metall bis zum Edelgas. Ähnlich sind sich Elemente, die gleich viele Valenzelektronen haben.',
    short: 'In einer Periode ändern sich die Valenzelektronen.',
  },
  'chem-mis-pse-group-number': {
    detailed: 'In der Zählung 1 bis 18 sind die zehn Nebengruppen mitgezählt. Für die Valenzelektronen der Hauptgruppen ab der III. gilt deshalb nicht die Nummer selbst.',
    short: 'In 13 bis 18 stecken die Nebengruppen.',
  },
  'chem-mis-pse-block': {
    detailed: 'Fast jedes Atom hat eine äußerste s-Unterschale, und jede Periode enthält mehrere Blöcke. Der Block hängt davon ab, welche Unterschale beim Element zuletzt aufgefüllt wird.',
    short: 'Der Block folgt der zuletzt aufgefüllten Unterschale.',
  },
  'chem-mis-pse-fe-main': {
    detailed: 'Hauptgruppenelemente füllen s- oder p-Unterschalen auf. Prüfe, welche Unterschale bei Eisen gerade aufgefüllt wird.',
    short: 'Welche Unterschale wird aufgefüllt?',
  },
  'chem-mis-pse-boron-metal': {
    detailed: 'Innerhalb einer Hauptgruppe ändert sich der Metallcharakter von oben nach unten. Das oberste Element einer Gruppe kann deshalb ganz anders sein als die darunter.',
    short: 'Der Metallcharakter ändert sich in der Gruppe.',
  },
  'chem-mis-pse-hydrogen-metal': {
    detailed: 'Der Platz im Periodensystem allein macht ein Element nicht zum Metall. Vergleiche die Eigenschaften von Wasserstoff mit denen von Natrium.',
    short: 'Der Platz allein macht kein Metall.',
  },
  'chem-mis-pse-metal-right': {
    detailed: 'Metalle haben wenige Valenzelektronen und geben sie leicht ab. Überlege, auf welcher Seite des Periodensystems die Elemente mit wenigen Valenzelektronen stehen.',
    short: 'Wo stehen Elemente mit wenigen Valenzelektronen?',
  },
  'chem-mis-pse-noble-reactive': {
    detailed: 'Edelgase reagieren fast gar nicht. Überlege, was andere Atome bei Reaktionen zu erreichen versuchen und ob Edelgase das schon haben.',
    short: 'Edelgase reagieren fast gar nicht.',
  },
  'chem-mis-pse-octet-all': {
    detailed: 'Acht Außenelektronen haben die Edelgase ab Neon. Helium ist anders gebaut: Prüfe, welche Schale bei ihm die äußerste ist und wie viele Elektronen sie fasst.',
    short: 'Helium ist anders gebaut.',
  },
  'chem-mis-pse-charge-sign': {
    detailed: 'Elektronen sind negativ geladen. Überlege, was mit der Gesamtladung passiert, wenn negative Teilchen das Atom verlassen oder dazukommen.',
    short: 'Elektronen sind negativ.',
  },
  'chem-mis-pse-noble-own': {
    detailed: 'Ein Kation gibt Elektronen ab und hat danach weniger Elektronen als das Atom. Das passende Edelgas hat genau so viele Elektronen wie das Ion.',
    short: 'Zähle die Elektronen des Ions.',
  },
  'chem-mis-pse-ie-decrease': {
    detailed: 'Überlege, wie das Teilchen nach jedem abgegebenen Elektron geladen ist und was das für die Anziehung der übrigen Elektronen bedeutet.',
    short: 'Wie ist das Teilchen danach geladen?',
  },
  'chem-mis-pse-li-reactive': {
    detailed: 'In der I. Hauptgruppe sitzt das Valenzelektron von oben nach unten immer weiter außen und wird leichter abgegeben. Überlege, was das für die Heftigkeit der Reaktion bedeutet.',
    short: 'Nach unten wird das Elektron leichter abgegeben.',
  },
  'chem-mis-pse-charge-count': {
    detailed: 'Die Ladung eines Ions ist die Zahl der Elektronen, die es auf dem kürzesten Weg zur Edelgaskonfiguration abgibt oder aufnimmt. Prüfe zuerst, welcher Weg kürzer ist, und zähle dann.',
    short: 'Erst den kürzesten Weg wählen, dann zählen.',
  },
  'chem-mis-pse-ie-count': {
    detailed: 'Valenzelektronen sind die Elektronen, die sich vor dem großen Sprung leicht entfernen lassen. Die Tabelle kann mehr Werte zeigen, und das erste Elektron nach dem Sprung stammt schon aus einer inneren Schale.',
    short: 'Nur die Elektronen vor dem Sprung zählen.',
  },
  'chem-mis-pse-helium-all': {
    detailed: 'Helium ist ein Sonderfall: Seine einzige Schale ist klein. Die übrigen Edelgase haben eine größere äußerste Schale mit s und p.',
    short: 'Helium ist ein Sonderfall.',
  },
  'chem-mis-pse-ie-definition': {
    detailed: 'Elektronen werden vom positiven Kern angezogen. Überlege, ob beim Entfernen eines Elektrons gegen diese Anziehung Energie frei wird oder ob man welche hineinstecken muss.',
    short: 'Denk an die Anziehung durch den Kern.',
  },
}
