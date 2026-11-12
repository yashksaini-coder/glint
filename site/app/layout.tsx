import { Provider } from '@/components/provider';
import { basePath } from '@/lib/shared';
import './global.css';
import { DM_Sans, Geist_Mono, Inter, Newsreader } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const newsreader = Newsreader({ subsets: ['latin'], style: 'italic', variable: '--font-newsreader' });

export const metadata: Metadata = {
  title: { default: 'Glint Docs', template: '%s | Glint Docs' },
  description: 'Documentation for Glint: type and speak with your eyebrows and your breath, through a webcam.',
  icons: { icon: `${basePath}/icon.svg` },
  metadataBase: new URL('https://yashksaini-coder.github.io'),
  // The base path is not added to metadata URLs, so the image path carries it.
  openGraph: {
    type: 'website',
    siteName: 'Glint',
    title: 'Glint: type and speak with your eyebrows and your breath',
    description: 'A webcam switch-access keyboard. Runs on your computer. Open source.',
    url: `${basePath}/`,
    images: [{ url: `${basePath}/og.png`, width: 1200, height: 630, alt: 'Glint: type and speak with your eyebrows and your breath.' }],
  },
  twitter: { card: 'summary_large_image', images: [`${basePath}/og.png`] },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${geistMono.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
