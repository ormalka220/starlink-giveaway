import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { RAFFLE_TERMS_PATH } from '../constants/raffleTerms';
import type { InterestArea } from '../types';

const interests: InterestArea[] = ['Forti SASE', 'Perception Point', 'Starlink', 'פתרונות סייבר', 'אחר'];

export default function Raffle() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    fullName: '', company: '', role: '', phone: '', email: '',
    interest: 'Forti SASE' as InterestArea,
    interestOther: '',
    marketingConsent: true,
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function next() {
    if (!form.fullName || !form.company || !form.phone || !form.email) {
      push('יש למלא שם, חברה, טלפון ואימייל', 'error');
      return;
    }
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.marketingConsent) {
      push('יש לאשר את התקנון כדי להירשם', 'error');
      return;
    }
    if (form.interest === 'אחר' && !form.interestOther.trim()) {
      push('יש לפרט את תחום העניין', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const p = await api.registerParticipant({
        fullName: form.fullName,
        company: form.company,
        role: form.role,
        phone: form.phone,
        email: form.email,
        interest: form.interest,
        interestOther: form.interest === 'אחר' ? form.interestOther.trim() : '',
        marketingConsent: form.marketingConsent,
        isBusinessCustomer: true,
        source: 'fortinet_event',
      });
      navigate('/raffle/success', { state: { ticketId: p.ticketId, name: p.fullName, smsStatus: p.smsStatus } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'אירעה שגיאה. נסו שוב.';
      push(msg, 'error');
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <section className="px-6 md:px-12 pt-10 md:pt-16 pb-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-forti-mute mb-6">
              <span className="h-px w-10 bg-forti-red" />
              <span className="text-forti-red font-semibold">הגרלת אירוע · 2026</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight flex flex-wrap items-center gap-x-3 gap-y-2">
              ערכת <img src="/starlink-logo.png" alt="Starlink" className="h-10 md:h-14 w-auto object-contain" />
              <br />
              <span className="text-forti-mute font-light italic text-4xl md:text-6xl">מחכה למישהו אחד.</span>
            </h1>
            <p className="mt-7 text-forti-mute text-lg leading-relaxed max-w-lg">
              השאירו פרטים, קבלו מספר משתתף, ועלו על במת ההגרלה במהלך הכנס.
              <br />
              <span className="text-forti-ink/80">משתתף אחד יקבל ערכת Starlink מלאה.</span>
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-8 max-w-md">
              <div>
                <dt className="text-xs uppercase tracking-wider text-forti-mute">פרס</dt>
                <dd className="mt-1 text-2xl font-bold">Standard Kit</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-forti-mute">הגרלה</dt>
                <dd className="mt-1 text-2xl font-bold">חי, על במה</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-forti-mute">הרשמה</dt>
                <dd className="mt-1 text-2xl font-bold">60 שניות</dd>
              </div>
            </dl>

            <div className="mt-10 flex items-center gap-4">
              <a href="#register" className="btn-primary px-7 py-3.5 text-base">הירשמו עכשיו</a>
              <a href="#how" className="text-sm text-forti-mute hover:text-forti-ink transition underline-offset-4 hover:underline">איך זה עובד?</a>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="absolute -inset-6 bg-forti-red/10 blur-3xl rounded-full" />
            <div className="relative aspect-[5/4] rounded-3xl overflow-hidden bg-gradient-to-br from-[#F5F1EA] to-[#E2DBD0] shadow-2xl ring-1 ring-black/20">
              <img src="/starlink-kit.png" alt="Starlink Standard Kit" className="w-full h-full object-contain object-center scale-105" />
              <div className="absolute top-5 right-5 text-[10px] uppercase tracking-[0.25em] text-zinc-700/80 font-mono">
                STARLINK · STANDARD KIT
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                <div className="text-zinc-800">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">שווי משוער</div>
                  <div className="font-black text-2xl">~2,300 ₪</div>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-mono text-zinc-600/80">Gen 3</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="px-6 md:px-12 max-w-7xl mx-auto py-10 border-y border-white/5">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { n: '01', t: 'משאירים פרטים', d: 'שם, טלפון, אימייל ותחום עניין. שום דבר מיותר.' },
            { n: '02', t: 'מקבלים מספר משתתף', d: 'הקוד שלכם נשמר ומופיע על המסך בזמן ההגרלה.' },
            { n: '03', t: 'מחכים להכרזה', d: 'הזוכה נבחר חי על במת הכנס. נציג SpotNet יצור קשר.' },
          ].map((s) => (
            <div key={s.n}>
              <div className="font-mono text-xs text-forti-red mb-3">{s.n}</div>
              <div className="text-xl font-bold mb-1.5">{s.t}</div>
              <div className="text-sm text-forti-mute leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="register" className="px-6 md:px-12 py-16 max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.22em] text-forti-red mb-3">טופס הרשמה</div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">השאירו פרטים</h2>
          <p className="text-forti-mute mt-2 text-sm">המידע נשמר במערכת מאובטחת ולא יועבר לצדדים שלישיים.</p>
        </div>

        <div className="flex items-center gap-3 mb-8 text-xs">
          <span className={`flex items-center gap-2 ${step === 1 ? 'text-forti-ink' : 'text-forti-mute'}`}>
            <span className={`w-6 h-6 rounded-full grid place-items-center font-bold ${step === 1 ? 'bg-forti-red text-white' : 'bg-white/10'}`}>1</span>
            פרטים אישיים
          </span>
          <span className="flex-1 h-px bg-white/10" />
          <span className={`flex items-center gap-2 ${step === 2 ? 'text-forti-ink' : 'text-forti-mute'}`}>
            <span className={`w-6 h-6 rounded-full grid place-items-center font-bold ${step === 2 ? 'bg-forti-red text-white' : 'bg-white/10'}`}>2</span>
            תחום עניין
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="שם מלא" required>
                  <input className="input" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="ישראל ישראלי" />
                </Field>
                <Field label="חברה" required>
                  <input className="input" value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="שם החברה" />
                </Field>
                <Field label="תפקיד">
                  <input className="input" value={form.role} onChange={(e) => update('role', e.target.value)} placeholder="CISO / IT Manager" />
                </Field>
                <Field label="מספר טלפון" required>
                  <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="050-0000000" inputMode="tel" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="אימייל" required>
                    <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@company.com" />
                  </Field>
                </div>
              </div>
              <button type="button" onClick={next} className="btn-primary w-full py-4 text-base mt-2">
                המשך
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="label">תחום עניין</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {interests.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => update('interest', i)}
                      className={`px-3 py-3 rounded-xl border text-sm font-medium transition ${
                        (i === 'אחר' ? form.interest === 'אחר' : form.interest === i)
                          ? 'border-forti-red bg-forti-red/5 text-forti-ink'
                          : 'border-white/10 bg-transparent text-forti-mute hover:border-white/20'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                {form.interest === 'אחר' && (
                  <div className="mt-3">
                    <input
                      className="input"
                      value={form.interestOther}
                      onChange={(e) => update('interestOther', e.target.value)}
                      placeholder="פרטו את תחום העניין"
                      maxLength={50}
                    />
                    <div className="text-xs text-forti-mute mt-1.5 text-left">{form.interestOther.length} / 50</div>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none pt-2">
                <input type="checkbox" checked={form.marketingConsent} onChange={(e) => update('marketingConsent', e.target.checked)} className="mt-1 w-5 h-5 accent-forti-red" />
                <span className="text-sm text-forti-mute leading-relaxed">
                  אני מאשר/ת קבלת עדכונים והודעות בנוגע להגרלה ולפתרונות SpotNet.{' '}
                  <Link to={RAFFLE_TERMS_PATH} className="text-forti-accent hover:underline">
                    תקנון ההגרלה
                  </Link>
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost px-6">חזרה</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-4 text-base disabled:opacity-60">
                  {submitting ? 'שולח...' : 'הירשמו להגרלה'}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </PublicLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label flex items-center gap-1">
        {label} {required && <span className="text-forti-red">*</span>}
      </label>
      {children}
    </div>
  );
}
