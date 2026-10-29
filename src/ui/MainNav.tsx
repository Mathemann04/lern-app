import type { ReactNode } from 'react'
import type { Section } from './routes.ts'

// Hauptmenü: am Handy (und schmalen Fenstern) als Leiste unten wie in Apps, am Laptop oben im Kopf.
// Während einer Aufgabe ausgeblendet (dort beendet das X die Aufgabe).

const icon = (path: ReactNode) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

const ITEMS: Array<{ section: Section; href: string; label: string; icon: ReactNode }> = [
  { section: 'home', href: '#/', label: 'Start', icon: icon(<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />) },
  {
    section: 'cards',
    href: '#/karten',
    label: 'Lernkarten',
    icon: icon(
      <>
        <rect x="3" y="7" width="14" height="14" rx="2" />
        <path d="M7 3h11a3 3 0 0 1 3 3v11" />
      </>,
    ),
  },
  { section: 'progress', href: '#/fortschritt', label: 'Fortschritt', icon: icon(<path d="M4 20h16M7 16v-4M12 16V8M17 16v-7" />) },
  {
    section: 'settings',
    href: '#/einstellungen',
    label: 'Einstellungen',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>,
    ),
  },
]

export function MainNav({ active }: { active: Section | null }) {
  return (
    <nav
      aria-label="Hauptmenü"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:-mr-3 md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none"
    >
      <ul className="mx-auto flex max-w-2xl md:mx-0">
        {ITEMS.map((item) => {
          const current = item.section === active
          return (
            <li key={item.section} className="min-w-0 flex-1 md:flex-none">
              <a
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 text-xs font-medium md:flex-row md:gap-1.5 md:rounded-lg md:px-3 md:py-2 md:text-sm md:hover:bg-zinc-100 ${
                  current ? 'text-accent-700' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
