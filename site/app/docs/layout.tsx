import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { DocsTopbar } from '@/components/docs/topbar';
import { RailItem, RailSeparator, StatusBlock } from '@/components/docs/sidebar';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      slots={{ header: DocsTopbar }}
      sidebar={{
        collapsible: false,
        banner: <StatusBlock />,
        components: { Item: RailItem, Separator: RailSeparator },
      }}
    >
      {children}
    </DocsLayout>
  );
}
