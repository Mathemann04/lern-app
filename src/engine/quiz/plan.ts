import type { Choice, GuidedStep, GuidedTaskBase, MatchRow, OrderStepTrap } from '../guided/types.ts'
import { createRng } from '../random/rng.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import type { Rng } from '../random/rng.ts'
import type { MatchQuestion, MultiChoice, Misconception, OrderQuestion, Question, QuizOption, SingleChoice, WrongOption } from './types.ts'

// Wissensfrage → geführte Aufgabe mit einem Schritt: die Frage mit vier Antworten, der richtigen und
// drei falschen aus dem Vorrat; bei „Wähle alle richtigen“ (N1) vier bis sechs Aussagen (planMulti). Die Fassung (variant, 0 bis 49) wählt mit festem Zufall, welche
// falschen Antworten gezeigt werden und in welcher Reihenfolge: dieselbe Nummer zeigt immer dieselbe
// Aufgabe. Jede falsche Antwort trägt ihren Denkfehler (für die Fehlerstatistik) und den Text
// „Warum ist das falsch?".

export const QUIZ_INSTRUCTION = 'Wähle die richtige Antwort'
export const MULTI_INSTRUCTION = 'Wähle alle richtigen Aussagen'
// so viele falsche Antworten stehen neben der richtigen
export const SHOWN_WRONG = 3
// „Wähle alle richtigen“: so viele Aussagen stehen da, davon so viele richtige (Plan M4, „Aufgabenarten“)
export const MULTI_SHOWN = { min: 4, max: 6 } as const
export const MULTI_CORRECT = { min: 1, max: 4 } as const
export const MATCH_INSTRUCTION = 'Ordne richtig zu'
// Zuordnen: so viele Paare stehen da (Plan M4, „Aufgabenarten“: drei bis sechs; aus einem Vorrat von mindestens vier)
export const MATCH_SHOWN = { min: 4, max: 6 } as const
export const ORDER_INSTRUCTION = 'Bring in die richtige Reihenfolge'
// Ordnen: so viele Glieder stehen da (Plan M4, „Aufgabenarten“: drei bis fünf; aus einem Vorrat von mindestens vier)
export const ORDER_SHOWN = { min: 4, max: 5 } as const

// focus: Id eines Denkfehlers, dessen Antwort sicher dabei ist (gezieltes Üben); kommt er in der Frage
// nicht vor, zählt er nicht
export function planQuestion(
  question: Question,
  misconceptions: readonly Misconception[],
  ref: TaskRef,
  variant: number,
  focus?: string,
): GuidedTaskBase {
  const rng = createRng(`quiz:${question.id}:${variant}`)
  const byId = new Map(misconceptions.map((m) => [m.id, m]))
  const wrongChoice = (option: WrongOption): Choice => {
    const why = option.why ?? byId.get(option.misconception)?.why
    if (!why) throw new Error(`Frage ${question.id}: Denkfehler ${option.misconception} ist unbekannt`)
    return { id: option.id, content: option.text, correct: false, errorRuleId: option.misconception, whyWrong: why }
  }
  const correctChoice = (option: QuizOption): Choice => ({ id: option.id, content: option.text, correct: true })
  if (question.kind === 'match') return planMatch(question, ref, rng, byId, focus)
  if (question.kind === 'order') return planOrder(question, ref, rng, byId, focus)
  return question.kind === 'multi'
    ? planMulti(question, ref, rng, wrongChoice, correctChoice, focus)
    : planSingle(question, ref, rng, wrongChoice, correctChoice, focus)
}

// Antworten des gezielt geübten Denkfehlers (eine davon kommt sicher dran)
const forcedWrong = (wrong: readonly WrongOption[], rng: Rng, focus?: string): WrongOption[] => {
  const forced = focus ? wrong.filter((o) => o.misconception === focus) : []
  return forced.length > 0 ? [rng.pick(forced)] : []
}

type ToChoice<T> = (option: T) => Choice

