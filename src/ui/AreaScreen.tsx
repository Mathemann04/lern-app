import { levelSummary, useProgress } from '../state/progress.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { areaById } from './catalog.ts'
import { courseHref } from './routes.ts'
import { derivativeLevels } from './samples.ts'

// Ein Gebiet, z. B. Differentialrechnung: seine Themen als Kacheln
export function AreaScreen({ id }: { id: string }) {
  const { subject, area } = areaById(id)!
  const progress = useProgress()
  // zurzeit hat jedes Thema die Stufen des Ableitens
  const solved = derivativeLevels.reduce((sum, l) => sum + levelSummary(progress, l.level).solved, 0)
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <BackLink href="#/" label="Start" />
        <div className="flex items-center gap-4">
          <AreaIcon kind={area.icon} className="size-16 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{subject.title}</p>
            <h1 className="text-3xl font-semibold tracking-tight hyphens-auto">{area.title}</h1>
          </div>
        </div>
      </div>
      <ul className="space-y-3">
        {area.courses.map((course) => (
          <li key={course.id}>
            <a
              href={courseHref(course.id)}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-4 transition-colors hover:border-accent-600 hover:bg-accent-50"
            >
              <AreaIcon kind={course.icon} className="size-14 shrink-0" />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-lg font-semibold">{course.title}</span>
                <span className="block text-zinc-600 text-pretty">{course.description}</span>
                <span className="block text-sm text-zinc-500">
                  {derivativeLevels.length} Stufen{solved > 0 && ` · ${solved} ${solved === 1 ? 'Aufgabe' : 'Aufgaben'} gelöst`}
                </span>
              </span>
              <span aria-hidden className="text-accent-700">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-500 text-pretty">Weitere Themen kommen dazu, sobald sie in der App sind.</p>
    </main>
  )
}
