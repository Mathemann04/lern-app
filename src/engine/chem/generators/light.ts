import type { Rng } from '../../random/rng.ts'
import { type Rational, rat, ratDiv, ratMul } from '../../rational.ts'
import { formatLatex, roundSignificant } from '../../quantity/numberDe.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices, tolerantNumeric, tolerantWrongs, unitOf } from './shared.ts'

// Rechnung „Energie des Lichts" (Plan M4, Thema 1.1, Vertiefung): Energie oder Frequenz eines Photons
// aus der Wellenlänge, Wellenlänge aus der Energie. Exakt gerechnet mit den Konstanten aus
// docs/CHEMIE.md §4, die die Aufgabe nennt; angezeigt mit drei gültigen Ziffern.
// Fehler: Nanometer nicht umgerechnet, Formel falsch umgestellt (chem/errorRules.ts).

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

export const LIGHT_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'licht',
    free: true,
    part: 'licht',
    weights: { 2: 0.3 },
    errors: ['chem-light-nm', 'chem-light-formula'],
    generate,
  },
]
