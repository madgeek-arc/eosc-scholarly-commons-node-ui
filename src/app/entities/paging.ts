import { Facet } from './facet';

export class Paging<T> {

    from: number;
    to: number;
    total: number;

    results: T[];
    facets: Facet[];
}

export class SpringPaging<T> { // Spring paging with facets
  page: Page<T>;
  facets: Facet[];

  constructor() {
    this.page = new Page<T>();
  }
}

export class Page<T> {
  content: T[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: Sort;
  first: number;
  numberOfElements: number;
  empty: boolean;
}

export class Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export class Pageable {
  sort: Sort;
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: number;
  unpaged: boolean;
}
