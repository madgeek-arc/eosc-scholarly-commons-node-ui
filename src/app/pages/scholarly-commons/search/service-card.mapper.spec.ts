import {describe, expect, it} from 'vitest';
import {Service} from '../../../entities/eic-model';
import {Facet} from '../../../entities/facet';
import {ORDER_FULLY_OPEN, ORDER_OPEN_ACCESS, accentFor} from '../service-display';
import {FacetLabels, buildFacetLabels, toServiceCard} from './service-card.mapper';

// The entities have dozens of required fields the mapper never reads; the specs build only what it uses.
const resource = (fields: Record<string, unknown>) => fields as unknown as Service;

const facet = (field: string, values: [string, string][]): Facet =>
  ({field, label: field, values: values.map(([value, label]) => ({value, label, count: 1, isChecked: false}))}) as Facet;

describe('buildFacetLabels', () => {
  it('maps `${field}:${value}` to the facet label', () => {
    const labels = buildFacetLabels([facet('resourceProviders', [['owner-1', 'Owner One']])]);
    expect(labels.get('resourceProviders:owner-1')).toBe('Owner One');
  });

  it('keeps only the facet fields the page uses', () => {
    const labels = buildFacetLabels([
      facet('description', [['d-1', 'A long description']]),
      facet('portfolios', [['p-1', 'Publish']]),
    ]);
    expect([...labels.keys()]).toEqual(['portfolios:p-1']);
  });

  it('applies the short display forms for TRL and order type', () => {
    const labels = buildFacetLabels([
      facet('trl', [['trl-9', '9 - actual system proven in operational environment']]),
      facet('orderType', [[ORDER_FULLY_OPEN, 'Fully open access']]),
    ]);
    expect(labels.get('trl:trl-9')).toBe('TRL 9');
    expect(labels.get(`orderType:${ORDER_FULLY_OPEN}`)).toBe('Fully open');
  });

  it('copes with missing facets and facets without values', () => {
    expect(buildFacetLabels(null).size).toBe(0);
    expect(buildFacetLabels(undefined).size).toBe(0);
    expect(buildFacetLabels([{field: 'portfolios', label: 'Category'} as Facet]).size).toBe(0);
  });
});

describe('toServiceCard', () => {
  const labels: FacetLabels = new Map([
    ['resourceProviders:owner-1', 'Owner One'],
    ['portfolios:p-1', 'Publish'],
    ['targetUsers:tu-1', 'Researchers'],
    [`orderType:${ORDER_FULLY_OPEN}`, 'Fully open'],
    [`orderType:${ORDER_OPEN_ACCESS}`, 'Open access'],
  ]);

  const full = resource({
    id: '21.T1/svc-1',
    name: 'Open Archive Hub',
    tagline: 'Archive anything',
    description: '<p>The description. It has two sentences.</p>',
    resourceOwner: 'owner-1',
    targetUsers: ['tu-1', 'tu-2'],
    orderType: ORDER_FULLY_OPEN,
    logo: 'https://example.org/logo.png',
    extras: {pitch: '<p>The pitch. More words follow.</p>', portfolios: ['p-1', 'p-2']},
  });

  it('maps every field of a complete service', () => {
    expect(toServiceCard(full, labels)).toEqual({
      id: '21.T1/svc-1',
      link: ['/discover/service', '21.T1', 'svc-1'],
      name: 'Open Archive Hub',
      initials: 'Oa',
      provider: 'Owner One',
      tagline: 'Archive anything',
      shortDescription: 'The pitch.',
      category: 'Publish',
      targetUsers: ['Researchers', 'tu-2'],
      order: 'Fully open',
      isOpen: true,
      accent: accentFor('21.T1/svc-1'),
      logo: 'https://example.org/logo.png',
    });
  });

  it('falls back to the raw value when the facet has no label for it, except for the provider', () => {
    const card = toServiceCard(full, new Map());
    // The owner is a PID: with no label there is nothing readable to show, and the PID itself is not.
    expect(card.provider).toBe('');
    expect(card.category).toBe('p-1');
    expect(card.targetUsers).toEqual(['tu-1', 'tu-2']);
    expect(card.order).toBe(ORDER_FULLY_OPEN);
  });

  it('takes the short description from the pitch, then from the description', () => {
    const withoutPitch = resource({id: 'a', name: 'A', description: '<p>First sentence. Second sentence.</p>'});
    expect(toServiceCard(withoutPitch, labels).shortDescription).toBe('First sentence.');
  });

  it('ends the short description with one full stop, whether or not the text had one', () => {
    expect(toServiceCard(resource({id: 'a', name: 'A', description: 'Only one sentence.'}), labels).shortDescription).toBe(
      'Only one sentence.',
    );
    expect(toServiceCard(resource({id: 'a', name: 'A', description: 'No full stop at all'}), labels).shortDescription).toBe(
      'No full stop at all.',
    );
  });

  it('gives empty defaults to a service with only an id and a name', () => {
    expect(toServiceCard(resource({id: 'svc-2', name: 'Bare'}), labels)).toEqual({
      id: 'svc-2',
      link: ['/discover/service', 'svc-2'],
      name: 'Bare',
      initials: 'Ba',
      provider: '',
      tagline: '',
      shortDescription: '',
      category: '',
      targetUsers: [],
      order: '',
      isOpen: false,
      accent: accentFor('svc-2'),
      logo: null,
    });
  });

  it('marks only the fully open order type as open', () => {
    const openAccess = resource({id: 'a', name: 'A', orderType: ORDER_OPEN_ACCESS});
    const card = toServiceCard(openAccess, labels);
    expect(card.isOpen).toBe(false);
    expect(card.order).toBe('Open access');
  });
});
