import { beamFrom, isClue, orthNeighbors } from './board.ts';
import { OPEN, type Puzzle } from './types.ts';
import type { Rng } from './rng.ts';

const UNKNOWN = 0;
const CORE = 1;
const FORBIDDEN = 2;

interface SolveResult {
  /** Number of solutions found, capped at `limit`. */
  count: number;
  /** First discovered solution, as a set of core indices. */
  solution: Set<number> | null;
}

/**
 * Counts solutions up to `limit` (use 2 for a uniqueness check). When an
 * `rng` is supplied, branching order is randomized so generation can sample
 * varied solutions from under-constrained boards.
 */
export function solve(p: Puzzle, limit = 2, rng?: Rng): SolveResult {
  const n = p.cells.length;
  const beams: number[][] = new Array(n);
  const clues: number[] = [];
  const clueNeighbors: number[][] = new Array(n);

  for (let i = 0; i < n; i++) {
    if (p.cells[i] === OPEN) beams[i] = beamFrom(p, i);
    if (isClue(p.cells[i])) {
      clues.push(i);
      clueNeighbors[i] = orthNeighbors(p, i).filter((j) => p.cells[j] === OPEN);
    }
  }

  const state = new Int8Array(n);
  const litBy = new Int16Array(n);
  const result: SolveResult = { count: 0, solution: null };

  const placeCore = (i: number): boolean => {
    state[i] = CORE;
    let ok = true;
    for (const c of beams[i]) {
      litBy[c]++;
      // Another core in our beam means two cores see each other.
      if (c !== i && state[c] === CORE) ok = false;
    }
    return ok;
  };

  const undoCore = (i: number) => {
    state[i] = UNKNOWN;
    for (const c of beams[i]) litBy[c]--;
  };

  /** Applies clue propagation to a fixpoint. Returns the trail for undo, or null on contradiction. */
  const propagate = (): { placed: number[]; forbidden: number[] } | null => {
    const placed: number[] = [];
    const forbidden: number[] = [];

    const fail = () => {
      for (let k = placed.length - 1; k >= 0; k--) undoCore(placed[k]);
      for (const f of forbidden) state[f] = UNKNOWN;
      return null;
    };

    let changed = true;
    while (changed) {
      changed = false;
      for (const ci of clues) {
        const v = p.cells[ci];
        let cores = 0;
        const unknowns: number[] = [];
        for (const nb of clueNeighbors[ci]) {
          if (state[nb] === CORE) cores++;
          else if (state[nb] === UNKNOWN && litBy[nb] === 0) unknowns.push(nb);
        }
        if (cores > v) return fail();
        if (cores + unknowns.length < v) return fail();
        if (cores === v && unknowns.length > 0) {
          for (const u of unknowns) {
            state[u] = FORBIDDEN;
            forbidden.push(u);
          }
          changed = true;
        } else if (cores < v && cores + unknowns.length === v) {
          for (const u of unknowns) {
            placed.push(u);
            if (!placeCore(u)) return fail();
          }
          changed = true;
        }
      }
    }
    return { placed, forbidden };
  };

  const undoPropagation = (prop: { placed: number[]; forbidden: number[] }) => {
    for (let k = prop.placed.length - 1; k >= 0; k--) undoCore(prop.placed[k]);
    for (const f of prop.forbidden) state[f] = UNKNOWN;
  };

  const search = (): void => {
    if (result.count >= limit) return;
    const prop = propagate();
    if (!prop) return;

    // Find the unlit open cell with the fewest viable core positions.
    let bestCands: number[] | null = null;
    for (let i = 0; i < n; i++) {
      if (p.cells[i] !== OPEN || litBy[i] > 0) continue;
      const cands = beams[i].filter((c) => state[c] === UNKNOWN && litBy[c] === 0);
      if (cands.length === 0) {
        undoPropagation(prop);
        return; // This cell can never be powered.
      }
      if (bestCands === null || cands.length < bestCands.length) {
        bestCands = cands;
        if (cands.length === 1) break;
      }
    }

    if (bestCands === null) {
      // Fully lit; verify every clue is met exactly.
      let ok = true;
      for (const ci of clues) {
        let cores = 0;
        for (const nb of clueNeighbors[ci]) if (state[nb] === CORE) cores++;
        if (cores !== p.cells[ci]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        result.count++;
        if (!result.solution) {
          const sol = new Set<number>();
          for (let i = 0; i < n; i++) if (state[i] === CORE) sol.add(i);
          result.solution = sol;
        }
      }
      undoPropagation(prop);
      return;
    }

    let order = bestCands;
    if (rng) {
      order = order.slice();
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    const tried: number[] = [];
    for (const cand of order) {
      if (result.count >= limit) break;
      if (placeCore(cand)) search();
      undoCore(cand);
      // Forbid this candidate so subsequent branches yield distinct solutions.
      state[cand] = FORBIDDEN;
      tried.push(cand);
    }
    for (const t of tried) state[t] = UNKNOWN;
    undoPropagation(prop);
  };

  search();
  return result;
}

/**
 * Hint against the puzzle's canonical solution: first flags a misplaced core
 * for removal, otherwise reveals one correct placement the player is missing.
 */
export function findHint(p: Puzzle, cores: Set<number>): { kind: 'place' | 'remove'; cell: number } | null {
  const solution = solve(p, 1).solution;
  if (!solution) return null;
  for (const c of cores) if (!solution.has(c)) return { kind: 'remove', cell: c };
  for (const c of solution) if (!cores.has(c)) return { kind: 'place', cell: c };
  return null;
}
