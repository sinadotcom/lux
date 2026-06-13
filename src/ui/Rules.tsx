import { audio } from '../audio/engine.ts';
import { useT } from '../i18n.ts';
import { useLux } from '../state/store.ts';

const SECTIONS = ['goal', 'core', 'see', 'clue', 'win', 'tools'] as const;
type Section = (typeof SECTIONS)[number];

// Mini board patterns illustrating each rule. Legend:
//   .  dark open   *  lit street   #  building   O  core   !  conflicting core
//   0-4 numbered building   x  X-building (no core)   h  hint ring
const PATTERNS: Record<Section, string[]> = {
  goal: ['.*..', '#O**', '.*.#', '.*..'],
  core: ['.*...', '.*...', '*O**#', '.*...', '.*...'],
  see: ['.....', '!**!.', '.....'],
  clue: ['.O.', 'O2.', 'x..'],
  win: ['*O*#', '***O', 'O***', '#*O*'],
  tools: ['....', '.h*O', '....'],
};

const CELL = 22;
const GAP = 3;
const R = 4;

function MiniGrid({ rows }: { rows: string[] }) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const step = CELL + GAP;
  const W = w * step - GAP;
  const H = h * step - GAP;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      const x = c * step;
      const y = r * step;
      const cx = x + CELL / 2;
      const cy = y + CELL / 2;
      const key = `${r}-${c}`;
      const building = ch === '#' || ch === 'x' || /[0-9]/.test(ch);
      const lit = ch === '*' || ch === 'O' || ch === '!';

      // base tile
      cells.push(
        <rect
          key={`b${key}`}
          x={x}
          y={y}
          width={CELL}
          height={CELL}
          rx={R}
          fill={building ? '#0c0d10' : lit ? 'rgba(255,184,84,0.20)' : '#16181d'}
          stroke={lit ? 'rgba(255,184,84,0.45)' : 'rgba(232,228,218,0.10)'}
          strokeWidth={1}
        />,
      );

      if (/[0-9]/.test(ch)) {
        cells.push(
          <text key={`t${key}`} x={cx} y={cy} className="rd-num" textAnchor="middle" dominantBaseline="central">
            {ch}
          </text>,
        );
      } else if (ch === 'x') {
        cells.push(
          <text key={`t${key}`} x={cx} y={cy} className="rd-x" textAnchor="middle" dominantBaseline="central">
            ✕
          </text>,
        );
      } else if (ch === 'O' || ch === '!') {
        const conflict = ch === '!';
        cells.push(
          <circle
            key={`c${key}`}
            cx={cx}
            cy={cy}
            r={6}
            fill={conflict ? '#9fb8d8' : '#ffce86'}
            style={{ filter: `drop-shadow(0 0 5px ${conflict ? 'rgba(159,184,216,0.9)' : 'rgba(255,184,84,0.95)'})` }}
          />,
        );
      } else if (ch === 'h') {
        cells.push(
          <circle
            key={`h${key}`}
            cx={cx}
            cy={cy}
            r={7}
            fill="none"
            stroke="#ffd9a0"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />,
        );
      }
    }
  }

  return (
    <svg className="rule-figure" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {cells}
    </svg>
  );
}

/** The rules content, shared by the standalone screen and the in-game modal. */
export function RulesBody() {
  const t = useT();
  return (
    <div className="rules-list">
      {SECTIONS.map((s) => (
        <div key={s} className="rule-row">
          <MiniGrid rows={PATTERNS[s]} />
          <div className="rule-text">
            <h4>{t(`rules.${s}.h`)}</h4>
            <p>{t(`rules.${s}.b`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-screen rules, reachable from the world map. */
export function Rules() {
  const t = useT();
  const setScreen = useLux((s) => s.setScreen);

  return (
    <div className="screen archive">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="label">{t('rules.kicker')}</div>
          <h2 className="district-name" style={{ marginTop: 8 }}>{t('rules.title')}</h2>
        </div>
        <button className="btn" onClick={() => { audio.uiTick(); setScreen('map'); }}>{t('common.back')}</button>
      </div>
      <RulesBody />
    </div>
  );
}

/** In-game rules modal — overlays the board without ending the session. */
export function RulesOverlay({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div className="veil" onClick={onClose}>
      <div className="card rules-card" onClick={(e) => e.stopPropagation()}>
        <div className="label" style={{ marginBottom: 4 }}>{t('rules.kicker')}</div>
        <h3 style={{ marginTop: 0 }}>{t('rules.title')}</h3>
        <RulesBody />
        <button className="btn primary" autoFocus style={{ marginTop: 26 }} onClick={onClose}>
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}
