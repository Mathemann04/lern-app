import { useMemo, useState } from 'react'
import { findError } from '../../engine/errorCatalog.ts'
import { type Card, type CardExample as Example, type ChemCardExample, type MathCardExample, type VectorCardExample, examplesFor, isChemExample, isVectorExample } from '../../engine/explain/cards.ts'
import { buildVectorTask } from '../../engine/linalg/vectorTasks.ts'
import { blockSeed } from '../../engine/tasks/taskNumber.ts'
import { FalkScheme } from '../draw/FalkScheme.tsx'
import { SarrusScheme } from '../draw/SarrusScheme.tsx'
import { VectorFigure } from '../draw/VectorFigure.tsx'
import { cardExample } from '../../engine/explain/example.ts'
import type { Expr } from '../../engine/expr/types.ts'
import { useProgress } from '../../state/progress.ts'
import { useSettings } from '../../state/settings.ts'
import { ErrorShape } from '../ErrorShape.tsx'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { courseOfCards, playableLevel } from '../catalog.ts'
import { practiceHref } from '../routes.ts'
import { ChemFigure } from '../chem/ChemFigure.tsx'

// Inhalt einer Lernkarte: Formel, Merksatz, wann man die Regel braucht, ein durchgerechnetes
// Beispiel (von der Engine; bei Wissenskarten in Chemie als Text) und die typischen Fehler. Karten
// ohne Formel (Wissenskarten) haben keinen Formel-Kasten.
// heading: Ebene der Abschnitts-Überschriften; practice: Knöpfe „Gezielt üben" zeigen
// (nicht innerhalb einer Aufgabe, sonst ginge sie verloren); task: die Aufgabe, aus der die
// Karte geöffnet wurde (deren Teile kommen nicht als Beispiel)

type Heading = 'h2' | 'h3' | 'h4'
type Props = { card: Card; heading: Heading; practice: boolean; task?: Expr }

