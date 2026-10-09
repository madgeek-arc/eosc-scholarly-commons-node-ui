// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  beta: false,
  MATOMO_URL: 'https://analytics.openaire.eu/',
  MATOMO_SITE: -1,
  FAQ_ENDPOINT: 'https://dl105.madgik.di.uoa.gr/faq/api',
  // API_ENDPOINT: '/eic-registry', // to change the end point go to proxy.conf.json file
  API_ENDPOINT: '/openaire', // to change the end point go to proxy.conf.json file
  // Public address of the Joomla site behind the iframe pages (no trailing slash). Keep in line with the proxy target
  // (proxy.conf.json, PROXY_PAGES_ENDPOINT in docker-compose.yml).
  JOOMLA_SITE_ORIGIN: 'https://innovation.openaire.eu',
  AAI_LOGIN: '/login',
  AAI_LOGOUT: 'https://aai.openaire.eu/proxy/saml2/idp/SingleLogoutService.php?ReturnTo=',
  STATS_ENDPOINT: 'https://providers.eosc-portal.eu/stats-api/',
  API_TOKEN_ENDPOINT: '',
  projectName: 'OpenAIRE Catalogue',
  projectMail: 'example@oac.eu',
  serviceORresource: 'Resource',
  hasUserConsent: true,
  showHelpContent: false,
  privacyPolicyURL: '',
  marketplaceBaseURL: '',
  sentry: {
    dsn: 'https://c14ac91c2adaafb644a200288035d5d2@sentry.vereniki.athenarc.gr/6',
    environment: 'develop',
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0
  },
  disableSentry: true
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
