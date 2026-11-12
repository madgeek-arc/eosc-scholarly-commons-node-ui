import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, TestRequest, provideHttpClientTesting} from '@angular/common/http/testing';
import {ApplicationRef} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {environment} from '../../environments/environment';
import {UserInfo} from '../entities/userInfo';
import {UserSessionService, isAppUrl} from './user-session.service';

const USER_INFO_URL = '/api/user/info';

const ADA: UserInfo = {sub: 'u1', name: 'Ada', surname: 'Lovelace', fullname: 'Ada Lovelace', email: 'ada@example.org', roles: ['ADMIN']};

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

describe('UserSessionService', () => {
  let router: Router;
  let backend: HttpTestingController;
  // window.location cannot be navigated in jsdom, so the tests read what the service assigns to a stand-in.
  let location: {href: string; origin: string};

  // The user-info call is made by an effect, so it only goes out once the effects have run.
  const start = () => {
    const service = TestBed.inject(UserSessionService);
    TestBed.tick();
    return service;
  };
  const userInfoRequest = (): TestRequest => backend.expectOne(USER_INFO_URL);
  // The resource publishes the answer a moment after the response arrives, so wait for the app to be stable.
  const settle = async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    TestBed.tick();
  };
  const startAndAnswer = async (body: UserInfo | null) => {
    const service = start();
    userInfoRequest().flush(body);
    await settle();
    return service;
  };
  const startAndFail = async (status: number) => {
    const service = start();
    userInfoRequest().flush('no', {status, statusText: 'Error'});
    await settle();
    return service;
  };

  beforeEach(() => {
    sessionStorage.clear();
    location = {href: 'https://sc.example/home', origin: 'https://sc.example'};
    vi.stubGlobal('location', location);
    TestBed.configureTestingModule({
      providers: [provideRouter([{path: '**', children: []}]), provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  describe('state', () => {
    it('is loading, with nobody signed in, until the user-info call answers', () => {
      const service = start();
      userInfoRequest();

      expect(service.isLoading()).toBe(true);
      expect(service.isSignedIn()).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.displayName()).toBe('');
    });

    it('is signed in once the call answers with a user', async () => {
      const service = await startAndAnswer(ADA);

      expect(service.isLoading()).toBe(false);
      expect(service.isSignedIn()).toBe(true);
      expect(service.user()).toEqual(ADA);
      expect(service.displayName()).toBe('Ada Lovelace');
    });

    it.each([401, 403, 500])('is signed out when the call fails with %s', async (status) => {
      const service = await startAndFail(status);

      expect(service.isLoading()).toBe(false);
      expect(service.isSignedIn()).toBe(false);
      expect(service.user()).toBeNull();
    });

    it('is signed out when the call cannot reach the server', async () => {
      const service = start();
      userInfoRequest().error(new ProgressEvent('error'));
      await settle();

      expect(service.isLoading()).toBe(false);
      expect(service.isSignedIn()).toBe(false);
    });

    it('is signed out when the call answers without a user', async () => {
      const service = await startAndAnswer(null);

      expect(service.isLoading()).toBe(false);
      expect(service.isSignedIn()).toBe(false);
    });

    it('asks the API only once', async () => {
      await startAndAnswer(ADA);
      await settle();

      backend.expectNone(USER_INFO_URL);
    });
  });

  describe('displayName', () => {
    it.each<[string, Partial<UserInfo>, string]>([
      ['the full name', ADA, 'Ada Lovelace'],
      ['name and surname without a full name', {...ADA, fullname: ''}, 'Ada Lovelace'],
      ['the name alone', {...ADA, fullname: undefined, surname: undefined}, 'Ada'],
      ['the email address when there is no name', {sub: 'u1', email: 'ada@example.org'}, 'ada@example.org'],
      ['nothing when the user has no name and no email', {sub: 'u1'}, ''],
    ])('shows %s', async (_label, user, expected) => {
      expect((await startAndAnswer(user as UserInfo)).displayName()).toBe(expected);
    });
  });

  describe('login', () => {
    const LOGIN_URL = environment.API_ENDPOINT + environment.AAI_LOGIN;

    it('leaves for the login page of the API and asks it to return to the given page, as a full address', async () => {
      const service = await startAndFail(401);
      service.login('/news?from=9');

      expect(location.href).toBe(`${LOGIN_URL}?redirectUrl=${encodeURIComponent('https://sc.example/news?from=9')}`);
    });

    it('encodes the address, so its own query and fragment cannot be taken for parameters of the login', async () => {
      const service = await startAndFail(401);
      service.login('/search?query=a&b=c#top');

      const sent = new URL(location.href, 'https://sc.example');
      expect([...sent.searchParams.keys()]).toEqual(['redirectUrl']);
      expect(sent.searchParams.get('redirectUrl')).toBe('https://sc.example/search?query=a&b=c#top');
    });

    it('returns to the current page when no page is given', async () => {
      const service = await startAndFail(401);
      await router.navigateByUrl('/discover?q=data');
      service.login();

      expect(new URL(location.href, 'https://sc.example').searchParams.get('redirectUrl')).toBe(
        'https://sc.example/discover?q=data',
      );
    });

    it.each(['https://evil.example/home', '//evil.example', '/\\evil.example', 'home', ''])(
      'only ever asks to return to a page of this site: %s becomes the start page',
      async (url) => {
        const service = await startAndFail(401);
        service.login(url);

        expect(new URL(location.href, 'https://sc.example').searchParams.get('redirectUrl')).toBe('https://sc.example/');
      },
    );

    it('keeps nothing in the browser about the page it came from', async () => {
      const service = await startAndFail(401);
      service.login('/news');

      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('logoutUrl', () => {
    it('is the logout address of the API', async () => {
      expect((await startAndFail(401)).logoutUrl).toBe(environment.API_ENDPOINT + environment.AAI_LOGOUT);
    });
  });
});
