import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { type Element, ELEMENTS, elementByZ } from '../elements.ts'
import { EXCEPTIONS, NOBLE_GASES, TASK_EXCEPTIONS, atomConfig } from '../electrons.ts'
import { IONIZATION, ROMAN, elementAt, jumpAfter, mainGroupName, placeOf, valenceOf } from '../pse.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Aufbau des Periodensystems" (Plan M4, Thema 2.1), alles aus dem Platz im Periodensystem
// (chem/pse.ts) gerechnet:
// - Steckbrief (Unterthema „aufbau"): Periode, Gruppe und Block eines Elements; ab Vertiefung auch Nebengruppen
// - Element aus dem Steckbrief (Unterthema „aufbau", ab Vertiefung): Periode und Zahl der Valenzelektronen → Element
// - Ionenladung (Unterthema „ionen"): abgeben oder aufnehmen, Ladung, Edelgas mit derselben Konfiguration
// - Ionisierungsenergie (Unterthema „ionisierung", ab Vertiefung): größter Sprung → Hauptgruppe (→ Element)

const CARD_AUFBAU = 'pse-aufbau'
const CARD_BLOCK = 'pse-bloecke'
const CARD_VALENCE = 'pse-valenz'
const CARD_NOBLE = 'pse-edelgasregel'
const CARD_IONS = 'pse-ionen'
const CARD_IE = 'pse-ionisierung'

const ce = (text: string) => String.raw`\ce{${text}}`
const math = (latex: string) => `$${latex}$`
const numberWrong = (rule: string, n: number): WrongValue => ({ rule, key: String(n), content: math(String(n)) })
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })
const elName = (el: Element) => `${el.name} ($${ce(el.symbol)}$)`
// Auswahl beim gezielten Üben einschränken, aber nie auf null (in manchen Stufen gibt es den Fall nicht)
const narrow = <T>(pool: readonly T[], keep: (x: T) => boolean): T[] => (pool.some(keep) ? pool.filter(keep) : [...pool])
const elWrong = (rule: string, el: Element | undefined): WrongValue[] => (el ? [{ rule, key: el.symbol, content: elName(el) }] : [])

// --- Steckbrief ---

const BLOCK_TEXT = { s: 's-Block', p: 'p-Block', d: 'd-Block', f: 'f-Block' } as const

// typischer Fehler: Nebengruppe als Hauptgruppe mit derselben römischen Nummer gelesen (Fe als VIII. Hauptgruppe; 9 und
// 10 ebenso VIII, 11 und 12 als I und II)
const asMain = (group: number) => {
  const roman = group <= 8 ? group : group <= 10 ? 8 : group - 10
  return roman <= 2 ? roman : roman + 10
}

function steckbriefPool(level: Level): Element[] {
  return ELEMENTS.filter((el) => {
    const place = placeOf(el)
    // ohne Technetium (kein natürliches Isotop, wie bei den Teilchenzahlen)
    if (el.z <= 2 || el.isotopes.length === 0) return false
    // Ausnahmen der Besetzung in Aufgaben nur Cr und Cu (docs/CHEMIE.md §6)
    if (EXCEPTIONS[el.symbol] && !(TASK_EXCEPTIONS as readonly string[]).includes(el.symbol)) return false
    if (level === 1) return place.main && place.period <= 5
    return place.main || place.period <= 5
  })
}

function steckbriefTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  let pool = steckbriefPool(level)
  if (focus === 'chem-pse-transition-main' || focus === 'chem-pse-transition-s') pool = narrow(pool, (el) => !placeOf(el).main)
  if (focus === 'chem-pse-block-period4') pool = narrow(pool, (el) => placeOf(el).block === 's' && placeOf(el).period >= 4)
  // ab Vertiefung ein Drittel Nebengruppen
  const transition = pool.filter((el) => !placeOf(el).main)
  const el = level >= 2 && transition.length > 0 && rng.next() < 0.35 ? rng.pick(transition) : rng.pick(pool)
  const place = placeOf(el)
  const valence = place.main ? valenceOf(place) : 0
  const steps: GuidedStep[] = []

  const periodChoices = stepChoices(
    rng,
    { key: String(place.period), content: math(String(place.period)) },
    [...(place.main ? [numberWrong('chem-pse-period-valence', valence)] : []), numberWrong('chem-pse-period-shells', place.period - 1)],
    focus,
  )
  if (periodChoices.length === 0) return null
  steps.push({
    id: 'periode',
    title: 'Periode',
    question: `In welcher Periode steht ${elName(el)}?`,
    choices: periodChoices,
    hint: 'Die Periode ist die Nummer der äußersten Schale, die Elektronen enthält.',
    explanation: { detailed: `Die äußersten Elektronen von ${el.name} sitzen in der Schale $n = ${place.period}$: ${place.period}. Periode.`, short: math(String(place.period)) },
    established: `${place.period}.\\ \\text{Periode}`,
    cards: [CARD_AUFBAU],
  })

  const groupText = place.main ? mainGroupName(place.group) : `Nebengruppe (Gruppe ${place.group})`
  const groupWrong: WrongValue[] = place.main
    ? [
        ...(place.period <= 8 && place.period !== valence ? [textWrong('chem-pse-group-period', mainGroupName(place.period <= 2 ? place.period : place.period + 10))] : []),
        ...(valence >= 3 && valence <= 7 ? [textWrong('chem-pse-group-number-valence', `Nebengruppe (Gruppe ${valence})`)] : []),
      ]
    : [
        textWrong('chem-pse-transition-main', mainGroupName(asMain(place.group))),
        // nur bei zwei s-Elektronen außen (nicht bei Cr und Cu)
        ...(atomConfig(el.z).find((o) => o.n === place.period && o.l === 0)?.count === 2 ? [textWrong('chem-pse-transition-s', mainGroupName(2))] : []),
      ]
  const groupChoices = stepChoices(rng, { key: groupText, content: groupText }, groupWrong, focus)
  if (groupChoices.length === 0) return null
  steps.push({
    id: 'gruppe',
    title: 'Gruppe',
    question: `In welcher Gruppe steht ${elName(el)}?`,
    choices: groupChoices,
    hint: place.main
      ? 'Bei Hauptgruppenelementen sagt die Zahl der Valenzelektronen die Hauptgruppe. Die Zählung 1 bis 18 schließt die zehn Nebengruppen mit ein.'
      : 'Bei welchen Elementen wird eine d-Unterschale aufgefüllt? Sie stehen nicht in den Hauptgruppen.',
    explanation: {
      detailed: place.main
        ? `${el.name} hat ${valence} Valenzelektronen: ${groupText}.`
        : `Bei ${el.name} wird die d-Unterschale aufgefüllt; es ist ein Nebengruppenelement. Die Nummer zählt die s- und d-Elektronen der beiden äußersten Schalen: ${groupText}.`,
      short: groupText,
    },
    cards: [place.main ? CARD_VALENCE : CARD_BLOCK],
  })

  const blockWrong: WrongValue[] = [
    ...(place.block !== 's' ? [textWrong('chem-pse-block-outer-s', BLOCK_TEXT.s)] : []),
    ...(place.block === 's' && place.period >= 4 ? [textWrong('chem-pse-block-period4', BLOCK_TEXT.d)] : []),
  ]
  const blockChoices = stepChoices(rng, { key: BLOCK_TEXT[place.block], content: BLOCK_TEXT[place.block] }, blockWrong, focus)
  if (blockChoices.length > 0 && level >= 2) {
    steps.push({
      id: 'block',
      title: 'Block',
      question: `Zu welchem Block gehört ${elName(el)}?`,
      choices: blockChoices,
      hint: 'Der Block ist die Art der Unterschale, die beim Element zuletzt aufgefüllt wird.',
      explanation: { detailed: `Bei ${el.name} wird zuletzt eine ${place.block}-Unterschale aufgefüllt: ${BLOCK_TEXT[place.block]}.`, short: BLOCK_TEXT[place.block] },
      cards: [CARD_BLOCK],
    })
  }
  return {
    task: {
      ref,
      instruction: 'Bestimme den Platz im Periodensystem',
      note: `Element: ${elName(el)}, Ordnungszahl $Z = ${el.z}$.`,
      steps,
      cards: [CARD_AUFBAU],
      resultText: `${elName(el)}: ${place.period}. Periode, ${groupText}, ${BLOCK_TEXT[place.block]}`,
      resultFigure: `pse:${el.symbol}`,
    },
    form: `steckbrief:${level}:${place.block}`,
    substance: el.symbol,
  }
}

