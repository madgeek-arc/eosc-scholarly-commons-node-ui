import type {Routes} from '@angular/router';
import {describe, expect, it} from 'vitest';
import {IFRAME_PAGES, appRouteSegments, isAppPath, joomlaPathFor, routeForJoomlaPath} from './iframe-pages.config';

describe('IFRAME_PAGES', () => {
  it('gives every page its own route path and article, and never the proxied `pages` prefix', () => {
    const paths = IFRAME_PAGES.map((page) => page.path);
    const articles = IFRAME_PAGES.map((page) => page.articleId);

    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(articles).size).toBe(articles.length);
    expect(paths).not.toContain('pages');
  });

  it.each(IFRAME_PAGES.map((page) => [page.path, page] as const))('finds the route of %s from its own Joomla path', (_path, page) => {
    expect(routeForJoomlaPath(joomlaPathFor(page))).toBe(page.path);
  });
});

describe('joomlaPathFor', () => {
  it('points at the article of the page', () => {
    expect(joomlaPathFor({path: 'x', title: 'X', articleId: 25})).toBe('/?option=com_content&view=article&id=25');
  });
});

describe('routeForJoomlaPath', () => {
  it.each([
    ['an article id', '/?option=com_content&view=article&id=26', 'use-cases'],
    ['an article id on index.php', '/index.php?option=com_content&view=article&id=27', 'news'],
    ['an article id with a Joomla alias', '/?option=com_content&view=article&id=25:how-to-start', 'how-to-start'],
    ['extra query parameters', '/?option=com_content&view=article&id=32&Itemid=101&tmpl=yootheme', 'join'],
    ['a listed alias', '/how-to-start.html', 'how-to-start'],
    ['another listed alias', '/use-cases.html', 'use-cases'],
  ])('maps %s to the menu route', (_label, path, route) => {
    expect(routeForJoomlaPath(path)).toBe(route);
  });

  it.each([
    ['an article that is not a menu page', '/?option=com_content&view=article&id=999'],
    ['an id that only starts like a menu page', '/?option=com_content&view=article&id=250'],
    ['an id that only ends like a menu page', '/?option=com_content&view=article&id=125'],
    ['another Joomla component', '/?option=com_users&view=article&id=25'],
    ['a view that is not an article', '/?option=com_content&view=category&id=25'],
    ['an article query on another path', '/other?option=com_content&view=article&id=25'],
    ['a path that is not a listed alias', '/news.html'],
    ['the front page', '/'],
  ])('finds no route for %s', (_label, path) => {
    expect(routeForJoomlaPath(path)).toBeNull();
  });
});

describe('appRouteSegments', () => {
  it('collects the first segment of each top-level route', () => {
    const routes: Routes = [{path: 'discover'}, {path: 'dashboard/:id/resources'}, {path: 'join'}];
    expect([...appRouteSegments(routes)]).toEqual(['discover', 'dashboard', 'join']);
  });

  it('skips the empty path, the wildcard and routes that start with a parameter', () => {
    const routes: Routes = [{path: ''}, {path: '**'}, {path: ':resourceType/:id'}, {path: 'news'}, {redirectTo: 'news'}];
    expect([...appRouteSegments(routes)]).toEqual(['news']);
  });
});

describe('isAppPath', () => {
  const segments = new Set(['discover', 'join', 'dashboard']);

  it.each([
    ['a route of the app', '/discover'],
    ['a deeper path of a route', '/discover/service/abc'],
    ['a route with a query', '/join?ref=home'],
    ['the home page', '/'],
  ])('accepts %s', (_label, path) => {
    expect(isAppPath(path, segments)).toBe(true);
  });

  it.each([
    ['a Joomla page that only starts like a route', '/discover.html'],
    ['a longer first segment', '/discovery'],
    ['a path the app does not have', '/unknown'],
    ['a Joomla query on the root', '/?option=com_content&view=article&id=25'],
    ['a protocol-relative URL', '//discover'],
    ['a path without the leading slash', 'discover'],
    ['an empty string', ''],
  ])('rejects %s', (_label, path) => {
    expect(isAppPath(path, segments)).toBe(false);
  });
});
