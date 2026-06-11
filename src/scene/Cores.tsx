import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Puzzle } from '../game/types.ts';
import { cellPos } from './layout.ts';
import { CONFLICT_CB, PALETTE } from './palette.ts';
import type { Hint } from '../state/store.ts';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/**
 * Installed energy cores — brushed-metal lanterns with a frosted glass heart.
 * Each one descends from above, lands softly, then breathes. Conflicting
 * cores (two cores feeding each other) cool down to a steel tone and stutter.
 */
export function Cores({
  puzzle,
  cores,
  conflicted,
  hint,
  reducedMotion,
}: {
  puzzle: Puzzle;
  cores: number[];
  conflicted: Set<number>;
  hint: Hint | null;
  reducedMotion: boolean;
}) {
  return (
    <group>
      {cores.map((cell) => (
        <Core
          key={cell}
          cell={cell}
          puzzle={puzzle}
          conflict={conflicted.has(cell)}
          flagged={hint?.kind === 'remove' && hint.cell === cell}
          reducedMotion={reducedMotion}
        />
      ))}
      {hint?.kind === 'place' && <PlaceHintMarker puzzle={puzzle} cell={hint.cell} />}
    </group>
  );
}

function Core({
  cell,
  puzzle,
  conflict,
  flagged,
  reducedMotion,
}: {
  cell: number;
  puzzle: Puzzle;
  conflict: boolean;
  flagged: boolean;
  reducedMotion: boolean;
}) {
  const [x, z] = cellPos(puzzle, cell);
  const group = useRef<THREE.Group>(null);
  const heart = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const born = useRef(performance.now());

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const age = (performance.now() - born.current) / 1000;

    // Descent: 450ms drop, then a breathing hover.
    const drop = reducedMotion ? 1 : easeOutCubic(age / 0.45);
    const breathe = Math.sin(age * 1.4 + cell) * 0.012;
    g.position.set(x, (1 - drop) * 2.2 + 0.02 + (drop >= 1 ? breathe : 0), z);

    const h = heart.current;
    if (h) {
      const mat = h.material as THREE.MeshBasicMaterial;
      if (conflict) {
        // Stuttering, cooled-down core: clearly "wrong" without relying on red.
        const stutter = 0.45 + 0.25 * Math.abs(Math.sin(age * 9));
        mat.color.copy(CONFLICT_CB).multiplyScalar(stutter * 1.6);
      } else {
        const pulse = 1.25 + Math.sin(age * 2.2 + cell * 1.7) * 0.18;
        mat.color.copy(PALETTE.amber).multiplyScalar(pulse * (flagged ? 0.55 : 1));
      }
    }

    // Real light spilling onto the street and nearby facades.
    const l = light.current;
    if (l) {
      if (conflict) {
        l.color.copy(CONFLICT_CB);
        l.intensity = 0.5 + 0.2 * Math.abs(Math.sin(age * 9));
      } else {
        l.color.copy(PALETTE.amber);
        l.intensity = (1.4 + Math.sin(age * 2.2 + cell * 1.7) * 0.25) * drop;
      }
    }

    const r = ring.current;
    if (r) {
      // Landing pulse: one expanding ground ring just after touchdown.
      const t = (age - 0.4) / 0.55;
      const mat = r.material as THREE.MeshBasicMaterial;
      if (t > 0 && t < 1 && !reducedMotion) {
        r.visible = true;
        const s = 0.35 + t * 1.15;
        r.scale.set(s, s, s);
        mat.opacity = (1 - t) * 0.7;
      } else if (flagged) {
        // Hint says: remove this one. Slow attention pulse.
        r.visible = true;
        const s = 0.7 + Math.sin(age * 4) * 0.06;
        r.scale.set(s, s, s);
        mat.opacity = 0.45 + Math.sin(age * 4) * 0.2;
      } else {
        r.visible = false;
      }
    }
  });

  return (
    <group ref={group}>
      {/* Brushed aluminum base */}
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.09, 20]} />
        <meshStandardMaterial color={PALETTE.concrete} roughness={0.35} metalness={0.85} />
      </mesh>
      {/* Frosted glass heart */}
      <mesh ref={heart} position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshBasicMaterial color={PALETTE.amber} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.165, 24, 18]} />
        <meshStandardMaterial
          color={PALETTE.ivory}
          roughness={0.25}
          metalness={0}
          transparent
          opacity={0.22}
        />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.09, 0.05, 16]} />
        <meshStandardMaterial color={PALETTE.graphite} roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Warm light pooling around the lantern */}
      <pointLight ref={light} position={[0, 0.28, 0]} distance={2.8} decay={1.9} intensity={0} />
      {/* Landing / warning ring */}
      <mesh ref={ring} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.42, 0.47, 40]} />
        <meshBasicMaterial color={PALETTE.gold} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PlaceHintMarker({ puzzle, cell }: { puzzle: Puzzle; cell: number }) {
  const [x, z] = cellPos(puzzle, cell);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const s = 0.75 + Math.sin(t * 3) * 0.08;
    m.scale.set(s, s, s);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 3) * 0.25;
  });
  return (
    <mesh ref={ref} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.4, 40]} />
      <meshBasicMaterial color={PALETTE.gold} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
