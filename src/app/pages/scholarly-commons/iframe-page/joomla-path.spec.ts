import {describe, expect, it} from 'vitest';
import {
  JOOMLA_PROXY_PREFIX,
  JOOMLA_SITE_ORIGIN,
  joomlaFrameSrc,
  joomlaSiteUrl,
  toJoomlaFragment,
  toJoomlaPath,
} from './joomla-path';

const ORIGIN = 'https://app.example.org';

describe('toJoomlaPath', () => {
  it('returns the path and query of a plain same-origin path', () => {
    expect(toJoomlaPath('/news', ORIGIN)).toBe('/news');
    expect(toJoomlaPath('/news/item-1?page=2&sort=asc', ORIGIN)).toBe('/news/item-1?page=2&sort=asc');
  });

  it('drops the hash, which travels separately as the fragment', () => {
    expect(toJoomlaPath('/news?page=2#section', ORIGIN)).toBe('/news?page=2');
  });

  it('normalises dot segments before returning the path', () => {
    expect(toJoomlaPath('/a/b/../c', ORIGIN)).toBe('/a/c');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a number', 42],
    ['an object', {}],
    ['an empty string', ''],
    ['a relative path', 'news'],
    ['a full URL', 'https://evil.example/news'],
  ])('rejects %s', (_label, candidate) => {
    expect(toJoomlaPath(candidate, ORIGIN)).toBeNull();
  });

  it.each([
    ['a protocol-relative URL', '//evil.example/news'],
    ['a backslash host', '/\\evil.example/news'],
    ['a tab hidden in the double slash', '/\t/evil.example/news'],
    ['a newline hidden in the double slash', '/\n/evil.example/news'],
    ['dot segments that leave a double slash', '/.//evil.example/news'],
  ])('rejects %s', (_label, candidate) => {
    expect(toJoomlaPath(candidate, ORIGIN)).toBeNull();
  });

  it('rejects the proxy prefix itself, so a framed page cannot nest the proxy', () => {
    expect(toJoomlaPath(JOOMLA_PROXY_PREFIX, ORIGIN)).toBeNull();
    expect(toJoomlaPath(`${JOOMLA_PROXY_PREFIX}/news`, ORIGIN)).toBeNull();
    expect(toJoomlaPath('/a/../pages/news', ORIGIN)).toBeNull();
  });

  it('accepts paths that only start with the letters of the proxy prefix', () => {
    expect(toJoomlaPath('/pages-and-more', ORIGIN)).toBe('/pages-and-more');
  });
});

describe('toJoomlaFragment', () => {
  it('returns the anchor name with or without the leading #', () => {
    expect(toJoomlaFragment('#contact')).toBe('contact');
    expect(toJoomlaFragment('contact')).toBe('contact');
  });

  it('accepts the characters an HTML id uses in practice', () => {
    expect(toJoomlaFragment('1st-section_v2:part.a')).toBe('1st-section_v2:part.a');
  });

  it.each([
    ['an empty string', ''],
    ['a lone #', '#'],
    ['a space', 'two words'],
    ['a slash', 'a/b'],
    ['a query string', 'a?b=1'],
    ['an angle bracket', '<script>'],
    ['a leading dash', '-x'],
    ['a non-string', 5],
    ['undefined', undefined],
  ])('rejects %s', (_label, candidate) => {
    expect(toJoomlaFragment(candidate)).toBeNull();
  });

  it('allows up to 100 characters', () => {
    expect(toJoomlaFragment('a'.repeat(100))).toBe('a'.repeat(100));
    expect(toJoomlaFragment('a'.repeat(101))).toBeNull();
  });
});

describe('joomlaFrameSrc', () => {
  it('proxies the path and asks for the chrome-free template', () => {
    expect(joomlaFrameSrc('/news', ORIGIN)).toBe('/pages/news?tmpl=yootheme');
  });

  it('keeps the existing query and appends the fragment', () => {
    expect(joomlaFrameSrc('/news?page=2', ORIGIN, 'top')).toBe('/pages/news?page=2&tmpl=yootheme#top');
  });

  it('replaces a template the path already asked for', () => {
    expect(joomlaFrameSrc('/news?tmpl=component', ORIGIN)).toBe('/pages/news?tmpl=yootheme');
  });

  it('leaves the fragment out when it is empty or missing', () => {
    expect(joomlaFrameSrc('/news', ORIGIN, '')).toBe('/pages/news?tmpl=yootheme');
    expect(joomlaFrameSrc('/news', ORIGIN, null)).toBe('/pages/news?tmpl=yootheme');
  });
});

describe('joomlaSiteUrl', () => {
  it('opens the path on the Joomla site', () => {
    expect(joomlaSiteUrl('/news')).toBe(`${JOOMLA_SITE_ORIGIN}/news`);
  });

  it('drops the chrome-free template so the full site shows, and keeps the other parameters', () => {
    expect(joomlaSiteUrl('/news?tmpl=yootheme&page=2')).toBe(`${JOOMLA_SITE_ORIGIN}/news?page=2`);
  });

  it('adds the fragment when there is one', () => {
    expect(joomlaSiteUrl('/news', 'top')).toBe(`${JOOMLA_SITE_ORIGIN}/news#top`);
    expect(joomlaSiteUrl('/news', null)).toBe(`${JOOMLA_SITE_ORIGIN}/news`);
  });

  it.each([
    ['a userinfo host', '@evil.example/news'],
    ['a longer host name', '.evil.example/news'],
  ])('throws instead of pointing at another host with %s', (_label, path) => {
    expect(() => joomlaSiteUrl(path)).toThrow(/Not a path on/);
  });
});
