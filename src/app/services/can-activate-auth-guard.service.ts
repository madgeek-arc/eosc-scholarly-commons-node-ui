import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import {AuthenticationService} from './authentication.service';
import {NavigationService} from './navigation.service';
import {getCookie} from '../entities/utils';

@Injectable()
export class CanActivateViaAuthGuard  {
  constructor(public authenticationService: AuthenticationService, public router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const ret = this.authenticationService.isLoggedIn();
    // if (getCookie(this.authenticationService.cookieName) !== null) {
    //   this.authenticationService.tryLogin();
    // } else if (!ret) {
    //   this.authenticationService.login();
    // }
    // console.log(ret);
    if (ret)
      return true;
    else
      this.fail();
  }

  fail(): boolean {
    // this.router.navigate(['/']).then();
    this.authenticationService.tryLogin();
    return false;
  }

}
