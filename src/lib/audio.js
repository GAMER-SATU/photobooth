// Web Audio Synthesizer Engine
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.soundOn = true;
  }

  ensure() {
    if (typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0.9;
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundOn(on) {
    this.soundOn = on;
    if (on) {
      this.ensure();
      this.beep(520, 0.04, 0.06);
    }
  }

  ok() {
    return this.soundOn && this.ctx;
  }

  noise(d) {
    const n = Math.floor(this.ctx.sampleRate * d);
    const b = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    return b;
  }

  beep(f = 620, v = 0.05, d = 0.09, dl = 0) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + dl;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(this.gain);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  tick() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise(0.03);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1400;
    f.Q.value = 2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    s.connect(f);
    f.connect(g);
    g.connect(this.gain);
    s.start(t);
  }

  click() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise(0.07);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2600;
    f.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    s.connect(f);
    f.connect(g);
    g.connect(this.gain);
    s.start(t);
    this.beep(170, 0.06, 0.05);
  }

  snip() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.beep(2100, 0.028, 0.03);
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise(0.05);
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f);
    f.connect(g);
    g.connect(this.gain);
    s.start(t);
  }

  whoosh() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise(1.8);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(420, t);
    f.frequency.exponentialRampToValueAtTime(95, t + 1.4);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    s.connect(f);
    f.connect(g);
    g.connect(this.gain);
    s.start(t);
  }

  thunk() {
    if (!this.ok()) return;
    this.beep(84, 0.18, 0.22);
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise(0.05);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    s.connect(f);
    f.connect(g);
    g.connect(this.gain);
    s.start(t);
  }

  ding() {
    this.beep(1240, 0.05, 0.55);
    this.beep(1860, 0.02, 0.4, 0.02);
  }

  stamp() {
    this.beep(120, 0.14, 0.14);
    this.tick();
  }

  arrive() {
    this.beep(520, 0.05, 0.22);
    this.beep(680, 0.045, 0.28, 0.16);
  }
}

export const Snd = new SoundEngine();
