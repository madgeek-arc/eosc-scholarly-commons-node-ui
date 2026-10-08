import {inject} from '@angular/core';
import {CanActivateFn} from '@angular/router';
import {AuthenticationService} from './authentication.service';

/** Lets signed-in users through; anyone else is sent to the login page and returns to the route they asked for. */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthenticationService);
  if (auth.isLoggedIn()) {
    return true;
  }
  auth.login(state.url);
  return false;
};
