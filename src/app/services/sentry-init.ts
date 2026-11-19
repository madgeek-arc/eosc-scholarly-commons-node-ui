import * as Sentry from '@sentry/angular';
import {environment} from '../../environments/environment';

/** Starts Sentry. Only call this once the visitor has agreed to error monitoring (see TrackingService). */
export function startSentry(): void {
  Sentry.init({
    dsn: environment.sentry.dsn,
    environment: environment.sentry.environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.breadcrumbsIntegration({
        console: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment.sentry.tracesSampleRate, // Capture 100% of the transactions
    // Session Replay (the integration itself is added below, once the app is idle)
    replaysSessionSampleRate: environment.sentry.replaysSessionSampleRate, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: environment.sentry.replaysOnErrorSampleRate, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

  // Replay is a large part of the Sentry bundle and is not needed to start the app: load it as a separate chunk
  // once the browser is idle (Safari has no requestIdleCallback). The sample rates above apply when it is added.
  // It is imported from @sentry/replay (installed with @sentry/browser at the same version) rather than from
  // @sentry/angular: the latter is already in the main bundle and re-exports Replay, so it could not be split off.
  const addReplay = () => import('@sentry/replay')
    .then(({replayIntegration}) => Sentry.addIntegration(replayIntegration()))
    .catch(err => console.error('Sentry Replay could not be loaded', err));
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => addReplay());
  } else {
    setTimeout(addReplay, 2000);
  }
}

/** Stops Sentry when the visitor withdraws their agreement: nothing more is sent after this. */
export function stopSentry(): Promise<boolean> {
  return Sentry.close();
}
