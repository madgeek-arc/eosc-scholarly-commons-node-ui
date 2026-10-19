import {ViewportScroller} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {Observable, Subject, of, throwError} from 'rxjs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Datasource, Service} from '../../../entities/eic-model';
import {Facet} from '../../../entities/facet';
import {Paging} from '../../../entities/paging';
import {URLParameter} from '../../../entities/url-parameter';
import {ResourceService} from '../../../services/resource.service';
import {ORDER_FULLY_OPEN, ORDER_OPEN_ACCESS, ORDER_REQUIRED} from '../service-display';
import {TASK_SHORTCUTS} from '../services-data';
import {PAGE_SIZE} from './facet-groups';
import {ScSearchComponent} from './search.component';

type Result = Service | Datasource;

const resource = (fields: Record<string, unknown>) => fields as unknown as Result;

const facet = (field: string, values: [value: string, label: string][]): Facet => ({
  field,
  label: field,
  values: values.map(([value, label]) => ({value, label, count: 1, isChecked: false})),
});

const FACETS: Facet[] = [
  facet('portfolios', [
    ['portfolios-publish', 'Publish'],
    ['portfolios-assess', 'Assess'],
  ]),
  facet('resource_organisation', [['org-1', 'Acme Research']]),
  facet('order_type', [
    [ORDER_FULLY_OPEN, 'Fully open access'],
    [ORDER_REQUIRED, 'Order required'],
  ]),
];

const SERVICES = [
  resource({
    id: 'svc-1',
    name: 'Data Safe Vault',
    tagline: 'Keeps data safe',
    resourceOrganisation: 'org-1',
    orderType: ORDER_FULLY_OPEN,
    targetUsers: [],
    extras: {pitch: '<p>Stores datasets for the long term. More text.</p>', portfolios: ['portfolios-publish']},
  }),
  resource({id: 'svc-2', name: 'Review Desk', resourceOrganisation: 'org-1', orderType: ORDER_REQUIRED, targetUsers: [], extras: {}}),
];

const page = (overrides: Partial<Paging<Result>> = {}): Paging<Result> => ({
  from: 0,
  to: SERVICES.length,
  total: SERVICES.length,
  results: SERVICES,
  facets: FACETS,
  ...overrides,
});

const paramsOf = (params: URLParameter[]) => Object.fromEntries(params.map(({key, values}) => [key, values]));

