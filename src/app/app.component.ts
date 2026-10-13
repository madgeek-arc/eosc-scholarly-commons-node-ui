import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {AuthenticationService} from './services/authentication.service';
import {ScTopMenuComponent} from './shared/scholarly-commons/top-menu/top-menu.component';
import {ScFooterComponent} from './shared/scholarly-commons/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RouterOutlet, ScTopMenuComponent, ScFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly auth = inject(AuthenticationService);

  constructor() {
    this.auth.redirect();
  }

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0);
    });
  }

}
