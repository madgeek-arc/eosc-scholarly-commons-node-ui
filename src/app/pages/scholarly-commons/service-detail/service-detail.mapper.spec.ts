import {describe, expect, it} from 'vitest';
import {Datasource, Service} from '../../../entities/eic-model';
import {ORDER_REQUIRED, accentFor} from '../service-display';
import {
  VocabularyLookup,
  buildVocabularyLookup,
  toRelatedService,
  toServiceDetailView,
} from './service-detail.mapper';

const resource = (fields: Record<string, unknown>) => fields as unknown as Service;

// Shows which vocabulary type each field is looked up in: "Type:id".
const echo: VocabularyLookup = (type, id) => `${type}:${id}`;

describe('buildVocabularyLookup', () => {
  const lookup = buildVocabularyLookup({
    Language: [{id: 'en', name: 'English'}, {id: 'el', name: 'Greek'}],
    'Access mode': [{id: 'free', name: 'Free'}],
  });

  it('resolves an id to its name within one vocabulary type', () => {
    expect(lookup('Language', 'en')).toBe('English');
    expect(lookup('Access mode', 'free')).toBe('Free');
  });

  it('does not mix up ids between types', () => {
    expect(lookup('Access mode', 'en')).toBe('en');
  });

  it('falls back to the id for an unknown type or id', () => {
    expect(lookup('Nope', 'en')).toBe('en');
    expect(lookup('Language', 'fr')).toBe('fr');
  });

  it('falls back to the id when there are no vocabularies at all', () => {
    expect(buildVocabularyLookup(null)('Language', 'en')).toBe('en');
    expect(buildVocabularyLookup(undefined)('Language', 'en')).toBe('en');
    expect(buildVocabularyLookup({Language: null as unknown as []})('Language', 'en')).toBe('en');
  });
});

