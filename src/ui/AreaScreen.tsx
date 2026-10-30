import { solvedInCourse, useProgress } from '../state/progress.ts'
import { AreaIcon } from './AreaIcon.tsx'
import { BackLink } from './BackLink.tsx'
import { type Course, areaById, isCourseAvailable } from './catalog.ts'
import { courseHref } from './routes.ts'

// Ein Gebiet, z. B. Grundlagen: seine Themen als Kacheln; Themen ohne spielbare Stufe blass mit
// „kommt bald"
export function AreaScreen({ id }: { id: string }) {
  const { subject, area } = areaById(id)!
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
            <CourseTile course={course} />
          </li>
        ))}
      </ul>
      <p className="text-sm text-zinc-500 text-pretty">Weitere Themen kommen dazu, sobald sie in der App sind.</p>
    </main>
  )
}

function CourseTile({ course }: { course: Course }) {
  const solved = solvedInCourse(useProgress(), course.id)
  const available = isCourseAvailable(course)
  const body = (
    <>
      <AreaIcon kind={course.icon} className={`size-14 shrink-0 ${available ? '' : 'opacity-50'}`} />
      <span className="min-w-0 flex-1 space-y-1">
        <span className={`block text-lg font-semibold ${available ? '' : 'text-zinc-500'}`}>{course.title}</span>
        <span className={`block text-pretty ${available ? 'text-zinc-600' : 'text-zinc-500'}`}>{course.description}</span>
        {available ? (
          <span className="block text-sm text-zinc-500">
            {course.levels.length} Stufen{solved > 0 && ` · ${solved} ${solved === 1 ? 'Aufgabe' : 'Aufgaben'} gelöst`}
          </span>
        ) : (
          <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">kommt bald</span>
        )}
      </span>
    </>
  )
  if (!available) return <div className="flex items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-4 py-4">{body}</div>
  return (
    <a
      href={courseHref(course.id)}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-4 transition-colors hover:border-accent-600 hover:bg-accent-50"
    >
      {body}
      <span aria-hidden className="text-accent-700">
        →
      </span>
    </a>
  )
}
