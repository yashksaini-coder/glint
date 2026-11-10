// Letters ordered by English frequency, not QWERTY: with scanning, every position costs time, so the
// common letters sit where the highlight reaches first (top-left).
export const DEL = '⌫';
export const SPACE = '␣';

export const LETTERS: string[][] = [
  [SPACE, 'E', 'T', 'A', 'O', DEL],
  ['I', 'N', 'S', 'H', 'R', 'D'],
  ['L', 'C', 'U', 'M', 'W', 'F'],
  ['G', 'Y', 'P', 'B', 'V', 'K'],
  ['J', 'X', 'Q', 'Z', '.', '?'],
];

export function applyKey(text: string, key: string): string {
  if (key === DEL) return text.slice(0, -1);
  if (key === SPACE) return text + ' ';
  return text + key.toLowerCase();
}
