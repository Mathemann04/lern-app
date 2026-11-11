import type { ChemErrorRule } from './errorRules.ts'

// Rechenfehler zum Thema „Trends im Periodensystem" (S6d), Teil von CHEM_ERROR_RULES in errorRules.ts. Katalog in
// docs/PLAN-M4.md, „Katalog der Rechenfehler"; Katalogbeispiele in generators/trends.test.ts. Die Texte nennen den
// Fehler und die Regel, aber nicht das Ergebnis des Schritts.

const C = 'chem-trends'
const r = String.raw

export const TREND_ERROR_RULES: readonly ChemErrorRule[] = [
  {
    id: 'chem-tr-radius-period',
    course: C,
    name: 'Mehr Elektronen für ein größeres Atom gehalten (Periode)',
    wrongFormula: r`\ce{Cl}\ \text{größer als}\ \ce{Na}`,
    why: {
      detailed: 'In einer Periode kommen zwar Elektronen dazu, aber alle in dieselbe Schale. Gleichzeitig wächst die Kernladung, die alle Elektronen stärker anzieht. Überlege, was davon überwiegt.',
      short: 'Gleiche Schale, mehr Kernladung.',
    },
  },
  {
    id: 'chem-tr-radius-group',
    course: C,
    name: 'Mehr Protonen für ein kleineres Atom gehalten (Gruppe)',
    wrongFormula: r`\ce{K}\ \text{kleiner als}\ \ce{Na}`,
    why: {
      detailed: 'In einer Gruppe kommt nach unten jedes Mal eine ganze Schale dazu. Die größere Kernladung wird von den inneren Elektronen weitgehend abgeschirmt.',
      short: 'Nach unten kommt eine Schale dazu.',
    },
  },
  {
    id: 'chem-tr-ie-period',
    course: C,
    name: 'Ionisierungsenergie in der Periode falsch herum',
    wrongFormula: r`\ce{Na}\ \text{schwerer zu ionisieren als}\ \ce{Cl}`,
    why: {
      detailed: 'In einer Periode wächst die Kernladung, während die Valenzelektronen in derselben Schale bleiben. Überlege, wie fest sie dadurch gehalten werden.',
      short: 'Mehr Kernladung, gleiche Schale.',
    },
  },
  {
    id: 'chem-tr-ie-group',
    course: C,
    name: 'Ionisierungsenergie in der Gruppe falsch herum',
    wrongFormula: r`\ce{K}\ \text{schwerer zu ionisieren als}\ \ce{Na}`,
    why: {
      detailed: 'In einer Gruppe sitzen die Valenzelektronen nach unten immer weiter außen und sind stärker abgeschirmt. Überlege, wie leicht sie sich dann entfernen lassen.',
      short: 'Weiter außen, stärker abgeschirmt.',
    },
  },
  {
    id: 'chem-tr-en-period',
    course: C,
    name: 'Elektronegativität in der Periode falsch herum',
    wrongFormula: r`\ce{Li}\ \text{elektronegativer als}\ \ce{F}`,
    why: {
      detailed: 'Die Elektronegativität beschreibt, wie stark ein Atom Bindungselektronen anzieht. In einer Periode wächst die Kernladung bei gleicher Zahl von Schalen.',
      short: 'Mehr Kernladung zieht stärker.',
    },
  },
  {
    id: 'chem-tr-en-group',
    course: C,
    name: 'Elektronegativität in der Gruppe falsch herum',
    wrongFormula: r`\ce{I}\ \text{elektronegativer als}\ \ce{Cl}`,
    why: {
      detailed: 'In einer Gruppe liegen die Bindungselektronen nach unten weiter vom Kern entfernt und sind stärker abgeschirmt. Überlege, wie stark sie dann angezogen werden.',
      short: 'Weiter außen, schwächer angezogen.',
    },
  },
  {
    id: 'chem-tr-constant',
    course: C,
    name: 'Kein Trend angenommen',
    wrongFormula: r`\ce{Na}\ \text{und}\ \ce{Cl}\ \text{gleich groß}`,
    why: {
      detailed: 'Von Element zu Element ändern sich Kernladung oder Zahl der Schalen. Beides wirkt sich auf Größe und Anziehung der Elektronen aus; die Werte bleiben also nicht gleich.',
      short: 'Kernladung oder Schalen ändern sich.',
    },
  },
  {
    id: 'chem-tr-order-middle',
    course: C,
    name: 'Zwei benachbarte Elemente vertauscht',
    wrongFormula: r`\text{Atomradius: } \ce{Cl} < \ce{Na} < \ce{Mg}`,
    why: {
      detailed: 'In einer Reihe muss jedes Element zu seinem Nachbarn passen. Hier stimmt die Reihenfolge an einer Stelle nicht. Prüfe jedes benachbarte Paar einzeln nach der Regel.',
      short: 'Prüfe jedes benachbarte Paar.',
    },
  },
  {
    id: 'chem-tr-ion-reversed',
    course: C,
    name: 'Mehr Protonen für ein größeres Ion gehalten',
    wrongFormula: r`\ce{Al^3+}\ \text{größer als}\ \ce{O^2-}`,
    why: {
      detailed: 'Teilchen mit gleich vielen Elektronen unterscheiden sich nur in der Zahl der Protonen. Überlege, wie eine größere Kernladung auf dieselbe Elektronenhülle wirkt.',
      short: 'Wie wirkt mehr Kernladung auf dieselbe Hülle?',
    },
  },
  {
    id: 'chem-tr-ion-same',
    course: C,
    name: 'Gleiche Elektronenzahl für gleiche Größe gehalten',
    wrongFormula: r`\ce{Na+}\ \text{und}\ \ce{F-}\ \text{gleich groß}`,
    why: {
      detailed: 'Gleich viele Elektronen heißt nicht gleich groß. Die Teilchen haben verschieden viele Protonen, und der Kern zieht die Hülle unterschiedlich stark zusammen.',
      short: 'Die Protonenzahl ist verschieden.',
    },
  },
]
