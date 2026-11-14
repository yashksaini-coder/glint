// Not a real page: the source for the share images (scripts/og-images.cjs captures it).
// Two cards, one per destination size. The stack is the hero's still frame (captured under reduced motion).
import type { Metadata } from 'next';
import { GlintMark } from '@/components/logo';
import { StackScene } from '@/components/home/stack-scene';

export const metadata: Metadata = { title: 'Share card', robots: { index: false, follow: false } };

function Card({ id, w, h, url, compact }: { id: string; w: number; h: number; url: string; compact?: boolean }) {
  return (
    <section id={id} className="og-card dark" data-compact={compact || undefined} style={{ width: w, height: h }}>
      <div className="og-grid" aria-hidden />
      <div className="og-copy">
        <div className="og-brand">
          <GlintMark size={56} />
          <span>Glint</span>
        </div>
        <h1>
          Type and speak with your <em>eyebrows</em> and your breath.
        </h1>
        <p>A webcam switch-access keyboard. Runs on your computer. Open source.</p>
        <div className="og-foot">
          <span className="og-chip">SmartSpectra SDK</span>
          <span className="og-url">{url}</span>
        </div>
      </div>
      <div className="og-art">
        <StackScene />
      </div>
    </section>
  );
}

export default function ShareCard() {
  return (
    <main className="og-sheet">
      <Card id="docs" w={1200} h={630} url="yashksaini-coder.github.io/glint" />
      <Card id="repo" w={1280} h={640} url="github.com/yashksaini-coder/glint" />
      <Card id="cover" w={1000} h={420} url="yashksaini-coder.github.io/glint" compact />
    </main>
  );
}
