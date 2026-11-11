import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Elektronen“ (Ids wie in elektronen.ts). Die Texte nennen den Fehler
// und die Regel, aber keine Tabellenwerte und nicht die Antwort einer Frage; wo eine Frage genau danach fragt, hat die
// Antwort einen eigenen Text.

export const ELEKTRONEN_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-el-qn-meaning': {
    detailed: 'Hier ist die Aufgabe einer Quantenzahl verwechselt. Jede der vier hat eine andere: Eine nummeriert die Schalen, eine legt die Form fest, eine die Richtung im Raum, eine den Spin. Überlege, welche Werte die gefragte Quantenzahl annimmt und was sich mit ihnen ändert.',
    short: 'Jede Quantenzahl hat eine eigene Aufgabe.',
  },
  'chem-mis-el-l-to-n': {
    detailed: 'Die Nebenquantenzahl ist durch die Hauptquantenzahl begrenzt und erreicht sie nie. Prüfe, welche Werte für die gefragte Schale übrig bleiben.',
    short: 'l ist durch n begrenzt.',
  },
  'chem-mis-el-m-range': {
    detailed: 'Die Magnetquantenzahl ist durch die Nebenquantenzahl begrenzt, und zwar nach oben und nach unten gleich weit um 0. Prüfe beide Grenzen.',
    short: 'm ist durch l begrenzt, nach oben und unten.',
  },
  'chem-mis-el-spin-values': {
    detailed: 'Der Spin hängt weder von n noch von l ab und hat weniger Möglichkeiten als die anderen Quantenzahlen. Denk an das Kästchenbild: In welche Richtungen kann ein Pfeil zeigen, und welche Zahlen gehören dazu?',
    short: 'Denk an die Pfeile im Kästchenbild.',
  },
  'chem-mis-el-orbital-count': {
    detailed: 'Hier sind Orbitale und Plätze verwechselt. In jedes Orbital passen zwei Elektronen; die Zahl der Plätze und die Zahl der Orbitale sind also verschieden.',
    short: 'Orbitale und Plätze sind nicht dasselbe.',
  },
  'chem-mis-el-orbital-path': {
    detailed: 'Feste Bahnen gehören zum älteren Atommodell von Bohr. Das Orbitalmodell gibt für ein Elektron keine Bahn mehr an.',
    short: 'Im Orbitalmodell gibt es keine Bahnen.',
  },
  'chem-mis-el-shape': {
    detailed: 'Hier sind die Formen der Orbitale vertauscht. Überlege, ob beim gefragten Orbital die Aufenthaltswahrscheinlichkeit von der Richtung abhängt oder nur vom Abstand zum Kern.',
    short: 'Die Formen sind vertauscht.',
  },
  'chem-mis-el-orbital-energy': {
    detailed: 'Die Orbitale einer Unterschale haben dieselbe Form und denselben Abstand zum Kern; sie unterscheiden sich nur in ihrer Richtung im Raum. Überlege, ob die Richtung allein die Energie ändern kann.',
    short: 'Sie unterscheiden sich nur in der Richtung.',
  },
  'chem-mis-el-shell-8': {
    detailed: 'Acht Elektronen sind das Oktett der äußersten Schale vieler Atome, keine Grenze für jede Schale. Höhere Schalen haben mehr Unterschalen und damit mehr Plätze.',
    short: 'Das Oktett ist keine Grenze der Schale.',
  },
  'chem-mis-el-shell-2n': {
    detailed: 'Die Plätze einer Schale wachsen schneller als n: Jede Schale hat mehr Orbitale als die vorherige, und jedes Orbital fasst zwei Elektronen. Zähle die Orbitale aller Unterschalen der Schale.',
    short: 'Zähle alle Orbitale der Schale.',
  },
  'chem-mis-el-pauli-same': {
    detailed: 'Das Pauli-Prinzip verbietet, dass zwei Elektronen eines Atoms in allen vier Quantenzahlen übereinstimmen. Überlege, was das für Elektronen im selben Orbital bedeutet.',
    short: 'Pauli: nie alle vier Quantenzahlen gleich.',
  },
  'chem-mis-el-pauli-hund': {
    detailed: 'Hier sind zwei Regeln vertauscht. Die eine begrenzt, wie viele Elektronen in ein Orbital passen; die andere sagt, wie sich Elektronen auf gleichwertige Orbitale verteilen.',
    short: 'Pauli und Hund sind vertauscht.',
  },
  'chem-mis-el-hund-pair': {
    detailed: 'Hier wurden Paare gebildet, obwohl gleichwertige Orbitale noch leer waren. Das widerspricht der Hund’schen Regel.',
    short: 'Paare zu früh gebildet.',
  },
  'chem-mis-el-order-n': {
    detailed: 'Besetzt wird nicht nach der Nummer der Schale, sondern nach der Energie der Unterschalen. Ab der 4. Schale weichen die beiden Reihenfolgen voneinander ab.',
    short: 'Es zählt die Energie, nicht die Nummer der Schale.',
  },
  'chem-mis-el-d-count': {
    detailed: 'Nicht alle Elektronen nach dem Edelgaskern sind d-Elektronen. Prüfe, welche Unterschale vor 3d gefüllt wird und wie viele Elektronen sie fasst.',
    short: 'Vor 3d wird eine andere Unterschale gefüllt.',
  },
  'chem-mis-el-exception': {
    detailed: 'Bei einigen Übergangsmetallen weicht der Grundzustand von der einfachen Reihenfolge ab, weil bestimmte Besetzungen der d-Unterschale besonders günstig sind. Prüfe, ob das Element zu diesen Ausnahmen gehört.',
    short: 'Hier gilt eine Ausnahme.',
  },
  'chem-mis-el-cr-shells': {
    detailed: 'Chrom gehört zu den Ausnahmen der Besetzungsreihenfolge. Zähle die Elektronen je Schale aus seiner richtigen Konfiguration; 3d gehört zur dritten Schale, 4s zur vierten.',
    short: 'Chrom ist eine Ausnahme.',
  },
  'chem-mis-el-half-full': {
    detailed: 'Bestimmte Besetzungen einer Unterschale sind besonders günstig; das erklärt auch die Ausnahmen in der Besetzungsreihenfolge. Überlege, welche Besetzungen der d-Unterschale das sind.',
    short: 'Manche d-Besetzungen sind besonders günstig.',
  },
  'chem-mis-el-ion-3d': {
    detailed: 'Kationen geben nicht unbedingt die zuletzt eingebauten Elektronen ab. Entscheidend ist, welche Elektronen am weitesten außen sitzen.',
    short: 'Es zählt, welche Elektronen außen sitzen.',
  },
  'chem-mis-el-noble-ion': {
    detailed: 'Überlege, wie viele Elektronen das Ion hat und welche Schalen davon voll bleiben. Das passende Edelgas hat genau so viele Elektronen wie das Ion.',
    short: 'Zähle die Elektronen des Ions.',
  },
  'chem-mis-el-fe-main': {
    detailed: 'Haupt- und Nebengruppenelemente unterscheiden sich darin, welche Art von Unterschale gerade aufgefüllt wird. Prüfe das an der Konfiguration des Elements.',
    short: 'Welche Unterschale wird aufgefüllt?',
  },
  'chem-mis-el-f-six': {
    detailed: 'Zähle die Elektronen der äußersten Schale aus der Konfiguration von Fluor. Dazu gehören die s- und die p-Elektronen dieser Schale.',
    short: 'Zähle s und p der äußersten Schale.',
  },
  'chem-mis-el-valence-all': {
    detailed: 'Nicht alle Elektronen nehmen an Bindungen teil. Die inneren sind fest an den Kern gebunden und gehören zum Atomrumpf.',
    short: 'Die inneren Elektronen gehören zum Rumpf.',
  },
  'chem-mis-el-wrong-shell': {
    detailed: 'Die Nummer der Periode und die Nummer der äußersten Schale hängen fest zusammen. Prüfe, in welcher Schale die Valenzelektronen eines Elements dieser Periode sitzen.',
    short: 'Periode und äußerste Schale hängen zusammen.',
  },
  'chem-mis-el-unpaired-valence': {
    detailed: 'Ungepaart ist nur ein Elektron, das allein in seinem Orbital sitzt. Auch Valenzelektronen bilden Paare, sobald eine Unterschale mehr Elektronen als Orbitale hat.',
    short: 'Auch Valenzelektronen bilden Paare.',
  },
}
