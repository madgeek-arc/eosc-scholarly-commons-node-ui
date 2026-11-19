import {ChangeDetectionStrategy, Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Title} from '@angular/platform-browser';
import {Router, provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {IframePageComponent} from './iframe-page.component';
import {JOOMLA_SITE_ORIGIN} from './joomla-path';
import {SITE_NAME} from '../../../services/page-meta.service';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

const JOIN = '/?option=com_content&view=article&id=32';
const NEWS = '/?option=com_content&view=article&id=27';
const ARTICLE = '/?option=com_content&view=article&id=43';
const ARTICLE_DEEP_LINK = `/news-page?path=${encodeURIComponent(`${ARTICLE}&Itemid=195`)}#intro`;
const OWN = window.location.origin;

describe('IframePageComponent', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const frame = () => (harness.routeNativeElement as HTMLElement).querySelector('iframe');
  const doc = () => frame()!.contentDocument!;
  const link = (selector: string) => doc().querySelector<HTMLAnchorElement>(selector)!;

  const open = async (url: string) => {
    await harness.navigateByUrl(url, IframePageComponent);
    harness.detectChanges();
    await harness.fixture.whenStable();
    // Only now: the harness itself navigates through router.navigateByUrl.
    navigateByUrl.mockClear().mockResolvedValue(true);
  };

  // Puts a page in the frame, the way the Joomla page would arrive, and runs the component's load handler.
  const load = (html: string, title = '') => {
    // The base lets root-relative links resolve against the app, as they do in the real, proxied page.
    doc().open();
    doc().write(`<!doctype html><html><head><base href="${OWN}/"><title>${title}</title></head><body>${html}</body></html>`);
    doc().close();
    frame()!.dispatchEvent(new Event('load'));
  };

  // Clicks a link of the framed page and reports whether the component took the click over.
  const click = (selector: string, init: MouseEventInit = {}) => {
    let prevented = false;
    doc().addEventListener('click', (event) => {
      prevented = event.defaultPrevented;
      // jsdom cannot follow links; this keeps it from trying once the component has had its say.
      event.preventDefault();
    }, {once: true});
    link(selector).dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, button: 0, ...init}));
    return prevented;
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {path: 'join', component: IframePageComponent, data: {joomlaPath: JOIN, title: 'Join'}},
          {path: 'news-page', component: IframePageComponent, data: {joomlaPath: NEWS, title: 'News', itemId: 195, openJoomlaPagesInPlace: true}},
          {path: 'no-page', component: IframePageComponent},
          {path: 'discover', component: BlankComponent},
          {path: 'how-to-start', component: BlankComponent},
          {path: 'news', component: BlankComponent},
          {path: ':resourceType/:id', component: BlankComponent},
        ]),
      ],
    });
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    navigateByUrl = vi.spyOn(router, 'navigateByUrl');
  });

  describe('the frame', () => {
    it('shows the page of the route through the proxy, in chrome-free form, with a title', async () => {
      await open('/join');

      expect(frame()?.getAttribute('src')).toBe('/pages/?option=com_content&view=article&id=32&tmpl=yootheme');
      expect(frame()?.getAttribute('title')).toBe('Join');
    });

    it('shows a page asked for with ?path= instead, and the anchor of the route fragment', async () => {
      await open('/join?path=/how-to-start.html#esc-researcher');

      expect(frame()?.getAttribute('src')).toBe('/pages/how-to-start.html?tmpl=yootheme#esc-researcher');
    });

    it.each([
      ['another site', '//evil.example/x'],
      ['the proxy itself', '/pages/secret'],
      ['a full URL', 'https://evil.example'],
    ])('ignores a ?path= that points at %s, and shows the page of the route', async (_label, path) => {
      await open(`/join?path=${encodeURIComponent(path)}`);

      expect(frame()?.getAttribute('src')).toBe('/pages/?option=com_content&view=article&id=32&tmpl=yootheme');
    });

    it('ignores an anchor that is not a plain name', async () => {
      await open(`/join#${encodeURIComponent('x" onload="alert(1)')}`);

      expect(frame()?.getAttribute('src')).toBe('/pages/?option=com_content&view=article&id=32&tmpl=yootheme');
    });

    it('shows the page of a News ?path= deep link, as its links create it', async () => {
      await open(ARTICLE_DEEP_LINK);

      expect(frame()?.getAttribute('src')).toBe('/pages/?option=com_content&view=article&id=43&Itemid=195&tmpl=yootheme#intro');
    });

    describe('title', () => {
      it('takes the title of a ?path= page once it has loaded, for the frame and the browser tab', async () => {
        await open(ARTICLE_DEEP_LINK);
        load('<p>article</p>', ' Node Kick-off ');
        harness.detectChanges();

        expect(frame()?.getAttribute('title')).toBe('Node Kick-off');
        expect(TestBed.inject(Title).getTitle()).toBe(`Node Kick-off | ${SITE_NAME}`);
      });

      it("keeps the route's title for the route's own page", async () => {
        await open('/join');
        const tabTitle = TestBed.inject(Title).getTitle();
        load('<p>join</p>', 'Join us on Joomla');
        harness.detectChanges();

        expect(frame()?.getAttribute('title')).toBe('Join');
        expect(TestBed.inject(Title).getTitle()).toBe(tabTitle);
      });

      it("keeps the route's title when the ?path= page has none", async () => {
        await open(ARTICLE_DEEP_LINK);
        load('<p>article</p>');
        harness.detectChanges();

        expect(frame()?.getAttribute('title')).toBe('News');
      });
    });

    it('shows no frame when the route has no page', async () => {
      await open('/no-page');
      expect(frame()).toBeNull();
    });
  });

  describe('when the page has loaded', () => {
    beforeEach(() => open('/join'));

    it('gives links back into the app the address of the app', () => {
      load(`
        <a id="alias" href="/how-to-start.html#esc-researcher">alias</a>
        <a id="host" href="${JOOMLA_SITE_ORIGIN}//?option=com_content&view=article&id=26#cases">host</a>
        <a id="app" href="/discover">app</a>
        <a id="sub" href="/discover/service/abc?x=1">sub</a>
      `);

      expect(link('#alias').getAttribute('href')).toBe('/how-to-start#esc-researcher');
      expect(link('#host').getAttribute('href')).toBe('/use-cases#cases');
      expect(link('#app').getAttribute('href')).toBe('/discover');
      expect(link('#sub').getAttribute('href')).toBe('/discover/service/abc?x=1');
    });

    it('leaves other links as they are', () => {
      load(`
        <a id="out" href="https://example.org/page">out</a>
        <a id="mail" href="mailto:help@example.org">mail</a>
        <a id="anchor" href="#top">anchor</a>
        <a id="joomla" href="/about-us">joomla</a>
        <a id="tab" href="/how-to-start.html" target="_blank">tab</a>
      `);

      expect(link('#out').getAttribute('href')).toBe('https://example.org/page');
      expect(link('#mail').getAttribute('href')).toBe('mailto:help@example.org');
      expect(link('#anchor').getAttribute('href')).toBe('#top');
      expect(link('#joomla').getAttribute('href')).toBe('/about-us');
      expect(link('#tab').getAttribute('href')).toBe('/how-to-start.html');
    });

    describe('clicking a link', () => {
      it.each([
        ['a menu page by alias', '/how-to-start.html#esc-researcher', '/how-to-start#esc-researcher'],
        ['a menu page by article id', '/?option=com_content&view=article&id=27', '/news'],
        ['a menu page on the Joomla host', `${JOOMLA_SITE_ORIGIN}//?option=com_content&view=article&id=27`, '/news'],
        ['a route of the app', '/discover', '/discover'],
        ['a deeper path of the app', '/discover/service/abc?x=1#top', '/discover/service/abc?x=1'],
      ])('on %s moves the app there instead of the frame', (_label, href, expected) => {
        load(`<a id="l" href="${href}">go</a>`);

        expect(click('#l')).toBe(true);
        expect(navigateByUrl).toHaveBeenCalledTimes(1);
        expect(navigateByUrl.mock.calls[0][0]).toMatch(new RegExp(`^${expected.replace(/[?.]/g, '\\$&')}`));
      });

      it('on another site opens a new tab without letting that site see this one', () => {
        load('<a id="l" href="https://example.org/page">out</a>');

        expect(click('#l')).toBe(false);
        expect(link('#l').target).toBe('_blank');
        expect(link('#l').rel).toBe('noopener');
        expect(navigateByUrl).not.toHaveBeenCalled();
      });

      it('on a file opens a new tab, even when the file is on this site', () => {
        load(`<a id="l" href="${OWN}/files/guide.pdf">pdf</a>`);

        expect(click('#l')).toBe(false);
        expect(link('#l').target).toBe('_blank');
        expect(navigateByUrl).not.toHaveBeenCalled();
      });

      it('on another page of the Joomla site opens the real site in a new tab, without the chrome-free parameter', () => {
        load('<a id="l" href="/about-us?tmpl=yootheme&page=2#team">joomla</a>');

        expect(click('#l')).toBe(false);
        expect(link('#l').href).toBe(`${JOOMLA_SITE_ORIGIN}/about-us?page=2#team`);
        expect(link('#l').target).toBe('_blank');
        expect(link('#l').rel).toBe('noopener');
        expect(navigateByUrl).not.toHaveBeenCalled();
      });

      it('into the proxy itself goes nowhere', () => {
        load('<a id="l" href="/pages/secret">proxy</a>');

        expect(click('#l')).toBe(true);
        expect(navigateByUrl).not.toHaveBeenCalled();
      });

      it.each([
        ['Ctrl', {ctrlKey: true}],
        ['Cmd', {metaKey: true}],
        ['Shift', {shiftKey: true}],
        ['Alt', {altKey: true}],
        ['the middle button', {button: 1}],
      ])('with %s is left to the browser', (_label, init) => {
        load('<a id="l" href="/how-to-start.html">go</a>');

        expect(click('#l', init)).toBe(false);
        expect(navigateByUrl).not.toHaveBeenCalled();
      });

      it.each([
        ['an anchor on the same page', '#top'],
        ['an e-mail address', 'mailto:help@example.org'],
        ['a phone number', 'tel:+3012345'],
      ])('on %s is left to the browser', (_label, href) => {
        load(`<a id="l" href="${href}">go</a>`);

        expect(click('#l')).toBe(false);
        expect(link('#l').target).toBe('');
        expect(navigateByUrl).not.toHaveBeenCalled();
      });

      it('that already has its own target is left to the page', () => {
        load('<a id="l" href="https://example.org" target="_top">top</a>');

        expect(click('#l')).toBe(false);
        expect(link('#l').target).toBe('_top');
      });

      it('on something inside the link counts as a click on the link', () => {
        load('<a id="l" href="/how-to-start.html"><span id="inner">go</span></a>');

        const event = new MouseEvent('click', {bubbles: true, cancelable: true, button: 0});
        link('#inner').dispatchEvent(event);

        expect(navigateByUrl).toHaveBeenCalledTimes(1);
      });

      it('that the page already handled is left alone', () => {
        load('<a id="l" href="/how-to-start.html">go</a>');
        doc().addEventListener('click', (event) => event.preventDefault(), true);
        // Registered after the component's own listener, so the component sees the click first; it must still
        // only act once per click.
        click('#l');

        expect(navigateByUrl).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('on a page that opens other Joomla pages in place (News)', () => {
    beforeEach(() => open('/news-page'));

    it('gives a link to another Joomla page a ?path= deep link of the current route, with its menu item and without the chrome-free parameter', () => {
      load(`<a id="l" href="${JOOMLA_SITE_ORIGIN}/?option=com_content&view=article&id=43&tmpl=yootheme#intro">article</a>`);

      expect(link('#l').getAttribute('href')).toBe(ARTICLE_DEEP_LINK);
    });

    it('keeps the menu item a link already has', () => {
      load(`<a id="l" href="${ARTICLE}&Itemid=200">article</a>`);

      expect(link('#l').getAttribute('href')).toBe(`/news-page?path=${encodeURIComponent(`${ARTICLE}&Itemid=200`)}`);
    });

    it('loads that page in the frame on click, through the app URL', () => {
      load(`<a id="l" href="${ARTICLE}&tmpl=yootheme#intro">article</a>`);

      expect(click('#l')).toBe(true);
      expect(navigateByUrl).toHaveBeenCalledWith(ARTICLE_DEEP_LINK);
    });

    it.each([
      ['a login page', '/?option=com_users&view=login'],
      ['a category list', '/?option=com_content&view=category&id=8'],
      ['a SEF page', '/some-page.html'],
    ])('still opens %s, which is no article, on the real site in a new tab', (_label, path) => {
      load(`<a id="l" href="${path}">page</a>`);

      expect(click('#l')).toBe(false);
      expect(link('#l').href).toBe(`${JOOMLA_SITE_ORIGIN}${path}`);
      expect(link('#l').target).toBe('_blank');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('still sends menu pages to their route and other sites to a new tab', () => {
      load(`
        <a id="menu" href="/?option=com_content&view=article&id=32">join</a>
        <a id="out" href="https://example.org/page">out</a>
      `);

      expect(link('#menu').getAttribute('href')).toBe('/join');
      expect(click('#out')).toBe(false);
      expect(link('#out').target).toBe('_blank');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
