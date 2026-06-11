/**
 * Generative soundtrack. Everything is synthesized in WebAudio — a slow
 * modular-style drone that opens up as the district gains power, plus
 * tactile plucks for interaction and a swell for restoration.
 */

const PENTATONIC = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private shimmerGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private enabled = true;
  private noteStep = 0;

  /** Must be called from a user gesture (browser autoplay policy). */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.enabled ? 0.8 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
    this.master = master;

    this.buildAmbientBed();
  }

  private buildAmbientBed() {
    const ctx = this.ctx!;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.7;
    padGain.connect(filter).connect(this.master!);
    this.padFilter = filter;
    this.padGain = padGain;

    // Detuned drone — A1 root with slow-beating fifths.
    for (const [freq, detune, level] of [
      [55, 0, 0.5],
      [55, 6, 0.35],
      [82.4, -4, 0.25],
      [110, 3, 0.2],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(padGain);
      osc.start();
    }

    // Breathing: very slow LFO over the filter cutoff.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    // Shimmer layer (revealed as the city wakes): airy high partials.
    const shimmer = ctx.createGain();
    shimmer.gain.value = 0;
    shimmer.connect(this.master!);
    this.shimmerGain = shimmer;
    for (const freq of [880, 1318.5, 1760]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.012;
      const trem = ctx.createOscillator();
      trem.frequency.value = 0.07 + freq / 30000;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 0.01;
      trem.connect(tremGain).connect(g.gain);
      osc.connect(g).connect(shimmer);
      osc.start();
      trem.start();
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.2);
    }
  }

  /** Open the soundtrack with restoration progress in [0, 1]. */
  setProgress(t: number) {
    if (!this.ctx || !this.padFilter || !this.shimmerGain) return;
    const now = this.ctx.currentTime;
    this.padFilter.frequency.setTargetAtTime(320 + 1400 * t * t, now, 1.5);
    this.shimmerGain.gain.setTargetAtTime(0.5 * Math.max(0, t - 0.3), now, 2);
    this.padGain?.gain.setTargetAtTime(0.05 + 0.03 * t, now, 1.5);
  }

  private pluck(freq: number, opts: { type?: OscillatorType; gain?: number; decay?: number; when?: number } = {}) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const { type = 'triangle', gain = 0.18, decay = 1.2, when = 0 } = opts;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + decay + 0.1);
  }

  /** A core landing — ascending pentatonic walk plus a soft sub thump. */
  corePlaced() {
    this.ensure();
    const note = PENTATONIC[this.noteStep % PENTATONIC.length];
    this.noteStep++;
    this.pluck(note, { gain: 0.16, decay: 1.6 });
    this.pluck(note * 2, { gain: 0.05, decay: 2.2, when: 0.06 });
    this.pluck(55, { type: 'sine', gain: 0.22, decay: 0.5 });
  }

  coreRemoved() {
    this.ensure();
    this.noteStep = Math.max(0, this.noteStep - 1);
    this.pluck(146.83, { gain: 0.1, decay: 0.8 });
  }

  hint() {
    this.ensure();
    this.pluck(1046.5, { type: 'sine', gain: 0.08, decay: 2.5 });
    this.pluck(1568, { type: 'sine', gain: 0.04, decay: 2.5, when: 0.12 });
  }

  uiTick() {
    this.ensure();
    this.pluck(660, { type: 'sine', gain: 0.04, decay: 0.35 });
  }

  /** The restoration climax: a slow major-add9 bloom. */
  complete() {
    this.ensure();
    const chord = [110, 220, 277.18, 329.63, 415.3, 554.37, 659.26];
    chord.forEach((f, i) => this.pluck(f, { gain: 0.12, decay: 5, when: i * 0.16, type: i < 2 ? 'sine' : 'triangle' }));
    this.setProgress(1);
  }

  reset() {
    this.noteStep = 0;
  }
}

export const audio = new AudioEngine();
