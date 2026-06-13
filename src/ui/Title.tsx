import { audio } from '../audio/engine.ts';
import { useT } from '../i18n.ts';
import { useLux } from '../state/store.ts';

export function Title() {
  const setScreen = useLux((s) => s.setScreen);
  const t = useT();
  return (
    <div className="screen title-screen">
      <div className="label" style={{ marginBottom: 18 }}>{t('title.tag')}</div>
      <h1 className="wordmark">LUX</h1>
      <div className="label" style={{ marginBottom: 56 }}>{t('title.sub')}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn primary"
          autoFocus
          onClick={() => {
            audio.ensure();
            audio.uiTick();
            setScreen('map');
          }}
        >
          {t('title.begin')}
        </button>
        <button className="btn" onClick={() => { audio.ensure(); audio.uiTick(); setScreen('rules'); }}>
          {t('title.rules')}
        </button>
      </div>
    </div>
  );
}
