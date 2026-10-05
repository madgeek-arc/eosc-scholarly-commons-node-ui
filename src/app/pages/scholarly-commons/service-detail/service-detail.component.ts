import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {map} from 'rxjs/operators';
import {ScTopMenuComponent} from '../../../shared/scholarly-commons/top-menu/top-menu.component';
import {ScFooterComponent} from '../../../shared/scholarly-commons/footer/footer.component';
import {SERVICES, ServiceDetail, ServiceSummary, toServiceDetail} from '../services-data';

interface AtAGlanceFact {
  label: string;
  value: string;
}

interface RelatedService {
  id: string;
  name: string;
  tagline: string;
  logo?: string;
  initials: string;
}

@Component({
  selector: 'app-sc-service-detail',
  standalone: true,
  imports: [RouterLink, ScTopMenuComponent, ScFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.less',
})
export class ScServiceDetailComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly serviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {initialValue: this.route.snapshot.paramMap.get('id') ?? ''},
  );

  readonly detail = computed<ServiceDetail | null>(() => {
    const summary = SERVICES.find((service) => service.id === this.serviceId());
    return summary ? toServiceDetail(summary) : null;
  });

  readonly atAGlance = computed<AtAGlanceFact[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    const facts: AtAGlanceFact[] = [
      {label: 'Provider', value: detail.provider},
      {label: 'Categories', value: detail.category},
      {label: 'Target users', value: detail.targetUsers.join(', ')},
      {label: 'Access modes', value: detail.order},
      {label: 'Maturity', value: 'TRL ' + detail.trl},
      {label: 'Languages', value: detail.languages},
    ];
    if (detail.lastUpdate) {
      facts.push({label: 'Last update', value: detail.lastUpdate});
    }
    return facts;
  });

  readonly relatedServices = computed<RelatedService[]>(() => {
    const detail = this.detail();
    if (!detail) {
      return [];
    }
    const others = SERVICES.filter((service) => service.id !== detail.id);
    const sameCategory = others.filter((service) => service.category === detail.category);
    const picked = (sameCategory.length ? sameCategory : others).slice(0, 3);
    return picked.map((service: ServiceSummary) => ({
      id: service.id,
      name: service.name,
      tagline: service.tagline,
      logo: service.logo,
      initials: service.initials,
    }));
  });

  readonly hasIdentifiers = computed(() => {
    const detail = this.detail();
    return !!detail && (!!detail.webpage || !!detail.doi);
  });
}
