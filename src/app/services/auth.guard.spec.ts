import {Component, ChangeDetectionStrategy} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {authGuard} from './auth.guard';
import {AuthenticationService} from './authentication.service';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

describe('authGuard', () => {
  const auth = {isLoggedIn: vi.fn<() => boolean>(), login: vi.fn()};
  let router: Router;

  beforeEach(() => {
    auth.isLoggedIn.mockReset();
    auth.login.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: 'public', component: BlankComponent},
          {path: 'private', component: BlankComponent, canActivate: [authGuard]},
        ]),
        {provide: AuthenticationService, useValue: auth},
      ],
    });
    router = TestBed.inject(Router);
  });

  it('lets a signed-in user reach the page', async () => {
    auth.isLoggedIn.mockReturnValue(true);

    expect(await router.navigateByUrl('/private')).toBe(true);
    expect(router.url).toBe('/private');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('keeps anyone else out and sends them to log in, with the page (and its query) to return to', async () => {
    auth.isLoggedIn.mockReturnValue(false);

    expect(await router.navigateByUrl('/private?tab=2')).toBe(false);
    expect(router.url).not.toBe('/private?tab=2');
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledWith('/private?tab=2');
  });

  it('does not ask for a login on a page without the guard', async () => {
    auth.isLoggedIn.mockReturnValue(false);

    expect(await router.navigateByUrl('/public')).toBe(true);
    expect(auth.login).not.toHaveBeenCalled();
  });
});
