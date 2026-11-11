'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { SidebarItem, SidebarSeparator } from 'fumadocs-ui/components/sidebar/base';

/** Says the most important thing about the project on every page. */
export function StatusBlock() {
  return (
    <Link href="/docs/scope" className="g-status group">
      <div>
        <strong className="g-status-title">Version 0.1</strong>
        <small className="g-status-note">Not yet tested with users</small>
      </div>
      <ShieldAlert className="size-4 text-fd-muted-foreground transition group-hover:text-fd-foreground" aria-hidden />
    </Link>
  );
}

export function RailItem({ item }: { item: PageTree.Item }) {
  const pathname = usePathname();
  return (
    <SidebarItem href={item.url} external={item.external} active={pathname === item.url || pathname === `${item.url}/`} icon={item.icon} className="g-rail-row">
      {item.name}
    </SidebarItem>
  );
}

export function RailSeparator({ item }: { item: PageTree.Separator }) {
  return (
    <SidebarSeparator className="g-rail-label">
      <span>{item.name}</span>
    </SidebarSeparator>
  );
}
