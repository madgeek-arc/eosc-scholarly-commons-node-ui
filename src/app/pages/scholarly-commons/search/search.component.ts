import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {ScTopMenuComponent} from '../../../shared/scholarly-commons/top-menu/top-menu.component';
import {ScFooterComponent} from '../../../shared/scholarly-commons/footer/footer.component';
import {
  FACET_GROUPS,
  FacetGroupId,
  POPULAR_SEARCHES,
  SERVICES,
  ServiceSummary,
  TASK_SHORTCUTS,
  TaskShortcut,
  facetValues,
} from '../services-data';

interface ResultView {
  service: ServiceSummary;
  shortDescription: string;
}

interface FacetItem {
  key: string;
  label: string;
  active: boolean;
}

interface FacetGroupView {
  id: FacetGroupId;
  label: string;
  items: FacetItem[];
}

@Component({
  selector: 'app-sc-search',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ScTopMenuComponent, ScFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.component.html',
  styleUrl: './search.component.less',
})
export class ScSearchComponent {
  readonly searchControl = new FormControl('', {nonNullable: true});
  readonly query = toSignal(this.searchControl.valueChanges, {initialValue: ''});

  readonly selectedFacets = signal<string[]>([]);
  readonly activeTask = signal<TaskShortcut | null>(null);

  readonly popularSearches = POPULAR_SEARCHES;
  readonly taskShortcuts = TASK_SHORTCUTS;

  readonly totalCount = SERVICES.length;

  readonly results = computed<ResultView[]>(() => {
    const q = this.query().trim().toLowerCase();
    const selected = this.selectedFacets();
    return SERVICES.filter((service) => {
      if (q && !`${service.name} ${service.tagline} ${service.description} ${service.category}`.toLowerCase().includes(q)) {
        return false;
      }
      return FACET_GROUPS.every(({id}) => {
        const picked = selected.filter((key) => key.startsWith(id + ':')).map((key) => key.slice(id.length + 1));
        if (!picked.length) {
          return true;
        }
        return facetValues(service, id).some((value) => picked.includes(value));
      });
    }).map((service) => ({
      service,
      shortDescription: service.description.split('. ')[0].replace(/\.$/, '') + '.',
    }));
  });

  readonly hasFilters = computed(() => this.query().length > 0 || this.selectedFacets().length > 0);

  readonly heading = computed(() => {
    const task = this.activeTask();
    if (task) {
      return task.title;
    }
    return this.hasFilters() ? 'Matching services' : 'All services';
  });

  readonly facetGroups = computed<FacetGroupView[]>(() => {
    const selected = this.selectedFacets();
    return FACET_GROUPS.map(({id, label}) => {
      const seen: string[] = [];
      for (const service of SERVICES) {
        for (const value of facetValues(service, id)) {
          if (!seen.includes(value)) {
            seen.push(value);
          }
        }
      }
      return {
        id,
        label,
        items: seen.map((value) => {
          const key = `${id}:${value}`;
          return {key, label: value, active: selected.includes(key)};
        }),
      };
    });
  });

  toggleFacet(key: string): void {
    this.activeTask.set(null);
    this.selectedFacets.update((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  }

  pickSuggestion(term: string): void {
    this.activeTask.set(null);
    this.selectedFacets.set([]);
    this.searchControl.setValue(term);
  }

  selectTask(task: TaskShortcut): void {
    this.searchControl.setValue('');
    this.selectedFacets.set([`category:${task.categoryFilter}`]);
    this.activeTask.set(task);
  }

  clearAll(): void {
    this.searchControl.setValue('');
    this.selectedFacets.set([]);
    this.activeTask.set(null);
  }
}
