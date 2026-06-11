/**
 * The grid model underlying every district.
 *
 * Internally this is the classic Light Up constraint system; outwardly the
 * game only ever speaks of structures, energy cores and powered streets.
 */

/** An open street cell where an energy core may be installed. */
export const OPEN = -1;
/** A structure with no power requirement printed on it. */
export const BLOCK = 5;
/** Values 0..4 are structures requiring exactly N adjacent cores. */
export type CellValue = -1 | 0 | 1 | 2 | 3 | 4 | 5;

export interface Puzzle {
  width: number;
  height: number;
  /** Row-major cell values. */
  cells: CellValue[];
}

/** Set of cell indices currently holding an energy core. */
export type Cores = Set<number>;

export interface BoardEvaluation {
  /** True for every open cell currently receiving power. */
  lit: boolean[];
  /** Core indices that can see another core (an overload conflict). */
  conflicted: Set<number>;
  /** Structure index -> satisfaction: -1 over, 0 exact, 1 under. */
  clueState: Map<number, -1 | 0 | 1>;
  /** Count of open cells receiving power. */
  litCount: number;
  /** Count of open cells in total. */
  openCount: number;
  solved: boolean;
}
