import { describe, expect, it } from 'vitest'
import { MAX_REPORTS, REPORTS_KEY, type Report, loadReports, parseReports, reportsText } from './reports.ts'

const report = (n: number): Report => ({ id: `frage-${n}`, course: 'chem-atombau', ref: `1-${500_000 + n}`, prompt: `Frage $\\ce{H2O}$ Nr. ${n}?`, at: new Date(2026, 10, 10).getTime() })

describe('Gemeldete Fragen', () => {
  it('liest eine gespeicherte Liste', () => {
    const list = [report(1), report(2)]
    expect(parseReports(JSON.stringify(list))).toEqual(list)
    const store = { getItem: (key: string) => (key === REPORTS_KEY ? JSON.stringify(list) : null), setItem: () => {} }
    expect(loadReports(store)).toEqual(list)
  })

  it('übersteht kaputten Inhalt und lässt kaputte Einträge einzeln weg', () => {
    for (const text of [null, '', '{', '42', '{"a":1}', 'null']) expect(parseReports(text), String(text)).toEqual([])
    const mixed = [report(1), { id: 'x' }, 'kaputt', { ...report(2), at: 'gestern' }, report(3)]
    expect(parseReports(JSON.stringify(mixed))).toEqual([report(1), report(3)])
    expect(loadReports(null)).toEqual([])
    const locked = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {},
    }
    expect(loadReports(locked)).toEqual([])
  })

  it('behält höchstens die letzten Meldungen', () => {
    const many = Array.from({ length: MAX_REPORTS + 3 }, (_, i) => report(i))
    const read = parseReports(JSON.stringify(many))
    expect(read).toHaveLength(MAX_REPORTS)
    expect(read[0]).toEqual(report(3))
  })

  it('macht daraus einen Text zum Einfügen in den Chat', () => {
    const text = reportsText([report(1), report(2)])
    expect(text.split('\n')).toEqual([
      'Gemeldete Fragen aus Rechenweg (2):',
      '1. chem-atombau, Aufgabe 1-500001, Frage frage-1 (gemeldet am 10.11.2026): Frage $\\ce{H2O}$ Nr. 1?',
      '2. chem-atombau, Aufgabe 1-500002, Frage frage-2 (gemeldet am 10.11.2026): Frage $\\ce{H2O}$ Nr. 2?',
    ])
  })
})
