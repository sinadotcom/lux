import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './palette.ts';

const NIGHT_BG = new THREE.Color('#070708');
const WARM_BG = new THREE.Color('#0e0b08');
const SKY_COLD = new THREE.Color('#3a3b3e');
const SKY_WARM = new THREE.Color('#4d4133');
const GROUND_COLD = new THREE.Color('#0a0a0b');
const GROUND_WARM = new THREE.Color('#171006');

/**
 * Tetris Effect-style environmental response: the whole void reacts to the
 * city's power level. The darkness warms, fireflies gather above the lit
 * streets, and every quarter of restoration sends a light wave across the
 * board.
 */
export function Atmosphere({
  extent,
  energy,
  hemi,
  reducedParticles,
  reducedMotion,
}: {
  extent: number;
  energy: React.MutableRefObject<number>;
  hemi: React.RefObject<THREE.HemisphereLight>;
  reducedParticles: boolean;
  reducedMotion: boolean;
}) {
  const { scene } = useThree();

  // --- World warming: background, fog and ambient drift from cold to warm.
  useFrame(() => {
    const e = energy.current;
    if (scene.background instanceof THREE.Color) {
      scene.background.copy(NIGHT_BG).lerp(WARM_BG, e);
      if (scene.fog) scene.fog.color.copy(scene.background);
    }
    const h = hemi.current;
    if (h) {
      h.color.copy(SKY_COLD).lerp(SKY_WARM, e);
      h.groundColor.copy(GROUND_COLD).lerp(GROUND_WARM, e);
      h.intensity = 0.5 + e * 0.18;
    }
  });

  return (
    <group>
      {!reducedParticles && <Embers extent={extent} energy={energy} />}
      {!reducedMotion && <MilestoneWaves extent={extent} energy={energy} />}
    </group>
  );
}

/** Fireflies that gather over the city once it is properly waking (>30%). */
function Embers({ extent, energy }: { extent: number; energy: React.MutableRefObject<number> }) {
  const count = 140;
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * extent * 1.05;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.2 + Math.random() * 2.2;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i * 2] = Math.random() * Math.PI * 2;
      seeds[i * 2 + 1] = 0.12 + Math.random() * 0.25;
    }
    return { positions, seeds };
  }, [extent]);

  useFrame((state, dt) => {
    const pts = ref.current;
    const mat = matRef.current;
    if (!pts || !mat) return;
    const e = energy.current;
    const vis = THREE.MathUtils.clamp((e - 0.3) / 0.7, 0, 1);
    mat.opacity = vis * 0.85;
    mat.size = 0.03 + vis * 0.02;
    if (vis <= 0) return;

    const t = state.clock.elapsedTime;
    const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const phase = seeds[i * 2];
      const rise = seeds[i * 2 + 1];
      let y = pos.getY(i) + rise * dt * (0.4 + vis);
      if (y > 2.6) y = 0.15;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.6 + phase) * dt * 0.06);
      pos.setZ(i, pos.getZ(i) + Math.cos(t * 0.5 + phase) * dt * 0.06);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color={PALETTE.gold}
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** A ring of light sweeps the board each time restoration crosses a quarter. */
function MilestoneWaves({ extent, energy }: { extent: number; energy: React.MutableRefObject<number> }) {
  const ring = useRef<THREE.Mesh>(null);
  const prev = useRef(0);
  const waveStart = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const e = energy.current;
    const t = clock.elapsedTime;

    for (const m of [0.25, 0.5, 0.75]) {
      if (prev.current < m && e >= m) waveStart.current = t;
    }
    prev.current = e;

    const r = ring.current;
    if (!r) return;
    if (waveStart.current === null) {
      r.visible = false;
      return;
    }
    const u = (t - waveStart.current) / 1.5;
    if (u >= 1) {
      waveStart.current = null;
      r.visible = false;
      return;
    }
    r.visible = true;
    const s = 0.4 + u * extent * 1.9;
    r.scale.set(s, s, s);
    const mat = r.material as THREE.MeshBasicMaterial;
    mat.color.copy(PALETTE.gold).multiplyScalar(1.6);
    mat.opacity = (1 - u) * 0.55;
  });

  return (
    <mesh ref={ring} position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.92, 1, 64]} />
      <meshBasicMaterial transparent toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}
