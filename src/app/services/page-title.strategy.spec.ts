import {ChangeDetectionStrategy, Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Meta, Title} from '@angular/platform-browser';
import {Router, Routes, TitleStrategy, provideRouter} from '@angular/router';
import {beforeEach, describe, expect, it} from 'vitest';
import {SITE_NAME} from './page-meta.service';
import {PageTitleStrategy} from './page-title.strategy';

@Component({template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class BlankComponent {}

const routes: Routes = [
  {path: 'alpha', title: 'Alpha', component: BlankComponent},
  {path: 'untitled', component: BlankComponent},
  {path: 'hidden', title: 'Hidden', data: {noindex: true}, component: BlankComponent},
  {path: 'section', title: 'Section', children: [{path: 'page', title: 'Inner page', component: BlankComponent}]},
];

describe('PageTitleStrategy', () => {
  let router: Router;
  let meta: Meta;

  beforeEach(() => {
    document.head.querySelectorAll('meta').forEach((tag) => tag.remove());
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), {provide: TitleStrategy, useExisting: PageTitleStrategy}],
    });
    router = TestBed.inject(Router);
    meta = TestBed.inject(Meta);
  });

  it('sets the title of the route after a navigation', async () => {
    await router.navigateByUrl('/alpha');
    expect(TestBed.inject(Title).getTitle()).toBe(`Alpha | ${SITE_NAME}`);
  });

  it('uses the bare site name for a route without a title', async () => {
    await router.navigateByUrl('/untitled');
    expect(TestBed.inject(Title).getTitle()).toBe(SITE_NAME);
  });

  it('uses the title of the deepest route', async () => {
    await router.navigateByUrl('/section/page');
    expect(TestBed.inject(Title).getTitle()).toBe(`Inner page | ${SITE_NAME}`);
  });

  it('adds noindex for a route marked with data.noindex, and drops it again on the next page', async () => {
    await router.navigateByUrl('/hidden');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex');

    await router.navigateByUrl('/alpha');
    expect(meta.getTag('name="robots"')).toBeNull();
  });

  it('resets the description to the site default on every navigation', async () => {
    meta.updateTag({name: 'description', content: 'left over from another page'});
    await router.navigateByUrl('/alpha');
    expect(meta.getTag('name="description"')?.content).not.toBe('left over from another page');
  });
});
