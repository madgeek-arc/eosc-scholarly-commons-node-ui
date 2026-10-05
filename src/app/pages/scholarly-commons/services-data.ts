// Mock catalogue data ported from the "Services.dc.html" / "Service Detail.dc.html" design mockups.
// There is no live services-search API wired into this branch's scope, so both the search page
// and the service detail page read from this single in-memory dataset, mirroring the design's
// own SERVICES/TASKS constants. Colors are duplicated from scholarly-commons-theme.less (@sc-teal /
// @sc-pink) because LESS variables aren't reachable from TypeScript — keep both in sync if they change.
export const SC_TEAL = '#0E839E';
export const SC_PINK = '#D44E7C';

export type ServiceOrderType = 'Fully open' | 'Order required';

export interface ServiceBenefit {
  title: string;
  description: string;
}

export interface ServiceStep {
  step: number;
  title: string;
  description: string;
}

export interface ServiceUseCase {
  title: string;
  description: string;
}

export interface ServiceResource {
  title: string;
  description: string;
  origin: 'EOSC field' | 'OpenAIRE extension';
}

export interface ServiceSummary {
  id: string;
  name: string;
  initials: string;
  provider: string;
  tagline: string;
  description: string;
  category: string;
  targetUsers: string[];
  trl: number;
  order: ServiceOrderType;
  accent: 'teal' | 'pink';
  logo?: string;
}

export interface ServiceDetail extends ServiceSummary {
  abbreviation: string;
  languages: string;
  lastUpdate: string;
  webpage: string;
  doi?: string;
  benefits: ServiceBenefit[];
  gettingStarted: ServiceStep[];
  useCases: ServiceUseCase[];
  resources: ServiceResource[];
  tags: string[];
}

const LOGOS: Record<string, string> = {
  zenodo: 'https://zenodo.org/static/images/invenio-rdm.svg',
  opencitations: 'https://opencitations.net/wp-content/uploads/2025/05/OpenCitations_Logo.png',
  provide: 'https://provide.openaire.eu/assets/imgs/OA_PROVIDE_B.png',
  monitor: 'https://monitor.openaire.eu/images/Logos/Logo%201.svg',
  aai: 'https://catalogue.openaire.eu/images/logos/OpenAIRE%20AAI_logo.svg',
  observatory: 'https://osobservatory.openaire.eu/assets/img/OS_Logo_Horizontal.svg',
};

