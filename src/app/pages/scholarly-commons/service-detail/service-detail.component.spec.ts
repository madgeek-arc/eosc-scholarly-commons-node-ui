import {ChangeDetectionStrategy, Component} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {Title} from '@angular/platform-browser';
import {Router, provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {Observable, Subject, of, throwError} from 'rxjs';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Service} from '../../../entities/eic-model';
import {ResourceService} from '../../../services/resource.service';
import {SITE_NAME} from '../../../services/page-meta.service';
import {ORDER_REQUIRED} from '../service-display';
import {ScServiceDetailComponent} from './service-detail.component';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

const resource = (fields: Record<string, unknown>) => fields as unknown as Service;

const VOCABULARIES = {
  resourceProviders: [{id: 'owner-1', name: 'Acme Research'}],
  Language: [{id: 'en', name: 'English'}],
  Portfolios: [{id: 'p-1', name: 'Publish'}],
};

const DETAIL = resource({
  id: '21.T1/svc-1',
  name: 'Data Safe Vault',
  tagline: 'Keeps data safe',
  resourceOwner: 'owner-1',
  languageAvailabilities: ['en'],
  orderType: ORDER_REQUIRED,
  trl: 'trl-7',
  webpage: 'https://example.org',
  privacyPolicy: 'javascript:alert(1)',
  extras: {pitch: '<p>The pitch.</p>', portfolios: ['p-1']},
});

