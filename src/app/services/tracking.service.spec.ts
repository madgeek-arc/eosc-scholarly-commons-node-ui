import {TestBed} from '@angular/core/testing';
import * as Sentry from '@sentry/angular';
import {MatomoInitializerService} from 'ngx-matomo-client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {environment} from '../../environments/environment';
import {ConsentService} from '../shared/scholarly-commons/consent/consent.service';
import {TrackingService} from './tracking.service';

vi.mock('ngx-matomo-client', () => ({MatomoInitializerService: class MatomoInitializerService {}}));
// Sentry is replaced here, below TrackingService and sentry-init, so both of them run for real.
vi.mock('@sentry/angular', () => ({
  init: vi.fn(),
  close: vi.fn(),
  addIntegration: vi.fn(),
  browserTracingIntegration: vi.fn(),
  breadcrumbsIntegration: vi.fn(),
}));

const KEY = 'sc-consent';
const initializeTracker = vi.fn();

const original = {...environment};

const setCookie = (name: string) => {
  document.cookie = `${name}=1; path=/`;
};
const cookieNames = () =>
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter(Boolean);
const clearCookies = () => {
  for (const name of cookieNames()) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
};

describe('TrackingService', () => {
  let location: {reload: ReturnType<typeof vi.fn>};

  // Resolved on first use, so a test can put a stored choice in place before the consent service reads it.
  const consent = () => TestBed.inject(ConsentService);

  // Creates the service the way the app initializer does, then lets its effect run.
  const start = () => {
    TestBed.inject(TrackingService);
    TestBed.tick();
  };
  const choose = (choice: {analytics: boolean; errorMonitoring: boolean}) => {
    consent().save(choice);
    TestBed.tick();
  };

  beforeEach(() => {
    localStorage.clear();
    clearCookies();
    Object.assign(environment, {MATOMO_SITE: 7, MATOMO_URL: 'https://stats.example/', disableSentry: false});
    location = {reload: vi.fn()};
    vi.stubGlobal('location', location);
    // Sentry loads its session replay when the browser is idle; the tests do not wait for that.
    vi.stubGlobal('requestIdleCallback', vi.fn());

    initializeTracker.mockReset();
    vi.mocked(Sentry.init).mockReset();
    vi.mocked(Sentry.close).mockReset();
    TestBed.configureTestingModule({providers: [{provide: MatomoInitializerService, useValue: {initializeTracker}}]});
  });

  afterEach(() => {
    Object.assign(environment, original);
    vi.unstubAllGlobals();
    localStorage.clear();
    clearCookies();
  });

  it('starts neither Matomo nor Sentry before the visitor has chosen', () => {
    start();

    expect(initializeTracker).not.toHaveBeenCalled();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts neither when the visitor rejected both', () => {
    consent().rejectAll();
    start();

    expect(initializeTracker).not.toHaveBeenCalled();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  describe('analytics', () => {
    it('starts Matomo once the visitor agrees, and leaves Sentry off', () => {
      start();
      choose({analytics: true, errorMonitoring: false});

      expect(initializeTracker).toHaveBeenCalledTimes(1);
      expect(initializeTracker).toHaveBeenCalledWith({
        scriptUrl: 'https://stats.example/matomo.js',
        trackerUrl: 'https://stats.example/',
        siteId: 7,
      });
      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('starts Matomo at start-up when the visitor already agreed on an earlier visit', () => {
      localStorage.setItem(KEY, JSON.stringify({version: 1, analytics: true, errorMonitoring: false, savedAt: Date.now()}));

      start();

      expect(initializeTracker).toHaveBeenCalledTimes(1);
    });

    it('does not start Matomo a second time when another choice changes', () => {
      start();
      choose({analytics: true, errorMonitoring: false});
      choose({analytics: true, errorMonitoring: true});

      expect(initializeTracker).toHaveBeenCalledTimes(1);
    });

    it('never loads Matomo in an environment without a Matomo site', () => {
      environment.MATOMO_SITE = -1;
      start();
      choose({analytics: true, errorMonitoring: false});

      expect(initializeTracker).not.toHaveBeenCalled();
    });

    it('removes the Matomo cookies and reloads the page when the visitor withdraws, and touches no other cookie', () => {
      start();
      choose({analytics: true, errorMonitoring: false});
      setCookie('_pk_id.7.abcd');
      setCookie('_pk_ses.7.abcd');
      setCookie('mtm_consent');
      setCookie('AccessToken');

      choose({analytics: false, errorMonitoring: false});

      expect(cookieNames()).toEqual(['AccessToken']);
      expect(location.reload).toHaveBeenCalledTimes(1);
    });

    it('does not reload the page on withdrawal when Matomo never started', () => {
      environment.MATOMO_SITE = -1;
      start();
      choose({analytics: true, errorMonitoring: false});
      choose({analytics: false, errorMonitoring: false});

      expect(location.reload).not.toHaveBeenCalled();
    });
  });

  describe('error monitoring', () => {
    it('starts Sentry once the visitor agrees, and leaves Matomo off', () => {
      start();
      choose({analytics: false, errorMonitoring: true});

      expect(Sentry.init).toHaveBeenCalledTimes(1);
      expect(initializeTracker).not.toHaveBeenCalled();
    });

    it('never starts Sentry in an environment where it is disabled', () => {
      environment.disableSentry = true;
      start();
      choose({analytics: false, errorMonitoring: true});

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('does not start Sentry a second time when another choice changes', () => {
      start();
      choose({analytics: false, errorMonitoring: true});
      choose({analytics: true, errorMonitoring: true});

      expect(Sentry.init).toHaveBeenCalledTimes(1);
    });

    it('stops Sentry when the visitor withdraws, and starts it again if they agree later', () => {
      start();
      choose({analytics: false, errorMonitoring: true});
      choose({analytics: false, errorMonitoring: false});

      expect(Sentry.close).toHaveBeenCalledTimes(1);
      expect(location.reload).not.toHaveBeenCalled();

      choose({analytics: false, errorMonitoring: true});
      expect(Sentry.init).toHaveBeenCalledTimes(2);
    });

    it('does not stop Sentry when it never started', () => {
      start();
      choose({analytics: true, errorMonitoring: false});
      choose({analytics: false, errorMonitoring: false});

      expect(Sentry.close).not.toHaveBeenCalled();
    });
  });
});
