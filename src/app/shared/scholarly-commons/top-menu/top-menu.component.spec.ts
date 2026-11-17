import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {UserInfo} from '../../../entities/userInfo';
import {authGuard} from '../../../services/auth.guard';
import {UserSessionService} from '../../../services/user-session.service';
import {ScTopMenuComponent} from './top-menu.component';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

const LINKS = [
  ['About', '/about'],
  ['Services', '/discover'],
  ['How to start', '/how-to-start'],
  ['Use Cases', '/use-cases'],
  ['News', '/news'],
  ['Training', '/training'],
  ['Terms & Policies', '/terms-and-policies'],
  ['Join', '/join'],
];

const ADA: UserInfo = {sub: 'u1', name: 'Ada', surname: 'Lovelace', fullname: 'Ada Lovelace', email: 'ada@example.org', roles: ['ADMIN']};

describe('ScTopMenuComponent', () => {
  let fixture: ComponentFixture<ScTopMenuComponent>;
  let root: HTMLElement;
  const hide = vi.fn();
  const offcanvas = vi.fn(() => ({hide}));

  // The page-facing state of UserSessionService, which the menu only reads.
  const user = signal<UserInfo | null>(null);
  const isLoading = signal(false);
  const initials = signal('');
  const session = {
    user,
    isLoading,
    displayName: computed(() => user()?.fullname ?? ''),
    initials,
    isSignedIn: computed(() => user() !== null),
    logoutUrl: (returnUrl: string) => `/api/logout?redirectUrl=${encodeURIComponent(returnUrl)}`,
    login: vi.fn(),
  };

  const inlineLinks = () => [...root.querySelectorAll<HTMLAnchorElement>('nav.sc-top-menu__nav a')];
  const drawerLinks = () => [...root.querySelectorAll<HTMLAnchorElement>('#sc-menu-offcanvas nav[aria-label="Main"] a')];
  const describeLinks = (links: HTMLAnchorElement[]) => links.map((a) => [a.textContent?.trim(), a.getAttribute('href')]);

  const inlineAccount = () => root.querySelector<HTMLElement>('.sc-top-menu__account')!;
  const drawerAccount = () => root.querySelector<HTMLElement>('#sc-menu-offcanvas nav[aria-label="Account"]')!;
  const loginButtons = () => [...root.querySelectorAll<HTMLButtonElement>('button.sc-top-menu__login')];
  const logoutLinks = () => [...root.querySelectorAll<HTMLAnchorElement>('a[href^="/api/logout"]')];
  const logoutReturns = () => logoutLinks().map((a) => new URL(a.href).searchParams.get('redirectUrl'));

  const render = () => {
    fixture.detectChanges();
  };

  beforeEach(() => {
    user.set(null);
    isLoading.set(false);
    initials.set('AL');
    session.login.mockReset();
    // The drawer is controlled by UIkit, which the app loads as a global script.
    vi.stubGlobal('UIkit', {offcanvas});
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: 'private', component: BlankComponent, canActivate: [authGuard]},
          {path: '**', component: BlankComponent},
        ]),
        {provide: UserSessionService, useValue: session},
      ],
    });
    fixture = TestBed.createComponent(ScTopMenuComponent);
    root = fixture.nativeElement;
    render();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    hide.mockClear();
    offcanvas.mockClear();
  });

  it('lists the same eight pages, in order, in the inline menu and in the drawer', () => {
    expect(describeLinks(inlineLinks())).toEqual(LINKS);
    expect(describeLinks(drawerLinks())).toEqual(LINKS);
  });

  it('gives the menu button and the drawer close button a name for screen readers', () => {
    expect(root.querySelector('.sc-top-menu__toggle')?.getAttribute('aria-label')).toBe('Open menu');
    expect(root.querySelector('.uk-offcanvas-close')?.getAttribute('aria-label')).toBe('Close menu');
  });

  it('points the logo link at the home page', () => {
    expect(root.querySelector('a.sc-top-menu__logo-link')?.getAttribute('href')).toBe('/home');
  });

  it('closes the drawer through UIkit when a drawer link is chosen', () => {
    drawerLinks()[0].click();

    expect(offcanvas).toHaveBeenCalledWith('#sc-menu-offcanvas');
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it('does not touch the drawer when an inline link is chosen', () => {
    inlineLinks()[0].click();

    expect(offcanvas).not.toHaveBeenCalled();
  });

  it('marks the link of the current page as active in both menus', async () => {
    await TestBed.inject(Router).navigateByUrl('/news');
    await fixture.whenStable();

    const activeInline = inlineLinks().filter((a) => a.classList.contains('sc-top-menu__link--active'));
    expect(activeInline.map((a) => a.textContent?.trim())).toEqual(['News']);

    const activeDrawer = [...root.querySelectorAll('#sc-menu-offcanvas li.uk-active a')];
    expect(activeDrawer.map((a) => a.textContent?.trim())).toEqual(['News']);
  });

  describe('account', () => {
    it('shows neither Login nor a user menu while the user-info call is pending', () => {
      isLoading.set(true);
      render();

      expect(loginButtons()).toEqual([]);
      expect(logoutLinks()).toEqual([]);
      expect(inlineAccount().textContent?.trim()).toBe('');
    });

    it('offers Login to a visitor who is not signed in, in the menu and in the drawer', () => {
      expect(loginButtons().map((button) => button.textContent?.trim())).toEqual(['Login', 'Login']);
      expect(inlineAccount().querySelector('button.sc-top-menu__login')).not.toBeNull();
      expect(drawerAccount().querySelector('button.sc-top-menu__login')).not.toBeNull();
      expect(logoutLinks()).toEqual([]);
    });

    it('starts the login when either Login button is chosen', () => {
      loginButtons()[0].click();
      loginButtons()[1].click();

      expect(session.login).toHaveBeenCalledTimes(2);
      expect(session.login).toHaveBeenNthCalledWith(1);
      expect(session.login).toHaveBeenNthCalledWith(2);
    });

    it('shows the name, the email address and a Logout link to a signed-in user, and no Login', () => {
      user.set(ADA);
      render();

      expect(loginButtons()).toEqual([]);

      const trigger = inlineAccount().querySelector('.sc-top-menu__account-trigger');
      // The button shows only the avatar, so the name is its label and tooltip.
      expect(trigger?.textContent?.trim()).toBe('AL');
      expect(trigger?.getAttribute('aria-label')).toBe('Ada Lovelace');
      expect(trigger?.getAttribute('title')).toBe('Ada Lovelace');
      const dropdown = inlineAccount().querySelector('[uk-dropdown]');
      expect(dropdown?.querySelector('.sc-top-menu__avatar')?.textContent?.trim()).toBe('AL');
      expect(dropdown?.querySelector('.sc-top-menu__account-name')?.textContent?.trim()).toBe('Ada Lovelace');
      expect(dropdown?.querySelector('.sc-top-menu__account-email')?.textContent?.trim()).toBe('ada@example.org');
      expect(dropdown?.querySelector('a')?.textContent?.trim()).toBe('Logout');

      expect(drawerAccount().textContent).toContain('Ada Lovelace');
      expect(drawerAccount().textContent).toContain('ada@example.org');
      expect(drawerAccount().querySelector('a')?.textContent?.trim()).toBe('Logout');
    });

    it('shows the initials in a circle, hidden from screen readers since the button carries the name', () => {
      user.set(ADA);
      render();

      const avatar = inlineAccount().querySelector('.sc-top-menu__avatar');
      expect(avatar?.textContent?.trim()).toBe('AL');
      expect(avatar?.getAttribute('aria-hidden')).toBe('true');
      expect(inlineAccount().querySelector('[uk-icon="icon: user"]')).toBeNull();
    });

    it('falls back to the user icon when there are no initials', () => {
      user.set({...ADA, fullname: '', name: '', surname: '', email: ''});
      initials.set('');
      render();

      expect(inlineAccount().querySelector('.sc-top-menu__avatar')).toBeNull();
      expect(inlineAccount().querySelector('[uk-icon="icon: user"]')).not.toBeNull();
    });

    it('links Logout to the logout address of the API, in the menu and in the drawer', () => {
      user.set(ADA);
      render();

      expect(logoutLinks()).toHaveLength(2);
    });

    it('brings the user back to the page they are on after Logout', async () => {
      user.set(ADA);
      await TestBed.inject(Router).navigateByUrl('/news?page=2');
      render();

      expect(logoutReturns()).toEqual(['/news?page=2', '/news?page=2']);
    });

    it('sends the user home after Logout from a page that needs a login', async () => {
      user.set(ADA);
      await TestBed.inject(Router).navigateByUrl('/private');
      render();

      expect(logoutReturns()).toEqual(['/home', '/home']);
    });

    it('leaves out the email line for a user without an email address', () => {
      user.set({...ADA, email: ''});
      render();

      expect(inlineAccount().querySelector('.sc-top-menu__account-email')).toBeNull();
      expect(inlineAccount().querySelector('.sc-top-menu__account-name')?.textContent?.trim()).toBe('Ada Lovelace');
      expect(logoutLinks()).toHaveLength(2);
    });

    it('does not mix the account links into the list of pages', () => {
      user.set(ADA);
      render();

      expect(describeLinks(inlineLinks())).toEqual(LINKS);
      expect(describeLinks(drawerLinks())).toEqual(LINKS);
    });

    it('switches back to Login when the user signs out', () => {
      user.set(ADA);
      render();
      user.set(null);
      render();

      expect(loginButtons()).toHaveLength(2);
      expect(logoutLinks()).toEqual([]);
    });
  });
});
