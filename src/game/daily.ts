import { generatePuzzle, DIFFICULTY_PRESETS } from './generator.ts';
import { hashString } from './rng.ts';
import type { Puzzle } from './types.ts';

/** Local-date key, so the Daily City rolls over at the player's midnight. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAILY_NAMES = [
  'Lantern Row', 'The Old Foundry', 'Glasswright Quarter', 'Meridian Terrace',
  'The Cistern Gardens', 'Porcelain Court', 'Signal Hill', 'The Drydocks',
  'Archivist Lane', 'Cobalt Mews', 'The Tramsheds', 'Vesper Heights',
  'Smokestack Commons', 'The Locks', 'Granite Parade', 'Halcyon Pier',
];

export function dailyPuzzle(key = todayKey()): { key: string; name: string; puzzle: Puzzle } {
  const seed = hashString(`lux-daily-${key}`);
  // Weekday rhythm: weekends a touch more demanding.
  const day = new Date(`${key}T12:00:00`).getDay();
  const preset = day === 0 || day === 6 ? DIFFICULTY_PRESETS.demanding : DIFFICULTY_PRESETS.steady;
  const puzzle = generatePuzzle(seed, preset);
  const name = DAILY_NAMES[seed % DAILY_NAMES.length];
  return { key, name, puzzle };
}
