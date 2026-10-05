import {ChangeDetectionStrategy, Component, computed, effect, inject} from '@angular/core';
import {ViewportScroller} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, NavigationEnd, Params, Router, RouterLink} from '@angular/router';
import {of} from 'rxjs';
import {catchError, debounceTime, defaultIfEmpty, filter, map, scan, startWith, switchMap} from 'rxjs/operators';
import {Datasource, Service} from '../../../entities/eic-model';
import {Paging} from '../../../entities/paging';
import {URLParameter} from '../../../entities/url-parameter';
import {ResourceService} from '../../../services/resource.service';
import {POPULAR_SEARCHES, TASK_SHORTCUTS, TaskShortcut} from '../services-data';
import {CATEGORY_FIELD, FACET_GROUPS, FacetGroupId, PAGE_SIZE} from './facet-groups';
import {displayLabel} from '../service-display';
import {ServiceCard, buildFacetLabels, toServiceCard} from './service-card.mapper';

interface FacetItem {
  value: string;
  label: string;
  active: boolean;
}

interface FacetGroupView {
  id: FacetGroupId;
  label: string;
  apiField: string;
  items: FacetItem[];
}

interface PagerPage {
  number: number;
  from: number | null;
  active: boolean;
}

interface PagerView {
  pages: PagerPage[];
  hasPrevious: boolean;
  hasNext: boolean;
  previousFrom: number | null;
  nextFrom: number;
}

interface SearchState {
  loading: boolean;
  error: boolean;
  paging: Paging<Service | Datasource> | null;
  // Total of the unfiltered catalogue; only updated by responses to requests that had no query/facets.
  catalogueTotal: number | null;
}

const INITIAL_STATE: SearchState = {loading: true, error: false, paging: null, catalogueTotal: null};

// Pages shown on each side of the current one in the pager.
const PAGER_RADIUS = 2;

// A query-param patch that removes every facet filter.
const CLEARED_FACETS: Params = Object.fromEntries(FACET_GROUPS.map(({apiField}) => [apiField, null]));

// `from` is the first result's offset; page 1 is represented by dropping the param.
const pageFrom = (page: number): number | null => (page > 1 ? (page - 1) * PAGE_SIZE : null);

const isFiltered = (params: URLParameter[]): boolean =>
  params.some(({key}) => key !== 'quantity' && key !== 'from');

