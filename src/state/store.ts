import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { evaluate } from '../game/board.ts';
import { findHint } from '../game/solver.ts';
import { dailyPuzzle, todayKey } from '../game/daily.ts';
import { DISTRICTS, DISTRICT_BY_ID, districtPuzzle, INITIAL_DISTRICTS } from '../game/districts.ts';
import type { Puzzle } from '../game/types.ts';

export type Screen = 'title' | 'map' | 'play' | 'archive' | 'rules';
export type Lang = 'en' | 'tr';
export type Phase = 'playing' | 'cinematic' | 'complete';

export interface DistrictProgress {
  solved: boolean;
  perfect: boolean;
  bestTimeMs: number | null;
}

export interface Progress {
  districts: Record<string, DistrictProgress>;
  /** Daily keys (YYYY-MM-DD) that were solved. */
  dailies: string[];
  streak: number;
  lastDaily: string | null;
  totalCores: number;
  totalPowered: number;
  memories: string[];
  /** Whether the city-restored finale has played once. */
  finaleSeen: boolean;
  /** Saved cores for puzzles left mid-solve, keyed by d:<id> or daily:<key>. */
  inProgress: Record<string, number[]>;
}

export interface Settings {
  audio: boolean;
  reducedMotion: boolean;
  reducedParticles: boolean;
  colorblind: boolean;
  lang: Lang;
}

export interface Hint {
  kind: 'place' | 'remove';
  cell: number;
}

export interface Session {
  mode: 'district' | 'daily';
  districtId: string | null;
  dailyKey: string | null;
  name: string;
  epigraph: string;
  hue: number;
  puzzle: Puzzle;
  cores: number[];
  history: number[][];
  hintsUsed: number;
  undosUsed: number;
  startedAt: number;
  phase: Phase;
  /** Most recently placed core, for the landing/pulse animation. */
  lastPlaced: number | null;
  /** Monotonic counter so effects can react to each placement. */
  moveSeq: number;
  hint: Hint | null;
  /** Set when this solve restores the final district — drives the grand cinematic. */
  grandFinale: boolean;
}

interface LuxState {
  screen: Screen;
  session: Session | null;
  progress: Progress;
  settings: Settings;
  /** Cell currently focused by keyboard navigation. */
  cursor: number | null;

  setScreen: (s: Screen) => void;
  startDistrict: (id: string) => void;
  startDaily: () => void;
  toggleCore: (cell: number) => void;
  undo: () => void;
  resetBoard: () => void;
  requestHint: () => void;
  clearHint: () => void;
  finishCinematic: () => void;
  markFinaleSeen: () => void;
  leaveSession: () => void;
  setCursor: (cell: number | null) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SAVE_KEY = 'lux-save-v1';

const defaultProgress = (): Progress => ({
  districts: {},
  dailies: [],
  streak: 0,
  lastDaily: null,
  totalCores: 0,
  totalPowered: 0,
  memories: [],
  finaleSeen: false,
  inProgress: {},
});

const defaultSettings = (): Settings => ({
  audio: true,
  reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  reducedParticles: false,
  colorblind: false,
  lang: typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en',
});

function loadSave(): { progress: Progress; settings: Settings } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        progress: { ...defaultProgress(), ...data.progress },
        settings: { ...defaultSettings(), ...data.settings },
      };
    }
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return { progress: defaultProgress(), settings: defaultSettings() };
}

function persist(progress: Progress, settings: Settings) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ progress, settings }));
  } catch {
    // Private mode or quota: play on without saving.
  }
}

/** localStorage key under which a mid-solve board is saved. */
function sessionKey(s: { mode: 'district' | 'daily'; districtId: string | null; dailyKey: string | null }): string {
  return s.mode === 'district' ? `d:${s.districtId}` : `daily:${s.dailyKey}`;
}

