import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/Brand';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: '◧' },
  { to: '/admin/participants', label: 'משתתפים', icon: '◉' },
  { to: '/admin/messages', label: 'שליחת הודעות', icon: '✉' },
  { to: '/draw', label: 'הגרלה', icon: '◎' },
  { to: '/admin/winners', label: 'זוכים', icon: '★' },
  { to: '/admin/settings', label: 'הגדרות', icon: '⚙' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-full flex">
      <aside className="w-64 shrink-0 border-l border-forti-line bg-forti-panel/70 backdrop-blur-xl sticky top-0 h-screen flex flex-col">
        <div className="p-5 border-b border-forti-line">
          <BrandMark />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                  isActive ? 'bg-forti-red/15 text-forti-ink border border-forti-red/40' : 'text-forti-mute hover:bg-forti-panel2 hover:text-forti-ink border border-transparent'
                }`
              }
            >
              <span className="text-forti-accent text-lg w-5 text-center">{n.icon}</span>
              <span className="font-medium">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-forti-line">
          <button onClick={() => { localStorage.removeItem('auth'); navigate('/login'); }} className="btn-ghost w-full justify-center">התנתקות</button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-forti-dark/80 backdrop-blur-xl border-b border-forti-line px-8 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-forti-mute">אירוע פעיל</div>
            <div className="font-bold">Fortinet Starlink Giveaway</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="chip border-forti-green/40 text-forti-green"><span className="w-1.5 h-1.5 bg-forti-green rounded-full animate-pulse" /> ההרשמה פתוחה</span>
            <div className="w-9 h-9 grid place-items-center rounded-full bg-forti-panel2 border border-forti-line text-sm">SN</div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
