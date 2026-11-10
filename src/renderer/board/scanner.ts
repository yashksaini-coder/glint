// Row/column scanning: the highlight steps through rows; select enters the row and steps through its
// keys (plus BACK); select again returns the key. Pure state machine: the app owns the clock.

export const BACK = '↩';

export const SCAN_DEFAULTS = {
  graceMs: 350,   // a select this soon after the highlight moved means the user reacted to the previous item
  maxColLoops: 2, // after this many unselected passes through a row, drop back to row scanning
};
export type ScanOpts = typeof SCAN_DEFAULTS;

export type ScanState = { mode: 'rows' | 'cols'; row: number; col: number };

export function createScanner(rows: string[][], o: ScanOpts = SCAN_DEFAULTS) {
  let mode: ScanState['mode'] = 'rows';
  let row = 0, col = 0, prev = 0, loops = 0, movedAt = -Infinity;
  const keys = () => [...rows[row], BACK];

  return {
    state: (): ScanState => ({ mode, row, col }),
    keysOf: (r: number) => [...rows[r], BACK],

    /** Advance the highlight one step. */
    tick(now: number) {
      movedAt = now;
      if (mode === 'rows') { prev = row; row = (row + 1) % rows.length; return; }
      prev = col; col = (col + 1) % keys().length;
      if (col === 0 && ++loops >= o.maxColLoops) { mode = 'rows'; prev = row; }
    },

    /** Select whatever is highlighted (or was, within graceMs). Returns a key, or null for a row / BACK. */
    select(now: number): string | null {
      const late = now - movedAt < o.graceMs;
      movedAt = now;
      if (mode === 'rows') {
        row = late ? prev : row;
        mode = 'cols'; col = 0; prev = 0; loops = 0;
        return null;
      }
      const key = keys()[late ? prev : col];
      mode = 'rows'; prev = row; col = 0; loops = 0;
      if (key === BACK) return null;
      row = 0; prev = 0; // after typing, restart at the top row (most frequent letters)
      return key;
    },

    reset() { mode = 'rows'; row = col = prev = loops = 0; movedAt = -Infinity; },
  };
}
