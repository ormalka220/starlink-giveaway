import type { ReactNode } from 'react';
import EventHeaderBar from '../components/EventHeaderBar';
import { RAFFLE_TERMS_URL } from '../constants/raffleTerms';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full relative">
      <EventHeaderBar
        trailing={
          <div className="hidden md:flex items-center gap-2 text-xs text-forti-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ההרשמה פתוחה
          </div>
        }
      />
      <main className="relative">{children}</main>
      <footer className="relative mt-24 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-wrap items-center justify-between gap-3 text-xs text-forti-mute">
          <div>© {new Date().getFullYear()} SpotNet · בשיתוף Fortinet</div>
          <div className="flex gap-5">
            <a href={RAFFLE_TERMS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-forti-ink transition">תקנון ההגרלה</a>
            <a href="#" className="hover:text-forti-ink transition">פרטיות</a>
            <a href="#" className="hover:text-forti-ink transition">יצירת קשר</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
