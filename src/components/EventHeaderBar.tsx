import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type EventHeaderBarProps = {
  trailing?: ReactNode;
  className?: string;
};

export default function EventHeaderBar({ trailing, className = '' }: EventHeaderBarProps) {
  return (
    <header
      dir="ltr"
      className={`sticky top-0 z-30 w-full px-3 sm:px-6 md:px-12 py-3 md:py-4 backdrop-blur-2xl ${className}`}
      style={{
        background: 'rgba(0,0,0,0.55)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative flex items-center justify-center">
        <Link to="/" className="shrink-0">
          <img
            src="/Security%20Day%20new.png"
            alt="Fortinet Security Day · SpotNet"
            className="h-20 sm:h-24 md:h-28 w-auto max-w-full object-contain opacity-95"
          />
        </Link>

        {trailing && (
          <div className="hidden md:flex items-center absolute right-0 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>
    </header>
  );
}
