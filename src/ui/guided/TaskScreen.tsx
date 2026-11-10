import { useEffect, useMemo, useRef, useState } from 'react'
import type { Choice, GuidedStep, GuidedTaskBase } from '../../engine/guided/types.ts'
import type { Expr } from '../../engine/expr/types.ts'
import { type TaskRef, formatTaskNumber } from '../../engine/tasks/taskNumber.ts'
import { recordAttempt, recordError } from '../../state/progress.ts'
import { addReport } from '../../state/reports.ts'
import type { ExplanationDetail } from '../../state/storage.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { CardSheetButton, TaskCardLinks } from '../cards/CardSheet.tsx'
import type { CourseEngine } from '../courseEngines.ts'
import { courseHref, mixHref, mixPracticeHref, practiceHref } from '../routes.ts'
import { LevelUpSuggestion } from '../task/LevelUpSuggestion.tsx'
import { CheckBadge, FocusBanner, TaskIntro, TaskTopBar } from '../task/TaskParts.tsx'
import { type ExplanationMode, useExplanationMode } from '../task/explanationMode.ts'

type Props = { course: string; engine: CourseEngine; taskRef: TaskRef; focus?: string | null; mix?: string | null }

// course: Id des Themas, engine: seine Engine (Mathe oder Wissensfragen); focus: gezielt einen
// typischen Fehler üben (der Fehler erscheint sicher als Antwort); mix: Id des Fachs, wenn die Aufgabe
// aus „Themen mischen" kommt (weiter geht es dann in der Mischung)
export function TaskScreen({ course, engine, taskRef, focus = null, mix = null }: Props) {
  const { level, seed } = taskRef
  const task = useMemo(() => engine.planGuidedTask({ level, seed }, focus ?? undefined), [engine, level, seed, focus])
  const { mode, detail, cycle } = useExplanationMode()
  const [stepIndex, setStepIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const finished = stepIndex >= task.steps.length

  // Fertig gelöst: einmal in den Fortschritt eintragen (ohne Fehlversuch zählt als „ohne Fehler")
  const recorded = useRef(false)
  useEffect(() => {
    if (!finished || recorded.current) return
    recorded.current = true
    recordAttempt({ course, level, mode: 'guided', clean: mistakes === 0 })
  }, [finished, course, level, mistakes])

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

      <TaskHeader course={course} mix={mix} task={task} stepIndex={stepIndex} />

      {finished ? (
        <FinishView course={course} mix={mix} task={task} mistakes={mistakes} focus={focus} />
      ) : (
        <StepView
          key={stepIndex}
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
}

function StepView({ step, task, report, isLast, mode, detail, onMistake, onNext }: StepProps) {
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [reported, setReported] = useState(false)
  const questionRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // Neuer Schritt: Fokus auf die Frage (für Tastatur und Vorlesehilfen)
  useEffect(() => {
    questionRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (solved || wrongPicks.length > 0) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [solved, wrongPicks.length, whyOpen])

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

  const lastWrong = step.choices.find((c) => c.id === wrongPicks.at(-1))

  return (
    <section className="animate-step-in space-y-5" aria-labelledby="question">
      <div className="space-y-1">
        <RichText text={step.title} className="block text-sm font-medium text-accent-700" inline />
        <h1 id="question" ref={questionRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          <RichText text={step.question} inline />
        </h1>
      </div>

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
        {solved ? (
          <div className="animate-step-in space-y-4 rounded-2xl bg-green-50 p-4">
            <p className="text-lg font-semibold text-green-800">
              <CheckBadge />
              Richtig!
            </p>
            {mode !== 'off' && <RichText text={step.explanation[mode]} className="text-zinc-800" />}
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              {isLast ? 'Ergebnis ansehen' : 'Weiter'}
            </button>
          </div>
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

// Eine Formel als Antwort setzt sich kleiner, bis sie passt; Text mit Formeln bricht um wie ein Satz
function ChoiceContent({ choice }: { choice: Choice }) {
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

type FinishProps = { course: string; mix: string | null; task: GuidedTaskBase; mistakes: number; focus: string | null }

function FinishView({ course, mix, task, mistakes, focus }: FinishProps) {
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
            : `Gelöst mit ${mistakes} ${mistakes === 1 ? 'Fehlversuch' : 'Fehlversuchen'}.`}
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
              <p className="text-sm text-zinc-600">Richtige Antwort</p>
              <RichText text={task.resultText!} className="text-xl font-medium" />
            </>
          )}
          {task.resultNote && <RichText text={task.resultNote} className="text-zinc-600" />}
        </div>
      )}
      {/* In der Mischung kein Vorschlag für eine höhere Stufe: Die Stufe gilt dort für alle Themen */}
      {!mix && <LevelUpSuggestion course={course} level={task.ref.level} mode="guided" />}
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={mix ? mixPracticeHref(mix, task.ref.level) : practiceHref(course, task.ref.level, 'guided', focus)}
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
