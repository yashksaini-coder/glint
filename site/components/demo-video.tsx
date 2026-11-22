import { basePath } from '@/lib/shared';

// The demo film. A plain <video> needs the Pages base path added by hand (Next only prefixes links).
export function DemoVideo({ caption = true }: { caption?: boolean }) {
  return (
    <figure className="g-demo not-prose">
      <video
        controls
        preload="metadata"
        playsInline
        poster={`${basePath}/media/glint-demo-poster.jpg`}
        src={`${basePath}/media/glint-demo.mp4`}
        aria-label="Glint demo, 88 seconds: live on a real webcam, eyebrow raises select phrases and letters, and Glint speaks them aloud."
      />
      {caption && (
        <figcaption>
          Live on a real webcam: eyebrow raises pick “I need water”, “I need help” and “Thank you”, and Glint says them aloud.
          Typing is shown at 2× speed. Breath-to-speak is shown as a diagram, because it was tested on a recorded session.
        </figcaption>
      )}
    </figure>
  );
}