export const SERVICES: ServiceSummary[] = [
  {
    id: 'zenodo', name: 'Zenodo', initials: 'Ze', provider: 'CERN',
    tagline: 'Deposit, publish and cite any research output',
    description: 'A general-purpose repository for datasets, software, publications, posters and presentations. Every upload gets a DOI, versioning and a permanent home, with no size or discipline restrictions for most communities.',
    category: 'Repository', targetUsers: ['Individual researchers', 'Research teams'], trl: 9, order: 'Fully open', accent: 'teal', logo: LOGOS.zenodo,
  },
  {
    id: 'opencitations', name: 'OpenCitations', initials: 'Oc', provider: 'OpenCitations',
    tagline: 'Open bibliographic and citation data',
    description: 'Infrastructure that publishes citation data as open linked data, queryable through REST APIs and SPARQL endpoints, and reusable without licence restrictions for bibliometric and meta-research work.',
    category: 'Data source & API', targetUsers: ['Research teams'], trl: 8, order: 'Fully open', accent: 'pink', logo: LOGOS.opencitations,
  },
  {
    id: 'provide', name: 'OpenAIRE Provide', initials: 'Pr', provider: 'OpenAIRE',
    tagline: 'Make your repository visible across EOSC',
    description: 'Registration, validation and enrichment workflows for repository and journal managers: check metadata compliance, monitor harvesting and expose your content to the Scholarly Commons and the wider federation.',
    category: 'Repository tooling', targetUsers: ['Research teams', 'Service providers'], trl: 9, order: 'Order required', accent: 'teal', logo: LOGOS.provide,
  },
  {
    id: 'graph', name: 'OpenAIRE Graph', initials: 'Gr', provider: 'OpenAIRE',
    tagline: 'The open scholarly record, as a graph',
    description: 'A deduplicated, interlinked dataset of publications, datasets, software, projects, funders and organisations, available as dumps and APIs for analysis, integration and monitoring.',
    category: 'Data source & API', targetUsers: ['Research teams'], trl: 8, order: 'Fully open', accent: 'pink',
  },
  {
    id: 'argos', name: 'Argos', initials: 'Ar', provider: 'OpenAIRE AMKE',
    tagline: 'Plan, publish and share machine-actionable DMPs',
    description: 'Argos supports researchers and research teams through the whole life of a data management plan: it turns funder and institutional templates into guided forms, links plans to datasets and repositories, and publishes them openly so they can be cited, reviewed and reused.',
    category: 'Data management planning', targetUsers: ['Individual researchers', 'Research teams'], trl: 8, order: 'Fully open', accent: 'teal',
  },
  {
    id: 'monitor', name: 'OpenAIRE Monitor', initials: 'Mo', provider: 'OpenAIRE',
    tagline: 'Track open science performance',
    description: 'Dashboards for funders, institutions and research communities that measure open access, data sharing and collaboration against their own portfolio of projects and outputs.',
    category: 'Monitoring & analytics', targetUsers: ['Research teams', 'Policy makers'], trl: 8, order: 'Order required', accent: 'pink', logo: LOGOS.monitor,
  },
  {
    id: 'aai', name: 'OpenAIRE AAI', initials: 'Aa', provider: 'OpenAIRE',
    tagline: 'Federated login for scholarly services',
    description: 'Authentication and authorisation proxy that lets services accept institutional, ORCID and social identities, with attribute release aligned to EOSC federation policy.',
    category: 'Access & identity', targetUsers: ['Research teams', 'Service providers'], trl: 9, order: 'Order required', accent: 'teal', logo: LOGOS.aai,
  },
  {
    id: 'observatory', name: 'Open Science Observatory', initials: 'Os', provider: 'OpenAIRE',
    tagline: 'The state of open science in Europe',
    description: 'Country and theme level indicators on open access, repositories, policies and funding, drawn from the OpenAIRE Graph and presented for non-specialist audiences.',
    category: 'Monitoring & analytics', targetUsers: ['Individual researchers', 'Policy makers'], trl: 7, order: 'Fully open', accent: 'pink',
  },
];

