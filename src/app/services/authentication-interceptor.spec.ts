import {HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi, withXhr} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {environment} from '../../environments/environment';
import {AuthenticationInterceptor} from './authentication-interceptor';

describe('AuthenticationInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  const faqUrl = `${environment.FAQ_ENDPOINT}/page/route?q=home`;

  // Sends a GET and records everything the caller would see.
  const get = (url: string) => {
    const seen = {values: [] as unknown[], error: undefined as HttpErrorResponse | undefined, completed: false};
    http.get(url).subscribe({
      next: (value) => seen.values.push(value),
      error: (error: HttpErrorResponse) => (seen.error = error),
      complete: () => (seen.completed = true),
    });
    return seen;
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: HTTP_INTERCEPTORS, useClass: AuthenticationInterceptor, multi: true},
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('hands a successful response to the caller untouched', () => {
    const seen = get('/api/services');
    backend.expectOne('/api/services').flush({total: 3});

    expect(seen.values).toEqual([{total: 3}]);
    expect(seen.error).toBeUndefined();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the forbidden page on a 403, and the caller still gets the error', () => {
    sessionStorage.setItem('kept', 'yes');
    const seen = get('/api/providers/my');
    backend.expectOne('/api/providers/my').flush('no', {status: 403, statusText: 'Forbidden'});

    expect(navigate).toHaveBeenCalledWith(['/forbidden']);
    expect(seen.error?.status).toBe(403);
    expect(sessionStorage.getItem('kept')).toBe('yes');
  });

  it('forgets the session data on a 401 from the user-info call, and the caller still gets the error', () => {
    sessionStorage.setItem('redirectUrl', '/news');
    const seen = get('/api/user/info');
    backend.expectOne('/api/user/info').flush('no', {status: 401, statusText: 'Unauthorized'});

    expect(sessionStorage.length).toBe(0);
    expect(seen.error?.status).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves the session data alone on a 401 from any other call', () => {
    sessionStorage.setItem('redirectUrl', '/news');
    const seen = get('/api/services');
    backend.expectOne('/api/services').flush('no', {status: 401, statusText: 'Unauthorized'});

    expect(sessionStorage.getItem('redirectUrl')).toBe('/news');
    expect(seen.error?.status).toBe(401);
  });

  it('passes other errors on without side effects', () => {
    sessionStorage.setItem('kept', 'yes');
    const seen = get('/api/services');
    backend.expectOne('/api/services').flush('boom', {status: 500, statusText: 'Server Error'});

    expect(seen.error?.status).toBe(500);
    expect(sessionStorage.getItem('kept')).toBe('yes');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ends quietly when the FAQ service cannot be reached', () => {
    const seen = get(faqUrl);
    backend.expectOne(faqUrl).error(new ProgressEvent('error'));

    expect(seen.error).toBeUndefined();
    expect(seen.values).toEqual([]);
    expect(seen.completed).toBe(true);
  });

  it('still reports a network failure of any other service', () => {
    const seen = get('/api/services');
    backend.expectOne('/api/services').error(new ProgressEvent('error'));

    expect(seen.error?.status).toBe(0);
    expect(seen.completed).toBe(false);
  });

  it('still reports an HTTP error of the FAQ service', () => {
    const seen = get(faqUrl);
    backend.expectOne(faqUrl).flush('boom', {status: 500, statusText: 'Server Error'});

    expect(seen.error?.status).toBe(500);
  });
});