describe('toServiceDetailView', () => {
  const full = resource({
    id: 'svc-9',
    name: 'Data Safe Vault',
    abbreviation: 'DSV',
    tagline: 'Keeps data safe',
    description: '<p>The full description.</p>',
    resourceOrganisation: 'org-1',
    targetUsers: ['tu-1', 'tu-2', 'tu-3', 'tu-4', ''],
    languageAvailabilities: ['en', 'el'],
    accessModes: ['am-1'],
    orderType: ORDER_REQUIRED,
    trl: 'trl-7',
    logo: 'https://example.org/logo.png',
    lastUpdate: '2026-03-09T00:00:00Z',
    webpage: 'https://example.org',
    userManual: 'https://example.org/manual',
    helpdeskPage: '',
    helpdeskEmail: 'help@example.org',
    termsOfUse: 'https://example.org/terms',
    privacyPolicy: 'javascript:alert(1)',
    accessPolicy: '',
    alternativeIdentifiers: [
      {type: 'EOSC PID', value: 'pid-1'},
      {type: 'DOI', value: '10.1234/abc'},
    ],
    tags: ['open', '', 'science'],
    extras: {
      pitch: '<p>The pitch.</p>',
      portfolios: ['p-1', '', 'p-2'],
      benefits: [{benefitsTitle: 'Fast', benefitsText: 'Quick results'}, {benefitsText: 'No title, so dropped'}],
      useCasesExtras: [
        {useCaseTitle: 'Case', useCaseText: 'Text', useCaseImage: 'https://example.org/case.png'},
        {useCaseTitle: 'No image'},
        {useCaseText: 'No title, so dropped'},
      ],
      documentation: 'https://example.org/docs',
      guides: 'https://example.org/manual',
      git: ['https://git.example.org/repo'],
    },
  });

  const view = toServiceDetailView(full, echo);

  it('maps the identity fields', () => {
    expect(view).toMatchObject({
      id: 'svc-9',
      name: 'Data Safe Vault',
      abbreviation: 'DSV',
      initials: 'Ds',
      accent: accentFor('svc-9'),
      logo: 'https://example.org/logo.png',
      tagline: 'Keeps data safe',
      tags: ['open', 'science'],
    });
  });

  it('prefers the pitch over the description, as plain text', () => {
    expect(view.description).toBe('The pitch.');
    const noPitch = toServiceDetailView(resource({id: 'a', name: 'A', description: '<p>Only <b>this</b>.</p>'}), echo);
    expect(noPitch.description).toBe('Only this.');
  });

  it('looks each field up in its own vocabulary type', () => {
    expect(view.provider).toBe('resourceProviders:org-1');
    expect(view.categories).toEqual(['Portfolios:p-1', 'Portfolios:p-2']);
    expect(view.category).toBe('Portfolios:p-1');
    expect(view.languages).toEqual(['Language:en', 'Language:el']);
    expect(view.accessModes).toEqual(['Access mode:am-1']);
  });

  it('drops blank entries and summarises long lists', () => {
    expect(view.targetUsers).toHaveLength(4);
    expect(view.targetUsersSummary).toBe('Target user:tu-1, Target user:tu-2, Target user:tu-3 +1');
    expect(view.languagesSummary).toBe('Language:en, Language:el');
  });

  it('shows the short form of the order type', () => {
    expect(view.order).toBe('Order required');
  });

  it('reads the TRL level as a number', () => {
    expect(view.trl).toBe(7);
    expect(toServiceDetailView(resource({id: 'a', name: 'A', trl: 'trl-12'}), echo).trl).toBe(12);
    expect(toServiceDetailView(resource({id: 'a', name: 'A', trl: 'unknown'}), echo).trl).toBeNull();
    expect(toServiceDetailView(resource({id: 'a', name: 'A'}), echo).trl).toBeNull();
  });

  it('formats the last update in UTC, so midnight UTC stays on its own day', () => {
    expect(view.lastUpdate).toBe('9 March 2026');
  });

  it.each([
    ['a missing date', undefined],
    ['an unreadable date', 'not a date'],
  ])('leaves the last update empty for %s', (_label, lastUpdate) => {
    expect(toServiceDetailView(resource({id: 'a', name: 'A', lastUpdate}), echo).lastUpdate).toBe('');
  });

  it('keeps web links and empties anything else', () => {
    expect(view.webpage).toBe('https://example.org');
    expect(view.userManual).toBe('https://example.org/manual');
    expect(view.termsOfUse).toBe('https://example.org/terms');
    expect(view.privacyPolicy).toBe('');
    expect(view.accessPolicy).toBe('');
  });

  it('uses the helpdesk page, then the helpdesk e-mail, then nothing', () => {
    expect(view.helpdesk).toBe('mailto:help@example.org');
    const withPage = resource({id: 'a', name: 'A', helpdeskPage: 'https://example.org/help', helpdeskEmail: 'x@example.org'});
    expect(toServiceDetailView(withPage, echo).helpdesk).toBe('https://example.org/help');
    expect(toServiceDetailView(resource({id: 'a', name: 'A'}), echo).helpdesk).toBe('');
  });

  it('finds the DOI among the alternative identifiers', () => {
    expect(view.doi).toBe('10.1234/abc');
  });

  it.each([
    ['no identifiers', undefined],
    ['null', null],
    ['a value that is not a list', 'doi:10.1/x'],
    ['identifiers without a DOI', [{type: 'EOSC PID', value: 'pid-1'}]],
    ['a DOI entry without a text value', [{type: 'DOI', value: 42}]],
  ])('returns no DOI for %s', (_label, alternativeIdentifiers) => {
    expect(toServiceDetailView(resource({id: 'a', name: 'A', alternativeIdentifiers}), echo).doi).toBe('');
  });

  it('keeps benefits and use cases that have a title', () => {
    expect(view.benefits).toEqual([{title: 'Fast', description: 'Quick results'}]);
    expect(view.useCases).toEqual([
      {title: 'Case', description: 'Text', image: 'https://example.org/case.png'},
      {title: 'No image', description: '', image: null},
    ]);
  });

  it('lists the documentation links, EOSC fields first, without repeating a URL', () => {
    expect(view.resources).toEqual([
      {title: 'User manual', description: 'Full documentation of the service', origin: 'EOSC field', url: 'https://example.org/manual'},
      {title: 'Documentation', description: 'Technical and getting-started documentation', origin: 'OpenAIRE extension', url: 'https://example.org/docs'},
      {title: 'Source code', description: 'Public code repository', origin: 'OpenAIRE extension', url: 'https://git.example.org/repo'},
    ]);
  });

  it('gives empty defaults to a service with only an id and a name', () => {
    expect(toServiceDetailView(resource({id: 'svc-2', name: 'Bare'}), echo)).toEqual({
      id: 'svc-2',
      name: 'Bare',
      abbreviation: '',
      initials: 'Ba',
      accent: accentFor('svc-2'),
      logo: null,
      tagline: '',
      description: '',
      provider: '',
      category: '',
      categories: [],
      targetUsers: [],
      targetUsersSummary: '',
      order: '',
      trl: null,
      languages: [],
      languagesSummary: '',
      accessModes: [],
      lastUpdate: '',
      webpage: '',
      userManual: '',
      helpdesk: '',
      termsOfUse: '',
      privacyPolicy: '',
      accessPolicy: '',
      doi: '',
      benefits: [],
      useCases: [],
      resources: [],
      tags: [],
    });
  });

  it('reads datasources the same way', () => {
    const datasource = {id: 'ds-1', name: 'Some Datasource'} as unknown as Datasource;
    expect(toServiceDetailView(datasource, echo)).toMatchObject({id: 'ds-1', name: 'Some Datasource'});
  });
});

describe('toRelatedService', () => {
  it('keeps the fields a related-service card shows', () => {
    const related = resource({id: 'svc-3', name: 'Review Desk', tagline: 'Reviews', logo: 'https://example.org/l.png'});
    expect(toRelatedService(related)).toEqual({
      id: 'svc-3',
      name: 'Review Desk',
      tagline: 'Reviews',
      logo: 'https://example.org/l.png',
      initials: 'Rd',
    });
  });

  it('gives an empty tagline and no logo when the service has none', () => {
    expect(toRelatedService(resource({id: 'svc-4', name: 'Plain'}))).toMatchObject({tagline: '', logo: null});
  });
});
