import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Aufbau des Periodensystems“: Name und falsche Aussage (klein, für Fehlerstatistik
// und Lernkarten). Die Erklärungen stehen in pseWhy.ts. Regeln in docs/CHEMIE.md §8.

export const PSE_MISCONCEPTIONS: readonly MisconceptionName[] = [
  { id: 'chem-mis-pse-mass-order', name: 'Ordnung nach der Masse', wrongText: 'Die Elemente im Periodensystem sind nach ihrer Atommasse geordnet.' },
  { id: 'chem-mis-pse-z-meaning', name: 'Ordnungszahl falsch verstanden', wrongText: 'Die Ordnungszahl zählt alle Teilchen im Kern.' },
  { id: 'chem-mis-pse-row-column', name: 'Periode und Gruppe verwechselt', wrongText: 'Die Periode gibt an, wie viele Valenzelektronen ein Element hat.' },
  { id: 'chem-mis-pse-period-similar', name: 'Ähnlichkeit in der Periode', wrongText: 'Elemente derselben Periode haben besonders ähnliche Eigenschaften.' },
  { id: 'chem-mis-pse-group-number', name: 'Gruppennummer 13 bis 18 als Valenzelektronen', wrongText: 'Aluminium in Gruppe 13 hat 13 Valenzelektronen.' },
  { id: 'chem-mis-pse-block', name: 'Blöcke falsch zugeordnet', wrongText: 'Der Block eines Elements richtet sich nach der äußersten s-Unterschale oder nach der Periode.' },
  { id: 'chem-mis-pse-fe-main', name: 'Eisen als Hauptgruppenelement', wrongText: 'Eisen gehört zur VIII. Hauptgruppe.' },
  { id: 'chem-mis-pse-boron-metal', name: 'Bor als Metall', wrongText: 'Bor ist ein Metall, weil es in derselben Hauptgruppe wie Aluminium steht.' },
  { id: 'chem-mis-pse-hydrogen-metal', name: 'Wasserstoff als Alkalimetall', wrongText: 'Wasserstoff ist ein Metall, weil er in der I. Hauptgruppe steht.' },
  { id: 'chem-mis-pse-metal-right', name: 'Metalle und Nichtmetalle vertauscht', wrongText: 'Metalle stehen rechts im Periodensystem, Nichtmetalle links.' },
  { id: 'chem-mis-pse-noble-reactive', name: 'Edelgase für reaktiv gehalten', wrongText: 'Edelgase reagieren leicht, weil sie ihre Außenelektronen gern abgeben.' },
  { id: 'chem-mis-pse-octet-all', name: 'Oktett für jedes Edelgas', wrongText: 'Jedes Edelgas, auch Helium, hat acht Außenelektronen.' },
  { id: 'chem-mis-pse-charge-sign', name: 'Vorzeichen der Ionenladung vertauscht', wrongText: 'Wer Elektronen abgibt, wird negativ geladen.' },
  { id: 'chem-mis-pse-noble-own', name: 'Edelgas der eigenen Periode beim Kation', wrongText: 'Natrium erreicht als Ion die Konfiguration von Argon, dem Edelgas seiner Periode.' },
  { id: 'chem-mis-pse-ie-decrease', name: 'Ionisierungsenergie sinkt', wrongText: 'Jedes weitere Elektron lässt sich leichter entfernen als das vorige.' },
  { id: 'chem-mis-pse-li-reactive', name: 'Lithium heftiger als Natrium', wrongText: 'Lithium reagiert heftiger mit Wasser als Natrium.' },
  { id: 'chem-mis-pse-charge-count', name: 'Ladung falsch gezählt', wrongText: 'Die Ladung eines Ions ist die Zahl seiner Valenzelektronen oder die Zahl der Elektronen bis zum Oktett, egal ob es Elektronen abgibt oder aufnimmt.' },
  { id: 'chem-mis-pse-ie-count', name: 'Valenzelektronen aus Ionisierungsenergien falsch gezählt', wrongText: 'Die Hauptgruppe ist die Zahl aller angegebenen Ionisierungsenergien oder die Zahl der Elektronen bis einschließlich des Sprungs.' },
  { id: 'chem-mis-pse-helium-all', name: 'Alle Edelgase wie Helium', wrongText: 'Alle Edelgase haben wie Helium zwei Außenelektronen.' },
  { id: 'chem-mis-pse-metal-direction', name: 'Metallcharakter in der Hauptgruppe falsch eingeschätzt', wrongText: 'In einer Hauptgruppe nimmt der Metallcharakter von oben nach unten ab oder bleibt gleich.' },
  { id: 'chem-mis-pse-semimetal', name: 'Halbmetall wie Metall oder Nichtmetall', wrongText: 'Ein Halbmetall verhält sich ganz wie ein Metall oder ganz wie ein Nichtmetall.' },
  { id: 'chem-mis-pse-group-names', name: 'Namen der Hauptgruppen verwechselt', wrongText: 'Die Erdalkalimetalle stehen in der I. Hauptgruppe und die Alkalimetalle in der II.' },
  { id: 'chem-mis-pse-ie-definition', name: 'Ionisierungsenergie falsch verstanden', wrongText: 'Die Ionisierungsenergie wird frei, wenn ein Atom ein Elektron abgibt.' },
]
