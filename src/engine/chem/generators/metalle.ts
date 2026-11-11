import type { GuidedStep } from '../../guided/types.ts'
import type { Rng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { MOLECULES, type Molecule, VALENCE, bondsOf, lonePairsOf, partnersOf } from '../molecules.ts'
import { type ChemCalc, type ChemGenerator, type WrongValue, stepChoices } from './shared.ts'

// Rechnungen zum Thema „Metallbindung und Hybridisierung" (Plan M4, Thema 3.4), aus festen Daten:
// - Hybridisierung (Unterthema „hybrid"): Richtungen um ein Atom (Partner + freie Paare) → sp, sp², sp³
// - σ- und π-Bindungen zählen (Unterthema „hybrid", ab Vertiefung), aus den Moleküldaten
// - Dotierung (Unterthema „halbleiter", ab Vertiefung): Fremdatom in Silicium oder Germanium → n- oder p-Leiter
// - Bindungsordnung (Unterthema „mo", Klausurniveau): bindende und antibindende Elektronen stehen in der Aufgabe

const CARD_HYBRID = 'met-hybrid'
const CARD_SIGMA = 'met-sigma-pi'
const CARD_DOPE = 'met-dotierung'
const CARD_BO = 'met-bindungsordnung'

const ce = (text: string) => String.raw`\ce{${text}}`
const math = (latex: string) => `$${latex}$`
const numberWrong = (rule: string, n: number): WrongValue => ({ rule, key: String(n), content: math(String(n)) })
const textWrong = (rule: string, text: string): WrongValue => ({ rule, key: text, content: text })
const molName = (m: Molecule) => `$${ce(m.id)}$${m.name ? ` (${m.name})` : ''}`

// --- Hybridisierung ---

const HYBRID: Readonly<Record<number, string>> = { 2: 'sp', 3: 'sp^{2}', 4: 'sp^{3}' }
const hybridLatex = (n: number) => String.raw`\mathrm{${HYBRID[n]}}`

// Atome, deren Hybridisierung gefragt werden kann: kein H, mindestens zwei Partner, höchstens vier Richtungen
type Site = { readonly mol: Molecule; readonly atom: number }
// H₂S, PH₃ und SCl₂ nicht: Ihre Winkel (etwa 92° bis 103°) passen schlecht zum Modell, Lehrbücher nehmen dort reine p-Orbitale an
const NO_HYBRID = new Set(['H2S', 'PH3', 'SCl2'])
// in den Grundlagen auch sp und sp² (sonst wäre die Antwort fast immer sp³)
const BASIC_EXTRA = new Set(['C2H4', 'C2H2', 'CH2O', 'HCN', 'CS2', 'COCl2', 'BF3', 'BCl3'])

export function hybridSites(level: Level): Site[] {
  return MOLECULES.filter((m) => (m.level <= level || (level === 1 && BASIC_EXTRA.has(m.id))) && !m.expanded && !NO_HYBRID.has(m.id)).flatMap((mol) =>
    mol.atoms.flatMap((a, atom) => {
      if (a.el === 'H' || partnersOf(mol, atom) < 2) return []
      const domains = partnersOf(mol, atom) + lonePairsOf(mol, atom)
      return domains >= 2 && domains <= 4 ? [{ mol, atom }] : []
    }),
  )
}

// gleiche Atome eines Moleküls (z. B. beide C in Ethen) nur einmal
const siteKey = (s: Site) => `${s.mol.id}:${s.mol.atoms[s.atom].el}`

export const domainsOf = (s: Site) => partnersOf(s.mol, s.atom) + lonePairsOf(s.mol, s.atom)

const atomLabel = (s: Site) => {
  const same = s.mol.atoms.filter((a) => a.el === s.mol.atoms[s.atom].el).length
  return same > 1 ? `ein $${ce(s.mol.atoms[s.atom].el)}$-Atom` : `das $${ce(s.mol.atoms[s.atom].el)}$-Atom`
}

function domainStep(s: Site, rng: Rng, focus?: string): GuidedStep | null {
  const x = partnersOf(s.mol, s.atom)
  const e = lonePairsOf(s.mol, s.atom)
  const d = x + e
  const wrong = [
    ...(e > 0 ? [numberWrong('chem-hyb-lone-pairs-ignored', x)] : []),
    ...(bondsOf(s.mol, s.atom) !== x ? [numberWrong('chem-hyb-multiple-counted', bondsOf(s.mol, s.atom) + e)] : []),
    numberWrong('chem-hyb-valence', VALENCE[s.mol.atoms[s.atom].el]),
    numberWrong('chem-hyb-all-atoms', s.mol.atoms.length),
  ]
  const choices = stepChoices(rng, { key: String(d), content: math(String(d)) }, wrong, focus)
  if (choices.length === 0) return null
  return {
    id: 'richtungen',
    title: 'Richtungen um das Atom',
    question: `In wie viele Richtungen zeigen Bindungen und freie Paare um ${atomLabel(s)} in ${molName(s.mol)}?`,
    choices,
    hint: 'Zähle die Bindungspartner und die freien Paare an diesem Atom. Eine Doppel- oder Dreifachbindung zeigt in eine Richtung.',
    explanation: {
      detailed: `${x} Bindungspartner${e > 0 ? ` und ${e} ${e === 1 ? 'freies Paar' : 'freie Paare'}` : ', kein freies Paar'}: ${d} Richtungen.${bondsOf(s.mol, s.atom) !== x ? ' Die Mehrfachbindung zählt einmal.' : ''}`,
      short: math(String(d)),
    },
    established: `${d}\\ \\text{Richtungen}`,
    cards: [CARD_HYBRID],
  }
}

function hybridStep(s: Site, rng: Rng, focus?: string): GuidedStep | null {
  const x = partnersOf(s.mol, s.atom)
  const e = lonePairsOf(s.mol, s.atom)
  const d = x + e
  const bondCount = bondsOf(s.mol, s.atom) + e
  const wrong: WrongValue[] = [
    ...(e > 0 && HYBRID[x] ? [{ rule: 'chem-hyb-lone-pairs-ignored', key: hybridLatex(x), content: math(hybridLatex(x)) }] : []),
    ...(bondCount !== d && HYBRID[bondCount] ? [{ rule: 'chem-hyb-multiple-counted', key: hybridLatex(bondCount), content: math(hybridLatex(bondCount)) }] : []),
    // Hochzahl gleich der Zahl der Richtungen gelesen: drei Richtungen als sp³
    ...(HYBRID[d + 1] ? [{ rule: 'chem-hyb-exponent', key: hybridLatex(d + 1), content: math(hybridLatex(d + 1)) }] : []),
    // zu wenige Hybridorbitale: vier Richtungen als sp²
    ...(HYBRID[d - 1] ? [{ rule: 'chem-hyb-too-few', key: hybridLatex(d - 1), content: math(hybridLatex(d - 1)) }] : []),
  ]
  const correct = hybridLatex(d)
  const choices = stepChoices(rng, { key: correct, content: math(correct) }, wrong, focus)
  if (choices.length === 0) return null
  const angle = { 2: '180°', 3: '120°', 4: '109,5°' }[d]
  return {
    id: 'hybrid',
    title: 'Hybridisierung',
    question: `Wie ist ${atomLabel(s)} hybridisiert?`,
    choices,
    hint: 'Für jede Richtung braucht das Atom ein Hybridorbital. Ein s-Orbital und so viele p-Orbitale mischen sich, dass es genau so viele Hybridorbitale gibt.',
    explanation: {
      detailed: `${d} Richtungen brauchen ${d} Hybridorbitale: ein s-Orbital und ${d - 1} p-Orbital${d - 1 === 1 ? '' : 'e'} mischen sich zu $${correct}$. Die Hybridorbitale stehen im Winkel von etwa ${angle} zueinander.`,
      short: math(correct),
    },
    established: correct,
    cards: [CARD_HYBRID],
  }
}

function hybridTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const sites = hybridSites(level)
  const unique = [...new Map(sites.map((s) => [siteKey(s), s])).values()]
  // erst die Hybridisierung wählen (sp³ in der Hälfte der Aufgaben), dann das Atom: sonst wäre fast immer sp³ richtig
  const roll = rng.next()
  const d = roll < 0.5 ? 4 : roll < 0.75 ? 3 : 2
  const withD = unique.filter((x) => domainsOf(x) === d)
  const s = rng.pick(withD.length > 0 ? withD : unique)
  const first = domainStep(s, rng, focus)
  const second = hybridStep(s, rng, focus)
  if (!first || !second) return null
  return {
    task: {
      ref,
      instruction: 'Bestimme die Hybridisierung',
      note: `Molekül: ${molName(s.mol)}.${s.mol.sextet ? ' Bor hat hier nur sechs Valenzelektronen um sich (kein Oktett) und kein freies Paar.' : ''}`,
      steps: [first, second],
      cards: [CARD_HYBRID],
      resultText: `${atomLabel(s).replace(/^(ein|das)/, (w) => (w === 'ein' ? 'Ein' : 'Das'))} in $${ce(s.mol.id)}$ ist $${hybridLatex(d)}$-hybridisiert.`,
      ...(s.mol.central === s.atom ? { resultFigure: `gestalt:${s.mol.id}` } : {}),
    },
    form: `hybrid:${level}:${d}`,
    substance: siteKey(s),
  }
}

