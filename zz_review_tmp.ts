import { generatedCalc } from './src/engine/chem/generators/index.ts'
const clean = (e: string) => e.replace(/\\,\\mathrm\{[^}]*\}/g,'').replace(/\{,\}/g,'.').replace(/([\d.]+)\s*\\cdot\s*10\^\{(-?\d+)\}/g,'$1e$2')
const r3 = (x: number) => Number(x.toPrecision(3))
let total = 0; const bad: Record<string, number> = {}; const cnt: Record<string, number> = {}; const ex: Record<string,string[]> = {}
for (const level of [1,2,3] as const) for (let seed = 10000; seed < 14000; seed++) {
  const c: any = generatedCalc('chem-stoffmenge', { level, seed }); if (!c) continue
  for (const s of c.task.steps) {
    if (!['teilchen','masse','atome-element','stoffmenge'].includes(s.id)) continue
    const e = clean(s.established)
    const parts = e.split(/ = | \\approx /)
    const res = Number(parts[parts.length-1].trim())
    const t = parts[parts.length-2].trim()
    let calc: number
    const fr = /^\\frac\{([^}]*)\}\{([^}]*)\}$/.exec(t)
    if (fr) calc = Number(fr[1]) / Number(fr[2])
    else { const p = t.split(/\s*\\cdot\s*/); calc = Number(p[0]) * Number(p[1]) }
    const k = `L${level} ${s.id}`; cnt[k]=(cnt[k]??0)+1
    if (Number.isNaN(calc)||Number.isNaN(res)) { console.log('parse', e); continue }
    if (r3(calc) !== r3(res)) { bad[k]=(bad[k]??0)+1; (ex[k]??=[]).length<3 && ex[k].push(`#${seed} ${s.established}  [aus gezeigten Werten: ${r3(calc)}]`) }
  }
}
console.log(cnt, bad); for (const k in ex) console.log(k+'\n  '+ex[k].join('\n  '))
