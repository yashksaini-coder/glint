// "Send" key: a share link that opens WhatsApp, Telegram or the mail app with the text filled in.
// The user still presses Send there. Pure, so main can build and check the URL itself.
import { cleanRecipient, type Settings } from './settings.ts';

export const MAX_SEND_LEN = 1000;
export const SEND_NAMES = { whatsapp: 'WhatsApp', telegram: 'Telegram', email: 'Email' } as const;
// Telegram's share link documents url as the thing being shared, so it is never left empty.
export const DOCS_URL = 'https://yashksaini-coder.github.io/glint/';
// Main refuses to open anything that does not start with one of these.
export const SEND_PREFIXES = ['https://wa.me/', 'https://t.me/share/url?', 'mailto:'];

export function buildSendUrl(s: Pick<Settings, 'sendTarget' | 'sendTo'>, text: string): string | null {
  // By code point, and lone surrogates replaced: encodeURIComponent throws on half an emoji.
  const t = Array.from(String(text ?? '').trim().replace(/\p{Cs}/gu, '\uFFFD')).slice(0, MAX_SEND_LEN).join('');
  if (!t) return null;
  const enc = encodeURIComponent(t);
  const to = cleanRecipient(s.sendTarget, s.sendTo); // re-checked here: the builder never trusts its input
  switch (s.sendTarget) {
    case 'whatsapp': return `https://wa.me/${to}?text=${enc}`;
    case 'telegram': return `https://t.me/share/url?url=${encodeURIComponent(DOCS_URL)}&text=${enc}`;
    case 'email': return `mailto:${to}?body=${enc}`;
    default: return null;
  }
}
