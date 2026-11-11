import type { ChemErrorRule } from './errorRules.ts'

// Rechenfehler zum Thema „Aufbau des Periodensystems" (S6c), Teil von CHEM_ERROR_RULES in errorRules.ts. Katalog in
// docs/PLAN-M4.md, „Katalog der Rechenfehler"; Katalogbeispiele in generators/pse.test.ts. Die Texte nennen den Fehler
// und die Regel, aber nicht das Ergebnis des Schritts.

const C = 'chem-pse'
const r = String.raw

export const PSE_ERROR_RULES: readonly ChemErrorRule[] = [
  // --- Steckbrief ---
  {
    id: 'chem-pse-period-valence',
    course: C,
    name: 'Zahl der Valenzelektronen als Periode',
    wrongFormula: r`\ce{S}\text{: } 6.\ \text{Periode}`,
    why: {
      detailed: 'Die Periode ist die Zeile im Periodensystem und gibt an, welche Schale die äußerste ist. Wie viele Elektronen in dieser Schale sitzen, zeigt die Spalte.',
      short: 'Periode = Zeile = äußerste Schale.',
    },
  },
  {
    id: 'chem-pse-period-shells',
    course: C,
    name: 'Nur die vollen Schalen gezählt',
    wrongFormula: r`\ce{S}\text{: } 2.\ \text{Periode}`,
    why: {
      detailed: 'Zur Periode zählt auch die äußerste Schale, selbst wenn sie nur teilweise besetzt ist. Die Nummer der Periode ist die Nummer dieser Schale.',
      short: 'Die äußerste Schale zählt mit.',
    },
  },
  {
    id: 'chem-pse-group-period',
    course: C,
    name: 'Periode als Hauptgruppe gelesen',
    wrongFormula: r`\ce{S}\text{: III. Hauptgruppe}`,
    why: {
      detailed: 'Zeile und Spalte sind verwechselt. Die Periode (Zeile) nennt die äußerste Schale; die Hauptgruppe (Spalte) nennt, wie viele Elektronen darin sitzen.',
      short: 'Zeile und Spalte verwechselt.',
    },
  },
  {
    id: 'chem-pse-group-number-valence',
    course: C,
    name: 'Valenzelektronen als Gruppennummer 1 bis 18',
    wrongFormula: r`\ce{P}\text{: Gruppe } 5`,
    why: {
      detailed: 'In der Zählung 1 bis 18 liegen die zehn Nebengruppen zwischen der II. und der III. Hauptgruppe. Für Hauptgruppen ab der III. ist die Nummer deshalb um zehn größer als die Zahl der Valenzelektronen.',
      short: 'Ab der III. Hauptgruppe zehn dazu.',
    },
  },
  {
    id: 'chem-pse-transition-main',
    course: C,
    name: 'Nebengruppenelement als Hauptgruppenelement',
    wrongFormula: r`\ce{Fe}\text{: VIII. Hauptgruppe}`,
    why: {
      detailed: 'Bei den Nebengruppenelementen wird eine d-Unterschale aufgefüllt. Sie stehen im Block zwischen der II. und der III. Hauptgruppe; ihre Gruppennummer gehört nicht zu den Hauptgruppen.',
      short: 'd-Elemente stehen in den Nebengruppen.',
    },
  },
  {
    id: 'chem-pse-transition-s',
    course: C,
    name: 'Nur die s-Elektronen gezählt',
    wrongFormula: r`\ce{Fe}\text{: II. Hauptgruppe}`,
    why: {
      detailed: 'Elektronen in der äußersten s-Unterschale haben fast alle Elemente. Entscheidend für den Platz ist, welche Unterschale zuletzt aufgefüllt wird; bei einer d-Unterschale ist es ein Nebengruppenelement.',
      short: 'Entscheidend ist die zuletzt aufgefüllte Unterschale.',
    },
  },
  {
    id: 'chem-pse-block-outer-s',
    course: C,
    name: 'Block nach der äußersten s-Unterschale',
    wrongFormula: r`\ce{Fe}\text{: s-Block}`,
    why: {
      detailed: 'Fast jedes Atom hat Elektronen in der äußersten s-Unterschale. Der Block richtet sich nach der Unterschale, die beim Element zuletzt aufgefüllt wird.',
      short: 'Der Block folgt der zuletzt aufgefüllten Unterschale.',
    },
  },
  {
    id: 'chem-pse-block-period4',
    course: C,
    name: 'Ab der 4. Periode alles als d-Block',
    wrongFormula: r`\ce{K}\text{: d-Block}`,
    why: {
      detailed: 'Auch in der 4. Periode beginnt jede Zeile mit dem s-Block. Die d-Unterschale wird erst nach der äußersten s-Unterschale aufgefüllt.',
      short: 'Jede Periode beginnt mit dem s-Block.',
    },
  },
  // --- Element aus dem Steckbrief ---
  {
    id: 'chem-pse-rev-swapped',
    course: C,
    name: 'Periode und Valenzelektronen vertauscht',
    wrongFormula: r`3.\ \text{Periode, 5 Valenzelektronen: } \ce{In}`,
    why: {
      detailed: 'Die Periode ist die Zeile, die Zahl der Valenzelektronen die Hauptgruppe, also die Spalte. Hier sind beide vertauscht.',
      short: 'Zeile und Spalte vertauscht.',
    },
  },
  {
    id: 'chem-pse-rev-group-number',
    course: C,
    name: 'Valenzelektronen als Gruppennummer 1 bis 18',
    wrongFormula: r`4.\ \text{Periode, 5 Valenzelektronen: } \ce{V}`,
    why: {
      detailed: 'Die Zahl der Valenzelektronen ist die römische Nummer der Hauptgruppe. In der Zählung 1 bis 18 kommen ab der III. Hauptgruppe zehn Nebengruppen dazu.',
      short: 'Römische Nummer, nicht Gruppe 1 bis 18.',
    },
  },
  {
    id: 'chem-pse-rev-period-shift',
    course: C,
    name: 'Periode um eins verschoben',
    wrongFormula: r`3.\ \text{Periode, 5 Valenzelektronen: } \ce{N}`,
    why: {
      detailed: 'Die Perioden werden von oben gezählt, die erste Zeile mit Wasserstoff und Helium ist die 1. Periode. Zähle die Zeilen noch einmal ab.',
      short: 'Die erste Zeile ist die 1. Periode.',
    },
  },
  // --- Ionen ---
  {
    id: 'chem-pse-ion-take',
    course: C,
    name: 'Metall nimmt Elektronen auf',
    wrongFormula: r`\ce{Na}\text{: nimmt 7 Elektronen auf}`,
    why: {
      detailed: 'Ein Atom erreicht die Edelgaskonfiguration auf dem kürzesten Weg. Mit wenigen Valenzelektronen ist es viel einfacher, diese abzugeben, als die Schale aufzufüllen.',
      short: 'Wenige Valenzelektronen gibt man ab.',
    },
  },
  {
    id: 'chem-pse-ion-give',
    course: C,
    name: 'Atom mit vielen Valenzelektronen gibt ab',
    wrongFormula: r`\ce{O}\text{: gibt 6 Elektronen ab}`,
    why: {
      detailed: 'Ein Atom erreicht die Edelgaskonfiguration auf dem kürzesten Weg. Hat es fünf bis sieben Valenzelektronen, fehlen nur wenige bis zum Oktett; es nimmt diese auf, statt viele abzugeben.',
      short: 'Fehlen wenige, nimmt man auf.',
    },
  },
  {
    id: 'chem-pse-charge-sign',
    course: C,
    name: 'Vorzeichen der Ladung vertauscht',
    wrongFormula: r`\ce{Na-}`,
    why: {
      detailed: 'Elektronen sind negativ geladen. Wer Elektronen abgibt, behält einen Überschuss an Protonen und wird positiv; wer welche aufnimmt, wird negativ.',
      short: 'Abgeben macht positiv, aufnehmen negativ.',
    },
  },
  {
    id: 'chem-pse-charge-group-number',
    course: C,
    name: 'Gruppennummer 13 als Ladung',
    wrongFormula: r`\ce{Al^13+}`,
    why: {
      detailed: 'Die Ladung entspricht der Zahl der abgegebenen Elektronen, also der Valenzelektronen. In der Zählung 1 bis 18 stecken die zehn Nebengruppen mit drin.',
      short: 'Ladung = abgegebene Elektronen.',
    },
  },
  {
    id: 'chem-pse-charge-valence',
    course: C,
    name: 'Valenzelektronen als positive Ladung',
    wrongFormula: r`\ce{P^5+}`,
    why: {
      detailed: 'Ein Atom mit fünf bis sieben Valenzelektronen erreicht das Oktett, indem es die fehlenden Elektronen aufnimmt. Seine Ladung ist deshalb negativ und so groß wie die Zahl der fehlenden Elektronen.',
      short: 'Bei fünf bis sieben Valenzelektronen: aufnehmen.',
    },
  },
  {
    id: 'chem-pse-charge-octet',
    course: C,
    name: 'Bis zum Oktett aufgefüllt statt abgegeben',
    wrongFormula: r`\ce{Na^7-}`,
    why: {
      detailed: 'Ein Metall mit wenigen Valenzelektronen gibt diese ab; das ist viel einfacher, als die Schale bis zum Oktett aufzufüllen. Seine Ladung ist deshalb positiv.',
      short: 'Metalle geben ab.',
    },
  },
  {
    id: 'chem-pse-noble-own-period',
    course: C,
    name: 'Edelgas der eigenen Periode beim Kation',
    wrongFormula: r`\ce{Na+}\text{: wie Argon}`,
    why: {
      detailed: 'Ein Kation gibt seine äußerste Schale ab. Übrig bleibt die Konfiguration des Edelgases davor, am Ende der vorherigen Periode.',
      short: 'Kationen: Edelgas davor.',
    },
  },
  {
    id: 'chem-pse-noble-previous',
    course: C,
    name: 'Edelgas der vorherigen Periode beim Anion',
    wrongFormula: r`\ce{Cl-}\text{: wie Neon}`,
    why: {
      detailed: 'Ein Anion füllt seine äußerste Schale auf. Es erreicht die Konfiguration des Edelgases am Ende seiner eigenen Periode.',
      short: 'Anionen: Edelgas der eigenen Periode.',
    },
  },
  // --- Ionisierungsenergie ---
  {
    id: 'chem-pse-ie-largest',
    course: C,
    name: 'Größten Wert statt größten Sprung gesucht',
    wrongFormula: r`\ce{Mg}\text{: Sprung zwischen } I_{3} \text{ und } I_{4}`,
    why: {
      detailed: 'Jede weitere Ionisierungsenergie ist größer als die vorige; der letzte Wert ist deshalb immer der größte. Gesucht ist die Stelle, an der die Energie plötzlich auf ein Vielfaches steigt.',
      short: 'Gesucht ist der Sprung, nicht der größte Wert.',
    },
  },
  {
    id: 'chem-pse-ie-first',
    course: C,
    name: 'Ersten Anstieg für den Sprung gehalten',
    wrongFormula: r`\ce{Al}\text{: Sprung zwischen } I_{1} \text{ und } I_{2}`,
    why: {
      detailed: 'Die Energie steigt von Elektron zu Elektron immer, weil das Ion schon positiv ist. Gesucht ist der Anstieg, der deutlich größer ist als alle übrigen: Dort ist eine innere Schale mit Edelgaskonfiguration erreicht.',
      short: 'Gesucht ist der deutlich größte Anstieg.',
    },
  },
  {
    id: 'chem-pse-ie-count-after',
    course: C,
    name: 'Das Elektron nach dem Sprung mitgezählt',
    wrongFormula: r`\ce{Mg}\text{: III. Hauptgruppe}`,
    why: {
      detailed: 'Valenzelektronen sind die Elektronen vor dem großen Sprung. Das erste Elektron danach stammt schon aus einer inneren Schale.',
      short: 'Nur die Elektronen vor dem Sprung.',
    },
  },
  {
    id: 'chem-pse-ie-count-all',
    course: C,
    name: 'Alle angegebenen Energien gezählt',
    wrongFormula: r`\ce{Na}\text{: IV. Hauptgruppe}`,
    why: {
      detailed: 'Die Tabelle zeigt mehr Energien als Valenzelektronen. Die Hauptgruppe ergibt sich aus der Zahl der Elektronen vor dem großen Sprung.',
      short: 'Nur bis zum Sprung zählen.',
    },
  },
]
