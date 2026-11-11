import type { Explanation, MatchQuestion, MultiChoice, OrderQuestion, QuestionBank, QuestionLevel, SingleChoice, WrongOption } from '../../quiz/types.ts'
import { FORCE_NAME, MELT, forceOf, orderByBoil, roomStateOf, zmkById } from '../zmk.ts'

// Wissensfragen zum Thema „Zwischenmolekulare Kräfte“ (in eigenen Worten; Regeln in docs/CHEMIE.md). Nummern: Stufe ·
// 100 + laufende Nummer; nie neu vergeben. Begriffe wie in der Vorlesung: Van-der-Waals-Kräfte, Dipol-Dipol-Wechselwirkungen,
// Wasserstoffbrückenbindungen (im Fließtext auch kurz Wasserstoffbrücken). „Stärkste Kraft“ heißt immer die stärkste Art,
// die vorkommt: Bei großen polaren Molekülen können Van-der-Waals-Kräfte insgesamt mehr beitragen (zk-k-chlormethane). Siedepunkte aus chem/zmk.ts (gerundet, Normaldruck); Vergleiche nur mit mindestens 10 K Abstand.

const REF_UEBERSICHT = 'Skript Zwischenmolekulare Kräfte, Folie 2'
const REF_VDW = 'Skript Zwischenmolekulare Kräfte, Folie 3'
const REF_GROESSE = 'Skript Zwischenmolekulare Kräfte, Folie 4'
const REF_DIPOL = 'Skript Zwischenmolekulare Kräfte, Folie 5'
const REF_BRUECKEN = 'Skript Zwischenmolekulare Kräfte, Folie 6'
const REF_WASSER = 'Skript Zwischenmolekulare Kräfte, Folie 7'
const REF_LOESEN = 'Skript Zwischenmolekulare Kräfte, Folie 9'
const REF_TRENNEN = 'Skript Zwischenmolekulare Kräfte, Folie 10'
const REF_UNPOLAR = 'Skript Zwischenmolekulare Kräfte, Folie 4'

const r = String.raw
const w = (id: string, text: string, misconception: string, why?: Explanation): WrongOption => ({ id, text, misconception, ...(why ? { why } : {}) })

type Spec = Omit<SingleChoice, 'kind' | 'level' | 'correct'> & { correct: string }
const at = (level: QuestionLevel) => (spec: Spec): SingleChoice => ({ ...spec, kind: 'single', level, correct: { id: 'r', text: spec.correct } })
const g = at(1)
const v = at(2)
const k = at(3)

// „Wähle alle richtigen“ (N1): richtige Aussagen r1, r2, …; jede Aussage ein ganzer Satz
type MultiSpec = Omit<MultiChoice, 'kind' | 'level' | 'correct'> & { correct: readonly string[] }
const multiAt = (level: QuestionLevel) => (spec: MultiSpec): MultiChoice => ({
  ...spec,
  kind: 'multi',
  level,
  correct: spec.correct.map((text, i) => ({ id: `r${i + 1}`, text })),
})

// Zuordnen (N1b): die stärkste Kraft rechnet die Engine (forceOf in chem/zmk.ts) aus den Stoffdaten; nur Stoffe,
// die die Rechnungen auch fragen (nicht H2S und HI, generators/zmk.ts)
const zmkLabel = (id: string) => {
  const x = zmkById(id)
  return `$\\ce{${id}}$ (${x.name}${x.structure ? `, ${x.structure}` : ''})`
}
const strongest = (id: string) => FORCE_NAME[forceOf(zmkById(id))]
const forcePairs = (ids: readonly string[]) => ids.map((id) => ({ id, left: zmkLabel(id), right: strongest(id) }))
const why = (detailed: string, short: string): Explanation => ({ detailed, short })

const MATCH_FORCES_BASIC: MatchQuestion = {
  kind: 'match',
  id: 'zk-g-zuordnen-kraft',
  no: 118,
  level: 1,
  fact: 'match-strongest-force',
  part: 'kraefte',
  title: 'Stärkste Art der Kraft',
  prompt: 'Welche ist jeweils die stärkste Art von zwischenmolekularer Kraft, die vorkommt?',
  pairs: forcePairs(['CH4', 'Cl2', 'HCl', 'HBr', 'CH3Cl', 'H2O', 'NH3', 'HF']),
  traps: [
    { pair: 'HCl', right: strongest('H2O'), misconception: 'chem-mis-zk-h-other' },
    { pair: 'HBr', right: strongest('H2O'), misconception: 'chem-mis-zk-h-other', why: { detailed: 'Für Wasserstoffbrücken muss das H-Atom an Stickstoff, Sauerstoff oder Fluor sitzen. Brom ist dafür zu groß und zu wenig elektronegativ.', short: 'H muss an N, O oder F sitzen.' } },
    { pair: 'CH4', right: strongest('H2O'), misconception: 'chem-mis-zk-any-h' },
    { pair: 'NH3', right: strongest('HCl'), misconception: 'chem-mis-zk-water-only' },
  ],
  hint: 'Prüfe erst, ob ein H-Atom direkt an N, O oder F sitzt. Wenn nicht: Ist das Molekül ein Dipol?',
  explanation: why(
    r`Sitzt ein H-Atom direkt an N, O oder F, bilden sich Wasserstoffbrücken: $\ce{H2O}$, $\ce{NH3}$, $\ce{HF}$. Sonst entscheidet, ob das Molekül ein Dipol ist: $\ce{HCl}$, $\ce{HBr}$ und $\ce{CH3Cl}$ sind polar, also Dipol-Dipol-Wechselwirkungen. $\ce{CH4}$ und $\ce{Cl2}$ sind unpolar; zwischen ihnen wirken nur Van-der-Waals-Kräfte.`,
    'H an N, O oder F: Wasserstoffbrücken; sonst Dipol: Dipol-Dipol-Wechselwirkungen; unpolar: Van-der-Waals-Kräfte.',
  ),
  cards: ['zmk-kraefte', 'zmk-wasserstoffbruecken'],
  ref: REF_UEBERSICHT,
}

const MATCH_FORCES_EXAM: MatchQuestion = {
  kind: 'match',
  id: 'zk-k-zuordnen-kraft',
  no: 319,
  level: 3,
  fact: 'match-strongest-force-exam',
  part: 'kraefte',
  title: 'Stärkste Art der Kraft',
  prompt: 'Welche ist jeweils die stärkste Art von zwischenmolekularer Kraft, die vorkommt? (Van-der-Waals-Kräfte wirken überall zusätzlich.)',
  pairs: forcePairs(['CCl4', 'C8H18', 'I2', 'CHCl3', 'CH3OCH3', 'CH3COCH3', 'CH3OH', 'C3H7OH']),
  traps: [
    { pair: 'CCl4', right: strongest('CHCl3'), misconception: 'chem-mis-zk-dipole-nonpolar' },
    { pair: 'CH3OCH3', right: strongest('CH3OH'), misconception: 'chem-mis-zk-any-h' },
    { pair: 'CH3COCH3', right: strongest('CH3OH'), misconception: 'chem-mis-zk-any-h' },
    { pair: 'CHCl3', right: strongest('CH3OH'), misconception: 'chem-mis-zk-any-h' },
  ],
  hint: 'Sitzt ein H-Atom direkt an N, O oder F? Wenn nicht: Ist das ganze Molekül ein Dipol, nicht nur eine seiner Bindungen?',
  explanation: why(
    r`In Methanol und Propan-1-ol sitzt ein H-Atom am Sauerstoff: Wasserstoffbrücken. In Dimethylether und Aceton sitzen alle H-Atome am Kohlenstoff; die Moleküle sind aber Dipole, also Dipol-Dipol-Wechselwirkungen, ebenso bei $\ce{CHCl3}$. $\ce{CCl4}$ hat zwar polare Bindungen, ist als Tetraeder aber unpolar; wie bei Octan und Iod wirken nur Van-der-Waals-Kräfte. Gefragt ist die Art: Bei großen Molekülen wie $\ce{CHCl3}$ tragen die Van-der-Waals-Kräfte insgesamt sogar mehr bei als die Dipol-Dipol-Wechselwirkungen.`,
    'H an O: Wasserstoffbrücken; Dipol ohne solches H: Dipol-Dipol; unpolares Molekül: Van der Waals.',
  ),
  cards: ['zmk-kraefte', 'zmk-wasserstoffbruecken'],
  ref: REF_UEBERSICHT,
}

// Ordnen (N1c): Siedepunkte zweier Vergleichsgruppen aus chem/zmk.ts (BOIL_GROUPS), vom niedrigsten zum höchsten nach
// den Messwerten; Regel und Messwert stimmen überein (Gegenprobe in chem/zmk.test.ts)
export const ORDER_ALKANES = ['CH4', 'C2H6', 'C3H8', 'C4H10', 'C5H12', 'C6H14', 'C7H16', 'C8H18']
export const ORDER_HALIDES = ['HF', 'HCl', 'HBr', 'HI']
const boilItem = (id: string) => ({ id, text: r`${zmkById(id).name} $\ce{${id}}$` })

const ORDER_ALKANE_BOIL: OrderQuestion = {
  kind: 'order',
  id: 'zk-v-ordnen-alkane',
  no: 217,
  level: 2,
  fact: 'order-alkane-boil',
  part: 'siedepunkte',
  title: 'Siedepunkte ordnen',
  prompt: 'Ordne die Alkane nach ihrem Siedepunkt.',
  items: orderByBoil(ORDER_ALKANES).map(boilItem),
  first: 'niedrigster Siedepunkt',
  last: 'höchster Siedepunkt',
  traps: [{ kind: 'reversed', misconception: 'chem-mis-zk-size' }],
  hint: 'Zwischen Alkanen wirken nur Van-der-Waals-Kräfte. Wie hängen sie von der Größe der Moleküle ab?',
  explanation: why(
    'Alkane sind unpolar; zwischen ihren Molekülen wirken nur Van-der-Waals-Kräfte. Je länger die Kette, desto größer das Molekül und desto mehr Elektronen lassen sich verschieben: Die Kräfte werden stärker, der Siedepunkt steigt von Methan bis Octan.',
    'Längere Kette, stärkere Van-der-Waals-Kräfte, höherer Siedepunkt.',
  ),
  cards: ['zmk-siedepunkte'],
  ref: REF_GROESSE,
}

const ORDER_HALIDE_BOIL: OrderQuestion = {
  kind: 'order',
  id: 'zk-k-ordnen-halogenwasserstoffe',
  no: 320,
  level: 3,
  fact: 'order-halide-boil',
  part: 'siedepunkte',
  title: 'Siedepunkte ordnen',
  prompt: 'Ordne die Halogenwasserstoffe nach ihrem Siedepunkt.',
  items: orderByBoil(ORDER_HALIDES).map(boilItem),
  first: 'niedrigster Siedepunkt',
  last: 'höchster Siedepunkt',
  traps: [
    { kind: 'reversed', misconception: 'chem-mis-zk-boil-weak' },
    { kind: 'swap', before: 'HF', after: 'HCl', misconception: 'chem-mis-zk-mass-only' },
  ],
  hint: 'Prüfe zuerst, welches Molekül eine besondere Kraft hat. Für die übrigen entscheidet die Größe.',
  explanation: why(
    r`Zwischen $\ce{HCl}$-, $\ce{HBr}$- und $\ce{HI}$-Molekülen wirken Dipol-Dipol-Wechselwirkungen und Van-der-Waals-Kräfte; nach unten in der Gruppe werden die Moleküle größer, die Siedepunkte steigen. Fluorwasserstoff bildet als einziger Wasserstoffbrücken (H an F) und siedet deshalb trotz der kleinsten Molmasse am höchsten.`,
    r`$\ce{HCl} < \ce{HBr} < \ce{HI} < \ce{HF}$: Wasserstoffbrücken vor Größe.`,
  ),
  cards: ['zmk-siedepunkte', 'zmk-wasserstoffbruecken'],
  ref: REF_BRUECKEN,
}

// Zuordnen (N1b): Zustand bei Raumtemperatur aus Siede- und Schmelzpunkt (roomStateOf in chem/zmk.ts); nur Stoffe mit
// mindestens 10 K Abstand zu 20 bis 25 °C (Gegenprobe in chem/zmk.test.ts)
export const ROOM_STATE_IDS = ['F2', 'Cl2', 'Br2', 'I2', 'CH4', 'C4H10', 'C5H12', 'C8H18']
const roomState = (id: string): string => {
  const state = roomStateOf(id)
  if (!state) throw new Error(`Zustand von ${id} bei Raumtemperatur unklar`)
  return state
}
const MATCH_ROOM_STATE: MatchQuestion = {
  kind: 'match',
  id: 'zk-v-zuordnen-zustand',
  no: 218,
  level: 2,
  fact: 'match-room-state',
  part: 'siedepunkte',
  title: 'Zustand bei Raumtemperatur',
  prompt: 'In welchem Zustand liegt jeder Stoff bei Raumtemperatur (etwa 20 °C) und Normaldruck vor?',
  pairs: ROOM_STATE_IDS.map((id) => ({ id, left: `${zmkById(id).name} $\\ce{${id}}$`, right: roomState(id) })),
  traps: [
    { pair: 'C5H12', right: roomState('C4H10'), misconception: 'chem-mis-zk-room-state' },
    { pair: 'Br2', right: roomState('I2'), misconception: 'chem-mis-zk-room-state', why: { detailed: 'Fest ist ein Stoff bei Raumtemperatur nur, wenn auch sein Schmelzpunkt darüber liegt. Brom schmilzt schon weit unter 0 °C.', short: 'Schmelzpunkt mit 20 °C vergleichen.' } },
    { pair: 'I2', right: roomState('Cl2'), misconception: 'chem-mis-zk-size' },
  ],
  hint: 'Alle diese Stoffe sind unpolar; es wirken nur Van-der-Waals-Kräfte. Mit der Größe der Moleküle steigen Siede- und Schmelzpunkt: Liegt der Siedepunkt unter 20 °C, ist der Stoff ein Gas.',
  explanation: why(
    `Je größer die Moleküle, desto stärker die Van-der-Waals-Kräfte und desto höher Siede- und Schmelzpunkt. ${ROOM_STATE_IDS.map((id) => `${zmkById(id).name} siedet bei ${zmkById(id).boil} °C`.replace('-', '−')).join(', ')}. Gasförmig sind die Stoffe, die unter 20 °C sieden. Iod schmilzt erst bei ${MELT.I2} °C und ist deshalb fest.`,
    'Siedepunkt unter 20 °C: gasförmig; Schmelzpunkt über 25 °C: fest; sonst flüssig.',
  ),
  cards: ['zmk-siedepunkte'],
  ref: REF_UNPOLAR,
}

