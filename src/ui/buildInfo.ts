// Zeitpunkt des Builds in deutscher Schreibweise, z. B. „28.10.2026, 21:15 Uhr"
export function formatBuildTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
  return `${formatted} Uhr`
}

export function buildInfoLabel(): string {
  return `Version vom ${formatBuildTime(__BUILD_INFO__.builtAt)} · ${__BUILD_INFO__.commit}`
}
