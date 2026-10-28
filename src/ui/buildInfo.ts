// Zeitpunkt des Builds in deutscher Schreibweise, z. B. „28.10.2026, 21:15 Uhr"
export function formatBuildTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
  return `${formatted} Uhr`
}