// --- Element aus dem Steckbrief ---

const mainAt = (period: number, valence: number) => elementAt(period, valence <= 2 ? valence : valence + 10)

function reverseTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = steckbriefPool(level).filter((el) => placeOf(el).main && placeOf(el).group !== 18 && placeOf(el).period >= 2)
  const el = rng.pick(focus === 'chem-pse-rev-group-number' ? narrow(pool, (x) => placeOf(x).period >= 4 && valenceOf(placeOf(x)) >= 3) : pool)
  const place = placeOf(el)
  const valence = valenceOf(place)
  const choices = stepChoices(
    rng,
    { key: el.symbol, content: elName(el) },
    [
      ...elWrong('chem-pse-rev-swapped', valence !== place.period ? mainAt(valence, place.period) : undefined),
      ...elWrong('chem-pse-rev-group-number', valence >= 3 ? elementAt(place.period, valence) : undefined),
      ...elWrong('chem-pse-rev-period-shift', mainAt(place.period - 1, valence)),
    ],
    focus,
  )
  if (choices.length === 0) return null
  const text = `${place.period}. Periode, ${valence} ${valence === 1 ? 'Valenzelektron' : 'Valenzelektronen'}`
  return {
    task: {
      ref,
      instruction: 'Bestimme das Element aus dem Steckbrief',
      note: `Ein Hauptgruppenelement steht in der ${place.period}. Periode und hat ${valence} ${valence === 1 ? 'Valenzelektron' : 'Valenzelektronen'}.`,
      steps: [
        {
          id: 'element',
          title: 'Element',
          question: 'Welches Element ist es?',
          choices,
          hint: 'Die Periode ist die Zeile. Die Zahl der Valenzelektronen ist die Nummer der Hauptgruppe (römisch), also die Spalte.',
          explanation: {
            detailed: `${place.period}. Periode und ${ROMAN[valence - 1]}. Hauptgruppe (Gruppe ${place.group}): ${el.name}.`,
            short: elName(el),
          },
          cards: [CARD_VALENCE],
        },
      ],
      cards: [CARD_VALENCE],
      resultText: `${text}: ${elName(el)}`,
      resultFigure: `pse:${el.symbol}`,
    },
    form: `rueckwaerts:${level}:${place.group}`,
    substance: el.symbol,
  }
}

// --- Ionenladung ---

// Elemente, deren typisches Ion der Edelgasregel folgt und danach so viele Elektronen hat wie ein Edelgas (Gruppen 1, 2,
// 13 nur Al, 15 nur N und P, 16, 17; nicht Ga³⁺ oder In³⁺ mit voller d-Unterschale). Bis zur 5. Periode: Für Cs und Ba
// fehlt das Edelgas ihrer Periode in der Tabelle der App.
export const ION_ELEMENTS: readonly Element[] = ELEMENTS.filter((el) => {
  const place = placeOf(el)
  if (!place.main || el.z <= 2 || el.ions.length === 0 || place.period > 5) return false
  const q = el.ions[0]
  const v = valenceOf(place)
  return q === (v <= 3 ? v : v - 8) && NOBLE_GASES.some((g) => g.z === el.z - q)
})

