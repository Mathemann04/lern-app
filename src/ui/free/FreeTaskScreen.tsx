import { type ReactNode, useMemo, useRef, useState } from 'react'
import type { FreeVerdict } from '../../engine/check/freeTask.ts'
import type { GuidedStep } from '../../engine/guided/types.ts'
import type { TaskRef } from '../../engine/tasks/taskNumber.ts'
import { recordAttempt, recordError } from '../../state/progress.ts'
import type { ExplanationDetail } from '../../state/storage.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { CardSheetButton, TaskCardLinks } from '../cards/CardSheet.tsx'
import type { CourseEngine } from '../courseEngines.ts'
import { courseHref, practiceHref, taskHref } from '../routes.ts'
import { LevelUpSuggestion } from '../task/LevelUpSuggestion.tsx'
import { CheckBadge, FocusBanner, TaskIntro, TaskTopBar } from '../task/TaskParts.tsx'
import { type ExplanationMode, useExplanationMode } from '../task/explanationMode.ts'
import { MathInput } from './MathInput.tsx'

// Freier Modus: das Ergebnis selbst eintippen. Die Engine des Themas (engine) prüft auf
// Gleichwertigkeit und ob das Ergebnis fertig ist, erkennt typische Fehler und kann den Lösungsweg
// Schritt für Schritt aufdecken (aus dem geführten Modus).

type Props = { course: string; engine: CourseEngine; taskRef: TaskRef; focus?: string | null }

export default function FreeTaskScreen({ course, engine, taskRef, focus = null }: Props) {
  const { level, seed } = taskRef
  const { free, plan } = useMemo(
    () => ({ free: engine.prepareFree({ level, seed }), plan: engine.planGuidedTask({ level, seed }) }),
    [engine, level, seed],
  )
  const { mode, detail, cycle } = useExplanationMode()
  const [latex, setLatex] = useState('')
  const [verdict, setVerdict] = useState<FreeVerdict | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const feedbackRef = useRef<HTMLDivElement>(null)
  // zuletzt geprüfte Eingabe: Die Rückmeldung bleibt, bis sich die Eingabe davon unterscheidet
  const submittedRef = useRef<string | null>(null)
  const solved = verdict?.kind === 'correct'

  // Für den Fortschritt: Gab es eine falsche (lesbare) Antwort oder den aufgedeckten Lösungsweg
  // vor dem Lösen? Typische Fehler je Aufgabe nur einmal zählen.
  const tally = useRef({ mistake: false, helped: false, errors: new Set<string>(), recorded: false })

  function submit(value: string) {
    setLatex(value)
    submittedRef.current = value
    const result = free.check(value)
    setVerdict(result)
    const t = tally.current
    if (result.kind === 'correct') {
      if (!t.recorded) {
        t.recorded = true
        recordAttempt({ course, level, mode: 'free', clean: !t.mistake && !t.helped })
      }
    } else if (result.kind === 'wrong') {
      // Unlesbares und richtig Gerechnetes, das noch nicht fertig ist, zählen nicht als Fehler
      t.mistake = true
      const id = result.error?.id
      if (id && !t.errors.has(id)) {
        t.errors.add(id)
        recordError(id)
      }
    }
    // Rückmeldung sichtbar machen, auch wenn die Bildschirm-Tastatur offen ist
    requestAnimationFrame(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  return (
    <main className="space-y-6" style={{ paddingBottom: keyboardHeight }}>
      <TaskTopBar course={course} mode={mode} onCycleMode={cycle} />

      {focus && <FocusBanner focus={focus} />}

      <section className="space-y-3">
        <TaskIntro taskRef={taskRef} functionLatex={plan.functionLatex} instruction={plan.instruction} note={plan.note} />
      </section>

      <section className="space-y-3" aria-label="Deine Antwort">
        <div className="flex items-center gap-2 rounded-2xl border-2 border-zinc-200 bg-surface px-3 py-2 focus-within:border-accent-600">
          <span className="shrink-0 text-2xl">
            <Formula tex={free.answerLabel} />
          </span>
          <MathInput
            label={free.inputLabel}
            keyboard={free.keyboard}
            readOnly={solved}
            onInput={(value) => {
              setLatex(value)
              if (!solved && value !== submittedRef.current) setVerdict(null)
            }}
            onSubmit={submit}
            onKeyboardHeight={setKeyboardHeight}
          />
        </div>
        {!solved && (
          <button
            type="button"
            onClick={() => submit(latex)}
            className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-on-accent hover:bg-accent-800"
          >
            Prüfen
          </button>
        )}
      </section>

      <div ref={feedbackRef} aria-live="polite">
        {verdict && <Feedback verdict={verdict} resultLatex={plan.resultLatex} resultNote={plan.resultNote} detail={detail} mode={mode} />}
      </div>

      {solved && <LevelUpSuggestion course={course} level={level} mode="free" />}

      {solved ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={practiceHref(course, level, 'free', focus)}
              className="flex-1 rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-on-accent hover:bg-accent-800"
            >
              Nächste Aufgabe
            </a>
            <a href={courseHref(course)} className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-center text-lg font-medium hover:bg-zinc-50">
              Zur Übersicht
            </a>
          </div>
          <TaskCardLinks ids={plan.cards} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!hintOpen && (
            <button type="button" onClick={() => setHintOpen(true)} className="rounded-xl px-3 py-2.5 font-medium text-amber-800 hover:bg-amber-50">
              Tipp anzeigen
            </button>
          )}
          {revealed === 0 && (
            <button
              type="button"
              onClick={() => {
                tally.current.helped = true
                setRevealed(1)
              }}
              className="rounded-xl px-3 py-2.5 font-medium text-accent-700 hover:bg-accent-50"
            >
              Lösungsweg aufdecken
            </button>
          )}
          <CardSheetButton ids={plan.cards} title={plan.cards.length === 1 ? 'Lernkarte zu dieser Aufgabe' : 'Lernkarten zu dieser Aufgabe'}
            task={plan.expr}
          />
          <a href={taskHref(course, taskRef, 'guided', focus)} className="rounded-xl px-3 py-2.5 font-medium text-accent-700 hover:bg-accent-50">
            Geführt lösen
          </a>
        </div>
      )}

      {hintOpen && !solved && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
          <p className="mb-1 text-sm font-semibold text-amber-800">Tipp</p>
          <RichText text={plan.ruleHint.short} />
        </div>
      )}

      {solved && revealed === 0 && (
        <button type="button" onClick={() => setRevealed(1)} className="rounded-xl px-3 py-2.5 font-medium text-accent-700 hover:bg-accent-50">
          Lösungsweg ansehen
        </button>
      )}

      {revealed > 0 && (
        <SolutionPath
          steps={plan.steps}
          revealed={revealed}
          resultLatex={plan.resultLatex}
          mode={mode}
          onNext={() => setRevealed((n) => n + 1)}
        />
      )}
    </main>
  )
}

