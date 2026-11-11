import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, links } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      url: '/',
      title: (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={22} height={22} />
          <span className="font-heading font-semibold">{appName}</span>
          <span className="g-tag">Docs</span>
        </>
      ),
    },
    githubUrl: links.repo,
  };
}