const ionCeOf = (el: Element, q: number) => ce(`${el.symbol}^${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}`)
const transferText = (k: number, give: boolean) => `${give ? 'gibt' : 'nimmt'} ${k} ${k === 1 ? 'Elektron' : 'Elektronen'} ${give ? 'ab' : 'auf'}`

function ionTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  let pool = [...ION_ELEMENTS]
  if (focus === 'chem-pse-charge-group-number') pool = narrow(pool, (el) => placeOf(el).group === 13)
  if (focus === 'chem-pse-charge-valence') pool = narrow(pool, (el) => el.ions[0] < 0)
  const el = rng.pick(pool)
  const place = placeOf(el)
  const v = valenceOf(place)
  const q = el.ions[0]
  const give = q > 0
  const k = Math.abs(q)
  const first = stepChoices(
    rng,
    { key: transferText(k, give), content: `Es ${transferText(k, give)}.` },
    [textWrong(give ? 'chem-pse-ion-take' : 'chem-pse-ion-give', `Es ${transferText(8 - k, !give)}.`)],
    focus,
  )
  const wrongIons: WrongValue[] = [
    { rule: 'chem-pse-charge-sign', key: String(-q), content: math(ionCeOf(el, -q)) },
    ...(give && place.group >= 13 ? [{ rule: 'chem-pse-charge-group-number', key: String(place.group), content: math(ionCeOf(el, place.group)) }] : []),
    ...(!give ? [{ rule: 'chem-pse-charge-valence', key: String(v), content: math(ionCeOf(el, v)) }] : []),
    ...(give ? [{ rule: 'chem-pse-charge-octet', key: String(-(8 - v)), content: math(ionCeOf(el, -(8 - v))) }] : []),
  ]
  const second = stepChoices(rng, { key: String(q), content: math(ionCeOf(el, q)) }, wrongIons, focus)
  const n = el.z - q
  const noble = NOBLE_GASES.find((g) => g.z === n)!
  const own = NOBLE_GASES.find((g) => g.z > el.z)!
  const previous = [...NOBLE_GASES].reverse().find((g) => g.z < el.z)!
  const nobleName = (g: { z: number }) => elementByZ(g.z)!.name
  const third = stepChoices(
    rng,
    { key: noble.symbol, content: nobleName(noble) },
    [...(give ? [textWrong('chem-pse-noble-own-period', nobleName(own))] : [textWrong('chem-pse-noble-previous', nobleName(previous))])],
    focus,
  )
  if (first.length === 0 || second.length === 0 || third.length === 0) return null
  const steps: GuidedStep[] = [
    {
      id: 'weg',
      title: 'Abgeben oder aufnehmen',
      question: `Wie erreicht ein ${el.name}-Atom am einfachsten eine Edelgaskonfiguration?`,
      choices: first,
      hint: `${el.name} hat ${v} ${v === 1 ? 'Valenzelektron' : 'Valenzelektronen'}. Was ist weniger: diese abzugeben oder bis zu acht aufzufüllen?`,
      explanation: {
        detailed: give
          ? `Mit ${v} ${v === 1 ? 'Valenzelektron' : 'Valenzelektronen'} ist Abgeben einfacher als ${8 - v} aufzunehmen. Danach ist die voll besetzte Schale darunter die äußerste.`
          : `Mit ${v} Valenzelektronen fehlen nur ${8 - v} bis zum Oktett. Aufnehmen ist einfacher als ${v} abzugeben.`,
        short: `Es ${transferText(k, give)}.`,
      },
      cards: [CARD_NOBLE],
    },
    {
      id: 'ladung',
      title: 'Ion',
      question: `Welches Ion bildet ${elName(el)}?`,
      choices: second,
      hint: 'Elektronen sind negativ. Wer Elektronen abgibt, wird positiv; wer welche aufnimmt, negativ.',
      explanation: { detailed: `${el.name} ${transferText(k, give)}: $${ionCeOf(el, q)}$.`, short: math(ionCeOf(el, q)) },
      established: ionCeOf(el, q),
      cards: [CARD_IONS],
    },
  ]
  if (level >= 2) {
    steps.push({
      id: 'edelgas',
      title: 'Edelgaskonfiguration',
      question: `Die Konfiguration welches Edelgases hat $${ionCeOf(el, q)}$?`,
      choices: third,
      hint: 'Zähle die Elektronen des Ions und suche das Edelgas mit derselben Zahl.',
      explanation: { detailed: `$${ionCeOf(el, q)}$ hat $${el.z} ${give ? '-' : '+'} ${k} = ${n}$ Elektronen, so viele wie ${nobleName(noble)}.`, short: nobleName(noble) },
      cards: [CARD_NOBLE],
    })
  }
  return {
    task: {
      ref,
      instruction: 'Bestimme das Ion',
      note: `Element: ${elName(el)}, ${mainGroupName(place.group)}.`,
      steps,
      cards: [CARD_IONS],
      resultText: `${elName(el)} bildet $${ionCeOf(el, q)}$ mit der Konfiguration von ${nobleName(noble)}.`,
      resultFigure: `pse:${el.symbol}`,
    },
    form: `ion:${level}:${q}`,
    substance: el.symbol,
  }
}

