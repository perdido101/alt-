import IntlMessageFormat from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import { messages, locales } from './index';

type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

const flat = Object.fromEntries(locales.map((l) => [l, flatten(messages[l] as Tree)])) as Record<
  (typeof locales)[number],
  Record<string, string>
>;

function placeholders(msg: string): string[] {
  return [...msg.matchAll(/\{(\w+)/g)].map((m) => m[1]!).sort();
}

describe('message catalogs', () => {
  it('have identical keys in every locale', () => {
    expect(Object.keys(flat.en).sort()).toEqual(Object.keys(flat.el).sort());
  });

  for (const locale of locales) {
    it(`${locale}: every message is non-empty, valid ICU and not i18next {{}} syntax`, () => {
      for (const [key, msg] of Object.entries(flat[locale])) {
        expect(msg.trim(), key).not.toBe('');
        expect(msg, key).not.toMatch(/\{\{/);
        expect(() => new IntlMessageFormat(msg, locale), key).not.toThrow();
      }
    });
  }

  // Greek-only grammar arguments (e.g. the article that picks στον/στην/στα) may be absent in English.
  const GRAMMAR_ONLY = new Set(['article']);

  it('use the same placeholders in el and en', () => {
    for (const [key, msg] of Object.entries(flat.el)) {
      const el = placeholders(msg).filter((p) => !GRAMMAR_ONLY.has(p));
      const en = placeholders(flat.en[key]!).filter((p) => !GRAMMAR_ONLY.has(p));
      expect([...new Set(en)].sort(), key).toEqual([...new Set(el)].sort());
    }
  });

  it('keep canonical Greek copy verbatim', () => {
    expect(flat.el['brand.tagline']).toBe('Πριν πληρώσεις, ρώτα.');
    expect(flat.el['consent.body']).toBe(
      'Η οικογένειά σου θα βλέπει τους ελέγχους και τις ειδοποιήσεις σου, για να σε προστατεύει.',
    );
    expect(flat.el['setup.footer']).toBe('Η ΑΛΤ! δεν θα ζητήσει ποτέ κωδικούς, κάρτα ή PIN τράπεζας.');
    expect(flat.el['setup.safeWord.guidance']).toBe('Κάτι παράξενο αλλά εύκολο, που δεν υπάρχει στο Facebook.');
    expect(flat.el['parent.home.askingMoney']).toBe('Κάποιος μου ζητάει λεφτά');
    expect(new IntlMessageFormat(flat.el['setup.progress']!, 'el').format({ current: 4, total: 5 })).toBe(
      'Ρύθμιση μαζί · 4 από 5',
    );
  });

  it('never promise certainty', () => {
    for (const locale of locales) {
      for (const msg of Object.values(flat[locale])) {
        expect(msg).not.toMatch(/100%|απόλυτα ασφαλ|completely safe|ΚΙΝΔΥΝΟΣ/i);
      }
    }
  });
});

describe('Greek grammar for organisations', () => {
  const t = (key: string, v: Record<string, string>) => new IntlMessageFormat(flat.el[key]!, 'el').format(v);
  it('picks στην/στον/στα', () => {
    expect(t('call.mismatchTitle', { org: 'Ελληνική Αστυνομία', article: 'i' })).toBe('Αυτός ο αριθμός ΔΕΝ ανήκει στην Ελληνική Αστυνομία');
    expect(t('call.mismatchTitle', { org: 'ΕΛΤΑ', article: 'ta' })).toBe('Αυτός ο αριθμός ΔΕΝ ανήκει στα ΕΛΤΑ');
    expect(t('call.mismatchTitle', { org: 'e-ΕΦΚΑ', article: 'o' })).toBe('Αυτός ο αριθμός ΔΕΝ ανήκει στον e-ΕΦΚΑ');
  });
  it('agrees the verb and article', () => {
    expect(t('call.neverAsks', { org: 'ΕΛΤΑ', article: 'ta' })).toBe('Τα ΕΛΤΑ δεν ζητούν ποτέ χρήματα ή κωδικούς στο τηλέφωνο.');
    expect(t('call.neverAsks', { org: 'Ελληνική Αστυνομία', article: 'i' })).toBe('Η Ελληνική Αστυνομία δεν ζητά ποτέ χρήματα ή κωδικούς στο τηλέφωνο.');
    expect(t('call.callReal', { org: 'Ελληνική Αστυνομία', article: 'i', number: '100' })).toBe('Πάρε την πραγματική Ελληνική Αστυνομία (100)');
  });
});
