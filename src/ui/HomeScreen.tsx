import type { Level } from '../engine/tasks/taskNumber.ts'
import { levelSummary, useProgress } from '../state/progress.ts'
import { updateSettings, useSettings } from '../state/settings.ts'
import type { PracticeMode } from '../state/storage.ts'
import { Formula } from './Formula.tsx'
import { practiceHref, topicHref } from './routes.ts'
import { derivativeLevels, isLevelAvailable, notationSamples } from './samples.ts'

const MODES: Array<{ value: PracticeMode; title: string; description: string }> = [
  { value: 'guided', title: 'Geführt', description: 'Auswahl-Antworten' },
  { value: 'free', title: 'Frei', description: 'Selbst eintippen' },
]

export function HomeScreen() {
  const { derivativeLevel, practiceMode } = useSettings()
  // Eine gespeicherte Stufe, die (noch) nicht spielbar ist, zählt als Stufe 1
  const selected = isLevelAvailable(derivativeLevel) ? derivativeLevel : 1
  return (
    <main className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Mathe Schritt für Schritt selbst lösen
        </h1>
        <p className="text-lg text-zinc-600 text-pretty">
          Du lernst, indem du Aufgaben selbst rechnest: geführt mit Auswahl-Antworten oder frei mit
          eigener Eingabe.
        </p>
      </section>

      <section aria-labelledby="topic-derivatives" className="rounded-2xl border border-zinc-200">
        <header className="space-y-4 p-5 pb-4">
          <div>
            <h2 id="topic-derivatives" className="text-xl font-semibold">
              Ableitungen
            </h2>
            <p className="mt-1 text-zinc-600">Fünf Stufen, vom Einstieg bis zum Profi.</p>
          </div>
          <fieldset>
            <legend className="sr-only">Wie willst du üben?</legend>
            <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
              {MODES.map((option) => (
                <label
                  key={option.value}
                  className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
                    practiceMode === option.value ? 'bg-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="art"
                    className="sr-only"
                    checked={practiceMode === option.value}
                    onChange={() => updateSettings({ practiceMode: option.value })}
                  />
                  <span className={`block font-medium ${practiceMode === option.value ? 'text-accent-700' : ''}`}>{option.title}</span>
                  <span className="block text-sm text-zinc-500">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <a
            href={practiceHref(selected, practiceMode)}
            className="block rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-white hover:bg-accent-800"
          >
            Stufe {selected} {practiceMode === 'free' ? 'frei' : 'geführt'} üben
          </a>
        </header>
        {/* Linie am umgebenden Element: Bei fieldset würde die Beschriftung sie unterbrechen */}
        <div className="border-t border-zinc-100">
          <fieldset>
            <legend className="px-5 pt-4 text-sm font-medium text-zinc-500">Stufe wählen</legend>
            <div className="space-y-2 p-3 pt-2">
              {derivativeLevels.map((level) => {
                const isSelected = level.level === selected
                return (
                  <label
                    key={level.level}
                    className={`flex gap-4 rounded-xl border-2 px-3 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent-600 ${
                      isSelected
                        ? 'border-accent-600 bg-accent-50'
                        : level.available
                          ? 'cursor-pointer border-transparent hover:bg-zinc-50'
                          : 'border-transparent opacity-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stufe"
                      className="sr-only"
                      checked={isSelected}
                      disabled={!level.available}
                      onChange={() => updateSettings({ derivativeLevel: level.level })}
                      aria-label={`Stufe ${level.level}: ${level.title}${level.available ? '' : ' (folgt bald)'}`}
                    />
                    <span
                      aria-hidden
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full font-semibold ${
                        isSelected ? 'bg-accent-700 text-white' : 'bg-accent-50 text-accent-700'
                      }`}
                    >
                      {level.level}
                    </span>
                    <span className="min-w-0 space-y-2">
                      <span className="block font-medium">
                        {level.title}
                        {!level.available && <span className="font-normal text-zinc-500"> · folgt bald</span>}
                      </span>
                      <LevelProgressLine level={level.level} />
                      <span className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
                        {level.examples.map((tex) => (
                          <Formula key={tex} tex={tex} />
                        ))}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
        <p className="px-5 pb-4 text-sm text-zinc-500">Stufe 5 folgt in den nächsten Schritten.</p>
        <a
          href={topicHref('ableitungen')}
          className="flex items-center justify-between border-t border-zinc-100 px-5 py-4 font-medium text-accent-700 hover:bg-accent-50"
        >
          Lernkarten: alle Regeln zum Ableiten
          <span aria-hidden>→</span>
        </a>
        <a
          href="#/fortschritt"
          className="flex items-center justify-between border-t border-zinc-100 px-5 py-4 font-medium text-accent-700 hover:bg-accent-50"
        >
          Dein Fortschritt und deine häufigsten Fehler
          <span aria-hidden>→</span>
        </a>
        <a
          href="#/galerie"
          className="flex items-center justify-between rounded-b-2xl border-t border-zinc-100 px-5 py-4 font-medium text-accent-700 hover:bg-accent-50"
        >
          Formel-Galerie ansehen (Testseite)
          <span aria-hidden>→</span>
        </a>
      </section>

      <section aria-labelledby="notation" className="space-y-4">
        <div>
          <h2 id="notation" className="text-xl font-semibold">
            Schreibweise
          </h2>
          <p className="mt-1 text-zinc-600">
            So werden Formeln in der App gesetzt. Sieht das aus wie in deinem Skript?
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {notationSamples.map((sample) => (
            <div key={sample.label} className="rounded-xl bg-zinc-50 px-4 py-3">
              <dt className="text-sm text-zinc-500">{sample.label}</dt>
              <dd className="mt-1 text-xl">
                <Formula tex={sample.tex} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}

// „12 gelöst · zuletzt 8 von 10 ohne Fehler"; nichts, solange noch keine Aufgabe gelöst ist
function LevelProgressLine({ level }: { level: Level }) {
  const { solved, recent, recentClean } = levelSummary(useProgress(), level)
  if (solved === 0) return null
  return (
    <span className="block text-sm text-zinc-500">
      {solved} gelöst · zuletzt {recentClean} von {recent.length} ohne Fehler
    </span>
  )
}