type FeedbackProps = { verdict: FreeVerdict; resultLatex: string; resultNote?: string; detail: ExplanationDetail; mode: ExplanationMode }

function Feedback({ verdict, resultLatex, resultNote, detail, mode }: FeedbackProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const tone = verdict.kind === 'correct' ? 'green' : verdict.kind === 'wrong' ? 'red' : 'amber'
  return (
    <Box tone={tone} title={verdict.title}>
      {verdict.kind === 'correct' && (
        <>
          {mode !== 'off' && <p>Zusammengefasst:</p>}
          <div data-testid="result">
            <FitWidth className="text-xl">
              <Formula tex={resultLatex} />
            </FitWidth>
          </div>
          {resultNote && <RichText text={resultNote} className="text-zinc-700" />}
        </>
      )}
      {verdict.error && (
        <p>
          Typischer Fehler: <RichText text={`${verdict.error.name}.`} className="font-medium" inline />
        </p>
      )}
      {verdict.message && <RichText text={verdict.message} />}
      {verdict.explanation && <RichText text={verdict.explanation[detail]} className="text-zinc-800" />}
      {verdict.error &&
        (whyOpen ? (
          <RichText text={verdict.error.why[detail]} className="text-zinc-800" />
        ) : (
          <button
            type="button"
            onClick={() => setWhyOpen(true)}
            className="rounded-xl border border-red-200 bg-surface px-4 py-2.5 font-medium text-red-800 hover:bg-red-100"
          >
            Warum ist das falsch?
          </button>
        ))}
    </Box>
  )
}

const TONES = {
  green: { box: 'bg-green-50', title: 'text-green-800' },
  red: { box: 'bg-red-50', title: 'text-red-800' },
  amber: { box: 'bg-amber-50', title: 'text-amber-900' },
}

function Box({ tone, title, children }: { tone: keyof typeof TONES; title: string; children: ReactNode }) {
  return (
    <div className={`animate-step-in space-y-3 rounded-2xl p-4 ${TONES[tone].box}`}>
      <p className={`text-lg font-semibold ${TONES[tone].title}`}>
        {tone === 'green' && <CheckBadge />}
        {title}
      </p>
      {children}
    </div>
  )
}

// Lösungsweg aus dem geführten Modus, Schritt für Schritt aufgedeckt
function SolutionPath({
  steps,
  revealed,
  resultLatex,
  mode,
  onNext,
}: {
  steps: readonly GuidedStep[]
  revealed: number
  resultLatex: string
  mode: ExplanationMode
  onNext: () => void
}) {
  const done = revealed > steps.length
  return (
    <section className="space-y-3" aria-label="Lösungsweg">
      <h2 className="text-xl font-semibold">Lösungsweg</h2>
      <ol className="space-y-3">
        {steps.slice(0, revealed).map((step) => {
          const answer = step.choices.find((c) => c.correct)!
          return (
            <li key={step.id} className="animate-step-in space-y-2 rounded-2xl border border-zinc-200 p-4">
              <RichText text={step.title} className="block text-sm font-medium text-accent-700" inline />
              <RichText text={step.question} className="block font-medium" />
              <div className="rounded-xl bg-accent-50 px-3 py-2">
                <FitWidth className="text-lg">
                  <RichText text={answer.content} inline />
                  {answer.caption && <RichText text={answer.caption} className="mt-1 block text-[0.78em] text-zinc-600" inline />}
                </FitWidth>
              </div>
              {mode !== 'off' && <RichText text={step.explanation[mode]} className="text-zinc-700" />}
            </li>
          )
        })}
      </ol>
      {done ? (
        <div className="rounded-2xl bg-accent-50 px-4 py-4" aria-label="Ergebnis">
          <FitWidth className="text-xl">
            <Formula tex={resultLatex} />
          </FitWidth>
        </div>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-xl border border-accent-600 px-4 py-3 text-lg font-medium text-accent-800 hover:bg-accent-50"
        >
          {revealed === steps.length ? 'Ergebnis zeigen' : 'Nächster Schritt'}
        </button>
      )}
    </section>
  )
}
