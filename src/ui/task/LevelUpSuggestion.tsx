import type { Level } from '../../engine/tasks/taskNumber.ts'
import { dismissSuggestion, levelSummary, shouldSuggestLevelUp, useProgress } from '../../state/progress.ts'
import { updateSettings } from '../../state/settings.ts'
import type { PracticeMode } from '../../state/storage.ts'
import { practiceHref } from '../routes.ts'
import { isLevelAvailable } from '../samples.ts'

// „Eine Stufe höher?" nach 8 von 10 Aufgaben ohne Fehler. Nur ein Vorschlag: Gewechselt wird
// erst, wenn man auf den Knopf tippt.
export function LevelUpSuggestion({ level, mode }: { level: Level; mode: PracticeMode }) {
  const progress = useProgress()
  const next = (level + 1) as Level
  if (level === 5 || !isLevelAvailable(next) || !shouldSuggestLevelUp(progress, level)) return null
  const { recent, recentClean } = levelSummary(progress, level)
  return (
    <section className="animate-step-in space-y-3 rounded-2xl border-2 border-accent-600 bg-accent-50 p-4" aria-label="Eine Stufe höher?">
      <p className="text-lg font-semibold text-accent-800">Eine Stufe höher?</p>
      <p className="text-zinc-700">
        Von deinen letzten {recent.length} Aufgaben in Stufe {level} hast du {recentClean} ohne Fehler gelöst. Lust auf Stufe {next}?
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={practiceHref(next, mode)}
          onClick={() => updateSettings({ derivativeLevel: next })}
          className="rounded-xl bg-accent-700 px-4 py-2 font-medium text-white hover:bg-accent-800"
        >
          Stufe {next} probieren
        </a>
        <button type="button" onClick={() => dismissSuggestion(level)} className="rounded-xl px-4 py-2 font-medium text-accent-800 hover:bg-accent-100">
          Später
        </button>
      </div>
    </section>
  )
}
