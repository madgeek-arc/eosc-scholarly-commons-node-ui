import {Datasource, Service} from '../../../entities/eic-model';
import {Facet} from '../../../entities/facet';
import {ORDER_FULLY_OPEN, accentFor, displayLabel, htmlToText, initialsOf, logoOf} from '../service-display';
import {FACET_GROUPS} from './facet-groups';

// View model for one result card, mapped from a catalogue-resources `Service | Datasource`.
export interface ServiceCard {
  id: string;
  name: string;
  initials: string;
  provider: string;
  tagline: string;
  shortDescription: string;
  category: string;
  targetUsers: string[];
  order: string;
  isOpen: boolean;
  accent: 'teal' | 'pink';
  logo: string | null;
}

// Facet values are resolved to labels with this lookup, keyed `${facetField}:${value}`.
export type FacetLabels = ReadonlyMap<string, string>;

// `Service.extras` is typed `object` in the entity; these are the keys the card reads.
interface ServiceExtras {
  pitch?: string;
  portfolios?: string[];
}

const labelKey = (field: string, value: string) => `${field}:${value}`;

// Only the facet fields the page uses are indexed; others (e.g. `description`) carry every distinct value.
export function buildFacetLabels(facets: Facet[] | null | undefined): FacetLabels {
  const wanted = new Set(FACET_GROUPS.map((group) => group.apiField));
  const labels = new Map<string, string>();
  for (const facet of facets ?? []) {
    if (!wanted.has(facet.field)) {
      continue;
    }
    for (const entry of facet.values ?? []) {
      labels.set(labelKey(facet.field, entry.value), displayLabel(facet.field, entry.value, entry.label));
    }
  }
  return labels;
}

export function toServiceCard(resource: Service | Datasource, labels: FacetLabels): ServiceCard {
  const extras = (resource.extras ?? {}) as ServiceExtras;
  const labelOf = (field: string, value: string) => labels.get(labelKey(field, value)) ?? value;
  const category = extras.portfolios?.[0];
  const description = htmlToText(extras.pitch || resource.description || '');

  return {
    id: resource.id,
    name: resource.name,
    initials: initialsOf(resource.name),
    provider: resource.resourceOrganisation ? labelOf('resource_organisation', resource.resourceOrganisation) : '',
    tagline: resource.tagline ?? '',
    shortDescription: firstSentence(description),
    category: category ? labelOf('portfolios', category) : '',
    targetUsers: (resource.targetUsers ?? []).map((value) => labelOf('target_users', value)),
    order: resource.orderType ? labelOf('order_type', resource.orderType) : '',
    isOpen: resource.orderType === ORDER_FULLY_OPEN,
    accent: accentFor(resource.id),
    logo: logoOf(resource.logo),
  };
}

function firstSentence(text: string): string {
  if (!text) {
    return '';
  }
  return text.split('. ')[0].replace(/\.$/, '') + '.';
}
