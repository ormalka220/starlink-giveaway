import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { indexAtPointer, targetAngleForIndex } from '../utils/wheelMath';
import { createDrawSoundEngine, createTickTracker } from '../utils/drawSounds';
import { launchWinCelebration } from '../utils/winCelebration';
import EventHeaderBar from '../components/EventHeaderBar';
import StarsBackground from '../components/StarsBackground';
import type { Participant } from '../types';

const COLORS = ['#F97C1D', '#FFA04D', '#D4600A', '#22C55E', '#A855F7', '#EC4899', '#3B82F6', '#FFC882'];

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
    return eligible;
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
      ctx.fillStyle = '#10141F';
      ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '24px Heebo'; ctx.textAlign = 'center';
      ctx.fillText('אין משתתפים', r, r);
      return;
    }
    const count = participants.length;
    const fontSize = count > 60 ? 9 : count > 40 ? 10 : count > 20 ? 12 : 14;
    const slice = (Math.PI * 2) / count;
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
      ctx.strokeStyle = '#020204';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * slice + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${fontSize}px Heebo`;
      const label = count > 50 ? p.ticketId : `${p.ticketId} · ${p.fullName}`;
      const maxLen = count > 50 ? 10 : 24;
      ctx.fillText(label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label, r - 20, 5);
      ctx.restore();
    });
    ctx.restore();

    ctx.beginPath();
    ctx.arc(r, r, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#020204';
    ctx.fill();
    ctx.strokeStyle = '#F97C1D';
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
      <StarsBackground />
      <div
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full pointer-events-none animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(249,124,29,0.12) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(255,200,130,0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <EventHeaderBar
        className="z-10"
        trailing={
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            className="chip text-xs"
            aria-label={soundOn ? 'השתק סאונד' : 'הפעל סאונד'}
          >
            {soundOn ? 'סאונד פעיל' : 'סאונד כבוי'}
          </button>
        }
      />

      <main className="relative z-10 px-4 sm:px-6 pb-10 pt-6 sm:pt-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-semibold flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 md:gap-x-10 gap-y-2"
            style={{ letterSpacing: '-0.03em' }}
          >
            <span className="headline-gradient">הגרלת</span>
            <img src="/starlink-logo.png" alt="Starlink" className="h-8 sm:h-10 md:h-14 w-auto object-contain drop-shadow-[0_0_24px_rgba(249,124,29,0.30)]" />
          </h1>
          <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 chip chip-orange">
            <span className="w-2 h-2 rounded-full bg-spotnet-orange animate-pulse" />
            <span>{list.length} משתתפים פעילים</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[620px]">
            <div
              className="absolute -inset-10 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(249,124,29,0.30) 0%, transparent 60%)',
                filter: 'blur(40px)',
              }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <svg width="40" height="56" viewBox="0 0 40 56">
                <defs>
                  <linearGradient id="pointer" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#FFA04D" />
                    <stop offset="1" stopColor="#D4600A" />
                  </linearGradient>
                </defs>
                <path d="M20 50 L4 8 L36 8 Z" fill="url(#pointer)" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
            <canvas
              ref={canvasRef}
              width={620}
              height={620}
              className={`relative rounded-full w-full h-auto ${spinning ? 'animate-pulse' : ''}`}
              style={{
                border: '4px solid rgba(249,124,29,0.25)',
                boxShadow: '0 0 60px rgba(249,124,29,0.20), 0 0 0 1px rgba(249,124,29,0.30) inset',
                maxWidth: '100%',
              }}
            />
          </div>

          <button
            onClick={spin}
            disabled={spinning || list.length === 0}
            className="mt-8 sm:mt-10 btn-primary text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {spinning ? 'מסובב...' : 'התחל הגרלה'}
          </button>
        </div>
      </main>

      {showWinnerOverlay && winner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div
            className="glass max-w-2xl w-full p-10 text-center animate-scale-in"
            style={{
              border: '2px solid rgba(249,124,29,0.45)',
              boxShadow: '0 0 80px rgba(249,124,29,0.35), 0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="uppercase text-xs mb-3"
              style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3em' }}
            >
              The Winner Is
            </div>
            <h2
              className="text-6xl md:text-7xl font-semibold mb-4 headline-gradient-h"
              style={{
                letterSpacing: '-0.02em',
                filter: 'drop-shadow(0 0 40px rgba(249,124,29,0.45))',
              }}
            >
              {winner.fullName}
            </h2>
            <div className="text-2xl text-white">{winner.company}</div>
            <div className="mt-3 font-mono text-spotnet-orangeLight text-lg">{winner.ticketId}</div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button onClick={confirmWinner} className="btn-primary text-base">אשר זכייה</button>
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
