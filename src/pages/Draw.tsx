import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { BrandMark } from '../components/Brand';
import type { Participant } from '../types';

const COLORS = ['#EE3124', '#22D3EE', '#22C55E', '#A855F7', '#F59E0B', '#EC4899', '#3B82F6', '#10B981'];

export default function Draw() {
  const { push } = useToast();
  const [eligible, setEligible] = useState<Participant[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [demo, setDemo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { api.eligibleForDraw().then(setEligible); }, []);

  const list = useMemo(() => {
    if (demo) {
      return Array.from({ length: 8 }, (_, i) => ({ id: `d_${i}`, ticketId: `FT-${i}`, fullName: `Demo ${i + 1}`, company: 'DemoCo' } as Participant));
    }
    return eligible.slice(0, 50);
  }, [demo, eligible]);

  useEffect(() => { drawWheel(); }, [list, angle]);

  function drawWheel() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const size = c.width;
    const r = size / 2;
    ctx.clearRect(0, 0, size, size);
    if (list.length === 0) {
      ctx.fillStyle = '#161D30';
      ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8A93AD'; ctx.font = '24px Heebo'; ctx.textAlign = 'center';
      ctx.fillText('אין משתתפים', r, r);
      return;
    }
    const slice = (Math.PI * 2) / list.length;
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate((angle * Math.PI) / 180);
    list.forEach((p, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 8, i * slice, (i + 1) * slice);
      ctx.closePath();
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      grad.addColorStop(0, COLORS[i % COLORS.length] + 'cc');
      grad.addColorStop(1, COLORS[i % COLORS.length] + '55');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#0A0E1A';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * slice + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = '600 14px Heebo';
      const label = `${p.ticketId} · ${p.fullName}`;
      ctx.fillText(label.length > 24 ? label.slice(0, 23) + '…' : label, r - 20, 5);
      ctx.restore();
    });
    ctx.restore();

    ctx.beginPath();
    ctx.arc(r, r, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0E1A';
    ctx.fill();
    ctx.strokeStyle = '#EE3124';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  async function spin() {
    if (spinning || list.length === 0) return;
    setShowWinnerOverlay(false);
    setWinner(null);
    setSpinning(true);

    const winnerIdx = Math.floor(Math.random() * list.length);
    const slice = 360 / list.length;
    const target = 360 * 8 + (360 - (winnerIdx * slice + slice / 2));
    const start = performance.now();
    const from = angle % 360;
    const duration = 6000;

    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setAngle(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
      else {
        const w = list[winnerIdx];
        setWinner(w);
        setShowWinnerOverlay(true);
        setSpinning(false);
      }
    }
    requestAnimationFrame(frame);
  }

  async function confirmWinner() {
    if (!winner) return;
    if (demo) { push('מצב הדגמה - לא נשמר'); setShowWinnerOverlay(false); return; }
    await api.confirmWinner(winner.id);
    push('הזכייה אושרה ונשמרה');
    setShowWinnerOverlay(false);
    api.eligibleForDraw().then(setEligible);
  }

  function sendSmsToWinner() {
    if (!winner) return;
    api.sendSms(`ברכות! זכית בהגרלת Starlink בכנס Fortinet. נציג שלנו יצור איתך קשר.`, winner.fullName, 1);
    push('SMS נשלח לזוכה');
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber [background-size:64px_64px] opacity-25" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-forti-red/20 rounded-full blur-[140px] animate-pulse-slow" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-forti-accent/15 rounded-full blur-[140px] animate-pulse-slow" />

      <header className="relative z-10 flex justify-between items-center px-8 py-5">
        <BrandMark size={36} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 chip cursor-pointer">
            <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="accent-forti-red" />
            <span>מצב Demo</span>
          </label>
          <a href="/admin" className="chip">חזרה לאדמין</a>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-10">
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            הגרלת <span className="text-forti-red drop-shadow-[0_0_30px_rgba(238,49,36,0.6)]">Starlink</span>
          </h1>
          <p className="text-forti-mute text-lg mt-2">Fortinet Event · by SpotNet</p>
          <div className="mt-4 inline-flex items-center gap-2 chip text-forti-accent border-forti-accent/40">
            <span className="w-2 h-2 rounded-full bg-forti-accent animate-pulse" />
            <span>{list.length} משתתפים פעילים</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-forti-red/30 via-forti-accent/20 to-transparent blur-2xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <svg width="40" height="56" viewBox="0 0 40 56">
                <defs>
                  <linearGradient id="pointer" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#EE3124" />
                    <stop offset="1" stopColor="#9b1f17" />
                  </linearGradient>
                </defs>
                <path d="M20 50 L4 8 L36 8 Z" fill="url(#pointer)" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
            <canvas ref={canvasRef} width={620} height={620} className={`relative rounded-full shadow-glow border-4 border-forti-line ${spinning ? 'animate-pulse' : ''}`} />
          </div>

          <button onClick={spin} disabled={spinning || list.length === 0} className="mt-10 btn-primary text-2xl px-12 py-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow">
            {spinning ? 'מסובב...' : 'התחל הגרלה'}
          </button>
        </div>
      </main>

      {showWinnerOverlay && winner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="glass max-w-2xl w-full p-10 text-center animate-scale-in shadow-glow border-2 border-forti-red">
            <div className="text-forti-accent uppercase tracking-[0.3em] text-xs mb-3">The Winner Is</div>
            <h2 className="text-6xl md:text-7xl font-black text-forti-red drop-shadow-[0_0_40px_rgba(238,49,36,0.6)] mb-4">{winner.fullName}</h2>
            <div className="text-2xl text-forti-ink">{winner.company}</div>
            <div className="mt-3 font-mono text-forti-accent text-lg">{winner.ticketId}</div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button onClick={confirmWinner} className="btn-primary text-lg px-6 py-3">אשר זכייה</button>
              <button onClick={sendSmsToWinner} className="btn-accent">שלח SMS לזוכה</button>
              <button onClick={() => { setShowWinnerOverlay(false); setWinner(null); spin(); }} className="btn-ghost">הגרל מחדש</button>
              <button onClick={() => setShowWinnerOverlay(false)} className="btn-ghost">סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
