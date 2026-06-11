import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const BASE_POLAR = 0.96; // rad from vertical — the classic diorama angle

/**
 * The camera never sits still and never startles. A damped isometric orbit
 * with a faint breathing drift; drag (or arrow-key style swipe) nudges the
 * orbit; restoration triggers one slow hero revolution.
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
  const { camera, gl } = useThree();
  const az = useRef(Math.PI * 0.25);
  const targetAz = useRef(Math.PI * 0.25);
  const radius = useRef(boardExtent * 2.1);
  const targetRadius = useRef(boardExtent * 2.1);
  const heroStart = useRef<number | null>(null);
  const heroDone = useRef(false);
  const lookAt = useRef(new THREE.Vector3(0, 0.2, 0));

  useEffect(() => {
    targetRadius.current = boardExtent * 2.1;
  }, [boardExtent]);

  useEffect(() => {
    if (!cinematic) {
      heroStart.current = null;
      heroDone.current = false;
    }
  }, [cinematic]);

  // Drag to orbit, wheel/pinch to dolly.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let pinchDist = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      targetAz.current += (e.clientX - lastX) * 0.005;
      lastX = e.clientX;
    };
    const up = () => (dragging = false);
    const wheel = (e: WheelEvent) => {
      targetRadius.current = THREE.MathUtils.clamp(
        targetRadius.current + e.deltaY * 0.01,
        boardExtent * 1.3,
        boardExtent * 3.2,
      );
    };
    const touchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        if (pinchDist > 0) {
          targetRadius.current = THREE.MathUtils.clamp(
            targetRadius.current - (d - pinchDist) * 0.01,
            boardExtent * 1.3,
            boardExtent * 3.2,
          );
        }
        pinchDist = d;
      }
    };
    const touchEnd = () => (pinchDist = 0);

    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('wheel', wheel, { passive: true });
    el.addEventListener('touchmove', touchMove, { passive: true });
    el.addEventListener('touchend', touchEnd);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('touchmove', touchMove);
      el.removeEventListener('touchend', touchEnd);
    };
  }, [gl, boardExtent]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 4);

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

    az.current += (targetAz.current - az.current) * k;
    radius.current += (targetRadius.current - radius.current) * k;

    // Breathing: the expensive part — never static, never disorienting.
    const breatheAz = reducedMotion ? 0 : Math.sin(t * 0.11) * 0.025;
    const breatheR = reducedMotion ? 0 : Math.sin(t * 0.07) * boardExtent * 0.02;

    const a = az.current + breatheAz + heroOffset;
    const r = radius.current + breatheR + heroLift * 0.4;
    const polar = BASE_POLAR - (heroLift / boardExtent) * 0.12;

    camera.position.set(r * Math.sin(polar) * Math.sin(a), r * Math.cos(polar) + heroLift * 0.3, r * Math.sin(polar) * Math.cos(a));
    camera.lookAt(lookAt.current);
  });

  return null;
}
