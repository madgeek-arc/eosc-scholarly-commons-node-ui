import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {getCookie} from '../entities/utils';
import {environment} from '../../environments/environment';
import {BehaviorSubject} from 'rxjs';


@Injectable()
export class AuthenticationService {

  base = environment.API_ENDPOINT;
  cookieName = 'AccessToken';
  userLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    this.isLoggedIn();
  }

  tryLogin(manual?: boolean) {
    const cookie = getCookie(this.cookieName);
    if (cookie === null || cookie === (this.cookieName + '=') || !this.userLoggedIn) {
      console.debug('Didn\'t find cookie, user is not logged in.' );
      sessionStorage.setItem('redirectUrl', window.location.pathname);
      this.login();
    } else {
      console.debug('found cookie, user is logged in');
      window.location.reload();
    }
  }

  login() {
    window.location.href = this.base + environment.AAI_LOGIN;
  }

  logout() {
    sessionStorage.clear();
    window.location.href = `${window.location.origin + this.base}/logout`;
  }

  public isLoggedIn(): boolean {
    this.userLoggedIn.next(getCookie(this.cookieName) !== null);
    return getCookie(this.cookieName) !== null;
  }

  redirect() {
    if (sessionStorage.getItem('redirectUrl') !== null) {
      const url = sessionStorage.getItem('redirectUrl');
      sessionStorage.removeItem('redirectUrl');
      this.router.navigate([url]);
    }
  }

}