// --- σ- und π-Bindungen ---

export const sigmaOf = (m: Molecule) => m.bonds.length
export const piOf = (m: Molecule) => m.bonds.reduce((sum, [, , o]) => sum + o - 1, 0)

function sigmaPiTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const pool = MOLECULES.filter((m) => m.level <= level && !m.expanded && m.atoms.length > 2 && m.bonds.some(([, , o]) => o > 1))
  if (pool.length === 0) return null
  const m = rng.pick(pool)
  const sigma = sigmaOf(m)
  const pi = piOf(m)
  const lines = m.bonds.reduce((sum, [, , o]) => sum + o, 0)
  const multiple = m.bonds.filter(([, , o]) => o > 1).length
  const sigmaChoices = stepChoices(rng, { key: String(sigma), content: math(String(sigma)) }, [numberWrong('chem-sigma-all-lines', lines), numberWrong('chem-sigma-multiple-only', sigma - multiple)].filter((w) => w.key !== '0'), focus)
  const piChoices = stepChoices(
    rng,
    { key: String(pi), content: math(String(pi)) },
    [numberWrong('chem-pi-all-lines', m.bonds.filter(([, , o]) => o > 1).reduce((s, [, , o]) => s + o, 0)), numberWrong('chem-pi-per-bond', multiple), numberWrong('chem-pi-single', sigma)],
    focus,
  )
  if (sigmaChoices.length === 0 || piChoices.length === 0) return null
  return {
    task: {
      ref,
      instruction: 'Zähle σ- und π-Bindungen',
      note: `Molekül: ${molName(m)}. Die Lewis-Formel steht unter der ersten Frage.`,
      steps: [
        {
          id: 'sigma',
          title: 'σ-Bindungen',
          question: `Wie viele σ-Bindungen hat ${molName(m)}?`,
          choices: sigmaChoices,
          hint: 'Zwischen zwei verbundenen Atomen gibt es genau eine σ-Bindung, egal ob einfach, doppelt oder dreifach gebunden.',
          explanation: { detailed: `Jede Verbindung zwischen zwei Atomen enthält genau eine σ-Bindung: ${m.bonds.length} Verbindungen, also ${sigma} σ-Bindungen.`, short: math(String(sigma)) },
          established: `${sigma}\\ \\sigma`,
          cards: [CARD_SIGMA],
          figure: `lewis:${m.id}`,
        },
        {
          id: 'pi',
          title: 'π-Bindungen',
          question: `Wie viele π-Bindungen hat ${molName(m)}?`,
          choices: piChoices,
          hint: 'Eine Doppelbindung besteht aus einer σ- und einer π-Bindung, eine Dreifachbindung aus einer σ- und zwei π-Bindungen.',
          explanation: {
            detailed: pi === 0 ? 'Das Molekül hat nur Einfachbindungen; jede ist eine σ-Bindung. π-Bindungen gibt es keine.' : `Jede Doppelbindung bringt eine π-Bindung, jede Dreifachbindung zwei: zusammen ${pi}.`,
            short: math(String(pi)),
          },
          cards: [CARD_SIGMA],
        },
      ],
      cards: [CARD_SIGMA],
      resultText: `${molName(m)}: ${sigma} σ- und ${pi} π-Bindung${pi === 1 ? '' : 'en'}`,
    },
    form: `sigma-pi:${level}:${pi}`,
    substance: m.id,
  }
}

