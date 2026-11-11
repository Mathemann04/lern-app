import { useEffect, useMemo, useState } from 'react'
import { figureById } from '../../engine/chem/figures.ts'
import { FigureDrawing } from '../chem/ChemFigure.tsx'
import { chemErrorInfo, chemExamTask } from '../../engine/chem/exam/index.ts'
import { type ExamResult, type ItemResult, type ItemState, examState, gradeExam, totalPoints, withAnswer } from '../../engine/exam/grade.ts'
import type { ExamAnswers, ExamPart } from '../../engine/exam/types.ts'
import { recordError } from '../../state/progress.ts'
import { CardSheetButton } from '../cards/CardSheet.tsx'
import { examAreaOf } from '../catalog.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { areaHref, examTaskHref } from '../routes.ts'

// „Klausuraufgabe N üben" (Plan M4, S4c): alle Teile einer Klausuraufgabe am Stück, ohne Zeit. Bis zur
// Abgabe zeigt die App nicht, was stimmt; danach Punkte je Teil und Frage, Folgefehler, Lösungsweg und
// „Warum ist das falsch?". Erkannte Fehler zählen in die Fehlerstatistik.

const decimal = (n: number) => String(n).replace('.', ',')
const points = (n: number) => `${decimal(n)} ${n === 1 ? 'Punkt' : 'Punkte'}`
// „1 von 2 Punkten", „1 von 1 Punkt"
const pointsOf = (earned: number, max: number) => `${decimal(earned)} von ${decimal(max)} ${max === 1 ? 'Punkt' : 'Punkten'}`

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

  const submit = () => {
    const graded = gradeExam(task, answers)
    for (const part of graded.parts) for (const r of part.items) if (r.status === 'falsch' && r.chosen?.errorRuleId) recordError(r.chosen.errorRuleId)
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
            Wie in der Klausur, nur ohne Zeit: Wähle zu jeder Frage eine Antwort. Was stimmt, zeigt die Auswertung nach der Abgabe; Folgefehler zählen nicht doppelt.
          </p>
        )}
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
          <PartResultView key={part.id} part={part} result={result.parts.find((p) => p.part.id === part.id)!} />
        ) : (
          <PartView
            key={part.id}
            part={part}
            states={states.filter((s) => part.items.includes(s.item))}
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

function PartHeader({ part, earned }: { part: ExamPart; earned?: number }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">
        {part.id})
        <span className="ml-2 text-sm font-medium text-zinc-500">
          {earned === undefined ? points(part.points) : pointsOf(earned, part.points)}
        </span>
      </h2>
      <RichText text={part.prompt} />
    </div>
  )
}

function PartView({ part, states, onPick }: { part: ExamPart; states: ItemState[]; onPick: (itemId: string, optionId: string) => void }) {
  return (
    <section className="space-y-4" aria-label={`Teil ${part.id}`}>
      <PartHeader part={part} />
      {states.map(({ item, build, chosen }) => (
        <div key={item.id} className="space-y-2" data-testid="exam-item">
          <p className="font-medium">
            <RichText text={item.question} inline />
            <span className="ml-2 text-sm font-normal text-zinc-500">({points(item.points)})</span>
          </p>
          {build ? (
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Antworten">
              {build.options.map((option) => {
                const selected = chosen?.id === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onPick(item.id, option.id)}
                    className={`flex min-h-11 w-full items-center rounded-2xl border-2 px-4 py-2 text-left transition-colors ${
                      selected ? 'border-accent-600 bg-accent-50' : 'border-zinc-200 bg-surface hover:border-accent-600'
                    }`}
                  >
                    {option.figure && figureById(option.figure) ? (
                      <span className="block w-full py-1">
                        <FigureDrawing figure={figureById(option.figure)!} label={option.content} />
                      </span>
                    ) : /^\$[^$]+\$$/.test(option.content) ? (
                      // eine einzelne Formel setzt sich kleiner, bis sie passt; Text bricht um
                      <FitWidth>
                        <RichText text={option.content} inline />
                      </FitWidth>
                    ) : (
                      <span className="block min-w-0">
                        <RichText text={option.content} inline />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Kommt, sobald die Fragen davor beantwortet sind.</p>
          )}
        </div>
      ))}
    </section>
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

const STATUS: Record<ItemResult['status'], { label: string; className: string }> = {
  richtig: { label: 'Richtig', className: 'bg-green-50 text-green-800' },
  folgefehler: { label: 'Richtig weitergerechnet (Folgefehler)', className: 'bg-green-50 text-green-800' },
  teilweise: { label: 'Teilweise richtig', className: 'bg-amber-50 text-amber-800' },
  falsch: { label: 'Falsch', className: 'bg-red-50 text-red-800' },
  offen: { label: 'Nicht beantwortet', className: 'bg-zinc-100 text-zinc-600' },
}

function PartResultView({ part, result }: { part: ExamPart; result: ExamResult['parts'][number] }) {
  return (
    <section className="space-y-4" aria-label={`Teil ${part.id}`}>
      <PartHeader part={part} earned={result.points} />
      {result.items.map((r) => (
        <ItemResultView key={r.item.id} result={r} />
      ))}
    </section>
  )
}

function ItemResultView({ result: r }: { result: ItemResult }) {
  const status = STATUS[r.status]
  const info = r.status === 'falsch' && r.chosen?.errorRuleId ? chemErrorInfo(r.chosen.errorRuleId) : null
  const why = r.chosen?.why ?? info?.why
  const error = info && why ? { name: info.name, why } : null
  return (
    <div className="space-y-2 rounded-2xl border border-zinc-200 px-4 py-3">
      <p className="font-medium">
        <RichText text={r.item.question} inline />
        <span className="ml-2 text-sm font-normal text-zinc-500">
          {pointsOf(r.points, r.item.points)}
        </span>
      </p>
      <p className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ${status.className}`}>{status.label}</p>
      {r.chosen && (
        <p className="text-zinc-700">
          Deine Antwort: <RichText text={r.chosen.content} inline />
        </p>
      )}
      {r.status !== 'richtig' && (
        <p className="text-zinc-700">
          Richtig: <RichText text={r.correct.content} inline />
        </p>
      )}
      {r.status === 'teilweise' && r.chosen?.share && <p className="text-sm text-zinc-600">Halbe Punkte: {r.chosen.share.reason}.</p>}
      {r.status === 'folgefehler' && <p className="text-sm text-zinc-600">Du hast mit deinem Ergebnis von vorher richtig weitergerechnet. Dafür gibt es die vollen Punkte.</p>}
      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-zinc-800">
          <p className="text-sm font-semibold text-red-800">
            Warum ist das falsch? <RichText text={error.name} inline />
          </p>
          <RichText text={error.why.detailed} className="text-sm" />
        </div>
      )}
      <details className="text-sm text-zinc-700">
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-accent-700">Lösungsweg</summary>
        <RichText text={r.explanation.detailed} />
        {r.ownExplanation && (
          <p className="mt-2">
            Mit deinen Werten: <RichText text={r.ownExplanation.detailed} inline />
          </p>
        )}
      </details>
      <CardSheetButton ids={r.item.cards} title="Lernkarten" />
    </div>
  )
}