// --- Ionisierungsenergie ---

const subscriptI = (i: number) => `I_{${i}}`
const energyTable = (energies: readonly number[]) =>
  energies.map((e, i) => `${subscriptI(i + 1)} = ${e < 10000 ? String(e) : `${String(e).slice(0, -3)}\\,${String(e).slice(-3)}`}`).join(',\\ ')
const pairText = (i: number) => math(`\\text{zwischen } ${subscriptI(i)} \\text{ und } ${subscriptI(i + 1)}`)

function ieTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const symbols = Object.keys(IONIZATION)
  const symbol = rng.pick(symbols)
  const energies = IONIZATION[symbol]
  const el = ELEMENTS.find((x) => x.symbol === symbol)!
  const place = placeOf(el)
  const jump = jumpAfter(energies)
  const last = energies.length - 1
  const first = stepChoices(
    rng,
    { key: String(jump), content: pairText(jump) },
    [
      ...(jump !== last ? [{ rule: 'chem-pse-ie-largest', key: String(last), content: pairText(last) }] : []),
      ...(jump !== 1 ? [{ rule: 'chem-pse-ie-first', key: '1', content: pairText(1) }] : []),
    ],
    focus,
  )
  const groupText = (v: number) => (v >= 1 && v <= 8 ? mainGroupName(v <= 2 ? v : v + 10) : '')
  const second = stepChoices(
    rng,
    { key: String(jump), content: groupText(jump) },
    [
      ...(jump + 1 <= 8 ? [{ rule: 'chem-pse-ie-count-after', key: String(jump + 1), content: groupText(jump + 1) }] : []),
      ...(energies.length !== jump && energies.length !== jump + 1 ? [{ rule: 'chem-pse-ie-count-all', key: String(energies.length), content: groupText(energies.length) }] : []),
    ],
    focus,
  )
  if (first.length === 0 || second.length === 0) return null
  const steps: GuidedStep[] = [
    {
      id: 'sprung',
      title: 'Größter Sprung',
      question: 'Zwischen welchen Ionisierungsenergien liegt der größte Sprung?',
      choices: first,
      hint: 'Vergleiche jede Energie mit der vorherigen. Wo steigt sie auf ein Vielfaches?',
      explanation: {
        detailed: `Von $${subscriptI(jump)}$ nach $${subscriptI(jump + 1)}$ steigt die Energie auf mehr als das ${Math.floor(energies[jump] / energies[jump - 1])}-Fache. Ab dort muss ein Elektron aus einer inneren, voll besetzten Schale entfernt werden.`,
        short: pairText(jump),
      },
      cards: [CARD_IE],
    },
    {
      id: 'gruppe',
      title: 'Hauptgruppe',
      question: 'In welcher Hauptgruppe steht das Element?',
      choices: second,
      hint: 'Vor dem großen Sprung werden die Valenzelektronen abgegeben. Wie viele sind es?',
      explanation: { detailed: `Vor dem Sprung lässt sich ${jump === 1 ? 'ein Elektron' : `${jump} Elektronen`} leicht entfernen: ${jump} ${jump === 1 ? 'Valenzelektron' : 'Valenzelektronen'}, ${groupText(jump)}.`, short: groupText(jump) },
      established: `${ROMAN[jump - 1]}.\\ \\text{Hauptgruppe}`,
      cards: [CARD_IE],
    },
  ]
  if (level >= 3) {
    const third = stepChoices(
      rng,
      { key: el.symbol, content: elName(el) },
      [...elWrong('chem-pse-ie-count-after', mainAt(place.period, jump + 1)), ...elWrong('chem-pse-ie-count-all', energies.length !== jump + 1 ? mainAt(place.period, energies.length) : undefined)],
      focus,
    )
    if (third.length > 0) {
      steps.push({
        id: 'element',
        title: 'Element',
        question: `Welches Element der ${place.period}. Periode ist es?`,
        choices: third,
        hint: 'Periode und Hauptgruppe legen das Element fest.',
        explanation: { detailed: `${place.period}. Periode, ${groupText(jump)}: ${el.name}.`, short: elName(el) },
        cards: [CARD_IE],
      })
    }
  }
  return {
    task: {
      ref,
      instruction: 'Werte die Ionisierungsenergien aus',
      note: `Aufeinanderfolgende Ionisierungsenergien eines Elements der ${place.period}. Periode, in kJ/mol.`,
      functionLatex: energyTable(energies),
      steps,
      cards: [CARD_IE],
      resultText: `${elName(el)}: ${jump} ${jump === 1 ? 'Valenzelektron' : 'Valenzelektronen'}, ${groupText(jump)}`,
      resultFigure: `pse:${el.symbol}`,
    },
    form: `ionisierung:${level}`,
    substance: el.symbol,
  }
}

