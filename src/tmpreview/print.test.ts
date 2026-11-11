import { test } from 'vitest'
import { generatedCalc } from '../engine/chem/generators/index.ts'
test('print', () => {
  const seen = new Set<string>()
  for (const level of [1, 2, 3] as const) {
    for (let seed = 10000; seed < 10400; seed++) {
      const c = generatedCalc('chem-metalle', { level, seed })
      if (!c) { console.log('NULL', level, seed); continue }
      const key = c.form + c.substance
      if (seen.has(key)) continue
      seen.add(key)
      const t: any = c.task
      const lines = [`== L${level} s${seed} ${c.form} ${c.substance} | ${t.instruction} | ${t.note}`]
      for (const s of t.steps) {
        lines.push(`  Q: ${s.question} ${s.figure ?? ''}`)
        for (const ch of s.choices) lines.push(`    - ${ch.content} [${ch.correct ? 'OK' : ch.errorRuleId + (ch.whyWrong ? " | " + (ch.whyWrong.short ?? JSON.stringify(ch.whyWrong).slice(0,80)) : "")}]`)
        lines.push(`    E: ${s.explanation.detailed}`)
      }
      lines.push(`  R: ${t.resultText}`)
      console.log(lines.join('\n'))
    }
  }
})
