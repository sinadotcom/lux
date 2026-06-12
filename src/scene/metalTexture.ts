import * as THREE from 'three';

/**
 * Procedural recreation of the Poliigon "MetalPaintedMatte 7037" set the
 * design references: near-black matte painted metal — dark speckled base,
 * fine paint-grain normals, high roughness with subtle blotches, mid
 * metalness. Generated once at runtime so we ship no texture assets.
 */

let cached: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } | null =
  null;

function canvasTexture(draw: (g: CanvasRenderingContext2D, size: number) => void, srgb: boolean): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function paintedMetalTextures() {
  if (cached) return cached;

  // Base color: near-black paint with faint speckle, like the photo set.
  const map = canvasTexture((g, s) => {
    g.fillStyle = '#161617';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const v = 18 + Math.random() * 16;
      g.fillStyle = `rgba(${v},${v},${v + 2},${0.25 + Math.random() * 0.4})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  }, true);

  // Roughness: high (matte) with soft darker smudges.
  const roughnessMap = canvasTexture((g, s) => {
    g.fillStyle = '#dadada';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 18 + Math.random() * 42;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(190,190,190,0.35)');
      grad.addColorStop(1, 'rgba(190,190,190,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, false);

  // Normal: flat tangent base with fine paint grain.
  const normalMap = canvasTexture((g, s) => {
    g.fillStyle = 'rgb(128,128,255)';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 5200; i++) {
      const dx = Math.round((Math.random() - 0.5) * 14);
      const dy = Math.round((Math.random() - 0.5) * 14);
      g.fillStyle = `rgba(${128 + dx},${128 + dy},255,0.5)`;
      g.fillRect(Math.random() * s, Math.random() * s, 1, 1);
    }
  }, false);

  cached = { map, roughnessMap, normalMap };
  return cached;
}
