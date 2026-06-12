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

type RoofProp = 'tank' | 'antenna' | 'ac' | 'vent' | null;

interface BuildingSpec {
  cell: number;
  clue: boolean;
  /** Base mass height. */
  h: number;
  /** Optional setback box on top. */
  tower: { w: number; h: number; ox: number; oz: number } | null;
  prop: RoofProp;
  propOffset: [number, number];
  /** Which facade carries the entrance (0..3); -1 for none. */
  doorSide: number;
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

      let prop: RoofProp = null;
      if (!clue && !isTower) {
        const pn = cellNoise(i, 46);
        prop = pn > 0.72 ? 'tank' : pn > 0.5 ? 'antenna' : pn > 0.32 ? 'ac' : pn > 0.2 ? 'vent' : null;
      }
      const propOffset: [number, number] = [
        (cellNoise(i, 47) - 0.5) * CELL * 0.4,
        (cellNoise(i, 48) - 0.5) * CELL * 0.4,
      ];
      const doorSide = !clue && cellNoise(i, 49) > 0.35 ? Math.floor(cellNoise(i, 50) * 4) : -1;

      specs.push({ cell: i, clue, h, tower, prop, propOffset, doorSide });

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
                threshold: 0.12 + cellNoise(i, 200 + side * 31 + f * 11 + c) * 0.45,
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
                threshold: 0.12 + cellNoise(i, 500 + side * 23 + f) * 0.45,
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

    // Peak street power around each building, computed once per frame — one
    // powered street is enough to bring a building to life.
    const nearby = new Map<number, number>();
    for (const s of specs) {
      let peak = 0;
      for (const nb of orthNeighbors(puzzle, s.cell)) {
        if (puzzle.cells[nb] === OPEN) peak = Math.max(peak, field.levels[nb]);
      }
      nearby.set(s.cell, peak);
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

            {/* Parapet lip — a crisp dark edge on every roofline */}
            <mesh position={[0, s.h + 0.011, 0]} castShadow>
              <boxGeometry args={[CELL * 0.95, 0.022, CELL * 0.95]} />
              <meshStandardMaterial color="#222328" roughness={0.55} metalness={0.6} />
            </mesh>

            {/* Facade ledge band on the taller masses */}
            {!s.clue && s.h > 1.0 && (
              <mesh position={[0, s.h * 0.52, 0]}>
                <boxGeometry args={[CELL * 0.945, 0.014, CELL * 0.945]} />
                <meshStandardMaterial color="#26272c" roughness={0.5} metalness={0.65} />
              </mesh>
            )}

            {/* Street-level entrance: a recessed doorway with a thin lintel */}
            {s.doorSide >= 0 && <Door side={s.doorSide} />}

            {/* Setback box on top */}
            {s.tower && (
              <group position={[s.tower.ox, 0, s.tower.oz]}>
                <mesh position={[0, s.h + s.tower.h / 2, 0]} castShadow>
                  <boxGeometry args={[s.tower.w, s.tower.h, s.tower.w]} />
                  <meshStandardMaterial
                    map={tex.map}
                    roughnessMap={tex.roughnessMap}
                    normalMap={tex.normalMap}
                    metalness={0.45}
                  />
                </mesh>
                <mesh position={[0, s.h + s.tower.h + 0.009, 0]}>
                  <boxGeometry args={[s.tower.w + 0.024, 0.018, s.tower.w + 0.024]} />
                  <meshStandardMaterial color="#222328" roughness={0.55} metalness={0.6} />
                </mesh>
                {/* Mast on top of the tower */}
                <mesh position={[0, s.h + s.tower.h + 0.12, 0]}>
                  <cylinderGeometry args={[0.006, 0.016, 0.2, 6]} />
                  <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.35} metalness={0.85} />
                </mesh>
              </group>
            )}

            <RoofPropMesh spec={s} />

            {s.clue && (
              <CluePlate digit={puzzle.cells[s.cell]} state={field.eval.clueState.get(s.cell) ?? 1} y={s.h + 0.024} />
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

/** Recessed entrance at street level, with a brushed lintel above it. */
function Door({ side }: { side: number }) {
  const off = CELL * 0.46 + 0.002;
  const pos: [number, number, number] =
    side === 0 ? [off, 0.115, 0] : side === 1 ? [-off, 0.115, 0] : side === 2 ? [0, 0.115, off] : [0, 0.115, -off];
  const rotY = side === 0 ? Math.PI / 2 : side === 1 ? -Math.PI / 2 : side === 2 ? 0 : Math.PI;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh>
        <planeGeometry args={[0.16, 0.23]} />
        <meshStandardMaterial color="#08080a" roughness={0.9} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.13, 0.004]}>
        <boxGeometry args={[0.2, 0.016, 0.02]} />
        <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.4} metalness={0.8} />
      </mesh>
    </group>
  );
}

/** Rooftop furniture in dark metals: tanks, antennas, AC units, vents. */
function RoofPropMesh({ spec }: { spec: BuildingSpec }) {
  const { prop, propOffset, h } = spec;
  if (!prop) return null;
  const [ox, oz] = propOffset;

  if (prop === 'tank') {
    return (
      <group position={[ox, h + 0.022, oz]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
          <meshStandardMaterial color="#2b2c31" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.092, 0]}>
          <coneGeometry args={[0.085, 0.032, 12]} />
          <meshStandardMaterial color="#222328" roughness={0.55} metalness={0.6} />
        </mesh>
      </group>
    );
  }
  if (prop === 'antenna') {
    return (
      <group position={[ox, h + 0.022, oz]}>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.007, 0.011, 0.26, 6]} />
          <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#2b2c31" roughness={0.5} metalness={0.7} />
        </mesh>
      </group>
    );
  }
  if (prop === 'ac') {
    return (
      <group position={[ox, h + 0.022, oz]}>
        <mesh position={[0, 0.032, 0]} castShadow>
          <boxGeometry args={[0.12, 0.06, 0.095]} />
          <meshStandardMaterial color="#2b2c31" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[0.063, 0.032, 0]}>
          <boxGeometry args={[0.006, 0.044, 0.07]} />
          <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.45} metalness={0.75} />
        </mesh>
      </group>
    );
  }
  // vent — a short capped duct
  return (
    <group position={[ox, h + 0.022, oz]}>
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.09, 8]} />
        <meshStandardMaterial color="#2b2c31" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.098, 0]}>
        <cylinderGeometry args={[0.044, 0.044, 0.014, 8]} />
        <meshStandardMaterial color={PALETTE.warmGrey} roughness={0.45} metalness={0.75} />
      </mesh>
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
