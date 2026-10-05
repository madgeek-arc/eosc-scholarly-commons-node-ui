import {ChangeDetectionStrategy, Component, ElementRef, NgZone, computed, effect, inject, viewChild} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {appRouteSegments, isAppPath, routeForJoomlaPath} from './iframe-pages.config';
import {JOOMLA_SITE_ORIGIN, joomlaFrameSrc, joomlaSiteUrl, toJoomlaFragment, toJoomlaPath} from './joomla-path';

/** Downloads rather than pages: always opened in a new tab. */
const FILE_LINK = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|png|jpe?g|gif|svg|webp)$/i;

/**
 * Embeds a Joomla page (route data `joomlaPath`) in a same-origin iframe served through the
 * `/pages` proxy. Because the iframe is same-origin, clicks on its links are handled here, with
 * nothing to install on the Joomla side. What a link does depends on what it points at:
 *  - one of the menu pages, or one of the app's own routes: the app navigates there;
 *  - any other page of the Joomla site, other websites and files: a new tab.
 * A `?path=` query parameter is still accepted as a deep link into the iframe, and the anchor of a
 * menu page goes into the route fragment, so deep links and the browser back button keep working.
 */
@Component({
  selector: 'app-sc-iframe-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (initialSrc) {
      <iframe
        #frame
        class="uk-display-block uk-width-1-1"
        uk-height-viewport="offset-top: true"
        [title]="title"
        [src]="initialSrc"
        (load)="listenForLinkClicks()"
      ></iframe>
    }
  `,
})
export class IframePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly zone = inject(NgZone);
  private readonly origin = window.location.origin;
  private readonly appSegments = appRouteSegments(this.router.config);

  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');
  private readonly routeData = toSignal(this.route.data, {requireSync: true});
  private readonly requestedPath = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('path'))),
    {requireSync: true}
  );
  private readonly requestedFragment = toSignal(this.route.fragment, {requireSync: true});

  /** Proxied iframe URL: a valid `?path=` wins over the route's configured default. */
  private readonly target = computed(() => {
    const path = toJoomlaPath(this.requestedPath(), this.origin)
      ?? toJoomlaPath(this.routeData()['joomlaPath'], this.origin);
    return path ? joomlaFrameSrc(path, this.origin, toJoomlaFragment(this.requestedFragment())) : null;
  });

  protected readonly title: string = this.routeData()['title'] ?? 'Embedded page';

  // The `src` attribute is bound once. Changing it later would push an entry onto the joint session
  // history (back would then step through the iframe before the Angular URL), so later changes go
  // through location.replace() below instead.
  protected readonly initialSrc = this.target()
    ? this.sanitizer.bypassSecurityTrustResourceUrl(this.target() as string)
    : null;

  private loaded = this.target();

  constructor() {
    effect(() => {
      const target = this.target();
      const frameWindow = this.frame()?.nativeElement.contentWindow;
      if (!target || !frameWindow || target === this.loaded) {
        return;
      }
      this.loaded = target;
      frameWindow.location.replace(target);
    });
  }

  /** Every page loaded in the iframe is a new document, so this runs once per page. */
  protected listenForLinkClicks(): void {
    // Capture phase: runs before the page's own handlers and before the browser follows the link.
    this.frame()?.nativeElement.contentDocument?.addEventListener('click', this.onLinkClick, true);
  }

  private readonly onLinkClick = (event: MouseEvent): void => {
    // Modified and middle clicks are the browser's own business (new tab, download, ...).
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    // The iframe is another realm, so `instanceof Element` would be false: use the members directly.
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || (link.target && link.target !== '_self')) {
      return;
    }
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) {
      return;
    }

    let url: URL;
    try {
      url = new URL(link.href);
    } catch {
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return;
    }

    const ownSite = url.origin === this.origin || url.origin === JOOMLA_SITE_ORIGIN;
    if (!ownSite || FILE_LINK.test(url.pathname)) {
      this.openOutside(link);
      return;
    }

    // Joomla emits links like https://innovation.openaire.eu//?option=... (note the double slash).
    const path = toJoomlaPath(url.pathname.replace(/\/{2,}/g, '/') + url.search, this.origin);
    if (!path) {
      event.preventDefault();
      return;
    }

    // An unusable anchor only loses the scroll position, not the navigation.
    const fragment = toJoomlaFragment(url.hash) ?? undefined;
    const menuRoute = routeForJoomlaPath(path);

    if (menuRoute) {
      event.preventDefault();
      // Handlers of the iframe run outside Angular's zone.
      this.zone.run(() => this.router.navigate(['/', menuRoute], {fragment}));
    } else if (isAppPath(path, this.appSegments)) {
      event.preventDefault();
      this.zone.run(() => this.router.navigateByUrl(path + (fragment ? `#${fragment}` : '')));
    } else {
      // Any other page of the Joomla site: the real, full site in a new tab.
      link.href = joomlaSiteUrl(path, fragment);
      this.openOutside(link);
    }
  };

  /**
   * Lets the browser follow the link in a new tab. Done on the link itself rather than with
   * window.open(), so there is no popup blocker to run into, and middle-click, "copy link" and the
   * status bar keep working on the same link afterwards.
   */
  private openOutside(link: HTMLAnchorElement): void {
    link.target = '_blank';
    link.rel = 'noopener';
  }
}
