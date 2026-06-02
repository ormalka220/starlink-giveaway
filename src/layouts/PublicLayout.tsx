import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import EventHeaderBar from '../components/EventHeaderBar';
import StarsBackground from '../components/StarsBackground';
import { RAFFLE_TERMS_PATH } from '../constants/raffleTerms';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full relative overflow-x-hidden">
      <StarsBackground />
      <EventHeaderBar />
      <main className="relative">{children}</main>
      <footer className="relative mt-24 py-10 border-t border-white/5">
        <div className="section-divider mb-8" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <div>© {new Date().getFullYear()} SpotNet</div>
          <div className="flex gap-5">
            <Link to={RAFFLE_TERMS_PATH} className="hover:text-white transition">תקנון ההגרלה</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
