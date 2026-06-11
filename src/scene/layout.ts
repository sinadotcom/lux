import { xy } from '../game/board.ts';
import type { Puzzle } from '../game/types.ts';
import { CELL } from './palette.ts';

/** World-space center of a cell, board centered on the origin. */
export function cellPos(p: Puzzle, i: number): [number, number] {
  const [x, y] = xy(p, i);
  return [(x - p.width / 2 + 0.5) * CELL, (y - p.height / 2 + 0.5) * CELL];
}

/** Deterministic pseudo-random in [0,1) from a cell index, for varied building heights. */
export function cellNoise(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
