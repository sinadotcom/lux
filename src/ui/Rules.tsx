import { audio } from '../audio/engine.ts';
import { useT } from '../i18n.ts';
import { useLux } from '../state/store.ts';

const SECTIONS = ['goal', 'core', 'see', 'clue', 'win', 'tools'] as const;

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

      <div className="rules-list">
        {SECTIONS.map((s) => (
          <div key={s} className="rule-row">
            <h4>{t(`rules.${s}.h`)}</h4>
            <p>{t(`rules.${s}.b`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
