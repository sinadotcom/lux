import { audio } from '../audio/engine.ts';
import { DISTRICTS } from '../game/districts.ts';
import { completionPercent, useLux, type Settings } from '../state/store.ts';

export function Archive() {
  const progress = useLux((s) => s.progress);
  const settings = useLux((s) => s.settings);
  const setSetting = useLux((s) => s.setSetting);
  const setScreen = useLux((s) => s.setScreen);

  const solved = Object.values(progress.districts).filter((d) => d.solved).length;
  const perfects = Object.values(progress.districts).filter((d) => d.perfect).length;

  const toggle = (key: keyof Settings, label: string, hint: string) => (
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
      <div className="state label">{settings[key] ? 'On' : 'Off'}</div>
    </div>
  );

  return (
    <div className="screen archive">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="label">Progress archive</div>
          <h2 className="district-name" style={{ marginTop: 8 }}>Restoration records</h2>
        </div>
        <button className="btn" onClick={() => { audio.uiTick(); setScreen('map'); }}>City map</button>
      </div>

      <div className="stats-grid">
        <Stat value={`${solved} / ${DISTRICTS.length}`} label="Districts restored" />
        <Stat value={`${completionPercent(progress)}%`} label="City completion" />
        <Stat value={String(progress.totalPowered)} label="Streets re-powered" />
        <Stat value={String(progress.totalCores)} label="Cores installed" />
        <Stat value={String(perfects)} label="Flawless restorations" />
        <Stat value={String(progress.streak)} label="Daily streak" />
      </div>

      <div className="label" style={{ marginBottom: 16 }}>Recovered memories</div>
      {DISTRICTS.map((d) => {
        const has = progress.memories.includes(d.id);
        return (
          <div key={d.id} className={`memory-row ${has ? '' : 'locked'}`}>
            <div className="label">{d.name}{has ? ` · ${d.memory.kind}` : ''}</div>
            <h4>{has ? d.memory.title : 'Still dark'}</h4>
            <p>{has ? d.memory.body : 'Restore this district to recover what it remembers.'}</p>
          </div>
        );
      })}

      <div className="label" style={{ margin: '40px 0 4px' }}>Atelier settings</div>
      <div className="toggles">
        {toggle('audio', 'Soundtrack', 'Generative ambient score and interaction sound')}
        {toggle('reducedMotion', 'Reduced motion', 'Calmer camera, instant transitions')}
        {toggle('reducedParticles', 'Reduced effects', 'Fewer particles and post-processing, for older devices')}
        {toggle('colorblind', 'High-contrast energy', 'Marks power with brighter, colour-independent light')}
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
