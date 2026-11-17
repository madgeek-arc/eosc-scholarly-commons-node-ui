import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ConsentService} from './consent.service';

const KEY = 'sc-consent';
const DAY_MS = 24 * 60 * 60 * 1000;

const store = (record: Record<string, unknown>) => localStorage.setItem(KEY, JSON.stringify(record));
const valid = (overrides: Record<string, unknown> = {}) => ({
  version: 1,
  analytics: true,
  errorMonitoring: false,
  savedAt: Date.now(),
  ...overrides,
});
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? 'null');

describe('ConsentService', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('before the visitor has chosen', () => {
    it('allows nothing optional and shows the banner', () => {
      const consent = new ConsentService();

      expect(consent.analytics()).toBe(false);
      expect(consent.errorMonitoring()).toBe(false);
      expect(consent.hasChoice()).toBe(false);
    });
  });

  describe('choosing', () => {
    it('acceptAll allows both categories, hides the banner and remembers the choice', () => {
      const consent = new ConsentService();
      consent.acceptAll();

      expect(consent.analytics()).toBe(true);
      expect(consent.errorMonitoring()).toBe(true);
      expect(consent.hasChoice()).toBe(true);
      expect(stored()).toMatchObject({version: 1, analytics: true, errorMonitoring: true});
      expect(typeof stored().savedAt).toBe('number');
    });

    it('rejectAll allows neither category, but still hides the banner', () => {
      const consent = new ConsentService();
      consent.rejectAll();

      expect(consent.analytics()).toBe(false);
      expect(consent.errorMonitoring()).toBe(false);
      expect(consent.hasChoice()).toBe(true);
      expect(stored()).toMatchObject({analytics: false, errorMonitoring: false});
    });

    it('save can allow one category and not the other', () => {
      const consent = new ConsentService();
      consent.save({analytics: false, errorMonitoring: true});

      expect(consent.analytics()).toBe(false);
      expect(consent.errorMonitoring()).toBe(true);
    });

    it('a later choice replaces the earlier one', () => {
      const consent = new ConsentService();
      consent.acceptAll();
      consent.rejectAll();

      expect(consent.analytics()).toBe(false);
      expect(stored()).toMatchObject({analytics: false, errorMonitoring: false});
    });
  });

  describe('remembering the choice', () => {
    it('a new visit starts from the stored choice, without the banner', () => {
      new ConsentService().save({analytics: true, errorMonitoring: false});

      const next = new ConsentService();
      expect(next.analytics()).toBe(true);
      expect(next.errorMonitoring()).toBe(false);
      expect(next.hasChoice()).toBe(true);
    });

    it('keeps a choice that is just under six months old', () => {
      store(valid({savedAt: Date.now() - 179 * DAY_MS}));

      const consent = new ConsentService();
      expect(consent.analytics()).toBe(true);
      expect(consent.hasChoice()).toBe(true);
    });

    it.each([
      ['older than six months', valid({savedAt: Date.now() - 181 * DAY_MS})],
      ['from another version of the consent text', valid({version: 2})],
      ['missing a version', valid({version: undefined})],
      ['missing the analytics flag', valid({analytics: undefined})],
      ['with a flag that is not a boolean', valid({errorMonitoring: 'yes'})],
      ['without a date', valid({savedAt: undefined})],
    ])('asks again when the stored choice is %s', (_label, record) => {
      store(record);

      const consent = new ConsentService();
      expect(consent.analytics()).toBe(false);
      expect(consent.errorMonitoring()).toBe(false);
      expect(consent.hasChoice()).toBe(false);
    });

    it('asks again when the stored text is not JSON', () => {
      localStorage.setItem(KEY, '{not json');
      expect(new ConsentService().hasChoice()).toBe(false);
    });

    it('asks again when the stored value is null', () => {
      localStorage.setItem(KEY, 'null');
      expect(new ConsentService().hasChoice()).toBe(false);
    });
  });

  describe('opening the settings again', () => {
    it('opens the panel without changing the choice, until the next save', () => {
      const consent = new ConsentService();
      consent.acceptAll();

      consent.openSettings();
      expect(consent.settingsOpen()).toBe(true);
      expect(consent.analytics()).toBe(true);

      consent.save({analytics: false, errorMonitoring: true});
      expect(consent.settingsOpen()).toBe(false);
      expect(consent.analytics()).toBe(false);
    });

    it('keeps the choice when the panel is closed without saving', () => {
      const consent = new ConsentService();
      consent.rejectAll();

      consent.openSettings();
      consent.closeSettings();

      expect(consent.settingsOpen()).toBe(false);
      expect(consent.analytics()).toBe(false);
    });

    it('can be opened before any choice, leaving the banner up', () => {
      const consent = new ConsentService();

      consent.openSettings();

      expect(consent.settingsOpen()).toBe(true);
      expect(consent.hasChoice()).toBe(false);
    });

    it('tells when the choice was saved', () => {
      const consent = new ConsentService();
      expect(consent.savedAt()).toBeNull();

      vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
      consent.acceptAll();

      expect(consent.savedAt()).toBe(1_700_000_000_000);
    });
  });

  describe('when storage is blocked', () => {
    it('still applies the choice for the rest of the visit', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

      const consent = new ConsentService();
      consent.acceptAll();

      expect(consent.analytics()).toBe(true);
      expect(consent.hasChoice()).toBe(true);
    });

    it('treats unreadable storage as no choice yet', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

      const consent = new ConsentService();
      expect(consent.analytics()).toBe(false);
      expect(consent.hasChoice()).toBe(false);
    });
  });
});
