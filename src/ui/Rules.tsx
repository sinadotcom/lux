import { audio } from '../audio/engine.ts';
import { useT } from '../i18n.ts';
import { useLux } from '../state/store.ts';

const SECTIONS = ['goal', 'core', 'see', 'clue', 'win', 'tools'] as const;

/** The rules content, shared by the standalone screen and the in-game modal. */
export function RulesBody() {
  const t = useT();
  return (
    <div className="rules-list">
      {SECTIONS.map((s) => (
        <div key={s} className="rule-row">
          <h4>{t(`rules.${s}.h`)}</h4>
          <p>{t(`rules.${s}.b`)}</p>
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
