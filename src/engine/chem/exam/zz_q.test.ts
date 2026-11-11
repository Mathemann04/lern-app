import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { chemTopic } from '../banks.ts'
it('q', () => {
  const out: string[] = []
  const want: Record<string, number[]> = { 'chem-elektronen': [113], 'chem-pse': [102, 103, 104, 211], 'chem-zmk': [102, 104, 106, 107, 302], 'chem-mwg': [215, 310, 312], 'chem-trends': [] }
  for (const [c, nos] of Object.entries(want)) {
    const t = chemTopic(c)
    if (!t) { out.push('fehlt ' + c); continue }
    for (const no of nos) {
      const q = t.bank.questions.find((x) => x.no === no) as any
      out.push(`${c} ${no} ${q?.kind} level=${q?.level} part=${q?.part} fact=${q?.fact} figure=${q?.figure}\n  ${q?.prompt}\n  R: ${JSON.stringify(q?.correct ?? q?.answer)}\n  W: ${JSON.stringify((q?.wrong ?? q?.distractors ?? []).slice?.(0, 6))}`)
    }
  }
  writeFileSync('/tmp/claude-0/-home-user-lern-app/ba157216-5c9e-5642-893c-01a51a8fe6a7/scratchpad/q.txt', out.join('\n'))
})
