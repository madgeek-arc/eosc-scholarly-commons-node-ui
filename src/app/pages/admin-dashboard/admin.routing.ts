import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {authGuard} from '../../services/auth.guard';
import {AdminDashboardComponent} from './admin-dashboard.component';
import {AllProvidersDashboardComponent} from './providers/all-providers.component';
import {AllServicesDashboardComponent} from './services/all-services.component';
import {AllDatasourcesDashboardComponent} from './datasources/all-datasources.component';

const adminRoutes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'providers',
        pathMatch: 'full'
      },
      {
        path: 'providers',
        component: AllProvidersDashboardComponent,
        canActivate: [authGuard],
        data: {
          dashboardMode: true
        },
      },
      {
        path: 'services',
        component: AllServicesDashboardComponent,
        canActivate: [authGuard],
        data: {
          dashboardMode: true
        },
      },
      {
        path: 'datasources',
        component: AllDatasourcesDashboardComponent,
        canActivate: [authGuard],
        data: {
          dashboardMode: true
        },
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(adminRoutes)],
  exports: [RouterModule]
})

export class AdminRouting {
}
