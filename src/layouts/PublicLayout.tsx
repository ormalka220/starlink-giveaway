import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full relative">
      <header className="relative z-20 px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/5">
        <Link to="/" className="flex items-center gap-4">
          <img src="/spotnet-logo.png" alt="SpotNet" className="h-9 md:h-10 object-contain" />
          <span className="hidden md:inline-block h-7 w-px bg-white/15" />
          <span className="hidden md:flex items-center gap-2 text-sm tracking-[0.18em] uppercase text-forti-mute">
            <span className="inline-flex items-center rounded-md bg-white/95 px-2 py-1">
              <img src="/Fortinet-Logo.wine.svg" alt="Fortinet" className="h-6 md:h-7 w-auto object-contain" />
            </span>
            <span className="text-forti-mute/60">·</span>
            <span>Event 2026</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-2 text-xs text-forti-mute">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ההרשמה פתוחה
        </div>
      </header>
      <main className="relative">{children}</main>
      <footer className="relative mt-24 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-wrap items-center justify-between gap-3 text-xs text-forti-mute">
          <div>© {new Date().getFullYear()} SpotNet · בשיתוף Fortinet</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-forti-ink transition">תקנון ההגרלה</a>
            <a href="#" className="hover:text-forti-ink transition">פרטיות</a>
            <a href="#" className="hover:text-forti-ink transition">יצירת קשר</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
