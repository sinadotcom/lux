import { useEffect, useMemo } from 'react';
import { audio } from '../audio/engine.ts';
import { evaluate, idx, inBounds, xy } from '../game/board.ts';
import { DISTRICT_BY_ID } from '../game/districts.ts';
import { OPEN } from '../game/types.ts';
import { CityScene } from '../scene/CityScene.tsx';
import { useLux } from '../state/store.ts';

export function PlayScreen() {
  const session = useLux((s) => s.session);
  if (!session) return null;
  return (
    <div className="screen" style={{ background: '#0a0b0e' }}>
      <CityScene />
      <Hud />
      {session.phase === 'cinematic' && (
        <div className="cinematic-caption">
          <div className="label" style={{ color: 'var(--gold)', letterSpacing: '0.34em' }}>Power restored</div>
        </div>
      )}
      {session.phase === 'complete' && <CompletionCard />}
    </div>
  );
}

function Hud() {
  const session = useLux((s) => s.session)!;
  const undo = useLux((s) => s.undo);
  const requestHint = useLux((s) => s.requestHint);
  const leaveSession = useLux((s) => s.leaveSession);
  const cursor = useLux((s) => s.cursor);
  const setCursor = useLux((s) => s.setCursor);
  const toggleCore = useLux((s) => s.toggleCore);

  const ev = useMemo(() => evaluate(session.puzzle, new Set(session.cores)), [session.puzzle, session.cores]);
  const pct = ev.openCount ? Math.round((ev.litCount / ev.openCount) * 100) : 0;
  const playing = session.phase === 'playing';

  // Keyboard restoration: arrows roam the streets, space installs a core.
  useEffect(() => {
    const p = session.puzzle;
    const firstOpen = () => p.cells.findIndex((c) => c === OPEN);

    const step = (from: number, dx: number, dy: number): number => {
      let [x, y] = xy(p, from);
      for (;;) {
        x += dx;
        y += dy;
        if (!inBounds(p, x, y)) return from;
        const i = idx(p, x, y);
        if (p.cells[i] === OPEN) return i;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        leaveSession();
        return;
      }
      if (!playing) return;
      const cur = cursor ?? firstOpen();
      switch (e.key) {
        case 'ArrowLeft': setCursor(step(cur, -1, 0)); break;
        case 'ArrowRight': setCursor(step(cur, 1, 0)); break;
        case 'ArrowUp': setCursor(step(cur, 0, -1)); break;
        case 'ArrowDown': setCursor(step(cur, 0, 1)); break;
        case ' ':
        case 'Enter':
          if (cursor != null) {
            e.preventDefault();
            toggleCore(cursor);
          } else {
            setCursor(cur);
          }
          break;
        case 'u': case 'U': undo(); break;
        case 'h': case 'H': requestHint(); break;
        default: return;
      }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session.puzzle, cursor, playing, setCursor, toggleCore, undo, requestHint, leaveSession]);

  return (
    <div className={`hud ${playing ? '' : 'hidden'}`}>
      <div className="hud-top">
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            {session.mode === 'daily' ? 'Daily city' : 'District'}
          </div>
          <h2 className="district-name">{session.name}</h2>
          <div className="epigraph" style={{ marginTop: 8, maxWidth: 300 }}>{session.epigraph}</div>
        </div>
        <div className="power-meter">
          <div className="label" style={{ marginBottom: 4 }}>Power</div>
          <div className="value">{pct}%</div>
          {ev.conflicted.size > 0 && (
            <div className="label" style={{ color: '#9fb8d8', marginTop: 6 }}>Grid overload</div>
          )}
        </div>
      </div>
      <div className="hud-bottom">
        <button className="btn" disabled={session.history.length === 0} onClick={() => { audio.uiTick(); undo(); }}>
          Undo
        </button>
        <button className="btn" onClick={() => requestHint()}>
          Survey{session.hintsUsed > 0 ? ` · ${session.hintsUsed}` : ''}
        </button>
        <button className="btn" onClick={() => { audio.uiTick(); leaveSession(); }}>
          City map
        </button>
      </div>
    </div>
  );
}

function CompletionCard() {
  const session = useLux((s) => s.session)!;
  const progress = useLux((s) => s.progress);
  const leaveSession = useLux((s) => s.leaveSession);

  const district = session.districtId ? DISTRICT_BY_ID.get(session.districtId) : null;
  const perfect = session.hintsUsed === 0 && session.undosUsed === 0;

  return (
    <div className="veil">
      <div className="card">
        <div className="label memory-kind">
          {district ? `Memory recovered · ${district.memory.kind}` : 'Daily city restored'}
        </div>
        <h3>{district ? district.memory.title : `${session.name} hums back to life`}</h3>
        <p className="body">
          {district
            ? district.memory.body
            : `The grid holds. ${progress.streak > 1 ? `${progress.streak} days of light, unbroken.` : 'Come back tomorrow — another district will be waiting.'}`}
        </p>
        {perfect && (
          <>
            <div className="divider" />
            <div className="label" style={{ color: 'var(--gold)', marginBottom: 22 }}>Flawless restoration</div>
          </>
        )}
        <button className="btn primary" autoFocus onClick={() => { audio.uiTick(); leaveSession(); }}>
          Return to the city
        </button>
      </div>
    </div>
  );
}
