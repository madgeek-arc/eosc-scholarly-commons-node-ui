import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserSessionService } from '../../../services/user-session.service';

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
        <!-- The eight links and the Login button need about 1330px next to the logo, so the menu becomes a drawer below
             1340px (the switch is in the LESS file: UIkit's @l is 1200px). -->
        <nav class="sc-top-menu__desktop uk-flex uk-flex-middle uk-flex-wrap uk-margin-auto-left sc-top-menu__nav" aria-label="Main">
          @for (link of links; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="sc-top-menu__link--active"
               [routerLinkActiveOptions]="{ exact: false }" class="sc-top-menu__link">
              {{ link.label }}
            </a>
          }
        </nav>
        <!-- While the user-info call is pending neither branch renders, so "Login" does not flash for a signed-in user. -->
        <div class="sc-top-menu__desktop uk-flex-none sc-top-menu__account">
          @if (session.user(); as user) {
            <!-- Below 1450px only the icon shows (see the LESS file), so the name is also the button's label and tooltip. -->
            <button type="button" class="uk-button uk-button-text sc-top-menu__account-trigger"
                    [attr.aria-label]="session.displayName()" [attr.title]="session.displayName()">
              <span uk-icon="icon: user"></span>
              <span class="uk-text-truncate sc-top-menu__account-name">{{ session.displayName() }}</span>
            </button>
            <div uk-dropdown="mode: click; pos: bottom-right">
              <ul class="uk-nav uk-dropdown-nav">
                <li class="uk-nav-header">{{ session.displayName() }}</li>
                @if (user.email) {
                  <li class="uk-text-meta uk-margin-small-bottom">{{ user.email }}</li>
                }
                <li class="uk-nav-divider"></li>
                <li><a [href]="session.logoutUrl">Logout</a></li>
              </ul>
            </div>
          } @else if (!session.isLoading()) {
            <button type="button" class="uk-button uk-button-small sc-top-menu__login" (click)="session.login()">Login</button>
          }
        </div>

        <button type="button" class="uk-icon-button sc-top-menu__mobile sc-top-menu__toggle" uk-icon="icon: menu; ratio: 1.2"
                uk-toggle="target: #sc-menu-offcanvas" aria-label="Open menu">
        </button>
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
          <nav aria-label="Account">
            <ul class="uk-nav uk-nav-default">
              <li class="uk-nav-divider"></li>
              @if (session.user(); as user) {
                <li class="uk-nav-header">{{ session.displayName() }}</li>
                @if (user.email) {
                  <li class="uk-text-meta uk-margin-small-left">{{ user.email }}</li>
                }
                <li><a [href]="session.logoutUrl">Logout</a></li>
              } @else if (!session.isLoading()) {
                <li><button type="button" class="uk-button uk-button-small sc-top-menu__login" (click)="session.login()">Login</button></li>
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
  protected readonly session = inject(UserSessionService);

  // Paths of the iframe pages live in pages/scholarly-commons/iframe-page/iframe-pages.routes.ts
  protected readonly links = [
    {label: 'About', path: '/about'},
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
