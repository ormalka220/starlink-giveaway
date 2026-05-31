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
  ) {
    if (muted) return;
    const audio = getCtx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audio.currentTime + when);
    gain.gain.setValueAtTime(0.0001, audio.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(gainPeak, audio.currentTime + when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + when + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(audio.currentTime + when);
    osc.stop(audio.currentTime + when + duration + 0.02);
  }

  return {
    async resume() {
      const audio = getCtx();
      if (audio.state === 'suspended') await audio.resume();
    },
    tick(speed) {
      const clamped = Math.max(0, Math.min(1, speed));
      const freq = 520 + clamped * 420;
      const volume = 0.04 + clamped * 0.05;
      playTone(freq, 0.045, 'triangle', volume);
    },
    win() {
      playTone(523.25, 0.18, 'sine', 0.12);
      playTone(659.25, 0.22, 'sine', 0.11, 0.12);
      playTone(783.99, 0.35, 'sine', 0.1, 0.24);
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