// Argos is the only service the design mockup ("Service Detail.dc.html") fully authored a
// benefits/getting-started/use-cases narrative for. The detail page renders those sections only
// when present, so the other services still get a complete detail page (hero, facts, provider,
// terms, identifiers) without fabricated case studies we have no real content for.
export const SERVICE_DETAILS: Record<string, Omit<ServiceDetail, keyof ServiceSummary>> = {
  argos: {
    abbreviation: 'ARGOS', languages: 'English', lastUpdate: '12 August 2026',
    webpage: 'argos.openaire.eu', doi: '10.5281/zenodo.argos',
    benefits: [
      {title: 'Guided plan authoring', description: 'Funder and institutional templates turned into step-by-step forms with contextual guidance.'},
      {title: 'Machine-actionable output', description: 'Export RDA-compliant maDMP JSON, or publish the plan with a DOI in Zenodo.'},
      {title: 'Linked datasets', description: 'Attach datasets, repositories and grants from the OpenAIRE Graph while you write.'},
      {title: 'Team review', description: 'Share a plan with co-authors, supervisors or data stewards for comment before publishing.'},
    ],
    gettingStarted: [
      {step: 1, title: 'Sign in', description: 'Use your institutional account through EOSC AAI, or ORCID.'},
      {step: 2, title: 'Pick a template', description: 'Choose your funder or institution; Argos pre-fills what it can from the grant.'},
      {step: 3, title: 'Write and link', description: 'Answer the guided questions and attach datasets and repositories as you go.'},
      {step: 4, title: 'Publish or export', description: 'Release the plan openly with a DOI, or export maDMP JSON for your own systems.'},
    ],
    useCases: [
      {title: 'Horizon Europe project, 9 partners', description: 'One shared plan per work package, with dataset entries maintained by each partner.'},
      {title: 'University-wide data stewardship', description: 'Institutional template rolled out to 400 researchers, reviewed centrally.'},
      {title: 'Doctoral school onboarding', description: 'DMP writing taught with Argos in a two-hour session, plans published at the end.'},
    ],
    resources: [
      {title: 'User manual', description: 'Full documentation of the plan editor', origin: 'EOSC field'},
      {title: 'API reference', description: 'REST endpoints and maDMP exports', origin: 'OpenAIRE extension'},
      {title: 'Training material', description: 'Slides and exercises for workshops', origin: 'EOSC field'},
      {title: 'FAQ', description: 'Common questions from service owners', origin: 'OpenAIRE extension'},
      {title: 'Helpdesk', description: 'helpdesk@openaire.eu', origin: 'EOSC field'},
      {title: 'Roadmap', description: 'What is planned for the next releases', origin: 'OpenAIRE extension'},
    ],
    tags: ['DMP', 'maDMP', 'RDA', 'templates', 'FAIR', 'data stewardship'],
  },
};

export function toServiceDetail(summary: ServiceSummary): ServiceDetail {
  const extra = SERVICE_DETAILS[summary.id];
  return {
    ...summary,
    abbreviation: extra?.abbreviation ?? summary.name.slice(0, 3).toUpperCase(),
    languages: extra?.languages ?? 'English',
    lastUpdate: extra?.lastUpdate ?? '',
    webpage: extra?.webpage ?? '',
    doi: extra?.doi,
    benefits: extra?.benefits ?? [],
    gettingStarted: extra?.gettingStarted ?? [],
    useCases: extra?.useCases ?? [],
    resources: extra?.resources ?? [],
    tags: extra?.tags ?? [summary.category],
  };
}

export interface TaskShortcut {
  title: string;
  note: string;
  accent: 'teal' | 'pink';
  categoryFilter: string;
}

export const TASK_SHORTCUTS: TaskShortcut[] = [
  {title: 'Plan my data', note: 'DMP templates, funder requirements, machine-actionable output', accent: 'teal', categoryFilter: 'Data management planning'},
  {title: 'Publish & preserve', note: 'Repositories with DOIs, versioning and long-term custody', accent: 'pink', categoryFilter: 'Repository'},
  {title: 'Work with metadata', note: 'Graph dumps, citation data, APIs and SPARQL endpoints', accent: 'teal', categoryFilter: 'Data source & API'},
  {title: 'Monitor open science', note: 'Dashboards and indicators for projects, institutions, countries', accent: 'pink', categoryFilter: 'Monitoring & analytics'},
];

export const POPULAR_SEARCHES: string[] = ['data management plan', 'deposit a dataset', 'citations API'];

export type FacetGroupId = 'category' | 'provider' | 'targetUsers' | 'trl' | 'order';

export const FACET_GROUPS: { id: FacetGroupId; label: string }[] = [
  {id: 'category', label: 'Category'},
  {id: 'provider', label: 'Provider'},
  {id: 'targetUsers', label: 'Target user'},
  {id: 'trl', label: 'Maturity'},
  {id: 'order', label: 'Order type'},
];

export function facetValues(service: ServiceSummary, group: FacetGroupId): string[] {
  switch (group) {
    case 'trl':
      return ['TRL ' + service.trl];
    case 'targetUsers':
      return service.targetUsers;
    default:
      return [service[group] as string];
  }
}
