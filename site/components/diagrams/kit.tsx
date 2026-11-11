// Shared by every docs figure. Figures are inline SVG, themed only through the CSS variables in
// app/diagrams.css, so they follow light and dark mode with no JavaScript.
import type { ReactNode } from 'react';

export function Figure({ caption, children, wide }: { caption?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <figure className="gd-figure not-prose" data-wide={wide || undefined}>
      {/* focusable so keyboard users can scroll a figure that is wider than a phone */}
      <div className="gd-canvas" tabIndex={0} role="region" aria-label="Figure">{children}</div>
      {caption && <figcaption className="gd-caption">{caption}</figcaption>}
    </figure>
  );
}
