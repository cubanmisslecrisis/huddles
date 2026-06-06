// Wordmark + petal mark, ported from the skeleton (pure SVG, no assets).
export function HuddlesLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="font-heading text-3xl font-black tracking-tight text-foreground">Huddles</span>
      <span aria-hidden className="relative -mt-3 inline-block h-5 w-5">
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <g fill="var(--color-pink)">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse key={deg} cx="12" cy="6" rx="3.4" ry="5" transform={`rotate(${deg} 12 12)`} />
            ))}
          </g>
          <circle cx="12" cy="12" r="2.6" fill="var(--color-yellow)" />
        </svg>
      </span>
    </div>
  );
}
