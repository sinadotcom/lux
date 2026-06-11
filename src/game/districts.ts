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
    unlocks: ['museum', 'transit'],
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
    unlocks: ['rooftops'],
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
    unlocks: ['hillside'],
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
