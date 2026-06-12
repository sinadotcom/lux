import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_POLAR = 0.9; // rad from vertical — classic three-quarter diorama angle
const DEFAULT_AZ = Math.PI * 0.25;
const MIN_POLAR = 0.05;
const MAX_POLAR = 1.35;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.2;

/**
 * Interactive diorama camera. Drag to orbit, wheel/pinch to zoom; a slow
 * damped follow keeps it smooth. The default frame (zoom = 1) is computed
 * from the viewport so the whole board fits on any screen, then the player's
 * zoom multiplies that distance. The restoration cinematic still plays one
 * slow hero revolution.
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
  const { camera, gl, size } = useThree();
  const heroStart = useRef<number | null>(null);
  const heroDone = useRef(false);
  const lookAt = useRef(new THREE.Vector3(0, 0.2, 0));

  // Orbit + zoom state, with damped targets.
  const az = useRef(DEFAULT_AZ);
  const targetAz = useRef(DEFAULT_AZ);
  const polar = useRef(DEFAULT_POLAR);
  const targetPolar = useRef(DEFAULT_POLAR);
  const zoom = useRef(1);
  const targetZoom = useRef(1);

  useEffect(() => {
    if (!cinematic) {
      heroStart.current = null;
      heroDone.current = false;
    }
  }, [cinematic]);

  // Drag to orbit, wheel/pinch to zoom.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pinchDist = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      targetAz.current += (e.clientX - lastX) * 0.005;
      targetPolar.current = THREE.MathUtils.clamp(
        targetPolar.current - (e.clientY - lastY) * 0.005,
        MIN_POLAR,
        MAX_POLAR,
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => (dragging = false);
    const wheel = (e: WheelEvent) => {
      targetZoom.current = THREE.MathUtils.clamp(targetZoom.current * (1 + e.deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);
    };
    const touchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        if (pinchDist > 0) {
          targetZoom.current = THREE.MathUtils.clamp(targetZoom.current * (pinchDist / d), MIN_ZOOM, MAX_ZOOM);
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
  }, [gl]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 6);

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

    // Damp toward the player's targets.
    az.current += (targetAz.current - az.current) * k;
    polar.current += (targetPolar.current - polar.current) * k;
    zoom.current += (targetZoom.current - zoom.current) * k;

    // Default distance fits the board to the narrower viewport dimension, so
    // zoom = 1 always frames the whole board on any screen.
    const fovVrad = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const aspect = size.width / size.height;
    const halfV = fovVrad / 2;
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    const halfMin = Math.min(halfV, halfH);
    const fitRadius = (boardExtent * Math.SQRT2 * 1.24) / Math.sin(halfMin);

    const r = fitRadius * zoom.current + heroLift * 0.4;
    const a = az.current + heroOffset;
    const p = THREE.MathUtils.clamp(polar.current - (heroLift / boardExtent) * 0.12, MIN_POLAR, MAX_POLAR);

    camera.position.set(
      r * Math.sin(p) * Math.sin(a),
      r * Math.cos(p) + heroLift * 0.3,
      r * Math.sin(p) * Math.cos(a),
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}