export function CardBody({ card, heading: H, practice, task }: Props) {
  const headingClass = 'text-sm font-semibold text-accent-700'
  return (
    <div className="space-y-6">
      {card.formulas.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-accent-50 px-4 py-4" aria-label="Formel">
          {card.formulas.map((tex) => (
            <FitWidth key={tex} className="text-xl">
              <Formula tex={tex} />
            </FitWidth>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <H className={headingClass}>Merksatz</H>
        <RichText text={card.memo} className="text-lg font-medium" />
        {card.note && <RichText text={card.note} className="text-zinc-600" />}
      </section>

      {card.figures?.map((id) => <ChemFigure key={id} id={id} />)}

      {card.when && (
        <section className="space-y-2">
          <H className={headingClass}>Wann brauchst du sie?</H>
          <RichText text={card.when} className="text-zinc-700" />
        </section>
      )}

      <CardExample key={card.id} examples={examplesFor(card, task)} heading={H} headingClass={headingClass} />

      {card.errors.length > 0 && <CardErrors card={card} heading={H} headingClass={headingClass} practice={practice} />}
    </div>
  )
}

function CardExample({ examples, heading: H, headingClass }: { examples: readonly Example[]; heading: Heading; headingClass: string }) {
  const [index, setIndex] = useState(0)
  const current = examples[index]
  return (
    <section className="space-y-3" aria-label="Beispiel">
      <div className="flex items-baseline justify-between gap-3">
        <H className={headingClass}>Beispiel</H>
        {examples.length > 1 && (
          <p className="text-sm text-zinc-500">
            {index + 1} von {examples.length}
          </p>
        )}
      </div>
      {isChemExample(current) ? (
        <ChemExample key={index} example={current} />
      ) : isVectorExample(current) ? (
        <VectorExample key={index} example={current} />
      ) : (
        <WorkedExample key={index} example={current} />
      )}
      {examples.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % examples.length)}
          className="rounded-xl border border-accent-600 px-4 py-2.5 font-medium text-accent-800 hover:bg-accent-50"
        >
          Anderes Beispiel
        </button>
      )}
    </section>
  )
}

// Von der Engine durchgerechnet (Mathe)
function WorkedExample({ example: e }: { example: MathCardExample }) {
  const example = useMemo(() => cardExample(e), [e])
  return (
    <>
      <FitWidth className="text-xl">
        <Formula tex={example.functionLatex} />
      </FitWidth>
      <ol className="space-y-3 border-l-2 border-accent-200 pl-4">
        {example.lines.map((line, i) => (
          <li key={i} className="space-y-1">
            <RichText text={line.label} className="text-sm text-zinc-600" inline />
            <FitWidth className="text-lg">
              <Formula tex={line.latex} />
            </FitWidth>
          </li>
        ))}
      </ol>
    </>
  )
}

// Vektoren (M7): Aufgabe des Baukastens mit Bild und den Zeilen des Rechenwegs, von der Engine gerechnet
function VectorExample({ example }: { example: VectorCardExample }) {
  const task = useMemo(() => buildVectorTask({ level: example.vector.level, seed: blockSeed('rechnen', example.vector.seed) }, example.vector.kind), [example])
  // Falk-Schema (Schritt 8b): das des ganzen Produkts, also des letzten Schritts mit Schema
  const falk = task.steps.findLast((s) => s.falk)?.falk
  // Sarrus (Schritt 9b): nur bei genau einem Schritt mit Sarrus (sonst wäre unklar, welche Determinante gemeint ist)
  const sarrusSteps = task.steps.filter((s) => s.sarrus)
  const sarrus = sarrusSteps.length === 1 ? sarrusSteps[0].sarrus : undefined
  // Bild: zum Ergebnis oder (Gauß, Schritt 10b) das des ersten Schritts mit Bild nach der Antwort
  const picture = example.vector.picture === 'step' ? task.steps.find((s) => s.solvedDrawing)?.solvedDrawing : task.resultDrawing
  return (
    <>
      <RichText text={task.instruction} className="text-lg font-medium" />
      {task.functionLatex && (
        <FitWidth className="text-lg">
          <Formula tex={task.functionLatex} />
        </FitWidth>
      )}
      {picture && <VectorFigure drawing={picture} />}
      {falk && <FalkScheme falk={falk} done />}
      {sarrus && <SarrusScheme sarrus={sarrus} done />}
      <ol className="space-y-3 border-l-2 border-accent-200 pl-4">
        {task.steps.map((step) => (
          <li key={step.id} className="space-y-1">
            <RichText text={step.title} className="text-sm text-zinc-600" inline />
            {(Array.isArray(step.established) ? step.established : step.established ? [step.established] : []).map((line) => (
              <FitWidth key={line} className="text-lg">
                <Formula tex={line} />
              </FitWidth>
            ))}
          </li>
        ))}
      </ol>
    </>
  )
}

// Wissenskarte (Chemie): Aufgabe als Text, Lösung in Zeilen mit Beschriftung und optional einer Formel
function ChemExample({ example }: { example: ChemCardExample }) {
  return (
    <>
      <RichText text={example.chemTask} className="text-lg font-medium" />
      <ol className="space-y-3 border-l-2 border-accent-200 pl-4">
        {example.lines.map((line, i) => (
          <li key={i} className="space-y-1">
            {/* Alle Beschriftungen gleich, ob mit Formel darunter oder ohne (in Aufzählungen sonst ungleich) */}
            <RichText text={line.label} className="block text-zinc-800" inline />
            {line.latex !== undefined && (
              <FitWidth className="text-lg">
                <Formula tex={line.latex} />
              </FitWidth>
            )}
          </li>
        ))}
      </ol>
    </>
  )
}

function CardErrors({ card, heading: H, headingClass, practice }: Props & { headingClass: string }) {
  const { errors } = useProgress()
  const settings = useSettings()
  // Gezielt üben im Thema der Karte, wenn es das dort gibt
  const course = courseOfCards(card.topic)?.course
  const canPractice = practice && course?.focus === true
  return (
    <section className="space-y-3">
      <H className={headingClass}>Typische Fehler</H>
      <ul className="space-y-3">
        {card.errors.map((id) => {
          const rule = findError(id)!
          const times = errors[id] ?? 0
          return (
            <li key={id} className="space-y-2 rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <RichText text={rule.name} className="block font-medium" inline />
                {times > 0 && <p className="shrink-0 text-sm text-amber-800">Dir {times}-mal passiert</p>}
              </div>
              <ErrorShape error={rule} />
              {canPractice && (
                <a
                  href={practiceHref(course.id, playableLevel(course, settings.levels[course.id]), course.free ? settings.practiceMode : 'guided', id)}
                  className="-ml-3 inline-block rounded-xl px-3 py-2.5 font-medium text-accent-700 hover:bg-accent-50"
                >
                  Gezielt üben
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