// --- Dotierung ---

// Fremdatome mit ihrer Hauptgruppe (III: ein Elektron weniger als Si, V: eines mehr)
const DOPANTS: readonly { el: string; name: string; group: 13 | 15 }[] = [
  { el: 'B', name: 'Bor', group: 13 },
  { el: 'Al', name: 'Aluminium', group: 13 },
  { el: 'Ga', name: 'Gallium', group: 13 },
  { el: 'In', name: 'Indium', group: 13 },
  { el: 'P', name: 'Phosphor', group: 15 },
  { el: 'As', name: 'Arsen', group: 15 },
  { el: 'Sb', name: 'Antimon', group: 15 },
]
const HOSTS = [
  { el: 'Si', name: 'Silicium' },
  { el: 'Ge', name: 'Germanium' },
]

const DOPE_TEXT = {
  n: 'Ein Elektron bleibt übrig und kann wandern: n-Leiter.',
  p: 'Ein Elektron fehlt; es entsteht ein Loch, das wandern kann: p-Leiter.',
  none: 'Nichts ändert sich; alle Elektronen bleiben in Bindungen.',
  charged: 'Der Kristall wird insgesamt elektrisch geladen.',
}

function dopeTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  const d = rng.pick(DOPANTS)
  const host = rng.pick(HOSTS)
  const ve = d.group - 10
  const first = stepChoices(rng, { key: String(ve), content: math(String(ve)) }, [numberWrong('chem-dope-group-number', d.group), numberWrong('chem-dope-host-valence', 4)], focus)
  const type = ve === 5 ? 'n' : 'p'
  const secondCorrect = DOPE_TEXT[type]
  const second = stepChoices(
    rng,
    { key: secondCorrect, content: secondCorrect },
    [textWrong('chem-dope-swapped', DOPE_TEXT[type === 'n' ? 'p' : 'n']), textWrong('chem-dope-charged', DOPE_TEXT.charged), textWrong('chem-dope-no-effect', DOPE_TEXT.none)],
    focus,
  )
  return {
    task: {
      ref,
      instruction: 'Bestimme die Art der Dotierung',
      note: `Reines ${host.name} $${ce(host.el)}$ wird mit wenig ${d.name} $${ce(d.el)}$ dotiert.`,
      steps: [
        {
          id: 'valenz',
          title: 'Valenzelektronen',
          question: `Wie viele Valenzelektronen hat ein ${d.name}-Atom?`,
          choices: first,
          hint: `${d.name} steht in der ${d.group === 13 ? 'III.' : 'V.'} Hauptgruppe (Gruppe ${d.group}).`,
          explanation: { detailed: `${d.name} steht in der ${d.group === 13 ? 'III.' : 'V.'} Hauptgruppe: ${ve} Valenzelektronen. ${host.name} hat 4.`, short: math(String(ve)) },
          established: `${ve}\\ \\text{Valenzelektronen}`,
          cards: [CARD_DOPE],
        },
        {
          id: 'typ',
          title: 'Art der Dotierung',
          question: `Was geschieht, wenn ein ${d.name}-Atom im Gitter einen Platz von ${host.name} einnimmt?`,
          choices: second,
          hint: `Jedes Atom im Gitter bildet vier Bindungen zu seinen Nachbarn. Reichen die Valenzelektronen des Fremdatoms dafür genau, oder gibt es eines zu viel oder zu wenig?`,
          explanation: {
            detailed:
              type === 'n'
                ? `Vier der ${ve} Valenzelektronen bilden die Bindungen zu den Nachbarn; das fünfte bleibt übrig und ist leicht beweglich. Das Fremdatom gibt ein Elektron ab (Donator): n-Leiter (negative Ladungsträger).`
                : `Für vier Bindungen fehlt ein Elektron: Es entsteht ein Loch (Defektelektron), in das Nachbarelektronen springen können. Das Fremdatom nimmt ein Elektron auf (Akzeptor): p-Leiter (positive Löcher als Ladungsträger).`,
            short: secondCorrect,
          },
          cards: [CARD_DOPE],
        },
      ],
      cards: [CARD_DOPE],
      resultText: `${host.name} mit ${d.name}: ${type}-Leiter`,
    },
    form: `dotierung:${level}:${type}:${host.el}`,
    substance: `${host.el}-${d.el}`,
  }
}

