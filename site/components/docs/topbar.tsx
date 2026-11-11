'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu } from 'lucide-react';
import { useDocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { links } from '@/lib/shared';

const isReference = (p: string) => p.startsWith('/docs/reference');
const cells = [
  { label: 'Home', href: '/', on: (p: string) => p === '/' },
  { label: 'Docs', href: '/docs', on: (p: string) => p.startsWith('/docs') && !isReference(p) },
  { label: 'Reference', href: '/docs/reference/detector-options', on: isReference },
  { label: 'GitHub', href: links.repo, on: () => false, external: true },
];

/** The row of equal cells along the top, shared by the docs and the landing page. */
export function TopCells({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('g-cells', className)} aria-label="Primary">
      {cells.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="g-cell"
          data-on={c.on(pathname)}
          {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {c.label}
          {c.external && <ArrowUpRight className="size-3" aria-hidden />}
        </Link>
      ))}
      <a href={links.releases} className="g-cell g-cell-cta" target="_blank" rel="noreferrer">
        Download
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>
    </nav>
  );
}

export function DocsTopbar(props: ComponentProps<'header'>) {
  const { slots } = useDocsLayout();
  return (
    <header
      {...props}
      id="nd-subnav"
      className="sticky top-(--fd-docs-row-1) z-30 flex h-(--fd-header-height) items-stretch border-b bg-fd-background layout:[--fd-header-height:--spacing(11)]"
      // contain: the strip's own width must not widen the grid tracks it spans.
      style={{ gridColumn: '3 / -1', gridRow: 1, contain: 'inline-size' }}
    >
      <TopCells className="min-w-0 flex-1" />
      {slots.sidebar && (
        <slots.sidebar.trigger className="flex w-11 shrink-0 items-center justify-center border-s md:hidden" aria-label="Open menu">
          <Menu className="size-4" />
        </slots.sidebar.trigger>
      )}
    </header>
  );
}
