import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Trends im Periodensystem“ (Ids wie in trends.ts). Die Texte nennen
// den Fehler und die Regel, aber nicht die Antwort einer Frage; wo eine Frage genau danach fragt, hat die Antwort einen
// eigenen Text.

export const TRENDS_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-tr-radius-electrons': {
    detailed: 'In einer Periode kommen die neuen Elektronen alle in dieselbe Schale. Gleichzeitig wächst die Kernladung. Überlege, was davon für die Größe entscheidend ist.',
    short: 'Gleiche Schale, wachsende Kernladung.',
  },
  'chem-mis-tr-radius-protons': {
    detailed: 'In einer Gruppe kommt nach unten nicht nur Kernladung dazu, sondern jedes Mal eine ganze Schale. Die zusätzliche Kernladung wird von den inneren Elektronen weitgehend abgeschirmt.',
    short: 'Nach unten kommt eine Schale dazu.',
  },
  'chem-mis-tr-radius-mass': {
    detailed: 'Die Masse steckt fast ganz im winzigen Kern. Die Größe eines Atoms bestimmt seine Elektronenhülle, und die hängt von Schalen und Kernladung ab.',
    short: 'Die Größe bestimmt die Hülle, nicht die Masse.',
  },
  'chem-mis-tr-shielding': {
    detailed: 'Überlege, was zwischen dem Kern und den äußeren Elektronen liegt und wie sich geladene Teilchen gegenseitig beeinflussen.',
    short: 'Was liegt zwischen Kern und äußeren Elektronen?',
  },
  'chem-mis-tr-constant': {
    detailed: 'Von Element zu Element ändern sich Kernladung oder Zahl der Schalen. Beides wirkt auf die Elektronenhülle; die Werte bleiben also nicht gleich.',
    short: 'Kernladung oder Schalen ändern sich.',
  },
  'chem-mis-tr-ie-reversed': {
    detailed: 'Überlege, wo die Valenzelektronen weiter unten in einer Gruppe sitzen und wie stark sie abgeschirmt sind. Davon hängt ab, wie viel Energie ihr Entfernen kostet.',
    short: 'Wo sitzen die Valenzelektronen weiter unten?',
  },
  'chem-mis-tr-ie-noble-low': {
    detailed: 'Überlege, wie die Ionisierungsenergie innerhalb einer Periode verläuft und welche Elemente am Ende jeder Periode stehen.',
    short: 'Wie verläuft der Trend in der Periode?',
  },
  'chem-mis-tr-en-ea-same': {
    detailed: 'Hier sind zwei ähnlich klingende Begriffe verwechselt. Überlege genau, welcher Vorgang oder welche Situation zu dem gefragten Begriff gehört.',
    short: 'Zwei Begriffe verwechselt.',
  },
  'chem-mis-tr-en-max-cl': {
    detailed: 'Chlor zieht Bindungselektronen stark an, aber nicht am stärksten. Überlege, in welche Richtungen die Elektronegativität in Periode und Gruppe zunimmt.',
    short: 'Prüfe die Richtungen des Trends.',
  },
  'chem-mis-tr-noble-en': {
    detailed: 'Überlege, wofür die Elektronegativität gedacht ist und ob die leichten Edelgase in solchen Situationen vorkommen.',
    short: 'Wofür ist die Elektronegativität gedacht?',
  },
  'chem-mis-tr-metal-right': {
    detailed: 'Metalle geben ihre Valenzelektronen leicht ab. Überlege, wo im Periodensystem die Elemente mit wenigen, weit außen sitzenden Valenzelektronen stehen.',
    short: 'Wo werden Elektronen leicht abgegeben?',
  },
  'chem-mis-tr-cation-larger': {
    detailed: 'Überlege, welche Elektronen ein Kation abgegeben hat und was das für seine Elektronenhülle bedeutet. Der Kern bleibt dabei gleich.',
    short: 'Was geschieht mit der Hülle?',
  },
  'chem-mis-tr-anion-smaller': {
    detailed: 'Überlege, was sich beim Aufnehmen von Elektronen an der Hülle ändert und was am Kern gleich bleibt.',
    short: 'Was ändert sich an der Hülle?',
  },
  'chem-mis-tr-ion-protons': {
    detailed: 'Bei gleich vielen Elektronen unterscheiden sich die Teilchen nur in der Kernladung. Überlege, wie eine größere Kernladung auf dieselbe Elektronenhülle wirkt.',
    short: 'Wie wirkt mehr Kernladung auf dieselbe Hülle?',
  },
  'chem-mis-tr-ea-sign': {
    detailed: 'Das gilt nur für manche Atome. Überlege, ob es für ein Atom, dem bis zum Oktett nur wenige Elektronen fehlen, günstig oder ungünstig ist, eines aufzunehmen.',
    short: 'Das gilt nur für manche Atome.',
  },
}
