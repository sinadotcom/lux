import { audio } from '../audio/engine.ts';
import { DISTRICTS } from '../game/districts.ts';
import { districtText } from '../game/districtText.ts';
import { useT } from '../i18n.ts';
import { completionPercent, useLux, type Lang } from '../state/store.ts';

type BoolKey = 'audio' | 'reducedMotion' | 'reducedParticles' | 'colorblind';

export function Archive() {
  const progress = useLux((s) => s.progress);
  const settings = useLux((s) => s.settings);
  const setSetting = useLux((s) => s.setSetting);
  const setScreen = useLux((s) => s.setScreen);
  const t = useT();
  const lang = settings.lang;

  const solved = Object.values(progress.districts).filter((d) => d.solved).length;
  const perfects = Object.values(progress.districts).filter((d) => d.perfect).length;

  const toggle = (key: BoolKey, label: string, hint: string) => (
    <div
      className="toggle"
      role="switch"
      aria-checked={settings[key]}
      tabIndex={0}
      onClick={() => { audio.uiTick(); setSetting(key, !settings[key]); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSetting(key, !settings[key]);
        }
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 300 }}>{label}</div>
        <div className="label" style={{ marginTop: 4, textTransform: 'none', letterSpacing: '0.04em' }}>{hint}</div>
      </div>
      <div className="state label">{settings[key] ? t('common.on') : t('common.off')}</div>
    </div>
  );

  return (
    <div className="screen archive">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="label">{t('arch.kicker')}</div>
          <h2 className="district-name" style={{ marginTop: 8 }}>{t('arch.title')}</h2>
        </div>
        <button className="btn" onClick={() => { audio.uiTick(); setScreen('map'); }}>{t('arch.map')}</button>
      </div>

      <div className="stats-grid">
        <Stat value={`${solved} / ${DISTRICTS.length}`} label={t('arch.statDistricts')} />
        <Stat value={`${completionPercent(progress)}%`} label={t('arch.statCompletion')} />
        <Stat value={String(progress.totalPowered)} label={t('arch.statPowered')} />
        <Stat value={String(progress.totalCores)} label={t('arch.statCores')} />
        <Stat value={String(perfects)} label={t('arch.statFlawless')} />
        <Stat value={String(progress.streak)} label={t('arch.statStreak')} />
      </div>

      <div className="label" style={{ marginBottom: 16 }}>{t('arch.memories')}</div>
      {DISTRICTS.map((d) => {
        const has = progress.memories.includes(d.id);
        const text = districtText(d, lang);
        return (
          <div key={d.id} className={`memory-row ${has ? '' : 'locked'}`}>
            <div className="label">{text.name}{has ? ` · ${t(`kind.${d.memory.kind}`)}` : ''}</div>
            <h4>{has ? text.memory.title : t('arch.stillDark')}</h4>
            <p>{has ? text.memory.body : t('arch.lockedBody')}</p>
          </div>
        );
      })}

      <div className="label" style={{ margin: '40px 0 4px' }}>{t('arch.settings')}</div>
      <div className="toggles">
        <div className="toggle" role="group" aria-label={t('set.language')}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 300 }}>{t('set.language')}</div>
            <div className="label" style={{ marginTop: 4, textTransform: 'none', letterSpacing: '0.04em' }}>
              Türkçe · English
            </div>
          </div>
          <div className="lang-seg">
            {(['en', 'tr'] as Lang[]).map((l) => (
              <button
                key={l}
                className={`lang-opt ${lang === l ? 'active' : ''}`}
                onClick={() => { audio.uiTick(); setSetting('lang', l); }}
              >
                {l === 'en' ? 'EN' : 'TR'}
              </button>
            ))}
          </div>
        </div>
        {toggle('audio', t('set.audio'), t('set.audioHint'))}
        {toggle('reducedMotion', t('set.motion'), t('set.motionHint'))}
        {toggle('reducedParticles', t('set.particles'), t('set.particlesHint'))}
        {toggle('colorblind', t('set.contrast'), t('set.contrastHint'))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <div className="value">{value}</div>
      <div className="label" style={{ marginTop: 6 }}>{label}</div>
    </div>
  );
}
