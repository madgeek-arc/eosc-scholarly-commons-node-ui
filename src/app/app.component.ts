import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {SmoothScroll} from './services/smooth-scroll';
import {AuthenticationService} from './services/authentication.service';
import {NavigationService} from './services/navigation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [AuthenticationService, NavigationService],
  standalone: false
})
export class AppComponent implements OnInit {
  isLoginOrRegister = false;

  breadcrumbs: string[] = [];

  cleanView = false;
  dashboardView = false;

  constructor(public router: Router, private auth: AuthenticationService) {
    this.auth.redirect();
  }

  ngOnInit() {
    this.router.events.subscribe((evt: any) => {
      if (evt.url) {
        this.cleanView = evt.url.includes('/changeLogClean');
        this.dashboardView = evt.url.includes('/dashboard');
        this.breadcrumbs = evt.url.split(/\//);
      }
      this.breadcrumbs[0] = 'Home';
      // this.isLoginOrRegister = ["/signUp", "/signIn"].indexOf(evt.url) >= 0;
    });

    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0);
    });
  }

}
