import { BLOCK, OPEN, type BoardEvaluation, type CellValue, type Cores, type Puzzle } from './types.ts';

export const idx = (p: Puzzle, x: number, y: number) => y * p.width + x;
export const xy = (p: Puzzle, i: number): [number, number] => [i % p.width, Math.floor(i / p.width)];
export const inBounds = (p: Puzzle, x: number, y: number) => x >= 0 && y >= 0 && x < p.width && y < p.height;
export const isWall = (v: CellValue) => v !== OPEN;
export const isClue = (v: CellValue) => v >= 0 && v <= 4;

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function orthNeighbors(p: Puzzle, i: number): number[] {
  const [x, y] = xy(p, i);
  const out: number[] = [];
  for (const [dx, dy] of DIRS) {
    if (inBounds(p, x + dx, y + dy)) out.push(idx(p, x + dx, y + dy));
  }
  return out;
}

/** All open cells a core at `i` would power, walking each direction until a structure. */
export function beamFrom(p: Puzzle, i: number): number[] {
  const [x, y] = xy(p, i);
  const out: number[] = [i];
  for (const [dx, dy] of DIRS) {
    let cx = x + dx;
    let cy = y + dy;
    while (inBounds(p, cx, cy) && p.cells[idx(p, cx, cy)] === OPEN) {
      out.push(idx(p, cx, cy));
      cx += dx;
      cy += dy;
    }
  }
  return out;
}

export function evaluate(p: Puzzle, cores: Cores): BoardEvaluation {
  const lit = new Array<boolean>(p.cells.length).fill(false);
  const seenBy = new Array<number>(p.cells.length).fill(0);
  const conflicted = new Set<number>();

  for (const c of cores) {
    for (const cell of beamFrom(p, c)) {
      lit[cell] = true;
      seenBy[cell]++;
    }
  }
  for (const c of cores) {
    // A core's own cell is counted once by its own beam; more means another core sees it.
    if (seenBy[c] > 1) conflicted.add(c);
  }

  const clueState = new Map<number, -1 | 0 | 1>();
  let litCount = 0;
  let openCount = 0;
  let cluesOk = true;

  for (let i = 0; i < p.cells.length; i++) {
    const v = p.cells[i];
    if (v === OPEN) {
      openCount++;
      if (lit[i]) litCount++;
    } else if (v !== BLOCK) {
      let n = 0;
      for (const nb of orthNeighbors(p, i)) if (cores.has(nb)) n++;
      const state: -1 | 0 | 1 = n > v ? -1 : n === v ? 0 : 1;
      clueState.set(i, state);
      if (state !== 0) cluesOk = false;
    }
  }

  return {
    lit,
    conflicted,
    clueState,
    litCount,
    openCount,
    solved: litCount === openCount && conflicted.size === 0 && cluesOk,
  };
}

export function cloneCells(p: Puzzle): CellValue[] {
  return p.cells.slice();
}

export function serializePuzzle(p: Puzzle): string {
  return `${p.width}x${p.height}:${p.cells.join(',')}`;
}
