import {Injectable, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {getCookie} from '../entities/utils';
import {environment} from '../../environments/environment';

const REDIRECT_KEY = 'redirectUrl';

/** A path inside this app: one leading slash, so it can never point at another site (`//host`, `/\host`). */
export const isAppUrl = (url: string | null): url is string =>
  !!url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');

@Injectable({providedIn: 'root'})
export class AuthenticationService {
  private readonly router = inject(Router);

  base = environment.API_ENDPOINT;
  cookieName = 'AccessToken';
  readonly loggedIn = signal(this.hasToken());

  /** Whether the login cookie is present. This is a client-side hint only: the API still decides what a user may do. */
  isLoggedIn(): boolean {
    const loggedIn = this.hasToken();
    this.loggedIn.set(loggedIn);
    return loggedIn;
  }

  /** Remembers where to come back to, then leaves for the login page. */
  login(returnUrl: string = this.router.url): void {
    sessionStorage.setItem(REDIRECT_KEY, returnUrl);
    window.location.href = this.base + environment.AAI_LOGIN;
  }

  logout(): void {
    sessionStorage.clear();
    window.location.href = `${window.location.origin + this.base}/logout`;
  }

  /** After coming back from the login page, returns to the route the user originally asked for. */
  redirect(): void {
    const url = sessionStorage.getItem(REDIRECT_KEY);
    if (url === null) {
      return;
    }
    sessionStorage.removeItem(REDIRECT_KEY);
    if (isAppUrl(url)) {
      void this.router.navigateByUrl(url);
    }
  }

  private hasToken(): boolean {
    const token = getCookie(this.cookieName);
    return token !== null && token !== '';
  }
}
