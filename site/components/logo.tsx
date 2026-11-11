// The Glint mark: the two shapes of build/icon.svg (a raised eyebrow over a glint), without the tile.
export function GlintGlyph({ arcClassName, starClassName }: { arcClassName?: string; starClassName?: string }) {
  return (
    <>
      <path className={arcClassName} d="M128 214 Q256 96 384 214" fill="none" stroke="var(--g-iso-accent)" strokeWidth="40" strokeLinecap="round" />
      <path className={starClassName} d="M256 236 C263 300 276 313 340 320 C276 327 263 340 256 404 C249 340 236 327 172 320 C236 313 249 300 256 236 Z" fill="var(--g-iso-lit)" />
    </>
  );
}

export function GlintMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="100 111 312 312" width={size} height={size} className={className} aria-hidden>
      <GlintGlyph />
    </svg>
  );
}
