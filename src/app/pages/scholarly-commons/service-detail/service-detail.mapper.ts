import {Datasource, Service} from '../../../entities/eic-model';
import {
  accentFor,
  displayLabel,
  htmlToText,
  initialsOf,
  logoOf,
  safeUrl,
  summarizeList,
} from '../service-display';

export interface ServiceBenefit {
  title: string;
  description: string;
}

export interface ServiceUseCase {
  title: string;
  description: string;
  image: string | null;
}

export interface ServiceResource {
  title: string;
  description: string;
  // Top-level catalogue fields are the EOSC schema; everything under `extras` is OpenAIRE's own addition.
  origin: 'EOSC field' | 'OpenAIRE extension';
  url: string;
}

export interface RelatedService {
  id: string;
  name: string;
  tagline: string;
  logo: string | null;
  initials: string;
}

// Everything the detail template renders. Link fields are '' when absent or not a web/mailto URL.
export interface ServiceDetailView {
  id: string;
  name: string;
  abbreviation: string;
  initials: string;
  accent: 'teal' | 'pink';
  logo: string | null;
  tagline: string;
  description: string;
  provider: string;
  category: string;
  categories: string[];
  targetUsers: string[];
  targetUsersSummary: string;
  order: string;
  trl: number | null;
  languages: string[];
  languagesSummary: string;
  accessModes: string[];
  lastUpdate: string;
  webpage: string;
  userManual: string;
  helpdesk: string;
  termsOfUse: string;
  privacyPolicy: string;
  accessPolicy: string;
  doi: string;
  benefits: ServiceBenefit[];
  useCases: ServiceUseCase[];
  resources: ServiceResource[];
  tags: string[];
}

// `GET /vocabularies/mappings` returns { [vocabulary type]: entries[] }, although ResourceService types it as a Map.
export type Vocabularies = Record<string, {id: string; name: string}[]>;
export type VocabularyLookup = (type: string, id: string) => string;

// Resolves an id within one vocabulary type to its name, falling back to the id itself so a missing or
// unloaded vocabulary degrades to raw ids instead of blanks.
export function buildVocabularyLookup(vocabularies: Vocabularies | null | undefined): VocabularyLookup {
  const index = new Map<string, Map<string, string>>();
  for (const [type, entries] of Object.entries(vocabularies ?? {})) {
    index.set(type, new Map((entries ?? []).map((entry) => [entry.id, entry.name] as const)));
  }
  return (type, id) => index.get(type)?.get(id) ?? id;
}

// `Service.extras` is typed `object` in the entity; these are the keys this page reads.
interface DetailExtras {
  pitch?: string;
  portfolios?: string[];
  benefits?: {benefitsTitle?: string; benefitsText?: string}[];
  useCasesExtras?: {useCaseTitle?: string; useCaseText?: string; useCaseImage?: string}[];
  git?: string[];
  [key: string]: unknown;
}

interface ResourceField {
  key: string;
  title: string;
  description: string;
}

// Only documentation / training / support links. Marketing material (pitch deck, media kit, podcast,
// promotion videos, news) is deliberately left out of the "Documentation, training and support" panel.
const EOSC_RESOURCE_FIELDS: ResourceField[] = [
  {key: 'userManual', title: 'User manual', description: 'Full documentation of the service'},
  {key: 'helpdeskPage', title: 'Helpdesk', description: 'Contact the service support team'},
  {key: 'trainingInformation', title: 'Training information', description: 'Courses and training material'},
  {key: 'statusMonitoring', title: 'Status monitoring', description: 'Current availability of the service'},
];

const EXTRA_RESOURCE_FIELDS: ResourceField[] = [
  {key: 'documentation', title: 'Documentation', description: 'Technical and getting-started documentation'},
  {key: 'guides', title: 'Guides', description: 'Step-by-step user guides'},
  {key: 'tutorials', title: 'Tutorials', description: 'Hands-on tutorials'},
  {key: 'webinars', title: 'Webinars', description: 'Recorded and upcoming webinars'},
  {key: 'faqs', title: 'FAQ', description: 'Common questions from users'},
  {key: 'glossary', title: 'Glossary', description: 'Terms used by the service'},
  {key: 'factsheets', title: 'Fact sheets', description: 'Short overviews of the service'},
  {key: 'ebook', title: 'E-book', description: 'In-depth guide as a downloadable e-book'},
  {key: 'roadmap', title: 'Roadmap', description: 'What is planned for the next releases'},
];

