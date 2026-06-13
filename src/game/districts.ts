import { generatePuzzle, DIFFICULTY_PRESETS, type GeneratorOptions } from './generator.ts';
import { hashString } from './rng.ts';
import type { Puzzle } from './types.ts';

export type MemoryKind = 'photograph' | 'sketch' | 'blueprint' | 'voice log' | 'fragment';

export interface Memory {
  kind: MemoryKind;
  title: string;
  body: string;
}

export interface District {
  id: string;
  name: string;
  epigraph: string;
  /** Position on the world map, in normalized [0..1] coordinates. */
  map: { x: number; y: number };
  /** Districts that become visible once this one is restored. */
  unlocks: string[];
  difficulty: keyof typeof DIFFICULTY_PRESETS;
  /** Warm/cool bias of the district's awakened palette. */
  hue: number;
  memory: Memory;
}

export const DISTRICTS: District[] = [
  {
    id: 'harbor',
    name: 'Harbor View',
    epigraph: 'The lighthouse went dark last. It can be first again.',
    map: { x: 0.22, y: 0.66 },
    unlocks: ['museum', 'transit', 'wharf'],
    difficulty: 'gentle',
    hue: 0.09,
    memory: {
      kind: 'photograph',
      title: 'Ferry No. 7, last crossing',
      body: 'A water-stained print. Passengers wave at someone out of frame. On the back, in pencil: "We left the kettle on. Someone will need the warmth."',
    },
  },
  {
    id: 'museum',
    name: 'Museum Quarter',
    epigraph: 'Marble remembers every footstep. Give it light to remember by.',
    map: { x: 0.38, y: 0.48 },
    unlocks: ['rooftops', 'exchange'],
    difficulty: 'gentle',
    hue: 0.11,
    memory: {
      kind: 'sketch',
      title: 'Study of the atrium, 4pm',
      body: 'Charcoal on butcher paper. The skylight is drawn twelve times, each with different weather. The artist signed only the sunny one.',
    },
  },
  {
    id: 'transit',
    name: 'Transit Hub',
    epigraph: 'Every line on the map once meant somebody going home.',
    map: { x: 0.3, y: 0.34 },
    unlocks: ['hillside', 'printworks'],
    difficulty: 'steady',
    hue: 0.08,
    memory: {
      kind: 'voice log',
      title: 'Platform announcement, undated',
      body: '"…the 21:14 to the coast is held for a passenger running down the stairs. We see you. Take your time." The recording ends with applause.',
    },
  },
  {
    id: 'rooftops',
    name: 'Rooftop District',
    epigraph: 'The city kept its gardens closest to the sky.',
    map: { x: 0.55, y: 0.42 },
    unlocks: ['observatory'],
    difficulty: 'steady',
    hue: 0.1,
    memory: {
      kind: 'photograph',
      title: 'Laundry lines at dusk',
      body: 'Between two water towers, a string of white sheets catches the last sun. Someone has pinned a note among them: "Borrowed your ladder. Pie on the sill."',
    },
  },
  {
    id: 'hillside',
    name: 'Hillside Village',
    epigraph: 'Stairs, lanterns, doorways — a town built by patient hands.',
    map: { x: 0.16, y: 0.22 },
    unlocks: ['megastructure'],
    difficulty: 'steady',
    hue: 0.085,
    memory: {
      kind: 'fragment',
      title: 'Ledger of the lamplighter',
      body: 'Forty years of entries, one per evening. The final line, steadier than the rest: "All lit. Wind from the south. A good life."',
    },
  },
  {
    id: 'observatory',
    name: 'The Observatory',
    epigraph: 'They turned the lenses off so the stars would stay honest.',
    map: { x: 0.74, y: 0.28 },
    unlocks: ['research'],
    difficulty: 'demanding',
    hue: 0.12,
    memory: {
      kind: 'blueprint',
      title: 'Drive mechanism, dome No. 2',
      body: 'A blueprint annotated in two hands. The first is precise. The second writes margin notes like "sings at 40 rpm — leave it."',
    },
  },
  {
    id: 'megastructure',
    name: 'Modernist Megastructure',
    epigraph: 'One building the size of a borough. Concrete that wanted to be kind.',
    map: { x: 0.48, y: 0.16 },
    unlocks: ['research'],
    difficulty: 'demanding',
    hue: 0.07,
    memory: {
      kind: 'blueprint',
      title: 'Level 14, communal hall',
      body: 'The architect drew every apartment door open by exactly fifteen degrees. A note explains: "Closed doors photograph better. Open ones live better."',
    },
  },
  {
    id: 'research',
    name: 'Research Facility',
    epigraph: 'The last lights to go out. The hardest to relight.',
    map: { x: 0.82, y: 0.55 },
    unlocks: [],
    difficulty: 'master',
    hue: 0.1,
    memory: {
      kind: 'voice log',
      title: 'Final entry, grid operations',
      body: '"Shutting down in sequence. To whoever restores power: the network was never the hard part. People will follow the light. They always have." — End of log.',
    },
  },

  // --- Expansion: the wider city, unlocked as the first districts come back. ---
  {
    id: 'wharf',
    name: 'Old Wharf',
    epigraph: 'Rope, salt, and patience. The tide kept the appointments people missed.',
    map: { x: 0.09, y: 0.52 },
    unlocks: ['tidewater'],
    difficulty: 'gentle',
    hue: 0.08,
    memory: {
      kind: 'photograph',
      title: 'Net menders, morning shift',
      body: 'Four pairs of hands over one torn net. Nobody looks at the camera. On the margin: "Mended is stronger than new, if you mend it together."',
    },
  },
  {
    id: 'tidewater',
    name: 'Tidewater Rows',
    epigraph: 'Houses built low to the water, so the evenings could come inside.',
    map: { x: 0.1, y: 0.78 },
    unlocks: ['cannery'],
    difficulty: 'gentle',
    hue: 0.075,
    memory: {
      kind: 'sketch',
      title: 'Doorways at high water',
      body: 'A row of stoops drawn at the waterline, each with a different chair. The artist numbered the chairs but never the houses.',
    },
  },
  {
    id: 'cannery',
    name: 'The Cannery',
    epigraph: 'It fed the coast for a century. Let the windows steam again.',
    map: { x: 0.3, y: 0.8 },
    unlocks: ['gardens'],
    difficulty: 'steady',
    hue: 0.07,
    memory: {
      kind: 'fragment',
      title: 'Tin lid, pressed with a date',
      body: 'Stamped in soft metal: a harvest year and three initials. Someone kept the lid instead of the meal. You understand why.',
    },
  },
  {
    id: 'gardens',
    name: 'Water Gardens',
    epigraph: 'Engineers who loved their city built it fountains instead of walls.',
    map: { x: 0.5, y: 0.74 },
    unlocks: ['almshouse'],
    difficulty: 'steady',
    hue: 0.1,
    memory: {
      kind: 'blueprint',
      title: 'Cascade, third basin',
      body: 'The flow calculations are exact, then a looser hand adds: "must sound like rain on a tin roof — adjust by ear."',
    },
  },
  {
    id: 'almshouse',
    name: 'The Almshouses',
    epigraph: 'Small rooms, warm doors. The city kept its promises here.',
    map: { x: 0.4, y: 0.62 },
    unlocks: ['foundry'],
    difficulty: 'steady',
    hue: 0.095,
    memory: {
      kind: 'voice log',
      title: 'Doorkeeper, evening rounds',
      body: '"Number eleven left their lamp for number nine again. I won\'t say anything. Some arithmetic is better left uncorrected."',
    },
  },
  {
    id: 'foundry',
    name: 'The Foundry',
    epigraph: 'It poured the lamp-posts that lit every other street. Light it last, fittingly first.',
    map: { x: 0.66, y: 0.7 },
    unlocks: ['conservatory'],
    difficulty: 'demanding',
    hue: 0.06,
    memory: {
      kind: 'photograph',
      title: 'First pour of the season',
      body: 'A wall of sparks, and silhouettes that do not flinch. Chalked on the mould: "For the harbor road. Make it kind underfoot."',
    },
  },
  {
    id: 'conservatory',
    name: 'The Conservatory',
    epigraph: 'A hall built only to hold sound. Give it back its evenings.',
    map: { x: 0.66, y: 0.5 },
    unlocks: ['greenhouse'],
    difficulty: 'demanding',
    hue: 0.11,
    memory: {
      kind: 'sketch',
      title: 'Seating plan, annotated',
      body: 'Every seat marked with the name of who usually sat there. One, near the back, simply reads: "leave empty — for whoever needs it."',
    },
  },
  {
    id: 'greenhouse',
    name: 'Glass Greenhouses',
    epigraph: 'Under cold glass, someone kept the summer running on a timer.',
    map: { x: 0.86, y: 0.74 },
    unlocks: ['signal'],
    difficulty: 'demanding',
    hue: 0.105,
    memory: {
      kind: 'fragment',
      title: 'Watering schedule, water-blurred',
      body: 'Most of the ink has run, but one line survives intact: "the ferns forgive a missed day. Tell them you\'re sorry anyway."',
    },
  },
  {
    id: 'signal',
    name: 'Signal Hill',
    epigraph: 'The last beacon before the open dark. Sailors steered by its patience.',
    map: { x: 0.92, y: 0.3 },
    unlocks: [],
    difficulty: 'master',
    hue: 0.12,
    memory: {
      kind: 'voice log',
      title: 'Keeper, handing over the watch',
      body: '"You don\'t light it for the ships you can see. You light it for the one you can\'t. That\'s the whole job. Goodnight."',
    },
  },
  {
    id: 'exchange',
    name: 'The Exchange',
    epigraph: 'A floor where the whole city\'s plans were shouted and shaken on.',
    map: { x: 0.42, y: 0.34 },
    unlocks: ['funicular'],
    difficulty: 'steady',
    hue: 0.085,
    memory: {
      kind: 'blueprint',
      title: 'The great hall, acoustics study',
      body: 'A diagram of how sound carries across the floor, with one arrow to a quiet corner labelled: "where deals were really made."',
    },
  },
  {
    id: 'funicular',
    name: 'Funicular Top',
    epigraph: 'Two carriages, forever passing. One always rose as the other came home.',
    map: { x: 0.63, y: 0.28 },
    unlocks: ['signal'],
    difficulty: 'demanding',
    hue: 0.09,
    memory: {
      kind: 'photograph',
      title: 'The carriages meeting',
      body: 'Mid-slope, the two cars pass. A child in each window waves at the other. The drivers, used to it, wave too.',
    },
  },
  {
    id: 'printworks',
    name: 'The Printworks',
    epigraph: 'It ran the morning edition for ninety years. The presses miss the rhythm.',
    map: { x: 0.3, y: 0.12 },
    unlocks: ['orchard'],
    difficulty: 'steady',
    hue: 0.08,
    memory: {
      kind: 'fragment',
      title: 'Last front page, never printed',
      body: 'A proof sheet with the headline left blank and a note to the editor: "Hold the lead story. Something good is bound to happen by dawn."',
    },
  },
  {
    id: 'orchard',
    name: 'Orchard Terraces',
    epigraph: 'They terraced the slope for fruit and stayed for the view.',
    map: { x: 0.1, y: 0.1 },
    unlocks: ['cathedral'],
    difficulty: 'gentle',
    hue: 0.1,
    memory: {
      kind: 'sketch',
      title: 'One tree, four seasons',
      body: 'The same apple tree drawn in spring, summer, autumn, winter — and a fifth time, bare, captioned only: "waiting, like the rest of us."',
    },
  },
  {
    id: 'cathedral',
    name: 'Cathedral Close',
    epigraph: 'Stone lace and tall windows, built to make the light do the talking.',
    map: { x: 0.66, y: 0.14 },
    unlocks: ['aerodrome'],
    difficulty: 'demanding',
    hue: 0.115,
    memory: {
      kind: 'blueprint',
      title: 'Rose window, glazing order',
      body: 'Each pane is numbered by colour. In the centre, where the glass is clear, the architect wrote: "let one piece stay honest."',
    },
  },
  {
    id: 'aerodrome',
    name: 'The Aerodrome',
    epigraph: 'The field where the city said its hellos and its hardest goodbyes.',
    map: { x: 0.9, y: 0.14 },
    unlocks: [],
    difficulty: 'master',
    hue: 0.07,
    memory: {
      kind: 'voice log',
      title: 'Tower, final clearance',
      body: '"Runway lights are yours when you want them. We kept them burning a little longer each night, just in case someone was still coming home."',
    },
  },
];

export const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));

/** Districts visible from the start of a fresh save. */
export const INITIAL_DISTRICTS = ['harbor'];

const puzzleCache = new Map<string, Puzzle>();

/** Deterministic per-district board — identical for every player, like a handcrafted level. */
export function districtPuzzle(id: string): Puzzle {
  const cached = puzzleCache.get(id);
  if (cached) return cached;
  const d = DISTRICT_BY_ID.get(id);
  if (!d) throw new Error(`Unknown district: ${id}`);
  const opts: GeneratorOptions = DIFFICULTY_PRESETS[d.difficulty];
  const puzzle = generatePuzzle(hashString(`lux-district-${id}-v1`), opts);
  puzzleCache.set(id, puzzle);
  return puzzle;
}
