import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { truthOf } from '../../exam/grade.ts'
import { chemExamTask } from './index.ts'
it('count', () => {
  const stats = new Map<string, number[]>()
  for (const no of [1, 2, 3, 5]) for (let s = 1; s <= 300; s++) {
    const t = chemExamTask(no, s)!
    for (const [id, { build }] of truthOf(t)) {
      const k = `${no}:${id}`
      const arr = stats.get(k) ?? [0, 0, 0, 0, 0]
      arr[build.options.length]++
      stats.set(k, arr)
    }
  }
  const out: string[] = []; for (const [k, v] of stats) out.push(k + ' ' + v.join(' '))
  writeFileSync('/tmp/claude-0/-home-user-lern-app/ba157216-5c9e-5642-893c-01a51a8fe6a7/scratchpad/count.txt', out.join('\n'))
})
