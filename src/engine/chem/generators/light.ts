import type { Rng } from '../../random/rng.ts'
import { type Rational, rat, ratDiv, ratMul, ratNeg, ratSub } from '../../rational.ts'
import { formatLatex, roundSignificant } from '../../quantity/numberDe.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices, tolerantNumeric, tolerantWrongs, unitOf } from './shared.ts'

// Rechnung „Energie des Lichts" (Plan M4, Thema 1.1, Vertiefung): Energie oder Frequenz eines Photons
// aus der Wellenlänge, Wellenlänge aus der Energie. Exakt gerechnet mit den Konstanten aus
// docs/CHEMIE.md §4, die die Aufgabe nennt; angezeigt mit drei gültigen Ziffern.
// Fehler: Nanometer nicht umgerechnet, Formel falsch umgestellt (chem/errorRules.ts).
// Dazu die Rydberg-Formel für das Wasserstoffatom (Skript Aufbau der Materie, Folien 15 und 17): Wellenlänge und
// Energie beim Sprung zwischen zwei Niveaus, Energie zum Lösen des Elektrons aus einem angeregten Niveau.

// h = 6,626 · 10⁻³⁴ J · s, c = 3,00 · 10⁸ m/s
const H = rat(6626n, 10n ** 37n)
const C = rat(3n * 10n ** 8n)
const NM = rat(1n, 10n ** 9n)

export const CONSTANTS_NOTE = String.raw`Rechne mit $h = 6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s}$ und $c = 3{,}00 \cdot 10^{8}\,\mathrm{m/s}$.`

// Lichtquellen mit ihrer Wellenlänge in nm (gerundete Werte aus Datenblättern bzw. dem Spektrum des
// Wasserstoffs)
export const LIGHT_SOURCES: readonly { readonly id: string; readonly text: string; readonly nm: number }[] = [
  { id: 'laser-rot', text: 'Licht eines roten Laserpointers', nm: 650 },
  { id: 'laser-gruen', text: 'Licht eines grünen Laserpointers', nm: 532 },
  { id: 'laser-violett', text: 'violettes Laserlicht eines Blu-ray-Laufwerks', nm: 405 },
  { id: 'laser-hene', text: 'rotes Licht eines Helium-Neon-Lasers', nm: 633 },
  { id: 'natrium', text: 'gelbes Licht einer Natriumdampflampe', nm: 589 },
  { id: 'h-rot', text: 'die rote Linie im Spektrum des Wasserstoffs', nm: 656 },
  { id: 'h-tuerkis', text: 'die türkise Linie im Spektrum des Wasserstoffs', nm: 486 },
  { id: 'h-violett', text: 'die violette Linie im Spektrum des Wasserstoffs', nm: 434 },
  { id: 'led-blau', text: 'Licht einer blauen Leuchtdiode', nm: 450 },
  { id: 'uva', text: 'UV-A-Licht einer Schwarzlichtlampe', nm: 365 },
  { id: 'uvc', text: 'UV-C-Licht einer Lampe zum Entkeimen', nm: 254 },
  { id: 'ir-fernbedienung', text: 'Infrarotlicht einer Fernbedienung', nm: 940 },
  { id: 'glasfaser', text: 'Infrarotlicht in einem Glasfaserkabel', nm: 1550 },
]

const SUBTYPES: readonly Subtype[] = ['energy', 'frequency', 'wavelength']

const UNIT: Readonly<Record<Subtype, string>> = { energy: String.raw`\,\mathrm{J}`, frequency: String.raw`\,\mathrm{s^{-1}}`, wavelength: String.raw`\,\mathrm{nm}` }
const SYMBOL: Readonly<Record<Subtype, string>> = { energy: 'E', frequency: 'f', wavelength: String.raw`\lambda` }

// Zahl mit Zehnerpotenz außer bei Wellenlängen in nm
const show = (r: Rational, subtype: Subtype) => formatLatex(r, subtype === 'wavelength' ? {} : { scientific: true })
const sci = (r: Rational) => formatLatex(r, { scientific: true })

