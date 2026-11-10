// Platzhalter (S1, Gerüst): wird durch die echten Denkfehler zum Atombau ersetzt. Format: quiz/types.ts.
import type { Misconception } from '../../quiz/types.ts'

export const ATOMBAU_MISCONCEPTIONS: readonly Misconception[] = [
  {
    id: 'chem-mis-particle-charges',
    name: 'Ladungen der Teilchen verwechselt',
    wrongText: 'Das Neutron ist geladen, das Proton dagegen nicht.',
    why: { detailed: 'Jedes der drei Teilchen hat eine feste Ladung, die sich nie ändert. Nur zwei der drei Teilchen sind überhaupt geladen; ihre Ladungen sind gleich groß, aber mit entgegengesetztem Vorzeichen.', short: 'Die Ladungen der drei Teilchen sind fest, eines ist ungeladen.' },
  },
  {
    id: 'chem-mis-particle-location',
    name: 'Elektronen im Kern vermutet',
    wrongText: 'Die Elektronen sitzen zusammen mit den Protonen im Kern.',
    why: { detailed: 'Ein Atom hat einen winzigen Kern und eine viel größere Hülle. Im Kern sitzen nur die schweren Teilchen; die leichten Elektronen gehören zur Hülle.', short: 'Die Elektronen gehören zur Hülle, nicht zum Kern.' },
  },
  {
    id: 'chem-mis-mass-number',
    name: 'Massenzahl und Ordnungszahl verwechselt',
    wrongText: 'Die Massenzahl gibt die Zahl der Neutronen an.',
    why: { detailed: 'Die Ordnungszahl zählt die Protonen. Die Massenzahl zählt alle Teilchen im Kern, also Protonen und Neutronen zusammen. Elektronen zählen bei keiner der beiden Zahlen mit.', short: 'Ordnungszahl: Protonen; Massenzahl: Protonen und Neutronen.' },
  },
  {
    id: 'chem-mis-isotope-protons',
    name: 'Isotope mit verschiedenen Elementen verwechselt',
    wrongText: 'Isotope haben verschieden viele Protonen.',
    why: { detailed: 'Die Zahl der Protonen legt fest, welches Element ein Atom ist. Isotope gehören zum selben Element; sie unterscheiden sich nur in den ungeladenen Teilchen des Kerns.', short: 'Gleiches Element heißt gleiche Protonenzahl.' },
  },
  {
    id: 'chem-mis-ion-nucleus',
    name: 'Ionen über den Kern erklärt',
    wrongText: 'Ein Ion entsteht, wenn sich die Zahl der Protonen ändert.',
    why: { detailed: 'Bei der Bildung eines Ions bleibt der Kern unverändert. Nur die Hülle ändert sich: Das Atom gibt Elektronen ab oder nimmt welche auf. Ändert sich die Protonenzahl, ist es ein anderes Element.', short: 'Ionen entstehen in der Hülle, der Kern bleibt gleich.' },
  },
  {
    id: 'chem-mis-nucleus-size-mass',
    name: 'Größe und Masse von Kern und Hülle verwechselt',
    wrongText: 'Der Kern füllt fast das ganze Atom aus, und die Elektronen tragen viel zur Masse bei.',
    why: { detailed: 'Der Kern ist winzig: Das ganze Atom ist zehntausend- bis hunderttausendmal so groß. Trotzdem steckt fast die ganze Masse im Kern, denn ein Elektron wiegt fast 2000-mal weniger als ein Proton.', short: 'Kern winzig und schwer, Hülle groß und leicht.' },
  },
]
