import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {EMPTY, Observable, forkJoin, of} from 'rxjs';
import {catchError, map, shareReplay, startWith, switchMap} from 'rxjs/operators';
import {ResourceService} from '../../../services/resource.service';
import {
  RelatedService,
  ServiceDetailView,
  Vocabularies,
  buildVocabularyLookup,
  toRelatedService,
  toServiceDetailView,
} from './service-detail.mapper';

interface AtAGlanceFact {
  label: string;
  value: string;
}

interface DetailState {
  loading: boolean;
  error: boolean;
  detail: ServiceDetailView | null;
  related: RelatedService[];
}

const LOADING: DetailState = {loading: true, error: false, detail: null, related: []};
const FAILED: DetailState = {loading: false, error: true, detail: null, related: []};

const RELATED_LIMIT = 3;

@Component({
  selector: 'app-sc-service-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.less',
})
export class ScServiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly resources = inject(ResourceService);

  private readonly serviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {initialValue: this.route.snapshot.paramMap.get('id') ?? ''},
  );

  // Fetched once and replayed for every service this component instance shows (related-service links reuse the
  // instance). A vocabulary failure falls back to raw ids rather than failing the page.
  private readonly labels$ = this.resources.getUiVocabularies().pipe(
    map((vocabularies) => buildVocabularyLookup(vocabularies as unknown as Vocabularies)),
    catchError(() => of(buildVocabularyLookup(null))),
    shareReplay(1),
  );

  // switchMap drops the in-flight load when the route id changes.
  private readonly state = toSignal(
    toObservable(this.serviceId).pipe(switchMap((id) => this.load(id))),
    {initialValue: LOADING},
  );

  readonly detail = computed(() => this.state().detail);
  readonly loading = computed(() => this.state().loading);
  readonly relatedServices = computed(() => this.state().related);

  readonly atAGlance = computed<AtAGlanceFact[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    const facts: [string, string][] = [
      ['Provider', detail.provider],
      ['Categories', detail.categories.join(', ')],
      ['Target users', detail.targetUsers.join(', ')],
      ['Access modes', detail.accessModes.join(', ')],
      ['Maturity', detail.trl !== null ? 'TRL ' + detail.trl : ''],
      ['Languages', detail.languages.join(', ')],
      ['Last update', detail.lastUpdate],
    ];
    return facts.filter(([, value]) => value).map(([label, value]) => ({label, value}));
  });

  readonly hasIdentifiers = computed(() => {
    const detail = this.detail();
    return !!detail && (!!detail.webpage || !!detail.doi);
  });

  readonly hasPolicies = computed(() => {
    const detail = this.detail();
    return !!detail && (!!detail.termsOfUse || !!detail.privacyPolicy || !!detail.accessPolicy);
  });

  private load(id: string): Observable<DetailState> {
    return forkJoin([this.resources.getServiceOrDatasource(id), this.labels$]).pipe(
      switchMap(([resource, label]) => {
        const detail = toServiceDetailView(resource, label);
        const relatedIds = (resource.relatedResources ?? []).filter((related) => related && related !== resource.id);
        const related$: Observable<RelatedService[]> = relatedIds.length
          ? this.resources.getServicesByIdArray(relatedIds).pipe(
              map((services) => services.slice(0, RELATED_LIMIT).map(toRelatedService)),
              catchError(() => of([] as RelatedService[])),
            )
          : of([]);
        return related$.pipe(map((related): DetailState => ({loading: false, error: false, detail, related})));
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          // Unknown service: leave for the not-found page, and keep the spinner up until the navigation lands.
          void this.router.navigate(['/notFound'], {replaceUrl: true});
          return EMPTY;
        }
        return of(FAILED);
      }),
      startWith(LOADING),
    );
  }
}
