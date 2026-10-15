import {computed, Injectable, signal} from '@angular/core';

export interface ConsentChoice {
  /** Matomo page-view statistics. */
  analytics: boolean;
  /** Sentry error reports, including the session recording taken around an error. */
  errorMonitoring: boolean;
}

interface StoredConsent extends ConsentChoice {
  version: number;
  savedAt: number;
}

const STORAGE_KEY = 'sc-consent';
// Raise this when a new category is added or an existing one changes meaning: everyone is asked again.
const CONSENT_VERSION = 1;
// A choice is asked for again after six months.
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * The visitor's cookie choices. Nothing optional (analytics, error monitoring) may start before the matching flag
 * is true; TrackingService does the starting. The record itself is kept in localStorage: it is what makes the
 * site remember the choice, so it needs no consent of its own.
 */
@Injectable({providedIn: 'root'})
export class ConsentService {
  private readonly stored = signal<StoredConsent | null>(readStoredConsent());
  private readonly reopened = signal(false);

  readonly analytics = computed(() => this.stored()?.analytics ?? false);
  readonly errorMonitoring = computed(() => this.stored()?.errorMonitoring ?? false);
  /** True until the visitor has chosen, and again whenever they open the settings from the footer. */
  readonly bannerVisible = computed(() => this.stored() === null || this.reopened());

  acceptAll(): void {
    this.save({analytics: true, errorMonitoring: true});
  }

  rejectAll(): void {
    this.save({analytics: false, errorMonitoring: false});
  }

  save(choice: ConsentChoice): void {
    const record: StoredConsent = {...choice, version: CONSENT_VERSION, savedAt: Date.now()};
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Storage is blocked (private window, site data off): the choice then lasts until the page is closed.
    }
    this.stored.set(record);
    this.reopened.set(false);
  }

  openSettings(): void {
    this.reopened.set(true);
  }
}

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const record = JSON.parse(raw) as Partial<StoredConsent>;
    const valid = record.version === CONSENT_VERSION
      && typeof record.analytics === 'boolean'
      && typeof record.errorMonitoring === 'boolean'
      && typeof record.savedAt === 'number'
      && Date.now() - record.savedAt < MAX_AGE_MS;
    return valid ? record as StoredConsent : null;
  } catch {
    return null;
  }
}
