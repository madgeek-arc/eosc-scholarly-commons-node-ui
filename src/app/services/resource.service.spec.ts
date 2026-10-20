import {provideHttpClient, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {beforeEach, describe, expect, it} from 'vitest';
import {environment} from '../../environments/environment';
import {Service} from '../entities/eic-model';
import {Paging} from '../entities/paging';
import {ResourceService} from './resource.service';

const BASE = environment.API_ENDPOINT;

describe('ResourceService', () => {
  let service: ResourceService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withXhr()), provideHttpClientTesting(), ResourceService],
    });
    service = TestBed.inject(ResourceService);
    backend = TestBed.inject(HttpTestingController);
  });

  describe('searchWithDatasource', () => {
    it('asks the catalogue for active resources and sends every value of a repeated filter', () => {
      service.searchWithDatasource([
        {key: 'quantity', values: ['9']},
        {key: 'from', values: ['18']},
        {key: 'portfolios', values: ['portfolios-publish', 'portfolios-assess']},
      ]).subscribe();

      const request = backend.expectOne((r) => r.url === `${BASE}/catalogue-resources?active=true`);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('quantity')).toBe('9');
      expect(request.request.params.get('from')).toBe('18');
      expect(request.request.params.getAll('portfolios')).toEqual(['portfolios-publish', 'portfolios-assess']);
    });

    it('sends a query with spaces and reserved characters as one value', () => {
      service.searchWithDatasource([{key: 'query', values: ['data & code=1 #2']}]).subscribe();

      const request = backend.expectOne((r) => r.url === `${BASE}/catalogue-resources?active=true`);
      expect(request.request.params.getAll('query')).toEqual(['data & code=1 #2']);
      // `&` and `#` are escaped, so they cannot start another parameter or a fragment; `=` is legal inside a value.
      expect(request.request.urlWithParams).toBe(`${BASE}/catalogue-resources?active=true&query=data%20%26%20code=1%20%232`);
    });

    it('works with no parameters at all', () => {
      service.searchWithDatasource([]).subscribe();
      backend.expectOne(`${BASE}/catalogue-resources?active=true`);
    });

    it('hands the response to the caller', () => {
      let received: Paging<unknown> | undefined;
      service.searchWithDatasource([]).subscribe((paging) => (received = paging));

      const body = {from: 0, to: 9, total: 1, results: [{id: 'a'}], facets: []};
      backend.expectOne(`${BASE}/catalogue-resources?active=true`).flush(body);
      expect(received).toEqual(body);
    });
  });

  describe('search', () => {
    it('puts every value of every filter in the query string, encoded', () => {
      service.search([
        {key: 'query', values: ['open science']},
        {key: 'trl', values: ['trl-7', 'trl-9']},
      ]).subscribe();

      const request = backend.expectOne(`${BASE}/services?query=open%20science&trl=trl-7&trl=trl-9`);
      expect(request.request.withCredentials).toBe(true);
    });
  });

  describe('getServicesByVocabularyTypeAndId', () => {
    it('filters by the id and asks for up to 100 services', () => {
      service.getServicesByVocabularyTypeAndId('users', 'tu-1').subscribe();

      const request = backend.expectOne((r) => r.url === `${BASE}/services`);
      expect(request.request.params.get('users')).toBe('tu-1');
      expect(request.request.params.get('quantity')).toBe('100');
    });

    it('lists the services without a filter when there is no id', () => {
      service.getServicesByVocabularyTypeAndId('users').subscribe();
      expect(backend.expectOne(`${BASE}/services`).request.params.keys()).toEqual([]);
    });
  });

  describe('single resources', () => {
    it('reads a service or datasource by id, with credentials', () => {
      service.getServiceOrDatasource('abc').subscribe();
      expect(backend.expectOne(`${BASE}/catalogue-resources/abc`).request.withCredentials).toBe(true);
    });

    it('reads the vocabularies the UI maps ids with', () => {
      service.getUiVocabularies().subscribe();
      expect(backend.expectOne(`${BASE}/vocabularies/mappings`).request.method).toBe('GET');
    });

    it('reads several services in one request, joined by commas', () => {
      let received: Service[] | undefined;
      service.getServicesByIdArray(['a', 'b', 'c']).subscribe((services) => (received = services));

      backend.expectOne(`${BASE}/services/ids/a,b,c`).flush([{id: 'a'}]);
      expect(received).toEqual([{id: 'a'}]);
    });
  });
});