// --- Bindungsordnung ---

// Valenzelektronen in bindenden und antibindenden Molekülorbitalen (Anzahlen hängen nicht von der Reihenfolge σ2p/π2p ab)
export const MO_SPECIES: readonly { id: string; ce: string; bonding: number; antibonding: number; level: 3 }[] = [
  { id: 'H2', ce: 'H2', bonding: 2, antibonding: 0, level: 3 },
  { id: 'H2+', ce: 'H2+', bonding: 1, antibonding: 0, level: 3 },
  { id: 'He2', ce: 'He2', bonding: 2, antibonding: 2, level: 3 },
  { id: 'He2+', ce: 'He2+', bonding: 2, antibonding: 1, level: 3 },
  { id: 'Li2', ce: 'Li2', bonding: 2, antibonding: 0, level: 3 },
  { id: 'Be2', ce: 'Be2', bonding: 2, antibonding: 2, level: 3 },
  { id: 'B2', ce: 'B2', bonding: 4, antibonding: 2, level: 3 },
  { id: 'C2', ce: 'C2', bonding: 6, antibonding: 2, level: 3 },
  { id: 'N2', ce: 'N2', bonding: 8, antibonding: 2, level: 3 },
  { id: 'N2+', ce: 'N2+', bonding: 7, antibonding: 2, level: 3 },
  { id: 'O2', ce: 'O2', bonding: 8, antibonding: 4, level: 3 },
  { id: 'O2+', ce: 'O2+', bonding: 8, antibonding: 3, level: 3 },
  { id: 'O2-', ce: 'O2-', bonding: 8, antibonding: 5, level: 3 },
  { id: 'F2', ce: 'F2', bonding: 8, antibonding: 6, level: 3 },
  { id: 'Ne2', ce: 'Ne2', bonding: 8, antibonding: 8, level: 3 },
  // dritte Periode: 3s und 3p wie 2s und 2p gezählt (Skript Kovalente Bindung, Folie 15)
  { id: 'Cl2', ce: 'Cl2', bonding: 8, antibonding: 6, level: 3 },
]

