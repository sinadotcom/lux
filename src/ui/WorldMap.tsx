import { audio } from '../audio/engine.ts';
import { DISTRICTS, DISTRICT_BY_ID } from '../game/districts.ts';
import { todayKey } from '../game/daily.ts';
import { completionPercent, useLux, visibleDistricts } from '../state/store.ts';

const W = 1000;
const H = 700;
const PAD = 90;

const px = (x: number) => PAD + x * (W - PAD * 2);
const py = (y: number) => PAD + y * (H - PAD * 2);

/**
 * The world in darkness. Every restored district becomes a point of light;
 * routes appear between districts as the grid reconnects. The map itself is
 * the long-term reward.
 */
export function WorldMap() {
  const progress = useLux((s) => s.progress);
  const startDistrict = useLux((s) => s.startDistrict);
  const startDaily = useLux((s) => s.startDaily);
  const setScreen = useLux((s) => s.setScreen);

  const visible = visibleDistricts(progress);
  const pct = completionPercent(progress);
  const dailyDone = progress.dailies.includes(todayKey());

  return (
    <div className="screen" style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 40%, #0b0b0d, #070708 75%)' }}>
      <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="list" aria-label="City districts">
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="#ffb454" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffb454" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Routes between connected districts */}
        {DISTRICTS.flatMap((d) =>
          d.unlocks
            .filter((u) => visible.has(d.id) && visible.has(u))
            .map((u) => {
              const a = d.map;
              const b = DISTRICT_BY_ID.get(u)!.map;
              const live = progress.districts[d.id]?.solved && progress.districts[u]?.solved;
              return (
                <line
                  key={`${d.id}-${u}`}
                  x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
                  stroke={live ? 'rgba(255,180,84,0.5)' : 'rgba(232,228,218,0.12)'}
                  strokeWidth={live ? 1.5 : 1}
                  strokeDasharray={live ? undefined : '2 6'}
                />
              );
            }),
        )}

        {DISTRICTS.filter((d) => visible.has(d.id)).map((d) => {
          const solved = progress.districts[d.id]?.solved ?? false;
          const perfect = progress.districts[d.id]?.perfect ?? false;
          const x = px(d.map.x);
          const y = py(d.map.y);
          return (
            <g
              key={d.id}
              className={`map-node ${solved ? 'solved' : ''}`}
              role="listitem"
              tabIndex={0}
              aria-label={`${d.name}${solved ? ', restored' : ', dark'}`}
              onClick={() => {
                audio.ensure();
                audio.uiTick();
                startDistrict(d.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startDistrict(d.id);
                }
              }}
            >
              {/* Generous invisible touch target */}
              <circle cx={x} cy={y + 8} r={34} fill="transparent" />
              {solved && <circle cx={x} cy={y} r={42} fill="url(#nodeGlow)" />}
              <circle
                cx={x} cy={y} r={solved ? 7 : 9}
                fill={solved ? '#ffb454' : 'none'}
                stroke={solved ? '#ffd9a0' : 'rgba(232,228,218,0.5)'}
                strokeWidth={1.2}
              />
              {!solved && <circle cx={x} cy={y} r={3} fill="rgba(232,228,218,0.4)" />}
              {perfect && (
                <circle cx={x} cy={y} r={14} fill="none" stroke="rgba(255,217,160,0.6)" strokeWidth={0.8} />
              )}
              <text x={x} y={y + 30} textAnchor="middle">{d.name}</text>
            </g>
          );
        })}
      </svg>

      <div className="map-overlay">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="label">The city</div>
            <div style={{ fontSize: 28, fontWeight: 200, letterSpacing: '0.1em', marginTop: 6 }}>
              {pct}<span style={{ fontSize: 15, color: 'var(--ivory-dim)' }}> % restored</span>
            </div>
            {progress.streak > 1 && (
              <div className="label" style={{ marginTop: 8 }}>{progress.streak}-day restoration streak</div>
            )}
          </div>
          <div className="icon-row">
            <button
              className={`btn ${dailyDone ? '' : 'primary'}`}
              onClick={() => {
                audio.ensure();
                audio.uiTick();
                startDaily();
              }}
            >
              {dailyDone ? 'Daily city · restored' : 'Daily city'}
            </button>
            <button className="btn" onClick={() => { audio.uiTick(); setScreen('archive'); }}>Archive</button>
          </div>
        </div>
        <div className="label" style={{ textAlign: 'center' }}>
          Select a darkened district to begin its restoration
        </div>
      </div>
    </div>
  );
}