function planSingle(
  question: SingleChoice,
  ref: TaskRef,
  rng: Rng,
  wrongChoice: ToChoice<WrongOption>,
  correctChoice: ToChoice<QuizOption>,
  focus?: string,
): GuidedTaskBase {
  const first = forcedWrong(question.wrong, rng, focus)
  const others = rng.shuffle(question.wrong.filter((o) => !first.includes(o))).slice(0, SHOWN_WRONG - first.length)
  const choices = rng.shuffle([correctChoice(question.correct), ...[...first, ...others].map(wrongChoice)])
  return taskOf(question, ref, QUIZ_INSTRUCTION, choices, question.correct.text, false)
}

// „Wähle alle richtigen“: vier bis sechs Aussagen, davon eine bis vier richtig und mindestens eine falsch;
// die Fassung wählt Zahl, Auswahl und Reihenfolge
function planMulti(
  question: MultiChoice,
  ref: TaskRef,
  rng: Rng,
  wrongChoice: ToChoice<WrongOption>,
  correctChoice: ToChoice<QuizOption>,
  focus?: string,
): GuidedTaskBase {
  const right = question.correct.length
  const wrong = question.wrong.length
  const shown = rng.int(MULTI_SHOWN.min, Math.min(MULTI_SHOWN.max, Math.min(right, MULTI_CORRECT.max) + wrong))
  const rightCount = rng.int(Math.max(MULTI_CORRECT.min, shown - wrong), Math.min(MULTI_CORRECT.max, right, shown - 1))
  const first = forcedWrong(question.wrong, rng, focus)
  const others = rng.shuffle(question.wrong.filter((o) => !first.includes(o))).slice(0, shown - rightCount - first.length)
  const rights = rng.shuffle(question.correct).slice(0, rightCount)
  const choices = rng.shuffle([...rights.map(correctChoice), ...[...first, ...others].map(wrongChoice)])
  // im Ergebnis die richtigen Aussagen dieser Fassung, in der gezeigten Reihenfolge
  const result = choices.filter((c) => c.correct).map((c) => c.content).join('\n')
  return taskOf(question, ref, MULTI_INSTRUCTION, choices, result, true)
}

// Zuordnen: vier bis sechs Paare (beim gezielten Üben sicher die Zeile mit der Verwechslung und das Paar, dem ihr
// falsches Ziel gehört), mindestens zwei verschiedene Ziele; Zeilen und Ziele gemischt
function planMatch(question: MatchQuestion, ref: TaskRef, rng: Rng, byId: ReadonlyMap<string, Misconception>, focus?: string): GuidedTaskBase {
  const pairs = question.pairs
  const traps = focus ? question.traps.filter((t) => t.misconception === focus) : []
  const trap = traps.length > 0 ? rng.pick(traps) : undefined
  const forced = trap ? pairs.filter((p) => p.id === trap.pair || p === pairs.find((q) => q.right === trap.right)) : []
  const count = rng.int(Math.min(MATCH_SHOWN.min, pairs.length), Math.min(MATCH_SHOWN.max, pairs.length))
  let shown = forced
  for (let attempt = 0; attempt < 20; attempt++) {
    shown = [...forced, ...rng.shuffle(pairs.filter((p) => !forced.includes(p))).slice(0, count - forced.length)]
    if (new Set(shown.map((p) => p.right)).size >= 2) break
  }
  // Ziel-Id: das erste Paar des Vorrats mit diesem rechten Eintrag
  const targetId = (right: string) => `z-${pairs.find((p) => p.right === right)!.id}`
  const targets = rng.shuffle([...new Set(shown.map((p) => p.right))]).map((right) => ({ id: targetId(right), content: right }))
  const present = new Set(targets.map((t) => t.content))
  const rows: MatchRow[] = rng.shuffle(shown).map((pair) => ({
    id: pair.id,
    content: pair.left,
    answer: targetId(pair.right),
    traps: question.traps
      .filter((t) => t.pair === pair.id && present.has(t.right))
      .map((t) => {
        const why = t.why ?? byId.get(t.misconception)?.why
        if (!why) throw new Error(`Frage ${question.id}: Denkfehler ${t.misconception} ist unbekannt`)
        return { target: targetId(t.right), errorRuleId: t.misconception, whyWrong: why }
      }),
  }))
  // im Ergebnis die Paare dieser Fassung, je Zeile eins
  const result = rows.map((row) => `${row.content}: ${targets.find((t) => t.id === row.answer)!.content}`).join('\n')
  return taskOf(question, ref, MATCH_INSTRUCTION, [], result, false, { rows, targets })
}

