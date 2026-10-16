import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ForbiddenPageComponent } from './shared/forbidden-page/forbidden-page.component';
import { NotFoundPageComponent } from './shared/not-found-page/not-found-page.component';
import { IFRAME_PAGE_ROUTES } from './pages/scholarly-commons/iframe-page/iframe-pages.routes';

// The dynamic form pulls in catalogue-ui, CKEditor and the date picker: keep them out of the main bundle.
// Unused while the form routes are switched off; kept so they can be re-enabled with `loadComponent: loadFormsComponent`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loadFormsComponent = () => import('./pages/forms/forms.component').then(m => m.FormsComponent);

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  // home, how-to-start, use-cases, news, training, terms-and-policies: Joomla pages in an iframe
  ...IFRAME_PAGE_ROUTES,
  // {
  //   path: 'form',
  //   loadComponent: loadFormsComponent,
  //   // canActivate: [authGuard],
  //   data: {
  //     breadcrumb: 'forms'
  //   }
  // },

  // {
  //   path: 'admin',
  //   loadChildren: () => import('../app/pages/admin-dashboard/admin.module').then(m => m.AdminModule),
  //   canActivate: [authGuard]
  // },

  {
    path: 'discover',
    title: 'Discover services',
    loadComponent: () => import('./pages/scholarly-commons/search/search.component').then(m => m.ScSearchComponent),
    data: {
      breadcrumb: 'Discover'
    }
  },
  {
    path: 'discover/service/:id',
    // Replaced by the service name once it has loaded (see ScServiceDetailComponent).
    title: 'Service',
    loadComponent: () => import('./pages/scholarly-commons/service-detail/service-detail.component').then(m => m.ScServiceDetailComponent),
    data: {
      breadcrumb: 'Service'
    }
  },
  {
    path: 'forbidden',
    title: 'Forbidden',
    component: ForbiddenPageComponent,
    data: {
      breadcrumb: 'Forbidden',
      noindex: true
    }
  },
  {
    path: 'notFound',
    title: 'Page not found',
    component: NotFoundPageComponent,
    data: {
      breadcrumb: 'Not Found',
      noindex: true
    }
  },
  {
    path: '**',
    redirectTo: 'notFound',
    pathMatch: 'full',
    data: {
      breadcrumb: 'Not Found'
    }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(appRoutes,
      {
    // scrollPositionRestoration: 'enabled',
    scrollPositionRestoration: 'disabled',
    onSameUrlNavigation: 'reload'
})
  ],
  declarations: [],
  exports: [RouterModule]
})

export class AppRoutingModule {
}
