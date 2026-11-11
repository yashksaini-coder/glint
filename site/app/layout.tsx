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
