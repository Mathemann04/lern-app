import { useMemo, useState } from 'react'
import { errorRule } from '../../engine/derive/errorRules.ts'
import { type Card, examplesFor } from '../../engine/explain/cards.ts'
import { workedExample } from '../../engine/explain/example.ts'
import type { Expr } from '../../engine/expr/types.ts'
import { useProgress } from '../../state/progress.ts'
import { useSettings } from '../../state/settings.ts'
import { FitWidth } from '../FitWidth.tsx'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { practiceHref } from '../routes.ts'

// Inhalt einer Lernkarte: Formel, Merksatz, wann man die Regel braucht, ein durchgerechnetes
// Beispiel (von der Engine) und die typischen Fehler.
// heading: Ebene der Abschnitts-Überschriften; practice: Knöpfe „Gezielt üben" zeigen
// (nicht innerhalb einer Aufgabe, sonst ginge sie verloren); task: die Aufgabe, aus der die
// Karte geöffnet wurde (deren Teile kommen nicht als Beispiel)

type Heading = 'h2' | 'h3' | 'h4'
type Props = { card: Card; heading: Heading; practice: boolean; task?: Expr }

export function CardBody({ card, heading: H, practice, task }: Props) {
  const headingClass = 'text-sm font-semibold text-accent-700'
  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-2xl bg-accent-50 px-4 py-4" aria-label="Formel">
        {card.formulas.map((tex) => (
          <FitWidth key={tex} className="text-xl">
            <Formula tex={tex} />
          </FitWidth>
        ))}
      </div>

      <section className="space-y-2">
        <H className={headingClass}>Merksatz</H>
        <RichText text={card.memo} className="text-lg font-medium" />
        {card.note && <RichText text={card.note} className="text-zinc-600" />}
      </section>

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

function CardExample({ examples, heading: H, headingClass }: { examples: readonly Expr[]; heading: Heading; headingClass: string }) {
  const [index, setIndex] = useState(0)
  const example = useMemo(() => workedExample(examples[index]), [examples, index])
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
      <FitWidth className="text-xl">
        <Formula tex={example.functionLatex} />
      </FitWidth>
      <ol className="space-y-3 border-l-2 border-accent-200 pl-4">
        {example.lines.map((line, i) => (
          <li key={`${index}-${i}`} className="space-y-1">
            <RichText text={line.label} className="text-sm text-zinc-600" inline />
            <FitWidth className="text-lg">
              <Formula tex={line.latex} />
            </FitWidth>
          </li>
        ))}
      </ol>
      {examples.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % examples.length)}
          className="rounded-xl border border-accent-600 px-4 py-2 font-medium text-accent-800 hover:bg-accent-50"
        >
          Anderes Beispiel
        </button>
      )}
    </section>
  )
}

function CardErrors({ card, heading: H, headingClass, practice }: Props & { headingClass: string }) {
  const { errors } = useProgress()
  const { derivativeLevel, practiceMode } = useSettings()
  return (
    <section className="space-y-3">
      <H className={headingClass}>Typische Fehler</H>
      <ul className="space-y-3">
        {card.errors.map((id) => {
          const rule = errorRule(id)
          const times = errors[id] ?? 0
          return (
            <li key={id} className="space-y-2 rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{rule.name}</p>
                {times > 0 && <p className="shrink-0 text-sm text-amber-800">Dir {times}-mal passiert</p>}
              </div>
              <div className="text-zinc-700">
                <span className="text-sm text-zinc-500">So sieht der Fehler aus:</span>
                <FitWidth>
                  <Formula tex={rule.wrongFormula} />
                </FitWidth>
              </div>
              {practice && (
                <a
                  href={practiceHref(derivativeLevel, practiceMode, id)}
                  className="-ml-3 inline-block rounded-xl px-3 py-2 font-medium text-accent-700 hover:bg-accent-50"
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
