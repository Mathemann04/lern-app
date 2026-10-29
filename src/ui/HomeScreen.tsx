import { updateSettings, useSettings } from '../state/settings.ts'
import { Formula } from './Formula.tsx'
import { practiceHref } from './routes.ts'
import { derivativeLevels, isLevelAvailable, notationSamples } from './samples.ts'

export function HomeScreen() {
  const { derivativeLevel } = useSettings()
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
          <a
            href={practiceHref(selected)}
            className="block rounded-xl bg-accent-700 px-4 py-3 text-center text-lg font-medium text-white hover:bg-accent-800"
          >
            Stufe {selected} geführt üben
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
        <p className="px-5 pb-4 text-sm text-zinc-500">Die Stufen 4 und 5 und der freie Modus folgen in den nächsten Schritten.</p>
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
