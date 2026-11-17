import type {ConsentChoice} from './consent.service';

export interface ConsentCookie {
  name: string;
  description: string;
  provider: string;
  expiration: string;
}

export interface ConsentCategory {
  /** `necessary` cannot be switched off; the others are the flags of a {@link ConsentChoice}. */
  id: 'necessary' | keyof ConsentChoice;
  title: string;
  description: string;
  cookies: ConsentCookie[];
}

const NODE = 'EOSC Scholarly Commons Node';

/** The categories of the cookie settings panel, with what each one stores in the browser. */
export const CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: 'necessary',
    title: 'Strictly necessary',
    description: 'Needed for the site to work, for example to keep you signed in. They cannot be switched off.',
    cookies: [
      {
        name: 'SESSION',
        description: 'Keeps you signed in while you browse.',
        provider: NODE,
        expiration: 'Session',
      },
      {
        name: 'sc-consent',
        description: 'Stores your cookie choices, so you are not asked again. Kept in local storage.',
        provider: NODE,
        expiration: '6 months',
      },
      {
        name: 'compareServices',
        description: 'Remembers the services you picked to compare. Kept in session storage.',
        provider: NODE,
        expiration: 'Until you close the tab',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Statistics',
    description: 'Matomo counts visits and page views, so the service can be improved (analytics.openaire.eu).',
    cookies: [
      {
        name: '_pk_id.*',
        description: 'Stores a visitor ID, so repeat visits are counted once.',
        provider: 'Matomo (OpenAIRE)',
        expiration: '13 months',
      },
      {
        name: '_pk_ses.*',
        description: 'Groups the pages of one visit.',
        provider: 'Matomo (OpenAIRE)',
        expiration: '30 minutes',
      },
      {
        name: '_pk_ref.*',
        description: 'Stores the website that brought you here.',
        provider: 'Matomo (OpenAIRE)',
        expiration: '6 months',
      },
    ],
  },
  {
    id: 'errorMonitoring',
    title: 'Error reports',
    description: 'Sentry receives details of errors, with a recording of the page around each error, so they can be fixed.',
    cookies: [
      {
        name: 'sentryReplaySession',
        description: 'Links the page recording to your visit, so it can be sent with an error report. Kept in session storage.',
        provider: 'Sentry',
        expiration: 'Until you close the tab',
      },
    ],
  },
];
