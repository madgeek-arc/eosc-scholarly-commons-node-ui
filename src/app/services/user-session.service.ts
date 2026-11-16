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

  /** Where the logout link goes. Logging out is a plain navigation to the API, so it is shown as a link, not a button. */
  readonly logoutUrl = environment.API_ENDPOINT + environment.AAI_LOGOUT;

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
   * Leaves for the login page of the API, and asks it to bring the user back to the page they were on: the full
   * address of that page goes in the `redirectUrl` parameter, because only this app knows where in it the user was.
   * The page is always one of this app's own (a path on this site's origin), whatever is passed in.
   */
  login(returnUrl: string = this.router.url): void {
    const page = window.location.origin + (isAppUrl(returnUrl) ? returnUrl : '/');
    window.location.href = `${environment.API_ENDPOINT}${environment.AAI_LOGIN}?redirectUrl=${encodeURIComponent(page)}`;
  }
}
