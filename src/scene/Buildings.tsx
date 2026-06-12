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

type RoofProp = 'tank' | 'antenna' | 'ac' | 'spire' | null;

interface BuildingSpec {
  cell: number;
  clue: boolean;
  /** Base mass height. */
  h: number;
  /** Optional setback tower on top (moodboard towers). */
  tower: { w: number; h: number; ox: number; oz: number } | null;
  prop: RoofProp;
  propOffset: [number, number];
}

const tmp = new THREE.Color();
const WINDOW_OFF = new THREE.Color('#101216');

/**
 * Structures. Numbered ones are low dark plinths carrying a requirement
 * plate; the rest are layered city masses — setback towers, parapets, water
 * tanks, antennas — with window grids that wake as power reaches the streets
 * around them. This is the "city reacts" layer.
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

      let prop: RoofProp = null;
      if (!clue) {
        const pn = cellNoise(i, 46);
        prop = isTower ? 'spire' : pn > 0.75 ? 'tank' : pn > 0.5 ? 'antenna' : pn > 0.3 ? 'ac' : null;
      }
      const propOffset: [number, number] = [
        (cellNoise(i, 47) - 0.5) * CELL * 0.4,
        (cellNoise(i, 48) - 0.5) * CELL * 0.4,
      ];

      specs.push({ cell: i, clue, h, tower, prop, propOffset });

      // Regular window grids on every facade of the base mass — the moodboard
      // buildings read as real architecture because their windows align.
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
          // Tower windows: a narrow column of lights.
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
    const mesh = windowsRef.current;
    if (!mesh) return;
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
            {/* Base mass — matte off-white ceramic, like a physical model piece */}
            <mesh position={[0, s.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[CELL * 0.92, s.h, CELL * 0.92]} />
              <meshStandardMaterial
                color={s.clue ? PALETTE.graphite : PALETTE.ceramic}
                roughness={s.clue ? 0.7 : 0.92}
                metalness={s.clue ? 0.3 : 0}
              />
            </mesh>

            {/* Parapet lip — gives every roofline a crisp edge under the bloom */}
            <mesh position={[0, s.h + 0.012, 0]} castShadow>
              <boxGeometry args={[CELL * 0.96, 0.024, CELL * 0.96]} />
              <meshStandardMaterial
                color={s.clue ? PALETTE.charcoal : PALETTE.ivory}
                roughness={s.clue ? 0.65 : 0.85}
                metalness={s.clue ? 0.25 : 0}
              />
            </mesh>

            {/* Setback tower */}
            {s.tower && (
              <group position={[s.tower.ox, 0, s.tower.oz]}>
                <mesh position={[0, s.h + s.tower.h / 2, 0]} castShadow>
                  <boxGeometry args={[s.tower.w, s.tower.h, s.tower.w]} />
                  <meshStandardMaterial color={PALETTE.ceramic} roughness={0.92} metalness={0} />
                </mesh>
                <mesh position={[0, s.h + s.tower.h + 0.01, 0]}>
                  <boxGeometry args={[s.tower.w + 0.03, 0.02, s.tower.w + 0.03]} />
                  <meshStandardMaterial color={PALETTE.ivory} roughness={0.85} metalness={0} />
                </mesh>
              </group>
            )}

            <RoofProp spec={s} />

            {s.clue && (
              <CluePlate digit={puzzle.cells[s.cell]} state={field.eval.clueState.get(s.cell) ?? 1} y={s.h + 0.028} />
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

/** Rooftop furniture: water tanks, antenna masts, AC units, tower spires. */
function RoofProp({ spec }: { spec: BuildingSpec }) {
  const { prop, propOffset, h, tower } = spec;
  if (!prop) return null;
  const [ox, oz] = propOffset;
  const top = tower ? h + tower.h : h;

  if (prop === 'tank') {
    return (
      <group position={[ox, h + 0.024, oz]}>
        <mesh position={[0, 0.035, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.085, 0.07, 12]} />
          <meshStandardMaterial color={PALETTE.ceramic} roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[0, 0.082, 0]}>
          <coneGeometry args={[0.09, 0.035, 12]} />
          <meshStandardMaterial color={PALETTE.ivory} roughness={0.85} metalness={0} />
        </mesh>
      </group>
    );
  }
  if (prop === 'antenna') {
    return (
      <mesh position={[ox, h + 0.164, oz]}>
        <cylinderGeometry args={[0.008, 0.012, 0.28, 6]} />
        <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.4} metalness={0.7} />
      </mesh>
    );
  }
  if (prop === 'ac') {
    return (
      <mesh position={[ox, h + 0.055, oz]} castShadow>
        <boxGeometry args={[0.13, 0.065, 0.1]} />
        <meshStandardMaterial color={PALETTE.ceramic} roughness={0.9} metalness={0} />
      </mesh>
    );
  }
  // spire — a plain mast on top of the tower, no glowing tip
  return (
    <mesh position={[tower ? tower.ox : 0, top + 0.11, tower ? tower.oz : 0]}>
      <cylinderGeometry args={[0.006, 0.018, 0.2, 6]} />
      <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.35} metalness={0.85} />
    </mesh>
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
