import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ScConsentBannerComponent} from './consent-banner.component';
import {ConsentService} from './consent.service';

describe('ScConsentBannerComponent', () => {
  let fixture: ComponentFixture<ScConsentBannerComponent>;
  let root: HTMLElement;
  let consent: ConsentService;

  const show = vi.fn();
  const hide = vi.fn();
  const offcanvas = vi.fn(() => ({show, hide}));

  const banner = () => root.querySelector<HTMLElement>('.sc-consent');
  const toggle = () => root.querySelector<HTMLButtonElement>('.sc-consent-toggle');
  const panel = () => root.querySelector<HTMLElement>('#sc-consent-panel')!;
  const button = (scope: HTMLElement, label: string) =>
    [...scope.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === label)!;
  const box = (title: string) =>
    [...panel().querySelectorAll<HTMLLabelElement>('label')]
      .find((label) => label.textContent?.trim() === title)!
      .querySelector<HTMLInputElement>('input')!;

  const create = () => {
    fixture = TestBed.createComponent(ScConsentBannerComponent);
    root = fixture.nativeElement;
    consent = TestBed.inject(ConsentService);
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    // The panel is a UIkit offcanvas, and the app loads UIkit as a global script.
    vi.stubGlobal('UIkit', {offcanvas});
    TestBed.configureTestingModule({providers: [provideRouter([])]});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('the banner', () => {
    it('shows before any choice, with the cookie policy link', () => {
      create();

      expect(banner()).not.toBeNull();
      expect(banner()!.querySelector('a')!.getAttribute('href')).toBe('/cookie-policy');
    });

    it('goes away once all are accepted', () => {
      create();

      button(banner()!, 'Accept all').click();
      fixture.detectChanges();

      expect(banner()).toBeNull();
      expect(consent.analytics()).toBe(true);
      expect(consent.errorMonitoring()).toBe(true);
    });

    it('goes away once all are rejected', () => {
      create();

      button(banner()!, 'Reject all').click();
      fixture.detectChanges();

      expect(banner()).toBeNull();
      expect(consent.hasChoice()).toBe(true);
      expect(consent.analytics()).toBe(false);
    });

    it('is not shown when a choice is stored', () => {
      TestBed.inject(ConsentService).rejectAll();
      create();

      expect(banner()).toBeNull();
    });

    it('takes the place of the cookie button until the visitor has chosen', () => {
      create();

      expect(toggle()).toBeNull();
    });

    it('opens the settings panel', () => {
      create();

      button(banner()!, 'Settings').click();
      fixture.detectChanges();

      expect(offcanvas).toHaveBeenCalledWith(panel());
      expect(show).toHaveBeenCalled();
    });
  });

  describe('the cookie button', () => {
    beforeEach(() => {
      TestBed.inject(ConsentService).rejectAll();
      create();
    });

    it('shows once a choice is stored', () => {
      expect(toggle()).not.toBeNull();
      expect(toggle()!.getAttribute('aria-label')).toBe('Cookie settings');
      expect(toggle()!.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the settings panel', () => {
      toggle()!.click();
      fixture.detectChanges();

      expect(consent.settingsOpen()).toBe(true);
      expect(show).toHaveBeenCalled();
      expect(toggle()!.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('the settings panel', () => {
    beforeEach(() => {
      TestBed.inject(ConsentService).save({analytics: true, errorMonitoring: false});
      create();
      consent.openSettings();
      fixture.detectChanges();
    });

    it('shows the stored choice, with the necessary cookies always on', () => {
      expect(box('Strictly necessary').checked).toBe(true);
      expect(box('Strictly necessary').disabled).toBe(true);
      expect(box('Statistics').checked).toBe(true);
      expect(box('Error reports').checked).toBe(false);
    });

    it('saves the boxes only with "Save settings", and closes', () => {
      box('Statistics').click();
      box('Error reports').click();
      expect(consent.analytics()).toBe(true);

      panel().classList.add('uk-open');
      button(panel(), 'Save settings').click();
      fixture.detectChanges();

      expect(consent.analytics()).toBe(false);
      expect(consent.errorMonitoring()).toBe(true);
      expect(consent.settingsOpen()).toBe(false);
      expect(hide).toHaveBeenCalled();
    });

    it('lists the cookies of each category', () => {
      const names = [...panel().querySelectorAll('td')].map((td) => td.textContent?.trim());

      expect(names).toEqual(expect.arrayContaining(['SESSION', 'sc-consent', '_pk_id.*', 'sentryReplaySession']));
    });

    it('shows when the consent was saved', () => {
      expect(panel().textContent).toContain('Consent saved on');
    });

    it('tells the service when UIkit closes it', () => {
      panel().dispatchEvent(new Event('hidden'));

      expect(consent.settingsOpen()).toBe(false);
      expect(consent.analytics()).toBe(true);
    });

    it('ignores `hidden` from components inside it', () => {
      panel().querySelector('details')!.dispatchEvent(new Event('hidden', {bubbles: true}));

      expect(consent.settingsOpen()).toBe(true);
    });
  });
});
