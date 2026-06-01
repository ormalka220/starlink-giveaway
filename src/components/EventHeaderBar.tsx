import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const SPOTNET_LOGO_CLASS = 'h-9 md:h-10 w-auto object-contain';

type EventHeaderBarProps = {
  trailing?: ReactNode;
  className?: string;
};

export default function EventHeaderBar({ trailing, className = '' }: EventHeaderBarProps) {
  return (
    <header
      dir="ltr"
      className={`relative z-20 px-6 md:px-12 py-6 flex items-center justify-between gap-4 border-b border-white/5 ${className}`}
    >
      <img src="/Fortinet.png" alt="Fortinet" className="h-15 md:h-16 w-auto object-contain shrink-0" />

      <span className="flex-1 text-center text-xs sm:text-sm md:text-base tracking-[0.14em] uppercase text-forti-mute font-semibold px-2 truncate">
        Security Day Event
      </span>

      <div className="flex items-center gap-3 shrink-0">
        <Link to="/" className="shrink-0">
          <img src="/spotnet-logo.png" alt="SpotNet" className={SPOTNET_LOGO_CLASS} />
        </Link>
        {trailing}
      </div>
    </header>
  );
}
