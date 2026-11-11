import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Chemisches Gleichgewicht“: Name und falsche Aussage (klein, für Fehlerstatistik und
// Lernkarten). Die Erklärungen stehen in mwgWhy.ts. Regeln in docs/CHEMIE.md §8.

export const MWG_MISCONCEPTIONS: readonly MisconceptionName[] = [
  { id: 'chem-mis-gg-stopped', name: 'Im Gleichgewicht steht alles still', wrongText: 'Im Gleichgewicht laufen keine Reaktionen mehr ab.' },
  { id: 'chem-mis-gg-equal-conc', name: 'Gleiche Konzentrationen im Gleichgewicht', wrongText: 'Im Gleichgewicht liegen Edukte und Produkte in gleicher Konzentration vor.' },
  { id: 'chem-mis-gg-complete', name: 'Gleichgewichtsreaktion läuft vollständig ab', wrongText: 'Eine Gleichgewichtsreaktion setzt die Edukte vollständig zu Produkten um.' },
  { id: 'chem-mis-gg-forward-faster', name: 'Hinreaktion im Gleichgewicht schneller', wrongText: 'Im Gleichgewicht läuft die Hinreaktion schneller als die Rückreaktion.' },
  { id: 'chem-mis-gg-mwg-educts-top', name: 'Edukte im Zähler', wrongText: 'Im Massenwirkungsgesetz stehen die Edukte im Zähler.' },
  { id: 'chem-mis-gg-mwg-coef', name: 'Koeffizient nicht als Exponent', wrongText: 'Die Koeffizienten der Gleichung kommen im Massenwirkungsgesetz als Faktor oder gar nicht vor.' },
  { id: 'chem-mis-gg-mwg-sum', name: 'Konzentrationen addiert', wrongText: 'Im Massenwirkungsgesetz werden die Konzentrationen einer Seite addiert.' },
  { id: 'chem-mis-gg-k-large', name: 'Großes K heißt viel Edukt', wrongText: 'Ist die Gleichgewichtskonstante sehr groß, liegen im Gleichgewicht vor allem Edukte vor.' },
  { id: 'chem-mis-gg-k-speed', name: 'Großes K heißt schnelle Reaktion', wrongText: 'Je größer die Gleichgewichtskonstante, desto schneller läuft die Reaktion ab.' },
  { id: 'chem-mis-gg-k-changes', name: 'K hängt von den Mengen ab', wrongText: 'Gibt man mehr Edukt zu, ändert sich die Gleichgewichtskonstante.' },
  { id: 'chem-mis-gg-rate-const', name: 'Geschwindigkeit bleibt gleich', wrongText: 'Hin- und Rückreaktion laufen vom Start bis zum Gleichgewicht immer gleich schnell.' },
  { id: 'chem-mis-gg-rate-conc', name: 'Geschwindigkeit ohne Konzentration', wrongText: 'Die Geschwindigkeit einer Reaktion hängt nicht von den Konzentrationen ab.' },
  { id: 'chem-mis-gg-k-rates', name: 'K aus den Geschwindigkeitskonstanten falsch herum', wrongText: 'Die Gleichgewichtskonstante ist die Konstante der Rückreaktion geteilt durch die der Hinreaktion.' },
  { id: 'chem-mis-gg-cat-shift', name: 'Katalysator verschiebt das Gleichgewicht', wrongText: 'Ein Katalysator verschiebt das Gleichgewicht zu den Produkten und erhöht so die Ausbeute.' },
  { id: 'chem-mis-gg-cat-used', name: 'Katalysator wird verbraucht', wrongText: 'Ein Katalysator wird bei der Reaktion verbraucht.' },
  { id: 'chem-mis-gg-cat-dh', name: 'Katalysator ändert die Reaktionsenthalpie', wrongText: 'Ein Katalysator macht eine Reaktion stärker exotherm.' },
  { id: 'chem-mis-gg-cat-one-way', name: 'Katalysator nur für die Hinreaktion', wrongText: 'Ein Katalysator beschleunigt nur die Hinreaktion.' },
  { id: 'chem-mis-gg-cat-energy', name: 'Katalysator liefert Energie', wrongText: 'Ein Katalysator liefert die Energie, die zum Start der Reaktion fehlt, oder erhöht die Aktivierungsenergie.' },
  { id: 'chem-mis-gg-exo-endo', name: 'Exotherm und endotherm verwechselt', wrongText: 'Bei einer exothermen Reaktion wird Wärme aufgenommen, $\\Delta H$ ist positiv.' },
  { id: 'chem-mis-gg-ea-dh', name: 'Aktivierungsenergie und Reaktionsenthalpie verwechselt', wrongText: 'Die Aktivierungsenergie ist der Energieunterschied zwischen Edukten und Produkten.' },
  { id: 'chem-mis-gg-exo-no-ea', name: 'Exotherme Reaktion ohne Aktivierungsenergie', wrongText: 'Exotherme Reaktionen brauchen keine Aktivierungsenergie und starten immer von selbst.' },
  { id: 'chem-mis-gg-heat-products', name: 'Erwärmen hilft immer den Produkten', wrongText: 'Erwärmen verschiebt jedes Gleichgewicht zu den Produkten.' },
  { id: 'chem-mis-gg-pressure-more', name: 'Druck begünstigt mehr Gasteilchen', wrongText: 'Erhöht man den Druck, wird die Seite mit mehr Gasteilchen begünstigt.' },
  { id: 'chem-mis-gg-pressure-count', name: 'Stoffe statt Gasteilchen gezählt', wrongText: 'Für den Druck zählt, wie viele verschiedene Stoffe auf einer Seite stehen.' },
  { id: 'chem-mis-gg-conc-side', name: 'Zugegebener Stoff wird noch mehr gebildet', wrongText: 'Gibt man einen Stoff zu, verschiebt sich das Gleichgewicht zu der Seite, auf der dieser Stoff steht.' },
  { id: 'chem-mis-gg-temp-rate-only', name: 'Temperatur ändert nur die Geschwindigkeit', wrongText: 'Die Temperatur ändert nur, wie schnell sich ein Gleichgewicht einstellt, nicht seine Lage.' },
]
