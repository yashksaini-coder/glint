// Excalidraw-style architecture diagram for the README: rough.js shapes + the Virgil font (OFL, see
// Virgil-OFL.md) -> SVG with the font embedded -> out/diagram/. Then render.cjs rasterizes it at 2x.
// Run: npm run diagram   (writes docs/img/architecture.png)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import rough from 'roughjs/bundled/rough.esm.js';

const gen = rough.generator();
const FONT = readFileSync(new URL('./Virgil-Regular.woff2', import.meta.url)).toString('base64');
const W = 1480, H = 720, INK = '#1e1e1e';
let seed = 7;
const opts = (o = {}) => ({ seed: seed++, stroke: INK, strokeWidth: 2, roughness: 1.4, bowing: 1.2, ...o });
const out = [];
const paths = (drawable) => gen.toPaths(drawable).map((p) =>
  `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill ?? 'none'}"${p.stroke === 'none' ? '' : ' stroke-linecap="round"'}/>`).join('');
const text = (x, y, s, size = 24, anchor = 'middle', color = INK) =>
  s.split('\n').map((line, i, all) =>
    `<text x="${x}" y="${y + (i - (all.length - 1) / 2) * size * 1.2}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="middle" fill="${color}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`).join('');

// --- boxes -------------------------------------------------------------------------------------
const box = (x, y, w, h, fill, label, sub) => {
  out.push(paths(gen.rectangle(x, y, w, h, opts({ fill, fillStyle: 'hachure', hachureGap: 7, fillWeight: 1.4 }))));
  out.push(text(x + w / 2, y + h / 2 - (sub ? 12 : 0), label, 25));
  if (sub) out.push(text(x + w / 2, y + h / 2 + 22, sub, 18, 'middle', '#495057'));
  return { x, y, w, h, l: [x, y + h / 2], r: [x + w, y + h / 2], cx: x + w / 2, cy: y + h / 2 };
};

// boundary first, so everything sits on top
out.push(paths(gen.rectangle(24, 24, W - 48, H - 48, opts({ stroke: '#868e96', strokeLineDash: [12, 10], roughness: 1.1, strokeWidth: 2 }))));
out.push(text(48, 52, 'on this device', 22, 'start', '#868e96'));

const cam    = box(60, 280, 160, 90, '#e9ecef', 'Webcam');
const sdk    = box(345, 230, 230, 190, '#d0bfff', 'SmartSpectra\nSDK', '\nface + breathing models');
const brow   = box(700, 70, 250, 100, '#a5d8ff', 'eyebrow raise', 'brow ratio from landmarks');
const pause  = box(700, 215, 250, 100, '#ffc9c9', 'pause + show', "the SDK's own hint");
const strip  = box(700, 360, 250, 100, '#e9ecef', 'signal strip', 'pulse: display only');
const exhale = box(700, 505, 250, 100, '#b2f2bb', 'slow exhale', 'blocked while talking');
const scan   = box(1060, 120, 220, 110, '#ffec99', 'row / column\nscanner');
const say    = box(1200, 420, 200, 110, '#ffec99', 'speak + copy');

// --- arrows ------------------------------------------------------------------------------------
const arrow = (pts, label, at = 0.5, dy = -16, color = INK) => {
  out.push(paths(gen.curve(pts, opts({ stroke: color, roughness: 1.1 }))));
  const [a, b] = [pts.at(-2), pts.at(-1)];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 16;
  for (const s of [-1, 1]) out.push(paths(gen.line(b[0], b[1], b[0] - L * Math.cos(ang + s * 0.45), b[1] - L * Math.sin(ang + s * 0.45), opts({ stroke: color, roughness: 0.8 }))));
  if (label) {
    const i = Math.min(pts.length - 2, Math.floor(at * (pts.length - 1)));
    const t = at * (pts.length - 1) - i, p = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    out.push(text(p[0], p[1] + dy, label, 19, 'middle', color));
  }
};
const mid = (a, b, bend = 0) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + bend];

arrow([cam.r, mid(cam.r, sdk.l, -4), sdk.l], 'frames', 0.5, -18);
out.push(text(282, 352, '(memory only)', 16, 'middle', '#868e96'));
const s0 = [sdk.x + sdk.w, sdk.y + 40], s1 = [sdk.x + sdk.w, sdk.y + 85], s2 = [sdk.x + sdk.w, sdk.y + 130], s3 = [sdk.x + sdk.w, sdk.y + 170];
arrow([s0, [625, 150], brow.l], 'landmarks', 0.42, -14);
arrow([s1, [635, 262], pause.l], 'validation', 0.5, -14);
arrow([s2, [635, 400], strip.l], '', 0.5, 0);
out.push(text(645, 352, 'pulse rate', 19));
arrow([s3, [615, 530], exhale.l], '', 0.5, 0);
out.push(text(560, 560, 'breathing trace\n+ talking', 18, 'end'));
arrow([brow.r, [1005, 125], [scan.x, scan.y + 35]], 'select', 0.5, -16, '#1971c2');
arrow([pause.r, [1005, 250], [scan.x, scan.y + 85]], 'pause', 0.5, 16, '#e03131');
arrow([[scan.cx + 30, scan.y + scan.h], [scan.cx + 70, 330], [say.cx - 10, say.y]], 'letters,\nphrases', 0.55, 0, '#1971c2');
arrow([exhale.r, [1080, 540], [say.x, say.y + 70]], 'commit', 0.5, -16, '#2f9e44');

// footer note
out.push(text(W / 2, H - 52, 'nothing stored except settings.json  ·  no network except the SDK session  ·  telemetry off by default', 19, 'middle', '#868e96'));

const OUT = new URL('../../out/diagram/', import.meta.url);
mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('wrap.html', OUT), `<!doctype html><html><head><style>html,body{margin:0;background:#fffdf8;overflow:hidden}img{display:block;width:${W}px;height:${H}px}</style></head><body><img src="architecture.svg"></body></html>`);
writeFileSync(new URL('architecture.svg', OUT), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>@font-face { font-family: Virgil; src: url(data:font/woff2;base64,${FONT}) format('woff2'); } text { font-family: Virgil, 'Comic Sans MS', cursive; }</style>
<rect width="100%" height="100%" fill="#fffdf8"/>
${out.join('\n')}
</svg>`);
console.log(`out/diagram/architecture.svg written (${W}x${H})`);