// Ordnen: vier oder fünf Glieder in ihrer Reihenfolge (beim gezielten Üben sicher die beiden Glieder der Verwechslung),
// gemischt, nie schon richtig; Verwechslungen nur, wenn ihre Glieder dastehen
function planOrder(question: OrderQuestion, ref: TaskRef, rng: Rng, byId: ReadonlyMap<string, Misconception>, focus?: string): GuidedTaskBase {
  const all = question.items
  const focused = focus ? question.traps.filter((t) => t.misconception === focus) : []
  const trap = focused.length > 0 ? rng.pick(focused) : undefined
  const forced = trap?.kind === 'swap' ? all.filter((i) => i.id === trap.before || i.id === trap.after) : []
  const count = rng.int(Math.min(ORDER_SHOWN.min, all.length), Math.min(ORDER_SHOWN.max, all.length))
  const chosen = new Set([...forced, ...rng.shuffle(all.filter((i) => !forced.includes(i))).slice(0, count - forced.length)])
  const items = all.filter((i) => chosen.has(i)).map((i) => ({ id: i.id, content: i.text }))
  const ids = items.map((i) => i.id)
  let start = rng.shuffle(ids)
  while (start.join() === ids.join()) start = rng.shuffle(ids)
  const why = (t: OrderQuestion['traps'][number]) => {
    const text = t.why ?? byId.get(t.misconception)?.why
    if (!text) throw new Error(`Frage ${question.id}: Denkfehler ${t.misconception} ist unbekannt`)
    return text
  }
  const traps: OrderStepTrap[] = question.traps
    .filter((t) => t.kind === 'reversed' || (ids.includes(t.before) && ids.includes(t.after)))
    .map((t) => ({ ...(t.kind === 'reversed' ? { kind: 'reversed' as const } : { kind: 'swap' as const, before: t.before, after: t.after }), errorRuleId: t.misconception, whyWrong: why(t) }))
  // im Ergebnis die richtige Reihenfolge dieser Fassung, von oben nach unten
  const result = items.map((i, n) => `${n + 1}. ${i.content}`).join('\n')
  return taskOf(question, ref, ORDER_INSTRUCTION, [], result, false, undefined, { items, start, first: question.first, last: question.last, traps })
}

// Welche typischen Verwechslungen stecken in einer gelegten Reihenfolge (Ids von oben nach unten)?
export function orderTrapsIn(order: readonly string[], traps: readonly OrderStepTrap[], correct: readonly string[]): OrderStepTrap[] {
  // ganz umgedreht: nur dieser Denkfehler, nicht dazu noch jede vertauschte Paarung
  const reversed = order.join() === [...correct].reverse().join()
  const whole = traps.filter((t) => t.kind === 'reversed')
  if (reversed && whole.length > 0) return whole
  return traps.filter((t) => t.kind === 'swap' && order.indexOf(t.before) < order.indexOf(t.after))
}

function taskOf(
  question: Question,
  ref: TaskRef,
  instruction: string,
  choices: readonly Choice[],
  resultText: string,
  multi: boolean,
  match?: GuidedStep['match'],
  order?: GuidedStep['order'],
): GuidedTaskBase {
  return {
    ref,
    instruction,
    steps: [
      {
        id: 'frage',
        title: question.title,
        question: question.prompt,
        choices,
        hint: question.hint,
        explanation: question.explanation,
        cards: question.cards,
        ...(question.figure ? { figure: question.figure } : {}),
        ...(multi ? { multi: true } : {}),
        ...(match ? { match } : {}),
        ...(order ? { order } : {}),
      },
    ],
    cards: question.cards,
    resultText,
    resultQuestion: question.prompt,
    questionId: question.id,
  }
}
