import { useEffect, useMemo, useState } from 'react'
import { chemExamTask } from '../../engine/chem/exam/index.ts'
import { type ExamResult, examState, gradeExam, totalPoints, truthOf, withAnswer } from '../../engine/exam/grade.ts'
import type { ExamAnswers } from '../../engine/exam/types.ts'
import { addExamPractice } from '../../state/examPractice.ts'
import { useSettings } from '../../state/settings.ts'
import { examAreaOf } from '../catalog.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { areaHref, examTaskHref } from '../routes.ts'
import { ModeSwitch, PartResultView, PartView } from './ExamParts.tsx'
import { decimal, pointsOf, recordExamResult } from './examText.ts'

// „Klausuraufgabe N üben" (Plan M4, S4c): alle Teile einer Klausuraufgabe am Stück, ohne Zeit. Bis zur
// Abgabe zeigt die App nicht, was stimmt; danach Punkte je Teil und Frage, Folgefehler, Lösungsweg und
// „Warum ist das falsch?". Erkannte Fehler zählen in die Fehlerstatistik. Frei (S8c, Schalter „Eintippen", dieselbe
// Einstellung wie „Geführt"/„Frei"): Zahlen werden über den Ziffernblock eingetippt, ohne Rückmeldung bis zur Abgabe.

export default function ExamTaskPage({ subject, task: taskNo, seed }: { subject: string; task: number; seed: number | null }) {
  const { area } = examAreaOf(subject, taskNo)!
  // ohne Nummer: würfeln und weiterleiten, damit Neuladen dieselbe Aufgabe zeigt
  useEffect(() => {
    if (seed === null) window.location.replace(examTaskHref(subject, taskNo, 1 + Math.floor(Math.random() * 999_999)))
  }, [seed, subject, taskNo])
  if (seed === null) return null
  return <ExamTaskView subject={subject} taskNo={taskNo} seed={seed} areaId={area.id} areaTitle={area.title} />
}

function ExamTaskView({ subject, taskNo, seed, areaId, areaTitle }: { subject: string; taskNo: number; seed: number; areaId: string; areaTitle: string }) {
  const task = useMemo(() => chemExamTask(taskNo, seed)!, [taskNo, seed])
  const [answers, setAnswers] = useState<ExamAnswers>({})
  const [result, setResult] = useState<ExamResult | null>(null)
  const [confirming, setConfirming] = useState(false)
  const states = useMemo(() => examState(task, answers), [task, answers])
  const open = states.filter((s) => !s.chosen).length
  const max = totalPoints(task)
  // Eintippen nur, wo es Zahlen gibt
  const hasNumbers = useMemo(() => [...truthOf(task).values()].some((t) => t.build.numeric), [task])
  const { practiceMode } = useSettings()
  const free = hasNumbers && practiceMode === 'free'

  const submit = () => {
    const graded = gradeExam(task, answers)
    recordExamResult(graded)
    // für „wie sicher" im Klausur-Überblick (S11), mit den Punkten der Auswertung
    addExamPractice({ subject, task: taskNo, points: graded.points, max: graded.max, at: Date.now() })
    setResult(graded)
    window.scrollTo(0, 0)
  }

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <a href={areaHref(areaId)} aria-label="Aufgabe beenden" className="-my-1 -ml-3 rounded-lg p-3 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </a>
          <p className="text-sm text-zinc-500">
            {areaTitle} · Klausuraufgabe {taskNo} üben · {max} Punkte
          </p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight hyphens-auto">{task.title}</h1>
        {!result && (
          <p className="text-pretty text-zinc-600">
            Wie in der Klausur, nur ohne Zeit: {free ? 'Tippe Zahlen selbst ein, sonst wähle eine Antwort.' : 'Wähle zu jeder Frage eine Antwort.'} Was stimmt,
            zeigt die Auswertung nach der Abgabe; Folgefehler zählen nicht doppelt.
          </p>
        )}
        {!result && hasNumbers && <ModeSwitch mode={free ? 'free' : 'guided'} />}
      </div>

      {result && <Summary result={result} subject={subject} taskNo={taskNo} areaId={areaId} areaTitle={areaTitle} />}

      <section className="space-y-3 rounded-2xl bg-zinc-100 px-4 py-4" aria-label="Aufgabe">
        <RichText text={task.intro} />
        {task.givenLatex && (
          <FitWidth className="text-xl">
            <Formula tex={task.givenLatex} />
          </FitWidth>
        )}
        <RichText text={task.note} className="text-sm text-zinc-600" />
      </section>

      {task.parts.map((part) =>
        result ? (
          <PartResultView key={part.id} part={part} result={result.parts.find((p) => p.part.id === part.id)!} answers={answers} states={states} />
        ) : (
          <PartView
            key={part.id}
            part={part}
            states={states.filter((s) => part.items.includes(s.item))}
            free={free}
            answers={answers}
            onPick={(itemId, optionId) => {
              setAnswers((a) => withAnswer(task, a, itemId, optionId))
              setConfirming(false)
            }}
          />
        ),
      )}

      {!result && (
        <div className="space-y-3">
          {confirming && open > 0 && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-zinc-800">
              Noch {open === 1 ? 'eine Frage' : `${open} Fragen`} offen. Offene Fragen geben keine Punkte. Trotzdem abgeben?
            </p>
          )}
          <button
            type="button"
            onClick={() => (open > 0 && !confirming ? setConfirming(true) : submit())}
            className="min-h-11 w-full rounded-2xl bg-accent-700 px-4 py-3 font-semibold text-on-accent hover:bg-accent-800"
          >
            {confirming && open > 0 ? 'Ja, abgeben' : 'Abgeben'}
          </button>
        </div>
      )}

      {result && <NextLinks subject={subject} taskNo={taskNo} areaId={areaId} areaTitle={areaTitle} />}
    </main>
  )
}

function Summary({ result, subject, taskNo, areaId, areaTitle }: { result: ExamResult; subject: string; taskNo: number; areaId: string; areaTitle: string }) {
  return (
    <section className="space-y-3 rounded-2xl border-2 border-accent-600 px-4 py-4" aria-label="Ergebnis">
      <p className="text-3xl font-semibold" data-testid="exam-score">
        {pointsOf(result.points, result.max)}
      </p>
      <p className="text-sm text-zinc-600">
        {result.parts.map((p) => `${p.part.id}) ${decimal(p.points)}/${p.part.points}`).join(' · ')}
      </p>
      <p className="text-sm text-zinc-500">Punkte nach dem Schema der App, Teilpunkte geschätzt.</p>
      <NextLinks subject={subject} taskNo={taskNo} areaId={areaId} areaTitle={areaTitle} />
    </section>
  )
}

function NextLinks({ subject, taskNo, areaId, areaTitle }: { subject: string; taskNo: number; areaId: string; areaTitle: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={examTaskHref(subject, taskNo)} className="inline-flex min-h-11 items-center rounded-xl bg-accent-700 px-4 font-semibold text-on-accent hover:bg-accent-800">
        Neue Aufgabe
      </a>
      <a href={areaHref(areaId)} className="inline-flex min-h-11 items-center rounded-xl px-3 font-medium text-accent-700 hover:bg-accent-50">
        Zurück zu {areaTitle}
      </a>
    </div>
  )
}
