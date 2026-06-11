import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const BASE_POLAR = 0.42; // rad from vertical — steep aerial / near top-down view
const BASE_AZ = Math.PI * 0.25;
const RADIUS_FACTOR = 3.0; // far enough that the whole board fits in a 38° fov from above

/**
 * A fixed diorama camera framing the entire board. No drag, no dolly —
 * the only motion is the one slow hero revolution on restoration.
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
  const { camera } = useThree();
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

    const a = BASE_AZ + heroOffset;
    const r = boardExtent * RADIUS_FACTOR + heroLift * 0.4;
    const polar = BASE_POLAR - (heroLift / boardExtent) * 0.12;

    camera.position.set(r * Math.sin(polar) * Math.sin(a), r * Math.cos(polar) + heroLift * 0.3, r * Math.sin(polar) * Math.cos(a));
    camera.lookAt(lookAt.current);
  });

  return null;
}
