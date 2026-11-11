import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Glint';
/** '/glint' on GitHub Pages. Next adds it to links, but not to raw paths like <img src> or fetch(). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const withBase = (text: string) => text.replaceAll('](/docs', `](${basePath}/docs`);
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'yashksaini-coder',
  repo: 'glint',
  branch: 'main',
};

export const links = {
  repo: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  releases: `https://github.com/${gitConfig.user}/${gitConfig.repo}/releases/latest`,
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: basePath + getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: basePath + getImageUrl(segments, page.locale) };
}
