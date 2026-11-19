import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { UserInfo } from '../entities/userInfo';
import { UserService } from './user.service';

/** A path inside this app: one leading slash, so it can never point at another site (`//host`, `/\host`). */
export const isAppUrl = (url: string | null): url is string =>
  !!url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');

/**
 * Who is signed in. The answer to `GET /api/user/info` is the only source of truth: a body means signed in, any
 * error (401, a failed redirect, a server or network problem) means signed out. There is no cookie to look at.
 * The call is made once, when the app starts.
 */
@Injectable({providedIn: 'root'})
export class UserSessionService {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly userInfo = rxResource<UserInfo, void>({stream: () => this.userService.getUserInfo()});

  /** True until the user-info call has answered, either way. */
  readonly isLoading = computed(() => {
    const status = this.userInfo.status();
    return status === 'idle' || status === 'loading' || status === 'reloading';
  });

  /** The signed-in user, or null while loading and when signed out. */
  readonly user = computed<UserInfo | null>(() => (this.userInfo.hasValue() ? this.userInfo.value() ?? null : null));
  readonly isSignedIn = computed(() => this.user() !== null);

  /** The name to show for the signed-in user: the full name, else name and surname, else the email address. */
  readonly displayName = computed(() => {
    const user = this.user();
    if (user === null) {
      return '';
    }
    return user.fullname?.trim() || `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.email || '';
  });

  /**
   * Up to two capital letters for the avatar: the first letters of the first and last words of the name, else the
   * first letter of the email address, else nothing (the avatar then falls back to a user icon).
   */
  readonly initials = computed(() => {
    const user = this.user();
    if (user === null) {
      return '';
    }
    const words = (user.fullname?.trim() || `${user.name ?? ''} ${user.surname ?? ''}`).split(/\s+/).filter(Boolean);
    const sources = words.length > 1 ? [words[0], words[words.length - 1]] : words.length ? words : [user.email ?? ''];
    // Spread by code point, so a letter outside the Basic Multilingual Plane is not cut in half.
    return sources.map((word) => [...word][0] ?? '').join('').toLocaleUpperCase();
  });

  /**
   * Leaves for the login page of the API, and asks it to bring the user back to the page they were on: the full
   * address of that page goes in the `redirectUrl` parameter, because only this app knows where in it the user was.
   * The page is always one of this app's own (a path on this site's origin), whatever is passed in.
   */
  login(returnUrl: string = this.router.url): void {
    window.location.href = `${environment.API_ENDPOINT}${environment.AAI_LOGIN}?redirectUrl=${redirectParam(returnUrl)}`;
  }

  /**
   * Where the logout link goes: the logout of the API, asked to bring the user back to the given page in the same
   * `redirectUrl` parameter as {@link login}, with the same rule (a page of this app, else the start page). Logging
   * out is a plain navigation to the API, so it is shown as a link, not a button.
   */
  logoutUrl(returnUrl: string): string {
    return `${environment.API_ENDPOINT}${environment.AAI_LOGOUT}?redirectUrl=${redirectParam(returnUrl)}`;
  }
}

/** The full, encoded address of a page of this app; anything that is not a path in it becomes the start page. */
function redirectParam(returnUrl: string): string {
  return encodeURIComponent(window.location.origin + (isAppUrl(returnUrl) ? returnUrl : '/'));
}
