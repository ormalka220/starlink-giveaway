export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid place-items-center rounded-xl shadow-glow"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #FFA04D 0%, #F97C1D 40%, #D4600A 100%)',
        }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l3-7 4 14 3-7h4" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight">Forti Starlink</div>
        <div className="text-[11px] text-forti-mute">by SpotNet</div>
      </div>
    </div>
  );
}
