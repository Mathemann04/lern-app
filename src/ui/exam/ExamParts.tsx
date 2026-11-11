import { useState } from 'react'
import { chemErrorInfo } from '../../engine/chem/exam/index.ts'
import { figureById } from '../../engine/chem/figures.ts'
import { type ExamResult, type ItemResult, type ItemState, numberAnswer, typedText } from '../../engine/exam/grade.ts'
import type { ExamAnswers, ExamPart } from '../../engine/exam/types.ts'
import { updateSettings } from '../../state/settings.ts'
import type { PracticeMode } from '../../state/storage.ts'
import { CardSheetButton } from '../cards/CardSheet.tsx'
import { FigureDrawing } from '../chem/ChemFigure.tsx'
import { FitWidth } from '../FitWidth.tsx'
import { NumberAnswer } from '../numeric/NumberAnswer.tsx'
import { RichText } from '../RichText.tsx'
import { points, pointsOf, typedContent } from './examText.ts'

// Teile einer Klausuraufgabe zum Beantworten und in der Auswertung; gemeinsam für „Klausuraufgabe N üben"
// (ExamTaskPage.tsx) und die Probeklausur (MockExamPage.tsx).

export function PartHeader({ part, earned }: { part: ExamPart; earned?: number }) {
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

// Auswählen oder Eintippen (dieselbe Einstellung wie „Geführt"/„Frei" beim Üben)
export function ModeSwitch({ mode }: { mode: PracticeMode }) {
  const options: [PracticeMode, string][] = [
    ['guided', 'Auswählen'],
    ['free', 'Eintippen'],
  ]
  return (
    <div className="flex gap-1 rounded-xl bg-zinc-100 p-1" role="group" aria-label="Zahlen">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => updateSettings({ practiceMode: value })}
          className={`min-h-11 flex-1 rounded-lg px-3 font-medium ${mode === value ? 'bg-raised text-accent-700 shadow-sm dark:text-accent-800' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export type PartViewProps = { part: ExamPart; states: ItemState[]; free: boolean; answers: ExamAnswers; onPick: (itemId: string, optionId: string) => void }

export function PartView({ part, states, free, answers, onPick }: PartViewProps) {
  // Frage, deren Ziffernblock offen ist (immer nur einer: die Tastatur des Laptops gilt ihm)
  const [editing, setEditing] = useState<string | null>(null)
  // aufgedeckte Fragen, die man zuerst auf Papier löst (paperFirst); beantwortete bleiben aufgedeckt
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set())
  return (
    <section className="space-y-4" aria-label={`Teil ${part.id}`}>
      <PartHeader part={part} />
      {states.map(({ item, build, chosen }) => (
        <div key={item.id} className="space-y-2" data-testid="exam-item">
          <p className="font-medium">
            <RichText text={item.question} inline />
            <span className="ml-2 text-sm font-normal text-zinc-500">({points(item.points)})</span>
          </p>
          {build && free && build.numeric ? (
            editing === item.id ? (
              <NumberAnswer
                answer={build.numeric}
                disabled={false}
                submitLabel="Übernehmen"
                initial={typedText(answers[item.id]) ?? undefined}
                onSubmit={(_, text) => {
                  onPick(item.id, numberAnswer(text))
                  setEditing(null)
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {typedText(answers[item.id]) !== null ? (
                  <p data-testid="typed-answer">
                    Deine Zahl: <RichText text={typedContent(typedText(answers[item.id])!, build.numeric.unit)} inline />
                  </p>
                ) : chosen ? (
                  <p>
                    Gewählt: <RichText text={chosen.content} inline />
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditing(item.id)}
                  className="min-h-11 rounded-xl border-2 border-accent-600 px-4 font-medium text-accent-700 hover:bg-accent-50"
                >
                  {chosen ? 'Ändern' : 'Zahl eintippen'}
                </button>
              </div>
            )
          ) : build && item.paperFirst && !revealed.has(item.id) && answers[item.id] === undefined ? (
            // in der Klausur selbst geschrieben: erst auf Papier lösen, dann die Antworten zeigen
            <div className="space-y-2 rounded-2xl bg-zinc-100 px-4 py-3" data-testid="paper-first">
              <p className="text-sm text-zinc-700">In der Klausur schreibst du das selbst hin. Löse es zuerst auf Papier, dann vergleiche mit den Antworten.</p>
              <button
                type="button"
                onClick={() => setRevealed((r) => new Set([...r, item.id]))}
                className="min-h-11 rounded-xl border-2 border-accent-600 px-4 font-medium text-accent-700 hover:bg-accent-50"
              >
                Auf Papier gelöst, Antworten zeigen
              </button>
            </div>
          ) : build ? (
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

const STATUS: Record<ItemResult['status'], { label: string; className: string }> = {
  richtig: { label: 'Richtig', className: 'bg-green-50 text-green-800' },
  folgefehler: { label: 'Richtig weitergerechnet (Folgefehler)', className: 'bg-green-50 text-green-800' },
  teilweise: { label: 'Teilweise richtig', className: 'bg-amber-50 text-amber-800' },
  falsch: { label: 'Falsch', className: 'bg-red-50 text-red-800' },
  offen: { label: 'Nicht beantwortet', className: 'bg-zinc-100 text-zinc-600' },
}

export type PartResultProps = { part: ExamPart; result: ExamResult['parts'][number]; answers: ExamAnswers; states: ItemState[] }

export function PartResultView({ part, result, answers, states }: PartResultProps) {
  return (
    <section className="space-y-4" aria-label={`Teil ${part.id}`}>
      <PartHeader part={part} earned={result.points} />
      {result.items.map((r) => {
        const text = typedText(answers[r.item.id])
        const unit = states.find((s) => s.item.id === r.item.id)?.build?.numeric?.unit ?? ''
        return <ItemResultView key={r.item.id} result={r} typed={text === null ? null : typedContent(text, unit)} />
      })}
    </section>
  )
}

// typed: eingetippte Zahl (Text mit Formel), sonst null
function ItemResultView({ result: r, typed }: { result: ItemResult; typed: string | null }) {
  const status = STATUS[r.status]
  const info = r.status === 'falsch' && r.chosen?.errorRuleId ? chemErrorInfo(r.chosen.errorRuleId) : null
  const why = r.chosen?.why ?? info?.why
  // falsche Antwort ohne typischen Fehler (weitere Antwort einer Klausurfrage): Erklärung ohne Namen
  const error = info && why ? { name: info.name, why } : r.status === 'falsch' && why ? { name: '', why } : null
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
          Deine Antwort: <RichText text={typed ?? r.chosen.content} inline />
        </p>
      )}
      {r.close && (
        <p className="text-sm text-amber-800">
          {r.points < r.item.points
            ? 'Knapp daneben: Prüfe deine Rundung. In der Probeklausur gibt das nur die halben Punkte, wie oft in der echten Klausur.'
            : 'Knapp daneben: Prüfe deine Rundung. Das gibt hier trotzdem die vollen Punkte.'}
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
            Warum ist das falsch?{error.name && <> <RichText text={error.name} inline /></>}
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
