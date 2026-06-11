import { audio } from '../audio/engine.ts';
import { useLux } from '../state/store.ts';

export function Title() {
  const setScreen = useLux((s) => s.setScreen);
  return (
    <div className="screen title-screen">
      <div className="label" style={{ marginBottom: 18 }}>A city is waiting in the dark</div>
      <h1 className="wordmark">LUX</h1>
      <div className="label" style={{ marginBottom: 56 }}>Reclaim the light</div>
      <button
        className="btn primary"
        autoFocus
        onClick={() => {
          audio.ensure();
          audio.uiTick();
          setScreen('map');
        }}
      >
        Begin restoration
      </button>
    </div>
  );
}
