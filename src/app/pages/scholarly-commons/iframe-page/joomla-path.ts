import {environment} from '../../../../environments/environment';

/** Same-origin prefix that the dev server (proxy.conf.json) and nginx forward to the Joomla host. */
export const JOOMLA_PROXY_PREFIX = '/pages';

/**
 * Public address of the Joomla site: where its pages open when they are shown outside the app. Set per
 * environment, so moving the Joomla host is a configuration change (plus the proxy target), not a code change.
 */
export const JOOMLA_SITE_ORIGIN = environment.JOOMLA_SITE_ORIGIN;

/** What an HTML `id` looks like in practice; also keeps anything that is not a plain anchor name out of the URL. */
const FRAGMENT = /^\w[\w:.-]{0,99}$/;

/**
 * Validates a Joomla path that comes from outside the app (the `?path=` query param or a link
 * in the framed page) and returns it as `pathname + search`,
 * or `null` when it is not a plain same-origin path.
 *
 * Everything is resolved with `new URL()` against our own origin, so `//host`, `\host`, tab/newline
 * tricks and dot segments (`/a/../pages`) are all normalised before the checks below see them.
 */
export function toJoomlaPath(candidate: unknown, origin: string): string | null {
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(candidate, origin);
  } catch {
    return null;
  }

  const isProxyPath = url.pathname === JOOMLA_PROXY_PREFIX || url.pathname.startsWith(`${JOOMLA_PROXY_PREFIX}/`);
  // Dot segments can leave `//evil.example/x` behind (from `/.//evil.example/x`), which any later
  // `new URL(path, base)` would read as a host, so the normalised pathname is checked too.
  if (url.origin !== origin || isProxyPath || url.pathname.startsWith('//')) {
    return null;
  }
  return url.pathname + url.search;
}

/**
 * Validates an anchor name from outside the app (route fragment or the hash of a link in the
 * framed page, with or without the leading `#`); returns it without the `#`,
 * or `null` when it is empty or not a plain anchor name.
 */
export function toJoomlaFragment(candidate: unknown): string | null {
  if (typeof candidate !== 'string') {
    return null;
  }
  const anchor = candidate.startsWith('#') ? candidate.slice(1) : candidate;
  return FRAGMENT.test(anchor) ? anchor : null;
}

/**
 * Address of a validated Joomla path on the real site, for opening it outside the app. The full
 * site is wanted there, so a `tmpl=yootheme` (chrome-free) parameter is dropped; the query string is
 * only re-serialised when there is something to drop.
 */
export function joomlaSiteUrl(path: string, fragment?: string | null): string {
  // Appended to the origin instead of resolved against it, and checked afterwards, so that no
  // input (`//host/x`, `/\host`, `@host`) can make another host the target of the new tab.
  const url = new URL(JOOMLA_SITE_ORIGIN + path);
  if (url.origin !== JOOMLA_SITE_ORIGIN) {
    throw new Error(`Not a path on ${JOOMLA_SITE_ORIGIN}: ${path}`);
  }
  if (url.searchParams.has('tmpl')) {
    url.searchParams.delete('tmpl');
  }
  url.hash = fragment ?? '';
  return url.toString();
}

/** Builds the proxied, chrome-free (`tmpl=yootheme`) iframe URL for an already validated Joomla path. */
export function joomlaFrameSrc(path: string, origin: string, fragment?: string | null): string {
  const url = new URL(path, origin);
  url.searchParams.set('tmpl', 'yootheme');
  return JOOMLA_PROXY_PREFIX + url.pathname + url.search + (fragment ? `#${fragment}` : '');
}
