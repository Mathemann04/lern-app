// Verzeichnis der Umstell-Aufgaben nach Bausteinen (M6 Schritt 3): für die Nummern 1 bis N jeder Stufe, welche
// Bausteine die Aufgabe hat. Damit findet die App zu jeder Auswahl sofort passende Aufgaben (auch seltene wie „nur
// Determinanten"), ohne viele Aufgaben zur Probe zu bauen.
// Aufruf nach jeder Änderung an Baukasten, Vorlagen, Umstell-Engine oder Bausteinen (rearrangeBlocks.ts):
//   node scripts/rearrange-index.ts
// Dauert einige Minuten. Schreibt src/engine/tasks/rearrangeIndex.ts (Nummern, nur für die Engine) und
// src/engine/tasks/rearrangeCombos.ts (welche Bausteine zusammen vorkommen, für die Seiten ohne Engine).
// Der Test in rearrangeIndex.test.ts prüft Stichproben und meldet, wenn das Verzeichnis veraltet ist.
import { writeFileSync } from 'node:fs'
import { solveTask } from '../src/engine/rearrange/isolate.ts'
import { INDEX_ALPHABET, REARRANGE_INDEX_LEVELS } from '../src/engine/tasks/rearrangeIndexFormat.ts'
import { rearrangeTaskBlocks } from '../src/engine/tasks/rearrangeBlocks.ts'
import { generateRearrangeTask } from '../src/engine/tasks/rearrangeTerms.ts'

type Level = 1 | 2 | 3 | 4 | 5

const comboLines: string[] = []
const indexLines: string[] = []
const sizeLines: string[] = []
const widthLines: string[] = []

for (const [levelText, size] of Object.entries(REARRANGE_INDEX_LEVELS)) {
  const level = Number(levelText) as Level
  const keys: string[] = []
  const started = Date.now()
  for (let seed = 1; seed <= size; seed++) {
    const { task } = generateRearrangeTask({ level, seed })
    const solution = solveTask(task)
    if (!solution) throw new Error(`Aufgabe ${level}-${seed} lässt sich nicht lösen`)
    keys.push(rearrangeTaskBlocks(task, solution).join('+'))
    if (seed % 1000 === 0) console.log(`Stufe ${level}: ${seed} von ${size} (${Math.round((Date.now() - started) / 1000)} s)`)
  }
  // Kombinationen nach Häufigkeit, bei Gleichstand alphabetisch (stabil bei erneutem Erzeugen)
  const counts = new Map<string, number>()
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
  const combos = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([key]) => key)
  const width = combos.length <= INDEX_ALPHABET.length ? 1 : 2
  if (combos.length > INDEX_ALPHABET.length ** 2) throw new Error(`Stufe ${level}: zu viele Kombinationen`)
  const position = new Map(combos.map((key, i) => [key, i]))
  const code = (i: number) => (width === 1 ? INDEX_ALPHABET[i] : INDEX_ALPHABET[Math.floor(i / INDEX_ALPHABET.length)] + INDEX_ALPHABET[i % INDEX_ALPHABET.length])
  const codes = keys.map((key) => code(position.get(key)!)).join('')
  const chunks = codes.match(/.{1,100}/g) ?? []
  comboLines.push(`  ${level}: [\n${combos.map((key) => `    '${key}',`).join('\n')}\n  ],`)
  indexLines.push(`  ${level}: [\n${chunks.map((chunk) => `    '${chunk}',`).join('\n')}\n  ].join(''),`)
  sizeLines.push(`  ${level}: ${size},`)
  widthLines.push(`  ${level}: ${width},`)
  console.log(`Stufe ${level}: ${combos.length} Kombinationen, ${Math.round((Date.now() - started) / 1000)} s`)
}

const header = '// Erzeugt von scripts/rearrange-index.ts, nicht von Hand ändern.\n'

writeFileSync(
  'src/engine/tasks/rearrangeCombos.ts',
  `${header}// Gleichungen umstellen: welche Bausteine (Ids aus blocks.ts, mit + verbunden) zusammen in einer Aufgabe vorkommen, je
// Stufe, die häufigsten zuerst, gezählt unter den Nummern 1 bis N des Verzeichnisses (rearrangeIndex.ts). Reine Daten für
// die Seiten ohne Engine (Kästchen blass, Üben-Knopf gesperrt).

export const REARRANGE_COMBOS: Readonly<Record<1 | 2 | 3 | 4 | 5, readonly string[]>> = {
${comboLines.join('\n')}
}
`,
)

writeFileSync(
  'src/engine/tasks/rearrangeIndex.ts',
  `${header}// Gleichungen umstellen: je Stufe für die Nummern 1 bis N, welche Kombination von Bausteinen die Aufgabe hat, als Stelle
// in REARRANGE_COMBOS (rearrangeCombos.ts), geschrieben mit INDEX_ALPHABET in fester Breite (rearrangeIndexFormat.ts).

export const REARRANGE_INDEX_WIDTH: Readonly<Record<1 | 2 | 3 | 4 | 5, number>> = {
${widthLines.join('\n')}
}

export const REARRANGE_INDEX_CODES: Readonly<Record<1 | 2 | 3 | 4 | 5, string>> = {
${indexLines.join('\n')}
}
`,
)
console.log('Fertig.')
