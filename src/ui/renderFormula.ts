import katex from 'katex'
// mit der ersten Formel geladen, nicht schon für die Startseite
import 'katex/dist/katex.min.css'

// Setzt eine Formel (LaTeX) mit KaTeX zu HTML.
// Auch Formeln im Text werden in voller Größe gesetzt (\displaystyle), damit
// Brüche wie im Skript aussehen und nicht verkleinert werden.
// Wirft bei fehlerhaftem oder unsauberem LaTeX eine Ausnahme, damit Tests es finden.
export function renderFormula(tex: string, display = false): string {
  return katex.renderToString(display ? tex : String.raw`\displaystyle ${tex}`, {
    displayMode: display,
    throwOnError: true,
    strict: 'error',
  })
}
