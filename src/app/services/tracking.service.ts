import {effect, inject, Injectable, untracked} from '@angular/core';
import {MatomoInitializerService} from 'ngx-matomo-client';
import {environment} from '../../environments/environment';
import {ConsentService} from '../shared/scholarly-commons/consent/consent.service';
import {startSentry, stopSentry} from './sentry-init';

/**
 * Starts Matomo and Sentry only while the visitor's consent allows it. Neither script is requested, and neither
 * sets a cookie, before that. Created at start-up by the app initializer in AppModule.
 */
@Injectable({providedIn: 'root'})
export class TrackingService {
  private readonly consent = inject(ConsentService);
  private readonly matomo = inject(MatomoInitializerService);

  private matomoStarted = false;
  private sentryStarted = false;

  constructor() {
    effect(() => {
      const analytics = this.consent.analytics();
      const errorMonitoring = this.consent.errorMonitoring();
      untracked(() => {
        this.applyAnalytics(analytics);
        this.applyErrorMonitoring(errorMonitoring);
      });
    });
  }

  private applyAnalytics(allowed: boolean): void {
    if (allowed && !this.matomoStarted) {
      // Environments without a Matomo site (development, beta) have MATOMO_SITE < 0 and never load the script.
      if (environment.MATOMO_SITE > 0) {
        this.matomo.initializeTracker({
          scriptUrl: environment.MATOMO_URL + 'matomo.js',
          trackerUrl: environment.MATOMO_URL,
          siteId: environment.MATOMO_SITE,
        });
        this.matomoStarted = true;
      }
    } else if (!allowed && this.matomoStarted) {
      // The Matomo script cannot be unloaded: remove its cookies and reload the page without it.
      this.clearMatomoCookies();
      window.location.reload();
    }
  }

  private applyErrorMonitoring(allowed: boolean): void {
    if (allowed && !this.sentryStarted) {
      if (!environment.disableSentry) {
        startSentry();
        this.sentryStarted = true;
      }
    } else if (!allowed && this.sentryStarted) {
      this.sentryStarted = false;
      void stopSentry();
    }
  }

  private clearMatomoCookies(): void {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_pk_') || name.startsWith('mtm_')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
  }
}
