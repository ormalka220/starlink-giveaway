type DrawSoundEngine = {
  resume: () => Promise<void>;
  tick: (speed: number) => void;
  win: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
};

export function createDrawSoundEngine(): DrawSoundEngine {
  let ctx: AudioContext | null = null;
  let muted = false;

  function getCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  }

  function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainPeak: number,
    when = 0,
    detune = 0,
  ) {
    if (muted) return;
    const audio = getCtx();
    const t = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    osc.detune.setValueAtTime(detune, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainPeak, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  function playNoise(duration: number, gainPeak: number, when = 0, filterFreq = 900) {
    if (muted) return;
    const audio = getCtx();
    const t = audio.currentTime + when;
    const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.Q.setValueAtTime(1.4, t);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(gainPeak, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start(t);
    source.stop(t + duration + 0.02);
  }

  return {
    async resume() {
      const audio = getCtx();
      if (audio.state === 'suspended') await audio.resume();
    },
    tick(speed) {
      const clamped = Math.max(0, Math.min(1, speed));
      const thump = 180 + clamped * 90;
      const click = 1400 + clamped * 800;
      const volume = 0.06 + clamped * 0.1;
      playTone(thump, 0.035, 'sine', volume * 0.55);
      playNoise(0.028, volume * 0.45, 0, click);
    },
    win() {
      playTone(130.81, 0.55, 'sine', 0.22);
      playNoise(0.12, 0.08, 0.02, 220);

      const melody = [
        { f: 523.25, d: 0.22, g: 0.14, w: 0.08 },
        { f: 659.25, d: 0.22, g: 0.13, w: 0.22 },
        { f: 783.99, d: 0.24, g: 0.13, w: 0.36 },
        { f: 1046.5, d: 0.35, g: 0.12, w: 0.52 },
        { f: 1318.51, d: 0.55, g: 0.1, w: 0.68 },
      ];
      melody.forEach(({ f, d, g, w }) => playTone(f, d, 'triangle', g, w));

      playTone(1567.98, 0.18, 'sine', 0.06, 0.9, 8);
      playTone(2093, 0.22, 'sine', 0.05, 1.05, -6);

      [0.35, 0.55, 0.78, 1.05].forEach((when, i) => {
        playNoise(0.18 - i * 0.02, 0.1 - i * 0.015, when, 380 + i * 120);
        playTone(90 + i * 20, 0.25, 'sine', 0.08, when);
      });
    },
    setMuted(value: boolean) {
      muted = value;
    },
    isMuted() {
      return muted;
    },
  };
}

/** Track slice-boundary crossings and fire tick callback with current spin speed. */
export function createTickTracker(count: number) {
  const slice = 360 / count;
  let lastSegment = -1;

  return {
    reset(fromAngle: number) {
      lastSegment = Math.floor(fromAngle / slice);
    },
    update(angle: number, speed: number, onTick: (speed: number) => void) {
      const segment = Math.floor(angle / slice);
      if (lastSegment === -1) {
        lastSegment = segment;
        return;
      }
      while (lastSegment < segment) {
        lastSegment += 1;
        onTick(speed);
      }
    },
  };
}

export type { DrawSoundEngine };
