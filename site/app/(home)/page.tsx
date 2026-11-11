import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { TopCells } from '@/components/docs/topbar';
import { StackScene } from '@/components/home/stack-scene';
import { StartTabs } from '@/components/home/start-tabs';
import { GlintMark } from '@/components/logo';
import { links } from '@/lib/shared';

const features = [
  { t: 'Eyebrow select.', d: 'Raise your eyebrows when the item you want is lit. Relax, and go again.', chips: ['landmarks', 'baseline', 'hold'], href: '/docs/concepts/eyebrow-detector' },
  { t: 'Breath to speak.', d: 'A slow breath out reads your sentence aloud and copies it.', chips: ['chest trace', 'slope', 'talking'], href: '/docs/concepts/exhale-detector' },
  { t: 'Scanning board.', d: 'The highlight moves by itself. You only choose when, never where.', chips: ['rows', 'keys', 'grace'], href: '/docs/concepts/scanning' },
  { t: 'Quick phrases.', d: '“I need water”, in two selections. A carer can edit all six.', chips: ['editable', 'instant'], href: '/docs/use/settings' },
  { t: 'Consent first.', d: 'The camera starts only after you agree. Metrics are computed on your computer; the SDK goes online only for its key and models, plus telemetry if you turn it on.', chips: ['on-device', 'telemetry off'], href: '/docs/privacy' },
  { t: 'Measured, not assumed.', d: 'The plan was blinks. A recorded session said no, so the design changed.', chips: ['ground truth', 'honest numbers'], href: '/docs/concepts/why-eyebrows' },
];
const builtOn = ['SmartSpectra SDK', 'Electron', 'TypeScript', 'esbuild', 'Web Speech', 'espeak-ng'];

const SectionTitle = ({ text }: { text: string }) => <h2 className="g-rule">{text}</h2>;

export default function Landing() {
  return (
    <main className="g-split">
      <section className="relative flex flex-col overflow-hidden border-b lg:sticky lg:top-0 lg:h-screen lg:border-e lg:border-b-0">
        <div className="g-hero-bg absolute inset-0" aria-hidden />
        <header className="relative flex h-11 shrink-0 items-center gap-2.5 border-b px-4">
          <GlintMark />
          <span className="g-caps text-fd-foreground">Glint</span>
        </header>
        <div className="relative min-h-0 flex-1 px-4 py-3 max-lg:h-[min(34rem,92vw)] max-lg:flex-none">
          <StackScene />
        </div>
        <div className="relative px-7 pt-6 pb-8">
          <p className="mb-5 inline-flex items-center gap-2 border bg-fd-background/60 px-3 py-1.5 text-[0.8125rem] text-fd-muted-foreground">
            <span className="size-1.5 bg-g-gold" />
            Version 0.1 · not yet tested with users
          </p>
          <h1 className="font-heading text-4xl leading-[1.1] font-medium tracking-tight md:text-5xl">
            Type with your <span className="g-serif g-accent">eyebrows</span>
          </h1>
          <div className="g-hero-actions">
            <Link href="/docs" className="g-btn g-btn-solid">
              Read the docs <ArrowRight className="size-4" />
            </Link>
            <a href={links.releases} className="g-btn">
              Download <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
        <footer className="g-mono-sm relative hidden shrink-0 items-center justify-between border-t px-7 py-3 text-fd-muted-foreground lg:flex">
          <span className="g-foot-links">
            <Link href="/docs/concepts/architecture" className="g-foot-link">Architecture</Link>
            <Link href="/docs/scope" className="g-foot-link">Scope</Link>
            <Link href="/docs/privacy" className="g-foot-link">Privacy</Link>
          </span>
          <span>MIT</span>
        </footer>
      </section>

      <div className="g-split-doc">
        <div className="sticky top-0 z-20 h-11 border-b bg-fd-background">
          <TopCells className="h-full" />
        </div>
        <div className="mx-auto max-w-4xl px-6 pt-8 pb-20 md:px-8">
          <SectionTitle text="README" />
          <p className="g-lede">
            A switch-access keyboard for people who cannot reliably use their hands or voice. A highlight moves across the board;
            you <strong className="font-medium text-fd-foreground">raise your eyebrows</strong> to pick what is lit and{' '}
            <strong className="font-medium text-fd-foreground">breathe out slowly</strong> to say it aloud. All it needs is a webcam.
          </p>
          <div className="mt-7"><StartTabs /></div>

          <div className="mt-10">
            <p className="g-caps mb-3 text-end text-fd-muted-foreground">Built on</p>
            <div className="flex flex-wrap justify-between gap-x-8 gap-y-2 border-y py-3">
              {builtOn.map((b) => <span key={b} className="text-[0.9375rem] font-medium text-fd-muted-foreground">{b}</span>)}
            </div>
          </div>

          <div className="mt-12">
            <SectionTitle text="Features" />
            <div className="g-feature-grid">
              {features.map((feature, index) => (
                <Link key={feature.t} href={feature.href} className="g-feature">
                  <span className="g-mono-sm text-fd-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="font-heading mt-4 text-[1.0625rem] font-medium">{feature.t}</h3>
                  <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-fd-muted-foreground">{feature.d}</p>
                  <span className="mt-5 flex flex-wrap gap-1.5">
                    {feature.chips.map((c) => <span key={c} className="g-chip">{c}</span>)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
