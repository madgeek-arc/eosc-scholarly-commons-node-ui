export type FacetGroupId = 'category' | 'provider' | 'targetUsers' | 'trl' | 'order';

export interface FacetGroupConfig {
  id: FacetGroupId;
  label: string;
  // Facet `field` returned by GET /catalogue-resources. The same name is used as the URL query-param key
  // and as the request param key, which is how the API filters on it.
  apiField: string;
}

// Results per page. 9 fills three rows of the 3-column grid; at other widths the last row may be short.
export const PAGE_SIZE = 9;

// "Category" is backed by the `portfolios` facet: it is the user-facing grouping already populated on every
// service. `service_categories` is empty in the API and `subcategories` has roughly one value per service.
export const CATEGORY_FIELD = 'portfolios';

export const FACET_GROUPS: FacetGroupConfig[] = [
  {id: 'category', label: 'Category', apiField: CATEGORY_FIELD},
  {id: 'provider', label: 'Provider', apiField: 'resource_organisation'},
  {id: 'targetUsers', label: 'Target user', apiField: 'target_users'},
  {id: 'trl', label: 'Maturity', apiField: 'trl'},
  {id: 'order', label: 'Order type', apiField: 'order_type'},
];
