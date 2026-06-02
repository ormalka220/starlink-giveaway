import { Link, useLocation } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import type { SmsStatus } from '../types';

export default function RaffleSuccess() {
  const { state } = useLocation() as { state?: { ticketId?: string; name?: string; smsStatus?: SmsStatus } };
  const ticketId = state?.ticketId ?? 'SPT-0000';
  const smsStatus = state?.smsStatus;

  return (
    <PublicLayout>
      <section className="relative px-6 py-20 max-w-2xl mx-auto text-center animate-fade-in">
        <div className="ambient-orange" style={{ top: '0', left: '50%', transform: 'translateX(-50%)', opacity: 0.7 }} />
        <div className="relative glass p-10 md:p-12">
          <div
            className="mx-auto w-20 h-20 rounded-full grid place-items-center mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.06))',
              border: '1px solid rgba(34,197,94,0.40)',
              boxShadow: '0 0 30px rgba(34,197,94,0.20)',
            }}
          >
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1
            className="text-3xl md:text-4xl font-semibold headline-gradient-h"
            style={{ letterSpacing: '-0.02em' }}
          >
            נרשמת בהצלחה להגרלה
          </h1>
          <p className="mt-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
            מספר המשתתף שלך נשמר במערכת. ההגרלה תתקיים במהלך הכנס.
          </p>
          {smsStatus === 'נשלח' && (
            <p className="mt-2 text-sm text-spotnet-orangeLight">מספר ההרשמה נשלח אליך גם ב-SMS.</p>
          )}

          <div
            className="mt-8 inline-block rounded-2xl px-8 py-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(249,124,29,0.25)',
              boxShadow: '0 0 40px rgba(249,124,29,0.10)',
            }}
          >
            <div className="label mb-2">מספר הרשמה</div>
            <div className="text-4xl font-semibold tracking-widest font-mono text-spotnet-orangeLight">{ticketId}</div>
          </div>

          <div className="mt-10">
            <Link to="/" className="btn-ghost">חזרה לדף הכנס</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
