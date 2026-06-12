import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isClue, orthNeighbors } from '../game/board.ts';
import { OPEN, type Puzzle } from '../game/types.ts';
import { clueTexture, type ClueLook } from './clueTextures.ts';
import { cellNoise, cellPos } from './layout.ts';
import { CELL, PALETTE } from './palette.ts';
import { paintedMetalTextures } from './metalTexture.ts';
import type { EnergyField } from './useEnergyField.ts';

interface WindowSpec {
  building: number; // cell index
  position: THREE.Vector3;
  rotationY: number;
  /** Activation threshold — windows wake one by one as power rises nearby. */
  threshold: number;
  warmth: number;
}

interface BuildingSpec {
  cell: number;
  clue: boolean;
  /** Base mass height. */
  h: number;
  /** Optional setback box on top. */
  tower: { w: number; h: number; ox: number; oz: number } | null;
}

const tmp = new THREE.Color();
const WINDOW_OFF = new THREE.Color('#0a0a0c');

/**
 * Structures: plain matte-black painted-metal boxes. As power reaches the
 * streets around a box it starts to emit — first a faint amber breath, then
 * windows wake one by one. Numbered boxes carry the requirement plate.
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
  const tex = useMemo(() => paintedMetalTextures(), []);

  const { specs, windows } = useMemo(() => {
    const specs: BuildingSpec[] = [];
    const windows: WindowSpec[] = [];

    for (let i = 0; i < puzzle.cells.length; i++) {
      if (puzzle.cells[i] === OPEN) continue;
      const clue = isClue(puzzle.cells[i]);

      const n = cellNoise(i);
      const h = clue ? 0.42 + n * 0.22 : 0.65 + n * 1.0;
      const isTower = !clue && cellNoise(i, 41) > 0.72;
      const tower = isTower
        ? {
            w: CELL * (0.42 + cellNoise(i, 42) * 0.16),
            h: 0.4 + cellNoise(i, 43) * 0.7,
            ox: (cellNoise(i, 44) - 0.5) * CELL * 0.18,
            oz: (cellNoise(i, 45) - 0.5) * CELL * 0.18,
          }
        : null;

      specs.push({ cell: i, clue, h, tower });

      // Window grids on every facade — dark until power arrives.
      if (!clue) {
        const [cx, cz] = cellPos(puzzle, i);
        const floors = Math.max(1, Math.floor((h - 0.18) / 0.21));
        const cols = [-CELL * 0.24, 0, CELL * 0.24];
        const off = CELL * 0.45 + 0.006;
        for (let side = 0; side < 4; side++) {
          for (let f = 0; f < floors; f++) {
            for (let c = 0; c < cols.length; c++) {
              // Skip ~40% so the lit pattern looks inhabited, not printed.
              if (cellNoise(i, 100 + side * 37 + f * 7 + c) > 0.6) continue;
              const up = 0.14 + f * 0.21;
              const along = cols[c];
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
                threshold: 0.2 + cellNoise(i, 200 + side * 31 + f * 11 + c) * 0.65,
                warmth: 0.65 + cellNoise(i, 300 + side * 13 + f * 5 + c) * 0.35,
              });
            }
          }
          if (tower) {
            const tFloors = Math.max(1, Math.floor((tower.h - 0.1) / 0.21));
            for (let f = 0; f < tFloors; f++) {
              if (cellNoise(i, 400 + side * 17 + f) > 0.55) continue;
              const up = h + 0.12 + f * 0.21;
              const toff = tower.w / 2 + 0.006;
              const pos =
                side === 0
                  ? new THREE.Vector3(cx + tower.ox + toff, up, cz + tower.oz)
                  : side === 1
                    ? new THREE.Vector3(cx + tower.ox - toff, up, cz + tower.oz)
                    : side === 2
                      ? new THREE.Vector3(cx + tower.ox, up, cz + tower.oz + toff)
                      : new THREE.Vector3(cx + tower.ox, up, cz + tower.oz - toff);
              windows.push({
                building: i,
                position: pos,
                rotationY: side === 0 ? Math.PI / 2 : side === 1 ? -Math.PI / 2 : side === 2 ? 0 : Math.PI,
                threshold: 0.2 + cellNoise(i, 500 + side * 23 + f) * 0.65,
                warmth: 0.65 + cellNoise(i, 600 + side * 29 + f) * 0.35,
              });
            }
          }
        }
      }
    }
    return { specs, windows };
  }, [puzzle]);

  useFrame(() => {
    const done = completion.current;

    // Mean street power around each building, computed once per frame.
    const nearby = new Map<number, number>();
    for (const s of specs) {
      let sum = 0;
      let n = 0;
      for (const nb of orthNeighbors(puzzle, s.cell)) {
        if (puzzle.cells[nb] === OPEN) {
          sum += field.levels[nb];
          n++;
        }
      }
      nearby.set(s.cell, n ? sum / n : 0);
    }

    const mesh = windowsRef.current;
    if (!mesh) return;
    for (let k = 0; k < windows.length; k++) {
      const w = windows[k];
      const level = nearby.get(w.building) ?? 0;
      const awake = done >= w.threshold || level > w.threshold;
      if (awake) {
        tmp.copy(PALETTE.gold).lerp(PALETTE.amber, 1 - w.warmth);
        tmp.multiplyScalar(1.1 + 0.7 * w.warmth);
      } else {
        tmp.copy(WINDOW_OFF);
      }
      mesh.setColorAt(k, tmp);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {specs.map((s) => {
        const [x, z] = cellPos(puzzle, s.cell);
        return (
          <group key={s.cell} position={[x, 0, z]}>
            {/* Black painted-metal box */}
            <mesh position={[0, s.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[CELL * 0.92, s.h, CELL * 0.92]} />
              <meshStandardMaterial
                map={tex.map}
                roughnessMap={tex.roughnessMap}
                normalMap={tex.normalMap}
                metalness={0.45}
              />
            </mesh>

            {/* Setback box on top */}
            {s.tower && (
              <mesh position={[s.tower.ox, s.h + s.tower.h / 2, s.tower.oz]} castShadow>
                <boxGeometry args={[s.tower.w, s.tower.h, s.tower.w]} />
                <meshStandardMaterial
                  map={tex.map}
                  roughnessMap={tex.roughnessMap}
                  normalMap={tex.normalMap}
                  metalness={0.45}
                />
              </mesh>
            )}

            {s.clue && (
              <CluePlate digit={puzzle.cells[s.cell]} state={field.eval.clueState.get(s.cell) ?? 1} y={s.h + 0.015} />
            )}
          </group>
        );
      })}

      <instancedMesh
        ref={windowsRef}
        args={[undefined, undefined, Math.max(1, windows.length)]}
        onUpdate={(mesh) => {
          const m = new THREE.Matrix4();
          const q = new THREE.Quaternion();
          const sc = new THREE.Vector3(1, 1, 1);
          windows.forEach((w, k) => {
            q.setFromEuler(new THREE.Euler(0, w.rotationY, 0));
            m.compose(w.position, q, sc);
            mesh.setMatrixAt(k, m);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      >
        <planeGeometry args={[0.075, 0.105]} />
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
