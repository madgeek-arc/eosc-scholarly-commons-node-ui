import type {Routes} from '@angular/router';

export interface IframePage {
  /** Angular route path; must not be `pages` (that prefix is proxied to Joomla). */
  path: string;
  title: string;
  /** Article id on innovation.openaire.eu (`?option=com_content&view=article&id=N`). */
  articleId: number;
  /**
   * SEF paths other articles use to link to this one. Only list aliases that were checked to
   * serve the same article: /news.html, /home.html and /about.html are older, different pages,
   * and /training.html and /terms-and-policies.html do not exist.
   */
  aliases?: string[];
}

export const IFRAME_PAGES: IframePage[] = [
  {path: 'home', title: 'Home', articleId: 23},
  {path: 'how-to-start', title: 'How to start', articleId: 25, aliases: ['/how-to-start.html']},
  {path: 'use-cases', title: 'Use Cases', articleId: 26, aliases: ['/use-cases.html']},
  {path: 'news', title: 'News', articleId: 27},
  {path: 'training', title: 'Training', articleId: 28},
  {path: 'terms-and-policies', title: 'Terms & Policies', articleId: 29},
  {path: 'join', title: 'Join', articleId: 32},
];

/** Root-relative Joomla path of a page's article; `tmpl=yootheme` is added when building the iframe URL. */
export function joomlaPathFor(page: IframePage): string {
  return `/?option=com_content&view=article&id=${page.articleId}`;
}

/**
 * Angular route (without the leading slash) that shows the given, already validated, Joomla path,
 * or `null` when it is not one of the menu pages. Articles link to each other both by id and by
 * SEF alias, and a link to a menu page should move the app to that page's route (right URL, right
 * highlighted menu entry) instead of loading it inside the current one.
 */
export function routeForJoomlaPath(path: string): string | null {
  // The base is only needed to parse a root-relative path.
  const {pathname, searchParams} = new URL(path, 'http://joomla.invalid');

  const isArticleUrl = (pathname === '/' || pathname === '/index.php')
    && searchParams.get('option') === 'com_content'
    && searchParams.get('view') === 'article';
  if (isArticleUrl) {
    // Joomla also accepts `id=25:how-to-start`.
    const id = /^(\d+)(?::.*)?$/.exec(searchParams.get('id') ?? '')?.[1];
    return IFRAME_PAGES.find(page => String(page.articleId) === id)?.path ?? null;
  }

  return IFRAME_PAGES.find(page => page.aliases?.includes(pathname))?.path ?? null;
}

/**
 * First path segments of the application's top-level routes (`discover`, `join`, `news`, ...).
 * Skips the empty path, the `**` wildcard and param-first paths such as `:resourceType/...`,
 * which would otherwise claim every link.
 */
export function appRouteSegments(routes: Routes): Set<string> {
  const segments = new Set<string>();
  for (const {path} of routes) {
    const first = path?.split('/')[0];
    if (first && first !== '**' && !first.startsWith(':')) {
      segments.add(first);
    }
  }
  return segments;
}

/**
 * Whether a validated, root-relative path from the framed Joomla page points at one of the
 * application's own routes. Root-relative links resolve to our origin (the pages are proxied), so
 * the framed page cannot tell `/discover` from a Joomla path; only the app can.
 * Segments match exactly (`/discover.html` is a Joomla page, `/discover` is the app), a bare `/`
 * is the app's home, and `/?option=...` is a Joomla page.
 */
export function isAppPath(path: string, appSegments: ReadonlySet<string>): boolean {
  // `//host/x` would parse as a host, not as a path.
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  const {pathname, search} = new URL(path, 'http://joomla.invalid');
  if (pathname === '/') {
    return search === '';
  }
  return appSegments.has(pathname.split('/')[1]);
}
