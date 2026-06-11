import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { audio } from '../audio/engine.ts';
import { useLux } from '../state/store.ts';
import { Buildings } from './Buildings.tsx';
import { CameraRig } from './CameraRig.tsx';
import { Cores } from './Cores.tsx';
import { Dust } from './Dust.tsx';
import { cellPos } from './layout.ts';
import { CELL, PALETTE } from './palette.ts';
import { Tiles } from './Tiles.tsx';
import { useEnergyField } from './useEnergyField.ts';

/**
 * The diorama. One floating slab of city in darkness; everything the player
 * does happens on it. Mounted only while a session is active.
 */
export function CityScene() {
  const session = useLux((s) => s.session);
  const settings = useLux((s) => s.settings);
  if (!session) return null;
  return (
    <Canvas
      shadows={!settings.reducedParticles}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 38, near: 0.1, far: 200 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#0a0b0e']} />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}

function SceneContent() {
  const session = useLux((s) => s.session)!;
  const settings = useLux((s) => s.settings);
  const toggleCore = useLux((s) => s.toggleCore);
  const finishCinematic = useLux((s) => s.finishCinematic);
  const cursor = useLux((s) => s.cursor);

  const { puzzle } = session;
  const extent = (Math.max(puzzle.width, puzzle.height) * CELL) / 2 + 0.5;
  const field = useEnergyField(puzzle, session.cores, session.lastPlaced, session.moveSeq);

  const [hovered, setHovered] = useState<number | null>(null);

  // Overall restoration energy in [0,1]; drives dust, fog glow and audio.
  const energyRef = useRef(0);
  const completionRef = useRef(0);
  const progress = field.eval.openCount ? field.eval.litCount / field.eval.openCount : 0;

  useEffect(() => {
    audio.setProgress(session.phase === 'playing' ? progress : 1);
  }, [progress, session.phase]);

  useFrame((_, dt) => {
    const target = session.phase === 'playing' ? progress : 1;
    energyRef.current += (target - energyRef.current) * Math.min(1, dt * 2);
    // During the cinematic the whole city wakes — windows pass their thresholds one by one.
    const doneTarget = session.phase === 'playing' ? 0 : 1;
    const rate = settings.reducedMotion ? 3 : 0.35;
    completionRef.current = THREE.MathUtils.clamp(completionRef.current + (doneTarget * 2 - 1) * dt * rate, 0, 1);
  });

  const playing = session.phase === 'playing';

  return (
    <group>
      <fog attach="fog" args={['#0a0b0e', extent * 2.2, extent * 7]} />

      {/* Lighting: cool, soft moonlight world; the warmth comes from energy. */}
      <hemisphereLight args={['#2a3140', '#0c0d10', 0.65]} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={0.55}
        color="#aebbd0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-extent * 1.5}
        shadow-camera-right={extent * 1.5}
        shadow-camera-top={extent * 1.5}
        shadow-camera-bottom={-extent * 1.5}
      />
      {/* One warm fill that swells with restoration */}
      <WarmFill energy={energyRef} extent={extent} />

      <Tiles
        puzzle={puzzle}
        field={field}
        instant={false}
        onPick={(cell) => playing && toggleCore(cell)}
        onHover={(cell) => setHovered(playing ? cell : null)}
        highContrast={settings.colorblind}
      />
      <Buildings puzzle={puzzle} field={field} completion={completionRef} />
      <Cores
        puzzle={puzzle}
        cores={session.cores}
        conflicted={field.eval.conflicted}
        hint={session.hint}
        reducedMotion={settings.reducedMotion}
      />

      {hovered != null && playing && !session.cores.includes(hovered) && <HoverGhost puzzle={puzzle} cell={hovered} />}
      {cursor != null && playing && <CursorMarker puzzle={puzzle} cell={cursor} />}

      <Plinth puzzle={puzzle} />
      <Dust extent={extent * 1.4} energy={energyRef} reduced={settings.reducedParticles} />

      <CameraRig
        boardExtent={extent}
        cinematic={session.phase === 'cinematic'}
        onCinematicEnd={finishCinematic}
        reducedMotion={settings.reducedMotion}
      />

      {!settings.reducedParticles && (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.55} luminanceSmoothing={0.3} />
          <Vignette eskil={false} offset={0.18} darkness={0.78} />
        </EffectComposer>
      )}
    </group>
  );
}

/** Warm point light hovering over the board, swelling as power returns. */
function WarmFill({ energy, extent }: { energy: React.MutableRefObject<number>; extent: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = 0.2 + energy.current * 2.4;
  });
  return <pointLight ref={ref} position={[0, extent * 0.9, 0]} color={PALETTE.amber} distance={extent * 5} decay={1.6} />;
}

/** The concrete slab the district rests on — the diorama base from the moodboard. */
function Plinth({ puzzle }: { puzzle: { width: number; height: number } }) {
  const w = puzzle.width * CELL + 0.7;
  const d = puzzle.height * CELL + 0.7;
  return (
    <group>
      <mesh position={[0, -0.42, 0]} receiveShadow>
        <boxGeometry args={[w, 0.6, d]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Brushed-metal trim line */}
      <mesh position={[0, -0.135, 0]}>
        <boxGeometry args={[w + 0.02, 0.025, d + 0.02]} />
        <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Faint under-glow, as if the slab floats on stored energy */}
      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 1.5, d * 1.5]} />
        <meshBasicMaterial color="#1a1410" transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  );
}

function HoverGhost({ puzzle, cell }: { puzzle: Parameters<typeof cellPos>[0]; cell: number }) {
  const [x, z] = cellPos(puzzle, cell);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(clock.elapsedTime * 2.5) * 0.06;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.2} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 32]} />
        <meshBasicMaterial color={PALETTE.warmGrey} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Keyboard navigation focus ring. */
function CursorMarker({ puzzle, cell }: { puzzle: Parameters<typeof cellPos>[0]; cell: number }) {
  const [x, z] = cellPos(puzzle, cell);
  return (
    <mesh position={[x, 0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.38, 0.44, 4]} />
      <meshBasicMaterial color={PALETTE.ivory} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}
