import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GlintMark } from '@/components/logo';
import { appName, links } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      url: '/',
      title: (
        <>
          <GlintMark />
          <span className="font-heading font-semibold">{appName}</span>
          <span className="g-tag">Docs</span>
        </>
      ),
    },
    githubUrl: links.repo,
  };
}
