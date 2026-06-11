import * as THREE from 'three';

/** Approved palette — charcoal world, amber energy. Nothing saturated. */
export const PALETTE = {
  night: new THREE.Color('#0a0b0e'),
  charcoal: new THREE.Color('#15171c'),
  graphite: new THREE.Color('#23262d'),
  concrete: new THREE.Color('#3a3e46'),
  warmGrey: new THREE.Color('#6b6760'),
  ivory: new THREE.Color('#e8e4da'),
  amber: new THREE.Color('#ffb454'),
  amberDeep: new THREE.Color('#ff9024'),
  gold: new THREE.Color('#ffd9a0'),
  ember: new THREE.Color('#b86a3a'),
};

/** Colorblind-safe alternative for "conflict": cool steel instead of red-ish ember. */
export const CONFLICT_CB = new THREE.Color('#9fb8d8');

export const CELL = 1; // world units per street cell
