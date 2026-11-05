// Abwechslung (M2b, für alle Themen): Die Form einer Aufgabe ist ihr LaTeX ohne die Zahlen, mit
// Plus und Minus zusammengefasst und Buchstaben in der Reihenfolge ihres Auftretens benannt, auch
// in Produkten wie ax (Befehle wie \frac bleiben stehen).
// \frac{3}{4} - \frac{2}{x} und \frac{5}{6} + \frac{1}{a} haben dieselbe Form, \frac{3}{4} \cdot \frac{2}{x}
// eine andere. Ein Test misst je Stufe, wie viele Formen es gibt; beim Ziehen einer neuen Aufgabe
// meidet die App die Formen der letzten Aufgaben.

export function formOfLatex(latex: string): string {
  const names = new Map<string, string>()
  return latex
    .replace(/\d+/g, '#')
    .replace(/[+-]/g, '±')
    .replace(/\\[a-zA-Z]+|[a-z]/g, (token) => {
      if (token.startsWith('\\')) return token
      if (!names.has(token)) names.set(token, `L${names.size + 1}`)
      return names.get(token)!
    })
}

// Anzahl der Formen und Anteil der häufigsten
export function varietyStats(forms: readonly string[]): { readonly distinct: number; readonly maxShare: number } {
  const counts = new Map<string, number>()
  for (const f of forms) counts.set(f, (counts.get(f) ?? 0) + 1)
  return { distinct: counts.size, maxShare: Math.max(0, ...counts.values()) / Math.max(1, forms.length) }
}

// Aufgaben-Nummer für eine neue Aufgabe: die erste, deren Form nicht unter den letzten ist; gibt
// es in attempts Versuchen keine, die mit der Form, die am längsten zurückliegt.
// recent: Formen der letzten Aufgaben, die neueste zuletzt
export function pickFresh(formOf: (seed: number) => string, recent: readonly string[], nextSeed: () => number, attempts = 50): number {
  let best: { seed: number; age: number } | null = null
  for (let i = 0; i < attempts; i++) {
    const seed = nextSeed()
    const index = recent.lastIndexOf(formOf(seed))
    if (index === -1) return seed
    // je kleiner der Index, desto länger her
    const age = recent.length - index
    if (!best || age > best.age) best = { seed, age }
  }
  return best!.seed
}
