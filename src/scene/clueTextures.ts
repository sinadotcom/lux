import * as THREE from 'three';

export type ClueLook = 'pending' | 'satisfied' | 'over';

const cache = new Map<string, THREE.CanvasTexture>();

/**
 * Crisp runtime-rendered digit plates for structures, so we never depend on
 * remote fonts. Satisfaction is encoded in both color and shape (a ring when
 * satisfied, a bar when over-supplied) for colorblind players.
 */
export function clueTexture(digit: number, look: ClueLook): THREE.CanvasTexture {
  const key = `${digit}-${look}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d')!;
  g.clearRect(0, 0, size, size);

  const color = look === 'satisfied' ? '#ffc878' : look === 'over' ? '#c8d8ee' : '#d8d4ca';
  g.fillStyle = color;
  g.strokeStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '300 64px "Helvetica Neue", Helvetica, Arial, sans-serif';
  // A 0-clue forbids any adjacent core — read it as "keep away", so mark X.
  g.fillText(digit === 0 ? 'X' : String(digit), size / 2, size / 2 + 2);

  if (look === 'satisfied') {
    g.lineWidth = 4;
    g.beginPath();
    g.arc(size / 2, size / 2, 46, 0, Math.PI * 2);
    g.stroke();
  } else if (look === 'over') {
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(size / 2 - 30, size - 22);
    g.lineTo(size / 2 + 30, size - 22);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
