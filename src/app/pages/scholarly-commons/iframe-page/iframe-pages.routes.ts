import {Routes} from '@angular/router';
import {IFRAME_PAGES, joomlaPathFor} from './iframe-pages.config';

export const IFRAME_PAGE_ROUTES: Routes = IFRAME_PAGES.map(page => ({
  path: page.path,
  loadComponent: () => import('./iframe-page.component').then(m => m.IframePageComponent),
  data: {joomlaPath: joomlaPathFor(page), title: page.title, breadcrumb: page.title},
}));
