// Texte mit eingebetteten Formeln: Formeln stehen zwischen $…$ (LaTeX),
// ein Zeilenumbruch beginnt einen neuen Absatz.
// Beispiel: "Leite $4x^{3}$ ab.\nDer Faktor $4$ bleibt stehen."

export type Segment = { readonly kind: 'text'; readonly text: string } | { readonly kind: 'math'; readonly latex: string }

// Absätze, jeder als Folge von Text- und Formelstücken
export function parseRichText(text: string): Segment[][] {
  return text
    .split('\n')
    .filter((paragraph) => paragraph.trim() !== '')
    .map((paragraph) =>
      paragraph
        .split(/(\$[^$]+\$)/)
        .filter((part) => part !== '')
        .map((part): Segment =>
          part.startsWith('$') && part.endsWith('$') && part.length > 1
            ? { kind: 'math', latex: part.slice(1, -1) }
            : { kind: 'text', text: part },
        ),
    )
}
