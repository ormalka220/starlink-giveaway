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
      <section className="relative px-4 sm:px-6 md:px-12 pt-10 sm:pt-14 md:pt-20 pb-12 sm:pb-16 max-w-7xl mx-auto overflow-hidden">
        <div className="ambient-orange" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-10 sm:gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 animate-fade-in">
            <span className="trust-badge mb-5 sm:mb-6 text-base sm:text-lg md:text-xl px-6 py-3 sm:px-7 sm:py-3.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              ההרשמה פתוחה
            </span>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-semibold leading-[1.08] flex flex-wrap items-center gap-x-3 gap-y-2"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span className="headline-gradient">ערכת</span>
              <img src="/starlink-logo.png" alt="Starlink" className="h-8 sm:h-10 md:h-14 w-auto object-contain" />
              <br />
              <span
                className="font-light italic text-3xl sm:text-4xl md:text-6xl"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                מחכה למישהו אחד.
              </span>
            </h1>
            <p className="mt-6 sm:mt-7 text-base sm:text-lg leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.65)' }}>
              מלאו את הפרטים שלכם, קבלו מספר משתתף ב-SMS.
              <br />
              <span className="text-white/85">ותיכנסו להגרלה הגדולה בה משתתף יזכה בערכת Starlink Standard.</span>
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href="#register" className="btn-primary text-base w-full sm:w-auto justify-center">הירשמו עכשיו</a>
              <a href="#how" className="btn-ghost text-sm w-full sm:w-auto justify-center">איך זה עובד?</a>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative animate-fade-in">
            {/* soft orange glow behind product */}
            <div
              className="absolute inset-0 m-auto rounded-full pointer-events-none"
              style={{
                width: '85%',
                height: '85%',
                background: 'radial-gradient(circle at 50% 55%, rgba(249,124,29,0.28) 0%, rgba(249,124,29,0.12) 30%, transparent 65%)',
                filter: 'blur(50px)',
              }}
            />
            {/* faint orbital ring */}
            <div
              className="absolute inset-0 m-auto rounded-full pointer-events-none"
              style={{
                width: '92%',
                aspectRatio: '1 / 1',
                border: '1px dashed rgba(249,124,29,0.10)',
              }}
            />

            <div className="relative aspect-[5/4] flex items-center justify-center">
              {/* floating top-right chip */}
              <span
                className="absolute top-2 right-2 sm:top-3 sm:right-3 chip text-[10px] font-mono z-10"
                style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
              >
                Starlink · Standard Kit
              </span>

              <img
                src="/%E2%82%AAGiveaway.png"
                alt="Starlink Standard Kit"
                className="relative w-full h-full object-contain object-center"
                style={{ filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.55)) drop-shadow(0 0 40px rgba(249,124,29,0.18))' }}
              />

              {/* floating bottom info */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end px-1 z-10">
                <div className="glass-2 px-3 py-2 flex items-center gap-2">
                  <div className="label mb-0">שווי הזכיה</div>
                  <span className="text-sm sm:text-base font-semibold text-spotnet-orangeLight" style={{ letterSpacing: '0.02em' }}>
                    ₪1,500
                  </span>
                </div>
                <div
                  className="chip text-[10px] font-mono"
                  style={{ letterSpacing: '0.25em', textTransform: 'uppercase' }}
                >
                  Gen 3
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="relative px-4 sm:px-6 md:px-12 max-w-7xl mx-auto py-12 sm:py-16">
        <div className="section-divider mb-8 sm:mb-12" />
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-2xl sm:text-3xl md:text-5xl font-semibold headline-gradient-h"
            style={{ letterSpacing: '-0.02em' }}
          >
            איך זה עובד
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {[
            { n: '01', t: 'משאירים פרטים', d: 'שם, טלפון, אימייל ותחום עניין. שום דבר מיותר.' },
            { n: '02', t: 'מקבלים מספר משתתף', d: 'הקוד שלכם נשמר ומופיע על המסך בזמן ההגרלה.' },
            { n: '03', t: 'מחכים להכרזה', d: 'הזוכה נבחר חי על במת הכנס. נציג SpotNet יצור קשר.' },
          ].map((s) => (
            <div key={s.n} className="glass-feature">
              <div
                className="w-12 h-12 rounded-xl grid place-items-center mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span className="font-mono text-sm text-spotnet-orange">{s.n}</span>
              </div>
              <div className="text-xl font-semibold text-white mb-2">{s.t}</div>
              <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="register" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-20 max-w-3xl mx-auto">
        <div className="ambient-orange" style={{ top: '0', left: '50%', transform: 'translateX(-50%)', opacity: 0.6 }} />
        <div className="relative glass p-5 sm:p-8 md:p-10 animate-fade-in">
          <div className="mb-6 sm:mb-8 text-center">
            <span className="trust-badge mb-4">טופס הרשמה</span>
            <h2
              className="text-2xl sm:text-3xl md:text-5xl font-semibold headline-gradient-h"
              style={{ letterSpacing: '-0.02em' }}
            >
              השאירו פרטים
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              המידע נשמר במערכת מאובטחת ולא יועבר לצדדים שלישיים.
            </p>
          </div>

          <div className="flex items-center gap-3 mb-8 text-xs">
            <span className={`flex items-center gap-2 ${step === 1 ? 'text-white' : ''}`} style={step !== 1 ? { color: 'rgba(255,255,255,0.50)' } : undefined}>
              <span
                className="w-7 h-7 rounded-full grid place-items-center font-semibold text-white"
                style={
                  step === 1
                    ? { background: 'linear-gradient(135deg, #FFA04D 0%, #F97C1D 40%, #D4600A 100%)', boxShadow: '0 0 18px rgba(249,124,29,0.45)' }
                    : { background: 'rgba(255,255,255,0.08)' }
                }
              >1</span>
              פרטים אישיים
            </span>
            <span className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />
            <span className={`flex items-center gap-2 ${step === 2 ? 'text-white' : ''}`} style={step !== 2 ? { color: 'rgba(255,255,255,0.50)' } : undefined}>
              <span
                className="w-7 h-7 rounded-full grid place-items-center font-semibold text-white"
                style={
                  step === 2
                    ? { background: 'linear-gradient(135deg, #FFA04D 0%, #F97C1D 40%, #D4600A 100%)', boxShadow: '0 0 18px rgba(249,124,29,0.45)' }
                    : { background: 'rgba(255,255,255,0.08)' }
                }
              >2</span>
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
                      className={`px-3 py-3 rounded-full border text-sm font-medium transition ${
                        (i === 'אחר' ? form.interest === 'אחר' : form.interest === i)
                          ? 'border-spotnet-orange/60 bg-spotnet-orange/10 text-white shadow-glowSoft'
                          : 'border-white/10 bg-transparent text-white/55 hover:border-spotnet-orange/30 hover:text-white'
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
                    <div className="text-xs mt-1.5 text-left" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {form.interestOther.length} / 50
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none pt-2">
                <input type="checkbox" checked={form.marketingConsent} onChange={(e) => update('marketingConsent', e.target.checked)} className="mt-1 w-5 h-5" />
                <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  אני מאשר/ת קבלת עדכונים והודעות בנוגע להגרלה ולפתרונות SpotNet.{' '}
                  <Link to={RAFFLE_TERMS_PATH} className="text-spotnet-orangeLight hover:underline">
                    תקנון ההגרלה
                  </Link>
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost">חזרה</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 text-base">
                  {submitting ? 'שולח...' : 'הירשמו להגרלה'}
                </button>
              </div>
            </div>
          )}
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label flex items-center gap-1">
        {label} {required && <span className="text-spotnet-orange">*</span>}
      </label>
      {children}
    </div>
  );
}
