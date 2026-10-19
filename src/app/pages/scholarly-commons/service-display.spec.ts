import {describe, expect, it} from 'vitest';
import {
  ORDER_FULLY_OPEN,
  ORDER_OPEN_ACCESS,
  ORDER_REQUIRED,
  accentFor,
  displayLabel,
  htmlToText,
  initialsOf,
  logoOf,
  safeUrl,
  summarizeList,
} from './service-display';

describe('displayLabel', () => {
  it('shortens the TRL sentence to "TRL <level>"', () => {
    expect(displayLabel('trl', 'trl-9', '9 - actual system proven in operational environment')).toBe('TRL 9');
    expect(displayLabel('trl', 'trl-12', 'anything')).toBe('TRL 12');
  });

  it('keeps the API label for a TRL value it cannot read', () => {
    expect(displayLabel('trl', 'unknown', 'Unknown level')).toBe('Unknown level');
  });

  it('uses short forms for the two order types the design names', () => {
    expect(displayLabel('order_type', ORDER_FULLY_OPEN, 'Fully open access')).toBe('Fully open');
    expect(displayLabel('order_type', ORDER_REQUIRED, 'Order required by the provider')).toBe('Order required');
  });

  it('keeps the API label for any other order type', () => {
    expect(displayLabel('order_type', ORDER_OPEN_ACCESS, 'Open access')).toBe('Open access');
  });

  it('keeps the API label for every other field', () => {
    expect(displayLabel('portfolios', 'p-1', 'Publish')).toBe('Publish');
  });
});

describe('htmlToText', () => {
  it('strips tags and keeps the text', () => {
    expect(htmlToText('<b>bold</b> and <i>italic</i> text')).toBe('bold and italic text');
  });

  it('puts a space between block elements instead of gluing the sentences together', () => {
    expect(htmlToText('<p>First.</p><p>Second.</p>')).toBe('First. Second.');
    expect(htmlToText('<ul><li>One</li><li>Two</li></ul>')).toBe('One Two');
    expect(htmlToText('line one<br>line two')).toBe('line one line two');
  });

  it('decodes entities, so the result can be shown with plain interpolation', () => {
    expect(htmlToText('Tom &amp; Jerry &lt;3')).toBe('Tom & Jerry <3');
  });

  it('collapses whitespace and trims', () => {
    expect(htmlToText('  a \n\t  b  ')).toBe('a b');
  });

  it('returns an empty string for empty input', () => {
    expect(htmlToText('')).toBe('');
  });
});

describe('initialsOf', () => {
  it('uses the first letters of the first two words', () => {
    expect(initialsOf('Open Archive Hub')).toBe('Oa');
    expect(initialsOf('Data & Tools')).toBe('Dt');
  });

  it('uses the first two letters of a single word', () => {
    expect(initialsOf('zenodo')).toBe('Ze');
    expect(initialsOf('A')).toBe('A');
  });

  it('handles letters outside ASCII', () => {
    expect(initialsOf('École normale')).toBe('Én');
  });

  it('falls back to a question mark when there is no usable word', () => {
    expect(initialsOf('')).toBe('?');
    expect(initialsOf('   ')).toBe('?');
    expect(initialsOf('&&&')).toBe('?');
    expect(initialsOf(undefined as unknown as string)).toBe('?');
  });
});

describe('accentFor', () => {
  it('picks the same colour for the same id every time', () => {
    expect(accentFor('svc-1')).toBe(accentFor('svc-1'));
  });

  it('alternates by the parity of the character-code sum', () => {
    expect(accentFor('a')).toBe('pink'); // 97
    expect(accentFor('b')).toBe('teal'); // 98
    expect(accentFor('')).toBe('teal'); // 0
  });
});

describe('summarizeList', () => {
  it('joins short lists', () => {
    expect(summarizeList([])).toBe('');
    expect(summarizeList(['A', 'B', 'C'])).toBe('A, B, C');
  });

  it('shows the first three and counts the rest', () => {
    expect(summarizeList(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C +2');
  });

  it('takes the limit from its second argument', () => {
    expect(summarizeList(['A', 'B', 'C'], 2)).toBe('A, B +1');
  });
});

describe('safeUrl', () => {
  it('passes web and mailto links', () => {
    expect(safeUrl('https://example.org/a?b=1')).toBe('https://example.org/a?b=1');
    expect(safeUrl('http://example.org')).toBe('http://example.org');
    expect(safeUrl('mailto:help@example.org')).toBe('mailto:help@example.org');
  });

  it('trims the value and ignores the case of the scheme', () => {
    expect(safeUrl('  https://example.org  ')).toBe('https://example.org');
    expect(safeUrl('HTTPS://EXAMPLE.ORG')).toBe('HTTPS://EXAMPLE.ORG');
  });

  it.each([
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a data: URL', 'data:text/html,<script>alert(1)</script>'],
    ['an ftp link', 'ftp://example.org'],
    ['a protocol-relative link', '//example.org'],
    ['a bare host', 'example.org'],
    ['an empty string', ''],
    ['a number', 42],
    ['undefined', undefined],
    ['null', null],
  ])('returns an empty string for %s', (_label, value) => {
    expect(safeUrl(value)).toBe('');
  });
});

describe('logoOf', () => {
  it('returns a non-empty string', () => {
    expect(logoOf('https://example.org/logo.png')).toBe('https://example.org/logo.png');
  });

  it.each([
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['an object', {href: 'https://example.org/logo.png'}],
  ])('returns null for %s', (_label, value) => {
    expect(logoOf(value)).toBeNull();
  });
});
