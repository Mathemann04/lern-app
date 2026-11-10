import { describe, expect, it } from 'vitest'
import claudeMd from '../CLAUDE.md?raw'

// Die Anleitungen für Claude Code klein halten (CLAUDE.md, „Sparsam arbeiten").
// CLAUDE.md lädt in jeder Sitzung ganz; lange Dateien kosten Kontingent, und Regeln gehen
// darin unter. Die Notizen je Bereich in .claude/rules/ laden nur bei passenden Dateien;
// über 40 000 Zeichen bekäme Claude Code nur ihren Anfang zu sehen.
const rules = import.meta.glob<string>('../.claude/rules/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('Anleitungen für Claude Code', () => {
  it('CLAUDE.md hat höchstens 200 Zeilen', () => {
    expect(claudeMd.split('\n').length).toBeLessThanOrEqual(200)
  })

  it('es gibt Notizen je Bereich', () => {
    expect(Object.keys(rules).length).toBeGreaterThanOrEqual(8)
  })

  for (const [file, text] of Object.entries(rules)) {
    it(`${file} lädt nur bei passenden Dateien und bleibt unter 30 000 Zeichen`, () => {
      expect(text.startsWith('---\npaths:\n')).toBe(true)
      expect(text.length).toBeLessThanOrEqual(30_000)
    })
  }
})
