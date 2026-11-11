import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Ionenbindung und Salze“ (Chemie 1), in eigenen Worten. Formeln und Zahlen der
// Beispiele prüft ein Test gegen die Engine (generators/salze.test.ts).

export const IONEN_CARDS: readonly Card[] = [
  {
    id: 'ionen-bindung',
    topic: 'chem-ionen',
    title: 'Ionenbindung',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{Na -> Na+ + e-}`, String.raw`\ce{Cl + e- -> Cl-}`],
    memo: 'Ein Metall gibt Elektronen ab und wird zum Kation, ein Nichtmetall nimmt sie auf und wird zum Anion. Beide erreichen so die Edelgaskonfiguration. Die entgegengesetzt geladenen Ionen ziehen sich an; diesen Zusammenhalt nennt man Ionenbindung.',
    note: 'Die Anziehung wirkt in alle Richtungen gleich. Deshalb bilden Ionen kein einzelnes Molekül, sondern ein Gitter aus sehr vielen Ionen. Salze sind Stoffe aus Ionen.',
    when: 'Wenn ein Metall mit einem Nichtmetall reagiert.',
    examples: [
      {
        chemTask: 'Magnesium reagiert mit Sauerstoff.',
        lines: [
          { label: 'Magnesium gibt zwei Elektronen ab', latex: String.raw`\ce{Mg -> Mg^2+ + 2 e-}` },
          { label: 'Sauerstoff nimmt zwei auf', latex: String.raw`\ce{O + 2 e- -> O^2-}` },
          { label: 'Salz', latex: String.raw`\ce{MgO}` },
        ],
      },
      {
        chemTask: 'Natrium reagiert mit Chlor.',
        lines: [
          { label: 'Natrium gibt ein Elektron ab', latex: String.raw`\ce{Na -> Na+ + e-}` },
          { label: 'Chlor nimmt eines auf', latex: String.raw`\ce{Cl + e- -> Cl-}` },
          { label: 'Salz', latex: String.raw`\ce{NaCl}` },
        ],
      },
    ],
    errors: ['chem-salt-anion-positive', 'chem-salt-anion-valence', 'chem-mis-io-metal-anion', 'chem-mis-io-electron-sign', 'chem-mis-io-proton-charge', 'chem-mis-io-bond-mixup', 'chem-mis-io-molecule', 'chem-mis-io-ions-form-late'],
  },
  {
    id: 'ionen-formel',
    topic: 'chem-ionen',
    title: 'Formel eines Salzes',
    level: 1,
    rules: [],
    formulas: [String.raw`x \cdot (\text{Ladung des Kations}) = y \cdot |\text{Ladung des Anions}|`],
    memo: 'Ein Salz ist nach außen neutral. Man nimmt von jedem Ion so viele, dass sich die Ladungen genau aufheben, und zwar mit den kleinsten ganzen Zahlen. Diese Anzahlen stehen als Index hinter dem Ion.',
    note: 'Ladung der Hauptgruppen-Ionen: Gruppe I +1, II +2, III +3; Gruppe V −3, VI −2, VII −1. Probe: Index mal Ladung ist für beide Ionen gleich groß.',
    when: 'Wenn aus dem Namen eines Salzes seine Formel werden soll.',
    examples: [
      {
        chemTask: 'Aluminiumoxid',
        lines: [
          { label: 'Ionen', latex: String.raw`\ce{Al^3+},\ \ce{O^2-}` },
          { label: 'Ausgleich', latex: String.raw`2 \cdot 3 = 3 \cdot 2 = 6` },
          { label: 'Formel', latex: String.raw`\ce{Al2O3}` },
        ],
      },
      {
        chemTask: 'Magnesiumsulfid',
        lines: [
          { label: 'Ionen', latex: String.raw`\ce{Mg^2+},\ \ce{S^2-}` },
          { label: 'Formel (gekürzt)', latex: String.raw`\ce{MgS}` },
        ],
      },
    ],
    errors: ['chem-salt-not-reduced', 'chem-salt-indices-swapped', 'chem-salt-one-to-one', 'chem-salt-numeral-count', 'chem-mis-io-anion-positive', 'chem-mis-io-charge-valence', 'chem-mis-io-charge-always-one', 'chem-mis-io-fixed-ratio', 'chem-mis-io-index-is-charge', 'chem-mis-io-element-formula', 'chem-mis-io-index-swap', 'chem-mis-io-not-neutral'],
  },
  {
    id: 'ionen-namen',
    topic: 'chem-ionen',
    title: 'Namen von Salzen',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Zuerst kommt das Kation mit dem Namen des Metalls, dann das Anion. Einatomige Anionen enden auf -id: Chlorid, Oxid, Sulfid, Nitrid. Bildet ein Metall Ionen mit verschiedenen Ladungen, steht die Ladung als römische Ziffer in Klammern dahinter.',
    note: 'Eisen, Kupfer, Chrom und Mangan brauchen die Ziffer, Natrium, Magnesium oder Aluminium nicht. Mit Ziffer steht ein Bindestrich vor dem Anion: Eisen(III)-chlorid. Die Ziffer ist die Ladung, nicht die Anzahl in der Formel.',
    when: 'Wenn ein Salz benannt oder seine Formel aus dem Namen gelesen werden soll.',
    examples: [
      {
        chemTask: String.raw`$\ce{Fe2O3}$`,
        lines: [
          { label: 'Ladung der Anionen', latex: String.raw`3 \cdot (-2) = -6` },
          { label: 'auf zwei Eisen-Ionen verteilt', latex: String.raw`\ce{Fe^3+}` },
          { label: 'Name', latex: String.raw`\text{Eisen(III)-oxid}` },
        ],
      },
      {
        chemTask: String.raw`$\ce{CuCl}$ und $\ce{CuCl2}$`,
        lines: [
          { label: 'Kupfer mit Ladung +1', latex: String.raw`\text{Kupfer(I)-chlorid}` },
          { label: 'Kupfer mit Ladung +2', latex: String.raw`\text{Kupfer(II)-chlorid}` },
        ],
      },
    ],
    errors: ['chem-salt-charge-from-index', 'chem-salt-numeral-index', 'chem-salt-numeral-missing', 'chem-salt-anion-name', 'chem-mis-io-greek-prefix', 'chem-mis-io-numeral-always', 'chem-mis-io-name-order', 'chem-mis-io-ending-mixup', 'chem-mis-io-numeral-count', 'chem-mis-io-numeral-group', 'chem-mis-io-numeral-from-index'],
  },
  {
    id: 'ionen-molekuelionen',
    topic: 'chem-ionen',
    title: 'Molekül-Ionen',
    level: 2,
    rules: [],
    formulas: [
      String.raw`\ce{OH-}\ \text{Hydroxid},\ \ce{NO3-}\ \text{Nitrat},\ \ce{NO2-}\ \text{Nitrit}`,
      String.raw`\ce{SO4^2-}\ \text{Sulfat},\ \ce{SO3^2-}\ \text{Sulfit},\ \ce{CO3^2-}\ \text{Carbonat}`,
      String.raw`\ce{HCO3-}\ \text{Hydrogencarbonat},\ \ce{PO4^3-}\ \text{Phosphat},\ \ce{NH4+}\ \text{Ammonium}`,
    ],
    memo: 'Manche Ionen bestehen aus mehreren Atomen, die fest zusammenhalten; die Ladung gehört zur ganzen Gruppe. Ihre Ladungen muss man kennen. Kommt ein Molekül-Ion in einer Formel mehrmals vor, steht es in Klammern, der Index dahinter.',
    note: 'Endungen: -at hat mehr Sauerstoff als -it (Sulfat und Sulfit). Ammonium ist das einzige häufige Molekül-Ion mit positiver Ladung.',
    when: 'Wenn ein Salz ein Molekül-Ion enthält.',
    examples: [
      {
        chemTask: 'Calciumphosphat',
        lines: [
          { label: 'Ionen', latex: String.raw`\ce{Ca^2+},\ \ce{PO4^3-}` },
          { label: 'Ausgleich', latex: String.raw`3 \cdot 2 = 2 \cdot 3 = 6` },
          { label: 'Formel', latex: String.raw`\ce{Ca3(PO4)2}` },
        ],
      },
      {
        chemTask: 'Ammoniumsulfat',
        lines: [{ label: 'Formel', latex: String.raw`\ce{(NH4)2SO4}` }],
      },
    ],
    errors: ['chem-salt-polyatomic-charge', 'chem-salt-bracket', 'chem-mis-io-poly-charge', 'chem-mis-io-bracket', 'chem-mis-io-poly-split'],
  },
  {
    id: 'ionen-gitter',
    topic: 'chem-ionen',
    title: 'Ionengitter',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'In einem Salzkristall sind Kationen und Anionen regelmäßig in allen drei Raumrichtungen angeordnet. Das kleinste Stück, aus dem sich das ganze Gitter aufbauen lässt, ist die Elementarzelle. Die Koordinationszahl sagt, wie viele nächste Nachbarn mit entgegengesetzter Ladung ein Ion hat.',
    note: 'Natriumchlorid: Koordinationszahl 6, die Nachbarn bilden ein Oktaeder. Caesiumchlorid: 8, ein Würfel. Zinkblende (ZnS): 4, ein Tetraeder. Größere Kationen haben Platz für mehr Nachbarn.',
    figures: ['gitter-nacl', 'gitter-cscl', 'gitter-zns'],
    examples: [
      {
        chemTask: String.raw`$\ce{NaCl}$-Gitter`,
        lines: [{ label: 'Jedes Natrium-Ion hat sechs Chlorid-Ionen als nächste Nachbarn; jedes Chlorid-Ion sechs Natrium-Ionen.' }],
      },
      {
        chemTask: String.raw`$\ce{CsCl}$-Gitter`,
        lines: [{ label: 'Das große Caesium-Ion sitzt in der Mitte eines Würfels aus acht Chlorid-Ionen: Koordinationszahl 8.' }],
      },
    ],
    errors: ['chem-mis-io-cell-is-unit', 'chem-mis-io-cell-is-polyhedron', 'chem-mis-io-cn-count-all', 'chem-mis-io-cn-same-charge', 'chem-mis-io-cn-from-formula', 'chem-mis-io-all-like-nacl', 'chem-mis-io-polyhedron-mixup', 'chem-mis-io-cn-size', 'chem-mis-io-cell-count-all', 'chem-mis-io-cn-vs-units', 'chem-mis-io-ion-is-unit'],
  },
  {
    id: 'ionen-eigenschaften',
    topic: 'chem-ionen',
    title: 'Eigenschaften der Salze',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Salze sind hart und spröde, haben hohe Schmelzpunkte und bilden Kristalle. Als Feststoff leiten sie den Strom nicht, geschmolzen oder in Wasser gelöst schon, weil die Ionen dann beweglich sind.',
    note: 'Spröde: Verschiebt man eine Schicht des Gitters, liegen gleich geladene Ionen nebeneinander und stoßen sich ab, der Kristall bricht. Der Schmelzpunkt ist umso höher, je größer die Ladungen und je kleiner die Ionen sind.',
    examples: [
      {
        chemTask: String.raw`$\ce{MgO}$ und $\ce{NaCl}$`,
        lines: [{ label: 'Magnesiumoxid schmilzt viel höher: Ladungen 2+ und 2− statt 1+ und 1−, dazu kleinere Ionen.' }],
      },
      {
        chemTask: 'Kochsalz als Kristall, als Schmelze und in Wasser',
        lines: [{ label: 'Als Kristall leitet es nicht; geschmolzen und gelöst leitet es, weil die Ionen dann wandern können.' }],
      },
    ],
    errors: ['chem-mis-io-solid-conducts', 'chem-mis-io-electrons-conduct', 'chem-mis-io-state-decides', 'chem-mis-io-ductile', 'chem-mis-io-weak-forces', 'chem-mis-io-mass-decides', 'chem-mis-io-distance', 'chem-mis-io-charge-irrelevant', 'chem-mis-io-amorphous', 'chem-mis-io-crystal-look'],
  },
  {
    id: 'ionen-zerfall',
    topic: 'chem-ionen',
    title: 'Zerfall in Ionen',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{CaCl2(s) -> Ca^2+(aq) + 2 Cl^-(aq)}`],
    memo: 'Beim Lösen in Wasser oder beim Schmelzen wird das Gitter aufgelöst; die Ionen werden einzeln beweglich. In der Gleichung steht jedes Ion mit seiner Ladung, der Index aus der Formel wird zum Koeffizienten davor.',
    note: 'Zustände: (s) fest, (aq) in Wasser gelöst. Probe: Die Ladungen rechts heben sich auf. Molekül-Ionen bleiben ganz.',
    examples: [
      {
        chemTask: String.raw`$\ce{Al2(SO4)3}$ in Wasser`,
        lines: [{ label: 'Gleichung', latex: String.raw`\ce{Al2(SO4)3(s) -> 2 Al^3+(aq) + 3 SO4^2-(aq)}` }],
      },
      {
        chemTask: String.raw`$\ce{Al2O3}$ als Schmelze`,
        lines: [{ label: 'Gleichung', latex: String.raw`\ce{Al2O3 -> 2 Al^3+ + 3 O^2-}` }],
      },
    ],
    errors: ['chem-dissociation-coefficients', 'chem-dissociation-index-ion', 'chem-dissociation-charge', 'chem-dissociation-atoms', 'chem-mis-io-dissolve-atoms', 'chem-mis-io-dissolve-reacts', 'chem-mis-io-no-coefficients', 'chem-mis-io-index-in-ion', 'chem-mis-io-melt-lattice-stays', 'chem-mis-io-dissolve-is-melting'],
  },
  {
    id: 'ionen-loesen',
    topic: 'chem-ionen',
    title: 'Salze lösen: warm oder kalt',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'Beim Lösen muss das Gitter aufgebrochen werden; das kostet die Gitterenergie. Dafür lagern sich Wassermoleküle an die Ionen an (Hydratation), dabei wird Energie frei. Überwiegt die Hydratation, wird die Lösung warm, sonst kalt.',
    note: 'Ammoniumchlorid kühlt beim Lösen (Kältepackung), Natriumhydroxid erwärmt das Wasser stark.',
    examples: [
      {
        chemTask: 'Ammoniumchlorid in Wasser',
        lines: [{ label: 'Gitterenergie größer als Hydratationsenergie: Die Lösung kühlt ab.' }],
      },
      {
        chemTask: 'Natriumhydroxid in Wasser',
        lines: [{ label: 'Hydratationsenergie größer als Gitterenergie: Die Lösung wird warm.' }],
      },
    ],
    errors: ['chem-mis-io-water-orientation', 'chem-mis-io-water-nonpolar', 'chem-mis-io-dissolve-always-same', 'chem-mis-io-balance-reversed', 'chem-mis-io-dissolve-no-energy', 'chem-mis-io-exo-endo-mixup'],
  },
  {
    id: 'ionen-born-haber',
    topic: 'chem-ionen',
    title: 'Born-Haber-Kreisprozess',
    level: 3,
    rules: [],
    formulas: [String.raw`\Delta H_f = \Delta H_{\text{Sub}} + I + \tfrac{1}{2} D + E_A + \Delta H_G`],
    memo: 'Die Gitterenthalpie lässt sich nicht direkt messen. Man rechnet sie über einen Umweg aus: Von den Elementen zum Salz kommt man direkt (Bildungsenthalpie) oder über Schritte zu den Ionen im Gas und dann ins Gitter. Beide Wege liefern dieselbe Energie.',
    note: String.raw`Schritte für $\ce{MX}$: Metall verdampfen, ionisieren; ein halbes $\ce{X2}$-Molekül spalten; Elektron an $\ce{X}$ anlagern (Elektronenaffinität, bei Halogenen negativ); Ionen ins Gitter (Gitterenthalpie, negativ).`,
    examples: [
      {
        chemTask: String.raw`$\ce{NaCl}$, Werte in kJ/mol: Sublimation 107, Ionisierung 496, Bindungsenergie $\ce{Cl2}$ 242, Elektronenaffinität −349, $\Delta H_f = -411$`,
        lines: [
          { label: 'Weg zu den Ionen', latex: String.raw`107 + 496 + \tfrac{1}{2} \cdot 242 + (-349) = 375\,\mathrm{kJ/mol}` },
          { label: 'Gitterenthalpie', latex: String.raw`\Delta H_G = -411 - 375 = -786\,\mathrm{kJ/mol}` },
        ],
      },
      {
        chemTask: String.raw`$\ce{KF}$, Werte in kJ/mol: Sublimation 89, Ionisierung 419, Bindungsenergie $\ce{F2}$ 158, Elektronenaffinität −328, $\Delta H_f = -567$`,
        lines: [
          { label: 'Weg zu den Ionen', latex: String.raw`89 + 419 + \tfrac{1}{2} \cdot 158 + (-328) = 259\,\mathrm{kJ/mol}` },
          { label: 'Gitterenthalpie', latex: String.raw`\Delta H_G = -567 - 259 = -826\,\mathrm{kJ/mol}` },
        ],
      },
    ],
    errors: ['chem-bh-ea-sign', 'chem-bh-full-bond', 'chem-bh-step-missing', 'chem-bh-subtracted-wrong', 'chem-bh-added', 'chem-bh-lattice-sign', 'chem-mis-io-lattice-is-force', 'chem-mis-io-lattice-sign', 'chem-mis-io-lattice-mixup', 'chem-mis-io-bh-real-path', 'chem-mis-io-bh-path-dependent', 'chem-mis-io-ionization-releases', 'chem-mis-io-ea-compensates', 'chem-mis-io-bh-full-bond', 'chem-mis-io-bh-step-missing', 'chem-mis-io-neutral-no-force'],
  },
  {
    id: 'ionen-grenze',
    topic: 'chem-ionen',
    title: 'Ionisch oder nicht? Die Grenze ist fließend',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'Als Faustregel gilt eine Bindung mit großem Unterschied der Elektronegativität als ionisch, meist zwischen Metall und Nichtmetall. Die Grenze ist aber fließend: Es gibt Übergänge zwischen Ionen- und Atombindung.',
    note: 'Aufgaben der App nennen ein Salz deshalb ausdrücklich ionisch, wie die Klausur, und entscheiden nicht nach der Elektronegativität.',
    examples: [
      {
        chemTask: String.raw`$\ce{NaCl}$`,
        lines: [{ label: 'Metall und Nichtmetall mit großem Unterschied der Elektronegativität: klar ionisch.' }],
      },
      {
        chemTask: String.raw`$\ce{MgCl2}$`,
        lines: [{ label: 'Der Unterschied liegt knapp an der üblichen Grenze, trotzdem verhält sich der Stoff wie ein typisches Salz.' }],
      },
    ],
    errors: [],
  },
]