// Falsche Werte mit Toleranz (docs/CHEMIE.md §7, shared.ts)
const tolerantWrong = (correct: Rational, wrong: readonly { rule: string; value: Rational }[], subtype: Subtype): WrongValue[] =>
  tolerantWrongs(correct, wrong, (r) => `${show(r, subtype)}${UNIT[subtype]}`)

export type Subtype = 'energy' | 'frequency' | 'wavelength'

// Werte einer Aufgabe: gegeben ist die Wellenlänge in nm bzw. (bei „wavelength") die daraus berechnete
// Energie, gerundet wie in einer Aufgabe; Lösung und Werte der Rechenfehler exakt
export function lightValues(subtype: Subtype, nm: number): { given: Rational; correct: Rational; wrong: { rule: string; value: Rational }[] } {
  const lambdaNm = rat(nm)
  const lambda = ratMul(lambdaNm, NM)
  const hc = ratMul(H, C)
  switch (subtype) {
    case 'energy':
      return {
        given: lambdaNm,
        correct: ratDiv(hc, lambda),
        wrong: [
          { rule: 'chem-light-nm', value: ratDiv(hc, lambdaNm) },
          { rule: 'chem-light-formula', value: ratDiv(ratMul(H, lambda), C) },
        ],
      }
    case 'frequency':
      return {
        given: lambdaNm,
        correct: ratDiv(C, lambda),
        wrong: [
          { rule: 'chem-light-nm', value: ratDiv(C, lambdaNm) },
          { rule: 'chem-light-formula', value: ratDiv(lambda, C) },
        ],
      }
    case 'wavelength': {
      const energy = roundSignificant(ratDiv(hc, lambda)).value
      const inMeter = ratDiv(hc, energy)
      return {
        given: energy,
        correct: ratDiv(inMeter, NM),
        wrong: [
          { rule: 'chem-light-nm', value: inMeter },
          { rule: 'chem-light-formula', value: ratDiv(ratDiv(energy, hc), NM) },
        ],
      }
    }
  }
}

