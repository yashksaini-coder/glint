import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { generateOGImage } from 'fumadocs-ui/og';
import { getPageImageUrl } from '@/lib/shared';

export const revalidate = false;

// The real mark (build/icon.svg's two shapes). Inline colours: the image renderer has no CSS variables.
const mark = (
  <svg viewBox="100 111 312 312" width="72" height="72">
    <path d="M128 214 Q256 96 384 214" fill="none" stroke="#7fd1ff" strokeWidth="40" strokeLinecap="round" />
    <path d="M256 236 C263 300 276 313 340 320 C276 327 263 340 256 404 C249 340 236 327 172 320 C236 313 249 300 256 236 Z" fill="#ffd166" />
  </svg>
);

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return generateOGImage({
    title: page.data.title,
    description: page.data.description,
    site: 'Glint Docs',
    icon: mark,
    primaryColor: 'rgba(127, 209, 255, 0.28)',
    primaryTextColor: '#7fd1ff',
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImageUrl(page).segments,
  }));
}
