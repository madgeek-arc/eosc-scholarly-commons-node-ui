// Editorial content for the search page, ported from the "Services.dc.html" design mockup. Services themselves
// (search results and the detail page) are read from the catalogue API; only these task shortcuts and
// suggested searches are still static. Their `categoryFilter` values are mock category names, so they won't
// match the API's `portfolios` facet until they are re-pointed at real values.
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