function generate(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const source = rng.pick(LIGHT_SOURCES)
  const subtype = rng.pick(SUBTYPES)
  const { given: givenValue, correct, wrong } = lightValues(subtype, source.nm)
  const lambda = ratMul(rat(source.nm), NM)
  const hcText = String.raw`6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s} \cdot 3{,}00 \cdot 10^{8}\,\mathrm{m/s}`

  let given: string
  let detailed: string
  let instruction: string
  switch (subtype) {
    case 'energy':
      instruction = 'Berechne die Energie eines Photons'
      given = String.raw`\lambda = ${source.nm}\,\mathrm{nm}`
      detailed = String.raw`Wellenlänge in Meter: $\lambda = ${source.nm}\,\mathrm{nm} = ${sci(lambda)}\,\mathrm{m}$. Dann $E = h \cdot f = \frac{h \cdot c}{\lambda} = \frac{${hcText}}{${sci(lambda)}\,\mathrm{m}} \approx ${sci(correct)}\,\mathrm{J}$.`
      break
    case 'frequency':
      instruction = 'Berechne die Frequenz des Lichts'
      given = String.raw`\lambda = ${source.nm}\,\mathrm{nm}`
      detailed = String.raw`Wellenlänge in Meter: $\lambda = ${sci(lambda)}\,\mathrm{m}$. Aus $c = \lambda \cdot f$ folgt $f = \frac{c}{\lambda} = \frac{3{,}00 \cdot 10^{8}\,\mathrm{m/s}}{${sci(lambda)}\,\mathrm{m}} \approx ${sci(correct)}\,\mathrm{s^{-1}}$.`
      break
    case 'wavelength':
      instruction = 'Berechne die Wellenlänge des Lichts in nm'
      given = String.raw`E = ${sci(givenValue)}\,\mathrm{J}`
      detailed = String.raw`Aus $E = \frac{h \cdot c}{\lambda}$ folgt $\lambda = \frac{h \cdot c}{E} = \frac{${hcText}}{${sci(givenValue)}\,\mathrm{J}} \approx ${sci(ratMul(correct, NM))}\,\mathrm{m}$, in Nanometer (mal $10^{9}$) $\approx ${show(correct, subtype)}\,\mathrm{nm}$. Die Energie ist auf drei Ziffern gerundet; deshalb kann das Ergebnis ein wenig von der Wellenlänge abweichen, die für die Lichtquelle sonst angegeben wird (${source.nm} nm).`
      break
  }

  const answer = `${show(correct, subtype)}${UNIT[subtype]}`
  const wrongValues = tolerantWrong(correct, wrong, subtype)
  const choices = stepChoices(rng, { key: show(correct, subtype), content: `$${answer}$` }, wrongValues, focus)
  if (choices.length === 0) return null
  const symbol = SYMBOL[subtype]
  const formula = subtype === 'energy' ? String.raw`E = \frac{h \cdot c}{\lambda}` : subtype === 'frequency' ? String.raw`f = \frac{c}{\lambda}` : String.raw`\lambda = \frac{h \cdot c}{E}`
  void level
  return {
    task: {
      ref,
      instruction,
      note: `Gegeben: ${source.text}. ${CONSTANTS_NOTE}`,
      functionLatex: given,
      steps: [
        {
          id: 'licht',
          title: { energy: 'Energie', frequency: 'Frequenz', wavelength: 'Wellenlänge' }[subtype],
          question: { energy: 'Welche Energie hat ein Photon?', frequency: 'Welche Frequenz hat das Licht?', wavelength: 'Welche Wellenlänge hat das Licht?' }[subtype],
          choices,
          numeric: tolerantNumeric(correct, wrongValues, unitOf(UNIT[subtype])),
          hint:
            subtype === 'wavelength'
              ? 'Stelle $E = h \\cdot f$ mit $f = \\frac{c}{\\lambda}$ nach $\\lambda$ um. In welcher Einheit liefert die Formel die Wellenlänge?'
              : 'Welche Einheiten haben $h$ und $c$? Passe die Wellenlänge daran an, bevor du einsetzt.',
          explanation: { detailed, short: String.raw`$${formula} \approx ${answer}$` },
          established: String.raw`${formula} \approx ${answer}`,
          cards: ['atombau-licht'],
        },
      ],
      cards: ['atombau-licht'],
      resultLatex: String.raw`${symbol} \approx ${answer}`,
    },
    form: `licht:${subtype}`,
    substance: `licht-${source.id}`,
  }
}

// --- Rydberg-Formel: 1/λ = R_H · (1/n² − 1/m²), n unteres, m oberes Niveau (n < m) ---

// R_H = 1,097 · 10⁷ m⁻¹ (docs/CHEMIE.md §4)
const R_H = rat(1097n * 10n ** 4n)
const R_TEXT = String.raw`1{,}097 \cdot 10^{7}\,\mathrm{m^{-1}}`
export const RYDBERG_NOTE = String.raw`Rechne mit $R_{\mathrm{H}} = ${R_TEXT}$.`

export type RydbergKind = 'wavelength' | 'energy' | 'ionization'
// Sprung von upper nach lower; upper null: Elektron ganz gelöst (m → ∞)
export type Transition = { readonly upper: number | null; readonly lower: number }

// Die Hausaufgabe im Skript (Sprung 3 → 2, Lösen aus n = 1) kommt nie als Aufgabe; der Test rechnet sie nach
export const SCRIPT_TRANSITIONS: readonly Transition[] = [
  { upper: 3, lower: 2 },
  { upper: null, lower: 1 },
]
const isScriptTransition = (t: Transition) => SCRIPT_TRANSITIONS.some((x) => x.upper === t.upper && x.lower === t.lower)

// Sprünge zwischen Niveaus (unteres 1 bis 3, oberes bis 6) und Lösen aus einem angeregten Niveau (2 bis 5)
export const RYDBERG_TRANSITIONS: readonly Transition[] = [
  ...[1, 2, 3].flatMap((lower) => Array.from({ length: 6 - lower }, (_, i): Transition => ({ upper: lower + 1 + i, lower }))),
  ...[2, 3, 4, 5].map((lower): Transition => ({ upper: null, lower })),
].filter((t) => !isScriptTransition(t))

