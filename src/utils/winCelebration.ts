import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#EE3124', '#22D3EE', '#F59E0B', '#22C55E', '#FFFFFF', '#A855F7'];

type CelebrationHandle = { stop: () => void };

function burst(originX: number, originY: number, particleCount: number, spread = 70) {
  void confetti({
    particleCount,
    spread,
    startVelocity: 42,
    origin: { x: originX, y: originY },
    colors: BRAND_COLORS,
    ticks: 220,
    scalar: 1.05,
    disableForReducedMotion: true,
  });
}

function firework(originX: number, originY: number) {
  const count = 120;
  void confetti({
    particleCount: Math.floor(count * 0.35),
    spread: 26,
    startVelocity: 52,
    origin: { x: originX, y: originY },
    colors: BRAND_COLORS,
    ticks: 260,
    disableForReducedMotion: true,
  });
  void confetti({
    particleCount: Math.floor(count * 0.25),
    spread: 100,
    decay: 0.9,
    scalar: 0.95,
    origin: { x: originX, y: originY },
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
  });
  void confetti({
    particleCount: Math.floor(count * 0.2),
    spread: 120,
    startVelocity: 38,
    decay: 0.92,
    scalar: 1.15,
    origin: { x: originX, y: originY },
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
  });
}

const CELEBRATION_MS = 60_000;
const INTERVAL_MS = 450;

/** Confetti shower + staggered fireworks while the winner overlay is open. */
export function launchWinCelebration(): CelebrationHandle {
  burst(0.5, 0.62, 140, 110);
  firework(0.22, 0.35);
  firework(0.78, 0.32);

  let ticks = 0;
  const interval = window.setInterval(() => {
    ticks += 1;
    if (ticks % 2 === 0) burst(Math.random() * 0.4 + 0.3, Math.random() * 0.25 + 0.55, 36, 90);
    if (ticks % 3 === 0) firework(Math.random() * 0.6 + 0.2, Math.random() * 0.25 + 0.28);
  }, INTERVAL_MS);

  const timeout = window.setTimeout(() => {
    window.clearInterval(interval);
  }, CELEBRATION_MS);

  return {
    stop() {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      confetti.reset();
    },
  };
}

export type { CelebrationHandle };
