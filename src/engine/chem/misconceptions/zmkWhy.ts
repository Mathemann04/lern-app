import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Zwischenmolekulare Kräfte“ (Ids wie in zmk.ts)

export const ZMK_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-zk-intra': {
    detailed: "Innerhalb eines Moleküls halten Atombindungen die Atome zusammen. Zwischenmolekulare Kräfte wirken zwischen den Molekülen: Sie halten die Moleküle einer Flüssigkeit oder eines Feststoffs beieinander.",
    short: "Zwischenmolekular heißt: zwischen den Molekülen.",
  },
  'chem-mis-zk-stronger': {
    detailed: "Atom- und Ionenbindungen sind viel stärker als die Kräfte zwischen Molekülen. Deshalb kann man Wasser verdampfen, ohne dass die Wassermoleküle zerfallen; dafür bräuchte man ein Vielfaches an Energie.",
    short: "Bindungen in Molekülen sind viel stärker.",
  },
  'chem-mis-zk-vdw-some': {
    detailed: "Van-der-Waals-Kräfte entstehen durch kurzzeitige Verschiebungen der Elektronen, die im Nachbarn ebenfalls einen Dipol hervorrufen. Das geht bei allen Atomen und Molekülen, auch bei unpolaren und bei Edelgasen.",
    short: "Van-der-Waals-Kräfte wirken zwischen allen Teilchen.",
  },
  'chem-mis-zk-hbond-covalent': {
    detailed: "Eine Wasserstoffbrücke ist eine Anziehung zwischen einem stark positiv geladenen H-Atom und dem freien Paar eines Nachbarmoleküls. Ein gemeinsames Elektronenpaar gibt es dabei nicht; sie ist ein besonders starker Fall der Dipol-Dipol-Wechselwirkungen und viel schwächer als eine Atombindung.",
    short: "Eine Anziehung zwischen Molekülen, kein gemeinsames Paar.",
  },
  'chem-mis-zk-any-h': {
    detailed: "Nur ein H-Atom, das direkt an N, O oder F sitzt, ist positiv genug geladen. An Kohlenstoff gebundene H-Atome bilden keine Wasserstoffbrücken.",
    short: "Nur H direkt an N, O oder F.",
  },
  'chem-mis-zk-water-only': {
    detailed: "Wasserstoffbrücken bilden alle Moleküle, in denen H direkt an N, O oder F sitzt: Ammoniak, Fluorwasserstoff, Alkohole, auch Eiweiße und die DNA. Wasser ist nur das bekannteste Beispiel.",
    short: "Alle Moleküle mit H an N, O oder F.",
  },
  'chem-mis-zk-h-other': {
    detailed: "Für Wasserstoffbrücken muss der Partner des H-Atoms sehr elektronegativ und klein sein. Das trifft nur auf N, O und F zu; Chlor und Schwefel genügen dafür nicht.",
    short: "Brücken nur mit N, O und F.",
  },
  'chem-mis-zk-dipole-nonpolar': {
    detailed: "Dipol-Dipol-Wechselwirkungen brauchen Moleküle, die als Ganzes ein Dipol sind. Heben sich die polaren Bindungen wegen der Gestalt auf, hat das Molekül keine positive und negative Seite, die ein Nachbar anziehen könnte.",
    short: "Nur ganze Dipole ziehen sich als Dipole an.",
  },
  'chem-mis-zk-order': {
    detailed: "Die Reihenfolge ist fest: Van-der-Waals-Kräfte sind die schwächsten, Dipol-Dipol-Wechselwirkungen stärker, Wasserstoffbrücken am stärksten. Nur bei sehr großen Molekülen können viele Van-der-Waals-Kräfte zusammen viel ausmachen.",
    short: "Van der Waals < Dipol-Dipol < Wasserstoffbrücken.",
  },
  'chem-mis-zk-size': {
    detailed: "Größere Moleküle haben mehr Elektronen und eine größere Oberfläche. Ihre Elektronen lassen sich leichter verschieben, und sie berühren ihre Nachbarn auf größerer Fläche: Die Van-der-Waals-Kräfte werden stärker.",
    short: "Größer heißt: stärkere Van-der-Waals-Kräfte.",
  },
  'chem-mis-zk-boil-weak': {
    detailed: "Beim Sieden müssen die Moleküle voneinander getrennt werden. Je stärker sie sich anziehen, desto mehr Energie braucht man dafür und desto höher liegt der Siedepunkt.",
    short: "Stärkere Kräfte, höherer Siedepunkt.",
  },
  'chem-mis-zk-boil-breaks': {
    detailed: "Wasserdampf besteht aus denselben Wassermolekülen wie flüssiges Wasser. Beim Sieden werden nur die Kräfte zwischen den Molekülen überwunden; die viel stärkeren Atombindungen in den Molekülen bleiben.",
    short: "Die Moleküle bleiben ganz.",
  },
  'chem-mis-zk-mass-only': {
    detailed: "Die Molmasse hilft nur beim Vergleich von Stoffen mit derselben Art von Kräften. Wasserstoffbrücken oder Dipol-Dipol-Wechselwirkungen können einen Stoff mit kleinerer Molmasse viel höher sieden lassen.",
    short: "Erst die Art der Kraft, dann die Größe.",
  },
  'chem-mis-zk-ice-sinks': {
    detailed: "Im Eis ordnen die Wasserstoffbrücken die Moleküle in einem weitmaschigen Gitter mit vielen Lücken. Deshalb ist Eis weniger dicht als flüssiges Wasser und schwimmt.",
    short: "Eis ist weitmaschig und schwimmt.",
  },
  'chem-mis-zk-density-zero': {
    detailed: "Flüssiges Wasser ist bei etwa 4 °C am dichtesten. Kühlt es weiter ab, bilden sich schon vor dem Gefrieren mehr geordnete Bereiche mit Wasserstoffbrücken, und die Dichte nimmt wieder ab.",
    short: "Größte Dichte bei etwa 4 °C.",
  },
  'chem-mis-zk-water-normal': {
    detailed: "Ohne Wasserstoffbrücken würde Wasser als kleines Molekül weit unter 0 °C sieden, wie Schwefelwasserstoff. Die Wasserstoffbrücken halten die Moleküle so fest zusammen, dass es erst bei 100 °C siedet.",
    short: "Die Wasserstoffbrücken erklären den hohen Siedepunkt.",
  },
  'chem-mis-zk-opposites': {
    detailed: "Es gilt: Gleiches löst sich in Gleichem. Die Kräfte zwischen polaren Teilchen untereinander und zwischen unpolaren untereinander sind viel stärker als zwischen polaren und unpolaren. Deshalb bleiben sie lieber unter sich.",
    short: "Gleiches löst sich in Gleichem.",
  },
  'chem-mis-zk-oil-light': {
    detailed: "Die Dichte erklärt nur, welche Schicht oben schwimmt. Dass sich Öl und Wasser überhaupt nicht mischen, liegt an den Kräften: Wassermoleküle halten über Wasserstoffbrücken lieber untereinander zusammen als mit unpolaren Ölmolekülen.",
    short: "Nicht die Dichte, die Kräfte verhindern das Mischen.",
  },
  'chem-mis-zk-room-state': {
    detailed: "Ob ein Stoff bei Raumtemperatur (etwa 20 °C) ein Gas, eine Flüssigkeit oder ein Feststoff ist, sagen Siede- und Schmelzpunkt. Siedet er oberhalb von 20 °C, ist er noch kein Gas; schmilzt er erst oberhalb, ist er fest. Mit der Größe der Moleküle steigen beide Temperaturen.",
    short: "Siede- und Schmelzpunkt mit 20 °C vergleichen.",
  },
}
