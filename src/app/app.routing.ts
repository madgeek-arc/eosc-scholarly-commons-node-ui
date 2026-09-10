import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from '@angular/common';
import {SearchAireComponent} from './pages/search/search.aire.component';
import {CanActivateViaAuthGuard} from './services/can-activate-auth-guard.service';
import {ForbiddenPageComponent} from './shared/forbidden-page/forbidden-page.component';
import {NotFoundPageComponent} from './shared/not-found-page/not-found-page.component';
import {HomeAireComponent} from './pages/home/home.aire.component';
import {PortfolioItemComponent} from './pages/landingpages/portfolio/portfolio-item.component';
import {UserItemComponent} from './pages/landingpages/user/user-item.component';
import {FormsComponent} from './pages/forms/forms.component';
import {DatasourceSearchComponent} from './pages/search/datasources-search/datasourceSearch.component';
import {Datasource} from './pages/landingpages/datasource/datasource';
import {ProviderJoinComponent} from './pages/provider/join/provider-join.component';
import {JoinComponent} from './pages/public/join.component';
import {AboutComponent} from './pages/public/about.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeAireComponent,
    data: {
      breadcrumb: 'Home'
    }
  },
  {
    path: 'search',
    component: SearchAireComponent,
    data: {
      breadcrumb: 'Search'
    }
  },
  {
    path: 'datasources/search',
    component: DatasourceSearchComponent,
    data: {
      breadcrumb: 'Datasources'
    }
  },
  {
    path: 'provider/:providerId/service/add',
    component: FormsComponent,
    canActivate: [CanActivateViaAuthGuard],
    data: {
      breadcrumb: 'add service'
    }
  },
  {
    path: 'service/edit/:resourceId',
    component: FormsComponent,
    canActivate: [CanActivateViaAuthGuard],
    data: {
      breadcrumb: 'edit service'
    }
  },
  {
    path: ':resourceType/subprofile/add/:resourceId',
    component: FormsComponent,
    canActivate: [CanActivateViaAuthGuard],
    data: {
      breadcrumb: 'add datasource'
    }
  },
  {
    path: ':resourceType/subprofile/edit/:datasourceId',
    component: FormsComponent,
    canActivate: [CanActivateViaAuthGuard],
    data: {
      breadcrumb: 'edit datasource'
    }
  },
  {
    path: 'form',
    component: FormsComponent,
    // canActivate: [CanActivateViaAuthGuard],
    data: {
      breadcrumb: 'forms'
    }
  },
  {
    path: 'portfolios/:id',
    component: PortfolioItemComponent,
    data: {
      breadcrumb: 'portfolio'
    }
  },
  {
    path: 'users/:id',
    component: UserItemComponent,
    data: {
      breadcrumb: 'Users'
    }
  },
  {
    path: 'datasource/:datasourceId',
    component: Datasource,
    data: {
      breadcrumb: 'Datasource'
    }
  },
  {
    path: 'join/:token',
    component: ProviderJoinComponent,
    canActivate: [CanActivateViaAuthGuard],
    data: {
      breadcrumb: 'Join'
    }
  },
  {
    path: 'join',
    component: JoinComponent,
    data: {
      breadcrumb: 'Join'
    }
  },
  {
    path: 'about',
    component: AboutComponent,
    data: {
      breadcrumb: 'About'
    }
  },
  {
    path: 'provider',
    loadChildren: () => import('../app/pages/provider/provider.module').then(m => m.ProviderModule),
    canActivate: [CanActivateViaAuthGuard]
  },

  {
    path: 'service-dashboard',
    loadChildren: () => import('./pages/service-dashboard/service-dashboard.module').then(m => m.ServiceDashboardModule),
    canActivate: [CanActivateViaAuthGuard]
  },

  {
    path: 'service',
    loadChildren: () => import('../app/pages/landingpages/service/service-landing-page.module').then(m => m.ServiceLandingPageModule),
  },

  {
    path: 'admin',
    loadChildren: () => import('../app/pages/admin-dashboard/admin.module').then(m => m.AdminModule),
    canActivate: [CanActivateViaAuthGuard]
  },

  {
    path: 'forbidden',
    component: ForbiddenPageComponent,
    data: {
      breadcrumb: 'Forbidden'
    }
  },
  {
    path: 'notFound',
    component: NotFoundPageComponent,
    data: {
      breadcrumb: 'Not Found'
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
