import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

// UIkit is loaded as a global script (see "scripts" in angular.json).
declare const UIkit: { offcanvas(selector: string): { hide(): void } };

@Component({
  selector: 'app-sc-top-menu',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="uk-navbar-container sc-top-menu">
      <div class="uk-container uk-container-expand sc-top-menu__bar">
        <a routerLink="/home" class="sc-top-menu__logo-link">
          <img
            ngSrc="assets/images/scholarly-commons-logo.svg"
            alt="EOSC Node Scholarly Commons"
            width="447"
            height="50"
            priority
            class="uk-responsive-width sc-top-menu__logo"
          />
        </a>
        <!-- The seven links need about 1150px next to the logo, so the menu becomes a drawer below @l (1200px). -->
        <nav class="uk-visible@l uk-flex uk-flex-middle uk-flex-wrap sc-top-menu__nav" aria-label="Main">
          @for (link of links; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="sc-top-menu__link--active"
               [routerLinkActiveOptions]="{ exact: false }" class="sc-top-menu__link">
              {{ link.label }}
            </a>
          }
        </nav>
        <button type="button" class="uk-icon-button uk-hidden@l sc-top-menu__toggle" uk-icon="icon: menu; ratio: 1.2"
                uk-toggle="target: #sc-menu-offcanvas" aria-label="Open menu"></button>
      </div>
      <div id="sc-menu-offcanvas" class="sc-top-menu__drawer" uk-offcanvas="overlay: true; flip: true">
        <div class="uk-offcanvas-bar">
          <button type="button" class="uk-offcanvas-close" uk-close aria-label="Close menu"></button>
          <nav aria-label="Main">
            <ul class="uk-nav uk-nav-default">
              @for (link of links; track link.path) {
                <li routerLinkActive="uk-active" [routerLinkActiveOptions]="{ exact: false }">
                  <a [routerLink]="link.path" (click)="closeMenu()">{{ link.label }}</a>
                </li>
              }
            </ul>
          </nav>
        </div>
      </div>
    </header>
  `,
  styleUrl: './top-menu.component.less',
})
export class ScTopMenuComponent {
  // Paths of the iframe pages live in pages/scholarly-commons/iframe-page/iframe-pages.routes.ts
  protected readonly links = [
    {label: 'Services', path: '/discover'},
    {label: 'How to start', path: '/how-to-start'},
    {label: 'Use Cases', path: '/use-cases'},
    {label: 'News', path: '/news'},
    {label: 'Training', path: '/training'},
    {label: 'Terms & Policies', path: '/terms-and-policies'},
    {label: 'Join', path: '/join'},
  ] as const;

  // The router swaps the page without a reload, so the drawer has to be closed by hand once a link is chosen.
  protected closeMenu(): void {
    UIkit.offcanvas('#sc-menu-offcanvas').hide();
  }
}
