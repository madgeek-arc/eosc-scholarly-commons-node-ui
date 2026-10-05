import {ChangeDetectionStrategy, Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-sc-top-menu',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sc-top-menu">
      <div class="uk-container uk-container-expand sc-top-menu__bar">
        <a routerLink="/discover" class="sc-top-menu__logo-link">
          <img
            ngSrc="assets/images/scholarly-commons-logo.png"
            alt="EOSC Node Scholarly Commons"
            width="250"
            height="50"
            priority
            class="sc-top-menu__logo"
          />
        </a>
        <nav class="uk-flex uk-flex-middle uk-flex-wrap sc-top-menu__nav">
          <a class="sc-top-menu__link"><span class="sc-top-menu__link sc-top-menu__link--static">Home</span></a>
          <a><span class="sc-top-menu__link sc-top-menu__link--static">How to start</span></a>
          <a
            routerLink="/discover"
            routerLinkActive="sc-top-menu__link--active"
            [routerLinkActiveOptions]="{ exact: false }"
            class="sc-top-menu__link"
          >Services</a>
          <a><span class="sc-top-menu__link sc-top-menu__link--static">Use Cases</span></a>
          <a><span class="sc-top-menu__link sc-top-menu__link--static">News</span></a>
          <a><span class="sc-top-menu__link sc-top-menu__link--static">Training</span></a>
          <a><span class="sc-top-menu__link sc-top-menu__link--static">Terms &amp; Policies</span></a>
          <a routerLink="/join" class="sc-top-menu__join">Join</a>
        </nav>
      </div>
    </header>
  `,
  styleUrl: './top-menu.component.less',
})
export class ScTopMenuComponent {
}
