import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { audio } from '../audio/engine.ts';
import { useLux } from '../state/store.ts';
import { Atmosphere } from './Atmosphere.tsx';
import { Buildings } from './Buildings.tsx';
import { CameraRig } from './CameraRig.tsx';
import { Cores } from './Cores.tsx';
import { Dust } from './Dust.tsx';
import { cellPos } from './layout.ts';
import { CELL, PALETTE } from './palette.ts';
import { StreetProps } from './Props.tsx';
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
        gl.toneMappingExposure = 1.12;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#070708']} />
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
  const hemiRef = useRef<THREE.HemisphereLight>(null);
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
      <fog attach="fog" args={['#070708', extent * 2.2, extent * 7]} />

      {/* Gallery lighting: one soft warm-white key over a neutral ambient,
          like museum exhibition lighting on an architectural model. */}
      <hemisphereLight ref={hemiRef} args={['#3a3b3e', '#0a0a0b', 0.5]} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={0.75}
        color="#f0ebe0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-extent * 1.5}
        shadow-camera-right={extent * 1.5}
        shadow-camera-top={extent * 1.5}
        shadow-camera-bottom={-extent * 1.5}
      />
      {/* Soft rim light from behind — separates silhouettes from the dark */}
      <directionalLight position={[-6, 4, -7]} intensity={0.22} color="#5a5e68" />
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
      <StreetProps puzzle={puzzle} field={field} />
      <Cores
        puzzle={puzzle}
        cores={session.cores}
        conflicted={field.eval.conflicted}
        hint={session.hint}
        reducedMotion={settings.reducedMotion}
      />

      {hovered != null && playing && !session.cores.includes(hovered) && <HoverGhost puzzle={puzzle} cell={hovered} />}
      {cursor != null && playing && <CursorMarker puzzle={puzzle} cell={cursor} />}

      <Plinth puzzle={puzzle} energy={energyRef} />
      <Dust extent={extent * 1.4} energy={energyRef} reduced={settings.reducedParticles} />
      <Atmosphere extent={extent} energy={energyRef} hemi={hemiRef} reducedParticles={settings.reducedParticles} />

      <CameraRig
        boardExtent={extent}
        cinematic={session.phase === 'cinematic'}
        grand={session.grandFinale}
        onCinematicEnd={finishCinematic}
        reducedMotion={settings.reducedMotion}
      />

      {!settings.reducedParticles && (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.3} />
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
    if (ref.current) ref.current.intensity = 0.2 + energy.current * 1.5;
  });
  return <pointLight ref={ref} position={[0, extent * 0.9, 0]} color={PALETTE.amber} distance={extent * 5} decay={1.6} />;
}

/** The concrete slab the district rests on — the diorama base from the moodboard. */
function Plinth({ puzzle, energy }: { puzzle: { width: number; height: number }; energy: React.MutableRefObject<number> }) {
  const w = puzzle.width * CELL + 0.7;
  const d = puzzle.height * CELL + 0.7;
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);

  // The slab's edge band charges up with the city: dark at rest, then a warm
  // amber line wrapping the whole board as power returns.
  useFrame(({ clock }) => {
    const m = glowMat.current;
    if (!m) return;
    const e = energy.current;
    const breathe = 1 + Math.sin(clock.elapsedTime * 1.1) * 0.08 * e;
    m.color.copy(PALETTE.amber).multiplyScalar(0.04 + e * 1.9 * breathe);
  });

  return (
    <group>
      {/* Sidewalk apron — light concrete border, the museum pedestal top */}
      <mesh position={[0, -0.075, 0]} receiveShadow>
        <boxGeometry args={[w, 0.13, d]} />
        <meshStandardMaterial color={PALETTE.lightConcrete} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, -0.46, 0]} receiveShadow>
        <boxGeometry args={[w - 0.12, 0.64, d - 0.12]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Brushed-metal trim line */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[w + 0.02, 0.025, d + 0.02]} />
        <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Energy band — the board's sides glow as the power level rises */}
      <mesh position={[0, -0.19, 0]}>
        <boxGeometry args={[w + 0.026, 0.04, d + 0.026]} />
        <meshBasicMaterial ref={glowMat} toneMapped={false} transparent opacity={0.95} depthWrite={false} />
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