const half = (n: number) => (Number.isInteger(n / 2) ? String(n / 2) : `${(n - 1) / 2}{,}5`)

const STABLE = {
  yes: 'Ja: Die Bindungsordnung ist größer als 0.',
  no: 'Nein: Bei Bindungsordnung 0 gleichen sich bindende und antibindende Elektronen aus.',
  noHalf: 'Nein: Nur ganzzahlige Bindungsordnungen ergeben eine Bindung.',
  yesElectrons: 'Ja: Es hat bindende Elektronen, das reicht.',
  noAnti: 'Nein: Sobald antibindende Elektronen da sind, gibt es keine Bindung.',
  noPair: 'Nein: Ein einzelnes bindendes Elektronenpaar reicht für keine Bindung.',
}

function bondOrderTask(level: Level, rng: Rng, ref: TaskRef, focus?: string): ChemCalc | null {
  // gezielt üben „ein Paar zu wenig“: nur Teilchen ohne antibindende Elektronen mit ganzer Bindungsordnung
  const sp = rng.pick(focus === 'chem-bo-one-pair' ? MO_SPECIES.filter((x) => x.antibonding === 0 && x.bonding % 2 === 0) : MO_SPECIES)
  const b = sp.bonding
  const a = sp.antibonding
  const order = b - a
  const first = stepChoices(
    rng,
    { key: half(order), content: math(half(order)) },
    [
      { rule: 'chem-bo-not-halved', key: String(order), content: math(String(order)) },
      { rule: 'chem-bo-added', key: half(b + a), content: math(half(b + a)) },
      { rule: 'chem-bo-bonding-only', key: half(b), content: math(half(b)) },
    ],
    focus,
  )
  const stable = order > 0
  const correct = stable ? STABLE.yes : STABLE.no
  const second = stepChoices(
    rng,
    { key: correct, content: correct },
    stable
      ? [order % 2 === 1 ? textWrong('chem-bo-half-unstable', STABLE.noHalf) : a > 0 ? textWrong('chem-bo-antibonding-blocks', STABLE.noAnti) : textWrong('chem-bo-one-pair', STABLE.noPair)]
      : [textWrong('chem-bo-zero-stable', STABLE.yesElectrons)],
    focus,
  )
  if (first.length === 0 || second.length === 0) return null
  return {
    task: {
      ref,
      instruction: 'Berechne die Bindungsordnung',
      note: `Teilchen: $${ce(sp.ce)}$. Im MO-Schema stehen ${b} Valenzelektronen in bindenden und ${a} in antibindenden Molekülorbitalen.`,
      steps: [
        {
          id: 'ordnung',
          title: 'Bindungsordnung',
          question: `Wie groß ist die Bindungsordnung von $${ce(sp.ce)}$?`,
          choices: first,
          hint: 'Bindungsordnung = (bindende Elektronen − antibindende Elektronen) : 2.',
          explanation: { detailed: `$\\text{BO} = (${b} - ${a}) : 2 = ${half(order)}$. Antibindende Elektronen schwächen die Bindung und werden abgezogen.`, short: math(`\\text{BO} = ${half(order)}`) },
          established: `\\text{BO} = ${half(order)}`,
          cards: [CARD_BO],
        },
        {
          id: 'stabil',
          title: 'Bindung oder nicht?',
          question: `Sagt das MO-Modell für $${ce(sp.ce)}$ eine Bindung voraus?`,
          choices: second,
          hint: 'Eine Bindung besteht, sobald die bindenden Elektronen überwiegen, auch bei einer halben Bindungsordnung.',
          explanation: {
            detailed: stable ? `Die Bindungsordnung $${half(order)}$ ist größer als 0: Die bindenden Elektronen überwiegen, das Modell sagt eine Bindung voraus.` : 'Bindende und antibindende Elektronen heben sich auf; das Modell sagt keine Bindung voraus. (Höchstens sehr schwache Anziehungen wie Van-der-Waals-Kräfte bleiben.)',
            short: correct,
          },
          cards: [CARD_BO],
        },
      ],
      cards: [CARD_BO],
      resultText: `$${ce(sp.ce)}$: Bindungsordnung $${half(order)}$`,
    },
    form: `bo:${level}`,
    substance: sp.id,
  }
}

