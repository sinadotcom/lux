import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isClue, orthNeighbors } from '../game/board.ts';
import { OPEN, type Puzzle } from '../game/types.ts';
import { clueTexture, type ClueLook } from './clueTextures.ts';
import { cellNoise, cellPos } from './layout.ts';
import { CELL, PALETTE } from './palette.ts';
import type { EnergyField } from './useEnergyField.ts';

interface WindowSpec {
  building: number; // cell index
  position: THREE.Vector3;
  rotationY: number;
  /** Activation threshold — windows wake one by one as power rises nearby. */
  threshold: number;
  warmth: number;
}

const tmp = new THREE.Color();
const WINDOW_OFF = new THREE.Color('#101216');

/**
 * Structures. Numbered ones carry a requirement plate; all of them carry
 * small windows that wake as power reaches the streets around them — the
 * "city reacts" layer.
 */
export function Buildings({
  puzzle,
  field,
  completion,
}: {
  puzzle: Puzzle;
  field: EnergyField;
  /** 0 while playing; ramps to 1 during the restoration cinematic. */
  completion: React.MutableRefObject<number>;
}) {
  const windowsRef = useRef<THREE.InstancedMesh>(null);

  const { walls, heights, windows } = useMemo(() => {
    const walls: number[] = [];
    const heights = new Map<number, number>();
    const windows: WindowSpec[] = [];
    for (let i = 0; i < puzzle.cells.length; i++) {
      if (puzzle.cells[i] === OPEN) continue;
      walls.push(i);
      const clue = isClue(puzzle.cells[i]);
      const h = clue ? 0.55 + cellNoise(i) * 0.35 : 0.7 + cellNoise(i) * 1.3;
      heights.set(i, h);

      const [cx, cz] = cellPos(puzzle, i);
      const count = 2 + Math.floor(cellNoise(i, 1) * (clue ? 2 : 4));
      for (let w = 0; w < count; w++) {
        const side = Math.floor(cellNoise(i, 2 + w) * 4);
        const along = (cellNoise(i, 6 + w) - 0.5) * CELL * 0.55;
        const up = 0.12 + cellNoise(i, 10 + w) * (h - 0.24);
        const off = CELL * 0.46 + 0.005;
        const pos =
          side === 0
            ? new THREE.Vector3(cx + off, up, cz + along)
            : side === 1
              ? new THREE.Vector3(cx - off, up, cz + along)
              : side === 2
                ? new THREE.Vector3(cx + along, up, cz + off)
                : new THREE.Vector3(cx + along, up, cz - off);
        windows.push({
          building: i,
          position: pos,
          rotationY: side === 0 ? Math.PI / 2 : side === 1 ? -Math.PI / 2 : side === 2 ? 0 : Math.PI,
          threshold: 0.25 + cellNoise(i, 20 + w) * 0.6,
          warmth: 0.7 + cellNoise(i, 30 + w) * 0.3,
        });
      }
    }
    return { walls, heights, windows };
  }, [puzzle]);

  /** Mean power level on the streets adjacent to a building. */
  const neighborLevel = (i: number) => {
    let sum = 0;
    let n = 0;
    for (const nb of orthNeighbors(puzzle, i)) {
      if (puzzle.cells[nb] === OPEN) {
        sum += field.levels[nb];
        n++;
      }
    }
    return n ? sum / n : 0;
  };

  useFrame(() => {
    const mesh = windowsRef.current;
    if (!mesh) return;
    const done = completion.current;
    for (let k = 0; k < windows.length; k++) {
      const w = windows[k];
      const nearby = neighborLevel(w.building);
      const awake = Math.max(done >= w.threshold ? 1 : 0, nearby > w.threshold ? 1 : 0);
      if (awake > 0) {
        tmp.copy(PALETTE.gold).lerp(PALETTE.amber, 1 - w.warmth);
        tmp.multiplyScalar(0.9 + 0.5 * w.warmth);
      } else {
        tmp.copy(WINDOW_OFF);
      }
      mesh.setColorAt(k, tmp);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {walls.map((i) => {
        const [x, z] = cellPos(puzzle, i);
        const h = heights.get(i)!;
        const clue = isClue(puzzle.cells[i]);
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[CELL * 0.92, h, CELL * 0.92]} />
              <meshStandardMaterial
                color={clue ? PALETTE.charcoal : PALETTE.concrete}
                roughness={0.85}
                metalness={clue ? 0.25 : 0.08}
              />
            </mesh>
            {/* Ceramic roof cap */}
            <mesh position={[0, h + 0.015, 0]}>
              <boxGeometry args={[CELL * 0.8, 0.03, CELL * 0.8]} />
              <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.6} metalness={0.1} />
            </mesh>
            {clue && <CluePlate digit={puzzle.cells[i]} state={field.eval.clueState.get(i) ?? 1} y={h + 0.035} />}
          </group>
        );
      })}

      <instancedMesh ref={windowsRef} args={[undefined, undefined, Math.max(1, windows.length)]}
        onUpdate={(mesh) => {
          const m = new THREE.Matrix4();
          const q = new THREE.Quaternion();
          const s = new THREE.Vector3(1, 1, 1);
          windows.forEach((w, k) => {
            q.setFromEuler(new THREE.Euler(0, w.rotationY, 0));
            m.compose(w.position, q, s);
            mesh.setMatrixAt(k, m);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      >
        <planeGeometry args={[0.08, 0.11]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

function CluePlate({ digit, state, y }: { digit: number; state: -1 | 0 | 1; y: number }) {
  const look: ClueLook = state === 0 ? 'satisfied' : state === -1 ? 'over' : 'pending';
  const tex = clueTexture(digit, look);
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[CELL * 0.62, CELL * 0.62]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} opacity={0.95} />
    </mesh>
  );
}
