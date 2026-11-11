import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Elektronen“: Name und falsche Aussage (klein, für Fehlerstatistik und Lernkarten).
// Die Erklärungen stehen in elektronenWhy.ts. Regeln in docs/CHEMIE.md §8.

const r = String.raw

export const ELEKTRONEN_MISCONCEPTIONS: readonly MisconceptionName[] = [
  { id: 'chem-mis-el-qn-meaning', name: 'Bedeutung der Quantenzahlen verwechselt', wrongText: 'Die Hauptquantenzahl legt die Form eines Orbitals fest, die Nebenquantenzahl seine Ausrichtung im Raum.' },
  { id: 'chem-mis-el-l-to-n', name: 'Nebenquantenzahl bis n', wrongText: 'Die Nebenquantenzahl kann so groß werden wie die Hauptquantenzahl; in der 2. Schale gibt es also auch 2d.' },
  { id: 'chem-mis-el-m-range', name: 'Magnetquantenzahl falsch begrenzt', wrongText: 'Die Magnetquantenzahl hat nur Werte von 0 bis l, oder sie kann größer als l werden.' },
  { id: 'chem-mis-el-spin-values', name: 'Falsche Werte des Spins', wrongText: 'Die Spinquantenzahl kann die Werte 0 und 1 annehmen.' },
  { id: 'chem-mis-el-orbital-count', name: 'Orbitale und Plätze verwechselt', wrongText: 'Eine p-Unterschale hat sechs Orbitale.' },
  { id: 'chem-mis-el-orbital-path', name: 'Orbital als Bahn', wrongText: 'Ein Orbital ist eine feste Bahn, auf der das Elektron den Kern umkreist.' },
  { id: 'chem-mis-el-shape', name: 'Formen der Orbitale vertauscht', wrongText: 's-Orbitale sind hantelförmig, p-Orbitale kugelförmig.' },
  { id: 'chem-mis-el-orbital-energy', name: 'Orbitale einer Unterschale verschieden energiereich', wrongText: 'Die drei p-Orbitale einer Unterschale haben verschiedene Energien.' },
  { id: 'chem-mis-el-shell-8', name: 'Acht Elektronen je Schale', wrongText: 'Jede Schale fasst höchstens acht Elektronen.' },
  { id: 'chem-mis-el-shell-2n', name: 'Zu wenige Plätze je Schale', wrongText: 'Eine Schale fasst höchstens 2n Elektronen, oder so viele, wie sie Orbitale hat.' },
  { id: 'chem-mis-el-pauli-same', name: 'Pauli-Prinzip missverstanden', wrongText: 'Zwei Elektronen eines Orbitals dürfen in allen vier Quantenzahlen übereinstimmen.' },
  { id: 'chem-mis-el-pauli-hund', name: 'Pauli und Hund verwechselt', wrongText: 'Das Pauli-Prinzip besagt, dass gleichwertige Orbitale zuerst einzeln besetzt werden.' },
  { id: 'chem-mis-el-hund-pair', name: 'Erst Paare bilden', wrongText: 'In einer Unterschale bilden die Elektronen zuerst Paare, bevor sie das nächste Orbital besetzen.' },
  { id: 'chem-mis-el-order-n', name: 'Reihenfolge nur nach der Schale', wrongText: 'Die Unterschalen werden streng nach der Nummer der Schale besetzt: erst 3s, 3p und 3d, dann 4s.' },
  { id: 'chem-mis-el-d-count', name: 'd-Elektronen falsch gezählt', wrongText: 'Bei Eisen sind alle Elektronen nach dem Argon-Kern d-Elektronen.' },
  { id: 'chem-mis-el-exception', name: 'Ausnahmen übersehen', wrongText: r`Chrom und Kupfer werden genau nach der Reihenfolge besetzt: $[\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{4}$ und $[\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{9}$.` },
  { id: 'chem-mis-el-cr-shells', name: 'Schalen von Chrom falsch', wrongText: 'Chrom hat die Schalenbesetzung 2, 8, 12, 2.' },
  { id: 'chem-mis-el-half-full', name: 'Halb volle Unterschale unterschätzt', wrongText: 'Halb volle oder ganz volle d-Unterschalen sind nicht günstiger als andere Besetzungen.' },
  { id: 'chem-mis-el-ion-3d', name: 'Bei Kationen zuerst 3d geleert', wrongText: 'Übergangsmetalle geben bei der Bildung von Kationen zuerst ihre 3d-Elektronen ab.' },
  { id: 'chem-mis-el-noble-ion', name: 'Falsches Edelgas beim Ion', wrongText: r`Ein Kation wie $\ce{Mg^2+}$ hat die Konfiguration des Edelgases am Ende seiner eigenen Periode.` },
  { id: 'chem-mis-el-fe-main', name: 'Eisen als Hauptgruppenelement', wrongText: 'Eisen gehört zur VIII. Hauptgruppe.' },
  { id: 'chem-mis-el-f-six', name: 'Fluor mit sechs Außenelektronen', wrongText: 'Fluor hat sechs Außenelektronen.' },
  { id: 'chem-mis-el-valence-all', name: 'Alle Elektronen als Valenzelektronen', wrongText: 'Valenzelektronen sind alle Elektronen eines Atoms.' },
  { id: 'chem-mis-el-wrong-shell', name: 'Valenzelektronen in der falschen Schale', wrongText: 'In der 3. Periode sitzen die Valenzelektronen in 4s und 4p.' },
  { id: 'chem-mis-el-unpaired-valence', name: 'Alle Valenzelektronen ungepaart', wrongText: 'Alle Valenzelektronen eines Atoms sind ungepaart.' },
  { id: 'chem-mis-el-spin-pair-magnet', name: 'Gepaarte Spins als stärkerer Magnet', wrongText: 'Zwei Elektronen mit entgegengesetztem Spin in einem Orbital verstärken ihre magnetische Wirkung.' },
  { id: 'chem-mis-el-magnet-nucleus', name: 'Magnetismus aus dem Kern', wrongText: 'Der Magnetismus eines Stoffs wie Eisen entsteht im Atomkern, nicht bei den Elektronen.' },
]
