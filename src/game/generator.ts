import { idx, orthNeighbors } from './board.ts';
import { solve } from './solver.ts';
import { BLOCK, OPEN, type CellValue, type Puzzle } from './types.ts';
import { mulberry32, shuffled, type Rng } from './rng.ts';

export interface GeneratorOptions {
  width: number;
  height: number;
  /** Fraction of cells that are structures (0.15–0.3 feels architectural). */
  wallDensity: number;
  /** Fraction of structures that display a power requirement. Lower = harder. */
  clueFraction: number;
}

export const DIFFICULTY_PRESETS: Record<'gentle' | 'steady' | 'demanding' | 'master', GeneratorOptions> = {
  gentle: { width: 6, height: 6, wallDensity: 0.3, clueFraction: 0.9 },
  steady: { width: 7, height: 7, wallDensity: 0.28, clueFraction: 0.7 },
  demanding: { width: 8, height: 8, wallDensity: 0.26, clueFraction: 0.55 },
  master: { width: 10, height: 10, wallDensity: 0.24, clueFraction: 0.45 },
};

/**
 * Generates a puzzle with a verified unique solution. Deterministic for a
 * given seed, so districts and dailies reproduce on every machine.
 */
export function generatePuzzle(seed: number, opts: GeneratorOptions): Puzzle {
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const puzzle = attemptGenerate(rng, opts);
    if (puzzle) return puzzle;
  }
  // Pathological seed: relax toward an easier, denser-clue board.
  return generatePuzzle(seed + 7919, { ...opts, clueFraction: Math.min(1, opts.clueFraction + 0.2) });
}

function attemptGenerate(rng: Rng, opts: GeneratorOptions): Puzzle | null {
  const { width, height } = opts;
  const cells: CellValue[] = new Array(width * height).fill(OPEN);

  // Structures placed with 180° rotational symmetry, like a planned city block.
  const targetWalls = Math.max(4, Math.round(width * height * opts.wallDensity));
  const half = Math.ceil((width * height) / 2);
  const candidates = shuffled(Array.from({ length: half }, (_, i) => i), rng);
  let placed = 0;
  for (const i of candidates) {
    if (placed >= targetWalls) break;
    const mirror = width * height - 1 - i;
    if (cells[i] !== OPEN || cells[mirror] !== OPEN) continue;
    cells[i] = BLOCK;
    if (mirror !== i) cells[mirror] = BLOCK;
    placed += mirror === i ? 1 : 2;
  }

  const blank: Puzzle = { width, height, cells };

  // Sample one valid powering of this layout (ignoring clues).
  const sampled = solve(blank, 1, rng).solution;
  if (!sampled) return null;

  // Print power requirements on a subset of structures.
  const wallIdxs: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(blank, x, y);
      if (cells[i] === BLOCK) wallIdxs.push(i);
    }
  }
  const adjacentCores = (i: number) => orthNeighbors(blank, i).filter((j) => sampled.has(j)).length;

  const order = shuffled(wallIdxs, rng);
  const initialClues = Math.round(wallIdxs.length * opts.clueFraction);
  for (let k = 0; k < initialClues; k++) {
    cells[order[k]] = adjacentCores(order[k]) as CellValue;
  }

  // Tighten until the solution is unique, adding clues one at a time.
  let next = initialClues;
  for (;;) {
    const res = solve(blank, 2);
    if (res.count === 1) return blank;
    if (res.count === 0) return null; // Should not happen; clues derive from a real solution.
    if (next >= order.length) return null;
    cells[order[next]] = adjacentCores(order[next]) as CellValue;
    next++;
  }
}
