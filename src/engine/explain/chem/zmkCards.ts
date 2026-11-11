import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Zwischenmolekulare Kräfte“ (Chemie 1), in eigenen Worten. Siedepunkte und Kräfte der
// Beispiele prüft ein Test gegen die Stoffdaten (generators/zmk.test.ts).

export const ZMK_CARDS: readonly Card[] = [
  {
    id: 'zmk-kraefte',
    topic: 'chem-zmk',
    title: 'Die drei zwischenmolekularen Kräfte',
    level: 1,
    rules: [],
    formulas: [String.raw`\text{Van der Waals} < \text{Dipol-Dipol} < \text{Wasserstoffbrücken}`],
    memo: 'Zwischenmolekulare Kräfte (gleichbedeutend: intermolekulare Kräfte oder Wechselwirkungen) wirken zwischen Molekülen; es gibt drei Arten. Van-der-Waals-Kräfte wirken zwischen allen Teilchen: Für einen Augenblick ungleich verteilte Elektronen bilden einen temporären (momentanen) Dipol, der im Nachbarn einen induzierten Dipol hervorruft. Dipol-Dipol-Wechselwirkungen wirken zwischen polaren Molekülen mit dauerhaften Dipolen. Wasserstoffbrückenbindungen (kurz Wasserstoffbrücken) wirken, wenn H direkt an N, O oder F sitzt.',
    note: 'Grobe Größenordnung: Van der Waals bis etwa 5 kJ/mol, Dipol-Dipol etwa 5 bis 10 kJ/mol, Wasserstoffbrücken etwa 10 bis 50 kJ/mol. Alle drei sind viel schwächer als Atom- und Ionenbindungen. Van-der-Waals-Kräfte heißen auch London- oder Dispersionskräfte. Die Reihenfolge gilt für die Art der Kraft bei ähnlich großen Molekülen; bei großen Molekülen können die Van-der-Waals-Kräfte insgesamt mehr beitragen als ein Dipol.',
    when: 'Wenn es um Siedepunkte, Schmelzpunkte oder das Mischen von Stoffen geht.',
    examples: [
      {
        chemTask: String.raw`$\ce{Ar}$, $\ce{CH3Cl}$, $\ce{HF}$`,
        lines: [
          { label: 'Argon: einzelne Atome, nur Van-der-Waals-Kräfte' },
          { label: 'Chlormethan: polar, Dipol-Dipol-Wechselwirkungen' },
          { label: 'Fluorwasserstoff: H an F, Wasserstoffbrücken' },
        ],
      },
      {
        chemTask: String.raw`$\ce{CCl4}$`,
        lines: [{ label: 'Polare Bindungen, aber symmetrisch gebaut und damit unpolar: nur Van-der-Waals-Kräfte.' }],
      },
    ],
    errors: [
      'chem-zmk-polar-bond',
      'chem-zmk-polar-ignored',
      'chem-zmk-intra',
      'chem-mis-zk-intra',
      'chem-mis-zk-stronger',
      'chem-mis-zk-vdw-some',
      'chem-mis-zk-dipole-nonpolar',
      'chem-mis-zk-order',
      'chem-mis-zk-boil-breaks',
    ],
  },
  {
    id: 'zmk-wasserstoffbruecken',
    topic: 'chem-zmk',
    title: 'Wasserstoffbrückenbindungen',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{O-H}\cdots\ce{O}`],
    memo: 'Sitzt ein H-Atom direkt an N, O oder F, trägt es eine deutliche positive Teilladung. Es zieht das freie Elektronenpaar eines N-, O- oder F-Atoms im Nachbarmolekül an. Diese Anziehung heißt Wasserstoffbrückenbindung oder kurz Wasserstoffbrücke; sie ist die stärkste der drei Arten.',
    note: 'Eine Wasserstoffbrücke ist trotz des Namens keine Atombindung, sondern ein besonders starker Fall der Dipol-Dipol-Wechselwirkungen. H an Kohlenstoff, Chlor oder Schwefel bildet keine.',
    examples: [
      {
        chemTask: String.raw`$\ce{C2H5OH}$ (Ethanol)`,
        lines: [{ label: 'Das H der OH-Gruppe sitzt an O: Wasserstoffbrücken. Die H-Atome am Kohlenstoff bilden keine.' }],
      },
      {
        chemTask: String.raw`$\ce{HCl}$ (Chlorwasserstoff)`,
        lines: [{ label: 'H sitzt an Chlor, nicht an N, O oder F: keine Wasserstoffbrücken, aber Dipol-Dipol-Wechselwirkungen.' }],
      },
    ],
    errors: ['chem-zmk-any-h', 'chem-zmk-h-other', 'chem-zmk-hbond-missed', 'chem-mis-zk-hbond-covalent', 'chem-mis-zk-any-h', 'chem-mis-zk-water-only', 'chem-mis-zk-h-other'],
  },
  {
    id: 'zmk-wasser',
    topic: 'chem-zmk',
    title: 'Wasser ist besonders',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Jedes Wassermolekül kann über seine zwei H-Atome und zwei freien Paare bis zu vier Wasserstoffbrücken bilden. Deshalb siedet Wasser bei 100 °C, obwohl so kleine Moleküle sonst weit unter 0 °C sieden. Es hat eine hohe Oberflächenspannung.',
    note: 'Im Eis bilden die Wasserstoffbrücken ein weitmaschiges Gitter: Eis ist weniger dicht als flüssiges Wasser und schwimmt. Am dichtesten ist Wasser bei etwa 4 °C.',
    examples: [
      {
        chemTask: String.raw`$\ce{H2O}$ und $\ce{H2S}$`,
        lines: [{ label: 'Schwefelwasserstoff ist größer, siedet aber bei −60 °C; Wasser wegen der Wasserstoffbrücken bei 100 °C.' }],
      },
      {
        chemTask: 'Ein See im Winter',
        lines: [{ label: 'Eis schwimmt oben, am Grund bleibt Wasser von etwa 4 °C: Der See friert nicht ganz durch.' }],
      },
    ],
    errors: ['chem-mis-zk-ice-sinks', 'chem-mis-zk-density-zero', 'chem-mis-zk-water-normal'],
  },
  {
    id: 'zmk-siedepunkte',
    topic: 'chem-zmk',
    title: 'Siedepunkte vergleichen',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'Beim Sieden werden nur die Kräfte zwischen den Molekülen überwunden. Je stärker sie sind, desto höher der Siedepunkt. Zuerst die Art der stärksten Kraft vergleichen; ist sie gleich, entscheidet die Größe: Größere Moleküle haben stärkere Van-der-Waals-Kräfte.',
    note: String.raw`Wasserstoffbrücken können einen großen Unterschied der Molmasse übertreffen: Wasser siedet viel höher als Schwefelwasserstoff. Bei der Summenformel genau hinsehen: Formaldehyd, Acetaldehyd und Aceton haben eine polare $\ce{C=O}$-Gruppe, aber alle H am C; im Dimethylether sitzt das O zwischen zwei C-Atomen ohne H daran. Sie sind polar, bilden untereinander aber keine Wasserstoffbrücken. Zustand bei Raumtemperatur (etwa 20 °C): Siedet ein Stoff darunter, ist er ein Gas; schmilzt er erst darüber, ist er fest; sonst flüssig. Kühlt man ein Gas ab, werden die Teilchen langsamer, bis die Kräfte zwischen ihnen sie festhalten: Es kondensiert.`,
    examples: [
      {
        chemTask: String.raw`$\ce{F2}$, $\ce{Cl2}$, $\ce{Br2}$`,
        lines: [
          { label: 'Alle unpolar: Die Größe entscheidet', latex: String.raw`\ce{F2} < \ce{Cl2} < \ce{Br2}` },
          { label: 'Siedepunkte: −188 °C, −34 °C, 59 °C' },
        ],
      },
      {
        chemTask: String.raw`$\ce{C3H8}$, $\ce{CH3CHO}$ (polare $\ce{C=O}$-Gruppe, alle H am C), $\ce{C2H5OH}$ (ähnliche Molmasse)`,
        lines: [
          { label: 'Van der Waals < Dipol-Dipol < Wasserstoffbrücken', latex: String.raw`\ce{C3H8} < \ce{CH3CHO} < \ce{C2H5OH}` },
          { label: 'Siedepunkte: −42 °C, 20 °C, 78 °C' },
        ],
      },
    ],
    errors: ['chem-zmk-mass-only', 'chem-zmk-reversed', 'chem-zmk-size-ignored', 'chem-mis-zk-size', 'chem-mis-zk-boil-weak', 'chem-mis-zk-mass-only', 'chem-mis-zk-room-state'],
  },
  {
    id: 'zmk-loesen',
    topic: 'chem-zmk',
    title: 'Gleiches löst sich in Gleichem',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'Polare Stoffe mischen sich mit polaren, unpolare mit unpolaren. Die Kräfte zwischen gleichartigen Teilchen sind viel stärker als zwischen polaren und unpolaren; deshalb bleiben ungleiche Stoffe unter sich.',
    note: 'Öl und Wasser bilden zwei Schichten. Man nutzt das zum Trennen von Stoffen. Beim Ausschütteln (Extraktion) geht ein Stoff in das Lösemittel über, das ihn am stärksten anzieht. Bei der Chromatographie wandern Stoffe verschieden schnell, weil sie verschieden stark am Trägermaterial haften und vom Laufmittel mitgenommen werden.',
    examples: [
      {
        chemTask: String.raw`$\ce{C2H5OH}$ und Wasser`,
        lines: [{ label: 'Beide polar mit OH-Gruppen: Sie bilden Wasserstoffbrücken miteinander und mischen sich.' }],
      },
      {
        chemTask: String.raw`$\ce{I2}$ in Hexan`,
        lines: [{ label: 'Iod ist unpolar und löst sich gut in unpolarem Hexan, kaum in Wasser.' }],
      },
    ],
    errors: ['chem-zmk-like-reversed', 'chem-mis-zk-opposites', 'chem-mis-zk-oil-light'],
  },
]
