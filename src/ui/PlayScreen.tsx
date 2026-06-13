import { useEffect, useMemo, useState } from 'react';
import { audio } from '../audio/engine.ts';
import { evaluate, idx, inBounds, xy } from '../game/board.ts';
import { DISTRICT_BY_ID } from '../game/districts.ts';
import { districtTextById } from '../game/districtText.ts';
import { OPEN } from '../game/types.ts';
import { CityScene } from '../scene/CityScene.tsx';
import { useT } from '../i18n.ts';
import { useLux } from '../state/store.ts';
import { RulesOverlay } from './Rules.tsx';

export function PlayScreen() {
  const session = useLux((s) => s.session);
  const t = useT();
  if (!session) return null;
  return (
    <div className="screen" style={{ background: '#070708' }}>
      <CityScene />
      <Hud />
      {session.phase === 'cinematic' && (
        <div className="cinematic-caption">
          <div className="label" style={{ color: 'var(--gold)', letterSpacing: '0.34em' }}>
            {session.grandFinale ? t('cine.last') : t('cine.restored')}
          </div>
        </div>
      )}
      {session.phase === 'complete' && <CompletionCard />}
    </div>
  );
}

function Hud() {
  const session = useLux((s) => s.session)!;
  const undo = useLux((s) => s.undo);
  const resetBoard = useLux((s) => s.resetBoard);
  const requestHint = useLux((s) => s.requestHint);
  const leaveSession = useLux((s) => s.leaveSession);
  const cursor = useLux((s) => s.cursor);
  const setCursor = useLux((s) => s.setCursor);
  const toggleCore = useLux((s) => s.toggleCore);
  const lang = useLux((s) => s.settings.lang);
  const t = useT();
  const [showRules, setShowRules] = useState(false);

  const localized = session.districtId ? districtTextById(session.districtId, lang) : null;
  const displayName = localized ? localized.name : session.name;
  const displayEpigraph = session.mode === 'daily' ? t('daily.epigraph') : localized ? localized.epigraph : session.epigraph;

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
        case 'r': case 'R': resetBoard(); break;
        case 'h': case 'H': requestHint(); break;
        default: return;
      }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session.puzzle, cursor, playing, setCursor, toggleCore, undo, resetBoard, requestHint, leaveSession]);

  return (
    <div className={`hud ${playing ? '' : 'hidden'}`}>
      <div className="hud-top">
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            {session.mode === 'daily' ? t('hud.daily') : t('hud.district')}
          </div>
          <h2 className="district-name">{displayName}</h2>
          <div className="epigraph" style={{ marginTop: 8, maxWidth: 300 }}>{displayEpigraph}</div>
        </div>
        <div className="power-meter">
          <div className="label" style={{ marginBottom: 4 }}>{t('hud.power')}</div>
          <div className="value">{pct}%</div>
          {ev.conflicted.size > 0 && (
            <div className="label" style={{ color: '#9fb8d8', marginTop: 6 }}>{t('hud.overload')}</div>
          )}
        </div>
      </div>
      <div className="hud-bottom">
        <button className="btn" disabled={session.history.length === 0} onClick={() => { audio.uiTick(); undo(); }}>
          {t('hud.undo')}
        </button>
        <button className="btn" disabled={session.cores.length === 0} onClick={() => { audio.uiTick(); resetBoard(); }}>
          {t('hud.reset')}
        </button>
        <button className="btn" onClick={() => requestHint()}>
          {t('hud.survey')}{session.hintsUsed > 0 ? ` · ${session.hintsUsed}` : ''}
        </button>
        <button className="btn" onClick={() => { audio.uiTick(); setShowRules(true); }}>
          {t('rules.title')}
        </button>
        <button className="btn" onClick={() => { audio.uiTick(); leaveSession(); }}>
          {t('hud.map')}
        </button>
      </div>
      {showRules && <RulesOverlay onClose={() => { audio.uiTick(); setShowRules(false); }} />}
    </div>
  );
}

function CompletionCard() {
  const session = useLux((s) => s.session)!;
  const progress = useLux((s) => s.progress);
  const leaveSession = useLux((s) => s.leaveSession);
  const lang = useLux((s) => s.settings.lang);
  const t = useT();

  const district = session.districtId ? DISTRICT_BY_ID.get(session.districtId) : null;
  const text = session.districtId ? districtTextById(session.districtId, lang) : null;
  const perfect = session.hintsUsed === 0 && session.undosUsed === 0;

  if (session.grandFinale) {
    return (
      <div className="veil">
        <div className="card">
          <div className="label memory-kind" style={{ color: 'var(--gold)' }}>{t('done.grandKicker')}</div>
          <h3>{t('done.grandTitle')}</h3>
          <p className="body">{t('done.grandBody')}</p>
          <button className="btn primary" autoFocus onClick={() => { audio.uiTick(); leaveSession(); }}>
            {t('done.grandBtn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="veil">
      <div className="card">
        <div className="label memory-kind">
          {district ? t('done.memory', { kind: t(`kind.${district.memory.kind}`) }) : t('done.daily')}
        </div>
        <h3>{text ? text.memory.title : t('done.dailyTitle', { name: session.name })}</h3>
        <p className="body">
          {text
            ? text.memory.body
            : progress.streak > 1
              ? t('done.dailyStreak', { n: progress.streak })
              : t('done.dailyFirst')}
        </p>
        {perfect && (
          <>
            <div className="divider" />
            <div className="label" style={{ color: 'var(--gold)', marginBottom: 22 }}>{t('done.flawless')}</div>
          </>
        )}
        <button className="btn primary" autoFocus onClick={() => { audio.uiTick(); leaveSession(); }}>
          {t('done.return')}
        </button>
      </div>
    </div>
  );
}
