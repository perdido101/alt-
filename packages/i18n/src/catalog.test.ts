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

  it('use the same placeholders in el and en', () => {
    for (const [key, msg] of Object.entries(flat.el)) {
      expect(placeholders(flat.en[key]!), key).toEqual(placeholders(msg));
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
