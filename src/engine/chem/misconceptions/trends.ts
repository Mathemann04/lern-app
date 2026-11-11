import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Trends im Periodensystem“: Name und falsche Aussage (klein, für Fehlerstatistik und
// Lernkarten). Die Erklärungen stehen in trendsWhy.ts. Regeln in docs/CHEMIE.md §8.

export const TRENDS_MISCONCEPTIONS: readonly MisconceptionName[] = [
  { id: 'chem-mis-tr-radius-electrons', name: 'Mehr Elektronen, größeres Atom', wrongText: 'Innerhalb einer Periode werden die Atome größer, weil Elektronen dazukommen.' },
  { id: 'chem-mis-tr-radius-protons', name: 'Mehr Protonen, kleineres Atom auch in der Gruppe', wrongText: 'Auch in einer Gruppe werden die Atome nach unten kleiner, weil die Kernladung steigt.' },
  { id: 'chem-mis-tr-radius-mass', name: 'Masse als Grund für Größe und Anziehung', wrongText: 'Die Masse eines Atoms bestimmt, wie groß es ist und wie fest es Elektronen hält.' },
  { id: 'chem-mis-tr-shielding', name: 'Abschirmung übersehen', wrongText: 'Die inneren Elektronen haben keinen Einfluss darauf, wie stark der Kern die äußeren anzieht.' },
  { id: 'chem-mis-tr-constant', name: 'Kein Trend angenommen', wrongText: 'Innerhalb einer Periode oder Gruppe bleiben Atomradius, Ionisierungsenergie und Elektronegativität gleich.' },
  { id: 'chem-mis-tr-ie-reversed', name: 'Ionisierungsenergie falsch herum', wrongText: 'Die Ionisierungsenergie nimmt in einer Periode nach links oder in einer Hauptgruppe nach unten zu.' },
  { id: 'chem-mis-tr-ie-noble-low', name: 'Edelgase leicht zu ionisieren', wrongText: 'Edelgase geben ein Elektron besonders leicht ab.' },
  { id: 'chem-mis-tr-en-ea-same', name: 'Elektronegativität und Elektronenaffinität verwechselt', wrongText: 'Elektronegativität und Elektronenaffinität sind dasselbe.' },
  { id: 'chem-mis-tr-en-max-cl', name: 'Falsches Element als elektronegativstes', wrongText: 'Chlor oder Sauerstoff hat die größte Elektronegativität aller Elemente.' },
  { id: 'chem-mis-tr-en-reversed', name: 'Elektronegativität falsch herum', wrongText: 'Die Elektronegativität nimmt in einer Periode nach links oder in einer Hauptgruppe nach unten zu.' },
  { id: 'chem-mis-tr-noble-en', name: 'Edelgase für stark elektronegativ gehalten', wrongText: 'Neon zieht Bindungselektronen stärker an als Fluor.' },
  { id: 'chem-mis-tr-metal-right', name: 'Metallcharakter falsch herum', wrongText: 'Der Metallcharakter nimmt im Periodensystem nach rechts und oben zu.' },
  { id: 'chem-mis-tr-cation-larger', name: 'Kation größer als sein Atom', wrongText: 'Ein Kation ist größer als das Atom, aus dem es entstanden ist.' },
  { id: 'chem-mis-tr-anion-smaller', name: 'Anion kleiner als sein Atom', wrongText: 'Ein Anion ist kleiner als das Atom, aus dem es entstanden ist.' },
  { id: 'chem-mis-tr-ion-protons', name: 'Mehr Protonen, größeres Ion', wrongText: 'Von Teilchen mit gleich vielen Elektronen ist das mit den meisten Protonen am größten.' },
  { id: 'chem-mis-tr-ea-sign', name: 'Elektronenaffinität als aufgewendete Energie', wrongText: 'Um einem Atom ein Elektron hinzuzufügen, muss man immer Energie aufwenden.' },
]
