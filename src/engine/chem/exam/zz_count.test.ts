import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { truthOf } from '../../exam/grade.ts'
import { chemExamTask } from './index.ts'
it('dump', () => {
  const out: string[] = []
  for (const [no, s] of [[1, 7], [1, 8], [2, 7], [2, 9], [2, 11], [3, 7], [5, 7]]) {
    const t = chemExamTask(no, s)!
    const tr = truthOf(t)
    for (const p of t.parts) {
      out.push(`== ${no}/${s} ${p.id} (${p.points}) ${p.prompt}`)
      for (const i of p.items) {
        const b = tr.get(i.id)!.build
        out.push(`  [${i.id} ${i.points}${i.paperFirst ? ' P' : ''}] ${i.question}`)
        for (const o of b.options) out.push(`     ${o.id === b.correct ? '*' : ' '} ${o.content} ${o.errorRuleId ?? (o.id === b.correct ? '' : 'WHY: ' + o.why?.short)}`)
      }
    }
  }
  writeFileSync('/tmp/claude-0/-home-user-lern-app/ba157216-5c9e-5642-893c-01a51a8fe6a7/scratchpad/dump.txt', out.join('\n'))
})