describe('ScSearchComponent', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let component: ScSearchComponent;
  let answer: (params: URLParameter[]) => Observable<Paging<Result>>;
  const searchWithDatasource = vi.fn((params: URLParameter[]) => answer(params));
  const viewport = {getScrollPosition: vi.fn(() => [0, 120] as [number, number]), scrollToAnchor: vi.fn(), scrollToPosition: vi.fn()};

  const root = () => harness.routeNativeElement as HTMLElement;
  const text = (selector: string) => root().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const all = <T extends Element>(selector: string) => [...root().querySelectorAll<T>(selector)];
  const lastRequest = () => paramsOf(searchWithDatasource.mock.lastCall![0]);

  // Lets the effects, the request and the navigation that follows a click finish.
  const settle = async () => {
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  const open = async (url: string) => {
    component = (await harness.navigateByUrl(url, ScSearchComponent)) as ScSearchComponent;
    await settle();
  };

  const click = async (element: Element | undefined) => {
    (element as HTMLElement).click();
    await settle();
  };

  const clickFacet = (label: string) => click(all('.sc-refine__item').find((item) => item.textContent?.trim() === label));

  beforeEach(async () => {
    searchWithDatasource.mockClear();
    Object.values(viewport).forEach((fn) => fn.mockClear());
    answer = () => of(page());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{path: 'discover', component: ScSearchComponent}]),
        {provide: ResourceService, useValue: {searchWithDatasource}},
        {provide: ViewportScroller, useValue: viewport},
      ],
    });
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => vi.useRealTimers());

  describe('the request', () => {
    it('asks for the first page of everything when the URL has no filters', async () => {
      await open('/discover');

      expect(searchWithDatasource).toHaveBeenCalledTimes(1);
      expect(lastRequest()).toEqual({quantity: [String(PAGE_SIZE)], from: ['0']});
    });

    it('turns the query, every picked filter and the page offset of the URL into request parameters', async () => {
      await open('/discover?query=data&portfolios=portfolios-publish&portfolios=portfolios-assess&trl=trl-7&from=18');

      expect(lastRequest()).toEqual({
        quantity: [String(PAGE_SIZE)],
        from: ['18'],
        query: ['data'],
        portfolios: ['portfolios-publish', 'portfolios-assess'],
        trl: ['trl-7'],
      });
    });

    it.each([['-5'], ['abc'], ['']])('starts from the first result when `from` is "%s"', async (from) => {
      await open(`/discover?from=${from}`);
      expect(lastRequest().from).toEqual(['0']);
    });

    it('ignores URL parameters that are not filters of this page', async () => {
      await open('/discover?utm_source=mail&portfolios=portfolios-publish');
      expect(Object.keys(lastRequest())).toEqual(['quantity', 'from', 'portfolios']);
    });

    it('asks again when the URL changes, and not before', async () => {
      await open('/discover');
      await settle();
      expect(searchWithDatasource).toHaveBeenCalledTimes(1);

      await open('/discover?query=metadata');
      expect(searchWithDatasource).toHaveBeenCalledTimes(2);
      expect(lastRequest().query).toEqual(['metadata']);
    });

    it('drops a request that was overtaken by a newer one', async () => {
      const first = new Subject<Paging<Result>>();
      answer = (params) => (paramsOf(params)['query'] ? of(page({results: [SERVICES[1]], total: 1})) : first);

      await open('/discover');
      await open('/discover?query=review');
      first.next(page({results: [SERVICES[0]], total: 1}));
      await settle();

      expect(all('article.sc-result-card').map((card) => card.querySelector('h3')?.textContent?.trim())).toEqual(['Review Desk']);
    });
  });

  describe('the results', () => {
    it('shows one card per service, linked to its page, with names resolved from the facets', async () => {
      await open('/discover');

      const cards = all<HTMLElement>('article.sc-result-card');
      expect(cards).toHaveLength(2);
      expect(cards[0].querySelector('h3 a')?.getAttribute('href')).toBe('/discover/service/svc-1');
      expect(cards[0].textContent).toContain('Data Safe Vault');
      expect(cards[0].textContent).toContain('Keeps data safe');
      expect(cards[0].textContent).toContain('Stores datasets for the long term.');
      expect(cards[0].textContent).toContain('Publish');
      expect(cards[0].textContent).toContain('Acme Research');
      expect(cards[1].textContent).toContain('Order required');
    });

    it('shows the number of results', async () => {
      answer = () => of(page({total: 47}));
      await open('/discover');
      expect(text('.sc-search__count')).toBe('47 results');
    });

    it('shows an error and no count when the request fails', async () => {
      answer = () => throwError(new Error('down'));
      await open('/discover');

      expect(text('.uk-alert-danger')).toContain("couldn't load the services");
      expect(root().querySelector('.sc-search__count')).toBeNull();
      expect(root().querySelector('.sc-empty-state')).toBeNull();
      expect(all('article.sc-result-card')).toHaveLength(0);
    });

    it('recovers from an error on the next request', async () => {
      answer = (params) => (paramsOf(params)['query'] ? of(page()) : throwError(new Error('down')));
      await open('/discover');
      await open('/discover?query=data');

      expect(root().querySelector('.uk-alert-danger')).toBeNull();
      expect(all('article.sc-result-card')).toHaveLength(2);
    });

    it('shows a spinner while the first request is running', async () => {
      answer = () => new Subject<Paging<Result>>();
      await open('/discover');

      expect(root().querySelector('[role="status"]')).not.toBeNull();
      expect(root().querySelector('.sc-empty-state')).toBeNull();
      expect(root().querySelector('.sc-search__count')).toBeNull();
    });

    it('keeps the previous results on screen while the next request runs', async () => {
      const next = new Subject<Paging<Result>>();
      answer = (params) => (paramsOf(params)['query'] ? next : of(page()));
      await open('/discover');
      await open('/discover?query=data');

      expect(all('article.sc-result-card')).toHaveLength(2);
      expect(root().querySelector('[role="status"]')).not.toBeNull();
    });

    it('says so when nothing matches, and offers a reset', async () => {
      answer = () => of(page({results: [], total: 0}));
      await open('/discover?query=zzz');

      expect(text('.sc-empty-state__title')).toBe('No services match those filters');
      await click(root().querySelector('.sc-empty-state__reset')!);
      expect(router.url).toBe('/discover');
    });
  });

  describe('the heading', () => {
    it.each([
      ['/discover', 'All services'],
      ['/discover?query=data', 'Matching services'],
      ['/discover?trl=trl-7', 'Matching services'],
      ['/discover?portfolios=portfolios-publish', 'Matching services'],
    ])('for %s is "%s"', async (url, heading) => {
      await open(url);
      expect(text('.sc-search__results-heading')).toBe(heading);
    });

    it('is the title of a task when exactly that task is picked, in any order', async () => {
      const task = TASK_SHORTCUTS.find((candidate) => candidate.categoryFilters.length > 1)!;
      await open(`/discover?${[...task.categoryFilters].reverse().map((value) => `portfolios=${value}`).join('&')}`);

      expect(text('.sc-search__results-heading')).toBe(task.title);
    });

    it.each([
      ['a query', 'query=data'],
      ['another filter', 'trl=trl-7'],
      ['a category that is not part of the task', 'portfolios=portfolios-publish&portfolios=portfolios-other'],
    ])('falls back to "Matching services" when the task is combined with %s', async (_label, extra) => {
      const task = TASK_SHORTCUTS.find((candidate) => candidate.categoryFilters.length === 2)!;
      const picked = task.categoryFilters.map((value) => `portfolios=${value}`).join('&');
      await open(`/discover?${picked}&${extra}`);

      expect(text('.sc-search__results-heading')).toBe('Matching services');
    });
  });

  describe('the catalogue total', () => {
    const subtitle = () => text('.sc-search__subtitle') ?? '';

    it('is shown once an unfiltered request has answered, and kept while a filtered one runs', async () => {
      answer = (params) => of(page({total: paramsOf(params)['query'] ? 3 : 120}));

      await open('/discover');
      expect(subtitle()).toContain('120 services from trusted providers');

      await open('/discover?query=data');
      expect(subtitle()).toContain('120 services from trusted providers');
      expect(text('.sc-search__count')).toBe('3 results');
    });

    it('is not taken from a filtered response', async () => {
      answer = () => of(page({total: 3}));
      await open('/discover?query=data');

      expect(subtitle()).not.toMatch(/\d+ services from/);
    });

    it('counts a request for another page as unfiltered', async () => {
      answer = () => of(page({total: 120, from: 9}));
      await open('/discover?from=9');

      expect(subtitle()).toContain('120 services from trusted providers');
    });
  });

  describe('the Refine panel', () => {
    it('lists the values of the known filters and marks the picked ones', async () => {
      await open('/discover?portfolios=portfolios-assess');

      const groupLabels = all('.sc-refine__group-label').map((label) => label.textContent?.trim());
      expect(groupLabels).toContain('Category');
      expect(groupLabels).toContain('Provider');
      expect(groupLabels).not.toContain('Maturity');

      const active = all('.sc-refine__item--active').map((item) => item.textContent?.trim());
      expect(new Set(active)).toEqual(new Set(['Assess']));
    });

    it('uses the short names for order types', async () => {
      await open('/discover');
      const labels = all('.sc-refine__item').map((item) => item.textContent?.trim());

      expect(labels).toContain('Fully open');
      expect(labels).not.toContain('Fully open access');
    });

    it('adds a value to the URL when it is picked, keeping the rest', async () => {
      await open('/discover?query=data');
      await clickFacet('Publish');

      expect(router.url).toBe('/discover?query=data&portfolios=portfolios-publish');
      expect(lastRequest().portfolios).toEqual(['portfolios-publish']);
    });

    it('adds a second value of the same filter', async () => {
      await open('/discover?portfolios=portfolios-publish');
      await clickFacet('Assess');

      expect(router.url).toBe('/discover?portfolios=portfolios-publish&portfolios=portfolios-assess');
    });

    it('removes a value when it is clicked again', async () => {
      await open('/discover?portfolios=portfolios-publish&portfolios=portfolios-assess');
      await clickFacet('Publish');

      expect(router.url).toBe('/discover?portfolios=portfolios-assess');
    });

    it('removes the filter from the URL when its last value is unpicked', async () => {
      await open('/discover?portfolios=portfolios-publish');
      await clickFacet('Publish');

      expect(router.url).toBe('/discover');
    });

    it('goes back to the first page when a filter changes', async () => {
      await open('/discover?from=18');
      await clickFacet('Publish');

      expect(router.url).toBe('/discover?portfolios=portfolios-publish');
    });

    it('clears the query and every filter, but nothing else', async () => {
      await open('/discover?query=data&portfolios=portfolios-publish&trl=trl-7&order_type=order_type-order_required&from=9&keep=me');
      await click(all('.sc-refine__clear')[0]);

      expect(router.url).toBe('/discover?keep=me');
      expect(component.searchControl.value).toBe('');
    });

    it('offers "Clear filters" only while something is filtered', async () => {
      await open('/discover');
      expect(root().querySelector('.sc-search__clear')).toBeNull();

      await open('/discover?trl=trl-7');
      expect(root().querySelector('.sc-search__clear')).not.toBeNull();
    });
  });

  describe('the task cards', () => {
    it('show their categories and nothing else when picked', async () => {
      const task = TASK_SHORTCUTS.find((candidate) => candidate.categoryFilters.length === 2)!;
      await open('/discover?query=old&trl=trl-7&from=9');

      const card = all('.sc-task-card').find((element) => element.textContent?.includes(task.title));
      await click(card);

      const expected = task.categoryFilters.map((value) => `portfolios=${value}`).join('&');
      expect(router.url).toBe(`/discover?${expected}`);
      expect(text('.sc-search__results-heading')).toBe(task.title);
    });
  });

  describe('the "Show" toggle', () => {
    const active = () => all('.sc-search__order-toggle li.uk-active').map((item) => item.textContent?.trim());

    it('lights "All" while no order type is picked', async () => {
      await open('/discover');
      expect(active()).toEqual(['All']);
    });

    it('lights a group while exactly its order types are picked', async () => {
      await open(`/discover?order_type=${ORDER_FULLY_OPEN}&order_type=${ORDER_OPEN_ACCESS}`);
      expect(active()).toEqual(['Open to anyone']);
    });

    it('lights nothing after a partial pick made in the Refine panel', async () => {
      await open(`/discover?order_type=${ORDER_FULLY_OPEN}`);
      expect(active()).toEqual([]);
    });

    it('sets all the order types of a group at once, and "All" removes them', async () => {
      await open('/discover');
      await click(all('.sc-search__order-toggle a')[2]);
      expect(router.url).toBe(`/discover?order_type=${ORDER_REQUIRED}`);
      expect(active()).toEqual(['Set up for your organisation']);

      await click(all('.sc-search__order-toggle a')[0]);
      expect(router.url).toBe('/discover');
    });
  });

  describe('the pager', () => {
    const links = () => all<HTMLAnchorElement>('nav[aria-label="Results pages"] a');
    const numbers = () => all('nav[aria-label="Results pages"] li:not(:has([aria-label]))').map((item) => item.textContent?.trim());

    it('is not shown when everything fits on one page', async () => {
      answer = () => of(page({total: PAGE_SIZE}));
      await open('/discover');

      expect(root().querySelector('nav[aria-label="Results pages"]')).toBeNull();
    });

    it('shows two pages on each side of the current one, linked by offset, keeping the query', async () => {
      answer = () => of(page({total: 7 * PAGE_SIZE, from: 2 * PAGE_SIZE}));
      await open(`/discover?query=data&from=${2 * PAGE_SIZE}`);

      expect(numbers()).toEqual(['1', '2', '3', '4', '5']);
      expect(all('nav[aria-label="Results pages"] li.uk-active').map((item) => item.textContent?.trim())).toEqual(['3']);

      const hrefs = Object.fromEntries(links().map((link) => [link.getAttribute('aria-label') ?? link.textContent?.trim(), link.getAttribute('href')]));
      expect(hrefs['1']).toBe('/discover?query=data');
      expect(hrefs['2']).toBe(`/discover?query=data&from=${PAGE_SIZE}`);
      expect(hrefs['Previous page']).toBe(`/discover?query=data&from=${PAGE_SIZE}`);
      expect(hrefs['Next page']).toBe(`/discover?query=data&from=${3 * PAGE_SIZE}`);
    });

    it('has no "Previous" on the first page and no "Next" on the last', async () => {
      answer = () => of(page({total: 7 * PAGE_SIZE, from: 0}));
      await open('/discover');
      expect(links().some((link) => link.getAttribute('aria-label') === 'Previous page')).toBe(false);
      expect(links().some((link) => link.getAttribute('aria-label') === 'Next page')).toBe(true);

      answer = () => of(page({total: 7 * PAGE_SIZE, from: 6 * PAGE_SIZE}));
      await open(`/discover?from=${6 * PAGE_SIZE}`);
      expect(numbers()).toEqual(['3', '4', '5', '6', '7']);
      expect(links().some((link) => link.getAttribute('aria-label') === 'Next page')).toBe(false);
      expect(links().some((link) => link.getAttribute('aria-label') === 'Previous page')).toBe(true);
    });

    it('shows fewer pages when there are fewer than five', async () => {
      answer = () => of(page({total: 3 * PAGE_SIZE - 2}));
      await open('/discover');
      expect(numbers()).toEqual(['1', '2', '3']);
    });

    it('moves to the page and scrolls to the results heading', async () => {
      answer = () => of(page({total: 7 * PAGE_SIZE}));
      await open('/discover');

      await click(links().find((link) => link.textContent?.trim() === '3'));

      expect(router.url).toBe(`/discover?from=${2 * PAGE_SIZE}`);
      expect(viewport.scrollToAnchor).toHaveBeenCalledWith('sc-results');
    });
  });

  describe('a page past the end', () => {
    it('falls back to the first page, replacing the history entry', async () => {
      answer = (params) =>
        of(paramsOf(params)['from']?.[0] === '0' ? page({total: 20}) : page({total: 20, results: [], from: 90}));
      await open('/discover?query=data&from=90');

      expect(router.url).toBe('/discover?query=data');
      expect(text('.sc-search__count')).toBe('20 results');
    });

    it('does not move when the whole result is simply empty', async () => {
      answer = () => of(page({total: 0, results: []}));
      await open('/discover?from=90');

      expect(router.url).toBe('/discover?from=90');
    });
  });

  describe('the search box', () => {
    const input = () => root().querySelector<HTMLInputElement>('input.sc-search__input')!;

    it('starts with the query of the URL', async () => {
      await open('/discover?query=metadata');
      expect(component.searchControl.value).toBe('metadata');
    });

    it('puts a trimmed query in the URL, and drops the page offset', async () => {
      await open('/discover?from=18');
      component.searchControl.setValue('  open science  ', {emitEvent: false});
      component.submitQuery();
      await settle();

      expect(router.url).toBe('/discover?query=open%20science');
    });

    it('removes the query from the URL when the box is emptied', async () => {
      await open('/discover?query=data');
      component.searchControl.setValue('   ', {emitEvent: false});
      component.submitQuery();
      await settle();

      expect(router.url).toBe('/discover');
    });

    it('does nothing when the query has not changed', async () => {
      await open('/discover?query=data');
      const navigate = vi.spyOn(router, 'navigate');
      component.searchControl.setValue(' data ', {emitEvent: false});
      component.submitQuery();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('searches when the visitor stops typing', async () => {
      vi.useFakeTimers();
      await open('/discover');

      input().value = 'citations';
      input().dispatchEvent(new Event('input'));
      await vi.advanceTimersByTimeAsync(399);
      expect(router.url).toBe('/discover');

      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(router.url).toBe('/discover?query=citations');
    });

    it('follows the URL when it changes without typing, as with the back button', async () => {
      await open('/discover?query=first');
      await open('/discover?query=second');
      expect(component.searchControl.value).toBe('second');

      await open('/discover');
      expect(component.searchControl.value).toBe('');
    });

    it('keeps what the visitor typed when the URL echoes their own search back', async () => {
      await open('/discover');
      component.searchControl.setValue('data', {emitEvent: false});
      component.submitQuery();
      component.searchControl.setValue('data m', {emitEvent: false});
      await settle();

      expect(component.searchControl.value).toBe('data m');
    });
  });

  describe('the scroll position', () => {
    it('is put back after a filter click, because the app scrolls to the top on every navigation', async () => {
      await open('/discover');
      await clickFacet('Publish');

      expect(viewport.scrollToPosition).toHaveBeenCalledWith([0, 120]);
      expect(viewport.scrollToAnchor).not.toHaveBeenCalled();
    });

    it('is left alone when the navigation did not come from this page', async () => {
      await open('/discover');
      viewport.scrollToPosition.mockClear();
      await open('/discover?query=other');

      expect(viewport.scrollToPosition).not.toHaveBeenCalled();
    });
  });
});
