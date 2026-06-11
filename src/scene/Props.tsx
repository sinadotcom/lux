import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OPEN, type Puzzle } from '../game/types.ts';
import { cellNoise, cellPos } from './layout.ts';
import { CELL, PALETTE } from './palette.ts';
import type { EnergyField } from './useEnergyField.ts';

interface Lamp {
  cell: number;
  x: number;
  z: number;
}

const LAMP_OFF = new THREE.Color('#1a1b20');
const tmp = new THREE.Color();

/**
 * Street dressing from the moodboard: lantern poles that catch the power as
 * it reaches their street, and a few dark miniature trees. Placed at tile
 * corners so cores always land on clear ground.
 */
export function StreetProps({ puzzle, field }: { puzzle: Puzzle; field: EnergyField }) {
  const headsRef = useRef<THREE.InstancedMesh>(null);

  const { lamps, trees } = useMemo(() => {
    const lamps: Lamp[] = [];
    const trees: { x: number; z: number; s: number }[] = [];
    for (let i = 0; i < puzzle.cells.length; i++) {
      if (puzzle.cells[i] !== OPEN) continue;
      const [cx, cz] = cellPos(puzzle, i);
      const corner = Math.floor(cellNoise(i, 52) * 4);
      const dx = (corner & 1 ? 1 : -1) * CELL * 0.36;
      const dz = (corner & 2 ? 1 : -1) * CELL * 0.36;
      if (cellNoise(i, 51) > 0.78) {
        lamps.push({ cell: i, x: cx + dx, z: cz + dz });
      } else if (cellNoise(i, 61) > 0.84) {
        trees.push({ x: cx + dx, z: cz + dz, s: 0.75 + cellNoise(i, 62) * 0.5 });
      }
    }
    return { lamps, trees };
  }, [puzzle]);

  useFrame(({ clock }) => {
    const mesh = headsRef.current;
    if (!mesh) return;
    for (let k = 0; k < lamps.length; k++) {
      const level = field.levels[lamps[k].cell];
      if (level > 0.15) {
        const flicker = 1 + Math.sin(clock.elapsedTime * 5 + k * 2.7) * 0.05;
        tmp.copy(PALETTE.gold).multiplyScalar((0.6 + level * 1.6) * flicker);
      } else {
        tmp.copy(LAMP_OFF);
      }
      mesh.setColorAt(k, tmp);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Lamp poles */}
      {lamps.map((l, k) => (
        <mesh key={k} position={[l.x, 0.14, l.z]} castShadow>
          <cylinderGeometry args={[0.012, 0.018, 0.28, 6]} />
          <meshStandardMaterial color={PALETTE.graphite} roughness={0.4} metalness={0.8} />
        </mesh>
      ))}

      {/* Lamp heads — instanced so their glow animates in one draw call */}
      {lamps.length > 0 && (
        <instancedMesh
          ref={headsRef}
          args={[undefined, undefined, lamps.length]}
          onUpdate={(mesh) => {
            const m = new THREE.Matrix4();
            lamps.forEach((l, k) => {
              m.makeTranslation(l.x, 0.3, l.z);
              mesh.setMatrixAt(k, m);
            });
            mesh.instanceMatrix.needsUpdate = true;
          }}
        >
          <sphereGeometry args={[0.038, 10, 8]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}

      {/* Miniature trees — dark, still, patient */}
      {trees.map((t, k) => (
        <group key={k} position={[t.x, 0, t.z]} scale={[t.s, t.s, t.s]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.014, 0.02, 0.1, 5]} />
            <meshStandardMaterial color="#2b2620" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <icosahedronGeometry args={[0.085, 0]} />
            <meshStandardMaterial color="#252a23" roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}
