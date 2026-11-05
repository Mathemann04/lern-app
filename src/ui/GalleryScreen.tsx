import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { derive } from '../engine/derive/derive.ts'
import { wrongAnswers } from '../engine/derive/errorRules.ts'
import { deriveImplicit, implicitResult, implicitWrongAnswers } from '../engine/derive/implicit.ts'
import { equationToLatex, toLatex } from '../engine/expr/print.ts'
import { type GeneratedTask, generateDerivativeTask } from '../engine/tasks/derivativeTerms.ts'
import { type GeneratedFractionTask, generateFractionTask, isFractionLevelAvailable } from '../engine/tasks/fractionTerms.ts'
import { type GeneratedRearrangeTask, generateRearrangeTask, isRearrangeLevelAvailable } from '../engine/tasks/rearrangeTerms.ts'
import { derivativeForm, fractionForm, rearrangeForm } from '../engine/tasks/forms.ts'
import { varietyStats } from '../engine/tasks/variety.ts'
import {
  LEVELS,
  type Level,
  MAX_SEED,
  type TaskRef,
  formatTaskNumber,
  parseTaskNumber,
  randomSeed,
} from '../engine/tasks/taskNumber.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { type Course, DERIVATIVES, FRACTIONS, GALLERY_COURSES, REARRANGE, SUBJECTS, courseById, isCourseAvailable } from './catalog.ts'
import { DerivationView } from './DerivationView.tsx'
import { FractionGalleryCard } from './FractionGalleryCard.tsx'
import { Formula } from './Formula.tsx'
import { RearrangeGalleryCard } from './RearrangeGalleryCard.tsx'
import { RichText } from './RichText.tsx'
import { galleryHref } from './routes.ts'
import { notationGroups } from './samples.ts'

const TASKS_PER_PAGE = 8

type Generated =
  | { topic: 'ableiten'; task: GeneratedTask }
  | { topic: 'brueche'; task: GeneratedFractionTask }
  | { topic: 'umstellen'; task: GeneratedRearrangeTask }

// Themen der Testseite: welche Stufen es schon gibt, wie eine Aufgabe entsteht und ihre Form
// (für die Abwechslung, tasks/forms.ts)
type GalleryTopic = { isLevelAvailable(level: Level): boolean; generate(ref: TaskRef): Generated; form(ref: TaskRef): string }

const TOPICS: Record<string, GalleryTopic> = {
  [DERIVATIVES]: { isLevelAvailable: () => true, generate: (ref) => ({ topic: 'ableiten', task: generateDerivativeTask(ref) }), form: derivativeForm },
  [FRACTIONS]: { isLevelAvailable: isFractionLevelAvailable, generate: (ref) => ({ topic: 'brueche', task: generateFractionTask(ref) }), form: fractionForm },
  [REARRANGE]: { isLevelAvailable: isRearrangeLevelAvailable, generate: (ref) => ({ topic: 'umstellen', task: generateRearrangeTask(ref) }), form: rearrangeForm },
}

// Testseite: Übersicht wie die Startseite (Fächer, Gebiete, Themen), je Thema eine eigene Seite mit
// zufälligen Aufgaben der Mathe-Engine, um Schreibweise und Rechenweg zu prüfen
export function GalleryScreen({ course }: { course: string | null }) {
  return course ? <TopicGallery id={course} /> : <GalleryOverview />
}

