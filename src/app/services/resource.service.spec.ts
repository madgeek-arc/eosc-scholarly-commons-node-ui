import {provideHttpClient, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {beforeEach, describe, expect, it} from 'vitest';
import {environment} from '../../environments/environment';
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

  describe('searchServices', () => {
    it('asks the services endpoint and sends every value of a repeated filter', () => {
      service.searchServices([
        {key: 'quantity', values: ['9']},
        {key: 'from', values: ['18']},
        {key: 'portfolios', values: ['portfolios-publish', 'portfolios-assess']},
      ]).subscribe();

      const request = backend.expectOne((r) => r.url === `${BASE}/node/services`);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('quantity')).toBe('9');
      expect(request.request.params.get('from')).toBe('18');
      expect(request.request.params.getAll('portfolios')).toEqual(['portfolios-publish', 'portfolios-assess']);
    });

    it('sends a keyword with spaces and reserved characters as one value', () => {
      service.searchServices([{key: 'keyword', values: ['data & code=1 #2']}]).subscribe();

      const request = backend.expectOne((r) => r.url === `${BASE}/node/services`);
      expect(request.request.params.getAll('keyword')).toEqual(['data & code=1 #2']);
      // `&` and `#` are escaped, so they cannot start another parameter or a fragment; `=` is legal inside a value.
      expect(request.request.urlWithParams).toBe(`${BASE}/node/services?keyword=data%20%26%20code=1%20%232`);
    });

    it('sends nothing it was not given: no active flag, no sort, no order', () => {
      service.searchServices([]).subscribe();
      expect(backend.expectOne(`${BASE}/node/services`).request.params.keys()).toEqual([]);
    });

    it('hands the response to the caller', () => {
      let received: Paging<unknown> | undefined;
      service.searchServices([]).subscribe((paging) => (received = paging));

      const body = {from: 0, to: 9, total: 1, results: [{id: 'a'}], facets: []};
      backend.expectOne(`${BASE}/node/services`).flush(body);
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
    it('reads a service by its id, with credentials', () => {
      service.getServiceById('openaire.graph').subscribe();
      expect(backend.expectOne(`${BASE}/node/services/openaire.graph`).request.withCredentials).toBe(true);
    });

    it('encodes the id as one path segment', () => {
      service.getServiceById('a b#c/d').subscribe();
      backend.expectOne(`${BASE}/node/services/a%20b%23c%2Fd`);
    });

    it('reads the vocabularies the UI maps ids with', () => {
      service.getUiVocabularies().subscribe();
      expect(backend.expectOne(`${BASE}/vocabularies/mappings`).request.method).toBe('GET');
    });
  });
});