export { steckbriefTask, reverseTask, ionTask, ieTask }

export const PSE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'steckbrief',
    part: 'aufbau',
    weights: { 1: 1, 2: 0.8, 3: 0.5 },
    errors: ['chem-pse-period-valence', 'chem-pse-period-shells', 'chem-pse-group-period', 'chem-pse-group-number-valence', 'chem-pse-transition-main', 'chem-pse-transition-s', 'chem-pse-block-outer-s', 'chem-pse-block-period4'],
    generate: steckbriefTask,
  },
  {
    kind: 'steckbrief-rueckwaerts',
    part: 'aufbau',
    weights: { 2: 0.4, 3: 0.5 },
    errors: ['chem-pse-rev-swapped', 'chem-pse-rev-group-number', 'chem-pse-rev-period-shift'],
    generate: reverseTask,
  },
  {
    kind: 'ionenladung',
    part: 'ionen',
    weights: { 1: 0.8, 2: 0.6, 3: 0.4 },
    errors: ['chem-pse-ion-take', 'chem-pse-ion-give', 'chem-pse-charge-sign', 'chem-pse-charge-group-number', 'chem-pse-charge-valence', 'chem-pse-charge-octet', 'chem-pse-noble-own-period', 'chem-pse-noble-previous'],
    generate: ionTask,
  },
  {
    kind: 'ionisierung',
    part: 'ionisierung',
    weights: { 2: 0.4, 3: 0.6 },
    errors: ['chem-pse-ie-largest', 'chem-pse-ie-first', 'chem-pse-ie-count-after', 'chem-pse-ie-count-all'],
    generate: ieTask,
  },
]
