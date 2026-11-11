import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { chemTopic } from '../banks.ts'
it('q', () => {
  const out: string[] = []
  for (const c of ['chem-atombau']) {
    for (const q of chemTopic(c)!.bank.questions as any[]) out.push(`${c} ${q.no} ${q.kind} ${q.part} ${q.fact} ${q.figure ? 'FIG' : ''} | ${q.prompt} | R: ${q.correct?.text ?? ''}`)
  }
  writeFileSync('/tmp/claude-0/-home-user-lern-app/ba157216-5c9e-5642-893c-01a51a8fe6a7/scratchpad/q2.txt', out.join('\n'))
})
