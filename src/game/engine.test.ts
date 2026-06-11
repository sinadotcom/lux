import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './board.ts';
import { solve, findHint } from './solver.ts';
import { generatePuzzle, DIFFICULTY_PRESETS } from './generator.ts';
import { dailyPuzzle } from './daily.ts';
import { DISTRICTS, districtPuzzle } from './districts.ts';
import { OPEN, type CellValue, type Puzzle } from './types.ts';

// Classic 7x7 Light Up example with a known unique solution.
// _ = open, # = blank wall, 0-4 = numbered wall.
function parse(rows: string[]): Puzzle {
  const height = rows.length;
  const width = rows[0].length;
  const cells: CellValue[] = [];
  for (const row of rows) {
    for (const ch of row) {
      if (ch === '_') cells.push(OPEN);
      else if (ch === '#') cells.push(5);
      else cells.push(Number(ch) as CellValue);
    }
  }
  return { width, height, cells };
}

test('solver finds and verifies a known board', () => {
  const p = parse(['__#____', '___2__1', '_1_____', '___#___', '_____0_', '0__1___', '____#__']);
  const res = solve(p, 2);
  assert.ok(res.solution, 'expected a solution');
  const ev = evaluate(p, res.solution!);
  assert.equal(ev.solved, true);
});

test('evaluate detects conflicts and unmet clues', () => {
  const p = parse(['___', '_1_', '___']);
  const ev = evaluate(p, new Set([0, 2])); // Two cores in the same row see each other.
  assert.equal(ev.conflicted.size, 2);
  assert.equal(ev.solved, false);
});

test('generator produces unique-solution puzzles across presets and seeds', () => {
  for (const preset of Object.values(DIFFICULTY_PRESETS)) {
    for (let seed = 1; seed <= 5; seed++) {
      const p = generatePuzzle(seed * 1013, preset);
      const res = solve(p, 2);
      assert.equal(res.count, 1, `seed ${seed} should be unique`);
      const ev = evaluate(p, res.solution!);
      assert.equal(ev.solved, true);
    }
  }
});

test('generation is deterministic for a fixed seed', () => {
  const a = generatePuzzle(42, DIFFICULTY_PRESETS.steady);
  const b = generatePuzzle(42, DIFFICULTY_PRESETS.steady);
  assert.deepEqual(a.cells, b.cells);
});

test('every district board is solvable and unique', () => {
  for (const d of DISTRICTS) {
    const p = districtPuzzle(d.id);
    const res = solve(p, 2);
    assert.equal(res.count, 1, `district ${d.id}`);
  }
});

test('daily puzzle reproduces for a fixed date key', () => {
  const a = dailyPuzzle('2026-06-11');
  const b = dailyPuzzle('2026-06-11');
  assert.deepEqual(a.puzzle.cells, b.puzzle.cells);
  assert.equal(solve(a.puzzle, 2).count, 1);
});

test('hints guide toward the canonical solution', () => {
  const p = districtPuzzle('harbor');
  const solution = solve(p, 1).solution!;
  const hint = findHint(p, new Set());
  assert.ok(hint && hint.kind === 'place' && solution.has(hint.cell));

  // A wrong core should be flagged for removal.
  const wrong = [...Array(p.cells.length).keys()].find((i) => p.cells[i] === OPEN && !solution.has(i))!;
  const hint2 = findHint(p, new Set([wrong]));
  assert.ok(hint2 && hint2.kind === 'remove' && hint2.cell === wrong);
});
