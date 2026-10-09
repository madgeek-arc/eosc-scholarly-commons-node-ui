import {ORDER_FULLY_OPEN, ORDER_OPEN_ACCESS, ORDER_REQUIRED} from '../service-display';

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

export const ORDER_FIELD = 'order_type';

export const FACET_GROUPS: FacetGroupConfig[] = [
  {id: 'category', label: 'Category', apiField: CATEGORY_FIELD},
  {id: 'provider', label: 'Provider', apiField: 'resource_organisation'},
  {id: 'targetUsers', label: 'Target user', apiField: 'target_users'},
  {id: 'trl', label: 'Maturity', apiField: 'trl'},
  {id: 'order', label: 'Order type', apiField: ORDER_FIELD},
];

export interface OrderGroup {
  label: string;
  // `order_type` facet values this option selects together.
  values: string[];
}

// Options of the "Show" toggle above the results; each one is a shortcut for a set of `order_type` values.
export const ORDER_GROUPS: OrderGroup[] = [
  {label: 'Open to anyone', values: [ORDER_FULLY_OPEN, ORDER_OPEN_ACCESS]},
  {label: 'Set up for your organisation', values: [ORDER_REQUIRED]},
];
