import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { indexAtPointer, targetAngleForIndex } from '../utils/wheelMath';
import { createDrawSoundEngine, createTickTracker } from '../utils/drawSounds';
import { launchWinCelebration } from '../utils/winCelebration';
import type { Participant } from '../types';

const COLORS = ['#EE3124', '#22D3EE', '#22C55E', '#A855F7', '#F59E0B', '#EC4899', '#3B82F6', '#10B981'];

export default function Draw({ demo = false }: { demo?: boolean }) {
  const { push } = useToast();
  const [eligible, setEligible] = useState<Participant[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const listRef = useRef<Participant[]>([]);
  const soundsRef = useRef(createDrawSoundEngine());
  const celebrationRef = useRef<ReturnType<typeof launchWinCelebration> | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  function stopCelebration() {
    celebrationRef.current?.stop();
    celebrationRef.current = null;
  }

  function closeWinnerOverlay() {
    stopCelebration();
    setShowWinnerOverlay(false);
  }

  useEffect(() => { api.eligibleForDraw().then(setEligible); }, []);

  useEffect(() => () => stopCelebration(), []);

  const list = useMemo(() => {
    if (demo) {
      return Array.from({ length: 8 }, (_, i) => ({ id: `d_${i}`, ticketId: `SPT-${1000 + i}`, fullName: `Demo ${i + 1}`, company: 'DemoCo' } as Participant));
    }
    return eligible.slice(0, 50);
  }, [demo, eligible]);

  listRef.current = list;

  const drawWheel = useCallback((currentAngle: number, participants: Participant[]) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const size = c.width;
    const r = size / 2;
    ctx.clearRect(0, 0, size, size);
    if (participants.length === 0) {
      ctx.fillStyle = '#161D30';
      ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8A93AD'; ctx.font = '24px Heebo'; ctx.textAlign = 'center';
      ctx.fillText('אין משתתפים', r, r);
      return;
    }
    const slice = (Math.PI * 2) / participants.length;
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate((currentAngle * Math.PI) / 180 - Math.PI / 2);
    participants.forEach((p, i) => {
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
  }, []);

  useEffect(() => {
    angleRef.current = angle;
    drawWheel(angle, list);
  }, [list, angle, drawWheel]);

  function spin() {
    const participants = listRef.current;
    if (spinning || participants.length === 0) return;
    stopCelebration();
    setShowWinnerOverlay(false);
    setWinner(null);
    setSpinning(true);

    const sounds = soundsRef.current;
    sounds.setMuted(!soundOn);
    void sounds.resume();

    const winnerIdx = Math.floor(Math.random() * participants.length);
    const from = angleRef.current;
    const target = targetAngleForIndex(winnerIdx, participants.length, from);
    const start = performance.now();
    const duration = 20000;
    const tickTracker = createTickTracker(participants.length);
    tickTracker.reset(from);
    let prevAngle = from;

    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = from + (target - from) * eased;
      const speed = Math.min(1, Math.abs(current - prevAngle) / 8);
      prevAngle = current;
      angleRef.current = current;
      drawWheel(current, participants);
      tickTracker.update(current, speed, (s) => sounds.tick(s));

      if (t < 1) {
        requestAnimationFrame(frame);
        return;
      }

      angleRef.current = target;
      drawWheel(target, participants);
      const visualIdx = indexAtPointer(target, participants.length);
      sounds.win();
      celebrationRef.current = launchWinCelebration();
      setAngle(target);
      setWinner(participants[visualIdx]);
      setShowWinnerOverlay(true);
      setSpinning(false);
    }
    requestAnimationFrame(frame);
  }

  async function confirmWinner() {
    if (!winner) return;
    if (demo) { push('מצב הדגמה - לא נשמר'); closeWinnerOverlay(); return; }
    const confirmed = await api.confirmWinner(winner.id);
    push(confirmed.smsSent ? 'הזכייה אושרה ונשלח SMS לזוכה' : 'הזכייה אושרה, אך SMS לא נשלח');
    closeWinnerOverlay();
    api.eligibleForDraw().then(setEligible);
  }

  async function sendSmsToWinner() {
    if (!winner) return;
    if (demo) { push('מצב הדגמה - לא נשלח SMS'); return; }
    try {
      const result = await api.sendSms(`ברכות! זכית בהגרלת Starlink בכנס Fortinet. נציג שלנו יצור איתך קשר.`, winner.phone, 1);
      push((result.sent ?? result.recipientsCount) > 0 ? 'SMS נשלח לזוכה' : 'SMS לא נשלח לזוכה', (result.sent ?? result.recipientsCount) > 0 ? 'success' : 'error');
    } catch (err) {
      push(err instanceof Error ? err.message : 'SMS לא נשלח לזוכה', 'error');
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber [background-size:64px_64px] opacity-25" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-forti-red/20 rounded-full blur-[140px] animate-pulse-slow" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-forti-accent/15 rounded-full blur-[140px] animate-pulse-slow" />

      <header className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/spotnet-logo.png" alt="SpotNet" className="h-9 md:h-10 object-contain" />
          <span className="hidden md:inline-block h-7 w-px bg-white/15" />
          <span className="hidden md:flex items-center gap-2 text-sm tracking-[0.18em] uppercase text-forti-mute">
            <span className="inline-flex items-center rounded-md bg-white/95 px-2 py-1">
              <img src="/Fortinet-Logo.wine.svg" alt="Fortinet" className="h-6 md:h-7 w-auto object-contain" />
            </span>
            <span className="text-forti-mute/60">·</span>
            <span>Event 2026</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSoundOn((v) => !v)}
          className="chip text-xs"
          aria-label={soundOn ? 'השתק סאונד' : 'הפעל סאונד'}
        >
          {soundOn ? 'סאונד פעיל' : 'סאונד כבוי'}
        </button>
      </header>

      <main className="relative z-10 px-6 pb-10">
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            הגרלת <img src="/starlink-logo.png" alt="Starlink" className="h-10 md:h-14 w-auto object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.12)]" />
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
              <button onClick={() => { closeWinnerOverlay(); setWinner(null); spin(); }} className="btn-ghost">הגרל מחדש</button>
              <button onClick={closeWinnerOverlay} className="btn-ghost">סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