export function toServiceDetailView(resource: Service | Datasource, label: VocabularyLookup): ServiceDetailView {
  const extras = (resource.extras ?? {}) as DetailExtras;
  const portfolios = (extras.portfolios ?? []).filter(Boolean).map((id) => label('Portfolios', id));
  const targetUsers = (resource.targetUsers ?? []).filter(Boolean).map((id) => label('Target user', id));
  const languages = (resource.languageAvailabilities ?? []).filter(Boolean).map((code) => label('Language', code));
  const trlLevel = /^trl-(\d+)/.exec(resource.trl ?? '')?.[1];
  const top = resource as unknown as Record<string, unknown>;

  return {
    id: resource.id,
    name: resource.name,
    abbreviation: resource.abbreviation ?? '',
    initials: initialsOf(resource.name),
    accent: accentFor(resource.id),
    logo: logoOf(resource.logo),
    tagline: resource.tagline ?? '',
    description: htmlToText(extras.pitch || resource.description || ''),
    provider: resource.resourceOrganisation ? label('resourceProviders', resource.resourceOrganisation) : '',
    category: portfolios[0] ?? '',
    categories: portfolios,
    targetUsers,
    targetUsersSummary: summarizeList(targetUsers),
    order: resource.orderType
      ? displayLabel('order_type', resource.orderType, label('Order type', resource.orderType))
      : '',
    trl: trlLevel ? Number(trlLevel) : null,
    languages,
    languagesSummary: summarizeList(languages),
    accessModes: (resource.accessModes ?? []).filter(Boolean).map((id) => label('Access mode', id)),
    lastUpdate: formatDate(resource.lastUpdate),
    webpage: safeUrl(resource.webpage),
    userManual: safeUrl(top['userManual']),
    helpdesk: safeUrl(top['helpdeskPage']) || (resource.helpdeskEmail ? safeUrl('mailto:' + resource.helpdeskEmail) : ''),
    termsOfUse: safeUrl(top['termsOfUse']),
    privacyPolicy: safeUrl(top['privacyPolicy']),
    accessPolicy: safeUrl(top['accessPolicy']),
    doi: doiOf(top['alternativeIdentifiers']),
    benefits: (extras.benefits ?? [])
      .filter((benefit) => benefit?.benefitsTitle)
      .map((benefit) => ({title: benefit.benefitsTitle ?? '', description: benefit.benefitsText ?? ''})),
    useCases: (extras.useCasesExtras ?? [])
      .filter((useCase) => useCase?.useCaseTitle)
      .map((useCase) => ({
        title: useCase.useCaseTitle ?? '',
        description: useCase.useCaseText ?? '',
        image: safeUrl(useCase.useCaseImage) || null,
      })),
    resources: collectResources(top, extras),
    tags: (resource.tags ?? []).filter(Boolean),
  };
}

export function toRelatedService(resource: Service): RelatedService {
  return {
    id: resource.id,
    name: resource.name,
    tagline: resource.tagline ?? '',
    logo: logoOf(resource.logo),
    initials: initialsOf(resource.name),
  };
}

// EOSC fields come first so that when both schemas link to the same page (e.g. `userManual` and `extras.guides`)
// the entry shown is the EOSC one.
function collectResources(top: Record<string, unknown>, extras: DetailExtras): ServiceResource[] {
  const resources: ServiceResource[] = [];
  const seen = new Set<string>();
  const add = (title: string, description: string, origin: ServiceResource['origin'], value: unknown) => {
    const url = safeUrl(value);
    if (url && !seen.has(url)) {
      seen.add(url);
      resources.push({title, description, origin, url});
    }
  };
  for (const field of EOSC_RESOURCE_FIELDS) {
    add(field.title, field.description, 'EOSC field', top[field.key]);
  }
  for (const field of EXTRA_RESOURCE_FIELDS) {
    add(field.title, field.description, 'OpenAIRE extension', extras[field.key]);
  }
  for (const url of Array.isArray(extras.git) ? extras.git : []) {
    add('Source code', 'Public code repository', 'OpenAIRE extension', url);
  }
  return resources;
}

// The identifier list was null on every service sampled, so its shape is read defensively
// (entries of {type, value}); a missing or differently shaped list simply yields no DOI.
function doiOf(identifiers: unknown): string {
  if (!Array.isArray(identifiers)) {
    return '';
  }
  const doi = identifiers.find((entry) => /doi/i.test(String(entry?.type ?? '')));
  return typeof doi?.value === 'string' ? doi.value : '';
}

// UTC so that a midnight-UTC timestamp doesn't render as the previous day west of Greenwich.
function formatDate(value: string | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(date);
}
