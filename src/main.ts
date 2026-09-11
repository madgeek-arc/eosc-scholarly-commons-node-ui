import { enableProdMode, ErrorHandler } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (!environment.disableSentry)
  Sentry.init({
    dsn: environment.sentry.dsn,
    environment: environment.sentry.environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.breadcrumbsIntegration({
        console: true,
      }),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: environment.sentry.tracesSampleRate, // Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: environment.sentry.replaysSessionSampleRate, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: environment.sentry.replaysOnErrorSampleRate, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
