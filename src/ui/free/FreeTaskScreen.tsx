import { type ReactNode, useMemo, useRef, useState } from 'react'
import { type Verdict, checkAnswer, prepareAnswerCheck } from '../../engine/check/answer.ts'
import { explainError } from '../../engine/explain/texts.ts'
import { type GuidedStep, planGuidedTask } from '../../engine/guided/plan.ts'
import { generateDerivativeTask } from '../../engine/tasks/derivativeTerms.ts'
import type { TaskRef } from '../../engine/tasks/taskNumber.ts'
import type { ExplanationDetail } from '../../state/storage.ts'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { practiceHref, taskHref } from '../routes.ts'
import { TaskIntro, TaskTopBar } from '../task/TaskParts.tsx'
import { type ExplanationMode, useExplanationMode } from '../task/explanationMode.ts'
import { MathInput } from './MathInput.tsx'

// Freier Modus: Ableitung selbst eintippen. Die Engine prüft auf Gleichwertigkeit, erkennt
// typische Fehler und kann den Lösungsweg Schritt für Schritt aufdecken (aus dem geführten Modus).

export default function FreeTaskScreen({ taskRef }: { taskRef: TaskRef }) {
  const { level, seed } = taskRef
  const { context, plan } = useMemo(() => {
    const { task } = generateDerivativeTask({ level, seed })
    if (task.kind !== 'function') throw new Error('Implizites Ableiten kommt in Schritt 11.')
    return { context: prepareAnswerCheck(task.expr), plan: planGuidedTask({ level, seed }) }
  }, [level, seed])
  const { mode, detail, cycle } = useExplanationMode()
  const [latex, setLatex] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const feedbackRef = useRef<HTMLDivElement>(null)
  // zuletzt geprüfte Eingabe: Die Rückmeldung bleibt, bis sich die Eingabe davon unterscheidet
  const submittedRef = useRef<string | null>(null)
  const solved = verdict?.kind === 'correct'

  function submit(value: string) {
    setLatex(value)
    submittedRef.current = value
    setVerdict(checkAnswer(context, value))
    // Rückmeldung sichtbar machen, auch wenn die Bildschirm-Tastatur offen ist
    requestAnimationFrame(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  return (
    <main className="space-y-6" style={{ paddingBottom: keyboardHeight }}>
      <TaskTopBar mode={mode} onCycleMode={cycle} />

      <section className="space-y-3">
        <TaskIntro taskRef={taskRef} functionLatex={plan.functionLatex} />
      </section>

      <section className="space-y-3" aria-label="Deine Antwort">
        <div className="flex items-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-3 py-2 focus-within:border-accent-600">
          <span className="shrink-0 text-2xl">
            <Formula tex="f'(x) =" />
          </span>
          <MathInput
            label="Deine Ableitung"
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
            className="w-full rounded-xl bg-accent-700 px-4 py-3 text-lg font-medium text-white hover:bg-accent-800"
          >
            Prüfen
          </button>
        )}
      </section>

      <div ref={feedbackRef} aria-live="polite">
        {verdict && <Feedback verdict={verdict} resultLatex={plan.resultLatex} detail={detail} mode={mode} />}
      </div>

      {solved ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={practiceHref(level, 'free')}
            className="flex-1 rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-white hover:bg-accent-800"
          >
            Nächste Aufgabe
          </a>
          <a href="#/" className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-center text-lg font-medium hover:bg-zinc-50">
            Zur Startseite
          </a>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!hintOpen && (
            <button type="button" onClick={() => setHintOpen(true)} className="rounded-xl px-3 py-2 font-medium text-amber-800 hover:bg-amber-50">
              Tipp anzeigen
            </button>
          )}
          {revealed === 0 && (
            <button type="button" onClick={() => setRevealed(1)} className="rounded-xl px-3 py-2 font-medium text-accent-700 hover:bg-accent-50">
              Lösungsweg aufdecken
            </button>
          )}
          <a href={taskHref(taskRef, 'guided')} className="rounded-xl px-3 py-2 font-medium text-accent-700 hover:bg-accent-50">
            Geführt lösen
          </a>
        </div>
      )}

      {hintOpen && !solved && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
          <p className="mb-1 text-sm font-semibold text-amber-800">Tipp</p>
          <RichText text={plan.steps[0].explanation.short} />
        </div>
      )}

      {solved && revealed === 0 && (
        <button type="button" onClick={() => setRevealed(1)} className="rounded-xl px-3 py-2 font-medium text-accent-700 hover:bg-accent-50">
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

function Feedback({ verdict, resultLatex, detail, mode }: { verdict: Verdict; resultLatex: string; detail: ExplanationDetail; mode: ExplanationMode }) {
  const [whyOpen, setWhyOpen] = useState(false)
  switch (verdict.kind) {
    case 'unreadable':
      return (
        <Box tone="amber" title="Das kann ich noch nicht lesen.">
          <RichText text={verdict.message} />
        </Box>
      )
    case 'correct':
      return (
        <Box tone="green" title="Richtig!">
          {mode !== 'off' && <p>Zusammengefasst:</p>}
          <div className="overflow-x-auto text-xl" data-testid="result">
            <Formula tex={resultLatex} />
          </div>
        </Box>
      )
    case 'knownError': {
      const why = explainError(verdict.wrong)
      return (
        <Box tone="red" title="Nicht ganz.">
          <p>
            Typischer Fehler: <span className="font-medium">{verdict.wrong.errorRule.name}</span>.
          </p>
          {whyOpen ? (
            <RichText text={why[detail]} className="text-zinc-800" />
          ) : (
            <button
              type="button"
              onClick={() => setWhyOpen(true)}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 font-medium text-red-800 hover:bg-red-100"
            >
              Warum ist das falsch?
            </button>
          )}
        </Box>
      )
    }
    case 'functionItself':
      return (
        <Box tone="red" title="Nicht ganz.">
          <RichText text="Das ist die Funktion selbst. Gesucht ist ihre Ableitung $f'(x)$." />
        </Box>
      )
    case 'wrongSign':
      return (
        <Box tone="red" title="Fast!">
          <p>Bis auf das Vorzeichen stimmt es. Prüfe, wo ein Minus hingehört.</p>
        </Box>
      )
    case 'wrongFactor':
      return (
        <Box tone="red" title="Fast!">
          <p>Bis auf einen Zahlenfaktor stimmt es. Prüfe die Zahlen vor den Termen.</p>
        </Box>
      )
    case 'wrong':
      return (
        <Box tone="red" title="Das stimmt noch nicht.">
          <p>Rechne noch einmal nach. Wenn du nicht weiterkommst, helfen dir der Tipp, der Lösungsweg oder der geführte Modus.</p>
        </Box>
      )
  }
}

const TONES = {
  green: { box: 'bg-green-50', title: 'text-green-800' },
  red: { box: 'bg-red-50', title: 'text-red-800' },
  amber: { box: 'bg-amber-50', title: 'text-amber-900' },
}

function Box({ tone, title, children }: { tone: keyof typeof TONES; title: string; children: ReactNode }) {
  return (
    <div className={`animate-step-in space-y-3 rounded-2xl p-4 ${TONES[tone].box}`}>
      <p className={`text-lg font-semibold ${TONES[tone].title}`}>{title}</p>
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
              <p className="text-sm font-medium text-accent-700">{step.title}</p>
              <RichText text={step.question} className="block font-medium" />
              <div className="overflow-x-auto rounded-xl bg-accent-50 px-3 py-2 text-lg">
                <RichText text={answer.content} inline />
                {answer.caption && <RichText text={answer.caption} className="mt-1 block text-sm text-zinc-600" inline />}
              </div>
              {mode !== 'off' && <RichText text={step.explanation[mode]} className="text-zinc-700" />}
            </li>
          )
        })}
      </ol>
      {done ? (
        <div className="overflow-x-auto rounded-2xl bg-accent-50 px-4 py-4 text-xl" aria-label="Ergebnis">
          <Formula tex={resultLatex} />
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