export { hybridTask, sigmaPiTask, dopeTask, bondOrderTask }

export const METALLE_GENERATORS: readonly ChemGenerator[] = [
  {
    kind: 'hybrid',
    part: 'hybrid',
    weights: { 1: 1, 2: 0.35, 3: 0.25 },
    errors: ['chem-hyb-lone-pairs-ignored', 'chem-hyb-multiple-counted', 'chem-hyb-valence', 'chem-hyb-all-atoms', 'chem-hyb-exponent', 'chem-hyb-too-few'],
    generate: hybridTask,
  },
  {
    kind: 'sigma-pi',
    part: 'hybrid',
    weights: { 2: 0.3, 3: 0.2 },
    errors: ['chem-sigma-all-lines', 'chem-sigma-multiple-only', 'chem-pi-all-lines', 'chem-pi-per-bond', 'chem-pi-single'],
    generate: sigmaPiTask,
  },
  {
    kind: 'dotierung',
    part: 'halbleiter',
    weights: { 2: 0.35, 3: 0.25 },
    errors: ['chem-dope-group-number', 'chem-dope-host-valence', 'chem-dope-swapped', 'chem-dope-charged', 'chem-dope-no-effect'],
    generate: dopeTask,
  },
  {
    kind: 'bindungsordnung',
    part: 'mo',
    weights: { 3: 0.3 },
    errors: ['chem-bo-not-halved', 'chem-bo-added', 'chem-bo-bonding-only', 'chem-bo-zero-stable', 'chem-bo-half-unstable', 'chem-bo-antibonding-blocks', 'chem-bo-one-pair'],
    generate: bondOrderTask,
  },
]