@Component({
  selector: 'app-sc-search',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.component.html',
  styleUrl: './search.component.less',
})
export class ScSearchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resources = inject(ResourceService);
  private readonly viewport = inject(ViewportScroller);

  readonly popularSearches = POPULAR_SEARCHES;
  readonly taskShortcuts = TASK_SHORTCUTS;

  // The URL query string is the single source of truth for query, facets and page; everything below is derived.
  private readonly params = toSignal(this.route.queryParamMap, {initialValue: this.route.snapshot.queryParamMap});

  readonly query = computed(() => this.params().get('query') ?? '');
  private readonly from = computed(() => Math.max(0, Number(this.params().get('from')) || 0));
  private readonly selected = computed(
    () => new Map(FACET_GROUPS.map(({apiField}) => [apiField, this.params().getAll(apiField)] as const)),
  );

  private readonly requestParams = computed<URLParameter[]>(() => {
    const params: URLParameter[] = [
      {key: 'quantity', values: [String(PAGE_SIZE)]},
      {key: 'from', values: [String(this.from())]},
    ];
    if (this.query()) {
      params.push({key: 'query', values: [this.query()]});
    }
    for (const {apiField} of FACET_GROUPS) {
      const values = this.selected().get(apiField);
      if (values?.length) {
        params.push({key: apiField, values});
      }
    }
    return params;
  });

  // switchMap cancels a superseded request; scan keeps the previous results on screen while the next load runs.
  private readonly state = toSignal(
    toObservable(this.requestParams).pipe(
      switchMap((params) => {
        const filtered = isFiltered(params);
        return this.resources.searchWithDatasource(params).pipe(
          // For status-0 (network) failures AuthenticationInterceptor swallows the error and completes without
          // emitting; map that to the error state rather than leaving the page loading forever.
          defaultIfEmpty(null),
          map((paging) =>
            paging
              ? {loading: false, error: false, paging, ...(filtered ? {} : {catalogueTotal: paging.total})}
              : {loading: false, error: true, paging: null},
          ),
          catchError(() => of({loading: false, error: true, paging: null})),
          startWith({loading: true}),
        );
      }),
      scan((state: SearchState, patch: Partial<SearchState>) => ({...state, ...patch}), INITIAL_STATE),
    ),
    {initialValue: INITIAL_STATE},
  );

  private readonly paging = computed(() => this.state().paging);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly catalogueTotal = computed(() => this.state().catalogueTotal);
  readonly total = computed(() => this.paging()?.total ?? 0);

  readonly results = computed<ServiceCard[]>(() => {
    const paging = this.paging();
    if (!paging) {
      return [];
    }
    const labels = buildFacetLabels(paging.facets);
    return paging.results.map((resource) => toServiceCard(resource, labels));
  });

  readonly hasFilters = computed(
    () => this.query().length > 0 || FACET_GROUPS.some(({apiField}) => this.selected().get(apiField)?.length),
  );

  // A task card is "active" while it is the only filter in effect, so back/forward and reloads keep the heading right.
  readonly activeTask = computed<TaskShortcut | null>(() => {
    if (this.query()) {
      return null;
    }
    const picked = FACET_GROUPS.flatMap(({apiField}) =>
      (this.selected().get(apiField) ?? []).map((value) => ({apiField, value})),
    );
    if (picked.length !== 1 || picked[0].apiField !== CATEGORY_FIELD) {
      return null;
    }
    return TASK_SHORTCUTS.find((task) => task.categoryFilter === picked[0].value) ?? null;
  });

  readonly heading = computed(() => {
    const task = this.activeTask();
    if (task) {
      return task.title;
    }
    return this.hasFilters() ? 'Matching services' : 'All services';
  });

  readonly facetGroups = computed<FacetGroupView[]>(() => {
    const facets = this.paging()?.facets ?? [];
    const selected = this.selected();
    return FACET_GROUPS.map(({id, label, apiField}) => {
      const active = selected.get(apiField) ?? [];
      const values = facets.find((facet) => facet.field === apiField)?.values ?? [];
      return {
        id,
        label,
        apiField,
        items: values.map((entry) => ({
          value: entry.value,
          label: displayLabel(apiField, entry.value, entry.label),
          active: active.includes(entry.value),
        })),
      };
    }).filter((group) => group.items.length > 0);
  });

  readonly pager = computed<PagerView | null>(() => {
    const paging = this.paging();
    if (!paging) {
      return null;
    }
    const totalPages = Math.ceil(paging.total / PAGE_SIZE);
    if (totalPages <= 1) {
      return null;
    }
    const current = Math.floor(paging.from / PAGE_SIZE) + 1;
    const first = Math.max(1, Math.min(current - PAGER_RADIUS, totalPages - 2 * PAGER_RADIUS));
    const last = Math.min(totalPages, first + 2 * PAGER_RADIUS);
    const pages: PagerPage[] = [];
    for (let number = first; number <= last; number++) {
      pages.push({number, from: pageFrom(number), active: number === current});
    }
    return {
      pages,
      hasPrevious: current > 1,
      hasNext: current < totalPages,
      previousFrom: pageFrom(current - 1),
      nextFrom: current * PAGE_SIZE,
    };
  });

  readonly searchControl = new FormControl(this.route.snapshot.queryParamMap.get('query') ?? '', {nonNullable: true});

  // The query the input and the URL last agreed on. Lets the URL -> input sync below skip echoes of the user's
  // own typing, so a keystroke made while a navigation is in flight is never overwritten.
  private syncedQuery = this.searchControl.value.trim();

  private readonly typing = this.searchControl.valueChanges
    .pipe(debounceTime(400), takeUntilDestroyed())
    .subscribe(() => this.submitQuery());

  // Back/forward, "Clear", suggestion and task picks change the URL without typing: reflect them in the input.
  private readonly syncInput = effect(() => {
    const query = this.query();
    if (query !== this.syncedQuery) {
      this.searchControl.setValue(query, {emitEvent: false});
    }
    this.syncedQuery = query;
  });

  // AppComponent calls window.scrollTo(0, 0) on every NavigationEnd, query-string-only changes included, which
  // would throw the user to the top after each facet click or page change. This component's own navigations
  // record where the view should end up (`pendingScroll`) and put it back once navigation finishes. Router
  // events reach subscribers in subscription order and AppComponent subscribed first, so this runs after it.
  private pendingScroll: 'results' | number | null = null;

  private readonly restoreScroll = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed())
    .subscribe(() => {
      const target = this.pendingScroll;
      this.pendingScroll = null;
      if (target === 'results') {
        this.viewport.scrollToAnchor('sc-results');
      } else if (target !== null) {
        this.viewport.scrollToPosition([0, target]);
      }
    });

  // A stale or hand-edited `from` past the last page returns no results although `total` is positive. Fall back to
  // the first page (replacing the history entry) instead of showing "no services match" next to "N results".
  private readonly clampPage = effect(() => {
    const paging = this.paging();
    if (paging && !this.loading() && paging.total > 0 && paging.results.length === 0 && this.from() > 0) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {from: null},
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  });

  submitQuery(): void {
    const query = this.searchControl.value.trim();
    if (query === this.syncedQuery) {
      return;
    }
    this.syncedQuery = query;
    this.navigate({query: query || null});
  }

  toggleFacet(apiField: string, value: string): void {
    const current = this.selected().get(apiField) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.navigate({[apiField]: next.length ? next : null});
  }

  pickSuggestion(term: string): void {
    this.navigate({...CLEARED_FACETS, query: term});
  }

  selectTask(task: TaskShortcut): void {
    this.navigate({...CLEARED_FACETS, query: null, [CATEGORY_FIELD]: [task.categoryFilter]});
  }

  clearAll(): void {
    this.navigate({...CLEARED_FACETS, query: null});
  }

  // The pager links are plain routerLinks; this only records that the navigation they trigger should land on
  // the results heading (see `restoreScroll`).
  showResultsAfterNavigation(): void {
    this.pendingScroll = 'results';
  }

  // Every query or filter change restarts at the first page.
  private navigate(patch: Params): void {
    this.pendingScroll = this.viewport.getScrollPosition()[1];
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {...patch, from: null},
      queryParamsHandling: 'merge',
    });
  }
}
