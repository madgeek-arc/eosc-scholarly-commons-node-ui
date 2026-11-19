// Editorial content for the search page, ported from the "Services.dc.html" design mockup. Services themselves
// (search results and the detail page) are read from the catalogue API; only these task shortcuts and
// suggested searches are still static. Each `categoryFilters` entry is a value of the API's `portfolios` facet
// (the "Category" filter); a card selects all of its values at once. The mapping is best-effort: the six facet
// values are spread over the four cards, each used once, with the card's main category listed first.
// TODO(backend): the API currently honours only the first of repeated `portfolios` params, so until that is
// fixed a card's results are those of its first category only, while the URL and Refine panel show all of them.
export interface TaskShortcut {
  title: string;
  note: string;
  accent: 'teal' | 'pink';
  categoryFilters: string[];
}

export const TASK_SHORTCUTS: TaskShortcut[] = [
  {title: 'Plan my data', note: 'DMP templates, funder requirements, machine-actionable output', accent: 'teal', categoryFilters: ['portfolios-manage_data']},
  {title: 'Publish & preserve', note: 'Repositories with DOIs, versioning and long-term custody', accent: 'pink', categoryFilters: ['portfolios-publish', 'portfolios-outreach']},
  {title: 'Work with metadata', note: 'Graph dumps, citation data, APIs and SPARQL endpoints', accent: 'teal', categoryFilters: ['portfolios-interoperability', 'portfolios-discover']},
  {title: 'Monitor open science', note: 'Dashboards and indicators for projects, institutions, countries', accent: 'pink', categoryFilters: ['portfolios-assess']},
];

export const POPULAR_SEARCHES: string[] = ['data management plan', 'deposit a dataset', 'citations API'];
