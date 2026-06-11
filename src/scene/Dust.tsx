import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Atmospheric dust — slow amber motes drifting through the dark, denser and
 * brighter as restoration progresses. A single buffered Points cloud.
 */
export function Dust({ extent, energy, reduced }: { extent: number; energy: React.MutableRefObject<number>; reduced: boolean }) {
  const count = reduced ? 60 : 360;
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * extent * 2;
      positions[i * 3 + 1] = Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * extent * 2;
      speeds[i] = 0.03 + Math.random() * 0.09;
    }
    return { positions, speeds };
  }, [count, extent]);

  useFrame((state, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * dt;
      if (y > 3.6) y = 0;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.2 + i) * dt * 0.02);
    }
    pos.needsUpdate = true;
    const mat = matRef.current;
    if (mat) {
      mat.opacity = 0.18 + energy.current * 0.4;
      mat.size = 0.02 + energy.current * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color="#ffc887"
        size={0.025}
        sizeAttenuation
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