const inverseSquare = (k: number) => rat(1, k * k)
// Klammer der Rydberg-Formel, mit Quadrat bzw. (Fehler) ohne
const bracket = (t: Transition) => ratSub(inverseSquare(t.lower), t.upper === null ? rat(0) : inverseSquare(t.upper))
const bracketNoSquare = (t: Transition) => ratSub(rat(1, t.lower), t.upper === null ? rat(0) : rat(1, t.upper))

// Lösung und Werte der Rechenfehler, exakt: Wellenlänge in nm, Energien in J
export function rydbergValues(kind: RydbergKind, t: Transition): { correct: Rational; wrong: { rule: string; value: Rational }[] } {
  const hc = ratMul(H, C)
  const inv = ratMul(R_H, bracket(t))
  const noSquare = ratMul(R_H, bracketNoSquare(t))
  if (kind === 'wavelength') {
    const meter = ratDiv(rat(1), inv)
    return {
      correct: ratDiv(meter, NM),
      wrong: [
        { rule: 'chem-rydberg-no-square', value: ratDiv(ratDiv(rat(1), noSquare), NM) },
        { rule: 'chem-rydberg-not-inverted', value: ratDiv(inv, NM) },
        { rule: 'chem-light-nm', value: meter },
        { rule: 'chem-rydberg-swapped', value: ratNeg(ratDiv(meter, NM)) },
      ],
    }
  }
  const energy = ratMul(hc, inv)
  return {
    correct: energy,
    wrong: [
      { rule: 'chem-rydberg-no-square', value: ratMul(hc, noSquare) },
      ...(kind === 'ionization' ? [{ rule: 'chem-rydberg-to-ground', value: ratMul(hc, ratMul(R_H, ratSub(rat(1), inverseSquare(t.lower)))) }] : []),
      { rule: 'chem-rydberg-not-inverted', value: ratDiv(hc, inv) },
      { rule: 'chem-rydberg-swapped', value: ratNeg(energy) },
    ],
  }
}

const fraction = (r: Rational) => String.raw`\frac{${r.n}}{${r.d}}`
const HC_TEXT = String.raw`6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s} \cdot 3{,}00 \cdot 10^{8}\,\mathrm{m/s}`

// Texte je Art: Anweisung, Angabe, Formel, Frage, Tipp, Rechenweg
function rydbergTexts(kind: RydbergKind, t: Transition, correct: Rational) {
  const b = bracket(t)
  const inv = ratMul(R_H, b)
  const jump = `Im Wasserstoffatom fällt ein Elektron vom ${t.upper}. auf das ${t.lower}. Niveau.`
  const levels = String.raw`Unteres Niveau $n = ${t.lower}$, oberes $m = ${t.upper}$: $\frac{1}{\lambda} = ${R_TEXT} \cdot \left(\frac{1}{${t.lower}^2} - \frac{1}{${t.upper}^2}\right) = ${R_TEXT} \cdot ${fraction(b)} \approx ${sci(inv)}\,\mathrm{m^{-1}}$.`
  switch (kind) {
    case 'wavelength':
      return {
        instruction: 'Berechne die Wellenlänge des ausgesandten Lichts in nm',
        note: `${jump} ${RYDBERG_NOTE}`,
        given: String.raw`m = ${t.upper} \;\to\; n = ${t.lower}`,
        formula: String.raw`\frac{1}{\lambda} = R_{\mathrm{H}} \cdot \left(\frac{1}{n^2} - \frac{1}{m^2}\right)`,
        question: 'Welche Wellenlänge hat das ausgesandte Licht?',
        hint: String.raw`Unteres Niveau $n$, oberes $m$, beide im Quadrat. Die Formel liefert $\frac{1}{\lambda}$ in $\mathrm{m^{-1}}$.`,
        detailed: String.raw`${levels} Der Kehrwert ist die Wellenlänge: $\lambda \approx ${sci(ratMul(correct, NM))}\,\mathrm{m} \approx ${show(correct, 'wavelength')}\,\mathrm{nm}$.`,
      }
    case 'energy':
      return {
        instruction: 'Berechne die Energie des ausgesandten Photons',
        note: `${jump} ${RYDBERG_NOTE} ${CONSTANTS_NOTE}`,
        given: String.raw`m = ${t.upper} \;\to\; n = ${t.lower}`,
        formula: String.raw`E = h \cdot c \cdot R_{\mathrm{H}} \cdot \left(\frac{1}{n^2} - \frac{1}{m^2}\right)`,
        question: 'Welche Energie hat das ausgesandte Photon?',
        hint: String.raw`Die Rydberg-Formel liefert $\frac{1}{\lambda}$; mit $E = \frac{h \cdot c}{\lambda}$ wird daraus die Energie.`,
        detailed: String.raw`${levels} Dann $E = h \cdot c \cdot \frac{1}{\lambda} = ${HC_TEXT} \cdot ${sci(inv)}\,\mathrm{m^{-1}} \approx ${sci(correct)}\,\mathrm{J}$.`,
      }
    case 'ionization':
      return {
        instruction: 'Berechne die Energie, die das Elektron ganz vom Atom löst',
        note: `Im Wasserstoffatom sitzt das Elektron angeregt auf dem ${t.lower}. Niveau und soll ganz vom Kern gelöst werden. ${RYDBERG_NOTE} ${CONSTANTS_NOTE}`,
        given: String.raw`n = ${t.lower} \;\to\; m \to \infty`,
        formula: String.raw`E = h \cdot c \cdot R_{\mathrm{H}} \cdot \frac{1}{n^2}`,
        question: 'Wie viel Energie braucht das Elektron, um das Atom zu verlassen?',
        hint: String.raw`Ganz gelöst heißt: Das obere Niveau liegt unendlich weit weg, $\frac{1}{m^2} \to 0$.`,
        detailed: String.raw`Mit $m \to \infty$ fällt $\frac{1}{m^2}$ weg: $E = h \cdot c \cdot R_{\mathrm{H}} \cdot \frac{1}{${t.lower}^2} = ${HC_TEXT} \cdot ${R_TEXT} \cdot ${fraction(b)} \approx ${sci(correct)}\,\mathrm{J}$.`,
      }
  }
}

function rydbergTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const t = rng.pick(RYDBERG_TRANSITIONS)
  const kind: RydbergKind = t.upper === null ? 'ionization' : rng.pick(['wavelength', 'energy'] as const)
  const { correct, wrong } = rydbergValues(kind, t)
  const subtype: Subtype = kind === 'wavelength' ? 'wavelength' : 'energy'
  const answer = `${show(correct, subtype)}${UNIT[subtype]}`
  const wrongValues = tolerantWrong(correct, wrong, subtype)
  const choices = stepChoices(rng, { key: show(correct, subtype), content: `$${answer}$` }, wrongValues, focus)
  if (choices.length === 0) return null
  const text = rydbergTexts(kind, t, correct)
  void level
  return {
    task: {
      ref,
      instruction: text.instruction,
      note: text.note,
      functionLatex: text.given,
      steps: [
        {
          id: 'rydberg',
          title: kind === 'wavelength' ? 'Wellenlänge' : 'Energie',
          question: text.question,
          choices,
          numeric: tolerantNumeric(correct, wrongValues, unitOf(UNIT[subtype])),
          hint: text.hint,
          explanation: { detailed: text.detailed, short: String.raw`$${text.formula} \approx ${answer}$` },
          established: String.raw`${text.formula} \approx ${answer}`,
          cards: ['atombau-spektren'],
        },
      ],
      cards: ['atombau-spektren'],
      resultLatex: String.raw`${SYMBOL[subtype]} \approx ${answer}`,
    },
    form: `rydberg:${kind}:${t.lower}`,
    substance: `h-${t.upper ?? 'inf'}-${t.lower}`,
  }
}

export const LIGHT_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'licht',
    free: true,
    part: 'licht',
    weights: { 2: 0.3 },
    errors: ['chem-light-nm', 'chem-light-formula'],
    generate,
  },
  {
    kind: 'rydberg',
    free: true,
    part: 'licht',
    weights: { 2: 0.2 },
    errors: ['chem-rydberg-no-square', 'chem-rydberg-not-inverted', 'chem-rydberg-swapped', 'chem-rydberg-to-ground', 'chem-light-nm'],
    generate: rydbergTask,
  },
]
