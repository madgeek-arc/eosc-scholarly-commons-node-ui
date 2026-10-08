import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {authGuard} from '../../services/auth.guard';
import {ServiceHistoryComponent} from './service-history.component';
import {ServiceFullHistoryComponent} from './service-full-history.component';
import {ServiceDashboardComponent} from './service-dashboard.component';
import {environment} from '../../../environments/environment';

const resourceDashboardRoutes: Routes = [
  {
    path: ':providerId/:resourceId',
    component: ServiceDashboardComponent,
    canActivate: [authGuard],
    data: {
      breadcrumb: environment.serviceORresource + ' dashboard'
      // breadcrumb: 'My Service Providers',
      // link: '/provider/my'
    },
    children : [
      {
        path: '',
        redirectTo: 'history',
        pathMatch: 'full',
        // data: {
        //   breadcrumb: 'Provider Dashboard'
        // }
      },
      {
        path: 'history',
        component: ServiceHistoryComponent,
        data: {
          dashboardMode: true
        },
      },
      {
        path: 'fullHistory',
        component: ServiceFullHistoryComponent,
        data: {
          dashboardMode: true
        },
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(resourceDashboardRoutes)],
  exports: [RouterModule]
})

export class ServiceDashboardRouting {
}
