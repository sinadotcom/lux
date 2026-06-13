import type { Progress } from '../state/store.ts';
import { DISTRICTS } from './districts.ts';

export interface Achievement {
  id: string;
  /** Whether the player has earned it, from current progress. */
  earned: (p: Progress) => boolean;
}

const solvedCount = (p: Progress) => Object.values(p.districts).filter((d) => d.solved).length;
const perfectCount = (p: Progress) => Object.values(p.districts).filter((d) => d.perfect).length;

/** Ordered list; i18n keys are ach.<id>.t (title) and ach.<id>.d (description). */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstLight', earned: (p) => solvedCount(p) >= 1 },
  { id: 'quarter', earned: (p) => solvedCount(p) >= 6 },
  { id: 'half', earned: (p) => solvedCount(p) >= 12 },
  { id: 'wholeCity', earned: (p) => solvedCount(p) >= DISTRICTS.length },
  { id: 'flawlessOne', earned: (p) => perfectCount(p) >= 1 },
  { id: 'flawlessFive', earned: (p) => perfectCount(p) >= 5 },
  { id: 'streakThree', earned: (p) => p.streak >= 3 },
  { id: 'streakSeven', earned: (p) => p.streak >= 7 },
  { id: 'dailyTen', earned: (p) => p.dailies.length >= 10 },
];

export function earnedCount(p: Progress): number {
  return ACHIEVEMENTS.filter((a) => a.earned(p)).length;
}
