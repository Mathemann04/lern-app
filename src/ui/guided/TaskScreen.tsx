import { useEffect, useMemo, useRef, useState } from 'react'
import type { Choice, GuidedStep, GuidedTask } from '../../engine/guided/plan.ts'
import { planGuidedTask } from '../../engine/guided/plan.ts'
import type { TaskRef } from '../../engine/tasks/taskNumber.ts'
import type { ExplanationDetail } from '../../state/storage.ts'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { practiceHref } from '../routes.ts'
import { TaskIntro, TaskTopBar } from '../task/TaskParts.tsx'
import { type ExplanationMode, useExplanationMode } from '../task/explanationMode.ts'

export function TaskScreen({ taskRef }: { taskRef: TaskRef }) {
  const { level, seed } = taskRef
  const task = useMemo(() => planGuidedTask({ level, seed }), [level, seed])
  const { mode, detail, cycle } = useExplanationMode()
  const [stepIndex, setStepIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const finished = stepIndex >= task.steps.length

  return (
    <main className="space-y-6">
      <TaskTopBar mode={mode} onCycleMode={cycle}>
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

      <TaskHeader task={task} stepIndex={stepIndex} />

      {finished ? (
        <FinishView task={task} mistakes={mistakes} />
      ) : (
        <StepView
          key={stepIndex}
          step={task.steps[stepIndex]}
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

function TaskHeader({ task, stepIndex }: { task: GuidedTask; stepIndex: number }) {
  const established = task.steps.slice(0, stepIndex).flatMap((s) => (s.established ? [s.established] : []))
  return (
    <section className="space-y-3">
      <TaskIntro taskRef={task.ref} functionLatex={task.functionLatex} />
      {established.length > 0 && (
        <div className="space-y-1 rounded-xl bg-zinc-50 px-4 py-3" aria-label="Bisher">
          <p className="text-sm text-zinc-500">Bisher</p>
          {established.map((line) => (
            <div key={line} className="overflow-x-auto">
              <Formula tex={line} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

type StepProps = {
  step: GuidedStep
  isLast: boolean
  mode: ExplanationMode
  detail: ExplanationDetail
  onMistake: () => void
  onNext: () => void
}

function StepView({ step, isLast, mode, detail, onMistake, onNext }: StepProps) {
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [solved, setSolved] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
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
      setWrongPicks((picks) => [...picks, choice.id])
      setWhyOpen(false)
      onMistake()
    }
  }

  const lastWrong = step.choices.find((c) => c.id === wrongPicks.at(-1))

  return (
    <section className="animate-step-in space-y-5" aria-labelledby="question">
      <div className="space-y-1">
        <p className="text-sm font-medium text-accent-700">{step.title}</p>
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
                  ? 'border-green-600 bg-green-50'
                  : isWrong
                    ? 'border-red-300 bg-red-50 opacity-70'
                    : solved
                      ? 'border-zinc-200 opacity-50'
                      : 'border-zinc-200 bg-white hover:border-accent-600 active:bg-accent-50'
              }`}
            >
              <span className="block min-w-0 flex-1 overflow-x-auto">
                <RichText text={choice.content} className="block text-lg font-medium" inline />
                {choice.caption && <RichText text={choice.caption} className="mt-1 block text-sm text-zinc-500" inline />}
              </span>
              {isRight && <span className="text-xl text-green-700" aria-hidden>✓</span>}
              {isWrong && <span className="text-xl text-red-700" aria-hidden>✗</span>}
            </button>
          )
        })}
      </div>

      {!solved && (
        <div>
          {hintOpen ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
              <p className="mb-1 text-sm font-semibold text-amber-800">Tipp</p>
              <RichText text={step.hint} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHintOpen(true)}
              className="rounded-xl px-3 py-2 font-medium text-amber-800 hover:bg-amber-50"
            >
              Tipp anzeigen
            </button>
          )}
        </div>
      )}

      <div ref={feedbackRef} aria-live="polite">
        {solved ? (
          <div className="animate-step-in space-y-4 rounded-2xl bg-green-50 p-4">
            <p className="text-lg font-semibold text-green-800">Richtig!</p>
            {mode !== 'off' && <RichText text={step.explanation[mode]} className="text-zinc-800" />}
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-white hover:bg-accent-800"
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
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 font-medium text-red-800 hover:bg-red-100"
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

function FinishView({ task, mistakes }: { task: GuidedTask; mistakes: number }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  return (
    <section className="animate-step-in space-y-5">
      <div className="space-y-1">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
          Geschafft!
        </h1>
        <p className="text-zinc-600">
          {mistakes === 0
            ? 'Alles beim ersten Versuch richtig.'
            : `Gelöst mit ${mistakes} ${mistakes === 1 ? 'Fehlversuch' : 'Fehlversuchen'}.`}
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-accent-50 px-4 py-4 text-2xl" data-testid="result">
        <Formula tex={task.resultLatex} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={practiceHref(task.ref.level)}
          className="flex-1 rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-white hover:bg-accent-800"
        >
          Nächste Aufgabe
        </a>
        <a href="#/" className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-center text-lg font-medium hover:bg-zinc-50">
          Zur Startseite
        </a>
      </div>
    </section>
  )
}
