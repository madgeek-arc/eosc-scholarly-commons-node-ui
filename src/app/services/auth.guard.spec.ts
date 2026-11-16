import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Component, ChangeDetectionStrategy} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {authGuard} from './auth.guard';
import {UserSessionService} from './user-session.service';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

describe('authGuard', () => {
  let router: Router;
  let backend: HttpTestingController;
  let login: ReturnType<typeof vi.spyOn>;

  // Answers the user-info call, then lets the effects that publish the answer run.
  const answer = (respond: (request: ReturnType<HttpTestingController['expectOne']>) => void) => {
    TestBed.tick();
    respond(backend.expectOne('/api/user/info'));
    TestBed.tick();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: 'public', component: BlankComponent},
          {path: 'private', component: BlankComponent, canActivate: [authGuard]},
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    router = TestBed.inject(Router);
    backend = TestBed.inject(HttpTestingController);
    // Leaving for the login page cannot happen in jsdom: only record the call.
    login = vi.spyOn(TestBed.inject(UserSessionService), 'login').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // The session service asks who is signed in as soon as it exists, also in the test of an unguarded page.
    backend.match('/api/user/info').forEach((request) => request.flush(null));
    backend.verify();
  });

  it('lets a signed-in user reach the page', async () => {
    const navigation = router.navigateByUrl('/private');
    answer((request) => request.flush({sub: 'u1', fullname: 'Ada Lovelace'}));

    expect(await navigation).toBe(true);
    expect(router.url).toBe('/private');
    expect(login).not.toHaveBeenCalled();
  });

  it('waits for the user-info call instead of sending a signed-in user to log in again', async () => {
    const navigation = router.navigateByUrl('/private');
    TestBed.tick();
    const request = backend.expectOne('/api/user/info');
    await Promise.resolve();

    expect(login).not.toHaveBeenCalled();
    expect(router.url).not.toBe('/private');

    // Answer so the pending navigation can finish and the test ends cleanly.
    request.flush({sub: 'u1'});
    TestBed.tick();
    expect(await navigation).toBe(true);
  });

  it('keeps anyone else out and sends them to log in, with the page (and its query) to return to', async () => {
    const navigation = router.navigateByUrl('/private?tab=2');
    answer((request) => request.flush('no', {status: 401, statusText: 'Unauthorized'}));

    expect(await navigation).toBe(false);
    expect(router.url).not.toBe('/private?tab=2');
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith('/private?tab=2');
  });

  it('does not ask for a login on a page without the guard', async () => {
    expect(await router.navigateByUrl('/public')).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });
});