function GalleryOverview() {
  return (
    <main className="space-y-10">
      <section className="space-y-2">
        <BackLink href="#/einstellungen" label="Einstellungen" />
        <h1 className="text-3xl font-semibold tracking-tight">Formel-Galerie</h1>
        <p className="text-zinc-600 text-pretty">
          Testseite: Hier zeigt die Mathe-Engine zufällige Aufgaben mit Lösung, Rechenweg und typischen Fehlern. Wähle
          ein Thema und prüfe, ob alles aussieht wie in deinem Skript.
        </p>
      </section>

      {SUBJECTS.map((subject) => {
        const areas = subject.areas
          .map((area) => ({ area, courses: area.courses.filter((c) => GALLERY_COURSES.includes(c.id)) }))
          .filter(({ courses }) => courses.length > 0)
        if (areas.length === 0) return null
        return (
          <section key={subject.id} aria-labelledby={`gallery-${subject.id}`} className="space-y-5">
            <h2 id={`gallery-${subject.id}`} className="text-xl font-semibold">
              {subject.title}
            </h2>
            {areas.map(({ area, courses }) => (
              <div key={area.id} data-tone={area.tone} className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent-700 uppercase">
                  <AreaIcon kind={area.icon} className="size-7 shrink-0" />
                  {area.title}
                </h3>
                <ul className="space-y-3">
                  {courses.map((c) => (
                    <li key={c.id}>
                      <TopicTile course={c} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )
      })}

      <section aria-labelledby="notation" className="space-y-6 border-t border-zinc-100 pt-8">
        <div>
          <h2 id="notation" className="text-xl font-semibold">
            Schreibweise
          </h2>
          <p className="mt-1 text-zinc-600">So werden Formeln in der App gesetzt. Sieht das aus wie in deinem Skript?</p>
        </div>
        {notationGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <div>
              <h3 className="font-semibold">{group.title}</h3>
              {group.note && <p className="text-sm text-zinc-500 text-pretty">{group.note}</p>}
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {group.samples.map((sample) => (
                <div key={sample.label} className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="text-sm text-zinc-500">{sample.label}</dt>
                  <dd className="mt-1 overflow-x-auto text-xl">
                    <Formula tex={sample.tex} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </main>
  )
}

// Stufen mit Aufgaben in der Galerie, z. B. „Stufen 1 bis 3"
function levelRange(levels: readonly Level[]): string {
  if (levels.length === 1) return `Stufe ${levels[0]}`
  return `Stufen ${levels[0]} bis ${levels[levels.length - 1]}`
}

function TopicTile({ course }: { course: Course }) {
  const levels = LEVELS.filter((l) => TOPICS[course.id].isLevelAvailable(l))
  return (
    <a
      href={galleryHref(course.id)}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-4 transition-colors hover:border-accent-600 hover:bg-accent-50"
    >
      <AreaIcon kind={course.icon} className="size-14 shrink-0" />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-lg font-semibold">{course.title}</span>
        <span className="block text-sm text-zinc-500">
          {levelRange(levels)}
          {!isCourseAvailable(course) && ' · zum Üben noch nicht freigeschaltet'}
        </span>
      </span>
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
  )
}

// Ein Thema der Galerie: Stufe wählen, zufällige Aufgaben, Aufgabe über ihre Nummer
function TopicGallery({ id }: { id: string }) {
  const { area, course } = courseById(id)!
  const topic = TOPICS[id]
  const [level, setLevel] = useState<Level>(1)
  const [baseSeed, setBaseSeed] = useState(randomSeed)
  const [showSteps, setShowSteps] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [lookupText, setLookupText] = useState('')
  const [lookup, setLookup] = useState<TaskRef | 'invalid' | null>(null)

  const tasks = useMemo(
    () => Array.from({ length: TASKS_PER_PAGE }, (_, i) => topic.generate({ level, seed: ((baseSeed + i * 7919) % MAX_SEED) + 1 })),
    [topic, level, baseSeed],
  )
  const lookupUnavailable = lookup && lookup !== 'invalid' && !topic.isLevelAvailable(lookup.level)
  const lookedUp = lookup && lookup !== 'invalid' && !lookupUnavailable ? topic.generate(lookup) : null

  function handleLookup(event: FormEvent) {
    event.preventDefault()
    setLookup(parseTaskNumber(lookupText) ?? 'invalid')
  }

  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <BackLink href={galleryHref()} label="Formel-Galerie" />
        <div className="flex items-center gap-4">
          <AreaIcon kind={course.icon} className="size-16 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{area.title} · Testseite</p>
            <h1 className="text-3xl font-semibold tracking-tight hyphens-auto">{course.title}</h1>
          </div>
        </div>
        <p className="text-zinc-600 text-pretty">
          Zufällige Aufgaben mit Lösung, Rechenweg und typischen Fehlern. Prüfe, ob alles aussieht wie in deinem Skript.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-500">Stufe</span>
          <div className="flex flex-1 gap-1 rounded-xl bg-zinc-100 p-1">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-label={`Stufe ${l}`}
                aria-pressed={l === level}
                disabled={!topic.isLevelAvailable(l)}
                title={topic.isLevelAvailable(l) ? undefined : 'folgt bald'}
                onClick={() => setLevel(l)}
                className={`min-h-11 flex-1 rounded-lg py-2 font-medium transition-colors disabled:opacity-40 ${
                  l === level ? 'bg-raised text-accent-700 shadow-sm' : 'text-zinc-600 enabled:hover:text-zinc-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setBaseSeed(randomSeed())}
            className="min-h-11 rounded-xl bg-accent-700 px-4 py-2.5 font-medium text-on-accent hover:bg-accent-800"
          >
            Neue Aufgaben
          </button>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex min-h-11 items-center gap-2 text-zinc-700">
              <input
                type="checkbox"
                checked={showSteps}
                onChange={(event) => setShowSteps(event.target.checked)}
                className="size-4 accent-accent-700"
              />
              Rechenweg zeigen
            </label>
            <label className="flex min-h-11 items-center gap-2 text-zinc-700">
              <input
                type="checkbox"
                checked={showErrors}
                onChange={(event) => setShowErrors(event.target.checked)}
                className="size-4 accent-accent-700"
              />
              Typische Fehler zeigen
            </label>
          </div>
        </div>

        <form onSubmit={handleLookup} className="space-y-2">
          <label htmlFor="task-number" className="block text-sm font-medium text-zinc-500">
            Aufgabe über ihre Nummer aufrufen
          </label>
          <div className="flex gap-2">
            <input
              id="task-number"
              value={lookupText}
              onChange={(event) => setLookupText(event.target.value)}
              placeholder="z. B. 3-48213"
              inputMode="numeric"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 focus:border-accent-600 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-11 rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50"
            >
              Anzeigen
            </button>
          </div>
          {lookup === 'invalid' && (
            <p className="text-sm text-red-700">Bitte so eingeben: Stufe, Bindestrich, Nummer, z. B. 3-48213.</p>
          )}
          {lookupUnavailable && <p className="text-sm text-red-700">Diese Stufe gibt es hier noch nicht.</p>}
        </form>
      </section>

      <VarietyTable key={id} topic={topic} />

      <div className="space-y-8">
        {lookedUp && (
          <section aria-label="Aufgerufene Aufgabe">
            <GalleryCard generated={lookedUp} showSteps={showSteps} showErrors={showErrors} highlighted />
          </section>
        )}

        <section aria-label="Zufällige Aufgaben" className="space-y-3">
          {tasks.map((generated) => (
            <GalleryCard key={`${generated.topic}:${generated.task.ref.seed}`} generated={generated} showSteps={showSteps} showErrors={showErrors} />
          ))}
        </section>
      </div>
    </main>
  )
}

// Abwechslung je Stufe: verschiedene Formen unter den Aufgaben 1 bis 200, wie im Test (Ziel aus
// docs/PLAN-M2b.md: mindestens 100 Formen, keine öfter als in 3 von 100 Aufgaben). Gezählt wird erst
// auf Knopfdruck und in kleinen Portionen, damit die Seite bedienbar bleibt.
const VARIETY_TASKS = 200
const VARIETY_MIN_FORMS = 100
const VARIETY_MAX_SHARE = 0.03

type VarietyRow = { readonly level: Level; readonly distinct: number | null; readonly maxShare: number | null }

function VarietyTable({ topic }: { topic: GalleryTopic }) {
  const levels = LEVELS.filter((l) => topic.isLevelAvailable(l))
  const [rows, setRows] = useState<VarietyRow[] | null>(null)
  const [counted, setCounted] = useState(0)
  const run = useRef(0)
  // beim Verlassen der Seite nicht weiterzählen (beim Wechsel des Themas kommt eine neue Tabelle, key)
  useEffect(() => () => void (run.current += 1), [])

  async function count() {
    const id = ++run.current
    const result: VarietyRow[] = levels.map((level) => ({ level, distinct: null, maxShare: null }))
    setRows([...result])
    for (const [i, level] of levels.entries()) {
      const forms: string[] = []
      for (let seed = 1; seed <= VARIETY_TASKS; seed++) {
        forms.push(topic.form({ level, seed }))
        if (seed % 10 === 0) {
          setCounted(i * VARIETY_TASKS + seed)
          await new Promise((resolve) => setTimeout(resolve, 0))
          if (run.current !== id) return
        }
      }
      const stats = varietyStats(forms)
      result[i] = { level, distinct: stats.distinct, maxShare: stats.maxShare }
      setRows([...result])
    }
  }

  const busy = rows !== null && rows.some((r) => r.distinct === null)
  const percent = (share: number) => `${Math.round(share * 1000) / 10} %`.replace('.', ',')
  return (
    <section aria-labelledby="variety" className="space-y-3">
      <h2 id="variety" className="text-xl font-semibold">
        Abwechslung je Stufe
      </h2>
      <p className="text-zinc-600 text-pretty">
        Wie viele verschiedene Formen haben die Aufgaben 1 bis {VARIETY_TASKS} einer Stufe? Ziel: mindestens {VARIETY_MIN_FORMS}, und keine Form
        kommt öfter als in 3 von 100 Aufgaben vor.
      </p>
      {rows === null || !busy ? (
        <button type="button" onClick={count} className="min-h-11 rounded-xl border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50">
          {rows === null ? 'Formen zählen' : 'Neu zählen'}
        </button>
      ) : (
        <p className="text-sm text-zinc-500" aria-live="polite">
          Zähle … {counted} von {levels.length * VARIETY_TASKS} Aufgaben
        </p>
      )}
      {rows && (
        <table className="w-full text-left">
          <thead className="text-sm text-zinc-500">
            <tr>
              <th className="py-1 pr-3 font-medium">Stufe</th>
              <th className="py-1 pr-3 font-medium">Formen</th>
              <th className="py-1 font-medium">häufigste Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.level} className="border-t border-zinc-100">
                <td className="py-2 pr-3">{r.level}</td>
                <td className={`py-2 pr-3 ${r.distinct !== null && r.distinct < VARIETY_MIN_FORMS ? 'text-red-700' : ''}`}>
                  {r.distinct === null ? '…' : `${r.distinct} ${r.distinct >= VARIETY_MIN_FORMS ? '✓' : '✗'}`}
                </td>
                <td className={`py-2 ${r.maxShare !== null && r.maxShare > VARIETY_MAX_SHARE ? 'text-red-700' : ''}`}>
                  {r.maxShare === null ? '…' : `${percent(r.maxShare)} ${r.maxShare <= VARIETY_MAX_SHARE ? '✓' : '✗'}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function GalleryCard({ generated, ...rest }: { generated: Generated; showSteps: boolean; showErrors: boolean; highlighted?: boolean }) {
  if (generated.topic === 'brueche') return <FractionGalleryCard generated={generated.task} {...rest} />
  if (generated.topic === 'umstellen') return <RearrangeGalleryCard generated={generated.task} {...rest} />
  return <TaskCard generated={generated.task} {...rest} />
}

type CardProps = {
  generated: GeneratedTask
  showSteps: boolean
  showErrors: boolean
  highlighted?: boolean
}

function TaskCard({ generated, showSteps, showErrors, highlighted = false }: CardProps) {
  const { task, template, ref } = generated
  const latex = task.kind === 'function' ? `f(x) = ${toLatex(task.expr)}` : equationToLatex(task.equation)
  // Implizit: beide Seiten abgeleitet, Ergebnis y'; Fehler als falsch abgeleitete Gleichung
  const worked = useMemo(() => {
    if (task.kind === 'function') {
      const d = derive(task.expr)
      return { resultLatex: `f'(x) = ${toLatex(d.result)}`, trees: [{ label: null, derivation: d }] }
    }
    const d = deriveImplicit(task.equation)
    return {
      resultLatex: `y' = ${toLatex(implicitResult(d))}`,
      trees: [
        { label: 'Linke Seite', derivation: d.left },
        { label: 'Rechte Seite', derivation: d.right },
      ],
    }
  }, [task])
  const errors = useMemo(() => {
    if (!showErrors) return []
    if (task.kind === 'function') {
      return wrongAnswers(task.expr, worked.trees[0].derivation).map((w) => ({ ...w, latex: `f'(x) = ${toLatex(w.result)}` }))
    }
    return implicitWrongAnswers(task.equation).map((w) => ({ ...w, latex: equationToLatex(w.differentiated) }))
  }, [showErrors, task, worked])

  return (
    <article
      className={`space-y-3 rounded-2xl border p-4 ${highlighted ? 'border-accent-600 bg-accent-50' : 'border-zinc-200'}`}
    >
      <div className="overflow-x-auto py-1 text-xl">
        <Formula tex={latex} />
      </div>
      <div className="overflow-x-auto py-1 text-xl" data-testid="derivative">
        <Formula tex={worked.resultLatex} />
      </div>

      {showSteps && (
        <section className="space-y-3 border-t border-zinc-100 pt-3">
          <h3 className="text-sm font-semibold text-zinc-500">Rechenweg</h3>
          {worked.trees.map(({ label, derivation }) => (
            <div key={label ?? 'f'} className="space-y-2">
              {label && <p className="text-sm text-zinc-500">{label}</p>}
              <DerivationView derivation={derivation} />
            </div>
          ))}
        </section>
      )}

      {showErrors && (
        <section className="border-t border-zinc-100 pt-3">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Typische Fehler ({errors.length})</h3>
          <ul className="space-y-2">
            {errors.map((w) => (
              <li key={`${w.errorRule.id}:${'side' in w ? w.side : ''}:${w.node.path.join(',')}`} className="space-y-0.5">
                <RichText
                  text={[w.errorRule, ...w.alsoMatches].map((r) => r.name).join(' oder ')}
                  className="block text-sm text-red-800"
                  inline
                />
                <div className="overflow-x-auto">
                  <Formula tex={w.latex} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-zinc-500">
        Aufgabe {formatTaskNumber(ref)} · {template.label}
      </p>
    </article>
  )
}
