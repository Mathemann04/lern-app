// Platzhalter (S1, Gerüst): wird durch die echten Lernkarten zum Atombau ersetzt. Format: Card in
// explain/cards.ts mit Beispielen als ChemCardExample (Aufgabe als Text, Zeilen mit Beschriftung und
// optional einer Formel).
import type { Card } from '../cards.ts'

export const ATOMBAU_CARDS: readonly Card[] = [
  {
    id: 'atombau-teilchen',
    topic: 'chem-atombau',
    title: 'Elementarteilchen',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Im Kern sitzen die positiv geladenen Protonen und die ungeladenen Neutronen, in der Hülle die negativ geladenen Elektronen.',
    note: 'Proton und Neutron sind fast gleich schwer, ein Elektron wiegt fast 2000-mal weniger. Deshalb steckt fast die ganze Masse im winzigen Kern.',
    examples: [
      {
        chemTask: 'Welche Ladung tragen Proton, Neutron und Elektron?',
        lines: [
          { label: 'Proton: eine positive Elementarladung', latex: '+1' },
          { label: 'Neutron: ungeladen', latex: '0' },
          { label: 'Elektron: eine negative Elementarladung', latex: '-1' },
        ],
      },
      {
        chemTask: 'Wo steckt die Masse eines Atoms?',
        lines: [{ label: 'Fast die ganze Masse liegt im Kern.' }, { label: 'Die Elektronen der Hülle wiegen kaum etwas.' }],
      },
    ],
    errors: ['chem-mis-particle-charges', 'chem-mis-particle-location', 'chem-mis-nucleus-size-mass'],
  },
  {
    id: 'atombau-kernsymbol',
    topic: 'chem-atombau',
    title: 'Kernsymbol und Isotope',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{^{A}_{Z}X}`],
    memo: 'Oben links steht die Massenzahl $A$ (Protonen und Neutronen), unten links die Ordnungszahl $Z$ (Protonen). Isotope eines Elements haben dasselbe $Z$, aber verschiedene $A$.',
    examples: [
      {
        chemTask: String.raw`Lies das Kernsymbol $\ce{^{14}_{6}C}$.`,
        lines: [
          { label: 'Massenzahl:', latex: 'A = 14' },
          { label: 'Ordnungszahl:', latex: 'Z = 6' },
          { label: 'Neutronen:', latex: 'A - Z = 8' },
        ],
      },
      {
        chemTask: String.raw`Sind $\ce{^{12}_{6}C}$ und $\ce{^{13}_{6}C}$ Isotope?`,
        lines: [{ label: 'Gleiche Ordnungszahl:', latex: 'Z = 6' }, { label: 'Verschiedene Massenzahlen, also Isotope desselben Elements.' }],
      },
    ],
    errors: ['chem-mis-mass-number', 'chem-mis-isotope-protons'],
  },
  {
    id: 'atombau-ionen',
    topic: 'chem-atombau',
    title: 'Ionen',
    level: 2,
    rules: [],
    formulas: [String.raw`\ce{Na -> Na+ + e-}`],
    memo: 'Ein Ion entsteht, wenn ein Atom Elektronen abgibt oder aufnimmt. Der Kern bleibt dabei unverändert.',
    examples: [
      {
        chemTask: 'Natrium gibt ein Elektron ab.',
        lines: [{ label: 'Gleichung:', latex: String.raw`\ce{Na -> Na+ + e-}` }, { label: 'Ein Elektron weniger als Protonen: einfach positiv.' }],
      },
      {
        chemTask: 'Chlor nimmt ein Elektron auf.',
        lines: [{ label: 'Gleichung:', latex: String.raw`\ce{Cl + e- -> Cl-}` }, { label: 'Ein Elektron mehr als Protonen: einfach negativ.' }],
      },
    ],
    errors: ['chem-mis-ion-nucleus'],
  },
]
