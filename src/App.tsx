import { useEffect } from 'react';
import { audio } from './audio/engine.ts';
import { useLux } from './state/store.ts';
import { Archive } from './ui/Archive.tsx';
import { PlayScreen } from './ui/PlayScreen.tsx';
import { Title } from './ui/Title.tsx';
import { WorldMap } from './ui/WorldMap.tsx';
import './ui/styles.css';

export default function App() {
  const screen = useLux((s) => s.screen);

  // Soundtrack reacts to play, not the other way around: every state change
  // the store makes has a musical consequence wired here.
  useEffect(() => {
    const unsubMoves = useLux.subscribe(
      (s) => s.session && { seq: s.session.moveSeq, n: s.session.cores.length },
      (cur, prev) => {
        if (!cur || !prev || cur.seq === prev.seq) return;
        if (cur.n > prev.n) audio.corePlaced();
        else audio.coreRemoved();
      },
    );
    const unsubPhase = useLux.subscribe(
      (s) => s.session?.phase,
      (phase, prevPhase) => {
        if (phase === 'cinematic' && prevPhase === 'playing') audio.complete();
        if (phase === undefined) audio.reset();
      },
    );
    const unsubHints = useLux.subscribe(
      (s) => s.session?.hintsUsed ?? 0,
      (n, prev) => {
        if (n > prev) audio.hint();
      },
    );
    const unsubAudio = useLux.subscribe(
      (s) => s.settings.audio,
      (on) => audio.setEnabled(on),
      { fireImmediately: true },
    );
    return () => {
      unsubMoves();
      unsubPhase();
      unsubHints();
      unsubAudio();
    };
  }, []);

  switch (screen) {
    case 'title':
      return <Title />;
    case 'map':
      return <WorldMap />;
    case 'archive':
      return <Archive />;
    case 'play':
      return <PlayScreen />;
  }
}
