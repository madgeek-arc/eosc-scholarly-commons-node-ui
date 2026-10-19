import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ScTopMenuComponent} from './top-menu.component';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

const LINKS = [
  ['Services', '/discover'],
  ['How to start', '/how-to-start'],
  ['Use Cases', '/use-cases'],
  ['News', '/news'],
  ['Training', '/training'],
  ['Terms & Policies', '/terms-and-policies'],
  ['Join', '/join'],
];

describe('ScTopMenuComponent', () => {
  let fixture: ComponentFixture<ScTopMenuComponent>;
  let root: HTMLElement;
  const hide = vi.fn();
  const offcanvas = vi.fn(() => ({hide}));

  const inlineLinks = () => [...root.querySelectorAll<HTMLAnchorElement>('nav.sc-top-menu__nav a')];
  const drawerLinks = () => [...root.querySelectorAll<HTMLAnchorElement>('#sc-menu-offcanvas nav a')];
  const describeLinks = (links: HTMLAnchorElement[]) => links.map((a) => [a.textContent?.trim(), a.getAttribute('href')]);

  beforeEach(() => {
    // The drawer is controlled by UIkit, which the app loads as a global script.
    vi.stubGlobal('UIkit', {offcanvas});
    TestBed.configureTestingModule({providers: [provideRouter([{path: '**', component: BlankComponent}])]});
    fixture = TestBed.createComponent(ScTopMenuComponent);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    hide.mockClear();
    offcanvas.mockClear();
  });

  it('lists the same seven pages, in order, in the inline menu and in the drawer', () => {
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
});
