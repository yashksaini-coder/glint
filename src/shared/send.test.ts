import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSendUrl, MAX_SEND_LEN, SEND_PREFIXES } from './send.ts';
import { type SendTarget } from './settings.ts';

const url = (sendTarget: SendTarget, sendTo: string, text: string) => buildSendUrl({ sendTarget, sendTo }, text);

test('each target builds its share link', () => {
  assert.equal(url('whatsapp', '15550100', 'hi'), 'https://wa.me/15550100?text=hi');
  assert.equal(url('whatsapp', '', 'hi'), 'https://wa.me/?text=hi');
  assert.equal(url('telegram', 'ignored', 'hi'), 'https://t.me/share/url?url=https%3A%2F%2Fyashksaini-coder.github.io%2Fglint%2F&text=hi');
  assert.equal(url('email', 'a.b+c@example.org', 'hi'), 'mailto:a.b+c@example.org?body=hi');
  assert.equal(url('email', '', 'hi'), 'mailto:?body=hi');
});

test('none, empty or blank text gives no link', () => {
  assert.equal(url('none', '', 'hi'), null);
  assert.equal(url('whatsapp', '1', '   '), null);
  assert.equal(url('bogus' as SendTarget, '1', 'hi'), null);
});

test('text is encoded and capped', () => {
  const u = url('whatsapp', '1', 'a&b=c #d ?e\nf ✓ ')!;
  assert.equal(u, 'https://wa.me/1?text=a%26b%3Dc%20%23d%20%3Fe%0Af%20%E2%9C%93');
  assert.equal(decodeURIComponent(u.split('text=')[1]), 'a&b=c #d ?e\nf ✓');
  assert.ok(url('email', '', '😀'.repeat(MAX_SEND_LEN + 1)), 'cap never splits an emoji');
  assert.equal(url('email', '', 'a\uD800'), 'mailto:?body=a%EF%BF%BD', 'lone surrogate does not throw');
  assert.equal(decodeURIComponent(url('email', '', 'x'.repeat(5000))!.split('body=')[1]).length, MAX_SEND_LEN);
});

test('neither text nor recipient can change scheme, host or path', () => {
  const evil = ['@evil.com/', '//evil.com', 'x?y#z', 'a@b.c?cc=x@evil.com', 'a@b.c&bcc=x', 'javascript:alert(1)', '\nhttps://evil.com', '%0a'];
  for (const target of ['whatsapp', 'telegram', 'email'] as const) for (const to of evil) for (const text of evil) {
    const u = url(target, to, text)!;
    assert.ok(SEND_PREFIXES.some((p) => u.startsWith(p)), u);
    const q = u.indexOf('?');
    assert.match(u.slice(0, q), /^(https:\/\/wa\.me\/\d*|https:\/\/t\.me\/share\/url|mailto:)$/, u);
    assert.equal(new URL(u).searchParams.get(target === 'email' ? 'body' : 'text'), text.trim());
  }
});
