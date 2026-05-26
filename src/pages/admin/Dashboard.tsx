import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import type { Participant, SmsMessage, Winner } from '../../types';

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="stat-card">
      <div className="text-xs text-forti-mute">{label}</div>
      <div className={`text-3xl font-extrabold mt-2 ${accent ?? ''}`}>{value}</div>
      {sub && <div className="text-xs text-forti-mute mt-1">{sub}</div>}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5"><span className="text-forti-mute">{label}</span><span className="font-mono">{value}</span></div>
      <div className="h-2 rounded-full bg-forti-panel2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sms, setSms] = useState<SmsMessage[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    api.listParticipants().then(setParticipants);
    api.listSms().then(setSms);
    api.listWinners().then(setWinners);
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayCount = participants.filter((p) => new Date(p.registeredAt).toDateString() === today).length;
    const consent = participants.length ? Math.round((participants.filter((p) => p.marketingConsent).length / participants.length) * 100) : 0;
    return {
      total: participants.length,
      today: todayCount,
      sms: sms.reduce((a, s) => a + s.recipientsCount, 0),
      consent,
      winners: winners.length,
    };
  }, [participants, sms, winners]);

  const byInterest = useMemo(() => {
    const m = new Map<string, number>();
    participants.forEach((p) => m.set(p.interest, (m.get(p.interest) ?? 0) + 1));
    return [...m.entries()];
  }, [participants]);

  const max = Math.max(1, ...byInterest.map((x) => x[1]));

  const hourly = useMemo(() => {
    const buckets = new Array(12).fill(0);
    const now = Date.now();
    participants.forEach((p) => {
      const diff = Math.floor((now - new Date(p.registeredAt).getTime()) / (5 * 60_000));
      if (diff >= 0 && diff < 12) buckets[11 - diff]++;
    });
    return buckets;
  }, [participants]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">סקירה כללית</h1>
            <p className="text-sm text-forti-mute">מצב ההגרלה בזמן אמת</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost">סגור הרשמה</button>
            <button className="btn-primary">פתח הגרלה</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Stat label="סך נרשמים" value={stats.total} sub="מאז פתיחת ההרשמה" />
          <Stat label="נרשמים היום" value={stats.today} sub="24 שעות אחרונות" accent="text-forti-accent" />
          <Stat label="SMS שנשלחו" value={stats.sms} />
          <Stat label="אישור דיוור" value={`${stats.consent}%`} accent="text-forti-green" />
          <Stat label="זוכים שנבחרו" value={stats.winners} accent="text-forti-red" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">הרשמות לפי שעה</h3>
              <span className="chip text-forti-accent border-forti-accent/40">חי</span>
            </div>
            <div className="h-48 flex items-end gap-2">
              {hourly.map((v, i) => {
                const h = Math.max(8, (v / Math.max(...hourly, 1)) * 100);
                return (
                  <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-forti-red/30 to-forti-accent/50 border border-forti-accent/30 relative group"
                       style={{ height: `${h}%` }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition">{v}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass p-6">
            <h3 className="card-title mb-4">תחומי עניין</h3>
            <div className="space-y-3">
              {byInterest.map(([k, v], i) => (
                <Bar key={k} label={k} value={v} max={max} color={['#EE3124', '#22D3EE', '#22C55E', '#A855F7', '#F59E0B'][i % 5]} />
              ))}
            </div>
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="card-title mb-4">פילוח לפי חברה</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(
              participants.reduce<Record<string, number>>((acc, p) => {
                acc[p.company] = (acc[p.company] ?? 0) + 1;
                return acc;
              }, {})
            ).slice(0, 12).map(([k, v]) => (
              <div key={k} className="glass-2 px-4 py-3 flex justify-between">
                <span className="truncate text-sm">{k}</span>
                <span className="font-bold text-forti-accent">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
