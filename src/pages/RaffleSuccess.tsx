import { Link, useLocation } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

export default function RaffleSuccess() {
  const { state } = useLocation() as { state?: { ticketId?: string; name?: string } };
  const ticketId = state?.ticketId ?? 'FT-0000';

  return (
    <PublicLayout>
      <section className="px-6 py-16 max-w-2xl mx-auto text-center animate-fade-in">
        <div className="glass p-10">
          <div className="mx-auto w-20 h-20 rounded-full grid place-items-center bg-forti-green/15 border border-forti-green/40 mb-6">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-forti-green" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">נרשמת בהצלחה להגרלה</h1>
          <p className="mt-3 text-forti-mute">מספר המשתתף שלך נשמר במערכת. ההגרלה תתקיים במהלך הכנס.</p>

          <div className="mt-8 glass-2 p-6 inline-block">
            <div className="text-xs text-forti-mute mb-1">מספר הרשמה</div>
            <div className="text-4xl font-extrabold tracking-widest text-forti-accent font-mono">{ticketId}</div>
          </div>

          <div className="mt-8">
            <Link to="/" className="btn-ghost">חזרה לדף הכנס</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
