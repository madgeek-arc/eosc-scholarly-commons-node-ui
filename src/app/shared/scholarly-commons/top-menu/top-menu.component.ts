import {ChangeDetectionStrategy, Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-sc-top-menu',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="uk-navbar-container sc-top-menu">
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
          @for (link of links; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="sc-top-menu__link--active"
              [routerLinkActiveOptions]="{ exact: false }"
              class="sc-top-menu__link"
            >{{ link.label }}</a>
          }
          <a routerLink="/join" routerLinkActive="sc-top-menu__link--active" [routerLinkActiveOptions]="{ exact: false }"
             class="sc-top-menu__link">Join</a>
<!--          <a routerLink="/join" class="sc-top-menu__join">Login</a>-->
        </nav>
      </div>
    </header>
  `,
  styleUrl: './top-menu.component.less',
})
export class ScTopMenuComponent {
  // Paths of the iframe pages live in pages/scholarly-commons/iframe-page/iframe-pages.routes.ts
  protected readonly links = [
    {label: 'Home', path: '/home'},
    {label: 'How to start', path: '/how-to-start'},
    {label: 'Services', path: '/discover'},
    {label: 'Use Cases', path: '/use-cases'},
    {label: 'News', path: '/news'},
    {label: 'Training', path: '/training'},
    {label: 'Terms & Policies', path: '/terms-and-policies'},
  ] as const;
}
