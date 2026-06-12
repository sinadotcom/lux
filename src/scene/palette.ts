import * as THREE from 'three';

/** Approved palette — gallery darkness, ceramic architecture, amber energy. */
export const PALETTE = {
  night: new THREE.Color('#070708'),
  charcoal: new THREE.Color('#15171c'),
  graphite: new THREE.Color('#23262d'),
  concrete: new THREE.Color('#3a3e46'),
  /** Off-white ceramic — the architectural model material from the moodboard. */
  ceramic: new THREE.Color('#cfcbc1'),
  /** Light concrete for plinth/sidewalk surfaces. */
  lightConcrete: new THREE.Color('#8f8c84'),
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
