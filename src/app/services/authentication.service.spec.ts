import {TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {environment} from '../../environments/environment';
import {AuthenticationService, isAppUrl} from './authentication.service';

const COOKIE = 'AccessToken';
const REDIRECT_KEY = 'redirectUrl';

const setToken = (value: string) => {
  document.cookie = `${COOKIE}=${value}; path=/`;
};
const clearToken = () => {
  document.cookie = `${COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

describe('isAppUrl', () => {
  it.each(['/', '/home', '/search?query=data&from=9', '/service/abc#top', '/a//b'])('accepts the path %s', (url) => {
    expect(isAppUrl(url)).toBe(true);
  });

  it.each([
    ['nothing', null],
    ['an empty string', ''],
    ['another site', 'https://evil.example/home'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash that browsers read as a slash', '/\\evil.example'],
    ['a relative path', 'home'],
    ['a javascript: URL', 'javascript:alert(1)'],
  ])('rejects %s', (_label, url) => {
    expect(isAppUrl(url)).toBe(false);
  });
});

describe('AuthenticationService', () => {
  let router: Router;
  // window.location cannot be navigated in jsdom, so the tests read what the service assigns to a stand-in.
  let location: {href: string; origin: string};

  const create = () => TestBed.inject(AuthenticationService);

  beforeEach(() => {
    clearToken();
    sessionStorage.clear();
    location = {href: 'https://sc.example/home', origin: 'https://sc.example'};
    vi.stubGlobal('location', location);
    TestBed.configureTestingModule({providers: [provideRouter([{path: '**', children: []}])]});
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    clearToken();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  describe('isLoggedIn', () => {
    it('is false while there is no login cookie', () => {
      expect(create().isLoggedIn()).toBe(false);
    });

    it('is true while the login cookie has a value', () => {
      setToken('abc');
      expect(create().isLoggedIn()).toBe(true);
    });

    it('is false for a login cookie with an empty value', () => {
      setToken('');
      expect(create().isLoggedIn()).toBe(false);
    });

    it('is not fooled by another cookie that only contains the name', () => {
      document.cookie = `Other${COOKIE}=abc; path=/`;
      expect(create().isLoggedIn()).toBe(false);
      document.cookie = `Other${COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });

    it('starts from the cookie and follows it on every check', () => {
      setToken('abc');
      const service = create();
      expect(service.loggedIn()).toBe(true);

      clearToken();
      expect(service.isLoggedIn()).toBe(false);
      expect(service.loggedIn()).toBe(false);
    });
  });

  describe('login', () => {
    it('remembers the page to come back to and leaves for the login page', () => {
      create().login('/news?from=9');

      expect(sessionStorage.getItem(REDIRECT_KEY)).toBe('/news?from=9');
      expect(location.href).toBe(environment.API_ENDPOINT + environment.AAI_LOGIN);
    });

    it('comes back to the current page when no page is given', async () => {
      await router.navigateByUrl('/discover');
      create().login();

      expect(sessionStorage.getItem(REDIRECT_KEY)).toBe('/discover');
    });
  });

  describe('logout', () => {
    it('forgets the session data and leaves for the logout address of the API', () => {
      sessionStorage.setItem('anything', 'x');
      create().logout();

      expect(sessionStorage.length).toBe(0);
      expect(location.href).toBe(`https://sc.example${environment.API_ENDPOINT}/logout`);
    });
  });

  describe('redirect', () => {
    let navigate: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    });

    it('does nothing when no page was remembered', () => {
      create().redirect();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('returns to the remembered page, once', () => {
      sessionStorage.setItem(REDIRECT_KEY, '/news?from=9');
      const service = create();

      service.redirect();
      expect(navigate).toHaveBeenCalledWith('/news?from=9');
      expect(sessionStorage.getItem(REDIRECT_KEY)).toBeNull();

      service.redirect();
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it.each(['https://evil.example', '//evil.example', '/\\evil.example'])(
      'forgets %s without following it, so the login page cannot send anyone to another site',
      (url) => {
        sessionStorage.setItem(REDIRECT_KEY, url);
        create().redirect();

        expect(navigate).not.toHaveBeenCalled();
        expect(sessionStorage.getItem(REDIRECT_KEY)).toBeNull();
      },
    );
  });
});
