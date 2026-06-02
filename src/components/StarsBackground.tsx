import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
};

type Shooting = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
};

export default function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stars: Star[] = [];
    let shooting: Shooting[] = [];
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    const makeStar = (w: number, h: number): Star => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.3 + 0.2,
      baseOpacity: Math.random() * 0.5 + 0.1, // 0.1 - 0.6 per spec
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.015 + 0.003,
    });

    const resize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = Math.min(700, Math.floor((w * h) / 2400));
      stars = Array.from({ length: density }, () => makeStar(w, h));
    };

    const spawnShooting = (w: number) => {
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -50 : w + 50;
      const startY = Math.random() * (window.innerHeight * 0.55);
      const baseAngle = Math.PI / 6; // ~30deg
      const angle = (fromLeft ? 1 : -1) * (baseAngle + (Math.random() - 0.5) * 0.15);
      const speed = 8 + Math.random() * 4;
      shooting.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2,
        life: 0,
        maxLife: 75 + Math.random() * 30,
        length: 110 + Math.random() * 70,
      });
    };

    let lastShoot = 0;

    const draw = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // background stars — pure white, twinkling
      for (const s of stars) {
        s.twinklePhase += s.twinkleSpeed;
        const tw = (Math.sin(s.twinklePhase) + 1) / 2; // 0..1
        const alpha = s.baseOpacity * (0.5 + tw * 0.5);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // shooting stars (orange trails) - keep max 2-3 on screen
      if (t - lastShoot > 2400 + Math.random() * 2600 && shooting.length < 3) {
        lastShoot = t;
        if (Math.random() > 0.25) spawnShooting(w);
      }

      shooting = shooting.filter((sh) => {
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.life++;
        const lifeRatio = sh.life / sh.maxLife;
        const alpha = Math.sin(lifeRatio * Math.PI);
        const tailX = sh.x - sh.vx * (sh.length / 10);
        const tailY = sh.y - sh.vy * (sh.length / 10);

        const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 200, 130, ${alpha})`);
        grad.addColorStop(0.4, `rgba(249, 124, 29, ${alpha * 0.55})`);
        grad.addColorStop(1, 'rgba(249, 124, 29, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // soft head glow
        const headGrad = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 8);
        headGrad.addColorStop(0, `rgba(255, 220, 170, ${alpha})`);
        headGrad.addColorStop(1, 'rgba(255, 200, 130, 0)');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 235, 200, ${alpha})`;
        ctx.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        return sh.life < sh.maxLife && sh.x > -150 && sh.x < w + 150 && sh.y < h + 150;
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