function isYesterday(prevKey: string, nowKey: string): boolean {
  const prev = new Date(`${prevKey}T12:00:00`);
  prev.setDate(prev.getDate() + 1);
  return todayKey(prev) === nowKey;
}

export const useLux = create<LuxState>()(
  subscribeWithSelector((set, get) => ({
    screen: 'title',
    session: null,
    cursor: null,
    ...loadSave(),

    setScreen: (s) => set({ screen: s }),

    startDistrict: (id) => {
      const d = DISTRICT_BY_ID.get(id);
      if (!d) return;
      const { progress } = get();
      const saved = progress.inProgress[`d:${id}`] ?? [];
      set({
        screen: 'play',
        cursor: null,
        session: {
          mode: 'district',
          districtId: id,
          dailyKey: null,
          name: d.name,
          epigraph: d.epigraph,
          hue: d.hue,
          puzzle: districtPuzzle(id),
          cores: saved,
          history: [],
          hintsUsed: 0,
          undosUsed: 0,
          startedAt: Date.now(),
          phase: 'playing',
          lastPlaced: null,
          moveSeq: 0,
          hint: null,
          grandFinale: false,
        },
      });
    },

    startDaily: () => {
      const { key, name, puzzle } = dailyPuzzle();
      const { progress } = get();
      const saved = progress.inProgress[`daily:${key}`] ?? [];
      set({
        screen: 'play',
        cursor: null,
        session: {
          mode: 'daily',
          districtId: null,
          dailyKey: key,
          name,
          epigraph: 'Today the grid asks for this district by name.',
          hue: 0.095,
          puzzle,
          cores: saved,
          history: [],
          hintsUsed: 0,
          undosUsed: 0,
          startedAt: Date.now(),
          phase: 'playing',
          lastPlaced: null,
          moveSeq: 0,
          hint: null,
          grandFinale: false,
        },
      });
    },

    toggleCore: (cell) => {
      const { session, progress, settings } = get();
      if (!session || session.phase !== 'playing') return;
      if (session.puzzle.cells[cell] !== -1) return;

      const had = session.cores.includes(cell);
      // Placing is only allowed on dark ground. A cell already lit by another
      // core can't take a second core — to clear it you tap the core itself.
      if (!had) {
        const lit = evaluate(session.puzzle, new Set(session.cores)).lit;
        if (lit[cell]) return;
      }
      const cores = had ? session.cores.filter((c) => c !== cell) : [...session.cores, cell];
      const next: Session = {
        ...session,
        cores,
        history: [...session.history, session.cores],
        lastPlaced: had ? null : cell,
        moveSeq: session.moveSeq + 1,
        hint: null,
      };

      const key = sessionKey(session);
      const ev = evaluate(session.puzzle, new Set(cores));
      if (ev.solved) {
        next.phase = 'cinematic';
        const elapsed = Date.now() - session.startedAt;
        const perfect = session.hintsUsed === 0 && session.undosUsed === 0;
        // Clear the saved mid-solve board for this puzzle.
        const { [key]: _done, ...restInProgress } = progress.inProgress;
        const newProgress: Progress = {
          ...progress,
          inProgress: restInProgress,
          totalCores: progress.totalCores + cores.length,
          totalPowered: progress.totalPowered + ev.openCount,
        };
        if (session.mode === 'district' && session.districtId) {
          const prev = progress.districts[session.districtId];
          newProgress.districts = {
            ...progress.districts,
            [session.districtId]: {
              solved: true,
              perfect: (prev?.perfect ?? false) || perfect,
              bestTimeMs: prev?.bestTimeMs != null ? Math.min(prev.bestTimeMs, elapsed) : elapsed,
            },
          };
          if (!progress.memories.includes(session.districtId)) {
            newProgress.memories = [...progress.memories, session.districtId];
          }
          // Did this restore the final dark district? Mark the grand finale.
          const allSolved = DISTRICTS.every((d) => newProgress.districts[d.id]?.solved);
          if (allSolved && !progress.finaleSeen) next.grandFinale = true;
        } else if (session.mode === 'daily' && session.dailyKey) {
          if (!progress.dailies.includes(session.dailyKey)) {
            newProgress.dailies = [...progress.dailies, session.dailyKey];
            newProgress.streak =
              progress.lastDaily && isYesterday(progress.lastDaily, session.dailyKey) ? progress.streak + 1 : 1;
            newProgress.lastDaily = session.dailyKey;
          }
        }
        persist(newProgress, settings);
        set({ session: next, progress: newProgress });
        return;
      }
      // Save the in-progress board so leaving and returning resumes it.
      const savedProgress: Progress = { ...progress, inProgress: { ...progress.inProgress, [key]: cores } };
      persist(savedProgress, settings);
      set({ session: next, progress: savedProgress });
    },

    undo: () => {
      const { session, progress, settings } = get();
      if (!session || session.phase !== 'playing' || session.history.length === 0) return;
      const history = session.history.slice();
      const cores = history.pop()!;
      const savedProgress: Progress = {
        ...progress,
        inProgress: { ...progress.inProgress, [sessionKey(session)]: cores },
      };
      persist(savedProgress, settings);
      set({
        session: { ...session, cores, history, undosUsed: session.undosUsed + 1, lastPlaced: null, hint: null, moveSeq: session.moveSeq + 1 },
        progress: savedProgress,
      });
    },

    resetBoard: () => {
      const { session, progress, settings } = get();
      if (!session || session.phase !== 'playing' || session.cores.length === 0) return;
      const savedProgress: Progress = { ...progress, inProgress: { ...progress.inProgress, [sessionKey(session)]: [] } };
      persist(savedProgress, settings);
      set({
        session: {
          ...session,
          cores: [],
          history: [...session.history, session.cores],
          lastPlaced: null,
          hint: null,
          moveSeq: session.moveSeq + 1,
        },
        progress: savedProgress,
      });
    },

    requestHint: () => {
      const { session } = get();
      if (!session || session.phase !== 'playing') return;
      const hint = findHint(session.puzzle, new Set(session.cores));
      if (hint) set({ session: { ...session, hint, hintsUsed: session.hintsUsed + 1 } });
    },

    clearHint: () => {
      const { session } = get();
      if (session?.hint) set({ session: { ...session, hint: null } });
    },

    finishCinematic: () => {
      const { session } = get();
      if (session?.phase === 'cinematic') set({ session: { ...session, phase: 'complete' } });
    },

    markFinaleSeen: () => {
      const { progress, settings } = get();
      if (progress.finaleSeen) return;
      const next = { ...progress, finaleSeen: true };
      persist(next, settings);
      set({ progress: next });
    },

    leaveSession: () => set({ session: null, screen: 'map', cursor: null }),

    setCursor: (cursor) => set({ cursor }),

    setSetting: (key, value) => {
      const settings = { ...get().settings, [key]: value };
      persist(get().progress, settings);
      set({ settings });
    },
  })),
);

/** Districts currently visible on the world map. */
export function visibleDistricts(progress: Progress): Set<string> {
  const visible = new Set(INITIAL_DISTRICTS);
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of [...visible]) {
      if (progress.districts[id]?.solved) {
        for (const u of DISTRICT_BY_ID.get(id)?.unlocks ?? []) {
          if (!visible.has(u)) {
            visible.add(u);
            grew = true;
          }
        }
      }
    }
  }
  return visible;
}

export function completionPercent(progress: Progress): number {
  const solved = Object.values(progress.districts).filter((d) => d.solved).length;
  return Math.round((solved / DISTRICT_BY_ID.size) * 100);
}

/** True once every district has been restored. */
export function cityComplete(progress: Progress): boolean {
  return DISTRICTS.every((d) => progress.districts[d.id]?.solved);
}
