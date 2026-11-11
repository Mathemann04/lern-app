import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Zwischenmolekulare Kräfte“: Name und falsche Aussage (klein, für Fehlerstatistik und
// Lernkarten). Die Erklärungen stehen in zmkWhy.ts. Nur als falsche Antworten; Regeln in docs/CHEMIE.md §8.

export const ZMK_MISCONCEPTIONS: readonly MisconceptionName[] = [
  {
    id: 'chem-mis-zk-intra',
    name: "Kräfte zwischen und in Molekülen verwechselt",
    wrongText: "Zwischenmolekulare Kräfte sind die Bindungen, die die Atome innerhalb eines Moleküls zusammenhalten.",
  },
  {
    id: 'chem-mis-zk-stronger',
    name: "Zwischenmolekulare Kräfte für stark gehalten",
    wrongText: "Zwischenmolekulare Kräfte sind stärker als Atom- oder Ionenbindungen.",
  },
  {
    id: 'chem-mis-zk-vdw-some',
    name: "Van-der-Waals-Kräfte nur bei manchen Teilchen",
    wrongText: "Van-der-Waals-Kräfte wirken nur zwischen bestimmten Teilchen, etwa nur zwischen polaren Molekülen.",
  },
  {
    id: 'chem-mis-zk-hbond-covalent',
    name: "Wasserstoffbrücke als Atombindung",
    wrongText: "Eine Wasserstoffbrücke ist eine echte Atombindung mit gemeinsamem Elektronenpaar.",
  },
  {
    id: 'chem-mis-zk-any-h',
    name: "Jedes H bildet Wasserstoffbrücken",
    wrongText: "Jedes H-Atom in einem Molekül kann Wasserstoffbrücken bilden.",
  },
  {
    id: 'chem-mis-zk-water-only',
    name: "Wasserstoffbrücken nur in Wasser",
    wrongText: "Wasserstoffbrücken gibt es nur zwischen Wassermolekülen.",
  },
  {
    id: 'chem-mis-zk-h-other',
    name: "Wasserstoffbrücken mit Cl oder S",
    wrongText: "Wasserstoffbrücken bilden sich auch, wenn H an Chlor oder Schwefel sitzt.",
  },
  {
    id: 'chem-mis-zk-dipole-nonpolar',
    name: "Dipol-Dipol-Kräfte bei unpolaren Molekülen",
    wrongText: "Dipol-Dipol-Kräfte wirken auch zwischen unpolaren Molekülen, wenn sie polare Bindungen haben.",
  },
  {
    id: 'chem-mis-zk-order',
    name: "Reihenfolge der Kräfte vertauscht",
    wrongText: "Van-der-Waals-Kräfte sind stärker als Wasserstoffbrücken.",
  },
  {
    id: 'chem-mis-zk-size',
    name: "Größe der Moleküle falsch eingeschätzt",
    wrongText: "Größere Moleküle haben schwächere Van-der-Waals-Kräfte als kleine.",
  },
  {
    id: 'chem-mis-zk-boil-weak',
    name: "Stärkere Kräfte, niedrigerer Siedepunkt",
    wrongText: "Je stärker die Kräfte zwischen den Molekülen sind, desto niedriger ist der Siedepunkt.",
  },
  {
    id: 'chem-mis-zk-boil-breaks',
    name: "Moleküle zerfallen beim Sieden",
    wrongText: "Beim Sieden zerfallen die Moleküle in ihre Atome.",
  },
  {
    id: 'chem-mis-zk-mass-only',
    name: "Siedepunkt nur aus der Molmasse",
    wrongText: "Der Siedepunkt hängt nur von der Molmasse ab, nicht von der Art der Kräfte.",
  },
  {
    id: 'chem-mis-zk-ice-sinks',
    name: "Eis dichter als Wasser",
    wrongText: "Eis ist dichter als flüssiges Wasser, weil die Teilchen im Feststoff enger liegen.",
  },
  {
    id: 'chem-mis-zk-density-zero',
    name: "Größte Dichte bei 0 °C",
    wrongText: "Wasser hat seine größte Dichte genau am Gefrierpunkt.",
  },
  {
    id: 'chem-mis-zk-water-normal',
    name: "Wasser wie andere kleine Moleküle",
    wrongText: "Wasser verhält sich wie andere kleine Moleküle; sein hoher Siedepunkt hat keinen besonderen Grund.",
  },
  {
    id: 'chem-mis-zk-opposites',
    name: "Gegensätze mischen sich",
    wrongText: "Polare und unpolare Stoffe mischen sich gut, weil sich Gegensätze anziehen.",
  },
  {
    id: 'chem-mis-zk-oil-light',
    name: "Entmischung nur wegen der Dichte",
    wrongText: "Öl und Wasser mischen sich nur deshalb nicht, weil Öl leichter ist.",
  },
]