describe('ScServiceDetailComponent', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  const getServiceByPid = vi.fn<(pid: string) => Observable<Service>>();
  const getUiVocabularies = vi.fn<() => Observable<unknown>>();

  const root = () => harness.routeNativeElement as HTMLElement;
  const text = (selector: string) => root().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const open = async (url: string) => {
    await harness.navigateByUrl(url, ScServiceDetailComponent);
    await settle();
  };

  beforeEach(async () => {
    getServiceByPid.mockReset().mockReturnValue(of(DETAIL));
    getUiVocabularies.mockReset().mockReturnValue(of(VOCABULARIES));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: 'discover/service/:prefix/:suffix', component: ScServiceDetailComponent},
          {path: 'notFound', component: BlankComponent},
        ]),
        {provide: ResourceService, useValue: {getServiceByPid, getUiVocabularies}},
      ],
    });
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  it('loads the service of the URL and shows it, with ids resolved through the vocabularies', async () => {
    await open('/discover/service/21.T1/svc-1');

    expect(getServiceByPid).toHaveBeenCalledWith('21.T1/svc-1');
    expect(text('h1')).toBe('Data Safe Vault');
    expect(text('.sc-hero__tagline')).toBe('Keeps data safe');
    expect(text('.sc-hero__description')).toBe('The pitch.');
    expect(text('.sc-hero__pills')).toContain('TRL 7');
    expect(text('.sc-provider__name')).toBe('Acme Research');
    expect(text('.sc-detail__breadcrumb')).toContain('Publish');
  });

  it('lists the facts that have a value in "At a glance", and leaves out the empty ones', async () => {
    await open('/discover/service/21.T1/svc-1');

    const facts = [...root().querySelectorAll('.sc-facts__row')].map((row) => [
      row.querySelector('.sc-facts__label')?.textContent?.trim(),
      row.querySelector('.sc-facts__value')?.textContent?.trim(),
    ]);
    expect(facts).toEqual([
      ['Provider', 'Acme Research'],
      ['Categories', 'Publish'],
      ['Maturity', 'TRL 7'],
      ['Languages', 'English'],
    ]);
  });

  it('links only to web addresses', async () => {
    await open('/discover/service/21.T1/svc-1');

    const hrefs = [...root().querySelectorAll('a[target="_blank"]')].map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('https://example.org');
    expect(hrefs.some((href) => href?.startsWith('javascript:'))).toBe(false);
    expect(root().querySelector('.sc-terms-links')).toBeNull();
    expect([...root().querySelectorAll('a[target="_blank"]')].every((link) => link.getAttribute('rel')?.includes('noopener'))).toBe(true);
  });

  it('shows a spinner until the service has loaded', async () => {
    getServiceByPid.mockReturnValue(new Subject<Service>());
    await open('/discover/service/21.T1/svc-1');

    expect(root().querySelector('[role="status"]')).not.toBeNull();
    expect(root().querySelector('h1')).toBeNull();
  });

  it('names the page after the service once it has loaded', async () => {
    await open('/discover/service/21.T1/svc-1');

    expect(TestBed.inject(Title).getTitle()).toBe(`Data Safe Vault | ${SITE_NAME}`);
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Keeps data safe');
  });

  describe('related services', () => {
    const related = (pid: string) => resource({id: pid, name: `Service ${pid}`, tagline: `About ${pid}`});
    // The service itself comes back for its own PID; every other PID is a related service.
    const serve = (relatedResources: string[], fail: string[] = []) =>
      getServiceByPid.mockImplementation((pid) =>
        fail.includes(pid)
          ? throwError(() => new HttpErrorResponse({status: 404}))
          : of(pid === DETAIL.id ? resource({...DETAIL, relatedResources}) : related(pid)),
      );

    it('shows up to three, each looked up by its PID, without the service itself, blanks or ids that are not PIDs', async () => {
      serve(['21.T1/svc-1', '21.T1/r1', '', 'legacy.id', '21.T1/r2', '21.T1/r3', '21.T1/r4']);
      await open('/discover/service/21.T1/svc-1');

      expect(getServiceByPid.mock.calls.map(([pid]) => pid)).toEqual(['21.T1/svc-1', '21.T1/r1', '21.T1/r2', '21.T1/r3']);
      const names = [...root().querySelectorAll('.sc-related__name')].map((name) => name.textContent?.trim());
      expect(names).toEqual(['Service 21.T1/r1', 'Service 21.T1/r2', 'Service 21.T1/r3']);
      expect(root().querySelector('.sc-related')?.getAttribute('href')).toBe('/discover/service/21.T1/r1');
    });

    it('makes no request when there are none to load', async () => {
      await open('/discover/service/21.T1/svc-1');

      expect(getServiceByPid).toHaveBeenCalledTimes(1);
      expect(root().querySelector('.sc-related')).toBeNull();
    });

    it('does not ask for related ids that cannot be PIDs', async () => {
      serve(['openaire.explore', 'openaire.provide']);
      await open('/discover/service/21.T1/svc-1');

      expect(getServiceByPid).toHaveBeenCalledTimes(1);
      expect(root().querySelector('.sc-related')).toBeNull();
    });

    it('leaves out a related service that cannot be loaded and shows the others', async () => {
      serve(['21.T1/r1', '21.T1/r2'], ['21.T1/r1']);
      await open('/discover/service/21.T1/svc-1');

      expect(text('h1')).toBe('Data Safe Vault');
      const names = [...root().querySelectorAll('.sc-related__name')].map((name) => name.textContent?.trim());
      expect(names).toEqual(['Service 21.T1/r2']);
    });

    it('shows the service without them when none can be loaded', async () => {
      serve(['21.T1/r1'], ['21.T1/r1']);
      await open('/discover/service/21.T1/svc-1');

      expect(text('h1')).toBe('Data Safe Vault');
      expect(root().querySelector('.sc-related')).toBeNull();
    });
  });

  describe('when something fails', () => {
    it('falls back to the ids when the vocabularies cannot be loaded, except for the provider', async () => {
      getUiVocabularies.mockReturnValue(throwError(new Error('down')));
      await open('/discover/service/21.T1/svc-1');

      expect(text('h1')).toBe('Data Safe Vault');
      expect(text('.sc-detail__breadcrumb')).toContain('p-1');
      // The owner is a PID; without its name there is no provider to show, and the PID itself is not.
      expect(root().querySelector('.sc-provider__name')).toBeNull();
    });

    it('offers a way back when the service cannot be loaded', async () => {
      getServiceByPid.mockReturnValue(throwError(new HttpErrorResponse({status: 500})));
      await open('/discover/service/21.T1/svc-1');

      expect(text('h1')).toBe("We couldn't load this service");
      expect(root().querySelector('a[href="/discover"]')).not.toBeNull();
      expect(router.url).toBe('/discover/service/21.T1/svc-1');
    });

    it('also offers a way back when the connection itself fails', async () => {
      getServiceByPid.mockReturnValue(throwError(new HttpErrorResponse({status: 0})));
      await open('/discover/service/21.T1/svc-1');

      expect(text('h1')).toBe("We couldn't load this service");
    });

    it('leaves for the not-found page, replacing the history entry, when the service does not exist', async () => {
      getServiceByPid.mockReturnValue(throwError(new HttpErrorResponse({status: 404})));
      const navigate = vi.spyOn(router, 'navigate');
      await open('/discover/service/21.T1/nope');

      expect(navigate).toHaveBeenCalledWith(['/notFound'], {replaceUrl: true});
      expect(router.url).toBe('/notFound');
    });
  });

  describe('moving from one service to another', () => {
    it('loads the new service, and loads the vocabularies only once', async () => {
      getServiceByPid.mockImplementation((pid) => of(resource({...DETAIL, id: pid, name: `Service ${pid}`})));
      await open('/discover/service/21.T1/a');
      expect(text('h1')).toBe('Service 21.T1/a');

      await open('/discover/service/21.T1/b');
      expect(text('h1')).toBe('Service 21.T1/b');
      expect(getServiceByPid).toHaveBeenCalledTimes(2);
      expect(getUiVocabularies).toHaveBeenCalledTimes(1);
    });
  });
});
