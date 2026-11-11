import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoxInputStep, Choice, GuidedStep, GuidedTaskBase, MatchStep, OrderStep, OrderStepTrap } from '../../engine/guided/types.ts'
import { type InputBox, judgeBoxes, nextBox, solutionBoxes, totalMatches } from '../../engine/chem/boxInput.ts'
import { orderTrapsIn } from '../../engine/quiz/plan.ts'
import type { Expr } from '../../engine/expr/types.ts'
import { type TaskRef, formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { recordAttempt, recordError } from '../../state/progress.ts'
import { addReport } from '../../state/reports.ts'
import { isInReview, recordReview } from '../../state/reviews.ts'
import { questionNoOf } from '../practice.ts'
import type { ExplanationDetail, PracticeMode } from '../../state/storage.ts'
import { type Verdict, judgeNumber } from '../../engine/quantity/judge.ts'
import type { Explanation } from '../../engine/explain/texts.ts'
import { findError } from '../../engine/errorCatalog.ts'
import { NumberAnswer } from '../numeric/NumberAnswer.tsx'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { CardSheetButton, TaskCardLinks } from '../cards/CardSheet.tsx'
import type { CourseEngine } from '../courseEngines.ts'
import { courseHref, mixHref, mixPracticeHref, practiceHref } from '../routes.ts'
import { LevelUpSuggestion } from '../task/LevelUpSuggestion.tsx'
import { CheckBadge, FocusBanner, TaskIntro, TaskTopBar } from '../task/TaskParts.tsx'
import { ChemFigure, FigureDrawing } from '../chem/ChemFigure.tsx'
import { figureById } from '../../engine/chem/figures.ts'
import { type ExplanationMode, useExplanationMode } from '../task/explanationMode.ts'

type Props = { course: string; engine: CourseEngine; taskRef: TaskRef; focus?: string | null; mix?: string | null; free?: boolean }

// course: Id des Themas, engine: seine Engine (Mathe oder Wissensfragen); focus: gezielt einen
// typischen Fehler üben (der Fehler erscheint sicher als Antwort); mix: Id des Fachs, wenn die Aufgabe
// aus „Themen mischen" kommt (weiter geht es dann in der Mischung); free: freier Modus der Chemie (S8b):
// Schritte mit Zahl (step.numeric) werden über den Ziffernblock beantwortet, die übrigen wie geführt
export function TaskScreen({ course, engine, taskRef, focus = null, mix = null, free = false }: Props) {
  const practiceMode: PracticeMode = free ? 'free' : 'guided'
  const { level, seed } = taskRef
  const task = useMemo(() => engine.planGuidedTask({ level, seed }, focus ?? undefined), [engine, level, seed, focus])
  const { mode, detail, cycle } = useExplanationMode()
  const [stepIndex, setStepIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const finished = stepIndex >= task.steps.length
  // Wissensfrage (nur sie kommen in die Wiederholung, S8a); beim Öffnen schon in der Wiederholung?
  const isQuestion = questionNoOf(engine, seed) !== null
  const [inReview] = useState(() => isQuestion && isInReview(course, seed))

  // Fertig gelöst: einmal in den Fortschritt eintragen (ohne Fehlversuch zählt als „ohne Fehler"); eine
  // falsch beantwortete Wissensfrage kommt wieder (state/reviews.ts)
  const recorded = useRef(false)
  useEffect(() => {
    if (!finished || recorded.current) return
    recorded.current = true
    recordAttempt({ course, level, mode: practiceMode, clean: mistakes === 0 })
    if (isQuestion) recordReview(course, seed, mistakes === 0)
  }, [finished, course, level, seed, isQuestion, mistakes, practiceMode])

  return (
    <main className="space-y-6">
      <TaskTopBar course={course} mix={mix} mode={mode} onCycleMode={cycle}>
        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-label="Fortschritt"
          aria-valuemin={0}
          aria-valuemax={task.steps.length}
          aria-valuenow={stepIndex}
        >
          <div
            className="h-full rounded-full bg-accent-600 transition-[width] duration-500"
            style={{ width: `${(Math.min(stepIndex, task.steps.length) / task.steps.length) * 100}%` }}
          />
        </div>
      </TaskTopBar>

      {focus && <FocusBanner focus={focus} />}
      {inReview && !focus && (
        <p className="rounded-xl bg-accent-50 px-4 py-2 text-sm text-accent-800" data-testid="review-note">
          Wiederholung: Diese Frage hattest du schon einmal falsch.
        </p>
      )}

      <TaskHeader course={course} mix={mix} task={task} stepIndex={stepIndex} />

      {finished ? (
        <FinishView course={course} mix={mix} task={task} mistakes={mistakes} focus={focus} isQuestion={isQuestion} practiceMode={practiceMode} />
      ) : (
        <StepView
          key={stepIndex}
          free={free}
          step={task.steps[stepIndex]}
          task={task.expr}
          report={task.questionId ? { id: task.questionId, course, ref: formatTaskNumber(task.ref) } : undefined}
          isLast={stepIndex === task.steps.length - 1}
          mode={mode}
          detail={detail}
          onMistake={() => setMistakes((n) => n + 1)}
          onNext={() => setStepIndex((i) => i + 1)}
        />
      )}
    </main>
  )
}

function TaskHeader({ course, mix, task, stepIndex }: { course: string; mix: string | null; task: GuidedTaskBase; stepIndex: number }) {
  const established = task.steps.slice(0, stepIndex).flatMap((s) => s.established ?? [])
  return (
    <section className="space-y-3">
      <TaskIntro course={course} mix={mix} taskRef={task.ref} functionLatex={task.functionLatex} instruction={task.instruction} note={task.note} />
      {established.length > 0 && (
        <div className="space-y-2 rounded-xl bg-zinc-50 px-4 py-3" aria-label="Bisher">
          <p className="text-sm text-zinc-500">Bisher</p>
          {established.map((line, i) => (
            <FitWidth key={i}>
              <Formula tex={line} />
            </FitWidth>
          ))}
        </div>
      )}
    </section>
  )
}

// Was „Frage melden" speichert (nur bei Wissensfragen); die Frage selbst ist step.question
type ReportTarget = { id: string; course: string; ref: string }

type StepProps = {
  step: GuidedStep
  task?: Expr
  report?: ReportTarget
  isLast: boolean
  mode: ExplanationMode
  detail: ExplanationDetail
  onMistake: () => void
  onNext: () => void
  free: boolean
}

// Rückmeldung auf eine eingetippte Zahl (freier Modus): typischer Fehler mit Erklärung, „fast" (Rundung)
// oder falsch; tries zählt die Versuche, damit dieselbe Rückmeldung ein zweites Mal neu erscheint
type Typed = { readonly kind: 'error' | 'close' | 'wrong'; readonly rule?: string; readonly why?: Explanation; readonly note?: string; readonly tries: number }

function StepView({ step, task, report, isLast, mode, detail, onMistake, onNext, free }: StepProps) {
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [reported, setReported] = useState(false)
  // freier Modus: Zahl eintippen statt auswählen
  const numeric = free ? step.numeric : undefined
  const [typed, setTyped] = useState<Typed | null>(null)
  const [revealed, setRevealed] = useState(false)
  // „Wähle alle richtigen“: angekreuzte Aussagen; nach dem Prüfen, ob alles stimmte
  const [selected, setSelected] = useState<string[]>([])
  const [multiResult, setMultiResult] = useState<{ clean: boolean } | null>(null)
  const hadMistake = useRef(false)
  const questionRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // Neuer Schritt: Fokus auf die Frage (für Tastatur und Vorlesehilfen)
  useEffect(() => {
    questionRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (solved || wrongPicks.length > 0 || typed) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [solved, wrongPicks.length, whyOpen, typed])

  function judged(verdict: Verdict, note?: string) {
    if (verdict.kind === 'correct') {
      setSolved(true)
      setTyped(null)
      return
    }
    const tries = (typed?.tries ?? 0) + 1
    setWhyOpen(false)
    if (verdict.kind === 'close') {
      // „Fast": zählt nicht als Fehler
      setTyped({ kind: 'close', tries })
      return
    }
    const firstMistake = !hadMistake.current
    hadMistake.current = true
    if (verdict.kind === 'error') {
      // wie bei der Auswahl: nur der erste Fehler je Schritt zählt für die Statistik
      if (firstMistake) recordError(verdict.rule)
      const why = numeric?.wrongs.find((w) => w.rule === verdict.rule)?.why ?? step.boxes?.whys[verdict.rule]
      setTyped({ kind: 'error', rule: verdict.rule, why, tries })
    } else {
      setTyped({ kind: 'wrong', note, tries })
    }
    onMistake()
  }

  function pick(choice: Choice) {
    if (solved || wrongPicks.includes(choice.id)) return
    if (choice.correct) {
      setSolved(true)
    } else {
      // Für die Fehlerstatistik zählt nur der erste Fehlgriff je Schritt; danach wird oft nur ausprobiert
      if (wrongPicks.length === 0 && choice.errorRuleId) recordError(choice.errorRuleId)
      setWrongPicks((picks) => [...picks, choice.id])
      setWhyOpen(false)
      onMistake()
    }
  }

  // Zuordnen (N1b): wie „Wähle alle richtigen“ einmal prüfen; in die Fehlerstatistik kommen die Denkfehler der
  // typischen Verwechslungen, die gewählt wurden
  function checkMatch(assigned: Readonly<Record<string, string>>) {
    const match = step.match
    if (solved || !match) return
    const wrongRows = match.rows.filter((row) => assigned[row.id] !== row.answer)
    const rules = wrongRows.flatMap((row) => row.traps.filter((t) => t.target === assigned[row.id]).map((t) => t.errorRuleId))
    for (const rule of new Set(rules)) recordError(rule)
    if (wrongRows.length > 0) onMistake()
    setMultiResult({ clean: wrongRows.length === 0 })
    setSolved(true)
  }

  // Ordnen (N1c): einmal prüfen; in die Fehlerstatistik kommen die erkannten typischen falschen Reihenfolgen
  const [orderTraps, setOrderTraps] = useState<readonly OrderStepTrap[]>([])
  function checkOrder(placed: readonly string[]) {
    const order = step.order
    if (solved || !order) return
    const correct = order.items.map((i) => i.id)
    const clean = placed.join() === correct.join()
    const found = clean ? [] : orderTrapsIn(placed, order.traps, correct)
    for (const rule of new Set(found.map((t) => t.errorRuleId))) recordError(rule)
    if (!clean) onMistake()
    setOrderTraps(found)
    setMultiResult({ clean })
    setSolved(true)
  }

  function toggle(choice: Choice) {
    if (solved) return
    setSelected((ids) => (ids.includes(choice.id) ? ids.filter((id) => id !== choice.id) : [...ids, choice.id]))
  }

  // Einmal prüfen, dann ist der Schritt vorbei: Jeder Fehler (zu Unrecht gewählt oder vergessen) zählt als ein
  // Fehlversuch; in die Fehlerstatistik kommen die Denkfehler der zu Unrecht gewählten Aussagen
  function checkMulti() {
    if (solved || selected.length === 0) return
    const wrongPicked = step.choices.filter((c) => !c.correct && selected.includes(c.id))
    const missed = step.choices.filter((c) => c.correct && !selected.includes(c.id))
    const clean = wrongPicked.length === 0 && missed.length === 0
    for (const rule of new Set(wrongPicked.flatMap((c) => (c.errorRuleId ? [c.errorRuleId] : [])))) recordError(rule)
    if (!clean) onMistake()
    setMultiResult({ clean })
    setSolved(true)
  }

  const lastWrong = step.choices.find((c) => c.id === wrongPicks.at(-1))

  return (
    <section className="animate-step-in space-y-5" aria-labelledby="question">
      <div className="space-y-1">
        <RichText text={step.title} className="block text-sm font-medium text-accent-700" inline />
        <h1 id="question" ref={questionRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          <RichText text={step.question} inline />
        </h1>
      </div>
      {step.figure && <ChemFigure id={step.figure} />}

      {numeric ? (
        <NumberAnswer answer={numeric} disabled={solved} onSubmit={(value) => judged(judgeNumber(value, numeric))} />
      ) : step.boxes ? (
        <BoxAnswers
          step={step.boxes}
          solved={solved}
          revealed={revealed}
          onCheck={(input) =>
            judged(
              judgeBoxes(step.boxes!, input),
              totalMatches(step.boxes!, input)
                ? 'Die Zahl der Elektronen stimmt, aber nicht ihre Verteilung auf die Unterschalen.'
                : 'Zähle die Elektronen: Ihre Zahl stimmt noch nicht.',
            )
          }
        />
      ) : step.order ? (
        <OrderAnswers order={step.order} checked={multiResult !== null} onCheck={checkOrder} />
      ) : step.match ? (
        <MatchAnswers match={step.match} checked={multiResult !== null} detail={detail} onCheck={checkMatch} />
      ) : step.multi ? (
        <MultiAnswers choices={step.choices} selected={selected} checked={multiResult !== null} detail={detail} onToggle={toggle} onCheck={checkMulti} />
      ) : (
      <div className="space-y-3" role="group" aria-label="Antworten">
        {step.choices.map((choice) => {
          const isWrong = wrongPicks.includes(choice.id)
          const isRight = solved && choice.correct
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => pick(choice)}
              disabled={solved || isWrong}
              aria-label={isWrong ? 'Falsche Antwort' : isRight ? 'Richtige Antwort' : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                isRight
                  ? 'animate-glow border-green-600 bg-green-50'
                  : isWrong
                    ? 'animate-shake border-red-300 bg-red-50 opacity-70'
                    : solved
                      ? 'border-zinc-200 opacity-50'
                      : 'border-zinc-200 bg-surface hover:border-accent-600 active:bg-accent-50'
              }`}
            >
              <ChoiceContent choice={choice} />
              {isRight && <span className="animate-pop text-xl text-green-700" aria-hidden>✓</span>}
              {isWrong && <span className="animate-pop text-xl text-red-700" aria-hidden>✗</span>}
            </button>
          )
        })}
      </div>
      )}

      <div className="space-y-3">
        {!solved && hintOpen && (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
            <p className="mb-1 text-sm font-semibold text-amber-800">Tipp</p>
            <RichText text={step.hint} />
          </div>
        )}
        <div>
          <div className="flex flex-wrap gap-2">
            {!solved && !hintOpen && (
              <button
                type="button"
                onClick={() => setHintOpen(true)}
                className="rounded-xl px-3 py-2.5 font-medium text-amber-800 hover:bg-amber-50"
              >
                Tipp anzeigen
              </button>
            )}
            <CardSheetButton ids={step.cards} title={cardSheetTitle(step)} task={task} />
            {report && (
              // Bleibt nach dem Melden stehen (so bleibt der Fokus auf dem Knopf), tut dann aber nichts mehr
              <button
                type="button"
                aria-disabled={reported ? 'true' : undefined}
                onClick={() => {
                  if (reported) return
                  addReport({ ...report, prompt: step.question, at: Date.now() })
                  setReported(true)
                }}
                className={`rounded-xl px-3 py-2.5 font-medium ${reported ? 'cursor-default text-zinc-500' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                {reported ? (
                  <>
                    Gemeldet <span aria-hidden>✓</span>
                  </>
                ) : (
                  'Frage melden'
                )}
              </button>
            )}
          </div>
          {/* Immer eingebunden (leer ohne Höhe), damit Vorlesehilfen die Bestätigung sicher vorlesen */}
          {report && (
            <p role="status" className="text-sm text-zinc-600">
              {reported ? 'Gemeldet. Die Liste findest du in den Einstellungen.' : ''}
            </p>
          )}
        </div>
      </div>

      <div ref={feedbackRef} aria-live="polite">
        {multiResult && !multiResult.clean ? (
          <div className="animate-step-in space-y-4 rounded-2xl bg-red-50 p-4">
            <p className="text-lg font-semibold text-red-800">Nicht ganz.</p>
            <p className="text-zinc-800">
              {step.order
                ? 'Oben steht bei jedem Eintrag, an welche Stelle er gehört.'
                : `Oben steht bei jeder ${step.match ? 'Zeile' : 'Aussage'}, was richtig war.`}{' '}
              Die Frage kommt später noch einmal.
            </p>
            {orderTraps.map((t, i) => (
              <OrderTrapWhy key={i} trap={t} detail={detail} />
            ))}
            <RichText text={step.explanation[mode === 'off' ? 'short' : mode]} className="text-zinc-800" />
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              {isLast ? 'Ergebnis ansehen' : 'Weiter'}
            </button>
          </div>
        ) : solved ? (
          <div className="animate-step-in space-y-4 rounded-2xl bg-green-50 p-4">
            {revealed ? (
              <>
                <p className="text-lg font-semibold text-green-800">Die Lösung</p>
                <RichText text={step.choices.find((c) => c.correct)?.content ?? ''} className="block text-xl font-medium" />
              </>
            ) : (
              <p className="text-lg font-semibold text-green-800">
                <CheckBadge />
                Richtig!
              </p>
            )}
            {(mode !== 'off' || revealed) && <RichText text={step.explanation[mode === 'off' ? 'short' : mode]} className="text-zinc-800" />}
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              {isLast ? 'Ergebnis ansehen' : 'Weiter'}
            </button>
          </div>
        ) : typed ? (
          <TypedFeedback
            key={typed.tries}
            typed={typed}
            detail={detail}
            whyOpen={whyOpen}
            onWhy={() => setWhyOpen(true)}
            onReveal={() => {
              setRevealed(true)
              setSolved(true)
            }}
          />
        ) : (
          lastWrong && (
            <div className="animate-step-in space-y-3 rounded-2xl bg-red-50 p-4">
              <p className="text-lg font-semibold text-red-800">Nicht ganz. Versuch es noch einmal.</p>
              {whyOpen && lastWrong.whyWrong ? (
                <RichText text={lastWrong.whyWrong[detail]} className="text-zinc-800" />
              ) : (
                <button
                  type="button"
                  onClick={() => setWhyOpen(true)}
                  className="rounded-xl border border-red-200 bg-surface px-4 py-2.5 font-medium text-red-800 hover:bg-red-100"
                >
                  Warum ist das falsch?
                </button>
              )}
            </div>
          )
        )}
      </div>
    </section>
  )
}

type MultiProps = {
  choices: readonly Choice[]
  selected: readonly string[]
  checked: boolean
  detail: ExplanationDetail
  onToggle: (choice: Choice) => void
  onCheck: () => void
}

// „Wähle alle richtigen“ (N1): Aussagen zum Ankreuzen, dann „Prüfen“. Danach steht bei jeder Aussage, ob sie
// richtig gewählt, zu Unrecht gewählt (mit „Warum ist das falsch?“) oder vergessen ist.
function MultiAnswers({ choices, selected, checked, detail, onToggle, onCheck }: MultiProps) {
  const [whyOpen, setWhyOpen] = useState<string[]>([])
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">Eine oder mehrere Aussagen stimmen. Kreuze alle richtigen an und tippe dann auf „Prüfen“.</p>
      <ul className="space-y-3" aria-label="Aussagen">
        {choices.map((choice) => {
          const isSelected = selected.includes(choice.id)
          const verdict = !checked ? null : choice.correct ? (isSelected ? 'hit' : 'missed') : isSelected ? 'wrong' : 'skipped'
          const tone =
            verdict === 'hit'
              ? 'border-green-600 bg-green-50'
              : verdict === 'wrong'
                ? 'border-red-300 bg-red-50'
                : verdict === 'missed'
                  ? 'border-amber-400 bg-amber-50'
                  : verdict === 'skipped'
                    ? 'border-zinc-200 opacity-60'
                    : isSelected
                      ? 'border-accent-600 bg-accent-50'
                      : 'border-zinc-200 bg-surface hover:border-accent-600'
          return (
            <li key={choice.id} className={`rounded-2xl border-2 transition-colors ${tone}`} data-verdict={verdict ?? undefined}>
              <button
                type="button"
                onClick={() => onToggle(choice)}
                disabled={checked}
                aria-pressed={isSelected}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold ${
                    isSelected ? 'border-accent-700 bg-accent-700 text-on-accent' : 'border-zinc-400'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
                <ChoiceContent choice={choice} />
              </button>
              {verdict && verdict !== 'skipped' && (
                <div className="space-y-2 px-4 pb-3">
                  <p
                    className={`text-sm font-semibold ${verdict === 'hit' ? 'text-green-800' : verdict === 'wrong' ? 'text-red-800' : 'text-amber-800'}`}
                  >
                    {verdict === 'hit' ? '✓ Richtig gewählt' : verdict === 'wrong' ? '✗ Zu Unrecht gewählt: Diese Aussage stimmt nicht.' : 'Vergessen: Diese Aussage stimmt auch.'}
                  </p>
                  {verdict === 'wrong' &&
                    choice.whyWrong &&
                    (whyOpen.includes(choice.id) ? (
                      <RichText text={choice.whyWrong[detail]} className="text-zinc-800" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setWhyOpen((ids) => [...ids, choice.id])}
                        className="rounded-xl border border-red-200 bg-surface px-4 py-2.5 font-medium text-red-800 hover:bg-red-100"
                      >
                        Warum ist das falsch?
                      </button>
                    ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {!checked && (
        <button
          type="button"
          onClick={onCheck}
          disabled={selected.length === 0}
          className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-600"
        >
          Prüfen
        </button>
      )}
    </div>
  )
}

type MatchProps = {
  match: MatchStep
  checked: boolean
  detail: ExplanationDetail
  onCheck: (assigned: Readonly<Record<string, string>>) => void
}

// Wenige kurze Ziele stehen als Knöpfe in jeder Zeile, sonst klappt je Zeile eine Liste auf (Plan M4, „Aufgabenarten“)
const SHORT_TARGETS = 4
const SHORT_TARGET_LENGTH = 16
const isShortTargets = (match: MatchStep) =>
  match.targets.length <= SHORT_TARGETS && match.targets.every((t) => t.content.replace(/\$[^$]*\$/g, 'xxx').length <= SHORT_TARGET_LENGTH)

// Zuordnen (N1b): je Zeile ein Ziel wählen, dann „Prüfen“. Danach steht bei jeder Zeile, ob sie stimmt; bei einer
// falschen das richtige Ziel und bei einer typischen Verwechslung „Warum ist das falsch?“.
function MatchAnswers({ match, checked, detail, onCheck }: MatchProps) {
  const [assigned, setAssigned] = useState<Record<string, string>>({})
  const [open, setOpen] = useState<string | null>(match.rows[0]?.id ?? null)
  const [whyOpen, setWhyOpen] = useState<string[]>([])
  const short = isShortTargets(match)
  // passt ein Ziel zu mehreren Zeilen? (sonst verriete der Hinweis, dass jedes Ziel genau einmal vorkommt)
  const shared = match.targets.length < match.rows.length
  const complete = match.rows.every((row) => assigned[row.id] !== undefined)
  const targetOf = (id: string | undefined) => match.targets.find((t) => t.id === id)

  function choose(rowIndex: number, target: string) {
    if (checked) return
    const row = match.rows[rowIndex]
    setAssigned((a) => ({ ...a, [row.id]: target }))
    // in der Liste weiter zur nächsten offenen Zeile
    const next = match.rows.find((r, i) => i > rowIndex && assigned[r.id] === undefined)
    setOpen(next?.id ?? null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        {short ? 'Tippe in jeder Zeile an, was dazu passt.' : 'Wähle für jede Zeile aus der Liste, was dazu passt.'}
        {shared && ' Dasselbe kann zu mehreren Zeilen passen.'} Dann tippe auf „Prüfen“.
      </p>
      <ol className="space-y-3" aria-label="Zuordnungen">
        {match.rows.map((row, index) => {
          const chosen = targetOf(assigned[row.id])
          const verdict = !checked ? null : assigned[row.id] === row.answer ? 'right' : 'wrong'
          const trap = verdict === 'wrong' ? row.traps.find((t) => t.target === assigned[row.id]) : undefined
          const tone = verdict === 'right' ? 'border-green-600 bg-green-50' : verdict === 'wrong' ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-surface'
          return (
            <li key={row.id} className={`space-y-2 rounded-2xl border-2 px-4 py-3 ${tone}`} data-verdict={verdict ?? undefined}>
              <RichText text={row.content} className="block text-lg font-medium" />
              {short ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Ziele">
                  {match.targets.map((t) => {
                    const isChosen = assigned[row.id] === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={isChosen}
                        disabled={checked}
                        onClick={() => choose(index, t.id)}
                        className={`min-h-11 rounded-xl border-2 px-3 py-1.5 font-medium ${
                          isChosen ? 'border-accent-700 bg-accent-700 text-on-accent' : 'border-zinc-300 bg-surface hover:border-accent-600'
                        } ${checked && !isChosen ? 'opacity-60' : ''}`}
                      >
                        <RichText text={t.content} inline />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={checked}
                    aria-expanded={open === row.id}
                    onClick={() => setOpen(open === row.id ? null : row.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border-2 border-zinc-300 bg-surface px-3 py-2 text-left font-medium hover:border-accent-600"
                  >
                    {chosen ? <RichText text={chosen.content} inline /> : <span className="text-zinc-600">Auswählen …</span>}
                    {!checked && <span aria-hidden className="text-zinc-500">{open === row.id ? '▲' : '▼'}</span>}
                  </button>
                  {open === row.id && !checked && (
                    <div className="space-y-2" role="group" aria-label="Ziele">
                      {match.targets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          aria-pressed={assigned[row.id] === t.id}
                          onClick={() => choose(index, t.id)}
                          className={`block min-h-11 w-full rounded-xl border-2 px-3 py-2 text-left ${
                            assigned[row.id] === t.id ? 'border-accent-700 bg-accent-50' : 'border-zinc-200 bg-surface hover:border-accent-600'
                          }`}
                        >
                          <RichText text={t.content} inline />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {verdict && (
                <div className="space-y-2">
                  {verdict === 'right' ? (
                    <p className="text-sm font-semibold text-green-800">✓ Richtig zugeordnet</p>
                  ) : (
                    <p className="text-sm font-semibold text-red-800">
                      ✗ Richtig wäre: <RichText text={targetOf(row.answer)?.content ?? ''} inline />
                    </p>
                  )}
                  {trap &&
                    (whyOpen.includes(row.id) ? (
                      <RichText text={trap.whyWrong[detail]} className="text-zinc-800" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setWhyOpen((ids) => [...ids, row.id])}
                        className="rounded-xl border border-red-200 bg-surface px-4 py-2.5 font-medium text-red-800 hover:bg-red-100"
                      >
                        Warum ist das falsch?
                      </button>
                    ))}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {!checked && (
        <button
          type="button"
          onClick={() => onCheck(assigned)}
          disabled={!complete}
          className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-600"
        >
          Prüfen
        </button>
      )}
    </div>
  )
}

type BoxProps = { step: BoxInputStep; solved: boolean; revealed: boolean; onCheck: (input: InputBox[][]) => void }

// Orbital-Kästchen zum Antippen (N2a): je Unterschale eine Zeile, Tippen schaltet leer → ↑ → ↓ → ↑↓. Nach einem Fehler
// lässt sich weiter tippen und neu prüfen; „Lösung zeigen“ füllt die richtige Besetzung ein.
function BoxAnswers({ step, solved, revealed, onCheck }: BoxProps) {
  const [input, setInput] = useState<InputBox[][]>(() => step.rows.map((r) => Array.from({ length: r.orbitals }, (): InputBox => '0')))
  const shown = revealed ? solutionBoxes(step) : input
  function tap(row: number, box: number) {
    if (solved) return
    setInput((rows) => rows.map((r, i) => (i === row ? r.map((b, k) => (k === box ? nextBox(b) : b)) : r)))
  }
  const arrows: Readonly<Record<InputBox, string>> = { '0': '', u: '↑', d: '↓', '2': '↑↓' }
  const words: Readonly<Record<InputBox, string>> = { '0': 'leer', u: 'ein Elektron, Spin nach oben', d: 'ein Elektron, Spin nach unten', '2': 'zwei Elektronen' }
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">Tippen schaltet ein Kästchen: leer, ↑, ↓, ↑↓. Dann tippe auf „Prüfen“.</p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3" role="group" aria-label="Kästchen">
        {step.core && (
          <span className="pb-3 text-lg font-semibold text-zinc-700">
            <Formula tex={`[\\mathrm{${step.core}}]`} />
          </span>
        )}
        {step.rows.map((row, i) => (
          <div key={row.shell} className="space-y-1">
            <div className="flex">
              {shown[i].map((b, k) => (
                <button
                  key={k}
                  type="button"
                  disabled={solved}
                  onClick={() => tap(i, k)}
                  aria-label={`${row.shell}, Orbital ${k + 1}: ${words[b]}`}
                  className="-ml-0.5 flex size-12 items-center justify-center border-2 border-zinc-500 bg-surface text-xl font-semibold first:ml-0 hover:bg-accent-50 disabled:hover:bg-surface"
                >
                  <span aria-hidden>{arrows[b]}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-medium text-zinc-700">
              <Formula tex={`${row.shell[0]}\\mathrm{${row.shell.slice(1)}}`} />
            </p>
          </div>
        ))}
      </div>
      {!solved && (
        <button
          type="button"
          onClick={() => onCheck(input)}
          className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
        >
          Prüfen
        </button>
      )}
    </div>
  )
}

type OrderProps = { order: OrderStep; checked: boolean; onCheck: (placed: readonly string[]) => void }

// Ordnen (N1c): Glieder mit Pfeilknöpfen nach oben und unten schieben (kein Ziehen mit dem Finger, verträgt sich am
// Handy schlecht mit dem Scrollen), dann „Prüfen“. Danach steht bei jedem Glied, ob es am richtigen Platz ist.
function OrderAnswers({ order, checked, onCheck }: OrderProps) {
  const [placed, setPlaced] = useState<readonly string[]>(order.start)
  const correct = order.items.map((i) => i.id)
  const content = (id: string) => order.items.find((i) => i.id === id)?.content ?? ''
  function move(index: number, by: -1 | 1) {
    const to = index + by
    if (checked || to < 0 || to >= placed.length) return
    const next = [...placed]
    ;[next[index], next[to]] = [next[to], next[index]]
    setPlaced(next)
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">Schiebe die Einträge mit den Pfeilen an ihren Platz. Dann tippe auf „Prüfen“.</p>
      <p className="text-sm font-medium text-zinc-700">
        Oben: <RichText text={order.first} inline />
      </p>
      <ol className="space-y-2" aria-label="Reihenfolge">
        {placed.map((id, index) => {
          const verdict = !checked ? null : correct[index] === id ? 'right' : 'wrong'
          const tone = verdict === 'right' ? 'border-green-600 bg-green-50' : verdict === 'wrong' ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-surface'
          return (
            <li key={id} className={`flex items-center gap-2 rounded-2xl border-2 py-1 pr-1 pl-4 ${tone}`} data-verdict={verdict ?? undefined}>
              <span className="w-5 shrink-0 text-sm font-semibold text-zinc-600">{index + 1}.</span>
              <span className="min-w-0 flex-1 py-2">
                <RichText text={content(id)} className="block text-lg font-medium" inline />
                {verdict === 'wrong' && (
                  <span className="block text-sm font-semibold text-red-800">✗ gehört an Stelle {correct.indexOf(id) + 1}</span>
                )}
                {verdict === 'right' && <span className="block text-sm font-semibold text-green-800">✓ richtig</span>}
              </span>
              {!checked && (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Nach oben"
                    className="flex size-11 items-center justify-center rounded-xl border border-zinc-300 text-lg hover:border-accent-600 disabled:opacity-30"
                  >
                    <span aria-hidden>↑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === placed.length - 1}
                    aria-label="Nach unten"
                    className="flex size-11 items-center justify-center rounded-xl border border-zinc-300 text-lg hover:border-accent-600 disabled:opacity-30"
                  >
                    <span aria-hidden>↓</span>
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="text-sm font-medium text-zinc-700">
        Unten: <RichText text={order.last} inline />
      </p>
      {!checked && (
        <button
          type="button"
          onClick={() => onCheck(placed)}
          className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
        >
          Prüfen
        </button>
      )}
    </div>
  )
}

// „Warum ist das falsch?“ zu einer erkannten typischen falschen Reihenfolge
function OrderTrapWhy({ trap, detail }: { trap: OrderStepTrap; detail: ExplanationDetail }) {
  const [open, setOpen] = useState(false)
  const name = findError(trap.errorRuleId)?.name
  return (
    <div className="space-y-2">
      {name && (
        <p className="text-zinc-800">
          Das passt zu einem typischen Fehler: <RichText text={name} className="font-medium" inline />
        </p>
      )}
      {open ? (
        <RichText text={trap.whyWrong[detail]} className="text-zinc-800" />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-red-200 bg-surface px-4 py-2.5 font-medium text-red-800 hover:bg-red-100"
        >
          Warum ist das falsch?
        </button>
      )}
    </div>
  )
}

type TypedFeedbackProps = { typed: Typed; detail: ExplanationDetail; whyOpen: boolean; onWhy: () => void; onReveal: () => void }

// Rückmeldung auf eine eingetippte Zahl: „Fast" (Rundung, zählt nicht als Fehler), typischer Fehler mit
// Namen und „Warum ist das falsch?", sonst falsch; nach einem Fehler lässt sich die Lösung zeigen
function TypedFeedback({ typed, detail, whyOpen, onWhy, onReveal }: TypedFeedbackProps) {
  if (typed.kind === 'close')
    return (
      <div className="animate-step-in space-y-1 rounded-2xl bg-amber-50 p-4">
        <p className="text-lg font-semibold text-amber-800">Fast: Prüfe deine Rundung.</p>
        <p className="text-zinc-800">Rechne mit allen Ziffern weiter und runde erst am Ende auf drei gültige Ziffern. Das zählt nicht als Fehler.</p>
      </div>
    )
  const name = typed.rule ? findError(typed.rule)?.name : undefined
  return (
    <div className="animate-step-in space-y-3 rounded-2xl bg-red-50 p-4">
      <p className="text-lg font-semibold text-red-800">Nicht ganz. Versuch es noch einmal.</p>
      {typed.note && <p className="text-zinc-800">{typed.note}</p>}
      {name && (
        <p className="text-zinc-800">
          Das passt zu einem typischen Fehler: <RichText text={name} className="font-medium" inline />
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {typed.why &&
          (whyOpen ? (
            <RichText text={typed.why[detail]} className="text-zinc-800" />
          ) : (
            <button
              type="button"
              onClick={onWhy}
              className="rounded-xl border border-red-200 bg-surface px-4 py-2.5 font-medium text-red-800 hover:bg-red-100"
            >
              Warum ist das falsch?
            </button>
          ))}
        <button type="button" onClick={onReveal} className="rounded-xl px-4 py-2.5 font-medium text-red-800 hover:bg-red-100">
          Lösung zeigen
        </button>
      </div>
    </div>
  )
}

// Eine Formel als Antwort setzt sich kleiner, bis sie passt; Text mit Formeln bricht um wie ein Satz
function ChoiceContent({ choice }: { choice: Choice }) {
  const figure = choice.figure ? figureById(choice.figure) : undefined
  if (figure)
    return (
      <span className="block min-w-0 flex-1 py-1">
        <FigureDrawing figure={figure} label={choice.content} />
      </span>
    )
  const content = (
    <>
      <RichText text={choice.content} className="block font-medium" inline />
      {choice.caption && <RichText text={choice.caption} className="mt-1 block text-[0.78em] text-zinc-500" inline />}
    </>
  )
  if (/^\$[^$]+\$$/.test(choice.content)) return <FitWidth className="min-w-0 flex-1 py-1 text-lg">{content}</FitWidth>
  return <span className="block min-w-0 flex-1 text-lg">{content}</span>
}

// Bei der Regelwahl zeigen die Karten alle angebotenen Regeln, nicht nur die richtige
function cardSheetTitle(step: GuidedStep): string {
  if (step.id === 'regel') return 'Die Regeln zur Auswahl'
  return step.cards.length === 1 ? 'Lernkarte zu diesem Schritt' : 'Lernkarten zu diesem Schritt'
}

type FinishProps = { course: string; mix: string | null; task: GuidedTaskBase; mistakes: number; focus: string | null; isQuestion: boolean; practiceMode: PracticeMode }

function FinishView({ course, mix, task, mistakes, focus, isQuestion, practiceMode }: FinishProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  return (
    <section className="animate-step-in space-y-5">
      <div className="space-y-1">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
          <CheckBadge large />
          Geschafft!
        </h1>
        <p className="text-zinc-600">
          {mistakes === 0
            ? 'Alles beim ersten Versuch richtig.'
            : task.steps.some((st) => st.multi)
              ? 'Nicht alles richtig angekreuzt.'
              : task.steps.some((st) => st.match)
                ? 'Nicht alles richtig zugeordnet.'
                : task.steps.some((st) => st.order)
                  ? 'Die Reihenfolge stimmte noch nicht.'
              : `Gelöst mit ${mistakes} ${mistakes === 1 ? 'Fehlversuch' : 'Fehlversuchen'}.`}
          {isQuestion && mistakes > 0 && ' Die Frage kommt nach drei anderen Aufgaben noch einmal.'}
        </p>
      </div>
      {(task.resultLatex !== undefined || task.resultText !== undefined) && (
        <div className="space-y-2 rounded-2xl bg-accent-50 px-4 py-4" data-testid="result">
          {task.resultLatex !== undefined ? (
            <FitWidth className="text-2xl">
              <Formula tex={task.resultLatex} />
            </FitWidth>
          ) : (
            <>
              {task.resultQuestion !== undefined && (
                <div className="space-y-1 pb-1">
                  <p className="text-sm text-zinc-600">Frage</p>
                  <RichText text={task.resultQuestion} className="text-zinc-800" />
                </div>
              )}
              <p className="text-sm text-zinc-600">{task.steps.some((st) => st.multi)
                  ? 'Richtige Aussagen'
                  : task.steps.some((st) => st.match)
                    ? 'Richtige Zuordnung'
                    : task.steps.some((st) => st.order)
                      ? 'Richtige Reihenfolge'
                      : 'Richtige Antwort'}</p>
              <RichText text={task.resultText!} className="text-xl font-medium" />
            </>
          )}
          {task.resultNote && <RichText text={task.resultNote} className="text-zinc-600" />}
          {task.resultFigure && <ChemFigure id={task.resultFigure} />}
        </div>
      )}
      {/* In der Mischung kein Vorschlag für eine höhere Stufe: Die Stufe gilt dort für alle Themen */}
      {!mix && <LevelUpSuggestion course={course} level={task.ref.level} mode={practiceMode} />}
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={mix ? mixPracticeHref(mix, task.ref.level) : practiceHref(course, task.ref.level, practiceMode, focus)}
          className="flex-1 rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-on-accent hover:bg-accent-800"
        >
          Nächste Aufgabe
        </a>
        <a
          href={mix ? mixHref(mix) : courseHref(course)}
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-center text-lg font-medium hover:bg-zinc-50"
        >
          Zur Übersicht
        </a>
      </div>
      <TaskCardLinks ids={task.cards} />
    </section>
  )
}
