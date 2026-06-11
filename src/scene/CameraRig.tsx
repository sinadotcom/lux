import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const BASE_POLAR = 0.42; // rad from vertical — steep aerial view
const BASE_AZ = Math.PI * 0.25;

/**
 * A fixed aerial camera that always frames the entire board regardless of
 * screen orientation or size. Distance is computed from the viewport's
 * narrower half-FOV each frame, so portrait mobile and landscape desktop
 * both see the full grid.
 */
export function CameraRig({
  boardExtent,
  cinematic,
  onCinematicEnd,
  reducedMotion,
}: {
  boardExtent: number;
  cinematic: boolean;
  onCinematicEnd: () => void;
  reducedMotion: boolean;
}) {
  const { camera, size } = useThree();
  const heroStart = useRef<number | null>(null);
  const heroDone = useRef(false);
  const lookAt = useRef(new THREE.Vector3(0, 0.2, 0));

  useEffect(() => {
    if (!cinematic) {
      heroStart.current = null;
      heroDone.current = false;
    }
  }, [cinematic]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    let heroOffset = 0;
    let heroLift = 0;
    if (cinematic && !heroDone.current) {
      if (heroStart.current === null) heroStart.current = t;
      const dur = reducedMotion ? 1.8 : 7;
      const u = Math.min(1, (t - heroStart.current) / dur);
      const eased = u * u * (3 - 2 * u);
      if (!reducedMotion) {
        heroOffset = eased * Math.PI * 2;
        heroLift = Math.sin(u * Math.PI) * boardExtent * 0.5;
      }
      if (u >= 1) {
        heroDone.current = true;
        onCinematicEnd();
      }
    }

    // Compute the camera distance so the board fits the screen on any
    // orientation. We find the half-angle of the narrower viewport dimension
    // and back out to fit the board's half-diagonal (boardExtent * √2).
    const fovVrad = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const aspect = size.width / size.height;
    const halfV = fovVrad / 2;
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    const halfMin = Math.min(halfV, halfH);

    // Board half-diagonal + 18% padding so edges don't kiss the frustum edge.
    // Divide by sin(halfMin) to get required camera-to-board distance.
    const boardRadius = boardExtent * Math.SQRT2 * 1.18;
    const r = boardRadius / Math.sin(halfMin) + heroLift * 0.4;

    const a = BASE_AZ + heroOffset;
    const polar = BASE_POLAR - (heroLift / boardExtent) * 0.12;

    camera.position.set(
      r * Math.sin(polar) * Math.sin(a),
      r * Math.cos(polar) + heroLift * 0.3,
      r * Math.sin(polar) * Math.cos(a),
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}
