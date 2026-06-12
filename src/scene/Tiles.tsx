import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OPEN, type Puzzle } from '../game/types.ts';
import { cellPos } from './layout.ts';
import { CELL, PALETTE } from './palette.ts';
import type { EnergyField } from './useEnergyField.ts';

const tmpColor = new THREE.Color();

let beamTex: THREE.CanvasTexture | null = null;
/** Soft cross-fade alpha across the strip — light embedded in architecture, not a laser. */
function beamTexture(): THREE.CanvasTexture {
  if (beamTex) return beamTex;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(0.65, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  beamTex = new THREE.CanvasTexture(c);
  return beamTex;
}

/**
 * The street grid. Two instanced layers: concrete tile bodies, and an
 * additive "energy" face on top whose color animates with the power field —
 * this is what bloom picks up, so streets genuinely glow when powered.
 */
export function Tiles({
  puzzle,
  field,
  instant,
  onPick,
  onHover,
  highContrast = false,
}: {
  puzzle: Puzzle;
  field: EnergyField;
  instant: boolean;
  onPick: (cell: number) => void;
  onHover: (cell: number | null) => void;
  /** Colorblind support: push the energy ramp toward bright ivory-gold. */
  highContrast?: boolean;
}) {
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const beamXRef = useRef<THREE.InstancedMesh>(null);
  const beamZRef = useRef<THREE.InstancedMesh>(null);

  const openCells = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < puzzle.cells.length; i++) if (puzzle.cells[i] === OPEN) out.push(i);
    return out;
  }, [puzzle]);

  const baseMatrices = useMemo(() => {
    const m = new THREE.Matrix4();
    const list: THREE.Matrix4[] = [];
    for (const i of openCells) {
      const [x, z] = cellPos(puzzle, i);
      list.push(m.clone().makeTranslation(x, -0.06, z));
    }
    return list;
  }, [puzzle, openCells]);

  useFrame((state, dt) => {
    field.tick(performance.now(), dt, instant);
    const glow = glowRef.current;
    const bx = beamXRef.current;
    const bz = beamZRef.current;
    if (!glow || !bx || !bz) return;
    for (let k = 0; k < openCells.length; k++) {
      const level = field.levels[openCells[k]];
      // Warm energy ramp: charcoal -> ember -> amber, slightly over 1 for bloom.
      tmpColor.copy(PALETTE.charcoal).lerp(highContrast ? PALETTE.gold : PALETTE.amberDeep, Math.min(1, level * 1.15));
      if (level > 0.6) tmpColor.lerp(highContrast ? PALETTE.ivory : PALETTE.gold, (level - 0.6) * 0.7);

      // Soft full-tile wash, kept subtle so the beams carry the image.
      tmpColor.multiplyScalar(0.08 + (highContrast ? 0.9 : 0.7) * level);
      glow.setColorAt(k, tmpColor);

      // The beams — soft illuminated paths down the street centerline. Warm,
      // diffused, nudged past 1.0 so the bloom lifts them gently.
      tmpColor.copy(highContrast ? PALETTE.ivory : PALETTE.gold).lerp(PALETTE.amberDeep, highContrast ? 0 : 0.35);
      tmpColor.multiplyScalar((highContrast ? 2.6 : 2.0) * level);
      bx.setColorAt(k, tmpColor);
      bz.setColorAt(k, tmpColor);
    }
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true;
    if (bx.instanceColor) bx.instanceColor.needsUpdate = true;
    if (bz.instanceColor) bz.instanceColor.needsUpdate = true;
    void state;
  });

  return (
    <group>
      {/* Concrete tile bodies */}
      <instancedMesh
        args={[undefined, undefined, openCells.length]}
        ref={(mesh) => {
          if (!mesh) return;
          baseMatrices.forEach((m, k) => mesh.setMatrixAt(k, m));
          mesh.instanceMatrix.needsUpdate = true;
        }}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId != null) onPick(openCells[e.instanceId]);
        }}
        onPointerMove={(e) => {
          if (e.instanceId != null) onHover(openCells[e.instanceId]);
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[CELL * 0.96, 0.12, CELL * 0.96]} />
        <meshStandardMaterial color={PALETTE.graphite} roughness={0.92} metalness={0.05} />
      </instancedMesh>

      {/* Energy faces — soft tile wash */}
      <instancedMesh
        ref={glowRef}
        args={[undefined, undefined, openCells.length]}
        onUpdate={(mesh) => {
          const m = new THREE.Matrix4();
          openCells.forEach((i, k) => {
            const [x, z] = cellPos(puzzle, i);
            m.makeRotationX(-Math.PI / 2).setPosition(x, 0.004, z);
            mesh.setMatrixAt(k, m);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      >
        <planeGeometry args={[CELL * 0.84, CELL * 0.84]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Energy beams along X */}
      <instancedMesh
        ref={beamXRef}
        args={[undefined, undefined, openCells.length]}
        onUpdate={(mesh) => {
          const m = new THREE.Matrix4();
          openCells.forEach((i, k) => {
            const [x, z] = cellPos(puzzle, i);
            m.makeRotationX(-Math.PI / 2).setPosition(x, 0.009, z);
            mesh.setMatrixAt(k, m);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      >
        <planeGeometry args={[CELL, 0.2]} />
        <meshBasicMaterial map={beamTexture()} toneMapped={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {/* Energy beams along Z — same soft strip, rotated a quarter turn */}
      <instancedMesh
        ref={beamZRef}
        args={[undefined, undefined, openCells.length]}
        onUpdate={(mesh) => {
          const m = new THREE.Matrix4();
          const ry = new THREE.Matrix4().makeRotationY(Math.PI / 2);
          openCells.forEach((i, k) => {
            const [x, z] = cellPos(puzzle, i);
            m.makeRotationX(-Math.PI / 2).premultiply(ry).setPosition(x, 0.009, z);
            mesh.setMatrixAt(k, m);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      >
        <planeGeometry args={[CELL, 0.2]} />
        <meshBasicMaterial map={beamTexture()} toneMapped={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
