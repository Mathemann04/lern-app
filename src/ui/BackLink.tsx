// „← Zurück" auf Unterseiten: führt eine Ebene höher, z. B. von einer Karte zu ihrem Ordner
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-accent-700 hover:bg-accent-50">
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {label}
    </a>
  )
}
