import { useMemo, useRef } from 'react';
import { evaluate, xy } from '../game/board.ts';
import type { Puzzle } from '../game/types.ts';

export interface EnergyField {
  /** Per-cell power level in [0,1], animated. Call tick() each frame. */
  levels: Float32Array;
  eval: ReturnType<typeof evaluate>;
  /** Advances the animation; returns true while anything is still moving. */
  tick: (nowMs: number, dtSec: number, instant: boolean) => boolean;
}

/**
 * Translates the discrete lit/unlit state into a continuous, time-staggered
 * energy field: when a core lands, power visibly travels outward along the
 * streets at a fixed speed instead of appearing all at once.
 */
export function useEnergyField(puzzle: Puzzle, cores: number[], lastPlaced: number | null, moveSeq: number): EnergyField {
  const levels = useMemo(() => new Float32Array(puzzle.cells.length), [puzzle]);
  const litAt = useRef<Float64Array>(new Float64Array(0));
  const prevSeq = useRef(-1);

  const ev = useMemo(() => evaluate(puzzle, new Set(cores)), [puzzle, cores]);

  if (litAt.current.length !== puzzle.cells.length) {
    litAt.current = new Float64Array(puzzle.cells.length).fill(Infinity);
    prevSeq.current = -1;
  }

  if (prevSeq.current !== moveSeq) {
    prevSeq.current = moveSeq;
    const now = performance.now();
    const SPREAD_MS = 70; // per cell of distance — a full beam awakens in ~600ms
    for (let i = 0; i < puzzle.cells.length; i++) {
      if (ev.lit[i]) {
        if (litAt.current[i] === Infinity) {
          let delay = 0;
          if (lastPlaced != null) {
            const [ax, ay] = xy(puzzle, i);
            const [bx, by] = xy(puzzle, lastPlaced);
            delay = (Math.abs(ax - bx) + Math.abs(ay - by)) * SPREAD_MS;
          }
          litAt.current[i] = now + delay;
        }
      } else {
        litAt.current[i] = Infinity;
      }
    }
  }

  return useMemo<EnergyField>(
    () => ({
      levels,
      eval: ev,
      tick: (nowMs, dtSec, instant) => {
        let moving = false;
        for (let i = 0; i < levels.length; i++) {
          const target = nowMs >= litAt.current[i] ? 1 : 0;
          if (instant) {
            levels[i] = target;
            continue;
          }
          const cur = levels[i];
          if (Math.abs(cur - target) < 0.002) {
            levels[i] = target;
            continue;
          }
          // Exponential ease, frame-rate independent. Power rises faster than it drains.
          const k = 1 - Math.exp(-dtSec * (target > cur ? 11 : 7));
          levels[i] = cur + (target - cur) * k;
          moving = true;
        }
        return moving;
      },
    }),
    [levels, ev],
  );
}
