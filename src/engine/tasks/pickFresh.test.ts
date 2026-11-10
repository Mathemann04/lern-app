import { describe, expect, it } from 'vitest'
import { pickFresh, substanceOf } from './variety.ts'

// Neue Aufgabe mit frischer Form; bei Chemie-Rechnungen („@Stoff" in der Form) nie derselbe Stoff
// zweimal hintereinander

const sequence = (seeds: readonly number[]) => {
  let i = 0
  return () => seeds[i++ % seeds.length]
}

describe('pickFresh', () => {
  it('meidet die Formen der letzten Aufgaben', () => {
    const forms: Record<number, string> = { 1: 'a', 2: 'b', 3: 'c' }
    expect(pickFresh((s) => forms[s], ['a', 'b'], sequence([1, 2, 3]))).toBe(3)
    // keine frische Form: die, die am längsten zurückliegt
    expect(pickFresh((s) => forms[s], ['a', 'b', 'c'], sequence([3, 2, 1]))).toBe(1)
  })

  it('nimmt nach einem Stoff nicht gleich wieder denselben', () => {
    const forms: Record<number, string> = { 1: 'c:pne:1:symbol:atom:Cl@Cl', 2: 'c:pne:1:particles:atom:Cl@Cl', 3: 'c:pne:1:symbol:atom:Na@Na' }
    expect(pickFresh((s) => forms[s], ['c:pne:2:symbol:ion:Cl@Cl'], sequence([1, 2, 3]))).toBe(3)
    // geht es nicht anders, kommt eine frische Form mit demselben Stoff
    expect(pickFresh((s) => forms[s], ['c:pne:2:symbol:ion:Cl@Cl'], sequence([1, 2]))).toBe(1)
    expect(substanceOf('c:licht:energy:licht-natrium@licht-natrium')).toBe('licht-natrium')
    expect(substanceOf('q:atombau-isotope')).toBeNull()
    expect(substanceOf(String.raw`\frac{#}{L1}`)).toBeNull()
  })
})
