import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { UserSessionService } from './user-session.service';

/**
 * Lets signed-in users through; anyone else is sent to the login page and returns to the route they asked for.
 * It waits for the user-info call to answer, so a signed-in user is not sent to log in again on a fresh page load.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const session = inject(UserSessionService);
  return toObservable(session.isLoading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (session.isSignedIn()) {
        return true;
      }
      session.login(state.url);
      return false;
    }),
  );
};

/**
 * Whether the page shown from this route down (the route or any of its primary children) is behind
 * {@link authGuard}. Such a page cannot be shown once the user has logged out, so logging out leaves for home.
 */
export function isBehindLogin(root: ActivatedRouteSnapshot): boolean {
  for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
    const config = route.routeConfig;
    if (config?.canActivate?.includes(authGuard) || config?.canActivateChild?.includes(authGuard)) {
      return true;
    }
  }
  return false;
}