export const ZMK_BANK: QuestionBank = {
  course: 'chem-zmk',
  questions: [
    // ---------------------------------------------------------------- Stufe 1: Grundlagen
    g({
      id: 'zk-g-was',
      no: 101,
      fact: 'zmk-was',
      part: 'kraefte',
      title: 'Zwischenmolekulare Kräfte',
      prompt: 'Was halten zwischenmolekulare Kräfte zusammen?',
      correct: 'die Moleküle untereinander, etwa in einer Flüssigkeit',
      wrong: [
        w('f1', 'die Atome innerhalb eines Moleküls', 'chem-mis-zk-intra'),
        w('f2', 'die Protonen und Neutronen im Atomkern', 'chem-mis-zk-intra', {
          detailed: 'Den Atomkern hält die Kernkraft zusammen; mit Chemie zwischen Molekülen hat sie nichts zu tun. Zwischenmolekulare Kräfte wirken zwischen ganzen Molekülen.',
          short: 'Zwischenmolekular heißt: zwischen Molekülen.',
        }),
        w('f3', 'die Ionen in einem Salzkristall', 'chem-mis-zk-stronger', {
          detailed: 'Ein Salzkristall wird von der Ionenbindung zusammengehalten, der viel stärkeren Anziehung zwischen ganzen Ladungen. Zwischenmolekulare Kräfte wirken zwischen ungeladenen Molekülen.',
          short: 'Salze hält die Ionenbindung zusammen.',
        }),
        w('f4', 'die Elektronen in ihren Schalen', 'chem-mis-zk-intra'),
      ],
      hint: '„Zwischenmolekular“ steckt schon im Wort.',
      explanation: {
        detailed: 'Zwischenmolekulare Kräfte wirken zwischen Molekülen. Sie halten die Moleküle in Flüssigkeiten und Feststoffen beieinander; beim Sieden werden sie überwunden. Die Atome im Molekül hält die viel stärkere Atombindung zusammen.',
        short: 'Moleküle untereinander.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_UEBERSICHT,
    }),
    g({
      id: 'zk-g-staerke-bindung',
      no: 102,
      fact: 'zmk-vs-bindung',
      part: 'kraefte',
      title: 'Stärke',
      prompt: 'Wie stark sind zwischenmolekulare Kräfte im Vergleich zu Atom- und Ionenbindungen?',
      correct: 'viel schwächer',
      wrong: [
        w('f1', 'viel stärker', 'chem-mis-zk-stronger', {
          detailed: "Überlege, was beim Sieden von Wasser passiert: Zerfallen die Moleküle dabei, oder trennen sie sich nur voneinander? Daran sieht man, welche Kräfte leichter zu überwinden sind.",
          short: "Was bricht beim Sieden auf?",
        }),
        w('f2', 'etwa gleich stark', 'chem-mis-zk-stronger', {
          detailed: "Überlege, was beim Sieden von Wasser passiert: Zerfallen die Moleküle dabei, oder trennen sie sich nur voneinander? Daran sieht man, welche Kräfte leichter zu überwinden sind.",
          short: "Was bricht beim Sieden auf?",
        }),
        w('f3', 'stärker als Atombindungen, aber schwächer als Ionenbindungen', 'chem-mis-zk-stronger', {
          detailed: "Überlege, was beim Sieden von Wasser passiert: Zerfallen die Moleküle dabei, oder trennen sie sich nur voneinander? Daran sieht man, welche Kräfte leichter zu überwinden sind.",
          short: "Was bricht beim Sieden auf?",
        }),
        w('f4', 'Wasserstoffbrücken sind stärker als Atombindungen, die anderen schwächer', 'chem-mis-zk-hbond-covalent'),
      ],
      hint: 'Wasser lässt sich verdampfen, ohne dass die Moleküle zerfallen. Was sagt das?',
      explanation: {
        detailed: 'Selbst die stärkste zwischenmolekulare Kraft, die Wasserstoffbrücke, ist viel schwächer als eine Atom- oder Ionenbindung. Deshalb reicht beim Sieden schon wenig Energie, um die Moleküle voneinander zu trennen, während sie selbst ganz bleiben.',
        short: 'Viel schwächer als echte Bindungen.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_UEBERSICHT,
    }),
    g({
      id: 'zk-g-reihenfolge',
      no: 103,
      fact: 'zmk-reihenfolge',
      part: 'kraefte',
      title: 'Stärke',
      prompt: 'Wie ordnen sich die drei Kräfte nach ihrer Stärke (bei ähnlich großen Molekülen)?',
      correct: 'Van-der-Waals-Kräfte < Dipol-Dipol-Wechselwirkungen < Wasserstoffbrückenbindungen',
      wrong: [
        w('f1', 'Wasserstoffbrückenbindungen < Dipol-Dipol-Wechselwirkungen < Van-der-Waals-Kräfte', 'chem-mis-zk-order', {
          detailed: "Die drei Kräfte beruhen auf verschieden großen Ladungsverschiebungen: kurzzeitige Dipole bei allen Teilchen, dauerhafte Dipole bei polaren Molekülen und ein Sonderfall mit H an N, O oder F. Überlege, wo die Verschiebung am größten ist.",
          short: "Größere Ladungsverschiebung, stärkere Kraft.",
        }),
        w('f2', 'Dipol-Dipol-Wechselwirkungen < Van-der-Waals-Kräfte < Wasserstoffbrückenbindungen', 'chem-mis-zk-order', {
          detailed: "Die drei Kräfte beruhen auf verschieden großen Ladungsverschiebungen: kurzzeitige Dipole bei allen Teilchen, dauerhafte Dipole bei polaren Molekülen und ein Sonderfall mit H an N, O oder F. Überlege, wo die Verschiebung am größten ist.",
          short: "Größere Ladungsverschiebung, stärkere Kraft.",
        }),
        w('f3', 'Van-der-Waals-Kräfte < Wasserstoffbrückenbindungen < Dipol-Dipol-Wechselwirkungen', 'chem-mis-zk-order', {
          detailed: "Die drei Kräfte beruhen auf verschieden großen Ladungsverschiebungen: kurzzeitige Dipole bei allen Teilchen, dauerhafte Dipole bei polaren Molekülen und ein Sonderfall mit H an N, O oder F. Überlege, wo die Verschiebung am größten ist.",
          short: "Größere Ladungsverschiebung, stärkere Kraft.",
        }),
        w('f4', 'Alle drei sind gleich stark.', 'chem-mis-zk-order', {
          detailed: "Die drei Kräfte beruhen auf verschieden großen Ladungsverschiebungen: kurzzeitige Dipole bei allen Teilchen, dauerhafte Dipole bei polaren Molekülen und ein Sonderfall mit H an N, O oder F. Überlege, wo die Verschiebung am größten ist.",
          short: "Größere Ladungsverschiebung, stärkere Kraft.",
        }),
      ],
      hint: 'Welche Kraft wirkt auch zwischen unpolaren Teilchen, und welche ist ein besonders starker Sonderfall?',
      explanation: {
        detailed: 'Van-der-Waals-Kräfte beruhen auf kurzzeitigen Dipolen und sind am schwächsten. Dipol-Dipol-Wechselwirkungen wirken zwischen dauerhaften Dipolen und sind stärker. Wasserstoffbrücken sind ein besonders starker Fall der Dipol-Dipol-Wechselwirkungen.',
        short: 'Van der Waals < Dipol-Dipol < Wasserstoffbrücken.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_UEBERSICHT,
    }),
    g({
      id: 'zk-g-vdw-wo',
      no: 104,
      fact: 'vdw-ueberall',
      part: 'kraefte',
      title: 'Van-der-Waals-Kräfte',
      prompt: 'Zwischen welchen Teilchen wirken Van-der-Waals-Kräfte?',
      correct: 'zwischen allen Atomen und Molekülen',
      wrong: [
        w('f1', 'ausschließlich zwischen Molekülen mit einer positiven und einer negativen Seite', 'chem-mis-zk-vdw-some', {
          detailed: "Auch Edelgase und unpolare Stoffe wie Stickstoff werden bei tiefer Temperatur flüssig. Irgendeine Anziehung muss also auch zwischen ihren Teilchen wirken.",
          short: "Auch Edelgase werden flüssig.",
        }),
        w('f2', 'ausschließlich in Salzkristallen', 'chem-mis-zk-vdw-some', {
          detailed: "Auch Edelgase und unpolare Stoffe wie Stickstoff werden bei tiefer Temperatur flüssig. Irgendeine Anziehung muss also auch zwischen ihren Teilchen wirken.",
          short: "Auch Edelgase werden flüssig.",
        }),
        w('f3', 'nur zwischen Molekülen mit H-Atomen', 'chem-mis-zk-any-h'),
        w('f4', 'nur zwischen Metallatomen', 'chem-mis-zk-vdw-some', {
          detailed: "Auch Edelgase und unpolare Stoffe wie Stickstoff werden bei tiefer Temperatur flüssig. Irgendeine Anziehung muss also auch zwischen ihren Teilchen wirken.",
          short: "Auch Edelgase werden flüssig.",
        }),
      ],
      hint: 'Auch Edelgase lassen sich verflüssigen. Welche Kraft hält ihre Atome dann zusammen?',
      explanation: {
        detailed: 'Die Elektronen jedes Teilchens verteilen sich kurzzeitig ungleich. So entsteht ein winziger Dipol, der im Nachbarn ebenfalls einen Dipol hervorruft; beide ziehen sich an. Das geht bei allen Atomen und Molekülen, sogar bei Edelgasen.',
        short: 'Zwischen allen Teilchen.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_VDW,
    }),
    g({
      id: 'zk-g-vdw-ursache',
      no: 105,
      fact: 'vdw-ursache',
      part: 'kraefte',
      title: 'Van-der-Waals-Kräfte',
      prompt: 'Wie entstehen Van-der-Waals-Kräfte?',
      correct: 'Kurzzeitig ungleich verteilte Elektronen bilden winzige Dipole, die im Nachbarn Dipole hervorrufen.',
      wrong: [
        w('f1', 'Ein Molekül gibt Elektronen an seinen Nachbarn ab.', 'chem-mis-zk-intra'),
        w('f2', 'Dauerhafte Dipole richten sich aneinander aus.', 'chem-mis-zk-vdw-some', {
          detailed: 'Dauerhafte Dipole gibt es nur bei polaren Molekülen; ihre Anziehung heißt Dipol-Dipol-Wechselwirkung. Van-der-Waals-Kräfte gibt es auch bei unpolaren Teilchen, deren Dipole nur kurz bestehen.',
          short: 'Dauerhafte Dipole: das sind Dipol-Dipol-Wechselwirkungen.',
        }),
        w('f3', 'Zwei Moleküle teilen sich ein Elektronenpaar.', 'chem-mis-zk-hbond-covalent'),
        w('f4', 'Positive und negative Ionen ziehen sich an.', 'chem-mis-zk-stronger'),
      ],
      hint: 'Auch unpolare Teilchen ziehen sich an. Dafür muss es wenigstens kurz eine ungleiche Ladungsverteilung geben.',
      explanation: {
        detailed: 'Die Elektronen bewegen sich ständig; für einen Augenblick können mehr auf einer Seite sein. Dieser kurzzeitige Dipol verschiebt die Elektronen im Nachbarn, der dadurch selbst zum Dipol wird. Beide ziehen sich schwach an.',
        short: 'Kurzzeitige und induzierte Dipole.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_VDW,
    }),
    g({
      id: 'zk-g-dipol-wo',
      no: 106,
      fact: 'dipol-dipol-wo',
      part: 'kraefte',
      title: 'Dipol-Dipol-Wechselwirkungen',
      prompt: 'Welche Moleküle ziehen sich über Dipol-Dipol-Wechselwirkungen an?',
      correct: 'Moleküle, die als Ganzes eine positive und eine negative Seite haben',
      wrong: [
        w('f1', 'alle Moleküle mit polaren Bindungen, auch symmetrisch gebaute', 'chem-mis-zk-dipole-nonpolar'),
        w('f2', 'nur Moleküle aus gleichen Atomen', 'chem-mis-zk-dipole-nonpolar', {
          detailed: 'Moleküle aus gleichen Atomen haben keinen Unterschied der Elektronegativität und damit keine positive und negative Seite. Sie ziehen sich nur über Van-der-Waals-Kräfte an.',
          short: 'Gleiche Atome: kein Dipol.',
        }),
        w('f3', 'nur Ionen mit entgegengesetzter Ladung', 'chem-mis-zk-stronger'),
        w('f4', 'nur Wassermoleküle', 'chem-mis-zk-water-only'),
      ],
      hint: 'Ein Dipol hat zwei verschieden geladene Enden. Das muss für das ganze Molekül gelten.',
      explanation: {
        detailed: 'Dipol-Dipol-Wechselwirkungen wirken zwischen polaren Molekülen: Das positive Ende eines Moleküls zieht das negative Ende des Nachbarn an. Symmetrisch gebaute Moleküle sind trotz polarer Bindungen keine Dipole.',
        short: 'Zwischen polaren Molekülen (Dipolen).',
      },
      cards: ['zmk-kraefte'],
      ref: REF_DIPOL,
    }),
    g({
      id: 'zk-g-bruecke-bedingung',
      no: 107,
      fact: 'bruecke-bedingung',
      part: 'kraefte',
      title: 'Wasserstoffbrücken',
      prompt: 'Wann können Moleküle untereinander Wasserstoffbrücken bilden?',
      correct: 'wenn ein H-Atom direkt an N, O oder F sitzt',
      wrong: [
        w('f1', 'sobald das Molekül H-Atome enthält', 'chem-mis-zk-any-h', {
          detailed: "Nicht jedes H-Atom ist dafür geeignet; es kommt darauf an, an welchem Atom es sitzt und wie stark dieses die Elektronen zu sich zieht.",
          short: "Es kommt auf den Partner des H an.",
        }),
        w('f2', 'wenn ein H-Atom an Chlor oder Schwefel sitzt', 'chem-mis-zk-h-other', {
          detailed: "Chlor und Schwefel ziehen Elektronen zwar an, sind aber zu groß oder zu wenig elektronegativ. Die Bedingung ist enger.",
          short: "Die Bedingung ist enger.",
        }),
        w('f3', 'nur, wenn es Wassermoleküle sind', 'chem-mis-zk-water-only', {
          detailed: "Wasserstoffbrücken hängen nicht am Stoff Wasser, sondern daran, woran das H-Atom sitzt.",
          short: "Woran sitzt das H-Atom?",
        }),
        w('f4', 'wenn zwei H-Atome ein gemeinsames Elektronenpaar bilden', 'chem-mis-zk-hbond-covalent'),
      ],
      hint: 'Das H-Atom braucht einen Partner, der die Elektronen sehr stark zu sich zieht und klein ist.',
      explanation: {
        detailed: 'Sitzt H direkt an N, O oder F, zieht dieser Partner das bindende Paar stark zu sich. Das H trägt dann eine deutliche positive Teilladung und wird vom freien Paar eines N-, O- oder F-Atoms im Nachbarmolekül angezogen.',
        short: 'H direkt an N, O oder F.',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    g({
      id: 'zk-g-methan',
      no: 108,
      fact: 'kraft-methan',
      part: 'kraefte',
      title: 'Zwischenmolekulare Kräfte',
      prompt: r`Welche zwischenmolekularen Kräfte wirken zwischen Methanmolekülen $\ce{CH4}$?`,
      correct: 'nur Van-der-Waals-Kräfte',
      wrong: [
        w('f1', 'Wasserstoffbrücken, weil Methan H-Atome hat', 'chem-mis-zk-any-h'),
        w('f2', 'Dipol-Dipol-Wechselwirkungen', 'chem-mis-zk-dipole-nonpolar'),
        w('f3', 'gar keine', 'chem-mis-zk-vdw-some'),
        w('f4', 'die Atombindungen zwischen C und H', 'chem-mis-zk-intra'),
      ],
      hint: 'Ist Methan polar? Sitzt ein H an N, O oder F?',
      explanation: {
        detailed: 'Methan ist unpolar: Die $\\ce{C-H}$-Bindungen sind kaum polar und liegen symmetrisch. Seine H-Atome sitzen an Kohlenstoff. Es bleiben nur Van-der-Waals-Kräfte; deshalb siedet Methan erst bei etwa −162 °C.',
        short: 'Nur Van-der-Waals-Kräfte.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_VDW,
    }),
    g({
      id: 'zk-g-ammoniak',
      no: 109,
      fact: 'kraft-ammoniak',
      part: 'kraefte',
      title: 'Stärkste Art der Kraft',
      prompt: r`Welche ist die stärkste Art von Kraft zwischen Ammoniakmolekülen $\ce{NH3}$?`,
      correct: 'Wasserstoffbrückenbindungen',
      wrong: [
        w('f1', 'Dipol-Dipol-Wechselwirkungen, Wasserstoffbrücken gibt es nur in Wasser', 'chem-mis-zk-water-only', {
          detailed: "Wasserstoffbrücken hängen nicht am Stoff Wasser, sondern daran, woran das H-Atom sitzt.",
          short: "Woran sitzt das H-Atom?",
        }),
        w('f2', 'Van-der-Waals-Kräfte', 'chem-mis-zk-order'),
        w('f3', 'Ionenbindungen', 'chem-mis-zk-stronger'),
        w('f4', 'die Atombindungen zwischen N und H', 'chem-mis-zk-intra'),
      ],
      hint: 'Woran sind die H-Atome im Ammoniak gebunden?',
      explanation: {
        detailed: 'Im Ammoniak sitzen die H-Atome direkt am Stickstoff, und der Stickstoff hat ein freies Paar. So bilden sich Wasserstoffbrücken zwischen den Molekülen, die stärkste der drei Kräfte.',
        short: 'Wasserstoffbrücken (H an N).',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    g({
      id: 'zk-g-hcl',
      no: 110,
      fact: 'kraft-hcl',
      part: 'kraefte',
      title: 'Stärkste Art der Kraft',
      prompt: r`Welche ist die stärkste Art von Kraft zwischen Chlorwasserstoffmolekülen $\ce{HCl}$?`,
      correct: 'Dipol-Dipol-Wechselwirkungen',
      wrong: [
        w('f1', 'Wasserstoffbrücken, weil Chlor sehr elektronegativ ist', 'chem-mis-zk-h-other'),
        w('f2', 'nur Van-der-Waals-Kräfte', 'chem-mis-zk-vdw-some', {
          detailed: 'Van-der-Waals-Kräfte wirken zwar auch, sind aber nicht die einzige Art. Chlorwasserstoff ist polar; seine Moleküle ziehen sich zusätzlich als Dipole an.',
          short: 'Das Molekül ist polar.',
        }),
        w('f3', r`Ionenbindungen zwischen $\ce{H+}$ und $\ce{Cl-}$`, 'chem-mis-zk-stronger'),
        w('f4', 'die Atombindung zwischen H und Cl', 'chem-mis-zk-intra'),
      ],
      hint: 'Ist das Molekül polar? Sitzt das H an N, O oder F?',
      explanation: {
        detailed: 'Chlor ist elektronegativer als Wasserstoff: Das Molekül ist ein Dipol. Für Wasserstoffbrücken müsste das H an N, O oder F sitzen. Die stärkste Art von Kraft sind deshalb Dipol-Dipol-Wechselwirkungen; Van-der-Waals-Kräfte wirken zusätzlich.',
        short: 'Dipol-Dipol-Wechselwirkungen.',
      },
      cards: ['zmk-kraefte', 'zmk-wasserstoffbruecken'],
      ref: REF_DIPOL,
    }),
    g({
      id: 'zk-g-ethanol-h',
      no: 111,
      fact: 'ethanol-h',
      part: 'kraefte',
      title: 'Wasserstoffbrücken',
      prompt: r`Ethanol $\ce{C2H5OH}$ hat sechs H-Atome. Wie viele davon können Wasserstoffbrücken bilden?`,
      correct: 'eines, das an O sitzt',
      wrong: [
        w('f1', 'alle sechs', 'chem-mis-zk-any-h'),
        w('f2', 'fünf, die am Kohlenstoff sitzen', 'chem-mis-zk-any-h'),
        w('f3', 'keines, weil Ethanol kein Wasser ist', 'chem-mis-zk-water-only'),
        w('f4', 'keines, weil die H-Atome fest gebunden sind', 'chem-mis-zk-hbond-covalent'),
      ],
      hint: 'Schau, an welchem Atom jedes H sitzt.',
      explanation: {
        detailed: 'Fünf H-Atome sitzen am Kohlenstoff; sie sind kaum positiv geladen. Nur das H der OH-Gruppe sitzt am Sauerstoff und kann Wasserstoffbrücken bilden.',
        short: 'Nur das H der OH-Gruppe.',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    g({
      id: 'zk-g-wasser-siedepunkt',
      no: 112,
      fact: 'wasser-siedepunkt',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Warum siedet Wasser erst bei 100 °C, obwohl seine Moleküle so klein sind?',
      correct: 'Wassermoleküle halten über viele Wasserstoffbrücken fest zusammen.',
      wrong: [
        w('f1', 'Wassermoleküle sind besonders schwer.', 'chem-mis-zk-mass-only'),
        w('f2', 'Beim Sieden müssen die $\\ce{O-H}$-Bindungen aufbrechen.', 'chem-mis-zk-boil-breaks'),
        w('f3', 'Das ist bei allen kleinen Molekülen so.', 'chem-mis-zk-water-normal', {
          detailed: "Vergleiche Wasser mit Methan oder Schwefelwasserstoff: Andere kleine Moleküle sieden ganz anders. Bei Wasser muss also etwas Besonderes zwischen den Molekülen wirken.",
          short: "Vergleiche mit anderen kleinen Molekülen.",
        }),
        w('f4', 'Zwischen Wassermolekülen wirken nur Van-der-Waals-Kräfte, aber besonders viele.', 'chem-mis-zk-order'),
      ],
      hint: 'Vergleiche mit Methan: ähnlich klein, siedet aber bei etwa −162 °C. Was hat Wasser, was Methan fehlt?',
      explanation: {
        detailed: 'Jedes Wassermolekül kann mit seinen zwei H-Atomen und zwei freien Paaren bis zu vier Wasserstoffbrücken bilden. Um die Moleküle zu trennen, braucht man viel Energie: Wasser siedet bei 100 °C, viel höher als andere kleine Moleküle.',
        short: 'Viele Wasserstoffbrücken.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    g({
      id: 'zk-g-eis-schwimmt',
      no: 113,
      fact: 'eis-schwimmt',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Warum schwimmt Eis auf Wasser?',
      correct: 'Im Eis ordnen die Wasserstoffbrücken die Moleküle weitmaschig an; Eis ist weniger dicht als Wasser.',
      wrong: [
        w('f1', 'Eis ist dichter, schwimmt aber wegen eingeschlossener Luft.', 'chem-mis-zk-ice-sinks', {
          detailed: "Was schwimmt, ist weniger dicht als die Flüssigkeit darunter. Überlege, wie die Wasserstoffbrücken die Moleküle im Eis anordnen.",
          short: "Was schwimmt, ist weniger dicht.",
        }),
        w('f2', 'Im Eis liegen die Moleküle enger, deshalb ist es leichter.', 'chem-mis-zk-ice-sinks', {
          detailed: "Was schwimmt, ist weniger dicht als die Flüssigkeit darunter. Überlege, wie die Wasserstoffbrücken die Moleküle im Eis anordnen.",
          short: "Was schwimmt, ist weniger dicht.",
        }),
        w('f3', 'Beim Gefrieren zerfallen Wassermoleküle in leichtere Teile.', 'chem-mis-zk-boil-breaks'),
        w('f4', 'Eis enthält keine Wasserstoffbrücken mehr.', 'chem-mis-zk-water-normal'),
      ],
      hint: 'Was machen die Wasserstoffbrücken, wenn die Moleküle beim Gefrieren an feste Plätze rücken?',
      explanation: {
        detailed: 'Im Eis bildet jedes Molekül feste Wasserstoffbrücken zu seinen Nachbarn. Dabei entsteht ein geordnetes Gitter mit vielen Lücken. Gleich viele Moleküle brauchen mehr Platz als im flüssigen Wasser; Eis ist weniger dicht und schwimmt.',
        short: 'Weitmaschiges Gitter, geringere Dichte.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    g({
      id: 'zk-g-dichte-4',
      no: 114,
      fact: 'wasser-dichte',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Bei welcher Temperatur hat flüssiges Wasser seine größte Dichte?',
      correct: 'bei etwa 4 °C',
      wrong: [
        w('f1', 'genau bei 0 °C', 'chem-mis-zk-density-zero', {
          detailed: "Die größte Dichte liegt nicht am Gefrierpunkt: Schon beim Abkühlen kurz vor 0 °C beginnen die Wasserstoffbrücken, die Moleküle weitmaschiger anzuordnen.",
          short: "Nicht am Gefrierpunkt.",
        }),
        w('f2', 'bei 100 °C', 'chem-mis-zk-water-normal'),
        w('f3', 'als Eis bei −10 °C', 'chem-mis-zk-ice-sinks'),
        w('f4', 'bei 20 °C', 'chem-mis-zk-density-zero', {
          detailed: "Kühlt Wasser von 20 °C ab, rücken die Moleküle noch enger zusammen; die größte Dichte liegt deshalb tiefer.",
          short: "Beim Abkühlen wird es zunächst noch dichter.",
        }),
      ],
      hint: 'Ein See friert von oben zu; unten bleibt das dichteste Wasser.',
      explanation: {
        detailed: 'Kühlt Wasser ab, rücken die Moleküle zunächst enger zusammen. Unterhalb von etwa 4 °C bilden sich aber schon geordnete Bereiche mit Wasserstoffbrücken, die mehr Platz brauchen. Bei etwa 4 °C ist Wasser deshalb am dichtesten.',
        short: 'Bei etwa 4 °C.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    g({
      id: 'zk-g-oberflaeche',
      no: 115,
      fact: 'oberflaechenspannung',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Manche Insekten können über Wasser laufen. Was macht das möglich?',
      correct: 'die hohe Oberflächenspannung: Die Moleküle an der Oberfläche halten über Wasserstoffbrücken fest zusammen',
      wrong: [
        w('f1', 'Die Insekten sind leichter als Luft.', 'chem-mis-zk-water-normal', {
          detailed: "Leichter als Luft wäre ein Ballon, kein Insekt. Das Tier wird von der Wasseroberfläche getragen; die Frage ist, was sie so belastbar macht.",
          short: "Die Oberfläche trägt das Tier.",
        }),
        w('f2', 'An der Oberfläche bilden die Wassermoleküle Atombindungen untereinander.', 'chem-mis-zk-hbond-covalent'),
        w('f3', 'Wassermoleküle sind unpolar und stoßen die Beine ab.', 'chem-mis-zk-opposites', {
          detailed: "Wasser ist kein unpolarer Stoff: Seine Moleküle sind gewinkelt und haben eine positive und eine negative Seite.",
          short: "Wasser ist polar.",
        }),
        w('f4', 'Das gelingt auf jeder Flüssigkeit gleich gut.', 'chem-mis-zk-water-normal', {
          detailed: "Auf vielen anderen Flüssigkeiten sinkt ein solches Insekt ein. Wasser hat hier etwas Besonderes.",
          short: "Wasser ist hier besonders.",
        }),
      ],
      hint: 'Was hält die Wassermoleküle an der Oberfläche zusammen?',
      explanation: {
        detailed: 'An der Oberfläche werden die Wassermoleküle über Wasserstoffbrücken nach innen und zur Seite gezogen. Die Oberfläche verhält sich wie eine gespannte Haut, die ein leichtes Insekt trägt.',
        short: 'Oberflächenspannung durch Wasserstoffbrücken.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    g({
      id: 'zk-g-wasser-h2s',
      no: 116,
      fact: 'wasser-vs-h2s',
      part: 'wasser',
      title: 'Wasser',
      prompt: r`Schwefelwasserstoff $\ce{H2S}$ ist größer als Wasser, siedet aber bei etwa −60 °C. Warum siedet Wasser höher?`,
      correct: r`Zwischen Wassermolekülen gibt es Wasserstoffbrücken, zwischen $\ce{H2S}$-Molekülen nicht.`,
      wrong: [
        w('f1', 'Wasser ist das schwerere Molekül.', 'chem-mis-zk-mass-only'),
        w('f2', r`Auch $\ce{H2S}$ bildet Wasserstoffbrücken, nur weniger.`, 'chem-mis-zk-h-other'),
        w('f3', 'Größere Moleküle sieden immer niedriger.', 'chem-mis-zk-size'),
        w('f4', 'Beim Sieden von Wasser müssen $\\ce{O-H}$-Bindungen brechen.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Woran sitzen die H-Atome in den beiden Molekülen?',
      explanation: {
        detailed: 'Im Wasser sitzt H am Sauerstoff: Es bilden sich Wasserstoffbrücken. Schwefel ist dafür zu groß und zu wenig elektronegativ. Die Wasserstoffbrücken sind so stark, dass Wasser trotz kleinerer Molmasse über 150 K höher siedet.',
        short: 'Wasserstoffbrücken nur beim Wasser.',
      },
      cards: ['zmk-wasser', 'zmk-wasserstoffbruecken'],
      ref: REF_WASSER,
    }),

    // ---------------------------------------------------------------- Stufe 2: Vertiefung
    v({
      id: 'zk-v-groesse',
      no: 201,
      fact: 'vdw-groesse',
      part: 'siedepunkte',
      title: 'Van-der-Waals-Kräfte',
      prompt: 'Warum steigen die Siedepunkte der Halogene von Fluor bis Iod?',
      correct: 'Die Moleküle werden größer und haben mehr Elektronen; die Van-der-Waals-Kräfte werden stärker.',
      wrong: [
        w('f1', 'Die Moleküle werden polarer.', 'chem-mis-zk-dipole-nonpolar', {
          detailed: "Halogenmoleküle bestehen aus zwei gleichen Atomen; sie haben keine polaren Bindungen und werden auch weiter unten in der Gruppe nicht polar.",
          short: "Zwei gleiche Atome: unpolar.",
        }),
        w('f2', 'Größere Moleküle haben schwächere Kräfte, brauchen aber mehr Wärme.', 'chem-mis-zk-size'),
        w('f3', 'Ab Brom bilden sich Wasserstoffbrücken.', 'chem-mis-zk-h-other'),
        w('f4', 'Die Bindung zwischen den Halogenatomen wird stärker und muss beim Sieden brechen.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Alle Halogene sind unpolar. Was ändert sich von oben nach unten in der Gruppe?',
      explanation: {
        detailed: 'Alle Halogenmoleküle sind unpolar; zwischen ihnen wirken nur Van-der-Waals-Kräfte. Nach unten werden die Atome größer und haben mehr Elektronen. Die Elektronen lassen sich leichter verschieben, die Kräfte werden stärker: Fluor und Chlor sind gasförmig, Brom flüssig, Iod fest.',
        short: 'Größer, mehr Elektronen: stärkere Van-der-Waals-Kräfte.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_GROESSE,
    }),
    v({
      id: 'zk-v-alkane',
      no: 202,
      fact: 'alkane-kette',
      part: 'siedepunkte',
      title: 'Siedepunkte',
      prompt: 'Wie ändert sich der Siedepunkt der Alkane mit der Länge der Kette?',
      correct: 'Er steigt, weil längere Ketten stärkere Van-der-Waals-Kräfte haben.',
      wrong: [
        w('f1', 'Er sinkt, weil längere Ketten schwerer zusammenzuhalten sind.', 'chem-mis-zk-size'),
        w('f2', 'Er bleibt gleich, weil alle Alkane unpolar sind.', 'chem-mis-zk-size', {
          detailed: 'Dass alle Alkane unpolar sind, heißt nur, dass bei allen dieselbe Art von Kraft wirkt. Wie stark sie ist, hängt von der Größe ab; längere Ketten berühren ihre Nachbarn auf größerer Fläche.',
          short: 'Gleiche Art, aber verschieden stark.',
        }),
        w('f3', 'Er steigt, weil lange Ketten Wasserstoffbrücken bilden.', 'chem-mis-zk-any-h'),
        w('f4', 'Er steigt, weil beim Sieden mehr $\\ce{C-C}$-Bindungen brechen müssen.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Methan ist ein Gas, Octan eine Flüssigkeit, lange Ketten sind wachsartig. Welche Kraft wird stärker?',
      explanation: {
        detailed: 'Alkane sind unpolar; zwischen ihnen wirken nur Van-der-Waals-Kräfte. Je länger die Kette, desto mehr Elektronen und desto größer die Berührungsfläche zu den Nachbarn. Die Kräfte und damit die Siedepunkte steigen.',
        short: 'Längere Kette, höherer Siedepunkt.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_GROESSE,
    }),
    v({
      id: 'zk-v-staerker-hoeher',
      no: 203,
      fact: 'kraft-siedepunkt',
      part: 'siedepunkte',
      title: 'Siedepunkte',
      prompt: 'Wie hängen die Kräfte zwischen den Molekülen und der Siedepunkt zusammen?',
      correct: 'Je stärker die Kräfte, desto höher der Siedepunkt.',
      wrong: [
        w('f1', 'Je stärker die Kräfte, desto niedriger der Siedepunkt.', 'chem-mis-zk-boil-weak', {
          detailed: "Beim Sieden müssen die Moleküle voneinander getrennt werden. Überlege, ob das bei starker Anziehung mehr oder weniger Energie braucht.",
          short: "Was kostet das Trennen bei starker Anziehung?",
        }),
        w('f2', 'Der Siedepunkt hängt nur von der Molmasse ab.', 'chem-mis-zk-mass-only'),
        w('f3', 'Der Siedepunkt hängt nur von der Stärke der Atombindungen ab.', 'chem-mis-zk-boil-breaks'),
        w('f4', 'Es gibt keinen Zusammenhang.', 'chem-mis-zk-boil-weak', {
          detailed: "Beim Sieden müssen die Moleküle voneinander getrennt werden. Überlege, ob das bei starker Anziehung mehr oder weniger Energie braucht.",
          short: "Was kostet das Trennen bei starker Anziehung?",
        }),
      ],
      hint: 'Beim Sieden werden die Moleküle voneinander getrennt. Was kostet das bei stärkeren Kräften?',
      explanation: {
        detailed: 'Beim Sieden müssen die Moleküle die Anziehung ihrer Nachbarn überwinden. Je stärker diese Kräfte sind, desto mehr Energie braucht man und desto höher liegt der Siedepunkt.',
        short: 'Stärkere Kräfte, höherer Siedepunkt.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_GROESSE,
    }),
    v({
      id: 'zk-v-ethanol-ether',
      no: 204,
      fact: 'ethanol-ether',
      part: 'siedepunkte',
      title: 'Siedepunkte',
      prompt: r`Ethanol $\ce{C2H5OH}$ und Dimethylether $\ce{CH3OCH3}$ haben dieselbe Summenformel. Welcher Stoff siedet höher?`,
      correct: 'Ethanol, weil es über seine OH-Gruppe Wasserstoffbrücken bildet',
      wrong: [
        w('f1', 'beide gleich, weil die Molmasse gleich ist', 'chem-mis-zk-mass-only'),
        w('f2', 'Dimethylether, weil auch er Sauerstoff enthält und Wasserstoffbrücken bildet', 'chem-mis-zk-any-h', {
          detailed: 'Im Dimethylether sitzen alle H-Atome an Kohlenstoff. Der Sauerstoff hat zwar freie Paare, aber kein H daran; untereinander bilden die Moleküle deshalb keine Wasserstoffbrücken.',
          short: 'Kein H am Sauerstoff.',
        }),
        w('f3', 'Dimethylether, weil seine Moleküle symmetrischer sind', 'chem-mis-zk-dipole-nonpolar'),
        w('f4', 'Ethanol, weil beim Sieden seine $\\ce{O-H}$-Bindung brechen muss', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Gleiche Molmasse: Die Art der Kraft entscheidet. Wo sitzt in jedem Molekül das H?',
      explanation: {
        detailed: 'Im Ethanol sitzt ein H am Sauerstoff; die Moleküle bilden Wasserstoffbrücken. Im Dimethylether sitzen alle H am Kohlenstoff; es bleiben Dipol-Dipol-Wechselwirkungen. Ethanol siedet bei 78 °C, Dimethylether schon bei etwa −24 °C.',
        short: 'Ethanol (Wasserstoffbrücken).',
      },
      cards: ['zmk-siedepunkte', 'zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    v({
      id: 'zk-v-edelgase',
      no: 205,
      fact: 'edelgase-siedepunkt',
      part: 'siedepunkte',
      title: 'Siedepunkte',
      prompt: 'Welches dieser Edelgase hat den höchsten Siedepunkt: Helium, Neon, Argon oder Xenon?',
      correct: 'Xenon',
      wrong: [
        w('f1', 'Helium', 'chem-mis-zk-size'),
        w('f2', 'Neon', 'chem-mis-zk-size'),
        w('f3', 'Alle gleich, weil zwischen Edelgasatomen keine Kräfte wirken', 'chem-mis-zk-vdw-some'),
        w('f4', 'Argon, weil es am häufigsten ist', 'chem-mis-zk-mass-only', {
          detailed: 'Wie häufig ein Stoff ist, hat mit seinem Siedepunkt nichts zu tun. Zwischen Edelgasatomen wirken nur Van-der-Waals-Kräfte; ihre Stärke hängt von der Größe der Atome ab.',
          short: 'Häufigkeit spielt keine Rolle.',
        }),
      ],
      hint: 'Zwischen Edelgasatomen wirken nur Van-der-Waals-Kräfte. Welche Atome sind am größten?',
      explanation: {
        detailed: 'Zwischen Edelgasatomen wirken nur Van-der-Waals-Kräfte. Sie werden mit der Größe der Atome und der Zahl der Elektronen stärker. Unter den Edelgasen hier ist Xenon am größten: Es siedet bei etwa −108 °C, Helium schon bei −269 °C.',
        short: 'Xenon, das größte Atom.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_VDW,
    }),
    v({
      id: 'zk-v-ccl4-kraft',
      no: 206,
      fact: 'kraft-ccl4',
      part: 'kraefte',
      title: 'Zwischenmolekulare Kräfte',
      prompt: r`Tetrachlormethan $\ce{CCl4}$ hat vier polare Bindungen. Welche Kräfte wirken zwischen seinen Molekülen?`,
      correct: 'nur Van-der-Waals-Kräfte, weil das Molekül als Ganzes unpolar ist',
      wrong: [
        w('f1', 'Dipol-Dipol-Wechselwirkungen, weil die Bindungen polar sind', 'chem-mis-zk-dipole-nonpolar'),
        w('f2', 'Wasserstoffbrücken, weil Chlor sehr elektronegativ ist', 'chem-mis-zk-h-other', {
          detailed: 'Wasserstoffbrücken brauchen ein H-Atom an N, O oder F. Tetrachlormethan hat gar keine H-Atome.',
          short: 'Kein H-Atom vorhanden.',
        }),
        w('f3', 'gar keine, weil es unpolar ist', 'chem-mis-zk-vdw-some'),
        w('f4', 'Ionenbindungen zwischen C und Cl', 'chem-mis-zk-stronger'),
      ],
      hint: 'Polare Bindungen allein machen kein polares Molekül. Wie ist es gebaut?',
      explanation: {
        detailed: 'Die vier $\\ce{C-Cl}$-Bindungen sind polar, liegen aber tetraedrisch und symmetrisch: Ihre Wirkungen heben sich auf, das Molekül ist unpolar. Zwischen den Molekülen wirken deshalb nur Van-der-Waals-Kräfte, die wegen der vielen Elektronen aber recht stark sind.',
        short: 'Nur Van-der-Waals-Kräfte.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_DIPOL,
    }),
    v({
      id: 'zk-v-bruecke-art',
      no: 207,
      fact: 'bruecke-art',
      part: 'kraefte',
      title: 'Wasserstoffbrücken',
      prompt: 'Was für eine Anziehung ist eine Wasserstoffbrücke?',
      correct: 'ein besonders starker Fall der Dipol-Dipol-Wechselwirkungen zwischen Molekülen',
      wrong: [
        w('f1', 'eine besonders starke Atombindung', 'chem-mis-zk-hbond-covalent', {
          detailed: "Bei einer Atombindung teilen sich zwei Atome ein Elektronenpaar. Bei einer Wasserstoffbrücke gehört das H-Atom weiter fest zu seinem eigenen Molekül.",
          short: "Kein gemeinsames Paar zwischen den Molekülen.",
        }),
        w('f2', 'eine Ionenbindung zwischen einem Proton und einem Anion', 'chem-mis-zk-stronger'),
        w('f3', 'eine Van-der-Waals-Kraft zwischen unpolaren Molekülen', 'chem-mis-zk-order'),
        w('f4', 'eine Bindung zwischen zwei H-Atomen', 'chem-mis-zk-any-h'),
      ],
      hint: 'Das H-Atom trägt eine positive Teilladung, das Nachbaratom eine negative.',
      explanation: {
        detailed: 'Ein H-Atom an N, O oder F trägt eine deutliche positive Teilladung, das freie Paar des Nachbarn eine negative. Ihre Anziehung ist eine besonders starke Dipol-Dipol-Wechselwirkung. Ein gemeinsames Elektronenpaar wie in einer Atombindung entsteht nicht.',
        short: 'Starker Sonderfall der Dipol-Dipol-Wechselwirkungen.',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    v({
      id: 'zk-v-partner',
      no: 208,
      fact: 'bruecke-partner',
      part: 'kraefte',
      title: 'Wasserstoffbrücken',
      prompt: 'Was braucht das Nachbarmolekül, damit sich eine Wasserstoffbrücke bilden kann?',
      correct: 'ein freies Elektronenpaar an einem N-, O- oder F-Atom',
      wrong: [
        w('f1', 'ein weiteres H-Atom, das an Kohlenstoff sitzt', 'chem-mis-zk-any-h'),
        w('f2', 'eine positive Ladung', 'chem-mis-zk-stronger'),
        w('f3', 'ein freies Elektronenpaar an einem Chlor- oder Schwefelatom', 'chem-mis-zk-h-other'),
        w('f4', 'nichts; Wasserstoffbrücken bilden sich nur zwischen gleichen Atomen', 'chem-mis-zk-water-only'),
      ],
      hint: 'Das H-Atom ist positiv geteilt geladen. Wovon wird es angezogen?',
      explanation: {
        detailed: 'Das positiv geteilt geladene H-Atom wird von einem freien Elektronenpaar angezogen. Dieses muss an einem kleinen, stark elektronegativen Atom sitzen: N, O oder F.',
        short: 'Freies Paar an N, O oder F.',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    v({
      id: 'zk-v-eis-gitter',
      no: 209,
      fact: 'eis-gitter',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Was passiert mit den Wasserstoffbrücken, wenn Wasser gefriert?',
      correct: 'Sie ordnen die Moleküle zu einem festen, weitmaschigen Gitter.',
      wrong: [
        w('f1', 'Sie brechen alle auf.', 'chem-mis-zk-water-normal', {
          detailed: "Beim Gefrieren werden die Teilchen langsamer und rücken an feste Plätze. Die Anziehung zwischen ihnen verschwindet dabei nicht, sie wirkt dauerhaft.",
          short: "Die Anziehung bleibt und wird dauerhaft.",
        }),
        w('f2', 'Sie werden zu Atombindungen.', 'chem-mis-zk-hbond-covalent'),
        w('f3', 'Sie ziehen die Moleküle dichter zusammen als im flüssigen Wasser.', 'chem-mis-zk-ice-sinks', {
          detailed: "Was schwimmt, ist weniger dicht als die Flüssigkeit darunter. Überlege, wie die Wasserstoffbrücken die Moleküle im Eis anordnen.",
          short: "Was schwimmt, ist weniger dicht.",
        }),
        w('f4', 'Sie werden durch Van-der-Waals-Kräfte ersetzt.', 'chem-mis-zk-order'),
      ],
      hint: 'Eis schwimmt. Was sagt das über den Platz, den die Moleküle im Eis brauchen?',
      explanation: {
        detailed: 'Beim Gefrieren rücken die Moleküle an feste Plätze, und jedes bildet Wasserstoffbrücken zu vier Nachbarn. Dabei entsteht ein geordnetes, weitmaschiges Gitter mit Lücken: Eis ist weniger dicht als flüssiges Wasser.',
        short: 'Festes, weitmaschiges Gitter.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    v({
      id: 'zk-v-see',
      no: 210,
      fact: 'see-winter',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Warum frieren tiefe Seen im Winter nicht bis zum Grund durch?',
      correct: 'Eis schwimmt oben, und am Grund sammelt sich das dichteste Wasser von etwa 4 °C.',
      wrong: [
        w('f1', 'Eis sinkt nach unten und wärmt dort das Wasser.', 'chem-mis-zk-ice-sinks'),
        w('f2', 'Am Grund ist das Wasser genau 0 °C, weil es dort am dichtesten ist.', 'chem-mis-zk-density-zero', {
          detailed: "Die größte Dichte liegt nicht am Gefrierpunkt: Schon beim Abkühlen kurz vor 0 °C beginnen die Wasserstoffbrücken, die Moleküle weitmaschiger anzuordnen.",
          short: "Nicht am Gefrierpunkt.",
        }),
        w('f3', 'Wasser kann gar nicht gefrieren, wenn es tief genug ist.', 'chem-mis-zk-water-normal'),
        w('f4', 'Am Grund zerfallen die Wassermoleküle und geben Wärme ab.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Welches Wasser sinkt nach unten, und wo bleibt das Eis?',
      explanation: {
        detailed: 'Wasser ist bei etwa 4 °C am dichtesten und sinkt zum Grund. Kälteres Wasser und Eis sind weniger dicht und bleiben oben. Die Eisschicht schützt das Wasser darunter vor weiterer Abkühlung.',
        short: 'Eis oben, 4 °C warmes Wasser unten.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    v({
      id: 'zk-v-gleiches',
      no: 211,
      fact: 'gleiches-loest',
      part: 'loesen',
      title: 'Löslichkeit',
      prompt: 'Welche Regel beschreibt, welche Stoffe sich miteinander mischen?',
      correct: 'Gleiches löst sich in Gleichem: polar in polar, unpolar in unpolar.',
      wrong: [
        w('f1', 'Gegensätze ziehen sich an: polar mischt sich am besten mit unpolar.', 'chem-mis-zk-opposites', {
          detailed: "Überlege, zwischen welchen Teilchen die Anziehung am stärksten ist: zwischen zwei polaren, zwei unpolaren oder einem polaren und einem unpolaren.",
          short: "Wo ist die Anziehung am stärksten?",
        }),
        w('f2', 'Alle Flüssigkeiten mischen sich, nur die Dichte entscheidet über die Schichten.', 'chem-mis-zk-oil-light'),
        w('f3', 'Nur Stoffe mit gleicher Molmasse mischen sich.', 'chem-mis-zk-mass-only', {
          detailed: "Für das Mischen zählt, wie gut sich die Teilchen gegenseitig anziehen; die Molmasse spielt dafür kaum eine Rolle.",
          short: "Es zählt die Anziehung, nicht die Masse.",
        }),
        w('f4', 'Nur Stoffe, die Wasserstoffbrücken bilden, lösen sich überhaupt.', 'chem-mis-zk-water-only'),
      ],
      hint: 'Zwischen welchen Teilchen sind die Kräfte am stärksten?',
      explanation: {
        detailed: 'Polare Teilchen ziehen sich untereinander stark an, unpolare untereinander auch. Zwischen polaren und unpolaren Teilchen sind die Kräfte schwach. Deshalb mischen sich gleichartige Stoffe, ungleiche bleiben unter sich.',
        short: 'Gleiches löst sich in Gleichem.',
      },
      cards: ['zmk-loesen'],
      ref: REF_LOESEN,
    }),
    v({
      id: 'zk-v-oel-wasser',
      no: 212,
      fact: 'oel-wasser',
      part: 'loesen',
      title: 'Löslichkeit',
      prompt: 'Warum mischen sich Öl und Wasser nicht?',
      correct: 'Wasser ist polar und hält über Wasserstoffbrücken zusammen; das unpolare Öl wird davon ausgeschlossen.',
      wrong: [
        w('f1', 'Weil Öl leichter ist als Wasser.', 'chem-mis-zk-oil-light', {
          detailed: "Die Dichte sagt nur, welche Schicht oben liegt. Warum sich überhaupt zwei Schichten bilden, müssen die Kräfte zwischen den Teilchen erklären.",
          short: "Die Dichte erklärt nur die Lage der Schichten.",
        }),
        w('f2', 'Weil Öl und Wasser sich chemisch abstoßen, wie gleiche Ladungen.', 'chem-mis-zk-opposites'),
        w('f3', 'Weil Öl keine Van-der-Waals-Kräfte hat.', 'chem-mis-zk-vdw-some'),
        w('f4', 'Weil Wasser und Öl beide unpolar sind.', 'chem-mis-zk-dipole-nonpolar'),
      ],
      hint: 'Welche Kräfte gewinnt oder verliert ein Wassermolekül, wenn es neben ein Ölmolekül rückt?',
      explanation: {
        detailed: 'Wassermoleküle ziehen sich über Wasserstoffbrücken stark an. Ein unpolares Ölmolekül kann diese Kräfte nicht ersetzen. Die Wassermoleküle bleiben deshalb lieber unter sich, und es bilden sich zwei Schichten.',
        short: 'Polar und unpolar bleiben unter sich.',
      },
      cards: ['zmk-loesen'],
      ref: REF_LOESEN,
    }),
    v({
      id: 'zk-v-iod',
      no: 213,
      fact: 'iod-loesen',
      part: 'loesen',
      title: 'Löslichkeit',
      prompt: r`Worin löst sich Iod $\ce{I2}$ besser?`,
      correct: 'in Hexan, weil Iod und Hexan unpolar sind',
      wrong: [
        w('f1', 'in Wasser, weil sich Gegensätze anziehen', 'chem-mis-zk-opposites'),
        w('f2', 'in Wasser, weil Iod Wasserstoffbrücken bildet', 'chem-mis-zk-h-other'),
        w('f3', 'in beiden gleich gut', 'chem-mis-zk-opposites'),
        w('f4', 'in Wasser, weil Iod schwerer ist', 'chem-mis-zk-oil-light'),
      ],
      hint: 'Ist Iod polar oder unpolar?',
      explanation: {
        detailed: 'Iod besteht aus unpolaren Molekülen aus zwei gleichen Atomen. Es mischt sich mit dem unpolaren Hexan; in Wasser löst es sich nur sehr wenig.',
        short: 'In Hexan: beide unpolar.',
      },
      cards: ['zmk-loesen'],
      ref: REF_LOESEN,
    }),
    v({
      id: 'zk-v-hf',
      no: 214,
      fact: 'kraft-hf',
      part: 'kraefte',
      title: 'Stärkste Art der Kraft',
      prompt: r`Welche ist die stärkste Art von Kraft zwischen Fluorwasserstoffmolekülen $\ce{HF}$?`,
      correct: 'Wasserstoffbrückenbindungen',
      wrong: [
        w('f1', 'Dipol-Dipol-Wechselwirkungen wie bei Chlorwasserstoff', 'chem-mis-zk-water-only', {
          detailed: "Wasserstoffbrücken hängen nicht am Stoff Wasser, sondern daran, woran das H-Atom sitzt.",
          short: "Woran sitzt das H-Atom?",
        }),
        w('f2', 'nur Van-der-Waals-Kräfte', 'chem-mis-zk-vdw-some'),
        w('f3', 'Ionenbindungen', 'chem-mis-zk-stronger'),
        w('f4', 'die Atombindung zwischen H und F', 'chem-mis-zk-intra'),
      ],
      hint: 'Woran sitzt das H-Atom, und hat dieses Atom freie Paare?',
      explanation: {
        detailed: 'Im Fluorwasserstoff sitzt das H direkt am Fluor, dem elektronegativsten Element, und Fluor hat drei freie Paare. Zwischen den Molekülen bilden sich starke Wasserstoffbrücken; Fluorwasserstoff siedet deshalb viel höher als Chlorwasserstoff.',
        short: 'Wasserstoffbrücken (H an F).',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    v({
      id: 'zk-v-sieden-was',
      no: 215,
      fact: 'sieden-was',
      part: 'siedepunkte',
      title: 'Sieden',
      prompt: 'Was ist Wasserdampf auf der Ebene der Teilchen?',
      correct: 'dieselben Wassermoleküle wie im flüssigen Wasser, nur weit voneinander entfernt',
      wrong: [
        w('f1', 'einzelne Wasserstoff- und Sauerstoffatome', 'chem-mis-zk-boil-breaks', {
          detailed: "Kondensiert Dampf, entsteht wieder Wasser mit allen seinen Eigenschaften. Das ginge nicht, wenn die Moleküle beim Sieden zerfallen wären.",
          short: "Kondensiert Dampf, entsteht wieder Wasser.",
        }),
        w('f2', 'ein Gemisch aus Wasserstoff und Sauerstoff', 'chem-mis-zk-boil-breaks', {
          detailed: "Kondensiert Dampf, entsteht wieder Wasser mit allen seinen Eigenschaften. Das ginge nicht, wenn die Moleküle beim Sieden zerfallen wären.",
          short: "Kondensiert Dampf, entsteht wieder Wasser.",
        }),
        w('f3', 'Luft, in der etwas Wasser gelöst ist, aber keine Wassermoleküle', 'chem-mis-zk-boil-breaks', {
          detailed: "Kondensiert Dampf, entsteht wieder Wasser mit allen seinen Eigenschaften. Das ginge nicht, wenn die Moleküle beim Sieden zerfallen wären.",
          short: "Kondensiert Dampf, entsteht wieder Wasser.",
        }),
        w('f4', 'Wassermoleküle, die über Atombindungen zu großen Ketten verbunden sind', 'chem-mis-zk-hbond-covalent'),
      ],
      hint: 'Kondensiert Dampf, entsteht wieder Wasser. Was muss der Dampf also enthalten?',
      explanation: {
        detailed: 'Beim Sieden werden nur die Kräfte zwischen den Molekülen überwunden. Die Moleküle selbst bleiben ganz. Im Dampf sind es dieselben Wassermoleküle, nur so weit voneinander entfernt, dass sie sich kaum noch anziehen.',
        short: 'Dieselben Moleküle, weit auseinander.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_UEBERSICHT,
    }),

    // ---------------------------------------------------------------- Stufe 3: Klausurniveau
    k({
      id: 'zk-k-argon',
      no: 316,
      fact: 'argon-kraefte',
      part: 'kraefte',
      title: 'Van-der-Waals-Kräfte',
      prompt: 'Argon wird bei etwa −186 °C flüssig. Welche Aussage über flüssiges Argon stimmt?',
      correct: 'Die Atome halten über Van-der-Waals-Kräfte zusammen, die durch kurzzeitige Dipole entstehen.',
      wrong: [
        w('f1', 'Die Atome halten über Wasserstoffbrücken zusammen.', 'chem-mis-zk-h-other', {
          detailed: 'Wasserstoffbrücken brauchen ein H-Atom an N, O oder F. Argon hat weder Wasserstoff noch einen solchen Partner.',
          short: 'Kein H-Atom vorhanden.',
        }),
        w('f2', 'Zwischen den Atomen wirken keine Kräfte, weil Argon unpolar ist.', 'chem-mis-zk-vdw-some', {
          detailed: 'Ohne jede Anziehung könnte Argon gar nicht flüssig werden; die Atome würden auseinanderfliegen. Auch zwischen unpolaren Teilchen muss also eine Kraft wirken.',
          short: 'Ohne Anziehung keine Flüssigkeit.',
        }),
        w('f3', r`Je zwei Atome sind über eine Atombindung zu $\ce{Ar2}$ verbunden.`, 'chem-mis-zk-intra', {
          detailed: 'Edelgasatome haben eine volle Außenschale und gehen keine Atombindungen ein. Flüssiges Argon besteht aus einzelnen Atomen.',
          short: 'Edelgase bilden keine Atombindungen.',
        }),
        w('f4', 'Die Atome ziehen sich über Dipol-Dipol-Wechselwirkungen zwischen dauerhaften Dipolen an.', 'chem-mis-zk-dipole-nonpolar', {
          detailed: 'Ein einzelnes Argonatom hat keine dauerhafte positive und negative Seite. Dauerhafte Dipole gibt es nur bei polaren Molekülen.',
          short: 'Argonatome sind keine dauerhaften Dipole.',
        }),
      ],
      hint: 'Argon besteht aus einzelnen, unpolaren Atomen ohne Wasserstoff. Welche Kraft bleibt dann noch?',
      explanation: {
        detailed: 'Zwischen Argonatomen wirken nur Van-der-Waals-Kräfte: Kurzzeitig ungleich verteilte Elektronen rufen im Nachbaratom einen Dipol hervor. Diese Kräfte sind schwach; deshalb wird Argon erst bei sehr tiefer Temperatur flüssig.',
        short: 'Van-der-Waals-Kräfte.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_VDW,
    }),
    k({
      id: 'zk-k-falsch',
      no: 302,
      fact: 'aussage-falsch',
      part: 'kraefte',
      title: 'Zwischenmolekulare Kräfte',
      prompt: 'Welche Aussage ist falsch?',
      correct: 'Zwischen Molekülen von Dimethylether bilden sich Wasserstoffbrücken, weil sie Sauerstoff enthalten.',
      wrong: [
        w('f1', 'Ammoniakmoleküle bilden untereinander Wasserstoffbrücken.', 'chem-mis-zk-water-only', {
          detailed: 'Diese Aussage stimmt: Im Ammoniak sitzt H direkt am Stickstoff, der ein freies Paar hat. Gesucht ist die falsche Aussage.',
          short: 'Diese Aussage stimmt.',
        }),
        w('f2', 'Tetrachlormethan ist trotz polarer Bindungen ein unpolares Molekül.', 'chem-mis-zk-dipole-nonpolar', {
          detailed: 'Diese Aussage stimmt: Die vier Bindungen liegen symmetrisch und heben sich auf. Gesucht ist die falsche Aussage.',
          short: 'Diese Aussage stimmt.',
        }),
        w('f3', 'Iod siedet höher als Chlor, weil seine Moleküle größer sind.', 'chem-mis-zk-size', {
          detailed: 'Diese Aussage stimmt: Größere Moleküle haben stärkere Van-der-Waals-Kräfte. Gesucht ist die falsche Aussage.',
          short: 'Diese Aussage stimmt.',
        }),
        w('f4', 'Wasserstoffbrücken sind schwächer als Atombindungen.', 'chem-mis-zk-hbond-covalent', {
          detailed: 'Diese Aussage stimmt: Auch die stärkste zwischenmolekulare Kraft ist viel schwächer als eine Atombindung. Gesucht ist die falsche Aussage.',
          short: 'Diese Aussage stimmt.',
        }),
      ],
      hint: 'Gesucht ist die falsche Aussage. Prüfe bei jeder, ob die Bedingung für die genannte Kraft erfüllt ist.',
      explanation: {
        detailed: 'Im Dimethylether sitzen alle H-Atome an Kohlenstoff, keines am Sauerstoff. Untereinander bilden die Moleküle deshalb keine Wasserstoffbrücken, nur Dipol-Dipol-Wechselwirkungen und Van-der-Waals-Kräfte. Die übrigen Aussagen stimmen.',
        short: 'Dimethylether bildet untereinander keine Wasserstoffbrücken.',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    k({
      id: 'zk-k-hydride',
      no: 303,
      fact: 'hydride-gruppe-17',
      part: 'siedepunkte',
      title: 'Siedepunkte begründen',
      prompt: r`Warum siedet Fluorwasserstoff $\ce{HF}$ (20 °C) viel höher als Chlorwasserstoff $\ce{HCl}$ (−85 °C), obwohl er kleiner ist?`,
      correct: 'Fluorwasserstoff bildet Wasserstoffbrücken; Chlorwasserstoff nur Dipol-Dipol-Wechselwirkungen.',
      wrong: [
        w('f1', 'Fluorwasserstoff ist das schwerere Molekül.', 'chem-mis-zk-mass-only'),
        w('f2', 'Kleinere Moleküle haben immer stärkere Van-der-Waals-Kräfte.', 'chem-mis-zk-size'),
        w('f3', 'Beim Sieden von Fluorwasserstoff muss die sehr starke $\\ce{H-F}$-Bindung brechen.', 'chem-mis-zk-boil-breaks'),
        w('f4', 'Beide bilden gleich starke Wasserstoffbrücken; der Unterschied ist Zufall.', 'chem-mis-zk-h-other'),
      ],
      hint: 'Erst die Art der Kraft vergleichen, dann die Größe.',
      explanation: {
        detailed: 'Nur im Fluorwasserstoff sitzt das H an F; es bilden sich Wasserstoffbrücken. Chlor ist dafür zu groß und zu wenig elektronegativ. Die Wasserstoffbrücken übertreffen den Größenvorteil des Chlorwasserstoffs bei weitem.',
        short: 'Wasserstoffbrücken nur bei HF.',
      },
      cards: ['zmk-siedepunkte', 'zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    k({
      id: 'zk-k-alkohole',
      no: 304,
      fact: 'alkohole-reihe',
      part: 'siedepunkte',
      title: 'Siedepunkte begründen',
      prompt: r`Methanol, Ethanol und Propan-1-ol bilden alle Wasserstoffbrücken. Warum siedet Propan-1-ol $\ce{C3H7OH}$ am höchsten?`,
      correct: 'Bei gleicher Art der Kraft entscheidet die Größe: Die längere Kette verstärkt die Van-der-Waals-Kräfte.',
      wrong: [
        w('f1', 'Propan-1-ol bildet mehr Wasserstoffbrücken, weil es mehr H-Atome hat.', 'chem-mis-zk-any-h'),
        w('f2', 'Längere Ketten machen die Van-der-Waals-Kräfte schwächer.', 'chem-mis-zk-size'),
        w('f3', 'Bei Propan-1-ol müssen mehr $\\ce{C-C}$-Bindungen beim Sieden brechen.', 'chem-mis-zk-boil-breaks'),
        w('f4', 'Propan-1-ol ist kein Alkohol und bildet Dipol-Dipol-Wechselwirkungen.', 'chem-mis-zk-order'),
      ],
      hint: 'Jedes dieser Moleküle hat genau eine OH-Gruppe. Was unterscheidet sie dann?',
      explanation: {
        detailed: 'Alle drei haben genau eine OH-Gruppe und bilden ähnlich viele Wasserstoffbrücken. Der Unterschied liegt in der Kette: Längere Ketten haben mehr Elektronen und mehr Berührungsfläche, die Van-der-Waals-Kräfte kommen dazu. Methanol siedet bei 65 °C, Ethanol bei 78 °C, Propan-1-ol bei 97 °C.',
        short: 'Gleiche Art der Kraft: Die Größe entscheidet.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_GROESSE,
    }),
    k({
      id: 'zk-k-ordnen',
      no: 305,
      fact: 'ordnen-gleiche-masse',
      part: 'siedepunkte',
      title: 'Siedepunkte ordnen',
      prompt: r`Ordne Butan $\ce{C4H10}$, Aceton $\ce{CH3COCH3}$ (polare $\ce{C=O}$-Gruppe, alle H am C) und Propan-1-ol $\ce{C3H7OH}$ (alle etwa 58 bis 60 g/mol) nach steigendem Siedepunkt.`,
      correct: r`$\ce{C4H10} < \ce{CH3COCH3} < \ce{C3H7OH}$`,
      wrong: [
        w('f1', r`$\ce{C3H7OH} < \ce{CH3COCH3} < \ce{C4H10}$`, 'chem-mis-zk-boil-weak'),
        w('f2', r`$\ce{C4H10} < \ce{C3H7OH} < \ce{CH3COCH3}$`, 'chem-mis-zk-order'),
        w('f3', r`$\ce{CH3COCH3} < \ce{C4H10} < \ce{C3H7OH}$`, 'chem-mis-zk-dipole-nonpolar', {
          detailed: "Prüfe, welcher der beiden Stoffe ein Dipol ist. Bei ähnlicher Molmasse siedet ein unpolarer Stoff nicht höher als ein polarer.",
          short: "Wer ist der Dipol?",
        }),
        w('f4', 'Alle sieden gleich, weil die Molmassen gleich sind.', 'chem-mis-zk-mass-only'),
      ],
      hint: 'Bei gleicher Molmasse entscheidet die Art der stärksten Kraft. Welcher Stoff ist unpolar, welcher polar, welcher bildet Wasserstoffbrücken?',
      explanation: {
        detailed: 'Butan ist unpolar (Van-der-Waals-Kräfte), Aceton polar ohne H an O (Dipol-Dipol-Wechselwirkungen), Propan-1-ol bildet Wasserstoffbrücken. Bei ähnlicher Molmasse ergibt das die Reihenfolge; die Siedepunkte sind etwa −1 °C, 56 °C und 97 °C.',
        short: 'Van der Waals < Dipol-Dipol < Wasserstoffbrücken.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_UEBERSICHT,
    }),
    k({
      id: 'zk-k-chlormethane',
      no: 306,
      fact: 'chlormethane',
      part: 'siedepunkte',
      title: 'Siedepunkte begründen',
      prompt: r`Tetrachlormethan $\ce{CCl4}$ ist unpolar und siedet trotzdem höher (77 °C) als das polare Chlormethan $\ce{CH3Cl}$ (−24 °C). Wie passt das zusammen?`,
      correct: 'Das große Molekül mit vielen Elektronen hat so starke Van-der-Waals-Kräfte, dass sie die Dipol-Dipol-Wechselwirkungen des kleinen übertreffen.',
      wrong: [
        w('f1', 'Tetrachlormethan bildet Wasserstoffbrücken.', 'chem-mis-zk-h-other'),
        w('f2', 'Tetrachlormethan ist in Wirklichkeit polar.', 'chem-mis-zk-dipole-nonpolar'),
        w('f3', 'Das passt nicht; die Siedepunkte müssen falsch sein, denn polare Stoffe sieden immer höher.', 'chem-mis-zk-order'),
        w('f4', 'Bei Tetrachlormethan müssen beim Sieden vier $\\ce{C-Cl}$-Bindungen brechen.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Die Reihenfolge der Kräfte gilt bei ähnlich großen Molekülen. Wie groß sind die beiden Moleküle?',
      explanation: {
        detailed: 'Die Reihenfolge Van der Waals < Dipol-Dipol gilt für ähnlich große Moleküle. Tetrachlormethan (154 g/mol) ist dreimal so schwer wie Chlormethan (50,5 g/mol) und hat viel mehr Elektronen. Seine Van-der-Waals-Kräfte werden dadurch stärker als die Dipol-Dipol-Wechselwirkungen des kleinen Chlormethans.',
        short: 'Viel größer: starke Van-der-Waals-Kräfte.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_GROESSE,
    }),
    k({
      id: 'zk-k-wasser-ohne',
      no: 307,
      fact: 'wasser-ohne-bruecken',
      part: 'wasser',
      title: 'Wasser',
      prompt: 'Was wäre Wasser bei Raumtemperatur, wenn es keine Wasserstoffbrücken bilden könnte?',
      correct: 'ein Gas, wie andere kleine Moleküle',
      wrong: [
        w('f1', 'genauso flüssig wie heute', 'chem-mis-zk-water-normal', {
          detailed: "Überlege, welche Kräfte dem Wasser ohne Wasserstoffbrücken noch blieben und wie stark sie bei einem so kleinen Molekül sind.",
          short: "Was bliebe ohne die Brücken?",
        }),
        w('f2', 'ein harter Feststoff', 'chem-mis-zk-order'),
        w('f3', 'ein Gemisch aus Wasserstoff und Sauerstoff', 'chem-mis-zk-boil-breaks'),
        w('f4', 'flüssig, weil es schwerer als Luft ist', 'chem-mis-zk-mass-only'),
      ],
      hint: 'Vergleiche mit Schwefelwasserstoff, der ähnlich gebaut ist, aber keine Wasserstoffbrücken bildet.',
      explanation: {
        detailed: 'Ohne Wasserstoffbrücken blieben Wasser nur schwache Dipol-Dipol-Wechselwirkungen und Van-der-Waals-Kräfte. Nach dem Trend der Gruppe läge sein Siedepunkt weit unter 0 °C; Wasser wäre bei Raumtemperatur ein Gas. Erst die Wasserstoffbrücken machen es flüssig.',
        short: 'Ein Gas.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    k({
      id: 'zk-k-dna',
      no: 308,
      fact: 'bruecken-biologie',
      part: 'wasser',
      title: 'Wasserstoffbrücken',
      prompt: 'Wo spielen Wasserstoffbrücken außerhalb des Wassers eine wichtige Rolle?',
      correct: 'beim Zusammenhalt der beiden Stränge der DNA und bei der Faltung von Eiweißen',
      wrong: [
        w('f1', 'nirgends; es gibt sie nur in Wasser', 'chem-mis-zk-water-only', {
          detailed: "Wasserstoffbrücken hängen nicht am Stoff Wasser, sondern daran, woran das H-Atom sitzt.",
          short: "Woran sitzt das H-Atom?",
        }),
        w('f2', 'beim Zusammenhalt von Kochsalzkristallen', 'chem-mis-zk-stronger'),
        w('f3', 'in Methan und anderen Alkanen', 'chem-mis-zk-any-h'),
        w('f4', 'bei der Leitfähigkeit von Metallen', 'chem-mis-zk-intra'),
      ],
      hint: 'Wo gibt es in Biomolekülen H-Atome an N oder O?',
      explanation: {
        detailed: 'In der DNA stehen sich $\\ce{N-H}$- und O-Gruppen der Basen gegenüber und bilden Wasserstoffbrücken; sie halten die beiden Stränge zusammen, lassen sich aber wieder trennen. Auch Eiweiße falten sich über Wasserstoffbrücken in ihre Form.',
        short: 'DNA und Eiweiße.',
      },
      cards: ['zmk-wasserstoffbruecken'],
      ref: REF_BRUECKEN,
    }),
    k({
      id: 'zk-k-methanol-octan',
      no: 317,
      fact: 'methanol-octan',
      part: 'loesen',
      title: 'Mischbarkeit',
      prompt: r`Methanol $\ce{CH3OH}$ mischt sich mit Wasser, Octan $\ce{C8H18}$ nicht. Welcher Teil des Methanols macht den Unterschied?`,
      correct: 'die OH-Gruppe, über die Methanol mit Wasser Wasserstoffbrücken eingeht',
      wrong: [
        w('f1', 'die H-Atome am Kohlenstoff', 'chem-mis-zk-any-h', {
          detailed: 'H-Atome am Kohlenstoff hat Octan auch, sogar viel mehr. Sie können also nicht den Unterschied machen.',
          short: 'Die hat Octan auch.',
        }),
        w('f2', 'die kleinere Molmasse', 'chem-mis-zk-mass-only', {
          detailed: 'Für das Mischen zählt, wie gut sich die Teilchen gegenseitig anziehen; die Molmasse spielt dafür kaum eine Rolle.',
          short: 'Es zählt die Anziehung, nicht die Masse.',
        }),
        w('f3', 'die geringere Dichte', 'chem-mis-zk-oil-light', {
          detailed: 'Die Dichte sagt nur, welche Schicht oben liegt, wenn sich zwei Flüssigkeiten nicht mischen. Ob sie sich mischen, entscheiden die Kräfte zwischen den Teilchen.',
          short: 'Die Dichte entscheidet nicht über das Mischen.',
        }),
        w('f4', r`die $\ce{C-O}$-Bindung, die im Wasser aufbricht`, 'chem-mis-zk-intra', {
          detailed: 'Beim Lösen bleiben die Moleküle ganz; es ändern sich nur die Kräfte zwischen ihnen. Gelöstes Methanol lässt sich unverändert zurückgewinnen.',
          short: 'Beim Lösen bleiben die Moleküle ganz.',
        }),
      ],
      hint: 'Welcher Teil des Methanols ähnelt dem Wasser, und welchen hat Octan nicht?',
      explanation: {
        detailed: 'Methanol hat eine OH-Gruppe: Sein H sitzt am Sauerstoff, und es kann mit Wassermolekülen Wasserstoffbrücken bilden. Octan besteht nur aus C und H und ist unpolar. Gleiches löst sich in Gleichem.',
        short: 'Die OH-Gruppe.',
      },
      cards: ['zmk-loesen'],
      ref: REF_LOESEN,
    }),
    k({
      id: 'zk-k-lange-alkohole',
      no: 310,
      fact: 'alkohol-kettenlaenge',
      part: 'loesen',
      title: 'Mischbarkeit',
      prompt: 'Methanol mischt sich gut mit Wasser, Alkohole mit langer Kohlenstoffkette kaum noch. Warum?',
      correct: 'Die lange, unpolare Kette überwiegt; die eine OH-Gruppe reicht nicht mehr für die Mischung mit Wasser.',
      wrong: [
        w('f1', 'Lange Alkohole haben keine OH-Gruppe mehr.', 'chem-mis-zk-water-only', {
          detailed: "Ein Alkohol hat immer eine OH-Gruppe, egal wie lang seine Kette ist. Überlege, was sich mit der Kette am Verhältnis von polarem und unpolarem Teil ändert.",
          short: "Die OH-Gruppe bleibt.",
        }),
        w('f2', 'Lange Ketten bilden mehr Wasserstoffbrücken mit Wasser.', 'chem-mis-zk-any-h'),
        w('f3', 'Lange Alkohole sind schwerer und sinken einfach ab.', 'chem-mis-zk-oil-light'),
        w('f4', 'Lange Ketten sind polarer als kurze.', 'chem-mis-zk-dipole-nonpolar', {
          detailed: "Ketten aus C- und H-Atomen sind unpolar; eine längere Kette fügt keinen polaren Teil hinzu.",
          short: "Die Kette selbst ist unpolar.",
        }),
      ],
      hint: 'Welcher Teil des Moleküls wird mit der Kette größer: der polare oder der unpolare?',
      explanation: {
        detailed: 'Jeder dieser Alkohole hat nur eine OH-Gruppe. Mit wachsender Kette wird der unpolare Teil immer größer. Er stört die Wasserstoffbrücken des Wassers, und der Alkohol verhält sich mehr wie ein unpolarer Stoff: Er mischt sich kaum noch mit Wasser, dafür besser mit Hexan.',
        short: 'Der unpolare Teil überwiegt.',
      },
      cards: ['zmk-loesen'],
      ref: REF_LOESEN,
    }),
    k({
      id: 'zk-k-extraktion',
      no: 311,
      fact: 'extraktion',
      part: 'loesen',
      title: 'Anwendung',
      prompt: 'Iod soll aus einer wässrigen Lösung herausgeholt werden. Was eignet sich?',
      correct: 'Mit Hexan ausschütteln: Iod geht in die unpolare Hexanschicht über.',
      wrong: [
        w('f1', 'Mehr Wasser zugeben, damit sich Iod besser löst.', 'chem-mis-zk-opposites'),
        w('f2', 'Ethanol zugeben, damit sich zwei Schichten bilden.', 'chem-mis-zk-oil-light', {
          detailed: 'Ethanol mischt sich in jedem Verhältnis mit Wasser; es bildet keine eigene Schicht. Zum Ausschütteln braucht man ein Lösemittel, das sich nicht mit Wasser mischt.',
          short: 'Ethanol bildet mit Wasser keine zweite Schicht.',
        }),
        w('f3', 'Die Lösung kochen, bis die Iodmoleküle in Atome zerfallen.', 'chem-mis-zk-boil-breaks', {
          detailed: "Beim Kochen zerfallen Moleküle nicht; dafür reicht die Energie bei weitem nicht. Das Iod bliebe außerdem in der Lösung.",
          short: "Kochen zerlegt keine Moleküle.",
        }),
        w('f4', 'Salz zugeben, damit Iod Wasserstoffbrücken bildet.', 'chem-mis-zk-h-other'),
      ],
      hint: 'Iod ist unpolar. In welchem Lösemittel fühlt es sich wohler, und mischt sich dieses mit Wasser?',
      explanation: {
        detailed: 'Iod löst sich in unpolarem Hexan viel besser als in Wasser, und Hexan mischt sich nicht mit Wasser. Schüttelt man beides, wandert das Iod in die Hexanschicht, die man abtrennen kann. So arbeitet eine Extraktion.',
        short: 'Ausschütteln mit Hexan.',
      },
      cards: ['zmk-loesen'],
      ref: REF_TRENNEN,
    }),
    k({
      id: 'zk-k-groesse-gegen-dipol',
      no: 312,
      fact: 'brom-vs-hcl',
      part: 'siedepunkte',
      title: 'Siedepunkte begründen',
      prompt: r`Brom $\ce{Br2}$ (unpolar, 160 g/mol) siedet bei 59 °C, Chlorwasserstoff $\ce{HCl}$ (polar, 36,5 g/mol) bei −85 °C. Was folgt daraus?`,
      correct: 'Bei sehr verschieden großen Molekülen können Van-der-Waals-Kräfte stärker sein als Dipol-Dipol-Wechselwirkungen.',
      wrong: [
        w('f1', 'Brom muss polar sein.', 'chem-mis-zk-dipole-nonpolar', {
          detailed: "Halogenmoleküle bestehen aus zwei gleichen Atomen; sie haben keine polaren Bindungen und werden auch weiter unten in der Gruppe nicht polar.",
          short: "Zwei gleiche Atome: unpolar.",
        }),
        w('f2', 'Polare Stoffe sieden immer niedriger als unpolare.', 'chem-mis-zk-order'),
        w('f3', 'Brom bildet Wasserstoffbrücken.', 'chem-mis-zk-h-other'),
        w('f4', 'Beim Sieden von Brom muss die $\\ce{Br-Br}$-Bindung brechen.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Die Reihenfolge der Kräfte gilt für ähnlich große Moleküle. Sind diese beiden ähnlich groß?',
      explanation: {
        detailed: 'Brom ist mehr als viermal so schwer und hat viel mehr Elektronen. Seine Van-der-Waals-Kräfte werden so stark, dass sie die Dipol-Dipol-Wechselwirkungen des kleinen Chlorwasserstoffs übertreffen. Die Reihenfolge der Kräfte gilt nur bei ähnlicher Größe.',
        short: 'Große unpolare Moleküle können höher sieden als kleine polare.',
      },
      cards: ['zmk-siedepunkte'],
      ref: REF_GROESSE,
    }),
    k({
      id: 'zk-k-gecko',
      no: 313,
      fact: 'gecko',
      part: 'kraefte',
      title: 'Van-der-Waals-Kräfte',
      prompt: 'Geckos haften an glatten Wänden mit Millionen feiner Härchen an den Füßen. Welche Kraft nutzen sie, und warum helfen die Härchen?',
      correct: 'Van-der-Waals-Kräfte; die Härchen vergrößern die Berührungsfläche enorm',
      wrong: [
        w('f1', 'Wasserstoffbrücken, weil die Wand nass sein muss', 'chem-mis-zk-water-only', {
          detailed: "Geckos haften auch an trockenem Glas. Die Kraft muss also zwischen trockenen Oberflächen wirken.",
          short: "Es geht auch trocken.",
        }),
        w('f2', 'Ionenbindungen zwischen Fuß und Wand', 'chem-mis-zk-stronger'),
        w('f3', 'Atombindungen, die der Gecko beim Laufen knüpft und löst', 'chem-mis-zk-intra'),
        w('f4', 'Van-der-Waals-Kräfte, die mit kleinerer Berührungsfläche stärker werden', 'chem-mis-zk-size'),
      ],
      hint: 'Welche Kraft wirkt zwischen allen Oberflächen, und wovon hängt ihre Stärke ab?',
      explanation: {
        detailed: 'Zwischen allen Oberflächen wirken Van-der-Waals-Kräfte, aber nur auf sehr kurze Entfernung. Die vielen feinen Härchen schmiegen sich an jede Unebenheit an und machen die Berührungsfläche riesig. Die vielen kleinen Kräfte addieren sich und tragen das Tier.',
        short: 'Van-der-Waals-Kräfte auf großer Fläche.',
      },
      cards: ['zmk-kraefte'],
      ref: 'Skript Zwischenmolekulare Kräfte, Folie 8',
    }),
    k({
      id: 'zk-k-schmelzen-salz',
      no: 314,
      fact: 'salz-vs-molekuel',
      part: 'kraefte',
      title: 'Vergleich',
      prompt: r`Warum schmilzt Kochsalz $\ce{NaCl}$ erst bei etwa 800 °C, Eis aber schon bei 0 °C?`,
      correct: 'Im Salz muss die starke Ionenbindung überwunden werden, im Eis nur Wasserstoffbrücken zwischen Molekülen.',
      wrong: [
        w('f1', 'Im Eis wirken stärkere Kräfte als im Salz.', 'chem-mis-zk-stronger'),
        w('f2', 'Beim Schmelzen von Eis brechen die $\\ce{O-H}$-Bindungen, beim Salz nicht.', 'chem-mis-zk-boil-breaks'),
        w('f3', 'Kochsalz bildet stärkere Wasserstoffbrücken als Wasser.', 'chem-mis-zk-h-other'),
        w('f4', 'Salz ist schwerer, das allein erklärt es.', 'chem-mis-zk-mass-only'),
      ],
      hint: 'Was hält ein Salz zusammen, was die Moleküle im Eis?',
      explanation: {
        detailed: 'Ein Salzkristall besteht aus Ionen, die die starke Ionenbindung zusammenhält. Eis besteht aus Molekülen; beim Schmelzen werden nur Wasserstoffbrücken zwischen ihnen gelöst. Zwischenmolekulare Kräfte sind viel schwächer als Ionenbindungen.',
        short: 'Ionenbindung gegen zwischenmolekulare Kräfte.',
      },
      cards: ['zmk-kraefte'],
      ref: REF_UEBERSICHT,
    }),
    k({
      id: 'zk-k-aceton-loesen',
      no: 315,
      fact: 'dichlormethan-wasser',
      part: 'loesen',
      title: 'Mischbarkeit',
      prompt: r`Welcher Stoff mischt sich am besten mit Wasser?`,
      correct: r`Methanol $\ce{CH3OH}$`,
      wrong: [
        w('f1', r`Octan $\ce{C8H18}$`, 'chem-mis-zk-opposites'),
        w('f2', r`Tetrachlormethan $\ce{CCl4}$, weil seine Bindungen polar sind`, 'chem-mis-zk-dipole-nonpolar'),
        w('f3', r`Iod $\ce{I2}$, weil es schwerer als Wasser ist`, 'chem-mis-zk-oil-light'),
        w('f4', r`Methan $\ce{CH4}$, weil es H-Atome hat`, 'chem-mis-zk-any-h'),
      ],
      hint: 'Welcher Stoff kann mit Wasser Wasserstoffbrücken bilden?',
      explanation: {
        detailed: 'Methanol hat eine OH-Gruppe und nur ein C-Atom; es bildet mit Wasser Wasserstoffbrücken und mischt sich in jedem Verhältnis. Octan, Tetrachlormethan, Iod und Methan sind unpolar.',
        short: 'Methanol (Wasserstoffbrücken mit Wasser).',
      },
      cards: ['zmk-loesen'],
      ref: REF_LOESEN,
    }),
    // ---- Wähle alle richtigen (N1)
    multiAt(1)({
      id: 'zk-g-multi-kraefte',
      no: 117,
      fact: 'multi-forces',
      part: 'kraefte',
      title: 'Zwischenmolekulare Kräfte',
      prompt: 'Welche Aussagen über zwischenmolekulare Kräfte stimmen?',
      correct: [
        'Zwischenmolekulare Kräfte halten Moleküle untereinander zusammen, etwa in einer Flüssigkeit.',
        'Zwischenmolekulare Kräfte sind viel schwächer als Atom- und Ionenbindungen.',
        'Van-der-Waals-Kräfte wirken zwischen allen Atomen und Molekülen.',
        'Wasserstoffbrücken bilden sich, wenn ein H-Atom direkt an N, O oder F sitzt.',
        r`Zwischen Methanmolekülen, $\ce{CH4}$, wirken nur Van-der-Waals-Kräfte.`,
      ],
      wrong: [
        w('f1', 'Van-der-Waals-Kräfte wirken nur zwischen polaren Molekülen.', 'chem-mis-zk-vdw-some'),
        w('f2', 'Van-der-Waals-Kräfte sind stärker als Wasserstoffbrücken.', 'chem-mis-zk-order'),
        w('f3', 'Wasserstoffbrücken gibt es nur zwischen Wassermolekülen.', 'chem-mis-zk-water-only'),
        w('f4', r`Zwischen Chlorwasserstoffmolekülen, $\ce{HCl}$, bilden sich Wasserstoffbrücken, weil das H-Atom an Chlor sitzt.`, 'chem-mis-zk-h-other'),
        w('f5', 'Beim Sieden zerfallen die Moleküle in ihre Atome.', 'chem-mis-zk-boil-breaks'),
      ],
      hint: 'Zwischen welchen Teilchen wirken die Kräfte, und an welchen Atomen muss ein H-Atom für eine Wasserstoffbrücke sitzen?',
      explanation: {
        detailed: r`Zwischenmolekulare Kräfte wirken zwischen Molekülen und sind viel schwächer als die Bindungen in den Molekülen; beim Sieden werden nur sie überwunden. Van-der-Waals-Kräfte wirken zwischen allen Teilchen, auch zwischen unpolaren wie $\ce{CH4}$, wo sie die einzigen sind. Wasserstoffbrücken, die stärksten der drei Kräfte, gibt es nur, wenn ein H-Atom direkt an N, O oder F sitzt.`,
        short: 'Zwischen Molekülen, viel schwächer als Bindungen; Van der Waals überall; Brücken nur mit H an N, O, F.',
      },
      cards: ['zmk-kraefte', 'zmk-wasserstoffbruecken'],
      ref: REF_UEBERSICHT,
    }),
    multiAt(2)({
      id: 'zk-v-multi-wasser',
      no: 216,
      fact: 'multi-water',
      part: 'wasser',
      title: 'Wasser ist besonders',
      prompt: 'Welche Aussagen über die besonderen Eigenschaften von Wasser stimmen?',
      correct: [
        'Wasser siedet erst bei 100 °C, weil seine Moleküle über viele Wasserstoffbrücken zusammenhalten.',
        'Eis schwimmt auf Wasser, weil die Wasserstoffbrücken die Moleküle im Eis weitmaschig anordnen.',
        'Flüssiges Wasser hat seine größte Dichte bei etwa 4 °C.',
        'Tiefe Seen frieren im Winter nicht bis zum Grund durch, weil Eis oben schwimmt und sich unten das dichteste Wasser sammelt.',
        r`Wasser siedet höher als das größere $\ce{H2S}$, weil zwischen Wassermolekülen Wasserstoffbrücken wirken, zwischen $\ce{H2S}$-Molekülen aber nicht.`,
      ],
      wrong: [
        w('f1', 'Eis ist dichter als flüssiges Wasser, weil die Teilchen im Feststoff enger liegen.', 'chem-mis-zk-ice-sinks'),
        w('f2', 'Flüssiges Wasser hat seine größte Dichte genau am Gefrierpunkt.', 'chem-mis-zk-density-zero'),
        w('f3', 'Der hohe Siedepunkt von Wasser hat keinen besonderen Grund; Wasser verhält sich wie andere kleine Moleküle.', 'chem-mis-zk-water-normal'),
        w('f4', 'Beim Sieden von Wasser zerfallen die Moleküle in Wasserstoff und Sauerstoff.', 'chem-mis-zk-boil-breaks'),
        w('f5', r`Zwischen $\ce{H2S}$-Molekülen bilden sich ebenso Wasserstoffbrücken wie zwischen Wassermolekülen.`, 'chem-mis-zk-h-other'),
      ],
      hint: 'Fast alles Besondere am Wasser geht auf eine Kraft zwischen seinen Molekülen zurück.',
      explanation: {
        detailed: r`Wassermoleküle halten über viele Wasserstoffbrücken zusammen; deshalb siedet Wasser erst bei 100 °C, während das größere $\ce{H2S}$ ohne Brücken viel tiefer siedet. Im Eis ordnen die Brücken die Moleküle weitmaschig an: Eis ist weniger dicht als Wasser und schwimmt. Flüssiges Wasser ist bei etwa 4 °C am dichtesten; dieses Wasser sammelt sich am Grund tiefer Seen, die deshalb nicht durchfrieren.`,
        short: 'Wasserstoffbrücken: hoher Siedepunkt, Eis schwimmt, größte Dichte bei etwa 4 °C.',
      },
      cards: ['zmk-wasser'],
      ref: REF_WASSER,
    }),
    multiAt(3)({
      id: 'zk-k-multi-siedepunkte',
      no: 318,
      fact: 'multi-boiling',
      part: 'siedepunkte',
      title: 'Siedepunkte',
      prompt: 'Welche Aussagen über die Siedepunkte molekularer Stoffe stimmen?',
      correct: [
        'Beim Sieden werden die Kräfte zwischen den Molekülen überwunden; die Moleküle selbst bleiben ganz.',
        r`Ethanol, $\ce{C2H5OH}$, siedet höher als Dimethylether, $\ce{CH3OCH3}$, obwohl beide dieselbe Summenformel haben.`,
        r`Fluorwasserstoff, $\ce{HF}$, siedet viel höher als Chlorwasserstoff, $\ce{HCl}$, weil er Wasserstoffbrücken bildet.`,
        r`Das unpolare Tetrachlormethan, $\ce{CCl4}$, siedet höher als das polare Chlormethan, $\ce{CH3Cl}$.`,
        r`Bei gleicher Art der Kraft siedet das größere Molekül höher, etwa Propan-1-ol, $\ce{C3H7OH}$, höher als Methanol, $\ce{CH3OH}$.`,
      ],
      wrong: [
        w('f1', 'Je stärker die Kräfte zwischen den Molekülen sind, desto niedriger liegt der Siedepunkt.', 'chem-mis-zk-boil-weak'),
        w('f2', 'Der Siedepunkt hängt nur von der Molmasse ab, nicht von der Art der Kräfte.', 'chem-mis-zk-mass-only'),
        w('f3', 'Größere Moleküle haben schwächere Van-der-Waals-Kräfte als kleine und sieden deshalb tiefer.', 'chem-mis-zk-size'),
        w('f4', 'Zwischen Molekülen von Dimethylether bilden sich Wasserstoffbrücken, weil sie Sauerstoff enthalten.', 'chem-mis-zk-any-h'),
        w('f5', r`Chlorwasserstoff, $\ce{HCl}$, bildet wie Fluorwasserstoff Wasserstoffbrücken, weil beide ein H-Atom an einem Halogen haben.`, 'chem-mis-zk-h-other'),
      ],
      hint: 'Erst die Art der Kraft bestimmen, dann bei gleicher Art die Größe der Moleküle vergleichen; sehr große Moleküle können das umdrehen.',
      explanation: {
        detailed: r`Beim Sieden trennt man die Moleküle voneinander; je stärker sie sich anziehen, desto höher der Siedepunkt. Ethanol und $\ce{HF}$ bilden Wasserstoffbrücken, Dimethylether (H nur an C) und $\ce{HCl}$ nicht: Sie sieden tiefer. Bei gleicher Art der Kraft entscheidet die Größe, darum siedet Propan-1-ol höher als Methanol. Das große $\ce{CCl4}$ mit vielen Elektronen hat so starke Van-der-Waals-Kräfte, dass es höher siedet als das kleine, polare $\ce{CH3Cl}$.`,
        short: 'Stärkere Kräfte, höherer Siedepunkt; erst die Art der Kraft, dann die Größe.',
      },
      cards: ['zmk-siedepunkte', 'zmk-wasserstoffbruecken'],
      ref: REF_GROESSE,
    }),
    // ---- Zuordnen (N1b)
    MATCH_FORCES_BASIC,
    MATCH_FORCES_EXAM,
    MATCH_ROOM_STATE,
    // ---- Ordnen (N1c)
    ORDER_ALKANE_BOIL,
    ORDER_HALIDE_BOIL,
  ],
  // 301 glich in der Form Klausuraufgabe 3c, 309 einer Übungsaufgabe (Prüfung 11.11.2026)
  retired: [301, 309],
}
