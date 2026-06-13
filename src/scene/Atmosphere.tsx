import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './palette.ts';

const NIGHT_BG = new THREE.Color('#070708');
const WARM_BG = new THREE.Color('#130d08');
const SKY_COLD = new THREE.Color('#3a3b3e');
const SKY_WARM = new THREE.Color('#5c472b');
const GROUND_COLD = new THREE.Color('#0a0a0b');
const GROUND_WARM = new THREE.Color('#1d1409');

/**
 * Tetris Effect-style environmental response: the whole void reacts to the
 * city's power level. The darkness warms toward amber dusk and fireflies
 * gather above the lit streets.
 */
export function Atmosphere({
  extent,
  energy,
  hemi,
  reducedParticles,
}: {
  extent: number;
  energy: React.MutableRefObject<number>;
  hemi: React.RefObject<THREE.HemisphereLight>;
  reducedParticles: boolean;
}) {
  const { scene } = useThree();

  // --- World warming: background, fog and ambient drift from cold to warm.
  useFrame(() => {
    // Ease the curve so the warming is clearly visible by mid-game.
    const e = Math.pow(energy.current, 0.7);
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

  return <group>{!reducedParticles && <Embers extent={extent} energy={energy} />}</group>;
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
